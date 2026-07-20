// ============================================================================
// social-profile.js  --  ADMIN ONLY. Bind a BrandGEO client to its provider
// workspace (Ayrshare User Profile), so every publish for that client carries
// the right Profile-Key and can only ever reach that brand's own channels.
//
// POST { client_id, action, ... }
//   action 'get'    -> { bound, profile_title, ref_id, key_hint, accounts[] }
//                      Current binding for this client (never returns the key).
//   action 'list'   -> { profiles: [{title, refId, status, platforms[]}] }
//                      Every profile on the Ayrshare account, to identify which
//                      one belongs to this client. Ayrshare does NOT disclose
//                      profile keys here, which is why binding needs a paste.
//   action 'bind'   -> { profile_key, profile_title?, ref_id? }
//                      Verifies the key against the provider FIRST, then stores.
//   action 'create' -> { title }  create a NEW empty profile and bind it (the
//                      only API path that ever returns a key). No channels yet.
//   action 'unbind' -> clears the binding (publishing is then blocked).
//
// SECURITY: the profile key is a credential. It is written by the service-key
// client and NEVER returned to the browser -- only a masked key_hint is.
// ============================================================================
const { requireAuth } = require('./_auth');
const { getProvider } = require('./_publishing');
const { ensureSocialProfile } = require('./_social');

// Show enough to recognise a key, not enough to use it.
function maskKey(key) {
  if (!key) return null;
  const s = String(key);
  return s.length <= 8 ? '•'.repeat(s.length) : `${s.slice(0, 4)}…${s.slice(-4)}`;
}

exports.handler = async (event) => {
  // adminOnly: binding a workspace to a set of live social channels is an
  // account-level action, not something a client viewer may do for themselves.
  const auth = await requireAuth(event, { adminOnly: true });
  if (auth.response) return auth.response;
  const { headers, supabase } = auth;

  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: 'Method Not Allowed' };

  let body;
  try { body = JSON.parse(event.body); } catch { return { statusCode: 400, headers, body: 'Invalid JSON' }; }

  const { client_id, action } = body;
  if (!client_id) return { statusCode: 400, headers, body: JSON.stringify({ error: 'client_id required' }) };

  const provider = getProvider();
  if (!provider.isConfigured()) {
    return { statusCode: 200, headers, body: JSON.stringify({ error: 'Publishing not configured (set AYRSHARE_API_KEY in Netlify).' }) };
  }

  const ok = (payload) => ({ statusCode: 200, headers, body: JSON.stringify(payload) });
  const fail = (error) => ({ statusCode: 200, headers, body: JSON.stringify({ error }) });

  try {
    const sp = await ensureSocialProfile(supabase, client_id);

    // ---- get: what is this client bound to right now? ----------------------
    if (!action || action === 'get') {
      const bound = !!sp.profile_key;
      let accounts = [];
      if (bound) {
        try { accounts = await provider.listAccounts({ profileKey: sp.profile_key }); }
        catch (e) { console.warn('[SocialProfile] listAccounts failed:', e.message); }
      }
      return ok({
        bound,
        profile_title: sp.profile_title || null,
        ref_id: sp.ref_id || null,
        key_hint: maskKey(sp.profile_key),
        accounts,
      });
    }

    // ---- list: every profile on the Ayrshare account -----------------------
    if (action === 'list') {
      if (typeof provider.listProfiles !== 'function') {
        return ok({ profiles: [], hint: 'This publishing provider does not expose profiles.' });
      }
      const profiles = await provider.listProfiles();
      // Flag which profiles are already claimed, so two clients can't be pointed
      // at the same workspace by accident.
      const { data: taken } = await supabase
        .from('social_profiles').select('client_id, ref_id').not('ref_id', 'is', null);
      const claimed = new Map((taken || []).map((r) => [r.ref_id, r.client_id]));
      return ok({
        profiles: profiles.map((p) => ({
          ...p,
          claimed_by: claimed.has(p.refId) && String(claimed.get(p.refId)) !== String(client_id)
            ? claimed.get(p.refId) : null,
        })),
      });
    }

    // ---- bind: verify a pasted key, then store it --------------------------
    if (action === 'bind') {
      const key = String(body.profile_key || '').trim();
      if (!key) return fail('profile_key required');

      // Catch the credential mix-up the Ayrshare dashboard invites: the RSA SSO
      // "Private Key" sits next to the "Profile Key" and its rejection message
      // ("The Profile Key is invalid") gives no hint that the wrong KIND of
      // credential was pasted. A Profile Key is a short dashed token.
      if (/BEGIN [A-Z ]*PRIVATE KEY/i.test(key) || key.length > 120) {
        return fail('That looks like the RSA Private Key (the long -----BEGIN PRIVATE KEY----- block), not a Profile Key. The Profile Key is a short dashed token like 7TVRLEZ-24A43C0-NJW0Z82-F11984N, found in the Ayrshare dashboard under Profiles via the key icon. The Private Key belongs in the AYRSHARE_PRIVATE_KEY Netlify variable instead.');
      }

      // Verify BEFORE storing: a wrong key that silently persisted would send
      // this client's posts to another brand's channels.
      if (typeof provider.verifyProfileKey === 'function') {
        const check = await provider.verifyProfileKey({ profileKey: key });
        if (!check.ok) {
          return fail(`${check.error || 'That profile key was rejected.'} Check you copied the Profile Key (short dashed token, via the key icon next to the profile in Ayrshare) and not the API key or the RSA Private Key.`);
        }

        const { error } = await supabase.from('social_profiles').update({
          profile_key: key,
          ref_id: body.ref_id || check.refId || null,
          profile_title: body.profile_title || check.title || null,
        }).eq('client_id', client_id);
        if (error) return fail(`Could not save the binding: ${error.message}`);

        return ok({
          bound: true,
          profile_title: body.profile_title || check.title || null,
          ref_id: body.ref_id || check.refId || null,
          key_hint: maskKey(key),
          accounts: check.accounts || [],
        });
      }

      const { error } = await supabase.from('social_profiles').update({
        profile_key: key, ref_id: body.ref_id || null, profile_title: body.profile_title || null,
      }).eq('client_id', client_id);
      if (error) return fail(`Could not save the binding: ${error.message}`);
      return ok({ bound: true, key_hint: maskKey(key), accounts: [] });
    }

    // ---- create: new empty profile, key captured at birth -------------------
    if (action === 'create') {
      if (typeof provider.createProfile !== 'function') {
        return fail('This publishing provider cannot create profiles.');
      }
      const title = String(body.title || '').trim();
      if (!title) return fail('title required');

      const created = await provider.createProfile({ title });
      const { error } = await supabase.from('social_profiles').update({
        profile_key: created.profileKey, ref_id: created.refId, profile_title: created.title,
      }).eq('client_id', client_id);
      // The key exists at the provider now; losing it here would strand the
      // profile (Ayrshare will not disclose it again), so say so loudly.
      if (error) {
        console.error('[SocialProfile] created profile but failed to store key:', error.message);
        return fail(`Profile "${created.title}" was created at the provider but could not be saved here (${error.message}). Copy its key from the Ayrshare dashboard and bind it manually.`);
      }
      return ok({
        bound: true, created: true, profile_title: created.title, ref_id: created.refId,
        key_hint: maskKey(created.profileKey), accounts: [],
        hint: 'Profile created. It has no channels yet — link Instagram, Facebook, LinkedIn and Google Business to it in the Ayrshare dashboard.',
      });
    }

    // ---- unbind -------------------------------------------------------------
    if (action === 'unbind') {
      const { error } = await supabase.from('social_profiles').update({
        profile_key: null, ref_id: null, profile_title: null,
      }).eq('client_id', client_id);
      if (error) return fail(error.message);
      return ok({ bound: false, accounts: [] });
    }

    return fail(`Unknown action: ${action}`);
  } catch (e) {
    console.error('[SocialProfile] error:', e.message);
    return fail(String(e.message || e));
  }
};
