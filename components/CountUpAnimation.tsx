'use client'

import { useState, useEffect, useRef } from 'react'

interface CountUpAnimationProps {
  end: number
  duration?: number
  className?: string
}

export default function CountUpAnimation({ end, duration = 2000, className = '' }: CountUpAnimationProps) {
  const [count, setCount] = useState(0)
  const [hasStarted, setHasStarted] = useState(false)
  const countRef = useRef(0)
  const animationFrameRef = useRef<number | null>(null)

  useEffect(() => {
    // Start animation when component mounts
    setHasStarted(true)
    const startTime = Date.now()
    const startValue = 0

    const animate = () => {
      const now = Date.now()
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      
      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4)
      const currentCount = Math.floor(startValue + (end - startValue) * easeOutQuart)
      
      countRef.current = currentCount
      setCount(currentCount)

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate)
      } else {
        setCount(end) // Ensure we end at the exact value
      }
    }

    animationFrameRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [end, duration])

  return (
    <span className={className}>
      {count.toLocaleString('en-US')}
    </span>
  )
}

