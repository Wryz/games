'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@/contexts/UserContext'

interface LeaderboardProps {
  gameType: string
  scores: any[]
  loading: boolean
  onRefresh: () => void
  formatScore: (score: any) => string
  sortKey: string
  sortDirection?: 'asc' | 'desc'
  customSort?: (a: any, b: any) => number
}

export default function Leaderboard({ 
  gameType, 
  scores, 
  loading, 
  onRefresh, 
  formatScore, 
  sortKey,
  sortDirection = 'desc',
  customSort
}: LeaderboardProps) {
  const { username } = useUser()
  const [filter, setFilter] = useState<'all' | 'personal'>('all')
  const [searchUsername, setSearchUsername] = useState('')

  const filteredScores = scores.filter(score => {
    if (filter === 'personal' && username) {
      return score.username === username
    }
    if (searchUsername) {
      return score.username.toLowerCase().includes(searchUsername.toLowerCase())
    }
    return true
  })

  const sortedScores = [...filteredScores].sort((a, b) => {
    // Use custom sort function if provided
    if (customSort) {
      return customSort(a, b)
    }
    
    // Default sorting by sortKey
    const aVal = a[sortKey]
    const bVal = b[sortKey]
    
    if (sortDirection === 'asc') {
      return aVal - bVal
    } else {
      return bVal - aVal
    }
  })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4 sm:mb-0">
          {gameType} Leaderboard
        </h3>
        <button
          onClick={onRefresh}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white rounded-lg transition-colors text-sm"
        >
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex space-x-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-md text-sm transition-colors ${
              filter === 'all'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            All Players
          </button>
          {username && (
            <button
              onClick={() => setFilter('personal')}
              className={`px-3 py-1 rounded-md text-sm transition-colors ${
                filter === 'personal'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              My Scores
            </button>
          )}
        </div>
        
        <input
          type="text"
          placeholder="Search username..."
          value={searchUsername}
          onChange={(e) => setSearchUsername(e.target.value)}
          className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
        />
      </div>

      {/* Scores list */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {loading ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            Loading scores...
          </div>
        ) : sortedScores.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            {filter === 'personal' ? 'No personal scores yet' : 'No scores yet'}
          </div>
        ) : (
          sortedScores.map((score, index) => (
            <div
              key={score.id}
              className={`flex items-center justify-between p-3 rounded-lg ${
                score.username === username
                  ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                  : 'bg-gray-50 dark:bg-gray-700'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  index === 0 ? 'bg-yellow-500 text-white' :
                  index === 1 ? 'bg-gray-400 text-white' :
                  index === 2 ? 'bg-orange-600 text-white' :
                  'bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                }`}>
                  {index + 1}
                </div>
                <div>
                  <div className={`font-medium ${
                    score.username === username
                      ? 'text-blue-700 dark:text-blue-300'
                      : 'text-gray-900 dark:text-gray-100'
                  }`}>
                    {score.username}
                    {score.username === username && (
                      <span className="ml-2 text-xs bg-blue-500 text-white px-2 py-1 rounded-full">
                        You
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {formatDate(score.date_submitted)}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-gray-900 dark:text-gray-100">
                  {formatScore(score)}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
