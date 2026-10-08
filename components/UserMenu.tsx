'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useUser } from '@/contexts/UserContext'
import { validateUsername, MAX_USERNAME_LENGTH } from '@/lib/username-validation'

/** Header control for setting / changing the player name that scores are saved under. */
export default function UserMenu() {
  const { username, setUsername, clearUsername } = useUser()
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState('')
  const [error, setError] = useState<string | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const name = value.trim()
    if (!name) return
    const result = validateUsername(name)
    if (!result.isValid) {
      setError(result.error || 'Invalid name')
      return
    }
    setUsername(name)
    setError(null)
    setOpen(false)
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => {
          setValue(username || '')
          setError(null)
          setOpen(o => !o)
        }}
        aria-expanded={open}
        className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
          username
            ? 'border-gray-300 bg-white text-gray-900 hover:border-gray-950 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:hover:border-gray-300'
            : 'border-transparent bg-gray-950 text-gray-50 hover:bg-gray-800 dark:bg-gray-50 dark:text-gray-950 dark:hover:bg-white'
        }`}
      >
        {username ? (
          <>
            <span className="h-2 w-2 rounded-full bg-volt ring-2 ring-volt/30" aria-hidden />
            <span className="max-w-36 truncate">{username}</span>
          </>
        ) : (
          'Set your name'
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-72 animate-scale-in rounded-2xl border border-gray-200 bg-white p-4 shadow-lift dark:border-gray-800 dark:bg-gray-900">
          <p className="eyebrow mb-1">{username ? 'Playing as' : 'Save your scores'}</p>
          {username && (
            <div className="mb-3 flex items-center justify-between gap-2">
              <span className="truncate text-lg font-semibold">{username}</span>
              <Link
                href={`/${encodeURIComponent(username)}`}
                onClick={() => setOpen(false)}
                className="shrink-0 text-sm font-medium text-signal-600 hover:underline dark:text-signal-400"
              >
                Profile →
              </Link>
            </div>
          )}
          {!username && (
            <p className="mb-3 text-sm text-gray-600 dark:text-gray-400">
              Pick a name to appear on leaderboards and build your capability profile. No account needed.
            </p>
          )}
          <form onSubmit={submit} className="space-y-2">
            <input
              value={value}
              onChange={e => {
                setValue(e.target.value)
                setError(null)
              }}
              maxLength={MAX_USERNAME_LENGTH}
              placeholder="Your name"
              className="input"
              autoFocus
              aria-label="Player name"
            />
            {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
            <div className="flex gap-2 pt-1">
              <button type="submit" className="btn-primary flex-1 py-2" disabled={!value.trim() || value.trim() === username}>
                {username ? 'Change name' : 'Save'}
              </button>
              {username && (
                <button
                  type="button"
                  onClick={() => {
                    clearUsername()
                    setValue('')
                    setOpen(false)
                  }}
                  className="btn-ghost py-2"
                >
                  Sign out
                </button>
              )}
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
