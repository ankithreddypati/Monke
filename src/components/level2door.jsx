import React, { useRef, useEffect, forwardRef, useState } from 'react';
import { useGLTF, useAnimations } from '@react-three/drei';
import { RigidBody } from '@react-three/rapier';
import * as THREE from 'three';
import { audioManager } from '../services/AudioManager';


export const Level2door = forwardRef(({ position }, ref) => {
  const [isOpen, setIsOpen] = useState(false); 
  const group = useRef();
  const { nodes, materials, animations } = useGLTF('models/sci-fi_door_opening_animation-transformed.glb');
  const { actions } = useAnimations(animations, group);

  useEffect(() => {
    if (actions['Default_Open']) {
      actions['Default_Open'].setLoop(THREE.LoopOnce); 
      actions['Default_Open'].clampWhenFinished = true; 
    }
  }, [actions]);

  if (ref) {
    ref.current = {
      isOpen,  // Add this
      playOpenAnimation: () => {
        if (actions['Default_Open']) {
          actions['Default_Open'].reset().play();
          audioManager.playSound('doorOpenSound', { volume: 0.5 });
          setIsOpen(true);  
        }
      }
    };
  }

  return (
    <RigidBody type="fixed" colliders="trimesh">
      <group position={position} scale={6.5}>
        <group ref={group} dispose={null}>
          <group name="Sketchfab_Scene">
            <group name="Object_4" scale={0.01}>
              <group name="ctrl_Upper" position={[-0.642, 260.189, 42.184]} />
              <group name="ctrl_door_right" position={[89.889, 106.45, 42.175]}>
                <group name="ctrl_latch_top_R" position={[-22.637, 49.653, 0]} />
              </group>
              <group name="ctrl_door_left" position={[-87.929, 106.936, 42.175]}>
                <group name="ctrl_latch_btm_mid" position={[75.443, -83.282, 0]} />
                <group name="ctrl_latch_upper_mid" position={[70.654, 5.047, 0]} />
                <group name="ctrl_latch_top_L" position={[22.228, 49.166, 0]} />
              </group>
            </group>
            <group name="_rootJoint" scale={0.01}>
              <group name="Base_Joint_00" position={[0.892, -1.586, -10.433]}>
                <group name="Frame_Left_01" position={[89.108, 108.298, 0]} rotation={[-Math.PI, 0, -2.001]}>
                  <group name="Latch_Upper_Left_02" position={[54.639, 0, 0]} rotation={[-Math.PI, 0, -2.001]} />
                </group>
                <group name="Frame_Right_03" position={[-89.108, 108.299, 0]} rotation={[0, 0, 1.141]}>
                  <group name="Latch_Upper_Right_04" position={[54.638, 0, 0]} rotation={[Math.PI, 0, 1.141]} />
                  <group name="Latch_Mid_Top_05" position={[34.48, -62.208, 0]} rotation={[0, 0, -1.141]} />
                  <group name="Latch_Mid_Btm_06" position={[-46.081, -98.531, 0]} rotation={[0, 0, -1.141]} />
                </group>
                <group name="Upper_Door_Joint_07" position={[-1.536, 261.84, 0.009]} />
              </group>
            </group>
            <group name="Door_Frame" position={[0, 0, -0.112]} scale={0.01}>
              <group name="Door_Top" position={[0.887, 0.11, 0.009]}>
                <group name="Door_info_decals">
                  <mesh name="Door_info_decals_Decals_0" geometry={nodes.Door_info_decals_Decals_0.geometry} material={materials.Decals} />
                </group>
                <mesh name="Door_Top_Mat_Door_Main_0" geometry={nodes.Door_Top_Mat_Door_Main_0.geometry} material={materials.Mat_Door_Main} />
              </group>
              <group name="Door_Left">
                <mesh name="Door_Left_Mat_Door_Main_0" geometry={nodes.Door_Left_Mat_Door_Main_0.geometry} material={materials.Mat_Door_Main} />
                <mesh name="Door_Left_Decals_0" geometry={nodes.Door_Left_Decals_0.geometry} material={materials.Decals} />
              </group>
              <group name="Door_Right">
                <mesh name="Door_Right_Decals_0" geometry={nodes.Door_Right_Decals_0.geometry} material={materials.Decals} />
                <mesh name="Door_Right_Mat_Door_Main_0" geometry={nodes.Door_Right_Mat_Door_Main_0.geometry} material={materials.Mat_Door_Main} />
              </group>
              <group name="Latch_Mid_Top">
                <mesh name="Latch_Mid_Top_Mat_Door_Main_0" geometry={nodes.Latch_Mid_Top_Mat_Door_Main_0.geometry} material={materials.Mat_Door_Main} />
              </group>
              <group name="Latch_Mid_Btm" position={[-1.221, 0, 0]}>
                <mesh name="Latch_Mid_Btm_Mat_Door_Main_0" geometry={nodes.Latch_Mid_Btm_Mat_Door_Main_0.geometry} material={materials.Mat_Door_Main} />
              </group>
              <group name="Latch_Top_Left">
                <mesh name="Latch_Top_Left_Mat_Door_Main_0" geometry={nodes.Latch_Top_Left_Mat_Door_Main_0.geometry} material={materials.Mat_Door_Main} />
              </group>
              <group name="Latch_Top_Right">
                <mesh name="Latch_Top_Right_Mat_Door_Main_0" geometry={nodes.Latch_Top_Right_Mat_Door_Main_0.geometry} material={materials.Mat_Door_Main} />
              </group>
            </group>
            <mesh name="Door_Frame_Mat_Door_Main_0" geometry={nodes.Door_Frame_Mat_Door_Main_0.geometry} material={materials.Mat_Door_Main} position={[0, 0, -0.112]} scale={0.01} />
          </group>
        </group>
      </group>
    </RigidBody>
  );
});

useGLTF.preload('models/sci-fi_door_opening_animation-transformed.glb');
