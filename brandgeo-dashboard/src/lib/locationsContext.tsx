/**
 * locationsContext.tsx - LocationsProvider, useLocations(), LocationFlag
 * (docs/arch/multi-location-collection.md 7.2, 7.5; design 3.1, 3.7, 3.10, 5).
 *
 * The client's live locations come from the client-locations function (the
 * server is the source of truth, a client side list is only ever a cache of
 * it). This context also owns the VIEW FILTER: which locations the dashboard
 * shows. It steers nothing about collection: the server resolves geography
 * from each prompt's location_id.
 *
 * Mount it INSIDE ClientProvider and OUTSIDE ResultsProvider, because
 * resultsContext reads the selected set from here.
 *
 * Layout imports this file, so it imports nothing from motion or framer-motion.
 * Every localStorage access is wrapped in try/catch and the filter renders
 * correctly with empty storage.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Globe2, MapPin } from 'lucide-react'
import { supabase, isDemoMode } from './supabase'
import { useClient } from './clientContext'
import { MARKETS } from './markets'
import { locationLimitFor } from './planConfig'
import { locationErrorMessage, locationFilterStorageKey, normaliseLocationIds, type ClientLocation } from './locations'

/** Owner question 6: the default view is every location. */
export const DEFAULT_VIEW = 'all' as const
/** Owner question 3: a viewer may add and archive. When false the UI hides both for a viewer. */
export const VIEWERS_MAY_EDIT_LOCATIONS_UI = true
/** Collapsed sidebar rows before "+N more". */
export const SIDEBAR_VISIBLE_LOCATIONS = 3
/** Most chips a location picker shows before it collapses the rest into "+N". */
export const LOCATION_CHIP_MAX = 6

export type LocationsStatus = 'loading' | 'ready' | 'error'

export type LocationActionResult =
  | { ok: true }
  | { ok: false; status: number; code?: string; message: string }

export interface LocationsContextValue {
  /** Live locations, primary first, then position, then id. Empty while loading or on error. */
  locations: ClientLocation[]
  /** Plan limit from the server (display only). */
  limit: number
  /** Live rows including the primary. */
  used: number
  primary: ClientLocation | null
  /** The one predicate: two or more live locations. */
  isMulti: boolean
  status: LocationsStatus
  /** Re-reads the list. Resolves true when the read succeeded. */
  refresh: () => Promise<boolean>
  /** The view filter. Empty set = all locations. Ids are always live locations. */
  selected: ReadonlySet<number>
  setSelected: (ids: Iterable<number>) => void
  /** False for a viewer while VIEWERS_MAY_EDIT_LOCATIONS_UI is false, and always in demo mode. */
  canEdit: boolean
  /** Adds one location per region id of a market ('ALL' alone means the whole market). */
  add: (marketId: string, regionIds: string[]) => Promise<LocationActionResult>
  /** Archives an empty, non-primary location. */
  archive: (locationId: number) => Promise<LocationActionResult>
  /** Admin only: makes a location the primary. */
  setPrimary: (locationId: number) => Promise<LocationActionResult>
}

const EMPTY_SET: ReadonlySet<number> = new Set<number>()

const IDLE: LocationsContextValue = {
  locations: [], limit: 1, used: 0, primary: null, isMulti: false, status: 'loading',
  refresh: async () => false, selected: EMPTY_SET, setSelected: () => {}, canEdit: false,
  add: async () => ({ ok: false, status: 0, message: '' }),
  archive: async () => ({ ok: false, status: 0, message: '' }),
  setPrimary: async () => ({ ok: false, status: 0, message: '' }),
}

const Ctx = createContext<LocationsContextValue>(IDLE)

const scopeOf = (userId: string | null | undefined, clientId: number) => `${userId ?? ''}|${clientId}`

function readStoredIds(userId: string | null | undefined, clientId: number): number[] {
  const key = locationFilterStorageKey(userId, clientId)
  if (!key) return []
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter((x): x is number => typeof x === 'number' && Number.isFinite(x)) : []
  } catch { return [] }
}

function writeStoredIds(userId: string | null | undefined, clientId: number, ids: number[]) {
  const key = locationFilterStorageKey(userId, clientId)
  if (!key) return
  try {
    if (ids.length === 0) localStorage.removeItem(key)
    else localStorage.setItem(key, JSON.stringify(ids))
  } catch { /* storage unavailable: the filter just does not persist */ }
}

interface ListPayload { locations: ClientLocation[]; limit: number; used: number }

// Response shapes of netlify/functions/client-locations.js (spec 5.3).
type ListRes = ListPayload
interface AddRes { added: ClientLocation[]; limit: number; used: number }
interface ArchiveRes { archived: true; location_id: number }
interface PrimaryRes { primary_id: number }
interface ErrRes { error: string; code: string }

type CallResult<T> =
  | { ok: true; status: number; data: T }
  | { ok: false; status: number; code?: string; data: ErrRes | null }

async function callLocations<T>(body: Record<string, unknown>): Promise<CallResult<T>> {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`
    const res = await fetch('/.netlify/functions/client-locations', { method: 'POST', headers, body: JSON.stringify(body) })
    const data = (await res.json().catch(() => null)) as T | ErrRes | null
    if (res.ok && data) return { ok: true, status: res.status, data: data as T }
    const err = data as ErrRes | null
    return { ok: false, status: res.status, code: typeof err?.code === 'string' ? err.code : undefined, data: err }
  } catch {
    return { ok: false, status: 0, data: null }
  }
}

function demoList(clientId: number, marketId: string | null | undefined, regionId: string | null | undefined): ListPayload {
  const mkt = MARKETS.find(m => m.id === marketId)
  const market_id = mkt ? mkt.id : 'WW'
  const region_id = mkt && mkt.regions.some(r => r.id === regionId) ? String(regionId) : 'ALL'
  return {
    locations: [{ id: clientId, market_id, region_id, is_primary: true, position: 0, archived_at: null, active_prompts: 0 }],
    limit: 1, used: 1,
  }
}

export function LocationsProvider({ children }: { children: ReactNode }) {
  const { activeClientId, activeClient, isAdmin } = useClient()
  const planLimit = locationLimitFor(activeClient?.plan)

  const [loaded, setLoaded] = useState<{ clientId: number; list: ListPayload } | null>(null)
  const [failedFor, setFailedFor] = useState<number | null>(null)
  const [sel, setSel] = useState<{ scope: string; ids: number[] }>({ scope: '', ids: [] })
  const seq = useRef(0)
  const defaultMarket = activeClient?.default_market_id
  const defaultRegion = activeClient?.default_region_id

  // The signed-in user id, for the per viewer filter key. undefined = not resolved
  // yet, null = nobody signed in (or demo): the filter then simply does not persist.
  const [userId, setUserId] = useState<string | null | undefined>(isDemoMode ? null : undefined)
  useEffect(() => {
    if (isDemoMode) return
    let alive = true
    supabase.auth.getSession()
      .then(({ data }) => { if (alive) setUserId(data.session?.user?.id ?? null) })
      .catch(() => { if (alive) setUserId(null) })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id ?? null)
    })
    return () => { alive = false; sub.subscription.unsubscribe() }
  }, [])

  // Demo mode never sets activeClient, so it must not wait for one.
  const clientReady = isDemoMode
    || (userId !== undefined && activeClient !== null && activeClient !== undefined && activeClient.id === activeClientId)

  const adopt = useCallback((clientId: number, list: ListPayload) => {
    setLoaded({ clientId, list })
    setFailedFor(null)
    const liveIds = list.locations.map(l => l.id)
    const scope = scopeOf(userId, clientId)
    // A stored selection is normalised on read: archived ids are dropped, a filter
    // with fewer than two live locations is cleared, and a selection that covers
    // every live location collapses to "all". The result is written back.
    setSel(prev => {
      const base = prev.scope === scope ? prev.ids : readStoredIds(userId, clientId)
      const ids = normaliseLocationIds(base, liveIds)
      if (prev.scope === scope && ids.length === prev.ids.length && ids.every((v, i) => v === prev.ids[i])) return prev
      if (ids.length !== base.length) writeStoredIds(userId, clientId, ids)
      return { scope, ids }
    })
  }, [userId])

  const load = useCallback(async (clientId: number): Promise<boolean> => {
    const mine = ++seq.current
    if (isDemoMode) {
      adopt(clientId, demoList(clientId, defaultMarket, defaultRegion))
      return true
    }
    const r = await callLocations<ListRes>({ action: 'list', client_id: clientId })
    if (mine !== seq.current) return false      // a newer load or a client switch won
    if (r.ok && Array.isArray(r.data.locations)) {
      adopt(clientId, {
        locations: r.data.locations,
        limit: typeof r.data.limit === 'number' ? r.data.limit : planLimit,
        used: typeof r.data.used === 'number' ? r.data.used : r.data.locations.length,
      })
      return true
    }
    setFailedFor(clientId)
    return false
  }, [adopt, defaultMarket, defaultRegion, planLimit])

  // Reload on a client switch. Rows of the previous client are never exposed:
  // `loaded.clientId` must equal the active id for the list to count as ready.
  useEffect(() => {
    if (!clientReady) return
    void load(activeClientId)
  }, [activeClientId, clientReady, load])

  const ready = loaded !== null && loaded.clientId === activeClientId
  const status: LocationsStatus = ready ? 'ready' : failedFor === activeClientId ? 'error' : 'loading'
  const locations = useMemo(() => (ready ? loaded!.list.locations : []), [ready, loaded])
  const primary = useMemo(() => locations.find(l => l.is_primary) ?? null, [locations])
  const limit = ready ? loaded!.list.limit : planLimit
  const used = ready ? loaded!.list.used : 0
  const isMulti = locations.length >= 2

  const scope = scopeOf(userId, activeClientId)

  const selected = useMemo<ReadonlySet<number>>(() => {
    if (!ready || sel.scope !== scope || sel.ids.length === 0) return EMPTY_SET
    // Normalised again on read: a stale or whole-account filter never applies.
    const ids = normaliseLocationIds(sel.ids, locations.map(l => l.id))
    return ids.length === 0 ? EMPTY_SET : new Set(ids)
  }, [ready, sel, scope, locations])

  const setSelected = useCallback((ids: Iterable<number>) => {
    const final = normaliseLocationIds([...ids], locations.map(l => l.id))
    writeStoredIds(userId, activeClientId, final)
    setSel({ scope: scopeOf(userId, activeClientId), ids: final })
  }, [locations, userId, activeClientId])

  const refresh = useCallback(() => load(activeClientId), [load, activeClientId])

  const mutate = useCallback(async <T,>(
    body: Record<string, unknown>,
    after?: () => void,
  ): Promise<LocationActionResult> => {
    if (isDemoMode) return { ok: false, status: 0, message: 'Not available in the demo' }
    const r = await callLocations<T>({ ...body, client_id: activeClientId })
    if (r.ok) {
      after?.()
      await load(activeClientId)
      return { ok: true }
    }
    const message = locationErrorMessage(r.status, r.code, { limit: r.code === 'location_limit_reached' ? limit : undefined, isAdmin })
    // The list is probably stale after these codes: refetch so the next render is true.
    if (r.code === 'location_limit_reached' || r.code === 'location_exists' || r.code === 'location_in_use'
      || r.code === 'not_found' || r.code === 'forbidden') void load(activeClientId)
    return { ok: false, status: r.status, code: r.code, message }
  }, [activeClientId, load, limit, isAdmin])

  const add = useCallback((marketId: string, regionIds: string[]) =>
    mutate<AddRes>({ action: 'add', market_id: marketId, region_ids: regionIds }), [mutate])

  const archive = useCallback((locationId: number) =>
    mutate<ArchiveRes>({ action: 'archive', location_id: locationId }, () => {
      const next = sel.ids.filter(id => id !== locationId)
      if (next.length !== sel.ids.length) {
        writeStoredIds(userId, activeClientId, next)
        setSel({ scope: scopeOf(userId, activeClientId), ids: next })
      }
    }), [mutate, sel, userId, activeClientId])

  const setPrimary = useCallback((locationId: number) =>
    mutate<PrimaryRes>({ action: 'set_primary', location_id: locationId }), [mutate])

  const canEdit = !isDemoMode && (isAdmin || VIEWERS_MAY_EDIT_LOCATIONS_UI)

  const value = useMemo<LocationsContextValue>(() => ({
    locations, limit, used, primary, isMulti, status, refresh, selected, setSelected, canEdit, add, archive, setPrimary,
  }), [locations, limit, used, primary, isMulti, status, refresh, selected, setSelected, canEdit, add, archive, setPrimary])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useLocations(): LocationsContextValue {
  return useContext(Ctx)
}

/**
 * Decorative flag for a location. The label always carries the name.
 * Known market with a flag: flagcdn image. WW: Globe2. Unknown market: MapPin.
 */
export function LocationFlag({ marketId, size = 16 }: { marketId: string; size?: 12 | 16 }) {
  const m = MARKETS.find(x => x.id === marketId)
  if (!m) return <MapPin size={size} aria-hidden="true" className="text-ink-3 flex-shrink-0" />
  if (m.flagCode === 'un') return <Globe2 size={size} aria-hidden="true" className="text-ink-2 flex-shrink-0" />
  return (
    <img
      src={`https://flagcdn.com/w20/${m.flagCode}.png`}
      alt=""
      loading="lazy"
      className={`${size === 12 ? 'w-3' : 'w-4'} h-auto rounded-sm flex-shrink-0`}
    />
  )
}
