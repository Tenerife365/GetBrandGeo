/**
 * The affiliate admin's headline numbers, shared with the sidebar. The
 * Affiliates page publishes its overview here after each load; Layout reads
 * it while the route is /affiliates so the sidebar shows affiliate data
 * instead of the AI visibility tools. A module store rather than context,
 * because the page renders inside Layout and its effects run first.
 */
import { useSyncExternalStore } from 'react'
import type { AdminOverview } from '../types/affiliate'

export const AFFILIATE_TABS = [
  { id: 'programs', label: 'Programs' },
  { id: 'affiliates', label: 'Affiliates & applications' },
  { id: 'conversions', label: 'Conversions & commissions' },
  { id: 'payouts', label: 'Payouts' },
  { id: 'activity', label: 'Clicks & audit' },
] as const

export type AffiliateTab = (typeof AFFILIATE_TABS)[number]['id']

/** The tab a location hash points at; #applications is an old alias of affiliates. */
export function affiliateTabOf(hash: string): AffiliateTab {
  const h = hash.replace(/^#/, '')
  if (h === 'applications') return 'affiliates'
  return (AFFILIATE_TABS.find((t) => t.id === h)?.id || 'programs') as AffiliateTab
}

let overview: AdminOverview | null = null
const listeners = new Set<() => void>()

export function publishAffiliateOverview(next: AdminOverview | null) {
  overview = next
  listeners.forEach((l) => l())
}

function subscribe(l: () => void) {
  listeners.add(l)
  return () => { listeners.delete(l) }
}

export function useAffiliateOverview(): AdminOverview | null {
  return useSyncExternalStore(subscribe, () => overview, () => overview)
}

/** What the admin owes partners now (approved plus payable), one string per currency. */
export function owedLabel(o: AdminOverview | null): string {
  if (!o) return ''
  return Object.entries(o.totals).map(([cur, t]) => `${cur} ${(Number(t.approved || 0) + Number(t.payable || 0)).toFixed(2)}`).join(' · ') || '0.00'
}
