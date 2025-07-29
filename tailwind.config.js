/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Custom dark theme colors - exact values as specified
        primary: '#15161B',      // Main dark background
        secondary: '#181B22',    // Cards/containers
        accent: '#86EFAC',       // Bright mint green - buttons/highlights
        
        // Text colors
        'text-primary': '#FAFCFB',    // Main text (off-white)
        'text-secondary': '#9FA3AC',  // Secondary text (light gray)  
        'text-on-accent': '#00001C',  // Text on green buttons (dark)
        
        // Border colors
        'border-primary': '#39414E',  // Default borders/dividers
        
        // Status colors (enhanced for dark theme)
        success: {
          50: '#ECFDF5',
          100: '#D1FAE5',
          400: '#34D399',
          500: '#10B981',
          600: '#059669',
          700: '#047857',
          800: '#065F46',
          900: '#064E3B',
        },
        error: {
          50: '#FEF2F2',
          100: '#FEE2E2',
          400: '#F87171',
          500: '#EF4444',
          600: '#DC2626',
          700: '#B91C1C',
          800: '#991B1B',
          900: '#7F1D1D',
        },
        warning: {
          50: '#FFFBEB',
          100: '#FEF3C7',
          400: '#FBBF24',
          500: '#F59E0B',
          600: '#D97706',
          700: '#B45309',
          800: '#92400E',
          900: '#78350F',
        },
        info: {
          50: '#EFF6FF',
          100: '#DBEAFE',
          400: '#60A5FA',
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1D4ED8',
          800: '#1E40AF',
          900: '#1E3A8A',
        },
        // Override default grays to match our theme
        gray: {
          50: '#181B22',   // Light elements in dark theme
          100: '#39414E',  // Borders
          200: '#39414E',  // Borders
          300: '#39414E',  // Borders
          400: '#9FA3AC',  // Secondary text
          500: '#9FA3AC',  // Secondary text
          600: '#9FA3AC',  // Secondary text
          700: '#FAFCFB',  // Primary text
          800: '#FAFCFB',  // Primary text
          900: '#FAFCFB',  // Primary text
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', 'monospace'],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'pulse-soft': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-soft': 'bounce 1s infinite',
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
        'dark-xl': '0 20px 40px rgba(0, 0, 0, 0.5)',
      },
      backdropBlur: {
        xs: '2px',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
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
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.75rem' }],
      },
      lineHeight: {
        '12': '3rem',
      },
      letterSpacing: {
        'extra-wide': '0.2em',
      },
      aspectRatio: {
        '4/3': '4 / 3',
        '3/2': '3 / 2',
        '2/3': '2 / 3',
        '9/16': '9 / 16',
      },
    },
  },
  plugins: [
    // Custom plugin for dark theme utilities
    function({ addUtilities, theme, addBase }) {
      // Add base styles that force dark theme
      addBase({
        'html': {
          backgroundColor: '#15161B',
          color: '#FAFCFB',
        },
        'body': {
          backgroundColor: '#15161B',
          color: '#FAFCFB',
        },
        '#root': {
          backgroundColor: '#15161B',
          color: '#FAFCFB',
        },
      });

      // Add custom utilities
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
        '.gradient-radial': {
          background: 'radial-gradient(circle at center, #181B22 0%, #15161B 100%)',
        },
        '.text-gradient': {
          background: 'linear-gradient(135deg, #86EFAC 0%, #4ADE80 100%)',
          '-webkit-background-clip': 'text',
          '-webkit-text-fill-color': 'transparent',
          'background-clip': 'text',
        },
        '.border-gradient': {
          border: '1px solid transparent',
          'background-image': 'linear-gradient(#181B22, #181B22), linear-gradient(135deg, #86EFAC, #4ADE80)',
          'background-origin': 'border-box',
          'background-clip': 'content-box, border-box',
        },
        '.shadow-accent-glow': {
          'box-shadow': '0 0 20px rgba(134, 239, 172, 0.3)',
        },
        '.hover-lift': {
          transition: 'transform 0.2s ease-in-out',
          '&:hover': {
            transform: 'translateY(-2px)',
          },
        },
        '.hover-scale': {
          transition: 'transform 0.2s ease-in-out',
          '&:hover': {
            transform: 'scale(1.05)',
          },
        },
        '.focus-ring-accent': {
          '&:focus': {
            outline: '2px solid #86EFAC',
            'outline-offset': '2px',
          },
        },
        '.container-cannabis': {
          width: '100%',
          'max-width': '80rem',
          'margin-left': 'auto',
          'margin-right': 'auto',
          'padding-left': '1rem',
          'padding-right': '1rem',
          '@screen sm': {
            'padding-left': '1.5rem',
            'padding-right': '1.5rem',
          },
          '@screen lg': {
            'padding-left': '2rem',
            'padding-right': '2rem',
          },
        },
        '.glass-dark': {
          background: 'rgba(24, 27, 34, 0.8)',
          'backdrop-filter': 'blur(12px)',
          'border': '1px solid rgba(57, 65, 78, 0.5)',
        },
        '.card-dark': {
          background: '#181B22',
          border: '1px solid #39414E',
          'border-radius': '0.75rem',
          padding: '1.5rem',
          'box-shadow': '0 4px 6px rgba(0, 0, 0, 0.1)',
        },
        '.btn-dark': {
          'background-color': '#181B22',
          color: '#FAFCFB',
          border: '1px solid #39414E',
          padding: '0.5rem 1rem',
          'border-radius': '0.5rem',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            'background-color': '#39414E',
          },
        },
        '.btn-accent': {
          'background-color': '#86EFAC',
          color: '#00001C',
          border: '1px solid #86EFAC',
          padding: '0.5rem 1rem',
          'border-radius': '0.5rem',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            opacity: '0.9',
          },
        },
        '.input-dark': {
          'background-color': '#181B22',
          color: '#FAFCFB',
          border: '1px solid #39414E',
          padding: '0.5rem 0.75rem',
          'border-radius': '0.5rem',
          '&:focus': {
            'border-color': '#86EFAC',
            'box-shadow': '0 0 0 2px rgba(134, 239, 172, 0.2)',
            outline: 'none',
          },
          '&::placeholder': {
            color: '#9FA3AC',
          },
        },
        '.table-dark': {
          'background-color': '#181B22',
          color: '#FAFCFB',
          '& thead': {
            'background-color': '#15161B',
          },
          '& th': {
            'border-color': '#39414E',
            color: '#9FA3AC',
          },
          '& td': {
            'border-color': '#39414E',
            color: '#FAFCFB',
          },
        },
      }
      
      addUtilities(newUtilities)
    },
    // Custom plugin for component classes
    function({ addComponents, theme }) {
      addComponents({
        '.card': {
          'background-color': '#181B22',
          border: '1px solid #39414E',
          color: '#FAFCFB',
          'border-radius': theme('borderRadius.xl'),
          padding: theme('spacing.6'),
          'box-shadow': theme('boxShadow.sm'),
        },
        '.btn': {
          display: 'inline-flex',
          'align-items': 'center',
          'justify-content': 'center',
          padding: `${theme('spacing.2')} ${theme('spacing.4')}`,
          border: '1px solid transparent',
          'font-size': theme('fontSize.sm'),
          'font-weight': theme('fontWeight.medium'),
          'border-radius': theme('borderRadius.lg'),
          'box-shadow': theme('boxShadow.sm'),
          transition: 'all 0.2s ease-in-out',
          cursor: 'pointer',
          '&:focus': {
            outline: '2px solid #86EFAC',
            'outline-offset': '2px',
          },
          '&:disabled': {
            opacity: '0.5',
            cursor: 'not-allowed',
          },
        },
        '.btn-primary': {
          'background-color': '#86EFAC',
          color: '#00001C',
          'border-color': '#86EFAC',
          '&:hover:not(:disabled)': {
            opacity: '0.9',
          },
        },
        '.btn-secondary': {
          'background-color': '#181B22',
          color: '#FAFCFB',
          'border-color': '#39414E',
          '&:hover:not(:disabled)': {
            'background-color': '#39414E',
          },
        },
        '.input': {
          display: 'block',
          width: '100%',
          padding: `${theme('spacing.2')} ${theme('spacing.3')}`,
          'background-color': '#181B22',
          border: '1px solid #39414E',
          color: '#FAFCFB',
          'border-radius': theme('borderRadius.lg'),
          'box-shadow': theme('boxShadow.sm'),
          transition: 'all 0.2s ease-in-out',
          '&:focus': {
            outline: 'none',
            'border-color': '#86EFAC',
            'box-shadow': '0 0 0 2px rgba(134, 239, 172, 0.2)',
          },
          '&::placeholder': {
            color: '#9FA3AC',
          },
        },
      })
    },
  ],
  // Force dark mode
  darkMode: ['class', '[data-theme="dark"]'],
  // Ensure proper CSS custom properties
  corePlugins: {
    // Enable all core plugins
    preflight: true,
  },
}