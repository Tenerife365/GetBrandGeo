/**
 * src/lib/tokens.ts
 * Hex copies of the semantic colour tokens declared in src/index.css (:root and
 * html.light), for the few places that cannot read a CSS variable: Recharts
 * presentation attributes, canvas drawing, inline SVG exports.
 *
 * This file invents nothing. The index.css triplets are the single source;
 * tests/tokens_sync.test.js fails if any hex here, or any hex in chartTheme.ts,
 * stops matching its index.css triplet in the same theme. Engine colours are not
 * here: they live in ENGINE_META (planConfig.ts).
 */

export type ThemeName = 'dark' | 'light'

export const TOKEN_NAMES = [
  'canvas',
  'surface',
  'surface-2',
  'surface-3',
  'line',
  'line-2',
  'edge',
  'ink',
  'ink-2',
  'ink-3',
  'accent',
  'accent-strong',
  'accent-strong-hover',
  'accent-ink',
  'accent-tint',
  'on-accent',
  'pos',
  'pos-ink',
  'pos-tint',
  'neu',
  'neg',
  'neg-tint',
  'warn',
  'warn-tint',
] as const

export type TokenName = (typeof TOKEN_NAMES)[number]

export const TOKENS: Record<ThemeName, Record<TokenName, string>> = {
  dark: {
    canvas: '#0a0b0e',
    surface: '#101116',
    'surface-2': '#16171e',
    'surface-3': '#1d1e27',
    line: '#23242b',
    'line-2': '#32333c',
    edge: '#666a75',
    ink: '#e8e9ed',
    'ink-2': '#9ba1ac',
    'ink-3': '#878d99',
    accent: '#8b5cf6',
    'accent-strong': '#7c3aed',
    'accent-strong-hover': '#6d28d9',
    'accent-ink': '#a78bfa',
    'accent-tint': '#241d3a',
    'on-accent': '#ffffff',
    pos: '#84cc16',
    'pos-ink': '#84cc16',
    'pos-tint': '#202b16',
    neu: '#666a75',
    neg: '#fb7185',
    'neg-tint': '#311e26',
    warn: '#fbbf24',
    'warn-tint': '#2c2618',
  },
  light: {
    canvas: '#f7f7fc',
    surface: '#ffffff',
    'surface-2': '#f4f4fb',
    'surface-3': '#ececf4',
    line: '#e2e2ea',
    'line-2': '#cfcfda',
    edge: '#85858f',
    ink: '#09090f',
    'ink-2': '#55555e',
    'ink-3': '#62626c',
    accent: '#7c3aed',
    'accent-strong': '#6d28d9',
    'accent-strong-hover': '#5b21b6',
    'accent-ink': '#6d28d9',
    'accent-tint': '#ede9fe',
    'on-accent': '#ffffff',
    pos: '#58870f',
    'pos-ink': '#3f6212',
    'pos-tint': '#ecfccb',
    neu: '#71717a',
    neg: '#9f1239',
    'neg-tint': '#ffe4e6',
    warn: '#713f12',
    'warn-tint': '#fef3c7',
  },
}
