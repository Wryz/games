'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useUser } from '@/contexts/UserContext'
import { supabase } from '@/lib/supabase'

export type FetchScoresFn = (filters?: {
  username?: string
  limit?: number
}) => Promise<any[]>

interface LeaderboardProps {
  gameType: string
  scores: any[]
  loading: boolean
  onRefresh: () => void
  formatScore: (score: any) => string
  sortKey: string
  sortDirection?: 'asc' | 'desc'
  customSort?: (a: any, b: any) => number
  /** Fetches scores; called without limit for My Scores so all user runs are returned */
  fetchScores: FetchScoresFn
  /** Table name for realtime INSERT updates on My Scores */
  scoreTable: string
}

export default function Leaderboard({
  gameType,
  scores,
  loading,
  onRefresh,
  formatScore,
  sortKey,
  sortDirection = 'desc',
  customSort,
  fetchScores,
  scoreTable
}: LeaderboardProps) {
  const { username } = useUser()
  const [filter, setFilter] = useState<'all' | 'personal'>('all')
  const [searchUsername, setSearchUsername] = useState('')
  const [personalScores, setPersonalScores] = useState<any[]>([])
  const [personalLoading, setPersonalLoading] = useState(false)
  const fetchScoresRef = useRef(fetchScores)
  fetchScoresRef.current = fetchScores

  const loadPersonalScores = useCallback(async () => {
    if (!username) {
      setPersonalScores([])
      return
    }

    setPersonalLoading(true)
    try {
      const data = await fetchScoresRef.current({ username })
      setPersonalScores(data || [])
    } catch (error) {
      console.error('Error loading personal scores:', error)
      setPersonalScores([])
    } finally {
      setPersonalLoading(false)
    }
  }, [username])

  // Load all of the current user's scores (no top-50 limit)
  useEffect(() => {
    let cancelled = false

    const run = async () => {
      if (!username) {
        setPersonalScores([])
        return
      }

      setPersonalLoading(true)
      try {
        const data = await fetchScoresRef.current({ username })
        if (!cancelled) setPersonalScores(data || [])
      } catch (error) {
        console.error('Error loading personal scores:', error)
        if (!cancelled) setPersonalScores([])
      } finally {
        if (!cancelled) setPersonalLoading(false)
      }
    }

    run()
    return () => {
      cancelled = true
    }
  }, [username])

  // Auto-update My Scores when a new score is inserted for this user
  useEffect(() => {
    if (!username || !scoreTable) return

    const channel = supabase
      .channel(`${scoreTable}_personal_${username}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: scoreTable
        },
        (payload) => {
          const row = payload.new as { username?: string; id?: number }
          if (row.username !== username) return

          setPersonalScores(prev => {
            if (row.id != null && prev.some(s => s.id === row.id)) return prev
            return [payload.new, ...prev]
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [username, scoreTable])

  const handleRefresh = () => {
    onRefresh()
    loadPersonalScores()
  }

  const sourceScores = filter === 'personal' ? personalScores : scores

  const filteredScores = sourceScores.filter(score => {
    if (filter === 'personal') return true
    if (searchUsername) {
      return score.username.toLowerCase().includes(searchUsername.toLowerCase())
    }
    return true
  })

  const sortedScores = [...filteredScores].sort((a, b) => {
    if (customSort) {
      return customSort(a, b)
    }

    const aVal = a[sortKey]
    const bVal = b[sortKey]

    if (aVal == null && bVal == null) return 0
    if (aVal == null) return 1
    if (bVal == null) return -1

    if (sortDirection === 'asc') {
      return aVal - bVal
    }
    return bVal - aVal
  })

  const isLoading = filter === 'personal' ? personalLoading : loading

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const tabClass = (active: boolean) =>
    `rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
      active
        ? 'bg-gray-950 text-gray-50 dark:bg-gray-50 dark:text-gray-950'
        : 'text-gray-600 hover:text-gray-950 dark:text-gray-400 dark:hover:text-white'
    }`

  return (
    <section className="card overflow-hidden" aria-label={`${gameType} leaderboard`}>
      <div className="flex flex-col gap-3 border-b border-gray-200 px-5 py-4 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="eyebrow">Leaderboard</p>
          <h3 className="text-lg font-semibold tracking-tight">{gameType}</h3>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-full border border-gray-200 p-0.5 dark:border-gray-800">
            <button onClick={() => setFilter('all')} className={tabClass(filter === 'all')}>
              Everyone
            </button>
            {username && (
              <button onClick={() => setFilter('personal')} className={tabClass(filter === 'personal')}>
                My runs
              </button>
            )}
          </div>
          {filter === 'all' && (
            <input
              type="text"
              placeholder="Find a player"
              value={searchUsername}
              onChange={(e) => setSearchUsername(e.target.value)}
              className="input w-40 rounded-full py-1.5 text-xs"
              aria-label="Find a player"
            />
          )}
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-950 disabled:opacity-50 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
            aria-label="Refresh leaderboard"
            title="Refresh"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={isLoading ? 'animate-spin' : ''} aria-hidden>
              <path d="M21 12a9 9 0 1 1-2.64-6.36M21 3v6h-6" />
            </svg>
          </button>
        </div>
      </div>

      <ol className="max-h-[28rem] overflow-y-auto">
        {isLoading ? (
          [...Array(5)].map((_, i) => (
            <li key={i} className="flex items-center gap-4 border-b border-gray-100 px-5 py-3.5 last:border-0 dark:border-gray-800/70">
              <div className="h-4 w-6 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
              <div className="h-4 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
              <div className="ml-auto h-4 w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
            </li>
          ))
        ) : sortedScores.length === 0 ? (
          <li className="px-5 py-12 text-center text-sm text-gray-500 dark:text-gray-400">
            {filter === 'personal' ? 'You have no runs on this test yet.' : 'No scores yet — set the first record.'}
          </li>
        ) : (
          sortedScores.map((score, index) => {
            const isYou = score.username === username
            return (
              <li
                key={score.id}
                className={`flex items-center gap-4 border-b border-gray-100 px-5 py-3 last:border-0 dark:border-gray-800/70 ${
                  isYou ? 'bg-volt/15 dark:bg-volt/[0.07]' : ''
                }`}
              >
                <span
                  className={`num w-7 shrink-0 text-sm font-semibold ${
                    index === 0 ? 'text-gray-950 dark:text-white' : 'text-gray-400 dark:text-gray-500'
                  }`}
                >
                  {index === 0 ? '★' : String(index + 1).padStart(2, '0')}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-medium text-gray-900 dark:text-gray-100">{score.username}</span>
                    {isYou && <span className="chip-volt">YOU</span>}
                  </div>
                  <div className="num text-[11px] text-gray-500 dark:text-gray-500">{formatDate(score.date_submitted)}</div>
                </div>
                <div className="num shrink-0 text-right text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {formatScore(score)}
                </div>
              </li>
            )
          })
        )}
      </ol>
    </section>
  )
}
