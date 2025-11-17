'use client'

import { BadgeTier } from '@/lib/badges'

interface GameBadgeProps {
  tier: BadgeTier
  name: string
  description: string
  earned: boolean
  size?: 'sm' | 'md' | 'lg'
  gameName?: string
}

const tierConfig = {
  novice: {
    gradient: 'from-blue-400 to-blue-600',
    bgGradient: 'from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/50',
    border: 'border-blue-400 dark:border-blue-500',
    text: 'text-blue-700 dark:text-blue-300',
    icon: '🎯',
    glow: 'shadow-blue-500/50'
  },
  adept: {
    gradient: 'from-amber-400 to-amber-600',
    bgGradient: 'from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/50',
    border: 'border-amber-400 dark:border-amber-500',
    text: 'text-amber-700 dark:text-amber-300',
    icon: '🥉',
    glow: 'shadow-amber-500/50'
  },
  expert: {
    gradient: 'from-gray-300 to-gray-500',
    bgGradient: 'from-gray-50 to-gray-100 dark:from-gray-800/20 dark:to-gray-700/50',
    border: 'border-gray-400 dark:border-gray-500',
    text: 'text-gray-700 dark:text-gray-300',
    icon: '🥈',
    glow: 'shadow-gray-500/50'
  },
  master: {
    gradient: 'from-yellow-400 via-amber-400 to-yellow-600',
    bgGradient: 'from-yellow-50 to-amber-100 dark:from-yellow-900/20 dark:to-amber-800/50',
    border: 'border-yellow-400 dark:border-yellow-500',
    text: 'text-yellow-700 dark:text-yellow-300',
    icon: '🥇',
    glow: 'shadow-yellow-500/50'
  }
}

const sizeConfig = {
  sm: {
    container: 'p-2',
    icon: 'text-lg',
    name: 'text-xs',
    desc: 'text-[10px]'
  },
  md: {
    container: 'p-3',
    icon: 'text-2xl',
    name: 'text-sm',
    desc: 'text-xs'
  },
  lg: {
    container: 'p-4',
    icon: 'text-3xl',
    name: 'text-base',
    desc: 'text-sm'
  }
}

export default function GameBadge({ 
  tier, 
  name, 
  description, 
  earned, 
  size = 'md',
  gameName 
}: GameBadgeProps) {
  const config = tierConfig[tier]
  const sizes = sizeConfig[size]
  
  return (
    <div
      className={`group relative flex flex-col items-center justify-center rounded-xl border-2 transition-all duration-300 ${
        earned
          ? `${config.bgGradient} ${config.border} shadow-lg hover:scale-105 hover:shadow-xl cursor-pointer`
          : 'bg-gray-50 dark:bg-gray-800/30 border-gray-200 dark:border-gray-700 opacity-40'
      } ${sizes.container}`}
    >
      {/* Glow effect for earned badges */}
      {earned && (
        <div className={`absolute inset-0 rounded-xl bg-gradient-to-r ${config.gradient} opacity-0 group-hover:opacity-20 transition-opacity duration-300 -z-10 blur-md`} />
      )}
      
      {/* Pulsing indicator for earned badges */}
      {earned && (
        <>
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full animate-ping shadow-lg" />
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full shadow-lg" />
        </>
      )}
      
      {/* Badge Icon */}
      <div className={`${sizes.icon} mb-1 transform transition-transform duration-300 ${
        earned ? 'scale-100 group-hover:scale-110 group-hover:rotate-6' : 'scale-75 opacity-50'
      }`}>
        {config.icon}
      </div>
      
      {/* Badge Name */}
      <div className={`${sizes.name} font-bold mb-0.5 ${
        earned ? `bg-gradient-to-r ${config.gradient} bg-clip-text text-transparent` : 'text-gray-400 dark:text-gray-500'
      }`}>
        {name}
      </div>
      
      {/* Badge Description */}
      <div className={`${sizes.desc} text-center ${
        earned ? config.text : 'text-gray-400 dark:text-gray-500'
      }`}>
        {description}
      </div>
      
      {/* Game name tooltip on hover */}
      {earned && gameName && (
        <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
          <div className="bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs px-2 py-1 rounded whitespace-nowrap">
            {gameName}
          </div>
        </div>
      )}
    </div>
  )
}

