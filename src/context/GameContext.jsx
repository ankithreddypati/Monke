// // src/context/GameContext.jsx
// import { createContext, useContext, useState, useRef, useEffect } from 'react';

// const GameContext = createContext(null);
// const MAX_ENERGY = 100;
// const ENERGY_DECAY_RATE = 1; 
// const BANANA_ENERGY_BOOST = 30;
// const CRAB_ATTACK_DAMAGE = 20;

// export const useGame = () => {
//   const context = useContext(GameContext);
//   if (!context) {
//     throw new Error('useGame must be used within a GameProvider');
//   }
//   return context;
// };

// export const GameProvider = ({ children }) => {
//   // Existing state
//   const [inventory, setInventory] = useState([]);
//   const [leftHandItem, setLeftHandItem] = useState(null);
//   const [rightHandItem, setRightHandItem] = useState(null);
//   const [currentLevel, setCurrentLevel] = useState(1);
//   const [isRubbing, setIsRubbing] = useState(false);
//   const rubbingTimer = useRef(null);
//   const rubbingStartTime = useRef(null);

//   // Stats state
//   const [energy, setEnergy] = useState(MAX_ENERGY);
//   const [isDead, setIsDead] = useState(false);
//   const [score, setScore] = useState(40000); // Starting year BCE

//  // Energy decay effect
//  useEffect(() => {
//     if (!isDead) {
//       console.log("Starting energy decay interval");
//       const interval = setInterval(() => {
//         console.log("Decaying energy");
//         setEnergy((prev) => {
//           const newEnergy = Math.max(0, prev - (ENERGY_DECAY_RATE / 10));
//           if (newEnergy === 0) {
//             setIsDead(true);
//           }
//           return newEnergy;
//         });
        
//         setScore(prev => prev - 1);
//       }, 1000); 
  
//       return () => {
//         console.log("Clearing energy decay interval");
//         clearInterval(interval);
//       };
//     }
//   }, [isDead]);
  

//   // Reset game effect
//   useEffect(() => {
//     if (isDead) {
//       const timer = setTimeout(() => {
//         setIsDead(false);
//         setEnergy(MAX_ENERGY);
//         setScore(50000);
//         clearInventory();
//       }, 3000);
//       return () => clearTimeout(timer);
//     }
//   }, [isDead]);

//   // Energy management
//   const eatBanana = () => {
//     setEnergy((prev) => Math.min(MAX_ENERGY, prev + BANANA_ENERGY_BOOST));
//   };

//   const takeDamage = () => {
//     console.log("Taking damage from crab, current energy:", energy);
//     setEnergy((prev) => {
//       const newEnergy = Math.max(0, prev - CRAB_ATTACK_DAMAGE);
//       console.log("Energy after crab damage:", newEnergy, "Damage dealt:", CRAB_ATTACK_DAMAGE);
//       if (newEnergy === 0) {
//         console.log("Player died from crab attack");
//         setIsDead(true);
//       }
//       return newEnergy;
//     });
//   };

//   // Helper functions
//   const isRock = (item) => item?.type === 'rock';
//   const isTorch = (item) => item?.type === 'torch';
//   const getRockCount = () => [leftHandItem, rightHandItem].filter(isRock).length;

//   // Inventory management
//   const addItem = (item) => {
//     if (!leftHandItem) {
//       setLeftHandItem(item);
//       setInventory(prev => [...prev, item]);
//       return true;
//     } else if (!rightHandItem) {
//       setRightHandItem(item);
//       setInventory(prev => [...prev, item]);
//       return true;
//     }
//     return false;
//   };

//   const dropActiveItem = (hand) => {
//     if (hand === 'right') {
//       const droppedItem = rightHandItem;
//       setRightHandItem(null);
//       setInventory(prev => prev.filter(item => item.id !== rightHandItem?.id));
//       return droppedItem;
//     } else if (hand === 'left') {
//       const droppedItem = leftHandItem;
//       setLeftHandItem(null);
//       setInventory(prev => prev.filter(item => item.id !== leftHandItem?.id));
//       return droppedItem;
//     } else if (rightHandItem) {
//       // Legacy support for position-based dropping
//       const droppedItem = rightHandItem;
//       setRightHandItem(null);
//       setInventory(prev => prev.filter(item => item.id !== rightHandItem.id));
//       return droppedItem;
//     } else if (leftHandItem) {
//       const droppedItem = leftHandItem;
//       setLeftHandItem(null);
//       setInventory(prev => prev.filter(item => item.id !== leftHandItem.id));
//       return droppedItem;
//     }
//     return null;
//   };

//   // Rubbing mechanics
//   const startRubbing = () => {
//     const hasEnoughRocks = getRockCount() === 2;
//     if (hasEnoughRocks && !isRubbing) {
//       setIsRubbing(true);
//       rubbingStartTime.current = Date.now();
//       rubbingTimer.current = setTimeout(() => {
//         const rockItems = [leftHandItem, rightHandItem].filter(isRock);
//         rockItems.forEach(rock => {
//           if (rock === leftHandItem) setLeftHandItem(null);
//           if (rock === rightHandItem) setRightHandItem(null);
//           setInventory(prev => prev.filter(item => item.id !== rock.id));
//         });
//         setIsRubbing(false);
//         rubbingTimer.current = null;
//         rubbingStartTime.current = null;
//       }, 10000);
//     }
//   };

//   const stopRubbing = () => {
//     if (isRubbing) {
//       clearTimeout(rubbingTimer.current);
//       rubbingTimer.current = null;
//       rubbingStartTime.current = null;
//       setIsRubbing(false);
//     }
//   };

//   const getRubbingProgress = () => {
//     if (!isRubbing || !rubbingStartTime.current) return 0;
//     const elapsed = Date.now() - rubbingStartTime.current;
//     return Math.min(elapsed / 10000, 1);
//   };

//   const clearInventory = () => {
//     setInventory([]);
//     setLeftHandItem(null);
//     setRightHandItem(null);
//     stopRubbing();
//   };

//   const value = {
//     // Existing values
//     inventory,
//     leftHandItem,
//     rightHandItem,
//     leftHandRock: isRock(leftHandItem) ? leftHandItem : null,
//     rightHandRock: isRock(rightHandItem) ? rightHandItem : null,
//     currentLevel,
//     isRubbing,
//     addItem,
//     dropActiveItem,
//     startRubbing,
//     stopRubbing,
//     getRubbingProgress,
//     clearInventory,
//     setCurrentLevel,
//     // Stats values
//     energy,
//     isDead,
//     score,
//     eatBanana,
//     takeDamage
//   };

//   return (
//     <GameContext.Provider value={value}>
//       {children}
//     </GameContext.Provider>
//   );
// };


// src/context/GameContext.jsx
import { createContext, useContext, useState, useRef, useEffect } from 'react';
import { gameStateService } from '../services/gameStateService';
import awsConfig from '../config/aws-config';

const GameContext = createContext(null);
const MAX_ENERGY = 100;
const ENERGY_DECAY_RATE = 1; 
const BANANA_ENERGY_BOOST = 30;
const CRAB_ATTACK_DAMAGE = 20;
const DEATH_RESTART_DELAY = 2000; // 2 seconds delay before restart

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
  const [gameState, setGameState] = useState('playing'); // 'playing', 'game-over'
  const [currentLevel, setCurrentLevel] = useState(1);
  const playerRef = useRef(null);
  
  // Inventory state
  const [inventory, setInventory] = useState([]);
  const [leftHandItem, setLeftHandItem] = useState(null);
  const [rightHandItem, setRightHandItem] = useState(null);
  const [isRubbing, setIsRubbing] = useState(false);
  const rubbingTimer = useRef(null);
  const rubbingStartTime = useRef(null);

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
    // Respawn at current level's spawn point
    if (playerRef.current) {
      const spawnPoint = LEVEL_CONFIG[currentLevel].spawnPoint;
      playerRef.current.setTranslation({
        x: spawnPoint[0],
        y: spawnPoint[1],
        z: spawnPoint[2]
      }, true);

      // Reset velocity to prevent momentum carrying over
      playerRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
    }

    setIsDead(false);
    setEnergy(MAX_ENERGY);
    setScore(score); // Maintain the current score
    clearInventory();
    setGameState('playing');
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

  const isRock = (item) => item?.type === 'rock';
  const isTorch = (item) => item?.type === 'torch';
  const getRockCount = () => [leftHandItem, rightHandItem].filter(isRock).length;

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
    // Functions
    addItem,
    dropActiveItem,
    startRubbing,
    stopRubbing,
    getRubbingProgress,
    clearInventory,
    setCurrentLevel,
    // Stats
    energy,
    isDead,
    score,
    eatBanana,
    takeDamage
  };

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
};