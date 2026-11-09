// Client-switch guards (phase 2 re-review N3). The provider guard and the page
// client-tag guards are pure functions in src/lib/resultsGuards.ts; the pages
// and the provider must call them (source wiring checks below).
const fs = require('fs')
const path = require('path')
require('./helpers/ts_require')
const G = require(path.join(__dirname, '..', 'src', 'lib', 'resultsGuards.ts'))

let passed = 0, failed = 0
function check(name, fn) {
  try { fn(); passed++ } catch (e) { failed++; console.log('FAIL', name, e.message) }
}
const eq = (a, b) => {
  const x = JSON.stringify(a), y = JSON.stringify(b)
  if (x !== y) throw new Error(x + ' !== ' + y)
}
const src = f => fs.readFileSync(path.join(__dirname, '..', 'src', f), 'utf8')

const snapA = { key: 'u:1', clientId: 1, rows: [{ id: 1 }], prompts: [], activePrompts: [], loadedAt: 0, version: 1, truncated: false }
const ready = s => ({ snapshot: s, status: 'ready', loadError: false })

check('visibleSnapshot: same key passes through unchanged', () => {
  const st = ready(snapA)
  eq(G.visibleSnapshot(st, 'u:1') === st, true)
})
check('visibleSnapshot: a snapshot of another key is hidden, status loading', () => {
  const v = G.visibleSnapshot(ready(snapA), 'u:2')
  eq(v, { snapshot: null, status: 'loading', loadError: false })
})
check('visibleSnapshot: hides a stale loadError of the other client too', () => {
  const v = G.visibleSnapshot({ snapshot: snapA, status: 'ready', loadError: true }, 'u:2')
  eq(v.loadError, false)
})
check('visibleSnapshot: no snapshot keeps idle and error states', () => {
  eq(G.visibleSnapshot({ snapshot: null, status: 'error', loadError: true }, 'u:2').status, 'error')
  eq(G.visibleSnapshot({ snapshot: null, status: 'idle', loadError: false }, 'u:2').status, 'idle')
})
check('ownRows: own rows pass, another client rows give the fallback', () => {
  const st = { rows: [{ id: 101 }], clientId: 1 }
  eq(G.ownRows(st, 1, []), [{ id: 101 }])
  eq(G.ownRows(st, 2, []), [])
  eq(G.ownRows({ rows: null, clientId: 1 }, 2, null), null)
})
check('isOwn', () => {
  eq(G.isOwn({ clientId: 1 }, 1), true)
  eq(G.isOwn({ clientId: 1 }, 2), false)
})
check('committedOk: only ready, no loadError, same key', () => {
  eq(G.committedOk(ready(snapA), 'u:1'), true)
  eq(G.committedOk(ready(snapA), 'u:2'), false)
  eq(G.committedOk({ snapshot: snapA, status: 'ready', loadError: true }, 'u:1'), false)
  eq(G.committedOk({ snapshot: null, status: 'error', loadError: true }, 'u:1'), false)
  eq(G.committedOk({ snapshot: snapA, status: 'loading', loadError: false }, 'u:1'), false)
})

// Wiring: the guards must be used in place, so removing one is caught here.
check('provider uses visibleSnapshot', () => {
  const s = src('lib/resultsContext.tsx')
  eq(/visibleSnapshot\(state, key\)/.test(s), true)
  eq(/foreign/.test(s), false)
})
check('Mentions uses ownRows for its history', () => {
  eq(/ownRows\(historyState, activeClientId, null\)/.test(src('pages/Mentions.tsx')), true)
})
check('BrandSentiment uses isOwn and ownRows', () => {
  const s = src('pages/BrandSentiment.tsx')
  eq(/isOwn\(state, clientId\)/.test(s), true)
  eq(/ownRows\(state, clientId,/.test(s), true)
})
check('Competitors uses ownRows for the trend', () => {
  eq(/ownRows\(trendState, activeClientId,/.test(src('pages/Competitors.tsx')), true)
})
check('Dashboard Refresh is a quiet reload (F4)', () => {
  eq(/reload\(\{ quiet: true \}\); void loadHistory\(true\)/.test(src('pages/Dashboard.tsx')), true)
})
check('AIVisibility awaits reload in Reload click and Check now (N1)', () => {
  const s = src('pages/AIVisibility.tsx')
  eq((s.match(/const ok = await reload\(\{ quiet: true \}\)/g) || []).length, 2)
  eq(/if \(!ok\) \{ setReloading\(false\); setReloadFailed\(shouldReportReloadFailure\(/.test(s), true)
  eq(/if \(!ok\) \{ setCheckAwaiting\(null\); setReloadFailed\(shouldReportReloadFailure\(/.test(s), true)
})
check('Mentions shows the skeleton while history loads and no chip count (N2)', () => {
  const s = src('pages/Mentions.tsx')
  eq(/historyLoading && <Skeleton className="h-\[220px\] w-full rounded-lg" \/>/.test(s), true)
  eq(/historyLoading \? allEnginesLabel/.test(s), true)
  eq(/const historyLoading = history === null && !historyFailed/.test(s), true)
})

console.log(`client_switch_guards: ${passed} passed, ${failed} failed`)
process.exit(failed ? 1 : 0)
