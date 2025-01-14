

import { createContext, useContext, useState, useRef, useEffect } from 'react';
import { websocketService } from '../services/webSocketService';

const GameContext = createContext(null);
const MAX_ENERGY = 100;
const ENERGY_DECAY_RATE = 1; 
const BANANA_ENERGY_BOOST = 30;
const CRAB_ATTACK_DAMAGE = 20;
const DEATH_RESTART_DELAY = 2000; 

const LEVEL_CONFIG = {
  1: {
    spawnPoint: [1, 10, -1],
  },
  2: {
    spawnPoint: [0, 5, -5],
  },
  3: {
    spawnPoint: [0, 9, 0],
  },
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};

export const GameProvider = ({ children }) => {
  // Game state
  const [gameState, setGameState] = useState('playing');
  const [currentLevel, setCurrentLevel] = useState(1);
  const [completedLevels, setCompletedLevels] = useState(new Set());
  const playerRef = useRef(null);
  
  // Inventory state
  const [inventory, setInventory] = useState([]);
  const [leftHandItem, setLeftHandItem] = useState(null);
  const [rightHandItem, setRightHandItem] = useState(null);
  const [isRubbing, setIsRubbing] = useState(false);
  const rubbingTimer = useRef(null);
  const rubbingStartTime = useRef(null);

  const [gameProgress, setGameProgress] = useState({
    daysSpent: 0,
    currentLevel: 1,
  });

  // Stats state
  const [energy, setEnergy] = useState(MAX_ENERGY);
  const [isDead, setIsDead] = useState(false);
  const [score, setScore] = useState(1);

  // Energy decay and death check
  useEffect(() => {
    if (!isDead && gameState === 'playing') {
      const energyInterval = setInterval(() => {
        setEnergy((prev) => {
          const newEnergy = Math.max(0, prev - (ENERGY_DECAY_RATE / 10));
          if (newEnergy === 0) {
            handleDeath('energy');
          }
          return newEnergy;
        });
      }, 1000);
  
      const scoreInterval = setInterval(() => {
        setScore((prev) => prev + 1);
      }, 60000);
  
      return () => {
        clearInterval(energyInterval);
        clearInterval(scoreInterval);
      };
    }
  }, [isDead, gameState]);

  // Handle death and auto-restart
  useEffect(() => {
    if (isDead) {
      setGameState('game-over');
      
      const restartTimer = setTimeout(() => {
        resetGame();
      }, DEATH_RESTART_DELAY);

      return () => clearTimeout(restartTimer);
    }
  }, [isDead]);

  const handleDeath = (reason = 'energy') => {
    if (isDead) return;
    setIsDead(true);
    setGameState('game-over');
  };

  const resetGame = () => {
    if (playerRef.current) {
      const spawnPoint = LEVEL_CONFIG[currentLevel].spawnPoint;
      playerRef.current.setTranslation({
        x: spawnPoint[0],
        y: spawnPoint[1],
        z: spawnPoint[2]
      }, true);
      playerRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
    }

    setIsDead(false);
    setEnergy(MAX_ENERGY);
    setScore(score); // Maintain the current score
    clearInventory();
    setGameState('playing');
    // Don't reset completed levels or current level on death
  };

  const completeLevel = (levelNumber, user, isConnected) => {
    if (completedLevels.has(levelNumber)) {
      console.log(`Level ${levelNumber} already completed, not sending duplicate data`);
      return;
    }

    if (websocketService.isConnected && user && !user.isGuest && isConnected) {
      websocketService.sendMessage({
        type: 'game_stats',
        data: {
          type: 'level_complete',
          level: levelNumber,
          daysSpent: score,
          timestamp: Date.now()
        }
      });
      
      setCompletedLevels(prev => new Set([...prev, levelNumber]));
    }
    
    setCurrentLevel(prev => prev + 1);
  };

  const eatBanana = () => {
    setEnergy((prev) => Math.min(MAX_ENERGY, prev + BANANA_ENERGY_BOOST));
  };

  const takeDamage = () => {
    if (gameState !== 'playing') return;
    
    setEnergy((prev) => {
      const newEnergy = Math.max(0, prev - CRAB_ATTACK_DAMAGE);
      if (newEnergy === 0) {
        handleDeath('damage');
      }
      return newEnergy;
    });
  };

  // ... [Previous helper functions remain the same]
  const isRock = (item) => item?.type === 'rock';
  const isTorch = (item) => item?.type === 'torch';
  const getRockCount = () => [leftHandItem, rightHandItem].filter(isRock).length;

  // ... [Item management functions remain the same]
  const addItem = (item) => {
    if (gameState !== 'playing') return false;
    
    if (!leftHandItem) {
      setLeftHandItem(item);
      setInventory(prev => [...prev, item]);
      return true;
    } else if (!rightHandItem) {
      setRightHandItem(item);
      setInventory(prev => [...prev, item]);
      return true;
    }
    return false;
  };

  const dropActiveItem = (hand) => {
    if (gameState !== 'playing') return null;
    
    if (hand === 'right') {
      const droppedItem = rightHandItem;
      setRightHandItem(null);
      setInventory(prev => prev.filter(item => item.id !== rightHandItem?.id));
      return droppedItem;
    } else if (hand === 'left') {
      const droppedItem = leftHandItem;
      setLeftHandItem(null);
      setInventory(prev => prev.filter(item => item.id !== leftHandItem?.id));
      return droppedItem;
    } else if (rightHandItem) {
      const droppedItem = rightHandItem;
      setRightHandItem(null);
      setInventory(prev => prev.filter(item => item.id !== rightHandItem.id));
      return droppedItem;
    } else if (leftHandItem) {
      const droppedItem = leftHandItem;
      setLeftHandItem(null);
      setInventory(prev => prev.filter(item => item.id !== leftHandItem.id));
      return droppedItem;
    }
    return null;
  };

  // ... [Rubbing mechanics remain the same]
  const startRubbing = () => {
    if (gameState !== 'playing') return;
    
    const hasEnoughRocks = getRockCount() === 2;
    if (hasEnoughRocks && !isRubbing) {
      setIsRubbing(true);
      rubbingStartTime.current = Date.now();
      rubbingTimer.current = setTimeout(() => {
        const rockItems = [leftHandItem, rightHandItem].filter(isRock);
        rockItems.forEach(rock => {
          if (rock === leftHandItem) setLeftHandItem(null);
          if (rock === rightHandItem) setRightHandItem(null);
          setInventory(prev => prev.filter(item => item.id !== rock.id));
        });
        setIsRubbing(false);
        rubbingTimer.current = null;
        rubbingStartTime.current = null;
      }, 10000);
    }
  };

  const stopRubbing = () => {
    if (isRubbing) {
      clearTimeout(rubbingTimer.current);
      rubbingTimer.current = null;
      rubbingStartTime.current = null;
      setIsRubbing(false);
    }
  };

  const getRubbingProgress = () => {
    if (!isRubbing || !rubbingStartTime.current) return 0;
    const elapsed = Date.now() - rubbingStartTime.current;
    return Math.min(elapsed / 10000, 1);
  };

  const clearInventory = () => {
    setInventory([]);
    setLeftHandItem(null);
    setRightHandItem(null);
    stopRubbing();
  };

  // Updated game completion function
  const completeGame = (user, isConnected) => {
    if (websocketService.isConnected && user && !user.isGuest && isConnected) {
      websocketService.sendMessage({
        type: 'game_stats',
        data: {
          type: 'game_completed',
          daysToComplete: score,
          timestamp: Date.now()
        }
      });
    }
    setGameState('completed');
  };

  const value = {
    // Game state
    gameState,
    setGameState,
    resetGame,
    handleDeath,
    playerRef,
    // Inventory
    inventory,
    leftHandItem,
    rightHandItem,
    leftHandRock: isRock(leftHandItem) ? leftHandItem : null,
    rightHandRock: isRock(rightHandItem) ? rightHandItem : null,
    currentLevel,
    isRubbing,
    completedLevels,
    setCompletedLevels,
    // Functions
    addItem,
    dropActiveItem,
    startRubbing,
    stopRubbing,
    getRubbingProgress,
    clearInventory,
    setCurrentLevel,
    completeLevel,
    completeGame,
    // Stats
    energy,
    isDead,
    score,
    eatBanana,
    takeDamage,
    gameProgress,
  };

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
};