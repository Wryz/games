'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { getMentalRotationScores, submitMentalRotationScore } from '@/lib/scores'
import { useUser } from '@/contexts/UserContext'
import { supabase } from '@/lib/supabase'
import GameWrapper from '../GameWrapper'
import type { MentalRotationScore } from '@/lib/supabase'
import { formatNumber } from '@/lib/levels'

type Phase = 'idle' | 'playing' | 'feedback' | 'finished'
type Answer = 'same' | 'mirror'
type Cell = [number, number]

interface Trial {
  cells: Cell[] // already centred on the centroid (cell = unit square at [x, y])
  base: number // left shape rotation (deg)
  offset: number // right shape = base + offset
  mirror: boolean
}

interface TrialResult {
  correct: boolean
  rt: number
  offset: number
}

const TOTAL_TRIALS = 20
const FEEDBACK_MS = 300
// Offsets whose angular distance from 0 is <= 90 deg
const SMALL_OFFSETS = [45, 60, 90, 270, 300, 315]
// Offsets 120..240 deg (> 90 deg away from 0)
const LARGE_OFFSETS = [120, 135, 150, 180, 210, 225, 240]
// ViewBox is [-VIEW_HALF, VIEW_HALF]^2 centred on the shape's centroid; cells are 1 unit
const VIEW_HALF = 5
const MAX_RADIUS = VIEW_HALF - 0.4

// ---------- Polyomino geometry ----------

const keyOf = (cells: Cell[]) => {
  const minX = Math.min(...cells.map(c => c[0]))
  const minY = Math.min(...cells.map(c => c[1]))
  return cells
    .map(([x, y]) => [x - minX, y - minY] as Cell)
    .sort((a, b) => a[0] - b[0] || a[1] - b[1])
    .map(c => c.join(','))
    .join(';')
}

const rot90 = (cells: Cell[]): Cell[] => cells.map(([x, y]) => [-y, x])
const reflect = (cells: Cell[]): Cell[] => cells.map(([x, y]) => [-x, y])

/** True if the mirror image equals some 90-degree rotation (i.e. the shape has a reflection axis). */
function isAchiral(cells: Cell[]) {
  const mirrorKey = keyOf(reflect(cells))
  let r = cells
  for (let k = 0; k < 4; k++) {
    if (keyOf(r) === mirrorKey) return true
    r = rot90(r)
  }
  return false
}

function hasHalfTurnSymmetry(cells: Cell[]) {
  return keyOf(cells) === keyOf(rot90(rot90(cells)))
}

function growPolyomino(size: number): Cell[] {
  const cells: Cell[] = [[0, 0]]
  const taken = new Set(['0,0'])
  const dirs: Cell[] = [[1, 0], [-1, 0], [0, 1], [0, -1]]
  while (cells.length < size) {
    const [x, y] = cells[Math.floor(Math.random() * cells.length)]
    const [dx, dy] = dirs[Math.floor(Math.random() * 4)]
    const k = `${x + dx},${y + dy}`
    if (!taken.has(k)) {
      taken.add(k)
      cells.push([x + dx, y + dy])
    }
  }
  return cells
}

/** Centre cells on the centroid; returns null if any rotation would clip the viewBox. */
function centre(cells: Cell[]): Cell[] | null {
  const cx = cells.reduce((s, c) => s + c[0] + 0.5, 0) / cells.length
  const cy = cells.reduce((s, c) => s + c[1] + 0.5, 0) / cells.length
  const out: Cell[] = cells.map(([x, y]) => [x - cx, y - cy])
  let r = 0
  for (const [x, y] of out) {
    for (const [ox, oy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
      r = Math.max(r, Math.hypot(x + ox, y + oy))
    }
  }
  return r <= MAX_RADIUS ? out : null
}

function randomChiralShape(): Cell[] {
  for (let i = 0; i < 1000; i++) {
    const cells = growPolyomino(Math.random() < 0.5 ? 6 : 7)
    if (isAchiral(cells) || hasHalfTurnSymmetry(cells)) continue
    const c = centre(cells)
    if (c) return c
  }
  // Fallback: a known chiral, asymmetric heptomino
  return centre([[0, 0], [1, 0], [2, 0], [2, 1], [3, 1], [3, 2], [0, 1]])!
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** Balanced design: 10 same / 10 mirror, each split evenly between small and large rotations. */
function buildTrials(): Trial[] {
  const pick = (list: number[]) => list[Math.floor(Math.random() * list.length)]
  const design: { mirror: boolean; large: boolean }[] = []
  for (let i = 0; i < TOTAL_TRIALS; i++) {
    design.push({ mirror: i % 2 === 1, large: Math.floor(i / 2) % 2 === 1 })
  }
  return shuffle(design).map(({ mirror, large }) => ({
    cells: randomChiralShape(),
    base: Math.floor(Math.random() * 360),
    offset: pick(large ? LARGE_OFFSETS : SMALL_OFFSETS),
    mirror,
  }))
}

const angularDistance = (deg: number) => {
  const d = ((deg % 360) + 360) % 360
  return Math.min(d, 360 - d)
}

const average = (xs: number[]) => (xs.length ? Math.round(xs.reduce((s, x) => s + x, 0) / xs.length) : 0)

// ---------- Rendering ----------

function ShapeSvg({ cells, rotation, mirror, label }: { cells: Cell[]; rotation: number; mirror: boolean; label: string }) {
  // Transform list applies right-to-left: mirror about the centre first, then rotate about it.
  const transform = `rotate(${rotation} 0 0)${mirror ? ' scale(-1,1)' : ''}`
  return (
    <svg
      viewBox={`${-VIEW_HALF} ${-VIEW_HALF} ${VIEW_HALF * 2} ${VIEW_HALF * 2}`}
      className="h-full w-full"
      role="img"
      aria-label={label}
    >
      <g transform={transform}>
        {cells.map(([x, y], i) => (
          <rect
            key={i}
            x={x}
            y={y}
            width={1}
            height={1}
            className="fill-gray-900 stroke-white dark:fill-gray-100 dark:stroke-gray-900"
            strokeWidth={0.07}
            strokeLinejoin="round"
          />
        ))}
      </g>
    </svg>
  )
}

const EXAMPLE_CELLS = centre([[0, 0], [1, 0], [2, 0], [2, 1], [3, 1], [0, 1]])!

export default function MentalRotation() {
  const [scores, setScores] = useState<MentalRotationScore[]>([])
  const [loading, setLoading] = useState(true)
  const [phase, setPhase] = useState<Phase>('idle')
  const [trials, setTrials] = useState<Trial[]>([])
  const [trialIndex, setTrialIndex] = useState(0)
  const [results, setResults] = useState<TrialResult[]>([])
  const [lastCorrect, setLastCorrect] = useState<boolean | null>(null)
  const { username } = useUser()

  const phaseRef = useRef<Phase>(phase)
  const trialsRef = useRef<Trial[]>(trials)
  const trialIndexRef = useRef(trialIndex)
  const resultsRef = useRef<TrialResult[]>(results)
  const onsetRef = useRef(0)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const hasSubmittedScore = useRef(false)

  phaseRef.current = phase
  trialsRef.current = trials
  trialIndexRef.current = trialIndex
  resultsRef.current = results

  const clearTimers = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }, [])

  const loadScores = async () => {
    try {
      setLoading(true)
      const data = await getMentalRotationScores({ limit: 50 })
      setScores(data ?? [])
    } catch (error) {
      console.error('Error loading scores:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadScores()

    let channel: ReturnType<typeof supabase.channel> | null = null
    try {
      channel = supabase
        .channel('mental_rotation_scores_changes')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'mental_rotation_scores'
          },
          (payload) => {
            setScores(prev => [payload.new as MentalRotationScore, ...prev.slice(0, 49)])
          }
        )
        .subscribe()
    } catch (error) {
      console.error('Error subscribing to mental rotation scores:', error)
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

  // Stimulus onset: stamp after the new trial has been committed and painted
  useEffect(() => {
    if (phase !== 'playing') return
    onsetRef.current = 0
    const raf = requestAnimationFrame(() => {
      onsetRef.current = performance.now()
    })
    return () => cancelAnimationFrame(raf)
  }, [phase, trialIndex])

  const startGame = useCallback(() => {
    clearTimers()
    const t = buildTrials()
    trialsRef.current = t
    trialIndexRef.current = 0
    resultsRef.current = []
    phaseRef.current = 'playing'
    hasSubmittedScore.current = false
    setTrials(t)
    setTrialIndex(0)
    setResults([])
    setLastCorrect(null)
    setPhase('playing')
  }, [clearTimers])

  const respond = useCallback((answer: Answer) => {
    if (phaseRef.current !== 'playing') return
    const trial = trialsRef.current[trialIndexRef.current]
    if (!trial) return
    const now = performance.now()
    const rt = onsetRef.current > 0 ? Math.round(now - onsetRef.current) : 0
    const correct = (answer === 'mirror') === trial.mirror
    const nextResults = [...resultsRef.current, { correct, rt, offset: trial.offset }]
    resultsRef.current = nextResults
    phaseRef.current = 'feedback'
    setResults(nextResults)
    setLastCorrect(correct)
    setPhase('feedback')

    clearTimers()
    timeoutRef.current = setTimeout(() => {
      const next = trialIndexRef.current + 1
      if (next >= TOTAL_TRIALS) {
        phaseRef.current = 'finished'
        setPhase('finished')
      } else {
        trialIndexRef.current = next
        phaseRef.current = 'playing'
        setTrialIndex(next)
        setLastCorrect(null)
        setPhase('playing')
      }
    }, FEEDBACK_MS)
  }, [clearTimers])

  // Keyboard: S / ArrowLeft = same, M / ArrowRight = mirror
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat || e.metaKey || e.ctrlKey || e.altKey) return
      const target = e.target as HTMLElement | null
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) return
      if (phaseRef.current !== 'playing' && phaseRef.current !== 'feedback') return
      const k = e.key.toLowerCase()
      let answer: Answer | null = null
      if (k === 's' || e.key === 'ArrowLeft') answer = 'same'
      else if (k === 'm' || e.key === 'ArrowRight') answer = 'mirror'
      if (!answer) return
      e.preventDefault()
      respond(answer)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [respond])

  // Derived stats
  const correctCount = results.filter(r => r.correct).length
  const correctRts = results.filter(r => r.correct && r.rt > 0)
  const avgRt = average(correctRts.map(r => r.rt))
  const smallRts = correctRts.filter(r => angularDistance(r.offset) <= 90).map(r => r.rt)
  const largeRts = correctRts.filter(r => angularDistance(r.offset) > 90).map(r => r.rt)
  const smallAvg = average(smallRts)
  const largeAvg = average(largeRts)
  const hasCost = smallRts.length > 0 && largeRts.length > 0
  const rotationCost = largeAvg - smallAvg

  // Submit score once when finished
  useEffect(() => {
    if (phase !== 'finished' || !username || hasSubmittedScore.current) return
    hasSubmittedScore.current = true
    const final = resultsRef.current
    const rts = final.filter(r => r.correct && r.rt > 0).map(r => r.rt)
    submitMentalRotationScore({
      username,
      correct_answers: final.filter(r => r.correct).length,
      average_time: average(rts),
    })
      .then(() => {
        setTimeout(() => loadScores(), 1000)
      })
      .catch(error => {
        console.error('Error submitting score:', error)
      })
  }, [phase, username])

  const resetGame = useCallback(() => {
    clearTimers()
    phaseRef.current = 'idle'
    trialsRef.current = []
    trialIndexRef.current = 0
    resultsRef.current = []
    hasSubmittedScore.current = false
    setPhase('idle')
    setTrials([])
    setTrialIndex(0)
    setResults([])
    setLastCorrect(null)
  }, [clearTimers])

  const formatScore = (s: MentalRotationScore) =>
    `${formatNumber(s.correct_answers)} correct · ${formatNumber(s.average_time)}ms`

  const trial = trials[trialIndex]
  const inTrial = (phase === 'playing' || phase === 'feedback') && trial
  const shownTrial = phase === 'idle' ? 0 : Math.min(trialIndex + 1, TOTAL_TRIALS)

  const panelBorder =
    phase === 'feedback'
      ? lastCorrect
        ? 'border-signal-500 ring-2 ring-signal-500/30'
        : 'border-red-500 ring-2 ring-red-500/30'
      : 'border-gray-200 dark:border-gray-800'

  return (
    <GameWrapper
      gameType="Mental Rotation"
      scores={scores}
      loading={loading}
      onRefresh={loadScores}
      fetchScores={getMentalRotationScores}
      scoreTable="mental_rotation_scores"
      formatScore={formatScore}
      sortKey="correct_answers"
      customSort={(a: MentalRotationScore, b: MentalRotationScore) =>
        b.correct_answers - a.correct_answers || a.average_time - b.average_time
      }
    >
      <div className="w-full">
        {/* Status row */}
        <div className="mb-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="flex items-baseline gap-2">
              <span className="eyebrow">Trial</span>
              <span className="num text-sm font-semibold text-gray-900 dark:text-gray-100">
                {shownTrial}/{TOTAL_TRIALS}
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="eyebrow">Correct</span>
              <span className="num text-sm font-semibold text-gray-900 dark:text-gray-100">{correctCount}</span>
            </div>
          </div>
          <button
            onClick={resetGame}
            className="text-gray-500 transition-colors hover:text-signal-600 dark:text-gray-400 dark:hover:text-signal-400"
            title="Reset"
            aria-label="Reset"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {/* Stage */}
        <div className="flex min-h-[420px] flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900 sm:min-h-[480px] sm:p-6">
          {phase === 'idle' && (
            <div className="flex max-w-md flex-col items-center text-center">
              <div className="mb-6 grid grid-cols-2 gap-3">
                <div className="h-24 w-24 rounded-xl border border-gray-200 p-2 dark:border-gray-800 sm:h-28 sm:w-28">
                  <ShapeSvg cells={EXAMPLE_CELLS} rotation={20} mirror={false} label="Example shape" />
                </div>
                <div className="h-24 w-24 rounded-xl border border-gray-200 p-2 dark:border-gray-800 sm:h-28 sm:w-28">
                  <ShapeSvg cells={EXAMPLE_CELLS} rotation={140} mirror={false} label="Same shape, rotated" />
                </div>
              </div>
              <p className="mb-2 text-base text-gray-800 dark:text-gray-200">
                Is the right shape the left one rotated, or its mirror image?
              </p>
              <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
                {TOTAL_TRIALS} trials. Press <span className="num">S</span> or <span className="num">&larr;</span> for same,{' '}
                <span className="num">M</span> or <span className="num">&rarr;</span> for mirror. Accuracy first, then speed.
              </p>
              <button onClick={startGame} className="btn-primary px-8">
                Start
              </button>
            </div>
          )}

          {inTrial && (
            <div className="flex w-full max-w-xl flex-col items-center">
              <div className="grid w-full grid-cols-2 gap-2 sm:gap-6">
                {[0, 1].map(side => (
                  <div key={side} className="flex flex-col items-center gap-2">
                    <div
                      className={`aspect-square w-full max-w-[240px] rounded-xl border p-2 transition-colors duration-100 sm:p-3 ${panelBorder}`}
                    >
                      {side === 0 ? (
                        <ShapeSvg cells={trial.cells} rotation={trial.base} mirror={false} label="Reference shape" />
                      ) : (
                        <ShapeSvg
                          cells={trial.cells}
                          rotation={trial.base + trial.offset}
                          mirror={trial.mirror}
                          label="Comparison shape"
                        />
                      )}
                    </div>
                    <span className="eyebrow">{side === 0 ? 'A' : 'B'}</span>
                  </div>
                ))}
              </div>

              <div className="mt-2 h-5">
                {phase === 'feedback' && (
                  <span
                    className={`eyebrow ${lastCorrect ? 'text-signal-600! dark:text-signal-400!' : 'text-red-600! dark:text-red-400!'}`}
                  >
                    {lastCorrect ? 'Correct' : 'Wrong'}
                  </span>
                )}
              </div>

              <div className="mt-3 grid w-full grid-cols-2 gap-3">
                <button
                  onClick={() => respond('same')}
                  disabled={phase !== 'playing'}
                  className="btn-ghost w-full py-4 text-base disabled:opacity-100"
                >
                  Same <span className="num text-xs text-gray-400 dark:text-gray-500">S</span>
                </button>
                <button
                  onClick={() => respond('mirror')}
                  disabled={phase !== 'playing'}
                  className="btn-ghost w-full py-4 text-base disabled:opacity-100"
                >
                  Mirror <span className="num text-xs text-gray-400 dark:text-gray-500">M</span>
                </button>
              </div>
            </div>
          )}

          {phase === 'finished' && (
            <div className="flex w-full max-w-md flex-col items-center text-center">
              <span className="eyebrow mb-2">Result</span>
              <div className="num text-6xl font-bold text-gray-950 dark:text-gray-50 sm:text-7xl">
                {correctCount}/{TOTAL_TRIALS}
              </div>

              <div className="mt-8 grid w-full grid-cols-2 gap-3 text-left">
                <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
                  <div className="eyebrow mb-1">Avg correct RT</div>
                  <div className="num text-2xl font-semibold text-gray-900 dark:text-gray-100">
                    {correctRts.length ? `${formatNumber(avgRt)}ms` : '—'}
                  </div>
                </div>
                <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
                  <div className="eyebrow mb-1">Rotation cost</div>
                  <div className="num text-2xl font-semibold text-gray-900 dark:text-gray-100">
                    {hasCost ? `${rotationCost >= 0 ? '+' : '−'}${formatNumber(Math.abs(rotationCost))}ms` : '—'}
                  </div>
                  <div className="num mt-1 text-xs text-gray-500 dark:text-gray-400">
                    ≤90° {smallRts.length ? `${formatNumber(smallAvg)}ms` : '—'} · 120–240°{' '}
                    {largeRts.length ? `${formatNumber(largeAvg)}ms` : '—'}
                  </div>
                </div>
              </div>
              <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                Response time typically grows with the angle you have to rotate through.
              </p>

              <button onClick={startGame} className="btn-ink mt-8 px-8">
                Try again
              </button>
              {!username && (
                <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
                  Set a username to save your score to the leaderboard. This score wasn&apos;t saved.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </GameWrapper>
  )
}
