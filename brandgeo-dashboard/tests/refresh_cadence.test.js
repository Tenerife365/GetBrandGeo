/**
 * refresh_cadence.test.js — guards the automatic collection cadence.
 * Run: `node tests/refresh_cadence.test.js` (exits non-zero on failure).
 *
 * WHY THIS EXISTS. Until 2026-07-31 nothing in the repo wrote
 * clients.refresh_cadence. All 36 production rows sat at the column default
 * 'manual', schedule-collections.js selects only rows whose cadence is in
 * { weekly, biweekly, monthly }, and so no automatic collection had ever
 * happened for anyone — while paid tiers were sold on a weekly refresh. The
 * cadence is now derived from the plan and written whenever a plan is
 * established.
 *
 * That turns a tap on. This file is the thing that stops it flooding:
 *
 *   1. THE RESEARCH EXCLUSION. 27 of the 36 clients in production are BrandGEO's
 *      own city-research studies and every one of them sits on plan 'pro', at a
 *      EUR 225 monthly budget ceiling each. A cadence derived from plan ALONE
 *      would switch on EUR 6,075 a month of ceiling for rows that are not
 *      customers. { plan: 'pro', category: 'research' } MUST resolve to 'manual'
 *      while { plan: 'pro', category: 'active' } resolves to 'weekly'. That pair
 *      is the assertion this whole file exists for.
 *   2. THE TWO COPIES. planConfig.ts (frontend) and _cost.js (server, and the
 *      copy that actually writes the column) cannot import each other — CommonJS
 *      at runtime vs the Vite bundle, the same split already accepted for
 *      ENGINE_COST_EUR and PLAN_ORDER. Where an import is impossible a test is
 *      the only thing that keeps a hand-kept mirror honest.
 *   3. THE VOCABULARY. schedule-collections.js understands exactly four values.
 *      A fifth invented here would produce a client that is silently never
 *      collected, with nothing failing and nothing warning.
 */
const assert = require('assert')
const fs = require('fs')
const path = require('path')

let passed = 0
const ok = (n) => { passed++; console.log('  ok -', n) }

const read = (p) => fs.readFileSync(path.join(__dirname, '..', p), 'utf8')

const {
  PLAN_REFRESH_CADENCE,
  REFRESH_CADENCES,
  RESEARCH_CATEGORY,
  DEFAULT_CLIENT_CATEGORY,
  refreshCadenceFor,
  PLAN_LIVE_ENGINES,
} = require('../netlify/functions/_cost')

// ── 1. The research exclusion ────────────────────────────────────────────────
console.log('\n1. research exclusion (the EUR 6,075 assertion)')
{
  assert.strictEqual(refreshCadenceFor('pro', 'research'), 'manual',
    'a research client on pro MUST stay manual')
  ok("{ plan: 'pro', category: 'research' } -> 'manual'")

  assert.strictEqual(refreshCadenceFor('pro', 'active'), 'weekly',
    'a real pro customer MUST get the weekly cadence')
  ok("{ plan: 'pro', category: 'active' }   -> 'weekly'")

  // The exclusion holds on EVERY plan, not just the one the studies happen to
  // be on today. If a study is ever moved to another tier it must stay manual.
  for (const plan of Object.keys(PLAN_REFRESH_CADENCE)) {
    assert.strictEqual(refreshCadenceFor(plan, RESEARCH_CATEGORY), 'manual',
      `research + ${plan} must be manual`)
  }
  ok(`research overrides all ${Object.keys(PLAN_REFRESH_CADENCE).length} plans`)

  // Every OTHER category behaves normally — the exclusion is research and only
  // research, so a 'test' or 'archived' client is not silently exempted too.
  for (const cat of ['active', 'free', 'test', 'archived']) {
    assert.strictEqual(refreshCadenceFor('pro', cat), 'weekly',
      `category ${cat} must not be treated as research`)
  }
  ok("categories active/free/test/archived are NOT exempted")
}

// ── 2. Resolved cadence for every plan ───────────────────────────────────────
console.log('\n2. resolved cadence, all plans (category = default)')
{
  const rows = []
  for (const plan of Object.keys(PLAN_REFRESH_CADENCE)) {
    const normal   = refreshCadenceFor(plan, DEFAULT_CLIENT_CATEGORY)
    const research = refreshCadenceFor(plan, RESEARCH_CATEGORY)
    rows.push([plan, normal, research])
    assert.ok(REFRESH_CADENCES.includes(normal), `${plan} resolved to an unknown cadence: ${normal}`)
  }
  const w = Math.max(...rows.map(r => r[0].length))
  console.log(`  ${'plan'.padEnd(w)}  category=active  category=research`)
  for (const [plan, normal, research] of rows) {
    console.log(`  ${plan.padEnd(w)}  ${normal.padEnd(15)}  ${research}`)
  }
  ok('every plan resolves to one of the four values schedule-collections knows')

  // The tier rule, stated as an assertion rather than trusted: free is monthly,
  // every paid tier is weekly. If a tier is ever given its own cadence this line
  // is what forces the decision to be made deliberately.
  assert.strictEqual(PLAN_REFRESH_CADENCE.free, 'monthly', 'free must be monthly')
  for (const plan of Object.keys(PLAN_REFRESH_CADENCE)) {
    if (plan === 'free') continue
    assert.strictEqual(PLAN_REFRESH_CADENCE[plan], 'weekly', `${plan} must be weekly`)
  }
  ok('free = monthly, every paid tier = weekly')
}

// ── 3. Vocabulary matches schedule-collections.js ────────────────────────────
console.log('\n3. cadence vocabulary vs schedule-collections.js CADENCE_DAYS')
{
  const src = read('netlify/functions/schedule-collections.js')
  const m = src.match(/const CADENCE_DAYS = \{([^}]*)\}/)
  assert.ok(m, 'could not find CADENCE_DAYS in schedule-collections.js')
  const scheduled = m[1].split(',').map(s => s.split(':')[0].trim()).filter(Boolean)

  // Every value we can WRITE that is not 'manual' must be one the scheduler ACTS
  // on, or the client is silently never collected.
  for (const c of REFRESH_CADENCES) {
    if (c === 'manual') continue
    assert.ok(scheduled.includes(c), `'${c}' is writable but schedule-collections would ignore it`)
  }
  ok(`CADENCE_DAYS covers every non-manual value: ${scheduled.join(', ')}`)

  assert.ok(!scheduled.includes('manual'),
    "'manual' must NOT be in CADENCE_DAYS — it is the never-auto-refresh value")
  ok("'manual' is absent from CADENCE_DAYS")

  // The second, independent research guard at the point of spend.
  assert.ok(/\.neq\(\s*['"]category['"]\s*,\s*RESEARCH_CATEGORY\s*\)/.test(src),
    'schedule-collections.js must exclude category=research at query time')
  ok('schedule-collections.js excludes category=research at the point of spend')

  // The budget gate is what makes turning the tap on safe at all. Assert it is
  // still checked BEFORE anything is enqueued, not after.
  const limitAt = src.indexOf('checkCollectionLimits')
  const enqueueAt = src.indexOf('enqueueClientCollection(supabase')
  assert.ok(limitAt > -1, 'checkCollectionLimits must still be called')
  assert.ok(enqueueAt > limitAt, 'the budget check must run BEFORE the enqueue')
  ok('checkCollectionLimits is called before enqueueClientCollection')
}

// ── 4. The two copies agree ──────────────────────────────────────────────────
console.log('\n4. planConfig.ts <-> _cost.js mirror')
{
  const ts = read('src/lib/planConfig.ts')
  const block = ts.match(/PLAN_REFRESH_CADENCE: Record<Plan, RefreshCadence> = \{([\s\S]*?)\n\}/)
  assert.ok(block, 'could not find PLAN_REFRESH_CADENCE in planConfig.ts')

  const tsMap = {}
  for (const line of block[1].split('\n')) {
    const m = line.match(/^\s*([a-z_]+):\s*'([a-z]+)'/)
    if (m) tsMap[m[1]] = m[2]
  }

  assert.deepStrictEqual(tsMap, PLAN_REFRESH_CADENCE,
    'planConfig.ts and _cost.js disagree on the cadence ladder')
  ok(`both copies carry the same ${Object.keys(tsMap).length} plans and values`)

  // Every plan the server can ENFORCE must have a cadence, or provisioning that
  // tier silently produces a client nothing ever collects. This is the same
  // defect class as the missing PLAN_MONTHLY_API_BUDGET_EUR key that
  // docs/strategy/radar-unit-economics.md §2c is about, one map over.
  for (const plan of Object.keys(PLAN_LIVE_ENGINES)) {
    assert.ok(Object.prototype.hasOwnProperty.call(PLAN_REFRESH_CADENCE, plan),
      `plan '${plan}' is in PLAN_LIVE_ENGINES but has no PLAN_REFRESH_CADENCE entry`)
  }
  ok('every plan in PLAN_LIVE_ENGINES has a cadence')
}

// ── 5. Unknown plan fails to manual (spends nothing) ─────────────────────────
console.log('\n5. unmapped plan / missing category')
{
  for (const bogus of ['radar_plus', '', null, undefined, 'FREE', 'Growth']) {
    assert.strictEqual(refreshCadenceFor(bogus, 'active'), 'manual',
      `unmapped plan ${JSON.stringify(bogus)} must resolve to manual, not to a spending cadence`)
  }
  ok('an unmapped plan resolves to manual (fails toward zero spend)')

  // A missing category means "not stated", which on a create path is the DB
  // default 'active'. It must NOT be read as research (that would silently
  // disable cadence for every new client) and must not throw.
  assert.strictEqual(refreshCadenceFor('growth', undefined), 'weekly')
  assert.strictEqual(refreshCadenceFor('growth', null), 'weekly')
  ok('a missing category is treated as the column default, not as research')
}

// ── 6. Every plan write also writes cadence ──────────────────────────────────
console.log('\n6. plan-writing paths write refresh_cadence')
{
  // Source-level check, deliberately. These five functions each need a live
  // Supabase service key to run, so behaviour cannot be exercised here; what CAN
  // be guaranteed is that none of them silently loses the write in a later edit.
  for (const f of [
    'provision-account.js',
    'onboard-client.js',
    'stripe-webhook.js',
    'set-client-plan.js',
    'expire-plan-grants.js',
  ]) {
    const src = read(`netlify/functions/${f}`)
    assert.ok(/refreshCadenceFor\s*\(/.test(src), `${f} must call refreshCadenceFor`)
    assert.ok(/refresh_cadence/.test(src), `${f} must write refresh_cadence`)
  }
  ok('all five plan-writing functions call refreshCadenceFor and write the column')

  // ── NO BACKFILL ───────────────────────────────────────────────────────────
  // A cadence may be written on a row that already exists ONLY as part of a
  // deliberate plan change to ONE named client (set-client-plan, a Stripe event,
  // a grant expiring). It may never be written to a SET of rows — a sweep over
  // the book is a spend decision that belongs to Constantin, and switching all
  // 27 research clients or all 9 real ones on at once is exactly what this
  // guards. The decisive invariant, and it is checkable without guessing:
  //
  //   every supabase .update() whose payload carries refresh_cadence is scoped
  //   by .eq('id', ...) — never .in(), never .eq('stripe_customer_id'), never
  //   an unfiltered update.
  //
  // The payload is RESOLVED, not pattern-matched: an inline object literal is
  // read directly, and `.update(someVar)` is resolved by reading back to that
  // variable's construction, which is what catches `update.refresh_cadence = x`
  // being bolted onto an object several lines above its own update call.
  let updatesChecked = 0
  for (const f of [
    'provision-account.js', 'onboard-client.js', 'stripe-webhook.js',
    'set-client-plan.js', 'expire-plan-grants.js', 'schedule-collections.js',
  ]) {
    const src = read(`netlify/functions/${f}`)
    for (let i = src.indexOf('.update('); i !== -1; i = src.indexOf('.update(', i + 1)) {
      const chain = src.slice(i, i + 300)
      const arg = chain.slice(8, chain.indexOf(')') === -1 ? 300 : undefined)
      const inline = /^\s*\{/.test(chain.slice(8))
      // Payload text: the inline literal, or everything from the payload
      // variable's declaration down to this call.
      let payload
      if (inline) {
        payload = chain
      } else {
        const varName = (chain.slice(8).match(/^\s*([A-Za-z_$][\w$]*)/) || [])[1]
        const declAt = varName ? src.lastIndexOf(`const ${varName} =`, i) : -1
        payload = declAt === -1 ? chain : src.slice(declAt, i)
      }
      void arg
      if (!/refresh_cadence/.test(payload)) continue
      updatesChecked++
      assert.ok(/\.eq\(\s*['"]id['"]/.test(chain),
        `${f}: an UPDATE carrying refresh_cadence is not scoped to a single client id\n---\n${chain.slice(0, 200)}\n---`)
    }
  }
  assert.ok(updatesChecked >= 4,
    `expected at least 4 cadence UPDATEs to inspect, found ${updatesChecked} — the resolver is probably not seeing them`)
  ok(`all ${updatesChecked} cadence UPDATEs are scoped to a single client id (no backfill)`)

  // And no migration writes it either. db/ is the other way a backfill could
  // ship, and it would be far harder to notice than a line of JS.
  const dbDir = path.join(__dirname, '..', '..', 'db')
  for (const f of fs.readdirSync(dbDir).filter(n => n.endsWith('.sql'))) {
    const sql = fs.readFileSync(path.join(dbDir, f), 'utf8')
    for (const line of sql.split('\n')) {
      const bare = line.trim()
      if (bare.startsWith('--')) continue          // a commented-out example is fine
      assert.ok(!/^\s*UPDATE\b[\s\S]*refresh_cadence/i.test(bare),
        `db/${f} contains an uncommented UPDATE that sets refresh_cadence`)
    }
  }
  ok('no migration in db/ sets refresh_cadence on existing rows')
}

console.log(`\n${passed} assertions passed.`)
