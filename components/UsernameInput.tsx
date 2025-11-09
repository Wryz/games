'use client'

import { useState } from 'react'

interface UsernameInputProps {
  username: string | null
  onUsernameSubmit: (username: string) => void
  onUsernameChange: () => void
}

export default function UsernameInput({ username, onUsernameSubmit, onUsernameChange }: UsernameInputProps) {
  const [inputValue, setInputValue] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputValue.trim()) return

    setIsSubmitting(true)
    try {
      await onUsernameSubmit(inputValue.trim())
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = () => {
    setInputValue(username || '')
    onUsernameChange()
  }

  if (username) {
    return (
      <div className="flex flex-col items-center mb-8">
        <div className="flex items-center space-x-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-600 p-3 shadow-sm">
          <div className="flex items-center space-x-2 flex-1">
            <span className="text-gray-700 dark:text-gray-300 font-medium">
              {username}
            </span>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="text-green-500 flex-shrink-0"
            >
              <path
                d="M20 6L9 17L4 12"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <button
            onClick={handleChange}
            className="px-3 py-1 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors"
          >
            Change
          </button>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
          Playing as: {username}
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center mb-8">
      <form onSubmit={handleSubmit} className="flex flex-col items-center space-y-4">
        <div className="flex flex-col items-center space-y-2">
          <div className="flex items-center space-x-2">
            <input
              id="username"
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Your username"
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors"
              maxLength={20}
              disabled={isSubmitting}
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || isSubmitting}
              className="px-6 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium"
            >
              {isSubmitting ? 'Setting...' : 'Start'}
            </button>
          </div>
        </div>
      </form>
      <div className="text-center mt-2 max-w-md">
        <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 font-medium">
          ⚠️ Without a username, your scores won't be counted on the leaderboard
        </p>
      </div>
    </div>
  )
}
