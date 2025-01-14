


import { useEffect, useState, useCallback } from 'react';
import { Canvas } from "@react-three/fiber";
import { Experience } from "./components/Experience";
import { KeyboardControls } from "@react-three/drei";
import { StartScreen } from "./components/StartScreen";
import { GameProvider } from "./context/GameContext";
import { GameUI } from "./components/GameUI";
import { AuthProvider, useAuth } from './context/AuthContext';
import { audioRecorderService } from './services/audioRecorderService';
import { initializeGameSounds } from './services/AudioManager';
import { audioManager } from './services/AudioManager';
import { gameService } from './services/gameService';
import GameCompletionStats from './components/GameCompletionStats';

const keyboardMap = [
  { name: "forward", keys: ["KeyW"] },
  { name: "backward", keys: ["KeyS"] },
  { name: "left", keys: ["KeyA"] },
  { name: "right", keys: ["KeyD"] },
  { name: "run", keys: ["Shift"] },
  { name: "jump", keys: ["Space"] },
  { name: "talk", keys: ["KeyT"] },
  { name: "pickup", keys: ["KeyF"] },
  { name: "drop", keys: ["KeyG"] },
  { name: "action", keys: ["KeyR"] }
];

function GameComponent() {
  const { user, isAuthenticated, signOut, setUser } = useAuth();
  const [gameStarted, setGameStarted] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [currentPosition, setCurrentPosition] = useState([0, 0, 0]);
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [showCompletion, setShowCompletion] = useState(false);
  const [gameScore, setGameScore] = useState(0);


  // State monitor for debugging
  useEffect(() => {
    console.log('State changed:', {
      hasUser: !!user,
      username: user?.username,
      gameStarted
    });
  }, [user, gameStarted]);

  const handleGameStart = async (username, authenticatedUser) => {
    console.log('handleGameStart called:', { username, authenticatedUser });
    
    if (!authenticatedUser?.username) {
      console.error('Invalid user data');
      return;
    }

    try {
      setUser(authenticatedUser);
      setGameStarted(true);
      console.log('Game started with user:', authenticatedUser.username);

      // Fetch initial leaderboard data
      if (!authenticatedUser.isGuest) {
        const leaderboard = await gameService.getLeaderboard();
        setLeaderboardData(leaderboard);
      }
    } catch (error) {
      console.error('Error during game start:', error);
    }
  };

  const startRecording = useCallback(async () => {
    if (isRecording) return;
    try {
      audioManager.setVolume('backgroundSound', 0.05);
      await audioRecorderService.startRecording();
      setIsRecording(true);
      console.log('Started recording');
    } catch (error) {
      console.error('Failed to start recording:', error);
    }
  }, [isRecording]);

  const stopRecording = useCallback(() => {
    if (!isRecording) return;
    try {
      audioRecorderService.stopRecording();
      audioManager.setVolume('backgroundSound', 0.5);
      setIsRecording(false);
      console.log('Stopped recording');
    } catch (error) {
      console.error('Failed to stop recording:', error);
    }
  }, [isRecording]);

  const handleSignOut = async () => {
    if (isRecording) {
      stopRecording();
    }
    setGameStarted(false);
    setLeaderboardData([]);
    await signOut();
  };

  const handlePositionUpdate = useCallback((newPosition) => {
    setCurrentPosition(newPosition);
  }, []);

  const handleGameComplete = (score) => {
    setGameScore(score);
    setShowCompletion(true);
  };

  const handleRestart = () => {
    setShowCompletion(false);
    setGameScore(0);
    setGameStarted(true);
  };

  // Background music handler
  useEffect(() => {
    if (gameStarted) {
      if (!audioManager.isPlaying('backgroundSound')) {
        audioManager.playSound('backgroundSound', {
          loop: true,     
          volume: 0.3,     
        });
      }
    } else {
      audioManager.stopSound('backgroundSound');
    }
    
    return () => {
      audioManager.stopSound('backgroundSound');
    };
  }, [gameStarted]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.code === 'KeyT' && !isRecording) {
        startRecording();
      }
    }; 

    const handleKeyUp = (event) => {
      if (event.code === 'KeyT' && isRecording) {
        stopRecording();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (isRecording) {
        stopRecording();
      }
    };
  }, [isRecording, startRecording, stopRecording]);

  if (!isAuthenticated || !user) {
    return <StartScreen onStart={handleGameStart} />;
  }

  return (
    <>
      <KeyboardControls map={keyboardMap}>
        <Canvas
          shadows
          camera={{
            position: [3, 3, 3],
            near: 0.1,
            zoom: 0.7,
            fov: 60
          }}
        >
          <color attach="background" args={["#ececec"]} />
          <Experience 
            playerName={user.username} 
            gameStarted={gameStarted}
            user={user}
            onPositionUpdate={handlePositionUpdate}
            isRecording={isRecording}
            leaderboardData={leaderboardData}
            onGameComplete={handleGameComplete} 
          />
        </Canvas>
        <GameUI 
          user={user} 
          onSignOut={handleSignOut}
          isRecording={isRecording}
        />
          {showCompletion && (
            <GameCompletionStats
              score={gameScore}
              onRestart={handleRestart}
              user={user}
              gameService={gameService}
            />
          )}
       

      </KeyboardControls>
      
    </>
  );
}

function App() {
  useEffect(() => {
    initializeGameSounds().catch(console.error);
  }, []);

  return (
    <AuthProvider>
      <GameProvider>
        <div style={{ 
          position: 'relative', 
          width: '100vw', 
          height: '100vh',
          overflow: 'hidden'
        }}>
          <GameComponent />
        </div>
      </GameProvider>
    </AuthProvider>
  );
}

export default App;