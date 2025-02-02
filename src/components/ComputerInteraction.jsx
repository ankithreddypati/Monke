import React, { useState, useEffect } from "react";
import { Html } from "@react-three/drei";
import { Vector3 } from "three";
import PacmanGame from "./PacmanGame";

const INTERACTION_DISTANCE = 2;
const COMPUTER_POSITION = new Vector3(54, 37, -143);

const ComputerInteraction = ({ playerRef }) => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const handleKeyPress = (event) => {
      if (event.code === "KeyF" && showPrompt && !isPlaying) {
        event.preventDefault();
        setIsPlaying(true);
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [showPrompt, isPlaying]);

  useEffect(() => {
    const checkDistance = () => {
      if (!playerRef.current) return;

      const playerPosition = playerRef.current.translation();
      const playerVec = new Vector3(playerPosition.x, playerPosition.y, playerPosition.z);
      const distance = playerVec.distanceTo(COMPUTER_POSITION);
      const withinRange = distance < INTERACTION_DISTANCE;

      if (!withinRange && isPlaying) {
        setIsPlaying(false);
      }
      setShowPrompt(withinRange && !isPlaying);
    };

    const interval = setInterval(checkDistance, 100);
    return () => clearInterval(interval);
  }, [playerRef, isPlaying]);

  const handleExitGame = () => {
    setIsPlaying(false);
  };

  return (
    <>
            {showPrompt && (
        <Html position={[COMPUTER_POSITION.x, COMPUTER_POSITION.y + 2, COMPUTER_POSITION.z]} center>
          <div
            style={{
              padding: '16px',
              backgroundColor: 'rgba(1,1,1,1)',
              color: 'white',
              borderRadius: '8px',
              fontSize: '18px',
              textAlign: 'center',
              whiteSpace: 'nowrap'
            }}
          >
            Press F to play
          </div>
        </Html>
      )}


      {isPlaying && (
        <Html
          position={[COMPUTER_POSITION.x, COMPUTER_POSITION.y + 2, COMPUTER_POSITION.z]}
          center
          className="w-[600px] h-[500px]"
        >
          <div className="bg-black p-4 rounded-lg w-full h-full">
            <PacmanGame 
              isPlaying={isPlaying}
              onExit={handleExitGame}
            />
          </div>
        </Html>
      )}
    </>
  );
};

export default ComputerInteraction;