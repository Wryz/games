'use client'

import { useState, ReactNode } from 'react'
import { useUser } from '@/contexts/UserContext'
import { validateUsername, MAX_USERNAME_LENGTH } from '@/lib/username-validation'

interface UsernameGateProps {
  children: ReactNode
}

export default function UsernameGate({ children }: UsernameGateProps) {
  const { username, setUsername } = useUser()
  const [inputValue, setInputValue] = useState('')
  const [hasSkipped, setHasSkipped] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const showGate = !username && !hasSkipped

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const name = inputValue.trim()
    if (!name) return

    const validation = validateUsername(name)
    if (!validation.isValid) {
      setError(validation.error || 'Invalid username')
      return
    }

    setError(null)
    setUsername(name)
    setHasSkipped(false)
  }

  // Keep a single children tree so loading username does not remount the game
  // (remount was causing duplicate score fetches).
  return (
    <div className="relative">
      {showGate && (
        <div className="absolute inset-0 z-30 flex items-start justify-center px-4 pt-12 sm:pt-20">
          <div className="w-full max-w-sm animate-scale-in rounded-2xl border border-gray-200 bg-white p-6 shadow-lift dark:border-gray-800 dark:bg-gray-900 sm:p-7">
            <p className="eyebrow mb-2">Before you start</p>
            <h2 className="text-2xl font-bold tracking-tight">Who&apos;s being measured?</h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Add a name to put your result on the leaderboard and into your capability profile. No account, no email.
            </p>

            <form onSubmit={handleSubmit} className="mt-5 space-y-3">
              <div>
                <input
                  type="text"
                  value={inputValue}
                  onChange={e => {
                    setInputValue(e.target.value)
                    setError(null)
                  }}
                  placeholder="Your name"
                  className={`input ${error ? 'border-red-500 dark:border-red-500' : ''}`}
                  maxLength={MAX_USERNAME_LENGTH}
                  autoFocus
                  aria-label="Player name"
                />
                {error && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>}
              </div>

              <button type="submit" disabled={!inputValue.trim()} className="btn-primary w-full">
                Start the test
              </button>
              <button
                type="button"
                onClick={() => setHasSkipped(true)}
                className="w-full py-1.5 text-sm font-medium text-gray-500 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
              >
                Play without saving
              </button>
            </form>
          </div>
        </div>
      )}

      <div className={showGate ? 'pointer-events-none select-none blur-sm' : undefined} aria-hidden={showGate || undefined}>
        {children}
      </div>
    </div>
  )
}
