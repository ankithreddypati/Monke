

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
import { NPCController } from "./NPCController";
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
import GameCompletionOverlay from "./GameCompletionOverlay";
import KeypadOverlay from './KeypadOverlay';
import { websocketService } from '../services/webSocketService';

const LEVEL_CONFIG = {
  1: {
    transitionPoint: [43, 5, -190],
    nextLevel: 2,
    spawnPoint: [-5, 10, -60],
  },
  2: {
    transitionPoint: [35, 39, -200],
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
  const { 
    currentLevel: startLevel, 
    setCurrentLevel: setGameLevel, 
    dropActiveItem, 
    leftHandItem, 
    rightHandItem, 
    score,
    completeLevel,
    completedLevels
  } = useGame();

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
  const [isGameComplete, setIsGameComplete] = useState(false);
  const [showVideo, setShowVideo] = useState(true);
  const [playerMovementComplete, setPlayerMovementComplete] = useState(false);
  const [showKeypad, setShowKeypad] = useState(false);
  
  const shadowCameraRef = useRef();
  const playerRef = useRef(null);
  const { camera } = useThree();
  const level2DoorRef = useRef();

  const handleLevelComplete = async (levelNumber) => {
    if (levelNumber === 3) {
      console.log("Game Complete!");
      if (user && !user.isGuest && isConnected) {
        websocketService.sendGameCompletion(score, user.username);
      }
      setIsGameComplete(true);
      return;
    }

    console.log(`Transitioning from level ${levelNumber} to ${LEVEL_CONFIG[levelNumber].nextLevel}`);
    setIsTransitioning(true);

    if (!completedLevels.has(levelNumber)) {
      completeLevel(levelNumber, user, isConnected);
    }

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

  useEffect(() => {
    console.log('audio1Finished state:', audio1Finished);
  }, [audio1Finished]);

  useFrame(() => {
    if (playerRef.current && !isTransitioning) {
      const playerPosition = playerRef.current.translation();
      
      const levelConfig = LEVEL_CONFIG[currentLevel];
      if (levelConfig?.transitionPoint) {
        const [targetX, targetY, targetZ] = levelConfig.transitionPoint;
        
        const isNearTransitionPoint = 
          Math.abs(playerPosition.x - targetX) < 5 && 
          Math.abs(playerPosition.y - targetY) < 5 && 
          Math.abs(playerPosition.z - targetZ) < 5;
        
        if (isNearTransitionPoint) {
          handleLevelComplete(currentLevel);
        }
      }
    }
  });

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

  useFrame(() => {
    if (audio1Finished && !playerMovementComplete) {
      console.log("Moving player after audio1");
      const incubationPosition = new Vector3(4.73, 8, -208.7);
      const playerPosition = playerRef.current.translation();
      
      const distanceToTarget = new Vector3(
        playerPosition.x, 
        playerPosition.y, 
        playerPosition.z
      ).distanceTo(incubationPosition);

      setCurrentAnimation("floating");
  
      console.log('Distance to target:', distanceToTarget);
  
      if (distanceToTarget > 0.5) {
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
        console.log("Player reached destination - Playing audio2");
        setPlayerMovementComplete(true); 
        setPlayerControlsEnabled(false);
        
        setTimeout(() => {
          audioManager.playSound("cutscene_part2", {
            onEnd: () => {
              console.log("Cutscene part 2 audio finished - Showing video");
              if (playerRef.current) {
                setCurrentAnimation('deepsleep');
              }
              setAudio2Finished(true);
              setShowVideo(true);
              setIsGameComplete(true); 
              console.log('Game completion state set:', true);
            },
          });
        }, 500);
      }
    }
  });

  if (audio2Finished && !isGameComplete) {
    console.log('Audio2 finished, setting game complete');
    setIsGameComplete(true);
  }

  useEffect(() => {
    console.log('Game completion state changed:', isGameComplete);
  }, [isGameComplete]);

  const triggerCutscene = () => {
    console.log("Cutscene triggered");
    setCutsceneTriggered(true);
    setCutsceneProgress(0);
    setAudio1Finished(false);
    setAudio2Finished(false);
    setPlayerMovementComplete(false);
    setShowVideo(false);
    
    audioManager.playSound("cutscene_part1", {
      onEnd: () => {
        console.log("Cutscene part 1 audio finished - Starting movement");
        setAudio1Finished(true);
      },
    });

    if (user && !user.isGuest && isConnected) {
      websocketService.sendGameCompletion(score, user.username);
    }
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

      <Physics>
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
            <NPCController
              playerRef={playerRef}
              position={[28.5, 1, -115]}
              defaultAnimation="praying" 
              noticeRange={8}
              talkRange={3}
              walkSpeed={5}
              user={user}
              gameId={gameState?.id}
              gameState={gameState}
              botId={import.meta.env.VITE_LEX_BOT_LEVEL1_ID}
              botAliasId={import.meta.env.VITE_LEX_BOT_ALIAS_LEVEL1_ID}
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
            <Banana id="banana2" position={[43, 5, -190]} />
          </>
        )}

        {currentLevel === 2 && (
          <>
            <Level2 />
            <Level2door 
              ref={level2DoorRef}
              position={[36, 37.9, -199]} 
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

            <KeypadOverlay 
              playerRef={playerRef}
              onCorrectCode={() => {
                if (level2DoorRef.current) {
                  level2DoorRef.current.playOpenAnimation();
                }
              }}
            />

            <NPCController
              playerRef={playerRef}
              position={[64, 37, -144]} 
              defaultAnimation="dance"
              noticeRange={8}
              talkRange={3}
              walkSpeed={5}
              user={user}
              gameId={gameState?.id}
              gameState={gameState}
              botId={import.meta.env.VITE_LEX_BOT_LEVEL2_ID} 
              botAliasId={import.meta.env.VITE_LEX_BOT_ALIAS_LEVEL2_ID} 
            />
            <Banana id="banana13" position={[35, 39, -201]} />
            <Banana id="banana14" position={[54, 37, -143]} />
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

      {isGameComplete && (
        <GameCompletionOverlay 
          score={score}
          onRestart={() => {
            setCurrentLevel(1);
            setGameLevel(1);
            setIsGameComplete(false);
            setCutsceneTriggered(false);
            setAudio1Finished(false);
            setAudio2Finished(false);
            setShowVideo(false);
            setPlayerMovementComplete(false);
            setCurrentAnimation("orcidle");
            
            if (playerRef.current) {
              const spawnPoint = LEVEL_CONFIG[1].spawnPoint;
              playerRef.current.setTranslation({
                x: spawnPoint[0],
                y: spawnPoint[1],
                z: spawnPoint[2],
              });
            }
          }}
          user={user}
        />
      )}

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