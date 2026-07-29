/**
 * Tickets.tsx -- the single support/work queue, at /tickets.
 *
 * One board, two sources. Customer requests raised from the dashboard and
 * BrandGEO's own internal work sit in the same queue so triage happens in one
 * place. `source` tells them apart and `client_id` carries tenancy: a customer
 * ticket always has one, an internal ticket never does
 * (db/supabase-tickets-migration.sql, tickets_source_tenancy_check).
 *
 * TWO VIEWS, ONE ROUTE
 *   Admin    -> the full queue, filterable, with inline triage.
 *   Customer -> its own tickets, a New request form, and a reply box.
 *
 *   The switch is `isAdmin` from clientContext, which is already
 *   `isAdmin && !viewingAsUser`. So an admin using "view as user" sees exactly
 *   the customer view, which is the point of that mode.
 *
 * WHY THE CUSTOMER PATH IS DIRECT POSTGREST AND THE ADMIN PATH IS A FUNCTION
 *   Customer: direct PostgREST under RLS, the established pattern for
 *   tenant-owned data in this codebase (prompts are written client side the
 *   same way, see db/supabase-prompts-own-client-writes-migration.sql). It
 *   needs no service key, no round trip through Netlify, and no new endpoint,
 *   and the policies are doing the work either way. The security question
 *   "can a customer change status or read an internal note" is answered by the
 *   policy set, not by this file: there is no UPDATE policy for a viewer at
 *   all, and the comments SELECT policy excludes is_internal rows. Putting a
 *   function in front of those queries would add a hop and hide the boundary
 *   without moving it.
 *
 *   Admin: tickets-admin.js, because two things here are impossible from the
 *   browser at any role. auth.users is not readable, and user_profiles has a
 *   single SELECT policy of `id = auth.uid()`, so an admin cannot list the
 *   other admins to populate an assignee picker or resolve an author's email.
 *   Enum validation and the "assignee must be an admin" rule live there too.
 */
import { useCallback, useEffect, useState } from 'react'
import {
  LifeBuoy, Loader2, Plus, MessageSquare, Lock, Building2, Check, X,
  ChevronDown, ChevronRight, Search, RefreshCw,
} from 'lucide-react'
import { supabase, isDemoMode } from '../lib/supabase'
import { useClient } from '../lib/clientContext'
import { PageTitle } from '../components/Typography'
import EmptyState from '../components/EmptyState'

// ── Shared types and vocabulary ─────────────────────────────────────────────

type TicketStatus = 'open' | 'in_progress' | 'waiting' | 'resolved' | 'closed'
type TicketPriority = 'low' | 'normal' | 'high' | 'urgent'
type TicketSource = 'customer' | 'internal'

interface Ticket {
  id: number
  client_id: number | null
  created_by: string | null
  source: TicketSource
  subject: string
  body: string
  status: TicketStatus
  priority: TicketPriority
  assignee: string | null
  page: string | null
  created_at: string
  updated_at: string
  resolved_at: string | null
  // Present only on the admin path, added by tickets-admin.js.
  client_name?: string | null
  created_by_email?: string | null
  assignee_email?: string | null
}

interface TicketComment {
  id: number
  ticket_id: number
  author: string | null
  body: string
  is_internal: boolean
  created_at: string
  author_email?: string | null
}

interface Agent { id: string; email: string }

const STATUSES: TicketStatus[] = ['open', 'in_progress', 'waiting', 'resolved', 'closed']
const PRIORITIES: TicketPriority[] = ['low', 'normal', 'high', 'urgent']

const STATUS_LABEL: Record<TicketStatus, string> = {
  open: 'Open',
  in_progress: 'In progress',
  waiting: 'Waiting',
  resolved: 'Resolved',
  closed: 'Closed',
}
const PRIORITY_LABEL: Record<TicketPriority, string> = {
  low: 'Low', normal: 'Normal', high: 'High', urgent: 'Urgent',
}

// Brand violet carries "being worked on". Everything else uses the status
// colours already in the app (emerald for done, amber for blocked, rose for
// urgent, slate for neutral). No new palette.
const STATUS_STYLE: Record<TicketStatus, string> = {
  open:        'bg-brand-500/15 text-brand-300 border-brand-500/30',
  in_progress: 'bg-brand-500/25 text-brand-200 border-brand-500/45',
  waiting:     'bg-amber-500/15 text-amber-300 border-amber-500/30',
  resolved:    'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  closed:      'bg-dark-700 text-slate-400 border-dark-600',
}
const PRIORITY_STYLE: Record<TicketPriority, string> = {
  low:    'text-slate-500',
  normal: 'text-slate-400',
  high:   'text-amber-400',
  urgent: 'text-rose-400',
}

const card = 'bg-dark-800 rounded-xl p-6 mb-6'
const inputCls = 'w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-brand-500'
const primaryBtn = 'inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-brand-500 text-white hover:bg-brand-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
const smallSelect = 'bg-dark-700 border border-dark-600 rounded-md px-2 py-1 text-xs text-slate-300 focus:outline-none focus:border-brand-500 disabled:opacity-50'

function when(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

function StatusBadge({ status }: { status: TicketStatus }) {
  return (
    <span className={`inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-md border ${STATUS_STYLE[status]}`}>
      {STATUS_LABEL[status]}
    </span>
  )
}

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

/**
 * Postgres 42P01 surfaces through PostgREST as this code. It means
 * db/supabase-tickets-migration.sql has not been applied yet, and it is the
 * one error worth telling apart from a real failure, so the page can say so
 * instead of showing an empty list that looks like "no tickets".
 */
function isMissingTable(error: { code?: string; message?: string } | null) {
  return !!error && (error.code === '42P01' || /relation .*tickets.* does not exist/i.test(error.message ?? ''))
}

function NotDeployed() {
  return (
    <div className={card}>
      <p className="text-xs text-amber-400/90 bg-amber-400/10 border border-amber-400/20 rounded-lg px-3 py-2">
        The tickets backend is not deployed yet. Run{' '}
        <code className="text-amber-300">db/supabase-tickets-migration.sql</code> in the Supabase SQL Editor.
        This page is ready and starts working the moment that migration is applied.
      </p>
    </div>
  )
}

// ── Route entry ─────────────────────────────────────────────────────────────

export default function Tickets() {
  const { isAdmin } = useClient()

  if (isDemoMode) {
    return (
      <div className="p-4 sm:p-6 md:p-8 max-w-5xl mx-auto">
        <div className="mb-6">
          <PageTitle>Support</PageTitle>
        </div>
        <EmptyState
          icon={LifeBuoy}
          title="Not available in demo mode"
          body="Tickets are stored against a real account. Sign in to a live workspace to raise and track one."
          actionLabel="Back to Overview"
          actionTo="/"
        />
      </div>
    )
  }

  return isAdmin ? <AdminQueue /> : <CustomerTickets />
}

// ── Customer view ───────────────────────────────────────────────────────────
//
// Reads and writes tickets/ticket_comments directly over PostgREST. The
// client_id filter below is a query convenience, not the security boundary:
// tickets_select already restricts this JWT to its own tenant, and the comment
// query cannot return an internal note whatever it asks for.

function CustomerTickets() {
  const { activeClientId, activeClient } = useClient()

  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [unavailable, setUnavailable] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  const [showForm, setShowForm] = useState(false)
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [saving, setSaving] = useState(false)

  const [openId, setOpenId] = useState<number | null>(null)
  const [comments, setComments] = useState<TicketComment[]>([])
  const [commentsLoading, setCommentsLoading] = useState(false)
  const [reply, setReply] = useState('')
  const [replying, setReplying] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('tickets')
      .select('id, client_id, created_by, source, subject, body, status, priority, assignee, page, created_at, updated_at, resolved_at')
      .eq('client_id', activeClientId)
      .order('created_at', { ascending: false })

    if (error) {
      if (isMissingTable(error)) { setUnavailable(true); setLoading(false); return }
      console.error('[Tickets] load failed', error.message)
      setMsg({ ok: false, text: `Could not load your requests: ${error.message}` })
      setLoading(false)
      return
    }
    setUnavailable(false)
    setTickets((data ?? []) as Ticket[])
    setLoading(false)
  }, [activeClientId])

  useEffect(() => { load() }, [load])

  const openTicket = async (id: number) => {
    if (openId === id) { setOpenId(null); return }
    setOpenId(id)
    setComments([])
    setReply('')
    setCommentsLoading(true)
    const { data, error } = await supabase
      .from('ticket_comments')
      .select('id, ticket_id, author, body, is_internal, created_at')
      .eq('ticket_id', id)
      .order('created_at', { ascending: true })
    setCommentsLoading(false)
    if (error) {
      console.error('[Tickets] comments failed', error.message)
      setMsg({ ok: false, text: `Could not load the conversation: ${error.message}` })
      return
    }
    setComments((data ?? []) as TicketComment[])
  }

  const create = async () => {
    setMsg(null)
    if (!subject.trim() || !body.trim()) {
      setMsg({ ok: false, text: 'Give it a subject and describe what you need.' })
      return
    }
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    // status, priority and assignee are deliberately not sent. The column
    // defaults produce the only shape the insert policy accepts, and sending
    // anything else would be rejected rather than silently ignored.
    const { data, error } = await supabase
      .from('tickets')
      .insert({
        client_id: activeClientId,
        created_by: user?.id ?? null,
        source: 'customer',
        subject: subject.trim().slice(0, 200),
        body: body.trim(),
        page: '/tickets',
      })
      .select('id, client_id, created_by, source, subject, body, status, priority, assignee, page, created_at, updated_at, resolved_at')
      .single()
    setSaving(false)

    if (error) {
      if (isMissingTable(error)) { setUnavailable(true); return }
      console.error('[Tickets] create failed', error.message)
      setMsg({ ok: false, text: `Could not send that: ${error.message}` })
      return
    }
    setTickets(prev => [data as Ticket, ...prev])
    setSubject(''); setBody(''); setShowForm(false)
    setMsg({ ok: true, text: `Request #${(data as Ticket).id} sent. We will reply here and by email.` })
  }

  const sendReply = async () => {
    if (!reply.trim() || openId === null) return
    setReplying(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase
      .from('ticket_comments')
      .insert({ ticket_id: openId, author: user?.id ?? null, body: reply.trim(), is_internal: false })
      .select('id, ticket_id, author, body, is_internal, created_at')
      .single()
    setReplying(false)
    if (error) {
      console.error('[Tickets] reply failed', error.message)
      setMsg({ ok: false, text: `Could not add that reply: ${error.message}` })
      return
    }
    setComments(prev => [...prev, data as TicketComment])
    setReply('')
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-4xl mx-auto">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <PageTitle>Support</PageTitle>
          <p className="text-sm text-slate-400 mt-0.5">
            Requests you have raised for {activeClient?.name ?? 'your account'}, and where each one stands.
          </p>
        </div>
        {!showForm && !unavailable && (
          <button onClick={() => setShowForm(true)} className={primaryBtn}>
            <Plus size={15} /> New request
          </button>
        )}
      </div>

      {unavailable ? <NotDeployed /> : (
        <>
          {showForm && (
            <div className={card}>
              <h2 className="text-sm font-semibold text-slate-300 mb-3">New request</h2>
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] uppercase tracking-wide text-slate-500 mb-1 block" htmlFor="ticket-subject">Subject</label>
                  <input id="ticket-subject" className={inputCls} value={subject} maxLength={200}
                    onChange={e => setSubject(e.target.value)} placeholder="Short summary of what you need" />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wide text-slate-500 mb-1 block" htmlFor="ticket-body">Details</label>
                  <textarea id="ticket-body" className={`${inputCls} resize-none`} rows={5} value={body}
                    onChange={e => setBody(e.target.value)}
                    placeholder="What happened, what you expected, and anything urgent we should know" />
                  <p className="text-[11px] text-slate-600 mt-1">
                    If it is urgent, say so here. Our team sets the priority when they triage it.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={create} disabled={saving} className={primaryBtn}>
                    {saving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />} Send request
                  </button>
                  <button onClick={() => { setShowForm(false); setMsg(null) }} className="text-xs text-slate-500 hover:text-slate-300">Cancel</button>
                </div>
              </div>
            </div>
          )}

          {msg && (
            <p className={`text-xs mb-4 ${msg.ok ? 'text-emerald-400' : 'text-rose-400'}`}>{msg.text}</p>
          )}

          {loading ? (
            <p className="text-xs text-slate-500">Loading your requests...</p>
          ) : tickets.length === 0 ? (
            <EmptyState
              icon={LifeBuoy}
              title="No requests yet"
              body="Raise one here when you need a hand, and follow it through to a reply. Nothing gets lost in an inbox."
              actionLabel="New request"
              onAction={() => setShowForm(true)}
            />
          ) : (
            <div className="space-y-2">
              {tickets.map(t => (
                <div key={t.id} className="bg-dark-800 border border-dark-700 rounded-xl overflow-hidden">
                  <button
                    onClick={() => openTicket(t.id)}
                    aria-expanded={openId === t.id}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-dark-700/40 transition-colors"
                  >
                    {openId === t.id ? <ChevronDown size={14} className="text-slate-500 shrink-0" /> : <ChevronRight size={14} className="text-slate-500 shrink-0" />}
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm text-slate-200 font-medium truncate">
                        <span className="text-slate-600 font-mono text-xs mr-2">#{t.id}</span>{t.subject}
                      </span>
                      <span className="block text-xs text-slate-500 mt-0.5">Raised {when(t.created_at)}</span>
                    </span>
                    <StatusBadge status={t.status} />
                  </button>

                  {openId === t.id && (
                    <div className="border-t border-dark-700 px-4 py-4 space-y-4">
                      <p className="text-sm text-slate-300 whitespace-pre-wrap">{t.body}</p>

                      <div className="space-y-2">
                        {commentsLoading ? (
                          <p className="text-xs text-slate-500">Loading the conversation...</p>
                        ) : comments.length === 0 ? (
                          <p className="text-xs text-slate-600">No replies yet.</p>
                        ) : comments.map(c => (
                          <div key={c.id} className="bg-dark-700/40 border border-dark-700 rounded-lg px-3 py-2">
                            <div className="text-[11px] text-slate-500 mb-1">{when(c.created_at)}</div>
                            <p className="text-sm text-slate-300 whitespace-pre-wrap">{c.body}</p>
                          </div>
                        ))}
                      </div>

                      <div className="flex items-end gap-2">
                        <textarea
                          className={`${inputCls} resize-none`} rows={2} value={reply}
                          onChange={e => setReply(e.target.value)}
                          aria-label={`Reply to request ${t.id}`}
                          placeholder="Add a reply"
                        />
                        <button onClick={sendReply} disabled={!reply.trim() || replying} className={primaryBtn}>
                          {replying ? <Loader2 size={15} className="animate-spin" /> : <MessageSquare size={15} />} Reply
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ── Admin view ──────────────────────────────────────────────────────────────

function AdminQueue() {
  const { clients } = useClient()

  const [tickets, setTickets] = useState<Ticket[]>([])
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [unavailable, setUnavailable] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [busyId, setBusyId] = useState<number | null>(null)

  const [fStatus, setFStatus] = useState('')
  const [fPriority, setFPriority] = useState('')
  const [fAssignee, setFAssignee] = useState('')
  const [fSource, setFSource] = useState('')
  const [q, setQ] = useState('')
  // The search term is debounced before it reaches the dependency array below.
  // Without this, every keystroke is a round trip to tickets-admin.js, which
  // does one auth.admin.getUserById per distinct user in the result set.
  const [qDebounced, setQDebounced] = useState('')
  useEffect(() => {
    const id = window.setTimeout(() => setQDebounced(q), 300)
    return () => window.clearTimeout(id)
  }, [q])

  const [openId, setOpenId] = useState<number | null>(null)
  const [comments, setComments] = useState<TicketComment[]>([])
  const [commentsLoading, setCommentsLoading] = useState(false)
  const [note, setNote] = useState('')
  const [noteInternal, setNoteInternal] = useState(true)
  const [posting, setPosting] = useState(false)

  const [showForm, setShowForm] = useState(false)
  const [nSource, setNSource] = useState<TicketSource>('internal')
  const [nClientId, setNClientId] = useState<string>('')
  const [nSubject, setNSubject] = useState('')
  const [nBody, setNBody] = useState('')
  const [nPriority, setNPriority] = useState<TicketPriority>('normal')
  const [nAssignee, setNAssignee] = useState('')
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const { status, data } = await authedPost<{ tickets?: Ticket[]; error?: string }>('tickets-admin', {
      action: 'list',
      status: fStatus || undefined,
      priority: fPriority || undefined,
      assignee: fAssignee || undefined,
      source: fSource || undefined,
      q: qDebounced.trim() || undefined,
    })
    setLoading(false)
    if (status === 404) { setUnavailable(true); return }
    setUnavailable(false)
    if (data?.error) { setMsg({ ok: false, text: data.error }); return }
    setTickets(data?.tickets ?? [])
  }, [fStatus, fPriority, fAssignee, fSource, qDebounced])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    authedPost<{ agents?: Agent[] }>('tickets-admin', { action: 'agents' })
      .then(({ data }) => setAgents(data?.agents ?? []))
  }, [])

  const agentLabel = (id: string | null) =>
    id ? (agents.find(a => a.id === id)?.email ?? 'Assigned') : 'Unassigned'

  const patch = async (id: number, body: Record<string, unknown>) => {
    setBusyId(id)
    const { status, data } = await authedPost<{ ticket?: Ticket; error?: string }>('tickets-admin', {
      action: 'update', id, ...body,
    })
    setBusyId(null)
    if (status === 404) { setUnavailable(true); return }
    if (data?.error) { setMsg({ ok: false, text: data.error }); return }
    if (data?.ticket) setTickets(prev => prev.map(t => (t.id === id ? data.ticket as Ticket : t)))
  }

  const openTicket = async (id: number) => {
    if (openId === id) { setOpenId(null); return }
    setOpenId(id)
    setComments([]); setNote(''); setCommentsLoading(true)
    const { data } = await authedPost<{ comments?: TicketComment[]; error?: string }>('tickets-admin', { action: 'detail', id })
    setCommentsLoading(false)
    if (data?.error) { setMsg({ ok: false, text: data.error }); return }
    setComments(data?.comments ?? [])
  }

  const postComment = async () => {
    if (!note.trim() || openId === null) return
    setPosting(true)
    const { data } = await authedPost<{ comment?: TicketComment; error?: string }>('tickets-admin', {
      action: 'comment', id: openId, body: note.trim(), is_internal: noteInternal,
    })
    setPosting(false)
    if (data?.error) { setMsg({ ok: false, text: data.error }); return }
    if (data?.comment) { setComments(prev => [...prev, data.comment as TicketComment]); setNote('') }
  }

  const createTicket = async () => {
    setMsg(null)
    if (!nSubject.trim() || !nBody.trim()) { setMsg({ ok: false, text: 'Subject and description are required.' }); return }
    if (nSource === 'customer' && !nClientId) { setMsg({ ok: false, text: 'Pick the client this ticket belongs to.' }); return }
    setSaving(true)
    const { status, data } = await authedPost<{ ticket?: Ticket; error?: string }>('tickets-admin', {
      action: 'create',
      source: nSource,
      client_id: nSource === 'customer' ? Number(nClientId) : undefined,
      subject: nSubject.trim(),
      body: nBody.trim(),
      priority: nPriority,
      assignee: nAssignee || undefined,
    })
    setSaving(false)
    if (status === 404) { setUnavailable(true); return }
    if (data?.error) { setMsg({ ok: false, text: data.error }); return }
    if (data?.ticket) setTickets(prev => [data.ticket as Ticket, ...prev])
    setNSubject(''); setNBody(''); setNAssignee(''); setNPriority('normal'); setNClientId('')
    setShowForm(false)
    setMsg({ ok: true, text: `Ticket #${data?.ticket?.id} created.` })
  }

  const openCount = tickets.filter(t => t.status === 'open').length

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-6xl mx-auto">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <PageTitle>Tickets</PageTitle>
          <p className="text-sm text-slate-400 mt-0.5">
            Customer requests and BrandGEO's own pending work, in one queue.
            {!loading && !unavailable && <span className="text-slate-500"> {tickets.length} shown, {openCount} open.</span>}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={load} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs text-slate-400 border border-dark-600 hover:text-slate-200 transition-colors" aria-label="Refresh the queue">
            <RefreshCw size={13} /> Refresh
          </button>
          {!showForm && !unavailable && (
            <button onClick={() => setShowForm(true)} className={primaryBtn}>
              <Plus size={15} /> New ticket
            </button>
          )}
        </div>
      </div>

      {unavailable ? <NotDeployed /> : (
        <>
          {showForm && (
            <div className={card}>
              <h2 className="text-sm font-semibold text-slate-300 mb-3">New ticket</h2>
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  {(['internal', 'customer'] as TicketSource[]).map(s => (
                    <button key={s} onClick={() => setNSource(s)}
                      className={`text-xs px-2.5 py-1 rounded-md border transition-colors ${
                        nSource === s ? 'bg-brand-500/15 text-brand-300 border-brand-500/40' : 'bg-dark-700 text-slate-400 border-dark-600 hover:text-slate-200'
                      }`}>
                      {s === 'internal' ? 'Internal BrandGEO work' : 'On behalf of a client'}
                    </button>
                  ))}
                </div>

                {nSource === 'customer' && (
                  <div>
                    <label className="text-[10px] uppercase tracking-wide text-slate-500 mb-1 block" htmlFor="new-client">Client</label>
                    <select id="new-client" className={inputCls} value={nClientId} onChange={e => setNClientId(e.target.value)}>
                      <option value="">Pick a client</option>
                      {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                )}

                <div>
                  <label className="text-[10px] uppercase tracking-wide text-slate-500 mb-1 block" htmlFor="new-subject">Subject</label>
                  <input id="new-subject" className={inputCls} value={nSubject} maxLength={200} onChange={e => setNSubject(e.target.value)} placeholder="What needs doing" />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wide text-slate-500 mb-1 block" htmlFor="new-body">Description</label>
                  <textarea id="new-body" className={`${inputCls} resize-none`} rows={4} value={nBody} onChange={e => setNBody(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] uppercase tracking-wide text-slate-500 mb-1 block" htmlFor="new-priority">Priority</label>
                    <select id="new-priority" className={inputCls} value={nPriority} onChange={e => setNPriority(e.target.value as TicketPriority)}>
                      {PRIORITIES.map(p => <option key={p} value={p}>{PRIORITY_LABEL[p]}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-wide text-slate-500 mb-1 block" htmlFor="new-assignee">Assignee</label>
                    <select id="new-assignee" className={inputCls} value={nAssignee} onChange={e => setNAssignee(e.target.value)}>
                      <option value="">Unassigned</option>
                      {agents.map(a => <option key={a.id} value={a.id}>{a.email}</option>)}
                    </select>
                  </div>
                </div>
                <div className="flex items-center gap-3 pt-1">
                  <button onClick={createTicket} disabled={saving} className={primaryBtn}>
                    {saving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />} Create
                  </button>
                  <button onClick={() => setShowForm(false)} className="text-xs text-slate-500 hover:text-slate-300">Cancel</button>
                </div>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-600" />
              <input
                value={q} onChange={e => setQ(e.target.value)} placeholder="Search subject or body"
                aria-label="Search tickets"
                className="bg-dark-700 border border-dark-600 rounded-md pl-8 pr-3 py-1.5 text-xs text-slate-300 placeholder-slate-600 focus:outline-none focus:border-brand-500 w-56"
              />
            </div>
            <select value={fStatus} onChange={e => setFStatus(e.target.value)} className={smallSelect} aria-label="Filter by status">
              <option value="">All statuses</option>
              {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
            </select>
            <select value={fPriority} onChange={e => setFPriority(e.target.value)} className={smallSelect} aria-label="Filter by priority">
              <option value="">All priorities</option>
              {PRIORITIES.map(p => <option key={p} value={p}>{PRIORITY_LABEL[p]}</option>)}
            </select>
            <select value={fAssignee} onChange={e => setFAssignee(e.target.value)} className={smallSelect} aria-label="Filter by assignee">
              <option value="">All assignees</option>
              <option value="unassigned">Unassigned</option>
              {agents.map(a => <option key={a.id} value={a.id}>{a.email}</option>)}
            </select>
            <select value={fSource} onChange={e => setFSource(e.target.value)} className={smallSelect} aria-label="Filter by source">
              <option value="">Customer and internal</option>
              <option value="customer">Customer only</option>
              <option value="internal">Internal only</option>
            </select>
            {(fStatus || fPriority || fAssignee || fSource || q) && (
              <button onClick={() => { setFStatus(''); setFPriority(''); setFAssignee(''); setFSource(''); setQ('') }}
                className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300">
                <X size={12} /> Clear
              </button>
            )}
          </div>

          {msg && <p className={`text-xs mb-3 ${msg.ok ? 'text-emerald-400' : 'text-rose-400'}`}>{msg.text}</p>}

          {loading ? (
            <p className="text-xs text-slate-500">Loading the queue...</p>
          ) : tickets.length === 0 ? (
            <EmptyState
              icon={LifeBuoy}
              title="Nothing in the queue"
              body="No ticket matches these filters. Clear them to see the whole board, or raise an internal ticket for work that needs tracking."
              actionLabel="New ticket"
              onAction={() => setShowForm(true)}
            />
          ) : (
            <div className="space-y-2">
              {tickets.map(t => (
                <div key={t.id} className="bg-dark-800 border border-dark-700 rounded-xl overflow-hidden">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3">
                    <button
                      onClick={() => openTicket(t.id)}
                      aria-expanded={openId === t.id}
                      className="flex items-center gap-2 min-w-0 flex-1 text-left group"
                    >
                      {openId === t.id ? <ChevronDown size={14} className="text-slate-500 shrink-0" /> : <ChevronRight size={14} className="text-slate-500 shrink-0" />}
                      <span className="min-w-0">
                        <span className="block text-sm text-slate-200 font-medium truncate group-hover:text-white transition-colors">
                          <span className="text-slate-600 font-mono text-xs mr-2">#{t.id}</span>{t.subject}
                        </span>
                        <span className="block text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                          {t.source === 'internal' ? (
                            <span className="inline-flex items-center gap-1 text-slate-500"><Lock size={10} /> Internal</span>
                          ) : (
                            <span className="inline-flex items-center gap-1 truncate"><Building2 size={10} /> {t.client_name ?? `Client ${t.client_id}`}</span>
                          )}
                          <span className="text-slate-700">|</span>
                          <span className={PRIORITY_STYLE[t.priority]}>{PRIORITY_LABEL[t.priority]}</span>
                          <span className="text-slate-700">|</span>
                          <span>{when(t.created_at)}</span>
                        </span>
                      </span>
                    </button>

                    {/* Inline triage. Every value is revalidated server side. */}
                    <div className="flex items-center gap-2 shrink-0">
                      {busyId === t.id && <Loader2 size={13} className="animate-spin text-brand-400" />}
                      <select
                        value={t.status} disabled={busyId === t.id} className={smallSelect}
                        aria-label={`Status of ticket ${t.id}`}
                        onChange={e => patch(t.id, { status: e.target.value })}
                      >
                        {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                      </select>
                      <select
                        value={t.priority} disabled={busyId === t.id} className={smallSelect}
                        aria-label={`Priority of ticket ${t.id}`}
                        onChange={e => patch(t.id, { priority: e.target.value })}
                      >
                        {PRIORITIES.map(p => <option key={p} value={p}>{PRIORITY_LABEL[p]}</option>)}
                      </select>
                      <select
                        value={t.assignee ?? ''} disabled={busyId === t.id} className={smallSelect}
                        aria-label={`Assignee of ticket ${t.id}`}
                        onChange={e => patch(t.id, { assignee: e.target.value || null })}
                      >
                        <option value="">Unassigned</option>
                        {agents.map(a => <option key={a.id} value={a.id}>{a.email}</option>)}
                        {/* An assignee whose profile is no longer admin would
                            otherwise render as a blank select. */}
                        {t.assignee && !agents.some(a => a.id === t.assignee) && (
                          <option value={t.assignee}>{t.assignee_email ?? agentLabel(t.assignee)}</option>
                        )}
                      </select>
                    </div>
                  </div>

                  {openId === t.id && (
                    <div className="border-t border-dark-700 px-4 py-4 space-y-4">
                      <div className="text-xs text-slate-500">
                        Raised by {t.created_by_email ?? 'unknown'}
                        {t.page ? ` from ${t.page}` : ''}
                        {t.resolved_at ? ` | resolved ${when(t.resolved_at)}` : ''}
                      </div>
                      <p className="text-sm text-slate-300 whitespace-pre-wrap">{t.body}</p>

                      <div className="space-y-2">
                        {commentsLoading ? (
                          <p className="text-xs text-slate-500">Loading the thread...</p>
                        ) : comments.length === 0 ? (
                          <p className="text-xs text-slate-600">No comments yet.</p>
                        ) : comments.map(c => (
                          <div key={c.id} className={`rounded-lg px-3 py-2 border ${
                            c.is_internal ? 'bg-amber-500/5 border-amber-500/25' : 'bg-dark-700/40 border-dark-700'
                          }`}>
                            <div className="text-[11px] text-slate-500 mb-1 flex items-center gap-2">
                              {c.is_internal && <span className="inline-flex items-center gap-1 text-amber-400"><Lock size={10} /> Internal note</span>}
                              <span>{c.author_email ?? 'unknown'}</span>
                              <span>{when(c.created_at)}</span>
                            </div>
                            <p className="text-sm text-slate-300 whitespace-pre-wrap">{c.body}</p>
                          </div>
                        ))}
                      </div>

                      <div className="space-y-2">
                        <textarea
                          className={`${inputCls} resize-none`} rows={2} value={note}
                          onChange={e => setNote(e.target.value)}
                          aria-label={`Comment on ticket ${t.id}`}
                          placeholder={noteInternal ? 'Internal note, the customer never sees this' : 'Reply, visible to the customer'}
                        />
                        <div className="flex items-center justify-between gap-3">
                          <label className="inline-flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
                            <input type="checkbox" checked={noteInternal} onChange={e => setNoteInternal(e.target.checked)}
                              className="accent-brand-500" />
                            Internal note
                          </label>
                          <button onClick={postComment} disabled={!note.trim() || posting} className={primaryBtn}>
                            {posting ? <Loader2 size={15} className="animate-spin" /> : <MessageSquare size={15} />} Post
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
