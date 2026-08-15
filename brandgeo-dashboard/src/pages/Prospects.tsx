/**
 * Prospects.tsx — BrandGEO's own sales CRM, replacing HubSpot. Admin only.
 *
 * WHY THIS PAGE EXISTS (do not lose this while editing it): Constantin runs
 * founder-led sales alone, against 108+ audits across 70+ domains with a daily
 * pipeline adding ~20 prospects every weekday. The one thing no generic CRM can
 * do is what this page is built around: BrandGEO already knows a prospect's AI
 * visibility score and has a public report URL to send them BEFORE the first
 * touch. That is the pitch and the qualification in one field, so it is the
 * spine of the row, not a column buried on the right.
 *
 * DATA CONTRACT (fixed, do not deviate — see the packet this page shipped
 * against, and src/types/index.ts for the shared shape):
 *
 *   POST /.netlify/functions/prospects-admin   { action: 'list' }
 *     -> { prospects: Prospect[] }
 *   POST /.netlify/functions/prospects-admin   { action: 'update', id, patch }
 *     -> { prospect: Prospect } | { error: string }
 *
 * `patch` may only contain PROSPECT_WRITABLE_FIELDS (types/index.ts):
 * stage, notes, owner, next_action_at, last_contacted_at, replied_at,
 * reply_note. Every other field (domain, company, contact_*, segment, tier,
 * audit_token, ai_score, competitor_count, source, disqualified_reason,
 * created_at, updated_at) is read only — this page renders them but never
 * offers an edit control for them, including disqualified_reason, which reads
 * like something a human would type but is not on the writable list.
 *
 * The action names ('list' / 'update') and the update-endpoint envelope shape
 * are this builder's choice, not specified in the packet beyond the row shape
 * and the writable-field list — chosen to match the one action-dispatch
 * pattern this app already uses twice (promotions-admin.js,
 * PromotionsPanel.tsx: { action, ...payload } -> one function, one route).
 * If bg-backend's real prospects-admin.js uses a different envelope, only the
 * three functions in the "API" section below need to change.
 *
 * BACKEND DEPENDENCY: prospects-admin.js is being built in parallel by
 * bg-backend and may not exist yet. Every call 404s until it ships; this page
 * shows a clear "not available yet" state instead of a raw fetch error
 * (same pattern as PromotionsPanel.tsx for promotions-admin.js), so this page
 * ships without blocking on that endpoint landing first.
 *
 * WORK QUEUE, not a spreadsheet (see isActionableNow / queueSort below):
 * default view surfaces exactly two situations — audited and never contacted,
 * or contacted/replied/meeting with a next action due today or earlier — and
 * orders them by evidence strength first (a true zero with several named
 * competitors is a stronger conversation than a 48 with none), overdue
 * follow-ups pulled to the very top regardless of evidence. Read a zero as a
 * finding, not a failure: docs/copy/audit-score-presentation-2026-08-14.md
 * rules that a zero means "not named when buyers ask about the category",
 * never "invisible" and never a verdict, and this page's score treatment
 * follows that (neutral violet chip, never red, never framed as a failing
 * grade).
 */
import { useEffect, useMemo, useState } from 'react'
import {
  Search, ExternalLink, Linkedin, Globe, FileSearch, Clock, ChevronDown,
  CheckCircle2, XCircle, Ban, Phone, StickyNote, CalendarClock, User as UserIcon,
  Inbox, ListFilter,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useClient } from '../lib/clientContext'
import { PageTitle } from '../components/Typography'
import EmptyState from '../components/EmptyState'
import Skeleton from '../components/Skeleton'
import type { Prospect, ProspectStage, ProspectPatch } from '../types'

// ── API ─────────────────────────────────────────────────────────────────────
// Same authenticated-POST pattern every other admin-only Netlify function in
// this app uses (Revenue.tsx's authedPost, PromotionsPanel.tsx's authedPost) —
// one Authorization header shape, kept local rather than shared because the
// three existing copies are equally small and none of them has been promoted
// to lib/ yet; not introducing a fourth divergent shape.
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

const listProspects = () => authedPost<{ prospects?: Prospect[]; error?: string }>('prospects-admin', { action: 'list' })
const updateProspect = (id: number, patch: ProspectPatch) =>
  authedPost<{ prospect?: Prospect; error?: string }>('prospects-admin', { action: 'update', id, patch })

// ── Stage vocabulary ─────────────────────────────────────────────────────────
const STAGE_ORDER: ProspectStage[] = [
  'new', 'qualified', 'audited', 'contacted', 'replied', 'meeting', 'won', 'lost', 'disqualified',
]
const STAGE_LABELS: Record<ProspectStage, string> = {
  new: 'New', qualified: 'Qualified', audited: 'Audited', contacted: 'Contacted',
  replied: 'Replied', meeting: 'Meeting', won: 'Won', lost: 'Lost', disqualified: 'Disqualified',
}
const TERMINAL_STAGES: ProspectStage[] = ['won', 'lost', 'disqualified']

// One-click forward progression for the common path. Not every stage has a
// next step worth a dedicated button (lost/disqualified/won are terminal), and
// jumping to any OTHER stage (including backward, or skipping ahead) is always
// available via the select next to it — this button is the fast path, not the
// only path.
const NEXT_STEP: Partial<Record<ProspectStage, { to: ProspectStage; label: string }>> = {
  new:       { to: 'qualified', label: 'Qualify' },
  qualified: { to: 'audited',   label: 'Mark audited' },
  audited:   { to: 'contacted', label: 'Mark contacted' },
  contacted: { to: 'replied',   label: 'Mark replied' },
  replied:   { to: 'meeting',   label: 'Book meeting' },
  meeting:   { to: 'won',       label: 'Mark won' },
}

// Stage transitions this page performs also stamp the matching timestamp,
// because "move to contacted" and "we touched them just now" are the same
// real-world event for a founder working this list by hand. Only fires when
// the target timestamp is genuinely a writable field (it is, per the
// contract) and does not already have a value newer than this action.
function autoStampFor(toStage: ProspectStage): ProspectPatch {
  const now = new Date().toISOString()
  if (toStage === 'contacted') return { last_contacted_at: now }
  if (toStage === 'replied')   return { replied_at: now }
  return {}
}

// ── Work-queue ordering ──────────────────────────────────────────────────────
// "Actionable now": audited and never contacted, or ANY open prospect whose
// next_action_at has arrived. Deliberately excludes the three terminal stages.
function isActionableNow(p: Prospect, now: number): boolean {
  if (TERMINAL_STAGES.includes(p.stage)) return false
  if (p.stage === 'audited' && !p.last_contacted_at) return true
  if (p.next_action_at && new Date(p.next_action_at).getTime() <= now) return true
  return false
}

function isOverdue(p: Prospect, now: number): boolean {
  return !!p.next_action_at && new Date(p.next_action_at).getTime() <= now && !TERMINAL_STAGES.includes(p.stage)
}

// Evidence strength: how good a conversation opener this prospect is right
// now. A true zero is the strongest possible opener (nobody is naming them
// for their own category yet), and each named competitor sharpens it further
// (a specific brand to point at beats a generic "you're invisible" claim).
// Un-audited prospects score 0 here — they have no evidence yet, so they sort
// by recency instead (see queueSort).
function evidenceStrength(p: Prospect): number {
  if (p.ai_score === null) return 0
  return (100 - p.ai_score) + (p.competitor_count ?? 0) * 8
}

// Top row is the one to do next. Overdue follow-ups always win (a promise to
// a prospect is the one thing that must never silently slip), then evidence
// strength, then most-recently-audited as a tiebreaker so nothing goes stale
// at the bottom of a tie.
function queueSort(now: number) {
  return (a: Prospect, b: Prospect): number => {
    const overdueA = isOverdue(a, now), overdueB = isOverdue(b, now)
    if (overdueA !== overdueB) return overdueA ? -1 : 1
    const strengthDiff = evidenceStrength(b) - evidenceStrength(a)
    if (strengthDiff !== 0) return strengthDiff
    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  }
}

const reportUrl = (token: string) => `https://app.getbrandgeo.com/audit/${token}`

function timeAgo(iso: string | null): string | null {
  if (!iso) return null
  const ms = Date.now() - new Date(iso).getTime()
  const days = Math.floor(ms / 86_400_000)
  if (days <= 0) return 'today'
  if (days === 1) return '1 day ago'
  if (days < 30) return `${days} days ago`
  const months = Math.floor(days / 30)
  return months === 1 ? '1 month ago' : `${months} months ago`
}

function formatDate(iso: string | null): string {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

// ── Score chip ────────────────────────────────────────────────────────────
// Deliberately no red/green pass-fail coloring anywhere on this page. A zero
// is a finding, not a failure (docs/copy/audit-score-presentation-2026-08-14.md
// section 4) — it means the field is wide open, which for a salesperson is
// good news, not bad news, so a red "0" chip would send exactly the wrong
// signal to the one person reading it.
function ScoreChip({ p }: { p: Prospect }) {
  if (p.ai_score === null) {
    return <span className="text-[11px] text-slate-500 shrink-0">Not audited yet</span>
  }
  const zero = p.ai_score === 0
  const competitors = p.competitor_count ?? 0
  return (
    <div className="text-right shrink-0">
      <div
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
          zero
            ? 'bg-brand-500/10 text-brand-300 border-brand-500/30'
            : 'bg-dark-700 text-slate-200 border-dark-600'
        }`}
        title={zero
          ? 'Not named in any answer this screening collected. An open field, not a verdict.'
          : 'AI Visibility Score'}
      >
        {zero ? 'Not named yet' : `${p.ai_score}/100`}
      </div>
      {competitors > 0 && (
        <div className="text-[11px] text-slate-500 mt-1 whitespace-nowrap">
          {competitors} {competitors === 1 ? 'competitor' : 'competitors'} named instead
        </div>
      )}
    </div>
  )
}

function StageBadge({ stage }: { stage: ProspectStage }) {
  const tone: Record<ProspectStage, string> = {
    new:          'bg-dark-700 text-slate-400 border-dark-600',
    qualified:    'bg-dark-700 text-slate-300 border-dark-600',
    audited:      'bg-brand-500/10 text-brand-300 border-brand-500/30',
    contacted:    'bg-sky-500/10 text-sky-300 border-sky-500/30',
    replied:      'bg-amber-500/10 text-amber-300 border-amber-500/30',
    meeting:      'bg-amber-500/10 text-amber-300 border-amber-500/30',
    won:          'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
    lost:         'bg-dark-700 text-slate-500 border-dark-600 line-through',
    disqualified: 'bg-dark-700 text-slate-500 border-dark-600',
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border shrink-0 ${tone[stage]}`}>
      {STAGE_LABELS[stage]}
    </span>
  )
}

function LinkChip({ href, icon: Icon, label }: { href: string; icon: typeof ExternalLink; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-dark-700/60 text-slate-300 border border-dark-600 hover:text-brand-300 hover:border-brand-500/40 transition-colors"
    >
      <Icon size={12} /> {label}
    </a>
  )
}

// ── Row ───────────────────────────────────────────────────────────────────
function ProspectRow({
  p, now, onPatch,
}: {
  p: Prospect
  now: number
  onPatch: (id: number, patch: ProspectPatch) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [notesDraft, setNotesDraft] = useState(p.notes ?? '')
  const [replyDraft, setReplyDraft] = useState(p.reply_note ?? '')
  const [ownerDraft, setOwnerDraft] = useState(p.owner ?? '')
  const overdue = isOverdue(p, now)
  const next = NEXT_STEP[p.stage]

  const changeStage = (to: ProspectStage) => {
    onPatch(p.id, { stage: to, ...autoStampFor(to) })
    if (to === 'replied') setExpanded(true) // surface the reply-note field right away
  }

  return (
    <div className={`bg-dark-800 border rounded-xl p-4 sm:p-5 ${overdue ? 'border-amber-500/40' : 'border-dark-700'}`}>
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-slate-100 truncate">{p.company || p.domain}</span>
            <StageBadge stage={p.stage} />
            {overdue && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border bg-amber-500/10 text-amber-300 border-amber-500/30 shrink-0">
                <Clock size={11} /> Follow-up due
              </span>
            )}
          </div>
          <div className="text-xs text-slate-500 mt-0.5 truncate">{p.domain}</div>
          {p.contact_name && (
            <div className="text-sm text-slate-300 mt-1 truncate">
              {p.contact_name}{p.contact_role ? `, ${p.contact_role}` : ''}
            </div>
          )}
        </div>
        <ScoreChip p={p} />
      </div>

      {/* Verified contact route + the report — the two links that matter next */}
      <div className="flex flex-wrap items-center gap-2 mt-3">
        {p.audit_token && <LinkChip href={reportUrl(p.audit_token)} icon={FileSearch} label="View report" />}
        {p.contact_url && <LinkChip href={p.contact_url} icon={Globe} label="Contact" />}
        {p.linkedin_url && <LinkChip href={p.linkedin_url} icon={Linkedin} label="LinkedIn" />}
        {p.segment && (
          <span className="text-[11px] text-slate-500 px-2 py-1">{p.segment}{p.tier ? ` · ${p.tier}` : ''}</span>
        )}
      </div>

      {/* One-click progression + always-available jump-to-any-stage */}
      <div className="flex flex-wrap items-center gap-2 mt-3">
        {next && (
          <button
            onClick={() => changeStage(next.to)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-brand-500 text-white hover:bg-brand-400 transition-colors"
          >
            <CheckCircle2 size={13} /> {next.label}
          </button>
        )}
        {p.stage !== 'contacted' && !TERMINAL_STAGES.includes(p.stage) && (
          <button
            onClick={() => onPatch(p.id, { last_contacted_at: new Date().toISOString() })}
            title="Log a touch without changing stage"
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-dark-700/60 text-slate-300 border border-dark-600 hover:text-slate-100 transition-colors"
          >
            <Phone size={12} /> Log touch
          </button>
        )}
        <select
          value={p.stage}
          onChange={e => changeStage(e.target.value as ProspectStage)}
          className="bg-dark-700/60 border border-dark-600 rounded-lg px-2 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-brand-500/50"
          aria-label="Change stage"
        >
          {STAGE_ORDER.map(s => <option key={s} value={s}>{STAGE_LABELS[s]}</option>)}
        </select>
        {!TERMINAL_STAGES.includes(p.stage) && (
          <button
            onClick={() => changeStage('lost')}
            className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-rose-400 transition-colors px-1.5 py-1.5"
          >
            <XCircle size={12} /> Lost
          </button>
        )}
        {!TERMINAL_STAGES.includes(p.stage) && (
          <button
            onClick={() => changeStage('disqualified')}
            className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-rose-400 transition-colors px-1.5 py-1.5"
          >
            <Ban size={12} /> Disqualify
          </button>
        )}
        <button
          onClick={() => setExpanded(v => !v)}
          className="ml-auto inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 transition-colors px-1.5 py-1.5"
          aria-expanded={expanded}
        >
          <StickyNote size={12} /> Notes & next action
          <ChevronDown size={12} className={`transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {expanded && (
        <div className="mt-3 pt-3 border-t border-dark-700 grid gap-3 sm:grid-cols-2">
          <div>
            <label className="text-[10px] uppercase tracking-wide text-slate-500 mb-1 flex items-center gap-1">
              <CalendarClock size={11} /> Next action
            </label>
            <input
              type="date"
              value={p.next_action_at ? p.next_action_at.slice(0, 10) : ''}
              onChange={e => onPatch(p.id, { next_action_at: e.target.value ? new Date(e.target.value).toISOString() : null })}
              className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-brand-500/50"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-wide text-slate-500 mb-1 flex items-center gap-1">
              <UserIcon size={11} /> Owner
            </label>
            <input
              type="text"
              value={ownerDraft}
              onChange={e => setOwnerDraft(e.target.value)}
              onBlur={() => { if (ownerDraft !== (p.owner ?? '')) onPatch(p.id, { owner: ownerDraft || null }) }}
              placeholder="Unassigned"
              className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-brand-500/50"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="text-[10px] uppercase tracking-wide text-slate-500 mb-1 block">Notes</label>
            <textarea
              value={notesDraft}
              onChange={e => setNotesDraft(e.target.value)}
              onBlur={() => { if (notesDraft !== (p.notes ?? '')) onPatch(p.id, { notes: notesDraft || null }) }}
              rows={2}
              placeholder="What you know, what you tried, what to say next time"
              className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-brand-500/50 resize-y"
            />
          </div>
          {(p.stage === 'replied' || p.stage === 'meeting' || p.stage === 'won' || p.replied_at) && (
            <div className="sm:col-span-2">
              <label className="text-[10px] uppercase tracking-wide text-slate-500 mb-1 block">
                What they said{p.replied_at ? ` (replied ${formatDate(p.replied_at)})` : ''}
              </label>
              <textarea
                value={replyDraft}
                onChange={e => setReplyDraft(e.target.value)}
                onBlur={() => { if (replyDraft !== (p.reply_note ?? '')) onPatch(p.id, { reply_note: replyDraft || null }) }}
                rows={2}
                placeholder="Quote or summarize the reply"
                className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-brand-500/50 resize-y"
              />
            </div>
          )}
          {p.disqualified_reason && (
            <div className="sm:col-span-2 text-xs text-slate-500">
              <span className="uppercase tracking-wide text-[10px] text-slate-600">Disqualified reason</span>
              <div className="text-slate-400 mt-0.5">{p.disqualified_reason}</div>
            </div>
          )}
          <div className="sm:col-span-2 text-[11px] text-slate-600 flex flex-wrap gap-x-4 gap-y-0.5">
            {p.last_contacted_at && <span>Last contacted {timeAgo(p.last_contacted_at)}</span>}
            {p.source && <span>Source: {p.source}</span>}
            <span>Added {timeAgo(p.created_at)}</span>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────
type View = 'queue' | 'all'

export default function Prospects() {
  const { isAdmin } = useClient()
  const [prospects, setProspects] = useState<Prospect[]>([])
  const [loading, setLoading] = useState(true)
  const [unavailable, setUnavailable] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const [view, setView] = useState<View>('queue')
  const [stageFilter, setStageFilter] = useState<ProspectStage | 'all'>('all')
  const [segmentFilter, setSegmentFilter] = useState<string>('all')
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (!isAdmin) return
    let cancelled = false
    setLoading(true)
    listProspects().then(({ status, data }) => {
      if (cancelled) return
      if (status === 404) { setUnavailable(true); setLoading(false); return }
      if (data?.error) { setErrorMsg(data.error); setLoading(false); return }
      setUnavailable(false)
      setProspects(data?.prospects ?? [])
      setLoading(false)
    })
    return () => { cancelled = true }
  }, [isAdmin])

  // Optimistic patch: update local state immediately (this is a founder moving
  // fast on a phone between meetings, not a form with a submit button), then
  // reconcile with whatever the server actually stored. On failure, roll the
  // row back and surface why — silently losing a stage change is worse than a
  // visible error here, since the whole point of the page is trusting the
  // queue order enough to act on it.
  const onPatch = (id: number, patch: ProspectPatch) => {
    const previous = prospects.find(p => p.id === id)
    if (!previous) return
    setProspects(prev => prev.map(p => (p.id === id ? { ...p, ...patch, updated_at: new Date().toISOString() } : p)))
    updateProspect(id, patch).then(({ status, data }) => {
      // A 404 with no parseable body means the function itself is not deployed.
      // A 404 WITH a body is the server saying this prospect does not exist,
      // which must roll back like any other failure. Treating both as "not
      // deployed" left the optimistic change on screen with nothing saved.
      if (status === 404 && !data) { setUnavailable(true); return }
      if (data?.error || !data?.prospect) {
        setErrorMsg(data?.error || 'Could not save that change. Reverted.')
        setProspects(prev => prev.map(p => (p.id === id ? previous : p)))
        return
      }
      setProspects(prev => prev.map(p => (p.id === id ? data.prospect! : p)))
    })
  }

  const now = Date.now()

  const segments = useMemo(
    () => Array.from(new Set(prospects.map(p => p.segment).filter((s): s is string => !!s))).sort(),
    [prospects],
  )

  const stageCounts = useMemo(() => {
    const counts: Record<ProspectStage, number> = {
      new: 0, qualified: 0, audited: 0, contacted: 0, replied: 0, meeting: 0, won: 0, lost: 0, disqualified: 0,
    }
    for (const p of prospects) counts[p.stage]++
    return counts
  }, [prospects])

  const actionableCount = useMemo(() => prospects.filter(p => isActionableNow(p, now)).length, [prospects, now])

  const filtered = useMemo(() => {
    let rows = prospects
    if (segmentFilter !== 'all') rows = rows.filter(p => p.segment === segmentFilter)
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      rows = rows.filter(p =>
        p.domain.toLowerCase().includes(q) ||
        (p.company ?? '').toLowerCase().includes(q) ||
        (p.contact_name ?? '').toLowerCase().includes(q),
      )
    }
    if (view === 'queue') {
      rows = rows.filter(p => isActionableNow(p, now))
    } else if (stageFilter !== 'all') {
      rows = rows.filter(p => p.stage === stageFilter)
    }
    return [...rows].sort(queueSort(now))
  }, [prospects, segmentFilter, search, view, stageFilter, now])

  if (!isAdmin) {
    return (
      <div className="p-8 text-slate-500 text-sm">
        Access restricted to admins.
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <PageTitle>Prospects</PageTitle>
        <p className="text-sm text-slate-400 mt-0.5">
          Who to contact next, and what to say. Every row already has an AI visibility score and a public report link, before the first touch.
        </p>
      </div>

      {unavailable ? (
        <p className="text-xs text-amber-400/90 bg-amber-400/10 border border-amber-400/20 rounded-lg px-3 py-2 mb-6">
          The prospects backend isn't deployed yet (prospects-admin.js and the prospects table). This page is ready; it will start working the moment that ships.
        </p>
      ) : null}
      {errorMsg && (
        <p className="text-xs text-rose-400 bg-rose-400/10 border border-rose-400/20 rounded-lg px-3 py-2 mb-6">
          {errorMsg}
        </p>
      )}

      {/* View + filters */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="inline-flex rounded-lg border border-dark-600 p-0.5 bg-dark-800">
          <button
            onClick={() => setView('queue')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${view === 'queue' ? 'bg-brand-500 text-white' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Next up{prospects.length > 0 ? ` (${actionableCount})` : ''}
          </button>
          <button
            onClick={() => setView('all')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${view === 'all' ? 'bg-brand-500 text-white' : 'text-slate-400 hover:text-slate-200'}`}
          >
            All ({prospects.length})
          </button>
        </div>

        {segments.length > 0 && (
          <select
            value={segmentFilter}
            onChange={e => setSegmentFilter(e.target.value)}
            className="bg-dark-800 border border-dark-600 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-brand-500/50"
          >
            <option value="all">All segments</option>
            {segments.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        )}

        <div className="relative flex-1 min-w-[160px] max-w-xs">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Domain, company or contact…"
            className="w-full bg-dark-800 border border-dark-600 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-brand-500/50"
          />
        </div>
      </div>

      {/* Funnel — count per stage, click to jump into All + that stage. Always
          visible so the shape of the pipeline is legible at a glance, even
          while looking at the Next-up queue. */}
      <div className="flex flex-wrap items-center gap-1.5 mb-6">
        <ListFilter size={12} className="text-slate-600 shrink-0" />
        {STAGE_ORDER.map(s => (
          <button
            key={s}
            onClick={() => { setView('all'); setStageFilter(s) }}
            className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium border transition-colors ${
              view === 'all' && stageFilter === s
                ? 'bg-brand-500/15 text-brand-300 border-brand-500/40'
                : 'bg-dark-800 text-slate-500 border-dark-700 hover:text-slate-300'
            }`}
          >
            {STAGE_LABELS[s]} <span className="tabular-nums">{stageCounts[s]}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map(i => (
            <div key={i} className="bg-dark-800 border border-dark-700 rounded-xl p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
              <div className="flex gap-2 mt-4">
                <Skeleton className="h-7 w-24 rounded-lg" />
                <Skeleton className="h-7 w-20 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      ) : prospects.length === 0 ? (
        unavailable ? null : (
          <EmptyState
            icon={Inbox}
            title="No prospects yet"
            body="Prospects populate automatically from BrandGEO's audit pipeline and the daily outbound backlog. Once an audit or the pipeline adds one, it shows up here ready to work."
            minHeight={220}
          />
        )
      ) : filtered.length === 0 ? (
        view === 'queue' ? (
          <EmptyState
            icon={CheckCircle2}
            title="You're caught up"
            body="Nothing is waiting on you right now: no un-contacted audited prospect and no follow-up is due. Switch to All to browse the rest of the pipeline."
            actionLabel="View all prospects"
            onAction={() => setView('all')}
            minHeight={220}
          />
        ) : (
          <EmptyState
            icon={Search}
            title="No matches"
            body="No prospect matches this filter and search combination. Try clearing the segment filter or the search box."
            minHeight={200}
          />
        )
      ) : (
        <div className="space-y-3">
          {filtered.map(p => (
            <ProspectRow key={p.id} p={p} now={now} onPatch={onPatch} />
          ))}
        </div>
      )}
    </div>
  )
}
