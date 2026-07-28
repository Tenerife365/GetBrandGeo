/**
 * src/lib/chartTheme.ts
 * Theme-aware palette for the Recharts "chrome" — gridlines, axis ticks,
 * tooltip, and the sentiment ramp — per
 * docs/design/dashboard-visual-system.md §9.1.
 *
 * Why this exists: Recharts writes SVG presentation attributes and does not
 * reliably resolve `rgb(var(--token))` strings, so it sits completely outside
 * the `html.light` CSS-variable overrides that theme the rest of the app.
 * Every chart therefore reads its resolved hexes from this one module instead
 * of hardcoding them inline — before this existed, BrandSentiment.tsx alone
 * used two different axis-tick colours in two charts on the same screen, and
 * light mode rendered a near-black tooltip on a white page because nothing
 * could theme it.
 *
 * Every value below is exactly the §3 (A9) and §8.5 token value for the
 * corresponding theme — this module re-expresses those tokens in a form
 * Recharts can consume, it does not invent or duplicate a colour.
 *
 * Engine colours are NOT here. They live in ENGINE_META (planConfig.ts) and do
 * not fork by theme (§8.2, judgement call J1) — every chart keys its engine
 * fills off ENGINE_META[id].chartColor directly, never off this module.
 */
import { useTheme } from './themeContext'

export interface ChartTheme {
  /** CartesianGrid stroke — §3 A9 --grid-line. Decorative, deliberately below 3:1 (gridlines are exempt from WCAG 1.4.11). */
  gridLine: string
  /** XAxis/YAxis tick fill — §3 A9 --axis-ink. This is text, so it clears 4.5:1 in both themes. */
  axisInk: string
  tooltipSurface: string
  tooltipBorder: string
  tooltipInk: string
  /** The card surface a chart sits on — the stroke gap between stacked bar segments (§9.5) and the activeDot border use this. */
  cardSurface: string
  /** §8.5 sentiment ramp, resolved to hex for the current theme. */
  sentimentPositive: string
  sentimentNeutral: string
  sentimentNegative: string
  /** §9.5 — the tenant's own brand series in a competitor chart. Same value as --rail-active. */
  railActive: string
}

const DARK: ChartTheme = {
  gridLine: '#243044',
  axisInk: '#94a3b8',
  tooltipSurface: '#1e293b',
  tooltipBorder: '#334155',
  tooltipInk: '#e2e8f0',
  cardSurface: '#0f172a',
  sentimentPositive: '#84cc16',
  sentimentNeutral: '#94a3b8',
  sentimentNegative: '#fb7185',
  railActive: '#a78bfa',
}

const LIGHT: ChartTheme = {
  gridLine: '#eaeaf2',
  axisInk: '#64748b',
  tooltipSurface: '#ffffff',
  tooltipBorder: '#d8d6e6',
  tooltipInk: '#0f172a',
  cardSurface: '#ffffff',
  sentimentPositive: '#4d7c0f',
  sentimentNeutral: '#64748b',
  sentimentNegative: '#9f1239',
  railActive: '#7c3aed',
}

export function useChartTheme(): ChartTheme {
  return useTheme().theme === 'light' ? LIGHT : DARK
}
