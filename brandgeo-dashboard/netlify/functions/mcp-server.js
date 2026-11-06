/**
 * mcp-server.js -- remote MCP (Model Context Protocol) server.
 * Contract: docs/arch/mcp-access.md (sections 2, 3.4, 4.3, 4.4, 5, 6), and
 * docs/arch/mcp-stage2-fixes.md (sections 3, 5, 6, 9.4) for list_fixes and
 * the one write tool, mark_fix_done.
 *
 * POST https://app.getbrandgeo.com/mcp   (netlify.toml rewrites /mcp here)
 * Authorization: Bearer bgmcp_<client_id>_<48 hex>   (an API key), or
 * Authorization: Bearer bgmat_<48 hex>                (an OAuth access token,
 *   docs/arch/mcp-stage3-oauth.md section 5: the shape picks the branch)
 *
 * Transport: Streamable HTTP, stateless, JSON responses only. One JSON-RPC
 * message per POST, no batching, no SSE, no Mcp-Session-Id. GET, DELETE,
 * OPTIONS and anything else: 405 with Allow: POST.
 *
 * AUTHORITY. The client id comes from the client_api_keys row found by the
 * sha256 of the key, or for OAuth from the oauth_grants row behind the
 * oauth_tokens row found by the sha256 of the token, with the grant's user
 * still a viewer of that client; never from tool arguments. Plan gate: mcpAllowedFor() in
 * _plans.js, on the live clients row, on tools/list and tools/call only. The
 * write gate is the same plan gate (stage 2 ruling 2) plus the key's own
 * scope: mark_fix_done is listed and runs only for a 'read_write' key.
 *
 * WRITES. Every request can cause the rate counter upserts
 * (affiliate_rate_check with an `mcp:` namespace) and the throttled
 * client_api_keys.last_used_at stamp. Only mark_fix_done writes rows: one
 * fix_states upsert (status done, baseline, marked_by_key) and one
 * client_events audit row (type mcp_fix_marked). No tool calls an LLM or
 * enqueues a collection, and list_fixes never records a verdict (ruling 7).
 *
 * LOGGING. One line per request (section 6.4), with cred=key|oauth (stage 3).
 * Never logged: the key or OAuth token, its prefix, its hash, the Authorization header, the raw body, mark_fix_done's
 * note, or tool arguments other than prompt_id, window_days, limit and fix_id.
 * Only fix_id is printed (on mark_fix_done lines), URI-encoded and scrubbed so
 * it stays one token and can never carry a key. The method and tool name are
 * only logged when they are one this server knows, so a caller cannot smuggle
 * text into the log through them.
 *
 * BUNDLING. netlify.toml sets node_bundler = "esbuild" for this one function so
 * the .ts requires below are bundled from the dashboard's own source: MCP
 * numbers, fix ids, fix copy and the agent prompt come from the same
 * implementation as the dashboard. No fix sentence, id rule or metric is
 * written in this file. Under plain node (tests) tests/helpers/ts_require.js
 * registers the .ts loader.
 */

const { createClient } = require('@supabase/supabase-js')
const { ALLOWED_ORIGINS } = require('./_auth')
const { activeEnginesFor, RESEARCH_CATEGORY } = require('./_cost')
const { PLAN_LABELS, ENGINE_LABELS, MCP_MIN_PLAN, mcpAllowedFor } = require('./_plans')
const { CLIENT_API_KEY_RE, hashClientApiKey, clientIdFromKey } = require('./_client_api_key')
const oauth = require('./_oauth')
const { isNoAnswerRow } = require('../../src/lib/aiVisibilityScore.ts')
const { aggregateCompetitors, cleanCompetitorName, isLikelyCompanyName } = require('../../src/lib/competitorFilter.ts')
const { buildFixResultMap, buildFixItems } = require('../../src/lib/fixItems.ts')
const { readAllById } = require('../../src/lib/keysetRead.ts')
const { parseMetricKey, metricLabel, measureFix, evaluateFix, verdictCutoff, isOpenState } = require('../../src/lib/fixStates.ts')
const { buildFixPrompt, formatDay } = require('../../src/lib/fixPrompt.ts')
const { MARKETS } = require('../../src/lib/markets.ts')
const { ENGINE_META, getActiveEngines } = require('../../src/lib/planConfig.ts')

// ── Limits (section 6.1; ruling 6 changes only these two) ────────────────────
const MCP_PER_KEY_PER_MINUTE = 60
const MCP_PER_CLIENT_PER_DAY = 5000
// Stage 2 ruling 3: writes an hour per client, on top of the two limits above.
const MCP_WRITES_PER_CLIENT_PER_HOUR = 60

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
  perClientWritesPerHour: MCP_WRITES_PER_CLIENT_PER_HOUR,
  maxBodyBytes: MAX_BODY_BYTES,
  scanPage: SCAN_PAGE,
  scanCeiling: SCAN_CEILING,
  scanBudgetMs: SCAN_BUDGET_MS,
  promptIdCeiling: PROMPT_ID_CEILING,
}

const UPGRADE_URL = 'https://app.getbrandgeo.com/account'
// Stage 3 section 3.1: "API key" misled an OAuth user, so one wording for both.
const UNAUTHORIZED_MESSAGE = 'Invalid or missing BrandGEO credentials.'
const KNOWN_METHODS = new Set(['initialize', 'ping', 'tools/list', 'tools/call'])

const SERVER_INFO = { name: 'brandgeo', title: 'BrandGEO', version: '1.0.0' }
const INSTRUCTIONS = "Read-only access to one BrandGEO account's AI visibility data: how often AI engines mention the brand, for which prompts, next to which competitors, with what sentiment, plus the latest recommendations. Data is refreshed by BrandGEO's own collection runs; these tools never start a collection."
// Served instead of INSTRUCTIONS to a read and write key, which is not read only.
const INSTRUCTIONS_READ_WRITE = "Access to one BrandGEO account's AI visibility data: how often AI engines mention the brand, for which prompts, next to which competitors, with what sentiment, plus the latest recommendations and the Fix This list (list_fixes). This key can also mark a fix done (mark_fix_done) after the work is finished; BrandGEO then re-checks it on its own schedule. Data is refreshed by BrandGEO's own collection runs; these tools never start a collection."
// Served to a read and write OAuth connection (stage 3 section 5).
const INSTRUCTIONS_READ_WRITE_OAUTH = "Access to one BrandGEO account's AI visibility data: how often AI engines mention the brand, for which prompts, next to which competitors, with what sentiment, plus the latest recommendations and the Fix This list (list_fixes). This connection can also mark a fix done (mark_fix_done) after the work is finished; BrandGEO then re-checks it on its own schedule. Data is refreshed by BrandGEO's own collection runs; these tools never start a collection."
const READ_ONLY_KEY_MESSAGE = 'This key is read only. Create a read and write key on the BrandGEO Account page to let an agent mark fixes done.'
const READ_ONLY_OAUTH_MESSAGE = "This connection has read access only. Disconnect and connect again, ticking 'Also let it mark Fix This items done'."
const FIX_NOT_OPEN_MESSAGE = 'That fix is not open for this brand. Call list_fixes for the current ids.'
// The CHECK on fix_states.fix_id (db/supabase-fix-states-migration-2026-11-06.sql).
const FIX_ID_RE = /^[a-z_]{1,40}(:.{1,150})?$/
const MAX_NOTE = 500
const FIX_COLS = 'id, client_id, fix_id, status, title, metric_key, baseline_value, baseline_n, marked_at, checked_at, check_value, check_n'
// Every column the shared fix builders read (fixItems, fixStates, fixPrompt,
// aiVisibilityScore, competitorFilter); the parity test feeds them full rows.
const FIX_RESULT_COLS = 'id, prompt_id, llm, status, error_code, brand_mentioned, brand_position, sentiment, response_snippet, competitors_mentioned, checked_at'

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
  const h = header(event, 'authorization')
  if (typeof h !== 'string') return ''
  const m = /^bearer +/i.exec(h)
  return m ? h.slice(m[0].length).trim() : ''
}

function round(n, places) {
  const f = 10 ** places
  return Math.round(n * f) / f
}

function rate(num, den) { return den > 0 ? round(num / den, 4) : null }

/**
 * Strip anything shaped like a key, an OAuth token or client secret, or a long
 * hex run (a sha256, or a token's secret part) from a message before it is logged.
 */
function scrub(msg) {
  return String(msg || '').replace(/bg(mcp|mat|mrt|ocs)_\S*/gi, '[redacted]').replace(/[a-f0-9]{48,}/gi, '[redacted]')
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

/**
 * Stage 3 section 3.1: the 401 points at the protected resource metadata for
 * both credential types, with the scope Claude should request. A dead OAuth
 * access token adds error="invalid_token", which makes Claude refresh. The
 * body is the same in every case.
 */
function unauthorized(id, invalidToken = false) {
  return rpcError(401, id, -32001, UNAUTHORIZED_MESSAGE, undefined, { 'WWW-Authenticate': oauth.wwwAuthenticate(invalidToken) })
}

class ToolInputError extends Error {
  /** code is the log outcome; a refused write is logged by its code, never stored. */
  constructor(message, code = 'tool_input_error') { super(message); this.code = code }
}

/** Postgres 42703 = undefined_column (PostgREST passes the code through). */
function isMissingColumn(error, column) {
  return !!error && (error.code === '42703' || new RegExp(`column .*${column}.* does not exist`, 'i').test(error.message || ''))
}

/** A stored key scope; anything but 'read_write' (including a missing column) is read only. */
function keyScope(row) { return row && row.scope === 'read_write' ? 'read_write' : 'read' }

/**
 * An OAuth connection's scope (stage 3 section 5): mcp:write in BOTH the
 * token and its grant gives read_write; anything else is read. The grant side
 * means a later consent that narrows the grant narrows older tokens at once.
 */
function oauthScope(tokenScope, grantScope) {
  return oauth.hasScope(oauth.intersectScope(tokenScope, grantScope), oauth.SCOPE_WRITE) ? 'read_write' : 'read'
}

/** Postgres 42P01 = undefined_table. */
function isMissingTable(error) {
  return !!error && (error.code === '42P01' || /relation .* does not exist/i.test(error.message || ''))
}

/** fix_id for the log line: one URI-encoded token, key-shaped text removed. */
function loggableFixId(v) {
  if (typeof v !== 'string' || !FIX_ID_RE.test(v)) return 'invalid'
  // Only strictly shaped ids reach the log (review L1): a known kind, and a
  // parameter of plain lowercase words, digits and separators with no long
  // hex run and no key prefix. Anything else logs as "<kind>:other".
  const i = v.indexOf(':')
  const kind = i < 0 ? v : v.slice(0, i)
  if (!LOGGABLE_FIX_KINDS.has(kind)) return 'other'
  if (i < 0) return kind
  const p = v.slice(i + 1)
  if (!/^[a-z0-9 ._-]{1,80}$/.test(p) || /[a-f0-9]{24}/.test(p) || /bgmcp/.test(p)) return encodeURIComponent(kind + ':other')
  return encodeURIComponent(kind + ':' + p)
}
const LOGGABLE_FIX_KINDS = new Set(['visibility', 'engine_missing', 'engine_low', 'outranked', 'consistency', 'ranking', 'prompt_gap'])

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

// ── Fix This tools (mcp-stage2-fixes.md sections 3 and 9.4) ──────────────────

/**
 * Every ai_results row of the client on an active engine, error rows included
 * (the page reads them to tell an unavailable engine), newest first by id in
 * keyset pages, no date window: the page has none, and a window would change
 * which answer is "latest" and so the list. Stops at the row ceiling or the
 * time budget and says so.
 */
async function scanAllResults(sb, cfg, clientId, engines) {
  const r = await readAllById(
    () => sb.from('ai_results').select(FIX_RESULT_COLS).eq('client_id', clientId).in('llm', engines),
    { page: cfg.scanPage, ceiling: cfg.scanCeiling, budgetMs: cfg.scanBudgetMs },
  )
  if (r.error) throw r.error
  return { rows: r.rows, truncated: r.truncated }
}

/** Active prompts in the page's order (position, then id so ties are stable), keyset-paged by id. */
async function activePrompts(sb, cfg, clientId) {
  const out = []
  let last = null
  const page = Math.min(1000, cfg.promptIdCeiling)
  while (out.length < cfg.promptIdCeiling) {
    let q = sb.from('prompts').select('id, text, position').eq('client_id', clientId).eq('is_active', true)
    if (last !== null) q = q.gt('id', last)
    const { data, error } = await q.order('id', { ascending: true }).limit(page)
    if (error) throw error
    for (const p of data || []) out.push({ id: Number(p.id), text: typeof p.text === 'string' ? p.text : '', position: Number(p.position ?? 0) })
    if (!data || data.length < page) break
    last = data[data.length - 1].id
  }
  return out.sort((a, b) => a.position - b.position || a.id - b.id)
}

function normalizeFixRow(r) {
  return {
    ...r,
    baseline_value: r.baseline_value === null || r.baseline_value === undefined ? null : Number(r.baseline_value),
    check_value: r.check_value === null || r.check_value === undefined ? null : Number(r.check_value),
  }
}

/** The client's fix_states rows by fix_id, numerics as numbers (as the page reads them). */
async function fixStateRows(sb, clientId) {
  const { data, error } = await sb.from('fix_states').select(FIX_COLS).eq('client_id', clientId)
  if (error) throw error
  const m = new Map()
  for (const r of data || []) m.set(r.fix_id, normalizeFixRow(r))
  return m
}

/**
 * The fix tools' shared context: engines and labels as the page derives them
 * (planConfig.ts getActiveEngines, ENGINE_META), active prompts, fix states,
 * and, unless skipped, the result map from the full scan and the fix list.
 */
async function loadFixContext(ctx, { withResults = true } = {}) {
  const { sb, cfg, client, clientId } = ctx
  const engineIds = getActiveEngines(client.plan, client.engines_enabled).map(String)
  const labelOf = (id) => (ENGINE_META[id] && ENGINE_META[id].label) || id
  const engines = engineIds.map((id) => ({ id, label: labelOf(id) }))
  const prompts = await activePrompts(sb, cfg, clientId)
  const states = await fixStateRows(sb, clientId)
  let results = new Map()
  let errorEngines = new Set()
  let truncated = false
  if (withResults && engineIds.length > 0) {
    const scan = await scanAllResults(sb, cfg, clientId, engineIds)
    const built = buildFixResultMap(scan.rows, engineIds)
    results = built.results
    errorEngines = built.errorEngines
    truncated = scan.truncated
  }
  const brandName = client.name ?? 'your brand'
  const marketRow = MARKETS.find((m) => m.id === client.default_market_id)
  const market = marketRow ? marketRow.label : null
  const promptIds = prompts.map((p) => p.id)
  const promptTextOf = (pid) => { const p = prompts.find((x) => x.id === pid); return p ? p.text : undefined }
  const items = withResults ? buildFixItems({
    brandName,
    engines,
    prompts,
    results,
    errorEngines,
    stateOf: (fid) => { const r = states.get(fid); return r ? r.status : undefined },
  }) : []
  const promptFor = (item) => buildFixPrompt(
    { id: item.id, title: item.title, competitor: item.competitor ?? null, competitorAvgRank: item.competitorAvgRank },
    { brandName, website: client.brand_website ?? null, market, engines, prompts: prompts.map((p) => ({ id: p.id, text: p.text })), results },
  ) ?? item.fix
  return { engineIds, engines, prompts, promptIds, states, results, truncated, items, promptFor, labelOf, promptTextOf }
}

function metricText(fx, metricKey) {
  return metricLabel(parseMetricKey(metricKey), fx.labelOf, fx.promptTextOf)
}

function stateOfRow(fx, fixId) {
  const r = fx.states.get(fixId)
  return r ? r.status : undefined
}

/** The closed list's re-check, computed with evaluateFix and never written (ruling 7). */
function recheckOf(fx, row, nowMs) {
  if (row.status === 'dismissed') return null
  if (row.status === 'verified') {
    return { state: 'verified', checked_at: row.checked_at ?? null, before: row.baseline_value, after: row.check_value, metric: metricText(fx, row.metric_key) }
  }
  const ev = evaluateFix(row, fx.results, fx.promptIds, fx.engineIds, nowMs)
  if (ev.state === 'waiting') return { state: 'waiting', ready_after: ev.readyAfter }
  if (ev.state === 'verdict') return { state: 'verdict_due', status: ev.status, value: ev.value }
  if (ev.state === 'untracked') return { state: 'untracked' }
  return { state: 'manual' }
}

async function toolListFixes(ctx, args) {
  const { clientId, nowIso, nowMs } = ctx
  const includeClosed = boolArg(args, 'include_closed', false)
  const limit = intArg(args, 'limit', { min: 1, max: 50, def: 20 })
  const fx = await loadFixContext(ctx)
  const open = fx.items.filter((i) => isOpenState(stateOfRow(fx, i.id))).slice(0, limit).map((item) => {
    const row = fx.states.get(item.id)
    const isReopened = !!row && row.status === 'reopened'
    return {
      fix_id: item.id,
      priority: item.priority,
      status: isReopened ? 'reopened' : 'open',
      title: item.title,
      summary: item.description,
      fix: item.fix,
      prompt: fx.promptFor(item),
      reopened: isReopened
        ? { marked_at: row.marked_at ?? null, checked_at: row.checked_at ?? null, before: row.baseline_value, after: row.check_value, metric: metricText(fx, row.metric_key) }
        : null,
    }
  })
  const out = { client_id: clientId, generated_at: nowIso, open }
  if (includeClosed) {
    // The same rows in the same order as the page's Done list.
    out.closed = Array.from(fx.states.values())
      .filter((r) => r.status === 'done' || r.status === 'verified' || r.status === 'dismissed')
      .sort((a, b) => (b.checked_at ?? b.marked_at ?? '').localeCompare(a.checked_at ?? a.marked_at ?? ''))
      .slice(0, limit)
      .map((r) => ({ fix_id: r.fix_id, status: r.status, title: r.title ?? null, marked_at: r.marked_at ?? null, recheck: recheckOf(fx, r, nowMs) }))
  }
  out.truncated = fx.truncated
  return out
}

/** The mark's answer, from the stored row: the same shape fresh or already done. */
function markResult(fx, clientId, row, nowIso) {
  const markedAt = row.marked_at || nowIso
  const measurable = !!parseMetricKey(row.metric_key) && row.baseline_value !== null && row.baseline_value !== undefined
  const recheckAfter = measurable ? verdictCutoff(markedAt) : null
  return {
    client_id: clientId,
    fix_id: row.fix_id,
    status: 'done',
    marked_at: markedAt,
    recheck_after: recheckAfter,
    baseline: measurable ? { metric: metricText(fx, row.metric_key), value: row.baseline_value, answers: row.baseline_n ?? 0 } : null,
    message: measurable
      ? `Marked done. BrandGEO checks this again on the first collection after ${formatDay(recheckAfter)}.`
      : 'Marked done. BrandGEO has no answers to measure this fix on yet, so it is not re-checked.',
  }
}

async function toolMarkFixDone(ctx, args) {
  const { sb, clientId, nowIso, cred, invId } = ctx
  const fixId = args.fix_id
  if (typeof fixId !== 'string' || !FIX_ID_RE.test(fixId)) {
    throw new ToolInputError('fix_id is required and must be an id returned by list_fixes.')
  }
  const note = args.note
  if (note !== undefined && note !== null && typeof note !== 'string') throw new ToolInputError('note must be text.')
  if (typeof note === 'string' && note.length > MAX_NOTE) throw new ToolInputError(`note must be ${MAX_NOTE} characters or fewer.`)

  // Already done: answer from the stored row. No scan, no write, no audit.
  const pre = await loadFixContext(ctx, { withResults: false })
  const existing = pre.states.get(fixId)
  if (existing && existing.status === 'done') {
    ctx.outcome = 'already_done'
    return { ...markResult(pre, clientId, existing, nowIso), already_done: true }
  }

  // Step 2: only an id on the current OPEN list (ruling 8).
  const fx = await loadFixContext(ctx)
  const item = fx.items.find((i) => i.id === fixId && isOpenState(stateOfRow(fx, i.id)))
  if (!item) throw new ToolInputError(FIX_NOT_OPEN_MESSAGE, 'fix_not_open')

  // Step 3: the baseline exactly as the page's markFix takes it.
  const scope = parseMetricKey(item.metricKey)
  const m = scope ? measureFix(scope, fx.results, fx.promptIds, fx.engineIds) : { value: null, n: 0 }
  const measurable = scope !== null && m.value !== null

  // Step 4: the page's upsert plus the marker of the credential that marked
  // it: marked_by_key for a key, marked_by_grant for an OAuth connection
  // (stage 3 section 5). The other marker is written null, so a row marked
  // again never keeps a stale marker from an earlier mark. The trigger stamps
  // marked_at.
  const payload = {
    client_id: clientId,
    fix_id: item.id,
    status: 'done',
    title: item.title.slice(0, 500),
    metric_key: measurable ? item.metricKey : null,
    baseline_value: measurable ? m.value : null,
    baseline_n: measurable ? m.n : null,
    marked_by_key: cred.kind === 'key' ? cred.id : null,
    marked_by_grant: cred.kind === 'oauth' ? cred.id : null,
  }
  const upsert = (p) => sb.from('fix_states').upsert(p, { onConflict: 'client_id,fix_id' }).select(FIX_COLS).single()
  let { data, error } = await upsert(payload)
  // Before db/supabase-mcp-oauth-2026-11-06.sql the column does not exist. A
  // key mark still works without it (an OAuth credential cannot exist then).
  if (error && cred.kind === 'key' && (isMissingColumn(error, 'marked_by_grant') || (error.code === 'PGRST204' && /marked_by_grant/.test(error.message || '')))) {
    console.warn(`[mcp-server/${invId}] fix_states.marked_by_grant missing; migration not applied, key mark written without it`)
    const withoutGrant = { ...payload }
    delete withoutGrant.marked_by_grant
    ;({ data, error } = await upsert(withoutGrant))
  }
  if (error) throw error
  const row = normalizeFixRow(data)

  // Step 5: one audit row. A failure is logged and does not undo the mark.
  try {
    const who = cred.kind === 'oauth' ? { grant_id: cred.id } : { key_id: cred.id }
    const audit = await sb.from('client_events').insert({
      client_id: clientId,
      actor: cred.actor ?? null,
      type: 'mcp_fix_marked',
      meta: { ...who, fix_id: item.id, note: typeof note === 'string' ? note : null },
    })
    if (audit && audit.error) console.error(`[mcp-server/${invId}] audit insert failed for client ${clientId}: ${scrub(audit.error.message)}`)
  } catch (e) {
    console.error(`[mcp-server/${invId}] audit insert failed for client ${clientId}: ${scrub(e && e.message)}`)
  }

  return markResult(fx, clientId, row, nowIso)
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
const WRITE_ANNOTATIONS = { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false }
const N_OBJ = (properties) => ({ type: ['object', 'null'], properties })

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
  {
    name: 'list_fixes',
    title: 'Fix This list',
    description: "The brand's Fix This list as the BrandGEO dashboard shows it on AI Visibility: open fixes in priority order, each with its fix_id, a summary of what was measured, the short fix, and prompt, an agent-ready brief identical to the dashboard's Copy as AI prompt. reopened is set when a fix marked done did not move its number. With include_closed, closed lists done, verified and dismissed fixes with their re-check state; verdict_due means the dashboard records the verdict on its next load.",
    inputSchema: {
      type: 'object',
      properties: {
        include_closed: { type: 'boolean', default: false },
        limit: { type: 'integer', minimum: 1, maximum: 50, default: 20, description: 'Most items per list. Clamped to 1..50.' },
      },
      additionalProperties: false,
    },
    outputSchema: obj({
      ...HEAD,
      open: arr(obj({
        fix_id: T.str, priority: T.str, status: T.str, title: T.str, summary: T.str, fix: T.str, prompt: T.str,
        reopened: N_OBJ({ marked_at: T.nStr, checked_at: T.nStr, before: T.nNum, after: T.nNum, metric: T.str }),
      })),
      closed: arr(obj({
        fix_id: T.str, status: T.str, title: T.nStr, marked_at: T.nStr,
        recheck: N_OBJ({ state: T.str, ready_after: T.str, status: T.str, value: T.num, checked_at: T.nStr, before: T.nNum, after: T.nNum, metric: T.str }),
      })),
      truncated: T.bool,
    }, ['client_id', 'generated_at', 'open', 'truncated']),
    run: toolListFixes,
  },
]

const WRITE_TOOLS = [
  {
    name: 'mark_fix_done',
    title: 'Mark a fix done',
    description: "Mark one open fix from list_fixes as done, as the dashboard's Mark as done does, after the work is finished. BrandGEO stores the fix's current number as the baseline and re-checks it on the first collection 7 days or more later (recheck_after). Only ids on the current open list are accepted; marking a fix that is already done changes nothing and answers already_done: true. note is kept in the account's audit log only.",
    inputSchema: {
      type: 'object',
      properties: {
        fix_id: { type: 'string', minLength: 1, maxLength: 191, pattern: '^[a-z_]{1,40}(:.{1,150})?$', description: 'A fix_id returned by list_fixes.' },
        note: { type: 'string', maxLength: MAX_NOTE, description: 'What was done. Stored in the audit log only.' },
      },
      required: ['fix_id'],
      additionalProperties: false,
    },
    outputSchema: obj({
      client_id: T.int,
      fix_id: T.str,
      status: T.str,
      marked_at: T.str,
      recheck_after: T.nStr,
      baseline: N_OBJ({ metric: T.str, value: T.num, answers: T.int }),
      message: T.str,
      already_done: T.bool,
    }, ['client_id', 'fix_id', 'status', 'marked_at', 'recheck_after', 'baseline', 'message']),
    annotations: WRITE_ANNOTATIONS,
    write: true,
    run: toolMarkFixDone,
  },
]
const TOOL_BY_NAME = new Map([...TOOLS, ...WRITE_TOOLS].map((t) => [t.name, t]))

/** Every gated key sees TOOLS; mark_fix_done is listed only for a read and write key. */
function toolsListResult(version, scope = 'read') {
  const withOutput = version >= OUTPUT_SCHEMA_SINCE
  const visible = scope === 'read_write' ? [...TOOLS, ...WRITE_TOOLS] : TOOLS
  return {
    tools: visible.map((t) => {
      const def = { name: t.name, title: t.title, description: t.description, inputSchema: t.inputSchema, annotations: t.annotations || ANNOTATIONS }
      if (withOutput) def.outputSchema = t.outputSchema
      return def
    }),
  }
}

// ── Credential resolution (section 3.4; stage 3 section 5) ───────────────────

const CLIENT_COLS = 'id, name, brand_aliases, brand_website, default_market_id, plan, category, engines_enabled, known_competitors'

/**
 * maybeSingle(): a missing row is data null with no error, so it answers the
 * same 401 as an unknown credential. Any error here is a real read failure
 * (F4) and goes to the handler's catch as 500 -32603, never to 401, so a
 * customer is not told a working credential is invalid.
 */
async function readClient(sb, clientId) {
  const clientRes = await sb.from('clients').select(CLIENT_COLS).eq('id', clientId).maybeSingle()
  if (clientRes.error) throw clientRes.error
  return clientRes.data
}

/**
 * The stage 1 and 2 key path, unchanged in behaviour. Returns { cred } or
 * { cred: null } for a 401 (no invalid_token: a key is not an OAuth token).
 * cred = { kind, id, client, scope, actor, lastUsedAt, rateKey, stamp, actorIsAdmin }.
 */
async function resolveKey(sb, key, invId) {
  const keyHash = hashClientApiKey(key)
  const readKey = (cols) => sb.from('client_api_keys').select(cols).eq('key_hash', keyHash).maybeSingle()
  let keyRes = await readKey('id, client_id, created_by, last_used_at, revoked_at, scope')
  // Before db/supabase-mcp-fix-writes-2026-11-06.sql is applied the scope
  // column does not exist. Every key is then read only, and the stage 1 tools
  // must keep answering instead of failing every request on the select.
  if (keyRes.error && isMissingColumn(keyRes.error, 'scope')) {
    console.warn(`[mcp-server/${invId}] client_api_keys.scope missing; migration not applied, every key read only`)
    keyRes = await readKey('id, client_id, created_by, last_used_at, revoked_at')
  }
  if (keyRes.error) throw keyRes.error
  const row = keyRes.data
  if (!row || row.revoked_at) return { cred: null }
  if (String(row.client_id) !== clientIdFromKey(key)) {
    console.warn(`[mcp-server/${invId}] key row ${row.id} client id does not match the key`)
    return { cred: null }
  }
  const client = await readClient(sb, row.client_id)
  if (!client) return { cred: null }
  return {
    cred: {
      kind: 'key',
      id: row.id,
      client,
      scope: keyScope(row),
      actor: row.created_by ?? null,
      lastUsedAt: row.last_used_at,
      rateKey: `mcp:key:${row.id}`,
      stamp: (db, now) => db.from('client_api_keys').update({ last_used_at: now.toISOString() }).eq('id', row.id).is('revoked_at', null),
      // Research clients (4.4): allowed only for a key an admin created.
      actorIsAdmin: async (db) => {
        if (!row.created_by) return false
        const prof = await db.from('user_profiles').select('role').eq('id', row.created_by).maybeSingle()
        if (prof.error) throw prof.error
        return !!(prof.data && prof.data.role === 'admin')
      },
    },
  }
}

/**
 * The OAuth path (stage 3 section 5). The access token row by sha256 (kind
 * access), then its grant, then the grant's user, who must still be a viewer
 * of the grant's BrandGEO client, then the same clients read as a key. Any
 * dead link answers 401 with error="invalid_token" so Claude refreshes or
 * reconnects. The oauth tables missing (migration not applied) is the same
 * 401: no bgmat_ token can exist yet.
 */
async function resolveOAuth(sb, token, nowMs, invId) {
  const dead = { cred: null, invalidToken: true }
  const t = await sb.from('oauth_tokens').select('id, grant_id, kind, scope, expires_at, revoked_at')
    .eq('token_hash', oauth.sha256Hex(token)).eq('kind', 'access').maybeSingle()
  if (t.error) {
    if (isMissingTable(t.error)) { console.warn(`[mcp-server/${invId}] oauth tables missing; migration not applied`); return dead }
    throw t.error
  }
  const tok = t.data
  if (!tok || tok.revoked_at || !(Date.parse(tok.expires_at) > nowMs)) return dead
  const g = await sb.from('oauth_grants').select('id, client_id, user_id, scope, last_used_at, revoked_at, expires_at').eq('id', tok.grant_id).maybeSingle()
  if (g.error) throw g.error
  const grant = g.data
  if (!grant || grant.revoked_at || !(Date.parse(grant.expires_at) > nowMs)) return dead
  const p = await sb.from('user_profiles').select('role, client_id').eq('id', grant.user_id).maybeSingle()
  if (p.error) throw p.error
  const profile = p.data
  // R6 on every call, as the token endpoint does (review L3): a viewer later
  // promoted to admin loses the connection at once instead of for up to an hour.
  if (!profile || profile.role === 'admin' || profile.client_id === null || profile.client_id === undefined || String(profile.client_id) !== String(grant.client_id)) return dead
  const client = await readClient(sb, grant.client_id)
  if (!client) return dead
  return {
    cred: {
      kind: 'oauth',
      id: grant.id,
      client,
      scope: oauthScope(tok.scope, grant.scope),
      actor: grant.user_id ?? null,
      lastUsedAt: grant.last_used_at,
      rateKey: `mcp:grant:${grant.id}`,
      // Use keeps the grant alive: idle expiry (R5) runs from the last use.
      stamp: (db, now) => db.from('oauth_grants')
        .update({ last_used_at: now.toISOString(), expires_at: oauth.isoAfter(now, oauth.GRANT_IDLE_S) })
        .eq('id', grant.id).is('revoked_at', null),
      // The profile is never admin here (refused above), so research-client
      // and admin-only paths stay closed to an OAuth caller.
      actorIsAdmin: async () => false,
    },
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
  const log = { client: '-', cred: '-', method: '-', tool: '-', fixId: null }
  const finish = (res, outcome) => {
    const fix = log.fixId === null ? '' : ` fix_id=${log.fixId}`
    console.log(`[mcp-server/${invId}] client=${log.client} cred=${log.cred} method=${log.method} tool=${log.tool}${fix} ms=${Date.now() - t0} outcome=${outcome}`)
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
    const now = nowFn()
    const nowMs = now.getTime()
    const nowIso = now.toISOString()

    // 6. Authentication (section 3.4), routed by shape (stage 3 section 5):
    // bgmcp_ is the key path, unchanged; bgmat_ is an OAuth access token.
    // Anything else answers 401 before the database is touched.
    const token = bearer(event)
    const isKey = CLIENT_API_KEY_RE.test(token)
    const isOAuth = !isKey && oauth.ACCESS_TOKEN_RE.test(token)
    if (!isKey && !isOAuth) return finish(unauthorized(id), '-32001')
    log.cred = isKey ? 'key' : 'oauth'
    const sb = opts.supabase || createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)
    const resolved = isKey ? await resolveKey(sb, token, invId) : await resolveOAuth(sb, token, nowMs, invId)
    if (!resolved.cred) return finish(unauthorized(id, resolved.invalidToken === true), '-32001')
    const cred = resolved.cred
    const client = cred.client
    const clientId = Number(client.id)
    log.client = String(clientId)

    // last_used_at, throttled to once a minute, awaited, never fatal.
    if (!cred.lastUsedAt || nowMs - Date.parse(cred.lastUsedAt) >= LAST_USED_THROTTLE_MS) {
      try {
        const up = await cred.stamp(sb, now)
        if (up && up.error) console.warn(`[mcp-server/${invId}] last_used_at stamp failed for ${cred.kind} row ${cred.id}: ${scrub(up.error.message)}`)
      } catch (e) {
        console.warn(`[mcp-server/${invId}] last_used_at stamp failed for ${cred.kind} row ${cred.id}: ${scrub(e.message)}`)
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
        : scope === 'client_write_hour'
          ? `Write limit reached: ${limit} fix updates an hour for this account. Retry in ${retryAfter} seconds.`
          : scope === 'grant_minute'
            ? `Rate limit reached: ${limit} calls a minute per connection. Retry in ${retryAfter} seconds.`
            : `Rate limit reached: ${limit} calls a minute per key. Retry in ${retryAfter} seconds.`
      return finish(rpcError(200, id, -32029, message, { retry_after: retryAfter, scope, limit }, { 'Retry-After': String(retryAfter) }), '-32029')
    }
    // Per credential: mcp:key:<id> for a key, mcp:grant:<id> for an OAuth
    // connection (stage 3 section 5). The daily and write counters below are
    // per client and shared by both, so mixing credentials doubles nothing.
    const limited = await rateCheck(cred.rateKey, cfg.perKeyPerMinute, 60, cred.kind === 'oauth' ? 'grant_minute' : 'key_minute')
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
        instructions: cred.scope !== 'read_write' ? INSTRUCTIONS : cred.kind === 'oauth' ? INSTRUCTIONS_READ_WRITE_OAUTH : INSTRUCTIONS_READ_WRITE,
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
      if (!(await cred.actorIsAdmin(sb))) return finish(rpcError(200, id, -32003, 'This account is not available over MCP.'), '-32003')
    }

    if (method === 'tools/list') return finish(rpcResult(id, toolsListResult(version, cred.scope)), 'ok')

    // tools/call
    const params = msg.params && typeof msg.params === 'object' && !Array.isArray(msg.params) ? msg.params : {}
    const tool = typeof params.name === 'string' ? TOOL_BY_NAME.get(params.name) : undefined
    if (!tool) {
      log.tool = 'unknown'
      return finish(rpcError(200, id, -32602, 'Unknown tool', { tool: typeof params.name === 'string' ? params.name : null }), '-32602')
    }
    log.tool = tool.name
    if (tool.write) log.fixId = loggableFixId(params.arguments && typeof params.arguments === 'object' ? params.arguments.fix_id : undefined)

    const dayLimited = await rateCheck(`mcp:client:${clientId}:day`, cfg.perClientPerDay, 86400, 'client_day')
    if (dayLimited) return dayLimited

    const args = params.arguments === undefined || params.arguments === null ? {} : params.arguments
    const inputError = (text, code = 'tool_input_error') => finish(rpcResult(id, { content: [{ type: 'text', text }], isError: true }), code)
    if (typeof args !== 'object' || Array.isArray(args)) return inputError('arguments must be an object')

    // Write gate (stage 2): the key's scope, then the per-client write counter.
    // The plan gate above is the write plan gate too (ruling 2).
    if (tool.write) {
      if (cred.scope !== 'read_write') {
        return cred.kind === 'oauth' ? inputError(READ_ONLY_OAUTH_MESSAGE, 'read_only_grant') : inputError(READ_ONLY_KEY_MESSAGE, 'read_only_key')
      }
      const writeLimited = await rateCheck(`mcp:client:${clientId}:writes:hour`, cfg.perClientWritesPerHour, 3600, 'client_write_hour')
      if (writeLimited) return writeLimited
    }

    const engines = activeEnginesFor(client.plan, client.engines_enabled)
    const ctx = { sb, cfg, client, clientId, engines, nowMs, nowIso, cred, invId, outcome: null }
    let out
    try {
      out = await tool.run(ctx, args)
    } catch (e) {
      if (e instanceof ToolInputError) return inputError(e.message, e.code)
      throw e
    }
    return finish(rpcResult(id, { content: [{ type: 'text', text: JSON.stringify(out) }], structuredContent: out }), ctx.outcome || 'ok')
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
exports.MCP_WRITES_PER_CLIENT_PER_HOUR = MCP_WRITES_PER_CLIENT_PER_HOUR
/** Tools every gated key sees: the seven stage 1 tools plus list_fixes. */
exports.TOOL_NAMES = TOOLS.map((t) => t.name)
/** Tools listed only for a read and write key. */
exports.WRITE_TOOL_NAMES = WRITE_TOOLS.map((t) => t.name)
