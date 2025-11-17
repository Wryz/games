'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { PatternRecognitionIcon } from '../icons/GameIcons'
import { getPatternRecognitionScores, submitPatternRecognitionScore } from '@/lib/scores'
import { useUser } from '@/contexts/UserContext'
import { supabase } from '@/lib/supabase'
import GameWrapper from '../GameWrapper'
import type { PatternRecognitionScore } from '@/lib/supabase'

type GameState = 'idle' | 'playing' | 'correct' | 'wrong' | 'finished'

// Shape SVG components with unique colors
const shapes = [
  {
    id: 'circle',
    name: 'Circle',
    color: 'text-red-600 dark:text-red-400',
    svg: (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <circle cx="50" cy="50" r="40" fill="currentColor" />
      </svg>
    )
  },
  {
    id: 'square',
    name: 'Square',
    color: 'text-blue-600 dark:text-blue-400',
    svg: (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <rect x="10" y="10" width="80" height="80" fill="currentColor" />
      </svg>
    )
  },
  {
    id: 'triangle',
    name: 'Triangle',
    color: 'text-green-600 dark:text-green-400',
    svg: (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <polygon points="50,15 90,85 10,85" fill="currentColor" />
      </svg>
    )
  },
  {
    id: 'star',
    name: 'Star',
    color: 'text-yellow-600 dark:text-yellow-400',
    svg: (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <polygon points="50,10 61,40 92,40 67,60 78,90 50,70 22,90 33,60 8,40 39,40" fill="currentColor" />
      </svg>
    )
  },
  {
    id: 'pentagon',
    name: 'Pentagon',
    color: 'text-purple-600 dark:text-purple-400',
    svg: (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <polygon points="50,10 90,40 75,85 25,85 10,40" fill="currentColor" />
      </svg>
    )
  },
  {
    id: 'hexagon',
    name: 'Hexagon',
    color: 'text-pink-600 dark:text-pink-400',
    svg: (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <polygon points="50,10 85,30 85,70 50,90 15,70 15,30" fill="currentColor" />
      </svg>
    )
  },
  {
    id: 'diamond',
    name: 'Diamond',
    color: 'text-orange-600 dark:text-orange-400',
    svg: (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <polygon points="50,10 90,50 50,90 10,50" fill="currentColor" />
      </svg>
    )
  },
  {
    id: 'heart',
    name: 'Heart',
    color: 'text-rose-600 dark:text-rose-400',
    svg: (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <path d="M50,85 C50,85 15,60 15,40 C15,25 25,15 35,15 C42,15 47,20 50,25 C53,20 58,15 65,15 C75,15 85,25 85,40 C85,60 50,85 50,85 Z" fill="currentColor" />
      </svg>
    )
  },
  {
    id: 'octagon',
    name: 'Octagon',
    color: 'text-cyan-600 dark:text-cyan-400',
    svg: (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <polygon points="30,10 70,10 90,30 90,70 70,90 30,90 10,70 10,30" fill="currentColor" />
      </svg>
    )
  }
]

type PatternType = 'simple' | 'alternating' | 'progressive' | 'repeating' | 'reverse' | 'skip' | 'mirror'

// Available colors for random assignment
const availableColors = [
  'text-red-600 dark:text-red-400',
  'text-blue-600 dark:text-blue-400',
  'text-green-600 dark:text-green-400',
  'text-yellow-600 dark:text-yellow-400',
  'text-purple-600 dark:text-purple-400',
  'text-pink-600 dark:text-pink-400',
  'text-orange-600 dark:text-orange-400',
  'text-rose-600 dark:text-rose-400',
  'text-cyan-600 dark:text-cyan-400',
]

// Pattern item with shape and color
type PatternItem = {
  shapeId: string
  color: string
}

export default function PatternRecognition() {
  const [scores, setScores] = useState<PatternRecognitionScore[]>([])
  const [loading, setLoading] = useState(true)
  const [gameState, setGameState] = useState<GameState>('idle')
  const [pattern, setPattern] = useState<PatternItem[]>([])
  const [patternType, setPatternType] = useState<PatternType>('simple')
  const [difficultyLevel, setDifficultyLevel] = useState(1)
  const [patternsSolved, setPatternsSolved] = useState(0)
  const [gameStartTime, setGameStartTime] = useState<number>(0)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [userAnswer, setUserAnswer] = useState<string | null>(null)
  const [selectedShapes, setSelectedShapes] = useState<string[]>([])
  const [feedbackShape, setFeedbackShape] = useState<string | null>(null)
  const [feedbackType, setFeedbackType] = useState<'correct' | 'wrong' | null>(null)
  const [finalResults, setFinalResults] = useState<{ patternsSolved: number; timeTaken: number; level: number } | null>(null)
  const [shapeColorMap, setShapeColorMap] = useState<Record<string, string>>({})
  const { username } = useUser()
  const hasSubmittedScore = useRef(false)
  const timerInterval = useRef<NodeJS.Timeout | null>(null)
  const currentAnswerRef = useRef<string | string[] | null>(null)
  const feedbackTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const loadScores = async () => {
    try {
      setLoading(true)
      const data = await getPatternRecognitionScores({ limit: 50 })
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
      .channel('pattern_recognition_scores_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'pattern_recognition_scores'
        },
        (payload) => {
          console.log('New pattern recognition score:', payload.new)
          setScores(prev => [payload.new as PatternRecognitionScore, ...prev.slice(0, 49)])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
      if (timerInterval.current) {
        clearInterval(timerInterval.current)
      }
      if (feedbackTimeoutRef.current) {
        clearTimeout(feedbackTimeoutRef.current)
      }
    }
  }, [])

  // Timer effect - runs continuously from game start
  useEffect(() => {
    if (gameState === 'playing' && gameStartTime > 0) {
      timerInterval.current = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - gameStartTime) / 1000))
      }, 100)
    } else {
      if (timerInterval.current) {
        clearInterval(timerInterval.current)
        timerInterval.current = null
      }
    }

    return () => {
      if (timerInterval.current) {
        clearInterval(timerInterval.current)
      }
    }
  }, [gameState, gameStartTime])

  const formatScore = (score: PatternRecognitionScore) => {
    return `${score.patterns_solved} patterns (${score.time_taken}s)`
  }

  // Generate pattern based on difficulty
  const generatePattern = useCallback((level: number): { pattern: PatternItem[], type: PatternType, answer: string | string[], colorMap: Record<string, string> } => {
    // Increase pattern length more gradually - slower growth
    const baseLength = Math.min(3 + Math.floor(level / 3), 6)
    // Pattern types unlock much more slowly - keep simple patterns longer
    // After all types are unlocked (level 24+), cycle through them to prevent repetition
    const allTypes: PatternType[] = ['simple', 'alternating', 'progressive', 'repeating', 'reverse', 'skip', 'mirror']
    const unlockLevel = Math.floor(level / 4)
    // Cycle through types: first 7 levels unlock each type, then cycle
    const typeIndex = unlockLevel % allTypes.length
    const type = allTypes[typeIndex]
    
    // Helper to assign random color to a shape
    const assignRandomColor = (): string => {
      return availableColors[Math.floor(Math.random() * availableColors.length)]
    }
    
    let shapePattern: string[] = []
    let answer: string | string[]
    // For higher levels (8+), require 2 shapes as answer
    const requiresTwoShapes = level >= 8

    switch (type) {
      case 'simple':
        // Simple sequence: same shape repeated (only for very early levels)
        if (level <= 2) {
          const shape = shapes[Math.floor(Math.random() * shapes.length)]
          shapePattern = Array(baseLength).fill(shape.id)
          answer = shape.id
        } else {
          // After level 2, make it alternating
          const shapePair = [
            shapes[Math.floor(Math.random() * shapes.length)],
            shapes[Math.floor(Math.random() * shapes.length)]
          ]
          while (shapePair[0].id === shapePair[1].id) {
            shapePair[1] = shapes[Math.floor(Math.random() * shapes.length)]
          }
          shapePattern = Array(baseLength).fill(0).map((_, i) => shapePair[i % 2].id)
          answer = shapePair[baseLength % 2].id
        }
        break

      case 'alternating':
        // Alternating pattern: A, B, A, B, ...
        const shapePair = [
          shapes[Math.floor(Math.random() * shapes.length)],
          shapes[Math.floor(Math.random() * shapes.length)]
        ]
        while (shapePair[0].id === shapePair[1].id) {
          shapePair[1] = shapes[Math.floor(Math.random() * shapes.length)]
        }
        shapePattern = Array(baseLength).fill(0).map((_, i) => shapePair[i % 2].id)
        // For higher levels, return both shapes in the pair
        if (requiresTwoShapes) {
          answer = [shapePair[0].id, shapePair[1].id]
        } else {
          answer = shapePair[baseLength % 2].id
        }
        break

      case 'progressive':
        // Progressive: sequential shapes in order (A, B, C, A, B, C, ...)
        // Use exactly 3 shapes for clarity
        const progressiveShapes: string[] = []
        const availableForProgressive = [...shapes]
        for (let i = 0; i < 3; i++) {
          const randomIdx = Math.floor(Math.random() * availableForProgressive.length)
          progressiveShapes.push(availableForProgressive[randomIdx].id)
          availableForProgressive.splice(randomIdx, 1)
        }
        const startIndex = Math.floor(Math.random() * progressiveShapes.length)
        shapePattern = Array(baseLength).fill(0).map((_, i) => progressiveShapes[(startIndex + i) % progressiveShapes.length])
        // For higher levels, return next 2 shapes in sequence
        if (requiresTwoShapes) {
          const nextIndex1 = (startIndex + baseLength) % progressiveShapes.length
          const nextIndex2 = (startIndex + baseLength + 1) % progressiveShapes.length
          answer = [progressiveShapes[nextIndex1], progressiveShapes[nextIndex2]]
        } else {
          answer = progressiveShapes[(startIndex + baseLength) % progressiveShapes.length]
        }
        break

      case 'repeating':
        // Repeating group: [A, B], [A, B], ... - always use 2 shapes for clarity
        const groupSize = 2
        // Pick 2 distinct shapes
        const availableShapes = [...shapes]
        const group: string[] = []
        for (let i = 0; i < groupSize; i++) {
          const randomIdx = Math.floor(Math.random() * availableShapes.length)
          group.push(availableShapes[randomIdx].id)
          availableShapes.splice(randomIdx, 1)
        }
        
        const fullGroups = Math.floor(baseLength / groupSize)
        shapePattern = Array(fullGroups).fill(group).flat()
        const remainder = baseLength % groupSize
        if (remainder > 0) {
          shapePattern = shapePattern.concat(group.slice(0, remainder))
        }
        // For higher levels, return the next group (2 shapes)
        if (requiresTwoShapes) {
          answer = group
        } else {
          answer = group[remainder]
        }
        break

      case 'reverse':
        // Reverse pattern: A, B, C, B, A, B, C, ... (goes forward then backward)
        // Use 3 shapes for a clear reverse pattern
        const reverseShapes: string[] = []
        const availableForReverse = [...shapes]
        const reverseCount = Math.min(3, shapes.length)
        for (let i = 0; i < reverseCount; i++) {
          const randomIdx = Math.floor(Math.random() * availableForReverse.length)
          reverseShapes.push(availableForReverse[randomIdx].id)
          availableForReverse.splice(randomIdx, 1)
        }
        
        // Create pattern: A, B, C, B, A, B, C, ...
        // Pattern oscillates: 0, 1, 2, 1, 0, 1, 2, 1, 0, ...
        shapePattern = []
        let direction = 1
        let pos = 0
        for (let i = 0; i < baseLength; i++) {
          shapePattern.push(reverseShapes[pos])
          pos += direction
          // Reverse direction when hitting boundaries
          if (pos >= reverseShapes.length - 1) {
            direction = -1
          } else if (pos <= 0) {
            direction = 1
          }
        }
        // Calculate next position - continue in current direction
        let nextPos = pos + direction
        // If next position would be out of bounds, reverse direction
        if (nextPos >= reverseShapes.length) {
          direction = -1
          nextPos = reverseShapes.length - 2
        } else if (nextPos < 0) {
          direction = 1
          nextPos = 1
        }
        if (requiresTwoShapes) {
          // For two shapes, return next two in sequence
          let nextPos2 = nextPos + direction
          if (nextPos2 >= reverseShapes.length) {
            direction = -1
            nextPos2 = reverseShapes.length - 2
          } else if (nextPos2 < 0) {
            direction = 1
            nextPos2 = 1
          }
          answer = [reverseShapes[nextPos], reverseShapes[nextPos2]]
        } else {
          answer = reverseShapes[nextPos]
        }
        break

      case 'skip':
        // Skip pattern: A, B, A, B, A, ... (every other is A, alternating with B)
        // Use only 2 shapes to keep it clear
        const skipBase = shapes[Math.floor(Math.random() * shapes.length)]
        const skipOther = shapes.filter(s => s.id !== skipBase.id)[Math.floor(Math.random() * (shapes.length - 1))]
        shapePattern = Array(baseLength).fill(0).map((_, i) => 
          i % 2 === 0 ? skipBase.id : skipOther.id
        )
        answer = baseLength % 2 === 0 ? skipBase.id : skipOther.id
        break

      case 'mirror':
        // Mirror pattern: A, B, A or A, B, B, A (simple palindrome with 2 shapes)
        // Use only 2 shapes for clarity
        const mirrorShapes = []
        const availableForMirror = [...shapes]
        for (let i = 0; i < 2; i++) {
          const randomIdx = Math.floor(Math.random() * availableForMirror.length)
          mirrorShapes.push(availableForMirror[randomIdx].id)
          availableForMirror.splice(randomIdx, 1)
        }
        
        // Create palindrome: A, B, A or A, B, B, A
        const halfLength = Math.ceil(baseLength / 2)
        shapePattern = []
        for (let i = 0; i < halfLength; i++) {
          shapePattern.push(mirrorShapes[i % 2])
        }
        // Mirror back (skip middle if odd)
        const mirrorStart = baseLength % 2 === 0 ? halfLength - 1 : halfLength - 2
        for (let i = mirrorStart; i >= 0; i--) {
          shapePattern.push(mirrorShapes[i % 2])
        }
        // Next starts a new sequence
        answer = mirrorShapes[0]
        break

      default:
        const defaultShape = shapes[Math.floor(Math.random() * shapes.length)]
        shapePattern = Array(baseLength).fill(defaultShape.id)
        answer = defaultShape.id
    }

    // Create a color mapping for each unique shape ID used in the pattern
    // This ensures the same shape always has the same color within a round
    const uniqueShapeIds = Array.from(new Set(shapePattern))
    const colorMap: Record<string, string> = {}
    const usedColors: string[] = []
    
    // Assign one unique color to each unique shape ID
    uniqueShapeIds.forEach(shapeId => {
      // Assign a random color that hasn't been used yet
      let color: string
      let attempts = 0
      do {
        color = assignRandomColor()
        attempts++
        // Safety check: if we've tried too many times, just use the first available color
        if (attempts > 100) {
          color = availableColors.find(c => !usedColors.includes(c)) || availableColors[0]
          break
        }
      } while (usedColors.includes(color))
      usedColors.push(color)
      colorMap[shapeId] = color
    })
    
    // Assign colors to pattern items using the mapping - ensure all instances of same shape use same color
    const patternWithColors: PatternItem[] = shapePattern.map(shapeId => {
      const color = colorMap[shapeId]
      if (!color) {
        // Fallback: should never happen, but just in case
        console.warn(`No color found for shapeId: ${shapeId}`)
        return { shapeId, color: assignRandomColor() }
      }
      return { shapeId, color }
    })

    // Verify all instances of same shape have same color
    const colorVerification: Record<string, string> = {}
    patternWithColors.forEach(item => {
      if (colorVerification[item.shapeId] && colorVerification[item.shapeId] !== item.color) {
        console.error(`Color mismatch for shape ${item.shapeId}: expected ${colorVerification[item.shapeId]}, got ${item.color}`)
      }
      colorVerification[item.shapeId] = item.color
    })

    return { pattern: patternWithColors, type, answer, colorMap }
  }, [])

  // Auto-initialize game on mount
  useEffect(() => {
    if (pattern.length === 0 && gameState === 'idle') {
      const { pattern: initialPattern, type, answer, colorMap } = generatePattern(1)
      setPattern(initialPattern)
      setPatternType(type)
      setShapeColorMap(colorMap)
      currentAnswerRef.current = answer
    }
  }, [pattern.length, gameState, generatePattern])

  // Start new game - generate pattern but don't start timer yet
  const startGame = useCallback(() => {
    setDifficultyLevel(1)
    setPatternsSolved(0)
    setElapsedTime(0)
    setGameStartTime(0) // Don't start timer yet
    hasSubmittedScore.current = false

    const { pattern, type, answer, colorMap } = generatePattern(1)
    setPattern(pattern)
    setPatternType(type)
    setShapeColorMap(colorMap)
    currentAnswerRef.current = answer
    setUserAnswer(null)
    setSelectedShapes([])
    
    // Keep in idle state - game starts when user clicks first shape
    setGameState('idle')
  }, [generatePattern])

  // Handle shape selection
  const handleShapeClick = useCallback((shapeId: string) => {
    // If in idle state, start the game (start timer and transition to playing)
    let justStarted = false
    if (gameState === 'idle') {
      const startTime = Date.now()
      setGameStartTime(startTime)
      setGameState('playing')
      justStarted = true
    }
    
    // Only process clicks when in playing state (or if we just started)
    if (!justStarted && gameState !== 'playing') return

    const correctAnswer = currentAnswerRef.current
    const requiresTwoShapes = Array.isArray(correctAnswer)

    if (requiresTwoShapes) {
      // Handle two-shape selection - validate immediately and in order
      const answerArray = correctAnswer as string[]
      const currentPosition = selectedShapes.length
      
      // Can only select in order - must select first shape before second
      if (currentPosition >= 2) {
        return // Already have both shapes
      }
      
      // Don't allow selecting a shape that's already been selected
      if (selectedShapes.includes(shapeId)) {
        return // Shape already selected
      }
      
      // Check if this shape is correct for the current position
      const isCorrect = shapeId === answerArray[currentPosition]
      
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
      
      if (isCorrect) {
        // Correct shape - add it to selected and show it
        const newSelected = [...selectedShapes, shapeId]
        setSelectedShapes(newSelected)
        
        // Check if we now have both shapes
        if (newSelected.length === 2) {
          // Both shapes are correct - progress to next level
          setUserAnswer(newSelected.join(','))
          setGameState('correct')
          const newPatternsSolved = patternsSolved + 1
          setPatternsSolved(newPatternsSolved)

          setTimeout(() => {
            const nextLevel = difficultyLevel + 1
            setDifficultyLevel(nextLevel)
            const { pattern, type, answer, colorMap } = generatePattern(nextLevel)
            setPattern(pattern)
            setPatternType(type)
            setShapeColorMap(colorMap)
            currentAnswerRef.current = answer
            setUserAnswer(null)
            setSelectedShapes([])
            setFeedbackShape(null)
            setFeedbackType(null)
            
            // Go directly to playing state
            setGameState('playing')
          }, 1000)
        }
      } else {
        // Wrong shape - end the game immediately
        // Preserve any previously selected shapes for display
        const wrongAnswer = selectedShapes.length > 0 
          ? [...selectedShapes, shapeId].join(',')
          : shapeId
        setUserAnswer(wrongAnswer)
        setGameState('wrong')
        const finalTime = elapsedTime

        // Show wrong state with correct answer for 3 seconds before transitioning to finished
        setTimeout(() => {
          // Set final results and show results screen
          setFinalResults({
            patternsSolved,
            timeTaken: finalTime,
            level: difficultyLevel
          })
          setGameState('finished')
          
          // Submit score
          if (username && !hasSubmittedScore.current && patternsSolved > 0) {
            hasSubmittedScore.current = true
            submitPatternRecognitionScore({
              username,
              patterns_solved: patternsSolved,
              time_taken: finalTime,
              difficulty_level: difficultyLevel
            }).then(() => {
              setTimeout(() => loadScores(), 1000)
            }).catch(error => {
              console.error('Error submitting score:', error)
              hasSubmittedScore.current = false
            })
          }
          
          // Auto-reset after showing results for 3 seconds
          setTimeout(() => {
            setDifficultyLevel(1)
            setPatternsSolved(0)
            setElapsedTime(0)
            setGameStartTime(0)
            hasSubmittedScore.current = false
            setFinalResults(null)
            const { pattern: newPattern, type, answer, colorMap } = generatePattern(1)
            setPattern(newPattern)
            setPatternType(type)
            setShapeColorMap(colorMap)
            currentAnswerRef.current = answer
            setUserAnswer(null)
            setSelectedShapes([])
            setFeedbackShape(null)
            setFeedbackType(null)
            setGameState('idle')
          }, 3000)
        }, 3000)
      }
    } else {
      // Handle single-shape selection (original behavior)
      // Set userAnswer immediately so it shows in the display
      setUserAnswer(shapeId)
      const isCorrect = shapeId === correctAnswer

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

      if (isCorrect && correctAnswer !== null) {
        setGameState('correct')
        const newPatternsSolved = patternsSolved + 1
        setPatternsSolved(newPatternsSolved)

        setTimeout(() => {
          const nextLevel = difficultyLevel + 1
          setDifficultyLevel(nextLevel)
          const { pattern, type, answer, colorMap } = generatePattern(nextLevel)
          setPattern(pattern)
          setPatternType(type)
          setShapeColorMap(colorMap)
          currentAnswerRef.current = answer
          setUserAnswer(null)
          setSelectedShapes([])
          setFeedbackShape(null)
          setFeedbackType(null)
          
          // Go directly to playing state
          setGameState('playing')
        }, 1000)
      } else {
        setGameState('wrong')
        const finalTime = elapsedTime

        // Show wrong state with correct answer for 3 seconds before transitioning to finished
        setTimeout(() => {
          // Set final results and show results screen
          setFinalResults({
            patternsSolved,
            timeTaken: finalTime,
            level: difficultyLevel
          })
          setGameState('finished')
          
          // Submit score
          if (username && !hasSubmittedScore.current && patternsSolved > 0) {
            hasSubmittedScore.current = true
            submitPatternRecognitionScore({
              username,
              patterns_solved: patternsSolved,
              time_taken: finalTime,
              difficulty_level: difficultyLevel
            }).then(() => {
              setTimeout(() => loadScores(), 1000)
            }).catch(error => {
              console.error('Error submitting score:', error)
              hasSubmittedScore.current = false
            })
          }
          
          // Auto-reset after showing results for 3 seconds
          setTimeout(() => {
            setDifficultyLevel(1)
            setPatternsSolved(0)
            setElapsedTime(0)
            setGameStartTime(0)
            hasSubmittedScore.current = false
            setFinalResults(null)
            const { pattern: newPattern, type, answer, colorMap } = generatePattern(1)
            setPattern(newPattern)
            setPatternType(type)
            setShapeColorMap(colorMap)
            currentAnswerRef.current = answer
            setUserAnswer(null)
            setSelectedShapes([])
            setFeedbackShape(null)
            setFeedbackType(null)
            setGameState('idle')
          }, 3000)
        }, 3000)
      }
    }
  }, [gameState, patternsSolved, difficultyLevel, elapsedTime, username, generatePattern, loadScores, selectedShapes])

  // Reset game
  const resetGame = useCallback(() => {
    setGameState('idle')
    setPattern([])
    setDifficultyLevel(1)
    setPatternsSolved(0)
    setElapsedTime(0)
    setGameStartTime(0)
    setUserAnswer(null)
    setSelectedShapes([])
    setFeedbackShape(null)
    setFeedbackType(null)
    setFinalResults(null)
    setShapeColorMap({})
    currentAnswerRef.current = null
    hasSubmittedScore.current = false
    if (timerInterval.current) {
      clearInterval(timerInterval.current)
    }
    if (feedbackTimeoutRef.current) {
      clearTimeout(feedbackTimeoutRef.current)
    }
  }, [])

  // Custom sort function: prioritize patterns_solved (desc), then time_taken (asc)
  const customSort = useCallback((a: PatternRecognitionScore, b: PatternRecognitionScore) => {
    // First compare by patterns_solved (higher is better)
    if (a.patterns_solved !== b.patterns_solved) {
      return b.patterns_solved - a.patterns_solved
    }
    // If patterns_solved are equal, compare by time_taken (lower is better)
    return a.time_taken - b.time_taken
  }, [])

  return (
    <GameWrapper
      gameType="Pattern Recognition"
      scores={scores}
      loading={loading}
      onRefresh={loadScores}
      formatScore={formatScore}
      sortKey="patterns_solved"
      sortDirection="desc"
      customSort={customSort}
    >
      <div className="flex flex-col items-center justify-start min-h-[400px] sm:min-h-[600px] pt-8">
        {gameState === 'finished' && finalResults ? (
          /* Results Screen */
          <div className="text-center w-full max-w-4xl">
            <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-gray-700 dark:text-gray-100">
              Game Over!
            </h2>
            <div className="bg-white dark:bg-gray-700 p-6 sm:p-8 rounded-lg shadow-md mb-6">
              <div className="grid grid-cols-3 gap-4 text-center mb-4">
                <div>
                  <div className="text-3xl sm:text-4xl font-bold text-green-600 dark:text-green-400">
                    {finalResults.patternsSolved}
                  </div>
                  <div className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
                    Patterns Solved
                  </div>
                </div>
                <div>
                  <div className="text-3xl sm:text-4xl font-bold text-purple-600 dark:text-purple-400">
                    {finalResults.timeTaken}s
                  </div>
                  <div className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
                    Time Taken
                  </div>
                </div>
                <div>
                  <div className="text-3xl sm:text-4xl font-bold text-blue-600 dark:text-blue-400">
                    {finalResults.level}
                  </div>
                  <div className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
                    Level Reached
                  </div>
                </div>
              </div>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Starting a new game in a few seconds...
            </p>
          </div>
        ) : (
          <>
            {/* Stats and Reset */}
            <div className="flex justify-between items-center w-full max-w-4xl mb-6 text-sm sm:text-base">
              <div className="text-gray-600 dark:text-gray-400">
                Level: <span className="font-bold text-blue-600 dark:text-blue-400">{difficultyLevel}</span>
              </div>
              <div className="text-gray-600 dark:text-gray-400">
                Solved: <span className="font-bold text-green-600 dark:text-green-400">{patternsSolved}</span>
              </div>
              <div className="text-gray-600 dark:text-gray-400">
                Time: <span className="font-bold text-purple-600 dark:text-purple-400">{elapsedTime}s</span>
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

            {/* Pattern Display Area */}
            <div className="w-full max-w-4xl">
              <div className="bg-white dark:bg-gray-700 shadow-md rounded-lg p-6 sm:p-8 mb-4">
                <div className="flex flex-wrap justify-center items-center gap-3 sm:gap-4 min-h-[120px]">
                  {pattern.length > 0 ? (
                <>
                  {pattern.map((item, index) => {
                    const shape = shapes.find(s => s.id === item.shapeId)
                    return shape ? (
                      <div
                        key={index}
                        className={`w-12 h-12 sm:w-16 sm:h-16 ${item.color} opacity-60 flex items-center justify-center`}
                      >
                        {shape.svg}
                      </div>
                    ) : null
                  })}
                  {Array.isArray(currentAnswerRef.current) ? (
                    // Show 2 question marks for 2-shape answers, or selected shapes
                    <>
                      {selectedShapes.length > 0 ? (
                        // Show first selected shape
                        (() => {
                          const shape = shapes.find(s => s.id === selectedShapes[0])
                          return shape ? (
                            <div className={`w-12 h-12 sm:w-16 sm:h-16 ${shapeColorMap[shape.id] || shape.color} flex items-center justify-center`}>
                              {shape.svg}
                            </div>
                          ) : (
                            <div className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-dashed border-gray-400 dark:border-gray-500 rounded-lg flex items-center justify-center">
                              <span className="text-2xl text-gray-400 dark:text-gray-500">?</span>
                            </div>
                          )
                        })()
                      ) : (
                        <div className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-dashed border-gray-400 dark:border-gray-500 rounded-lg flex items-center justify-center">
                          <span className="text-2xl text-gray-400 dark:text-gray-500">?</span>
                        </div>
                      )}
                      {selectedShapes.length > 1 ? (
                        // Show second selected shape
                        (() => {
                          const shape = shapes.find(s => s.id === selectedShapes[1])
                          return shape ? (
                            <div className={`w-12 h-12 sm:w-16 sm:h-16 ${shapeColorMap[shape.id] || shape.color} flex items-center justify-center`}>
                              {shape.svg}
                            </div>
                          ) : (
                            <div className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-dashed border-gray-400 dark:border-gray-500 rounded-lg flex items-center justify-center">
                              <span className="text-2xl text-gray-400 dark:text-gray-500">?</span>
                            </div>
                          )
                        })()
                      ) : (
                        <div className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-dashed border-gray-400 dark:border-gray-500 rounded-lg flex items-center justify-center">
                          <span className="text-2xl text-gray-400 dark:text-gray-500">?</span>
                        </div>
                      )}
                    </>
                  ) : (
                    // Single shape answer - show selected shape or question mark
                    userAnswer ? (
                      (() => {
                        const shape = shapes.find(s => s.id === userAnswer)
                        return shape ? (
                          <div className={`w-12 h-12 sm:w-16 sm:h-16 ${shapeColorMap[shape.id] || shape.color} flex items-center justify-center`}>
                            {shape.svg}
                          </div>
                        ) : (
                          <div className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-dashed border-gray-400 dark:border-gray-500 rounded-lg flex items-center justify-center">
                            <span className="text-2xl text-gray-400 dark:text-gray-500">?</span>
                          </div>
                        )
                      })()
                    ) : (
                      <div className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-dashed border-gray-400 dark:border-gray-500 rounded-lg flex items-center justify-center">
                        <span className="text-2xl text-gray-400 dark:text-gray-500">?</span>
                      </div>
                    )
                  )}
                </>
              ) : gameState === 'correct' ? (
                <>
                  {pattern.map((item, index) => {
                    const shape = shapes.find(s => s.id === item.shapeId)
                    return shape ? (
                      <div
                        key={index}
                        className={`w-12 h-12 sm:w-16 sm:h-16 ${item.color} opacity-60 flex items-center justify-center`}
                      >
                        {shape.svg}
                      </div>
                    ) : null
                  })}
                  {userAnswer && (() => {
                    // Handle both single and multiple answers
                    const answerIds = userAnswer.includes(',') ? userAnswer.split(',') : [userAnswer]
                    return answerIds.map((answerId, idx) => {
                      const shape = shapes.find(s => s.id === answerId)
                      return shape ? (
                        <div key={idx} className={`w-12 h-12 sm:w-16 sm:h-16 ${shapeColorMap[shape.id] || shape.color} flex items-center justify-center animate-pulse`}>
                          {shape.svg}
                        </div>
                      ) : null
                    })
                  })()}
                </>
              ) : gameState === 'wrong' ? (
                <>
                  {pattern.map((item, index) => {
                    const shape = shapes.find(s => s.id === item.shapeId)
                    return shape ? (
                      <div
                        key={index}
                        className={`w-12 h-12 sm:w-16 sm:h-16 ${item.color} opacity-60 flex items-center justify-center`}
                      >
                        {shape.svg}
                      </div>
                    ) : null
                  })}
                  {/* Show user's answer(s) - mark wrong ones with X */}
                  {userAnswer && currentAnswerRef.current && (() => {
                    const answerIds = userAnswer.includes(',') ? userAnswer.split(',') : [userAnswer]
                    const correctAnswer = currentAnswerRef.current
                    const correctIds = Array.isArray(correctAnswer) ? correctAnswer : [correctAnswer]
                    
                    return answerIds.map((answerId, idx) => {
                      const shape = shapes.find(s => s.id === answerId)
                      if (!shape) return null
                      
                      // Check if this position was correct
                      const isCorrect = correctIds[idx] === answerId
                      
                      return (
                        <div 
                          key={`user-${idx}`} 
                          className={`w-12 h-12 sm:w-16 sm:h-16 ${shapeColorMap[shape.id] || shape.color} flex items-center justify-center ${isCorrect ? '' : 'opacity-50'} relative`}
                        >
                          {shape.svg}
                          {!isCorrect && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="text-red-600 dark:text-red-400 text-2xl font-bold">✗</span>
                            </div>
                          )}
                        </div>
                      )
                    })
                  })()}
                  {/* Show correct answer in green (like visual memory) */}
                  {currentAnswerRef.current && (() => {
                    const correctAnswer = currentAnswerRef.current
                    const correctIds = Array.isArray(correctAnswer) ? correctAnswer : [correctAnswer]
                    return correctIds.map((answerId, idx) => {
                      const shape = shapes.find(s => s.id === answerId)
                      return shape ? (
                        <div key={`correct-${idx}`} className={`w-12 h-12 sm:w-16 sm:h-16 ${shapeColorMap[shape.id] || shape.color} flex items-center justify-center bg-green-500 dark:bg-green-600`}>
                          {shape.svg}
                        </div>
                      ) : null
                    })
                  })()}
                </>
              ) : (
                <>
                  {pattern.map((item, index) => {
                    const shape = shapes.find(s => s.id === item.shapeId)
                    return shape ? (
                      <div
                        key={index}
                        className={`w-12 h-12 sm:w-16 sm:h-16 ${item.color} opacity-60 flex items-center justify-center`}
                      >
                        {shape.svg}
                      </div>
                    ) : null
                  })}
                  {userAnswer && (() => {
                    // Handle both single and multiple answers
                    const answerIds = userAnswer.includes(',') ? userAnswer.split(',') : [userAnswer]
                    return answerIds.map((answerId, idx) => {
                      const shape = shapes.find(s => s.id === answerId)
                      return shape ? (
                        <div key={idx} className={`w-12 h-12 sm:w-16 sm:h-16 ${shapeColorMap[shape.id] || shape.color} flex items-center justify-center`}>
                          {shape.svg}
                        </div>
                      ) : null
                    })
                  })()}
                </>
              )}
            </div>
          </div>
        </div>

            {/* Shape Selection Grid */}
            {pattern.length > 0 && (
              <div className="w-full max-w-4xl">
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 sm:gap-4">
                  {shapes.map((shape) => {
                    const isSelected = selectedShapes.includes(shape.id)
                    const showFeedback = feedbackShape === shape.id
                    const isCorrect = feedbackType === 'correct' && showFeedback
                    const isWrong = feedbackType === 'wrong' && showFeedback
                    const isDisabled = gameState === 'correct' || gameState === 'wrong' || gameState === 'finished'
                    // Use color from map if shape appears in pattern, otherwise use default color
                    const shapeColor = shapeColorMap[shape.id] || shape.color
                    
                    // Check if this is the correct answer when gameState is 'wrong'
                    const isCorrectAnswer = gameState === 'wrong' && currentAnswerRef.current && (
                      (Array.isArray(currentAnswerRef.current) && currentAnswerRef.current.includes(shape.id)) ||
                      (!Array.isArray(currentAnswerRef.current) && currentAnswerRef.current === shape.id)
                    )
                    
                    return (
                      <button
                        key={shape.id}
                        onClick={() => handleShapeClick(shape.id)}
                        disabled={isDisabled}
                        className={`aspect-square rounded-lg shadow-lg transition-all duration-200 flex items-center justify-center p-3 sm:p-4 ${shapeColor} ${
                          isSelected 
                            ? 'ring-4 ring-green-500 dark:ring-green-400 scale-110 shadow-2xl' 
                            : ''
                        } ${
                          isCorrect || isCorrectAnswer
                            ? 'bg-green-500 dark:bg-green-600 animate-none'
                            : isWrong
                            ? 'bg-red-500 dark:bg-red-600 animate-shake'
                            : 'bg-white dark:bg-gray-700'
                        } ${
                          isDisabled
                            ? 'opacity-50 cursor-not-allowed'
                            : 'hover:shadow-xl hover:scale-105 active:scale-95 cursor-pointer'
                        }`}
                        title={shape.name}
                      >
                        {shape.svg}
                      </button>
                    )
                  })}
                </div>
                {gameState === 'playing' && Array.isArray(currentAnswerRef.current) && (
                  <p className="text-center text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-2">
                    {selectedShapes.length === 0 
                      ? 'Select the first shape'
                      : selectedShapes.length === 1
                      ? 'Select the second shape'
                      : 'Both shapes selected!'}
                  </p>
                )}
              </div>
            )}
          </>
        )}

      </div>
    </GameWrapper>
  )
}
