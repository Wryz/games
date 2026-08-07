'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { getMazeScores, submitMazeScore } from '@/lib/scores'
import { useUser } from '@/contexts/UserContext'
import { supabase } from '@/lib/supabase'
import GameWrapper from '../GameWrapper'
import type { MazeScore } from '@/lib/supabase'
import { formatNumber } from '@/lib/levels'

type GameState = 'playing' | 'finished'

type Cell = {
  row: number
  col: number
  walls: {
    top: boolean
    right: boolean
    bottom: boolean
    left: boolean
  }
  visited: boolean
}

type Position = {
  row: number
  col: number
}

const MAZE_SIZE = 20 // 20x20 grid

export default function Maze() {
  const [scores, setScores] = useState<MazeScore[]>([])
  const [loading, setLoading] = useState(true)
  const [gameState, setGameState] = useState<GameState>('playing')
  const [maze, setMaze] = useState<Cell[][]>([])
  const [playerPos, setPlayerPos] = useState<Position>({ row: 0, col: 0 })
  const [startPos, setStartPos] = useState<Position>({ row: 0, col: 0 })
  const [exitPos, setExitPos] = useState<Position>({ row: 0, col: 0 })
  const [startTime, setStartTime] = useState(0)
  const [elapsedTime, setElapsedTime] = useState(0)
  const { username } = useUser()
  const hasSubmittedScore = useRef(false)
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const startTimeRef = useRef(0)
  const hasStartedRef = useRef(false)
  const timerStartedRef = useRef(false)

  const loadScores = async () => {
    try {
      setLoading(true)
      const data = await getMazeScores({ limit: 50 })
      console.log('Maze scores loaded:', data)
      setScores(data || [])
    } catch (error) {
      console.error('Error loading maze scores:', error)
      setScores([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadScores()
    
    // Set up realtime listener for maze scores
    const channel = supabase
      .channel('maze_scores_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'maze_scores'
        },
        (payload) => {
          console.log('New maze score:', payload.new)
          setScores(prev => [payload.new as MazeScore, ...prev.slice(0, 49)])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current)
      }
    }
  }, [])

  const formatScore = (score: MazeScore) => {
    if (!score || score.time_taken === undefined || score.time_taken === null) {
      return 'N/A'
    }
    const seconds = Math.floor(score.time_taken / 1000)
    const milliseconds = Math.floor((score.time_taken % 1000) / 100)
    return `${formatNumber(seconds)}.${milliseconds}s`
  }

  // Initialize empty maze grid
  const initializeMaze = useCallback((): Cell[][] => {
    const grid: Cell[][] = []
    for (let row = 0; row < MAZE_SIZE; row++) {
      grid[row] = []
      for (let col = 0; col < MAZE_SIZE; col++) {
        grid[row][col] = {
          row,
          col,
          walls: {
            top: true,
            right: true,
            bottom: true,
            left: true
          },
          visited: false
        }
      }
    }
    return grid
  }, [])

  // Get unvisited neighbors
  const getUnvisitedNeighbors = useCallback((grid: Cell[][], row: number, col: number): Position[] => {
    const neighbors: Position[] = []
    const directions = [
      { row: -1, col: 0 }, // top
      { row: 0, col: 1 },  // right
      { row: 1, col: 0 },  // bottom
      { row: 0, col: -1 }  // left
    ]

    for (const dir of directions) {
      const newRow = row + dir.row
      const newCol = col + dir.col
      if (
        newRow >= 0 && newRow < MAZE_SIZE &&
        newCol >= 0 && newCol < MAZE_SIZE &&
        !grid[newRow][newCol].visited
      ) {
        neighbors.push({ row: newRow, col: newCol })
      }
    }

    return neighbors
  }, [])

  // Remove wall between two cells
  const removeWall = useCallback((grid: Cell[][], cell1: Position, cell2: Position) => {
    const rowDiff = cell2.row - cell1.row
    const colDiff = cell2.col - cell1.col

    if (rowDiff === -1) {
      // cell2 is above cell1
      grid[cell1.row][cell1.col].walls.top = false
      grid[cell2.row][cell2.col].walls.bottom = false
    } else if (rowDiff === 1) {
      // cell2 is below cell1
      grid[cell1.row][cell1.col].walls.bottom = false
      grid[cell2.row][cell2.col].walls.top = false
    } else if (colDiff === -1) {
      // cell2 is left of cell1
      grid[cell1.row][cell1.col].walls.left = false
      grid[cell2.row][cell2.col].walls.right = false
    } else if (colDiff === 1) {
      // cell2 is right of cell1
      grid[cell1.row][cell1.col].walls.right = false
      grid[cell2.row][cell2.col].walls.left = false
    }
  }, [])

  // Check if a maze is too simple (straight line or too direct)
  const isMazeTooSimple = useCallback((grid: Cell[][]): boolean => {
    // Use BFS to find shortest path length
    const queue: Array<{ pos: Position; dist: number }> = []
    const visited = new Set<string>()
    const start: Position = { row: 0, col: 0 }
    const exit: Position = { row: MAZE_SIZE - 1, col: MAZE_SIZE - 1 }
    
    queue.push({ pos: start, dist: 0 })
    visited.add(`${start.row},${start.col}`)
    
    while (queue.length > 0) {
      const { pos, dist } = queue.shift()!
      
      if (pos.row === exit.row && pos.col === exit.col) {
        // If shortest path is too short (less than 60% of Manhattan distance), it's too simple
        const manhattanDist = MAZE_SIZE - 1 + MAZE_SIZE - 1
        return dist < manhattanDist * 0.6
      }
      
      const directions = [
        { row: -1, col: 0, wall: 'top' },
        { row: 1, col: 0, wall: 'bottom' },
        { row: 0, col: -1, wall: 'left' },
        { row: 0, col: 1, wall: 'right' }
      ]
      
      for (const dir of directions) {
        const newRow = pos.row + dir.row
        const newCol = pos.col + dir.col
        
        if (
          newRow >= 0 && newRow < MAZE_SIZE &&
          newCol >= 0 && newCol < MAZE_SIZE &&
          !visited.has(`${newRow},${newCol}`) &&
          !grid[pos.row][pos.col].walls[dir.wall as keyof typeof grid[0][0]['walls']]
        ) {
          visited.add(`${newRow},${newCol}`)
          queue.push({ pos: { row: newRow, col: newCol }, dist: dist + 1 })
        }
      }
    }
    
    return false
  }, [])

  // Add extra paths by removing additional walls
  const addMultiplePaths = useCallback((grid: Cell[][]): void => {
    // Add extra wall removals to create alternative paths
    // Remove approximately 10-15% of remaining walls to create loops
    const totalCells = MAZE_SIZE * MAZE_SIZE
    const wallsToRemove = Math.floor(totalCells * 0.12) // 12% of cells = multiple paths
    
    let removed = 0
    let attempts = 0
    const maxAttempts = wallsToRemove * 10
    
    while (removed < wallsToRemove && attempts < maxAttempts) {
      attempts++
      const row = Math.floor(Math.random() * MAZE_SIZE)
      const col = Math.floor(Math.random() * MAZE_SIZE)
      const cell = grid[row][col]
      
      // Randomly choose a wall to potentially remove
      const walls = ['top', 'right', 'bottom', 'left'] as const
      const wall = walls[Math.floor(Math.random() * walls.length)]
      
      // Check if wall exists and can be removed
      if (cell.walls[wall]) {
        let canRemove = false
        let neighborRow = row
        let neighborCol = col
        
        if (wall === 'top' && row > 0) {
          neighborRow = row - 1
          canRemove = true
        } else if (wall === 'bottom' && row < MAZE_SIZE - 1) {
          neighborRow = row + 1
          canRemove = true
        } else if (wall === 'left' && col > 0) {
          neighborCol = col - 1
          canRemove = true
        } else if (wall === 'right' && col < MAZE_SIZE - 1) {
          neighborCol = col + 1
          canRemove = true
        }
        
        if (canRemove) {
          // Remove the wall (create a path)
          removeWall(grid, { row, col }, { row: neighborRow, col: neighborCol })
          removed++
        }
      }
    }
  }, [removeWall])

  // Generate maze using recursive backtracking with multiple paths
  const generateMaze = useCallback((): Cell[][] => {
    let grid: Cell[][]
    let attempts = 0
    const maxAttempts = 10
    
    // Generate maze and ensure it's not too simple
    do {
      grid = initializeMaze()
      const stack: Position[] = []
      
      // Start from top-left corner
      const start: Position = { row: 0, col: 0 }
      grid[start.row][start.col].visited = true
      stack.push(start)

      while (stack.length > 0) {
        const current = stack[stack.length - 1]
        const neighbors = getUnvisitedNeighbors(grid, current.row, current.col)

        if (neighbors.length > 0) {
          // Choose random neighbor
          const next = neighbors[Math.floor(Math.random() * neighbors.length)]
          grid[next.row][next.col].visited = true
          removeWall(grid, current, next)
          stack.push(next)
        } else {
          // Backtrack
          stack.pop()
        }
      }

      // Add multiple paths by removing additional walls
      addMultiplePaths(grid)

      // Reset visited flags for gameplay
      for (let row = 0; row < MAZE_SIZE; row++) {
        for (let col = 0; col < MAZE_SIZE; col++) {
          grid[row][col].visited = false
        }
      }
      
      attempts++
    } while (isMazeTooSimple(grid) && attempts < maxAttempts)

    return grid
  }, [initializeMaze, getUnvisitedNeighbors, removeWall, addMultiplePaths, isMazeTooSimple])

  // Start new game (maze only — timer starts on first move)
  const startGame = useCallback(() => {
    const newMaze = generateMaze()
    setMaze(newMaze)
    
    // Start position: top-left (0, 0)
    const start: Position = { row: 0, col: 0 }
    setStartPos(start)
    setPlayerPos(start)
    
    // Exit position: bottom-right (opposite end)
    const exit: Position = { row: MAZE_SIZE - 1, col: MAZE_SIZE - 1 }
    setExitPos(exit)
    
    setStartTime(0)
    startTimeRef.current = 0
    setElapsedTime(0)
    setGameState('playing')
    hasSubmittedScore.current = false
    timerStartedRef.current = false

    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current)
      timerIntervalRef.current = null
    }
  }, [generateMaze])

  // Auto-start on mount
  useEffect(() => {
    if (hasStartedRef.current) return
    hasStartedRef.current = true
    startGame()
  }, [startGame])

  const beginTimer = useCallback(() => {
    if (timerStartedRef.current) return
    timerStartedRef.current = true
    const now = Date.now()
    setStartTime(now)
    startTimeRef.current = now
    setElapsedTime(0)

    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current)
    }
    timerIntervalRef.current = setInterval(() => {
      setElapsedTime(Date.now() - startTimeRef.current)
    }, 1000)
  }, [])

  // Handle movement in a direction
  const handleMove = useCallback((direction: 'up' | 'down' | 'left' | 'right') => {
    if (gameState !== 'playing') return

    const currentCell = maze[playerPos.row]?.[playerPos.col]
    if (!currentCell) return

    let newPos: Position | null = null

    switch (direction) {
      case 'up':
        if (!currentCell.walls.top && playerPos.row > 0) {
          newPos = { row: playerPos.row - 1, col: playerPos.col }
        }
        break
      case 'down':
        if (!currentCell.walls.bottom && playerPos.row < MAZE_SIZE - 1) {
          newPos = { row: playerPos.row + 1, col: playerPos.col }
        }
        break
      case 'left':
        if (!currentCell.walls.left && playerPos.col > 0) {
          newPos = { row: playerPos.row, col: playerPos.col - 1 }
        }
        break
      case 'right':
        if (!currentCell.walls.right && playerPos.col < MAZE_SIZE - 1) {
          newPos = { row: playerPos.row, col: playerPos.col + 1 }
        }
        break
    }

    if (newPos) {
      beginTimer()
      setPlayerPos(newPos)
      
      // Check if reached exit
      if (newPos.row === exitPos.row && newPos.col === exitPos.col) {
        const finalTime = Date.now() - startTimeRef.current
        setElapsedTime(finalTime)
        setGameState('finished')
        
        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current)
          timerIntervalRef.current = null
        }

        // Submit score
        if (username && !hasSubmittedScore.current) {
          hasSubmittedScore.current = true
          submitMazeScore({
            username,
            time_taken: finalTime
          }).then(() => {
            setTimeout(() => loadScores(), 1000)
          }).catch(error => {
            console.error('Error submitting score:', error)
            hasSubmittedScore.current = false
          })
        }
      }
    }
  }, [gameState, maze, playerPos, exitPos, username, beginTimer])

  // Handle arrow key movement
  const handleKeyPress = useCallback((e: KeyboardEvent) => {
    if (gameState !== 'playing') return

    // Prevent default behavior for arrow keys to stop page scrolling
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      e.preventDefault()
    }

    switch (e.key) {
      case 'ArrowUp':
        handleMove('up')
        break
      case 'ArrowDown':
        handleMove('down')
        break
      case 'ArrowLeft':
        handleMove('left')
        break
      case 'ArrowRight':
        handleMove('right')
        break
    }
  }, [gameState, handleMove])

  // Set up keyboard listeners
  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress)
    return () => {
      window.removeEventListener('keydown', handleKeyPress)
    }
  }, [handleKeyPress])

  // Reset starts a new maze
  const resetGame = useCallback(() => {
    startGame()
  }, [startGame])

  // Format time display
  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000)
    return `${seconds}s`
  }

  return (
    <GameWrapper
      gameType="Maze"
      scores={scores}
      loading={loading}
      onRefresh={loadScores}
      formatScore={formatScore}
      sortKey="time_taken"
      sortDirection="asc"
    >
      <div className="flex flex-col items-center justify-start min-h-[400px] sm:min-h-[600px] pt-8">
        {/* Stats and Reset */}
        <div className="flex justify-between items-center w-full max-w-2xl mb-6 text-sm sm:text-base">
          <div className="text-gray-600 dark:text-gray-400">
            Time: <span className="font-bold text-blue-600 dark:text-blue-400">
              {formatTime(elapsedTime)}
            </span>
          </div>
          <button
            onClick={resetGame}
            className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            title="New maze"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {/* Game Area */}
        <div className="w-full max-w-2xl mb-6">
          {gameState === 'finished' ? (
            <div className="text-center">
              <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-gray-700 dark:text-gray-100">
                Maze Complete!
              </h2>
              <div className="bg-white dark:bg-gray-700 p-6 sm:p-8 rounded-lg shadow-md mb-6">
                <div className="text-center">
                  <div className="text-3xl sm:text-4xl font-bold text-green-600 dark:text-green-400">
                    {formatTime(elapsedTime)}
                  </div>
                  <div className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
                    Completion Time
                  </div>
                </div>
              </div>
              <button
                onClick={startGame}
                className="w-full max-w-2xl bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold shadow-lg transition-colors"
              >
                Play Again
              </button>
            </div>
          ) : (
            <>
              <div className="grid gap-0 aspect-square" style={{ gridTemplateColumns: `repeat(${MAZE_SIZE}, minmax(0, 1fr))` }}>
                {maze.map((row, rowIdx) =>
                  row.map((cell, colIdx) => {
                    const isPlayer = playerPos.row === rowIdx && playerPos.col === colIdx
                    const isStart = startPos.row === rowIdx && startPos.col === colIdx && !isPlayer
                    const isExit = exitPos.row === rowIdx && exitPos.col === colIdx && !isPlayer

                    return (
                      <div
                        key={`${rowIdx}-${colIdx}`}
                        className={`
                          aspect-square relative
                          ${cell.walls.top ? 'border-t-2 border-gray-800 dark:border-gray-200' : ''}
                          ${cell.walls.right ? 'border-r-2 border-gray-800 dark:border-gray-200' : ''}
                          ${cell.walls.bottom ? 'border-b-2 border-gray-800 dark:border-gray-200' : ''}
                          ${cell.walls.left ? 'border-l-2 border-gray-800 dark:border-gray-200' : ''}
                          ${isPlayer ? 'bg-blue-500' : isStart ? 'bg-green-500' : isExit ? 'bg-red-500' : 'bg-gray-50 dark:bg-gray-800'}
                        `}
                      >
                        {isPlayer && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-3 h-3 bg-white rounded-full"></div>
                          </div>
                        )}
                        {isStart && (
                          <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">
                            S
                          </div>
                        )}
                        {isExit && (
                          <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">
                            E
                          </div>
                        )}
                      </div>
                    )
                  })
                )}
              </div>
              <div className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400 mb-4">
                Use arrow keys to move the ball from Start (green) to Exit (red)
              </div>
              
              {/* Mobile Arrow Controls */}
              <div className="md:hidden mt-6 flex flex-col items-center">
                <div className="mb-2">
                  <button
                    onClick={() => handleMove('up')}
                    disabled={gameState !== 'playing'}
                    className="w-16 h-16 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg shadow-lg transition-colors flex items-center justify-center active:scale-95"
                    aria-label="Move up"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  </button>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleMove('left')}
                    disabled={gameState !== 'playing'}
                    className="w-16 h-16 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg shadow-lg transition-colors flex items-center justify-center active:scale-95"
                    aria-label="Move left"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleMove('down')}
                    disabled={gameState !== 'playing'}
                    className="w-16 h-16 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg shadow-lg transition-colors flex items-center justify-center active:scale-95"
                    aria-label="Move down"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleMove('right')}
                    disabled={gameState !== 'playing'}
                    className="w-16 h-16 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg shadow-lg transition-colors flex items-center justify-center active:scale-95"
                    aria-label="Move right"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </GameWrapper>
  )
}
