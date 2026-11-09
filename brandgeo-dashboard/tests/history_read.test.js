const path = require('path')
require('./helpers/ts_require')
const { readResultHistory } = require(path.join(__dirname, '..', 'src', 'lib', 'historyRead.ts'))

let passed = 0, failed = 0
const tests = []
function check(name, fn) { tests.push([name, fn]) }
const eq = (a, b) => {
  const x = JSON.stringify(a), y = JSON.stringify(b)
  if (x !== y) throw new Error(x + ' !== ' + y)
}

// Recording fake of the supabase query builder, serving id-desc keyset pages.
function fake(allRows) {
  const log = []
  const sb = {
    from(table) {
      const q = { table, calls: [], lt: null }
      const rec = (n, a) => { q.calls.push([n, ...a]); return q }
      q.select = (...a) => rec('select', a)
      q.eq = (...a) => rec('eq', a)
      q.neq = (...a) => rec('neq', a)
      q.gte = (...a) => rec('gte', a)
      q.lt = (c, v) => { q.ltVal = v; return rec('lt', [c, v]) }
      q.order = (...a) => rec('order', a)
      q.limit = n => {
        log.push(q.calls.slice())
        const rows = allRows.filter(r => q.ltVal === undefined || r.id < q.ltVal).sort((a, b) => b.id - a.id).slice(0, n)
        return Promise.resolve({ data: rows, error: null })
      }
      return q
    },
  }
  return { sb, log }
}

check('filters: client, not error, since', async () => {
  const { sb, log } = fake([{ id: 1, checked_at: '2026-11-01T00:00:00' }])
  const res = await readResultHistory(sb, { clientId: 9, sinceIso: '2026-10-01T00:00:00Z', columns: 'id,checked_at' })
  eq(res.rows.length, 1)
  const c = log[0]
  eq(c.some(x => x[0] === 'eq' && x[1] === 'client_id' && x[2] === 9), true)
  eq(c.some(x => x[0] === 'neq' && x[1] === 'status' && x[2] === 'error'), true)
  eq(c.some(x => x[0] === 'gte' && x[1] === 'checked_at'), true)
  eq(c.some(x => x[0] === 'eq' && x[1] === 'brand_mentioned'), false)
})
check('mentionedOnly adds the filter, null since omits gte', async () => {
  const { sb, log } = fake([])
  await readResultHistory(sb, { clientId: 1, sinceIso: null, columns: 'id,checked_at', mentionedOnly: true })
  const c = log[0]
  eq(c.some(x => x[0] === 'eq' && x[1] === 'brand_mentioned' && x[2] === true), true)
  eq(c.some(x => x[0] === 'gte'), false)
})
check('pages past 1000 rows and returns newest first', async () => {
  const rows = []
  for (let i = 1; i <= 2500; i++) rows.push({ id: i, checked_at: '2026-11-01T00:00:' + String(i % 60).padStart(2, '0') })
  const { sb, log } = fake(rows)
  const res = await readResultHistory(sb, { clientId: 1, sinceIso: null, columns: 'id,checked_at' })
  eq(res.rows.length, 2500)
  eq(log.length, 3)
  eq(res.truncated, false)
  for (let i = 1; i < res.rows.length; i++) {
    const a = res.rows[i - 1], b = res.rows[i]
    if (a.checked_at < b.checked_at || (a.checked_at === b.checked_at && a.id < b.id)) throw new Error('not newest first at ' + i)
  }
})

;(async () => {
  for (const [name, fn] of tests) {
    try { await fn(); passed++ } catch (e) { failed++; console.log('FAIL', name, e.message) }
  }
  console.log(`history_read: ${passed} passed, ${failed} failed`)
  process.exit(failed ? 1 : 0)
})()
