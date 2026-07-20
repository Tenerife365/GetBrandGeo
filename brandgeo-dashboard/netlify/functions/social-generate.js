// ============================================================================
// social-generate.js  --  AI Social Phase 2: turn a one-line brief into
// per-platform copy, written to be quotable by AI answer engines (the GEO pass).
//
// POST { client_id, brief, platforms?: [platform], premium?: bool }
//   -> { base_text, platforms: { instagram?, facebook?, linkedin?, gbp?, x? } }
//   -> { error } (HTTP 200) on any failure -- the composer shows it inline and
//      the user can still write the post by hand. Never a hard failure.
//
// Model: Claude Haiku by default; Sonnet when premium:true (deeper, costlier).
// Reuses ANTHROPIC_API_KEY (already set for generate-recommendations/assistant).
// ============================================================================
const { requireAuth } = require('./_auth');
const { PLATFORMS } = require('./_publishing');
const { ensureSocialProfile } = require('./_social');

const HAIKU = 'claude-haiku-4-5-20251001';
const SONNET = 'claude-sonnet-5';
const TIMEOUT_MS = 20000;

// Per-network constraints the copy must respect. Character limits mirror the
// composer's counters in src/pages/Social.tsx -- keep the two in sync.
const RULES = {
  instagram: { limit: 2200,  guide: 'Visual-first and warm. Lead with a hook line, then 2 to 4 short lines. End with 5 to 10 relevant hashtags on their own line. Assumes an image or video is attached.' },
  facebook:  { limit: 2000,  guide: 'Conversational and plain-spoken, like talking to a peer. 2 to 5 short paragraphs. At most 2 hashtags. A question at the end is fine.' },
  linkedin:  { limit: 3000,  guide: 'Professional but not stiff. Open with a concrete claim or number, then 3 to 5 short paragraphs of substance, then 3 to 5 hashtags. No "excited to announce".' },
  gbp:       { limit: 1500,  guide: 'Google Business Profile post. Local and factual, 1 to 3 short paragraphs, no hashtags, and a clear call to action at the end.' },
  x:         { limit: 280,   guide: 'One tight post under 280 characters. One idea, no thread, at most 1 hashtag.' },
};

function buildPrompt({ brand, website, brief, voice, platforms }) {
  const voiceLines = [];
  if (voice?.tone)     voiceLines.push(`Tone: ${voice.tone}`);
  if (voice?.audience) voiceLines.push(`Audience: ${voice.audience}`);
  if (voice?.cta)      voiceLines.push(`Preferred call to action: ${voice.cta}`);
  if (Array.isArray(voice?.hashtags) && voice.hashtags.length) {
    voiceLines.push(`Brand hashtags to prefer: ${voice.hashtags.join(' ')}`);
  }

  const perPlatform = platforms
    .map((p) => `- "${p}" (max ${RULES[p].limit} characters): ${RULES[p].guide}`)
    .join('\n');

  return (
`You write social posts for ${brand}${website ? ` (${website})` : ''}.

The brief: ${brief}

${voiceLines.length ? `Brand voice:\n${voiceLines.join('\n')}\n` : ''}
Write one version per platform:
${perPlatform}

Every version must also work as a source an AI assistant would quote when someone asks about this topic. That means:
- State the specific, checkable facts (what, who it is for, the number or result) in plain sentences rather than implying them.
- Name ${brand} explicitly at least once instead of saying "we" throughout, so the post is attributable on its own.
- Prefer concrete nouns over adjectives, and avoid claims you were not given in the brief. Never invent statistics, customer names, or results.

Voice rules, strictly:
- Never use em dashes or en dashes. Use commas, periods, or parentheses.
- No "not just X, it's Y", no "in today's landscape", no "let's dive in", no three-item rhetorical lists.
- Write like a person who knows the subject, not like marketing copy.

Reply with ONLY a JSON object, no markdown fences and no commentary:
{"base_text": "a platform-neutral version, 2 to 4 sentences", ${platforms.map((p) => `"${p}": "..."`).join(', ')}}`
  );
}

function extractJson(raw) {
  const s = String(raw || '').trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
  const start = s.indexOf('{');
  if (start === -1) return null;
  // Brace-balanced scan so trailing prose after the object cannot break parsing.
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
      body: JSON.stringify({ model, max_tokens: 2000, messages: [{ role: 'user', content: prompt }] }),
      signal: controller.signal,
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      console.error(`[SocialGenerate] ${model} non-200: ${res.status} ${body.slice(0, 300)}`);
      return null;
    }
    const data = await res.json();
    return data?.content?.[0]?.text || null;
  } catch (e) {
    console.error(`[SocialGenerate] ${model} call failed: ${e.message}`);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

// Strip any dash the model slipped in anyway, so the no-dash rule holds even on
// a sloppy generation (same standing rule the site copy follows).
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

  const { client_id, brief, premium } = body;
  if (!client_id) return { statusCode: 400, headers, body: JSON.stringify({ error: 'client_id required' }) };
  if (!brief || !String(brief).trim()) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'brief required' }) };
  }
  if (profile.role !== 'admin' && String(profile.client_id) !== String(client_id)) {
    return { statusCode: 403, headers, body: JSON.stringify({ error: 'Forbidden: client mismatch' }) };
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return { statusCode: 200, headers, body: JSON.stringify({ error: 'AI generation is not configured (ANTHROPIC_API_KEY missing).' }) };
  }

  // Only ever generate for known platforms, and cap the request size.
  const requested = Array.isArray(body.platforms) && body.platforms.length ? body.platforms : PLATFORMS;
  const platforms = requested.filter((p) => PLATFORMS.includes(p) && RULES[p]).slice(0, PLATFORMS.length);
  if (!platforms.length) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'no valid platforms' }) };
  }

  try {
    const { data: client } = await supabase
      .from('clients').select('name, brand_name, brand_website').eq('id', client_id).single();
    const sp = await ensureSocialProfile(supabase, client_id);

    const prompt = buildPrompt({
      brand: client?.brand_name || client?.name || 'this brand',
      website: client?.brand_website || '',
      brief: String(brief).trim().slice(0, 1000),
      voice: sp?.brand_voice || {},
      platforms,
    });

    // Premium asks for Sonnet, but a Sonnet outage must not dead-end the user:
    // fall back to Haiku, same pattern as assistant.js's hot-lead routing.
    let raw = null;
    if (premium) raw = await callClaude(SONNET, prompt);
    if (!raw) raw = await callClaude(HAIKU, prompt);
    if (!raw) {
      return { statusCode: 200, headers, body: JSON.stringify({ error: 'The writer is unavailable right now. Please try again, or write the post yourself.' }) };
    }

    const parsed = extractJson(raw);
    if (!parsed) {
      console.error('[SocialGenerate] unparseable model output:', String(raw).slice(0, 300));
      return { statusCode: 200, headers, body: JSON.stringify({ error: 'Could not read the generated copy. Please try again.' }) };
    }

    const out = {};
    for (const p of platforms) {
      if (typeof parsed[p] === 'string' && parsed[p].trim()) {
        out[p] = deDash(parsed[p]).slice(0, RULES[p].limit);
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        base_text: typeof parsed.base_text === 'string' ? deDash(parsed.base_text) : '',
        platforms: out,
      }),
    };
  } catch (e) {
    console.error('[SocialGenerate] error:', e.message);
    return { statusCode: 200, headers, body: JSON.stringify({ error: String(e.message || e) }) };
  }
};
