import Card from './ui/Card'
import StatusGlyph from './ui/StatusGlyph'
import { buttonClasses } from './ui/Button'

/**
 * Retry banner for a failed data load. Use it where the empty state would
 * otherwise say "no data yet", so a failed read never reads as an empty
 * account. Card standard, neg glyph, Retry as a secondary button.
 */
interface LoadErrorCardProps {
  message?: string
  onRetry: () => void
  retryLabel?: string
  className?: string
}

export default function LoadErrorCard({
  message = "Couldn't load these results. Check your connection and try again.",
  onRetry,
  retryLabel = 'Retry',
  className = '',
}: LoadErrorCardProps) {
  return (
    <Card role="alert" className={`mb-4 flex flex-wrap items-center gap-3 border-line ${className}`.trim()}>
      <StatusGlyph kind="neg" size={16} className="shrink-0 text-neg" />
      <span className="text-body text-ink">{message}</span>
      <button type="button" onClick={onRetry} className={`ml-auto ${buttonClasses('secondary', 'md')}`}>
        {retryLabel}
      </button>
    </Card>
  )
}
