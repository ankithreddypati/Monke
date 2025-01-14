import { useGLTF } from "@react-three/drei";
import { RigidBody } from "@react-three/rapier";
import VideoScreen from "./VideoScreen";

export const Level3 = ({ showVideo = false }) => {
  const { scene: level3Scene } = useGLTF("/models/level3mains.glb");
  const { scene: decorations } = useGLTF("/models/level3sides.glb");

  return (
    <>
      <RigidBody type="fixed" colliders="trimesh">
        <primitive object={level3Scene} position={[0, -5, 0]} scale={1} />
      </RigidBody>

      <primitive object={decorations} position={[0, -5, 0]} scale={1} />

      {showVideo && (
        <VideoScreen
          position={[4.73, 5, -210.53]}
          rotation={[Math.PI / 4, Math.PI, 0]} 
          scale={[2.5, 1.45, 1]}
          videoSrc="/videos/record.mp4"
          playing={false}  
        />
      )}
      
    </>
  );
};

export default Level3;