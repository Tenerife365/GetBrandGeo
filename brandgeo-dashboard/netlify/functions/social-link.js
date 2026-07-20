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
    let sp = await ensureSocialProfile(supabase, client_id);

    // AUTO-PROVISION so a client can self-serve with zero admin action.
    //
    // CRITICAL, do not remove: without a profile key the JWT is minted for the
    // account's PRIMARY profile, so the client would link their own Instagram/
    // Facebook into ANOTHER tenant's workspace (the primary profile's owner).
    // Creating the client's own profile first is what makes self-service safe.
    // (createProfile is the only call that ever returns a key, so it is stored
    // immediately -- see social-profile.js for the same reasoning.)
    const singleProfile = String(process.env.AYRSHARE_SINGLE_PROFILE || '').toLowerCase() === 'true';
    if (!sp.profile_key && !singleProfile) {
      if (typeof provider.createProfile !== 'function') {
        return { statusCode: 200, headers, body: JSON.stringify({ url: null, hint: 'This workspace has no social profile yet and the provider cannot create one. An admin needs to link a profile on the Accounts tab first.' }) };
      }

      const { data: client } = await supabase.from('clients').select('name').eq('id', client_id).single();
      const baseTitle = (client?.name || `Client ${client_id}`).trim();

      let created;
      try {
        created = await provider.createProfile({ title: baseTitle });
      } catch (e) {
        // Ayrshare requires a unique title; two clients can share a brand name.
        console.warn(`[SocialLink] createProfile("${baseTitle}") failed, retrying with a suffix:`, e.message);
        created = await provider.createProfile({ title: `${baseTitle} (${client_id})` });
      }

      const { error: upErr } = await supabase.from('social_profiles').update({
        profile_key: created.profileKey, ref_id: created.refId, profile_title: created.title,
      }).eq('client_id', client_id);
      if (upErr) {
        // The profile now exists at the provider but we could not keep its key,
        // and Ayrshare will never disclose it again. Say so rather than looping.
        console.error('[SocialLink] created profile but failed to store key:', upErr.message);
        return { statusCode: 200, headers, body: JSON.stringify({ url: null, error: `A profile was created but could not be saved (${upErr.message}). An admin needs to bind its key manually.` }) };
      }

      console.log(`[SocialLink] auto-provisioned profile "${created.title}" for client ${client_id}`);
      sp = { ...sp, profile_key: created.profileKey, ref_id: created.refId, profile_title: created.title };
    }

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
