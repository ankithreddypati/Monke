// // NPCController.jsx
// import React, { useRef, useState, useEffect } from "react";
// import { RigidBody, CapsuleCollider } from "@react-three/rapier";
// import { useFrame } from "@react-three/fiber";
// import { Vector3 } from "three";
// import { Html } from "@react-three/drei";
// import { Level1Character } from "./Level1Character";
// // Import your additional character models here if they're different
// import { useKeyboardControls } from "@react-three/drei";
// import { websocketService } from "../services/webSocketService";
// import { audioRecorderService } from "../services/audioRecorderService";
// import { audioManager } from "../services/AudioManager";
// import { LexRuntimeV2Client, RecognizeUtteranceCommand } from "@aws-sdk/client-lex-runtime-v2";

// export function NPCController({
//   playerRef,
//   noticeRange = 8,
//   talkRange = 3,
//   walkSpeed = 2,
//   defaultAnimation = "orcidle",
//   walkAnimation = "walk",
//   talkAnimation = "talking",
//   user,
//   gameId,
//   gameState,
//   botId,  // New prop for Lex bot ID
//   botAliasId, // New prop for Lex bot alias ID
//   ...props
// }) {
//   const npcRigidBody = useRef(null);
//   const container = useRef();
//   const [currentAnimation, setCurrentAnimation] = useState(defaultAnimation);
//   const [isInTalkRange, setIsInTalkRange] = useState(false);
//   const [isListening, setIsListening] = useState(false);
//   const [showPrompt, setShowPrompt] = useState(false);
//   const [isTalking, setIsTalking] = useState(false);
//   const lastDistance = useRef(null);
//   const [, get] = useKeyboardControls();

//   const handleWSMessage = async (event) => {
//     try {
//       const message = JSON.parse(event.data);
      
//       if (message.type === 'npc_response' && message.audio) {
//         // Only set talking state after we confirm we have audio to play
//         const binaryData = atob(message.audio);
//         const arrayBuffer = new ArrayBuffer(binaryData.length);
//         const uint8Array = new Uint8Array(arrayBuffer);
//         for (let i = 0; i < binaryData.length; i++) {
//           uint8Array[i] = binaryData.charCodeAt(i);
//         }
//         const audioBlob = new Blob([arrayBuffer], { type: 'audio/mp3' });
//         const audioUrl = URL.createObjectURL(audioBlob);
//         const audio = new Audio(audioUrl);
        
//         try {
//           // Start talking animation only when we're about to play audio
//           setIsTalking(true);
//           setCurrentAnimation(talkAnimation);
          
//           await audio.play();
          
//           // Wait for audio to finish
//           await new Promise(resolve => {
//             audio.onended = resolve;
//           });
//         } catch (error) {
//           console.error('Error playing audio:', error);
//         } finally {
//           URL.revokeObjectURL(audioUrl);
//           setIsTalking(false);
//           setCurrentAnimation(defaultAnimation);
//         }
//       }
//     } catch (error) {
//       console.error('Error handling WebSocket message:', error);
//       setIsTalking(false);
//       setCurrentAnimation(defaultAnimation);
//     }
//   };

//   // Create a Lex client for this specific NPC
//   const lexClient = new LexRuntimeV2Client({
//     region: import.meta.env.VITE_AWS_REGION,
//     credentials: {
//       accessKeyId: import.meta.env.VITE_AWS_ACCESS_KEY_ID,
//       secretAccessKey: import.meta.env.VITE_AWS_SECRET_ACCESS_KEY
//     }
//   });

//   const sendAudioToLex = async (audioData, sessionId) => {
//     try {
//       const input = {
//         botId: botId,
//         botAliasId: botAliasId,
//         localeId: "en_US",
//         sessionId: sessionId,
//         requestContentType: "audio/x-l16; sample-rate=16000; channel-count=1",
//         inputStream: audioData
//       };

//       const command = new RecognizeUtteranceCommand(input);
//       return await lexClient.send(command);
//     } catch (error) {
//       console.error('Error sending audio to Lex:', error);
//       throw error;
//     }
//   };

//   const handleStartTalking = async () => {
//     if (!user?.username) {
//       console.error('Missing user data:', { user });
//       return;
//     }
  
//     setIsListening(true);
//     setCurrentAnimation(talkAnimation);
    
//     const started = await audioRecorderService.startRecording(async (audioData) => {
//       try {
//         const response = await sendAudioToLex(audioData, user.username);
        
//         if (response.audioStream) {
//           setIsTalking(true);
          
//           try {
//             await audioManager.playDynamicAudio(response.audioStream, {
//               volume: 1,
//               onEnd: () => {
//                 setIsTalking(false);
//                 setCurrentAnimation(defaultAnimation);
//               }
//             });
//           } catch (error) {
//             console.error('Failed to play audio response:', error);
//             setIsTalking(false);
//             setCurrentAnimation(defaultAnimation);
//           }
//         }
//       } catch (error) {
//         console.error('Error processing audio:', error);
//         handleStopTalking();
//       }
//     });
    
//     if (!started) {
//       setIsListening(false);
//       setCurrentAnimation(defaultAnimation);
//     }
//   };

//   const handleStopTalking = () => {
//     audioRecorderService.stopRecording();
//     setIsListening(false);
//     setCurrentAnimation(defaultAnimation);
//   };

//   useEffect(() => {
//     let wsMessageHandler;

//     if (websocketService.ws) {
//       wsMessageHandler = handleWSMessage;
//       websocketService.ws.addEventListener('message', wsMessageHandler);
//     }

//     return () => {
//       if (websocketService.ws && wsMessageHandler) {
//         websocketService.ws.removeEventListener('message', wsMessageHandler);
//       }
//       setIsListening(false);
//       setIsTalking(false);
//       audioRecorderService.stopRecording();
//       audioManager.cleanupDynamicAudio(); 
//     };
//   }, [user, gameId]);

//   useFrame(() => {
//     if (!npcRigidBody.current || !playerRef?.current) {
//       return;
//     }

//     const npcPosition = new Vector3().fromArray(Object.values(npcRigidBody.current.translation()));
//     const playerPosition = new Vector3().fromArray(Object.values(playerRef.current.translation()));
//     const distance = npcPosition.distanceTo(playerPosition);
    
//     if (Math.abs((lastDistance.current || 0) - distance) > 0.1) {
//       lastDistance.current = distance;
//     }

//     const inTalkRange = distance < talkRange;
//     const inNoticeRange = distance < noticeRange;

//     if (inTalkRange !== isInTalkRange) {
//       setIsInTalkRange(inTalkRange);
//     }

//     const shouldShowPrompt = inTalkRange && !isListening && !isTalking;
//     if (shouldShowPrompt !== showPrompt) {
//       setShowPrompt(shouldShowPrompt);
//     }

//     // Handle talk key press/release
//     const isTalkKeyPressed = get().talk;
//     if (inTalkRange && isTalkKeyPressed && !isListening && !isTalking) {
//       handleStartTalking();
//     } else if (isListening && !isTalkKeyPressed) {
//       handleStopTalking();
//     }

//     // NPC behavior and animations
//     if (isListening || isTalking) {
//       // Face the player while talking
//       npcRigidBody.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
//       const direction = new Vector3().subVectors(playerPosition, npcPosition).normalize();
//       const angle = Math.atan2(direction.x, direction.z);
//       container.current.rotation.y = angle;
//       setCurrentAnimation(talkAnimation);
//     } else if (inTalkRange) {
//       // Stand still and face player when in talk range
//       setCurrentAnimation(defaultAnimation);
//       npcRigidBody.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
//       const direction = new Vector3().subVectors(playerPosition, npcPosition).normalize();
//       const angle = Math.atan2(direction.x, direction.z);
//       container.current.rotation.y = angle;
//     } else {
//       // Just stand idle when out of range
//       setCurrentAnimation(defaultAnimation);
//       npcRigidBody.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
//     }
//   });

//   return (
//     <RigidBody ref={npcRigidBody} colliders={false} lockRotations {...props}>
//       <group ref={container}>
//         <Level1Character scale={270} position-y={-2} animation={currentAnimation} />
//         <CapsuleCollider args={[1, 1]} position={[0, 0, 0]} />
        
//         {showPrompt && (
//           <Html
//             center
//             position={[0, 2, 0]}
//             style={{
//               transform: 'scale(1)',
//               pointerEvents: 'none'
//             }}
//           >
//             <div style={{ 
//               background: 'rgba(0, 0, 0, 0.8)', 
//               color: 'white', 
//               padding: '8px 16px',
//               borderRadius: '4px',
//               fontFamily: 'Arial',
//               fontSize: '14px',
//               textAlign: 'center',
//               whiteSpace: 'nowrap',
//               userSelect: 'none'
//             }}>
//               Press T to talk
//             </div>
//           </Html>
//         )}
        
//         {isListening && (
//           <Html
//             center
//             position={[0, 2, 0]}
//             style={{
//               transform: 'scale(1)',
//               pointerEvents: 'none'
//             }}
//           >
//             <div style={{ 
//               background: 'rgba(220, 0, 0, 0.8)', 
//               color: 'white', 
//               padding: '8px 16px',
//               borderRadius: '4px',
//               fontFamily: 'Arial',
//               fontSize: '14px',
//               textAlign: 'center',
//               whiteSpace: 'nowrap',
//               userSelect: 'none'
//             }}>
//               Listening...
//             </div>
//           </Html>
//         )}

//         {isTalking && (
//           <Html
//             center
//             position={[0, 2, 0]}
//             style={{
//               transform: 'scale(1)',
//               pointerEvents: 'none'
//             }}
//           >
//             <div style={{ 
//               background: 'rgba(0, 100, 200, 0.8)', 
//               color: 'white', 
//               padding: '8px 16px',
//               borderRadius: '4px',
//               fontFamily: 'Arial',
//               fontSize: '14px',
//               textAlign: 'center',
//               whiteSpace: 'nowrap',
//               userSelect: 'none'
//             }}>
//               Speaking...
//             </div>
//           </Html>
//         )}
//       </group>
//     </RigidBody>
//   );
// }


import React, { useRef, useState, useEffect } from "react";
import { RigidBody, CapsuleCollider } from "@react-three/rapier";
import { useFrame } from "@react-three/fiber";
import { Vector3 } from "three";
import { Html, useKeyboardControls } from "@react-three/drei";
import { Level1Character } from "./Level1Character";
import { websocketService } from "../services/webSocketService";
import { audioRecorderService } from "../services/audioRecorderService";
import { audioManager } from "../services/AudioManager";
import { LexRuntimeV2Client, RecognizeUtteranceCommand } from "@aws-sdk/client-lex-runtime-v2";

export function NPCController({
  playerRef,
  noticeRange = 8,
  talkRange = 3,
  walkSpeed = 2,
  defaultAnimation = "orcidle",
  walkAnimation = "walk",
  talkAnimation = "talking",
  user,
  gameId,
  gameState,
  botId,  // Lex bot ID
  botAliasId, // Lex bot alias ID
  ...props
}) {
  const npcRigidBody = useRef(null);
  const container = useRef();
  const [currentAnimation, setCurrentAnimation] = useState(defaultAnimation);
  const [isInTalkRange, setIsInTalkRange] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isTalking, setIsTalking] = useState(false);
  const lastDistance = useRef(null);

  // Using drei's keyboard control to detect "talk" key
  const [, get] = useKeyboardControls();

  // ---- WEBSOCKET: Listen for 'npc_response' messages
  const handleWSMessage = async (event) => {
    try {
      const message = JSON.parse(event.data);

      if (message.type === 'npc_response' && message.audio) {
        // Suppose your server's NPC response is still base64 'mp3' data
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
          setIsTalking(true);
          setCurrentAnimation(talkAnimation);

          await audio.play();
          // Wait until playback ends
          await new Promise(resolve => {
            audio.onended = resolve;
          });
        } catch (error) {
          console.error('Error playing audio:', error);
        } finally {
          URL.revokeObjectURL(audioUrl);
          setIsTalking(false);
          setCurrentAnimation(defaultAnimation);
        }
      }
    } catch (error) {
      console.error('Error handling WebSocket message:', error);
      setIsTalking(false);
      setCurrentAnimation(defaultAnimation);
    }
  };

  // ---- LEX CLIENT
  const lexClient = new LexRuntimeV2Client({
    region: import.meta.env.VITE_AWS_REGION,
    credentials: {
      accessKeyId: import.meta.env.VITE_AWS_ACCESS_KEY_ID,
      secretAccessKey: import.meta.env.VITE_AWS_SECRET_ACCESS_KEY
    }
  });

  // Utility to decode base64 => Uint8Array
  function base64ToUint8Array(base64) {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }

  // Actually send PCM data to Lex
  const sendAudioToLex = async (pcmData, sessionId) => {
    try {
      const input = {
        botId,
        botAliasId,
        localeId: "en_US",
        sessionId,
        requestContentType: "audio/x-l16; sample-rate=16000; channel-count=1",
        inputStream: pcmData
      };
      const command = new RecognizeUtteranceCommand(input);
      return await lexClient.send(command);
    } catch (error) {
      console.error('Error sending audio to Lex:', error);
      throw error;
    }
  };

  // ---- Start Recording
  const handleStartTalking = async () => {
    if (!user?.username) {
      console.error('Missing user data:', { user });
      return;
    }

    setIsListening(true);
    setCurrentAnimation(talkAnimation);

    const started = await audioRecorderService.startRecording(async (audioData) => {
      // audioData.data is base64 PCM from local recording
      try {
        const pcmBuffer = base64ToUint8Array(audioData.data); // decode
        const response = await sendAudioToLex(pcmBuffer, user.username);

        // If Lex returned an audioStream, handle it
        if (response.audioStream) {
          setIsTalking(true);

          try {
            // Use AudioManager to play the returned audio (as a stream)
            await audioManager.playDynamicAudio(response.audioStream, {
              volume: 1,
              onEnd: () => {
                setIsTalking(false);
                setCurrentAnimation(defaultAnimation);
              }
            });
          } catch (error) {
            console.error('Failed to play audio response:', error);
            setIsTalking(false);
            setCurrentAnimation(defaultAnimation);
          }
        }
      } catch (error) {
        console.error('Error processing audio:', error);
      } finally {
        // End listening either way
        handleStopTalking();
      }
    });

    if (!started) {
      setIsListening(false);
      setCurrentAnimation(defaultAnimation);
    }
  };

  // ---- Stop Recording
  const handleStopTalking = () => {
    audioRecorderService.stopRecording();
    setIsListening(false);
    setCurrentAnimation(defaultAnimation);
  };

  // ---- WebSocket setup
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
      // Cleanup
      setIsListening(false);
      setIsTalking(false);
      audioRecorderService.stopRecording();
      audioManager.cleanupDynamicAudio();
    };
  }, [user, gameId]);

  // ---- NPC Movement & Ranges
  useFrame(() => {
    if (!npcRigidBody.current || !playerRef?.current) {
      return;
    }

    const npcPosition = new Vector3().fromArray(
      Object.values(npcRigidBody.current.translation())
    );
    const playerPosition = new Vector3().fromArray(
      Object.values(playerRef.current.translation())
    );
    const distance = npcPosition.distanceTo(playerPosition);

    if (Math.abs((lastDistance.current || 0) - distance) > 0.1) {
      lastDistance.current = distance;
    }

    const inTalkRange = distance < talkRange;
    const inNoticeRange = distance < noticeRange;

    // Update talk range tracking
    if (inTalkRange !== isInTalkRange) {
      setIsInTalkRange(inTalkRange);
    }

    // Show "Press T to talk" prompt if in range and not currently talking
    const shouldShowPrompt = inTalkRange && !isListening && !isTalking;
    if (shouldShowPrompt !== showPrompt) {
      setShowPrompt(shouldShowPrompt);
    }

    // Check the "talk" key from keyboard controls
    const isTalkKeyPressed = get().talk;
    if (inTalkRange && isTalkKeyPressed && !isListening && !isTalking) {
      handleStartTalking();
    } else if (isListening && !isTalkKeyPressed) {
      handleStopTalking();
    }

    // NPC idle or talking logic
    if (isListening || isTalking) {
      // Face the player while talking
      npcRigidBody.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
      const direction = new Vector3().subVectors(playerPosition, npcPosition).normalize();
      const angle = Math.atan2(direction.x, direction.z);
      container.current.rotation.y = angle;
      setCurrentAnimation(talkAnimation);
    } else if (inTalkRange) {
      // Stand still, face player
      setCurrentAnimation(defaultAnimation);
      npcRigidBody.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
      const direction = new Vector3().subVectors(playerPosition, npcPosition).normalize();
      const angle = Math.atan2(direction.x, direction.z);
      container.current.rotation.y = angle;
    } else {
      // Idle out of range
      setCurrentAnimation(defaultAnimation);
      npcRigidBody.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
    }
  });

  // ---- Render the NPC
  return (
    <RigidBody ref={npcRigidBody} colliders={false} lockRotations {...props}>
      <group ref={container}>
        <Level1Character
          scale={270}
          position-y={-2}
          animation={currentAnimation}
        />
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
