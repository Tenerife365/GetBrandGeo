// ============================================================================
// _social.js  --  shared helpers for the social-* functions (not an endpoint).
// ============================================================================

// Ensure a social_profiles row exists for this workspace and return it.
// profile_key stays null on the single-profile (Premium) plan; on multi-profile
// plans it is set once the workspace is provisioned an Ayrshare profile.
async function ensureSocialProfile(supabase, clientId) {
  const { data: existing } = await supabase
    .from('social_profiles')
    .select('client_id, provider, profile_key, ref_id, profile_title, brand_voice')
    .eq('client_id', clientId)
    .maybeSingle();
  if (existing) return existing;

  const { data: created, error } = await supabase
    .from('social_profiles')
    .insert({ client_id: clientId })
    .select('client_id, provider, profile_key, ref_id, profile_title, brand_voice')
    .single();
  if (error) throw new Error(`ensureSocialProfile: ${error.message}`);
  return created;
}

// Guard: refuse to act on a workspace that is not bound to a provider profile.
//
// WHY THIS IS NOT OPTIONAL. A null profile_key omits the Profile-Key header,
// which makes Ayrshare fall back to the account's PRIMARY profile. On an account
// with one profile per client that means a post composed for client A publishes
// to whatever channels the primary profile owns -- the wrong brand's audience,
// silently, with a success response. So an unbound workspace is a hard error.
//
// Escape hatch for a genuine single-profile (Ayrshare Premium) setup, where the
// default profile IS the only workspace: set AYRSHARE_SINGLE_PROFILE=true.
function requireBoundProfile(sp) {
  if (String(process.env.AYRSHARE_SINGLE_PROFILE || '').toLowerCase() === 'true') return null;
  if (sp && sp.profile_key) return null;
  return 'This workspace is not linked to a social profile yet. An admin needs to bind its Ayrshare profile key on the Accounts tab before anything can be published.';
}

// Pull plain media URLs out of a [{url, type, alt}] media array.
function mediaUrlsFrom(media) {
  if (!Array.isArray(media)) return [];
  return media.map((m) => (m && typeof m === 'object' ? m.url : m)).filter(Boolean);
}

// Roll a set of per-target statuses up into the parent post's status.
function rollupPostStatus(targetStatuses) {
  const s = targetStatuses.filter(Boolean);
  if (!s.length) return 'draft';
  const has = (v) => s.some((x) => x === v);
  const all = (v) => s.every((x) => x === v);
  if (all('failed')) return 'failed';
  if (all('published')) return 'published';
  if (all('scheduled')) return 'scheduled';
  if (has('failed') && (has('published') || has('scheduled'))) return 'partial';
  return 'publishing';
}

module.exports = { ensureSocialProfile, requireBoundProfile, mediaUrlsFrom, rollupPostStatus };
