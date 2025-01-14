import { useGLTF } from "@react-three/drei";
import { RigidBody } from "@react-three/rapier";
import VideoScreen from "./VideoScreen";

export const Level3 = ({ showVideo = false }) => {
  const { scene: level3Scene } = useGLTF("/models/jan12level3mainpathagain-transformed.glb");
  const { scene: decorations } = useGLTF("/models/jan12level3sidepathagain-transformed.glb");

  return (
    <>
      <RigidBody type="fixed" colliders="trimesh">
        <primitive object={level3Scene} position={[0, -5, 0]} scale={1} />
      </RigidBody>

      <primitive object={decorations} position={[0, -5, 0]} scale={1} />

      {/* Only render VideoScreen when showVideo is true */}
      {showVideo && (
        <VideoScreen
          position={[4.73, 5.4, -211.53]}
          rotation={[Math.PI / 4, Math.PI, 0]} 
          scale={[2.5, 1.45, 1]}
          videoSrc="/videos/record.mp4"
          playing={true}  
        />
      )}
    </>
  );
};

export default Level3;