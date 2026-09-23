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
 *   action 'issue'  body {client_id, label?}     -> 200 { key: KeyRow, secret: string } (secret shown once)
 *                                                    403 below plan gate { error, required_plan }
 *                                                    403 research client, not admin-issued { error }
 *                                                    409 at max_keys { error }
 *                                                    400 label over 60 chars { error }
 *   action 'revoke' body {client_id, id}         -> 200 { ok: true, id }
 *                                                    404 no active key with that id+client_id { error }
 *   Any action, table not migrated yet           -> 503 { error }
 *
 *   KeyRow (never includes the secret or its hash): { id, key_prefix, label, created_at, last_used_at }
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
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  KeyRound, Loader2, Check, Copy, Plus, Lock, AlertTriangle, Terminal, Trash2, Sparkles,
} from 'lucide-react'
import { supabase, isDemoMode } from '../lib/supabase'
import { copyText } from '../lib/affiliateApi'
import { hasFeature, featureUnlockPlan, PLAN_LABELS } from '../lib/planConfig'

interface KeyRow {
  id: string
  key_prefix: string
  label: string
  created_at: string
  last_used_at: string | null
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

function fmtDT(iso: string | null): string {
  if (!iso) return 'never'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return 'never'
  return d.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })
}

const inputCls = 'w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-brand-500'
const primaryBtn = 'inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-brand-500 text-white hover:bg-brand-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
const ghostBtn = 'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-dark-700 hover:bg-dark-600 text-slate-200 border border-dark-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'

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

  const load = useCallback(async () => {
    setLoading(true); setUnavailable(false); setLoadError(null)
    try {
      const { status, data } = await callKeysFn<ListResponse>({ action: 'list', client_id: clientId })
      if (status === 503) { setUnavailable(true); setLoading(false); return }
      if (!data || data.error || status >= 400) {
        setLoadError(data?.error || 'Could not load MCP keys.'); setLoading(false); return
      }
      setList(data)
    } catch {
      setLoadError('Could not load MCP keys.')
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
        action: 'issue', client_id: clientId, label: label.trim() || undefined,
      })
      if (!data || data.error || !data.secret) {
        setIssueError(data?.error || 'Could not issue a key.'); return
      }
      setReveal({ secret: data.secret, row: data.key })
      setLabel('')
      load()
    } catch {
      setIssueError('Could not issue a key.')
    } finally {
      setIssuing(false)
    }
  }

  const revokeKey = async (row: KeyRow) => {
    if (!window.confirm(`Revoke "${row.label || row.key_prefix}"? Any AI tool using this key stops working immediately.`)) return
    setActionError(null); setRevokingId(row.id)
    try {
      const { data } = await callKeysFn<{ ok: boolean }>({ action: 'revoke', client_id: clientId, id: row.id })
      if (!data || data.error) { setActionError(data?.error || 'Could not revoke the key.'); return }
      load()
    } catch {
      setActionError('Could not revoke the key.')
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
    <h2 ref={headerRef} tabIndex={-1} className="text-sm font-semibold text-slate-300 mb-1 flex items-center gap-2 outline-none">
      <KeyRound size={15} className="text-slate-500" /> MCP access
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
          <h3 id="mcp-reveal-title" className="text-base font-semibold text-white flex items-center gap-2"><Lock size={15} className="text-brand-300" /> Your new MCP key</h3>
          <button onClick={closeReveal} className="text-slate-400 hover:text-white text-sm" aria-label="Done, I have copied the key">Done</button>
        </div>

        <p className="text-xs text-amber-300 flex items-start gap-1.5 mb-3">
          <AlertTriangle size={13} className="shrink-0 mt-0.5" />
          This key is shown once. Copy it now. BrandGEO cannot show it again.
        </p>

        <div className="flex gap-2 mb-5">
          <input ref={secretInputRef} readOnly value={reveal.secret} onFocus={e => e.currentTarget.select()} className={`${inputCls} font-mono text-xs`} />
          <CopyBtn text={reveal.secret} />
        </div>

        <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wide mb-2 flex items-center gap-1.5">
          <Terminal size={13} /> Setup
        </h4>
        <div className="space-y-3">
          {setupSnippets(reveal.secret).map(s => (
            <div key={s.client}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-slate-300">{s.client}</span>
                <CopyBtn text={s.code} />
              </div>
              {s.note && <p className="text-[10px] text-slate-600 mb-1">{s.note}</p>}
              <pre className="bg-dark-900 border border-dark-700 rounded-lg p-3 text-[11px] text-slate-300 overflow-x-auto whitespace-pre-wrap break-all">{s.code}</pre>
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
          <div className="flex items-center gap-2 text-sm text-slate-500 mt-4">
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
          <p className="text-xs text-slate-500 mt-3">MCP access is not available yet. Check back soon.</p>
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
            <span className="text-xs text-red-400 flex items-center gap-1.5"><AlertTriangle size={13} /> {loadError || 'Could not load MCP keys.'}</span>
            <button onClick={load} className={ghostBtn}>Retry</button>
          </div>
        </div>
        {revealDialog}
      </>
    )
  }

  const { keys, max_keys } = list
  const atCap = keys.length >= max_keys
  // COPY: pending bg-copy. Placeholder explanation line (section 7.2 item 1);
  // final wording from bg-copy.
  const explanationLine = 'Connect Claude Code, Cursor and other MCP-compatible AI tools to read your BrandGEO visibility data.'

  const KeysTable = keys.length > 0 && (
    <div className="mt-4 overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="text-left text-slate-500 uppercase tracking-wide text-[10px]">
            <th className="pb-2 pr-4 font-medium">Label</th>
            <th className="pb-2 pr-4 font-medium">Key</th>
            <th className="pb-2 pr-4 font-medium">Created</th>
            <th className="pb-2 pr-4 font-medium">Last used</th>
            <th className="pb-2 font-medium"><span className="sr-only">Actions</span></th>
          </tr>
        </thead>
        <tbody>
          {keys.map(k => (
            <tr key={k.id} className="border-t border-dark-700">
              <td className="py-2 pr-4 text-slate-200">{k.label || <span className="italic text-slate-500">Untitled</span>}</td>
              <td className="py-2 pr-4"><code className="text-brand-300 font-mono">{k.key_prefix}…</code></td>
              <td className="py-2 pr-4 text-slate-400">{fmtDT(k.created_at)}</td>
              <td className="py-2 pr-4 text-slate-400">{k.last_used_at ? fmtDT(k.last_used_at) : 'never'}</td>
              <td className="py-2">
                <button
                  onClick={() => revokeKey(k)}
                  disabled={revokingId === k.id}
                  className="inline-flex items-center gap-1 text-red-400 hover:text-red-300 disabled:opacity-50"
                >
                  {revokingId === k.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />} Revoke
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {actionError && <p className="text-xs text-red-400 mt-2">{actionError}</p>}
    </div>
  )

  // ── below the gate: locked-by-plan (no keys) or partial (old keys survive) ─
  if (!gated) {
    return (
      <>
        <div className="bg-dark-800 rounded-xl p-6 mb-6">
          {Header}
          <p className="text-xs text-slate-400 mt-2">
            MCP access is included from the {PLAN_LABELS[unlockPlan ?? 'radar']} plan.
          </p>
          <button onClick={onUpgrade} className={`${primaryBtn} mt-3`}>
            <Sparkles size={15} /> See plans
          </button>
          {keys.length > 0 && (
            <>
              <p className="text-[11px] text-slate-600 mt-4">
                Keys issued before your plan changed are listed below. They will work again after upgrading.
              </p>
              {KeysTable}
            </>
          )}
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
        <p className="text-xs text-slate-500 mt-1 mb-4">
          {explanationLine}
        </p>
        {/* F1 (docs/qa/mcp-access-stage1-review-2026-09-22.md): the "Learn
            more" link to getbrandgeo.com/mcp.html was held out of stage 1 on
            bg-orchestrator's ruling, since that page ships last in the
            spec's release order (docs/arch/mcp-access.md section 12) and the
            link 404s until then. Re-add once mcp.html is live. */}

        <div className="flex flex-wrap items-end gap-3">
          <label className="block">
            <span className="block text-[10px] uppercase tracking-wide text-slate-500 mb-1">Label (optional)</span>
            <input
              value={label}
              onChange={e => setLabel(e.target.value.slice(0, 60))}
              maxLength={60}
              placeholder="e.g. Cursor, laptop"
              className={`${inputCls} w-56`}
            />
          </label>
          <button ref={issueBtnRef} onClick={issueKey} disabled={issuing || atCap} className={primaryBtn}>
            {issuing ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />} Issue key
          </button>
          {atCap && <span className="text-xs text-slate-500">Revoke a key to issue a new one.</span>}
        </div>
        {issueError && <p className="text-xs text-red-400 mt-2">{issueError}</p>}

        {keys.length === 0 ? (
          <p className="text-xs text-slate-500 mt-4">No keys yet. Issue one to connect your first AI tool.</p>
        ) : KeysTable}
      </div>
      {revealDialog}
    </>
  )
}
