// // Experience.jsx


import { useState, useRef, useEffect } from "react";
import { Environment, OrthographicCamera, Html, Stats } from "@react-three/drei";
import { Physics } from "@react-three/rapier";
import { useFrame, useThree } from "@react-three/fiber";
import { Vector3 } from "three";
import { Skybox } from "./Skybox";
import { CharacterController } from "./CharacterController";
import { Level1 } from "./Level1";
import { Level2 } from "./Level2";
import { Level3 } from "./Level3";
import { Level1NPCController } from "./Level1NPCController";
import { CrabController } from "./CrabController";
import { Rock } from "./Rock";
import { Fire } from "./fire";
import { useGame } from "../context/GameContext";
import { Torch } from "./Torch";
import { Banana } from "./Banana";
import { Level2door } from "./level2door";
import { RobotController } from "./RobotController";
import { audioManager } from "../services/AudioManager";
import ComputerInteraction from "./ComputerInteraction";

const LEVEL_CONFIG = {
  1: {
    transitionPoint: [43, 5, -190],
    nextLevel: 2,
    spawnPoint: [-5, 10, -60],
  },
  2: {
    transitionPoint: [35, 39, -199],
    nextLevel: 3,
    spawnPoint: [0, 5, -5],
  },
  3: {
    transitionPoint: null,
    nextLevel: null,
    spawnPoint: [0, 9, 0],
  },
};

export const Experience = ({ playerName, gameStarted, user, isConnected, gameState }) => {
  const { currentLevel: startLevel, setCurrentLevel: setGameLevel, dropActiveItem, leftHandItem, rightHandItem } = useGame();
  const [currentAnimation, setCurrentAnimation] = useState("orcidle");
  const [currentLevel, setCurrentLevel] = useState(startLevel);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [fireVisible, setFireVisible] = useState(false);
  const [torchLit, setTorchLit] = useState(false);
  const [cutsceneTriggered, setCutsceneTriggered] = useState(false);
  const [cutsceneProgress, setCutsceneProgress] = useState(0);
  const [audio1Finished, setAudio1Finished] = useState(false);
  const [audio2Finished, setAudio2Finished] = useState(false);
  const [playerControlsEnabled, setPlayerControlsEnabled] = useState(true);
  const [showVideo, setShowVideo] = useState(true);
  const [playerMovementComplete, setPlayerMovementComplete] = useState(false);
  const shadowCameraRef = useRef();
  const playerRef = useRef(null);
  const { camera } = useThree();
  const level2DoorRef = useRef();

  useEffect(() => {
    console.log('audio1Finished state:', audio1Finished);
  }, [audio1Finished]);

  // Level transition check
  useFrame(() => {
    if (playerRef.current && !isTransitioning) {
      const playerPosition = playerRef.current.translation();
      // console.log('Player position:', playerPosition);
      
      const levelConfig = LEVEL_CONFIG[currentLevel];
      if (levelConfig?.transitionPoint) {
        const [targetX, targetY, targetZ] = levelConfig.transitionPoint;
        
        const isNearTransitionPoint = 
          Math.abs(playerPosition.x - targetX) < 5 && 
          Math.abs(playerPosition.y - targetY) < 5 && 
          Math.abs(playerPosition.z - targetZ) < 5;
        
        // console.log('Near transition point:', isNearTransitionPoint);
        
        if (isNearTransitionPoint) {
          handleLevelComplete(currentLevel);
        }
      }
    }
  });

  // Cutscene check in Level 3
  useFrame(() => {
    if (currentLevel === 3 && !cutsceneTriggered) {
      const playerPosition = playerRef.current.translation();
      const playerVector = new Vector3(playerPosition.x, playerPosition.y, playerPosition.z);

      const triggerPoint = new Vector3(4.5, 5, -178);
      if (playerVector.distanceTo(triggerPoint) < 2) {
        triggerCutscene();
      }
    }
  });

  // Cutscene animation
  useFrame(() => {
    // Force movement after audio1 is finished
    if (audio1Finished && !playerMovementComplete) {
      console.log("Moving player after audio1");
      const incubationPosition = new Vector3(4.73, 8, -208.7);
      const playerPosition = playerRef.current.translation();
      
      // Calculate distance to target
      const distanceToTarget = new Vector3(
        playerPosition.x, 
        playerPosition.y, 
        playerPosition.z
      ).distanceTo(incubationPosition);
  
      console.log('Distance to target:', distanceToTarget);
  
      // Changed distance threshold to be more generous
      if (distanceToTarget > 0.5) {  // Changed from 0.1 to 0.5
        const newPosition = new Vector3(playerPosition.x, playerPosition.y, playerPosition.z);
        newPosition.lerp(incubationPosition, 0.02);
        playerRef.current.setTranslation(newPosition, true);
  
        const cameraTarget = new Vector3(
          newPosition.x+10,
          newPosition.y + 8,
          newPosition.z + 15
        );
        camera.position.lerp(cameraTarget, 0.02);
        camera.lookAt(newPosition);
      } else {
        // Player has reached destination
        console.log("Player reached destination - Playing audio2");
        setPlayerMovementComplete(true);  // This stops the movement
        setPlayerControlsEnabled(false);
        
        // Add a small delay before playing audio2
        setTimeout(() => {
          audioManager.playSound("cutscene_part2", {
            onEnd: () => {
              console.log("Cutscene part 2 audio finished - Showing video");
              if (playerRef.current) {
                setCurrentAnimation('deepsleep');
              }
              setAudio2Finished(true);
              setShowVideo(true);
            },
          });
        }, 500);  // 500ms delay
      }
    }
  });

  const handleLevelComplete = async (levelNumber) => {
    if (levelNumber === 3) {
      console.log("Game Complete!");
      return;
    }

    console.log(`Transitioning from level ${levelNumber} to ${LEVEL_CONFIG[levelNumber].nextLevel}`);
    setIsTransitioning(true);
    if (leftHandItem) {
      dropActiveItem('left');
    }
    if (rightHandItem) {
      dropActiveItem('right');
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const nextLevel = LEVEL_CONFIG[levelNumber].nextLevel;
    setCurrentLevel(nextLevel);
    setGameLevel(nextLevel);

    if (playerRef.current) {
      const spawnPoint = LEVEL_CONFIG[nextLevel].spawnPoint;
      playerRef.current.setTranslation({
        x: spawnPoint[0],
        y: spawnPoint[1],
        z: spawnPoint[2],
      });
      console.log('Player spawned at:', spawnPoint);
    }

    setTimeout(() => {
      setIsTransitioning(false);
      console.log('Transition complete');
    }, 100);
  };

  const triggerCutscene = () => {
    console.log("Cutscene triggered");
    // Reset all states
    setCutsceneTriggered(true);
    setCutsceneProgress(0);
    setAudio1Finished(false);
    setAudio2Finished(false);
    setPlayerMovementComplete(false);
    setShowVideo(false);
    
    // Play the first cutscene audio
    audioManager.playSound("cutscene_part1", {
      onEnd: () => {
        console.log("Cutscene part 1 audio finished - Starting movement");
        setAudio1Finished(true);  // This will trigger the movement
      },
    });
  };

  return (
    <>
      <Stats />
      <Environment preset="sunset" />
      <directionalLight
        intensity={0.65}
        castShadow
        position={[-15, 10, 15]}
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-bias={-0.00005}
      >
        <OrthographicCamera
          left={-30}
          right={15}
          top={40}
          bottom={-30}
          ref={shadowCameraRef}
          attach={"shadow-camera"}
        />
      </directionalLight>

      <Physics debug>
        <Skybox />
        <CharacterController
          ref={playerRef}
          position={LEVEL_CONFIG[currentLevel].spawnPoint}
          animation={currentAnimation} 
          onRubRocks={() => {
            setFireVisible(true);
            setTorchLit(true);
          }}
        />

        {currentLevel === 1 && (
          <>
            <Level1 />
            <CrabController 
              position={[33.5, 1, -157]} 
              playerRef={playerRef} 
              chaseRange={10} 
              attackRange={2} 
              speed={4} 
            />
            <Level1NPCController
              playerRef={playerRef}
              position={[28.5, 1, -115]}
              noticeRange={8}
              talkRange={3}
              walkSpeed={5}
              user={user}
              gameId={gameState?.id}
              gameState={gameState}
            />
            <Rock id="rock1" position={[23.5, -0.5, -92]} playerRef={playerRef} />
            <Rock id="rock2" position={[36, -0.5, -96.5]} playerRef={playerRef} />
            <Fire id="fire1" position={[37.5, 0.8, -119.0]} visible={fireVisible} scale={6} />
            <Torch
              id="torch1"
              position={[39.5, -0, -117.0]}
              scale={0.9}
              rotation={[0, -Math.PI / 2, 0]}
              isLit={torchLit}
              playerRef={playerRef}
            />
            <Banana id="banana1" position={[2, 0, -10.0]} />
            <Banana id="banana2" position={[43, 5, -190]} />
          </>
        )}

                {currentLevel === 2 && (
                  <>
                    <Level2 />
                    <Level2door 
                      ref={level2DoorRef}
                      position={[35, 37.9, -199]} 
                      playerRef={playerRef} 
                    />
                    <ComputerInteraction 
                      playerRef={playerRef}
                      onScoreReached={() => {
                        if (level2DoorRef.current) {
                          level2DoorRef.current.playOpenAnimation();
                        }
                      }}
                    />
                    <Banana id="banana13" position={[35, 39, -199]} />
                                {/* <Banana id="banana14" position={[54, 37, -143]} /> */}

                  </>
                )}


       

        {currentLevel === 3 && (
          <>
            <Level3 showVideo={showVideo} />
            <RobotController 
              position={[14, 2, -81]} 
              playerRef={playerRef} 
              chaseRange={15} 
              attackRange={3} 
              speed={3} 
            />
            <Banana id="banana7" position={[2.5, -3, -18]} />
            <Banana id="banana8" position={[4.5, -5, -158]} />
          </>
        )}
      </Physics>

      {isTransitioning && (
        <Html fullscreen>
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              background: "black",
              opacity: 1,
              transition: "opacity 1s",
              zIndex: 1000,
            }}
          />
        </Html>
      )}
    </>
  );
};