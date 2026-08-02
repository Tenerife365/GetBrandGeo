#!/usr/bin/env node
/**
 * check-social-channel-override.js
 *
 * Acceptance harness for the per-client AI Social channel override
 * (clients.social_channel_limit, db/supabase-social-channel-override-migration.sql).
 *
 * WHY A HARNESS. The thing this change is most likely to get wrong is not a
 * syntax error, it is DRIFT: socialChannelLimit() exists twice, once in
 * src/lib/planConfig.ts and once in netlify/functions/social-publish.js, and
 * this repository has already paid for a drifted mirror four times over
 * (_plans.js C1-C4, onboard-client.js VALID_PLANS). So the harness loads BOTH
 * copies for real and asserts they answer identically across the whole matrix,
 * rather than reading either one.
 *
 * The second thing it guards is the NULL semantic. NULL means "no override",
 * never zero. A `??`-style fallback would be correct; a truthiness test would
 * silently turn an explicit override of 0 into the plan value, and an `||`
 * would do the same. Both are tested.
 *
 * Run:  node scripts/check-social-channel-override.js
 * Exits 0 on PASS, 1 on FAIL.
 */
const path = require('path');
const fs = require('fs');
const os = require('os');

const ROOT = path.join(__dirname, '..');
const TS_SRC = path.join(ROOT, 'brandgeo-dashboard', 'src', 'lib', 'planConfig.ts');
const FN_SRC = path.join(ROOT, 'brandgeo-dashboard', 'netlify', 'functions', 'social-publish.js');

let pass = 0, fail = 0;
function check(name, actual, expected) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) { pass++; console.log(`  PASS  ${name}`); }
  else { fail++; console.log(`  FAIL  ${name}\n          expected ${JSON.stringify(expected)}\n          actual   ${JSON.stringify(actual)}`); }
}

// ---- load the TS copy ----------------------------------------------------
// planConfig.ts is dependency-free, so esbuild can transform it standalone.
// Bundling would be wrong here: it must be the real file, not a re-implementation.
function loadPlanConfig() {
  const esbuild = require(path.join(ROOT, 'brandgeo-dashboard', 'node_modules', 'esbuild'));
  const out = esbuild.transformSync(fs.readFileSync(TS_SRC, 'utf8'), {
    loader: 'ts', format: 'cjs', target: 'node18',
  });
  const tmp = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'bg-planconfig-')), 'planConfig.js');
  fs.writeFileSync(tmp, out.code);
  return require(tmp);
}

console.log('social channel override harness\n');

const planConfig = loadPlanConfig();
const fn = require(FN_SRC).__test__;

if (typeof planConfig.socialChannelLimit !== 'function') {
  console.log('  FAIL  planConfig.ts does not export socialChannelLimit');
  process.exit(1);
}
if (!fn || typeof fn.socialChannelLimit !== 'function') {
  console.log('  FAIL  social-publish.js does not export __test__.socialChannelLimit');
  process.exit(1);
}

const PLANS = ['free', 'radar', 'essentials', 'growth', 'growth_pro', 'managed', 'pro', 'enterprise'];

// ---- 1. the two ladders agree -------------------------------------------
// social-publish.js has no `radar` key (it predates the tier). That is only
// safe because radar is below AI_SOCIAL_MIN_RANK and its allowance is 0 either
// way, so the mirrors must still AGREE on the answer even where the shapes differ.
for (const p of PLANS) {
  check(
    `ladder agrees for ${p}`,
    fn.socialChannelLimit(p, null),
    planConfig.socialChannelLimit(p, null),
  );
}

// ---- 2. NULL means "no override", not zero ------------------------------
check('growth_pro, no override      -> plan value 3', planConfig.socialChannelLimit('growth_pro', null), 3);
check('growth_pro, undefined        -> plan value 3', planConfig.socialChannelLimit('growth_pro', undefined), 3);
check('growth_pro, override 4       -> 4', planConfig.socialChannelLimit('growth_pro', 4), 4);
check('growth_pro, override 0       -> 0, not 3', planConfig.socialChannelLimit('growth_pro', 0), 0);
check('fn: growth_pro, no override  -> 3', fn.socialChannelLimit('growth_pro', null), 3);
check('fn: growth_pro, override 4   -> 4', fn.socialChannelLimit('growth_pro', 4), 4);
check('fn: growth_pro, override 0   -> 0, not 3', fn.socialChannelLimit('growth_pro', 0), 0);

// ---- 3. the override does not leak across plans -------------------------
// A per-client override is per CLIENT. Reading it must not change what any
// other plan answers when it has none.
check('free, no override stays 0', planConfig.socialChannelLimit('free', null), 0);
check('growth, no override stays 1', planConfig.socialChannelLimit('growth', null), 1);
check('unknown plan, no override -> free', planConfig.socialChannelLimit('nonsense', null), 0);
check('fn: unknown plan, no override -> 0', fn.socialChannelLimit('nonsense', null), 0);

// ---- 4. garbage overrides fall back rather than propagate ---------------
// The column is CHECK (>= 0) so a negative cannot reach here from the database,
// but the readers must not trust that: a bad value falls back to the plan.
check('negative override falls back', planConfig.socialChannelLimit('growth_pro', -1), 3);
check('fn: negative override falls back', fn.socialChannelLimit('growth_pro', -1), 3);
check('string override falls back', planConfig.socialChannelLimit('growth_pro', '4'), 3);
check('fn: string override falls back', fn.socialChannelLimit('growth_pro', '4'), 3);

// ---- 5. INV-35: what BpR is actually sold -------------------------------
// Bucate pe Roate is clients.id = 1, growth_pro, social_channel_limit = 4.
check('INV-35: BpR gets 4 channels', planConfig.socialChannelLimit('growth_pro', 4), 4);
check('INV-35: every other growth_pro client still gets 3', planConfig.socialChannelLimit('growth_pro', null), 3);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
