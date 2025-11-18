'use client'

import { useState } from 'react'
import { useUser } from '@/contexts/UserContext'
import { supabase } from '@/lib/supabase'

export default function FeedbackForm() {
  const [feedback, setFeedback] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { username } = useUser()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!feedback.trim()) {
      setError('Please enter your feedback')
      return
    }

    if (feedback.length > 1000) {
      setError('Feedback must be less than 1000 characters')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      // Use Supabase RPC function to submit feedback
      const { data, error: rpcError } = await supabase
        .rpc('submit_feedback' as any, {
          p_username: username || 'anonymous',
          p_feedback: feedback.trim()
        })

      if (rpcError) {
        throw rpcError
      }

      setIsSubmitted(true)
      setFeedback('')
      setTimeout(() => setIsSubmitted(false), 3000)
    } catch (err: any) {
      console.error('Error submitting feedback:', err)
      setError(err.message || 'Failed to submit feedback. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl">
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          value={feedback}
          onChange={(e) => {
            setFeedback(e.target.value)
            setError(null)
          }}
          placeholder="Share your thoughts, suggestions, or feedback..."
          className="flex-1 px-4 py-3 rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          disabled={isSubmitting || isSubmitted}
          maxLength={1000}
        />
        <button
          type="submit"
          disabled={isSubmitting || isSubmitted || !feedback.trim()}
          className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold rounded-lg transition-all duration-200 transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Submitting...
            </span>
          ) : isSubmitted ? (
            <span className="flex items-center gap-2">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Thank you!
            </span>
          ) : (
            'Submit'
          )}
        </button>
      </div>
      {error && (
        <p className="mt-2 text-sm text-red-500 dark:text-red-400">{error}</p>
      )}
      {isSubmitted && !error && (
        <p className="mt-2 text-sm text-green-600 dark:text-green-400">
          Your feedback has been submitted successfully!
        </p>
      )}
    </form>
  )
}

