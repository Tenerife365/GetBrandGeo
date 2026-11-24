/**
 * mcp-admin.js -- admin MCP server. Contract: docs/arch/mcp-admin-tools.md.
 *
 * POST https://app.getbrandgeo.com/mcp/admin   (netlify.toml rewrites it here)
 * Authorization: Bearer bgadm_<48 hex>
 *
 * A separate endpoint from the client server (mcp-server.js) on purpose: the
 * two share no key shape, no table, no counter namespace and no code path. A
 * bgadm_ key is refused by mcp-server.js, and a bgmcp_ or bgmat_ token is
 * refused here before the database is touched.
 *
 * AUTHORITY. The key row is found by the sha256 of the key. Its creator must
 * still be a live admin (an auth user that is not banned, with
 * user_profiles.role = 'admin') on EVERY request, so demoting or banning the
 * admin closes every key at once. There is no plan gate and no research gate:
 * the admin manages every account.
 *
 * WRITES. add_prompts and archive_prompts each run as ONE SQL function
 * (admin_add_prompts, admin_archive_prompts) holding the per client advisory
 * lock, with the client_events audit row in the same transaction. Prompts are
 * archived, never deleted: nothing here issues a DELETE. No tool calls an
 * engine or enqueues a collection.
 *
 * LOGGING. One line per request. Never logged: the Authorization header, the
 * key, its prefix or hash, the raw body, prompt texts, the search string.
 *
 * BUNDLING. Plain JavaScript under the default bundler: it requires no .ts
 * file (tests/ts_require_bundler.test.js).
 */

const { createClient } = require('@supabase/supabase-js')
const { ALLOWED_ORIGINS, isBannedUser } = require('./_auth')
const { RESEARCH_CATEGORY } = require('./_cost')
const { ADMIN_API_KEY_RE, hashAdminApiKey } = require('./_admin_api_key')
const { LOCATION_COLUMNS, resolveLocation, loadLocationsByIds } = require('./_locations')

// ── Constants ────────────────────────────────────────────────────────────────

const SUPPORTED_PROTOCOL_VERSIONS = ['2025-11-25', '2025-06-18', '2025-03-26']
const LATEST_PROTOCOL_VERSION = SUPPORTED_PROTOCOL_VERSIONS[0]
const DEFAULT_HEADER_VERSION = '2025-03-26'
const OUTPUT_SCHEMA_SINCE = '2025-06-18'

const PER_KEY_PER_MINUTE = 60
const PER_KEY_PER_DAY = 2000
const WRITES_PER_KEY_PER_HOUR = 60
const MAX_BODY_BYTES = 65536
const LAST_USED_THROTTLE_MS = 60 * 1000

const DEFAULT_CONFIG = {
  perKeyPerMinute: PER_KEY_PER_MINUTE,
  perKeyPerDay: PER_KEY_PER_DAY,
  writesPerKeyPerHour: WRITES_PER_KEY_PER_HOUR,
  maxBodyBytes: MAX_BODY_BYTES,
  scanBatch: 200,
  scanBatches: 5,
}

const KNOWN_METHODS = new Set(['initialize', 'ping', 'tools/list', 'tools/call'])
const SERVER_INFO = { name: 'brandgeo-admin', title: 'BrandGEO admin', version: '1.0.0' }
const INSTRUCTIONS = 'Admin access to every BrandGEO account: list clients, read one client, list its prompts, add prompts and archive prompts. Prompts are archived, never deleted. Each prompt belongs to one location; the same question in two locations is two prompts. Adding prompts respects the plan prompt cap unless allow_over_cap is true. These tools never start a collection: new prompts are picked up by the next scheduled run or a dashboard refresh.'
const UNAUTHORIZED_MESSAGE = 'Unauthorized'
const WWW_AUTHENTICATE = 'Bearer realm="brandgeo-admin"'

const PROMPT_CATEGORIES = ['general', 'mid', 'large', 'very_large', 'tool_discovery', 'geo_category', 'problem_based', 'direct_brand']
const MAX_ROWS_PER_ADD = 100
const PLAN_RE = /^[a-z_]{1,40}$/
const INT4_MAX = 2147483647
const DEFAULT_CAP = 5

// Leading tokens of the errors raised by the admin SQL functions; anything
// else from the database is a 500 with no detail.
const SQL_ERROR_CODES = new Set([
  'prompt_cap_reached', 'location_invalid', 'location_archived', 'client_not_found',
  'invalid_category', 'too_many_rows', 'invalid_text', 'invalid_actor', 'invalid_ids',
])

const BASE_HEADERS = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' }

// ── Small helpers ────────────────────────────────────────────────────────────

function header(event, name) {
  const h = event.headers || {}
  const want = name.toLowerCase()
  for (const k of Object.keys(h)) if (k.toLowerCase() === want) return h[k]
  return undefined
}

function bearer(event) {
  const h = header(event, 'authorization')
  if (typeof h !== 'string') return ''
  const m = /^bearer +/i.exec(h)
  return m ? h.slice(m[0].length).trim() : ''
}

function scrub(msg) {
  return String(msg || '').replace(/bg(mcp|mat|mrt|ocs|adm)_\S*/gi, '[redacted]').replace(/[a-f0-9]{48,}/gi, '[redacted]')
}

function rpcResult(id, result) {
  return { statusCode: 200, headers: { ...BASE_HEADERS }, body: JSON.stringify({ jsonrpc: '2.0', id, result }) }
}

function rpcError(statusCode, id, code, message, data, extraHeaders) {
  const error = { code, message }
  if (data !== undefined) error.data = data
  return { statusCode, headers: { ...BASE_HEADERS, ...(extraHeaders || {}) }, body: JSON.stringify({ jsonrpc: '2.0', id, error }) }
}

function methodNotAllowed() {
  return { statusCode: 405, headers: { Allow: 'POST', 'X-Content-Type-Options': 'nosniff' }, body: '' }
}

function unauthorized(id) {
  return rpcError(401, id, -32001, UNAUTHORIZED_MESSAGE, undefined, { 'WWW-Authenticate': WWW_AUTHENTICATE })
}

function rateRetryAfter(nowMs, windowSeconds) {
  const nowSec = Math.floor(nowMs / 1000)
  const windowStart = Math.floor(nowSec / windowSeconds) * windowSeconds
  return Math.max(1, windowStart + windowSeconds - nowSec)
}

class ToolInputError extends Error {
  constructor(message, code = 'tool_input_error') { super(message); this.code = code }
}

function encodeCursor(id) { return Buffer.from(JSON.stringify({ id })).toString('base64url') }

function decodeCursor(cursor) {
  if (cursor === undefined || cursor === null) return null
  if (typeof cursor !== 'string' || !cursor || cursor.length > 200) throw new ToolInputError('Invalid cursor', 'invalid_cursor')
  try {
    const obj = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8'))
    // prompts.id is int4: an id above INT4_MAX would reach Postgres and fail as a 500.
    if (obj && Number.isSafeInteger(obj.id) && obj.id > 0 && obj.id <= 2147483647) return obj.id
  } catch { /* fall through */ }
  throw new ToolInputError('Invalid cursor', 'invalid_cursor')
}

function intArg(args, name, { min, max, def }) {
  const v = args[name]
  if (v === undefined || v === null) return def
  if (typeof v !== 'number' || !Number.isInteger(v)) throw new ToolInputError(`${name} must be an integer`)
  return Math.min(max, Math.max(min, v))
}

function boolArg(args, name, def) {
  const v = args[name]
  if (v === undefined || v === null) return def
  if (typeof v !== 'boolean') throw new ToolInputError(`${name} must be true or false`)
  return v
}

function idArg(args, name, { required = true } = {}) {
  const v = args[name]
  if (v === undefined || v === null) {
    if (required) throw new ToolInputError(`${name} is required`)
    return null
  }
  if (typeof v !== 'number' || !Number.isInteger(v) || v < 1 || v > INT4_MAX) throw new ToolInputError(`${name} must be a positive integer`)
  return v
}

function idListArg(args, name, { min, max, bigint = false }) {
  const v = args[name]
  if (!Array.isArray(v) || v.length < min || v.length > max) throw new ToolInputError(`${name} must be a list of ${min} to ${max} ids`)
  const ceiling = bigint ? Number.MAX_SAFE_INTEGER : INT4_MAX
  const out = []
  for (const x of v) {
    if (typeof x !== 'number' || !Number.isInteger(x) || x < 1 || x > ceiling) throw new ToolInputError(`${name} must hold positive integers`)
    if (!out.includes(x)) out.push(x)
  }
  return out
}

function rejectUnknownArgs(tool, args) {
  const allowed = Object.keys(tool.inputSchema.properties || {})
  for (const k of Object.keys(args)) {
    if (!allowed.includes(k)) throw new ToolInputError(`Unknown argument: ${String(k).slice(0, 40)}`, 'unknown_argument')
  }
}

/** Trim, collapse inner whitespace, then check length and control characters. */
function normalizePromptText(t) {
  if (typeof t !== 'string') throw new ToolInputError('Each text must be a string', 'invalid_text')
  const s = t.trim().replace(/\s+/g, ' ')
  if (s.length < 5 || s.length > 500) throw new ToolInputError('Each text must be 5 to 500 characters after trimming', 'invalid_text')
  // eslint-disable-next-line no-control-regex
  if (/[\x00-\x1f\x7f]/.test(s)) throw new ToolInputError('Texts may not contain control characters', 'invalid_text')
  return s
}

function locationLabel(row) {
  if (!row) return null
  const r = resolveLocation(row)
  const market = r.market_label || r.market_id || null
  if (!market) return null
  return r.region_label ? `${market} · ${r.region_label}` : market
}

/** A database error from the admin SQL functions, mapped by its leading token. */
function sqlToolError(error) {
  const msg = String((error && error.message) || '')
  const token = msg.split(':')[0].trim()
  if (SQL_ERROR_CODES.has(token)) return new ToolInputError(msg.slice(0, 300), token)
  return null
}

// ── Shared reads ─────────────────────────────────────────────────────────────

async function readCaps(sb) {
  const { data, error } = await sb.from('plan_prompt_caps').select('plan, prompt_cap')
  if (error) throw error
  const byPlan = new Map()
  for (const r of data || []) {
    if (r && r.prompt_cap !== null && r.prompt_cap !== undefined && Number.isFinite(Number(r.prompt_cap))) byPlan.set(r.plan, Number(r.prompt_cap))
  }
  return (plan) => (byPlan.has(plan) ? byPlan.get(plan) : byPlan.has('free') ? byPlan.get('free') : DEFAULT_CAP)
}

async function readCounts(sb, clientIds) {
  const out = new Map()
  if (clientIds.length === 0) return out
  const { data, error } = await sb.rpc('admin_prompt_counts', { p_client_ids: clientIds })
  if (error) throw error
  for (const r of data || []) out.set(Number(r.client_id), { active: Number(r.active) || 0, archived: Number(r.archived) || 0 })
  return out
}

async function readLiveLocations(sb, clientIds) {
  const out = new Map()
  if (clientIds.length === 0) return out
  const { data, error } = await sb.from('client_locations').select(LOCATION_COLUMNS)
    .in('client_id', clientIds).is('archived_at', null).order('position', { ascending: true })
  if (error) throw error
  for (const r of data || []) {
    const cid = Number(r.client_id)
    if (!out.has(cid)) out.set(cid, [])
    out.get(cid).push({ location_id: Number(r.id), label: locationLabel(r), is_primary: r.is_primary === true })
  }
  return out
}

const CLIENT_LIST_COLS = 'id, name, slug, plan, category, type, brand_website, created_at'
const CLIENT_DETAIL_COLS = `${CLIENT_LIST_COLS}, brand_aliases, known_competitors, default_market_id`

function clientSummary(c, counts, capFor, locations) {
  const cnt = counts.get(Number(c.id)) || { active: 0, archived: 0 }
  return {
    client_id: Number(c.id),
    name: c.name ?? null,
    plan: c.plan ?? null,
    category: c.category ?? null,
    type: c.type ?? null,
    website: c.brand_website ?? null,
    active_prompts: cnt.active,
    archived_prompts: cnt.archived,
    prompt_cap: capFor(c.plan),
    locations: locations.get(Number(c.id)) || [],
    created_at: c.created_at ?? null,
  }
}

async function readClient(sb, clientId, cols) {
  const { data, error } = await sb.from('clients').select(cols).eq('id', clientId).maybeSingle()
  if (error) throw error
  if (!data) throw new ToolInputError(`No client with id ${clientId}`, 'client_not_found')
  return data
}

// ── Tools ────────────────────────────────────────────────────────────────────

const READ_ANNOTATIONS = { readOnlyHint: true, idempotentHint: true, openWorldHint: false }
const WRITE_ANNOTATIONS = { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false }

const CLIENT_ID_PROP = { type: 'integer', minimum: 1, maximum: INT4_MAX, description: 'The client id.' }
const CURSOR_PROP = { type: 'string', description: 'next_cursor from the previous page.' }

const listClients = {
  name: 'list_clients',
  title: 'List clients',
  description: 'Lists BrandGEO accounts with their plan, prompt counts, prompt cap and live locations. Research accounts are hidden unless include_research is true. zero_prompts_only lists accounts with no active prompt.',
  inputSchema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      search: { type: 'string', minLength: 1, maxLength: 80, description: 'Case insensitive match on name, website or slug.' },
      plan: { type: 'string', pattern: '^[a-z_]{1,40}$', description: 'Only clients on this plan id.' },
      include_research: { type: 'boolean', default: false },
      zero_prompts_only: { type: 'boolean', default: false },
      limit: { type: 'integer', minimum: 1, maximum: 100, default: 50 },
      cursor: CURSOR_PROP,
    },
  },
  outputSchema: { type: 'object', properties: { clients: { type: 'array' }, next_cursor: { type: ['string', 'null'] } }, required: ['clients', 'next_cursor'] },
  annotations: READ_ANNOTATIONS,
  async run(ctx, args) {
    let search = null
    if (args.search !== undefined && args.search !== null) {
      if (typeof args.search !== 'string') throw new ToolInputError('search must be a string')
      search = args.search.trim().toLowerCase()
      if (search.length < 1 || search.length > 80) throw new ToolInputError('search must be 1 to 80 characters')
    }
    let plan = null
    if (args.plan !== undefined && args.plan !== null) {
      if (typeof args.plan !== 'string' || !PLAN_RE.test(args.plan)) throw new ToolInputError('plan must be a plan id such as free or growth')
      plan = args.plan
    }
    const includeResearch = boolArg(args, 'include_research', false)
    const zeroOnly = boolArg(args, 'zero_prompts_only', false)
    const limit = intArg(args, 'limit', { min: 1, max: 100, def: 50 })
    let after = decodeCursor(args.cursor)

    const { sb, cfg } = ctx
    const picked = []
    const counts = new Map()
    let nextCursor = null
    let exhausted = false
    for (let batch = 0; batch < cfg.scanBatches && picked.length < limit; batch++) {
      let q = sb.from('clients').select(CLIENT_LIST_COLS)
      if (plan) q = q.eq('plan', plan)
      if (after) q = q.gt('id', after)
      const { data, error } = await q.order('id', { ascending: true }).limit(cfg.scanBatch)
      if (error) throw error
      const rows = data || []
      if (rows.length < cfg.scanBatch) exhausted = true
      const candidates = rows.filter((c) => {
        if (!includeResearch && c.category === RESEARCH_CATEGORY) return false
        if (search) {
          const hay = [c.name, c.brand_website, c.slug].map((v) => String(v || '').toLowerCase())
          if (!hay.some((h) => h.includes(search))) return false
        }
        return true
      })
      const batchCounts = await readCounts(ctx.sb, candidates.map((c) => Number(c.id)))
      for (const [k, v] of batchCounts) counts.set(k, v)
      let stoppedAt = null
      for (const c of candidates) {
        if (zeroOnly && (batchCounts.get(Number(c.id)) || { active: 0 }).active > 0) continue
        picked.push(c)
        if (picked.length >= limit) { stoppedAt = Number(c.id); break }
      }
      if (stoppedAt !== null) {
        // The page is full: continue after the last returned row, so a match
        // later in this batch is not skipped.
        const lastScanned = rows.length ? Number(rows[rows.length - 1].id) : stoppedAt
        nextCursor = stoppedAt === lastScanned && exhausted ? null : encodeCursor(stoppedAt)
        break
      }
      if (exhausted) break
      after = Number(rows[rows.length - 1].id)
      nextCursor = encodeCursor(after)
    }
    if (exhausted && picked.length < limit) nextCursor = null

    const ids = picked.map((c) => Number(c.id))
    const capFor = await readCaps(sb)
    const locations = await readLiveLocations(sb, ids)
    return { clients: picked.map((c) => clientSummary(c, counts, capFor, locations)), next_cursor: nextCursor }
  },
}

const getClient = {
  name: 'get_client',
  title: 'Get one client',
  description: 'Reads one BrandGEO account: plan, brand aliases, competitors, prompt counts and cap, live locations, and up to 200 of its active prompt texts so new prompts can avoid duplicates.',
  inputSchema: { type: 'object', additionalProperties: false, required: ['client_id'], properties: { client_id: CLIENT_ID_PROP } },
  outputSchema: { type: 'object', properties: { client_id: { type: 'integer' }, active_prompt_texts: { type: 'array' } }, required: ['client_id'] },
  annotations: READ_ANNOTATIONS,
  async run(ctx, args) {
    const clientId = idArg(args, 'client_id')
    ctx.logClient = clientId
    const { sb } = ctx
    const c = await readClient(sb, clientId, CLIENT_DETAIL_COLS)
    const counts = await readCounts(sb, [clientId])
    const capFor = await readCaps(sb)
    const locations = await readLiveLocations(sb, [clientId])
    const { data, error } = await sb.from('prompts').select('id, text, category, location_id')
      .eq('client_id', clientId).eq('is_active', true).order('id', { ascending: true }).limit(200)
    if (error) throw error
    const summary = clientSummary(c, counts, capFor, locations)
    const texts = (data || []).map((p) => ({ prompt_id: Number(p.id), text: p.text, category: p.category ?? null, location_id: p.location_id == null ? null : Number(p.location_id) }))
    return {
      ...summary,
      brand_name: c.name ?? null,
      brand_aliases: Array.isArray(c.brand_aliases) ? c.brand_aliases : [],
      known_competitors: Array.isArray(c.known_competitors) ? c.known_competitors : [],
      default_market_id: c.default_market_id ?? null,
      remaining: Math.max(0, summary.prompt_cap - summary.active_prompts),
      active_prompt_texts: texts,
      active_prompt_texts_truncated: summary.active_prompts > texts.length,
    }
  },
}

const listPrompts = {
  name: 'list_prompts',
  title: 'List prompts',
  description: "Lists one client's prompts, active only unless include_archived is true, optionally for one location. Categories are returned as stored.",
  inputSchema: {
    type: 'object',
    additionalProperties: false,
    required: ['client_id'],
    properties: {
      client_id: CLIENT_ID_PROP,
      include_archived: { type: 'boolean', default: false },
      location_id: { type: 'integer', minimum: 1, description: 'Only prompts asked in this location.' },
      limit: { type: 'integer', minimum: 1, maximum: 200, default: 100 },
      cursor: CURSOR_PROP,
    },
  },
  outputSchema: { type: 'object', properties: { prompts: { type: 'array' }, next_cursor: { type: ['string', 'null'] } }, required: ['prompts', 'next_cursor'] },
  annotations: READ_ANNOTATIONS,
  async run(ctx, args) {
    const clientId = idArg(args, 'client_id')
    ctx.logClient = clientId
    const includeArchived = boolArg(args, 'include_archived', false)
    const locationId = args.location_id === undefined || args.location_id === null ? null : idListArg({ l: [args.location_id] }, 'l', { min: 1, max: 1, bigint: true })[0]
    const limit = intArg(args, 'limit', { min: 1, max: 200, def: 100 })
    const after = decodeCursor(args.cursor)
    const { sb } = ctx
    await readClient(sb, clientId, 'id')
    let q = sb.from('prompts').select('id, text, category, is_active, position, location_id, created_at').eq('client_id', clientId)
    if (!includeArchived) q = q.eq('is_active', true)
    if (locationId) q = q.eq('location_id', locationId)
    if (after) q = q.gt('id', after)
    const { data, error } = await q.order('id', { ascending: true }).limit(limit + 1)
    if (error) throw error
    const rows = (data || []).slice(0, limit)
    const more = (data || []).length > limit
    const locs = await loadLocationsByIds(sb, clientId, rows.map((p) => p.location_id))
    if (!locs.ok) console.warn(`[mcp-admin/${ctx.invId}] location labels read failed: ${scrub(locs.error)}`)
    return {
      prompts: rows.map((p) => ({
        prompt_id: Number(p.id),
        text: p.text,
        category: p.category ?? null,
        is_active: p.is_active === true,
        position: p.position ?? null,
        location_id: p.location_id == null ? null : Number(p.location_id),
        location_label: p.location_id == null ? null : locationLabel(locs.byId.get(Number(p.location_id))),
        created_at: p.created_at ?? null,
      })),
      next_cursor: more && rows.length ? encodeCursor(Number(rows[rows.length - 1].id)) : null,
    }
  },
}

const addPrompts = {
  name: 'add_prompts',
  title: 'Add prompts',
  description: "Adds prompts to one client, one row per text and location (omit location_ids for the client's primary location). Duplicates of active prompts are skipped and reported. Refuses to go over the plan prompt cap unless allow_over_cap is true. Does not start a collection.",
  write: true,
  inputSchema: {
    type: 'object',
    additionalProperties: false,
    required: ['client_id', 'texts'],
    properties: {
      client_id: CLIENT_ID_PROP,
      texts: { type: 'array', minItems: 1, maxItems: 25, items: { type: 'string', minLength: 5, maxLength: 500 } },
      location_ids: { type: 'array', minItems: 1, maxItems: 10, items: { type: 'integer', minimum: 1 } },
      category: { type: 'string', enum: PROMPT_CATEGORIES, default: 'general' },
      allow_over_cap: { type: 'boolean', default: false },
    },
  },
  outputSchema: { type: 'object', properties: { created: { type: 'array' }, skipped_duplicates: { type: 'array' }, over_cap: { type: 'boolean' } }, required: ['created', 'skipped_duplicates'] },
  annotations: WRITE_ANNOTATIONS,
  async run(ctx, args) {
    const clientId = idArg(args, 'client_id')
    ctx.logClient = clientId
    if (!Array.isArray(args.texts) || args.texts.length < 1 || args.texts.length > 25) throw new ToolInputError('texts must be a list of 1 to 25 prompts', 'invalid_text')
    const texts = args.texts.map(normalizePromptText)
    const locationIds = args.location_ids === undefined || args.location_ids === null
      ? null
      : idListArg(args, 'location_ids', { min: 1, max: 10, bigint: true })
    let category = 'general'
    if (args.category !== undefined && args.category !== null) {
      if (typeof args.category !== 'string' || !PROMPT_CATEGORIES.includes(args.category)) {
        throw new ToolInputError(`category must be one of ${PROMPT_CATEGORIES.join(', ')}`, 'invalid_category')
      }
      category = args.category
    }
    const allowOverCap = boolArg(args, 'allow_over_cap', false)
    if (texts.length * (locationIds ? locationIds.length : 1) > MAX_ROWS_PER_ADD) {
      throw new ToolInputError(`At most ${MAX_ROWS_PER_ADD} prompts (texts times locations) in one call`, 'too_many_rows')
    }

    const { sb, key } = ctx
    const { data, error } = await sb.rpc('admin_add_prompts', {
      p_client_id: clientId,
      p_texts: texts,
      p_location_ids: locationIds,
      p_category: category,
      p_allow_over_cap: allowOverCap,
      p_actor: key.created_by,
      p_key_id: key.id,
    })
    if (error) {
      const te = sqlToolError(error)
      if (te) throw te
      throw error
    }
    const res = data || {}
    const created = Array.isArray(res.created) ? res.created : []
    const locs = await loadLocationsByIds(sb, clientId, created.map((r) => r.location_id))
    if (!locs.ok) console.warn(`[mcp-admin/${ctx.invId}] location labels read failed: ${scrub(locs.error)}`)
    ctx.outcome = created.length ? 'ok' : 'noop'
    return {
      client_id: clientId,
      created: created.map((r) => ({
        prompt_id: Number(r.prompt_id),
        text: r.text,
        location_id: r.location_id == null ? null : Number(r.location_id),
        location_label: r.location_id == null ? null : locationLabel(locs.byId.get(Number(r.location_id))),
      })),
      skipped_duplicates: Array.isArray(res.skipped_duplicates) ? res.skipped_duplicates : [],
      active_prompts: res.active_prompts ?? null,
      prompt_cap: res.prompt_cap ?? null,
      over_cap: res.over_cap === true,
    }
  },
}

const archivePrompts = {
  name: 'archive_prompts',
  title: 'Archive prompts',
  description: "Archives prompts of one client (is_active false). Never deletes. Ids that are not this client's come back as not_found.",
  write: true,
  inputSchema: {
    type: 'object',
    additionalProperties: false,
    required: ['client_id', 'prompt_ids'],
    properties: {
      client_id: CLIENT_ID_PROP,
      prompt_ids: { type: 'array', minItems: 1, maxItems: 50, items: { type: 'integer', minimum: 1 } },
    },
  },
  outputSchema: { type: 'object', properties: { archived: { type: 'array' }, already_archived: { type: 'array' }, not_found: { type: 'array' } }, required: ['archived', 'already_archived', 'not_found'] },
  annotations: WRITE_ANNOTATIONS,
  async run(ctx, args) {
    const clientId = idArg(args, 'client_id')
    ctx.logClient = clientId
    const promptIds = idListArg(args, 'prompt_ids', { min: 1, max: 50, bigint: true })
    const { sb, key } = ctx
    const { data, error } = await sb.rpc('admin_archive_prompts', {
      p_client_id: clientId,
      p_prompt_ids: promptIds,
      p_actor: key.created_by,
      p_key_id: key.id,
    })
    if (error) {
      const te = sqlToolError(error)
      if (te) throw te
      throw error
    }
    const res = data || {}
    const archived = Array.isArray(res.archived) ? res.archived.map(Number) : []
    ctx.outcome = archived.length ? 'ok' : 'noop'
    return {
      client_id: clientId,
      archived,
      already_archived: Array.isArray(res.already_archived) ? res.already_archived.map(Number) : [],
      not_found: Array.isArray(res.not_found) ? res.not_found.map(Number) : [],
      active_prompts: res.active_prompts ?? null,
    }
  },
}

const READ_TOOLS = [listClients, getClient, listPrompts]
const WRITE_TOOLS = [addPrompts, archivePrompts]
const ALL_TOOLS = [...READ_TOOLS, ...WRITE_TOOLS]
const TOOL_BY_NAME = new Map(ALL_TOOLS.map((t) => [t.name, t]))

function toolsListResult(version, scope) {
  const withOutput = version >= OUTPUT_SCHEMA_SINCE
  const visible = scope === 'prompts_write' ? ALL_TOOLS : READ_TOOLS
  return {
    tools: visible.map((t) => {
      const def = { name: t.name, title: t.title, description: t.description, inputSchema: t.inputSchema, annotations: t.annotations }
      if (withOutput) def.outputSchema = t.outputSchema
      return def
    }),
  }
}

// ── Credential (section 3.3) ─────────────────────────────────────────────────

/** -> { key } | { status: 401 } | { status: 403 }. A key read error throws. */
async function resolveAdminKey(sb, token, nowMs) {
  const { data: row, error } = await sb.from('admin_api_keys')
    .select('id, created_by, scope, expires_at, revoked_at, last_used_at')
    .eq('key_hash', hashAdminApiKey(token)).maybeSingle()
  if (error) throw error
  if (!row || row.revoked_at) return { status: 401 }
  const exp = Date.parse(row.expires_at)
  if (!Number.isFinite(exp) || exp <= nowMs) return { status: 401 }
  // Creator re-check: any failure, a read error included, is a refusal.
  try {
    if (!row.created_by) return { status: 403 }
    const u = await sb.auth.admin.getUserById(row.created_by)
    const user = u && u.data && u.data.user
    if (!u || u.error || !user || isBannedUser(user)) return { status: 403 }
    const p = await sb.from('user_profiles').select('role').eq('id', row.created_by).maybeSingle()
    if (!p || p.error || !p.data || p.data.role !== 'admin') return { status: 403 }
  } catch {
    return { status: 403 }
  }
  return { key: row }
}

// ── Handler ──────────────────────────────────────────────────────────────────

/** handle(event, context, { supabase, now, config }) -- injectable for tests. */
async function handle(event, context = {}, opts = {}) {
  const t0 = Date.now()
  const cfg = { ...DEFAULT_CONFIG, ...(opts.config || {}) }
  const nowFn = opts.now || (() => new Date())
  const invId = String((context && context.awsRequestId) || '-').slice(0, 8)
  const log = { method: '-', tool: '', client: null, key: '-' }
  const finish = (res, code) => {
    const tool = log.tool ? ` ${log.tool}` : ''
    const client = log.client === null ? '' : ` client=${log.client}`
    const rpc = code ? ` code=${code}` : ''
    console.log(`[mcp-admin/${invId}] ${log.method}${tool}${client} key=${log.key} status=${res.statusCode}${rpc} ms=${Date.now() - t0}`)
    return res
  }

  if (event.httpMethod !== 'POST') return finish(methodNotAllowed(), null)

  const raw = event.isBase64Encoded ? Buffer.from(event.body || '', 'base64') : Buffer.from(event.body || '', 'utf8')
  if (raw.length > cfg.maxBodyBytes) return finish(rpcError(413, null, -32600, 'Request too large'), '-32600')

  const origin = header(event, 'origin')
  if (origin && !ALLOWED_ORIGINS.includes(origin)) return finish(rpcError(403, null, -32600, 'Origin not allowed'), '-32600')

  let msg
  try { msg = JSON.parse(raw.toString('utf8')) } catch { return finish(rpcError(400, null, -32700, 'Parse error'), '-32700') }

  if (Array.isArray(msg) || !msg || typeof msg !== 'object' || msg.jsonrpc !== '2.0') {
    return finish(rpcError(400, null, -32600, 'Invalid Request'), '-32600')
  }

  if (!('id' in msg) || 'result' in msg || 'error' in msg) {
    return finish({ statusCode: 202, headers: { 'X-Content-Type-Options': 'nosniff' }, body: '' }, null)
  }
  const id = msg.id
  if ((typeof id !== 'string' && typeof id !== 'number') || typeof msg.method !== 'string') {
    return finish(rpcError(400, typeof id === 'string' || typeof id === 'number' ? id : null, -32600, 'Invalid Request'), '-32600')
  }
  const method = msg.method
  log.method = KNOWN_METHODS.has(method) ? method : 'other'

  try {
    const now = nowFn()
    const nowMs = now.getTime()

    // Key shape first: anything else is 401 with no database read.
    const token = bearer(event)
    if (!ADMIN_API_KEY_RE.test(token)) return finish(unauthorized(id), '-32001')
    const sb = opts.supabase || createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)
    const resolved = await resolveAdminKey(sb, token, nowMs)
    if (resolved.status === 401) return finish(unauthorized(id), '-32001')
    if (resolved.status === 403) return finish(rpcError(403, id, -32003, 'admin_required'), '-32003')
    const key = resolved.key
    log.key = String(key.id)

    if (!key.last_used_at || nowMs - Date.parse(key.last_used_at) >= LAST_USED_THROTTLE_MS) {
      try {
        const up = await sb.from('admin_api_keys').update({ last_used_at: now.toISOString() }).eq('id', key.id)
        if (up && up.error) console.warn(`[mcp-admin/${invId}] last_used_at stamp failed for key ${key.id}: ${scrub(up.error.message)}`)
      } catch (e) {
        console.warn(`[mcp-admin/${invId}] last_used_at stamp failed for key ${key.id}: ${scrub(e && e.message)}`)
      }
    }

    const hv = header(event, 'mcp-protocol-version')
    if (hv !== undefined && !SUPPORTED_PROTOCOL_VERSIONS.includes(hv)) {
      return finish(rpcError(400, id, -32600, 'Unsupported MCP-Protocol-Version'), '-32600')
    }
    const version = hv || DEFAULT_HEADER_VERSION

    const rateCheck = async (rkey, limit, windowSeconds, scope) => {
      const { data, error } = await sb.rpc('affiliate_rate_check', { p_key: rkey, p_limit: limit, p_window_seconds: windowSeconds })
      if (error) throw error
      if (data === true) return null
      const retryAfter = rateRetryAfter(nowMs, windowSeconds)
      const message = scope === 'key_day'
        ? 'Daily admin MCP limit reached. It resets at 00:00 UTC.'
        : scope === 'key_write_hour'
          ? `Write limit reached: ${limit} write calls an hour per key. Retry in ${retryAfter} seconds.`
          : `Rate limit reached: ${limit} calls a minute per key. Retry in ${retryAfter} seconds.`
      return finish(rpcError(200, id, -32029, message, { retry_after: retryAfter, scope, limit }, { 'Retry-After': String(retryAfter) }), '-32029')
    }

    const minuteLimited = await rateCheck(`mcpadm:key:${key.id}`, cfg.perKeyPerMinute, 60, 'key_minute')
    if (minuteLimited) return minuteLimited

    if (method === 'initialize') {
      const params = msg.params && typeof msg.params === 'object' ? msg.params : {}
      const negotiated = SUPPORTED_PROTOCOL_VERSIONS.includes(params.protocolVersion) ? params.protocolVersion : LATEST_PROTOCOL_VERSION
      return finish(rpcResult(id, {
        protocolVersion: negotiated,
        capabilities: { tools: { listChanged: false } },
        serverInfo: SERVER_INFO,
        instructions: INSTRUCTIONS,
      }), null)
    }
    if (method === 'ping') return finish(rpcResult(id, {}), null)
    if (method === 'tools/list') return finish(rpcResult(id, toolsListResult(version, key.scope)), null)
    if (method !== 'tools/call') return finish(rpcError(200, id, -32601, 'Method not found'), '-32601')

    const params = msg.params && typeof msg.params === 'object' && !Array.isArray(msg.params) ? msg.params : {}
    const tool = typeof params.name === 'string' ? TOOL_BY_NAME.get(params.name) : undefined
    if (!tool) {
      log.tool = 'unknown'
      return finish(rpcError(200, id, -32602, 'Unknown tool', { tool: typeof params.name === 'string' ? params.name.slice(0, 80) : null }), '-32602')
    }
    log.tool = tool.name

    const dayLimited = await rateCheck(`mcpadm:key:${key.id}:day`, cfg.perKeyPerDay, 86400, 'key_day')
    if (dayLimited) return dayLimited

    const toolError = (code, message) => finish(rpcResult(id, {
      content: [{ type: 'text', text: JSON.stringify({ error: { code, message } }) }],
      isError: true,
    }), code)

    const args = params.arguments === undefined || params.arguments === null ? {} : params.arguments
    if (typeof args !== 'object' || Array.isArray(args)) return toolError('tool_input_error', 'arguments must be an object')

    if (tool.write) {
      if (key.scope !== 'prompts_write') return toolError('scope_read_only', 'This admin key is read only.')
      const writeLimited = await rateCheck(`mcpadm:key:${key.id}:writes:hour`, cfg.writesPerKeyPerHour, 3600, 'key_write_hour')
      if (writeLimited) return writeLimited
    }

    const ctx = { sb, cfg, key, invId, nowMs, outcome: null, logClient: null }
    let out
    try {
      rejectUnknownArgs(tool, args)
      out = await tool.run(ctx, args)
    } catch (e) {
      if (ctx.logClient !== null) log.client = ctx.logClient
      if (e instanceof ToolInputError) return toolError(e.code, e.message)
      throw e
    }
    if (ctx.logClient !== null) log.client = ctx.logClient
    return finish(rpcResult(id, { content: [{ type: 'text', text: JSON.stringify(out) }], structuredContent: out }), ctx.outcome)
  } catch (e) {
    console.error(`[mcp-admin/${invId}] failed: ${scrub(e && e.message)}`)
    return finish(rpcError(500, id, -32603, 'Internal error'), '-32603')
  }
}

exports.handler = (event, context) => handle(event, context)
exports.handle = handle
exports.TOOL_NAMES = ALL_TOOLS.map((t) => t.name)
exports.WRITE_TOOL_NAMES = WRITE_TOOLS.map((t) => t.name)
exports.SUPPORTED_PROTOCOL_VERSIONS = SUPPORTED_PROTOCOL_VERSIONS
exports.PER_KEY_PER_MINUTE = PER_KEY_PER_MINUTE
exports.PER_KEY_PER_DAY = PER_KEY_PER_DAY
exports.WRITES_PER_KEY_PER_HOUR = WRITES_PER_KEY_PER_HOUR
exports.PROMPT_CATEGORIES = PROMPT_CATEGORIES
exports.normalizePromptText = normalizePromptText
exports.scrub = scrub
