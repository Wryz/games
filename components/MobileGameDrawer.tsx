'use client'

import { useEffect } from 'react'
import { Game, GAMES } from '@/types/games'
import { useUser } from '@/contexts/UserContext'
import { HomeIcon } from './icons/GameIcons'
import ThemeToggle from './ThemeToggle'
import UsernameInput from './UsernameInput'
import { usePostHog } from 'posthog-js/react'
import { useRouter } from 'next/navigation'

interface MobileGameDrawerProps {
  isOpen: boolean
  onClose: () => void
  selectedGame: string | null
  onGameSelect: (gameId: string) => void
}

export default function MobileGameDrawer({ isOpen, onClose, selectedGame, onGameSelect }: MobileGameDrawerProps) {
  const { username, setUsername, clearUsername } = useUser()
  const posthog = usePostHog()
  const router = useRouter()
  
  const handleUsernameSubmit = async (newUsername: string) => {
    setUsername(newUsername)
  }

  const handleUsernameChange = () => {
    clearUsername()
  }

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    
    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

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

  const handleGameSelect = (gameId: string, gameName?: string) => {
    // Track game click event
    posthog.capture('game_clicked', {
      game_id: gameId,
      game_name: gameName || gameId,
      source: 'mobile_drawer',
      username: username || 'anonymous'
    })
    
    // Navigate to the game URL
    if (gameId === 'home') {
      router.push('/')
    } else {
      router.push(`/games/${gameId}`)
    }
    
    // Call the callback for any additional handling
    onGameSelect(gameId)
    onClose()
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className="fixed left-0 top-0 h-full w-80 max-w-[85vw] bg-white dark:bg-gray-900 shadow-xl z-50 overflow-y-auto lg:hidden transform transition-transform duration-300 ease-in-out">
        <div className="p-6">
          {/* Header with close button */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Brain Benchmark
            </h2>
            <div className="flex items-center space-x-3">
              <ThemeToggle />
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="Close menu"
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="text-gray-600 dark:text-gray-400"
                >
                  <path
                    d="M18 6L6 18M6 6l12 12"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
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
              onClick={() => handleGameSelect('home')}
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
                <div className="flex-1 min-w-0">
                  <div className={`font-medium text-sm ${
                    selectedGame === 'home' || selectedGame === null
                      ? 'text-blue-700 dark:text-blue-300'
                      : 'text-gray-900 dark:text-gray-100'
                  }`}>
                    Home
                  </div>
                  <div className={`text-xs mt-1 ${
                    selectedGame === 'home' || selectedGame === null
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-gray-500 dark:text-gray-400'
                  }`}>
                    Recent activity & scores
                  </div>
                </div>
              </div>
            </button>
          </div>
          
          {/* Games list */}
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
                      onClick={() => handleGameSelect(game.id, game.name)}
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
    </>
  )
}
