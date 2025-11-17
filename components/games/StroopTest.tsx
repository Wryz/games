'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { StroopTestIcon } from '../icons/GameIcons'
import { getStroopTestScores, submitStroopTestScore } from '@/lib/scores'
import { useUser } from '@/contexts/UserContext'
import { supabase } from '@/lib/supabase'
import GameWrapper from '../GameWrapper'
import type { StroopTestScore } from '@/lib/supabase'

type GameState = 'playing' | 'wrong' | 'finished'

// Colors ordered from coolest to warmest for easier selection
const COLORS = [
  { name: 'CYAN', value: 'cyan', cssColor: '#06b6d4' },      // Coolest
  { name: 'BLUE', value: 'blue', cssColor: '#2563eb' },     // Cool
  { name: 'PURPLE', value: 'purple', cssColor: '#9333ea' }, // Cool
  { name: 'GREEN', value: 'green', cssColor: '#16a34a' },    // Cool
  { name: 'YELLOW', value: 'yellow', cssColor: '#ca8a04' }, // Warm
  { name: 'PINK', value: 'pink', cssColor: '#db2777' },     // Warm
  { name: 'ORANGE', value: 'orange', cssColor: '#ea580c' }, // Warm
  { name: 'RED', value: 'red', cssColor: '#dc2626' },       // Warm
  { name: 'BROWN', value: 'brown', cssColor: '#78350f' },  // Warmest
]

export default function StroopTest() {
  const [scores, setScores] = useState<StroopTestScore[]>([])
  const [loading, setLoading] = useState(true)
  const [gameState, setGameState] = useState<GameState>('playing')
  const [correctAnswers, setCorrectAnswers] = useState(0)
  const [responseTimes, setResponseTimes] = useState<number[]>([])
  const [currentWord, setCurrentWord] = useState<string>('')
  const [currentColor, setCurrentColor] = useState<string>('')
  const [mistakeSelected, setMistakeSelected] = useState<string>('')
  const [mistakeWord, setMistakeWord] = useState<string>('')
  const [mistakeCorrectColor, setMistakeCorrectColor] = useState<string>('')
  const { username } = useUser()
  const hasSubmittedScore = useRef(false)
  const questionStartTime = useRef<number>(0)

  const loadScores = async () => {
    try {
      setLoading(true)
      const data = await getStroopTestScores({ limit: 50 })
      setScores(data)
    } catch (error) {
      console.error('Error loading scores:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadScores()
    
    // Set up realtime listener for stroop test scores
    const channel = supabase
      .channel('stroop_test_scores_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'stroop_test_scores'
        },
        (payload) => {
          console.log('New stroop test score:', payload.new)
          setScores(prev => [payload.new as StroopTestScore, ...prev.slice(0, 49)])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  // Generate a new question
  const generateQuestion = useCallback(() => {
    // Randomly select a word and a color (they might be different)
    const randomWord = COLORS[Math.floor(Math.random() * COLORS.length)]
    const randomColor = COLORS[Math.floor(Math.random() * COLORS.length)]
    
    setCurrentWord(randomWord.name)
    setCurrentColor(randomColor.value)
    questionStartTime.current = Date.now()
  }, [])

  // Start a new game
  const startNewGame = useCallback(() => {
    setGameState('playing')
    setCorrectAnswers(0)
    setResponseTimes([])
    hasSubmittedScore.current = false
    generateQuestion()
  }, [generateQuestion])

  // Initialize game on mount
  useEffect(() => {
    if (gameState === 'playing' && currentWord === '') {
      generateQuestion()
    }
  }, [gameState, currentWord, generateQuestion])

  // Handle color selection
  const handleColorSelect = useCallback((selectedColor: string) => {
    if (gameState !== 'playing') return
    
    const responseTime = Date.now() - questionStartTime.current
    const correct = selectedColor === currentColor
    
    if (correct) {
      // Correct answer - move immediately to next question
      setCorrectAnswers(prev => prev + 1)
      setResponseTimes(prev => [...prev, responseTime])
      
      // Next question immediately
      generateQuestion()
    } else {
      // Wrong answer - show mistake, then end game
      setResponseTimes(prev => [...prev, responseTime])
      setMistakeSelected(selectedColor)
      setMistakeWord(currentWord)
      setMistakeCorrectColor(currentColor)
      setGameState('wrong')
      
      // Show wrong state for 3 seconds before transitioning to finished
      setTimeout(() => {
        setGameState('finished')
      }, 3000)
    }
  }, [gameState, currentColor, currentWord, generateQuestion])

  // Submit score when game finishes
  useEffect(() => {
    if (gameState === 'finished' && responseTimes.length > 0 && username && !hasSubmittedScore.current) {
      hasSubmittedScore.current = true
      
      const averageTime = Math.round(
        responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
      )
      
      submitStroopTestScore({
        username,
        correct_answers: correctAnswers,
        average_time: averageTime
      }).then(() => {
        setTimeout(() => loadScores(), 1000)
      }).catch(error => {
        console.error('Error submitting score:', error)
        hasSubmittedScore.current = false
      })
    }
  }, [gameState, responseTimes, correctAnswers, username, loadScores])

  // Reset game
  const resetGame = useCallback(() => {
    setMistakeSelected('')
    setMistakeWord('')
    setMistakeCorrectColor('')
    startNewGame()
  }, [startNewGame])

  const formatScore = (score: StroopTestScore) => {
    return `${score.correct_answers} correct (${score.average_time}ms)`
  }

  // Calculate current stats
  const averageTime = responseTimes.length > 0 
    ? Math.round(responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length)
    : 0

  return (
    <GameWrapper
      gameType="Stroop Test"
      scores={scores}
      loading={loading}
      onRefresh={loadScores}
      formatScore={formatScore}
      sortKey="correct_answers"
      sortDirection="desc"
    >
      <div className="flex flex-col items-center justify-start min-h-[400px] sm:min-h-[600px] pt-8">
        <div className="w-full max-w-2xl">
          {/* Stats */}
          <div className="flex justify-between items-center mb-6 text-sm sm:text-base">
            <div className="text-gray-600 dark:text-gray-400">
              Correct: <span className="font-bold text-green-600 dark:text-green-400">{correctAnswers}</span>
            </div>
            {responseTimes.length > 0 && (
              <div className="text-gray-600 dark:text-gray-400">
                Avg Time: <span className="font-bold text-purple-600 dark:text-purple-400">{averageTime}ms</span>
              </div>
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
          {(gameState === 'playing' || gameState === 'wrong') && (
            <div className="flex flex-col items-center">
              {/* Word Display */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 mb-8 min-h-[200px] flex items-center justify-center w-full">
                <h2 
                  className={`text-6xl sm:text-8xl font-bold ${
                    gameState === 'wrong' ? 'opacity-60' : ''
                  }`}
                  style={{ color: COLORS.find(c => c.value === currentColor)?.cssColor || '#000' }}
                >
                  {currentWord}
        </h2>
              </div>

              {/* Color Buttons */}
              <div className="grid grid-cols-3 gap-3 sm:gap-4 w-full">
                {COLORS.map((color) => {
                  const isWrongSelection = gameState === 'wrong' && mistakeSelected === color.value
                  const isCorrectAnswer = gameState === 'wrong' && mistakeCorrectColor === color.value
                  
                  return (
                    <button
                      key={color.value}
                      onClick={() => handleColorSelect(color.value)}
                      disabled={gameState === 'wrong'}
                      className={`
                        aspect-square rounded-lg font-semibold text-sm sm:text-lg transition-all flex items-center justify-center
                        ${gameState === 'wrong' ? 'cursor-not-allowed opacity-50' : 'hover:scale-105 cursor-pointer'}
                        ${isCorrectAnswer 
                          ? 'bg-green-500 dark:bg-green-600' 
                          : isWrongSelection
                          ? 'bg-red-500 dark:bg-red-600 animate-shake'
                          : color.value === 'red' ? 'bg-red-400 dark:bg-red-500 text-red-900 dark:text-red-200 hover:bg-red-500 dark:hover:bg-red-400' :
                          color.value === 'blue' ? 'bg-blue-400 dark:bg-blue-500 text-blue-900 dark:text-blue-200 hover:bg-blue-500 dark:hover:bg-blue-400' :
                          color.value === 'green' ? 'bg-green-400 dark:bg-green-500 text-green-900 dark:text-green-200 hover:bg-green-500 dark:hover:bg-green-400' :
                          color.value === 'yellow' ? 'bg-yellow-400 dark:bg-yellow-500 text-yellow-900 dark:text-yellow-200 hover:bg-yellow-500 dark:hover:bg-yellow-400' :
                          color.value === 'orange' ? 'bg-orange-400 dark:bg-orange-500 text-orange-900 dark:text-orange-200 hover:bg-orange-500 dark:hover:bg-orange-400' :
                          color.value === 'purple' ? 'bg-purple-400 dark:bg-purple-500 text-purple-900 dark:text-purple-200 hover:bg-purple-500 dark:hover:bg-purple-400' :
                          color.value === 'pink' ? 'bg-pink-400 dark:bg-pink-500 text-pink-900 dark:text-pink-200 hover:bg-pink-500 dark:hover:bg-pink-400' :
                          color.value === 'cyan' ? 'bg-cyan-400 dark:bg-cyan-500 text-cyan-900 dark:text-cyan-200 hover:bg-cyan-500 dark:hover:bg-cyan-400' :
                          color.value === 'brown' ? 'bg-amber-600 dark:bg-amber-700 text-amber-50 dark:text-amber-100 hover:bg-amber-700 dark:hover:bg-amber-600' : ''
                        }
                        shadow-md
                      `}
                    >
                      {color.name}
                    </button>
                  )
                })}
              </div>

              {/* Instruction */}
              {gameState === 'playing' && (
                <p className="mt-6 text-sm text-gray-500 dark:text-gray-400 text-center">
                  Click the color of the text (not the word)
                </p>
              )}
            </div>
          )}

          {gameState === 'finished' && (
            <div className="text-center w-full max-w-2xl">
              <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-gray-700 dark:text-gray-100">
                {mistakeSelected ? 'Game Over!' : 'Test Complete!'}
              </h2>
              <div className="bg-white dark:bg-gray-700 p-6 sm:p-8 rounded-lg shadow-md mb-6">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-3xl sm:text-4xl font-bold text-green-600 dark:text-green-400">
                      {correctAnswers}
                    </div>
                    <div className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
                      Correct Answers
                    </div>
                  </div>
                  <div>
                    <div className="text-3xl sm:text-4xl font-bold text-purple-600 dark:text-purple-400">
                      {averageTime}ms
                    </div>
                    <div className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
                      Average Time
                    </div>
                  </div>
                </div>
              </div>
              <button
                onClick={startNewGame}
                className="w-full max-w-2xl bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold shadow-lg transition-colors"
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
