#!/usr/bin/env node
/**
 * stripe-create-catalogue.js
 *
 * Builds the BrandGEO self-serve plan catalogue in Stripe LIVE mode:
 * three products, two prices each (monthly + annual in the SAME product), and
 * six payment links.
 *
 * Why a script rather than Dashboard clicking: metadata.plan has to be set on
 * every PRICE (not the product) or stripe-webhook.js cannot resolve the plan
 * and silently provisions nothing. That is the exact failure this catalogue
 * exists to avoid, and it is the easiest thing to miss by hand twelve times.
 *
 * SAFETY
 *   - Additive only. Creates nothing that already exists, archives nothing,
 *     deactivates nothing. The four payment links currently referenced by the
 *     live getbrandgeo.com keep working untouched.
 *   - Dry run by default. Pass --commit to actually write.
 *   - Refuses to run twice: skips any product whose name already exists.
 *
 * AUTH
 *   Uses your local Stripe CLI session. No API key is read, stored or printed
 *   by this script. Requires WRITE on Products, Prices and Payment Links in
 *   LIVE mode — a read-only restricted key will fail on the first create.
 *
 * USAGE
 *   node scripts/stripe-create-catalogue.js              # dry run
 *   node scripts/stripe-create-catalogue.js --commit     # create for real
 */

const { execFileSync } = require('node:child_process')

const COMMIT = process.argv.includes('--commit')

// Which Stripe CLI profile to target. REQUIRED, with no default, added
// 2026-08-02 for the RO -> ES account migration.
//
// Without it every command runs against the CLI's DEFAULT profile. On the day
// this was added that profile was still the OLD Romanian account, so a --commit
// run would have built a complete duplicate catalogue on the account being
// abandoned, reported success for every object, and been discovered only when
// the new account turned out to be empty. Defaulting to "whatever the CLI
// happens to be logged into" is not a safe default on a live money path, so
// there is no default: the flag is mandatory and its absence is a hard exit.
const PROFILE = (() => {
  const i = process.argv.indexOf('--project-name')
  const v = i > -1 ? process.argv[i + 1] : null
  if (!v || v.startsWith('--')) {
    console.error('ERROR: --project-name <profile> is required.\n'
      + '  This script writes LIVE Stripe objects and will not guess which account.\n'
      + '  Confirm the profile first:\n'
      + '    stripe get /v1/account --live --project-name <profile>\n'
      + '  and check the returned id and country before passing it here.')
    process.exit(1)
  }
  return v
})()

/* ── Catalogue definition ──────────────────────────────────────────────────
 * Annual is 10x monthly across every tier, matching the two that already
 * exist (99 -> 990, 299 -> 2990). Growth PRO's 4490 was confirmed by the
 * owner on 2026-07-28.
 *
 * automaticTax is FALSE on every link: BrandGEO invoices from the Canary
 * Islands, which sit outside the EU VAT area, so no VAT is collected. This
 * differs from the four existing links, which carry automatic_tax=true against
 * an active ES registration. Those predate the decision. See the note printed
 * at the end of this script.
 */
const AUTOMATIC_TAX = false

const CATALOGUE = [
  {
    plan: 'essentials',
    name: 'BrandGEO Essentials',
    description: 'AI visibility monitoring across ChatGPT, Gemini and Claude.',
    monthly: 9900,
    annual: 99000,
  },
  {
    plan: 'growth',
    name: 'BrandGEO Growth',
    // CORRECTED 2026-08-02. This read "across four engines" and was wrong from
    // 2026-07-28, when Growth gained google_ai (planConfig.ts, commit 9b6bbe3)
    // and went to five. The old account is still serving the wrong claim on a
    // description customers read at checkout. Not carried across.
    //
    // NOTE, and it is a strategy question rather than a copy one: this now
    // reads almost identically to Growth PRO, because the two tiers DO have
    // identical engine coverage. EUR 449 over EUR 299 buys prompts and a faster
    // refresh, nothing else. That is open decision 1 in CLAUDE.md and is not
    // settled here; this line only stops the catalogue stating a falsehood.
    description: 'AI visibility monitoring across all five engines, including Google AI Mode, with competitor tracking.',
    monthly: 29900,
    annual: 299000,
  },
  {
    plan: 'growth_pro',
    name: 'BrandGEO Growth PRO',
    description: 'AI visibility monitoring across all five engines, including Google AI Mode.',
    monthly: 44900,
    annual: 449000,
  },
  // Radar, added to this script 2026-08-02. It was created by hand on
  // 2026-07-29, AFTER this script last ran, so the script built three products
  // where the ladder now sells four and would have silently under-built the new
  // account. Mirrors the live price exactly: a migration is the wrong moment to
  // reprice anything.
  //
  // MONTHLY ONLY, deliberately. There is no annual Radar price or link on the
  // old account, and inventing one here would put a tier on sale that has never
  // been ruled on.
  {
    plan: 'radar',
    name: 'BrandGEO Radar',
    description: 'AI visibility monitoring on Gemini and Claude across 7 buyer prompts for one website, with a fresh check available every week.',
    monthly: 2900,
    annual: null,
    // Carried from the live price so the EUR 29 is not later mistaken for the
    // list price. Ruled 2026-07-31: list EUR 39, EUR 29 for the first 100.
    priceMetadata: { note: 'launch price, first 100 customers; list is EUR 39' },
  },
]

// ── Stripe CLI helpers ──────────────────────────────────────────────────────

// On Windows the Stripe CLI is commonly an npm shim (stripe.cmd). Node's
// execFileSync will not resolve .cmd or run it without a shell, so route
// through one there and quote any argument containing whitespace.
//
// Node emits DEP0190 for shell:true with an args array, because it cannot
// guarantee escaping. Accepted here on a narrow ground: every argument this
// script passes is a literal defined in CATALOGUE above or a Stripe-generated
// id read back from the API. Nothing reaches the shell from argv, stdin, a
// file or the network. If this script ever takes external input, drop the
// shell and resolve the real binary instead of widening the quoting.
const IS_WIN = process.platform === 'win32'
const STRIPE_BIN = IS_WIN ? 'stripe.cmd' : 'stripe'
const quote = (a) => (IS_WIN && /[\s"]/.test(a) ? `"${String(a).replace(/"/g, '\\"')}"` : a)

function stripe(args) {
  // Appended to EVERY invocation, reads and writes alike. The existence check
  // in main() must interrogate the same account it is about to write to, or it
  // would find the old catalogue, skip every tier, and report a no-op success
  // against an account that is actually empty.
  const withProfile = [...args, '--project-name', PROFILE]
  const out = execFileSync(STRIPE_BIN, IS_WIN ? withProfile.map(quote) : withProfile, {
    encoding: 'utf8',
    maxBuffer: 20 * 1024 * 1024,
    shell: IS_WIN,
    // Git Bash rewrites leading-slash args into Windows paths, which mangles
    // /v1/... endpoints. Harmless for the sub-commands used here, set anyway.
    env: { ...process.env, MSYS_NO_PATHCONV: '1' },
  })
  const start = out.indexOf('{')
  if (start < 0) throw new Error(`unexpected stripe output: ${out.slice(0, 200)}`)
  const json = JSON.parse(out.slice(start))
  if (json.error) throw new Error(json.error.message)
  return json
}

function listAll(resource) {
  return stripe([resource, 'list', '--limit', '100', '--live']).data
}

// ── Run ─────────────────────────────────────────────────────────────────────

function main() {
  console.log(COMMIT ? '=== LIVE RUN — writing to Stripe ===\n' : '=== DRY RUN — nothing will be written (pass --commit) ===\n')

  const existingProducts = listAll('products')
  const created = { products: [], prices: [], links: [] }

  for (const tier of CATALOGUE) {
    const already = existingProducts.find((p) => p.name === tier.name && p.active)
    if (already) {
      console.log(`SKIP  product "${tier.name}" already exists (${already.id})`)
      continue
    }

    console.log(`\n--- ${tier.name} (plan=${tier.plan}) ---`)

    // A tier with annual === null is monthly only (Radar). Building this list
    // once, above both branches, is what keeps the dry run honest: when the two
    // were written out separately the preview claimed two prices and two links
    // for every tier regardless, so a monthly-only tier would have been
    // reported wrongly by the very output meant to catch that.
    const intervals = [['month', tier.monthly]]
    if (tier.annual) intervals.push(['year', tier.annual])

    if (!COMMIT) {
      console.log(`  would create product  ${tier.name}`)
      for (const [interval, amount] of intervals) {
        console.log(`  would create price    EUR ${amount / 100}/${interval}  metadata.plan=${tier.plan}`)
      }
      console.log(`  would create ${intervals.length} payment link(s) (automatic_tax=${AUTOMATIC_TAX})`)
      continue
    }

    const product = stripe([
      'products', 'create', '--live',
      '--name', tier.name,
      '--description', tier.description,
      '-d', `metadata[plan]=${tier.plan}`,
    ])
    console.log(`  product  ${product.id}`)
    created.products.push(product)

    for (const [interval, amount] of intervals) {
      const price = stripe([
        'prices', 'create', '--live',
        '--product', product.id,
        '--currency', 'eur',
        '--unit-amount', String(amount),
        '-d', `recurring[interval]=${interval}`,
        // The load-bearing line. stripe-webhook.js reads price.metadata.plan
        // before falling back to its hardcoded PRICE_TO_PLAN map.
        '-d', `metadata[plan]=${tier.plan}`,
        // Mirrors the live prices, which carry the interval in price metadata
        // as well as on the link. Cheap, and it makes a price self-describing
        // in a list view where the recurring block is not shown.
        '-d', `metadata[interval]=${interval}`,
        ...Object.entries(tier.priceMetadata || {}).flatMap(([k, v]) => ['-d', `metadata[${k}]=${v}`]),
        '--tax-behavior', 'exclusive',
      ])
      console.log(`  price    ${price.id}  EUR ${amount / 100}/${interval}  plan=${price.metadata.plan}`)
      created.prices.push({ ...price, plan: tier.plan, interval })

      const link = stripe([
        'payment_links', 'create', '--live',
        '-d', `line_items[0][price]=${price.id}`,
        '-d', 'line_items[0][quantity]=1',
        '-d', `automatic_tax[enabled]=${AUTOMATIC_TAX}`,
        '-d', 'billing_address_collection=required',
        '-d', `metadata[plan]=${tier.plan}`,
        '-d', `metadata[interval]=${interval}`,
      ])
      console.log(`  link     ${link.url}`)
      created.links.push({ url: link.url, plan: tier.plan, interval })
    }
  }

  if (!COMMIT) {
    console.log('\nDry run complete. Re-run with --commit to create.')
    return
  }

  // Emit the exact block to paste into brandgeo/web/site.js.
  if (created.links.length) {
    const byPlan = {}
    for (const l of created.links) {
      byPlan[l.plan] = byPlan[l.plan] || {}
      byPlan[l.plan][l.interval === 'month' ? 'monthly' : 'annual'] = l.url
    }
    console.log('\n\n=== paste into brandgeo/web/site.js, replacing STRIPE_LINKS ===\n')
    console.log('  var STRIPE_LINKS = {')
    console.log(Object.entries(byPlan).map(([plan, v]) =>
      `    ${plan}: {\n      monthly: '${v.monthly}',\n      annual:  '${v.annual}'\n    }`).join(',\n'))
    console.log('  };')

    console.log('\n\n=== add to PRICE_TO_PLAN in stripe-webhook.js (fallback only) ===\n')
    for (const p of created.prices) console.log(`  ${p.id}: '${p.plan}',`)
  }

  console.log(`
=== NOT DONE BY THIS SCRIPT, ON PURPOSE ===

1. The old payment links are still ACTIVE and the live getbrandgeo.com still
   points at them. Deploy the updated site.js to cPanel FIRST, then deactivate
   the old links and archive the old products. Doing it the other way round
   kills every Subscribe button on the live site.

2. Old objects to retire once the site is deployed:
     - products: Essentials Monthly, Essentials Annual (x2), Growth Monthly,
       Growth Annual
     - price_1TrLQPKh2GaZE2B46tqNDQYm  EUR 990 per MONTH, mislabelled
       "Essentials Annual" — archive this one whatever else you decide
     - the legacy "Launch" product (EUR 125 setup, EUR 375/mo, 2022-era)

3. TAX: these links were created with automatic_tax=${AUTOMATIC_TAX}, per the
   Canary Islands decision. The four PRE-EXISTING links still have
   automatic_tax=true against an active ES registration, and terms.html still
   publishes the Spain/IVA/reverse-charge wording. Config, terms and stated
   practice need to agree before the first sale. Confirm with your accountant.
`)
}

try {
  main()
} catch (err) {
  console.error('\nFAILED:', err.message)
  console.error('\nIf this is a permissions error, the CLI key needs WRITE on')
  console.error('Products, Prices and Payment Links in LIVE mode.')
  process.exit(1)
}
