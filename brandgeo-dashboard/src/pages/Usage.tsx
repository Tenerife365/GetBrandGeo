/**
 * Usage.tsx — Admin-only cost estimator
 * Shows per-client API spend estimated from ai_results row counts × fixed cost per engine.
 */

import { useEffect, useState } from 'react'
import { DollarSign, TrendingUp, Cpu } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useClient } from '../lib/clientContext'
import { useTimeFilter } from '../lib/timeFilterContext'

const ENGINE_COST: Record<string, number> = {
  claude:     0.018,
  chatgpt:    0.040,
  gemini:     0.001,
  perplexity: 0.005,
  meta:       0.002,
}

// 50% overhead to cover platform costs (Supabase, Netlify, hosting, Plausible, domain, etc.)
const OVERHEAD_MULTIPLIER = 1.5

const ENGINE_COLOR: Record<string, string> = {
  chatgpt:    'text-emerald-400',
  gemini:     'text-blue-400',
  claude:     'text-purple-400',
  perplexity: 'text-cyan-400',
  meta:       'text-amber-400',
}

interface ClientUsage {
  clientId: number
  clientName: string
  byEngine: Record<string, number>
  totalResponses: number
  totalCost: number
}

export default function Usage() {
  const { isAdmin, clients } = useClient()
  const { getStartDate, timeRange } = useTimeFilter()
  const [rows, setRows] = useState<ClientUsage[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isAdmin) return
    const load = async () => {
      setLoading(true)
      let q = supabase.from('ai_results').select('client_id, llm')
      const startDate = getStartDate()
      if (startDate) q = q.gte('checked_at', startDate.toISOString())
      const { data } = await q

      if (!data) { setLoading(false); return }

      const byClient: Record<number, Record<string, number>> = {}
      for (const row of data) {
        const cid = row.client_id as number
        if (!byClient[cid]) byClient[cid] = {}
        byClient[cid][row.llm] = (byClient[cid][row.llm] ?? 0) + 1
      }

      const result: ClientUsage[] = Object.entries(byClient).map(([cid, engines]) => {
        const clientId = Number(cid)
        const clientName = clients.find(c => c.id === clientId)?.name ?? `Client ${clientId}`
        const totalResponses = Object.values(engines).reduce((a, b) => a + b, 0)
        const totalCost = Object.entries(engines).reduce(
          (sum, [llm, cnt]) => sum + cnt * (ENGINE_COST[llm] ?? 0),
          0
        ) * OVERHEAD_MULTIPLIER
        return { clientId, clientName, byEngine: engines, totalResponses, totalCost }
      }).sort((a, b) => b.totalCost - a.totalCost)

      setRows(result)
      setLoading(false)
    }
    load()
  }, [isAdmin, timeRange]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!isAdmin) return null

  const grandTotal     = rows.reduce((s, r) => s + r.totalCost, 0)
  const grandResponses = rows.reduce((s, r) => s + r.totalResponses, 0)

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-5xl mx-auto">

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Usage &amp; Costs</h1>
        <p className="text-sm text-slate-400 mt-0.5">
          Estimated API spend per client based on response counts
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-dark-800 border border-dark-700 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign size={15} className="text-emerald-400" />
            <span className="text-xs text-slate-400 uppercase tracking-wide font-medium">Est. Total Cost</span>
          </div>
          <div className="text-2xl font-bold text-emerald-400 tabular-nums">${grandTotal.toFixed(2)}</div>
          <p className="text-xs text-slate-500 mt-1">across all clients</p>
        </div>

        <div className="bg-dark-800 border border-dark-700 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <Cpu size={15} className="text-blue-400" />
            <span className="text-xs text-slate-400 uppercase tracking-wide font-medium">Total Responses</span>
          </div>
          <div className="text-2xl font-bold text-white tabular-nums">{grandResponses.toLocaleString()}</div>
          <p className="text-xs text-slate-500 mt-1">LLM responses collected</p>
        </div>

        <div className="bg-dark-800 border border-dark-700 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={15} className="text-brand-400" />
            <span className="text-xs text-slate-400 uppercase tracking-wide font-medium">Avg per Client</span>
          </div>
          <div className="text-2xl font-bold text-white tabular-nums">
            {rows.length > 0 ? `$${(grandTotal / rows.length).toFixed(2)}` : '—'}
          </div>
          <p className="text-xs text-slate-500 mt-1">{rows.length} active client{rows.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* Per-client table */}
      <div className="bg-dark-800 border border-dark-700 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-dark-700 text-xs font-medium text-slate-400 uppercase tracking-wide">
          Per-client breakdown
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-500 text-sm animate-pulse">Loading usage data…</div>
        ) : rows.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-sm">No data for selected period</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-dark-700/50">
                  <th className="px-4 py-3 text-left text-xs text-slate-500 font-medium">Client</th>
                  <th className="px-3 py-3 text-center text-xs text-slate-500 font-medium">Responses</th>
                  {Object.keys(ENGINE_COST).map(e => (
                    <th key={e} className="px-3 py-3 text-center text-xs text-slate-500 font-medium capitalize">{e}</th>
                  ))}
                  <th className="px-4 py-3 text-right text-xs text-slate-500 font-medium">Est. Cost</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(r => (
                  <tr key={r.clientId} className="border-b border-dark-700/30 hover:bg-dark-700/20 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-200">{r.clientName}</td>
                    <td className="px-3 py-3 text-center text-slate-400 tabular-nums">{r.totalResponses}</td>
                    {Object.keys(ENGINE_COST).map(e => (
                      <td key={e} className={`px-3 py-3 text-center tabular-nums ${ENGINE_COLOR[e] ?? 'text-slate-400'}`}>
                        {r.byEngine[e] ?? 0}
                      </td>
                    ))}
                    <td className="px-4 py-3 text-right font-semibold text-emerald-400 tabular-nums">
                      ${r.totalCost.toFixed(3)}
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
                      {rows.reduce((s, r) => s + (r.byEngine[e] ?? 0), 0)}
                    </td>
                  ))}
                  <td className="px-4 py-3 text-right font-bold text-emerald-400 tabular-nums">${grandTotal.toFixed(2)}</td>
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
              <span className={`text-xs font-medium capitalize ${ENGINE_COLOR[engine] ?? 'text-slate-400'}`}>{engine}</span>
              <span className="text-xs text-slate-600">${cost.toFixed(3)}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-600 mt-2">
          API costs × 1.5 overhead (Supabase, Netlify, hosting, Plausible, domain). Actual API costs may vary.
        </p>
      </div>
    </div>
  )
}
