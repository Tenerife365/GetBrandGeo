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
 * DATA CONTRACT (fixed, confirmed live against production by bg-backend — see
 * src/types/index.ts for the shared shape):
 *
 *   POST /.netlify/functions/prospects-admin   { action: 'list' }
 *     -> { prospects: Prospect[] }   each row carries `touches: Touch[]`
 *        nested, most recent first — one extra query server-side, not N+1.
 *   POST /.netlify/functions/prospects-admin   { action: 'update', id, patch }
 *     -> { prospect: Prospect } | { error: string }
 *   POST /.netlify/functions/prospects-admin   { action: 'touch', prospect_id,
 *        channel: 'email'|'linkedin'|'x', direction: 'out'|'in',
 *        occurred_at?, subject?, body?, note? }
 *     -> { touch: Touch, prospect: Prospect } | { error: string } (404 if the
 *        prospect_id does not exist). The returned `prospect` is the row
 *        AFTER the server-side stamp (see below) and carries no `touches`
 *        key of its own — callers must merge, not replace.
 *   POST /.netlify/functions/prospects-admin   { action: 'promote', candidate_id }
 *     -> { prospect: Prospect, candidate: ContactCandidate, warning?: string }
 *   POST /.netlify/functions/resolve-contact-routes   { prospect_id }
 *     -> { results: [...], totals: {...} }. The candidates in THAT response
 *        are pre-insert shapes with no database id, so this page re-lists
 *        after a successful resolve rather than merging them directly. A
 *        candidate without an id cannot be promoted.
 *
 * CONTACT ROUTES ARE STAGED, NEVER AUTO-APPLIED (packet 019). Measured
 * 2026-08-16: all 43 prospects at stage='new' had zero contact routes while
 * 43 of 43 already had an audit token and a score: the expensive half of the
 * work was paid for and the cheap half was missing, so there was nobody to
 * write to. resolve-contact-routes.js closes that, but it deliberately never
 * writes public.prospects: it can prove a string appeared at a URL and cannot
 * prove the string belongs to the person you mean (2026-08-15 produced three
 * X accounts that looked right and were impostors). So it stages candidates
 * with provenance and this page is where a human picks one. Promoting is the
 * only way contact_email/linkedin_url/x_url ever get set, and promoting NEVER
 * sets x_verified or linkedin_verified, because choosing to use a URL is not the
 * same as having confirmed it.
 *
 * `patch` may only contain PROSPECT_WRITABLE_FIELDS (types/index.ts):
 * stage, notes, owner, next_action_at, last_contacted_at, replied_at,
 * reply_note. Every other field (domain, company, contact_*, segment, tier,
 * audit_token, ai_score, competitor_count, source, disqualified_reason,
 * created_at, updated_at, and the six channel-research fields added below)
 * is read only — this page renders them but never offers an edit control for
 * them, including disqualified_reason, which reads like something a human
 * would type but is not on the writable list.
 *
 * CHANNEL FIELDS (read only, research-derived): contact_email,
 * contact_email_source, contact_email_kind ('individual' | 'role'), x_url,
 * x_verified, linkedin_verified. `x_verified`/`linkedin_verified` are
 * NOT NULL booleans defaulting false, and false is ambiguous by the
 * contract's own admission — it means "never researched" OR "checked and
 * could not be confirmed" (LinkedIn returns HTTP 999 to automated clients,
 * so a profile URL can be positively confirmed but never positively denied).
 * This page never labels an unconfirmed URL in a way that claims more than
 * that — "Unconfirmed", never "Invalid" or "Unverified" (which reads as a
 * failed check, not an absent one).
 *
 * `last_contacted_at` and `replied_at` are no longer set by this page's own
 * `update` patches — logging a `touch` sets them server-side (an 'out' touch
 * sets last_contacted_at, an 'in' touch sets replied_at), in the same
 * request as the insert, so the queue timestamps can never disagree with the
 * touch history they are derived from. Stage changes on this page are now a
 * pure `update` patch of `stage` alone.
 *
 * The action names and envelope shapes are confirmed live by bg-backend's
 * prospects-admin.js header comment, matching this page's original
 * one-action-dispatch precedent (promotions-admin.js / PromotionsPanel.tsx).
 *
 * BACKEND DEPENDENCY: if prospects-admin.js is ever rolled back or a call
 * 404s for another reason, this page shows a clear "not available yet" state
 * instead of a raw fetch error (same pattern as PromotionsPanel.tsx).
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
  Search, ExternalLink, Linkedin, Twitter, Mail, Globe, FileSearch, Clock, ChevronDown,
  CheckCircle2, XCircle, Ban, StickyNote, CalendarClock, User as UserIcon,
  Inbox, ListFilter, ShieldCheck, ShieldQuestion, ArrowUpRight, ArrowDownLeft, History,
  Radar, Loader2, Link2,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useClient } from '../lib/clientContext'
import { PageTitle } from '../components/Typography'
import EmptyState from '../components/EmptyState'
import Skeleton from '../components/Skeleton'
import type {
  Prospect, ProspectStage, ProspectPatch, Touch, TouchChannel, TouchDirection, TouchLogInput,
  ContactCandidate, ContactCandidateKind,
} from '../types'

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
const logTouch = (input: TouchLogInput) =>
  authedPost<{ touch?: Touch; prospect?: Prospect; error?: string }>('prospects-admin', { action: 'touch', ...input })
const promoteCandidate = (candidate_id: number) =>
  authedPost<{ prospect?: Prospect; candidate?: ContactCandidate; warning?: string; error?: string }>(
    'prospects-admin', { action: 'promote', candidate_id },
  )
const resolveRoutes = (prospect_id: number) =>
  authedPost<{ results?: { pages_fetched: number; candidates: unknown[]; errors: string[] }[]; error?: string }>(
    'resolve-contact-routes', { prospect_id },
  )

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

// Stage changes are now a pure `update` patch of `stage` alone.
// last_contacted_at/replied_at are stamped server-side by logging a `touch`
// (see logTouch / TouchQuickLog below) — never by patching them directly, per
// the contract's own instruction that those two fields must always be
// derived from real touch history, not guessed at from a stage click.

// ── Channel strength ─────────────────────────────────────────────────────────
// How reachable a prospect actually is, independent of how strong the audit
// evidence is. A verified individual profile is a much better target than a
// role mailbox nobody reads personally — this feeds the queue as a tiebreak,
// it never overrides evidence strength (see queueSort below).
function channelStrength(p: Prospect): number {
  let score = 0
  if (p.contact_email) score += p.contact_email_kind === 'individual' ? 3 : 1
  if (p.linkedin_url) score += p.linkedin_verified ? 3 : 1
  if (p.x_url) score += p.x_verified ? 2 : 1
  return score
}

function hasChannel(p: Prospect, channel: TouchChannel): boolean {
  if (channel === 'email') return !!p.contact_email
  if (channel === 'linkedin') return !!p.linkedin_url
  return !!p.x_url
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
// strength (unchanged, still the dominant signal — a strong finding on a
// hard-to-reach prospect still beats a weak one that's easy to reach), then
// channel strength as an extension: among equally strong evidence, a
// verified individual profile or a real person's inbox is worth working
// before a role mailbox or an unresearched prospect, then most-recently-
// audited as the final tiebreaker so nothing goes stale at the bottom of a
// tie.
function queueSort(now: number) {
  return (a: Prospect, b: Prospect): number => {
    const overdueA = isOverdue(a, now), overdueB = isOverdue(b, now)
    if (overdueA !== overdueB) return overdueA ? -1 : 1
    const strengthDiff = evidenceStrength(b) - evidenceStrength(a)
    if (strengthDiff !== 0) return strengthDiff
    const channelDiff = channelStrength(b) - channelStrength(a)
    if (channelDiff !== 0) return channelDiff
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

// A confirmed profile and an unconfirmed one must never look the same, and an
// unconfirmed one must never look like a failed one — false means "never
// researched" or "checked and could not be confirmed" (LinkedIn 999s every
// automated client), never "known bad". Verified = emerald + a filled shield.
// Unconfirmed = the same neutral slate this page already uses for the 'new'
// and 'lost' stage badges, with a question-mark shield, never red.
function VerifiedBadge({ verified, unconfirmedTitle }: { verified: boolean; unconfirmedTitle: string }) {
  if (verified) {
    return (
      <span
        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 shrink-0"
        title="Confirmed reachable at this URL."
      >
        <ShieldCheck size={10} /> Verified
      </span>
    )
  }
  return (
    <span
      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-dark-700 text-slate-500 border border-dark-600 shrink-0"
      title={unconfirmedTitle}
    >
      <ShieldQuestion size={10} /> Unconfirmed
    </span>
  )
}

// One chip per channel, either a working link (with its own trust signal) or
// an honest absence — never a guess, never silently missing.
function ChannelChips({ p }: { p: Prospect }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-2">
      {/* Email — kind is the load-bearing signal here: an info@ reaches a
          queue, a named person's address reaches a person. */}
      <div className="flex items-center gap-1.5 min-w-0">
        {p.contact_email ? (
          <>
            <a
              href={`mailto:${p.contact_email}`}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-300 hover:text-brand-300 transition-colors truncate max-w-[220px]"
              title={p.contact_email_source ? `Found at ${p.contact_email_source}` : undefined}
            >
              <Mail size={12} className="shrink-0" /> <span className="truncate">{p.contact_email}</span>
            </a>
            {p.contact_email_kind === 'role' && (
              <span
                className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-amber-500/10 text-amber-300 border border-amber-500/30 shrink-0"
                title="Reaches a shared inbox, not one named person."
              >
                Role inbox
              </span>
            )}
            {p.contact_email_kind === 'individual' && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-dark-700 text-slate-400 border border-dark-600 shrink-0">
                Individual
              </span>
            )}
          </>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-xs text-slate-600">
            <Mail size={12} /> No email found
          </span>
        )}
      </div>

      {/* LinkedIn */}
      <div className="flex items-center gap-1.5 min-w-0">
        {p.linkedin_url ? (
          <>
            <a
              href={p.linkedin_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-300 hover:text-brand-300 transition-colors"
            >
              <Linkedin size={12} className="shrink-0" /> LinkedIn
            </a>
            <VerifiedBadge
              verified={p.linkedin_verified}
              unconfirmedTitle="LinkedIn blocks automated verification (HTTP 999): this profile has not been confirmed as this person. Check it before using it."
            />
          </>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-xs text-slate-600">
            <Linkedin size={12} /> No LinkedIn found
          </span>
        )}
      </div>

      {/* X */}
      <div className="flex items-center gap-1.5 min-w-0">
        {p.x_url ? (
          <>
            <a
              href={p.x_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-300 hover:text-brand-300 transition-colors"
            >
              <Twitter size={12} className="shrink-0" /> X
            </a>
            <VerifiedBadge
              verified={p.x_verified}
              unconfirmedTitle="This profile has not been confirmed as this person. Check it before using it."
            />
          </>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-xs text-slate-600">
            <Twitter size={12} /> No X found
          </span>
        )}
      </div>
    </div>
  )
}

const CHANNEL_META: Record<TouchChannel, { label: string; icon: typeof Mail }> = {
  email:    { label: 'Email',    icon: Mail },
  linkedin: { label: 'LinkedIn', icon: Linkedin },
  x:        { label: 'X',        icon: Twitter },
}

// Quick-log: tapping a channel icon logs an OUT touch to that channel
// immediately — one tap, because this is meant to happen on a phone right
// after sending something. Logging an inbound reply, or adding a subject/
// note/backdated time, is one chevron-tap away behind the same control
// rather than a separate page or modal.
function TouchQuickLog({
  p, onLog,
}: {
  p: Prospect
  onLog: (input: TouchLogInput) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [channel, setChannel] = useState<TouchChannel>('email')
  const [direction, setDirection] = useState<TouchDirection>('out')
  const [subject, setSubject] = useState('')
  const [note, setNote] = useState('')

  const availableChannels = (['email', 'linkedin', 'x'] as TouchChannel[]).filter(c => hasChannel(p, c))
  const channelsToOffer = availableChannels.length > 0 ? availableChannels : (['email', 'linkedin', 'x'] as TouchChannel[])

  const quickLog = (c: TouchChannel) => onLog({ prospect_id: p.id, channel: c, direction: 'out' })

  const submitDetailed = () => {
    onLog({
      prospect_id: p.id,
      channel,
      direction,
      subject: subject.trim() || undefined,
      note: note.trim() || undefined,
    })
    setSubject('')
    setNote('')
    setExpanded(false)
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-[11px] text-slate-500 mr-0.5">Log touch:</span>
        {channelsToOffer.map(c => {
          const meta = CHANNEL_META[c]
          const Icon = meta.icon
          return (
            <button
              key={c}
              onClick={() => quickLog(c)}
              title={`Log a ${meta.label.toLowerCase()} you just sent`}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-dark-700/60 text-slate-300 border border-dark-600 hover:text-brand-300 hover:border-brand-500/40 transition-colors"
            >
              <Icon size={12} /> {meta.label}
            </button>
          )
        })}
        <button
          onClick={() => setExpanded(v => !v)}
          className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 transition-colors px-1.5 py-1.5"
          aria-expanded={expanded}
          title="Log a reply, backdate a touch, or add a subject/note"
        >
          More <ChevronDown size={12} className={`transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {expanded && (
        <div className="grid gap-2 sm:grid-cols-2 bg-dark-900/40 border border-dark-700 rounded-lg p-3">
          <div>
            <label className="text-[10px] uppercase tracking-wide text-slate-500 mb-1 block">Channel</label>
            <select
              value={channel}
              onChange={e => setChannel(e.target.value as TouchChannel)}
              className="w-full bg-dark-700 border border-dark-600 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-brand-500/50"
            >
              {(['email', 'linkedin', 'x'] as TouchChannel[]).map(c => (
                <option key={c} value={c}>{CHANNEL_META[c].label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-wide text-slate-500 mb-1 block">Direction</label>
            <div className="inline-flex rounded-lg border border-dark-600 p-0.5 bg-dark-700 w-full">
              <button
                onClick={() => setDirection('out')}
                className={`flex-1 inline-flex items-center justify-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-colors ${direction === 'out' ? 'bg-brand-500 text-white' : 'text-slate-400 hover:text-slate-200'}`}
              >
                <ArrowUpRight size={11} /> Sent
              </button>
              <button
                onClick={() => setDirection('in')}
                className={`flex-1 inline-flex items-center justify-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-colors ${direction === 'in' ? 'bg-brand-500 text-white' : 'text-slate-400 hover:text-slate-200'}`}
              >
                <ArrowDownLeft size={11} /> Received
              </button>
            </div>
          </div>
          <div className="sm:col-span-2">
            <label className="text-[10px] uppercase tracking-wide text-slate-500 mb-1 block">Subject (optional)</label>
            <input
              type="text"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder="What it was about"
              className="w-full bg-dark-700 border border-dark-600 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-brand-500/50"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="text-[10px] uppercase tracking-wide text-slate-500 mb-1 block">Note (optional)</label>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              rows={2}
              placeholder="Anything worth remembering about this touch"
              className="w-full bg-dark-700 border border-dark-600 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-brand-500/50 resize-y"
            />
          </div>
          <div className="sm:col-span-2">
            <button
              onClick={submitDetailed}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-brand-500 text-white hover:bg-brand-400 transition-colors"
            >
              Log touch
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// Newest first, channel + direction + when, plus subject/note if logged. This
// is what stops the same prospect being contacted twice on two channels —
// the history has to be visible right where the next action gets decided,
// not buried behind a separate tab.
function TouchHistory({ touches }: { touches: Touch[] }) {
  if (touches.length === 0) {
    return (
      <p className="text-xs text-slate-600">
        No touches logged yet. That's expected for most prospects on day one: this fills in the moment the first email, LinkedIn message or X message goes out.
      </p>
    )
  }
  return (
    <ul className="space-y-1.5">
      {touches.map(t => {
        const meta = CHANNEL_META[t.channel]
        const Icon = meta.icon
        const DirIcon = t.direction === 'out' ? ArrowUpRight : ArrowDownLeft
        return (
          <li key={t.id} className="flex items-start gap-2 text-xs">
            <span className="inline-flex items-center gap-1 text-slate-400 shrink-0 mt-0.5">
              <Icon size={12} />
              <DirIcon size={11} className={t.direction === 'out' ? 'text-sky-400' : 'text-brand-300'} />
            </span>
            <span className="text-slate-300 shrink-0">
              {meta.label} {t.direction === 'out' ? 'sent' : 'received'}
            </span>
            <span className="text-slate-600 shrink-0">· {timeAgo(t.occurred_at)}</span>
            {(t.subject || t.note) && (
              <span className="text-slate-500 truncate">· {t.subject || t.note}</span>
            )}
          </li>
        )
      })}
    </ul>
  )
}

// ── Contact route candidates ────────────────────────────────────────────────
// What the resolver found, staged and waiting for a human to pick one. This
// block is the whole reason the resolver is allowed to be cautious: it can
// surface four plausible addresses and let the one person who knows the
// account decide, instead of guessing one and writing it as fact.

const CANDIDATE_META: Record<ContactCandidateKind, { label: string; icon: typeof Mail }> = {
  email:    { label: 'Email',    icon: Mail },
  linkedin: { label: 'LinkedIn', icon: Linkedin },
  x:        { label: 'X',        icon: Twitter },
}

// The value currently live on the prospect row for this kind, so the list can
// mark which candidate is in use. Derived rather than read off the
// `promoted` flag, which records that a candidate was promoted at some point
// and would go stale the moment a second one replaced it.
function liveValueFor(p: Prospect, kind: ContactCandidateKind): string | null {
  if (kind === 'email') return p.contact_email
  if (kind === 'linkedin') return p.linkedin_url
  return p.x_url
}

// Confidence describes how well SOURCED a string is, never whether it belongs
// to the right person, so the tones stay informational: no green tick on
// "high" and no red on "low". A low-confidence candidate is usually a real
// address that belongs to somebody else (a testimonial, a customer logo), and
// that is worth reading rather than hiding.
const CONFIDENCE_TONE: Record<ContactCandidate['confidence'], { className: string; title: string }> = {
  high: {
    className: 'bg-dark-700 text-slate-300 border-dark-600',
    title: 'Published in a contact context on a page this company owns.',
  },
  medium: {
    className: 'bg-dark-700 text-slate-400 border-dark-600',
    title: 'Found on a page this company owns, outside an obvious contact context.',
  },
  low: {
    className: 'bg-dark-700 text-slate-500 border-dark-600 border-dashed',
    title: 'Weakly sourced. Often a real address belonging to a different company, picked up from a testimonial or a customer logo. Open the source before using it.',
  },
}

function CandidateRow({
  c, isLive, willReplace, onPromote,
}: {
  c: ContactCandidate
  isLive: boolean
  willReplace: boolean
  onPromote: (id: number) => void
}) {
  const meta = CANDIDATE_META[c.kind]
  const Icon = meta.icon
  const tone = CONFIDENCE_TONE[c.confidence]
  return (
    <li className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs py-1">
      <Icon size={12} className="text-slate-500 shrink-0" />
      <span className="text-slate-200 font-medium truncate max-w-[260px]" title={c.value}>{c.value}</span>
      <span className={`inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-medium border shrink-0 ${tone.className}`} title={tone.title}>
        {c.confidence}
      </span>
      {c.email_kind === 'role' && (
        <span
          className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-amber-500/10 text-amber-300 border border-amber-500/30 shrink-0"
          title="Reaches a shared inbox, not one named person."
        >
          Role inbox
        </span>
      )}
      {c.email_kind === 'individual' && (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-dark-700 text-slate-400 border border-dark-600 shrink-0">
          Individual
        </span>
      )}
      <a
        href={c.source_url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-brand-300 transition-colors shrink-0"
        title={`Seen at ${c.source_url}`}
      >
        <Link2 size={10} /> source
      </a>
      <span className="ml-auto shrink-0">
        {isLive ? (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold bg-brand-500/10 text-brand-300 border border-brand-500/30">
            <CheckCircle2 size={11} /> In use
          </span>
        ) : (
          <button
            onClick={() => onPromote(c.id)}
            title={willReplace
              ? 'Replaces the route currently on this prospect. The old one stays in this list.'
              : 'Puts this on the prospect record. It does not mark the profile as verified.'}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium bg-dark-700/60 text-slate-300 border border-dark-600 hover:text-brand-300 hover:border-brand-500/40 transition-colors"
          >
            {willReplace ? 'Replace' : 'Use this'}
          </button>
        )}
      </span>
    </li>
  )
}

const CANDIDATES_COLLAPSED = 4

function ContactCandidates({
  p, resolving, onResolve, onPromote,
}: {
  p: Prospect
  resolving: boolean
  onResolve: (id: number) => void
  onPromote: (id: number) => void
}) {
  const [showAll, setShowAll] = useState(false)
  const candidates = p.candidates
  const hasAnyRoute = !!(p.contact_email || p.linkedin_url || p.x_url)
  const visible = showAll ? candidates : candidates.slice(0, CANDIDATES_COLLAPSED)

  return (
    <div className="mt-3">
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => onResolve(p.id)}
          disabled={resolving}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-dark-700/60 text-slate-300 border border-dark-600 hover:text-brand-300 hover:border-brand-500/40 transition-colors disabled:opacity-60 disabled:cursor-wait"
          title="Reads this company's own pages and looks for a published address or profile. It never guesses one from a name pattern."
        >
          {resolving
            ? <><Loader2 size={12} className="animate-spin" /> Reading their site…</>
            : <><Radar size={12} /> {candidates.length > 0 ? 'Look again' : 'Find contact routes'}</>}
        </button>
        {candidates.length > 0 && (
          <span className="text-[11px] text-slate-500">
            {candidates.length} found{hasAnyRoute ? '' : ', none chosen yet'}
          </span>
        )}
      </div>

      {candidates.length > 0 && (
        <div className="mt-2 bg-dark-900/40 border border-dark-700 rounded-lg px-3 py-2">
          <ul className="divide-y divide-dark-700/60">
            {visible.map(c => (
              <CandidateRow
                key={c.id}
                c={c}
                isLive={liveValueFor(p, c.kind) === c.value}
                willReplace={!!liveValueFor(p, c.kind) && liveValueFor(p, c.kind) !== c.value}
                onPromote={onPromote}
              />
            ))}
          </ul>
          {candidates.length > CANDIDATES_COLLAPSED && (
            <button
              onClick={() => setShowAll(v => !v)}
              className="text-[11px] text-slate-500 hover:text-slate-300 transition-colors mt-1"
            >
              {showAll ? 'Show fewer' : `Show all ${candidates.length}`}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ── Row ───────────────────────────────────────────────────────────────────
function ProspectRow({
  p, now, resolving, onPatch, onLogTouch, onResolve, onPromote,
}: {
  p: Prospect
  now: number
  resolving: boolean
  onPatch: (id: number, patch: ProspectPatch) => void
  onLogTouch: (input: TouchLogInput) => void
  onResolve: (id: number) => void
  onPromote: (candidateId: number) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [notesDraft, setNotesDraft] = useState(p.notes ?? '')
  const [replyDraft, setReplyDraft] = useState(p.reply_note ?? '')
  const [ownerDraft, setOwnerDraft] = useState(p.owner ?? '')
  const overdue = isOverdue(p, now)
  const next = NEXT_STEP[p.stage]

  // Stage changes are a pure stage patch now — logging a touch (below) is
  // what stamps last_contacted_at/replied_at, server-side, from real history.
  const changeStage = (to: ProspectStage) => {
    onPatch(p.id, { stage: to })
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

      {/* The report + a generic contact page, if BrandGEO has one — the three
          real contact channels (email/LinkedIn/X) get their own row below
          with trust signals, so they don't belong in this plain link row. */}
      <div className="flex flex-wrap items-center gap-2 mt-3">
        {p.audit_token && <LinkChip href={reportUrl(p.audit_token)} icon={FileSearch} label="View report" />}
        {p.contact_url && <LinkChip href={p.contact_url} icon={Globe} label="Contact page" />}
        {p.segment && (
          <span className="text-[11px] text-slate-500 px-2 py-1">{p.segment}{p.tier ? ` · ${p.tier}` : ''}</span>
        )}
      </div>

      <ChannelChips p={p} />

      <ContactCandidates p={p} resolving={resolving} onResolve={onResolve} onPromote={onPromote} />

      <div className="mt-3">
        <TouchQuickLog p={p} onLog={onLogTouch} />
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
          <StickyNote size={12} /> Notes, next action & history{p.touches.length > 0 ? ` (${p.touches.length})` : ''}
          <ChevronDown size={12} className={`transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {expanded && (
        <div className="mt-3 pt-3 border-t border-dark-700 grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="text-[10px] uppercase tracking-wide text-slate-500 mb-1 flex items-center gap-1">
              <History size={11} /> Touch history
            </label>
            <TouchHistory touches={p.touches} />
          </div>
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
  // Kept separate from errorMsg on purpose. "This site publishes no address"
  // is the expected answer for most companies, not a failure, and colouring
  // it like one would train the reader to distrust a correct result.
  const [noticeMsg, setNoticeMsg] = useState<string | null>(null)

  // Which prospects have a resolver run in flight. A Set rather than a single
  // id because reading one company's site takes seconds and there is no
  // reason to make the next one wait.
  const [resolving, setResolving] = useState<Set<number>>(new Set())

  const [view, setView] = useState<View>('queue')
  const [stageFilter, setStageFilter] = useState<ProspectStage | 'all'>('all')
  const [segmentFilter, setSegmentFilter] = useState<string>('all')
  // 'none' is the one that matters on day one: measured 2026-08-16, all 43
  // prospects at stage='new' had zero contact routes, so "who can I not even
  // reach yet" is the actual work queue for the resolver.
  const [channelFilter, setChannelFilter] = useState<TouchChannel | 'all' | 'none'>('all')
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
      // Defensive: the contract guarantees `touches` and `candidates` on
      // every list row, but empty arrays are the honest default rather than
      // trusting that blindly. `candidates` in particular is absent from any
      // prospects-admin.js build predating packet 019, so this is what keeps
      // the page working against an older deploy instead of crashing on
      // p.candidates.length.
      setProspects((data?.prospects ?? []).map(p => ({ ...p, touches: p.touches ?? [], candidates: p.candidates ?? [] })))
      setLoading(false)
    })
    return () => { cancelled = true }
  }, [isAdmin])

  // Full re-list. Used after a resolver run, because resolve-contact-routes.js
  // returns pre-insert candidate shapes with no database id and a candidate
  // without an id cannot be promoted. One extra round trip on a table of tens
  // of rows, in exchange for never rendering a Use-this button that would 404.
  const refresh = () =>
    listProspects().then(({ status, data }) => {
      if (status === 404 && !data) { setUnavailable(true); return }
      if (data?.error || !data?.prospects) return
      setProspects(data.prospects.map(p => ({ ...p, touches: p.touches ?? [], candidates: p.candidates ?? [] })))
    })

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
      // prospects-admin.js now nests `touches` and `candidates` on every
      // action's response, but this page still merges rather than replaces:
      // it has to keep working against a deploy that predates that, and a
      // merge costs nothing when the keys are present.
      setProspects(prev => prev.map(p => (p.id === id ? {
        ...data.prospect!,
        touches: data.prospect!.touches ?? previous.touches,
        candidates: data.prospect!.candidates ?? previous.candidates,
      } : p)))
    })
  }

  // Logging a touch is its own call, not a patch: `touch` sets
  // last_contacted_at/replied_at server-side and is the only correct way to
  // do that now (see the contract note at the top of this file). Optimistic
  // here too, same reasoning as onPatch, and same merge caveat — the
  // returned `prospect` carries no `touches` key, so the new touch is
  // prepended locally instead of trusting a response key that doesn't exist.
  const onLogTouch = (input: TouchLogInput) => {
    const previous = prospects.find(p => p.id === input.prospect_id)
    if (!previous) return
    const optimisticNow = new Date().toISOString()
    setProspects(prev => prev.map(p => (p.id === input.prospect_id ? {
      ...p,
      last_contacted_at: input.direction === 'out' ? optimisticNow : p.last_contacted_at,
      replied_at: input.direction === 'in' ? optimisticNow : p.replied_at,
    } : p)))
    logTouch(input).then(({ status, data }) => {
      if (status === 404 && !data) { setUnavailable(true); return }
      if (data?.error || !data?.touch || !data?.prospect) {
        setErrorMsg(data?.error || 'Could not log that touch. Reverted.')
        setProspects(prev => prev.map(p => (p.id === input.prospect_id ? previous : p)))
        return
      }
      const touch = data.touch
      const prospect = data.prospect
      setProspects(prev => prev.map(p => (p.id === input.prospect_id
        ? { ...prospect, touches: [touch, ...p.touches], candidates: prospect.candidates ?? p.candidates }
        : p)))
    })
  }

  // Reads the prospect's own pages looking for a published address or
  // profile. Never guesses one from a name pattern, never queries a lead
  // database. See resolve-contact-routes.js's header for the constraints it
  // holds itself to. Nothing it finds reaches the prospect row until someone
  // clicks Use this below.
  const onResolve = (id: number) => {
    setResolving(prev => new Set(prev).add(id))
    const done = () => setResolving(prev => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
    resolveRoutes(id).then(({ status, data }) => {
      if (status === 404 && !data) {
        setErrorMsg('The contact route resolver is not deployed yet (resolve-contact-routes.js). Everything else on this page still works.')
        done()
        return
      }
      if (data?.error || !data?.results) {
        setErrorMsg(data?.error || 'Could not read that site for contact routes.')
        done()
        return
      }
      const result = data.results[0]
      const found = result?.candidates?.length ?? 0
      const pages = result?.pages_fetched ?? 0
      const pageWord = pages === 1 ? 'page' : 'pages'
      // The resolver reports what it could not do in `errors`: pages it could
      // not read, a Play search it skipped, and above all a crawl cut short by
      // its time budget. Until 2026-09-03 the banner never read them, so a
      // truncated crawl printed "found nothing published", the one conclusion
      // a truncated crawl cannot support.
      const errors = result?.errors ?? []
      if (errors.length > 0) console.warn('[Prospects] resolver reported:', errors)
      const fatal = errors.find(e => e.startsWith('resolver crashed') || e === 'unparseable domain')
      if (fatal) {
        setErrorMsg(`The resolver could not run for this prospect (${fatal}). Nothing was written.`)
        done()
        return
      }
      const cutShort = errors.some(e => e.includes('time budget'))
      const unread = errors.filter(e => !e.includes('time budget')).length
      // Most companies publish no individual address at all, so an empty
      // result is the honest answer and not a reason to start guessing. Say
      // so in the neutral banner rather than the error one, unless the crawl
      // was cut short, in which case say that instead of "nothing published".
      let msg: string
      if (found === 0) {
        msg = cutShort
          ? `Read ${pages} ${pageWord} before the time budget ran out and found nothing yet. That is not a "publishes nothing" result. Run it again to finish.`
          : `Read ${pages} ${pageWord} and found nothing published. No address was guessed.`
      } else {
        msg = `Found ${found} contact ${found === 1 ? 'route' : 'routes'} across ${pages} ${pageWord}. Pick one below.`
        if (cutShort) msg += ' The crawl was cut short by its time budget, so there may be more. Run it again to finish.'
      }
      if (unread > 0) msg += ` ${unread} ${unread === 1 ? 'page' : 'pages'} could not be read (listed in the browser console).`
      setNoticeMsg(msg)
      refresh().finally(done)
    })
  }

  // Puts one staged candidate onto the prospect row. Not optimistic: unlike a
  // stage change, this is the value a real message will be addressed to, so
  // it should read as saved only once the server says it is.
  const onPromote = (candidateId: number) => {
    promoteCandidate(candidateId).then(({ status, data }) => {
      if (status === 404 && !data) { setUnavailable(true); return }
      if (data?.error || !data?.prospect) {
        setErrorMsg(data?.error || 'Could not save that contact route.')
        return
      }
      const prospect = data.prospect
      setNoticeMsg(data.warning ?? null)
      setProspects(prev => prev.map(p => (p.id === prospect.id ? {
        ...prospect,
        touches: prospect.touches ?? p.touches,
        candidates: prospect.candidates ?? p.candidates,
      } : p)))
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
    if (channelFilter === 'none') {
      rows = rows.filter(p => !p.contact_email && !p.linkedin_url && !p.x_url)
    } else if (channelFilter !== 'all') {
      rows = rows.filter(p => hasChannel(p, channelFilter))
    }
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
  }, [prospects, segmentFilter, channelFilter, search, view, stageFilter, now])

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
      {noticeMsg && (
        <p className="text-xs text-slate-300 bg-dark-800 border border-dark-600 rounded-lg px-3 py-2 mb-6 flex items-start gap-2">
          <Radar size={13} className="text-slate-500 shrink-0 mt-0.5" />
          <span>{noticeMsg}</span>
          <button
            onClick={() => setNoticeMsg(null)}
            className="ml-auto text-slate-600 hover:text-slate-400 transition-colors shrink-0"
            aria-label="Dismiss"
          >
            <XCircle size={13} />
          </button>
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

        {/* Work one channel in a sitting: every email in a row, then every
            LinkedIn, rather than switching context per prospect. */}
        <select
          value={channelFilter}
          onChange={e => setChannelFilter(e.target.value as TouchChannel | 'all' | 'none')}
          className="bg-dark-800 border border-dark-600 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-brand-500/50"
          aria-label="Filter by channel"
        >
          <option value="all">All channels</option>
          <option value="email">Has email</option>
          <option value="linkedin">Has LinkedIn</option>
          <option value="x">Has X</option>
          <option value="none">No way to reach them</option>
        </select>

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
            <ProspectRow
              key={p.id}
              p={p}
              now={now}
              resolving={resolving.has(p.id)}
              onPatch={onPatch}
              onLogTouch={onLogTouch}
              onResolve={onResolve}
              onPromote={onPromote}
            />
          ))}
        </div>
      )}
    </div>
  )
}
