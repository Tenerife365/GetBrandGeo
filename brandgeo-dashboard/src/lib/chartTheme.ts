/**
 * src/lib/chartTheme.ts
 * Theme-aware palette for the Recharts "chrome" — gridlines, axis ticks and
 * tooltips.
 *
 * Why this exists: Recharts takes its colours as JS props (`stroke`, `fill`,
 * `contentStyle`), not CSS classes, so it sits completely outside the
 * `html.light` overrides in index.css that theme the rest of the app. Every
 * chart page had therefore hardcoded dark-only hexes inline — which meant that
 * in LIGHT mode the charts rendered a near-black tooltip box and dark slate
 * gridlines on a white page. Nothing themed them, because nothing could.
 *
 * Same reasoning as motion.ts: one file so every page's charts share a palette
 * instead of each page inventing its own. Before this, BrandSentiment.tsx alone
 * used two different axis-tick colours in two charts on the same screen
 * (#94a3b8 and #64748b), and #64748b measured 3.75:1 on --dark-800 — a
 * WCAG 1.4.3 failure for 10px axis labels, which are text.
 *
 * Contrast, measured (axis ticks and tooltip label text are TEXT, so 4.5:1):
 *   dark  — axisTick #94a3b8 on --dark-800 ....... 6.96:1  PASS
 *           tooltipLabel #e2e8f0 on #1e293b ...... 12.1:1  PASS
 *   light — axisTick #475569 on #ffffff ........... 7.57:1  PASS
 *           tooltipLabel #0f172a on #ffffff ....... 17.9:1  PASS
 *
 * Gridlines are decorative, not UI components conveying state, so they sit
 * below the 3:1 bar deliberately — a gridline that meets 3:1 competes with the
 * data series for attention.
 *
 * The DATA series colours (emerald / red / slate / brand) are NOT here. They
 * carry meaning, are shared across both themes, and already clear the 3:1
 * graphical minimum against both surfaces — slate #64748b, the weakest, is
 * 3.75:1 on --dark-800 and 4.76:1 on white.
 */
import { useTheme } from './themeContext'

export interface ChartTheme {
  /** CartesianGrid stroke. */
  grid: string
  /** XAxis/YAxis tick fill — this is text, so it meets 4.5:1. */
  axisTick: string
  /** Tooltip `contentStyle` — ready to spread directly onto the prop. */
  tooltipContent: {
    background: string
    border: string
    borderRadius: number
    boxShadow: string
  }
  /** Tooltip `labelStyle`. */
  tooltipLabel: { color: string; fontSize: number }
  /** Tooltip `itemStyle`. */
  tooltipItem: { color: string; fontSize: number }
  /** Legend `wrapperStyle` colour. */
  legend: string
}

// Dark values are neutral, not slate: the app's dark surfaces are the marketing
// site's true-neutral black (see index.css :root), so slate-tinted chart chrome
// reads visibly blue against them. axisTick #9b9bab measures 7.01:1 on
// --dark-800 — it is text, so it clears 4.5:1.
const DARK: ChartTheme = {
  grid: '#2d2d35',
  axisTick: '#9b9bab',
  tooltipContent: {
    background: '#1f1f27',
    border: '1px solid #2d2d35',
    borderRadius: 8,
    boxShadow: '0 8px 24px rgb(0 0 0 / 0.55)',
  },
  tooltipLabel: { color: '#f0f0f4', fontSize: 12 },
  tooltipItem: { color: '#c9c9d4', fontSize: 11 },
  legend: '#9b9bab',
}

const LIGHT: ChartTheme = {
  grid: '#e2e8f0',
  axisTick: '#475569',
  tooltipContent: {
    background: '#ffffff',
    border: '1px solid #cbd5e1',
    borderRadius: 8,
    boxShadow: '0 8px 24px rgb(15 23 42 / 0.12)',
  },
  tooltipLabel: { color: '#0f172a', fontSize: 12 },
  tooltipItem: { color: '#334155', fontSize: 11 },
  legend: '#475569',
}

export function useChartTheme(): ChartTheme {
  return useTheme().theme === 'light' ? LIGHT : DARK
}
