// ============================================================================
// social-link.js  --  return a hosted URL where the user authorizes their
// social accounts (Ayrshare JWT/SSO, multi-profile plans).
// POST { client_id } -> { url } | { url: null, hint }
//
// On the single-profile Premium plan (no AYRSHARE_DOMAIN/PRIVATE_KEY) in-app
// linking isn't available, so url is null and the UI shows a hint to link
// accounts in the Ayrshare dashboard instead.
// ============================================================================
const { requireAuth } = require('./_auth');
const { getProvider } = require('./_publishing');
const { ensureSocialProfile } = require('./_social');

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

  const provider = getProvider();
  if (!provider.isConfigured()) {
    return { statusCode: 200, headers, body: JSON.stringify({ url: null, hint: 'Set AYRSHARE_API_KEY in Netlify first.' }) };
  }

  try {
    const sp = await ensureSocialProfile(supabase, client_id);
    const link = await provider.createLinkingUrl({ profileKey: sp.profile_key });
    if (link && link.url) {
      return { statusCode: 200, headers, body: JSON.stringify({ url: link.url }) };
    }
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        url: null,
        hint: 'Self-service connecting is not switched on yet. It needs the Ayrshare SSO credentials in Netlify: AYRSHARE_DOMAIN (the exact domain Ayrshare gives you at onboarding) and AYRSHARE_PRIVATE_KEY (the RSA private key from the Ayrshare dashboard). Until then, accounts have to be linked inside the Ayrshare dashboard by whoever holds that login.',
      }),
    };
  } catch (e) {
    console.error('[SocialLink] error:', e.message);
    return { statusCode: 200, headers, body: JSON.stringify({ url: null, error: String(e.message || e) }) };
  }
};
