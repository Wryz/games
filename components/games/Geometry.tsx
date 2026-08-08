'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { getGeometryScores, submitGeometryScore } from '@/lib/scores'
import { useUser } from '@/contexts/UserContext'
import { supabase } from '@/lib/supabase'
import GameWrapper from '../GameWrapper'
import type { GeometryScore } from '@/lib/supabase'
import { GeometryIcon } from '../icons/GameIcons'
import { formatNumber } from '@/lib/levels'

type GameState = 'idle' | 'playing' | 'correct' | 'wrong' | 'finished'
type ProblemType = 'triangle_angles' | 'quadrilateral_angles' | 'pythagorean' | 'area'

interface Problem {
  type: ProblemType
  question: string
  shape: JSX.Element
  answer: number
  options: number[]
}

type Point = { x: number; y: number }

const SVG_W = 240
const SVG_H = 220
const PAD = 44
const LABEL_MARGIN = 14
const MIN_LABEL_GAP = 30
const VERTEX_LABEL_DIST = 26
const SIDE_LABEL_DIST = 22

const toRad = (deg: number) => (deg * Math.PI) / 180

const fitPoints = (points: Point[], pad = PAD): Point[] => {
  const xs = points.map(p => p.x)
  const ys = points.map(p => p.y)
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minY = Math.min(...ys)
  const maxY = Math.max(...ys)
  const spanX = Math.max(maxX - minX, 1e-6)
  const spanY = Math.max(maxY - minY, 1e-6)
  const scale = Math.min((SVG_W - 2 * pad) / spanX, (SVG_H - 2 * pad) / spanY)
  const offsetX = (SVG_W - spanX * scale) / 2 - minX * scale
  const offsetY = (SVG_H - spanY * scale) / 2 - minY * scale
  return points.map(p => ({
    x: p.x * scale + offsetX,
    y: p.y * scale + offsetY,
  }))
}

const pointsAttr = (points: Point[]) => points.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')

const midPoint = (a: Point, b: Point): Point => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 })

const centroidOf = (points: Point[]): Point => ({
  x: points.reduce((s, p) => s + p.x, 0) / points.length,
  y: points.reduce((s, p) => s + p.y, 0) / points.length,
})

const clampLabel = (p: Point): Point => ({
  x: Math.min(SVG_W - LABEL_MARGIN, Math.max(LABEL_MARGIN, p.x)),
  y: Math.min(SVG_H - LABEL_MARGIN, Math.max(LABEL_MARGIN, p.y)),
})

/** Unit vector from `from` toward `to`. */
const dirFrom = (from: Point, to: Point): Point => {
  const dx = to.x - from.x
  const dy = to.y - from.y
  const len = Math.hypot(dx, dy) || 1
  return { x: dx / len, y: dy / len }
}

/**
 * Place a vertex angle label clearly outside the shape.
 * Uses the exterior angle bisector (away from the centroid).
 */
const vertexOuterLabel = (vertex: Point, prev: Point, next: Point, centroid: Point, dist = VERTEX_LABEL_DIST): Point => {
  const u1 = dirFrom(vertex, prev)
  const u2 = dirFrom(vertex, next)
  // Interior bisector
  let bx = u1.x + u2.x
  let by = u1.y + u2.y
  let bn = Math.hypot(bx, by)
  if (bn < 1e-6) {
    // Nearly 180°: fall back to away-from-centroid
    const away = dirFrom(centroid, vertex)
    bx = away.x
    by = away.y
    bn = 1
  } else {
    bx /= bn
    by /= bn
    // Point outward
    const inward = dirFrom(vertex, centroid)
    if (bx * inward.x + by * inward.y > 0) {
      bx = -bx
      by = -by
    }
  }
  return clampLabel({
    x: vertex.x + bx * dist,
    y: vertex.y + by * dist,
  })
}

/** Place a side label outside the shape, away from the centroid. */
const sideOuterLabel = (a: Point, b: Point, centroid: Point, dist = SIDE_LABEL_DIST): Point => {
  const mid = midPoint(a, b)
  const away = dirFrom(centroid, mid)
  return clampLabel({
    x: mid.x + away.x * dist,
    y: mid.y + away.y * dist,
  })
}

/** Place a label inside the shape, toward the centroid from a side midpoint. */
const sideInnerLabel = (a: Point, b: Point, centroid: Point, dist = SIDE_LABEL_DIST): Point => {
  const mid = midPoint(a, b)
  const inward = dirFrom(mid, centroid)
  return clampLabel({
    x: mid.x + inward.x * dist,
    y: mid.y + inward.y * dist,
  })
}

/**
 * Push labels apart without pulling them toward the shape centroid.
 * Separation only moves labels further outward (or sideways).
 */
const separateLabels = (labels: Point[], centroid: Point, minGap = MIN_LABEL_GAP): Point[] => {
  const pts = labels.map(p => ({ ...p }))
  for (let iter = 0; iter < 10; iter++) {
    for (let i = 0; i < pts.length; i++) {
      for (let j = i + 1; j < pts.length; j++) {
        const dx = pts[j].x - pts[i].x
        const dy = pts[j].y - pts[i].y
        const dist = Math.hypot(dx, dy) || 0.01
        if (dist >= minGap) continue
        const push = (minGap - dist) / 2
        const ux = dx / dist
        const uy = dy / dist

        // Candidate moves
        const iCand = { x: pts[i].x - ux * push, y: pts[i].y - uy * push }
        const jCand = { x: pts[j].x + ux * push, y: pts[j].y + uy * push }

        // Prefer the move that stays farther from the centroid (keeps labels outside)
        const keepOrOut = (orig: Point, cand: Point) => {
          const origD = Math.hypot(orig.x - centroid.x, orig.y - centroid.y)
          const candD = Math.hypot(cand.x - centroid.x, cand.y - centroid.y)
          return candD >= origD - 0.5 ? cand : {
            // If the natural push goes inward, push purely away from centroid instead
            ...(() => {
              const away = dirFrom(centroid, orig)
              return { x: orig.x + away.x * push, y: orig.y + away.y * push }
            })(),
          }
        }

        pts[i] = keepOrOut(pts[i], iCand)
        pts[j] = keepOrOut(pts[j], jCand)
      }
    }
  }
  return pts.map(clampLabel)
}

/**
 * Build a triangle with interior angles A (top), B (bottom-left), C (bottom-right)
 * using the law of sines, base BC horizontal.
 */
const triangleFromAngles = (angleA: number, angleB: number, angleC: number): [Point, Point, Point] => {
  const a = Math.sin(toRad(angleA))
  const b = Math.sin(toRad(angleB))
  const c = Math.sin(toRad(angleC))
  // Place B at origin, C on x-axis with length a (side opposite A)
  const B: Point = { x: 0, y: 0 }
  const C: Point = { x: a, y: 0 }
  // Vertex A from B at angle B from base
  const A: Point = {
    x: c * Math.cos(toRad(angleB)),
    y: -c * Math.sin(toRad(angleB)), // negative y so A is above base in SVG after flip via fit
  }
  // Ensure A is above the base (smaller y in SVG = up). If construction put it below, flip.
  if (A.y > 0) A.y = -A.y
  return fitPoints([A, B, C]) as [Point, Point, Point]
}

/**
 * Build a convex quadrilateral with the given interior angles (walk order:
 * TL → TR → BR → BL) by solving for side lengths that close the polygon.
 */
const quadFromAngles = (angles: [number, number, number, number]): [Point, Point, Point, Point] => {
  const tryBuild = (s0: number, s1: number): Point[] | null => {
    // Edge directions: leave V0 along heading 0; turn by (π − angle) at each later vertex
    const edgeDir = [0, 0, 0, 0]
    for (let i = 0; i < 3; i++) {
      edgeDir[i + 1] = edgeDir[i] + (Math.PI - toRad(angles[i + 1]))
    }
    const cos = edgeDir.map(d => Math.cos(d))
    const sin = edgeDir.map(d => Math.sin(d))

    // s0*u0 + s1*u1 + s2*u2 + s3*u3 = 0  →  solve for s2, s3
    const A = cos[2]
    const B = cos[3]
    const E = -s0 * cos[0] - s1 * cos[1]
    const C = sin[2]
    const D = sin[3]
    const F = -s0 * sin[0] - s1 * sin[1]
    const det = A * D - B * C
    if (Math.abs(det) < 1e-9) return null
    const s2 = (E * D - B * F) / det
    const s3 = (A * F - E * C) / det
    if (s2 <= 0.05 || s3 <= 0.05) return null

    const sides = [s0, s1, s2, s3]
    let x = 0
    let y = 0
    const raw: Point[] = [{ x, y }]
    for (let i = 0; i < 4; i++) {
      x += sides[i] * cos[i]
      y += sides[i] * sin[i]
      if (i < 3) raw.push({ x, y })
    }
    return raw
  }

  const ratios: [number, number][] = [
    [1, 1],
    [1, 1.4],
    [1.4, 1],
    [1, 0.7],
    [0.7, 1],
    [1, 2],
    [2, 1],
  ]
  let raw: Point[] | null = null
  for (const [s0, s1] of ratios) {
    raw = tryBuild(s0, s1)
    if (raw) break
  }
  if (!raw) {
    raw = [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 1, y: 1 },
      { x: 0, y: 1 },
    ]
  }

  // Prefer orientation with first edge roughly horizontal
  const dx = raw[1].x - raw[0].x
  const dy = raw[1].y - raw[0].y
  const rot = -Math.atan2(dy, dx)
  const cosR = Math.cos(rot)
  const sinR = Math.sin(rot)
  let rotated = raw.map(p => ({
    x: p.x * cosR - p.y * sinR,
    y: p.x * sinR + p.y * cosR,
  }))

  // Keep polygon below the top edge (positive math area / CCW)
  let area = 0
  for (let i = 0; i < rotated.length; i++) {
    const j = (i + 1) % rotated.length
    area += rotated[i].x * rotated[j].y - rotated[j].x * rotated[i].y
  }
  if (area < 0) {
    rotated = rotated.map(p => ({ x: p.x, y: -p.y }))
  }

  return fitPoints(rotated) as [Point, Point, Point, Point]
}

const AngleLabel = ({
  point,
  value,
  isMissing,
}: {
  point: Point
  value: number
  isMissing: boolean
}) => (
  <text
    x={point.x}
    y={point.y}
    textAnchor="middle"
    dominantBaseline="middle"
    className={`text-sm font-bold fill-current ${isMissing ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'}`}
  >
    {isMissing ? '?' : `${value}°`}
  </text>
)

const SideLabel = ({
  point,
  value,
  isMissing,
}: {
  point: Point
  value: number
  isMissing: boolean
}) => (
  <text
    x={point.x}
    y={point.y}
    textAnchor="middle"
    dominantBaseline="middle"
    className={`text-sm font-bold fill-current ${isMissing ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'}`}
  >
    {isMissing ? '?' : value}
  </text>
)

// Triangle component — vertices match angles A (top), B (BL), C (BR)
const TriangleShape = ({ angle1, angle2, angle3, missingAngle }: { angle1: number, angle2: number, angle3: number, missingAngle: 'a' | 'b' | 'c' }) => {
  const [pA, pB, pC] = triangleFromAngles(angle1, angle2, angle3)
  const centroid = centroidOf([pA, pB, pC])
  const [labelA, labelB, labelC] = separateLabels([
    vertexOuterLabel(pA, pB, pC, centroid),
    vertexOuterLabel(pB, pC, pA, centroid),
    vertexOuterLabel(pC, pA, pB, centroid),
  ], centroid)

  return (
    <svg width={SVG_W} height={SVG_H} viewBox={`0 0 ${SVG_W} ${SVG_H}`} className="mx-auto">
      <polygon
        points={pointsAttr([pA, pB, pC])}
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        className="text-gray-800 dark:text-gray-200"
      />
      <AngleLabel point={labelA} value={angle1} isMissing={missingAngle === 'a'} />
      <AngleLabel point={labelB} value={angle2} isMissing={missingAngle === 'b'} />
      <AngleLabel point={labelC} value={angle3} isMissing={missingAngle === 'c'} />
    </svg>
  )
}

// Quadrilateral component — angles at TL, TR, BR, BL
const QuadrilateralShape = ({ angle1, angle2, angle3, angle4, missingAngle }: { angle1: number, angle2: number, angle3: number, angle4: number, missingAngle: 'a' | 'b' | 'c' | 'd' }) => {
  const [pTL, pTR, pBR, pBL] = quadFromAngles([angle1, angle2, angle3, angle4])
  const centroid = centroidOf([pTL, pTR, pBR, pBL])
  const [labelTL, labelTR, labelBR, labelBL] = separateLabels([
    vertexOuterLabel(pTL, pBL, pTR, centroid),
    vertexOuterLabel(pTR, pTL, pBR, centroid),
    vertexOuterLabel(pBR, pTR, pBL, centroid),
    vertexOuterLabel(pBL, pBR, pTL, centroid),
  ], centroid)

  return (
    <svg width={SVG_W} height={SVG_H} viewBox={`0 0 ${SVG_W} ${SVG_H}`} className="mx-auto">
      <polygon
        points={pointsAttr([pTL, pTR, pBR, pBL])}
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        className="text-gray-800 dark:text-gray-200"
      />
      <AngleLabel point={labelTL} value={angle1} isMissing={missingAngle === 'a'} />
      <AngleLabel point={labelTR} value={angle2} isMissing={missingAngle === 'b'} />
      <AngleLabel point={labelBR} value={angle3} isMissing={missingAngle === 'c'} />
      <AngleLabel point={labelBL} value={angle4} isMissing={missingAngle === 'd'} />
    </svg>
  )
}

// Right triangle — legs a (vertical) and b (horizontal) drawn to scale; c hypotenuse
const RightTriangleShape = ({ sideA, sideB, sideC, missingSide }: { sideA: number, sideB: number, sideC: number, missingSide: 'a' | 'b' | 'c' }) => {
  const a = sideA
  const b = sideB
  const raw: [Point, Point, Point] = [
    { x: 0, y: 0 },       // right angle
    { x: 0, y: -a },      // top of vertical leg
    { x: b, y: 0 },       // end of horizontal leg
  ]
  const [pR, pTop, pRight] = fitPoints(raw) as [Point, Point, Point]

  // Right-angle marker sized relative to shorter leg on screen
  const marker = Math.min(12, Math.hypot(pTop.x - pR.x, pTop.y - pR.y) * 0.15, Math.hypot(pRight.x - pR.x, pRight.y - pR.y) * 0.15)
  const ux = (pTop.x - pR.x)
  const uy = (pTop.y - pR.y)
  const uLen = Math.hypot(ux, uy) || 1
  const vx = (pRight.x - pR.x)
  const vy = (pRight.y - pR.y)
  const vLen = Math.hypot(vx, vy) || 1
  const m1 = { x: pR.x + (ux / uLen) * marker, y: pR.y + (uy / uLen) * marker }
  const m2 = { x: m1.x + (vx / vLen) * marker, y: m1.y + (vy / vLen) * marker }
  const m3 = { x: pR.x + (vx / vLen) * marker, y: pR.y + (vy / vLen) * marker }

  const centroid = centroidOf([pR, pTop, pRight])
  const [labelA, labelB, labelC] = separateLabels([
    sideOuterLabel(pR, pTop, centroid),
    sideOuterLabel(pR, pRight, centroid),
    sideOuterLabel(pTop, pRight, centroid),
  ], centroid)

  return (
    <svg width={SVG_W} height={SVG_H} viewBox={`0 0 ${SVG_W} ${SVG_H}`} className="mx-auto">
      <polygon
        points={pointsAttr([pR, pTop, pRight])}
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        className="text-gray-800 dark:text-gray-200"
      />
      <path
        d={`M ${m1.x.toFixed(1)} ${m1.y.toFixed(1)} L ${m2.x.toFixed(1)} ${m2.y.toFixed(1)} L ${m3.x.toFixed(1)} ${m3.y.toFixed(1)}`}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="text-gray-800 dark:text-gray-200"
      />
      <SideLabel point={labelA} value={sideA} isMissing={missingSide === 'a'} />
      <SideLabel point={labelB} value={sideB} isMissing={missingSide === 'b'} />
      <SideLabel point={labelC} value={sideC} isMissing={missingSide === 'c'} />
    </svg>
  )
}

// Rectangle — aspect ratio matches width:height
const RectangleShape = ({ width, height }: { width: number, height: number }) => {
  const [tl, tr, br, bl] = fitPoints([
    { x: 0, y: 0 },
    { x: width, y: 0 },
    { x: width, y: height },
    { x: 0, y: height },
  ]) as [Point, Point, Point, Point]
  const centroid = centroidOf([tl, tr, br, bl])
  // Width stays outside above; height sits inside along the left side
  const topLabel = sideOuterLabel(tl, tr, centroid)
  const leftLabel = sideInnerLabel(tl, bl, centroid)

  return (
    <svg width={SVG_W} height={SVG_H} viewBox={`0 0 ${SVG_W} ${SVG_H}`} className="mx-auto">
      <polygon
        points={pointsAttr([tl, tr, br, bl])}
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        className="text-gray-800 dark:text-gray-200"
      />
      <text x={topLabel.x} y={topLabel.y} textAnchor="middle" dominantBaseline="middle" className="text-sm font-bold fill-current text-blue-600 dark:text-blue-400">
        {width}
      </text>
      <text x={leftLabel.x} y={leftLabel.y} textAnchor="middle" dominantBaseline="middle" className="text-sm font-bold fill-current text-blue-600 dark:text-blue-400">
        {height}
      </text>
    </svg>
  )
}

// Triangle area — base and height drawn to scale with altitude dashed
const TriangleAreaShape = ({ base, height }: { base: number, height: number }) => {
  const [pL, pR, pApex] = fitPoints([
    { x: 0, y: 0 },
    { x: base, y: 0 },
    { x: base / 2, y: -height },
  ]) as [Point, Point, Point]
  const foot = { x: (pL.x + pR.x) / 2, y: pL.y }
  const centroid = centroidOf([pL, pR, pApex])
  // Height number sits inside the triangle beside the altitude; base stays below
  const altMid = midPoint(pApex, foot)
  const heightLabel = clampLabel({
    x: altMid.x + SIDE_LABEL_DIST * 0.7,
    y: altMid.y,
  })
  const baseLabel = sideOuterLabel(pL, pR, centroid)

  return (
    <svg width={SVG_W} height={SVG_H} viewBox={`0 0 ${SVG_W} ${SVG_H}`} className="mx-auto">
      <polygon
        points={pointsAttr([pL, pR, pApex])}
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        className="text-gray-800 dark:text-gray-200"
      />
      <line
        x1={pApex.x}
        y1={pApex.y}
        x2={foot.x}
        y2={foot.y}
        stroke="currentColor"
        strokeWidth="2"
        strokeDasharray="5,5"
        className="text-gray-500 dark:text-gray-400"
      />
      <text x={heightLabel.x} y={heightLabel.y} textAnchor="middle" dominantBaseline="middle" className="text-sm font-bold fill-current text-blue-600 dark:text-blue-400">
        {height}
      </text>
      <text x={baseLabel.x} y={baseLabel.y} textAnchor="middle" dominantBaseline="middle" className="text-sm font-bold fill-current text-blue-600 dark:text-blue-400">
        {base}
      </text>
    </svg>
  )
}

export default function Geometry() {
  const [scores, setScores] = useState<GeometryScore[]>([])
  const [loading, setLoading] = useState(true)
  const [gameState, setGameState] = useState<GameState>('idle')
  const [currentProblem, setCurrentProblem] = useState<Problem | null>(null)
  const [correctCount, setCorrectCount] = useState(0)
  const [showCorrectAnswer, setShowCorrectAnswer] = useState(false)
  const [questionStartTime, setQuestionStartTime] = useState(0)
  const [responseTimes, setResponseTimes] = useState<number[]>([])
  const [elapsedTime, setElapsedTime] = useState(0)
  const { username } = useUser()
  const hasSubmittedScore = useRef(false)
  const gameStartTimeRef = useRef(0)
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const timerStartedRef = useRef(false)

  const loadScores = async () => {
    try {
      setLoading(true)
      const data = await getGeometryScores({ limit: 50 })
      setScores(data || [])
    } catch (error) {
      console.error('Error loading scores:', error)
      setScores([])
    } finally {
      setLoading(false)
    }
  }

  const clearTimer = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current)
      timerIntervalRef.current = null
    }
  }, [])

  const ensureTimerStarted = useCallback(() => {
    if (timerStartedRef.current) return
    timerStartedRef.current = true
    const now = Date.now()
    gameStartTimeRef.current = now
    // Align Q1 response clock with display timer (exclude idle before first click)
    setQuestionStartTime(now)
    setElapsedTime(0)
    timerIntervalRef.current = setInterval(() => {
      setElapsedTime(Date.now() - gameStartTimeRef.current)
    }, 1000)
  }, [])

  // Generate a random geometry problem
  const generateProblem = useCallback((): Problem => {
    const types: ProblemType[] = ['triangle_angles', 'quadrilateral_angles', 'pythagorean', 'area']
    const type = types[Math.floor(Math.random() * types.length)]
    
    switch (type) {
      case 'triangle_angles': {
        // Triangle angles sum to 180° — keep each angle visually distinct (≥25°)
        let angle1 = 0
        let angle2 = 0
        let angle3 = 0
        do {
          angle1 = Math.floor(Math.random() * 70) + 25 // 25-94
          angle2 = Math.floor(Math.random() * 70) + 25 // 25-94
          angle3 = 180 - angle1 - angle2
        } while (angle3 < 25 || angle3 > 130)
        const missingIndex = Math.floor(Math.random() * 3) // 0, 1, or 2
        const angles = [angle1, angle2, angle3]
        const answer = angles[missingIndex]
        
        // Generate wrong options
        const options = [answer]
        while (options.length < 4) {
          const wrong = Math.floor(Math.random() * 150) + 20 // 20-169
          if (!options.includes(wrong) && wrong !== 180 - angles[(missingIndex + 1) % 3] - angles[(missingIndex + 2) % 3]) {
            options.push(wrong)
          }
        }
        // Shuffle options
        for (let i = options.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [options[i], options[j]] = [options[j], options[i]]
        }
        
        const missingLabels = ['a', 'b', 'c'] as const
        const shape = (
          <TriangleShape
            angle1={angle1}
            angle2={angle2}
            angle3={angle3}
            missingAngle={missingLabels[missingIndex]}
          />
        )
        
        return {
          type,
          question: `What is the measure of angle ${missingLabels[missingIndex].toUpperCase()}?`,
          shape,
          answer,
          options
        }
      }
      
      case 'quadrilateral_angles': {
        // Quadrilateral angles sum to 360° — keep each angle in a drawable convex range
        let angle1 = 0
        let angle2 = 0
        let angle3 = 0
        let angle4 = 0
        do {
          angle1 = Math.floor(Math.random() * 80) + 50 // 50-129
          angle2 = Math.floor(Math.random() * 80) + 50 // 50-129
          angle3 = Math.floor(Math.random() * 80) + 50 // 50-129
          angle4 = 360 - angle1 - angle2 - angle3
        } while (angle4 < 50 || angle4 > 140)
        const missingIndex = Math.floor(Math.random() * 4) // 0, 1, 2, or 3
        const angles = [angle1, angle2, angle3, angle4]
        const answer = angles[missingIndex]
        
        // Generate wrong options
        const options = [answer]
        while (options.length < 4) {
          const wrong = Math.floor(Math.random() * 250) + 50 // 50-299
          if (!options.includes(wrong)) {
            options.push(wrong)
          }
        }
        // Shuffle options
        for (let i = options.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [options[i], options[j]] = [options[j], options[i]]
        }
        
        const missingLabels = ['a', 'b', 'c', 'd'] as const
        const shape = (
          <QuadrilateralShape
            angle1={angle1}
            angle2={angle2}
            angle3={angle3}
            angle4={angle4}
            missingAngle={missingLabels[missingIndex]}
          />
        )
        
        return {
          type,
          question: `What is the measure of angle ${missingLabels[missingIndex].toUpperCase()}?`,
          shape,
          answer,
          options
        }
      }
      
      case 'pythagorean': {
        // Right triangle: a² + b² = c²
        // Use small Pythagorean triples: (3,4,5), (5,12,13), (6,8,10), (8,15,17)
        const triples = [
          [3, 4, 5],
          [5, 12, 13],
          [6, 8, 10],
          [8, 15, 17],
          [9, 12, 15]
        ]
        const triple = triples[Math.floor(Math.random() * triples.length)]
        const missingIndex = Math.floor(Math.random() * 3) // 0, 1, or 2
        const [a, b, c] = triple
        const sides = [a, b, c]
        const answer = sides[missingIndex]
        
        // Generate wrong options
        const options = [answer]
        while (options.length < 4) {
          const wrong = Math.floor(Math.random() * 15) + 1 // 1-15
          if (!options.includes(wrong)) {
            options.push(wrong)
          }
        }
        // Shuffle options
        for (let i = options.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [options[i], options[j]] = [options[j], options[i]]
        }
        
        const missingLabels = ['a', 'b', 'c'] as const
        const shape = (
          <RightTriangleShape
            sideA={a}
            sideB={b}
            sideC={c}
            missingSide={missingLabels[missingIndex]}
          />
        )
        
        return {
          type,
          question: `What is the length of side ${missingLabels[missingIndex].toUpperCase()}?`,
          shape,
          answer,
          options
        }
      }
      
      case 'area': {
        // Area problems: rectangle or triangle
        const isRectangle = Math.random() > 0.5
        
        if (isRectangle) {
          const width = Math.floor(Math.random() * 8) + 3 // 3-10
          const height = Math.floor(Math.random() * 8) + 3 // 3-10
          const answer = width * height
          
          // Generate wrong options
          const options = [answer]
          while (options.length < 4) {
            const wrong = Math.floor(Math.random() * 80) + 10 // 10-89
            if (!options.includes(wrong)) {
              options.push(wrong)
            }
          }
          // Shuffle options
          for (let i = options.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [options[i], options[j]] = [options[j], options[i]]
          }
          
          const shape = <RectangleShape width={width} height={height} />
          
          return {
            type,
            question: `What is the area of this rectangle?`,
            shape,
            answer,
            options
          }
        } else {
          // Ensure area is a whole number: at least one of base/height must be even
          let base = Math.floor(Math.random() * 8) + 3 // 3-10
          let height = Math.floor(Math.random() * 8) + 3 // 3-10
          if ((base * height) % 2 !== 0) {
            height += 1 // both odd → make height even (stays ≤10)
          }
          const answer = (base * height) / 2
          
          // Generate wrong options
          const options = [answer]
          while (options.length < 4) {
            const wrong = Math.floor(Math.random() * 40) + 5 // 5-44
            if (!options.includes(wrong)) {
              options.push(wrong)
            }
          }
          // Shuffle options
          for (let i = options.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [options[i], options[j]] = [options[j], options[i]]
          }
          
          const shape = <TriangleAreaShape base={base} height={height} />
          
          return {
            type,
            question: `What is the area of this triangle?`,
            shape,
            answer,
            options
          }
        }
      }
    }
  }, [])

  useEffect(() => {
    loadScores()
    
    // Set up realtime listener for geometry scores
    const channel = supabase
      .channel('geometry_scores_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'geometry_scores'
        },
        (payload) => {
          console.log('New geometry score:', payload.new)
          setScores(prev => [payload.new as GeometryScore, ...prev.slice(0, 49)])
        }
      )
      .subscribe()

    // Start game automatically
    const problem = generateProblem()
    setCurrentProblem(problem)
    setGameState('playing')
    setQuestionStartTime(Date.now())

    return () => {
      clearTimer()
      supabase.removeChannel(channel)
    }
  }, [generateProblem, clearTimer])

  // Handle answer selection
  const handleAnswerSelect = useCallback((selectedAnswer: number) => {
    if (gameState !== 'playing' || !currentProblem) return

    // First click starts the clock; Q1 must not include pre-click idle
    // (setState in ensureTimerStarted would not apply until next render)
    const justStarted = !timerStartedRef.current
    ensureTimerStarted()
    
    const responseTime = justStarted ? 0 : Date.now() - questionStartTime
    
    if (selectedAnswer === currentProblem.answer) {
      // Correct!
      const newCorrectCount = correctCount + 1
      setCorrectCount(newCorrectCount)
      setResponseTimes(prev => [...prev, responseTime])
      
      if (newCorrectCount >= 10) {
        // Reached 10 correct answers - game finished!
        const finalTime = timerStartedRef.current
          ? Date.now() - gameStartTimeRef.current
          : 0
        clearTimer()
        setElapsedTime(finalTime)
        setGameState('finished')
        
        // Submit single score for the entire game
        if (username && !hasSubmittedScore.current) {
          hasSubmittedScore.current = true
          const allTimes = [...responseTimes, responseTime]
          const averageTime = Math.round(
            allTimes.reduce((sum, time) => sum + time, 0) / allTimes.length
          )
          
          submitGeometryScore({
            username,
            correct_answers: 10,
            average_time: averageTime
          }).then(() => {
            setTimeout(() => loadScores(), 1000)
          }).catch(error => {
            console.error('Error submitting score:', error)
            hasSubmittedScore.current = false
          })
        }
      } else {
        // Continue to next question immediately
        const problem = generateProblem()
        setCurrentProblem(problem)
        setQuestionStartTime(Date.now())
      }
    } else {
      // Wrong! Show the correct answer and wait for user to click "Play Again"
      clearTimer()
      setGameState('wrong')
      setShowCorrectAnswer(true)
      setResponseTimes(prev => [...prev, responseTime])
      
      // Submit score when wrong answer is shown
      if (username && !hasSubmittedScore.current && correctCount > 0) {
        hasSubmittedScore.current = true
        const allTimes = [...responseTimes, responseTime]
        const averageTime = Math.round(
          allTimes.reduce((sum, time) => sum + time, 0) / allTimes.length
        )
        
        submitGeometryScore({
          username,
          correct_answers: correctCount,
          average_time: averageTime
        }).then(() => {
          setTimeout(() => loadScores(), 1000)
        }).catch(error => {
          console.error('Error submitting score:', error)
          hasSubmittedScore.current = false
        })
      }
    }
  }, [gameState, currentProblem, correctCount, questionStartTime, responseTimes, username, generateProblem, loadScores, clearTimer, ensureTimerStarted])

  // Reset game
  const resetGame = useCallback(() => {
    clearTimer()
    timerStartedRef.current = false
    setElapsedTime(0)
    setGameState('idle')
    setCurrentProblem(null)
    setCorrectCount(0)
    setShowCorrectAnswer(false)
    setResponseTimes([])
    hasSubmittedScore.current = false
    // Automatically start a new game after reset
    setTimeout(() => {
      const problem = generateProblem()
      setCurrentProblem(problem)
      setGameState('playing')
      setQuestionStartTime(Date.now())
    }, 100)
  }, [generateProblem, clearTimer])

  const formatScore = (score: GeometryScore) => {
    return `${formatNumber(score.correct_answers)} correct (${formatNumber(score.average_time)}ms avg)`
  }

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000)
    return `${seconds}s`
  }

  const formatExactTime = (ms: number) => {
    return `${(ms / 1000).toFixed(3)}s`
  }

  return (
    <GameWrapper
      gameType="Geometry"
      scores={scores}
      loading={loading}
      onRefresh={loadScores}
      fetchScores={getGeometryScores}
      scoreTable="geometry_scores"
      formatScore={formatScore}
      sortKey="correct_answers"
      sortDirection="desc"
      customSort={(a, b) => {
        // Sort by correct_answers first (desc), then by average_time (asc - faster is better)
        if (a.correct_answers !== b.correct_answers) {
          return b.correct_answers - a.correct_answers
        }
        return a.average_time - b.average_time
      }}
    >
      <div className="flex flex-col items-center justify-start min-h-[400px] sm:min-h-[600px] pt-8">
        {/* Stats */}
        <div className="flex justify-between items-center w-full max-w-2xl mb-6 text-sm sm:text-base">
          <div className="text-gray-600 dark:text-gray-400">
            Correct: <span className="font-bold text-green-600 dark:text-green-400">{correctCount}</span> / 10
          </div>
          <div className="text-gray-600 dark:text-gray-400">
            Time: <span className="font-bold text-blue-600 dark:text-blue-400">{formatTime(elapsedTime)}</span>
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

        {/* Game Area */}
        <div className="w-full max-w-2xl">
          {gameState === 'playing' && currentProblem && (
            <div className="flex flex-col items-center">
              {/* Question */}
              <h3 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6 text-center">
                {currentProblem.question}
              </h3>
              
              {/* Shape */}
              <div className="mb-8 bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
                {currentProblem.shape}
              </div>
              
              {/* Multiple Choice Options */}
              <div className="grid grid-cols-2 gap-4 w-full max-w-md">
                {currentProblem.options.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => handleAnswerSelect(option)}
                    className="px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-lg transition-all duration-200 transform hover:scale-105 text-lg"
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          )}

          {gameState === 'wrong' && currentProblem && (
            <div className="flex flex-col items-center">
              <div className="text-6xl mb-4">✗</div>
              <div className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">
                Wrong Answer!
              </div>
              {showCorrectAnswer && (
                <div className="text-xl text-gray-600 dark:text-gray-400 mt-4 mb-6 text-center">
                  <div className="mb-4">The correct answer is: <span className="font-bold text-green-600 dark:text-green-400">{currentProblem.answer}</span></div>
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
                    {currentProblem.shape}
                  </div>
                </div>
              )}
              <button
                onClick={resetGame}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-lg transition-colors"
              >
                Play Again
              </button>
            </div>
          )}

          {gameState === 'finished' && (
            <div className="flex flex-col items-center">
              <div className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">
                Congratulations!
              </div>
              <div className="text-xl text-gray-600 dark:text-gray-400 mb-2">
                You completed all 10 questions correctly!
              </div>
              <div className="text-lg text-gray-600 dark:text-gray-400 mb-6">
                Time: {formatExactTime(elapsedTime)}
              </div>
              <button
                onClick={resetGame}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-lg transition-colors"
              >
                Play Again
              </button>
            </div>
          )}
        </div>
      </div>
    </GameWrapper>
  )
}
