import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx,mdx}'],
  darkMode: 'class',
  theme: {
    container: {
      center: true,
      padding: { DEFAULT: '1.25rem', sm: '1.5rem', lg: '2rem' },
      screens: { '2xl': '1280px' },
    },
    extend: {
      colors: {
        // Brand ramp — deep teal foundation with clinical clarity.
        brand: {
          50: '#effcfa',
          100: '#c9f5ef',
          200: '#96eae1',
          300: '#5cd8cd',
          400: '#2dbfb5',
          500: '#12a29b',
          600: '#07827e',
          700: '#0a6866',
          800: '#0d5353',
          900: '#0f4545',
          950: '#022a2b',
        },
        // Supporting blue used for information and links.
        ocean: {
          50: '#eef6ff',
          100: '#d9ebff',
          200: '#bcdcff',
          300: '#8ec6ff',
          400: '#59a5ff',
          500: '#3382fc',
          600: '#1d62f1',
          700: '#164cdd',
          800: '#183fb3',
          900: '#1a398d',
          950: '#142456',
        },
        // Violet accent for gradients and highlights.
        violetish: {
          50: '#f5f3ff',
          100: '#ece9fe',
          200: '#dbd6fe',
          300: '#c1b5fd',
          400: '#a189fa',
          500: '#8459f5',
          600: '#7337ea',
          700: '#6425d0',
          800: '#5420aa',
          900: '#461d8b',
          950: '#2a105e',
        },
        // Warm coral used sparingly for emphasis (never for body text).
        coral: {
          50: '#fff3f1',
          100: '#ffe4df',
          200: '#ffcdc4',
          300: '#ffaa9b',
          400: '#ff7a61',
          500: '#f95435',
          600: '#e6391a',
          700: '#c12b12',
          800: '#9f2714',
          900: '#842717',
          950: '#480f07',
        },
        sand: {
          50: '#fdf8ef',
          100: '#f9edd6',
          200: '#f2d8ab',
          300: '#e9bd76',
          400: '#e09f47',
          500: '#d9862c',
          600: '#c06a22',
          700: '#9f501f',
          800: '#814020',
          900: '#6a361d',
        },
        ink: {
          DEFAULT: '#0b1728',
          soft: '#3a4a60',
          muted: '#5a6b83',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'var(--font-sans)', 'Georgia', 'serif'],
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.75rem',
      },
      boxShadow: {
        card: '0 1px 2px rgba(11, 23, 40, 0.04), 0 12px 32px -12px rgba(11, 23, 40, 0.16)',
        lift: '0 2px 4px rgba(11, 23, 40, 0.05), 0 24px 48px -16px rgba(11, 23, 40, 0.24)',
        glow: '0 20px 60px -20px rgba(18, 162, 155, 0.55)',
      },
      backgroundImage: {
        'grid-fade':
          'linear-gradient(to bottom, rgba(255,255,255,0) 0%, rgba(255,255,255,1) 100%)',
      },
      keyframes: {
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        drift: {
          '0%, 100%': { transform: 'translate3d(0,0,0)' },
          '50%': { transform: 'translate3d(0,-14px,0)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.5s ease-out both',
        'accordion-down': 'accordion-down 0.22s ease-out',
        'accordion-up': 'accordion-up 0.18s ease-in',
        drift: 'drift 9s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

export default config;
