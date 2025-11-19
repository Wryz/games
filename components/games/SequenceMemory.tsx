'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { SequenceMemoryIcon } from '../icons/GameIcons'
import { getSequenceMemoryScores, submitSequenceMemoryScore } from '@/lib/scores'
import GameWrapper from '../GameWrapper'
import type { SequenceMemoryScore } from '@/lib/supabase'
import { useUser } from '@/contexts/UserContext'
import { supabase } from '@/lib/supabase'
import { formatNumber } from '@/lib/levels'

type GameState = 'idle' | 'showing' | 'playing' | 'correct' | 'wrong' | 'finished'

// Shape SVG components
const shapes = [
  {
    id: 'circle',
    name: 'Circle',
    svg: (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <circle cx="50" cy="50" r="40" fill="currentColor" />
      </svg>
    )
  },
  {
    id: 'square',
    name: 'Square',
    svg: (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <rect x="10" y="10" width="80" height="80" fill="currentColor" />
      </svg>
    )
  },
  {
    id: 'triangle',
    name: 'Triangle',
    svg: (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <polygon points="50,15 90,85 10,85" fill="currentColor" />
      </svg>
    )
  },
  {
    id: 'star',
    name: 'Star',
    svg: (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <polygon points="50,10 61,40 92,40 67,60 78,90 50,70 22,90 33,60 8,40 39,40" fill="currentColor" />
      </svg>
    )
  },
  {
    id: 'pentagon',
    name: 'Pentagon',
    svg: (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <polygon points="50,10 90,40 75,85 25,85 10,40" fill="currentColor" />
      </svg>
    )
  },
  {
    id: 'hexagon',
    name: 'Hexagon',
    svg: (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <polygon points="50,10 85,30 85,70 50,90 15,70 15,30" fill="currentColor" />
      </svg>
    )
  },
  {
    id: 'diamond',
    name: 'Diamond',
    svg: (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <polygon points="50,10 90,50 50,90 10,50" fill="currentColor" />
      </svg>
    )
  },
  {
    id: 'heart',
    name: 'Heart',
    svg: (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <path d="M50,85 C50,85 15,60 15,40 C15,25 25,15 35,15 C42,15 47,20 50,25 C53,20 58,15 65,15 C75,15 85,25 85,40 C85,60 50,85 50,85 Z" fill="currentColor" />
      </svg>
    )
  },
  {
    id: 'octagon',
    name: 'Octagon',
    svg: (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <polygon points="30,10 70,10 90,30 90,70 70,90 30,90 10,70 10,30" fill="currentColor" />
      </svg>
    )
  }
]

export default function SequenceMemory() {
  const [scores, setScores] = useState<SequenceMemoryScore[]>([])
  const [loading, setLoading] = useState(true)
  const [gameState, setGameState] = useState<GameState>('idle')
  const [sequence, setSequence] = useState<string[]>([])
  const [playerSequence, setPlayerSequence] = useState<string[]>([])
  const [level, setLevel] = useState(1)
  const [currentShapeIndex, setCurrentShapeIndex] = useState<number>(-1)
  const [totalCorrectShapes, setTotalCorrectShapes] = useState(0)
  const [feedbackShape, setFeedbackShape] = useState<string | null>(null)
  const [feedbackType, setFeedbackType] = useState<'correct' | 'wrong' | null>(null)
  const [finalResults, setFinalResults] = useState<{ level: number; longestSequence: number } | null>(null)
  const { username } = useUser()
  const hasSubmittedScore = useRef(false)
  const feedbackTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const loadScores = async () => {
    try {
      setLoading(true)
      const data = await getSequenceMemoryScores({ limit: 50 })
      setScores(data)
    } catch (error) {
      console.error('Error loading scores:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadScores()

    // Set up realtime listener
    const channel = supabase
      .channel('sequence_memory_scores_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'sequence_memory_scores'
        },
        (payload) => {
          console.log('New sequence memory score:', payload.new)
          setScores(prev => [payload.new as SequenceMemoryScore, ...prev.slice(0, 49)])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
      if (feedbackTimeoutRef.current) {
        clearTimeout(feedbackTimeoutRef.current)
      }
    }
  }, [])

  const formatScore = (score: SequenceMemoryScore) => {
    return `Level ${formatNumber(score.level_reached)} (${formatNumber(score.longest_sequence)} shapes)`
  }

  // Generate new sequence
  const generateSequence = useCallback(() => {
    const randomShape = shapes[Math.floor(Math.random() * shapes.length)].id
    const newSequence = [...sequence, randomShape]
    setSequence(newSequence)
    return newSequence
  }, [sequence])

  // Play sequence animation
  const playSequence = useCallback(async (seq: string[]) => {
    setGameState('showing')
    setPlayerSequence([])
    setCurrentShapeIndex(-1)

    // Wait before starting
    await new Promise(resolve => setTimeout(resolve, 800))

    for (let i = 0; i < seq.length; i++) {
      const shapeIndex = shapes.findIndex(s => s.id === seq[i])
      setCurrentShapeIndex(shapeIndex)

      // Show shape for 1500ms (longer for better visibility)
      await new Promise(resolve => setTimeout(resolve, 1500))

      // No pause - shapes appear/disappear instantly
      if (i < seq.length - 1) {
      setCurrentShapeIndex(-1)
        // Brief pause between shapes (200ms)
        await new Promise(resolve => setTimeout(resolve, 200))
    }
    }

    // Clear the shape at the end
    setCurrentShapeIndex(-1)
    await new Promise(resolve => setTimeout(resolve, 200))

    setGameState('playing')
  }, [])

  // Start new game
  const startGame = useCallback(() => {
    setLevel(1)
    setSequence([])
    setPlayerSequence([])
    setTotalCorrectShapes(0)
    setFeedbackShape(null)
    setFeedbackType(null)
    setFinalResults(null)
    hasSubmittedScore.current = false
    if (feedbackTimeoutRef.current) {
      clearTimeout(feedbackTimeoutRef.current)
    }

    // Generate and play first sequence (start with 3 shapes)
    const firstSequence = []
    for (let i = 0; i < 3; i++) {
      firstSequence.push(shapes[Math.floor(Math.random() * shapes.length)].id)
    }
    setSequence(firstSequence)
    playSequence(firstSequence)
  }, [playSequence])

  // Handle shape click
  const handleShapeClick = useCallback((shapeId: string) => {
    if (gameState !== 'playing') return

    const newPlayerSequence = [...playerSequence, shapeId]
    setPlayerSequence(newPlayerSequence)

    // Check if this click is correct
    const isCorrect = newPlayerSequence[newPlayerSequence.length - 1] === sequence[newPlayerSequence.length - 1]

    // Show feedback
    setFeedbackShape(shapeId)
    setFeedbackType(isCorrect ? 'correct' : 'wrong')
    
    // Clear feedback after animation
    if (feedbackTimeoutRef.current) {
      clearTimeout(feedbackTimeoutRef.current)
    }
    feedbackTimeoutRef.current = setTimeout(() => {
      setFeedbackShape(null)
      setFeedbackType(null)
    }, 500)

    if (!isCorrect) {
      // Wrong!
      setGameState('wrong')

      // Calculate total correct shapes (previous correct + correct in this round before the mistake)
      const correctInThisRound = newPlayerSequence.length - 1 // Minus the wrong one
      const finalTotal = totalCorrectShapes + correctInThisRound

      console.log('Game ended - Wrong answer', {
        username,
        level,
        totalCorrectShapes,
        correctInThisRound,
        finalTotal,
        hasSubmitted: hasSubmittedScore.current
      })

      setTimeout(() => {
        // Set final results and show results screen
        setFinalResults({
          level,
          longestSequence: Math.max(0, finalTotal)
        })
        setGameState('finished')
        
        // Submit score - always submit if user has a username and played the game
        if (username && !hasSubmittedScore.current) {
          console.log('Attempting to submit score:', { username, level, finalTotal })
          hasSubmittedScore.current = true
          submitSequenceMemoryScore({
            username,
            level_reached: level,
            longest_sequence: Math.max(0, finalTotal) // Ensure non-negative
          }).then((data) => {
            console.log('Score submitted successfully:', data)
            setTimeout(() => loadScores(), 1000)
          }).catch(error => {
            console.error('Error submitting score:', error)
            hasSubmittedScore.current = false
          })
        } else {
          console.log('Score submission skipped:', {
            hasUsername: !!username,
            hasSubmitted: hasSubmittedScore.current,
            finalTotal
          })
        }
      }, 1500)
    } else if (newPlayerSequence.length === sequence.length) {
      // Completed the sequence correctly!
      setGameState('correct')
      
      // Add this sequence length to total correct shapes
      setTotalCorrectShapes(prev => prev + sequence.length)

      setTimeout(() => {
        setFeedbackShape(null)
        setFeedbackType(null)
        const nextLevel = level + 1
        setLevel(nextLevel)
        const nextSequence = generateSequence()
        playSequence(nextSequence)
      }, 1000)
    }
  }, [gameState, playerSequence, sequence, level, username, totalCorrectShapes, generateSequence, playSequence, loadScores])

  // Reset game
  const resetGame = useCallback(() => {
    setGameState('idle')
    setSequence([])
    setPlayerSequence([])
    setLevel(1)
    setCurrentShapeIndex(-1)
    setTotalCorrectShapes(0)
    setFeedbackShape(null)
    setFeedbackType(null)
    setFinalResults(null)
    hasSubmittedScore.current = false
    if (feedbackTimeoutRef.current) {
      clearTimeout(feedbackTimeoutRef.current)
    }
  }, [])

  return (
    <GameWrapper
      gameType="Sequence Memory"
      scores={scores}
      loading={loading}
      onRefresh={loadScores}
      formatScore={formatScore}
      sortKey="level_reached"
      sortDirection="desc"
    >
      <div className="flex flex-col items-center justify-start min-h-[400px] sm:min-h-[600px] sm:p-8 pt-8">
        {gameState === 'finished' && finalResults ? (
          /* Results Screen */
          <div className="text-center w-full max-w-4xl">
            <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-gray-700 dark:text-gray-100">
              Game Over!
            </h2>
            <div className="bg-white dark:bg-gray-700 p-6 sm:p-8 rounded-lg shadow-md mb-6">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-3xl sm:text-4xl font-bold text-blue-600 dark:text-blue-400">
                    {finalResults.level}
                  </div>
                  <div className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
                    Level Reached
                  </div>
                </div>
                <div>
                  <div className="text-3xl sm:text-4xl font-bold text-green-600 dark:text-green-400">
                    {finalResults.longestSequence}
                  </div>
                  <div className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
                    Shapes Remembered
                  </div>
                </div>
              </div>
            </div>
            <button
              onClick={startGame}
              className="w-full max-w-4xl bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold shadow-lg transition-colors"
            >
              Play Again
            </button>
          </div>
        ) : (
          <>
            {/* Stats and Reset */}
            <div className="flex justify-between items-center w-full max-w-4xl mb-6 text-sm sm:text-base">
              <div className="text-gray-600 dark:text-gray-400">
                Level: <span className="font-bold text-blue-600 dark:text-blue-400">{level}</span>
              </div>
              <div className="text-gray-600 dark:text-gray-400">
                Length: <span className="font-bold text-green-600 dark:text-green-400">{sequence.length}</span>
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

            {/* Main Game Area - Two column on desktop, stacked on mobile */}
        <div className="w-full max-w-4xl mb-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 sm:gap-3 md:gap-4">
            
            {/* Left/Top: Shape Display Area */}
            <div className="flex flex-col items-center justify-center">
              <div className="w-full aspect-square bg-white dark:bg-gray-700 rounded-lg shadow-sm flex items-center justify-center p-8 lg:p-12">
                {gameState === 'showing' && currentShapeIndex >= 0 ? (
                  <div className="w-full h-full text-blue-600 dark:text-blue-400">
                    {shapes[currentShapeIndex].svg}
                  </div>
                ) : playerSequence.length > 0 && (gameState === 'playing' || gameState === 'correct') ? (
                  <div className="w-full h-full text-green-600 dark:text-green-400">
                    {shapes.find(s => s.id === playerSequence[playerSequence.length - 1])?.svg}
                  </div>
                ) : playerSequence.length > 0 && gameState === 'wrong' ? (
                  <div className="w-full h-full text-red-600 dark:text-red-400">
                    {shapes.find(s => s.id === playerSequence[playerSequence.length - 1])?.svg}
                  </div>
                ) : (
                  <div className="text-6xl text-gray-400 dark:text-gray-500">?</div>
                )}
              </div>
            </div>

            {/* Right/Bottom: Shape Selection Grid */}
            <div className="flex flex-col items-center justify-center">
              <div className="w-full aspect-square">
                <div className="grid grid-cols-3 gap-2 sm:gap-3 md:gap-4 w-full h-full">
                  {shapes.map((shape) => {
                    const showFeedback = feedbackShape === shape.id
                    const isCorrect = feedbackType === 'correct' && showFeedback
                    const isWrong = feedbackType === 'wrong' && showFeedback
                    
                    return (
                      <button
                        key={shape.id}
                        onClick={() => handleShapeClick(shape.id)}
                        disabled={gameState !== 'playing'}
                        className={`aspect-square rounded-lg shadow-lg transition-all duration-200 flex items-center justify-center sm:p-5 ${
                          isCorrect
                            ? 'bg-green-500 dark:bg-green-600 animate-none'
                            : isWrong
                            ? 'bg-red-500 dark:bg-red-600 animate-shake'
                            : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                        } ${
                          gameState === 'playing' 
                            ? 'hover:shadow-xl hover:scale-105 active:scale-95 cursor-pointer' 
                            : 'opacity-50 cursor-not-allowed'
                        }`}
                        title={shape.name}
                      >
                        {shape.svg}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

          </div>
        </div>

            {/* Start Button */}
            {gameState === 'idle' && (
              <button
                onClick={startGame}
                className="w-full max-w-4xl bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold shadow-lg transition-colors"
              >
                Start Game
              </button>
            )}
          </>
        )}
      </div>
    </GameWrapper>
  )
}
