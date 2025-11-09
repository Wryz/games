'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import { GAMES } from '@/types/games'

interface GameStats {
  id: string
  name: string
  icon: any
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

      const gameStatsData: GameStats[] = []

      // Load stats for each game
      for (const game of GAMES) {
        let tableName: 'aim_trainer_scores' | 'typing_test_scores' | 'memory_scores' | 'pattern_recognition_scores' | 'reaction_time_scores' | 'number_memory_scores' | 'visual_memory_scores' | 'stroop_test_scores' | 'sequence_memory_scores' | 'chimp_test_scores' | '' = ''
        let scoreField = ''
        let sortOrder: 'asc' | 'desc' = 'desc'

        // Map game IDs to table names and score fields
        switch (game.id) {
          case 'aim-trainer':
            tableName = 'aim_trainer_scores'
            scoreField = 'accuracy'
            break
          case 'typing-test':
            tableName = 'typing_test_scores'
            scoreField = 'wpm'
            break
          case 'memory':
            tableName = 'memory_scores'
            scoreField = 'level_reached'
            break
          case 'pattern-recognition':
            tableName = 'pattern_recognition_scores'
            scoreField = 'patterns_solved'
            break
          case 'reaction-time':
            tableName = 'reaction_time_scores'
            scoreField = 'average_time'
            sortOrder = 'asc' // Lower is better for reaction time
            break
          case 'number-memory':
            tableName = 'number_memory_scores'
            scoreField = 'longest_sequence'
            break
          case 'visual-memory':
            tableName = 'visual_memory_scores'
            scoreField = 'level_reached'
            break
          case 'stroop-test':
            tableName = 'stroop_test_scores'
            scoreField = 'correct_answers'
            break
          case 'sequence-memory':
            tableName = 'sequence_memory_scores'
            scoreField = 'level_reached'
            break
          case 'chimp-test':
            tableName = 'chimp_test_scores'
            scoreField = 'level_reached'
            break
          default:
            continue
        }

        // Skip if no table name was set
        if (!tableName) continue

        // Get total games count
        const { count: totalGames } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true })

        // Get top score
        const { data: topScoreData } = await supabase
          .from(tableName)
          .select('*')
          .order(scoreField, { ascending: sortOrder === 'asc' })
          .limit(1)

        // Get user's best score if logged in
        let userBestData = null
        if (username) {
          const { data } = await supabase
            .from(tableName)
            .select('*')
            .eq('username', username)
            .order(scoreField, { ascending: sortOrder === 'asc' })
            .limit(1)
          userBestData = data?.[0]
        }

        // Format scores based on game type
        const formatScore = (score: any, gameId: string) => {
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
              return `Level ${score.level_reached || score[scoreField]}`
          }
        }

        gameStatsData.push({
          id: game.id,
          name: game.name,
          icon: game.icon,
          totalGames: totalGames || 0,
          topScore: topScoreData?.[0] ? {
            username: topScoreData[0].username,
            value: formatScore(topScoreData[0], game.id),
            score: topScoreData[0]
          } : null,
          userBest: userBestData ? {
            value: formatScore(userBestData, game.id),
            score: userBestData
          } : null
        })
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

