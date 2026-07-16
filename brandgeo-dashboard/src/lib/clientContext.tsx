import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'
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
})

const CLIENT_SELECT = 'id, name, slug, plan, engines_enabled, default_market_id, default_region_id, stripe_customer_id, category'

export function ClientProvider({ children }: { children: ReactNode }) {
  const saved = parseInt(localStorage.getItem('brandgeo_client') ?? '1', 10)
  const [activeClientId, setActiveClientIdState] = useState<number>(saved)
  const [activeClient, setActiveClient]           = useState<Client | null>(null)
  const [clients, setClients] = useState<Client[]>([])
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

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
            const withDefaults = fallback.map(c => ({ ...c, plan: 'essentials', engines_enabled: null, default_market_id: null, default_region_id: null, stripe_customer_id: null, category: 'active' }))
            setClients(withDefaults as Client[])
            const validId = withDefaults.find(c => c.id === saved)?.id ?? withDefaults[0]?.id ?? 1
            setActiveClientIdState(validId)
            setActiveClient((withDefaults.find(c => c.id === validId) ?? withDefaults[0] ?? null) as Client | null)
          }
        } else if (allClients) {
          setClients(allClients as Client[])
          const validId = allClients.find(c => c.id === saved)?.id ?? allClients[0]?.id ?? 1
          setActiveClientIdState(validId)
          setActiveClient((allClients.find(c => c.id === validId) ?? allClients[0] ?? null) as Client | null)
        }
      } else {
        const cid = profile.client_id ?? 1
        setActiveClientIdState(cid)
        setClients([])
        const { data: myClient, error: myClientErr } = await supabase
          .from('clients')
          .select(CLIENT_SELECT)
          .eq('id', cid)
          .single()
        if (myClientErr) {
          console.warn('[ClientCtx] client select failed (run DB migration):', myClientErr.message)
          const { data: fallback } = await supabase
            .from('clients')
            .select('id, name, slug')
            .eq('id', cid)
            .single()
          if (fallback) setActiveClient({ ...fallback, plan: 'essentials', engines_enabled: null, default_market_id: null, default_region_id: null, stripe_customer_id: null, category: 'active' } as Client)
        } else if (myClient) {
          setActiveClient(myClient as Client)
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
    }}>
      {children}
    </Ctx.Provider>
  )
}

export function useClient() {
  return useContext(Ctx)
}
