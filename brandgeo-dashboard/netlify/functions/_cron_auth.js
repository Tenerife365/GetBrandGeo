/**
 * _cron_auth.js — shared-secret gate for the cron-invoked jobs.
 *
 * These endpoints are server-to-server only. They are called by Supabase
 * pg_cron over pg_net (db/supabase-scheduled-jobs-migration.sql), which reads
 * the secret from Vault and sends it as X-Cron-Key. Netlify is no longer the
 * caller: its scheduler sends only a {"next_run": "..."} body, which is not a
 * credential and cannot be turned into one — see
 * docs/arch/scheduled-function-auth.md §2.
 *
 * Contract (arch doc §6.1):
 *   405  non-POST
 *   503  CRON_SECRET unset or empty            <- FAIL CLOSED
 *   401  X-Cron-Key missing or wrong           <- body is exactly {"error":"unauthorized"}
 *   null pass, caller proceeds
 *
 * Returns { response } on reject (return it immediately) or null on pass.
 *
 * No CORS, no OPTIONS, no origin logic, and deliberately NOT routed through
 * _auth.js: nothing here is ever called from a browser, so an origin check
 * would add surface without adding a credential.
 *
 * The 503 is the point of the file. collection-worker-background.js:35 to :43
 * does the opposite — a missing INTERNAL_AUDIT_KEY there ACCEPTS the caller and
 * warns to a log nobody reads. A missing environment variable is the single most
 * likely misconfiguration on a serverless platform, so it must reject. The cost
 * is that CRON_SECRET has to exist in Netlify BEFORE this ships (arch doc §8).
 *
 * Its own secret, not INTERNAL_AUDIT_KEY or FORCE_INDEX_KEY, and its own header
 * name, not the twice-overloaded X-Internal-Key: these three endpoints revert
 * customer plans, email customers and spend LLM budget, which is a different
 * blast radius (arch doc §6.3).
 */

const crypto = require('crypto');

function json(statusCode, payload) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  };
}

/**
 * @param {object} event Netlify/Lambda event
 * @returns {{ response: object } | null}
 */
function requireCronAuth(event) {
  if (!event || event.httpMethod !== 'POST') {
    return { response: json(405, { error: 'method not allowed' }) };
  }

  const expected = process.env.CRON_SECRET;
  if (!expected) {
    console.error('[cron-auth] CRON_SECRET is not set — refusing all requests');
    return { response: json(503, { error: 'cron auth not configured' }) };
  }

  const headers = event.headers || {};
  const provided = headers['x-cron-key'] || headers['X-Cron-Key'];
  if (!provided) {
    return { response: json(401, { error: 'unauthorized' }) };
  }

  // timingSafeEqual throws on unequal lengths, so the length check comes first
  // and is itself the (non-constant-time) length comparison. Timing is not a
  // practical attack on a 32-byte random secret over the public internet; this
  // costs one line and removes the question from review.
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return { response: json(401, { error: 'unauthorized' }) };
  }

  return null;
}

module.exports = { requireCronAuth };
