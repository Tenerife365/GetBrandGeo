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

  // 4. Google is OPTIONAL. IndexNow is not, and must never depend on it.
  //
  // This used to `return 500` the moment createGoogleIndexer() threw, before a
  // single IndexNow submission was attempted. When GOOGLE_JSON_KEY was dropped
  // on 2026-07-19 (4KB Lambda env ceiling, see docs), that took IndexNow down as
  // collateral damage for nine days: 22 sitemap URLs went unsubmitted and the
  // job wrote ok=false into job_runs every morning at 05:10.
  //
  // IndexNow needs no Google credential, costs ~32 bytes of env, and reaches
  // Bing, Yandex, Seznam and Naver. Google's Indexing API is in any case
  // documented as supported only for JobPosting and BroadcastEvent pages, which
  // BrandGEO has none of, so it is the *less* valuable of the two here.
  let indexer = null
  let googleSkipped = null
  try {
    indexer = await createGoogleIndexer()
  } catch (err) {
    googleSkipped = err.code || err.message
    console.warn('[ping-sitemap] Google unavailable, continuing with IndexNow only:', googleSkipped)
  }

  let pinged = 0, googleOk = 0, indexnowOk = 0
  const nowIso = new Date().toISOString()
  for (const e of toPing) {
    let gOk = false, gErr = null
    if (indexer) {
      try { await indexer.publish(e.url, 'URL_UPDATED'); gOk = true; googleOk++ }
      catch (err) { gErr = err.message }
    }
    const bing = await submitToIndexNow(e.url)   // best-effort, never throws
    if (bing.ok) indexnowOk++

    // Record once ANY endpoint accepted the URL. This was previously gated on
    // Google alone, which is the second half of the same bug: even if IndexNow
    // had been reached, nothing would have been written to sitemap_pings and
    // every URL would have been re-submitted on every run forever.
    if (gOk || bing.ok) {
      const { error: upErr } = await supabase
        .from('sitemap_pings')
        .upsert({ url: e.url, lastmod: e.lastmod, last_pinged_at: nowIso }, { onConflict: 'url' })
      if (upErr) console.error('[ping-sitemap] upsert failed for', e.url, upErr.message)
      pinged++
    }
    console.log(`[ping-sitemap] ${e.url}` +
      ` | google:${!indexer ? 'unconfigured' : gOk ? 'ok' : 'failed:' + gErr}` +
      ` | indexnow:${bing.ok ? 'ok' : bing.skipped ? 'unconfigured' : 'failed'}`)
  }

  // Only a total loss is a failed run. Google being absent is a deliberate
  // configuration choice as of 2026-07-28 and must not colour the job red,
  // otherwise the observability that packet 012 built is worthless noise.
  const deferred = changed.length - toPing.length
  const nothingConfigured = !indexer && !process.env.INDEXNOW_KEY
  console.log(`[ping-sitemap] done | recorded:${pinged}/${changed.length} | google:${googleOk} | indexnow:${indexnowOk}${deferred > 0 ? ` (${deferred} deferred)` : ''}`)
  await recordJobRun(supabase, !nothingConfigured, {
    pinged, changed: changed.length, deferred, googleOk, indexnowOk,
    ...(googleSkipped ? { google_skipped: googleSkipped } : {}),
    ...(nothingConfigured ? { error: 'neither GOOGLE_JSON_KEY nor INDEXNOW_KEY is configured' } : {}),
  })
  return {
    statusCode: nothingConfigured ? 500 : 200,
    body: JSON.stringify({ pinged, changed: changed.length, deferred, googleOk, indexnowOk }),
  }
}
