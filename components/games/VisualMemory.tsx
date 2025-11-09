'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { getVisualMemoryScores, submitVisualMemoryScore } from '@/lib/scores'
import { useUser } from '@/contexts/UserContext'
import { supabase } from '@/lib/supabase'
import GameWrapper from '../GameWrapper'
import type { VisualMemoryScore } from '@/lib/supabase'

type GameState = 'idle' | 'showing' | 'playing' | 'correct' | 'wrong' | 'finished'

interface Square {
  id: number
  isPattern: boolean
  isSelected: boolean
}

export default function VisualMemory() {
  const [scores, setScores] = useState<VisualMemoryScore[]>([])
  const [loading, setLoading] = useState(true)
  const [gameState, setGameState] = useState<GameState>('idle')
  const [level, setLevel] = useState(1)
  const [squares, setSquares] = useState<Square[]>([])
  const [correctTilesClicked, setCorrectTilesClicked] = useState(0)
  const { username } = useUser()
  const hasSubmittedScore = useRef(false)

  const GRID_SIZE = 5 // 5x5 grid

  const loadScores = async () => {
    try {
      setLoading(true)
      const data = await getVisualMemoryScores({ limit: 50 })
      setScores(data)
    } catch (error) {
      console.error('Error loading scores:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadScores()
    
    // Set up realtime listener for visual memory scores
    const channel = supabase
      .channel('visual_memory_scores_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'visual_memory_scores'
        },
        (payload) => {
          console.log('New visual memory score:', payload.new)
          setScores(prev => [payload.new as VisualMemoryScore, ...prev.slice(0, 49)])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const formatScore = (score: VisualMemoryScore) => {
    return `Level ${score.level_reached} (${score.total_patterns} correct tiles)`
  }

  // Initialize grid
  const initializeGrid = useCallback(() => {
    const grid: Square[] = []
    for (let i = 0; i < GRID_SIZE * GRID_SIZE; i++) {
      grid.push({
        id: i,
        isPattern: false,
        isSelected: false
      })
    }
    return grid
  }, [])

  // Generate pattern for current level
  const generatePattern = useCallback((currentLevel: number) => {
    const grid = initializeGrid()
    const numSquares = Math.min(2 + currentLevel, 15) // Start with 3, max 16 squares
    const patternIndices = new Set<number>()
    
    while (patternIndices.size < numSquares) {
      patternIndices.add(Math.floor(Math.random() * grid.length))
    }
    
    return grid.map((square, idx) => ({
      ...square,
      isPattern: patternIndices.has(idx)
    }))
  }, [initializeGrid])

  // Show pattern
  const showPattern = useCallback(async (currentLevel: number) => {
    const pattern = generatePattern(currentLevel)
    setSquares(pattern)
    setGameState('showing')
    
    // Show pattern for 2 seconds + 200ms per square
    const displayTime = 2000 + (2 + currentLevel) * 200
    
    await new Promise(resolve => setTimeout(resolve, displayTime))
    
    // Don't modify isPattern - just change state to playing
    // The visual will be controlled by the rendering logic
    setGameState('playing')
  }, [generatePattern])

  // Start game
  const startGame = useCallback(async () => {
    setLevel(1)
    setCorrectTilesClicked(0)
    hasSubmittedScore.current = false
    
    await showPattern(1)
  }, [showPattern])

  // Handle square click
  const handleSquareClick = useCallback((squareId: number) => {
    if (gameState !== 'playing') return
    
    setSquares(prev => prev.map(sq =>
      sq.id === squareId ? { ...sq, isSelected: !sq.isSelected } : sq
    ))
  }, [gameState])

  // Submit answer
  const submitAnswer = useCallback(() => {
    if (gameState !== 'playing') return
    
    // Check if all pattern squares are selected and no extra squares
    const patternSquares = squares.filter(sq => sq.isPattern)
    const selectedSquares = squares.filter(sq => sq.isSelected)
    
    // Count how many correct tiles were clicked
    const correctClicks = selectedSquares.filter(sq => sq.isPattern).length
    
    const allCorrect = patternSquares.every(sq => sq.isSelected)
    const noExtra = selectedSquares.every(sq => sq.isPattern)
    
    if (allCorrect && noExtra && patternSquares.length === selectedSquares.length) {
      // Correct! Add all the pattern squares to the count
      setCorrectTilesClicked(prev => prev + patternSquares.length)
      setGameState('correct')
      
      // Show correct pattern briefly
      setSquares(prev => prev.map(sq => ({ ...sq, isPattern: true, isSelected: sq.isPattern })))
      
      setTimeout(async () => {
        const nextLevel = level + 1
        setLevel(nextLevel)
        await showPattern(nextLevel)
      }, 1500)
    } else {
      // Wrong! Still count the correct clicks they did make
      setCorrectTilesClicked(prev => prev + correctClicks)
      setGameState('wrong')
      
      // Show correct pattern
      setSquares(prev => prev.map(sq => ({ ...sq, isPattern: true })))
      
      setTimeout(() => {
        setGameState('finished')
        
        // Submit score
        if (username && !hasSubmittedScore.current) {
          hasSubmittedScore.current = true
          submitVisualMemoryScore({
            username,
            level_reached: level,
            total_patterns: correctTilesClicked + correctClicks
          }).then(() => {
            setTimeout(() => loadScores(), 1000)
          }).catch(error => {
            console.error('Error submitting score:', error)
            hasSubmittedScore.current = false
          })
        }
      }, 2000)
    }
  }, [gameState, squares, level, correctTilesClicked, username, showPattern, loadScores])

  // Reset game
  const resetGame = useCallback(() => {
    setGameState('idle')
    setLevel(1)
    setSquares([]) // Empty array for idle state
    setCorrectTilesClicked(0)
    hasSubmittedScore.current = false
  }, [])

  return (
    <GameWrapper
      gameType="Visual Memory"
      scores={scores}
      loading={loading}
      onRefresh={loadScores}
      formatScore={formatScore}
      sortKey="level_reached"
      sortDirection="desc"
    >
      <div className="flex flex-col items-center justify-start min-h-[400px] sm:min-h-[600px] p-4 sm:p-8 pt-8">
        {/* Stats and Reset */}
        <div className="flex justify-between items-center w-full max-w-2xl mb-6 text-sm sm:text-base">
          <div className="text-gray-600 dark:text-gray-400">
            Level: <span className="font-bold text-blue-600 dark:text-blue-400">{level}</span>
          </div>
          <div className="text-gray-600 dark:text-gray-400">
            Squares: <span className="font-bold text-green-600 dark:text-green-400">{Math.min(2 + level, 16)}</span>
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

        {/* Game Area */}
        <div className="w-full max-w-2xl mb-6">
          {/* Grid - Always visible */}
          <div className="grid grid-cols-5 gap-2 mb-6 aspect-square">
            {squares.length > 0 ? squares.map((square) => (
              <button
                key={square.id}
                onClick={() => handleSquareClick(square.id)}
                disabled={gameState !== 'playing'}
                className={`
                  aspect-square rounded-lg transition-all duration-200
                  ${(gameState === 'showing' || gameState === 'correct' || gameState === 'wrong') && square.isPattern
                    ? 'bg-white dark:bg-gray-200' 
                    : square.isSelected && gameState === 'playing'
                    ? 'bg-blue-400 dark:bg-blue-500'
                    : 'bg-gray-300 dark:bg-gray-600'
                  }
                  ${gameState === 'playing' ? 'cursor-pointer hover:opacity-80' : 'cursor-not-allowed'}
                  border-2 border-gray-400 dark:border-gray-500
                `}
              />
            )) : (
              // Empty grid for idle state
              Array.from({ length: 25 }).map((_, idx) => (
                <div
                  key={idx}
                  className="aspect-square rounded-lg bg-gray-300 dark:bg-gray-600 border-2 border-gray-400 dark:border-gray-500"
                />
              ))
            )}
          </div>

          {/* Button - Changes based on state */}
          {gameState === 'idle' || gameState === 'finished' ? (
            <button
              onClick={startGame}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold shadow-lg transition-colors"
            >
              {gameState === 'finished' ? 'Play Again' : 'Start Game'}
            </button>
          ) : (
            <button
              onClick={submitAnswer}
              disabled={gameState !== 'playing'}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-semibold shadow-lg transition-colors"
            >
              Submit Answer
            </button>
          )}
        </div>
      </div>
    </GameWrapper>
  )
}
