// ============================================================================
// social-accounts.js  --  list the platform accounts connected for a workspace.
// POST { client_id } -> { configured, accounts:[{platform,displayName,externalId,status}] }
// ============================================================================
const { requireAuth } = require('./_auth');
const { getProvider } = require('./_publishing');
const { ensureSocialProfile, requireBoundProfile } = require('./_social');

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
    return { statusCode: 200, headers, body: JSON.stringify({ configured: false, accounts: [], hint: 'Set AYRSHARE_API_KEY in Netlify to connect accounts.' }) };
  }

  try {
    const sp = await ensureSocialProfile(supabase, client_id);

    // Unbound workspace: do NOT call the provider. With no Profile-Key header
    // Ayrshare answers for the PRIMARY profile, which would render another
    // brand's channels as this client's own -- worse than showing nothing.
    const unbound = requireBoundProfile(sp);
    if (unbound) {
      return {
        statusCode: 200, headers,
        body: JSON.stringify({ configured: true, bound: false, accounts: [], hint: unbound }),
      };
    }

    const accounts = await provider.listAccounts({ profileKey: sp.profile_key });

    // Best-effort cache refresh so the UI can render instantly next time.
    try {
      for (const a of accounts) {
        await supabase.from('social_accounts').upsert({
          client_id, platform: a.platform, external_id: a.externalId,
          display_name: a.displayName, status: a.status || 'connected',
        }, { onConflict: 'client_id,platform,external_id' });
      }
    } catch (e) { console.warn('[SocialAccounts] cache upsert failed:', e.message); }

    return {
      statusCode: 200, headers,
      body: JSON.stringify({ configured: true, bound: true, profile_title: sp.profile_title || null, accounts }),
    };
  } catch (e) {
    console.error('[SocialAccounts] error:', e.message);
    return { statusCode: 200, headers, body: JSON.stringify({ configured: true, accounts: [], error: String(e.message || e) }) };
  }
};
