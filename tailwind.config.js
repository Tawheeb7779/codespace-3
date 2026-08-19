/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: '#0e131d',
        surface: {
          DEFAULT: '#171c26',
          dim: '#0e131d',
          low: '#171c26',
          container: '#1b202a',
          high: '#252a35',
          highest: '#303540',
        },
        primary: {
          DEFAULT: '#adc6ff',
          container: '#4d8eff',
          dark: '#002e6a',
        },
        secondary: '#a4c9ff',
        tertiary: '#ffb786',
        accent: '#6366f1',
        outline: {
          DEFAULT: '#8c909f',
          variant: '#424754',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
