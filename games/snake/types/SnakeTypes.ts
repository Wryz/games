import { GameStatus } from '../../types/GameTypes';

export enum Direction {
  UP = 'UP',
  DOWN = 'DOWN',
  LEFT = 'LEFT',
  RIGHT = 'RIGHT',
}

export interface Position {
  x: number;
  y: number;
}

export interface SnakeGameState {
  snake: Position[];
  apple: Position;
  direction: Direction;
  status: GameStatus;
  score: number;
  speed: number;
}

export interface GameConfig {
  boardWidth: number;
  boardHeight: number;
  initialSpeed: number;
  speedIncrement: number;
}
