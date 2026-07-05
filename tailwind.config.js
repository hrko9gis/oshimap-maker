/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        dusk: {
          50: '#fdf5f0',
          100: '#f8e4d6',
          200: '#f0c6a6',
          300: '#e6a374',
          400: '#dd7f4e',
          500: '#c8613a',
          600: '#a8482c',
          700: '#833725',
          800: '#5f2a21',
          900: '#3f1f1c',
        },
      },
    },
  },
  plugins: [],
}
