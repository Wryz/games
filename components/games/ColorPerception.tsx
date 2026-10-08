'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { getColorPerceptionScores, submitColorPerceptionScore } from '@/lib/scores'
import { useUser } from '@/contexts/UserContext'
import { supabase } from '@/lib/supabase'
import GameWrapper from '../GameWrapper'
import type { ColorPerceptionScore } from '@/lib/supabase'
import { formatNumber } from '@/lib/levels'

type Phase = 'idle' | 'playing' | 'reveal' | 'finished'

interface Round {
  id: number
  level: number
  size: number
  baseColor: string
  oddColor: string
  oddIndex: number
  delta: number
}

const MAX_LIVES = 3
const MAX_GRID = 7
const REVEAL_MS = 600

const round1 = (n: number) => Math.round(n * 10) / 10
const randBetween = (min: number, max: number) => min + Math.random() * (max - min)

function gridSizeFor(level: number) {
  return Math.min(MAX_GRID, 2 + Math.floor((level - 1) / 2))
}

function deltaFor(level: number) {
  return Math.max(0.6, 18 * Math.pow(0.86, level - 1))
}

function makeRound(level: number, id: number): Round {
  const size = gridSizeFor(level)
  const h = round1(randBetween(0, 360))
  const s = round1(randBetween(45, 75))
  const l = round1(randBetween(40, 62))
  const target = deltaFor(level)

  let direction = Math.random() < 0.5 ? 1 : -1
  if (l + direction * target > 95 || l + direction * target < 5) direction = -direction
  const oddL = round1(Math.min(95, Math.max(5, l + direction * target)))

  return {
    id,
    level,
    size,
    baseColor: `hsl(${h} ${s}% ${l}%)`,
    oddColor: `hsl(${h} ${s}% ${oddL}%)`,
    oddIndex: Math.floor(Math.random() * size * size),
    delta: round1(Math.abs(oddL - l)),
  }
}

export default function ColorPerception() {
  const [scores, setScores] = useState<ColorPerceptionScore[]>([])
  const [loading, setLoading] = useState(true)
  const [phase, setPhase] = useState<Phase>('idle')
  const [round, setRound] = useState<Round | null>(null)
  const [lives, setLives] = useState(MAX_LIVES)
  const [levelReached, setLevelReached] = useState(0)
  const [resolvedDelta, setResolvedDelta] = useState<number | null>(null)
  const [wrongIndex, setWrongIndex] = useState<number | null>(null)
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const { username } = useUser()

  const phaseRef = useRef<Phase>('idle')
  const roundRef = useRef<Round | null>(null)
  const livesRef = useRef(MAX_LIVES)
  const roundIdRef = useRef(0)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const hasSubmittedScore = useRef(false)

  const clearTimers = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }, [])

  const loadScores = async () => {
    try {
      setLoading(true)
      const data = await getColorPerceptionScores({ limit: 50 })
      setScores(data ?? [])
    } catch (error) {
      console.error('Error loading color perception scores:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadScores()

    let channel: ReturnType<typeof supabase.channel> | null = null
    try {
      channel = supabase
        .channel('color_perception_scores_changes')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'color_perception_scores'
          },
          (payload) => {
            setScores(prev => [payload.new as ColorPerceptionScore, ...prev.slice(0, 49)])
          }
        )
        .subscribe()
    } catch (error) {
      console.error('Error subscribing to color perception scores:', error)
    }

    return () => {
      if (channel) {
        try {
          supabase.removeChannel(channel)
        } catch {
          // ignore
        }
      }
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  const goToRound = useCallback((level: number) => {
    roundIdRef.current += 1
    const next = makeRound(level, roundIdRef.current)
    roundRef.current = next
    phaseRef.current = 'playing'
    setRound(next)
    setWrongIndex(null)
    setPhase('playing')
  }, [])

  const startGame = useCallback(() => {
    clearTimers()
    hasSubmittedScore.current = false
    livesRef.current = MAX_LIVES
    setLives(MAX_LIVES)
    setLevelReached(0)
    setResolvedDelta(null)
    setSaveState('idle')
    goToRound(1)
  }, [clearTimers, goToRound])

  const handleTile = useCallback((roundId: number, index: number) => {
    const current = roundRef.current
    // Ignore taps during reveal, after finish, or from a stale render (fast double taps)
    if (phaseRef.current !== 'playing' || !current || current.id !== roundId) return

    if (index === current.oddIndex) {
      setLevelReached(current.level)
      setResolvedDelta(current.delta)
      goToRound(current.level + 1)
      return
    }

    // Wrong tile: lose a life, reveal the odd tile, then retry same level or finish
    const remaining = livesRef.current - 1
    livesRef.current = remaining
    setLives(remaining)
    phaseRef.current = 'reveal'
    setPhase('reveal')
    setWrongIndex(index)

    clearTimers()
    timeoutRef.current = setTimeout(() => {
      timeoutRef.current = null
      if (remaining <= 0) {
        phaseRef.current = 'finished'
        setPhase('finished')
      } else {
        goToRound(current.level)
      }
    }, REVEAL_MS)
  }, [clearTimers, goToRound])

  // Submit score when the run ends
  useEffect(() => {
    if (phase !== 'finished' || !username || hasSubmittedScore.current) return
    hasSubmittedScore.current = true
    if (levelReached <= 0) return

    setSaveState('saving')
    submitColorPerceptionScore({ username, level_reached: levelReached })
      .then(() => {
        setSaveState('saved')
        setTimeout(() => loadScores(), 1000)
      })
      .catch(error => {
        console.error('Error submitting color perception score:', error)
        setSaveState('error')
      })
  }, [phase, username, levelReached])

  const resetGame = useCallback(() => {
    clearTimers()
    roundIdRef.current += 1
    roundRef.current = null
    phaseRef.current = 'idle'
    livesRef.current = MAX_LIVES
    hasSubmittedScore.current = false
    setPhase('idle')
    setRound(null)
    setLives(MAX_LIVES)
    setLevelReached(0)
    setResolvedDelta(null)
    setWrongIndex(null)
    setSaveState('idle')
  }, [clearTimers])

  const formatScore = (score: ColorPerceptionScore) => {
    return `Level ${formatNumber(score.level_reached)}`
  }

  const inRun = phase === 'playing' || phase === 'reveal'
  const displayLevel = round ? round.level : 0

  return (
    <GameWrapper
      gameType="Color Perception"
      scores={scores}
      loading={loading}
      onRefresh={loadScores}
      fetchScores={getColorPerceptionScores}
      scoreTable="color_perception_scores"
      formatScore={formatScore}
      sortKey="level_reached"
      sortDirection="desc"
    >
      <div className="w-full">
        {/* Status row */}
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <div className="flex items-baseline gap-2">
              <span className="eyebrow">Level</span>
              <span className="num text-sm font-semibold text-gray-900 dark:text-gray-100">
                {inRun ? displayLevel : '—'}
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="eyebrow">Lives</span>
              <span
                className="num text-sm tracking-[0.15em] text-gray-900 dark:text-gray-100"
                aria-label={`${lives} of ${MAX_LIVES} lives left`}
              >
                {Array.from({ length: MAX_LIVES }, (_, i) => (i < lives ? '●' : '○')).join('')}
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="eyebrow">Δ</span>
              <span className="num text-sm font-semibold text-signal-600 dark:text-signal-400">
                {inRun && round ? `${round.delta.toFixed(1)}%` : '—'}
              </span>
            </div>
          </div>
          <button
            onClick={resetGame}
            className="rounded-full p-2 text-gray-500 transition-colors hover:text-gray-950 dark:text-gray-400 dark:hover:text-white"
            title="Reset"
            aria-label="Reset"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {/* Stage */}
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 min-h-[420px] sm:min-h-[480px] flex flex-col items-center justify-center p-4 sm:p-6">
          {phase === 'idle' && (
            <div className="flex max-w-sm flex-col items-center text-center">
              <span className="eyebrow mb-3">Color discrimination</span>
              <p className="text-base text-gray-700 dark:text-gray-300">
                Every tile is the same color except one. Tap the odd one out. The difference
                shrinks each level and you have {MAX_LIVES} lives.
              </p>
              <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                Results depend on your screen and lighting. Turn off night mode and blue-light filters for a fair reading.
              </p>
              <button onClick={startGame} className="btn-primary mt-6">
                Start
              </button>
            </div>
          )}

          {inRun && round && (
            <div className="flex w-full flex-col items-center">
              <div
                className="grid w-full max-w-[420px] aspect-square gap-1.5"
                style={{ gridTemplateColumns: `repeat(${round.size}, minmax(0, 1fr))` }}
              >
                {Array.from({ length: round.size * round.size }, (_, i) => {
                  const isOdd = i === round.oddIndex
                  const revealing = phase === 'reveal'
                  const highlight = revealing && isOdd
                  const missed = revealing && i === wrongIndex
                  return (
                    <button
                      key={`${round.id}-${i}`}
                      type="button"
                      aria-label={`Tile ${i + 1}`}
                      disabled={revealing}
                      onClick={() => handleTile(round.id, i)}
                      style={{ backgroundColor: isOdd ? round.oddColor : round.baseColor }}
                      className={`rounded-lg outline-none transition-[transform,opacity] duration-100 active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-signal-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-gray-900 disabled:cursor-default disabled:active:scale-100 ${
                        highlight
                          ? 'ring-[3px] ring-gray-950 ring-offset-2 ring-offset-white dark:ring-white dark:ring-offset-gray-900'
                          : ''
                      } ${missed ? 'opacity-40' : ''}`}
                    />
                  )
                })}
              </div>
              <p className="mt-4 h-4 font-mono text-[11px] uppercase tracking-[0.14em] text-gray-500 dark:text-gray-400">
                {phase === 'reveal' ? 'Missed. Odd tile outlined' : `${round.size}×${round.size} · find the odd tile`}
              </p>
            </div>
          )}

          {phase === 'finished' && (
            <div className="flex flex-col items-center text-center">
              <span className="eyebrow">Result</span>
              <div className="num mt-3 text-6xl sm:text-7xl font-bold text-gray-950 dark:text-gray-50">
                Level {formatNumber(levelReached)}
              </div>
              <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                {resolvedDelta !== null ? (
                  <>
                    You resolved a{' '}
                    <span className="num font-semibold text-gray-900 dark:text-gray-100">
                      {resolvedDelta.toFixed(1)}%
                    </span>{' '}
                    lightness difference
                  </>
                ) : (
                  'No level cleared this run'
                )}
              </p>
              <button onClick={startGame} className="btn-ink mt-6">
                Try again
              </button>
              {!username && (
                <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
                  Set a username to save your score to the leaderboard. This run was not saved.
                </p>
              )}
              {username && saveState === 'error' && (
                <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
                  Your score could not be saved right now.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </GameWrapper>
  )
}
