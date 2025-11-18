'use client'

import { useEffect, useRef, useState } from 'react'
import { useOverview } from '@/contexts/OverviewContext'
import { GAMES } from '@/types/games'
import html2canvas from 'html2canvas'
import { useTheme } from '@/components/ThemeProvider'

interface ScoresOverviewProps {
  username?: string
}

export default function ScoresOverview({ username }: ScoresOverviewProps) {
  const { gameStats, gameStatsLoading, loadGameStats } = useOverview()
  const tableRef = useRef<HTMLDivElement>(null)
  const shareButtonRef = useRef<HTMLButtonElement>(null)
  const [isSharing, setIsSharing] = useState(false)
  const { theme } = useTheme()

  useEffect(() => {
    if (username) {
      loadGameStats(true, username)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username])

  if (!username) {
    return null
  }

  if (gameStatsLoading && gameStats.length === 0) {
    return (
      <div className="mb-8 p-6 bg-white/50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="text-center text-gray-500 dark:text-gray-400">Loading scores...</div>
      </div>
    )
  }

  // Sort games by their order in GAMES array
  const sortedGameStats = [...gameStats].sort((a, b) => {
    const gameAIndex = GAMES.findIndex(g => g.id === a.id)
    const gameBIndex = GAMES.findIndex(g => g.id === b.id)
    return gameAIndex - gameBIndex
  })

  // Filter to only show games where user has a score
  const gamesWithScores = sortedGameStats.filter(game => game.userBest !== null)

  const handleShare = async () => {
    if (!tableRef.current) return

    setIsSharing(true)
    try {
      // Get the table's position and dimensions
      const rect = tableRef.current.getBoundingClientRect()
      const padding = 48 // 48px padding to show background
      const scale = 2
      
      // Calculate the area to capture (table + 48px padding on each side)
      const x = rect.left - padding
      const y = rect.top - padding
      const width = rect.width + (padding * 2)
      const height = rect.height + (padding * 2)
      
      // Capture the area including the background around the table
      // Explicitly ignore the share button
      const canvas = await html2canvas(document.body, {
        x: x,
        y: y,
        width: width,
        height: height,
        scale: scale,
        logging: false,
        useCORS: true,
        backgroundColor: null, // Transparent to show actual background
        ignoreElements: (element) => {
          // Exclude the share button from the capture
          return shareButtonRef.current !== null && 
                 (element === shareButtonRef.current || 
                  shareButtonRef.current.contains(element))
        },
      })

      // Convert canvas to blob
      canvas.toBlob(async (blob) => {
        if (!blob) {
          setIsSharing(false)
          return
        }

        // Create a File object
        const file = new File([blob], 'brain-benchmark-scores.png', {
          type: 'image/png',
        })

        // Use Web Share API if available
        if (navigator.share && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              title: 'My Brain Benchmark Scores',
              text: 'Check out my scores on Brain Benchmark!',
              files: [file],
              url: 'https://brain-benchmark.com/',
            })
          } catch (error) {
            // User cancelled or share failed, fallback to download
            downloadImage(canvas)
          }
        } else {
          // Fallback: download the image
          downloadImage(canvas)
        }

        setIsSharing(false)
      }, 'image/png')
    } catch (error) {
      console.error('Error sharing image:', error)
      setIsSharing(false)
    }
  }

  const downloadImage = (canvas: HTMLCanvasElement) => {
    const link = document.createElement('a')
    link.download = 'brain-benchmark-scores.png'
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  if (gamesWithScores.length === 0) {
    return (
      <div className="mb-8 p-6 bg-white/50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="text-center text-gray-500 dark:text-gray-400">No scores found</div>
      </div>
    )
  }

  return (
    <div className="mb-8">
      <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
        <div ref={tableRef}>
          <table className="w-full">
            <thead className="bg-gray-100 dark:bg-gray-900/50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Game Name
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Score
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {gamesWithScores.map((game) => (
                <tr
                  key={game.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                    {game.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                    {game.userBest?.value || 'No score'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {/* Footer with URL only (excluded from share image) */}
          <div className="px-4 sm:px-6 py-2 bg-gray-50 dark:bg-gray-900/30 border-t border-gray-200 dark:border-gray-700">
            <a
              href="https://brain-benchmark.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              <span className="font-medium">brain-benchmark.com</span>
            </a>
          </div>
        </div>
      </div>
      {/* Share button outside of table container so it's not included in the image */}
      <div className="mt-4 flex justify-end">
        <button
          ref={shareButtonRef}
          onClick={handleShare}
          disabled={isSharing}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-xs sm:text-sm font-medium rounded-lg transition-colors disabled:cursor-not-allowed"
        >
          {isSharing ? (
            <>
              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Sharing...
            </>
          ) : (
            <>
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              Share as PNG
            </>
          )}
        </button>
      </div>
    </div>
  )
}

