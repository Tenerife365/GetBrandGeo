/**
 * _locations.js - one location per prompt (docs/arch/multi-location-collection.md
 * sections 5.2 and 6.1).
 *
 * A location is one (market_id, region_id) pair of src/lib/markets.ts, region
 * 'ALL' meaning the whole market. Every prompt carries a fixed location_id
 * (public.client_locations), and every collection path asks the prompt from
 * that location, resolved here on the server from ids. Browser labels are
 * never used.
 *
 * BUNDLER RULE (M1, binding): this file is reached from functions that use
 * Netlify's default bundler (enqueue-collection, schedule-collections, the
 * collectors, the worker, onboard-client), so it requires plain JavaScript
 * only, never a .ts file, directly or through a helper. tests/ts_require_bundler.test.js
 * and tests/market_regions_mirror.test.js guard it.
 *
 * Pure apart from the two loaders at the end, which take a Supabase client
 * from the caller (service key, server side) and never a request body.
 */
const { COUNTRY_NAMES } = require('./_country_names')
const { MARKET_REGIONS } = require('./_market_regions')

// Location count per plan, live rows including the primary. Owner question 1
// of section 14 is unanswered on 2026-11-13: these are the recommended
// defaults, and this object is the one place to change them server side. Its
// mirror export in src/lib/planConfig.ts is kept equal by
// tests/locations_view.test.js.
const PLAN_LOCATION_LIMIT = Object.freeze({
  free:       1,
  radar:      3,
  essentials: 5,
  growth:     5,
  growth_pro: 8,
  managed:    25,
  pro:        25,
  enterprise: 100,
})

// An unknown or missing plan gets 1, never unlimited.
const UNKNOWN_PLAN_LOCATION_LIMIT = 1

const WORLDWIDE_ID = 'WW'
const WORLDWIDE_LABEL = 'Worldwide'
const ALL_REGION = 'ALL'

const MARKET_BY_ID = new Map(MARKET_REGIONS.map((m) => [m.id, m]))

// Columns of public.client_locations that the resolver and the endpoint read.
const LOCATION_COLUMNS = 'id, client_id, market_id, region_id, is_primary, position, archived_at'

function locationLimitFor(plan) {
  if (typeof plan === 'string' && Object.prototype.hasOwnProperty.call(PLAN_LOCATION_LIMIT, plan)) {
    return PLAN_LOCATION_LIMIT[plan]
  }
  return UNKNOWN_PLAN_LOCATION_LIMIT
}

/**
 * validatePair(marketId, regionId)
 *   -> { ok: true, market_id, region_id } | { ok: false, error: 'invalid_location' }
 * The market must be in MARKET_REGIONS and the region in that market's
 * regions. Ids are matched exactly (they are stored as they are). A research
 * region id that is not in markets.ts (US / AUS, for example) is refused here,
 * although such a stored row still resolves (see resolveLocation).
 */
function validatePair(marketId, regionId) {
  if (typeof marketId !== 'string' || typeof regionId !== 'string') return { ok: false, error: 'invalid_location' }
  const market = MARKET_BY_ID.get(marketId)
  if (!market) return { ok: false, error: 'invalid_location' }
  if (!market.regions.some((r) => r.id === regionId)) return { ok: false, error: 'invalid_location' }
  return { ok: true, market_id: marketId, region_id: regionId }
}

/** 'MARKET:REGION', the key the onboarding request uses for an extra location. */
function locationKey(marketId, regionId) {
  return `${marketId}:${regionId}`
}

function marketLabelFor(marketId) {
  if (marketId === WORLDWIDE_ID) return WORLDWIDE_LABEL
  return (typeof marketId === 'string' && COUNTRY_NAMES[marketId]) || null
}

/**
 * resolveLocation(row) -> { location_id, market_id, region_id, market_label, region_label }
 * market_label: COUNTRY_NAMES[market_id], 'Worldwide' for WW, null when unknown.
 * region_label: the region's label from MARKET_REGIONS, null for 'ALL'. A
 * region id not found there resolves to null (country level) with a warning;
 * it never fails a run.
 */
function resolveLocation(row) {
  const marketId = row && typeof row.market_id === 'string' ? row.market_id : null
  const regionId = row && typeof row.region_id === 'string' && row.region_id ? row.region_id : ALL_REGION
  let regionLabel = null
  if (regionId !== ALL_REGION) {
    const market = marketId ? MARKET_BY_ID.get(marketId) : null
    const region = market ? market.regions.find((r) => r.id === regionId) : null
    if (region) regionLabel = region.label
    else console.warn(`[Locations] location ${row && row.id} has region ${marketId}/${regionId} not in the market list; asked at country level`)
  }
  return {
    location_id: row && row.id != null ? Number(row.id) : null,
    market_id: marketId,
    region_id: regionId,
    market_label: marketLabelFor(marketId),
    region_label: regionLabel,
  }
}

/**
 * The geo a prompt is asked from when its location cannot be resolved (a null
 * location_id, or a row that was not returned): exactly what a scheduled run
 * did before 2026-11-13, the client's default market at country level.
 */
function fallbackGeo(client) {
  const marketId = (client && client.default_market_id) || null
  return {
    location_id: null,
    market_id: marketId,
    region_id: null,
    market_label: marketId ? (COUNTRY_NAMES[marketId] ?? null) : null,
    region_label: null,
  }
}

/**
 * geoForPrompt(prompt, locationsById, client) -> the five job geo fields.
 * locationsById is a Map<number, LocationRow> for this client.
 */
function geoForPrompt(prompt, locationsById, client) {
  const id = prompt && prompt.location_id != null ? Number(prompt.location_id) : null
  const row = id !== null && locationsById ? locationsById.get(id) : null
  if (row) return resolveLocation(row)
  return fallbackGeo(client)
}

/**
 * loadLocationsByIds(supabase, clientId, ids) -> { ok: true, byId: Map } | { ok: false, error }
 * One read of client_locations for this client, archived rows included (a
 * prompt keeps the location it was created with). The client_id filter means
 * a location of another client is never returned. No ids: no read.
 */
async function loadLocationsByIds(supabase, clientId, ids) {
  const wanted = [...new Set((ids || []).filter((v) => v != null).map(Number).filter((n) => Number.isSafeInteger(n) && n > 0))]
  const byId = new Map()
  if (wanted.length === 0) return { ok: true, byId }
  const { data, error } = await supabase
    .from('client_locations')
    .select(LOCATION_COLUMNS)
    .eq('client_id', clientId)
    .in('id', wanted)
  if (error) return { ok: false, error: error.message || 'client_locations read failed', byId }
  for (const r of data || []) byId.set(Number(r.id), r)
  return { ok: true, byId }
}

/**
 * loadLocationRow(supabase, clientId, locationId) -> { ok: true, row | null } | { ok: false, error }
 * One row by (id, client_id), for the single cell refresh of the collectors.
 */
async function loadLocationRow(supabase, clientId, locationId) {
  const res = await loadLocationsByIds(supabase, clientId, [locationId])
  if (!res.ok) return { ok: false, error: res.error, row: null }
  return { ok: true, row: res.byId.get(Number(locationId)) || null }
}

module.exports = {
  PLAN_LOCATION_LIMIT,
  UNKNOWN_PLAN_LOCATION_LIMIT,
  LOCATION_COLUMNS,
  WORLDWIDE_LABEL,
  locationLimitFor,
  validatePair,
  locationKey,
  resolveLocation,
  fallbackGeo,
  geoForPrompt,
  loadLocationsByIds,
  loadLocationRow,
}
