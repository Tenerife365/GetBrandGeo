import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search, Sparkles, FileText, Send, Trash2, ChevronDown, ChevronUp,
  Copy, Check, Zap, Globe, GitCompareArrows, Loader2, ExternalLink, Gauge,
} from 'lucide-react'
import { supabase, isDemoMode } from '../lib/supabase'
import { useClient } from '../lib/clientContext'
import { hasFeature } from '../lib/planConfig'
import FeatureLocked from '../components/FeatureLocked'
import type { SeoBrief, SeoPage, SeoCrawl } from '../types'

type Tab = 'opportunities' | 'audit' | 'consistency'

// Source badge — mirrors Social Boost's Gap/Fix/Vs language so the two features
// read as one system.
const sourceLabel = (s: string) =>
  s === 'visibility_gap' ? 'Gap' : s === 'recommendation' ? 'Fix' : s === 'competitor' ? 'Vs' : 'Idea'
const sourceBadge = (s: string) =>
  s === 'visibility_gap' ? 'bg-amber-500/15 text-amber-300'
  : s === 'recommendation' ? 'bg-brand-500/15 text-brand-300'
  : s === 'competitor' ? 'bg-cyan-500/15 text-cyan-300'
  : 'bg-slate-600/30 text-slate-300'

// ── Shared styles (DESIGN-SYSTEM.md tokens) ──────────────────────────────────
const card = 'bg-dark-800 border border-dark-700 rounded-xl'
const primaryBtn = 'inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-brand-500 text-white hover:bg-brand-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
const secondaryBtn = 'inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-dark-700 text-slate-200 border border-dark-600 hover:bg-dark-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'

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

function ScoreChip({ label, value }: { label: string; value: number | null }) {
  if (value == null) return null
  const good = value >= 90
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs border ${
      good ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
           : 'bg-dark-700 text-slate-300 border-dark-600'
    }`}>
      {label} <span className="font-semibold">{value}</span>
    </span>
  )
}

function BriefCard({
  brief, drafting, onDraft, onDismiss, onSendToSocial,
}: {
  brief: SeoBrief
  drafting: boolean
  onDraft: (b: SeoBrief) => void
  onDismiss: (b: SeoBrief) => void
  onSendToSocial: (b: SeoBrief) => void
}) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const hasDraft = brief.status === 'drafted' && !!brief.draft_text

  const copyDraft = async () => {
    if (!brief.draft_text) return
    try {
      await navigator.clipboard.writeText(brief.draft_text)
      setCopied(true); setTimeout(() => setCopied(false), 1800)
    } catch { /* clipboard may be blocked; the text is still visible to select */ }
  }

  return (
    <article className={`${card} p-4`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${sourceBadge(brief.source)}`}>
              {sourceLabel(brief.source)}
            </span>
            <h3 className="text-sm font-medium text-white truncate">{brief.title}</h3>
          </div>
          {brief.guidance && (
            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed line-clamp-2">{brief.guidance}</p>
          )}
          {hasDraft && brief.geo_score && (
            <div className="flex items-center gap-2 mt-2">
              <ScoreChip label="SEO" value={brief.geo_score.seo} />
              <ScoreChip label="GEO" value={brief.geo_score.geo} />
              <span className={`text-xs ${brief.geo_score.verdict === 'ready' ? 'text-emerald-400' : 'text-amber-400'}`}>
                {brief.geo_score.verdict === 'ready' ? 'Ready to publish' : 'Needs revision'}
              </span>
            </div>
          )}
        </div>
        <button
          onClick={() => setOpen(o => !o)}
          className="p-1.5 rounded-md text-slate-500 hover:text-slate-200 hover:bg-dark-700 transition-colors shrink-0"
          aria-label={open ? 'Collapse brief' : 'Expand brief'}
          aria-expanded={open}
        >
          {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {open && (
        <div className="mt-4 pt-4 border-t border-dark-700 space-y-4">
          {brief.target_prompt && (
            <p className="text-xs text-slate-400">
              <span className="text-slate-500">Answers the buyer query: </span>
              <span className="text-slate-200">"{brief.target_prompt}"</span>
            </p>
          )}

          {brief.outline?.length > 0 && (
            <div>
              <p className="text-[11px] uppercase tracking-wide text-slate-500 mb-1.5">Suggested outline</p>
              <ol className="space-y-1 list-decimal list-inside">
                {brief.outline.map((s, i) => (
                  <li key={i} className="text-xs text-slate-300 leading-relaxed">{s}</li>
                ))}
              </ol>
            </div>
          )}

          {hasDraft && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-[11px] uppercase tracking-wide text-slate-500">Generated draft</p>
                <button onClick={copyDraft} className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200">
                  {copied ? <><Check size={12} className="text-emerald-400" /> Copied</> : <><Copy size={12} /> Copy</>}
                </button>
              </div>
              {brief.geo_score?.notes && (
                <p className="text-xs text-amber-300/80 mb-2">{brief.geo_score.notes}</p>
              )}
              <pre className="text-xs text-slate-200 bg-dark-900/60 border border-dark-700 rounded-lg p-3 max-h-96 overflow-y-auto whitespace-pre-wrap font-sans leading-relaxed">
                {brief.draft_text}
              </pre>
            </div>
          )}
        </div>
      )}

      <div className="flex items-center gap-2 mt-4 flex-wrap">
        <button onClick={() => onDraft(brief)} disabled={drafting} className={primaryBtn}>
          {drafting
            ? <><Loader2 size={15} className="animate-spin" /> Drafting…</>
            : <><FileText size={15} /> {hasDraft ? 'Redraft' : 'Draft it'}</>}
        </button>
        {hasDraft && (
          <button onClick={() => onSendToSocial(brief)} className={secondaryBtn}>
            <Send size={15} /> Send to AI Social
          </button>
        )}
        <button
          onClick={() => onDismiss(brief)}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-slate-500 hover:text-rose-300 hover:bg-dark-700 transition-colors ml-auto"
        >
          <Trash2 size={14} /> Dismiss
        </button>
      </div>
    </article>
  )
}

function scoreCls(sc: number | null) {
  return sc == null ? 'text-slate-500'
    : sc >= 80 ? 'text-emerald-400' : sc >= 60 ? 'text-amber-400' : 'text-rose-400'
}
function pathOf(url: string) { try { return new URL(url).pathname || '/' } catch { return url } }

function AuditRow({ page, auditing, disabled, onAudit }: {
  page: SeoPage
  auditing: boolean
  disabled: boolean
  onAudit: (p: SeoPage) => void
}) {
  const [open, setOpen] = useState(false)
  const audited = page.status === 'audited' && page.geo_score != null
  const hasDetail = !!(page.audit?.issues?.length || page.audit?.suggestions?.length)
  return (
    <article className={`${card} p-4`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {audited && <span className={`text-lg font-semibold ${scoreCls(page.geo_score)}`}>{page.geo_score}</span>}
            <a href={page.url} target="_blank" rel="noopener noreferrer"
               className="text-sm font-medium text-white hover:text-brand-300 truncate inline-flex items-center gap-1">
              {page.title || pathOf(page.url)} <ExternalLink size={12} className="text-slate-500 shrink-0" />
            </a>
          </div>
          <p className="text-xs text-slate-500 truncate mt-0.5">{pathOf(page.url)}</p>
          {audited && page.audit?.summary && (
            <p className="text-xs text-slate-400 mt-1.5 line-clamp-2">{page.audit.summary}</p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={() => onAudit(page)} disabled={auditing || disabled}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-dark-700 text-slate-200 border border-dark-600 hover:bg-dark-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            {auditing ? <><Loader2 size={14} className="animate-spin" /> Auditing</> : <><Gauge size={14} /> {audited ? 'Re-audit' : 'Audit'}</>}
          </button>
          {audited && hasDetail && (
            <button onClick={() => setOpen(o => !o)} aria-label={open ? 'Collapse' : 'Expand'} aria-expanded={open}
              className="p-1.5 rounded-md text-slate-500 hover:text-slate-200 hover:bg-dark-700 transition-colors">
              {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          )}
        </div>
      </div>

      {open && audited && (
        <div className="mt-4 pt-4 border-t border-dark-700 space-y-3">
          {!!page.audit?.issues?.length && (
            <div>
              <p className="text-[11px] uppercase tracking-wide text-slate-500 mb-1.5">Issues</p>
              <ul className="space-y-1.5">
                {page.audit.issues.map((is, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs">
                    <span className={`mt-0.5 text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                      is.severity === 'high' ? 'bg-rose-500/15 text-rose-300'
                      : is.severity === 'med' ? 'bg-amber-500/15 text-amber-300'
                      : 'bg-slate-600/30 text-slate-300'}`}>{is.severity}</span>
                    <span className="text-slate-300 leading-relaxed">{is.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {!!page.audit?.suggestions?.length && (
            <div>
              <p className="text-[11px] uppercase tracking-wide text-slate-500 mb-1.5">Suggested edits</p>
              <ol className="space-y-1 list-decimal list-inside">
                {page.audit.suggestions.map((s, i) => (
                  <li key={i} className="text-xs text-slate-300 leading-relaxed">{s}</li>
                ))}
              </ol>
            </div>
          )}
        </div>
      )}
    </article>
  )
}

export default function SEO() {
  const { activeClientId, activeClient, isAdmin } = useClient()
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('opportunities')

  const [briefs, setBriefs] = useState<SeoBrief[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [draftingId, setDraftingId] = useState<number | null>(null)
  const [note, setNote] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Read the client's existing briefs directly (RLS-scoped). Fast; no LLM. A
  // brand-new client sees none until they run "Find opportunities".
  const loadBriefs = useCallback(async () => {
    if (!activeClientId || isDemoMode) { setLoading(false); return }
    setLoading(true)
    const { data } = await supabase
      .from('seo_briefs')
      .select('id, source, source_ref, title, target_prompt, outline, guidance, target_entities, status, draft_text, geo_score, context, drafted_at, updated_at')
      .eq('client_id', activeClientId)
      .neq('status', 'dismissed')
      .order('status', { ascending: true })
      .order('updated_at', { ascending: false })
    setBriefs((data as SeoBrief[]) ?? [])
    setLoading(false)
  }, [activeClientId])

  useEffect(() => { loadBriefs() }, [loadBriefs])

  // Reset transient state when the workspace changes.
  useEffect(() => { setNote(null); setError(null); setDraftingId(null) }, [activeClientId])

  // Deterministic (no LLM): (re)build briefs from the client's current GEO data.
  const generate = async () => {
    if (generating || !activeClientId) return
    setGenerating(true); setError(null); setNote(null)
    try {
      const data = await authedPost<{ briefs?: SeoBrief[]; hint?: string | null; error?: string }>(
        'seo-opportunities', { client_id: activeClientId },
      )
      if (data.error) { setError(data.error); return }
      setBriefs(data.briefs ?? [])
      setNote(data.hint ?? null)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setGenerating(false)
    }
  }

  const draftIt = async (brief: SeoBrief) => {
    if (draftingId) return
    setDraftingId(brief.id); setError(null)
    // Optimistic status so the card shows progress immediately.
    setBriefs(prev => prev.map(b => b.id === brief.id ? { ...b, status: 'drafting' } : b))
    try {
      const data = await authedPost<{ draft_text?: string; geo_score?: SeoBrief['geo_score']; status?: string; error?: string }>(
        'seo-draft', { client_id: activeClientId, brief_id: brief.id },
      )
      if (data.error) {
        setError(data.error)
        setBriefs(prev => prev.map(b => b.id === brief.id ? { ...b, status: brief.status } : b))
        return
      }
      setBriefs(prev => prev.map(b => b.id === brief.id
        ? { ...b, status: 'drafted', draft_text: data.draft_text ?? null, geo_score: data.geo_score ?? null }
        : b))
    } catch (e) {
      setError((e as Error).message)
      setBriefs(prev => prev.map(b => b.id === brief.id ? { ...b, status: brief.status } : b))
    } finally {
      setDraftingId(null)
    }
  }

  const dismiss = async (brief: SeoBrief) => {
    setBriefs(prev => prev.filter(b => b.id !== brief.id))
    if (isDemoMode) return
    await supabase.from('seo_briefs').update({ status: 'dismissed' }).eq('id', brief.id)
  }

  // Hand a brief to AI Social: stash a prefill and route to the composer, which
  // reads it on mount (the same grounding path Social Boost uses in-page).
  const sendToSocial = (brief: SeoBrief) => {
    try {
      sessionStorage.setItem('brandgeo_social_prefill', JSON.stringify({
        brief: `Create social posts that promote this content: ${brief.title}`,
        context: brief.context || brief.guidance || '',
      }))
    } catch { /* storage may be unavailable; the composer just opens empty */ }
    navigate('/social')
  }

  // ── Site audit (Phase 2) ─────────────────────────────────────────────────
  const [pages, setPages] = useState<SeoPage[]>([])
  const [pagesLoading, setPagesLoading] = useState(false)
  const [crawl, setCrawl] = useState<SeoCrawl | null>(null)
  const [crawling, setCrawling] = useState(false)
  const [siteErr, setSiteErr] = useState<string | null>(null)
  const [auditingId, setAuditingId] = useState<number | null>(null)
  const [auditingAll, setAuditingAll] = useState(false)

  const loadPages = useCallback(async () => {
    if (!activeClientId || isDemoMode) return
    setPagesLoading(true)
    const { data } = await supabase
      .from('seo_pages')
      .select('id, url, title, geo_score, audit, status, fetched_at')
      .eq('client_id', activeClientId)
      .order('geo_score', { ascending: true, nullsFirst: false })
      .order('fetched_at', { ascending: false })
      .limit(200)
    setPages((data as SeoPage[]) ?? [])
    setPagesLoading(false)
  }, [activeClientId])

  const loadCrawl = useCallback(async () => {
    if (!activeClientId || isDemoMode) return
    const { data } = await supabase
      .from('seo_crawls').select('id, status, pages, error, started_at, finished_at')
      .eq('client_id', activeClientId).order('created_at', { ascending: false }).limit(1).maybeSingle()
    setCrawl((data as SeoCrawl) ?? null)
  }, [activeClientId])

  useEffect(() => { if (tab === 'audit') { loadPages(); loadCrawl() } }, [tab, loadPages, loadCrawl])
  useEffect(() => { setPages([]); setCrawl(null); setSiteErr(null); setAuditingId(null) }, [activeClientId])

  // Poll the crawl row while a crawl is running, then reload the pages.
  useEffect(() => {
    if (crawl?.status !== 'running') return
    const id = crawl.id
    const iv = setInterval(async () => {
      const { data } = await supabase
        .from('seo_crawls').select('id, status, pages, error, started_at, finished_at')
        .eq('id', id).maybeSingle()
      if (!data) return
      setCrawl(data as SeoCrawl)
      if ((data as SeoCrawl).status !== 'running') loadPages()
    }, 3000)
    return () => clearInterval(iv)
  }, [crawl?.status, crawl?.id, loadPages])

  const startCrawl = async () => {
    if (crawling) return
    setCrawling(true); setSiteErr(null)
    try {
      const data = await authedPost<{ crawl_id?: number; status?: string; error?: string; note?: string }>(
        'seo-crawl', { client_id: activeClientId },
      )
      if (data.error) { setSiteErr(data.error); return }
      if (data.crawl_id) {
        setCrawl({ id: data.crawl_id, status: 'running', pages: 0, error: null, started_at: new Date().toISOString(), finished_at: null })
      }
    } catch (e) { setSiteErr((e as Error).message) } finally { setCrawling(false) }
  }

  const runAudit = async (page: SeoPage): Promise<boolean> => {
    try {
      const data = await authedPost<{ geo_score?: number | null; audit?: SeoPage['audit']; error?: string }>(
        'seo-audit-page', { client_id: activeClientId, page_id: page.id },
      )
      if (data.error) { setSiteErr(data.error); return false }
      setPages(prev => prev.map(p => p.id === page.id
        ? { ...p, geo_score: data.geo_score ?? null, audit: data.audit ?? null, status: 'audited' } : p))
      return true
    } catch (e) { setSiteErr((e as Error).message); return false }
  }

  const auditPage = async (page: SeoPage) => {
    if (auditingId || auditingAll) return
    setAuditingId(page.id); setSiteErr(null)
    await runAudit(page)
    setAuditingId(null)
  }

  const auditAll = async () => {
    if (auditingAll) return
    setAuditingAll(true); setSiteErr(null)
    const todo = pages.filter(p => p.status !== 'audited')
    for (const p of todo) {
      setAuditingId(p.id)
      const ok = await runAudit(p)
      if (!ok) break   // stop the batch on the first failure (e.g. rate/quota)
    }
    setAuditingId(null); setAuditingAll(false)
  }

  // ── Plan gate ────────────────────────────────────────────────────────────
  // AI SEO is a Growth+ feature. Admins keep access for every client. Placed
  // after all hooks so hook order stays stable.
  if (!isAdmin && !hasFeature(activeClient?.plan ?? 'free', 'ai_seo')) {
    return <FeatureLocked feature="ai_seo" />
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'opportunities', label: 'Opportunities' },
    { id: 'audit', label: 'Site audit' },
    { id: 'consistency', label: 'Consistency' },
  ]

  return (
    <div className="p-4 sm:p-6 md:p-10 max-w-5xl mx-auto">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold text-white tracking-tight">AI SEO</h1>
        <p className="text-sm text-slate-400 mt-1">
          Turn {activeClient?.name ?? 'this workspace'}'s AI visibility gaps into content built to be cited by AI answer engines.
        </p>
      </header>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-dark-700" role="tablist" aria-label="AI SEO sections">
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
          </button>
        ))}
      </div>

      {/* ── OPPORTUNITIES ────────────────────────────────────────────────── */}
      {tab === 'opportunities' && (
        <section className="space-y-5">
          <div className={`${card} p-5`}>
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="min-w-0 max-w-2xl">
                <div className="flex items-center gap-2">
                  <Zap size={16} className="text-brand-400" />
                  <h2 className="text-sm font-medium text-white">Content opportunities from your GEO data</h2>
                </div>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                  We read where {activeClient?.name ?? 'your brand'} is missing from AI answers, plus your open
                  recommendations and competitor pressure, and turn each into a content brief. Generate a full,
                  GEO-scored draft for any of them, then send it to AI Social.
                </p>
              </div>
              <button onClick={generate} disabled={generating} className={primaryBtn}>
                {generating
                  ? <><Loader2 size={15} className="animate-spin" /> Finding…</>
                  : <><Search size={15} /> {briefs.length ? 'Refresh opportunities' : 'Find opportunities'}</>}
              </button>
            </div>
            {note && <p className="text-xs text-slate-400 mt-3">{note}</p>}
            {error && <p className="text-xs text-rose-400 mt-3">{error}</p>}
          </div>

          {loading && <div className={`${card} p-6 text-sm text-slate-500`}>Loading opportunities…</div>}

          {!loading && briefs.length === 0 && !note && (
            <div className={`${card} p-8 text-center`}>
              <div className="w-12 h-12 rounded-2xl bg-brand-500/10 border border-brand-500/30 flex items-center justify-center mx-auto mb-4">
                <Sparkles size={20} className="text-brand-300" />
              </div>
              <p className="text-white font-medium">No content briefs yet</p>
              <p className="text-sm text-slate-400 mt-1 max-w-md mx-auto">
                Run “Find opportunities” and we'll turn your AI visibility gaps into ready-to-write briefs.
                For the richest results, run a collection on AI Visibility first.
              </p>
              <button onClick={generate} disabled={generating} className={`${primaryBtn} mt-4`}>
                <Search size={15} /> Find opportunities
              </button>
            </div>
          )}

          {!loading && briefs.length > 0 && (
            <div className="space-y-3">
              {briefs.map(b => (
                <BriefCard
                  key={b.id}
                  brief={b}
                  drafting={draftingId === b.id || b.status === 'drafting'}
                  onDraft={draftIt}
                  onDismiss={dismiss}
                  onSendToSocial={sendToSocial}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {/* ── SITE AUDIT (Phase 2) ─────────────────────────────────────────── */}
      {tab === 'audit' && (
        <section className="space-y-5">
          <div className={`${card} p-5`}>
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="min-w-0 max-w-2xl">
                <div className="flex items-center gap-2">
                  <Globe size={16} className="text-brand-400" />
                  <h2 className="text-sm font-medium text-white">Crawl and score your existing pages</h2>
                </div>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                  We fetch {activeClient?.name ?? 'your'} pages from your sitemap and score each on how quotable it is
                  for AI answer engines, with specific edits to make. We only read your pages; nothing on your site changes.
                </p>
              </div>
              <button onClick={startCrawl} disabled={crawling || crawl?.status === 'running'} className={primaryBtn}>
                {(crawling || crawl?.status === 'running')
                  ? <><Loader2 size={15} className="animate-spin" /> Crawling…</>
                  : <><Search size={15} /> {pages.length ? 'Re-crawl site' : 'Crawl my site'}</>}
              </button>
            </div>
            {crawl && (
              <p className={`text-xs mt-3 ${crawl.status === 'error' ? 'text-rose-400' : 'text-slate-400'}`}>
                {crawl.status === 'running' ? 'Crawling your site. This can take a minute; results appear below as they land.'
                  : crawl.status === 'done' ? `Last crawl: ${crawl.pages} page${crawl.pages === 1 ? '' : 's'}.`
                  : `Crawl failed: ${crawl.error || 'unknown error'}`}
              </p>
            )}
            {siteErr && <p className="text-xs text-rose-400 mt-3">{siteErr}</p>}
          </div>

          {pages.length > 0 && (
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-500">
                {pages.length} page{pages.length === 1 ? '' : 's'} · {pages.filter(p => p.status === 'audited').length} audited
              </p>
              {pages.some(p => p.status !== 'audited') && (
                <button onClick={auditAll} disabled={auditingAll} className={secondaryBtn}>
                  {auditingAll ? <><Loader2 size={14} className="animate-spin" /> Auditing all…</> : <><Gauge size={14} /> Audit all</>}
                </button>
              )}
            </div>
          )}

          {pagesLoading && <div className={`${card} p-6 text-sm text-slate-500`}>Loading pages…</div>}

          {!pagesLoading && pages.length === 0 && crawl?.status !== 'running' && (
            <div className={`${card} p-8 text-center`}>
              <div className="w-12 h-12 rounded-2xl bg-brand-500/10 border border-brand-500/30 flex items-center justify-center mx-auto mb-4">
                <Globe size={20} className="text-brand-300" />
              </div>
              <p className="text-white font-medium">No pages crawled yet</p>
              <p className="text-sm text-slate-400 mt-1 max-w-md mx-auto">
                Run “Crawl my site” and we'll pull your pages from your sitemap, then score each on how well AI engines can cite it.
              </p>
            </div>
          )}

          {pages.length > 0 && (
            <div className="space-y-3">
              {pages.map(p => (
                <AuditRow key={p.id} page={p} auditing={auditingId === p.id} disabled={auditingAll} onAudit={auditPage} />
              ))}
            </div>
          )}
        </section>
      )}

      {/* ── CONSISTENCY (Phase 3) ────────────────────────────────────────── */}
      {tab === 'consistency' && (
        <div className={`${card} p-8 text-center`}>
          <div className="w-12 h-12 rounded-2xl bg-dark-700 flex items-center justify-center mx-auto mb-4">
            <GitCompareArrows size={20} className="text-slate-400" />
          </div>
          <p className="text-white font-medium">Consistency checks are coming</p>
          <p className="text-sm text-slate-400 mt-1 max-w-md mx-auto">
            Once your pages are crawled, we'll flag conflicting or out-of-date facts across them, so AI engines
            never cite a stale or contradictory claim about your brand.
          </p>
        </div>
      )}
    </div>
  )
}
