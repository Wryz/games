'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface SidebarContextType {
  collapsedCategories: Set<string>
  toggleCategory: (category: string) => void
  isCategoryCollapsed: (category: string) => boolean
  isSidebarOpen: boolean
  toggleSidebar: () => void
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined)

const STORAGE_KEY = 'brainbench-sidebar-collapsed'
const OPEN_STORAGE_KEY = 'brainbench-sidebar-open'

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set())
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)

  // Load collapsed categories and open state from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_KEY)
        if (saved) {
          const categories = JSON.parse(saved) as string[]
          setCollapsedCategories(new Set(categories))
        }
        const savedOpen = localStorage.getItem(OPEN_STORAGE_KEY)
        if (savedOpen !== null) {
          setIsSidebarOpen(savedOpen === 'true')
        }
      } catch (error) {
        console.error('Error loading sidebar state:', error)
      }
    }
  }, [])

  const toggleCategory = (category: string) => {
    setCollapsedCategories(prev => {
      const newSet = new Set(prev)
      if (newSet.has(category)) {
        newSet.delete(category)
      } else {
        newSet.add(category)
      }
      
      // Persist to localStorage
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(newSet)))
        } catch (error) {
          console.error('Error saving sidebar state:', error)
        }
      }
      
      return newSet
    })
  }

  const isCategoryCollapsed = (category: string) => {
    return collapsedCategories.has(category)
  }

  const toggleSidebar = () => {
    setIsSidebarOpen(prev => {
      const next = !prev
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(OPEN_STORAGE_KEY, String(next))
        } catch (error) {
          console.error('Error saving sidebar open state:', error)
        }
      }
      return next
    })
  }

  return (
    <SidebarContext.Provider value={{ collapsedCategories, toggleCategory, isCategoryCollapsed, isSidebarOpen, toggleSidebar }}>
      {children}
    </SidebarContext.Provider>
  )
}

export function useSidebar() {
  const context = useContext(SidebarContext)
  if (context === undefined) {
    throw new Error('useSidebar must be used within a SidebarProvider')
  }
  return context
}

