/**
 * competitor_filter.test.js — dependency-free fixtures for _competitor_filter.js.
 * Run: `node tests/competitor_filter.test.js` (exits non-zero on failure).
 *
 * The LLM call is injected via ctx.fetchImpl, so this makes NO network request.
 * It guards the two things that matter: (1) the model can only REMOVE candidates
 * (hallucinations are intersected out), and (2) every failure mode FAILS OPEN to the
 * structural list — the gate is never worse than the pre-LLM behaviour.
 */
const assert = require('assert')
const { classifyCompetitors, parseKept, firstBrandName } = require('../netlify/functions/_competitor_filter')

let passed = 0
const ok = (n) => { passed++; console.log('  ok -', n) }
const mkFetch = (opts) => async () => {
  if (opts.throw) throw new Error('aborted')
  return { ok: opts.ok !== false, json: async () => opts.body }
}
const anthropicText = (t) => ({ content: [{ type: 'text', text: t }] })
const cfg = { brand_aliases: ['Bucate pe Roate', 'BpR'], brand_website: 'bucateperoate.ro' }

// Verbatim leak from live Claude row 2168 — BpR's own credentials extracted as rivals.
const row2168 = [
  { pos: 2, name: 'Elegant Catering' }, { pos: 3, name: 'Royal Catering' },
  { pos: 4, name: 'Horeca Awards' }, { pos: 5, name: 'LuxLife Magazine' },
  { pos: 6, name: 'Summit-ul UE de la Sibiu' }, { pos: 7, name: 'Conferința ITU Plenipotentiary 2022' },
  { pos: 8, name: 'Papei Francisc' }, { pos: 9, name: 'Premiile Gopo' }, { pos: 10, name: 'Ambasadei Portugaliei' },
]
// Live Gemini row 2167 — real firms plus RO section nouns "Prezentare"/"Logistica".
const row2167 = [
  { pos: 1, name: 'Flavours Food Design' }, { pos: 2, name: 'Casa Doina Catering' },
  { pos: 3, name: 'Premier Catering' }, { pos: 4, name: 'Prezentare' }, { pos: 5, name: 'Logistica' },
  { pos: 99, name: 'Elegant Catering' },
]

async function main() {
  console.log('competitor filter — semantic gate (live rows 2167/2168, 2026-07-13):')

  {
    let called = false
    const r = await classifyCompetitors([], { cfg, apiKey: 'k', fetchImpl: async () => { called = true } })
    assert.deepStrictEqual(r, []); assert.strictEqual(called, false)
    ok('zero candidates → no LLM call')
  }
  {
    const r = await classifyCompetitors(row2167, { cfg, apiKey: '' })
    assert.deepStrictEqual(r, row2167); ok('no api key → fail-open')
  }
  {
    const r = await classifyCompetitors(row2168, { cfg, apiKey: 'k', fetchImpl: mkFetch({ body: anthropicText('["Elegant Catering","Royal Catering"]') }) })
    assert.deepStrictEqual(r.map(x => x.name), ['Elegant Catering', 'Royal Catering'])
    for (const junk of ['Papei Francisc', 'Summit-ul UE de la Sibiu', 'Horeca Awards', 'LuxLife Magazine', 'Premiile Gopo', 'Ambasadei Portugaliei'])
      assert.ok(!r.some(x => x.name === junk), 'dropped: ' + junk)
    assert.strictEqual(r[0].pos, 2)
    ok('row 2168: credentials/awards/Pope dropped, caterers kept, pos preserved')
  }
  {
    const r = await classifyCompetitors(row2167, { cfg, apiKey: 'k', fetchImpl: mkFetch({ body: anthropicText('["Flavours Food Design","Casa Doina Catering","Premier Catering","Elegant Catering"]') }) })
    const names = r.map(x => x.name)
    assert.ok(!names.includes('Prezentare') && !names.includes('Logistica'), 'section nouns dropped')
    assert.strictEqual(r.find(x => x.name === 'Elegant Catering').pos, 99, 'pos:99 preserved')
    ok('row 2167: Prezentare/Logistica dropped, pos:99 preserved')
  }
  {
    const r = await classifyCompetitors(row2168, { cfg, apiKey: 'k', fetchImpl: mkFetch({ body: anthropicText('```json\n["Royal Catering"]\n```') }) })
    assert.deepStrictEqual(r.map(x => x.name), ['Royal Catering']); ok('fenced JSON tolerated')
  }
  {
    const r = await classifyCompetitors(row2168, { cfg, apiKey: 'k', fetchImpl: mkFetch({ body: anthropicText('["Royal Catering","Totally Made Up Ltd","royal catering group"]') }) })
    assert.deepStrictEqual(r.map(x => x.name), ['Royal Catering']); ok('hallucinated names cannot leak')
  }
  {
    const r = await classifyCompetitors(row2167, { cfg, apiKey: 'k', fetchImpl: mkFetch({ body: anthropicText('[]') }) })
    assert.deepStrictEqual(r, []); ok('model returns [] → all dropped')
  }
  for (const [label, opts] of [
    ['non-200', { ok: false, body: {} }],
    ['anthropic error body', { body: { error: { message: 'overloaded' } } }],
    ['fetch throws (timeout)', { throw: true }],
    ['unparseable output', { body: anthropicText('I am not sure.') }],
  ]) {
    const r = await classifyCompetitors(row2167, { cfg, apiKey: 'k', fetchImpl: mkFetch(opts) })
    assert.deepStrictEqual(r, row2167); ok(`${label} → fail-open, unchanged`)
  }

  assert.deepStrictEqual(parseKept('["A","B"]', ['A', 'B', 'C']), ['A', 'B']); ok('parseKept intersects to input')
  assert.strictEqual(parseKept('nope', ['A']), null); ok('parseKept null on garbage')
  assert.strictEqual(firstBrandName(cfg), 'Bucate pe Roate'); ok('firstBrandName from aliases')

  // --- category-aware gate, added 2026-07-29 --------------------------------
  // The gate used to receive a bare brand NAME, so it could not tell a catering
  // supplier from a venue and BpR's board filled with hotels and event halls.
  // The prompt is the category signal; these guard that it reaches the model.

  // Verbatim prompt 239 and the venues that leaked onto BpR's real board.
  const q239 = 'Care sunt cele mai bune firme de catering corporate din București?'
  const venueRow = [
    { pos: 1, name: 'JW Marriott Bucharest Grand Hotel' },
    { pos: 2, name: 'Sheraton Bucharest Hotel' },
    { pos: 3, name: 'Crowne Plaza Bucharest' },
    { pos: 4, name: 'Elegant Catering' },
    { pos: 5, name: 'Royal Catering' },
  ]

  {
    let sent = ''
    const spy = async (_u, init) => {
      sent = JSON.parse(init.body).messages[0].content
      return { ok: true, json: async () => anthropicText('<keep>["Elegant Catering","Royal Catering"]</keep>') }
    }
    const r = await classifyCompetitors(venueRow, {
      cfg, apiKey: 'k', fetchImpl: spy, promptText: q239, snippet: '…',
    })
    assert.ok(sent.includes(q239), 'the question must be in the prompt sent to the model')
    assert.ok(/STEP 1/.test(sent), 'the category-derivation step must be present')
    assert.ok(/in-house kitchen does NOT qualify/.test(sent), 'the adjacent-business rule must be present')
    assert.deepStrictEqual(r.map(c => c.name), ['Elegant Catering', 'Royal Catering'])
    ok('question reaches the model; venues drop, caterers keep their pos')
  }

  {
    // The client's own seeded rivals calibrate what a valid competitor looks like.
    let sent = ''
    const spy = async (_u, init) => {
      sent = JSON.parse(init.body).messages[0].content
      return { ok: true, json: async () => anthropicText('<keep>[]</keep>') }
    }
    await classifyCompetitors(venueRow, {
      cfg: { ...cfg, known_competitors: ['Premier Catering & Events', 'Maia Catering'] },
      apiKey: 'k', fetchImpl: spy, promptText: q239,
    })
    assert.ok(sent.includes('Premier Catering & Events'), 'seeded competitors are passed as calibration')
    ok('known_competitors from client config reach the prompt')
  }

  {
    // Tag parsing must survive the category line, including a bracket in it.
    const reply = 'Category: catering company [corporate] in Bucharest\n<keep>["Elegant Catering"]</keep>'
    const r = await classifyCompetitors(venueRow, {
      cfg, apiKey: 'k', fetchImpl: mkFetch({ body: anthropicText(reply) }), promptText: q239,
    })
    assert.deepStrictEqual(r.map(c => c.name), ['Elegant Catering'])
    ok('a bracket in the category line does not corrupt the parse')
  }

  {
    // A bare array with no tags is still accepted, so an older-style reply works.
    assert.deepStrictEqual(parseKept('["A"]', ['A', 'B']), ['A'])
    // ...and a truncated reply still fails open rather than dropping everyone.
    const r = await classifyCompetitors(venueRow, {
      cfg, apiKey: 'k', promptText: q239,
      fetchImpl: mkFetch({ body: anthropicText('Category: catering company') }),
    })
    assert.deepStrictEqual(r, venueRow)
    ok('untagged replies still parse; a truncated reply fails open')
  }

  {
    // No promptText (any caller that has not been wired) must still work.
    const r = await classifyCompetitors(venueRow, {
      cfg, apiKey: 'k', fetchImpl: mkFetch({ body: anthropicText('["Royal Catering"]') }),
    })
    assert.deepStrictEqual(r.map(c => c.name), ['Royal Catering'])
    ok('omitting the question degrades gracefully instead of throwing')
  }

  console.log(`\nAll ${passed} assertions passed.`)
}
main().catch(e => { console.error('FAILED:', e.message); process.exit(1) })
