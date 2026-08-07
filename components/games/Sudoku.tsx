'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import GameWrapper from '../GameWrapper'

type GameState = 'playing' | 'finished'
type Grid = number[][] // 0 = empty

const SIZE = 9
const BOX = 3
const DIGITS = [1, 2, 3, 4, 5, 6, 7, 8, 9]
const CLUE_COUNT = 36

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
  // Valid base pattern, then shuffle bands/stacks/digits for variety
  const grid = emptyGrid()
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      grid[r][c] = ((r * BOX + Math.floor(r / BOX) + c) % SIZE) + 1
    }
  }

  // Shuffle rows within each band
  for (let band = 0; band < BOX; band++) {
    const bandRows = [band * BOX, band * BOX + 1, band * BOX + 2]
    const copies = bandRows.map(r => [...grid[r]])
    const order = shuffle([0, 1, 2])
    for (let i = 0; i < BOX; i++) {
      grid[bandRows[i]] = copies[order[i]]
    }
  }

  // Shuffle columns within each stack
  for (let stack = 0; stack < BOX; stack++) {
    const stackCols = [stack * BOX, stack * BOX + 1, stack * BOX + 2]
    const order = shuffle([0, 1, 2])
    const copies = stackCols.map(c => grid.map(row => row[c]))
    for (let i = 0; i < BOX; i++) {
      for (let r = 0; r < SIZE; r++) {
        grid[r][stackCols[i]] = copies[order[i]][r]
      }
    }
  }

  // Shuffle bands
  {
    const order = shuffle([0, 1, 2])
    const copies = [0, 1, 2].map(b =>
      [0, 1, 2].map(i => [...grid[b * BOX + i]])
    )
    for (let b = 0; b < BOX; b++) {
      for (let i = 0; i < BOX; i++) {
        grid[b * BOX + i] = copies[order[b]][i]
      }
    }
  }

  // Shuffle stacks
  {
    const order = shuffle([0, 1, 2])
    const copies = [0, 1, 2].map(s =>
      [0, 1, 2].map(i => grid.map(row => row[s * BOX + i]))
    )
    for (let s = 0; s < BOX; s++) {
      for (let i = 0; i < BOX; i++) {
        for (let r = 0; r < SIZE; r++) {
          grid[r][s * BOX + i] = copies[order[s]][i][r]
        }
      }
    }
  }

  // Remap digits
  const digitMap = shuffle(DIGITS)
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      grid[r][c] = digitMap[grid[r][c] - 1]
    }
  }

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

function hasConflict(grid: Grid, row: number, col: number): boolean {
  const num = grid[row][col]
  if (num === 0) return false

  for (let i = 0; i < SIZE; i++) {
    if (i !== col && grid[row][i] === num) return true
    if (i !== row && grid[i][col] === num) return true
  }

  const boxRow = Math.floor(row / BOX) * BOX
  const boxCol = Math.floor(col / BOX) * BOX
  for (let r = boxRow; r < boxRow + BOX; r++) {
    for (let c = boxCol; c < boxCol + BOX; c++) {
      if ((r !== row || c !== col) && grid[r][c] === num) return true
    }
  }
  return false
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

export default function Sudoku() {
  const [gameState, setGameState] = useState<GameState>('playing')
  const [initial] = useState(createNewGame)
  const [puzzle, setPuzzle] = useState<Grid>(initial.puzzle)
  const [solution, setSolution] = useState<Grid>(initial.solution)
  const [grid, setGrid] = useState<Grid>(initial.grid)
  const [selected, setSelected] = useState<[number, number] | null>(null)
  const [elapsedTime, setElapsedTime] = useState(0)
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const startTimeRef = useRef(0)

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
    clearTimer()
    startTimeRef.current = Date.now()
    setElapsedTime(0)
    timerIntervalRef.current = setInterval(() => {
      setElapsedTime(Date.now() - startTimeRef.current)
    }, 1000)
  }, [clearTimer])

  useEffect(() => {
    startTimer()
    return () => clearTimer()
  }, [startTimer, clearTimer])

  const startGame = useCallback(() => {
    const next = createNewGame()
    setPuzzle(next.puzzle)
    setSolution(next.solution)
    setGrid(next.grid)
    setSelected(null)
    setGameState('playing')
    startTimer()
  }, [startTimer])

  const placeNumber = useCallback((num: number) => {
    if (gameState !== 'playing' || !selected) return
    const [row, col] = selected
    if (puzzle[row][col] !== 0) return

    const next = cloneGrid(grid)
    next[row][col] = num
    setGrid(next)

    if (num !== 0 && isComplete(next, solution)) {
      setElapsedTime(Date.now() - startTimeRef.current)
      clearTimer()
      setGameState('finished')
    }
  }, [gameState, selected, puzzle, solution, grid, clearTimer])

  const handleCellClick = useCallback((row: number, col: number) => {
    if (gameState !== 'playing') return
    setSelected([row, col])
  }, [gameState])

  useEffect(() => {
    if (gameState !== 'playing') return

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '1' && e.key <= '9') {
        placeNumber(Number(e.key))
        return
      }
      if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') {
        placeNumber(0)
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
  }, [gameState, selected, placeNumber])

  const selectedValue = selected ? grid[selected[0]][selected[1]] : 0

  return (
    <GameWrapper
      gameType="Sudoku"
      scores={[]}
      loading={false}
      onRefresh={async () => {}}
      formatScore={() => ''}
      sortKey=""
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
          {gameState === 'finished' ? (
            <div className="text-center">
              <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-gray-700 dark:text-gray-100">
                Puzzle Complete!
              </h2>
              <div className="bg-white dark:bg-gray-700 p-6 sm:p-8 rounded-lg shadow-md mb-6">
                <div className="text-center">
                  <div className="text-3xl sm:text-4xl font-bold text-blue-600 dark:text-blue-400">
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
              <div className="grid grid-cols-9 w-full aspect-square mb-6">
                {grid.map((row, rowIdx) =>
                  row.map((value, colIdx) => {
                    const isGiven = puzzle[rowIdx][colIdx] !== 0
                    const isSelected = selected?.[0] === rowIdx && selected?.[1] === colIdx
                    const isSameNumber = selectedValue !== 0 && value === selectedValue
                    const conflict = !isGiven && value !== 0 && hasConflict(grid, rowIdx, colIdx)

                    return (
                      <button
                        key={`${rowIdx}-${colIdx}`}
                        type="button"
                        onClick={() => handleCellClick(rowIdx, colIdx)}
                        className={`
                          aspect-square flex items-center justify-center text-base sm:text-xl font-bold
                          transition-colors select-none
                          ${cellBorderClasses(rowIdx, colIdx)}
                          ${isSelected
                            ? 'bg-blue-200 dark:bg-blue-600/50'
                            : isSameNumber
                            ? 'bg-blue-50 dark:bg-blue-900/30'
                            : 'bg-white dark:bg-gray-800'
                          }
                          ${conflict ? 'text-red-500 dark:text-red-400' : ''}
                          ${isGiven
                            ? 'text-gray-900 dark:text-gray-100'
                            : !conflict
                            ? 'text-blue-600 dark:text-blue-400'
                            : ''
                          }
                        `}
                      >
                        {value !== 0 ? value : ''}
                      </button>
                    )
                  })
                )}
              </div>

              {/* Number pad */}
              <div className="w-full space-y-2">
                <div className="grid grid-cols-9 gap-1.5 sm:gap-2">
                  {DIGITS.map(num => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => placeNumber(num)}
                      disabled={!selected || puzzle[selected[0]][selected[1]] !== 0}
                      className="aspect-square bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white text-sm sm:text-lg font-bold rounded-lg shadow-lg transition-colors active:scale-95"
                    >
                      {num}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => placeNumber(0)}
                  disabled={!selected || puzzle[selected[0]][selected[1]] !== 0}
                  className="w-full py-3 bg-gray-500 hover:bg-gray-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white text-sm sm:text-base font-semibold rounded-lg shadow-lg transition-colors active:scale-95"
                  aria-label="Clear cell"
                >
                  Clear
                </button>
              </div>

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
