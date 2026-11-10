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
  /** Sparkline series, drawn as a small fixed-size line at the right of the value. */
  spark?: number[]
  pending?: boolean
  /** Shown in place of the value when there is nothing to show. */
  emptyLabel?: ReactNode
}

function Spark({ points }: { points: number[] }) {
  if (points.length < 3) return null
  const W = 64
  const H = 24
  const P = 3
  const n = points.length
  const min = Math.min(...points)
  const max = Math.max(...points)
  const xy = points.map((p, i) => {
    const x = P + (i * (W - 2 * P)) / (n - 1)
    const y = max === min ? H / 2 : P + (1 - (p - min) / (max - min)) * (H - 2 * P)
    return [x.toFixed(2), y.toFixed(2)] as const
  })
  const line = 'M' + xy.map(([x, y]) => `${x},${y}`).join(' L')
  const [lastX, lastY] = xy[xy.length - 1]
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      width={64}
      height={24}
      viewBox="0 0 64 24"
      className="pointer-events-none shrink-0 self-center ml-auto hidden sm:block lg:hidden xl:block"
    >
      <path d={line} fill="none" stroke="rgb(var(--ink-3))" strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={lastX} cy={lastY} r={2} fill="rgb(var(--ink-2))" />
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
        {!empty && spark && <Spark points={spark} />}
      </div>
      {!empty && delta && <div className="mt-1.5">{delta}</div>}
      {sub && <div className="mt-1 text-meta text-ink-3">{sub}</div>}
    </div>
  )
}
