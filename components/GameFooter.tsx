'use client'

import Link from 'next/link'
import { GAMES } from '@/types/games'
import { useUser } from '@/contexts/UserContext'

const GameFooter = () => {
  const { username } = useUser()

  // Group games by category
  const gamesByCategory = GAMES.reduce((acc, game) => {
    const category = game.category || 'other'
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(game)
    return acc
  }, {} as Record<string, typeof GAMES>)

  // Category display names
  const categoryNames: Record<string, string> = {
    motor: 'Motor Skills',
    memory: 'Memory',
    cognitive: 'Cognitive',
    perception: 'Perception',
    computation: 'Computation',
    linguistic: 'Linguistic',
    attention: 'Attention',
    language: 'Language',
    social: 'Social',
    creative: 'Creative',
    puzzles: 'Puzzles',
    other: 'Other'
  }

  // Category order
  const categoryOrder = ['motor', 'memory', 'cognitive', 'perception', 'computation', 'linguistic', 'attention', 'language', 'social', 'creative', 'puzzles', 'other']

  const progressHref = username ? `/${encodeURIComponent(username)}` : '/brain-levels'

  return (
    <footer className="mt-8 sm:mt-12 md:mt-16 relative z-10 px-4 transition-colors duration-300 border-t border-gray-200 dark:border-gray-700 pt-8 pb-6">
      <div className="max-w-7xl mx-auto">
        {/* Navigation Section */}
        <div className="mb-8 pb-8 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 sm:gap-6">
            <Link 
              href="/"
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200"
            >
              Home
            </Link>
            <span className="hidden sm:inline text-gray-400 dark:text-gray-600">•</span>
            <Link 
              href={progressHref}
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200"
            >
              Your Progress
            </Link>
            <span className="hidden sm:inline text-gray-400 dark:text-gray-600">•</span>
            <Link 
              href="/about"
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200"
            >
              Learn More
            </Link>
          </div>
        </div>

        {/* Games by Category */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6 md:gap-8 mb-8">
          {categoryOrder.map((category) => {
            const games = gamesByCategory[category]
            if (!games || games.length === 0) return null

            return (
              <div key={category} className="space-y-2">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                  {categoryNames[category] || category.charAt(0).toUpperCase() + category.slice(1)}
                </h3>
                <ul className="space-y-1.5">
                  {games.map((game) => (
                    <li key={game.id}>
                      <Link
                        href={`/games/${game.id}`}
                        className="text-xs text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200"
                      >
                        {game.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>

        {/* Copyright */}
        <div className="text-center pt-6 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-400 dark:text-gray-500">
            © 2025 Brain Benchmark. Test and improve your cognitive abilities.
          </p>
        </div>
      </div>
    </footer>
  )
}

export default GameFooter
