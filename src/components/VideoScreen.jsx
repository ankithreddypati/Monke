import { useEffect, useRef } from "react";
import * as THREE from "three";

const VideoScreen = ({ position = [0, 0, 0], rotation = [0, 0, 0], scale = [4, 2.25, 1], videoSrc }) => {
  const videoRef = useRef();
  const textureRef = useRef();

  useEffect(() => {
    // Create video element
    const video = document.createElement("video");
    video.src = videoSrc;
    video.crossOrigin = "anonymous";
    video.loop = true;
    video.muted = true;
    video.play(); // Start playing
    videoRef.current = video;

    // Create video texture
    const texture = new THREE.VideoTexture(video);
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = false;
    texture.format = THREE.RGBAFormat;
    textureRef.current = texture;

    return () => {
      video.pause();
      video.remove(); // Cleanup
    };
  }, [videoSrc]);

  return (
    <mesh position={position} rotation={rotation} scale={scale}>
      <planeGeometry args={[1, 1]} />
      {textureRef.current && <meshBasicMaterial map={textureRef.current} toneMapped={false} />}
    </mesh>
  );
};

export default VideoScreen;