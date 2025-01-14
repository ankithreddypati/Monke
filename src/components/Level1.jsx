// Level1.jsx
import { useGLTF } from "@react-three/drei";
import { RigidBody } from "@react-three/rapier";

export const Level1 = ({ onLevelComplete }) => {
  const { scene: level1Scene } = useGLTF("/models/level1.glb");

  return (
    <>
      <RigidBody type="fixed" colliders="trimesh">
        <primitive object={level1Scene} position={[0, 0, 0]} scale={1} />
      </RigidBody>

   
    </>
  );
};
