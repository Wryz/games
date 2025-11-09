'use client'

import { BrainIcon } from './icons/GameIcons'
import { useUser } from '@/contexts/UserContext'
import UsernameInput from './UsernameInput'
import AimTrainer from './games/AimTrainer'
import TypingTest from './games/TypingTest'
import MemoryGame from './games/MemoryGame'
import PatternRecognition from './games/PatternRecognition'
import ReactionTime from './games/ReactionTime'
import NumberMemory from './games/NumberMemory'
import VisualMemory from './games/VisualMemory'
import StroopTest from './games/StroopTest'
import SequenceMemory from './games/SequenceMemory'
import ChimpTest from './games/ChimpTest'

interface GameRendererProps {
  selectedGame: string | null
}

export default function GameRenderer({ selectedGame }: GameRendererProps) {
  const { username, setUsername, clearUsername } = useUser()

  const handleUsernameSubmit = async (newUsername: string) => {
    setUsername(newUsername)
  }

  const handleUsernameChange = () => {
    clearUsername()
  }

  if (!selectedGame) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] sm:min-h-[600px] bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-800 dark:to-gray-900 rounded-lg p-4 sm:p-8">
        <BrainIcon size={96} className="mb-4 sm:mb-6 text-blue-600 dark:text-blue-400 sm:w-32 sm:h-32" />
        <h1 className="text-2xl sm:text-4xl font-bold mb-6 text-gray-900 dark:text-gray-100 text-center">
          Brain Benchmark
        </h1>
        
        <UsernameInput 
          username={username}
          onUsernameSubmit={handleUsernameSubmit}
          onUsernameChange={handleUsernameChange}
        />
        
        <p className="text-base sm:text-xl text-gray-600 dark:text-gray-400 text-center max-w-2xl mb-6 sm:mb-8 px-4">
          Test and improve your cognitive abilities with our collection of brain training exercises. 
          <span className="hidden sm:inline"> Select a game from the sidebar</span>
          <span className="sm:hidden"> Tap the menu button</span> to get started.
        </p>
        <div className="bg-white dark:bg-gray-700 p-4 sm:p-6 rounded-lg shadow-sm">
          <p className="text-gray-500 dark:text-gray-400 text-center text-sm sm:text-base">
            <span className="hidden sm:inline">Choose a game from the sidebar</span>
            <span className="sm:hidden">Open the menu</span> to begin your brain training journey
          </p>
        </div>
      </div>
    )
  }

  const gameComponents = {
    'aim-trainer': AimTrainer,
    'typing-test': TypingTest,
    'memory': MemoryGame,
    'pattern-recognition': PatternRecognition,
    'reaction-time': ReactionTime,
    'number-memory': NumberMemory,
    'visual-memory': VisualMemory,
    'stroop-test': StroopTest,
    'sequence-memory': SequenceMemory,
    'chimp-test': ChimpTest,
  }

  const GameComponent = gameComponents[selectedGame as keyof typeof gameComponents]

  if (!GameComponent) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[600px] bg-red-50 dark:bg-red-900/20 rounded-lg p-8">
        <svg width="96" height="96" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mb-4 text-red-500">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
          <path d="m15 9-6 6M9 9l6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <h2 className="text-2xl font-bold mb-4 text-red-600 dark:text-red-400">
          Game Not Found
        </h2>
        <p className="text-red-500 dark:text-red-300 text-center">
          The selected game could not be loaded. Please try selecting a different game.
        </p>
      </div>
    )
  }

  return <GameComponent />
}
