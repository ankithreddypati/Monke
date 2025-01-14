// Skybox.jsx
import { useGLTF } from "@react-three/drei";
import { RigidBody } from "@react-three/rapier";

export const Skybox = () => {
  // Loads your skybox .glb
  const { scene } = useGLTF("/models/skybox.glb");

  return (
    <RigidBody type="fixed" colliders="trimesh">
      <primitive object={scene} />
    </RigidBody>
  );
};
