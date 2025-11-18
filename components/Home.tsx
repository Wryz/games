'use client'

import { useState, useEffect, useCallback } from 'react'
import { useUser } from '@/contexts/UserContext'
import { useOverview } from '@/contexts/OverviewContext'
import { supabase } from '@/lib/supabase'
import { GAMES } from '@/types/games'
import { usePostHog } from 'posthog-js/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import AnimatedBrain from './AnimatedBrain'
import FeedbackForm from './FeedbackForm'

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
        .rpc('get_recent_activity', { p_limit: 10 }) as { data: any[] | null, error: any }

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
              const correctAnswers = scoreValue.correct_answers || 0
              const avgTime = scoreValue.average_time || 0
              formattedValue = `${formatNum(correctAnswers)} correct (${formatNum(avgTime)}ms avg)`
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
          
          {/* Learn More Button */}
          <div className="pt-2">
            <Link
              href="/about"
              className="inline-flex items-center gap-2 px-6 py-3 border-2 border-blue-600 dark:border-blue-500 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-500 dark:hover:text-white font-semibold rounded-lg transition-all duration-200 transform hover:scale-105"
            >
              Learn More
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
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
          {/* Enhanced Exercise Overview Grid - Organized by Category */}
          <div>
            <FeedbackForm />

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
                          <div className="grid grid-cols-2 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6 items-stretch">
                            {games.map((game, index) => {
                              const categoryColorsMap = {
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
                              }
                              const categoryBorderColorsMap = {
                                motor: 'border-blue-500 dark:border-blue-400',
                                memory: 'border-purple-500 dark:border-purple-400',
                                cognitive: 'border-cyan-500 dark:border-cyan-400',
                                perception: 'border-pink-500 dark:border-pink-400',
                                computation: 'border-orange-500 dark:border-orange-400',
                                linguistic: 'border-green-500 dark:border-green-400',
                                geography: 'border-teal-500 dark:border-teal-400',
                                attention: 'border-yellow-500 dark:border-yellow-400',
                                language: 'border-indigo-500 dark:border-indigo-400',
                                social: 'border-rose-500 dark:border-rose-400',
                                creative: 'border-violet-500 dark:border-violet-400',
                                spatial: 'border-emerald-500 dark:border-emerald-400',
                              }
                              const categoryGlowMap = {
                                motor: 'shadow-glow',
                                memory: 'shadow-glow-purple',
                                cognitive: 'shadow-glow-cyan',
                                perception: 'shadow-glow',
                                computation: 'shadow-glow',
                                linguistic: 'shadow-glow',
                                geography: 'shadow-glow',
                                attention: 'shadow-glow',
                                language: 'shadow-glow',
                                social: 'shadow-glow',
                                creative: 'shadow-glow',
                                spatial: 'shadow-glow',
                              }
                              const categoryBackgroundsMap = {
                                motor: 'bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/50',
                                memory: 'bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/50',
                                cognitive: 'bg-gradient-to-br from-cyan-50 to-cyan-100 dark:from-cyan-900/20 dark:to-cyan-800/50',
                                perception: 'bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-900/20 dark:to-pink-800/50',
                                computation: 'bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/50',
                                linguistic: 'bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/50',
                                geography: 'bg-gradient-to-br from-teal-50 to-teal-100 dark:from-teal-900/20 dark:to-teal-800/50',
                                attention: 'bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/50',
                                language: 'bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/50',
                                social: 'bg-gradient-to-br from-rose-50 to-rose-100 dark:from-rose-900/20 dark:to-rose-800/50',
                                creative: 'bg-gradient-to-br from-violet-50 to-violet-100 dark:from-violet-900/20 dark:to-violet-800/50',
                                spatial: 'bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/50',
                              }
                              
                              // Check if current user has the top score
                              const hasTopScore = username && game.topScore?.username === username
                              
                              return (
                                <div
                                  key={game.id}
                                  onClick={() => handleGameClick(game.id, game.name)}
                                  className={`group relative ${
                                    hasTopScore 
                                      ? categoryBackgroundsMap[game.category as keyof typeof categoryBackgroundsMap]
                                      : 'bg-white dark:bg-gray-800/50'
                                  } rounded-xl md:rounded-2xl border-2 ${categoryBorderColorsMap[game.category as keyof typeof categoryBorderColorsMap]} p-3 md:p-6 cursor-pointer h-full flex flex-col overflow-hidden transform transition-all duration-300 hover:scale-105 hover:shadow-card-3d ${categoryGlowMap[game.category as keyof typeof categoryGlowMap]}`}
                                  style={{
                                    animation: `fadeInUp 0.6s ease-out ${index * 0.05}s both`,
                                  }}
                                >
                                  {/* Animated border gradient on hover */}
                                  <div className={`absolute inset-0 rounded-xl md:rounded-2xl bg-gradient-to-r ${categoryColorsMap[game.category as keyof typeof categoryColorsMap]} opacity-0 group-hover:opacity-20 transition-opacity duration-300 -z-10 blur-md`} />
                                  
                                  <div className="relative z-10 flex flex-col h-full">
                                    {/* Mobile layout - Parent column flex */}
                                    <div className="md:hidden flex flex-row gap-2">
                                      {/* First div: Row flex with icon and user counter */}
                                      <div className="flex flex-col items-start justify-between">
                                        <div className={`transform transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6 bg-gradient-to-br ${categoryColorsMap[game.category as keyof typeof categoryColorsMap]} p-1 rounded-md flex-shrink-0`}>
                                          <game.icon size={20} className="text-white drop-shadow-sm" />
                                        </div>
                                        <div className="flex items-center gap-0.5 text-gray-500 dark:text-gray-400">
                                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-gray-400 dark:text-gray-500">
                                            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" fill="currentColor"/>
                                          </svg>
                                          <span className="text-[10px] font-medium">{game.totalGames.toLocaleString('en-US')}</span>
                                        </div>
                                      </div>
                                      
                                      {/* Second div: Title, top game score, and top game scorer */}
                                      <div>
                                        <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                                          <h3 className={`font-black text-sm line-clamp-2 bg-gradient-to-r ${categoryColorsMap[game.category as keyof typeof categoryColorsMap]} bg-clip-text text-transparent transition-all duration-300 leading-tight`}>
                                            {game.name}
                                          </h3>
                                          {game.id === 'pattern-recognition' && (
                                            <span className="text-[8px] font-bold uppercase tracking-wider bg-gradient-to-r from-orange-500 to-red-500 text-white px-1 py-0.5 rounded-md shadow-sm">
                                              Updated
                                            </span>
                                          )}
                                          {game.id === 'time-estimation' && (
                                            <span className="text-[8px] font-bold uppercase tracking-wider bg-gradient-to-r from-green-500 to-emerald-500 text-white px-1 py-0.5 rounded-md shadow-sm">
                                              New
                                            </span>
                                          )}
                                          {game.id === 'maze' && (
                                            <span className="text-[8px] font-bold uppercase tracking-wider bg-gradient-to-r from-green-500 to-emerald-500 text-white px-1 py-0.5 rounded-md shadow-sm">
                                              New
                                            </span>
                                          )}
                                          {(game.id === 'algebra' || game.id === 'arithmetic') && (
                                            <span className="text-[8px] font-bold uppercase tracking-wider bg-gradient-to-r from-green-500 to-emerald-500 text-white px-1 py-0.5 rounded-md shadow-sm">
                                              New
                                            </span>
                                          )}
                                          {(game.id === 'linear-algebra' || game.id === 'geometry' || 
                                            game.id === 'word-search' || game.id === 'anagrams' || game.id === 'countries') && (
                                            <span className="text-[8px] font-bold uppercase tracking-wider bg-gradient-to-r from-purple-500 to-indigo-500 text-white px-1 py-0.5 rounded-md shadow-sm">
                                              Soon
                                            </span>
                                          )}
                                        </div>
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
                                      <div className={`transform transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6 bg-gradient-to-br ${categoryColorsMap[game.category as keyof typeof categoryColorsMap]} p-2 rounded-lg flex-shrink-0`}>
                                        <game.icon size={36} className="text-white drop-shadow-sm" />
                                      </div>
                                      <div className="flex-1 min-w-0 pr-0">
                                        <div className="flex items-center gap-2 flex-wrap mb-2">
                                          <h3 className={`font-black text-lg line-clamp-2 bg-gradient-to-r ${categoryColorsMap[game.category as keyof typeof categoryColorsMap]} bg-clip-text text-transparent transition-all duration-300 leading-tight`}>
                                            {game.name}
                                          </h3>
                                          {game.id === 'pattern-recognition' && (
                                            <span className="text-[10px] font-bold uppercase tracking-wider bg-gradient-to-r from-orange-500 to-red-500 text-white px-1.5 py-0.5 rounded-md shadow-sm">
                                              Updated
                                            </span>
                                          )}
                                          {game.id === 'time-estimation' && (
                                            <span className="text-[10px] font-bold uppercase tracking-wider bg-gradient-to-r from-green-500 to-emerald-500 text-white px-1.5 py-0.5 rounded-md shadow-sm">
                                              New
                                            </span>
                                          )}
                                          {game.id === 'maze' && (
                                            <span className="text-[10px] font-bold uppercase tracking-wider bg-gradient-to-r from-green-500 to-emerald-500 text-white px-1.5 py-0.5 rounded-md shadow-sm">
                                              New
                                            </span>
                                          )}
                                          {(game.id === 'algebra' || game.id === 'arithmetic') && (
                                            <span className="text-[10px] font-bold uppercase tracking-wider bg-gradient-to-r from-green-500 to-emerald-500 text-white px-1.5 py-0.5 rounded-md shadow-sm">
                                              New
                                            </span>
                                          )}
                                          {(game.id === 'linear-algebra' || game.id === 'geometry' || 
                                            game.id === 'word-search' || game.id === 'anagrams' || game.id === 'countries') && (
                                            <span className="text-[10px] font-bold uppercase tracking-wider bg-gradient-to-r from-purple-500 to-indigo-500 text-white px-1.5 py-0.5 rounded-md shadow-sm">
                                              Soon
                                            </span>
                                          )}
                                        </div>
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
                                        <span className="text-xs font-medium">{game.totalGames.toLocaleString('en-US')}</span>
                                      </div>
                                    </div>

                                    {/* Spacer to push Your Best to bottom */}
                                    <div className="flex-1"></div>

                                    {/* User Best - Always at bottom */}
                                    {username && (
                                      <div className={`border-2 ${categoryBorderColorsMap[game.category as keyof typeof categoryBorderColorsMap]} border-dashed rounded-lg p-2 md:p-3 transform transition-all duration-300 group-hover:translate-x-1 group-hover:border-solid`}>
                                        <p className={`text-[10px] md:text-xs font-bold uppercase tracking-wide mb-0.5 md:mb-1 flex items-center gap-1 bg-gradient-to-r ${categoryColorsMap[game.category as keyof typeof categoryColorsMap]} bg-clip-text text-transparent`}>
                                          <span className="text-xs md:text-sm">⭐</span> Your Best
                                        </p>
                                        {game.userBest ? (
                                          <p className={`font-extrabold text-base md:text-xl bg-gradient-to-r ${categoryColorsMap[game.category as keyof typeof categoryColorsMap]} bg-clip-text text-transparent`}>
                                            {game.userBest.value}
                                          </p>
                                        ) : (
                                          <p className={`text-xs md:text-sm font-semibold bg-gradient-to-r ${categoryColorsMap[game.category as keyof typeof categoryColorsMap]} bg-clip-text text-transparent opacity-60`}>
                                            Not assessed yet
                                          </p>
                                        )}
                                      </div>
                                    )}
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
                    No recent scores yet. Start assessments to see activity here!
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
