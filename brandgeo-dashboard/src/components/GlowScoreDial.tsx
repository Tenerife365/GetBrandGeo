/**
 * GlowScoreDial: the AI Visibility score ring with the glass layer's gradient
 * stroke and glow (docs/design/phase3-visual/glass-layer-2026-11-15.md).
 *
 * A sibling of ui/ScoreDial, not a change to it: ScoreDial is shared (Overview
 * uses it through ScoreBadge) and its spec says no gradient and no glow, so the
 * glass look stays on the one page that asked for it. Same shape of props.
 *
 * Every colour is a token (--grad-start, --grad-end, --glow, --surface-3),
 * read through style so the SVG follows the theme. The arc draws once on
 * mount (500 ms ease-out); reduced motion draws it at its value.
 */
import { useEffect, useId, useState } from 'react'

export interface GlowScoreDialProps {
  score: number | null
  size?: 'lg' | 'md'
}

export default function GlowScoreDial({ score, size = 'lg' }: GlowScoreDialProps) {
  const px = size === 'lg' ? 160 : 136
  const stroke = 9
  const r = (px - stroke) / 2 - 3
  const circ = 2 * Math.PI * r
  const target = score === null ? 0 : Math.max(0, Math.min(100, score))
  const gradId = `glow-dial-${useId().replace(/:/g, '')}`
  // Start empty, move to the value after mount so the arc draws in once.
  const [drawn, setDrawn] = useState(0)
  useEffect(() => {
    const id = requestAnimationFrame(() => setDrawn(target))
    return () => cancelAnimationFrame(id)
  }, [target])

  const label = score === null ? 'Not measured yet' : `${Math.round(target)} out of 100`

  return (
    <div className="relative shrink-0" style={{ width: px, height: px }} role="img" aria-label={label}>
      <svg width={px} height={px} viewBox={`0 0 ${px} ${px}`} aria-hidden="true" style={{ transform: 'rotate(-90deg)', overflow: 'visible' }}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" style={{ stopColor: 'rgb(var(--grad-start))' }} />
            <stop offset="55%" style={{ stopColor: 'rgb(var(--grad-mid))' }} />
            <stop offset="100%" style={{ stopColor: 'rgb(var(--grad-end))' }} />
          </linearGradient>
        </defs>
        <circle cx={px / 2} cy={px / 2} r={r} fill="none" strokeWidth={stroke} style={{ stroke: 'rgb(var(--surface-3))' }} />
        {score !== null && (
          <circle
            cx={px / 2}
            cy={px / 2}
            r={r}
            fill="none"
            strokeWidth={stroke}
            strokeLinecap="round"
            stroke={`url(#${gradId})`}
            strokeDasharray={circ}
            strokeDashoffset={circ * (1 - drawn / 100)}
            style={{ filter: 'drop-shadow(0 0 6px rgb(var(--glow) / var(--glow-strength)))' }}
            className="transition-[stroke-dashoffset] duration-[500ms] ease-out motion-reduce:transition-none"
          />
        )}
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-center px-4">
        {score === null ? (
          // copy: pending bg-copy
          <span className="text-body text-ink-2">Not measured yet</span>
        ) : (
          <span className="flex items-baseline gap-0.5 tabular-nums">
            <span className={size === 'lg' ? 'text-display text-ink' : 'text-display-sm text-ink'}>{Math.round(target)}</span>
            <span className="text-meta text-ink-3">%</span>
          </span>
        )}
      </div>
    </div>
  )
}
