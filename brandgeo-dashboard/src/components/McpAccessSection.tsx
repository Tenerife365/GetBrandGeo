/**
 * McpAccessSection.tsx - Account.tsx "MCP access" card (docs/arch/mcp-access.md
 * section 7.2). Split out of Account.tsx, which was already large, per bg-app's
 * "at most one small new component file" allowance.
 *
 * Backend contract assumed (client-api-keys.js, section 7.1 of the spec -
 * bg-backend builds this in parallel; bg-verify checks the two agree):
 *
 *   POST /.netlify/functions/client-api-keys
 *   Body: { action: 'list' | 'issue' | 'revoke', client_id: number, ... }
 *   Auth: Authorization: Bearer <supabase access token>, same as every other
 *   Account.tsx call (savePlan, saveDates, deleteAccount).
 *
 *   action 'list'   body {client_id}            -> 200 { keys: KeyRow[], max_keys: number, allowed: boolean, required_plan: string }
 *   action 'issue'  body {client_id, label?, scope?} -> 200 { key: KeyRow, secret: string } (secret shown once)
 *                                                    403 below plan gate { error, required_plan }
 *                                                    403 research client, not admin-issued { error }
 *                                                    409 at max_keys { error }
 *                                                    400 label over 60 chars { error }
 *   action 'revoke' body {client_id, id}         -> 200 { ok: true, id }
 *                                                    404 no active key with that id+client_id { error }
 *   Any action, table not migrated yet           -> 503 { error }
 *
 *   KeyRow (never includes the secret or its hash): { id, key_prefix, label, created_at, last_used_at, scope? }
 *   scope is 'read' | 'read_write' (docs/arch/mcp-stage2-fixes.md 9.3). `issue`
 *   sends it ('read' is the default choice); `list` and `issue` return it on every
 *   row. A row without `scope` (older backend) is shown as "Read only".
 *
 * Six required states (AGENT-OS guardrails) plus the 503 case, which the spec
 * calls out separately from the six:
 *   loading          - first `list` call in flight.
 *   unavailable      - `list` answered 503 (function shipped ahead of the
 *                      migration, section 9's "net"). Neutral message, no retry
 *                      button (retrying won't help until the table exists).
 *   error            - `list` failed for any other reason (network, 500, bad
 *                      JSON). Retry button.
 *   locked-by-plan   - gate closed (see `gated` below) and zero keys on file.
 *   partial          - gate closed but the client has surviving keys from
 *                      before a downgrade (section 7.2's "If the client has
 *                      old active keys" case). Partial capability: the keys
 *                      list and Revoke still work, Issue does not. This is the
 *                      deliberate reading of "partial" for this component -
 *                      not partial data, partial capability - since `list` and
 *                      `revoke` are never plan-gated (section 4.3) while
 *                      `issue` is.
 *   empty            - gate open, zero keys on file.
 *   success          - gate open, one or more keys on file.
 *
 * `gated` (whether the full, Issue-enabled branch renders) is
 * `hasFeature(plan, 'mcp_access') || isAdmin`, per section 7.2's literal
 * "Gated plan (hasFeature(plan, 'mcp_access'), or admin)". This is a FRONTEND
 * branch choice, not a claim that the server will accept the issue call: an
 * admin driving a Free-plan client's account still gets the real 403 from the
 * server if they press Issue, surfaced inline via the normal error path below.
 * `list`/`revoke` are unaffected either way, since the server never gates them.
 *
 * COPY: pending bg-copy. Every string below except the four the architecture
 * spec gives verbatim ("MCP access is included from the Radar plan.", "This
 * key is shown once. Copy it now. BrandGEO cannot show it again.", "Revoke a
 * key to issue a new one.", and the three 8.2 setup snippets) is a
 * placeholder written to keep the six states legible, not customer-approved
 * copy: the explanation line, the empty-state line, the loading/error/
 * unavailable lines, the below-gate "old keys survive" note, table headers,
 * button labels, and the revoke confirm text. bg-copy owns a pass over all of
 * it per section 12 stage 2.
 */
import { Fragment, useCallback, useEffect, useRef, useState } from 'react'
import {
  KeyRound, Loader2, Check, Copy, Plus, Lock, AlertTriangle, Terminal, Trash2, Sparkles,
} from 'lucide-react'
import { supabase, isDemoMode } from '../lib/supabase'
import { copyText } from '../lib/affiliateApi'
import { hasFeature, featureUnlockPlan, PLAN_LABELS } from '../lib/planConfig'
import { APPS } from '../lib/mcpOauthCopy'
import Skeleton from './Skeleton'

type KeyScope = 'read' | 'read_write'

interface KeyRow {
  id: string
  key_prefix: string
  label: string
  created_at: string
  last_used_at: string | null
  scope?: KeyScope
}

interface ListResponse {
  keys: KeyRow[]
  max_keys: number
  allowed: boolean
  required_plan: string
  error?: string
}

const MCP_ENDPOINT = 'https://app.getbrandgeo.com/mcp'

async function callKeysFn<T>(body: Record<string, unknown>): Promise<{ status: number; data: (T & { error?: string }) | null }> {
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token ?? ''
  const res = await fetch('/.netlify/functions/client-api-keys', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => null)
  return { status: res.status, data }
}

/** The three setup snippets from docs/arch/mcp-access.md section 8.2, with the
 *  real secret filled in. Shown only inside the one-time reveal panel. */
function setupSnippets(secret: string) {
  return [
    {
      client: 'Claude Code',
      code: `claude mcp add --transport http brandgeo ${MCP_ENDPOINT} --header "Authorization: Bearer ${secret}"`,
    },
    {
      client: 'Cursor',
      note: '~/.cursor/mcp.json (or .cursor/mcp.json in a project)',
      code: `{
  "mcpServers": {
    "brandgeo": {
      "url": "${MCP_ENDPOINT}",
      "headers": { "Authorization": "Bearer ${secret}" }
    }
  }
}`,
    },
    {
      client: 'Claude Desktop',
      note: 'claude_desktop_config.json',
      code: `{
  "mcpServers": {
    "brandgeo": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "${MCP_ENDPOINT}", "--header", "Authorization:\${BRANDGEO_AUTH}"],
      "env": { "BRANDGEO_AUTH": "Bearer ${secret}" }
    }
  }
}`,
    },
  ]
}

function scopeLabel(scope: KeyScope | undefined): string {
  return scope === 'read_write' ? 'Read and write' : 'Read only'
}

function fmtDT(iso: string | null): string {
  if (!iso) return 'never'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return 'never'
  return d.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })
}

const inputCls = 'w-full bg-dark-700 border border-edge rounded-lg px-3 py-2 text-sm text-ink placeholder-ink-3 focus:border-accent-ink'
const primaryBtn = 'inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-accent-strong text-on-accent hover:bg-accent-strong-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
const ghostBtn = 'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-dark-700 hover:bg-dark-600 text-ink border border-dark-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'

function CopyBtn({ text }: { text: string }) {
  const [ok, setOk] = useState(false)
  return (
    <button
      type="button"
      onClick={async () => { if (await copyText(text)) { setOk(true); setTimeout(() => setOk(false), 1200) } }}
      className={ghostBtn}
      aria-label="Copy to clipboard"
    >
      {ok ? <Check size={12} /> : <Copy size={12} />} {ok ? 'Copied' : 'Copy'}
    </button>
  )
}

// ── Connected apps (stage 3, docs/arch/mcp-stage3-oauth.md 11.2) ──────────────
// The grants state is hoisted into McpAccessSection (not the block) so the key
// list reloading, which swaps the whole card between branches, never resets the
// confirm state or flashes the skeleton again.
interface GrantRow {
  id: string
  client_name: string | null
  redirect_host: string | null
  access: 'read' | 'read_write'
  created_at: string
  last_used_at: string | null
}

type AppsState = 'loading' | 'ready' | 'error' | 'hidden'

function isLoopbackHost(h: string | null): boolean {
  return h === 'localhost' || h === '127.0.0.1'
}

/** Focus the first matching element that is actually rendered (the table and the cards both exist in the DOM). */
function focusVisible(selector: string) {
  const els = Array.from(document.querySelectorAll<HTMLElement>(selector))
  const el = els.find(e => e.offsetParent !== null) ?? els[0]
  el?.focus()
}

function useConnectedApps(clientId: number) {
  const [state, setState] = useState<AppsState>('loading')
  const [grants, setGrants] = useState<GrantRow[]>([])
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [disconnectingId, setDisconnectingId] = useState<string | null>(null)
  const [failure, setFailure] = useState<{ id: string; text: string } | null>(null)
  const [announce, setAnnounce] = useState('')
  const headingRef = useRef<HTMLHeadingElement>(null)

  const load = useCallback(async () => {
    setState('loading')
    try {
      const { status, data } = await callKeysFn<{ grants: GrantRow[]; available: boolean }>({ action: 'list_grants', client_id: clientId })
      if (status === 503) { setState('hidden'); return }
      if (!data || data.error || status >= 400) { setState('error'); setAnnounce(APPS.loadError); return }
      if (data.available === false) { setGrants([]); setState('hidden'); return }
      setGrants(Array.isArray(data.grants) ? data.grants : [])
      setState('ready')
    } catch {
      setState('error'); setAnnounce(APPS.loadError)
    }
  }, [clientId])

  useEffect(() => {
    setGrants([]); setConfirmId(null); setFailure(null); setAnnounce('')
    if (!isDemoMode && clientId) load()
  }, [clientId, load])

  const disconnect = async (g: GrantRow) => {
    const name = g.client_name || APPS.nameFallback
    setFailure(null); setDisconnectingId(g.id); setAnnounce(APPS.disconnecting(name))
    try {
      const { status, data } = await callKeysFn<{ ok: boolean }>({ action: 'revoke_grant', client_id: clientId, id: g.id })
      if (!data || data.error || status >= 400 || !data.ok) throw new Error('revoke failed')
      setGrants(prev => prev.filter(x => x.id !== g.id))
      setConfirmId(null)
      setAnnounce(APPS.success(name))
      setTimeout(() => headingRef.current?.focus(), 0)
    } catch {
      setConfirmId(null)
      setFailure({ id: g.id, text: APPS.failure(name) })
      setAnnounce(APPS.failure(name))
      setTimeout(() => focusVisible(`[data-disc="${g.id}"]`), 0)
    } finally {
      setDisconnectingId(null)
    }
  }

  return { state, grants, confirmId, setConfirmId, disconnectingId, failure, announce, headingRef, load, disconnect }
}

function ConnectedAppsBlock({ apps, gated }: { apps: ReturnType<typeof useConnectedApps>; gated: boolean }) {
  const { state, grants, confirmId, setConfirmId, disconnectingId, failure, announce, headingRef, load, disconnect } = apps

  useEffect(() => {
    if (confirmId) focusVisible(`[data-keep="${confirmId}"]`)
  }, [confirmId])

  // Locked by plan with nothing to disconnect, or the migration is not applied: render nothing.
  if (state === 'hidden') return null
  if (state === 'ready' && !gated && grants.length === 0) return null

  const nameOf = (g: GrantRow) => g.client_name || APPS.nameFallback
  const hostCell = (g: GrantRow) => isLoopbackHost(g.redirect_host)
    ? APPS.redirectLoopback
    : <span className="font-mono text-meta break-all">{g.redirect_host || ''}</span>
  const accessText = (g: GrantRow) => g.access === 'read_write' ? APPS.accessWrite : APPS.accessRead
  const lastUsed = (g: GrantRow) => g.last_used_at ? fmtDT(g.last_used_at) : APPS.neverUsed

  const onConfirmKey = (e: React.KeyboardEvent, id: string) => {
    if (e.key === 'Escape') {
      e.preventDefault(); e.stopPropagation()
      setConfirmId(null)
      setTimeout(() => focusVisible(`[data-disc="${id}"]`), 0)
    }
  }

  const disconnectBtn = (g: GrantRow, phone: boolean) => (
    <button
      type="button"
      data-disc={g.id}
      aria-label={APPS.disconnectAria(nameOf(g))}
      onClick={() => setConfirmId(g.id)}
      disabled={disconnectingId !== null}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-dark-700 hover:bg-dark-600 text-neg border border-dark-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed max-md:min-h-[44px] ${phone ? 'w-full justify-center mt-3' : ''}`}
    >
      <Trash2 size={12} /> {APPS.disconnect}
    </button>
  )

  const confirmBlock = (g: GrantRow, phone: boolean) => (
    <div
      onKeyDown={e => onConfirmKey(e, g.id)}
      className={`bg-neg-tint border border-neg/20 rounded-lg p-3 ${phone ? 'mt-3' : ''}`}
    >
      <p className="text-xs text-ink-2 break-words">{APPS.confirm(nameOf(g))}</p>
      <div className={`mt-2 flex gap-2 ${phone ? 'flex-col' : ''}`}>
        <button
          type="button"
          onClick={() => disconnect(g)}
          disabled={disconnectingId !== null}
          className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-neg-tint border border-neg/30 text-neg hover:opacity-80 transition-colors disabled:opacity-60 disabled:cursor-not-allowed max-md:min-h-[44px]"
        >
          {disconnectingId === g.id && <Loader2 size={12} className="animate-spin motion-reduce:animate-none" />} {APPS.confirmYes}
        </button>
        <button
          type="button"
          data-keep={g.id}
          onClick={() => { setConfirmId(null); setTimeout(() => focusVisible(`[data-disc="${g.id}"]`), 0) }}
          disabled={disconnectingId !== null}
          className={`${ghostBtn} justify-center max-md:min-h-[44px]`}
        >
          {APPS.confirmNo}
        </button>
      </div>
    </div>
  )

  const failureLine = (g: GrantRow) => failure && failure.id === g.id
    ? <p className="text-xs text-neg mt-1 break-words">{failure.text}</p>
    : null

  let body: React.ReactNode = null
  if (state === 'loading') {
    body = (
      <>
        <div className="hidden md:block mt-4 space-y-2"><Skeleton className="h-8 w-full" /><Skeleton className="h-8 w-full" /></div>
        <div className="md:hidden mt-4 space-y-3"><Skeleton className="h-28 w-full rounded-lg" /><Skeleton className="h-28 w-full rounded-lg" /></div>
      </>
    )
  } else if (state === 'error') {
    body = (
      <div className="flex items-center gap-3 mt-3 flex-wrap">
        <span className="text-xs text-neg flex items-center gap-1.5"><AlertTriangle size={13} /> {APPS.loadError}</span>
        <button type="button" onClick={load} className={ghostBtn}>{APPS.retry}</button>
      </div>
    )
  } else if (grants.length === 0) {
    body = (
      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-ink-3">
        <span>{APPS.emptyBefore}<span className="font-mono text-ink-2 break-all">{MCP_ENDPOINT}</span>{APPS.emptyAfter}</span>
        <CopyBtn text={MCP_ENDPOINT} />
      </div>
    )
  } else {
    body = (
      <>
        {!gated && <p className="text-meta text-ink-3 mt-4">{APPS.partialNote}</p>}
        <div className="hidden md:block mt-4 overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-ink-3 uppercase tracking-wide text-meta">
                <th className="pb-2 pr-4 font-medium">{APPS.colApp}</th>
                <th className="pb-2 pr-4 font-medium">{APPS.colRedirect}</th>
                <th className="pb-2 pr-4 font-medium">{APPS.colAccess}</th>
                <th className="pb-2 pr-4 font-medium">{APPS.colConnected}</th>
                <th className="pb-2 pr-4 font-medium">{APPS.colLastUsed}</th>
                <th className="pb-2 font-medium"><span className="sr-only">{APPS.colActions}</span></th>
              </tr>
            </thead>
            <tbody>
              {grants.map(g => (
                <Fragment key={g.id}>
                  <tr className="border-t border-dark-700">
                    <td className="py-2 pr-4 text-ink break-words">{nameOf(g)}</td>
                    <td className="py-2 pr-4 text-ink-2">{hostCell(g)}</td>
                    <td className="py-2 pr-4 text-ink-2">{accessText(g)}</td>
                    <td className="py-2 pr-4 text-ink-2">{fmtDT(g.created_at)}</td>
                    <td className="py-2 pr-4 text-ink-2">{lastUsed(g)}</td>
                    <td className="py-2">{confirmId === g.id ? null : disconnectBtn(g, false)}</td>
                  </tr>
                  {confirmId === g.id && (
                    <tr><td colSpan={6} className="pb-2">{confirmBlock(g, false)}</td></tr>
                  )}
                  {failure && failure.id === g.id && (
                    <tr><td colSpan={6} className="pb-2">{failureLine(g)}</td></tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
        <ul className="md:hidden mt-4 space-y-3">
          {grants.map(g => (
            <li key={g.id} className="rounded-lg border border-dark-700 bg-dark-700/30 p-3">
              <p className="text-sm font-medium text-ink break-words">{nameOf(g)}</p>
              <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs mt-2">
                <dt className="text-ink-3">{APPS.colRedirect}</dt><dd className="text-ink-2">{hostCell(g)}</dd>
                <dt className="text-ink-3">{APPS.colAccess}</dt><dd className="text-ink-2">{accessText(g)}</dd>
                <dt className="text-ink-3">{APPS.colConnected}</dt><dd className="text-ink-2">{fmtDT(g.created_at)}</dd>
                <dt className="text-ink-3">{APPS.colLastUsed}</dt><dd className="text-ink-2">{lastUsed(g)}</dd>
              </dl>
              {confirmId === g.id ? confirmBlock(g, true) : disconnectBtn(g, true)}
              {failureLine(g)}
            </li>
          ))}
        </ul>
      </>
    )
  }

  return (
    <div className="mt-6 pt-6 border-t border-dark-700">
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">{announce}</div>
      <h3 ref={headingRef} tabIndex={-1} className="text-sm font-semibold text-ink-2 mb-1 outline-none">{APPS.heading}</h3>
      <p className="text-xs text-ink-3 mb-3">{APPS.helper}</p>
      {body}
    </div>
  )
}

export default function McpAccessSection({
  clientId, plan, isAdmin, onUpgrade,
}: {
  clientId: number
  plan: string
  isAdmin: boolean
  /** Reuses Account.tsx's own upgradeTo() logic (Stripe portal, pricing page, or mailto). */
  onUpgrade: () => void
}) {
  const [loading, setLoading] = useState(true)
  const [unavailable, setUnavailable] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [list, setList] = useState<ListResponse | null>(null)

  const [label, setLabel] = useState('')
  const [scope, setScope] = useState<KeyScope>('read')
  const [issuing, setIssuing] = useState(false)
  const [issueError, setIssueError] = useState<string | null>(null)
  const [reveal, setReveal] = useState<{ secret: string; row: KeyRow } | null>(null)

  const [revokingId, setRevokingId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  // F2 (docs/qa/mcp-access-stage1-review-2026-09-22.md): the one-time reveal
  // panel is a real keyboard dialog. dialogRef scopes the focus trap,
  // secretInputRef takes initial focus, issueBtnRef is the trigger focus
  // returns to on close. headerRef (N2, section 13) is the fallback close
  // target when the Issue key button is not rendered or is disabled.
  const dialogRef = useRef<HTMLDivElement>(null)
  const secretInputRef = useRef<HTMLInputElement>(null)
  const issueBtnRef = useRef<HTMLButtonElement>(null)
  const headerRef = useRef<HTMLHeadingElement>(null)

  const apps = useConnectedApps(clientId)

  const load = useCallback(async () => {
    setLoading(true); setUnavailable(false); setLoadError(null)
    try {
      const { status, data } = await callKeysFn<ListResponse>({ action: 'list', client_id: clientId })
      if (status === 503) { setUnavailable(true); setLoading(false); return }
      if (!data || data.error || status >= 400) {
        setLoadError(data?.error || 'Could not load MCP keys. Try again, and if it keeps happening, contact support@getbrandgeo.com.'); setLoading(false); return
      }
      setList(data)
    } catch {
      setLoadError('Could not load MCP keys. Try again, and if it keeps happening, contact support@getbrandgeo.com.')
    } finally {
      setLoading(false)
    }
  }, [clientId])

  useEffect(() => { if (!isDemoMode && clientId) load() }, [clientId, load])

  // F2: focus management for the one-time reveal dialog. Moves focus into
  // the dialog on open, traps Tab inside it while open, and returns focus to
  // the "Issue key" button that triggered it on close. Escape is
  // deliberately a no-op while the secret is shown (see the keydown handler
  // below) rather than a second way to discard an unread key.
  useEffect(() => {
    if (!reveal) return
    secretInputRef.current?.focus()

    const getFocusable = (): HTMLElement[] => {
      const root = dialogRef.current
      if (!root) return []
      return Array.from(
        root.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      )
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // A stray Escape must not silently discard a key nobody has copied
        // yet. Close only via the explicit Done button.
        e.preventDefault()
        return
      }
      if (e.key !== 'Tab') return
      const focusable = getFocusable()
      if (focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      // N1 (docs/qa/mcp-access-stage1-review-2026-09-22.md section 13): if
      // focus drifted outside the dialog (e.g. a plain-text click sent focus
      // to the body), the next Tab must re-enter the trap rather than escape
      // behind the modal.
      const root = dialogRef.current
      const withinDialog = !!root && root.contains(document.activeElement)
      if (!withinDialog) {
        e.preventDefault()
        ;(e.shiftKey ? last : first).focus()
        return
      }
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      // N2 (docs/qa/mcp-access-stage1-review-2026-09-22.md section 13): the
      // Issue key button is not always a valid close target, it may be
      // unmounted (list reloading, error branch) or disabled (at the key
      // cap). Fall back to the always-rendered section heading.
      const btn = issueBtnRef.current
      if (btn && btn.isConnected && !btn.disabled) {
        btn.focus()
      } else {
        headerRef.current?.focus()
      }
    }
  }, [reveal])

  if (isDemoMode) return null

  const unlockPlan = featureUnlockPlan('mcp_access')  // 'radar' today
  // Section 7.2: the full (Issue-enabled) branch, or admin. See the file header
  // note above for why this is a frontend branch choice, not a server bypass.
  const gated = hasFeature(plan, 'mcp_access') || isAdmin

  const issueKey = async () => {
    setIssueError(null); setIssuing(true)
    try {
      const { data } = await callKeysFn<{ key: KeyRow; secret: string }>({
        action: 'issue', client_id: clientId, label: label.trim() || undefined, scope,
      })
      if (!data || data.error || !data.secret) {
        setIssueError(data?.error || 'Could not issue a key. Try again, and if it keeps happening, contact support@getbrandgeo.com.'); return
      }
      setReveal({ secret: data.secret, row: data.key })
      setLabel('')
      setScope('read')
      load()
    } catch {
      setIssueError('Could not issue a key. Try again, and if it keeps happening, contact support@getbrandgeo.com.')
    } finally {
      setIssuing(false)
    }
  }

  const revokeKey = async (row: KeyRow) => {
    if (!window.confirm(`Revoke "${row.label || row.key_prefix}"? Any AI tool using this key stops working immediately.`)) return
    setActionError(null); setRevokingId(row.id)
    try {
      const { data } = await callKeysFn<{ ok: boolean }>({ action: 'revoke', client_id: clientId, id: row.id })
      if (!data || data.error) { setActionError(data?.error || 'Could not revoke the key. Try again, and if it keeps happening, contact support@getbrandgeo.com.'); return }
      load()
    } catch {
      setActionError('Could not revoke the key. Try again, and if it keeps happening, contact support@getbrandgeo.com.')
    } finally {
      setRevokingId(null)
    }
  }

  const closeReveal = () => setReveal(null)  // drops the secret from state; never persisted anywhere

  const Header = (
    // N2 (docs/qa/mcp-access-stage1-review-2026-09-22.md section 13):
    // tabIndex={-1} makes this a valid programmatic focus target (never a
    // tab stop) so the reveal dialog can return focus here when the Issue
    // key button is absent or disabled. outline-none is safe since focus
    // only ever lands here via script, never by keyboard navigation.
    <h2 ref={headerRef} tabIndex={-1} className="text-sm font-semibold text-ink-2 mb-1 flex items-center gap-2 outline-none">
      <KeyRound size={15} className="text-ink-3" /> MCP access
    </h2>
  )

  // F3 (docs/qa/mcp-access-stage1-review-2026-09-22.md): the reveal dialog
  // depends only on `reveal`, never on `loading`/`unavailable`/`loadError`,
  // so it renders in every branch below (including while the post-issue
  // list reload is in flight or fails) and a reload failure never hides it.
  const revealDialog = reveal && (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="mcp-reveal-title"
        className="w-full max-w-xl bg-dark-800 border border-dark-700 rounded-xl p-6 my-6 max-h-[85vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-3">
          <h3 id="mcp-reveal-title" className="text-base font-semibold text-ink flex items-center gap-2"><Lock size={15} className="text-accent-ink" /> Your new MCP key</h3>
          <button onClick={closeReveal} className="text-ink-2 hover:text-ink text-sm" aria-label="Done, I have copied the key">Done</button>
        </div>

        <p className="text-xs text-warn flex items-start gap-1.5 mb-3">
          <AlertTriangle size={13} className="shrink-0 mt-0.5" />
          This key is shown once. Copy it now. BrandGEO cannot show it again.
        </p>

        <div className="flex gap-2 mb-5">
          <input ref={secretInputRef} readOnly value={reveal.secret} onFocus={e => e.currentTarget.select()} className={`${inputCls} font-mono text-xs`} />
          <CopyBtn text={reveal.secret} />
        </div>

        <h4 className="text-xs font-semibold text-ink-2 uppercase tracking-wide mb-2 flex items-center gap-1.5">
          <Terminal size={13} /> Setup
        </h4>
        <div className="space-y-3">
          {setupSnippets(reveal.secret).map(s => (
            <div key={s.client}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-ink-2">{s.client}</span>
                <CopyBtn text={s.code} />
              </div>
              {s.note && <p className="text-meta text-ink-3 mb-1">{s.note}</p>}
              <pre className="bg-dark-900 border border-dark-700 rounded-lg p-3 text-meta text-ink-2 overflow-x-auto whitespace-pre-wrap break-all">{s.code}</pre>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  // ── loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <>
        <div className="bg-dark-800 rounded-xl p-6 mb-6">
          {Header}
          <div className="flex items-center gap-2 text-sm text-ink-3 mt-4">
            <Loader2 size={15} className="animate-spin" /> Loading your MCP keys…
          </div>
        </div>
        {revealDialog}
      </>
    )
  }

  // ── unavailable (503: function shipped ahead of the migration) ────────────
  if (unavailable) {
    return (
      <>
        <div className="bg-dark-800 rounded-xl p-6 mb-6">
          {Header}
          <p className="text-xs text-ink-3 mt-3">MCP access isn't set up on our side yet. Check back soon, or contact support@getbrandgeo.com if this doesn't clear up.</p>
        </div>
        {revealDialog}
      </>
    )
  }

  // ── error ───────────────────────────────────────────────────────────────
  if (loadError || !list) {
    return (
      <>
        <div className="bg-dark-800 rounded-xl p-6 mb-6">
          {Header}
          <div className="flex items-center gap-3 mt-3 flex-wrap">
            <span className="text-xs text-neg flex items-center gap-1.5"><AlertTriangle size={13} /> {loadError || 'Could not load MCP keys. Try again, and if it keeps happening, contact support@getbrandgeo.com.'}</span>
            <button onClick={load} className={ghostBtn}>Retry</button>
          </div>
          <ConnectedAppsBlock apps={apps} gated={gated} />
        </div>
        {revealDialog}
      </>
    )
  }

  const { keys, max_keys } = list
  const atCap = keys.length >= max_keys
  // COPY: pending bg-copy. Placeholder explanation line (section 7.2 item 1);
  // final wording from bg-copy.
  const explanationLine = "Give your own AI tools, such as Claude Code or Cursor, direct read access to this account's visibility data. No key can start a collection or change your plan or billing; a read and write key can only mark Fix This items done."

  const KeysTable = keys.length > 0 && (
    <div className="mt-4 overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="text-left text-ink-3 uppercase tracking-wide text-meta">
            <th className="pb-2 pr-4 font-medium">Label</th>
            <th className="pb-2 pr-4 font-medium">Key</th>
            <th className="pb-2 pr-4 font-medium">Access</th>
            <th className="pb-2 pr-4 font-medium">Created</th>
            <th className="pb-2 pr-4 font-medium">Last used</th>
            <th className="pb-2 font-medium"><span className="sr-only">Actions</span></th>
          </tr>
        </thead>
        <tbody>
          {keys.map(k => (
            <tr key={k.id} className="border-t border-dark-700">
              <td className="py-2 pr-4 text-ink">{k.label || <span className="italic text-ink-3">Untitled</span>}</td>
              <td className="py-2 pr-4"><code className="text-accent-ink font-mono">{k.key_prefix}…</code></td>
              <td className="py-2 pr-4 text-ink-2">{scopeLabel(k.scope)}</td>
              <td className="py-2 pr-4 text-ink-2">{fmtDT(k.created_at)}</td>
              <td className="py-2 pr-4 text-ink-2">{k.last_used_at ? fmtDT(k.last_used_at) : 'never'}</td>
              <td className="py-2">
                <button
                  onClick={() => revokeKey(k)}
                  disabled={revokingId === k.id}
                  className="inline-flex items-center gap-1 text-neg hover:text-neg disabled:opacity-50"
                >
                  {revokingId === k.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />} Revoke
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {actionError && <p className="text-xs text-neg mt-2">{actionError}</p>}
    </div>
  )

  // ── below the gate: locked-by-plan (no keys) or partial (old keys survive) ─
  if (!gated) {
    return (
      <>
        <div className="bg-dark-800 rounded-xl p-6 mb-6">
          {Header}
          <p className="text-xs text-ink-2 mt-2">
            MCP access is included from the {PLAN_LABELS[unlockPlan ?? 'radar']} plan.
          </p>
          <button onClick={onUpgrade} className={`${primaryBtn} mt-3`}>
            <Sparkles size={15} /> Upgrade to Radar
          </button>
          {keys.length > 0 && (
            <>
              <p className="text-meta text-ink-3 mt-4">
                Keys issued before your plan changed are listed below. They will work again after upgrading.
              </p>
              {KeysTable}
            </>
          )}
          <ConnectedAppsBlock apps={apps} gated={gated} />
        </div>
        {revealDialog}
      </>
    )
  }

  // ── gated: empty or success ────────────────────────────────────────────
  return (
    <>
      <div className="bg-dark-800 rounded-xl p-6 mb-6">
        {Header}
        <p className="text-xs text-ink-3 mt-1 mb-4">
          {explanationLine}
        </p>
        {/* F1 (docs/qa/mcp-access-stage1-review-2026-09-22.md): the "Learn
            more" link to getbrandgeo.com/mcp.html was held out of stage 1 on
            bg-orchestrator's ruling, since that page ships last in the
            spec's release order (docs/arch/mcp-access.md section 12) and the
            link 404s until then. Re-add once mcp.html is live. */}

        <div className="flex flex-wrap items-end gap-3">
          <label className="block">
            <span className="block text-meta uppercase tracking-wide text-ink-3 mb-1">Label (optional)</span>
            <input
              value={label}
              onChange={e => setLabel(e.target.value.slice(0, 60))}
              maxLength={60}
              placeholder="e.g. Cursor, laptop"
              className={`${inputCls} w-56`}
            />
          </label>
          <fieldset className="block">
            <legend className="block text-meta uppercase tracking-wide text-ink-3 mb-1">Access</legend>
            <div role="radiogroup" aria-label="Access" className="flex flex-col gap-1.5">
              {([
                ['read', 'Read only'],
                ['read_write', 'Read and write (lets an AI agent mark Fix This items done)'],
              ] as [KeyScope, string][]).map(([v, text]) => (
                <label key={v} className="flex items-start gap-2 text-xs text-ink-2 cursor-pointer">
                  <input
                    type="radio"
                    name="mcp-key-scope"
                    value={v}
                    checked={scope === v}
                    onChange={() => setScope(v)}
                    className="mt-0.5 accent-brand-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-ink"
                  />
                  <span>{text}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <button ref={issueBtnRef} onClick={issueKey} disabled={issuing || atCap} className={primaryBtn}>
            {issuing ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />} Issue key
          </button>
          {atCap && <span className="text-xs text-ink-3">Revoke a key to issue a new one.</span>}
        </div>
        {issueError && <p className="text-xs text-neg mt-2">{issueError}</p>}

        {keys.length === 0 ? (
          <p className="text-xs text-ink-3 mt-4">No keys yet. Issue one to connect your first AI tool.</p>
        ) : KeysTable}
        <ConnectedAppsBlock apps={apps} gated={gated} />
      </div>
      {revealDialog}
    </>
  )
}
