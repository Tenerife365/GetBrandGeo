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
  const ctx = extractBrandContext(text,
    cfg.brand_aliases.map(a => a.toLowerCase()),
    cfg.brand_aliases.map(a => a.toLowerCase().replace(/[\s\-_.]/g, '')),
    'bucateperoate.ro')
  assert.ok(ctx.includes('reliable'), 'context should contain the brand line')
  assert.ok(!ctx.includes('best'), 'context must NOT contain a neighbouring items text')
  passed++; console.log('  ok - context excludes neighbouring items')
}

console.log(`\nAll ${passed} assertions passed.`)
