// ============================================================================
// seo-opportunities.js  --  AI SEO Phase 1: turn a client's GEO data into
// concrete NEW-CONTENT briefs (AI-SEO-SPEC.md). The content sibling of Social
// Boost: same grounded signals (via _geo_signals.js), shaped as pages/articles
// to publish instead of social posts.
//
// DETERMINISTIC (no LLM). It reads the signals, builds a brief per signal
// (outline + target prompt + guidance + target entities + grounding context),
// and UPSERTS them into seo_briefs keyed by (client_id, source, source_ref) so
// re-running refreshes the deterministic fields WITHOUT wiping a brief's status
// or an already-generated draft. The "Draft it" step (seo-draft.js) then
// expands a chosen brief into a full GEO-scored draft.
//
// POST { client_id }
//   -> { briefs: [SeoBrief], brand, has_data, hint }
//   -> { briefs: [], has_data:false, hint } when there is nothing to work from.
// ============================================================================
const { requireAuth } = require('./_auth');
const { gatherGeoSignals } = require('./_geo_signals');

const MAX_GAP_BRIEFS = 6;
const MAX_REC_BRIEFS = 4;

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
    const { brand, competitors, gaps, recommendations } = await gatherGeoSignals(supabase, client_id);
    const compList = competitors.slice(0, 6);
    const compHint = compList.length
      ? ` Competitors seen in this space include ${compList.slice(0, 3).join(', ')}.` : '';

    // ── Build one content brief per signal ──────────────────────────────────
    const rows = [];

    for (const g of gaps.slice(0, MAX_GAP_BRIEFS)) {
      const pct = Math.round(g.rate * 100);
      rows.push({
        client_id,
        source: 'visibility_gap',
        source_ref: `gap:${g.prompt_id}`,
        title: `Create content that answers: "${trim(g.text, 70)}"`,
        target_prompt: g.text,
        outline: [
          `A direct, one-paragraph answer to "${trim(g.text, 90)}"`,
          `Who ${brand} is and exactly who it is for`,
          `The specific, checkable facts: services, coverage, credentials, results`,
          `How ${brand} stacks up on the criteria buyers actually use`,
          `FAQs that mirror how people phrase this in AI chats`,
          `A clear next step`,
        ],
        guidance:
          `${brand} appears in ${g.mentions === 0 ? 'none' : `only ${pct}%`} of recent AI answers for "${g.text}". `
          + `Publish a focused page whose first paragraph answers the query outright, states every claim as a checkable fact `
          + `(numbers, coverage, credentials), names ${brand} explicitly next to each claim so an AI can attribute it, `
          + `and includes an FAQ block with schema. Keep dates and figures current.${compHint}`,
        target_entities: { brand, competitors: compList },
        context:
          `AI-answer gap: for the query "${g.text}", ${brand} was mentioned in ${g.mentions} of ${g.checks} recent AI answers.`
          + `${compHint} Establish ${brand}'s concrete, verifiable strengths on this topic. Do not invent facts.`,
      });
    }

    for (const r of recommendations.slice(0, MAX_REC_BRIEFS)) {
      const detail = [r.insight, r.action].filter(Boolean).join(' ');
      rows.push({
        client_id,
        source: 'recommendation',
        source_ref: `rec:${slug(r.title)}`,
        title: `Publish a page for: ${trim(r.title, 80)}`,
        target_prompt: null,
        outline: [
          `Open with the specific point: ${trim(r.insight || r.title, 100)}`,
          `What ${brand} does about it, concretely`,
          `The evidence: specific facts, numbers, or examples`,
          `What the reader should take away or do next`,
        ],
        guidance:
          `Turn the BrandGEO recommendation "${r.title}" into a standalone, quotable page. ${detail} `
          + `Lead with the answer, keep every claim checkable, and name ${brand} explicitly next to each claim.`,
        target_entities: { brand, competitors: compList },
        context:
          `This page executes a BrandGEO recommendation for ${brand}: "${r.title}". ${detail} `
          + `Turn it into concrete, quotable content. Do not invent facts.`,
      });
    }

    if (compList.length) {
      rows.push({
        client_id,
        source: 'competitor',
        source_ref: 'competitors',
        title: `Win the "who should I choose" answer vs ${compList.slice(0, 2).join(' and ')}`,
        target_prompt: null,
        outline: [
          `The buyer question this page answers`,
          `What ${brand} does well, stated as concrete facts`,
          `The criteria that matter for this choice`,
          `Why ${brand} is a strong fit, without naming competitors`,
          `A clear next step`,
        ],
        guidance:
          `Competitors are cited in AI answers for ${brand}'s space: ${compList.join(', ')}. `
          + `Publish a page that differentiates ${brand} on concrete, verifiable strengths, without naming or knocking rivals, `
          + `so AI engines cite ${brand} when buyers ask who to choose.`,
        target_entities: { brand, competitors: compList },
        context:
          `Competitors frequently cited in AI answers for ${brand}'s space: ${compList.join(', ')}. `
          + `Differentiate ${brand} on concrete, verifiable strengths, without naming competitors.`,
      });
    }

    // ── Upsert. Omit status/draft_text/geo_score/drafted_at from the payload so
    //    an existing brief keeps its state; new rows take the column defaults
    //    (status='idea'). Keyed by the unique (client_id, source, source_ref). ──
    if (rows.length) {
      const payload = rows.map((r) => ({ ...r, updated_at: new Date().toISOString() }));
      const { error: upErr } = await supabase
        .from('seo_briefs')
        .upsert(payload, { onConflict: 'client_id,source,source_ref' });
      if (upErr) throw new Error(upErr.message);
    }

    // Return the client's current, non-dismissed briefs (freshest/actionable first).
    const { data: briefs } = await supabase
      .from('seo_briefs')
      .select('id, source, source_ref, title, target_prompt, outline, guidance, target_entities, status, geo_score, context, drafted_at, updated_at')
      .eq('client_id', client_id)
      .neq('status', 'dismissed')
      .order('status', { ascending: true })
      .order('updated_at', { ascending: false });

    const list = briefs || [];
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        brand,
        has_data: list.length > 0,
        briefs: list,
        hint: list.length ? null
          : 'No content opportunities yet. Run a collection on AI Visibility so we can see where your brand is missing from AI answers, then come back.',
      }),
    };
  } catch (e) {
    console.error('[SeoOpportunities] error:', e.message);
    return { statusCode: 200, headers, body: JSON.stringify({ briefs: [], has_data: false, error: String(e.message || e) }) };
  }
};

function trim(s, n) {
  const t = String(s || '');
  return t.length > n ? t.slice(0, n - 1).trimEnd() + '…' : t;
}

// Stable, short slug for a recommendation title -> source_ref, so the same rec
// updates its brief rather than creating a new one each run.
function slug(s) {
  return String(s || 'rec')
    .toLowerCase()
    .normalize('NFKD').replace(/[̀-ͯ]/g, '')  // strip diacritics
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48) || 'rec';
}
