/**
 * _provision_client.js: the one provisioning sequence for a new client, shared
 * by the admin Onboard wizard (onboard-client.js) and the Explee lead import
 * (docs/arch/explee-lead-import.md, revision 4, section 5.4).
 *
 * Steps, in the order onboard-client.js has always run them:
 *   1. clients insert (refresh_cadence through refreshCadenceFor, last_refresh_at
 *      stamped at creation)
 *   2. inviteUserByEmail to /reset-password
 *   3. user_profiles insert
 *   3b. (2026-11-13) add_client_locations, only when the request names extra
 *      locations (docs/arch/multi-location-collection.md 5.4); location
 *      validation and the server prompt cap run before step 1
 *   4. prompts insert (one statement)
 *   5. client_events 'onboarded' audit row, last and non-fatal
 * A later failure rolls back the earlier steps.
 *
 * RULE U (closes A-M1 and O-M3, and the same latent defect in the wizard):
 * provisioning never touches what it did not create.
 *   - Check A, before step 1, an early filter: the invitee against every
 *     existing auth user (confirmed, pending or without a profile). A match
 *     returns email_registered and creates nothing. A listing that hit its
 *     page cap, or failed, returns auth_lookup_incomplete and creates nothing.
 *   - Check B (rev 4, V1), after the client insert and its progress write and
 *     IMMEDIATELY before the invite: a fresh paged pass on both paths. A
 *     match or an incomplete pass rolls the client back and sends no invite.
 *   - The user the invite returns is ours only when its id is absent from
 *     Check B, its created_at parses, and created_at >= T_inv - 5 s
 *     (OURS_SKEW_MS). Otherwise the client row is rolled back and
 *     email_registered is returned with inviteSent: the existing user is
 *     never bound to the new client and never deleted. A user_profiles 23505
 *     proves the same (profile proof).
 *
 * Revision 3 additions:
 *   - brand_aliases always starts with the lowercased account name (A1,
 *     aliasesWithName), on BOTH paths; the one intended change to the wizard.
 *   - ctx.onBeforeClient(slug) is awaited before EACH clients insert attempt
 *     (auth I1 / L7); a throw inserts nothing (stage client, db_error).
 *   - the listUsers pass ends only on data.nextPage === null or an empty page.
 *   - a failure after the invite carries userId and inviteSent (C2, C3).
 *
 * Two exports, so the role is never a field the importer can pass:
 * provisionViewerClient always writes 'viewer'; provisionAdminWizardClient is
 * for the admin-gated wizard only.
 */
const { refreshCadenceFor, DEFAULT_CLIENT_CATEGORY } = require('./_cost')
const { slugify } = require('./_explee_rules')
const { validatePair, locationKey } = require('./_locations')

// Multi-location onboarding (docs/arch/multi-location-collection.md 5.4).
// Matches the prompt cap trigger's last fallback (supabase-prompt-cap-bypass-fix-2026-11-09.sql:92-94).
const HARD_PROMPT_CAP_FALLBACK = 5
const PRIMARY_KEY = 'primary'

const APP_URL = 'https://app.getbrandgeo.com'
const REDIRECT_TO = `${APP_URL}/reset-password`
const PAGING = { perPage: 1000, maxPages: 20 }
// rev 4, V1 (Rule U step 2): the user the invite returns is ours only when its
// created_at is not older than T_inv minus this skew (the clock difference
// between the function and GoTrue). Replaces the 10 minute window of rev 3.
const OURS_SKEW_MS = 5000
const SLUG_ATTEMPTS = 5

/**
 * Every auth user's address (lowercased) and id, in one paged pass.
 * -> { set, ids, complete, error? }
 *
 * Paging (rev 3, D8 Rule U step 1): the pass ends, complete, ONLY on the
 * response's own end marker or an empty page. When `data.nextPage` is present
 * in the response (a number or null), the pass ends after the page whose
 * nextPage is null. When it is absent, the pass ends at the first page that
 * returns 0 users. It never ends on users.length < perPage: GoTrue may serve
 * fewer users than asked, and a short page would hide every later user from
 * the pre-check. An error, a throw, or maxPages without the end marker gives
 * complete:false.
 */
async function loadAuthEmails(supabase, paging = PAGING) {
  const set = new Set()
  const ids = new Set()
  for (let page = 1; page <= paging.maxPages; page++) {
    let res
    try {
      res = await supabase.auth.admin.listUsers({ page, perPage: paging.perPage })
    } catch (e) {
      return { set, ids, complete: false, error: 'auth_list_threw' }
    }
    if (!res || res.error) return { set, ids, complete: false, error: 'auth_list_error' }
    const data = res.data || {}
    const users = Array.isArray(data.users) ? data.users : []
    for (const u of users) {
      if (!u) continue
      if (u.id) ids.add(u.id)
      if (typeof u.email === 'string' && u.email.trim()) set.add(u.email.trim().toLowerCase())
    }
    if (Object.prototype.hasOwnProperty.call(data, 'nextPage') && data.nextPage !== undefined) {
      if (data.nextPage === null) return { set, ids, complete: true }
    } else if (users.length === 0) {
      return { set, ids, complete: true }
    }
  }
  return { set, ids, complete: false, error: 'page_cap' }
}

/**
 * Aliases rule (rev 3, A1), both paths. Brand detection reads only
 * clients.brand_aliases and the bare brand_website, never clients.name, so the
 * account name always leads the list: n = name trimmed and lowercased; when n
 * is not empty, [n, ...rest] where rest is the given list in its order with
 * every entry equal to n (after trim and lowercase) removed. Nothing else in
 * the list changes. An empty n leaves the list as given.
 */
function aliasesWithName(name, aliases) {
  const list = Array.isArray(aliases) ? aliases : (aliases === undefined || aliases === null ? [] : aliases)
  const n = typeof name === 'string' ? name.trim().toLowerCase() : ''
  if (!n || !Array.isArray(list)) return aliases
  const rest = list.filter((a) => !(typeof a === 'string' && a.trim().toLowerCase() === n))
  return [n, ...rest]
}

function isRateLimit(err) {
  return !!err && (err.status === 429 || /rate.?limit/i.test(err.message || ''))
}

function isAlreadyRegistered(err) {
  return !!err && /already.*(regist|exist)/i.test(err.message || '')
}

// rev 4, V1 (profile proof): a unique violation on user_profiles means a
// profile for that user already exists, so the user was not made by this call.
function isUniqueViolation(err) {
  return !!err && (err.code === '23505' || /duplicate key/i.test(err.message || ''))
}

/**
 * planLocations(input) -> { ok: true, primary, extras, prompts } | { ok: false, code, message }
 *
 * Pure. All location validation of section 5.4, run BEFORE the clients insert
 * so nothing is refused after the invite has gone out:
 *   1. the primary (default_market_id, default_region_id; null market reads
 *      as WW and null or '' region as ALL, exactly as the database's
 *      ensure_primary_client_location does) and every extra pair through
 *      validatePair: invalid_location.
 *   2. extras expanded to pairs, a pair equal to the primary or seen before
 *      dropped, first-seen order kept (S7). 'ALL' mixed with specific regions
 *      inside one entry: invalid_location.
 *   3. every location_keys entry is 'primary' or a 'MARKET:REGION' key of the
 *      deduplicated set or of the primary (the primary's own key maps to
 *      'primary'); anything else: invalid_location.
 * prompts: [{ text, keys: string[] }], one row per distinct key. A string
 * prompt, or an object without location_keys (or with an empty list), is one
 * row on the primary. Blank texts are dropped, as before.
 */
function planLocations(input) {
  const bad = (message) => ({ ok: false, code: 'invalid_location', message })
  const pm = input.default_market_id === undefined || input.default_market_id === null || input.default_market_id === '' ? 'WW' : input.default_market_id
  const pr = input.default_region_id === undefined || input.default_region_id === null || input.default_region_id === '' ? 'ALL' : input.default_region_id
  const pv = validatePair(pm, pr)
  if (!pv.ok) return bad('the primary location is not in the market list')
  const primary = { market_id: pv.market_id, region_id: pv.region_id }
  const primaryKey = locationKey(primary.market_id, primary.region_id)

  const extras = []
  const seen = new Set([primaryKey])
  if (input.locations !== undefined && input.locations !== null) {
    if (!Array.isArray(input.locations)) return bad('locations must be a list')
    for (const entry of input.locations) {
      if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return bad('a location entry is not an object')
      const ids = entry.region_ids
      if (!Array.isArray(ids) || ids.length === 0 || !ids.every((r) => typeof r === 'string' && r.length > 0)) return bad('region_ids must be a non-empty list')
      if (ids.includes('ALL') && ids.some((r) => r !== 'ALL')) return bad('All regions cannot be combined with specific regions')
      for (const r of ids) {
        const v = validatePair(entry.market_id, r)
        if (!v.ok) return bad('a location is not in the market list')
        const key = locationKey(v.market_id, v.region_id)
        if (seen.has(key)) continue
        seen.add(key)
        extras.push({ market_id: v.market_id, region_id: v.region_id })
      }
    }
  }

  const prompts = []
  if (Array.isArray(input.prompts)) {
    for (const p of input.prompts) {
      const text = typeof p === 'string' ? p : (p && typeof p === 'object' ? p.text : undefined)
      if (typeof text !== 'string' || text.trim().length === 0) continue
      let keys = [PRIMARY_KEY]
      if (p && typeof p === 'object' && p.location_keys !== undefined && p.location_keys !== null) {
        if (!Array.isArray(p.location_keys)) return bad('location_keys must be a list')
        if (p.location_keys.length > 0) {
          const out = []
          for (const k of p.location_keys) {
            if (typeof k !== 'string') return bad('a location key is not a string')
            const norm = k === PRIMARY_KEY || k === primaryKey ? PRIMARY_KEY : k
            if (norm !== PRIMARY_KEY && !seen.has(norm)) return bad(`unknown location key ${k}`)
            if (!out.includes(norm)) out.push(norm)
          }
          keys = out
        }
      }
      prompts.push({ text: text.trim(), keys })
    }
  }
  return { ok: true, primary, extras, prompts }
}

function countPromptRows(plan) {
  return plan.prompts.reduce((n, p) => n + p.keys.length, 0)
}

/**
 * The prompt rows, in request order. A row for the primary carries NO
 * location_id key at all (the database trigger fills the primary), so a call
 * with no extra locations sends exactly the row shape it always did.
 */
function promptRowsFor(clientId, plan, idByKey) {
  const rows = []
  for (const p of plan.prompts) {
    for (const k of p.keys) {
      const row = { client_id: clientId, text: p.text, category: 'general', is_active: true, position: rows.length + 1 }
      if (k !== PRIMARY_KEY) row.location_id = idByKey.get(k)
      rows.push(row)
    }
  }
  return rows
}

/**
 * The cap for the plan: plan_prompt_caps for the plan, else the 'free' row,
 * else 5, the same order as the prompt cap trigger.
 */
async function promptCapFor(supabase, plan) {
  const want = plan || 'free'
  const { data, error } = await supabase.from('plan_prompt_caps').select('plan, prompt_cap').in('plan', [want, 'free'])
  if (error) return { ok: false, error: error.message }
  const rows = data || []
  const own = rows.find((r) => r.plan === want)
  const free = rows.find((r) => r.plan === 'free')
  const usable = (r) => !!r && r.prompt_cap !== null && r.prompt_cap !== undefined && Number.isFinite(Number(r.prompt_cap))
  const cap = usable(own) ? Number(own.prompt_cap)
    : usable(free) ? Number(free.prompt_cap)
    : HARD_PROMPT_CAP_FALLBACK
  return { ok: true, cap }
}

async function provision(supabase, input, ctx, role) {
  const now = ctx.now
  const contact = String(input.contact_email || '').trim()
  const contactKey = contact.toLowerCase()
  const fail = (stage, code, message, ids) => Object.assign({ ok: false, stage, code, message: String(message || code) }, ids || {})

  // ── Locations and prompt mapping (2026-11-13), pure, before anything ─────
  // Every refusal here and at the cap check below happens BEFORE the clients
  // insert, so no invite has gone out (docs/arch/multi-location-collection.md 5.4).
  const locPlan = planLocations(input)
  if (!locPlan.ok) return fail('validate', locPlan.code, locPlan.message)

  // ── Rule U step 1, Check A: an early filter only (rev 4) ─────────────────
  // The importer passes its once-per-run snapshot; the wizard loads per call.
  // Check A never decides whether a user is "ours"; Check B does that below.
  const auth = ctx.authEmails || await loadAuthEmails(supabase)
  if (!auth || !auth.complete) return fail('precheck', 'auth_lookup_incomplete', 'auth user listing incomplete')
  if (auth.set.has(contactKey)) return fail('precheck', 'email_registered', 'an auth user already exists for this address')

  // ── Server prompt cap (2026-11-13, S8), before the clients insert ────────
  // A string prompt is one row, an object prompt one row per distinct key.
  // Over the cap is refused unless the admin wizard sent allow_over_cap: true
  // (owner question 4, default), which is then recorded in the audit meta.
  // This is the one place that default lives.
  const promptRowCount = countPromptRows(locPlan)
  let overCap = null
  if (promptRowCount > 0) {
    const capRes = await promptCapFor(supabase, input.plan)
    if (!capRes.ok) {
      console.error(`[provision] prompt cap read failed: ${capRes.error}`)
      return fail('validate', 'db_error', 'the prompt cap could not be read')
    }
    if (promptRowCount > capRes.cap) {
      if (input.allow_over_cap !== true) {
        return fail('validate', 'prompt_cap_exceeded', `${promptRowCount} prompts requested, the ${input.plan || 'free'} plan allows ${capRes.cap}`)
      }
      overCap = { prompt_cap: capRes.cap, prompts_requested: promptRowCount }
    }
  }

  const refreshCadence = refreshCadenceFor(input.plan, DEFAULT_CLIENT_CATEGORY)

  // ── 1. client row ────────────────────────────────────────────────────────
  const explicitSlug = typeof input.slug === 'string' && input.slug !== ''
  const baseSlug = explicitSlug ? input.slug : slugify(String(input.brand_website || input.name || '').split('.')[0])
  const random = ctx.random || Math.random
  const brandAliases = aliasesWithName(input.name, input.brand_aliases)
  let client = null
  let lastErr = null
  for (let attempt = 0; attempt < (explicitSlug ? 1 : SLUG_ATTEMPTS); attempt++) {
    let slug = baseSlug
    if (attempt > 0) {
      let suffix = ''
      for (let i = 0; i < 4; i++) suffix += 'abcdefghijklmnopqrstuvwxyz0123456789'[Math.floor(random() * 36) % 36]
      slug = `${baseSlug.slice(0, 35)}-${suffix}`
    }
    // Rule U step 4 (rev 3, auth I1 / L7): the caller records the slug BEFORE
    // each insert attempt, so a run killed between the insert and the progress
    // write can find its orphan by exact slug. A failing hook inserts nothing.
    if (ctx.onBeforeClient) {
      try { await ctx.onBeforeClient(slug) } catch (e) {
        return fail('client', 'db_error', 'pending slug write failed')
      }
    }
    const row = {
      name: input.name, slug,
      brand_website: input.brand_website, brand_aliases: brandAliases, known_competitors: input.known_competitors,
      plan: input.plan,
      refresh_cadence: refreshCadence,
      last_refresh_at: now().toISOString(),
      default_market_id: input.default_market_id || null,
      default_region_id: input.default_region_id || null,
    }
    if (input.onboarding_complete !== undefined) row.onboarding_complete = input.onboarding_complete
    const { data, error } = await supabase.from('clients').insert(row).select().single()
    if (!error && data) { client = data; break }
    lastErr = error || { message: 'client insert returned no row' }
    const slugClash = lastErr.code === '23505' || /slug/i.test(lastErr.message || '')
    if (!slugClash) return fail('client', 'db_error', lastErr.message)
  }
  if (!client) return fail('client', 'slug_taken', (lastErr && lastErr.message) || 'slug taken')

  const deleteClient = async () => {
    try {
      const { error } = await supabase.from('clients').delete().eq('id', client.id)
      return !error
    } catch { return false }
  }

  if (ctx.onStep) {
    try { await ctx.onStep('client', { clientId: client.id }) } catch (e) {
      const rolled = await deleteClient()
      if (!rolled) return fail('client', 'rollback_failed', 'progress write failed', { clientId: client.id })
      return fail('client', 'db_error', 'progress write failed')
    }
  }

  // ── Rule U step 1, Check B (rev 4, V1, both paths) ───────────────────────
  // A fresh, complete paged pass immediately before the invite (never
  // ctx.authEmails, never a cached set). No other awaited call sits between
  // the end of this pass and inviteUserByEmail.
  const authB = await loadAuthEmails(supabase)
  if (!authB || !authB.complete) {
    if (!(await deleteClient())) return fail('precheck', 'rollback_failed', 'auth user listing incomplete', { clientId: client.id })
    return fail('precheck', 'auth_lookup_incomplete', 'auth user listing incomplete')
  }
  if (authB.set.has(contactKey)) {
    if (!(await deleteClient())) return fail('precheck', 'rollback_failed', 'an auth user already exists for this address', { clientId: client.id })
    return fail('precheck', 'email_registered', 'an auth user already exists for this address')
  }

  // ── 2. invite ────────────────────────────────────────────────────────────
  const tInv = now().getTime()
  const { data: authData, error: authErr } = await supabase.auth.admin.inviteUserByEmail(contact, { redirectTo: REDIRECT_TO })
  if (authErr) {
    const rolled = await deleteClient()
    if (!rolled) return fail('invite', 'rollback_failed', authErr.message, { clientId: client.id })
    if (isRateLimit(authErr)) return fail('invite', 'email_rate_limited', authErr.message)
    if (isAlreadyRegistered(authErr)) return fail('invite', 'email_registered', authErr.message)
    return fail('invite', 'invite_error', authErr.message)
  }
  const user = authData && authData.user
  if (!user || !user.id) {
    const rolled = await deleteClient()
    if (!rolled) return fail('invite', 'rollback_failed', 'invite returned no user', { clientId: client.id })
    return fail('invite', 'invite_error', 'invite returned no user')
  }
  // Rule U step 2 (rev 4, V1): the returned user is OURS only when its id was
  // not in Check B, its created_at parses, and created_at >= T_inv - 5 s. A
  // missing created_at is NOT ours. A user that is not ours is never bound and
  // never deleted; only the client this call inserted is removed. An invite
  // email went out to that address (GoTrue's re-send), hence inviteSent.
  const createdMs = Date.parse(user.created_at || '')
  const ours = !authB.ids.has(user.id) && Number.isFinite(createdMs) && createdMs >= tInv - OURS_SKEW_MS
  if (!ours) {
    console.error(`[provision] invite for client ${client.id} returned a user this call did not create; not bound, not deleted`)
    const rolled = await deleteClient()
    if (!rolled) return fail('invite', 'rollback_failed', 'pre-existing user returned', { clientId: client.id, inviteSent: true })
    return fail('invite', 'email_registered', 'an auth user already exists for this address', { inviteSent: true })
  }

  const rollbackUserAndClient = async (stage, message, withProfile) => {
    let okAll = true
    if (withProfile) {
      try { const { error } = await supabase.from('user_profiles').delete().eq('id', user.id); if (error) okAll = false } catch { okAll = false }
    }
    try { const res = await supabase.auth.admin.deleteUser(user.id); if (res && res.error) okAll = false } catch { okAll = false }
    if (!(await deleteClient())) okAll = false
    if (!okAll) return fail(stage, 'rollback_failed', message, { clientId: client.id, userId: user.id, inviteSent: true })
    // rev 3, C2 and C3: a failure after the invite carries the userId of the
    // (now deleted) user, so the importer knows an invite email went out.
    return fail(stage, 'db_error', message, { userId: user.id, inviteSent: true })
  }

  if (ctx.onStep) {
    try { await ctx.onStep('invite', { userId: user.id }) } catch (e) {
      return rollbackUserAndClient('invite', 'progress write failed', false)
    }
  }

  // ── 3. profile ───────────────────────────────────────────────────────────
  const { error: profileErr } = await supabase
    .from('user_profiles')
    .insert({ id: user.id, client_id: client.id, role })
  if (profileErr && isUniqueViolation(profileErr)) {
    // rev 4, V1, profile proof: a profile for this user already exists, so
    // the user is not ours. Neither the user nor that profile is touched;
    // only the client this call inserted is deleted.
    console.error(`[provision] profile for client ${client.id} already existed; the user is not ours, not deleted`)
    if (!(await deleteClient())) return fail('profile', 'rollback_failed', profileErr.message, { clientId: client.id, inviteSent: true })
    return fail('profile', 'email_registered', 'an auth user already exists for this address', { inviteSent: true })
  }
  if (profileErr) return rollbackUserAndClient('profile', profileErr.message, false)

  // ── 3b. extra locations (2026-11-13) ─────────────────────────────────────
  // Only when the deduplicated set is not empty: one add_client_locations call
  // with p_limit null (the admin wizard; the location limit is a packaging
  // rule, the prompt cap above is the spend bound). It also creates the
  // primary row from the clients defaults. No extra location (every Explee
  // call, every string-only call): no RPC at all, and the prompt rows below
  // keep their old shape. The client delete in the rollback cascades
  // client_locations.
  const idByKey = new Map()
  if (locPlan.extras.length > 0) {
    let addRes
    try {
      addRes = await supabase.rpc('add_client_locations', {
        p_client_id: client.id,
        p_pairs: locPlan.extras,
        p_limit: null,
        p_created_by: ctx.actor || null,
      })
    } catch (e) {
      addRes = { data: null, error: { message: (e && e.message) || 'add_client_locations threw' } }
    }
    if (addRes.error) return rollbackUserAndClient('locations', addRes.error.message, true)
    for (const r of addRes.data || []) idByKey.set(locationKey(r.market_id, r.region_id), Number(r.id))
    const missing = locPlan.extras.filter((x) => !idByKey.has(locationKey(x.market_id, x.region_id)))
    if (missing.length > 0) return rollbackUserAndClient('locations', 'not every extra location was created', true)
  }

  // ── 4. prompts ───────────────────────────────────────────────────────────
  let promptsCreated = 0
  const promptRows = promptRowsFor(client.id, locPlan, idByKey)
  if (promptRows.length > 0) {
    const { error: promptsErr } = await supabase.from('prompts').insert(promptRows)
    if (promptsErr) return rollbackUserAndClient('prompts', promptsErr.message, true)
    promptsCreated = promptRows.length
  }

  // ── 5. audit row, last and non-fatal ─────────────────────────────────────
  let auditLogged = false
  try {
    const { error: eventErr } = await supabase.from('client_events').insert({
      client_id: client.id,
      actor:     ctx.actor || null,
      type:      'onboarded',
      from_plan: null,
      to_plan:   input.plan,
      meta: Object.assign({
        source:            ctx.source,
        slug:              client.slug ?? input.slug,
        role,
      }, ctx.meta || {}, {
        prompts_created:   promptsCreated,
        refresh_cadence:   refreshCadence,
        default_market_id: input.default_market_id || null,
      },
      // Added 2026-11-13, only when they apply, so a call with no extra
      // location and no cap override writes the same meta as before.
      locPlan.extras.length > 0 ? { locations_created: locPlan.extras.length, locations: locPlan.extras } : {},
      overCap ? { allow_over_cap: true, prompt_cap: overCap.prompt_cap, prompts_requested: overCap.prompts_requested } : {}),
    })
    if (eventErr) console.error(`[${ctx.source}] audit row failed for client ${client.id}: ${eventErr.message}`)
    else auditLogged = true
  } catch (e) {
    console.error(`[${ctx.source}] audit row threw for client ${client.id}: ${e.message}`)
  }

  return {
    ok: true,
    client: Object.assign({}, client, { refresh_cadence: client.refresh_cadence ?? refreshCadence }),
    userId: user.id,
    role,
    promptsCreated,
    locationsCreated: locPlan.extras.length,
    auditLogged,
    refreshCadence,
  }
}

function provisionViewerClient(supabase, input, ctx) {
  return provision(supabase, input, ctx, 'viewer')
}

function provisionAdminWizardClient(supabase, input, ctx) {
  const role = input && input.role === 'admin' ? 'admin' : 'viewer'
  return provision(supabase, input, ctx, role)
}

module.exports = { provisionViewerClient, provisionAdminWizardClient, loadAuthEmails, aliasesWithName, planLocations, REDIRECT_TO, PAGING, OURS_SKEW_MS, HARD_PROMPT_CAP_FALLBACK }
