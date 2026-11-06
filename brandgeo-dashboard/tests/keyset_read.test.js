/**
 * readAllById (src/lib/keysetRead.ts): the one reader the AI Visibility page
 * and mcp-server.js share, so both build Fix This from every answer and not
 * from PostgREST's newest 1,000 (docs/qa/mcp-stage2-fixes-review-2026-11-06.md, M1).
 * Run: node tests/keyset_read.test.js
 */
'use strict'
const assert = require('assert')
require('./helpers/ts_require')
const { readAllById, KEYSET_PAGE } = require('../src/lib/keysetRead.ts')

let passed = 0
const ok = (m) => { passed++; console.log('  ok - ' + m) }

/** A query builder over an in-memory table that, like PostgREST, never returns more than `cap` rows. */
function table(rows, cap = 1000, failOnCall = 0) {
  let calls = 0
  const build = () => {
    calls++
    let lt = null
    let asc = true
    const q = {
      lt(col, v) { assert.strictEqual(col, 'id'); lt = v; return q },
      order(col, o) { assert.strictEqual(col, 'id'); asc = o.ascending; return q },
      limit(n) {
        if (failOnCall && calls === failOnCall) return Promise.resolve({ data: null, error: { message: 'boom' } })
        let r = rows.filter((x) => lt === null || x.id < lt)
        r.sort((a, b) => (asc ? a.id - b.id : b.id - a.id))
        return Promise.resolve({ data: r.slice(0, Math.min(n, cap)), error: null })
      },
    }
    return q
  }
  return { build, calls: () => calls }
}

;(async () => {
  const rows = Array.from({ length: 3543 }, (_, i) => ({ id: i + 1 }))
  let t = table(rows)
  let r = await readAllById(t.build)
  assert.strictEqual(r.rows.length, 3543)
  assert.strictEqual(new Set(r.rows.map((x) => x.id)).size, 3543)
  assert.strictEqual(r.rows[0].id, 3543)
  assert.strictEqual(r.truncated, false)
  assert.strictEqual(r.error, null)
  assert.strictEqual(t.calls(), 4)
  ok('3,543 rows (client 1 today) come back in full in 4 pages of ' + KEYSET_PAGE + ', newest id first, no duplicates')

  t = table(rows.slice(0, 1000))
  r = await readAllById(t.build)
  assert.strictEqual(r.rows.length, 1000)
  assert.strictEqual(t.calls(), 2)
  ok('exactly one full page asks once more and stops on the empty page')

  t = table([])
  r = await readAllById(t.build)
  assert.deepStrictEqual(r.rows, [])
  assert.strictEqual(r.truncated, false)
  ok('no rows: empty, not truncated')

  t = table(rows)
  r = await readAllById(t.build, { page: 500, ceiling: 1200 })
  assert.strictEqual(r.rows.length, 1500)
  assert.strictEqual(r.truncated, true)
  ok('the ceiling stops the read and says truncated')

  t = table(rows, 1000, 2)
  r = await readAllById(t.build)
  assert.ok(r.error, 'error returned')
  assert.strictEqual(r.rows.length, 1000)
  ok('a failed page returns the error, so the page shows its retry card instead of a short list')

  console.log(`\n${passed} passed`)
})().catch((e) => { console.error(e); process.exit(1) })
