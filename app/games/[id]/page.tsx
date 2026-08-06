'use client'

import { useParams } from 'next/navigation'
import BackgroundPattern from '@/components/BackgroundPattern'
import FloatingParticles from '@/components/FloatingParticles'
import GameHeader from '@/components/GameHeader'
import GameFooter from '@/components/GameFooter'
import GameSidebar from '@/components/GameSidebar'
import MobileGameDrawer from '@/components/MobileGameDrawer'
import GameRenderer from '@/components/GameRenderer'
import { useState } from 'react'
import { useSidebar } from '@/contexts/SidebarContext'

export default function GamePage() {
  const params = useParams()
  const gameId = params.id as string
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { isSidebarOpen } = useSidebar()

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
      <div className={`relative z-10 transition-[margin] duration-300 ease-in-out ${isSidebarOpen ? 'lg:ml-80' : 'lg:ml-0'}`}>
        <div className="p-4 sm:p-6 md:p-8">
          <GameHeader onMobileMenuToggle={handleMobileMenuToggle} />
          
          {/* Game content area */}
          <main className="mt-8 mb-16">
            <GameRenderer selectedGame={gameId} />
          </main>
          
          <GameFooter />
        </div>
      </div>
      
      {/* Desktop Sidebar */}
      <GameSidebar 
        selectedGame={gameId} 
        onGameSelect={() => {}} 
      />
      
      {/* Mobile Drawer */}
      <MobileGameDrawer
        isOpen={isMobileMenuOpen}
        onClose={handleMobileMenuClose}
        selectedGame={gameId}
        onGameSelect={() => {}}
      />
    </div>
  )
}

