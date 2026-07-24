import defaultTheme from 'tailwindcss/defaultTheme'

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      // Deliberate typeface, replacing the unstyled Tailwind default stack
      // (DASHBOARD-UX-2026.md §8). Inter loaded in index.html; keep the real
      // system-font stack as a fallback for the brief pre-load window.
      fontFamily: {
        sans: ['Inter', ...defaultTheme.fontFamily.sans],
      },
      colors: {
        // Accent ramp rebuilt around the marketing site's --ac (#6c63ff), which
        // becomes brand-500 exactly. The old scale was Tailwind's violet — hue
        // ~258, noticeably warmer than the site's ~243 blue-violet, so the app
        // and getbrandgeo.com never quite matched.
        //
        // Ramp holds H 243.5 / S 100% and walks lightness, so tints and shades
        // stay on the same hue line as the site's accent rather than drifting.
        //
        // Contrast checked at the two steps that carry text (index.css remaps
        // brand-500 CTA fills to -600, hover to -700):
        //   white on brand-600 #4a3fff ... 6.09:1  PASS (old violet was 5.70:1)
        //   white on brand-700 #2a1cf5 ... 8.13:1  PASS, darkens on hover
        //   brand-300 on the brand-500/15 nav tint over --dark-800 ... 7.47:1
        //   brand-400 link text on --dark-800 ....................... 6.21:1
        brand: {
          50:  '#f2f1ff',
          100: '#e5e3ff',
          200: '#ccc9ff',
          300: '#aaa4ff',
          400: '#8b83ff',
          500: '#6c63ff',   // site --ac
          600: '#4a3fff',
          700: '#2a1cf5',
          800: '#2116c9',
          900: '#1b12a3',
          950: '#100a66',
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
