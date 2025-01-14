// Level2.jsx
import { useGLTF } from "@react-three/drei";
import { RigidBody } from "@react-three/rapier";

export const Level2 = () => {
  const { scene: level2Scene } = useGLTF("/models/jan6level2withcomputer2-transformed.glb");

  return (
    <RigidBody type="fixed" colliders="trimesh">
      <primitive object={level2Scene} position={[0, -5, 0]} scale={1} />
    </RigidBody>
  );
};





