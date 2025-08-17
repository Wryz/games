'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Game } from '@/types/game'

interface SimpleGameGridProps {
  games: Game[]
  onGameClick: (gameId: string) => void
}

const SimpleGameGrid = ({ games, onGameClick }: SimpleGameGridProps) => {
  const router = useRouter()

  const handleGameClick = (gameId: string) => {
    // Handle specific games with routes
    if (gameId === 'snake') {
      router.push('/play/snake')
      return
    }
    
    // For other games, use the provided callback
    onGameClick(gameId)
  }

  return (
    <div className="max-w-7xl mx-auto relative z-10 px-2 sm:px-0">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
        {games.map((game) => (
          <div
            key={game.id}
            className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden transition-all duration-300 hover:border-cyan-400 hover:shadow-lg cursor-pointer group transform hover:-translate-y-0.5"
            onClick={() => handleGameClick(game.id)}
            style={{ 
              boxShadow: 'none',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 10px 25px -3px rgba(34, 211, 238, 0.2), 0 4px 6px -2px rgba(34, 211, 238, 0.05)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            {/* Game Image */}
            <div className="relative h-48 bg-gray-700">
              <Image
                src={game.image}
                alt={game.title}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
              {/* Overlay on hover */}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center">
                <div className="text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Game Info */}
            <div className="p-4">
              <h3 className="text-lg font-semibold text-gray-100 mb-2 group-hover:text-cyan-400 transition-colors duration-300">
                {game.title}
              </h3>
              <div className="flex items-center justify-between text-sm text-gray-400">
                <span className="px-2 py-1 bg-gray-700 rounded text-xs">
                  {game.category}
                </span>
                <div className="flex items-center space-x-1">
                  <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span>{game.rating}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default SimpleGameGrid
