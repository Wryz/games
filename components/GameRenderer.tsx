'use client'

import { BrainIcon } from './icons/GameIcons'
import Home from './Home'
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
import Algebra from './games/Algebra'
import LinearAlgebra from './games/LinearAlgebra'
import Arithmetic from './games/Arithmetic'
import Geometry from './games/Geometry'
import TimeEstimation from './games/TimeEstimation'
import WordSearch from './games/WordSearch'
import Maze from './games/Maze'
import Anagrams from './games/Anagrams'
import Countries from './games/Countries'
import UsernameGate from './UsernameGate'

interface GameRendererProps {
  selectedGame: string | null
  onGameSelect?: (gameId: string) => void
}

export default function GameRenderer({ selectedGame, onGameSelect }: GameRendererProps) {
  // Show Home by default when no game is selected
  if (!selectedGame || selectedGame === 'home') {
    return <Home onGameSelect={onGameSelect} />
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
    'algebra': Algebra,
    'linear-algebra': LinearAlgebra,
    'arithmetic': Arithmetic,
    'geometry': Geometry,
    'time-estimation': TimeEstimation,
    'word-search': WordSearch,
    'maze': Maze,
    'anagrams': Anagrams,
    'countries': Countries,
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

  return (
    <UsernameGate>
      <GameComponent />
    </UsernameGate>
  )
}
