import React, { useRef, useEffect, useState } from 'react';
import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { RigidBody } from '@react-three/rapier';
import { useGame } from '../context/GameContext';

export function Banana({ id, position, scale = 1 }) {
  const { nodes, materials } = useGLTF('models/Banana.glb');
  const { eatBanana } = useGame();
  const bananaRef = useRef();
  const rigidBodyRef = useRef();
  const [isCollected, setIsCollected] = useState(false);

  useFrame((state, delta) => {
    if (bananaRef.current) {
      bananaRef.current.rotation.y += delta * 2;
    }
  });

  const handleCollision = () => {
    if (!isCollected) {
      setIsCollected(true);
      eatBanana();
      if (rigidBodyRef.current) {
        rigidBodyRef.current.setTranslation({ x: 0, y: -100, z: 0 });
      }
    }
  };

  if (isCollected) return null;

  return (
    <RigidBody
      ref={rigidBodyRef}
      type="fixed"
      colliders="hull"
      sensor
      onIntersectionEnter={handleCollision}
      position={position}
    >
      <group ref={bananaRef} scale={scale * 0.5} dispose={null}>
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.mesh1337751287.geometry}
          material={materials.mat12}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.mesh1337751287_1.geometry}
          material={materials.mat20}
        />
      </group>
    </RigidBody>
  );
}

useGLTF.preload('models/Banana.glb');