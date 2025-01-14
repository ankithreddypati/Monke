//App.jsx
import { useEffect, useState, useCallback, useRef } from 'react';
import { Canvas } from "@react-three/fiber";
import { Experience } from "./components/Experience";
import { KeyboardControls } from "@react-three/drei";
import { StartScreen } from "./components/StartScreen";
import { GameProvider } from "./context/GameContext";
import { GameUI } from "./components/GameUI";
import { AuthProvider, useAuth } from './context/AuthContext';
import { websocketService } from './services/webSocketService';
import { audioRecorderService } from './services/audioRecorderService';
import { initializeGameSounds } from './services/AudioManager';

const keyboardMap = [
  { name: "forward", keys: ["KeyW"] },
  { name: "backward", keys: [ "KeyS"] },
  { name: "left", keys: ["KeyA"] },
  { name: "right", keys: [ "KeyD"] },
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
  const [wsConnected, setWsConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [currentPosition, setCurrentPosition] = useState([0, 0, 0]);
  const wsRef = useRef(null);
  const connectTimeoutRef = useRef(null);

  const handleWebSocketMessage = useCallback((message) => {
    console.log('WebSocket message received:', message);
    switch (message.type) {
      case 'npc_response':
        const { text, audio, metadata } = message;
        console.log('NPC Response:', {
          text,
          audioLength: audio?.length,
          transcript: metadata?.transcript
        });
        break;
      case 'game_state':
        break;
      case 'error':
        console.error('Server error:', message.error);
        break;
      default:
        console.log('Unhandled message type:', message.type);
    }
  }, []);

  const startRecording = useCallback(async () => {
    if (isRecording || !wsConnected) return;
    try {
      await audioRecorderService.startRecording((audioData) => {
        if (websocketService.isConnected) {
          websocketService.sendAudioMessage(
            audioData.data,
            {
              currentLevel: 1,
              position: currentPosition,
              timestamp: Date.now()
            },
            user?.username,
            "gameId"
          );
        }
      });
      setIsRecording(true);
      console.log('Started recording');
    } catch (error) {
      console.error('Failed to start recording:', error);
    }
  }, [isRecording, wsConnected, user?.username, currentPosition]);

  const stopRecording = useCallback(() => {
    if (!isRecording) return;
    try {
      audioRecorderService.stopRecording();
      setIsRecording(false);
      console.log('Stopped recording');
    } catch (error) {
      console.error('Failed to stop recording:', error);
    }
  }, [isRecording]);

  const connectWebSocket = useCallback(async () => {
    if (wsRef.current || wsConnected) {
      console.log('WebSocket connection already exists or in progress');
      return;
    }

    if (!user?.username) {
      console.log('Waiting for user data before connecting WebSocket');
      return;
    }

    try {
      if (websocketService.isConnected) {
        await websocketService.disconnect();
        setWsConnected(false);
      }

      const connection = await websocketService.connect(
        handleWebSocketMessage,
        user.username,
        user.isGuest === true
      );

      wsRef.current = connection;
      setWsConnected(true);
      setGameStarted(true);
    } catch (error) {
      console.error('WebSocket connection failed:', error);
      wsRef.current = null;
      setWsConnected(false);
      if (error.message === 'Authentication failed') {
        signOut();
      }
    }
  }, [user?.username, handleWebSocketMessage, wsConnected, signOut]);

  const handleGameStart = async (username, authenticatedUser) => {
    if (!authenticatedUser?.username) {
      console.error('Invalid user data');
      return;
    }

    setUser(authenticatedUser);

    if (connectTimeoutRef.current) {
      clearTimeout(connectTimeoutRef.current);
    }

    connectTimeoutRef.current = setTimeout(() => {
      connectWebSocket();
      connectTimeoutRef.current = null;
    }, 500);
  };

  const handleSignOut = async () => {
    if (isRecording) {
      stopRecording();
    }

    if (connectTimeoutRef.current) {
      clearTimeout(connectTimeoutRef.current);
    }

    if (wsRef.current) {
      await websocketService.disconnect();
      wsRef.current = null;
    }

    setWsConnected(false);
    setGameStarted(false);
    await signOut();
  };

  const handlePositionUpdate = useCallback((newPosition) => {
    setCurrentPosition(newPosition);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.code === 'KeyT') {
        if (!isRecording) {
          startRecording();
        }
      }
    };

    const handleKeyUp = (event) => {
      if (event.code === 'KeyT') {
        if (isRecording) {
          stopRecording();
        }
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

  useEffect(() => {
    return () => {
      if (connectTimeoutRef.current) {
        clearTimeout(connectTimeoutRef.current);
      }
      if (wsRef.current) {
        websocketService.disconnect();
        wsRef.current = null;
      }
      setWsConnected(false);
    };
  }, []);

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
            isConnected={wsConnected}
            onPositionUpdate={handlePositionUpdate}
            isRecording={isRecording}
          />
        </Canvas>
        <GameUI 
          user={user} 
          onSignOut={handleSignOut}
          isConnected={wsConnected}
          isRecording={isRecording}
        />
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
