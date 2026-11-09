// Phase 2 final review R1 / R2 / I1 / I2. Every page history read takes a
// ticket (nextSeq) and drops its result when stale (isStale); the sequencer is
// a pure function proven here, and each call site is pinned by a wiring check
// strict enough that removing the guard, or keeping a dead call while rendering
// the raw state, fails a check.
const fs = require('fs')
const path = require('path')
require('./helpers/ts_require')
const G = require(path.join(__dirname, '..', 'src', 'lib', 'resultsGuards.ts'))

let passed = 0, failed = 0
const pending = []
function check(name, fn) {
  const done = () => { passed++ }
  const bad = e => { failed++; console.log('FAIL', name, e.message) }
  try {
    const r = fn()
    if (r && typeof r.then === 'function') pending.push(r.then(done, bad))
    else done()
  } catch (e) { bad(e) }
}
const eq = (a, b) => {
  const x = JSON.stringify(a), y = JSON.stringify(b)
  if (x !== y) throw new Error(x + ' !== ' + y)
}
const src = f => fs.readFileSync(path.join(__dirname, '..', 'src', f), 'utf8').replace(/\r\n/g, '\n')
const count = (s, re) => (s.match(re) || []).length

// --- the sequencer, behaviourally ------------------------------------------
check('nextSeq issues increasing tickets, only the newest is current', () => {
  const ref = { current: 0 }
  const a = G.nextSeq(ref), b = G.nextSeq(ref)
  eq([a, b], [1, 2])
  eq(G.isStale(ref, a), true)
  eq(G.isStale(ref, b), false)
})

// The page pattern: take a ticket, await the read, drop the result if stale.
function makePage() {
  const ref = { current: 0 }
  const page = { shown: null, writes: [] }
  const read = (clientId, wait) => {
    const mine = G.nextSeq(ref)
    return wait.then(() => {
      if (G.isStale(ref, mine)) return
      page.shown = clientId
      page.writes.push(clientId)
    })
  }
  return { read, page }
}
const gate = () => { let go; const p = new Promise(r => { go = r }); return { p, go } }

check('client 1 read landing after the client 2 read does not overwrite client 2', async () => {
  const { read, page } = makePage()
  const g1 = gate(), g2 = gate()
  const r1 = read(1, g1.p)
  const r2 = read(2, g2.p)
  g2.go(); await r2
  g1.go(); await r1
  eq(page.shown, 2)
  eq(page.writes, [2])
})
check('client 1 landing before the client 2 read is dropped too, 2 wins when it lands', async () => {
  const { read, page } = makePage()
  const g1 = gate(), g2 = gate()
  const r1 = read(1, g1.p)
  const r2 = read(2, g2.p)
  g1.go(); await r1
  eq(page.shown, null)
  g2.go(); await r2
  eq(page.shown, 2)
})
check('a lone read lands', async () => {
  const { read, page } = makePage()
  const g = gate()
  const r = read(1, g.p)
  g.go(); await r
  eq(page.shown, 1)
})

// --- R1 wiring: each of the six history reads uses the sequencer ------------
const sites = [
  { file: 'pages/Mentions.tsx', ref: 'historySeq', ticket: 'mine', guards: 1 },
  { file: 'pages/BrandSentiment.tsx', ref: 'seq', ticket: 'mine', guards: 2 },
  { file: 'pages/Competitors.tsx', ref: 'trendSeq', ticket: 'mine', guards: 2 },
  { file: 'pages/Competitors.tsx', ref: 'manualSeq', ticket: 'mine', guards: 1 },
  { file: 'pages/Dashboard.tsx', ref: 'historySeq', ticket: 'seq', guards: 1 },
  { file: 'pages/Recommendations.tsx', ref: 'historySeq', ticket: 'mine', guards: 2 },
]
for (const s of sites) {
  check(`${s.file} ${s.ref}: takes a ticket with nextSeq`, () => {
    const t = src(s.file)
    eq(count(t, new RegExp(`const ${s.ticket} = nextSeq\\(${s.ref}\\)`, 'g')), 1)
  })
  check(`${s.file} ${s.ref}: drops stale results with isStale`, () => {
    const t = src(s.file)
    eq(count(t, new RegExp(`isStale\\(${s.ref}, ${s.ticket}\\)`, 'g')) >= s.guards, true)
  })
  check(`${s.file} ${s.ref}: no hand rolled sequence compare left`, () => {
    const t = src(s.file)
    eq(new RegExp(`\\+\\+${s.ref}\\.current`).test(t), false)
    eq(new RegExp(`${s.ticket} [!=]==? ${s.ref}\\.current`).test(t), false)
  })
}
check('each early return guard sits after its await (not before)', () => {
  const m = src('pages/Mentions.tsx')
  eq(m.indexOf('if (isStale(historySeq, mine)) return') > m.indexOf('await readResultHistory'), true)
  const c = src('pages/Competitors.tsx')
  eq(c.indexOf('if (isStale(manualSeq, mine)) return') > c.indexOf(".eq('source', 'manual')"), true)
  eq(c.indexOf('if (isStale(trendSeq, mine)) return') > c.indexOf('await readResultHistory'), true)
  const d = src('pages/Dashboard.tsx')
  eq(d.indexOf('if (isStale(historySeq, seq)) return') > d.indexOf('await readResultHistory'), true)
  const r = src('pages/Recommendations.tsx')
  eq(r.indexOf('if (isStale(historySeq, mine)) return true') > r.indexOf(".from('recommendation_runs')"), true)
  const b = src('pages/BrandSentiment.tsx')
  eq(b.indexOf('if (isStale(seq, mine)) return') > b.indexOf('await readResultHistory'), true)
})

// --- manualComps carries its client and reads through ownRows ---------------
check('Competitors manual competitors are tagged and read through ownRows', () => {
  const c = src('pages/Competitors.tsx')
  eq(/const manualComps = ownRows\(manualState, activeClientId, \[\] as any\[\]\)/.test(c), true)
  eq(/setManualState\(\{ rows: manual \?\? \[\], clientId: activeClientId \}\)/.test(c), true)
  eq(/manualState\.rows/.test(c), false)
})
// I1: a dead ownRows call next to a render of the raw state must fail.
check('pages never render the raw tagged state (I1)', () => {
  eq(/historyState\.rows/.test(src('pages/Mentions.tsx')), false)
  eq(/const history = ownRows\(historyState, activeClientId, null\)/.test(src('pages/Mentions.tsx')), true)
  eq(/trendState\.rows/.test(src('pages/Competitors.tsx')), false)
  eq(/state\.rows/.test(src('pages/BrandSentiment.tsx').replace(/ownRows\(state, clientId,/g, '')), false)
})

// --- I2: the provider's reload returns the loader's loadOk -------------------
check('provider reload returns loader.loadOk for the active key (I2)', () => {
  eq(/return loader\.loadOk\(key, activeClientId, \{ quiet: opts\?\.quiet, force: true \}\)/.test(src('lib/resultsContext.tsx')), true)
})

// --- R2 -----------------------------------------------------------------------
check('shouldReportReloadFailure: only a failure on the same client', () => {
  eq(G.shouldReportReloadFailure(false, 1, 1), true)
  eq(G.shouldReportReloadFailure(false, 1, 2), false)
  eq(G.shouldReportReloadFailure(true, 1, 1), false)
  eq(G.shouldReportReloadFailure(true, 1, 2), false)
})
check('AIVisibility: Reload and Check now ignore a result for another client (R2)', () => {
  const a = src('pages/AIVisibility.tsx')
  eq(count(a, /const startedFor = activeClientId/g), 2)
  eq(/setReloading\(false\); setReloadFailed\(shouldReportReloadFailure\(ok, startedFor, activeClientRef\.current\)\)/.test(a), true)
  eq(/setCheckAwaiting\(null\); setReloadFailed\(shouldReportReloadFailure\(ok, startedFor, activeClientRef\.current\)\)/.test(a), true)
  eq(/activeClientRef\.current = activeClientId/.test(a), true)
})
check('AIVisibility: a client switch resets reloadFailed and checkAwaiting (R2)', () => {
  const a = src('pages/AIVisibility.tsx')
  eq(/useEffect\(\(\) => \{\n    setReloadFailed\(false\)\n    setCheckAwaiting\(null\)\n  \}, \[activeClientId\]\)/.test(a), true)
})

Promise.all(pending).then(() => {
  console.log(`page_sequencing: ${passed} passed, ${failed} failed`)
  process.exit(failed ? 1 : 0)
})
