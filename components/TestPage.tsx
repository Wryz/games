'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { lowerFirst } from '@/lib/format-score'
import { GAME_BY_ID, GAMES } from '@/types/games'
import { getDomain } from '@/lib/domains'
import { useOverview } from '@/contexts/OverviewContext'
import { useUser } from '@/contexts/UserContext'
import { formatNumber } from '@/lib/levels'
import GameRenderer from './GameRenderer'

function Stat({ label, value, sub, highlight = false }: { label: string; value: string; sub?: string; highlight?: boolean }) {
  return (
    <div className="min-w-0 px-4 py-3 sm:px-5">
      <p className="eyebrow mb-1">{label}</p>
      <p className={`num truncate text-sm font-semibold sm:text-base ${highlight ? 'text-gray-950 dark:text-white' : 'text-gray-800 dark:text-gray-200'}`}>
        {value}
      </p>
      {sub && <p className="truncate text-xs text-gray-500 dark:text-gray-400">{sub}</p>}
    </div>
  )
}

export default function TestPage({ gameId }: { gameId: string }) {
  const game = GAME_BY_ID[gameId]
  const { username } = useUser()
  const { gameStats, loadGameStats } = useOverview()

  useEffect(() => {
    loadGameStats(false, username || undefined).catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username])

  if (!game) {
    return (
      <div className="container-page py-24 text-center">
        <p className="eyebrow mb-3">404</p>
        <h1 className="text-display font-bold">Test not found</h1>
        <Link href="/" className="btn-ink mt-8">
          Browse all tests
        </Link>
      </div>
    )
  }

  const domain = getDomain(game.category)
  const stat = gameStats.find(s => s.id === game.id)
  const related = GAMES.filter(g => g.category === game.category && g.id !== game.id)
  const userHoldsRecord = Boolean(username && stat?.topScore?.username === username)

  return (
    <div className="container-page pb-8 pt-8 sm:pt-10">
      {/* Breadcrumb */}
      <nav className="eyebrow mb-5 flex items-center gap-2" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-gray-900 dark:hover:text-white">
          Tests
        </Link>
        <span aria-hidden>/</span>
        <Link href={`/#${domain.key}`} className="flex items-center gap-1.5 hover:text-gray-900 dark:hover:text-white">
          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: domain.color }} />
          {domain.label}
        </Link>
      </nav>

      {/* Title block */}
      <div className="mb-6 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <div className="flex items-center gap-3">
            <h1 className="text-display font-bold">{game.name}</h1>
            {game.isNew && <span className="chip-volt">NEW</span>}
          </div>
          <p className="mt-3 text-base text-gray-600 dark:text-gray-400 sm:text-lg">
            Measures <span className="font-medium text-gray-900 dark:text-gray-100">{lowerFirst(game.measures)}</span>.{' '}
            {game.howTo}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <span className="chip">⏱ {game.duration}</span>
          <span className="chip">Ranked by {game.metric.toLowerCase()}</span>
        </div>
      </div>

      {/* Stats strip */}
      <div className="card mb-8 grid grid-cols-2 divide-gray-200 overflow-hidden dark:divide-gray-800 sm:grid-cols-3 sm:divide-x [&>*:nth-child(n+3)]:border-t [&>*:nth-child(n+3)]:border-gray-200 dark:[&>*:nth-child(n+3)]:border-gray-800 sm:[&>*:nth-child(n+3)]:border-t-0">
        <Stat
          label="World record"
          value={stat?.topScore?.value || '—'}
          sub={stat?.topScore ? `by ${stat.topScore.username}${userHoldsRecord ? ' (you)' : ''}` : 'Be the first'}
          highlight
        />
        <Stat
          label="Your best"
          value={stat?.userBest?.value || '—'}
          sub={username ? (stat?.userBest ? username : 'Not played yet') : 'Set a name to track'}
        />
        <div className="col-span-2 sm:col-span-1">
          <Stat label="Runs recorded" value={formatNumber(stat?.totalGames || 0)} sub="across all players" />
        </div>
      </div>

      {/* The test itself + leaderboard */}
      <GameRenderer selectedGame={game.id} />

      {/* Related */}
      {related.length > 0 && (
        <section className="mt-16">
          <div className="mb-4 flex items-baseline justify-between gap-4">
            <h2 className="text-xl font-semibold tracking-tight">More {domain.label.toLowerCase()} tests</h2>
            <Link href="/" className="text-sm font-medium text-signal-600 hover:underline dark:text-signal-400">
              All tests →
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {related.map(t => (
              <Link
                key={t.id}
                href={`/games/${t.id}`}
                className="card group flex items-center gap-3 p-4 transition-all hover:-translate-y-0.5 hover:border-gray-400 dark:hover:border-gray-600"
              >
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                  style={{ backgroundColor: `${domain.color}1a`, color: domain.color }}
                >
                  <t.icon size={20} />
                </span>
                <span className="min-w-0">
                  <span className="block truncate font-semibold">{t.name}</span>
                  <span className="block truncate text-xs text-gray-500 dark:text-gray-400">{t.measures}</span>
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
