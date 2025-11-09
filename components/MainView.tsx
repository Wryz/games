'use client'

import { useUser } from '@/contexts/UserContext'
import UsernameInput from './UsernameInput'
import GameRenderer from './GameRenderer'

interface MainViewProps {
  selectedGame: string | null
}

export default function MainView({ selectedGame }: MainViewProps) {
  const { username, setUsername, clearUsername } = useUser()

  const handleUsernameSubmit = async (newUsername: string) => {
    setUsername(newUsername)
  }

  const handleUsernameChange = () => {
    clearUsername()
  }

  return (
    <div className="space-y-6">
      {/* Desktop Title and Username Section */}
      <div className="text-center">
        {/* Desktop title - hidden on mobile since mobile header has the title */}
        <h1 className="hidden lg:block text-2xl sm:text-4xl lg:text-5xl font-bold mb-6 text-gray-900 dark:text-gray-100">
          <span className="text-gray-900 dark:text-gray-100 transition-colors duration-300">BRAIN</span>
          <span className="ml-2 sm:ml-4 text-cyan-500 dark:text-cyan-400 transition-colors duration-300" style={{ textShadow: '0 0 10px rgba(34, 211, 238, 0.5)' }}>BENCHMARK</span>
        </h1>
        
        <UsernameInput 
          username={username}
          onUsernameSubmit={handleUsernameSubmit}
          onUsernameChange={handleUsernameChange}
        />
      </div>

      {/* Game Content */}
      <GameRenderer selectedGame={selectedGame} />
    </div>
  )
}
