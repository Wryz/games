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
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasSkipped, setHasSkipped] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const showGate = !username && !hasSkipped

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputValue.trim()) return

    const validation = validateUsername(inputValue.trim())
    if (!validation.isValid) {
      setError(validation.error || 'Invalid username')
      return
    }

    setError(null)
    setIsSubmitting(true)
    try {
      setUsername(inputValue.trim())
      setHasSkipped(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSkip = () => {
    setHasSkipped(true)
  }

  // Keep a single children tree so loading username does not remount the game
  // (remount was causing duplicate score fetches).
  return (
    <div className="relative">
      {showGate && (
        <div className="absolute inset-0 backdrop-blur-xs z-50 flex items-start justify-center pt-12 sm:pt-16 md:pt-20 rounded-lg">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 p-8 max-w-md w-full mx-4">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Assess with a Username (Optional)
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                To track your scores on the leaderboard, please enter a username
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => {
                    setInputValue(e.target.value)
                    setError(null)
                  }}
                  placeholder="Your username"
                  className={`w-full px-4 py-3 border rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors ${
                    error
                      ? 'border-red-500 dark:border-red-500'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                  maxLength={MAX_USERNAME_LENGTH}
                  disabled={isSubmitting}
                  autoFocus
                />
                {error && (
                  <p className="text-sm text-red-600 dark:text-red-400 mt-2">
                    {error}
                  </p>
                )}
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Maximum {MAX_USERNAME_LENGTH} characters
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  type="submit"
                  disabled={!inputValue.trim() || isSubmitting}
                  className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium"
                >
                  {isSubmitting ? 'Setting...' : 'Start Assessment'}
                </button>

                <button
                  type="button"
                  onClick={handleSkip}
                  disabled={isSubmitting}
                  className="w-full px-6 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-gray-700 dark:text-gray-300 rounded-lg transition-colors font-medium"
                >
                  Skip (Scores Won&apos;t Be Tracked)
                </button>
              </div>
            </form>

            <div className="mt-4 text-center">
              <p className="text-xs text-amber-600 dark:text-amber-400">
                ⚠️ Without a username, your scores won&apos;t be saved to the leaderboard
              </p>
            </div>
          </div>
        </div>
      )}

      <div className={showGate ? 'blur-sm pointer-events-none' : undefined}>
        {children}
      </div>
    </div>
  )
}
