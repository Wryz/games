'use client'

import { ReactNode } from 'react'
import Leaderboard, { type FetchScoresFn } from './Leaderboard'

interface GameWrapperProps {
  gameType: string
  children: ReactNode
  scores: any[]
  loading: boolean
  onRefresh: () => void
  formatScore: (score: any) => string
  sortKey: string
  sortDirection?: 'asc' | 'desc'
  customSort?: (a: any, b: any) => number
  fetchScores: FetchScoresFn
  scoreTable: string
}

export default function GameWrapper({
  gameType,
  children,
  scores,
  loading,
  onRefresh,
  formatScore,
  sortKey,
  sortDirection = 'desc',
  customSort,
  fetchScores,
  scoreTable
}: GameWrapperProps) {
  return (
    <div className="space-y-4">
      {children}

      <Leaderboard
        gameType={gameType}
        scores={scores}
        loading={loading}
        onRefresh={onRefresh}
        formatScore={formatScore}
        sortKey={sortKey}
        sortDirection={sortDirection}
        customSort={customSort}
        fetchScores={fetchScores}
        scoreTable={scoreTable}
      />
    </div>
  )
}
