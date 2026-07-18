/**
 * _indexing.js — shared search-engine notification logic.
 *
 * Owns the Google Indexing API (urlNotifications.publish) + IndexNow calls that
 * used to be inlined in force-index.js. Now shared by BOTH the manual
 * force-index.js endpoint and the scheduled ping-sitemap.js, so the notify logic
 * lives in exactly one place (avoids the copy-paste-drift class of bug this
 * project has been bitten by before, e.g. _analysis.js §2.1).
 *
 * Honest scope note (same as force-index.js's header): Google documents the
 * Indexing API as officially supported only for JobPosting / BroadcastEvent
 * pages. For other page types Google returns a real 200 ("notified") but has not
 * documented that it accelerates crawl priority. IndexNow (Bing/Yandex/Seznam/
 * Naver) does act on arbitrary URLs. Treat this as legitimate "this page exists"
 * syndication, not a guaranteed priority-crawl lever.
 */

const { google } = require('googleapis')

/** Parse GOOGLE_JSON_KEY into credentials; tag errors so callers can map HTTP status. */
function loadGoogleCredentials() {
  const raw = process.env.GOOGLE_JSON_KEY
  if (!raw) { const e = new Error('GOOGLE_JSON_KEY not set'); e.code = 'NO_CREDENTIALS'; throw e }
  let credentials
  try { credentials = JSON.parse(raw) }
  catch { const e = new Error('GOOGLE_JSON_KEY malformed'); e.code = 'BAD_CREDENTIALS'; throw e }
  // Netlify env vars are single-line strings; restore real newlines if the key
  // was pasted with literal "\n" escapes. Harmless no-op if already real newlines.
  if (typeof credentials.private_key === 'string') {
    credentials.private_key = credentials.private_key.replace(/\\n/g, '\n')
  }
  return credentials
}

/**
 * Build an authed Google Indexing client ONCE and reuse it to publish many URLs.
 * The OAuth token is cached on the authClient, so a batch (ping-sitemap) does one
 * token exchange instead of one per URL. Throws NO_CREDENTIALS/BAD_CREDENTIALS on
 * a bad key.
 */
async function createGoogleIndexer() {
  const credentials = loadGoogleCredentials()
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/indexing'],
  })
  const authClient = await auth.getClient()
  const indexing = google.indexing({ version: 'v3', auth: authClient })
  return {
    publish: async (url, type = 'URL_UPDATED') =>
      (await indexing.urlNotifications.publish({ requestBody: { url, type } })).data,
  }
}

/** Submit one URL to IndexNow. Best-effort: never throws, returns a status object. */
async function submitToIndexNow(url, fetchImpl = fetch) {
  if (!process.env.INDEXNOW_KEY) return { ok: false, skipped: true }
  try {
    const u = `https://api.indexnow.org/indexnow?url=${encodeURIComponent(url)}&key=${process.env.INDEXNOW_KEY}`
    const r = await fetchImpl(u)
    return { ok: r.ok, status: r.status }
  } catch (err) {
    return { ok: false, error: err.message }
  }
}

/**
 * Notify Google + IndexNow for a single URL. Publishes to Google (THROWS on
 * credential/API failure, so callers can preserve their 500/502 contract) then
 * submits to IndexNow (never throws). Returns { google: <data>, bing: <status> }.
 */
async function pingUrl(url, type = 'URL_UPDATED', { fetchImpl } = {}) {
  const indexer = await createGoogleIndexer()
  const googleData = await indexer.publish(url, type)
  const bing = await submitToIndexNow(url, fetchImpl)
  return { google: googleData, bing }
}

module.exports = { pingUrl, createGoogleIndexer, submitToIndexNow, loadGoogleCredentials }
