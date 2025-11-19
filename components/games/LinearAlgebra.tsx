'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { getLinearAlgebraScores, submitLinearAlgebraScore } from '@/lib/scores'
import { useUser } from '@/contexts/UserContext'
import { supabase } from '@/lib/supabase'
import GameWrapper from '../GameWrapper'
import type { LinearAlgebraScore } from '@/lib/supabase'
import { LinearAlgebraIcon } from '../icons/GameIcons'
import { formatNumber } from '@/lib/levels'

type GameState = 'idle' | 'playing' | 'correct' | 'wrong' | 'finished'
type ProblemType = 'vector_addition' | 'scalar_multiplication' | 'dot_product' | 'matrix_vector'

interface Problem {
  type: ProblemType
  question: string
  answer: number | [number, number]
  answerType: 'number' | 'vector'
}

const PROBLEM_TYPE_NAMES: Record<ProblemType, string> = {
  vector_addition: 'Vector Addition',
  scalar_multiplication: 'Scalar Multiplication',
  dot_product: 'Dot Product',
  matrix_vector: 'Matrix-Vector Multiplication'
}

export default function LinearAlgebra() {
  const [scores, setScores] = useState<LinearAlgebraScore[]>([])
  const [loading, setLoading] = useState(true)
  const [gameState, setGameState] = useState<GameState>('idle')
  const [currentProblem, setCurrentProblem] = useState<Problem | null>(null)
  const [userInput, setUserInput] = useState('')
  const [correctCount, setCorrectCount] = useState(0)
  const [currentProblemType, setCurrentProblemType] = useState<ProblemType | null>(null)
  const [showCorrectAnswer, setShowCorrectAnswer] = useState(false)
  const [questionStartTime, setQuestionStartTime] = useState(0)
  const [responseTimes, setResponseTimes] = useState<number[]>([])
  const { username } = useUser()
  const hasSubmittedScore = useRef(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const loadScores = async () => {
    try {
      setLoading(true)
      const data = await getLinearAlgebraScores({ limit: 50 })
      setScores(data || [])
    } catch (error) {
      console.error('Error loading scores:', error)
      setScores([])
    } finally {
      setLoading(false)
    }
  }

  // Generate a random linear algebra problem
  const generateProblem = useCallback((): Problem => {
    const types: ProblemType[] = ['vector_addition', 'scalar_multiplication', 'dot_product', 'matrix_vector']
    const type = types[Math.floor(Math.random() * types.length)]
    
    switch (type) {
      case 'vector_addition': {
        // (a, b) + (c, d) = (a+c, b+d)
        const a = Math.floor(Math.random() * 10) - 5 // -5 to 4
        const b = Math.floor(Math.random() * 10) - 5
        const c = Math.floor(Math.random() * 10) - 5
        const d = Math.floor(Math.random() * 10) - 5
        const answer: [number, number] = [a + c, b + d]
        return {
          type,
          question: `(${a}, ${b}) + (${c}, ${d}) = ?`,
          answer,
          answerType: 'vector'
        }
      }
      
      case 'scalar_multiplication': {
        // k * (a, b) = (k*a, k*b)
        const k = Math.floor(Math.random() * 10) - 5 // -5 to 4
        const a = Math.floor(Math.random() * 10) - 5
        const b = Math.floor(Math.random() * 10) - 5
        const answer: [number, number] = [k * a, k * b]
        return {
          type,
          question: `${k} × (${a}, ${b}) = ?`,
          answer,
          answerType: 'vector'
        }
      }
      
      case 'dot_product': {
        // (a, b) · (c, d) = a*c + b*d
        const a = Math.floor(Math.random() * 10) - 5
        const b = Math.floor(Math.random() * 10) - 5
        const c = Math.floor(Math.random() * 10) - 5
        const d = Math.floor(Math.random() * 10) - 5
        const answer = a * c + b * d
        return {
          type,
          question: `(${a}, ${b}) · (${c}, ${d}) = ?`,
          answer,
          answerType: 'number'
        }
      }
      
      case 'matrix_vector': {
        // [[a, b], [c, d]] * (x, y) = (a*x + b*y, c*x + d*y)
        const a = Math.floor(Math.random() * 5) - 2 // -2 to 2 (smaller numbers)
        const b = Math.floor(Math.random() * 5) - 2
        const c = Math.floor(Math.random() * 5) - 2
        const d = Math.floor(Math.random() * 5) - 2
        const x = Math.floor(Math.random() * 5) - 2
        const y = Math.floor(Math.random() * 5) - 2
        const answer: [number, number] = [a * x + b * y, c * x + d * y]
        return {
          type,
          question: `[[${a}, ${b}], [${c}, ${d}]] × (${x}, ${y}) = ?`,
          answer,
          answerType: 'vector'
        }
      }
    }
  }, [])

  useEffect(() => {
    loadScores()
    
    // Set up realtime listener for linear algebra scores
    const channel = supabase
      .channel('linear_algebra_scores_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'linear_algebra_scores'
        },
        (payload) => {
          console.log('New linear algebra score:', payload.new)
          setScores(prev => [payload.new as LinearAlgebraScore, ...prev.slice(0, 49)])
        }
      )
      .subscribe()

    // Start game automatically
    const problem = generateProblem()
    setCurrentProblem(problem)
    setCurrentProblemType(problem.type)
    setGameState('playing')
    setQuestionStartTime(Date.now())
    setTimeout(() => inputRef.current?.focus(), 100)

    return () => {
      supabase.removeChannel(channel)
    }
  }, [generateProblem])

  // Start new game
  const startGame = useCallback(() => {
    setGameState('playing')
    setCorrectCount(0)
    setResponseTimes([])
    setShowCorrectAnswer(false)
    hasSubmittedScore.current = false
    const problem = generateProblem()
    setCurrentProblem(problem)
    setCurrentProblemType(problem.type)
    setUserInput('')
    setQuestionStartTime(Date.now())
    setTimeout(() => inputRef.current?.focus(), 100)
  }, [generateProblem])

  // Parse user input
  const parseAnswer = (input: string): number | [number, number] | null => {
    const trimmed = input.trim()
    
    // Try to parse as vector: (x, y) or x, y
    const vectorMatch = trimmed.match(/\(?\s*(-?\d+)\s*,\s*(-?\d+)\s*\)?/)
    if (vectorMatch) {
      return [parseInt(vectorMatch[1]), parseInt(vectorMatch[2])]
    }
    
    // Try to parse as number
    const numMatch = trimmed.match(/^(-?\d+)$/)
    if (numMatch) {
      return parseInt(numMatch[1])
    }
    
    return null
  }

  // Check if answers match
  const answersMatch = (user: number | [number, number], correct: number | [number, number]): boolean => {
    if (typeof user === 'number' && typeof correct === 'number') {
      return user === correct
    }
    if (Array.isArray(user) && Array.isArray(correct)) {
      return user[0] === correct[0] && user[1] === correct[1]
    }
    return false
  }

  // Format answer for display
  const formatAnswer = (answer: number | [number, number]): string => {
    if (typeof answer === 'number') {
      return answer.toString()
    }
    return `(${answer[0]}, ${answer[1]})`
  }

  // Handle submit
  const handleSubmit = useCallback(() => {
    if (gameState !== 'playing' || !userInput.trim() || !currentProblem) return
    
    const responseTime = Date.now() - questionStartTime
    const parsedAnswer = parseAnswer(userInput)
    
    if (parsedAnswer === null) {
      // Invalid input format
      return
    }
    
    if (answersMatch(parsedAnswer, currentProblem.answer)) {
      // Correct!
      const newCorrectCount = correctCount + 1
      setCorrectCount(newCorrectCount)
      setResponseTimes(prev => [...prev, responseTime])
      
      if (newCorrectCount >= 10) {
        // Reached 10 correct answers - game finished!
        setGameState('finished')
        
        // Submit single score for the entire game
        if (username && !hasSubmittedScore.current) {
          hasSubmittedScore.current = true
          const allTimes = [...responseTimes, responseTime]
          const averageTime = Math.round(
            allTimes.reduce((sum, time) => sum + time, 0) / allTimes.length
          )
          
          submitLinearAlgebraScore({
            username,
            correct_answers: 10,
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
        setCurrentProblemType(problem.type)
        setUserInput('')
        setQuestionStartTime(Date.now())
        setTimeout(() => inputRef.current?.focus(), 100)
      }
    } else {
      // Wrong! Show the correct answer and wait for user to click "Play Again"
      setGameState('wrong')
      setShowCorrectAnswer(true)
      setResponseTimes(prev => [...prev, responseTime])
      
      // Submit score when wrong answer is shown
      if (username && !hasSubmittedScore.current && correctCount > 0) {
        hasSubmittedScore.current = true
        const allTimes = [...responseTimes, responseTime]
        const averageTime = Math.round(
          allTimes.reduce((sum, time) => sum + time, 0) / allTimes.length
        )
        
        submitLinearAlgebraScore({
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
  }, [gameState, userInput, currentProblem, correctCount, questionStartTime, responseTimes, username, generateProblem, loadScores])

  // Handle key press
  const handleKeyPress = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSubmit()
    }
  }, [handleSubmit])

  // Reset game
  const resetGame = useCallback(() => {
    setGameState('idle')
    setCurrentProblem(null)
    setCurrentProblemType(null)
    setUserInput('')
    setCorrectCount(0)
    setShowCorrectAnswer(false)
    setResponseTimes([])
    hasSubmittedScore.current = false
    // Automatically start a new game after reset
    setTimeout(() => {
      const problem = generateProblem()
      setCurrentProblem(problem)
      setCurrentProblemType(problem.type)
      setGameState('playing')
      setQuestionStartTime(Date.now())
      setTimeout(() => inputRef.current?.focus(), 100)
    }, 100)
  }, [generateProblem])

  const formatScore = (score: LinearAlgebraScore) => {
    return `${formatNumber(score.correct_answers)} correct (${formatNumber(score.average_time)}ms avg)`
  }

  return (
    <GameWrapper
      gameType="Linear Algebra"
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
            Correct: <span className="font-bold text-green-600 dark:text-green-400">{correctCount}</span> / 10
            {currentProblemType && (
              <span className="ml-4 text-xs">
                Type: <span className="font-semibold">{PROBLEM_TYPE_NAMES[currentProblemType]}</span>
              </span>
            )}
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
          {gameState === 'playing' && currentProblem && (
            <div className="flex flex-col items-center">
              <div className="text-3xl sm:text-4xl font-bold text-gray-800 dark:text-gray-100 mb-8 p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg text-center">
                {currentProblem.question}
              </div>
              
              <div className="w-full max-w-md">
                <input
                  ref={inputRef}
                  type="text"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={currentProblem.answerType === 'vector' ? 'Enter as (x, y)' : 'Enter number'}
                  className="w-full px-4 py-3 text-2xl text-center border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
                  autoFocus
                />
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
                  {currentProblem.answerType === 'vector' ? 'Format: (x, y) or x, y' : 'Enter a number'}
                </div>
                <button
                  onClick={handleSubmit}
                  className="w-full mt-4 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-lg transition-colors"
                >
                  Submit
                </button>
              </div>
            </div>
          )}

          {gameState === 'wrong' && currentProblem && (
            <div className="flex flex-col items-center">
              <div className="text-6xl mb-4">✗</div>
              <div className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">
                Wrong Answer!
              </div>
              {showCorrectAnswer && (
                <div className="text-xl text-gray-600 dark:text-gray-400 mt-4 mb-6 text-center">
                  <div className="mb-2">Your answer: {userInput || '(empty)'}</div>
                  <div className="mb-2">Correct answer: {formatAnswer(currentProblem.answer)}</div>
                  <div className="text-lg mt-4">
                    {currentProblem.question.replace('?', formatAnswer(currentProblem.answer))}
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
                Congratulations!
              </div>
              <div className="text-xl text-gray-600 dark:text-gray-400 mb-6">
                You completed all 10 questions correctly!
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
