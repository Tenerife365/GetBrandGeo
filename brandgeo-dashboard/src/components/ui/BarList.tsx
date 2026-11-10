/** BarList (spec 7.3): label left, 6 high bar, value right. `isYou` takes the accent, others the neutral mark. No axes. */
import type { ReactNode } from 'react'

export interface BarListRow {
  label: ReactNode
  value: number
  isYou?: boolean
  /** Optional colour dot before the label (engine identity). Any CSS colour. */
  swatch?: string
}

export interface BarListProps {
  rows: BarListRow[]
  format: (value: number) => string
}

export default function BarList({ rows, format }: BarListProps) {
  const max = Math.max(0, ...rows.map(r => r.value)) || 1
  return (
    <ul className="space-y-3">
      {rows.map((row, i) => (
        <li key={i} className="flex items-center gap-3 min-h-8">
          <span className="w-36 sm:w-[200px] shrink-0 text-body text-ink flex items-center gap-2 min-w-0">
            {row.swatch && <span aria-hidden="true" className="inline-block h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: row.swatch }} />}
            <span className="min-w-0 break-words">{row.label}</span>
          </span>
          <span className="flex-1 h-1.5 rounded-sm bg-surface-3 overflow-hidden" aria-hidden="true">
            <span
              className={`block h-full rounded-sm ${row.isYou ? 'bg-accent' : 'bg-neu'}`}
              style={{ width: `${Math.max(0, Math.min(100, (row.value / max) * 100))}%` }}
            />
          </span>
          <span className="shrink-0 text-body font-semibold text-ink tabular-nums text-right min-w-[3ch]">{format(row.value)}</span>
        </li>
      ))}
    </ul>
  )
}
