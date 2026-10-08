'use client'

import dynamic from 'next/dynamic'
import type { ComponentType } from 'react'
import UsernameGate from './UsernameGate'

function StageSkeleton() {
  return (
    <div className="flex min-h-[420px] items-center justify-center rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 sm:min-h-[480px]">
      <span className="eyebrow animate-pulse">Loading test…</span>
    </div>
  )
}

// Each test is code-split so a page only downloads the test it shows.
const load = (importer: () => Promise<{ default: ComponentType }>) =>
  dynamic(importer, { ssr: false, loading: StageSkeleton })

const GAME_COMPONENTS: Record<string, ComponentType> = {
  'aim-trainer': load(() => import('./games/AimTrainer')),
  'typing-test': load(() => import('./games/TypingTest')),
  'memory': load(() => import('./games/MemoryGame')),
  'reaction-time': load(() => import('./games/ReactionTime')),
  'number-memory': load(() => import('./games/NumberMemory')),
  'visual-memory': load(() => import('./games/VisualMemory')),
  'verbal-memory': load(() => import('./games/VerbalMemory')),
  'stroop-test': load(() => import('./games/StroopTest')),
  'flanker': load(() => import('./games/Flanker')),
  'object-tracking': load(() => import('./games/ObjectTracking')),
  'chimp-test': load(() => import('./games/ChimpTest')),
  'algebra': load(() => import('./games/Algebra')),
  'arithmetic': load(() => import('./games/Arithmetic')),
  'geometry': load(() => import('./games/Geometry')),
  'time-estimation': load(() => import('./games/TimeEstimation')),
  'color-perception': load(() => import('./games/ColorPerception')),
  'word-search': load(() => import('./games/WordSearch')),
  'maze': load(() => import('./games/Maze')),
  'sudoku': load(() => import('./games/Sudoku')),
  'tangrams': load(() => import('./games/Tangrams')),
  'mental-rotation': load(() => import('./games/MentalRotation')),
}

export default function GameRenderer({ selectedGame }: { selectedGame: string }) {
  const GameComponent = GAME_COMPONENTS[selectedGame]

  if (!GameComponent) {
    return (
      <div className="card flex min-h-[320px] flex-col items-center justify-center p-8 text-center">
        <p className="eyebrow mb-2">Error</p>
        <h2 className="text-2xl font-semibold">This test could not be loaded</h2>
      </div>
    )
  }

  return (
    <UsernameGate>
      <GameComponent />
    </UsernameGate>
  )
}
