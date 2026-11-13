/**
 * fake_supabase_mem.js: an in-memory stand-in for the parts of supabase-js the
 * affiliate module uses, so the handlers can run end to end without a
 * network. It models PostgREST's builder (from/select/insert/update/delete,
 * eq/neq/in/gte/lte/gt/lt/is, order/limit, single/maybeSingle), the three
 * SQL RPCs from db/supabase-affiliate-migration-2026-09-12.sql, the unique
 * constraints that the handlers rely on for idempotency, auth.getUser,
 * auth.admin.* and storage signed URLs.
 *
 * upsert(rows, { onConflict }) (added for MCP stage 2, mark_fix_done) merges
 * into the row matching the onConflict columns or inserts, and runs an
 * optional per-table trigger stand-in, db.triggers[table](op, oldRow, newRow,
 * nowIso), which returns the row to store or throws to refuse it. A test sets
 * it to model what a real trigger stamps (fix_states_guard's marked_at).
 *
 * MCP stage 3 added the four oauth_* tables. A UNIQUE entry may be
 * { cols, where } to model a partial unique index (oauth_grants_one_live:
 * one live grant per user, OAuth client and BrandGEO client).
 *
 * It proves control flow and data flow, NOT Postgres semantics: RLS,
 * transactions and the real RPC bodies are verified against production after
 * the migration is applied (docs/affiliates/TEST-RESULTS.md).
 */
const crypto = require('crypto')

const UNIQUE = {
  affiliate_programs: [['slug']],
  affiliates: [['email'], ['user_id']],
  affiliate_memberships: [['affiliate_id', 'program_id']],
  affiliate_codes: [['program_id', 'code:upper']],
  affiliate_visits: [['visit_token']],
  affiliate_attributions: [['program_id', 'external_customer_id']],
  affiliate_conversions: [['idempotency_key']],
  affiliate_payout_items: [['commission_id']],
  affiliate_rate_limits: [['key', 'window_start']],
  stripe_events: [['id']],
  terms_acceptances: [['reference']],
  user_profiles: [['id']],
  client_api_keys: [['key_hash']],
  fix_states: [['client_id', 'fix_id']],
  // MCP stage 3 (db/supabase-mcp-oauth-2026-11-06.sql). A key may be an
  // object { cols, where } for a partial unique index: one live grant per
  // (user, OAuth client, BrandGEO client), where revoked_at is null.
  oauth_clients: [['id']],
  oauth_grants: [{ cols: ['user_id', 'oauth_client_id', 'client_id'], where: (r) => r.revoked_at === null || r.revoked_at === undefined }],
  oauth_codes: [['code_hash'], ['request_id_hash']],
  oauth_tokens: [['token_hash']],
  // Explee lead import (db/supabase-explee-lead-import-2026-11-11.sql): the pk
  // and the two partial identity indexes on creating/created rows. A table no
  // other suite uses, so existing tests are unaffected.
  explee_leads: [
    ['person_id'],
    { cols: ['email_sha256'], where: (r) => r.decision === 'creating' || r.decision === 'created' },
    { cols: ['brand_domain'], where: (r) => r.decision === 'creating' || r.decision === 'created' },
  ],
  // 7 day invite links (db/supabase-client-invite-links-2026-11-13.sql): the
  // unique token_hash and client_invite_links_one_active, at most one row per
  // user that is neither revoked nor accepted. A table no other suite uses.
  client_invite_links: [
    ['token_hash'],
    { cols: ['user_id'], where: (r) => (r.revoked_at === null || r.revoked_at === undefined) && (r.accepted_at === null || r.accepted_at === undefined) },
  ],
}

const HAS_UPDATED_AT = new Set(['affiliate_programs', 'affiliates', 'affiliate_memberships', 'affiliate_attributions', 'affiliate_conversions', 'affiliate_commissions', 'affiliate_payout_batches'])

const SERIAL = new Set(['affiliate_applications', 'affiliate_visits', 'affiliate_resources', 'affiliate_audit_log', 'affiliate_rate_limits', 'terms_acceptances', 'clients', 'client_events', 'fix_states', 'client_invite_links'])

const DEFAULTS = {
  affiliate_programs: () => ({ status: 'draft', is_public: true, currency: 'EUR', lead_commission_cents: 0, sale_commission_type: 'percent', sale_commission_cents: 0, sale_commission_bps: 0, recurring_commission_bps: 0, recurring_months: null, attribution_days: 30, attribution_mode: 'last_touch', approval_days: 30, min_payout_cents: 5000, payout_schedule: 'Monthly, within 15 days after month end', tagline: null, description: null, logo_url: null, brand_color: null, terms_md: null, terms_url: null, terms_version: null, api_key_hash: null, api_key_prefix: null, api_key_created_at: null, archived_at: null }),
  affiliates: () => ({ status: 'invited', payout_details: {}, user_id: null, company: null, website: null, social_url: null, country: null, promo_method: null, payout_method: null, terms_accepted_at: null, terms_version: null, privacy_accepted_at: null, invite_token_hash: null, invite_expires_at: null, invited_by: null, invited_at: null, suspended_at: null, suspended_reason: null, notes: null, email_hash: null }),
  affiliate_memberships: () => ({ status: 'invited', custom_rules: null, applied_at: null, approved_at: null, approved_by: null, rejected_reason: null, clicks_total: 0, clicks_last_at: null }),
  affiliate_applications: () => ({ status: 'pending', terms_accepted: false, privacy_accepted: false, affiliate_id: null, membership_id: null, review_note: null, reviewed_by: null, reviewed_at: null, payout_method: null }),
  affiliate_codes: () => ({ kind: 'link', is_primary: false, is_active: true, stripe_promotion_code_id: null, stripe_coupon_id: null, note: null }),
  affiliate_visits: () => ({ utm: null, landing_path: null, referrer_host: null, ua_family: null, ip_hash: null, country: null, code_id: null }),
  affiliate_attributions: () => ({ is_self_referral: false, flags: [], converted_at: null, first_sale_at: null, recurring_until: null, stripe_customer_id: null, stripe_subscription_id: null, subscription_ended_at: null, created_by: null, manual_reason: null, customer_ref: null, visit_id: null, visit_token: null, code_id: null, expires_at: null }),
  affiliate_conversions: () => ({ amount_cents: 0, currency: 'EUR', status: 'confirmed', is_self_referral: false, flags: [], metadata: {}, external_id: null, external_customer_id: null, customer_ref: null, parent_conversion_id: null, stripe_customer_id: null, stripe_subscription_id: null, stripe_invoice_id: null, stripe_charge_id: null, stripe_payment_intent_id: null, stripe_session_id: null, created_by: null, manual_reason: null, reversed_at: null, reversal_reason: null, attribution_id: null }),
  affiliate_commissions: () => ({ rule_snapshot: {}, status: 'pending', reconciliation_flag: false, reconciliation_note: null, approve_after: null, approved_at: null, approved_by: null, paid_at: null, payout_item_id: null, rejected_reason: null, reversal_reason: null, notes: null }),
  affiliate_payout_batches: () => ({ status: 'draft', total_cents: 0, item_count: 0, payout_details: {}, documents: [], external_reference: null, note: null, paid_at: null, paid_by: null, cancelled_at: null, payout_method: null }),
  affiliate_payout_items: () => ({}),
  affiliate_resources: () => ({ kind: 'link', sort_order: 0, is_active: true, url: null, body: null }),
  affiliate_audit_log: () => ({ before: null, after: null, reason: null, program_id: null, affiliate_id: null, entity_id: null, actor_id: null, actor_label: null }),
  affiliate_rate_limits: () => ({ count: 0 }),
  stripe_events: () => ({}),
  terms_acceptances: () => ({ affiliate_code: null, affiliate_visit_token: null, affiliate_program: null, email: null }),
  clients: () => ({ stripe_customer_id: null, stripe_subscription_id: null }),
  user_profiles: () => ({}),
  client_events: () => ({}),
  fix_states: () => ({ status: 'open', title: null, metric_key: null, baseline_value: null, baseline_n: null, marked_at: null, marked_by: null, marked_by_key: null, marked_by_grant: null, checked_at: null, check_value: null, check_n: null }),
  client_api_keys: () => ({ label: '', scope: 'read', created_by: null, last_used_at: null, revoked_at: null }),
  oauth_clients: () => ({ name: '', redirect_uris: [], secret_hash: null, metadata: null, fetched_at: null, disabled_at: null }),
  oauth_grants: () => ({ client_name: '', redirect_host: '', scope: 'mcp:read', last_used_at: null, revoked_at: null, expires_at: null }),
  oauth_codes: () => ({ code_hash: null, request_id_hash: null, scope_requested: null, scope_granted: null, resource: null, state: null, used_at: null, grant_id: null }),
  oauth_tokens: () => ({ scope: 'mcp:read', used_at: null, revoked_at: null, rotated_from: null }),
  client_invite_links: () => ({ created_by: null, revoked_at: null, revoked_reason: null, accepted_at: null, last_redeemed_at: null, redeem_count: 0 }),
}

// Error a missing table answers through PostgREST: 42P01 is Postgres's own
// "relation does not exist", PGRST205 is PostgREST's schema cache miss.
function missingTableError(table, code) {
  if (code === 'PGRST205') return { code: 'PGRST205', message: `Could not find the table 'public.${table}' in the schema cache` }
  return { code: code || '42P01', message: `relation "public.${table}" does not exist` }
}

function clone(v) { return v === undefined ? undefined : JSON.parse(JSON.stringify(v)) }

// ── client_locations SQL functions (opt-in, createFakeSupabase({ clientLocations: true })) ──
// Mirrors db/supabase-client-locations-2026-11-13.sql step 2 and step 5 in
// control flow. Errors carry the code and message prefix the SQL raises.
function clLive(db, clientId) {
  return (db.tables.client_locations || []).filter((r) => String(r.client_id) === String(clientId) && (r.archived_at === null || r.archived_at === undefined))
}
function clNextId(db) {
  const rows = db.tables.client_locations || []
  const max = rows.reduce((m, r) => Math.max(m, Number(r.id) || 0), Number(db.serial.client_locations) || 0)
  db.serial.client_locations = max + 1
  return max + 1
}
function clInsert(db, row, nowIso) {
  const rows = db.tables.client_locations || (db.tables.client_locations = [])
  const full = Object.assign({ id: clNextId(db), region_id: 'ALL', is_primary: false, position: 0, archived_at: null, created_at: nowIso, created_by: null }, row)
  rows.push(full)
  return full
}
function clEnsure(db, clientId, nowIso) {
  const live = clLive(db, clientId)
  const prim = live.find((r) => r.is_primary)
  if (prim) return { data: Number(prim.id), error: null }
  const client = (db.tables.clients || []).find((c) => String(c.id) === String(clientId))
  if (!client) return { data: null, error: { code: '23503', message: `client_not_found: ${clientId}` } }
  const m = client.default_market_id == null ? 'WW' : client.default_market_id
  const r = client.default_region_id == null || client.default_region_id === '' ? 'ALL' : client.default_region_id
  const same = live.find((x) => x.market_id === m && x.region_id === r)
  if (same) { same.is_primary = true; return { data: Number(same.id), error: null } }
  const row = clInsert(db, { client_id: Number(clientId), market_id: m, region_id: r, is_primary: true, position: 0 }, nowIso)
  return { data: Number(row.id), error: null }
}
const CLIENT_LOCATION_RPCS = {
  ensure_primary_client_location(db, a, nowIso) { return clEnsure(db, a.p_client_id, nowIso) },
  add_client_locations(db, a, nowIso) {
    const ens = clEnsure(db, a.p_client_id, nowIso)
    if (ens.error) return ens
    const used = clLive(db, a.p_client_id).length
    const pairs = Array.isArray(a.p_pairs) ? a.p_pairs : []
    if (a.p_limit !== null && a.p_limit !== undefined && used + pairs.length > a.p_limit) {
      return { data: null, error: { code: '23514', message: `location_limit_reached: ${used} used, ${pairs.length} requested, limit ${a.p_limit}` } }
    }
    const seen = new Set(clLive(db, a.p_client_id).map((r) => `${r.market_id}:${r.region_id}`))
    for (const p of pairs) {
      const k = `${p.market_id}:${p.region_id == null ? 'ALL' : p.region_id}`
      if (seen.has(k)) return { data: null, error: { code: '23505', message: 'duplicate key value violates unique constraint "uq_client_locations_live"' } }
      seen.add(k)
    }
    const out = pairs.map((p, i) => clone(clInsert(db, { client_id: Number(a.p_client_id), market_id: p.market_id, region_id: p.region_id == null ? 'ALL' : p.region_id, position: used + i + 1, created_by: a.p_created_by ?? null }, nowIso)))
    return { data: out, error: null }
  },
  archive_client_location(db, a, nowIso) {
    const row = (db.tables.client_locations || []).find((r) => String(r.id) === String(a.p_location_id) && String(r.client_id) === String(a.p_client_id))
    if (!row) return { data: 'not_found', error: null }
    if (row.archived_at !== null && row.archived_at !== undefined) return { data: 'already_archived', error: null }
    if (row.is_primary) return { data: 'location_is_primary', error: null }
    const inUse = (db.tables.prompts || []).some((p) => String(p.location_id) === String(a.p_location_id) && p.is_active)
    if (inUse) return { data: 'location_in_use', error: null }
    row.archived_at = nowIso
    return { data: 'archived', error: null }
  },
  set_primary_client_location(db, a, nowIso) {
    const ens = clEnsure(db, a.p_client_id, nowIso)
    if (ens.error) return ens
    const row = clLive(db, a.p_client_id).find((r) => String(r.id) === String(a.p_location_id))
    if (!row) return { data: 'not_found', error: null }
    if (row.is_primary) return { data: 'already_primary', error: null }
    for (const r of clLive(db, a.p_client_id)) r.is_primary = false
    row.is_primary = true
    const client = (db.tables.clients || []).find((c) => String(c.id) === String(a.p_client_id))
    if (client) { client.default_market_id = row.market_id; client.default_region_id = row.region_id }
    return { data: 'primary_set', error: null }
  },
}
function uuid() { return crypto.randomUUID() }
function cmp(a, b) {
  if (a === b) return 0
  if (a === null || a === undefined) return -1
  if (b === null || b === undefined) return 1
  return a < b ? -1 : 1
}

class Query {
  constructor(db, table) {
    this.db = db
    this.table = table
    this.op = 'select'
    this.cols = '*'
    this.filters = []
    this.orders = []
    this.lim = null
    this.mode = 'many'
    this.payload = null
    this.returning = false
    this.countMode = null
    this.head = false
  }
  // opts: { count: 'exact', head: true } as supabase-js takes them (added for
  // the MCP suites, docs/arch/mcp-access.md section 5.2). head returns
  // { data: null, count }; count without head adds count beside data. The
  // count is taken over the matched rows BEFORE limit, as PostgREST does.
  select(cols = '*', opts = {}) {
    if (this.op === 'select') { this.cols = cols; this.countMode = (opts && opts.count) || null; this.head = !!(opts && opts.head) } else { this.returning = true; this.cols = cols }
    return this
  }
  insert(rows) { this.op = 'insert'; this.payload = Array.isArray(rows) ? rows : [rows]; return this }
  upsert(rows, { onConflict = '' } = {}) {
    this.op = 'upsert'
    this.payload = Array.isArray(rows) ? rows : [rows]
    this.conflict = String(onConflict).split(',').map((c) => c.trim()).filter(Boolean)
    return this
  }
  update(patch) { this.op = 'update'; this.payload = patch; return this }
  delete() { this.op = 'delete'; return this }
  eq(c, v) { this.filters.push((r) => r[c] === v || (r[c] != null && v != null && String(r[c]) === String(v))); return this }
  neq(c, v) { this.filters.push((r) => r[c] !== v); return this }
  in(c, vs) { const set = new Set((vs || []).map(String)); this.filters.push((r) => r[c] != null && set.has(String(r[c]))); return this }
  is(c, v) { this.filters.push((r) => r[c] === v || (v === null && r[c] === undefined)); return this }
  gte(c, v) { this.filters.push((r) => r[c] != null && cmp(r[c], v) >= 0); return this }
  lte(c, v) { this.filters.push((r) => r[c] != null && cmp(r[c], v) <= 0); return this }
  gt(c, v) { this.filters.push((r) => r[c] != null && cmp(r[c], v) > 0); return this }
  lt(c, v) { this.filters.push((r) => r[c] != null && cmp(r[c], v) < 0); return this }
  order(c, { ascending = true } = {}) { this.orders.push([c, ascending]); return this }
  limit(n) { this.lim = n; return this }
  single() { this.mode = 'single'; return this }
  maybeSingle() { this.mode = 'maybe'; return this }

  _rows() { return this.db.tables[this.table] || (this.db.tables[this.table] = []) }
  _match(rows) { return rows.filter((r) => this.filters.every((f) => f(r))) }
  _project(rows) {
    if (this.cols === '*' || !this.cols) return rows.map(clone)
    const names = this.cols.split(',').map((s) => s.trim()).filter(Boolean)
    return rows.map((r) => { const o = {}; for (const n of names) o[n] = clone(r[n]); return o })
  }
  _checkUnique(row, exclude) {
    const extra = (this.db.extraUnique && this.db.extraUnique[this.table]) || []
    for (const spec of (UNIQUE[this.table] || []).concat(extra)) {
      const key = Array.isArray(spec) ? spec : spec.cols
      const where = Array.isArray(spec) ? null : spec.where
      if (where && !where(row)) continue
      const vals = key.map((k) => { const [col, fn] = k.split(':'); const v = row[col]; return fn === 'upper' && typeof v === 'string' ? v.toUpperCase() : v })
      if (vals.some((v) => v === null || v === undefined)) continue
      const clash = this._rows().find((r) => r !== exclude && (!where || where(r)) && key.every((k, i) => { const [col, fn] = k.split(':'); const v = r[col]; return (fn === 'upper' && typeof v === 'string' ? v.toUpperCase() : v) === vals[i] }))
      if (clash) return { code: '23505', message: `duplicate key value violates unique constraint (${this.table}: ${key.join(',')})` }
    }
    return null
  }
  _finish(rows) {
    if (this.op === 'select' && this.head) return { data: null, count: rows.length, error: null }
    const count = this.op === 'select' && this.countMode ? rows.length : undefined
    const res = this._finishRows(rows)
    if (count !== undefined) res.count = count
    return res
  }
  _finishRows(rows) {
    let out = rows
    for (const [c, asc] of this.orders.slice().reverse()) out = out.slice().sort((a, b) => (asc ? 1 : -1) * cmp(a[c], b[c]))
    if (this.lim != null) out = out.slice(0, this.lim)
    out = this._project(out)
    if (this.mode === 'single') {
      if (out.length !== 1) return { data: null, error: { code: 'PGRST116', message: `expected exactly one row, got ${out.length}` } }
      return { data: out[0], error: null }
    }
    if (this.mode === 'maybe') {
      if (out.length > 1) return { data: null, error: { code: 'PGRST116', message: `expected at most one row, got ${out.length}` } }
      return { data: out[0] || null, error: null }
    }
    return { data: out, error: null }
  }
  async _run() {
    const db = this.db
    db.calls.push({ table: this.table, op: this.op })
    if (db.missingTables && Object.prototype.hasOwnProperty.call(db.missingTables, this.table)) {
      return { data: null, error: missingTableError(this.table, db.missingTables[this.table]) }
    }
    for (const f of db.faults) {
      if (f.table !== this.table || (f.op && f.op !== this.op)) continue
      if (f.times !== undefined && f.times <= 0) continue
      if (f.times !== undefined) f.times -= 1
      if (f.before) await f.before(db, this)
      if (f.error) return { data: null, error: clone(f.error) }
      break
    }
    const rows = this._rows()
    const now = db.now().toISOString()
    if (this.op === 'select') return this._finish(this._match(rows))
    if (this.op === 'insert') {
      if (db.failInsert && db.failInsert.has(this.table)) return { data: null, error: { message: `${this.table} insert refused` } }
      const inserted = []
      for (const input of this.payload) {
        const row = Object.assign({}, (DEFAULTS[this.table] || (() => ({})))(), clone(input))
        if (row.id === undefined) row.id = SERIAL.has(this.table) ? (db.serial[this.table] = (db.serial[this.table] || 0) + 1) : uuid()
        if (row.created_at === undefined) row.created_at = now
        if (HAS_UPDATED_AT.has(this.table) && row.updated_at === undefined) row.updated_at = now
        const err = this._checkUnique(row, null)
        if (err) return { data: null, error: err }
        rows.push(row)
        inserted.push(row)
      }
      return this.returning || this.mode !== 'many' ? this._finish(inserted) : { data: null, error: null }
    }
    if (this.op === 'upsert') {
      const trigger = db.triggers[this.table]
      const cols = this.conflict.length ? this.conflict : ['id']
      const written = []
      for (const input of this.payload) {
        const existing = rows.find((r) => cols.every((c) => r[c] != null && input[c] != null && String(r[c]) === String(input[c])))
        let next = existing
          ? Object.assign({}, existing, clone(input))
          : Object.assign({}, (DEFAULTS[this.table] || (() => ({})))(), clone(input))
        if (!existing) {
          if (next.id === undefined) next.id = SERIAL.has(this.table) ? (db.serial[this.table] = (db.serial[this.table] || 0) + 1) : uuid()
          if (next.created_at === undefined) next.created_at = now
        }
        if (trigger) {
          try { next = trigger(existing ? 'UPDATE' : 'INSERT', existing ? clone(existing) : null, next, now) } catch (e) { return { data: null, error: { message: e.message } } }
        }
        const err = this._checkUnique(next, existing || null)
        if (err) return { data: null, error: err }
        if (existing) { Object.assign(existing, next); written.push(existing) } else { rows.push(next); written.push(next) }
      }
      return this.returning || this.mode !== 'many' ? this._finish(written) : { data: null, error: null }
    }
    if (this.op === 'update') {
      const targets = this._match(rows)
      for (const r of targets) {
        const next = Object.assign({}, r, clone(this.payload))
        const err = this._checkUnique(next, r)
        if (err) return { data: null, error: err }
      }
      for (const r of targets) { Object.assign(r, clone(this.payload)); if ('updated_at' in r) r.updated_at = now }
      return this.returning || this.mode !== 'many' ? this._finish(targets) : { data: null, error: null }
    }
    if (this.op === 'delete') {
      const targets = new Set(this._match(rows))
      db.tables[this.table] = rows.filter((r) => !targets.has(r))
      return { data: null, error: null }
    }
    return { data: null, error: { message: 'unsupported op' } }
  }
  then(res, rej) { return this._run().then(res, rej) }
}

// Opt-in extensions (Explee lead import, docs/arch/explee-lead-import.md 5.6).
// Every one is off unless the caller passes it, so the defaults of every
// existing suite are unchanged:
//   extraUnique     { table: [spec, ...] }  more UNIQUE specs, e.g. clients slug
//   sumCostEur      true: rpc('sum_cost_eur', { p_since, p_client_id }) sums the
//                   seeded ai_results.cost_eur for the client (all clients when
//                   p_client_id is null) since p_since
//   pagedListUsers  true: auth.admin.listUsers({ page, perPage }) honours paging
//   authBehaviour   { beforeInvite?(email, options), invite?(email, options) }:
//                   beforeInvite may await (two runs interleave there); invite
//                   may return a full { data, error } result (an existing user,
//                   an injected error) or undefined for the default behaviour.
// inviteUserByEmail also records { email, redirectTo } in db.invites, and
// deleteUser is recorded in db.deletedUsers (both additive arrays).
// Revision 3 of the lead import adds three more, also off by default:
//   failInsert          [table, ...]: every insert into those tables answers an
//                       error ('<table> insert refused')
//   listUsersPageCap    number: with pagedListUsers, serve at most this many
//                       users a page whatever perPage asks (GoTrue capping)
//   listUsersNextPage   true: with pagedListUsers, every answer carries
//                       data.nextPage (the next page number, or null on the last)
// Revision 4 (V1) adds, also off by default:
//   stampCreatedAt        true: createUser (and so the default
//                         inviteUserByEmail path) stamps the new user's
//                         created_at from the injected now. Off, a new user has
//                         no created_at (the "missing created_at" case).
//   inviteResendsPending  true: inviteUserByEmail for an address that already
//                         has a user returns that user when it is unconfirmed
//                         (GoTrue's re-send) and refuses a confirmed one
//                         (email_confirmed_at set) with "already been registered".
//   authBehaviour.onListUsers(args)  awaited before each listUsers page is
//                         served, so a test can add a user between two passes.
// A user_profiles insert for an id that already has a profile answers 23505
// through the existing UNIQUE on user_profiles.id (no option needed).
// Multi-location (docs/arch/multi-location-collection.md, 2026-11-13) adds one
// more, also off by default:
//   clientLocations   true: the four SQL functions of
//                     db/supabase-client-locations-2026-11-13.sql answer
//                     through rpc() over the in-memory client_locations,
//                     clients and prompts tables (ensure_primary_client_location,
//                     add_client_locations, archive_client_location,
//                     set_primary_client_location). Every rpc call is also
//                     recorded with its arguments in db.rpcArgs. No lock, no
//                     transaction: control flow only, as everything here.
// 7 day invite links (docs/arch/invite-link-7-days.md section 10) add, all
// off or inert by default so every existing suite is unchanged:
//   missingTables   { table: '42P01' | 'PGRST205' } (or an array of table
//                   names, meaning 42P01): every query on that table answers
//                   the missing-table error. Also settable later on
//                   db.missingTables, e.g. db.missingTables = { client_invite_links: 'PGRST205' }.
//   db.faults       an array, empty by default, a test pushes entries
//                   { table, op?, times?, before?(db, query), error? }. A
//                   query takes the FIRST entry that matches it (op omitted
//                   matches every op) and still has times left: it awaits
//                   before (a concurrent write, say), then answers error when
//                   given, else runs normally. times counts down per use;
//                   omitted means every time.
//   rpcFaults       { rpcName: { message, code? } } (also db.rpcFaults later):
//                   that rpc answers { data: null, error }.
//   auth.admin.getUserById(id): the user (a shallow copy) or a 404
//                   { status: 404, code: 'user_not_found' } error.
//   auth.admin.generateLink({ type: 'invite', email, options? }): runs the
//                   same authBehaviour.beforeInvite and authBehaviour.invite
//                   hooks as inviteUserByEmail, honours stampCreatedAt (through
//                   createUser), treats an existing UNCONFIRMED user exactly as
//                   inviteUserByEmail does under the same inviteResendsPending
//                   flag, refuses a CONFIRMED user (email_confirmed_at set) with
//                   { status: 422, code: 'email_exists' }, writes a new
//                   confirmation_token on the user and stamps invited_at at every
//                   success, records { type, email, redirectTo, userId,
//                   properties } in db.generatedLinks, and answers
//                   { user, properties: { hashed_token (56 hex),
//                   verification_type: 'invite', action_link, email_otp } }.
//                   An invite hook may return its own { data, error }; a
//                   success without data.properties gets the default ones.
//                   db.generateLinkOverride, when set, is awaited instead of
//                   all of that for type 'invite' (after the record is pushed).
//                   Other types keep the earlier answer ({ action_link } only,
//                   recorded as { email, link }), which the affiliate tests use.
function createFakeSupabase({ now = () => new Date(), users = [], extraUnique = null, sumCostEur = false, pagedListUsers = false, authBehaviour = null, failInsert = null, listUsersPageCap = null, listUsersNextPage = false, stampCreatedAt = false, inviteResendsPending = false, clientLocations = false, missingTables = null, rpcFaults = null } = {}) {
  const db = {
    missingTables: Array.isArray(missingTables) ? Object.fromEntries(missingTables.map((t) => [t, '42P01'])) : missingTables,
    faults: [],
    rpcFaults,
    generateLinkOverride: null,
    tables: {},
    serial: {},
    calls: [],
    rpcArgs: [],
    triggers: {},                // table -> (op, oldRow, newRow, nowIso) => row, upsert only
    extraUnique,
    failInsert: Array.isArray(failInsert) && failInsert.length ? new Set(failInsert) : null,
    authBehaviour,
    invites: [],
    deletedUsers: [],
    now,
    users: new Map(),            // token -> user
    usersById: new Map(),        // id -> user
    createdUsers: [],
    generatedLinks: [],
    storageOps: [],
    from(table) { return new Query(db, table) },
    async rpc(name, args = {}) {
      db.calls.push({ rpc: name })
      if (db.rpcFaults && db.rpcFaults[name]) return { data: null, error: clone(db.rpcFaults[name]) }
      const nowD = db.now()
      if (name === 'affiliate_record_visit') {
        const visits = db.tables.affiliate_visits || (db.tables.affiliate_visits = [])
        if (args.p_ip_hash) {
          const cutoff = new Date(nowD.getTime() - 60000).toISOString()
          const recent = visits.filter((v) => v.ip_hash === args.p_ip_hash && v.created_at > cutoff).length
          if (recent >= (args.p_rate_limit || 30)) return { data: { recorded: false, reason: 'rate_limited' }, error: null }
        }
        const res = await db.from('affiliate_visits').insert({ program_id: args.p_program, membership_id: args.p_membership, code_id: args.p_code, visit_token: args.p_token, landing_path: args.p_landing, referrer_host: args.p_referrer, utm: args.p_utm, ua_family: args.p_ua, ip_hash: args.p_ip_hash }).select('*').single()
        if (res.error) return { data: null, error: res.error }
        const m = (db.tables.affiliate_memberships || []).find((x) => x.id === args.p_membership)
        if (m) { m.clicks_total = Number(m.clicks_total || 0) + 1; m.clicks_last_at = nowD.toISOString() }
        return { data: { recorded: true, visit_id: res.data.id }, error: null }
      }
      if (name === 'affiliate_rate_check') {
        const w = args.p_window_seconds
        const ws = new Date(Math.floor(nowD.getTime() / 1000 / w) * w * 1000).toISOString()
        const rows = db.tables.affiliate_rate_limits || (db.tables.affiliate_rate_limits = [])
        let row = rows.find((r) => r.key === args.p_key && r.window_start === ws)
        if (!row) { row = { id: (db.serial.affiliate_rate_limits = (db.serial.affiliate_rate_limits || 0) + 1), key: args.p_key, window_start: ws, count: 0, created_at: nowD.toISOString() }; rows.push(row) }
        row.count += 1
        return { data: row.count <= args.p_limit, error: null }
      }
      if (name === 'affiliate_mature_commissions') {
        const convs = new Map((db.tables.affiliate_conversions || []).map((c) => [c.id, c]))
        let n = 0
        for (const c of db.tables.affiliate_commissions || []) {
          const v = convs.get(c.conversion_id)
          if (c.status === 'pending' && c.approve_after && c.approve_after <= nowD.toISOString() && v && v.status === 'confirmed') { c.status = 'approved'; c.approved_at = nowD.toISOString(); n++ }
        }
        return { data: n, error: null }
      }
      if (name === 'sum_cost_eur' && sumCostEur) {
        let sum = 0
        for (const r of db.tables.ai_results || []) {
          if (args.p_client_id !== null && args.p_client_id !== undefined && String(r.client_id) !== String(args.p_client_id)) continue
          if (args.p_since && r.checked_at && r.checked_at < args.p_since) continue
          sum += Number(r.cost_eur || 0)
        }
        return { data: sum, error: null }
      }
      if (clientLocations && CLIENT_LOCATION_RPCS[name]) {
        db.rpcArgs.push({ name, args: clone(args) })
        return CLIENT_LOCATION_RPCS[name](db, args, nowD.toISOString())
      }
      return { data: null, error: { message: `unknown rpc ${name}` } }
    },
    auth: {
      async getUser(token) {
        const u = db.users.get(token)
        return u ? { data: { user: u }, error: null } : { data: { user: null }, error: { message: 'invalid token' } }
      },
      admin: {
        async createUser({ email }) {
          const existing = Array.from(db.usersById.values()).find((u) => u.email === email)
          if (existing) return { data: { user: null }, error: { message: 'A user with this email address has already been registered' } }
          const u = { id: uuid(), email }
          if (stampCreatedAt) u.created_at = db.now().toISOString()
          db.usersById.set(u.id, u)
          db.createdUsers.push(u)
          return { data: { user: u }, error: null }
        },
        async listUsers(args) {
          if (db.authBehaviour && db.authBehaviour.onListUsers) await db.authBehaviour.onListUsers(args)
          const all = Array.from(db.usersById.values())
          if (!pagedListUsers || !args) return { data: { users: all }, error: null }
          const asked = args.perPage || 50
          const perPage = listUsersPageCap ? Math.min(asked, listUsersPageCap) : asked
          const page = args.page || 1
          const data = { users: all.slice((page - 1) * perPage, page * perPage) }
          if (listUsersNextPage) data.nextPage = page * perPage < all.length ? page + 1 : null
          return { data, error: null }
        },
        async deleteUser(id) {
          db.deletedUsers.push(id)
          db.usersById.delete(id)
          return { data: null, error: null }
        },
        async getUserById(id) {
          const u = db.usersById.get(id)
          if (!u) return { data: { user: null }, error: { status: 404, code: 'user_not_found', message: 'User not found' } }
          return { data: { user: Object.assign({}, u) }, error: null }
        },
        async generateLink({ type, email, options } = {}) {
          if (type !== 'invite') {
            const redirectTo = options && options.redirectTo
            const link = `https://fake.supabase/auth/v1/verify?token=${crypto.randomBytes(8).toString('hex')}&type=magiclink&redirect_to=${encodeURIComponent(redirectTo)}`
            db.generatedLinks.push({ email, link })
            return { data: { properties: { action_link: link } }, error: null }
          }
          const rec = { type: 'invite', email, redirectTo: (options && options.redirectTo) || null, userId: null, properties: null }
          db.generatedLinks.push(rec)
          if (db.generateLinkOverride) return db.generateLinkOverride({ type, email, options })
          const finish = (result) => {
            const user = result && result.data && result.data.user
            if (!result || result.error || !user) return result
            const stored = db.usersById.get(user.id)
            const tokenValue = crypto.randomBytes(16).toString('hex')
            const stamp = db.now().toISOString()
            if (stored) { stored.confirmation_token = tokenValue; stored.invited_at = stamp }
            user.confirmation_token = tokenValue
            user.invited_at = stamp
            let properties = result.data.properties
            if (!properties) {
              const hashed = crypto.randomBytes(28).toString('hex')
              properties = {
                hashed_token: hashed,
                verification_type: 'invite',
                action_link: `https://fake.supabase/auth/v1/verify?token=${hashed}&type=invite&redirect_to=${encodeURIComponent(rec.redirectTo || '')}`,
                email_otp: String(crypto.randomInt(100000, 1000000)),
              }
            }
            rec.userId = user.id
            rec.properties = clone(properties)
            return { data: Object.assign({}, result.data, { user, properties }), error: null }
          }
          const b = db.authBehaviour
          if (b && b.beforeInvite) await b.beforeInvite(email, options)
          if (b && b.invite) {
            const r = await b.invite(email, options)
            if (r !== undefined) return finish(r)
          }
          const key = String(email || '').toLowerCase()
          const existing = Array.from(db.usersById.values()).find((u) => String(u.email || '').toLowerCase() === key)
          if (existing && existing.email_confirmed_at) {
            return { data: { user: null, properties: null }, error: { status: 422, code: 'email_exists', message: 'A user with this email address has already been registered' } }
          }
          if (existing && inviteResendsPending) return finish({ data: { user: existing }, error: null })
          return finish(await db.auth.admin.createUser({ email }))
        },
        async inviteUserByEmail(email, options) {
          db.invites.push({ email, redirectTo: options && options.redirectTo })
          const b = db.authBehaviour
          if (b && b.beforeInvite) await b.beforeInvite(email, options)
          if (b && b.invite) {
            const r = await b.invite(email, options)
            if (r !== undefined) return r
          }
          if (inviteResendsPending) {
            const key = String(email || '').toLowerCase()
            const existing = Array.from(db.usersById.values()).find((u) => String(u.email || '').toLowerCase() === key)
            if (existing && existing.email_confirmed_at) return { data: { user: null }, error: { message: 'A user with this email address has already been registered' } }
            if (existing) return { data: { user: existing }, error: null }
          }
          return db.auth.admin.createUser({ email })
        },
      },
    },
    storage: {
      from(bucket) {
        return {
          async createSignedUploadUrl(path) { db.storageOps.push({ bucket, op: 'upload_url', path }); return { data: { signedUrl: `https://fake.storage/${bucket}/${path}?upload`, token: 'tok_' + crypto.randomBytes(4).toString('hex') }, error: null } },
          async createSignedUrl(path, ttl) { db.storageOps.push({ bucket, op: 'signed_url', path, ttl }); return { data: { signedUrl: `https://fake.storage/${bucket}/${path}?sig` }, error: null } },
        }
      },
    },
    /** Register a JWT -> user mapping for auth.getUser. */
    addUser(token, user) { db.users.set(token, user); db.usersById.set(user.id, user); return user },
    /** Direct access for assertions. */
    rows(table) { return db.tables[table] || [] },
    seed(table, rows) { db.tables[table] = (db.tables[table] || []).concat(rows.map((r) => Object.assign({}, (DEFAULTS[table] || (() => ({})))(), { id: r.id || (SERIAL.has(table) ? (db.serial[table] = (db.serial[table] || 0) + 1) : uuid()), created_at: db.now().toISOString() }, r))); return db.tables[table] },
  }
  for (const u of users) db.addUser(u.token, { id: u.id, email: u.email })
  return db
}

module.exports = { createFakeSupabase }
