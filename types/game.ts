export interface Game {
  id: string
  title: string
  description: string
  category: GameCategory
  image: string
  rating: number
  players: string
  difficulty: 'Easy' | 'Medium' | 'Hard'
  playTime: string
  tags: string[]
  featured: boolean
  releaseDate: string
  developer: string
  platform: Platform[]
}

export type GameCategory = 
  | 'Action'
  | 'Adventure'
  | 'Puzzle'
  | 'Strategy'
  | 'RPG'
  | 'Sports'
  | 'Racing'
  | 'Simulation'
  | 'Arcade'
  | 'Casual'

export type Platform = 
  | 'Web'
  | 'Mobile'
  | 'PC'
  | 'Console'

export interface GameFilters {
  category?: GameCategory
  difficulty?: Game['difficulty']
  rating?: number
  search?: string
}
