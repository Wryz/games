'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { AimTrainerIcon } from '../icons/GameIcons'
import { getAimTrainerScores, submitAimTrainerScore } from '@/lib/scores'
import { useUser } from '@/contexts/UserContext'
import { supabase } from '@/lib/supabase'
import GameWrapper from '../GameWrapper'
import type { AimTrainerScore } from '@/lib/supabase'
import { formatNumber } from '@/lib/levels'

type GameState = 'idle' | 'playing' | 'finished'

interface Target {
  id: number
  row: number
  col: number
  isActive: boolean
  clickTime?: number
}

const GRID_SIZE = 8

function buildGrid(): Target[] {
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
}

export default function AimTrainer() {
  const [scores, setScores] = useState<AimTrainerScore[]>([])
  const [loading, setLoading] = useState(true)
  const [gameState, setGameState] = useState<GameState>('idle')
  const [targets, setTargets] = useState<Target[]>(buildGrid)
  const [currentTarget, setCurrentTarget] = useState<Target | null>(null)
  const [gameStats, setGameStats] = useState({
    targetsHit: 0,
    totalTargets: 0,
    totalClicks: 0, // Track all clicks (accurate + inaccurate)
    reactionTimes: [] as number[],
    startTime: 0,
    gameStartTime: 0
  })
  const [wrongClickTarget, setWrongClickTarget] = useState<number | null>(null)
  const [elapsedTime, setElapsedTime] = useState(0)
  const { username } = useUser()
  const hasSubmittedScore = useRef(false)
  const gameStartTimeRef = useRef(0)
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const TOTAL_TARGETS = 30

  // State is only set in promise callbacks, so this is safe to call from an effect
  const fetchScores = useCallback(() => {
    return getAimTrainerScores({ limit: 50 })
      .then(data => {
        setScores(data)
      })
      .catch(error => {
        console.error('Error loading scores:', error)
      })
      .finally(() => setLoading(false))
  }, [])

  const loadScores = useCallback(() => {
    setLoading(true)
    return fetchScores()
  }, [fetchScores])

  const clearTimer = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current)
      timerIntervalRef.current = null
    }
  }, [])

  const startTimer = useCallback(() => {
    clearTimer()
    const now = Date.now()
    gameStartTimeRef.current = now
    setElapsedTime(0)
    timerIntervalRef.current = setInterval(() => {
      setElapsedTime(Date.now() - gameStartTimeRef.current)
    }, 1000)
  }, [clearTimer])

  useEffect(() => {
    fetchScores()
    
    // Set up realtime listener for aim trainer scores
    const channel = supabase
      .channel('aim_trainer_scores_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'aim_trainer_scores'
        },
        (payload) => {
          console.log('New aim trainer score:', payload.new)
          // Add new score to the list
          setScores(prev => [payload.new as AimTrainerScore, ...prev.slice(0, 49)]) // Keep only top 50
        }
      )
      .subscribe()

    // Cleanup subscription on unmount
    return () => {
      clearTimer()
      supabase.removeChannel(channel)
    }
  }, [clearTimer, fetchScores])

  // Initialize grid
  // Get random target position
  const getRandomTarget = useCallback((currentTargets: Target[], excludeId?: number): Target => {
    const availableTargets = currentTargets.filter(t => t.id !== excludeId)
    const randomIndex = Math.floor(Math.random() * availableTargets.length)
    return availableTargets[randomIndex]
  }, [])

  // Start new target
  const spawnTarget = useCallback(() => {
    if (gameStats.totalTargets >= TOTAL_TARGETS) {
      const finalTime = gameStartTimeRef.current > 0
        ? Date.now() - gameStartTimeRef.current
        : 0
      clearTimer()
      setElapsedTime(finalTime)
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
  }, [currentTarget?.id, gameStats.totalTargets, getRandomTarget, clearTimer])

  // Handle target click
  const handleTargetClick = useCallback((targetId: number) => {
    // If game hasn't started yet, start it on first red tile click
    if (gameState === 'idle' && currentTarget && targetId === currentTarget.id) {
      setGameState('playing')
      startTimer()
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
      setWrongClickTarget(null)
      
      // Spawn next target immediately (no delay)
      setTimeout(() => spawnTarget(), 10)
    } else {
      // Wrong target clicked - show feedback
      setWrongClickTarget(targetId)
      
      // Clear feedback after a brief moment
      setTimeout(() => {
        setWrongClickTarget(null)
      }, 500)
    }
  }, [gameState, currentTarget, gameStats.startTime, spawnTarget, startTimer])

  // Show the first target just after the grid renders
  const scheduleFirstTarget = useCallback((initialGrid: Target[]) => {
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
  }, [])

  // Initialize game (show grid with first target)
  const initializeGame = useCallback(() => {
    clearTimer()
    setElapsedTime(0)
    setGameState('idle')
    const initialGrid = buildGrid()
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
    scheduleFirstTarget(initialGrid)
  }, [clearTimer, scheduleFirstTarget])

  // The grid is initial state; on mount only the first target needs scheduling
  useEffect(() => {
    scheduleFirstTarget(buildGrid())
  }, [scheduleFirstTarget])

  // Submit score
  const submitScore = useCallback(async () => {
    if (!username || gameStats.reactionTimes.length === 0 || hasSubmittedScore.current) return

    hasSubmittedScore.current = true
    
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
      // Reload scores after submission to ensure leaderboard updates
      setTimeout(() => loadScores(), 1000)
    } catch (error) {
      console.error('Error submitting score:', error)
      hasSubmittedScore.current = false // Reset on error to allow retry
    }
  }, [username, gameStats.reactionTimes, gameStats.totalClicks, gameStats.targetsHit, gameStats.totalTargets, loadScores])

  // Reset game
  const resetGame = useCallback(() => {
    hasSubmittedScore.current = false // Reset submission flag
    setWrongClickTarget(null)
    initializeGame()
  }, [initializeGame])

  // Submit score when game finishes
  useEffect(() => {
    if (gameState === 'finished' && !hasSubmittedScore.current) {
      submitScore()
    }
  }, [gameState, submitScore])

  const formatScore = (score: AimTrainerScore) => {
    return `${formatNumber(score.accuracy)}% (${formatNumber(score.reaction_time)}ms)`
  }

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000)
    return `${seconds}s`
  }

  const formatExactTime = (ms: number) => {
    return `${(ms / 1000).toFixed(3)}s`
  }

  // Custom sort function for aim trainer: prioritize accuracy, then reaction time
  const customSort = (a: AimTrainerScore, b: AimTrainerScore) => {
    // First, sort by accuracy (descending - higher is better)
    if (a.accuracy !== b.accuracy) {
      return b.accuracy - a.accuracy
    }
    // If accuracy is the same, sort by reaction time (ascending - lower is better)
    return a.reaction_time - b.reaction_time
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
      fetchScores={getAimTrainerScores}
      scoreTable="aim_trainer_scores"
      formatScore={formatScore}
      sortKey="accuracy"
      sortDirection="desc"
      customSort={customSort}
    >
      <div className="w-full">
        {gameState === 'finished' ? (
          <div className="flex min-h-[420px] flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white p-6 text-center dark:border-gray-800 dark:bg-gray-900 sm:min-h-[480px]">
            <div className="flex w-full max-w-2xl flex-col items-center">
              <span className="eyebrow">Result</span>
              <div className="num mt-3 text-6xl font-bold tracking-tight text-gray-950 dark:text-white sm:text-7xl">
                {accuracy.toFixed(1)}%
              </div>
              <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">accuracy</div>
              <div className="mt-8 grid w-full grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="card p-4 text-left">
                  <div className="eyebrow">Avg reaction</div>
                  <div className="num mt-2 text-lg font-semibold text-gray-950 dark:text-gray-50">{avgReactionTime} ms</div>
                </div>
                <div className="card p-4 text-left">
                  <div className="eyebrow">Time</div>
                  <div className="num mt-2 text-lg font-semibold text-gray-950 dark:text-gray-50">{formatExactTime(elapsedTime)}</div>
                </div>
                <div className="card p-4 text-left">
                  <div className="eyebrow">Targets hit</div>
                  <div className="num mt-2 text-lg font-semibold text-gray-950 dark:text-gray-50">
                    {gameStats.targetsHit}/{gameStats.totalTargets}
                  </div>
                </div>
                <div className="card p-4 text-left">
                  <div className="eyebrow">Total clicks</div>
                  <div className="num mt-2 text-lg font-semibold text-gray-950 dark:text-gray-50">{gameStats.totalClicks}</div>
                </div>
              </div>
              <button onClick={resetGame} className="btn-ink mt-8">
                Play again
              </button>
            </div>
          </div>
        ) : (
          <div className="w-full">
            {/* Status row */}
            <div className="mb-4 flex items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 sm:gap-x-6">
                <div className="flex items-baseline gap-2">
                  <span className="eyebrow">Hits</span>
                  <span className="num text-sm font-medium text-gray-900 dark:text-gray-100">
                    {gameStats.targetsHit}/{TOTAL_TARGETS}
                  </span>
                </div>
                <span className="text-gray-300 dark:text-gray-700" aria-hidden="true">·</span>
                <div className="flex items-baseline gap-2">
                  <span className="eyebrow">Time</span>
                  <span className="num text-sm font-medium text-gray-900 dark:text-gray-100">{formatTime(elapsedTime)}</span>
                </div>
                <span className="text-gray-300 dark:text-gray-700" aria-hidden="true">·</span>
                <div className="flex items-baseline gap-2">
                  <span className="eyebrow">Accuracy</span>
                  <span className="num text-sm font-medium text-gray-900 dark:text-gray-100">{accuracy.toFixed(1)}%</span>
                </div>
              </div>
              <button
                onClick={resetGame}
                className="rounded-full p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100"
                title="Reset"
                aria-label="Reset"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                </svg>
              </button>
            </div>

            {/* Stage */}
            <div className="rounded-2xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900 sm:p-5">
              <div className="mx-auto grid aspect-square w-full max-w-2xl grid-cols-8 gap-1.5 sm:gap-2">
                {targets.map((target) => {
                  const isWrongClick = wrongClickTarget === target.id

                  return (
                  <button
                    key={target.id}
                    onClick={() => handleTargetClick(target.id)}
                    className={`
                      aspect-square rounded-lg transition-all duration-150
                      ${target.isActive
                        ? 'bg-red-500 hover:bg-red-600 scale-110 shadow-md'
                          : isWrongClick
                          ? 'bg-red-300 dark:bg-red-700 ring-4 ring-red-500 animate-shake'
                        : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }
                    `}
                  />
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </GameWrapper>
  )
}
