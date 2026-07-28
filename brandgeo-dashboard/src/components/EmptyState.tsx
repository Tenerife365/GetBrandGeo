/**
 * src/components/EmptyState.tsx
 * Shared empty/error state for a card, chart, or table
 * (dashboard-visual-system.md §11). Modelled on FeatureLocked.tsx, which the
 * audit named the best empty state already in the app: name the destination
 * AND link to it, don't just name it in prose.
 *
 * This replaces five prose-only empty states (F-05/F-12) that told the reader
 * to "run a collection from the AI Visibility tab" or "add prompts in the
 * Prompts tab" with no control anywhere on the page — /sentiment at zero data
 * measured zero buttons and zero links before this existed.
 *
 * Two rules from §11 this component exists to enforce:
 *   1. Never render a zero as though it were a measurement — this is for the
 *      EMPTY state, not a disguised "0%".
 *   2. Every empty and error state has at least one focusable control that
 *      leads somewhere.
 */
import { Link } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'
import { ArrowRight } from 'lucide-react'

interface EmptyStateProps {
  icon?: LucideIcon
  title?: string
  body: string
  actionLabel?: string
  actionTo?: string
  onAction?: () => void
  /** Match the final layout's height so the card doesn't resize when data arrives. */
  minHeight?: number
  /** Render the negative/error tone (red icon tile) instead of the neutral empty tone. */
  tone?: 'empty' | 'error'
  className?: string
}

export default function EmptyState({
  icon: Icon, title, body, actionLabel, actionTo, onAction, minHeight, tone = 'empty', className = '',
}: EmptyStateProps) {
  const action = actionLabel && (actionTo || onAction) ? (
    actionTo ? (
      <Link
        to={actionTo}
        className="inline-flex items-center justify-center gap-1.5 min-h-[40px] px-4 rounded-control text-sm font-medium bg-brand-500/15 text-brand-300 hover:bg-brand-500/25 border border-brand-500/20 transition-colors"
      >
        {actionLabel} <ArrowRight size={14} />
      </Link>
    ) : (
      <button
        type="button"
        onClick={onAction}
        className="inline-flex items-center justify-center gap-1.5 min-h-[40px] px-4 rounded-control text-sm font-medium bg-brand-500/15 text-brand-300 hover:bg-brand-500/25 border border-brand-500/20 transition-colors"
      >
        {actionLabel} <ArrowRight size={14} />
      </button>
    )
  ) : null

  return (
    <div
      className={`flex flex-col items-center justify-center text-center py-10 px-4 ${className}`}
      style={minHeight ? { minHeight } : undefined}
    >
      {Icon && (
        <div className={`w-11 h-11 rounded-full flex items-center justify-center mb-3 ${
          tone === 'error' ? 'bg-sentiment-negative-15 border border-sentiment-negative-30' : 'bg-dark-700/60 border border-dark-600'
        }`}>
          <Icon size={18} className={tone === 'error' ? 'text-sentiment-negative' : 'text-slate-500'} />
        </div>
      )}
      {title && <div className="text-sm font-medium text-slate-300 mb-1">{title}</div>}
      <p className="text-xs text-slate-500 max-w-xs leading-relaxed mb-4">{body}</p>
      {action}
    </div>
  )
}
