/**
 * PendingInvitesPanel: admin list of invited accounts that have not accepted yet,
 * with a per-row "Resend invite" and "Copy link". Mounted on the Onboard page,
 * below the wizard.
 *
 * Two pieces in one file so the list can be mounted in a test harness without a
 * network: PendingInvitesList is presentational (no fetch, no supabase), and the
 * default export is the container that loads, holds per-row state and resends.
 *
 * Endpoint contract (fixed, shared with the backend): POST
 * /.netlify/functions/resend-invite with { action: 'list' } or
 * { action: 'resend', user_id, client_id, delivery: 'email' | 'copy' }. There is
 * deliberately no free-text email field here: a resend always targets a row the
 * server listed. The link expiry shown on a row comes from the server
 * (link_expires_at); nothing here derives it from a time to live.
 *
 * A link created by "Copy link" is a bearer credential. It lives in component
 * state only (never storage, never a log line, never a URL) and is cleared on
 * close, on reload and when the panel unmounts.
 *
 * Every English literal added for the 7 day invite link is marked
 * "copy: pending bg-copy".
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { Link2, RefreshCw } from 'lucide-react'
import { supabase, isDemoMode } from '../lib/supabase'
import { linkStateFromExpiry, formatAge, formatTimeLeft } from '../lib/inviteLink'
import {
  Badge, Button, Card, Notice, SectionHeader, SkeletonTable, tableClasses,
} from './ui'

// ── Types (contract shapes) ────────────────────────────────────────────────

export type InviteStatus = 'pending' | 'accepted' | 'not_invited' | 'missing_user'

export type InviteLinkChannel = 'brandgeo' | 'supabase' | 'unknown'

export type InviteDelivery = 'email' | 'copy'

export interface InviteRow {
  user_id: string
  client_id: number
  client_name: string | null
  plan: string | null
  category: 'active' | 'research' | null
  email: string | null
  role: string
  first_invited_at: string | null
  /** When the LAST invite email was sent. */
  invited_at: string | null
  accepted: boolean
  accepted_at: string | null
  status: InviteStatus
  /** Which mechanism the newest invite link belongs to. */
  link_channel: InviteLinkChannel
  /** When the newest invite link stops working, from the server. Null when unknown. */
  link_expires_at: string | null
  /** When the person last pressed Continue on the BrandGEO link. Null when never. */
  link_last_pressed_at: string | null
}

export interface InviteCounts {
  total: number
  pending: number
  accepted: number
}

export interface InviteListResponse {
  invites: InviteRow[]
  counts: InviteCounts
  /** Time to live of the Supabase email link only, in minutes. Not used for display. */
  link_ttl_minutes: number
  /** Lifetime of a BrandGEO link, in days. */
  invite_link_days?: number
}

export interface ResendResponse {
  ok: true
  user_id: string
  client_id: number
  email: string
  invited_at: string
  audit_logged: boolean
  channel?: 'brandgeo' | 'supabase'
  delivery?: InviteDelivery
  link_expires_at?: string | null
  /** BrandGEO channel only. False means the previous emailed link may still work. */
  previous_link_revoked?: boolean
  /** Present only when delivery is 'copy'. A bearer credential: state only, never stored. */
  invite_url?: string
}

export type InviteErrorCode =
  | 'bad_request' | 'not_found' | 'already_accepted' | 'not_invited'
  | 'ambiguous' | 'rate_limited' | 'invite_failed' | 'read_failed'
  | 'busy' | 'link_unavailable' | 'orphan_created'

export type LoadState = 'loading' | 'ready' | 'error'

export interface RowActionState {
  busy: boolean
  /** Which action the busy spinner belongs to. */
  busyKind?: InviteDelivery
  /** True for 60 seconds after a successful send or link creation. */
  locked: boolean
  message: string | null
  error: string | null
  /** The inline "this creates a new link" confirm step is open. */
  confirmingCopy?: boolean
  /** The created link. Bearer credential: held here only, cleared on close or reload. */
  copyUrl?: string | null
  /** When the created link stops working. */
  copyExpiresAt?: string | null
  /** Which delivery last succeeded, so the lock label does not say "Sent" after a copy. */
  lastKind?: InviteDelivery
  /** A warning shown beside the result (the previous email link may still work). */
  caution?: string | null
}

const IDLE_ROW: RowActionState = { busy: false, locked: false, message: null, error: null }

const SENT_LOCK_MS = 60_000

// copy: pending bg-copy
const UNNAMED_CLIENT = 'Unnamed client'
const COPY_LINK_LABEL = 'Copy link' // C-P4
const COPY_CONFIRM = 'This creates a new link. The link in the last invite email stops working. Continue?' // C-P5
const SENT_BRANDGEO = 'Invite sent. The link works for 7 days.' // C-P7
const SENT_SUPABASE = 'Invite sent. The link works for 24 hours.' // C-P7
const PREVIOUS_MAY_WORK = 'The previous email link may still work for up to 24 hours.' // C-P8
const MSG_SEND_FAILED = 'Could not send the invite. Please try again.'
const MSG_LINK_FAILED = 'Could not create the link. Please try again.' // copy: pending bg-copy
const MSG_LINK_MISSING = 'The link could not be shown. Use Resend invite to email it instead.' // copy: pending bg-copy
const MSG_UNREACHABLE = 'Could not reach the server. Please try again.'

// ── Pure helpers ───────────────────────────────────────────────────────────

// formatAge and formatTimeLeft live in src/lib/inviteLink.ts (pure, tested).
export function formatAbsolute(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}

function firstInvitedDiffers(row: InviteRow): boolean {
  if (!row.first_invited_at || !row.invited_at) return false
  const a = Date.parse(row.first_invited_at)
  const b = Date.parse(row.invited_at)
  if (Number.isNaN(a) || Number.isNaN(b)) return false
  return Math.abs(b - a) > 60_000
}

function displayName(row: InviteRow): string {
  return row.client_name || UNNAMED_CLIENT
}

// ── Presentational list ────────────────────────────────────────────────────

export interface PendingInvitesListProps {
  rows: InviteRow[]
  counts: InviteCounts | null
  loadState: LoadState
  /** True while a reload runs on top of data already shown. */
  refreshing?: boolean
  /** Per-row action state keyed by user_id. Missing key means idle. */
  rowStates: Record<string, RowActionState>
  /** Panel-level sentence (for example after an already_accepted answer). */
  notice?: string | null
  onResend: (row: InviteRow) => void
  /** Opens the confirm step for a new copyable link. */
  onCopyLinkRequest: (row: InviteRow) => void
  /** Closes the confirm step without creating anything. */
  onCopyLinkCancel: (row: InviteRow) => void
  /** Creates the link (delivery 'copy'). */
  onCopyLinkConfirm: (row: InviteRow) => void
  /** Hides a created link and drops it from state. */
  onCopyLinkClose: (row: InviteRow) => void
  onReload: () => void
}

function LinkBadge({ row }: { row: InviteRow }) {
  const state = linkStateFromExpiry(row.link_expires_at)
  if (state === 'expired') return <Badge tone="warn">Link expired</Badge>
  if (state === 'valid') {
    const left = formatTimeLeft(row.link_expires_at)
    // C-P1 (copy: pending bg-copy)
    return <Badge tone="neutral">{left ? `Link valid, ${left}` : 'Link valid'}</Badge>
  }
  return <Badge tone="neutral">Link state unknown</Badge>
}

function LinkCell({ row }: { row: InviteRow }) {
  const age = formatAge(row.link_last_pressed_at)
  return (
    <div className="space-y-1">
      <LinkBadge row={row} />
      {/* C-P3 (copy: pending bg-copy) */}
      {age && <div className="text-meta text-ink-2">Continue pressed {age}</div>}
    </div>
  )
}

function CompanyCell({ row }: { row: InviteRow }) {
  return (
    <div className="flex flex-wrap items-center gap-2 min-w-0">
      <span className="text-ink font-medium break-words">{displayName(row)}</span>
      {row.plan && <Badge tone="accent">{row.plan}</Badge>}
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

/** Read-only field with the created link, a Copy button and the bearer-credential warning (C-P6). */
function CopyLinkField({
  url, expiresAt, name, onClose,
}: { url: string; expiresAt: string | null; name: string; onClose: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [copied, setCopied] = useState(false)
  const [copyFailed, setCopyFailed] = useState(false)

  // Put the link in front of the admin: focused and selected, so a manual copy also works.
  useEffect(() => {
    inputRef.current?.focus()
    inputRef.current?.select()
  }, [])

  const doCopy = async () => {
    setCopyFailed(false)
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
    } catch {
      // No clipboard access (an insecure context or a refused permission): leave the
      // link selected so a keyboard copy works.
      setCopied(false)
      setCopyFailed(true)
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }

  const until = formatAbsolute(expiresAt)
  return (
    <div className="rounded-control border border-line bg-surface p-3 space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={inputRef}
          type="text"
          readOnly
          value={url}
          autoComplete="off"
          spellCheck={false}
          aria-label={`Invite link for ${name}`} /* copy: pending bg-copy */
          onFocus={e => e.currentTarget.select()}
          className="min-w-0 flex-1 basis-40 h-7 max-md:min-h-[44px] rounded-control border border-edge bg-surface-2 px-2 text-meta text-ink font-mono focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
        />
        <Button
          variant="secondary"
          size="sm"
          onClick={() => { void doCopy() }}
          aria-label={`Copy invite link for ${name}`} /* copy: pending bg-copy */
        >
          {/* copy: pending bg-copy */}
          {copied ? 'Copied' : 'Copy'}
        </Button>
        <Button variant="ghost" size="sm" onClick={onClose} aria-label={`Close link for ${name}`} /* copy: pending bg-copy */>
          {/* copy: pending bg-copy */}
          Close
        </Button>
      </div>
      {/* C-P6 (copy: pending bg-copy). Without a known expiry the sentence names no date. */}
      <p className="text-meta text-warn break-words">
        {until
          ? `Anyone with this link can set up this login until ${until}. Send it only to this person.`
          : 'Anyone with this link can set up this login until it expires. Send it only to this person.'}
      </p>
      {/* copy: pending bg-copy */}
      <span role="status" className="sr-only">{copied ? 'Link copied' : copyFailed ? 'Could not copy. The link is selected.' : ''}</span>
      {/* copy: pending bg-copy */}
      {copyFailed && <p className="text-meta text-neg">Could not copy. The link is selected, press Ctrl+C or Cmd+C.</p>}
    </div>
  )
}

interface RowActionsProps {
  row: InviteRow
  state: RowActionState
  onResend: (row: InviteRow) => void
  onCopyLinkRequest: (row: InviteRow) => void
  onCopyLinkCancel: (row: InviteRow) => void
  onCopyLinkConfirm: (row: InviteRow) => void
  onCopyLinkClose: (row: InviteRow) => void
  full?: boolean
}

function RowActions({
  row, state, onResend, onCopyLinkRequest, onCopyLinkCancel, onCopyLinkConfirm, onCopyLinkClose, full,
}: RowActionsProps) {
  const name = displayName(row)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const resendRef = useRef<HTMLButtonElement>(null)
  const continueRef = useRef<HTMLButtonElement>(null)
  const fallbackRef = useRef<HTMLDivElement>(null)
  // Set when the control that had focus is about to disappear (Cancel, Escape,
  // Close, or Continue); the effect below then puts focus somewhere real.
  const returnFocusRef = useRef<'return' | 'confirm' | null>(null)
  const confirming = !!state.confirmingCopy
  const url = state.copyUrl ?? null

  // Move focus into the confirm step when it opens.
  useEffect(() => {
    if (confirming) continueRef.current?.focus()
  }, [confirming])

  // Return focus after the render that removed the focused control, never in the
  // handler: the Copy link button is still disabled while the confirm step is open.
  useEffect(() => {
    if (!returnFocusRef.current) return
    if (confirming || state.busy) return
    const kind = returnFocusRef.current
    returnFocusRef.current = null
    // A link created by Continue takes focus in its own field.
    if (kind === 'confirm' && url) return
    const trigger = triggerRef.current
    const resend = resendRef.current
    if (trigger && !trigger.disabled) trigger.focus()
    else if (resend && !resend.disabled) resend.focus()
    else fallbackRef.current?.focus()
  }, [confirming, url, state.locked, state.busy])

  const cancel = () => {
    returnFocusRef.current = 'return'
    onCopyLinkCancel(row)
  }

  const closeLink = () => {
    returnFocusRef.current = 'return'
    onCopyLinkClose(row)
  }

  const confirmCopy = () => {
    returnFocusRef.current = 'confirm'
    onCopyLinkConfirm(row)
  }

  const resendBusy = state.busy && state.busyKind !== 'copy'
  const copyBusy = state.busy && state.busyKind === 'copy'

  return (
    <div ref={fallbackRef} tabIndex={-1} className={`${full ? 'w-full space-y-2' : 'space-y-2'} focus:outline-none`}>
      <div className={full ? 'flex flex-col gap-2' : 'flex flex-wrap gap-2'}>
        <Button
          ref={resendRef}
          variant="secondary"
          size="sm"
          loading={resendBusy}
          disabled={state.locked || state.busy}
          onClick={() => onResend(row)}
          aria-label={`Resend invite to ${name}`}
          className={full ? 'w-full max-md:min-h-[44px]' : undefined}
        >
          {/* copy: pending bg-copy */}
          {state.locked ? (state.lastKind === 'copy' ? 'Link created' : 'Sent') : 'Resend invite'}
        </Button>
        <Button
          ref={triggerRef}
          variant="ghost"
          size="sm"
          icon={Link2}
          loading={copyBusy}
          disabled={state.locked || state.busy || confirming}
          onClick={() => onCopyLinkRequest(row)}
          aria-label={`${COPY_LINK_LABEL} for ${name}`} /* copy: pending bg-copy */
          aria-expanded={confirming}
          className={full ? 'w-full max-md:min-h-[44px]' : undefined}
        >
          {COPY_LINK_LABEL}
        </Button>
      </div>

      {confirming && (
        <div
          role="group"
          aria-label={`Confirm a new link for ${name}`} /* copy: pending bg-copy */
          onKeyDown={e => { if (e.key === 'Escape') { e.stopPropagation(); cancel() } }}
          className="rounded-control border border-line bg-surface p-3 space-y-2"
        >
          <p className="text-meta text-ink-2">{COPY_CONFIRM}</p>
          <div className="flex flex-wrap gap-2">
            <Button
              ref={continueRef}
              variant="primary"
              size="sm"
              onClick={confirmCopy}
              aria-label={`Continue and create a link for ${name}`} /* copy: pending bg-copy */
            >
              {/* copy: pending bg-copy */}
              Continue
            </Button>
            <Button variant="ghost" size="sm" onClick={cancel} aria-label={`Cancel creating a link for ${name}`} /* copy: pending bg-copy */>
              {/* copy: pending bg-copy */}
              Cancel
            </Button>
          </div>
        </div>
      )}

      {url && (
        <CopyLinkField url={url} expiresAt={state.copyExpiresAt ?? null} name={name} onClose={closeLink} />
      )}

      <div aria-live="polite" className="text-meta">
        {state.message && <p className="text-pos-ink break-words">{state.message}</p>}
        {state.caution && <p className="text-warn break-words">{state.caution}</p>}
        {state.error && <p className="text-neg break-words">{state.error}</p>}
      </div>
    </div>
  )
}

export function PendingInvitesList({
  rows, counts, loadState, refreshing = false, rowStates, notice,
  onResend, onCopyLinkRequest, onCopyLinkCancel, onCopyLinkConfirm, onCopyLinkClose, onReload,
}: PendingInvitesListProps) {
  const pending = rows.filter(r => r.status === 'pending')
  const summary = counts
    ? `${counts.pending} not accepted yet, ${counts.accepted} accepted.`
    : undefined

  const actionProps = { onResend, onCopyLinkRequest, onCopyLinkCancel, onCopyLinkConfirm, onCopyLinkClose }

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
                    <td className="px-4 py-3 align-top"><LinkCell row={row} /></td>
                    <td className="px-4 py-3 align-top min-w-[15rem]">
                      <RowActions row={row} state={rowStates[row.user_id] ?? IDLE_ROW} {...actionProps} />
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
                <LinkCell row={row} />
                <RowActions row={row} state={rowStates[row.user_id] ?? IDLE_ROW} {...actionProps} full />
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

// The server writes the sentence for every refusal (busy, link_unavailable,
// orphan_created and the older codes), so it is shown as it comes.
function errorSentence(r: PostResult, fallback: string): string {
  const msg = r.data && typeof r.data.error === 'string' ? r.data.error : ''
  return msg || fallback
}

function errorCode(r: PostResult): string {
  return r.data && typeof r.data.code === 'string' ? r.data.code : ''
}

function isListResponse(d: Record<string, unknown> | null): d is Record<string, unknown> & { invites: InviteRow[] } {
  return !!d && Array.isArray(d.invites)
}

/** Drops every created link and open confirm step. Returns the same object when there was none. */
function dropLinks(prev: Record<string, RowActionState>): Record<string, RowActionState> {
  let changed = false
  const next: Record<string, RowActionState> = {}
  for (const [id, s] of Object.entries(prev)) {
    if (s.copyUrl || s.copyExpiresAt || s.confirmingCopy) {
      changed = true
      next[id] = { ...s, copyUrl: null, copyExpiresAt: null, confirmingCopy: false }
    } else {
      next[id] = s
    }
  }
  return changed ? next : prev
}

export interface PendingInvitesPanelProps {
  /** Change this value to force a reload (for example after the wizard creates a client). */
  refreshKey?: number | string | null
}

export default function PendingInvitesPanel({ refreshKey }: PendingInvitesPanelProps) {
  const [rows, setRows] = useState<InviteRow[]>([])
  const [counts, setCounts] = useState<InviteCounts | null>(null)
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
    // A reload ends the life of any link shown on screen.
    setRowStates(dropLinks)
    if (hasData.current) setRefreshing(true)
    else setLoadState('loading')
    try {
      const r = await postInvites({ action: 'list' })
      if (!mounted.current || seq !== loadSeq.current) return
      if (!r.ok || !isListResponse(r.data)) throw new Error('list failed')
      const d = r.data as unknown as InviteListResponse
      setRows(d.invites)
      setCounts(d.counts ?? null)
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

  // One path for both deliveries. 'email' sends the invite email; 'copy' creates a
  // link and returns it in the response instead of sending anything.
  const handleSend = useCallback(async (row: InviteRow, delivery: InviteDelivery) => {
    const id = row.user_id
    if (inFlight.current.has(id)) return
    inFlight.current.add(id)
    setNotice(null)
    patchRow(id, { busy: true, busyKind: delivery, message: null, caution: null, error: null, confirmingCopy: false })
    try {
      const r = await postInvites({ action: 'resend', user_id: id, client_id: row.client_id, delivery })
      if (!mounted.current) return
      if (r.ok && r.data && typeof r.data.invited_at === 'string') {
        const d = r.data
        const invitedAt = d.invited_at as string
        const ch: unknown = d.channel
        const respChannel: 'brandgeo' | 'supabase' | null = ch === 'brandgeo' || ch === 'supabase' ? ch : null
        const expires = typeof d.link_expires_at === 'string' ? d.link_expires_at : null
        // Patch only what the response states; a new link means nobody has pressed it yet.
        setRows(prev => prev.map(x => (x.user_id === id
          ? {
              ...x,
              invited_at: invitedAt,
              link_channel: respChannel ?? x.link_channel,
              link_expires_at: expires,
              link_last_pressed_at: null,
            }
          : x)))

        const caution = d.previous_link_revoked === false ? PREVIOUS_MAY_WORK : null
        if (delivery === 'copy') {
          const url = typeof d.invite_url === 'string' ? d.invite_url : ''
          if (url) {
            patchRow(id, {
              busy: false, busyKind: undefined, locked: true, lastKind: 'copy',
              message: null, caution, error: null,
              copyUrl: url, copyExpiresAt: expires,
            })
          } else {
            patchRow(id, { busy: false, busyKind: undefined, locked: true, lastKind: 'copy', message: null, caution, error: MSG_LINK_MISSING })
          }
        } else {
          const sentTo = typeof d.email === 'string' && d.email ? d.email : (row.email ?? 'the client')
          const base = respChannel === 'brandgeo' ? SENT_BRANDGEO
            : respChannel === 'supabase' ? SENT_SUPABASE
            : `New invite sent to ${sentTo}.`
          // The email resend supersedes any link copied earlier, so that link is dropped.
          patchRow(id, {
            busy: false, busyKind: undefined, locked: true, lastKind: 'email',
            message: base, caution, error: null,
            copyUrl: null, copyExpiresAt: null,
          })
        }

        const old = lockTimers.current.get(id)
        if (old) clearTimeout(old)
        lockTimers.current.set(id, setTimeout(() => {
          lockTimers.current.delete(id)
          if (mounted.current) patchRow(id, { locked: false })
        }, SENT_LOCK_MS))
      } else {
        const sentence = errorSentence(r, delivery === 'copy' ? MSG_LINK_FAILED : MSG_SEND_FAILED)
        patchRow(id, { busy: false, busyKind: undefined, error: sentence, message: null, caution: null })
        const code = errorCode(r)
        if (code === 'already_accepted') setNotice(sentence)
        // The server may already have replaced the earlier link before it refused, so
        // the badge must be re-read. A bad request changed nothing.
        if (code !== 'bad_request') void load()
      }
    } catch {
      if (mounted.current) {
        patchRow(id, { busy: false, busyKind: undefined, error: MSG_UNREACHABLE, message: null })
      }
    } finally {
      inFlight.current.delete(id)
    }
  }, [load])

  const handleCopyRequest = useCallback((row: InviteRow) => {
    patchRow(row.user_id, { confirmingCopy: true, message: null, error: null })
  }, [])

  const handleCopyCancel = useCallback((row: InviteRow) => {
    patchRow(row.user_id, { confirmingCopy: false })
  }, [])

  const handleCopyClose = useCallback((row: InviteRow) => {
    patchRow(row.user_id, { copyUrl: null, copyExpiresAt: null })
  }, [])

  if (isDemoMode) return null

  return (
    <div className="mt-8">
      <PendingInvitesList
        rows={rows}
        counts={counts}
        loadState={loadState}
        refreshing={refreshing}
        rowStates={rowStates}
        notice={notice}
        onResend={row => { void handleSend(row, 'email') }}
        onCopyLinkRequest={handleCopyRequest}
        onCopyLinkCancel={handleCopyCancel}
        onCopyLinkConfirm={row => { void handleSend(row, 'copy') }}
        onCopyLinkClose={handleCopyClose}
        onReload={() => { void load() }}
      />
    </div>
  )
}
