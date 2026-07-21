// ============================================================================
// social-image.js  --  AI Social: generate an on-brand cover IMAGE for a post,
// composed programmatically (no AI image generation, per the project's brand-
// imagery rule). A designed card carrying the CLIENT's identity and the post's
// key line, so networks that require media (Instagram, TikTok, Pinterest, ...)
// have something on brand to attach.
//
// Branding comes from the client's BRAND KIT (social_profiles.brand_voice, the
// same store social-brandkit.js writes): brand colours, logo, and CTA. Falls
// back to the client's Clearbit logo and a violet palette when the kit is empty,
// and to a domain-derived name when clients.brand_name/name are blank.
//
// Rendered with @napi-rs/canvas (prebuilt native, bundled by Netlify) + a
// base64-embedded font (_card_font.js). The PNG is uploaded to the public
// Supabase Storage bucket `social-media`; the composer drops the returned URL
// into the media field (Ayrshare fetches media by URL).
//
// POST { client_id, headline, platform? }
//   -> { url } | { error } (HTTP 200 on failure -- never a hard failure).
// ============================================================================
const { requireAuth } = require('./_auth');
const { ensureSocialProfile } = require('./_social');
const { createCanvas, loadImage, GlobalFonts } = require('@napi-rs/canvas');
const { robotoRegular } = require('./_card_font');

try { GlobalFonts.register(robotoRegular, 'CardSans'); } catch { /* already registered */ }

const BUCKET = 'social-media';
const SIZE = 1080;                // square: accepted by every network
const PAD = 84;
const IMG_TIMEOUT_MS = 4500;

// Default palette (violet/blue) when the brand kit has no usable colours.
const DEFAULT_PRIMARY = { h: 258, s: 70, l: 66 };
const DEFAULT_SECONDARY = { h: 217, s: 76, l: 62 };

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
    // Brand Kit (colours / logo / CTA the user configured for AI Social).
    const sp = await ensureSocialProfile(supabase, client_id);
    const kit = (sp && typeof sp.brand_voice === 'object' && sp.brand_voice) || {};

    const website = domainOf(client?.brand_website);
    // Never show the generic "Your brand": fall back to the domain label.
    const brand = client?.brand_name || client?.name || titleFromDomain(website) || 'Your brand';

    // Palette from the kit's colours, else the default violet/blue.
    const kitColors = (Array.isArray(kit.colors) ? kit.colors : [])
      .map(toReadableHsl).filter(Boolean);
    const primary = kitColors[0] || DEFAULT_PRIMARY;
    const secondary = kitColors[1] || (kitColors[0]
      ? { h: (primary.h + 24) % 360, s: primary.s, l: Math.min(primary.l + 6, 74) }
      : DEFAULT_SECONDARY);

    const cta = typeof kit.cta === 'string' ? kit.cta.trim() : '';

    // Logo: the kit's explicit logo_url first, then the client's Clearbit logo.
    let logo = null;
    if (typeof kit.logo_url === 'string' && /^https?:\/\//i.test(kit.logo_url)) {
      logo = await fetchImage(kit.logo_url);
    }
    if (!logo && website) logo = await fetchImage(`https://logo.clearbit.com/${website}?size=256`);

    const png = await renderCard({ brand, website, headline, logo, primary, secondary, cta });

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
// primary/secondary: {h,s,l} objects · logo: loaded Image or null · cta: string.
async function renderCard({ brand, website, headline, logo, primary, secondary, cta }) {
  const name = String(brand || 'Your brand');
  const P = primary || DEFAULT_PRIMARY;
  const S = secondary || DEFAULT_SECONDARY;

  const canvas = createCanvas(SIZE, SIZE);
  const ctx = canvas.getContext('2d');

  // ── Background: dark base + a diagonal brand wash + two corner blooms ──
  ctx.fillStyle = '#0a0a11';
  ctx.fillRect(0, 0, SIZE, SIZE);

  const wash = ctx.createLinearGradient(0, 0, SIZE, SIZE);
  wash.addColorStop(0, hsl(P, 0.16));
  wash.addColorStop(0.5, 'rgba(0,0,0,0)');
  wash.addColorStop(1, hsl(S, 0.13));
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, SIZE, SIZE);

  softGlow(ctx, SIZE * 0.15, SIZE * 0.10, SIZE * 0.85, hsl(P, 0.30));
  softGlow(ctx, SIZE * 0.92, SIZE * 0.95, SIZE * 0.80, hsl(S, 0.24));

  // ── Header: logo chip + brand name (+ website) ──
  const chip = 128;
  roundRect(ctx, PAD, PAD, chip, chip, 30);
  if (logo) {
    ctx.save(); ctx.clip();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(PAD, PAD, chip, chip);
    const inset = 18, box = chip - inset * 2;
    const s = Math.min(box / logo.width, box / logo.height);
    const w = logo.width * s, h = logo.height * s;
    ctx.drawImage(logo, PAD + (chip - w) / 2, PAD + (chip - h) / 2, w, h);
    ctx.restore();
  } else {
    ctx.save(); ctx.clip();
    const cg = ctx.createLinearGradient(PAD, PAD, PAD + chip, PAD + chip);
    cg.addColorStop(0, hsl(P, 0.30)); cg.addColorStop(1, hsl(S, 0.24));
    ctx.fillStyle = '#14141c'; ctx.fillRect(PAD, PAD, chip, chip);
    ctx.fillStyle = cg; ctx.fillRect(PAD, PAD, chip, chip);
    ctx.restore();
    ctx.fillStyle = hsl(P); ctx.font = '700 54px CardSans';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(initials(name), PAD + chip / 2, PAD + chip / 2 + 2);
    ctx.textAlign = 'left';
  }

  const headerX = PAD + chip + 32;
  const headerMaxW = SIZE - headerX - PAD;
  if (website) {
    ctx.fillStyle = '#f4f5f9'; ctx.font = '700 46px CardSans'; ctx.textBaseline = 'alphabetic';
    ctx.fillText(truncateToWidth(ctx, name, headerMaxW), headerX, PAD + chip / 2 - 4);
    ctx.fillStyle = '#9aa0b0'; ctx.font = '400 30px CardSans';
    ctx.fillText(truncateToWidth(ctx, website, headerMaxW), headerX, PAD + chip / 2 + 38);
  } else {
    ctx.fillStyle = '#f4f5f9'; ctx.font = '700 46px CardSans'; ctx.textBaseline = 'middle';
    ctx.fillText(truncateToWidth(ctx, name, headerMaxW), headerX, PAD + chip / 2);
  }

  // ── Headline: auto-fit, wrapped, with an accent bar and a soft shadow ──
  const textX = PAD + 42;
  const maxTextW = SIZE - textX - PAD;
  let fontSize = 96;
  let lines = [];
  for (;;) {
    ctx.font = `700 ${fontSize}px CardSans`;
    lines = wrapText(ctx, headline, maxTextW, 5);
    if (lines.length <= 4 || fontSize <= 54) break;
    fontSize -= 8;
  }
  const lineH = Math.round(fontSize * 1.14);
  const blockH = lineH * lines.length;
  const blockTop = Math.max(PAD + chip + 96, Math.round((SIZE - blockH) / 2) - 24);

  const barGrad = ctx.createLinearGradient(0, blockTop, 0, blockTop + blockH);
  barGrad.addColorStop(0, hsl(P)); barGrad.addColorStop(1, hsl(S));
  roundRect(ctx, PAD, blockTop + 6, 10, Math.max(blockH - 12, 20), 5);
  ctx.fillStyle = barGrad; ctx.fill();

  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.38)'; ctx.shadowBlur = 14; ctx.shadowOffsetY = 3;
  ctx.fillStyle = '#ffffff'; ctx.font = `700 ${fontSize}px CardSans`;
  ctx.textBaseline = 'top'; ctx.textAlign = 'left';
  lines.forEach((ln, i) => ctx.fillText(ln, textX, blockTop + i * lineH));
  ctx.restore();

  // ── Footer: CTA pill (if any) + website, and a bottom accent rule ──
  const footY = SIZE - PAD;
  if (cta) {
    ctx.font = '600 30px CardSans'; ctx.textBaseline = 'middle';
    const label = truncateToWidth(ctx, cta, 360);
    const tw = ctx.measureText(label).width;
    const pw = tw + 56, ph = 64, px = PAD, py = footY - ph;
    const pg = ctx.createLinearGradient(px, 0, px + pw, 0);
    pg.addColorStop(0, hsl(P)); pg.addColorStop(1, hsl(S));
    roundRect(ctx, px, py, pw, ph, ph / 2); ctx.fillStyle = pg; ctx.fill();
    ctx.fillStyle = '#0a0a11'; ctx.textAlign = 'left';
    ctx.fillText(label, px + 28, py + ph / 2 + 1);
    if (website) {
      ctx.fillStyle = hsl(P); ctx.font = '500 30px CardSans';
      ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
      ctx.fillText(website, SIZE - PAD, py + ph / 2 + 1);
      ctx.textAlign = 'left';
    }
  } else if (website) {
    ctx.fillStyle = hsl(P); ctx.font = '500 34px CardSans';
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    ctx.fillText(website, PAD, footY + 4);
  }

  const rule = ctx.createLinearGradient(0, 0, SIZE, 0);
  rule.addColorStop(0, hsl(P)); rule.addColorStop(1, hsl(S));
  ctx.fillStyle = rule; ctx.fillRect(0, SIZE - 10, SIZE, 10);

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

// "acme-legal.com" -> "Acme Legal" (a readable brand label from the domain).
function titleFromDomain(domain) {
  if (!domain) return '';
  const base = domain.split('.')[0] || '';
  return base.split(/[-_]+/).filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function initials(name) {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// Parse a hex string ("#abc", "#aabbcc", "aabbcc") into a READABLE {h,s,l}:
// saturation/lightness clamped so a brand colour always reads on the dark card
// (a navy or near-black brand colour still shows as a visible accent). Returns
// null for anything unparseable (named colours, rgb(), etc.).
function toReadableHsl(str) {
  const m = String(str || '').trim().replace(/^#/, '');
  let r, g, b;
  if (/^[0-9a-f]{3}$/i.test(m)) {
    r = parseInt(m[0] + m[0], 16); g = parseInt(m[1] + m[1], 16); b = parseInt(m[2] + m[2], 16);
  } else if (/^[0-9a-f]{6}$/i.test(m)) {
    r = parseInt(m.slice(0, 2), 16); g = parseInt(m.slice(2, 4), 16); b = parseInt(m.slice(4, 6), 16);
  } else { return null; }
  const rn = r / 255, gn = g / 255, bn = b / 255;
  const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn), d = max - min;
  let h = 0;
  if (d) {
    if (max === rn) h = ((gn - bn) / d) % 6;
    else if (max === gn) h = (bn - rn) / d + 2;
    else h = (rn - gn) / d + 4;
    h *= 60; if (h < 0) h += 360;
  }
  const l = (max + min) / 2;
  const s = d ? d / (1 - Math.abs(2 * l - 1)) : 0;
  return {
    h: Math.round(h),
    s: Math.round(Math.max(0.45, Math.min(0.9, s)) * 100),
    l: Math.round(Math.max(0.56, Math.min(0.72, l)) * 100),
  };
}

function hsl({ h, s, l }, a) {
  return a == null ? `hsl(${h}, ${s}%, ${l}%)` : `hsla(${h}, ${s}%, ${l}%, ${a})`;
}

async function fetchImage(url) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), IMG_TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal });
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

// Greedy word-wrap to a pixel width. Overflow past maxLines is collapsed into
// the last kept line and ellipsized.
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

// Exported for the local visual test.
exports.renderCard = renderCard;
