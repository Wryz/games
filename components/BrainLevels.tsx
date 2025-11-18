'use client'

import { useMemo, useEffect } from 'react'
import { GAMES } from '@/types/games'
import { 
  calculateGameLevel, 
  formatThreshold,
  formatUserScore,
  formatNumber,
  EDUCATION_LEVELS,
  type CategoryLevelInfo,
  type GameCategory
} from '@/lib/levels'
import { useOverview } from '@/contexts/OverviewContext'
import EducationBadge from './EducationBadge'
import ScoresOverview from './ScoresOverview'
import GameBadge from './GameBadge'
import { GAME_BADGES, BUILT_GAMES, getEarnedBadges } from '@/lib/badges'

interface BrainLevelsProps {
  username?: string
}

// Helper function to format all score details for each game type
function formatScoreDetails(gameId: string, score: any): Array<{ label: string; value: string }> {
  if (!score) return []

  const details: Array<{ label: string; value: string }> = []

  switch (gameId) {
    case 'aim-trainer':
      if (score.accuracy !== undefined) details.push({ label: 'Accuracy', value: `${formatNumber(score.accuracy)}%` })
      if (score.reaction_time !== undefined) details.push({ label: 'Reaction Time', value: `${formatNumber(score.reaction_time)}ms` })
      if (score.targets_hit !== undefined) details.push({ label: 'Targets Hit', value: formatNumber(score.targets_hit) })
      if (score.total_targets !== undefined) details.push({ label: 'Total Targets', value: formatNumber(score.total_targets) })
      break

    case 'typing-test':
      if (score.wpm !== undefined) details.push({ label: 'WPM', value: formatNumber(score.wpm) })
      if (score.accuracy !== undefined) details.push({ label: 'Accuracy', value: `${formatNumber(score.accuracy)}%` })
      if (score.characters_typed !== undefined) details.push({ label: 'Characters Typed', value: formatNumber(score.characters_typed) })
      if (score.time_taken !== undefined) details.push({ label: 'Time Taken', value: `${formatNumber(score.time_taken)}s` })
      break

    case 'reaction-time':
      if (score.fastest_time !== undefined) details.push({ label: 'Fastest Time', value: `${formatNumber(score.fastest_time)}ms` })
      if (score.average_time !== undefined) details.push({ label: 'Average Time', value: `${formatNumber(score.average_time)}ms` })
      if (score.attempts !== undefined) details.push({ label: 'Attempts', value: formatNumber(score.attempts) })
      break

    case 'visual-memory':
      if (score.level_reached !== undefined) details.push({ label: 'Level Reached', value: formatNumber(score.level_reached) })
      if (score.total_patterns !== undefined) details.push({ label: 'Total Patterns', value: formatNumber(score.total_patterns) })
      break

    case 'sequence-memory':
      if (score.level_reached !== undefined) details.push({ label: 'Level Reached', value: formatNumber(score.level_reached) })
      if (score.longest_sequence !== undefined) details.push({ label: 'Longest Sequence', value: formatNumber(score.longest_sequence) })
      break

    case 'pattern-recognition':
      if (score.patterns_solved !== undefined) details.push({ label: 'Patterns Solved', value: formatNumber(score.patterns_solved) })
      if (score.time_taken !== undefined) details.push({ label: 'Time Taken', value: `${formatNumber(score.time_taken)}s` })
      if (score.difficulty_level !== undefined) details.push({ label: 'Difficulty Level', value: formatNumber(score.difficulty_level) })
      break

    case 'stroop-test':
      if (score.correct_answers !== undefined) details.push({ label: 'Correct Answers', value: formatNumber(score.correct_answers) })
      if (score.average_time !== undefined) details.push({ label: 'Average Time', value: `${formatNumber(score.average_time)}ms` })
      break

    case 'number-memory':
      if (score.longest_sequence !== undefined) details.push({ label: 'Longest Sequence', value: `${formatNumber(score.longest_sequence)} digits` })
      break

    case 'memory':
      if (score.level_reached !== undefined) details.push({ label: 'Level Reached', value: formatNumber(score.level_reached) })
      if (score.correct_sequences !== undefined) details.push({ label: 'Correct Sequences', value: formatNumber(score.correct_sequences) })
      if (score.total_sequences !== undefined) details.push({ label: 'Total Sequences', value: formatNumber(score.total_sequences) })
      break

    case 'chimp-test':
      if (score.patterns_remembered !== undefined) details.push({ label: 'Correct', value: formatNumber(score.patterns_remembered) })
      break

    case 'time-estimation':
      if (score.average_accuracy !== undefined) details.push({ label: 'Average Accuracy', value: `${formatNumber(score.average_accuracy)}ms` })
      if (score.best_accuracy !== undefined) details.push({ label: 'Best Accuracy', value: `${formatNumber(score.best_accuracy)}ms` })
      break

    case 'maze':
      if (score.time_taken !== undefined) {
        const seconds = Math.floor(score.time_taken / 1000)
        const milliseconds = Math.floor((score.time_taken % 1000) / 100)
        details.push({ label: 'Time Taken', value: `${formatNumber(seconds)}.${milliseconds}s` })
      }
      break

    case 'algebra':
      if (score.correct_answers !== undefined) details.push({ label: 'Correct Answers', value: formatNumber(score.correct_answers) })
      if (score.average_time !== undefined) details.push({ label: 'Average Time', value: `${formatNumber(score.average_time)}ms` })
      break

    case 'arithmetic':
      if (score.correct_answers !== undefined) details.push({ label: 'Correct Answers', value: formatNumber(score.correct_answers) })
      if (score.average_time !== undefined) details.push({ label: 'Average Time', value: `${formatNumber(score.average_time)}ms` })
      break

    default:
      // Generic fallback for any other fields
      Object.keys(score).forEach(key => {
        if (key !== 'id' && key !== 'username' && key !== 'date_submitted' && score[key] !== null && score[key] !== undefined) {
          const formattedKey = key.split('_').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
          ).join(' ')
          details.push({ label: formattedKey, value: String(score[key]) })
        }
      })
  }

  return details
}

export default function BrainLevels({ username }: BrainLevelsProps) {
  const { gameStats, loadGameStats } = useOverview()

  // Load game stats with username when component mounts or username changes
  useEffect(() => {
    if (username) {
      loadGameStats(true, username)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username])

  const categoryLevels = useMemo(() => {
    // Get all unique categories from games
    const allCategories = Array.from(new Set(GAMES.map(g => g.category))) as GameCategory[]
    const categories: GameCategory[] = allCategories
    const categoryData: CategoryLevelInfo[] = []

    categories.forEach(category => {
      const categoryGames = GAMES.filter(g => g.category === category)
      const categoryGameStats = gameStats.filter(gs => 
        categoryGames.some(cg => cg.id === gs.id)
      )

      const gameLevels = categoryGames.map(game => {
        const gameStat = categoryGameStats.find(gs => gs.id === game.id)
        const levelInfo = calculateGameLevel(game.id, gameStat?.userBest?.score || null)
        return {
          gameId: game.id,
          gameName: game.name,
          levelInfo
        }
      })

      // Category level is the minimum level across all games
      const levels = gameLevels.map(g => g.levelInfo.currentLevel)
      const categoryLevel = levels.length > 0 ? Math.min(...levels) : 1

      // Get education level for the category level
      const educationLevel = EDUCATION_LEVELS[categoryLevel] || 'Unknown'

      categoryData.push({
        category,
        level: categoryLevel,
        educationLevel,
        games: gameLevels
      })
    })

    return categoryData
  }, [gameStats])

  const categoryColors = {
    motor: {
      border: 'border-blue-500',
      text: 'text-blue-600 dark:text-blue-400',
      hex: '#3b82f6' // blue-500
    },
    memory: {
      border: 'border-purple-500',
      text: 'text-purple-600 dark:text-purple-400',
      hex: '#a855f7' // purple-500
    },
    perception: {
      border: 'border-pink-500',
      text: 'text-pink-600 dark:text-pink-400',
      hex: '#ec4899' // pink-500
    },
    cognitive: {
      border: 'border-cyan-500',
      text: 'text-cyan-600 dark:text-cyan-400',
      hex: '#06b6d4' // cyan-500
    },
    computation: {
      border: 'border-orange-500',
      text: 'text-orange-600 dark:text-orange-400',
      hex: '#f97316' // orange-500
    },
    linguistic: {
      border: 'border-green-500',
      text: 'text-green-600 dark:text-green-400',
      hex: '#22c55e' // green-500
    },
    geography: {
      border: 'border-teal-500',
      text: 'text-teal-600 dark:text-teal-400',
      hex: '#14b8a6' // teal-500
    },
    attention: {
      border: 'border-yellow-500',
      text: 'text-yellow-600 dark:text-yellow-400',
      hex: '#eab308' // yellow-500
    },
    language: {
      border: 'border-indigo-500',
      text: 'text-indigo-600 dark:text-indigo-400',
      hex: '#6366f1' // indigo-500
    },
    social: {
      border: 'border-rose-500',
      text: 'text-rose-600 dark:text-rose-400',
      hex: '#f43f5e' // rose-500
    },
    creative: {
      border: 'border-violet-500',
      text: 'text-violet-600 dark:text-violet-400',
      hex: '#8b5cf6' // violet-500
    },
    spatial: {
      border: 'border-emerald-500',
      text: 'text-emerald-600 dark:text-emerald-400',
      hex: '#10b981' // emerald-500
    }
  }

  const categoryLabels = {
    motor: 'Motor Skills',
    memory: 'Memory',
    perception: 'Perception',
    cognitive: 'Cognitive',
    computation: 'Computation',
    linguistic: 'Linguistic',
    geography: 'Geography',
    attention: 'Attention',
    language: 'Language',
    social: 'Social',
    creative: 'Creative',
    spatial: 'Spatial'
  }

  // Calculate highest level achieved across all games
  const highestLevel = useMemo(() => {
    let maxLevel = 1
    categoryLevels.forEach(categoryData => {
      categoryData.games.forEach(game => {
        if (game.levelInfo.currentLevel > maxLevel) {
          maxLevel = game.levelInfo.currentLevel
        }
      })
    })
    return maxLevel
  }, [categoryLevels])

  // Get all levels the user has achieved
  const achievedLevels = useMemo(() => {
    const levels = new Set<number>()
    categoryLevels.forEach(categoryData => {
      categoryData.games.forEach(game => {
        levels.add(game.levelInfo.currentLevel)
      })
    })
    return levels
  }, [categoryLevels])

  if (!username) {
    return null
  }

  const categoryGradients = {
    motor: 'from-blue-500 to-blue-600',
    memory: 'from-purple-500 to-purple-600',
    perception: 'from-pink-500 to-pink-600',
    cognitive: 'from-cyan-500 to-cyan-600',
    computation: 'from-orange-500 to-orange-600',
    linguistic: 'from-green-500 to-green-600',
    geography: 'from-teal-500 to-teal-600',
    attention: 'from-yellow-500 to-yellow-600',
    language: 'from-indigo-500 to-indigo-600',
    social: 'from-rose-500 to-rose-600',
    creative: 'from-violet-500 to-violet-600',
    spatial: 'from-emerald-500 to-emerald-600',
  }

  const categoryBackgrounds = {
    motor: 'bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/50',
    memory: 'bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/50',
    perception: 'bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-900/20 dark:to-pink-800/50',
    cognitive: 'bg-gradient-to-br from-cyan-50 to-cyan-100 dark:from-cyan-900/20 dark:to-cyan-800/50',
    computation: 'bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/50',
    linguistic: 'bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/50',
    geography: 'bg-gradient-to-br from-teal-50 to-teal-100 dark:from-teal-900/20 dark:to-teal-800/50',
    attention: 'bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/50',
    language: 'bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/50',
    social: 'bg-gradient-to-br from-rose-50 to-rose-100 dark:from-rose-900/20 dark:to-rose-800/50',
    creative: 'bg-gradient-to-br from-violet-50 to-violet-100 dark:from-violet-900/20 dark:to-violet-800/50',
    spatial: 'bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/50',
  }

  return (
    <div className="space-y-8">
      {/* Scores Overview Table */}
      <ScoresOverview username={username} />
      
      <div className="space-y-4">
        {categoryLevels.map((categoryData, categoryIndex) => {
          const colors = categoryColors[categoryData.category]
          const gradient = categoryGradients[categoryData.category]
          const background = categoryBackgrounds[categoryData.category]
          
          return (
            <div
              key={categoryData.category}
              className="group relative overflow-hidden transform transition-all duration-300"
              style={{
                animation: `fadeInUp 0.6s ease-out ${categoryIndex * 0.1}s both`,
              }}
            >
              {/* Category Header Row */}
              <div className={`relative z-10 pb-1 flex items-center justify-between border-b-2 ${colors.border} border-opacity-30`}>
                <div className="flex items-center gap-3">
                  <div className="transform transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
                    <EducationBadge level={categoryData.level} categoryColor={colors.hex} size={32} />
                  </div>
                  <div className="flex items-center gap-4">
                    <h3 className={`text-lg font-black bg-gradient-to-r ${gradient} bg-clip-text text-transparent transition-all duration-300`}>
                      {categoryLabels[categoryData.category]}
                    </h3>
                    <span className={`text-sm font-semibold px-3 py-1 rounded-full bg-white/50 dark:bg-gray-800/50 ${colors.text} border border-current border-opacity-20`}>
                      {categoryData.educationLevel}
                    </span>
                  </div>
                </div>
              </div>

              {/* Games in Category */}
              <div className="divide-y divide-gray-200/50 dark:divide-gray-700/50">
                {categoryData.games.map((game, gameIndex) => {
                  const { currentLevel, educationLevel, nextLevelThreshold } = game.levelInfo
                  const categoryGames = GAMES.filter(g => g.category === categoryData.category)
                  const categoryGameStats = gameStats.filter(gs => 
                    categoryGames.some(cg => cg.id === gs.id)
                  )
                  const gameStat = categoryGameStats.find(gs => gs.id === game.gameId)
                  const userScore = gameStat?.userBest?.score ? formatUserScore(game.gameId, gameStat.userBest.score) : null
                  const scoreDetails = gameStat?.userBest?.score ? formatScoreDetails(game.gameId, gameStat.userBest.score) : []
                  
                  return (
                    <div
                      key={game.gameId}
                      className="group/game relative flex flex-col md:grid md:grid-cols-3 gap-2 md:gap-4 items-center py-2 transition-all duration-300"
                      style={{
                        animation: `fadeInUp 0.5s ease-out ${(categoryIndex * 0.1) + (gameIndex * 0.05)}s both`,
                      }}
                    >
                      {/* Decorative accent */}
                      <div className="absolute top-0 left-0 w-12 h-12 opacity-5 group-hover/game:opacity-10 transition-opacity duration-300">
                        <div className={`absolute top-2 left-2 w-2 h-2 rounded-full bg-gradient-to-r ${gradient} animate-ping`} />
                        <div className={`absolute top-2 left-2 w-2 h-2 rounded-full bg-gradient-to-r ${gradient}`} />
                      </div>

                      {/* Mobile: Two groups side-by-side */}
                      <div className="flex flex-row items-start justify-between gap-4 w-full md:hidden">
                        {/* Left Group: Game Name + Level */}
                        <div className="flex flex-col gap-2 flex-1 relative z-10 overflow-hidden">
                          <p className="text-sm font-medium text-gray-900 dark:text-white transition-transform duration-300">
                            {game.gameName}
                          </p>
                          <div className="flex items-center gap-2 relative z-10 flex-wrap">
                            <div className="transform transition-transform duration-300 group-hover/game:scale-110 group-hover/game:rotate-6">
                              <EducationBadge level={currentLevel} categoryColor={colors.hex} size={28} />
                            </div>
                            <p className={`text-xs font-semibold px-2 py-1 rounded-md bg-white/50 dark:bg-gray-800/50 ${colors.text} border border-current border-opacity-20`}>
                              {educationLevel}
                            </p>
                          </div>
                          {/* Score details on mobile */}
                          {scoreDetails.length > 0 && (
                            <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
                              {scoreDetails.map((detail, idx) => (
                                <span key={idx} className="text-xs text-gray-600 dark:text-gray-400">
                                  <span className="font-medium">{detail.label}:</span>{' '}
                                  <span className={`font-semibold ${colors.text}`}>{detail.value}</span>
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Right Group: Score Display */}
                        <div className="relative z-10 flex flex-col gap-1 items-end">
                          {userScore && (
                            <span className={`text-xs font-bold rounded-md bg-gradient-to-r ${gradient} bg-clip-text text-transparent`}>
                              {userScore}
                            </span>
                          )}
                          {nextLevelThreshold !== null && (
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Next:</span>
                              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                {formatThreshold(game.gameId, nextLevelThreshold)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Desktop: Game Name */}
                      <div className="hidden md:block md:col-span-1 relative z-10 overflow-hidden">
                        <p className="text-sm font-medium text-gray-900 dark:text-white transition-transform duration-300">
                          {game.gameName}
                        </p>
                      </div>

                      {/* Desktop: Current Level */}
                      <div className="hidden md:flex md:col-span-1 items-center gap-2 relative z-10">
                        <div className="transform transition-transform duration-300 group-hover/game:scale-110 group-hover/game:rotate-6">
                          <EducationBadge level={currentLevel} categoryColor={colors.hex} size={28} />
                        </div>
                        <p className={`text-xs font-semibold px-2 py-1 rounded-md bg-white/50 dark:bg-gray-800/50 ${colors.text} border border-current border-opacity-20`}>
                          {educationLevel}
                        </p>
                      </div>

                      {/* Desktop: Score Display with all details */}
                      <div className="hidden md:flex md:col-span-1 relative z-10 flex-col gap-1">

                        {scoreDetails.length > 0 && (
                          <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs">
                            {scoreDetails.map((detail, idx) => (
                              <span key={idx} className="text-gray-600 dark:text-gray-400">
                                <span className="font-medium">{detail.label}:</span>{' '}
                                <span className={`font-semibold ${colors.text}`}>{detail.value}</span>
                              </span>
                            ))}
                          </div>
                        )}
                        {nextLevelThreshold !== null && (
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Next:</span>
                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                              {formatThreshold(game.gameId, nextLevelThreshold)}
                            </span>
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

      {/* Game Badges Gallery */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
          Game Badges
        </h2>
        <div className="space-y-8">
          {BUILT_GAMES.map((gameId, gameIndex) => {
            const game = GAMES.find(g => g.id === gameId)
            if (!game) return null

            const gameStat = gameStats.find(gs => gs.id === gameId)
            const userScore = gameStat?.userBest?.score || null
            const earnedBadges = getEarnedBadges(gameId, userScore)
            const allBadges = GAME_BADGES[gameId] || []

            return (
              <div
                key={gameId}
                className="group/game-badges relative"
                style={{
                  animation: `fadeInUp 0.6s ease-out ${gameIndex * 0.1}s both`,
                }}
              >
                {/* Game Header */}
                <div className="flex items-center gap-3 mb-4">
                  <game.icon 
                    size={24} 
                    className="text-gray-700 dark:text-gray-300"
                  />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {game.name}
                  </h3>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {earnedBadges.length} / {allBadges.length} badges earned
                  </span>
                </div>

                {/* Badges Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {allBadges.map((badge, badgeIndex) => {
                    const earned = earnedBadges.some(eb => eb.id === badge.id)
                    return (
                      <GameBadge
                        key={badge.id}
                        tier={badge.tier}
                        name={badge.name}
                        description={badge.description}
                        earned={earned}
                        size="md"
                        gameName={game.name}
                      />
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

