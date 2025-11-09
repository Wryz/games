'use client'

import { useState, useEffect, ReactNode } from 'react'
import Leaderboard from './Leaderboard'

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
  customSort
}: GameWrapperProps) {
  return (
    <div className="space-y-8">
      {/* Game Content */}
      {children}

      {/* Leaderboard */}
      <Leaderboard
        gameType={gameType}
        scores={scores}
        loading={loading}
        onRefresh={onRefresh}
        formatScore={formatScore}
        sortKey={sortKey}
        sortDirection={sortDirection}
        customSort={customSort}
      />
    </div>
  )
}
