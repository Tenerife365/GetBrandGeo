// ============================================================================
// social-queue.js  --  the TRUE queue for a workspace: what is scheduled at the
// provider, including posts this dashboard did not create (scheduled straight in
// the Ayrshare dashboard, or by whoever set the account up).
//
// WHY. social_posts only knows about posts made through BrandGEO. A client who
// already has next week lined up elsewhere would see an empty calendar here and
// schedule the same thing twice. This reads the provider's own history so the
// calendar reflects reality.
//
// POST { client_id, scheduled_only? (default true), limit?, last_days? }
//   -> { posts: [{ ref, text, platforms[], scheduledAt, status, permalink,
//                  external }] }
//      external=true means it was NOT created in BrandGEO (no matching
//      social_post_targets.provider_ref), so the UI can label it and the user
//      does not double-post.
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
  if (!provider.isConfigured() || typeof provider.listRemotePosts !== 'function') {
    return { statusCode: 200, headers, body: JSON.stringify({ posts: [] }) };
  }

  try {
    const sp = await ensureSocialProfile(supabase, client_id);
    // Same isolation rule as everywhere else: with no key the provider answers
    // for the primary profile, which would show another tenant's queue here.
    const unbound = requireBoundProfile(sp);
    if (unbound) return { statusCode: 200, headers, body: JSON.stringify({ posts: [], unbound: true, hint: unbound }) };

    const remote = await provider.listRemotePosts({
      profileKey: sp.profile_key,
      scheduledOnly: body.scheduled_only !== false,
      limit: Math.min(Number(body.limit) || 50, 200),
      lastDays: Number(body.last_days) || 60,
    });

    // Mark which of these BrandGEO created, by matching the provider refs we
    // stored at publish time. Everything else was scheduled elsewhere.
    const refs = remote.map((r) => r.ref).filter(Boolean);
    let known = new Set();
    if (refs.length) {
      const { data } = await supabase
        .from('social_post_targets').select('provider_ref')
        .eq('client_id', client_id).in('provider_ref', refs);
      known = new Set((data || []).map((r) => r.provider_ref));
    }

    return {
      statusCode: 200, headers,
      body: JSON.stringify({ posts: remote.map((r) => ({ ...r, external: !known.has(r.ref) })) }),
    };
  } catch (e) {
    console.error('[SocialQueue] error:', e.message);
    return { statusCode: 200, headers, body: JSON.stringify({ posts: [], error: String(e.message || e) }) };
  }
};
