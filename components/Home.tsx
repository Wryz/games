'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
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

const CrownIcon = ({ className = '', size = 14 }: { className?: string; size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden
  >
    <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm0 2h14v2H5v-2z" />
  </svg>
)

const PeopleIcon = ({ className = '', size = 14 }: { className?: string; size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden
  >
    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
  </svg>
)

const CATEGORY_BG: Record<string, string> = {
  motor: 'bg-blue-100 dark:bg-transparent',
  memory: 'bg-purple-100 dark:bg-transparent',
  cognitive: 'bg-cyan-100 dark:bg-transparent',
  perception: 'bg-pink-100 dark:bg-transparent',
  computation: 'bg-orange-100 dark:bg-transparent',
  linguistic: 'bg-green-100 dark:bg-transparent',
  attention: 'bg-yellow-100 dark:bg-transparent',
  language: 'bg-indigo-100 dark:bg-transparent',
  social: 'bg-rose-100 dark:bg-transparent',
  creative: 'bg-violet-100 dark:bg-transparent',
  puzzles: 'bg-emerald-100 dark:bg-transparent',
  other: 'bg-gray-100 dark:bg-transparent',
}

const CATEGORY_ACCENT: Record<string, string> = {
  motor: 'text-blue-500',
  memory: 'text-purple-500',
  cognitive: 'text-cyan-500',
  perception: 'text-pink-500',
  computation: 'text-orange-500',
  linguistic: 'text-green-500',
  attention: 'text-yellow-500',
  language: 'text-indigo-500',
  social: 'text-rose-500',
  creative: 'text-violet-500',
  puzzles: 'text-emerald-500',
  other: 'text-gray-500',
}

const CATEGORY_BORDER: Record<string, string> = {
  motor: 'border-blue-200 dark:border-blue-500/30',
  memory: 'border-purple-200 dark:border-purple-500/30',
  cognitive: 'border-cyan-200 dark:border-cyan-500/30',
  perception: 'border-pink-200 dark:border-pink-500/30',
  computation: 'border-orange-200 dark:border-orange-500/30',
  linguistic: 'border-green-200 dark:border-green-500/30',
  attention: 'border-yellow-200 dark:border-yellow-500/30',
  language: 'border-indigo-200 dark:border-indigo-500/30',
  social: 'border-rose-200 dark:border-rose-500/30',
  creative: 'border-violet-200 dark:border-violet-500/30',
  puzzles: 'border-emerald-200 dark:border-emerald-500/30',
  other: 'border-gray-200 dark:border-gray-500/30',
}

interface SelectableGameCardProps {
  game: {
    id: string
    name: string
    icon: any
    category: string
    totalGames: number
    topScore: { username: string; value: string } | null
    userBest: { value: string } | null
  }
  hasTopScore: boolean
  index: number
  onSelect: () => void
}

const SelectableGameCard = ({ game, hasTopScore, index, onSelect }: SelectableGameCardProps) => {
  const [showBest, setShowBest] = useState(false)
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const skipClickRef = useRef(false)
  const hasUserBest = Boolean(game.userBest)
  const category = game.category || 'other'
  const bgClass = CATEGORY_BG[category] || CATEGORY_BG.other
  const accentClass = CATEGORY_ACCENT[category] || CATEGORY_ACCENT.other
  const borderClass = CATEGORY_BORDER[category] || CATEGORY_BORDER.other
  const revealBest = hasUserBest && showBest

  const clearLongPress = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
  }

  const handleTouchStart = () => {
    if (!hasUserBest) return
    clearLongPress()
    longPressTimer.current = setTimeout(() => {
      setShowBest(true)
      skipClickRef.current = true
    }, 400)
  }

  const handleTouchEnd = () => {
    clearLongPress()
    setShowBest(false)
  }

  const handleClick = () => {
    if (skipClickRef.current) {
      skipClickRef.current = false
      return
    }
    onSelect()
  }

  return (
    <div
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      onTouchMove={clearLongPress}
      onMouseEnter={() => hasUserBest && setShowBest(true)}
      onMouseLeave={() => setShowBest(false)}
      className="group relative cursor-pointer select-none"
      style={{
        animation: `fadeInUp 0.6s ease-out ${index * 0.05}s both`,
      }}
    >
      {hasTopScore && (
        <div className="pointer-events-none absolute -left-3 -top-3.5 z-20 -rotate-[28deg] transition-transform duration-300 group-hover:-rotate-[16deg] group-hover:scale-110">
          <CrownIcon
            size={56}
            className="w-11 h-11 sm:w-14 sm:h-14 text-amber-400 drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]"
          />
        </div>
      )}

      <div
        className={`game-card-badge relative aspect-square overflow-hidden rounded-lg border-2 ${bgClass} ${borderClass} p-2 sm:p-2.5 flex flex-col shadow-sm dark:shadow-none`}
      >
        <div
          className={`relative z-10 flex flex-col h-full min-h-0 transition duration-200 ${
            revealBest ? 'blur-sm opacity-40' : ''
          }`}
        >
          <div className="flex items-start justify-between gap-1">
            <div className="min-w-0 max-w-full">
              {game.topScore ? (
                <>
                  <div className="flex items-center gap-1">
                    <CrownIcon
                      size={20}
                      className="w-4 h-4 flex-shrink-0 text-amber-500"
                    />
                    <span className="truncate text-md sm:text-lg font-semibold text-gray-800 dark:text-gray-100 leading-tight">
                      {game.topScore.username}
                    </span>
                  </div>
                  <p className="truncate text-[11px] sm:text-xs font-medium text-gray-600 dark:text-gray-300 leading-tight mt-0.5 pl-5">
                    {game.topScore.value}
                  </p>
                </>
              ) : (
                <span className="truncate text-[11px] italic text-gray-400 dark:text-gray-500 leading-tight">
                  —
                </span>
              )}
            </div>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center gap-1 min-h-0 py-1">
            <div className="game-card-icon transform transition-transform duration-200 group-hover:scale-110 group-hover:rotate-6">
              <game.icon className={`w-8 h-8 sm:w-9 sm:h-9 ${accentClass} drop-shadow-sm`} />
            </div>
            <div className="flex items-center justify-center gap-1 flex-wrap px-0.5">
              <h3 className={`font-bold text-lg sm:text-xl text-center leading-tight line-clamp-2 ${accentClass}`}>
                {game.name}
              </h3>
            </div>
            <div className="flex items-center gap-0.5 text-gray-500 dark:text-gray-400">
              <PeopleIcon size={14} className="w-3.5 h-3.5" />
              <span className="text-[11px] sm:text-xs font-medium tabular-nums leading-tight">
                {game.totalGames.toLocaleString('en-US')} played
              </span>
            </div>
          </div>
        </div>

        {hasUserBest && (
          <div
            className={`pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-center gap-1 px-2 transition-opacity duration-200 ${
              revealBest ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <p className={`text-[10px] sm:text-xs font-bold uppercase tracking-wide ${accentClass}`}>
              Your Best
            </p>
            <p className="font-extrabold text-base sm:text-lg text-center text-gray-900 dark:text-white leading-tight line-clamp-2">
              {game.userBest!.value}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

// Enhanced skeleton component for loading state
const GameCardSkeleton = () => {
  const colors = [
    'bg-blue-100 dark:bg-transparent border-blue-200 dark:border-blue-500/30',
    'bg-purple-100 dark:bg-transparent border-purple-200 dark:border-purple-500/30',
    'bg-cyan-100 dark:bg-transparent border-cyan-200 dark:border-cyan-500/30',
    'bg-pink-100 dark:bg-transparent border-pink-200 dark:border-pink-500/30',
  ]
  const color = colors[Math.floor(Math.random() * colors.length)]

  return (
    <div
      className={`relative ${color} rounded-lg p-2 aspect-square flex flex-col overflow-hidden opacity-70 border-2`}
    >
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/40 dark:via-white/10 to-transparent" />
      <div className="relative z-10 flex flex-col h-full animate-pulse">
        <div className="flex items-start justify-between gap-1">
          <div className="space-y-1">
            <div className="h-2.5 bg-gray-300 dark:bg-gray-600 rounded w-12" />
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-10 ml-3" />
          </div>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center gap-1">
          <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-md" />
          <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-2/3" />
          <div className="h-2.5 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
        </div>
      </div>
    </div>
  )
}

export default function Home({ onGameSelect }: HomeProps) {
  const [recentScores, setRecentScores] = useState<RecentScore[]>([])
  const [loading, setLoading] = useState(true)
  const { username } = useUser()
  const { gameStats, gameStatsLoading, loadGameStats } = useOverview()
  const posthog = usePostHog()
  const router = useRouter()

  const handleGameClick = (gameId: string, gameName: string) => {
    // Track exercise click event
    posthog.capture('game_clicked', {
      game_id: gameId,
      game_name: gameName,
      source: 'home_page',
      username: username || 'anonymous'
    })
    
    // Navigate to the exercise URL
    router.push(`/games/${gameId}`)
    
    // Call the callback for any additional handling
    onGameSelect?.(gameId)
  }

  const loadAllData = useCallback(async (forceRefresh = false) => {
    setLoading(true)
    // Load recent scores first (faster, less data)
    await loadRecentScores()
    setLoading(false)
    
    // Load exercise stats in the background without blocking UI
    // This allows instant navigation while stats load asynchronously
    loadGameStats(forceRefresh, username || undefined).catch(error => {
      console.error('Error loading exercise stats:', error)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username])

  const loadRecentScores = async () => {
    try {
      // Use RPC function to get recent activity across all games
      const { data: rpcData, error } = await supabase
        .rpc('get_recent_activity', { p_limit: 6 }) as { data: any[] | null, error: any }

      if (error) throw error

      // Format the scores for display
      const formattedScores: RecentScore[] = []

      if (Array.isArray(rpcData)) {
        rpcData.forEach((item: any, index: number) => {
          const scoreValue = item.score_value
          let formattedValue = ''
          
          // Format based on exercise type
          const formatNum = (num: number | null | undefined) => {
            if (num === null || num === undefined) return '0'
            return num.toLocaleString('en-US')
          }
          
          switch (item.game_id) {
            case 'aim-trainer':
              formattedValue = `${formatNum(scoreValue.reaction_time)}ms (${formatNum(scoreValue.accuracy)}%)`
              break
            case 'typing-test':
              formattedValue = `${formatNum(scoreValue.wpm)} WPM (${formatNum(scoreValue.accuracy)}%)`
              break
            case 'reaction-time':
              formattedValue = `${formatNum(scoreValue.fastest_time)}ms (${formatNum(scoreValue.average_time)}ms avg)`
              break
            case 'visual-memory':
              formattedValue = `Level ${formatNum(scoreValue.level_reached)} (${formatNum(scoreValue.total_patterns)} patterns)`
              break
            case 'stroop-test':
              formattedValue = `${formatNum(scoreValue.correct_answers || 0)} correct (${formatNum(scoreValue.average_time || 0)}ms)`
              break
            case 'number-memory':
              formattedValue = `${formatNum(scoreValue.longest_sequence)} digits`
              break
            case 'chimp-test':
              formattedValue = `${formatNum(scoreValue.patterns_remembered || 0)} correct`
              break
            case 'time-estimation':
              formattedValue = `${formatNum(scoreValue.average_accuracy || 0)}ms avg (${formatNum(scoreValue.best_accuracy || 0)}ms best)`
              break
            case 'maze':
            case 'sudoku':
            case 'tangrams':
              const timeTaken = scoreValue.time_taken || 0
              const seconds = Math.floor(timeTaken / 1000)
              const milliseconds = Math.floor((timeTaken % 1000) / 100)
              formattedValue = `${formatNum(seconds)}.${milliseconds}s`
              break
            case 'algebra':
            case 'arithmetic':
            case 'geometry':
              const correctAnswers = scoreValue.correct_answers || 0
              const avgTime = scoreValue.average_time || 0
              formattedValue = `${formatNum(correctAnswers)} correct (${formatNum(avgTime)}ms avg)`
              break
            case 'word-search':
              formattedValue = `${formatNum(scoreValue.characters_found || 0)} characters`
              break
            default:
              formattedValue = `Level ${formatNum(scoreValue.level_reached)}`
          }

          formattedScores.push({
            id: index, // Use index as ID since we don't have the original ID
            username: item.username,
            game_type: item.game_name,
            score_value: formattedValue,
            date_submitted: item.date_submitted,
            ...scoreValue // Spread the score value for additional fields
        })
      })
      }

      setRecentScores(formattedScores)

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
      'reaction_time_scores',
      'number_memory_scores',
      'visual_memory_scores',
      'stroop_test_scores',
      'chimp_test_scores',
      'time_estimation_scores',
      'maze_scores',
      'algebra_scores',
      'arithmetic_scores',
      'geometry_scores',
      'word_search_scores',
      'sudoku_scores',
      'tangrams_scores'
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
  }, [username, loadAllData]) // Include username and loadAllData so subscriptions use current values

  // Reload data when username changes to fetch user's best scores
  useEffect(() => {
    if (username) {
      loadGameStats(true, username)
    }
  }, [username])

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
    <div className="space-y-12">
      {loading && gameStats.length === 0 ? (
        <div>
          {/* Games Overview Skeleton */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-700 dark:text-gray-100 mb-6">
              Games Overview
            </h2>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 xl:grid-cols-6 gap-3">
              {[...Array(12)].map((_, i) => (
                <GameCardSkeleton key={i} />
              ))}
            </div>
          </div>

          {/* Recent Activity Skeleton */}
          <div>
            <h2 className="text-2xl font-bold text-gray-700 dark:text-gray-100 mb-6">
              Live Activity Feed
            </h2>
            <div className="w-full">
              <div className="border-b border-gray-300/20 dark:border-gray-500/20 py-3 px-4 flex gap-4">
                <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-16 animate-pulse" />
                <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-16 animate-pulse" />
                <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-16 animate-pulse" />
                <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-12 animate-pulse ml-auto" />
              </div>
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className={`border-b border-gray-300/20 dark:border-gray-500/20 py-3.5 px-4 flex gap-4 animate-pulse ${
                    i % 2 === 0 ? 'bg-transparent' : 'bg-gray-100/40 dark:bg-gray-800/40'
                  }`}
                >
                  <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-24" />
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-28" />
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32" />
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16 ml-auto" />
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Games Overview - sorted by popularity */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold flex items-baseline gap-2 flex-wrap">
                <span className="bg-gradient-to-r from-gray-800 to-gray-600 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
                  Games
                </span>
                <span className="text-lg font-medium text-gray-500 dark:text-gray-400">
                  (by popularity)
                </span>
              </h2>
              {gameStatsLoading && gameStats.length > 0 && (
                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                  Updating...
                </div>
              )}
            </div>

            {(() => {
              const gamesByPopularity = GAMES.map(game => {
                const stats = gameStats.find(stat => stat.id === game.id)
                return {
                  id: game.id,
                  name: game.name,
                  icon: game.icon,
                  category: game.category,
                  totalGames: stats?.totalGames || 0,
                  topScore: stats?.topScore || null,
                  userBest: stats?.userBest || null,
                }
              }).sort((a, b) => b.totalGames - a.totalGames)

              return (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 xl:grid-cols-6 gap-3 pt-2 items-stretch">
                  {gamesByPopularity.map((game, index) => (
                    <SelectableGameCard
                      key={game.id}
                      game={game}
                      hasTopScore={Boolean(username && game.topScore?.username === username)}
                      index={index}
                      onSelect={() => handleGameClick(game.id, game.name)}
                    />
                  ))}
                </div>
              )
            })()}
          </div>

          {/* Live Activity Feed */}
          <div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent mb-8">
              Live Activity Feed
            </h2>
            {recentScores.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-gray-300/40 dark:border-gray-600/40 rounded-lg">
                <div className="text-6xl mb-4 animate-bounce-gentle">🧠</div>
                <p className="text-gray-600 dark:text-gray-300 font-medium">
                  No recent scores yet. Start assessments to see activity here!
                </p>
              </div>
            ) : (
              <div className="w-full overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-gray-300/20 dark:border-gray-500/20">
                      <th className="text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 py-3 px-4">
                        Player
                      </th>
                      <th className="text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 py-3 px-4">
                        Game
                      </th>
                      <th className="text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 py-3 px-4">
                        Score
                      </th>
                      <th className="text-right text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 py-3 px-4">
                        When
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentScores.map((score, index) => (
                      <tr
                        key={`${score.game_type}-${score.id}`}
                        className={`border-b border-gray-300/20 dark:border-gray-500/20 ${
                          index % 2 === 0
                            ? 'bg-transparent'
                            : 'bg-gray-100/40 dark:bg-gray-800/40'
                        }`}
                      >
                        <td className="py-3.5 px-4">
                          <span
                            className={`font-semibold ${
                              isUserScore(score.username)
                                ? 'text-blue-600 dark:text-blue-400'
                                : 'text-gray-800 dark:text-gray-100'
                            }`}
                          >
                            {score.username}
                            {isUserScore(score.username) && (
                              <span className="ml-2 text-[10px] font-bold uppercase tracking-wide text-blue-500 dark:text-blue-400">
                                You
                              </span>
                            )}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-sm text-gray-600 dark:text-gray-300">
                          {score.game_type}
                        </td>
                        <td className="py-3.5 px-4 text-sm font-medium text-gray-700 dark:text-gray-200">
                          {score.score_value}
                        </td>
                        <td className="py-3.5 px-4 text-sm text-gray-500 dark:text-gray-400 text-right whitespace-nowrap">
                          {formatTimeAgo(score.date_submitted)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
