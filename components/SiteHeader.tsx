'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { GAMES } from '@/types/games'
import { DOMAINS } from '@/lib/domains'
import { useUser } from '@/contexts/UserContext'
import { LogoMark } from './icons/GameIcons'
import ThemeToggle from './ThemeToggle'
import UserMenu from './UserMenu'

export function Wordmark({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoMark size={30} />
      <span className="text-[17px] font-bold tracking-tight text-gray-950 dark:text-white">
        brain<span className="text-gray-400 dark:text-gray-500">/</span>benchmark
      </span>
    </span>
  )
}

function TestDirectory({ onNavigate, columns = 'sm:grid-cols-2 lg:grid-cols-4' }: { onNavigate: () => void; columns?: string }) {
  const pathname = usePathname()
  return (
    <div className={`grid grid-cols-1 gap-x-8 gap-y-6 ${columns}`}>
      {DOMAINS.map(domain => {
        const tests = GAMES.filter(g => g.category === domain.key)
        if (tests.length === 0) return null
        return (
          <div key={domain.key}>
            <p className="eyebrow mb-2 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: domain.color }} />
              {domain.label}
            </p>
            <ul className="space-y-0.5">
              {tests.map(test => {
                const active = pathname === `/games/${test.id}`
                return (
                  <li key={test.id}>
                    <Link
                      href={`/games/${test.id}`}
                      onClick={onNavigate}
                      className={`group -mx-2 flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm transition-colors ${
                        active
                          ? 'bg-gray-100 font-semibold text-gray-950 dark:bg-gray-800 dark:text-white'
                          : 'text-gray-700 hover:bg-gray-100 hover:text-gray-950 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white'
                      }`}
                    >
                      <test.icon size={16} className="shrink-0 text-gray-400 group-hover:text-gray-700 dark:text-gray-500 dark:group-hover:text-gray-200" />
                      {test.name}
                      {test.isNew && <span className="chip-volt ml-auto px-1.5 py-0 text-[10px]">NEW</span>}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        )
      })}
    </div>
  )
}

export default function SiteHeader() {
  const [testsOpen, setTestsOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()
  const { username } = useUser()

  // Close menus on navigation (adjusting state during render, not in an effect:
  // https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes)
  const [menuPath, setMenuPath] = useState(pathname)
  if (pathname !== menuPath) {
    setMenuPath(pathname)
    setTestsOpen(false)
    setMobileOpen(false)
  }

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileOpen])

  useEffect(() => {
    if (!testsOpen) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setTestsOpen(false)
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [testsOpen])

  const profileHref = username ? `/${encodeURIComponent(username)}` : null
  const navLink =
    'rounded-full px-3 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:text-gray-950 dark:text-gray-400 dark:hover:text-white'

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200/80 bg-gray-50/85 backdrop-blur-md dark:border-gray-800/80 dark:bg-gray-950/85">
      <div className="container-page flex h-16 items-center gap-4">
        <Link href="/" aria-label="Brain Benchmark home" className="shrink-0">
          <Wordmark />
        </Link>

        <nav className="ml-4 hidden items-center gap-1 md:flex" aria-label="Main">
          <button
            type="button"
            onClick={() => setTestsOpen(o => !o)}
            aria-expanded={testsOpen}
            className={`${navLink} inline-flex items-center gap-1 ${testsOpen ? 'text-gray-950 dark:text-white' : ''}`}
          >
            Tests
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={`transition-transform ${testsOpen ? 'rotate-180' : ''}`} aria-hidden>
              <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          {profileHref && (
            <Link href={profileHref} className={`${navLink} ${pathname === profileHref ? 'text-gray-950 dark:text-white' : ''}`}>
              Profile
            </Link>
          )}
          <Link href="/about" className={`${navLink} ${pathname === '/about' ? 'text-gray-950 dark:text-white' : ''}`}>
            About
          </Link>
        </nav>

        <div className="ml-auto flex items-center gap-1.5">
          <div className="hidden sm:block">
            <UserMenu />
          </div>
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-gray-700 hover:bg-gray-200/70 dark:text-gray-300 dark:hover:bg-gray-800 md:hidden"
            aria-label="Open menu"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
              <path d="M4 7h16M4 12h16M4 17h10" />
            </svg>
          </button>
        </div>
      </div>

      {/* Desktop test directory */}
      {testsOpen && (
        <>
          <div className="fixed inset-0 top-16 z-30 hidden bg-gray-950/10 md:block dark:bg-black/40" onClick={() => setTestsOpen(false)} />
          <div className="absolute inset-x-0 top-full z-40 hidden animate-slide-up border-b border-gray-200 bg-gray-50 shadow-lift dark:border-gray-800 dark:bg-gray-950 md:block">
            <div className="container-page py-8">
              <TestDirectory onNavigate={() => setTestsOpen(false)} />
            </div>
          </div>
        </>
      )}

      {/* Mobile sheet */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-gray-50 dark:bg-gray-950 md:hidden" role="dialog" aria-modal="true">
          <div className="container-page flex h-16 shrink-0 items-center justify-between border-b border-gray-200 dark:border-gray-800">
            <Link href="/" onClick={() => setMobileOpen(false)}>
              <Wordmark />
            </Link>
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-gray-200/70 dark:hover:bg-gray-800"
              aria-label="Close menu"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            <div className="container-page space-y-8 py-6">
              <div className="flex flex-wrap items-center gap-2">
                <UserMenu />
                {profileHref && (
                  <Link href={profileHref} className="btn-ghost py-1.5" onClick={() => setMobileOpen(false)}>
                    Profile
                  </Link>
                )}
                <Link href="/about" className="btn-ghost py-1.5" onClick={() => setMobileOpen(false)}>
                  About
                </Link>
              </div>
              <TestDirectory onNavigate={() => setMobileOpen(false)} columns="sm:grid-cols-2" />
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
