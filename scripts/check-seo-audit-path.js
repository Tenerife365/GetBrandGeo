#!/usr/bin/env node
/**
 * check-seo-audit-path.js
 *
 * Acceptance harness for the two 2026-08-02 AI SEO defects, found on client 52
 * (Doctor Mihail, radar, cap 1) after a crawl stored TWO pages and the audit
 * then failed with "Could not read the audit result".
 *
 *   A. pickCrawlUrls (_seo_crawl.js) checked the page cap AFTER pushing, so the
 *      unconditionally-pushed homepage meant EVERY plan overran by exactly one
 *      page and a one-page plan crawled two.
 *   B. extractJson (seo-audit-page.js) returns null for a TRUNCATED reply and
 *      for a malformed one identically, and the caller logged neither. A real
 *      customer-facing failure left no trace at all.
 *
 * Neither defect is visible to `node --check` or to reading the diff: A is an
 * off-by-one that only shows up by counting, and B only shows up on input the
 * happy path never produces. This harness runs both for real. It makes NO
 * network call and NO LLM call, so it costs nothing to run.
 *
 * Run:  node scripts/check-seo-audit-path.js
 * Exits 0 on PASS, 1 on FAIL.
 */
const path = require('path');

const FN_DIR = path.join(__dirname, '..', 'brandgeo-dashboard', 'netlify', 'functions');
const { pickCrawlUrls } = require(path.join(FN_DIR, '_seo_crawl.js'));

let pass = 0, fail = 0;
function check(name, actual, expected) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) { pass++; console.log(`  PASS  ${name}`); }
  else { fail++; console.log(`  FAIL  ${name}\n          expected ${JSON.stringify(expected)}\n          actual   ${JSON.stringify(actual)}`); }
}

console.log('AI SEO audit path harness\n');

// ── A. the page cap ─────────────────────────────────────────────────────────
const ALLOW_ALL = { allowed: () => true };
const HOST = 'doctormihail.ro';
const BASE = `https://${HOST}`;
// The real sitemap shape that produced the bug: root plus dated posts.
const URLS = [
  `${BASE}/2018/08/08/20-de-alimente-proteice/`,
  `${BASE}/despre/`,
  `${BASE}/contact/`,
  `${BASE}/blog/`,
  `${BASE}/servicii/`,
];

function pick(maxPages, opts = {}) {
  return pickCrawlUrls({
    base: BASE, urls: opts.urls || URLS, host: HOST,
    robots: opts.robots || ALLOW_ALL, maxPages,
  });
}

// THE defect. radar/essentials are sold ONE page and it must be the landing page.
check('radar cap 1 picks exactly 1 page', pick(1).length, 1);
check('radar cap 1 picks the HOMEPAGE, not a blog post', pick(1), [BASE]);
// The same off-by-one hit every other tier, one page each.
check('growth cap 10 picks at most 10', pick(10, { urls: manyUrls(40) }).length, 10);
check('growth_pro cap 30 picks at most 30', pick(30, { urls: manyUrls(80) }).length, 30);
// Fewer candidates than the cap must NOT invent pages.
check('cap 10 with 5 candidates picks 6 (homepage + 5)', pick(10).length, 6);
check('homepage is always first', pick(10)[0], BASE);

// Dedup: a sitemap listing the root in either spelling must not eat the budget.
check(
  'root listed as https://host/ does not double-count',
  pick(1, { urls: [`${BASE}/`, `${BASE}/despre/`] }),
  [BASE],
);

// robots.txt still wins over the homepage-first rule.
const DENY_ROOT = { allowed: (p) => p !== '/' };
check(
  'robots disallowing / drops the homepage and fills from the sitemap',
  pick(1, { robots: DENY_ROOT }),
  [`${BASE}/2018/08/08/20-de-alimente-proteice/`],
);

// Off-host URLs are never picked, even to fill a cap.
check(
  'off-host urls are rejected',
  pick(5, { urls: ['https://evil.example/x', `${BASE}/despre/`] }),
  [BASE, `${BASE}/despre/`],
);

function manyUrls(n) {
  return Array.from({ length: n }, (_, i) => `${BASE}/p${i}/`);
}

// ── B. the audit reply parser ───────────────────────────────────────────────
// extractJson is not exported (it is a private helper on a handler module), so
// it is re-derived here from the module source rather than re-implemented by
// hand. Re-implementing would test this file instead of the shipped one.
const fs = require('fs');
const auditSrc = fs.readFileSync(path.join(FN_DIR, 'seo-audit-page.js'), 'utf8');
const m = auditSrc.match(/function extractJson\(raw\) \{[\s\S]*?\n\}/);
if (!m) { console.log('  FAIL  could not locate extractJson in seo-audit-page.js'); process.exit(1); }
// eslint-disable-next-line no-eval
const extractJson = eval(`(${m[0]})`);

const GOOD = '{"geo_score": 62, "summary": "Fara FAQ.", "issues": [{"severity":"high","text":"x"}], "suggestions": ["y"]}';
check('valid JSON parses', extractJson(GOOD).geo_score, 62);
check('fenced JSON parses', extractJson('```json\n' + GOOD + '\n```').geo_score, 62);
check('prose before the object is tolerated', extractJson('Sure, here:\n' + GOOD).geo_score, 62);

// The failure that took the customer down: a reply cut off at max_tokens. The
// brace scanner never returns to depth 0, so this MUST be null, and the caller
// must be able to tell it apart via stop_reason (asserted by inspection below).
const TRUNCATED = '{"geo_score": 62, "summary": "Pagina nu are FAQ", "issues": [{"severity":"high","text":"Continutul nu raspunde direct la intre';
check('truncated reply yields null (does not throw)', extractJson(TRUNCATED), null);
check('empty reply yields null', extractJson(''), null);
check('non-JSON prose yields null', extractJson('I cannot audit this page.'), null);

// A brace inside a string must not close the object early.
check(
  'brace inside a string value does not end the object',
  extractJson('{"summary":"use {curly} braces","geo_score":5}').geo_score,
  5,
);
// An escaped quote must not end the string early.
check(
  'escaped quote inside a string is handled',
  extractJson('{"summary":"he said \\"hi\\"","geo_score":7}').geo_score,
  7,
);

// ── C. the caller now distinguishes truncation, and logs ────────────────────
// Source-level assertions: these guard the observability fix, which is the part
// that makes the NEXT failure diagnosable instead of silent.
check('caller reads stop_reason', /stopReason/.test(auditSrc), true);
check('caller logs on unparseable', /unparseable reply/.test(auditSrc), true);
check('caller logs the tail', /tail=/.test(auditSrc), true);
check('caller returns a reason discriminator', /reason: truncated \? 'truncated' : 'unparseable'/.test(auditSrc), true);
check('output is bounded in the prompt', /AT MOST 6/.test(auditSrc), true);
check('max_tokens raised off 1500', /max_tokens: 3000/.test(auditSrc), true);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
