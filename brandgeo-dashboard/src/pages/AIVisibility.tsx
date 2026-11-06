import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import {
  RefreshCw, RotateCcw, TrendingUp, AlertTriangle, Target, ChevronDown, ChevronUp,
  Play, Loader2, Globe2, Copy, CheckCheck, Zap, Settings, X, Lock, Clock, Info,
  CircleCheck, Undo2, EyeOff,
} from 'lucide-react'
import { supabase, isDemoMode } from '../lib/supabase'
import { mockPrompts, mockAIResults } from '../lib/mockData'
import { useMarket, MARKETS } from '../lib/marketContext'
import { buildFixPrompt } from '../lib/fixPrompt'
import { useClient } from '../lib/clientContext'
import type { Prompt, AIResult, LLMName, PromptCategory } from '../types'
import { useI18n, fmt } from '../lib/i18nContext'
import { useCollection, type CollectionBlockReason } from '../lib/collectionContext'
import { useCollectionLanded } from '../lib/useCollectionLanded'
import { useTheme } from '../lib/themeContext'
import {
  ENGINE_META, ALL_ENGINES, COMING_SOON_ENGINES, RETIRED_ENGINES, ENGINE_UNLOCK_PLAN, PLAN_LABELS,
  getPlanLimits, QUEUE_ONLY_ENGINES,
  type EngineId, type EngineState,
} from '../lib/planConfig'
import { computeAiVisibilityScore, isNoAnswerRow } from '../lib/aiVisibilityScore'
import { MOTION_BASE, MOTION_FAST, EASE_OUT, heroReveal, useCountUp } from '../lib/motion'
import Collapse from '../components/Collapse'
import AllowanceMeter from '../components/AllowanceMeter'
import CooldownCountdown from '../components/CooldownCountdown'
import Skeleton from '../components/Skeleton'
import { PageTitle, SectionHeading } from '../components/Typography'
import { aggregateCompetitors } from '../lib/competitorFilter'
import { promptCategoryLabel } from '../lib/promptCategories'
import { useChartTheme } from '../lib/chartTheme'
import SharedEmptyState from '../components/EmptyState'
import { formatDate, formatRelativeOrDate, formatRatio } from '../lib/format'
import PromptResultCell from '../components/PromptResultCell'
import {
  buildCellViews, summarisePrompt, sortPrompts, promptCompetitors, buildHeadline,
  engineErrorSince, lockedCandidates, pickLockedColumns, parseRankedCompetitors,
  parseSortMode, sortStorageKey, SORT_MODES,
  type CellView, type CellState, type PerfRow, type PromptSummary, type SectionKey, type SortMode,
} from '../lib/promptPerformance'
import {
  AIV_COPY, promptCount, headlineRecommended, headlineNotYet, headlineUncheckedReason,
  joinEngineLabels, sectionUncheckedExtra, errorSinceChip, ratioNoneChip, enginesNamed, namedByEngines,
  lockedHeaderLabel, engineNotAnsweringLine, enginePartialLine, fixAppearsLine, fixAllMissingLine, fixAllLowLine,
  panelNotAnswering, panelLastResult, fixEngineMissingTitle,
  FIX_COPY, fixDoneWaiting, fixDoneWaitingData, fixVerifiedLine, fixReopenedLine, fixDismissedLine,
  fixPromptGapTitle, fixPromptGapLine, fixCheckNowWaiting, fixMarkedOn, fixMovedAnnouncement,
} from '../lib/aiVisibilityCopy'
import {
  fixIds, metricKeys, parseMetricKey, metricLabel, measureFix, evaluateFix, verdictCutoff,
  isOpenState, MAX_PROMPT_GAP_FIXES, type FixStateRow, type FixStatus,
} from '../lib/fixStates'

interface FixItem {
  id: string
  metricKey: string | null
  priority: 'P0' | 'P1' | 'P2'
  title: string
  description: string
  fix: string
  /** Display name and average rank of the rival, outranked fixes only (feed the copied prompt). */
  competitor?: string
  competitorAvgRank?: number | null
}

const FIX_SELECT = 'id, client_id, fix_id, status, title, metric_key, baseline_value, baseline_n, marked_at, checked_at, check_value, check_n'

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

const getCatLabel = (cat: string) => CATEGORY_LABEL[cat] ?? promptCategoryLabel(cat)
// A category is a grouping, not an alert — so its badge stays neutral (Gestalt
// Focal-Point Law: color is reserved for meaning, not decoration). One quiet
// chip for every category; the label text still identifies which one it is.
const getCatColor = (_cat: string) => 'bg-dark-700 text-slate-400'

// ── Types ─────────────────────────────────────────────────────────────────────

type ResultMap = Map<number, Map<LLMName, AIResult>>
type RankedEntry = { pos: number; name: string }

function parseCompetitors(raw: string | null | undefined): RankedEntry[] {
  return parseRankedCompetitors(raw)
}

// An optional focusable follow-up for a blocked-collection notice (§11 rule 2:
// "prose that names a destination without linking it is not an empty state").
// 'open-engine-modal' is only ever rendered for an admin -- the modal it opens
// is an admin-only surface, so a viewer must not be handed a control to it.
type BlockAction =
  | { kind: 'link'; to: string; label: string }
  | { kind: 'open-engine-modal'; label: string }
  | { kind: 'mailto'; href: string; label: string }

// Turns a CollectionBlockReason (collectionContext.tsx) into copy a customer
// can act on. Every reason the server can send is named explicitly; anything
// unrecognised (a future server reason, or a request that never got a usable
// answer at all) falls through to a plain, honest default that never echoes
// the server's raw string, because that string is not always customer copy
// (see the default case below). block.message is only trusted for 'cooldown',
// whose text is written for customers in _enqueue.js.
function describeCollectionBlock(block: CollectionBlockReason): { title: string; body: string; action?: BlockAction } {
  switch (block.reason) {
    case 'cooldown': {
      const hrs = block.retryAfterHours
      return {
        title: 'On cooldown',
        body: block.message
          ?? (hrs
            ? `Your plan sets how often a collection can run. The next one is available in about ${hrs} hour${hrs === 1 ? '' : 's'}.`
            : 'Your plan sets how often a collection can run. Try again shortly.'),
      }
    }
    // hourly_ceiling / monthly_budget / platform_budget deliberately IGNORE
    // block.message. The server's own text for these three (_auth.js) names
    // "LLM calls" and prints the client's exact EUR spend against its EUR
    // cap, e.g. "EUR 0.16 of EUR 0.30" -- our cost of goods, not something a
    // customer should ever see. This page already draws that line elsewhere
    // (the "Collection allowance" row a few hundred lines below deliberately
    // hides the euro meter from non-admins for the same reason). Admins can
    // still see the real number in that same allowance meter, so nothing is
    // lost, only kept off this notice.
    case 'hourly_ceiling':
      return { title: 'Rate limit reached', body: 'Too many checks ran in the last hour. Wait a bit, then try again.' }
    case 'monthly_budget':
      return {
        title: 'Monthly limit reached',
        body: 'This plan has used its collection allowance for the month. Contact support to raise it.',
        action: { kind: 'mailto', href: 'mailto:support@getbrandgeo.com?subject=' + encodeURIComponent('Raise my monthly collection allowance'), label: 'Contact support' },
      }
    case 'platform_budget':
      return { title: 'Paused for everyone', body: 'Collection is paused platform-wide right now. Try again later.' }
    case 'no active prompts':
      return {
        title: 'Nothing to collect',
        body: 'There are no active prompts to check yet. Add one in Prompts, then run again.',
        action: { kind: 'link', to: '/prompts', label: 'Go to Prompts' },
      }
    case 'no active engines':
      return {
        title: 'Nothing to collect',
        body: 'No AI engines are active on this plan right now. Check Engine Configuration.',
        action: { kind: 'open-engine-modal', label: 'Check Engine Configuration' },
      }
    case 'nothing to collect (already up to date)':
      return { title: 'Already up to date', body: 'Every active prompt has already been checked this month. Nothing new to collect.' }
    case 'client not found':
      return { title: 'Could not start', body: 'This client could not be found. Reload the page and try again.' }
    default:
      // Never render block.message here. Every 401/403 requireAuth rejection
      // (_auth.js) and every plain 400 with no matching reason lands in this
      // branch, and that text is internal auth vocabulary ("Unauthorized:
      // invalid or expired token", "Forbidden: client mismatch"), not
      // something a customer should read as an explanation. Logged instead,
      // so it is still findable by whoever debugs the report.
      if (block.message) console.warn('[AIVisibility] Unrecognised collection block reason:', block.reason, block.message)
      return { title: 'Could not start collection', body: 'Something went wrong starting the run. Check your connection and try again.' }
  }
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

  // A retired engine is coming-soon on every plan since coming-soon is decided
  // before plan membership, so without this it would pass the filter and the
  // admin modal would print "Coming Soon" for an engine that was withdrawn.
  const planEngines = ALL_ENGINES.filter(e => engineStates[e] !== 'locked' && !RETIRED_ENGINES.has(e))

  const handleToggle = async (engine: EngineId, current: boolean) => {
    setSaving(engine)
    await onToggle(engine, !current)
    setSaving(null)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-dark-800 border border-dark-600 rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-dark-700">
          {/* min-w-0 so a long client name truncates instead of widening the
              modal past its max-w-md (same min-width:auto flex trap). */}
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-white">Engine Configuration</h2>
            <p className="text-xs text-slate-500 mt-0.5 truncate" title={clientName}>{clientName}</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close engine configuration"
            className="shrink-0 p-1.5 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-dark-700 transition-colors"
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
                  <div className="flex items-center gap-1.5 text-sm font-medium text-white">
                    <span className="inline-block w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: meta.chartColor }} />
                    {meta.label}
                  </div>
                  {!isBuilt && (
                    <div className="text-[10px] text-slate-600 mt-0.5">Coming Soon, not yet collecting data</div>
                  )}
                  {isBuilt && !isEnabled && (
                    <div className="text-[10px] text-amber-600 mt-0.5">Disabled, shown as Coming Soon to client</div>
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
  const chart = useChartTheme()

  // Customer-facing allowance, derived from the plan rather than from spend.
  // Both come from getPlanLimits so this page cannot drift from what the
  // pricing page publishes or the DB trigger enforces.
  const planLimits    = getPlanLimits(activeClient?.plan ?? 'free')
  const planPromptCap = planLimits.prompts
  // Cooldown hours describe how often a run is allowed, which is what a
  // customer means by "how often do you check". 0 means no cooldown at all.
  const planCadence = (() => {
    const h = planLimits.collectionCooldownH
    if (h === 0)    return { label: 'On demand' }
    if (h <= 24)    return { label: 'Daily' }
    if (h <= 168)   return { label: 'Weekly, about 4 per month' }
    if (h <= 336)   return { label: 'Every two weeks' }
    return { label: 'Monthly' }
  })()

  const [prompts, setPrompts]           = useState<Prompt[]>([])
  const [results, setResults]           = useState<ResultMap>(new Map())
  const [errorEngines, setErrorEngines] = useState<Set<LLMName>>(new Set())
  // Engines that had SOME failed checks but also some OK results (mixed case) —
  // distinct from errorEngines (fully-failed only). Nielsen audit: the mixed case
  // silently showed a percentage with no hint that anything failed to sync.
  const [partialErrorEngines, setPartialErrorEngines] = useState<Set<LLMName>>(new Set())
  // Per-engine health, added 2026-07-29 after a real report of "the refresh
  // button does nothing". It DID run: it wrote an error row. But `isUnavailable`
  // requires checked === 0, so an engine holding older successful rows kept
  // rendering its old percentage and the failed attempt was invisible. The
  // spinner stopped and the card did not change, which is indistinguishable
  // from a dead button. lastAttempt* is the most recent attempt whatever its
  // outcome; lastOkAt is the most recent SUCCESS, which is what "checked" means
  // to a customer reading a number.
  const [engineHealth, setEngineHealth] = useState<Map<LLMName, {
    lastAttemptAt: string | null
    lastAttemptFailed: boolean
    lastErrorCode: string | null
    lastOkAt: string | null
  }>>(new Map())
  // Fix This hub: show top 3 by default, reveal the rest on demand (Nielsen audit
  // edge case: "add a Show all when there are more than 3 items").
  const [showAllFixes, setShowAllFixes] = useState(false)
  const [loading, setLoading]           = useState(true)
  const [filterCats, setFilterCats]     = useState<Set<string>>(new Set())
  const [expandedRow, setExpandedRow]   = useState<number | null>(null)
  const [lastChecked, setLastChecked]   = useState<string | null>(null)
  const [showInsights, setShowInsights] = useState(true)
  // Click-toggle state for the score-weighting help popup. Hover and keyboard focus
  // still reveal it via the CSS `group` pattern; this exists so touch users, who
  // have no hover state, can reach the same content.
  const [scoreInfoOpen, setScoreInfoOpen] = useState(false)
  const [showFixHub, setShowFixHub]     = useState(true)
  const [copiedFix, setCopiedFix]       = useState<string | null>(null)
  // Stored fix states (public.fix_states), keyed by fix_id. No row = open.
  const [fixRows, setFixRows]           = useState<Map<string, FixStateRow>>(new Map())
  const [fixRowsLoaded, setFixRowsLoaded] = useState(false)
  const [fixBusy, setFixBusy]           = useState<string | null>(null)
  const [fixNotice, setFixNotice]       = useState<{ id: string; text: string } | null>(null)
  const [showDoneFixes, setShowDoneFixes] = useState(false)
  const verdictInFlight = useRef<Set<string>>(new Set())
  // The client the page is showing right now, readable from async callbacks
  // that started under a different one; and the client `results` was loaded for.
  const clientRef = useRef<number | null>(null)
  clientRef.current = activeClientId ?? null
  const [resultsClientId, setResultsClientId] = useState<number | null>(null)
  // Focus target after a fix leaves the list, and a polite announcement of what
  // happened (WCAG 2.4.3 / 4.1.3; fix-states review L4).
  const fixHubToggleRef = useRef<HTMLButtonElement | null>(null)
  const [fixAnnounce, setFixAnnounce] = useState('')
  const [refreshed, setRefreshed]       = useState(false)
  // Granular refresh state (admin, cost-control): re-run one engine across all
  // prompts, or one (prompt, engine) cell — instead of paying for all 5 engines.
  const [refreshingEngine, setRefreshingEngine] = useState<EngineId | null>(null)
  const [refreshingCell, setRefreshingCell]     = useState<string | null>(null)  // `${promptId}:${engineId}`
  const [showEngineModal, setShowEngineModal]         = useState(false)
  // Raw rows for the active engines (every status). The per-cell view model in
  // promptPerformance.ts is built from these; `results` above stays the newest
  // OK row per cell and keeps feeding the score and the engine cards.
  const [rawRows, setRawRows]           = useState<PerfRow[]>([])
  // The prompt block could not be loaded. Existing data stays on screen.
  const [loadError, setLoadError]       = useState(false)
  // Sort mode, persisted per client. Every storage access is guarded: it throws
  // in private windows and when site data is blocked.
  const [sortMode, setSortMode]         = useState<SortMode>('best')
  // Section open state. appear and notYet open, unchecked collapsed; resets on a
  // client switch. `null` means "not touched yet", so the default can follow data.
  const [sectionOpen, setSectionOpen]   = useState<Partial<Record<SectionKey, boolean>>>({})
  // Order and membership frozen while a collection runs.
  const frozenRef = useRef<{ ids: Record<SectionKey, number[]>; sections: SectionKey[] } | null>(null)

  const { collecting, progress: collectProgress, lastCompletedAt, lastBlockReason, clearBlockReason, runCollection: startCollection, runSinglePrompt } = useCollection()
  // Per-action failure flags, distinct from lastBlockReason: they track
  // whether THIS SPECIFIC refresh (one engine, or one prompt-engine cell)
  // came back empty-handed, so the small inline notice sits next to the
  // control the user actually pressed rather than only at the top of the
  // page. Cleared at the start of the next attempt on that same target.
  const [engineRefreshFailed, setEngineRefreshFailed] = useState<EngineId | null>(null)
  const [cellRefreshFailed, setCellRefreshFailed]     = useState<string | null>(null)  // `${promptId}:${engineId}`

  // Active engines as a LLM-typed array (only engines with state === 'active')
  const activeLLMs = activeEngines.map(id => ({ id, ...ENGINE_META[id] }))

  const runCollection = async () => {
    // A per-action failure notice belongs to the attempt that produced it.
    // Starting a new run here means the last one is done and this page is
    // about to show whatever this run actually did, so any earlier "did not
    // run" flag from a per-engine or per-cell retry can no longer be true of
    // what is on screen. Left uncleared, a card could still say "Refresh did
    // not run" underneath data this exact run just collected.
    setEngineRefreshFailed(null)
    setCellRefreshFailed(null)
    await startCollection(activeClientId, false, selections, activeEngines)
    // Silent: this is a background completion of a run the user already saw
    // progress for (via the lastCompletedAt effect below, also silent), not a
    // fresh page open. A non-silent reload here would remount the whole page
    // to the loading skeleton right after live data had already appeared.
    load({ silent: true })
  }

  const forceCollection = async () => {
    setEngineRefreshFailed(null)
    setCellRefreshFailed(null)
    await startCollection(activeClientId, true, selections, activeEngines)
    load({ silent: true })
  }

  // Per-engine force refresh: re-run ALL prompts for ONE engine only (admin,
  // cost-control). Reuses the same enqueue+poll pipeline as the master Force
  // Refresh, just scoped to a single engine — _enqueue deletes and re-collects
  // ONLY that engine's rows, so you pay for one engine, not five.
  const handleRefreshEngine = async (engineId: EngineId) => {
    if (collecting || refreshingEngine !== null) return
    setRefreshingEngine(engineId)
    setEngineRefreshFailed(null)
    try {
      const result = await startCollection(activeClientId, true, selections, [engineId])
      // "Rejected" here means the enqueue call itself never started a run
      // (cooldown, budget, or a request failure), the same condition the
      // top-of-page notice reads from lastBlockReason, surfaced again right
      // on the card whose button was actually pressed.
      if (result.blocked) setEngineRefreshFailed(engineId)
    } finally {
      setRefreshingEngine(null)
      load({ silent: true })
    }
  }

  // Per-(prompt, engine) force refresh: re-run ONE prompt for ONE engine only —
  // the finest-grained, cheapest re-collect (one API call, one row replaced).
  const handleRefreshCell = async (prompt: Prompt, engineId: EngineId) => {
    if (refreshingCell !== null || collecting) return
    const cellKey = `${prompt.id}:${engineId}`
    setRefreshingCell(cellKey)
    setCellRefreshFailed(null)
    try {
      const result = await runSinglePrompt(activeClientId, prompt.id, prompt.text, selections, [engineId])
      // Every call this cell made came back rejected (network failure or a
      // non-2xx status), so the reload below will not show a new result.
      // Say so rather than leaving the spinner's stop as the only signal.
      if (!result.ok) setCellRefreshFailed(cellKey)
      await load({ silent: true })
    } finally {
      setRefreshingCell(null)
    }
  }

  // `silent` distinguishes a background reload (data already on screen, from
  // a collection in progress, a completed run, or a per-engine/per-cell refresh)
  // from a first-mount or user-pressed-Reload load. A silent call never
  // touches `loading` or `refreshed`, so the score card, engine grid and
  // table stay mounted and simply update in place instead of the whole page
  // flashing back to the loading skeleton. The "Refreshed!" flash next to the
  // Reload button is reserved for that button's own non-silent call.
  const load = async (opts: { silent?: boolean } = {}) => {
    const silent = opts.silent === true
    const cid = activeClientId
    if (!silent) setLoading(true)
    if (isDemoMode) {
      setResultsClientId(cid)
      const map: ResultMap = new Map()
      mockAIResults.forEach(r => {
        if (!map.has(r.prompt_id)) map.set(r.prompt_id, new Map())
        map.get(r.prompt_id)!.set(r.llm as LLMName, r)
      })
      setPrompts(mockPrompts)
      setResults(map)
      setRawRows(mockAIResults.filter(r => activeEngines.includes(r.llm as EngineId)) as PerfRow[])
      setLoadError(false)
      setLastChecked(new Date().toISOString())
      if (!silent) setLoading(false)
      return
    }

    const [{ data: pData, error: pError }, { data: rData, error: rError }] = await Promise.all([
      supabase.from('prompts').select('*').eq('is_active', true).eq('client_id', activeClientId).order('position'),
      supabase.from('ai_results').select('*').eq('client_id', activeClientId).order('checked_at', { ascending: false }),
    ])

    // A failed read must not look like "no prompts" or "nothing checked yet",
    // and must not wipe what is already on screen. Flag it and stop; the
    // prompt area shows a retry card.
    if (pError || rError) {
      setLoadError(true)
      if (!silent) setLoading(false)
      return
    }
    setLoadError(false)

    const map: ResultMap = new Map()
    const errEngines = new Set<LLMName>()
    const okEngines  = new Set<LLMName>()
    let latestChecked = lastChecked
    if (rData) {
      rData.forEach((r: AIResult) => {
        // Only show results for active engines
        if (!activeEngines.includes(r.llm as EngineId)) return
        if (!map.has(r.prompt_id)) map.set(r.prompt_id, new Map())
        const llmMap = map.get(r.prompt_id)!
        const llm = r.llm as LLMName
        // Drops rows where the engine ran but produced no answer, from BOTH
        // numerator and denominator. Rationale and the measured impact live on
        // isNoAnswerRow in aiVisibilityScore.ts. This check used to be inlined
        // here and nowhere else, which is how this page and the Overview
        // headline came to report different numbers for the same client.
        if (isNoAnswerRow(r)) return
        if (!llmMap.has(llm)) {
          if (r.status === 'error') {
            // Track error but exclude from analysis — don't count as a real result
            errEngines.add(llm)
          } else {
            llmMap.set(llm, r)
            okEngines.add(llm)
            if (!latestChecked || r.checked_at > latestChecked) latestChecked = r.checked_at
          }
        }
      })
    }
    // Engine is "unavailable" only when it has errors AND zero ok results
    setErrorEngines(new Set([...errEngines].filter(e => !okEngines.has(e))))
    // Mixed/partial: engine had at least one failed check AND at least one OK result.
    setPartialErrorEngines(new Set([...errEngines].filter(e => okEngines.has(e))))

    // Per-engine health. rData is ordered checked_at DESC, so the FIRST row seen
    // for an engine is its most recent attempt. Deliberately walks every row
    // rather than the per-prompt map above, because that map skips error rows
    // entirely — which is exactly how a failed refresh became invisible.
    const health = new Map<LLMName, {
      lastAttemptAt: string | null
      lastAttemptFailed: boolean
      lastErrorCode: string | null
      lastOkAt: string | null
    }>()
    rData?.forEach((r: AIResult) => {
      const llm = r.llm as LLMName
      if (!activeEngines.includes(llm as EngineId)) return
      let h = health.get(llm)
      if (!h) {
        h = { lastAttemptAt: null, lastAttemptFailed: false, lastErrorCode: null, lastOkAt: null }
        health.set(llm, h)
      }
      if (!h.lastAttemptAt) {
        h.lastAttemptAt     = r.checked_at
        h.lastAttemptFailed = r.status === 'error'
        h.lastErrorCode     = r.error_code ?? null
      }
      if (!h.lastOkAt && r.status !== 'error') h.lastOkAt = r.checked_at
    })
    setEngineHealth(health)
    setRawRows((rData ?? []).filter((r: AIResult) => activeEngines.includes(r.llm as EngineId)) as PerfRow[])

    if (pData) setPrompts(pData)
    setResults(map)
    // Which client these results belong to. The fix verdict reads it, so a
    // done fix is never judged against the previous client's answers during an
    // admin client switch (fix-states review M1).
    setResultsClientId(cid)
    if (latestChecked) setLastChecked(latestChecked)
    if (!silent) {
      setLoading(false)
      setRefreshed(true)
      setTimeout(() => setRefreshed(false), 2500)
    }
  }

  useEffect(() => {
    load()
    setEngineRefreshFailed(null)
    setCellRefreshFailed(null)
    // lastBlockReason lives in CollectionContext, which is app-level and
    // outlives this page, so a cooldown or budget notice from the PREVIOUS
    // client would otherwise still be on screen after switching to a client
    // that has never been blocked at all. Nothing else clears it on a client
    // switch, so this page has to.
    clearBlockReason()
  }, [activeClientId, activeEngines.join(',')])

  // Stored Fix This states for this client (docs/arch/fix-states.md). One small
  // read per load; demo mode keeps them in memory only.
  const loadFixRows = async () => {
    const cid = activeClientId
    if (isDemoMode || !cid) {
      setFixRows(new Map())
      setFixRowsLoaded(true)
      return
    }
    const { data, error } = await supabase
      .from('fix_states')
      .select(FIX_SELECT)
      .eq('client_id', cid)
    // A reply for a client the admin has already switched away from is dropped.
    if (clientRef.current !== cid) return
    if (error) {
      // A missing table (migration not applied) or a failed read must not
      // break the page: the hub falls back to today's behaviour, all open.
      console.error('[FixStates] load failed:', error.message)
      setFixRows(new Map())
      setFixRowsLoaded(true)
      return
    }
    const m = new Map<string, FixStateRow>()
    ;(data ?? []).forEach(r => {
      const row = r as FixStateRow
      m.set(row.fix_id, {
        ...row,
        baseline_value: row.baseline_value === null ? null : Number(row.baseline_value),
        check_value: row.check_value === null ? null : Number(row.check_value),
      })
    })
    setFixRows(m)
    setFixRowsLoaded(true)
  }

  useEffect(() => {
    setFixRows(new Map())
    setFixRowsLoaded(false)
    setShowDoneFixes(false)
    setFixNotice(null)
    verdictInFlight.current = new Set()
    loadFixRows()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeClientId])

  // Client switch: forget section open state, frozen order and the expanded row,
  // and read this client's saved sort. Separate from the effect above because it
  // must not re-run when only the engine set changes.
  useEffect(() => {
    setSectionOpen({})
    setExpandedRow(null)
    frozenRef.current = null
    let saved: string | null = null
    try { saved = window.localStorage.getItem(sortStorageKey(activeClientId)) } catch { saved = null }
    setSortMode(parseSortMode(saved))
  }, [activeClientId])

  const changeSort = (mode: SortMode) => {
    setSortMode(mode)
    try { window.localStorage.setItem(sortStorageKey(activeClientId), mode) } catch { /* storage blocked: the sort still applies for this visit */ }
  }
  // Silent: this fires roughly every 4s while a collection runs (see
  // collectionContext.tsx) as well as once at the very end. Data is already
  // on screen by the time this can fire, so it must never remount the page
  // to the loading skeleton or flash "Refreshed!" -- it should just update
  // the numbers in place as results land.
  useCollectionLanded(lastCompletedAt, () => load({ silent: true }))

  // ── Collection allowance (PRICING-STRATEGY-2026-07 §12 T2a) ─────────────────
  // Mirrors, client-side, the exact checks enqueue-collection.js enforces
  // (checkCollectionCooldown / checkCollectionLimits — netlify/functions/
  // _enqueue.js + _auth.js) so the countdown/meter shown here always matches
  // what the server will actually block on. Display-only: the server call is
  // still the authority at click time.
  const [collectionAllowance, setCollectionAllowance] = useState<{
    nextAvailableAt: string | null
    budgetSpentEur: number
    budgetCapEur: number
  }>({ nextAvailableAt: null, budgetSpentEur: 0, budgetCapEur: 0 })

  useEffect(() => {
    if (isDemoMode || !activeClientId) return
    let cancelled = false
    const loadAllowance = async () => {
      const plan = activeClient?.plan ?? 'free'
      const { collectionCooldownH, apiBudgetEur } = getPlanLimits(plan)

      const monthStart = new Date()
      monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0)

      const [{ data: lastRun }, { data: costRows }] = await Promise.all([
        collectionCooldownH > 0
          ? supabase.from('collection_runs')
              .select('created_at')
              .eq('client_id', activeClientId).eq('trigger', 'manual')
              .order('created_at', { ascending: false }).limit(1).maybeSingle()
          : Promise.resolve({ data: null }),
        supabase.from('ai_results')
          .select('cost_eur')
          .eq('client_id', activeClientId)
          .gte('checked_at', monthStart.toISOString()),
      ])
      if (cancelled) return

      let nextAvailableAt: string | null = null
      if (lastRun?.created_at && collectionCooldownH > 0) {
        const next = new Date(new Date(lastRun.created_at).getTime() + collectionCooldownH * 3_600_000)
        if (next.getTime() > Date.now()) nextAvailableAt = next.toISOString()
      }
      const budgetSpentEur = (costRows || []).reduce((s, r) => s + ((r as { cost_eur: number | null }).cost_eur || 0), 0)

      setCollectionAllowance({ nextAvailableAt, budgetSpentEur, budgetCapEur: apiBudgetEur })
    }
    loadAllowance()
    return () => { cancelled = true }
  }, [activeClientId, activeClient?.plan, lastCompletedAt])

  // ── Stats computed over active engines only ───────────────────────────────

  const llmStats = activeLLMs.map(llm => {
    const mentioned = prompts.filter(p => results.get(p.id)?.get(llm.id)?.brand_mentioned).length
    const checked   = prompts.filter(p => results.get(p.id)?.has(llm.id)).length
    return { ...llm, mentioned, checked, pct: checked > 0 ? Math.round((mentioned / checked) * 100) : 0 }
  })

  // AI Visibility Score + its 6 dimensions — shared with Dashboard.tsx's Overview hero
  // via aiVisibilityScore.ts so both pages always show the identical number (§7.4 Phase 3.1).
  const { dimensions, aiScore } = computeAiVisibilityScore(
    prompts.map(p => p.id),
    results,
    activeLLMs.map(l => l.id),
  )
  const overallPct = dimensions.recognition

  // Score count-up (0 → aiScore) once data has loaded — matches the Overview hero's
  // flow (useCountUp + ring sweep, DASHBOARD-UX-2026.md §6 Phase B). Called here,
  // unconditionally, so it stays before the `if (loading) return` early-return below
  // (Rules of Hooks).
  const displayedScore = useCountUp(aiScore, !loading)

  // Uses the SHARED aggregator now. This page carried its own copy that averaged
  // the pos:99 prose sentinel into the displayed rank, which is not a rank at all
  // but the marker _analysis.js writes for a name found in prose by
  // scanForKnownCompetitors. Competitors.tsx and Recommendations.tsx were both
  // migrated onto competitorFilter.ts on 2026-07-13 precisely to kill this; this
  // page was missed and kept publishing the wrong number for two weeks.
  //
  // Measured on Bucate pe Roate the day this was fixed: "elegant catering" showed
  // avg #61.3 against a true #2.1, "royal catering" #20.6 against #3.2. Those are
  // not slightly-off numbers, they are arithmetic on a sentinel, and one of them
  // was being printed into the headline Fix This card as the competitor beating
  // the client.
  const competitorFreq = aggregateCompetitors(
    Array.from(results.values()).flatMap(llmMap => Array.from(llmMap.values())),
    8,
  ).map(c => ({
    name: c.name,
    count: c.totalMentions,
    // Genuine ranks only. Null when an engine has never once ranked this name,
    // which the UI must render as "no rank" rather than inventing one.
    avgPos: c.avgPos,
    rankedMentions: c.rankedMentions,
    proseOnly: c.proseOnly,
  }))

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

  // ── Engine status (active engines only, for KNOW/PARTIAL/MISSING/UNAVAILABLE) ─

  const engineStatusCards = llmStats.map(s => {
    const isUnavailable = errorEngines.has(s.id) && s.checked === 0
    // Zero checks with no error is an absence of data, not a verdict: a red
    // MISSING card reading "0/0 prompts" told the customer they had failed
    // at something nobody had ever tried. dashboard-visual-system.md §11's
    // rule against rendering a zero as a measurement applies here too.
    const status: 'KNOW' | 'PARTIAL' | 'MISSING' | 'UNAVAILABLE' | 'NOT_MEASURED' = isUnavailable
      ? 'UNAVAILABLE'
      : s.checked === 0 ? 'NOT_MEASURED'
      : s.pct >= 50 ? 'KNOW' : s.pct >= 25 ? 'PARTIAL' : 'MISSING'
    let bestPos: number | null = null
    prompts.forEach(p => {
      const r = results.get(p.id)?.get(s.id)
      if (r?.brand_mentioned && r.brand_position) {
        if (bestPos === null || r.brand_position < bestPos) bestPos = r.brand_position
      }
    })
    const health = engineHealth.get(s.id as LLMName)
    return {
      ...s, status, bestPos, isUnavailable,
      lastOkAt:          health?.lastOkAt ?? null,
      lastAttemptFailed: health?.lastAttemptFailed ?? false,
      lastErrorCode:     health?.lastErrorCode ?? null,
    }
  })

  // Coming-soon and locked engines for the status grid
  // A retired engine reads as coming_soon from getEngineStates (so nothing
  // treats it as active) but is not forthcoming, so it renders nowhere here.
  const comingSoonEngines = ALL_ENGINES.filter(e => engineStates[e] === 'coming_soon' && !RETIRED_ENGINES.has(e))

  // ── Prompt performance (per-cell view model, sections, sort) ───────────────
  // All hooks here sit before the `if (loading)` early return (Rules of Hooks).

  // 640px and up shows the table layout; below it every row is a card.
  const [isWide, setIsWide] = useState<boolean>(() => {
    try { return window.matchMedia('(min-width: 640px)').matches } catch { return true }
  })
  useEffect(() => {
    let mq: MediaQueryList
    try { mq = window.matchMedia('(min-width: 640px)') } catch { return }
    const on = () => setIsWide(mq.matches)
    on()
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])

  const promptIdKey = prompts.map(p => p.id).join(',')
  const cellViews = useMemo(
    () => buildCellViews(rawRows, activeEngines, prompts.map(p => p.id)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rawRows, activeEngines.join(','), promptIdKey],
  )
  const summaries = useMemo(() => {
    const m = new Map<number, PromptSummary>()
    cellViews.forEach((cells, id) => m.set(id, summarisePrompt(cells)))
    return m
  }, [cellViews])
  const liveOrder = useMemo(
    () => sortPrompts(prompts.map(p => ({ id: p.id, position: p.position })), summaries, sortMode),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [summaries, sortMode, prompts],
  )
  // Freeze order and section membership for the duration of a collection. Cells
  // keep updating in place; the page re-sorts once when `collecting` goes false.
  // A change of sort mode takes a fresh snapshot, because the user asked for it.
  const frozenModeRef = useRef<SortMode>(sortMode)
  if (!collecting) {
    frozenRef.current = null
  } else if (!frozenRef.current || frozenModeRef.current !== sortMode) {
    frozenRef.current = { ids: liveOrder.ids, sections: liveOrder.sections }
    frozenModeRef.current = sortMode
  }
  const order = collecting && frozenRef.current ? frozenRef.current : liveOrder
  const orderFrozen = collecting && frozenRef.current !== null

  const headline = useMemo(
    () => buildHeadline(summaries, cellViews, competitorFreq),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [summaries, cellViews, results],
  )
  const errorSinceByEngine = useMemo(() => engineErrorSince(rawRows), [rawRows])
  const newestErrorAtByEngine = useMemo(() => {
    const out: Record<string, string> = {}
    rawRows.forEach(r => {
      if (r.status === 'error' && (!out[r.llm] || r.checked_at > out[r.llm])) out[r.llm] = r.checked_at
    })
    return out
  }, [rawRows])

  const lockedColumns = pickLockedColumns(engineStates)
  const lockedChipEngines = (isWide
    ? lockedCandidates(engineStates).filter(e => !lockedColumns.includes(e))
    : lockedCandidates(engineStates))

  // Rendered plan: sections in order, filtered by category, with one continuous
  // 1..N numbering across everything visible (collapsed sections still count).
  const renderPlan = (() => {
    const promptById = new Map(prompts.map(p => [p.id, p]))
    let n = 0
    return order.sections.map(key => {
      const rows = order.ids[key]
        .map(id => promptById.get(id))
        .filter((p): p is Prompt => !!p)
        .filter(p => filterCats.size === 0 || filterCats.has(p.category ?? ''))
        .map(p => ({ prompt: p, num: ++n }))
      return { key, rows }
    }).filter(sec => sec.rows.length > 0)
  })()
  const visibleCount = renderPlan.reduce((a, s) => a + s.rows.length, 0)
  const sectionIsOpen = (key: SectionKey): boolean => {
    const stored = sectionOpen[key]
    if (stored !== undefined) return stored
    if (key !== 'unchecked') return true
    return !renderPlan.some(s => s.key !== 'unchecked')
  }

  // ── Fix This hub ──────────────────────────────────────────────────────────

  const fixItems = (() => {
    // `id` is the stable fix id (fixStates.ts) a done mark is stored under;
    // `metricKey` is the number the re-check compares, null for a manual fix.
    const items: FixItem[] = []

    // Every active engine MISSING reads as one finding, not one P0 per engine:
    // the same sentence repeated four times says one thing four times.
    const allMissing = engineStatusCards.length > 0 && engineStatusCards.every(e => e.status === 'MISSING')
    if (allMissing) {
      const totalChecked = engineStatusCards.reduce((a, e) => a + e.checked, 0)
      const totalMentioned = engineStatusCards.reduce((a, e) => a + e.mentioned, 0)
      items.push({
        id: fixIds.visibilityAll(),
        metricKey: metricKeys.all(),
        priority: 'P0',
        title: totalMentioned === 0 ? AIV_COPY.fixAllMissingTitle : AIV_COPY.fixAllLowTitle,
        description: totalMentioned === 0
          ? fixAllMissingLine(brandName, totalChecked, engineStatusCards.length)
          : fixAllLowLine(brandName, totalMentioned, totalChecked, engineStatusCards.length),
        fix: `Create a dedicated "${brandName} overview" page answering your most common category queries. Submit it to authoritative directories and request coverage from publications AI engines trust. Ensure your domain has schema.org/Organization structured data with complete fields.`,
      })
    } else {
      engineStatusCards.filter(e => e.status === 'MISSING' && e.checked > 0 && !e.isUnavailable).forEach(e => {
        items.push({
          id: fixIds.engineMissing(e.id),
          metricKey: metricKeys.engine(e.id),
          priority: 'P0',
          title: fixEngineMissingTitle(e.label, e.mentioned),
          description: fixAppearsLine(brandName, e.mentioned, e.checked, e.label),
          fix: `Create a dedicated "${brandName} overview" page answering your most common category queries. Submit it to authoritative directories and request coverage from publications ${e.label} training data trusts. Ensure your domain has schema.org/Organization structured data with complete fields.`,
        })
      })
    }

    engineStatusCards.filter(e => e.status === 'PARTIAL' && e.checked > 0).forEach(e => {
      items.push({
        id: fixIds.engineLow(e.id),
        metricKey: metricKeys.engine(e.id),
        priority: 'P1',
        title: `Low visibility in ${e.label} (${e.pct}%)`,
        description: `Brand appears inconsistently, in ${e.mentioned} of ${e.checked} prompts checked.`,
        fix: `Strengthen brand authority signals for ${e.label}: publish 3+ long-form pages that directly answer your tracked queries, build backlinks from industry media mentioning ${brandName} in context, and add FAQ schema markup to your site's key landing pages.`,
      })
    })

    // "Outranked by" is a claim about RANK, so it now requires a rank on both
    // sides. It used to fire on `competitorFreq[0] && gapCount > 0`, which never
    // read a position at all: a name mentioned only in prose, carrying no rank
    // whatsoever, was announced as outranking the client in the headline P1.
    // Recommendations.tsx already gated this correctly; this page did not.
    const topRanked = competitorFreq.find(c => !c.proseOnly && c.avgPos !== null)
    if (topRanked && gapCount > 0) {
      items.push({
        id: fixIds.outranked(topRanked.name),
        metricKey: metricKeys.competitor(topRanked.name),
        competitor: topRanked.name,
        competitorAvgRank: topRanked.avgPos,
        priority: 'P1',
        title: `Outranked by ${topRanked.name} (avg #${topRanked.avgPos})`,
        description: `${topRanked.name} is ranked by an engine in ${topRanked.rankedMentions} of its ${topRanked.count} appearances, while ${brandName} is absent in ${gapCount} checks.`,
        fix: `Publish a detailed comparison page: "${brandName} vs ${topRanked.name}" covering differentiators, pricing, and use cases. Pitch this page to trade publications and ask clients for case study testimonials published under your domain.`,
      })
    }

    if (dimensions.consistency < 40 && overallPct > 0) {
      items.push({
        id: fixIds.consistency(),
        metricKey: metricKeys.consistency(),
        priority: 'P2',
        title: 'Inconsistent cross-prompt coverage',
        description: `Brand appears in only ${dimensions.consistency}% of prompts with consistent multi-engine coverage. AI models know you selectively.`,
        fix: `Map which prompt topics are missing and create dedicated content for each gap. Ensure every service category and location you serve has a standalone indexed page with your brand name in the H1 and title tag.`,
      })
    }

    if (dimensions.knowledge > 0 && dimensions.knowledge < 50) {
      items.push({
        id: fixIds.ranking(),
        metricKey: metricKeys.knowledge(),
        priority: 'P2',
        title: 'Improve ranking position',
        description: `When mentioned, ${brandName} averages a lower position. Competitors rank above you in shared responses.`,
        fix: `Build topical authority by publishing a content cluster: one pillar page on your main category + 5 supporting posts on subtopics. Internal-link them together. This signals depth of expertise to AI training pipelines.`,
      })
    }

    // Per-prompt gaps: every engine that answered left the brand out. These are
    // the steady supply of next fixes (fix-states.md section 6). Most contested
    // first (answers that named another brand), then prompt order; at most
    // MAX_PROMPT_GAP_FIXES open at a time, the next appear as these close.
    const gaps = prompts.map(p => {
      const cells = Array.from(results.get(p.id)?.values() ?? [])
      const withCompetitor = cells.filter(r => {
        try {
          const arr = JSON.parse(r.competitors_mentioned ?? '[]')
          return Array.isArray(arr) && arr.length > 0
        } catch { return false }
      }).length
      return { p, answers: cells.length, mentioned: cells.some(r => r.brand_mentioned), withCompetitor }
    })
      .filter(g => g.answers > 0 && !g.mentioned && isOpenState(fixRows.get(fixIds.promptGap(g.p.id))?.status))
      .sort((a, b) => b.withCompetitor - a.withCompetitor || a.p.position - b.p.position)
      .slice(0, MAX_PROMPT_GAP_FIXES)
    gaps.forEach(g => {
      items.push({
        id: fixIds.promptGap(g.p.id),
        metricKey: metricKeys.prompt(g.p.id),
        priority: 'P2',
        title: fixPromptGapTitle(g.p.text),
        description: fixPromptGapLine(brandName, g.answers, g.withCompetitor),
        fix: FIX_COPY.promptGapFix,
      })
    })

    return items
  })()

  // ── Fix states: open list, done list, mark, reopen, re-check ──────────────
  const fixPromptIds = prompts.map(p => p.id)
  const fixEngineIds = activeLLMs.map(l => l.id as string)
  const engineLabelOf = (id: string) => ENGINE_META[id as EngineId]?.label ?? id
  // Clipboard payload for "Copy as AI prompt" (fix-states.md section 11). The
  // builder is shared with MCP; this page only supplies the context.
  const fixPromptFor = (item: FixItem): string => buildFixPrompt(
    { id: item.id, title: item.title, competitor: item.competitor ?? null, competitorAvgRank: item.competitorAvgRank },
    {
      brandName,
      website: activeClient?.brand_website ?? null,
      market: MARKETS.find(m => m.id === activeClient?.default_market_id)?.label ?? null,
      engines: activeLLMs.map(l => ({ id: l.id as string, label: l.label })),
      prompts: prompts.map(p => ({ id: p.id, text: p.text })),
      results,
    },
  ) ?? item.fix
  const promptTextOf = (id: number) => prompts.find(p => p.id === id)?.text
  const openFixItems = fixItems.filter(i => isOpenState(fixRows.get(i.id)?.status))
  const doneFixRows = Array.from(fixRows.values())
    .filter(r => r.status === 'done' || r.status === 'verified' || r.status === 'dismissed')
    .sort((a, b) => (b.checked_at ?? b.marked_at ?? '').localeCompare(a.checked_at ?? a.marked_at ?? ''))

  const putFixRow = (row: FixStateRow) => {
    setFixRows(prev => {
      const next = new Map(prev)
      next.set(row.fix_id, {
        ...row,
        baseline_value: row.baseline_value === null ? null : Number(row.baseline_value),
        check_value: row.check_value === null ? null : Number(row.check_value),
      })
      return next
    })
  }

  // After a fix leaves the open list its buttons unmount, so focus would fall
  // to <body>. Move it to the hub's own toggle and say what happened.
  const afterFixMoved = (text: string) => {
    setFixAnnounce(text)
    setTimeout(() => fixHubToggleRef.current?.focus(), 0)
  }

  const markFix = async (item: FixItem, status: 'done' | 'dismissed') => {
    const cid = activeClientId
    // Never take a baseline from another client's answers mid-switch.
    if (!cid || fixBusy || resultsClientId !== cid) return
    const scope = status === 'done' ? parseMetricKey(item.metricKey) : null
    const m = scope ? measureFix(scope, results, fixPromptIds, fixEngineIds) : { value: null, n: 0 }
    const measurable = scope !== null && m.value !== null
    const payload = {
      client_id: cid,
      fix_id: item.id,
      status: status as FixStatus,
      title: item.title.slice(0, 500),
      metric_key: measurable ? item.metricKey : null,
      baseline_value: measurable ? m.value : null,
      baseline_n: measurable ? m.n : null,
    }
    setFixNotice(null)
    const announce = fixMovedAnnouncement(status, item.title)
    if (isDemoMode) {
      putFixRow({ ...payload, marked_at: new Date().toISOString(), checked_at: null, check_value: null, check_n: null })
      afterFixMoved(announce)
      return
    }
    setFixBusy(item.id)
    const { data, error } = await supabase
      .from('fix_states')
      .upsert(payload, { onConflict: 'client_id,fix_id' })
      .select(FIX_SELECT)
      .single()
    setFixBusy(null)
    if (clientRef.current !== cid) return
    if (error || !data) {
      console.error('[FixStates] mark failed:', error?.message)
      setFixNotice({ id: item.id, text: FIX_COPY.saveFailed })
      return
    }
    putFixRow(data as FixStateRow)
    afterFixMoved(announce)
  }

  const reopenFix = async (fixId: string) => {
    const cid = activeClientId
    if (!cid || fixBusy) return
    const row = fixRows.get(fixId)
    if (!row || row.client_id !== cid) return
    setFixNotice(null)
    const announce = fixMovedAnnouncement('open', row.title ?? fixId)
    if (isDemoMode) {
      putFixRow({ ...row, status: 'open' })
      afterFixMoved(announce)
      return
    }
    setFixBusy(fixId)
    const { data, error } = await supabase
      .from('fix_states')
      .update({ status: 'open' })
      .eq('client_id', cid)
      .eq('fix_id', fixId)
      .select(FIX_SELECT)
      .single()
    setFixBusy(null)
    if (clientRef.current !== cid) return
    if (error || !data) {
      console.error('[FixStates] reopen failed:', error?.message)
      setFixNotice({ id: fixId, text: FIX_COPY.saveFailed })
      return
    }
    putFixRow(data as FixStateRow)
    afterFixMoved(announce)
  }

  // Re-check on load and after every reload: a done fix whose scope has fresh
  // answers (7 days or more after marking) gets its verdict written once. The
  // database repeats the 7-day rule and only accepts a verdict from done.
  const [checkRequested, setCheckRequested] = useState<string | null>(null)
  const resultsKey = `${rawRows.length}:${lastChecked ?? ''}`
  useEffect(() => {
    // Rows and results must both belong to the client on screen (review M1):
    // during an admin client switch one render still holds the previous
    // client's rows or answers with the new activeClientId.
    if (loading || !fixRowsLoaded || !activeClientId || resultsClientId !== activeClientId) return
    fixRows.forEach(row => {
      if (row.status !== 'done' || row.client_id !== activeClientId) return
      const ev = evaluateFix(row, results, fixPromptIds, fixEngineIds)
      if (ev.state !== 'verdict') {
        if (checkRequested === row.fix_id) {
          setFixNotice({
            id: row.fix_id,
            text: ev.state === 'waiting'
              ? fixCheckNowWaiting(formatDate(ev.readyAfter))
              : ev.state === 'untracked' ? FIX_COPY.untracked : FIX_COPY.manual,
          })
          setCheckRequested(null)
        }
        return
      }
      if (checkRequested === row.fix_id) setCheckRequested(null)
      if (verdictInFlight.current.has(row.fix_id)) return
      verdictInFlight.current.add(row.fix_id)
      if (isDemoMode) {
        putFixRow({ ...row, status: ev.status, check_value: ev.value, check_n: ev.n, checked_at: new Date().toISOString() })
        verdictInFlight.current.delete(row.fix_id)
        return
      }
      supabase
        .from('fix_states')
        .update({ status: ev.status, check_value: ev.value, check_n: ev.n })
        .eq('client_id', row.client_id)
        .eq('fix_id', row.fix_id)
        .eq('status', 'done')
        .select(FIX_SELECT)
        .maybeSingle()
        .then(({ data, error }) => {
          verdictInFlight.current.delete(row.fix_id)
          if (clientRef.current !== row.client_id) return
          if (error) {
            // A browser clock ahead of the server lands here (the trigger
            // refuses a verdict before 7 days). Leave it done; a later load retries.
            console.error('[FixStates] verdict failed:', error.message)
            return
          }
          // No row matched: another tab already moved it. Re-read the truth.
          if (!data) { loadFixRows(); return }
          putFixRow(data as FixStateRow)
        })
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, fixRowsLoaded, fixRows, resultsKey, resultsClientId, checkRequested, activeClientId])

  const checkFixNow = async (fixId: string) => {
    setFixNotice(null)
    await load({ silent: true })
    setCheckRequested(fixId)
  }

  const doneFixLine = (row: FixStateRow): string => {
    const scope = parseMetricKey(row.metric_key)
    const label = metricLabel(scope, engineLabelOf, promptTextOf)
    const markedOn = row.marked_at ? formatDate(row.marked_at) : ''
    if (row.status === 'dismissed') return fixDismissedLine(markedOn)
    if (row.status === 'verified' && row.baseline_value !== null && row.check_value !== null) {
      return fixVerifiedLine(formatDate(row.checked_at ?? row.marked_at ?? ''), label, row.baseline_value, row.check_value)
    }
    if (!scope || row.baseline_value === null || !row.marked_at) return FIX_COPY.manual
    const ev = evaluateFix(row, results, fixPromptIds, fixEngineIds)
    if (ev.state === 'untracked') return `${fixMarkedOn(markedOn)} ${FIX_COPY.untracked}`
    if (ev.state === 'waiting' && Date.now() >= Date.parse(ev.readyAfter)) {
      return fixDoneWaitingData(markedOn, ev.fresh, ev.needed)
    }
    return fixDoneWaiting(markedOn, formatDate(verdictCutoff(row.marked_at)))
  }

  const reopenedFixLine = (row: FixStateRow | undefined): string | null => {
    if (!row || row.status !== 'reopened' || row.baseline_value === null || row.check_value === null) return null
    const label = metricLabel(parseMetricKey(row.metric_key), engineLabelOf, promptTextOf)
    return fixReopenedLine(
      row.marked_at ? formatDate(row.marked_at) : '',
      row.checked_at ? formatDate(row.checked_at) : '',
      label, row.baseline_value, row.check_value,
    )
  }

  // Content-shaped skeleton (DASHBOARD-UX-2026.md §6 Phase C, same pattern as
  // Dashboard.tsx's Overview skeleton) -- mirrors this page's real layout
  // (header / score card / engine grid / table header) so first mount doesn't
  // jump from a bare text line to the full page (CLS), and only ever renders
  // on a true first mount or a client switch (see the `silent` load() param
  // above), never during an in-progress or completed collection run.
  if (loading) return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto">
      <div className="mb-6 flex items-start justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-4 w-56" />
        </div>
        <Skeleton className="h-9 w-32 rounded-lg" />
      </div>

      <div className="mb-4 bg-dark-800 rounded-xl p-6 grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-6 items-center">
        <div className="flex flex-col items-center gap-3">
          <Skeleton className="w-40 h-40 rounded-full" />
          <Skeleton className="h-4 w-28" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-2 w-full rounded-full" />
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 mb-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-dark-800 border border-dark-700 rounded-xl p-card-compact flex items-center gap-3">
            <Skeleton className="w-12 h-12 rounded-xl shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3.5 w-20" />
              <Skeleton className="h-4 w-16" />
            </div>
          </div>
        ))}
      </div>

      {/* Prompt block skeleton. Two shapes, because the real block is a table
          from 640px up and a stack of cards below it. */}
      <div className="hidden sm:block">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-5 w-2/3 mt-3" />
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-8 w-20" />)}
          <Skeleton className="h-10 w-80" />
        </div>
        <Skeleton className="h-5 w-48 mt-6" />
        <div className="mt-2 flex flex-col gap-2">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}
        </div>
      </div>
      <div className="sm:hidden">
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-1/2 mt-2" />
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-8 w-20" />)}
        </div>
        <Skeleton className="h-11 w-full mt-2" />
        <div className="mt-4 flex flex-col gap-2">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 w-full rounded-lg" />)}
        </div>
      </div>
    </div>
  )

  const circumference   = 2 * Math.PI * 54
  const dashOffset      = circumference - (aiScore / 100) * circumference
  const ringTextFill    = theme === 'light' ? '#1e293b' : 'white'
  // The score ring's "%" glyph. Solid hexes, not alpha, so the value can be
  // contrast-checked at all: light was rgba(0,0,0,0.4), which composites to
  // rgb(153,153,153) on the white card and measures 2.85:1 at 14px/500 against
  // a 4.5 floor (discovery audit 2026-07-31, found while regression-sweeping
  // Layout.tsx). #556479 is the same muted value --axis-ink uses, 6.03:1 on the
  // card and 5.00:1 on the darkest light surface. Dark is unchanged in
  // appearance: #93979f IS rgba(255,255,255,0.55) composited on --dark-800,
  // and it already passed at 6.09:1.
  const ringTextFillDim = theme === 'light' ? '#556479' : '#93979f'

  // Zero mentions across everything that was answered. Three of the six
  // dimensions (knowledge, sentiment, accuracy) are defined only when the brand
  // was mentioned, so they read n/a here rather than a red 0%.
  const zeroMention = totalChecked > 0 && llmStats.reduce((a, l) => a + l.mentioned, 0) === 0
  const NEEDS_MENTION_DIMS = ['knowledge', 'sentiment', 'accuracy']

  const dimConfig = [
    { key: 'recognition', label: 'Recognition', value: dimensions.recognition, desc: 'Prompt coverage' },
    { key: 'knowledge',   label: 'Knowledge',   value: dimensions.knowledge,   desc: 'Position quality' },
    { key: 'sentiment',   label: 'Sentiment',   value: dimensions.sentiment,   desc: 'Tone when found' },
    { key: 'accuracy',    label: 'Accuracy',    value: dimensions.accuracy,    desc: 'Top-3 placement' },
    { key: 'reach',       label: 'Reach',       value: dimensions.reach,       desc: 'Engine coverage' },
    { key: 'consistency', label: 'Consistency', value: dimensions.consistency, desc: 'Cross-prompt rate' },
  ] as const

  // The button's accessible name stays fixed, so the outcome is announced
  // through the hub's polite live region (fix-prompt review L4), and a
  // refused clipboard write says so instead of doing nothing (I7).
  const copyFix = (id: string, text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedFix(id)
      // Clear an earlier "could not copy" notice for this fix (review N2).
      setFixNotice(n => (n?.id === id ? null : n))
      // Empty first, then the text: an identical string set twice is not a
      // change, so a second copy would never be announced (review N1).
      setFixAnnounce('')
      setTimeout(() => setFixAnnounce(FIX_COPY.copiedAnnounce), 50)
      setTimeout(() => setCopiedFix(null), 2000)
    }).catch(() => {
      setFixNotice({ id, text: FIX_COPY.copyFailed })
      setFixAnnounce(FIX_COPY.copyFailed)
    })
  }

  // Total columns in prompt table = active engines only. The prompt column
  // carries a real minimum and the engine columns are elastic between 3.5rem
  // and 5.5rem, so at half-screen widths the prompt keeps its room and the
  // table scrolls sideways only below its true minimum, instead of crushing
  // the prompt to three letters while seven 8rem engine columns stay rigid.
  const PROMPT_COL_MIN_REM = 13
  const ENGINE_COL_MIN_REM = 3.5
  const LOCKED_COL_MIN_REM = 2.75
  const lockedTemplate = lockedColumns.length > 0 ? ` repeat(${lockedColumns.length}, minmax(${LOCKED_COL_MIN_REM}rem, 3.5rem))` : ''
  const tableColsTemplate = `2.5rem minmax(${PROMPT_COL_MIN_REM}rem, 1fr) repeat(${activeLLMs.length}, minmax(${ENGINE_COL_MIN_REM}rem, 5.5rem))${lockedTemplate}`
  const tableMinWidth = `${2.5 + PROMPT_COL_MIN_REM + activeLLMs.length * ENGINE_COL_MIN_REM + lockedColumns.length * LOCKED_COL_MIN_REM}rem`

  // ── Prompt area render helpers ─────────────────────────────────────────────
  // Plain functions that return JSX (no hooks), so they can read page state.
  // Spec: docs/design/ai-visibility-prompt-focus-spec-2026-10-28.md section 5.

  const NEUTRAL_CHIP = 'inline-flex shrink-0 items-center rounded-full bg-dark-700 px-2 py-0.5 text-xs text-slate-200 tabular-nums'
  const AMBER_CHIP = 'inline-flex shrink-0 items-center rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-xs text-amber-400'
  const SORT_LABEL: Record<SortMode, string> = {
    best: AIV_COPY.sortBest,
    needs_work: AIV_COPY.sortNeedsWork,
    position: AIV_COPY.sortPosition,
    recent: AIV_COPY.sortRecent,
  }
  const SECTION_TITLE: Record<SectionKey, string> = {
    appear: AIV_COPY.sectionAppear,
    notYet: AIV_COPY.sectionNotYet,
    unchecked: AIV_COPY.sectionUnchecked,
  }

  const toggleRow = (id: number) => setExpandedRow(prev => (prev === id ? null : id))

  const chevron = (open: boolean) => (
    <ChevronDown
      size={16}
      aria-hidden="true"
      className={`shrink-0 text-slate-400 transition-transform motion-reduce:transition-none ${open ? 'rotate-180' : ''}`}
      style={{ transitionDuration: `${Math.round(MOTION_FAST * 1000)}ms` }}
    />
  )

  const categoryChip = (prompt: Prompt) => (
    <span className={`shrink-0 text-[10px] font-medium px-1.5 leading-[15px] rounded-full ${getCatColor(prompt.category)}`}>
      {getCatLabel(prompt.category)}
    </span>
  )

  const cellOf = (promptId: number, engineId: EngineId, variant: 'grid' | 'tile') => {
    const cv = cellViews.get(promptId)?.get(engineId)
    return (
      <PromptResultCell
        state={cv?.state ?? 'pending'}
        engineId={engineId}
        position={cv?.position ?? null}
        errorSince={cv?.errorSince ?? null}
        previousOkAt={cv?.previousOk?.checked_at ?? null}
        variant={variant}
      />
    )
  }

  const emptyCells = new Map<EngineId, CellView>()

  // The first competitor of a prompt's own aggregate, for the row meta slot.
  const topCompetitorOf = (promptId: number): string | null => {
    const list = promptCompetitors(cellViews.get(promptId) ?? emptyCells)
    return list.length > 0 ? list[0].name : null
  }

  // Cell strip shown at the top of an expanded notYet or unchecked row.
  const cellStrip = (promptId: number) => {
    if (!isWide) {
      return (
        <div className="grid grid-cols-4 gap-1.5 mb-3">
          {activeLLMs.map(llm => <div key={llm.id}>{cellOf(promptId, llm.id, 'tile')}</div>)}
        </div>
      )
    }
    const template = `repeat(${activeLLMs.length}, minmax(${ENGINE_COL_MIN_REM}rem, 5.5rem))`
    return (
      <div className="overflow-x-auto mb-3">
        <div style={{ minWidth: `${activeLLMs.length * ENGINE_COL_MIN_REM}rem` }}>
          <div className="grid" style={{ gridTemplateColumns: template }}>
            {activeLLMs.map(llm => (
              <div key={llm.id} className="px-1 py-1 flex flex-col items-center gap-1">
                <img src={llm.logoUrl} alt="" aria-hidden="true" className="w-4 h-4 rounded object-contain" />
                <span className="text-[10px] font-semibold text-slate-300 text-center leading-tight">{llm.label}</span>
              </div>
            ))}
          </div>
          <div className="grid" style={{ gridTemplateColumns: template }}>
            {activeLLMs.map(llm => <div key={llm.id} className="px-1 py-1">{cellOf(promptId, llm.id, 'grid')}</div>)}
          </div>
        </div>
      </div>
    )
  }

  // Who the engines recommended for this one prompt (notYet rows only).
  const competitorBlock = (prompt: Prompt) => {
    const list = promptCompetitors(cellViews.get(prompt.id) ?? emptyCells)
    const answered = summaries.get(prompt.id)?.answered ?? 0
    return (
      <div className="mb-3">
        <h4 className="text-xs font-semibold text-slate-200 mb-2">{AIV_COPY.competitorHeading}</h4>
        {list.length === 0 ? (
          <p className="text-sm text-slate-400">{AIV_COPY.competitorEmpty}</p>
        ) : (
          <ol className="space-y-1.5">
            {list.map(c => (
              <li key={c.name} className="flex items-baseline gap-2">
                <span className="text-sm text-slate-200">{c.name}</span>
                <span className="text-xs text-slate-400">{namedByEngines(c.k, answered)}</span>
                {c.bestRank != null && <span className="text-xs text-slate-400 tabular-nums">#{c.bestRank}</span>}
              </li>
            ))}
          </ol>
        )}
      </div>
    )
  }

  // Top results list, shared by a current ok cell and an error cell's previous ok row.
  const topResultsOf = (row: { brand_mentioned: boolean; brand_position: number | null; competitors_mentioned?: string | null }) => {
    const competitors = parseCompetitors(row.competitors_mentioned ?? null)
    const rankedList: { pos: number; name: string; isBrand: boolean }[] = [
      ...competitors.map(c => ({ ...c, isBrand: false })),
      ...(row.brand_mentioned && row.brand_position
        ? [{ pos: row.brand_position, name: brandName, isBrand: true }]
        : []),
    ].sort((a, b) => a.pos - b.pos)
    if (rankedList.length === 0) return null
    return (
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
    )
  }

  // Existing per-engine detail panel (engine cards plus the opportunity box).
  const enginePanel = (prompt: Prompt) => {
    const rowResults = results.get(prompt.id)
    const cols = Math.min(activeLLMs.length, 5)
    const missing = rowResults ? activeLLMs.filter(l => {
      const r = rowResults.get(l.id)
      return r && !r.brand_mentioned
    }) : []
    return (
      <>
        <div
          className="grid grid-cols-2 gap-3 sm:grid-cols-[var(--aiv-cols)]"
          style={{ ['--aiv-cols' as string]: `repeat(${cols}, 1fr)` }}
        >
          {activeLLMs.map(llm => {
            const r = rowResults?.get(llm.id)
            const cv = cellViews.get(prompt.id)?.get(llm.id)
            const isErrorCell = cv?.state === 'error'
            const tone = isErrorCell
              ? 'bg-dark-800 border-dark-700'
              : r?.brand_mentioned ? 'bg-sentiment-positive-15 border-sentiment-positive-20'
              : r ? 'bg-sentiment-negative-15 border-sentiment-negative-20'
              : 'bg-dark-800 border-dark-700'
            return (
              <div key={llm.id} className={`rounded-lg p-3 border ${tone}`}>
                <div className="text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
                  <img src={llm.logoUrl} alt={llm.label} className="w-3.5 h-3.5 rounded object-contain" />
                  {llm.label}
                  {/* QUEUE_ONLY_ENGINES cannot finish inside the 26s Netlify wall
                      the single-cell refresh posts to, so for them the control
                      starts the background run for that engine across all
                      prompts, the same thing the engine card does. */}
                  {isAdmin && (QUEUE_ONLY_ENGINES.includes(llm.id) ? (
                    <button
                      onClick={(ev) => { ev.stopPropagation(); handleRefreshEngine(llm.id) }}
                      disabled={collecting || refreshingEngine !== null}
                      className="ml-auto p-1 rounded hover:bg-dark-600 text-slate-600 hover:text-slate-300 transition-colors disabled:opacity-30"
                      title={`${llm.label} is too slow for an instant re-run, so this starts it in the background across all prompts. It keeps running if you leave the page.`}
                      aria-label={`Re-run ${llm.label} in the background`}
                    >
                      <Clock size={11} className={refreshingEngine === llm.id ? 'animate-spin' : ''} />
                    </button>
                  ) : (
                    <button
                      onClick={(ev) => { ev.stopPropagation(); handleRefreshCell(prompt, llm.id) }}
                      disabled={refreshingCell !== null || collecting}
                      className="ml-auto p-1 rounded hover:bg-dark-600 text-slate-600 hover:text-slate-300 transition-colors disabled:opacity-30"
                      title={`Re-run this prompt on ${llm.label} only. Charges for one engine call.`}
                      aria-label={`Re-run this prompt on ${llm.label} only`}
                    >
                      <RotateCcw size={11} className={refreshingCell === `${prompt.id}:${llm.id}` ? 'animate-spin' : ''} />
                    </button>
                  ))}
                </div>
                {cellRefreshFailed === `${prompt.id}:${llm.id}` && (
                  <div className="flex items-center gap-1 text-[10px] text-red-400 mb-1.5">
                    <AlertTriangle size={9} /> Refresh failed, try again
                  </div>
                )}
                {isErrorCell && cv ? (
                  <>
                    <div className="text-xs text-amber-400 mb-1">
                      {panelNotAnswering(formatDate(cv.errorSince ?? cv.current?.checked_at ?? ''))}
                    </div>
                    {cv.previousOk && (
                      <>
                        <div className="text-xs text-slate-400 mb-2">{panelLastResult(formatDate(cv.previousOk.checked_at))}</div>
                        {topResultsOf(cv.previousOk)}
                        {cv.previousOk.response_snippet && (
                          <p className="text-[10px] text-slate-500 mt-1 line-clamp-3 italic leading-relaxed">
                            {cv.previousOk.response_snippet}
                          </p>
                        )}
                      </>
                    )}
                  </>
                ) : r ? (
                  <>
                    <div className={`text-xs font-bold mb-2 ${r.brand_mentioned ? 'text-emerald-400' : 'text-red-400'}`}>
                      {r.brand_mentioned ? t.aiv_mentioned : t.aiv_absent}
                    </div>
                    {topResultsOf(r)}
                    {r.sentiment && r.brand_mentioned && (
                      <div className={`text-[10px] font-medium mb-1 ${r.sentiment === 'positive' ? 'text-emerald-500' : r.sentiment === 'negative' ? 'text-red-500' : 'text-slate-500'}`}>
                        {r.sentiment}
                      </div>
                    )}
                    {r.checked_at && (
                      <div className="text-[10px] text-slate-600 font-mono">
                        {formatDate(r.checked_at)}
                      </div>
                    )}
                    {r.response_snippet && (
                      <p className="text-[10px] text-slate-500 mt-1 line-clamp-3 italic leading-relaxed">
                        {r.response_snippet}
                      </p>
                    )}
                  </>
                ) : cv?.state === 'no_answer' ? (
                  <div className="text-xs text-slate-400">{AIV_COPY.legendNoAnswer}</div>
                ) : (
                  <div className="text-xs text-slate-600">{t.aiv_notChecked}</div>
                )}
              </div>
            )
          })}
        </div>

        {missing.length > 0 && (
          <div className="mt-3 px-3 py-2.5 bg-dark-700/40 border border-dark-600 rounded-lg flex items-start gap-2">
            <Info size={14} aria-hidden="true" className="mt-0.5 shrink-0 text-slate-400" />
            <div>
              <div className="text-xs text-slate-200 font-medium mb-0.5">
                {fmt(t.aiv_opportunity, { brand: brandName, llms: missing.map(l => l.label).join(', ') })}
              </div>
              <div className="text-[11px] text-slate-400">{t.aiv_opportunityTip}</div>
            </div>
          </div>
        )}
      </>
    )
  }

  // Expanded body wrapper. `kind` decides what sits above the existing panel.
  const expandedBody = (prompt: Prompt, kind: SectionKey) => (
    <Collapse open={expandedRow === prompt.id}>
      <div id={`aiv-row-${prompt.id}`} className="border-t border-dark-700/50 bg-dark-700/20 px-4 py-4">
        {kind !== 'appear' && cellStrip(prompt.id)}
        {kind === 'notYet' && competitorBlock(prompt)}
        {enginePanel(prompt)}
      </div>
    </Collapse>
  )

  // One row of any section, at any width.
  const renderRow = (kind: SectionKey, prompt: Prompt, num: number) => {
    const isExpanded = expandedRow === prompt.id
    const sum = summaries.get(prompt.id)
    const answered = sum?.answered ?? 0
    const mentions = sum?.mentions ?? 0
    const topComp = kind === 'notYet' ? topCompetitorOf(prompt.id) : null
    const cv = cellViews.get(prompt.id)
    const cellsList = cv ? Array.from(cv.values()) : []
    const hasError = cellsList.some(c => c.state === 'error')
    const onlyPending = !hasError && cellsList.every(c => c.state === 'pending')

    const reasonChip = kind === 'unchecked'
      ? hasError
        ? <span className={AMBER_CHIP}>{errorSinceChip(formatDate(sum?.oldestErrorSince ?? ''))}</span>
        : <span className={NEUTRAL_CHIP}>{onlyPending ? AIV_COPY.chipPending : AIV_COPY.chipNoAnswer}</span>
      : null
    const ratioChip = kind === 'appear'
      ? <span className={NEUTRAL_CHIP}>{formatRatio(mentions, answered, 'engines')}</span>
      : kind === 'notYet'
        ? <span className={NEUTRAL_CHIP}>{ratioNoneChip(answered)}</span>
        : null

    if (!isWide) {
      return (
        <div>
          <button
            type="button"
            aria-expanded={isExpanded}
            aria-controls={`aiv-row-${prompt.id}`}
            onClick={() => toggleRow(prompt.id)}
            className="block w-full text-left rounded-lg border border-dark-700 bg-dark-800 p-3 min-h-[44px]"
          >
            <span className="flex items-start gap-2">
              <span className="text-xs text-slate-400 tabular-nums shrink-0 pt-0.5">{num}</span>
              <span className="block min-w-0 flex-1 text-sm text-slate-200 line-clamp-2">{prompt.text}</span>
              {chevron(isExpanded)}
            </span>
            <span className="flex flex-wrap items-center gap-2 mt-1.5">
              {categoryChip(prompt)}
              {ratioChip}
              {reasonChip}
            </span>
            {kind === 'appear' && (
              <span className="grid grid-cols-4 gap-1.5 mt-2">
                {activeLLMs.map(llm => <span key={llm.id} className="block">{cellOf(prompt.id, llm.id, 'tile')}</span>)}
              </span>
            )}
            {kind === 'notYet' && topComp && (
              <span className="block text-xs text-slate-400 mt-1.5">{enginesNamed(topComp)}</span>
            )}
          </button>
          {expandedBody(prompt, kind)}
        </div>
      )
    }

    if (kind === 'appear') {
      return (
        <div className={`border-b border-dark-700 last:border-0 ${num % 2 === 0 ? 'bg-dark-700/15' : ''}`}>
          <button
            type="button"
            aria-expanded={isExpanded}
            aria-controls={`aiv-row-${prompt.id}`}
            onClick={() => toggleRow(prompt.id)}
            className="grid w-full text-left transition-colors hover:bg-dark-700/30"
            style={{ gridTemplateColumns: tableColsTemplate }}
          >
            <span className="block px-2 py-2.5 self-center">
              <span className="inline-flex items-center justify-center min-w-[1.5rem] h-5 px-1 rounded-md bg-dark-700 text-[10px] font-semibold text-slate-400 tabular-nums">
                {/* Sequential across the rendered sections, never the stored
                    `position` (a sort key with gaps and duplicates). */}
                {num}
              </span>
            </span>
            <span className="block px-3 py-2.5 self-center min-w-0">
              <span className="flex items-center gap-2 min-w-0">
                <span className="block truncate flex-1 min-w-0 text-sm text-slate-200" title={prompt.text}>{prompt.text}</span>
                {chevron(isExpanded)}
              </span>
              <span className="flex items-center gap-1.5 mt-1 min-w-0 whitespace-nowrap">
                {categoryChip(prompt)}
                {ratioChip}
                {isAdmin && (
                  <span className="min-w-0 truncate text-[9px] text-slate-600 hidden lg:inline" title="Expand this row to re-run a single engine">
                    expand to refresh per engine
                  </span>
                )}
              </span>
            </span>
            {activeLLMs.map(llm => (
              <span key={llm.id} className="block px-1 py-1 self-center">{cellOf(prompt.id, llm.id, 'grid')}</span>
            ))}
            {lockedColumns.map(id => (
              <span key={id} aria-hidden="true" className="block px-1 py-1 self-center">
                <PromptResultCell state="locked" engineId={id} />
              </span>
            ))}
          </button>
          {expandedBody(prompt, kind)}
        </div>
      )
    }

    // CalmRow (notYet) and UncheckedRow (unchecked): same four-column grid.
    return (
      <div>
        <button
          type="button"
          aria-expanded={isExpanded}
          aria-controls={`aiv-row-${prompt.id}`}
          onClick={() => toggleRow(prompt.id)}
          className="grid w-full items-center gap-3 px-3 min-h-[44px] py-2 text-left grid-cols-[2.5rem_minmax(0,1fr)_auto_auto] hover:bg-dark-700/40 rounded-lg"
        >
          <span className="text-xs text-slate-400 tabular-nums">{num}</span>
          <span className="flex items-center gap-2 min-w-0">
            <span className="block truncate min-w-0 text-sm text-slate-200" title={prompt.text}>{prompt.text}</span>
            {categoryChip(prompt)}
          </span>
          <span className="flex items-center gap-2 min-w-0">
            {ratioChip}
            {reasonChip}
            {kind === 'notYet' && topComp && (
              <span className="hidden md:block text-xs text-slate-400 truncate max-w-[14rem]">{enginesNamed(topComp)}</span>
            )}
          </span>
          {chevron(isExpanded)}
        </button>
        {expandedBody(prompt, kind)}
      </div>
    )
  }

  const runHeadlineAction = () => { if (isAdmin) forceCollection(); else runCollection() }
  const headlineEngineLabel = headline.engine ? ENGINE_META[headline.engine].label : null
  const uncheckedEngineList = joinEngineLabels(headline.errorEngines.map(e => ENGINE_META[e].label))

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
            <PageTitle>{t.aiv_title}</PageTitle>
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
                - {fmt(t.aiv_lastChecked, { date: formatDate(lastChecked) })}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {/* Engine configuration is an admin-only concern (sets what every client
              on a plan collects). Kept admin-gated. */}
          {isAdmin && (
            <button
              onClick={() => setShowEngineModal(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors border border-dark-600 bg-dark-700/50 text-slate-400 hover:text-slate-200 hover:border-dark-500"
              title="Configure engines for this client"
              aria-label="Configure engines for this client"
            >
              <Settings size={14} />
              <span className="hidden sm:inline" aria-hidden="true">Engines</span>
            </button>
          )}
          {/* PRIMARY action — the only solid-violet button in the header, so the
              eye lands on it (Nielsen audit: "reserve solid purple for the primary CTA").
              Visible to VIEWERS too, not just admins: a self-serve client MUST be able
              to trigger their own collection — the backend already authorises a viewer
              to run collection for their own client (_auth.js step 5) and budget-caps it
              (checkCollectionLimits). Without this, a free signup can add prompts but
              never see a single result — the product is inert for them. */}
          <button
            onClick={runCollection}
            disabled={collecting || loading || (!isAdmin && !!collectionAllowance.nextAvailableAt)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors border border-brand-500 bg-brand-500 text-white hover:bg-brand-400 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {collecting
              ? <><Loader2 size={14} className="animate-spin" /> {collectProgress ? `${collectProgress.done}/${collectProgress.total}` : 'Starting…'}</>
              : <><Play size={14} /> Run Collection</>
            }
          </button>
          {/* Force Refresh WIPES all existing results before re-running — destructive.
              Kept admin-only so a client can't accidentally delete their own history. */}
          {isAdmin && (
            <button
              onClick={forceCollection}
              disabled={collecting || loading}
              title="Force Refresh: wipes existing results and re-runs all engines"
              aria-label="Force refresh: wipes existing results and re-runs all engines"
              /* Grouped with the other secondary actions (same outlined base), but keeps a
                 muted orange label/border so it still reads as the destructive one — Error
                 Prevention cue preserved, per the Nielsen audit's own praise for it. */
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors border border-dark-600 bg-dark-700/50 text-orange-300/90 hover:text-orange-200 hover:border-orange-500/40 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RotateCcw size={14} />
              <span className="hidden sm:inline" aria-hidden="true">Force Refresh</span>
            </button>
          )}
          {/* Secondary/neutral outlined — same base as Engines + Force Refresh. */}
          <button
            onClick={() => load()}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors border border-dark-600 bg-dark-700/50 text-slate-400 hover:text-slate-200 hover:border-dark-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            {refreshed ? <span className="text-emerald-400">{t.aiv_refreshed}</span> : t.aiv_reload}
          </button>
        </div>
      </div>

      {/* Blocked-collection notice. Covers every button that goes through
          startCollection (Run Collection, Force Refresh, and per-engine
          Force Refresh below): they all share lastBlockReason in
          collectionContext, so whichever one was actually pressed, a
          cooldown, a budget ceiling, or nothing-to-collect always shows
          here instead of the click silently doing nothing. */}
      {lastBlockReason && (() => {
        const { title, body, action } = describeCollectionBlock(lastBlockReason)
        // 'open-engine-modal' opens an admin-only surface, so it only renders
        // for an admin; every other action kind is safe for any viewer.
        const showAction = !!action && (action.kind !== 'open-engine-modal' || isAdmin)
        return (
          <div className="mb-4 flex items-start justify-between gap-3 px-3 py-2.5 rounded-lg text-xs bg-amber-500/10 border border-amber-500/20">
            <div className="flex items-start gap-2 min-w-0">
              <AlertTriangle size={14} className="shrink-0 mt-0.5 text-amber-400" />
              <div className="min-w-0">
                <span className="font-semibold text-amber-300">{title}.</span>{' '}
                <span className="text-amber-300/80">{body}</span>
                {showAction && (
                  <div className="mt-1.5">
                    {action!.kind === 'link' && (
                      <Link to={action!.to} className="font-medium text-amber-300 hover:text-amber-200 underline underline-offset-2">
                        {action!.label}
                      </Link>
                    )}
                    {action!.kind === 'open-engine-modal' && (
                      <button
                        onClick={() => setShowEngineModal(true)}
                        className="font-medium text-amber-300 hover:text-amber-200 underline underline-offset-2"
                      >
                        {action!.label}
                      </button>
                    )}
                    {action!.kind === 'mailto' && (
                      <a href={action!.href} className="font-medium text-amber-300 hover:text-amber-200 underline underline-offset-2">
                        {action!.label}
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={clearBlockReason}
              aria-label="Dismiss"
              className="relative flex-shrink-0 text-amber-300/70 hover:text-amber-200 after:absolute after:content-[''] after:[inset:-15px]"
            >
              <X size={14} />
            </button>
          </div>
        )
      })()}

      {/* Collection allowance row.
          SPLIT BY AUDIENCE 2026-07-29, owner's call. It used to show every user
          a "Monthly API budget" meter in euros. That is OUR cost of goods, not
          the customer's allowance: it answers "how much does BrandGEO spend on
          you" when the customer is asking "how much can I still use". Worse, it
          moves for reasons the customer cannot see or control, because a euro
          of ChatGPT buys a different amount of work than a euro of SerpApi.

          Customers now see what they bought: how often collection runs, and how
          many of their prompts are in use. Admins keep the euro meter, because
          for them it IS the operative number, and it is the one that actually
          blocks a run in _auth.js. */}
      {!isDemoMode && (
        <div className="mb-4 flex flex-wrap items-center gap-3">
          {!isAdmin && collectionAllowance.nextAvailableAt && (
            <div className="flex items-center gap-2">
              <CooldownCountdown nextAvailableAt={collectionAllowance.nextAvailableAt} label="Next run available in" />
              {/* Only true for a plan whose cadence is slower than weekly (today,
                  only free at 720h) -- every paid plan is already weekly
                  (PLAN_COLLECTION_COOLDOWN_HOURS in planConfig.ts), so this link
                  never promises an upgrade that would not actually change anything. */}
              {planLimits.collectionCooldownH > 168 && (
                <Link
                  to="/account"
                  className="text-[11px] font-medium text-brand-400 hover:text-brand-300 underline underline-offset-2"
                >
                  Upgrade for weekly runs
                </Link>
              )}
            </div>
          )}

          {!isAdmin && (
            <>
              <div className="min-w-[140px]">
                <div className="text-[11px] text-slate-500 uppercase tracking-wide font-medium mb-1">
                  Included runs
                </div>
                <div className="text-[11px] tabular-nums font-medium text-slate-400">
                  {planCadence.label}
                </div>
              </div>
              {/* Prompts is the allowance a customer can actually act on: it is
                  the number they see on the pricing page, the number Prompts.tsx
                  meters, and the number the DB trigger enforces. */}
              <AllowanceMeter
                label="Prompts in use"
                used={prompts.length}
                cap={planPromptCap}
                hideWhenUnlimited={planPromptCap >= 100000}
              />
            </>
          )}

          {isAdmin && collectionAllowance.budgetCapEur > 0 && (
            <AllowanceMeter
              label="Monthly API budget"
              used={collectionAllowance.budgetSpentEur}
              cap={collectionAllowance.budgetCapEur}
              format={n => `€${n.toFixed(2)}`}
            />
          )}
        </div>
      )}

      {/* ── AI Visibility Score card ─────────────────────────────────────────── */}
      <SectionHeading className="sr-only">AI Visibility Score</SectionHeading>
      <motion.div
        className="mb-4 bg-dark-800 rounded-xl p-6 grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-6 items-center"
        variants={heroReveal} initial="hidden" animate="show"
      >
        <div className="flex flex-col items-center gap-3">
          {/* Empty state (§11): ring at --grid-line, centre reads "Not measured
              yet", no percentage, no band label — never a 0% ring, which reads
              as a verdict rather than an absence of measurement (F-03). */}
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
            {totalChecked === 0 ? (
              <circle cx="60" cy="60" r="54" fill="none" stroke={chart.gridLine} strokeWidth="6" />
            ) : (
              <>
                <motion.circle cx="60" cy="60" r="54" fill="none" stroke="url(#scoreRingGrad)" strokeWidth="10" strokeLinecap="round"
                  strokeDasharray={`${circumference}`} transform="rotate(-90 60 60)"
                  filter="url(#scoreGlow)" opacity="0.3"
                  initial={{ strokeDashoffset: circumference }} animate={{ strokeDashoffset: dashOffset }}
                  transition={{ duration: 1.4, ease: EASE_OUT }} />
                <motion.circle cx="60" cy="60" r="54" fill="none" stroke="url(#scoreRingGrad)" strokeWidth="5.5" strokeLinecap="round"
                  strokeDasharray={`${circumference}`} transform="rotate(-90 60 60)"
                  initial={{ strokeDashoffset: circumference }} animate={{ strokeDashoffset: dashOffset }}
                  transition={{ duration: 1.4, ease: EASE_OUT }} />
              </>
            )}
            <text x="60" y="60" textAnchor="middle" dominantBaseline="central" fontFamily="Inter, -apple-system, sans-serif">
              {totalChecked === 0 ? (
                <tspan fontSize="15" fontWeight="600" fill={chart.axisInk} textAnchor="middle">
                  <tspan x="60" dy="-6">Not</tspan>
                  <tspan x="60" dy="18">measured</tspan>
                </tspan>
              ) : (
                <>
                  <tspan fontSize="38" fontWeight="800" fill={ringTextFill} letterSpacing="-1.5">{displayedScore}</tspan>
                  <tspan fontSize="14" fontWeight="500" fill={ringTextFillDim} dy="-14">%</tspan>
                </>
              )}
            </text>
          </svg>
          <div className="text-center -mt-1">
            {/* Score-weighting transparency (Nielsen audit): an info affordance explaining
                how the headline number derives from the 6 sub-dimensions. Weights mirror
                aiVisibilityScore.ts exactly.

                2026-07-30 a11y pass. It used to be a bare `<span tabIndex={0}>` with an
                aria-label and no role, so AT announced a label attached to nothing, and
                it carried `cursor: auto`, so a mouse user got no signal at all. It is a
                real <button> now, which supplies the role, the keyboard activation and
                the global :focus-visible ring for free.
                It is also a DISCLOSURE, not a pure tooltip: hover-only reveal is
                unreachable on touch, where there is no hover state to enter, so click
                toggles it open as well and aria-expanded reports which it is.
                The `after:-inset-[7px]` grows an 11px control to a 25px hit target
                without moving a pixel of the visible layout. Same transparent-::after
                trick already shipped for .time-pill and .engine-chip in index.css;
                written inline here because index.css is off limits this pass. */}
            <div className="flex items-center justify-center gap-1 mb-2">
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-[0.15em]">AI Visibility Score</span>
              <span className="relative group inline-flex">
                <button
                  type="button"
                  onClick={() => setScoreInfoOpen(v => !v)}
                  onKeyDown={e => { if (e.key === 'Escape') setScoreInfoOpen(false) }}
                  onBlur={() => setScoreInfoOpen(false)}
                  aria-expanded={scoreInfoOpen}
                  aria-controls="score-weighting-help"
                  aria-label="How the AI Visibility Score is calculated"
                  className="relative inline-flex items-center justify-center rounded text-slate-500 hover:text-slate-300 cursor-help after:content-[''] after:absolute after:-inset-[7px]"
                >
                  <Info size={11} aria-hidden="true" />
                </button>
                <span
                  id="score-weighting-help"
                  /* The width cap is not decorative, and the constant is not arbitrary.
                     This popup is centred on the TRIGGER, and the trigger sits at the
                     right-hand end of a row that is itself centred in the viewport, so
                     its centre is offset from the viewport centre by half the row width
                     minus half the icon: measured at 66.34px. A centred box therefore
                     clips once its width passes `100vw - 132.68px`. At 320 the fixed
                     240px w-60 overran the right edge by 26.34px and pushed <main>
                     (the real scroll container, overflow-x:auto) to scrollWidth 346.
                     11rem = 176px leaves 43.32px of headroom over the geometric
                     requirement, i.e. 21.66px of clearance each side, which also
                     absorbs a classic 15px scrollbar gutter on platforms where 100vw
                     exceeds clientWidth. It is inert at >=~1440 (cap 1264px vs 240px),
                     so wide layouts are byte-identical.
                     If the "AI Visibility Score" label above ever gets longer, the
                     66.34px offset grows and this constant must grow with it. */
                  className={`pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 ${scoreInfoOpen ? 'block' : 'hidden group-hover:block group-focus-within:block'} w-60 max-w-[calc(100vw-11rem)] z-20 rounded-lg bg-dark-700 border border-dark-600 p-3 text-left shadow-xl normal-case tracking-normal`}
                >
                  <span className="block text-[11px] font-semibold text-slate-200 mb-1.5">How this score is calculated</span>
                  <span className="block text-[10px] text-slate-400 leading-relaxed">
                    A weighted average of six signals: Recognition 25%, Knowledge 20%, Sentiment 15%, Accuracy 15%, Reach 15%, Consistency 10%.
                  </span>
                </span>
              </span>
            </div>
            {/* Never issue a verdict before there is data (§11 rule 1 / F-03): a
                brand with zero checks previously read "Needs Work" — a judgement,
                not an absence of measurement. */}
            {totalChecked === 0 ? (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold border bg-dark-700/60 text-slate-400 border-dark-600">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                Not measured yet
              </div>
            ) : zeroMention ? (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold border bg-dark-700/60 text-slate-400 border-dark-600">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                {AIV_COPY.bandNotRecommended}
              </div>
            ) : (
              <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold border ${
                aiScore >= 60 ? 'bg-sentiment-positive-15 text-sentiment-positive border-sentiment-positive-30'
                : aiScore >= 35 ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                : 'bg-sentiment-negative-15 text-sentiment-negative border-sentiment-negative-30'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${aiScore >= 60 ? 'bg-sentiment-positive' : aiScore >= 35 ? 'bg-amber-400' : 'bg-sentiment-negative'}`} />
                {aiScore >= 60 ? 'Strong' : aiScore >= 35 ? 'Developing' : 'Needs Work'}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
          {dimConfig.map(d => {
            const notApplicable = zeroMention && NEEDS_MENTION_DIMS.includes(d.key)
            return (
            <div key={d.key}>
              {/* min-w-0 on the label block and shrink-0 on the value is load-bearing,
                  not tidying. A flex item defaults to `min-width: auto`, so the label
                  block refuses to shrink below its own content, and the % value gets
                  pushed past the right edge of <main>. Between 768 and ~810px the
                  sidebar has appeared (md:) while this grid is already 2-up (sm:), so
                  main is only ~502px wide and the row overflowed it by 19px. */}
              <div className="flex justify-between items-center gap-2 mb-1">
                <div className="min-w-0">
                  <span className="text-sm font-medium text-slate-300">{d.label}</span>
                  {notApplicable
                    ? <span className="ml-2 text-xs text-slate-400">{AIV_COPY.dimNeedsMention}</span>
                    : <span className="ml-2 text-xs text-slate-600">{d.desc}</span>}
                </div>
                {/* No 0% here when nothing has been checked yet. A zero
                    dimension score would read as a measured failing grade,
                    not as "we have not looked" (§11 rule 1). */}
                {totalChecked === 0 ? (
                  <span className="shrink-0 text-xs italic text-slate-300">Not measured yet</span>
                ) : notApplicable ? (
                  <span className="shrink-0 text-sm font-medium text-slate-400">{AIV_COPY.dimNotApplicable}</span>
                ) : (
                  <span className={`shrink-0 text-sm font-bold tabular-nums ${d.value >= 80 ? 'text-emerald-400' : 'text-slate-300'}`}>
                    {d.value}%
                  </span>
                )}
              </div>
              <div className="h-2 rounded-full bg-dark-700 overflow-hidden">
                {/* No fill at all when unmeasured, not a fill stuck at 0.
                    An empty track reads as "nothing recorded"; a 0-width
                    animated bar still implies a bar chart with a real zero. */}
                {totalChecked > 0 && !notApplicable && (
                  <motion.div
                    className="h-full rounded-full bg-brand-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${d.value}%` }}
                    transition={{ duration: 1, ease: EASE_OUT, delay: 0.15 }}
                  />
                )}
              </div>
            </div>
            )
          })}
        </div>
      </motion.div>

      {/* ── Engine status grid ───────────────────────────────────────────────── */}
      {/* Compact horizontal cards: logo tile on the left, condensed details on the
          right (name + status pill, then %/stats). Fewer, wider columns than the old
          5-up so each card can lay out horizontally. */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 mb-4">

        {/* Active engine cards */}
        {engineStatusCards.map(e => {
          const statusStyles = {
            KNOW:         { badge: 'bg-brand-500/15 text-brand-300 border border-brand-500/30', dot: 'bg-brand-400',   card: 'border-brand-500/20 hover:border-brand-500/40' },
            PARTIAL:      { badge: 'bg-amber-500/15 text-amber-300 border border-amber-500/30', dot: 'bg-amber-400',   card: 'border-amber-500/20 hover:border-amber-500/40' },
            MISSING:      { badge: 'bg-red-500/15 text-red-300 border border-red-500/30',       dot: 'bg-red-400',     card: 'border-red-500/20 hover:border-red-500/40'   },
            UNAVAILABLE:  { badge: 'bg-slate-700/60 text-slate-400 border border-slate-600/40', dot: 'bg-slate-500',   card: 'border-slate-700/60' },
            // Neutral, not a verdict: zero checks with no error is an absence
            // of data, not a failure, so it gets the same quiet slate the
            // rest of the app uses for "nothing measured yet" rather than
            // MISSING's red.
            NOT_MEASURED: { badge: 'bg-dark-700/60 text-slate-400 border border-dark-600',      dot: 'bg-slate-500',   card: 'border-dark-700 hover:border-dark-600'        },
          }[e.status]
          const statusLabel = e.status === 'NOT_MEASURED' ? 'NOT MEASURED' : e.status
          return (
            <div key={e.id} className={`group relative bg-dark-800 border rounded-xl p-card-compact flex items-center gap-3 transition-colors ${statusStyles.card}`}>
              {/* Top-right cluster: when this engine last returned data, and the
                  control to re-run it. Previously the button was opacity-0 until
                  hover, so on a trackpad or touch screen it was effectively
                  undiscoverable, and there was no freshness signal anywhere on
                  the card. The timestamp is always visible and quiet; the button
                  sits at 60% and comes up on hover or keyboard focus, so it
                  reads as available without competing with the score. */}
              <div className="absolute top-1.5 right-1.5 flex items-center gap-1">
                {e.lastOkAt && !e.isUnavailable && (
                  <span
                    className="text-[9px] leading-none text-slate-500 tabular-nums"
                    title={`Last successful check: ${new Date(e.lastOkAt).toLocaleString()}`}
                  >
                    {formatRelativeOrDate(e.lastOkAt)}
                  </span>
                )}
                {isAdmin && (
                  <button
                    onClick={() => handleRefreshEngine(e.id)}
                    disabled={collecting || refreshingEngine !== null}
                    className="p-1 rounded-md opacity-60 hover:opacity-100 focus-visible:opacity-100 hover:bg-dark-600 text-slate-400 hover:text-slate-100 transition-all disabled:opacity-25 disabled:cursor-not-allowed"
                    title={`Re-run every prompt on ${e.label} only. Charges for this engine alone.`}
                    aria-label={`Re-run all prompts on ${e.label}`}
                  >
                    <RefreshCw size={12} className={refreshingEngine === e.id ? 'animate-spin' : ''} />
                  </button>
                )}
              </div>

              {/* Logo tile — left */}
              <div className={`shrink-0 w-12 h-12 rounded-xl flex items-center justify-center bg-dark-700/60 ${e.isUnavailable ? 'opacity-40' : ''}`}>
                <img src={e.logoUrl} alt={e.label} className={`w-7 h-7 object-contain ${e.isUnavailable ? 'grayscale' : ''}`} />
              </div>

              {/* Details — right */}
              <div className="min-w-0 flex-1">
                {/* pr-16 clears the absolutely-positioned timestamp + refresh
                    cluster above. pr-4 only cleared the icon and the label now
                    runs under the timestamp. */}
                <div className="flex items-center gap-1.5 pr-16">
                  <span className={`text-sm font-semibold truncate ${e.isUnavailable ? 'text-slate-500' : 'text-white'}`}>{e.label}</span>
                  <span className={`shrink-0 inline-flex items-center rounded-full text-[9px] font-bold px-1.5 py-0.5 ${statusStyles.badge}`}>
                    {e.isUnavailable
                      ? <><AlertTriangle size={8} className="mr-0.5" />{AIV_COPY.engineNotAnswering}</>
                      : <><span className={`inline-block w-1.5 h-1.5 rounded-full mr-1 ${statusStyles.dot}`} />{statusLabel}</>
                    }
                  </span>
                </div>

                {e.isUnavailable ? (
                  <>
                    <div
                      className="flex items-center gap-1.5 text-xs text-amber-400 mt-1"
                      title={isAdmin ? (e.lastErrorCode ?? undefined) : undefined}
                    >
                      <AlertTriangle size={12} aria-hidden="true" className="shrink-0" />
                      {engineNotAnsweringLine(e.lastErrorCode, formatDate(errorSinceByEngine[e.id] ?? newestErrorAtByEngine[e.id] ?? ''))}
                    </div>
                    <div className="text-[10px] text-amber-400/80 mt-1">
                      {isAdmin
                        ? 'Force Refresh to retry'
                        : collectionAllowance.nextAvailableAt
                          // A non-admin in cooldown can't press Run Collection to
                          // retry -- the button is disabled until this date, so
                          // saying "to retry" next to a disabled control would be
                          // telling them to do something they cannot do.
                          ? `Next run available ${formatDate(collectionAllowance.nextAvailableAt)}`
                          : 'Run Collection to retry'}
                    </div>
                  </>
                ) : e.status === 'NOT_MEASURED' ? (
                  <div className="text-[10px] italic text-slate-300 mt-1">Not measured yet · run a collection to check this engine</div>
                ) : (
                  <>
                    <div className="flex items-baseline gap-1.5 mt-1">
                      <span className={`text-lg font-bold tabular-nums leading-none ${e.pct >= 80 ? 'text-emerald-400' : 'text-slate-200'}`}>{e.pct}%</span>
                      <span className="text-[11px] text-slate-500">{e.mentioned}/{e.checked} prompts</span>
                      {e.bestPos !== null && (
                        <span className="text-[11px] text-slate-600">· best #{e.bestPos}</span>
                      )}
                    </div>
                    {/* Mixed-case fetch failure (Nielsen audit): some checks errored while others
                        succeeded, so the % above is partial. Admins retry via the refresh icon (hover). */}
                    {/* The MOST RECENT attempt failed, even though older rows
                        succeeded and the % above is real. This is the state that
                        used to be completely silent: you press refresh, the
                        spinner stops, the card is unchanged, and nothing tells
                        you the run failed. It outranks the partial notice below
                        because it describes what just happened, not the history. */}
                    {e.lastAttemptFailed && (
                      <div
                        className="flex items-center gap-1.5 text-xs text-amber-400 mt-0.5"
                        title={isAdmin ? (e.lastErrorCode ?? undefined) : undefined}
                      >
                        <AlertTriangle size={12} aria-hidden="true" className="shrink-0" />
                        {engineNotAnsweringLine(e.lastErrorCode, formatDate(errorSinceByEngine[e.id] ?? newestErrorAtByEngine[e.id] ?? ''))}
                      </div>
                    )}
                    {partialErrorEngines.has(e.id) && !e.lastAttemptFailed && (
                      <div
                        className="flex items-center gap-1 text-[10px] text-amber-400/80 mt-0.5"
                        title={isAdmin
                          ? 'Some checks failed to sync, so this percentage is partial. Use the refresh icon on this card to retry the engine.'
                          : 'Some checks failed to sync, so this percentage is partial.'}
                      >
                        <AlertTriangle size={9} /> {enginePartialLine(formatDate(newestErrorAtByEngine[e.id] ?? ''))}
                      </div>
                    )}
                  </>
                )}
                {/* This specific "re-run this engine" click was rejected
                    (cooldown, budget, or a request failure) rather than
                    actually starting, same lastAttemptFailed presentation
                    as above, so a manual retry that goes nowhere is never
                    silent on the card whose button was pressed. Colour
                    follows the same rule as the top-of-page notice: a
                    cooldown or a budget ceiling is amber (warn/blocked),
                    never red, red is reserved for a genuine request failure. */}
                {engineRefreshFailed === e.id && (() => {
                  const isRealFailure = lastBlockReason?.reason === 'request_failed'
                  return (
                    <div className={`flex items-center gap-1 text-[10px] mt-0.5 ${isRealFailure ? 'text-red-400' : 'text-amber-400'}`}>
                      <AlertTriangle size={9} /> Refresh did not run{lastBlockReason ? ` · ${describeCollectionBlock(lastBlockReason).title.toLowerCase()}` : ''}
                    </div>
                  )
                })()}
              </div>
            </div>
          )
        })}

        {/* Coming Soon engine cards */}
        {comingSoonEngines.map(id => {
          const meta = ENGINE_META[id]
          return (
            <div key={id} className="bg-dark-800/50 border border-dark-700/50 rounded-xl p-card-compact flex items-center gap-3 opacity-70">
              <div className="shrink-0 w-12 h-12 rounded-xl flex items-center justify-center bg-dark-700/40">
                <img src={meta.logoUrl} alt={meta.label} className="w-7 h-7 object-contain grayscale" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-semibold text-slate-500 truncate">{meta.label}</span>
                  <span className="shrink-0 inline-flex items-center gap-1 rounded-full text-[9px] font-bold px-1.5 py-0.5 bg-slate-700/50 text-slate-500 border border-slate-600/30">
                    <Clock size={9} /> Soon
                  </span>
                </div>
                <div className="text-[10px] text-slate-600 mt-1">
                  {COMING_SOON_ENGINES.has(id) ? 'Not yet built' : 'Paused by admin'}
                </div>
              </div>
            </div>
          )
        })}

      </div>

      {/* Locked engines — compact chip strip (least important; keeps the active +
          coming-soon grid to a clean 4-up, and reads as a subtle upgrade prompt). */}
      {lockedChipEngines.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-[10px] font-medium text-slate-600 uppercase tracking-wider mr-0.5 flex items-center gap-1">
            <Lock size={10} /> Locked
          </span>
          {lockedChipEngines.map(id => {
            const meta      = ENGINE_META[id]
            const planLabel = PLAN_LABELS[ENGINE_UNLOCK_PLAN[id]]
            return (
              <Link
                key={id}
                to="/account"
                aria-label={`${meta.label}: unlock on ${planLabel}`}
                title={`${meta.label} is available on the ${planLabel} plan and above`}
                className="flex items-center gap-1.5 pl-1.5 pr-2 py-1 rounded-lg bg-dark-800/40 border border-dark-700/40 hover:border-dark-600 hover:bg-dark-800/60 transition-colors"
              >
                <img src={meta.logoUrl} alt="" className="w-4 h-4 object-contain grayscale opacity-70" />
                <span className="text-xs font-medium text-slate-500">{meta.label}</span>
                <span className="text-[10px] text-slate-600">Unlock on {planLabel}</span>
              </Link>
            )
          })}
        </div>
      )}

      {/* ── Fix This hub ─────────────────────────────────────────────────────── */}
      {/* Always mounted, so the announcement survives the hub re-rendering. */}
      <div className="sr-only" role="status" aria-live="polite">{fixAnnounce}</div>
      {(openFixItems.length > 0 || doneFixRows.length > 0) && (
        <div className="mb-4 bg-dark-800 rounded-xl overflow-hidden">
          <button
            ref={fixHubToggleRef}
            className="w-full flex items-center justify-between gap-3 px-5 py-3.5 text-left hover:bg-dark-700/30 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-400"
            onClick={() => setShowFixHub(v => !v)}
            aria-expanded={showFixHub}
          >
            {/* min-w-0 + flex-wrap: this row carries four pieces of content and
                sits at ~460px of usable width in the 768-810px band. */}
            <div className="flex flex-wrap items-center gap-2 min-w-0">
              <Zap size={15} className="text-brand-400" />
              <span className="text-sm font-semibold text-white">Fix This</span>
              {/* The separator here used to be a leading em dash. The parent row is
                  already `flex items-center gap-2`, so the 8px gap does the separating
                  and the dash was carrying no information the layout did not. */}
              <span className="text-xs text-slate-500">{openFixItems.length} action{openFixItems.length !== 1 ? 's' : ''} to improve your score</span>
              <div className="flex items-center gap-1 ml-1">
                {(['P0','P1','P2'] as const).map(p => {
                  const count = openFixItems.filter(i => i.priority === p).length
                  if (!count) return null
                  const cls = p === 'P0' ? 'bg-red-500/20 text-red-300' : p === 'P1' ? 'bg-amber-500/20 text-amber-300' : 'bg-purple-500/20 text-purple-300'
                  return <span key={p} className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${cls}`}>{count} {p}</span>
                })}
              </div>
            </div>
            {showFixHub ? <ChevronUp size={14} className="text-slate-500 shrink-0" /> : <ChevronDown size={14} className="text-slate-500 shrink-0" />}
          </button>

          <Collapse open={showFixHub}>
            <div className="border-t border-dark-700/50">
              {/* Workflow explainer: the Nielsen audit flagged that the intended
                  action was ambiguous. The fix itself is a content action outside
                  the app; marking it done is what the app tracks and re-checks
                  (docs/arch/fix-states.md). */}
              <div className="px-5 py-2.5 text-[11px] text-slate-500 bg-dark-700/20 border-b border-dark-700/50">
                {FIX_COPY.explainer}
              </div>
              {openFixItems.length === 0 && (
                <div className="px-5 py-4 text-xs text-slate-400 flex items-center gap-2">
                  <CircleCheck size={14} className="text-emerald-400 shrink-0" aria-hidden="true" />
                  {FIX_COPY.allDone}
                </div>
              )}
              <div className="divide-y divide-dark-700/50">
              {(showAllFixes ? openFixItems : openFixItems.slice(0, 3)).map(item => {
                const row = fixRows.get(item.id)
                const reopenedLine = reopenedFixLine(row)
                const busy = fixBusy === item.id
                const pStyles = {
                  P0: { border: 'border-l-4 border-l-red-500',    badge: 'bg-red-500/20 text-red-300',       title: 'text-red-300'   },
                  P1: { border: 'border-l-4 border-l-amber-500',  badge: 'bg-amber-500/20 text-amber-300',   title: 'text-amber-300' },
                  P2: { border: 'border-l-4 border-l-purple-500', badge: 'bg-purple-500/20 text-purple-300', title: 'text-slate-200' },
                }[item.priority]
                return (
                  <div key={item.id} className={`px-5 py-4 ${pStyles.border}`}>
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <span className={`mt-0.5 shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded ${pStyles.badge}`}>
                          {item.priority}
                        </span>
                        <div className="min-w-0">
                          <div className={`text-sm font-semibold ${pStyles.title} mb-0.5 break-words`}>{item.title}</div>
                          <div className="text-xs text-slate-500 mb-2">{item.description}</div>
                          {reopenedLine && (
                            <div className="mb-2 flex items-start gap-1.5 text-xs text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
                              <RotateCcw size={12} className="mt-0.5 shrink-0" aria-hidden="true" />
                              <span>{reopenedLine}</span>
                            </div>
                          )}
                          <div className="text-xs text-slate-400 leading-relaxed bg-dark-700/40 rounded-lg px-3 py-2">
                            <span className="text-slate-600 font-medium uppercase tracking-wide text-[9px] block mb-1">Recommended fix</span>
                            {item.fix}
                          </div>
                          {fixNotice?.id === item.id && (
                            <div role="status" className="mt-2 text-xs text-amber-300">{fixNotice.text}</div>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-row flex-wrap sm:flex-col sm:flex-nowrap gap-2 shrink-0 pl-9 sm:pl-0">
                        <button
                          onClick={() => copyFix(item.id, fixPromptFor(item))}
                          aria-label={`${FIX_COPY.copyPrompt}: ${item.title}`}
                          className="flex items-center justify-center gap-1.5 whitespace-nowrap px-2.5 py-1.5 rounded-lg text-xs border border-dark-600 text-slate-400 hover:text-slate-200 hover:border-dark-500 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
                        >
                          {copiedFix === item.id
                            ? <><CheckCheck size={12} className="text-emerald-400" /> Copied</>
                            : <><Copy size={12} /> {FIX_COPY.copyPrompt}</>
                          }
                        </button>
                        <button
                          onClick={() => markFix(item, 'done')}
                          disabled={busy}
                          aria-label={`${FIX_COPY.markDone}: ${item.title}`}
                          className="flex items-center justify-center gap-1.5 whitespace-nowrap px-2.5 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/15 text-emerald-300 border border-emerald-500/25 hover:bg-emerald-500/25 transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
                        >
                          {busy ? <Loader2 size={12} className="animate-spin" /> : <CircleCheck size={12} />} {FIX_COPY.markDone}
                        </button>
                        <button
                          onClick={() => markFix(item, 'dismissed')}
                          disabled={busy}
                          aria-label={`${FIX_COPY.dismiss}: ${item.title}`}
                          className="flex items-center justify-center gap-1.5 whitespace-nowrap px-2.5 py-1.5 rounded-lg text-xs text-slate-500 hover:text-slate-300 hover:bg-dark-700/50 transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
                        >
                          <EyeOff size={12} /> {FIX_COPY.dismiss}
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
              </div>
              {/* Pagination (Nielsen audit edge case): only top 3 shown by default.
                  Done and set-aside fixes leave this list, so the next ones move up. */}
              {openFixItems.length > 3 && (
                <button
                  onClick={() => setShowAllFixes(v => !v)}
                  className="w-full px-5 py-2.5 text-xs font-medium text-brand-400 hover:text-brand-300 hover:bg-dark-700/30 border-t border-dark-700/50 transition-colors"
                >
                  {showAllFixes ? 'Show fewer' : `Show all ${openFixItems.length} actions`}
                </button>
              )}
              {doneFixRows.length > 0 && (
                <div className="border-t border-dark-700/50">
                  <button
                    onClick={() => setShowDoneFixes(v => !v)}
                    aria-expanded={showDoneFixes}
                    className="w-full flex items-center justify-between px-5 py-2.5 text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-dark-700/30 transition-colors"
                  >
                    <span className="flex items-center gap-1.5">
                      <CircleCheck size={13} className="text-emerald-400" aria-hidden="true" />
                      {FIX_COPY.doneHeading} ({doneFixRows.length})
                    </span>
                    {showDoneFixes ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                  </button>
                  <Collapse open={showDoneFixes}>
                    <ul className="divide-y divide-dark-700/40 bg-dark-700/10">
                      {doneFixRows.map(row => {
                        const busy = fixBusy === row.fix_id
                        const tone = row.status === 'verified'
                          ? 'text-emerald-300'
                          : row.status === 'dismissed' ? 'text-slate-500' : 'text-slate-300'
                        const measurable = row.status === 'done' && parseMetricKey(row.metric_key) !== null && row.baseline_value !== null
                          && evaluateFix(row, results, fixPromptIds, fixEngineIds).state !== 'untracked'
                        return (
                          <li key={row.fix_id} className="px-5 py-3 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                            <div className="min-w-0">
                              <div className={`text-xs font-semibold ${tone} break-words`}>
                                {row.status === 'verified' && <CheckCheck size={12} className="inline mr-1 -mt-0.5" aria-hidden="true" />}
                                {row.title ?? row.fix_id}
                              </div>
                              <div className="text-xs text-slate-500 mt-0.5">{doneFixLine(row)}</div>
                              {fixNotice?.id === row.fix_id && (
                                <div role="status" className="mt-1 text-xs text-amber-300">{fixNotice.text}</div>
                              )}
                            </div>
                            <div className="flex gap-2 shrink-0">
                              {measurable && (
                                <button
                                  onClick={() => checkFixNow(row.fix_id)}
                                  disabled={busy || checkRequested === row.fix_id}
                                  aria-label={`${FIX_COPY.checkNow}: ${row.title ?? row.fix_id}`}
                                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs border border-dark-600 text-slate-300 hover:text-white hover:border-dark-500 transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
                                >
                                  {checkRequested === row.fix_id ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />} {FIX_COPY.checkNow}
                                </button>
                              )}
                              <button
                                onClick={() => reopenFix(row.fix_id)}
                                disabled={busy}
                                aria-label={`${row.status === 'dismissed' ? FIX_COPY.restore : FIX_COPY.reopen}: ${row.title ?? row.fix_id}`}
                                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs text-slate-400 hover:text-slate-200 hover:bg-dark-700/50 transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
                              >
                                {busy ? <Loader2 size={12} className="animate-spin" /> : <Undo2 size={12} />}
                                {row.status === 'dismissed' ? FIX_COPY.restore : FIX_COPY.reopen}
                              </button>
                            </div>
                          </li>
                        )
                      })}
                    </ul>
                  </Collapse>
                </div>
              )}
            </div>
          </Collapse>
        </div>
      )}

      {/* ── Prompt area: headline, toolbar, sections, legend ───────────────── */}
      <h2 className="text-lg font-semibold text-white mb-3">{AIV_COPY.promptsHeading}</h2>

      {loadError && (
        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-lg border border-dark-700 bg-dark-800 p-3">
          <AlertTriangle size={16} aria-hidden="true" className="shrink-0 text-amber-400" />
          <span className="text-sm text-slate-200">{AIV_COPY.promptsLoadError}</span>
          <button
            type="button"
            onClick={() => load()}
            className="ml-auto min-h-[44px] px-3 rounded-lg text-sm font-medium border border-dark-600 bg-dark-700 text-slate-200 hover:border-dark-500"
          >
            {AIV_COPY.promptsLoadRetry}
          </button>
        </div>
      )}

      {prompts.length > 0 && (
        <div className="mb-4">
          {headline.variant === 'recommended' && (
            <p className="text-base font-semibold text-white leading-snug">
              {headlineRecommended(headline.a, headline.n, headlineEngineLabel, headline.pos)}
            </p>
          )}
          {headline.variant === 'notYet' && (
            <>
              <p className="text-base font-semibold text-white leading-snug">{headlineNotYet(headline.n, headline.k)}</p>
              {headline.chips.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {headline.chips.map(name => (
                    <span key={name} className="inline-flex items-center rounded-full border border-dark-600 bg-dark-700 px-2.5 py-1 text-xs font-medium text-slate-200">
                      {name}
                    </span>
                  ))}
                </div>
              )}
            </>
          )}
          {headline.variant === 'unchecked' && (collecting ? (
            <p className="flex items-center gap-2 text-base font-semibold text-white leading-snug">
              <Loader2 size={14} aria-hidden="true" className="animate-spin motion-reduce:animate-none shrink-0" />
              {AIV_COPY.headlineChecking}
            </p>
          ) : (
            <>
              <p className="text-base font-semibold text-white leading-snug">{AIV_COPY.headlineUncheckedTitle}</p>
              <p className="text-sm text-slate-400 mt-1">
                {headlineUncheckedReason(
                  headline.errorEngines.length > 0 ? uncheckedEngineList : null,
                  headline.since ? formatDate(headline.since) : null,
                  headline.errorEngines.length,
                )}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={runHeadlineAction}
                  disabled={collecting || loading || (!isAdmin && !!collectionAllowance.nextAvailableAt)}
                  aria-label={isAdmin ? AIV_COPY.actionForceRefreshAria : undefined}
                  title={isAdmin ? AIV_COPY.actionForceRefreshAria : undefined}
                  className={isAdmin
                    ? 'flex items-center gap-2 px-3 py-2 min-h-[44px] rounded-lg text-sm transition-colors border border-dark-600 bg-dark-700/50 text-orange-300/90 hover:text-orange-200 hover:border-orange-500/40 disabled:opacity-50 disabled:cursor-not-allowed'
                    : 'flex items-center gap-2 px-3 py-2 min-h-[44px] rounded-lg text-sm font-medium transition-colors border border-brand-500 bg-brand-500 text-white hover:bg-brand-400 disabled:opacity-50 disabled:cursor-not-allowed'}
                >
                  {isAdmin
                    ? <><RotateCcw size={14} aria-hidden="true" /> {AIV_COPY.actionForceRefresh}</>
                    : <><Play size={14} aria-hidden="true" /> {AIV_COPY.actionRunCollection}</>}
                </button>
                {!isAdmin && collectionAllowance.nextAvailableAt && (
                  <CooldownCountdown nextAvailableAt={collectionAllowance.nextAvailableAt} label="Next run available in" />
                )}
              </div>
            </>
          ))}
        </div>
      )}

      {prompts.length > 0 && (() => {
        const activeCats = [...new Set(prompts.map(p => p.category).filter(Boolean))]
        const chipBase = 'px-3 py-1.5 min-h-[44px] sm:min-h-0 rounded-lg text-xs font-medium transition-colors border'
        const chipOn = 'bg-brand-500 text-white border-brand-600'
        const chipOff = 'bg-dark-800 text-slate-400 border-dark-700 hover:border-dark-600 hover:text-slate-300'
        return (
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            {activeCats.length > 0 ? (
              <div className="flex gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setFilterCats(new Set())}
                  aria-pressed={filterCats.size === 0}
                  className={`${chipBase} ${filterCats.size === 0 ? chipOn : chipOff}`}
                >
                  {t.aiv_allCategories}
                </button>
                {activeCats.map(cat => {
                  const active = filterCats.has(cat)
                  return (
                    <button
                      type="button"
                      key={cat}
                      onClick={() => {
                        setFilterCats(prev => {
                          const next = new Set(prev)
                          if (next.has(cat)) next.delete(cat)
                          else next.add(cat)
                          return next
                        })
                      }}
                      aria-pressed={active}
                      className={`${chipBase} ${active ? chipOn : chipOff}`}
                    >
                      {getCatLabel(cat)}
                    </button>
                  )
                })}
              </div>
            ) : <span />}

            {prompts.length >= 2 && (
              <>
                <div
                  role="group"
                  aria-label={AIV_COPY.sortGroupLabel}
                  className="hidden sm:inline-flex items-center gap-1 rounded-lg border border-dark-700 bg-dark-800 p-1"
                >
                  <span className="px-2 text-xs text-slate-400">{AIV_COPY.sortLabel}</span>
                  {SORT_MODES.map(mode => (
                    <button
                      type="button"
                      key={mode}
                      aria-pressed={sortMode === mode}
                      onClick={() => changeSort(mode)}
                      className={`time-pill ${sortMode === mode ? 'is-pressed' : ''}`}
                    >
                      {SORT_LABEL[mode]}
                    </button>
                  ))}
                </div>
                <div className="sm:hidden w-full">
                  <label htmlFor="aiv-sort" className="text-xs text-slate-400 block mb-1">{AIV_COPY.sortLabel}</label>
                  <select
                    id="aiv-sort"
                    value={sortMode}
                    onChange={e => changeSort(parseSortMode(e.target.value))}
                    className="w-full min-h-[44px] rounded-lg border border-dark-700 bg-dark-800 px-3 text-sm text-slate-200"
                  >
                    {SORT_MODES.map(mode => <option key={mode} value={mode}>{SORT_LABEL[mode]}</option>)}
                  </select>
                </div>
              </>
            )}
          </div>
        )
      })()}

      {orderFrozen && prompts.length >= 2 && (
        <p className="text-xs text-slate-400 mb-3">{AIV_COPY.orderFrozenNote}</p>
      )}

      {prompts.length === 0 && !loadError && (
        <div className="bg-dark-800 rounded-xl overflow-hidden">
          <SharedEmptyState
            icon={Target}
            title="No prompts yet"
            body={t.aiv_noPrompts}
            actionLabel="Add prompts"
            actionTo="/prompts"
          />
        </div>
      )}

      {prompts.length > 0 && visibleCount === 0 && (
        <div className="rounded-lg border border-dashed border-dark-600 p-6 text-center">
          <p className="text-sm text-slate-300">{AIV_COPY.categoryEmpty}</p>
          <button
            type="button"
            onClick={() => setFilterCats(new Set())}
            className="mt-3 min-h-[44px] px-3 rounded-lg text-sm font-medium border border-dark-600 bg-dark-700 text-slate-200 hover:border-dark-500"
          >
            {AIV_COPY.categoryEmptyAction}
          </button>
        </div>
      )}

      {renderPlan.map((sec, secIdx) => {
        const open = sectionIsOpen(sec.key)
        const failureDates = sec.key === 'unchecked'
          ? sec.rows.map(r => summaries.get(r.prompt.id)?.oldestErrorSince).filter((d): d is string => !!d).sort()
          : []
        return (
          <section key={sec.key} className={secIdx === 0 ? '' : 'mt-6'}>
            <h3 className="m-0">
              <button
                type="button"
                aria-expanded={open}
                aria-controls={`aiv-section-${sec.key}`}
                onClick={() => setSectionOpen(prev => ({ ...prev, [sec.key]: !open }))}
                className="flex w-full items-center gap-2 min-h-[44px] py-2 text-left"
              >
                <span className="text-sm font-semibold text-slate-200">{SECTION_TITLE[sec.key]}</span>
                <span className="text-xs text-slate-400 tabular-nums">{promptCount(sec.rows.length)}</span>
                {failureDates.length > 0 && (
                  <span className="text-xs text-slate-400">{sectionUncheckedExtra(formatDate(failureDates[0]))}</span>
                )}
                <ChevronDown
                  size={16}
                  aria-hidden="true"
                  className={`ml-auto shrink-0 text-slate-400 transition-transform motion-reduce:transition-none ${open ? 'rotate-180' : ''}`}
                  style={{ transitionDuration: `${Math.round(MOTION_FAST * 1000)}ms` }}
                />
              </button>
            </h3>
            <div id={`aiv-section-${sec.key}`}>
              <Collapse open={open}>
                <div className={`mt-2 ${isWide ? 'bg-dark-800 rounded-xl overflow-hidden' : 'space-y-2'}`}>
                  <div className={isWide && sec.key === 'appear' ? 'overflow-x-auto' : ''}>
                    <div style={isWide && sec.key === 'appear' ? { minWidth: tableMinWidth } : undefined}>
                      {isWide && sec.key === 'appear' && (
                        <div
                          className="grid border-b border-dark-700 bg-dark-700/50"
                          style={{ gridTemplateColumns: tableColsTemplate }}
                        >
                          <div className="px-2 py-2.5 text-[11px] font-medium text-slate-400 uppercase tracking-wide self-center">#</div>
                          <div className="px-3 py-2.5 text-[11px] font-medium text-slate-400 uppercase tracking-wide self-center">{t.aiv_prompt}</div>
                          {activeLLMs.map(llm => (
                            <div key={llm.id} className="px-1 py-2.5 flex flex-col items-center justify-center gap-1">
                              <img src={llm.logoUrl} alt="" aria-hidden="true" className="w-5 h-5 rounded object-contain" />
                              <span className="text-[10px] font-semibold text-slate-300 text-center leading-tight">{llm.label}</span>
                            </div>
                          ))}
                          {lockedColumns.map(id => (
                            <Link
                              key={id}
                              to="/account"
                              aria-label={lockedHeaderLabel(ENGINE_META[id].label, PLAN_LABELS[ENGINE_UNLOCK_PLAN[id]])}
                              title={ENGINE_META[id].label}
                              className="flex flex-col items-center justify-center gap-0.5 min-h-[44px] rounded-md hover:bg-dark-700/40"
                            >
                              <img src={ENGINE_META[id].logoUrl} alt="" aria-hidden="true" className="w-4 h-4 rounded object-contain grayscale" />
                              <span className="text-[10px] leading-none text-slate-400">{PLAN_LABELS[ENGINE_UNLOCK_PLAN[id]]}</span>
                            </Link>
                          ))}
                        </div>
                      )}
                      <AnimatePresence initial={false}>
                        {sec.rows.map(({ prompt, num }) => (
                          <motion.div
                            key={prompt.id}
                            layout="position"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: MOTION_BASE, ease: EASE_OUT }}
                          >
                            {renderRow(sec.key, prompt, num)}
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>
              </Collapse>
            </div>
          </section>
        )
      })}

      {prompts.length > 0 && (
        <>
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-400">
            {([
              ['mentioned', AIV_COPY.legendMentioned],
              ['absent', AIV_COPY.legendAbsent],
              ['no_answer', AIV_COPY.legendNoAnswer],
              ['error', AIV_COPY.legendError],
              ['pending', AIV_COPY.legendPending],
            ] as [CellState, string][]).map(([state, label]) => (
              <span key={state} className="inline-flex items-center gap-1.5">
                <PromptResultCell state={state} engineId={activeLLMs[0]?.id ?? 'chatgpt'} variant="legend" />
                {label}
              </span>
            ))}
            {lockedColumns.length > 0 && isWide && (
              <span className="inline-flex items-center gap-1.5">
                <PromptResultCell state="locked" engineId={lockedColumns[0]} variant="legend" />
                {AIV_COPY.legendLocked}
              </span>
            )}
          </div>
          {!isAdmin && <p className="mt-2 text-xs text-slate-400">{AIV_COPY.viewerHint}</p>}
        </>
      )}

      {/* ── Competitor insights (supplementary — sits below the prompt table) ──── */}
      {competitorFreq.length > 0 && (
        <div className="mt-6 mb-4 bg-dark-800 rounded-xl overflow-hidden">
          <button
            className="w-full flex items-center justify-between gap-3 px-5 py-3 text-left"
            onClick={() => setShowInsights(v => !v)}
            aria-expanded={showInsights}
          >
            <div className="flex items-center gap-2 min-w-0">
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
            {showInsights ? <ChevronUp size={14} className="text-slate-500 shrink-0" /> : <ChevronDown size={14} className="text-slate-500 shrink-0" />}
          </button>

          <Collapse open={showInsights}>
            <div className="px-5 pb-4 border-t border-dark-700/50">
              <p className="text-xs text-slate-500 mt-3 mb-3">
                Companies that appear most often in AI top-5 rankings across all prompts. Real response data only.
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
          </Collapse>
        </div>
      )}

      {/* ── Category breakdown (supplementary — sits below the prompt table) ───── */}
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

        // Nothing measured yet means every category would show 0%, which is
        // not a comparison, it is a placeholder pretending to be data (§11
        // rule 1). Suppress the whole card rather than render nine zeroes.
        if (totalChecked > 0 && catStats.length > 0) return (
          <div className="mb-4 bg-dark-800 rounded-xl p-6">
            {/* Same min-width:auto shape as the score breakdown above: neither flex
                item could shrink, so the long right-hand caption pushed past the card.
                min-w-0 lets the caption wrap instead. */}
            <div className="flex items-center justify-between gap-3 mb-3">
              <h3 className="shrink-0 text-xs font-semibold text-slate-400 uppercase tracking-wider">Category Breakdown</h3>
              <span className="min-w-0 text-xs text-slate-600 text-right">{totalChecked} total checks across {prompts.length} prompts × {activeLLMs.length} engines</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {catStats.map(({ cat, label, pct, checked, mentioned }) => (
                <div key={cat} className="flex flex-col gap-1">
                  {/* Same shape again, and this grid is 2-up from the smallest
                      viewport, so each cell is the narrowest box on the page. */}
                  <div className="flex justify-between items-center gap-1.5">
                    <span className={`min-w-0 truncate text-xs px-1.5 py-0.5 rounded-full ${getCatColor(cat)}`} title={label}>{label}</span>
                    <span className={`shrink-0 text-xs font-bold tabular-nums ${pct >= 50 ? 'text-emerald-400' : pct >= 25 ? 'text-amber-400' : 'text-red-400'}`}>{pct}%</span>
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
    </div>
  )
}
