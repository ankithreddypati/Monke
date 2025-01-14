// RobotEnemy.jsx
import React, { useRef, useEffect } from 'react';
import { useGLTF, useAnimations, Html } from '@react-three/drei';

export function RobotEnemy({ animation = "CharacterArmature|Idle", health = 100, showHealth = false, ...props }) {
  const group = useRef();
  const { nodes, materials, animations } = useGLTF('/models/RobotEnemy.glb');
  const { actions } = useAnimations(animations, group);

  useEffect(() => {
    // Handle animation transitions
    if (actions[animation]) {
      // Stop all current animations
      Object.values(actions).forEach(action => action.stop());
      
      // Play new animation with fade
      actions[animation].reset().fadeIn(0.25).play();
    }

    return () => {
      if (actions[animation]) {
        actions[animation].fadeOut(0.25);
      }
    }
  }, [animation, actions]);

  return (
    <group ref={group} {...props}>
      {showHealth && (
        <Html
          position={[0, 1, 0]}
          center
          style={{
            width: '100px',
            transform: 'translate(-50%, -50%)'
          }}
        >
          <div style={{
            width: '100%',
            height: '10px',
            background: '#333',
            border: '1px solid #666',
            borderRadius: '5px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${health}%`,
              height: '100%',
              background: `rgb(${255 - (health * 2.55)}, ${health * 2.55}, 0)`,
              transition: 'width 0.3s ease-in-out, background 0.3s ease-in-out'
            }} />
          </div>
        </Html>
      )}
      
      <group name="Root_Scene">
        <group name="RootNode">
          <group name="CharacterArmature" rotation={[-Math.PI / 2, 0, 0]} scale={160}>
            <primitive object={nodes.Root} />
          </group>
          <group name="Enemy_Robot_2Legs" rotation={[-Math.PI / 2, 0, 0]} scale={160}>
            <skinnedMesh
              name="Enemy_Robot_2Legs_1"
              geometry={nodes.Enemy_Robot_2Legs_1.geometry}
              material={materials.Main2}
              skeleton={nodes.Enemy_Robot_2Legs_1.skeleton}
            />
            <skinnedMesh
              name="Enemy_Robot_2Legs_2"
              geometry={nodes.Enemy_Robot_2Legs_2.geometry}
              material={materials.Main}
              skeleton={nodes.Enemy_Robot_2Legs_2.skeleton}
            />
            <skinnedMesh
              name="Enemy_Robot_2Legs_3"
              geometry={nodes.Enemy_Robot_2Legs_3.geometry}
              material={materials.Edge}
              skeleton={nodes.Enemy_Robot_2Legs_3.skeleton}
            />
            <skinnedMesh
              name="Enemy_Robot_2Legs_4"
              geometry={nodes.Enemy_Robot_2Legs_4.geometry}
              material={materials.Dark}
              skeleton={nodes.Enemy_Robot_2Legs_4.skeleton}
            />
            <skinnedMesh
              name="Enemy_Robot_2Legs_5"
              geometry={nodes.Enemy_Robot_2Legs_5.geometry}
              material={materials.Eye}
              skeleton={nodes.Enemy_Robot_2Legs_5.skeleton}
            />
          </group>
        </group>
      </group>
    </group>
  );
}

useGLTF.preload('/models/RobotEnemy.glb');