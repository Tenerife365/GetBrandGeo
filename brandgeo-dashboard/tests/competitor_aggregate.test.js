/**
 * competitor_aggregate.test.js — fixtures for src/lib/competitorFilter.ts.
 * Run: `node tests/competitor_aggregate.test.js` (exits non-zero on failure).
 *
 * Every fixture name below is a VERBATIM string from `ai_results` in production
 * (queried 2026-07-29), not an invented example. That is the point: the merge
 * bugs this guards were invisible precisely because nobody looked at the raw
 * stored spellings, only at the rendered board.
 *
 * No test runner exists in this repo, so the module is transpiled in-process
 * with the `typescript` devDependency, same spirit as the dependency-free
 * fixtures in competitor_filter.test.js.
 */
const assert = require('assert')
const fs = require('fs')
const path = require('path')
const ts = require('typescript')
const Module = require('module')

const SRC = path.join(__dirname, '..', 'src', 'lib', 'competitorFilter.ts')
const js = ts.transpileModule(fs.readFileSync(SRC, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText
const mod = new Module(SRC)
mod._compile(js, SRC)
const {
  aggregateCompetitors, cleanCompetitorName, competitorKey,
  isNonCompetitorEntity, isLikelyCompanyName,
} = mod.exports

let passed = 0
const ok = (n) => { passed++; console.log('  ok -', n) }

/** Build an ai_results-shaped row. */
const row = (llm, names, promptId) => ({
  llm,
  prompt_id: promptId ?? 1,
  competitors_mentioned: JSON.stringify(
    names.map(n => (Array.isArray(n) ? { pos: n[1], name: n[0] } : { pos: 99, name: n }))),
})

// --- 1. decoration stripping -------------------------------------------------

assert.strictEqual(cleanCompetitorName('🏨 Crowne Plaza Bucharest'), 'Crowne Plaza Bucharest')
assert.strictEqual(cleanCompetitorName('Crowne Plaza Bucharest ⭐⭐⭐⭐⭐'), 'Crowne Plaza Bucharest')
assert.strictEqual(cleanCompetitorName('🥇 Le Chateau'), 'Le Chateau')
assert.strictEqual(cleanCompetitorName('🟢 ClickUp'), 'ClickUp')
assert.strictEqual(cleanCompetitorName('Denver Personal Injury Lawyers®'), 'Denver Personal Injury Lawyers')
assert.strictEqual(cleanCompetitorName('Royal Catering – backup / ofertă comparativă'), 'Royal Catering')
ok('leading pictographs, trailing star ratings, (R) marks and annotations are stripped')

// Real casing survives; it is not title-cased away.
assert.strictEqual(cleanCompetitorName('🌿 ZOOMA Paradisul Verde'), 'ZOOMA Paradisul Verde')
ok('brand capitalisation is preserved')

// Hyphenated brands must NOT be truncated by the annotation rule.
assert.strictEqual(cleanCompetitorName('Coca-Cola'), 'Coca-Cola')
assert.strictEqual(cleanCompetitorName('Mercedes-Benz'), 'Mercedes-Benz')
ok('hyphenated brands are left intact')

// Curly and straight apostrophes reach the same key.
assert.strictEqual(competitorKey('Sotheby’s International Realty'),
                   competitorKey("Sotheby's International Realty"))
ok('curly and straight apostrophes merge')

// Romanian s-comma (U+0219, correct) vs s-cedilla (U+015F, legacy) render
// identically and are emitted interchangeably. They must reach the same key.
assert.strictEqual(competitorKey('Domeniile Săftica'), competitorKey('Domeniile Saftica'))
assert.strictEqual(competitorKey('București Catering'), competitorKey('Bucureşti Catering'))
ok('Romanian diacritic variants and the two s-comma codepoints merge')

const saftica = aggregateCompetitors([
  row('chatgpt', [['Domeniile Săftica', 2]]),
  row('gemini', [['🌊 Domeniile Saftica', 3]]),
])
assert.strictEqual(saftica.length, 1)
assert.strictEqual(saftica[0].name, 'Domeniile Săftica',
  'the correctly accented spelling should be displayed')
ok('accented and unaccented spellings aggregate, showing the accented form')

// A leading DIGIT is part of the name, not decoration.
assert.strictEqual(cleanCompetitorName('1st Choice Catering'), '1st Choice Catering')
ok('names starting with a digit are not eaten')

// --- 2. the three-way split this fix exists for ------------------------------

const crowne = aggregateCompetitors([
  row('chatgpt', [['Crowne Plaza Bucharest', 3]]),
  row('claude', [['🏨 Crowne Plaza Bucharest', 4]]),
  row('gemini', [['Crowne Plaza Bucharest ⭐⭐⭐⭐⭐', 2]]),
])
assert.strictEqual(crowne.length, 1, 'three spellings must collapse to one competitor')
assert.strictEqual(crowne[0].name, 'Crowne Plaza Bucharest')
assert.strictEqual(crowne[0].totalMentions, 3)
assert.strictEqual(crowne[0].rankedMentions, 3)
assert.strictEqual(crowne[0].avgPos, 3)
ok('one hotel under three spellings aggregates to one row with the correct count')

// Case folding was already correct and must stay correct.
const premier = aggregateCompetitors([
  row('chatgpt', [['Premier Catering & Events', 1]]),
  row('claude', [['PREMIER CATERING & EVENTS', 2]]),
])
assert.strictEqual(premier.length, 1)
assert.strictEqual(premier[0].name, 'Premier Catering & Events',
  'the ordinary spelling should win over the shouted one')
ok('case variants merge and the non-shouted spelling is displayed')

// --- 3. certification bodies are not competitors -----------------------------

// All six are verbatim from BpR's stored rows on prompt 243.
for (const n of ['TÜV Austria România', 'TÜV România', 'SGS România',
                 'Bureau Veritas România', 'NOR Certification',
                 "Lloyd's Register Romania", 'ISO 22000', 'HACCP']) {
  assert.strictEqual(isNonCompetitorEntity(n), true, `${n} should be filtered`)
}
ok('certification bodies and standards are recognised')

// ...and real caterers with adjacent-looking names are NOT filtered.
for (const n of ['Elegant Catering', 'Gala Catering', 'Salt & Pepper Catering',
                 'Carte Blanche', 'Toya Concept Events', 'Flavours']) {
  assert.strictEqual(isNonCompetitorEntity(n), false, `${n} must survive`)
}
ok('real companies are not caught by the certification filter')

const withAuditor = aggregateCompetitors([
  row('chatgpt', [['Elegant Catering', 1], ['TÜV Austria România', 2]]),
])
assert.deepStrictEqual(withAuditor.map(c => c.name), ['Elegant Catering'])
ok('an auditor is dropped from the board')

// A certification business must still see its own rivals.
const certClient = aggregateCompetitors(
  [row('chatgpt', [['SGS România', 1], ['Bureau Veritas România', 2]])],
  { knownCompetitors: ['SGS Romania', 'Bureau Veritas România'] })
assert.strictEqual(certClient.length, 2,
  'seeded names must be exempt from the certification filter')
ok('a certification-industry client keeps its seeded competitors')

// --- 4. money ranges are not companies ---------------------------------------

assert.strictEqual(isLikelyCompanyName('100k–£5m'), false)
assert.strictEqual(isLikelyCompanyName('3M'), true)
assert.strictEqual(isLikelyCompanyName('7-Eleven'), true)
ok('a money range is rejected without rejecting digit-bearing brands')

// --- 5. the pos:99 contract is unchanged -------------------------------------

const prose = aggregateCompetitors([
  row('chatgpt', ['Elegant Catering']),            // prose only, pos 99
  row('claude', [['Royal Catering', 2]]),          // genuinely ranked
])
assert.strictEqual(prose[0].name, 'Royal Catering', 'ranked must outrank prose-only')
assert.strictEqual(prose[0].avgPos, 2)
const eleg = prose.find(c => c.name === 'Elegant Catering')
assert.strictEqual(eleg.proseOnly, true)
assert.strictEqual(eleg.avgPos, null, 'the 99 sentinel must never reach avgPos')
ok('prose-only names stay flagged, unranked and below ranked names')

// --- 6. the numeric-limit call signature still works -------------------------

const limited = aggregateCompetitors(
  [row('chatgpt', [['A Catering', 1], ['B Catering', 2], ['C Catering', 3]])], 2)
assert.strictEqual(limited.length, 2)
ok('the legacy numeric limit argument is still honoured')

console.log(`\n${passed} checks passed`)
