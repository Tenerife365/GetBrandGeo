/**
 * StatusGlyph (spec 7.3): direction and state by shape, never by colour alone.
 * Decorative: aria-hidden, the adjacent word carries the meaning.
 */
import { Circle, Info, Triangle, TriangleAlert } from 'lucide-react'

export type StatusKind = 'pos' | 'neu' | 'neg' | 'warn' | 'info'

export interface StatusGlyphProps {
  kind: StatusKind
  size?: number
  className?: string
}

const COLOR: Record<StatusKind, string> = {
  pos: 'text-pos',
  neu: 'text-neu',
  neg: 'text-neg',
  warn: 'text-warn',
  info: 'text-accent-ink',
}

export default function StatusGlyph({ kind, size = 12, className = '' }: StatusGlyphProps) {
  const cls = `shrink-0 ${COLOR[kind]} ${className}`.trim()
  switch (kind) {
    case 'pos':
      return <Triangle size={size} fill="currentColor" stroke="none" aria-hidden="true" className={cls} />
    case 'neg':
      return (
        <Triangle size={size} fill="currentColor" stroke="none" aria-hidden="true" className={cls} style={{ transform: 'rotate(180deg)' }} />
      )
    case 'neu':
      return <Circle size={size} fill="currentColor" stroke="none" aria-hidden="true" className={cls} />
    case 'warn':
      return <TriangleAlert size={size} aria-hidden="true" className={cls} />
    default:
      return <Info size={size} aria-hidden="true" className={cls} />
  }
}
