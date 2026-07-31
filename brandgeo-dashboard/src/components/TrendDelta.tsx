/**
 * src/components/TrendDelta.tsx
 * A trend delta is three parts and never fewer (dashboard-visual-system.md
 * §12.2): a glyph, a value, and a period. The glyph carries direction, colour
 * only reinforces it — never colour alone (§13.6).
 *
 * "Direction is not always good": `higherIsBetter` decides colour (favourable
 * vs unfavourable), the glyph still just points at which way the number
 * moved. No metric in the product today has `higherIsBetter={false}`, but the
 * prop exists so nobody has to guess later (§12.2).
 *
 * When there are fewer than two distinct collection days in the window, there
 * is nothing to compare — render "First measurement" instead of fabricating a
 * delta. Per CLAUDE.md this is the state most tenants actually see today, so
 * it has to look deliberate, not broken.
 */
import { Minus, Triangle } from 'lucide-react'

interface TrendDeltaProps {
  /** Signed change, e.g. +4 or -2. `null`/`undefined` means "not enough data yet". */
  delta: number | null | undefined
  /** The comparison window, e.g. "last 30d". */
  period: string
  /** Unit suffix appended to the absolute value, e.g. "pts" or "%". Default "pts". */
  unit?: string
  higherIsBetter?: boolean
  className?: string
}

export default function TrendDelta({ delta, period, unit = 'pts', higherIsBetter = true, className = '' }: TrendDeltaProps) {
  if (delta === null || delta === undefined) {
    return <span className={`text-xs text-slate-500 ${className}`}>First measurement</span>
  }

  const direction: 'up' | 'down' | 'flat' = delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat'
  const favourable = direction === 'flat' ? null : (direction === 'up') === higherIsBetter
  const colorClass = favourable === null ? 'text-slate-400' : favourable ? 'text-sentiment-positive' : 'text-sentiment-negative'

  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium tabular-nums ${colorClass} ${className}`}>
      {direction === 'flat' ? (
        <Minus size={10} />
      ) : (
        <Triangle
          size={9}
          fill="currentColor"
          stroke="none"
          style={{ transform: direction === 'down' ? 'rotate(180deg)' : undefined }}
        />
      )}
      {delta > 0 ? '+' : ''}{delta}{unit} <span className="text-slate-500 font-normal">vs {period}</span>
    </span>
  )
}
