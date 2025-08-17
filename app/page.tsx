'use client'

import { sampleGames } from '@/data/games'
import BackgroundPattern from '@/components/BackgroundPattern'
import GameHeader from '@/components/GameHeader'
import SimpleGameGrid from '@/components/SimpleGameGrid'
import GameFooter from '@/components/GameFooter'

export default function Home() {
  const handleGameClick = (gameId: string) => {
    console.log('Game clicked:', gameId)
    // No functionality yet, just logging
  }

  return (
    <div className="min-h-screen bg-neutral-900 p-4 sm:p-6 md:p-8 relative overflow-x-hidden">
      <BackgroundPattern />
      <GameHeader />
      <SimpleGameGrid games={sampleGames} onGameClick={handleGameClick} />
      <GameFooter />
    </div>
  )
}