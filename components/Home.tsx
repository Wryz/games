'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useUser } from '@/contexts/UserContext'
import { useOverview } from '@/contexts/OverviewContext'
import { supabase } from '@/lib/supabase'
import { GAMES, GAME_BY_ID, type Game } from '@/types/games'
import { DOMAINS, getDomain } from '@/lib/domains'
import { formatScoreSummary } from '@/lib/format-score'
import { formatNumber } from '@/lib/levels'
import { usePostHog } from 'posthog-js/react'

interface RecentScore {
  key: string
  username: string
  gameId: string
  gameName: string
  value: string
  dateSubmitted: string
}

type GameStat = ReturnType<typeof useOverview>['gameStats'][number]

function formatTimeAgo(dateString: string) {
  const diffInMinutes = Math.floor((Date.now() - new Date(dateString).getTime()) / 60000)
  if (diffInMinutes < 1) return 'now'
  if (diffInMinutes < 60) return `${diffInMinutes}m`
  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) return `${diffInHours}h`
  return `${Math.floor(diffInHours / 24)}d`
}

function TestCard({
  game,
  stat,
  username,
  onSelect,
}: {
  game: Game
  stat: GameStat | undefined
  username: string | null
  onSelect: () => void
}) {
  const domain = getDomain(game.category)
  const holdsRecord = Boolean(username && stat?.topScore?.username === username)

  return (
    <Link
      href={`/games/${game.id}`}
      onClick={onSelect}
      className="card group relative flex flex-col p-4 transition-all sm:p-5 duration-200 hover:-translate-y-0.5 hover:border-gray-400 hover:shadow-lift dark:hover:border-gray-600"
    >
      <div className="mb-4 flex items-start justify-between gap-3 sm:mb-5">
        <span
          className="flex h-10 w-10 shrink-0 sm:h-11 sm:w-11 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-105"
          style={{ backgroundColor: `${domain.color}1a`, color: domain.color }}
        >
          <game.icon size={22} />
        </span>
        <div className="flex flex-wrap justify-end gap-1.5">
          {game.isNew && <span className="chip-volt">NEW</span>}
          <span className="chip hidden sm:inline-flex">{game.duration}</span>
        </div>
      </div>

      <h3 className="text-base font-semibold leading-tight tracking-tight text-gray-950 dark:text-white sm:text-lg sm:leading-7">{game.name}</h3>
      <p className="mt-1 hidden text-sm leading-snug text-gray-600 dark:text-gray-400 sm:block">{game.description}</p>
      <p className="num mt-1.5 truncate text-[11px] text-gray-500 dark:text-gray-400 sm:hidden">
        {stat?.userBest ? `Best ${stat.userBest.value}` : stat?.topScore ? `Rec ${stat.topScore.value}` : game.duration}
      </p>

      <dl className="mt-5 hidden grid-cols-2 gap-3 border-t border-gray-100 pt-4 text-xs dark:border-gray-800 sm:grid">
        <div className="min-w-0">
          <dt className="eyebrow mb-0.5 text-[10px]">Record</dt>
          <dd className="num truncate font-semibold text-gray-900 dark:text-gray-100">{stat?.topScore?.value || '—'}</dd>
          <dd className="truncate text-gray-500 dark:text-gray-500">
            {stat?.topScore ? (holdsRecord ? 'held by you' : stat.topScore.username) : 'unclaimed'}
          </dd>
        </div>
        <div className="min-w-0">
          <dt className="eyebrow mb-0.5 text-[10px]">{stat?.userBest ? 'Your best' : 'Runs'}</dt>
          <dd className="num truncate font-semibold text-gray-900 dark:text-gray-100">
            {stat?.userBest ? stat.userBest.value : formatNumber(stat?.totalGames || 0)}
          </dd>
          <dd className="truncate text-gray-500 dark:text-gray-500">
            {stat?.userBest ? `${formatNumber(stat.totalGames)} runs total` : 'recorded'}
          </dd>
        </div>
      </dl>

      {holdsRecord && (
        <span className="chip-volt absolute -top-2.5 left-4 shadow-xs">★ RECORD</span>
      )}
    </Link>
  )
}

function CardSkeleton() {
  return (
    <div className="card relative h-[124px] overflow-hidden p-5 sm:h-[228px]">
      <div className="absolute inset-0 animate-shimmer bg-linear-to-r from-transparent via-gray-100/70 to-transparent dark:via-white/5" />
      <div className="h-11 w-11 rounded-xl bg-gray-100 dark:bg-gray-800" />
      <div className="mt-5 h-5 w-1/2 rounded-sm bg-gray-100 dark:bg-gray-800" />
      <div className="mt-2 h-4 w-3/4 rounded-sm bg-gray-100 dark:bg-gray-800" />
    </div>
  )
}

export default function Home() {
  const [recentScores, setRecentScores] = useState<RecentScore[]>([])
  const [feedLoading, setFeedLoading] = useState(true)
  const { username } = useUser()
  const { gameStats, gameStatsLoading, loadGameStats } = useOverview()
  const posthog = usePostHog()

  const trackClick = (game: Game, source: string) => {
    posthog.capture('game_clicked', {
      game_id: game.id,
      game_name: game.name,
      source,
      username: username || 'anonymous',
    })
  }

  // State is only set in promise callbacks, so this is safe to call from an effect
  const loadRecentScores = useCallback(() => {
    return Promise.resolve(supabase.rpc('get_recent_activity', { p_limit: 8 }))
      .then(({ data, error }) => {
        if (error) throw error
        setRecentScores(
          (Array.isArray(data) ? (data as any[]) : []).map((item, index) => ({
            key: `${item.game_id}-${item.date_submitted}-${index}`,
            username: item.username,
            gameId: item.game_id,
            gameName: GAME_BY_ID[item.game_id]?.name ?? item.game_name,
            value: formatScoreSummary(item.game_id, item.score_value),
            dateSubmitted: item.date_submitted,
          }))
        )
      })
      .catch(error => {
        console.error('Error loading recent scores:', error)
      })
      .finally(() => setFeedLoading(false))
  }, [])

  const loadAllData = useCallback(
    async (forceRefresh = false) => {
      await loadRecentScores()
      loadGameStats(forceRefresh, username || undefined).catch(error => {
        console.error('Error loading test stats:', error)
      })
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [username, loadRecentScores]
  )

  useEffect(() => {
    loadAllData()

    // Live updates: any new score anywhere refreshes the feed and stats
    const channels = GAMES.map(game =>
      supabase
        .channel(`${game.table}_changes`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: game.table }, () => loadAllData(true))
        .subscribe()
    )

    return () => {
      channels.forEach(channel => supabase.removeChannel(channel))
    }
  }, [username, loadAllData])

  const totalRuns = gameStats.reduce((sum, s) => sum + (s.totalGames || 0), 0)
  const statsReady = gameStats.length > 0
  const playedCount = gameStats.filter(s => s.userBest).length
  const startGame = GAME_BY_ID['reaction-time']

  return (
    <div>
      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-gray-200 dark:border-gray-800">
        <div className="bg-grid absolute inset-0 mask-[linear-gradient(to_bottom,black,transparent)]" aria-hidden />
        <div className="container-page relative grid gap-12 py-14 sm:py-20 lg:grid-cols-[1.35fr_1fr] lg:items-center lg:gap-16">
          <div className="animate-fade-in-up">
            <p className="eyebrow mb-6 flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="inline-flex items-center gap-1.5 text-gray-900 dark:text-gray-100">
                <span className="h-2 w-2 rounded-full bg-signal-600" />
                The human benchmark
              </span>
              <span>{GAMES.length} tests</span>
              <span>{DOMAINS.length} capabilities</span>
            </p>
            <h1 className="text-display-xl font-bold text-gray-950 dark:text-white">
              How capable is
              <br />a human mind?{' '}
              <span className="relative whitespace-nowrap text-gray-400 dark:text-gray-500">
                Measure yours.
              </span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-gray-600 dark:text-gray-400">
              We benchmark machines on everything. Brain Benchmark does it for people — short, honest tests of speed,
              memory, attention, perception, reasoning, numeracy and language. Ranked against everyone, mapped into
              your own capability profile.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href={`/games/${startGame.id}`} onClick={() => trackClick(startGame, 'home_hero')} className="btn-primary px-6 py-3 text-base">
                Start with {startGame.name}
                <span aria-hidden>→</span>
              </Link>
              <a href="#capabilities" className="btn-ghost px-6 py-3 text-base">
                Browse all tests
              </a>
            </div>

            <dl className="mt-12 grid max-w-lg grid-cols-3 gap-6 border-t border-gray-200 pt-6 dark:border-gray-800">
              <div>
                <dt className="eyebrow">Runs recorded</dt>
                <dd className="num mt-1 text-2xl font-semibold text-gray-950 dark:text-white sm:text-3xl">
                  {statsReady ? formatNumber(totalRuns) : '—'}
                </dd>
              </div>
              <div>
                <dt className="eyebrow">Tests</dt>
                <dd className="num mt-1 text-2xl font-semibold text-gray-950 dark:text-white sm:text-3xl">{GAMES.length}</dd>
              </div>
              <div>
                <dt className="eyebrow">{username ? 'You’ve taken' : 'Cost'}</dt>
                <dd className="num mt-1 text-2xl font-semibold text-gray-950 dark:text-white sm:text-3xl">
                  {username ? `${playedCount}/${GAMES.length}` : '$0'}
                </dd>
              </div>
            </dl>
          </div>

          {/* Live panel */}
          <div className="card animate-fade-in-up overflow-hidden [animation-delay:120ms]">
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-3.5 dark:border-gray-800">
              <p className="eyebrow flex items-center gap-2 text-gray-900 dark:text-gray-100">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-volt-deep opacity-60 dark:bg-volt" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-volt-deep dark:bg-volt" />
                </span>
                Live results
              </p>
              <span className="eyebrow">Latest {recentScores.length || ''}</span>
            </div>
            <ul className="divide-y divide-gray-100 dark:divide-gray-800/70">
              {feedLoading
                ? [...Array(6)].map((_, i) => (
                    <li key={i} className="flex items-center gap-3 px-5 py-3">
                      <div className="h-4 w-24 animate-pulse rounded-sm bg-gray-100 dark:bg-gray-800" />
                      <div className="ml-auto h-4 w-20 animate-pulse rounded-sm bg-gray-100 dark:bg-gray-800" />
                    </li>
                  ))
                : recentScores.length === 0
                  ? (
                    <li className="px-5 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                      No results yet. Be the first.
                    </li>
                  )
                  : recentScores.map(score => {
                      const isYou = Boolean(username && score.username === username)
                      const color = getDomain(GAME_BY_ID[score.gameId]?.category ?? 'motor').color
                      return (
                        <li key={score.key}>
                          <Link
                            href={`/games/${score.gameId}`}
                            className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50"
                          >
                            <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
                            <span className="min-w-0 flex-1">
                              <span className="flex items-center gap-1.5">
                                <span className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">{score.username}</span>
                                {isYou && <span className="chip-volt px-1.5 py-0 text-[10px]">YOU</span>}
                              </span>
                              <span className="block truncate text-xs text-gray-500 dark:text-gray-400">{score.gameName}</span>
                            </span>
                            <span className="num shrink-0 text-right text-sm font-semibold text-gray-900 dark:text-gray-100">
                              {score.value}
                            </span>
                            <span className="num w-8 shrink-0 text-right text-[11px] text-gray-400 dark:text-gray-500">
                              {formatTimeAgo(score.dateSubmitted)}
                            </span>
                          </Link>
                        </li>
                      )
                    })}
            </ul>
          </div>
        </div>
      </section>

      {/* ── Capabilities ─────────────────────────────────── */}
      <section id="capabilities" className="container-page scroll-mt-20 pt-16 sm:pt-20">
        <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="eyebrow mb-3">The tests</p>
            <h2 className="text-display font-bold">Seven capabilities.</h2>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {DOMAINS.map(d => (
              <a
                key={d.key}
                href={`#${d.key}`}
                className="chip transition-colors hover:border-gray-400 hover:text-gray-950 dark:hover:border-gray-600 dark:hover:text-white"
              >
                <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: d.color }} />
                {d.label}
              </a>
            ))}
          </div>
        </div>

        <div className="space-y-12 sm:space-y-16">
          {DOMAINS.map((domain, domainIndex) => {
            const tests = GAMES.filter(g => g.category === domain.key)
            if (tests.length === 0) return null
            return (
              <div
                key={domain.key}
                id={domain.key}
                className="grid scroll-mt-24 gap-5 border-t border-gray-200 pt-6 dark:border-gray-800 lg:grid-cols-[15rem_1fr] lg:gap-10"
              >
                <div className="lg:sticky lg:top-24 lg:self-start">
                  <div className="flex items-baseline justify-between gap-4 lg:block">
                    <span className="num text-sm text-gray-400 dark:text-gray-500">{String(domainIndex + 1).padStart(2, '0')}</span>
                    <span className="eyebrow lg:hidden">
                      {tests.length} {tests.length === 1 ? 'test' : 'tests'}
                    </span>
                  </div>
                  <h3 className="mt-1 flex items-center gap-2.5 text-2xl font-semibold tracking-tight lg:mt-3">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: domain.color }} />
                    {domain.label}
                  </h3>
                  <p className="mt-1.5 text-sm text-gray-600 dark:text-gray-400">{domain.tagline}</p>
                  <span className="eyebrow mt-4 hidden lg:block">
                    {tests.length} {tests.length === 1 ? 'test' : 'tests'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-3">
                  {!statsReady && gameStatsLoading
                    ? tests.map(t => <CardSkeleton key={t.id} />)
                    : tests.map(game => (
                        <TestCard
                          key={game.id}
                          game={game}
                          stat={gameStats.find(s => s.id === game.id)}
                          username={username}
                          onSelect={() => trackClick(game, 'home_page')}
                        />
                      ))}
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* ── Method ───────────────────────────────────────── */}
      <section className="container-page pt-24">
        <div className="overflow-hidden rounded-3xl bg-gray-950 text-gray-100 dark:border dark:border-gray-800 dark:bg-gray-900">
          <div className="grid gap-10 p-8 sm:p-12 lg:grid-cols-[1fr_2fr]">
            <div>
              <p className="eyebrow mb-3 text-gray-400">Method</p>
              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                A benchmark,
                <br />
                not a brain game.
              </h2>
            </div>
            <div className="grid gap-8 sm:grid-cols-3">
              {[
                {
                  n: '01',
                  title: 'Classic paradigms',
                  body: 'Digit span, Stroop, flanker, mental rotation — tasks borrowed from decades of cognitive psychology, adapted to run in a minute or two.',
                },
                {
                  n: '02',
                  title: 'Ranked against people',
                  body: 'Every run lands on a live leaderboard. You see the record, your best, and how many people have tried.',
                },
                {
                  n: '03',
                  title: 'Your capability map',
                  body: 'Results roll up into a profile across seven capabilities, so you can see where you are strong and what to try next.',
                },
              ].map(item => (
                <div key={item.n}>
                  <p className="num mb-3 text-sm text-volt">{item.n}</p>
                  <h3 className="mb-2 font-semibold text-white">{item.title}</h3>
                  <p className="text-sm leading-relaxed text-gray-400">{item.body}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-3 border-t border-white/10 px-8 py-5 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-12">
            <p className="text-gray-400">For curiosity and self-measurement — not a diagnostic tool.</p>
            <div className="flex gap-4">
              {username && (
                <Link href={`/${encodeURIComponent(username)}`} className="font-semibold text-volt hover:underline">
                  Your profile →
                </Link>
              )}
              <Link href="/about" className="font-semibold text-white hover:underline">
                Read the method →
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
