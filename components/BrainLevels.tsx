'use client'

import { useMemo, useEffect } from 'react'
import { GAMES } from '@/types/games'
import { 
  calculateGameLevel, 
  formatThreshold,
  formatUserScore,
  EDUCATION_LEVELS,
  type CategoryLevelInfo,
  type GameCategory
} from '@/lib/levels'
import { useOverview } from '@/contexts/OverviewContext'
import EducationBadge from './EducationBadge'

interface BrainLevelsProps {
  username?: string
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
    const categories: GameCategory[] = ['motor', 'memory', 'perception', 'cognitive']
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
    }
  }

  const categoryLabels = {
    motor: 'Motor Skills',
    memory: 'Memory',
    perception: 'Perception',
    cognitive: 'Cognitive'
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
  }

  const categoryBackgrounds = {
    motor: 'bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/50',
    memory: 'bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/50',
    perception: 'bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-900/20 dark:to-pink-800/50',
    cognitive: 'bg-gradient-to-br from-cyan-50 to-cyan-100 dark:from-cyan-900/20 dark:to-cyan-800/50',
  }

  return (
    <div className="space-y-8">
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
                  const isMaxLevel = currentLevel >= 20
                  const categoryGames = GAMES.filter(g => g.category === categoryData.category)
                  const categoryGameStats = gameStats.filter(gs => 
                    categoryGames.some(cg => cg.id === gs.id)
                  )
                  const gameStat = categoryGameStats.find(gs => gs.id === game.gameId)
                  const userScore = gameStat?.userBest?.score ? formatUserScore(game.gameId, gameStat.userBest.score) : null
                  
                  return (
                    <div
                      key={game.gameId}
                      className="group/game relative grid grid-cols-1 md:grid-cols-3 gap-4 items-center py-1 transition-all duration-300"
                      style={{
                        animation: `fadeInUp 0.5s ease-out ${(categoryIndex * 0.1) + (gameIndex * 0.05)}s both`,
                      }}
                    >
                      {/* Decorative accent */}
                      <div className="absolute top-0 left-0 w-12 h-12 opacity-5 group-hover/game:opacity-10 transition-opacity duration-300">
                        <div className={`absolute top-2 left-2 w-2 h-2 rounded-full bg-gradient-to-r ${gradient} animate-ping`} />
                        <div className={`absolute top-2 left-2 w-2 h-2 rounded-full bg-gradient-to-r ${gradient}`} />
                      </div>

                      {/* Game Name */}
                      <div className="md:col-span-1 relative z-10 overflow-hidden">
                        <p className="text-sm font-medium text-gray-900 dark:text-white transition-transform duration-300">
                          {game.gameName}
                        </p>
                      </div>

                      {/* Current Level */}
                      <div className="md:col-span-1 flex items-center gap-2 relative z-10">
                        <div className="transform transition-transform duration-300 group-hover/game:scale-110 group-hover/game:rotate-6">
                          <EducationBadge level={currentLevel} categoryColor={colors.hex} size={28} />
                        </div>
                        <p className={`text-xs font-semibold px-2 py-1 rounded-md bg-white/50 dark:bg-gray-800/50 ${colors.text} border border-current border-opacity-20`}>
                          {educationLevel}
                        </p>
                      </div>

                      {/* Score Display */}
                      <div className="md:col-span-1 relative z-10 flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Score:</span>
                          {userScore ? (
                            <span className={`text-xs font-bold rounded-md bg-gradient-to-r ${gradient} bg-clip-text text-transparent border border-current border-opacity-20`}>
                              {userScore}
                            </span>
                          ) : (
                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">N/A</span>
                          )}
                        </div>
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
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* Badge Gallery */}
      <div className="mt-12">
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-8 xl:grid-cols-8 gap-3 md:gap-4">
          {Array.from({ length: 20 }, (_, i) => i + 1).map((level, index) => {
            const isAchieved = achievedLevels.has(level)
            const isHighlighted = level <= highestLevel // Highlight all badges up to highest level achieved
            const educationLevel = EDUCATION_LEVELS[level] || 'Unknown'
            
            // Use category colors for highlighted badges, gray for unhighlighted
            const categoryIndex = (level - 1) % 4
            const categoryKeys: GameCategory[] = ['motor', 'memory', 'perception', 'cognitive']
            const categoryKey = categoryKeys[categoryIndex]
            const gradient = categoryGradients[categoryKey]
            const badgeColor = isHighlighted
              ? categoryColors[categoryKey].hex
              : '#9ca3af' // Gray for unhighlighted
            
            return (
              <div
                key={level}
                className={`group/badge relative flex flex-col items-center justify-between p-3 md:p-4 rounded-xl transition-all duration-300 transform aspect-square min-w-[80px] max-w-[200px] w-full ${
                  isHighlighted
                    ? `bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 border-2 border-gray-300 dark:border-gray-600 shadow-md hover:scale-110 hover:shadow-xl hover:z-10`
                    : 'bg-gray-50 dark:bg-gray-800/30 border-2 border-gray-200 dark:border-gray-700 opacity-40'
                }`}
                style={{
                  animation: `fadeInUp 0.5s ease-out ${index * 0.03}s both`,
                }}
              >
                {/* Animated glow on hover for highlighted badges */}
                {isHighlighted && (
                  <div className={`absolute inset-0 rounded-xl bg-gradient-to-r ${gradient} opacity-0 group-hover/badge:opacity-20 transition-opacity duration-300 -z-10 blur-md`} />
                )}
                
                {/* Pulsing indicator for achieved badges */}
                {isAchieved && (
                  <>
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full animate-ping shadow-lg" />
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full shadow-lg" />
                  </>
                )}
                
                <div className={`relative z-10 w-full flex items-center justify-center transform transition-all duration-300 ${
                  isHighlighted 
                    ? 'scale-100 group-hover/badge:scale-110 group-hover/badge:rotate-6' 
                    : 'scale-75 opacity-50'
                }`}>
                  <EducationBadge level={level} categoryColor={badgeColor} size={56} />
                </div>
                
                <div className="text-center relative z-10 w-full">
                  <p className={`text-xs font-semibold ${isHighlighted ? categoryColors[categoryKey].text : 'text-gray-400 dark:text-gray-500'}`}>
                    {educationLevel}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

