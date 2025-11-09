'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface UserContextType {
  username: string | null
  setUsername: (username: string) => void
  clearUsername: () => void
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({ children }: { children: ReactNode }) {
  const [username, setUsernameState] = useState<string | null>(null)

  // Load username from localStorage on mount
  useEffect(() => {
    const savedUsername = localStorage.getItem('brainbench-username')
    if (savedUsername) {
      setUsernameState(savedUsername)
    }
  }, [])

  const setUsername = (newUsername: string) => {
    setUsernameState(newUsername)
    localStorage.setItem('brainbench-username', newUsername)
  }

  const clearUsername = () => {
    setUsernameState(null)
    localStorage.removeItem('brainbench-username')
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
