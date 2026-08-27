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

      /* Neutral scales — purple-tinted luxe neutrals
         (gray-100 → cream, gray-200 → soft purple, gray-600 → muted plum,
          gray-800 → dark purple; mirrored across stone/zinc/neutral/slate) */
      gray: {
        50: '#FAF7F2',
        100: '#FDFBF7',
        200: '#E5D4ED',
        300: '#D6C3E4',
        400: '#AC9CBB',
        500: '#8A7A9C',
        600: '#6B4D7A',
        700: '#54406A',
        800: '#2A0E3F',
        900: '#241531',
        950: '#1A0D24',
      },
      stone: {
        50: '#FAF7F2',
        100: '#FDFBF7',
        200: '#E5D4ED',
        300: '#D6C3E4',
        400: '#AC9CBB',
        500: '#8A7A9C',
        600: '#6B4D7A',
        700: '#54406A',
        800: '#2A0E3F',
        900: '#241531',
        950: '#1A0D24',
      },
      zinc: {
        50: '#FAF7F2',
        100: '#FDFBF7',
        200: '#E5D4ED',
        300: '#D6C3E4',
        400: '#AC9CBB',
        500: '#8A7A9C',
        600: '#6B4D7A',
        700: '#54406A',
        800: '#2A0E3F',
        900: '#241531',
        950: '#1A0D24',
      },
      neutral: {
        50: '#FAF7F2',
        100: '#FDFBF7',
        200: '#E5D4ED',
        300: '#D6C3E4',
        400: '#AC9CBB',
        500: '#8A7A9C',
        600: '#6B4D7A',
        700: '#54406A',
        800: '#2A0E3F',
        900: '#241531',
        950: '#1A0D24',
      },
      slate: {
        50: '#FAF7F2',
        100: '#FDFBF7',
        200: '#E5D4ED',
        300: '#D6C3E4',
        400: '#AC9CBB',
        500: '#8A7A9C',
        600: '#6B4D7A',
        700: '#54406A',
        800: '#2A0E3F',
        900: '#241531',
        950: '#1A0D24',
      },

      /* Yellow scale → luxe gold family (yellow-400 → #C9A961) */
      yellow: {
        50: '#FBF7EC',
        100: '#F6EEDA',
        200: '#EBD9A8',
        300: '#E3C87F',
        400: '#C9A961',
        500: '#B08D45',
        600: '#8F6F35',
        700: '#7A5E2D',
        800: '#5F4A23',
        900: '#46361A',
        950: '#2E2311',
      },

      /* Royal purple scale (overrides default Tailwind purple) */
      purple: {
        50: '#F5EEF8',
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
        /* shadow-md re-tuned to the luxe ambient shadow per brand table */
        md: '0 8px 30px rgba(61, 30, 78, 0.12)',
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
