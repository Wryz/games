'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { TimeEstimationIcon } from '../icons/GameIcons'
import { getTimeEstimationScores, submitTimeEstimationScore } from '@/lib/scores'
import { useUser } from '@/contexts/UserContext'
import { supabase } from '@/lib/supabase'
import GameWrapper from '../GameWrapper'
import type { TimeEstimationScore } from '@/lib/supabase'
import { formatNumber } from '@/lib/levels'

type GameState = 'waiting' | 'showing-target' | 'countdown' | 'counting' | 'result' | 'failed' | 'finished'

export default function TimeEstimation() {
  const [scores, setScores] = useState<TimeEstimationScore[]>([])
  const [loading, setLoading] = useState(true)
  const [gameState, setGameState] = useState<GameState>('waiting')
  const [targetTime, setTargetTime] = useState<number>(0) // in milliseconds
  const [countdown, setCountdown] = useState<number>(3)
  const [accuracies, setAccuracies] = useState<number[]>([]) // errors in milliseconds
  const [currentAttempt, setCurrentAttempt] = useState(0)
  const [instruction, setInstruction] = useState('Click anywhere to start')
  const [resultMessage, setResultMessage] = useState('')
  const { username } = useUser()
  const startTimeRef = useRef<number>(0)
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const countUpStartRef = useRef<number>(0)
  const failTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const hasSubmittedScore = useRef(false)

  const TOTAL_ATTEMPTS = 3
  const FAIL_THRESHOLD = 5000 // 5 seconds in milliseconds

  const loadScores = async () => {
    try {
      setLoading(true)
      const data = await getTimeEstimationScores({ limit: 50 })
      setScores(data)
    } catch (error) {
      console.error('Error loading scores:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadScores()
    
    // Set up realtime listener for time estimation scores
    const channel = supabase
      .channel('time_estimation_scores_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'time_estimation_scores'
        },
        (payload) => {
          console.log('New time estimation score:', payload.new)
          setScores(prev => [payload.new as TimeEstimationScore, ...prev.slice(0, 49)])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current)
      if (failTimeoutRef.current) clearTimeout(failTimeoutRef.current)
    }
  }, [])

  // Start a new round
  const startRound = useCallback(() => {
    if (currentAttempt >= TOTAL_ATTEMPTS) return
    
    // Generate random target time between 3-10 seconds (3000-10000ms)
    const randomTime = Math.floor(Math.random() * 7000) + 3000
    setTargetTime(randomTime)
    setGameState('showing-target')
    setInstruction(`${randomTime / 1000} seconds`)
    setCountdown(3)
    
    // Show target time for 2 seconds
    setTimeout(() => {
      setGameState('countdown')
      setInstruction('Get ready...')
      
      // Start countdown
      let count = 3
      setCountdown(count)
      
      countdownIntervalRef.current = setInterval(() => {
        count--
        setCountdown(count)
        if (count <= 0) {
          if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current)
          // Start counting up (but don't show it)
          setGameState('counting')
          setInstruction('Click when you think the time is up!')
          countUpStartRef.current = Date.now()
          
          // Auto-fail if user doesn't click within 5 seconds after target time
          failTimeoutRef.current = setTimeout(() => {
            handleFail()
          }, randomTime + FAIL_THRESHOLD)
        }
      }, 1000)
    }, 2000)
  }, [currentAttempt])

  // Handle fail (off by more than 5 seconds)
  const handleFail = useCallback(() => {
    if (failTimeoutRef.current) clearTimeout(failTimeoutRef.current)
    setGameState('failed')
    setInstruction('Too far off!')
    setResultMessage('You were off by more than 5 seconds')
    
    // Auto-continue to next attempt or finish
    setTimeout(() => {
      if (currentAttempt >= TOTAL_ATTEMPTS) {
        setGameState('finished')
        setInstruction('Test complete!')
      } else {
        const nextAttempt = currentAttempt + 1
        setCurrentAttempt(nextAttempt)
        setGameState('waiting')
        setInstruction('Click to continue')
        
        // Auto-start next round
        setTimeout(() => {
          startRound()
        }, 1000)
      }
    }, 2000)
  }, [currentAttempt, startRound])

  // Handle click
  const handleClick = useCallback(() => {
    if (gameState === 'waiting' && currentAttempt === 0) {
      // First click - start the game
      setCurrentAttempt(1)
      startRound()
    } else if (gameState === 'waiting' && currentAttempt > 0) {
      // Already started, just continue to next round
      startRound()
    } else if (gameState === 'showing-target' || gameState === 'countdown') {
      // Clicked too early - ignore or show message
      return
    } else if (gameState === 'counting') {
      // Clicked at the right time
      if (failTimeoutRef.current) clearTimeout(failTimeoutRef.current)
      
      const elapsed = Date.now() - countUpStartRef.current
      const error = Math.abs(elapsed - targetTime)
      
      // Check if off by more than 5 seconds (too early or too late)
      if (error > FAIL_THRESHOLD) {
        handleFail()
        return
      }
      
      const newAccuracies = [...accuracies, error]
      setAccuracies(newAccuracies)
      
      setGameState('result')
      setInstruction(`${error}ms off`)
      setResultMessage(`Target: ${targetTime}ms, Your time: ${elapsed}ms`)
      
      if (currentAttempt >= TOTAL_ATTEMPTS) {
        // Game finished
        setTimeout(() => {
          setGameState('finished')
          setInstruction('Test complete!')
        }, 2000)
      } else {
        // Next attempt
        const nextAttempt = currentAttempt + 1
        setCurrentAttempt(nextAttempt)
        
        // Auto-continue after showing result
        setTimeout(() => {
          setGameState('waiting')
          setInstruction('Click to continue')
          
          setTimeout(() => {
            startRound()
          }, 500)
        }, 2000)
      }
    }
  }, [gameState, currentAttempt, accuracies, targetTime, handleFail, startRound])

  // Submit score when game finishes
  useEffect(() => {
    if (gameState === 'finished' && accuracies.length > 0 && username && !hasSubmittedScore.current) {
      hasSubmittedScore.current = true
      
      const averageAccuracy = Math.round(
        accuracies.reduce((sum, acc) => sum + acc, 0) / accuracies.length
      )
      const bestAccuracy = Math.min(...accuracies)
      
      submitTimeEstimationScore({
        username,
        average_accuracy: averageAccuracy,
        best_accuracy: bestAccuracy
      }).then(() => {
        // Reload scores after submission
        setTimeout(() => loadScores(), 1000)
      }).catch(error => {
        console.error('Error submitting score:', error)
        hasSubmittedScore.current = false
      })
    }
  }, [gameState, accuracies, username])

  // Reset game
  const resetGame = useCallback(() => {
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current)
    if (failTimeoutRef.current) clearTimeout(failTimeoutRef.current)
    setGameState('waiting')
    setAccuracies([])
    setCurrentAttempt(0)
    setInstruction('Click anywhere to start')
    setResultMessage('')
    hasSubmittedScore.current = false
  }, [])

  const formatScore = (score: TimeEstimationScore) => {
    return `${formatNumber(score.average_accuracy)}ms avg (${formatNumber(score.best_accuracy)}ms best)`
  }

  // Calculate current stats
  const averageAccuracy = accuracies.length > 0 
    ? Math.round(accuracies.reduce((sum, acc) => sum + acc, 0) / accuracies.length)
    : 0
  const bestAccuracy = accuracies.length > 0 ? Math.min(...accuracies) : 0

  // Get background color based on state
  const getBackgroundColor = () => {
    if (gameState === 'counting') return 'bg-green-500'
    if (gameState === 'countdown') return 'bg-yellow-500'
    if (gameState === 'result') return 'bg-blue-600'
    if (gameState === 'failed') return 'bg-red-500'
    if (gameState === 'finished') return 'bg-gray-900 dark:bg-gray-800'
    return 'bg-gray-900 dark:bg-gray-800'
  }

  return (
    <GameWrapper
      gameType="Time Estimation"
      scores={scores}
      loading={loading}
      onRefresh={loadScores}
      fetchScores={getTimeEstimationScores}
      scoreTable="time_estimation_scores"
      formatScore={formatScore}
      sortKey="average_accuracy"
      sortDirection="asc"
    >
      <div className="w-full">
        {/* Status row */}
        <div className="mb-4 flex items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 sm:gap-x-6">
            <div className="flex items-baseline gap-2">
              <span className="eyebrow">Attempt</span>
              <span className="num text-sm font-medium text-gray-900 dark:text-gray-100">
                {Math.min(currentAttempt, TOTAL_ATTEMPTS)}/{TOTAL_ATTEMPTS}
              </span>
            </div>
            {accuracies.length > 0 && (
              <>
                <span className="text-gray-300 dark:text-gray-700" aria-hidden="true">·</span>
                <div className="flex items-baseline gap-2">
                  <span className="eyebrow">Avg</span>
                  <span className="num text-sm font-medium text-gray-900 dark:text-gray-100">{averageAccuracy} ms</span>
                </div>
                <span className="text-gray-300 dark:text-gray-700" aria-hidden="true">·</span>
                <div className="flex items-baseline gap-2">
                  <span className="eyebrow">Best</span>
                  <span className="num text-sm font-medium text-gray-900 dark:text-gray-100">{bestAccuracy} ms</span>
                </div>
              </>
            )}
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

        {/* Stage (full-colour surface: yellow = countdown, green = counting, red = failed) */}
        <div
          onClick={handleClick}
          className={`
            ${getBackgroundColor()}
            flex min-h-[420px] cursor-pointer select-none flex-col items-center justify-center rounded-2xl
            transition-colors sm:min-h-[480px]
          `}
        >
          <div className={`p-8 text-center text-white ${gameState === 'finished' ? '' : 'pointer-events-none'}`}>
            {gameState !== 'finished' && (
              <h2
                className={`text-4xl font-bold tracking-tight sm:text-5xl ${
                  gameState === 'showing-target' || gameState === 'result' ? 'num' : ''
                }`}
              >
                {instruction}
              </h2>
            )}
            {gameState === 'countdown' && (
              <div className="num mt-8 text-8xl font-bold sm:text-9xl">
                {countdown}
              </div>
            )}
            {gameState === 'result' && (
              <div className="mt-4">
                <p className="num text-base text-white/80 sm:text-lg">{resultMessage}</p>
              </div>
            )}
            {gameState === 'failed' && (
              <div className="mt-4">
                <p className="text-lg text-white/80">{resultMessage}</p>
              </div>
            )}
            {gameState === 'waiting' && currentAttempt === 0 && (
              <p className="mt-4 text-lg text-white/80">
                Estimate the time interval accurately
              </p>
            )}
            {gameState === 'finished' && (
              <div className="pointer-events-auto flex w-full max-w-md flex-col items-center">
                <span className="eyebrow !text-white/70">Result</span>
                <div className="num mt-3 text-6xl font-bold tracking-tight sm:text-7xl">
                  {averageAccuracy}
                  <span className="ml-1 text-2xl font-medium text-white/70 sm:text-3xl">ms</span>
                </div>
                <div className="mt-1 text-sm text-white/70">average error</div>
                <div className="mt-8 grid w-full grid-cols-2 gap-3">
                  <div className="rounded-xl bg-white/10 p-4 text-left">
                    <div className="eyebrow !text-white/70">Best</div>
                    <div className="num mt-2 text-lg font-semibold">{bestAccuracy} ms</div>
                  </div>
                  <div className="rounded-xl bg-white/10 p-4 text-left">
                    <div className="eyebrow !text-white/70">Scored rounds</div>
                    <div className="num mt-2 text-lg font-semibold">{accuracies.length}/{TOTAL_ATTEMPTS}</div>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    resetGame()
                  }}
                  className="btn mt-8 bg-white text-gray-950 hover:bg-gray-100"
                >
                  Try again
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Results history */}
        {accuracies.length > 0 && gameState !== 'finished' && (
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <span className="eyebrow mr-1">Previous</span>
            {accuracies.map((acc, idx) => (
              <span key={idx} className="chip num">
                {acc} ms
              </span>
            ))}
          </div>
        )}
      </div>
    </GameWrapper>
  )
}
