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
    if (gameState === 'result') return 'bg-blue-500'
    if (gameState === 'failed') return 'bg-red-500'
    if (gameState === 'finished') return 'bg-purple-500'
    return 'bg-gray-500'
  }

  return (
    <GameWrapper
      gameType="Time Estimation"
      scores={scores}
      loading={loading}
      onRefresh={loadScores}
      formatScore={formatScore}
      sortKey="best_accuracy"
      sortDirection="asc"
    >
      <div className="flex flex-col items-center justify-start min-h-[400px] sm:min-h-[600px] pt-8">
        <div className="w-full">
          {/* Stats and Reset */}
          <div className="flex justify-between items-center mb-6 text-sm sm:text-base">
            <div className="text-gray-600 dark:text-gray-400">
              Attempt: <span className="font-bold text-blue-600 dark:text-blue-400">{Math.min(currentAttempt, TOTAL_ATTEMPTS)}/{TOTAL_ATTEMPTS}</span>
            </div>
            {accuracies.length > 0 && (
              <>
                <div className="text-gray-600 dark:text-gray-400">
                  Avg: <span className="font-bold text-green-600 dark:text-green-400">{averageAccuracy}ms</span>
                </div>
                <div className="text-gray-600 dark:text-gray-400">
                  Best: <span className="font-bold text-purple-600 dark:text-purple-400">{bestAccuracy}ms</span>
                </div>
              </>
            )}
            <button
              onClick={resetGame}
              className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              title="Reset"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
              </svg>
            </button>
          </div>

          {/* Game Area */}
          <div
            onClick={handleClick}
            className={`
              ${getBackgroundColor()}
              min-h-[500px] rounded-lg flex flex-col items-center justify-center cursor-pointer
              shadow-lg select-none transition-colors
            `}
          >
            <div className={`text-white text-center p-8 ${gameState === 'finished' ? '' : 'pointer-events-none'}`}>
              <h2 className="text-4xl sm:text-5xl font-bold mb-4">
                {instruction}
              </h2>
              {gameState === 'countdown' && (
                <div className="text-8xl sm:text-9xl font-bold mt-8">
                  {countdown}
                </div>
              )}
              {gameState === 'result' && (
                <div className="mt-4">
                  <p className="text-xl opacity-90">{resultMessage}</p>
                </div>
              )}
              {gameState === 'failed' && (
                <div className="mt-4">
                  <p className="text-xl opacity-90">{resultMessage}</p>
                </div>
              )}
              {gameState === 'waiting' && currentAttempt === 0 && (
                <p className="text-xl opacity-90">
                  Estimate the time interval accurately
                </p>
              )}
              {gameState === 'finished' && (
                <div className="mt-8 pointer-events-auto">
                  <div className="text-2xl mb-2">Average: {averageAccuracy}ms</div>
                  <div className="text-2xl mb-4">Best: {bestAccuracy}ms</div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      resetGame()
                    }}
                    className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Results History */}
          {accuracies.length > 0 && gameState !== 'finished' && (
            <div className="mt-6 text-center">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Previous attempts: {accuracies.map((acc, idx) => (
                  <span key={idx} className="ml-2 font-semibold">
                    {acc}ms
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </GameWrapper>
  )
}
