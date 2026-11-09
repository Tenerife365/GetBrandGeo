/**
 * HeroAnswer (spec 7.2): the one hero card per route. Answer sentence first,
 * the number second (as a labelled paragraph), a visual at 160 (136 below
 * 768), one primary action. `loading` renders SkeletonHero, `empty` renders an
 * EmptyState in the same box so nothing shifts.
 */
import type { ReactNode } from 'react'
import Card from './Card'
import Badge, { type BadgeTone } from './Badge'
import { SkeletonHero } from './skeletons'
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
  if (loading) return <SkeletonHero />
  if (empty) {
    return (
      <Card pad="feature" className="min-h-[280px] md:min-h-[240px] flex items-center justify-center">
        <EmptyState {...empty} minHeight={empty.minHeight} />
      </Card>
    )
  }
  const hasValue = value !== undefined && value !== null
  return (
    <Card pad="feature" className="min-h-[280px] md:min-h-[240px]">
      <div className="flex flex-col gap-6 md:flex-row md:items-center">
        {visual && <div className="shrink-0 flex justify-center md:justify-start">{visual}</div>}
        <div className="min-w-0 flex-1">
          {(hasValue || badge) && (
            <div className="mb-2 flex flex-wrap items-baseline gap-x-2 gap-y-1">
              {hasValue && (
                <p aria-label={typeof value === 'string' || typeof value === 'number' ? `${value}${typeof unit === 'string' ? unit : ''}` : undefined} className="flex items-baseline gap-1 tabular-nums m-0">
                  <span className="text-display-sm md:text-display text-ink">{value}</span>
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
