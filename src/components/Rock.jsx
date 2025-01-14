// Rock.jsx
import React, { useRef, useState, useEffect } from 'react';
import { useGLTF, Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useGame } from '../context/GameContext';
import * as THREE from 'three';
import { RigidBody } from '@react-three/rapier';

export function Rock({ id, position, playerRef, scale = 0.7 }) {
  const { nodes, materials } = useGLTF('models/Rock.glb');
  const { addItem, inventory } = useGame();
  const groupRef = useRef();
  const [isInRange, setIsInRange] = useState(false);
  const PICKUP_RANGE = 2;

  useEffect(() => {
    const handleKeyPress = (event) => {
      if (event.code === 'KeyF' && isInRange) {
        addItem({ id, type: 'rock', position });
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isInRange, id, addItem, position]);

  useFrame(() => {
    if (!groupRef.current || !playerRef?.current) return;
    
    const rockPos = position;
    const playerPos = playerRef.current.translation();

    const distance = Math.sqrt(
      Math.pow(playerPos.x - rockPos[0], 2) +
      Math.pow(playerPos.z - rockPos[2], 2)
    );

    setIsInRange(distance < PICKUP_RANGE);
  });

  if (inventory.some(item => item.id === id)) return null;

  return (
    <RigidBody type="fixed" colliders="hull">
      <group 
        ref={groupRef}
        position={position} 
        dispose={null}
      >
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Rock_1.geometry}
          material={isInRange ? 
            new THREE.MeshStandardMaterial({ 
              ...materials.Rock_Grey,
              emissive: '#666666',
              emissiveIntensity: 0.5 
            }) : 
            materials.Rock_Grey
          }
          rotation={[-Math.PI / 2, 0, 0]}
          scale={90 * scale}
        />
        {isInRange && (
          <Html position={[0, 2, 0]}>
            <div className="text-white text-sm bg-black/50 px-2 py-1 rounded">
              Press F to pickup
            </div>
          </Html>
        )}
      </group>
    </RigidBody>
  );
}

useGLTF.preload('models/Rock.glb');