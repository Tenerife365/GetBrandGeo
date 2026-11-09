const path = require('path')
require('./helpers/ts_require')
const { createResultsLoader, RESULTS_MAX_AGE_MS } = require(path.join(__dirname, '..', 'src', 'lib', 'resultsLoader.ts'))
const F = require('./fixtures/results-fixture')

let passed = 0, failed = 0
const tests = []
function check(name, fn) { tests.push([name, fn]) }
const eq = (a, b) => {
  const x = JSON.stringify(a), y = JSON.stringify(b)
  if (x !== y) throw new Error(x + ' !== ' + y)
}

function rig(opts = {}) {
  const calls = { snap: 0, prompts: 0 }
  const clock = { t: 1000 }
  const gates = []
  const fetchSnapshot = cid => {
    calls.snap++
    if (opts.manual) return new Promise(res => gates.push(() => res({ rows: [{ id: cid }], truncated: false, error: null })))
    if (opts.failSnap) return Promise.resolve({ rows: [], truncated: false, error: new Error('missing rpc') })
    return Promise.resolve({ rows: [{ id: cid }], truncated: !!opts.truncated, error: null })
  }
  const fetchPrompts = () => {
    calls.prompts++
    return Promise.resolve({ data: F.prompts, error: null })
  }
  const loader = createResultsLoader(fetchSnapshot, fetchPrompts, () => clock.t)
  return { loader, calls, clock, gates }
}

check('no load without interest, then dirty load after retain', async () => {
  const { loader, calls } = rig()
  await loader.load('u:1', 1)
  eq(calls.snap, 0)
  loader.retain()
  await loader.load('u:1', 1)
  eq(calls.snap, 1)
  eq(loader.getState().status, 'ready')
  eq(loader.getState().snapshot.activePrompts.length, 3)
})
check('fresh snapshot is not reloaded; stale one is', async () => {
  const { loader, calls, clock } = rig()
  loader.retain()
  await loader.load('u:1', 1)
  clock.t += RESULTS_MAX_AGE_MS - 1
  await loader.load('u:1', 1)
  eq(calls.snap, 1)
  clock.t += 2
  await loader.load('u:1', 1)
  eq(calls.snap, 2)
})
check('markDirty forces the next load', async () => {
  const { loader, calls } = rig()
  loader.retain()
  await loader.load('u:1', 1)
  loader.markDirty()
  await loader.load('u:1', 1)
  eq(calls.snap, 2)
})
check('key change drops the old snapshot', async () => {
  const { loader } = rig()
  loader.retain()
  await loader.load('u:1', 1)
  const p = loader.load('u:2', 2)
  eq(loader.getState().snapshot, null)
  await p
  eq(loader.getState().snapshot.clientId, 2)
})
check('concurrent loads of one key coalesce', async () => {
  const { loader, calls, gates } = rig({ manual: true })
  loader.retain()
  const a = loader.load('u:1', 1)
  const b = loader.load('u:1', 1)
  eq(calls.snap, 1)
  gates.shift()()
  await Promise.all([a, b])
  eq(calls.snap, 1)
})
check('a forced load during a flight reruns once', async () => {
  const { loader, calls, gates } = rig({ manual: true })
  loader.retain()
  const a = loader.load('u:1', 1)
  const b = loader.load('u:1', 1, { force: true })
  gates.shift()()
  await new Promise(r => setTimeout(r, 5))
  gates.shift()()
  await Promise.all([a, b])
  eq(calls.snap, 2)
})
check('stale result is discarded after clear', async () => {
  const { loader, gates } = rig({ manual: true })
  loader.retain()
  const a = loader.load('u:1', 1)
  loader.clear()
  gates.shift()()
  await a
  eq(loader.getState().status, 'idle')
  eq(loader.getState().snapshot, null)
})
check('a failed first load is an error state', async () => {
  const { loader } = rig({ failSnap: true })
  loader.retain()
  await loader.load('u:1', 1)
  eq([loader.getState().status, loader.getState().snapshot, loader.getState().loadError], ['error', null, true])
})
check('a failed quiet reload keeps the snapshot', async () => {
  const state = { fail: false }
  const clock = { t: 1 }
  const loader = createResultsLoader(
    async () => (state.fail ? { rows: [], truncated: false, error: new Error('x') } : { rows: [{ id: 1 }], truncated: false, error: null }),
    async () => ({ data: F.prompts, error: null }),
    () => clock.t,
  )
  loader.retain()
  await loader.load('u:1', 1)
  state.fail = true
  await loader.load('u:1', 1, { quiet: true, force: true })
  const s = loader.getState()
  eq([s.status, s.loadError, s.snapshot !== null], ['ready', true, true])
})
check('promptsOnly keeps rows and bumps version', async () => {
  const { loader, calls } = rig()
  loader.retain()
  await loader.load('u:1', 1)
  const v = loader.getState().snapshot.version
  await loader.load('u:1', 1, { promptsOnly: true })
  eq(calls.snap, 1)
  eq(calls.prompts, 2)
  eq(loader.getState().snapshot.version > v, true)
})
check('subscribers are notified and can unsubscribe', async () => {
  const { loader } = rig()
  let n = 0
  const off = loader.subscribe(() => { n++ })
  loader.retain()
  await loader.load('u:1', 1)
  const seen = n
  off()
  loader.clear()
  eq(seen > 0, true)
  eq(n, seen)
})

check('F1: switch A to B with A in flight drops A at once and never commits it', async () => {
  const { loader, calls, gates } = rig({ manual: true })
  loader.retain()
  const a = loader.load('u:1', 1)
  const b = loader.load('u:2', 2)
  // B started immediately, no wait for A to settle.
  eq(calls.snap, 2)
  eq([loader.getState().snapshot, loader.getState().status], [null, 'loading'])
  gates.shift()() // A settles late
  await a
  eq(loader.getState().snapshot, null)
  gates.shift()() // B settles
  await b
  eq(loader.getState().snapshot.key, 'u:2')
  eq(loader.getState().snapshot.clientId, 2)
})
check('F1: switch A to B with A idle emits null and loading before B lands', async () => {
  const { loader } = rig()
  loader.retain()
  await loader.load('u:1', 1)
  eq(loader.getState().snapshot.key, 'u:1')
  const seen = []
  loader.subscribe(() => { const s = loader.getState(); seen.push(s.snapshot ? s.snapshot.key : null) })
  const p = loader.load('u:2', 2)
  eq(loader.getState().snapshot, null)
  eq(loader.getState().status, 'loading')
  await p
  eq(seen.includes('u:1'), false)
  eq(loader.getState().snapshot.key, 'u:2')
})
check('F3: revalidate on a fresh snapshot reloads prompts only and quietly', async () => {
  const { loader, calls } = rig()
  loader.retain()
  await loader.load('u:1', 1)
  const states = []
  loader.subscribe(() => { const s = loader.getState(); states.push(s.snapshot === null) })
  await loader.revalidate('u:1', 1)
  eq(calls.snap, 1)
  eq(calls.prompts, 2)
  eq(states.includes(true), false)
})
check('F3: revalidate on a stale snapshot is a quiet full load', async () => {
  const { loader, calls, clock } = rig()
  loader.retain()
  await loader.load('u:1', 1)
  clock.t += RESULTS_MAX_AGE_MS + 1
  const states = []
  loader.subscribe(() => { states.push(loader.getState().snapshot === null) })
  await loader.revalidate('u:1', 1)
  eq(calls.snap, 2)
  eq(states.includes(true), false)
})
check('F3: revalidate with no snapshot is a plain load', async () => {
  const { loader, calls } = rig()
  loader.retain()
  await loader.revalidate('u:1', 1)
  eq(calls.snap, 1)
  eq(loader.getState().status, 'ready')
})

check('N1: loadOk resolves true on a committed load', async () => {
  const { loader } = rig()
  loader.retain()
  eq(await loader.loadOk('u:1', 1), true)
})
check('N1: a failed quiet reload resolves false and keeps the snapshot', async () => {
  let fail = false
  const loader = createResultsLoader(
    async cid => fail
      ? { rows: [], truncated: false, error: new Error('network') }
      : { rows: [{ id: cid }], truncated: false, error: null },
    async () => ({ data: F.prompts, error: null }),
  )
  loader.retain()
  eq(await loader.loadOk('u:1', 1), true)
  fail = true
  eq(await loader.loadOk('u:1', 1, { quiet: true, force: true }), false)
  eq(loader.getState().loadError, true)
  eq(loader.getState().snapshot.key, 'u:1')
})
check('N1: a non-quiet failure resolves false', async () => {
  const { loader } = rig({ failSnap: true })
  loader.retain()
  eq(await loader.loadOk('u:1', 1), false)
})
check('N1: no interest resolves false', async () => {
  const { loader } = rig()
  eq(await loader.loadOk('u:1', 1), false)
})
check('N1: a load superseded by another key resolves false for the old key', async () => {
  const { loader, gates } = rig({ manual: true })
  loader.retain()
  const a = loader.loadOk('u:1', 1)
  const b = loader.loadOk('u:2', 2)
  while (gates.length) gates.shift()()
  await new Promise(r => setTimeout(r, 5))
  while (gates.length) gates.shift()()
  eq(await a, false)
  eq(await b, true)
})

;(async () => {
  for (const [name, fn] of tests) {
    try { await fn(); passed++ } catch (e) { failed++; console.log('FAIL', name, e.message) }
  }
  console.log(`results_loader: ${passed} passed, ${failed} failed`)
  process.exit(failed ? 1 : 0)
})()
