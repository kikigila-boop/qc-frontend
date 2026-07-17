import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#eef2ff',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
        },
        status: {
          process:  '#f59e0b',
          done:     '#10b981',
          upload:   '#3b82f6',
          ready:    '#8b5cf6',
          ingest:   '#22c55e',
          notpass:  '#ef4444',
        },
      },
      fontSize: {
        'xs':   ['0.875rem',  { lineHeight: '1.25rem' }],
        'sm':   ['1rem',      { lineHeight: '1.5rem' }],
        'base': ['1.125rem',  { lineHeight: '1.75rem' }],
        'lg':   ['1.25rem',   { lineHeight: '1.75rem' }],
        'xl':   ['1.5rem',    { lineHeight: '2rem' }],
        '2xl':  ['1.875rem',  { lineHeight: '2.25rem' }],
        '3xl':  ['2.25rem',   { lineHeight: '2.5rem' }],
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      keyframes: {
        'slide-in-right': {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
      },
      animation: {
        'slide-in-right': 'slide-in-right 0.25s ease-out',
      },
    },
  },
  plugins: [],
}

export default config
