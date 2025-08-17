'use client'

import Link from 'next/link'
import { Home, Search, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center py-12">
      <div className="max-w-md mx-auto text-center px-4">
        {/* 404 Animation */}
        <div className="mb-8">
          <div className="text-8xl md:text-9xl font-bold text-primary-600 dark:text-primary-400 mb-4 animate-bounce-gentle">
            404
          </div>
        </div>

        {/* Error Message */}
        <p className="text-lg text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
          Oops! The game you're looking for seems to have respawned elsewhere. 
          Don't worry, we have plenty of other amazing games waiting for you!
        </p>

        {/* Action Buttons */}
        <div className="space-y-4">
          
          <button 
            onClick={() => window.history.back()} 
            className="w-full flex items-center justify-center space-x-2 py-3 text-slate-600 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Go Back</span>
          </button>
        </div>

        {/* Fun Gaming Quote */}
        <div className="mt-12 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
          <p className="text-sm text-slate-600 dark:text-slate-400 italic">
            "The princess is in another castle... but maybe she's in our games collection!"
          </p>
        </div>
      </div>
    </div>
  )
}
