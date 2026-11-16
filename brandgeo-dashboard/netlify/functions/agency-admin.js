/**
 * agency-admin.js - admin tooling for agency accounts (release P1 of
 * docs/arch/agency-multi-brand.md, section 9.1).
 *
 * POST only, one JSON object { action, ... }. requireAuth(event, { adminOnly:
 * true }) runs first; the service key is used only after it passes.
 *
 *   list               { account_id? }
 *   convert            { account_id, confirm?, confirm_user_ids? }
 *   attach_brand       { account_id, client_id, confirm?, confirm_user_ids? }
 *   detach_brand       { account_id, client_id }
 *   create_staff_login { account_id, email, role }      role: owner | manager
 *   add_staff          { account_id, user_id, role }
 *   create_guest_login { client_id, email }
 *   remove_member      { account_id, user_id }
 *   remove_guest       { client_id, user_id }
 *   ban_removed        { account_id, user_id }
 *
 * convert and attach_brand without confirm: true answer a preview (brand name
 * and every login with a profile or a user_clients row on the brand, id and
 * email). With confirm: true they need confirm_user_ids, the ids the admin saw
 * in the preview; the SQL function refuses a login that is not named. The
 * attach preview also says stripe_linked (the brand carries a Stripe customer
 * or subscription) and blocked_by ('brand_has_stripe' or null): such a brand
 * is refused by account_attach_brand (review F1).
 *
 * Every write is ONE rpc() call to a SQL function of section 4.6 (one
 * transaction, advisory lock, reconcile); create_guest_login calls
 * account_create_guest_profile (review F4). The two removals ban the login
 * after the SQL call commits, with the fixed BAN_DURATION, never a value from
 * the request. A failed ban answers 500 with access_removed: true,
 * ban_failed: true and retry: { action: 'ban_removed', account_id, user_id }:
 * every other channel is closed by then.
 *
 * ban_removed retries that ban (review F2). It bans only a login that was
 * really removed from the named account: not the caller, not an admin, no
 * account_members row in the account, no user_clients row on any brand of
 * it, and a default brand (user_profiles.client_id) that IS a brand of it.
 * Anything else is 409 user_not_removed and bans nothing; any read error is
 * 500 read_failed and bans nothing.
 *
 * SQL refusals arrive as PostgREST errors with code P0001 and a message that
 * is exactly one snake_case token: last_owner is 422, a token ending in
 * _not_found is 404, any other token is 409 { error, code: token }. Any other
 * database error is 500 with a fixed message; the real error goes to the log
 * only. Errors from this function: { error, code }. Errors from requireAuth:
 * { error }.
 *
 * Logins created here (create_staff_login, create_guest_login) follow the
 * provisioning rule of _provision_client.js: the address is checked against
 * every auth user first, the user is created with generateLink (which sends
 * nothing), and the created user counts as ours only when its id was absent
 * from the listing taken immediately before, its created_at parses, and
 * created_at is at most OURS_SKEW_MS before the call. A user that is not ours
 * is never bound and never deleted. When the SQL step fails, a user that is
 * ours and has no profile is deleted; anything else is kept. The invite email
 * (the 7 day BrandGEO link, source 'agency-admin', through deliverInvite) is
 * sent only after the SQL step committed.
 *
 * Never logged: an email address, a token, a link.
 */
const { createClient } = require('@supabase/supabase-js')
const { requireAuth } = require('./_auth')
const { deliverInvite } = require('./_invite_link')
const { loadAuthEmails, REDIRECT_TO, OURS_SKEW_MS } = require('./_provision_client')

// 100 years. 'none' lifts a ban; lifting is a separate admin action that first
// restores rows (spec 4.6). Never read from the request.
const BAN_DURATION = '876000h'
const INVITE_SOURCE = 'agency-admin'

const PG_INT_MAX = 2147483647
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const TOKEN_RE = /^[a-z][a-z0-9_]*$/
const STAFF_ROLES = new Set(['owner', 'manager'])
const GRANT_SOURCES = ['backfill', 'primary', 'account', 'direct']
const MAX_CONFIRM_IDS = 500
// Keyset paging for the list reads: 1,000 rows a page (PostgREST's default
// cap), 20 pages at most per table, then the checks report incomplete.
const PAGE = 1000
const MAX_PAGES = 20
const MAX_BRANDS_COUNTED = 200
const MAX_EMAIL_LOOKUPS = 200
const MAX_LISTED_ACCOUNTS = 200
const MAX_CHECK_ROWS_SHOWN = 100

const ACTIONS = new Set([
  'list', 'convert', 'attach_brand', 'detach_brand', 'create_staff_login',
  'add_staff', 'create_guest_login', 'remove_member', 'remove_guest', 'ban_removed',
])

const MESSAGES = {
  invalid_request: 'The request is not valid.',
  read_failed: 'Could not read the account data. Nothing was changed.',
  db_error: 'The change could not be saved. Nothing was changed.',
  refused: 'The change was refused.',
  ban_failed: 'Access was removed, but the login could not be disabled. Retry with the ban_removed action for this account and login before anything else.',
  user_not_removed: 'This login still has access in this account, or its default brand is not in it. Nothing was disabled. Remove the login first.',
  email_registered: 'A login already exists for this address. Use add staff for an existing login.',
  auth_lookup_incomplete: 'Could not check the existing logins. Nothing was created. Try again.',
  email_rate_limited: 'Supabase is limiting invite emails right now. Wait a few minutes and try again.',
  invite_error: 'The login could not be created. Nothing was changed.',
  target_is_admin: 'An admin login cannot be removed or disabled here.',
  brand_not_in_agency: 'Guest logins can only be created on a client brand of an agency account.',
  // Tokens raised by the SQL functions (spec 4.6), with a safe sentence each.
  last_owner: 'This is the last owner of the account. Add another owner first.',
  unconfirmed_users: 'A login on this brand was not confirmed. Preview again and confirm every login listed.',
  account_not_agency: 'This account is not an agency account.',
  account_already_agency: 'This account is already an agency account.',
  account_has_several_brands: 'Only an account with a single brand can be converted.',
  brand_not_attachable: 'This brand cannot be attached to an agency account.',
  brand_has_stripe: 'This brand is billed through Stripe. End its Stripe subscription and customer link before attaching it to an agency.',
  brand_is_agency_home: 'This brand is the home brand of an agency account.',
  brand_is_home: 'The home brand cannot be detached.',
  account_not_found: 'Account not found.',
  client_not_found: 'Brand not found.',
  user_not_found: 'Login not found.',
  user_in_account: 'This login already belongs to an account.',
  profile_exists: 'This login already has a profile.',
}

const STATUS = {
  invalid_request: 400, read_failed: 500, db_error: 500, ban_failed: 500,
  email_registered: 409, auth_lookup_incomplete: 503, email_rate_limited: 429,
  invite_error: 502, target_is_admin: 409, brand_not_in_agency: 409,
  brand_is_agency_home: 409, account_not_agency: 409, account_not_found: 404,
  client_not_found: 404, profile_exists: 409, user_not_found: 404, user_not_removed: 409,
  brand_has_stripe: 409,
}

// ── small helpers ────────────────────────────────────────────────────────────

function parseId(v) {
  let n = null
  if (typeof v === 'number') n = v
  else if (typeof v === 'string' && /^[1-9][0-9]*$/.test(v)) n = Number(v)
  return Number.isSafeInteger(n) && n > 0 && n <= PG_INT_MAX ? n : null
}

function parseUuid(v) {
  return typeof v === 'string' && UUID_RE.test(v) ? v.toLowerCase() : null
}

/** An array of uuids, deduplicated, at most MAX_CONFIRM_IDS; anything else null. */
function parseUuidList(v) {
  if (!Array.isArray(v) || v.length > MAX_CONFIRM_IDS) return null
  const out = []
  for (const x of v) {
    const id = parseUuid(x)
    if (id === null) return null
    if (!out.includes(id)) out.push(id)
  }
  return out
}

function parseEmail(v) {
  if (typeof v !== 'string') return null
  const e = v.trim().toLowerCase()
  return e.length > 0 && e.length <= 254 && EMAIL_RE.test(e) ? e : null
}

function json(statusCode, headers, obj) {
  return { statusCode, headers: headers || { 'Content-Type': 'application/json' }, body: JSON.stringify(obj) }
}

function fail(headers, code, extra) {
  return json(STATUS[code] || 500, headers, Object.assign({ error: MESSAGES[code] || MESSAGES.refused, code }, extra || {}))
}

const errTag = (e) => (e && (e.code || e.status)) || 'n/a'

/**
 * Map an rpc error onto HTTP. P0001 with a clean token: last_owner 422,
 * *_not_found 404, other tokens 409. Everything else 500, logged.
 */
function rpcFailure(headers, error, ctx, extra) {
  const msg = error && typeof error.message === 'string' ? error.message.trim() : ''
  if (error && error.code === 'P0001' && TOKEN_RE.test(msg)) {
    const status = msg === 'last_owner' ? 422 : msg.endsWith('_not_found') ? 404 : 409
    console.warn(`[agency-admin/${ctx.invId}] action=${ctx.action} refused=${msg}`)
    return json(status, headers, Object.assign({ error: MESSAGES[msg] || MESSAGES.refused, code: msg }, extra || {}))
  }
  console.error(`[agency-admin/${ctx.invId}] action=${ctx.action} rpc failed (${errTag(error)}): ${msg.slice(0, 300)}`)
  return json(500, headers, Object.assign({ error: MESSAGES.db_error, code: 'db_error' }, extra || {}))
}

/** One rpc call; a throw is read as a database error. */
async function callRpc(supabase, name, args) {
  try {
    const res = await supabase.rpc(name, args)
    return { data: res ? res.data : null, error: res ? res.error : { message: 'no result' } }
  } catch (e) {
    return { data: null, error: { message: e && e.message ? e.message : String(e) } }
  }
}

/** Throws a read error so the handler answers read_failed. */
function must(res, what) {
  if (!res || res.error) {
    const e = new Error(`${what}: ${res && res.error ? errTag(res.error) : 'no result'}`)
    e.readFailed = true
    throw e
  }
  return res.data
}

/** Emails by user id, through auth admin, cached; a failed lookup is null. */
async function emailsFor(supabase, ids, cache = new Map()) {
  let looked = 0
  for (const id of ids) {
    if (cache.has(id)) continue
    if (looked >= MAX_EMAIL_LOOKUPS) { cache.set(id, null); continue }
    looked++
    try {
      const { data, error } = await supabase.auth.admin.getUserById(id)
      cache.set(id, !error && data && data.user && typeof data.user.email === 'string' ? data.user.email : null)
    } catch {
      cache.set(id, null)
    }
  }
  return cache
}

/** Every login with a profile or a user_clients row on the brand, with email. */
async function loginsOnBrand(supabase, clientId) {
  const profs = must(await supabase.from('user_profiles').select('id').eq('client_id', clientId), 'user_profiles read')
  const rows = must(await supabase.from('user_clients').select('user_id').eq('client_id', clientId), 'user_clients read')
  const ids = []
  for (const p of profs || []) if (!ids.includes(p.id)) ids.push(p.id)
  for (const r of rows || []) if (!ids.includes(r.user_id)) ids.push(r.user_id)
  const emails = await emailsFor(supabase, ids)
  return ids.map((id) => ({ id, email: emails.get(id) || null }))
}

async function readAccount(supabase, accountId) {
  return must(await supabase.from('accounts').select('id, name, kind, home_client_id, created_at').eq('id', accountId).maybeSingle(), 'accounts read')
}

async function readBrand(supabase, clientId) {
  return must(await supabase.from('clients').select('id, name, plan, category, account_id, stripe_customer_id, stripe_subscription_id').eq('id', clientId).maybeSingle(), 'clients read')
}

// ── list: keyset reads and the three 4.4 checks ─────────────────────────────

/**
 * Every row of a table keyed by a single unique column, in key order.
 * -> { rows, complete }
 */
async function readKeyset(supabase, table, cols, key) {
  const rows = []
  let cursor = null
  for (let page = 0; page < MAX_PAGES; page++) {
    let q = supabase.from(table).select(cols).order(key, { ascending: true }).limit(PAGE)
    if (cursor !== null) q = q.gt(key, cursor)
    const data = must(await q, `${table} read`) || []
    rows.push(...data)
    if (data.length < PAGE) return { rows, complete: true }
    cursor = data[data.length - 1][key]
  }
  return { rows, complete: false }
}

/**
 * Every user_clients row. Its key is (user_id, client_id), so pages go by
 * user_id and a full page drops its last user, whose rows are then read on
 * their own; the next page starts after that user.
 */
async function readUserClients(supabase) {
  const cols = 'user_id, client_id, role, grant_source, created_by, created_at'
  const rows = []
  let cursor = null
  for (let page = 0; page < MAX_PAGES; page++) {
    let q = supabase.from('user_clients').select(cols).order('user_id', { ascending: true }).limit(PAGE)
    if (cursor !== null) q = q.gt('user_id', cursor)
    const data = must(await q, 'user_clients read') || []
    if (data.length < PAGE) { rows.push(...data); return { rows, complete: true } }
    const lastUser = data[data.length - 1].user_id
    rows.push(...data.filter((r) => r.user_id !== lastUser))
    const own = must(await supabase.from('user_clients').select(cols).eq('user_id', lastUser).limit(PAGE + 1), 'user_clients read') || []
    if (own.length > PAGE) return { rows: rows.concat(own.slice(0, PAGE)), complete: false }
    rows.push(...own)
    cursor = lastUser
  }
  return { rows, complete: false }
}

/**
 * The three standing checks of spec 4.4, all EXPECT 0, computed in JS from
 * service-key reads (there is no SQL function for them).
 */
async function computeChecks(supabase) {
  const [members, clients, accounts, links, profiles] = [
    await readKeyset(supabase, 'account_members', 'account_id, user_id, role', 'user_id'),
    await readKeyset(supabase, 'clients', 'id, account_id', 'id'),
    await readKeyset(supabase, 'accounts', 'id, kind', 'id'),
    await readUserClients(supabase),
    await readKeyset(supabase, 'user_profiles', 'id, client_id', 'id'),
  ]
  const complete = members.complete && clients.complete && accounts.complete && links.complete && profiles.complete
  const accountOf = new Map(clients.rows.map((c) => [String(c.id), c.account_id]))
  const kindOf = new Map(accounts.rows.map((a) => [String(a.id), a.kind]))
  const memberSet = new Set(members.rows.map((m) => `${m.user_id}|${m.account_id}`))
  const linkSet = new Set(links.rows.map((l) => `${l.user_id}|${l.client_id}`))
  const profileSet = new Set(profiles.rows.map((p) => `${p.id}|${p.client_id}`))

  // missing: a member without a row on a brand of their account
  const missing = []
  for (const m of members.rows) {
    for (const c of clients.rows) {
      if (String(c.account_id) !== String(m.account_id)) continue
      if (!linkSet.has(`${m.user_id}|${c.id}`)) missing.push({ account_id: m.account_id, user_id: m.user_id, client_id: c.id })
    }
  }
  // stale: an 'account' row with no membership behind it
  const stale = links.rows.filter((l) => l.grant_source === 'account'
    && !memberSet.has(`${l.user_id}|${accountOf.get(String(l.client_id))}`))
  // stray: a non-direct row on an agency brand held by someone who is neither
  // a member of that account nor a login whose default brand is that brand
  const stray = links.rows.filter((l) => {
    const acct = accountOf.get(String(l.client_id))
    if (acct === undefined || acct === null || kindOf.get(String(acct)) !== 'agency') return false
    if (l.grant_source === 'direct') return false
    return !memberSet.has(`${l.user_id}|${acct}`) && !profileSet.has(`${l.user_id}|${l.client_id}`)
  })
  const shape = (list) => ({ count: list.length, rows: list.slice(0, MAX_CHECK_ROWS_SHOWN) })
  return {
    checks: { complete, missing: shape(missing), stale: shape(stale), stray: shape(stray) },
    data: { members, clients, accounts, links },
  }
}

async function actionList(supabase, headers, body, ctx) {
  let accountId = null
  if (body.account_id !== undefined && body.account_id !== null) {
    accountId = parseId(body.account_id)
    if (accountId === null) return fail(headers, 'invalid_request')
  }
  const { checks, data } = await computeChecks(supabase)

  if (accountId === null) {
    const agencies = data.accounts.rows.filter((a) => a.kind === 'agency').slice(0, MAX_LISTED_ACCOUNTS)
    const ids = agencies.map((a) => a.id)
    const rows = ids.length
      ? must(await supabase.from('accounts').select('id, name, kind, home_client_id, created_at').in('id', ids).order('id', { ascending: true }), 'accounts read') || []
      : []
    const accounts = rows.map((a) => ({
      id: a.id, name: a.name, kind: a.kind, home_client_id: a.home_client_id ?? null, created_at: a.created_at,
      brand_count: data.clients.rows.filter((c) => String(c.account_id) === String(a.id)).length,
      member_count: data.members.rows.filter((m) => String(m.account_id) === String(a.id)).length,
    }))
    console.log(`[agency-admin/${ctx.invId}] action=list accounts=${accounts.length}`)
    return json(200, headers, { accounts, checks })
  }

  const account = await readAccount(supabase, accountId)
  if (!account) return fail(headers, 'account_not_found')
  const memberRows = must(await supabase.from('account_members').select('user_id, role, created_at, created_by').eq('account_id', accountId), 'account_members read') || []
  const brandRows = must(await supabase.from('clients').select('id, name, plan, category').eq('account_id', accountId).order('id', { ascending: true }), 'clients read') || []
  const brands = []
  for (const b of brandRows.slice(0, MAX_BRANDS_COUNTED)) {
    const c = await supabase.from('prompts').select('id', { count: 'exact', head: true }).eq('client_id', b.id).eq('is_active', true)
    if (!c || c.error) must(c, 'prompts count')
    brands.push({
      id: b.id, name: b.name, plan: b.plan, category: b.category ?? null,
      is_home: String(b.id) === String(account.home_client_id), active_prompts: c.count ?? 0,
    })
  }
  const brandIds = new Set(brandRows.map((b) => String(b.id)))
  const linkRows = data.links.rows.filter((l) => brandIds.has(String(l.client_id)))
  const cache = await emailsFor(supabase, Array.from(new Set(memberRows.map((m) => m.user_id).concat(linkRows.map((l) => l.user_id)))))
  const rows = Object.fromEntries(GRANT_SOURCES.map((s) => [s, []]))
  for (const l of linkRows) {
    const bucket = rows[l.grant_source] || (rows[l.grant_source] = [])
    bucket.push({ user_id: l.user_id, email: cache.get(l.user_id) || null, client_id: l.client_id, role: l.role, created_at: l.created_at })
  }
  console.log(`[agency-admin/${ctx.invId}] action=list account=${accountId} members=${memberRows.length} brands=${brandRows.length}`)
  return json(200, headers, {
    account: { id: account.id, name: account.name, kind: account.kind, home_client_id: account.home_client_id ?? null, created_at: account.created_at },
    members: memberRows.map((m) => ({ user_id: m.user_id, email: cache.get(m.user_id) || null, role: m.role, created_at: m.created_at })),
    brands,
    brands_truncated: brandRows.length > MAX_BRANDS_COUNTED,
    rows,
    rows_complete: data.links.complete,
    checks,
  })
}

// ── convert, attach, detach, add, remove ────────────────────────────────────

/** confirm absent or false: preview. true: write. Anything else: invalid. */
function readConfirm(body) {
  if (body.confirm === undefined || body.confirm === false) return { confirm: false }
  if (body.confirm !== true) return null
  const ids = parseUuidList(body.confirm_user_ids)
  return ids === null ? null : { confirm: true, ids }
}

async function actionConvert(supabase, headers, body, ctx) {
  const accountId = parseId(body.account_id)
  const c = readConfirm(body)
  if (accountId === null || c === null) return fail(headers, 'invalid_request')
  if (!c.confirm) {
    const account = await readAccount(supabase, accountId)
    if (!account) return fail(headers, 'account_not_found')
    const brands = must(await supabase.from('clients').select('id, name').eq('account_id', accountId).order('id', { ascending: true }), 'clients read') || []
    const home = brands.find((b) => String(b.id) === String(account.home_client_id)) || null
    const users = home ? await loginsOnBrand(supabase, home.id) : []
    return json(200, headers, {
      preview: true, action: 'convert',
      account: { id: account.id, name: account.name, kind: account.kind },
      brand: home ? { id: home.id, name: home.name } : null,
      brand_count: brands.length,
      users,
    })
  }
  const r = await callRpc(supabase, 'convert_to_agency', { p_account_id: accountId, p_confirm_user_ids: c.ids, p_actor: ctx.actor })
  if (r.error) return rpcFailure(headers, r.error, ctx)
  console.log(`[agency-admin/${ctx.invId}] action=convert account=${accountId} ok`)
  return json(200, headers, { ok: true, result: r.data })
}

async function actionAttach(supabase, headers, body, ctx) {
  const accountId = parseId(body.account_id)
  const clientId = parseId(body.client_id)
  const c = readConfirm(body)
  if (accountId === null || clientId === null || c === null) return fail(headers, 'invalid_request')
  if (!c.confirm) {
    const account = await readAccount(supabase, accountId)
    if (!account) return fail(headers, 'account_not_found')
    const brand = await readBrand(supabase, clientId)
    if (!brand) return fail(headers, 'client_not_found')
    const users = await loginsOnBrand(supabase, clientId)
    // review F1: the ids themselves never leave the server, only the fact.
    const stripeLinked = !!(brand.stripe_customer_id || brand.stripe_subscription_id)
    return json(200, headers, {
      preview: true, action: 'attach_brand',
      account: { id: account.id, name: account.name, kind: account.kind },
      brand: { id: brand.id, name: brand.name, plan: brand.plan, category: brand.category ?? null, current_account_id: brand.account_id ?? null },
      users,
      stripe_linked: stripeLinked,
      blocked_by: stripeLinked ? 'brand_has_stripe' : null,
      blocked_message: stripeLinked ? MESSAGES.brand_has_stripe : null,
    })
  }
  const r = await callRpc(supabase, 'account_attach_brand', { p_account_id: accountId, p_client_id: clientId, p_confirm_user_ids: c.ids, p_actor: ctx.actor })
  if (r.error) return rpcFailure(headers, r.error, ctx)
  console.log(`[agency-admin/${ctx.invId}] action=attach_brand account=${accountId} client=${clientId} ok`)
  return json(200, headers, { ok: true, result: r.data })
}

async function actionDetach(supabase, headers, body, ctx) {
  const accountId = parseId(body.account_id)
  const clientId = parseId(body.client_id)
  if (accountId === null || clientId === null) return fail(headers, 'invalid_request')
  const r = await callRpc(supabase, 'account_detach_brand', { p_account_id: accountId, p_client_id: clientId, p_actor: ctx.actor })
  if (r.error) return rpcFailure(headers, r.error, ctx)
  console.log(`[agency-admin/${ctx.invId}] action=detach_brand account=${accountId} client=${clientId} ok`)
  return json(200, headers, { ok: true, result: r.data })
}

async function actionAddStaff(supabase, headers, body, ctx) {
  const accountId = parseId(body.account_id)
  const userId = parseUuid(body.user_id)
  const role = typeof body.role === 'string' && STAFF_ROLES.has(body.role) ? body.role : null
  if (accountId === null || userId === null || role === null) return fail(headers, 'invalid_request')
  const r = await callRpc(supabase, 'account_add_staff', { p_account_id: accountId, p_user_id: userId, p_role: role, p_actor: ctx.actor })
  if (r.error) return rpcFailure(headers, r.error, ctx)
  console.log(`[agency-admin/${ctx.invId}] action=add_staff account=${accountId} user=${userId} ok`)
  return json(200, headers, { ok: true, result: r.data })
}

/** The fixed ban. -> null on success, else the error (never throws). */
async function banLogin(supabase, userId) {
  try {
    const res = await supabase.auth.admin.updateUserById(userId, { ban_duration: BAN_DURATION })
    return res && res.error ? res.error : null
  } catch (e) {
    return { message: e && e.message ? e.message : String(e) }
  }
}

/** 500 after a failed ban, with the ban_removed retry the admin can run. */
function banFailed(headers, ctx, userId, accountId, extra) {
  return json(500, headers, Object.assign({
    error: MESSAGES.ban_failed, code: 'ban_failed', access_removed: true, ban_failed: true,
    retry: { action: 'ban_removed', account_id: accountId ?? null, user_id: userId },
  }, extra || {}))
}

/**
 * The one removal path: refuse an admin target (a ban would lock a platform
 * admin out), ONE rpc, then the fixed ban.
 */
async function removeAndBan(supabase, headers, ctx, userId, rpcName, rpcArgs) {
  const prof = must(await supabase.from('user_profiles').select('role').eq('id', userId).maybeSingle(), 'user_profiles read')
  if (userId === ctx.actor || (prof && prof.role === 'admin')) return fail(headers, 'target_is_admin')
  const r = await callRpc(supabase, rpcName, rpcArgs)
  if (r.error) return rpcFailure(headers, r.error, ctx)
  // The SQL call committed: rows, keys, grants, codes and invite links are
  // gone. Ban the login, whatever the result says, with the fixed value.
  const banError = await banLogin(supabase, userId)
  if (banError) {
    console.error(`[agency-admin/${ctx.invId}] action=${ctx.action} user=${userId} access removed, ban FAILED (${errTag(banError)})`)
    const accountId = r.data && r.data.account_id !== undefined ? r.data.account_id : (rpcArgs.p_account_id ?? null)
    return banFailed(headers, ctx, userId, accountId, { result: r.data })
  }
  console.log(`[agency-admin/${ctx.invId}] action=${ctx.action} user=${userId} removed and banned`)
  return json(200, headers, { ok: true, result: r.data, banned: true, ban_duration: BAN_DURATION })
}

/**
 * Review F2: retry the ban of a login already removed from an account. It
 * bans only when every condition holds, each read with the service key:
 *   - the target is not the caller and not an admin (target_is_admin);
 *   - the target has a profile (else user_not_found) and the account exists;
 *   - no account_members row for the target in that account;
 *   - no user_clients row of the target on any brand of that account;
 *   - the target's default brand (user_profiles.client_id) IS a brand of that
 *     account, so only a staffer or guest who was really removed from it can
 *     be banned here, never a login of some other customer.
 * A failed condition is 409 user_not_removed; a read error is 500
 * read_failed; neither bans anything.
 */
async function actionBanRemoved(supabase, headers, body, ctx) {
  const accountId = parseId(body.account_id)
  const userId = parseUuid(body.user_id)
  if (accountId === null || userId === null) return fail(headers, 'invalid_request')
  if (userId === ctx.actor) return fail(headers, 'target_is_admin')
  const prof = must(await supabase.from('user_profiles').select('role, client_id').eq('id', userId).maybeSingle(), 'user_profiles read')
  if (!prof) return fail(headers, 'user_not_found')
  if (prof.role === 'admin') return fail(headers, 'target_is_admin')
  const account = await readAccount(supabase, accountId)
  if (!account) return fail(headers, 'account_not_found')

  const memberRows = must(await supabase.from('account_members').select('user_id').eq('account_id', accountId).eq('user_id', userId).limit(1), 'account_members read') || []
  const linkRows = must(await supabase.from('user_clients').select('client_id').eq('user_id', userId).limit(PAGE + 1), 'user_clients read') || []
  if (linkRows.length > PAGE) must({ error: { message: 'too many user_clients rows' } }, 'user_clients read')
  const ids = []
  for (const l of linkRows) if (!ids.includes(String(l.client_id))) ids.push(String(l.client_id))
  const hasDefault = prof.client_id !== null && prof.client_id !== undefined
  if (hasDefault && !ids.includes(String(prof.client_id))) ids.push(String(prof.client_id))
  const brandRows = ids.length
    ? must(await supabase.from('clients').select('id, account_id').in('id', ids), 'clients read') || []
    : []
  const accountOf = new Map(brandRows.map((b) => [String(b.id), b.account_id]))
  const inAccount = (cid) => accountOf.has(String(cid)) && String(accountOf.get(String(cid))) === String(accountId)

  const stillMember = memberRows.length > 0
  const stillLinked = linkRows.some((l) => inAccount(l.client_id))
  const defaultInAccount = hasDefault && inAccount(prof.client_id)
  if (stillMember || stillLinked || !defaultInAccount) {
    console.warn(`[agency-admin/${ctx.invId}] action=ban_removed account=${accountId} user=${userId} refused member=${stillMember} linked=${stillLinked} default_in_account=${defaultInAccount}`)
    return fail(headers, 'user_not_removed')
  }

  const banError = await banLogin(supabase, userId)
  if (banError) {
    console.error(`[agency-admin/${ctx.invId}] action=ban_removed account=${accountId} user=${userId} ban FAILED again (${errTag(banError)})`)
    return banFailed(headers, ctx, userId, accountId)
  }
  console.log(`[agency-admin/${ctx.invId}] action=ban_removed account=${accountId} user=${userId} banned`)
  return json(200, headers, { ok: true, banned: true, ban_duration: BAN_DURATION, account_id: accountId, user_id: userId })
}

async function actionRemoveMember(supabase, headers, body, ctx) {
  const accountId = parseId(body.account_id)
  const userId = parseUuid(body.user_id)
  if (accountId === null || userId === null) return fail(headers, 'invalid_request')
  return removeAndBan(supabase, headers, ctx, userId, 'account_remove_member', { p_account_id: accountId, p_user_id: userId, p_actor: ctx.actor })
}

async function actionRemoveGuest(supabase, headers, body, ctx) {
  const clientId = parseId(body.client_id)
  const userId = parseUuid(body.user_id)
  if (clientId === null || userId === null) return fail(headers, 'invalid_request')
  return removeAndBan(supabase, headers, ctx, userId, 'account_remove_guest', { p_client_id: clientId, p_user_id: userId, p_actor: ctx.actor })
}

// ── create_staff_login, create_guest_login ──────────────────────────────────

function isRateLimit(err) {
  return !!err && (err.status === 429 || /rate.?limit/i.test(err.message || ''))
}
function isAlreadyRegistered(err) {
  return !!err && (err.code === 'email_exists' || /already.*(regist|exist)/i.test(err.message || ''))
}

/**
 * Create the auth user for a new login, sending nothing. -> { user } or
 * { response }. Rule U of _provision_client.js: a complete listing taken
 * immediately before the call; the user is ours only when its id was absent
 * from it and its created_at is fresh. A user that is not ours is never bound
 * and never deleted; its invite token was just rotated by generateLink, so
 * the Supabase invite is sent to it once, as _provision_client.js does.
 */
async function createLogin(supabase, headers, email, ctx) {
  const before = await loadAuthEmails(supabase)
  if (!before || !before.complete) return { response: fail(headers, 'auth_lookup_incomplete') }
  if (before.set.has(email)) return { response: fail(headers, 'email_registered') }
  const tInv = Date.now()
  let res
  try {
    res = await supabase.auth.admin.generateLink({ type: 'invite', email, options: { redirectTo: REDIRECT_TO } })
  } catch (e) {
    console.error(`[agency-admin/${ctx.invId}] action=${ctx.action} generateLink threw`)
    return { response: fail(headers, 'invite_error') }
  }
  const authErr = res && res.error
  if (authErr) {
    console.error(`[agency-admin/${ctx.invId}] action=${ctx.action} generateLink failed (${errTag(authErr)})`)
    if (isRateLimit(authErr)) return { response: fail(headers, 'email_rate_limited') }
    if (isAlreadyRegistered(authErr)) return { response: fail(headers, 'email_registered') }
    return { response: fail(headers, 'invite_error') }
  }
  const user = res && res.data && res.data.user
  if (!user || !user.id) return { response: fail(headers, 'invite_error') }
  const createdMs = Date.parse(user.created_at || '')
  const ours = !before.ids.has(user.id) && Number.isFinite(createdMs) && createdMs >= tInv - OURS_SKEW_MS
  if (!ours) {
    console.error(`[agency-admin/${ctx.invId}] action=${ctx.action} generateLink returned a user this call did not create; not bound, not deleted`)
    try {
      const r = await supabase.auth.admin.inviteUserByEmail(email, { redirectTo: REDIRECT_TO })
      if (r && r.error) console.error(`[agency-admin/${ctx.invId}] restoring the invite failed (${errTag(r.error)})`)
    } catch (e) {
      console.error(`[agency-admin/${ctx.invId}] restoring the invite threw`)
    }
    return { response: fail(headers, 'email_registered') }
  }
  return { user: { id: user.id, email: typeof user.email === 'string' && user.email ? user.email : email } }
}

/**
 * After a failed SQL step, delete the login this call created, only when it
 * still has no profile (the last part of the ownership test). A profile, or a
 * profile read that fails, keeps it. -> true when deleted.
 */
async function removeCreatedLogin(supabase, userId, ctx) {
  try {
    const { data, error } = await supabase.from('user_profiles').select('id').eq('id', userId).maybeSingle()
    if (error || data) {
      console.error(`[agency-admin/${ctx.invId}] action=${ctx.action} user=${userId} has a profile or it could not be read; kept`)
      return false
    }
  } catch {
    return false
  }
  try {
    const res = await supabase.auth.admin.deleteUser(userId)
    if (res && res.error) {
      console.error(`[agency-admin/${ctx.invId}] action=${ctx.action} user=${userId} cleanup delete failed (${errTag(res.error)})`)
      return false
    }
    return true
  } catch {
    return false
  }
}

/** The invite email, after the SQL step committed. Never throws. */
async function sendInvite(supabase, ctx, user, clientId, clientName) {
  try {
    const d = await deliverInvite(supabase, {
      user, clientId, clientName, role: 'viewer', source: INVITE_SOURCE,
      actor: ctx.actor, delivery: 'email', rotate: false,
    })
    if (d && d.ok) return { sent: true, channel: d.channel }
    console.error(`[agency-admin/${ctx.invId}] action=${ctx.action} user=${user.id} invite not sent (${d ? d.code : 'n/a'})`)
    return { sent: false, code: d ? d.code : 'invite_error', message: 'The login exists but the invite email was not sent. Use Resend in Pending invites.' }
  } catch (e) {
    console.error(`[agency-admin/${ctx.invId}] action=${ctx.action} user=${user.id} invite threw`)
    return { sent: false, code: 'invite_error', message: 'The login exists but the invite email was not sent. Use Resend in Pending invites.' }
  }
}

async function actionCreateStaff(supabase, headers, body, ctx) {
  const accountId = parseId(body.account_id)
  const email = parseEmail(body.email)
  const role = typeof body.role === 'string' && STAFF_ROLES.has(body.role) ? body.role : null
  if (accountId === null || email === null || role === null) return fail(headers, 'invalid_request')
  // Read before anything is created, so a plain mistake creates no auth user.
  // The SQL function checks the same things again under its lock.
  const account = await readAccount(supabase, accountId)
  if (!account) return fail(headers, 'account_not_found')
  if (account.kind !== 'agency' || account.home_client_id === null || account.home_client_id === undefined) return fail(headers, 'account_not_agency')
  const home = await readBrand(supabase, account.home_client_id)

  const created = await createLogin(supabase, headers, email, ctx)
  if (created.response) return created.response
  const user = created.user

  const r = await callRpc(supabase, 'account_create_staff_profile', { p_account_id: accountId, p_user_id: user.id, p_role: role, p_actor: ctx.actor })
  if (r.error) {
    const removed = await removeCreatedLogin(supabase, user.id, ctx)
    return rpcFailure(headers, r.error, ctx, { login_removed: removed })
  }
  const invite = await sendInvite(supabase, ctx, user, account.home_client_id, (home && home.name) || account.name || null)
  console.log(`[agency-admin/${ctx.invId}] action=create_staff_login account=${accountId} user=${user.id} invite=${invite.sent ? 'sent' : 'not_sent'}`)
  return json(200, headers, { ok: true, result: r.data, user_id: user.id, invite })
}

async function actionCreateGuest(supabase, headers, body, ctx) {
  const clientId = parseId(body.client_id)
  const email = parseEmail(body.email)
  if (clientId === null || email === null) return fail(headers, 'invalid_request')
  const brand = await readBrand(supabase, clientId)
  if (!brand) return fail(headers, 'client_not_found')
  const account = brand.account_id === null || brand.account_id === undefined ? null : await readAccount(supabase, brand.account_id)
  if (!account || account.kind !== 'agency') return fail(headers, 'brand_not_in_agency')
  if (String(account.home_client_id) === String(clientId)) return fail(headers, 'brand_is_agency_home')

  const created = await createLogin(supabase, headers, email, ctx)
  if (created.response) return created.response
  const user = created.user

  // Review F4: ONE locked SQL call. account_create_guest_profile re-checks the
  // kind and the home brand under the brand's account lock, inserts the
  // profile (the 4.5 trigger writes the primary member row, no account row),
  // reconciles and logs. The checks above only spare a needless auth user.
  const r = await callRpc(supabase, 'account_create_guest_profile', { p_client_id: clientId, p_user_id: user.id, p_actor: ctx.actor })
  if (r.error) {
    const removed = await removeCreatedLogin(supabase, user.id, ctx)
    return rpcFailure(headers, r.error, ctx, { login_removed: removed })
  }
  const invite = await sendInvite(supabase, ctx, user, clientId, brand.name || null)
  console.log(`[agency-admin/${ctx.invId}] action=create_guest_login client=${clientId} user=${user.id} invite=${invite.sent ? 'sent' : 'not_sent'}`)
  return json(200, headers, { ok: true, result: r.data, user_id: user.id, invite })
}

// ── handler ─────────────────────────────────────────────────────────────────

const HANDLERS = {
  list: actionList,
  convert: actionConvert,
  attach_brand: actionAttach,
  detach_brand: actionDetach,
  create_staff_login: actionCreateStaff,
  add_staff: actionAddStaff,
  create_guest_login: actionCreateGuest,
  remove_member: actionRemoveMember,
  remove_guest: actionRemoveGuest,
  ban_removed: actionBanRemoved,
}

exports.handler = async (event) => {
  const auth = await requireAuth(event, { adminOnly: true })
  if (auth.response) return auth.response
  const headers = auth.headers

  if (event.httpMethod !== 'POST') return json(405, headers, { error: 'Method Not Allowed', code: 'invalid_request' })

  let body
  try { body = JSON.parse(event.body || '') } catch { return fail(headers, 'invalid_request') }
  if (!body || typeof body !== 'object' || Array.isArray(body)) return fail(headers, 'invalid_request')
  const action = body.action
  if (typeof action !== 'string' || !ACTIONS.has(action)) return fail(headers, 'invalid_request')

  const invId = Math.random().toString(36).slice(2, 8).toUpperCase()
  const ctx = { invId, action, actor: auth.user.id }
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)
  try {
    return await HANDLERS[action](supabase, headers, body, ctx)
  } catch (e) {
    if (e && e.readFailed) {
      console.error(`[agency-admin/${invId}] action=${action} ${e.message}`)
      return fail(headers, 'read_failed')
    }
    console.error(`[agency-admin/${invId}] action=${action} threw: ${e && e.message ? e.message : e}`)
    return fail(headers, 'db_error')
  }
}

// Exported for tests/agency_admin.test.js; handler stays the entry point.
exports.BAN_DURATION = BAN_DURATION
exports.parseId = parseId
exports.parseUuid = parseUuid
exports.computeChecks = computeChecks
