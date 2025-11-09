'use client'

import { useState, useEffect, useCallback } from 'react'
import { AimTrainerIcon } from '../icons/GameIcons'
import { getAimTrainerScores, submitAimTrainerScore } from '@/lib/scores'
import { useUser } from '@/contexts/UserContext'
import GameWrapper from '../GameWrapper'
import type { AimTrainerScore } from '@/lib/supabase'

type GameState = 'idle' | 'playing' | 'finished'

interface Target {
  id: number
  row: number
  col: number
  isActive: boolean
  clickTime?: number
}

export default function AimTrainer() {
  const [scores, setScores] = useState<AimTrainerScore[]>([])
  const [loading, setLoading] = useState(true)
  const [gameState, setGameState] = useState<GameState>('idle')
  const [targets, setTargets] = useState<Target[]>([])
  const [currentTarget, setCurrentTarget] = useState<Target | null>(null)
  const [gameStats, setGameStats] = useState({
    targetsHit: 0,
    totalTargets: 0,
    totalClicks: 0, // Track all clicks (accurate + inaccurate)
    reactionTimes: [] as number[],
    startTime: 0,
    gameStartTime: 0
  })
  const { username } = useUser()

  const GRID_SIZE = 8
  const TOTAL_TARGETS = 30

  const loadScores = async () => {
    try {
      setLoading(true)
      const data = await getAimTrainerScores({ limit: 50 })
      setScores(data)
    } catch (error) {
      console.error('Error loading scores:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadScores()
  }, [])

  // Initialize grid
  const initializeGrid = useCallback(() => {
    const grid: Target[] = []
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        grid.push({
          id: row * GRID_SIZE + col,
          row,
          col,
          isActive: false
        })
      }
    }
    return grid
  }, [])

  // Get random target position
  const getRandomTarget = useCallback((currentTargets: Target[], excludeId?: number): Target => {
    const availableTargets = currentTargets.filter(t => t.id !== excludeId)
    const randomIndex = Math.floor(Math.random() * availableTargets.length)
    return availableTargets[randomIndex]
  }, [])

  // Start new target
  const spawnTarget = useCallback(() => {
    if (gameStats.totalTargets >= TOTAL_TARGETS) {
      setGameState('finished')
      return
    }

    setTargets(prev => {
      if (prev.length === 0) {
        return prev
      }
      const newTarget = getRandomTarget(prev, currentTarget?.id)
      setCurrentTarget(newTarget)
      return prev.map(t => ({
        ...t,
        isActive: t.id === newTarget.id
      }))
    })
    
    setGameStats(prev => ({
      ...prev,
      totalTargets: prev.totalTargets + 1,
      startTime: Date.now()
    }))
  }, [currentTarget?.id, gameStats.totalTargets, getRandomTarget])

  // Handle target click
  const handleTargetClick = useCallback((targetId: number) => {
    // If game hasn't started yet, start it on first red tile click
    if (gameState === 'idle' && currentTarget && targetId === currentTarget.id) {
      setGameState('playing')
      setGameStats(prev => ({
        ...prev,
        gameStartTime: Date.now(),
        startTime: Date.now()
      }))
    }
    
    // If game is not playing, ignore clicks
    if (gameState !== 'playing' && gameState !== 'idle') {
      return
    }

    // Track all clicks
    setGameStats(prev => ({
      ...prev,
      totalClicks: prev.totalClicks + 1
    }))

    // Check if it's the correct target
    if (currentTarget && targetId === currentTarget.id) {
      const reactionTime = Date.now() - gameStats.startTime
      
      setGameStats(prev => ({
        ...prev,
        targetsHit: prev.targetsHit + 1,
        reactionTimes: [...prev.reactionTimes, reactionTime]
      }))

      // Clear current target
      setTargets(prev => prev.map(t => ({ ...t, isActive: false })))
      setCurrentTarget(null)
      
      // Spawn next target immediately (no delay)
      setTimeout(() => spawnTarget(), 10)
    }
    // If wrong target clicked, do nothing (just counted the click above)
  }, [gameState, currentTarget, gameStats.startTime, spawnTarget])

  // Initialize game (show grid with first target)
  const initializeGame = useCallback(() => {
    setGameState('idle')
    const initialGrid = initializeGrid()
    setTargets(initialGrid)
    setGameStats({
      targetsHit: 0,
      totalTargets: 0,
      totalClicks: 0,
      reactionTimes: [],
      startTime: 0,
      gameStartTime: 0
    })
    setCurrentTarget(null)
    
    // Show first target immediately after grid is set
    setTimeout(() => {
      if (initialGrid.length > 0) {
        const firstTarget = initialGrid[Math.floor(Math.random() * initialGrid.length)]
        setCurrentTarget(firstTarget)
        setTargets(prev => prev.map(t => ({
          ...t,
          isActive: t.id === firstTarget.id
        })))
        setGameStats(prev => ({
          ...prev,
          totalTargets: 1,
          startTime: Date.now()
        }))
      }
    }, 10)
  }, [initializeGrid])

  // Initialize game when component mounts
  useEffect(() => {
    initializeGame()
  }, [initializeGame])

  // Submit score
  const submitScore = useCallback(async () => {
    if (!username || gameStats.reactionTimes.length === 0) return

    const accuracy = gameStats.totalClicks > 0 ? (gameStats.targetsHit / gameStats.totalClicks) * 100 : 0
    const avgReactionTime = Math.round(
      gameStats.reactionTimes.reduce((sum, time) => sum + time, 0) / gameStats.reactionTimes.length
    )

    try {
      await submitAimTrainerScore({
        username,
        accuracy: Number(accuracy.toFixed(2)),
        reaction_time: avgReactionTime,
        targets_hit: gameStats.targetsHit,
        total_targets: gameStats.totalTargets
      })
      await loadScores()
    } catch (error) {
      console.error('Error submitting score:', error)
    }
  }, [username, gameStats, loadScores])

  // Reset game
  const resetGame = useCallback(() => {
    initializeGame()
  }, [initializeGame])

  // Submit score when game finishes
  useEffect(() => {
    if (gameState === 'finished') {
      submitScore()
    }
  }, [gameState, submitScore])

  const formatScore = (score: AimTrainerScore) => {
    return `${score.accuracy}% (${score.reaction_time}ms)`
  }

  const accuracy = gameStats.totalClicks > 0 ? (gameStats.targetsHit / gameStats.totalClicks) * 100 : 0
  const avgReactionTime = gameStats.reactionTimes.length > 0 
    ? Math.round(gameStats.reactionTimes.reduce((sum, time) => sum + time, 0) / gameStats.reactionTimes.length)
    : 0

  return (
    <GameWrapper
      gameType="Aim Trainer"
      scores={scores}
      loading={loading}
      onRefresh={loadScores}
      formatScore={formatScore}
      sortKey="accuracy"
      sortDirection="desc"
    >
      <div className="flex flex-col items-center justify-center min-h-[400px] sm:min-h-[600px] bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
        {gameState === 'finished' ? (
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">
              Game Complete!
            </h2>
            <div className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow-sm mb-6">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {accuracy.toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Accuracy</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {avgReactionTime}ms
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Avg Reaction</div>
                </div>
              </div>
              <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                Targets Hit: {gameStats.targetsHit}/{gameStats.totalTargets}
              </div>
              <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Total Clicks: {gameStats.totalClicks}
              </div>
            </div>
            <button
              onClick={resetGame}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              Play Again
            </button>
          </div>
        ) : (
          <div className="w-full max-w-md">
            {/* Instructions */}
            <div className="text-center mb-4">
              <h2 className="text-xl font-bold mb-2 text-gray-900 dark:text-gray-100">
                Aim Trainer
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                {gameState === 'idle' 
                  ? 'Click the red square to start!' 
                  : `Click red squares only! ${gameStats.targetsHit}/${TOTAL_TARGETS} targets`
                }
              </p>
            </div>

            {/* Stats */}
            {gameState === 'playing' && (
              <div className="flex justify-between mb-4 text-sm text-gray-600 dark:text-gray-400">
                <span>Hits: {gameStats.targetsHit}/{gameStats.totalTargets}</span>
                <span>Accuracy: {accuracy.toFixed(1)}%</span>
              </div>
            )}

            {/* Game Grid */}
            <div className="grid grid-cols-8 gap-1 bg-gray-200 dark:bg-gray-700 p-2 rounded-lg aspect-square">
              {targets.map((target) => (
                <button
                  key={target.id}
                  onClick={() => handleTargetClick(target.id)}
                  className={`
                    aspect-square rounded transition-all duration-150
                    ${target.isActive 
                      ? 'bg-red-500 hover:bg-red-600 scale-110 shadow-lg' 
                      : 'bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500'
                    }
                  `}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </GameWrapper>
  )
}
