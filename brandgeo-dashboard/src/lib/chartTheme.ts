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
 * Every value below is exactly the index.css token value for the
 * corresponding theme (phase3-visual-spec.md section 9.1) - this module
 * re-expresses those tokens in a form Recharts can consume, it does not invent
 * a colour. tests/tokens_sync.test.js fails if a hex here drifts from index.css.
 *
 * Engine colours are NOT here. They live in ENGINE_META (planConfig.ts) and do
 * not fork by theme (§8.2, judgement call J1) — every chart keys its engine
 * fills off ENGINE_META[id].chartColor directly, never off this module.
 */
import { useTheme } from './themeContext'

export interface ChartTheme {
  /** CartesianGrid stroke, --line. Decorative, deliberately below 3:1 (gridlines are exempt from WCAG 1.4.11). */
  gridLine: string
  /** XAxis/YAxis tick fill, --ink-3. This is text, so it clears 4.5:1 in both themes. */
  axisInk: string
  tooltipSurface: string
  tooltipBorder: string
  tooltipInk: string
  /** The card surface a chart sits on: the stroke gap between stacked bar segments and the activeDot border use this. */
  cardSurface: string
  /** Sentiment ramp, resolved to hex for the current theme. */
  sentimentPositive: string
  sentimentNeutral: string
  sentimentNegative: string
  /** The tenant's own series in a competitor chart, --accent. */
  you: string
  /** Every other brand in a competitor chart, --neu. Told apart by dash pattern, not hue (fieldDash). */
  field: string
  /** Empty remainder of a meter or bar, --surface-3. */
  track: string
  /** Same value as --accent-ink. */
  railActive: string
}

const DARK: ChartTheme = {
  gridLine: '#23242b',
  axisInk: '#878d99',
  tooltipSurface: '#16171e',
  tooltipBorder: '#32333c',
  tooltipInk: '#e8e9ed',
  cardSurface: '#101116',
  sentimentPositive: '#84cc16',
  sentimentNeutral: '#666a75',
  sentimentNegative: '#fb7185',
  you: '#8b5cf6',
  field: '#666a75',
  track: '#1d1e27',
  railActive: '#a78bfa',
}

const LIGHT: ChartTheme = {
  gridLine: '#e2e2ea',
  axisInk: '#62626c',
  tooltipSurface: '#ffffff',
  tooltipBorder: '#cfcfda',
  tooltipInk: '#09090f',
  cardSurface: '#ffffff',
  sentimentPositive: '#58870f',
  sentimentNeutral: '#71717a',
  sentimentNegative: '#9f1239',
  you: '#7c3aed',
  field: '#71717a',
  track: '#ececf4',
  railActive: '#6d28d9',
}

export function useChartTheme(): ChartTheme {
  return useTheme().theme === 'light' ? LIGHT : DARK
}

// -- Shared Recharts props (spec 9.1) ----------------------------------------
// Spread these instead of restating them per chart, so every chart carries the
// same grid, axis, bar and line treatment.

/** Horizontal gridlines only, 1px. */
export function gridProps(t: ChartTheme) {
  return { vertical: false, stroke: t.gridLine, strokeWidth: 1 } as const
}

/** No axis line, no tick line, 12px ink-3 labels. */
export function axisProps(t: ChartTheme) {
  return {
    axisLine: false,
    tickLine: false,
    tick: { fontSize: 12, fill: t.axisInk },
  } as const
}

/** Percent Y axis: 0, 50, 100. */
export function yPercentAxis(t: ChartTheme) {
  return {
    ...axisProps(t),
    width: 48,
    domain: [0, 100] as [number, number],
    ticks: [0, 50, 100],
    tickFormatter: (v: number) => v + '%',
  }
}

export function barProps(t: ChartTheme) {
  return {
    radius: [4, 4, 0, 0] as [number, number, number, number],
    maxBarSize: 24,
    stroke: t.cardSurface,
    strokeWidth: 2,
  }
}

export function lineProps(t: ChartTheme) {
  return {
    strokeWidth: 2,
    dot: false as const,
    activeDot: { r: 5, strokeWidth: 2, stroke: t.cardSurface },
  }
}

/** Dash patterns for the field series in a competitor chart (solid, dashed, dotted). */
export const fieldDash = ['0', '6 3', '2 3']
