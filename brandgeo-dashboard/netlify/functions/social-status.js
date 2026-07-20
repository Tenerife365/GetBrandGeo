// ============================================================================
// social-status.js  --  refresh the live status of a post's platform targets
// from the provider (e.g. a scheduled post that has since gone live).
// POST { client_id, post_id } -> { post_id, status, targets:[...] }
// ============================================================================
const { requireAuth } = require('./_auth');
const { getProvider } = require('./_publishing');
const { ensureSocialProfile, requireBoundProfile, rollupPostStatus } = require('./_social');

exports.handler = async (event) => {
  const auth = await requireAuth(event);
  if (auth.response) return auth.response;
  const { headers, supabase, profile } = auth;

  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: 'Method Not Allowed' };

  let body;
  try { body = JSON.parse(event.body); } catch { return { statusCode: 400, headers, body: 'Invalid JSON' }; }

  const { client_id, post_id } = body;
  if (!client_id || !post_id) return { statusCode: 400, headers, body: JSON.stringify({ error: 'client_id and post_id required' }) };
  if (profile.role !== 'admin' && String(profile.client_id) !== String(client_id)) {
    return { statusCode: 403, headers, body: JSON.stringify({ error: 'Forbidden: client mismatch' }) };
  }

  const provider = getProvider();
  if (!provider.isConfigured()) {
    return { statusCode: 200, headers, body: JSON.stringify({ error: 'Publishing not configured.' }) };
  }

  try {
    const { data: targets, error: te } = await supabase
      .from('social_post_targets').select('id, platform, provider_ref, status').eq('post_id', post_id).eq('client_id', client_id);
    if (te) return { statusCode: 200, headers, body: JSON.stringify({ error: te.message }) };
    if (!targets || !targets.length) return { statusCode: 404, headers, body: JSON.stringify({ error: 'no targets for post' }) };

    const sp = await ensureSocialProfile(supabase, client_id);
    // Same reason as social-accounts: a null key would query the primary
    // profile and report another workspace's post state as this one's.
    const unbound = requireBoundProfile(sp);
    if (unbound) return { statusCode: 200, headers, body: JSON.stringify({ error: unbound, unbound: true }) };

    const refs = targets.filter((t) => t.provider_ref).map((t) => ({ platform: t.platform, ref: t.provider_ref }));
    const statuses = await provider.getStatus({ refs, profileKey: sp.profile_key });

    const byPlatform = {};
    for (const s of statuses) byPlatform[s.platform] = s;

    const nowIso = new Date().toISOString();
    const rolled = [];
    for (const t of targets) {
      const s = byPlatform[t.platform];
      if (!s) { rolled.push(t.status); continue; }
      await supabase.from('social_post_targets').update({
        status: s.status, permalink: s.permalink || null, error: s.error || null,
        published_at: s.status === 'published' ? nowIso : null,
      }).eq('id', t.id);
      rolled.push(s.status);
    }

    const rollup = rollupPostStatus(rolled);
    await supabase.from('social_posts').update({ status: rollup }).eq('id', post_id);

    return { statusCode: 200, headers, body: JSON.stringify({ post_id, status: rollup, targets: statuses }) };
  } catch (e) {
    console.error('[SocialStatus] error:', e.message);
    return { statusCode: 200, headers, body: JSON.stringify({ error: String(e.message || e) }) };
  }
};
