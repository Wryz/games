import type { Metadata } from 'next'
import { Fredoka } from 'next/font/google'
import './tailwind.css'
import { ThemeProvider } from '@/components/ThemeProvider'
import { UserProvider } from '@/contexts/UserContext'
import { OverviewProvider } from '@/contexts/OverviewContext'

const fredoka = Fredoka({ 
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700']
})

export const metadata: Metadata = {
  title: 'Brain Benchmark',
  description: 'Test and improve your cognitive abilities with brain training exercises',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${fredoka.className} bg-white dark:bg-neutral-900 text-gray-900 dark:text-gray-100 min-h-screen overflow-x-hidden transition-colors duration-300`}>
        <ThemeProvider>
          <UserProvider>
            <OverviewProvider>
              {children}
            </OverviewProvider>
          </UserProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
