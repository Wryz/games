'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { getGeometryScores, submitGeometryScore } from '@/lib/scores'
import { useUser } from '@/contexts/UserContext'
import { supabase } from '@/lib/supabase'
import GameWrapper from '../GameWrapper'
import type { GeometryScore } from '@/lib/supabase'
import { GeometryIcon } from '../icons/GameIcons'
import { formatNumber } from '@/lib/levels'

type GameState = 'idle' | 'playing' | 'correct' | 'wrong' | 'finished'
type ProblemType = 'triangle_angles' | 'quadrilateral_angles' | 'pythagorean' | 'area'

interface Problem {
  type: ProblemType
  question: string
  shape: JSX.Element
  answer: number
  options: number[]
}

const PROBLEM_TYPE_NAMES: Record<ProblemType, string> = {
  triangle_angles: 'Triangle Angles',
  quadrilateral_angles: 'Quadrilateral Angles',
  pythagorean: 'Pythagorean Theorem',
  area: 'Area'
}

// Triangle component
const TriangleShape = ({ angle1, angle2, angle3, missingAngle }: { angle1: number | null, angle2: number | null, angle3: number | null, missingAngle: 'a' | 'b' | 'c' }) => {
  return (
    <svg width="200" height="180" viewBox="0 0 200 180" className="mx-auto">
      <polygon
        points="100,20 40,160 160,160"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        className="text-gray-800 dark:text-gray-200"
      />
      {/* Angle labels */}
      {missingAngle !== 'a' && angle1 !== null && (
        <text x="90" y="35" className="text-sm font-bold fill-current text-blue-600 dark:text-blue-400">
          {angle1}°
        </text>
      )}
      {missingAngle === 'a' && (
        <text x="90" y="35" className="text-sm font-bold fill-current text-red-600 dark:text-red-400">
          ?
        </text>
      )}
      {missingAngle !== 'b' && angle2 !== null && (
        <text x="25" y="155" className="text-sm font-bold fill-current text-blue-600 dark:text-blue-400">
          {angle2}°
        </text>
      )}
      {missingAngle === 'b' && (
        <text x="25" y="155" className="text-sm font-bold fill-current text-red-600 dark:text-red-400">
          ?
        </text>
      )}
      {missingAngle !== 'c' && angle3 !== null && (
        <text x="155" y="155" className="text-sm font-bold fill-current text-blue-600 dark:text-blue-400">
          {angle3}°
        </text>
      )}
      {missingAngle === 'c' && (
        <text x="155" y="155" className="text-sm font-bold fill-current text-red-600 dark:text-red-400">
          ?
        </text>
      )}
    </svg>
  )
}

// Quadrilateral component
const QuadrilateralShape = ({ angle1, angle2, angle3, angle4, missingAngle }: { angle1: number | null, angle2: number | null, angle3: number | null, angle4: number | null, missingAngle: 'a' | 'b' | 'c' | 'd' }) => {
  return (
    <svg width="200" height="180" viewBox="0 0 200 180" className="mx-auto">
      <polygon
        points="50,30 150,30 170,150 30,150"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        className="text-gray-800 dark:text-gray-200"
      />
      {/* Angle labels */}
      {missingAngle !== 'a' && angle1 !== null && (
        <text x="60" y="45" className="text-sm font-bold fill-current text-blue-600 dark:text-blue-400">
          {angle1}°
        </text>
      )}
      {missingAngle === 'a' && (
        <text x="60" y="45" className="text-sm font-bold fill-current text-red-600 dark:text-red-400">
          ?
        </text>
      )}
      {missingAngle !== 'b' && angle2 !== null && (
        <text x="155" y="45" className="text-sm font-bold fill-current text-blue-600 dark:text-blue-400">
          {angle2}°
        </text>
      )}
      {missingAngle === 'b' && (
        <text x="155" y="45" className="text-sm font-bold fill-current text-red-600 dark:text-red-400">
          ?
        </text>
      )}
      {missingAngle !== 'c' && angle3 !== null && (
        <text x="165" y="165" className="text-sm font-bold fill-current text-blue-600 dark:text-blue-400">
          {angle3}°
        </text>
      )}
      {missingAngle === 'c' && (
        <text x="165" y="165" className="text-sm font-bold fill-current text-red-600 dark:text-red-400">
          ?
        </text>
      )}
      {missingAngle !== 'd' && angle4 !== null && (
        <text x="25" y="165" className="text-sm font-bold fill-current text-blue-600 dark:text-blue-400">
          {angle4}°
        </text>
      )}
      {missingAngle === 'd' && (
        <text x="25" y="165" className="text-sm font-bold fill-current text-red-600 dark:text-red-400">
          ?
        </text>
      )}
    </svg>
  )
}

// Right triangle component
const RightTriangleShape = ({ sideA, sideB, sideC, missingSide }: { sideA: number | null, sideB: number | null, sideC: number | null, missingSide: 'a' | 'b' | 'c' }) => {
  return (
    <svg width="200" height="180" viewBox="0 0 200 180" className="mx-auto">
      <polygon
        points="50,150 50,30 180,150"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        className="text-gray-800 dark:text-gray-200"
      />
      {/* Right angle marker */}
      <path
        d="M 50 150 L 50 140 L 60 140 L 60 150 Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="text-gray-800 dark:text-gray-200"
      />
      {/* Side labels */}
      {missingSide !== 'a' && sideA !== null && (
        <text x="25" y="95" className="text-sm font-bold fill-current text-blue-600 dark:text-blue-400">
          {sideA}
        </text>
      )}
      {missingSide === 'a' && (
        <text x="25" y="95" className="text-sm font-bold fill-current text-red-600 dark:text-red-400">
          ?
        </text>
      )}
      {missingSide !== 'b' && sideB !== null && (
        <text x="110" y="165" className="text-sm font-bold fill-current text-blue-600 dark:text-blue-400">
          {sideB}
        </text>
      )}
      {missingSide === 'b' && (
        <text x="110" y="165" className="text-sm font-bold fill-current text-red-600 dark:text-red-400">
          ?
        </text>
      )}
      {missingSide !== 'c' && sideC !== null && (
        <text x="100" y="80" className="text-sm font-bold fill-current text-blue-600 dark:text-blue-400">
          {sideC}
        </text>
      )}
      {missingSide === 'c' && (
        <text x="100" y="80" className="text-sm font-bold fill-current text-red-600 dark:text-red-400">
          ?
        </text>
      )}
    </svg>
  )
}

// Rectangle component
const RectangleShape = ({ width, height }: { width: number, height: number }) => {
  return (
    <svg width="200" height="180" viewBox="0 0 200 180" className="mx-auto">
      <rect
        x="30"
        y="30"
        width="140"
        height="120"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        className="text-gray-800 dark:text-gray-200"
      />
      <text x="100" y="25" className="text-sm font-bold fill-current text-blue-600 dark:text-blue-400 text-center">
        {width}
      </text>
      <text x="10" y="95" className="text-sm font-bold fill-current text-blue-600 dark:text-blue-400">
        {height}
      </text>
    </svg>
  )
}

// Triangle area component
const TriangleAreaShape = ({ base, height }: { base: number, height: number }) => {
  return (
    <svg width="200" height="180" viewBox="0 0 200 180" className="mx-auto">
      <polygon
        points="30,150 170,150 100,30"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        className="text-gray-800 dark:text-gray-200"
      />
      <line
        x1="100"
        y1="30"
        x2="100"
        y2="150"
        stroke="currentColor"
        strokeWidth="2"
        strokeDasharray="5,5"
        className="text-gray-500 dark:text-gray-400"
      />
      <text x="105" y="95" className="text-sm font-bold fill-current text-blue-600 dark:text-blue-400">
        {height}
      </text>
      <text x="100" y="170" className="text-sm font-bold fill-current text-blue-600 dark:text-blue-400 text-center">
        {base}
      </text>
    </svg>
  )
}

export default function Geometry() {
  const [scores, setScores] = useState<GeometryScore[]>([])
  const [loading, setLoading] = useState(true)
  const [gameState, setGameState] = useState<GameState>('idle')
  const [currentProblem, setCurrentProblem] = useState<Problem | null>(null)
  const [correctCount, setCorrectCount] = useState(0)
  const [currentProblemType, setCurrentProblemType] = useState<ProblemType | null>(null)
  const [showCorrectAnswer, setShowCorrectAnswer] = useState(false)
  const [questionStartTime, setQuestionStartTime] = useState(0)
  const [responseTimes, setResponseTimes] = useState<number[]>([])
  const { username } = useUser()
  const hasSubmittedScore = useRef(false)

  const loadScores = async () => {
    try {
      setLoading(true)
      const data = await getGeometryScores({ limit: 50 })
      setScores(data || [])
    } catch (error) {
      console.error('Error loading scores:', error)
      setScores([])
    } finally {
      setLoading(false)
    }
  }

  // Generate a random geometry problem
  const generateProblem = useCallback((): Problem => {
    const types: ProblemType[] = ['triangle_angles', 'quadrilateral_angles', 'pythagorean', 'area']
    const type = types[Math.floor(Math.random() * types.length)]
    
    switch (type) {
      case 'triangle_angles': {
        // Triangle angles sum to 180°
        const angle1 = Math.floor(Math.random() * 60) + 30 // 30-89
        const angle2 = Math.floor(Math.random() * 60) + 30 // 30-89
        const angle3 = 180 - angle1 - angle2 // Remaining angle
        const missingIndex = Math.floor(Math.random() * 3) // 0, 1, or 2
        const angles = [angle1, angle2, angle3]
        const answer = angles[missingIndex]
        
        // Generate wrong options
        const options = [answer]
        while (options.length < 4) {
          const wrong = Math.floor(Math.random() * 150) + 20 // 20-169
          if (!options.includes(wrong) && wrong !== 180 - angles[(missingIndex + 1) % 3] - angles[(missingIndex + 2) % 3]) {
            options.push(wrong)
          }
        }
        // Shuffle options
        for (let i = options.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [options[i], options[j]] = [options[j], options[i]]
        }
        
        const missingLabels = ['a', 'b', 'c'] as const
        const shape = (
          <TriangleShape
            angle1={missingIndex === 0 ? null : angle1}
            angle2={missingIndex === 1 ? null : angle2}
            angle3={missingIndex === 2 ? null : angle3}
            missingAngle={missingLabels[missingIndex]}
          />
        )
        
        return {
          type,
          question: `What is the measure of angle ${missingLabels[missingIndex].toUpperCase()}?`,
          shape,
          answer,
          options
        }
      }
      
      case 'quadrilateral_angles': {
        // Quadrilateral angles sum to 360°
        const angle1 = Math.floor(Math.random() * 80) + 50 // 50-129
        const angle2 = Math.floor(Math.random() * 80) + 50 // 50-129
        const angle3 = Math.floor(Math.random() * 80) + 50 // 50-129
        const angle4 = 360 - angle1 - angle2 - angle3 // Remaining angle
        const missingIndex = Math.floor(Math.random() * 4) // 0, 1, 2, or 3
        const angles = [angle1, angle2, angle3, angle4]
        const answer = angles[missingIndex]
        
        // Generate wrong options
        const options = [answer]
        while (options.length < 4) {
          const wrong = Math.floor(Math.random() * 250) + 50 // 50-299
          if (!options.includes(wrong)) {
            options.push(wrong)
          }
        }
        // Shuffle options
        for (let i = options.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [options[i], options[j]] = [options[j], options[i]]
        }
        
        const missingLabels = ['a', 'b', 'c', 'd'] as const
        const shape = (
          <QuadrilateralShape
            angle1={missingIndex === 0 ? null : angle1}
            angle2={missingIndex === 1 ? null : angle2}
            angle3={missingIndex === 2 ? null : angle3}
            angle4={missingIndex === 3 ? null : angle4}
            missingAngle={missingLabels[missingIndex]}
          />
        )
        
        return {
          type,
          question: `What is the measure of angle ${missingLabels[missingIndex].toUpperCase()}?`,
          shape,
          answer,
          options
        }
      }
      
      case 'pythagorean': {
        // Right triangle: a² + b² = c²
        // Use small Pythagorean triples: (3,4,5), (5,12,13), (6,8,10), (8,15,17)
        const triples = [
          [3, 4, 5],
          [5, 12, 13],
          [6, 8, 10],
          [8, 15, 17],
          [9, 12, 15]
        ]
        const triple = triples[Math.floor(Math.random() * triples.length)]
        const missingIndex = Math.floor(Math.random() * 3) // 0, 1, or 2
        const [a, b, c] = triple
        const sides = [a, b, c]
        const answer = sides[missingIndex]
        
        // Generate wrong options
        const options = [answer]
        while (options.length < 4) {
          const wrong = Math.floor(Math.random() * 15) + 1 // 1-15
          if (!options.includes(wrong)) {
            options.push(wrong)
          }
        }
        // Shuffle options
        for (let i = options.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [options[i], options[j]] = [options[j], options[i]]
        }
        
        const missingLabels = ['a', 'b', 'c'] as const
        const shape = (
          <RightTriangleShape
            sideA={missingIndex === 0 ? null : a}
            sideB={missingIndex === 1 ? null : b}
            sideC={missingIndex === 2 ? null : c}
            missingSide={missingLabels[missingIndex]}
          />
        )
        
        return {
          type,
          question: `What is the length of side ${missingLabels[missingIndex].toUpperCase()}?`,
          shape,
          answer,
          options
        }
      }
      
      case 'area': {
        // Area problems: rectangle or triangle
        const isRectangle = Math.random() > 0.5
        
        if (isRectangle) {
          const width = Math.floor(Math.random() * 8) + 3 // 3-10
          const height = Math.floor(Math.random() * 8) + 3 // 3-10
          const answer = width * height
          
          // Generate wrong options
          const options = [answer]
          while (options.length < 4) {
            const wrong = Math.floor(Math.random() * 80) + 10 // 10-89
            if (!options.includes(wrong)) {
              options.push(wrong)
            }
          }
          // Shuffle options
          for (let i = options.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [options[i], options[j]] = [options[j], options[i]]
          }
          
          const shape = <RectangleShape width={width} height={height} />
          
          return {
            type,
            question: `What is the area of this rectangle?`,
            shape,
            answer,
            options
          }
        } else {
          const base = Math.floor(Math.random() * 8) + 3 // 3-10
          const height = Math.floor(Math.random() * 8) + 3 // 3-10
          const answer = Math.floor((base * height) / 2)
          
          // Generate wrong options
          const options = [answer]
          while (options.length < 4) {
            const wrong = Math.floor(Math.random() * 40) + 5 // 5-44
            if (!options.includes(wrong)) {
              options.push(wrong)
            }
          }
          // Shuffle options
          for (let i = options.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [options[i], options[j]] = [options[j], options[i]]
          }
          
          const shape = <TriangleAreaShape base={base} height={height} />
          
          return {
            type,
            question: `What is the area of this triangle?`,
            shape,
            answer,
            options
          }
        }
      }
    }
  }, [])

  useEffect(() => {
    loadScores()
    
    // Set up realtime listener for geometry scores
    const channel = supabase
      .channel('geometry_scores_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'geometry_scores'
        },
        (payload) => {
          console.log('New geometry score:', payload.new)
          setScores(prev => [payload.new as GeometryScore, ...prev.slice(0, 49)])
        }
      )
      .subscribe()

    // Start game automatically
    const problem = generateProblem()
    setCurrentProblem(problem)
    setCurrentProblemType(problem.type)
    setGameState('playing')
    setQuestionStartTime(Date.now())

    return () => {
      supabase.removeChannel(channel)
    }
  }, [generateProblem])

  // Handle answer selection
  const handleAnswerSelect = useCallback((selectedAnswer: number) => {
    if (gameState !== 'playing' || !currentProblem) return
    
    const responseTime = Date.now() - questionStartTime
    
    if (selectedAnswer === currentProblem.answer) {
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
          
          submitGeometryScore({
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
        setQuestionStartTime(Date.now())
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
        
        submitGeometryScore({
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
  }, [gameState, currentProblem, correctCount, questionStartTime, responseTimes, username, generateProblem, loadScores])

  // Reset game
  const resetGame = useCallback(() => {
    setGameState('idle')
    setCurrentProblem(null)
    setCurrentProblemType(null)
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
    }, 100)
  }, [generateProblem])

  const formatScore = (score: GeometryScore) => {
    return `${formatNumber(score.correct_answers)} correct (${formatNumber(score.average_time)}ms avg)`
  }

  return (
    <GameWrapper
      gameType="Geometry"
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
              {/* Question */}
              <h3 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6 text-center">
                {currentProblem.question}
              </h3>
              
              {/* Shape */}
              <div className="mb-8 bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
                {currentProblem.shape}
              </div>
              
              {/* Multiple Choice Options */}
              <div className="grid grid-cols-2 gap-4 w-full max-w-md">
                {currentProblem.options.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => handleAnswerSelect(option)}
                    className="px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-lg transition-all duration-200 transform hover:scale-105 text-lg"
                  >
                    {option}
                  </button>
                ))}
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
                  <div className="mb-4">The correct answer is: <span className="font-bold text-green-600 dark:text-green-400">{currentProblem.answer}</span></div>
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
                    {currentProblem.shape}
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
