// ============================================================================
// _publishing_ayrshare.js  --  Ayrshare implementation of the publishing
// provider interface documented in _publishing.js.
//
// Never imported directly by the app -- only via getProvider() in _publishing.js.
//
// ENV VARS (Netlify, functions-only):
//   AYRSHARE_API_KEY      required. Bearer token for the Ayrshare API.
//   AYRSHARE_DOMAIN       optional. Your Ayrshare SSO domain (Business/Launch
//                         multi-profile). Needed for in-app account linking.
//   AYRSHARE_PRIVATE_KEY  optional. RSA private key (PEM) paired with the SSO
//                         domain, used to mint the JWT linking URL.
//
// PROFILE KEYS: on multi-profile plans each workspace passes its own
//   Profile-Key header. On the single-profile Premium plan, profileKey is null
//   and the header is omitted (the account's default profile is used).
// ============================================================================

const API_BASE = 'https://api.ayrshare.com/api';
const TIMEOUT_MS = 23000; // return before Netlify's 26s hard kill

// internal id -> Ayrshare platform id
const TO_AYR = { instagram: 'instagram', facebook: 'facebook', linkedin: 'linkedin', gbp: 'gmb', x: 'twitter' };
// Ayrshare platform id -> internal id
const FROM_AYR = { instagram: 'instagram', facebook: 'facebook', linkedin: 'linkedin', gmb: 'gbp', twitter: 'x' };

// Ayrshare per-platform options key for each internal platform
const OPTIONS_KEY = { instagram: 'instagramOptions', facebook: 'faceBookOptions', linkedin: 'linkedInOptions', gbp: 'gmbOptions', x: 'twitterOptions' };

function apiKey() {
  return process.env.AYRSHARE_API_KEY || '';
}

function isConfigured() {
  return !!apiKey();
}

// Low-level Ayrshare fetch with auth, optional Profile-Key, and a hard timeout.
async function ayr(path, { method = 'GET', body = null, profileKey = null } = {}) {
  const key = apiKey();
  if (!key) throw new Error('AYRSHARE_API_KEY not set');

  const ctrl = new AbortController();
  const killTimer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const headers = { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' };
    if (profileKey) headers['Profile-Key'] = profileKey;

    const res = await fetch(`${API_BASE}${path}`, {
      method,
      signal: ctrl.signal,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    let json;
    try { json = await res.json(); } catch { json = {}; }
    return { ok: res.ok, statusCode: res.status, json };
  } finally {
    clearTimeout(killTimer);
  }
}

// -- listAccounts ------------------------------------------------------------
// GET /user -> connected social accounts for this profile.
async function listAccounts({ profileKey } = {}) {
  const { ok, json } = await ayr('/user', { method: 'GET', profileKey });
  if (!ok) return [];

  // Ayrshare returns activeSocialAccounts (ids) + displayNames (rich objects).
  const active = Array.isArray(json.activeSocialAccounts) ? json.activeSocialAccounts : [];
  const display = Array.isArray(json.displayNames) ? json.displayNames : [];

  const byPlatform = {};
  for (const d of display) {
    const internal = FROM_AYR[d.platform];
    if (internal) byPlatform[d.platform] = d;
  }

  return active
    .map((ayrPlatform) => {
      const internal = FROM_AYR[ayrPlatform];
      if (!internal) return null; // a network we don't surface in the UI
      const d = byPlatform[ayrPlatform] || {};
      return {
        platform: internal,
        displayName: d.displayName || d.username || null,
        externalId: d.userId || d.id || null,
        status: 'connected',
      };
    })
    .filter(Boolean);
}

// -- createLinkingUrl --------------------------------------------------------
// Mints a JWT + hosted linking URL (Business/Launch multi-profile SSO).
// Returns null when SSO env isn't configured (Premium: link in the Ayrshare
// dashboard instead) so callers can fall back to guidance.
async function createLinkingUrl({ profileKey } = {}) {
  const domain = process.env.AYRSHARE_DOMAIN;
  const privateKey = process.env.AYRSHARE_PRIVATE_KEY;
  if (!domain || !privateKey) return null;

  const body = { domain, privateKey };
  if (profileKey) body.profileKey = profileKey;

  const { ok, json } = await ayr('/profiles/generateJWT', { method: 'POST', body });
  if (!ok || !json.url) return null;
  return { url: json.url };
}

// -- publish -----------------------------------------------------------------
// One Ayrshare POST /post per target so each platform gets its own text/media/
// options and its own independent success/failure (natural partial results).
async function publish({ profileKey, targets, scheduleDate } = {}) {
  const statuses = [];
  const raw = [];

  for (const t of targets) {
    const ayrPlatform = TO_AYR[t.platform];
    if (!ayrPlatform) {
      statuses.push({ platform: t.platform, status: 'failed', ref: null, permalink: null, error: `Unsupported platform: ${t.platform}` });
      continue;
    }

    const body = { post: t.text || '', platforms: [ayrPlatform] };
    if (Array.isArray(t.mediaUrls) && t.mediaUrls.length) body.mediaUrls = t.mediaUrls;
    if (scheduleDate) body.scheduleDate = scheduleDate;
    if (t.options && Object.keys(t.options).length) body[OPTIONS_KEY[t.platform]] = t.options;

    let result;
    try {
      result = await ayr('/post', { method: 'POST', body, profileKey });
    } catch (e) {
      statuses.push({ platform: t.platform, status: 'failed', ref: null, permalink: null, error: String(e.message || e) });
      continue;
    }
    raw.push(result.json);

    const j = result.json || {};
    const isErr = !result.ok || j.status === 'error';
    // postIds carries the per-platform id + live URL on success.
    const pid = Array.isArray(j.postIds) ? j.postIds.find((p) => p.platform === ayrPlatform) || j.postIds[0] : null;

    if (isErr) {
      const errMsg = (Array.isArray(j.errors) && j.errors[0] && (j.errors[0].message || j.errors[0].action))
        || j.message
        || `Ayrshare error (HTTP ${result.statusCode})`;
      statuses.push({ platform: t.platform, status: 'failed', ref: pid?.id || j.id || null, permalink: null, error: errMsg });
    } else {
      statuses.push({
        platform: t.platform,
        status: scheduleDate ? 'scheduled' : 'published',
        ref: pid?.id || j.id || null,
        permalink: pid?.postUrl || null,
        error: null,
      });
    }
  }

  return { statuses, raw };
}

// -- getStatus ---------------------------------------------------------------
// GET /post/{id} per ref to refresh scheduled/published state.
async function getStatus({ refs, profileKey } = {}) {
  const out = [];
  for (const { platform, ref } of refs || []) {
    if (!ref) { out.push({ platform, status: 'failed', ref, permalink: null, error: 'missing ref' }); continue; }
    const { ok, json } = await ayr(`/post/${encodeURIComponent(ref)}`, { method: 'GET', profileKey });
    if (!ok) { out.push({ platform, status: 'failed', ref, permalink: null, error: json.message || 'status lookup failed' }); continue; }

    const ayrPlatform = TO_AYR[platform];
    const pid = Array.isArray(json.postIds) ? json.postIds.find((p) => p.platform === ayrPlatform) || json.postIds[0] : null;
    // Ayrshare status strings: 'success' | 'pending' | 'scheduled' | 'error'
    const s = (pid?.status || json.status || '').toLowerCase();
    const status = s === 'success' ? 'published' : s === 'scheduled' || s === 'pending' ? 'scheduled' : s === 'error' ? 'failed' : 'scheduled';
    out.push({ platform, status, ref, permalink: pid?.postUrl || null, error: status === 'failed' ? (json.message || 'failed') : null });
  }
  return out;
}

// -- deletePost --------------------------------------------------------------
// DELETE /post -> cancels a scheduled post or removes a published one.
async function deletePost({ ref, profileKey } = {}) {
  if (!ref) return { ok: false, error: 'missing ref' };
  const { ok, json } = await ayr('/post', { method: 'DELETE', body: { id: ref }, profileKey });
  return { ok, error: ok ? undefined : (json.message || 'delete failed') };
}

module.exports = { isConfigured, listAccounts, createLinkingUrl, publish, getStatus, deletePost };
