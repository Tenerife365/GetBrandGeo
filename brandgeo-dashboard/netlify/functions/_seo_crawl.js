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

  const picked = pickCrawlUrls({ base, urls, host, robots, maxPages });

  const pages = [];
  for (const url of picked) {
    const page = await fetchAndExtract(url);
    if (page) pages.push(page);
  }
  return pages;
}

/**
 * Choose which URLs to crawl. PURE: no network, no clock, no I/O, so the page
 * cap can be tested without crawling anything. Extracted from sitemapCrawl
 * 2026-08-02 for exactly that reason, after an off-by-one shipped here and was
 * only caught by counting rows in Supabase.
 *
 * `robots` needs only an `allowed(path)` method.
 */
function pickCrawlUrls({ base, urls, host, robots, maxPages }) {
  // Same host, allowed by robots, deduped, capped.
  const seen = new Set();
  const picked = [];

  // THE HOMEPAGE GOES FIRST, ALWAYS. Two reasons, and the second is an
  // entitlement rule rather than a preference.
  //
  //   1. A client sitemap that omits its own root is common with generated
  //      sitemaps, and until now that meant we audited a site without ever
  //      looking at its front door, at ANY page cap.
  //   2. Radar and Essentials are sold a ONE PAGE audit, and what they are sold
  //      is the landing page. maxPages = 1 used to mean "whatever the client's
  //      sitemap happens to list first", which is not what they bought and is
  //      not reproducible between runs either.
  //
  // Both spellings go into `seen` because sitemaps write the root as either
  // https://host or https://host/ and stripHash does not reconcile the two, so
  // without this the homepage could be picked twice and eat a one-page budget.
  if (robots.allowed('/')) {
    picked.push(base);
    seen.add(stripHash(base));
    seen.add(stripHash(`${base}/`));
  }

  for (const u of urls) {
    // THE CAP IS CHECKED BEFORE THE PUSH, NOT AFTER. It used to be the last
    // statement in the body, so the loop always performed one push before its
    // first check. The homepage is pushed unconditionally ABOVE, outside this
    // loop, and never meets a cap check at all.
    //
    // THE BLAST RADIUS IS EXACTLY maxPages === 1, and no other tier. For any
    // cap of 2 or more the post-check still compares the TOTAL (homepage
    // included) and stops on the right number, so Growth (10) and Growth PRO
    // (30) were never over. At cap 1 the homepage already fills the budget, the
    // loop pushes a second page and only then breaks. So the plans that were
    // sold "your landing page, singular", radar and essentials, are precisely
    // the ones that got two. Measured 2026-08-02 on client 52: cap 1,
    // seo_crawls.pages = 2, the extra page a 2018 blog post.
    //
    // An earlier draft of this comment claimed every tier overran by one. The
    // harness disproved it: with the bug reinstated the cap-10 and cap-30
    // assertions still passed and only the cap-1 ones went red.
    if (picked.length >= maxPages) break;
    const norm = stripHash(u);
    if (seen.has(norm)) continue;
    seen.add(norm);
    if (!sameHost(norm, host)) continue;
    if (!robots.allowed(pathOf(norm))) continue;
    picked.push(norm);
  }
  if (!picked.length && robots.allowed('/')) picked.push(base);

  return picked;
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
    // A BROKEN block is reported explicitly rather than collapsing into "no".
    // "JSON-LD schema: no" and "you have 2 blocks and 1 does not parse" call for
    // completely different advice, and the second is the more urgent because the
    // author believes it is working.
    `\n\n---\nTechnical signals: JSON-LD schema: ${signals.jsonld ? 'yes' : 'no'}`
      + (signals.jsonldInvalid > 0
          ? ` (WARNING: ${signals.jsonldInvalid} of ${signals.jsonldBlocks} JSON-LD block(s) fail to parse and are ignored by search and answer engines)`
          : '')
      + `; schema types found: ${signals.schemaTypes && signals.schemaTypes.length ? signals.schemaTypes.join(', ') : 'none'}; `
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

/**
 * Walk a parsed JSON-LD value and collect every @type it declares. Schema.org
 * nests: a WebPage can carry @graph, mainEntity, itemListElement and so on, and
 * the FAQPage that matters is often several levels down rather than at the root.
 */
function collectTypes(node, out = new Set(), depth = 0) {
  if (!node || depth > 8) return out;
  if (Array.isArray(node)) {
    for (const n of node) collectTypes(n, out, depth + 1);
    return out;
  }
  if (typeof node !== 'object') return out;
  const t = node['@type'];
  if (typeof t === 'string') out.add(t.toLowerCase());
  else if (Array.isArray(t)) t.forEach((x) => typeof x === 'string' && out.add(x.toLowerCase()));
  for (const k of Object.keys(node)) {
    if (k === '@type') continue;
    collectTypes(node[k], out, depth + 1);
  }
  return out;
}

/**
 * STRUCTURED DATA IS NOW PARSED, NOT PATTERN-MATCHED.
 *
 * This used to be `jsonldBlocks.some(b => /faqpage/i.test(b))`, a regex over the
 * RAW STRING. Three ways that was wrong, all reproduced against the live
 * function before this change:
 *
 *   1. A syntactically INVALID FAQPage passed. This repo shipped exactly that to
 *      production on three city pages, `"}]` instead of `"}}]`, leaving
 *      acceptedAnswer unclosed. Google drops such a block silently. The audit
 *      called it present.
 *   2. The literal prose {"note":"we plan to add FAQPage later"} passed, because
 *      the string contains the word.
 *   3. seo-audit-page.js then hands that boolean to Haiku and asks it to judge
 *      "valid structured data (JSON-LD)". The model cannot see the page, so it
 *      was certifying validity from a flag that never tested it.
 *
 * On a product whose entire thesis is being parsed correctly by answer engines,
 * a structured-data check that does not parse is the one check that must not be
 * faked. `jsonldValid` and `jsonldInvalid` are now reported separately so a
 * BROKEN block is a finding in its own right rather than being indistinguishable
 * from having none.
 */
function detectSignals(html) {
  const jsonldBlocks = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)]
    .map((m) => m[1]);

  let valid = 0;
  let invalid = 0;
  const types = new Set();
  for (const block of jsonldBlocks) {
    try {
      collectTypes(JSON.parse(block), types);
      valid++;
    } catch {
      invalid++;   // present but unparseable, which is worse than absent
    }
  }

  return {
    jsonld: valid > 0,          // at least one block a machine can actually read
    jsonldBlocks: jsonldBlocks.length,
    jsonldValid: valid,
    jsonldInvalid: invalid,
    faq: types.has('faqpage'),
    schemaTypes: Array.from(types).sort(),
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

module.exports = { crawlSite, fetchAndExtract, htmlToText, extractTitle, detectSignals, pickCrawlUrls };
