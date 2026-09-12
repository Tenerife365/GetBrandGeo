/**
 * fake_supabase_mem.js: an in-memory stand-in for the parts of supabase-js the
 * affiliate module uses, so the handlers can run end to end without a
 * network. It models PostgREST's builder (from/select/insert/update/delete,
 * eq/neq/in/gte/lte/gt/lt/is, order/limit, single/maybeSingle), the three
 * SQL RPCs from db/supabase-affiliate-migration-2026-09-12.sql, the unique
 * constraints that the handlers rely on for idempotency, auth.getUser,
 * auth.admin.* and storage signed URLs.
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
}

const HAS_UPDATED_AT = new Set(['affiliate_programs', 'affiliates', 'affiliate_memberships', 'affiliate_attributions', 'affiliate_conversions', 'affiliate_commissions', 'affiliate_payout_batches'])

const SERIAL = new Set(['affiliate_applications', 'affiliate_visits', 'affiliate_resources', 'affiliate_audit_log', 'affiliate_rate_limits', 'terms_acceptances', 'clients', 'client_events'])

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
}

function clone(v) { return v === undefined ? undefined : JSON.parse(JSON.stringify(v)) }
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
  }
  select(cols = '*') { if (this.op === 'select') this.cols = cols; else { this.returning = true; this.cols = cols } return this }
  insert(rows) { this.op = 'insert'; this.payload = Array.isArray(rows) ? rows : [rows]; return this }
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
    for (const key of UNIQUE[this.table] || []) {
      const vals = key.map((k) => { const [col, fn] = k.split(':'); const v = row[col]; return fn === 'upper' && typeof v === 'string' ? v.toUpperCase() : v })
      if (vals.some((v) => v === null || v === undefined)) continue
      const clash = this._rows().find((r) => r !== exclude && key.every((k, i) => { const [col, fn] = k.split(':'); const v = r[col]; return (fn === 'upper' && typeof v === 'string' ? v.toUpperCase() : v) === vals[i] }))
      if (clash) return { code: '23505', message: `duplicate key value violates unique constraint (${this.table}: ${key.join(',')})` }
    }
    return null
  }
  _finish(rows) {
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
    const rows = this._rows()
    const now = db.now().toISOString()
    if (this.op === 'select') return this._finish(this._match(rows))
    if (this.op === 'insert') {
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

function createFakeSupabase({ now = () => new Date(), users = [] } = {}) {
  const db = {
    tables: {},
    serial: {},
    calls: [],
    now,
    users: new Map(),            // token -> user
    usersById: new Map(),        // id -> user
    createdUsers: [],
    generatedLinks: [],
    storageOps: [],
    from(table) { return new Query(db, table) },
    async rpc(name, args = {}) {
      db.calls.push({ rpc: name })
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
          db.usersById.set(u.id, u)
          db.createdUsers.push(u)
          return { data: { user: u }, error: null }
        },
        async listUsers() { return { data: { users: Array.from(db.usersById.values()) }, error: null } },
        async generateLink({ email, options }) {
          const link = `https://fake.supabase/auth/v1/verify?token=${crypto.randomBytes(8).toString('hex')}&type=magiclink&redirect_to=${encodeURIComponent(options.redirectTo)}`
          db.generatedLinks.push({ email, link })
          return { data: { properties: { action_link: link } }, error: null }
        },
        async inviteUserByEmail(email) { return db.auth.admin.createUser({ email }) },
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
