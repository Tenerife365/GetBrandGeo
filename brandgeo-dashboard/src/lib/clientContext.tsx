import { createContext, useContext, useEffect, useState, useCallback, useRef, type ReactNode } from 'react'
import { supabase, isDemoMode } from './supabase'
import {
  getEngineStates,
  getActiveEngines,
  type EngineId,
  type EngineState,
} from './planConfig'

export interface Client {
  id:                number
  name:              string
  slug:              string
  plan:              string
  engines_enabled:   Record<string, boolean> | null
  default_market_id: string | null
  default_region_id: string | null
  stripe_customer_id: string | null
  category:          string   // active | free | test | research | archived (admin switcher grouping)
  brand_website:     string | null   // powers the brand logo (Clearbit/favicon) app-wide
  created_at:        string | null   // fallback for "client since" on the profile
  subscription_started_at: string | null  // manual billing date (Managed/Pro, non-Stripe)
  paid_until:        string | null   // manual "paid until" date (Managed/Pro, non-Stripe)
  plan_source:       string | null   // stripe | manual | trial | comp | signup | expired
  plan_grant_until:  string | null   // trial/comp expiry date (auto-reverts to free)
  plan_grant_note:   string | null   // internal label for a grant
}

interface ClientCtx {
  activeClientId:    number
  activeClient:      Client | null
  setActiveClientId: (id: number) => void
  clients:           Client[]           // populated for admin only
  isAdmin:           boolean
  loading:           boolean
  // ── Engine gating ────────────────────────────────────────────────────────
  activeEngines:     EngineId[]                        // engines collecting right now
  engineStates:      Record<EngineId, EngineState>     // full state map
  setClientEngineOverride: (engineId: EngineId, enabled: boolean) => Promise<void>
  updateClientCategory: (clientId: number, category: string) => Promise<void>  // admin: switcher grouping
  patchClient: (clientId: number, patch: Partial<Client>) => void  // sync local state after an admin mutation
}

const DEFAULT_ENGINES = getActiveEngines('free', null)
const DEFAULT_STATES  = getEngineStates('free', null)

const Ctx = createContext<ClientCtx>({
  activeClientId:          1,
  activeClient:            null,
  setActiveClientId:       () => {},
  clients:                 [],
  isAdmin:                 false,
  loading:                 true,
  activeEngines:           DEFAULT_ENGINES,
  engineStates:            DEFAULT_STATES,
  setClientEngineOverride: async () => {},
  updateClientCategory:    async () => {},
  patchClient:             () => {},
})

const CLIENT_SELECT = 'id, name, slug, plan, engines_enabled, default_market_id, default_region_id, stripe_customer_id, category, brand_website, created_at, subscription_started_at, paid_until, plan_source, plan_grant_until, plan_grant_note'

export function ClientProvider({ children }: { children: ReactNode }) {
  const saved = parseInt(localStorage.getItem('brandgeo_client') ?? '1', 10)
  const [activeClientId, setActiveClientIdState] = useState<number>(saved)
  const [activeClient, setActiveClient]           = useState<Client | null>(null)
  const [clients, setClients] = useState<Client[]>([])
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  // Always holds the LIVE active client id. init() (below) is re-run by the
  // onAuthStateChange listener, which Supabase fires on tab-focus/token-refresh
  // as well as real sign-ins — i.e. after almost any interaction. Reading a
  // stale mount-time snapshot there snapped the admin back to the first client
  // (BpR, id 1) on every such re-run; init() now reads this ref instead so the
  // user's current in-session selection always wins. (Fix 2026-07-18.)
  const activeClientIdRef = useRef(activeClientId)
  useEffect(() => { activeClientIdRef.current = activeClientId }, [activeClientId])

  // Derived from activeClient — recomputed whenever activeClient changes
  const activeEngines = activeClient
    ? getActiveEngines(activeClient.plan, activeClient.engines_enabled)
    : DEFAULT_ENGINES
  const engineStates = activeClient
    ? getEngineStates(activeClient.plan, activeClient.engines_enabled)
    : DEFAULT_STATES

  useEffect(() => {
    if (isDemoMode) { setLoading(false); return }

    async function init() {
      setLoading(true)
      // Prefer the user's CURRENT in-session selection (survives re-inits fired
      // on tab-focus/token-refresh), then the freshly-persisted value, then the
      // default. Do NOT use the stale mount-time `saved` closure here.
      const desired = activeClientIdRef.current
        || parseInt(localStorage.getItem('brandgeo_client') ?? '1', 10)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setIsAdmin(false)
        setClients([])
        setActiveClient(null)
        setLoading(false)
        return
      }

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('client_id, role')
        .eq('id', user.id)
        .single()

      if (!profile) { setLoading(false); return }

      const admin = profile.role === 'admin'
      setIsAdmin(admin)

      if (admin) {
        const { data: allClients, error: clientsErr } = await supabase
          .from('clients')
          .select(CLIENT_SELECT)
          .order('id')

        if (clientsErr) {
          // New columns (plan, engines_enabled) may not exist yet — fallback to base columns
          console.warn('[ClientCtx] full select failed (run DB migration):', clientsErr.message)
          const { data: fallback } = await supabase
            .from('clients')
            .select('id, name, slug')
            .order('id')
          if (fallback) {
            const withDefaults = fallback.map(c => ({ ...c, plan: 'essentials', engines_enabled: null, default_market_id: null, default_region_id: null, stripe_customer_id: null, category: 'active', brand_website: null, created_at: null, subscription_started_at: null, paid_until: null, plan_source: null, plan_grant_until: null, plan_grant_note: null }))
            setClients(withDefaults as Client[])
            const validId = withDefaults.find(c => c.id === desired)?.id ?? withDefaults[0]?.id ?? 1
            setActiveClientIdState(validId)
            setActiveClient((withDefaults.find(c => c.id === validId) ?? withDefaults[0] ?? null) as Client | null)
          }
        } else if (allClients) {
          setClients(allClients as Client[])
          const validId = allClients.find(c => c.id === desired)?.id ?? allClients[0]?.id ?? 1
          setActiveClientIdState(validId)
          setActiveClient((allClients.find(c => c.id === validId) ?? allClients[0] ?? null) as Client | null)
        }
      } else {
        const cid = profile.client_id ?? 1
        // Member brands (multi-brand, option C) = their primary client + any
        // brands an admin has attached via user_clients. That table is
        // RLS-scoped to the user's own rows; missing/empty just means one brand.
        let ids: number[] = [cid]
        try {
          const { data: links } = await supabase.from('user_clients').select('client_id')
          if (links && links.length) ids = Array.from(new Set([cid, ...links.map(l => l.client_id as number)]))
        } catch { /* table missing / not linked — single brand */ }

        const { data: myClients, error: myErr } = await supabase
          .from('clients').select(CLIENT_SELECT).in('id', ids).order('id')
        if (myErr || !myClients) {
          console.warn('[ClientCtx] client select failed (run DB migration):', myErr?.message)
          const { data: fb } = await supabase.from('clients').select('id, name, slug').eq('id', cid).single()
          const one = (fb ? [{ ...fb, plan: 'essentials', engines_enabled: null, default_market_id: null, default_region_id: null, stripe_customer_id: null, category: 'active', brand_website: null, created_at: null, subscription_started_at: null, paid_until: null, plan_source: null, plan_grant_until: null, plan_grant_note: null }] : []) as Client[]
          setClients(one)
          setActiveClientIdState(cid)
          setActiveClient(one[0] ?? null)
        } else {
          const list = myClients as Client[]
          setClients(list)   // members now get their accessible brands (for the switcher + Compare)
          const validId = list.find(c => c.id === desired)?.id ?? list.find(c => c.id === cid)?.id ?? list[0]?.id ?? cid
          setActiveClientIdState(validId)
          setActiveClient(list.find(c => c.id === validId) ?? list[0] ?? null)
        }
      }
      setLoading(false)
    }

    init()

    // Re-run on real sign-in/sign-out transitions. Without this listener,
    // isAdmin/clients only ever populate from the very first time this
    // Provider mounts — logging out and back in client-side (no full page
    // reload) never re-triggers the effect above, so the sidebar's client
    // switcher silently disappears and stays gone for the rest of the tab's
    // life. Found + fixed 2026-07-09 (task #107).
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        init()
      } else if (event === 'SIGNED_OUT') {
        setIsAdmin(false)
        setClients([])
        setActiveClient(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const setActiveClientId = (id: number) => {
    localStorage.setItem('brandgeo_client', String(id))
    setActiveClientIdState(id)
    const found = clients.find(c => c.id === id) ?? null
    setActiveClient(found)
  }

  /**
   * Admin-only: toggle an engine on/off for the currently active client.
   * Updates the engines_enabled JSONB column and local state immediately.
   */
  const setClientEngineOverride = useCallback(async (engineId: EngineId, enabled: boolean) => {
    if (!activeClient) return

    const current = activeClient.engines_enabled ?? {}
    const updated  = { ...current, [engineId]: enabled }

    // Optimistic local update
    const updatedClient: Client = { ...activeClient, engines_enabled: updated }
    setActiveClient(updatedClient)
    setClients(prev => prev.map(c => c.id === activeClient.id ? updatedClient : c))

    // Persist to Supabase
    const { error } = await supabase
      .from('clients')
      .update({ engines_enabled: updated })
      .eq('id', activeClient.id)

    if (error) {
      console.error('[ClientCtx] engines_enabled update failed:', error.message)
      // Rollback on error
      setActiveClient(activeClient)
      setClients(prev => prev.map(c => c.id === activeClient.id ? activeClient : c))
    }
  }, [activeClient])

  // Admin-only: change a client's switcher grouping category. The clients table
  // is service-role-write-only, so this goes through the set-client-category
  // Netlify function (which requires admin), then updates local state so the
  // switcher regroups immediately.
  const updateClientCategory = useCallback(async (clientId: number, category: string) => {
    const { data: { session } } = await supabase.auth.getSession()
    const token = session?.access_token ?? ''
    const res = await fetch('/.netlify/functions/set-client-category', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ client_id: clientId, category }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error((err as { error?: string }).error || 'Failed to update category')
    }
    setClients(prev => prev.map(c => c.id === clientId ? { ...c, category } : c))
    setActiveClient(prev => (prev && prev.id === clientId ? { ...prev, category } : prev))
  }, [])

  // Merge a partial update into a client's local state after an admin mutation
  // (e.g. a plan change), so engine gating + the profile reflect it immediately
  // without a full refetch.
  const patchClient = useCallback((clientId: number, patch: Partial<Client>) => {
    setClients(prev => prev.map(c => c.id === clientId ? { ...c, ...patch } : c))
    setActiveClient(prev => (prev && prev.id === clientId ? { ...prev, ...patch } : prev))
  }, [])

  return (
    <Ctx.Provider value={{
      activeClientId,
      activeClient,
      setActiveClientId,
      clients,
      isAdmin,
      loading,
      activeEngines,
      engineStates,
      setClientEngineOverride,
      updateClientCategory,
      patchClient,
    }}>
      {children}
    </Ctx.Provider>
  )
}

export function useClient() {
  return useContext(Ctx)
}
