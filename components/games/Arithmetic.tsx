'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { getArithmeticScores, submitArithmeticScore } from '@/lib/scores'
import { useUser } from '@/contexts/UserContext'
import { supabase } from '@/lib/supabase'
import GameWrapper from '../GameWrapper'
import type { ArithmeticScore } from '@/lib/supabase'
import { formatNumber } from '@/lib/levels'

type GameState = 'idle' | 'playing' | 'correct' | 'wrong' | 'finished'

interface Problem {
  problem: string
  answer: number
}

export default function Arithmetic() {
  const [scores, setScores] = useState<ArithmeticScore[]>([])
  const [loading, setLoading] = useState(true)
  const [gameState, setGameState] = useState<GameState>('idle')
  const [currentProblem, setCurrentProblem] = useState<Problem | null>(null)
  const [userInput, setUserInput] = useState('')
  const [correctCount, setCorrectCount] = useState(0)
  const [showCorrectAnswer, setShowCorrectAnswer] = useState(false)
  const [questionStartTime, setQuestionStartTime] = useState(0)
  const [responseTimes, setResponseTimes] = useState<number[]>([])
  const [elapsedTime, setElapsedTime] = useState(0)
  const { username } = useUser()
  const hasSubmittedScore = useRef(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const gameStartTimeRef = useRef(0)
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const timerStartedRef = useRef(false)

  const loadScores = async () => {
    try {
      setLoading(true)
      const data = await getArithmeticScores({ limit: 50 })
      setScores(data || [])
    } catch (error) {
      console.error('Error loading scores:', error)
      setScores([])
    } finally {
      setLoading(false)
    }
  }

  const clearTimer = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current)
      timerIntervalRef.current = null
    }
  }, [])

  const ensureTimerStarted = useCallback(() => {
    if (timerStartedRef.current) return
    timerStartedRef.current = true
    const now = Date.now()
    gameStartTimeRef.current = now
    // Align Q1 response clock with display timer (exclude idle before first input)
    setQuestionStartTime(now)
    setElapsedTime(0)
    timerIntervalRef.current = setInterval(() => {
      setElapsedTime(Date.now() - gameStartTimeRef.current)
    }, 1000)
  }, [])

  // Generate a random arithmetic problem where answer is a whole number
  const generateProblem = useCallback((): Problem => {
    const operations = ['+', '-', '*', '/']
    const operation = operations[Math.floor(Math.random() * operations.length)]
    
    let num1: number
    let num2: number
    let answer: number
    let problem: string
    
    switch (operation) {
      case '+':
        num1 = Math.floor(Math.random() * 100) + 1
        num2 = Math.floor(Math.random() * 100) + 1
        answer = num1 + num2
        problem = `${num1} + ${num2}`
        break
      case '-':
        num1 = Math.floor(Math.random() * 100) + 1
        num2 = Math.floor(Math.random() * num1) // Ensure positive result
        answer = num1 - num2
        problem = `${num1} - ${num2}`
        break
      case '*':
        num1 = Math.floor(Math.random() * 12) + 1 // 1-12 for multiplication tables
        num2 = Math.floor(Math.random() * 12) + 1
        answer = num1 * num2
        problem = `${num1} × ${num2}`
        break
      case '/':
        // For division, ensure whole number result
        num2 = Math.floor(Math.random() * 12) + 1 // divisor 1-12
        answer = Math.floor(Math.random() * 12) + 1 // quotient 1-12
        num1 = num2 * answer // dividend = divisor * quotient
        problem = `${num1} ÷ ${num2}`
        break
      default:
        num1 = 1
        num2 = 1
        answer = 2
        problem = '1 + 1'
    }
    
    return { problem, answer }
  }, [])

  useEffect(() => {
    loadScores()
    
    // Set up realtime listener for arithmetic scores
    const channel = supabase
      .channel('arithmetic_scores_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'arithmetic_scores'
        },
        (payload) => {
          console.log('New arithmetic score:', payload.new)
          setScores(prev => [payload.new as ArithmeticScore, ...prev.slice(0, 49)])
        }
      )
      .subscribe()

    // Start game automatically
    const problem = generateProblem()
    setCurrentProblem(problem)
    setGameState('playing')
    setQuestionStartTime(Date.now())
    setTimeout(() => inputRef.current?.focus(), 100)

    return () => {
      clearTimer()
      supabase.removeChannel(channel)
    }
  }, [generateProblem, clearTimer])

  // Keep the answer input focused while playing (esp. after submit on mobile)
  useEffect(() => {
    if (gameState === 'playing' && currentProblem) {
      inputRef.current?.focus()
    }
  }, [gameState, currentProblem])

  // Start new game
  const startGame = useCallback(() => {
    clearTimer()
    timerStartedRef.current = false
    setElapsedTime(0)
    setGameState('playing')
    setCorrectCount(0)
    setResponseTimes([])
    setShowCorrectAnswer(false)
    hasSubmittedScore.current = false
    const problem = generateProblem()
    setCurrentProblem(problem)
    setUserInput('')
    setQuestionStartTime(Date.now())
    setTimeout(() => inputRef.current?.focus(), 100)
  }, [generateProblem, clearTimer])

  // Handle submit
  const handleSubmit = useCallback(() => {
    if (gameState !== 'playing' || !userInput.trim() || !currentProblem) return
    
    const responseTime = Date.now() - questionStartTime
    const userAnswer = parseInt(userInput.trim())
    
    if (userAnswer === currentProblem.answer) {
      // Correct! Move immediately to next question
      const newCorrectCount = correctCount + 1
      setCorrectCount(newCorrectCount)
      setResponseTimes(prev => [...prev, responseTime])
      
      if (newCorrectCount >= 20) {
        // Reached 20 correct answers - game finished!
        const finalTime = timerStartedRef.current
          ? Date.now() - gameStartTimeRef.current
          : 0
        clearTimer()
        setElapsedTime(finalTime)
        setGameState('finished')
        
        // Submit score
        if (username && !hasSubmittedScore.current) {
          hasSubmittedScore.current = true
          const averageTime = Math.round(
            [...responseTimes, responseTime].reduce((sum, time) => sum + time, 0) / 
            (responseTimes.length + 1)
          )
          
          submitArithmeticScore({
            username,
            correct_answers: 20,
            average_time: averageTime
          }).then(() => {
            setTimeout(() => loadScores(), 1000)
          }).catch(error => {
            console.error('Error submitting score:', error)
            hasSubmittedScore.current = false
          })
        }
      } else {
        // Continue to next question immediately
        const problem = generateProblem()
        setCurrentProblem(problem)
        setUserInput('')
        setQuestionStartTime(Date.now())
        // Focus immediately within the same user gesture so mobile keyboards stay open
        inputRef.current?.focus()
      }
    } else {
      // Wrong! Show the correct answer and wait for user to click "Play Again"
      clearTimer()
      setGameState('wrong')
      setShowCorrectAnswer(true)
      setResponseTimes(prev => [...prev, responseTime])
      
      // Submit score when wrong answer is shown
      if (username && !hasSubmittedScore.current && correctCount > 0) {
        hasSubmittedScore.current = true
        const averageTime = Math.round(
          [...responseTimes, responseTime].reduce((sum, time) => sum + time, 0) / 
          (responseTimes.length + 1)
        )
        
        submitArithmeticScore({
          username,
          correct_answers: correctCount,
          average_time: averageTime
        }).then(() => {
          setTimeout(() => loadScores(), 1000)
        }).catch(error => {
          console.error('Error submitting score:', error)
          hasSubmittedScore.current = false
        })
      }
    }
  }, [gameState, userInput, currentProblem, correctCount, questionStartTime, responseTimes, username, generateProblem, loadScores, clearTimer])

  // Handle key press
  const handleKeyPress = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSubmit()
    }
  }, [handleSubmit])

  // Reset game
  const resetGame = useCallback(() => {
    clearTimer()
    timerStartedRef.current = false
    setGameState('idle')
    setCurrentProblem(null)
    setUserInput('')
    setCorrectCount(0)
    setShowCorrectAnswer(false)
    setResponseTimes([])
    setElapsedTime(0)
    hasSubmittedScore.current = false
    // Automatically start a new game after reset
    setTimeout(() => {
      const problem = generateProblem()
      setCurrentProblem(problem)
      setGameState('playing')
      setQuestionStartTime(Date.now())
      setTimeout(() => inputRef.current?.focus(), 100)
    }, 100)
  }, [generateProblem, clearTimer])

  const formatScore = (score: ArithmeticScore) => {
    return `${formatNumber(score.correct_answers)} correct (${formatNumber(score.average_time)}ms avg)`
  }

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000)
    return `${seconds}s`
  }

  const formatExactTime = (ms: number) => {
    return `${(ms / 1000).toFixed(3)}s`
  }

  return (
    <GameWrapper
      gameType="Arithmetic"
      scores={scores}
      loading={loading}
      onRefresh={loadScores}
      fetchScores={getArithmeticScores}
      scoreTable="arithmetic_scores"
      formatScore={formatScore}
      sortKey="correct_answers"
      sortDirection="desc"
      customSort={(a, b) => {
        // Sort by correct_answers first (desc), then by average_time (asc - faster is better)
        if (a.correct_answers !== b.correct_answers) {
          return b.correct_answers - a.correct_answers
        }
        return a.average_time - b.average_time
      }}
    >
      <div className="w-full">
        <div className="mx-auto w-full max-w-2xl">
          {/* Status row */}
          <div className="mb-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 sm:gap-6">
              <div className="flex items-baseline gap-2">
                <span className="eyebrow">Correct</span>
                <span className="num text-sm font-medium text-gray-900 dark:text-gray-100">{correctCount}/20</span>
              </div>
              <span className="text-gray-300 dark:text-gray-700" aria-hidden="true">·</span>
              <div className="flex items-baseline gap-2">
                <span className="eyebrow">Time</span>
                <span className="num text-sm font-medium text-gray-900 dark:text-gray-100">{formatTime(elapsedTime)}</span>
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
          <div className="flex min-h-[360px] flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900 sm:min-h-[420px]">
          {gameState === 'playing' && currentProblem && (
            <div className="flex w-full flex-col items-center">
              <div className="num mb-8 text-4xl font-bold tracking-tight text-gray-950 dark:text-gray-50 sm:text-6xl">
                {currentProblem.problem} = ?
              </div>
              
              <div className="w-full max-w-sm">
                <input
                  ref={inputRef}
                  type="number"
                  inputMode="numeric"
                  value={userInput}
                  onChange={(e) => {
                    ensureTimerStarted()
                    setUserInput(e.target.value)
                  }}
                  onKeyPress={handleKeyPress}
                  placeholder="Enter answer"
                  className="input num py-3 text-center text-2xl"
                  autoFocus
                  autoComplete="off"
                />
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={handleSubmit}
                  className="btn-primary mt-4 w-full"
                >
                  Submit
                </button>
              </div>
            </div>
          )}

          {gameState === 'wrong' && currentProblem && (
            <div className="flex w-full flex-col items-center text-center">
              <span className="eyebrow text-red-600! dark:text-red-400!">Wrong answer</span>
              <div className="num mt-3 text-6xl font-bold tracking-tight text-gray-950 dark:text-white sm:text-7xl">
                {correctCount}/20
              </div>
              {showCorrectAnswer && (
                <div className="mt-8 grid w-full max-w-md grid-cols-2 gap-3">
                  <div className="card p-4 text-left">
                    <div className="eyebrow">Your answer</div>
                    <div className="num mt-2 text-lg font-semibold text-red-600 dark:text-red-400">{userInput}</div>
                  </div>
                  <div className="card p-4 text-left">
                    <div className="eyebrow">Correct answer</div>
                    <div className="num mt-2 text-lg font-semibold text-green-600 dark:text-green-400">{currentProblem.answer}</div>
                  </div>
                  <div className="num col-span-2 mt-1 text-sm text-gray-600 dark:text-gray-400">
                    {currentProblem.problem} = {currentProblem.answer}
                  </div>
                </div>
              )}
              <button
                onClick={resetGame}
                className="btn-ink mt-8"
              >
                Play again
              </button>
            </div>
          )}

          {gameState === 'finished' && (
            <div className="flex w-full flex-col items-center text-center">
              <span className="eyebrow">Result</span>
              <div className="num mt-3 text-6xl font-bold tracking-tight text-gray-950 dark:text-white sm:text-7xl">
                20/20
              </div>
              <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                All 20 questions answered correctly
              </div>
              <div className="mt-8 grid w-full max-w-xs grid-cols-1 gap-3">
                <div className="card p-4 text-left">
                  <div className="eyebrow">Time</div>
                  <div className="num mt-2 text-lg font-semibold text-signal-600 dark:text-signal-400">
                    {formatExactTime(elapsedTime)}
                  </div>
                </div>
              </div>
              <button
                onClick={resetGame}
                className="btn-ink mt-8"
              >
                Play again
              </button>
            </div>
          )}
          </div>
        </div>
      </div>
    </GameWrapper>
  )
}
