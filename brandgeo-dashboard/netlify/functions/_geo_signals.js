// ============================================================================
// _geo_signals.js  --  shared GEO signal gathering.
//
// Reads a client's own AI-visibility data into one structured object:
//   * visibility gaps  -- prompts checked recently where the brand rarely/never
//                         appears in AI answers (biggest gap first)
//   * open recommendations
//   * competitors seen in the client's space
//
// Both social-boost.js (post ideas) and seo-opportunities.js (content briefs)
// shape THESE SAME signals into their own outputs, so AI Social and AI SEO draw
// from one grounded source of truth (AI-SEO-SPEC.md "Reuses"). Extracting this
// from social-boost.js is a no-behaviour-change refactor -- social-boost keeps
// its exact slicing/idea-building, it just no longer owns the data gathering.
//
// Underscore prefix = Netlify does NOT expose this as a public endpoint.
// ============================================================================

const GAP_LOOKBACK_DAYS = 90;

// Statuses that mean a recommendation is already handled -> don't resurface it.
const DONE_STATUSES = new Set(['done', 'dismissed', 'actioned', 'resolved', 'archived']);

/**
 * gatherGeoSignals(supabase, clientId) -> Promise<{
 *   brand, website,
 *   competitors: string[],                                  // deduped, <=12
 *   gaps: [{ text, rate, checks, mentions, prompt_id }],    // sorted rate asc
 *   recommendations: [{ title, insight, action, priority, status, created_at }],
 * }>
 *
 * Returns the FULL sorted/filtered lists; each caller slices to taste. Never
 * throws for missing data -- an empty client yields empty arrays.
 */
async function gatherGeoSignals(supabase, clientId) {
  const { data: client } = await supabase
    .from('clients').select('name, brand_name, brand_website').eq('id', clientId).single();
  const brand = client?.brand_name || client?.name || 'your brand';
  const website = client?.brand_website || '';

  // ── Competitors (names only) ──
  const { data: comps } = await supabase
    .from('competitors').select('name').eq('client_id', clientId).limit(12);
  const competitors = Array.from(new Set((comps || []).map((c) => c.name).filter(Boolean)));

  // ── Visibility gaps: prompts checked recently where the brand rarely appears ──
  const { data: prompts } = await supabase
    .from('prompts').select('id, text').eq('client_id', clientId).eq('is_active', true);
  const promptById = new Map((prompts || []).map((p) => [p.id, p.text]));

  const since = new Date(Date.now() - GAP_LOOKBACK_DAYS * 86_400_000).toISOString();
  const { data: results } = await supabase
    .from('ai_results')
    .select('prompt_id, brand_mentioned, status')
    .eq('client_id', clientId)
    .gte('checked_at', since);

  const stat = new Map(); // prompt_id -> { checks, mentions }
  for (const r of results || []) {
    if (r.status && r.status !== 'ok') continue;
    const s = stat.get(r.prompt_id) || { checks: 0, mentions: 0 };
    s.checks += 1;
    if (r.brand_mentioned) s.mentions += 1;
    stat.set(r.prompt_id, s);
  }

  const gaps = [];
  for (const [pid, s] of stat.entries()) {
    if (s.checks < 1) continue;
    const rate = s.mentions / s.checks;
    if (rate >= 1) continue;                 // fully mentioned already -> not a gap
    const text = promptById.get(pid);
    if (!text) continue;
    gaps.push({ text, rate, checks: s.checks, mentions: s.mentions, prompt_id: pid });
  }
  gaps.sort((a, b) => a.rate - b.rate);       // biggest gap (lowest mention rate) first

  // ── Recommendations (open only, deduped by title, most-recent first) ──
  const { data: recsRaw } = await supabase
    .from('recommendations')
    .select('title, insight, action, priority, status, created_at')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })
    .limit(15);
  const seenRec = new Set();
  const recommendations = (recsRaw || [])
    .filter((r) => !DONE_STATUSES.has(String(r.status || '').toLowerCase()))
    .filter((r) => r.title && !seenRec.has(r.title) && seenRec.add(r.title));

  return { brand, website, competitors, gaps, recommendations };
}

module.exports = { gatherGeoSignals, GAP_LOOKBACK_DAYS, DONE_STATUSES };
