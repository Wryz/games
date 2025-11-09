'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { getNumberMemoryScores, submitNumberMemoryScore } from '@/lib/scores'
import { useUser } from '@/contexts/UserContext'
import { supabase } from '@/lib/supabase'
import GameWrapper from '../GameWrapper'
import type { NumberMemoryScore } from '@/lib/supabase'

type GameState = 'idle' | 'showing' | 'input' | 'correct' | 'wrong' | 'finished'

export default function NumberMemory() {
  const [scores, setScores] = useState<NumberMemoryScore[]>([])
  const [loading, setLoading] = useState(true)
  const [gameState, setGameState] = useState<GameState>('idle')
  const [currentNumber, setCurrentNumber] = useState('')
  const [digitCount, setDigitCount] = useState(1)
  const [userInput, setUserInput] = useState('')
  const [longestSequence, setLongestSequence] = useState(0)
  const [message, setMessage] = useState('Click Start to begin')
  const { username } = useUser()
  const hasSubmittedScore = useRef(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const loadScores = async () => {
    try {
      setLoading(true)
      const data = await getNumberMemoryScores({ limit: 50 })
      setScores(data)
    } catch (error) {
      console.error('Error loading scores:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadScores()
    
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
  }, [])

  const formatScore = (score: NumberMemoryScore) => {
    return `${score.longest_sequence} digits`
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
    setMessage('Remember this number...')
    setUserInput('')
    
    // Show for 1 second per digit (minimum 2 seconds)
    const displayTime = Math.max(2000, digits * 1000)
    
    await new Promise(resolve => setTimeout(resolve, displayTime))
    
    setCurrentNumber('')
    setGameState('input')
    setMessage('What was the number?')
    
    // Focus input after a short delay
    setTimeout(() => inputRef.current?.focus(), 100)
    
    return number
  }, [generateNumber])

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
      setMessage('Correct!')
      
      const newLongest = Math.max(longestSequence, digitCount)
      setLongestSequence(newLongest)
      
      setTimeout(async () => {
        const nextDigits = digitCount + 1
        setDigitCount(nextDigits)
        const number = await showNumber(nextDigits)
        setCurrentNumber(number)
      }, 1000)
    } else {
      // Wrong!
      setGameState('wrong')
      setMessage(`Wrong! The number was ${currentNumber}`)
      
      setTimeout(() => {
        setGameState('finished')
        
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
      }, 2000)
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
    setMessage('Click Start to begin')
    hasSubmittedScore.current = false
  }, [])

  return (
    <GameWrapper
      gameType="Number Memory"
      scores={scores}
      loading={loading}
      onRefresh={loadScores}
      formatScore={formatScore}
      sortKey="longest_sequence"
      sortDirection="desc"
    >
      <div className="flex flex-col items-center justify-center min-h-[400px] sm:min-h-[600px] p-4 sm:p-8">
        {/* Stats and Reset */}
        <div className="flex justify-between items-center w-full max-w-md mb-8 text-sm sm:text-base">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{digitCount}</div>
            <div className="text-gray-600 dark:text-gray-400">Digits</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{longestSequence}</div>
            <div className="text-gray-600 dark:text-gray-400">Best</div>
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

        {/* Message */}
        <div className="mb-8 text-center min-h-[28px]">
          <p className={`text-lg font-semibold ${
            gameState === 'correct' ? 'text-green-600 dark:text-green-400' :
            gameState === 'wrong' ? 'text-red-600 dark:text-red-400' :
            'text-gray-700 dark:text-gray-300'
          }`}>
            {message}
          </p>
        </div>

        {/* Game Area */}
        <div className="w-full max-w-md mb-8">
          <div className="bg-white dark:bg-gray-700 rounded-lg shadow-2xl text-center h-[280px] flex items-center justify-center p-8">
            {gameState === 'idle' || gameState === 'finished' ? (
              <button
                onClick={startGame}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold shadow-lg transition-colors text-lg"
              >
                {gameState === 'finished' ? 'Play Again' : 'Start Game'}
              </button>
            ) : gameState === 'showing' ? (
              <div className="text-6xl font-bold text-gray-800 dark:text-gray-100 tracking-wider">
                {currentNumber}
              </div>
            ) : (
              <div className="w-full flex flex-col items-center justify-center gap-4">
                <input
                  ref={inputRef}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value.replace(/[^0-9]/g, ''))}
                  onKeyPress={handleKeyPress}
                  disabled={gameState !== 'input'}
                  placeholder="Type the number..."
                  className="w-full text-4xl text-center p-4 rounded-lg border-4 border-blue-500 dark:border-blue-400 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-600 disabled:opacity-50"
                />
                <button
                  onClick={handleSubmit}
                  disabled={gameState !== 'input' || !userInput.trim()}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-8 py-3 rounded-lg font-semibold shadow-lg transition-colors"
                >
                  Submit
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </GameWrapper>
  )
}
