

// src/components/CharacterController.jsx
import React, { forwardRef, useEffect, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { RigidBody, CapsuleCollider } from "@react-three/rapier";
import { useControls } from "leva";
import { MathUtils, Vector3 } from "three";
import { degToRad } from "three/src/math/MathUtils.js";
import { useKeyboardControls, Html } from "@react-three/drei";
import { Character } from "./Character";
import { audioManager } from "../services/AudioManager";
import { useGame } from "../context/GameContext";
import { useGLTF } from "@react-three/drei";
import { Fire } from './fire';
import { audioRecorderService } from "../services/audioRecorderService";
import { websocketService } from "../services/webSocketService";

// Fall detection constants
const FALL_DEATH_Y = -30; // Y position below which player dies
const FALL_VELOCITY_THRESHOLD = -30; // Terminal velocity threshold
const FALL_TIME_THRESHOLD = 2000; // Time in milliseconds before fall death

const HeldItem = () => {
  const { leftHandItem, rightHandItem } = useGame();
  const { nodes: rockNodes, materials: rockMaterials } = useGLTF('models/Rock.glb');
  const { nodes: torchNodes, materials: torchMaterials } = useGLTF('models/firetorch.glb');

  return (
    <>
      {leftHandItem?.type === 'rock' && (
        <group position={[-0.9, -1, 0.5]} rotation={[0, -Math.PI / 4, 0]}>
          <mesh
            castShadow
            receiveShadow
            geometry={rockNodes.Rock_1.geometry}
            material={rockMaterials.Rock_Grey}
            rotation={[-Math.PI / 2, 0, 0]}
            scale={45}
          />
        </group>
      )}
      
      {rightHandItem?.type === 'rock' && (
        <group position={[0.9, -1, -0.5]} rotation={[0, Math.PI / 4, 0]}>
          <mesh
            castShadow
            receiveShadow
            geometry={rockNodes.Rock_1.geometry}
            material={rockMaterials.Rock_Grey}
            rotation={[-Math.PI / 2, 0, 0]}
            scale={45}
          />
        </group>
      )}

      {leftHandItem?.type === 'torch' && (
        <group position={[1.3, -0.2, 0.2]} rotation={[0, Math.PI / 4, 0]}>
          <mesh
            castShadow
            receiveShadow
            geometry={torchNodes.group2044495118.geometry}
            material={torchMaterials['mat20.003']}
            rotation={[-Math.PI / 1.3, 0, 0]}
            scale={5}
          />
          <Fire 
            position={[-3.8, -0, -1.4]}
            visible={leftHandItem.isLit}
            scale={1.8}
          />
        </group>
      )}
    </>
  );
};

const normalizeAngle = (angle) => {
  while (angle > Math.PI) angle -= 2 * Math.PI;
  while (angle < -Math.PI) angle += 2 * Math.PI;
  return angle;
};

const lerpAngle = (start, end, t) => {
  start = normalizeAngle(start);
  end = normalizeAngle(end);

  if (Math.abs(end - start) > Math.PI) {
    if (end > start) {
      start += 2 * Math.PI;
    } else {
      end += 2 * Math.PI;
    }
  }

  return normalizeAngle(start + (end - start) * t);
};

export const CharacterController = forwardRef(({ animation = "orcidle", disabled = false, ...props }, ref) => {
  const { 
    handleDeath, 
    gameState, 
    playerRef, 
    isDead, 
    activeItem, 
    dropActiveItem, 
    leftHandItem, 
    rightHandItem 
  } = useGame();
  
  const [currentAnimation, setCurrentAnimation] = useState(animation);
  const [showRubPrompt, setShowRubPrompt] = useState(false);
  const [hasInitiallyDropped, setHasInitiallyDropped] = useState(false);
  const [isTalking, setIsTalking] = useState(false);
  const fallStartTime = useRef(null);
  const previousY = useRef(null);

  const {
    WALK_SPEED,
    RUN_SPEED,
    ROTATION_SPEED,
    JUMP_FORCE,
  } = useControls("Character Control", {
    WALK_SPEED: { value: 3, min: 0.1, max: 6, step: 0.1 },
    RUN_SPEED: { value: 6, min: 0.2, max: 12, step: 0.1 },
    ROTATION_SPEED: {
      value: degToRad(0.5),
      min: degToRad(0.1),
      max: degToRad(5),
      step: degToRad(0.1),
    },
    JUMP_FORCE: { value: 5, min: 1, max: 10, step: 0.1 },
  });

  const rb = useRef(null);
  const container = useRef();
  const character = useRef();
  const cameraTarget = useRef();
  const cameraPosition = useRef();
  const cameraWorldPosition = useRef(new Vector3());
  const cameraLookAtWorldPosition = useRef(new Vector3());
  const cameraLookAt = useRef(new Vector3());
  const [, get] = useKeyboardControls();
  const rotationTarget = useRef(0);
  const characterRotationTarget = useRef(0);
  const wasMovingLastFrame = useRef(false);
  const isGrounded = useRef(true);
  const [jumpLastFrame, setJumpLastFrame] = useState(false);

  useEffect(() => {
    setCurrentAnimation(animation);
  }, [animation]);

  useEffect(() => {
    if (rb.current && !hasInitiallyDropped) {
      rb.current.setTranslation({ x: 0, y: 20, z: 0 }, true);
      setHasInitiallyDropped(true);
    }
  }, [hasInitiallyDropped]);

  useEffect(() => {
    if (ref) {
      ref.current = rb.current;
    }
    if (playerRef) {
      playerRef.current = rb.current;
    }
  }, [ref, playerRef]);

  useEffect(() => {
    return () => {
      audioManager.stopAllSounds();
    };
  }, []);

  useEffect(() => {
    if (isDead) {
      setCurrentAnimation("dyingback"); 
    } else {
      setCurrentAnimation(animation);
    }
  }, [isDead, animation]);

  // Utility functions for rock rubbing
  const isNearFireplace = () => {
    if (!rb.current) return false;
    const playerPos = rb.current.translation();
    
    const distance = Math.sqrt(
      Math.pow(playerPos.x - 37.5, 2) + 
      Math.pow(playerPos.z - (-119.0), 2)
    );
    
    return distance < 5;
  };

  const isHoldingTwoRocks = () => {
    return leftHandItem?.type === 'rock' && rightHandItem?.type === 'rock';
  };

  // Fall detection handler
  const handleFallDetection = () => {
    if (!rb.current || gameState !== 'playing') return;

    const position = rb.current.translation();
    const velocity = rb.current.linvel();

    if (position.y < FALL_DEATH_Y) {
      handleDeath('fall');
      return;
    }

    if (velocity.y < FALL_VELOCITY_THRESHOLD) {
      handleDeath('fall');
      return;
    }

    if (!previousY.current) {
      previousY.current = position.y;
      return;
    }

    if (position.y < previousY.current && !isGrounded.current) {
      if (!fallStartTime.current) {
        fallStartTime.current = Date.now();
      }
      else if (Date.now() - fallStartTime.current > FALL_TIME_THRESHOLD) {
        handleDeath('fall');
        return;
      }
    } else {
      fallStartTime.current = null;
    }

    previousY.current = position.y;
  };

  useFrame(({ camera }) => {
    if (!rb.current || disabled || gameState !== 'playing' || isDead) return;

    handleFallDetection();

    const vel = rb.current.linvel();
    const movement = { x: 0, z: 0 };

    // Check for rock rubbing conditions
    const nearFire = isNearFireplace();
    const hasTwoRocks = isHoldingTwoRocks();
    setShowRubPrompt(nearFire && hasTwoRocks);

    if (get().forward) movement.z = 1;
    if (get().backward) movement.z = -1;
    if (get().left) movement.x = 1;
    if (get().right) movement.x = -1;

    if (get().talk && !isTalking) {
      setIsTalking(true);
      setCurrentAnimation("talking");
      audioRecorderService.startRecording((audioMessage) => {
        websocketService.sendMessage(audioMessage);
      });
    }

    if (get().drop && activeItem) {
      dropActiveItem();
      audioManager.playSound('drop', { volume: 0.5 });
    }

    // Handle rock rubbing action
    if (get().action && nearFire && hasTwoRocks) {
      if (props.onRubRocks) {
        props.onRubRocks();
        dropActiveItem('left');
        dropActiveItem('right');
      }
    }

    let speed = get().run ? RUN_SPEED : WALK_SPEED;

    if (movement.x !== 0) {
      rotationTarget.current += ROTATION_SPEED * movement.x;
    }

    const jumpNow = get().jump;
    if (jumpNow && !jumpLastFrame && isGrounded.current) {
      vel.y = JUMP_FORCE;
      audioManager.playSound('jump', { volume: 0.6 });
      setCurrentAnimation("jump");
      isGrounded.current = false;
    }
    setJumpLastFrame(jumpNow);

    const isMoving = movement.x !== 0 || movement.z !== 0;

    if (isMoving && !disabled) {
      characterRotationTarget.current = Math.atan2(movement.x, movement.z);
      vel.x = Math.sin(rotationTarget.current + characterRotationTarget.current) * speed;
      vel.z = Math.cos(rotationTarget.current + characterRotationTarget.current) * speed;

      if (isGrounded.current && currentAnimation !== "jump") {
        if (speed === RUN_SPEED) {
          if (!audioManager.isPlaying('running')) {
            audioManager.stopSound('footstep');
            audioManager.playSound('running', { loop: true, volume: 0.7 });
          }
          setCurrentAnimation("run");
        } else {
          if (!audioManager.isPlaying('footstep')) {
            audioManager.stopSound('running');
            audioManager.playSound('footstep', { loop: true, volume: 0.5 });
          }
          setCurrentAnimation("walking");
        }
      }
    } else {
      if (wasMovingLastFrame.current) {
        audioManager.stopSound('footstep');
        audioManager.stopSound('running');
      }
      
      vel.x = 0;
      vel.z = 0;

      if (!disabled && isGrounded.current && currentAnimation !== "jump" && currentAnimation !== animation) {
        setCurrentAnimation(animation);
      }
    }

    wasMovingLastFrame.current = isMoving;

    if (Math.abs(vel.y) < 0.05) {
      isGrounded.current = true;
      if (currentAnimation === "jump") {
        if (isMoving) {
          setCurrentAnimation(speed === RUN_SPEED ? "run" : "walking");
        } else {
          setCurrentAnimation(animation);
        }
      }
    } else {
      isGrounded.current = false;
    }

    rb.current.setLinvel(vel, true);

    character.current.rotation.y = lerpAngle(
      character.current.rotation.y,
      characterRotationTarget.current,
      0.1
    );

    container.current.rotation.y = MathUtils.lerp(
      container.current.rotation.y,
      rotationTarget.current,
      0.1
    );

    cameraPosition.current.getWorldPosition(cameraWorldPosition.current);
    camera.position.lerp(cameraWorldPosition.current, 0.1);

    if (cameraTarget.current) {
      cameraTarget.current.getWorldPosition(cameraLookAtWorldPosition.current);
      cameraLookAt.current.lerp(cameraLookAtWorldPosition.current, 0.1);
      camera.lookAt(cameraLookAt.current);
    }
  });

  return (
    <RigidBody colliders={false} lockRotations ref={rb} {...props}>
      {showRubPrompt && (
        <Html center position={[0, 2, 0]}>
          <div style={{ 
            background: 'black', 
            color: 'white', 
            padding: '10px',
            borderRadius: '5px'
          }}>
            Press R to rub stones
          </div>
        </Html>
      )}
      <group ref={container}>
        <group ref={cameraTarget} position-z={1.5} />
        <group ref={cameraPosition} position-y={4} position-z={-4} />
        <group ref={character}>
          <Character scale={270} position-y={-2} animation={currentAnimation} />
          <HeldItem />
        </group>
      </group>
      <CapsuleCollider args={[1.2, 1]} />
    </RigidBody>
  );
});