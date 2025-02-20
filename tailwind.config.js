/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#3B82F6',
          light: '#60A5FA',
          dark: '#2563EB',
        },
        background: {
          DEFAULT: '#121212',
          light: '#ffffff',
        },
        'text-primary': {
          DEFAULT: '#1F2937',
          light: '#111827',
        },
        'text-secondary': {
          DEFAULT: '#6B7280',
          light: '#4B5563',
        },
      },
      animation: {
        'slideWidth': 'slideWidth 2s ease-in-out infinite alternate',
        'marquee': 'marquee 15s linear infinite',
        'fade-in': 'fade-in 0.5s ease-out',
        'fade-in-delay': 'fadeIn 1s ease-in 0.5s forwards',
        'fade-in-once': 'fadeIn 1s ease-in forwards',
        'fade-in-delay-once': 'fadeIn 1s ease-in 0.5s forwards',
        'progress-indeterminate': 'progress-indeterminate 1s ease-in-out infinite',
        'logo-line': 'logo-line 3s ease-in-out infinite',
        'fadeIn': 'fadeIn 0.5s ease-in forwards',
        'shine': 'shine 2s linear infinite',
        'pulse-slow': 'pulse-slow 4s ease-in-out infinite',
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' }
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        fadeOut: {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        'progress-indeterminate': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' }
        },
        'logo-line': {
          '0%': { transform: 'translateX(-200%)' },
          '50%': { transform: 'translateX(200%)' },
          '100%': { transform: 'translateX(-200%)' }
        },
        'shine': {
          '0%': { left: '-100%' },
          '100%': { left: '200%' }
        },
        'pulse-slow': {
          '0%, 100%': { opacity: '0.1' },
          '50%': { opacity: '0.3' }
        },
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        }
      }
    },
  },
  plugins: [],
} 