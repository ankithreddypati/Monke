// Level1.jsx
import { useGLTF } from "@react-three/drei";
import { RigidBody } from "@react-three/rapier";

export const Level1 = ({ onLevelComplete }) => {
  // Load your Level1 environment
  const { scene: level1Scene } = useGLTF("/models/level1.glb");

  return (
    <>
      {/* The environment is static, so we use a fixed RigidBody with a trimesh collider */}
      <RigidBody type="fixed" colliders="trimesh">
        <primitive object={level1Scene} position={[0, 0, 0]} scale={1} />
      </RigidBody>

   
    </>
  );
};
