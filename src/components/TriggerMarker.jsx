import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const TriggerMarker = ({ position = [4.5, 0.1, -178], scale = 1 }) => {
  const ringRef = useRef();
  const materialRef = useRef();
  
  const glowMaterial = new THREE.ShaderMaterial({
    uniforms: {
      time: { value: 0 },
      color: { value: new THREE.Color(0x00ffff) }
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float time;
      uniform vec3 color;
      varying vec2 vUv;
      void main() {
        float alpha = 0.5 + 0.5 * sin(time * 2.0);
        float distance = length(vUv - vec2(0.5));
        float glow = smoothstep(0.5, 0.2, distance) * alpha;
        gl_FragColor = vec4(color, glow);
      }
    `,
    transparent: true,
    side: THREE.DoubleSide
  });

  materialRef.current = glowMaterial;

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.time.value = state.clock.getElapsedTime();
    }
    if (ringRef.current) {
      ringRef.current.rotation.y += 0.01;
    }
  });

  return (
    <group position={position} scale={scale}>
      {/* Base circle */}
      <mesh rotation-x={-Math.PI / 2} receiveShadow>
        <ringGeometry args={[0, 2, 32]} />
        <meshStandardMaterial 
          color="#1a1a1a"
          transparent
          opacity={0.5}
        />
      </mesh>
      
      {/* Glowing ring */}
      <mesh 
        ref={ringRef} 
        rotation-x={-Math.PI / 2} 
        position-y={0.05}
      >
        <ringGeometry args={[1.8, 2, 32]} />
        <primitive object={glowMaterial} attach="material" />
      </mesh>
    </group>
  );
};

export default TriggerMarker;