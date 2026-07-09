/**
 * analysis.test.js — plain-node regression fixtures for _analysis.js
 * Run: `node tests/analysis.test.js` (exits non-zero on failure).
 *
 * No test framework is configured, so this is a dependency-free assertion
 * script. Its job is to guard the accuracy behaviour of analyseResponse so the
 * Master-Reasoning fixes (and the §2.1 three-copy drift risk) can't silently
 * regress. Add a case here with every future _analysis.js change.
 */

const assert = require('assert')
const {
  analyseResponse,
  extractBrandContext,
  buildBrandMatchers,
  matchesAlias,
} = require('../netlify/functions/_analysis')

const cfg = {
  brand_aliases: ['Bucate pe Roate', 'BpR'],
  brand_website: 'https://bucateperoate.ro',
  known_competitors: ['Fratelli Catering'],
}

let passed = 0
function check(name, actual, expected) {
  assert.deepStrictEqual(actual, expected, `${name}\n  expected: ${JSON.stringify(expected)}\n  actual:   ${JSON.stringify(actual)}`)
  passed++
  console.log('  ok -', name)
}

console.log('sentiment — scoped to the brand clause (finding 1.1):')

// 1. THE core fix: a "best X" listicle contains 'best'/'recommend' but says
//    nothing about THIS brand in its own line → must be neutral, not positive.
{
  const text = 'Best catering companies in Bucharest:\n' +
    '1. Fratelli Catering – highly recommended\n' +
    '2. Bucate pe Roate\n' +
    '3. Elegant Catering'
  const r = analyseResponse(text, cfg)
  check('listicle, brand line neutral → neutral', r.sentiment, 'neutral')
  check('  (brand still detected)', r.brand_mentioned, true)
  check('  (list rank captured)', r.brand_position, 2)
}

// 2. Brand's own clause is clearly positive → positive.
{
  const text = 'Bucate pe Roate is highly recommended and a trusted caterer in Bucharest.'
  check('positive brand clause → positive', analyseResponse(text, cfg).sentiment, 'positive')
}

// 3. Brand's own clause is clearly negative → negative.
{
  const text = 'Avoid Bucate pe Roate — poor service and repeated complaints.'
  check('negative brand clause → negative', analyseResponse(text, cfg).sentiment, 'negative')
}

// 4. Mixed signals in the brand's clause → neutral (don't coin-flip).
{
  const text = 'Bucate pe Roate is recommended but has had some complaints lately.'
  check('mixed brand clause → neutral', analyseResponse(text, cfg).sentiment, 'neutral')
}

// 5. Positive words elsewhere, brand clause has no signal → neutral (regression
//    guard for the exact bug: sentiment must NOT leak from other list items).
{
  const text = 'Top recommended caterers:\n' +
    '1. Fratelli Catering — the best, award-winning and trusted\n' +
    '2. Bucate pe Roate offers events across the city'
  check('signal only in other items → neutral', analyseResponse(text, cfg).sentiment, 'neutral')
}

// 6. Brand not mentioned at all → neutral + not mentioned + null position.
{
  const text = '1. Fratelli Catering\n2. Elegant Catering\n3. Gusto Events'
  const r = analyseResponse(text, cfg)
  check('absent brand → not mentioned', r.brand_mentioned, false)
  check('absent brand → neutral', r.sentiment, 'neutral')
  check('absent brand → null position', r.brand_position, null)
}

console.log('extractBrandContext — isolates only brand segments:')

// 7. Only the brand's own segment is returned, not neighbouring list items.
{
  const text = '1. Fratelli Catering is the best\n2. Bucate pe Roate is reliable\n3. Elegant Catering'
  const ctx = extractBrandContext(text, buildBrandMatchers(cfg))
  assert.ok(ctx.includes('reliable'), 'context should contain the brand line')
  assert.ok(!ctx.includes('best'), 'context must NOT contain a neighbouring items text')
  passed++; console.log('  ok - context excludes neighbouring items')
}

console.log('lexicon — real Romanian praise phrasings (finding 1.1b, 2026-07-09):')

// 8. 🥇 #1 "Recomandarea …/cea mai potrivită alegere" — was scoring neutral
//    (id 1559 in prod). 'recomand' stem + 'potrivit' + '🥇' now catch it.
{
  const text = 'Iată cele mai bune opțiuni:\n\n## 🥇 1. Bucate pe Roate — (Recomandarea #1 pentru evenimente mari)\nAceasta este cea mai potrivită alegere pentru un eveniment de 1.000+ persoane.'
  check('RO gold-medal #1 recommendation → positive', analyseResponse(text, cfg).sentiment, 'positive')
}

// 9. "în primul rând <brand>" first-pick (id 1553 in prod) — was neutral.
{
  const text = 'Pentru evenimente corporate mari, eu aș pune pe shortlist în primul rând Bucate pe Roate.'
  check('RO "primul rand" first pick → positive', analyseResponse(text, cfg).sentiment, 'positive')
}

// 10. "opțiune excelentă" — stayed positive (id 1550 in prod), 'excelen' stem.
{
  const text = 'Bucate pe Roate este o opțiune excelentă, cu experiență considerabilă.'
  check('RO "excelenta" → positive', analyseResponse(text, cfg).sentiment, 'positive')
}

// 11. Explicit RO negation must NOT read as positive. Because the pos stem
//     'recomand' also matches "nu recomand", this resolves to neutral (both
//     signals) — documented keyword limitation; the key property is "not positive".
{
  const text = 'Nu recomand Bucate pe Roate din cauza serviciilor slabe.'
  const s = analyseResponse(text, cfg).sentiment
  assert.notStrictEqual(s, 'positive', `RO negation must not be positive (got ${s})`)
  passed++; console.log('  ok - RO "nu recomand" is not positive (got ' + s + ')')
}

console.log('mention detection — word boundaries (finding 1.3):')

// Uses the real BpR aliases incl. the risky 3-char acronym "bpr".
const bprCfg = { brand_aliases: ['bucate pe roate', 'bucateperoate', 'bpr'], brand_website: 'bucateperoate.ro' }
const bgCfg  = { brand_aliases: ['brandgeo', 'brand geo', 'getbrandgeo'], brand_website: 'getbrandgeo.com' }
function mentioned(text, c) { return analyseResponse(text, c).brand_mentioned }

// Must MATCH — standalone acronym, phrase, smushed, dashed, website, spaced.
check('bpr standalone → mentioned', mentioned('For catering I recommend BPR for large events.', bprCfg), true)
check('phrase → mentioned', mentioned('Contactează Bucate pe Roate pentru nuntă.', bprCfg), true)
check('smushed → mentioned', mentioned('BucatePeRoate rocks', bprCfg), true)
check('dashed → mentioned', mentioned('bucate-pe-roate is great', bprCfg), true)
check('website → mentioned', mentioned('Vezi bucateperoate.ro pentru detalii', bprCfg), true)
check('spaced alias "brand geo" → mentioned', mentioned('the brand geo tool is useful', bgCfg), true)

// Must NOT match — the false positives the old substring/stripped pass produced.
check('"bpr" inside subprocess → NOT mentioned', mentioned('The subprocess handles the workflow.', bprCfg), false)
check('"brandgeo" inside rebrandgeography → NOT mentioned', mentioned('Planning to rebrandgeography next year.', bgCfg), false)
check('absent brand → NOT mentioned', mentioned('Totally unrelated marketing text.', bgCfg), false)

// Direct matcher check for the acronym boundary.
{
  const m = buildBrandMatchers(bprCfg)
  assert.ok(matchesAlias('call BPR today', m), 'standalone bpr should match')
  assert.ok(!matchesAlias('the subprocessor', m), 'bpr inside a word must not match')
  passed += 2; console.log('  ok - matchesAlias acronym boundary (standalone yes, in-word no)')
}

console.log(`\nAll ${passed} assertions passed.`)
