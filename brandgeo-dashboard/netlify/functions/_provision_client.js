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

function promptRowsFor(clientId, prompts) {
  return Array.isArray(prompts)
    ? prompts
        .map((t) => (typeof t === 'string' ? t : t && t.text))
        .filter((t) => typeof t === 'string' && t.trim().length > 0)
        .map((text, idx) => ({
          client_id: clientId,
          text: text.trim(),
          category: 'general',
          is_active: true,
          position: idx + 1,
        }))
    : []
}

async function provision(supabase, input, ctx, role) {
  const now = ctx.now
  const contact = String(input.contact_email || '').trim()
  const contactKey = contact.toLowerCase()
  const fail = (stage, code, message, ids) => Object.assign({ ok: false, stage, code, message: String(message || code) }, ids || {})

  // ── Rule U step 1, Check A: an early filter only (rev 4) ─────────────────
  // The importer passes its once-per-run snapshot; the wizard loads per call.
  // Check A never decides whether a user is "ours"; Check B does that below.
  const auth = ctx.authEmails || await loadAuthEmails(supabase)
  if (!auth || !auth.complete) return fail('precheck', 'auth_lookup_incomplete', 'auth user listing incomplete')
  if (auth.set.has(contactKey)) return fail('precheck', 'email_registered', 'an auth user already exists for this address')

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

  // ── 4. prompts ───────────────────────────────────────────────────────────
  let promptsCreated = 0
  const promptRows = promptRowsFor(client.id, input.prompts)
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
      }),
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

module.exports = { provisionViewerClient, provisionAdminWizardClient, loadAuthEmails, aliasesWithName, REDIRECT_TO, PAGING, OURS_SKEW_MS }
