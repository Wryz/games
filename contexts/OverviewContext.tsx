'use client'

import { createContext, useContext, useState, ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import { GAMES } from '@/types/games'
import { formatScoreSummary } from '@/lib/format-score'
import type { DomainKey } from '@/lib/domains'

interface GameStats {
  id: string
  name: string
  icon: any
  category: DomainKey
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
  username?: string | null
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
      // Check if username changed - if so, clear cache
      const usernameChanged = cachedGameStats && cachedGameStats.username !== username
      
      // If force refresh or username changed, clear cache immediately
      if (forceRefresh || usernameChanged) {
        setCachedGameStats(null)
        setGameStatsLoading(true)
      } else if (cachedGameStats && cachedGameStats.data.length > 0) {
        // If we have cached data for the same user, show it immediately
        setGameStats(cachedGameStats.data)
        setGameStatsLoading(false)
        
        // Check if cache is still valid
          const now = Date.now()
          const isValid = (now - cachedGameStats.timestamp) < CACHE_DURATION
          
          if (isValid) {
            return // Cache is valid, no need to fetch
        }
        
        // Cache is expired, fetch fresh data in background
        setGameStatsLoading(true)
      } else {
        // No cached data, show loading state
        setGameStatsLoading(true)
      }

      // Use RPC function to fetch all exercise stats in a single call
      const { data: rpcData, error } = await supabase
        .rpc('get_game_stats_overview', { p_username: username || undefined }) as { data: any[] | null, error: any }

      if (error) throw error

      const gameStatsData: GameStats[] = []

      // Process the RPC response and map to our GameStats format
      const rpcDataMap = new Map(
        Array.isArray(rpcData) ? rpcData.map((item: any) => [item.game_id, item]) : []
      )

      for (const game of GAMES) {
        const rpcGameData = rpcDataMap.get(game.id)

        // Include all games, even if they don't have scores yet
        gameStatsData.push({
          id: game.id,
          name: game.name,
          icon: game.icon,
          category: game.category,
          totalGames: rpcGameData?.total_games || 0,
          topScore: rpcGameData?.top_score ? {
            username: rpcGameData.top_score.username,
            value: formatScoreSummary(game.id, rpcGameData.top_score),
            score: rpcGameData.top_score
          } : null,
          userBest: rpcGameData?.user_best ? {
            value: formatScoreSummary(game.id, rpcGameData.user_best),
            score: rpcGameData.user_best
          } : null
        })
      }

      setGameStats(gameStatsData)
      
      // Cache the fresh data with username
      setCachedGameStats({
        data: gameStatsData,
        timestamp: Date.now(),
        username: username || null
      })
      
      setGameStatsLoading(false)
    } catch (error) {
      console.error('Error loading exercise stats:', error)
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

