import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export const PortalTransition = ({ position = [43, 5, -195], width = 8, height = 10 }) => {
  const portalRef = useRef();
  const glowRef = useRef();
  
  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    
    // Animate the portal's opacity
    if (portalRef.current) {
      portalRef.current.material.opacity = 0.5 + Math.sin(time * 2) * 0.2;
    }
    
    // Animate the glow's scale
    if (glowRef.current) {
      glowRef.current.scale.x = 1 + Math.sin(time * 3) * 0.1;
      glowRef.current.scale.y = 1 + Math.cos(time * 3) * 0.1;
    }
  });

  return (
    <group position={position}>
      {/* Main portal rectangle */}
      <mesh ref={portalRef}>
        <planeGeometry args={[width, height]} />
        <meshBasicMaterial 
          color="#20B2AA"
          transparent={true}
          opacity={0.6}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Outer glow effect */}
      <mesh ref={glowRef}>
        <planeGeometry args={[width + 0.5, height + 0.5]} />
        <meshBasicMaterial
          color="#00ffff"
          transparent={true}
          opacity={0.3}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Particle system for sparkle effect */}
      <points>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={50}
            array={new Float32Array(150).map(() => (Math.random() - 0.5) * width)}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.1}
          color="#ffffff"
          transparent
          opacity={0.6}
          sizeAttenuation
        />
      </points>
    </group>
  );
};

