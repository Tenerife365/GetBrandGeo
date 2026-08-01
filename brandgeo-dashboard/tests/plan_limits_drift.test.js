/**
 * plan_limits_drift.test.js — pins the server-side plan-limit mirror in
 * netlify/functions/_plans.js to src/lib/planConfig.ts, the source of truth.
 * Run: `node tests/plan_limits_drift.test.js` (exits non-zero on failure).
 * Node builtins only, so it runs without `node_modules` installed.
 *
 * WHY THIS EXISTS. On 2026-07-31 three Netlify functions each carried their own
 * hand-written copy of the plan ladder and all three were wrong at once:
 *   - seo-crawl.js `CRAWL_PAGE_CAP` disagreed with planConfig.ts on `essentials`
 *     and had no `radar` row. It read the map with `?? 1`, so the missing key did
 *     not fail, it GRANTED a one-page crawl to a tier nobody had priced.
 *   - seo-draft.js `DRAFT_MONTHLY_CAP` said `essentials: 2` against 0.
 *   - social-publish.js `PLAN_RANK` was a second copy of planRank() with every
 *     rank off by one once `radar` took index 1.
 * None of it failed anything. A cap nobody enforces is a display bug; these caps
 * ARE the gate (seo-crawl.js has no hasFeature() call, it refuses on
 * `maxPages <= 0`), so drift gives a paid feature away in silence.
 *
 * WHY IT DOES NOT HARDCODE THE LADDER. An earlier version of this file asserted
 * `radar` and `essentials` get 0 SEO pages, which was true of the sprint ruling
 * it was written against and FALSE two commits later, when Constantin ruled both
 * tiers get the one-page landing-page audit. A test that restates the product
 * decision has to be edited every time the decision moves, and it will be edited
 * wrongly. So parity with planConfig.ts is asserted mechanically, and only the
 * two INVARIANTS that outlive any particular ruling are stated outright.
 */
const assert = require('assert')
const fs = require('fs')
const path = require('path')

const { PLAN_ORDER, PLAN_LIMITS, planLimit, planRank } = require('../netlify/functions/_plans')

let passed = 0
const read = (p) => fs.readFileSync(path.join(__dirname, '..', p), 'utf8')
const ok = (msg) => { console.log(`  ok  ${msg}`); passed++ }

const planConfig = read('src/lib/planConfig.ts')

/** Pull `export const NAME ... = { free: 0, radar: 0, ... }` out of planConfig.ts. */
function parsePlanTable(name) {
  const m = new RegExp(`export const ${name}[^=]*=\\s*\\{([^}]*)\\}`).exec(planConfig)
  assert.ok(m, `could not find ${name} in planConfig.ts — the source of truth moved or was renamed`)
  const table = {}
  for (const [, k, v] of m[1].matchAll(/(\w+)\s*:\s*(-?\d+)/g)) table[k] = Number(v)
  assert.ok(Object.keys(table).length > 0, `${name} parsed to an empty table`)
  return table
}

// _plans.js key -> planConfig.ts export it mirrors.
const MIRRORS = {
  seoPages:              'PLAN_SEO_PAGE_CAP',
  seoAuditsPerWeek:      'PLAN_SEO_AUDITS_PER_WEEK',
  seoDraftsPerMonth:     'PLAN_SEO_DRAFTS_PER_MONTH',
  socialChannels:        'PLAN_SOCIAL_CHANNEL_LIMIT',
  socialPostsPerChannel: 'PLAN_SOCIAL_POSTS_PER_CHANNEL_MONTH',
}

console.log('\n1. The mirror matches planConfig.ts, value for value')
{
  // Guard the guard: a limit table added to _plans.js but not listed here would
  // silently stop being covered.
  assert.deepStrictEqual(
    Object.keys(PLAN_LIMITS).sort(), Object.keys(MIRRORS).sort(),
    'PLAN_LIMITS and MIRRORS disagree — a limit table is untested or MIRRORS is stale',
  )
  ok(`every PLAN_LIMITS table is covered here (${Object.keys(MIRRORS).length})`)

  for (const [key, exportName] of Object.entries(MIRRORS)) {
    const truth = parsePlanTable(exportName)
    for (const plan of PLAN_ORDER) {
      assert.strictEqual(
        PLAN_LIMITS[key][plan], truth[plan],
        `_plans.js PLAN_LIMITS.${key}.${plan} is ${PLAN_LIMITS[key][plan]}, ` +
        `planConfig.ts ${exportName}.${plan} is ${truth[plan]}`,
      )
    }
    // A plan priced upstream but absent downstream is the `radar` defect exactly,
    // so compare key SETS, not just the values we happen to hold.
    assert.deepStrictEqual(
      Object.keys(PLAN_LIMITS[key]).sort(), Object.keys(truth).sort(),
      `${key} and ${exportName} cover different plans`,
    )
    ok(`${key} matches ${exportName} for all ${PLAN_ORDER.length} plans`)
  }
}

console.log('\n2. The ladder, and the two invariants that outlive any ruling')
{
  const truthOrder = /export const PLAN_ORDER: Plan\[\] = \[([^\]]*)\]/.exec(planConfig)
  assert.ok(truthOrder, 'could not find PLAN_ORDER in planConfig.ts')
  const parsed = [...truthOrder[1].matchAll(/'(\w+)'/g)].map((m) => m[1])
  // Index for index: planRank() reads the INDEX, and social-publish.js gates on
  // it. A reordering here is a silent entitlement change.
  assert.deepStrictEqual(PLAN_ORDER, parsed, 'PLAN_ORDER has drifted from planConfig.ts')
  ok(`PLAN_ORDER matches index for index (${PLAN_ORDER.join(' < ')})`)

  // INVARIANT 1: free is never entitled to anything metered. Every ruling so far
  // has moved paid tiers around and never once given the free tier a paid lever.
  for (const key of Object.keys(PLAN_LIMITS)) {
    assert.strictEqual(planLimit(key, 'free'), 0, `free must have no ${key}`)
  }
  ok('the free tier is 0 on every metered limit')

  // INVARIANT 2: the ladder never inverts. A cheaper tier outselling a dearer one
  // is the specific failure the 2026-07-31 essentials change exists to prevent
  // (radar: 1 with essentials: 0 sold EUR 29 an audit EUR 99 did not get).
  for (const key of Object.keys(PLAN_LIMITS)) {
    for (let i = 1; i < PLAN_ORDER.length; i++) {
      const lower = planLimit(key, PLAN_ORDER[i - 1])
      const higher = planLimit(key, PLAN_ORDER[i])
      assert.ok(
        higher >= lower,
        `${key} inverts: ${PLAN_ORDER[i]} gets ${higher} but the cheaper ` +
        `${PLAN_ORDER[i - 1]} gets ${lower}`,
      )
    }
  }
  ok('no limit inverts anywhere on the ladder (each tier >= the one below it)')
}

console.log('\n3. planLimit() fails closed, which is the actual defect')
{
  // The `?? 1` in seo-crawl.js was the whole bug: a plan the map had never heard
  // of was GRANTED an allowance. Every unknown must resolve to 0.
  for (const unknown of ['radar_plus', 'legacy_gold', '', 'FREE', 'growth ', null, undefined, 0, {}]) {
    for (const key of Object.keys(PLAN_LIMITS)) {
      assert.strictEqual(
        planLimit(key, unknown), 0,
        `unknown plan ${JSON.stringify(unknown)} must get 0 ${key}, never a default allowance`,
      )
    }
  }
  ok('an unknown, empty, mistyped or non-string plan gets 0 on every limit')

  // A typo in our own code must be loud, not a silent lockout of a paying tenant.
  assert.throws(() => planLimit('seoPagez', 'growth'), /unknown limit/,
    'an unknown limit name must throw, not return 0')
  ok('an unknown limit name throws instead of silently returning 0')

  for (const [key, table] of Object.entries(PLAN_LIMITS)) {
    for (const plan of PLAN_ORDER) {
      assert.strictEqual(typeof table[plan], 'number', `${key}.${plan} must be a number`)
    }
  }
  ok('every plan in PLAN_ORDER is priced in every limit table')
}

console.log('\n4. No function hand-writes the ladder any more')
{
  // Strip comments before every source assertion: these files DESCRIBE the
  // deleted maps and the deleted fallback on purpose, so a grep over raw source
  // matches the explanation and hides a real reintroduction. Caught by this test
  // failing on its own first run against already-correct code.
  const codeOf = (f) => read(`netlify/functions/${f}`)
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')

  for (const f of ['seo-crawl.js', 'seo-draft.js', 'social-publish.js']) {
    const code = codeOf(f)
    assert.ok(
      !/\bgrowth_pro\s*:/.test(code),
      `${f} contains a hand-written per-plan map (growth_pro:) — read it from _plans.js instead`,
    )
    assert.ok(
      /require\('\.\/_plans'\)/.test(code),
      `${f} must read its limits from _plans.js`,
    )
    ok(`${f} carries no per-plan literal and reads _plans.js`)
  }

  // The exact fallback that granted radar a crawl.
  assert.ok(!/\?\?\s*1/.test(codeOf('seo-crawl.js')),
    'seo-crawl.js must not fall back to a 1-page allowance')
  assert.match(codeOf('seo-crawl.js'), /planLimit\('seoPages', client\?\.plan\)/,
    'seo-crawl.js must derive max pages from planLimit')
  ok('seo-crawl.js no longer defaults an unpriced plan to 1 page')
}

console.log(`\n${passed} checks passed.`)
console.log('NOT covered here (no DB, no HTTP): that the deployed functions serve')
console.log('these numbers. Only a build proves that.')
