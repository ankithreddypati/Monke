import React, { useRef, useEffect } from 'react';
import { useGLTF, useAnimations } from '@react-three/drei';
export function Fire({ position = [0, 0, 0], visible = false, scale = 1 }) { 
    const group = useRef();
    const { nodes, materials, animations } = useGLTF('models/fire.glb');
    const { actions } = useAnimations(animations, group);
  
    useEffect(() => {
      if (visible && actions['Take 001']) {
        actions['Take 001'].reset().play();
        actions['Take 001'].setLoop(true, Infinity);
      }
      return () => {
        if (actions['Take 001']) {
          actions['Take 001'].stop();
        }
      };
    }, [actions, visible]);
  
    if (!visible) return null;
  
    return (
      <group ref={group} position={position} dispose={null}>
        <group name="Sketchfab_Scene">
          <group name="Sketchfab_model" rotation={[-Math.PI / 2, 0, 0]}>
            <group name="562a047e15904e1db8aa0c0e2df6e95dfbx" rotation={[Math.PI / 2, 0, 0]}>
              <group name="Object_2">
                <group name="RootNode">
                  <group 
                    name="fire3Group20972" 
                    position={[2.814, 0.39, 1.703]} 
                    scale={0.269 * scale} 
                  >
                    <mesh
                      name="0"
                      castShadow
                      receiveShadow
                      geometry={nodes['0'].geometry}
                      material={materials.fire3lambert1}
                      morphTargetDictionary={nodes['0'].morphTargetDictionary}
                      morphTargetInfluences={nodes['0'].morphTargetInfluences}
                    />
                  </group>
                </group>
              </group>
            </group>
          </group>
        </group>
      </group>
    );
  }
  
  useGLTF.preload('models/fire.glb');