// ============================================================================
// social-image.js  --  AI Social: generate an on-brand cover IMAGE for a post,
// composed programmatically (no AI image generation, per the project's brand-
// imagery rule). A clean, designed card carrying the CLIENT's identity (their
// logo/name) and the post's key line, so networks that require media
// (Instagram, TikTok, Pinterest, ...) have something on brand to attach.
//
// Rendered server-side with @napi-rs/canvas (prebuilt native, bundled by
// Netlify) and a base64-embedded font (_card_font.js) so there is no runtime
// font-file to go missing. The PNG is uploaded to the public Supabase Storage
// bucket `social-media`; the composer drops the returned URL into the media
// field (Ayrshare fetches media by URL).
//
// POST { client_id, headline, platform? }
//   -> { url }                       // public image URL
//   -> { error } (HTTP 200) on any failure -- the composer shows it inline and
//      the user can still attach their own media. Never a hard failure.
// ============================================================================
const { requireAuth } = require('./_auth');
const { createCanvas, loadImage, GlobalFonts } = require('@napi-rs/canvas');
const { robotoRegular } = require('./_card_font');

// Register the embedded font once per warm container.
try { GlobalFonts.register(robotoRegular, 'CardSans'); } catch { /* already registered */ }

const BUCKET = 'social-media';
const SIZE = 1080;                // square: accepted by every network
const PAD = 84;
const LOGO_TIMEOUT_MS = 4000;

exports.handler = async (event) => {
  const auth = await requireAuth(event);
  if (auth.response) return auth.response;
  const { headers, supabase, profile } = auth;

  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: 'Method Not Allowed' };

  let body;
  try { body = JSON.parse(event.body); } catch { return { statusCode: 400, headers, body: 'Invalid JSON' }; }

  const { client_id } = body;
  const headline = String(body.headline || '').trim();
  if (!client_id) return { statusCode: 400, headers, body: JSON.stringify({ error: 'client_id required' }) };
  if (!headline)  return { statusCode: 400, headers, body: JSON.stringify({ error: 'headline required' }) };
  if (profile.role !== 'admin' && String(profile.client_id) !== String(client_id)) {
    return { statusCode: 403, headers, body: JSON.stringify({ error: 'Forbidden: client mismatch' }) };
  }

  try {
    const { data: client } = await supabase
      .from('clients').select('name, brand_name, brand_website').eq('id', client_id).single();
    const brand = client?.brand_name || client?.name || 'Your brand';
    const website = domainOf(client?.brand_website);
    const logo = website ? await fetchLogo(website) : null;

    const png = await renderCard({ brand, website, headline, logo });

    // ── Upload to the public bucket and return the URL ──
    const path = `${client_id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.png`;
    const { error: upErr } = await supabase.storage
      .from(BUCKET)
      .upload(path, png, { contentType: 'image/png', upsert: false });
    if (upErr) {
      console.error('[SocialImage] upload error:', upErr.message);
      return { statusCode: 200, headers, body: JSON.stringify({ error: `Could not save the image (${upErr.message}). The "${BUCKET}" storage bucket may be missing.` }) };
    }
    const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);

    return { statusCode: 200, headers, body: JSON.stringify({ url: pub?.publicUrl || null }) };
  } catch (e) {
    console.error('[SocialImage] error:', e.message);
    return { statusCode: 200, headers, body: JSON.stringify({ error: String(e.message || e) }) };
  }
};

// ── card renderer (pure: no network/DB, so it is unit-testable) ──────────────
// brand: display name · website: bare domain or '' · headline: the key line ·
// logo: an already-loaded @napi-rs/canvas Image, or null for the initials chip.
async function renderCard({ brand, website, headline, logo }) {
  const name = String(brand || 'Your brand');
  const hue = hashHue(name);                        // consistent, distinct per brand
  const accent = `hsl(${hue}, 62%, 62%)`;

  const canvas = createCanvas(SIZE, SIZE);
  const ctx = canvas.getContext('2d');

  // Background: dark neutral base + two soft accent glows.
  ctx.fillStyle = '#0b0b12';
  ctx.fillRect(0, 0, SIZE, SIZE);
  softGlow(ctx, SIZE * 0.12, SIZE * 0.14, SIZE * 0.75, `hsla(${hue}, 70%, 55%, 0.20)`);
  softGlow(ctx, SIZE * 0.92, SIZE * 0.9, SIZE * 0.7, `hsla(${(hue + 40) % 360}, 70%, 50%, 0.16)`);

  // Client logo chip (top-left), or initials fallback.
  const chip = 116;
  roundRect(ctx, PAD, PAD, chip, chip, 24);
  if (logo) {
    ctx.save(); ctx.clip();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(PAD, PAD, chip, chip);
    const inset = 16, box = chip - inset * 2;
    const s = Math.min(box / logo.width, box / logo.height);
    const w = logo.width * s, h = logo.height * s;
    ctx.drawImage(logo, PAD + (chip - w) / 2, PAD + (chip - h) / 2, w, h);
    ctx.restore();
  } else {
    ctx.save(); ctx.clip();
    ctx.fillStyle = `hsla(${hue}, 55%, 22%, 1)`;
    ctx.fillRect(PAD, PAD, chip, chip);
    ctx.restore();
    ctx.fillStyle = accent;
    ctx.font = '700 48px CardSans';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(initials(name), PAD + chip / 2, PAD + chip / 2 + 2);
    ctx.textAlign = 'left';
  }

  // Brand name beside the chip.
  ctx.fillStyle = '#eef0f6';
  ctx.font = '600 44px CardSans';
  ctx.textBaseline = 'middle';
  ctx.fillText(truncateToWidth(ctx, name, SIZE - (PAD + chip + 28) - PAD), PAD + chip + 28, PAD + chip / 2);

  // Headline (auto-fit, wrapped), with a rounded accent bar to its left.
  const textX = PAD + 34;
  const maxTextW = SIZE - textX - PAD;
  let fontSize = 92;
  let lines = [];
  for (;;) {
    ctx.font = `700 ${fontSize}px CardSans`;
    lines = wrapText(ctx, headline, maxTextW, 6);
    if (lines.length <= 5 || fontSize <= 52) break;
    fontSize -= 8;
  }
  const lineH = Math.round(fontSize * 1.16);
  const blockH = lineH * lines.length;
  const blockTop = Math.max(PAD + chip + 90, Math.round((SIZE - blockH) / 2) - 30);

  roundRect(ctx, PAD, blockTop + 6, 8, blockH - 12, 4);
  ctx.fillStyle = accent; ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = `700 ${fontSize}px CardSans`;
  ctx.textBaseline = 'top'; ctx.textAlign = 'left';
  lines.forEach((ln, i) => ctx.fillText(ln, textX, blockTop + i * lineH));

  // Footer: website.
  if (website) {
    ctx.fillStyle = accent;
    ctx.font = '500 34px CardSans';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(website, PAD, SIZE - PAD + 6);
  }

  return canvas.encode('png');
}

// ── helpers ─────────────────────────────────────────────────────────────────

function domainOf(url) {
  if (!url) return '';
  try {
    const u = String(url).includes('://') ? url : `https://${url}`;
    return new URL(u).hostname.replace(/^www\./, '');
  } catch { return ''; }
}

function initials(name) {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// Deterministic hue (0-359) from a string, so a brand's cards are consistent.
function hashHue(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 360;
  return h;
}

async function fetchLogo(domain) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), LOGO_TIMEOUT_MS);
  try {
    const res = await fetch(`https://logo.clearbit.com/${domain}?size=256`, { signal: controller.signal });
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (!buf.length) return null;
    return await loadImage(buf);
  } catch { return null; }
  finally { clearTimeout(t); }
}

function softGlow(ctx, cx, cy, r, color) {
  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
  g.addColorStop(0, color);
  g.addColorStop(1, 'hsla(0, 0%, 0%, 0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function truncateToWidth(ctx, text, maxW) {
  if (ctx.measureText(text).width <= maxW) return text;
  let t = text;
  while (t.length > 1 && ctx.measureText(t + '…').width > maxW) t = t.slice(0, -1);
  return t + '…';
}

// Greedy word-wrap to a pixel width. If it exceeds maxLines, the overflow is
// collapsed into the last kept line and ellipsized.
function wrapText(ctx, text, maxW, maxLines) {
  const words = String(text).replace(/\s+/g, ' ').trim().split(' ');
  const all = [];
  let line = '';
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxW && line) { all.push(line); line = w; }
    else line = test;
  }
  if (line) all.push(line);
  if (all.length <= maxLines) return all;
  const kept = all.slice(0, maxLines - 1);
  kept.push(truncateToWidth(ctx, all.slice(maxLines - 1).join(' '), maxW));
  return kept;
}

// Exported for the local visual test (tests/social_image.render.js).
exports.renderCard = renderCard;
