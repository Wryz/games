'use client'

import { StroopTestIcon } from '../icons/GameIcons'

export default function StroopTest() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[600px] bg-gray-50 dark:bg-gray-800 rounded-lg p-8">
      <StroopTestIcon size={96} className="mb-4 text-blue-600 dark:text-blue-400" />
      <h2 className="text-3xl font-bold mb-4 text-gray-900 dark:text-gray-100">
        Stroop Test
      </h2>
      <p className="text-gray-600 dark:text-gray-400 text-center max-w-md mb-8">
        Test your cognitive flexibility and attention by identifying colors while ignoring conflicting text.
      </p>
      <div className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow-sm">
        <p className="text-gray-500 dark:text-gray-400 text-center">
          Game coming soon...
        </p>
      </div>
    </div>
  )
}
