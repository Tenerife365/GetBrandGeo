/**
 * phase2_prompt_ownership.test.js
 *
 * Run from brandgeo-dashboard/:  node tests/phase2_prompt_ownership.test.js
 *
 * F1 of docs/qa/phase2-server-review-2026-11-08.md (2026-11-09). The three
 * HTTP collectors (collect-prompt.js, collect-claude.js, collect-chatgpt.js)
 * took prompt_id and prompt_text from the body unchecked. A prompt_id that
 * does not exist made the insert fail on ai_results_prompt_id_fkey AFTER the
 * engine was billed, and every spend gate counts inserted rows only, so a
 * viewer could buy unlimited engine calls. Another client's prompt_id inserted
 * a row under the caller's client_id. This suite covers, for ALL THREE files:
 *
 *   1. a prompt_id with no prompts row: 404, before the limits check and any
 *      engine call; 20 repeated posts make 0 engine calls (the reproduction).
 *   2. a prompt_id of another client: 403, viewers and admins alike.
 *   3. a forged prompt_text from a viewer: the engine gets the STORED text.
 *      An admin's body text still goes through (today's behaviour).
 *   4. an inactive prompt: refused for a viewer (skipped, prompt_inactive),
 *      collected for an admin.
 *   5. a prompts lookup error: 500, never falls through to collecting.
 *   6. a drift guard: the three loadPromptForCollect functions agree.
 *   7. a mutation check: each file is recompiled in memory with one piece of
 *      the gate removed, and the suite is shown to FAIL against that copy.
 *   8. N1 of docs/qa/phase2-server-rereview-2026-11-09.md: a prompt_id or
 *      client_id that is not a positive safe integer (or the canonical digit
 *      string of one) is 400 { error: 'Invalid id' } before any read. [7]
 *      used to pass the F1 check (postgrest-js stringifies filter values) and
 *      then fail the insert after the engine was billed. The ai_results insert
 *      in this fake rejects a non-integer id the way Postgres does (22P02), so
 *      the pre-fix code shows the spend here. loadPromptForCollect returns the
 *      ids of the row, and those are what the engine and the row get.
 *   9. N4: a collect calls checkCollectionLimits exactly once, with the
 *      canonical client_id, and a blocked answer is 429 with 0 engine calls.
 *  10. I1 of docs/qa/phase2-server-final-2026-11-09.md: an id above
 *      2147483647 (the int4 ceiling of every id column involved) is 400
 *      Invalid id, not a 500 from the 22003 the lookup used to raise.
 *  11. I2: a JSON body that is not an object (null, a number, a string, a
 *      boolean, an array) is 400 { error: 'Invalid body' } before any read.
 *      null used to throw on the destructure.
 *
 * The in-memory DB (tests/helpers/fake_supabase_mem.js) has no foreign keys,
 * so "no row was written" is read from the fake directly, and "no engine was
 * billed" is the stubbed collectEngines call count. Fixtures name no real
 * person.
 */
const assert = require('assert')
const fs = require('fs')
const path = require('path')
const Module = require('module')
const { createFakeSupabase } = require('./helpers/fake_supabase_mem')

const FN = path.join(__dirname, '..', 'netlify', 'functions')

process.env.SUPABASE_URL = 'http://localhost:54321'
process.env.SUPABASE_SERVICE_KEY = 'test-service-key-placeholder'
delete process.env.SENTRY_DSN
delete process.env.INTERNAL_AUDIT_KEY

let failures = 0
let passes = 0
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

function installModule(resolvedPath, exportsObj) {
  const m = new Module(resolvedPath, null)
  m.filename = resolvedPath
  m.loaded = true
  m.exports = exportsObj
  require.cache[resolvedPath] = m
}

// ── Fakes ───────────────────────────────────────────────────────────────────
let db = null
let failPromptsLookup = false
const tableReads = []

function erroringBuilder() {
  const b = {
    select() { return b }, eq() { return b }, maybeSingle() { return b }, single() { return b },
    then(res, rej) { return Promise.resolve({ data: null, error: { message: 'simulated prompts lookup failure' } }).then(res, rej) },
  }
  return b
}
// What Postgres accepts for an integer column from PostgREST JSON: an integer
// number or a digit string. Anything else ([7], {}, 7.5, "7x") is 22P02.
function pgIntLike(v) {
  return (typeof v === 'number' && Number.isInteger(v)) || (typeof v === 'string' && /^\s*[+-]?[0-9]+\s*$/.test(v))
}
const insertRejects = { n: 0 }
function serviceClient() {
  return {
    from(table) {
      tableReads.push(table)
      if (table === 'prompts' && failPromptsLookup) return erroringBuilder()
      const q = db.from(table)
      if (table === 'ai_results') {
        const realInsert = q.insert.bind(q)
        q.insert = (rows) => {
          const list = Array.isArray(rows) ? rows : [rows]
          if (list.some(r => !pgIntLike(r.prompt_id) || !pgIntLike(r.client_id))) {
            insertRejects.n++
            return { then(res, rej) { return Promise.resolve({ data: null, error: { code: '22P02', message: 'invalid input syntax for type integer' } }).then(res, rej) } }
          }
          return realInsert(rows)
        }
      }
      return q
    },
  }
}
installModule(require.resolve('@supabase/supabase-js', { paths: [FN] }), {
  createClient() { return serviceClient() },
})

const collectCalls = []
installModule(require.resolve(path.join(FN, '_collect.js')), {
  async collectEngines(engines, opts) {
    collectCalls.push({ engines: engines.slice(), opts })
    const rows = engines.map(llm => ({
      llm, prompt_id: opts.prompt_id, client_id: opts.client_id, status: 'ok',
      brand_mentioned: true, brand_position: 1, sentiment: 'positive',
      checked_at: new Date().toISOString(),
    }))
    return { rows, summary: Object.fromEntries(engines.map(e => [e, 'mentioned'])), ctx: 'You are a user based in Testland.' }
  },
})

const PROFILES = {
  'tok-admin':  { user: { id: 'user-admin' },  profile: { role: 'admin',  client_id: null } },
  'tok-viewer': { user: { id: 'user-viewer' }, profile: { role: 'viewer', client_id: 42 } },
}
// limitCalls.args: the client_id each call received. limitBlocked: when set,
// the stub answers it (the shape _auth.js checkCollectionLimits returns).
const limitCalls = { n: 0, args: [] }
let limitBlocked = null
installModule(require.resolve(path.join(FN, '_auth.js')), {
  async requireAuth(event) {
    const h = (event.headers && (event.headers.authorization || event.headers.Authorization)) || ''
    const token = h.startsWith('Bearer ') ? h.slice(7) : ''
    const who = PROFILES[token]
    if (!who) return { response: { statusCode: 401, headers: {}, body: JSON.stringify({ error: 'Unauthorized' }) } }
    return { user: who.user, profile: who.profile, supabase: serviceClient(), headers: { 'Content-Type': 'application/json' } }
  },
  async checkCollectionLimits(_sb, clientId) {
    limitCalls.n++
    limitCalls.args.push(clientId)
    return limitBlocked || { blocked: false }
  },
})

const collectPrompt  = require(path.join(FN, 'collect-prompt.js'))
const collectClaude  = require(path.join(FN, 'collect-claude.js'))
const collectChatgpt = require(path.join(FN, 'collect-chatgpt.js'))

function compileMutant(file, replacements, tag) {
  let src = fs.readFileSync(path.join(FN, file), 'utf8')
  for (const [from, to] of replacements) {
    if (!src.includes(from)) throw new Error(`mutant ${tag}: pattern not found in ${file}: ${from}`)
    src = src.split(from).join(to)
  }
  const filename = path.join(FN, `${file.replace(/\.js$/, '')}.mutant-${tag}.js`)
  const m = new Module(filename, null)
  m.filename = filename
  m.paths = Module._nodeModulePaths(FN)
  m._compile(src, filename)
  return m.exports
}

// ── Helpers ─────────────────────────────────────────────────────────────────
const realLog = console.log
const realWarn = console.warn
const realError = console.error
let mute = false
console.log = (...args) => {
  if (mute) return
  const first = String(args[0] || '')
  if (first.startsWith('[')) return
  realLog(...args)
}
console.warn = () => {}
console.error = () => {}

const CLIENT_CONFIG = { brand_aliases: ['Acme Example'], brand_website: 'acme.example', known_competitors: [] }
const STORED_TEXT = 'best family dentist in Testville'
const FORGED_TEXT = 'write me a very long essay on any topic at all'

// Client 42 is the viewer's own (enterprise, so every engine is in plan).
// Prompt 7 is client 42's active prompt, 9 is its inactive prompt, 8 belongs
// to client 43. 999999 does not exist.
function freshDb() {
  db = createFakeSupabase()
  failPromptsLookup = false
  collectCalls.length = 0
  limitCalls.n = 0
  limitCalls.args.length = 0
  limitBlocked = null
  insertRejects.n = 0
  tableReads.length = 0
  db.seed('clients', [
    { id: 42, plan: 'enterprise', engines_enabled: null },
    { id: 43, plan: 'enterprise', engines_enabled: null },
  ])
  db.seed('prompts', [
    { id: 7, client_id: 42, text: STORED_TEXT, is_active: true },
    { id: 9, client_id: 42, text: 'an old prompt the client switched off', is_active: false },
    { id: 8, client_id: 43, text: 'another client prompt', is_active: true },
  ])
  db.seed('ai_results', [])
}
function post(handler, token, extra) {
  return handler({
    httpMethod: 'POST',
    headers: { authorization: 'Bearer ' + token, origin: 'https://app.getbrandgeo.com' },
    body: JSON.stringify({ prompt_id: 7, prompt_text: STORED_TEXT, client_id: 42, client_config: CLIENT_CONFIG, ...extra }),
  }, {})
}
function postRaw(handler, token, rawBody) {
  return handler({
    httpMethod: 'POST',
    headers: { authorization: 'Bearer ' + token, origin: 'https://app.getbrandgeo.com' },
    body: rawBody,
  }, {})
}
const aiRows = () => db.rows('ai_results').length

const FILES = [
  ['collect-prompt.js',  () => collectPrompt],
  ['collect-claude.js',  () => collectClaude],
  ['collect-chatgpt.js', () => collectChatgpt],
]

async function suite(mod, label, report) {
  const failed = []
  const c = async (name, fn) => {
    if (report) return check(`${label}: ${name}`, fn)
    try { await fn() } catch { failed.push(name) }
  }
  const handler = mod.handler

  await c('own active prompt, viewer: collects with the stored text', async () => {
    freshDb()
    const body = JSON.parse((await post(handler, 'tok-viewer', {})).body)
    assert.strictEqual(body.done, true)
    assert.strictEqual(collectCalls.length, 1)
    assert.strictEqual(collectCalls[0].opts.prompt_text, STORED_TEXT)
    assert.ok(aiRows() >= 1)
  })

  await c('fake prompt_id: 404 Prompt not found, no limits check, no engine, no row', async () => {
    freshDb()
    const res = await post(handler, 'tok-viewer', { prompt_id: 999999 })
    assert.strictEqual(res.statusCode, 404)
    assert.deepStrictEqual(JSON.parse(res.body), { error: 'Prompt not found' })
    assert.strictEqual(limitCalls.n, 0)
    assert.strictEqual(collectCalls.length, 0)
    assert.strictEqual(aiRows(), 0)
  })

  await c('fake prompt_id posted 20 times by a viewer: 0 engine calls (the F1 reproduction)', async () => {
    freshDb()
    for (let i = 0; i < 20; i++) {
      const res = await post(handler, 'tok-viewer', { prompt_id: 999999, force: true })
      assert.strictEqual(res.statusCode, 404)
    }
    assert.strictEqual(collectCalls.length, 0)
    assert.strictEqual(aiRows(), 0)
  })

  await c('fake prompt_id from an admin: 404 too', async () => {
    freshDb()
    const res = await post(handler, 'tok-admin', { prompt_id: 999999 })
    assert.strictEqual(res.statusCode, 404)
    assert.strictEqual(collectCalls.length, 0)
  })

  await c('foreign prompt_id (client 43) under the viewer own client_id: 403, no engine, no row', async () => {
    freshDb()
    const res = await post(handler, 'tok-viewer', { prompt_id: 8 })
    assert.strictEqual(res.statusCode, 403)
    assert.strictEqual(limitCalls.n, 0)
    assert.strictEqual(collectCalls.length, 0)
    assert.strictEqual(aiRows(), 0)
  })

  await c('foreign prompt_id from an admin: 403 (a row never pairs a client with a foreign prompt)', async () => {
    freshDb()
    const res = await post(handler, 'tok-admin', { prompt_id: 8, force: true })
    assert.strictEqual(res.statusCode, 403)
    assert.strictEqual(collectCalls.length, 0)
    assert.strictEqual(aiRows(), 0)
  })

  await c('forged prompt_text from a viewer: the engine gets the stored text', async () => {
    freshDb()
    await post(handler, 'tok-viewer', { prompt_text: FORGED_TEXT })
    assert.strictEqual(collectCalls.length, 1)
    assert.strictEqual(collectCalls[0].opts.prompt_text, STORED_TEXT)
  })

  await c('admin body prompt_text still goes through (unchanged admin behaviour)', async () => {
    freshDb()
    await post(handler, 'tok-admin', { prompt_text: 'admin probe text' })
    assert.strictEqual(collectCalls.length, 1)
    assert.strictEqual(collectCalls[0].opts.prompt_text, 'admin probe text')
  })

  await c('inactive prompt, viewer: 200 skipped prompt_inactive, no limits check, no engine', async () => {
    freshDb()
    const res = await post(handler, 'tok-viewer', { prompt_id: 9 })
    assert.strictEqual(res.statusCode, 200)
    const body = JSON.parse(res.body)
    assert.strictEqual(body.skipped, true)
    assert.strictEqual(body.reason, 'prompt_inactive')
    assert.strictEqual(body.prompt_id, 9)
    assert.strictEqual(limitCalls.n, 0)
    assert.strictEqual(collectCalls.length, 0)
  })

  await c('inactive prompt, viewer force: still refused, force_ignored on the body', async () => {
    freshDb()
    const body = JSON.parse((await post(handler, 'tok-viewer', { prompt_id: 9, force: true })).body)
    assert.strictEqual(body.reason, 'prompt_inactive')
    assert.strictEqual(body.force_ignored, true)
    assert.strictEqual(collectCalls.length, 0)
  })

  await c('inactive prompt, admin: collects', async () => {
    freshDb()
    const body = JSON.parse((await post(handler, 'tok-admin', { prompt_id: 9 })).body)
    assert.strictEqual(body.done, true)
    assert.strictEqual(collectCalls.length, 1)
  })

  await c('prompts lookup error: 500, no engine (never falls through to collecting)', async () => {
    freshDb()
    failPromptsLookup = true
    const res = await post(handler, 'tok-admin', {})
    assert.strictEqual(res.statusCode, 500)
    assert.deepStrictEqual(JSON.parse(res.body), { error: 'Prompt lookup failed' })
    assert.strictEqual(collectCalls.length, 0)
  })

  await c('viewer for another client: 403 client mismatch before the prompts read', async () => {
    freshDb()
    const res = await post(handler, 'tok-viewer', { client_id: 43, prompt_id: 8 })
    assert.strictEqual(res.statusCode, 403)
    assert.match(JSON.parse(res.body).error, /client mismatch/)
    assert.strictEqual(tableReads.filter(t => t === 'prompts').length, 0)
  })

  // ── N1: ids are integers or nothing ──────────────────────────────────────
  await c('N1: prompt_id [7] posted 20 times by a viewer: 400 each, 0 engine calls, 0 rows', async () => {
    freshDb()
    for (let i = 0; i < 20; i++) {
      const res = await post(handler, 'tok-viewer', { prompt_id: [7] })
      assert.strictEqual(res.statusCode, 400, `post ${i + 1}: ${res.statusCode} ${res.body}`)
    }
    assert.strictEqual(collectCalls.length, 0, 'engine calls')
    assert.strictEqual(aiRows(), 0)
    assert.strictEqual(insertRejects.n, 0)
  })

  await c('N1: client_id [42] from a viewer: 400, 0 engine calls', async () => {
    freshDb()
    const res = await post(handler, 'tok-viewer', { client_id: [42] })
    assert.strictEqual(res.statusCode, 400, res.body)
    assert.strictEqual(collectCalls.length, 0)
    assert.strictEqual(aiRows(), 0)
  })

  await c('N1: every malformed id is 400 Invalid id before any read (viewer and admin)', async () => {
    const BAD = [
      { prompt_id: [7] }, { client_id: [42] }, { prompt_id: {} }, { client_id: {} },
      { prompt_id: 7.5 }, { prompt_id: '7x' }, { prompt_id: -1 }, { client_id: -42 },
      { prompt_id: '07' }, { prompt_id: 1e21 }, { prompt_id: true }, { prompt_id: ' 7' },
      { prompt_id: '+7' }, { prompt_id: '7.0' }, { prompt_id: '9007199254740993' },
      // I1: one past the int4 ceiling, as a number and as a digit string.
      { prompt_id: 2147483648 }, { prompt_id: '2147483648' },
      { client_id: 2147483648 }, { client_id: '2147483648' },
    ]
    for (const extra of BAD) for (const tok of ['tok-viewer', 'tok-admin']) {
      freshDb()
      const res = await post(handler, tok, extra)
      const tag = `${tok} ${JSON.stringify(extra)}`
      assert.strictEqual(res.statusCode, 400, `${tag}: ${res.statusCode} ${res.body}`)
      assert.deepStrictEqual(JSON.parse(res.body), { error: 'Invalid id' }, tag)
      assert.deepStrictEqual(tableReads, [], `${tag}: read ${tableReads.join(',')}`)
      assert.strictEqual(limitCalls.n, 0, tag)
      assert.strictEqual(collectCalls.length, 0, tag)
      assert.strictEqual(aiRows(), 0, tag)
    }
  })

  await c('N1: digit strings "7" and "42" are accepted; the engine and the row get the numbers', async () => {
    freshDb()
    const res = await post(handler, 'tok-viewer', { prompt_id: '7', client_id: '42' })
    assert.strictEqual(JSON.parse(res.body).done, true, res.body)
    assert.strictEqual(collectCalls.length, 1)
    assert.strictEqual(collectCalls[0].opts.prompt_id, 7)
    assert.strictEqual(collectCalls[0].opts.client_id, 42)
    const written = db.rows('ai_results')
    assert.ok(written.length >= 1)
    for (const r of written) { assert.strictEqual(r.prompt_id, 7); assert.strictEqual(r.client_id, 42) }
  })

  await c('N1: loadPromptForCollect returns the ids of the row, not the ids it was given', async () => {
    freshDb()
    for (const promptId of ['7', [7]]) {
      const r = await mod.loadPromptForCollect(serviceClient(), { promptId, clientId: '42', role: 'viewer', bodyText: FORGED_TEXT })
      assert.deepStrictEqual(r, { ok: true, text: STORED_TEXT, promptId: 7, clientId: 42 }, JSON.stringify(promptId))
    }
    const inactive = await mod.loadPromptForCollect(serviceClient(), { promptId: '9', clientId: '42', role: 'viewer', bodyText: '' })
    assert.deepStrictEqual(inactive, { skip: 'prompt_inactive', promptId: 9, clientId: 42 })
  })

  await c('I1: the int4 ceiling 2147483647 itself is a valid id (404 for a missing prompt, not 400)', async () => {
    for (const promptId of [2147483647, '2147483647']) {
      freshDb()
      const res = await post(handler, 'tok-admin', { prompt_id: promptId })
      assert.strictEqual(res.statusCode, 404, `${JSON.stringify(promptId)}: ${res.statusCode} ${res.body}`)
      assert.strictEqual(collectCalls.length, 0)
    }
  })

  await c('I2: a body that is not a JSON object is 400 Invalid body, no read, no engine (viewer and admin)', async () => {
    const RAW = ['null', '7', '"x"', 'true', 'false', '[]', '[{"prompt_id":7,"client_id":42}]']
    for (const raw of RAW) for (const tok of ['tok-viewer', 'tok-admin']) {
      freshDb()
      const tag = `${tok} ${raw}`
      let res
      try { res = await postRaw(handler, tok, raw) } catch (e) { throw new Error(`${tag}: threw ${e && e.message}`) }
      assert.strictEqual(res.statusCode, 400, `${tag}: ${res.statusCode} ${res.body}`)
      assert.deepStrictEqual(JSON.parse(res.body), { error: 'Invalid body' }, tag)
      assert.deepStrictEqual(tableReads, [], tag)
      assert.strictEqual(limitCalls.n, 0, tag)
      assert.strictEqual(collectCalls.length, 0, tag)
      assert.strictEqual(aiRows(), 0, tag)
    }
  })

  // ── N4: the spend gate is called, once, and a block stops the engines ────
  await c('N4: a collect calls the limits check exactly once, with the canonical client_id', async () => {
    freshDb()
    const body = JSON.parse((await post(handler, 'tok-viewer', { client_id: '42' })).body)
    assert.strictEqual(body.done, true)
    assert.strictEqual(limitCalls.n, 1)
    assert.deepStrictEqual(limitCalls.args, [42])
  })

  await c('N4: limits blocked: 429 with the limits message and reason, 0 engine calls, 0 rows', async () => {
    for (const [tok, extra] of [['tok-viewer', {}], ['tok-admin', { force: true }]]) {
      freshDb()
      limitBlocked = { blocked: true, reason: 'hourly_ceiling', message: 'Rate limit exceeded' }
      const res = await post(handler, tok, extra)
      assert.strictEqual(res.statusCode, 429, `${tok}: ${res.statusCode} ${res.body}`)
      assert.deepStrictEqual(JSON.parse(res.body), { error: 'Rate limit exceeded', reason: 'hourly_ceiling' })
      assert.strictEqual(limitCalls.n, 1)
      assert.strictEqual(collectCalls.length, 0)
      assert.strictEqual(aiRows(), 0)
    }
  })

  return failed
}

;(async () => {
  for (const [file, getMod] of FILES) {
    console.log(`${file} handler, end to end with the in-memory DB`)
    await suite(getMod(), file.replace(/\.js$/, ''), true)
  }

  await check('collect-prompt admin force on a foreign prompt_id deletes nothing', async () => {
    freshDb()
    db.seed('ai_results', [{ prompt_id: 8, client_id: 42, llm: 'gemini', status: 'ok', checked_at: new Date().toISOString() }])
    const res = await post(collectPrompt.handler, 'tok-admin', { prompt_id: 8, force: true })
    assert.strictEqual(res.statusCode, 403)
    assert.strictEqual(aiRows(), 1)
  })

  // ════════════════════════════════════════════════════════════════════════
  console.log('loadPromptForCollect drift guard (the three copies agree)')
  await check('same answer for every (prompt, client, role, text) tried', async () => {
    const cases = []
    for (const promptId of [7, 8, 9, 999999, '7'])
      for (const clientId of [42, 43, '42'])
        for (const role of ['admin', 'viewer', undefined])
          for (const bodyText of [STORED_TEXT, FORGED_TEXT])
            cases.push({ promptId, clientId, role, bodyText })
    for (const cs of cases) {
      freshDb()
      const ref = await collectPrompt.loadPromptForCollect(serviceClient(), cs)
      const a = await collectClaude.loadPromptForCollect(serviceClient(), cs)
      const b = await collectChatgpt.loadPromptForCollect(serviceClient(), cs)
      assert.deepStrictEqual(a, ref, 'claude ' + JSON.stringify(cs))
      assert.deepStrictEqual(b, ref, 'chatgpt ' + JSON.stringify(cs))
    }
    freshDb(); failPromptsLookup = true
    const e = { promptId: 7, clientId: 42, role: 'viewer', bodyText: STORED_TEXT }
    const ref = await collectPrompt.loadPromptForCollect(serviceClient(), e)
    assert.deepStrictEqual(await collectClaude.loadPromptForCollect(serviceClient(), e), ref)
    assert.deepStrictEqual(await collectChatgpt.loadPromptForCollect(serviceClient(), e), ref)
    assert.strictEqual(ref.status, 500)
  })

  console.log('parseId (N1): the three copies agree, and the accepted forms are exactly these')
  await check('parseId: integers and canonical digit strings only, the same in all three files', () => {
    const MAX = Number.MAX_SAFE_INTEGER
    const cases = [
      [7, 7], ['7', 7], [42, 42], ['42', 42], [7.0, 7],
      // I1: int4 ceiling accepted, one past it and the old safe-integer maximum refused.
      [2147483647, 2147483647], ['2147483647', 2147483647],
      [2147483648, null], ['2147483648', null], [MAX, null], [String(MAX), null],
      [[7], null], [['7'], null], [{}, null], [{ id: 7 }, null], [true, null], [false, null],
      [null, null], [undefined, null], [0, null], ['0', null], [-1, null], ['-1', null],
      [7.5, null], ['7.5', null], ['7.0', null], ['7x', null], [' 7', null], ['7 ', null],
      ['+7', null], ['07', null], ['', null], [1e21, null], ['1e21', null], [MAX + 1, null],
      ['9007199254740993', null], [NaN, null], [Infinity, null], ['0x7', null],
    ]
    for (const [input, want] of cases) {
      const tag = typeof input === 'string' ? JSON.stringify(input) : String(Array.isArray(input) ? `[${input}]` : input)
      assert.strictEqual(collectPrompt.parseId(input), want, 'prompt ' + tag)
      assert.strictEqual(collectClaude.parseId(input), want, 'claude ' + tag)
      assert.strictEqual(collectChatgpt.parseId(input), want, 'chatgpt ' + tag)
    }
  })

  // ════════════════════════════════════════════════════════════════════════
  console.log('mutation check: the suite fails when part of the prompt gate is removed')
  // The canonical-id lines, swapped for the body ids, model the code before
  // the N1 round (it used the body values downstream).
  const BODY_IDS_DOWNSTREAM = [
    ['const prompt_id = promptCheck.promptId', 'const prompt_id = bodyPromptId'],
    ['const client_id = promptCheck.clientId', 'const client_id = bodyClientId'],
  ]
  const NO_ID_GUARD = [
    ['const bodyPromptId = parseId(rawPromptId)', 'const bodyPromptId = rawPromptId'],
    ['const bodyClientId = parseId(rawClientId)', 'const bodyClientId = rawClientId'],
    ['if (bodyPromptId === null || bodyClientId === null) {', 'if (false) {'],
  ]
  const N1_MALFORMED = 'N1: every malformed id is 400 Invalid id before any read (viewer and admin)'
  const N1_ARRAY_20 = 'N1: prompt_id [7] posted 20 times by a viewer: 400 each, 0 engine calls, 0 rows'
  const N1_CLIENT_ARRAY = 'N1: client_id [42] from a viewer: 400, 0 engine calls'
  const MUTANTS = [
    // F1 gate removed, ids from the body downstream: the pre-F1 code.
    ['noprompt', [['if (promptCheck.status) {', 'if (false) {'], ...BODY_IDS_DOWNSTREAM],
      ['fake prompt_id: 404 Prompt not found, no limits check, no engine, no row',
       'fake prompt_id posted 20 times by a viewer: 0 engine calls (the F1 reproduction)',
       'foreign prompt_id (client 43) under the viewer own client_id: 403, no engine, no row']],
    ['noowner', [['if (String(data.client_id) !== String(clientId)) return', 'if (false) return']],
      ['foreign prompt_id (client 43) under the viewer own client_id: 403, no engine, no row',
       'foreign prompt_id from an admin: 403 (a row never pairs a client with a foreign prompt)']],
    ['bodytext', [['const promptText = promptCheck.text', 'const promptText = prompt_text']],
      ['forged prompt_text from a viewer: the engine gets the stored text']],
    ['noinactive', [["if (!isAdmin && data.is_active !== true) return { skip: 'prompt_inactive', ...ids }", '']],
      ['inactive prompt, viewer: 200 skipped prompt_inactive, no limits check, no engine']],
    // N1: the exact code the re-review reproduced (no guard, body ids downstream).
    ['prefixn1', [...NO_ID_GUARD, ...BODY_IDS_DOWNSTREAM], [N1_ARRAY_20, N1_CLIENT_ARRAY, N1_MALFORMED]],
    // N1: only the guard removed; the canonical row ids alone do not satisfy the contract.
    ['noidguard', NO_ID_GUARD, [N1_ARRAY_20, N1_CLIENT_ARRAY, N1_MALFORMED]],
    // N1 belt and braces: loadPromptForCollect hands back the ids it was given.
    ['loadbodyids', [['const ids = { promptId: data.id, clientId: data.client_id }', 'const ids = { promptId, clientId }']],
      ['N1: loadPromptForCollect returns the ids of the row, not the ids it was given']],
    // N4: the spend gate call removed (the re-review's K8).
    ['nolimits', [['const limitCheck = await checkCollectionLimits(auth.supabase, client_id)', 'const limitCheck = { blocked: false }']],
      ['N4: a collect calls the limits check exactly once, with the canonical client_id',
       'N4: limits blocked: 429 with the limits message and reason, 0 engine calls, 0 rows']],
    // I1: the int4 ceiling dropped from parseId (the safe-integer check only).
    ['nointmax', [['&& n <= PG_INT_MAX ? n : null', '? n : null']], [N1_MALFORMED]],
    // I2: the body shape guard removed (the HEAD destructure, null throws).
    ['nobodyguard', [["if (!body || typeof body !== 'object' || Array.isArray(body))", 'if (false)']],
      ['I2: a body that is not a JSON object is 400 Invalid body, no read, no engine (viewer and admin)']],
  ]
  for (const [file] of FILES) {
    for (const [tag, repl, mustFail] of MUTANTS) {
      await check(`${file} mutant ${tag}: the matching checks fail, unrelated ones pass`, async () => {
        const mutant = compileMutant(file, repl, tag)
        mute = true
        const failed = await suite(mutant, 'mutant', false)
        mute = false
        for (const name of mustFail) assert.ok(failed.includes(name), `expected "${name}" to fail, failed: ` + JSON.stringify(failed))
        // Control: the mutant still loads and collects, so the failures above
        // are the removed gate, not a broken copy.
        assert.ok(!failed.includes('own active prompt, viewer: collects with the stored text') || tag === 'bodytext',
          'mutant should still collect a normal call, failed: ' + JSON.stringify(failed))
        assert.ok(!failed.includes('prompts lookup error: 500, no engine (never falls through to collecting)') || tag === 'noprompt',
          'unrelated check failed: ' + JSON.stringify(failed))
      })
    }
  }

  console.log = realLog
  console.warn = realWarn
  console.error = realError
  console.log(`\n${passes} passed, ${failures} failed`)
  process.exit(failures ? 1 : 0)
})().catch((e) => {
  console.log = realLog
  realLog('suite crashed:', e)
  process.exit(1)
})
