import { useState, useEffect, useCallback, useRef } from 'react';
import SnakeGame from '../logic/SnakeGame';
import { SnakeGameState, Direction, GameConfig } from '../types/SnakeTypes';
import { GameStatus } from '../../types/GameTypes';

const defaultConfig: GameConfig = {
  boardWidth: 25,
  boardHeight: 20,
  initialSpeed: 200,
  speedIncrement: 8
};

export const useSnake = (config: GameConfig = defaultConfig) => {
  const gameRef = useRef<SnakeGame>(new SnakeGame(config));
  const [gameState, setGameState] = useState<SnakeGameState>(gameRef.current.getState());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const startGame = useCallback(() => {
    const currentSpeed = gameRef.current.getState().speed;
    console.log('Starting game with speed:', currentSpeed);
    if (intervalRef.current) {
      console.log('Clearing existing timeout');
      clearTimeout(intervalRef.current);
      intervalRef.current = null;
    }

    console.log('Creating game loop with recursive setTimeout');
    
    const gameLoop = () => {
      console.log('Game loop tick');
      const updated = gameRef.current.update();
      const newState = gameRef.current.getState();
      console.log('Updated game state:', newState);
      setGameState({...newState}); // Force new object reference
      
      if (updated && gameRef.current.getState().status === GameStatus.Playing) {
        // Continue the game loop with another setTimeout
        intervalRef.current = setTimeout(gameLoop, gameRef.current.getState().speed);
      } else {
        // Game over
        console.log('Game over, stopping game loop');
        intervalRef.current = null;
      }
    };

    // Start the game loop
    intervalRef.current = setTimeout(gameLoop, currentSpeed);
    console.log('Game loop started with setTimeout ID:', intervalRef.current);
  }, []);

  const stopGame = useCallback(() => {
    if (intervalRef.current) {
      clearTimeout(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const resetGame = useCallback(() => {
    stopGame();
    gameRef.current.resetGame();
    setGameState(gameRef.current.getState());
  }, [stopGame]);

  const changeDirection = useCallback((direction: Direction) => {
    console.log('Changing direction to:', direction);
    gameRef.current.changeDirection(direction);
    const newState = gameRef.current.getState();
    console.log('New game state after direction change:', newState);
    setGameState({...newState}); // Update state immediately when direction changes
  }, []);

  const handleKeyPress = useCallback((event: KeyboardEvent) => {
    console.log('Key pressed:', event.key, 'Game status:', gameState.status);
    switch (event.key) {
      case 'ArrowUp':
        event.preventDefault();
        changeDirection(Direction.UP);
        break;
      case 'ArrowDown':
        event.preventDefault();
        changeDirection(Direction.DOWN);
        break;
      case 'ArrowLeft':
        event.preventDefault();
        changeDirection(Direction.LEFT);
        break;
      case 'ArrowRight':
        event.preventDefault();
        changeDirection(Direction.RIGHT);
        break;
      case ' ':
        event.preventDefault();
        if (gameState.status === GameStatus.Playing) {
          stopGame();
        } else if (gameState.status === GameStatus.Idle || gameState.status === GameStatus.Paused) {
          startGame();
        }
        break;
    }
  }, [changeDirection, gameState.status, startGame, stopGame]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      handleKeyPress(event);
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (intervalRef.current) {
        clearTimeout(intervalRef.current);
      }
    };
  }, [handleKeyPress]);

  useEffect(() => {
    // Start the game automatically
    console.log('Game status effect:', gameState.status, 'Has interval:', !!intervalRef.current);
    if (gameState.status === GameStatus.Playing && !intervalRef.current) {
      console.log('Auto-starting game');
      startGame();
    }
  }, [gameState.status, startGame]);

  return {
    snake: gameState.snake,
    apple: gameState.apple,
    direction: gameState.direction,
    status: gameState.status,
    score: gameState.score,
    speed: gameState.speed,
    config: gameRef.current.getConfig(),
    startGame,
    stopGame,
    resetGame,
    changeDirection,
  };
};
