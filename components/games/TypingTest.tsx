'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { TypingTestIcon } from '../icons/GameIcons'
import { getTypingTestScores, submitTypingTestScore } from '@/lib/scores'
import { useUser } from '@/contexts/UserContext'
import { supabase } from '@/lib/supabase'
import GameWrapper from '../GameWrapper'
import type { TypingTestScore } from '@/lib/supabase'
import wordsData from '@/data/typing-words.json'
import { formatNumber } from '@/lib/levels'

type GameState = 'idle' | 'playing' | 'finished'

function generateWords(): string[] {
  const wordCount = 200 // Generate enough words
  const shuffled = [...wordsData.words].sort(() => Math.random() - 0.5)
  const selectedWords: string[] = []
  for (let i = 0; i < wordCount; i++) {
    selectedWords.push(shuffled[i % shuffled.length])
  }
  return selectedWords
}

export default function TypingTest() {
  const [scores, setScores] = useState<TypingTestScore[]>([])
  const [loading, setLoading] = useState(true)
  const [gameState, setGameState] = useState<GameState>('idle')
  // Games are client-only (ssr: false in GameRenderer), so shuffling here can't cause a hydration mismatch
  const [words, setWords] = useState<string[]>(generateWords)
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

  // State is only set in promise callbacks, so this is safe to call from an effect
  const fetchScores = useCallback(() => {
    return getTypingTestScores({ limit: 50 })
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
  }, [fetchScores])

  // Generate random word sequence
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
  }, [])

  // Keep typing input focused while the test is ready or in progress
  useEffect(() => {
    if (gameState === 'idle' || gameState === 'playing') {
      inputRef.current?.focus()
    }
  }, [gameState])

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
  }, [username, calculateStats, loadScores])

  // Submit score when game finishes
  useEffect(() => {
    if (gameState === 'finished' && !hasSubmittedScore.current) {
      submitScore()
    }
  }, [gameState, submitScore])


  // Auto-scroll to current word
  useEffect(() => {
    if (wordsContainerRef.current && gameState === 'playing') {
      wordsContainerRef.current.scrollTop = wordsContainerRef.current.scrollHeight
    }
  }, [currentWordIndex, gameState])

  const formatScore = (score: TypingTestScore) => {
    return `${formatNumber(score.wpm)} WPM (${formatNumber(score.accuracy)}%)`
  }

  const { wpm, accuracy, totalChars } = calculateStats()

  // Get word display with highlighting
  const getWordDisplay = (word: string, index: number) => {
    const isCurrent = index === currentWordIndex
    const isPast = index < currentWordIndex
    
    if (isCurrent) {
      // Current word with character-by-character feedback
      return word.split('').map((char, charIdx) => {
        let className = 'text-gray-900 dark:text-gray-100'
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
      fetchScores={getTypingTestScores}
      scoreTable="typing_test_scores"
      formatScore={formatScore}
      sortKey="wpm"
      sortDirection="desc"
    >
      <div className="w-full">
        {(gameState === 'idle' || gameState === 'playing') && (
          <div className="w-full">
            {/* Status row */}
            <div className="mb-4 flex items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 sm:gap-x-6">
                <div className="flex items-baseline gap-2">
                  <span className="eyebrow">Time</span>
                  <span className="num text-sm font-medium text-gray-900 dark:text-gray-100">{timeLeft}s</span>
                </div>
                <span className="text-gray-300 dark:text-gray-700" aria-hidden="true">·</span>
                <div className="flex items-baseline gap-2">
                  <span className="eyebrow">WPM</span>
                  <span className="num text-sm font-medium text-gray-900 dark:text-gray-100">{wpm}</span>
                </div>
                <span className="text-gray-300 dark:text-gray-700" aria-hidden="true">·</span>
                <div className="flex items-baseline gap-2">
                  <span className="eyebrow">Accuracy</span>
                  <span className="num text-sm font-medium text-gray-900 dark:text-gray-100">{accuracy.toFixed(1)}%</span>
                </div>
              </div>
              <button
                onClick={initializeGame}
                className="rounded-full p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100"
                title="Reset"
                aria-label="Reset"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                </svg>
              </button>
            </div>

            {/* Stage: words display */}
            <div
              ref={wordsContainerRef}
              onClick={() => inputRef.current?.focus()}
              className="mb-4 h-48 cursor-text overflow-y-auto rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900"
            >
              <div className="flex flex-wrap gap-2 font-mono text-xl leading-relaxed">
                {words.slice(0, currentWordIndex + 6).map((word, idx) => (
                  <span key={idx}>
                    {getWordDisplay(word, idx)}
                  </span>
                ))}
              </div>
            </div>

            {/* Input field */}
            <input
              ref={inputRef}
              type="text"
              value={currentInput}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              className="input py-3 font-mono text-xl"
              placeholder="Start typing..."
              autoComplete="off"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck="false"
            />
          </div>
        )}

        {gameState === 'finished' && (
          <div className="flex min-h-[420px] flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white p-6 text-center dark:border-gray-800 dark:bg-gray-900 sm:min-h-[480px]">
            <div className="flex w-full max-w-2xl flex-col items-center">
              <span className="eyebrow">Result</span>
              <div className="num mt-3 text-6xl font-bold tracking-tight text-gray-950 dark:text-white sm:text-7xl">
                {wpm}
                <span className="ml-2 text-2xl font-medium text-gray-500 dark:text-gray-400 sm:text-3xl">WPM</span>
              </div>
              <div className="mt-8 grid w-full grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="card p-4 text-left">
                  <div className="eyebrow">Accuracy</div>
                  <div className="num mt-2 text-lg font-semibold text-gray-950 dark:text-gray-50">{accuracy.toFixed(1)}%</div>
                </div>
                <div className="card p-4 text-left">
                  <div className="eyebrow">Characters</div>
                  <div className="num mt-2 text-lg font-semibold text-gray-950 dark:text-gray-50">{totalChars}</div>
                </div>
                <div className="card p-4 text-left">
                  <div className="eyebrow">Correct</div>
                  <div className="num mt-2 text-lg font-semibold text-gray-950 dark:text-gray-50">{correctChars}</div>
                </div>
                <div className="card p-4 text-left">
                  <div className="eyebrow">Incorrect</div>
                  <div className="num mt-2 text-lg font-semibold text-gray-950 dark:text-gray-50">{incorrectChars}</div>
                </div>
              </div>
              <button onClick={initializeGame} className="btn-ink mt-8">
                Try again
              </button>
            </div>
          </div>
        )}
      </div>
    </GameWrapper>
  )
}
