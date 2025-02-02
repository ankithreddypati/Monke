import React, { useState, useEffect, useRef } from "react";

const PacmanGame = ({ isPlaying, onExit }) => {
  const canvasRef = useRef(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const requestRef = useRef();
  const keysRef = useRef({});
  const WINNING_SCORE = 1337;
  
  const gameStateRef = useRef({
    pacman: {
      x: 45,
      y: 45,
      dx: 0,
      dy: 0,
      radius: 11,
      speed: 4,
    },
    ghosts: [
      { x: 105, y: 105, color: "red", dx: 1.5, dy: 0, speed: 1.5 },
      { x: 345, y: 345, color: "blue", dx: -1.5, dy: 0, speed: 1.5 }
    ],
    pellets: [],
    powerPellets: [],
    map: [
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1, 0, 1],
      [1, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 1],
      [1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1],
      [1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1],
      [1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1],
      [1, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 1],
      [1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1],
      [1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1],
      [1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1],
      [1, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 1],
      [1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1, 0, 1],
      [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    ]
  });

  // Initialize game state
  useEffect(() => {
    if (isPlaying && !gameStarted) {
      const CELL_SIZE = 30;
      const canvas = canvasRef.current;
      canvas.width = gameStateRef.current.map[0].length * CELL_SIZE;
      canvas.height = gameStateRef.current.map.length * CELL_SIZE;

      // Initialize pellets and power pellets
      gameStateRef.current.pellets = [];
      gameStateRef.current.powerPellets = [];
      
      for (let row = 0; row < gameStateRef.current.map.length; row++) {
        for (let col = 0; col < gameStateRef.current.map[0].length; col++) {
          if (gameStateRef.current.map[row][col] === 0) {
            gameStateRef.current.pellets.push({
              x: col * CELL_SIZE + CELL_SIZE / 2,
              y: row * CELL_SIZE + CELL_SIZE / 2,
              active: true,
            });
          } else if (gameStateRef.current.map[row][col] === 2) {
            gameStateRef.current.powerPellets.push({
              x: col * CELL_SIZE + CELL_SIZE / 2,
              y: row * CELL_SIZE + CELL_SIZE / 2,
              active: true,
            });
          }
        }
      }

      setGameStarted(true);
      setGameOver(false);
      setGameWon(false);
      setScore(0);
    }
  }, [isPlaying, gameStarted]);

  const checkWallCollision = (x, y) => {
    const CELL_SIZE = 30;
    const { map, pacman } = gameStateRef.current;
    const gridX = Math.floor(x / CELL_SIZE);
    const gridY = Math.floor(y / CELL_SIZE);
    
    const cellsToCheck = [
      { x: gridX, y: gridY },
      { x: gridX + 1, y: gridY },
      { x: gridX - 1, y: gridY },
      { x: gridX, y: gridY + 1 },
      { x: gridX, y: gridY - 1 }
    ];

    for (const cell of cellsToCheck) {
      if (cell.x >= 0 && cell.x < map[0].length && 
          cell.y >= 0 && cell.y < map.length && 
          map[cell.y][cell.x] === 1) {
        
        const wallX = cell.x * CELL_SIZE;
        const wallY = cell.y * CELL_SIZE;
        const closestX = Math.max(wallX, Math.min(x, wallX + CELL_SIZE));
        const closestY = Math.max(wallY, Math.min(y, wallY + CELL_SIZE));
        const distanceX = x - closestX;
        const distanceY = y - closestY;
        const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);
        
        if (distance < pacman.radius + 1) {
          return true;
        }
      }
    }
    return false;
  };

  const movePacman = () => {
    const { pacman } = gameStateRef.current;
    const CELL_SIZE = 30;
  
    // Handle directional input
    if (keysRef.current.ArrowLeft) {
      pacman.dx = -pacman.speed;
      pacman.dy = 0;
    }
    if (keysRef.current.ArrowRight) {
      pacman.dx = pacman.speed;
      pacman.dy = 0;
    }
    if (keysRef.current.ArrowUp) {
      pacman.dx = 0;
      pacman.dy = -pacman.speed;
    }
    if (keysRef.current.ArrowDown) {
      pacman.dx = 0;
      pacman.dy = pacman.speed;
    }
  
    const nextX = pacman.x + pacman.dx;
    const nextY = pacman.y + pacman.dy;
  
    // Check for wall collision
    if (!checkWallCollision(nextX, nextY)) {
      pacman.x = nextX;
      pacman.y = nextY;
    } else {
      // Auto-align Pacman to the center of the nearest path
      if (pacman.dx !== 0) {
        const gridY = Math.round(pacman.y / CELL_SIZE) * CELL_SIZE + CELL_SIZE / 2;
        if (!checkWallCollision(nextX, gridY)) {
          pacman.y = gridY; // Snap to center
        }
      }
      if (pacman.dy !== 0) {
        const gridX = Math.round(pacman.x / CELL_SIZE) * CELL_SIZE + CELL_SIZE / 2;
        if (!checkWallCollision(gridX, nextY)) {
          pacman.x = gridX; // Snap to center
        }
      }
    }
  };

  const moveGhosts = () => {
    gameStateRef.current.ghosts.forEach((ghost) => {
      const nextX = ghost.x + ghost.dx;
      const nextY = ghost.y + ghost.dy;

      if (checkWallCollision(nextX, nextY)) {
        const directions = [
          { dx: ghost.speed, dy: 0 },
          { dx: -ghost.speed, dy: 0 },
          { dx: 0, dy: ghost.speed },
          { dx: 0, dy: -ghost.speed },
        ];
        
        const validDirections = directions.filter(dir => 
          !checkWallCollision(ghost.x + dir.dx, ghost.y + dir.dy)
        );

        if (validDirections.length > 0) {
          const newDir = validDirections[Math.floor(Math.random() * validDirections.length)];
          ghost.dx = newDir.dx;
          ghost.dy = newDir.dy;
        }
      } else {
        ghost.x = nextX;
        ghost.y = nextY;
      }

      // Increased ghost collision radius for easier gameplay
      const distance = Math.sqrt(
        Math.pow(ghost.x - gameStateRef.current.pacman.x, 2) + 
        Math.pow(ghost.y - gameStateRef.current.pacman.y, 2)
      );
      if (distance < gameStateRef.current.pacman.radius * 1.5) {
        setGameOver(true);
      }
    });
  };

  const drawWalls = (ctx) => {
    const CELL_SIZE = 30;
    ctx.fillStyle = "#0000FF";
    gameStateRef.current.map.forEach((row, y) => {
      row.forEach((cell, x) => {
        if (cell === 1) {
          ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        }
      });
    });
  };

  const drawPellets = (ctx) => {
    // Regular pellets
    ctx.fillStyle = "#FFFFFF";
    gameStateRef.current.pellets.forEach((pellet) => {
      if (pellet.active) {
        ctx.beginPath();
        ctx.arc(pellet.x, pellet.y, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // Power pellets (larger and flashing)
    const flash = Math.floor(Date.now() / 200) % 2 === 0;
    if (flash) {
      ctx.fillStyle = "#FFFF00";
      gameStateRef.current.powerPellets.forEach((pellet) => {
        if (pellet.active) {
          ctx.beginPath();
          ctx.arc(pellet.x, pellet.y, 6, 0, Math.PI * 2);
          ctx.fill();
        }
      });
    }
  };

  const drawPacman = (ctx) => {
    const { pacman } = gameStateRef.current;
    ctx.fillStyle = "#FFFF00";
    ctx.beginPath();
    
    // Animated mouth
    const mouthSpeed = 0.1;
    const mouthSize = 0.3 * (1 + Math.sin(Date.now() * mouthSpeed));
    const angle = Math.atan2(pacman.dy, pacman.dx);
    
    ctx.arc(
      pacman.x,
      pacman.y,
      pacman.radius,
      angle + mouthSize,
      angle + (Math.PI * 2) - mouthSize
    );
    ctx.lineTo(pacman.x, pacman.y);
    ctx.fill();
  };

  const drawGhosts = (ctx) => {
    gameStateRef.current.ghosts.forEach((ghost) => {
      ctx.fillStyle = ghost.color;
      ctx.beginPath();
      ctx.arc(ghost.x, ghost.y, gameStateRef.current.pacman.radius, 0, Math.PI * 2);
      ctx.fill();
    });
  };

  const checkCollisions = () => {
    // Regular pellets
    gameStateRef.current.pellets.forEach((pellet) => {
      if (pellet.active) {
        const distance = Math.sqrt(
          Math.pow(pellet.x - gameStateRef.current.pacman.x, 2) + 
          Math.pow(pellet.y - gameStateRef.current.pacman.y, 2)
        );
        if (distance < gameStateRef.current.pacman.radius) {
          pellet.active = false;
          setScore(prevScore => {
            const newScore = prevScore + 13;
            if (newScore >= WINNING_SCORE) {
              setGameWon(true);
            }
            return newScore;
          });
        }
      }
    });

    // Power pellets
    gameStateRef.current.powerPellets.forEach((pellet) => {
      if (pellet.active) {
        const distance = Math.sqrt(
          Math.pow(pellet.x - gameStateRef.current.pacman.x, 2) + 
          Math.pow(pellet.y - gameStateRef.current.pacman.y, 2)
        );
        if (distance < gameStateRef.current.pacman.radius) {
          pellet.active = false;
          setScore(prevScore => {
            const newScore = prevScore + 36;
            if (newScore >= WINNING_SCORE) {
              setGameWon(true);
            }
            return newScore;
          });
        }
      }
    });
  };

  const gameLoop = () => {
    if (!canvasRef.current || gameOver || gameWon || !isPlaying) return;

    const ctx = canvasRef.current.getContext("2d");
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    
    drawWalls(ctx);
    drawPellets(ctx);
    movePacman();
    moveGhosts();
    drawPacman(ctx);
    drawGhosts(ctx);
    checkCollisions();

    requestRef.current = requestAnimationFrame(gameLoop);
  };

  // Game controls
  // Game controls
  useEffect(() => {
    if (!isPlaying) return;

    const handleKeyDown = (e) => {
      if (!gameOver && !gameWon && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        e.stopPropagation();
        keysRef.current[e.key] = true;
      }
    };

    const handleKeyUp = (e) => {
      if (!gameOver && !gameWon && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        e.stopPropagation();
        keysRef.current[e.key] = false;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    requestRef.current = requestAnimationFrame(gameLoop);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      cancelAnimationFrame(requestRef.current);
      keysRef.current = {};
    };
  }, [isPlaying, gameOver, gameWon]);

  const handleExit = () => {
    if (onExit) {
      onExit();
    }
  };

  // Add styles for winning score display
  const styles = {
    scoreDisplay: {
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      fontSize: '72px',
      color: '#FFD700',
      fontWeight: 'bold',
      textShadow: '4px 4px 8px rgba(0, 0, 0, 0.8)',
      zIndex: 10,
      fontFamily: 'Arial, sans-serif',
      animation: 'pulse 1s infinite'
    }
  };

  return (
    <div style={{ position: 'relative', background: 'black', padding: '20px', borderRadius: '8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div style={{ color: 'white', fontSize: '20px' }}> USE ARROW KEYS | Score: {score}</div>
        <button
          onClick={handleExit}
          style={{
            backgroundColor: '#ff4444',
            color: 'white',
            padding: '8px 16px',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Exit Game
        </button>
      </div>
      
      <div style={{ position: 'relative' }}>
        <canvas
          ref={canvasRef}
          style={{ border: '2px solid #0000FF', display: 'block', margin: '0 auto' }}
        />
        {/* Only show winning score when game is won */}
        {gameWon && (
          <div style={{
            ...styles.scoreDisplay,
            animation: 'pulse 1s infinite',
            '@keyframes pulse': {
              '0%': { transform: 'translate(-50%, -50%) scale(1)' },
              '50%': { transform: 'translate(-50%, -50%) scale(1.2)' },
              '100%': { transform: 'translate(-50%, -50%) scale(1)' }
            }
          }}>
            {/* {WINNING_SCORE} */}
          </div>
        )}
      </div>
      
      {(gameOver || gameWon) && (
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(0, 0, 0, 0.7)'
        }}>
          <div style={{
            fontSize: '36px',
            marginBottom: '16px',
            color: gameWon ? '#4CAF50' : '#ff4444'
          }}>
            {gameWon ? 'You Won!' : 'Game Over!'}
          </div>
          <div style={{ color: 'white', fontSize: '24px', marginBottom: '16px' }}>
            Final Score == {score}
          </div>
          <div style={{ display: 'flex', gap: '16px' }}>
            <button
              onClick={() => {
                setGameOver(false);
                setGameWon(false);
                setScore(0);
                setGameStarted(false);
                // Reset game state
                gameStateRef.current.pacman = {
                  ...gameStateRef.current.pacman,
                  x: 45,
                  y: 45,
                  dx: 0,
                  dy: 0
                };
                gameStateRef.current.ghosts = [
                  { x: 105, y: 105, color: "red", dx: 1.5, dy: 0, speed: 1.5 },
                  { x: 345, y: 345, color: "blue", dx: -1.5, dy: 0, speed: 1.5 }
                ];
                // Reset all pellets
                const CELL_SIZE = 30;
                gameStateRef.current.pellets = [];
                gameStateRef.current.powerPellets = [];
                
                for (let row = 0; row < gameStateRef.current.map.length; row++) {
                  for (let col = 0; col < gameStateRef.current.map[0].length; col++) {
                    if (gameStateRef.current.map[row][col] === 0) {
                      gameStateRef.current.pellets.push({
                        x: col * CELL_SIZE + CELL_SIZE / 2,
                        y: row * CELL_SIZE + CELL_SIZE / 2,
                        active: true,
                      });
                    } else if (gameStateRef.current.map[row][col] === 2) {
                      gameStateRef.current.powerPellets.push({
                        x: col * CELL_SIZE + CELL_SIZE / 2,
                        y: row * CELL_SIZE + CELL_SIZE / 2,
                        active: true,
                      });
                    }
                  }
                }
              }}
              style={{
                backgroundColor: '#4444ff',
                color: 'white',
                padding: '8px 16px',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Play Again
            </button>
            <button
              onClick={handleExit}
              style={{
                backgroundColor: '#ff4444',
                color: 'white',
                padding: '8px 16px',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Exit
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PacmanGame;