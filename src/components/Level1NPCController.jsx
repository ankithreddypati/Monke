import React, { useRef, useState, useEffect } from "react";
import { RigidBody, CapsuleCollider } from "@react-three/rapier";
import { useFrame } from "@react-three/fiber";
import { Vector3 } from "three";
import { Html } from "@react-three/drei";
import { Level1Character } from "./Level1Character";
import { useKeyboardControls } from "@react-three/drei";
import { websocketService } from "../services/webSocketService";
import { audioRecorderService } from "../services/audioRecorderService";
import { audioManager } from "../services/AudioManager";
import { lexService } from '../services/lexService';



export function Level1NPCController({
  playerRef,
  noticeRange = 8,
  talkRange = 3,
  walkSpeed = 2,
  idleAnimation = "breathingidle",
  walkAnimation = "walking",
  talkAnimation = "talking",
  user,
  gameId,
  gameState,
  ...props
}) {
  const npcRigidBody = useRef(null);
  const container = useRef();
  const [currentAnimation, setCurrentAnimation] = useState(idleAnimation);
  const [isInTalkRange, setIsInTalkRange] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isTalking, setIsTalking] = useState(false);
  const lastDistance = useRef(null);
  const [, get] = useKeyboardControls();

  const handleWSMessage = async (event) => {
    try {
      const message = JSON.parse(event.data);
      
      if (message.type === 'npc_response' && message.audio) {
        // Only set talking state after we confirm we have audio to play
        const binaryData = atob(message.audio);
        const arrayBuffer = new ArrayBuffer(binaryData.length);
        const uint8Array = new Uint8Array(arrayBuffer);
        for (let i = 0; i < binaryData.length; i++) {
          uint8Array[i] = binaryData.charCodeAt(i);
        }
        const audioBlob = new Blob([arrayBuffer], { type: 'audio/mp3' });
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        
        try {
          // Start talking animation only when we're about to play audio
          setIsTalking(true);
          setCurrentAnimation(talkAnimation);
          
          await audio.play();
          
          // Wait for audio to finish
          await new Promise(resolve => {
            audio.onended = resolve;
          });
        } catch (error) {
          console.error('Error playing audio:', error);
        } finally {
          URL.revokeObjectURL(audioUrl);
          setIsTalking(false);
          setCurrentAnimation(idleAnimation);
        }
      }
    } catch (error) {
      console.error('Error handling WebSocket message:', error);
      setIsTalking(false);
      setCurrentAnimation(idleAnimation);
    }
  };

  
  const handleStartTalking = async () => {
    if (!user?.username) {
      console.error('Missing user data:', { user });
      return;
    }
  
    setIsListening(true);
    setCurrentAnimation(talkAnimation);
    
    const started = await audioRecorderService.startRecording(async (audioData) => {
      try {
        const response = await lexService.sendAudio(audioData, user.username);
        
        if (response.audioStream) {
          setIsTalking(true);
          
          try {
            await audioManager.playDynamicAudio(response.audioStream, {
              volume: 1,
              onEnd: () => {
                setIsTalking(false);
                setCurrentAnimation(idleAnimation);
              }
            });
          } catch (error) {
            console.error('Failed to play audio response:', error);
            setIsTalking(false);
            setCurrentAnimation(idleAnimation);
          }
        }
      } catch (error) {
        console.error('Error processing audio:', error);
        handleStopTalking();
      }
    });
    
    if (!started) {
      setIsListening(false);
      setCurrentAnimation(idleAnimation);
    }
  };

  const handleStopTalking = () => {
    audioRecorderService.stopRecording();
    setIsListening(false);
    setCurrentAnimation(idleAnimation);
  };

  useEffect(() => {
    let wsMessageHandler;

    if (websocketService.ws) {
      wsMessageHandler = handleWSMessage;
      websocketService.ws.addEventListener('message', wsMessageHandler);
    }

    return () => {
      if (websocketService.ws && wsMessageHandler) {
        websocketService.ws.removeEventListener('message', wsMessageHandler);
      }
      setIsListening(false);
      setIsTalking(false);
      audioRecorderService.stopRecording();
      audioManager.cleanupDynamicAudio(); 
    };
  }, [user, gameId]);

  useFrame(() => {
    if (!npcRigidBody.current || !playerRef?.current) {
      return;
    }

    const npcPosition = new Vector3().fromArray(Object.values(npcRigidBody.current.translation()));
    const playerPosition = new Vector3().fromArray(Object.values(playerRef.current.translation()));
    const distance = npcPosition.distanceTo(playerPosition);
    
    if (Math.abs((lastDistance.current || 0) - distance) > 0.1) {
      lastDistance.current = distance;
    }

    const inTalkRange = distance < talkRange;
    const inNoticeRange = distance < noticeRange;

    if (inTalkRange !== isInTalkRange) {
      setIsInTalkRange(inTalkRange);
    }

    const shouldShowPrompt = inTalkRange && !isListening && !isTalking;
    if (shouldShowPrompt !== showPrompt) {
      setShowPrompt(shouldShowPrompt);
    }

    // Handle talk key press/release
    const isTalkKeyPressed = get().talk;
    if (inTalkRange && isTalkKeyPressed && !isListening && !isTalking) {
      handleStartTalking();
    } else if (isListening && !isTalkKeyPressed) {
      handleStopTalking();
    }

    // NPC behavior and animations
    if (isListening || isTalking) {
      // Face the player while talking
      npcRigidBody.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
      const direction = new Vector3().subVectors(playerPosition, npcPosition).normalize();
      const angle = Math.atan2(direction.x, direction.z);
      container.current.rotation.y = angle;
      setCurrentAnimation(talkAnimation);
    } else if (inTalkRange) {
      // Stand still and face player when in talk range
      setCurrentAnimation(idleAnimation);
      npcRigidBody.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
      const direction = new Vector3().subVectors(playerPosition, npcPosition).normalize();
      const angle = Math.atan2(direction.x, direction.z);
      container.current.rotation.y = angle;
    } else {
      // Just stand idle when out of range
      setCurrentAnimation(idleAnimation);
      npcRigidBody.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
    }
  });

  return (
    <RigidBody ref={npcRigidBody} colliders={false} lockRotations {...props}>
      <group ref={container}>
        <Level1Character scale={270} position-y={-2} animation={currentAnimation} />
        <CapsuleCollider args={[1, 1]} position={[0, 0, 0]} />
        
        {showPrompt && (
          <Html
            center
            position={[0, 2, 0]}
            style={{
              transform: 'scale(1)',
              pointerEvents: 'none'
            }}
          >
            <div style={{ 
              background: 'rgba(0, 0, 0, 0.8)', 
              color: 'white', 
              padding: '8px 16px',
              borderRadius: '4px',
              fontFamily: 'Arial',
              fontSize: '14px',
              textAlign: 'center',
              whiteSpace: 'nowrap',
              userSelect: 'none'
            }}>
              Press T to talk
            </div>
          </Html>
        )}
        
        {isListening && (
          <Html
            center
            position={[0, 2, 0]}
            style={{
              transform: 'scale(1)',
              pointerEvents: 'none'
            }}
          >
            <div style={{ 
              background: 'rgba(220, 0, 0, 0.8)', 
              color: 'white', 
              padding: '8px 16px',
              borderRadius: '4px',
              fontFamily: 'Arial',
              fontSize: '14px',
              textAlign: 'center',
              whiteSpace: 'nowrap',
              userSelect: 'none'
            }}>
              Listening...
            </div>
          </Html>
        )}

        {isTalking && (
          <Html
            center
            position={[0, 2, 0]}
            style={{
              transform: 'scale(1)',
              pointerEvents: 'none'
            }}
          >
            <div style={{ 
              background: 'rgba(0, 100, 200, 0.8)', 
              color: 'white', 
              padding: '8px 16px',
              borderRadius: '4px',
              fontFamily: 'Arial',
              fontSize: '14px',
              textAlign: 'center',
              whiteSpace: 'nowrap',
              userSelect: 'none'
            }}>
              Speaking...
            </div>
          </Html>
        )}
      </group>
    </RigidBody>
  );
}