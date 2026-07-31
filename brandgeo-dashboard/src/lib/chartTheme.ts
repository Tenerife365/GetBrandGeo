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

// SYNCED 2026-07-30 with the light-mode contrast fixes in index.css. Two values
// here had gone stale the moment those tokens moved, which is the failure mode
// this module's own docstring cannot prevent: --axis-ink and --grid-line are
// defined in index.css and referenced by NOTHING, so the CSS side is dead
// documentation and this file is the only thing that paints. Nothing errors
// when they diverge.
//   axisInk          #64748b -> #556479. The comment on the interface says this
//                    "clears 4.5:1 in both themes"; at #64748b it measured 4.76
//                    and only because every chart happens to sit on a white
//                    card. On the page it was 4.45 and on --dark-700 3.95, so
//                    the claim held by placement, not by the value. Now 6.03 on
//                    the card, 5.00 on the darkest light surface.
//   sentimentPositive #4d7c0f -> #3f6212, matching --sentiment-positive, which
//                    moved because .text-sentiment-positive is real text
//                    (TrendDelta.tsx:37) and measured 4.09 on its own lime tint.
//                    As a chart fill either value clears the 3:1 non-text floor,
//                    so this change is for token truth, not for the chart.
// sentimentNeutral stays #64748b deliberately: --sentiment-neutral was left
// alone because it only fills a 2x2 dot. See the note beside it in index.css.
const LIGHT: ChartTheme = {
  gridLine: '#eaeaf2',
  axisInk: '#556479',
  tooltipSurface: '#ffffff',
  tooltipBorder: '#d8d6e6',
  tooltipInk: '#0f172a',
  cardSurface: '#ffffff',
  sentimentPositive: '#3f6212',
  sentimentNeutral: '#64748b',
  sentimentNegative: '#9f1239',
  railActive: '#7c3aed',
}

export function useChartTheme(): ChartTheme {
  return useTheme().theme === 'light' ? LIGHT : DARK
}
