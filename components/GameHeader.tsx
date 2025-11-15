import Image from 'next/image'

interface GameHeaderProps {
  onMobileMenuToggle?: () => void
}

const GameHeader = ({ onMobileMenuToggle }: GameHeaderProps) => {
  return (
    <div className="relative z-10">
      {/* Mobile header with menu button */}
      <div className="flex items-center justify-between mb-4 lg:hidden">
        <button
          onClick={onMobileMenuToggle}
          className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          aria-label="Open menu"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="text-gray-700 dark:text-gray-300"
          >
            <path
              d="M3 12h18M3 6h18M3 18h18"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <div className="flex items-center gap-2">
          <Image 
            src="/images/brain.png" 
            alt="Brain" 
            width={32} 
            height={32}
            className="w-8 h-8"
          />
        <h1 className="text-2xl font-bold">
            <span className="text-gray-700 dark:text-gray-100">BRAIN</span>
          <span className="ml-2 text-cyan-500 dark:text-cyan-400">BENCHMARK</span>
        </h1>
        </div>
        <div className="w-10" /> {/* Spacer for centering */}
      </div>

      {/* Desktop header is now handled by MainView - no duplicate title needed */}
    </div>
  )
}

export default GameHeader
