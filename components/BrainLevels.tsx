'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import html2canvas from 'html2canvas'
import { useOverview } from '@/contexts/OverviewContext'
import { formatUserScore } from '@/lib/levels'
import { getCategoryRadarAxes, getGameStrength, type CategoryRadarAxis } from '@/lib/radar'
import CategoryRadar from './CategoryRadar'

interface BrainLevelsProps {
  username?: string
}

function formatPercentile(value: number): string {
  const p = Math.round(Math.min(100, Math.max(0, value)))
  const mod100 = p % 100
  const mod10 = p % 10
  let suffix = 'th'
  if (mod100 < 11 || mod100 > 13) {
    if (mod10 === 1) suffix = 'st'
    else if (mod10 === 2) suffix = 'nd'
    else if (mod10 === 3) suffix = 'rd'
  }
  return `${p}${suffix} percentile`
}

export default function BrainLevels({ username }: BrainLevelsProps) {
  const { gameStats, gameStatsLoading, loadGameStats } = useOverview()
  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  const [isSharing, setIsSharing] = useState(false)
  const radarRef = useRef<HTMLDivElement>(null)
  const shareButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (username) {
      loadGameStats(true, username)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username])

  const axes = useMemo(() => getCategoryRadarAxes(gameStats), [gameStats])

  useEffect(() => {
    if (axes.length === 0) return
    if (!selectedKey || !axes.some(a => a.key === selectedKey)) {
      // Prefer weakest non-zero gap, else first axis
      const weakest = [...axes].sort((a, b) => a.value - b.value)[0]
      setSelectedKey(weakest.key)
    }
  }, [axes, selectedKey])

  const selectedAxis: CategoryRadarAxis | undefined = axes.find(a => a.key === selectedKey)

  const hasAnyScore = gameStats.some(gs => gs.userBest !== null)

  const downloadImage = (canvas: HTMLCanvasElement) => {
    const link = document.createElement('a')
    link.download = 'brain-benchmark-progress.png'
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  const handleShare = async () => {
    if (!radarRef.current) return

    setIsSharing(true)
    try {
      const rect = radarRef.current.getBoundingClientRect()
      const padding = 48
      const scale = 2

      const x = rect.left - padding
      const y = rect.top - padding
      const width = rect.width + padding * 2
      const height = rect.height + padding * 2

      const canvas = await html2canvas(document.body, {
        x,
        y,
        width,
        height,
        scale,
        logging: false,
        useCORS: true,
        backgroundColor: null,
        ignoreElements: element =>
          shareButtonRef.current !== null &&
          (element === shareButtonRef.current || shareButtonRef.current.contains(element)),
      })

      canvas.toBlob(async blob => {
        if (!blob) {
          setIsSharing(false)
          return
        }

        const file = new File([blob], 'brain-benchmark-progress.png', {
          type: 'image/png',
        })

        if (navigator.share && navigator.canShare?.({ files: [file] })) {
          try {
            await navigator.share({
              title: 'My Brain Benchmark Progress',
              text: 'Check out my progress on Brain Benchmark!',
              files: [file],
              url: 'https://brain-benchmark.com/',
            })
          } catch {
            downloadImage(canvas)
          }
        } else {
          downloadImage(canvas)
        }

        setIsSharing(false)
      }, 'image/png')
    } catch (error) {
      console.error('Error sharing image:', error)
      setIsSharing(false)
    }
  }

  if (!username) {
    return null
  }

  if (gameStatsLoading && gameStats.length === 0) {
    return (
      <div className="p-6 rounded-xl border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50">
        <div className="text-center text-gray-500 dark:text-gray-400">Loading progress...</div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2 text-center sm:text-left">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
          Your Progress
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Each axis is your average vs the current top score in that category (0–100).
          Tap a category to see what to play next.
        </p>
      </div>

      <div
        ref={radarRef}
        className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white/70 dark:bg-gray-800/60 p-4 sm:p-6 shadow-sm"
      >
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(260px,340px)_minmax(0,1fr)] gap-6 lg:gap-8 items-start">
          {selectedAxis && (
            <aside className="lg:sticky lg:top-4 self-start order-2 lg:order-1">
              <div className="flex items-center gap-3 mb-3">
                <span
                  className="h-3 w-3 rounded-full shrink-0"
                  style={{ backgroundColor: selectedAxis.color }}
                />
                <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                  {selectedAxis.label}
                </h2>
                <span className="text-sm text-gray-500 dark:text-gray-400 tabular-nums ml-auto">
                  {Math.round(selectedAxis.value)} / 100
                </span>
              </div>

              <ul className="divide-y divide-gray-200/70 dark:divide-gray-700/70 max-h-[28rem] overflow-y-auto">
                {selectedAxis.games.map(game => {
                  const stat = gameStats.find(gs => gs.id === game.id)
                  const played = Boolean(stat?.userBest)
                  const scoreText = played && stat?.userBest?.score
                    ? formatUserScore(game.id, stat.userBest.score)
                    : null
                  const strength = getGameStrength(
                    game.id,
                    stat?.userBest?.score as Record<string, unknown> | null | undefined,
                    stat?.topScore?.score as Record<string, unknown> | null | undefined
                  )
                  const Icon = game.icon

                  return (
                    <li
                      key={game.id}
                      className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0"
                    >
                      <div className="flex items-start gap-2 min-w-0">
                        <Icon size={18} className="shrink-0 mt-0.5 text-gray-600 dark:text-gray-300" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {game.name}
                            </p>
                            <Link
                              href={`/games/${game.id}`}
                              className={`shrink-0 inline-flex justify-center items-center px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                                played
                                  ? 'bg-gray-200/80 hover:bg-gray-300 text-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-100'
                                  : 'bg-blue-600 hover:bg-blue-700 text-white'
                              }`}
                            >
                              {played ? 'Replay' : 'Play'}
                            </Link>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            {played && scoreText ? (
                              <>
                                Best:{' '}
                                <span className="font-semibold" style={{ color: selectedAxis.color }}>
                                  {scoreText}
                                </span>
                                {' · '}
                                {formatPercentile(strength)}
                              </>
                            ) : (
                              'Not played yet'
                            )}
                          </p>
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ul>
            </aside>
          )}

          <div className="min-w-0 order-1 lg:order-2">
            <CategoryRadar
              axes={axes}
              selectedKey={selectedKey}
              onSelect={setSelectedKey}
            />

            {!hasAnyScore && (
              <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
                No scores yet —{' '}
                <Link href="/" className="text-blue-600 dark:text-blue-400 font-medium hover:underline">
                  play a game
                </Link>{' '}
                to start filling your map.
              </p>
            )}
          </div>
        </div>

        <div className="mt-4 px-1 text-center">
          <a
            href="https://brain-benchmark.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
          >
            brain-benchmark.com
          </a>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          ref={shareButtonRef}
          type="button"
          onClick={handleShare}
          disabled={isSharing}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-xs sm:text-sm font-medium rounded-lg transition-colors disabled:cursor-not-allowed"
        >
          {isSharing ? (
            <>
              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Sharing...
            </>
          ) : (
            <>
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                />
              </svg>
              Share as PNG
            </>
          )}
        </button>
      </div>
    </div>
  )
}
