'use client'

import Link from 'next/link'
import { GAMES } from '@/types/games'
import { DOMAINS } from '@/lib/domains'
import { Wordmark } from './SiteHeader'

const CONTACT_EMAIL = 'wrysplays@gmail.com'

export default function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-gray-200 dark:border-gray-800">
      <div className="container-page py-12">
        <div className="grid gap-10 lg:grid-cols-[1fr_2.5fr]">
          <div className="space-y-4">
            <Wordmark />
            <p className="max-w-xs text-sm leading-relaxed text-gray-600 dark:text-gray-400">
              We benchmark machines on everything. This is the benchmark for people — short, honest tests of what a
              human mind can do.
            </p>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
              <Link href="/about" className="text-gray-700 hover:text-gray-950 dark:text-gray-300 dark:hover:text-white">
                About &amp; method
              </Link>
              <a
                href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent('Brain Benchmark')}`}
                className="text-gray-700 hover:text-gray-950 dark:text-gray-300 dark:hover:text-white"
              >
                Suggest a test
              </a>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-4 xl:grid-cols-7">
            {DOMAINS.map(domain => {
              const tests = GAMES.filter(g => g.category === domain.key)
              if (tests.length === 0) return null
              return (
                <div key={domain.key}>
                  <p className="eyebrow mb-3 flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: domain.color }} />
                    {domain.label}
                  </p>
                  <ul className="space-y-1.5">
                    {tests.map(test => (
                      <li key={test.id}>
                        <Link
                          href={`/games/${test.id}`}
                          className="text-sm text-gray-600 transition-colors hover:text-gray-950 dark:text-gray-400 dark:hover:text-white"
                        >
                          {test.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )
            })}
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-2 border-t border-gray-200 pt-6 text-xs text-gray-500 dark:border-gray-800 dark:text-gray-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Brain Benchmark. For curiosity and self-measurement — not a medical or diagnostic tool.</p>
          <p className="font-mono">{GAMES.length} tests · {DOMAINS.length} capabilities</p>
        </div>
      </div>
    </footer>
  )
}
