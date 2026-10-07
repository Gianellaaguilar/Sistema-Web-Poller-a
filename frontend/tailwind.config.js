/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fef7ee',
          100: '#fdecd6',
          200: '#fad5ac',
          300: '#f6b777',
          400: '#f18f40',
          500: '#ed721a',
          600: '#de5810',
          700: '#b84110',
          800: '#933515',
          900: '#772e14',
          950: '#401408',
        },
        accent: {
          50: '#f0fdf5',
          100: '#dcfce8',
          200: '#bbf7d1',
          300: '#86efad',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803c',
          800: '#166533',
          900: '#14532b',
        },
        dark: {
          50: '#f7f7f8',
          100: '#efeef0',
          200: '#dbd9de',
          300: '#bbb8c1',
          400: '#96919f',
          500: '#797484',
          600: '#635e6c',
          700: '#514d58',
          800: '#46424b',
          900: '#3d3a41',
          950: '#1a191c',
        }
      },
      fontFamily: {
        sans: ['Outfit', 'system-ui', 'sans-serif'],
        display: ['Archivo Black', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

