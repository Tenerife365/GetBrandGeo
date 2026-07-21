// ============================================================================
// social-boost.js  --  AI Social "Social Boost": turn a client's own GEO data
// (AI Visibility gaps + Recommendations + Competitors) into concrete, grounded
// post ideas. The differentiator vs a generic scheduler: posts aimed at the
// exact topics where the brand is invisible in AI answers, so future answers can
// cite them.
//
// This endpoint is DETERMINISTIC (no LLM) -- it reads the data and builds idea
// cards. The user picks one; social-generate.js then does the actual writing,
// with the idea's `context` passed in as grounding.
//
// The GEO signal gathering now lives in the shared _geo_signals.js so AI SEO's
// seo-opportunities draws from the same source of truth (AI-SEO-SPEC.md). This
// file keeps its exact idea-building/slicing -- no behaviour change.
//
// POST { client_id }
//   -> { ideas: [{ source, title, why, brief, context }], brand, has_data }
//   -> { ideas: [], has_data:false, hint } when there is nothing to boost from.
// ============================================================================
const { requireAuth } = require('./_auth');
const { gatherGeoSignals } = require('./_geo_signals');

const MAX_IDEAS = 8;

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

  try {
    const { brand, competitors: compNames, gaps, recommendations } = await gatherGeoSignals(supabase, client_id);
    const recs = recommendations.slice(0, 4);

    // ── Build the idea cards, interleaving sources so it isn't all one kind ──
    const ideas = [];

    for (const g of gaps.slice(0, 5)) {
      const pct = Math.round(g.rate * 100);
      const compHint = compNames.length ? ` Competitors seen for this topic include ${compNames.slice(0, 3).join(', ')}.` : '';
      ideas.push({
        source: 'visibility_gap',
        title: `Get cited for: "${trim(g.text, 70)}"`,
        why: g.mentions === 0
          ? `${brand} is not mentioned in AI answers for this topic yet`
          : `${brand} appears in only ${pct}% of AI answers here`,
        brief: `Write a post that makes ${brand} a strong, quotable answer to: "${g.text}". State the specific, checkable facts (what, who it is for, the concrete detail) that would make an AI assistant cite ${brand} for this.`,
        context: `AI-answer gap: for the query "${g.text}", ${brand} was mentioned in ${g.mentions} of ${g.checks} recent AI answers.${compHint} Establish ${brand}'s concrete, verifiable strengths on this topic. Do not invent facts.`,
      });
    }

    for (const r of recs) {
      const detail = [r.insight, r.action].filter(Boolean).join(' ');
      ideas.push({
        source: 'recommendation',
        title: r.title,
        why: `From your Recommendations${r.priority ? ` (${r.priority} priority)` : ''}`,
        brief: r.action || r.insight || `Create a post that acts on: ${r.title}`,
        context: `This post executes a BrandGEO recommendation for ${brand}: "${r.title}". ${detail} Turn this into concrete, quotable social content. Do not invent facts.`,
      });
    }

    if (compNames.length) {
      ideas.push({
        source: 'competitor',
        title: `Stand out vs ${compNames.slice(0, 2).join(' and ')}`,
        why: `These competitors are cited in AI answers in your space`,
        brief: `Write a post that shows why ${brand} is a strong choice, using concrete facts about what ${brand} does well. Do not name or knock competitors.`,
        context: `Competitors frequently cited in AI answers for ${brand}'s space: ${compNames.slice(0, 6).join(', ')}. Differentiate ${brand} on concrete, verifiable strengths, without naming competitors.`,
      });
    }

    const trimmed = ideas.slice(0, MAX_IDEAS);
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        brand,
        has_data: trimmed.length > 0,
        ideas: trimmed,
        hint: trimmed.length ? null
          : 'No GEO data to boost from yet. Run a collection on AI Visibility first, then come back and Social Boost will target your real gaps.',
      }),
    };
  } catch (e) {
    console.error('[SocialBoost] error:', e.message);
    return { statusCode: 200, headers, body: JSON.stringify({ ideas: [], has_data: false, error: String(e.message || e) }) };
  }
};

function trim(s, n) {
  const t = String(s || '');
  return t.length > n ? t.slice(0, n - 1).trimEnd() + '…' : t;
}
