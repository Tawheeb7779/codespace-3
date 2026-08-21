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
        background: '#050507',
        surface: {
          DEFAULT: '#09090b',
          dim: '#050507',
          low: '#0e0e11',
          container: '#121215',
          high: '#18181b',
          highest: '#222226',
        },
        primary: {
          DEFAULT: '#ef233c',
          container: '#ef233c',
          dark: '#8d0801',
        },
        secondary: '#d90429',
        tertiary: '#ff2a2a',
        accent: '#ef233c',
        outline: {
          DEFAULT: 'rgba(255, 255, 255, 0.1)',
          variant: 'rgba(255, 255, 255, 0.05)',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Manrope', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'red-glow': '0 0 25px rgba(239, 35, 60, 0.35)',
        'red-glow-sm': '0 0 12px rgba(239, 35, 60, 0.25)',
        'red-glow-lg': '0 0 45px rgba(239, 35, 60, 0.45)',
      }
    },
  },
  plugins: [],
}
