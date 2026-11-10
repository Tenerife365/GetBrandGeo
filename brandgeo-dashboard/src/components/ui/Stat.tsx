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
  /** Sparkline series, drawn full-bleed along the bottom edge of the cell. */
  spark?: number[]
  pending?: boolean
  /** Shown in place of the value when there is nothing to show. */
  emptyLabel?: ReactNode
}

function Spark({ points }: { points: number[] }) {
  if (points.length < 2) return null
  const min = Math.min(...points)
  const max = Math.max(...points)
  const span = max - min || 1
  const xy = points.map((p, i) => [(i / (points.length - 1)) * 100, 30 - ((p - min) / span) * 24] as const)
  const line = 'M' + xy.map(([x, y]) => `${x},${y}`).join(' L')
  const area = `${line} L100,32 L0,32 Z`
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 100 32"
      preserveAspectRatio="none"
      className="spark-fade pointer-events-none absolute inset-x-0 bottom-0 h-8 w-full"
    >
      <path d={area} fill="rgb(var(--ink-3) / 0.14)" />
      <path d={line} fill="none" stroke="rgb(var(--ink-3))" strokeWidth={1.5} vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  )
}

export default function Stat({ label, icon: Icon, value, unit, sub, tone = 'neutral', delta, spark, pending, emptyLabel }: StatProps) {
  if (pending) return <SkeletonStat />
  const empty = emptyLabel !== undefined && emptyLabel !== null
  return (
    <div className="min-w-0">
      <div className="flex items-center gap-1.5 label-caps">
        {Icon && <Icon size={13} aria-hidden="true" className="text-ink-3 shrink-0" />}
        <span className="truncate">{label}</span>
      </div>
      <div className="mt-2 flex items-baseline gap-1 min-h-[36px]">
        {empty ? (
          <span className="text-body text-ink-3">{emptyLabel}</span>
        ) : (
          <span className={`flex items-baseline ${unit === '%' ? 'gap-0.5' : 'gap-1'} tabular-nums min-w-0`}>
            <span className="text-title md:text-kpi text-ink tabular-nums">{value}</span>
            {unit && <span className="text-meta text-ink-3">{unit}</span>}
            {tone === 'warn' && <StatusGlyph kind="warn" size={14} className="self-center ml-1" />}
            {tone === 'alert' && <StatusGlyph kind="neg" size={12} className="self-center ml-1" />}
          </span>
        )}
      </div>
      {!empty && delta && <div className="mt-1.5">{delta}</div>}
      {sub && <div className="mt-1 text-meta text-ink-3">{sub}</div>}
      {!empty && spark && <Spark points={spark} />}
    </div>
  )
}
