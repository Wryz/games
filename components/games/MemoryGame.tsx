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

  // State is only set in promise callbacks, so this is safe to call from an effect
  const fetchScores = useCallback(() => {
    return getMemoryScores({ limit: 50 })
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
  }, [fetchScores])

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
  }, [gameState, playerSequence, sequence, level, correctClicks, totalSequences, username, generateSequence, playSequence, loadScores])

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
      fetchScores={getMemoryScores}
      scoreTable="memory_scores"
      formatScore={formatScore}
      sortKey="level_reached"
      sortDirection="desc"
    >
      <div className="w-full">
        {/* Status row */}
        <div className="mb-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="flex items-baseline gap-2">
              <span className="eyebrow">Level</span>
              <span className="num text-sm font-medium text-gray-900 dark:text-gray-100">{level}</span>
            </div>
            <span className="text-gray-300 dark:text-gray-700" aria-hidden="true">·</span>
            <div className="flex items-baseline gap-2">
              <span className="eyebrow">Correct</span>
              <span className="num text-sm font-medium text-gray-900 dark:text-gray-100">{correctClicks}</span>
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
        <div className="flex flex-col items-center rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900 sm:p-6">
          {gameState === 'finished' ? (
            /* Results Screen */
            <div className="flex min-h-[380px] w-full flex-col items-center justify-center text-center sm:min-h-[440px]">
              <span className="eyebrow">Result</span>
              <div className="num mt-3 text-6xl font-bold tracking-tight text-gray-950 dark:text-white sm:text-7xl">
                {level}
              </div>
              <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">level reached</div>
              <div className="mt-8 grid w-full max-w-xs grid-cols-1 gap-3">
                <div className="card p-4 text-left">
                  <div className="eyebrow">Correct clicks</div>
                  <div className="num mt-2 text-lg font-semibold text-gray-950 dark:text-gray-50">{correctClicks}</div>
                </div>
              </div>
              <button onClick={startGame} className="btn-ink mt-8">
                Try again
              </button>
            </div>
          ) : (
            <div className="w-full max-w-xl">
              {/* Feedback line (fixed height so the board never jumps) */}
              <div className="mb-4 flex min-h-[20px] items-center justify-center">
                {gameState === 'wrong' && showCorrectSequence ? (
                  <span className="eyebrow text-red-600! dark:text-red-400!">Wrong — here&apos;s the correct sequence</span>
                ) : null}
              </div>

              {/* Game Board */}
              <div className="grid aspect-square grid-cols-2 gap-3 sm:gap-4">
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
                      border-4 rounded-2xl transition-all duration-150
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

              {/* Start button / progress indicator */}
              <div className="mt-6 flex min-h-[44px] items-center justify-center">
                {gameState === 'idle' && (
                  <button onClick={startGame} className="btn-primary">
                    Start
                  </button>
                )}
                {gameState === 'playing' && playerSequence.length > 0 && (
                  <div className="flex items-baseline gap-2">
                    <span className="eyebrow">Progress</span>
                    <span className="num text-sm font-medium text-gray-900 dark:text-gray-100">
                      {playerSequence.length}/{sequence.length}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </GameWrapper>
  )
}
