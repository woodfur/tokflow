/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      // TokFlo Color Palette
      colors: {
        // Primary Colors
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9', // Main brand color
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        // Secondary/Accent Colors
        accent: {
          50: '#fdf4ff',
          100: '#fae8ff',
          200: '#f5d0fe',
          300: '#f0abfc',
          400: '#e879f9',
          500: '#d946ef', // Secondary brand color
          600: '#c026d3',
          700: '#a21caf',
          800: '#86198f',
          900: '#701a75',
        },
        // Neutral Colors
        neutral: {
          0: '#ffffff',
          50: '#fafafa',
          100: '#f5f5f5',
          200: '#e5e5e5',
          300: '#d4d4d4',
          400: '#a3a3a3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
          950: '#0a0a0a',
        },
        // Semantic Colors
        success: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        error: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
        },
        info: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
      },
      // Typography
      fontFamily: {
        'sans': ['Lexend', 'Inter', 'system-ui', 'sans-serif'], // Primary UI font
        'display': ['Lexend', 'Poppins', 'Inter', 'system-ui', 'sans-serif'], // Display & brand font
        'mono': ['JetBrains Mono', 'Menlo', 'Monaco', 'monospace'],
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1' }],
        '6xl': ['3.75rem', { lineHeight: '1' }],
        '7xl': ['4.5rem', { lineHeight: '1' }],
        '8xl': ['6rem', { lineHeight: '1' }],
        '9xl': ['8rem', { lineHeight: '1' }],
      },
      // Spacing & Layout
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
        '144': '36rem',
      },
      // Border Radius
      borderRadius: {
        'none': '0',
        'sm': '0.125rem',
        'DEFAULT': '0.25rem',
        'md': '0.375rem',
        'lg': '0.5rem',
        'xl': '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
        'full': '9999px',
      },
      // Shadows
      boxShadow: {
        'sm': '0 1px 1.5px 0 rgb(15 23 42 / 0.05)',
        'DEFAULT': '0 1px 2px 0 rgb(15 23 42 / 0.06), 0 1px 1px -1px rgb(15 23 42 / 0.04)',
        'md': '0 2px 6px -1px rgb(15 23 42 / 0.06), 0 1px 3px -2px rgb(15 23 42 / 0.04)',
        'lg': '0 6px 16px -4px rgb(15 23 42 / 0.08), 0 2px 6px -2px rgb(15 23 42 / 0.06)',
        'xl': '0 12px 24px -8px rgb(15 23 42 / 0.12), 0 4px 12px -6px rgb(15 23 42 / 0.06)',
        '2xl': '0 24px 48px -12px rgb(15 23 42 / 0.18)',
        'inner': 'inset 0 2px 4px 0 rgb(0 0 0 / 0.04)',
        'none': 'none',
        // Custom TokFlo shadows (softened)
        'card': '0 6px 20px -8px rgb(15 23 42 / 0.08)',
        'modal': '0 20px 40px -10px rgb(15 23 42 / 0.16)',
        'button': '0 2px 6px 0 rgb(15 23 42 / 0.08)',
      },
      // Animation & Transitions
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'bounce-gentle': 'bounceGentle 0.6s ease-in-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        bounceGentle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
      },
      // Z-index scale
      zIndex: {
        '60': '60',
        '70': '70',
        '80': '80',
        '90': '90',
        '100': '100',
      },
    },
  },
  plugins: [
    require("tailwind-scrollbar"), 
    require("tailwind-scrollbar-hide"),
    // Add custom component classes
    function({ addComponents }) {
      addComponents({
        // Button Components
        '.btn-primary': {
          '@apply bg-primary-500 hover:bg-primary-600 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 shadow-button': {},
        },
        '.btn-secondary': {
          '@apply bg-neutral-100 hover:bg-neutral-200 text-neutral-900 font-medium py-2 px-4 rounded-lg transition-colors duration-200 border border-neutral-300': {},
        },
        '.btn-accent': {
          '@apply bg-accent-500 hover:bg-accent-600 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 shadow-button': {},
        },
        '.btn-ghost': {
          '@apply bg-transparent hover:bg-neutral-100 text-neutral-700 font-medium py-2 px-4 rounded-lg transition-colors duration-200': {},
        },
        // Card Components
        '.card': {
          '@apply bg-white rounded-xl shadow-card border border-neutral-200 overflow-hidden': {},
        },
        '.card-hover': {
          '@apply card hover:shadow-lg transition-shadow duration-200': {},
        },
        // Input Components
        '.input-field': {
          '@apply w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200': {},
        },
        // Avatar Components
        '.avatar': {
          '@apply rounded-full bg-neutral-200 flex items-center justify-center overflow-hidden': {},
        },
        '.avatar-sm': {
          '@apply avatar w-8 h-8': {},
        },
        '.avatar-md': {
          '@apply avatar w-12 h-12': {},
        },
        '.avatar-lg': {
          '@apply avatar w-16 h-16': {},
        },
        // Tag/Badge Components
        '.tag': {
          '@apply inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium': {},
        },
        '.tag-primary': {
          '@apply tag bg-primary-100 text-primary-800': {},
        },
        '.tag-secondary': {
          '@apply tag bg-neutral-100 text-neutral-800': {},
        },
        '.tag-success': {
          '@apply tag bg-success-100 text-success-800': {},
        },
        '.tag-warning': {
          '@apply tag bg-warning-100 text-warning-800': {},
        },
        '.tag-error': {
          '@apply tag bg-error-100 text-error-800': {},
        },
      })
    }
  ],
};
