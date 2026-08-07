'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { getSudokuScores, submitSudokuScore } from '@/lib/scores'
import { useUser } from '@/contexts/UserContext'
import { supabase } from '@/lib/supabase'
import GameWrapper from '../GameWrapper'
import type { SudokuScore } from '@/lib/supabase'
import { formatNumber } from '@/lib/levels'

type GameState = 'playing' | 'finished'
type Grid = number[][] // 0 = empty

const SIZE = 6
const BOX = 3 // 4 boxes of 3×3
const DIGITS = [1, 2, 3, 4, 5, 6, 7, 8, 9]
const CLUE_COUNT = 16

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function emptyGrid(): Grid {
  return Array.from({ length: SIZE }, () => Array(SIZE).fill(0))
}

function cloneGrid(grid: Grid): Grid {
  return grid.map(row => [...row])
}

function isValidPlacement(grid: Grid, row: number, col: number, num: number): boolean {
  for (let i = 0; i < SIZE; i++) {
    if (grid[row][i] === num || grid[i][col] === num) return false
  }
  const boxRow = Math.floor(row / BOX) * BOX
  const boxCol = Math.floor(col / BOX) * BOX
  for (let r = boxRow; r < boxRow + BOX; r++) {
    for (let c = boxCol; c < boxCol + BOX; c++) {
      if (grid[r][c] === num) return false
    }
  }
  return true
}

function candidatesAt(grid: Grid, row: number, col: number): number[] {
  return DIGITS.filter(num => isValidPlacement(grid, row, col, num))
}

/** Count solutions up to `limit` using MRV for speed. */
function countSolutions(grid: Grid, limit = 2): number {
  const g = cloneGrid(grid)
  let count = 0

  const search = (): boolean => {
    let bestRow = -1
    let bestCol = -1
    let bestCandidates: number[] | null = null

    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        if (g[r][c] !== 0) continue
        const candidates = candidatesAt(g, r, c)
        if (candidates.length === 0) return false
        if (!bestCandidates || candidates.length < bestCandidates.length) {
          bestRow = r
          bestCol = c
          bestCandidates = candidates
          if (candidates.length === 1) {
            r = SIZE
            break
          }
        }
      }
    }

    if (!bestCandidates) {
      count++
      return count >= limit
    }

    for (const num of bestCandidates) {
      g[bestRow][bestCol] = num
      if (search()) {
        g[bestRow][bestCol] = 0
        return true
      }
      g[bestRow][bestCol] = 0
    }
    return false
  }

  search()
  return count
}

function generateSolution(): Grid {
  // Backtracking fill — classic band-shuffle assumes SIZE === BOX²
  const grid = emptyGrid()

  const fill = (): boolean => {
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        if (grid[r][c] !== 0) continue
        for (const num of shuffle(DIGITS)) {
          if (isValidPlacement(grid, r, c, num)) {
            grid[r][c] = num
            if (fill()) return true
            grid[r][c] = 0
          }
        }
        return false
      }
    }
    return true
  }

  fill()
  return grid
}

function generatePuzzle(): { puzzle: Grid; solution: Grid } {
  const solution = generateSolution()
  const puzzle = cloneGrid(solution)
  const positions = shuffle(
    Array.from({ length: SIZE * SIZE }, (_, i) => [Math.floor(i / SIZE), i % SIZE] as [number, number])
  )

  let removed = 0
  const targetRemove = SIZE * SIZE - CLUE_COUNT

  for (const [row, col] of positions) {
    if (removed >= targetRemove) break
    const backup = puzzle[row][col]
    puzzle[row][col] = 0
    if (countSolutions(puzzle) !== 1) {
      puzzle[row][col] = backup
    } else {
      removed++
    }
  }

  return { puzzle, solution }
}

function isFilled(grid: Grid): boolean {
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (grid[r][c] === 0) return false
    }
  }
  return true
}

function isComplete(grid: Grid, solution: Grid): boolean {
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (grid[r][c] !== solution[r][c]) return false
    }
  }
  return true
}

function cellBorderClasses(row: number, col: number): string {
  const borders: string[] = ['border border-gray-300 dark:border-gray-600']
  if (row === 0) borders.push('border-t-2 border-t-gray-800 dark:border-t-gray-200')
  if (col === 0) borders.push('border-l-2 border-l-gray-800 dark:border-l-gray-200')
  if (row === SIZE - 1 || (row + 1) % BOX === 0) {
    borders.push('border-b-2 border-b-gray-800 dark:border-b-gray-200')
  }
  if (col === SIZE - 1 || (col + 1) % BOX === 0) {
    borders.push('border-r-2 border-r-gray-800 dark:border-r-gray-200')
  }
  return borders.join(' ')
}

function createNewGame() {
  const { puzzle, solution } = generatePuzzle()
  return {
    puzzle,
    solution,
    grid: cloneGrid(puzzle),
  }
}

function firstEmptyCell(puzzle: Grid): [number, number] | null {
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (puzzle[r][c] === 0) return [r, c]
    }
  }
  return null
}

/** Next empty (non-given) cell after (fromRow, fromCol), wrapping around. */
function nextEmptyCell(
  puzzle: Grid,
  grid: Grid,
  fromRow: number,
  fromCol: number
): [number, number] | null {
  const start = fromRow * SIZE + fromCol
  for (let offset = 1; offset < SIZE * SIZE; offset++) {
    const idx = (start + offset) % (SIZE * SIZE)
    const r = Math.floor(idx / SIZE)
    const c = idx % SIZE
    if (puzzle[r][c] === 0 && grid[r][c] === 0) return [r, c]
  }
  return null
}

/** Previous editable (non-given) cell before (fromRow, fromCol), wrapping around. */
function previousEditableCell(
  puzzle: Grid,
  fromRow: number,
  fromCol: number
): [number, number] | null {
  const start = fromRow * SIZE + fromCol
  for (let offset = 1; offset < SIZE * SIZE; offset++) {
    const idx = (start - offset + SIZE * SIZE) % (SIZE * SIZE)
    const r = Math.floor(idx / SIZE)
    const c = idx % SIZE
    if (puzzle[r][c] === 0) return [r, c]
  }
  return null
}

export default function Sudoku() {
  const [scores, setScores] = useState<SudokuScore[]>([])
  const [loading, setLoading] = useState(true)
  const [ready, setReady] = useState(false)
  const [gameState, setGameState] = useState<GameState>('playing')
  const [puzzle, setPuzzle] = useState<Grid>(() => emptyGrid())
  const [solution, setSolution] = useState<Grid>(() => emptyGrid())
  const [grid, setGrid] = useState<Grid>(() => emptyGrid())
  const [selected, setSelected] = useState<[number, number] | null>(null)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [timerStarted, setTimerStarted] = useState(false)
  const { username } = useUser()
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const startTimeRef = useRef(0)
  const hasSubmittedScore = useRef(false)

  const loadScores = async () => {
    try {
      setLoading(true)
      const data = await getSudokuScores({ limit: 50 })
      setScores(data || [])
    } catch (error) {
      console.error('Error loading sudoku scores:', error)
      setScores([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadScores()

    const channel = supabase
      .channel('sudoku_scores_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'sudoku_scores'
        },
        (payload) => {
          setScores(prev => [payload.new as SudokuScore, ...prev.slice(0, 49)])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const formatScore = (score: SudokuScore) => {
    if (!score || score.time_taken === undefined || score.time_taken === null) {
      return 'N/A'
    }
    const seconds = Math.floor(score.time_taken / 1000)
    const milliseconds = Math.floor((score.time_taken % 1000) / 100)
    return `${formatNumber(seconds)}.${milliseconds}s`
  }

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000)
    return `${seconds}s`
  }

  const clearTimer = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current)
      timerIntervalRef.current = null
    }
  }, [])

  const startTimer = useCallback(() => {
    if (timerStarted || timerIntervalRef.current) return
    setTimerStarted(true)
    startTimeRef.current = Date.now()
    setElapsedTime(0)
    timerIntervalRef.current = setInterval(() => {
      setElapsedTime(Date.now() - startTimeRef.current)
    }, 1000)
  }, [timerStarted])

  const startGame = useCallback(() => {
    const next = createNewGame()
    setPuzzle(next.puzzle)
    setSolution(next.solution)
    setGrid(next.grid)
    setSelected(firstEmptyCell(next.puzzle))
    setGameState('playing')
    setElapsedTime(0)
    setTimerStarted(false)
    setReady(true)
    hasSubmittedScore.current = false
    startTimeRef.current = 0
    clearTimer()
  }, [clearTimer])

  // Generate puzzle on client only — Math.random() during SSR causes hydration mismatches
  useEffect(() => {
    const next = createNewGame()
    setPuzzle(next.puzzle)
    setSolution(next.solution)
    setGrid(next.grid)
    setSelected(firstEmptyCell(next.puzzle))
    setReady(true)
    return () => clearTimer()
  }, [clearTimer])

  const placeNumber = useCallback((num: number) => {
    if (!ready || gameState !== 'playing' || !selected || num === 0) return
    const [row, col] = selected
    if (puzzle[row][col] !== 0) return

    startTimer()

    const next = cloneGrid(grid)
    next[row][col] = num
    setGrid(next)
    setSelected(nextEmptyCell(puzzle, next, row, col))
  }, [ready, gameState, selected, puzzle, grid, startTimer])

  const clearAndGoPrevious = useCallback(() => {
    if (!ready || gameState !== 'playing' || !selected) return
    const [row, col] = selected
    if (puzzle[row][col] !== 0) return

    const next = cloneGrid(grid)
    next[row][col] = 0
    setGrid(next)
    setSelected(previousEditableCell(puzzle, row, col) ?? [row, col])
  }, [ready, gameState, selected, puzzle, grid])

  const handleCellClick = useCallback((row: number, col: number) => {
    if (!ready || gameState !== 'playing') return
    setSelected([row, col])
  }, [ready, gameState])

  // Same pattern as Maze: finish + submit score in the completion handler
  const handleSubmit = useCallback(() => {
    if (!ready || gameState !== 'playing' || !isFilled(grid)) return

    const finalTime = startTimeRef.current > 0
      ? Date.now() - startTimeRef.current
      : elapsedTime

    setElapsedTime(finalTime)
    clearTimer()
    setSelected(null)
    setGameState('finished')

    // Only save a score when the puzzle is solved correctly (like Maze on reaching exit)
    if (isComplete(grid, solution) && username && !hasSubmittedScore.current) {
      hasSubmittedScore.current = true
      submitSudokuScore({
        username,
        time_taken: finalTime
      }).then(() => {
        setTimeout(() => loadScores(), 1000)
      }).catch(error => {
        console.error('Error submitting score:', error)
        hasSubmittedScore.current = false
      })
    }
  }, [ready, gameState, grid, solution, username, elapsedTime, clearTimer])

  useEffect(() => {
    if (!ready || gameState !== 'playing') return

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '1' && e.key <= '9') {
        placeNumber(Number(e.key))
        return
      }
      if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') {
        e.preventDefault()
        clearAndGoPrevious()
        return
      }

      if (!selected) return
      const [row, col] = selected
      let nextRow = row
      let nextCol = col

      if (e.key === 'ArrowUp') nextRow = Math.max(0, row - 1)
      else if (e.key === 'ArrowDown') nextRow = Math.min(SIZE - 1, row + 1)
      else if (e.key === 'ArrowLeft') nextCol = Math.max(0, col - 1)
      else if (e.key === 'ArrowRight') nextCol = Math.min(SIZE - 1, col + 1)
      else return

      e.preventDefault()
      setSelected([nextRow, nextCol])
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [ready, gameState, selected, placeNumber, clearAndGoPrevious])

  const selectedValue = selected ? grid[selected[0]][selected[1]] : 0
  const boardFilled = ready && isFilled(grid)
  const solved = gameState === 'finished' && isComplete(grid, solution)

  return (
    <GameWrapper
      gameType="Sudoku"
      scores={scores}
      loading={loading}
      onRefresh={loadScores}
      formatScore={formatScore}
      sortKey="time_taken"
      sortDirection="asc"
    >
      <div className="flex flex-col items-center justify-start min-h-[400px] sm:min-h-[600px] pt-8">
        {/* Stats and New Puzzle */}
        <div className="flex justify-between items-center w-full max-w-2xl mb-6 text-sm sm:text-base">
          <div className="text-gray-600 dark:text-gray-400">
            Time:{' '}
            <span className="font-bold text-blue-600 dark:text-blue-400">
              {formatTime(elapsedTime)}
            </span>
          </div>
          <button
            onClick={startGame}
            className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            title="New puzzle"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {/* Game Area */}
        <div className="w-full max-w-2xl mb-6">
          <div className="grid grid-cols-6 w-full aspect-square mb-6">
            {grid.map((row, rowIdx) =>
              row.map((value, colIdx) => {
                const isGiven = puzzle[rowIdx][colIdx] !== 0
                const isSelected = selected?.[0] === rowIdx && selected?.[1] === colIdx
                const isSameNumber = selectedValue !== 0 && value === selectedValue
                const isCorrect = !isGiven && value === solution[rowIdx][colIdx]
                const isIncorrect = !isGiven && value !== 0 && value !== solution[rowIdx][colIdx]

                let textColor = isGiven
                  ? 'text-gray-900 dark:text-gray-100'
                  : 'text-blue-600 dark:text-blue-400'
                if (gameState === 'finished' && !isGiven) {
                  textColor = isCorrect
                    ? 'text-green-600 dark:text-green-400'
                    : isIncorrect
                    ? 'text-red-600 dark:text-red-400'
                    : textColor
                }

                return (
                  <button
                    key={`${rowIdx}-${colIdx}`}
                    type="button"
                    onClick={() => handleCellClick(rowIdx, colIdx)}
                    disabled={gameState !== 'playing'}
                    className={`
                      aspect-square flex items-center justify-center text-base sm:text-xl font-bold
                      transition-colors select-none
                      ${cellBorderClasses(rowIdx, colIdx)}
                      ${gameState === 'playing' && isSelected
                        ? 'bg-blue-200 dark:bg-blue-600/50'
                        : gameState === 'playing' && isSameNumber
                        ? 'bg-blue-50 dark:bg-blue-900/30'
                        : gameState === 'finished' && isIncorrect
                        ? 'bg-red-50 dark:bg-red-900/20'
                        : gameState === 'finished' && isCorrect
                        ? 'bg-green-50 dark:bg-green-900/20'
                        : 'bg-white dark:bg-gray-800'
                      }
                      ${textColor}
                      ${gameState !== 'playing' ? 'cursor-default' : ''}
                    `}
                  >
                    {value !== 0 ? value : ''}
                  </button>
                )
              })
            )}
          </div>

          {gameState === 'finished' ? (
            <div className="text-center">
              <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-gray-700 dark:text-gray-100">
                {solved ? 'Puzzle Complete!' : 'Not quite right'}
              </h2>
              <div className="bg-white dark:bg-gray-700 p-6 sm:p-8 rounded-lg shadow-md mb-6">
                <div className="text-center">
                  <div className="text-3xl sm:text-4xl font-bold text-blue-600 dark:text-blue-400">
                    {formatTime(elapsedTime)}
                  </div>
                  <div className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
                    {solved ? 'Completion Time' : 'Time'}
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
              {/* Number pad */}
              <div className="grid grid-cols-9 gap-1.5 sm:gap-2 mb-4">
                {DIGITS.map(num => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => placeNumber(num)}
                    disabled={!selected || puzzle[selected[0]][selected[1]] !== 0}
                    className="aspect-square border-2 border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 disabled:border-gray-300 disabled:text-gray-400 disabled:hover:bg-transparent dark:disabled:border-gray-600 dark:disabled:text-gray-500 disabled:cursor-not-allowed text-sm sm:text-lg font-bold rounded-lg transition-colors active:scale-95 bg-transparent"
                  >
                    {num}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={!boardFilled}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-semibold shadow-lg transition-colors"
              >
                Submit
              </button>

              <p className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
                Tap a cell, then choose a number — or use keys 1–9
              </p>
            </>
          )}
        </div>
      </div>
    </GameWrapper>
  )
}
