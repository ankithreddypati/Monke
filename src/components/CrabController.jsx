//CrabController.jsx
import React, { useRef, useState, useEffect } from "react";
import { RigidBody, CapsuleCollider } from "@react-three/rapier";
import { useFrame } from "@react-three/fiber";
import { Vector3 } from "three";
import { CrabEnemy } from "./CrabEnemy";
import { useGame } from "../context/GameContext";

export function CrabController({
  playerRef,
  chaseRange = 10,
  speed = 2,
  idleAnimation = "MonsterArmature|Bite_InPlace",
  walkAnimation = "MonsterArmature|Walk",
  attackAnimation = "MonsterArmature|Bite_Front",
  ...props
}) {
  const { leftHandItem, takeDamage } = useGame();
  const crabRigidBody = useRef(null);
  const container = useRef();
  const [currentAnimation, setCurrentAnimation] = useState(idleAnimation);
  const crabPos = useRef(new Vector3());
  const TORCH_FEAR_RANGE = 15;
  const DAMAGE_COOLDOWN = 1000; // 1 second between damage ticks
  const lastDamageTime = useRef(0);

  // Track if the crab is currently touching the player
  const isTouchingPlayer = useRef(false);

  useFrame(() => {
    if (!crabRigidBody.current || !playerRef?.current) return;

    // Get positions
    const { x: cx, y: cy, z: cz } = crabRigidBody.current.translation();
    const crabPosition = new Vector3(cx, cy, cz);

    const { x: px, y: py, z: pz } = playerRef.current.translation();
    const playerPosition = new Vector3(px, py, pz);

    // Check if player has a lit torch
    const hasLitTorch = leftHandItem?.type === 'torch' && leftHandItem?.isLit;

    // Calculate horizontal distance only (ignoring Y axis)
    const distance = Math.sqrt(
      Math.pow(crabPosition.x - playerPosition.x, 2) + 
      Math.pow(crabPosition.z - playerPosition.z, 2)
    );

    // Check for collision and handle damage with cooldown
    const collisionThreshold = 2.0; // Increased to account for combined collider radii (1.2 + 0.6 ≈ 2.0)
    const currentTime = Date.now();
    
    if (distance < collisionThreshold) {
      // We're in attack range
      setCurrentAnimation(attackAnimation);
      
      if (!isTouchingPlayer.current) {
        // Initial contact
        console.log("Crab making initial contact");
        isTouchingPlayer.current = true;
        takeDamage();
        lastDamageTime.current = currentTime;
      } else if (currentTime - lastDamageTime.current >= DAMAGE_COOLDOWN) {
        // Enough time has passed, deal damage again
        console.log("Crab dealing repeated damage");
        takeDamage();
        lastDamageTime.current = currentTime;
      }
    } else {
      if (isTouchingPlayer.current) {
        // No longer in contact
        console.log("Crab breaking contact");
        isTouchingPlayer.current = false;
        setCurrentAnimation(idleAnimation);
      }
    }

    // Direction calculation (will be used for both chase and flee)
    const direction = new Vector3().subVectors(playerPosition, crabPosition);
    direction.y = 0; // Keep movement on ground plane
    direction.normalize();

    if (hasLitTorch && distance < TORCH_FEAR_RANGE) {
      // Run away from torch
      setCurrentAnimation(walkAnimation);
      
      // Reverse the direction to run away
      direction.multiplyScalar(-1);
      
      // Apply velocity for fleeing (slightly faster when fleeing)
      const fleeSpeed = speed * 1.5;
      crabRigidBody.current.setLinvel(
        { 
          x: direction.x * fleeSpeed, 
          y: crabRigidBody.current.linvel().y, 
          z: direction.z * fleeSpeed 
        },
        true
      );

      // Rotate to face away from player
      const angleToFlee = Math.atan2(direction.x, direction.z);
      container.current.rotation.y = angleToFlee;

    } else if (distance < chaseRange && !hasLitTorch) {
      // Normal chase behavior when no torch
      setCurrentAnimation(walkAnimation);

      crabRigidBody.current.setLinvel(
        { 
          x: direction.x * speed, 
          y: crabRigidBody.current.linvel().y, 
          z: direction.z * speed 
        },
        true
      );

      // Rotate to face player
      const angleToPlayer = Math.atan2(direction.x, direction.z);
      container.current.rotation.y = angleToPlayer;

    } else if (!isTouchingPlayer.current) {
      // Idle behavior (if not touching the player)
      setCurrentAnimation(idleAnimation);
      crabRigidBody.current.setLinvel(
        { 
          x: 0, 
          y: crabRigidBody.current.linvel().y, 
          z: 0 
        },
        true
      );
    }
  });

  return (
    <RigidBody
      ref={crabRigidBody}
      colliders={false}
      lockRotations
      {...props}
    >
      <group ref={container}>
        <CrabEnemy 
          scale={1.5} 
          position-y={1}
          animation={currentAnimation}
        />
        <CapsuleCollider 
          args={[0.4, 1]} 
          position={[0, 2, 0]} 
        />
      </group>
    </RigidBody>
  );
}