/**
 * ClientBanner.tsx — dismissible in-dashboard notices for the active client
 * (plan grants, plan changes, expired trials). Reads client_notifications via
 * the RLS'd anon client (the owning client + admins can see them; the client
 * can also dismiss its own). Rendered at the top of the main content area in
 * Layout, so it appears on every page until dismissed.
 */
import { useCallback, useEffect, useState } from 'react'
import { X, Sparkles, Gift, AlertTriangle } from 'lucide-react'
import { supabase, isDemoMode } from '../lib/supabase'
import { useClient } from '../lib/clientContext'
import type { ClientNotification } from '../types'

const ICON: Record<string, typeof Gift> = {
  plan_grant: Gift,
  plan_change: Sparkles,
  trial_expired: AlertTriangle,
}

export default function ClientBanner() {
  const { activeClientId } = useClient()
  const [items, setItems] = useState<ClientNotification[]>([])

  const load = useCallback(async () => {
    if (!activeClientId || isDemoMode) { setItems([]); return }
    try {
      const { data } = await supabase
        .from('client_notifications')
        .select('*')
        .eq('client_id', activeClientId)
        .is('dismissed_at', null)
        .order('created_at', { ascending: false })
        .limit(5)
      setItems((data as ClientNotification[]) ?? [])
    } catch { setItems([]) } // table not migrated yet — just show nothing
  }, [activeClientId])

  useEffect(() => { load() }, [load])

  const dismiss = async (id: number) => {
    setItems(prev => prev.filter(n => n.id !== id))  // optimistic
    await supabase.from('client_notifications').update({ dismissed_at: new Date().toISOString() }).eq('id', id)
  }

  if (!items.length) return null

  return (
    <div className="px-4 sm:px-6 md:px-10 pt-4 space-y-3">
      {items.map(n => {
        const Icon = ICON[n.kind] ?? Sparkles
        const warn = n.kind === 'trial_expired'
        return (
          <div
            key={n.id}
            className={`relative rounded-xl border p-4 pr-10 flex items-start gap-3 ${
              warn ? 'bg-amber-500/10 border-amber-500/30' : 'bg-brand-500/10 border-brand-500/30'
            }`}
          >
            <Icon size={18} className={`${warn ? 'text-amber-400' : 'text-brand-300'} shrink-0 mt-0.5`} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-white">{n.title}</p>
              <p className="text-sm text-slate-300 mt-0.5">{n.body}</p>
              {n.cta_url && (
                <a href={n.cta_url} className="inline-block mt-2 text-sm font-medium text-brand-300 hover:underline">
                  {n.cta_label ?? 'Open'} →
                </a>
              )}
            </div>
            <button
              onClick={() => dismiss(n.id)}
              aria-label="Dismiss notification"
              className="absolute top-3 right-3 p-1 rounded-md text-slate-400 hover:text-slate-200 hover:bg-dark-700 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        )
      })}
    </div>
  )
}
