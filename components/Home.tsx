'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@/contexts/UserContext'
import { useOverview } from '@/contexts/OverviewContext'
import { supabase } from '@/lib/supabase'
import { GAMES } from '@/types/games'
import { usePostHog } from 'posthog-js/react'
import { useRouter } from 'next/navigation'

interface RecentScore {
  id: number
  username: string
  game_type: string
  score_value: string
  date_submitted: string
  accuracy?: number
  reaction_time?: number
  wpm?: number
  level_reached?: number
}

interface HomeProps {
  onGameSelect?: (gameId: string) => void
}

// Skeleton component for loading state
const GameCardSkeleton = () => (
  <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 animate-pulse aspect-square flex flex-col">
    <div className="flex items-center space-x-3 mb-4">
      <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded"></div>
      <div className="flex-1">
        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4 mb-2"></div>
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
      </div>
    </div>
    
    <div className="flex-1 space-y-3">
      <div>
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-1"></div>
        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/2 mb-1"></div>
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
      </div>
      
      <div>
        <div className="h-3 bg-blue-200 dark:bg-blue-800 rounded w-1/3 mb-1"></div>
        <div className="h-4 bg-blue-300 dark:bg-blue-700 rounded w-2/3"></div>
      </div>
    </div>
  </div>
)

export default function Home({ onGameSelect }: HomeProps) {
  const [recentScores, setRecentScores] = useState<RecentScore[]>([])
  const [loading, setLoading] = useState(true)
  const { username } = useUser()
  const { gameStats, gameStatsLoading, loadGameStats } = useOverview()
  const posthog = usePostHog()
  const router = useRouter()

  const handleGameClick = (gameId: string, gameName: string) => {
    // Track game click event
    posthog.capture('game_clicked', {
      game_id: gameId,
      game_name: gameName,
      source: 'home_page',
      username: username || 'anonymous'
    })
    
    // Navigate to the game URL
    router.push(`/games/${gameId}`)
    
    // Call the callback for any additional handling
    onGameSelect?.(gameId)
  }

  const loadAllData = async (forceRefresh = false) => {
    setLoading(true)
    await Promise.all([
      loadRecentScores(),
      loadGameStats(forceRefresh, username || undefined)
    ])
    setLoading(false)
  }

  const loadRecentScores = async () => {
    try {
      
      // Get recent scores from all game tables
      const [
        aimTrainerScores,
        typingTestScores,
        memoryScores,
        patternRecognitionScores,
        reactionTimeScores,
        numberMemoryScores,
        visualMemoryScores,
        stroopTestScores,
        sequenceMemoryScores,
        chimpTestScores
      ] = await Promise.all([
        supabase.from('aim_trainer_scores').select('*').order('date_submitted', { ascending: false }).limit(10),
        supabase.from('typing_test_scores').select('*').order('date_submitted', { ascending: false }).limit(10),
        supabase.from('memory_scores').select('*').order('date_submitted', { ascending: false }).limit(10),
        supabase.from('pattern_recognition_scores').select('*').order('date_submitted', { ascending: false }).limit(10),
        supabase.from('reaction_time_scores').select('*').order('date_submitted', { ascending: false }).limit(10),
        supabase.from('number_memory_scores').select('*').order('date_submitted', { ascending: false }).limit(10),
        supabase.from('visual_memory_scores').select('*').order('date_submitted', { ascending: false }).limit(10),
        supabase.from('stroop_test_scores').select('*').order('date_submitted', { ascending: false }).limit(10),
        supabase.from('sequence_memory_scores').select('*').order('date_submitted', { ascending: false }).limit(10),
        supabase.from('chimp_test_scores').select('*').order('date_submitted', { ascending: false }).limit(10)
      ])

      // Combine and format all scores
      const allScores: RecentScore[] = []

      // Add aim trainer scores
      aimTrainerScores.data?.forEach(score => {
        allScores.push({
          id: score.id,
          username: score.username,
          game_type: 'Aim Trainer',
          score_value: `${score.accuracy}% (${score.reaction_time}ms)`,
          date_submitted: score.date_submitted || score.created_at || '',
          accuracy: score.accuracy,
          reaction_time: score.reaction_time
        })
      })

      // Add typing test scores
      typingTestScores.data?.forEach(score => {
        allScores.push({
          id: score.id,
          username: score.username,
          game_type: 'Typing Test',
          score_value: `${score.wpm} WPM (${score.accuracy}%)`,
          date_submitted: score.date_submitted || score.created_at || '',
          wpm: score.wpm,
          accuracy: score.accuracy
        })
      })

      // Add memory scores
      memoryScores.data?.forEach(score => {
        allScores.push({
          id: score.id,
          username: score.username,
          game_type: 'Memory Game',
          score_value: `Level ${score.level_reached}`,
          date_submitted: score.date_submitted || score.created_at || '',
          level_reached: score.level_reached
        })
      })

      // Add pattern recognition scores
      patternRecognitionScores.data?.forEach(score => {
        allScores.push({
          id: score.id,
          username: score.username,
          game_type: 'Pattern Recognition',
          score_value: `${score.patterns_solved} patterns`,
          date_submitted: score.date_submitted || score.created_at || '',
        })
      })

      // Add reaction time scores
      reactionTimeScores.data?.forEach(score => {
        allScores.push({
          id: score.id,
          username: score.username,
          game_type: 'Reaction Time',
          score_value: `${score.average_time}ms avg`,
          date_submitted: score.date_submitted || score.created_at || '',
        })
      })

      // Add number memory scores
      numberMemoryScores.data?.forEach(score => {
        allScores.push({
          id: score.id,
          username: score.username,
          game_type: 'Number Memory',
          score_value: `${score.longest_sequence} digits`,
          date_submitted: score.date_submitted || score.created_at || '',
        })
      })

      // Add visual memory scores
      visualMemoryScores.data?.forEach(score => {
        allScores.push({
          id: score.id,
          username: score.username,
          game_type: 'Visual Memory',
          score_value: `Level ${score.level_reached}`,
          date_submitted: score.date_submitted || score.created_at || '',
          level_reached: score.level_reached
        })
      })

      // Add stroop test scores
      stroopTestScores.data?.forEach(score => {
        allScores.push({
          id: score.id,
          username: score.username,
          game_type: 'Stroop Test',
          score_value: `${score.correct_answers}/${score.total_questions}`,
          date_submitted: score.date_submitted || score.created_at || '',
        })
      })

      // Add sequence memory scores
      sequenceMemoryScores.data?.forEach(score => {
        allScores.push({
          id: score.id,
          username: score.username,
          game_type: 'Sequence Memory',
          score_value: `Level ${score.level_reached}`,
          date_submitted: score.date_submitted || score.created_at || '',
          level_reached: score.level_reached
        })
      })

      // Add chimp test scores
      chimpTestScores.data?.forEach(score => {
        allScores.push({
          id: score.id,
          username: score.username,
          game_type: 'Chimp Test',
          score_value: `Level ${score.level_reached}`,
          date_submitted: score.date_submitted || score.created_at || '',
          level_reached: score.level_reached
        })
      })

      // Sort by date and take top 10
      allScores.sort((a, b) => new Date(b.date_submitted).getTime() - new Date(a.date_submitted).getTime())
      setRecentScores(allScores.slice(0, 10))

    } catch (error) {
      console.error('Error loading recent scores:', error)
    }
  }

  useEffect(() => {
    loadAllData()

    // Set up realtime listeners for all score tables
    const channels = [
      'aim_trainer_scores',
      'typing_test_scores', 
      'memory_scores',
      'pattern_recognition_scores',
      'reaction_time_scores',
      'number_memory_scores',
      'visual_memory_scores',
      'stroop_test_scores',
      'sequence_memory_scores',
      'chimp_test_scores'
    ].map(tableName => {
      return supabase
        .channel(`${tableName}_changes`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: tableName
          },
          () => {
            // Reload both scores and stats when any new score is added
            // Force refresh to invalidate cache since new data is available
            loadAllData(true)
          }
        )
        .subscribe()
    })

    // Cleanup subscriptions on unmount
    return () => {
      channels.forEach(channel => supabase.removeChannel(channel))
    }
  }, [])

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    
    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `${diffInHours}h ago`
    
    const diffInDays = Math.floor(diffInHours / 24)
    return `${diffInDays}d ago`
  }

  const isUserScore = (scoreUsername: string) => {
    return username && scoreUsername === username
  }

  return (
    <div className="p-6 space-y-8">
      {/* Welcome Section */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Brain Benchmark
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          Test and improve your cognitive abilities
        </p>
      </div>

      {loading && gameStats.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <>
          {/* Game Overview Grid */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Games Overview
              </h2>
              {gameStatsLoading && gameStats.length > 0 && (
                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                  Updating...
                </div>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {gameStats.length === 0 ? (
                // Show skeleton cards only when no data is available (initial load)
                Array.from({ length: GAMES.length }).map((_, index) => (
                  <GameCardSkeleton key={`skeleton-${index}`} />
                ))
              ) : (
                gameStats.map((game) => (
                <div
                  key={game.id}
                  onClick={() => handleGameClick(game.id, game.name)}
                  className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-all duration-200 cursor-pointer hover:border-blue-300 dark:hover:border-blue-600 aspect-square flex flex-col"
                >
                  <div className="flex items-center space-x-3 mb-4">
                    <game.icon size={32} className="text-blue-600 dark:text-blue-400" />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                        {game.name}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {game.totalGames} games played
                      </p>
                    </div>
                  </div>

                  <div className="flex-1 space-y-3">
                    {/* Top Score */}
                    <div>
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                        Top Score
                      </p>
                      {game.topScore ? (
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-gray-100">
                            {game.topScore.value}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            by {game.topScore.username}
                          </p>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          No scores yet
                        </p>
                      )}
                    </div>

                    {/* User Best */}
                    {username && (
                      <div>
                        <p className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-1">
                          Your Best
                        </p>
                        {game.userBest ? (
                          <p className="font-semibold text-blue-700 dark:text-blue-300">
                            {game.userBest.value}
                          </p>
                        ) : (
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Not played yet
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                ))
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
              Recent Activity
            </h2>
            <div className="space-y-4">
              {recentScores.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-gray-500 dark:text-gray-400">
                    No recent scores yet. Start playing games to see activity here!
                  </p>
                </div>
              ) : (
                recentScores.map((score, index) => (
                  <div
                    key={`${score.game_type}-${score.id}`}
                    className={`p-4 rounded-lg border transition-all duration-200 ${
                      isUserScore(score.username)
                        ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <div className={`w-2 h-2 rounded-full ${
                            isUserScore(score.username) ? 'bg-blue-500' : 'bg-gray-400'
                          }`} />
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className={`font-medium ${
                                isUserScore(score.username)
                                  ? 'text-blue-700 dark:text-blue-300'
                                  : 'text-gray-900 dark:text-gray-100'
                              }`}>
                                {score.username}
                                {isUserScore(score.username) && (
                                  <span className="ml-2 text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-full">
                                    You
                                  </span>
                                )}
                              </span>
                              <span className="text-sm text-gray-500 dark:text-gray-400">
                                played
                              </span>
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                {score.game_type}
                              </span>
                            </div>
                            <div className="mt-1">
                              <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                {score.score_value}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {formatTimeAgo(score.date_submitted)}
                        </div>
                        <div className="text-xs text-gray-400 dark:text-gray-500">
                          #{index + 1}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
