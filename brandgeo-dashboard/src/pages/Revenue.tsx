/**
 * Revenue.tsx — Admin-only Usage / Cost / Revenue page (sprint task S21,
 * docs/growth/SPRINT-100-KICKOFFS-2026-07-31.md; data contract
 * docs/arch/revenue-report-data-contract.md).
 *
 * Renamed from Usage.tsx (which used to be the whole page). Its original
 * content is unchanged and now lives inside the "Cost" tab; a lighter
 * "Usage" tab derives from the same fetched rows to show response COUNTS
 * without the EUR column, which used to share one table. "Revenue" is new:
 * it calls the admin-only revenue-report.js function (Stripe-backed) rather
 * than reading ai_results directly — money is Stripe's number, not ours.
 *
 * The Cost tab and the Revenue tab's "estimated API cost" line MUST always
 * agree, because both read the same per-row `cost_eur` (metered) with the
 * same legacy flat-estimate fallback — see the contract §5. Nobody should
 * ever see two different cost figures on the same page.
 */

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  DollarSign, TrendingUp, Cpu, Receipt, Percent, Users, AlertTriangle, Loader2, Target,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useClient } from '../lib/clientContext'
import { useTimeFilter } from '../lib/timeFilterContext'
import { ENGINE_META, ENGINE_COST_EUR, PLAN_LABELS, type EngineId, type Plan } from '../lib/planConfig'
import { PageTitle, SectionHeading } from '../components/Typography'
import { useChartTheme } from '../lib/chartTheme'

/**
 * EUR cost per response, per engine — sourced from planConfig.ts's
 * ENGINE_COST_EUR (SCALE-SPEC.md §2.1), not a local copy. This used to be its
 * own hand-maintained table here, duplicated a second time in
 * _prospect_engines.js, and (until the cost_eur metering work landed
 * 2026-07-13) not applied at all to the actual ai_results rows it estimates
 * from. All three now read the same numbers — see planConfig.ts /
 * netlify/functions/_cost.js for the full pricing derivation and confidence
 * notes (gemini LOW confidence, chatgpt MEDIUM, the rest HIGH).
 *
 * Re-typed to a plain string-keyed Record here (planConfig.ts's version is
 * keyed by the EngineId union so it can't silently typo an engine name) so
 * every existing lookup/iteration below — which indexes by whatever `llm`
 * string comes back from Supabase — keeps working unchanged.
 */
const ENGINE_COST: Record<string, number> = ENGINE_COST_EUR as Record<string, number>
// => 5-engine check ≈ €0.137 at the rebuilt 2026-07-29 prices. Batching
//    (SCALE-SPEC §1.1b step 4) would reduce it, but that needs the §3 collection
//    queue first — not built yet.

// ⚠️ CORRECTION 2026-07-29. This comment block used to claim "the cost_eur
// column now meters this per row for real". That was not true: costForRow()
// returned a flat per-engine constant and wrote it to the column, so every row
// for a given engine carried an identical value (verified in production —
// count(distinct cost_eur) was 1 for all six engines). The database stored the
// estimate; it did not measure anything.
//
// Metering is real as of 2026-07-29. Every collect function now captures the
// token usage its provider already returned and was previously discarding, and
// _cost.js prices it per call. Rows written from that point carry a measured
// figure; rows written before it fall back to ENGINE_COST.
//
// TWO CAVEATS THE UI MUST KEEP HONEST:
//  1. gemini and google_ai are FIXED-FEE (see FIXED_FEE_ENGINES). Gemini
//     grounding is free under 1,500 requests/day and SerpApi is a monthly
//     subscription whose unused searches expire, so neither has a meaningful
//     per-call marginal cost. Their figures are accounting allocations.
//  2. The old per-engine attribution was wrong in both directions — claude 3.3x
//     under, perplexity 5x over — even though the total was within 8%. Any
//     historical per-engine breakdown on this page that predates metering
//     inherits that error. Read pre-metering rows as an order of magnitude.
//
// Platform overhead (Supabase/Netlify/etc.) is deliberately not folded in here:
// this card is API spend, which is the number that was in dispute.

// ENGINE_META's colour / bg fields no longer exist (dashboard-visual-system.md §8.4 —
// engine identity is a swatch in ENGINE_META[id].chartColor, never coloured
// text). This table cell/legend below reads chartColor directly per row via
// `engineSwatch()` instead of keeping a second colour lookup. The fallback (an
// id ENGINE_META doesn't recognise, defensive only — every real id here comes
// from ENGINE_COST's own keys) resolves from the live chart theme rather than
// a hand-typed hex, so no engine/sentiment hex sits outside planConfig.ts or
// the chart-theme module (§17 V5).
function engineSwatch(id: string, fallback: string): string {
  return ENGINE_META[id as EngineId]?.chartColor ?? fallback
}

interface ClientUsage {
  clientId: number
  clientName: string
  byEngine: Record<string, number>
  totalResponses: number
  totalCost: number       // real metered spend: sum(cost_eur), flat estimate only for legacy rows
  estimatedResponses: number  // rows with a NULL cost_eur (pre-metering) — counted via flat estimate
  internal?: boolean      // our own spend, not a customer's. See RESEARCH_ROW_ID.
}

/**
 * Synthetic client id for the collapsed research row. Negative so it can never
 * collide with a real clients.id (serial, always positive), which matters
 * because it is used as a React key alongside real ids.
 */
const RESEARCH_ROW_ID = -1

/**
 * Collapse every `category = 'research'` client into one row.
 *
 * There are 27 of these, one per city study, and they drowned the eight real
 * customers in the table. They are also not customers: we trigger every one of
 * those runs ourselves, so per-city lines answer a question nobody asks, while
 * the question that IS asked, "what does research cost us in total", could only
 * be got by adding 27 numbers by hand.
 *
 * Done as a derivation over the already-fetched rows rather than inside the
 * query, deliberately. The load effect does not depend on `clients` (it keys
 * off isAdmin and timeRange), so a client list that arrives after the usage
 * data would have produced a table with the grouping silently not applied.
 * Deriving here means the grouping is always consistent with whatever client
 * list is currently loaded, and no refetch is needed when it changes.
 *
 * Cost is untouched: the collapsed row sums its members exactly, so the table
 * total is the same number before and after grouping.
 */
function collapseResearch(rows: ClientUsage[], clients: { id: number; category?: string | null }[]): ClientUsage[] {
  const researchIds = new Set(clients.filter(c => c.category === 'research').map(c => c.id))
  if (researchIds.size === 0) return rows

  const research = rows.filter(r => researchIds.has(r.clientId))
  if (research.length === 0) return rows

  const merged: ClientUsage = {
    clientId: RESEARCH_ROW_ID,
    clientName: `Research (${research.length} ${research.length === 1 ? 'city' : 'cities'})`,
    byEngine: {},
    totalResponses: 0,
    totalCost: 0,
    estimatedResponses: 0,
    internal: true,
  }
  for (const r of research) {
    for (const [engine, n] of Object.entries(r.byEngine)) {
      merged.byEngine[engine] = (merged.byEngine[engine] ?? 0) + n
    }
    merged.totalResponses += r.totalResponses
    merged.totalCost += r.totalCost
    merged.estimatedResponses += r.estimatedResponses
  }

  return [...rows.filter(r => !researchIds.has(r.clientId)), merged]
    .sort((a, b) => b.totalCost - a.totalCost)
}

// ── Revenue tab — types match docs/arch/revenue-report-data-contract.md §6b
// exactly. Keep in sync with that file if the contract changes; it is the
// binding source, this is its TS mirror for the fetch response.
interface RevenuePeriod { start: string; end: string; label: string }
interface RevenueTotals {
  grossInvoicedEur: number
  paidRevenueEur: number
  refundsEur: number
  discountsEur: number
  affiliateCommissionEstEur: number
  estimatedApiCostEur: number
  netRevenueEur: number
}
interface RevenueByPlan extends RevenueTotals { plan: string; invoiceCount: number }
// A 4th value beyond contract §6b's stated enum (backend handoff item 1):
// `null` is a client with API spend and no Stripe customer to even ask the
// attribution question about (a research study, a free signup) — NOT the
// same as `unattributed`, which means Stripe money that could not be
// matched to a client. Conflating the two would raise a false alarm on
// every cost-only row.
type Attribution = 'metadata' | 'stripe_customer_id' | 'unattributed' | null
interface RevenueByClient extends RevenueTotals {
  clientId: number | null
  clientName: string
  plan: string | null
  attribution: Attribution
  stripeCustomerId: string | null
  // Additive beyond contract §6b's worked example (§10 item 3) -- the
  // backend returns it (aggregateRevenue's byClient rows), matching byPlan.
  invoiceCount: number
}
interface PipelineClient {
  clientId: number
  clientName: string
  plan: string
  distinctActiveWeeks: number
  lastActiveAt: string | null
  opportunityMonthlyEur: number | null
  nextPlan: string | null
  // Additive beyond contract §6b (backend handoff item 7): the >= threshold
  // the pipeline itself applies, precomputed so the UI can never apply a
  // different bar than the report does. computeEngagementPipeline() returns
  // every free client with ANY activity in the window, not just the engaged
  // ones — filter on this before showing anything as a campaign target.
  engaged: boolean
}
interface AffiliateRow {
  affiliateCode: string
  redemptions: number
  attributedClients: number
  commissionAccruedEur: number
}
interface RevenueReport {
  period: RevenuePeriod
  global: RevenueTotals
  byPlan: RevenueByPlan[]
  byClient: RevenueByClient[]
  pipeline: { windowDays: number; engagedThresholdWeeks: number; clients: PipelineClient[] }
  affiliates: AffiliateRow[]
  // stripeAccountId / liveMode are null when the account could not be read
  // (revenue-report.js:321-334) -- not always present, per the CQO review.
  meta: { generatedAt: string; stripeAccountId: string | null; liveMode: boolean | null; warnings: string[] }
}

/** Same authenticated-POST pattern PromotionsPanel.tsx already uses against
 *  its own admin function — one Authorization header shape for every
 *  admin-only Netlify function in this app. */
async function authedPost<T>(fn: string, body: unknown): Promise<{ status: number; data: T | null }> {
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token ?? ''
  const res = await fetch(`/.netlify/functions/${fn}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => null)
  return { status: res.status, data }
}

const eur = (n: number) => `€${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const planLabel = (p: string | null) => (p && p in PLAN_LABELS ? PLAN_LABELS[p as Plan] : (p ?? 'Unknown'))

/** Function, not an object keyed by Attribution — `null` is a real member of
 *  that union and cannot be an object key, so a lookup table would render a
 *  blank pill for the "cost only, no Stripe customer" case. */
function attributionLabel(a: Attribution): string {
  switch (a) {
    case 'metadata': return 'Matched (Stripe metadata)'
    case 'stripe_customer_id': return 'Matched (client record)'
    case 'unattributed': return 'Unattributed'
    case null: return 'No Stripe activity'
  }
}

function AttributionBadge({ attribution }: { attribution: Attribution }) {
  const warn = attribution === 'unattributed'
  return (
    <span
      className={[
        'text-[10px] uppercase tracking-wide font-semibold px-1.5 py-0.5 rounded border',
        warn
          ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
          : 'bg-dark-700 text-slate-400 border-dark-600',
      ].join(' ')}
      title={warn ? 'This Stripe money could not be matched to a client row — shown in totals but not attributed to anyone.' : undefined}
    >
      {attributionLabel(attribution)}
    </span>
  )
}

type Tab = 'usage' | 'cost' | 'revenue'

export default function Revenue() {
  const { isAdmin, clients } = useClient()
  const { getStartDate, timeRange } = useTimeFilter()
  const chart = useChartTheme()
  const [rows, setRows] = useState<ClientUsage[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('revenue')

  // ── Revenue tab state — the effect below fires on `tab` becoming
  // 'revenue', not unconditionally on mount, so switching to Usage or Cost
  // instead never pays for a Stripe round trip. That guard does NOT save the
  // round trip on a normal page load, though (CQO review F11): `tab` above
  // defaults to 'revenue' itself, which is the intended landing view per
  // Constantin's ask ("so net revenue is understood properly"), so opening
  // /usage still pages the full Stripe invoice history immediately.
  const [revenue, setRevenue] = useState<RevenueReport | null>(null)
  const [revenueLoading, setRevenueLoading] = useState(false)
  const [revenueUnavailable, setRevenueUnavailable] = useState(false)
  const [revenueError, setRevenueError] = useState<string | null>(null)

  useEffect(() => {
    if (!isAdmin) return
    const load = async () => {
      setLoading(true)
      // Real metered spend: cost_eur is written per row at collection time
      // (SCALE-SPEC.md §2.1 / _cost.js), so we SUM it instead of recomputing a flat
      // estimate × row count — that estimate was the whole reason "the table" read
      // lower than the actual bill. Rows collected before metering landed have a NULL
      // cost_eur; those fall back to the flat per-engine estimate and are counted so we
      // can show how much of the total is real vs. estimated.
      let q = supabase.from('ai_results').select('client_id, llm, cost_eur')
      const startDate = getStartDate()
      if (startDate) q = q.gte('checked_at', startDate.toISOString())
      const { data } = await q

      if (!data) { setLoading(false); return }

      type Acc = { byEngine: Record<string, number>; cost: number; estimated: number }
      const byClient: Record<number, Acc> = {}
      for (const row of data) {
        const cid = row.client_id as number
        const llm = row.llm as string
        const acc = byClient[cid] ?? (byClient[cid] = { byEngine: {}, cost: 0, estimated: 0 })
        acc.byEngine[llm] = (acc.byEngine[llm] ?? 0) + 1
        const metered = (row as { cost_eur: number | null }).cost_eur
        if (metered != null) {
          acc.cost += metered
        } else {
          acc.cost += ENGINE_COST[llm] ?? 0   // legacy fallback (flat estimate)
          acc.estimated += 1
        }
      }

      const result: ClientUsage[] = Object.entries(byClient).map(([cid, acc]) => {
        const clientId = Number(cid)
        const clientName = clients.find(c => c.id === clientId)?.name ?? `Client ${clientId}`
        const totalResponses = Object.values(acc.byEngine).reduce((a, b) => a + b, 0)
        return {
          clientId, clientName, byEngine: acc.byEngine, totalResponses,
          totalCost: acc.cost, estimatedResponses: acc.estimated,
        }
      }).sort((a, b) => b.totalCost - a.totalCost)

      setRows(result)
      setLoading(false)
    }
    load()
  }, [isAdmin, timeRange]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!isAdmin || tab !== 'revenue' || revenue || revenueLoading) return
    const load = async () => {
      setRevenueLoading(true)
      setRevenueError(null)
      const { status, data } = await authedPost<RevenueReport & { error?: string }>('revenue-report', {})
      if (status === 404) { setRevenueUnavailable(true); setRevenueLoading(false); return }
      if (status !== 200 || !data || 'error' in data) {
        setRevenueError((data as { error?: string } | null)?.error || `Revenue report failed (status ${status}).`)
        setRevenueLoading(false)
        return
      }
      setRevenueUnavailable(false)
      setRevenue(data)
      setRevenueLoading(false)
    }
    load()
  }, [isAdmin, tab]) // eslint-disable-line react-hooks/exhaustive-deps

  // A viewer who reaches /usage by URL used to get a blank screen. The route is
  // hidden from their sidebar and the data is enforced server-side regardless,
  // so this is presentation only — it explains and offers a way out, matching
  // Onboard.tsx's handling of the same case.
  if (!isAdmin) return (
    <div className="p-8 text-slate-500 text-sm">
      Access restricted to admins.{' '}
      <Link to="/" className="text-brand-400 hover:text-brand-300 font-medium">Back to Dashboard</Link>
    </div>
  )

  // What the table shows: research collapsed to one line. Totals are computed
  // from THIS list, not from `rows`, so the footer always sums the rows above
  // it. The two are equal by construction today; computing from what is
  // rendered keeps that true if the grouping ever changes.
  const displayRows = collapseResearch(rows, clients)

  const grandTotal     = displayRows.reduce((s, r) => s + r.totalCost, 0)
  const grandResponses = displayRows.reduce((s, r) => s + r.totalResponses, 0)
  const grandEstimated = displayRows.reduce((s, r) => s + r.estimatedResponses, 0)

  // The average card covers CUSTOMERS only. Including the collapsed research
  // row would divide our own internal spend across a client count it is not
  // part of, and the number would silently have changed meaning the moment the
  // grouping landed. Research is reported as its own figure below instead.
  const customerRows      = displayRows.filter(r => !r.internal)
  const customerTotal     = customerRows.reduce((s, r) => s + r.totalCost, 0)
  const researchTotal     = displayRows.filter(r => r.internal).reduce((s, r) => s + r.totalCost, 0)

  const tabs: { id: Tab; label: string }[] = [
    { id: 'usage', label: 'Usage' },
    { id: 'cost', label: 'Cost' },
    { id: 'revenue', label: 'Revenue' },
  ]

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-5xl mx-auto">

      <div className="mb-6">
        <PageTitle>Revenue</PageTitle>
        <p className="text-sm text-slate-400 mt-0.5">
          What plans are selling, what has been invoiced and paid, and what it costs to run — usage, cost and revenue in one place
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-dark-700" role="tablist" aria-label="Revenue sections">
        {tabs.map(tb => (
          <button
            key={tb.id}
            role="tab"
            aria-selected={tab === tb.id}
            onClick={() => setTab(tb.id)}
            className={[
              'px-4 py-2.5 text-sm rounded-t-lg border-b-2 -mb-px transition-colors',
              tab === tb.id
                ? 'border-brand-400 text-brand-300 font-medium'
                : 'border-transparent text-slate-400 hover:text-slate-200',
            ].join(' ')}
          >
            {tb.label}
          </button>
        ))}
      </div>

      {/* ── USAGE ─────────────────────────────────────────────────────────── */}
      {tab === 'usage' && (
        <section>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-dark-800 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <Cpu size={15} className="text-blue-400" />
                <span className="text-xs text-slate-400 uppercase tracking-wide font-medium">Total Responses</span>
              </div>
              <div className="text-2xl font-bold text-white tabular-nums">{grandResponses.toLocaleString()}</div>
              <p className="text-xs text-slate-500 mt-1">LLM responses collected</p>
            </div>
            <div className="bg-dark-800 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp size={15} className="text-brand-400" />
                <span className="text-xs text-slate-400 uppercase tracking-wide font-medium">Avg per Client</span>
              </div>
              {customerRows.length > 0
                ? <div className="text-2xl font-bold text-white tabular-nums">
                    {Math.round(customerRows.reduce((s, r) => s + r.totalResponses, 0) / customerRows.length).toLocaleString()}
                  </div>
                : <div className="h-8 flex items-end text-sm italic text-slate-300 leading-snug">No clients yet</div>}
              <p className="text-xs text-slate-500 mt-1">{customerRows.length} client{customerRows.length !== 1 ? 's' : ''}</p>
            </div>
          </div>

          <div className="bg-dark-800 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-dark-700 text-xs font-medium text-slate-400 uppercase tracking-wide">
              Responses per client, per engine
            </div>
            {loading ? (
              <div className="py-12 text-center text-slate-500 text-sm animate-pulse">Loading usage data…</div>
            ) : displayRows.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-sm">No data for selected period</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-dark-700/50">
                      <th className="px-4 py-3 text-left text-xs text-slate-500 font-medium">Client</th>
                      {Object.keys(ENGINE_COST).map(e => (
                        <th key={e} className="px-3 py-3 text-center text-xs text-slate-500 font-medium capitalize">
                          <span className="inline-flex items-center gap-1.5">
                            <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: engineSwatch(e, chart.sentimentNeutral) }} />
                            {e}
                          </span>
                        </th>
                      ))}
                      <th className="px-4 py-3 text-right text-xs text-slate-500 font-medium">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayRows.map(r => (
                      <tr key={r.clientId} className="border-b border-dark-700/30 hover:bg-dark-700/20 transition-colors">
                        <td className="px-4 py-3 font-medium text-slate-200">
                          <span className="inline-flex items-center gap-2 flex-wrap">
                            {r.clientName}
                            {r.internal && (
                              <span className="text-[10px] uppercase tracking-wide font-semibold px-1.5 py-0.5 rounded bg-dark-700 text-slate-400 border border-dark-600">
                                Internal
                              </span>
                            )}
                          </span>
                        </td>
                        {Object.keys(ENGINE_COST).map(e => (
                          <td key={e} className="px-3 py-3 text-center tabular-nums text-slate-400">
                            {r.byEngine[e] ?? 0}
                          </td>
                        ))}
                        <td className="px-4 py-3 text-right font-semibold text-slate-200 tabular-nums">{r.totalResponses}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── COST ──────────────────────────────────────────────────────────── */}
      {tab === 'cost' && (
        <section>
          {/* Summary cards */}
          <SectionHeading className="sr-only">Spend summary</SectionHeading>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-dark-800 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign size={15} className="text-emerald-400" />
                <span className="text-xs text-slate-400 uppercase tracking-wide font-medium">API Cost (metered)</span>
              </div>
              <div className="text-2xl font-bold text-emerald-400 tabular-nums">€{grandTotal.toFixed(2)}</div>
              <p className="text-xs text-slate-500 mt-1">
                {grandEstimated > 0
                  ? `across all clients · ${grandEstimated.toLocaleString()} legacy row${grandEstimated === 1 ? '' : 's'} estimated`
                  : 'across all clients · fully metered'}
              </p>
            </div>

            <div className="bg-dark-800 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <Cpu size={15} className="text-blue-400" />
                <span className="text-xs text-slate-400 uppercase tracking-wide font-medium">Total Responses</span>
              </div>
              <div className="text-2xl font-bold text-white tabular-nums">{grandResponses.toLocaleString()}</div>
              <p className="text-xs text-slate-500 mt-1">LLM responses collected</p>
            </div>

            <div className="bg-dark-800 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp size={15} className="text-brand-400" />
                <span className="text-xs text-slate-400 uppercase tracking-wide font-medium">Avg per Client</span>
              </div>
              {/* No clients is an absence, not a dash glyph. Kept in an h-8 box so
                  this card's baseline still lines up with the two beside it. */}
              {customerRows.length > 0
                ? <div className="text-2xl font-bold text-white tabular-nums">
                    €{(customerTotal / customerRows.length).toFixed(2)}
                  </div>
                : <div className="h-8 flex items-end text-sm italic text-slate-300 leading-snug">
                    No clients yet
                  </div>}
              <p className="text-xs text-slate-500 mt-1">
                {customerRows.length} client{customerRows.length !== 1 ? 's' : ''}
                {researchTotal > 0 && (
                  <>, plus €{researchTotal.toFixed(2)} research</>
                )}
              </p>
            </div>
          </div>

          {/* Per-client table */}
          <div className="bg-dark-800 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-dark-700 text-xs font-medium text-slate-400 uppercase tracking-wide">
              Per-client breakdown
            </div>

            {loading ? (
              <div className="py-12 text-center text-slate-500 text-sm animate-pulse">Loading usage data…</div>
            ) : displayRows.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-sm">No data for selected period</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-dark-700/50">
                      <th className="px-4 py-3 text-left text-xs text-slate-500 font-medium">Client</th>
                      <th className="px-3 py-3 text-center text-xs text-slate-500 font-medium">Responses</th>
                      {Object.keys(ENGINE_COST).map(e => (
                        <th key={e} className="px-3 py-3 text-center text-xs text-slate-500 font-medium capitalize">
                          <span className="inline-flex items-center gap-1.5">
                            <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: engineSwatch(e, chart.sentimentNeutral) }} />
                            {e}
                          </span>
                        </th>
                      ))}
                      <th className="px-4 py-3 text-right text-xs text-slate-500 font-medium">Est. Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayRows.map(r => (
                      <tr key={r.clientId} className="border-b border-dark-700/30 hover:bg-dark-700/20 transition-colors">
                        <td className="px-4 py-3 font-medium text-slate-200">
                          <span className="inline-flex items-center gap-2 flex-wrap">
                            {r.clientName}
                            {/* Says why this row is not a customer. Without it the
                                collapsed line reads as one more account and quietly
                                inflates the client count in the reader's head. */}
                            {r.internal && (
                              <span className="text-[10px] uppercase tracking-wide font-semibold px-1.5 py-0.5 rounded bg-dark-700 text-slate-400 border border-dark-600">
                                Internal
                              </span>
                            )}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-center text-slate-400 tabular-nums">{r.totalResponses}</td>
                        {Object.keys(ENGINE_COST).map(e => (
                          <td key={e} className="px-3 py-3 text-center tabular-nums text-slate-400">
                            {r.byEngine[e] ?? 0}
                          </td>
                        ))}
                        <td className="px-4 py-3 text-right font-semibold text-emerald-400 tabular-nums">
                          €{r.totalCost.toFixed(3)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-dark-700 bg-dark-700/20">
                      <td className="px-4 py-3 font-semibold text-slate-300">Total</td>
                      <td className="px-3 py-3 text-center font-semibold text-slate-300 tabular-nums">{grandResponses}</td>
                      {Object.keys(ENGINE_COST).map(e => (
                        <td key={e} className="px-3 py-3 text-center text-slate-400 tabular-nums">
                          {displayRows.reduce((s, r) => s + (r.byEngine[e] ?? 0), 0)}
                        </td>
                      ))}
                      <td className="px-4 py-3 text-right font-bold text-emerald-400 tabular-nums">€{grandTotal.toFixed(2)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>

          {/* Cost legend */}
          <div className="mt-4 p-4 bg-dark-800/50 border border-dark-700/50 rounded-xl">
            <p className="text-xs text-slate-500 mb-2 font-medium">Cost estimates (per response)</p>
            <div className="flex flex-wrap gap-3">
              {Object.entries(ENGINE_COST).map(([engine, cost]) => (
                <div key={engine} className="flex items-center gap-1.5">
                  <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: engineSwatch(engine, chart.sentimentNeutral) }} />
                  <span className="text-xs font-medium capitalize text-slate-300">{engine}</span>
                  <span className="text-xs text-slate-600">€{(cost ?? 0).toFixed(3)}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-600 mt-2">
              EUR, API costs × 1.5 overhead (Supabase, Netlify, hosting, Plausible, domain). Estimates from
              published rate cards, not invoices. Gemini is the least certain (billed per search query).
            </p>
          </div>
        </section>
      )}

      {/* ── REVENUE ───────────────────────────────────────────────────────── */}
      {tab === 'revenue' && (
        <section>
          {revenueLoading && (
            <div className="py-16 flex flex-col items-center gap-2 text-slate-500 text-sm">
              <Loader2 size={18} className="animate-spin" />
              Reading Stripe…
            </div>
          )}

          {!revenueLoading && revenueUnavailable && (
            <div className="bg-dark-800 rounded-xl p-8 text-center text-sm text-slate-400">
              Revenue reporting isn't deployed yet. It ships in the same batch push as the rest of S21.
            </div>
          )}

          {!revenueLoading && !revenueUnavailable && revenueError && (
            <div className="bg-dark-800 rounded-xl p-8 text-center text-sm">
              <AlertTriangle size={18} className="mx-auto mb-2 text-amber-400" />
              <p className="text-slate-300">{revenueError}</p>
            </div>
          )}

          {!revenueLoading && !revenueUnavailable && !revenueError && revenue && (
            <>
              <p className="text-xs text-slate-500 mb-4">
                {revenue.period.label} · Stripe account <span className="text-slate-400">{revenue.meta.stripeAccountId}</span>
                {' · generated '}{new Date(revenue.meta.generatedAt).toLocaleString()}
              </p>

              {revenue.meta.warnings.length > 0 && (
                <div className="mb-6 bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-1.5">
                    <AlertTriangle size={15} className="text-amber-400" />
                    <span className="text-xs font-semibold text-amber-400 uppercase tracking-wide">
                      {revenue.meta.warnings.length} thing{revenue.meta.warnings.length === 1 ? '' : 's'} to check
                    </span>
                  </div>
                  <ul className="text-xs text-amber-200/90 space-y-1 list-disc list-inside">
                    {revenue.meta.warnings.map((w, i) => <li key={i}>{w}</li>)}
                  </ul>
                </div>
              )}

              {/* Headline: net revenue, then the breakdown that gets you there */}
              <div className="bg-dark-800 rounded-xl p-6 mb-6">
                <div className="flex items-center gap-2 mb-1">
                  <Receipt size={15} className="text-brand-400" />
                  <span className="text-xs text-slate-400 uppercase tracking-wide font-medium">Net Revenue</span>
                </div>
                <div className={`text-3xl font-bold tabular-nums ${revenue.global.netRevenueEur >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {eur(revenue.global.netRevenueEur)}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Paid minus refunds, affiliate commission (estimate) and metered API cost
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-5 pt-5 border-t border-dark-700/60">
                  {([
                    ['Gross invoiced', revenue.global.grossInvoicedEur, 'All invoices this period, paid or not'],
                    ['Paid revenue', revenue.global.paidRevenueEur, 'Actually collected'],
                    ['Refunds', -revenue.global.refundsEur, 'Netted out'],
                    ['Discounts / free months', -revenue.global.discountsEur, 'What the ladder gave up'],
                    ['Affiliate commission (est.)', -revenue.global.affiliateCommissionEstEur, 'Provisional — PromoteKit is system of record'],
                    // CQO review F1: this used to say "Same figure as the Cost
                    // tab", which is false -- the Cost tab reads the global
                    // 7d/30d/90d/All time filter (default 7 days) while this
                    // is the calendar month, and until _cost.js and
                    // planConfig.ts's legacy per-engine fallback tables are
                    // reconciled (spawned as its own task) they can disagree
                    // on rows with no metered cost_eur. Same ROWS, not
                    // necessarily the same NUMBER -- say what this actually is.
                    ['Est. API cost', -revenue.global.estimatedApiCostEur, `${revenue.period.label}, metered`],
                  ] as [string, number, string][]).map(([label, value, hint]) => (
                    <div key={label}>
                      <div className="text-xs text-slate-500">{label}</div>
                      <div className={`text-sm font-semibold tabular-nums ${value < 0 ? 'text-slate-300' : 'text-slate-200'}`}>
                        {value < 0 ? `−${eur(Math.abs(value))}` : eur(value)}
                      </div>
                      <div className="text-[11px] text-slate-600">{hint}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Per plan */}
              <div className="bg-dark-800 rounded-xl p-5 mb-6">
                <SectionHeading>Net revenue by plan</SectionHeading>
                {revenue.byPlan.length === 0 ? (
                  <p className="text-sm text-slate-500 py-4">No invoices this period.</p>
                ) : (
                  <div className="space-y-3">
                    {(() => {
                      const max = Math.max(...revenue.byPlan.map(p => Math.abs(p.netRevenueEur)), 1)
                      return revenue.byPlan
                        .slice()
                        .sort((a, b) => b.netRevenueEur - a.netRevenueEur)
                        .map(p => (
                          <div key={p.plan}>
                            <div className="flex items-baseline justify-between mb-1">
                              <span className="text-sm text-slate-300">{planLabel(p.plan)}</span>
                              <span className="text-sm font-semibold text-slate-200 tabular-nums">{eur(p.netRevenueEur)}</span>
                            </div>
                            <div className="h-2 rounded-full bg-dark-700 overflow-hidden">
                              <div
                                className="h-full rounded-full bg-brand-500"
                                style={{ width: `${Math.max(2, (Math.abs(p.netRevenueEur) / max) * 100)}%` }}
                              />
                            </div>
                            <div className="text-[11px] text-slate-600 mt-1">
                              {p.invoiceCount} invoice{p.invoiceCount === 1 ? '' : 's'} · gross {eur(p.grossInvoicedEur)} · paid {eur(p.paidRevenueEur)}
                            </div>
                          </div>
                        ))
                    })()}
                  </div>
                )}
              </div>

              {/* Per client */}
              <div className="bg-dark-800 rounded-xl overflow-hidden mb-6">
                <div className="px-4 py-3 border-b border-dark-700 text-xs font-medium text-slate-400 uppercase tracking-wide">
                  Per-client breakdown
                </div>
                {revenue.byClient.length === 0 ? (
                  <div className="py-12 text-center text-slate-500 text-sm">No invoices this period</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-dark-700/50">
                          <th className="px-4 py-3 text-left text-xs text-slate-500 font-medium">Client</th>
                          <th className="px-3 py-3 text-left text-xs text-slate-500 font-medium">Plan</th>
                          <th className="px-3 py-3 text-left text-xs text-slate-500 font-medium">Match</th>
                          <th className="px-3 py-3 text-right text-xs text-slate-500 font-medium">Gross</th>
                          <th className="px-3 py-3 text-right text-xs text-slate-500 font-medium">Paid</th>
                          <th className="px-4 py-3 text-right text-xs text-slate-500 font-medium">Net</th>
                        </tr>
                      </thead>
                      <tbody>
                        {revenue.byClient.map((c, i) => (
                          <tr key={c.clientId ?? `unattributed-${i}`} className="border-b border-dark-700/30 hover:bg-dark-700/20 transition-colors">
                            <td className="px-4 py-3 font-medium text-slate-200">{c.clientName}</td>
                            <td className="px-3 py-3 text-slate-400">{planLabel(c.plan)}</td>
                            <td className="px-3 py-3"><AttributionBadge attribution={c.attribution} /></td>
                            <td className="px-3 py-3 text-right text-slate-400 tabular-nums">{eur(c.grossInvoicedEur)}</td>
                            <td className="px-3 py-3 text-right text-slate-400 tabular-nums">{eur(c.paidRevenueEur)}</td>
                            <td className="px-4 py-3 text-right font-semibold text-slate-200 tabular-nums">{eur(c.netRevenueEur)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Affiliates */}
              {revenue.affiliates.length > 0 && (
                <div className="bg-dark-800 rounded-xl p-5 mb-6">
                  <SectionHeading>Affiliates</SectionHeading>
                  <div className="flex items-start gap-2 mb-3 text-xs text-slate-500">
                    <Percent size={13} className="mt-0.5 shrink-0" />
                    Estimated from Stripe redemptions and the 12-month recurring window. PromoteKit is the
                    real system of record for payout — treat these as provisional until reconciled (contract §4, §8.2).
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {revenue.affiliates.map(a => (
                      <div key={a.affiliateCode} className="bg-dark-700/40 rounded-lg p-3">
                        <div className="text-sm font-semibold text-slate-200">{a.affiliateCode.toUpperCase()}</div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {a.redemptions} redemption{a.redemptions === 1 ? '' : 's'} · {a.attributedClients} attributed client{a.attributedClients === 1 ? '' : 's'}
                        </div>
                        <div className="text-sm font-semibold text-brand-300 tabular-nums mt-1">{eur(a.commissionAccruedEur)} accrued (est.)</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Pipeline / opportunity */}
              <div className="bg-dark-800 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-1">
                  <Target size={15} className="text-brand-400" />
                  <SectionHeading className="mb-0">Pipeline — engaged free clients worth a campaign</SectionHeading>
                </div>
                <p className="text-xs text-slate-500 mb-4">
                  Free-plan clients active in at least {revenue.pipeline.engagedThresholdWeeks} of the last{' '}
                  {Math.round(revenue.pipeline.windowDays / 7)} weeks — using the product, not paying for it. A one-time
                  signup that never returned is excluded on purpose (contract §9). Heuristic, expect it to be tuned.
                </p>
                {(() => {
                  // The report returns every free client with ANY activity in
                  // the window (so "used it once, never again" is still
                  // visible for debugging), not just the engaged ones. This
                  // page's job — Constantin's own framing — is to surface the
                  // ones worth campaigning to, so it filters on the
                  // precomputed `engaged` flag rather than showing everyone.
                  const engaged = revenue.pipeline.clients.filter(c => c.engaged)
                  if (engaged.length === 0) {
                    return <p className="text-sm text-slate-500 py-4">No free clients meet the engagement bar this period.</p>
                  }
                  const totalOpportunity = engaged.reduce((s, c) => s + (c.opportunityMonthlyEur ?? 0), 0)
                  return (
                    <>
                      <div className="mb-3 text-sm text-slate-300">
                        <span className="font-semibold text-emerald-400 tabular-nums">{eur(totalOpportunity)}</span>{' '}
                        / month at risk of never being campaigned to, across {engaged.length} client{engaged.length === 1 ? '' : 's'}
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-dark-700/50">
                              <th className="px-3 py-2 text-left text-xs text-slate-500 font-medium">Client</th>
                              <th className="px-3 py-2 text-center text-xs text-slate-500 font-medium">Active weeks</th>
                              <th className="px-3 py-2 text-left text-xs text-slate-500 font-medium">Next tier</th>
                              <th className="px-3 py-2 text-right text-xs text-slate-500 font-medium">Opportunity</th>
                            </tr>
                          </thead>
                          <tbody>
                            {engaged
                              .slice()
                              .sort((a, b) => b.distinctActiveWeeks - a.distinctActiveWeeks)
                              .map(c => (
                                <tr key={c.clientId} className="border-b border-dark-700/30 hover:bg-dark-700/20 transition-colors">
                                  <td className="px-3 py-2 font-medium text-slate-200 flex items-center gap-1.5">
                                    <Users size={12} className="text-slate-500" />
                                    {c.clientName}
                                  </td>
                                  <td className="px-3 py-2 text-center tabular-nums text-slate-400">{c.distinctActiveWeeks}</td>
                                  <td className="px-3 py-2 text-slate-400">{planLabel(c.nextPlan)}</td>
                                  <td className="px-3 py-2 text-right font-semibold text-emerald-400 tabular-nums">
                                    {c.opportunityMonthlyEur !== null ? `${eur(c.opportunityMonthlyEur)}/mo` : '—'}
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )
                })()}
              </div>
            </>
          )}
        </section>
      )}
    </div>
  )
}
