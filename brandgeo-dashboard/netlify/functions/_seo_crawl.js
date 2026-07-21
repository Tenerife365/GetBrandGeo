// ============================================================================
// _seo_crawl.js  --  AI SEO site crawler (shared helper, not an endpoint).
//
// Fetches a client's existing pages so seo-audit-page.js can score them for GEO
// quality. Free by design: sitemap.xml + server-side fetch, no paid dependency.
// Structured behind crawlSite() as a provider so a Firecrawl provider can drop
// in later (for JS-rendered sites) without touching callers.
//
//   crawlSite(domain, { maxPages }) -> [{ url, title, content_md }]
//
// Respects robots.txt (skips disallowed paths), stays on the client's own host,
// caps pages, and extracts headings/lists + technical signals (JSON-LD, tables,
// FAQ schema) into content_md so the audit LLM can judge structure from text.
// ============================================================================

const FETCH_TIMEOUT_MS = 8000;
const MAX_HTML_BYTES = 1_500_000;   // don't slurp huge pages
const MAX_CONTENT_MD = 14000;       // stored/serialised per page
const UA = 'BrandGEO-SEO-Bot/1.0 (+https://getbrandgeo.com)';

// ── Provider entry point ─────────────────────────────────────────────────────
async function crawlSite(domain, { maxPages = 25 } = {}) {
  const host = normalizeHost(domain);
  if (!host) return [];
  // Provider slot: if a Firecrawl key is configured later, route here.
  // if (process.env.FIRECRAWL_API_KEY) return firecrawlCrawl(host, maxPages);
  return sitemapCrawl(host, maxPages);
}

// ── Free provider: sitemap + fetch ───────────────────────────────────────────
async function sitemapCrawl(host, maxPages) {
  const base = `https://${host}`;
  const robots = await loadRobots(base);

  let urls = await collectSitemapUrls(base, maxPages * 4);
  if (!urls.length) urls = await homepageLinks(base, host, maxPages * 4);

  // Same host, allowed by robots, deduped, capped.
  const seen = new Set();
  const picked = [];
  for (const u of urls) {
    const norm = stripHash(u);
    if (seen.has(norm)) continue;
    seen.add(norm);
    if (!sameHost(norm, host)) continue;
    if (!robots.allowed(pathOf(norm))) continue;
    picked.push(norm);
    if (picked.length >= maxPages) break;
  }
  if (!picked.length && robots.allowed('/')) picked.push(base);

  const pages = [];
  for (const url of picked) {
    const page = await fetchAndExtract(url);
    if (page) pages.push(page);
  }
  return pages;
}

// ── robots.txt (minimal: User-agent * Disallow prefixes) ─────────────────────
async function loadRobots(base) {
  const txt = await safeText(`${base}/robots.txt`);
  const disallow = [];
  if (txt) {
    let applies = false;
    for (const raw of txt.split('\n')) {
      const line = raw.split('#')[0].trim();
      if (!line) continue;
      const [k, ...rest] = line.split(':');
      const key = (k || '').trim().toLowerCase();
      const val = rest.join(':').trim();
      if (key === 'user-agent') applies = (val === '*' || val.toLowerCase().includes('brandgeo'));
      else if (applies && key === 'disallow' && val) disallow.push(val);
    }
  }
  return {
    allowed(path) {
      const p = path || '/';
      for (const d of disallow) {
        if (d === '/') return false;
        if (p.startsWith(d)) return false;
      }
      return true;
    },
  };
}

// ── sitemap discovery (handles sitemap index + gzip-less .xml) ────────────────
async function collectSitemapUrls(base, limit) {
  const roots = [`${base}/sitemap.xml`, `${base}/sitemap_index.xml`, `${base}/sitemap-index.xml`];
  const out = [];
  const visited = new Set();

  async function walk(sitemapUrl, depth) {
    if (depth > 2 || visited.has(sitemapUrl) || out.length >= limit) return;
    visited.add(sitemapUrl);
    const xml = await safeText(sitemapUrl);
    if (!xml) return;
    const locs = [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/gi)].map((m) => decodeEntities(m[1]));
    const isIndex = /<sitemapindex[\s>]/i.test(xml);
    if (isIndex) {
      for (const loc of locs) { if (out.length >= limit) break; await walk(loc, depth + 1); }
    } else {
      for (const loc of locs) { if (out.length >= limit) break; out.push(loc); }
    }
  }

  for (const r of roots) { if (out.length >= limit) break; await walk(r, 0); }
  return out;
}

// ── fallback: same-host links from the homepage ──────────────────────────────
async function homepageLinks(base, host, limit) {
  const html = await safeText(base);
  if (!html) return [];
  const links = [...html.matchAll(/<a\s[^>]*href=["']([^"'#]+)["']/gi)].map((m) => m[1]);
  const abs = [];
  for (const href of links) {
    let u = null;
    try { u = new URL(href, base).toString(); } catch { continue; }
    if (sameHost(u, host)) abs.push(u);
    if (abs.length >= limit) break;
  }
  return [base, ...abs];
}

// ── fetch one page and extract content ───────────────────────────────────────
async function fetchAndExtract(url) {
  const html = await safeText(url);
  if (!html) return null;
  const title = extractTitle(html);
  const desc = extractMetaDesc(html);
  const signals = detectSignals(html);
  const body = htmlToText(html);
  const words = body ? body.split(/\s+/).filter(Boolean).length : 0;

  const md = [
    `# ${title || url}`,
    desc ? `\n${desc}` : '',
    `\n${body}`.slice(0, MAX_CONTENT_MD),
    `\n\n---\nTechnical signals: JSON-LD schema: ${signals.jsonld ? 'yes' : 'no'}; `
      + `FAQ schema: ${signals.faq ? 'yes' : 'no'}; tables: ${signals.table ? 'yes' : 'no'}; `
      + `lists: ${signals.list ? 'yes' : 'no'}; meta description: ${desc ? 'yes' : 'no'}; `
      + `H1 count: ${signals.h1}; word count: ${words}`,
  ].join('');

  return { url, title: title || url, content_md: md };
}

// ── extraction helpers (regex-based; no DOM dependency) ──────────────────────
function extractTitle(html) {
  const og = html.match(/<meta[^>]+property=["']og:title["'][^>]*content=["']([^"']+)["']/i)
    || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]*property=["']og:title["']/i);
  if (og) return clean(og[1]);
  const t = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return t ? clean(t[1]) : '';
}

function extractMetaDesc(html) {
  const m = html.match(/<meta[^>]+name=["']description["'][^>]*content=["']([^"']*)["']/i)
    || html.match(/<meta[^>]+content=["']([^"']*)["'][^>]*name=["']description["']/i);
  return m ? clean(m[1]) : '';
}

function detectSignals(html) {
  const jsonldBlocks = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)]
    .map((m) => m[1]);
  const faq = jsonldBlocks.some((b) => /faqpage/i.test(b));
  return {
    jsonld: jsonldBlocks.length > 0,
    faq,
    table: /<table[\s>]/i.test(html),
    list: /<(ul|ol)[\s>]/i.test(html),
    h1: (html.match(/<h1[\s>]/gi) || []).length,
  };
}

function htmlToText(html) {
  let s = html;
  s = s.replace(/<!--[\s\S]*?-->/g, ' ');
  s = s.replace(/<head[\s\S]*?<\/head>/i, ' ');
  s = s.replace(/<(script|style|noscript|svg|template|iframe)[\s\S]*?<\/\1>/gi, ' ');
  s = s.replace(/<(nav|footer|header|aside|form)[\s\S]*?<\/\1>/gi, ' ');
  s = s.replace(/<h[12][^>]*>([\s\S]*?)<\/h[12]>/gi, (_m, t) => `\n\n## ${clean(t)}\n`);
  s = s.replace(/<h[3-6][^>]*>([\s\S]*?)<\/h[3-6]>/gi, (_m, t) => `\n\n### ${clean(t)}\n`);
  s = s.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (_m, t) => `\n- ${clean(t)}`);
  s = s.replace(/<\/(td|th)>/gi, ' | ');
  s = s.replace(/<\/(p|div|tr|section|article|blockquote)>/gi, '\n');
  s = s.replace(/<br\s*\/?>/gi, '\n');
  s = s.replace(/<[^>]+>/g, ' ');
  s = decodeEntities(s);
  return s.replace(/[ \t]+/g, ' ').replace(/\n[ \t]+/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
}

function clean(t) { return decodeEntities(String(t).replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim(); }

function decodeEntities(s) {
  return String(s)
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_m, n) => { try { return String.fromCodePoint(+n); } catch { return ' '; } })
    .replace(/&#x([0-9a-f]+);/gi, (_m, n) => { try { return String.fromCodePoint(parseInt(n, 16)); } catch { return ' '; } });
}

// ── url + fetch utilities ────────────────────────────────────────────────────
function normalizeHost(domain) {
  if (!domain) return '';
  try {
    const u = String(domain).includes('://') ? domain : `https://${domain}`;
    return new URL(u).hostname.replace(/^www\./, '');
  } catch { return ''; }
}
function sameHost(url, host) { try { return new URL(url).hostname.replace(/^www\./, '') === host; } catch { return false; } }
function pathOf(url) { try { return new URL(url).pathname || '/'; } catch { return '/'; } }
function stripHash(url) { try { const u = new URL(url); u.hash = ''; return u.toString(); } catch { return url; } }

async function safeText(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'text/html,application/xhtml+xml,application/xml' }, signal: controller.signal, redirect: 'follow' });
    if (!res.ok) return null;
    const ct = res.headers.get('content-type') || '';
    if (!/text\/html|xml|text\/plain/i.test(ct) && !url.endsWith('robots.txt')) return null;
    const buf = await res.arrayBuffer();
    if (buf.byteLength > MAX_HTML_BYTES) return Buffer.from(buf.slice(0, MAX_HTML_BYTES)).toString('utf8');
    return Buffer.from(buf).toString('utf8');
  } catch { return null; }
  finally { clearTimeout(timer); }
}

module.exports = { crawlSite, fetchAndExtract, htmlToText, extractTitle, detectSignals };
