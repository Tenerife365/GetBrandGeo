/**
 * ScoreDial (spec 7.3): SVG ring, 160 (md 136), stroke 8, round caps. Track
 * --surface-3, arc --accent. No gradient, glow or shadow. The arc draws once on
 * first paint (500 ms ease-out); reduced motion draws it at its value.
 */
import { useEffect, useState } from 'react'

export interface ScoreDialProps {
  score: number | null
  size?: 'lg' | 'md'
}

export default function ScoreDial({ score, size = 'lg' }: ScoreDialProps) {
  const px = size === 'lg' ? 160 : 136
  const stroke = 8
  const r = (px - stroke) / 2
  const circ = 2 * Math.PI * r
  const target = score === null ? 0 : Math.max(0, Math.min(100, score))
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
        <circle cx={px / 2} cy={px / 2} r={r} fill="none" strokeWidth={stroke} stroke="rgb(var(--surface-3))" />
        {score !== null && (
          <circle
            cx={px / 2}
            cy={px / 2}
            r={r}
            fill="none"
            strokeWidth={stroke}
            strokeLinecap="round"
            stroke="rgb(var(--accent))"
            strokeDasharray={circ}
            strokeDashoffset={circ * (1 - drawn / 100)}
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
            <span className={size === 'lg' ? 'text-display' : 'text-display-sm'}>{Math.round(target)}</span>
            <span className="text-meta text-ink-3">%</span>
          </span>
        )}
      </div>
    </div>
  )
}
