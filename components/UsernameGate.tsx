'use client'

import { useState, useEffect, ReactNode } from 'react'
import { useUser } from '@/contexts/UserContext'

interface UsernameGateProps {
  children: ReactNode
}

export default function UsernameGate({ children }: UsernameGateProps) {
  const { username, setUsername } = useUser()
  const [inputValue, setInputValue] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasSkipped, setHasSkipped] = useState(false)

  // Check if user has previously skipped
  useEffect(() => {
    const skipped = localStorage.getItem('brainbench-username-skipped')
    if (skipped === 'true') {
      setHasSkipped(true)
    }
  }, [])

  // If user has username or has skipped, show the game
  if (username || hasSkipped) {
    return <>{children}</>
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputValue.trim()) return

    setIsSubmitting(true)
    try {
      setUsername(inputValue.trim())
      // Clear skip flag when username is set
      localStorage.removeItem('brainbench-username-skipped')
      setHasSkipped(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSkip = () => {
    localStorage.setItem('brainbench-username-skipped', 'true')
    setHasSkipped(true)
  }

  return (
    <div className="relative">
      {/* Overlay that blocks the game */}
      <div className="absolute inset-0 backdrop-blur-xs z-50 flex items-start justify-center pt-12 sm:pt-16 md:pt-20 rounded-lg">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 p-8 max-w-md w-full mx-4">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Enter a Username
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
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Your username"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors"
                maxLength={20}
                disabled={isSubmitting}
                autoFocus
              />
            </div>

            <div className="flex flex-col gap-3">
              <button
                type="submit"
                disabled={!inputValue.trim() || isSubmitting}
                className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium"
              >
                {isSubmitting ? 'Setting...' : 'Start Playing'}
              </button>

              <button
                type="button"
                onClick={handleSkip}
                disabled={isSubmitting}
                className="w-full px-6 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-gray-700 dark:text-gray-300 rounded-lg transition-colors font-medium"
              >
                Skip (Scores Won't Be Tracked)
              </button>
            </div>
          </form>

          <div className="mt-4 text-center">
            <p className="text-xs text-amber-600 dark:text-amber-400">
              ⚠️ Without a username, your scores won't be saved to the leaderboard
            </p>
          </div>
        </div>
      </div>

      {/* Blurred game content behind overlay */}
      <div className="blur-sm pointer-events-none">
        {children}
      </div>
    </div>
  )
}

