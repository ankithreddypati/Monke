import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const LightBeam = ({ position = [0, 0, 0], scale = 1, visible = true }) => {
  const beamRef = useRef();
  const baseRef = useRef();

  // Create a custom material for the beam
  const beamMaterial = new THREE.ShaderMaterial({
    uniforms: {
      time: { value: 0 },
      color: { value: new THREE.Color(0xff0000) }  // Red color
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
        float alpha = smoothstep(0.0, 0.2, 1.0 - vUv.y) * (0.5 + 0.5 * sin(time * 2.0));
        alpha *= smoothstep(0.0, 0.4, vUv.y);
        gl_FragColor = vec4(color, alpha * 0.6);
      }
    `,
    transparent: true,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending
  });

  // Base material with glow
  const baseMaterial = new THREE.MeshStandardMaterial({
    color: '#ff0000',
    emissive: '#ff0000',
    emissiveIntensity: 2,
    transparent: true,
    opacity: 0.8
  });

  useFrame((state) => {
    if (beamRef.current && visible) {
      // Update time uniform for the beam animation
      beamMaterial.uniforms.time.value = state.clock.getElapsedTime();
      
      // Rotate the beam slowly
      beamRef.current.rotation.y += 0.01;
    }

    if (baseRef.current && visible) {
      // Pulse the base
      const pulse = (Math.sin(state.clock.getElapsedTime() * 2) + 1) / 2;
      baseMaterial.emissiveIntensity = 1 + pulse * 2;
    }
  });

  if (!visible) return null;

  return (
    <group position={position} scale={scale}>
      {/* Base circle */}
      <mesh ref={baseRef} rotation-x={-Math.PI / 2}>
        <ringGeometry args={[0, 1, 32]} />
        <primitive object={baseMaterial} attach="material" />
      </mesh>

      {/* Beam cylinder */}
      <mesh ref={beamRef}>
        <cylinderGeometry args={[0.5, 0.1, 20, 32, 1, true]} /> {/* args: [radiusTop, radiusBottom, height, segments] */}
        <primitive object={beamMaterial} attach="material" />
      </mesh>

      {/* Light source */}
      <pointLight 
        color="#ff0000"
        intensity={2}
        distance={10}
        position={[0, 1, 0]}
      />
    </group>
  );
};

export default LightBeam;