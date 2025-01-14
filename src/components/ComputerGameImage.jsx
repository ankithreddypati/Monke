import { useLoader } from '@react-three/fiber';
import { TextureLoader } from 'three';

export const ComputerGameImage = ({ position = [0, 0, 0], rotation = [0, 0, 0], scale = [1, 1, 1] }) => {
  const texture = useLoader(TextureLoader, '/images/computergame.png');

  return (
    <mesh position={position} rotation={rotation} scale={scale}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial map={texture} transparent={true} />
    </mesh>
  );
};