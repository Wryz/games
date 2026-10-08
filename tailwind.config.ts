import type { Config } from 'tailwindcss'

/**
 * Brain Benchmark design tokens.
 *
 * - `gray` is a warm "ink on paper" neutral scale (light: paper, dark: ink).
 * - `blue` / `signal` is the single brand accent (electric cobalt). Games use
 *   blue-* utilities for their primary actions, so they inherit the brand.
 * - `volt` is the highlight used sparingly for records and "you" markers.
 */
const signal = {
  50: '#eef1ff',
  100: '#dfe4ff',
  200: '#c3ccff',
  300: '#9aa9ff',
  400: '#6d80ff',
  500: '#4a5cff',
  600: '#3341f5',
  700: '#2832d8',
  800: '#232baf',
  900: '#222a89',
  950: '#141850',
}

const ink = {
  50: '#f7f6f2',
  100: '#efede7',
  200: '#e2e0d8',
  300: '#cbc8be',
  400: '#a3a097',
  500: '#7a776f',
  600: '#5a5852',
  700: '#3f3d39',
  800: '#272624',
  900: '#181716',
  950: '#0e0e0d',
}

const config: Config = {
  content: [
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx}',
    './types/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        gray: ink,
        neutral: ink,
        blue: signal,
        signal,
        primary: signal,
        volt: {
          DEFAULT: '#d4ff3f',
          soft: '#ecffb0',
          deep: '#4d6b00',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      fontSize: {
        'display-xl': ['clamp(2.75rem, 6.5vw, 5.5rem)', { lineHeight: '0.95', letterSpacing: '-0.04em' }],
        'display': ['clamp(2rem, 4vw, 3.25rem)', { lineHeight: '1', letterSpacing: '-0.035em' }],
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'fade-in-up': 'fadeInUp 0.5s ease-out both',
        'slide-up': 'slideUp 0.3s ease-out',
        'scale-in': 'scaleIn 0.25s ease-out',
        'shimmer': 'shimmer 2.5s linear infinite',
        'shake': 'shake 0.5s ease-in-out',
        'blink': 'blink 1.2s steps(2, start) infinite',
        'ticker': 'ticker 40s linear infinite',
        'bounce-gentle': 'bounceGentle 2s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.96)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-8px)' },
          '20%, 40%, 60%, 80%': { transform: 'translateX(8px)' },
        },
        blink: {
          to: { visibility: 'hidden' },
        },
        ticker: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        bounceGentle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
      },
      boxShadow: {
        'card': '0 1px 0 rgba(14, 14, 13, 0.04), 0 1px 3px rgba(14, 14, 13, 0.06)',
        'lift': '0 12px 32px -12px rgba(14, 14, 13, 0.25)',
        'signal': '0 8px 24px -8px rgba(51, 65, 245, 0.55)',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}
export default config
