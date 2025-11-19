'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { getMemoryScores, submitMemoryScore } from '@/lib/scores'
import { useUser } from '@/contexts/UserContext'
import { supabase } from '@/lib/supabase'
import GameWrapper from '../GameWrapper'
import type { MemoryScore } from '@/lib/supabase'
import { formatNumber } from '@/lib/levels'

type GameState = 'idle' | 'showing' | 'waiting' | 'playing' | 'correct' | 'wrong' | 'finished'

const COLORS = [
  { id: 0, bg: 'bg-red-500', active: 'bg-red-300', border: 'border-red-600' },
  { id: 1, bg: 'bg-blue-500', active: 'bg-blue-300', border: 'border-blue-600' },
  { id: 2, bg: 'bg-green-500', active: 'bg-green-300', border: 'border-green-600' },
  { id: 3, bg: 'bg-yellow-500', active: 'bg-yellow-300', border: 'border-yellow-600' },
]

export default function MemoryGame() {
  const [scores, setScores] = useState<MemoryScore[]>([])
  const [loading, setLoading] = useState(true)
  const [gameState, setGameState] = useState<GameState>('idle')
  const [sequence, setSequence] = useState<number[]>([])
  const [playerSequence, setPlayerSequence] = useState<number[]>([])
  const [level, setLevel] = useState(1)
  const [correctSequences, setCorrectSequences] = useState(0)
  const [totalSequences, setTotalSequences] = useState(0)
  const [correctClicks, setCorrectClicks] = useState(0)
  const [activeSquare, setActiveSquare] = useState<number | null>(null)
  const [showCorrectSequence, setShowCorrectSequence] = useState(false)
  const [wrongSquareId, setWrongSquareId] = useState<number | null>(null)
  const { username } = useUser()
  const hasSubmittedScore = useRef(false)
  const isPlayingSequence = useRef(false)

  const loadScores = async () => {
    try {
      setLoading(true)
      const data = await getMemoryScores({ limit: 50 })
      setScores(data)
    } catch (error) {
      console.error('Error loading scores:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadScores()
    
    // Set up realtime listener for memory scores
    const channel = supabase
      .channel('memory_scores_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'memory_scores'
        },
        (payload) => {
          console.log('New memory score:', payload.new)
          setScores(prev => [payload.new as MemoryScore, ...prev.slice(0, 49)])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const formatScore = (score: MemoryScore) => {
    return `Level ${formatNumber(score.level_reached)} (${formatNumber(score.correct_sequences)} correct)`
  }

  // Generate new sequence
  const generateSequence = useCallback(() => {
    const newSequence = [...sequence, Math.floor(Math.random() * 4)]
    setSequence(newSequence)
    return newSequence
  }, [sequence])

  // Play sequence animation
  const playSequence = useCallback(async (seq: number[]) => {
    if (isPlayingSequence.current) return
    isPlayingSequence.current = true
    
    setGameState('showing')
    setPlayerSequence([])
    
    // Wait a bit before starting
    await new Promise(resolve => setTimeout(resolve, 800))
    
    for (let i = 0; i < seq.length; i++) {
      const colorId = seq[i]
      setActiveSquare(colorId)
      
      // Show the square for 300ms (faster)
      await new Promise(resolve => setTimeout(resolve, 300))
      
      setActiveSquare(null)
      
      // Pause between squares (150ms, faster)
      await new Promise(resolve => setTimeout(resolve, 150))
    }
    
    setGameState('playing')
    isPlayingSequence.current = false
  }, [])

  // Start new game
  const startGame = useCallback(() => {
    setLevel(1)
    setCorrectSequences(0)
    setTotalSequences(0)
    setCorrectClicks(0)
    setSequence([])
    setPlayerSequence([])
    hasSubmittedScore.current = false
    
    // Generate and play first sequence
    const firstSequence = [Math.floor(Math.random() * 4)]
    setSequence(firstSequence)
    playSequence(firstSequence)
  }, [playSequence])

  // Handle player click
  const handleSquareClick = useCallback((colorId: number) => {
    if (gameState !== 'playing' || isPlayingSequence.current) return
    
    const newPlayerSequence = [...playerSequence, colorId]
    setPlayerSequence(newPlayerSequence)
    
    // Flash the square
    setActiveSquare(colorId)
    setTimeout(() => setActiveSquare(null), 200)
    
    // Check if the sequence matches so far
    const isCorrectSoFar = newPlayerSequence.every((val, idx) => val === sequence[idx])
    
    if (!isCorrectSoFar) {
      // Wrong sequence - mark the wrong square and show the correct sequence
      setGameState('wrong')
      setTotalSequences(prev => prev + 1)
      setWrongSquareId(colorId) // Mark which square was wrong
      
      // Show feedback for wrong click briefly
      setTimeout(async () => {
        setShowCorrectSequence(true)
        // Show correct sequence
        await playSequence(sequence)
        setShowCorrectSequence(false)
        setWrongSquareId(null)
      
      // Submit score and finish
      setTimeout(() => {
        setGameState('finished')
        if (username && !hasSubmittedScore.current) {
          hasSubmittedScore.current = true
          submitMemoryScore({
            username,
            level_reached: level,
            correct_sequences: correctClicks,
            total_sequences: totalSequences + 1
          }).then(() => {
            setTimeout(() => loadScores(), 1000)
          }).catch(error => {
            console.error('Error submitting score:', error)
            hasSubmittedScore.current = false
          })
        }
        }, 1000)
      }, 500)
      
    } else {
      // Correct click!
      setCorrectClicks(prev => prev + 1)
      
      if (newPlayerSequence.length === sequence.length) {
        // Completed the sequence! Move to next level
        setGameState('correct')
        setCorrectSequences(prev => prev + 1)
        setTotalSequences(prev => prev + 1)
        
        setTimeout(() => {
          const nextLevel = level + 1
          setLevel(nextLevel)
          const newSequence = generateSequence()
          playSequence(newSequence)
        }, 1000)
      }
    }
  }, [gameState, playerSequence, sequence, level, correctSequences, totalSequences, username, generateSequence, playSequence, loadScores])

  // Reset game
  const resetGame = useCallback(() => {
    setGameState('idle')
    setSequence([])
    setPlayerSequence([])
    setLevel(1)
    setCorrectSequences(0)
    setTotalSequences(0)
    setCorrectClicks(0)
    setActiveSquare(null)
    setShowCorrectSequence(false)
    setWrongSquareId(null)
    hasSubmittedScore.current = false
    isPlayingSequence.current = false
  }, [])

  return (
    <GameWrapper
      gameType="Memory Game"
      scores={scores}
      loading={loading}
      onRefresh={loadScores}
      formatScore={formatScore}
      sortKey="level_reached"
      sortDirection="desc"
    >
      <div className="flex flex-col items-center justify-start min-h-[400px] sm:min-h-[600px] pt-8">
        {/* Stats and Reset */}
        <div className="flex justify-between items-center w-full max-w-2xl mb-6 text-sm sm:text-base">
          <div className="text-gray-600 dark:text-gray-400">
            Level: <span className="font-bold text-blue-600 dark:text-blue-400">{level}</span>
          </div>
          <div className="text-gray-600 dark:text-gray-400">
            Correct: <span className="font-bold text-green-600 dark:text-green-400">{correctClicks}</span>
          </div>
          <div className="text-gray-600 dark:text-gray-400">
            Length: <span className="font-bold text-purple-600 dark:text-purple-400">{sequence.length}</span>
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

        {/* Game Board */}
        <div className="w-full max-w-2xl mb-6">
          {gameState === 'wrong' && showCorrectSequence ? (
            <div className="text-center mb-4">
              <div className="text-xl text-red-600 dark:text-red-400 font-semibold mb-2">
                Wrong! Here's the correct sequence:
              </div>
            </div>
          ) : null}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 aspect-square">
            {COLORS.map((color) => {
              const isWrongSquare = gameState === 'wrong' && wrongSquareId === color.id && !showCorrectSequence
              const isInCorrectSequence = gameState === 'wrong' && showCorrectSequence && sequence.includes(color.id)
              
              return (
              <button
                key={color.id}
                onClick={() => handleSquareClick(color.id)}
                disabled={gameState !== 'playing'}
                className={`
                  ${color.bg}
                  ${color.border}
                  border-4 rounded-lg transition-all duration-150
                  ${gameState === 'playing' ? 'cursor-pointer' : 'cursor-not-allowed'}
                    ${isWrongSquare ? 'opacity-100 shadow-2xl ring-4 ring-red-500 animate-shake' : ''}
                    ${isInCorrectSequence ? 'opacity-100 shadow-2xl ring-4 ring-green-500' : ''}
                    ${!isWrongSquare && !isInCorrectSequence && activeSquare === color.id ? 'opacity-100 shadow-2xl' : ''}
                    ${!isWrongSquare && !isInCorrectSequence && activeSquare !== color.id && !isInCorrectSequence ? 'opacity-40 shadow-lg' : ''}
                `}
              />
              )
            })}
          </div>
        </div>

        {/* Control Buttons */}
        {(gameState === 'idle' || gameState === 'finished') && (
          <button
            onClick={startGame}
            className="w-full max-w-2xl bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold shadow-lg transition-colors"
          >
            {gameState === 'finished' ? 'Play Again' : 'Start Game'}
          </button>
        )}

        {/* Progress indicator during player's turn */}
        <div className="mt-4 text-center min-h-[20px]">
          {gameState === 'playing' && playerSequence.length > 0 && (
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Progress: {playerSequence.length} / {sequence.length}
            </div>
          )}
        </div>
      </div>
    </GameWrapper>
  )
}
