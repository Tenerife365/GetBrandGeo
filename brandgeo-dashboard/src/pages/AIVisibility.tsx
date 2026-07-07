import { useEffect, useState } from 'react'
import {
  RefreshCw, RotateCcw, TrendingUp, AlertTriangle, Target, ChevronDown, ChevronUp,
  Play, Loader2, Globe2, Copy, CheckCheck, Zap, Settings, X, Lock, Clock,
} from 'lucide-react'
import { supabase, isDemoMode } from '../lib/supabase'
import { mockPrompts, mockAIResults } from '../lib/mockData'
import { useMarket } from '../lib/marketContext'
import { useClient } from '../lib/clientContext'
import type { Prompt, AIResult, LLMName, PromptCategory } from '../types'
import { useI18n, fmt } from '../lib/i18nContext'
import { useCollection } from '../lib/collectionContext'
import { useTheme } from '../lib/themeContext'
import {
  ENGINE_META, ALL_ENGINES, COMING_SOON_ENGINES, ENGINE_UNLOCK_PLAN, PLAN_LABELS,
  type EngineId, type EngineState,
} from '../lib/planConfig'

// ── Category display helpers ──────────────────────────────────────────────────

const CATEGORY_LABEL: Record<string, string> = {
  mid:            'Mid (100-200)',
  large:          'Large (500+)',
  very_large:     'Very Large (1k+)',
  tool_discovery: 'Tool Discovery',
  geo_category:   'GEO / AIO',
  problem_based:  'Problem-based',
  general:        'General',
  direct_brand:   'Direct Brand',
  large_scale:    'Large Scale',
  corporate:      'Corporate',
  wedding:        'Wedding',
  galas:          'Galas & Events',
  quality:        'Quality & Awards',
  location:       'Location',
  competitive:    'Competitive',
  portfolio:      'Portfolio',
}

const CATEGORY_COLOR: Record<string, string> = {
  mid:            'bg-blue-500/20 text-blue-300',
  large:          'bg-purple-500/20 text-purple-300',
  very_large:     'bg-amber-500/20 text-amber-300',
  general:        'bg-slate-500/20 text-slate-300',
  tool_discovery: 'bg-emerald-500/20 text-emerald-300',
  geo_category:   'bg-blue-500/20 text-blue-300',
  problem_based:  'bg-amber-500/20 text-amber-300',
  direct_brand:   'bg-violet-500/20 text-violet-300',
  large_scale:    'bg-purple-500/20 text-purple-300',
  corporate:      'bg-sky-500/20 text-sky-300',
  wedding:        'bg-pink-500/20 text-pink-300',
  galas:          'bg-amber-500/20 text-amber-300',
  quality:        'bg-emerald-500/20 text-emerald-300',
  location:       'bg-teal-500/20 text-teal-300',
  competitive:    'bg-red-500/20 text-red-300',
  portfolio:      'bg-indigo-500/20 text-indigo-300',
}

const getCatLabel = (cat: string) => CATEGORY_LABEL[cat] ?? cat
const getCatColor = (cat: string) => CATEGORY_COLOR[cat] ?? 'bg-slate-500/20 text-slate-300'

// ── Types ─────────────────────────────────────────────────────────────────────

type ResultMap = Map<number, Map<LLMName, AIResult>>
type RankedEntry = { pos: number; name: string }

function parseCompetitors(raw: string | null | undefined): RankedEntry[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed) || parsed.length === 0) return []
    if (typeof parsed[0] === 'object' && parsed[0] !== null && 'pos' in parsed[0]) {
      return (parsed as RankedEntry[]).sort((a, b) => a.pos - b.pos)
    }
    return (parsed as string[]).map((name, i) => ({ pos: i + 1, name }))
  } catch { return [] }
}

// ── Admin Engine Toggle Modal ─────────────────────────────────────────────────

function EngineToggleModal({
  clientName,
  engineStates,
  enginesEnabled,
  onToggle,
  onClose,
}: {
  clientName: string
  engineStates: Record<EngineId, EngineState>
  enginesEnabled: Record<string, boolean> | null
  onToggle: (engine: EngineId, enabled: boolean) => Promise<void>
  onClose: () => void
}) {
  const [saving, setSaving] = useState<EngineId | null>(null)

  const planEngines = ALL_ENGINES.filter(e => engineStates[e] !== 'locked')

  const handleToggle = async (engine: EngineId, current: boolean) => {
    setSaving(engine)
    await onToggle(engine, !current)
    setSaving(null)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-dark-800 border border-dark-600 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-dark-700">
          <div>
            <h2 className="text-sm font-semibold text-white">Engine Configuration</h2>
            <p className="text-xs text-slate-500 mt-0.5">{clientName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-dark-700 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Engine list */}
        <div className="divide-y divide-dark-700/50 max-h-96 overflow-y-auto">
          {planEngines.map(engine => {
            const meta  = ENGINE_META[engine]
            const state = engineStates[engine]
            const isBuilt = !COMING_SOON_ENGINES.has(engine)
            // Current enabled value: if no override saved, treat as true (active)
            const isEnabled = enginesEnabled?.[engine] !== false
            const isSaving  = saving === engine

            return (
              <div key={engine} className="flex items-center gap-3 px-5 py-3.5">
                <img src={meta.logoUrl} alt={meta.label} className="w-7 h-7 rounded-lg object-contain shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-medium ${meta.color}`}>{meta.label}</div>
                  {!isBuilt && (
                    <div className="text-[10px] text-slate-600 mt-0.5">Coming Soon — not yet collecting data</div>
                  )}
                  {isBuilt && !isEnabled && (
                    <div className="text-[10px] text-amber-600 mt-0.5">Disabled — shown as Coming Soon to client</div>
                  )}
                </div>

                {/* Toggle — only for built engines; coming-soon engines show a note */}
                {isBuilt ? (
                  <button
                    onClick={() => handleToggle(engine, isEnabled)}
                    disabled={isSaving}
                    className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 transition-colors duration-200 focus:outline-none disabled:opacity-50 ${
                      isEnabled
                        ? 'bg-brand-500 border-brand-500'
                        : 'bg-dark-600 border-dark-500'
                    }`}
                  >
                    {isSaving
                      ? <Loader2 size={10} className="animate-spin absolute inset-0 m-auto text-white" />
                      : <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform duration-200 mt-[1px] ${isEnabled ? 'translate-x-4' : 'translate-x-0.5'}`} />
                    }
                  </button>
                ) : (
                  <span className="text-[10px] text-slate-600 shrink-0 bg-dark-700 px-2 py-1 rounded">🔜 Soon</span>
                )}
              </div>
            )
          })}
        </div>

        <div className="px-5 py-3 bg-dark-700/30 text-xs text-slate-600">
          Disabled engines show as "Coming Soon" to clients. Locked engines require a plan upgrade.
        </div>
      </div>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function AIVisibility() {
  const { selections } = useMarket()
  const { activeClientId, activeClient, isAdmin, activeEngines, engineStates, setClientEngineOverride } = useClient()
  const brandName = activeClient?.name ?? 'your brand'
  const { t } = useI18n()
  const { theme } = useTheme()

  const [prompts, setPrompts]           = useState<Prompt[]>([])
  const [results, setResults]           = useState<ResultMap>(new Map())
  const [loading, setLoading]           = useState(true)
  const [filterCats, setFilterCats]     = useState<Set<string>>(new Set())
  const [expandedRow, setExpandedRow]   = useState<number | null>(null)
  const [lastChecked, setLastChecked]   = useState<string | null>(null)
  const [showInsights, setShowInsights] = useState(true)
  const [showFixHub, setShowFixHub]     = useState(true)
  const [copiedFix, setCopiedFix]       = useState<number | null>(null)
  const [refreshed, setRefreshed]       = useState(false)
  const [refreshingPromptId, setRefreshingPromptId] = useState<number | null>(null)
  const [showEngineModal, setShowEngineModal]         = useState(false)

  const { collecting, progress: collectProgress, lastCompletedAt, runCollection: startCollection, runSinglePrompt } = useCollection()

  // Active engines as a LLM-typed array (only engines with state === 'active')
  const activeLLMs = activeEngines.map(id => ({ id, ...ENGINE_META[id] }))

  const runCollection = async () => {
    await startCollection(activeClientId, false, selections, activeEngines)
    load()
  }

  const forceCollection = async () => {
    await startCollection(activeClientId, true, selections, activeEngines)
    load()
  }

  const handleRefreshPrompt = async (prompt: Prompt) => {
    if (refreshingPromptId !== null || collecting) return
    setRefreshingPromptId(prompt.id)
    await runSinglePrompt(activeClientId, prompt.id, prompt.text, selections, activeEngines)
    await load()
    setRefreshingPromptId(null)
  }

  const load = async () => {
    setLoading(true)
    if (isDemoMode) {
      const map: ResultMap = new Map()
      mockAIResults.forEach(r => {
        if (!map.has(r.prompt_id)) map.set(r.prompt_id, new Map())
        map.get(r.prompt_id)!.set(r.llm as LLMName, r)
      })
      setPrompts(mockPrompts)
      setResults(map)
      setLastChecked(new Date().toISOString())
      setLoading(false)
      return
    }

    const [{ data: pData }, { data: rData }] = await Promise.all([
      supabase.from('prompts').select('*').eq('is_active', true).eq('client_id', activeClientId).order('position'),
      supabase.from('ai_results').select('*').eq('client_id', activeClientId).order('checked_at', { ascending: false }),
    ])

    const map: ResultMap = new Map()
    let latestChecked = lastChecked
    if (rData) {
      rData.forEach((r: AIResult) => {
        // Only show results for active engines
        if (!activeEngines.includes(r.llm as EngineId)) return
        if (!map.has(r.prompt_id)) map.set(r.prompt_id, new Map())
        const llmMap = map.get(r.prompt_id)!
        if (!llmMap.has(r.llm as LLMName)) {
          llmMap.set(r.llm as LLMName, r)
          if (!latestChecked || r.checked_at > latestChecked) latestChecked = r.checked_at
        }
      })
    }

    if (pData) setPrompts(pData)
    setResults(map)
    if (latestChecked) setLastChecked(latestChecked)
    setLoading(false)
    setRefreshed(true)
    setTimeout(() => setRefreshed(false), 2500)
  }

  useEffect(() => { load() }, [activeClientId, activeEngines.join(',')])
  useEffect(() => { if (lastCompletedAt > 0) load() }, [lastCompletedAt])

  const filtered = filterCats.size === 0 ? prompts : prompts.filter(p => filterCats.has(p.category ?? ''))

  // ── Stats computed over active engines only ───────────────────────────────

  const llmStats = activeLLMs.map(llm => {
    const mentioned = prompts.filter(p => results.get(p.id)?.get(llm.id)?.brand_mentioned).length
    const checked   = prompts.filter(p => results.get(p.id)?.has(llm.id)).length
    return { ...llm, mentioned, checked, pct: checked > 0 ? Math.round((mentioned / checked) * 100) : 0 }
  })

  const overallPct = (() => {
    let total = 0, mentioned = 0
    prompts.forEach(p => {
      activeLLMs.forEach(llm => {
        const r = results.get(p.id)?.get(llm.id)
        if (r) { total++; if (r.brand_mentioned) mentioned++ }
      })
    })
    return total > 0 ? Math.round((mentioned / total) * 100) : 0
  })()

  const competitorFreq = (() => {
    const freq: Record<string, { count: number; positions: number[] }> = {}
    results.forEach(llmMap => {
      llmMap.forEach(r => {
        parseCompetitors(r.competitors_mentioned).forEach(c => {
          const key = c.name.toLowerCase().trim()
          if (!key || key.length < 2) return
          if (!freq[key]) freq[key] = { count: 0, positions: [] }
          freq[key].count++
          freq[key].positions.push(c.pos)
        })
      })
    })
    return Object.entries(freq)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 8)
      .map(([name, { count, positions }]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        count,
        avgPos: positions.length > 0
          ? Math.round(positions.reduce((s, p) => s + p, 0) / positions.length * 10) / 10
          : null,
      }))
  })()

  const totalChecked = (() => {
    let n = 0
    results.forEach(m => { n += m.size })
    return n
  })()

  const gapCount = totalChecked - (() => {
    let n = 0
    results.forEach(m => { m.forEach(r => { if (r.brand_mentioned) n++ }) })
    return n
  })()

  // ── AI Visibility Score ───────────────────────────────────────────────────

  const dimensions = (() => {
    const recognition = overallPct

    let posSum = 0, posCount = 0
    results.forEach(llmMap => llmMap.forEach(r => {
      if (r.brand_mentioned && r.brand_position) {
        posSum += Math.max(20, 100 - ((r.brand_position - 1) / 4) * 80)
        posCount++
      }
    }))
    const knowledge = posCount > 0 ? Math.round(posSum / posCount) : 0

    let sentScore = 0, sentTotal = 0
    results.forEach(llmMap => llmMap.forEach(r => {
      if (r.brand_mentioned) {
        sentTotal++
        if (r.sentiment === 'positive') sentScore += 1
        else if (r.sentiment === 'neutral') sentScore += 0.5
      }
    }))
    const sentiment = sentTotal > 0 ? Math.round((sentScore / sentTotal) * 100) : (knowledge > 0 ? 55 : 0)

    let topThree = 0, mentionedTotal = 0
    results.forEach(llmMap => llmMap.forEach(r => {
      if (r.brand_mentioned) {
        mentionedTotal++
        if (!r.brand_position || r.brand_position <= 3) topThree++
      }
    }))
    const accuracy = mentionedTotal > 0 ? Math.round((topThree / mentionedTotal) * 100) : 0

    const enginesWithMention = activeLLMs.filter(llm =>
      prompts.some(p => results.get(p.id)?.get(llm.id)?.brand_mentioned)
    ).length
    const reach = activeLLMs.length > 0 ? Math.round((enginesWithMention / activeLLMs.length) * 100) : 0

    const consistentPrompts = prompts.filter(p => {
      const checked   = activeLLMs.filter(l => results.get(p.id)?.has(l.id)).length
      const mentioned = activeLLMs.filter(l => results.get(p.id)?.get(l.id)?.brand_mentioned).length
      return checked > 0 && mentioned / checked >= 0.6
    }).length
    const consistency = prompts.length > 0 ? Math.round((consistentPrompts / prompts.length) * 100) : 0

    return { recognition, knowledge, sentiment, accuracy, reach, consistency }
  })()

  const aiScore = Math.round(
    dimensions.recognition * 0.25 +
    dimensions.knowledge   * 0.20 +
    dimensions.sentiment   * 0.15 +
    dimensions.accuracy    * 0.15 +
    dimensions.reach       * 0.15 +
    dimensions.consistency * 0.10
  )

  // ── Engine status (active engines only, for KNOW/PARTIAL/MISSING) ─────────

  const engineStatusCards = llmStats.map(s => {
    const status: 'KNOW' | 'PARTIAL' | 'MISSING' =
      s.pct >= 50 ? 'KNOW' : s.pct >= 25 ? 'PARTIAL' : 'MISSING'
    let bestPos: number | null = null
    prompts.forEach(p => {
      const r = results.get(p.id)?.get(s.id)
      if (r?.brand_mentioned && r.brand_position) {
        if (bestPos === null || r.brand_position < bestPos) bestPos = r.brand_position
      }
    })
    return { ...s, status, bestPos }
  })

  // Coming-soon and locked engines for the status grid
  const comingSoonEngines = ALL_ENGINES.filter(e => engineStates[e] === 'coming_soon')
  const lockedEngines     = ALL_ENGINES.filter(e => engineStates[e] === 'locked')

  // ── Fix This hub ──────────────────────────────────────────────────────────

  const fixItems = (() => {
    const items: { priority: 'P0' | 'P1' | 'P2'; title: string; description: string; fix: string }[] = []

    engineStatusCards.filter(e => e.status === 'MISSING' && e.checked > 0).forEach(e => {
      items.push({
        priority: 'P0',
        title: `Not found in ${e.label}`,
        description: `${brandName} appears in 0 of ${e.checked} ${e.label} responses. You have no presence here.`,
        fix: `Create a dedicated "${brandName} overview" page answering your most common category queries. Submit it to authoritative directories and request coverage from publications ${e.label} training data trusts. Ensure your domain has schema.org/Organization structured data with complete fields.`,
      })
    })

    engineStatusCards.filter(e => e.status === 'PARTIAL' && e.checked > 0).forEach(e => {
      items.push({
        priority: 'P1',
        title: `Low visibility in ${e.label} (${e.pct}%)`,
        description: `Brand appears inconsistently — in ${e.mentioned} of ${e.checked} prompts checked.`,
        fix: `Strengthen brand authority signals for ${e.label}: publish 3+ long-form pages that directly answer your tracked queries, build backlinks from industry media mentioning ${brandName} in context, and add FAQ schema markup to your site's key landing pages.`,
      })
    })

    if (competitorFreq[0] && gapCount > 0) {
      items.push({
        priority: 'P1',
        title: `Outranked by ${competitorFreq[0].name} (avg #${competitorFreq[0].avgPos ?? '?'})`,
        description: `${competitorFreq[0].name} appears ${competitorFreq[0].count}x across AI results while ${brandName} is absent in ${gapCount} checks.`,
        fix: `Publish a detailed comparison page: "${brandName} vs ${competitorFreq[0].name}" covering differentiators, pricing, and use cases. Pitch this page to trade publications and ask clients for case study testimonials published under your domain.`,
      })
    }

    if (dimensions.consistency < 40 && overallPct > 0) {
      items.push({
        priority: 'P2',
        title: 'Inconsistent cross-prompt coverage',
        description: `Brand appears in only ${dimensions.consistency}% of prompts with consistent multi-engine coverage. AI models know you selectively.`,
        fix: `Map which prompt topics are missing and create dedicated content for each gap. Ensure every service category and location you serve has a standalone indexed page with your brand name in the H1 and title tag.`,
      })
    }

    if (dimensions.knowledge > 0 && dimensions.knowledge < 50) {
      items.push({
        priority: 'P2',
        title: 'Improve ranking position',
        description: `When mentioned, ${brandName} averages a lower position. Competitors rank above you in shared responses.`,
        fix: `Build topical authority by publishing a content cluster: one pillar page on your main category + 5 supporting posts on subtopics. Internal-link them together. This signals depth of expertise to AI training pipelines.`,
      })
    }

    return items
  })()

  if (loading) return <div className="p-8 text-slate-500 text-sm animate-pulse">{t.aiv_loading}</div>

  const scoreColor      = aiScore >= 60 ? '#10b981' : aiScore >= 35 ? '#f59e0b' : '#ef4444'
  const circumference   = 2 * Math.PI * 54
  const dashOffset      = circumference - (aiScore / 100) * circumference
  const ringTextFill    = theme === 'light' ? '#1e293b' : 'white'
  const ringTextFillDim = theme === 'light' ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.55)'

  const dimConfig = [
    { key: 'recognition', label: 'Recognition', value: dimensions.recognition, desc: 'Prompt coverage' },
    { key: 'knowledge',   label: 'Knowledge',   value: dimensions.knowledge,   desc: 'Position quality' },
    { key: 'sentiment',   label: 'Sentiment',   value: dimensions.sentiment,   desc: 'Tone when found' },
    { key: 'accuracy',    label: 'Accuracy',    value: dimensions.accuracy,    desc: 'Top-3 placement' },
    { key: 'reach',       label: 'Reach',       value: dimensions.reach,       desc: 'Engine coverage' },
    { key: 'consistency', label: 'Consistency', value: dimensions.consistency, desc: 'Cross-prompt rate' },
  ] as const

  const copyFix = (idx: number, text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedFix(idx)
      setTimeout(() => setCopiedFix(null), 2000)
    })
  }

  // Total columns in prompt table = active engines only
  const tableColsTemplate = `2rem 1fr repeat(${activeLLMs.length}, 8rem)`

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto">

      {/* Engine toggle modal */}
      {showEngineModal && activeClient && (
        <EngineToggleModal
          clientName={activeClient.name}
          engineStates={engineStates}
          enginesEnabled={activeClient.engines_enabled}
          onToggle={setClientEngineOverride}
          onClose={() => setShowEngineModal(false)}
        />
      )}

      {/* ── Page header ─────────────────────────────────────────────────────── */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            <h1 className="text-2xl font-bold text-white">{t.aiv_title}</h1>
            {selections.map(sel => (
              <span
                key={sel.market.id}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-700/60 text-slate-300 border border-slate-600/50"
              >
                {sel.market.flagCode === 'un'
                  ? <Globe2 size={11} className="text-slate-400" />
                  : <img src={`https://flagcdn.com/w16/${sel.market.flagCode}.png`} alt="" className="w-3.5 h-auto rounded-sm" />
                }
                {sel.market.id}
                {sel.region.id !== 'ALL' && <span className="text-slate-500">· {sel.region.label}</span>}
              </span>
            ))}
          </div>
          <p className="text-sm text-slate-400 mt-0.5">
            {t.aiv_subtitle}
            {lastChecked && (
              <span className="ml-2 text-slate-600">
                - {t.aiv_lastChecked} {new Date(lastChecked).toLocaleDateString()}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {isAdmin && (
            <>
              <button
                onClick={() => setShowEngineModal(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-colors border border-dark-600 bg-dark-700/50 text-slate-400 hover:text-slate-200 hover:border-dark-500"
                title="Configure engines for this client"
              >
                <Settings size={14} />
                <span className="hidden sm:inline">Engines</span>
              </button>
              <button
                onClick={runCollection}
                disabled={collecting || loading}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors border border-brand-500/30 bg-brand-500/10 text-brand-300 hover:bg-brand-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {collecting
                  ? <><Loader2 size={14} className="animate-spin" /> {collectProgress ? `${collectProgress.done}/${collectProgress.total}` : 'Starting…'}</>
                  : <><Play size={14} /> Run Collection</>
                }
              </button>
              <button
                onClick={forceCollection}
                disabled={collecting || loading}
                title="Force Refresh — wipes existing results and re-runs all engines"
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors border border-orange-500/30 bg-orange-500/10 text-orange-300 hover:bg-orange-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RotateCcw size={14} />
                <span className="hidden sm:inline">Force Refresh</span>
              </button>
            </>
          )}
          <button
            onClick={load}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors border border-dark-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-dark-700 text-slate-400 hover:text-slate-200"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            {refreshed ? <span className="text-emerald-400">{t.aiv_refreshed}</span> : t.aiv_reload}
          </button>
        </div>
      </div>

      {/* ── AI Visibility Score card ─────────────────────────────────────────── */}
      <div className="mb-4 bg-dark-800 border border-dark-700 rounded-xl p-5 grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-6 items-center">
        <div className="flex flex-col items-center gap-3">
          <svg viewBox="0 0 120 120" className="w-40 h-40" style={{ overflow: 'visible' }}>
            <defs>
              <linearGradient id="scoreRingGrad" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#c4b5fd" />
                <stop offset="100%" stopColor="#6d28d9" />
              </linearGradient>
              <filter id="scoreGlow" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            </defs>
            <circle cx="60" cy="60" r="54" fill="none" stroke={theme === 'light' ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.06)'} strokeWidth="6" />
            <circle cx="60" cy="60" r="54" fill="none" stroke="url(#scoreRingGrad)" strokeWidth="10" strokeLinecap="round"
              strokeDasharray={`${circumference}`} strokeDashoffset={`${dashOffset}`} transform="rotate(-90 60 60)"
              filter="url(#scoreGlow)" opacity="0.3" style={{ transition: 'stroke-dashoffset 0.9s cubic-bezier(.4,0,.2,1)' }} />
            <circle cx="60" cy="60" r="54" fill="none" stroke="url(#scoreRingGrad)" strokeWidth="5.5" strokeLinecap="round"
              strokeDasharray={`${circumference}`} strokeDashoffset={`${dashOffset}`} transform="rotate(-90 60 60)"
              style={{ transition: 'stroke-dashoffset 0.9s cubic-bezier(.4,0,.2,1)' }} />
            <text x="60" y="60" textAnchor="middle" dominantBaseline="central" fontFamily="Inter, -apple-system, sans-serif">
              <tspan fontSize="38" fontWeight="800" fill={ringTextFill} letterSpacing="-1.5">{aiScore}</tspan>
              <tspan fontSize="14" fontWeight="500" fill={ringTextFillDim} dy="-14">%</tspan>
            </text>
          </svg>
          <div className="text-center -mt-1">
            <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-[0.15em] mb-2">AI Visibility Score</div>
            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold border ${
              aiScore >= 60 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              : aiScore >= 35 ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
              : 'bg-red-500/10 text-red-400 border-red-500/20'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${aiScore >= 60 ? 'bg-emerald-400' : aiScore >= 35 ? 'bg-amber-400' : 'bg-red-400'}`} />
              {aiScore >= 60 ? 'Strong' : aiScore >= 35 ? 'Developing' : 'Needs Work'}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
          {dimConfig.map(d => (
            <div key={d.key}>
              <div className="flex justify-between items-center mb-1">
                <div>
                  <span className="text-sm font-medium text-slate-300">{d.label}</span>
                  <span className="ml-2 text-xs text-slate-600">{d.desc}</span>
                </div>
                <span className={`text-sm font-bold tabular-nums ${d.value >= 80 ? 'text-emerald-400' : 'text-slate-300'}`}>
                  {d.value}%
                </span>
              </div>
              <div className="h-2 rounded-full bg-dark-700 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all bg-brand-500"
                  style={{ width: `${d.value}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Engine status grid ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 mb-4">

        {/* Active engine cards */}
        {engineStatusCards.map(e => {
          const statusStyles = {
            KNOW:    { badge: 'bg-brand-500/15 text-brand-300 border border-brand-500/30', dot: 'bg-brand-400', card: 'border-brand-500/20' },
            PARTIAL: { badge: 'bg-amber-500/15 text-amber-300 border border-amber-500/30', dot: 'bg-amber-400', card: 'border-amber-500/20' },
            MISSING: { badge: 'bg-red-500/15 text-red-300 border border-red-500/30',       dot: 'bg-red-400',   card: 'border-red-500/20'   },
          }[e.status]
          return (
            <div key={e.id} className={`bg-dark-800 border rounded-xl p-4 flex flex-col items-center gap-2 ${statusStyles.card}`}>
              <img src={e.logoUrl} alt={e.label} className="w-8 h-8 rounded-lg object-contain" />
              <div className="text-sm font-semibold text-white">{e.label}</div>
              <div className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${statusStyles.badge}`}>
                <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1.5 ${statusStyles.dot}`} style={{ verticalAlign: 'middle' }} />
                {e.status}
              </div>
              <div className="text-center">
                <div className={`text-2xl font-bold tabular-nums ${e.pct >= 80 ? 'text-emerald-400' : 'text-slate-200'}`}>
                  {e.pct}%
                </div>
                <div className="text-xs text-slate-600 mt-0.5">{e.mentioned}/{e.checked} prompts</div>
                {e.bestPos !== null && (
                  <div className="text-xs text-slate-500 mt-0.5">best pos #{e.bestPos}</div>
                )}
              </div>
            </div>
          )
        })}

        {/* Coming Soon engine cards */}
        {comingSoonEngines.map(id => {
          const meta = ENGINE_META[id]
          return (
            <div key={id} className="bg-dark-800/50 border border-dark-700/50 rounded-xl p-4 flex flex-col items-center gap-2 opacity-60">
              <img src={meta.logoUrl} alt={meta.label} className="w-8 h-8 rounded-lg object-contain grayscale" />
              <div className="text-sm font-semibold text-slate-500">{meta.label}</div>
              <div className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-700/50 text-slate-500 border border-slate-600/30 flex items-center gap-1">
                <Clock size={10} />
                Coming Soon
              </div>
              <div className="text-center">
                <div className="text-xs text-slate-600 mt-1">
                  {COMING_SOON_ENGINES.has(id) ? 'Not yet built' : 'Paused by admin'}
                </div>
              </div>
            </div>
          )
        })}

        {/* Locked engine cards (not in plan) */}
        {lockedEngines.map(id => {
          const meta        = ENGINE_META[id]
          const unlockPlan  = ENGINE_UNLOCK_PLAN[id]
          const planLabel   = PLAN_LABELS[unlockPlan]
          return (
            <div key={id} className="bg-dark-800/30 border border-dark-700/30 rounded-xl p-4 flex flex-col items-center gap-2 opacity-40">
              <img src={meta.logoUrl} alt={meta.label} className="w-8 h-8 rounded-lg object-contain grayscale" />
              <div className="text-sm font-semibold text-slate-600">{meta.label}</div>
              <div className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-800 text-slate-600 border border-slate-700/30 flex items-center gap-1">
                <Lock size={9} />
                Locked
              </div>
              <div className="text-center">
                <div className="text-[10px] text-slate-700 mt-1">{planLabel}+</div>
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Fix This hub ─────────────────────────────────────────────────────── */}
      {fixItems.length > 0 && (
        <div className="mb-4 bg-dark-800 border border-dark-700 rounded-xl overflow-hidden">
          <button
            className="w-full flex items-center justify-between px-5 py-3.5 text-left"
            onClick={() => setShowFixHub(v => !v)}
          >
            <div className="flex items-center gap-2">
              <Zap size={15} className="text-brand-400" />
              <span className="text-sm font-semibold text-white">Fix This</span>
              <span className="text-xs text-slate-500">— {fixItems.length} action{fixItems.length !== 1 ? 's' : ''} to improve your score</span>
              <div className="flex items-center gap-1 ml-1">
                {(['P0','P1','P2'] as const).map(p => {
                  const count = fixItems.filter(i => i.priority === p).length
                  if (!count) return null
                  const cls = p === 'P0' ? 'bg-red-500/20 text-red-300' : p === 'P1' ? 'bg-amber-500/20 text-amber-300' : 'bg-purple-500/20 text-purple-300'
                  return <span key={p} className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${cls}`}>{count} {p}</span>
                })}
              </div>
            </div>
            {showFixHub ? <ChevronUp size={14} className="text-slate-500" /> : <ChevronDown size={14} className="text-slate-500" />}
          </button>

          {showFixHub && (
            <div className="border-t border-dark-700/50 divide-y divide-dark-700/50">
              {fixItems.map((item, idx) => {
                const pStyles = {
                  P0: { border: 'border-l-4 border-l-red-500',    badge: 'bg-red-500/20 text-red-300',       title: 'text-red-300'   },
                  P1: { border: 'border-l-4 border-l-amber-500',  badge: 'bg-amber-500/20 text-amber-300',   title: 'text-amber-300' },
                  P2: { border: 'border-l-4 border-l-purple-500', badge: 'bg-purple-500/20 text-purple-300', title: 'text-slate-200' },
                }[item.priority]
                return (
                  <div key={idx} className={`px-5 py-4 ${pStyles.border}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <span className={`mt-0.5 shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded ${pStyles.badge}`}>
                          {item.priority}
                        </span>
                        <div className="min-w-0">
                          <div className={`text-sm font-semibold ${pStyles.title} mb-0.5`}>{item.title}</div>
                          <div className="text-xs text-slate-500 mb-2">{item.description}</div>
                          <div className="text-xs text-slate-400 leading-relaxed bg-dark-700/40 rounded-lg px-3 py-2">
                            <span className="text-slate-600 font-medium uppercase tracking-wide text-[9px] block mb-1">Recommended fix</span>
                            {item.fix}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => copyFix(idx, item.fix)}
                        className="shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs border border-dark-600 text-slate-400 hover:text-slate-200 hover:border-dark-500 transition-colors"
                      >
                        {copiedFix === idx
                          ? <><CheckCheck size={12} className="text-emerald-400" /> Copied</>
                          : <><Copy size={12} /> Copy fix</>
                        }
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Competitor insights ──────────────────────────────────────────────── */}
      {competitorFreq.length > 0 && (
        <div className="mb-4 bg-dark-800 border border-amber-500/30 rounded-xl overflow-hidden">
          <button
            className="w-full flex items-center justify-between px-5 py-3 text-left"
            onClick={() => setShowInsights(v => !v)}
          >
            <div className="flex items-center gap-2">
              <AlertTriangle size={15} className="text-amber-400" />
              <span className="text-sm font-semibold text-amber-300">
                Top competitors in AI recommendations
                {gapCount > 0 && (
                  <span className="ml-2 font-normal text-amber-500/70 text-xs">
                    ({brandName} absent {gapCount} of {totalChecked} checks)
                  </span>
                )}
              </span>
            </div>
            {showInsights ? <ChevronUp size={14} className="text-slate-500" /> : <ChevronDown size={14} className="text-slate-500" />}
          </button>

          {showInsights && (
            <div className="px-5 pb-4 border-t border-dark-700/50">
              <p className="text-xs text-slate-500 mt-3 mb-3">
                Companies that appear most often in AI top-5 rankings across all prompts — real response data only.
              </p>
              <div className="flex flex-wrap gap-2">
                {competitorFreq.map(({ name, count, avgPos }) => (
                  <div key={name} className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <Target size={11} className="text-red-400" />
                    <span className="text-sm font-medium text-red-300">{name}</span>
                    <span className="text-xs text-red-500/70">{count}x</span>
                    {avgPos !== null && <span className="text-xs text-slate-600">avg #{avgPos}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Category breakdown ───────────────────────────────────────────────── */}
      {(() => {
        const activeCats = [...new Set(prompts.map(p => p.category).filter(Boolean))]
        const catStats = activeCats.map(cat => {
          const catPrompts = prompts.filter(p => p.category === cat)
          let mentioned = 0, checked = 0
          catPrompts.forEach(p => {
            activeLLMs.forEach(llm => {
              const r = results.get(p.id)?.get(llm.id)
              if (r) { checked++; if (r.brand_mentioned) mentioned++ }
            })
          })
          return { cat, label: getCatLabel(cat), pct: checked > 0 ? Math.round((mentioned / checked) * 100) : 0, checked, mentioned }
        }).sort((a, b) => b.pct - a.pct)

        if (catStats.length > 0) return (
          <div className="mb-4 bg-dark-800 border border-dark-700 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Category Breakdown</h3>
              <span className="text-xs text-slate-600">{totalChecked} total checks across {prompts.length} prompts × {activeLLMs.length} engines</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {catStats.map(({ cat, label, pct, checked, mentioned }) => (
                <div key={cat} className="flex flex-col gap-1">
                  <div className="flex justify-between items-center">
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${getCatColor(cat)}`}>{label}</span>
                    <span className={`text-xs font-bold tabular-nums ${pct >= 50 ? 'text-emerald-400' : pct >= 25 ? 'text-amber-400' : 'text-red-400'}`}>{pct}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-dark-700 overflow-hidden">
                    <div className={`h-full rounded-full ${pct >= 50 ? 'bg-emerald-400' : pct >= 25 ? 'bg-amber-400' : 'bg-red-400'}`} style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-[10px] text-slate-600">{mentioned}/{checked} checks</span>
                </div>
              ))}
            </div>
          </div>
        )
        return null
      })()}

      {/* ── Category filter ──────────────────────────────────────────────────── */}
      {(() => {
        const activeCats = [...new Set(prompts.map(p => p.category).filter(Boolean))]
        if (activeCats.length === 0) return null
        return (
          <div className="flex gap-2 mb-4 flex-wrap">
            <button
              onClick={() => setFilterCats(new Set())}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                filterCats.size === 0
                  ? 'bg-teal-500 text-white border-teal-600'
                  : 'bg-dark-800 text-slate-400 border-dark-700 hover:border-dark-600 hover:text-slate-300'
              }`}
            >
              {t.aiv_allCategories}
            </button>
            {activeCats.map(cat => {
              const active = filterCats.has(cat)
              return (
                <button
                  key={cat}
                  onClick={() => {
                    setFilterCats(prev => {
                      const next = new Set(prev)
                      if (next.has(cat)) next.delete(cat)
                      else next.add(cat)
                      return next
                    })
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                    active
                      ? 'bg-teal-500 text-white border-teal-600'
                      : 'bg-dark-800 text-slate-400 border-dark-700 hover:border-dark-600 hover:text-slate-300'
                  }`}
                >
                  {getCatLabel(cat)}
                </button>
              )
            })}
          </div>
        )
      })()}

      {/* ── Prompt table (active engines only) ──────────────────────────────── */}
      <div className="bg-dark-800 border border-dark-700 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
        <div className="min-w-[640px]">
        <div
          className="grid border-b border-dark-700 bg-dark-700/50"
          style={{ gridTemplateColumns: tableColsTemplate }}
        >
          <div className="px-3 py-3 text-xs text-slate-600">#</div>
          <div className="px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wide">{t.aiv_prompt}</div>
          {activeLLMs.map(llm => (
            <div key={llm.id} className={`px-2 py-3 text-xs font-medium text-center ${llm.color}`}>
              {llm.label}
            </div>
          ))}
        </div>

        {filtered.map((prompt, i) => {
          const rowResults = results.get(prompt.id)
          const isExpanded = expandedRow === prompt.id
          const mentionCount = activeLLMs.filter(l => rowResults?.get(l.id)?.brand_mentioned).length
          const hasData = activeLLMs.some(l => rowResults?.has(l.id))

          return (
            <div key={prompt.id} className="border-b border-dark-700 last:border-0">
              <div
                className="w-full grid hover:bg-dark-700/30 transition-colors cursor-pointer"
                style={{ gridTemplateColumns: tableColsTemplate }}
                onClick={() => setExpandedRow(isExpanded ? null : prompt.id)}
              >
                <div className="px-3 py-3 text-xs text-slate-600 self-center">{prompt.position || i + 1}</div>

                <div className="px-4 py-3 self-center">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${getCatColor(prompt.category)}`}>
                      {getCatLabel(prompt.category)}
                    </span>
                    {hasData && (
                      <span className={`text-xs font-semibold ${mentionCount >= activeLLMs.length * 0.8 ? 'text-emerald-400' : mentionCount >= activeLLMs.length * 0.4 ? 'text-amber-400' : 'text-red-400'}`}>
                        {mentionCount}/{activeLLMs.filter(l => rowResults?.has(l.id)).length} LLMs
                      </span>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); handleRefreshPrompt(prompt) }}
                      disabled={refreshingPromptId === prompt.id || collecting}
                      className="ml-auto p-1 rounded hover:bg-dark-600 text-slate-600 hover:text-slate-300 transition-colors disabled:opacity-30"
                      title="Re-run this prompt on all engines"
                    >
                      <RotateCcw size={11} className={refreshingPromptId === prompt.id ? 'animate-spin' : ''} />
                    </button>
                  </div>
                  <div className="text-sm text-slate-300 truncate max-w-md">{prompt.text}</div>
                </div>

                {activeLLMs.map(llm => {
                  const r = rowResults?.get(llm.id)
                  if (!r) return (
                    <div key={llm.id} className="px-2 py-3 flex items-center justify-center">
                      <span className="text-slate-700 text-xs">-</span>
                    </div>
                  )
                  const competitors = parseCompetitors(r.competitors_mentioned)
                  const topComp = competitors[0] ?? null
                  return (
                    <div key={llm.id} className="px-2 py-3 flex flex-col items-center justify-center gap-1">
                      {r.brand_mentioned ? (
                        <>
                          <span className="text-emerald-400 font-bold text-sm">{t.aiv_yes}</span>
                          {r.brand_position && (
                            <span className="text-[10px] text-emerald-500 font-medium">pos #{r.brand_position}</span>
                          )}
                          {topComp && r.brand_position && topComp.pos < r.brand_position && (
                            <span className="text-[9px] text-slate-600 text-center leading-tight max-w-[70px] truncate" title={`#${topComp.pos} ${topComp.name}`}>
                              #{topComp.pos} above
                            </span>
                          )}
                        </>
                      ) : (
                        <>
                          <span className="text-red-400 font-bold text-sm">{t.aiv_no}</span>
                          {topComp && (
                            <span className="text-[9px] text-red-400/70 text-center leading-tight max-w-[70px] truncate" title={`#${topComp.pos} ${topComp.name}`}>
                              #{topComp.pos} {topComp.name}
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  )
                })}
              </div>

              {isExpanded && (
                <div className="border-t border-dark-700/50 bg-dark-700/20 px-4 py-4">
                  <div className={`grid gap-3`} style={{ gridTemplateColumns: `repeat(${Math.min(activeLLMs.length, 5)}, 1fr)` }}>
                    {activeLLMs.map(llm => {
                      const r = rowResults?.get(llm.id)
                      const competitors = r ? parseCompetitors(r.competitors_mentioned) : []
                      const rankedList: { pos: number; name: string; isBrand: boolean }[] = [
                        ...competitors.map(c => ({ ...c, isBrand: false })),
                        ...(r?.brand_mentioned && r.brand_position
                          ? [{ pos: r.brand_position, name: brandName, isBrand: true }]
                          : []),
                      ].sort((a, b) => a.pos - b.pos)

                      return (
                        <div key={llm.id} className={`rounded-lg p-3 border ${r?.brand_mentioned ? 'bg-emerald-500/5 border-emerald-500/20' : r ? 'bg-red-500/5 border-red-500/20' : 'bg-dark-800 border-dark-700'}`}>
                          <div className={`text-xs font-semibold ${llm.color} mb-2 flex items-center gap-1.5`}>
                            <img src={llm.logoUrl} alt={llm.label} className="w-3.5 h-3.5 rounded object-contain" />
                            {llm.label}
                          </div>
                          {r ? (
                            <>
                              <div className={`text-xs font-bold mb-2 ${r.brand_mentioned ? 'text-emerald-400' : 'text-red-400'}`}>
                                {r.brand_mentioned ? t.aiv_mentioned : t.aiv_absent}
                              </div>
                              {rankedList.length > 0 && (
                                <div className="mb-2">
                                  <div className="text-[9px] text-slate-600 uppercase tracking-wide font-semibold mb-1">AI Top Results</div>
                                  {rankedList.map(entry => (
                                    <div key={`${entry.pos}-${entry.name}`}
                                      className={`text-[10px] flex items-start gap-1 mb-0.5 ${entry.isBrand ? 'text-emerald-400/90 font-medium' : 'text-slate-400/80'}`}>
                                      <span className="font-mono text-slate-600 shrink-0 w-5">#{entry.pos}</span>
                                      <span className="leading-tight">{entry.name}{entry.isBrand ? ' ✓' : ''}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                              {r.sentiment && r.brand_mentioned && (
                                <div className={`text-[10px] font-medium mb-1 ${r.sentiment === 'positive' ? 'text-emerald-500' : r.sentiment === 'negative' ? 'text-red-500' : 'text-slate-500'}`}>
                                  {r.sentiment}
                                </div>
                              )}
                              {r.checked_at && (
                                <div className="text-[10px] text-slate-600 font-mono">
                                  {new Date(r.checked_at).toLocaleDateString()}
                                </div>
                              )}
                              {r.response_snippet && (
                                <p className="text-[10px] text-slate-500 mt-1 line-clamp-3 italic leading-relaxed">
                                  {r.response_snippet}
                                </p>
                              )}
                            </>
                          ) : (
                            <div className="text-xs text-slate-600">{t.aiv_notChecked}</div>
                          )}
                        </div>
                      )
                    })}
                  </div>

                  {rowResults && (() => {
                    const missing = activeLLMs.filter(l => {
                      const r = rowResults.get(l.id)
                      return r && !r.brand_mentioned
                    })
                    if (missing.length === 0) return null
                    return (
                      <div className="mt-3 px-3 py-2.5 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                        <div className="text-xs text-amber-300 font-medium mb-0.5">
                          {fmt(t.aiv_opportunity, { brand: brandName, llms: missing.map(l => l.label).join(', ') })}
                        </div>
                        <div className="text-[11px] text-slate-500">{t.aiv_opportunityTip}</div>
                      </div>
                    )
                  })()}
                </div>
              )}
            </div>
          )
        })}

        {filtered.length === 0 && (
          <div className="text-center py-12 text-slate-500 text-sm">{t.aiv_noPrompts}</div>
        )}
        </div>
        </div>
      </div>

      <div className="mt-4 flex gap-4 text-xs text-slate-600">
        <span>{t.aiv_legend1}</span>
        <span>{t.aiv_legend2}</span>
        <span>{t.aiv_legend3}</span>
      </div>
    </div>
  )
}
