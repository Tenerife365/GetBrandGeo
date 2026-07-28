/**
 * src/lib/color.ts
 * One tiny helper: derive an alpha variant of an ENGINE_META chartColor hex at
 * render time, rather than hand-picking a second "tint" hex per engine.
 *
 * Why this exists (dashboard-visual-system.md §8.4): the old engine chip had
 * its own separately hand-picked Tailwind colour (ENGINE_META's old colour /
 * `.bg`) that drifted from the chart hue over time — that drift is exactly how
 * Claude (orange-400) and Meta (amber-400) ended up 9.6 delta-E apart instead
 * of the intended separation. Deriving the fill/border from the single
 * `chartColor` value makes drift structurally impossible: there is only ever
 * one hex per engine, in one place (planConfig.ts).
 */
export function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace('#', '')
  const r = parseInt(clean.slice(0, 2), 16)
  const g = parseInt(clean.slice(2, 4), 16)
  const b = parseInt(clean.slice(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}
