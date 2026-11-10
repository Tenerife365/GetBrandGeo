import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import {
  RefreshCw, RotateCcw, TrendingUp, AlertTriangle, Target, ChevronDown, ChevronUp,
  Play, Loader2, Globe2, Copy, CheckCheck, Zap, Settings, X, Lock, Clock, Info,
  CircleCheck, Undo2, EyeOff, Download, ChevronRight,
} from 'lucide-react'
import { supabase, isDemoMode } from '../lib/supabase'
import { useMarket, MARKETS } from '../lib/marketContext'
import { buildFixPrompt } from '../lib/fixPrompt'
import { buildFixItems, type FixItem } from '../lib/fixItems'
import { readAllById } from '../lib/keysetRead'
import { useClient } from '../lib/clientContext'
import type { Prompt, AIResult, LLMName, PromptCategory } from '../types'
import { useI18n, fmt } from '../lib/i18nContext'
import { useCollection, type CollectionBlockReason } from '../lib/collectionContext'
import {
  ENGINE_META, ALL_ENGINES, COMING_SOON_ENGINES, RETIRED_ENGINES, ENGINE_UNLOCK_PLAN, PLAN_LABELS,
  getPlanLimits, QUEUE_ONLY_ENGINES,
  type EngineId, type EngineState,
} from '../lib/planConfig'
import { computeAiVisibilityScore } from '../lib/aiVisibilityScore'
import { MOTION_BASE, MOTION_FAST, EASE_OUT } from '../lib/motion'
import Collapse from '../components/Collapse'
import AllowanceMeter from '../components/AllowanceMeter'
import CooldownCountdown from '../components/CooldownCountdown'
import Skeleton from '../components/Skeleton'
import { PageTitle, SectionHeading } from '../components/Typography'
import LoadErrorCard from '../components/LoadErrorCard'
import { useResults } from '../lib/resultsContext'
import { shouldReportReloadFailure } from '../lib/resultsGuards'
import type { EngineBand } from '../lib/metrics'
import { buildAiVisibilityData, buildAiVisibilityCsvRows, AI_VISIBILITY_CSV_HEADER } from '../lib/views/aiVisibilityView'
import { toCsv, csvFilename, downloadCsv } from '../lib/csv'
import { promptCategoryLabel } from '../lib/promptCategories'
import SharedEmptyState from '../components/EmptyState'
import { formatDate, formatRelativeOrDate, formatRatio } from '../lib/format'
import PromptResultCell from '../components/PromptResultCell'
import {
  Card, ScoreDial, Meter, Badge, StatusGlyph, Page, PageHeader, HeroAnswer, SectionHeader,
  Button, Chip, ChipGroup, SegmentedControl, Disclosure,
  SkeletonBlock, SkeletonHero, SkeletonDial, SkeletonTable,
} from '../components/ui'
import {
  buildCellViews, summarisePrompt, sortPrompts, promptCompetitors, buildHeadline,
  lockedCandidates, pickLockedColumns, parseRankedCompetitors,
  parseSortMode, sortStorageKey, SORT_MODES,
  type CellView, type CellState, type PerfRow, type PromptSummary, type SectionKey, type SortMode,
} from '../lib/promptPerformance'
import {
  AIV_COPY, promptCount, headlineRecommended, headlineNotYet, headlineUncheckedReason,
  joinEngineLabels, sectionUncheckedExtra, errorSinceChip, ratioNoneChip, enginesNamed, namedByEngines,
  lockedHeaderLabel, engineNotAnsweringLine, enginePartialLine,  
  panelNotAnswering, panelLastResult,
  FIX_COPY, fixDoneWaiting, fixDoneWaitingData, fixVerifiedLine, fixReopenedLine, fixDismissedLine,
  fixCheckNowWaiting, fixMarkedOn, fixMovedAnnouncement, fixByAgent, fixByApp,
} from '../lib/aiVisibilityCopy'
import {
  parseMetricKey, metricLabel, measureFix, evaluateFix, verdictCutoff,
  isOpenState, type FixStateRow, type FixStatus,
} from '../lib/fixStates'

const FIX_SELECT_BASE = 'id, client_id, fix_id, status, title, metric_key, baseline_value, baseline_n, marked_at, checked_at, check_value, check_n'
// marked_by_key arrives with db/supabase-mcp-fix-writes-2026-11-06.sql. If this
// bundle reaches a database without it, the first read answers 42703 and every
// later read and write drops the column instead of failing (review L2).
// marked_by_grant arrives with db/supabase-mcp-oauth-2026-11-06.sql and is one
// step above marked_by_key, so a database that has the first but not the second
// drops only the grant column (stage 3 spec, 11.3).
const FIX_SELECT_WITH_KEY = `${FIX_SELECT_BASE}, marked_by_key`
const FIX_SELECT_FULL = `${FIX_SELECT_WITH_KEY}, marked_by_grant`
let fixSelect = FIX_SELECT_FULL
function fixSelectStepDown(cur: string): string {
  return cur === FIX_SELECT_FULL ? FIX_SELECT_WITH_KEY : FIX_SELECT_BASE
}

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
const getCatColor = (_cat: string) => 'bg-surface-2 text-ink-2'

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
    // budget_unverifiable (2026-11-08): _auth.js could not read this month's
    // spend, so the gate stays shut. Its server message carries no euro figure,
    // but this copy is fixed here like the three cases above.
    case 'budget_unverifiable':
      return { title: 'Temporarily unavailable', body: 'We could not confirm your collection allowance just now. Try again in a few minutes.' }
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
      <div className="w-full max-w-md bg-surface border border-line rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-line">
          {/* min-w-0 so a long client name truncates instead of widening the
              modal past its max-w-md (same min-width:auto flex trap). */}
          <div className="min-w-0">
            <h2 className="text-body font-semibold text-ink">Engine Configuration</h2>
            <p className="text-meta text-ink-3 mt-0.5 truncate" title={clientName}>{clientName}</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close engine configuration"
            className="shrink-0 p-1.5 rounded-lg text-ink-3 hover:text-ink hover:bg-surface-2 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Engine list */}
        <div className="divide-y divide-line max-h-96 overflow-y-auto">
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
                  <div className="flex items-center gap-1.5 text-body font-medium text-ink">
                    <span className="inline-block w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: meta.chartColor }} />
                    {meta.label}
                  </div>
                  {!isBuilt && (
                    <div className="text-meta text-ink-3 mt-0.5">Coming Soon, not yet collecting data</div>
                  )}
                  {isBuilt && !isEnabled && (
                    <div className="text-meta text-warn mt-0.5">Disabled, shown as Coming Soon to client</div>
                  )}
                </div>

                {/* Toggle — only for built engines; coming-soon engines show a note */}
                {isBuilt ? (
                  <button
                    onClick={() => handleToggle(engine, isEnabled)}
                    disabled={isSaving}
                    className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 transition-colors duration-200 disabled:opacity-50 ${
                      isEnabled
                        ? 'bg-accent border-accent-ink'
                        : 'bg-surface-3 border-line-2'
                    }`}
                  >
                    {isSaving
                      ? <Loader2 size={10} className="animate-spin absolute inset-0 m-auto text-on-accent motion-reduce:animate-none" />
                      : <span className={`inline-block h-3.5 w-3.5 rounded-full shadow transition-transform duration-200 mt-[1px] ${isEnabled ? 'bg-on-accent translate-x-4' : 'bg-ink-3 translate-x-0.5'}`} />
                    }
                  </button>
                ) : (
                  <span className="text-meta text-ink-3 shrink-0 bg-surface-2 px-2 py-1 rounded">🔜 Soon</span>
                )}
              </div>
            )
          })}
        </div>

        <div className="px-5 py-3 bg-surface-2 text-meta text-ink-3">
          Disabled engines show as "Coming Soon" to clients. Locked engines require a plan upgrade.
        </div>
      </div>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

const NO_PROMPTS: Prompt[] = []
const NO_ROWS: PerfRow[] = []
const EMPTY_RESULTS: ResultMap = new Map()
const EMPTY_ENGINE_SET = new Set<LLMName>()
const EMPTY_HEALTH = new Map<LLMName, { lastAttemptAt: string | null; lastAttemptFailed: boolean; lastErrorCode: string | null; lastOkAt: string | null }>()
const EMPTY_BY_ENGINE: Record<string, string> = {}
const EMPTY_SINCE: Record<string, string | null> = {}
const ZERO_SCORE = computeAiVisibilityScore([], new Map(), [])

export default function AIVisibility() {
  const { selections } = useMarket()
  const { activeClientId, activeClient, isAdmin, activeEngines, engineStates, setClientEngineOverride } = useClient()
  const brandName = activeClient?.name ?? 'your brand'
  const { t } = useI18n()

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

  // Results come from the shared snapshot (ResultsProvider), one read for every
  // results page. The numbers are derived from it by aiVisibilityView.ts, which
  // calls metrics.ts; this page no longer reads ai_results for any total or rate.
  const { snapshot, status, loadError: staleError, reload } = useResults()
  const activeEnginesKey = activeEngines.join(',')
  const data = useMemo(
    () => snapshot
      ? buildAiVisibilityData({ rows: snapshot.rows, activePrompts: snapshot.activePrompts, activeEngines, clientId: snapshot.clientId })
      : null,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [snapshot, activeEnginesKey],
  )
  const prompts: Prompt[] = snapshot?.activePrompts ?? NO_PROMPTS
  const results: ResultMap = data?.results ?? EMPTY_RESULTS
  // Engine is "unavailable" only when it has errors AND zero ok results.
  const errorEngines = data?.errorEngines ?? EMPTY_ENGINE_SET
  // Engines that had SOME failed checks but also some OK results (mixed case).
  const partialErrorEngines = data?.partialErrorEngines ?? EMPTY_ENGINE_SET
  // Per-engine health: the most recent attempt whatever its outcome, and the
  // most recent success (see metrics.engineHealth).
  const engineHealth = data?.engineHealth ?? EMPTY_HEALTH
  // Raw rows for the active engines and prompts. The per-cell view model in
  // promptPerformance.ts is built from these.
  const rawRows: PerfRow[] = data?.cellRows ?? NO_ROWS
  const lastChecked = data?.latestChecked ?? null
  const resultsClientId = snapshot?.clientId ?? null
  // First mount or client switch only: a quiet reload keeps the snapshot.
  const loading = !snapshot && status !== 'error'
  // The snapshot could not be loaded (or a refresh failed). Existing data stays on screen.
  const loadError = status === 'error' || staleError
  const [reloading, setReloading] = useState(false)
  // Fix This hub columns: which item each priority column is showing (clamped at render).
  const [fixCursor, setFixCursor] = useState<{ P0: number; P1: number; P2: number }>({ P0: 0, P1: 0, P2: 0 })
  const [filterCats, setFilterCats]     = useState<Set<string>>(new Set())
  const [expandedRow, setExpandedRow]   = useState<number | null>(null)
  const [showInsights, setShowInsights] = useState(true)
  // Click-toggle state for the score-weighting help popup. Hover and keyboard focus
  // still reveal it via the CSS `group` pattern; this exists so touch users, who
  // have no hover state, can reach the same content.
  const [scoreInfoOpen, setScoreInfoOpen] = useState(false)
  // The Fix This hub starts closed; the header shows a short summary and opens on click.
  const [showFixHub, setShowFixHub]     = useState(false)
  const [copiedFix, setCopiedFix]       = useState<string | null>(null)
  // Stored fix states (public.fix_states), keyed by fix_id. No row = open.
  const [fixRows, setFixRows]           = useState<Map<string, FixStateRow>>(new Map())
  const [fixRowsLoaded, setFixRowsLoaded] = useState(false)
  // client_api_keys id -> label, read once beside fix_states so a fix an AI agent marked can name its key.
  const [keyLabels, setKeyLabels] = useState<Map<string, string>>(new Map())
  const [grantNames, setGrantNames] = useState<Map<string, string>>(new Map())
  const [fixBusy, setFixBusy]           = useState<string | null>(null)
  const [fixNotice, setFixNotice]       = useState<{ id: string; text: string } | null>(null)
  const [showDoneFixes, setShowDoneFixes] = useState(false)
  const verdictInFlight = useRef<Set<string>>(new Set())
  // The client the page is showing right now, readable from async callbacks
  // that started under a different one; and the client `results` was loaded for.
  const clientRef = useRef<number | null>(null)
  clientRef.current = activeClientId ?? null
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
    // Quiet: a background completion of a run the user already saw progress
    // for, so the page updates in place and never returns to the skeleton.
    reload({ quiet: true })
  }

  const forceCollection = async () => {
    setEngineRefreshFailed(null)
    setCellRefreshFailed(null)
    await startCollection(activeClientId, true, selections, activeEngines)
    reload({ quiet: true })
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
      reload({ quiet: true })
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
      reload({ quiet: true })
    } finally {
      setRefreshingCell(null)
    }
  }

  useEffect(() => {
    setEngineRefreshFailed(null)
    setCellRefreshFailed(null)
    // lastBlockReason lives in CollectionContext, which is app-level and
    // outlives this page, so a cooldown or budget notice from the PREVIOUS
    // client would otherwise still be on screen after switching to a client
    // that has never been blocked at all. Nothing else clears it on a client
    // switch, so this page has to.
    clearBlockReason()
  }, [activeClientId, activeEnginesKey])

  // R2: the reload notice and a pending Check now belong to the client they were
  // started on; a switch clears both, and a result for the old client is ignored.
  const activeClientRef = useRef(activeClientId)
  activeClientRef.current = activeClientId
  useEffect(() => {
    setReloadFailed(false)
    setCheckAwaiting(null)
  }, [activeClientId])

  // The Reload button: quiet reload of the shared snapshot, then the short
  // "Refreshed!" flash once the new snapshot (or an error) has landed.
  const reloadFromVersion = useRef<number | null>(null)
  const [reloadFailed, setReloadFailed] = useState(false)
  const onReloadClick = async () => {
    reloadFromVersion.current = snapshot?.version ?? -1
    const startedFor = activeClientId
    setReloadFailed(false)
    setReloading(true)
    const ok = await reload({ quiet: true })
    // A failed quiet reload keeps the snapshot (same version, status ready), so
    // the landing effect below would never release the button: do it here.
    if (!ok) { setReloading(false); setReloadFailed(shouldReportReloadFailure(ok, startedFor, activeClientRef.current)) }
  }
  useEffect(() => {
    if (!reloading) return
    const landed = status === 'error' || (snapshot !== null && snapshot.version !== reloadFromVersion.current)
    if (!landed) return
    setReloading(false)
    if (status !== 'error') {
      setRefreshed(true)
      const tm = setTimeout(() => setRefreshed(false), 2500)
      return () => clearTimeout(tm)
    }
  }, [reloading, status, snapshot])

  // Stored Fix This states for this client (docs/arch/fix-states.md). One small
  // read per load; demo mode keeps them in memory only.
  const loadFixRows = async () => {
    const cid = activeClientId
    if (isDemoMode || !cid) {
      setFixRows(new Map())
      setFixRowsLoaded(true)
      return
    }
    // The three reads run together (spec 6.1): fix_states with its step-down
    // loop, and the two tiny label tables by client_id, unconditionally.
    const readFixStates = async () => {
      let { data, error } = await supabase
        .from('fix_states')
        .select(fixSelect)
        .eq('client_id', cid)
      // Step down one rung per 42703: full, then key only, then base.
      for (let step = 0; step < 2; step++) {
        if (!(error && (error as { code?: string }).code === '42703' && fixSelect !== FIX_SELECT_BASE)) break
        fixSelect = fixSelectStepDown(fixSelect)
        ;({ data, error } = await supabase.from('fix_states').select(fixSelect).eq('client_id', cid))
      }
      return { data, error }
    }
    const [{ data, error }, keyRes, grantRes] = await Promise.all([
      readFixStates(),
      supabase.from('client_api_keys').select('id, label').eq('client_id', cid),
      supabase.from('oauth_grants').select('id, client_name').eq('client_id', cid),
    ])
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
      const row = r as unknown as FixStateRow
      m.set(row.fix_id, {
        ...row,
        baseline_value: row.baseline_value === null ? null : Number(row.baseline_value),
        check_value: row.check_value === null ? null : Number(row.check_value),
      })
    })
    setFixRows(m)
    setFixRowsLoaded(true)
    // A failed side read just drops the labels.
    const km = new Map<string, string>()
    if (!keyRes.error) (keyRes.data ?? []).forEach(k => { const l = (k as { id: string; label: string | null }); if (l.label) km.set(l.id, l.label) })
    setKeyLabels(km)
    // Read the name straight from oauth_grants (RLS allows the client's own
    // rows, revoked ones included), so "by Claude" survives a disconnect.
    const gm = new Map<string, string>()
    if (!grantRes.error) (grantRes.data ?? []).forEach(g => { const l = (g as { id: string; client_name: string | null }); if (l.client_name) gm.set(l.id, l.client_name) })
    setGrantNames(gm)
  }

  useEffect(() => {
    setFixRows(new Map())
    setKeyLabels(new Map())
    setGrantNames(new Map())
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
  // No lastCompletedAt listener here: ResultsProvider already reloads the shared
  // snapshot quietly when a run lands, and this page re-derives from it.

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

      const [{ data: lastRun }, costRes] = await Promise.all([
        collectionCooldownH > 0
          ? supabase.from('collection_runs')
              .select('created_at')
              .eq('client_id', activeClientId).eq('trigger', 'manual')
              .order('created_at', { ascending: false }).limit(1).maybeSingle()
          : Promise.resolve({ data: null }),
        // Paged: a month of rows can pass the 1,000-row default, which made the
        // meter under-report spend.
        readAllById<{ id: number; cost_eur: number | null }>(() =>
          supabase.from('ai_results')
            .select('id, cost_eur')
            .eq('client_id', activeClientId)
            .gte('checked_at', monthStart.toISOString())),
      ])
      const costRows = costRes.rows
      if (cancelled) return

      let nextAvailableAt: string | null = null
      if (lastRun?.created_at && collectionCooldownH > 0) {
        const next = new Date(new Date(lastRun.created_at).getTime() + collectionCooldownH * 3_600_000)
        if (next.getTime() > Date.now()) nextAvailableAt = next.toISOString()
      }
      const budgetSpentEur = costRows.reduce((s, r) => s + (r.cost_eur || 0), 0)

      setCollectionAllowance({ nextAvailableAt, budgetSpentEur, budgetCapEur: apiBudgetEur })
    }
    loadAllowance()
    return () => { cancelled = true }
  }, [activeClientId, activeClient?.plan, lastCompletedAt])

  // ── Stats computed over active engines only ───────────────────────────────

  const llmStats = activeLLMs.map(llm => {
    const r = data?.rates.find(x => x.engine === llm.id)
    return {
      ...llm,
      mentioned: r?.mentioned ?? 0, checked: r?.checked ?? 0, pct: r?.pct ?? 0,
      band: r?.band ?? 'NOT_MEASURED' as EngineBand,
      bestPosition: r?.bestPosition ?? null,
    }
  })

  // AI Visibility Score + its 6 dimensions, from metrics.visibilityScore, the
  // same function the Overview hero uses, so both pages show the identical number.
  const { dimensions, aiScore } = data?.score ?? ZERO_SCORE
  const overallPct = dimensions.recognition


  // Competitors, the absent count and the check total all read the same
  // population (active prompts, active engines, newest usable answer per cell).
  // The shared aggregator ignores the pos:99 prose sentinel when averaging ranks.
  const competitorFreq = data?.competitorFreq ?? []
  const totalChecked = data?.totalChecked ?? 0
  const gapCount = data?.gapCount ?? 0

  // ── Engine status (active engines only, for KNOW/PARTIAL/MISSING/UNAVAILABLE) ─

  const engineStatusCards = llmStats.map(s => {
    // Band and best position come from metrics.engineRates. Zero checks with no
    // error is NOT_MEASURED, not a verdict (dashboard-visual-system.md section 11).
    const status: EngineBand = s.band
    const isUnavailable = status === 'UNAVAILABLE'
    const bestPos: number | null = s.bestPosition
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
  const errorSinceByEngine = data?.errorSinceByEngine ?? EMPTY_SINCE
  const newestErrorAtByEngine = data?.newestErrorAtByEngine ?? EMPTY_BY_ENGINE

  const lockedColumns = pickLockedColumns(engineStates)
  // Every locked engine gets a compact column in the Engines strip, on every
  // viewport, so the strip is the whole roster on one row.
  const lockedStripEngines = lockedCandidates(engineStates)

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
  // Export: one row per visible prompt (rendered order, category filter applied)
  // and active engine. Built from the same cell views the table reads.
  const exportCsv = () => {
    if (visibleCount === 0 || !activeClientId) return
    const visiblePrompts = renderPlan.flatMap(sec => sec.rows.map(r => r.prompt))
    const csv = toCsv(
      AI_VISIBILITY_CSV_HEADER,
      buildAiVisibilityCsvRows({
        prompts: visiblePrompts,
        engines: activeLLMs.map(l => ({ id: l.id as string, label: l.label })),
        cellViews,
        results,
      }),
    )
    downloadCsv(csvFilename('ai-visibility', activeClient?.slug, activeClientId, new Date()), csv)
  }
  const sectionIsOpen = (key: SectionKey): boolean => {
    const stored = sectionOpen[key]
    if (stored !== undefined) return stored
    if (key === 'notYet' || key === 'unchecked') return !renderPlan.some(s => s.key !== 'notYet' && s.key !== 'unchecked')
    return true
  }

  // ── Fix This hub ──────────────────────────────────────────────────────────

  const fixItems = buildFixItems({
    brandName,
    engines: activeLLMs.map(l => ({ id: l.id as string, label: l.label })),
    prompts: prompts.map(p => ({ id: p.id, text: p.text, position: p.position })),
    results,
    errorEngines,
    stateOf: id => fixRows.get(id)?.status,
  })

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
  // Closed-hub summary, for example "2 P0, 5 P1, 5 P2". Computed at render.
  const fixSummary = (['P0', 'P1', 'P2'] as const)
    .map(p => ({ p, n: openFixItems.filter(i => i.priority === p).length }))
    .filter(x => x.n > 0)
    .map(x => `${x.n} ${x.p}`)
    .join(', ') // copy: pending bg-copy
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
      .select(fixSelect)
      .single()
    setFixBusy(null)
    if (clientRef.current !== cid) return
    if (error || !data) {
      console.error('[FixStates] mark failed:', error?.message)
      setFixNotice({ id: item.id, text: FIX_COPY.saveFailed })
      return
    }
    putFixRow(data as unknown as FixStateRow)
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
      .select(fixSelect)
      .single()
    setFixBusy(null)
    if (clientRef.current !== cid) return
    if (error || !data) {
      console.error('[FixStates] reopen failed:', error?.message)
      setFixNotice({ id: fixId, text: FIX_COPY.saveFailed })
      return
    }
    putFixRow(data as unknown as FixStateRow)
    afterFixMoved(announce)
  }

  // Re-check on load and after every reload: a done fix whose scope has fresh
  // answers (7 days or more after marking) gets its verdict written once. The
  // database repeats the 7-day rule and only accepts a verdict from done.
  const [checkRequested, setCheckRequested] = useState<string | null>(null)
  const resultsKey = String(snapshot?.version ?? '')
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
        .select(fixSelect)
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
          putFixRow(data as unknown as FixStateRow)
        })
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, fixRowsLoaded, fixRows, resultsKey, resultsClientId, checkRequested, activeClientId])

  const [checkAwaiting, setCheckAwaiting] = useState<{ id: string; version: number } | null>(null)
  const checkFixNow = async (fixId: string) => {
    setFixNotice(null)
    setReloadFailed(false)
    const startedFor = activeClientId
    setCheckAwaiting({ id: fixId, version: snapshot?.version ?? -1 })
    const ok = await reload({ quiet: true })
    // Same as the Reload button: a failed quiet reload never raises the version.
    if (!ok) { setCheckAwaiting(null); setReloadFailed(shouldReportReloadFailure(ok, startedFor, activeClientRef.current)) }
  }
  // The re-check judges the answers that exist after the reload, so it starts
  // only once a newer snapshot has landed (or the reload failed).
  useEffect(() => {
    if (!checkAwaiting) return
    if (status === 'error') { setCheckAwaiting(null); return }
    if (snapshot && snapshot.version > checkAwaiting.version) {
      setCheckRequested(checkAwaiting.id)
      setCheckAwaiting(null)
    }
  }, [checkAwaiting, snapshot, status])

  const doneFixLine = (row: FixStateRow): string => {
    const scope = parseMetricKey(row.metric_key)
    const label = metricLabel(scope, engineLabelOf, promptTextOf)
    const markedOn = row.marked_at ? formatDate(row.marked_at) : ''
    const by = row.marked_by_grant
      ? fixByApp(grantNames.get(row.marked_by_grant))
      : row.marked_by_key ? fixByAgent(keyLabels.get(row.marked_by_key)) : ''
    if (row.status === 'dismissed') return fixDismissedLine(markedOn, by)
    if (row.status === 'verified' && row.baseline_value !== null && row.check_value !== null) {
      const verified = fixVerifiedLine(formatDate(row.checked_at ?? row.marked_at ?? ''), label, row.baseline_value, row.check_value)
      return by ? `${fixMarkedOn(markedOn, by)} ${verified}` : verified
    }
    if (!scope || row.baseline_value === null || !row.marked_at) {
      return by && markedOn ? `${fixMarkedOn(markedOn, by)} ${FIX_COPY.manualTail}` : FIX_COPY.manual
    }
    const ev = evaluateFix(row, results, fixPromptIds, fixEngineIds)
    if (ev.state === 'untracked') return `${fixMarkedOn(markedOn, by)} ${FIX_COPY.untracked}`
    if (ev.state === 'waiting' && Date.now() >= Date.parse(ev.readyAfter)) {
      return fixDoneWaitingData(markedOn, ev.fresh, ev.needed, by)
    }
    return fixDoneWaiting(markedOn, formatDate(verdictCutoff(row.marked_at)), by)
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
  if (!snapshot && status === 'error') return (
    <Page>
      <PageHeader title={t.aiv_title} />
      <LoadErrorCard onRetry={() => reload()} />
    </Page>
  )

  if (loading) return (
    <Page>
      <PageHeader title={t.aiv_title} subtitle={t.aiv_subtitle} />
      <div className="mb-4"><SkeletonHero /></div>
      <div className="mb-4"><SkeletonBlock className="h-40 w-full" /></div>
      <SkeletonBlock className="h-5 w-24 mb-3" />
      <SkeletonTable rows={5} cols={4} />
    </Page>
  )

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
  const LOCKED_COL_MIN_REM = 5.25
  const lockedTemplate = lockedColumns.length > 0 ? ` repeat(${lockedColumns.length}, minmax(${LOCKED_COL_MIN_REM}rem, 5.5rem))` : ''
  const tableColsTemplate = `2.5rem minmax(${PROMPT_COL_MIN_REM}rem, 1fr) repeat(${activeLLMs.length}, minmax(${ENGINE_COL_MIN_REM}rem, 5.5rem))${lockedTemplate}`
  const tableMinWidth = `${2.5 + PROMPT_COL_MIN_REM + activeLLMs.length * ENGINE_COL_MIN_REM + lockedColumns.length * LOCKED_COL_MIN_REM}rem`

  // ── Prompt area render helpers ─────────────────────────────────────────────
  // Plain functions that return JSX (no hooks), so they can read page state.
  // Spec: docs/design/ai-visibility-prompt-focus-spec-2026-10-28.md section 5.

  const NEUTRAL_CHIP = 'inline-flex shrink-0 items-center rounded-full bg-surface-2 px-2 py-0.5 text-meta text-ink tabular-nums'
  const AMBER_CHIP = 'inline-flex shrink-0 items-center rounded-full border border-warn bg-warn-tint px-2 py-0.5 text-meta text-warn'
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
      className={`shrink-0 text-ink-2 transition-transform motion-reduce:transition-none ${open ? 'rotate-180' : ''}`}
      style={{ transitionDuration: `${Math.round(MOTION_FAST * 1000)}ms` }}
    />
  )

  const categoryChip = (prompt: Prompt) => (
    <span className={`shrink-0 text-meta font-medium px-1.5 leading-[15px] rounded-full ${getCatColor(prompt.category)}`}>
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
                <span className="text-meta font-semibold text-ink-2 text-center leading-tight">{llm.label}</span>
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
        <h4 className="text-meta font-semibold text-ink mb-2">{AIV_COPY.competitorHeading}</h4>
        {list.length === 0 ? (
          <p className="text-body text-ink-2">{AIV_COPY.competitorEmpty}</p>
        ) : (
          <ol className="space-y-1.5">
            {list.map(c => (
              <li key={c.name} className="flex items-baseline gap-2">
                <span className="text-body text-ink">{c.name}</span>
                <span className="text-meta text-ink-2">{namedByEngines(c.k, answered)}</span>
                {c.bestRank != null && <span className="text-meta text-ink-2 tabular-nums">#{c.bestRank}</span>}
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
        <div className="text-meta text-ink-3 uppercase tracking-wide font-semibold mb-1">AI Top Results</div>
        {rankedList.map(entry => (
          <div key={`${entry.pos}-${entry.name}`}
            className={`text-meta flex items-start gap-1 mb-0.5 ${entry.isBrand ? 'text-pos-ink font-medium' : 'text-ink-2'}`}>
            <span className="font-mono text-ink-3 shrink-0 w-5">#{entry.pos}</span>
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
              ? 'bg-surface border-line'
              : r?.brand_mentioned ? 'bg-pos-tint border-pos'
              : r ? 'bg-neg-tint border-neg'
              : 'bg-surface border-line'
            return (
              <div key={llm.id} className={`rounded-lg p-3 border ${tone}`}>
                <div className="text-meta font-semibold text-ink-2 mb-2 flex items-center gap-1.5">
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
                      className="ml-auto p-1 rounded hover:bg-surface-3 text-ink-3 hover:text-ink-2 transition-colors disabled:opacity-30"
                      title={`${llm.label} is too slow for an instant re-run, so this starts it in the background across all prompts. It keeps running if you leave the page.`}
                      aria-label={`Re-run ${llm.label} in the background`}
                    >
                      <Clock size={11} className={refreshingEngine === llm.id ? 'animate-spin' : ''} />
                    </button>
                  ) : (
                    <button
                      onClick={(ev) => { ev.stopPropagation(); handleRefreshCell(prompt, llm.id) }}
                      disabled={refreshingCell !== null || collecting}
                      className="ml-auto p-1 rounded hover:bg-surface-3 text-ink-3 hover:text-ink-2 transition-colors disabled:opacity-30"
                      title={`Re-run this prompt on ${llm.label} only. Charges for one engine call.`}
                      aria-label={`Re-run this prompt on ${llm.label} only`}
                    >
                      <RotateCcw size={11} className={refreshingCell === `${prompt.id}:${llm.id}` ? 'animate-spin' : ''} />
                    </button>
                  ))}
                </div>
                {cellRefreshFailed === `${prompt.id}:${llm.id}` && (
                  <div className="flex items-center gap-1 text-meta text-neg mb-1.5">
                    <AlertTriangle size={9} /> Refresh failed, try again
                  </div>
                )}
                {isErrorCell && cv ? (
                  <>
                    <div className="text-meta text-warn mb-1">
                      {panelNotAnswering(formatDate(cv.errorSince ?? cv.current?.checked_at ?? ''))}
                    </div>
                    {cv.previousOk && (
                      <>
                        <div className="text-meta text-ink-2 mb-2">{panelLastResult(formatDate(cv.previousOk.checked_at))}</div>
                        {topResultsOf(cv.previousOk)}
                        {cv.previousOk.response_snippet && (
                          <p className="text-meta text-ink-3 mt-1 line-clamp-3 italic leading-relaxed">
                            {cv.previousOk.response_snippet}
                          </p>
                        )}
                      </>
                    )}
                  </>
                ) : r ? (
                  <>
                    <div className={`text-meta font-semibold mb-2 ${r.brand_mentioned ? 'text-pos-ink' : 'text-neg'}`}>
                      {r.brand_mentioned ? t.aiv_mentioned : t.aiv_absent}
                    </div>
                    {topResultsOf(r)}
                    {r.sentiment && r.brand_mentioned && (
                      <div className={`text-meta font-medium mb-1 ${r.sentiment === 'positive' ? 'text-pos-ink' : r.sentiment === 'negative' ? 'text-neg' : 'text-ink-3'}`}>
                        {r.sentiment}
                      </div>
                    )}
                    {r.checked_at && (
                      <div className="text-meta text-ink-3 font-mono">
                        {formatDate(r.checked_at)}
                      </div>
                    )}
                    {r.response_snippet && (
                      <p className="text-meta text-ink-3 mt-1 line-clamp-3 italic leading-relaxed">
                        {r.response_snippet}
                      </p>
                    )}
                  </>
                ) : cv?.state === 'no_answer' ? (
                  <div className="text-meta text-ink-2">{AIV_COPY.legendNoAnswer}</div>
                ) : (
                  <div className="text-meta text-ink-3">{t.aiv_notChecked}</div>
                )}
              </div>
            )
          })}
        </div>

        {missing.length > 0 && (
          <div className="mt-3 px-3 py-2.5 bg-surface-2 border border-line rounded-lg flex items-start gap-2">
            <Info size={14} aria-hidden="true" className="mt-0.5 shrink-0 text-ink-2" />
            <div>
              <div className="text-meta text-ink font-medium mb-0.5">
                {fmt(t.aiv_opportunity, { brand: brandName, llms: missing.map(l => l.label).join(', ') })}
              </div>
              <div className="text-meta text-ink-2">{t.aiv_opportunityTip}</div>
            </div>
          </div>
        )}
      </>
    )
  }

  // Expanded body wrapper. `kind` decides what sits above the existing panel.
  const expandedBody = (prompt: Prompt, kind: SectionKey) => (
    <Collapse open={expandedRow === prompt.id}>
      <div id={`aiv-row-${prompt.id}`} className="border-t border-line bg-surface-2 px-4 py-4">
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
    // Staggered fade for the first 10 visible rows only (presentational).
    const revealCls = num <= 10 ? ' reveal-row' : ''
    const revealSty = num <= 10 ? ({ '--i': num - 1 } as CSSProperties) : undefined
    const stickyBg = num % 2 === 0 ? 'bg-surface-2' : 'bg-surface group-hover:bg-surface-2'
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
      ? <span className={NEUTRAL_CHIP}>{formatRatio(mentions, answered, answered === 1 ? 'engine' : 'engines')}</span>
      : kind === 'notYet'
        ? <span className={NEUTRAL_CHIP}>{ratioNoneChip(answered)}</span>
        : null

    if (!isWide) {
      return (
        <div className={revealCls.trim() || undefined} style={revealSty}>
          <button
            type="button"
            aria-expanded={isExpanded}
            aria-controls={`aiv-row-${prompt.id}`}
            onClick={() => toggleRow(prompt.id)}
            className="block w-full text-left rounded-lg border border-line bg-surface p-3 min-h-[44px]"
          >
            <span className="flex items-start gap-2">
              <span className="text-meta text-ink-2 tabular-nums shrink-0 pt-0.5">{num}</span>
              <span className="block min-w-0 flex-1 text-body text-ink line-clamp-2">{prompt.text}</span>
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
              <span className="block text-meta text-ink-2 mt-1.5">{enginesNamed(topComp)}</span>
            )}
          </button>
          {expandedBody(prompt, kind)}
        </div>
      )
    }

    if (kind === 'appear') {
      return (
        <div className={`border-b border-line last:border-0 ${num % 2 === 0 ? 'bg-surface-2' : ''}${revealCls}`} style={revealSty}>
          <button
            type="button"
            aria-expanded={isExpanded}
            aria-controls={`aiv-row-${prompt.id}`}
            onClick={() => toggleRow(prompt.id)}
            className="group grid w-full text-left transition-colors motion-reduce:transition-none hover:bg-surface-2"
            style={{ gridTemplateColumns: tableColsTemplate }}
          >
            <span className={`block px-2 py-2.5 self-center sticky left-0 z-[1] ${stickyBg}`}>
              <span className="inline-flex items-center justify-center min-w-[1.5rem] h-5 px-1 rounded-md bg-surface-2 text-meta font-semibold text-ink-2 tabular-nums">
                {/* Sequential across the rendered sections, never the stored
                    `position` (a sort key with gaps and duplicates). */}
                {num}
              </span>
            </span>
            <span className={`block px-3 py-2.5 self-center min-w-0 sticky left-10 z-[1] ${stickyBg} shadow-[1px_0_0_rgb(var(--line))]`}>
              <span className="flex items-center gap-2 min-w-0">
                <span className="block truncate flex-1 min-w-0 text-body text-ink" title={prompt.text}>{prompt.text}</span>
                {chevron(isExpanded)}
              </span>
              <span className="flex items-center gap-1.5 mt-1 min-w-0 whitespace-nowrap">
                {categoryChip(prompt)}
                {ratioChip}
                {isAdmin && (
                  <span className="min-w-0 truncate text-meta text-ink-3 hidden lg:inline" title="Expand this row to re-run a single engine">
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
      <div className={revealCls.trim() || undefined} style={revealSty}>
        <button
          type="button"
          aria-expanded={isExpanded}
          aria-controls={`aiv-row-${prompt.id}`}
          onClick={() => toggleRow(prompt.id)}
          className="grid w-full items-center gap-3 px-3 min-h-[44px] py-2 text-left grid-cols-[2.5rem_minmax(0,1fr)_auto_auto] hover:bg-surface-2 transition-colors motion-reduce:transition-none rounded-lg"
        >
          <span className="text-meta text-ink-2 tabular-nums">{num}</span>
          <span className="flex items-center gap-2 min-w-0">
            <span className="block truncate min-w-0 text-body text-ink" title={prompt.text}>{prompt.text}</span>
            {categoryChip(prompt)}
          </span>
          <span className="flex items-center gap-2 min-w-0">
            {ratioChip}
            {reasonChip}
            {kind === 'notYet' && topComp && (
              <span className="hidden md:block text-meta text-ink-2 truncate max-w-[14rem]">{enginesNamed(topComp)}</span>
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

  // Spec 11.2 block entrance: the first four blocks fade and slide in on a
  // short stagger (260ms ease-out). MotionConfig reducedMotion="user" at the
  // app root drops the slide for users who ask. No count-up on the dial.
  const reveal = (i: number) => ({
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: MOTION_BASE, ease: EASE_OUT, delay: i * 0.06 },
  })

  const firstRun = prompts.length > 0 && totalChecked === 0 && headline.variant === 'unchecked' && headline.errorEngines.length === 0
  const heroBadge: { label: string; tone: 'neutral' | 'pos' | 'warn' | 'neg' } =
    totalChecked === 0 ? { label: 'Not measured yet', tone: 'neutral' } // copy: pending bg-copy
    : zeroMention ? { label: AIV_COPY.bandNotRecommended, tone: 'neutral' }
    : aiScore >= 60 ? { label: 'Strong', tone: 'pos' }
    : aiScore >= 35 ? { label: 'Developing', tone: 'warn' }
    : { label: 'Needs work', tone: 'neg' }
  const heroGlyph = heroBadge.tone === 'pos' || heroBadge.tone === 'warn' || heroBadge.tone === 'neg'
    ? <StatusGlyph kind={heroBadge.tone} size={12} />
    : undefined

  const heroAnswer =
    headline.variant === 'recommended' ? headlineRecommended(headline.a, headline.n, headlineEngineLabel, headline.pos)
    : headline.variant === 'notYet' ? headlineNotYet(headline.n, headline.k)
    : collecting ? AIV_COPY.headlineChecking
    : firstRun ? AIV_COPY.headlineFirstCheckPending
    : AIV_COPY.headlineUncheckedTitle
  const heroContext =
    headline.variant === 'unchecked' && !collecting && !firstRun
      ? headlineUncheckedReason(
          headline.errorEngines.length > 0 ? uncheckedEngineList : null,
          headline.since ? formatDate(headline.since) : null,
          headline.errorEngines.length,
        )
      : lastChecked ? fmt(t.aiv_lastChecked, { date: formatDate(lastChecked) }) : undefined
  const heroAction = headline.variant === 'unchecked' && !collecting ? (
    <>
      <Button
        variant="primary"
        icon={isAdmin ? RotateCcw : Play}
        onClick={runHeadlineAction}
        disabled={collecting || loading || (!isAdmin && !!collectionAllowance.nextAvailableAt)}
        aria-label={isAdmin ? AIV_COPY.actionForceRefreshAria : undefined}
        title={isAdmin ? AIV_COPY.actionForceRefreshAria : undefined}
      >
        {isAdmin ? AIV_COPY.actionForceRefresh : AIV_COPY.actionRunCollection}
      </Button>
      {!isAdmin && collectionAllowance.nextAvailableAt && (
        <CooldownCountdown nextAvailableAt={collectionAllowance.nextAvailableAt} label="Next run available in" />
      )}
    </>
  ) : undefined

  return (
    <Page>

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

      {/* ── Block 1: page header ────────────────────────────────────────────── */}
      <PageHeader
        title={t.aiv_title}
        badge={selections.length > 0 ? (
          <span className="inline-flex flex-wrap items-center gap-2">
            {selections.map(sel => (
              <Badge key={sel.market.id} tone="neutral">
                {sel.market.flagCode === 'un'
                  ? <Globe2 size={11} aria-hidden="true" />
                  : <img src={`https://flagcdn.com/w16/${sel.market.flagCode}.png`} alt="" className="w-3.5 h-auto rounded-sm" />
                }
                {sel.market.id}
                {sel.region.id !== 'ALL' && <span className="text-ink-3">· {sel.region.label}</span>}
              </Badge>
            ))}
          </span>
        ) : undefined}
        subtitle={t.aiv_subtitle}
        actions={
          <>
            {/* Engine configuration is an admin-only concern (sets what every client
                on a plan collects). Kept admin-gated. */}
            {isAdmin && (
              <Button
                variant="secondary"
                icon={Settings}
                onClick={() => setShowEngineModal(true)}
                title="Configure engines for this client"
                aria-label="Configure engines for this client"
              >
                Engines
              </Button>
            )}
            {/* Force Refresh WIPES all existing results before re-running, so it is
                admin-only and keeps its own label so it still reads as the
                destructive one. */}
            {isAdmin && (
              <Button
                variant="danger"
                icon={RotateCcw}
                onClick={forceCollection}
                disabled={collecting || loading}
                title="Force Refresh: wipes existing results and re-runs all engines"
                aria-label="Force refresh: wipes existing results and re-runs all engines"
              >
                Force Refresh
              </Button>
            )}
            <Button
              variant="secondary"
              icon={RefreshCw}
              onClick={onReloadClick}
              disabled={loading || reloading}
            >
              {refreshed ? <span className="text-pos-ink">{t.aiv_refreshed}</span> : t.aiv_reload}
            </Button>
            {/* The page's only primary. Visible to viewers too: the backend already
                authorises a viewer to run collection for their own client (_auth.js
                step 5) and budget-caps it, and without it a free signup could add
                prompts but never see a single result. */}
            <Button
              variant="primary"
              icon={collecting ? Loader2 : Play}
              onClick={runCollection}
              disabled={collecting || loading || (!isAdmin && !!collectionAllowance.nextAvailableAt)}
            >
              {collecting
                ? (collectProgress ? `${collectProgress.done}/${collectProgress.total}` : 'Starting…')
                : 'Run Collection'}
            </Button>
          </>
        }
      />
      {reloadFailed && (
        <div role="status" className="mb-4 flex items-center gap-2 text-meta text-warn">
          <AlertTriangle size={14} aria-hidden="true" className="shrink-0 text-warn" />
          {AIV_COPY.promptsLoadError}
        </div>
      )}

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
          <div className="mb-4 flex items-start justify-between gap-3 px-3 py-2.5 rounded-lg text-meta bg-warn-tint border border-warn">
            <div className="flex items-start gap-2 min-w-0">
              <AlertTriangle size={14} className="shrink-0 mt-0.5 text-warn" />
              <div className="min-w-0">
                <span className="font-semibold text-warn">{title}.</span>{' '}
                <span className="text-warn">{body}</span>
                {showAction && (
                  <div className="mt-1.5">
                    {action!.kind === 'link' && (
                      <Link to={action!.to} className="font-medium text-warn hover:text-warn underline underline-offset-2">
                        {action!.label}
                      </Link>
                    )}
                    {action!.kind === 'open-engine-modal' && (
                      <button
                        onClick={() => setShowEngineModal(true)}
                        className="font-medium text-warn hover:text-warn underline underline-offset-2"
                      >
                        {action!.label}
                      </button>
                    )}
                    {action!.kind === 'mailto' && (
                      <a href={action!.href} className="font-medium text-warn hover:text-warn underline underline-offset-2">
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
              className="relative flex-shrink-0 text-warn hover:text-warn after:absolute after:content-[''] after:[inset:-15px]"
            >
              <X size={14} />
            </button>
          </div>
        )
      })()}

      {/* Collection allowance row.
          SPLIT BY AUDIENCE 2026-07-29, owner's call. Customers see what they
          bought (how often collection runs, how many prompts are in use);
          admins keep the euro meter, because for them it IS the operative
          number, and it is the one that actually blocks a run in _auth.js. */}
      {!isDemoMode && (
        <div className="mb-4 flex flex-wrap items-center gap-3">
          {!isAdmin && collectionAllowance.nextAvailableAt && (
            <div className="flex items-center gap-2">
              <CooldownCountdown nextAvailableAt={collectionAllowance.nextAvailableAt} label="Next run available in" />
              {/* Only true for a plan whose cadence is slower than weekly (today,
                  only free at 720h) -- every paid plan is already weekly, so this
                  link never promises an upgrade that would not change anything. */}
              {planLimits.collectionCooldownH > 168 && (
                <Link
                  to="/account"
                  className="text-meta font-medium text-accent-ink hover:text-accent-ink underline underline-offset-2"
                >
                  Upgrade for weekly runs
                </Link>
              )}
            </div>
          )}

          {!isAdmin && (
            <>
              <div className="min-w-[140px]">
                <div className="text-meta text-ink-3 uppercase tracking-wide font-medium mb-1">
                  Included runs
                </div>
                <div className="text-meta tabular-nums font-medium text-ink-2">
                  {planCadence.label}
                </div>
              </div>
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

      {/* ── Block 2: hero answer (the "recommended in N of M" sentence lives here) ── */}
      <SectionHeading className="sr-only">AI Visibility Score</SectionHeading>
      <motion.div className="mb-4" {...reveal(0)}>
        {prompts.length === 0 ? (
          <HeroAnswer
            answer=""
            empty={{
              icon: Target,
              title: 'No prompts yet', // copy: pending bg-copy
              body: t.aiv_noPrompts,
              actionLabel: 'Add prompts', // copy: pending bg-copy
              actionTo: '/prompts',
            }}
          />
        ) : (
          <HeroAnswer
            badge={{ label: heroBadge.label, tone: heroBadge.tone, glyph: heroGlyph }}
            answer={heroAnswer}
            context={heroContext}
            action={heroAction}
            visual={<ScoreDial score={totalChecked === 0 ? null : aiScore} size="lg" />}
          >
            {/* Empty state (§11): a null score draws the dial empty and its centre
                reads "Not measured yet", never a 0% ring (F-03). */}
            {headline.variant === 'notYet' && headline.chips.length > 0 && (
              <div className="mb-4 flex flex-wrap gap-2">
                {headline.chips.map(name => <Badge key={name} tone="neutral">{name}</Badge>)}
              </div>
            )}
            <div className="mb-3 flex items-center gap-1">
              <span className="text-meta text-ink-3">AI Visibility Score</span>
              <span className="relative group inline-flex">
                <button
                  type="button"
                  onClick={() => setScoreInfoOpen(v => !v)}
                  onKeyDown={e => { if (e.key === 'Escape') setScoreInfoOpen(false) }}
                  onBlur={() => setScoreInfoOpen(false)}
                  aria-expanded={scoreInfoOpen}
                  aria-controls="score-weighting-help"
                  aria-label="How the AI Visibility Score is calculated"
                  className="relative inline-flex items-center justify-center rounded text-ink-3 hover:text-ink cursor-help after:content-[''] after:absolute after:-inset-[10px] max-md:after:-inset-4"
                >
                  <Info size={12} aria-hidden="true" />
                </button>
                <span
                  id="score-weighting-help"
                  /* The width cap is load-bearing: it keeps the popup inside the
                     viewport at 320. */
                  className={`pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 ${scoreInfoOpen ? 'block' : 'hidden group-hover:block group-focus-within:block'} w-60 max-w-[calc(100vw-11rem)] z-20 rounded-card bg-surface border border-line p-3 text-left shadow-card normal-case tracking-normal`}
                >
                  <span className="block text-meta text-ink mb-1.5">How this score is calculated</span>
                  <span className="block text-meta text-ink-2 leading-relaxed">
                    A weighted average of six signals: Recognition 25%, Knowledge 20%, Sentiment 15%, Accuracy 15%, Reach 15%, Consistency 10%.
                  </span>
                </span>
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
              {dimConfig.map(d => {
                const notApplicable = zeroMention && NEEDS_MENTION_DIMS.includes(d.key)
                return (
                  <div key={d.key}>
                    <div className="flex justify-between items-center gap-2 mb-1">
                      <div className="min-w-0">
                        <span className="text-body font-medium text-ink">{d.label}</span>
                        {notApplicable
                          ? <span className="ml-2 text-meta text-ink-2">{AIV_COPY.dimNeedsMention}</span>
                          : <span className="ml-2 text-meta text-ink-3">{d.desc}</span>}
                      </div>
                      {/* No 0% when nothing has been checked: a zero would read as a
                          measured failing grade, not "we have not looked" (§11 rule 1). */}
                      {totalChecked === 0 ? (
                        <span className="shrink-0 text-meta text-ink-2">Not measured yet</span>
                      ) : notApplicable ? (
                        <span className="shrink-0 text-body text-ink-2">{AIV_COPY.dimNotApplicable}</span>
                      ) : (
                        <span className="shrink-0 text-body font-semibold text-ink tabular-nums">{d.value}%</span>
                      )}
                    </div>
                    <Meter thick ariaLabel={d.label} value={totalChecked === 0 || notApplicable ? null : d.value} />
                  </div>
                )
              })}
            </div>
          </HeroAnswer>
        )}
      </motion.div>

      {/* ── Block 3: engines (status cards, coming soon and locked in one card) ── */}
      {(engineStatusCards.length > 0 || comingSoonEngines.length > 0 || lockedStripEngines.length > 0) && (
        <motion.div className="mb-4" {...reveal(1)}>
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 mb-2">
            <h2 className="label-caps">Engines</h2>{/* copy: pending bg-copy */}
            {comingSoonEngines.length > 0 && (
              <span className="inline-flex items-center gap-1 text-meta text-ink-3">
                <Clock size={11} aria-hidden="true" />
                {`Coming soon: ${joinEngineLabels(comingSoonEngines.map(id => ENGINE_META[id].label))}`}{/* copy: pending bg-copy */}
              </span>
            )}
          </div>
          {(engineStatusCards.length > 0 || lockedStripEngines.length > 0) && (
            <Card pad="none" className="overflow-hidden">
              <div className="flex divide-x divide-line overflow-x-auto snap-x snap-mandatory lg:snap-none">
                {engineStatusCards.map(e => {
                  const statusBadge: { label: string; tone: 'pos' | 'warn' | 'neg' | 'neutral' } = e.isUnavailable
                    ? { label: AIV_COPY.engineNotAnswering, tone: 'warn' }
                    : e.status === 'KNOW' ? { label: 'Known', tone: 'pos' } // copy: pending bg-copy
                    : e.status === 'PARTIAL' ? { label: 'Partial', tone: 'warn' } // copy: pending bg-copy
                    : e.status === 'MISSING' ? { label: 'Missing', tone: 'neg' } // copy: pending bg-copy
                    : { label: 'Not checked yet', tone: 'neutral' } // copy: pending bg-copy
                  const statusKind = statusBadge.tone === 'neutral' ? null : statusBadge.tone
                  const isMeasured = !e.isUnavailable && e.status !== 'NOT_MEASURED'
                  const sinceText = formatDate(errorSinceByEngine[e.id] ?? newestErrorAtByEngine[e.id] ?? '')
                  const isPartialWarn = isMeasured && !e.lastAttemptFailed && partialErrorEngines.has(e.id)
                  // One warn line at most: unavailable, then last attempt failed, then partial.
                  const warnSentence = e.isUnavailable || (isMeasured && e.lastAttemptFailed)
                    ? engineNotAnsweringLine(e.lastErrorCode, sinceText)
                    : isPartialWarn
                      ? enginePartialLine(formatDate(newestErrorAtByEngine[e.id] ?? ''))
                      : null
                  const warnTitle = isPartialWarn
                    ? (isAdmin
                        ? 'Some checks failed to sync, so this percentage is partial. Use the refresh icon on this card to retry the engine.'
                        : 'Some checks failed to sync, so this percentage is partial.')
                    : (warnSentence !== null && isAdmin && e.lastErrorCode ? `${warnSentence} (${e.lastErrorCode})` : warnSentence ?? undefined)
                  const metaText = e.isUnavailable
                    ? (isAdmin
                        ? 'Force Refresh to retry'
                        : collectionAllowance.nextAvailableAt
                          // A non-admin in cooldown can't press Run Collection to
                          // retry, so do not tell them to.
                          ? `Next run available ${formatDate(collectionAllowance.nextAvailableAt)}`
                          : 'Run Collection to retry')
                    : e.status === 'NOT_MEASURED'
                      ? 'Not measured yet · run a collection to check this engine'
                      : `${e.mentioned} of ${e.checked} prompts${e.bestPos !== null ? `, best #${e.bestPos}` : ''}`
                  return (
                    <div key={e.id} className="relative flex flex-col gap-1 min-w-[46%] sm:min-w-[164px] lg:min-w-[132px] lg:max-w-[280px] flex-[2_1_0%] p-3 snap-start">
                      <div className="flex items-center gap-2 min-w-0">
                        <img src={e.logoUrl} alt="" aria-hidden="true" className={`w-5 h-5 shrink-0 object-contain ${e.isUnavailable ? 'grayscale opacity-60' : ''}`} />
                        <span className="text-body font-semibold text-ink truncate" title={e.label}>{e.label}</span>
                        {isAdmin && (
                          <button
                            onClick={() => handleRefreshEngine(e.id)}
                            disabled={collecting || refreshingEngine !== null}
                            className="ml-auto relative p-1 rounded-md text-ink-2 hover:text-ink hover:bg-surface-3 transition-colors disabled:opacity-25 disabled:cursor-not-allowed after:content-[''] after:absolute after:-inset-[8px]"
                            title={`Re-run every prompt on ${e.label} only. Charges for this engine alone.`}
                            aria-label={`Re-run all prompts on ${e.label}`}
                          >
                            <RefreshCw size={12} className={refreshingEngine === e.id ? 'animate-spin' : ''} />
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-2 min-h-[28px]">
                        {isMeasured && (
                          <span className="text-title-sm text-ink tabular-nums leading-none">{e.pct}%</span>
                        )}
                        <Badge
                          tone={statusBadge.tone}
                          glyph={statusKind ? <StatusGlyph kind={statusKind} size={12} /> : undefined}
                          className="ml-auto shrink-0"
                        >
                          {statusBadge.label}
                        </Badge>
                      </div>

                      <div className="text-meta text-ink-2 line-clamp-2 sm:line-clamp-none sm:truncate" title={metaText}>{metaText}</div>

                      {warnSentence !== null && (
                        <div className="flex items-start gap-1 text-meta text-warn" title={warnTitle}>
                          <AlertTriangle size={12} aria-hidden="true" className="shrink-0 mt-0.5" />
                          <span className="line-clamp-2 min-w-0">{warnSentence}</span>
                        </div>
                      )}

                      {/* This specific "re-run this engine" click was rejected
                          (cooldown, budget, or a request failure) rather than
                          starting, so a manual retry that goes nowhere is never
                          silent on the card whose button was pressed. A cooldown
                          or a budget ceiling is amber, red is reserved for a
                          genuine request failure. */}
                      {engineRefreshFailed === e.id && (() => {
                        const isRealFailure = lastBlockReason?.reason === 'request_failed'
                        const refreshFailedText = `Refresh did not run${lastBlockReason ? ` · ${describeCollectionBlock(lastBlockReason).title.toLowerCase()}` : ''}`
                        return (
                          <div className={isRealFailure ? 'flex items-center gap-1 text-meta text-neg truncate' : 'flex items-center gap-1 text-meta text-warn truncate'} title={refreshFailedText}>
                            <AlertTriangle size={12} aria-hidden="true" className="shrink-0" /> {refreshFailedText}
                          </div>
                        )
                      })()}

                      {e.lastOkAt && !e.isUnavailable && (
                        <div
                          className="mt-auto text-meta text-ink-3 tabular-nums truncate"
                          title={`Last successful check: ${new Date(e.lastOkAt).toLocaleString()}`}
                        >
                          {formatRelativeOrDate(e.lastOkAt)}
                        </div>
                      )}
                    </div>
                  )
                })}
                {/* Locked engines: compact columns on the same row, each one a
                    link to the plan page. */}
                {lockedStripEngines.map(id => {
                  const meta      = ENGINE_META[id]
                  const planLabel = PLAN_LABELS[ENGINE_UNLOCK_PLAN[id]]
                  return (
                    <Link
                      key={id}
                      to="/account"
                      aria-label={`${meta.label}: unlock on ${planLabel}`}
                      title={`${meta.label} is available on the ${planLabel} plan and above`}
                      className="group flex flex-col gap-1 min-w-[124px] lg:min-w-[96px] lg:max-w-[168px] flex-1 basis-0 p-3 lg:px-2 xl:px-3 snap-start hover:bg-surface-2 transition-colors focus-visible:-outline-offset-2"
                    >
                      <span className="flex items-center gap-2 min-w-0 lg:flex-col lg:items-start lg:gap-1 xl:flex-row xl:items-center xl:gap-2">
                        <img src={meta.logoUrl} alt="" aria-hidden="true" className="w-4 h-4 shrink-0 object-contain grayscale opacity-70" />
                        <span className="text-meta font-semibold text-ink-2 group-hover:text-ink truncate lg:whitespace-normal lg:leading-tight xl:whitespace-nowrap">{meta.label}</span>
                      </span>
                      <span className="flex items-center gap-1 min-w-0 text-meta text-ink-3">
                        <Lock size={11} aria-hidden="true" className="shrink-0" />
                        <span className="truncate lg:whitespace-normal lg:leading-tight xl:whitespace-nowrap">{planLabel}</span>
                      </span>
                    </Link>
                  )
                })}
              </div>
            </Card>
          )}
        </motion.div>
      )}

      {/* ── Block 4: fix this ───────────────────────────────────────────────── */}
      {/* Always mounted, so the announcement survives the hub re-rendering. */}
      <div className="sr-only" role="status" aria-live="polite">{fixAnnounce}</div>
      {(openFixItems.length > 0 || doneFixRows.length > 0) && (
        <motion.section className="mb-6" aria-label="Fix this" {...reveal(2)}>
          <SectionHeader
            title="Fix this"/* copy: pending bg-copy */
            count={openFixItems.length}
            description={showFixHub
              ? `${openFixItems.length} action${openFixItems.length !== 1 ? 's' : ''} to improve your score`
              : (openFixItems.length === 0 ? FIX_COPY.allDone : fixSummary)}
            actions={
              <Button
                ref={fixHubToggleRef}
                variant={showFixHub ? 'ghost' : 'secondary'}
                size="sm"
                icon={showFixHub ? ChevronUp : ChevronDown}
                onClick={() => setShowFixHub(v => !v)}
                aria-expanded={showFixHub}
                aria-label={showFixHub ? 'Hide fixes' : 'Show fixes'}/* copy: pending bg-copy */
              >
                {showFixHub ? 'Hide' : 'Show'}{/* copy: pending bg-copy */}
              </Button>
            }
          />
          <Collapse open={showFixHub}>
            <Card pad="none" className="overflow-hidden">
              {openFixItems.length === 0 && (
                <div className="px-4 py-4 text-meta text-ink-2 flex items-center gap-2">
                  <CircleCheck size={14} className="text-pos-ink shrink-0" aria-hidden="true" />
                  {FIX_COPY.allDone}
                </div>
              )}
              {openFixItems.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-line">
                  {(['P0', 'P1', 'P2'] as const).map(p => {
                    const list = openFixItems.filter(i => i.priority === p)
                    // Clamp at render: a fix that leaves the list lets the next one take its place.
                    const idx = list.length === 0 ? 0 : Math.min(fixCursor[p], list.length - 1)
                    const item = list[idx]
                    const prioTone = p === 'P0' ? 'neg' : p === 'P1' ? 'accent' : 'neutral'
                    const row = item ? fixRows.get(item.id) : undefined
                    const reopenedLine = reopenedFixLine(row)
                    const busy = item ? fixBusy === item.id : false
                    return (
                      <section key={p} aria-label={`${p} fixes`/* copy: pending bg-copy */} className="flex flex-col min-w-0 p-4">
                        <div className="flex items-center gap-2 mb-3 min-h-[28px]">
                          <Badge tone={prioTone}>{p}</Badge>
                          {list.length > 0 && (
                            <span className="text-meta text-ink-3 tabular-nums" aria-live="polite" aria-atomic="true">{`${idx + 1} of ${list.length}`/* copy: pending bg-copy */}</span>
                          )}
                          {list.length > 1 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              icon={ChevronRight}
                              className="ml-auto"
                              aria-label={`Next ${p} fix`/* copy: pending bg-copy */}
                              onClick={() => setFixCursor(c => ({ ...c, [p]: (idx + 1) % list.length }))}
                            >
                              Next{/* copy: pending bg-copy */}
                            </Button>
                          )}
                        </div>
                        {!item && (
                          <p className="m-0 text-meta text-ink-3">Nothing open at this priority{/* copy: pending bg-copy */}</p>
                        )}
                        {item && (
                          <div key={item.id} className="flex flex-col flex-1 min-w-0">
                            <div className="text-heading text-ink line-clamp-2 break-words" title={item.title}>{item.title}</div>
                            <div className="text-body text-ink-2 mt-1 line-clamp-4" title={item.description}>{item.description}</div>
                            {reopenedLine && (
                              <div className="mt-2 flex items-start gap-1.5 text-meta text-warn bg-warn-tint border border-warn rounded-control px-3 py-2">
                                <RotateCcw size={12} className="mt-0.5 shrink-0" aria-hidden="true" />
                                <span>{reopenedLine}</span>
                              </div>
                            )}
                            <div
                              className="mt-3 rounded-control bg-surface-2 p-3 text-body text-ink-2 max-h-[176px] overflow-y-auto"
                              tabIndex={0}
                              role="region"
                              aria-label="Recommended fix"
                            >
                              <span className="text-meta font-medium text-ink-3 block mb-1">Recommended fix</span>
                              {item.fix}
                            </div>
                            {fixNotice?.id === item.id && (
                              <div role="status" className="mt-2 text-meta text-warn">{fixNotice.text}</div>
                            )}
                            <div className="mt-auto pt-3 flex flex-row flex-wrap items-center gap-2">
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => copyFix(item.id, fixPromptFor(item))}
                                aria-label={`${FIX_COPY.copyPrompt}: ${item.title}`}
                              >
                                {copiedFix === item.id
                                  ? <><CheckCheck size={14} aria-hidden="true" className="text-pos-ink" /> Copied</>
                                  : <><Copy size={14} aria-hidden="true" /> {FIX_COPY.copyPrompt}</>
                                }
                              </Button>
                              <Button
                                variant="secondary"
                                size="sm"
                                icon={CircleCheck}
                                loading={busy}
                                onClick={() => markFix(item, 'done')}
                                aria-label={`${FIX_COPY.markDone}: ${item.title}`}
                              >
                                {FIX_COPY.markDone}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                icon={EyeOff}
                                disabled={busy}
                                onClick={() => markFix(item, 'dismissed')}
                                aria-label={`${FIX_COPY.dismiss}: ${item.title}`}
                              >
                                {FIX_COPY.dismiss}
                              </Button>
                            </div>
                          </div>
                        )}
                      </section>
                    )
                  })}
                </div>
              )}
              {/* Workflow explainer: the fix itself is a content action outside
                  the app; marking it done is what the app tracks and re-checks
                  (docs/arch/fix-states.md). */}
              <p className="m-0 px-4 py-2.5 text-meta text-ink-2 bg-surface-2 border-t border-line">
                {FIX_COPY.explainer}
              </p>
              {doneFixRows.length > 0 && (
                <div className="border-t border-line">
                  <button
                    onClick={() => setShowDoneFixes(v => !v)}
                    aria-expanded={showDoneFixes}
                    className="w-full min-h-[44px] flex items-center justify-between px-4 py-2.5 text-meta font-medium text-ink-2 hover:text-ink hover:bg-surface-2 transition-colors"
                  >
                    <span className="flex items-center gap-1.5">
                      <CircleCheck size={13} className="text-pos-ink" aria-hidden="true" />
                      {FIX_COPY.doneHeading} ({doneFixRows.length})
                    </span>
                    {showDoneFixes ? <ChevronUp size={13} aria-hidden="true" /> : <ChevronDown size={13} aria-hidden="true" />}
                  </button>
                  <Collapse open={showDoneFixes}>
                    <ul className="m-0 p-0 list-none divide-y divide-line bg-surface-2">
                      {doneFixRows.map(row => {
                        const busy = fixBusy === row.fix_id
                        const tone = row.status === 'verified'
                          ? 'text-pos-ink'
                          : row.status === 'dismissed' ? 'text-ink-3' : 'text-ink-2'
                        const measurable = row.status === 'done' && parseMetricKey(row.metric_key) !== null && row.baseline_value !== null
                          && evaluateFix(row, results, fixPromptIds, fixEngineIds).state !== 'untracked'
                        return (
                          <li key={row.fix_id} className="px-4 py-3 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                            <div className="min-w-0">
                              <div className={`text-meta font-semibold ${tone} break-words`}>
                                {row.status === 'verified' && <CheckCheck size={12} className="inline mr-1 -mt-0.5" aria-hidden="true" />}
                                {row.title ?? row.fix_id}
                              </div>
                              <div className="text-meta text-ink-3 mt-0.5">{doneFixLine(row)}</div>
                              {fixNotice?.id === row.fix_id && (
                                <div role="status" className="mt-1 text-meta text-warn">{fixNotice.text}</div>
                              )}
                            </div>
                            <div className="flex gap-2 shrink-0">
                              {measurable && (
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  icon={RefreshCw}
                                  loading={checkRequested === row.fix_id}
                                  disabled={busy}
                                  onClick={() => checkFixNow(row.fix_id)}
                                  aria-label={`${FIX_COPY.checkNow}: ${row.title ?? row.fix_id}`}
                                >
                                  {FIX_COPY.checkNow}
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                icon={Undo2}
                                loading={busy}
                                onClick={() => reopenFix(row.fix_id)}
                                aria-label={`${row.status === 'dismissed' ? FIX_COPY.restore : FIX_COPY.reopen}: ${row.title ?? row.fix_id}`}
                              >
                                {row.status === 'dismissed' ? FIX_COPY.restore : FIX_COPY.reopen}
                              </Button>
                            </div>
                          </li>
                        )
                      })}
                    </ul>
                  </Collapse>
                </div>
              )}
            </Card>
          </Collapse>
        </motion.section>
      )}

      {/* ── Your prompts (block 5) ──────────────────────────────────────────── */}
      <section aria-label={AIV_COPY.promptsHeading} className="mb-6">
        <SectionHeader title={AIV_COPY.promptsHeading} count={prompts.length > 0 ? prompts.length : undefined} />

        {loadError && (
          <div className="mb-4 flex flex-wrap items-center gap-3 rounded-card border border-line bg-surface p-3">
            <AlertTriangle size={16} aria-hidden="true" className="shrink-0 text-warn" />
            <span className="text-body text-ink">{AIV_COPY.promptsLoadError}</span>
            <Button variant="secondary" size="sm" className="ml-auto" onClick={() => reload({ quiet: true })}>
              {AIV_COPY.promptsLoadRetry}
            </Button>
          </div>
        )}

        {prompts.length > 0 && (() => {
          const activeCats = [...new Set(prompts.map(p => p.category).filter(Boolean))]
          return (
            <div className="mb-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              {activeCats.length > 0 ? (
                <ChipGroup label="Category">{/* copy: pending bg-copy */}
                  <Chip selected={filterCats.size === 0} onClick={() => setFilterCats(new Set())}>
                    {t.aiv_allCategories}
                  </Chip>
                  {activeCats.map(cat => (
                    <Chip
                      key={cat}
                      selected={filterCats.has(cat)}
                      onClick={() => {
                        setFilterCats(prev => {
                          const next = new Set(prev)
                          if (next.has(cat)) next.delete(cat)
                          else next.add(cat)
                          return next
                        })
                      }}
                    >
                      {getCatLabel(cat)}
                    </Chip>
                  ))}
                </ChipGroup>
              ) : <span />}

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                {prompts.length >= 2 && (
                  <>
                    <div className="hidden sm:block">
                      <SegmentedControl
                        ariaLabel={AIV_COPY.sortGroupLabel}
                        value={sortMode}
                        onChange={(m: SortMode) => changeSort(m)}
                        options={SORT_MODES.map(mode => ({ value: mode, label: SORT_LABEL[mode] }))}
                      />
                    </div>
                    <div className="sm:hidden w-full">
                      <label htmlFor="aiv-sort" className="text-meta text-ink-2 block mb-1">{AIV_COPY.sortLabel}</label>
                      <select
                        id="aiv-sort"
                        value={sortMode}
                        onChange={e => changeSort(parseSortMode(e.target.value))}
                        className="w-full min-h-[44px] rounded-control border border-line bg-surface px-3 text-body text-ink"
                      >
                        {SORT_MODES.map(mode => <option key={mode} value={mode}>{SORT_LABEL[mode]}</option>)}
                      </select>
                    </div>
                  </>
                )}
                <Button
                  variant="secondary"
                  size="sm"
                  icon={Download}
                  onClick={exportCsv}
                  disabled={visibleCount === 0}
                  title={visibleCount === 0 ? 'Nothing to export yet' : undefined}
                  aria-label="Export AI Visibility results as CSV"
                >
                  Export CSV
                </Button>
              </div>
            </div>
          )
        })()}

        {orderFrozen && prompts.length >= 2 && (
          <p className="text-meta text-ink-2 mb-3">{AIV_COPY.orderFrozenNote}</p>
        )}

        {prompts.length === 0 && !loadError && (
          <Card pad="none" className="overflow-hidden">
            <SharedEmptyState
              icon={Target}
              title="No prompts yet"
              body={t.aiv_noPrompts}
              actionLabel="Add prompts"
              actionTo="/prompts"
            />
          </Card>
        )}

        {prompts.length > 0 && visibleCount === 0 && (
          <div className="rounded-card border border-dashed border-line p-6 text-center">
            <p className="text-body text-ink-2">{AIV_COPY.categoryEmpty}</p>
            <Button variant="secondary" size="sm" className="mt-3" onClick={() => setFilterCats(new Set())}>
              {AIV_COPY.categoryEmptyAction}
            </Button>
          </div>
        )}

        {(() => {
          const appearSec = renderPlan.find(s => s.key === 'appear')
          const notYetSec = renderPlan.find(s => s.key === 'notYet')
          const uncheckedSec = renderPlan.find(s => s.key === 'unchecked')
          const rowsOf = (sec: (typeof renderPlan)[number]) => (
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
          )
          const failureDates = uncheckedSec
            ? uncheckedSec.rows.map(r => summaries.get(r.prompt.id)?.oldestErrorSince).filter((d): d is string => !!d).sort()
            : []
          const legend = prompts.length > 0 ? (
            <Disclosure key={`legend-${activeClientId ?? ''}`} title="What the symbols mean">{/* copy: pending bg-copy */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-3 text-meta text-ink-2">
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
            </Disclosure>
          ) : null
          const showCard = !!appearSec
          return (
            <>
              {showCard && appearSec && (
                <Card pad="none" className="overflow-hidden">
                  <div id="aiv-section-appear">
                    <div className={isWide ? 'overflow-x-auto' : 'p-3 space-y-2'}>
                      <div style={isWide ? { minWidth: tableMinWidth } : undefined}>
                        {isWide && (
                          <div
                            className="grid border-b border-line bg-surface-2"
                            style={{ gridTemplateColumns: tableColsTemplate }}
                          >
                            <div className="px-2 py-2.5 label-caps self-center sticky left-0 z-[1] bg-surface-2">#</div>
                            <div className="px-3 py-2.5 label-caps self-center sticky left-10 z-[1] bg-surface-2 shadow-[1px_0_0_rgb(var(--line))]">{t.aiv_prompt}</div>
                            {activeLLMs.map(llm => (
                              <div key={llm.id} className="px-1 py-2 flex flex-col items-center justify-center gap-1">
                                <span className="w-6 h-6 rounded-badge bg-surface ring-1 ring-inset ring-line flex items-center justify-center">
                                  <img src={llm.logoUrl} alt="" aria-hidden="true" className="w-4 h-4 object-contain" />
                                </span>
                                <span className="text-meta font-medium text-ink-2 text-center leading-tight">{llm.label}</span>
                              </div>
                            ))}
                            {lockedColumns.map(id => (
                              <Link
                                key={id}
                                to="/account"
                                aria-label={lockedHeaderLabel(ENGINE_META[id].label, PLAN_LABELS[ENGINE_UNLOCK_PLAN[id]])}
                                title={ENGINE_META[id].label}
                                className="flex flex-col items-center justify-center gap-1 min-h-[44px] px-1 py-1.5 rounded-md hover:bg-surface-3 min-w-0"
                              >
                                <span className="w-6 h-6 rounded-badge bg-surface ring-1 ring-inset ring-line flex items-center justify-center">
                                  <img src={ENGINE_META[id].logoUrl} alt="" aria-hidden="true" className="w-4 h-4 object-contain grayscale opacity-70" />
                                </span>
                                <span className="max-w-full text-meta leading-tight text-ink-2 text-center break-words line-clamp-2">{ENGINE_META[id].label}</span>
                                <span className="inline-flex max-w-full items-center justify-center gap-1 text-meta leading-tight text-ink-3">
                                  <Lock size={10} aria-hidden="true" className="shrink-0" />
                                  <span className="min-w-0 text-center">{PLAN_LABELS[ENGINE_UNLOCK_PLAN[id]]}</span>
                                </span>
                              </Link>
                            ))}
                          </div>
                        )}
                        {rowsOf(appearSec)}
                      </div>
                    </div>
                  </div>
                </Card>
              )}

              {notYetSec && (
                <div id="aiv-section-notYet" className="mt-4">
                  <Disclosure
                    title={SECTION_TITLE.notYet}
                    count={notYetSec.rows.length}
                    summary={`${promptCount(notYetSec.rows.length)}, no engine named your brand`}/* copy: pending bg-copy */
                    defaultOpen={sectionIsOpen('notYet')}
                    key={`notYet-${activeClientId ?? ''}`}
                  >
                    <div className={isWide ? 'pt-2' : 'pt-2 space-y-2'}>{rowsOf(notYetSec)}</div>
                  </Disclosure>
                </div>
              )}

              {uncheckedSec && (
                <div id="aiv-section-unchecked" className="mt-4">
                  <Disclosure
                    title={SECTION_TITLE.unchecked}
                    count={uncheckedSec.rows.length}
                    summary={failureDates.length > 0 ? sectionUncheckedExtra(formatDate(failureDates[0])) : promptCount(uncheckedSec.rows.length)}
                    defaultOpen={sectionIsOpen('unchecked')}
                    key={`unchecked-${activeClientId ?? ''}`}
                  >
                    <div className={isWide ? 'pt-2' : 'pt-2 space-y-2'}>{rowsOf(uncheckedSec)}</div>
                  </Disclosure>
                </div>
              )}

              {legend && <div className="mt-4">{legend}</div>}
            </>
          )
        })()}

        {prompts.length > 0 && !isAdmin && <p className="mt-3 text-meta text-ink-2">{AIV_COPY.viewerHint}</p>}
      </section>

      {/* ── Competitors and categories (block 7) ────────────────────────────── */}
      {(() => {
        const catStats = (data?.categoryStats ?? []).map(c => ({
          cat: c.category,
          label: getCatLabel(c.category),
          pct: Math.round(c.rate * 100),
          checked: c.checked,
          mentioned: c.mentioned,
        })).sort((a, b) => b.pct - a.pct)

        // Nothing measured yet means every category would show 0%, which is
        // not a comparison, it is a placeholder pretending to be data (§11
        // rule 1). Suppress the category list rather than render nine zeroes.
        const showCats = totalChecked > 0 && catStats.length > 0
        if (competitorFreq.length === 0 && !showCats) return null
        const weakest = showCats ? catStats[catStats.length - 1] : null
        const summaryParts = [
          competitorFreq.length > 0 ? `${competitorFreq.length} competitors named` : null,
          weakest ? `weakest category ${weakest.label} at ${weakest.pct}%` : null,
        ].filter((s): s is string => !!s)
        return (
          <Disclosure
            key={`cats-${activeClientId ?? ''}`}
            title="Competitors and categories"/* copy: pending bg-copy */
            summary={summaryParts.join(', ')}/* copy: pending bg-copy */
          >
            {competitorFreq.length > 0 && (
              <div className="pt-3">
                <h3 className="text-heading text-ink">Top competitors in AI recommendations</h3>
                <p className="text-meta text-ink-3 mt-1 mb-3">
                  Companies that appear most often in AI top-5 rankings across all prompts. Real response data only.
                  {gapCount > 0 && ` ${brandName} absent ${gapCount} of ${totalChecked} checks.`}
                </p>
                <div className="flex flex-wrap gap-2">
                  {competitorFreq.map(({ name, count, avgPos }) => (
                    <span key={name} className="inline-flex items-center gap-2">
                      <Badge tone="neutral">{name} {count}x</Badge>
                      {avgPos !== null && <span className="text-meta text-ink-3">avg #{avgPos}</span>}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {showCats && (
              <div className="pt-4">
                <h3 className="text-heading text-ink">Category breakdown</h3>
                <p className="text-meta text-ink-3 mt-1 mb-3">{totalChecked} total checks across {prompts.length} prompt{prompts.length !== 1 ? 's' : ''} × {activeLLMs.length} engine{activeLLMs.length !== 1 ? 's' : ''}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
                  {catStats.map(({ cat, label, pct, checked, mentioned }) => (
                    <Meter
                      key={cat}
                      value={pct}
                      tone={pct >= 50 ? 'pos' : pct >= 25 ? 'warn' : 'neg'}
                      label={label}
                      valueLabel={`${pct}% · ${mentioned}/${checked} checks`}
                    />
                  ))}
                </div>
              </div>
            )}
          </Disclosure>
        )
      })()}
    </Page>
  )
}
