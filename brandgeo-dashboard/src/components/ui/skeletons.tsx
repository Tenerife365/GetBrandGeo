/**
 * Skeletons (spec 7.5). Each is the exact box of its final element so nothing
 * shifts when data lands. The pulse and the reduced-motion freeze live in the
 * `.skeleton` class in index.css.
 */
import Card from './Card'
import { cx } from './cx'

export function SkeletonBlock({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cx('skeleton', className)} />
}

export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div aria-hidden="true" className={cx('space-y-2', className)}>
      {Array.from({ length: lines }, (_, i) => (
        <div key={i} className={cx('skeleton h-3.5', i === lines - 1 && lines > 1 ? 'w-2/3' : 'w-full')} />
      ))}
    </div>
  )
}

export function SkeletonStat({ className }: { className?: string }) {
  return (
    <div aria-hidden="true" className={cx('space-y-2', className)}>
      <div className="skeleton h-4 w-24" />
      <div className="skeleton h-7 w-20" />
      <div className="skeleton h-4 w-32" />
    </div>
  )
}

export function SkeletonReadout({ n = 4 }: { n?: number }) {
  return (
    <Card pad="none" aria-hidden="true">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-line rounded-card overflow-hidden">
        {Array.from({ length: n }, (_, i) => (
          <div key={i} className="bg-surface p-5">
            <SkeletonStat />
          </div>
        ))}
      </div>
    </Card>
  )
}

export function SkeletonDial({ size = 160 }: { size?: number }) {
  return <div aria-hidden="true" className="skeleton rounded-full shrink-0" style={{ width: size, height: size }} />
}

export function SkeletonHero() {
  return (
    <Card pad="feature" aria-hidden="true" className="min-h-[280px] md:min-h-[240px]">
      <div className="flex flex-col items-center gap-6 md:flex-row md:items-center">
        <SkeletonDial />
        <div className="w-full flex-1 space-y-3">
          <div className="skeleton h-6 w-40" />
          <div className="skeleton h-5 w-full max-w-[56ch]" />
          <div className="skeleton h-5 w-2/3 max-w-[40ch]" />
          <div className="skeleton h-9 w-36" />
        </div>
      </div>
    </Card>
  )
}

export function SkeletonTable({ rows = 6, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <Card pad="none" aria-hidden="true">
      <div className="h-9 bg-surface-2 border-b border-line rounded-t-card" />
      {Array.from({ length: rows }, (_, r) => (
        <div key={r} className="flex items-center gap-4 min-h-[48px] px-4 border-b border-line last:border-b-0">
          {Array.from({ length: cols }, (_, c) => (
            <div key={c} className={cx('skeleton h-4', c === 0 ? 'flex-[2]' : 'flex-1')} />
          ))}
        </div>
      ))}
    </Card>
  )
}

export function SkeletonList({ rows = 5 }: { rows?: number }) {
  return (
    <Card pad="none" aria-hidden="true">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-3 min-h-[56px] px-4 py-3 border-b border-line last:border-b-0">
          <div className="skeleton h-8 w-8 shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="skeleton h-4 w-3/4" />
            <div className="skeleton h-3 w-1/3" />
          </div>
        </div>
      ))}
    </Card>
  )
}

export function SkeletonChart({ h = 240 }: { h?: number }) {
  return <div aria-hidden="true" className="skeleton w-full rounded-card" style={{ height: h }} />
}
