// ============================================================================
// seo-crawl.js  --  AI SEO Phase 2: kick off a site crawl for a client.
//
// Synchronous, authenticated trigger. It records a seo_crawls run row, then
// fires the seo-crawl-background worker (up to 15 min) fire-and-forget, and
// returns the crawl_id so the UI can poll seo_crawls / seo_pages for progress.
// The heavy work (fetching + extracting pages) happens in the background worker.
//
// POST { client_id }
//   -> { crawl_id, status:'running', max_pages } | { error } (HTTP 200)
// ============================================================================
const { requireAuth } = require('./_auth');

// Pages per crawl by plan (PRICING-STRATEGY-2026-07 §3). AI SEO is Radar+
// (free = 0 → locked). Keep in sync with planConfig.ts PLAN_SEO_PAGE_CAP.
// SIXTH copy of the plan ladder. Source of truth is planConfig.ts
// PLAN_SEO_PAGE_CAP; this exists because a Netlify function cannot import the
// Vite-bundled .ts at runtime. Keep them equal, value for value.
//
// CORRECTED 2026-07-31. Two values disagreed with planConfig and both granted
// MORE than the plan sells:
//   radar       absent, so it fell through the `?? 1` below to a one-page crawl
//               of a tier that is sold with no AI SEO at all.
//   essentials  1 here against planConfig's 0 since 2026-07-29, so the
//               Essentials gate was frontend-only.
//
// There is no hasFeature() gate in this file. The `maxPages <= 0` test IS the
// gate, which is why a wrong number here is an entitlement leak rather than a
// display bug.
//
// UPDATED 2026-07-31: radar and essentials go to 1, the landing page only.
// Constantin's ruling. See planConfig.ts PLAN_SEO_PAGE_CAP for the full reason
// essentials moved too (it is a ladder inversion otherwise: Radar is EUR 29 and
// Essentials is EUR 99). The "landing page" part is delivered by _seo_crawl.js,
// which now seeds the crawl queue with the homepage; a bare cap of 1 would
// otherwise audit whatever the client's sitemap lists first.
const CRAWL_PAGE_CAP = { free: 0, radar: 1, essentials: 1, growth: 10, growth_pro: 30, managed: 100, pro: 100, enterprise: 500 };
// One crawl/audit cycle per week per client (the "max 1 audit / week" cap).
const CRAWL_COOLDOWN_DAYS = 7;

exports.handler = async (event) => {
  const auth = await requireAuth(event);
  if (auth.response) return auth.response;
  const { headers, supabase, profile } = auth;

  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: 'Method Not Allowed' };

  let body;
  try { body = JSON.parse(event.body); } catch { return { statusCode: 400, headers, body: 'Invalid JSON' }; }

  const { client_id } = body;
  if (!client_id) return { statusCode: 400, headers, body: JSON.stringify({ error: 'client_id required' }) };
  if (profile.role !== 'admin' && String(profile.client_id) !== String(client_id)) {
    return { statusCode: 403, headers, body: JSON.stringify({ error: 'Forbidden: client mismatch' }) };
  }

  try {
    const { data: client } = await supabase
      .from('clients').select('brand_website, plan').eq('id', client_id).single();
    const domain = (client?.brand_website || '').trim();
    if (!domain) {
      return { statusCode: 200, headers, body: JSON.stringify({ error: 'This client has no website set, so there is nothing to crawl. Add a website to the client first.' }) };
    }
    // Fails CLOSED. Was `?? 1`, which handed a one-page crawl to every plan
    // missing from the map above, so adding a tier without touching this file
    // granted it AI SEO silently. That is exactly how radar got one.
    const maxPages = CRAWL_PAGE_CAP[client?.plan] ?? 0;
    if (maxPages <= 0) {
      return { statusCode: 200, headers, body: JSON.stringify({ error: 'AI SEO is not included on this plan. Upgrade to Radar or higher to audit your landing page.' }) };
    }

    // Don't start a second crawl while one is already running for this client.
    const { data: running } = await supabase
      .from('seo_crawls').select('id').eq('client_id', client_id).eq('status', 'running')
      .order('created_at', { ascending: false }).limit(1).maybeSingle();
    if (running) {
      return { statusCode: 200, headers, body: JSON.stringify({ crawl_id: running.id, status: 'running', max_pages: maxPages, note: 'A crawl is already running.' }) };
    }

    // Weekly cooldown (§3: max 1 audit/week). Admins bypass (support/testing).
    if (profile.role !== 'admin') {
      const since = new Date(Date.now() - CRAWL_COOLDOWN_DAYS * 86400000).toISOString();
      const { data: recent } = await supabase
        .from('seo_crawls').select('created_at').eq('client_id', client_id)
        .gte('created_at', since).order('created_at', { ascending: false }).limit(1).maybeSingle();
      if (recent?.created_at) {
        const nextAt = new Date(new Date(recent.created_at).getTime() + CRAWL_COOLDOWN_DAYS * 86400000);
        const daysLeft = Math.max(1, Math.ceil((nextAt.getTime() - Date.now()) / 86400000));
        return { statusCode: 200, headers, body: JSON.stringify({
          error: `You can audit your site once per week. Next audit available in about ${daysLeft} day${daysLeft === 1 ? '' : 's'}.`,
          reason: 'cooldown', next_available_at: nextAt.toISOString(),
        }) };
      }
    }

    const { data: crawl, error: insErr } = await supabase
      .from('seo_crawls').insert({ client_id, status: 'running' }).select('id').single();
    if (insErr) throw new Error(insErr.message);

    // Fire the background worker (returns 202 immediately). Gated by the shared
    // internal key, same as collection-worker-background / run-full-audit-background.
    const base = process.env.URL || 'https://app.getbrandgeo.com';
    try {
      await fetch(`${base}/.netlify/functions/seo-crawl-background`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Internal-Key': process.env.INTERNAL_AUDIT_KEY || '' },
        body: JSON.stringify({ client_id, crawl_id: crawl.id, domain, max_pages: maxPages }),
      });
    } catch (e) {
      await supabase.from('seo_crawls').update({ status: 'error', error: `worker kick failed: ${e.message}`, finished_at: new Date().toISOString() }).eq('id', crawl.id);
      return { statusCode: 200, headers, body: JSON.stringify({ error: 'Could not start the crawl worker. Please try again.' }) };
    }

    return { statusCode: 200, headers, body: JSON.stringify({ crawl_id: crawl.id, status: 'running', max_pages: maxPages }) };
  } catch (e) {
    console.error('[SeoCrawl] error:', e.message);
    return { statusCode: 200, headers, body: JSON.stringify({ error: String(e.message || e) }) };
  }
};
