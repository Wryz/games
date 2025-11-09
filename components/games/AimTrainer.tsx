'use client'

import { AimTrainerIcon } from '../icons/GameIcons'

export default function AimTrainer() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] sm:min-h-[600px] bg-gray-50 dark:bg-gray-800 rounded-lg p-4 sm:p-8">
      <AimTrainerIcon size={80} className="mb-4 text-blue-600 dark:text-blue-400 sm:w-24 sm:h-24" />
      <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-gray-900 dark:text-gray-100 text-center">
        Aim Trainer
      </h2>
      <p className="text-gray-600 dark:text-gray-400 text-center max-w-md mb-6 sm:mb-8 text-sm sm:text-base px-4">
        Improve your precision and reaction time by clicking on targets as quickly and accurately as possible.
      </p>
      <div className="bg-white dark:bg-gray-700 p-4 sm:p-6 rounded-lg shadow-sm">
        <p className="text-gray-500 dark:text-gray-400 text-center text-sm sm:text-base">
          Game coming soon...
        </p>
      </div>
    </div>
  )
}
