/**
 * ping-sitemap.js — daily cron job: auto-notify search engines of new/changed pages.
 *
 * Runs daily at 05:10 UTC, invoked by Supabase pg_cron over pg_net
 * (db/supabase-scheduled-jobs-migration.sql) and authenticated by the X-Cron-Key
 * shared secret (_cron_auth.js). Fetches the live getbrandgeo.com sitemap, diffs
 * it against the `sitemap_pings` table (url -> lastmod), and pings ONLY new or
 * changed URLs through Google + IndexNow via the shared _indexing.js helper.
 * This is the automatic version of the manual force-index.js endpoint: no manual
 * step, every future page (from a cPanel upload or a content routine) gets
 * notified on its own.
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
 *    own sitemap, capped, and idempotent (nothing to re-ping once recorded).
 *    That is still true, and it is still not a substitute for auth — this file
 *    used to say it "does not need an auth gate" for exactly that reason, which
 *    left an anonymous caller able to burn a rate-limited Google quota
 *    (docs/qa/deploy-pipeline-netlify.md F1). It is gated now.
 */

const { createClient } = require('@supabase/supabase-js')
const { createGoogleIndexer, submitToIndexNow } = require('./_indexing')
const { requireCronAuth } = require('./_cron_auth')

const SITEMAP_URL = 'https://getbrandgeo.com/sitemap.xml'
const MAX_PINGS_PER_RUN = 25   // under Google's ~200/day quota, and fits the timeout

// One row per invocation, success or failure (arch doc §6.4). Wrapped so an
// observability write can never fail the job it is observing. This is what will
// finally surface the broken Google credential (arch doc §9 item 6) daily in
// SQL instead of in a log nobody reads.
// Handles both failure shapes: supabase-js RETURNS { error } for a database-level
// failure (missing table, RLS denial) and only THROWS at the network layer. Since
// this job's whole value here is making a silent failure loud, swallowing its own
// silent failure would be self-defeating.
async function recordJobRun(supabase, ok, detail) {
  try {
    const { error } = await supabase.from('job_runs').insert({ job: 'ping-sitemap', ok, detail })
    if (error) console.error('[ping-sitemap] job_runs write failed:', error.message)
  } catch (err) {
    console.error('[ping-sitemap] job_runs write threw:', err.message)
  }
}

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

exports.handler = async (event) => {
  const gate = requireCronAuth(event)
  if (gate) return gate.response

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)

  // 1. Fetch the live sitemap (cache-busted so a CDN copy can't hide a new page).
  let xml
  try {
    const r = await fetch(`${SITEMAP_URL}?ts=${Date.now()}`, { headers: { 'Cache-Control': 'no-cache' } })
    if (!r.ok) {
      console.error(`[ping-sitemap] sitemap fetch ${r.status}`)
      await recordJobRun(supabase, false, { stage: 'sitemap_fetch', status: r.status })
      return { statusCode: 502, body: 'sitemap fetch failed' }
    }
    xml = await r.text()
  } catch (err) {
    console.error('[ping-sitemap] sitemap fetch threw:', err.message)
    await recordJobRun(supabase, false, { stage: 'sitemap_fetch', error: err.message })
    return { statusCode: 502, body: 'sitemap fetch error' }
  }

  const entries = parseSitemap(xml)
  if (!entries.length) {
    console.warn('[ping-sitemap] no <url> entries parsed')
    await recordJobRun(supabase, true, { pinged: 0, changed: 0, note: 'no urls parsed' })
    return { statusCode: 200, body: 'no urls' }
  }

  // 2. Load what we've already pinged (url -> lastmod).
  const { data: known, error: kErr } = await supabase.from('sitemap_pings').select('url, lastmod')
  if (kErr) {
    console.error('[ping-sitemap] db read failed:', kErr.message)
    await recordJobRun(supabase, false, { stage: 'db_read', error: kErr.message })
    return { statusCode: 500, body: 'db read failed' }
  }
  const seen = new Map((known || []).map(r => [r.url, r.lastmod || '']))

  // 3. New (unseen) or changed (lastmod differs) URLs, in sitemap order.
  const changed = entries.filter(e => seen.get(e.url) !== e.lastmod)
  if (!changed.length) {
    console.log('[ping-sitemap] nothing new/changed')
    await recordJobRun(supabase, true, { pinged: 0, changed: 0, deferred: 0 })
    return { statusCode: 200, body: 'up to date' }
  }

  const toPing = changed.slice(0, MAX_PINGS_PER_RUN)

  // 4. One Google auth for the whole batch (token reused across publishes).
  let indexer
  try {
    indexer = await createGoogleIndexer()
  } catch (err) {
    console.error('[ping-sitemap] Google credentials unavailable:', err.code || err.message)
    await recordJobRun(supabase, false, { stage: 'google_auth', changed: changed.length, error: err.code || err.message })
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
  await recordJobRun(supabase, true, { pinged, changed: changed.length, deferred })
  return { statusCode: 200, body: JSON.stringify({ pinged, changed: changed.length, deferred }) }
}
