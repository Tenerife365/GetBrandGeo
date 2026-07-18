/**
 * force-index.js — manual "notify search engines now" trigger for getbrandgeo.com pages.
 *
 * Wraps Google's Indexing API (urlNotifications.publish) with the auth + domain
 * guard every other function in this codebase has and the copy-pasted quickstart
 * snippet this was built from did not. Also submits the same URL to IndexNow
 * (https://www.indexnow.org — a single open protocol; despite api.indexnow.org's
 * hostname it isn't Bing-specific, submissions fan out to every participating
 * engine: Bing, Yandex, Seznam.cz, Naver, and others).
 *
 * ── IndexNow key-file placement — this matters, don't skip it ────────────────
 * IndexNow requires a verification file at the ROOT of the domain the submitted
 * URLs belong to: https://getbrandgeo.com/<key>.txt, containing nothing but the
 * key. Because collect requests are for getbrandgeo.com pages (the cPanel-
 * hosted marketing site, NOT this Netlify project — app.getbrandgeo.com is a
 * different host), that file has to be uploaded to `brandgeo/web/` via cPanel,
 * the same way every other file on that site is deployed. Putting it in this
 * repo's Netlify-served output would publish it on the wrong domain and the
 * verification would fail. The generated key file for this project already
 * lives at `brandgeo/web/b857aee5749c1fb84e8cf6b220793454.txt` locally — see
 * CLAUDE.md §9.24 for the upload step.
 *
 * ── Real limitation, not a caveat to bury ─────────────────────────────────────
 * Google documents this API as supported ONLY for pages carrying JobPosting or
 * BroadcastEvent structured data:
 *   https://developers.google.com/search/apis/indexing-api/v3/quickstart
 * BrandGEO's blog/comparison/industry pages are neither. Calling this endpoint
 * for them is the same class of thing this project already does deliberately
 * (Pingomatic pings, sitemap submission — CLAUDE.md §9.15/§9.17, "legitimate
 * syndication," not a ranking-manipulation lever): a real Google API returns a
 * real 200, but Google has never documented that it accelerates crawl/index
 * priority for non-qualifying page types. Treat a success response here as
 * "Google was notified," not as "this page will now be indexed faster." Do not
 * advertise this as a guaranteed priority-crawl mechanism to anyone.
 *
 * ── Auth ───────────────────────────────────────────────────────────────────
 * Gated by a dedicated shared secret (FORCE_INDEX_KEY), deliberately NOT the
 * same INTERNAL_AUDIT_KEY the Instant Audit Engine uses (CLAUDE.md §10.4) —
 * this spends a separate, rate-limited (Google's default: 200 requests/day),
 * hard-to-replace credential (the Search-Console-verified service account),
 * so it gets its own secret to keep the blast radius contained if either
 * secret is ever compromised.
 *
 * Request:
 *   POST /.netlify/functions/force-index
 *   Headers: X-Internal-Key: <FORCE_INDEX_KEY>
 *   Body:    { "url": "https://getbrandgeo.com/bg-016.html", "type"?: "URL_UPDATED" | "URL_DELETED" }
 *
 * `url` must resolve to getbrandgeo.com, www.getbrandgeo.com, or
 * app.getbrandgeo.com — anything else is rejected before Google is ever
 * called, both to stop this endpoint being used to probe/spend quota against
 * unrelated domains and because Google would reject an unverified domain
 * anyway (this just fails fast, locally, with a clearer message).
 */

const { pingUrl } = require('./_indexing');

const ALLOWED_HOSTS = new Set([
  'getbrandgeo.com',
  'www.getbrandgeo.com',
  'app.getbrandgeo.com',
]);

const ALLOWED_TYPES = new Set(['URL_UPDATED', 'URL_DELETED']);

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const providedKey = event.headers['x-internal-key'] || event.headers['X-Internal-Key'];
  const expectedKey = process.env.FORCE_INDEX_KEY;
  if (!expectedKey) {
    console.error('[force-index] FORCE_INDEX_KEY is not set — refusing all requests');
    return { statusCode: 500, body: JSON.stringify({ error: 'Not configured' }) };
  }
  if (!providedKey || providedKey !== expectedKey) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
  }

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON body' }) };
  }

  const { url, type = 'URL_UPDATED' } = body;
  if (!url || typeof url !== 'string') {
    return { statusCode: 400, body: JSON.stringify({ error: 'Missing "url"' }) };
  }
  if (!ALLOWED_TYPES.has(type)) {
    return { statusCode: 400, body: JSON.stringify({ error: `"type" must be one of: ${[...ALLOWED_TYPES].join(', ')}` }) };
  }

  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Malformed URL' }) };
  }
  if (parsed.protocol !== 'https:' || !ALLOWED_HOSTS.has(parsed.hostname)) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: `URL host must be one of: ${[...ALLOWED_HOSTS].join(', ')}` }),
    };
  }

  // Delegate the actual Google + IndexNow notification to the shared _indexing
  // helper (also used by the scheduled ping-sitemap.js). pingUrl publishes to
  // Google (throws on credential/API failure) then submits to IndexNow (never
  // throws). The error-to-HTTP-status mapping below preserves this endpoint's
  // original contract exactly (500 for missing/bad creds, 502 for API failure).
  try {
    const { google: googleData, bing } = await pingUrl(parsed.toString(), type);
    console.log(`[force-index] ok | google | ${type} | ${parsed.toString()} | indexnow:${bing.ok ? 'ok' : (bing.skipped ? 'skipped' : 'failed')}`);
    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true, url: parsed.toString(), type, google: googleData, bing }),
    };
  } catch (err) {
    if (err.code === 'NO_CREDENTIALS') {
      console.error('[force-index] GOOGLE_JSON_KEY is not set');
      return { statusCode: 500, body: JSON.stringify({ error: 'Google credentials not configured' }) };
    }
    if (err.code === 'BAD_CREDENTIALS') {
      console.error('[force-index] GOOGLE_JSON_KEY did not parse as JSON:', err.message);
      return { statusCode: 500, body: JSON.stringify({ error: 'Google credentials malformed' }) };
    }
    console.error('[force-index] Google Indexing API call failed:', err.message);
    return { statusCode: 502, body: JSON.stringify({ error: 'Google Indexing API call failed', detail: err.message }) };
  }
};
