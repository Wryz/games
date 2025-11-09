'use client'

import { useState, useEffect } from 'react'
import { NumberMemoryIcon } from '../icons/GameIcons'
import { getNumberMemoryScores } from '@/lib/scores'
import GameWrapper from '../GameWrapper'
import type { NumberMemoryScore } from '@/lib/supabase'

export default function NumberMemory() {
  const [scores, setScores] = useState<NumberMemoryScore[]>([])
  const [loading, setLoading] = useState(true)

  const loadScores = async () => {
    try {
      setLoading(true)
      const data = await getNumberMemoryScores({ limit: 50 })
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

  const formatScore = (score: NumberMemoryScore) => {
    return `${score.longest_sequence} digits (${score.attempts} attempts)`
  }

  return (
    <GameWrapper
      gameType="Number Memory"
      scores={scores}
      loading={loading}
      onRefresh={loadScores}
      formatScore={formatScore}
      sortKey="longest_sequence"
      sortDirection="desc"
    >
      <div className="flex flex-col items-center justify-center min-h-[400px] sm:min-h-[600px] bg-gray-50 dark:bg-gray-800 rounded-lg p-4 sm:p-8">
        <NumberMemoryIcon size={80} className="mb-4 text-blue-600 dark:text-blue-400 sm:w-24 sm:h-24" />
        <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-gray-900 dark:text-gray-100 text-center">
          Number Memory
        </h2>
        <p className="text-gray-600 dark:text-gray-400 text-center max-w-md mb-6 sm:mb-8 text-sm sm:text-base px-4">
          Remember and recall sequences of numbers that get progressively longer and more challenging.
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
