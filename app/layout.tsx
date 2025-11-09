import type { Metadata } from 'next'
import { Fredoka } from 'next/font/google'
import './tailwind.css'
import { ThemeProvider } from '@/components/ThemeProvider'
import { UserProvider } from '@/contexts/UserContext'
import { OverviewProvider } from '@/contexts/OverviewContext'
import { PostHogProvider } from './providers'

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
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const savedTheme = localStorage.getItem('theme');
                  const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  const theme = savedTheme || (systemPrefersDark ? 'dark' : 'light');
                  document.documentElement.classList.add(theme);
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className={`${fredoka.className} bg-white dark:bg-neutral-900 text-gray-700 dark:text-gray-100 min-h-screen overflow-x-hidden transition-colors duration-300`}>
        <PostHogProvider>
          <ThemeProvider>
            <UserProvider>
              <OverviewProvider>
                {children}
              </OverviewProvider>
            </UserProvider>
          </ThemeProvider>
        </PostHogProvider>
      </body>
    </html>
  )
}
