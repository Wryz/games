'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { getTangramsScores, submitTangramsScore } from '@/lib/scores'
import { useUser } from '@/contexts/UserContext'
import { supabase } from '@/lib/supabase'
import GameWrapper from '../GameWrapper'
import type { TangramsScore } from '@/lib/supabase'
import { formatNumber } from '@/lib/levels'

type GameState = 'idle' | 'playing' | 'finished'

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
const U = 36
const SNAP = 20
const EDGE = 55


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
  { id: 'large-c', color: '#6366f1', vertices: tri(2 * U) },
  { id: 'large-d', color: '#f97316', vertices: tri(2 * U) },
  { id: 'medium-a', color: '#22c55e', vertices: tri(U * Math.SQRT2) },
  { id: 'medium-b', color: '#14b8a6', vertices: tri(U * Math.SQRT2) },
  { id: 'small-a', color: '#f59e0b', vertices: tri(U) },
  { id: 'small-b', color: '#a855f7', vertices: tri(U) },
  { id: 'small-c', color: '#eab308', vertices: tri(U) },
  { id: 'small-d', color: '#d946ef', vertices: tri(U) },
  { id: 'small-e', color: '#fb7185', vertices: tri(U) },
  { id: 'small-f', color: '#8b5cf6', vertices: tri(U) },
  { id: 'square-a', color: '#06b6d4', vertices: square(U) },
  { id: 'square-b', color: '#0ea5e9', vertices: square(U) },
  { id: 'square-c', color: '#2dd4bf', vertices: square(U) },
  { id: 'para-a', color: '#ec4899', vertices: parallelogram() },
  { id: 'para-b', color: '#f43f5e', vertices: parallelogram() },
]

const SHAPE_LAYOUTS: PuzzleTarget[][] = [
  [
    { id: 'large-a', x: 76.0, y: 166.0, rotation: 0, flipped: false },
    { id: 'large-b', x: 148.0, y: 238.0, rotation: 180, flipped: false },
    { id: 'large-c', x: 148.0, y: 166.0, rotation: 0, flipped: false },
    { id: 'large-d', x: 220.0, y: 238.0, rotation: 180, flipped: false },
    { id: 'square-a', x: 76.0, y: 238.0, rotation: 0, flipped: false },
    { id: 'square-b', x: 112.0, y: 238.0, rotation: 0, flipped: false },
    { id: 'square-c', x: 148.0, y: 238.0, rotation: 0, flipped: false },
    { id: 'small-a', x: 184.0, y: 238.0, rotation: 0, flipped: false },
    { id: 'small-b', x: 220.0, y: 274.0, rotation: 180, flipped: false },
    { id: 'small-c', x: 220.0, y: 238.0, rotation: 0, flipped: false },
    { id: 'small-d', x: 256.0, y: 274.0, rotation: 180, flipped: false },
    { id: 'small-e', x: 256.0, y: 238.0, rotation: 0, flipped: false },
    { id: 'small-f', x: 292.0, y: 274.0, rotation: 180, flipped: false },
    { id: 'medium-a', x: 76.0, y: 274.0, rotation: 0, flipped: false },
    { id: 'para-a', x: 126.912, y: 274.0, rotation: 0, flipped: false },
    { id: 'medium-b', x: 292.0, y: 166.0, rotation: 270, flipped: false },
    { id: 'para-b', x: 292.0, y: 202.0, rotation: 0, flipped: false },
  ],
  [
    { id: 'large-a', x: 112.0, y: 112.0, rotation: 0, flipped: false },
    { id: 'large-b', x: 184.0, y: 184.0, rotation: 180, flipped: false },
    { id: 'large-c', x: 184.0, y: 112.0, rotation: 0, flipped: false },
    { id: 'large-d', x: 256.0, y: 184.0, rotation: 180, flipped: false },
    { id: 'square-a', x: 112.0, y: 184.0, rotation: 0, flipped: false },
    { id: 'square-b', x: 148.0, y: 184.0, rotation: 0, flipped: false },
    { id: 'square-c', x: 184.0, y: 184.0, rotation: 0, flipped: false },
    { id: 'small-a', x: 148.0, y: 220.0, rotation: 0, flipped: false },
    { id: 'small-b', x: 184.0, y: 256.0, rotation: 180, flipped: false },
    { id: 'small-c', x: 148.0, y: 256.0, rotation: 0, flipped: false },
    { id: 'small-d', x: 184.0, y: 292.0, rotation: 180, flipped: false },
    { id: 'small-e', x: 148.0, y: 292.0, rotation: 0, flipped: false },
    { id: 'small-f', x: 184.0, y: 328.0, rotation: 180, flipped: false },
    { id: 'medium-a', x: 112.0, y: 328.0, rotation: 0, flipped: false },
    { id: 'para-a', x: 162.912, y: 328.0, rotation: 0, flipped: false },
    { id: 'medium-b', x: 256.0, y: 112.0, rotation: 270, flipped: false },
    { id: 'para-b', x: 256.0, y: 148.0, rotation: 0, flipped: false },
  ],
  [
    { id: 'large-a', x: 112.0, y: 148.0, rotation: 0, flipped: false },
    { id: 'large-b', x: 184.0, y: 220.0, rotation: 180, flipped: false },
    { id: 'large-c', x: 184.0, y: 148.0, rotation: 0, flipped: false },
    { id: 'large-d', x: 256.0, y: 220.0, rotation: 180, flipped: false },
    { id: 'square-a', x: 112.0, y: 220.0, rotation: 0, flipped: false },
    { id: 'square-b', x: 112.0, y: 256.0, rotation: 0, flipped: false },
    { id: 'square-c', x: 148.0, y: 256.0, rotation: 0, flipped: false },
    { id: 'small-a', x: 184.0, y: 256.0, rotation: 0, flipped: false },
    { id: 'small-b', x: 220.0, y: 292.0, rotation: 180, flipped: false },
    { id: 'small-c', x: 184.0, y: 220.0, rotation: 0, flipped: false },
    { id: 'small-d', x: 220.0, y: 256.0, rotation: 180, flipped: false },
    { id: 'small-e', x: 220.0, y: 220.0, rotation: 0, flipped: false },
    { id: 'small-f', x: 256.0, y: 256.0, rotation: 180, flipped: false },
    { id: 'medium-a', x: 112.0, y: 292.0, rotation: 0, flipped: false },
    { id: 'para-a', x: 162.912, y: 292.0, rotation: 0, flipped: false },
    { id: 'medium-b', x: 256.0, y: 148.0, rotation: 270, flipped: false },
    { id: 'para-b', x: 256.0, y: 184.0, rotation: 0, flipped: false },
  ],
  [
    { id: 'large-a', x: 112.0, y: 130.0, rotation: 0, flipped: false },
    { id: 'large-b', x: 184.0, y: 202.0, rotation: 180, flipped: false },
    { id: 'large-c', x: 184.0, y: 130.0, rotation: 0, flipped: false },
    { id: 'large-d', x: 256.0, y: 202.0, rotation: 180, flipped: false },
    { id: 'square-a', x: 112.0, y: 202.0, rotation: 0, flipped: false },
    { id: 'square-b', x: 148.0, y: 202.0, rotation: 0, flipped: false },
    { id: 'square-c', x: 148.0, y: 238.0, rotation: 0, flipped: false },
    { id: 'small-a', x: 184.0, y: 238.0, rotation: 0, flipped: false },
    { id: 'small-b', x: 220.0, y: 274.0, rotation: 180, flipped: false },
    { id: 'small-c', x: 220.0, y: 238.0, rotation: 0, flipped: false },
    { id: 'small-d', x: 256.0, y: 274.0, rotation: 180, flipped: false },
    { id: 'small-e', x: 220.0, y: 274.0, rotation: 0, flipped: false },
    { id: 'small-f', x: 256.0, y: 310.0, rotation: 180, flipped: false },
    { id: 'medium-a', x: 112.0, y: 310.0, rotation: 0, flipped: false },
    { id: 'para-a', x: 162.912, y: 310.0, rotation: 0, flipped: false },
    { id: 'medium-b', x: 256.0, y: 130.0, rotation: 270, flipped: false },
    { id: 'para-b', x: 256.0, y: 166.0, rotation: 0, flipped: false },
  ],
  [
    { id: 'large-a', x: 112.0, y: 112.0, rotation: 0, flipped: false },
    { id: 'large-b', x: 184.0, y: 184.0, rotation: 180, flipped: false },
    { id: 'large-c', x: 184.0, y: 112.0, rotation: 0, flipped: false },
    { id: 'large-d', x: 256.0, y: 184.0, rotation: 180, flipped: false },
    { id: 'square-a', x: 148.0, y: 184.0, rotation: 0, flipped: false },
    { id: 'square-b', x: 112.0, y: 220.0, rotation: 0, flipped: false },
    { id: 'square-c', x: 148.0, y: 220.0, rotation: 0, flipped: false },
    { id: 'small-a', x: 184.0, y: 220.0, rotation: 0, flipped: false },
    { id: 'small-b', x: 220.0, y: 256.0, rotation: 180, flipped: false },
    { id: 'small-c', x: 148.0, y: 256.0, rotation: 0, flipped: false },
    { id: 'small-d', x: 184.0, y: 292.0, rotation: 180, flipped: false },
    { id: 'small-e', x: 148.0, y: 292.0, rotation: 0, flipped: false },
    { id: 'small-f', x: 184.0, y: 328.0, rotation: 180, flipped: false },
    { id: 'medium-a', x: 112.0, y: 328.0, rotation: 0, flipped: false },
    { id: 'para-a', x: 162.912, y: 328.0, rotation: 0, flipped: false },
    { id: 'medium-b', x: 256.0, y: 112.0, rotation: 270, flipped: false },
    { id: 'para-b', x: 256.0, y: 148.0, rotation: 0, flipped: false },
  ],
  [
    { id: 'large-a', x: 112.0, y: 130.0, rotation: 0, flipped: false },
    { id: 'large-b', x: 184.0, y: 202.0, rotation: 180, flipped: false },
    { id: 'large-c', x: 184.0, y: 130.0, rotation: 0, flipped: false },
    { id: 'large-d', x: 256.0, y: 202.0, rotation: 180, flipped: false },
    { id: 'square-a', x: 112.0, y: 202.0, rotation: 0, flipped: false },
    { id: 'square-b', x: 112.0, y: 238.0, rotation: 0, flipped: false },
    { id: 'square-c', x: 112.0, y: 274.0, rotation: 0, flipped: false },
    { id: 'small-a', x: 148.0, y: 202.0, rotation: 0, flipped: false },
    { id: 'small-b', x: 184.0, y: 238.0, rotation: 180, flipped: false },
    { id: 'small-c', x: 148.0, y: 238.0, rotation: 0, flipped: false },
    { id: 'small-d', x: 184.0, y: 274.0, rotation: 180, flipped: false },
    { id: 'small-e', x: 184.0, y: 202.0, rotation: 0, flipped: false },
    { id: 'small-f', x: 220.0, y: 238.0, rotation: 180, flipped: false },
    { id: 'medium-a', x: 112.0, y: 310.0, rotation: 0, flipped: false },
    { id: 'para-a', x: 162.912, y: 310.0, rotation: 0, flipped: false },
    { id: 'medium-b', x: 256.0, y: 130.0, rotation: 270, flipped: false },
    { id: 'para-b', x: 256.0, y: 166.0, rotation: 0, flipped: false },
  ],
  [
    { id: 'large-a', x: 112.0, y: 130.0, rotation: 0, flipped: false },
    { id: 'large-b', x: 184.0, y: 202.0, rotation: 180, flipped: false },
    { id: 'large-c', x: 184.0, y: 130.0, rotation: 0, flipped: false },
    { id: 'large-d', x: 256.0, y: 202.0, rotation: 180, flipped: false },
    { id: 'square-a', x: 112.0, y: 202.0, rotation: 0, flipped: false },
    { id: 'square-b', x: 148.0, y: 202.0, rotation: 0, flipped: false },
    { id: 'square-c', x: 184.0, y: 202.0, rotation: 0, flipped: false },
    { id: 'small-a', x: 220.0, y: 202.0, rotation: 0, flipped: false },
    { id: 'small-b', x: 256.0, y: 238.0, rotation: 180, flipped: false },
    { id: 'small-c', x: 184.0, y: 238.0, rotation: 0, flipped: false },
    { id: 'small-d', x: 220.0, y: 274.0, rotation: 180, flipped: false },
    { id: 'small-e', x: 184.0, y: 274.0, rotation: 0, flipped: false },
    { id: 'small-f', x: 220.0, y: 310.0, rotation: 180, flipped: false },
    { id: 'medium-a', x: 112.0, y: 310.0, rotation: 0, flipped: false },
    { id: 'para-a', x: 162.912, y: 310.0, rotation: 0, flipped: false },
    { id: 'medium-b', x: 256.0, y: 130.0, rotation: 270, flipped: false },
    { id: 'para-b', x: 256.0, y: 166.0, rotation: 0, flipped: false },
  ],
  [
    { id: 'large-a', x: 112.0, y: 130.0, rotation: 0, flipped: false },
    { id: 'large-b', x: 184.0, y: 202.0, rotation: 180, flipped: false },
    { id: 'large-c', x: 184.0, y: 130.0, rotation: 0, flipped: false },
    { id: 'large-d', x: 256.0, y: 202.0, rotation: 180, flipped: false },
    { id: 'square-a', x: 112.0, y: 238.0, rotation: 0, flipped: false },
    { id: 'square-b', x: 148.0, y: 202.0, rotation: 0, flipped: false },
    { id: 'square-c', x: 148.0, y: 238.0, rotation: 0, flipped: false },
    { id: 'small-a', x: 148.0, y: 274.0, rotation: 0, flipped: false },
    { id: 'small-b', x: 184.0, y: 310.0, rotation: 180, flipped: false },
    { id: 'small-c', x: 184.0, y: 238.0, rotation: 0, flipped: false },
    { id: 'small-d', x: 220.0, y: 274.0, rotation: 180, flipped: false },
    { id: 'small-e', x: 220.0, y: 238.0, rotation: 0, flipped: false },
    { id: 'small-f', x: 256.0, y: 274.0, rotation: 180, flipped: false },
    { id: 'medium-a', x: 112.0, y: 310.0, rotation: 0, flipped: false },
    { id: 'para-a', x: 162.912, y: 310.0, rotation: 0, flipped: false },
    { id: 'medium-b', x: 256.0, y: 130.0, rotation: 270, flipped: false },
    { id: 'para-b', x: 256.0, y: 166.0, rotation: 0, flipped: false },
  ],
  [
    { id: 'large-a', x: 112.0, y: 130.0, rotation: 0, flipped: false },
    { id: 'large-b', x: 184.0, y: 202.0, rotation: 180, flipped: false },
    { id: 'large-c', x: 184.0, y: 130.0, rotation: 0, flipped: false },
    { id: 'large-d', x: 256.0, y: 202.0, rotation: 180, flipped: false },
    { id: 'square-a', x: 112.0, y: 202.0, rotation: 0, flipped: false },
    { id: 'square-b', x: 148.0, y: 202.0, rotation: 0, flipped: false },
    { id: 'square-c', x: 184.0, y: 202.0, rotation: 0, flipped: false },
    { id: 'small-a', x: 220.0, y: 202.0, rotation: 0, flipped: false },
    { id: 'small-b', x: 256.0, y: 238.0, rotation: 180, flipped: false },
    { id: 'small-c', x: 220.0, y: 238.0, rotation: 0, flipped: false },
    { id: 'small-d', x: 256.0, y: 274.0, rotation: 180, flipped: false },
    { id: 'small-e', x: 220.0, y: 274.0, rotation: 0, flipped: false },
    { id: 'small-f', x: 256.0, y: 310.0, rotation: 180, flipped: false },
    { id: 'medium-a', x: 112.0, y: 310.0, rotation: 0, flipped: false },
    { id: 'para-a', x: 162.912, y: 310.0, rotation: 0, flipped: false },
    { id: 'medium-b', x: 256.0, y: 130.0, rotation: 270, flipped: false },
    { id: 'para-b', x: 256.0, y: 166.0, rotation: 0, flipped: false },
  ],
  [
    { id: 'large-a', x: 112.0, y: 130.0, rotation: 0, flipped: false },
    { id: 'large-b', x: 184.0, y: 202.0, rotation: 180, flipped: false },
    { id: 'large-c', x: 184.0, y: 130.0, rotation: 0, flipped: false },
    { id: 'large-d', x: 256.0, y: 202.0, rotation: 180, flipped: false },
    { id: 'square-a', x: 112.0, y: 202.0, rotation: 0, flipped: false },
    { id: 'square-b', x: 148.0, y: 202.0, rotation: 0, flipped: false },
    { id: 'square-c', x: 148.0, y: 238.0, rotation: 0, flipped: false },
    { id: 'small-a', x: 184.0, y: 238.0, rotation: 0, flipped: false },
    { id: 'small-b', x: 220.0, y: 274.0, rotation: 180, flipped: false },
    { id: 'small-c', x: 184.0, y: 274.0, rotation: 0, flipped: false },
    { id: 'small-d', x: 220.0, y: 310.0, rotation: 180, flipped: false },
    { id: 'small-e', x: 220.0, y: 274.0, rotation: 0, flipped: false },
    { id: 'small-f', x: 256.0, y: 310.0, rotation: 180, flipped: false },
    { id: 'medium-a', x: 112.0, y: 310.0, rotation: 0, flipped: false },
    { id: 'para-a', x: 162.912, y: 310.0, rotation: 0, flipped: false },
    { id: 'medium-b', x: 256.0, y: 130.0, rotation: 270, flipped: false },
    { id: 'para-b', x: 256.0, y: 166.0, rotation: 0, flipped: false },
  ],
  [
    { id: 'large-a', x: 112.0, y: 148.0, rotation: 0, flipped: false },
    { id: 'large-b', x: 184.0, y: 220.0, rotation: 180, flipped: false },
    { id: 'large-c', x: 184.0, y: 148.0, rotation: 0, flipped: false },
    { id: 'large-d', x: 256.0, y: 220.0, rotation: 180, flipped: false },
    { id: 'square-a', x: 112.0, y: 220.0, rotation: 0, flipped: false },
    { id: 'square-b', x: 112.0, y: 256.0, rotation: 0, flipped: false },
    { id: 'square-c', x: 148.0, y: 256.0, rotation: 0, flipped: false },
    { id: 'small-a', x: 184.0, y: 256.0, rotation: 0, flipped: false },
    { id: 'small-b', x: 220.0, y: 292.0, rotation: 180, flipped: false },
    { id: 'small-c', x: 184.0, y: 220.0, rotation: 0, flipped: false },
    { id: 'small-d', x: 220.0, y: 256.0, rotation: 180, flipped: false },
    { id: 'small-e', x: 220.0, y: 256.0, rotation: 0, flipped: false },
    { id: 'small-f', x: 256.0, y: 292.0, rotation: 180, flipped: false },
    { id: 'medium-a', x: 112.0, y: 292.0, rotation: 0, flipped: false },
    { id: 'para-a', x: 162.912, y: 292.0, rotation: 0, flipped: false },
    { id: 'medium-b', x: 256.0, y: 148.0, rotation: 270, flipped: false },
    { id: 'para-b', x: 256.0, y: 184.0, rotation: 0, flipped: false },
  ],
  [
    { id: 'large-a', x: 112.0, y: 130.0, rotation: 0, flipped: false },
    { id: 'large-b', x: 184.0, y: 202.0, rotation: 180, flipped: false },
    { id: 'large-c', x: 184.0, y: 130.0, rotation: 0, flipped: false },
    { id: 'large-d', x: 256.0, y: 202.0, rotation: 180, flipped: false },
    { id: 'square-a', x: 112.0, y: 202.0, rotation: 0, flipped: false },
    { id: 'square-b', x: 148.0, y: 202.0, rotation: 0, flipped: false },
    { id: 'square-c', x: 184.0, y: 202.0, rotation: 0, flipped: false },
    { id: 'small-a', x: 184.0, y: 238.0, rotation: 0, flipped: false },
    { id: 'small-b', x: 220.0, y: 274.0, rotation: 180, flipped: false },
    { id: 'small-c', x: 184.0, y: 274.0, rotation: 0, flipped: false },
    { id: 'small-d', x: 220.0, y: 310.0, rotation: 180, flipped: false },
    { id: 'small-e', x: 148.0, y: 274.0, rotation: 0, flipped: false },
    { id: 'small-f', x: 184.0, y: 310.0, rotation: 180, flipped: false },
    { id: 'medium-a', x: 112.0, y: 310.0, rotation: 0, flipped: false },
    { id: 'para-a', x: 162.912, y: 310.0, rotation: 0, flipped: false },
    { id: 'medium-b', x: 256.0, y: 130.0, rotation: 270, flipped: false },
    { id: 'para-b', x: 256.0, y: 166.0, rotation: 0, flipped: false },
  ],
  [
    { id: 'large-a', x: 94.0, y: 148.0, rotation: 0, flipped: false },
    { id: 'large-b', x: 166.0, y: 220.0, rotation: 180, flipped: false },
    { id: 'large-c', x: 166.0, y: 148.0, rotation: 0, flipped: false },
    { id: 'large-d', x: 238.0, y: 220.0, rotation: 180, flipped: false },
    { id: 'square-a', x: 94.0, y: 220.0, rotation: 0, flipped: false },
    { id: 'square-b', x: 130.0, y: 220.0, rotation: 0, flipped: false },
    { id: 'square-c', x: 166.0, y: 220.0, rotation: 0, flipped: false },
    { id: 'small-a', x: 202.0, y: 220.0, rotation: 0, flipped: false },
    { id: 'small-b', x: 238.0, y: 256.0, rotation: 180, flipped: false },
    { id: 'small-c', x: 238.0, y: 220.0, rotation: 0, flipped: false },
    { id: 'small-d', x: 274.0, y: 256.0, rotation: 180, flipped: false },
    { id: 'small-e', x: 238.0, y: 256.0, rotation: 0, flipped: false },
    { id: 'small-f', x: 274.0, y: 292.0, rotation: 180, flipped: false },
    { id: 'medium-a', x: 94.0, y: 292.0, rotation: 0, flipped: false },
    { id: 'para-a', x: 144.912, y: 292.0, rotation: 0, flipped: false },
    { id: 'medium-b', x: 274.0, y: 148.0, rotation: 270, flipped: false },
    { id: 'para-b', x: 274.0, y: 184.0, rotation: 0, flipped: false },
  ],
  [
    { id: 'large-a', x: 112.0, y: 112.0, rotation: 0, flipped: false },
    { id: 'large-b', x: 184.0, y: 184.0, rotation: 180, flipped: false },
    { id: 'large-c', x: 184.0, y: 112.0, rotation: 0, flipped: false },
    { id: 'large-d', x: 256.0, y: 184.0, rotation: 180, flipped: false },
    { id: 'square-a', x: 112.0, y: 256.0, rotation: 0, flipped: false },
    { id: 'square-b', x: 148.0, y: 184.0, rotation: 0, flipped: false },
    { id: 'square-c', x: 148.0, y: 220.0, rotation: 0, flipped: false },
    { id: 'small-a', x: 148.0, y: 256.0, rotation: 0, flipped: false },
    { id: 'small-b', x: 184.0, y: 292.0, rotation: 180, flipped: false },
    { id: 'small-c', x: 148.0, y: 292.0, rotation: 0, flipped: false },
    { id: 'small-d', x: 184.0, y: 328.0, rotation: 180, flipped: false },
    { id: 'small-e', x: 184.0, y: 256.0, rotation: 0, flipped: false },
    { id: 'small-f', x: 220.0, y: 292.0, rotation: 180, flipped: false },
    { id: 'medium-a', x: 112.0, y: 328.0, rotation: 0, flipped: false },
    { id: 'para-a', x: 162.912, y: 328.0, rotation: 0, flipped: false },
    { id: 'medium-b', x: 256.0, y: 112.0, rotation: 270, flipped: false },
    { id: 'para-b', x: 256.0, y: 148.0, rotation: 0, flipped: false },
  ],
  [
    { id: 'large-a', x: 112.0, y: 130.0, rotation: 0, flipped: false },
    { id: 'large-b', x: 184.0, y: 202.0, rotation: 180, flipped: false },
    { id: 'large-c', x: 184.0, y: 130.0, rotation: 0, flipped: false },
    { id: 'large-d', x: 256.0, y: 202.0, rotation: 180, flipped: false },
    { id: 'square-a', x: 112.0, y: 202.0, rotation: 0, flipped: false },
    { id: 'square-b', x: 112.0, y: 238.0, rotation: 0, flipped: false },
    { id: 'square-c', x: 112.0, y: 274.0, rotation: 0, flipped: false },
    { id: 'small-a', x: 148.0, y: 274.0, rotation: 0, flipped: false },
    { id: 'small-b', x: 184.0, y: 310.0, rotation: 180, flipped: false },
    { id: 'small-c', x: 184.0, y: 274.0, rotation: 0, flipped: false },
    { id: 'small-d', x: 220.0, y: 310.0, rotation: 180, flipped: false },
    { id: 'small-e', x: 184.0, y: 238.0, rotation: 0, flipped: false },
    { id: 'small-f', x: 220.0, y: 274.0, rotation: 180, flipped: false },
    { id: 'medium-a', x: 112.0, y: 310.0, rotation: 0, flipped: false },
    { id: 'para-a', x: 162.912, y: 310.0, rotation: 0, flipped: false },
    { id: 'medium-b', x: 256.0, y: 130.0, rotation: 270, flipped: false },
    { id: 'para-b', x: 256.0, y: 166.0, rotation: 0, flipped: false },
  ],
  [
    { id: 'large-a', x: 112.0, y: 148.0, rotation: 0, flipped: false },
    { id: 'large-b', x: 184.0, y: 220.0, rotation: 180, flipped: false },
    { id: 'large-c', x: 184.0, y: 148.0, rotation: 0, flipped: false },
    { id: 'large-d', x: 256.0, y: 220.0, rotation: 180, flipped: false },
    { id: 'square-a', x: 112.0, y: 220.0, rotation: 0, flipped: false },
    { id: 'square-b', x: 148.0, y: 220.0, rotation: 0, flipped: false },
    { id: 'square-c', x: 184.0, y: 220.0, rotation: 0, flipped: false },
    { id: 'small-a', x: 220.0, y: 220.0, rotation: 0, flipped: false },
    { id: 'small-b', x: 256.0, y: 256.0, rotation: 180, flipped: false },
    { id: 'small-c', x: 148.0, y: 256.0, rotation: 0, flipped: false },
    { id: 'small-d', x: 184.0, y: 292.0, rotation: 180, flipped: false },
    { id: 'small-e', x: 184.0, y: 256.0, rotation: 0, flipped: false },
    { id: 'small-f', x: 220.0, y: 292.0, rotation: 180, flipped: false },
    { id: 'medium-a', x: 112.0, y: 292.0, rotation: 0, flipped: false },
    { id: 'para-a', x: 162.912, y: 292.0, rotation: 0, flipped: false },
    { id: 'medium-b', x: 256.0, y: 148.0, rotation: 270, flipped: false },
    { id: 'para-b', x: 256.0, y: 184.0, rotation: 0, flipped: false },
  ],
  [
    { id: 'large-a', x: 112.0, y: 130.0, rotation: 0, flipped: false },
    { id: 'large-b', x: 184.0, y: 202.0, rotation: 180, flipped: false },
    { id: 'large-c', x: 184.0, y: 130.0, rotation: 0, flipped: false },
    { id: 'large-d', x: 256.0, y: 202.0, rotation: 180, flipped: false },
    { id: 'square-a', x: 112.0, y: 238.0, rotation: 0, flipped: false },
    { id: 'square-b', x: 148.0, y: 238.0, rotation: 0, flipped: false },
    { id: 'square-c', x: 184.0, y: 202.0, rotation: 0, flipped: false },
    { id: 'small-a', x: 184.0, y: 238.0, rotation: 0, flipped: false },
    { id: 'small-b', x: 220.0, y: 274.0, rotation: 180, flipped: false },
    { id: 'small-c', x: 184.0, y: 274.0, rotation: 0, flipped: false },
    { id: 'small-d', x: 220.0, y: 310.0, rotation: 180, flipped: false },
    { id: 'small-e', x: 220.0, y: 238.0, rotation: 0, flipped: false },
    { id: 'small-f', x: 256.0, y: 274.0, rotation: 180, flipped: false },
    { id: 'medium-a', x: 112.0, y: 310.0, rotation: 0, flipped: false },
    { id: 'para-a', x: 162.912, y: 310.0, rotation: 0, flipped: false },
    { id: 'medium-b', x: 256.0, y: 130.0, rotation: 270, flipped: false },
    { id: 'para-b', x: 256.0, y: 166.0, rotation: 0, flipped: false },
  ],
  [
    { id: 'large-a', x: 274.0, y: 76.0, rotation: 90, flipped: false },
    { id: 'large-b', x: 202.0, y: 148.0, rotation: 270, flipped: false },
    { id: 'large-c', x: 274.0, y: 148.0, rotation: 90, flipped: false },
    { id: 'large-d', x: 202.0, y: 220.0, rotation: 270, flipped: false },
    { id: 'square-a', x: 202.0, y: 76.0, rotation: 90, flipped: false },
    { id: 'square-b', x: 202.0, y: 112.0, rotation: 90, flipped: false },
    { id: 'square-c', x: 202.0, y: 148.0, rotation: 90, flipped: false },
    { id: 'small-a', x: 202.0, y: 184.0, rotation: 90, flipped: false },
    { id: 'small-b', x: 166.0, y: 220.0, rotation: 270, flipped: false },
    { id: 'small-c', x: 202.0, y: 220.0, rotation: 90, flipped: false },
    { id: 'small-d', x: 166.0, y: 256.0, rotation: 270, flipped: false },
    { id: 'small-e', x: 202.0, y: 256.0, rotation: 90, flipped: false },
    { id: 'small-f', x: 166.0, y: 292.0, rotation: 270, flipped: false },
    { id: 'medium-a', x: 166.0, y: 76.0, rotation: 90, flipped: false },
    { id: 'para-a', x: 166.0, y: 126.912, rotation: 90, flipped: false },
    { id: 'medium-b', x: 274.0, y: 292.0, rotation: 0, flipped: false },
    { id: 'para-b', x: 238.0, y: 292.0, rotation: 90, flipped: false },
  ],
]

const BORDER_POSITIONS: Point[] = [
  { x: 66.49, y: 13.47 },
  { x: 160.96, y: 13.47 },
  { x: 255.43, y: 13.47 },
  { x: 349.90, y: 13.47 },
  { x: 418.82, y: 42.87 },
  { x: 418.82, y: 137.34 },
  { x: 418.82, y: 231.81 },
  { x: 418.82, y: 326.28 },
  { x: 420.75, y: 418.82 },
  { x: 326.28, y: 418.82 },
  { x: 231.81, y: 418.82 },
  { x: 137.34, y: 418.82 },
  { x: 42.87, y: 418.82 },
  { x: 13.47, y: 349.90 },
  { x: 13.47, y: 255.43 },
  { x: 13.47, y: 160.96 },
  { x: 13.47, y: 66.49 },
]

function getDef(id: string): PieceDef {
  return PIECE_DEFS.find(p => p.id === id)!
}

/** Same geometry family — interchangeable for placement (e.g. square-a ≡ square-b) */
function shapeFamily(id: string): string {
  return id.split('-')[0]
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

/** Same family + current orientation produces the same silhouette as the slot. */
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

/** Clamp piece so its entire polygon stays inside the board */
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

function createPuzzle(shapeIndex = 0): PuzzleTarget[] {
  const layouts = SHAPE_LAYOUTS
  const idx = ((shapeIndex % layouts.length) + layouts.length) % layouts.length
  return layouts[idx].map(t => ({ ...t }))
}

function borderSlots(targets: PuzzleTarget[]): PiecePlacement[] {
  return PIECE_DEFS.map((def, i) => {
    // Orient to any same-family slot so the piece already matches a valid pose
    const target =
      targets.find(t => t.id === def.id) ??
      targets.find(t => shapeFamily(t.id) === shapeFamily(def.id))!
    const slot = BORDER_POSITIONS[i % BORDER_POSITIONS.length]
    return clampPlacement({
      id: def.id,
      x: slot.x,
      y: slot.y,
      rotation: target.rotation,
      flipped: target.flipped,
      placed: false,
      filledTargetId: null,
    })
  })
}

function createNewGame(shapeIndex?: number) {
  const index =
    shapeIndex === undefined
      ? Math.floor(Math.random() * SHAPE_LAYOUTS.length)
      : shapeIndex
  const targets = createPuzzle(index)
  return {
    shapeIndex: index,
    targets,
    placements: borderSlots(targets),
  }
}

export default function Tangrams() {
  const [scores, setScores] = useState<TangramsScore[]>([])
  const [loading, setLoading] = useState(true)
  const [gameState, setGameState] = useState<GameState>('idle')
  const [shapeIndex, setShapeIndex] = useState(0)
  const [targets, setTargets] = useState<PuzzleTarget[]>(() => createPuzzle(0))
  const [placements, setPlacements] = useState<PiecePlacement[]>(() =>
    borderSlots(createPuzzle(0))
  )
  const [elapsedTime, setElapsedTime] = useState(0)
  const [dragId, setDragId] = useState<string | null>(null)
  const { username } = useUser()
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const startTimeRef = useRef(0)
  const hasSubmittedScore = useRef(false)
  const boardRef = useRef<HTMLDivElement>(null)
  const dragOffsetRef = useRef({ x: 0, y: 0 })
  const pointerStartRef = useRef<{ id: string; x: number; y: number } | null>(null)
  const didDragRef = useRef(false)

  const activeTargetId =
    targets.find(t => !isTargetFilled(placements, t.id))?.id ?? null

  const DRAG_THRESHOLD = 6

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
    clearTimer()
    startTimeRef.current = Date.now()
    setElapsedTime(0)
    timerIntervalRef.current = setInterval(() => {
      setElapsedTime(Date.now() - startTimeRef.current)
    }, 1000)
  }, [clearTimer])

  const startGame = useCallback(() => {
    // Cycle to a different shape each round (or random if first start from idle)
    const nextIndex =
      gameState === 'idle'
        ? Math.floor(Math.random() * SHAPE_LAYOUTS.length)
        : (shapeIndex + 1) % SHAPE_LAYOUTS.length
    const next = createNewGame(nextIndex)
    setShapeIndex(next.shapeIndex)
    setTargets(next.targets)
    setPlacements(next.placements)
    setDragId(null)
    setGameState('playing')
    hasSubmittedScore.current = false
    startTimer()
  }, [startTimer, gameState, shapeIndex])

  const finishGame = useCallback(
    (finalTime: number) => {
      setElapsedTime(finalTime)
      clearTimer()
      setGameState('finished')
      setDragId(null)

      if (username && !hasSubmittedScore.current) {
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
          // Keep the piece's orientation — only snap translation
          placed: true,
          filledTargetId: target.id,
        }
      }
      return clampPlacement({ ...placement, placed: false, filledTargetId: null })
    },
    [targets]
  )

  const checkComplete = useCallback(
    (next: PiecePlacement[]) => {
      if (next.every(p => p.placed)) {
        const finalTime = Date.now() - startTimeRef.current
        finishGame(finalTime)
      }
    },
    [finishGame]
  )

  const placePiece = useCallback(
    (id: string) => {
      if (!activeTargetId) return
      const target = targets.find(t => t.id === activeTargetId)
      if (!target) return

      setPlacements(prev => {
        if (isTargetFilled(prev, target.id)) return prev
        const piece = prev.find(p => p.id === id)
        if (!piece || !orientationMatches(piece, target)) return prev

        const next = prev.map(p =>
          p.id === id
            ? {
                ...p,
                x: target.x,
                y: target.y,
                placed: true,
                filledTargetId: target.id,
              }
            : p
        )
        queueMicrotask(() => checkComplete(next))
        return next
      })
    },
    [targets, activeTargetId, checkComplete]
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
      if (gameState !== 'playing') return
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
    [gameState, clientToBoard, placements]
  )

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (gameState !== 'playing' || !pointerStartRef.current) return
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
    [gameState, clientToBoard]
  )

  const onPointerUp = useCallback(() => {
    if (gameState !== 'playing' || !pointerStartRef.current) return
    const { id } = pointerStartRef.current
    pointerStartRef.current = null

    if (!didDragRef.current) {
      // Click: same geometry + already in the correct orientation
      const piece = placements.find(p => p.id === id)
      const target = activeTargetId
        ? targets.find(t => t.id === activeTargetId)
        : null
      if (piece && target && orientationMatches(piece, target)) {
        placePiece(id)
      }
      setDragId(null)
      didDragRef.current = false
      return
    }

    // Drag: snap to nearest open slot of the same shape family
    setPlacements(prev => {
      const next = prev.map(p => (p.id === id ? trySnap(p, prev) : p))
      queueMicrotask(() => checkComplete(next))
      return next
    })
    setDragId(null)
    didDragRef.current = false
  }, [gameState, activeTargetId, placePiece, trySnap, checkComplete, placements, targets])

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
            {gameState === 'idle' ? (
              'Ready'
            ) : (
              <>
                Time:{' '}
                <span className="font-bold text-blue-600 dark:text-blue-400">
                  {formatTime(elapsedTime)}
                </span>
              </>
            )}
          </div>
          {gameState !== 'idle' && (
            <button
              onClick={startGame}
              className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              title="Restart"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
              </svg>
            </button>
          )}
        </div>

        <div className="w-full max-w-2xl mb-6">
          {gameState === 'idle' ? (
            <div className="text-center py-16">
              <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-gray-700 dark:text-gray-100">
                Tangrams
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
                Place each highlighted tan — click a same-shaped, correctly oriented piece or drag it into place. Fastest time wins.
              </p>
              <button
                type="button"
                onClick={startGame}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold shadow-lg transition-colors"
              >
                Start Puzzle
              </button>
            </div>
          ) : gameState === 'finished' ? (
            <div className="text-center">
              <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-gray-700 dark:text-gray-100">
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
              <div
                ref={boardRef}
                className="relative w-full aspect-square touch-none select-none overflow-hidden border-2 border-gray-800 dark:border-gray-200 bg-gray-50 dark:bg-gray-800"
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
              >
                <svg viewBox={`0 0 ${BOARD} ${BOARD}`} className="w-full h-full">
                  {/* All target slots visible; active one highlighted */}
                  {targets.map(t => {
                    if (isTargetFilled(placements, t.id)) return null
                    const def = getDef(t.id)
                    const world = def.vertices.map(v =>
                      transformPoint(v, t.x, t.y, t.rotation, t.flipped)
                    )
                    const isActive = t.id === activeTargetId
                    return (
                      <path
                        key={`slot-${t.id}`}
                        d={pointsToPath(world)}
                        className={
                          isActive
                            ? 'fill-blue-200/50 dark:fill-blue-500/30 stroke-blue-600 dark:stroke-blue-400'
                            : 'fill-none stroke-gray-400 dark:stroke-gray-500'
                        }
                        strokeWidth={isActive ? 3 : 2}
                        strokeDasharray={isActive ? '8 4' : '6 4'}
                        strokeLinejoin="round"
                      />
                    )
                  })}

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

              <p className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
                Click a correctly oriented match to place it, or drag one onto its spot.
              </p>
            </>
          )}
        </div>
      </div>
    </GameWrapper>
  )
}
