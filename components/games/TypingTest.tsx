'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { TypingTestIcon } from '../icons/GameIcons'
import { getTypingTestScores, submitTypingTestScore } from '@/lib/scores'
import { useUser } from '@/contexts/UserContext'
import { supabase } from '@/lib/supabase'
import GameWrapper from '../GameWrapper'
import type { TypingTestScore } from '@/lib/supabase'
import wordsData from '@/data/typing-words.json'

type GameState = 'idle' | 'playing' | 'finished'

export default function TypingTest() {
  const [scores, setScores] = useState<TypingTestScore[]>([])
  const [loading, setLoading] = useState(true)
  const [gameState, setGameState] = useState<GameState>('idle')
  const [words, setWords] = useState<string[]>([])
  const [currentWordIndex, setCurrentWordIndex] = useState(0)
  const [currentInput, setCurrentInput] = useState('')
  const [correctChars, setCorrectChars] = useState(0)
  const [incorrectChars, setIncorrectChars] = useState(0)
  const [startTime, setStartTime] = useState(0)
  const [timeLeft, setTimeLeft] = useState(60) // 60 seconds
  const [completedWords, setCompletedWords] = useState<string[]>([])
  const { username } = useUser()
  const hasSubmittedScore = useRef(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const wordsContainerRef = useRef<HTMLDivElement>(null)

  const TEST_DURATION = 60 // seconds

  const loadScores = async () => {
    try {
      setLoading(true)
      const data = await getTypingTestScores({ limit: 50 })
      setScores(data)
    } catch (error) {
      console.error('Error loading scores:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadScores()
    
    // Set up realtime listener for typing test scores
    const channel = supabase
      .channel('typing_test_scores_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'typing_test_scores'
        },
        (payload) => {
          console.log('New typing test score:', payload.new)
          setScores(prev => [payload.new as TypingTestScore, ...prev.slice(0, 49)])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  // Generate random word sequence
  const generateWords = useCallback(() => {
    const wordCount = 200 // Generate enough words
    const shuffled = [...wordsData.words].sort(() => Math.random() - 0.5)
    const selectedWords: string[] = []
    for (let i = 0; i < wordCount; i++) {
      selectedWords.push(shuffled[i % shuffled.length])
    }
    return selectedWords
  }, [])

  // Initialize game
  const initializeGame = useCallback(() => {
    setGameState('idle')
    setWords(generateWords())
    setCurrentWordIndex(0)
    setCurrentInput('')
    setCorrectChars(0)
    setIncorrectChars(0)
    setTimeLeft(TEST_DURATION)
    setCompletedWords([])
    setStartTime(0)
    hasSubmittedScore.current = false
    // Focus input after state is set
    setTimeout(() => inputRef.current?.focus(), 100)
  }, [generateWords])

  // Timer effect
  useEffect(() => {
    if (gameState !== 'playing') return

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setGameState('finished')
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [gameState])

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    
    // Don't allow spaces at the beginning
    if (value.startsWith(' ')) return
    
    // Start the game on first input if in idle state
    if (gameState === 'idle' && value.length > 0) {
      setGameState('playing')
      setStartTime(Date.now())
    }
    
    if (gameState !== 'playing' && gameState !== 'idle') return
    
    setCurrentInput(value)
  }

  // Handle space key (word completion)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (gameState !== 'playing') return
    
    if (e.key === ' ') {
      e.preventDefault()
      const currentWord = words[currentWordIndex]
      
      // Calculate accuracy for this word
      const typedWord = currentInput.trim()
      if (typedWord) {
        // Count correct and incorrect characters
        const minLength = Math.min(typedWord.length, currentWord.length)
        for (let i = 0; i < minLength; i++) {
          if (typedWord[i] === currentWord[i]) {
            setCorrectChars(prev => prev + 1)
          } else {
            setIncorrectChars(prev => prev + 1)
          }
        }
        
        // Add extra characters as incorrect
        if (typedWord.length > currentWord.length) {
          setIncorrectChars(prev => prev + (typedWord.length - currentWord.length))
        } else if (currentWord.length > typedWord.length) {
          setIncorrectChars(prev => prev + (currentWord.length - typedWord.length))
        }
        
        // Add space to character count
        setCorrectChars(prev => prev + 1)
        
        setCompletedWords(prev => [...prev, typedWord])
        setCurrentWordIndex(prev => prev + 1)
        setCurrentInput('')
      }
    }
  }

  // Calculate WPM and accuracy
  const calculateStats = useCallback(() => {
    const totalChars = correctChars + incorrectChars
    const accuracy = totalChars > 0 ? (correctChars / totalChars) * 100 : 0
    
    // Calculate WPM (words per minute)
    // Standard: 1 word = 5 characters
    const timeElapsed = (TEST_DURATION - timeLeft) / 60 // in minutes
    const wpm = timeElapsed > 0 ? Math.round((correctChars / 5) / timeElapsed) : 0
    
    return { wpm, accuracy: Number(accuracy.toFixed(2)), totalChars }
  }, [correctChars, incorrectChars, timeLeft])

  // Submit score
  const submitScore = useCallback(async () => {
    if (!username || hasSubmittedScore.current) return

    hasSubmittedScore.current = true
    const { wpm, accuracy, totalChars } = calculateStats()
    
    // Ensure we have valid stats before submitting
    if (totalChars === 0) return

    try {
      await submitTypingTestScore({
        username,
        wpm,
        accuracy,
        characters_typed: totalChars,
        time_taken: TEST_DURATION
      })
      // Reload scores after submission to ensure leaderboard updates
      setTimeout(() => loadScores(), 1000)
    } catch (error) {
      console.error('Error submitting score:', error)
      hasSubmittedScore.current = false
    }
  }, [username, calculateStats])

  // Submit score when game finishes
  useEffect(() => {
    if (gameState === 'finished' && !hasSubmittedScore.current) {
      submitScore()
    }
  }, [gameState, submitScore])

  // Initialize on mount
  useEffect(() => {
    initializeGame()
  }, [initializeGame])

  // Auto-scroll to current word
  useEffect(() => {
    if (wordsContainerRef.current && gameState === 'playing') {
      wordsContainerRef.current.scrollTop = wordsContainerRef.current.scrollHeight
    }
  }, [currentWordIndex, gameState])

  const formatScore = (score: TypingTestScore) => {
    return `${score.wpm} WPM (${score.accuracy}%)`
  }

  const { wpm, accuracy, totalChars } = calculateStats()

  // Get word display with highlighting
  const getWordDisplay = (word: string, index: number) => {
    const isCurrent = index === currentWordIndex
    const isPast = index < currentWordIndex
    
    if (isCurrent) {
      // Current word with character-by-character feedback
      return word.split('').map((char, charIdx) => {
        let className = 'text-gray-700 dark:text-gray-100'
        if (charIdx < currentInput.length) {
          if (currentInput[charIdx] === char) {
            className = 'text-green-600 dark:text-green-400'
          } else {
            className = 'text-red-600 dark:text-red-400'
          }
        }
        return (
          <span key={charIdx} className={className}>
            {char}
          </span>
        )
      })
    } else if (isPast) {
      // Past words - dimmed
      return <span className="text-gray-300 dark:text-gray-600">{word}</span>
    } else {
      // Future words - normal
      return <span className="text-gray-400 dark:text-gray-500">{word}</span>
    }
  }

  return (
    <GameWrapper
      gameType="Typing Test"
      scores={scores}
      loading={loading}
      onRefresh={loadScores}
      formatScore={formatScore}
      sortKey="wpm"
      sortDirection="desc"
    >
      <div className="flex flex-col items-center justify-start min-h-[400px] sm:min-h-[600px] pt-8">
        {(gameState === 'idle' || gameState === 'playing') && (
          <div className="w-full">
            {/* Timer and Stats */}
            <div className="flex justify-between items-center mb-6 text-sm sm:text-base">
              <div className="text-gray-600 dark:text-gray-400">
                Time: <span className="font-bold text-blue-600 dark:text-blue-400">{timeLeft}s</span>
              </div>
              <div className="text-gray-600 dark:text-gray-400">
                WPM: <span className="font-bold text-green-600 dark:text-green-400">{wpm}</span>
              </div>
              <div className="text-gray-600 dark:text-gray-400">
                Accuracy: <span className="font-bold text-purple-600 dark:text-purple-400">{accuracy.toFixed(1)}%</span>
              </div>
              <button
                onClick={initializeGame}
                className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                title="Reset"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                </svg>
              </button>
            </div>

            {/* Words Display - Fixed Layout */}
            <div ref={wordsContainerRef} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg mb-4 h-48 overflow-y-auto">
              <div className="text-xl font-mono leading-relaxed flex flex-wrap gap-2">
                {words.slice(0, currentWordIndex + 6).map((word, idx) => (
                  <span key={idx}>
                    {getWordDisplay(word, idx)}
                  </span>
                ))}
              </div>
            </div>

            {/* Input Field */}
            <input
              ref={inputRef}
              type="text"
              value={currentInput}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              className="w-full px-4 py-3 text-xl border-2 border-blue-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white font-mono"
              placeholder="Start typing..."
              autoComplete="off"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck="false"
            />
          </div>
        )}

        {gameState === 'finished' && (
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4 text-gray-700 dark:text-gray-100">
              Test Complete!
        </h2>
            <div className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow-sm mb-6 max-w-md mx-auto">
              <div className="grid grid-cols-2 gap-4 text-center mb-4">
                <div>
                  <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                    {wpm}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">WPM</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                    {accuracy.toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Accuracy</div>
                </div>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <div>Characters Typed: {totalChars}</div>
                <div>Correct: {correctChars}</div>
                <div>Incorrect: {incorrectChars}</div>
              </div>
            </div>
            <button
              onClick={initializeGame}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              Try Again
            </button>
        </div>
        )}
      </div>
    </GameWrapper>
  )
}
