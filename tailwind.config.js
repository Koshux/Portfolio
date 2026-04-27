/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './app/**/*.{vue,ts,js}',
    './content/**/*.md',
  ],
  theme: {
    extend: {
      fontFamily: {
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        'nuxt-green': '#00DC82',
        'ink-black': '#09090b', // Slightly softer than pure black (zinc-950)
        'paper-white': '#fcfcfc', // Anti-glare white
        'grid-line': 'rgba(113, 113, 122, 0.1)', // Subtle architectural grid color
      },
      backgroundImage: {
        'blueprint-grid': 'linear-gradient(to right, var(--tw-colors-grid-line) 1px, transparent 1px), linear-gradient(to bottom, var(--tw-colors-grid-line) 1px, transparent 1px)',
      },
      backgroundSize: {
        'grid-size': '24px 24px', // Creates that technical/markdown notebook feel
      }
    }
  }
}