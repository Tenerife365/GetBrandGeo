// ============================================================================
// social-brandkit.js  --  the client's Brand Kit for AI Social: the real facts
// and voice the generator writes from. Stored in social_profiles.brand_voice
// (JSONB), which social-generate.js already reads. This turns generation from
// "brand name + topic" into "brand name + what the brand actually does + voice",
// which is the main quality lever (see the placeholder bug that motivated it).
//
// POST { client_id, action: 'load' | 'save' | 'suggest', brand_kit? }
//   load    -> { brand_kit }              current saved kit
//   save    -> { ok:true, brand_kit }     sanitised + persisted
//   suggest -> { brand_kit }              a DRAFT (NOT saved) for the user to
//                                         review and edit. Facts are suggestions
//                                         to verify, never auto-published.
//
// suggest uses Claude Haiku (ANTHROPIC_API_KEY, already set). It is told not to
// invent statistics/awards/clients; the UI asks the user to verify facts before
// saving (content-integrity rule).
// ============================================================================
const { requireAuth } = require('./_auth');
const { ensureSocialProfile } = require('./_social');

const HAIKU = 'claude-haiku-4-5-20251001';
const TIMEOUT_MS = 20000;

// The Brand Kit shape. Extra keys are dropped on save.
const STR_FIELDS = ['about', 'tone', 'audience', 'cta', 'logo_url'];
const ARR_FIELDS = ['key_facts', 'hashtags', 'banned_words', 'colors'];

function sanitizeKit(input) {
  const k = input && typeof input === 'object' ? input : {};
  const out = {};
  for (const f of STR_FIELDS) {
    out[f] = typeof k[f] === 'string' ? k[f].trim().slice(0, f === 'about' ? 600 : 200) : '';
  }
  for (const f of ARR_FIELDS) {
    const arr = Array.isArray(k[f]) ? k[f] : [];
    out[f] = arr
      .map((v) => (typeof v === 'string' ? v.trim() : ''))
      .filter(Boolean)
      .slice(0, f === 'key_facts' ? 12 : 20)
      .map((v) => v.slice(0, f === 'key_facts' ? 240 : 60));
  }
  return out;
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

async function suggestKit({ brand, website, category, competitors, recentPosts }) {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  const posts = (recentPosts || []).filter(Boolean).slice(0, 5).map((t) => `- ${String(t).slice(0, 300)}`).join('\n');
  const prompt =
`You are setting up a social-media brand kit for ${brand}${website ? ` (${website})` : ''}.
${category ? `Category: ${category}.` : ''}
${competitors && competitors.length ? `Known competitors: ${competitors.slice(0, 8).join(', ')}.` : ''}
${posts ? `Recent posts from this brand, for VOICE reference only:\n${posts}\n` : ''}
Draft a brand kit. Base it on what you can reasonably infer from the name, website, and category. Do NOT invent specific statistics, awards, years, or customer names. Facts should be safe, general, and likely true; the human will verify them.

Reply with ONLY a JSON object, no markdown fences:
{"about":"1 to 2 plain sentences: what ${brand} does and who it is for",
 "key_facts":["3 to 6 concrete, likely-true statements about ${brand} (what it offers, focus, approach). No invented numbers or awards."],
 "tone":"a few words describing the voice",
 "audience":"who the posts speak to",
 "cta":"a natural default call to action",
 "hashtags":["3 to 6 relevant hashtags, each starting with #"],
 "banned_words":[]}

Never use em dashes or en dashes.`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: HAIKU, max_tokens: 1200, messages: [{ role: 'user', content: prompt }] }),
      signal: controller.signal,
    });
    if (!res.ok) { console.error(`[BrandKit] Haiku non-200: ${res.status}`); return null; }
    const data = await res.json();
    return extractJson(data?.content?.[0]?.text || '');
  } catch (e) {
    console.error(`[BrandKit] suggest failed: ${e.message}`);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

exports.handler = async (event) => {
  const auth = await requireAuth(event);
  if (auth.response) return auth.response;
  const { headers, supabase, profile } = auth;

  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: 'Method Not Allowed' };

  let body;
  try { body = JSON.parse(event.body); } catch { return { statusCode: 400, headers, body: 'Invalid JSON' }; }

  const { client_id, action } = body;
  if (!client_id) return { statusCode: 400, headers, body: JSON.stringify({ error: 'client_id required' }) };
  if (profile.role !== 'admin' && String(profile.client_id) !== String(client_id)) {
    return { statusCode: 403, headers, body: JSON.stringify({ error: 'Forbidden: client mismatch' }) };
  }

  try {
    const sp = await ensureSocialProfile(supabase, client_id);

    if (action === 'load') {
      return { statusCode: 200, headers, body: JSON.stringify({ brand_kit: sanitizeKit(sp?.brand_voice || {}) }) };
    }

    if (action === 'save') {
      const kit = sanitizeKit(body.brand_kit);
      const { error } = await supabase.from('social_profiles').update({ brand_voice: kit }).eq('client_id', client_id);
      if (error) return { statusCode: 200, headers, body: JSON.stringify({ error: `Could not save: ${error.message}` }) };
      return { statusCode: 200, headers, body: JSON.stringify({ ok: true, brand_kit: kit }) };
    }

    if (action === 'suggest') {
      const { data: client } = await supabase
        .from('clients').select('name, brand_name, brand_website, category, known_competitors').eq('id', client_id).single();
      const { data: recent } = await supabase
        .from('social_posts').select('base_text').eq('client_id', client_id).order('created_at', { ascending: false }).limit(5);

      const draft = await suggestKit({
        brand: client?.brand_name || client?.name || 'this brand',
        website: client?.brand_website || '',
        category: client?.category || '',
        competitors: Array.isArray(client?.known_competitors) ? client.known_competitors : [],
        recentPosts: (recent || []).map((r) => r.base_text),
      });
      if (!draft) {
        return { statusCode: 200, headers, body: JSON.stringify({ error: 'Could not draft a brand kit right now. Fill it in yourself, or try again.' }) };
      }
      // Merge the draft over whatever is already saved, so a suggest never wipes
      // fields the user already set; then sanitise. Not persisted here.
      return { statusCode: 200, headers, body: JSON.stringify({ brand_kit: sanitizeKit({ ...(sp?.brand_voice || {}), ...draft }) }) };
    }

    return { statusCode: 400, headers, body: JSON.stringify({ error: 'unknown action' }) };
  } catch (e) {
    console.error('[BrandKit] error:', e.message);
    return { statusCode: 200, headers, body: JSON.stringify({ error: String(e.message || e) }) };
  }
};
