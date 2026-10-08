'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { getVerbalMemoryScores, submitVerbalMemoryScore } from '@/lib/scores'
import { useUser } from '@/contexts/UserContext'
import { supabase } from '@/lib/supabase'
import GameWrapper from '../GameWrapper'
import type { VerbalMemoryScore } from '@/lib/supabase'
import { formatNumber } from '@/lib/levels'
import wordsData from '@/data/typing-words.json'

type GamePhase = 'idle' | 'playing' | 'finished'
type Answer = 'seen' | 'new'
type Flash = 'correct' | 'wrong' | null

interface CurrentWord {
  word: string
  isSeen: boolean
}

const TOTAL_LIVES = 3
const SEEN_PROBABILITY = 0.4
const MIN_SEEN_BEFORE_REPEATS = 3
const FLASH_MS = 200
// Swallow accidental double-clicks/taps without slowing deliberate play
const ANSWER_LOCK_MS = 120

// Word pool: length >= 4, lower-cased, deduped (built once per module load)
const WORD_POOL: string[] = Array.from(
  new Set(
    (wordsData as { words: string[] }).words
      .map(w => w.trim().toLowerCase())
      .filter(w => w.length >= 4)
  )
)

function shuffle<T>(items: T[]): T[] {
  const arr = items.slice()
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

export default function VerbalMemory() {
  const [scores, setScores] = useState<VerbalMemoryScore[]>([])
  const [loading, setLoading] = useState(true)
  const [phase, setPhase] = useState<GamePhase>('idle')
  const [current, setCurrent] = useState<CurrentWord | null>(null)
  const [score, setScore] = useState(0)
  const [lives, setLives] = useState(TOTAL_LIVES)
  const [shownCount, setShownCount] = useState(0)
  const [flash, setFlash] = useState<Flash>(null)
  const { username } = useUser()

  const hasSubmittedScore = useRef(false)
  const phaseRef = useRef<GamePhase>('idle')
  const currentRef = useRef<CurrentWord | null>(null)
  const scoreRef = useRef(0)
  const livesRef = useRef(TOTAL_LIVES)
  const shownCountRef = useRef(0)
  const seenListRef = useRef<string[]>([])
  const seenSetRef = useRef<Set<string>>(new Set())
  const freshPoolRef = useRef<string[]>([])
  const lastAnswerAtRef = useRef(0)
  const flashTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const clearTimers = useCallback(() => {
    if (flashTimeoutRef.current) {
      clearTimeout(flashTimeoutRef.current)
      flashTimeoutRef.current = null
    }
  }, [])

  const loadScores = async () => {
    try {
      setLoading(true)
      const data = await getVerbalMemoryScores({ limit: 50 })
      setScores(data ?? [])
    } catch (error) {
      console.error('Error loading scores:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadScores()

    // Set up realtime listener for verbal memory scores
    let channel: ReturnType<typeof supabase.channel> | null = null
    try {
      channel = supabase
        .channel('verbal_memory_scores_changes')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'verbal_memory_scores'
          },
          (payload) => {
            setScores(prev => [payload.new as VerbalMemoryScore, ...prev.slice(0, 49)])
          }
        )
        .subscribe()
    } catch (error) {
      console.error('Error subscribing to verbal memory scores:', error)
    }

    return () => {
      if (channel) {
        try {
          supabase.removeChannel(channel)
        } catch (error) {
          console.error('Error removing verbal memory channel:', error)
        }
      }
      if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current)
    }
  }, [])

  const showWord = useCallback((next: CurrentWord) => {
    currentRef.current = next
    setCurrent(next)
    shownCountRef.current += 1
    setShownCount(shownCountRef.current)
  }, [])

  const finishGame = useCallback(() => {
    clearTimers()
    phaseRef.current = 'finished'
    setPhase('finished')
    setFlash(null)
  }, [clearTimers])

  // Pick the next word. Returns null only if nothing valid is left to show.
  const pickNextWord = useCallback((): CurrentWord | null => {
    const previous = currentRef.current?.word ?? null
    const seenCandidates = seenListRef.current.filter(w => w !== previous)
    const freshAvailable = freshPoolRef.current.length > 0

    const wantSeen =
      seenListRef.current.length >= MIN_SEEN_BEFORE_REPEATS &&
      Math.random() < SEEN_PROBABILITY

    if ((wantSeen || !freshAvailable) && seenCandidates.length > 0) {
      const word = seenCandidates[Math.floor(Math.random() * seenCandidates.length)]
      return { word, isSeen: true }
    }

    if (freshAvailable) {
      const word = freshPoolRef.current.pop() as string
      return { word, isSeen: false }
    }

    return null
  }, [])

  const advance = useCallback(() => {
    const next = pickNextWord()
    if (!next) {
      finishGame()
      return
    }
    showWord(next)
  }, [pickNextWord, showWord, finishGame])

  const startGame = useCallback(() => {
    clearTimers()
    freshPoolRef.current = shuffle(WORD_POOL)
    seenListRef.current = []
    seenSetRef.current = new Set()
    currentRef.current = null
    scoreRef.current = 0
    livesRef.current = TOTAL_LIVES
    shownCountRef.current = 0
    lastAnswerAtRef.current = 0
    hasSubmittedScore.current = false
    setScore(0)
    setLives(TOTAL_LIVES)
    setShownCount(0)
    setFlash(null)
    phaseRef.current = 'playing'
    setPhase('playing')
    advance()
  }, [clearTimers, advance])

  const handleAnswer = useCallback((answer: Answer) => {
    if (phaseRef.current !== 'playing') return
    const cur = currentRef.current
    if (!cur) return

    const now = performance.now()
    if (now - lastAnswerAtRef.current < ANSWER_LOCK_MS) return
    lastAnswerAtRef.current = now

    const correct = (answer === 'seen') === cur.isSeen

    // Record the word as seen (first appearance only)
    if (!seenSetRef.current.has(cur.word)) {
      seenSetRef.current.add(cur.word)
      seenListRef.current.push(cur.word)
    }

    clearTimers()
    setFlash(correct ? 'correct' : 'wrong')
    flashTimeoutRef.current = setTimeout(() => {
      setFlash(null)
      flashTimeoutRef.current = null
    }, FLASH_MS)

    if (correct) {
      scoreRef.current += 1
      setScore(scoreRef.current)
    } else {
      livesRef.current = Math.max(0, livesRef.current - 1)
      setLives(livesRef.current)
      if (livesRef.current <= 0) {
        finishGame()
        return
      }
    }

    advance()
  }, [clearTimers, advance, finishGame])

  // Keyboard: S / ArrowLeft = seen, N / ArrowRight = new
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (phaseRef.current !== 'playing') return
      if (e.repeat) {
        // Block held Enter from re-activating a focused button
        e.preventDefault()
        return
      }
      if (e.ctrlKey || e.metaKey || e.altKey) return
      const target = e.target as HTMLElement | null
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) return

      const key = e.key.toLowerCase()
      if (key === 's' || e.key === 'ArrowLeft') {
        e.preventDefault()
        handleAnswer('seen')
      } else if (key === 'n' || e.key === 'ArrowRight') {
        e.preventDefault()
        handleAnswer('new')
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [handleAnswer])

  // Submit score when game finishes
  useEffect(() => {
    if (phase === 'finished' && score > 0 && username && !hasSubmittedScore.current) {
      hasSubmittedScore.current = true

      submitVerbalMemoryScore({
        username,
        words_remembered: score
      }).then(() => {
        // Reload scores after submission
        setTimeout(() => loadScores(), 1000)
      }).catch(error => {
        console.error('Error submitting score:', error)
        hasSubmittedScore.current = false
      })
    }
  }, [phase, score, username])

  // Reset game
  const resetGame = useCallback(() => {
    clearTimers()
    phaseRef.current = 'idle'
    currentRef.current = null
    seenListRef.current = []
    seenSetRef.current = new Set()
    freshPoolRef.current = []
    scoreRef.current = 0
    livesRef.current = TOTAL_LIVES
    shownCountRef.current = 0
    lastAnswerAtRef.current = 0
    hasSubmittedScore.current = false
    setPhase('idle')
    setCurrent(null)
    setScore(0)
    setLives(TOTAL_LIVES)
    setShownCount(0)
    setFlash(null)
  }, [clearTimers])

  const formatScore = (s: VerbalMemoryScore) => {
    return `${formatNumber(s.words_remembered)} words`
  }

  const stageBorder =
    flash === 'correct'
      ? 'border-emerald-500 dark:border-emerald-400'
      : flash === 'wrong'
        ? 'border-red-500 dark:border-red-400'
        : 'border-gray-200 dark:border-gray-800'

  const answered = score + (TOTAL_LIVES - lives)
  const accuracy = answered > 0 ? Math.round((score / answered) * 100) : 0

  return (
    <GameWrapper
      gameType="Verbal Memory"
      scores={scores}
      loading={loading}
      onRefresh={loadScores}
      fetchScores={getVerbalMemoryScores}
      scoreTable="verbal_memory_scores"
      formatScore={formatScore}
      sortKey="words_remembered"
      sortDirection="desc"
    >
      <div className="w-full">
        {/* Status row */}
        <div className="mb-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <div className="flex items-baseline gap-2">
              <span className="eyebrow">Score</span>
              <span className="num text-sm font-semibold text-gray-950 dark:text-gray-50">{score}</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="eyebrow">Lives</span>
              <span
                aria-label={`${lives} of ${TOTAL_LIVES} lives`}
                className={`num text-sm tracking-[0.2em] transition-colors duration-150 ${
                  flash === 'wrong'
                    ? 'text-red-500 dark:text-red-400'
                    : 'text-gray-950 dark:text-gray-50'
                }`}
              >
                {Array.from({ length: TOTAL_LIVES }, (_, i) => (i < lives ? '●' : '○')).join('')}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={resetGame}
            className="text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
            title="Reset"
            aria-label="Reset"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {/* Stage */}
        <div
          className={`rounded-2xl border ${stageBorder} bg-white dark:bg-gray-900 min-h-[420px] sm:min-h-[480px] flex flex-col items-center justify-center p-6 select-none transition-colors duration-150`}
        >
          {phase === 'idle' && (
            <div className="flex flex-col items-center text-center">
              <p className="mb-6 max-w-sm text-sm sm:text-base text-gray-600 dark:text-gray-400">
                Words appear one at a time. Mark each as seen earlier in this run or new. Three mistakes ends the run.
              </p>
              <button type="button" onClick={startGame} className="btn-primary px-8 py-3 text-base">
                Start
              </button>
            </div>
          )}

          {phase === 'playing' && current && (
            <div className="flex w-full flex-col items-center">
              <div className="mb-2 eyebrow">
                Word <span className="num">{shownCount}</span>
              </div>
              <div
                className="mb-10 sm:mb-14 max-w-full wrap-break-word text-center text-4xl sm:text-6xl font-semibold tracking-tight text-gray-950 dark:text-gray-50"
                aria-live="polite"
              >
                {current.word}
              </div>
              <div className="grid w-full max-w-md grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleAnswer('seen')}
                  className="btn-ghost h-16 sm:h-20 w-full text-base sm:text-lg touch-manipulation"
                >
                  Seen <span className="chip">S</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleAnswer('new')}
                  className="btn-ghost h-16 sm:h-20 w-full text-base sm:text-lg touch-manipulation"
                >
                  New <span className="chip">N</span>
                </button>
              </div>
            </div>
          )}

          {phase === 'finished' && (
            <div className="flex flex-col items-center text-center">
              <div className="eyebrow mb-3">Result</div>
              <div className="mb-3 flex items-baseline gap-3">
                <span className="num text-6xl sm:text-7xl font-bold text-gray-950 dark:text-gray-50">
                  {formatNumber(score)}
                </span>
                <span className="text-lg sm:text-xl font-medium text-gray-500 dark:text-gray-400">
                  {score === 1 ? 'word' : 'words'}
                </span>
              </div>
              <p className="mb-8 text-sm text-gray-600 dark:text-gray-400">
                <span className="num">{formatNumber(shownCount)}</span> words shown
                {' · '}
                <span className="num">{accuracy}%</span> correct
              </p>
              <button type="button" onClick={startGame} className="btn-ink px-8 py-3 text-base">
                Try again
              </button>
              {!username && (
                <p className="mt-4 text-xs text-gray-500 dark:text-gray-500">
                  Set a username to save your score to the leaderboard.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </GameWrapper>
  )
}
