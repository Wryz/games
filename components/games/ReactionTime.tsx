'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { ReactionTimeIcon } from '../icons/GameIcons'
import { getReactionTimeScores, submitReactionTimeScore } from '@/lib/scores'
import { useUser } from '@/contexts/UserContext'
import { supabase } from '@/lib/supabase'
import GameWrapper from '../GameWrapper'
import type { ReactionTimeScore } from '@/lib/supabase'
import { formatNumber } from '@/lib/levels'

type GameState = 'waiting' | 'ready' | 'click' | 'too-early' | 'finished'

export default function ReactionTime() {
  const [scores, setScores] = useState<ReactionTimeScore[]>([])
  const [loading, setLoading] = useState(true)
  const [gameState, setGameState] = useState<GameState>('waiting')
  const [reactionTimes, setReactionTimes] = useState<number[]>([])
  const [currentAttempt, setCurrentAttempt] = useState(0)
  const [instruction, setInstruction] = useState('Click anywhere to start')
  const { username } = useUser()
  const startTimeRef = useRef<number>(0)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const hasSubmittedScore = useRef(false)
  const gameStateRef = useRef<GameState>(gameState)
  const currentAttemptRef = useRef(currentAttempt)
  const reactionTimesRef = useRef(reactionTimes)

  const TOTAL_ATTEMPTS = 5

  gameStateRef.current = gameState
  currentAttemptRef.current = currentAttempt
  reactionTimesRef.current = reactionTimes

  const clearTimers = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }, [])

  const loadScores = async () => {
    try {
      setLoading(true)
      const data = await getReactionTimeScores({ limit: 50 })
      setScores(data)
    } catch (error) {
      console.error('Error loading scores:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadScores()
    
    // Set up realtime listener for reaction time scores
    const channel = supabase
      .channel('reaction_time_scores_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'reaction_time_scores'
        },
        (payload) => {
          console.log('New reaction time score:', payload.new)
          setScores(prev => [payload.new as ReactionTimeScore, ...prev.slice(0, 49)])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  // Start a new round
  const startRound = useCallback(() => {
    if (currentAttemptRef.current > TOTAL_ATTEMPTS) return

    clearTimers()
    gameStateRef.current = 'ready'
    setGameState('ready')
    setInstruction('Wait for green...')
    
    // Random delay between 1-5 seconds
    const delay = Math.random() * 4000 + 1000
    
    timeoutRef.current = setTimeout(() => {
      gameStateRef.current = 'click'
      setGameState('click')
      setInstruction('Click now!')
      startTimeRef.current = Date.now()
    }, delay)
  }, [clearTimers])

  // Handle click
  const handleClick = useCallback(() => {
    const state = gameStateRef.current
    const attempt = currentAttemptRef.current

    if (state === 'waiting' && attempt === 0) {
      // First click - start the game
      currentAttemptRef.current = 1
      setCurrentAttempt(1)
      startRound()
    } else if (state === 'waiting' && attempt > 0) {
      // Already started, just continue to next round
      startRound()
    } else if (state === 'ready') {
      // Clicked too early — fully cancel the pending green, then retry this attempt
      clearTimers()
      gameStateRef.current = 'too-early'
      setGameState('too-early')
      setInstruction('Too early!')

      timeoutRef.current = setTimeout(() => {
        startRound()
      }, 1500)
    } else if (state === 'click') {
      // Clicked at the right time
      clearTimers()
      const reactionTime = Date.now() - startTimeRef.current
      const newTimes = [...reactionTimesRef.current, reactionTime]
      reactionTimesRef.current = newTimes
      setReactionTimes(newTimes)
      
      if (attempt >= TOTAL_ATTEMPTS) {
        // Game finished
        gameStateRef.current = 'finished'
        setGameState('finished')
        setInstruction('Test complete!')
      } else {
        // Next attempt
        const nextAttempt = attempt + 1
        currentAttemptRef.current = nextAttempt
        setCurrentAttempt(nextAttempt)
        gameStateRef.current = 'waiting'
        setGameState('waiting')
        setInstruction(`${reactionTime}ms!`)
        
        // Auto-start next round after showing result
        timeoutRef.current = setTimeout(() => {
          if (nextAttempt <= TOTAL_ATTEMPTS) {
            startRound()
          }
        }, 1500)
      }
    }
    // Ignore clicks during too-early / finished so recovery timers aren't interrupted
  }, [clearTimers, startRound])

  // Submit score when game finishes
  useEffect(() => {
    if (gameState === 'finished' && reactionTimes.length > 0 && username && !hasSubmittedScore.current) {
      hasSubmittedScore.current = true
      
      const averageTime = Math.round(
        reactionTimes.reduce((sum, time) => sum + time, 0) / reactionTimes.length
      )
      const fastestTime = Math.min(...reactionTimes)
      
      submitReactionTimeScore({
        username,
        average_time: averageTime,
        fastest_time: fastestTime,
        attempts: reactionTimes.length
      }).then(() => {
        // Reload scores after submission
        setTimeout(() => loadScores(), 1000)
      }).catch(error => {
        console.error('Error submitting score:', error)
        hasSubmittedScore.current = false
      })
    }
  }, [gameState, reactionTimes, username])

  // Reset game
  const resetGame = useCallback(() => {
    clearTimers()
    gameStateRef.current = 'waiting'
    currentAttemptRef.current = 0
    reactionTimesRef.current = []
    setGameState('waiting')
    setReactionTimes([])
    setCurrentAttempt(0)
    setInstruction('Click anywhere to start')
    hasSubmittedScore.current = false
  }, [clearTimers])

  const formatScore = (score: ReactionTimeScore) => {
    return `${formatNumber(score.average_time)}ms avg (${formatNumber(score.fastest_time)}ms best)`
  }

  // Calculate current stats
  const averageTime = reactionTimes.length > 0 
    ? Math.round(reactionTimes.reduce((sum, time) => sum + time, 0) / reactionTimes.length)
    : 0
  const fastestTime = reactionTimes.length > 0 ? Math.min(...reactionTimes) : 0

  // Get background color based on state
  const getBackgroundColor = () => {
    if (gameState === 'click') return 'bg-green-500'
    if (gameState === 'ready') return 'bg-red-500'
    if (gameState === 'too-early') return 'bg-yellow-500'
    return 'bg-blue-500'
  }

  return (
    <GameWrapper
      gameType="Reaction Time"
      scores={scores}
      loading={loading}
      onRefresh={loadScores}
      fetchScores={getReactionTimeScores}
      scoreTable="reaction_time_scores"
      formatScore={formatScore}
      sortKey="average_time"
      sortDirection="asc"
    >
      <div className="flex flex-col items-center justify-start min-h-[400px] sm:min-h-[600px] pt-8">
        <div className="w-full">
          {/* Stats and Reset */}
          <div className="flex justify-between items-center mb-6 text-sm sm:text-base">
            <div className="text-gray-600 dark:text-gray-400">
              Attempt: <span className="font-bold text-blue-600 dark:text-blue-400">{Math.min(currentAttempt, TOTAL_ATTEMPTS)}/{TOTAL_ATTEMPTS}</span>
            </div>
            {reactionTimes.length > 0 && (
              <>
                <div className="text-gray-600 dark:text-gray-400">
                  Avg: <span className="font-bold text-green-600 dark:text-green-400">{averageTime}ms</span>
                </div>
                <div className="text-gray-600 dark:text-gray-400">
                  Best: <span className="font-bold text-purple-600 dark:text-purple-400">{fastestTime}ms</span>
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
              shadow-lg select-none
            `}
          >
            <div className="text-white text-center p-8 pointer-events-none">
              <h2 className="text-4xl sm:text-5xl font-bold mb-4">
                {instruction}
        </h2>
              {gameState === 'waiting' && currentAttempt === 0 && (
                <p className="text-xl opacity-90">
                  Click when the screen turns green
                </p>
              )}
              {gameState === 'finished' && (
                <div className="mt-8">
                  <div className="text-2xl mb-2">Average: {averageTime}ms</div>
                  <div className="text-2xl mb-4">Fastest: {fastestTime}ms</div>
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
          {reactionTimes.length > 0 && gameState !== 'finished' && (
            <div className="mt-6 text-center">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Previous attempts: {reactionTimes.map((time, idx) => (
                  <span key={idx} className="ml-2 font-semibold">
                    {time}ms
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
