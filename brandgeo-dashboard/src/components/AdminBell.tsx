/**
 * AdminBell.tsx — admin-only notification bell (Layout sidebar header).
 * Reads admin_notifications (RLS: admins only), shows an unread badge, a
 * dropdown feed, mark-all-read, and click-through to the related client's
 * account page. Feed rows are written server-side by signup-client.js,
 * stripe-webhook.js and expire-plan-grants.js.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { Bell, Check, X, UserPlus, CreditCard, CalendarX, RefreshCw, Building2, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { supabase, isDemoMode } from '../lib/supabase'
import { useClient } from '../lib/clientContext'

interface AdminNotification {
  id: number
  type: string
  client_id: number | null
  title: string
  body: string
  meta: Record<string, unknown>
  created_at: string
  read_at: string | null
}

const ICON: Record<string, typeof Bell> = {
  new_signup: UserPlus,
  subscription_new: CreditCard,
  subscription_changed: CreditCard,
  subscription_canceled: CalendarX,
  trial_expired: CalendarX,
}

function timeAgo(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

export default function AdminBell() {
  const { isAdmin, clients, activeClientId, setActiveClientId } = useClient()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<AdminNotification[]>([])
  const [loading, setLoading] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const load = useCallback(async () => {
    if (!isAdmin || isDemoMode) return
    setLoading(true)
    try {
      const { data } = await supabase
        .from('admin_notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(30)
      setItems((data as AdminNotification[]) ?? [])
    } catch { /* table not migrated yet — bell just stays empty */ } finally { setLoading(false) }
  }, [isAdmin])

  useEffect(() => { load() }, [load])

  // Light poll so the badge stays fresh without a realtime channel.
  useEffect(() => {
    if (!isAdmin || isDemoMode) return
    const t = setInterval(load, 90000)
    return () => clearInterval(t)
  }, [isAdmin, load])

  // Close on click-outside / Escape.
  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onKey) }
  }, [open])

  if (!isAdmin) return null

  const unread = items.filter(n => !n.read_at).length

  const markAllRead = async () => {
    const now = new Date().toISOString()
    setItems(prev => prev.map(n => (n.read_at ? n : { ...n, read_at: now })))
    await supabase.from('admin_notifications').update({ read_at: now }).is('read_at', null)
  }

  /**
   * The client a notification is about, resolved at RENDER time from the loaded
   * client list rather than from the stored text.
   *
   * This is deliberately not "trust n.body". Three rows already in production
   * say only "A client canceled and was downgraded to Free", because
   * stripe-webhook.js never selected `name`. Those rows cannot be rewritten
   * retroactively, and the next call site that forgets will produce more. The
   * bell holds the client list already, so it can always answer "which client"
   * from client_id, whatever the body says.
   *
   * Returns null for a notification with no client (nothing to name) and
   * 'deleted' for one whose client no longer exists, which is a real case:
   * delete-client.js writes a notification about the client it just deleted.
   */
  const clientFor = (n: AdminNotification): { name: string; gone: boolean } | null => {
    if (!n.client_id) return null
    const hit = clients.find(c => c.id === n.client_id)
    if (hit) return { name: hit.name, gone: false }
    const fromMeta = typeof n.meta?.client_name === 'string' ? n.meta.client_name : ''
    return { name: fromMeta || `Client ${n.client_id}`, gone: true }
  }

  const openItem = (n: AdminNotification) => {
    if (!n.read_at) {
      const now = new Date().toISOString()
      setItems(prev => prev.map(x => (x.id === n.id ? { ...x, read_at: now } : x)))
      supabase.from('admin_notifications').update({ read_at: now }).eq('id', n.id)
    }
    // Only switch to a client that actually exists in the loaded list. Calling
    // setActiveClientId with an unknown id sets activeClient to null (see
    // clientContext), which renders /account as a blank shell and looks like
    // the click silently failed.
    const known = n.client_id != null && clients.some(c => c.id === n.client_id)
    if (known) {
      // Set the client first, then navigate. Both are React state updates in
      // the same handler, so they batch and /account renders once, already on
      // the right client.
      if (n.client_id !== activeClientId) setActiveClientId(n.client_id as number)
      navigate('/account')
    }
    setOpen(false)
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => { setOpen(o => !o); if (!open) load() }}
        className="relative p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-dark-700 transition-colors"
        aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`}
      >
        <Bell size={18} />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-brand-500 text-white text-[10px] font-bold flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        // Fixed near the top-left (the bell lives in the sidebar) so the panel
        // never clips against the sidebar's overflow.
        <div className="fixed left-4 top-16 w-[22rem] max-w-[calc(100vw-2rem)] max-h-[70vh] overflow-hidden bg-dark-800 border border-dark-700 rounded-xl shadow-2xl z-50 flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-dark-700 shrink-0">
            <span className="text-sm font-semibold text-white">Notifications</span>
            <div className="flex items-center gap-2">
              <button onClick={load} className="p-1 text-slate-500 hover:text-slate-200" aria-label="Refresh">
                <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              </button>
              {unread > 0 && (
                <button onClick={markAllRead} className="text-xs text-brand-300 hover:underline inline-flex items-center gap-1">
                  <Check size={12} /> Mark all read
                </button>
              )}
              <button onClick={() => setOpen(false)} className="p-1 text-slate-500 hover:text-slate-200" aria-label="Close">
                <X size={14} />
              </button>
            </div>
          </div>
          <div className="overflow-y-auto">
            {items.length === 0 && (
              <p className="px-4 py-8 text-center text-sm text-slate-500">
                {loading ? 'Loading…' : 'No notifications yet.'}
              </p>
            )}
            {items.map(n => {
              const Icon = ICON[n.type] ?? Bell
              const who = clientFor(n)
              const canOpen = !!who && !who.gone
              return (
                <button
                  key={n.id}
                  onClick={() => openItem(n)}
                  disabled={!canOpen}
                  title={canOpen ? `Open ${who.name}` : undefined}
                  className={`w-full text-left px-4 py-3 border-b border-dark-700/60 transition-colors flex gap-3 ${
                    canOpen ? 'hover:bg-dark-700/50 cursor-pointer' : 'cursor-default'
                  } ${n.read_at ? 'opacity-60' : ''}`}
                >
                  <Icon size={16} className={`shrink-0 mt-0.5 ${n.read_at ? 'text-slate-500' : 'text-brand-300'}`} />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white truncate">{n.title}</span>
                      {!n.read_at && <span className="w-1.5 h-1.5 rounded-full bg-brand-400 shrink-0" />}
                    </span>
                    {n.body && <span className="block text-xs text-slate-400 mt-0.5 line-clamp-2">{n.body}</span>}
                    {/* Which client, always, resolved from client_id rather than
                        from the body text. This is the line that makes a row
                        actionable, so it sits above the timestamp and is not
                        dimmed to slate-600 the way the timestamp is. */}
                    {who && (
                      <span className="flex items-center gap-1.5 mt-1.5 text-[11px] min-w-0">
                        <Building2 size={11} className="shrink-0 text-slate-500" />
                        <span className={`truncate font-medium ${who.gone ? 'text-slate-500 italic' : 'text-brand-300'}`}>
                          {who.name}
                        </span>
                        {who.gone
                          ? <span className="text-slate-500 shrink-0">(deleted)</span>
                          : <ArrowRight size={11} className="shrink-0 text-slate-500" />}
                      </span>
                    )}
                    <span className="block text-[10px] text-slate-600 mt-1">{timeAgo(n.created_at)}</span>
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
