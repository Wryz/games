'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { getNumberMemoryScores, submitNumberMemoryScore } from '@/lib/scores'
import { useUser } from '@/contexts/UserContext'
import { supabase } from '@/lib/supabase'
import GameWrapper from '../GameWrapper'
import type { NumberMemoryScore } from '@/lib/supabase'
import { formatNumber } from '@/lib/levels'

type GameState = 'idle' | 'showing' | 'input' | 'correct' | 'wrong' | 'finished'

export default function NumberMemory() {
  const [scores, setScores] = useState<NumberMemoryScore[]>([])
  const [loading, setLoading] = useState(true)
  const [gameState, setGameState] = useState<GameState>('idle')
  const [currentNumber, setCurrentNumber] = useState('')
  const [digitCount, setDigitCount] = useState(1)
  const [userInput, setUserInput] = useState('')
  const [longestSequence, setLongestSequence] = useState(0)
  const [showCorrectAnswer, setShowCorrectAnswer] = useState(false)
  const { username } = useUser()
  const hasSubmittedScore = useRef(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // State is only set in promise callbacks, so this is safe to call from an effect
  const fetchScores = useCallback(() => {
    return getNumberMemoryScores({ limit: 50 })
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

  useEffect(() => {
    fetchScores()
    
    // Set up realtime listener for number memory scores
    const channel = supabase
      .channel('number_memory_scores_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'number_memory_scores'
        },
        (payload) => {
          console.log('New number memory score:', payload.new)
          setScores(prev => [payload.new as NumberMemoryScore, ...prev.slice(0, 49)])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchScores])

  const formatScore = (score: NumberMemoryScore) => {
    return `${formatNumber(score.longest_sequence)} digits`
  }

  // Generate random number with specified digit count
  const generateNumber = useCallback((digits: number) => {
    let number = ''
    for (let i = 0; i < digits; i++) {
      // First digit shouldn't be 0
      if (i === 0) {
        number += Math.floor(Math.random() * 9) + 1
      } else {
        number += Math.floor(Math.random() * 10)
      }
    }
    return number
  }, [])

  // Show number for a duration
  const showNumber = useCallback(async (digits: number) => {
    const number = generateNumber(digits)
    setCurrentNumber(number)
    setGameState('showing')
    setUserInput('')
    
    // Show for 1 second per digit (minimum 2 seconds)
    const displayTime = Math.max(2000, digits * 1000)
    
    await new Promise(resolve => setTimeout(resolve, displayTime))
    
    setCurrentNumber('')
    setGameState('input')
    setUserInput('')
    // Focus immediately when input phase starts
    inputRef.current?.focus()
    
    return number
  }, [generateNumber])

  // Keep the input focused whenever the input phase is active (esp. on mobile)
  useEffect(() => {
    if (gameState === 'input') {
      inputRef.current?.focus()
    }
  }, [gameState])

  // Start new game
  const startGame = useCallback(async () => {
    setDigitCount(1)
    setLongestSequence(0)
    setUserInput('')
    hasSubmittedScore.current = false
    
    const number = await showNumber(1)
    setCurrentNumber(number)
  }, [showNumber])

  // Handle submit
  const handleSubmit = useCallback(async () => {
    if (gameState !== 'input' || !userInput.trim()) return
    
    if (userInput === currentNumber) {
      // Correct!
      setGameState('correct')
      
      const newLongest = Math.max(longestSequence, digitCount)
      setLongestSequence(newLongest)
      
      setTimeout(async () => {
        const nextDigits = digitCount + 1
        setDigitCount(nextDigits)
        const number = await showNumber(nextDigits)
        setCurrentNumber(number)
      }, 1000)
    } else {
      // Wrong! Show the correct answer
      setGameState('wrong')
      setShowCorrectAnswer(true)
      
      setTimeout(() => {
        setGameState('finished')
        setShowCorrectAnswer(false)
        
        // Submit score
        if (username && !hasSubmittedScore.current && longestSequence > 0) {
          hasSubmittedScore.current = true
          submitNumberMemoryScore({
            username,
            longest_sequence: longestSequence
          }).then(() => {
            setTimeout(() => loadScores(), 1000)
          }).catch(error => {
            console.error('Error submitting score:', error)
            hasSubmittedScore.current = false
          })
        }
      }, 3000) // Show correct answer for 3 seconds
    }
  }, [gameState, userInput, currentNumber, digitCount, longestSequence, username, showNumber, loadScores])

  // Handle key press
  const handleKeyPress = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSubmit()
    }
  }, [handleSubmit])

  // Reset game
  const resetGame = useCallback(() => {
    setGameState('idle')
    setCurrentNumber('')
    setDigitCount(1)
    setUserInput('')
    setLongestSequence(0)
    setShowCorrectAnswer(false)
    hasSubmittedScore.current = false
  }, [])

  return (
    <GameWrapper
      gameType="Number Memory"
      scores={scores}
      loading={loading}
      onRefresh={loadScores}
      fetchScores={getNumberMemoryScores}
      scoreTable="number_memory_scores"
      formatScore={formatScore}
      sortKey="longest_sequence"
      sortDirection="desc"
    >
      <div className="w-full">
        {/* Status row */}
        <div className="mb-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="flex items-baseline gap-2">
              <span className="eyebrow">Digits</span>
              <span className="num text-sm font-medium text-gray-900 dark:text-gray-100">{digitCount}</span>
            </div>
            <span className="text-gray-300 dark:text-gray-700" aria-hidden="true">·</span>
            <div className="flex items-baseline gap-2">
              <span className="eyebrow">Best</span>
              <span className="num text-sm font-medium text-gray-900 dark:text-gray-100">{longestSequence}</span>
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
        <div className="flex min-h-[420px] flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white p-6 text-center dark:border-gray-800 dark:bg-gray-900 sm:min-h-[480px]">
          {gameState === 'idle' ? (
            <div className="flex max-w-md flex-col items-center">
              <div className="num mb-6 text-6xl font-bold text-gray-300 dark:text-gray-700">?</div>
              <p className="mb-8 text-base text-gray-600 dark:text-gray-400">
                Memorise the number while it is shown, then type it back. Each round adds a digit.
              </p>
              <button onClick={startGame} className="btn-primary">
                Start
              </button>
            </div>
          ) : gameState === 'finished' ? (
            <div className="flex w-full max-w-2xl flex-col items-center">
              <span className="eyebrow">Result</span>
              <div className="num mt-3 text-6xl font-bold tracking-tight text-gray-950 dark:text-white sm:text-7xl">
                {longestSequence}
              </div>
              <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">digits remembered</div>
              <div className="mt-8 grid w-full max-w-xs grid-cols-1 gap-3">
                <div className="card p-4 text-left">
                  <div className="eyebrow">Missed at</div>
                  <div className="num mt-2 text-lg font-semibold text-gray-950 dark:text-gray-50">{digitCount} digits</div>
                </div>
              </div>
              <button onClick={startGame} className="btn-ink mt-8">
                Try again
              </button>
            </div>
          ) : gameState === 'showing' ? (
            <div className="num break-all text-5xl font-bold tracking-wider text-gray-950 dark:text-gray-50 sm:text-6xl">
              {currentNumber}
            </div>
          ) : gameState === 'wrong' && showCorrectAnswer ? (
            <div className="flex w-full flex-col items-center justify-center gap-6">
              <span className="eyebrow text-red-600! dark:text-red-400!">Wrong</span>
              <div className="flex flex-col items-center gap-2">
                <span className="eyebrow">Your answer</span>
                <span className="num break-all text-3xl font-bold text-red-600 dark:text-red-400 sm:text-4xl">{userInput}</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <span className="eyebrow">Correct answer</span>
                <span className="num break-all text-3xl font-bold text-green-600 dark:text-green-400 sm:text-4xl">{currentNumber}</span>
              </div>
            </div>
          ) : (
            <div className="flex w-full max-w-xl flex-col items-center justify-center gap-6">
              <input
                ref={inputRef}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value.replace(/[^0-9]/g, ''))}
                onKeyPress={handleKeyPress}
                disabled={gameState !== 'input'}
                placeholder="Type the number"
                className="input num py-4 text-center text-3xl sm:text-4xl disabled:opacity-50"
              />
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={handleSubmit}
                disabled={gameState !== 'input' || !userInput.trim()}
                className="btn-primary"
              >
                Submit
              </button>
            </div>
          )}
        </div>
      </div>
    </GameWrapper>
  )
}
