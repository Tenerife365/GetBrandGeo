// ============================================================================
// seo-draft.js  --  AI SEO Phase 1: expand a brief into a full, GEO-scored
// content draft (the tiered "Draft it" step, AI-SEO-SPEC.md). Cheap by default:
// briefs are free/deterministic (seo-opportunities.js); only this step spends an
// LLM call, and only when the user asks for a draft.
//
// POST { client_id, brief_id, premium?: bool }
//   -> { draft_text, geo_score: { seo, geo, verdict, notes }, status }
//   -> { error } (HTTP 200) on any failure -- the UI shows it inline and the
//      brief stays as an idea. Never a hard failure.
//
// Model: Claude Haiku by default; Sonnet when premium:true (deeper, costlier),
// with a Haiku fallback so a Sonnet outage never dead-ends the user. Reuses
// ANTHROPIC_API_KEY (already set for social-generate / assistant).
// ============================================================================
const { requireAuth } = require('./_auth');

const HAIKU = 'claude-haiku-4-5-20251001';
const SONNET = 'claude-sonnet-5';
const TIMEOUT_MS = 22000;

// Per-plan monthly draft cap (cost control, mirrors the SerpApi weekly-cap idea
// in AI-SEO-SPEC.md). Admins bypass it -- they run the managed/done-for-you work
// across many clients. A client below the AI SEO min plan never reaches here
// (the page + nav are feature-gated), so free/essentials are 0 for completeness.
const DRAFT_MONTHLY_CAP = {
  free: 0, essentials: 0, growth: 10, managed: 30, pro: 60, enterprise: 200,
};

function monthStartIso() {
  const d = new Date();
  d.setDate(1); d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function buildPrompt(brief, brand, website) {
  const outline = Array.isArray(brief.outline) ? brief.outline : [];
  const ents = brief.target_entities || {};
  const competitors = Array.isArray(ents.competitors) ? ents.competitors : [];

  return (
`You are writing a single web page for ${brand}${website ? ` (${website})` : ''} whose job is to be RETRIEVED, VERIFIED, and CITED by AI answer engines (ChatGPT, Gemini, Perplexity, Google AI) when someone asks about this topic.

The opportunity:
${brief.title}
${brief.target_prompt ? `\nIt should be the best possible answer to this real buyer query: "${brief.target_prompt}"\n` : ''}
Grounding facts (use ONLY these as the factual basis; invent nothing beyond them, no fake statistics, customers, or results):
${brief.context || brief.guidance || 'Use only verifiable, concrete facts about the brand.'}

How to make it quotable (the GEO bar):
- Answer the core question directly in the first two or three sentences, not after a slow build-up.
- Write at least four standalone sentences that would still make complete sense lifted out as a citation (no "as we said above", no dangling "it"/"the platform" -- name ${brand} explicitly next to each major claim).
- Use real structure for list-shaped or comparative content: an actual markdown table or bullet list, not paragraphs pretending to be lists.
- Attribute any number to a clear, checkable source; if you were not given a source, do not state the number.
- Include a short FAQ section mirroring how people phrase this in AI chats.
${competitors.length ? `- Differentiate ${brand} on concrete strengths WITHOUT naming these competitors: ${competitors.join(', ')}.\n` : ''}
Suggested outline (adapt as needed):
${outline.map((s, i) => `${i + 1}. ${s}`).join('\n')}

Language: write the whole draft in the SAME language as the buyer query and grounding facts above. Do not default to English if they are in another language.

Voice rules, strictly:
- Never use em dashes or en dashes. Use commas, periods, or parentheses.
- No "not just X, it's Y", no "in today's landscape", no "let's dive in", no three-item rhetorical lists, no "in conclusion".
- Write like a person who knows the subject, not like marketing copy.

Then grade your own draft honestly on two 0-100 scales: SEO (title/meta/headings/keyword coverage/internal-link-ready structure/depth/readability) and GEO (directly quotable claims, machine-parseable structure, sourced stats, entity clarity, direct question-answering, original insight, freshness). Be a harsh grader; 90+ is rare.

Reply with ONLY a JSON object, no markdown fences and no commentary:
{"draft_text": "the full draft in markdown", "geo_score": {"seo": <0-100 int>, "geo": <0-100 int>, "verdict": "ready" | "needs_revision", "notes": "one or two sentences on the biggest gap to fix"}}`
  );
}

function extractJson(raw) {
  const s = String(raw || '').trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
  const start = s.indexOf('{');
  if (start === -1) return null;
  let depth = 0, inStr = false, esc = false;
  for (let i = start; i < s.length; i++) {
    const ch = s[i];
    if (inStr) {
      if (esc) esc = false;
      else if (ch === '\\') esc = true;
      else if (ch === '"') inStr = false;
      continue;
    }
    if (ch === '"') inStr = true;
    else if (ch === '{') depth++;
    else if (ch === '}') { depth--; if (depth === 0) { try { return JSON.parse(s.slice(start, i + 1)); } catch { return null; } } }
  }
  return null;
}

async function callClaude(model, prompt) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({ model, max_tokens: 4000, messages: [{ role: 'user', content: prompt }] }),
      signal: controller.signal,
    });
    if (!res.ok) {
      const b = await res.text().catch(() => '');
      console.error(`[SeoDraft] ${model} non-200: ${res.status} ${b.slice(0, 300)}`);
      return null;
    }
    const data = await res.json();
    return data?.content?.[0]?.text || null;
  } catch (e) {
    console.error(`[SeoDraft] ${model} call failed: ${e.message}`);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

// Strip any dash the model slipped in anyway (same standing rule as the site copy).
function deDash(text) {
  return String(text || '').replace(/\s*[—–]\s*/g, ', ');
}

exports.handler = async (event) => {
  const auth = await requireAuth(event);
  if (auth.response) return auth.response;
  const { headers, supabase, profile } = auth;

  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: 'Method Not Allowed' };

  let body;
  try { body = JSON.parse(event.body); } catch { return { statusCode: 400, headers, body: 'Invalid JSON' }; }

  const { client_id, brief_id, premium } = body;
  if (!client_id) return { statusCode: 400, headers, body: JSON.stringify({ error: 'client_id required' }) };
  if (!brief_id) return { statusCode: 400, headers, body: JSON.stringify({ error: 'brief_id required' }) };
  if (profile.role !== 'admin' && String(profile.client_id) !== String(client_id)) {
    return { statusCode: 403, headers, body: JSON.stringify({ error: 'Forbidden: client mismatch' }) };
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return { statusCode: 200, headers, body: JSON.stringify({ error: 'AI drafting is not configured (ANTHROPIC_API_KEY missing).' }) };
  }

  try {
    // Load the brief and confirm it belongs to this client (defence in depth on
    // top of the ownership check above -- a brief_id from another tenant is a 404).
    const { data: brief } = await supabase
      .from('seo_briefs')
      .select('id, client_id, title, target_prompt, outline, guidance, target_entities, context')
      .eq('id', brief_id)
      .eq('client_id', client_id)
      .single();
    if (!brief) {
      return { statusCode: 200, headers, body: JSON.stringify({ error: 'Brief not found for this client.' }) };
    }

    const { data: client } = await supabase
      .from('clients').select('name, brand_name, brand_website, plan').eq('id', client_id).single();
    const brand = client?.brand_name || client?.name || 'this brand';
    const website = client?.brand_website || '';

    // ── Per-plan monthly draft cap (cost control). Admins bypass it. ──
    if (profile.role !== 'admin') {
      const plan = client?.plan || 'free';
      const cap = DRAFT_MONTHLY_CAP[plan] ?? 0;
      const { count } = await supabase
        .from('seo_briefs')
        .select('*', { count: 'exact', head: true })
        .eq('client_id', client_id)
        .gte('drafted_at', monthStartIso());
      if ((count || 0) >= cap) {
        return {
          statusCode: 200, headers,
          body: JSON.stringify({ error: `You have reached this plan's monthly draft limit (${cap}). It resets next month, or contact us to raise it.` }),
        };
      }
    }

    // Mark drafting so a slow generation shows progress if the list is re-read.
    await supabase.from('seo_briefs').update({ status: 'drafting' }).eq('id', brief.id);

    const prompt = buildPrompt(brief, brand, website);
    let raw = null;
    if (premium) raw = await callClaude(SONNET, prompt);
    if (!raw) raw = await callClaude(HAIKU, prompt);
    if (!raw) {
      await supabase.from('seo_briefs').update({ status: 'idea' }).eq('id', brief.id);
      return { statusCode: 200, headers, body: JSON.stringify({ error: 'The writer is unavailable right now. Please try again in a moment.' }) };
    }

    const parsed = extractJson(raw);
    const draftText = parsed && typeof parsed.draft_text === 'string' ? deDash(parsed.draft_text).trim() : '';
    if (!draftText) {
      console.error('[SeoDraft] unparseable/empty draft:', String(raw).slice(0, 300));
      await supabase.from('seo_briefs').update({ status: 'idea' }).eq('id', brief.id);
      return { statusCode: 200, headers, body: JSON.stringify({ error: 'Could not read the generated draft. Please try again.' }) };
    }

    // Normalise the self-score into the stored shape.
    const gs = (parsed && typeof parsed.geo_score === 'object' && parsed.geo_score) || {};
    const clampScore = (n) => {
      const v = Math.round(Number(n));
      return Number.isFinite(v) ? Math.max(0, Math.min(100, v)) : null;
    };
    const geo_score = {
      seo: clampScore(gs.seo),
      geo: clampScore(gs.geo),
      verdict: gs.verdict === 'ready' ? 'ready' : 'needs_revision',
      notes: typeof gs.notes === 'string' ? gs.notes.slice(0, 500) : '',
    };

    const { error: saveErr } = await supabase
      .from('seo_briefs')
      .update({
        draft_text: draftText,
        geo_score,
        status: 'drafted',
        drafted_at: new Date().toISOString(),
      })
      .eq('id', brief.id);
    if (saveErr) throw new Error(saveErr.message);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ draft_text: draftText, geo_score, status: 'drafted' }),
    };
  } catch (e) {
    console.error('[SeoDraft] error:', e.message);
    return { statusCode: 200, headers, body: JSON.stringify({ error: String(e.message || e) }) };
  }
};
