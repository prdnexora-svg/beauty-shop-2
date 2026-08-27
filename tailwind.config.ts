import type { Config } from 'tailwindcss';

/**
 * NEXORA LUXE — Premium Indian B2B Beauty Marketplace theme.
 *
 * This project runs Tailwind CSS v4 (CSS-first configuration). The canonical
 * token source lives in the `@theme` block of `src/index.css`; this config is
 * loaded from there via the `@config` directive and mirrors the same tokens
 * for tooling, editor IntelliSense, and any future Tailwind v3 migration.
 */
const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        /* Brand semantic palette */
        primary: {
          DEFAULT: '#3D1E4E', // Deep Royal Purple
          foreground: '#FFFFFF',
        },
        secondary: {
          DEFAULT: '#C9A961', // Luxe Gold
          foreground: '#2A0E3F',
        },
        accent: {
          DEFAULT: '#E8D5F2', // Light Lavender
          foreground: '#3D1E4E',
        },
        background: '#FDFBF7', // Soft cream
        foreground: '#2A0E3F', // Dark purple
        muted: {
          DEFAULT: '#F5EEF8', // Light mauve
          foreground: '#6E5A7E',
        },
        card: {
          DEFAULT: '#FFFFFF',
          foreground: '#2A0E3F',
        },
        border: '#E5D4ED', // Soft purple
        input: '#E5D4ED',
        ring: '#C9A961',

        /* Status */
        success: '#10B981', // Emerald
        warning: '#F59E0B', // Amber
        destructive: '#E11D48', // Rose

        /* Royal purple scale (overrides default Tailwind purple) */
        purple: {
          50: '#F8F3FB',
          100: '#F1E7F7',
          200: '#E5D4ED',
          300: '#D4B8E4',
          400: '#B57FCF',
          500: '#9C55B8',
          600: '#8236A0',
          700: '#6B2D8C',
          800: '#4A2560',
          900: '#3D1E4E',
          950: '#2A0E3F',
        },

        /* Luxe gold scale */
        gold: {
          50: '#FBF7EC',
          100: '#F6EEDA',
          200: '#EBD9A8',
          300: '#E3C87F',
          400: '#D9B96A',
          500: '#C9A961',
          600: '#B08D45',
          700: '#8F6F35',
          bright: '#E8C547',
        },

        /* Named brand tones */
        royal: '#6B2D8C',
        ink: '#2A0E3F',
        lavender: '#E8D5F2',
        mauve: '#F5EEF8',
        cream: '#FDFBF7',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        serif: ['"Playfair Display"', 'Georgia', 'Times New Roman', 'serif'],
        display: ['"Playfair Display"', 'Georgia', 'Times New Roman', 'serif'],
        cormorant: ['"Cormorant Garamond"', 'Georgia', 'Times New Roman', 'serif'],
      },
      boxShadow: {
        luxe: '0 10px 34px -14px rgba(42, 14, 63, 0.16)',
        'luxe-lg': '0 22px 48px -16px rgba(42, 14, 63, 0.26)',
        'gold-glow': '0 12px 36px -10px rgba(201, 169, 97, 0.55)',
      },
      borderRadius: {
        luxe: '12px',
      },
      backgroundImage: {
        'luxe-gradient': 'linear-gradient(135deg, #3D1E4E 0%, #6B2D8C 50%, #C9A961 100%)',
        'royal-gradient': 'linear-gradient(135deg, #3D1E4E 0%, #54276E 60%, #3D1E4E 100%)',
        'gold-gradient': 'linear-gradient(135deg, #C9A961 0%, #E8C547 55%, #C9A961 100%)',
      },
      keyframes: {
        'gold-shimmer': {
          '0%': { backgroundPosition: '-200% 50%' },
          '100%': { backgroundPosition: '200% 50%' },
        },
      },
      animation: {
        shimmer: 'gold-shimmer 2.6s linear infinite',
      },
    },
  },
  plugins: [],
};

export default config;
