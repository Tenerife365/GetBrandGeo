// ============================================================================
// seo-crawl-background.js  --  AI SEO Phase 2 crawl worker (Netlify Background
// Function; the `-background` suffix gives it up to 15 min, no netlify.toml
// timeout entry -- same mechanism as run-full-audit-background.js).
//
// Triggered fire-and-forget by seo-crawl.js. Not a public endpoint: gated by the
// shared internal key (INTERNAL_AUDIT_KEY). Crawls the client's site (free
// sitemap + fetch, via _seo_crawl.js), upserts each page into seo_pages, and
// marks the seo_crawls run done/error for the UI to poll.
//
// Body: { client_id, crawl_id, domain, max_pages }
// ============================================================================
const { createClient } = require('@supabase/supabase-js');
const { crawlSite } = require('./_seo_crawl');

function checkInternalKey(event) {
  const configured = process.env.INTERNAL_AUDIT_KEY;
  if (!configured) {
    console.warn('[SeoCrawlBg] INTERNAL_AUDIT_KEY not set — accepting unauthenticated trigger. Set this env var in Netlify.');
    return true;
  }
  const provided = event.headers['x-internal-key'] || event.headers['X-Internal-Key'];
  return provided === configured;
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };
  if (!checkInternalKey(event)) return { statusCode: 401, body: 'Unauthorized' };

  let body;
  try { body = JSON.parse(event.body || '{}'); } catch { return { statusCode: 400, body: 'Invalid JSON' }; }
  const { client_id, crawl_id, domain, max_pages } = body;
  if (!client_id || !crawl_id || !domain) return { statusCode: 400, body: 'missing fields' };

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

  try {
    const pages = await crawlSite(domain, { maxPages: Math.max(1, Math.min(Number(max_pages) || 25, 300)) });

    const nowIso = new Date().toISOString();
    let saved = 0;
    for (const p of pages) {
      // Upsert by (client_id, url). Omit geo_score/audit so a re-crawl refreshes
      // the content and marks the page for re-audit without wiping the prior score.
      const { error } = await supabase.from('seo_pages').upsert({
        client_id,
        url: p.url,
        title: p.title || null,
        content_md: p.content_md || null,
        status: 'crawled',
        fetched_at: nowIso,
      }, { onConflict: 'client_id,url' });
      if (!error) saved += 1;
      else console.error('[SeoCrawlBg] upsert error:', error.message, p.url);
    }

    await supabase.from('seo_crawls')
      .update({ status: 'done', pages: saved, finished_at: new Date().toISOString() })
      .eq('id', crawl_id);
    console.log(`[SeoCrawlBg] client ${client_id} crawl ${crawl_id}: saved ${saved}/${pages.length} pages`);
    return { statusCode: 200, body: 'ok' };
  } catch (e) {
    console.error('[SeoCrawlBg] error:', e.message);
    await supabase.from('seo_crawls')
      .update({ status: 'error', error: String(e.message || e).slice(0, 500), finished_at: new Date().toISOString() })
      .eq('id', crawl_id);
    return { statusCode: 200, body: 'error handled' };
  }
};
