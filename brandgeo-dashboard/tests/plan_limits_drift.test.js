/**
 * plan_limits_drift.test.js — pins the server-side plan-limit mirror in
 * netlify/functions/_plans.js to src/lib/planConfig.ts, the source of truth.
 * Run: `node tests/plan_limits_drift.test.js` (exits non-zero on failure).
 *
 * WHY THIS EXISTS. On 2026-07-31 three Netlify functions each carried their own
 * hand-written copy of the plan ladder and all three were wrong:
 *   - seo-crawl.js `CRAWL_PAGE_CAP` said essentials: 1 against planConfig.ts's 0
 *     (AI SEO moved to Growth+ on 2026-07-29), and had no `radar` row. It read
 *     the map with `?? 1`, so Radar, which the ruling grants zero SEO, was
 *     handed a 1-page crawl BY THE FALLBACK.
 *   - seo-draft.js `DRAFT_MONTHLY_CAP` said essentials: 2 against 0, same cause.
 *   - social-publish.js `PLAN_RANK` was a second copy of planRank() with every
 *     rank off by one after `radar` was inserted at position 1.
 * None of it failed anything. A cap nobody enforces is a display bug; these caps
 * ARE the entitlement gate (seo-crawl.js has no hasFeature() call, it refuses on
 * `maxPages <= 0`), so drift here gives a paid feature away silently.
 *
 * WHAT IT CHECKS. Three things, in order of what actually broke:
 *   1. every value in _plans.js PLAN_LIMITS equals its planConfig.ts twin;
 *   2. planLimit() fails CLOSED — unknown plan gets 0, not a default allowance;
 *   3. the three functions no longer hand-write a ladder, so 1 and 2 bind.
 *
 * WHAT IT CANNOT DO. It does not hit Supabase or Netlify, so it cannot prove a
 * live Radar tenant is refused. That is the SQL/HTTP check in the handoff.
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
  // Guard the guard: if a limit table is added to _plans.js and not listed here,
  // this file would silently stop covering it.
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
    // A plan priced in planConfig.ts but absent from the mirror is the `radar`
    // defect exactly, so compare key SETS, not just the values we happen to hold.
    assert.deepStrictEqual(
      Object.keys(PLAN_LIMITS[key]).sort(), Object.keys(truth).sort(),
      `${key} and ${exportName} cover different plans`,
    )
    ok(`${key} matches ${exportName} for all ${PLAN_ORDER.length} plans`)
  }
}

console.log('\n2. The ladder itself, and the specific values the ruling fixed')
{
  const truthOrder = /export const PLAN_ORDER: Plan\[\] = \[([^\]]*)\]/.exec(planConfig)
  assert.ok(truthOrder, 'could not find PLAN_ORDER in planConfig.ts')
  const parsed = [...truthOrder[1].matchAll(/'(\w+)'/g)].map((m) => m[1])
  // Index for index: planRank() reads the INDEX, and social-publish.js now gates
  // AI Social on it. A reordering here is a silent entitlement change.
  assert.deepStrictEqual(PLAN_ORDER, parsed, 'PLAN_ORDER has drifted from planConfig.ts')
  ok(`PLAN_ORDER matches index for index (${PLAN_ORDER.join(' < ')})`)

  // The two defects this change closed, asserted as values rather than trusting
  // the parity loop to have covered them.
  assert.strictEqual(planLimit('seoPages', 'radar'), 0, 'Radar must get no SEO crawl')
  assert.strictEqual(planLimit('seoDraftsPerMonth', 'radar'), 0, 'Radar must get no SEO drafts')
  ok('radar gets 0 SEO pages and 0 drafts (sprint-ladder-ruling.md decision 1)')

  assert.strictEqual(planLimit('seoPages', 'essentials'), 0, 'AI SEO is Growth+, not Essentials')
  assert.strictEqual(planLimit('seoDraftsPerMonth', 'essentials'), 0, 'AI SEO is Growth+, not Essentials')
  ok('essentials gets 0 SEO pages and 0 drafts (AI SEO moved to Growth+ 2026-07-29)')

  assert.strictEqual(planLimit('seoPages', 'growth'), 10)
  assert.strictEqual(planLimit('seoPages', 'growth_pro'), 30)
  ok('the paid SEO tiers are unchanged: growth 10, growth_pro 30')

  // AI Social's gate is a rank comparison, so radar must sort BELOW growth.
  assert.ok(planRank('radar') < planRank('growth'), 'radar must rank below growth')
  assert.strictEqual(planLimit('socialChannels', 'radar'), 0, 'Radar must get no social channels')
  ok('radar ranks below growth and gets 0 social channels')
}

console.log('\n3. planLimit() fails closed, which is the actual defect')
{
  // The `?? 1` in seo-crawl.js was the whole bug: a plan the map had never heard
  // of was GRANTED an allowance. Every unknown must resolve to 0.
  for (const unknown of ['radar_plus', 'legacy_gold', '', 'FREE', 'growth ', null, undefined, 0, {}]) {
    assert.strictEqual(
      planLimit('seoPages', unknown), 0,
      `unknown plan ${JSON.stringify(unknown)} must get 0 pages, never a default allowance`,
    )
  }
  ok('an unknown, empty, mistyped or non-string plan gets 0 on every limit')

  // A typo in our own code must be loud, not a silent lockout of a paying tenant.
  assert.throws(() => planLimit('seoPagez', 'growth'), /unknown limit/,
    'an unknown limit name must throw, not return 0')
  ok('an unknown limit name throws instead of silently returning 0')

  // Completeness assertion at module load: every plan priced in every table.
  for (const [key, table] of Object.entries(PLAN_LIMITS)) {
    for (const plan of PLAN_ORDER) {
      assert.strictEqual(typeof table[plan], 'number', `${key}.${plan} must be a number`)
    }
  }
  ok('every plan in PLAN_ORDER is priced in every limit table')
}

console.log('\n4. No function hand-writes the ladder any more')
{
  // Strip comments before every source assertion in this block: these files
  // DESCRIBE the deleted maps and the deleted fallback on purpose, so a grep over
  // raw source matches the explanation and hides a real reintroduction. Caught by
  // this test failing on its own first run against the fixed code.
  const codeOf = (f) => read(`netlify/functions/${f}`)
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')

  const FILES = ['seo-crawl.js', 'seo-draft.js', 'social-publish.js']
  for (const f of FILES) {
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

  // The exact fallback that granted Radar a crawl.
  const crawl = codeOf('seo-crawl.js')
  assert.ok(!/\?\?\s*1/.test(crawl), 'seo-crawl.js must not fall back to a 1-page allowance')
  assert.match(crawl, /planLimit\('seoPages', client\?\.plan\)/,
    'seo-crawl.js must derive max pages from planLimit')
  ok('seo-crawl.js no longer defaults an unpriced plan to 1 page')
}

console.log(`\n${passed} checks passed.`)
console.log('NOT covered here (no DB, no HTTP): that a live Radar tenant is actually')
console.log('refused by the deployed function. See the curl/SQL check in the handoff.')
