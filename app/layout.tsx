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

// Get the base URL from environment variable or use a default
const getBaseUrl = () => {
  // In production, use NEXT_PUBLIC_SITE_URL or VERCEL_URL
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }
  // Fallback for local development
  return process.env.NODE_ENV === 'production' 
    ? 'https://your-domain.com' // Replace with your actual domain
    : 'http://localhost:3000'
}

export const metadata: Metadata = {
  metadataBase: new URL(getBaseUrl()),
  title: 'Brain Benchmark - Cognitive Assessment & Educational Brain Training',
  description: 'Educational cognitive assessment platform for testing and improving memory, reaction time, attention, and processing speed. Free brain training exercises for students and educators.',
  keywords: ['cognitive assessment', 'brain training', 'educational games', 'memory training', 'reaction time test', 'attention training', 'cognitive skills', 'educational tools', 'brain exercises', 'learning games'],
  authors: [{ name: 'Brain Benchmark' }],
  creator: 'Brain Benchmark',
  publisher: 'Brain Benchmark',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    siteName: 'Brain Benchmark',
    title: 'Brain Benchmark - Cognitive Assessment & Educational Brain Training',
    description: 'Educational cognitive assessment platform for testing and improving memory, reaction time, attention, and processing speed.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Brain Benchmark - Cognitive Assessment & Educational Brain Training',
    description: 'Educational cognitive assessment platform for testing and improving memory, reaction time, attention, and processing speed.',
  },
  other: {
    'classification': 'Educational',
    'category': 'Education',
    'audience': 'Students, Educators, Researchers',
    'coverage': 'Worldwide',
    'distribution': 'Global',
    'rating': 'General',
    'revisit-after': '7 days',
    'subject': 'Cognitive Assessment and Brain Training',
    'topic': 'Educational Cognitive Training',
    'language': 'English',
    'geo.region': 'US',
  },
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
