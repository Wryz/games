'use client'

import { useState, useEffect } from 'react'
import { MemoryIcon } from '../icons/GameIcons'
import { getMemoryScores } from '@/lib/scores'
import GameWrapper from '../GameWrapper'
import type { MemoryScore } from '@/lib/supabase'

export default function MemoryGame() {
  const [scores, setScores] = useState<MemoryScore[]>([])
  const [loading, setLoading] = useState(true)

  const loadScores = async () => {
    try {
      setLoading(true)
      const data = await getMemoryScores({ limit: 50 })
      setScores(data)
    } catch (error) {
      console.error('Error loading scores:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadScores()
  }, [])

  const formatScore = (score: MemoryScore) => {
    return `Level ${score.level_reached} (${score.correct_sequences}/${score.total_sequences})`
  }

  return (
    <GameWrapper
      gameType="Memory Game"
      scores={scores}
      loading={loading}
      onRefresh={loadScores}
      formatScore={formatScore}
      sortKey="level_reached"
      sortDirection="desc"
    >
      <div className="flex flex-col items-center justify-start min-h-[400px] sm:min-h-[600px] bg-gray-50 dark:bg-gray-800 rounded-lg p-4 sm:p-8 pt-8">
        <MemoryIcon size={80} className="mb-4 text-blue-600 dark:text-blue-400 sm:w-24 sm:h-24" />
        <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-gray-700 dark:text-gray-100 text-center">
          Memory Game
        </h2>
        <p className="text-gray-600 dark:text-gray-400 text-center max-w-md mb-6 sm:mb-8 text-sm sm:text-base px-4">
          Challenge your working memory with sequences and patterns that increase in difficulty.
        </p>
        <div className="bg-white dark:bg-gray-700 p-4 sm:p-6 rounded-lg shadow-sm">
          <p className="text-gray-500 dark:text-gray-400 text-center text-sm sm:text-base">
            Game coming soon...
          </p>
        </div>
      </div>
    </GameWrapper>
  )
}
