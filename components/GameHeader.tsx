'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'

interface GameHeaderProps {
  onMobileMenuToggle?: () => void
  /** Hide last-updated + contact on mobile (used on game pages) */
  compactOnMobile?: boolean
}

function formatBuildDateTime(iso?: string) {
  if (!iso) return null
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

const CONTACT_EMAIL = 'wrysplays@gmail.com'
const CONTACT_HREF = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent('Brain Benchmark — update request')}`
const BUILD_TIME = process.env.NEXT_PUBLIC_BUILD_TIME

const GameHeader = ({ onMobileMenuToggle, compactOnMobile = false }: GameHeaderProps) => {
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)

  useEffect(() => {
    setLastUpdated(formatBuildDateTime(BUILD_TIME))
  }, [])

  return (
    <div className="relative z-10">
      {/* Site meta — last updated (auto from build, local time) + contact */}
      <div
        className={`mb-3 flex-wrap items-center justify-between gap-2 text-xs sm:text-sm text-gray-500 dark:text-gray-400 ${
          compactOnMobile ? 'hidden lg:flex' : 'flex'
        }`}
      >
        <p className="tabular-nums">
          {lastUpdated ? (
            <>
              Last updated{' '}
              <time dateTime={BUILD_TIME}>{lastUpdated}</time>
            </>
          ) : (
            'Last updated —'
          )}
        </p>
        <a
          href={CONTACT_HREF}
          className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 dark:border-gray-600 bg-white/70 dark:bg-gray-800/70 px-2.5 py-1 font-medium text-gray-700 dark:text-gray-200 hover:border-cyan-400 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden
            className="shrink-0"
          >
            <path
              d="M4 6h16v12H4V6zm0 0l8 7 8-7"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Contact for updates
        </a>
      </div>

      {/* Mobile header with menu button */}
      <div className="flex items-center justify-between mb-4 lg:hidden">
        <button
          onClick={onMobileMenuToggle}
          className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          aria-label="Open menu"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="text-gray-700 dark:text-gray-300"
          >
            <path
              d="M3 12h18M3 6h18M3 18h18"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <div className="flex items-center gap-2">
          <Image 
            src="/images/brain.png" 
            alt="Brain" 
            width={32} 
            height={32}
            className="w-8 h-8"
          />
        <h1 className="text-2xl font-bold">
            <span className="text-gray-700 dark:text-gray-100">BRAIN</span>
          <span className="ml-2 text-cyan-500 dark:text-cyan-400">BENCHMARK</span>
        </h1>
        </div>
        <div className="w-10" /> {/* Spacer for centering */}
      </div>

      {/* Desktop header is now handled by MainView - no duplicate title needed */}
    </div>
  )
}

export default GameHeader
