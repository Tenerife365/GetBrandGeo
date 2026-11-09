/**
 * phase2_collector_gate.test.js
 *
 * Run from brandgeo-dashboard/:  node tests/phase2_collector_gate.test.js
 *
 * Phase 2 (2026-11-08), docs/arch/phase2-dashboard-plan-2026-11-08.md. Phase 1
 * gated collect-prompt.js (force for admins only, engines from the clients
 * row). collect-claude.js and collect-chatgpt.js had neither gate: a viewer's
 * force: true skipped the monthly check, and a client whose plan does not
 * carry the engine (free has neither, radar has no chatgpt) could call it
 * from devtools and spend on our account. This suite covers, for BOTH files:
 *
 *   1. force: an admin's force is honoured; a viewer's is ignored, the monthly
 *      skip applies, and every 200 body carries force_ignored: true.
 *   2. plan: the engine must be in activeEnginesFor(plan, engines_enabled) of
 *      the live clients row; client_config in the body cannot grant it; a
 *      refused call answers 200 { skipped, prompt_id, llm, reason:
 *      'no_engines_for_plan' } before the limits check and any engine call.
 *   3. a drift guard: the force rule equals collect-prompt.js effectiveForce
 *      and enqueue-collection.js effectiveForceFor on every input tried.
 *   4. a mutation check: each file is recompiled in memory with one gate
 *      removed, and the suite is shown to FAIL against that copy, so the
 *      passing run above is evidence about the gate and not about the fakes.
 *
 * Data: tests/helpers/fake_supabase_mem.js, the in-memory PostgREST stand-in
 * the other suites use. @supabase/supabase-js, _collect.js and _auth.js are
 * replaced in require.cache BEFORE any function module is loaded, so nothing
 * touches the network and no engine is called. Fixtures name no real person.
 */
const assert = require('assert')
const fs = require('fs')
const path = require('path')
const Module = require('module')
const { createFakeSupabase } = require('./helpers/fake_supabase_mem')

const FN = path.join(__dirname, '..', 'netlify', 'functions')

process.env.SUPABASE_URL = 'http://localhost:54321'
process.env.SUPABASE_SERVICE_KEY = 'test-service-key-placeholder'
delete process.env.SENTRY_DSN
delete process.env.INTERNAL_AUDIT_KEY

let failures = 0
let passes = 0
async function check(name, fn) {
  try {
    await fn()
    passes++
    console.log(`  ok   ${name}`)
  } catch (e) {
    failures++
    console.log(`  FAIL ${name}`)
    console.log(`       ${e && e.message ? e.message : e}`)
  }
}

function installModule(resolvedPath, exportsObj) {
  const m = new Module(resolvedPath, null)
  m.filename = resolvedPath
  m.loaded = true
  m.exports = exportsObj
  require.cache[resolvedPath] = m
}

// ── Fakes ───────────────────────────────────────────────────────────────────
// One fake database per test, handed out by the stubbed createClient.
// failClientsLookup makes the clients read answer a driver error.
let db = null
let failClientsLookup = false
let failInsert = false
const INSERT_DRIVER_MESSAGE = 'insert or update on table "ai_results" violates foreign key constraint "ai_results_prompt_id_fkey"'

function erroringBuilder() {
  const b = {
    select() { return b }, eq() { return b }, maybeSingle() { return b }, single() { return b },
    then(res, rej) { return Promise.resolve({ data: null, error: { message: 'simulated lookup failure' } }).then(res, rej) },
  }
  return b
}
function serviceClient() {
  return {
    from(table) {
      if (table === 'clients' && failClientsLookup) return erroringBuilder()
      const q = db.from(table)
      // failInsert: the ai_results insert answers a driver error (F4 check).
      if (table === 'ai_results' && failInsert) {
        q.insert = () => ({ then(res, rej) { return Promise.resolve({ data: null, error: { message: INSERT_DRIVER_MESSAGE } }).then(res, rej) } })
      }
      return q
    },
  }
}
installModule(require.resolve('@supabase/supabase-js', { paths: [FN] }), {
  createClient() { return serviceClient() },
})

const collectCalls = []
installModule(require.resolve(path.join(FN, '_collect.js')), {
  async collectEngines(engines, opts) {
    collectCalls.push({ engines: engines.slice(), opts })
    const rows = engines.map(llm => ({
      llm, prompt_id: opts.prompt_id, client_id: opts.client_id, status: 'ok',
      brand_mentioned: true, brand_position: 1, sentiment: 'positive',
      checked_at: new Date().toISOString(),
    }))
    return { rows, summary: Object.fromEntries(engines.map(e => [e, 'mentioned'])), ctx: 'You are a user based in Testland.' }
  },
})

// Scripted identities. The viewer belongs to client 42.
const PROFILES = {
  'tok-admin':  { user: { id: 'user-admin' },  profile: { role: 'admin',  client_id: null } },
  'tok-viewer': { user: { id: 'user-viewer' }, profile: { role: 'viewer', client_id: 42 } },
}
const limitCalls = { n: 0 }
installModule(require.resolve(path.join(FN, '_auth.js')), {
  async requireAuth(event) {
    const h = (event.headers && (event.headers.authorization || event.headers.Authorization)) || ''
    const token = h.startsWith('Bearer ') ? h.slice(7) : ''
    const who = PROFILES[token]
    if (!who) return { response: { statusCode: 401, headers: {}, body: JSON.stringify({ error: 'Unauthorized' }) } }
    return { user: who.user, profile: who.profile, supabase: serviceClient(), headers: { 'Content-Type': 'application/json' } }
  },
  async checkCollectionLimits() { limitCalls.n++; return { blocked: false } },
})

const { activeEnginesFor } = require(path.join(FN, '_cost.js'))
const collectClaude  = require(path.join(FN, 'collect-claude.js'))
const collectChatgpt = require(path.join(FN, 'collect-chatgpt.js'))
const collectPrompt  = require(path.join(FN, 'collect-prompt.js'))
const enqueue        = require(path.join(FN, 'enqueue-collection.js'))

// ── Mutants: the same source with one gate removed, compiled in memory ──────
// Nothing is written to disk. The filename sits in netlify/functions so the
// relative requires resolve to the stubbed modules above.
function compileMutant(file, replacements, tag) {
  let src = fs.readFileSync(path.join(FN, file), 'utf8')
  for (const [from, to] of replacements) {
    if (!src.includes(from)) throw new Error(`mutant ${tag}: pattern not found in ${file}: ${from}`)
    src = src.split(from).join(to)
  }
  const filename = path.join(FN, `${file.replace(/\.js$/, '')}.mutant-${tag}.js`)
  const m = new Module(filename, null)
  m.filename = filename
  m.paths = Module._nodeModulePaths(FN)
  m._compile(src, filename)
  return m.exports
}
const MUTANT_NO_FORCE_GATE = [['effectiveForce(auth.profile.role, body.force)', '!!body.force']]
const MUTANT_NO_PLAN_GATE  = [['if (!engineAllowed(clientRow.plan, clientRow.engines_enabled)) {', 'if (false) {']]
// F3 (docs/qa/phase2-server-review-2026-11-08.md): the review's M9 and M10.
// M9 drops the client_id filter from the monthly skip, M10 drops the error-row
// exclusion. Both survived the suite before the two monthly-skip checks below.
const MUTANT_SKIP_NO_CLIENT = [[".eq('prompt_id', prompt_id).eq('client_id', client_id).eq('llm', ENGINE)", ".eq('prompt_id', prompt_id).eq('llm', ENGINE)"]]
const MUTANT_SKIP_COUNTS_ERRORS = [[".neq('status', 'error')\n      .gte('checked_at', monthStart.toISOString())", ".gte('checked_at', monthStart.toISOString())"]]
// F4: put the driver message back on the insert_error body.
const MUTANT_DETAIL_BACK = [["reason: 'insert_error', ...forceFlag", "reason: 'insert_error', detail: insErr.message, ...forceFlag"]]

// ── Helpers ─────────────────────────────────────────────────────────────────
const realLog = console.log
const realWarn = console.warn
const realError = console.error
let mute = false
console.log = (...args) => {
  if (mute) return
  const first = String(args[0] || '')
  if (first.startsWith('[')) return   // the functions' own log lines
  realLog(...args)
}
console.warn = () => {}
console.error = () => {}

const CLIENT_CONFIG = { brand_aliases: ['Acme Example'], brand_website: 'acme.example', known_competitors: [] }

// alreadyRan: ok rows this month for (prompt 7, client 42). erroredThisMonth:
// error rows for the same cell. otherClientRan: ok rows for prompt 7 under
// client 43 (a row of another client sharing the prompt_id; F3).
// Prompt 7 belongs to client 42 and is active, so the F1 prompt check passes
// (that check has its own suite, tests/phase2_prompt_ownership.test.js).
function freshDb({ plan, engines_enabled = null, alreadyRan = [], erroredThisMonth = [], otherClientRan = [] }) {
  db = createFakeSupabase()
  failClientsLookup = false
  failInsert = false
  collectCalls.length = 0
  limitCalls.n = 0
  db.seed('clients', [{ id: 42, plan, engines_enabled }, { id: 43, plan: 'enterprise', engines_enabled: null }])
  db.seed('prompts', [{ id: 7, client_id: 42, text: 'best family dentist in Testville', is_active: true }])
  const now = new Date().toISOString()
  db.seed('ai_results', [
    ...alreadyRan.map(llm => ({ prompt_id: 7, client_id: 42, llm, status: 'ok', checked_at: now })),
    ...erroredThisMonth.map(llm => ({ prompt_id: 7, client_id: 42, llm, status: 'error', error_code: 'api_error', checked_at: now })),
    ...otherClientRan.map(llm => ({ prompt_id: 7, client_id: 43, llm, status: 'ok', checked_at: now })),
  ])
}
function post(handler, token, extra) {
  return handler({
    httpMethod: 'POST',
    headers: { authorization: 'Bearer ' + token, origin: 'https://app.getbrandgeo.com' },
    body: JSON.stringify({ prompt_id: 7, prompt_text: 'best family dentist in Testville', client_id: 42, client_config: CLIENT_CONFIG, ...extra }),
  }, {})
}
const aiRows = () => db.rows('ai_results').length

// Plans picked from the live ladder, never hard-coded, so a ladder change
// cannot silently turn a "refused" case into an "allowed" one.
const PLANS = ['free', 'radar', 'essentials', 'growth', 'growth_pro', 'managed', 'enterprise']
function planWith(engine)    { return PLANS.find(p => activeEnginesFor(p, null).includes(engine)) }
function planWithout(engine) { return PLANS.find(p => !activeEnginesFor(p, null).includes(engine)) }

// The behavioural suite, run against the real module and against each mutant.
// Returns the names of the checks that failed.
async function suite(mod, engine, label, report) {
  const failed = []
  const c = async (name, fn) => {
    const full = `${label}: ${name}`
    if (report) return check(full, fn)
    try { await fn() } catch { failed.push(name) }
  }
  const handler = mod.handler
  const yes = planWith(engine)
  const no = planWithout(engine)

  await c('fixture: the ladder has a plan with and a plan without this engine', () => {
    assert.ok(yes, 'no plan carries ' + engine)
    assert.ok(no, 'every plan carries ' + engine)
  })

  await c('engine in plan, viewer, fresh cell: collects once, done, no force_ignored key', async () => {
    freshDb({ plan: yes })
    const res = await post(handler, 'tok-viewer', {})
    assert.strictEqual(res.statusCode, 200)
    const body = JSON.parse(res.body)
    assert.strictEqual(body.done, true)
    assert.strictEqual(body.llm, engine)
    assert.ok(!('force_ignored' in body))
    assert.strictEqual(collectCalls.length, 1)
    assert.deepStrictEqual(collectCalls[0].engines, [engine])
    assert.strictEqual(aiRows(), 1)
  })

  await c('admin force honoured: a cell that already ran this month is recollected', async () => {
    freshDb({ plan: yes, alreadyRan: [engine] })
    const res = await post(handler, 'tok-admin', { force: true })
    const body = JSON.parse(res.body)
    assert.strictEqual(body.done, true)
    assert.ok(!('force_ignored' in body), 'an honoured force is not flagged')
    assert.strictEqual(collectCalls.length, 1)
    assert.strictEqual(aiRows(), 2, 'new row written beside the old one, nothing deleted')
  })

  await c('viewer force ignored: a cell that already ran is skipped, force_ignored true, no engine call', async () => {
    freshDb({ plan: yes, alreadyRan: [engine] })
    const res = await post(handler, 'tok-viewer', { force: true })
    assert.strictEqual(res.statusCode, 200)
    const body = JSON.parse(res.body)
    assert.strictEqual(body.skipped, true)
    assert.strictEqual(body.llm, engine)
    assert.strictEqual(body.force_ignored, true)
    assert.strictEqual(collectCalls.length, 0)
    assert.strictEqual(aiRows(), 1)
  })

  await c('viewer force on a fresh cell: runs normally, force_ignored true on the done body', async () => {
    freshDb({ plan: yes })
    const res = await post(handler, 'tok-viewer', { force: true })
    const body = JSON.parse(res.body)
    assert.strictEqual(body.done, true)
    assert.strictEqual(body.force_ignored, true)
    assert.strictEqual(collectCalls.length, 1)
  })

  await c('viewer truthy non-boolean force ("true", 1) is ignored too', async () => {
    freshDb({ plan: yes, alreadyRan: [engine] })
    const a = JSON.parse((await post(handler, 'tok-viewer', { force: 'true' })).body)
    const b = JSON.parse((await post(handler, 'tok-admin', { force: 1 })).body)
    assert.strictEqual(a.skipped, true); assert.strictEqual(a.force_ignored, true)
    assert.strictEqual(b.skipped, true); assert.strictEqual(b.force_ignored, true)
    assert.strictEqual(collectCalls.length, 0)
  })

  await c('engine not in plan: refused with no_engines_for_plan, no limits check, no engine, no row', async () => {
    freshDb({ plan: no })
    const res = await post(handler, 'tok-viewer', {})
    assert.strictEqual(res.statusCode, 200)
    const body = JSON.parse(res.body)
    assert.strictEqual(body.skipped, true)
    assert.strictEqual(body.reason, 'no_engines_for_plan')
    assert.strictEqual(body.prompt_id, 7)
    assert.strictEqual(body.llm, engine)
    assert.ok(!('force_ignored' in body))
    assert.strictEqual(limitCalls.n, 0)
    assert.strictEqual(collectCalls.length, 0)
    assert.strictEqual(aiRows(), 0)
  })

  await c('engine not in plan, viewer force: refused, and the body says force was ignored', async () => {
    freshDb({ plan: no })
    const body = JSON.parse((await post(handler, 'tok-viewer', { force: true })).body)
    assert.strictEqual(body.reason, 'no_engines_for_plan')
    assert.strictEqual(body.force_ignored, true)
    assert.strictEqual(collectCalls.length, 0)
  })

  await c('engine not in plan, admin force: still refused (force never widens the plan)', async () => {
    freshDb({ plan: no })
    const body = JSON.parse((await post(handler, 'tok-admin', { force: true })).body)
    assert.strictEqual(body.reason, 'no_engines_for_plan')
    assert.strictEqual(collectCalls.length, 0)
  })

  await c('client_config in the body cannot grant the engine (plan and engines_enabled claimed)', async () => {
    freshDb({ plan: no })
    const forged = { ...CLIENT_CONFIG, plan: 'enterprise', engines_enabled: { [engine]: true }, active_engines: [engine] }
    const body = JSON.parse((await post(handler, 'tok-viewer', { client_config: forged, active_engines: [engine] })).body)
    assert.strictEqual(body.reason, 'no_engines_for_plan')
    assert.strictEqual(collectCalls.length, 0)
  })

  await c('engines_enabled false on the clients row removes an engine the plan carries', async () => {
    freshDb({ plan: yes, engines_enabled: { [engine]: false } })
    const body = JSON.parse((await post(handler, 'tok-viewer', {})).body)
    assert.strictEqual(body.reason, 'no_engines_for_plan')
    assert.strictEqual(collectCalls.length, 0)
  })

  await c('missing clients row: 404, no engine', async () => {
    freshDb({ plan: yes })
    db.tables.clients = []
    const res = await post(handler, 'tok-admin', {})
    assert.strictEqual(res.statusCode, 404)
    assert.strictEqual(collectCalls.length, 0)
  })

  await c('clients lookup error: 500, no engine (never falls through to collecting)', async () => {
    freshDb({ plan: yes })
    failClientsLookup = true
    const res = await post(handler, 'tok-admin', {})
    assert.strictEqual(res.statusCode, 500)
    assert.strictEqual(collectCalls.length, 0)
  })

  await c('viewer for another client: 403 before any lookup', async () => {
    freshDb({ plan: yes })
    const res = await post(handler, 'tok-viewer', { client_id: 43 })
    assert.strictEqual(res.statusCode, 403)
    assert.strictEqual(collectCalls.length, 0)
  })

  // F3: the two monthly-skip predicates.
  await c('monthly skip: an error row this month does not block a collect', async () => {
    freshDb({ plan: yes, erroredThisMonth: [engine] })
    const body = JSON.parse((await post(handler, 'tok-viewer', {})).body)
    assert.strictEqual(body.done, true, 'expected a collect, got ' + JSON.stringify(body))
    assert.strictEqual(collectCalls.length, 1)
    assert.strictEqual(aiRows(), 2, 'the new ok row is written beside the error row')
  })

  await c('monthly skip: another client ok row for the same prompt_id does not block a collect', async () => {
    freshDb({ plan: yes, otherClientRan: [engine] })
    const body = JSON.parse((await post(handler, 'tok-viewer', {})).body)
    assert.strictEqual(body.done, true, 'expected a collect, got ' + JSON.stringify(body))
    assert.strictEqual(collectCalls.length, 1)
  })

  // F4: the driver message stays in the log, never in the body.
  await c('insert failure: done false, reason insert_error, no detail and no driver text in the body', async () => {
    freshDb({ plan: yes })
    failInsert = true
    const res = await post(handler, 'tok-viewer', {})
    assert.strictEqual(res.statusCode, 200)
    const body = JSON.parse(res.body)
    assert.strictEqual(body.done, false)
    assert.strictEqual(body.reason, 'insert_error')
    assert.strictEqual(body.llm, engine)
    assert.ok(!('detail' in body), 'detail must not be returned')
    assert.ok(!res.body.includes('ai_results_prompt_id_fkey'), 'driver text leaked: ' + res.body)
  })

  return failed
}

;(async () => {
  // ════════════════════════════════════════════════════════════════════════
  console.log('force rule drift guard (pure)')
  const roles = ['admin', 'viewer', undefined, '']
  const values = [true, false, undefined, null, 'true', 1, 0, {}]
  await check('collect-claude, collect-chatgpt, collect-prompt and enqueue-collection agree on every input', () => {
    for (const r of roles) for (const v of values) {
      const ref = collectPrompt.effectiveForce(r, v)
      assert.strictEqual(enqueue.effectiveForceFor(r, v), ref, `enqueue ${r} ${String(v)}`)
      assert.strictEqual(collectClaude.effectiveForce(r, v), ref, `claude ${r} ${String(v)}`)
      assert.strictEqual(collectChatgpt.effectiveForce(r, v), ref, `chatgpt ${r} ${String(v)}`)
    }
  })
  await check('engineAllowed equals membership in activeEnginesFor for every plan, both files', () => {
    for (const p of [...PLANS, 'pro', 'unknown_plan', null]) {
      for (const ee of [null, { claude: false }, { chatgpt: false }, { claude: true }]) {
        assert.strictEqual(collectClaude.engineAllowed(p, ee), activeEnginesFor(p, ee).includes('claude'), `claude ${p}`)
        assert.strictEqual(collectChatgpt.engineAllowed(p, ee), activeEnginesFor(p, ee).includes('chatgpt'), `chatgpt ${p}`)
      }
    }
  })
  await check('ladder facts the suite relies on: free has neither, radar has claude only', () => {
    assert.strictEqual(collectClaude.engineAllowed('free', null), false)
    assert.strictEqual(collectChatgpt.engineAllowed('free', null), false)
    assert.strictEqual(collectClaude.engineAllowed('radar', null), true)
    assert.strictEqual(collectChatgpt.engineAllowed('radar', null), false)
  })

  // ════════════════════════════════════════════════════════════════════════
  console.log('collect-claude.js handler, end to end with the in-memory DB')
  await suite(collectClaude, 'claude', 'claude', true)

  console.log('collect-chatgpt.js handler, end to end with the in-memory DB')
  await suite(collectChatgpt, 'chatgpt', 'chatgpt', true)

  await check('chatgpt: the model plan comes from the clients row, not from client_config', async () => {
    freshDb({ plan: 'essentials' })
    await post(collectChatgpt.handler, 'tok-viewer', { client_config: { ...CLIENT_CONFIG, plan: 'managed' } })
    assert.strictEqual(collectCalls.length, 1)
    assert.strictEqual(collectCalls[0].opts.plan, 'essentials')
  })

  // ════════════════════════════════════════════════════════════════════════
  console.log('mutation check: the suite fails when a gate is removed')
  for (const [file, engine] of [['collect-claude.js', 'claude'], ['collect-chatgpt.js', 'chatgpt']]) {
    await check(`${file} without the force gate: the viewer force check fails`, async () => {
      const mutant = compileMutant(file, MUTANT_NO_FORCE_GATE, 'noforce')
      mute = true
      const failed = await suite(mutant, engine, 'mutant', false)
      mute = false
      assert.ok(failed.includes('viewer force ignored: a cell that already ran is skipped, force_ignored true, no engine call'),
        'expected the viewer force check to fail, failed: ' + JSON.stringify(failed))
      // Control: the mutant still loads and runs, so the failure above is the
      // missing gate and not a broken copy that fails every check.
      assert.ok(!failed.includes('missing clients row: 404, no engine'), 'mutant should still pass unrelated checks')
      assert.ok(!failed.includes('engine not in plan: refused with no_engines_for_plan, no limits check, no engine, no row'), 'plan gate is intact in this mutant')
    })
    await check(`${file} without the plan gate: the not-in-plan checks fail`, async () => {
      const mutant = compileMutant(file, MUTANT_NO_PLAN_GATE, 'noplan')
      mute = true
      const failed = await suite(mutant, engine, 'mutant', false)
      mute = false
      for (const name of [
        'engine not in plan: refused with no_engines_for_plan, no limits check, no engine, no row',
        'client_config in the body cannot grant the engine (plan and engines_enabled claimed)',
        'engines_enabled false on the clients row removes an engine the plan carries',
      ]) assert.ok(failed.includes(name), `expected "${name}" to fail, failed: ` + JSON.stringify(failed))
      // Control: the force gate is intact in this mutant.
      assert.ok(!failed.includes('viewer force ignored: a cell that already ran is skipped, force_ignored true, no engine call'), 'force gate is intact in this mutant')
      assert.ok(!failed.includes('missing clients row: 404, no engine'), 'mutant should still pass unrelated checks')
    })
    for (const [tag, repl, name] of [
      ['skipnoclient', MUTANT_SKIP_NO_CLIENT, 'monthly skip: another client ok row for the same prompt_id does not block a collect'],
      ['skiperrors', MUTANT_SKIP_COUNTS_ERRORS, 'monthly skip: an error row this month does not block a collect'],
      ['detail', MUTANT_DETAIL_BACK, 'insert failure: done false, reason insert_error, no detail and no driver text in the body'],
    ]) {
      await check(`${file} mutant ${tag}: "${name}" fails, unrelated checks pass`, async () => {
        const mutant = compileMutant(file, repl, tag)
        mute = true
        const failed = await suite(mutant, engine, 'mutant', false)
        mute = false
        assert.ok(failed.includes(name), `expected "${name}" to fail, failed: ` + JSON.stringify(failed))
        assert.strictEqual(failed.length, 1, 'only the targeted check should fail, failed: ' + JSON.stringify(failed))
      })
    }
  }

  console.log = realLog
  console.warn = realWarn
  console.error = realError
  console.log(`\n${passes} passed, ${failures} failed`)
  process.exit(failures ? 1 : 0)
})().catch((e) => {
  console.log = realLog
  realLog('suite crashed:', e)
  process.exit(1)
})
