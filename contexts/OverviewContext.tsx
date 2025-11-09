'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import { GAMES } from '@/types/games'

interface GameStats {
  id: string
  name: string
  icon: any
  category: 'cognitive' | 'motor' | 'memory' | 'perception'
  totalGames: number
  topScore: {
    username: string
    value: string
    score?: any
  } | null
  userBest: {
    value: string
    score?: any
  } | null
}

interface CachedGameStats {
  data: GameStats[]
  timestamp: number
}

interface OverviewContextType {
  gameStats: GameStats[]
  gameStatsLoading: boolean
  loadGameStats: (forceRefresh?: boolean, username?: string) => Promise<void>
}

const OverviewContext = createContext<OverviewContextType | undefined>(undefined)

// Cache duration: 5 minutes
const CACHE_DURATION = 5 * 60 * 1000

export function OverviewProvider({ children }: { children: ReactNode }) {
  const [gameStats, setGameStats] = useState<GameStats[]>([])
  const [gameStatsLoading, setGameStatsLoading] = useState(true)
  const [cachedGameStats, setCachedGameStats] = useState<CachedGameStats | null>(null)

  const loadGameStats = async (forceRefresh = false, username?: string) => {
    try {
      // If we have cached data, show it immediately (even if expired)
      if (cachedGameStats && cachedGameStats.data.length > 0) {
        setGameStats(cachedGameStats.data)
        setGameStatsLoading(false)
        
        // Check if cache is still valid and we don't need to force refresh
        if (!forceRefresh) {
          const now = Date.now()
          const isValid = (now - cachedGameStats.timestamp) < CACHE_DURATION
          
          if (isValid) {
            return // Cache is valid, no need to fetch
          }
        }
        
        // Cache is expired or force refresh requested, fetch fresh data in background
        setGameStatsLoading(true)
      } else {
        // No cached data, show loading state
        setGameStatsLoading(true)
      }

      // Use RPC function to fetch all game stats in a single call
      const { data: rpcData, error } = await supabase
        .rpc('get_game_stats_overview', { p_username: username || undefined }) as { data: any[] | null, error: any }

      if (error) throw error

      const gameStatsData: GameStats[] = []

      // Process the RPC response and map to our GameStats format
      const rpcDataMap = new Map(
        Array.isArray(rpcData) ? rpcData.map((item: any) => [item.game_id, item]) : []
      )

        // Format scores based on game type
        const formatScore = (score: any, gameId: string) => {
        if (!score) return null
        
          switch (gameId) {
            case 'aim-trainer':
              return `${score.accuracy}% (${score.reaction_time}ms)`
            case 'typing-test':
              return `${score.wpm} WPM`
            case 'reaction-time':
              return `${score.average_time}ms`
            case 'pattern-recognition':
              return `${score.patterns_solved} patterns`
            case 'stroop-test':
              return `${score.correct_answers}/${score.total_questions}`
            case 'number-memory':
              return `${score.longest_sequence} digits`
            default:
            return `Level ${score.level_reached}`
        }
      }

      for (const game of GAMES) {
        const rpcGameData = rpcDataMap.get(game.id)

        if (rpcGameData) {
        gameStatsData.push({
          id: game.id,
          name: game.name,
          icon: game.icon,
          category: game.category,
            totalGames: rpcGameData.total_games || 0,
            topScore: rpcGameData.top_score ? {
              username: rpcGameData.top_score.username,
              value: formatScore(rpcGameData.top_score, game.id) || '',
              score: rpcGameData.top_score
          } : null,
            userBest: rpcGameData.user_best ? {
              value: formatScore(rpcGameData.user_best, game.id) || '',
              score: rpcGameData.user_best
          } : null
        })
        }
      }

      setGameStats(gameStatsData)
      
      // Cache the fresh data
      setCachedGameStats({
        data: gameStatsData,
        timestamp: Date.now()
      })
      
      setGameStatsLoading(false)
    } catch (error) {
      console.error('Error loading game stats:', error)
      setGameStatsLoading(false)
    }
  }

  return (
    <OverviewContext.Provider value={{ gameStats, gameStatsLoading, loadGameStats }}>
      {children}
    </OverviewContext.Provider>
  )
}

export function useOverview() {
  const context = useContext(OverviewContext)
  if (context === undefined) {
    throw new Error('useOverview must be used within an OverviewProvider')
  }
  return context
}

