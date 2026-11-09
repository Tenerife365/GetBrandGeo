import defaultTheme from 'tailwindcss/defaultTheme'

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      // Deliberate typeface, replacing the unstyled Tailwind default stack
      // (DASHBOARD-UX-2026.md section 8). Inter loaded in index.html; keep the real
      // system-font stack as a fallback for the brief pre-load window.
      fontFamily: {
        sans: ['Inter', ...defaultTheme.fontFamily.sans],
      },
      colors: {
        // Semantic tokens (docs/design/phase3-visual/phase3-visual-spec.md 4.8).
        // Every value reads a CSS triplet declared in src/index.css under :root
        // and html.light, so one class is correct in both themes.
        canvas: 'rgb(var(--canvas) / <alpha-value>)',
        surface: {
          DEFAULT: 'rgb(var(--surface) / <alpha-value>)',
          2: 'rgb(var(--surface-2) / <alpha-value>)',
          3: 'rgb(var(--surface-3) / <alpha-value>)',
        },
        line: {
          DEFAULT: 'rgb(var(--line) / <alpha-value>)',
          2: 'rgb(var(--line-2) / <alpha-value>)',
        },
        edge: 'rgb(var(--edge) / <alpha-value>)',
        ink: {
          DEFAULT: 'rgb(var(--ink) / <alpha-value>)',
          2: 'rgb(var(--ink-2) / <alpha-value>)',
          3: 'rgb(var(--ink-3) / <alpha-value>)',
        },
        accent: {
          DEFAULT: 'rgb(var(--accent) / <alpha-value>)',
          strong: 'rgb(var(--accent-strong) / <alpha-value>)',
          'strong-hover': 'rgb(var(--accent-strong-hover) / <alpha-value>)',
          ink: 'rgb(var(--accent-ink) / <alpha-value>)',
          tint: 'rgb(var(--accent-tint) / <alpha-value>)',
        },
        'on-accent': 'rgb(var(--on-accent) / <alpha-value>)',
        pos: {
          DEFAULT: 'rgb(var(--pos) / <alpha-value>)',
          ink: 'rgb(var(--pos-ink) / <alpha-value>)',
          tint: 'rgb(var(--pos-tint) / <alpha-value>)',
        },
        neu: 'rgb(var(--neu) / <alpha-value>)',
        neg: {
          DEFAULT: 'rgb(var(--neg) / <alpha-value>)',
          tint: 'rgb(var(--neg-tint) / <alpha-value>)',
        },
        warn: {
          DEFAULT: 'rgb(var(--warn) / <alpha-value>)',
          tint: 'rgb(var(--warn-tint) / <alpha-value>)',
        },
        // Legacy scales stay until commit B retires every caller.
        brand: {
          50:  '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
          950: '#2e1065',
        },
        dark: {
          900: 'rgb(var(--dark-900) / <alpha-value>)',
          800: 'rgb(var(--dark-800) / <alpha-value>)',
          700: 'rgb(var(--dark-700) / <alpha-value>)',
          600: 'rgb(var(--dark-600) / <alpha-value>)',
        },
      },
      boxShadow: {
        card: 'var(--shadow-card)',
        raised: 'var(--shadow-raised)',
      },
      borderRadius: {
        card: '12px',
        control: '8px',
        badge: '6px',
      },
      // One weight ceiling (spec 4.8): bold, extrabold and black all render 600.
      fontWeight: {
        bold: '600',
        extrabold: '600',
        black: '600',
      },
      // Six type roles (spec 4.8). Page code never sets a raw text size.
      fontSize: {
        display: ['48px', { lineHeight: '52px', letterSpacing: '-0.02em', fontWeight: '600' }],
        'display-sm': ['40px', { lineHeight: '44px', letterSpacing: '-0.02em', fontWeight: '600' }],
        title: ['24px', { lineHeight: '32px', letterSpacing: '-0.01em', fontWeight: '600' }],
        'title-sm': ['22px', { lineHeight: '30px', letterSpacing: '-0.01em', fontWeight: '600' }],
        value: ['20px', { lineHeight: '28px', fontWeight: '600' }],
        answer: ['20px', { lineHeight: '28px', fontWeight: '500' }],
        'answer-sm': ['18px', { lineHeight: '26px', fontWeight: '500' }],
        heading: ['15px', { lineHeight: '22px', fontWeight: '600' }],
        body: ['14px', { lineHeight: '20px' }],
        meta: ['12px', { lineHeight: '16px', letterSpacing: '0.01em', fontWeight: '500' }],
      },
      // Legacy colour-utility bridge (spec 4.6). Keys with a slash are matched
      // exactly before Tailwind parses an opacity modifier. Each reads a --br-*
      // variable declared in both themes in src/index.css, so the html.light
      // !important remaps there become redundant. Generated from those remaps;
      // deleted with them in commit B.
      textColor: {
        white: 'rgb(var(--br-text-white) / <alpha-value>)',
        slate: {
          '100': 'rgb(var(--br-text-slate-100) / <alpha-value>)',
          '200': 'rgb(var(--br-text-slate-200) / <alpha-value>)',
          '300': 'rgb(var(--br-text-slate-300) / <alpha-value>)',
          '400': 'rgb(var(--br-text-slate-400) / <alpha-value>)',
          '500': 'rgb(var(--br-text-slate-500) / <alpha-value>)',
          '600': 'rgb(var(--br-text-slate-600) / <alpha-value>)',
          '400/80': 'var(--br-text-slate-400-80)',
        },
        brand: {
          '100': 'rgb(var(--br-text-brand-100) / <alpha-value>)',
          '200': 'rgb(var(--br-text-brand-200) / <alpha-value>)',
          '300': 'rgb(var(--br-text-brand-300) / <alpha-value>)',
          '400': 'rgb(var(--br-text-brand-400) / <alpha-value>)',
        },
        emerald: {
          '300': 'rgb(var(--br-text-emerald-300) / <alpha-value>)',
          '400': 'rgb(var(--br-text-emerald-400) / <alpha-value>)',
          '500': 'rgb(var(--br-text-emerald-500) / <alpha-value>)',
          '500/70': 'var(--br-text-emerald-500-70)',
          '400/90': 'var(--br-text-emerald-400-90)',
          '400/80': 'var(--br-text-emerald-400-80)',
        },
        red: {
          '200': 'rgb(var(--br-text-red-200) / <alpha-value>)',
          '300': 'rgb(var(--br-text-red-300) / <alpha-value>)',
          '400': 'rgb(var(--br-text-red-400) / <alpha-value>)',
          '500': 'rgb(var(--br-text-red-500) / <alpha-value>)',
          '400/90': 'var(--br-text-red-400-90)',
          '400/70': 'var(--br-text-red-400-70)',
          '500/70': 'var(--br-text-red-500-70)',
          '500/60': 'var(--br-text-red-500-60)',
          '300/70': 'var(--br-text-red-300-70)',
        },
        amber: {
          '100': 'rgb(var(--br-text-amber-100) / <alpha-value>)',
          '200': 'rgb(var(--br-text-amber-200) / <alpha-value>)',
          '300': 'rgb(var(--br-text-amber-300) / <alpha-value>)',
          '400': 'rgb(var(--br-text-amber-400) / <alpha-value>)',
          '600': 'rgb(var(--br-text-amber-600) / <alpha-value>)',
          '400/80': 'var(--br-text-amber-400-80)',
          '400/90': 'var(--br-text-amber-400-90)',
          '300/80': 'var(--br-text-amber-300-80)',
          '500/70': 'var(--br-text-amber-500-70)',
          '200/70': 'var(--br-text-amber-200-70)',
          '200/90': 'var(--br-text-amber-200-90)',
        },
        blue: {
          '300': 'rgb(var(--br-text-blue-300) / <alpha-value>)',
          '400': 'rgb(var(--br-text-blue-400) / <alpha-value>)',
        },
        purple: {
          '300': 'rgb(var(--br-text-purple-300) / <alpha-value>)',
        },
        cyan: {
          '300': 'rgb(var(--br-text-cyan-300) / <alpha-value>)',
          '400': 'rgb(var(--br-text-cyan-400) / <alpha-value>)',
        },
        sky: {
          '300': 'rgb(var(--br-text-sky-300) / <alpha-value>)',
          '400': 'rgb(var(--br-text-sky-400) / <alpha-value>)',
        },
        pink: {
          '300': 'rgb(var(--br-text-pink-300) / <alpha-value>)',
        },
        teal: {
          '300': 'rgb(var(--br-text-teal-300) / <alpha-value>)',
        },
        indigo: {
          '300': 'rgb(var(--br-text-indigo-300) / <alpha-value>)',
        },
        violet: {
          '300': 'rgb(var(--br-text-violet-300) / <alpha-value>)',
          '400': 'rgb(var(--br-text-violet-400) / <alpha-value>)',
        },
        orange: {
          '200': 'rgb(var(--br-text-orange-200) / <alpha-value>)',
          '300': 'rgb(var(--br-text-orange-300) / <alpha-value>)',
          '300/90': 'var(--br-text-orange-300-90)',
        },
        rose: {
          '300': 'rgb(var(--br-text-rose-300) / <alpha-value>)',
          '400': 'rgb(var(--br-text-rose-400) / <alpha-value>)',
        },
      },
      backgroundColor: {
        brand: {
          '500/8': 'var(--br-bg-brand-500-8)',
          '500/10': 'var(--br-bg-brand-500-10)',
          '500/15': 'var(--br-bg-brand-500-15)',
          '500/20': 'var(--br-bg-brand-500-20)',
        },
        emerald: {
          '500/5': 'var(--br-bg-emerald-500-5)',
          '500/10': 'var(--br-bg-emerald-500-10)',
          '400/10': 'var(--br-bg-emerald-400-10)',
          '500/15': 'var(--br-bg-emerald-500-15)',
          '500/20': 'var(--br-bg-emerald-500-20)',
        },
        red: {
          '500/5': 'var(--br-bg-red-500-5)',
          '500/10': 'var(--br-bg-red-500-10)',
          '400/10': 'var(--br-bg-red-400-10)',
          '500/15': 'var(--br-bg-red-500-15)',
          '500/20': 'var(--br-bg-red-500-20)',
        },
        amber: {
          '500/10': 'var(--br-bg-amber-500-10)',
          '400/10': 'var(--br-bg-amber-400-10)',
          '500/15': 'var(--br-bg-amber-500-15)',
          '500/20': 'var(--br-bg-amber-500-20)',
        },
        blue: {
          '500/20': 'var(--br-bg-blue-500-20)',
        },
        purple: {
          '500/20': 'var(--br-bg-purple-500-20)',
        },
        sky: {
          '500/20': 'var(--br-bg-sky-500-20)',
        },
        pink: {
          '500/20': 'var(--br-bg-pink-500-20)',
        },
        teal: {
          '500/20': 'var(--br-bg-teal-500-20)',
        },
        indigo: {
          '500/20': 'var(--br-bg-indigo-500-20)',
        },
        violet: {
          '500/20': 'var(--br-bg-violet-500-20)',
        },
        cyan: {
          '500/20': 'var(--br-bg-cyan-500-20)',
        },
        orange: {
          '500/20': 'var(--br-bg-orange-500-20)',
        },
        slate: {
          '800': 'rgb(var(--br-bg-slate-800) / <alpha-value>)',
          '500/20': 'var(--br-bg-slate-500-20)',
          '700/60': 'var(--br-bg-slate-700-60)',
          '700/50': 'var(--br-bg-slate-700-50)',
        },
      },
      borderColor: {
        slate: {
          '600/50': 'var(--br-border-slate-600-50)',
          '600/40': 'var(--br-border-slate-600-40)',
          '600/30': 'var(--br-border-slate-600-30)',
          '700/30': 'var(--br-border-slate-700-30)',
        },
      },
      placeholderColor: {
        slate: {
          600: 'rgb(var(--ink-3) / <alpha-value>)',
        },
      },
    },
  },
  plugins: [],
}
