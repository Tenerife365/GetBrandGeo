/**
 * AllowanceMeter.tsx — small reusable "used / cap" meter for plan-gated
 * quantities (collection budget €, SEO pages/drafts, Social posts/channel).
 * PRICING-STRATEGY-2026-07.md §12 T2a.
 *
 * Read-only display component — callers own the underlying counts (each page
 * mirrors the exact query its enforcing Netlify function uses, so the number
 * shown here always matches what the server will actually block on).
 */
export function AllowanceMeter({
  label,
  used,
  cap,
  format = (n: number) => String(n),
  hideWhenUnlimited = false,
}: {
  label: string
  used: number
  cap: number
  format?: (n: number) => string
  hideWhenUnlimited?: boolean
}) {
  // cap <= 0 means the feature is locked entirely — nothing to meter.
  if (cap <= 0) return null
  // Some plans (managed/pro/enterprise) carry generous placeholder caps that
  // are effectively "unlimited" for display purposes — let callers hide the
  // meter for those rather than show a misleading near-empty bar.
  if (hideWhenUnlimited) return null

  const pct = Math.min(100, Math.round((used / cap) * 100))
  const state = pct >= 100 ? 'full' : pct >= 85 ? 'warn' : 'ok'
  const barColor = state === 'full' ? 'bg-rose-500' : state === 'warn' ? 'bg-amber-400' : 'bg-brand-500'
  const textColor = state === 'full' ? 'text-rose-400' : state === 'warn' ? 'text-amber-400' : 'text-slate-400'

  return (
    <div className="min-w-[140px]">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[11px] text-slate-500 uppercase tracking-wide font-medium">{label}</span>
        <span className={`text-[11px] tabular-nums font-medium ${textColor}`}>
          {format(used)} / {format(cap)}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-dark-700 overflow-hidden">
        <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

export default AllowanceMeter
