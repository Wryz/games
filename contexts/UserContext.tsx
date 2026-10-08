'use client'

import { createContext, useContext, useEffect, useSyncExternalStore, ReactNode } from 'react'
import posthog from 'posthog-js'

interface UserContextType {
  username: string | null
  setUsername: (username: string) => void
  clearUsername: () => void
}

const UserContext = createContext<UserContextType | undefined>(undefined)

const STORAGE_KEY = 'brainbench-username'

// The username lives in localStorage; read it as an external store so the
// server render (null) and the client hydrate cleanly, and other tabs stay in sync.
const listeners = new Set<() => void>()

function subscribe(listener: () => void) {
  listeners.add(listener)
  window.addEventListener('storage', listener)
  return () => {
    listeners.delete(listener)
    window.removeEventListener('storage', listener)
  }
}

function getSnapshot(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

function getServerSnapshot(): string | null {
  return null
}

function writeUsername(value: string | null) {
  if (value === null) localStorage.removeItem(STORAGE_KEY)
  else localStorage.setItem(STORAGE_KEY, value)
  listeners.forEach(listener => listener())
}

export function UserProvider({ children }: { children: ReactNode }) {
  const username = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  // Identify a returning user in PostHog once on load
  useEffect(() => {
    const savedUsername = getSnapshot()
    if (savedUsername && posthog) {
      posthog.identify(savedUsername, {
        username: savedUsername
      })
    }
  }, [])

  const setUsername = (newUsername: string) => {
    writeUsername(newUsername)
    
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
    writeUsername(null)
    
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
