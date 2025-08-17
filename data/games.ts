import { Game } from '@/types/game'

export const sampleGames: Game[] = [
  {
    id: 'snake',
    title: 'Snake Game',
    description: 'Classic arcade snake game. Control the snake with arrow keys, eat apples to grow, and avoid hitting walls or yourself!',
    category: 'Arcade',
    image: '/images/snake-game.svg',
    rating: 4.5,
    players: '1 Player',
    difficulty: 'Medium',
    playTime: '5-15 min',
    tags: ['Classic', 'Arcade', 'Retro', 'Single Player'],
    featured: true,
    releaseDate: '2024-01-01',
    developer: 'Games Collection',
    platform: ['Web']
  }
]

export const getGameById = (id: string): Game | undefined => {
  return sampleGames.find(game => game.id === id)
}

export const getGamesByCategory = (category: string): Game[] => {
  return sampleGames.filter(game => game.category.toLowerCase() === category.toLowerCase())
}

export const getFeaturedGames = (): Game[] => {
  return sampleGames.filter(game => game.featured)
}

export const getGameCategories = (): string[] => {
  return Array.from(new Set(sampleGames.map(game => game.category)))
}
