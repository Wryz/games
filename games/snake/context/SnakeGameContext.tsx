'use client'
import React, { createContext, useContext, useRef, useEffect, useState, useCallback } from 'react';
import SnakeGame from '../logic/SnakeGame';
import { SnakeGameState, Direction, GameConfig } from '../types/SnakeTypes';
import { GameStatus } from '../../types/GameTypes';

interface SnakeGameContextType {
  gameState: SnakeGameState;
  config: GameConfig;
  startGame: () => void;
  stopGame: () => void;
  resetGame: () => void;
  changeDirection: (direction: Direction) => void;
}

const SnakeGameContext = createContext<SnakeGameContextType | undefined>(undefined);

const defaultConfig: GameConfig = {
  boardWidth: 20,
  boardHeight: 20,
  initialSpeed: 200, // 200ms interval
  speedIncrement: 5
};

interface SnakeGameProviderProps {
  children: React.ReactNode;
  config?: GameConfig;
}

export const SnakeGameProvider: React.FC<SnakeGameProviderProps> = ({ 
  children, 
  config = defaultConfig 
}) => {
  const gameRef = useRef<SnakeGame>(new SnakeGame(config));
  const [gameState, setGameState] = useState<SnakeGameState>(gameRef.current.getState());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Game loop with consistent 100ms interval
  const gameLoop = useCallback(() => {
    if (gameRef.current.getState().status === GameStatus.Playing) {
      const updated = gameRef.current.update();
      const newState = gameRef.current.getState();
      setGameState({ ...newState });
      
      // If game is no longer playing after update, stop the interval
      if (newState.status !== GameStatus.Playing) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      }
    }
  }, []);

  const startGame = useCallback(() => {
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    // Start the game
    gameRef.current.startGame();
    const newState = gameRef.current.getState();
    setGameState({ ...newState });
    
    // Start the game loop with 200ms interval
    intervalRef.current = setInterval(gameLoop, 200);
  }, [gameLoop]);

  const stopGame = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    gameRef.current.pauseGame();
    const newState = gameRef.current.getState();
    setGameState({ ...newState });
  }, []);

  const resetGame = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    gameRef.current.resetGame();
    const newState = gameRef.current.getState();
    setGameState({ ...newState });
  }, []);

  const changeDirection = useCallback((direction: Direction) => {
    gameRef.current.changeDirection(direction);
    // Don't update state here - let the game loop handle it
  }, []);

  // Keyboard controls
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
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
          } else if (gameState.status === GameStatus.Lose) {
            // Reset and start a new game automatically
            resetGame();
            // Start the game after a brief delay to ensure reset is complete
            setTimeout(() => startGame(), 50);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [changeDirection, gameState.status, startGame, stopGame]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const contextValue: SnakeGameContextType = {
    gameState,
    config: gameRef.current.getConfig(),
    startGame,
    stopGame,
    resetGame,
    changeDirection,
  };

  return (
    <SnakeGameContext.Provider value={contextValue}>
      {children}
    </SnakeGameContext.Provider>
  );
};

export const useSnakeGame = (): SnakeGameContextType => {
  const context = useContext(SnakeGameContext);
  if (context === undefined) {
    throw new Error('useSnakeGame must be used within a SnakeGameProvider');
  }
  return context;
};
