/**
 * src/components/EmptyState.tsx
 * Shared empty/error state for a card, chart, or table
 * (dashboard-visual-system.md section 11, phase3 spec 7.5). Name the
 * destination AND link to it, don't just name it in prose.
 *
 * Two rules this component exists to enforce:
 *   1. Never render a zero as though it were a measurement: this is for the
 *      EMPTY state, not a disguised "0%".
 *   2. Every empty and error state has at least one focusable control that
 *      leads somewhere.
 *
 * Existing props stay as they were. `variant` is new: 'inline' (default) keeps
 * the compact in-card layout, 'page' is the full-route layout.
 */
import { Link } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'
import { ArrowRight } from 'lucide-react'
import { buttonClasses } from './ui/Button'

export interface EmptyStateProps {
  icon?: LucideIcon
  title?: string
  body: string
  actionLabel?: string
  actionTo?: string
  onAction?: () => void
  /** Match the final layout's height so the card doesn't resize when data arrives. */
  minHeight?: number
  /** Render the negative/error tone (neg icon) instead of the neutral empty tone. */
  tone?: 'empty' | 'error'
  /** 'inline' sits inside a card (min height 160); 'page' fills a route. */
  variant?: 'page' | 'inline'
  className?: string
}

export default function EmptyState({
  icon: Icon, title, body, actionLabel, actionTo, onAction, minHeight, tone = 'empty', variant = 'inline', className = '',
}: EmptyStateProps) {
  const action = actionLabel && (actionTo || onAction) ? (
    actionTo ? (
      <Link to={actionTo} className={buttonClasses('secondary', 'md')}>
        {actionLabel} <ArrowRight size={14} aria-hidden="true" />
      </Link>
    ) : (
      <button type="button" onClick={onAction} className={buttonClasses('secondary', 'md')}>
        {actionLabel} <ArrowRight size={14} aria-hidden="true" />
      </button>
    )
  ) : null

  const base = variant === 'page' ? 'min-h-[320px] py-16' : 'min-h-[160px] py-8'

  return (
    <div
      className={`flex flex-col items-center justify-center text-center px-4 ${base} ${className}`}
      style={minHeight ? { minHeight } : undefined}
    >
      {Icon && (
        <div className="w-10 h-10 rounded-control flex items-center justify-center mb-3 bg-surface-3">
          <Icon size={20} aria-hidden="true" className={tone === 'error' ? 'text-neg' : 'text-ink-3'} />
        </div>
      )}
      {title && <div className="text-heading text-ink mb-1">{title}</div>}
      <p className="text-body text-ink-2 max-w-[48ch] mb-4">{body}</p>
      {action}
    </div>
  )
}
