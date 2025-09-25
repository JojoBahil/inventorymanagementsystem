/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)'],
        mono: ['var(--font-mono)'],
      },
      colors: {
        ink: 'var(--color-ink)',
        graphite: 'var(--color-graphite)',
        slate: 'var(--color-slate)',
        silver: 'var(--color-silver)',
        snow: 'var(--color-snow)',
      },
      animation: {
        'fade-in': 'fade-in 0.2s ease-in-out forwards',
        'slide-in': 'slide-in 0.2s ease-out forwards',
      },
    },
  },
  plugins: [],
}
