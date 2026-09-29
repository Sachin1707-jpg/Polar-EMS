/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Dark polar theme colors
        dark: {
          bg: '#0a0e1a',       // Deep space background
          card: '#141b2d',     // Card background
          surface: '#1a2235',  // Surface elements
          border: '#2d3748',   // Borders
          hover: '#1e2a3f',    // Hover states
          accent: '#2a3f5f',   // Accent elements
        },
        // Polar brand colors
        polar: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
          950: '#082f49',
        },
        // Status colors
        status: {
          critical: '#ef4444',
          warning: '#f59e0b',
          info: '#3b82f6',
          success: '#10b981',
          normal: '#6b7280',
        },
        // Functional colors
        renewable: '#10b981',
        diesel: '#f59e0b',
        battery: '#3b82f6',
        load: '#8b5cf6',
      },
      backgroundImage: {
        'gradient-polar': 'linear-gradient(135deg, #0a0e1a 0%, #141b2d 50%, #1a2235 100%)',
        'gradient-card': 'linear-gradient(135deg, #141b2d 0%, #1a2235 100%)',
        'gradient-accent': 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.5)',
        'card-hover': '0 4px 6px -1px rgba(0, 0, 0, 0.5)',
        'glow-sm': '0 0 10px rgba(14, 165, 233, 0.3)',
        'glow-md': '0 0 20px rgba(14, 165, 233, 0.4)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '112': '28rem',
        '128': '32rem',
      },
    },
  },
  plugins: [],
}
