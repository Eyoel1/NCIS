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
        brand: {
          50: '#f0f7ff',
          100: '#e0effe',
          200: '#bae0fd',
          300: '#7cc7fb',
          400: '#36abf7',
          500: '#0c8ee9',
          600: '#0270c7',
          700: '#0359a1',
          800: '#074b84',
          900: '#0c3f6e',
          950: '#082849', // Deep navy primary brand
        },
        navy: {
          800: 'rgb(var(--color-navy-800) / <alpha-value>)',
          850: 'rgb(var(--color-navy-850) / <alpha-value>)',
          900: 'rgb(var(--color-navy-900) / <alpha-value>)',
          950: 'rgb(var(--color-navy-950) / <alpha-value>)',
        },
        slate: {
          50: 'rgb(var(--color-slate-50) / <alpha-value>)',
          100: 'rgb(var(--color-slate-100) / <alpha-value>)',
          200: 'rgb(var(--color-slate-200) / <alpha-value>)',
          300: 'rgb(var(--color-slate-300) / <alpha-value>)',
          400: 'rgb(var(--color-slate-400) / <alpha-value>)',
          500: 'rgb(var(--color-slate-500) / <alpha-value>)',
          600: 'rgb(var(--color-slate-600) / <alpha-value>)',
          700: 'rgb(var(--color-slate-700) / <alpha-value>)',
          800: 'rgb(var(--color-slate-800) / <alpha-value>)',
          850: 'rgb(var(--color-slate-850) / <alpha-value>)',
          900: 'rgb(var(--color-slate-900) / <alpha-value>)',
          950: 'rgb(var(--color-slate-950) / <alpha-value>)',
        },
        status: {
          cleared: '#10b981',
          clearedBg: 'rgba(16, 185, 129, 0.12)',
          pending: '#f59e0b',
          pendingBg: 'rgba(245, 158, 11, 0.12)',
          disputed: '#f43f5e',
          disputedBg: 'rgba(244, 63, 94, 0.12)',
          maritime: '#0ea5e9',
          maritimeBg: 'rgba(14, 165, 233, 0.12)',
          financial: '#8b5cf6',
          financialBg: 'rgba(139, 92, 246, 0.12)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Noto Sans Ethiopic', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        amharic: ['Noto Sans Ethiopic', 'Abyssinica SIL', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
