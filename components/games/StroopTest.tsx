'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { StroopTestIcon } from '../icons/GameIcons'
import { getStroopTestScores, submitStroopTestScore } from '@/lib/scores'
import { useUser } from '@/contexts/UserContext'
import { supabase } from '@/lib/supabase'
import GameWrapper from '../GameWrapper'
import type { StroopTestScore } from '@/lib/supabase'
import { formatNumber } from '@/lib/levels'

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
  const [elapsedTime, setElapsedTime] = useState(0)
  const gameStartTimeRef = useRef(0)
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const timerStartedRef = useRef(false)

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
    // Align Q1 response clock with display timer (exclude idle before first click)
    questionStartTime.current = now
    setElapsedTime(0)
    timerIntervalRef.current = setInterval(() => {
      setElapsedTime(Date.now() - gameStartTimeRef.current)
    }, 1000)
  }, [])

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
      clearTimer()
      supabase.removeChannel(channel)
    }
  }, [clearTimer])

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
    clearTimer()
    timerStartedRef.current = false
    setElapsedTime(0)
    setGameState('playing')
    setCorrectAnswers(0)
    setResponseTimes([])
    hasSubmittedScore.current = false
    generateQuestion()
  }, [generateQuestion, clearTimer])

  // Initialize game on mount
  useEffect(() => {
    if (gameState === 'playing' && currentWord === '') {
      generateQuestion()
    }
  }, [gameState, currentWord, generateQuestion])

  // Handle color selection
  const handleColorSelect = useCallback((selectedColor: string) => {
    if (gameState !== 'playing') return

    ensureTimerStarted()
    
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
      const finalTime = timerStartedRef.current
        ? Date.now() - gameStartTimeRef.current
        : 0
      clearTimer()
      setElapsedTime(finalTime)
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
  }, [gameState, currentColor, currentWord, generateQuestion, clearTimer, ensureTimerStarted])

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
    return `${formatNumber(score.correct_answers)} correct (${formatNumber(score.average_time)}ms)`
  }

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000)
    return `${seconds}s`
  }

  const formatExactTime = (ms: number) => {
    return `${(ms / 1000).toFixed(3)}s`
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
      fetchScores={getStroopTestScores}
      scoreTable="stroop_test_scores"
      formatScore={formatScore}
      sortKey="correct_answers"
      sortDirection="desc"
    >
      <div className="w-full">
        <div className="mx-auto w-full max-w-2xl">
          {/* Status row */}
          <div className="mb-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 sm:gap-6">
              <div className="flex items-baseline gap-2">
                <span className="eyebrow">Correct</span>
                <span className="num text-sm font-medium text-gray-900 dark:text-gray-100">{correctAnswers}</span>
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

          {/* Game Area */}
          {(gameState === 'playing' || gameState === 'wrong') && (
            <div className="flex flex-col items-center">
              {/* Word Display */}
              <div className="mb-6 flex min-h-[200px] w-full select-none items-center justify-center rounded-2xl border border-gray-200 bg-white p-8 dark:border-gray-800 dark:bg-gray-900 sm:min-h-[240px]">
                <h2 
                  className={`text-6xl sm:text-8xl font-bold tracking-tight ${
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
                        aspect-square rounded-2xl font-mono text-xs font-semibold uppercase tracking-[0.14em] sm:text-sm transition-colors active:scale-[0.98] flex items-center justify-center
                        ${gameState === 'wrong' ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
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
                      `}
                    >
                      {color.name}
                    </button>
                  )
                })}
              </div>

              {/* Instruction */}
              {gameState === 'playing' && (
                <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
                  Click the color of the text (not the word)
                </p>
              )}
            </div>
          )}

          {gameState === 'finished' && (
            <div className="flex w-full flex-col items-center rounded-2xl border border-gray-200 bg-white p-6 text-center dark:border-gray-800 dark:bg-gray-900 sm:p-10">
              <span className="eyebrow">Result</span>
              <div className="num mt-3 text-6xl font-bold tracking-tight text-gray-950 dark:text-white sm:text-7xl">
                {correctAnswers}
              </div>
              <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">correct answers</div>
              <div className="mt-8 grid w-full max-w-md grid-cols-2 gap-3">
                <div className="card p-4 text-left">
                  <div className="eyebrow">Time</div>
                  <div className="num mt-2 text-lg font-semibold text-gray-950 dark:text-gray-50">
                    {formatExactTime(elapsedTime)}
                  </div>
                </div>
                <div className="card p-4 text-left">
                  <div className="eyebrow">Avg response</div>
                  <div className="num mt-2 text-lg font-semibold text-signal-600 dark:text-signal-400">
                    {averageTime} ms
                  </div>
                </div>
              </div>
              <button
                onClick={startNewGame}
                className="btn-ink mt-8"
              >
                Play again
              </button>
            </div>
          )}
        </div>
      </div>
    </GameWrapper>
  )
}
