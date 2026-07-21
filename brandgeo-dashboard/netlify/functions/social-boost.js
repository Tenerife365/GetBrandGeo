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
// POST { client_id }
//   -> { ideas: [{ source, title, why, brief, context }], brand, has_data }
//   -> { ideas: [], has_data:false, hint } when there is nothing to boost from.
// ============================================================================
const { requireAuth } = require('./_auth');

const GAP_LOOKBACK_DAYS = 90;
const MAX_IDEAS = 8;

// Statuses that mean a recommendation is already handled -> don't resurface it.
const DONE_STATUSES = new Set(['done', 'dismissed', 'actioned', 'resolved', 'archived']);

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
    const { data: client } = await supabase
      .from('clients').select('name, brand_name, brand_website').eq('id', client_id).single();
    const brand = client?.brand_name || client?.name || 'your brand';

    // ── Competitors (names only; used to enrich gap context + one counter idea) ──
    const { data: comps } = await supabase
      .from('competitors').select('name').eq('client_id', client_id).limit(12);
    const compNames = Array.from(new Set((comps || []).map((c) => c.name).filter(Boolean)));

    // ── Visibility gaps: prompts that got checked but where the brand rarely/never appears ──
    const { data: prompts } = await supabase
      .from('prompts').select('id, text').eq('client_id', client_id).eq('is_active', true);
    const promptById = new Map((prompts || []).map((p) => [p.id, p.text]));

    const since = new Date(Date.now() - GAP_LOOKBACK_DAYS * 86_400_000).toISOString();
    const { data: results } = await supabase
      .from('ai_results')
      .select('prompt_id, brand_mentioned, status')
      .eq('client_id', client_id)
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
      gaps.push({ text, rate, checks: s.checks, mentions: s.mentions });
    }
    gaps.sort((a, b) => a.rate - b.rate);       // biggest gap (lowest mention rate) first

    // ── Recommendations (open only) ──
    const { data: recsRaw } = await supabase
      .from('recommendations')
      .select('title, insight, action, priority, status, created_at')
      .eq('client_id', client_id)
      .order('created_at', { ascending: false })
      .limit(15);
    const seenRec = new Set();
    const recs = (recsRaw || [])
      .filter((r) => !DONE_STATUSES.has(String(r.status || '').toLowerCase()))
      .filter((r) => r.title && !seenRec.has(r.title) && seenRec.add(r.title))
      .slice(0, 4);

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
