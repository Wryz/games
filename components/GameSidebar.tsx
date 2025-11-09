'use client'

import { Game, GAMES } from '@/types/games'
import ThemeToggle from './ThemeToggle'

interface GameSidebarProps {
  selectedGame: string | null
  onGameSelect: (gameId: string) => void
}

export default function GameSidebar({ selectedGame, onGameSelect }: GameSidebarProps) {
  const categories = {
    cognitive: 'Cognitive',
    motor: 'Motor Skills',
    memory: 'Memory',
    perception: 'Perception'
  }

  const gamesByCategory = GAMES.reduce((acc, game) => {
    if (!acc[game.category]) {
      acc[game.category] = []
    }
    acc[game.category].push(game)
    return acc
  }, {} as Record<string, Game[]>)

  return (
    <div className="fixed left-0 top-0 h-screen w-80 bg-transparent overflow-y-auto z-10 hidden lg:block">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Brain Games
          </h2>
          <ThemeToggle />
        </div>
        
        <div className="space-y-6">
          {Object.entries(gamesByCategory).map(([category, games]) => (
            <div key={category} className="space-y-2">
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                {categories[category as keyof typeof categories]}
              </h3>
              
              <div className="space-y-1">
                {games.map((game) => (
                  <button
                    key={game.id}
                    onClick={() => onGameSelect(game.id)}
                    className={`w-full text-left p-3 rounded-lg transition-all duration-200 group ${
                      selectedGame === game.id
                        ? 'bg-blue-100 dark:bg-blue-900/30 border-l-4 border-blue-500'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <game.icon 
                        size={24} 
                        className={selectedGame === game.id 
                          ? 'text-blue-600 dark:text-blue-400' 
                          : 'text-gray-600 dark:text-gray-400'
                        } 
                      />
                      <div className="flex-1 min-w-0">
                        <div className={`font-medium text-sm ${
                          selectedGame === game.id
                            ? 'text-blue-700 dark:text-blue-300'
                            : 'text-gray-900 dark:text-gray-100'
                        }`}>
                          {game.name}
                        </div>
                        <div className={`text-xs mt-1 ${
                          selectedGame === game.id
                            ? 'text-blue-600 dark:text-blue-400'
                            : 'text-gray-500 dark:text-gray-400'
                        }`}>
                          {game.description}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
