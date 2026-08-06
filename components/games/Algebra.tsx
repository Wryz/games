'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { getAlgebraScores, submitAlgebraScore } from '@/lib/scores'
import { useUser } from '@/contexts/UserContext'
import { supabase } from '@/lib/supabase'
import GameWrapper from '../GameWrapper'
import type { AlgebraScore } from '@/lib/supabase'
import { formatNumber } from '@/lib/levels'

type GameState = 'idle' | 'playing' | 'correct' | 'wrong' | 'finished'

interface Equation {
  equation: string
  answer: number
}

export default function Algebra() {
  const [scores, setScores] = useState<AlgebraScore[]>([])
  const [loading, setLoading] = useState(true)
  const [gameState, setGameState] = useState<GameState>('idle')
  const [currentEquation, setCurrentEquation] = useState<Equation | null>(null)
  const [userInput, setUserInput] = useState('')
  const [correctCount, setCorrectCount] = useState(0)
  const [showCorrectAnswer, setShowCorrectAnswer] = useState(false)
  const [questionStartTime, setQuestionStartTime] = useState(0)
  const [responseTimes, setResponseTimes] = useState<number[]>([])
  const { username } = useUser()
  const hasSubmittedScore = useRef(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const loadScores = async () => {
    try {
      setLoading(true)
      const data = await getAlgebraScores({ limit: 50 })
      setScores(data || [])
    } catch (error) {
      console.error('Error loading scores:', error)
      setScores([])
    } finally {
      setLoading(false)
    }
  }

  // Generate a random algebraic equation where x is a whole number
  const generateEquation = useCallback((): Equation => {
    // Generate equations of the form: ax + b = c, where x is a whole number
    // We'll ensure the answer is always a whole number
    
    const a = Math.floor(Math.random() * 10) + 1 // coefficient of x (1-10)
    const x = Math.floor(Math.random() * 20) - 10 // solution (-10 to 9)
    const b = Math.floor(Math.random() * 50) - 25 // constant term (-25 to 24)
    const c = a * x + b // right side of equation
    
    // Format equation as "ax + b = c" or "ax - b = c" if b is negative
    let equation: string
    if (b >= 0) {
      equation = `${a}x + ${b} = ${c}`
    } else {
      equation = `${a}x - ${Math.abs(b)} = ${c}`
    }
    
    return { equation, answer: x }
  }, [])

  useEffect(() => {
    loadScores()
    
    // Set up realtime listener for algebra scores
    const channel = supabase
      .channel('algebra_scores_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'algebra_scores'
        },
        (payload) => {
          console.log('New algebra score:', payload.new)
          setScores(prev => [payload.new as AlgebraScore, ...prev.slice(0, 49)])
        }
      )
      .subscribe()

    // Start game automatically
    const equation = generateEquation()
    setCurrentEquation(equation)
    setGameState('playing')
    setQuestionStartTime(Date.now())
    setTimeout(() => inputRef.current?.focus(), 100)

    return () => {
      supabase.removeChannel(channel)
    }
  }, [generateEquation])

  // Keep the answer input focused while playing (esp. after submit on mobile)
  useEffect(() => {
    if (gameState === 'playing' && currentEquation) {
      inputRef.current?.focus()
    }
  }, [gameState, currentEquation])

  // Start new game
  const startGame = useCallback(() => {
    setGameState('playing')
    setCorrectCount(0)
    setResponseTimes([])
    setShowCorrectAnswer(false)
    hasSubmittedScore.current = false
    const equation = generateEquation()
    setCurrentEquation(equation)
    setUserInput('')
    setQuestionStartTime(Date.now())
    setTimeout(() => inputRef.current?.focus(), 100)
  }, [generateEquation])

  // Handle submit
  const handleSubmit = useCallback(() => {
    if (gameState !== 'playing' || !userInput.trim() || !currentEquation) return
    
    const responseTime = Date.now() - questionStartTime
    const userAnswer = parseInt(userInput.trim())
    
    if (userAnswer === currentEquation.answer) {
      // Correct! Move immediately to next question
      const newCorrectCount = correctCount + 1
      setCorrectCount(newCorrectCount)
      setResponseTimes(prev => [...prev, responseTime])
      
      if (newCorrectCount >= 20) {
        // Reached 20 correct answers - game finished!
        setGameState('finished')
        
        // Submit score
        if (username && !hasSubmittedScore.current) {
          hasSubmittedScore.current = true
          const averageTime = Math.round(
            [...responseTimes, responseTime].reduce((sum, time) => sum + time, 0) / 
            (responseTimes.length + 1)
          )
          
          submitAlgebraScore({
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
        const equation = generateEquation()
        setCurrentEquation(equation)
        setUserInput('')
        setQuestionStartTime(Date.now())
        // Focus immediately within the same user gesture so mobile keyboards stay open
        inputRef.current?.focus()
      }
    } else {
      // Wrong! Show the correct answer and wait for user to click "Play Again"
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
        
        submitAlgebraScore({
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
  }, [gameState, userInput, currentEquation, correctCount, questionStartTime, responseTimes, username, generateEquation, loadScores])

  // Handle key press
  const handleKeyPress = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSubmit()
    }
  }, [handleSubmit])

  // Reset game
  const resetGame = useCallback(() => {
    setGameState('idle')
    setCurrentEquation(null)
    setUserInput('')
    setCorrectCount(0)
    setShowCorrectAnswer(false)
    setResponseTimes([])
    hasSubmittedScore.current = false
    // Automatically start a new game after reset
    setTimeout(() => {
      const equation = generateEquation()
      setCurrentEquation(equation)
      setGameState('playing')
      setQuestionStartTime(Date.now())
      setTimeout(() => inputRef.current?.focus(), 100)
    }, 100)
  }, [generateEquation])

  const formatScore = (score: AlgebraScore) => {
    return `${formatNumber(score.correct_answers)} correct (${formatNumber(score.average_time)}ms avg)`
  }

  return (
    <GameWrapper
      gameType="Algebra"
      scores={scores}
      loading={loading}
      onRefresh={loadScores}
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
      <div className="flex flex-col items-center justify-start min-h-[400px] sm:min-h-[600px] pt-8">
        {/* Stats */}
        <div className="flex justify-between items-center w-full max-w-2xl mb-6 text-sm sm:text-base">
          <div className="text-gray-600 dark:text-gray-400">
            Correct: <span className="font-bold text-green-600 dark:text-green-400">{correctCount}</span> / 20
          </div>
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
        <div className="w-full max-w-2xl">
          {gameState === 'playing' && currentEquation && (
            <div className="flex flex-col items-center">
              <div className="text-4xl sm:text-5xl font-bold text-gray-800 dark:text-gray-100 mb-8 p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
                {currentEquation.equation}
              </div>
              
              <div className="w-full max-w-md">
                <input
                  ref={inputRef}
                  type="number"
                  inputMode="numeric"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Enter value of x"
                  className="w-full px-4 py-3 text-2xl text-center border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
                  autoFocus
                  autoComplete="off"
                />
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={handleSubmit}
                  className="w-full mt-4 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-lg transition-colors"
                >
                  Submit
                </button>
              </div>
            </div>
          )}

          {gameState === 'wrong' && currentEquation && (
            <div className="flex flex-col items-center">
              <div className="text-6xl mb-4">✗</div>
              <div className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">
                Wrong Answer!
              </div>
              {showCorrectAnswer && (
                <div className="text-xl text-gray-600 dark:text-gray-400 mt-4 mb-6">
                  <div className="mb-2">Your answer: {userInput}</div>
                  <div className="mb-2">Correct answer: x = {currentEquation.answer}</div>
                  <div className="text-lg mt-4">
                    {currentEquation.equation} → x = {currentEquation.answer}
                  </div>
                </div>
              )}
              <button
                onClick={resetGame}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-lg transition-colors"
              >
                Play Again
              </button>
            </div>
          )}

          {gameState === 'finished' && (
            <div className="flex flex-col items-center">
              <div className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">
                Game Over!
              </div>
              <div className="text-xl text-gray-600 dark:text-gray-400 mb-6">
                You got {correctCount} correct answer{correctCount !== 1 ? 's' : ''}!
              </div>
              <button
                onClick={resetGame}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-lg transition-colors"
              >
                Play Again
              </button>
            </div>
          )}
        </div>
      </div>
    </GameWrapper>
  )
}
