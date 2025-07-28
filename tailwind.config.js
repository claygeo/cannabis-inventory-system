/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Custom dark theme colors
        primary: '#15161B',      // Main dark background
        secondary: '#181B22',    // Cards/containers
        accent: '#86EFAC',       // Bright mint green - buttons/highlights
        
        // Text colors
        'text-primary': '#FAFCFB',    // Main text (off-white)
        'text-secondary': '#9FA3AC',  // Secondary text (light gray)  
        'text-on-accent': '#00001C',  // Text on green buttons (dark)
        
        // Border colors
        'border-primary': '#39414E',  // Default borders/dividers
        
        // Status colors (enhanced)
        success: {
          50: '#ECFDF5',
          100: '#D1FAE5',
          500: '#10B981',
          600: '#059669',
          700: '#047857',
        },
        error: {
          50: '#FEF2F2',
          100: '#FEE2E2',
          500: '#EF4444',
          600: '#DC2626',
          700: '#B91C1C',
        },
        warning: {
          50: '#FFFBEB',
          100: '#FEF3C7',
          500: '#F59E0B',
          600: '#D97706',
          700: '#B45309',
        },
        info: {
          50: '#EFF6FF',
          100: '#DBEAFE',
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1D4ED8',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'pulse-soft': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      boxShadow: {
        'accent': '0 0 0 1px #86EFAC, 0 10px 25px rgba(134, 239, 172, 0.1)',
        'accent-lg': '0 0 0 2px #86EFAC, 0 20px 40px rgba(134, 239, 172, 0.15)',
        'dark': '0 4px 6px rgba(0, 0, 0, 0.3)',
        'dark-lg': '0 10px 25px rgba(0, 0, 0, 0.4)',
      },
      backdropBlur: {
        xs: '2px',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      maxWidth: {
        '8xl': '88rem',
        '9xl': '96rem',
      },
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
    // Form plugin for better form styling
    require('@tailwindcss/forms')({
      strategy: 'class',
    }),
    
    // Typography plugin for rich text content
    require('@tailwindcss/typography'),
    
    // Custom plugin for dark theme utilities
    function({ addUtilities, theme }) {
      const newUtilities = {
        '.bg-primary': {
          backgroundColor: '#15161B',
        },
        '.bg-secondary': {
          backgroundColor: '#181B22',
        },
        '.bg-accent': {
          backgroundColor: '#86EFAC',
        },
        '.text-primary': {
          color: '#FAFCFB',
        },
        '.text-secondary': {
          color: '#9FA3AC',
        },
        '.text-on-accent': {
          color: '#00001C',
        },
        '.border-border-primary': {
          borderColor: '#39414E',
        },
        '.scrollbar-dark': {
          '&::-webkit-scrollbar': {
            width: '8px',
            height: '8px',
          },
          '&::-webkit-scrollbar-track': {
            background: '#15161B',
          },
          '&::-webkit-scrollbar-thumb': {
            background: '#39414E',
            borderRadius: '4px',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            background: '#9FA3AC',
          },
        },
        '.gradient-accent': {
          background: 'linear-gradient(135deg, #86EFAC 0%, #4ADE80 100%)',
        },
        '.gradient-dark': {
          background: 'linear-gradient(135deg, #15161B 0%, #181B22 100%)',
        },
      }
      
      addUtilities(newUtilities)
    },
  ],
  // Ensure dark mode is always applied
  darkMode: 'class',
}