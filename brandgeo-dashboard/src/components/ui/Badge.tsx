/** Badge (spec 7.4): 20 high, radius 6, no border. Status badges carry a glyph and a word. */
import type { ReactNode } from 'react'
import { cx } from './cx'

export type BadgeTone = 'neutral' | 'accent' | 'pos' | 'warn' | 'neg'

export interface BadgeProps {
  tone: BadgeTone
  /** Optional leading glyph (a StatusGlyph or icon). Should be aria-hidden. */
  glyph?: ReactNode
  children?: ReactNode
  className?: string
}

const TONE: Record<BadgeTone, string> = {
  neutral: 'bg-surface-3 text-ink-2',
  accent: 'bg-accent-tint text-accent-ink',
  pos: 'bg-pos-tint text-pos-ink',
  warn: 'bg-warn-tint text-warn',
  neg: 'bg-neg-tint text-neg',
}

export default function Badge({ tone, glyph, children, className }: BadgeProps) {
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1 h-5 px-1.5 rounded-badge text-meta whitespace-nowrap tabular-nums align-middle',
        TONE[tone],
        className,
      )}
    >
      {glyph}
      {children}
    </span>
  )
}
