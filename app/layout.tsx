import type { Metadata } from 'next'
import { Fredoka } from 'next/font/google'
import './tailwind.css'

const fredoka = Fredoka({ 
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700']
})

export const metadata: Metadata = {
  title: 'Games Collection',
  description: 'A collection of games to play',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${fredoka.className} bg-neutral-900 text-gray-100 min-h-screen overflow-x-hidden`}>
        {children}
      </body>
    </html>
  )
}
