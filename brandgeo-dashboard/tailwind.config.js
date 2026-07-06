/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#edfafa',
          100: '#d5f5f6',
          200: '#afe8ec',
          300: '#76d4dc',
          400: '#3ab8c4',
          500: '#1f9baa',
          600: '#1b7d8e',
          700: '#1c6474',
          800: '#1e5060',
          900: '#1d4251',
          950: '#0e2a36',
        },
        dark: {
          900: 'rgb(var(--dark-900) / <alpha-value>)',
          800: 'rgb(var(--dark-800) / <alpha-value>)',
          700: 'rgb(var(--dark-700) / <alpha-value>)',
          600: 'rgb(var(--dark-600) / <alpha-value>)',
        },
      },
    },
  },
  plugins: [],
}
