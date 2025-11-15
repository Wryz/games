'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@/contexts/UserContext'
import { useOverview } from '@/contexts/OverviewContext'
import { supabase } from '@/lib/supabase'
import { GAMES } from '@/types/games'
import { usePostHog } from 'posthog-js/react'
import { useRouter } from 'next/navigation'
import AnimatedBrain from './AnimatedBrain'

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

// Enhanced skeleton component for loading state
const GameCardSkeleton = () => {
  const randomColors = ['blue', 'purple', 'cyan', 'pink'][Math.floor(Math.random() * 4)]
  const colorClasses = {
    blue: 'border-blue-300 dark:border-blue-600',
    purple: 'border-purple-300 dark:border-purple-600',
    cyan: 'border-cyan-300 dark:border-cyan-600',
    pink: 'border-pink-300 dark:border-pink-600',
  }
  
  return (
    <div className={`relative bg-white dark:bg-gray-800/50 rounded-2xl border-2 ${colorClasses[randomColors as keyof typeof colorClasses]} p-6 aspect-square flex flex-col overflow-hidden`}>
      {/* Animated shimmer effect */}
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-gray-200/50 dark:via-gray-600/50 to-transparent"></div>
      
      <div className="relative z-10 animate-pulse">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-700 rounded-lg"></div>
          <div className="flex-1">
            <div className="h-5 bg-gradient-to-r from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-700 rounded-lg w-3/4 mb-2"></div>
            <div className="h-3 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 rounded-full w-1/2"></div>
          </div>
        </div>
        
        <div className="flex-1 space-y-3 mt-6">
          <div className={`border-2 ${colorClasses[randomColors as keyof typeof colorClasses]} rounded-lg p-3`}>
            <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-1/3 mb-2"></div>
            <div className="h-6 bg-gray-400 dark:bg-gray-600 rounded-lg w-1/2 mb-2"></div>
            <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-2/3"></div>
          </div>
          
          <div className={`border-2 border-dashed ${colorClasses[randomColors as keyof typeof colorClasses]} rounded-lg p-3`}>
            <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-1/3 mb-2"></div>
            <div className="h-6 bg-gradient-to-r from-gray-400 to-gray-500 dark:from-gray-600 dark:to-gray-700 rounded-lg w-2/3"></div>
          </div>
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
      // Use RPC function to get recent activity across all games
      const { data: rpcData, error } = await supabase
        .rpc('get_recent_activity', { p_limit: 10 }) as { data: any[] | null, error: any }

      if (error) throw error

      // Format the scores for display
      const formattedScores: RecentScore[] = []

      if (Array.isArray(rpcData)) {
        rpcData.forEach((item: any, index: number) => {
          const scoreValue = item.score_value
          let formattedValue = ''
          
          // Format based on game type
          switch (item.game_id) {
            case 'aim-trainer':
              formattedValue = `${scoreValue.reaction_time}ms (${scoreValue.accuracy}%)`
              break
            case 'typing-test':
              formattedValue = `${scoreValue.wpm} WPM (${scoreValue.accuracy}%)`
              break
            case 'reaction-time':
              formattedValue = `${scoreValue.fastest_time}ms (${scoreValue.average_time}ms avg)`
              break
            case 'visual-memory':
              formattedValue = `Level ${scoreValue.level_reached} (${scoreValue.total_patterns} patterns)`
              break
            case 'sequence-memory':
              formattedValue = `Level ${scoreValue.level_reached} (${scoreValue.longest_sequence} shapes)`
              break
            case 'pattern-recognition':
              formattedValue = `${scoreValue.patterns_solved} patterns`
              break
            case 'stroop-test':
              formattedValue = `${scoreValue.correct_answers}/${scoreValue.total_questions}`
              break
            case 'number-memory':
              formattedValue = `${scoreValue.longest_sequence} digits`
              break
            default:
              formattedValue = `Level ${scoreValue.level_reached}`
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
      {/* Enhanced Hero Section */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-8 py-12 animate-fade-in-up">
        {/* Hero Text - Left Side */}
        <div className="flex-1 space-y-6 text-left">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold leading-tight">
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-500 bg-clip-text text-transparent animate-gradient-shift bg-[length:200%_auto]">
              Brain Benchmark
            </span>
          </h1>
          <p className="text-lg md:text-xl lg:text-2xl text-gray-600 dark:text-gray-300 font-medium max-w-xl">
            Level up your brain through engaging cognitive challenges
          </p>
          <div className="flex items-center gap-6 text-sm text-gray-500 dark:text-gray-400 pt-2 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse" />
              <span>Motor Skills</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse" style={{ animationDelay: '0.3s' }} />
              <span>Memory</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-cyan-500 rounded-full animate-pulse" style={{ animationDelay: '0.6s' }} />
              <span>Cognition</span>
            </div>
          </div>
        </div>
        
        {/* Animated Brain Icon - Right Side */}
        <div className="flex-shrink-0">
          <AnimatedBrain />
        </div>
      </div>

      {loading && gameStats.length === 0 ? (
        <div>
          {/* Games Overview Skeleton */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-700 dark:text-gray-100 mb-6">
              Games Overview
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <GameCardSkeleton key={i} />
              ))}
            </div>
          </div>
          
          {/* Recent Activity Skeleton */}
          <div>
            <h2 className="text-2xl font-bold text-gray-700 dark:text-gray-100 mb-6">
              Recent Activity
            </h2>
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-4 animate-pulse">
                    <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Enhanced Game Overview Grid */}
          <div>
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
                Choose Your Challenge
              </h2>
              {gameStatsLoading && gameStats.length > 0 && (
                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                  Updating...
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
              {gameStats.length === 0 ? (
                // Show skeleton cards only when no data is available (initial load)
                Array.from({ length: GAMES.length }).map((_, index) => (
                  <GameCardSkeleton key={`skeleton-${index}`} />
                ))
              ) : (
                gameStats.map((game, index) => {
                  const categoryColors = {
                    motor: 'from-blue-500 to-blue-600',
                    memory: 'from-purple-500 to-purple-600',
                    cognitive: 'from-cyan-500 to-cyan-600',
                    perception: 'from-pink-500 to-pink-600',
                  }
                  const categoryBorderColors = {
                    motor: 'border-blue-500 dark:border-blue-400',
                    memory: 'border-purple-500 dark:border-purple-400',
                    cognitive: 'border-cyan-500 dark:border-cyan-400',
                    perception: 'border-pink-500 dark:border-pink-400',
                  }
                  const categoryGlow = {
                    motor: 'shadow-glow',
                    memory: 'shadow-glow-purple',
                    cognitive: 'shadow-glow-cyan',
                    perception: 'shadow-glow',
                  }
                  
                  return (
                    <div
                      key={game.id}
                      onClick={() => handleGameClick(game.id, game.name)}
                      className={`group relative bg-white dark:bg-gray-800/50 rounded-xl md:rounded-2xl border-2 ${categoryBorderColors[game.category as keyof typeof categoryBorderColors]} p-3 md:p-6 cursor-pointer aspect-square flex flex-col overflow-hidden transform transition-all duration-300 hover:scale-105 hover:shadow-card-3d ${categoryGlow[game.category as keyof typeof categoryGlow]}`}
                      style={{
                        animation: `fadeInUp 0.6s ease-out ${index * 0.05}s both`,
                      }}
                    >
                      {/* Animated border gradient on hover */}
                      <div className={`absolute inset-0 rounded-xl md:rounded-2xl bg-gradient-to-r ${categoryColors[game.category as keyof typeof categoryColors]} opacity-0 group-hover:opacity-20 transition-opacity duration-300 -z-10 blur-md`} />
                      
                      <div className="relative z-10 flex flex-col h-full">
                        {/* Mobile layout - Parent column flex */}
                        <div className="md:hidden flex flex-row gap-2">
                          {/* First div: Row flex with icon and user counter */}
                          <div className="flex flex-col items-start justify-between">
                          <div className={`transform transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6 bg-gradient-to-br ${categoryColors[game.category as keyof typeof categoryColors]} p-1 rounded-md flex-shrink-0`}>
                              <game.icon size={20} className="text-white drop-shadow-sm" />
                            </div>
                            <div className="flex items-center gap-0.5 text-gray-500 dark:text-gray-400">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-gray-400 dark:text-gray-500">
                                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" fill="currentColor"/>
                              </svg>
                              <span className="text-[10px] font-medium">{game.totalGames}</span>
                            </div>
                           
                          </div>
                          
                          {/* Second div: Title, top game score, and top game scorer */}
                          <div>
                            <h3 className={`font-black text-sm line-clamp-2 bg-gradient-to-r ${categoryColors[game.category as keyof typeof categoryColors]} bg-clip-text text-transparent transition-all duration-300 leading-tight`}>
                              {game.name}
                            </h3>
                            {/* Top Scorer */}
                            {game.topScore ? (
                              <div className="text-xs mt-0.5">
                                <p className="font-semibold text-xs text-gray-900 dark:text-white">
                                  {game.topScore.value}
                                </p>
                                <p className="text-gray-500 dark:text-gray-400 font-medium text-[10px]">
                                  {game.topScore.username}
                                </p>
                              </div>
                            ) : (
                              <p className="text-[10px] text-gray-400 dark:text-gray-500 italic mt-0.5">
                                No scores yet
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Desktop layout - traditional with icon on left */}
                        <div className="hidden md:flex items-start space-x-3 mb-4">
                          <div className={`transform transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6 bg-gradient-to-br ${categoryColors[game.category as keyof typeof categoryColors]} p-2 rounded-lg flex-shrink-0`}>
                            <game.icon size={36} className="text-white drop-shadow-sm" />
                          </div>
                          <div className="flex-1 min-w-0 pr-0">
                            <h3 className={`font-black text-lg line-clamp-2 bg-gradient-to-r ${categoryColors[game.category as keyof typeof categoryColors]} bg-clip-text text-transparent transition-all duration-300 leading-tight mb-2`}>
                              {game.name}
                            </h3>
                            {/* Top Scorer */}
                            {game.topScore ? (
                              <div className="text-xs">
                                <p className="font-semibold text-base text-gray-900 dark:text-white">
                                  {game.topScore.value}
                                </p>
                                <p className="text-gray-500 dark:text-gray-400 font-medium">
                                  {game.topScore.username}
                                </p>
                              </div>
                            ) : (
                              <p className="text-xs text-gray-400 dark:text-gray-500 italic">
                                No scores yet
                              </p>
                            )}
                          </div>
                          {/* Desktop Games Counter */}
                          <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-gray-400 dark:text-gray-500">
                              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" fill="currentColor"/>
                            </svg>
                            <span className="text-xs font-medium">{game.totalGames}</span>
                          </div>
                        </div>

                        {/* Spacer to push Your Best to bottom */}
                        <div className="flex-1"></div>

                        {/* User Best - Always at bottom */}
                        {username && (
                          <div className={`border-2 ${categoryBorderColors[game.category as keyof typeof categoryBorderColors]} border-dashed rounded-lg p-2 md:p-3 transform transition-all duration-300 group-hover:translate-x-1 group-hover:border-solid`}>
                            <p className={`text-[10px] md:text-xs font-bold uppercase tracking-wide mb-0.5 md:mb-1 flex items-center gap-1 bg-gradient-to-r ${categoryColors[game.category as keyof typeof categoryColors]} bg-clip-text text-transparent`}>
                              <span className="text-xs md:text-sm">⭐</span> Your Best
                            </p>
                            {game.userBest ? (
                              <p className={`font-extrabold text-base md:text-xl bg-gradient-to-r ${categoryColors[game.category as keyof typeof categoryColors]} bg-clip-text text-transparent`}>
                                {game.userBest.value}
                              </p>
                            ) : (
                              <p className={`text-xs md:text-sm font-semibold bg-gradient-to-r ${categoryColors[game.category as keyof typeof categoryColors]} bg-clip-text text-transparent opacity-60`}>
                                Not played yet
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* Enhanced Recent Activity */}
          <div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent mb-8">
              Live Activity Feed
            </h2>
            <div className="space-y-3">
              {recentScores.length === 0 ? (
                <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-700">
                  <div className="text-6xl mb-4 animate-bounce-gentle">🧠</div>
                  <p className="text-gray-600 dark:text-gray-300 font-medium">
                    No recent scores yet. Start playing games to see activity here!
                  </p>
                </div>
              ) : (
                recentScores.map((score, index) => (
                  <div
                    key={`${score.game_type}-${score.id}`}
                    className={`group relative p-5 rounded-xl border-2 transition-all duration-300 transform hover:scale-[1.02] animate-slide-in ${
                      isUserScore(score.username)
                        ? 'bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-blue-300 dark:border-blue-700 shadow-glow'
                        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-lg'
                    }`}
                    style={{
                      animationDelay: `${index * 0.05}s`,
                    }}
                  >
                    {/* Decorative corner accent */}
                    <div className="absolute top-0 left-0 w-16 h-16 opacity-10">
                      <div className={`absolute top-2 left-2 w-3 h-3 rounded-full ${
                        isUserScore(score.username) ? 'bg-blue-500' : 'bg-gray-400'
                      } animate-ping`} />
                      <div className={`absolute top-2 left-2 w-3 h-3 rounded-full ${
                        isUserScore(score.username) ? 'bg-blue-500' : 'bg-gray-400'
                      }`} />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 flex-1">
                          {/* Animated indicator */}
                        <div className="relative flex-shrink-0">
                            <div className={`w-3 h-3 rounded-full animate-pulse ${
                              isUserScore(score.username) ? 'bg-blue-500 shadow-glow' : 'bg-gray-400'
                            }`} />
                          </div>
                          
                        <div className="flex items-center gap-2 flex-wrap flex-1">
                              <span className={`font-bold text-lg ${
                                isUserScore(score.username)
                                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent'
                                  : 'text-gray-800 dark:text-gray-100'
                              }`}>
                                {score.username}
                                {isUserScore(score.username) && (
                                  <span className="ml-2 text-xs bg-gradient-to-r from-blue-500 to-purple-500 text-white px-3 py-1 rounded-full shadow-glow animate-pulse-glow">
                                    You
                                  </span>
                                )}
                              </span>
                              <span className="text-gray-500 dark:text-gray-400">•</span>
                              <span className="text-sm font-semibold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
                                {score.game_type}
                              </span>
                          <span className="text-gray-500 dark:text-gray-400">•</span>
                          {(() => {
                            // Parse score_value to split into separate bubbles
                            const match = score.score_value.match(/^(.+?)\s*\((.+?)\)$/)
                            if (match) {
                              const [, primary, secondary] = match
                              return (
                                <>
                                  <span className="text-sm font-semibold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
                                    {primary}
                                  </span>
                                  <span className="text-sm font-semibold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
                                    {secondary}
                                  </span>
                                </>
                              )
                            }
                            // Fallback for scores without parentheses
                            return (
                              <span className="text-sm font-semibold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
                                {score.score_value}
                              </span>
                            )
                          })()}
                        </div>
                      </div>
                      
                      <div className="text-sm font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full ml-4 flex-shrink-0">
                          {formatTimeAgo(score.date_submitted)}
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
