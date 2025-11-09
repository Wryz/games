'use client'

import GameRenderer from './GameRenderer'

interface MainViewProps {
  selectedGame: string | null
  onGameSelect?: (gameId: string) => void
}

export default function MainView({ selectedGame, onGameSelect }: MainViewProps) {
  return (
    <div className="space-y-6">
      {/* Game Content */}
      <GameRenderer selectedGame={selectedGame} onGameSelect={onGameSelect} />
    </div>
  )
}
