'use client'
import SnakeGame from '@/games/snake/SnakeGame'

export default function SnakePage() {
  return (
    <div className="min-h-screen bg-neutral-900 text-gray-100 overflow-x-hidden">
      <SnakeGame />
    </div>
  )
}
