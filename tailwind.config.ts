// tailwind.config.ts
import type { Config } from 'tailwindcss';
import { fontFamily } from 'tailwindcss/defaultTheme';

/**
 * Tailwind CSS configuration using the "class" strategy for shadcn/ui.
 * Includes dark mode support via class strategy and custom color palette.
 */
const config: Config = {
  darkMode: 'class',
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './app/**/*.{js,ts,jsx,tsx}',
    './pages/**/*.{js,ts,jsx,tsx}',
    './node_modules/@radix-ui/**/*.{js,ts,jsx,tsx}',
    './node_modules/shadcn-ui/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', ...fontFamily.sans],
      },
      colors: {
        primary: {
          DEFAULT: 'hsl(220, 90%, 56%)',
          50: 'hsl(220, 90%, 96%)',
          100: 'hsl(220, 90%, 90%)',
          200: 'hsl(220, 90%, 80%)',
          300: 'hsl(220, 90%, 70%)',
          400: 'hsl(220, 90%, 60%)',
          500: 'hsl(220, 90%, 50%)',
          600: 'hsl(220, 90%, 40%)',
          700: 'hsl(220, 90%, 30%)',
          800: 'hsl(220, 90%, 20%)',
          900: 'hsl(220, 90%, 10%)',
        },
        danger: {
          DEFAULT: 'hsl(0, 78%, 56%)',
        },
        success: {
          DEFAULT: 'hsl(120, 70%, 45%)',
        },
        warning: {
          DEFAULT: 'hsl(45, 90%, 55%)',
        },
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
