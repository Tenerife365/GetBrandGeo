#!/usr/bin/env node
/**
 * stripe-retire-catalogue.js
 *
 * Retires the superseded BrandGEO catalogue in Stripe LIVE mode: deactivates
 * the old payment links, archives the old products, and archives stray prices.
 *
 * Counterpart to scripts/stripe-create-catalogue.js, which was additive by
 * design and deliberately left every old object alive so the live site kept
 * working during the deploy window. That window is closed: getbrandgeo.com has
 * served site.js?v=2026-07-28a with the new six links since 2026-07-28.
 *
 * SAFETY, in order of how much each one matters
 *
 *   1. It cannot retire anything the live site still points at. Before touching
 *      a single object it downloads https://getbrandgeo.com/site.js and extracts
 *      every buy.stripe.com URL. Any link in that set is untouchable, whatever
 *      else this script believes. If the fetch fails, the script aborts rather
 *      than guessing. This is the guard that makes the whole thing safe: the
 *      deployed site is the authority, not a hardcoded list that can drift.
 *   2. Preflight refuses to run unless all six current prices are active AND
 *      each is reachable through an active payment link. Retiring the old
 *      catalogue while the new one is broken would leave nothing to buy.
 *   3. Dry run by default. Pass --commit to write.
 *   4. Archive and deactivate only. Nothing is deleted; Stripe keeps archived
 *      objects and existing subscriptions on them continue to bill normally.
 *      Retiring a price never cancels a subscription already using it.
 *
 * AUTH
 *   Uses your local Stripe CLI session. No API key is read, stored or printed.
 *   Needs WRITE on Products, Prices and Payment Links in LIVE mode.
 *
 * USAGE
 *   node scripts/stripe-retire-catalogue.js            # dry run
 *   node scripts/stripe-retire-catalogue.js --commit   # retire for real
 */

const { execFileSync } = require('node:child_process')

const COMMIT = process.argv.includes('--commit')
const SITE_JS = 'https://getbrandgeo.com/site.js'

/* The current catalogue. Source of truth is PRICE_TO_PLAN in
 * brandgeo-dashboard/netlify/functions/stripe-webhook.js lines 41-46. These six
 * are never retired by this script, and their presence is a precondition. */
const KEEP_PRICES = {
  price_1Ty5ZyKh2GaZE2B4UBLxnzdc: 'essentials  EUR 99/mo',
  price_1Ty5a0Kh2GaZE2B4cRsrKalr: 'essentials  EUR 990/yr',
  price_1Ty5a3Kh2GaZE2B4WSWURHv8: 'growth      EUR 299/mo',
  price_1Ty5a5Kh2GaZE2B4NivZ8zmd: 'growth      EUR 2,990/yr',
  price_1Ty5a7Kh2GaZE2B4vQhoTktV: 'growth_pro  EUR 449/mo',
  price_1Ty5a9Kh2GaZE2B4ibycxUST: 'growth_pro  EUR 4,490/yr',
}

/* Products that are NOT part of the plan ladder and must survive this script.
 *
 * The add-ons are a live, separately sold product line: terms.html sells them
 * under "Managed & Enterprise add-ons", and their prices are the price_1TrNy
 * and price_1TrNz block (EUR 40/120/150/200/250 monthly, EUR 400/1,200/1,500/
 * 2,000/2,500 yearly). The first live dry run listed all five products and all
 * ten prices
 * for archival, because the naive rule was "anything not backed by a current
 * plan price is stale". That rule is wrong for anything sold outside the
 * ladder. Caught before committing, on 2026-07-28.
 *
 * A protected product also protects its prices, otherwise archiving the price
 * kills the add-on just as dead as archiving the product would. */
const PROTECTED_PRODUCT_PATTERNS = [
  /add-?on/i,
]

/* Legacy fallback entries to delete from PRICE_TO_PLAN once this has run. They
 * are listed for the closing report only; this script does not edit source. */
const LEGACY_FALLBACK_IDS = [
  'price_1TrLPgKh2GaZE2B4kqgmQsiO',
  'price_1TrLSeKh2GaZE2B48iVobXF9',
  'price_1TrLQhKh2GaZE2B4gLPWMger',
  'price_1TrLR6Kh2GaZE2B4mYqOHBhQ',
]

// ── Stripe CLI helpers (same Windows shim handling as the create script) ─────
const IS_WIN = process.platform === 'win32'
const STRIPE_BIN = IS_WIN ? 'stripe.cmd' : 'stripe'
const quote = (a) => (IS_WIN && /[\s"]/.test(a) ? `"${String(a).replace(/"/g, '\\"')}"` : a)

function stripe(args) {
  const out = execFileSync(STRIPE_BIN, IS_WIN ? args.map(quote) : args, {
    encoding: 'utf8',
    maxBuffer: 20 * 1024 * 1024,
    shell: IS_WIN,
    env: { ...process.env, MSYS_NO_PATHCONV: '1' },
  })
  const start = out.indexOf('{')
  if (start < 0) throw new Error(`unexpected stripe output: ${out.slice(0, 200)}`)
  const json = JSON.parse(out.slice(start))
  if (json.error) throw new Error(json.error.message)
  return json
}

const listAll = (resource, extra = []) => stripe([resource, 'list', '--limit', '100', '--live', ...extra]).data

/* Resolve the price behind a payment link.
 *
 * The list endpoint does NOT include line_items unless asked, and even with
 * --expand data.line_items the CLI has been seen to return links without them.
 * A null here is dangerous in both directions: it can make a live link look
 * retirable, or make the whole preflight fail as it did on the first live run.
 * So: expanded list first, then a per-link retrieve as a fallback, and cache
 * the answer so a hundred links do not become a hundred extra API calls. */
const priceCache = new Map()
function linkPriceId(link) {
  if (priceCache.has(link.id)) return priceCache.get(link.id)
  let id = link.line_items?.data?.[0]?.price?.id || null
  if (!id) {
    try {
      const full = stripe(['payment_links', 'retrieve', link.id, '--live', '--expand', 'line_items'])
      id = full.line_items?.data?.[0]?.price?.id || null
    } catch (err) {
      console.warn(`  warn: could not resolve price for ${link.id}: ${err.message}`)
      id = null
    }
  }
  priceCache.set(link.id, id)
  return id
}

// ── Guard 1: what does the deployed site actually sell? ─────────────────────

async function liveCheckoutUrls() {
  const res = await fetch(`${SITE_JS}?cachebust=${Date.now()}`, {
    headers: { 'Cache-Control': 'no-store' },
  })
  if (!res.ok) throw new Error(`could not read ${SITE_JS} (HTTP ${res.status})`)
  const body = await res.text()
  const urls = new Set((body.match(/https:\/\/buy\.stripe\.com\/[A-Za-z0-9]+/g) || []))
  if (urls.size === 0) throw new Error(`no buy.stripe.com URLs found in ${SITE_JS}; refusing to guess`)
  return urls
}

// ── Run ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log(COMMIT
    ? '=== LIVE RUN, retiring the old catalogue ===\n'
    : '=== DRY RUN, nothing will be written (pass --commit) ===\n')

  const liveUrls = await liveCheckoutUrls()
  console.log(`Live site.js currently sells ${liveUrls.size} checkout links. These are untouchable.\n`)

  // Ask for line_items up front. If this CLI build rejects the expand, fall
  // back to a plain list; linkPriceId() then resolves each link individually.
  let links
  try {
    links = listAll('payment_links', ['--expand', 'data.line_items'])
  } catch (err) {
    console.warn(`  warn: expanded payment_links list failed (${err.message}), falling back to per-link lookup`)
    links = listAll('payment_links')
  }
  const products = listAll('products')
  const prices = listAll('prices')

  // Guard 2: the new catalogue must be intact before we retire the old one.
  const problems = []
  for (const [id, label] of Object.entries(KEEP_PRICES)) {
    const p = prices.find((x) => x.id === id)
    if (!p) problems.push(`current price missing entirely: ${id} (${label})`)
    else if (!p.active) problems.push(`current price is archived: ${id} (${label})`)
  }
  const liveLinks = links.filter((l) => l.active && liveUrls.has(l.url))
  for (const [id, label] of Object.entries(KEEP_PRICES)) {
    if (!liveLinks.some((l) => linkPriceId(l) === id)) {
      problems.push(`no active, live-referenced payment link resolves to ${id} (${label})`)
    }
  }
  if (problems.length) {
    console.error('PREFLIGHT FAILED. Refusing to retire anything.\n')
    problems.forEach((p) => console.error('  - ' + p))
    console.error('\nNote: payment_links list does not expand line_items by default. If every')
    console.error('price shows "no active link", re-check with:')
    console.error('  stripe payment_links list --live --expand data.line_items')
    process.exit(1)
  }
  console.log('Preflight OK: all six current prices are active and reachable from the live site.\n')

  // Retire links the live site does not reference.
  const staleLinks = links.filter((l) => l.active && !liveUrls.has(l.url))
  const keepPriceIds = new Set(Object.keys(KEEP_PRICES))

  // A product is protected if it backs one of the six current plan prices, or
  // if its name matches a PROTECTED_PRODUCT_PATTERNS entry. Protecting the
  // product also protects every price under it.
  const protectedProductIds = new Set(products.filter((p) =>
    prices.some((pr) => keepPriceIds.has(pr.id) && pr.product === p.id) ||
    PROTECTED_PRODUCT_PATTERNS.some((re) => re.test(p.name || ''))
  ).map((p) => p.id))

  const staleProducts = products.filter((p) => p.active && !protectedProductIds.has(p.id))
  const stalePrices = prices.filter((pr) => pr.active &&
    !keepPriceIds.has(pr.id) && !protectedProductIds.has(pr.product))

  const protectedNames = products
    .filter((p) => p.active && protectedProductIds.has(p.id) &&
      PROTECTED_PRODUCT_PATTERNS.some((re) => re.test(p.name || '')))
    .map((p) => p.name)
  if (protectedNames.length) {
    console.log(`--- protected, will NOT be touched (${protectedNames.length}) ---`)
    protectedNames.forEach((n) => console.log('  ' + n))
    console.log()
  }

  const report = (title, rows) => {
    console.log(`--- ${title} (${rows.length}) ---`)
    if (!rows.length) console.log('  nothing')
    rows.forEach((r) => console.log('  ' + r))
    console.log()
  }
  report('payment links to deactivate', staleLinks.map((l) => `${l.id}  ${l.url}`))
  report('products to archive', staleProducts.map((p) => `${p.id}  ${p.name}`))
  report('prices to archive', stalePrices.map((pr) =>
    `${pr.id}  ${pr.currency.toUpperCase()} ${(pr.unit_amount ?? 0) / 100}` +
    `${pr.recurring ? '/' + pr.recurring.interval : ' one-time'}` +
    (pr.id === 'price_1TrLQPKh2GaZE2B46tqNDQYm' ? '   <-- EUR 990 per MONTH, mislabelled "Essentials Annual"' : '')))

  if (!COMMIT) {
    console.log('Dry run complete. Re-run with --commit to apply.')
    return
  }

  for (const l of staleLinks) {
    stripe(['payment_links', 'update', l.id, '--live', '-d', 'active=false'])
    console.log(`deactivated link     ${l.id}`)
  }
  for (const pr of stalePrices) {
    stripe(['prices', 'update', pr.id, '--live', '-d', 'active=false'])
    console.log(`archived price       ${pr.id}`)
  }
  for (const p of staleProducts) {
    stripe(['products', 'update', p.id, '--live', '-d', 'active=false'])
    console.log(`archived product     ${p.id}  ${p.name}`)
  }

  console.log(`
=== STILL TO DO BY HAND ===

1. Delete the four superseded fallback entries from PRICE_TO_PLAN in
   brandgeo-dashboard/netlify/functions/stripe-webhook.js (lines 48-55), now
   that their links are dead and no new subscription can reference them:
${LEGACY_FALLBACK_IDS.map((id) => '     ' + id).join('\n')}

   Leave the six current entries. They are the fallback for a price whose
   metadata.plan goes missing, which is the failure this map exists to catch.

2. Existing subscriptions on the archived prices keep billing at their agreed
   amount. Archiving stops new sales, it does not touch anyone already paying.
   Check for live subscribers before assuming this changed nothing:
     stripe subscriptions list --live --limit 100
`)
}

main().catch((err) => {
  console.error('\nFAILED:', err.message)
  console.error('\nIf this is a permissions error, the CLI key needs WRITE on')
  console.error('Products, Prices and Payment Links in LIVE mode.')
  process.exit(1)
})
