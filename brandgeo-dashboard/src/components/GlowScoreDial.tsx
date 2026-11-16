/**
 * GlowScoreDial: the AI Visibility score ring with the glass layer's gradient
 * stroke and glow (docs/design/phase3-visual/glass-layer-2026-11-15.md), set
 * in the tactile layer's instrument bezel
 * (docs/design/phase3-visual/tactile-layer-2026-11-16.md): a recessed face
 * with a ring of 60 ticks that light up to the score, every fifth one longer.
 *
 * A sibling of ui/ScoreDial, not a change to it: ScoreDial is shared (Overview
 * uses it through ScoreBadge) and its spec says no gradient and no glow, so the
 * glass and tactile look stays on the one page that asked for it. Same props.
 * The outer box is still 160 (136 at md), so nothing around it moves.
 *
 * Every colour is a token (--grad-start, --grad-end, --glow, --dial-track,
 * --edge, --accent-ink), read through style so the SVG follows the theme. The
 * arc draws once on mount (500 ms ease-out); reduced motion draws it at its
 * value. The ticks are decoration: the number in the centre is the reading.
 */
import { useEffect, useId, useState } from 'react'

export interface GlowScoreDialProps {
  score: number | null
  size?: 'lg' | 'md'
}

const TICKS = 60

export default function GlowScoreDial({ score, size = 'lg' }: GlowScoreDialProps) {
  const px = size === 'lg' ? 160 : 136
  const c = px / 2
  const stroke = 9
  const tickOuter = c - 5
  const tickMinor = 3
  const tickMajor = 6
  const r = tickOuter - tickMajor - 3 - stroke / 2
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
  const lit = score === null ? 0 : Math.round((drawn / 100) * TICKS)

  return (
    <div className="relative shrink-0" style={{ width: px, height: px }} role="img" aria-label={label}>
      <div className="dial-face absolute inset-0" aria-hidden="true" />
      <svg width={px} height={px} viewBox={`0 0 ${px} ${px}`} aria-hidden="true" className="relative" style={{ transform: 'rotate(-90deg)', overflow: 'visible' }}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" style={{ stopColor: 'rgb(var(--grad-start))' }} />
            <stop offset="55%" style={{ stopColor: 'rgb(var(--grad-mid))' }} />
            <stop offset="100%" style={{ stopColor: 'rgb(var(--grad-end))' }} />
          </linearGradient>
        </defs>
        {Array.from({ length: TICKS }, (_, i) => {
          const a = (i / TICKS) * 2 * Math.PI
          const len = i % 5 === 0 ? tickMajor : tickMinor
          const cos = Math.cos(a), sin = Math.sin(a)
          const on = i < lit
          return (
            <line
              key={i}
              x1={c + (tickOuter - len) * cos}
              y1={c + (tickOuter - len) * sin}
              x2={c + tickOuter * cos}
              y2={c + tickOuter * sin}
              strokeWidth={i % 5 === 0 ? 1.5 : 1}
              strokeLinecap="round"
              // Each tick lights a little after the one before, so the ring
              // sweeps with the arc (60 x 8 ms, about the arc's 500 ms).
              className="transition-[stroke,opacity] duration-150 ease-out motion-reduce:transition-none"
              style={on
                ? { stroke: 'rgb(var(--accent-ink))', opacity: 0.95, transitionDelay: `${i * 8}ms` }
                : { stroke: 'rgb(var(--edge))', opacity: 0.55 }}
            />
          )
        })}
        <circle cx={c} cy={c} r={r} fill="none" strokeWidth={stroke} style={{ stroke: 'rgb(var(--dial-track))' }} />
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
            style={{ filter: 'drop-shadow(0 0 6px rgb(var(--glow) / var(--glow-strength)))' }}
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
            {/* ink-2, not ink-3: on the recessed face with its aura, ink-3
                measured 4.38:1 in light (tactile layer, 2026-11-16). */}
            <span className="text-meta text-ink-2">%</span>
          </span>
        )}
      </div>
    </div>
  )
}
