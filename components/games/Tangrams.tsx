'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { getTangramsScores, submitTangramsScore } from '@/lib/scores'
import { useUser } from '@/contexts/UserContext'
import { supabase } from '@/lib/supabase'
import GameWrapper from '../GameWrapper'
import type { TangramsScore } from '@/lib/supabase'
import { formatNumber } from '@/lib/levels'

type GameState = 'playing' | 'finished'

type Point = { x: number; y: number }

type PieceDef = {
  id: string
  color: string
  vertices: Point[]
}

type PiecePlacement = {
  id: string
  x: number
  y: number
  rotation: number
  flipped: boolean
  placed: boolean
  /** Target slot this piece currently fills (geometry match, not required same id) */
  filledTargetId: string | null
}

type PuzzleTarget = {
  id: string
  x: number
  y: number
  rotation: number
  flipped: boolean
}

const BOARD = 440
const U = 40
const SNAP = 20
const EDGE = 60
const S2 = U * Math.SQRT2

/** Right isosceles triangle: right angle at (0,0), legs along +x/+y */
function tri(leg: number): Point[] {
  return [
    { x: 0, y: 0 },
    { x: leg, y: 0 },
    { x: 0, y: leg },
  ]
}

function square(side: number): Point[] {
  return [
    { x: 0, y: 0 },
    { x: side, y: 0 },
    { x: side, y: side },
    { x: 0, y: side },
  ]
}

function parallelogram(): Point[] {
  return [
    { x: 0, y: 0 },
    { x: U, y: 0 },
    { x: U + U, y: U },
    { x: U, y: U },
  ]
}

const PIECE_DEFS: PieceDef[] = [
  { id: 'large-a', color: '#3b82f6', vertices: tri(2 * U) },
  { id: 'large-b', color: '#ef4444', vertices: tri(2 * U) },
  { id: 'medium-a', color: '#22c55e', vertices: tri(U * Math.SQRT2) },
  { id: 'small-a', color: '#f59e0b', vertices: tri(U) },
  { id: 'small-b', color: '#a855f7', vertices: tri(U) },
  { id: 'small-c', color: '#eab308', vertices: tri(U) },
  { id: 'small-d', color: '#d946ef', vertices: tri(U) },
  { id: 'square-a', color: '#06b6d4', vertices: square(U) },
  { id: 'square-b', color: '#0ea5e9', vertices: square(U) },
  { id: 'para-a', color: '#ec4899', vertices: parallelogram() },
]

function getDef(id: string): PieceDef {
  return PIECE_DEFS.find(p => p.id === id)!
}

function shapeFamily(id: string): string {
  return id.split('-')[0]
}

function transformPoint(p: Point, x: number, y: number, rotation: number, flipped: boolean): Point {
  const rad = (rotation * Math.PI) / 180
  const sx = flipped ? -p.x : p.x
  const cos = Math.cos(rad)
  const sin = Math.sin(rad)
  return {
    x: x + sx * cos - p.y * sin,
    y: y + sx * sin + p.y * cos,
  }
}

function pointsToPath(pts: Point[]): string {
  return pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ') + ' Z'
}

function pieceBounds(def: PieceDef, x: number, y: number, rotation: number, flipped: boolean) {
  const pts = def.vertices.map(v => transformPoint(v, x, y, rotation, flipped))
  return {
    minX: Math.min(...pts.map(p => p.x)),
    maxX: Math.max(...pts.map(p => p.x)),
    minY: Math.min(...pts.map(p => p.y)),
    maxY: Math.max(...pts.map(p => p.y)),
  }
}

function clampPlacement(placement: PiecePlacement): PiecePlacement {
  const def = getDef(placement.id)
  const b = pieceBounds(def, placement.x, placement.y, placement.rotation, placement.flipped)
  let { x, y } = placement
  if (b.minX < 0) x += -b.minX
  if (b.minY < 0) y += -b.minY
  if (b.maxX > BOARD) x -= b.maxX - BOARD
  if (b.maxY > BOARD) y -= b.maxY - BOARD
  return { ...placement, x, y }
}

function isTargetFilled(placements: PiecePlacement[], targetId: string): boolean {
  return placements.some(p => p.placed && p.filledTargetId === targetId)
}

const ORIENT_EPS = 2.5

function polygonsMatch(a: Point[], b: Point[], eps = ORIENT_EPS): boolean {
  if (a.length !== b.length) return false
  const used = new Array(b.length).fill(false)
  for (const p of a) {
    let found = -1
    for (let i = 0; i < b.length; i++) {
      if (used[i]) continue
      if (Math.hypot(p.x - b[i].x, p.y - b[i].y) <= eps) {
        found = i
        break
      }
    }
    if (found < 0) return false
    used[found] = true
  }
  return true
}

function orientationMatches(piece: PiecePlacement, target: PuzzleTarget): boolean {
  if (shapeFamily(piece.id) !== shapeFamily(target.id)) return false
  const pieceDef = getDef(piece.id)
  const targetDef = getDef(target.id)
  const posed = pieceDef.vertices.map(v =>
    transformPoint(v, target.x, target.y, piece.rotation, piece.flipped)
  )
  const slot = targetDef.vertices.map(v =>
    transformPoint(v, target.x, target.y, target.rotation, target.flipped)
  )
  return polygonsMatch(posed, slot)
}

function findOpenTarget(
  targets: PuzzleTarget[],
  placements: PiecePlacement[],
  piece: PiecePlacement,
  near?: Point
): PuzzleTarget | null {
  const open = targets.filter(
    t => !isTargetFilled(placements, t.id) && orientationMatches(piece, t)
  )
  if (open.length === 0) return null
  if (!near) return open[0]
  let best: PuzzleTarget | null = null
  let bestDist = Infinity
  for (const t of open) {
    const dist = Math.hypot(near.x - t.x, near.y - t.y)
    if (dist < bestDist) {
      bestDist = dist
      best = t
    }
  }
  return best
}

function shuffle<T>(items: T[]): T[] {
  const arr = [...items]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

function offsetTargets(targets: PuzzleTarget[], dx: number, dy: number): PuzzleTarget[] {
  return targets.map(t => ({ ...t, x: t.x + dx, y: t.y + dy }))
}

function packLarges(a: string, b: string): PuzzleTarget[] {
  return [
    { id: a, x: 0, y: 0, rotation: 0, flipped: false },
    { id: b, x: 2 * U, y: 2 * U, rotation: 180, flipped: false },
  ]
}

function packSquares(a: string, b: string): PuzzleTarget[] {
  return [
    { id: a, x: 0, y: 0, rotation: 0, flipped: false },
    { id: b, x: U, y: 0, rotation: 0, flipped: false },
  ]
}

function packSmalls(ids: [string, string, string, string]): PuzzleTarget[] {
  const [a, b, c, d] = ids
  return [
    { id: a, x: 0, y: 0, rotation: 0, flipped: false },
    { id: b, x: U, y: U, rotation: 180, flipped: false },
    { id: c, x: U, y: 0, rotation: 0, flipped: false },
    { id: d, x: 2 * U, y: U, rotation: 180, flipped: false },
  ]
}

function packMidPara(medium: string, para: string): PuzzleTarget[] {
  return [
    { id: medium, x: 0, y: 0, rotation: 0, flipped: false },
    { id: para, x: S2, y: 0, rotation: 0, flipped: false },
  ]
}

function rotateTargets(targets: PuzzleTarget[], deg: number): PuzzleTarget[] {
  if (deg % 360 === 0) return targets.map(t => ({ ...t }))
  const pts = targets.flatMap(t => {
    const def = getDef(t.id)
    return def.vertices.map(v => transformPoint(v, t.x, t.y, t.rotation, t.flipped))
  })
  const cx = pts.reduce((s, p) => s + p.x, 0) / pts.length
  const cy = pts.reduce((s, p) => s + p.y, 0) / pts.length
  const rad = (deg * Math.PI) / 180
  const cos = Math.cos(rad)
  const sin = Math.sin(rad)
  return targets.map(t => {
    const x = t.x - cx
    const y = t.y - cy
    return {
      ...t,
      x: x * cos - y * sin + cx,
      y: x * sin + y * cos + cy,
      rotation: (((t.rotation + deg) % 360) + 360) % 360,
    }
  })
}

function centerTargets(targets: PuzzleTarget[]): PuzzleTarget[] {
  const pts = targets.flatMap(t => {
    const def = getDef(t.id)
    return def.vertices.map(v => transformPoint(v, t.x, t.y, t.rotation, t.flipped))
  })
  const minX = Math.min(...pts.map(p => p.x))
  const maxX = Math.max(...pts.map(p => p.x))
  const minY = Math.min(...pts.map(p => p.y))
  const maxY = Math.max(...pts.map(p => p.y))
  const inner = BOARD - 2 * EDGE
  const ox = EDGE + (inner - (maxX - minX)) / 2 - minX
  const oy = EDGE + (inner - (maxY - minY)) / 2 - minY
  return targets.map(t => ({
    ...t,
    x: Math.round((t.x + ox) * 10) / 10,
    y: Math.round((t.y + oy) * 10) / 10,
  }))
}

type Packs = {
  larges: PuzzleTarget[]
  squares: PuzzleTarget[]
  smalls: PuzzleTarget[]
  midpara: PuzzleTarget[]
}

/** Compose the four tessellating packs into different silhouettes. */
const SHAPE_RECIPES: Array<(p: Packs) => PuzzleTarget[]> = [
  // Tower
  p => [
    ...offsetTargets(p.larges, 0, 0),
    ...offsetTargets(p.squares, 0, 2 * U),
    ...offsetTargets(p.smalls, 0, 3 * U),
    ...offsetTargets(p.midpara, 0, 4 * U),
  ],
  // Tower with smalls/squares swapped
  p => [
    ...offsetTargets(p.larges, 0, 0),
    ...offsetTargets(p.smalls, 0, 2 * U),
    ...offsetTargets(p.squares, 0, 3 * U),
    ...offsetTargets(p.midpara, 0, 4 * U),
  ],
  // Wide block
  p => [
    ...offsetTargets(p.larges, 0, 0),
    ...offsetTargets(p.squares, 2 * U, 0),
    ...offsetTargets(p.smalls, 2 * U, U),
    ...offsetTargets(p.midpara, 0, 2 * U),
  ],
  // Wide with midpara under the right column
  p => [
    ...offsetTargets(p.larges, 0, 0),
    ...offsetTargets(p.squares, 2 * U, 0),
    ...offsetTargets(p.smalls, 2 * U, U),
    ...offsetTargets(p.midpara, 2 * U, 2 * U),
  ],
  // Steps
  p => [
    ...offsetTargets(p.larges, 0, U),
    ...offsetTargets(p.squares, 0, 0),
    ...offsetTargets(p.smalls, 2 * U, 0),
    ...offsetTargets(p.midpara, 0, 3 * U),
  ],
  // Candle
  p => [
    ...offsetTargets(p.larges, 0, 0),
    ...offsetTargets(p.squares, U / 2, 2 * U),
    ...offsetTargets(p.smalls, U / 2, 3 * U),
    ...offsetTargets(p.midpara, U / 2, 4 * U),
  ],
  // L foot
  p => [
    ...offsetTargets(p.larges, 0, 0),
    ...offsetTargets(p.squares, 0, 2 * U),
    ...offsetTargets(p.smalls, 0, 3 * U),
    ...offsetTargets(p.midpara, 2 * U, 3 * U),
  ],
  // Side wing
  p => [
    ...offsetTargets(p.larges, U, 0),
    ...offsetTargets(
      [
        { ...p.squares[0], x: 0, y: 0 },
        { ...p.squares[1], x: 0, y: U },
      ],
      0,
      U
    ),
    ...offsetTargets(p.smalls, U, 2 * U),
    ...offsetTargets(p.midpara, U, 3 * U),
  ],
  // Left spine squares
  p => [
    ...offsetTargets(p.larges, U, 0),
    ...offsetTargets(
      [
        { ...p.squares[0], x: 0, y: 0 },
        { ...p.squares[1], x: 0, y: U },
      ],
      0,
      0
    ),
    ...offsetTargets(p.smalls, 0, 2 * U),
    ...offsetTargets(p.midpara, 0, 3 * U),
  ],
]

function generateBorderPositions(count: number): Point[] {
  const positions: Point[] = []
  const m = EDGE * 0.35
  const inner = BOARD - m
  for (let i = 0; i < count; i++) {
    const p = ((i + 0.5) / count) * 4
    if (p < 1) positions.push({ x: m + (inner - m) * p, y: m * 0.7 })
    else if (p < 2) positions.push({ x: BOARD - m * 1.1, y: m + (inner - m) * (p - 1) })
    else if (p < 3) positions.push({ x: inner - (inner - m) * (p - 2), y: BOARD - m * 1.1 })
    else positions.push({ x: m * 0.7, y: inner - (inner - m) * (p - 3) })
  }
  return positions
}

/** Build a fresh silhouette from shuffled packs + random recipe/rotation. */
function generatePuzzle(): PuzzleTarget[] {
  const larges = shuffle(['large-a', 'large-b']) as [string, string]
  const squares = shuffle(['square-a', 'square-b']) as [string, string]
  const smalls = shuffle(['small-a', 'small-b', 'small-c', 'small-d']) as [
    string,
    string,
    string,
    string,
  ]

  const packs: Packs = {
    larges: packLarges(larges[0], larges[1]),
    squares: packSquares(squares[0], squares[1]),
    smalls: packSmalls(smalls),
    midpara: packMidPara('medium-a', 'para-a'),
  }

  const recipe = SHAPE_RECIPES[Math.floor(Math.random() * SHAPE_RECIPES.length)]
  let targets = recipe(packs)

  const seen = new Set<string>()
  targets = targets.filter(t => {
    if (seen.has(t.id)) return false
    seen.add(t.id)
    return true
  })

  if (targets.length !== PIECE_DEFS.length) {
    targets = [
      ...offsetTargets(packs.larges, 0, 0),
      ...offsetTargets(packs.squares, 0, 2 * U),
      ...offsetTargets(packs.smalls, 0, 3 * U),
      ...offsetTargets(packs.midpara, 0, 4 * U),
    ]
  }

  const rotation = [0, 90, 180, 270][Math.floor(Math.random() * 4)]
  return centerTargets(rotateTargets(targets, rotation))
}

function borderSlots(targets: PuzzleTarget[]): PiecePlacement[] {
  const slots = shuffle(generateBorderPositions(PIECE_DEFS.length))
  const order = shuffle(PIECE_DEFS.map(d => d.id))
  return order.map((id, i) => {
    const target =
      targets.find(t => t.id === id) ??
      targets.find(t => shapeFamily(t.id) === shapeFamily(id))!
    return clampPlacement({
      id,
      x: slots[i].x,
      y: slots[i].y,
      rotation: target.rotation,
      flipped: target.flipped,
      placed: false,
      filledTargetId: null,
    })
  })
}

function createNewGame() {
  const targets = generatePuzzle()
  return {
    targets,
    placements: borderSlots(targets),
  }
}

export default function Tangrams() {
  const [scores, setScores] = useState<TangramsScore[]>([])
  const [loading, setLoading] = useState(true)
  const [ready, setReady] = useState(false)
  const [gameState, setGameState] = useState<GameState>('playing')
  const [targets, setTargets] = useState<PuzzleTarget[]>([])
  const [placements, setPlacements] = useState<PiecePlacement[]>([])
  const [elapsedTime, setElapsedTime] = useState(0)
  const [timerStarted, setTimerStarted] = useState(false)
  const [dragId, setDragId] = useState<string | null>(null)
  const [solved, setSolved] = useState(false)
  const { username } = useUser()
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const startTimeRef = useRef(0)
  const hasSubmittedScore = useRef(false)
  const boardRef = useRef<HTMLDivElement>(null)
  const dragOffsetRef = useRef({ x: 0, y: 0 })
  const pointerStartRef = useRef<{ id: string; x: number; y: number } | null>(null)
  const didDragRef = useRef(false)
  const originPositionsRef = useRef<Record<string, Point>>({})

  const DRAG_THRESHOLD = 6
  const MOVE_EPS = 12

  const loadScores = async () => {
    try {
      setLoading(true)
      const data = await getTangramsScores({ limit: 50 })
      setScores(data || [])
    } catch (error) {
      console.error('Error loading tangrams scores:', error)
      setScores([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadScores()

    const channel = supabase
      .channel('tangrams_scores_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'tangrams_scores',
        },
        (payload) => {
          setScores(prev => [payload.new as TangramsScore, ...prev.slice(0, 49)])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current)
    }
  }, [])

  const formatScore = (score: TangramsScore) => {
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
    originPositionsRef.current = Object.fromEntries(
      next.placements.map(p => [p.id, { x: p.x, y: p.y }])
    )
    setTargets(next.targets)
    setPlacements(next.placements)
    setDragId(null)
    setGameState('playing')
    setSolved(false)
    setElapsedTime(0)
    setTimerStarted(false)
    setReady(true)
    hasSubmittedScore.current = false
    startTimeRef.current = 0
    clearTimer()
  }, [clearTimer])

  // Generate puzzle on client only — Math.random() during SSR causes hydration mismatches
  useEffect(() => {
    startGame()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const finishGame = useCallback(
    (finalTime: number, isSolved: boolean) => {
      setElapsedTime(finalTime)
      clearTimer()
      setGameState('finished')
      setSolved(isSolved)
      setDragId(null)

      if (isSolved && username && !hasSubmittedScore.current) {
        hasSubmittedScore.current = true
        submitTangramsScore({
          username,
          time_taken: finalTime,
        })
          .then(() => {
            setTimeout(() => loadScores(), 1000)
          })
          .catch(error => {
            console.error('Error submitting score:', error)
            hasSubmittedScore.current = false
          })
      }
    },
    [username, clearTimer]
  )

  const allMoved =
    ready &&
    placements.length > 0 &&
    placements.every(p => {
      const origin = originPositionsRef.current[p.id]
      if (!origin) return false
      return Math.hypot(p.x - origin.x, p.y - origin.y) > MOVE_EPS
    })

  const handleSubmit = useCallback(() => {
    if (!ready || gameState !== 'playing') return
    if (!allMoved) return

    const finalTime =
      startTimeRef.current > 0 ? Date.now() - startTimeRef.current : elapsedTime
    const isSolved =
      placements.length === targets.length &&
      targets.every(t => isTargetFilled(placements, t.id))
    finishGame(finalTime, isSolved)
  }, [ready, gameState, allMoved, placements, targets, elapsedTime, finishGame])

  const trySnap = useCallback(
    (placement: PiecePlacement, current: PiecePlacement[]): PiecePlacement => {
      const others = current.filter(p => p.id !== placement.id)
      const target = findOpenTarget(targets, others, placement, {
        x: placement.x,
        y: placement.y,
      })
      if (!target) {
        return clampPlacement({ ...placement, placed: false, filledTargetId: null })
      }

      const dist = Math.hypot(placement.x - target.x, placement.y - target.y)
      if (dist <= SNAP) {
        return {
          ...placement,
          x: target.x,
          y: target.y,
          placed: true,
          filledTargetId: target.id,
        }
      }
      return clampPlacement({ ...placement, placed: false, filledTargetId: null })
    },
    [targets]
  )

  const clientToBoard = useCallback((clientX: number, clientY: number): Point => {
    const el = boardRef.current
    if (!el) return { x: 0, y: 0 }
    const rect = el.getBoundingClientRect()
    const scale = rect.width / BOARD
    return {
      x: (clientX - rect.left) / scale,
      y: (clientY - rect.top) / scale,
    }
  }, [])

  const onPointerDown = useCallback(
    (e: React.PointerEvent, id: string) => {
      if (!ready || gameState !== 'playing') return
      e.preventDefault()
      e.stopPropagation()
      ;(e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId)

      const pos = clientToBoard(e.clientX, e.clientY)
      const piece = placements.find(p => p.id === id)!
      pointerStartRef.current = { id, x: pos.x, y: pos.y }
      dragOffsetRef.current = { x: pos.x - piece.x, y: pos.y - piece.y }
      didDragRef.current = false
      setDragId(null)
    },
    [ready, gameState, clientToBoard, placements]
  )

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!ready || gameState !== 'playing' || !pointerStartRef.current) return
      const pos = clientToBoard(e.clientX, e.clientY)
      const start = pointerStartRef.current
      const dist = Math.hypot(pos.x - start.x, pos.y - start.y)

      if (!didDragRef.current && dist < DRAG_THRESHOLD) return

      if (!didDragRef.current) {
        didDragRef.current = true
        setDragId(start.id)
        setPlacements(prev =>
          prev.map(p =>
            p.id === start.id ? { ...p, placed: false, filledTargetId: null } : p
          )
        )
      }

      const id = start.id
      setPlacements(prev =>
        prev.map(p => {
          if (p.id !== id) return p
          return clampPlacement({
            ...p,
            x: pos.x - dragOffsetRef.current.x,
            y: pos.y - dragOffsetRef.current.y,
            placed: false,
            filledTargetId: null,
          })
        })
      )
    },
    [ready, gameState, clientToBoard]
  )

  const onPointerUp = useCallback(() => {
    if (!ready || gameState !== 'playing' || !pointerStartRef.current) return
    const { id } = pointerStartRef.current
    pointerStartRef.current = null

    if (!didDragRef.current) {
      setDragId(null)
      didDragRef.current = false
      return
    }

    setPlacements(prev => {
      const next = prev.map(p => (p.id === id ? trySnap(p, prev) : p))
      const snapped = next.find(p => p.id === id)
      if (snapped?.placed) {
        queueMicrotask(() => startTimer())
      }
      return next
    })
    setDragId(null)
    didDragRef.current = false
  }, [ready, gameState, trySnap, startTimer])

  return (
    <GameWrapper
      gameType="Tangrams"
      scores={scores}
      loading={loading}
      onRefresh={loadScores}
      formatScore={formatScore}
      sortKey="time_taken"
      sortDirection="asc"
    >
      <div className="flex flex-col items-center justify-start min-h-[400px] sm:min-h-[600px] pt-8">
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
            title="Restart"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        <div className="w-full max-w-2xl mb-6">
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
              <div
                ref={boardRef}
                className="relative w-full aspect-square touch-none select-none overflow-hidden border-2 border-gray-800 dark:border-gray-200 bg-gray-50 dark:bg-gray-800"
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
              >
                <svg viewBox={`0 0 ${BOARD} ${BOARD}`} className="w-full h-full">
                  <defs>
                    <filter
                      id="tangram-outline-light"
                      x="-4%"
                      y="-4%"
                      width="108%"
                      height="108%"
                      colorInterpolationFilters="sRGB"
                    >
                      <feMorphology in="SourceAlpha" operator="dilate" radius="1.5" result="dilated" />
                      <feComposite in="dilated" in2="SourceAlpha" operator="out" result="ring" />
                      <feFlood floodColor="#374151" result="color" />
                      <feComposite in="color" in2="ring" operator="in" result="outline" />
                      <feMerge>
                        <feMergeNode in="outline" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                    <filter
                      id="tangram-outline-dark"
                      x="-4%"
                      y="-4%"
                      width="108%"
                      height="108%"
                      colorInterpolationFilters="sRGB"
                    >
                      <feMorphology in="SourceAlpha" operator="dilate" radius="1.5" result="dilated" />
                      <feComposite in="dilated" in2="SourceAlpha" operator="out" result="ring" />
                      <feFlood floodColor="#e5e7eb" result="color" />
                      <feComposite in="color" in2="ring" operator="in" result="outline" />
                      <feMerge>
                        <feMergeNode in="outline" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>

                  <path
                    d={targets
                      .map(t => {
                        const def = getDef(t.id)
                        const world = def.vertices.map(v =>
                          transformPoint(v, t.x, t.y, t.rotation, t.flipped)
                        )
                        return pointsToPath(world)
                      })
                      .join(' ')}
                    className="pointer-events-none fill-gray-200 dark:fill-gray-700 [filter:url(#tangram-outline-light)] dark:[filter:url(#tangram-outline-dark)]"
                  />

                  {[...placements]
                    .sort((a, b) => {
                      if (a.id === dragId) return 1
                      if (b.id === dragId) return -1
                      if (a.placed !== b.placed) return a.placed ? 1 : -1
                      return 0
                    })
                    .map(p => {
                      const def = getDef(p.id)
                      const world = def.vertices.map(v =>
                        transformPoint(v, p.x, p.y, p.rotation, p.flipped)
                      )
                      const isDragging = dragId === p.id
                      return (
                        <path
                          key={p.id}
                          d={pointsToPath(world)}
                          fill={def.color}
                          fillOpacity={p.placed ? 0.95 : 0.88}
                          stroke={isDragging ? '#2563eb' : '#111827'}
                          strokeWidth={isDragging ? 3 : 1.5}
                          strokeLinejoin="round"
                          className="cursor-grab active:cursor-grabbing"
                          style={{ touchAction: 'none' }}
                          onPointerDown={e => onPointerDown(e, p.id)}
                        />
                      )
                    })}
                </svg>
              </div>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={!allMoved}
                className="mt-4 w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-semibold shadow-lg transition-colors"
              >
                Submit
              </button>

              <p className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
                Drag pieces onto the outline to place them.
              </p>
            </>
          )}
        </div>
      </div>
    </GameWrapper>
  )
}
