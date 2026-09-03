import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        // Incossify Africa — Purple & White palette
        ink: '#1A0533',        // deep violet — headings, primary text
        brand: {
          50: '#FBEAFC',
          100: '#F3CEF7',
          200: '#E59FEF',
          300: '#D66FE6',
          400: '#C33ED9',
          500: '#9D0EB3',      // primary purple
          600: '#7E0B8F',
          700: '#61086C',
          800: '#45064C',
          900: '#2C0330'
        },
        sky: '#C33ED9',        // orchid accent — rewards / positive states
        frost: '#F9F4FF',      // app background tint
        mist: 'rgba(255,255,255,0.6)'
      },
      fontFamily: {
        display: ['var(--font-sora)', 'sans-serif'],
        body: ['var(--font-inter)', 'sans-serif']
      },
      backdropBlur: {
        xs: '2px'
      },
      boxShadow: {
        glass: '0 8px 32px rgba(26, 5, 51, 0.12)',
        card: '0 2px 16px rgba(26, 5, 51, 0.08)'
      },
      borderRadius: {
        '2xl': '1.25rem',
        '3xl': '1.75rem'
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' }
        }
      },
      animation: {
        'fade-up': 'fade-up 0.4s ease-out both',
        shimmer: 'shimmer 1.6s linear infinite'
      }
    }
  },
  plugins: []
};

export default config;
