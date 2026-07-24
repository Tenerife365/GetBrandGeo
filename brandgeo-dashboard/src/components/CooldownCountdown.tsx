/**
 * CooldownCountdown.tsx — live "next available in Xh Ym" countdown for a
 * plan-gated frequency limit (collection run cooldown, SEO weekly crawl).
 * PRICING-STRATEGY-2026-07.md §12 T2a.
 *
 * Ticks locally off `nextAvailableAt` so it doesn't need to re-poll the
 * server every second — the enforcing endpoint (enqueue-collection.js /
 * seo-crawl.js) is still the source of truth at click time; this is display
 * only. Renders nothing once the deadline passes (caller's button just
 * becomes enabled again on its own gating logic / next data refresh).
 */
import { useEffect, useState } from 'react'
import { Clock } from 'lucide-react'

function formatRemaining(ms: number): string {
  if (ms <= 0) return 'Available now'
  const totalMinutes = Math.ceil(ms / 60000)
  const days = Math.floor(totalMinutes / 1440)
  const hours = Math.floor((totalMinutes % 1440) / 60)
  const minutes = totalMinutes % 60
  if (days > 0) return `${days}d ${hours}h`
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes}m`
}

export function CooldownCountdown({
  nextAvailableAt,
  label = 'Next run available in',
}: {
  nextAvailableAt: string | null
  label?: string
}) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (!nextAvailableAt) return
    const id = setInterval(() => setNow(Date.now()), 30_000)
    return () => clearInterval(id)
  }, [nextAvailableAt])

  if (!nextAvailableAt) return null
  const remainingMs = new Date(nextAvailableAt).getTime() - now
  if (remainingMs <= 0) return null

  return (
    <div className="inline-flex items-center gap-1.5 text-xs text-amber-400/90 bg-amber-400/10 border border-amber-400/20 rounded-lg px-2.5 py-1">
      <Clock size={12} />
      <span>{label} <span className="font-medium tabular-nums">{formatRemaining(remainingMs)}</span></span>
    </div>
  )
}

export default CooldownCountdown
