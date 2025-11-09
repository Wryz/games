'use client'

import Link from 'next/link'
import { Home, Search, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center py-12">
      <div className="max-w-md mx-auto text-center px-4">
        {/* 404 Animation */}
        <div className="mb-8">
          <div className="text-8xl md:text-9xl font-bold text-blue-600 dark:text-blue-400 mb-4 animate-bounce">
            404
          </div>
        </div>

        {/* Error Message */}
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
          Oops! The game you're looking for seems to have respawned elsewhere. 
          Don't worry, we have plenty of other amazing games waiting for you!
        </p>

        {/* Action Buttons */}
        <div className="space-y-4">
          <Link 
            href="/"
            className="w-full flex items-center justify-center space-x-2 py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <Home className="h-5 w-5" />
            <span>Back to Games</span>
          </Link>
          
          <button 
            onClick={() => window.history.back()} 
            className="w-full flex items-center justify-center space-x-2 py-3 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Go Back</span>
          </button>
        </div>

        {/* Fun Gaming Quote */}
        <div className="mt-12 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400 italic">
            "The princess is in another castle... but maybe she's in our games collection!"
          </p>
        </div>
      </div>
    </div>
  )
}
