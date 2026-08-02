// ============================================================================
// seo-audit-page.js  --  AI SEO Phase 2: score one crawled page for GEO quality
// and return concrete edits. One Haiku call over the stored content_md.
//
// POST { client_id, page_id }
//   -> { geo_score, audit: { summary, issues:[{severity,text}], suggestions:[text] }, status:'audited' }
//   -> { error } (HTTP 200) on any failure -- the row stays 'crawled'.
// ============================================================================
const { requireAuth } = require('./_auth');

const HAIKU = 'claude-haiku-4-5-20251001';
const TIMEOUT_MS = 20000;

function buildPrompt(brand, page) {
  return (
`You are auditing one web page for ${brand} on how well an AI answer engine (ChatGPT, Gemini, Perplexity, Google AI) could retrieve, verify, and CITE it. Score it 0-100 on GEO quality and list concrete, specific edits.

Judge on: does it answer its core question directly and early; are there standalone, quotable claims (no dangling "it"/"the platform"); is list/comparison content in real lists or tables (the "Technical signals" line reports this); are statistics attributed to a checkable source; is the brand/entity named explicitly near claims; is there an FAQ and valid structured data (JSON-LD); is it fresh/dated. Be a harsh grader; 90+ is rare.

Page URL: ${page.url}
Page title: ${page.title || '(none)'}

Page content (extracted text + a Technical signals line at the end):
"""
${String(page.content_md || '').slice(0, 12000)}
"""

Write in the SAME language as the page. Never use em dashes or en dashes.

BUDGET, and staying inside it matters more than being exhaustive: AT MOST 6
issues and AT MOST 6 suggestions, each UNDER 220 characters, and the summary
under 200. Pick the highest-impact ones and stop. A reply that runs long gets
cut off in transit and is then worth nothing, so prefer fewer, sharper items.

Reply with ONLY a JSON object, no markdown fences:
{"geo_score": <0-100 int>,
 "summary": "one sentence on the single biggest gap",
 "issues": [{"severity":"high"|"med"|"low","text":"a specific problem, citing the part of the page"}],
 "suggestions": ["a concrete edit to make, in priority order"]}`
  );
}

function extractJson(raw) {
  const s = String(raw || '').trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
  const start = s.indexOf('{');
  if (start === -1) return null;
  let depth = 0, inStr = false, esc = false;
  for (let i = start; i < s.length; i++) {
    const ch = s[i];
    if (inStr) { if (esc) esc = false; else if (ch === '\\') esc = true; else if (ch === '"') inStr = false; continue; }
    if (ch === '"') inStr = true;
    else if (ch === '{') depth++;
    else if (ch === '}') { depth--; if (depth === 0) { try { return JSON.parse(s.slice(start, i + 1)); } catch { return null; } } }
  }
  return null;
}

async function callHaiku(prompt) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
      // 1500 was the ceiling until 2026-08-02 and is the prime suspect for the
      // silent "Could not read the audit result" failures: the schema above was
      // unbounded (the 10-item slice happens AFTER parsing, in this file, where
      // the model cannot see it), so a content-rich page in a language that
      // tokenizes poorly could run past the ceiling and arrive as truncated
      // JSON. extractJson then returns null and every trace was discarded.
      // The prompt now bounds the output; this is the belt to that braces.
      // Still well inside the 20s internal timeout and the 26s function budget.
      body: JSON.stringify({ model: HAIKU, max_tokens: 3000, messages: [{ role: 'user', content: prompt }] }),
      signal: controller.signal,
    });
    if (!res.ok) { console.error(`[SeoAuditPage] Haiku non-200: ${res.status}`); return null; }
    const data = await res.json();
    const text = data?.content?.[0]?.text || null;
    if (!text) { console.error('[SeoAuditPage] empty content in reply'); return null; }
    // stop_reason travels with the text so the caller can tell a TRUNCATED
    // reply from a malformed one. Without it both arrive as "extractJson
    // returned null" and are indistinguishable, which is what made the
    // 2026-08-02 failure on client 52 undiagnosable after the fact.
    return { text, stopReason: data?.stop_reason || null };
  } catch (e) { console.error(`[SeoAuditPage] call failed: ${e.message}`); return null; }
  finally { clearTimeout(timer); }
}

function deDash(t) { return String(t || '').replace(/\s*[—–]\s*/g, ', '); }

exports.handler = async (event) => {
  const auth = await requireAuth(event);
  if (auth.response) return auth.response;
  const { headers, supabase, profile } = auth;

  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: 'Method Not Allowed' };

  let body;
  try { body = JSON.parse(event.body); } catch { return { statusCode: 400, headers, body: 'Invalid JSON' }; }

  const { client_id, page_id } = body;
  if (!client_id) return { statusCode: 400, headers, body: JSON.stringify({ error: 'client_id required' }) };
  if (!page_id) return { statusCode: 400, headers, body: JSON.stringify({ error: 'page_id required' }) };
  if (profile.role !== 'admin' && String(profile.client_id) !== String(client_id)) {
    return { statusCode: 403, headers, body: JSON.stringify({ error: 'Forbidden: client mismatch' }) };
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return { statusCode: 200, headers, body: JSON.stringify({ error: 'AI audit is not configured (ANTHROPIC_API_KEY missing).' }) };
  }

  try {
    const { data: page } = await supabase
      .from('seo_pages').select('id, client_id, url, title, content_md')
      .eq('id', page_id).eq('client_id', client_id).single();
    if (!page) return { statusCode: 200, headers, body: JSON.stringify({ error: 'Page not found for this client.' }) };

    const { data: client } = await supabase
      .from('clients').select('name').eq('id', client_id).single();
    const brand = client?.name || 'this brand';

    const call = await callHaiku(buildPrompt(brand, page));
    if (!call) return { statusCode: 200, headers, body: JSON.stringify({ error: 'The auditor is unavailable right now. Please try again.' }) };

    const parsed = extractJson(call.text);
    if (!parsed) {
      // THIS PATH USED TO BE COMPLETELY SILENT. It returned the error string and
      // discarded call.text, so a real failure on a real client left nothing in
      // the Netlify logs and the only way to learn anything was to spend another
      // LLM call. Log enough to diagnose without re-running: why generation
      // stopped, how much came back, and the tail, which is where a truncated
      // reply visibly stops mid-token.
      const truncated = call.stopReason === 'max_tokens';
      console.error(
        `[SeoAuditPage] unparseable reply page=${page_id} client=${client_id} ` +
        `stop_reason=${call.stopReason} chars=${call.text.length} truncated=${truncated} ` +
        `tail=${JSON.stringify(call.text.slice(-300))}`
      );
      return { statusCode: 200, headers, body: JSON.stringify({
        error: truncated
          ? 'The audit ran long and was cut off before it finished. Please try again.'
          : 'Could not read the audit result. Please try again.',
        reason: truncated ? 'truncated' : 'unparseable',
      }) };
    }

    const clampScore = (n) => { const v = Math.round(Number(n)); return Number.isFinite(v) ? Math.max(0, Math.min(100, v)) : null; };
    const audit = {
      summary: typeof parsed.summary === 'string' ? deDash(parsed.summary).slice(0, 400) : '',
      issues: Array.isArray(parsed.issues) ? parsed.issues.slice(0, 10).map((i) => ({
        severity: ['high', 'med', 'low'].includes(i?.severity) ? i.severity : 'low',
        text: typeof i?.text === 'string' ? deDash(i.text).slice(0, 400) : '',
      })).filter((i) => i.text) : [],
      suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions.slice(0, 10)
        .map((s) => (typeof s === 'string' ? deDash(s).slice(0, 400) : '')).filter(Boolean) : [],
    };
    const geo_score = clampScore(parsed.geo_score);

    const { error: saveErr } = await supabase
      .from('seo_pages').update({ geo_score, audit, status: 'audited' }).eq('id', page.id);
    if (saveErr) throw new Error(saveErr.message);

    return { statusCode: 200, headers, body: JSON.stringify({ geo_score, audit, status: 'audited' }) };
  } catch (e) {
    console.error('[SeoAuditPage] error:', e.message);
    return { statusCode: 200, headers, body: JSON.stringify({ error: String(e.message || e) }) };
  }
};
