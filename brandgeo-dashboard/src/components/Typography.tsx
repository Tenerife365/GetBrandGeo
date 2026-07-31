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
    <h1
      className={`text-2xl font-bold tracking-tight text-white ${className}`}
      style={{ letterSpacing: '-0.02em', lineHeight: 1.2 }}
    >
      {children}
    </h1>
  )
}

export function SectionHeading({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <h2 className={`text-sm font-semibold text-slate-200 mb-3 ${className}`} style={{ lineHeight: 1.3 }}>
      {children}
    </h2>
  )
}

/**
 * Uppercase KPI caption. NOT a heading — always a <span>, never h2/h3 (§6.3).
 */
export function StatLabel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={`block text-[11px] font-semibold uppercase text-slate-400 ${className}`}
      style={{ letterSpacing: '0.06em' }}
    >
      {children}
    </span>
  )
}

/** Paired value for StatLabel — 28px/700 on a hero, 22px/700 on a tile. */
export function StatValue({ children, size = 'tile', className = '' }: { children: ReactNode; size?: 'hero' | 'tile'; className?: string }) {
  return (
    <span className={`block font-bold tabular-nums text-white ${size === 'hero' ? 'text-[28px]' : 'text-[22px]'} ${className}`}>
      {children}
    </span>
  )
}
