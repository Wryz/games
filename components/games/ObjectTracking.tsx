'use client'

import { useState, useEffect, useRef, useCallback, useLayoutEffect } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import { getObjectTrackingScores, submitObjectTrackingScore } from '@/lib/scores'
import { useUser } from '@/contexts/UserContext'
import { supabase } from '@/lib/supabase'
import GameWrapper from '../GameWrapper'
import type { ObjectTrackingScore } from '@/lib/supabase'
import { formatNumber } from '@/lib/levels'

/**
 * Multiple Object Tracking (Pylyshyn & Storm, 1988).
 *
 * Each round: N identical dots; K flash as targets, then all move for a few
 * seconds and stop. The player picks K dots. A perfect round adds a target
 * (and distractors); any miss costs a life. Score = the largest K tracked
 * perfectly.
 *
 * The arena is a 100×100 SVG viewBox, so all physics is in viewBox units and
 * scales to any screen. Motion runs in a requestAnimationFrame loop with a
 * clamped, time-based step, and positions are written straight to the DOM so
 * React never re-renders per frame. Round timing is measured in simulated
 * time, so switching tabs pauses the round instead of skipping it.
 */

type Phase = 'idle' | 'cue' | 'track' | 'respond' | 'feedback' | 'finished'

interface Dot {
  x: number
  y: number
  /** Direction of travel, radians */
  heading: number
  /** Current turn rate, radians / second (random walk → smooth curves) */
  turn: number
}

interface RoundResult {
  targets: number
  hits: number
}

const ARENA = 100
const R = 3.4 // dot radius
const MIN_GAP = 2 * R + 1.6 // centre-to-centre distance dots are never allowed inside
const SPAWN_GAP = 2 * R + 5
const HIT_RADIUS = R * 2.3 // generous touch target; nearest dot wins
const REPEL_RANGE = 2 * R + 7
const REPEL_ACCEL = 180
const WALL_RANGE = 6
const WALL_ACCEL = 140
const TURN_NOISE = 7
const TURN_DAMPING = 1.6
const MAX_TURN = 2.4
const MAX_FRAME_S = 0.05 // clamp so a stalled tab never teleports dots
const MAX_STEP_S = 1 / 120

const MAX_LIVES = 3
const START_TARGETS = 2
const MAX_TARGETS = 20
const MAX_DOTS = 24
const CUE_MS = 2000
const BLINK_MS = 350
const BLINK_UNTIL_MS = 1400
const FEEDBACK_HIT_MS = 1100
const FEEDBACK_MISS_MS = 2000

/** Total dots for K targets: 2K + 4, capped so the arena never gets crowded. */
const dotsFor = (k: number) => Math.max(k + 4, Math.min(MAX_DOTS, k * 2 + 4))
/** Arena widths per second. Starts gentle and speeds up a little each level. */
const speedFor = (k: number) => Math.min(34, 20 + (k - START_TARGETS) * 2)
/** Tracking phase length: 5 s at K=2, rising to 6 s from K=6. */
const trackMsFor = (k: number) => 5000 + Math.min(1000, (k - START_TARGETS) * 250)

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

function spawnDots(n: number): Dot[] {
  const dots: Dot[] = []
  const lo = R + 2
  const hi = ARENA - R - 2
  let gap = SPAWN_GAP
  let attempts = 0
  while (dots.length < n) {
    const x = lo + Math.random() * (hi - lo)
    const y = lo + Math.random() * (hi - lo)
    if (dots.every(d => (d.x - x) ** 2 + (d.y - y) ** 2 >= gap * gap)) {
      dots.push({ x, y, heading: Math.random() * Math.PI * 2, turn: 0 })
      attempts = 0
    } else if (++attempts > 400) {
      // Arena too tight for this spacing: relax it, but never below the no-touch gap
      gap = Math.max(MIN_GAP, gap - 0.5)
      attempts = 0
    }
  }
  return dots
}

function pickTargets(n: number, k: number): number[] {
  const idx = Array.from({ length: n }, (_, i) => i)
  for (let i = idx.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[idx[i], idx[j]] = [idx[j], idx[i]]
  }
  return idx.slice(0, k)
}

/** Keep dots inside the arena and apart from each other, bouncing on contact. */
function resolveContacts(dots: Dot[]) {
  const n = dots.length
  for (let iter = 0; iter < 3; iter++) {
    for (let i = 0; i < n; i++) {
      const a = dots[i]
      for (let j = i + 1; j < n; j++) {
        const b = dots[j]
        let dx = b.x - a.x
        let dy = b.y - a.y
        let d = Math.hypot(dx, dy)
        if (d >= MIN_GAP) continue
        if (d < 1e-6) {
          const ang = Math.random() * Math.PI * 2
          dx = Math.cos(ang)
          dy = Math.sin(ang)
          d = 1
        }
        const ux = dx / d
        const uy = dy / d
        const push = (MIN_GAP - d) / 2
        a.x -= ux * push
        a.y -= uy * push
        b.x += ux * push
        b.y += uy * push

        // Elastic bounce: swap the velocity components along the contact normal
        let avx = Math.cos(a.heading)
        let avy = Math.sin(a.heading)
        let bvx = Math.cos(b.heading)
        let bvy = Math.sin(b.heading)
        const an = avx * ux + avy * uy
        const bn = bvx * ux + bvy * uy
        if (an - bn > 0) {
          avx += (bn - an) * ux
          avy += (bn - an) * uy
          bvx += (an - bn) * ux
          bvy += (an - bn) * uy
          a.heading = Math.atan2(avy, avx)
          b.heading = Math.atan2(bvy, bvx)
        }
      }
    }
    for (const d of dots) {
      if (d.x < R) {
        d.x = R
        if (Math.cos(d.heading) < 0) d.heading = Math.PI - d.heading
      } else if (d.x > ARENA - R) {
        d.x = ARENA - R
        if (Math.cos(d.heading) > 0) d.heading = Math.PI - d.heading
      }
      if (d.y < R) {
        d.y = R
        if (Math.sin(d.heading) < 0) d.heading = -d.heading
      } else if (d.y > ARENA - R) {
        d.y = ARENA - R
        if (Math.sin(d.heading) > 0) d.heading = -d.heading
      }
    }
  }
}

/** Advance the simulation by dt seconds at a constant speed. */
function stepDots(dots: Dot[], dt: number, speed: number) {
  const n = dots.length
  const vx = new Float64Array(n)
  const vy = new Float64Array(n)
  const noise = TURN_NOISE * Math.sqrt(dt)
  const damping = Math.exp(-TURN_DAMPING * dt)

  for (let i = 0; i < n; i++) {
    const d = dots[i]
    d.turn = clamp((d.turn + (Math.random() * 2 - 1) * noise) * damping, -MAX_TURN, MAX_TURN)
    d.heading += d.turn * dt
    vx[i] = Math.cos(d.heading) * speed
    vy[i] = Math.sin(d.heading) * speed
  }

  // Soft repulsion: dots steer away from each other before they touch
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const dx = dots[j].x - dots[i].x
      const dy = dots[j].y - dots[i].y
      const dist = Math.hypot(dx, dy)
      if (dist <= 0 || dist >= REPEL_RANGE) continue
      const f = (REPEL_ACCEL * (1 - dist / REPEL_RANGE) * dt) / dist
      vx[i] -= dx * f
      vy[i] -= dy * f
      vx[j] += dx * f
      vy[j] += dy * f
    }
  }

  for (let i = 0; i < n; i++) {
    const d = dots[i]
    // Soft walls: curve away from the edges rather than hugging them
    const left = d.x - R
    const right = ARENA - R - d.x
    const top = d.y - R
    const bottom = ARENA - R - d.y
    if (left < WALL_RANGE) vx[i] += WALL_ACCEL * (1 - left / WALL_RANGE) * dt
    if (right < WALL_RANGE) vx[i] -= WALL_ACCEL * (1 - right / WALL_RANGE) * dt
    if (top < WALL_RANGE) vy[i] += WALL_ACCEL * (1 - top / WALL_RANGE) * dt
    if (bottom < WALL_RANGE) vy[i] -= WALL_ACCEL * (1 - bottom / WALL_RANGE) * dt

    if (vx[i] !== 0 || vy[i] !== 0) d.heading = Math.atan2(vy[i], vx[i])
    d.x += Math.cos(d.heading) * speed * dt
    d.y += Math.sin(d.heading) * speed * dt
  }

  resolveContacts(dots)
}

export default function ObjectTracking() {
  const [scores, setScores] = useState<ObjectTrackingScore[]>([])
  const [loading, setLoading] = useState(true)
  const [phase, setPhase] = useState<Phase>('idle')
  const [roundId, setRoundId] = useState(0)
  const [targetCount, setTargetCount] = useState(START_TARGETS)
  const [dotCount, setDotCount] = useState(0)
  const [targets, setTargets] = useState<number[]>([])
  const [selected, setSelected] = useState<number[]>([])
  const [cueOn, setCueOn] = useState(true)
  const [lives, setLives] = useState(MAX_LIVES)
  const [best, setBest] = useState(0)
  const [results, setResults] = useState<RoundResult[]>([])
  const [saveState, setSaveState] = useState<'idle' | 'saved' | 'error'>('idle')
  const { username } = useUser()

  const phaseRef = useRef<Phase>('idle')
  const dotsRef = useRef<Dot[]>([])
  // Positions at the start of the round, for rendering. The animation then moves the
  // circles by writing to the DOM; React leaves cx/cy alone while this snapshot is unchanged.
  const [roundDots, setRoundDots] = useState<Dot[]>([])
  const circleRefs = useRef<(SVGCircleElement | null)[]>([])
  const svgRef = useRef<SVGSVGElement | null>(null)
  const targetsRef = useRef<number[]>([])
  const selectedRef = useRef<number[]>([])
  const kRef = useRef(START_TARGETS)
  const livesRef = useRef(MAX_LIVES)
  const resultsRef = useRef<RoundResult[]>([])
  const roundIdRef = useRef(0)
  const rafRef = useRef<number | null>(null)
  const lastTsRef = useRef<number | null>(null)
  const simMsRef = useRef(0)
  const cueOnRef = useRef(true)
  const speedRef = useRef(speedFor(START_TARGETS))
  const trackMsRef = useRef(trackMsFor(START_TARGETS))
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hasSubmittedScore = useRef(false)

  const setPhaseBoth = (p: Phase) => {
    phaseRef.current = p
    setPhase(p)
  }

  const stopLoop = () => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    lastTsRef.current = null
  }

  const clearTimers = () => {
    stopLoop()
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }

  // State is only set in promise callbacks, so this is safe to call from an effect
  const fetchScores = useCallback(() => {
    return getObjectTrackingScores({ limit: 50 })
      .then(data => {
        setScores(data ?? [])
      })
      .catch(error => {
        console.error('Error loading object tracking scores:', error)
      })
      .finally(() => setLoading(false))
  }, [])

  const loadScores = useCallback(() => {
    setLoading(true)
    return fetchScores()
  }, [fetchScores])

  useEffect(() => {
    fetchScores()

    let channel: ReturnType<typeof supabase.channel> | null = null
    try {
      channel = supabase
        .channel('object_tracking_scores_changes')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'object_tracking_scores' },
          (payload) => {
            setScores(prev => [payload.new as ObjectTrackingScore, ...prev.slice(0, 49)])
          }
        )
        .subscribe()
    } catch (error) {
      console.error('Error subscribing to object tracking scores:', error)
    }

    return () => {
      if (channel) {
        try {
          supabase.removeChannel(channel)
        } catch {
          // ignore
        }
      }
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [fetchScores])

  // --- Animation loop (refs only, so the closure never goes stale) ---

  const paintDots = () => {
    const dots = dotsRef.current
    for (let i = 0; i < dots.length; i++) {
      const el = circleRefs.current[i]
      if (!el) continue
      el.setAttribute('cx', dots[i].x.toFixed(2))
      el.setAttribute('cy', dots[i].y.toFixed(2))
    }
  }

  const tick = (ts: number) => {
    rafRef.current = null
    const p = phaseRef.current
    if (p !== 'cue' && p !== 'track') return

    const last = lastTsRef.current
    lastTsRef.current = ts
    const frameS = last === null ? 0 : Math.min(MAX_FRAME_S, Math.max(0, (ts - last) / 1000))
    simMsRef.current += frameS * 1000
    const t = simMsRef.current

    if (p === 'cue') {
      const on = t >= BLINK_UNTIL_MS || Math.floor(t / BLINK_MS) % 2 === 0
      if (on !== cueOnRef.current) {
        cueOnRef.current = on
        setCueOn(on)
      }
      if (t >= CUE_MS) {
        simMsRef.current = 0
        setPhaseBoth('track')
      }
    } else {
      let remaining = frameS
      while (remaining > 1e-9) {
        const dt = Math.min(MAX_STEP_S, remaining)
        stepDots(dotsRef.current, dt, speedRef.current)
        remaining -= dt
      }
      paintDots()
      if (t >= trackMsRef.current) {
        // Motion is over: hand the final positions back to React (matches the DOM, so no jump)
        setRoundDots(dotsRef.current.map(d => ({ ...d })))
        setPhaseBoth('respond')
        return
      }
    }
    rafRef.current = requestAnimationFrame(tick)
  }

  const startRound = (k: number) => {
    clearTimers()
    const total = dotsFor(k)
    const dots = spawnDots(total)
    const t = pickTargets(total, k)
    const reduceMotion =
      typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

    dotsRef.current = dots
    targetsRef.current = t
    selectedRef.current = []
    kRef.current = k
    speedRef.current = speedFor(k) * (reduceMotion ? 0.8 : 1)
    trackMsRef.current = trackMsFor(k)
    simMsRef.current = 0
    cueOnRef.current = true
    roundIdRef.current += 1

    setRoundId(roundIdRef.current)
    setTargetCount(k)
    setDotCount(total)
    setRoundDots(dots.map(d => ({ ...d })))
    setTargets(t)
    setSelected([])
    setCueOn(true)
    setPhaseBoth('cue')
    rafRef.current = requestAnimationFrame(tick)
  }

  const finishRound = () => {
    const k = kRef.current
    const targetSet = new Set(targetsRef.current)
    const hits = selectedRef.current.filter(i => targetSet.has(i)).length
    const perfect = hits === k

    const nextResults = [...resultsRef.current, { targets: k, hits }]
    resultsRef.current = nextResults
    setResults(nextResults)

    let remainingLives = livesRef.current
    if (perfect) {
      setBest(prev => Math.max(prev, k))
    } else {
      remainingLives -= 1
      livesRef.current = remainingLives
      setLives(remainingLives)
    }
    setPhaseBoth('feedback')

    const id = roundIdRef.current
    timeoutRef.current = setTimeout(() => {
      timeoutRef.current = null
      if (roundIdRef.current !== id || phaseRef.current !== 'feedback') return
      if (remainingLives <= 0) {
        setPhaseBoth('finished')
      } else {
        startRound(perfect ? Math.min(MAX_TARGETS, k + 1) : k)
      }
    }, perfect ? FEEDBACK_HIT_MS : FEEDBACK_MISS_MS)
  }

  const handlePointer = (e: ReactPointerEvent<SVGSVGElement>) => {
    if (phaseRef.current !== 'respond') return
    const svg = svgRef.current
    if (!svg) return
    e.preventDefault()
    const rect = svg.getBoundingClientRect()
    if (rect.width === 0 || rect.height === 0) return
    const x = ((e.clientX - rect.left) / rect.width) * ARENA
    const y = ((e.clientY - rect.top) / rect.height) * ARENA

    let nearest = -1
    let nearestDist = Infinity
    dotsRef.current.forEach((d, i) => {
      const dist = Math.hypot(d.x - x, d.y - y)
      if (dist < nearestDist) {
        nearestDist = dist
        nearest = i
      }
    })
    if (nearest < 0 || nearestDist > HIT_RADIUS) return

    const current = selectedRef.current
    const next = current.includes(nearest) ? current.filter(i => i !== nearest) : [...current, nearest]
    selectedRef.current = next
    setSelected(next)
    if (next.length >= kRef.current) finishRound()
  }

  const startGame = () => {
    clearTimers()
    hasSubmittedScore.current = false
    livesRef.current = MAX_LIVES
    resultsRef.current = []
    setLives(MAX_LIVES)
    setBest(0)
    setResults([])
    setSaveState('idle')
    startRound(START_TARGETS)
  }

  const resetGame = () => {
    clearTimers()
    roundIdRef.current += 1
    dotsRef.current = []
    setRoundDots([])
    targetsRef.current = []
    selectedRef.current = []
    resultsRef.current = []
    livesRef.current = MAX_LIVES
    kRef.current = START_TARGETS
    hasSubmittedScore.current = false
    setPhaseBoth('idle')
    setDotCount(0)
    setTargets([])
    setSelected([])
    setTargetCount(START_TARGETS)
    setLives(MAX_LIVES)
    setBest(0)
    setResults([])
    setSaveState('idle')
  }

  // Keyboard: Space / Enter starts. Latest handler via ref so the listener is attached once.
  const startRef = useRef(startGame)
  useLayoutEffect(() => {
    startRef.current = startGame
  })

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const target = e.target as HTMLElement | null
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) return
      const p = phaseRef.current
      if (p === 'idle' && (e.key === ' ' || e.key === 'Enter')) {
        e.preventDefault()
        if (!e.repeat) startRef.current()
      } else if (p !== 'idle' && p !== 'finished' && e.key === ' ') {
        e.preventDefault() // avoid page scroll mid-run
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  // Submit once when the run ends
  useEffect(() => {
    if (phase !== 'finished' || !username || hasSubmittedScore.current) return
    hasSubmittedScore.current = true
    if (best <= 0) return

    submitObjectTrackingScore({ username, objects_tracked: best })
      .then(() => {
        setSaveState('saved')
        setTimeout(() => loadScores(), 1000)
      })
      .catch(error => {
        console.error('Error submitting object tracking score:', error)
        setSaveState('error')
      })
  }, [phase, username, best, loadScores])

  const formatScore = useCallback(
    (s: ObjectTrackingScore) => `${formatNumber(s.objects_tracked)} objects`,
    []
  )

  const inRun = phase === 'cue' || phase === 'track' || phase === 'respond' || phase === 'feedback'
  const targetSet = new Set(targets)
  const selectedSet = new Set(selected)
  const lastResult = results[results.length - 1]
  const missed = phase === 'feedback' && lastResult !== undefined && lastResult.hits < lastResult.targets

  const totalTargets = results.reduce((s, r) => s + r.targets, 0)
  const totalHits = results.reduce((s, r) => s + r.hits, 0)
  const perfectRounds = results.filter(r => r.hits === r.targets).length
  const hitRate = totalTargets > 0 ? Math.round((totalHits / totalTargets) * 100) : 0

  const caption = (() => {
    switch (phase) {
      case 'cue':
        return `Remember the ${targetCount} blue dots`
      case 'track':
        return 'Keep tracking'
      case 'respond':
        return `Tap the ${targetCount} targets · ${selected.length}/${targetCount}`
      case 'feedback':
        return missed && lastResult
          ? `${lastResult.hits}/${lastResult.targets} found · targets ringed`
          : `All ${targetCount} found`
      default:
        return ''
    }
  })()

  const dotClass = (i: number) => {
    const isTarget = targetSet.has(i)
    const isSelected = selectedSet.has(i)
    switch (phase) {
      case 'cue':
        return isTarget && cueOn ? 'fill-signal-600 dark:fill-signal-400' : 'fill-gray-900 dark:fill-gray-100'
      case 'respond':
        return isSelected ? 'fill-signal-600 dark:fill-signal-400' : 'fill-gray-900 dark:fill-gray-100'
      case 'feedback':
        if (isSelected && isTarget) return 'fill-signal-600 dark:fill-signal-400'
        if (isSelected) return 'fill-red-500 dark:fill-red-400'
        if (isTarget) return 'fill-gray-900 dark:fill-gray-100'
        return 'fill-gray-900 opacity-25 dark:fill-gray-100'
      default:
        return 'fill-gray-900 dark:fill-gray-100'
    }
  }

  const stageTint = missed
    ? 'border-red-400 bg-red-50 dark:border-red-700 dark:bg-red-950/40'
    : 'border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900'

  const resultCards: { label: string; value: string; highlight?: boolean }[] = [
    { label: 'Rounds', value: formatNumber(results.length) },
    { label: 'Perfect rounds', value: formatNumber(perfectRounds) },
    { label: 'Targets found', value: totalTargets > 0 ? `${hitRate}%` : '—', highlight: true },
  ]

  return (
    <GameWrapper
      gameType="Object Tracking"
      scores={scores}
      loading={loading}
      onRefresh={loadScores}
      fetchScores={getObjectTrackingScores}
      scoreTable="object_tracking_scores"
      formatScore={formatScore}
      sortKey="objects_tracked"
      sortDirection="desc"
    >
      <div className="w-full">
        {/* Status row */}
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <div className="flex items-baseline gap-2">
              <span className="eyebrow">Targets</span>
              <span className="num text-sm font-semibold text-gray-900 dark:text-gray-100">
                {inRun ? targetCount : '—'}
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
              <span className="eyebrow">Best</span>
              <span className="num text-sm font-semibold text-signal-600 dark:text-signal-400">
                {inRun && best > 0 ? best : '—'}
              </span>
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
          className={`flex min-h-[420px] select-none flex-col items-center justify-center rounded-2xl border p-4 transition-colors duration-150 sm:min-h-[480px] sm:p-6 ${stageTint}`}
        >
          {phase === 'idle' && (
            <div className="flex max-w-md flex-col items-center text-center">
              <span className="eyebrow mb-3">Multiple object tracking</span>
              <p className="text-base text-gray-700 dark:text-gray-300">
                A few dots flash <span className="font-semibold text-signal-600 dark:text-signal-400">blue</span>. Then
                every dot turns the same and they all move. When they stop, tap the ones that flashed.
              </p>
              <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                You start with {START_TARGETS} targets. Each perfect round adds one; a miss costs one of {MAX_LIVES} lives.
              </p>
              <button onClick={startGame} className="btn-primary mt-6">
                Start
              </button>
              <p className="eyebrow mt-4">or press Space</p>
            </div>
          )}

          {inRun && (
            <div className="flex w-full flex-col items-center">
              <div className="w-full max-w-[460px] overflow-hidden rounded-xl border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-950">
                <svg
                  ref={svgRef}
                  viewBox={`0 0 ${ARENA} ${ARENA}`}
                  className={`block aspect-square w-full touch-none ${phase === 'respond' ? 'cursor-pointer' : 'cursor-default'}`}
                  onPointerDown={handlePointer}
                  role="img"
                  aria-label={`${dotCount} dots. ${caption}`}
                >
                  {Array.from({ length: dotCount }, (_, i) => {
                    const d = roundDots[i]
                    if (!d) return null
                    const showRing = phase === 'feedback' && targetSet.has(i)
                    return (
                      <g key={`${roundId}-${i}`}>
                        {showRing && (
                          <circle
                            cx={d.x}
                            cy={d.y}
                            r={R + 1.5}
                            fill="none"
                            strokeWidth={0.7}
                            className="stroke-signal-600 dark:stroke-signal-400"
                          />
                        )}
                        <circle
                          ref={el => {
                            circleRefs.current[i] = el
                          }}
                          cx={d.x}
                          cy={d.y}
                          r={R}
                          className={`transition-[fill,opacity] duration-100 ${dotClass(i)}`}
                        />
                      </g>
                    )
                  })}
                </svg>
              </div>
              <p className="mt-4 h-4 font-mono text-[11px] uppercase tracking-[0.14em] text-gray-500 dark:text-gray-400" aria-live="polite">
                {caption}
              </p>
            </div>
          )}

          {phase === 'finished' && (
            <div className="flex w-full max-w-2xl flex-col items-center text-center">
              <span className="eyebrow">Result</span>
              <div className="num mt-3 text-6xl font-bold tracking-tight text-gray-950 dark:text-white sm:text-7xl">
                {formatNumber(best)}
              </div>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                {best > 0 ? 'objects tracked' : 'No round cleared this run'}
              </p>
              <div className="mt-8 grid w-full max-w-lg grid-cols-3 gap-3">
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
                Most people can track about four objects at once. Targets found counts every target you picked
                correctly, including in rounds you missed.
              </p>
              <button onClick={startGame} className="btn-ink mt-8">
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
