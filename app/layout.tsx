import type { Metadata } from 'next'
import { Space_Grotesk, JetBrains_Mono } from 'next/font/google'
import './tailwind.css'
import { ThemeProvider } from '@/components/ThemeProvider'
import { UserProvider } from '@/contexts/UserContext'
import { OverviewProvider } from '@/contexts/OverviewContext'
import { PostHogProvider } from './providers'

const sans = Space_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
})

const mono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-mono',
  display: 'swap',
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
    ? 'https://brain-benchmark.com'
    : 'http://localhost:3000'
}

export const metadata: Metadata = {
  metadataBase: new URL(getBaseUrl()),
  title: {
    default: 'Brain Benchmark — the benchmark for human capability',
    template: '%s · Brain Benchmark',
  },
  description: 'Short, free tests of what a human mind can do — reaction time, memory, attention, perception, reasoning, numeracy and language. Ranked against everyone, mapped into your own capability profile.',
  keywords: ['human benchmark', 'reaction time test', 'memory test', 'cognitive test', 'attention test', 'multiple object tracking', 'mental rotation', 'color perception test', 'verbal memory', 'chimp test', 'typing test', 'brain test'],
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
    title: 'Brain Benchmark — the benchmark for human capability',
    description: 'Short, free tests of speed, memory, attention, perception, reasoning, numeracy and language. How capable is your mind?',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Brain Benchmark — the benchmark for human capability',
    description: 'Short, free tests of speed, memory, attention, perception, reasoning, numeracy and language. How capable is your mind?',
  },
  other: {
    'subject': 'Human capability benchmarks',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable} scroll-smooth`} suppressHydrationWarning>
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
      <body className="font-sans min-h-screen overflow-x-hidden">
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
