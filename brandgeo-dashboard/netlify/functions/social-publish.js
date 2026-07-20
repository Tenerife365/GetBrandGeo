// ============================================================================
// social-publish.js  --  publish now or schedule a post across platforms.
//
// POST body (inline compose -- the common case):
//   { client_id, base_text, base_media?, source?, brief?, scheduled_at?,
//     targets: [{ platform, text?, media?, options? }] }
//     - text/media omitted on a target -> falls back to base_text/base_media
//     - scheduled_at (ISO) in the future -> schedule; omitted/past -> publish now
//
// POST body (retry an existing post):
//   { client_id, post_id }   -- re-publishes its stored targets
//
// -> { post_id, status, targets: [{platform,status,ref,permalink,error}] }
//
// Uses the swappable publishing provider (_publishing.js); never calls a vendor
// API directly. Writes are via the service-key client (bypasses RLS).
// ============================================================================
const { requireAuth } = require('./_auth');
const { getProvider } = require('./_publishing');
const { ensureSocialProfile, requireBoundProfile, mediaUrlsFrom, rollupPostStatus } = require('./_social');

exports.handler = async (event) => {
  const auth = await requireAuth(event);
  if (auth.response) return auth.response;
  const { headers, supabase, profile, user } = auth;

  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: 'Method Not Allowed' };

  let body;
  try { body = JSON.parse(event.body); } catch { return { statusCode: 400, headers, body: 'Invalid JSON' }; }

  const { client_id, post_id } = body;
  if (!client_id) return { statusCode: 400, headers, body: JSON.stringify({ error: 'client_id required' }) };
  if (profile.role !== 'admin' && String(profile.client_id) !== String(client_id)) {
    return { statusCode: 403, headers, body: JSON.stringify({ error: 'Forbidden: client mismatch' }) };
  }

  const provider = getProvider();
  if (!provider.isConfigured()) {
    return { statusCode: 200, headers, body: JSON.stringify({ error: 'Publishing not configured (set AYRSHARE_API_KEY in Netlify).' }) };
  }

  // ---- refuse to publish an unbound workspace -------------------------------
  // Checked BEFORE any row is written, so a misconfigured client never leaves
  // half-created post/target rows behind (and never reaches the wrong profile).
  let socialProfile;
  try {
    socialProfile = await ensureSocialProfile(supabase, client_id);
  } catch (e) {
    return { statusCode: 200, headers, body: JSON.stringify({ error: String(e.message || e) }) };
  }
  const unbound = requireBoundProfile(socialProfile);
  if (unbound) return { statusCode: 200, headers, body: JSON.stringify({ error: unbound, unbound: true }) };

  // ---- resolve the post + its targets (load existing, or create new) --------
  let post;
  let targetRows; // [{ id, platform, text_override, media_override, options }]

  try {
    if (post_id) {
      const { data: p, error: pe } = await supabase
        .from('social_posts').select('*').eq('id', post_id).eq('client_id', client_id).single();
      if (pe || !p) return { statusCode: 404, headers, body: JSON.stringify({ error: 'post not found' }) };
      post = p;
      const { data: ts } = await supabase
        .from('social_post_targets').select('*').eq('post_id', post_id);
      targetRows = (ts || []).map((t) => ({ id: t.id, platform: t.platform, text_override: t.text_override, media_override: t.media_override, options: null }));
    } else {
      const { base_text, base_media, source, brief, scheduled_at, targets } = body;
      if (!Array.isArray(targets) || !targets.length) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'targets[] required' }) };
      }
      const { data: p, error: pe } = await supabase.from('social_posts').insert({
        client_id, created_by: user.id, status: 'publishing',
        source: source === 'ai' ? 'ai' : 'manual', brief: brief || null,
        base_text: base_text || '', base_media: base_media || [],
        scheduled_at: scheduled_at || null, provider: 'ayrshare',
      }).select('*').single();
      if (pe) return { statusCode: 200, headers, body: JSON.stringify({ error: `create post failed: ${pe.message}` }) };
      post = p;

      const rows = targets.map((t) => ({
        post_id: post.id, client_id, platform: t.platform,
        text_override: t.text ?? null, media_override: t.media ?? null, status: 'pending',
      }));
      const { data: inserted, error: te } = await supabase.from('social_post_targets').insert(rows).select('*');
      if (te) return { statusCode: 200, headers, body: JSON.stringify({ error: `create targets failed: ${te.message}` }) };
      targetRows = inserted.map((t, i) => ({ id: t.id, platform: t.platform, text_override: t.text_override, media_override: t.media_override, options: targets[i]?.options || null }));
    }
  } catch (e) {
    console.error('[SocialPublish] setup error:', e.message);
    return { statusCode: 200, headers, body: JSON.stringify({ error: String(e.message || e) }) };
  }

  // ---- decide schedule vs publish-now ---------------------------------------
  let scheduleDate = null;
  if (post.scheduled_at) {
    const when = new Date(post.scheduled_at);
    if (!isNaN(when.getTime()) && when.getTime() > Date.now() + 30000) scheduleDate = when.toISOString();
  }

  // ---- build provider targets (resolve overrides against the base) ----------
  const provTargets = targetRows.map((t) => ({
    _id: t.id,
    platform: t.platform,
    text: (t.text_override != null && t.text_override !== '') ? t.text_override : (post.base_text || ''),
    mediaUrls: mediaUrlsFrom(t.media_override != null ? t.media_override : post.base_media),
    options: t.options || undefined,
  }));

  // ---- publish through the provider -----------------------------------------
  let result;
  try {
    result = await provider.publish({ profileKey: socialProfile.profile_key, targets: provTargets, scheduleDate });
  } catch (e) {
    console.error('[SocialPublish] publish error:', e.message);
    await supabase.from('social_posts').update({ status: 'failed', error: String(e.message || e) }).eq('id', post.id);
    return { statusCode: 200, headers, body: JSON.stringify({ post_id: post.id, status: 'failed', error: String(e.message || e) }) };
  }

  // ---- write per-target results back ----------------------------------------
  const nowIso = new Date().toISOString();
  const byPlatform = {};
  for (const s of result.statuses) byPlatform[s.platform] = s;

  for (const t of provTargets) {
    const s = byPlatform[t.platform];
    if (!s) continue;
    await supabase.from('social_post_targets').update({
      status: s.status, provider_ref: s.ref || null, permalink: s.permalink || null,
      error: s.error || null, published_at: s.status === 'published' ? nowIso : null,
    }).eq('id', t._id);
  }

  const rollup = rollupPostStatus(result.statuses.map((s) => s.status));
  const firstRef = result.statuses.find((s) => s.ref)?.ref || null;
  await supabase.from('social_posts').update({
    status: rollup, provider_post_id: firstRef,
    error: rollup === 'failed' || rollup === 'partial'
      ? (result.statuses.find((s) => s.error)?.error || null) : null,
  }).eq('id', post.id);

  return {
    statusCode: 200, headers,
    body: JSON.stringify({ post_id: post.id, status: rollup, targets: result.statuses }),
  };
};
