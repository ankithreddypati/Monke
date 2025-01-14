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

  const isTouchingPlayer = useRef(false);

  useFrame(() => {
    if (!crabRigidBody.current || !playerRef?.current) return;

    const { x: cx, y: cy, z: cz } = crabRigidBody.current.translation();
    const crabPosition = new Vector3(cx, cy, cz);

    const { x: px, y: py, z: pz } = playerRef.current.translation();
    const playerPosition = new Vector3(px, py, pz);

    const hasLitTorch = leftHandItem?.type === 'torch' && leftHandItem?.isLit;

    const distance = Math.sqrt(
      Math.pow(crabPosition.x - playerPosition.x, 2) + 
      Math.pow(crabPosition.z - playerPosition.z, 2)
    );

    const collisionThreshold = 2.0; 
    
    if (distance < collisionThreshold) {
      setCurrentAnimation(attackAnimation);
      
      if (!isTouchingPlayer.current) {
        console.log("Crab making initial contact");
        isTouchingPlayer.current = true;
        takeDamage();
        lastDamageTime.current = currentTime;
      } else if (currentTime - lastDamageTime.current >= DAMAGE_COOLDOWN) {
        console.log("Crab dealing repeated damage");
        takeDamage();
        lastDamageTime.current = currentTime;
      }
    } else {
      if (isTouchingPlayer.current) {
        console.log("Crab breaking contact");
        isTouchingPlayer.current = false;
        setCurrentAnimation(idleAnimation);
      }
    }

    const direction = new Vector3().subVectors(playerPosition, crabPosition);
    direction.y = 0; 
    direction.normalize();

    if (hasLitTorch && distance < TORCH_FEAR_RANGE) {
      setCurrentAnimation(walkAnimation);
      
      direction.multiplyScalar(-1);
      
      const fleeSpeed = speed * 1.5;
      crabRigidBody.current.setLinvel(
        { 
          x: direction.x * fleeSpeed, 
          y: crabRigidBody.current.linvel().y, 
          z: direction.z * fleeSpeed 
        },
        true
      );

      const angleToFlee = Math.atan2(direction.x, direction.z);
      container.current.rotation.y = angleToFlee;

    } else if (distance < chaseRange && !hasLitTorch) {
      setCurrentAnimation(walkAnimation);

      crabRigidBody.current.setLinvel(
        { 
          x: direction.x * speed, 
          y: crabRigidBody.current.linvel().y, 
          z: direction.z * speed 
        },
        true
      );

      const angleToPlayer = Math.atan2(direction.x, direction.z);
      container.current.rotation.y = angleToPlayer;

    } else if (!isTouchingPlayer.current) {
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