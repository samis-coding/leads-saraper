/** @type {import('tailwindcss').Config} */
import containerQueries from '@tailwindcss/container-queries';

export default {
  content: ['./src/**/*.{html,js}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Lumina — Sophisticated Dark palette (per stitch_glassmorphic_lead_suite/lumina_extension/DESIGN.md)
        primary: '#c0c1ff',
        'primary-container': '#8083ff',
        'on-primary': '#1000a9',
        secondary: '#4cd7f6',
        'secondary-container': '#03b5d3',
        'on-secondary': '#003640',
        tertiary: '#ffafd3',
        background: '#0b1326',
        'on-background': '#dae2fd',
        surface: '#0b1326',
        'surface-dim': '#0b1326',
        'surface-bright': '#31394d',
        'surface-container-lowest': '#060e20',
        'surface-container-low': '#131b2e',
        'surface-container': '#171f33',
        'surface-container-high': '#222a3d',
        'surface-container-highest': '#2d3449',
        'surface-variant': '#2d3449',
        'on-surface': '#dae2fd',
        'on-surface-variant': '#c7c4d7',
        outline: '#908fa0',
        'outline-variant': '#464554',
        error: '#ffb4ab',
        'error-container': '#93000a',
        success: '#10b981',
        warning: '#f59e0b'
      },
      borderRadius: {
        DEFAULT: '0.25rem',
        lg: '0.5rem',
        xl: '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem'
      },
      spacing: {
        unit: '4px',
        'stack-sm': '0.5rem',
        'stack-md': '1rem',
        'stack-lg': '1.5rem',
        gutter: '1rem',
        'container-padding': '1.25rem'
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        'headline-lg': ['Inter'],
        'headline-md': ['Inter'],
        'headline-sm': ['Inter'],
        'headline-lg-mobile': ['Inter'],
        'body-lg': ['Inter'],
        'body-md': ['Inter'],
        'label-md': ['Inter']
      },
      fontSize: {
        'headline-lg': ['32px', { lineHeight: '1.2', letterSpacing: '-0.02em', fontWeight: '700' }],
        'headline-md': ['24px', { lineHeight: '1.3', letterSpacing: '-0.01em', fontWeight: '600' }],
        'headline-sm': ['20px', { lineHeight: '1.4', fontWeight: '600' }],
        'headline-lg-mobile': ['26px', { lineHeight: '1.2', fontWeight: '700' }],
        'body-lg': ['16px', { lineHeight: '1.6', fontWeight: '400' }],
        'body-md': ['14px', { lineHeight: '1.5', fontWeight: '400' }],
        'label-md': ['12px', { lineHeight: '1.2', letterSpacing: '0.05em', fontWeight: '600' }]
      },
      boxShadow: {
        glass: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        'glow-cyan': '0 0 15px rgba(76, 215, 246, 0.3)',
        'glow-indigo': '0 4px 20px rgba(76, 215, 246, 0.1)'
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)', boxShadow: '0 0 0 0 rgba(76, 215, 246, 0.7)' },
          '50%': { opacity: '0.85', transform: 'scale(1.05)', boxShadow: '0 0 0 6px rgba(76, 215, 246, 0)' }
        },
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(-4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        }
      },
      animation: {
        'pulse-glow': 'pulse-glow 2s infinite ease-in-out',
        'fade-in': 'fade-in 0.25s ease-out'
      }
    },
    containers: {
      // Side panel can be dragged anywhere from ~280px (Chrome minimum) to ~520px (wide).
      // Tweak in CSS units — px is the conventional choice for fixed surface widths.
      xs: '320px',
      sm: '420px'
    }
  },
  plugins: [containerQueries]
};