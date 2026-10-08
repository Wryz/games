'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { ChimpTestIcon } from '../icons/GameIcons'
import { getChimpTestScores, submitChimpTestScore } from '@/lib/scores'
import { useUser } from '@/contexts/UserContext'
import { supabase } from '@/lib/supabase'
import GameWrapper from '../GameWrapper'
import type { ChimpTestScore } from '@/lib/supabase'
import { formatNumber } from '@/lib/levels'

type GameState = 'idle' | 'showing' | 'playing' | 'correct' | 'wrong' | 'finished'

interface Box {
  id: number
  number: number | null // The number to display (1, 2, 3, etc.) or null if not part of sequence
  isSelected: boolean
  isPattern: boolean // Whether this box is part of the sequence
}

export default function ChimpTest() {
  const [scores, setScores] = useState<ChimpTestScore[]>([])
  const [loading, setLoading] = useState(true)
  const [gameState, setGameState] = useState<GameState>('idle')
  const [level, setLevel] = useState(1)
  const [boxes, setBoxes] = useState<Box[]>([])
  const [clickOrder, setClickOrder] = useState<number[]>([]) // Track order of clicks
  const [patternsRemembered, setPatternsRemembered] = useState(0)
  const [feedbackBoxes, setFeedbackBoxes] = useState<Set<number>>(new Set())
  const [wrongBoxes, setWrongBoxes] = useState<Set<number>>(new Set())
  const [finalResults, setFinalResults] = useState<{ patternsRemembered: number } | null>(null)
  const { username } = useUser()
  const hasSubmittedScore = useRef(false)

  // Calculate grid size based on level (increases every 10 levels)
  const getGridSize = useCallback((currentLevel: number) => {
    if (currentLevel <= 10) return 4 // 4x4 for levels 1-10
    if (currentLevel <= 20) return 5 // 5x5 for levels 11-20
    if (currentLevel <= 30) return 6 // 6x6 for levels 21-30
    return 7 // 7x7 for levels 31+
  }, [])

  // State is only set in promise callbacks, so this is safe to call from an effect
  const fetchScores = useCallback(() => {
    return getChimpTestScores({ limit: 50 })
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
    
    // Set up realtime listener for chimp test scores
    const channel = supabase
      .channel('chimp_test_scores_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chimp_test_scores'
        },
        (payload) => {
          console.log('New chimp test score:', payload.new)
          setScores(prev => [payload.new as ChimpTestScore, ...prev.slice(0, 49)])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchScores])

  const formatScore = (score: ChimpTestScore) => {
    return `${formatNumber(score.patterns_remembered)} correct`
  }

  // Initialize grid
  const initializeGrid = useCallback((gridSize: number) => {
    const grid: Box[] = []
    for (let i = 0; i < gridSize * gridSize; i++) {
      grid.push({
        id: i,
        number: null,
        isPattern: false,
        isSelected: false
      })
    }
    return grid
  }, [])

  // Store the correct order when pattern is generated
  const correctOrderRef = useRef<number[]>([])

  // Generate pattern for current level
  const generatePatternWithOrder = useCallback((currentLevel: number) => {
    const gridSize = getGridSize(currentLevel)
    const grid = initializeGrid(gridSize)
    const maxBoxes = gridSize * gridSize
    const numBoxes = Math.min(3 + currentLevel, maxBoxes)
    const patternIndices = new Set<number>()
    
    while (patternIndices.size < numBoxes) {
      patternIndices.add(Math.floor(Math.random() * grid.length))
    }
    
    const patternArray = Array.from(patternIndices)
    correctOrderRef.current = patternArray // Store the correct order
    
    return grid.map((box, idx) => {
      const patternIndex = patternArray.indexOf(idx)
      return {
        ...box,
        isPattern: patternIndices.has(idx),
        number: patternIndex >= 0 ? patternIndex + 1 : null
      }
    })
  }, [initializeGrid, getGridSize])

  const showPatternUpdated = useCallback(async (currentLevel: number) => {
    const pattern = generatePatternWithOrder(currentLevel)
    setBoxes(pattern)
    setClickOrder([])
    setGameState('showing')
    
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    setBoxes(prev => prev.map(box => ({
      ...box,
      number: null
    })))
    
    setGameState('playing')
  }, [generatePatternWithOrder])

  const startGameUpdated = useCallback(async () => {
    setLevel(1)
    setPatternsRemembered(0)
    setClickOrder([])
    setFeedbackBoxes(new Set())
    setWrongBoxes(new Set())
    setFinalResults(null)
    hasSubmittedScore.current = false
    
    await showPatternUpdated(1)
  }, [showPatternUpdated])

  const handleBoxClickUpdated = useCallback((boxId: number) => {
    if (gameState !== 'playing') return
    
    const box = boxes.find(b => b.id === boxId)
    if (!box || !box.isPattern) return
    
    if (clickOrder.includes(boxId)) return
    
    const expectedNextBoxId = correctOrderRef.current[clickOrder.length]
    const isCorrect = boxId === expectedNextBoxId
    
    const newClickOrder = [...clickOrder, boxId]
    setClickOrder(newClickOrder)
    
    setBoxes(prev => prev.map(b =>
      b.id === boxId ? { ...b, isSelected: true } : b
    ))
    
    if (!isCorrect) {
      // Wrong box clicked - end game
      setGameState('wrong')
      setWrongBoxes(new Set([boxId]))
      setFeedbackBoxes(new Set(correctOrderRef.current))
      
      setTimeout(() => {
        const patternsRememberedCount = patternsRemembered + clickOrder.length
        setFinalResults({
          patternsRemembered: patternsRememberedCount
        })
        setGameState('finished')
        
        // Submit score
        if (username && !hasSubmittedScore.current) {
          hasSubmittedScore.current = true
          submitChimpTestScore({
            username,
            patterns_remembered: patternsRememberedCount
          }).then(() => {
            setTimeout(() => loadScores(), 1000)
          }).catch(error => {
            console.error('Error submitting score:', error)
            hasSubmittedScore.current = false
          })
        }
      }, 2000)
      return
    }
    
    // Correct click - check if sequence is complete
    const patternBoxesCount = boxes.filter(b => b.isPattern).length
    if (newClickOrder.length === patternBoxesCount) {
      // All boxes clicked in correct order!
      setGameState('correct')
      const newPatternsRemembered = patternsRemembered + patternBoxesCount
      setPatternsRemembered(newPatternsRemembered)
      
      setFeedbackBoxes(new Set(correctOrderRef.current))
      
      setTimeout(async () => {
        setFeedbackBoxes(new Set())
        setWrongBoxes(new Set())
        const nextLevel = level + 1
        setLevel(nextLevel)
        await showPatternUpdated(nextLevel)
      }, 1500)
    }
  }, [gameState, boxes, clickOrder, patternsRemembered, level, username, showPatternUpdated, loadScores])

  // Reset game
  const resetGame = useCallback(() => {
    setGameState('idle')
    setLevel(1)
    setBoxes([])
    setClickOrder([])
    setPatternsRemembered(0)
    setFeedbackBoxes(new Set())
    setWrongBoxes(new Set())
    setFinalResults(null)
    hasSubmittedScore.current = false
    correctOrderRef.current = []
  }, [])

  return (
    <GameWrapper
      gameType="Chimp Test"
      scores={scores}
      loading={loading}
      onRefresh={loadScores}
      fetchScores={getChimpTestScores}
      scoreTable="chimp_test_scores"
      formatScore={formatScore}
      sortKey="patterns_remembered"
      sortDirection="desc"
    >
      <div className="w-full">
        {gameState === 'finished' && finalResults ? (
          /* Results Screen */
          <div className="flex min-h-[420px] flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white p-6 text-center dark:border-gray-800 dark:bg-gray-900 sm:min-h-[480px]">
            <span className="eyebrow">Result</span>
            <div className="num mt-3 text-6xl font-bold tracking-tight text-gray-950 dark:text-white sm:text-7xl">
              {finalResults.patternsRemembered}
            </div>
            <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">correct</div>
            <button onClick={startGameUpdated} className="btn-ink mt-8">
              Try again
            </button>
          </div>
        ) : (
          <>
            {/* Status row */}
            <div className="mb-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 sm:gap-6">
                <div className="flex items-baseline gap-2">
                  <span className="eyebrow">Level</span>
                  <span className="num text-sm font-medium text-gray-900 dark:text-gray-100">{level}</span>
                </div>
                <span className="text-gray-300 dark:text-gray-700" aria-hidden="true">·</span>
                <div className="flex items-baseline gap-2">
                  <span className="eyebrow">Boxes</span>
                  <span className="num text-sm font-medium text-gray-900 dark:text-gray-100">{Math.min(3 + level, getGridSize(level) * getGridSize(level))}</span>
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
              <div className="w-full max-w-xl">
                {/* Grid - Always render full grid, but make non-pattern boxes transparent during playing */}
                <div
                  className="mb-6 grid aspect-square gap-2"
                  style={{ gridTemplateColumns: `repeat(${getGridSize(level)}, minmax(0, 1fr))` }}
                >
                  {boxes.length > 0 ? boxes.map((box) => {
                    const isCorrectFeedback = feedbackBoxes.has(box.id) && (gameState === 'correct' || gameState === 'wrong')
                    const isWrongFeedback = wrongBoxes.has(box.id) && gameState === 'wrong'
                    const isPatternBox = box.isPattern
                    const showNumber = box.number !== null && (gameState === 'showing' || gameState === 'correct' || gameState === 'wrong')
                    const isPlaying = gameState === 'playing'
                    const isVisible = isPatternBox || !isPlaying // Show all boxes when not playing, only pattern boxes when playing

                    return (
                      <button
                        key={box.id}
                        onClick={() => handleBoxClickUpdated(box.id)}
                        disabled={!isPlaying || !isPatternBox}
                        className={`
                          aspect-square rounded-xl transition-all duration-200 flex items-center justify-center
                          ${!isVisible
                            ? 'opacity-0 pointer-events-none'
                            : isWrongFeedback
                            ? 'bg-red-500 dark:bg-red-600 animate-shake'
                            : isCorrectFeedback && (gameState === 'correct' || gameState === 'wrong')
                            ? 'bg-green-500 dark:bg-green-600'
                            : showNumber && isPatternBox
                            ? 'bg-white dark:bg-gray-200'
                            : box.isSelected && isPlaying
                            ? 'bg-blue-400 dark:bg-blue-500'
                            : isPatternBox && isPlaying
                            ? 'bg-gray-300 dark:bg-gray-700'
                            : 'bg-gray-300 dark:bg-gray-700'
                          }
                          ${isPlaying && isPatternBox ? 'cursor-pointer hover:opacity-80' : 'cursor-not-allowed'}
                          border ${isVisible ? 'border-gray-300 dark:border-gray-600' : 'border-transparent'}
                        `}
                      >
                        {showNumber && (
                          <span className="num text-5xl font-bold text-gray-950 sm:text-6xl md:text-7xl">
                            {box.number}
                          </span>
                        )}
                      </button>
                    )
                  }) : (
                    // Empty grid for idle state
                    Array.from({ length: getGridSize(1) * getGridSize(1) }).map((_, idx) => (
                      <div
                        key={idx}
                        className="aspect-square rounded-xl border border-gray-300 bg-gray-300 dark:border-gray-600 dark:bg-gray-700"
                      />
                    ))
                  )}
                </div>

                {/* Button / status - Changes based on state */}
                <div className="flex min-h-[44px] items-center justify-center">
                  {gameState === 'idle' ? (
                    <button onClick={startGameUpdated} className="btn-primary">
                      Start
                    </button>
                  ) : gameState === 'showing' ? (
                    <span className="eyebrow">Watch the numbers</span>
                  ) : gameState === 'playing' ? (
                    <div className="flex items-baseline gap-2">
                      <span className="eyebrow">Click boxes in order · Next</span>
                      <span className="num text-sm font-medium text-gray-900 dark:text-gray-100">{clickOrder.length + 1}</span>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </GameWrapper>
  )
}
