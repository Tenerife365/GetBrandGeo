/**
 * GlowScoreDial: the AI Visibility score ring. Two layers only, a quiet track
 * and the gradient arc (clean-up pass 2026-11-17: the tactile layer's tick ring,
 * recessed face and arc glow are gone, on the owner's brief).
 *
 * A sibling of ui/ScoreDial, not a change to it: ScoreDial is shared (Overview
 * uses it through ScoreBadge) and its spec says no gradient, so the gradient
 * stays on the one page that asked for it. Same props. The outer box is still
 * 160 (136 at md), so nothing around it moves.
 *
 * Every colour is a token (--surface-3, --grad-start, --grad-mid, --grad-end),
 * read through style so the SVG follows the theme. The arc draws once on mount
 * (500 ms ease-out); reduced motion draws it at its value.
 */
import { useEffect, useId, useState } from 'react'

export interface GlowScoreDialProps {
  score: number | null
  size?: 'lg' | 'md'
}

export default function GlowScoreDial({ score, size = 'lg' }: GlowScoreDialProps) {
  const px = size === 'lg' ? 160 : 136
  const c = px / 2
  const stroke = 10
  const r = c - stroke / 2 - 2
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
      <svg width={px} height={px} viewBox={`0 0 ${px} ${px}`} aria-hidden="true" style={{ transform: 'rotate(-90deg)' }}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" style={{ stopColor: 'rgb(var(--grad-start))' }} />
            <stop offset="55%" style={{ stopColor: 'rgb(var(--grad-mid))' }} />
            <stop offset="100%" style={{ stopColor: 'rgb(var(--grad-end))' }} />
          </linearGradient>
        </defs>
        <circle cx={c} cy={c} r={r} fill="none" strokeWidth={stroke} style={{ stroke: 'rgb(var(--surface-3))' }} />
        {score !== null && (
          <circle
            cx={c}
            cy={c}
            r={r}
            fill="none"
            strokeWidth={stroke}
            strokeLinecap="round"
            stroke={`url(#${gradId})`}
            strokeDasharray={circ}
            strokeDashoffset={circ * (1 - drawn / 100)}
            className="transition-[stroke-dashoffset] duration-[500ms] ease-out motion-reduce:transition-none"
          />
        )}
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-center px-6">
        {score === null ? (
          <span className="text-body text-ink-2">Not measured yet</span>
        ) : (
          <span className="flex items-baseline gap-0.5 tabular-nums">
            <span className={size === 'lg' ? 'text-display text-ink' : 'text-display-sm text-ink'}>{Math.round(target)}</span>
            <span className="text-meta text-ink-2">%</span>
          </span>
        )}
      </div>
    </div>
  )
}
