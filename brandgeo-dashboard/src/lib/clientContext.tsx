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
  // Per-client AI Social channel allowance. NULL = no override, use the plan
  // constant (socialChannelLimit() in planConfig.ts). Set only by a negotiated
  // package; client 1 carries 4 from INV-35.
  social_channel_limit: number | null
}

interface ClientCtx {
  activeClientId:    number
  activeClient:      Client | null
  setActiveClientId: (id: number) => void
  clients:           Client[]           // admin: every client; member: the brands they can reach
  // EFFECTIVE admin, not the real one. When an admin turns on "View as user"
  // this reads false, so every existing `isAdmin` consumer hides its admin
  // affordances with no change at the call site. This is PRESENTATION ONLY:
  // it mints no token, changes no role, and every Netlify function still
  // decides on the real JWT via requireAuth({ adminOnly: true }). A viewer
  // gains nothing from this flag existing — it can only ever take away.
  isAdmin:           boolean
  // The true role; the toggle + banner read it, and this provider also reads it
  // to derive canSwitchClient (a real admin in "View as user" gets no switcher).
  isRealAdmin:       boolean
  // Member with more than one reachable brand (agency spec 6.1).
  canSwitchClient:   boolean
  // Caller's role on the active brand: 'admin' for a real admin, else the
  // user_clients role; null when none or on a read error.
  activeMembershipRole: 'owner' | 'member' | 'admin' | null
  // Caller's own account_members row joined to accounts; null for guests and on error.
  accountAccess:     { account_id: number; role: 'owner' | 'manager'; kind: 'direct' | 'agency' } | null
  // accounts.kind of the active brand. 'unknown' while loading or on error,
  // null for a real admin. Demo mode reads 'direct'.
  activeBrandAccountKind: 'direct' | 'agency' | 'unknown' | null
  viewingAsUser:     boolean
  setViewingAsUser:  (v: boolean) => void
  loading:           boolean
  needsOnboarding:   boolean            // authed but no profile yet -> /welcome onboarding
  // ── Engine gating ────────────────────────────────────────────────────────
  activeEngines:     EngineId[]                        // engines collecting right now
  engineStates:      Record<EngineId, EngineState>     // full state map
  setClientEngineOverride: (engineId: EngineId, enabled: boolean) => Promise<void>
  updateClientCategory: (clientId: number, category: string) => Promise<void>  // admin: switcher grouping
  patchClient: (clientId: number, patch: Partial<Client>) => void  // sync local state after an admin mutation
  // Re-fetch the client list. Call after CREATING a client (patchClient only
  // covers rows already loaded). `selectId` lands on the new client.
  refreshClients: (selectId?: number) => Promise<void>
}

const DEFAULT_ENGINES = getActiveEngines('free', null)
const DEFAULT_STATES  = getEngineStates('free', null)

const Ctx = createContext<ClientCtx>({
  activeClientId:          1,
  activeClient:            null,
  setActiveClientId:       () => {},
  clients:                 [],
  isAdmin:                 false,
  isRealAdmin:             false,
  canSwitchClient:         false,
  activeMembershipRole:    null,
  accountAccess:           null,
  activeBrandAccountKind:  null,
  viewingAsUser:           false,
  setViewingAsUser:        () => {},
  loading:                 true,
  needsOnboarding:         false,
  activeEngines:           DEFAULT_ENGINES,
  engineStates:            DEFAULT_STATES,
  setClientEngineOverride: async () => {},
  updateClientCategory:    async () => {},
  patchClient:             () => {},
  refreshClients:          async () => {},
})

const CLIENT_SELECT = 'id, name, slug, plan, engines_enabled, default_market_id, default_region_id, stripe_customer_id, category, brand_website, created_at, subscription_started_at, paid_until, plan_source, plan_grant_until, plan_grant_note, social_channel_limit'
// Members never read the internal grant label (agency spec 6.1).
const MEMBER_CLIENT_SELECT = CLIENT_SELECT.replace(' plan_grant_note,', '')

export function ClientProvider({ children }: { children: ReactNode }) {
  const saved = parseInt(localStorage.getItem('brandgeo_client') ?? '1', 10)
  const [activeClientId, setActiveClientIdState] = useState<number>(saved)
  const [activeClient, setActiveClient]           = useState<Client | null>(null)
  const [clients, setClients] = useState<Client[]>([])
  const [isAdmin, setIsAdmin] = useState(false)
  // Deliberately NOT persisted. A reload always returns a real admin to the
  // admin view, so nobody can be left impersonating without knowing it.
  const [viewingAsUser, setViewingAsUserState] = useState(false)
  const [loading, setLoading] = useState(true)
  const [needsOnboarding, setNeedsOnboarding] = useState(false)
  const [memberRoles, setMemberRoles] = useState<Record<number, 'owner' | 'member'>>({})
  const [accountAccess, setAccountAccess] = useState<ClientCtx['accountAccess']>(null)
  const [kindRead, setKindRead] = useState<{ id: number; kind: 'direct' | 'agency' | 'unknown' } | null>(null)

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

  /**
   * Load (or re-load) the client list for the signed-in user.
   *
   * EXPOSED ON THE CONTEXT since 2026-08-02, because nothing could add a client
   * to the loaded list. This function used to be an `init()` closure inside the
   * effect below, reachable only on mount and on a SIGNED_IN/SIGNED_OUT
   * transition. An admin who onboarded a client therefore could not see it:
   * Onboard.tsx finishes with navigate('/'), a client-side route change, and
   * this Provider sits above the router so it never remounts. The new client
   * stayed invisible in the switcher for the rest of the tab's life, and only a
   * full browser reload brought it back. Found 2026-08-02 with client 52, which
   * was correctly written to Supabase (row, profile and 3 prompts all present)
   * while the sidebar showed 37 clients.
   *
   * This is the same failure the listener below was added to fix in #107, for a
   * different trigger. `patchClient` covers mutating a row already loaded; this
   * covers a row appearing.
   *
   * `selectId` lands on a specific client after the reload and persists it, so
   * a caller that just CREATED a client can drop the admin straight into it.
   * Omitted, the existing precedence is unchanged.
   */
  const refreshClients = useCallback(async (selectId?: number) => {
    if (isDemoMode) { setLoading(false); return }

    async function init() {
      setLoading(true)
      // A caller that just created a client wins outright: it knows an id the
      // ref and localStorage cannot know yet. Persisted so a later reload keeps
      // it, matching setActiveClientId rather than the load-time setters.
      if (typeof selectId === 'number') {
        localStorage.setItem('brandgeo_client', String(selectId))
      }
      // Then prefer the user's CURRENT in-session selection (survives re-inits
      // fired on tab-focus/token-refresh), then the freshly-persisted value,
      // then the default. Do NOT use the stale mount-time `saved` closure here.
      const desired = selectId
        || activeClientIdRef.current
        || parseInt(localStorage.getItem('brandgeo_client') ?? '1', 10)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setIsAdmin(false)
        setClients([])
        setActiveClient(null)
        setNeedsOnboarding(false)
        setLoading(false)
        return
      }

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('client_id, role')
        .eq('id', user.id)
        .single()

      // No profile = a freshly-authenticated self-serve user (email or social)
      // who has not been provisioned yet. The onboarding gate routes them to
      // /welcome, where provision-account.js creates their client + profile.
      if (!profile) { setNeedsOnboarding(true); setLoading(false); return }
      setNeedsOnboarding(false)

      const admin = profile.role === 'admin'
      setIsAdmin(admin)

      if (admin) {
        setMemberRoles({})
        setAccountAccess(null)
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
            const withDefaults = fallback.map(c => ({ ...c, plan: 'essentials', engines_enabled: null, default_market_id: null, default_region_id: null, stripe_customer_id: null, category: 'active', brand_website: null, created_at: null, subscription_started_at: null, paid_until: null, plan_source: null, plan_grant_until: null, plan_grant_note: null, social_channel_limit: null }))
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
        const roles: Record<number, 'owner' | 'member'> = {}
        try {
          const { data: links, error: linkErr } = await supabase.from('user_clients').select('client_id, role')
          // On error: default brand only, nothing surfaced.
          if (!linkErr && links && links.length) {
            ids = Array.from(new Set([cid, ...links.map(l => l.client_id as number)]))
            for (const l of links) {
              if (l.role === 'owner' || l.role === 'member') roles[l.client_id as number] = l.role
            }
          }
        } catch { /* table missing / not linked — single brand */ }
        setMemberRoles(roles)

        // The caller's own account_members row joined to accounts; null on any error.
        let access: ClientCtx['accountAccess'] = null
        try {
          const { data: am, error: amErr } = await supabase
            .from('account_members').select('account_id, role, accounts(kind)').eq('user_id', user.id).limit(1)
          const row = !amErr && am && am[0] ? am[0] as unknown as { account_id: number; role: string; accounts: { kind: string } | { kind: string }[] | null } : null
          const kind = row ? (Array.isArray(row.accounts) ? row.accounts[0]?.kind : row.accounts?.kind) : null
          if (row && (row.role === 'owner' || row.role === 'manager') && (kind === 'direct' || kind === 'agency')) {
            access = { account_id: row.account_id, role: row.role, kind }
          }
        } catch { /* tables missing / not linked */ }
        setAccountAccess(access)

        const { data: myClients, error: myErr } = await supabase
          .from('clients').select(MEMBER_CLIENT_SELECT).in('id', ids).order('id')
        if (myErr || !myClients) {
          console.warn('[ClientCtx] client select failed (run DB migration):', myErr?.message)
          const { data: fb } = await supabase.from('clients').select('id, name, slug').eq('id', cid).single()
          const one = (fb ? [{ ...fb, plan: 'essentials', engines_enabled: null, default_market_id: null, default_region_id: null, stripe_customer_id: null, category: 'active', brand_website: null, created_at: null, subscription_started_at: null, paid_until: null, plan_source: null, plan_grant_until: null, plan_grant_note: null, social_channel_limit: null }] : []) as Client[]
          setClients(one)
          setActiveClientIdState(cid)
          setActiveClient(one[0] ?? null)
        } else {
          // Non-admin select omits plan_grant_note; keep the Client type whole.
          const list = (myClients as unknown as Client[]).map(c => ({ ...c, plan_grant_note: null }))
          setClients(list)  // members now get their accessible brands (for the switcher + Compare)
          const validId = list.find(c => c.id === desired)?.id ?? list.find(c => c.id === cid)?.id ?? list[0]?.id ?? cid
          setActiveClientIdState(validId)
          setActiveClient(list.find(c => c.id === validId) ?? list[0] ?? null)
        }
      }
      setLoading(false)
    }

    await init()
  }, [])

  useEffect(() => {
    if (isDemoMode) { setLoading(false); return }

    refreshClients()

    // Re-run on real sign-in/sign-out transitions. Without this listener,
    // isAdmin/clients only ever populate from the very first time this
    // Provider mounts — logging out and back in client-side (no full page
    // reload) never re-triggers the effect above, so the sidebar's client
    // switcher silently disappears and stays gone for the rest of the tab's
    // life. Found + fixed 2026-07-09 (task #107).
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        refreshClients()
      } else if (event === 'SIGNED_OUT') {
        setIsAdmin(false)
        setClients([])
        setActiveClient(null)
        setNeedsOnboarding(false)
        setMemberRoles({})
        setAccountAccess(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
    // refreshClients is useCallback([]) and therefore stable, so this still
    // runs exactly once per mount, as it did when init() was inlined here.
  }, [refreshClients])

  // accounts.kind of the active brand, re-read on every switch. A fast switch
  // can land an old answer late: `live` drops it, and the derived value below
  // only trusts an answer whose brand id is still the active one.
  useEffect(() => {
    if (isDemoMode || isAdmin || loading || clients.length === 0) return
    let live = true
    const id = activeClientId
    const done = (kind: 'direct' | 'agency' | 'unknown') => { if (live) setKindRead({ id, kind }) }
    supabase.rpc('brand_account_kind', { p_client_id: id }).then(
      ({ data, error }) => done(!error && (data === 'direct' || data === 'agency') ? data : 'unknown'),
      () => done('unknown'),
    )
    return () => { live = false }
  }, [activeClientId, isAdmin, loading, clients.length])
  const activeBrandAccountKind: ClientCtx['activeBrandAccountKind'] =
    isDemoMode ? 'direct' : isAdmin ? null : kindRead?.id === activeClientId ? kindRead.kind : 'unknown'

  /**
   * Switch the active client.
   *
   * Refuses an id that is not in the loaded list instead of switching to it.
   * The old behaviour was `clients.find(...) ?? null` followed by
   * setActiveClient(found), so an unknown id set activeClient to NULL while
   * leaving activeClientId pointing at it, and every consumer that reads
   * activeClient (Account, the engine derivations above) rendered an empty
   * shell. It also persisted the bad id to localStorage, so the next reload
   * started from it too.
   *
   * Unknown ids are reachable: AdminBell links a notification to its client_id,
   * and that client may since have been deleted. Callers should check
   * membership themselves where they can show a better message; this is the
   * backstop that keeps a bad id from emptying the whole app.
   */
  const setActiveClientId = (id: number) => {
    const found = clients.find(c => c.id === id)
    if (!found) {
      console.warn(`[ClientCtx] ignoring switch to unknown client ${id}`)
      return
    }
    localStorage.setItem('brandgeo_client', String(id))
    setActiveClientIdState(id)
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
      // The hide-only invariant. Non-admins can never set viewingAsUser to
      // anything meaningful, so this expression can only ever remove access.
      isAdmin: isAdmin && !viewingAsUser,
      isRealAdmin: isAdmin,
      canSwitchClient: !isAdmin && clients.length > 1,
      activeMembershipRole: isAdmin ? 'admin' : (memberRoles[activeClientId] ?? null),
      accountAccess,
      activeBrandAccountKind,
      viewingAsUser,
      setViewingAsUser: (v: boolean) => setViewingAsUserState(isAdmin ? v : false),
      loading,
      needsOnboarding,
      activeEngines,
      engineStates,
      setClientEngineOverride,
      updateClientCategory,
      patchClient,
      refreshClients,
    }}>
      {children}
    </Ctx.Provider>
  )
}

export function useClient() {
  return useContext(Ctx)
}
