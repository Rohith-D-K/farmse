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
        // Legacy
        primary: "#2D7A4F",
        secondary: "#f0fdf4",
        // Farmse design system
        'farmse-green':   '#2D7A4F',
        'farmse-green-dark': '#1A5C3A',
        'farmse-green-light': '#E8F5EE',
        'farmse-amber':   '#F5A623',
        'farmse-amber-light': '#FFF3DC',
        'farmse-surface': '#F9F6F0',
        'farmse-dark':    '#1A2E1F',
        'farmse-card':    '#FFFFFF',
        'farmse-muted':   '#7A8C7E',
      },
      fontFamily: {
        'display': ['"Fraunces"', 'Georgia', 'serif'],
        'body':    ['"DM Sans"', 'system-ui', 'sans-serif'],
        sans:      ['"DM Sans"', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'pill': '20px',
        'card': '16px',
        'card-sm': '12px',
      },
      boxShadow: {
        'card': '0 4px 16px rgba(0,0,0,0.06)',
        'card-hover': '0 8px 28px rgba(0,0,0,0.10)',
        'nav': '0 -4px 24px rgba(45,122,79,0.08)',
      },
      animation: {
        'stagger-in': 'stagger-enter 0.28s ease-out both',
        'shimmer': 'shimmer 1.6s infinite linear',
        'pulse-dot': 'pulse-dot 1.6s infinite ease-in-out',
        'slide-up': 'slideUp 0.3s cubic-bezier(0.16,1,0.3,1) forwards',
        'fade-in': 'fadeIn 0.4s ease-out forwards',
      },
      keyframes: {
        'stagger-enter': {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'pulse-dot': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(45,122,79,0.4)' },
          '50%':      { boxShadow: '0 0 0 8px rgba(45,122,79,0)' },
        },
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          from: { transform: 'translateY(100%)' },
          to:   { transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
