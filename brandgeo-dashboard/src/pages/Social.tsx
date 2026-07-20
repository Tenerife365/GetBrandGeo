import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Instagram, Facebook, Linkedin, MapPin, Twitter, Link2, RefreshCw, Send,
  CalendarClock, CheckCircle2, AlertTriangle, Clock, Sparkles, ExternalLink, Plus,
} from 'lucide-react'
import { supabase, isDemoMode } from '../lib/supabase'
import { useClient } from '../lib/clientContext'
import type {
  SocialAccount, SocialMedia, SocialPlatform, SocialPost, SocialPostTarget, SocialTargetStatus,
} from '../types'

// ── Platform metadata ────────────────────────────────────────────────────────
// Internal ids mirror _publishing.js PLATFORMS + the DB check constraints.
// X is listed but disabled for the MVP (paid API) — see AI-SOCIAL.md.
const PLATFORMS: {
  id: SocialPlatform
  label: string
  icon: typeof Instagram
  limit: number
  hint: string
  mvp: boolean
}[] = [
  { id: 'instagram', label: 'Instagram',             icon: Instagram, limit: 2200,  hint: 'Needs at least one image or video.', mvp: true },
  { id: 'facebook',  label: 'Facebook',              icon: Facebook,  limit: 63206, hint: 'Conversational tone works best.',    mvp: true },
  { id: 'linkedin',  label: 'LinkedIn',              icon: Linkedin,  limit: 3000,  hint: '3 to 5 hashtags, professional.',     mvp: true },
  { id: 'gbp',       label: 'Google Business',       icon: MapPin,    limit: 1500,  hint: 'Include a clear call to action.',    mvp: true },
  { id: 'x',         label: 'X',                     icon: Twitter,   limit: 280,   hint: 'Paid API, not enabled yet.',         mvp: false },
]

const platformMeta = (id: SocialPlatform) => PLATFORMS.find(p => p.id === id)

type Tab = 'accounts' | 'composer' | 'calendar'

interface PublishTargetResult {
  platform: SocialPlatform
  status: SocialTargetStatus
  ref?: string | null
  permalink?: string | null
  error?: string | null
}

// ── Shared styles (DESIGN-SYSTEM.md tokens) ──────────────────────────────────
const card = 'bg-dark-800 border border-dark-700 rounded-xl'
const inputCls = 'w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-brand-500'
const primaryBtn = 'inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-brand-500 text-white hover:bg-brand-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
const secondaryBtn = 'inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-dark-700 text-slate-200 border border-dark-600 hover:bg-dark-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { cls: string; icon: typeof Clock; label: string }> = {
    published: { cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30', icon: CheckCircle2,  label: 'Published' },
    scheduled: { cls: 'bg-brand-500/10 text-brand-300 border-brand-500/30',       icon: CalendarClock, label: 'Scheduled' },
    publishing:{ cls: 'bg-brand-500/10 text-brand-300 border-brand-500/30',       icon: Clock,         label: 'Publishing' },
    pending:   { cls: 'bg-dark-700 text-slate-400 border-dark-600',               icon: Clock,         label: 'Pending' },
    draft:     { cls: 'bg-dark-700 text-slate-400 border-dark-600',               icon: Clock,         label: 'Draft' },
    partial:   { cls: 'bg-amber-500/10 text-amber-400 border-amber-500/30',       icon: AlertTriangle, label: 'Partial' },
    failed:    { cls: 'bg-rose-500/10 text-rose-400 border-rose-500/30',          icon: AlertTriangle, label: 'Failed' },
    skipped:   { cls: 'bg-dark-700 text-slate-500 border-dark-600',               icon: Clock,         label: 'Skipped' },
    canceled:  { cls: 'bg-dark-700 text-slate-500 border-dark-600',               icon: Clock,         label: 'Canceled' },
  }
  const m = map[status] ?? map.pending
  const Icon = m.icon
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs border ${m.cls}`}>
      <Icon size={12} /> {m.label}
    </span>
  )
}

// Parse the media textarea (one URL per line) into the SocialMedia[] the API wants.
function parseMedia(raw: string): SocialMedia[] {
  return raw
    .split(/[\n,]/)
    .map(s => s.trim())
    .filter(Boolean)
    .map(url => ({ url, type: /\.(mp4|mov|m4v|webm)(\?|$)/i.test(url) ? 'video' as const : 'image' as const }))
}

async function authedPost<T>(fn: string, body: unknown): Promise<T> {
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token ?? ''
  const res = await fetch(`/.netlify/functions/${fn}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error((data as { error?: string })?.error || `Request failed (${res.status})`)
  return data as T
}

interface AyrProfile {
  title: string | null
  refId: string | null
  status: string | null
  suspended: boolean
  platforms: SocialPlatform[]
  claimed_by: number | null
}

interface Binding {
  bound: boolean
  profile_title: string | null
  ref_id: string | null
  key_hint: string | null
}

export default function Social() {
  const { activeClientId, activeClient, isAdmin } = useClient()
  const [tab, setTab] = useState<Tab>('composer')

  // ── Accounts ───────────────────────────────────────────────────────────────
  const [accounts, setAccounts] = useState<SocialAccount[]>([])
  const [accountsLoading, setAccountsLoading] = useState(true)
  const [configured, setConfigured] = useState(true)
  const [accountsNote, setAccountsNote] = useState<string | null>(null)
  const [linking, setLinking] = useState(false)

  // ── Profile binding (which Ayrshare workspace this client publishes to) ────
  const [binding, setBinding] = useState<Binding | null>(null)
  const [profiles, setProfiles] = useState<AyrProfile[]>([])
  const [pickerOpen, setPickerOpen] = useState(false)
  const [profilesLoading, setProfilesLoading] = useState(false)
  const [chosenRef, setChosenRef] = useState<string | null>(null)
  const [keyInput, setKeyInput] = useState('')
  const [newTitle, setNewTitle] = useState('')
  const [bindBusy, setBindBusy] = useState(false)
  const [bindMsg, setBindMsg] = useState<{ ok: boolean; text: string } | null>(null)

  const loadAccounts = useCallback(async () => {
    if (!activeClientId || isDemoMode) { setAccountsLoading(false); return }
    setAccountsLoading(true)
    try {
      const data = await authedPost<{ configured: boolean; bound?: boolean; profile_title?: string | null; accounts: SocialAccount[]; hint?: string; error?: string }>(
        'social-accounts', { client_id: activeClientId },
      )
      setConfigured(data.configured !== false)
      setAccounts(data.accounts ?? [])
      setAccountsNote(data.hint ?? data.error ?? null)
      // social-accounts reports binding too, so a non-admin also sees why the
      // list is empty rather than an unexplained blank tab.
      if (data.bound !== undefined) {
        setBinding(prev => ({
          bound: !!data.bound,
          profile_title: data.profile_title ?? prev?.profile_title ?? null,
          ref_id: prev?.ref_id ?? null,
          key_hint: prev?.key_hint ?? null,
        }))
      }
    } catch (e) {
      setAccountsNote((e as Error).message)
      setAccounts([])
    } finally {
      setAccountsLoading(false)
    }
  }, [activeClientId])

  useEffect(() => { loadAccounts() }, [loadAccounts])

  const connected = useMemo(
    () => new Set(accounts.filter(a => a.status !== 'disconnected').map(a => a.platform)),
    [accounts],
  )

  // Admin: read the current binding (and the key hint, which social-accounts
  // does not carry). Non-admins get their binding state from social-accounts.
  const loadBinding = useCallback(async () => {
    if (!activeClientId || isDemoMode || !isAdmin) return
    try {
      const data = await authedPost<Binding & { error?: string }>(
        'social-profile', { client_id: activeClientId, action: 'get' },
      )
      if (!data.error) setBinding(data)
    } catch { /* the Accounts tab still renders; binding UI just stays collapsed */ }
  }, [activeClientId, isAdmin])

  useEffect(() => { loadBinding() }, [loadBinding])

  // Reset the picker when switching clients — a half-entered key must never
  // carry over to a different workspace.
  useEffect(() => {
    setPickerOpen(false); setChosenRef(null); setKeyInput(''); setNewTitle(''); setBindMsg(null)
  }, [activeClientId])

  const loadProfiles = async () => {
    setProfilesLoading(true); setBindMsg(null)
    try {
      const data = await authedPost<{ profiles: AyrProfile[]; hint?: string; error?: string }>(
        'social-profile', { client_id: activeClientId, action: 'list' },
      )
      if (data.error) { setBindMsg({ ok: false, text: data.error }); return }
      setProfiles(data.profiles ?? [])
      if (!data.profiles?.length) {
        setBindMsg({ ok: false, text: data.hint || 'No profiles found on the Ayrshare account.' })
      }
    } catch (e) {
      setBindMsg({ ok: false, text: (e as Error).message })
    } finally {
      setProfilesLoading(false)
    }
  }

  const openPicker = () => { setPickerOpen(true); if (!profiles.length) loadProfiles() }

  const bindProfile = async () => {
    if (!keyInput.trim() || bindBusy) return
    setBindBusy(true); setBindMsg(null)
    const chosen = profiles.find(p => p.refId === chosenRef)
    try {
      const data = await authedPost<Binding & { accounts?: SocialAccount[]; error?: string }>(
        'social-profile',
        {
          client_id: activeClientId,
          action: 'bind',
          profile_key: keyInput.trim(),
          ref_id: chosen?.refId ?? null,
          profile_title: chosen?.title ?? null,
        },
      )
      if (data.error) { setBindMsg({ ok: false, text: data.error }); return }
      setBinding(data)
      setKeyInput(''); setPickerOpen(false)
      const n = data.accounts?.length ?? 0
      setBindMsg({
        ok: true,
        text: `Linked to ${data.profile_title || 'the profile'}. ${n} channel${n === 1 ? '' : 's'} connected.`,
      })
      loadAccounts()
    } catch (e) {
      setBindMsg({ ok: false, text: (e as Error).message })
    } finally {
      setBindBusy(false)
    }
  }

  const createProfile = async () => {
    if (!newTitle.trim() || bindBusy) return
    setBindBusy(true); setBindMsg(null)
    try {
      const data = await authedPost<Binding & { hint?: string; error?: string }>(
        'social-profile', { client_id: activeClientId, action: 'create', title: newTitle.trim() },
      )
      if (data.error) { setBindMsg({ ok: false, text: data.error }); return }
      setBinding(data)
      setNewTitle(''); setPickerOpen(false)
      setBindMsg({ ok: true, text: data.hint || 'Profile created and linked.' })
      loadAccounts()
    } catch (e) {
      setBindMsg({ ok: false, text: (e as Error).message })
    } finally {
      setBindBusy(false)
    }
  }

  const unbindProfile = async () => {
    if (bindBusy) return
    setBindBusy(true); setBindMsg(null)
    try {
      await authedPost('social-profile', { client_id: activeClientId, action: 'unbind' })
      setBinding({ bound: false, profile_title: null, ref_id: null, key_hint: null })
      setAccounts([])
      setBindMsg({ ok: true, text: 'Unlinked. Publishing is blocked for this client until a profile is linked again.' })
    } catch (e) {
      setBindMsg({ ok: false, text: (e as Error).message })
    } finally {
      setBindBusy(false)
    }
  }

  const startLinking = async () => {
    setLinking(true)
    try {
      const data = await authedPost<{ url: string | null; hint?: string; error?: string }>(
        'social-link', { client_id: activeClientId },
      )
      if (data.url) { window.open(data.url, '_blank', 'noopener'); return }
      setAccountsNote(data.hint || data.error || 'In-app linking is not available on this plan.')
    } catch (e) {
      setAccountsNote((e as Error).message)
    } finally {
      setLinking(false)
    }
  }

  // ── Composer ───────────────────────────────────────────────────────────────
  const [baseText, setBaseText] = useState('')
  const [mediaRaw, setMediaRaw] = useState('')
  const [selected, setSelected] = useState<SocialPlatform[]>([])
  const [overrides, setOverrides] = useState<Partial<Record<SocialPlatform, string>>>({})
  const [scheduledAt, setScheduledAt] = useState('')
  const [publishing, setPublishing] = useState(false)
  const [result, setResult] = useState<{ ok: boolean; text: string; targets?: PublishTargetResult[] } | null>(null)

  // AI generation (Phase 2 — social-generate.js)
  const [brief, setBrief] = useState('')
  const [generating, setGenerating] = useState(false)
  const [genError, setGenError] = useState<string | null>(null)

  // Pre-select the connected MVP platforms once accounts load, without stomping
  // a selection the user has already made.
  const [autoSelected, setAutoSelected] = useState(false)
  useEffect(() => {
    if (autoSelected || accountsLoading) return
    const initial = PLATFORMS.filter(p => p.mvp && connected.has(p.id)).map(p => p.id)
    if (initial.length) { setSelected(initial); setAutoSelected(true) }
  }, [accountsLoading, connected, autoSelected])

  // Reset the composer when the workspace changes — a draft belongs to one client.
  useEffect(() => {
    setBaseText(''); setMediaRaw(''); setSelected([]); setOverrides({})
    setScheduledAt(''); setResult(null); setBrief(''); setGenError(null); setAutoSelected(false)
  }, [activeClientId])

  const togglePlatform = (id: SocialPlatform) => {
    setSelected(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id])
  }

  const textFor = (id: SocialPlatform) => overrides[id] ?? baseText

  const generate = async () => {
    if (!brief.trim() || generating) return
    setGenerating(true); setGenError(null)
    try {
      const data = await authedPost<{ base_text?: string; platforms?: Partial<Record<SocialPlatform, string>>; error?: string }>(
        'social-generate',
        {
          client_id: activeClientId,
          brief: brief.trim(),
          platforms: selected.length ? selected : PLATFORMS.filter(p => p.mvp).map(p => p.id),
        },
      )
      if (data.base_text) setBaseText(data.base_text)
      if (data.platforms) {
        setOverrides(prev => ({ ...prev, ...data.platforms }))
        // Surface what was generated so the per-platform cards are open to review.
        const generated = Object.keys(data.platforms) as SocialPlatform[]
        setSelected(prev => Array.from(new Set([...prev, ...generated.filter(p => platformMeta(p)?.mvp)])))
      }
    } catch (e) {
      setGenError((e as Error).message)
    } finally {
      setGenerating(false)
    }
  }

  const publish = async () => {
    if (publishing) return
    setResult(null)
    if (!selected.length) { setResult({ ok: false, text: 'Pick at least one platform.' }); return }
    const media = parseMedia(mediaRaw)
    if (selected.includes('instagram') && !media.length) {
      setResult({ ok: false, text: 'Instagram needs at least one image or video URL.' })
      return
    }
    const tooLong = selected.find(p => {
      const meta = platformMeta(p)
      return meta && textFor(p).length > meta.limit
    })
    if (tooLong) {
      setResult({ ok: false, text: `${platformMeta(tooLong)!.label} text is over its ${platformMeta(tooLong)!.limit} character limit.` })
      return
    }
    if (!baseText.trim() && selected.some(p => !overrides[p]?.trim())) {
      setResult({ ok: false, text: 'Write the base post, or give every selected platform its own text.' })
      return
    }

    setPublishing(true)
    try {
      const data = await authedPost<{ post_id: number; status: string; targets?: PublishTargetResult[]; error?: string }>(
        'social-publish',
        {
          client_id: activeClientId,
          base_text: baseText,
          base_media: media,
          source: Object.keys(overrides).length && brief ? 'ai' : 'manual',
          brief: brief || null,
          scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : null,
          targets: selected.map(p => ({
            platform: p,
            text: overrides[p] ?? null,
            media: null,
          })),
        },
      )
      if (data.error) { setResult({ ok: false, text: data.error }); return }
      const failed = (data.targets ?? []).filter(t => t.status === 'failed')
      setResult({
        ok: data.status === 'published' || data.status === 'scheduled',
        text: data.status === 'scheduled'
          ? 'Scheduled.'
          : failed.length
            ? `Published with ${failed.length} failure${failed.length > 1 ? 's' : ''}.`
            : 'Published.',
        targets: data.targets,
      })
      loadPosts()
    } catch (e) {
      setResult({ ok: false, text: (e as Error).message })
    } finally {
      setPublishing(false)
    }
  }

  // ── Calendar / queue ───────────────────────────────────────────────────────
  const [posts, setPosts] = useState<(SocialPost & { targets: SocialPostTarget[] })[]>([])
  const [postsLoading, setPostsLoading] = useState(true)
  const [refreshingId, setRefreshingId] = useState<number | null>(null)

  const loadPosts = useCallback(async () => {
    if (!activeClientId || isDemoMode) { setPostsLoading(false); return }
    setPostsLoading(true)
    const { data } = await supabase
      .from('social_posts')
      .select('*, targets:social_post_targets(*)')
      .eq('client_id', activeClientId)
      .order('created_at', { ascending: false })
      .limit(50)
    setPosts((data as (SocialPost & { targets: SocialPostTarget[] })[]) ?? [])
    setPostsLoading(false)
  }, [activeClientId])

  useEffect(() => { loadPosts() }, [loadPosts])

  const refreshStatus = async (postId: number) => {
    setRefreshingId(postId)
    try {
      await authedPost('social-status', { client_id: activeClientId, post_id: postId })
      await loadPosts()
    } catch { /* status refresh is best-effort — the stored status stays */ }
    setRefreshingId(null)
  }

  const scheduled = posts.filter(p => p.status === 'scheduled')
  const history = posts.filter(p => p.status !== 'scheduled')

  // ── Render ─────────────────────────────────────────────────────────────────
  const tabs: { id: Tab; label: string }[] = [
    { id: 'composer', label: 'Composer' },
    { id: 'calendar', label: 'Calendar' },
    { id: 'accounts', label: 'Accounts' },
  ]

  return (
    <div className="p-4 sm:p-6 md:p-10 max-w-5xl mx-auto">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold text-white tracking-tight">AI Social</h1>
        <p className="text-sm text-slate-400 mt-1">
          Write once, adapt per platform, publish or schedule for {activeClient?.name ?? 'this workspace'}.
        </p>
      </header>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-dark-700" role="tablist" aria-label="AI Social sections">
        {tabs.map(tb => (
          <button
            key={tb.id}
            role="tab"
            aria-selected={tab === tb.id}
            onClick={() => setTab(tb.id)}
            className={[
              'px-4 py-2.5 text-sm rounded-t-lg border-b-2 -mb-px transition-colors',
              tab === tb.id
                ? 'border-brand-400 text-brand-300 font-medium'
                : 'border-transparent text-slate-400 hover:text-slate-200',
            ].join(' ')}
          >
            {tb.label}
            {tb.id === 'calendar' && scheduled.length > 0 && (
              <span className="ml-2 text-xs text-slate-500">{scheduled.length}</span>
            )}
          </button>
        ))}
      </div>

      {!configured && (
        <div className={`${card} p-4 mb-6 flex items-start gap-3`}>
          <AlertTriangle size={18} className="text-amber-400 shrink-0 mt-0.5" />
          <div className="text-sm text-slate-300">
            <p className="font-medium text-white">Publishing is not configured yet.</p>
            <p className="text-slate-400 mt-1">
              Add <code className="text-slate-300">AYRSHARE_API_KEY</code> to the Netlify environment
              variables, then reload this page.
            </p>
          </div>
        </div>
      )}

      {/* ── ACCOUNTS ─────────────────────────────────────────────────────── */}
      {tab === 'accounts' && (
        <section className="space-y-4">
          {/* Which Ayrshare workspace this client publishes to. Ayrshare runs one
              profile per client, each with its own key; an unbound client is
              blocked from publishing rather than falling through to the primary
              profile (which would post to the wrong brand). */}
          <div className={`${card} p-5`}>
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="min-w-0">
                <h2 className="text-sm font-medium text-white">Publishing profile</h2>
                {binding?.bound ? (
                  <p className="text-xs text-slate-400 mt-1">
                    {activeClient?.name ?? 'This client'} publishes to{' '}
                    <span className="text-slate-200">{binding.profile_title || 'a linked profile'}</span>
                    {binding.ref_id && <span className="text-slate-600"> · {binding.ref_id.slice(0, 8)}…</span>}
                    {binding.key_hint && <span className="text-slate-600"> · key {binding.key_hint}</span>}
                  </p>
                ) : (
                  <p className="text-xs text-amber-400 mt-1 max-w-xl">
                    Not linked to a profile yet. Publishing is blocked for this client until
                    an admin links one, so nothing can go out on another brand's channels.
                  </p>
                )}
              </div>
              {isAdmin && (
                <div className="flex gap-2 shrink-0">
                  <button onClick={openPicker} className={secondaryBtn} disabled={bindBusy}>
                    {binding?.bound ? 'Change' : 'Link profile'}
                  </button>
                  {binding?.bound && (
                    <button onClick={unbindProfile} className={secondaryBtn} disabled={bindBusy}>Unlink</button>
                  )}
                </div>
              )}
            </div>

            {bindMsg && (
              <p className={`text-xs mt-3 ${bindMsg.ok ? 'text-emerald-400' : 'text-rose-400'}`}>{bindMsg.text}</p>
            )}

            {isAdmin && pickerOpen && (
              <div className="mt-4 pt-4 border-t border-dark-700 space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs text-slate-400 max-w-2xl">
                    Pick this client's profile, then paste its Profile Key from the Ayrshare
                    dashboard (Profiles, then the key icon). Ayrshare never returns keys through
                    its API, so this one paste is unavoidable. The key is verified against
                    Ayrshare before it is saved, and is never sent back to the browser.
                  </p>
                  <button onClick={loadProfiles} className={secondaryBtn} disabled={profilesLoading}>
                    <RefreshCw size={14} className={profilesLoading ? 'animate-spin' : ''} /> Reload
                  </button>
                </div>

                <div className="space-y-2 max-h-72 overflow-y-auto">
                  {profiles.map(p => (
                    <label
                      key={p.refId ?? p.title ?? Math.random()}
                      className={[
                        'flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
                        chosenRef === p.refId
                          ? 'bg-brand-500/10 border-brand-500/40'
                          : 'bg-dark-700/40 border-dark-600 hover:border-dark-500',
                      ].join(' ')}
                    >
                      <input
                        type="radio"
                        name="ayr-profile"
                        className="mt-1 accent-violet-500"
                        checked={chosenRef === p.refId}
                        onChange={() => setChosenRef(p.refId)}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm text-white">{p.title || '(untitled profile)'}</span>
                        <span className="block text-xs text-slate-500 mt-0.5">
                          {p.platforms.length
                            ? p.platforms.map(pl => platformMeta(pl)?.label ?? pl).join(', ')
                            : 'No channels linked yet'}
                          {p.suspended && <span className="text-rose-400"> · suspended</span>}
                        </span>
                        {p.claimed_by != null && (
                          <span className="block text-xs text-amber-400 mt-0.5">
                            Already linked to client #{p.claimed_by}. Linking it here too would let
                            two clients post to the same channels.
                          </span>
                        )}
                      </span>
                    </label>
                  ))}
                  {!profilesLoading && profiles.length === 0 && (
                    <p className="text-xs text-slate-500">No profiles returned.</p>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    className={inputCls}
                    type="password"
                    autoComplete="off"
                    placeholder="Paste the Profile Key for the selected profile"
                    value={keyInput}
                    onChange={e => setKeyInput(e.target.value)}
                  />
                  <button onClick={bindProfile} className={primaryBtn} disabled={bindBusy || !keyInput.trim()}>
                    <Link2 size={15} /> {bindBusy ? 'Verifying…' : 'Verify and link'}
                  </button>
                </div>

                <div className="pt-3 border-t border-dark-700">
                  <p className="text-xs text-slate-500 mb-2">
                    Or create a brand new profile. Its key is captured automatically, but it
                    starts with no channels, so you would link Instagram, Facebook, LinkedIn and
                    Google Business to it in Ayrshare afterwards.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      className={inputCls}
                      placeholder={`New profile title, e.g. ${activeClient?.name ?? 'Client name'}`}
                      value={newTitle}
                      onChange={e => setNewTitle(e.target.value)}
                    />
                    <button onClick={createProfile} className={secondaryBtn} disabled={bindBusy || !newTitle.trim()}>
                      <Plus size={15} /> Create profile
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between gap-4">
            <p className="text-sm text-slate-400">
              Accounts connected to this workspace. Linking happens in your publishing
              provider, then shows up here.
            </p>
            <div className="flex gap-2 shrink-0">
              <button onClick={loadAccounts} className={secondaryBtn} disabled={accountsLoading}>
                <RefreshCw size={15} className={accountsLoading ? 'animate-spin' : ''} /> Refresh
              </button>
              <button onClick={startLinking} className={primaryBtn} disabled={linking || !configured}>
                <Link2 size={15} /> Connect
              </button>
            </div>
          </div>

          {accountsNote && (
            <p className="text-xs text-slate-400 bg-dark-800 border border-dark-700 rounded-lg p-3">{accountsNote}</p>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            {PLATFORMS.map(p => {
              const acc = accounts.find(a => a.platform === p.id)
              const Icon = p.icon
              return (
                <div key={p.id} className={`${card} p-4 flex items-center gap-3`}>
                  <div className="w-10 h-10 rounded-lg bg-dark-700 flex items-center justify-center shrink-0">
                    <Icon size={18} className={acc ? 'text-brand-300' : 'text-slate-500'} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-white font-medium">{p.label}</p>
                    <p className="text-xs text-slate-500 truncate">
                      {acc ? (acc.displayName || acc.externalId || 'Connected') : (p.mvp ? 'Not connected' : p.hint)}
                    </p>
                  </div>
                  {acc
                    ? <StatusBadge status={acc.status === 'connected' ? 'published' : 'failed'} />
                    : <span className="text-xs text-slate-600">—</span>}
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* ── COMPOSER ─────────────────────────────────────────────────────── */}
      {tab === 'composer' && (
        <section className="space-y-6">
          {configured && binding && !binding.bound && (
            <div className={`${card} p-4 flex items-start gap-3`}>
              <AlertTriangle size={18} className="text-amber-400 shrink-0 mt-0.5" />
              <div className="text-sm text-slate-300">
                <p className="font-medium text-white">
                  {activeClient?.name ?? 'This client'} is not linked to a publishing profile.
                </p>
                <p className="text-slate-400 mt-1">
                  You can still write and generate copy, but publishing is blocked until the
                  profile is linked, so a post cannot reach another brand's channels.{' '}
                  <button onClick={() => setTab('accounts')} className="text-brand-300 hover:underline">
                    Go to Accounts
                  </button>
                </p>
              </div>
            </div>
          )}

          {/* AI brief */}
          <div className={`${card} p-5`}>
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={16} className="text-brand-400" />
              <h2 className="text-sm font-medium text-white">Generate with AI</h2>
            </div>
            <p className="text-xs text-slate-500 mb-3">
              Describe what you want to say. Each platform gets its own version, written
              to be quotable by AI answer engines.
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                className={inputCls}
                placeholder="e.g. Announce our new AI visibility report for restaurants"
                value={brief}
                onChange={e => setBrief(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') generate() }}
              />
              <button onClick={generate} className={primaryBtn} disabled={generating || !brief.trim()}>
                <Sparkles size={15} className={generating ? 'animate-pulse' : ''} />
                {generating ? 'Writing…' : 'Generate'}
              </button>
            </div>
            {genError && <p className="text-xs text-rose-400 mt-2">{genError}</p>}
          </div>

          {/* Base post */}
          <div className={`${card} p-5 space-y-4`}>
            <div>
              <label htmlFor="base-text" className="block text-sm font-medium text-white mb-2">Base post</label>
              <textarea
                id="base-text"
                rows={5}
                className={inputCls}
                placeholder="What do you want to share?"
                value={baseText}
                onChange={e => setBaseText(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="media" className="block text-sm font-medium text-white mb-2">
                Media URLs <span className="text-slate-500 font-normal">(one per line, optional)</span>
              </label>
              <textarea
                id="media"
                rows={2}
                className={inputCls}
                placeholder="https://getbrandgeo.com/images/post.png"
                value={mediaRaw}
                onChange={e => setMediaRaw(e.target.value)}
              />
            </div>
          </div>

          {/* Platform picker + per-platform overrides */}
          <div className={`${card} p-5`}>
            <h2 className="text-sm font-medium text-white mb-3">Platforms</h2>
            <div className="flex flex-wrap gap-2 mb-5">
              {PLATFORMS.map(p => {
                const Icon = p.icon
                const on = selected.includes(p.id)
                const isConnected = connected.has(p.id)
                return (
                  <button
                    key={p.id}
                    onClick={() => togglePlatform(p.id)}
                    disabled={!p.mvp}
                    aria-pressed={on}
                    title={!p.mvp ? p.hint : isConnected ? 'Connected' : 'Not connected yet — publishing will fail until it is linked'}
                    className={[
                      'inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm border transition-colors disabled:opacity-40 disabled:cursor-not-allowed',
                      on
                        ? 'bg-brand-500/15 text-brand-300 border-brand-500/40'
                        : 'bg-dark-700 text-slate-400 border-dark-600 hover:text-slate-200',
                    ].join(' ')}
                  >
                    <Icon size={15} /> {p.label}
                    {p.mvp && !isConnected && <span className="text-[10px] text-amber-400">not linked</span>}
                  </button>
                )
              })}
            </div>

            {selected.length === 0 && (
              <p className="text-xs text-slate-500">Pick a platform to see its version of the post.</p>
            )}

            <div className="space-y-4">
              {selected.map(id => {
                const meta = platformMeta(id)!
                const Icon = meta.icon
                const value = textFor(id)
                const over = value.length > meta.limit
                const isOverride = overrides[id] != null
                return (
                  <div key={id} className="bg-dark-700/40 border border-dark-600 rounded-lg p-4">
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <Icon size={15} className="text-brand-300 shrink-0" />
                        <span className="text-sm text-white font-medium">{meta.label}</span>
                        <span className="text-xs text-slate-500 truncate hidden sm:inline">{meta.hint}</span>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className={`text-xs ${over ? 'text-rose-400' : 'text-slate-500'}`}>
                          {value.length}/{meta.limit}
                        </span>
                        {isOverride && (
                          <button
                            className="text-xs text-slate-400 hover:text-slate-200"
                            onClick={() => setOverrides(prev => {
                              const next = { ...prev }; delete next[id]; return next
                            })}
                          >
                            Reset
                          </button>
                        )}
                      </div>
                    </div>
                    <textarea
                      rows={4}
                      aria-label={`${meta.label} post text`}
                      className={`${inputCls} ${over ? 'border-rose-500/60' : ''}`}
                      value={value}
                      onChange={e => setOverrides(prev => ({ ...prev, [id]: e.target.value }))}
                    />
                  </div>
                )
              })}
            </div>
          </div>

          {/* Schedule + publish */}
          <div className={`${card} p-5`}>
            <div className="flex flex-col sm:flex-row sm:items-end gap-4">
              <div className="flex-1">
                <label htmlFor="sched" className="block text-sm font-medium text-white mb-2">
                  Schedule <span className="text-slate-500 font-normal">(leave empty to publish now)</span>
                </label>
                <input
                  id="sched"
                  type="datetime-local"
                  className={inputCls}
                  value={scheduledAt}
                  onChange={e => setScheduledAt(e.target.value)}
                />
              </div>
              <button
                onClick={publish}
                className={primaryBtn}
                disabled={publishing || !configured || binding?.bound === false}
                title={binding?.bound === false ? 'This client is not linked to a publishing profile yet.' : undefined}
              >
                {scheduledAt ? <CalendarClock size={15} /> : <Send size={15} />}
                {publishing ? 'Working…' : scheduledAt ? 'Schedule' : 'Publish now'}
              </button>
            </div>

            {result && (
              <div className={`mt-4 rounded-lg border p-3 text-sm ${
                result.ok
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
              }`}>
                <p>{result.text}</p>
                {result.targets && result.targets.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {result.targets.map(t => (
                      <li key={t.platform} className="flex items-center gap-2 text-xs text-slate-300">
                        <StatusBadge status={t.status} />
                        <span>{platformMeta(t.platform)?.label ?? t.platform}</span>
                        {t.permalink && (
                          <a href={t.permalink} target="_blank" rel="noopener noreferrer"
                             className="text-brand-300 hover:underline inline-flex items-center gap-1">
                            View <ExternalLink size={11} />
                          </a>
                        )}
                        {t.error && <span className="text-rose-400">{t.error}</span>}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── CALENDAR / QUEUE ─────────────────────────────────────────────── */}
      {tab === 'calendar' && (
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-400">Scheduled posts and everything published so far.</p>
            <button onClick={loadPosts} className={secondaryBtn} disabled={postsLoading}>
              <RefreshCw size={15} className={postsLoading ? 'animate-spin' : ''} /> Refresh
            </button>
          </div>

          {postsLoading && <div className={`${card} p-6 text-sm text-slate-500`}>Loading posts…</div>}

          {!postsLoading && posts.length === 0 && (
            <div className={`${card} p-8 text-center`}>
              <p className="text-white font-medium">Nothing scheduled yet</p>
              <p className="text-sm text-slate-400 mt-1 max-w-md mx-auto">
                Posts you publish or schedule from the Composer show up here with their
                per-platform status, so you can see what went live and what did not.
              </p>
              <button onClick={() => setTab('composer')} className={`${primaryBtn} mt-4`}>
                <Plus size={15} /> Write a post
              </button>
            </div>
          )}

          {[
            { label: 'Scheduled', rows: scheduled },
            { label: 'History', rows: history },
          ].filter(g => g.rows.length > 0).map(group => (
            <div key={group.label}>
              <h2 className="text-xs uppercase tracking-wider text-slate-500 mb-2">{group.label}</h2>
              <div className="space-y-3">
                {group.rows.map(post => (
                  <article key={post.id} className={`${card} p-4`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-sm text-slate-200 whitespace-pre-wrap line-clamp-3">
                          {post.base_text || '(no base text)'}
                        </p>
                        <p className="text-xs text-slate-500 mt-2">
                          {post.scheduled_at
                            ? `For ${new Date(post.scheduled_at).toLocaleString()}`
                            : new Date(post.created_at).toLocaleString()}
                          {post.source === 'ai' && <span className="ml-2 text-brand-400">AI</span>}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <StatusBadge status={post.status} />
                        <button
                          onClick={() => refreshStatus(post.id)}
                          className="p-1.5 rounded-md text-slate-500 hover:text-slate-200 hover:bg-dark-700 transition-colors"
                          aria-label={`Refresh status for post ${post.id}`}
                          disabled={refreshingId === post.id}
                        >
                          <RefreshCw size={14} className={refreshingId === post.id ? 'animate-spin' : ''} />
                        </button>
                      </div>
                    </div>

                    {post.targets?.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-dark-700">
                        {post.targets.map(t => {
                          const meta = platformMeta(t.platform)
                          const Icon = meta?.icon ?? Send
                          return (
                            <span key={t.id} className="inline-flex items-center gap-1.5 text-xs text-slate-400">
                              <Icon size={13} />
                              <StatusBadge status={t.status} />
                              {t.permalink && (
                                <a href={t.permalink} target="_blank" rel="noopener noreferrer"
                                   className="text-brand-300 hover:underline inline-flex items-center gap-1">
                                  View <ExternalLink size={11} />
                                </a>
                              )}
                              {t.error && <span className="text-rose-400 truncate max-w-[16rem]">{t.error}</span>}
                            </span>
                          )
                        })}
                      </div>
                    )}
                  </article>
                ))}
              </div>
            </div>
          ))}
        </section>
      )}
    </div>
  )
}
