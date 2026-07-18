/**
 * ping-sitemap.js — SCHEDULED: auto-notify search engines of new/changed pages.
 *
 * Runs daily (schedule set in netlify.toml). Fetches the live getbrandgeo.com
 * sitemap, diffs it against the `sitemap_pings` table (url -> lastmod), and pings
 * ONLY new or changed URLs through Google + IndexNow via the shared _indexing.js
 * helper. This is the automatic version of the manual force-index.js endpoint:
 * no key handling, no manual step, every future page (from a cPanel upload or a
 * content routine) gets notified on its own.
 *
 * Design notes:
 *  - State lives in Supabase (`sitemap_pings`), because Netlify functions have no
 *    persistent local filesystem across invocations.
 *  - A URL re-pings only when its <lastmod> in the sitemap changes, so a page is
 *    notified once per real update, not every day.
 *  - MAX_PINGS_PER_RUN keeps each run well under Google's ~200/day quota and
 *    inside the function timeout. On the very first run the table is empty, so all
 *    current sitemap URLs look "new"; they page through over a few runs in sitemap
 *    order (high-priority pages, which sit near the top, go first).
 *  - Honest scope caveat is in _indexing.js: Google's Indexing API officially
 *    prioritizes only job/broadcast pages; treat this as legitimate "this page
 *    exists" syndication (like sitemap submission), not a guaranteed fast-crawl.
 *  - Low-harm-by-design: it only ever pings getbrandgeo.com URLs drawn from our
 *    own sitemap, capped, and idempotent (nothing to re-ping once recorded), so
 *    it does not need an auth gate (same posture as the purge-* scheduled jobs).
 */

const { createClient } = require('@supabase/supabase-js')
const { createGoogleIndexer, submitToIndexNow } = require('./_indexing')

const SITEMAP_URL = 'https://getbrandgeo.com/sitemap.xml'
const MAX_PINGS_PER_RUN = 25   // under Google's ~200/day quota, and fits the timeout

/** Extract { url, lastmod } from each <url> block, preserving sitemap order. */
function parseSitemap(xml) {
  const out = []
  const re = /<url>([\s\S]*?)<\/url>/g
  let m
  while ((m = re.exec(xml))) {
    const block = m[1]
    const loc = (block.match(/<loc>\s*([^<]+?)\s*<\/loc>/) || [])[1]
    const lastmod = (block.match(/<lastmod>\s*([^<]+?)\s*<\/lastmod>/) || [])[1] || ''
    if (loc) out.push({ url: loc.trim(), lastmod: lastmod.trim() })
  }
  return out
}

exports.handler = async () => {
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)

  // 1. Fetch the live sitemap (cache-busted so a CDN copy can't hide a new page).
  let xml
  try {
    const r = await fetch(`${SITEMAP_URL}?ts=${Date.now()}`, { headers: { 'Cache-Control': 'no-cache' } })
    if (!r.ok) { console.error(`[ping-sitemap] sitemap fetch ${r.status}`); return { statusCode: 502, body: 'sitemap fetch failed' } }
    xml = await r.text()
  } catch (err) {
    console.error('[ping-sitemap] sitemap fetch threw:', err.message)
    return { statusCode: 502, body: 'sitemap fetch error' }
  }

  const entries = parseSitemap(xml)
  if (!entries.length) { console.warn('[ping-sitemap] no <url> entries parsed'); return { statusCode: 200, body: 'no urls' } }

  // 2. Load what we've already pinged (url -> lastmod).
  const { data: known, error: kErr } = await supabase.from('sitemap_pings').select('url, lastmod')
  if (kErr) { console.error('[ping-sitemap] db read failed:', kErr.message); return { statusCode: 500, body: 'db read failed' } }
  const seen = new Map((known || []).map(r => [r.url, r.lastmod || '']))

  // 3. New (unseen) or changed (lastmod differs) URLs, in sitemap order.
  const changed = entries.filter(e => seen.get(e.url) !== e.lastmod)
  if (!changed.length) { console.log('[ping-sitemap] nothing new/changed'); return { statusCode: 200, body: 'up to date' } }

  const toPing = changed.slice(0, MAX_PINGS_PER_RUN)

  // 4. One Google auth for the whole batch (token reused across publishes).
  let indexer
  try {
    indexer = await createGoogleIndexer()
  } catch (err) {
    console.error('[ping-sitemap] Google credentials unavailable:', err.code || err.message)
    return { statusCode: 500, body: 'google credentials unavailable' }
  }

  let pinged = 0
  const nowIso = new Date().toISOString()
  for (const e of toPing) {
    try {
      await indexer.publish(e.url, 'URL_UPDATED')          // throws on Google failure
      const bing = await submitToIndexNow(e.url)            // best-effort, never throws
      // Record only after Google accepted, so a transient failure retries next run
      // instead of being silently marked done.
      const { error: upErr } = await supabase
        .from('sitemap_pings')
        .upsert({ url: e.url, lastmod: e.lastmod, last_pinged_at: nowIso }, { onConflict: 'url' })
      if (upErr) console.error('[ping-sitemap] upsert failed for', e.url, upErr.message)
      pinged++
      console.log(`[ping-sitemap] pinged ${e.url} | google:ok | indexnow:${bing.ok ? 'ok' : (bing.skipped ? 'skipped' : 'failed')}`)
    } catch (err) {
      console.error(`[ping-sitemap] ping failed for ${e.url}:`, err.message)
      // Left unrecorded on purpose → retried on the next scheduled run.
    }
  }

  const deferred = changed.length - toPing.length
  console.log(`[ping-sitemap] done | pinged:${pinged}/${changed.length} changed${deferred > 0 ? ` (${deferred} deferred to next run)` : ''}`)
  return { statusCode: 200, body: JSON.stringify({ pinged, changed: changed.length, deferred }) }
}
