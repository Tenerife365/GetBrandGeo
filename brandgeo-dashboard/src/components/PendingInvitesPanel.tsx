/**
 * PendingInvitesPanel: admin list of invited accounts that have not accepted yet,
 * with a per-row "Resend invite". Mounted on the Onboard page, below the wizard.
 *
 * Two pieces in one file so the list can be mounted in a test harness without a
 * network: PendingInvitesList is presentational (no fetch, no supabase), and the
 * default export is the container that loads, holds per-row state and resends.
 *
 * Endpoint contract (fixed, shared with the backend): POST
 * /.netlify/functions/resend-invite with { action: 'list' } or
 * { action: 'resend', user_id, client_id }. There is deliberately no free-text
 * email field here: a resend always targets a row the server listed.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { supabase, isDemoMode } from '../lib/supabase'
import {
  Badge, Button, Card, Notice, SectionHeader, SkeletonTable, tableClasses,
} from './ui'

// ── Types (contract shapes) ────────────────────────────────────────────────

export type InviteStatus = 'pending' | 'accepted' | 'not_invited' | 'missing_user'

export interface InviteRow {
  user_id: string
  client_id: number
  client_name: string
  plan: string
  category: 'active' | 'research' | null
  email: string | null
  role: string
  first_invited_at: string | null
  /** When the LAST invite email was sent. */
  invited_at: string | null
  accepted: boolean
  accepted_at: string | null
  status: InviteStatus
}

export interface InviteCounts {
  total: number
  pending: number
  accepted: number
}

export interface InviteListResponse {
  invites: InviteRow[]
  counts: InviteCounts
  link_ttl_minutes: number
}

export interface ResendResponse {
  ok: true
  user_id: string
  client_id: number
  email: string
  invited_at: string
  audit_logged: boolean
}

export type InviteErrorCode =
  | 'bad_request' | 'not_found' | 'already_accepted' | 'not_invited'
  | 'ambiguous' | 'rate_limited' | 'invite_failed' | 'read_failed'

export type LoadState = 'loading' | 'ready' | 'error'

export interface RowActionState {
  busy: boolean
  /** True for 60 seconds after a successful send. */
  locked: boolean
  message: string | null
  error: string | null
}

const IDLE_ROW: RowActionState = { busy: false, locked: false, message: null, error: null }

const FALLBACK_TTL_MINUTES = 60
const SENT_LOCK_MS = 60_000

// ── Pure helpers ───────────────────────────────────────────────────────────

function plural(n: number, unit: string): string {
  return `${n} ${unit}${n === 1 ? '' : 's'}`
}

/** "just now", "3 hours ago", "2 days ago". Empty string for an unparseable date. */
export function formatAge(iso: string | null, now: number = Date.now()): string {
  if (!iso) return ''
  const t = Date.parse(iso)
  if (Number.isNaN(t)) return ''
  const minutes = Math.floor(Math.max(0, now - t) / 60_000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${plural(minutes, 'minute')} ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${plural(hours, 'hour')} ago`
  return `${plural(Math.floor(hours / 24), 'day')} ago`
}

export function formatAbsolute(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}

export type LinkState = 'expired' | 'valid' | 'unknown'

export function linkState(invitedAt: string | null, ttlMinutes: number, now: number = Date.now()): LinkState {
  if (!invitedAt) return 'unknown'
  const t = Date.parse(invitedAt)
  if (Number.isNaN(t)) return 'unknown'
  return now - t > ttlMinutes * 60_000 ? 'expired' : 'valid'
}

function firstInvitedDiffers(row: InviteRow): boolean {
  if (!row.first_invited_at || !row.invited_at) return false
  const a = Date.parse(row.first_invited_at)
  const b = Date.parse(row.invited_at)
  if (Number.isNaN(a) || Number.isNaN(b)) return false
  return Math.abs(b - a) > 60_000
}

// ── Presentational list ────────────────────────────────────────────────────

export interface PendingInvitesListProps {
  rows: InviteRow[]
  counts: InviteCounts | null
  linkTtlMinutes: number
  loadState: LoadState
  /** True while a reload runs on top of data already shown. */
  refreshing?: boolean
  /** Per-row action state keyed by user_id. Missing key means idle. */
  rowStates: Record<string, RowActionState>
  /** Panel-level sentence (for example after an already_accepted answer). */
  notice?: string | null
  onResend: (row: InviteRow) => void
  onReload: () => void
}

function LinkBadge({ row, ttl }: { row: InviteRow; ttl: number }) {
  const state = linkState(row.invited_at, ttl)
  if (state === 'expired') return <Badge tone="warn">Link expired</Badge>
  if (state === 'valid') return <Badge tone="neutral">Link valid</Badge>
  return <Badge tone="neutral">Link state unknown</Badge>
}

function CompanyCell({ row }: { row: InviteRow }) {
  return (
    <div className="flex flex-wrap items-center gap-2 min-w-0">
      <span className="text-ink font-medium break-words">{row.client_name}</span>
      <Badge tone="accent">{row.plan}</Badge>
      {row.category === 'research' && <Badge tone="neutral"><span className="text-ink-2">research</span></Badge>}
    </div>
  )
}

function SentCell({ row }: { row: InviteRow }) {
  const abs = formatAbsolute(row.invited_at)
  const age = formatAge(row.invited_at)
  return (
    <div className="min-w-0">
      <div className="text-body text-ink">{abs || 'Not recorded'}</div>
      {age && <div className="text-meta text-ink-2">{age}</div>}
      {firstInvitedDiffers(row) && (
        <div className="text-meta text-ink-2">First invited {formatAbsolute(row.first_invited_at)}</div>
      )}
    </div>
  )
}

function ResendControl({
  row, state, onResend, full,
}: { row: InviteRow; state: RowActionState; onResend: (row: InviteRow) => void; full?: boolean }) {
  return (
    <div className={full ? 'w-full' : undefined}>
      <Button
        variant="secondary"
        size="sm"
        loading={state.busy}
        disabled={state.locked}
        onClick={() => onResend(row)}
        aria-label={`Resend invite to ${row.client_name}`}
        className={full ? 'w-full max-md:min-h-[44px]' : undefined}
      >
        {state.locked ? 'Sent' : 'Resend invite'}
      </Button>
      <div aria-live="polite" className="mt-1.5 text-meta">
        {state.message && <p className="text-pos-ink break-words">{state.message}</p>}
        {state.error && <p className="text-neg break-words">{state.error}</p>}
      </div>
    </div>
  )
}

export function PendingInvitesList({
  rows, counts, linkTtlMinutes, loadState, refreshing = false, rowStates, notice, onResend, onReload,
}: PendingInvitesListProps) {
  const pending = rows.filter(r => r.status === 'pending')
  const summary = counts
    ? `${counts.pending} not accepted yet, ${counts.accepted} accepted.`
    : undefined

  return (
    <Card pad="feature">
      <SectionHeader
        title="Pending invites"
        description={summary}
        actions={
          <Button
            variant="ghost"
            size="sm"
            icon={RefreshCw}
            loading={refreshing}
            disabled={loadState === 'loading'}
            onClick={onReload}
            aria-label="Refresh pending invites"
          >
            Refresh
          </Button>
        }
      />

      {notice && <p role="status" className="mb-3 text-meta text-ink-2">{notice}</p>}

      {loadState === 'loading' && (
        <div role="status" aria-live="polite">
          <span className="sr-only">Loading invites</span>
          <SkeletonTable rows={3} cols={4} />
        </div>
      )}

      {loadState === 'error' && (
        <Notice
          tone="neg"
          title="Could not load invites."
          action={<Button variant="secondary" size="sm" onClick={onReload}>Retry</Button>}
        />
      )}

      {loadState === 'ready' && pending.length === 0 && (
        <p className="text-body text-ink-2">No pending invites. Everyone you invited has accepted.</p>
      )}

      {loadState === 'ready' && pending.length > 0 && (
        <>
          {/* Desktop table */}
          <div className={`hidden md:block ${tableClasses.wrap}`}>
            <table className={tableClasses.table} aria-label="Pending invites">
              <thead className={tableClasses.thead}>
                <tr>
                  <th scope="col" className={tableClasses.th}>Company</th>
                  <th scope="col" className={tableClasses.th}>Email</th>
                  <th scope="col" className={tableClasses.th}>Invite sent</th>
                  <th scope="col" className={tableClasses.th}>Link</th>
                  <th scope="col" className={tableClasses.th}>Action</th>
                </tr>
              </thead>
              <tbody>
                {pending.map(row => (
                  <tr key={row.user_id} className={tableClasses.tr}>
                    <td className="px-4 py-3 align-top"><CompanyCell row={row} /></td>
                    <td className="px-4 py-3 align-top text-body text-ink break-all">{row.email ?? 'No email'}</td>
                    <td className="px-4 py-3 align-top"><SentCell row={row} /></td>
                    <td className="px-4 py-3 align-top"><LinkBadge row={row} ttl={linkTtlMinutes} /></td>
                    <td className="px-4 py-3 align-top">
                      <ResendControl row={row} state={rowStates[row.user_id] ?? IDLE_ROW} onResend={onResend} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Phone: stacked cards */}
          <ul className="md:hidden space-y-3" aria-label="Pending invites">
            {pending.map(row => (
              <li key={row.user_id} className="rounded-card border border-line bg-surface-2 p-4 space-y-3">
                <CompanyCell row={row} />
                <div className="text-body text-ink break-all">{row.email ?? 'No email'}</div>
                <SentCell row={row} />
                <div><LinkBadge row={row} ttl={linkTtlMinutes} /></div>
                <ResendControl row={row} state={rowStates[row.user_id] ?? IDLE_ROW} onResend={onResend} full />
              </li>
            ))}
          </ul>
        </>
      )}
    </Card>
  )
}

// ── Container ──────────────────────────────────────────────────────────────

interface PostResult {
  ok: boolean
  status: number
  /** Parsed JSON body, or null when the body was not JSON. */
  data: Record<string, unknown> | null
}

async function postInvites(body: Record<string, unknown>): Promise<PostResult> {
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token ?? ''
  const res = await fetch('/.netlify/functions/resend-invite', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  })
  let data: Record<string, unknown> | null = null
  try {
    const parsed: unknown = JSON.parse(await res.text())
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) data = parsed as Record<string, unknown>
  } catch {
    data = null
  }
  return { ok: res.ok, status: res.status, data }
}

function errorSentence(r: PostResult): string {
  const msg = r.data && typeof r.data.error === 'string' ? r.data.error : ''
  return msg || 'Could not send the invite. Please try again.'
}

function errorCode(r: PostResult): string {
  return r.data && typeof r.data.code === 'string' ? r.data.code : ''
}

function isListResponse(d: Record<string, unknown> | null): d is Record<string, unknown> & { invites: InviteRow[] } {
  return !!d && Array.isArray(d.invites)
}

export interface PendingInvitesPanelProps {
  /** Change this value to force a reload (for example after the wizard creates a client). */
  refreshKey?: number | string | null
}

export default function PendingInvitesPanel({ refreshKey }: PendingInvitesPanelProps) {
  const [rows, setRows] = useState<InviteRow[]>([])
  const [counts, setCounts] = useState<InviteCounts | null>(null)
  const [ttl, setTtl] = useState<number>(FALLBACK_TTL_MINUTES)
  const [loadState, setLoadState] = useState<LoadState>('loading')
  const [refreshing, setRefreshing] = useState(false)
  const [rowStates, setRowStates] = useState<Record<string, RowActionState>>({})
  const [notice, setNotice] = useState<string | null>(null)

  const mounted = useRef(true)
  const loadSeq = useRef(0)
  const hasData = useRef(false)
  const inFlight = useRef<Set<string>>(new Set())
  const lockTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  useEffect(() => {
    mounted.current = true
    const timers = lockTimers.current
    return () => {
      mounted.current = false
      timers.forEach(t => clearTimeout(t))
      timers.clear()
    }
  }, [])

  const load = useCallback(async () => {
    const seq = ++loadSeq.current
    if (hasData.current) setRefreshing(true)
    else setLoadState('loading')
    try {
      const r = await postInvites({ action: 'list' })
      if (!mounted.current || seq !== loadSeq.current) return
      if (!r.ok || !isListResponse(r.data)) throw new Error('list failed')
      const d = r.data as unknown as InviteListResponse
      setRows(d.invites)
      setCounts(d.counts ?? null)
      setTtl(typeof d.link_ttl_minutes === 'number' && d.link_ttl_minutes > 0 ? d.link_ttl_minutes : FALLBACK_TTL_MINUTES)
      hasData.current = true
      setLoadState('ready')
    } catch {
      if (!mounted.current || seq !== loadSeq.current) return
      // A failed refresh replaces the rows with the error notice and its Retry button.
      setLoadState('error')
    } finally {
      if (mounted.current && seq === loadSeq.current) setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    if (isDemoMode) return
    void load()
  }, [load, refreshKey])

  const patchRow = (id: string, patch: Partial<RowActionState>) => {
    setRowStates(prev => ({ ...prev, [id]: { ...(prev[id] ?? IDLE_ROW), ...patch } }))
  }

  const handleResend = useCallback(async (row: InviteRow) => {
    const id = row.user_id
    if (inFlight.current.has(id)) return
    inFlight.current.add(id)
    setNotice(null)
    patchRow(id, { busy: true, message: null, error: null })
    try {
      const r = await postInvites({ action: 'resend', user_id: id, client_id: row.client_id })
      if (!mounted.current) return
      if (r.ok && r.data && typeof r.data.invited_at === 'string') {
        const invitedAt = r.data.invited_at
        const sentTo = typeof r.data.email === 'string' && r.data.email ? r.data.email : (row.email ?? 'the client')
        setRows(prev => prev.map(x => (x.user_id === id ? { ...x, invited_at: invitedAt } : x)))
        patchRow(id, { busy: false, locked: true, message: `New invite sent to ${sentTo}.`, error: null })
        const old = lockTimers.current.get(id)
        if (old) clearTimeout(old)
        lockTimers.current.set(id, setTimeout(() => {
          lockTimers.current.delete(id)
          if (mounted.current) patchRow(id, { locked: false })
        }, SENT_LOCK_MS))
      } else {
        const sentence = errorSentence(r)
        patchRow(id, { busy: false, error: sentence, message: null })
        if (errorCode(r) === 'already_accepted') {
          setNotice(sentence)
          void load()
        }
      }
    } catch {
      if (mounted.current) {
        patchRow(id, { busy: false, error: 'Could not reach the server. Please try again.', message: null })
      }
    } finally {
      inFlight.current.delete(id)
    }
  }, [load])

  if (isDemoMode) return null

  return (
    <div className="mt-8">
      <PendingInvitesList
        rows={rows}
        counts={counts}
        linkTtlMinutes={ttl}
        loadState={loadState}
        refreshing={refreshing}
        rowStates={rowStates}
        notice={notice}
        onResend={row => { void handleResend(row) }}
        onReload={() => { void load() }}
      />
    </div>
  )
}
