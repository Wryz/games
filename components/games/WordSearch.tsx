'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { getWordSearchScores, submitWordSearchScore } from '@/lib/scores'
import { useUser } from '@/contexts/UserContext'
import { supabase } from '@/lib/supabase'
import GameWrapper from '../GameWrapper'
import type { WordSearchScore } from '@/lib/supabase'
import { WordSearchIcon } from '../icons/GameIcons'
import { formatNumber } from '@/lib/levels'
import words from 'an-array-of-english-words'

type GameState = 'idle' | 'playing' | 'finished'

const GRID_SIZE = 8
const GAME_TIME = 60 // seconds

// Use comprehensive word list, filter to 3-8 letters for word search (8x8 grid)
const WORD_LIST = words
  .map(word => word.toLowerCase())
  .filter(word => word.length >= 3 && word.length <= 8)

interface Cell {
  row: number
  col: number
  letter: string
  isSelected: boolean
  isFound: boolean
  foundWord?: string // Track which word this cell belongs to
}

export default function WordSearch() {
  const [scores, setScores] = useState<WordSearchScore[]>([])
  const [loading, setLoading] = useState(true)
  const [gameState, setGameState] = useState<GameState>('playing')
  const [grid, setGrid] = useState<Cell[][]>([])
  const [selectedCells, setSelectedCells] = useState<Cell[]>([])
  const [foundWords, setFoundWords] = useState<Set<string>>(new Set())
  const [foundWordPaths, setFoundWordPaths] = useState<Map<string, Cell[]>>(new Map())
  const [timeLeft, setTimeLeft] = useState(GAME_TIME)
  const [isDragging, setIsDragging] = useState(false)
  const [wordsInGrid, setWordsInGrid] = useState<string[]>([])
  const [timerStarted, setTimerStarted] = useState(false)
  const { username } = useUser()
  const hasSubmittedScore = useRef(false)
  const gridRef = useRef<HTMLDivElement>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const loadScores = async () => {
    try {
      setLoading(true)
      const data = await getWordSearchScores({ limit: 50 })
      setScores(data || [])
    } catch (error) {
      console.error('Error loading scores:', error)
      setScores([])
    } finally {
      setLoading(false)
    }
  }

  // Generate a random letter
  const getRandomLetter = () => {
    return String.fromCharCode(65 + Math.floor(Math.random() * 26))
  }

  // Check if a path is valid (straight line: left-to-right, top-to-bottom, or top-left to bottom-right only)
  const isValidPath = (cells: Cell[]): boolean => {
    if (cells.length < 2) return false
    
    const first = cells[0]
    const last = cells[cells.length - 1]
    
    const rowDiff = last.row - first.row
    const colDiff = last.col - first.col
    
    // Only allow: left-to-right (rowDiff === 0, colDiff > 0), top-to-bottom (colDiff === 0, rowDiff > 0), 
    // or diagonal top-left to bottom-right (rowDiff > 0, colDiff > 0, rowDiff === colDiff)
    if (rowDiff === 0 && colDiff > 0) {
      // Horizontal left-to-right
      for (let i = 0; i < cells.length; i++) {
        if (cells[i].col !== first.col + i || cells[i].row !== first.row) {
          return false
        }
      }
      return true
    } else if (colDiff === 0 && rowDiff > 0) {
      // Vertical top-to-bottom
      for (let i = 0; i < cells.length; i++) {
        if (cells[i].row !== first.row + i || cells[i].col !== first.col) {
          return false
        }
      }
      return true
    } else if (rowDiff > 0 && colDiff > 0 && rowDiff === colDiff) {
      // Diagonal top-left to bottom-right
      for (let i = 0; i < cells.length; i++) {
        if (cells[i].row !== first.row + i || cells[i].col !== first.col + i) {
          return false
        }
      }
      return true
    }
    
    return false
  }

  // Generate word search grid
  const generateGrid = useCallback((): { grid: Cell[][], words: string[] } => {
    // Select random words (6-10 words for 8x8 grid)
    const numWords = Math.floor(Math.random() * 5) + 6
    const selectedWords = [...WORD_LIST]
      .sort(() => Math.random() - 0.5)
      .slice(0, numWords)
      .map(w => w.toUpperCase())
    
    // Initialize empty grid
    const newGrid: Cell[][] = []
    for (let row = 0; row < GRID_SIZE; row++) {
      newGrid[row] = []
      for (let col = 0; col < GRID_SIZE; col++) {
        newGrid[row][col] = {
          row,
          col,
          letter: '',
          isSelected: false,
          isFound: false
        }
      }
    }

    // Directions: left-to-right, top-to-bottom, top-left to bottom-right only
    const directions = [
      { dr: 0, dc: 1 },   // horizontal left-to-right
      { dr: 1, dc: 0 },   // vertical top-to-bottom
      { dr: 1, dc: 1 }    // diagonal top-left to bottom-right
    ]

    const placedWords: string[] = []

    // Try to place each word
    for (const word of selectedWords) {
      let placed = false
      let attempts = 0
      
      while (!placed && attempts < 200) {
        attempts++
        const direction = directions[Math.floor(Math.random() * directions.length)]
        
        // Calculate valid start positions to ensure word fits in 8x8 grid
        let maxStartRow = GRID_SIZE - 1
        let maxStartCol = GRID_SIZE - 1
        
        if (direction.dr > 0) {
          // Vertical or diagonal: need room for word.length rows
          maxStartRow = GRID_SIZE - word.length
        }
        if (direction.dc > 0) {
          // Horizontal or diagonal: need room for word.length cols
          maxStartCol = GRID_SIZE - word.length
        }
        
        // Ensure we have valid positions
        if (maxStartRow < 0 || maxStartCol < 0) {
          continue // Word is too long for this direction, skip
        }
        
        const startRow = Math.floor(Math.random() * (maxStartRow + 1))
        const startCol = Math.floor(Math.random() * (maxStartCol + 1))
        
        // Double-check that word fits (safety check)
        const endRow = startRow + direction.dr * (word.length - 1)
        const endCol = startCol + direction.dc * (word.length - 1)
        
        if (endRow >= 0 && endRow < GRID_SIZE && endCol >= 0 && endCol < GRID_SIZE) {
          // Check if cells are empty or have matching letters
          let canPlace = true
          for (let i = 0; i < word.length; i++) {
            const row = startRow + direction.dr * i
            const col = startCol + direction.dc * i
            const cell = newGrid[row][col]
            if (cell.letter !== '' && cell.letter !== word[i]) {
              canPlace = false
              break
            }
          }
          
          if (canPlace) {
            // Place the word
            for (let i = 0; i < word.length; i++) {
              const row = startRow + direction.dr * i
              const col = startCol + direction.dc * i
              newGrid[row][col].letter = word[i]
            }
            placedWords.push(word)
            placed = true
          }
        }
      }
    }

    // Fill remaining cells with random letters
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        if (newGrid[row][col].letter === '') {
          newGrid[row][col].letter = getRandomLetter()
        }
      }
    }

    return { grid: newGrid, words: placedWords }
  }, [])

  // Get cell from coordinates
  const getCellFromPoint = (clientX: number, clientY: number): Cell | null => {
    if (!gridRef.current) return null
    
    const rect = gridRef.current.getBoundingClientRect()
    const cellSize = rect.width / GRID_SIZE
    
    const col = Math.floor((clientX - rect.left) / cellSize)
    const row = Math.floor((clientY - rect.top) / cellSize)
    
    if (row >= 0 && row < GRID_SIZE && col >= 0 && col < GRID_SIZE) {
      return grid[row][col]
    }
    
    return null
  }

  // Handle mouse/touch start
  const handleStart = useCallback((clientX: number, clientY: number) => {
    if (gameState !== 'playing' || grid.length === 0) return
    
    const cell = getCellFromPoint(clientX, clientY)
    if (cell) {
      setIsDragging(true)
      setSelectedCells([cell])
      setGrid(prev => prev.map(row => 
        row.map(c => c.row === cell.row && c.col === cell.col 
          ? { ...c, isSelected: true }
          : { ...c, isSelected: false }
        )
      ))
    }
  }, [gameState, grid])

  // Handle mouse/touch move
  const handleMove = useCallback((clientX: number, clientY: number) => {
    if (!isDragging || gameState !== 'playing' || grid.length === 0) return
    
    const cell = getCellFromPoint(clientX, clientY)
    if (!cell) return
    
    // Check if new cell is adjacent to last selected cell
    const lastCell = selectedCells[selectedCells.length - 1]
    const rowDiff = cell.row - lastCell.row
    const colDiff = cell.col - lastCell.col
    const absRowDiff = Math.abs(rowDiff)
    const absColDiff = Math.abs(colDiff)
    
    // Must be adjacent (within 1 cell in any direction)
    if (absRowDiff <= 1 && absColDiff <= 1 && (absRowDiff + absColDiff > 0)) {
      // Check if this is a diagonal move
      const isDiagonalMove = rowDiff !== 0 && colDiff !== 0
      
      // If we have exactly 2 cells, check if we should switch direction
      if (selectedCells.length === 2) {
        const first = selectedCells[0]
        const second = selectedCells[1]
        const establishedRowDir = second.row - first.row
        const establishedColDir = second.col - first.col
        const wasHorizontal = establishedRowDir === 0 && establishedColDir !== 0
        const wasVertical = establishedRowDir !== 0 && establishedColDir === 0
        
        // If user was going horizontal/vertical and moves perpendicular, replace second cell
        if (wasHorizontal) {
          // Was horizontal - if user moves up or down (perpendicular), replace second cell
          if (rowDiff !== 0 && colDiff === 0) {
            // User moved vertically - replace second cell with the perpendicular cell
            const newSelected = [first, cell]
            setSelectedCells(newSelected)
            setGrid(prev => prev.map(row => 
              row.map(c => {
                const isSelected = newSelected.some(sc => sc.row === c.row && sc.col === c.col)
                return { ...c, isSelected }
              })
            ))
            return
          }
        } else if (wasVertical) {
          // Was vertical - if user moves left or right (perpendicular), replace second cell
          if (rowDiff === 0 && colDiff !== 0) {
            // User moved horizontally - replace second cell with the perpendicular cell
            const newSelected = [first, cell]
            setSelectedCells(newSelected)
            setGrid(prev => prev.map(row => 
              row.map(c => {
                const isSelected = newSelected.some(sc => sc.row === c.row && sc.col === c.col)
                return { ...c, isSelected }
              })
            ))
            return
          }
        }
      }
      
      // Normal path continuation logic
      if (!selectedCells.find(c => c.row === cell.row && c.col === cell.col)) {
        const newSelected = [...selectedCells, cell]
        const testPath = newSelected
        
        // If we have at least 2 cells, check the established direction
        if (selectedCells.length >= 2) {
          const first = selectedCells[0]
          const second = selectedCells[1]
          const establishedRowDir = second.row - first.row
          const establishedColDir = second.col - first.col
          
          // If we've established a diagonal direction, prefer diagonal moves
          if (establishedRowDir !== 0 && establishedColDir !== 0) {
            // Diagonal established - allow if it continues diagonal direction
            if (rowDiff === establishedRowDir && colDiff === establishedColDir) {
              // Perfect diagonal continuation
              setSelectedCells(newSelected)
              setGrid(prev => prev.map(row => 
                row.map(c => {
                  const isSelected = newSelected.some(sc => sc.row === c.row && sc.col === c.col)
                  return { ...c, isSelected }
                })
              ))
              return
            }
            // For diagonal, be more lenient - allow if it's still diagonal
            if (rowDiff !== 0 && colDiff !== 0) {
              // Still diagonal, check if it maintains reasonable diagonal path
              if (isValidPath(testPath)) {
                setSelectedCells(newSelected)
                setGrid(prev => prev.map(row => 
                  row.map(c => {
                    const isSelected = newSelected.some(sc => sc.row === c.row && sc.col === c.col)
                    return { ...c, isSelected }
                  })
                ))
                return
              }
            }
            // If trying to go horizontal/vertical when diagonal is established, reject
            return
          } else {
            // Horizontal or vertical established - check if it maintains that direction
            if (isValidPath(testPath)) {
              setSelectedCells(newSelected)
              setGrid(prev => prev.map(row => 
                row.map(c => {
                  const isSelected = newSelected.some(sc => sc.row === c.row && sc.col === c.col)
                  return { ...c, isSelected }
                })
              ))
              return
            }
          }
        } else {
          // First or second cell - allow any valid direction
          if (isValidPath(testPath)) {
            setSelectedCells(newSelected)
            setGrid(prev => prev.map(row => 
              row.map(c => {
                const isSelected = newSelected.some(sc => sc.row === c.row && sc.col === c.col)
                return { ...c, isSelected }
              })
            ))
          }
        }
      }
    }
  }, [isDragging, gameState, selectedCells, grid])

  // Mouse event handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    handleStart(e.clientX, e.clientY)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      e.preventDefault()
      handleMove(e.clientX, e.clientY)
    }
  }

  const handleMouseUp = () => {
    handleEnd()
  }

  // Touch event handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault()
    const touch = e.touches[0]
    handleStart(touch.clientX, touch.clientY)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isDragging) {
      e.preventDefault()
      const touch = e.touches[0]
      handleMove(touch.clientX, touch.clientY)
    }
  }

  const handleTouchEnd = () => {
    handleEnd()
  }

  // Start timer (only called when first word is found)
  const startTimer = useCallback(() => {
    if (timerStarted || timerRef.current) return // Already started
    
    setTimerStarted(true)
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setGameState('finished')
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }, [timerStarted])

  // Reset game
  const resetGame = useCallback(() => {
    const { grid: newGrid, words: newWords } = generateGrid()
    setGrid(newGrid)
    setWordsInGrid(newWords)
    setFoundWords(new Set())
    setFoundWordPaths(new Map())
    setSelectedCells([])
    setTimeLeft(GAME_TIME)
    setGameState('playing')
    setTimerStarted(false)
    hasSubmittedScore.current = false

    // Clear any existing timer
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [generateGrid])

  // Calculate outline path for a word
  const getWordOutlinePath = (cells: Cell[], cellSize: number, gap: number, padding: number): string => {
    if (cells.length === 0) return ''
    
    // Calculate positions for each cell
    const positions = cells.map(cell => ({
      x: cell.col * (cellSize + gap) + padding,
      y: cell.row * (cellSize + gap) + padding,
      size: cellSize
    }))
    
    // Determine direction
    const first = cells[0]
    const last = cells[cells.length - 1]
    const isHorizontal = first.row === last.row
    const isVertical = first.col === last.col
    const isDiagonal = !isHorizontal && !isVertical
    
    if (isDiagonal) {
      // For diagonal words, create a path that follows the diagonal cells
      // Trace around the perimeter of the connected diagonal cells
      const pathPoints: { x: number, y: number }[] = []
      
      // Start from top-left of first cell
      const firstPos = positions[0]
      pathPoints.push({ x: firstPos.x, y: firstPos.y })
      
      // Go along the top edge - connect top-right corners of each cell
      for (let i = 0; i < positions.length; i++) {
        const pos = positions[i]
        pathPoints.push({ x: pos.x + pos.size, y: pos.y })
      }
      
      // Go to bottom-right of last cell
      const lastPos = positions[positions.length - 1]
      pathPoints.push({ x: lastPos.x + lastPos.size, y: lastPos.y + lastPos.size })
      
      // Go back along the bottom edge - connect bottom-left corners
      for (let i = positions.length - 1; i >= 0; i--) {
        const pos = positions[i]
        pathPoints.push({ x: pos.x, y: pos.y + pos.size })
      }
      
      // Build SVG path
      if (pathPoints.length > 0) {
        let path = `M ${pathPoints[0].x} ${pathPoints[0].y} `
        for (let i = 1; i < pathPoints.length; i++) {
          path += `L ${pathPoints[i].x} ${pathPoints[i].y} `
        }
        path += 'Z'
        return path
      }
    } else {
      // For horizontal/vertical, use bounding box
      const minX = Math.min(...positions.map(p => p.x))
      const maxX = Math.max(...positions.map(p => p.x + p.size))
      const minY = Math.min(...positions.map(p => p.y))
      const maxY = Math.max(...positions.map(p => p.y + p.size))
      
      const cornerRadius = 4
      const path = `
        M ${minX + cornerRadius} ${minY}
        L ${maxX - cornerRadius} ${minY}
        Q ${maxX} ${minY} ${maxX} ${minY + cornerRadius}
        L ${maxX} ${maxY - cornerRadius}
        Q ${maxX} ${maxY} ${maxX - cornerRadius} ${maxY}
        L ${minX + cornerRadius} ${maxY}
        Q ${minX} ${maxY} ${minX} ${maxY - cornerRadius}
        L ${minX} ${minY + cornerRadius}
        Q ${minX} ${minY} ${minX + cornerRadius} ${minY}
        Z
      `.trim().replace(/\s+/g, ' ')
      
      return path
    }
    
    return ''
  }

  // Handle mouse/touch end (moved after startTimer definition)
  const handleEnd = useCallback(() => {
    if (!isDragging || gameState !== 'playing' || grid.length === 0) return
    
    setIsDragging(false)
    
    // Start timer on first drag operation completion
    if (!timerStarted) {
      startTimer()
    }
    
    if (selectedCells.length >= 3) {
      // Build word from selected cells
      const word = selectedCells.map(c => c.letter).join('')
      const reversedWord = selectedCells.map(c => c.letter).reverse().join('')
      
      // Check if word is valid (in grid or in dictionary)
      const wordLower = word.toLowerCase()
      const reversedWordLower = reversedWord.toLowerCase()
      
      // Check if word exists in grid (case-insensitive)
      const gridWordsLower = wordsInGrid.map(w => w.toLowerCase())
      const isInGrid = gridWordsLower.includes(wordLower) || gridWordsLower.includes(reversedWordLower)
      
      // Check if word exists in dictionary
      const isInDictionary = WORD_LIST.includes(wordLower) || WORD_LIST.includes(reversedWordLower)
      const isValidWord = isInGrid || isInDictionary
      
      // Determine which word to use (prefer grid word, then dictionary word)
      let wordToCheck: string
      if (gridWordsLower.includes(wordLower)) {
        wordToCheck = wordsInGrid.find(w => w.toLowerCase() === wordLower) || word
      } else if (gridWordsLower.includes(reversedWordLower)) {
        wordToCheck = wordsInGrid.find(w => w.toLowerCase() === reversedWordLower) || reversedWord
      } else if (WORD_LIST.includes(wordLower)) {
        wordToCheck = word
      } else {
        wordToCheck = reversedWord
      }
      
      const wordToStore = wordToCheck.toLowerCase()
      if (isValidWord && !foundWords.has(wordToStore)) {
        // Mark cells as found and store the path
        setFoundWords(prev => {
          const newSet = new Set(prev)
          newSet.add(wordToStore)
          return newSet
        })
        setFoundWordPaths(prev => {
          const newMap = new Map(prev)
          newMap.set(wordToStore, [...selectedCells])
          return newMap
        })
        setGrid(prev => prev.map(row => 
          row.map(c => {
            const isInPath = selectedCells.some(sc => sc.row === c.row && c.col === sc.col)
            return isInPath ? { ...c, isFound: true, foundWord: wordToStore, isSelected: false } : { ...c, isSelected: false }
          })
        ))
      } else {
        // Clear selection
        setGrid(prev => prev.map(row => 
          row.map(c => ({ ...c, isSelected: false }))
        ))
      }
    } else {
      // Clear selection
      setGrid(prev => prev.map(row => 
        row.map(c => ({ ...c, isSelected: false }))
      ))
    }
    
    setSelectedCells([])
  }, [isDragging, gameState, selectedCells, wordsInGrid, foundWords, startTimer, grid.length, timerStarted])

  // Submit score when game finishes
  useEffect(() => {
    if (gameState === 'finished' && username && !hasSubmittedScore.current) {
      hasSubmittedScore.current = true
      
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
      
      // Calculate total characters found
      const totalCharacters = Array.from(foundWords).reduce((sum, word) => sum + word.length, 0)
      
      submitWordSearchScore({
        username,
        characters_found: totalCharacters
      }).then(() => {
        setTimeout(() => loadScores(), 1000)
      }).catch(error => {
        console.error('Error submitting score:', error)
        hasSubmittedScore.current = false
      })
    }
  }, [gameState, foundWords, username, loadScores])

  // Cleanup timer
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [])

  useEffect(() => {
    loadScores()
    
    // Generate initial grid
    const { grid: newGrid, words: newWords } = generateGrid()
    setGrid(newGrid)
    setWordsInGrid(newWords)
    
    // Set up realtime listener
    const channel = supabase
      .channel('word_search_scores_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'word_search_scores'
        },
        (payload) => {
          console.log('New word search score:', payload.new)
          setScores(prev => [payload.new as WordSearchScore, ...prev.slice(0, 49)])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [generateGrid])

  const formatScore = (score: WordSearchScore) => {
    return `${formatNumber(score.characters_found)} characters`
  }

  return (
    <GameWrapper
      gameType="Word Search"
      scores={scores}
      loading={loading}
      onRefresh={loadScores}
      formatScore={formatScore}
      sortKey="characters_found"
      sortDirection="desc"
    >
      <div className="flex flex-col items-center justify-start min-h-[400px] sm:min-h-[600px] pt-8">
        {/* Stats */}
        <div className="flex justify-between items-center w-full max-w-2xl mb-6 text-sm sm:text-base">
          <div className="text-gray-600 dark:text-gray-400">
            Characters: <span className="font-bold text-green-600 dark:text-green-400">
              {formatNumber(Array.from(foundWords).reduce((sum, word) => sum + word.length, 0))}
            </span>
          </div>
          <div className="text-gray-600 dark:text-gray-400">
            Time: <span className={`font-bold ${timeLeft <= 10 ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'}`}>
              {timeLeft}s
            </span>
          </div>
          <button
            onClick={resetGame}
            className="px-4 py-2 rounded-lg font-semibold transition-colors bg-blue-600 hover:bg-blue-700 text-white"
          >
            Play Again
          </button>
        </div>

        {/* Game Area */}
        {grid.length > 0 && (
          <div className="w-full max-w-2xl">
            {/* Grid Container with SVG Overlay */}
            <div className="relative">
              {/* Grid */}
              <div
                ref={gridRef}
                className="grid grid-cols-8 gap-1 select-none touch-none"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
              >
                {grid.map((row, rowIdx) =>
                  row.map((cell, colIdx) => (
                    <div
                      key={`${rowIdx}-${colIdx}`}
                      className={`
                        aspect-square flex items-center justify-center text-lg sm:text-xl font-bold rounded
                        transition-all duration-150
                        ${cell.isSelected
                          ? 'bg-blue-500 text-white scale-110 shadow-lg'
                          : cell.isFound
                          ? 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 opacity-70'
                          : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }
                      `}
                    >
                      {cell.letter}
                    </div>
                  ))
                )}
              </div>
              
              {/* SVG Overlay for Word Outlines */}
              {foundWordPaths.size > 0 && gridRef.current && (() => {
                const gridRect = gridRef.current.getBoundingClientRect()
                const cellSize = (gridRect.width - 7 * 4) / 8 // Account for gaps (8x8 grid, no padding)
                const gap = 4 // gap-1 = 4px
                const padding = 0 // No padding
                
                return (
                  <svg
                    className="absolute top-0 left-0 pointer-events-none"
                    width={gridRect.width}
                    height={gridRect.height}
                    style={{ zIndex: 10 }}
                  >
                    {Array.from(foundWordPaths.entries()).map(([word, cells]) => {
                      const path = getWordOutlinePath(cells, cellSize, gap, padding)
                      return (
                        <path
                          key={word}
                          d={path}
                          fill="none"
                          stroke="rgba(74, 222, 128, 0.2)"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      )
                    })}
                  </svg>
                )
              })()}
            </div>

            {/* Found Words List */}
            {foundWords.size > 0 && (
              <div className="mt-4 p-4 bg-white dark:bg-gray-800 rounded-lg">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Words Found:
                </h3>
                <div className="flex flex-wrap gap-2">
                  {Array.from(foundWords).map((word, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full text-sm font-medium"
                    >
                      {word}
                    </span>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}
      </div>
    </GameWrapper>
  )
}
