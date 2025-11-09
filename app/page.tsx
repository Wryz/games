'use client'

import { useState } from 'react'
import BackgroundPattern from '@/components/BackgroundPattern'
import FloatingParticles from '@/components/FloatingParticles'
import GameHeader from '@/components/GameHeader'
import GameFooter from '@/components/GameFooter'
import GameSidebar from '@/components/GameSidebar'
import MobileGameDrawer from '@/components/MobileGameDrawer'
import Home from '@/components/Home'

export default function HomePage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const handleMobileMenuToggle = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  const handleMobileMenuClose = () => {
    setIsMobileMenuOpen(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-blue-50 dark:from-neutral-900 dark:via-gray-900 dark:to-blue-900/20 relative overflow-x-hidden transition-colors duration-300">
      <BackgroundPattern />
      <FloatingParticles />
      
      {/* Main content area - responsive margin */}
      <div className="lg:ml-80 relative z-10">
        <div className="p-4 sm:p-6 md:p-8">
          <GameHeader onMobileMenuToggle={handleMobileMenuToggle} />
          
          {/* Game content area */}
          <main className="mt-8 mb-16">
            <Home />
          </main>
          
          <GameFooter />
        </div>
      </div>
      
      {/* Desktop Sidebar */}
      <GameSidebar 
        selectedGame="home" 
        onGameSelect={() => {}} 
      />
      
      {/* Mobile Drawer */}
      <MobileGameDrawer
        isOpen={isMobileMenuOpen}
        onClose={handleMobileMenuClose}
        selectedGame="home"
        onGameSelect={() => {}}
      />
    </div>
  )
}