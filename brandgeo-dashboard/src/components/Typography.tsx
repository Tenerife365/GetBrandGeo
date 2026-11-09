/**
 * src/components/Typography.tsx
 * Three heading/label primitives (docs/design/dashboard-visual-system.md §6),
 * defined once and used everywhere instead of each page inventing its own
 * h1/h2 treatment. Before this: h1 was split 24px/600 on four routes and
 * 24px/700 on eight (F-19), and h2 had four different treatments where it
 * existed at all — and didn't exist on five routes (F-13).
 *
 * Heading order is h1 -> h2 -> h3, never skipped. `StatLabel` is explicitly
 * NOT a heading — it was previously found masquerading as an h2 at 12px/600
 * on /sentiment and /competitors (F-13); it renders a <span> so the document
 * outline stays accurate.
 */
import type { ReactNode } from 'react'

export function PageTitle({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <h1 className={`text-title-sm md:text-title text-ink ${className}`}>
      {children}
    </h1>
  )
}

export function SectionHeading({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <h2 className={`text-heading text-ink mb-3 ${className}`}>
      {children}
    </h2>
  )
}

/**
 * KPI caption (sentence case, meta role). NOT a heading: always a <span>, never h2/h3 (§6.3).
 */
export function StatLabel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <span className={`block text-meta text-ink-2 ${className}`}>
      {children}
    </span>
  )
}

/** Paired value for StatLabel — 28px/700 on a hero, 22px/700 on a tile. */
export function StatValue({ children, size = 'tile', className = '' }: { children: ReactNode; size?: 'hero' | 'tile'; className?: string }) {
  return (
    <span className={`block tabular-nums text-ink ${size === 'hero' ? 'text-display-sm' : 'text-value'} ${className}`}>
      {children}
    </span>
  )
}
