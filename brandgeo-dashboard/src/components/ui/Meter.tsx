/** Meter (spec 7.3): 4 high track (6 for dimensions), fill in the tone mark. null renders the track and "n/a". */
import type { ReactNode } from 'react'

export interface MeterProps {
  value: number | null
  tone?: 'accent' | 'pos' | 'warn' | 'neg'
  label?: ReactNode
  valueLabel?: ReactNode
  /** Track height: 4 by default, 6 on AI Visibility dimensions. */
  thick?: boolean
  /** Accessible name for the bar when the visible name is printed elsewhere. */
  ariaLabel?: string
}

const FILL: Record<NonNullable<MeterProps['tone']>, string> = {
  accent: 'bg-accent',
  pos: 'bg-pos',
  warn: 'bg-warn',
  neg: 'bg-neg',
}

export default function Meter({ value, tone = 'accent', label, valueLabel, thick = false, ariaLabel }: MeterProps) {
  const pct = value === null ? 0 : Math.max(0, Math.min(100, value))
  return (
    <div className="min-w-0">
      {(label || valueLabel !== undefined || value === null) && (
        <div className="mb-1.5 flex items-baseline justify-between gap-2 text-meta">
          <span className="text-ink-2 truncate">{label}</span>
          <span className="text-ink-3 tabular-nums shrink-0">{value === null ? 'n/a' : valueLabel}</span>
        </div>
      )}
      <div
        className={`${thick ? 'h-1.5' : 'h-1'} rounded-sm bg-surface-3 overflow-hidden`}
        role={value === null ? undefined : 'progressbar'}
        aria-valuemin={value === null ? undefined : 0}
        aria-valuemax={value === null ? undefined : 100}
        aria-valuenow={value === null ? undefined : Math.round(pct)}
        aria-label={ariaLabel ?? (typeof label === 'string' ? label : undefined)}
      >
        {value !== null && (
          <div className={`h-full rounded-sm transition-[width] duration-[260ms] ease-out motion-reduce:transition-none ${FILL[tone]}`} style={{ width: `${pct}%` }} />
        )}
      </div>
    </div>
  )
}
