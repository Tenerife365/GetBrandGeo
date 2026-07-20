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
    //
    // REPLACE, don't upsert. Two reasons, both bugs seen on live data:
    //  1. Google Business returns no account id, so external_id is NULL -- and in
    //     Postgres NULL <> NULL, so the (client_id, platform, external_id) unique
    //     constraint never matched and every refresh inserted ANOTHER gbp row.
    //  2. Upserting only ever adds: a channel later disconnected at the provider
    //     would linger in the cache forever, shown as still connected.
    // Deleting this client's rows and reinserting what the provider just reported
    // makes the cache a faithful snapshot and fixes both at once.
    try {
      await supabase.from('social_accounts').delete().eq('client_id', client_id);
      if (accounts.length) {
        await supabase.from('social_accounts').insert(accounts.map((a) => ({
          client_id, platform: a.platform, external_id: a.externalId,
          display_name: a.displayName, status: a.status || 'connected',
        })));
      }
    } catch (e) { console.warn('[SocialAccounts] cache refresh failed:', e.message); }

    return {
      statusCode: 200, headers,
      body: JSON.stringify({ configured: true, bound: true, profile_title: sp.profile_title || null, accounts }),
    };
  } catch (e) {
    console.error('[SocialAccounts] error:', e.message);
    return { statusCode: 200, headers, body: JSON.stringify({ configured: true, accounts: [], error: String(e.message || e) }) };
  }
};
