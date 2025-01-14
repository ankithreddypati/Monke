import React, { useRef, useEffect } from 'react';
import { useGLTF, useAnimations } from '@react-three/drei';

export function Level1Character({ id , animation = "orcidle", ...props }) {
  const group = useRef();
  const { nodes, materials, animations } = useGLTF('models/monkecharacter.glb');
  const { actions } = useAnimations(animations, group);

  useEffect(() => {
    Object.values(actions).forEach((action) => {
      action.reset().fadeOut(0.5);
    });

    if (actions[animation]) {
      actions[animation].reset().fadeIn(0.5).play();
    } else {
      console.warn(`Animation "${animation}" not found`);
    }
  }, [animation, actions]);

  return (
    <group ref={group} {...props} dispose={null}>
      <group name="Scene">
        <group name="root_ctrl" rotation={[Math.PI / 2, 0, 0]} scale={0.01} />
        <group name="R_kneel_ctrl" rotation={[Math.PI / 2, 0, 0]} scale={0.01} />
        <group name="L_foot_ctrl" rotation={[Math.PI / 2, 0, 0]} scale={0.01} />
        <group name="L_kneel_ctrl" rotation={[Math.PI / 2, 0, 0]} scale={0.01} />
        <group name="R_foot_ctrl" rotation={[Math.PI / 2, 0, 0]} scale={0.01} />
        <group name="L_ikHandle" />
        <group name="R_ikHandle" />
        <group name="monke" rotation={[Math.PI / 2, 0, 0]} scale={0.01}>
          <skinnedMesh
            name="chimp_geo"
            geometry={nodes.chimp_geo.geometry}
            material={materials._a_c_chimp_1a_c_chimp_1_1}
            skeleton={nodes.chimp_geo.skeleton}
          />
          <primitive object={nodes.COG_J} />
        </group>
        <group name="L_ikHandle001" />
        <group name="R_ikHandle001" />
        <group name="L_ikHandle002" />
        <group name="R_ikHandle002" />
        <group name="root_ctrl001" rotation={[Math.PI / 2, 0, 0]} scale={0.01} />
        <group name="R_kneel_ctrl001" rotation={[Math.PI / 2, 0, 0]} scale={0.01} />
        <group name="L_foot_ctrl001" rotation={[Math.PI / 2, 0, 0]} scale={0.01} />
        <group name="L_kneel_ctrl001" rotation={[Math.PI / 2, 0, 0]} scale={0.01} />
        <group name="R_foot_ctrl001" rotation={[Math.PI / 2, 0, 0]} scale={0.01} />
        <group name="L_ikHandle003" />
        <group name="R_ikHandle003" />
      </group>
    </group>
  );
}

useGLTF.preload('models/monkecharacter.glb');