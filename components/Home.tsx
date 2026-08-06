'use client'

import { useState, useEffect, useCallback } from 'react'
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

const GAME_STATUS_BADGES: Record<string, { label: string; className: string }> = {
  maze: { label: 'New', className: 'bg-emerald-500' },
  'word-search': { label: 'New', className: 'bg-emerald-500' },
  'linear-algebra': { label: 'New', className: 'bg-emerald-500' },
  geometry: { label: 'New', className: 'bg-emerald-500' },
  anagrams: { label: 'Soon', className: 'bg-indigo-500' },
  countries: { label: 'Soon', className: 'bg-indigo-500' },
}

const CATEGORY_SOLID: Record<string, string> = {
  motor: 'bg-blue-500',
  memory: 'bg-purple-500',
  cognitive: 'bg-cyan-500',
  perception: 'bg-pink-500',
  computation: 'bg-orange-500',
  linguistic: 'bg-green-500',
  geography: 'bg-teal-500',
  attention: 'bg-yellow-500',
  language: 'bg-indigo-500',
  social: 'bg-rose-500',
  creative: 'bg-violet-500',
  spatial: 'bg-emerald-500',
  other: 'bg-gray-500',
}

// Enhanced skeleton component for loading state
const GameCardSkeleton = () => {
  const solidColors = ['bg-blue-400', 'bg-purple-400', 'bg-cyan-400', 'bg-pink-400']
  const color = solidColors[Math.floor(Math.random() * solidColors.length)]

  return (
    <div
      className={`relative ${color} rounded-lg p-2 aspect-square flex flex-col overflow-hidden opacity-70`}
    >
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/30 to-transparent" />
      <div className="relative z-10 flex flex-col h-full animate-pulse">
        <div className="flex items-start justify-between gap-1">
          <div className="space-y-1">
            <div className="h-2.5 bg-white/40 rounded w-12" />
            <div className="h-2 bg-white/30 rounded w-10 ml-3" />
          </div>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center gap-1">
          <div className="w-8 h-8 bg-white/30 rounded-md" />
          <div className="h-3 bg-white/40 rounded w-2/3" />
          <div className="h-2.5 bg-white/30 rounded w-1/2" />
        </div>
        <div className="h-6 bg-white/25 rounded w-full" />
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
            case 'sequence-memory':
              formattedValue = `Level ${formatNum(scoreValue.level_reached)} (${formatNum(scoreValue.longest_sequence)} shapes)`
              break
            case 'pattern-recognition':
              formattedValue = `${formatNum(scoreValue.patterns_solved)} patterns`
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
              const timeTaken = scoreValue.time_taken || 0
              const seconds = Math.floor(timeTaken / 1000)
              const milliseconds = Math.floor((timeTaken % 1000) / 100)
              formattedValue = `${formatNum(seconds)}.${milliseconds}s`
              break
            case 'algebra':
            case 'arithmetic':
            case 'linear-algebra':
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
      'pattern_recognition_scores',
      'reaction_time_scores',
      'number_memory_scores',
      'visual_memory_scores',
      'stroop_test_scores',
      'sequence_memory_scores',
      'chimp_test_scores',
      'time_estimation_scores',
      'maze_scores',
      'algebra_scores',
      'arithmetic_scores',
      'linear_algebra_scores',
      'geometry_scores',
      'word_search_scores'
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
          {/* Recent Activity Skeleton */}
          <div className="mb-8">
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

          {/* Games Overview Skeleton */}
          <div>
            <h2 className="text-2xl font-bold text-gray-700 dark:text-gray-100 mb-6">
              Games Overview
            </h2>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 xl:grid-cols-6 gap-3">
              {[...Array(12)].map((_, i) => (
                <GameCardSkeleton key={i} />
              ))}
            </div>
          </div>
        </div>
      ) : (
        <>
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

          {/* Enhanced Exercise Overview Grid - Organized by Category */}
          <div>
            <div className="flex items-center justify-between mb-8">
              {gameStatsLoading && gameStats.length > 0 && (
                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                  Updating...
                </div>
              )}
            </div>
            
            {(() => {
                // Merge GAMES with gameStats to show exercises immediately, even if stats haven't loaded
                // This allows instant navigation while stats load in the background
                const gamesWithStats = GAMES.map(game => {
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
                })

                // Group games by category
                const gamesByCategory = gamesWithStats.reduce((acc, game) => {
                  const category = game.category || 'other'
                  if (!acc[category]) {
                    acc[category] = []
                  }
                  acc[category].push(game)
                  return acc
                }, {} as Record<string, typeof gamesWithStats>)

                // Category display names
                const categoryNames: Record<string, string> = {
                  motor: 'Motor Skills',
                  memory: 'Memory',
                  cognitive: 'Cognitive',
                  perception: 'Perception',
                  computation: 'Computation',
                  linguistic: 'Linguistic',
                  geography: 'Geography',
                  attention: 'Attention',
                  language: 'Language',
                  social: 'Social',
                  creative: 'Creative',
                  spatial: 'Spatial',
                  other: 'Other'
                }

                // Category order (you can customize this)
                const categoryOrder = ['motor', 'memory', 'cognitive', 'perception', 'computation', 'linguistic', 'geography', 'attention', 'language', 'social', 'creative', 'spatial', 'other']

                return (
                  <div className="space-y-12">
                    {categoryOrder.map((category) => {
                      const games = gamesByCategory[category]
                      if (!games || games.length === 0) return null

                      const categoryColors = {
                        motor: 'from-blue-500 to-blue-600',
                        memory: 'from-purple-500 to-purple-600',
                        cognitive: 'from-cyan-500 to-cyan-600',
                        perception: 'from-pink-500 to-pink-600',
                        computation: 'from-orange-500 to-orange-600',
                        linguistic: 'from-green-500 to-green-600',
                        geography: 'from-teal-500 to-teal-600',
                        attention: 'from-yellow-500 to-yellow-600',
                        language: 'from-indigo-500 to-indigo-600',
                        social: 'from-rose-500 to-rose-600',
                        creative: 'from-violet-500 to-violet-600',
                        spatial: 'from-emerald-500 to-emerald-600',
                        other: 'from-gray-500 to-gray-600',
                      }

                      return (
                        <div key={category} className="space-y-4">
                          {/* Category Header */}
                          <div className="flex items-center gap-3">
                            <h2 className={`text-2xl font-bold bg-gradient-to-r ${categoryColors[category as keyof typeof categoryColors]} bg-clip-text text-transparent`}>
                              {categoryNames[category] || category.charAt(0).toUpperCase() + category.slice(1)}
                            </h2>
                            <div className="flex-1 h-px bg-gradient-to-r from-gray-300 via-gray-200 to-transparent dark:from-gray-600 dark:via-gray-700"></div>
                            <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                              {games.length} {games.length === 1 ? 'exercise' : 'exercises'}
                            </span>
                          </div>
                          
                          {/* Exercises Grid for this Category */}
                          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 xl:grid-cols-6 gap-3 pt-2 items-stretch">
                            {games.map((game, index) => {
                              const hasTopScore = Boolean(username && game.topScore?.username === username)
                              const statusBadge = GAME_STATUS_BADGES[game.id]
                              const solidBg =
                                CATEGORY_SOLID[game.category] || CATEGORY_SOLID.other

                              return (
                                <div
                                  key={game.id}
                                  onClick={() => handleGameClick(game.id, game.name)}
                                  className="group relative cursor-pointer transform transition-all duration-200 hover:scale-105"
                                  style={{
                                    animation: `fadeInUp 0.6s ease-out ${index * 0.05}s both`,
                                  }}
                                >
                                  {/* Tilted crown covering top-left edge when user holds #1 */}
                                  {hasTopScore && (
                                    <div className="pointer-events-none absolute -left-2 -top-2.5 z-20 -rotate-[28deg] transition-transform duration-300 group-hover:-rotate-[16deg] group-hover:scale-110">
                                      <CrownIcon
                                        size={32}
                                        className="w-7 h-7 sm:w-8 sm:h-8 text-amber-300 drop-shadow-[0_1px_3px_rgba(0,0,0,0.4)]"
                                      />
                                    </div>
                                  )}

                                  {/* Icon badge as the card container */}
                                  <div
                                    className={`relative aspect-square overflow-hidden rounded-lg ${solidBg} p-2 sm:p-2.5 flex flex-col text-white shadow-sm`}
                                  >
                                    <div className="relative z-10 flex flex-col h-full min-h-0">
                                      {/* Top row: high scorer */}
                                      <div className="flex items-start justify-between gap-1">
                                        <div className="min-w-0 max-w-full">
                                          {game.topScore ? (
                                            <>
                                              <div className="flex items-center gap-1">
                                                <CrownIcon
                                                  size={14}
                                                  className="w-3.5 h-3.5 flex-shrink-0 text-amber-200"
                                                />
                                                <span className="truncate text-[11px] sm:text-xs font-semibold text-white/95 leading-tight">
                                                  {game.topScore.username}
                                                </span>
                                              </div>
                                              <p className="truncate text-[10px] sm:text-[11px] font-medium text-white/75 leading-tight mt-0.5 pl-[18px]">
                                                {game.topScore.value}
                                              </p>
                                            </>
                                          ) : (
                                            <span className="truncate text-[11px] italic text-white/60 leading-tight">
                                              —
                                            </span>
                                          )}
                                        </div>
                                      </div>

                                      {/* Center: game icon + name + play count */}
                                      <div className="flex-1 flex flex-col items-center justify-center gap-1 min-h-0 py-1">
                                        <div className="transform transition-transform duration-200 group-hover:scale-110 group-hover:rotate-6">
                                          <game.icon className="w-8 h-8 sm:w-9 sm:h-9 text-white drop-shadow-sm" />
                                        </div>
                                        <div className="flex items-center justify-center gap-1 flex-wrap px-0.5">
                                          <h3 className="font-bold text-xs sm:text-sm text-center text-white leading-tight line-clamp-2">
                                            {game.name}
                                          </h3>
                                          {statusBadge && (
                                            <span
                                              className={`text-[9px] font-bold uppercase tracking-wider ${statusBadge.className} text-white px-1 py-0.5 rounded shadow-sm`}
                                            >
                                              {statusBadge.label}
                                            </span>
                                          )}
                                        </div>
                                        <div className="flex items-center gap-0.5 text-white/80">
                                          <PeopleIcon size={14} className="w-3.5 h-3.5" />
                                          <span className="text-[11px] sm:text-xs font-medium tabular-nums leading-tight">
                                            {game.totalGames.toLocaleString('en-US')} played
                                          </span>
                                        </div>
                                      </div>

                                      {/* Bottom: user stats */}
                                      {username && (
                                        <div className="mt-auto rounded border border-white/25 bg-black/20 px-1.5 py-1.5">
                                          <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wide text-white/70 leading-none mb-0.5">
                                            Your Best
                                          </p>
                                          {game.userBest ? (
                                            <p className="font-bold text-xs sm:text-sm text-white leading-tight line-clamp-1">
                                              {game.userBest.value}
                                            </p>
                                          ) : (
                                            <p className="text-[11px] font-medium text-white/60 leading-tight">
                                              Not yet
                                            </p>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )
              })()}
          </div>
        </>
      )}
    </div>
  )
}
