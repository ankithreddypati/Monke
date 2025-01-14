import React, { useRef, useState, useEffect } from "react";
import { RigidBody, CapsuleCollider } from "@react-three/rapier";
import { useFrame } from "@react-three/fiber";
import { Vector3 } from "three";
import { RobotEnemy } from "./RobotEnemy";
import { useGame } from "../context/GameContext";

export function RobotController({
  playerRef,
  chaseRange = 15,
  attackRange = 3,
  speed = 3,
  maxHealth = 100,
  ...props
}) {
  const { takeDamage } = useGame();
  const robotRef = useRef(null);
  const container = useRef();
  const [currentAnimation, setCurrentAnimation] = useState("CharacterArmature|Idle");
  const [health, setHealth] = useState(maxHealth);
  const [showHealth, setShowHealth] = useState(false);
  const robotPos = useRef(new Vector3());
  const DAMAGE_COOLDOWN = 1000; // 1 second between damage ticks
  const lastDamageTime = useRef(0);
  const isAttacking = useRef(false);

  // Function to handle robot taking damage
  const handleDamage = (amount) => {
    setHealth(prev => Math.max(0, prev - amount));
    if (health <= 0) {
      setCurrentAnimation("CharacterArmature|Death");
      // Could add death handling logic here
    }
  };

  useFrame(() => {
    if (!robotRef.current || !playerRef?.current || health <= 0) return;

    // Get positions
    const { x: rx, y: ry, z: rz } = robotRef.current.translation();
    const robotPosition = new Vector3(rx, ry, rz);

    const { x: px, y: py, z: pz } = playerRef.current.translation();
    const playerPosition = new Vector3(px, py, pz);

    // Calculate distance to player (horizontal only)
    const distance = Math.sqrt(
      Math.pow(robotPosition.x - playerPosition.x, 2) + 
      Math.pow(robotPosition.z - playerPosition.z, 2)
    );

    // Show health bar when player is nearby
    setShowHealth(distance < chaseRange);

    // Handle combat and movement
    const currentTime = Date.now();
    
    if (distance < attackRange) {
      // Attack range
      if (!isAttacking.current) {
        setCurrentAnimation("CharacterArmature|Attack");
        isAttacking.current = true;
        
        // Deal damage with cooldown
        if (currentTime - lastDamageTime.current >= DAMAGE_COOLDOWN) {
          takeDamage();
          lastDamageTime.current = currentTime;
        }
      }
    } else if (distance < chaseRange) {
      // Chase range
      isAttacking.current = false;
      setCurrentAnimation("CharacterArmature|Run");

      // Calculate direction to player
      const direction = new Vector3().subVectors(playerPosition, robotPosition);
      direction.y = 0; // Keep movement on ground plane
      direction.normalize();

      // Move towards player
      robotRef.current.setLinvel(
        { 
          x: direction.x * speed, 
          y: robotRef.current.linvel().y, 
          z: direction.z * speed 
        },
        true
      );

      // Rotate to face player
      const angleToPlayer = Math.atan2(direction.x, direction.z);
      container.current.rotation.y = angleToPlayer;
    } else {
      // Out of range - idle
      isAttacking.current = false;
      setCurrentAnimation("CharacterArmature|Idle");
      robotRef.current.setLinvel(
        { 
          x: 0, 
          y: robotRef.current.linvel().y, 
          z: 0 
        },
        true
      );
    }
  });

  return (
    <RigidBody
      ref={robotRef}
      colliders={false}
      lockRotations
      {...props}
    >
      <group ref={container}>
        <RobotEnemy 
          scale={3} 
          position-y={1.2}
          animation={currentAnimation}
          health={health}
          showHealth={showHealth}
        />
        <CapsuleCollider 
          args={[0.1, 1.2]} 
          position={[0, 2.2, 0]} 
        />
      </group>
    </RigidBody>
  );
}