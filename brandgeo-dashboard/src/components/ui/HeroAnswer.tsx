/**
 * HeroAnswer (spec 7.2): the one hero card per route. Answer sentence first,
 * the number second, a visual at 160 (136 below
 * 768), one primary action. `loading` renders SkeletonHero, `empty` renders an
 * EmptyState in the same box so nothing shifts.
 */
import type { ReactNode } from 'react'
import Card from './Card'
import Badge, { type BadgeTone } from './Badge'
import { SkeletonHero, SkeletonBlock } from './skeletons'
import EmptyState, { type EmptyStateProps } from '../EmptyState'

export interface HeroAnswerProps {
  value?: ReactNode
  unit?: ReactNode
  badge?: { label: string; tone: BadgeTone; glyph?: ReactNode }
  answer: ReactNode
  context?: ReactNode
  visual?: ReactNode
  action?: ReactNode
  secondaryAction?: ReactNode
  children?: ReactNode
  loading?: boolean
  empty?: EmptyStateProps
}

export default function HeroAnswer({
  value, unit, badge, answer, context, visual, action, secondaryAction, children, loading, empty,
}: HeroAnswerProps) {
  if (loading) {
    // With a visual the skeleton keeps the dial box; without one it is content height.
    if (visual) return <SkeletonHero />
    return (
      <Card pad="feature" aria-hidden="true">
        <div className="space-y-3">
          <SkeletonBlock className="h-10 w-28" />
          <SkeletonBlock className="h-6 w-full max-w-[56ch]" />
          <SkeletonBlock className="h-4 w-2/3 max-w-[40ch]" />
        </div>
      </Card>
    )
  }
  if (empty) {
    return (
      <Card pad="feature" className="card-accent-top min-h-[280px] md:min-h-[240px] flex items-center justify-center">
        <EmptyState {...empty} minHeight={empty.minHeight} />
      </Card>
    )
  }
  const hasValue = value !== undefined && value !== null
  return (
    <Card pad="feature" className={visual ? 'card-accent-top min-h-[280px] md:min-h-[240px]' : 'card-accent-top'}>
      <div className="flex flex-col gap-6 md:flex-row md:items-center">
        {visual && <div className="shrink-0 flex justify-center md:justify-start">{visual}</div>}
        <div className="min-w-0 flex-1">
          {(hasValue || badge) && (
            <div className="mb-2 flex flex-wrap items-baseline gap-x-2 gap-y-1">
              {hasValue && (
                <p className={`flex items-baseline ${unit === '%' ? 'gap-0.5' : 'gap-1'} tabular-nums m-0`}>
                  <span className="text-display-sm md:text-display text-ink tabular-nums">{value}</span>
                  <span className="sr-only">{' '}</span>
                  {unit && <span className="text-meta text-ink-3">{unit}</span>}
                </p>
              )}
              {badge && <Badge tone={badge.tone} glyph={badge.glyph}>{badge.label}</Badge>}
            </div>
          )}
          <p className="m-0 text-answer-sm md:text-answer text-ink max-w-[56ch]">{answer}</p>
          {context && <p className="mt-2 mb-0 text-body text-ink-2 max-w-[64ch]">{context}</p>}
          {children && <div className="mt-4">{children}</div>}
          {(action || secondaryAction) && (
            <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-center">
              {action}
              {secondaryAction}
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}
