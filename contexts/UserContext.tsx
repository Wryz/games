'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import posthog from 'posthog-js'

interface UserContextType {
  username: string | null
  setUsername: (username: string) => void
  clearUsername: () => void
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({ children }: { children: ReactNode }) {
  const [username, setUsernameState] = useState<string | null>(null)

  // Load username from localStorage on mount (client-only to avoid SSR mismatch)
  useEffect(() => {
    try {
      const savedUsername = localStorage.getItem('brainbench-username')
      if (savedUsername) {
        setUsernameState(savedUsername)
        if (typeof window !== 'undefined' && posthog) {
          posthog.identify(savedUsername, {
            username: savedUsername
          })
        }
      }
    } catch {
      // ignore storage errors
    }
  }, [])

  const setUsername = (newUsername: string) => {
    setUsernameState(newUsername)
    localStorage.setItem('brainbench-username', newUsername)
    
    // Identify user in PostHog
    if (typeof window !== 'undefined' && posthog) {
      posthog.identify(newUsername, {
        username: newUsername
      })
      posthog.capture('username_set', {
        username: newUsername
      })
    }
  }

  const clearUsername = () => {
    const previousUsername = username
    setUsernameState(null)
    localStorage.removeItem('brainbench-username')
    
    // Reset PostHog identity
    if (typeof window !== 'undefined' && posthog) {
      posthog.capture('username_cleared', {
        previous_username: previousUsername
      })
      posthog.reset()
    }
  }

  return (
    <UserContext.Provider value={{ username, setUsername, clearUsername }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
}
