/**
 * build_system_context.test.js
 *
 * Run from brandgeo-dashboard/:  node tests/build_system_context.test.js
 *
 * docs/arch/multi-location-collection.md sections 6.1 and 6.6 (2026-11-13).
 *
 *   1. buildSystemContext: a country, a city, a WW continent region
 *      ("Europe, Worldwide"), the neutral text for Worldwide with no specific
 *      region (WORLDWIDE_NEUTRAL true, the shipped default), and the website
 *      TLD fallback when no market label is given.
 *   2. With WORLDWIDE_NEUTRAL false (a copy of _collect.js compiled in memory
 *      with the one constant flipped), a Worldwide location with no region
 *      takes the website TLD fallback, as scheduled runs did before.
 *   3. buildResultRow writes location_id, asked_market_id and asked_region_id
 *      on ok and error rows only when asked is given; without it the row has
 *      none of the three keys, exactly as before.
 *   4. collectEngines passes asked through to every row it builds (an unknown
 *      engine name is used, so no provider is ever called and nothing is
 *      spent).
 *
 * Pure: no network, no database. Fixtures use example.com addresses.
 */
const assert = require('assert')
const fs = require('fs')
const path = require('path')
const Module = require('module')

const FN = path.join(__dirname, '..', 'netlify', 'functions')
const collect = require(path.join(FN, '_collect.js'))
const { buildSystemContext, buildResultRow, collectEngines } = collect

let passes = 0
let failures = 0
async function check(name, fn) {
  try {
    await fn()
    passes++
    console.log(`  ok   ${name}`)
  } catch (e) {
    failures++
    console.log(`  FAIL ${name}`)
    console.log(`       ${e && e.message ? e.message : e}`)
  }
}

function compileVariant(replacements, tag) {
  let src = fs.readFileSync(path.join(FN, '_collect.js'), 'utf8')
  for (const [from, to] of replacements) {
    if (!src.includes(from)) throw new Error(`variant ${tag}: pattern not found: ${from}`)
    src = src.split(from).join(to)
  }
  const filename = path.join(FN, `_collect.variant-${tag}.js`)
  const m = new Module(filename, null)
  m.filename = filename
  m.paths = Module._nodeModulePaths(FN)
  m._compile(src, filename)
  return m.exports
}

const LANG = 'Respond in the same language as the question.'
const CFG_RO = { brand_website: 'https://www.acme-example.ro/about', brand_aliases: ['Acme Example'] }
const CFG_NONE = { brand_website: 'https://acme.example.com' }

;(async () => {
  console.log('buildSystemContext')

  await check('WORLDWIDE_NEUTRAL ships true (owner question 2 default)', () => {
    assert.strictEqual(collect.WORLDWIDE_NEUTRAL, true)
  })

  await check('country: "You are a user based in Romania"', () => {
    const t = buildSystemContext(CFG_NONE, 'Romania', null)
    assert.ok(t.startsWith('You are a user based in Romania. '), t)
    assert.ok(t.includes('relevant to Romania.'), t)
    assert.ok(t.endsWith(LANG), t)
  })

  await check('country with an "All ..." region label stays at country level', () => {
    for (const all of ['All regions', 'All states', 'All provinces', 'All emirates']) {
      const t = buildSystemContext(CFG_NONE, 'Germany', all)
      assert.ok(t.startsWith('You are a user based in Germany. '), `${all}: ${t}`)
    }
  })

  await check('city: "You are a user based in Bucharest, Romania"', () => {
    const t = buildSystemContext(CFG_NONE, 'Romania', 'Bucharest')
    assert.ok(t.startsWith('You are a user based in Bucharest, Romania. '), t)
    assert.ok(t.endsWith(LANG), t)
  })

  await check('Worldwide with no region: the language instruction only, no place named', () => {
    for (const region of [null, undefined, '', 'All regions']) {
      const t = buildSystemContext(CFG_RO, 'Worldwide', region)
      assert.strictEqual(t, LANG, `region ${JSON.stringify(region)}`)
      assert.ok(!/based in|Worldwide|Romania/.test(t), t)
    }
  })

  await check('WW continent region keeps today\'s wording: "Europe, Worldwide"', () => {
    for (const [region, want] of [['Europe', 'Europe, Worldwide'], ['Oceania', 'Oceania, Worldwide'], ['Asia Pacific', 'Asia Pacific, Worldwide']]) {
      const t = buildSystemContext(CFG_RO, 'Worldwide', region)
      assert.ok(t.startsWith(`You are a user based in ${want}. `), t)
      assert.ok(t.endsWith(LANG), t)
    }
  })

  await check('no market label: the website TLD fallback (".ro" reads Romania)', () => {
    const t = buildSystemContext(CFG_RO, null, null)
    assert.ok(t.startsWith('You are a user based in Romania. '), t)
  })

  await check('no market label and an unknown TLD: "the relevant local market"', () => {
    const t = buildSystemContext(CFG_NONE, null, null)
    assert.ok(t.startsWith('You are a user based in the relevant local market. '), t)
    const u = buildSystemContext({}, undefined, undefined)
    assert.ok(u.startsWith('You are a user based in the relevant local market. '), u)
  })

  console.log('buildSystemContext with WORLDWIDE_NEUTRAL false')
  const off = compileVariant([['const WORLDWIDE_NEUTRAL = true', 'const WORLDWIDE_NEUTRAL = false']], 'neutral-off')

  await check('WW / ALL takes the website TLD fallback, never "based in Worldwide"', () => {
    assert.strictEqual(off.WORLDWIDE_NEUTRAL, false)
    const t = off.buildSystemContext(CFG_RO, 'Worldwide', null)
    assert.ok(t.startsWith('You are a user based in Romania. '), t)
    assert.ok(!t.includes('based in Worldwide'), t)
    const u = off.buildSystemContext(CFG_NONE, 'Worldwide', 'All regions')
    assert.ok(u.startsWith('You are a user based in the relevant local market. '), u)
  })

  await check('a WW continent and a country read the same with the flag off', () => {
    assert.strictEqual(off.buildSystemContext(CFG_RO, 'Worldwide', 'Europe'), buildSystemContext(CFG_RO, 'Worldwide', 'Europe'))
    assert.strictEqual(off.buildSystemContext(CFG_RO, 'Romania', 'Bucharest'), buildSystemContext(CFG_RO, 'Romania', 'Bucharest'))
  })

  console.log('buildResultRow: the asked stamp')
  const ASKED = { location_id: 501, market_id: 'RO', region_id: 'B' }
  const STAMP_KEYS = ['location_id', 'asked_market_id', 'asked_region_id']

  await check('error row carries the stamp when asked is given', () => {
    const r = buildResultRow({ engine: 'claude', prompt_id: 7, client_id: 42, errorCode: 'api_error', detail: 'x', client_config: CFG_NONE, asked: ASKED })
    assert.strictEqual(r.status, 'error')
    assert.strictEqual(r.location_id, 501)
    assert.strictEqual(r.asked_market_id, 'RO')
    assert.strictEqual(r.asked_region_id, 'B')
  })

  await check('no-text row carries the stamp when asked is given', () => {
    const r = buildResultRow({ engine: 'claude', prompt_id: 7, client_id: 42, text: null, client_config: CFG_NONE, asked: ASKED })
    assert.strictEqual(r.error_code, 'no_response')
    assert.strictEqual(r.location_id, 501)
  })

  await check('ok row carries the stamp when asked is given', () => {
    const r = buildResultRow({ engine: 'claude', prompt_id: 7, client_id: 42, text: 'Acme Example is a good choice.', client_config: CFG_RO, asked: ASKED })
    assert.strictEqual(r.status, 'ok')
    assert.strictEqual(r.location_id, 501)
    assert.strictEqual(r.asked_market_id, 'RO')
    assert.strictEqual(r.asked_region_id, 'B')
  })

  await check('fallback stamp: null location, the default country, null region', () => {
    const r = buildResultRow({ engine: 'gemini', prompt_id: 7, client_id: 42, errorCode: 'timeout', client_config: CFG_NONE, asked: { location_id: null, market_id: 'DE', region_id: null } })
    assert.strictEqual(r.location_id, null)
    assert.strictEqual(r.asked_market_id, 'DE')
    assert.strictEqual(r.asked_region_id, null)
  })

  await check('without asked the row has none of the three keys (every other caller unchanged)', () => {
    for (const extra of [{ errorCode: 'api_error' }, { text: 'Acme Example is a good choice.' }, { text: null }]) {
      const r = buildResultRow({ engine: 'claude', prompt_id: 7, client_id: 42, client_config: CFG_RO, ...extra })
      for (const k of STAMP_KEYS) assert.ok(!(k in r), `${k} present for ${JSON.stringify(extra)}`)
    }
  })

  console.log('collectEngines passes asked through (unknown engine, no provider call)')
  await check('every row is stamped when asked is given, none when it is not', async () => {
    const base = { prompt_id: 7, prompt_text: 'best family dentist in Testville', client_id: 42, client_config: CFG_NONE, market_label: 'Romania', region_label: 'Bucharest', market_id: 'RO' }
    const stamped = await collectEngines(['no_such_engine_a', 'no_such_engine_b'], { ...base, asked: ASKED })
    assert.strictEqual(stamped.rows.length, 2)
    for (const r of stamped.rows) {
      assert.strictEqual(r.status, 'error')
      assert.strictEqual(r.location_id, 501)
      assert.strictEqual(r.asked_market_id, 'RO')
      assert.strictEqual(r.asked_region_id, 'B')
    }
    assert.ok(stamped.ctx.startsWith('You are a user based in Bucharest, Romania. '), stamped.ctx)
    const plain = await collectEngines(['no_such_engine_a'], base)
    for (const k of STAMP_KEYS) assert.ok(!(k in plain.rows[0]), k)
  })

  console.log(`\n${passes} passed, ${failures} failed`)
  process.exit(failures ? 1 : 0)
})().catch((e) => {
  console.log('suite crashed:', e)
  process.exit(1)
})
