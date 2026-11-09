/**
 * Stat (spec 7.3): label, value, unit, sub, optional glyph by tone, delta and
 * sparkline slots. No card of its own: it lives inside a ReadoutRow.
 */
import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import StatusGlyph from './StatusGlyph'
import { SkeletonStat } from './skeletons'

export interface StatProps {
  label: ReactNode
  icon?: LucideIcon
  value: ReactNode
  unit?: ReactNode
  sub?: ReactNode
  /** Adds a glyph after the value. Never recolours the number. */
  tone?: 'neutral' | 'warn' | 'alert'
  /** A TrendDelta, or any node. */
  delta?: ReactNode
  /** Last 24-high sparkline series. */
  spark?: number[]
  pending?: boolean
  /** Shown in place of the value when there is nothing to show. */
  emptyLabel?: ReactNode
}

function Spark({ points }: { points: number[] }) {
  if (points.length < 2) return null
  const w = 72
  const h = 24
  const min = Math.min(...points)
  const max = Math.max(...points)
  const span = max - min || 1
  const xy = points.map((p, i) => [(i / (points.length - 1)) * (w - 4) + 2, h - 3 - ((p - min) / span) * (h - 6)] as const)
  const last = xy[xy.length - 1]
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true" className="shrink-0">
      <polyline points={xy.map(([x, y]) => `${x},${y}`).join(' ')} fill="none" stroke="rgb(var(--ink-3))" strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={last[0]} cy={last[1]} r={2} fill="rgb(var(--ink))" />
    </svg>
  )
}

export default function Stat({ label, icon: Icon, value, unit, sub, tone = 'neutral', delta, spark, pending, emptyLabel }: StatProps) {
  if (pending) return <SkeletonStat />
  const empty = emptyLabel !== undefined && emptyLabel !== null
  return (
    <div className="min-w-0">
      <div className="flex items-center gap-1.5 text-meta text-ink-2">
        {Icon && <Icon size={14} aria-hidden="true" className="text-ink-3 shrink-0" />}
        <span className="truncate">{label}</span>
      </div>
      <div className="mt-1 flex items-end justify-between gap-2 min-h-[28px]">
        {empty ? (
          <span className="text-body text-ink-3">{emptyLabel}</span>
        ) : (
          <span className="flex items-baseline gap-1 tabular-nums min-w-0">
            <span className="text-value text-ink">{value}</span>
            {unit && <span className="text-meta text-ink-3">{unit}</span>}
            {tone === 'warn' && <StatusGlyph kind="warn" size={14} className="self-center ml-1" />}
            {tone === 'alert' && <StatusGlyph kind="neg" size={12} className="self-center ml-1" />}
          </span>
        )}
        {!empty && spark && <Spark points={spark} />}
      </div>
      {!empty && delta && <div className="mt-1">{delta}</div>}
      {sub && <div className="mt-1 text-meta text-ink-3">{sub}</div>}
    </div>
  )
}
