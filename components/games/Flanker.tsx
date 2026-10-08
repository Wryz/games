'use client'

import { useState, useEffect, useRef } from 'react'
import { getFlankerScores, submitFlankerScore } from '@/lib/scores'
import { useUser } from '@/contexts/UserContext'
import { supabase } from '@/lib/supabase'
import GameWrapper from '../GameWrapper'
import type { FlankerScore } from '@/lib/supabase'
import { formatNumber } from '@/lib/levels'

type Phase = 'idle' | 'fixation' | 'stimulus' | 'feedback' | 'finished'
type Direction = 'left' | 'right'
type Feedback = 'correct' | 'wrong' | 'timeout' | null

interface Trial {
  center: Direction
  congruent: boolean
}

interface TrialResult {
  congruent: boolean
  correct: boolean
  rt: number | null // null on timeout
}

const TOTAL_TRIALS = 30
const FIXATION_MIN = 400
const FIXATION_MAX = 700
const STIMULUS_MAX = 2000
const FEEDBACK_MS = 250

function generateTrials(): Trial[] {
  const trials: Trial[] = []
  for (let i = 0; i < TOTAL_TRIALS; i++) {
    trials.push({
      congruent: i < TOTAL_TRIALS / 2,
      center: Math.random() < 0.5 ? 'left' : 'right',
    })
  }
  // Fisher–Yates shuffle
  for (let i = trials.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[trials[i], trials[j]] = [trials[j], trials[i]]
  }
  return trials
}

const mean = (xs: number[]) => (xs.length ? Math.round(xs.reduce((s, x) => s + x, 0) / xs.length) : 0)

function computeStats(results: TrialResult[]) {
  const correct = results.filter(r => r.correct && r.rt !== null)
  const congruent = correct.filter(r => r.congruent).map(r => r.rt as number)
  const incongruent = correct.filter(r => !r.congruent).map(r => r.rt as number)
  const congruentAvg = mean(congruent)
  const incongruentAvg = mean(incongruent)
  return {
    correctCount: results.filter(r => r.correct).length,
    averageTime: mean(correct.map(r => r.rt as number)),
    congruentAvg,
    incongruentAvg,
    hasCongruent: congruent.length > 0,
    hasIncongruent: incongruent.length > 0,
    interference: congruent.length > 0 && incongruent.length > 0 ? incongruentAvg - congruentAvg : null,
  }
}

function Arrow({ direction, className = '' }: { direction: Direction; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.25}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={`${direction === 'left' ? '-scale-x-100' : ''} ${className}`}
    >
      <path d="M4 12h15M13 6l6 6-6 6" />
    </svg>
  )
}

export default function Flanker() {
  const [scores, setScores] = useState<FlankerScore[]>([])
  const [loading, setLoading] = useState(true)
  const [phase, setPhase] = useState<Phase>('idle')
  const [trials, setTrials] = useState<Trial[]>([])
  const [trialIndex, setTrialIndex] = useState(0)
  const [results, setResults] = useState<TrialResult[]>([])
  const [feedback, setFeedback] = useState<Feedback>(null)
  const { username } = useUser()

  const phaseRef = useRef<Phase>('idle')
  const trialsRef = useRef<Trial[]>([])
  const trialIndexRef = useRef(0)
  const resultsRef = useRef<TrialResult[]>([])
  const onsetRef = useRef(0)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const rafRef = useRef<number | null>(null)
  const hasSubmittedScore = useRef(false)

  const clearTimers = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }

  const setPhaseBoth = (p: Phase) => {
    phaseRef.current = p
    setPhase(p)
  }

  const loadScores = async () => {
    try {
      setLoading(true)
      const data = await getFlankerScores({ limit: 50 })
      setScores(data ?? [])
    } catch (error) {
      console.error('Error loading flanker scores:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadScores()

    let channel: ReturnType<typeof supabase.channel> | null = null
    try {
      channel = supabase
        .channel('flanker_scores_changes')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'flanker_scores' },
          (payload) => {
            setScores(prev => [payload.new as FlankerScore, ...prev.slice(0, 49)])
          }
        )
        .subscribe()
    } catch (error) {
      console.error('Error subscribing to flanker scores:', error)
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
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  // --- Trial engine (reads only refs + stable setters, so timer closures never go stale) ---

  const runTrial = (index: number) => {
    clearTimers()
    trialIndexRef.current = index
    setTrialIndex(index)
    setFeedback(null)
    setPhaseBoth('fixation')
    const delay = FIXATION_MIN + Math.random() * (FIXATION_MAX - FIXATION_MIN)
    timeoutRef.current = setTimeout(showStimulus, delay)
  }

  const showStimulus = () => {
    timeoutRef.current = null
    setPhaseBoth('stimulus')
    onsetRef.current = performance.now()
    // Refine onset to the frame the stimulus is actually painted in
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null
      onsetRef.current = performance.now()
    })
    timeoutRef.current = setTimeout(() => {
      if (phaseRef.current !== 'stimulus') return
      recordResult(false, null, 'timeout')
    }, STIMULUS_MAX)
  }

  const recordResult = (correct: boolean, rt: number | null, fb: Exclude<Feedback, null>) => {
    clearTimers()
    const trial = trialsRef.current[trialIndexRef.current]
    const next = [...resultsRef.current, { congruent: trial.congruent, correct, rt }]
    resultsRef.current = next
    setResults(next)
    setFeedback(fb)
    setPhaseBoth('feedback')
    timeoutRef.current = setTimeout(() => {
      timeoutRef.current = null
      const nextIndex = trialIndexRef.current + 1
      if (nextIndex >= TOTAL_TRIALS) {
        setFeedback(null)
        setPhaseBoth('finished')
      } else {
        runTrial(nextIndex)
      }
    }, FEEDBACK_MS)
  }

  const respond = (dir: Direction) => {
    // Only accept responses while the stimulus is visible; ignores fixation and double input.
    if (phaseRef.current !== 'stimulus') return
    const rt = Math.round(performance.now() - onsetRef.current)
    const trial = trialsRef.current[trialIndexRef.current]
    const correct = dir === trial.center
    recordResult(correct, rt, correct ? 'correct' : 'wrong')
  }

  const start = () => {
    if (phaseRef.current !== 'idle') return
    clearTimers()
    const t = generateTrials()
    trialsRef.current = t
    setTrials(t)
    resultsRef.current = []
    setResults([])
    hasSubmittedScore.current = false
    runTrial(0)
  }

  const resetGame = () => {
    clearTimers()
    trialsRef.current = []
    resultsRef.current = []
    trialIndexRef.current = 0
    setTrials([])
    setResults([])
    setTrialIndex(0)
    setFeedback(null)
    setPhaseBoth('idle')
    hasSubmittedScore.current = false
  }

  // Keyboard: latest handlers via ref so the listener is attached once
  const handlersRef = useRef({ start, respond })
  handlersRef.current = { start, respond }

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const target = e.target as HTMLElement | null
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) return

      const p = phaseRef.current
      const key = e.key

      if (p === 'idle') {
        if (key === ' ' || key === 'Enter') {
          e.preventDefault()
          if (!e.repeat) handlersRef.current.start()
        }
        return
      }

      if (p === 'fixation' || p === 'stimulus' || p === 'feedback') {
        let dir: Direction | null = null
        if (key === 'ArrowLeft' || key === 'a' || key === 'A') dir = 'left'
        else if (key === 'ArrowRight' || key === 'd' || key === 'D') dir = 'right'
        else if (key === ' ') e.preventDefault() // avoid page scroll mid-run
        if (dir) {
          e.preventDefault()
          if (!e.repeat) handlersRef.current.respond(dir)
        }
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  // Submit once when finished
  useEffect(() => {
    if (phase !== 'finished' || !username || hasSubmittedScore.current) return
    hasSubmittedScore.current = true
    const { correctCount, averageTime } = computeStats(resultsRef.current)
    submitFlankerScore({ username, correct_answers: correctCount, average_time: averageTime })
      .then(() => {
        setTimeout(() => loadScores(), 1000)
      })
      .catch(error => {
        console.error('Error submitting flanker score:', error)
      })
  }, [phase, username])

  const formatScore = (s: FlankerScore) =>
    `${formatNumber(s.correct_answers)} correct · ${formatNumber(s.average_time)}ms`

  const stats = computeStats(results)
  const currentTrial = trials[trialIndex]
  const playing = phase === 'fixation' || phase === 'stimulus' || phase === 'feedback'
  const displayTrial = phase === 'idle' ? 0 : phase === 'finished' ? TOTAL_TRIALS : trialIndex + 1

  const stageTint =
    phase === 'feedback' && feedback !== 'correct'
      ? 'border-red-400 bg-red-50 dark:border-red-700 dark:bg-red-950/40'
      : 'border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900'

  const fmtMs = (has: boolean, v: number) => (has ? `${formatNumber(v)} ms` : '—')

  const resultCards: { label: string; value: string; highlight?: boolean }[] = [
    { label: 'Avg RT', value: fmtMs(stats.correctCount > 0, stats.averageTime) },
    { label: 'Congruent', value: fmtMs(stats.hasCongruent, stats.congruentAvg) },
    { label: 'Incongruent', value: fmtMs(stats.hasIncongruent, stats.incongruentAvg) },
    {
      label: 'Interference cost',
      value: stats.interference === null ? '—' : `${stats.interference >= 0 ? '+' : '−'}${formatNumber(Math.abs(stats.interference))} ms`,
      highlight: true,
    },
  ]

  return (
    <GameWrapper
      gameType="Flanker"
      scores={scores}
      loading={loading}
      onRefresh={loadScores}
      fetchScores={getFlankerScores}
      scoreTable="flanker_scores"
      formatScore={formatScore}
      sortKey="correct_answers"
      customSort={(a: FlankerScore, b: FlankerScore) =>
        b.correct_answers - a.correct_answers || a.average_time - b.average_time
      }
    >
      <div className="w-full">
        {/* Status row */}
        <div className="mb-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="flex items-baseline gap-2">
              <span className="eyebrow">Trial</span>
              <span className="num text-sm font-medium text-gray-900 dark:text-gray-100">
                {displayTrial}/{TOTAL_TRIALS}
              </span>
            </div>
            <span className="text-gray-300 dark:text-gray-700" aria-hidden="true">·</span>
            <div className="flex items-baseline gap-2">
              <span className="eyebrow">Correct</span>
              <span className="num text-sm font-medium text-gray-900 dark:text-gray-100">{stats.correctCount}</span>
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
        <div
          className={`flex min-h-[420px] select-none flex-col items-center justify-center rounded-2xl border p-6 transition-colors duration-100 sm:min-h-[480px] ${stageTint}`}
        >
          {phase === 'idle' && (
            <div className="flex max-w-md flex-col items-center text-center">
              <p className="mb-8 text-base text-gray-600 dark:text-gray-300">
                Respond to the <span className="font-semibold text-gray-950 dark:text-white">centre arrow</span> only, using{' '}
                <span className="num text-sm">←</span>/<span className="num text-sm">→</span> or{' '}
                <span className="num text-sm">A</span>/<span className="num text-sm">D</span>. {TOTAL_TRIALS} trials.
              </p>
              <button onClick={start} className="btn-primary">
                Start
              </button>
              <p className="eyebrow mt-4">or press Space</p>
            </div>
          )}

          {playing && (
            <div className="flex w-full flex-col items-center">
              {/* Fixed-height stimulus area so layout never jumps */}
              <div className="flex h-28 w-full items-center justify-center sm:h-36" aria-live="off">
                {phase === 'fixation' && (
                  <span className="num text-5xl font-light text-gray-400 dark:text-gray-500 sm:text-6xl">+</span>
                )}
                {phase === 'stimulus' && currentTrial && (
                  <div className="flex items-center gap-2 text-gray-950 dark:text-gray-50 sm:gap-4">
                    {[0, 1, 2, 3, 4].map(i => {
                      const dir: Direction =
                        i === 2 || currentTrial.congruent
                          ? currentTrial.center
                          : currentTrial.center === 'left'
                            ? 'right'
                            : 'left'
                      return <Arrow key={i} direction={dir} className="h-12 w-12 sm:h-20 sm:w-20" />
                    })}
                  </div>
                )}
                {phase === 'feedback' && feedback === 'correct' && (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-10 w-10 text-signal-600 dark:text-signal-400" aria-hidden="true">
                    <path d="M5 12.5l4.5 4.5L19 7.5" />
                  </svg>
                )}
                {phase === 'feedback' && feedback === 'wrong' && (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className="h-10 w-10 text-red-600 dark:text-red-400" aria-hidden="true">
                    <path d="M6 6l12 12M18 6L6 18" />
                  </svg>
                )}
                {phase === 'feedback' && feedback === 'timeout' && (
                  <span className="eyebrow text-red-600! dark:text-red-400!">Too slow</span>
                )}
              </div>

              {/* Touch buttons */}
              <div className="mt-10 grid w-full max-w-sm grid-cols-2 gap-3 sm:mt-14">
                {(['left', 'right'] as Direction[]).map(dir => (
                  <button
                    key={dir}
                    type="button"
                    tabIndex={-1}
                    aria-label={dir === 'left' ? 'Left' : 'Right'}
                    onPointerDown={e => {
                      e.preventDefault()
                      respond(dir)
                    }}
                    className="flex h-20 touch-manipulation items-center justify-center rounded-2xl border border-gray-200 bg-gray-50 text-gray-700 transition-colors active:bg-gray-100 hover:border-gray-400 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-200 dark:hover:border-gray-600 dark:active:bg-gray-800 sm:h-24"
                  >
                    <Arrow direction={dir} className="h-8 w-8" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {phase === 'finished' && (
            <div className="flex w-full max-w-2xl flex-col items-center text-center">
              <span className="eyebrow">Result</span>
              <div className="num mt-3 text-6xl font-bold tracking-tight text-gray-950 dark:text-white sm:text-7xl">
                {stats.correctCount}/{TOTAL_TRIALS}
              </div>
              <div className="mt-8 grid w-full grid-cols-2 gap-3 sm:grid-cols-4">
                {resultCards.map(card => (
                  <div key={card.label} className="card p-4 text-left">
                    <div className="eyebrow">{card.label}</div>
                    <div
                      className={`num mt-2 text-lg font-semibold ${
                        card.highlight ? 'text-signal-600 dark:text-signal-400' : 'text-gray-950 dark:text-gray-50'
                      }`}
                    >
                      {card.value}
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-4 max-w-md text-xs text-gray-500 dark:text-gray-400">
                Interference cost is how much slower you were when the flanking arrows pointed the other way.
              </p>
              <button
                onClick={() => {
                  resetGame()
                  start()
                }}
                className="btn-ink mt-8"
              >
                Try again
              </button>
              {!username && (
                <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
                  Set a username to save your score to the leaderboard. This result was not saved.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </GameWrapper>
  )
}
