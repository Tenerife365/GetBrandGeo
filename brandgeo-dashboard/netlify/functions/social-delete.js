// ============================================================================
// social-delete.js  --  cancel a scheduled post (or delete a published one)
// across all of its platform targets, via the swappable publishing provider.
//
// POST { client_id, post_id } -> { post_id, status, targets:[{platform,ok,error}] }
//
// Each target was published as its own provider post (one POST /post per
// platform in _publishing_ayrshare.js), so it carries its own provider_ref and
// must be deleted individually. We delete every target that has a ref, mark the
// ones that succeeded 'canceled', and roll the post up to 'canceled' when they
// all went (or there was nothing to delete), otherwise leave it 'partial' so the
// failure is visible instead of silently swallowed.
//
// NOTE ON SEMANTICS. For a SCHEDULED post the provider's delete cancels it before
// it ever goes out (nothing was ever public). For an already-PUBLISHED post the
// same call removes it from the network -- a real destructive public action. The
// Calendar UI only exposes this on scheduled posts for that reason; the endpoint
// itself will act on whatever post_id an admin/owner passes.
//
// Writes are via the service-key client (bypasses RLS); the caller is still
// checked for admin-or-owner on this client_id first.
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
    // Confirm the post belongs to this client, and load its targets.
    const { data: post, error: pe } = await supabase
      .from('social_posts').select('id, status').eq('id', post_id).eq('client_id', client_id).single();
    if (pe || !post) return { statusCode: 404, headers, body: JSON.stringify({ error: 'post not found' }) };

    const { data: targets, error: te } = await supabase
      .from('social_post_targets').select('id, platform, provider_ref, status').eq('post_id', post_id).eq('client_id', client_id);
    if (te) return { statusCode: 200, headers, body: JSON.stringify({ error: te.message }) };

    const sp = await ensureSocialProfile(supabase, client_id);
    // Same isolation rule as everywhere else: with no key the provider acts on
    // the primary profile, which would delete another workspace's post.
    const unbound = requireBoundProfile(sp);
    if (unbound) return { statusCode: 200, headers, body: JSON.stringify({ error: unbound, unbound: true }) };

    const results = [];
    const nowIso = new Date().toISOString();

    for (const t of (targets || [])) {
      // No provider ref -> nothing was ever queued at the provider (pending or a
      // failed publish). Just mark it canceled locally.
      if (!t.provider_ref) {
        await supabase.from('social_post_targets').update({ status: 'canceled' }).eq('id', t.id);
        results.push({ platform: t.platform, ok: true, error: null });
        continue;
      }
      let del;
      try {
        del = await provider.deletePost({ ref: t.provider_ref, profileKey: sp.profile_key });
      } catch (e) {
        del = { ok: false, error: String(e.message || e) };
      }
      if (del.ok) {
        await supabase.from('social_post_targets').update({ status: 'canceled', error: null }).eq('id', t.id);
        results.push({ platform: t.platform, ok: true, error: null });
      } else {
        await supabase.from('social_post_targets').update({ error: del.error || 'cancel failed' }).eq('id', t.id);
        results.push({ platform: t.platform, ok: false, error: del.error || 'cancel failed' });
      }
    }

    const allOk = results.every((r) => r.ok);
    const rollup = allOk ? 'canceled' : 'partial';
    await supabase.from('social_posts').update({
      status: rollup,
      error: allOk ? null : (results.find((r) => !r.ok)?.error || 'some targets could not be canceled'),
    }).eq('id', post_id);

    return {
      statusCode: 200, headers,
      body: JSON.stringify({ post_id: Number(post_id), status: rollup, targets: results }),
    };
  } catch (e) {
    console.error('[SocialDelete] error:', e.message);
    return { statusCode: 200, headers, body: JSON.stringify({ error: String(e.message || e) }) };
  }
};
