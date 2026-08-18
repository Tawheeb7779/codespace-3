/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0e131d',
        surface: {
          DEFAULT: '#0e131d',
          dim: '#0e131d',
          bright: '#343944',
          lowest: '#090e18',
          low: '#171c26',
          container: '#1b202a',
          high: '#252a35',
          highest: '#303540',
        },
        primary: {
          DEFAULT: '#3b82f6',
          glow: '#60a5fa',
          tint: '#adc6ff',
          container: '#4d8eff',
        },
        secondary: {
          DEFAULT: '#a4c9ff',
          container: '#0267b8',
        },
        tertiary: {
          DEFAULT: '#ffb786',
          container: '#df7412',
        },
        outline: {
          DEFAULT: '#8c909f',
          variant: '#424754',
          subtle: 'rgba(255, 255, 255, 0.08)',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      backdropBlur: {
        glass: '12px',
        heavy: '24px',
      }
    },
  },
  plugins: [],
}
