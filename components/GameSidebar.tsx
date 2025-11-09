'use client'

import { Game, GAMES } from '@/types/games'
import { useUser } from '@/contexts/UserContext'
import { HomeIcon } from './icons/GameIcons'
import ThemeToggle from './ThemeToggle'
import UsernameInput from './UsernameInput'
import { usePostHog } from 'posthog-js/react'
import { useRouter } from 'next/navigation'

interface GameSidebarProps {
  selectedGame: string | null
  onGameSelect: (gameId: string) => void
}

export default function GameSidebar({ selectedGame, onGameSelect }: GameSidebarProps) {
  const { username, setUsername, clearUsername } = useUser()
  const posthog = usePostHog()
  const router = useRouter()
  
  const handleUsernameSubmit = async (newUsername: string) => {
    setUsername(newUsername)
  }

  const handleUsernameChange = () => {
    clearUsername()
  }

  const handleGameClick = (gameId: string, gameName: string) => {
    // Track game click event
    posthog.capture('game_clicked', {
      game_id: gameId,
      game_name: gameName,
      source: 'sidebar',
      username: username || 'anonymous'
    })
    
    // Navigate to the game URL without scrolling to top
    if (gameId === 'home') {
      router.push('/', { scroll: false })
    } else {
      router.push(`/games/${gameId}`, { scroll: false })
    }
    
    // Call the callback for any additional handling
    onGameSelect(gameId)
  }

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
          <div className="flex items-center gap-2">
            <img 
              src="/images/brain.png" 
              alt="Brain" 
              className="w-8 h-8"
            />
            <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-100">
            Brain Benchmark
          </h2>
          </div>
          <ThemeToggle />
        </div>
        
        {/* Username Input */}
        <div className="mb-6">
          <UsernameInput 
            username={username}
            onUsernameSubmit={handleUsernameSubmit}
            onUsernameChange={handleUsernameChange}
          />
        </div>

        {/* Home Button */}
        <div className="mb-6">
          <button
            onClick={() => handleGameClick('home', 'Home')}
            className={`w-full text-left p-3 rounded-lg transition-all duration-200 group ${
              selectedGame === 'home' || selectedGame === null
                ? 'bg-blue-100 dark:bg-blue-900/30 border-l-4 border-blue-500'
                : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
            }`}
          >
            <div className="flex items-center space-x-3">
              <HomeIcon 
                size={24} 
                className={selectedGame === 'home' || selectedGame === null
                  ? 'text-blue-600 dark:text-blue-400' 
                  : 'text-gray-600 dark:text-gray-400'
                } 
              />
              <div className={`font-medium text-sm ${
                selectedGame === 'home' || selectedGame === null
                  ? 'text-blue-700 dark:text-blue-300'
                  : 'text-gray-700 dark:text-gray-100'
              }`}>
                Home
              </div>
            </div>
          </button>
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
                    onClick={() => handleGameClick(game.id, game.name)}
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
                      <div className={`font-medium text-sm ${
                        selectedGame === game.id
                          ? 'text-blue-700 dark:text-blue-300'
                          : 'text-gray-700 dark:text-gray-100'
                      }`}>
                        {game.name}
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
