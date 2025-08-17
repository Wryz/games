import { Direction, Position, SnakeGameState, GameConfig } from '../types/SnakeTypes';
import { GameStatus } from '../../types/GameTypes';

class SnakeGame {
  private snake: Position[];
  private apple: Position;
  private direction: Direction;
  private status: GameStatus;
  private score: number;
  private speed: number;
  private config: GameConfig;

  constructor(config: GameConfig = {
    boardWidth: 20,
    boardHeight: 20,
    initialSpeed: 200,
    speedIncrement: 5
  }) {
    this.config = config;
    this.snake = [{ x: 10, y: 10 }];
    this.direction = Direction.RIGHT;
    this.status = GameStatus.Idle; // Start in idle state
    this.score = 0;
    this.speed = config.initialSpeed;
    this.apple = this.generateApple();
  }

  private generateApple(): Position {
    let newApple: Position;
    do {
      newApple = {
        x: Math.floor(Math.random() * this.config.boardWidth),
        y: Math.floor(Math.random() * this.config.boardHeight)
      };
    } while (this.isPositionOnSnake(newApple));
    return newApple;
  }

  private isPositionOnSnake(position: Position): boolean {
    return this.snake.some(segment => segment.x === position.x && segment.y === position.y);
  }

  public changeDirection(newDirection: Direction): void {
    // Prevent reversing into itself
    if (this.status !== GameStatus.Playing) return;
    
    const opposites = {
      [Direction.UP]: Direction.DOWN,
      [Direction.DOWN]: Direction.UP,
      [Direction.LEFT]: Direction.RIGHT,
      [Direction.RIGHT]: Direction.LEFT,
    };

    if (opposites[newDirection] !== this.direction) {
      this.direction = newDirection;
    }
  }

  public update(): boolean {
    console.log('SnakeGame.update() called - Status:', this.status, 'Direction:', this.direction);
    if (this.status !== GameStatus.Playing) return false;

    const head = { ...this.snake[0] };
    console.log('Current head position:', head, 'Moving direction:', this.direction);

    // Move head based on direction
    switch (this.direction) {
      case Direction.UP:
        head.y -= 1;
        break;
      case Direction.DOWN:
        head.y += 1;
        break;
      case Direction.LEFT:
        head.x -= 1;
        break;
      case Direction.RIGHT:
        head.x += 1;
        break;
    }

    console.log('New head position after move:', head);

    // Check wall collision
    if (head.x < 0 || head.x >= this.config.boardWidth || 
        head.y < 0 || head.y >= this.config.boardHeight) {
      this.status = GameStatus.Lose; // Game Over
      return false;
    }

    // Check self collision
    if (this.isPositionOnSnake(head)) {
      this.status = GameStatus.Lose; // Game Over
      return false;
    }

    // Add new head
    this.snake.unshift(head);

    // Check if apple eaten
    if (head.x === this.apple.x && head.y === this.apple.y) {
      this.score += 10;
      this.apple = this.generateApple();
      // Increase speed slightly
      this.speed = Math.max(50, this.speed - this.config.speedIncrement);
    } else {
      // Remove tail if no apple eaten
      this.snake.pop();
    }

    return true;
  }

  public startGame(): void {
    this.status = GameStatus.Playing;
  }

  public pauseGame(): void {
    if (this.status === GameStatus.Playing) {
      this.status = GameStatus.Paused;
    }
  }

  public resetGame(): void {
    this.snake = [{ x: 10, y: 10 }];
    this.direction = Direction.RIGHT;
    this.status = GameStatus.Idle;
    this.score = 0;
    this.speed = this.config.initialSpeed;
    this.apple = this.generateApple();
  }

  public getState(): SnakeGameState {
    return {
      snake: [...this.snake],
      apple: { ...this.apple },
      direction: this.direction,
      status: this.status,
      score: this.score,
      speed: this.speed,
    };
  }

  public getConfig(): GameConfig {
    return { ...this.config };
  }
}

export default SnakeGame;
