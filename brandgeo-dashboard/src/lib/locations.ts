/**
 * locations.ts - pure helpers for the multi-location feature
 * (docs/arch/multi-location-collection.md section 7.1, design 3.8, 3.9).
 *
 * No React, no JSX, no motion import, so node tests load it and Layout can
 * import it freely. It imports only markets.ts.
 *
 * One country per prompt: a prompt belongs to exactly one location, and a
 * location is one (market_id, region_id) pair of a client.
 */
import { MARKETS } from './markets'

export type ClientLocation = {
  id: number
  market_id: string
  region_id: string
  is_primary: boolean
  position: number
  archived_at: string | null
  active_prompts: number
}

/**
 * The one label for a location, used everywhere. Never throws.
 * Known pair: the market label, plus " · region label" unless the region is ALL.
 * Region not in markets.ts (the research ids): the market label followed by the
 * raw region id in parentheses. Unknown market: the raw market id.
 */
export function locationLabel(loc: Pick<ClientLocation, 'market_id' | 'region_id'>): string {
  const marketId = String(loc?.market_id ?? '')
  const regionId = String(loc?.region_id ?? '')
  const market = MARKETS.find(m => m.id === marketId)
  if (!market) return marketId
  if (regionId === 'ALL' || regionId === '') return market.label
  const region = market.regions.find(r => r.id === regionId)
  if (region) return region.id === 'ALL' ? market.label : `${market.label} · ${region.label}`
  return `${market.label} (${regionId})`
}

/** A prompt with no location (old rows, demo prompts) belongs to the primary. */
export function promptLocationId(
  p: { location_id?: number | null },
  primaryId: number | null,
): number | null {
  const id = p?.location_id
  return typeof id === 'number' && Number.isFinite(id) ? id : primaryId
}

/**
 * Keeps the prompts whose location is in `selected`. `null` or an empty set
 * means all locations and returns the SAME array reference, so memoised
 * consumers see no change under "All locations".
 */
export function filterPromptsByLocation<P extends { location_id?: number | null }>(
  prompts: P[],
  selected: ReadonlySet<number> | null,
  primaryId: number | null,
): P[] {
  if (!selected || selected.size === 0) return prompts
  return prompts.filter(p => {
    const id = promptLocationId(p, primaryId)
    return id !== null && selected.has(id)
  })
}

/** Stable key of a selection: '' for all, else the sorted ids joined by ','. */
export function locationFilterKey(selected: ReadonlySet<number> | null): string {
  if (!selected || selected.size === 0) return ''
  return [...selected].sort((a, b) => a - b).join(',')
}

/**
 * Storage key of the stored view filter, per viewer AND per client. With no
 * signed-in user id there is no key: the filter is then not persisted at all.
 */
export function locationFilterStorageKey(userId: string | null | undefined, clientId: number): string | null {
  if (!userId) return null
  return `brandgeo_location_filter_v2_${userId}_${clientId}`
}

/**
 * The one rule for a stored or chosen filter: only live ids count, a filter
 * means nothing with fewer than two live locations, and a selection that covers
 * every live location is the same view as "all" (so it collapses to empty).
 */
export function normaliseLocationIds(ids: number[], liveIds: number[]): number[] {
  const live = new Set(liveIds)
  if (live.size < 2) return []
  const kept = [...new Set(ids)].filter(id => live.has(id))
  return kept.length >= live.size ? [] : kept
}

// Copy: pending bg-copy. No dashes.
const ERR = {
  INVALID_REQUEST: 'That request was not valid. Try again.',
  INVALID_LOCATION: 'That location is not in our list.',
  EXISTS: 'That location is already on the list.',
  IN_USE: 'Archive the prompts in this location first.',
  IS_PRIMARY: 'The primary location cannot be archived.',
  NOT_FOUND: 'That location no longer exists. The list is up to date now.',
  FORBIDDEN: 'Only an admin can do that.',
  SAVE_FAILED: 'Could not save. Try again.',
  SESSION: 'Your session ended. Sign in again.',
  NO_ACCESS: 'You do not have access to this account.',
} as const

/**
 * Error mapping table of design 3.9, one function for every surface.
 * `status` 0 (or any non-HTTP value, a network failure) and every 5xx read as
 * the save failure. `isAdmin` is accepted for callers that need to branch on
 * it later; today no message differs by role.
 */
export function locationErrorMessage(
  status: number,
  code: string | undefined,
  ctx: { limit?: number; isAdmin: boolean },
): string {
  switch (code) {
    case 'invalid_request': return ERR.INVALID_REQUEST
    case 'invalid_location': return ERR.INVALID_LOCATION
    case 'location_limit_reached':
      return typeof ctx?.limit === 'number'
        ? `Your plan allows ${ctx.limit} locations.`
        : 'Your plan allows no more locations.'
    case 'location_exists': return ERR.EXISTS
    case 'location_in_use': return ERR.IN_USE
    case 'location_is_primary': return ERR.IS_PRIMARY
    case 'not_found': return ERR.NOT_FOUND
    case 'forbidden': return ERR.FORBIDDEN
    case 'server_error': return ERR.SAVE_FAILED
  }
  if (status === 401) return ERR.SESSION
  if (status === 403) return ERR.NO_ACCESS
  return ERR.SAVE_FAILED
}

/** True when the error means the list is probably stale and should be refetched. */
export function locationErrorNeedsRefetch(code: string | undefined): boolean {
  return code === 'location_limit_reached' || code === 'location_exists' || code === 'location_in_use'
    || code === 'not_found' || code === 'forbidden'
}

/**
 * Applies the location view filter to a results snapshot, once, at the source.
 * Unfiltered (null or empty set): `rows` and `activePrompts` are the SAME
 * references as `allRows` and `allActivePrompts`, `locationPromptIds` is null
 * and `filterKey` is ''. Filtered: `rows` keeps rows whose prompt belongs to a
 * selected location (a row whose prompt id is not among the client's prompts is
 * dropped), `activePrompts` keeps the active prompts in a selected location.
 * `prompts` and every other field pass through unchanged.
 */
export type LocationFiltered<S> = S & {
  allRows: S extends { rows: infer R } ? R : never
  allActivePrompts: S extends { activePrompts: infer A } ? A : never
  locationPromptIds: ReadonlySet<number> | null
  filterKey: string
}

export function applyLocationFilter<
  S extends { rows: { prompt_id: number }[]; prompts: { id: number; location_id?: number | null }[]; activePrompts: { id: number; location_id?: number | null }[] },
>(snap: S, selected: ReadonlySet<number> | null, primaryId: number | null): LocationFiltered<S> {
  const base = { allRows: snap.rows, allActivePrompts: snap.activePrompts }
  if (!selected || selected.size === 0) {
    return { ...snap, ...base, locationPromptIds: null, filterKey: '' } as unknown as LocationFiltered<S>
  }
  const ids = new Set<number>()
  for (const p of snap.prompts) {
    const lid = promptLocationId(p, primaryId)
    if (lid !== null && selected.has(lid)) ids.add(p.id)
  }
  return {
    ...snap, ...base,
    rows: snap.rows.filter(r => ids.has(r.prompt_id)),
    activePrompts: snap.activePrompts.filter(p => ids.has(p.id)),
    locationPromptIds: ids,
    filterKey: locationFilterKey(selected),
  } as unknown as LocationFiltered<S>
}

/** "1 prompt" or "N prompts". */
export function promptCountLabel(n: number): string {
  return `${n} prompt${n === 1 ? '' : 's'}`
}

/**
 * The one scope sentence for insight pages when the client has more than one
 * location. `n` = live locations, `k` = locations in the filter (0 or n means
 * no filter). Copy: pending bg-copy.
 */
export function locationScopeLine(n: number, k: number): string {
  if (k > 0 && k < n) return `Showing ${k} of ${n} locations.`
  return `Combined across ${n} locations, weighted by prompt count.`
}
