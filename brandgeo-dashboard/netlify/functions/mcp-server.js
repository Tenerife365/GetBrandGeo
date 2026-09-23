/**
 * mcp-server.js -- remote MCP (Model Context Protocol) server, read-only.
 * Contract: docs/arch/mcp-access.md (sections 2, 3.4, 4.3, 4.4, 5, 6).
 *
 * POST https://app.getbrandgeo.com/mcp   (netlify.toml rewrites /mcp here)
 * Authorization: Bearer bgmcp_<client_id>_<48 hex>
 *
 * Transport: Streamable HTTP, stateless, JSON responses only. One JSON-RPC
 * message per POST, no batching, no SSE, no Mcp-Session-Id. GET, DELETE,
 * OPTIONS and anything else: 405 with Allow: POST.
 *
 * AUTHORITY. The client id comes from the client_api_keys row found by the
 * sha256 of the key, never from tool arguments. Plan gate: mcpAllowedFor() in
 * _plans.js, on the live clients row, on tools/list and tools/call only.
 *
 * WRITES. The only writes an MCP request can cause are the rate counter
 * upserts (affiliate_rate_check with an `mcp:` namespace) and the throttled
 * client_api_keys.last_used_at stamp. No tool calls an LLM, enqueues a
 * collection or writes a row.
 *
 * LOGGING. One line per request (section 6.4). Never logged: the key, its
 * prefix, its hash, the Authorization header, the raw body, or tool arguments
 * other than prompt_id, window_days, limit. The method and tool name are only
 * logged when they are one this server knows, so a caller cannot smuggle text
 * into the log through them.
 *
 * BUNDLING. netlify.toml sets node_bundler = "esbuild" for this one function so
 * the two .ts requires below are bundled from the dashboard's own source:
 * MCP numbers and dashboard numbers come from one implementation. Under plain
 * node (tests) tests/helpers/ts_require.js registers the .ts loader.
 */

const { createClient } = require('@supabase/supabase-js')
const { ALLOWED_ORIGINS } = require('./_auth')
const { activeEnginesFor, RESEARCH_CATEGORY } = require('./_cost')
const { PLAN_LABELS, ENGINE_LABELS, MCP_MIN_PLAN, mcpAllowedFor } = require('./_plans')
const { CLIENT_API_KEY_RE, hashClientApiKey, clientIdFromKey } = require('./_client_api_key')
const { isNoAnswerRow } = require('../../src/lib/aiVisibilityScore.ts')
const { aggregateCompetitors, cleanCompetitorName, isLikelyCompanyName } = require('../../src/lib/competitorFilter.ts')

// ── Limits (section 6.1; ruling 6 changes only these two) ────────────────────
const MCP_PER_KEY_PER_MINUTE = 60
const MCP_PER_CLIENT_PER_DAY = 5000

const MAX_BODY_BYTES = 65536
const SCAN_PAGE = 1000
const SCAN_CEILING = 25000
const SCAN_BUDGET_MS = 18000
const PROMPT_ID_CEILING = 5000
const LAST_USED_THROTTLE_MS = 60_000

const SUPPORTED_PROTOCOL_VERSIONS = ['2025-11-25', '2025-06-18', '2025-03-26']
const LATEST_PROTOCOL_VERSION = SUPPORTED_PROTOCOL_VERSIONS[0]
// Streamable HTTP: a request without MCP-Protocol-Version is treated as the
// oldest version that defined this transport.
const DEFAULT_HEADER_VERSION = '2025-03-26'
// outputSchema / structured output exists from this revision on (rule 11).
const OUTPUT_SCHEMA_SINCE = '2025-06-18'

const DEFAULT_CONFIG = {
  perKeyPerMinute: MCP_PER_KEY_PER_MINUTE,
  perClientPerDay: MCP_PER_CLIENT_PER_DAY,
  maxBodyBytes: MAX_BODY_BYTES,
  scanPage: SCAN_PAGE,
  scanCeiling: SCAN_CEILING,
  scanBudgetMs: SCAN_BUDGET_MS,
  promptIdCeiling: PROMPT_ID_CEILING,
}

const UPGRADE_URL = 'https://app.getbrandgeo.com/account'
const UNAUTHORIZED_MESSAGE = 'Invalid or missing BrandGEO API key.'
const KNOWN_METHODS = new Set(['initialize', 'ping', 'tools/list', 'tools/call'])

const SERVER_INFO = { name: 'brandgeo', title: 'BrandGEO', version: '1.0.0' }
const INSTRUCTIONS = "Read-only access to one BrandGEO account's AI visibility data: how often AI engines mention the brand, for which prompts, next to which competitors, with what sentiment, plus the latest recommendations. Data is refreshed by BrandGEO's own collection runs; these tools never start a collection."

const BASE_HEADERS = {
  'Content-Type': 'application/json',
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff',
}

// ── Small helpers ────────────────────────────────────────────────────────────

function header(event, name) {
  const h = event.headers || {}
  const want = name.toLowerCase()
  for (const k of Object.keys(h)) if (k.toLowerCase() === want) return h[k]
  return undefined
}

function bearer(event) {
  const h = header(event, 'authorization') || ''
  return h.startsWith('Bearer ') ? h.slice(7).trim() : ''
}

function round(n, places) {
  const f = 10 ** places
  return Math.round(n * f) / f
}

function rate(num, den) { return den > 0 ? round(num / den, 4) : null }

/** Strip anything shaped like a key or a sha256 hex from a message before it is logged. */
function scrub(msg) {
  return String(msg || '').replace(/bgmcp_\S*/g, '[redacted]').replace(/[a-f0-9]{64}/gi, '[redacted]')
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
  return rpcError(401, id, -32001, UNAUTHORIZED_MESSAGE, undefined, { 'WWW-Authenticate': 'Bearer realm="brandgeo-mcp"' })
}

class ToolInputError extends Error {}

function encodeCursor(id) { return Buffer.from(JSON.stringify({ id })).toString('base64url') }

function decodeCursor(cursor) {
  if (cursor === undefined || cursor === null) return null
  if (typeof cursor !== 'string' || !cursor) throw new ToolInputError('Invalid cursor')
  try {
    const obj = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8'))
    if (obj && Number.isSafeInteger(obj.id) && obj.id > 0) return obj.id
  } catch { /* fall through */ }
  throw new ToolInputError('Invalid cursor')
}

/** Integer argument, clamped (a clamp, not an error). Wrong type is an input error. */
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

function windowFor(days, nowMs) {
  return { days, from: new Date(nowMs - days * 86400_000).toISOString(), to: new Date(nowMs).toISOString() }
}

function rateRetryAfter(nowMs, w) {
  const nowSec = Math.floor(nowMs / 1000)
  const windowStart = Math.floor(nowSec / w) * w
  return Math.max(1, windowStart + w - nowSec)
}

// ── Shared reads ─────────────────────────────────────────────────────────────

/**
 * Keyset scan of ai_results (rule 9). `extra` narrows the query (engines,
 * sentiment). Stops at the ceiling or the time budget and reports it.
 */
async function scanResults(sb, cfg, clientId, fromIso, cols, extra = (q) => q) {
  const t0 = Date.now()
  let rows = []
  let lastId = null
  let truncated = false
  for (;;) {
    let q = sb.from('ai_results').select(cols)
      .eq('client_id', clientId).neq('status', 'error').gte('checked_at', fromIso)
    q = extra(q)
    if (lastId !== null) q = q.lt('id', lastId)
    const { data, error } = await q.order('id', { ascending: false }).limit(cfg.scanPage)
    if (error) throw error
    rows = rows.concat(data || [])
    if (!data || data.length < cfg.scanPage) break
    lastId = data[data.length - 1].id
    if (rows.length >= cfg.scanCeiling || Date.now() - t0 > cfg.scanBudgetMs) { truncated = true; break }
  }
  return { rows, truncated }
}

/** Active prompt ids of the client, keyset-paged by id, up to the ceiling (rule 4). */
async function activePromptIds(sb, cfg, clientId) {
  const ids = new Set()
  let last = null
  const page = Math.min(1000, cfg.promptIdCeiling)
  while (ids.size < cfg.promptIdCeiling) {
    let q = sb.from('prompts').select('id').eq('client_id', clientId).eq('is_active', true)
    if (last !== null) q = q.gt('id', last)
    const { data, error } = await q.order('id', { ascending: true }).limit(page)
    if (error) throw error
    for (const r of data || []) ids.add(Number(r.id))
    if (!data || data.length < page) break
    last = data[data.length - 1].id
  }
  return ids
}

/** Rules 3 and 4: keep rows on an active engine and an active prompt. */
function keepRows(rows, engines, promptIds) {
  const eng = new Set(engines)
  return rows.filter((r) => eng.has(r.llm) && (!promptIds || promptIds.has(Number(r.prompt_id))))
}

function effectiveFrom(win, rows, truncated) {
  if (!truncated || rows.length === 0) return win.from
  let oldest = null
  for (const r of rows) if (r.checked_at && (oldest === null || r.checked_at < oldest)) oldest = r.checked_at
  return oldest || win.from
}

function parseCompetitorNames(raw) {
  let comps
  try { comps = JSON.parse(raw || '[]') } catch { return [] }
  if (!Array.isArray(comps)) return []
  const out = []
  for (const c of comps) {
    const name = typeof c === 'string' ? c : (c && typeof c === 'object' ? c.name : undefined)
    if (!isLikelyCompanyName(name)) continue
    out.push(cleanCompetitorName(name))
    if (out.length >= 20) break
  }
  return out
}

function emptyStats() { return { checks: 0, no_answer: 0, answered: 0, mentioned: 0, mention_rate: null, avg_position: null } }

function finishStats(s, positions) {
  s.answered = s.checks - s.no_answer
  s.mention_rate = rate(s.mentioned, s.answered)
  s.avg_position = positions.length ? round(positions.reduce((a, b) => a + b, 0) / positions.length, 1) : null
  return s
}

// ── Tools (section 5) ────────────────────────────────────────────────────────

async function toolBrandOverview(ctx) {
  const { sb, client, clientId, engines, nowIso } = ctx
  const latest = await sb.from('ai_results').select('checked_at')
    .eq('client_id', clientId).neq('status', 'error')
    .order('checked_at', { ascending: false }).limit(1).maybeSingle()
  if (latest.error) throw latest.error
  const run = await sb.from('collection_runs').select('created_at, trigger')
    .eq('client_id', clientId).order('created_at', { ascending: false }).limit(1).maybeSingle()
  if (run.error) throw run.error
  const total = await sb.from('prompts').select('id', { count: 'exact', head: true }).eq('client_id', clientId)
  if (total.error) throw total.error
  const active = await sb.from('prompts').select('id', { count: 'exact', head: true }).eq('client_id', clientId).eq('is_active', true)
  if (active.error) throw active.error

  const aliases = Array.isArray(client.brand_aliases) ? client.brand_aliases.filter((a) => typeof a === 'string').slice(0, 50) : []
  return {
    client_id: clientId,
    generated_at: nowIso,
    brand: { name: client.name || '', aliases, website: client.brand_website || null },
    plan: { id: client.plan, label: PLAN_LABELS[client.plan] || client.plan },
    engines: engines.map((e) => ({ id: e, label: ENGINE_LABELS[e] || e })),
    last_result_at: latest.data ? latest.data.checked_at : null,
    last_run: run.data ? { started_at: run.data.created_at, trigger: run.data.trigger || null } : null,
    prompts: { active: active.count || 0, total: total.count || 0 },
    limits: { calls_per_minute_per_key: ctx.cfg.perKeyPerMinute, calls_per_day: ctx.cfg.perClientPerDay },
  }
}

async function toolVisibilitySummary(ctx, args) {
  const { sb, cfg, clientId, engines, nowIso, nowMs } = ctx
  const days = intArg(args, 'window_days', { min: 1, max: 365, def: 30 })
  const win = windowFor(days, nowMs)
  const promptIds = await activePromptIds(sb, cfg, clientId)
  const { rows: raw, truncated } = await scanResults(sb, cfg, clientId, win.from,
    'id, prompt_id, llm, brand_mentioned, brand_position, response_snippet, checked_at',
    (q) => q.in('llm', engines))
  const rows = keepRows(raw, engines, promptIds)

  const overall = emptyStats()
  const overallPos = []
  const per = new Map(engines.map((e) => [e, { s: emptyStats(), pos: [] }]))
  const latest = new Map()
  for (const r of rows) {
    const e = per.get(r.llm)
    const noAnswer = isNoAnswerRow(r)
    for (const [s, pos] of [[overall, overallPos], [e.s, e.pos]]) {
      s.checks++
      if (noAnswer) { s.no_answer++; continue }
      if (r.brand_mentioned === true) {
        s.mentioned++
        if (typeof r.brand_position === 'number' && Number.isFinite(r.brand_position)) pos.push(r.brand_position)
      }
    }
    if (!noAnswer) {
      const key = `${r.prompt_id}|${r.llm}`
      const prev = latest.get(key)
      if (!prev || String(r.checked_at) > String(prev.checked_at) || (r.checked_at === prev.checked_at && r.id > prev.id)) latest.set(key, r)
    }
  }
  const snapMentioned = Array.from(latest.values()).filter((r) => r.brand_mentioned === true).length
  return {
    client_id: clientId,
    generated_at: nowIso,
    window: { ...win, effective_from: effectiveFrom(win, raw, truncated) },
    overall: finishStats(overall, overallPos),
    by_engine: engines.map((e) => ({ engine: e, label: ENGINE_LABELS[e] || e, ...finishStats(per.get(e).s, per.get(e).pos) })),
    latest_snapshot: { pairs: latest.size, mentioned: snapMentioned, mention_rate: rate(snapMentioned, latest.size) },
    rows_scanned: raw.length,
    truncated,
  }
}

async function toolListPrompts(ctx, args) {
  const { sb, clientId, nowIso } = ctx
  const activeOnly = boolArg(args, 'active_only', true)
  const limit = intArg(args, 'limit', { min: 1, max: 200, def: 200 })
  const cursorId = decodeCursor(args.cursor)
  let q = sb.from('prompts').select('id, text, category, is_active, position').eq('client_id', clientId)
  if (activeOnly) q = q.eq('is_active', true)
  if (cursorId !== null) q = q.gt('id', cursorId)
  const { data, error } = await q.order('id', { ascending: true }).limit(limit + 1)
  if (error) throw error
  const page = (data || []).slice(0, limit)
  return {
    client_id: clientId,
    generated_at: nowIso,
    prompts: page.map((p) => ({ id: p.id, text: p.text, category: p.category ?? null, is_active: p.is_active !== false, position: p.position ?? null })),
    next_cursor: (data || []).length > limit ? encodeCursor(page[page.length - 1].id) : null,
  }
}

async function toolPromptResults(ctx, args) {
  const { sb, clientId, engines, nowIso, nowMs } = ctx
  const pid = args.prompt_id
  if (typeof pid !== 'number' || !Number.isInteger(pid) || pid < 1) throw new ToolInputError('prompt_id is required and must be a positive integer')
  const days = intArg(args, 'window_days', { min: 1, max: 365, def: 30 })
  const limit = intArg(args, 'limit', { min: 1, max: 200, def: 50 })
  const cursorId = decodeCursor(args.cursor)
  const win = windowFor(days, nowMs)

  const p = await sb.from('prompts').select('id, text, category, is_active').eq('id', pid).eq('client_id', clientId).maybeSingle()
  if (p.error) throw p.error
  if (!p.data) throw new ToolInputError('No prompt with that id on this account.')

  let q = sb.from('ai_results')
    .select('id, llm, brand_mentioned, brand_position, sentiment, response_snippet, competitors_mentioned, checked_at')
    .eq('client_id', clientId).eq('prompt_id', pid).neq('status', 'error').gte('checked_at', win.from)
    .in('llm', engines)
  if (cursorId !== null) q = q.lt('id', cursorId)
  const { data, error } = await q.order('id', { ascending: false }).limit(limit + 1)
  if (error) throw error
  const page = (data || []).slice(0, limit)
  const eng = new Set(engines)
  return {
    client_id: clientId,
    generated_at: nowIso,
    prompt: { id: p.data.id, text: p.data.text, category: p.data.category ?? null, is_active: p.data.is_active !== false },
    window: { ...win, effective_from: win.from },
    results: page.filter((r) => eng.has(r.llm)).map((r) => ({
      engine: r.llm,
      label: ENGINE_LABELS[r.llm] || r.llm,
      checked_at: r.checked_at,
      mentioned: r.brand_mentioned === true,
      position: typeof r.brand_position === 'number' ? r.brand_position : null,
      sentiment: r.sentiment ?? null,
      no_answer: isNoAnswerRow(r),
      snippet: typeof r.response_snippet === 'string' ? r.response_snippet.slice(0, 500) : null,
      competitors: parseCompetitorNames(r.competitors_mentioned),
    })),
    next_cursor: (data || []).length > limit ? encodeCursor(page[page.length - 1].id) : null,
  }
}

async function toolCompetitors(ctx, args) {
  const { sb, cfg, client, clientId, engines, nowIso, nowMs } = ctx
  const days = intArg(args, 'window_days', { min: 1, max: 365, def: 30 })
  const limit = intArg(args, 'limit', { min: 1, max: 50, def: 10 })
  const win = windowFor(days, nowMs)
  const promptIds = await activePromptIds(sb, cfg, clientId)
  const { rows: raw, truncated } = await scanResults(sb, cfg, clientId, win.from,
    'id, llm, prompt_id, brand_mentioned, response_snippet, competitors_mentioned, checked_at',
    (q) => q.in('llm', engines))
  const answered = keepRows(raw, engines, promptIds).filter((r) => !isNoAnswerRow(r))
  const known = Array.isArray(client.known_competitors) ? client.known_competitors.filter((s) => typeof s === 'string') : []
  const agg = aggregateCompetitors(answered, { limit, knownCompetitors: known })
  const brandMentioned = answered.filter((r) => r.brand_mentioned === true).length
  return {
    client_id: clientId,
    generated_at: nowIso,
    window: { ...win, effective_from: effectiveFrom(win, raw, truncated) },
    answered: answered.length,
    brand: { mentioned: brandMentioned, share: rate(brandMentioned, answered.length) },
    competitors: agg.map((c) => ({
      name: c.name,
      total_mentions: c.totalMentions,
      ranked_mentions: c.rankedMentions,
      prose_only: c.proseOnly,
      avg_position: c.avgPos,
      share: rate(c.totalMentions, answered.length),
      by_engine: { ...c.byEngine },
      prompts: c.promptIds.length,
    })),
    rows_scanned: raw.length,
    truncated,
  }
}

async function toolSentimentSummary(ctx, args) {
  const { sb, cfg, clientId, engines, nowIso, nowMs } = ctx
  const days = intArg(args, 'window_days', { min: 1, max: 365, def: 30 })
  const win = windowFor(days, nowMs)
  const promptIds = await activePromptIds(sb, cfg, clientId)
  const { rows: raw, truncated } = await scanResults(sb, cfg, clientId, win.from,
    'id, llm, prompt_id, sentiment, response_snippet, checked_at',
    (q) => q.eq('brand_mentioned', true).in('llm', engines))
  const rows = keepRows(raw, engines, promptIds).filter((r) => !isNoAnswerRow(r))
  const blank = () => ({ total: 0, positive: 0, neutral: 0, negative: 0, unclassified: 0 })
  const overall = blank()
  const per = new Map(engines.map((e) => [e, blank()]))
  for (const r of rows) {
    const k = r.sentiment === 'positive' || r.sentiment === 'neutral' || r.sentiment === 'negative' ? r.sentiment : 'unclassified'
    for (const s of [overall, per.get(r.llm)]) { s.total++; s[k]++ }
  }
  return {
    client_id: clientId,
    generated_at: nowIso,
    window: { ...win, effective_from: effectiveFrom(win, raw, truncated) },
    overall,
    by_engine: engines.map((e) => ({ engine: e, label: ENGINE_LABELS[e] || e, ...per.get(e) })),
    rows_scanned: raw.length,
    truncated,
  }
}

async function toolRecommendations(ctx, args) {
  const { sb, clientId, nowIso } = ctx
  const limit = intArg(args, 'limit', { min: 1, max: 50, def: 20 })
  const run = await sb.from('recommendation_runs').select('id, generated_at, model, rec_count')
    .eq('client_id', clientId).order('generated_at', { ascending: false }).limit(1).maybeSingle()
  if (run.error) throw run.error
  if (!run.data) return { client_id: clientId, generated_at: nowIso, run: null, items: [] }
  const { data, error } = await sb.from('recommendations')
    .select('id, position, title, insight, action, engines, priority, status, actioned_at')
    .eq('client_id', clientId).eq('run_id', run.data.id)
    .order('position', { ascending: true }).limit(limit)
  if (error) throw error
  return {
    client_id: clientId,
    generated_at: nowIso,
    run: { id: run.data.id, generated_at: run.data.generated_at, rec_count: run.data.rec_count ?? 0 },
    items: (data || []).map((r) => ({
      id: r.id, position: r.position ?? null, title: r.title, insight: r.insight ?? null, action: r.action ?? null,
      engines: Array.isArray(r.engines) ? r.engines : [], priority: r.priority ?? null, status: r.status ?? null,
      actioned_at: r.actioned_at ?? null,
    })),
  }
}

// ── Tool definitions for tools/list ──────────────────────────────────────────

const T = {
  int: { type: 'integer' },
  num: { type: 'number' },
  str: { type: 'string' },
  bool: { type: 'boolean' },
  nStr: { type: ['string', 'null'] },
  nNum: { type: ['number', 'null'] },
  nInt: { type: ['integer', 'null'] },
}
const obj = (properties, required = Object.keys(properties)) => ({ type: 'object', properties, required })
const arr = (items) => ({ type: 'array', items })
const WINDOW_DAYS_IN = { type: 'integer', minimum: 1, maximum: 365, default: 30, description: 'Days back from now. Clamped to 1..365.' }
const WINDOW_OUT = obj({ days: T.int, from: T.str, to: T.str, effective_from: T.str })
const STATS = { checks: T.int, no_answer: T.int, answered: T.int, mentioned: T.int, mention_rate: T.nNum, avg_position: T.nNum }
const SENT = { total: T.int, positive: T.int, neutral: T.int, negative: T.int, unclassified: T.int }
const HEAD = { client_id: T.int, generated_at: T.str }
const ANNOTATIONS = { readOnlyHint: true, idempotentHint: true, openWorldHint: false }

const TOOLS = [
  {
    name: 'get_brand_overview',
    title: 'Brand overview',
    description: 'Brand identity, plan, the AI engines tracked for this account, data freshness (newest result and newest collection run) and prompt counts.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    outputSchema: obj({
      ...HEAD,
      brand: obj({ name: T.str, aliases: arr(T.str), website: T.nStr }),
      plan: obj({ id: T.str, label: T.str }),
      engines: arr(obj({ id: T.str, label: T.str })),
      last_result_at: T.nStr,
      last_run: { type: ['object', 'null'], properties: { started_at: T.str, trigger: T.nStr } },
      prompts: obj({ active: T.int, total: T.int }),
      limits: obj({ calls_per_minute_per_key: T.int, calls_per_day: T.int }),
    }),
    run: toolBrandOverview,
  },
  {
    name: 'get_visibility_summary',
    title: 'Visibility summary',
    description: 'How often AI engines mention the brand over a window, overall and per engine. mention_rate is mentioned / answered; rows where the engine gave no answer count in no_answer, never in answered. latest_snapshot is the newest answer per prompt and engine pair.',
    inputSchema: { type: 'object', properties: { window_days: WINDOW_DAYS_IN }, additionalProperties: false },
    outputSchema: obj({
      ...HEAD,
      window: WINDOW_OUT,
      overall: obj(STATS),
      by_engine: arr(obj({ engine: T.str, label: T.str, ...STATS })),
      latest_snapshot: obj({ pairs: T.int, mentioned: T.int, mention_rate: T.nNum }),
      rows_scanned: T.int,
      truncated: T.bool,
    }),
    run: toolVisibilitySummary,
  },
  {
    name: 'list_prompts',
    title: 'List prompts',
    description: 'The buyer prompts tracked for this account, ordered by id, at most 200 per call. Pass next_cursor back as cursor for the next page.',
    inputSchema: {
      type: 'object',
      properties: {
        active_only: { type: 'boolean', default: true },
        limit: { type: 'integer', minimum: 1, maximum: 200, default: 200 },
        cursor: { type: 'string' },
      },
      additionalProperties: false,
    },
    outputSchema: obj({
      ...HEAD,
      prompts: arr(obj({ id: T.int, text: T.str, category: T.nStr, is_active: T.bool, position: T.nInt })),
      next_cursor: T.nStr,
    }),
    run: toolListPrompts,
  },
  {
    name: 'get_prompt_results',
    title: 'Prompt results',
    description: 'Per-engine answers for one prompt of this account over a window, newest first: whether the brand was mentioned, its position, sentiment, a snippet of the answer and the competitors named.',
    inputSchema: {
      type: 'object',
      properties: {
        prompt_id: { type: 'integer', minimum: 1 },
        window_days: WINDOW_DAYS_IN,
        limit: { type: 'integer', minimum: 1, maximum: 200, default: 50 },
        cursor: { type: 'string' },
      },
      required: ['prompt_id'],
      additionalProperties: false,
    },
    outputSchema: obj({
      ...HEAD,
      prompt: obj({ id: T.int, text: T.str, category: T.nStr, is_active: T.bool }),
      window: WINDOW_OUT,
      results: arr(obj({
        engine: T.str, label: T.str, checked_at: T.nStr, mentioned: T.bool, position: T.nNum,
        sentiment: T.nStr, no_answer: T.bool, snippet: T.nStr, competitors: arr(T.str),
      })),
      next_cursor: T.nStr,
    }),
    run: toolPromptResults,
  },
  {
    name: 'get_competitors',
    title: 'Competitors',
    description: 'Competitors named next to the brand in AI answers over a window, top N, ranked mentions first. share is total_mentions / answered. A competitor with prose_only: true was never ranked in a list by any engine; do not describe it as outranking the brand.',
    inputSchema: {
      type: 'object',
      properties: { window_days: WINDOW_DAYS_IN, limit: { type: 'integer', minimum: 1, maximum: 50, default: 10 } },
      additionalProperties: false,
    },
    outputSchema: obj({
      ...HEAD,
      window: WINDOW_OUT,
      answered: T.int,
      brand: obj({ mentioned: T.int, share: T.nNum }),
      competitors: arr(obj({
        name: T.str, total_mentions: T.int, ranked_mentions: T.int, prose_only: T.bool, avg_position: T.nNum,
        share: T.nNum, by_engine: { type: 'object', additionalProperties: T.int }, prompts: T.int,
      })),
      rows_scanned: T.int,
      truncated: T.bool,
    }),
    run: toolCompetitors,
  },
  {
    name: 'get_sentiment_summary',
    title: 'Sentiment summary',
    description: 'Sentiment of AI answers that mention the brand over a window, overall and per engine: positive, neutral, negative, and unclassified for anything else.',
    inputSchema: { type: 'object', properties: { window_days: WINDOW_DAYS_IN }, additionalProperties: false },
    outputSchema: obj({
      ...HEAD,
      window: WINDOW_OUT,
      overall: obj(SENT),
      by_engine: arr(obj({ engine: T.str, label: T.str, ...SENT })),
      rows_scanned: T.int,
      truncated: T.bool,
    }),
    run: toolSentimentSummary,
  },
  {
    name: 'get_recommendations',
    title: 'Recommendations',
    description: 'Items of the latest recommendation run for this account, in their listed order. run is null when no recommendations have been generated yet.',
    inputSchema: { type: 'object', properties: { limit: { type: 'integer', minimum: 1, maximum: 50, default: 20 } }, additionalProperties: false },
    outputSchema: obj({
      ...HEAD,
      run: { type: ['object', 'null'], properties: { id: T.int, generated_at: T.str, rec_count: T.int } },
      items: arr(obj({
        id: T.int, position: T.nInt, title: T.str, insight: T.nStr, action: T.nStr, engines: arr(T.str),
        priority: T.nStr, status: T.nStr, actioned_at: T.nStr,
      })),
    }),
    run: toolRecommendations,
  },
]
const TOOL_BY_NAME = new Map(TOOLS.map((t) => [t.name, t]))

function toolsListResult(version) {
  const withOutput = version >= OUTPUT_SCHEMA_SINCE
  return {
    tools: TOOLS.map((t) => {
      const def = { name: t.name, title: t.title, description: t.description, inputSchema: t.inputSchema, annotations: ANNOTATIONS }
      if (withOutput) def.outputSchema = t.outputSchema
      return def
    }),
  }
}

// ── Handler ──────────────────────────────────────────────────────────────────

/**
 * handle(event, context, { supabase, now, config }) -- injectable for tests.
 * Production entry is exports.handler below.
 */
async function handle(event, context = {}, opts = {}) {
  const t0 = Date.now()
  const cfg = { ...DEFAULT_CONFIG, ...(opts.config || {}) }
  const nowFn = opts.now || (() => new Date())
  const invId = String((context && context.awsRequestId) || '-').slice(0, 8)
  const log = { client: '-', method: '-', tool: '-' }
  const finish = (res, outcome) => {
    console.log(`[mcp-server/${invId}] client=${log.client} method=${log.method} tool=${log.tool} ms=${Date.now() - t0} outcome=${outcome}`)
    return res
  }

  if (event.httpMethod !== 'POST') return finish(methodNotAllowed(), '405')

  // 1. Body size, before parse.
  const raw = event.isBase64Encoded ? Buffer.from(event.body || '', 'base64') : Buffer.from(event.body || '', 'utf8')
  if (raw.length > cfg.maxBodyBytes) return finish(rpcError(413, null, -32600, 'Request too large'), '-32600')

  // 2. Origin: real MCP clients send none; a browser page on another site is refused.
  const origin = header(event, 'origin')
  if (origin && !ALLOWED_ORIGINS.includes(origin)) return finish(rpcError(403, null, -32600, 'Origin not allowed'), '-32600')

  // 3. Parse.
  let msg
  try { msg = JSON.parse(raw.toString('utf8')) } catch { return finish(rpcError(400, null, -32700, 'Parse error'), '-32700') }

  // 4. Shape. Batching was removed in 2025-06-18 and is not supported for any version.
  if (Array.isArray(msg) || !msg || typeof msg !== 'object' || msg.jsonrpc !== '2.0') {
    return finish(rpcError(400, null, -32600, 'Invalid Request'), '-32600')
  }

  // 5. Notifications and client responses: 202, nothing read or written.
  if (!('id' in msg) || 'result' in msg || 'error' in msg) {
    return finish({ statusCode: 202, headers: { 'X-Content-Type-Options': 'nosniff' }, body: '' }, '202')
  }
  const id = msg.id
  if ((typeof id !== 'string' && typeof id !== 'number') || typeof msg.method !== 'string') {
    return finish(rpcError(400, typeof id === 'string' || typeof id === 'number' ? id : null, -32600, 'Invalid Request'), '-32600')
  }
  const method = msg.method
  log.method = KNOWN_METHODS.has(method) ? method : 'other'

  try {
    // 6. Authentication (section 3.4).
    const key = bearer(event)
    if (!CLIENT_API_KEY_RE.test(key)) return finish(unauthorized(id), '-32001')
    const sb = opts.supabase || createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)
    const keyRes = await sb.from('client_api_keys')
      .select('id, client_id, created_by, last_used_at, revoked_at')
      .eq('key_hash', hashClientApiKey(key)).maybeSingle()
    if (keyRes.error) throw keyRes.error
    const row = keyRes.data
    if (!row || row.revoked_at) return finish(unauthorized(id), '-32001')
    if (String(row.client_id) !== clientIdFromKey(key)) {
      console.warn(`[mcp-server/${invId}] key row ${row.id} client id does not match the key`)
      return finish(unauthorized(id), '-32001')
    }
    // maybeSingle(): a missing row is data null with no error, so it answers the
    // same 401 as an unknown key. Any error here is a real read failure (F4) and
    // goes to the catch below as 500 -32603, never to 401, so a customer is not
    // told a working key is invalid.
    const clientRes = await sb.from('clients')
      .select('id, name, brand_aliases, brand_website, plan, category, engines_enabled, known_competitors')
      .eq('id', row.client_id).maybeSingle()
    if (clientRes.error) throw clientRes.error
    const client = clientRes.data
    if (!client) return finish(unauthorized(id), '-32001')
    const clientId = Number(client.id)
    log.client = String(clientId)

    const now = nowFn()
    const nowMs = now.getTime()
    const nowIso = now.toISOString()

    // last_used_at, throttled to once a minute, awaited, never fatal.
    if (!row.last_used_at || nowMs - Date.parse(row.last_used_at) >= LAST_USED_THROTTLE_MS) {
      try {
        const up = await sb.from('client_api_keys').update({ last_used_at: nowIso }).eq('id', row.id).is('revoked_at', null)
        if (up && up.error) console.warn(`[mcp-server/${invId}] last_used_at stamp failed for key row ${row.id}: ${scrub(up.error.message)}`)
      } catch (e) {
        console.warn(`[mcp-server/${invId}] last_used_at stamp failed for key row ${row.id}: ${scrub(e.message)}`)
      }
    }

    // 7. Protocol version header.
    const hv = header(event, 'mcp-protocol-version')
    if (hv !== undefined && !SUPPORTED_PROTOCOL_VERSIONS.includes(hv)) {
      return finish(rpcError(400, id, -32600, 'Unsupported MCP-Protocol-Version'), '-32600')
    }
    const version = hv || DEFAULT_HEADER_VERSION

    // Per-key minute counter: every authenticated request with an id (6.2).
    const rateCheck = async (rkey, limit, windowSeconds, scope) => {
      const { data, error } = await sb.rpc('affiliate_rate_check', { p_key: rkey, p_limit: limit, p_window_seconds: windowSeconds })
      if (error) throw error
      if (data === true) return null
      const retryAfter = rateRetryAfter(nowMs, windowSeconds)
      const message = scope === 'client_day'
        ? 'Daily MCP limit reached. It resets at 00:00 UTC.'
        : `Rate limit reached: ${limit} calls a minute per key. Retry in ${retryAfter} seconds.`
      return finish(rpcError(200, id, -32029, message, { retry_after: retryAfter, scope, limit }, { 'Retry-After': String(retryAfter) }), '-32029')
    }
    const limited = await rateCheck(`mcp:key:${row.id}`, cfg.perKeyPerMinute, 60, 'key_minute')
    if (limited) return limited

    // 8. Dispatch.
    if (method === 'initialize') {
      const params = msg.params && typeof msg.params === 'object' ? msg.params : {}
      const requested = params.protocolVersion
      const negotiated = SUPPORTED_PROTOCOL_VERSIONS.includes(requested) ? requested : LATEST_PROTOCOL_VERSION
      return finish(rpcResult(id, {
        protocolVersion: negotiated,
        capabilities: { tools: { listChanged: false } },
        serverInfo: SERVER_INFO,
        instructions: INSTRUCTIONS,
      }), 'ok')
    }
    if (method === 'ping') return finish(rpcResult(id, {}), 'ok')
    if (method !== 'tools/list' && method !== 'tools/call') {
      return finish(rpcError(200, id, -32601, 'Method not found'), '-32601')
    }

    // Plan gate on the live row (4.3), then the research gate (4.4).
    if (!mcpAllowedFor(client.plan)) {
      return finish(rpcError(200, id, -32002,
        `MCP access needs the ${PLAN_LABELS[MCP_MIN_PLAN]} plan or higher. Upgrade to ${PLAN_LABELS[MCP_MIN_PLAN]} in your BrandGEO account.`,
        { required_plan: MCP_MIN_PLAN, current_plan: client.plan ?? null, upgrade_url: UPGRADE_URL }), '-32002')
    }
    if (client.category === RESEARCH_CATEGORY) {
      let isAdminKey = false
      if (row.created_by) {
        const prof = await sb.from('user_profiles').select('role').eq('id', row.created_by).maybeSingle()
        if (prof.error) throw prof.error
        isAdminKey = !!(prof.data && prof.data.role === 'admin')
      }
      if (!isAdminKey) return finish(rpcError(200, id, -32003, 'This account is not available over MCP.'), '-32003')
    }

    if (method === 'tools/list') return finish(rpcResult(id, toolsListResult(version)), 'ok')

    // tools/call
    const params = msg.params && typeof msg.params === 'object' && !Array.isArray(msg.params) ? msg.params : {}
    const tool = typeof params.name === 'string' ? TOOL_BY_NAME.get(params.name) : undefined
    if (!tool) {
      log.tool = 'unknown'
      return finish(rpcError(200, id, -32602, 'Unknown tool', { tool: typeof params.name === 'string' ? params.name : null }), '-32602')
    }
    log.tool = tool.name

    const dayLimited = await rateCheck(`mcp:client:${clientId}:day`, cfg.perClientPerDay, 86400, 'client_day')
    if (dayLimited) return dayLimited

    const args = params.arguments === undefined || params.arguments === null ? {} : params.arguments
    const inputError = (text) => finish(rpcResult(id, { content: [{ type: 'text', text }], isError: true }), 'tool_input_error')
    if (typeof args !== 'object' || Array.isArray(args)) return inputError('arguments must be an object')

    const engines = activeEnginesFor(client.plan, client.engines_enabled)
    const ctx = { sb, cfg, client, clientId, engines, nowMs, nowIso }
    let out
    try {
      out = await tool.run(ctx, args)
    } catch (e) {
      if (e instanceof ToolInputError) return inputError(e.message)
      throw e
    }
    return finish(rpcResult(id, { content: [{ type: 'text', text: JSON.stringify(out) }], structuredContent: out }), 'ok')
  } catch (e) {
    console.error(`[mcp-server/${invId}] failed: ${scrub(e && e.message)}`)
    return finish(rpcError(500, id, -32603, 'Internal error'), '-32603')
  }
}

exports.handler = (event, context) => handle(event, context)
exports.handle = handle
exports.SUPPORTED_PROTOCOL_VERSIONS = SUPPORTED_PROTOCOL_VERSIONS
exports.LATEST_PROTOCOL_VERSION = LATEST_PROTOCOL_VERSION
exports.MCP_PER_KEY_PER_MINUTE = MCP_PER_KEY_PER_MINUTE
exports.MCP_PER_CLIENT_PER_DAY = MCP_PER_CLIENT_PER_DAY
exports.TOOL_NAMES = TOOLS.map((t) => t.name)
