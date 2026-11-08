import { AlertTriangle } from 'lucide-react'

/**
 * Retry banner for a failed data load. Same look as the banner on the AI
 * Visibility prompt area. Use it where the empty state would otherwise say
 * "no data yet", so a failed read never reads as an empty account.
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
    <div
      role="alert"
      className={`mb-4 flex flex-wrap items-center gap-3 rounded-lg border border-dark-700 bg-dark-800 p-3 ${className}`.trim()}
    >
      <AlertTriangle size={16} aria-hidden="true" className="shrink-0 text-amber-400" />
      <span className="text-sm text-slate-200">{message}</span>
      <button
        type="button"
        onClick={onRetry}
        className="ml-auto min-h-[44px] px-3 rounded-lg text-sm font-medium border border-dark-600 bg-dark-700 text-slate-200 hover:border-dark-500"
      >
        {retryLabel}
      </button>
    </div>
  )
}
