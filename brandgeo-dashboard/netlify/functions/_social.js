// ============================================================================
// _social.js  --  shared helpers for the social-* functions (not an endpoint).
// ============================================================================

// Ensure a social_profiles row exists for this workspace and return it.
// profile_key stays null on the single-profile (Premium) plan; on multi-profile
// plans it is set once the workspace is provisioned an Ayrshare profile.
async function ensureSocialProfile(supabase, clientId) {
  const { data: existing } = await supabase
    .from('social_profiles')
    .select('client_id, provider, profile_key, ref_id, brand_voice')
    .eq('client_id', clientId)
    .maybeSingle();
  if (existing) return existing;

  const { data: created, error } = await supabase
    .from('social_profiles')
    .insert({ client_id: clientId })
    .select('client_id, provider, profile_key, ref_id, brand_voice')
    .single();
  if (error) throw new Error(`ensureSocialProfile: ${error.message}`);
  return created;
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

module.exports = { ensureSocialProfile, mediaUrlsFrom, rollupPostStatus };
