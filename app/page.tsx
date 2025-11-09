'use client'

import { useState } from 'react'
import BackgroundPattern from '@/components/BackgroundPattern'
import GameHeader from '@/components/GameHeader'
import GameFooter from '@/components/GameFooter'
import GameSidebar from '@/components/GameSidebar'
import MobileGameDrawer from '@/components/MobileGameDrawer'
import MainView from '@/components/MainView'

export default function Home() {
  const [selectedGame, setSelectedGame] = useState<string | null>(null)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const handleMobileMenuToggle = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  const handleMobileMenuClose = () => {
    setIsMobileMenuOpen(false)
  }

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-900 relative overflow-x-hidden transition-colors duration-300">
      <BackgroundPattern />
      
      {/* Main content area - responsive margin */}
      <div className="lg:ml-80">
        <div className="p-4 sm:p-6 md:p-8">
          <GameHeader onMobileMenuToggle={handleMobileMenuToggle} />
          
          {/* Game content area */}
          <main className="mt-8 mb-16">
            <MainView selectedGame={selectedGame} />
          </main>
          
          <GameFooter />
        </div>
      </div>
      
      {/* Desktop Sidebar */}
      <GameSidebar 
        selectedGame={selectedGame} 
        onGameSelect={setSelectedGame} 
      />
      
      {/* Mobile Drawer */}
      <MobileGameDrawer
        isOpen={isMobileMenuOpen}
        onClose={handleMobileMenuClose}
        selectedGame={selectedGame}
        onGameSelect={setSelectedGame}
      />
    </div>
  )
}