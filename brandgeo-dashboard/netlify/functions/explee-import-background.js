/**
 * explee-import-background.js: replied Explee leads become set-up Free
 * accounts (docs/arch/explee-lead-import.md, revision 4, binding).
 *
 * Run hourly at :35 by Supabase pg_cron over pg_net with X-Cron-Key (the cron
 * job is commented out in db/supabase-explee-lead-import-2026-11-11.sql until
 * D13 step 7). Background function: the platform answers 202 to every caller,
 * so a run is judged by its job_runs row, never by the HTTP answer.
 *
 * Run loop (D1): gate, purge, settings, key and projects, pause, the WHOLE
 * inbox listing of each listed project (paged on has_more / next_offset, no
 * cursor), seen rows, hidden rows (two complete absences 50 minutes apart plus
 * a thread read), work queue from the table, reconcile (once per UTC day,
 * BEFORE the decide loop), decide and act, retry passes, summary (live only).
 *
 * Safety (D8): mode off | dry_run (default) | live. A dry run writes only
 * explee_leads, explee_import_settings and job_runs, builds an Explee client
 * that has no POST calls, and sends no notification and no email, ever (F5).
 * Rule F: a create is decided only from the listing and the thread read in the
 * same run. Rule U: provisioning never touches an auth user it did not create
 * (_provision_client.js). Caps C1 to C4: every provisioning call counts, every
 * call that reached the invite stays in the daily window, a post-invite
 * failure is final, the first provision_error stops creation. One injected
 * clock governs every timestamp and the 5, 11 and 13 minute guards. The
 * handler never throws.
 *
 * Reply text is hostile input: it never reaches the prompt generator or a log
 * line; only a masked 280-character excerpt is stored, and only for rows a
 * human must judge. The follow-up quotes no measured figure (A2).
 */
const crypto = require('crypto')
const { requireCronAuth } = require('./_cron_auth')
const { withObservability } = require('./_observability')
const R = require('./_explee_rules')
const { createExpleeClient } = require('./_explee_client')
const { provisionViewerClient, loadAuthEmails } = require('./_provision_client')
const { COUNTRY_NAMES } = require('./_enqueue')

const JOB = 'explee-import'
const MODES = new Set(['off', 'dry_run', 'live'])
const MIN = 60 * 1000
const HOUR = 60 * MIN
const DAY = 24 * HOUR
const RECLAIM_MS = 20 * MIN
// rev 3, M3: code constants, not settings (changing them needs a review).
const GUARD_CALL_MS = 13 * MIN        // no new outbound call or retry iteration
const GUARD_LEAD_MS = 11 * MIN        // no new lead claimed
const GUARD_RECONCILE_MS = 5 * MIN    // no new reconcile read
const HIDDEN_CONFIRM_MS = 50 * MIN    // rev 3, M2: second complete absence
const RETENTION_MS = 30 * DAY
const MAX_ATTEMPTS = 3
const SUMMARY_HOUR_UTC = 7
const HUMAN_JUDGE = new Set(['unknown_intent', 'auto_reply_no_referral', 'replied_by_other', 'would_create'])
const PAGE_SIZE = 200
// rev 4, V2: D5 duplicate 2 lives in _explee_rules.js as the pure suppresses()
// (adds half_made and any row whose invite_sent_at is set).

const SETTINGS_DEFAULTS = {
  project_ids: [], include_intents: ['hot_lead'], referral_intents: ['out_of_office', 'email_changed'],
  exclude_intents: ['not_interested', 'unsubscribe'], unknown_label_policy: 'hold',
  max_creates_per_run: 5, max_creates_per_day: 30, max_referrals_per_run: 1, max_threads_per_run: 100,
  max_inbox_pages: 50, max_dry_payloads_per_run: 5, max_reconcile_per_day: 100,
  note_enabled: true, follow_up_enabled: false, follow_up_body: null, follow_up_delay_min: 60,
  follow_up_max_age_hours: 72, max_follow_ups_per_run: 5,
  own_sender_domains: R.OWN_SENDER_DEFAULTS.slice(),
  paused_until: null, last_summary_date: null, last_reconcile_date: null, last_dry_reconcile_date: null, last_me_at: null,
}

// ── small helpers ──────────────────────────────────────────────────────────

function isoOrNull(v) {
  if (v === null || v === undefined || v === '') return null
  const t = Date.parse(v)
  return Number.isFinite(t) ? new Date(t).toISOString() : null
}
function ms(v) { const t = Date.parse(v || ''); return Number.isFinite(t) ? t : null }
function newer(a, b) { const x = ms(a); const y = ms(b); return x !== null && (y === null || x > y) }
function posInt(v) { const n = Number(v); return Number.isInteger(n) && n > 0 && n <= 2147483647 ? n : null }
function bump(obj, key, by = 1) { obj[key] = (obj[key] || 0) + by }
function errCode(e) { return String((e && e.code) || 'error').replace(/[^a-z0-9_]/gi, '_').slice(0, 60) }
function safeLabel(s) { return String(s || '').toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 64) || '(none)' }

class StopRun extends Error {
  constructor(stage, code) { super(code); this.stage = stage; this.code = code }
}

function normaliseSettings(raw) {
  const s = Object.assign({}, SETTINGS_DEFAULTS, raw || {})
  s.project_ids = (Array.isArray(s.project_ids) ? s.project_ids : []).map(posInt).filter(Boolean)
  for (const k of ['include_intents', 'referral_intents', 'exclude_intents']) if (!Array.isArray(s[k])) s[k] = []
  if (!Array.isArray(s.own_sender_domains)) s.own_sender_domains = R.OWN_SENDER_DEFAULTS.slice()
  s.unknown_label_policy = s.unknown_label_policy === 'include' ? 'include' : 'hold'
  return s
}

async function loadSettings(supabase) {
  try {
    const { data, error } = await supabase.from('explee_import_settings').select('*').eq('id', true).maybeSingle()
    if (error || !data) return null
    return data
  } catch { return null }
}

function initDetail(invId) {
  return {
    invId, mode: 'off', projectsVisible: [], projectsMissing: [], listing: {}, queued: 0,
    createsAttempted: 0,
    decided: { would_create: 0, created: 0, skipped: 0, failed: 0 }, reasons: {}, unknownIntents: {},
    dryPayloads: 0, createsToday: 0, referralsThisRun: 0, breaker: false,
    purged: { excerpts: 0, payloads: 0, emails: 0 }, reconciled: 0,
    followUps: { sent: 0, skipped: 0, failed: 0, expired: 0, gaveUp: 0, label: 0 }, notes: { written: 0, failed: 0 },
    workerTriggered: false, elapsedMs: 0,
  }
}

// ── time guard (rev 3, M3) ─────────────────────────────────────────────────

function elapsed(run) { return run.now().getTime() - run.startedMs }
function canCall(run) { return elapsed(run) < GUARD_CALL_MS }
function truncate(run, stage) {
  if (!run.detail.truncated) run.detail.truncated = []
  if (!run.detail.truncated.includes(stage)) run.detail.truncated.push(stage)
}
function stopCreation(run, why) {
  run.stopCreating = true
  if (!run.detail.stopCreating) run.detail.stopCreating = why
}

// ── default dependencies (production) ──────────────────────────────────────

function defaultDeps() {
  const { createClient } = require('@supabase/supabase-js')
  const auth = require('./_auth')
  const enq = require('./_enqueue')
  const pp = require('./_prospect_prompts')
  const notify = require('./_admin_notify')
  return {
    supabase: createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY),
    now: () => new Date(),
    getKey: () => process.env.EXPLEE_API_KEY,
    makeExplee: ({ write }) => createExpleeClient({ write }),
    markets: () => require('../../src/lib/markets.ts').MARKETS,
    fetchHomepage: (domain) => pp.fetchHomepageSignalAbortable(domain),
    generatePrompts: (domain, opts) => pp.generateClientPrompts(domain, opts),
    checkCollectionLimits: auth.checkCollectionLimits,
    enqueueClientCollection: enq.enqueueClientCollection,
    triggerWorker: enq.triggerWorker,
    notify: (supabase, evt) => notify.recordAdminEvent(supabase, evt),
    provision: provisionViewerClient,
    loadAuthEmails,
    random: Math.random,
    uuid: () => crypto.randomUUID(),
    invId: Math.random().toString(36).slice(2, 8).toUpperCase(),
  }
}

// ── the run ────────────────────────────────────────────────────────────────

/**
 * runImport(deps, { requestedMode }) -> { ok, detail }
 * Never throws. Writes exactly one job_runs row.
 */
async function runImport(deps, { requestedMode = null } = {}) {
  const sb = deps.supabase
  const now = deps.now
  const startedMs = now().getTime()
  const detail = initDetail(deps.invId || 'run')
  const run = { ok: true, deps, sb, now, detail, startedMs, requestedMode, threadsUsed: 0, mode: 'off' }
  try {
    await body(run, requestedMode)
  } catch (e) {
    run.ok = false
    if (e instanceof StopRun) { detail.stage = e.stage; detail.error = e.code }
    else if (e && e.code === 'insufficient_credits') { detail.stage = 'explee'; detail.error = 'insufficient_credits' }
    else {
      detail.error = 'unhandled'
      console.error(`[explee-import/${detail.invId}] unhandled: ${e && e.name ? e.name : 'Error'}`)
    }
  }
  detail.elapsedMs = Math.max(0, now().getTime() - startedMs)
  try {
    const { error } = await sb.from('job_runs').insert({ job: JOB, ok: run.ok, detail })
    if (error) console.error(`[explee-import/${detail.invId}] job_runs write failed: ${error.message}`)
  } catch (e) {
    console.error(`[explee-import/${detail.invId}] job_runs write threw`)
  }
  return { ok: run.ok, detail }
}

async function body(run, requestedMode) {
  const { deps, sb, detail } = run
  const nowIso = () => run.now().toISOString()

  // 2. purge, every mode
  detail.purged = await purge(run)

  // 3. settings
  const raw = await loadSettings(sb)
  let mode = raw && MODES.has(raw.mode) ? raw.mode : 'off'
  if (mode === 'live' && requestedMode === 'dry_run') mode = 'dry_run'
  detail.mode = mode
  run.mode = mode
  if (mode === 'off') { detail.skipped = 'off'; return }
  const settings = normaliseSettings(raw)
  run.settings = settings
  run.hash = R.rulesHash(settings)

  // 4. key and projects
  if (!deps.getKey()) throw new StopRun('config', 'missing_key')
  const reader = deps.makeExplee({ write: mode === 'live' })
  run.explee = reader
  let projects
  try {
    projects = await reader.listProjects()
  } catch (e) {
    if (e && e.code === 'insufficient_credits') throw e
    throw new StopRun('explee', errCode(e))
  }
  detail.projectsVisible = projects
    .map((p) => ({ id: posInt(p && p.id), name: p && typeof p.name === 'string' ? p.name.slice(0, 120) : null, domain: p && typeof p.domain === 'string' ? p.domain.slice(0, 253) : null }))
    .filter((p) => p.id)
  if (!settings.project_ids.length) { detail.skipped = 'no_projects'; return }
  const visible = new Set(detail.projectsVisible.map((p) => p.id))
  const listed = settings.project_ids.filter((id) => visible.has(id))
  detail.projectsMissing = settings.project_ids.filter((id) => !visible.has(id))
  // rev 3, L5: none of the listed projects is visible to the key.
  if (!listed.length) throw new StopRun('explee', 'projects_missing')

  // 5. pause
  if (settings.paused_until && ms(settings.paused_until) > run.now().getTime()) { detail.skipped = 'paused'; return }

  // once a day: /me
  if ((!settings.last_me_at || run.now().getTime() - (ms(settings.last_me_at) || 0) >= DAY) && canCall(run)) {
    try {
      detail.me = await reader.getMe()
      await sb.from('explee_import_settings').update({ last_me_at: nowIso() }).eq('id', true)
    } catch (e) {
      if (e && e.code === 'insufficient_credits') throw e
    }
  }

  // 6. listing, sequential, whole, paged on has_more / next_offset (M2)
  const listing = new Map()   // person_id -> { item, projectId }
  const complete = new Map()  // projectId -> boolean
  let readable = 0
  for (const projectId of listed) {
    const r = await readListing(run, reader, projectId, settings.max_inbox_pages)
    let candidates = 0
    for (const [pid, item] of r.items) {
      listing.set(pid, { item, projectId })
      if (R.isCandidate(item)) candidates++
    }
    complete.set(projectId, r.complete)
    if (r.pages > 0) readable++
    detail.listing[String(projectId)] = { pages: r.pages, items: r.items.size, candidates, complete: r.complete, skeletons: r.skeletons, absentFirst: 0, hiddenConfirmed: 0, absentCleared: 0 }
  }
  if (listed.length && readable === 0) throw new StopRun('explee', 'listing_unreadable')
  run.listing = listing
  run.complete = complete

  // 7. seen rows
  let rows = await loadRows(sb, listed)
  for (const [pid, { item, projectId }] of listing) {
    const row = rows.get(pid)
    if (!row) {
      if (!R.isCandidate(item)) continue
      const { error } = await sb.from('explee_leads').insert({
        person_id: pid, project_id: projectId, campaign_id: posInt(item.campaign_id),
        state: 'seen', final: false, intents_seen: [], attempts: 0,
        collection_attempts: 0, note_attempts: 0, follow_up_attempts: 0, first_seen_at: nowIso(),
        intent: R.normaliseIntent(item.latest_intent),
        lead_status: typeof item.lead_status === 'string' ? item.lead_status.slice(0, 64) : null,
        replied_at: isoOrNull(item.latest_reply_at),
        listing_seen_at: nowIso(), absent_since: null, updated_at: nowIso(),
      })
      if (error && error.code !== '23505') console.error(`[explee-import/${detail.invId}] seen insert failed for ${pid}: ${error.code || 'error'}`)
      continue
    }
    if (row.final) continue
    if (row.state === 'processing') {
      if (row.absent_since) await sb.from('explee_leads').update({ absent_since: null, listing_seen_at: nowIso() }).eq('person_id', pid).eq('state', 'processing')
      continue
    }
    await sb.from('explee_leads').update({
      intent: R.normaliseIntent(item.latest_intent),
      lead_status: typeof item.lead_status === 'string' ? item.lead_status.slice(0, 64) : null,
      replied_at: isoOrNull(item.latest_reply_at),
      listing_seen_at: nowIso(), absent_since: null, updated_at: nowIso(),
    }).eq('person_id', pid).eq('state', row.state)
  }
  rows = await loadRows(sb, listed)

  // 8. hidden (M2, ops I7): only from a complete listing, after two complete
  // absences at least 50 minutes apart, confirmed by one thread read.
  run.absentCreated = []
  for (const row of rows.values()) {
    if (!complete.get(row.project_id) || listing.has(row.person_id)) continue
    if (row.decision === 'created') { run.absentCreated.push(row.person_id); continue }
    if (row.final || row.decision === 'creating' || row.state === 'processing') continue
    const stats = detail.listing[String(row.project_id)]
    if (!row.absent_since) {
      const { data } = await sb.from('explee_leads').update({ absent_since: nowIso(), updated_at: nowIso() })
        .eq('person_id', row.person_id).eq('state', row.state).select('person_id')
      if (data && data.length && stats) stats.absentFirst++
      continue
    }
    if (run.now().getTime() - (ms(row.absent_since) || 0) < HIDDEN_CONFIRM_MS) continue
    if (!canCall(run)) { truncate(run, 'hidden'); break }
    if (run.threadsUsed >= settings.max_threads_per_run) break
    const patch = await confirmAbsence(run, row)
    if (patch.clear) {
      // rev 4, N4: the thread holds a message newer than absent_since, so the
      // conversation is active: clear absent_since, keep the row non-final.
      const { data } = await sb.from('explee_leads').update({ absent_since: null, updated_at: nowIso() })
        .eq('person_id', row.person_id).eq('state', row.state).select('person_id')
      if (data && data.length && stats) stats.absentCleared++
      continue
    }
    const { data } = await sb.from('explee_leads').update(Object.assign(patch, {
      state: 'decided', final: true, decided_at: nowIso(), updated_at: nowIso(), claim_token: null, attempts: 0,
    })).eq('person_id', row.person_id).eq('state', row.state).select('person_id')
    if (data && data.length) {
      detail.decided.skipped++
      bump(detail.reasons, patch.reason)
      if (stats) stats.hiddenConfirmed++
    }
  }

  // 9. work queue
  const nowMs = run.now().getTime()
  const queue = []
  // A dry-run would_create row that only lacks its payload is backfilled AFTER
  // the real work and at most max_dry_payloads_per_run of them, so payload
  // backfill can never starve unrowed or re-decided leads.
  const backfill = []
  for (const row of rows.values()) {
    const entry = listing.get(row.person_id)
    if (!entry || !complete.get(row.project_id) || row.final) continue
    if (!R.PERSON_ID_RE.test(row.person_id)) continue
    const item = entry.item
    let take = false
    if (row.state === 'seen') take = true
    else if (row.state === 'processing') {
      take = (ms(row.claimed_at) || 0) < nowMs - RECLAIM_MS
      // F5: a half-made reservation is the live run's to judge (it may raise
      // an emailed event), never a dry run's.
      if (take && mode !== 'live' && row.decision === 'creating') take = false
    } else if (row.state === 'decided') {
      take = row.decision === 'failed'
        || (row.decision === 'would_create' && mode === 'live')
        || newer(item.latest_reply_at, row.decided_reply_at)
        || row.rules_hash !== run.hash
      if (!take && row.decision === 'would_create' && mode === 'dry_run' && !row.would_payload) {
        backfill.push({ row, item })
        continue
      }
    }
    if (take) queue.push({ row, item })
  }
  const oldestFirst = (a, b) => {
    const x = ms(a.item.latest_reply_at); const y = ms(b.item.latest_reply_at)
    if (x !== y) { if (x === null) return 1; if (y === null) return -1; return x - y }
    return a.row.person_id < b.row.person_id ? -1 : 1
  }
  queue.sort(oldestFirst)
  backfill.sort(oldestFirst)
  const ordered = queue.concat(backfill.slice(0, settings.max_dry_payloads_per_run))

  // 10. reconcile, once per UTC day, BEFORE the decide loop (M3)
  await maybeReconcile(run)

  // the thread budget also covers the reads of steps 8 and 10
  const work = ordered.slice(0, Math.max(0, settings.max_threads_per_run - run.threadsUsed))
  detail.queued = work.length

  // per-run state
  run.stopCreating = false
  run.createsThisRun = 0
  run.referralsThisRun = 0
  run.dryPayloads = 0
  run.workerNeeded = false
  run.handled = new Set()
  run.markets = typeof deps.markets === 'function' ? deps.markets() : (deps.markets || [])
  if (work.length) {
    const clientsRes = await sb.from('clients').select('id, brand_website')
    run.clients = (clientsRes.data || []).map((c) => ({ id: c.id, domain: R.normalizeDomain(c.brand_website) })).filter((c) => c.domain)
    run.authEmails = await deps.loadAuthEmails(sb)
    if (!run.authEmails || !run.authEmails.complete) {
      if (mode === 'live') { run.ok = false; detail.stage = 'auth_users'; detail.error = 'auth_lookup_incomplete'; stopCreation(run, 'provision_error') }
      else detail.authUsersIncomplete = true
    }
  }

  // 11. decide and act
  for (const { row, item } of work) {
    if (elapsed(run) >= GUARD_LEAD_MS) { detail.wallClockStop = true; truncate(run, 'decide'); break }
    await processRow(run, row, item)
  }

  // 12. retry passes, live only, each under the time guard
  if (mode === 'live') {
    await retryCollections(run)
    await retryNotes(run)
    await followUps(run)
    if (run.workerNeeded && canCall(run)) {
      try { await deps.triggerWorker(); detail.workerTriggered = true } catch { detail.workerTriggered = false }
    }
  }
  detail.createsToday = await dailyWindowCount(run)
  detail.referralsThisRun = run.referralsThisRun
  detail.dryPayloads = run.dryPayloads

  // 13. summary, once per UTC day, live only (F5)
  await maybeSummary(run)
}

/**
 * D1 step 6 (M2): the next offset is next_offset when it advances, else
 * offset + items.length. has_more === false ends the listing; with has_more
 * absent, only an empty page ends it. A short page is never the end by
 * itself. An item without a valid person_id is a skeleton (ops I7): counted,
 * never mapped.
 */
async function readListing(run, reader, projectId, maxPages) {
  const items = new Map()
  let pages = 0
  let skeletons = 0
  let offset = 0
  const incomplete = () => ({ items, pages, complete: false, skeletons })
  while (pages < maxPages) {
    if (!canCall(run)) { truncate(run, `listing:${projectId}`); return incomplete() }
    let page
    try {
      page = await reader.listInbox(projectId, { limit: PAGE_SIZE, offset })
    } catch (e) {
      if (e && e.code === 'insufficient_credits') throw e
      return incomplete()
    }
    pages++
    const contacts = Array.isArray(page && page.contacts) ? page.contacts : []
    for (const c of contacts) {
      if (!c) continue
      const pid = c.person_id
      if (pid === null || pid === undefined || !R.PERSON_ID_RE.test(String(pid))) { skeletons++; continue }
      items.set(String(pid), c)
    }
    if (page.hasMore === false) return { items, pages, complete: true, skeletons }
    if (page.hasMore !== true && contacts.length === 0) return { items, pages, complete: true, skeletons }
    const next = Number.isInteger(page.nextOffset) && page.nextOffset > offset ? page.nextOffset : offset + contacts.length
    if (next <= offset) return incomplete()   // does not advance
    offset = next
  }
  return incomplete()   // max_inbox_pages reached
}

async function loadRows(sb, projectIds) {
  const map = new Map()
  if (!projectIds.length) return map
  const { data, error } = await sb.from('explee_leads').select('*').in('project_id', projectIds)
  if (error) throw new StopRun('settings', 'leads_unreadable')
  for (const r of data || []) map.set(r.person_id, r)
  return map
}

/**
 * The thread read that confirms a second complete absence (D1 step 8).
 * -> a patch with decision skipped and reason erased | declined | hidden, or
 * { clear: true } when the thread holds a message newer than absent_since
 * (rev 4, N4). Order: erased, declined, newer message, hidden.
 * The suppression hash is always kept (D2, ops I7).
 */
async function confirmAbsence(run, row) {
  let thread = null
  if (posInt(row.campaign_id)) {
    run.threadsUsed++
    try { thread = await run.explee.getThread(row.campaign_id, row.person_id) } catch (e) {
      if (e && e.code === 'insufficient_credits') throw e
      thread = null
    }
  }
  if (thread && typeof thread === 'object') {
    if (!Array.isArray(thread.messages)) thread.messages = []
    if (thread.erased || (thread.lead && thread.lead.erased)) {
      return Object.assign({ decision: 'skipped', reason: 'erased' }, erasurePatch(run, row))
    }
    const exclude = R.settingsSets(run.settings).exclude
    const declined = thread.reply_blocked_reason === 'unsubscribe'
      || Array.from(R.threadIntents({}, thread)).some((l) => R.isDeclineLabel(l, exclude))
    if (declined) {
      return { decision: 'skipped', reason: 'declined', email: null, reply_excerpt: null, would_payload: null, email_sha256: row.email_sha256 ?? null }
    }
    // rev 4, N4: a message of any type whose ts is later than absent_since
    // means the conversation is active. Checked after erased and declined.
    const since = ms(row.absent_since)
    if (since !== null && thread.messages.some((m) => { const t = ms(m && m.ts); return t !== null && t > since })) {
      return { clear: true }
    }
  }
  return { decision: 'skipped', reason: 'hidden', email: null, reply_excerpt: null, would_payload: null, email_sha256: row.email_sha256 ?? null }
}

// ── purge (D2 retention) ───────────────────────────────────────────────────

async function purge(run) {
  const out = { excerpts: 0, payloads: 0, emails: 0 }
  const cutoff = new Date(run.now().getTime() - RETENTION_MS).toISOString()
  let data
  try {
    const res = await run.sb.from('explee_leads').select('person_id, decision, final, email, reply_excerpt, would_payload').lt('decided_at', cutoff)
    if (res.error) return out
    data = res.data || []
  } catch { return out }
  for (const r of data) {
    const patch = {}
    if (r.reply_excerpt !== null && r.reply_excerpt !== undefined) { patch.reply_excerpt = null; out.excerpts++ }
    if (r.would_payload !== null && r.would_payload !== undefined) { patch.would_payload = null; out.payloads++ }
    if (r.email && (r.decision === 'would_create' || (r.decision === 'failed' && r.final))) { patch.email = null; out.emails++ }
    if (Object.keys(patch).length) {
      patch.updated_at = run.now().toISOString()
      await run.sb.from('explee_leads').update(patch).eq('person_id', r.person_id)
    }
  }
  return out
}

// ── one row ────────────────────────────────────────────────────────────────

async function claim(run, row) {
  const token = run.deps.uuid()
  const iso = run.now().toISOString()
  let q = run.sb.from('explee_leads')
    .update({ state: 'processing', claim_token: token, claimed_at: iso, updated_at: iso })
    .eq('person_id', row.person_id).eq('state', row.state).eq('attempts', row.attempts || 0)
  q = row.claimed_at ? q.eq('claimed_at', row.claimed_at) : q.is('claimed_at', null)
  const { data, error } = await q.select('person_id')
  if (error || !data || data.length !== 1) return null
  return token
}

/**
 * Writes the decided row. ops I1: any decision that is not `failed` resets
 * attempts to 0 (a failure patch carries its own attempts, see failure()).
 */
async function finish(run, pid, token, patch) {
  const iso = run.now().toISOString()
  const full = Object.assign({}, patch, { state: 'decided', claim_token: null, updated_at: iso })
  if (full.decision !== 'failed' && full.attempts === undefined) full.attempts = 0
  const { data, error } = await run.sb.from('explee_leads')
    .update(full)
    .eq('person_id', pid).eq('claim_token', token).select('person_id')
  if (error) {
    console.error(`[explee-import/${run.detail.invId}] row write failed for ${pid}: ${error.code || 'error'}`)
    return false
  }
  return !!(data && data.length)
}

/**
 * ops I1: attempts counts CONSECUTIVE failures of the SAME reason. The same
 * reason as the stored failed row raises it by one; anything else starts at
 * one. rev 4, N3: attempts_total rises by one on every failed write except
 * email_rate_limited (the breaker is not the lead's fault), never lowered by
 * code. Final when forced (C3), at 3 consecutive, or at 10 in total.
 */
function failure(row, reason, { final = false } = {}) {
  const same = !!row && row.decision === 'failed' && row.reason === reason
  const attempts = Math.min(10, same ? (Number(row.attempts) || 0) + 1 : 1)
  const prevTotal = Number(row && row.attempts_total) || 0
  const attemptsTotal = Math.min(R.MAX_TOTAL_ATTEMPTS, reason === 'email_rate_limited' ? prevTotal : prevTotal + 1)
  return { decision: 'failed', reason, attempts, attempts_total: attemptsTotal, final: R.isFinalFailure({ attempts, attempts_total: attemptsTotal, forced: final }) }
}

/** Put the row back exactly as it was before the claim (leaves claimed_at and attempts). */
async function release(run, prev, token) {
  const restore = {
    state: prev.state === 'processing' ? (prev.decision ? 'decided' : 'seen') : prev.state,
    decision: prev.decision ?? null, reason: prev.reason ?? null, final: !!prev.final,
    email: prev.email ?? null, email_sha256: prev.email_sha256 ?? null, brand_domain: prev.brand_domain ?? null,
    email_domain: prev.email_domain ?? null, reserved_at: prev.reserved_at ?? null, invitee_source: prev.invitee_source ?? null,
    client_id: prev.client_id ?? null, user_id: prev.user_id ?? null, pending_slug: prev.pending_slug ?? null,
    claim_token: null, updated_at: run.now().toISOString(),
  }
  await run.sb.from('explee_leads').update(restore).eq('person_id', prev.person_id).eq('claim_token', token)
}

function count(run, decision, reason, label) {
  run.detail.decided[decision] = (run.detail.decided[decision] || 0) + 1
  if (reason) bump(run.detail.reasons, reason)
  if (label !== undefined) bump(run.detail.unknownIntents, safeLabel(label))
}

function erasurePatch(run, row) {
  return {
    email: null, email_domain: null, company_name: null, country: null, reply_excerpt: null, would_payload: null,
    erased_at: run.now().toISOString(), email_sha256: row.email_sha256 ?? null,
  }
}

async function processRow(run, rowIn, item) {
  const { sb, settings } = run
  let row = rowIn
  const pid = row.person_id
  const token = await claim(run, row)
  if (!token) return
  run.handled.add(pid)
  const nowIso = run.now().toISOString()

  // Rule U steps 3 and 4: a reclaimed creating row is never provisioned again.
  if (row.state === 'processing' && row.decision === 'creating') {
    if (row.client_id || row.user_id) {
      const done = row.client_id && row.user_id && await stepsPresent(sb, row.client_id, row.user_id)
      if (done) {
        await finish(run, pid, token, { decision: 'created', reason: null, final: true, created_at_account: nowIso, decided_at: nowIso, would_payload: null, pending_slug: null })
        count(run, 'created')
      } else {
        await finish(run, pid, token, Object.assign(failure(row, 'half_made', { final: true }), { decided_at: nowIso }))
        count(run, 'failed', 'half_made')
        await notify(run, orphanEvent(pid, row.client_id || null, row.user_id || null, 'A provisioning was interrupted.'))
      }
      return
    }
    // auth I1 / L7: the client insert may have landed before the progress
    // write. The exact pending_slug finds it; nothing made by anyone else can
    // match an exact slug.
    if (row.pending_slug) {
      let orphan = null
      try {
        const res = await sb.from('clients').select('id, slug, brand_website').eq('slug', row.pending_slug)
        if (res.error) {
          await release(run, row, token)
          return
        }
        orphan = (res.data || [])[0] || null
        // The slug is exact, but it may have belonged to another client BEFORE
        // this run tried it (an insert that would have failed 23505, killed in
        // between). Our insert would have carried brand_website = the reserved
        // brand_domain, so a client on another website is not our orphan and
        // is never named in an orphan event.
        if (orphan && R.normalizeDomain(orphan.brand_website) !== R.normalizeDomain(row.brand_domain)) orphan = null
      } catch {
        await release(run, row, token)
        return
      }
      if (orphan) {
        await finish(run, pid, token, Object.assign(failure(row, 'half_made', { final: true }), { decided_at: nowIso, client_id: orphan.id }))
        count(run, 'failed', 'half_made')
        await notify(run, orphanEvent(pid, orphan.id, null, 'A provisioning was interrupted after the client row was written.'))
        return
      }
    }
    const reset = { decision: null, reason: null, email_sha256: null, reserved_at: null, brand_domain: null, email_domain: null, email: null, pending_slug: null }
    await sb.from('explee_leads').update(reset).eq('person_id', pid).eq('claim_token', token)
    row = Object.assign({}, row, reset, { state: 'seen' })
  } else if (row.state === 'processing') {
    row = Object.assign({}, row, { state: row.decision ? 'decided' : 'seen' })
  }

  const common = {
    campaign_id: posInt(item.campaign_id) || row.campaign_id || null,
    lead_status: typeof item.lead_status === 'string' ? item.lead_status.slice(0, 64) : null,
    replied_at: isoOrNull(item.latest_reply_at),
    decided_reply_at: isoOrNull(item.latest_reply_at),
    rules_hash: run.hash,
    decided_at: nowIso,
  }

  // Erased on the listing: no thread read needed.
  if (item.erased) {
    await finish(run, pid, token, Object.assign({}, common, erasurePatch(run, row), { decision: 'skipped', reason: 'erased', final: true }))
    count(run, 'skipped', 'erased')
    return
  }

  if (!common.campaign_id) {
    await finish(run, pid, token, Object.assign({}, common, failure(row, 'explee_error')))
    count(run, 'failed', 'explee_error')
    return
  }

  if (!canCall(run) || run.threadsUsed >= settings.max_threads_per_run) {
    truncate(run, 'decide')
    await release(run, row, token)
    return
  }
  let thread
  run.threadsUsed++
  try {
    thread = await run.explee.getThread(common.campaign_id, pid)
    if (!thread || typeof thread !== 'object') throw Object.assign(new Error('bad_thread'), { code: 'bad_thread' })
  } catch (e) {
    if (e && e.code === 'insufficient_credits') { await release(run, row, token); throw e }
    await finish(run, pid, token, Object.assign({}, common, failure(row, 'explee_error')))
    count(run, 'failed', 'explee_error')
    return
  }
  if (!Array.isArray(thread.messages)) thread.messages = []

  const decision = R.qualifyLead({ item, thread }, settings)
  common.intent = decision.intent || null
  common.intents_seen = Array.from(R.threadIntents(item, thread)).map(safeLabel).slice(0, 20)
  const latest = R.latestReply(thread)
  const latestBody = latest && typeof latest.body_text === 'string' ? latest.body_text : ''

  if (decision.action === 'skip') {
    const patch = Object.assign({}, common, {
      decision: 'skipped', reason: decision.reason, final: !!decision.final,
      email: null, email_sha256: null, would_payload: null, reserved_at: null,
      reply_excerpt: HUMAN_JUDGE.has(decision.reason) ? R.excerpt(latestBody, null) : null,
    })
    if (decision.reason === 'erased') Object.assign(patch, erasurePatch(run, row))
    await finish(run, pid, token, patch)
    count(run, 'skipped', decision.reason, decision.reason === 'unknown_intent' ? decision.label : undefined)
    return
  }

  // ── create ───────────────────────────────────────────────────────────────
  const invitee = String(decision.invitee).toLowerCase()
  const profile = thread.lead || {}
  const brandDomain = R.brandDomainFor(profile.company_domain, invitee)
  const skipFinal = async (reason) => {
    await finish(run, pid, token, Object.assign({}, common, {
      decision: 'skipped', reason, final: true, email: null, email_sha256: null, would_payload: null, reply_excerpt: null, reserved_at: null,
      brand_domain: brandDomain || null, email_domain: R.emailDomainOf(invitee),
    }))
    count(run, 'skipped', reason)
  }
  if (!brandDomain) return skipFinal('no_company_domain')
  const emailDomain = R.emailDomainOf(invitee)
  const dupEmailDomain = emailDomain && !R.isExcludedDomain(emailDomain) ? emailDomain : null
  const sha = R.emailSha256(invitee)
  const dup = await duplicateOf(run, pid, invitee, sha, brandDomain, dupEmailDomain)
  if (dup) return skipFinal(dup)

  const market = R.resolveMarket(profile.country, run.markets)
  const company = R.cleanCompanyName(profile.company_name)
  const base = Object.assign({}, common, {
    invitee_source: decision.inviteeSource, brand_domain: brandDomain, email_domain: emailDomain,
    company_name: company, country: market.country, market_id: market.marketId, region_id: market.regionId,
  })

  if (run.mode === 'dry_run') {
    const current = row.decision === 'would_create' && row.would_payload && row.would_payload.rulesHash === run.hash
      && isoOrNull(row.decided_reply_at) === common.decided_reply_at && row.email_sha256 === sha
    const patch = Object.assign({}, base, {
      decision: 'would_create', reason: null, final: false, email: invitee, email_sha256: sha,
      reply_excerpt: R.excerpt(latestBody, decision.inviteeSource === 'referral' ? invitee : null),
    })
    if (!current) {
      // M3: the payload's homepage read and OpenAI calls are outbound calls;
      // none starts at or after 13 minutes. The payload waits for a later run.
      if (!canCall(run)) {
        truncate(run, 'decide')
        patch.would_payload = null
      } else if (run.dryPayloads < settings.max_dry_payloads_per_run) {
        run.dryPayloads++
        patch.would_payload = await buildPayload(run, { invitee, source: decision.inviteeSource, brandDomain, emailDomain, company, market })
      } else {
        patch.would_payload = null
      }
    }
    await finish(run, pid, token, patch)
    count(run, 'would_create')
    return
  }

  // live
  await createLive(run, row, token, { invitee, sha, decision, brandDomain, emailDomain: dupEmailDomain, storedEmailDomain: emailDomain, company, market, base })
}

function orphanEvent(pid, clientId, userId, lead) {
  return {
    type: 'explee_orphan', client_id: clientId, title: 'Explee import: half-made account',
    body: `${lead} Client ${clientId || 'none'}, auth user ${userId || 'none'}, Explee person ${pid}. Delete what is left by hand.`,
    meta: { person_id: pid, client_id: clientId, user_id: userId }, email: true,
  }
}

async function stepsPresent(sb, clientId, userId) {
  try {
    const p = await sb.from('user_profiles').select('id').eq('id', userId).eq('client_id', clientId)
    const q = await sb.from('prompts').select('id').eq('client_id', clientId)
    return !p.error && !q.error && (p.data || []).length === 1 && (q.data || []).length > 0
  } catch { return false }
}

/** D5 duplicates, in order. -> reason | null */
async function duplicateOf(run, pid, invitee, sha, brandDomain, emailDomain) {
  const sb = run.sb
  // 1. an auth user exists for the address (Check A snapshot, an early filter)
  if (run.authEmails && run.authEmails.set && run.authEmails.set.has(invitee)) return 'already_customer'
  // 2. same address reserved, created, erased, undone, invited (invite_sent_at),
  // or final erased, hidden, provision_error or half_made (rev 4, V2)
  const bySha = await sb.from('explee_leads').select('person_id, decision, reason, final, erased_at, undone_at, invite_sent_at').eq('email_sha256', sha)
  for (const r of bySha.data || []) {
    if (r.person_id === pid) continue
    if (R.suppresses(r)) return 'already_customer'
  }
  // 3. a client already monitors the domain
  const domains = [brandDomain, emailDomain].filter(Boolean)
  for (const c of run.clients || []) {
    if (domains.some((d) => R.domainsMatch(d, c.domain))) return 'already_customer'
  }
  // 4. another lead of the same company is reserved or created (rev 4, V3:
  // the same companyConflict as the F3 re-check, both rows' brand_domain and
  // email_domain, excluded domains dropped on both sides)
  const others = await sb.from('explee_leads').select('person_id, brand_domain, email_domain').in('decision', ['creating', 'created'])
  for (const r of others.data || []) {
    if (r.person_id === pid) continue
    if (R.companyConflict(domains, [r.brand_domain, r.email_domain])) return 'company_has_account'
  }
  return null
}

/**
 * D8 reservation step 2 (F3): duplicate checks 2 and 4 again, read AFTER this
 * row's reservation committed, against every OTHER creating or created row.
 * Any match (or an unreadable table) releases this row. rev 4, V3: duplicate
 * 4 is the same companyConflict as in duplicateOf, so a lead released here is
 * decided by the next sequential run and never loops.
 */
async function conflictAfterReservation(run, pid, sha, domains) {
  const res = await run.sb.from('explee_leads').select('person_id, email_sha256, brand_domain, email_domain').in('decision', ['creating', 'created'])
  if (res.error) return true
  for (const r of res.data || []) {
    if (r.person_id === pid) continue
    if (r.email_sha256 && r.email_sha256 === sha) return true
    if (R.companyConflict(domains, [r.brand_domain, r.email_domain])) return true
  }
  return false
}

/**
 * C2 (rev 4, V2): the daily count is the number of rows where (decision is
 * creating AND reserved_at is in the last 24 h) OR invite_sent_at is in the
 * last 24 h, whatever the row's decision or reason. invite_sent_at is never
 * cleared by code, so a half_made, a post-invite provision_error and a
 * "not ours" already_customer all stay in the window.
 */
async function dailyWindowCount(run) {
  const since = new Date(run.now().getTime() - DAY).toISOString()
  try {
    const a = await run.sb.from('explee_leads').select('person_id, decision').gte('reserved_at', since).eq('decision', 'creating')
    const b = await run.sb.from('explee_leads').select('person_id').gte('invite_sent_at', since)
    if (a.error || b.error) return null
    const ids = new Set()
    for (const r of (a.data || []).concat(b.data || [])) ids.add(r.person_id)
    return ids.size
  } catch { return null }
}

function maskedFor(email) { return email ? R.maskEmail(email) : '***' }

/**
 * rev 4, N1: `canCall` (a synchronous closure) is evaluated before EACH
 * generator attempt; when false no attempt is started and the result carries
 * `guard: true` (the caller releases the row, no failure is written).
 */
async function generateValidated(run, { brandDomain, company, market, homepage, canCall: canStart }) {
  const countryName = market.marketId && market.marketId !== 'WW' ? (COUNTRY_NAMES[market.marketId] || null) : null
  const rejections = {}
  let lastError = 'prompt_gen_error'
  let lowConfidence = !(homepage && homepage.signal)
  for (let attempt = 0; attempt < 2; attempt++) {
    if (canStart && !canStart()) {
      const brand = R.deriveBrand({ brandDomain, companyName: company, llmBrandName: null, ogSiteName: homepage && homepage.ogSiteName })
      return { ok: false, guard: true, error: null, prompts: [], brand, lowConfidence, rejections }
    }
    let gen
    try {
      gen = await run.deps.generatePrompts(brandDomain, { count: R.FREE_PROMPT_COUNT, countryName, companyName: company, homepage })
    } catch { gen = { error: 'threw' } }
    if (!gen || gen.error || !Array.isArray(gen.prompts)) { lastError = 'prompt_gen_error'; continue }
    lowConfidence = !!gen.lowConfidence
    const brand = R.deriveBrand({ brandDomain, companyName: company, llmBrandName: gen.brandName || null, ogSiteName: homepage && homepage.ogSiteName })
    const terms = [...brand.aliases, brand.brandName, brandDomain.split('.')[0], company].filter(Boolean)
    const v = R.validatePrompts(gen.prompts, { brandTerms: terms, count: R.FREE_PROMPT_COUNT })
    for (const r of v.rejected) bump(rejections, r.rule)
    if (v.ok) return { ok: true, prompts: v.prompts, brand, lowConfidence, rejections }
    lastError = 'prompts_invalid'
  }
  const brand = R.deriveBrand({ brandDomain, companyName: company, llmBrandName: null, ogSiteName: homepage && homepage.ogSiteName })
  return { ok: false, error: lastError, prompts: [], brand, lowConfidence, rejections }
}

async function fetchHomepage(run, domain) {
  try { return await run.deps.fetchHomepage(domain) } catch { return null }
}

/** rev 4, N1: null when the 13 minute guard stops the homepage read or a generation attempt (no payload this run). */
async function buildPayload(run, { invitee, source, brandDomain, emailDomain, company, market }) {
  if (!canCall(run)) { truncate(run, 'decide'); return null }
  const homepage = await fetchHomepage(run, brandDomain)
  const g = await generateValidated(run, { brandDomain, company, market, homepage, canCall: () => canCall(run) })
  if (g.guard) { truncate(run, 'decide'); return null }
  return {
    computedAt: run.now().toISOString(),
    rulesHash: run.hash,
    inviteeMasked: R.maskEmail(invitee),
    inviteeSource: source,
    brandName: g.brand.brandName,
    website: g.brand.website,
    emailDomain: emailDomain || null,
    domainsDiffer: !!emailDomain && emailDomain !== brandDomain,
    aliases: g.brand.aliases,
    marketId: market.marketId,
    regionId: market.regionId,
    country: market.country,
    countryConflict: R.countryConflict(brandDomain, market.marketId),
    prompts: g.ok ? g.prompts : [],
    promptRejections: g.rejections,
    lowConfidence: !!g.lowConfidence,
    error: g.ok ? null : g.error,
  }
}

function settingsAllowCreate(run, fresh) {
  if (!fresh) return 'mode'
  if (fresh.mode !== 'live' || run.requestedMode === 'dry_run') return 'mode'
  if (fresh.paused_until && ms(fresh.paused_until) > run.now().getTime()) return 'paused'
  return null
}

async function createLive(run, row, token, ctx) {
  const { deps, sb, settings, detail } = run
  const pid = row.person_id
  const { invitee, sha, decision, brandDomain, emailDomain, storedEmailDomain, company, market, base } = ctx
  const isReferral = decision.inviteeSource === 'referral'

  if (run.stopCreating) return release(run, row, token)
  // M3: a lead claimed just before 11 minutes whose thread read was slow must
  // not start the homepage read, the OpenAI calls or the provisioning at or
  // after 13 minutes. Released before the reservation: no side effect.
  if (!canCall(run)) { truncate(run, 'decide'); return release(run, row, token) }
  if (run.createsThisRun >= settings.max_creates_per_run) { stopCreation(run, 'cap'); return release(run, row, token) }
  if (isReferral && run.referralsThisRun >= settings.max_referrals_per_run) return release(run, row, token)

  // A-S2: an early read, so a switched-off run spends no OpenAI call.
  const early = settingsAllowCreate(run, await loadSettings(sb))
  if (early) {
    stopCreation(run, early)
    detail.stoppedBySettings = true
    return release(run, row, token)
  }

  // Identity reservation, before any side effect.
  const iso = run.now().toISOString()
  const reserve = await sb.from('explee_leads').update(Object.assign({}, base, {
    email_domain: storedEmailDomain,
    decision: 'creating', reason: null, final: false, email: invitee, email_sha256: sha, reserved_at: iso,
    client_id: null, user_id: null, pending_slug: null, updated_at: iso,
  })).eq('person_id', pid).eq('state', 'processing').eq('claim_token', token).select('person_id')
  if (reserve.error) {
    if (reserve.error.code === '23505') bump(detail, 'reservationConflicts')
    return release(run, row, token)
  }
  if (!reserve.data || reserve.data.length !== 1) return

  // Reservation step 1 (C2): the daily window, this row included.
  const inWindow = await dailyWindowCount(run)
  if (inWindow === null || inWindow > settings.max_creates_per_day) {
    stopCreation(run, 'day_cap')
    detail.dailyCapReached = true
    return release(run, row, token)
  }

  // Reservation step 2 (F3): the row that sees a conflict always releases.
  if (await conflictAfterReservation(run, pid, sha, [brandDomain, emailDomain].filter(Boolean))) {
    bump(detail, 'reservationRechecks')
    return release(run, row, token)
  }

  // rev 4, N1: the guard released exactly as the F4 re-check releases: back to
  // the previous decision, reservation cleared, no counter raised, no failure.
  const guardRelease = () => {
    truncate(run, 'decide')
    stopCreation(run, 'guard')
    return release(run, row, token)
  }

  // Prompts before any write outside our own table. N1 (a): no homepage read
  // is started at or after 13 minutes.
  if (!canCall(run)) return guardRelease()
  const homepage = await fetchHomepage(run, brandDomain)
  // N1 (b): each generator attempt is checked inside generateValidated.
  const g = await generateValidated(run, { brandDomain, company, market, homepage, canCall: () => canCall(run) })
  if (g.guard) return guardRelease()
  if (!g.ok) {
    await finish(run, pid, token, Object.assign({}, base, failure(row, g.error), {
      email_domain: storedEmailDomain,
      email: invitee, email_sha256: null, reserved_at: null, would_payload: null, reply_excerpt: null,
    }))
    count(run, 'failed', g.error)
    return
  }

  // rev 4, V2: invite_sent_at is written in the same UPDATE as user_id.
  let inviteStamped = false
  const onStep = async (step, ids) => {
    const patch = step === 'client' ? { client_id: ids.clientId } : { user_id: ids.userId, invite_sent_at: run.now().toISOString() }
    const { data, error } = await sb.from('explee_leads').update(patch).eq('person_id', pid).eq('claim_token', token).select('person_id')
    if (error || !data || data.length !== 1) throw new Error('progress_write_failed')
    if (step === 'invite') inviteStamped = true
  }
  // Rule U step 4 (auth I1 / L7): the slug goes on the lead row before each
  // clients insert attempt.
  const onBeforeClient = async (slug) => {
    const { data, error } = await sb.from('explee_leads').update({ pending_slug: slug }).eq('person_id', pid).eq('claim_token', token).select('person_id')
    if (error || !data || data.length !== 1) throw new Error('pending_slug_write_failed')
  }

  // F4: re-read mode and pause IMMEDIATELY before the provisioning call, with
  // no other awaited call in between.
  const late = settingsAllowCreate(run, await loadSettings(sb))
  if (late) {
    stopCreation(run, late)
    detail.stoppedBySettings = true
    return release(run, row, token)
  }
  // rev 4, N1 (c): after the settings re-read and BEFORE the C1 counters, so
  // no awaited call sits between this check and the provisioning call.
  if (!canCall(run)) return guardRelease()
  // C1: every provisioning call uses one place of the per-run and referral
  // caps, counted BEFORE the call, whatever it returns.
  run.createsThisRun++
  detail.createsAttempted++
  if (isReferral) run.referralsThisRun++
  const result = await deps.provision(sb, {
    name: g.brand.brandName,
    brand_website: brandDomain,
    brand_aliases: g.brand.aliases,
    known_competitors: [],
    plan: 'free',
    default_market_id: market.marketId,
    default_region_id: market.regionId,
    contact_email: invitee,
    prompts: g.prompts,
    onboarding_complete: true,
  }, {
    actor: null,
    source: 'explee-import',
    meta: { explee_person_id: pid },
    now: run.now,
    random: deps.random,
    authEmails: run.authEmails,
    onBeforeClient,
    onStep,
  })

  const nowIso = run.now().toISOString()
  if (result.ok) {
    await finish(run, pid, token, Object.assign({}, base, {
      email_domain: storedEmailDomain,
      decision: 'created', reason: null, final: true, created_at_account: nowIso,
      client_id: result.client.id, user_id: result.userId, email: invitee, email_sha256: sha,
      would_payload: null, reply_excerpt: null, pending_slug: null,
    }))
    count(run, 'created')
    if (run.authEmails && run.authEmails.set) run.authEmails.set.add(invitee)
    await notify(run, { type: 'explee_account_created', client_id: result.client.id, title: 'Explee import: Free account created', body: `Client ${result.client.id} was set up from Explee person ${pid}.`, meta: { person_id: pid, invitee_source: decision.inviteeSource }, email: false })
    await firstCollection(run, pid, result.client.id, 0)
    await writeNote(run, { person_id: pid, campaign_id: base.campaign_id, email: invitee, client_id: result.client.id, invitee_source: decision.inviteeSource, note_attempts: 0, erased_at: null, undone_at: null })
    return
  }

  // rev 4, V2 (C2 (ii)): any result that carries userId or inviteSent stamps
  // invite_sent_at when onStep('invite') did not already write it.
  const inviteWent = !!(result.userId || result.inviteSent)
  const inviteStamp = inviteWent && !inviteStamped && !row.invite_sent_at ? { invite_sent_at: nowIso } : {}
  const cleared = { client_id: null, user_id: null, email_sha256: null, reserved_at: null, email_domain: storedEmailDomain }
  if (result.code === 'email_registered' && result.inviteSent) {
    // rev 4, V1 (C4): the invite went to a login this call did not create
    // (Check B missed it, or the profile proof). Never bound, never deleted.
    // Recorded as a suppression record that stays in the daily window, and
    // creation stops for the run (bounds a clock-skew misjudgement to one).
    if (run.authEmails && run.authEmails.set) run.authEmails.set.add(invitee)
    await finish(run, pid, token, Object.assign({}, base, inviteStamp, {
      email_domain: storedEmailDomain,
      decision: 'skipped', reason: 'already_customer', final: true,
      email_sha256: sha, reserved_at: iso, client_id: null, user_id: null, pending_slug: null, email: null, reply_excerpt: null,
    }))
    count(run, 'skipped', 'already_customer')
    bump(detail, 'notOurs')
    stopCreation(run, 'not_ours')
    return
  }
  if (result.code === 'email_registered') {
    if (run.authEmails && run.authEmails.set) run.authEmails.set.add(invitee)
    await finish(run, pid, token, Object.assign({}, base, cleared, { decision: 'skipped', reason: 'already_customer', final: true, email: null, reply_excerpt: null }))
    count(run, 'skipped', 'already_customer')
    return
  }
  if (result.code === 'auth_lookup_incomplete') {
    stopCreation(run, 'provision_error')
    run.ok = false
    detail.stage = 'auth_users'
    detail.error = 'auth_lookup_incomplete'
    return release(run, row, token)
  }
  if (result.code === 'email_rate_limited') {
    // Not the lead's fault: never final, attempts kept below the CHECK cap.
    const f = failure(row, 'email_rate_limited')
    await finish(run, pid, token, Object.assign({}, base, cleared, f, { final: false, attempts: Math.min(f.attempts, 9), email: invitee }))
    count(run, 'failed', 'email_rate_limited')
    stopCreation(run, 'breaker')
    detail.breaker = true
    await sb.from('explee_import_settings').update({ paused_until: new Date(run.now().getTime() + HOUR).toISOString() }).eq('id', true)
    return
  }
  if (result.code === 'rollback_failed') {
    await finish(run, pid, token, Object.assign({}, base, inviteStamp, failure(row, 'half_made', { final: true }), {
      email_domain: storedEmailDomain,
      email: invitee, email_sha256: sha, reserved_at: iso,
      client_id: result.clientId || null, user_id: result.userId || null,
    }))
    count(run, 'failed', 'half_made')
    stopCreation(run, 'provision_error')
    await notify(run, orphanEvent(pid, result.clientId || null, result.userId || null, `A rollback failed at stage ${result.stage}.`))
    return
  }
  // provision_error (C2, C3, C4)
  const postInvite = result.stage === 'profile' || result.stage === 'prompts' || (result.stage === 'invite' && !!result.userId)
  if (postInvite) {
    // An invite email went out: keep the reservation (it stays in the daily
    // window and suppresses this address), final until a human resets it.
    await finish(run, pid, token, Object.assign({}, base, inviteStamp, failure(row, 'provision_error', { final: true }), {
      email_domain: storedEmailDomain,
      client_id: null, user_id: null, email: invitee, email_sha256: sha, reserved_at: iso,
    }))
  } else {
    await finish(run, pid, token, Object.assign({}, base, cleared, failure(row, 'provision_error'), { email: invitee }))
  }
  count(run, 'failed', 'provision_error')
  stopCreation(run, 'provision_error')
}

/** F5: a dry run sends no notification and no email, ever. */
async function notify(run, evt) {
  if (run.mode !== 'live') { bump(run.detail, 'eventsSuppressed'); return }
  try { await run.deps.notify(run.sb, evt) } catch { /* recordAdminEvent never throws; belt and braces */ }
}

/** Retry passes re-read the mode once before they start (D8). */
async function stillLive(run) {
  return !settingsAllowCreate(run, await loadSettings(run.sb))
}

// ── after a create: collection, note, follow-up ────────────────────────────

async function firstCollection(run, pid, clientId, attemptsSoFar) {
  const { deps, sb } = run
  let status = 'enqueue_failed'
  try {
    const lim = await deps.checkCollectionLimits(sb, clientId)
    if (lim && lim.blocked) status = 'blocked_budget'
    else {
      const r = await deps.enqueueClientCollection(sb, { clientId, force: true, replaceExisting: false, trigger: 'scheduled', createdBy: null })
      if (r && !r.skipped && r.runId) { status = 'enqueued'; run.workerNeeded = true }
    }
  } catch { status = 'enqueue_failed' }
  await sb.from('explee_leads').update({ collection_status: status, collection_attempts: attemptsSoFar + 1, updated_at: run.now().toISOString() }).eq('person_id', pid)
}

async function retryCollections(run) {
  const { sb } = run
  if (!(await stillLive(run))) return
  const { data } = await sb.from('explee_leads').select('person_id, client_id, collection_status, collection_attempts').eq('decision', 'created')
  for (const r of data || []) {
    if (run.handled.has(r.person_id) && r.collection_status) continue
    if (!r.client_id || r.collection_status === 'enqueued' || (r.collection_attempts || 0) >= MAX_ATTEMPTS) continue
    if (!canCall(run)) { truncate(run, 'collections'); return }
    const runs = await sb.from('collection_runs').select('id').eq('client_id', r.client_id).limit(1)
    if ((runs.data || []).length) {
      await sb.from('explee_leads').update({ collection_status: 'enqueued', updated_at: run.now().toISOString() }).eq('person_id', r.person_id)
      continue
    }
    await firstCollection(run, r.person_id, r.client_id, r.collection_attempts || 0)
  }
}

async function writeNote(run, row) {
  const { sb, settings, detail } = run
  const iso = run.now().toISOString()
  // L6: never write to an erased or undone lead.
  if (!settings.note_enabled || row.erased_at || row.undone_at) {
    await sb.from('explee_leads').update({ note_status: 'skipped', updated_at: iso }).eq('person_id', row.person_id)
    return
  }
  if (!canCall(run)) { truncate(run, 'notes'); return }
  try {
    if (!run.explee.postNote) throw new Error('no_write_client')
    const existing = await run.explee.getNote(row.campaign_id, row.person_id)
    const line = R.noteLine({ date: iso.slice(0, 10), inviteeMasked: maskedFor(row.email), clientId: row.client_id, referral: row.invitee_source === 'referral' })
    const next = R.appendNote(existing, line)
    if (next !== null) await run.explee.postNote(row.campaign_id, row.person_id, next)
    await sb.from('explee_leads').update({ note_status: 'written', updated_at: iso }).eq('person_id', row.person_id)
    detail.notes.written++
  } catch (e) {
    if (e && e.code === 'insufficient_credits') throw e
    await sb.from('explee_leads').update({ note_status: 'failed', note_attempts: (row.note_attempts || 0) + 1, updated_at: iso }).eq('person_id', row.person_id)
    detail.notes.failed++
  }
}

async function retryNotes(run) {
  if (!(await stillLive(run))) return
  const { data } = await run.sb.from('explee_leads').select('person_id, campaign_id, email, client_id, invitee_source, note_status, note_attempts, erased_at, undone_at').eq('decision', 'created')
  for (const r of data || []) {
    if (run.handled.has(r.person_id) && r.note_status) continue
    if (r.note_status === 'written' || r.note_status === 'skipped') continue
    if (r.erased_at || r.undone_at) {
      // L6: no GET, no POST.
      await run.sb.from('explee_leads').update({ note_status: 'skipped', updated_at: run.now().toISOString() }).eq('person_id', r.person_id)
      continue
    }
    if (!r.client_id || !r.campaign_id) continue
    if (r.note_status === 'failed' && (r.note_attempts || 0) >= MAX_ATTEMPTS) continue
    if (!canCall(run)) { truncate(run, 'notes'); return }
    await writeNote(run, r)
  }
}

function renderFollowUp(body, brand, thread) {
  const raw = thread && thread.lead && typeof thread.lead.name === 'string' ? thread.lead.name.trim().split(/\s+/)[0] : ''
  const first = /^[\p{L}][\p{L}'-]{0,39}$/u.test(raw || '') ? raw : 'there'
  return String(body).split('{brand}').join(brand || 'your brand').split('{first_name}').join(first)
}

/**
 * D9 follow-up. A2: substitutes only {brand} and {first_name}, refuses any
 * other placeholder or a '%', and reads no measured result of any kind.
 * L3 and L4: terminal statuses are never selected; expiry and giving up are
 * written BEFORE any thread read; at most max_follow_ups_per_run reply POSTs.
 */
async function followUps(run) {
  const { sb, settings, detail } = run
  if (!settings.follow_up_enabled) return
  if (!R.followUpBodyValid(settings.follow_up_body)) { detail.followUpBodyInvalid = true; return }
  if (!(await stillLive(run))) return
  const { data } = await sb.from('explee_leads').select('*').eq('decision', 'created')
  const rows = (data || [])
    .filter((r) => (r.follow_up_status === null || r.follow_up_status === undefined || r.follow_up_status === 'failed') && !r.erased_at && !r.undone_at)
    .sort((a, b) => (ms(a.created_at_account) || 0) - (ms(b.created_at_account) || 0))
  let posts = 0
  for (const r of rows) {
    if (!canCall(run)) { truncate(run, 'follow_ups'); return }
    const iso = run.now().toISOString()
    const gate = R.followUpPreGate({ row: r, now: run.now(), settings })
    if (gate === 'terminal') continue
    if (gate === 'skipped_expired' || gate === 'gave_up') {
      await sb.from('explee_leads').update({ follow_up_status: gate, updated_at: iso }).eq('person_id', r.person_id)
      if (gate === 'skipped_expired') detail.followUps.expired++
      else detail.followUps.gaveUp++
      continue
    }
    if (!r.client_id || !r.campaign_id) continue
    if (r.follow_up_at && ms(r.follow_up_at) > run.now().getTime()) continue
    if ((ms(r.created_at_account) || 0) + Math.max(0, Number(settings.follow_up_delay_min) || 0) * MIN > run.now().getTime()) continue
    if (posts >= settings.max_follow_ups_per_run) continue
    if (r.invitee_source === 'referral') {
      await sb.from('explee_leads').update({ follow_up_status: 'skipped_referral', updated_at: iso }).eq('person_id', r.person_id)
      detail.followUps.skipped++
      continue
    }
    // Absent from this run's complete listing, or the listing incomplete:
    // no send this run, status unchanged, no thread read.
    const entry = run.listing && run.listing.get(r.person_id)
    if (!entry || !(run.complete && run.complete.get(r.project_id))) continue
    let thread
    try { thread = await run.explee.getThread(r.campaign_id, r.person_id) } catch (e) {
      if (e && e.code === 'insufficient_credits') throw e
      continue
    }
    if (thread && !Array.isArray(thread.messages)) thread.messages = []
    const d = R.followUpDecision({ row: r, thread, item: entry.item, listingComplete: true, now: run.now(), settings })
    if (d === 'wait' || d === 'off') continue
    if (d !== 'send') {
      await sb.from('explee_leads').update({ follow_up_status: d, updated_at: iso }).eq('person_id', r.person_id)
      if (d === 'skipped_expired') detail.followUps.expired++
      else if (d === 'gave_up') detail.followUps.gaveUp++
      else if (d === 'skipped_label') detail.followUps.label++   // rev 4, V4
      else detail.followUps.skipped++
      continue
    }
    const client = await sb.from('clients').select('name').eq('id', r.client_id).maybeSingle()
    const text = renderFollowUp(settings.follow_up_body, client.data && client.data.name, thread)
    posts++
    let res
    try { res = await run.explee.postReply(r.campaign_id, r.person_id, text) } catch (e) {
      if (e && e.code === 'insufficient_credits') throw e
      await sb.from('explee_leads').update({ follow_up_status: 'failed', follow_up_attempts: (r.follow_up_attempts || 0) + 1, follow_up_at: new Date(run.now().getTime() + HOUR).toISOString(), updated_at: iso }).eq('person_id', r.person_id)
      detail.followUps.failed++
      continue
    }
    if (res.status === 403) {
      await sb.from('explee_leads').update({ follow_up_status: 'skipped_blocked', updated_at: iso }).eq('person_id', r.person_id)
      detail.followUps.skipped++
    } else if (res.status === 409) {
      continue
    } else if (res.status === 429) {
      await sb.from('explee_leads').update({ follow_up_at: new Date(run.now().getTime() + DAY).toISOString(), updated_at: iso }).eq('person_id', r.person_id)
    } else if (res.ok === true || res.deduped === true) {
      await sb.from('explee_leads').update({ follow_up_status: 'sent', follow_up_at: iso, updated_at: iso }).eq('person_id', r.person_id)
      detail.followUps.sent++
    } else {
      // L2: a 2xx whose body says neither ok nor deduped was not accepted.
      await sb.from('explee_leads').update({ follow_up_status: 'failed', follow_up_attempts: (r.follow_up_attempts || 0) + 1, follow_up_at: new Date(run.now().getTime() + HOUR).toISOString(), updated_at: iso }).eq('person_id', r.person_id)
      detail.followUps.failed++
    }
  }
}

// ── daily: reconcile (before decide) and summary (live only) ───────────────

/**
 * D8 Reconciliation. Live: the first live run of a UTC day at 07:00 or later
 * whose date differs from last_reconcile_date. Dry (F5): the first dry run of
 * the day against last_dry_reconcile_date; it skips created rows, raises no
 * event and never stamps last_reconcile_date. A date is stamped only when the
 * selected list was finished (M3).
 */
async function maybeReconcile(run) {
  const { sb, settings, detail } = run
  const nowD = run.now()
  const today = nowD.toISOString().slice(0, 10)
  if (nowD.getUTCHours() < SUMMARY_HOUR_UTC) return
  const dateKey = run.mode === 'live' ? 'last_reconcile_date' : 'last_dry_reconcile_date'
  if (settings[dateKey] === today) return
  const r = await reconcile(run, today)
  detail.reconciled = r.n
  if (r.finished) await sb.from('explee_import_settings').update({ [dateKey]: today }).eq('id', true)
}

async function reconcile(run, today) {
  const { sb, settings } = run
  const live = run.mode === 'live'
  const { data } = await sb.from('explee_leads').select('*')
  const absent = new Set(run.absentCreated || [])
  const isToday = (v) => typeof v === 'string' && isoOrNull(v) !== null && isoOrNull(v).slice(0, 10) === today
  const eligible = (data || []).filter((r) => r.state !== 'processing'
    && (r.decision === 'created' || r.email || r.reply_excerpt || r.would_payload)
    && (live || r.decision !== 'created'))
  const readToday = eligible.filter((r) => isToday(r.reconciled_at)).length
  const quota = Math.max(0, settings.max_reconcile_per_day - readToday)
  const rows = eligible.filter((r) => !isToday(r.reconciled_at))
  rows.sort((a, b) => {
    const x = absent.has(a.person_id) ? 0 : 1
    const y = absent.has(b.person_id) ? 0 : 1
    if (x !== y) return x - y
    const p = ms(a.reconciled_at); const q = ms(b.reconciled_at)
    if (p === q) return a.person_id < b.person_id ? -1 : 1
    if (p === null) return -1
    if (q === null) return 1
    return p - q
  })
  const selected = rows.slice(0, quota)
  let n = 0
  for (const r of selected) {
    if (elapsed(run) >= GUARD_RECONCILE_MS || !canCall(run)) { truncate(run, 'reconcile'); return { n, finished: false } }
    const needsRead = !r.erased_at && posInt(r.campaign_id)
    if (needsRead && run.threadsUsed >= settings.max_threads_per_run) return { n, finished: false }
    const iso = run.now().toISOString()
    const patch = { reconciled_at: iso, updated_at: iso }
    if (live && r.decision === 'created' && !r.client_id && !r.undone_at) {
      patch.undone_at = iso
      patch.email = null
    }
    if (needsRead) {
      run.threadsUsed++
      let thread = null
      try { thread = await run.explee.getThread(r.campaign_id, r.person_id) } catch (e) {
        if (e && e.code === 'insufficient_credits') throw e
      }
      if (thread) {
        if (!Array.isArray(thread.messages)) thread.messages = []
        if (thread.erased || (thread.lead && thread.lead.erased)) {
          Object.assign(patch, erasurePatch(run, r))
          if (r.decision === 'created') {
            await notify(run, { type: 'explee_created_erased', client_id: r.client_id || null, title: 'Explee import: a created lead was erased', body: `Explee erased the lead behind client ${r.client_id || 'none'} (person ${r.person_id}). The account still exists; only you may delete it.`, meta: { person_id: r.person_id, client_id: r.client_id || null }, email: true })
          }
        } else if (r.decision === 'created') {
          const labels = Array.from(R.threadIntents({}, thread))
          if (thread.reply_blocked_reason === 'unsubscribe') labels.push('reply_blocked_unsubscribe')
          const sets = R.settingsSets(settings)
          const seen = new Set(Array.isArray(r.intents_seen) ? r.intents_seen : [])
          const fresh = labels.map(safeLabel).filter((l) => !seen.has(l) && (l === 'reply_blocked_unsubscribe' || sets.exclude.has(l) || R.DECLINE_RE.test(l)))
          if (fresh.length) {
            await notify(run, { type: 'explee_created_declined', client_id: r.client_id || null, title: 'Explee import: a created lead declined', body: `The lead behind client ${r.client_id || 'none'} (person ${r.person_id}) replied with: ${fresh.join(', ')}.`, meta: { person_id: r.person_id, client_id: r.client_id || null, labels: fresh }, email: true })
            patch.intents_seen = Array.from(new Set([...seen, ...fresh])).slice(0, 30)
          }
        }
      }
    }
    await sb.from('explee_leads').update(patch).eq('person_id', r.person_id).neq('state', 'processing')
    n++
  }
  return { n, finished: true }
}

async function maybeSummary(run) {
  const { sb, settings, detail } = run
  const nowD = run.now()
  const today = nowD.toISOString().slice(0, 10)
  if (run.mode !== 'live') {
    // F5: a dry run sends no summary (an admin_notifications row and an email).
    if (nowD.getUTCHours() >= SUMMARY_HOUR_UTC) detail.summary = 'skipped_dry_run'
    return
  }
  if (nowD.getUTCHours() < SUMMARY_HOUR_UTC || settings.last_summary_date === today) return
  // rev 4, N1 (d): nothing is sent at or after 13 minutes; last_summary_date
  // is not stamped, so the next live run at hour 7 or later sends it.
  if (!canCall(run)) {
    truncate(run, 'summary')
    detail.summary = 'deferred_guard'
    return
  }
  await summary(run)
  await sb.from('explee_import_settings').update({ last_summary_date: today }).eq('id', true)
  detail.summary = 'sent'
}

async function summary(run) {
  const { sb, detail } = run
  const since = new Date(run.now().getTime() - DAY).toISOString()
  const { data } = await sb.from('explee_leads').select('*').gte('decided_at', since)
  const rows = data || []
  const counts = {}
  const unknown = {}
  const referral = []
  const companyHas = []
  const byOther = []
  const ownSender = []
  const provisionFinal = []
  const finalTotal = []     // rev 4, N3: finalised by attempts_total
  const notOurs = []        // rev 4, V1: already_customer after an invite went out
  let failed = 0
  let held = 0
  let halfMade = 0
  for (const r of rows) {
    if (r.decision === 'failed' && r.final && (Number(r.attempts_total) || 0) >= R.MAX_TOTAL_ATTEMPTS) finalTotal.push(r.person_id)
    if (r.reason === 'already_customer' && r.invite_sent_at) notOurs.push(r.person_id)
    bump(counts, `${safeLabel(r.decision)}:${safeLabel(r.reason || 'none')}`)
    if (r.reason === 'unknown_intent') { bump(unknown, safeLabel(r.intent)); held++ }
    if (r.reason === 'replied_by_other') { byOther.push(r.person_id); held++ }
    if (r.reason === 'own_sender_domain') { ownSender.push(r.person_id); held++ }
    if (r.reason === 'company_has_account') companyHas.push(r.person_id)
    if (r.decision === 'created' && r.invitee_source === 'referral') referral.push(r.person_id)
    if (r.decision === 'failed') failed++
    if (r.decision === 'failed' && r.reason === 'provision_error' && r.final) provisionFinal.push(r.person_id)
    if (r.reason === 'half_made') halfMade++
  }
  const undone = (await sb.from('explee_leads').select('person_id').gte('undone_at', since)).data || []
  const touched = (await sb.from('explee_leads').select('person_id, follow_up_status').gte('updated_at', since)).data || []
  const expired = touched.filter((r) => r.follow_up_status === 'skipped_expired').length
  const labelSkips = touched.filter((r) => r.follow_up_status === 'skipped_label').length   // rev 4, V4
  // rev 4, V1 and N4: runs stopped not_ours and absent rows cleared, from the
  // job_runs rows of the last 24 hours plus this run (a failed read counts 0).
  let notOursRuns = detail.stopCreating === 'not_ours' ? 1 : 0
  let absentCleared = Object.values(detail.listing || {}).reduce((n, l) => n + (Number(l && l.absentCleared) || 0), 0)
  try {
    const jr = await sb.from('job_runs').select('detail').eq('job', JOB).gte('ran_at', since)
    for (const j of (jr && jr.data) || []) {
      const d = (j && j.detail) || {}
      if (d.stopCreating === 'not_ours') notOursRuns++
      absentCleared += Object.values(d.listing || {}).reduce((n, l) => n + (Number(l && l.absentCleared) || 0), 0)
    }
  } catch { /* counts stay at this run's */ }
  const ids = (list) => list.filter((p) => R.PERSON_ID_RE.test(p)).slice(0, 50).join(', ') || 'none'
  const lines = [
    `Mode: ${run.mode}.`,
    `Decisions in the last 24 hours: ${Object.entries(counts).map(([k, v]) => `${k} ${v}`).join('; ') || 'none'}.`,
    `Unknown labels: ${Object.entries(unknown).map(([k, v]) => `${k} ${v}`).join('; ') || 'none'}.`,
    `Referral creates: ${ids(referral)}.`,
    `Company already has an account: ${ids(companyHas)}.`,
    `Replied by someone else: ${ids(byOther)}.`,
    `Own sender domain: ${ids(ownSender)}.`,
    `Provisioning failed after the invite (reset by hand): ${ids(provisionFinal)}.`,
    `Final after 10 failures: ${ids(finalTotal)}.`,
    `Invited an existing login, not bound (creation stopped for that run): ${ids(notOurs)}. Runs stopped this way: ${notOursRuns}.`,
    `Failed: ${failed}. Held: ${held}. Half made: ${halfMade}. Undone: ${undone.length}. Follow-ups expired: ${expired}. Follow-ups skipped for a label: ${labelSkips}. Absent rows kept by a newer message: ${absentCleared}.`,
    `Listed projects not visible: ${(detail.projectsMissing || []).join(', ') || 'none'}.`,
    `Stages cut by the time guard in this run: ${(detail.truncated || []).join(', ') || 'none'}.`,
  ]
  const text = lines.join(' ').replace(/@/g, ' ')
  await notify(run, { type: 'explee_daily_summary', title: 'Explee import: daily summary', body: text, meta: { counts, unknown, failed, held, half_made: halfMade, undone: undone.length, follow_ups_expired: expired, provision_error_final: provisionFinal.length, final_total_attempts: finalTotal.length, not_ours: notOurs.length, not_ours_runs: notOursRuns, follow_ups_label: labelSkips, absent_cleared: absentCleared }, email: true })
  detail.summaryCounts = { decisions: rows.length }
}

// ── handler ────────────────────────────────────────────────────────────────

async function handler(event) {
  // 1. gate first, before env, settings or any read. A refusal writes no row.
  const gate = requireCronAuth(event)
  if (gate) return gate.response
  let requestedMode = null
  try {
    const b = event && event.body ? JSON.parse(event.body) : null
    if (b && typeof b === 'object' && b.mode === 'dry_run') requestedMode = 'dry_run'
  } catch { /* any other body is ignored */ }
  try {
    const deps = (handler._depsFactory || defaultDeps)()
    await runImport(deps, { requestedMode })
  } catch (e) {
    console.error('[explee-import] could not start the run')
  }
  return { statusCode: 200, body: '' }
}

exports.handler = withObservability(JOB, handler)
exports._handler = handler
exports.runImport = runImport
exports.defaultDeps = defaultDeps
exports.SETTINGS_DEFAULTS = SETTINGS_DEFAULTS
exports.failure = failure   // rev 4, N3: pure, exported for the attempts tests
