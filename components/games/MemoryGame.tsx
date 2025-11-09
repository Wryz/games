'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { getMemoryScores, submitMemoryScore } from '@/lib/scores'
import { useUser } from '@/contexts/UserContext'
import { supabase } from '@/lib/supabase'
import GameWrapper from '../GameWrapper'
import type { MemoryScore } from '@/lib/supabase'

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
  const [message, setMessage] = useState('Click Start to Play')
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
    return `Level ${score.level_reached} (${score.correct_sequences} correct)`
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
    setMessage('Watch carefully...')
    setPlayerSequence([])
    
    // Wait a bit before starting
    await new Promise(resolve => setTimeout(resolve, 800))
    
    for (let i = 0; i < seq.length; i++) {
      const colorId = seq[i]
      setActiveSquare(colorId)
      
      // Show the square for 500ms
      await new Promise(resolve => setTimeout(resolve, 500))
      
      setActiveSquare(null)
      
      // Pause between squares (300ms)
      await new Promise(resolve => setTimeout(resolve, 300))
    }
    
    setGameState('playing')
    setMessage('Your turn! Repeat the sequence')
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
      // Wrong sequence
      setGameState('wrong')
      setMessage(`Wrong! You reached Level ${level}`)
      setTotalSequences(prev => prev + 1)
      
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
      }, 1500)
      
    } else {
      // Correct click!
      setCorrectClicks(prev => prev + 1)
      
      if (newPlayerSequence.length === sequence.length) {
        // Completed the sequence! Move to next level
        setGameState('correct')
        setMessage('Correct! Next level...')
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
    setMessage('Click Start to Play')
    setActiveSquare(null)
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
      <div className="flex flex-col items-center justify-start min-h-[400px] sm:min-h-[600px] p-4 sm:p-8 pt-8">
        {/* Stats */}
        <div className="flex gap-6 mb-6 text-sm sm:text-base">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{level}</div>
            <div className="text-gray-600 dark:text-gray-400">Level</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{correctClicks}</div>
            <div className="text-gray-600 dark:text-gray-400">Correct</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{sequence.length}</div>
            <div className="text-gray-600 dark:text-gray-400">Length</div>
          </div>
        </div>

        {/* Message */}
        <div className="mb-6 text-center min-h-[28px]">
          <p className={`text-lg font-semibold ${
            gameState === 'correct' ? 'text-green-600 dark:text-green-400' :
            gameState === 'wrong' ? 'text-red-600 dark:text-red-400' :
            'text-gray-700 dark:text-gray-300'
          }`}>
            {message}
          </p>
        </div>

        {/* Game Board */}
        <div className="w-full max-w-md mb-6">
          <div className="grid grid-cols-2 gap-3 sm:gap-4 aspect-square">
            {COLORS.map((color) => (
              <button
                key={color.id}
                onClick={() => handleSquareClick(color.id)}
                disabled={gameState !== 'playing'}
                className={`
                  ${color.bg}
                  ${color.border}
                  border-4 rounded-lg transition-all duration-150
                  ${gameState === 'playing' ? 'cursor-pointer' : 'cursor-not-allowed'}
                  ${activeSquare === color.id ? 'opacity-100 shadow-2xl' : 'opacity-40 shadow-lg'}
                `}
              />
            ))}
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex gap-4">
          {gameState === 'idle' || gameState === 'finished' ? (
            <button
              onClick={startGame}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold shadow-lg transition-colors"
            >
              {gameState === 'finished' ? 'Play Again' : 'Start Game'}
            </button>
          ) : (
            <button
              onClick={resetGame}
              className="bg-gray-600 hover:bg-gray-700 text-white px-8 py-3 rounded-lg font-semibold shadow-lg transition-colors"
            >
              Reset
            </button>
          )}
        </div>

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
