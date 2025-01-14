// Torch.jsx
import React, { useRef, useState, useEffect } from 'react';
import { useGLTF, Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useGame } from '../context/GameContext';
import * as THREE from 'three';
import { RigidBody } from '@react-three/rapier';
import { Fire } from './fire';

export function Torch({ 
  id, 
  position, 
  playerRef, 
  scale = 1,
  rotation = [0, 0, 0],
  isLit = false 
}) {
  const { nodes, materials } = useGLTF('models/firetorch.glb');
  const { addItem, inventory, leftHandItem } = useGame();
  const groupRef = useRef();
  const [isInRange, setIsInRange] = useState(false);
  const PICKUP_RANGE = 4;

  useEffect(() => {
    const handleKeyPress = (event) => {
      // Only allow pickup if torch is lit and player isn't holding a torch
      if (event.code === 'KeyF' && isInRange && isLit && leftHandItem?.type !== 'torch') {
        console.log('Adding torch to inventory');
        addItem({ id, type: 'torch', position, isLit });
      }
    };
  
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isInRange, id, addItem, position, isLit, leftHandItem]);

  useFrame(() => {
    if (!groupRef.current || !playerRef?.current) return;
    
    const playerPos = playerRef.current.translation();
    
    // Ensure consistent position format
    const torchPos = {
      x: position[0],
      y: position[1],
      z: position[2]
    };

    const distance = Math.sqrt(
      Math.pow(playerPos.x - torchPos.x, 2) +
      Math.pow(playerPos.z - torchPos.z, 2)
    );

    const wasInRange = isInRange;
    const newIsInRange = distance < PICKUP_RANGE;
    if (wasInRange !== newIsInRange) {
      console.log('Torch range changed:', { distance, isInRange: newIsInRange });
    }
    setIsInRange(newIsInRange);
  });

  // Don't render if torch is in inventory
  if (inventory.some(item => item.id === id)) return null;

  return (
    <RigidBody type="fixed" colliders="hull">
      <group 
        ref={groupRef}
        position={position} 
        dispose={null}
        rotation={rotation}
      >
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.group2044495118.geometry}
          material={isInRange ? 
            new THREE.MeshStandardMaterial({ 
              ...materials['mat20.003'],
              emissive: '#666666',
              emissiveIntensity: 0.5 
            }) : 
            materials['mat20.003']
          }
          scale={10 * scale}
        />
        <Fire 
          position={[-3.4, 0.6, -2]}
          visible={isLit}
          scale={2}
        />
        {/* Only show pickup prompt if torch is lit and player isn't holding a torch */}
        {isInRange && isLit && leftHandItem?.type !== 'torch' && (
          <Html position={[0, 3, 0]}>
            <div className="text-white text-sm bg-black/50 px-2 py-1 rounded">
              Press F to pickup
            </div>
          </Html>
        )}
      </group>
    </RigidBody>
  );
}

useGLTF.preload('models/firetorch.glb');