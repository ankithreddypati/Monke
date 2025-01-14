import React, { useState, useEffect, useRef } from "react";

const PacmanGame = ({ isPlaying, onExit }) => {
  const canvasRef = useRef(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const requestRef = useRef();
  const keysRef = useRef({});
  const gameStateRef = useRef({
    pacman: {
      x: 45,
      y: 45,
      dx: 0,
      dy: 0,
      radius: 13,
      speed: 3,
    },
    ghosts: [
      { x: 105, y: 105, color: "red", dx: 2, dy: 0, speed: 2 },
      { x: 345, y: 345, color: "blue", dx: -2, dy: 0, speed: 2 },
    ],
    pellets: [],
    map: [
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1],
      [1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1],
      [1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1],
      [1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1],
      [1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
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

      // Initialize pellets
      gameStateRef.current.pellets = [];
      for (let row = 0; row < gameStateRef.current.map.length; row++) {
        for (let col = 0; col < gameStateRef.current.map[0].length; col++) {
          if (gameStateRef.current.map[row][col] === 0) {
            gameStateRef.current.pellets.push({
              x: col * CELL_SIZE + CELL_SIZE / 2,
              y: row * CELL_SIZE + CELL_SIZE / 2,
              active: true,
            });
          }
        }
      }

      setGameStarted(true);
      setGameOver(false);
      setScore(0);
    }
  }, [isPlaying, gameStarted]);

  // Game functions
  const checkWallCollision = (x, y) => {
    const CELL_SIZE = 30;
    const gridX = Math.floor(x / CELL_SIZE);
    const gridY = Math.floor(y / CELL_SIZE);
    const { map, pacman } = gameStateRef.current;

    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        const checkX = gridX + i;
        const checkY = gridY + j;
        if (
          checkX >= 0 && checkX < map[0].length &&
          checkY >= 0 && checkY < map.length &&
          map[checkY][checkX] === 1
        ) {
          const wallX = checkX * CELL_SIZE;
          const wallY = checkY * CELL_SIZE;
          const testX = Math.max(wallX, Math.min(x, wallX + CELL_SIZE));
          const testY = Math.max(wallY, Math.min(y, wallY + CELL_SIZE));
          const distX = x - testX;
          const distY = y - testY;
          const distance = Math.sqrt(distX * distX + distY * distY);
          if (distance < pacman.radius) return true;
        }
      }
    }
    return false;
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
    ctx.fillStyle = "#FFFFFF";
    gameStateRef.current.pellets.forEach((pellet) => {
      if (pellet.active) {
        ctx.beginPath();
        ctx.arc(pellet.x, pellet.y, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    });
  };

  const drawPacman = (ctx) => {
    const { pacman } = gameStateRef.current;
    ctx.fillStyle = "#FFFF00";
    ctx.beginPath();
    const mouthAngle = 0.3;
    const angle = Math.atan2(pacman.dy, pacman.dx);
    ctx.arc(
      pacman.x,
      pacman.y,
      pacman.radius,
      angle + mouthAngle,
      angle + (Math.PI * 2) - mouthAngle
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

      const distance = Math.sqrt(
        Math.pow(ghost.x - gameStateRef.current.pacman.x, 2) + 
        Math.pow(ghost.y - gameStateRef.current.pacman.y, 2)
      );
      if (distance < gameStateRef.current.pacman.radius * 2) {
        setGameOver(true);
      }
    });
  };

  const movePacman = () => {
    const { pacman } = gameStateRef.current;
    
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

    if (!checkWallCollision(nextX, nextY)) {
      pacman.x = nextX;
      pacman.y = nextY;
    }
  };

  const checkPelletCollision = () => {
    gameStateRef.current.pellets.forEach((pellet) => {
      if (pellet.active) {
        const distance = Math.sqrt(
          Math.pow(pellet.x - gameStateRef.current.pacman.x, 2) + 
          Math.pow(pellet.y - gameStateRef.current.pacman.y, 2)
        );
        if (distance < gameStateRef.current.pacman.radius) {
          pellet.active = false;
          setScore(prevScore => prevScore + 10);
        }
      }
    });
  };

  const gameLoop = () => {
    if (!canvasRef.current || gameOver || !isPlaying) return;

    const ctx = canvasRef.current.getContext("2d");
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    
    drawWalls(ctx);
    drawPellets(ctx);
    movePacman();
    moveGhosts();
    drawPacman(ctx);
    drawGhosts(ctx);
    checkPelletCollision();

    requestRef.current = requestAnimationFrame(gameLoop);
  };

  // Game controls
  useEffect(() => {
    if (!isPlaying) return;

    const handleKeyDown = (e) => {
      if (!gameOver && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        e.stopPropagation();
        keysRef.current[e.key] = true;
      }
    };

    const handleKeyUp = (e) => {
      if (!gameOver && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
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
  }, [isPlaying, gameOver]);

  const handleExit = () => {
    if (onExit) {
      onExit();
    }
  };

  return (
    <div className="relative bg-black p-4 rounded-lg">
      <div className="flex justify-between items-center mb-4">
        <div className="text-white text-xl">Score: {score}</div>
        <button
          onClick={handleExit}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
        >
          Exit Game
        </button>
      </div>
      
      <canvas
        ref={canvasRef}
        className="border-2 border-blue-600 mx-auto block"
      />
      
      {gameOver && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-70">
          <div className="text-red-500 text-4xl mb-4">Game Over!</div>
          <div className="text-white text-xl mb-4">Final Score: {score}</div>
          <div className="space-x-4">
            <button
              onClick={() => {
                setGameOver(false);
                setScore(0);
                setGameStarted(true);
              }}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Play Again
            </button>
            <button
              onClick={handleExit}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
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