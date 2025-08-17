// Base game interface that all games should implement
export interface BaseGame {
  id: string
  name: string
  description: string
  category: string
  reset(): void
  getState(): any
}

// Game status enum
export enum GameStatus {
  Idle = 'Idle',
  Playing = 'Playing',
  Win = 'Win',
  Lose = 'Lose',
  Draw = 'Draw',
  Paused = 'Paused'
}

// Player types
export enum PlayerType {
  HUMAN = 'human',
  AI = 'ai'
}

// Game result types
export interface GameResult {
  winner?: string
  isDraw: boolean
  score?: number
  moves?: number
  duration?: number
}
