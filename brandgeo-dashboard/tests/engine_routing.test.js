/**
 * engine_routing.test.js — guards the frontend/backend engine-routing pair.
 * Run: `node tests/engine_routing.test.js` (exits non-zero on failure).
 *
 * WHY. On 2026-07-29 the per-prompt Refresh button was reported as "not
 * working" for grok. It was not a timeout and not a deploy problem. The button
 * filtered engines through an INLINE list in collectionContext.tsx:
 *
 *     ['gemini', 'perplexity', 'meta', 'google_ai']
 *
 * while FAST_ENGINES in collect-prompt.js had grown to six. grok and
 * ai_overview were therefore never put in `active_engines`; the server filtered
 * them out and wrote no row at all — not even an error row. The failure was
 * completely silent, on the two engines that justify the top of the plan ladder.
 *
 * The two files cannot import each other (CommonJS Netlify function vs the Vite
 * bundle), which is the same split already accepted for _cost.js and _plans.js.
 * Where an import is impossible, a test is the only thing that keeps a hand-kept
 * mirror honest. This is that test.
 */
const assert = require('assert')
const fs = require('fs')
const path = require('path')

let passed = 0
const ok = (n) => { passed++; console.log('  ok -', n) }

const read = (p) => fs.readFileSync(path.join(__dirname, '..', p), 'utf8')

/**
 * Pull a single-line or wrapped array literal of quoted strings out of source.
 * Skips empty bracket pairs so a TypeScript annotation cannot be mistaken for
 * the value: `export const X: EngineId[] =\n  ['a','b']` has TWO bracket pairs
 * and the first one is the type. Taking it yielded an empty list, which made
 * the guard fail against correct source the first time it ran.
 */
function extractList(src, marker) {
  const at = src.indexOf(marker)
  assert.notStrictEqual(at, -1, `could not find ${marker}`)
  let from = at
  for (;;) {
    const open = src.indexOf('[', from)
    const close = src.indexOf(']', open)
    assert.ok(open !== -1 && close > open, `could not read the array after ${marker}`)
    const body = src.slice(open + 1, close)
    if (body.trim()) {
      return body.split(',')
        .map(s => s.trim().replace(/^['"]|['"]$/g, ''))
        .filter(Boolean)
    }
    from = close + 1   // empty pair, e.g. the `[]` in `EngineId[]`
  }
}

const serverFast = extractList(read('netlify/functions/collect-prompt.js'), 'const FAST_ENGINES')
const clientFast = extractList(read('src/lib/planConfig.ts'), 'export const COLLECT_PROMPT_ENGINES')

assert.deepStrictEqual(
  [...clientFast].sort(), [...serverFast].sort(),
  `collect-prompt.js FAST_ENGINES and planConfig.ts COLLECT_PROMPT_ENGINES have diverged.\n` +
  `  server: ${JSON.stringify(serverFast)}\n  client: ${JSON.stringify(clientFast)}\n` +
  `  An engine present on only one side never runs from the Refresh button, and fails SILENTLY.`)
ok(`FAST_ENGINES matches COLLECT_PROMPT_ENGINES (${serverFast.length} engines)`)

// grok and ai_overview are the two that were missing. Name them explicitly so a
// regression reads as the actual defect rather than a generic mismatch.
for (const e of ['grok', 'ai_overview']) {
  assert.ok(clientFast.includes(e), `${e} must be routable from the Refresh button`)
  assert.ok(serverFast.includes(e), `${e} must be accepted by collect-prompt`)
}
ok('grok and ai_overview are routable on the manual refresh path')

// The refresh path must not re-inline the list. Catches a future edit that
// reintroduces the literal instead of importing the constant.
const ctx = read('src/lib/collectionContext.tsx')
assert.ok(ctx.includes('COLLECT_PROMPT_ENGINES'),
  'collectionContext must filter through COLLECT_PROMPT_ENGINES')
assert.ok(!/\[\s*'gemini',\s*'perplexity',\s*'meta',\s*'google_ai'\s*\]/.test(ctx),
  'the inlined four-engine list is back in collectionContext.tsx')
ok('collectionContext imports the shared list instead of inlining one')

// Every engine collect-prompt claims must be something _collect.js can call.
const collect = read('netlify/functions/_collect.js')
const callers = collect.slice(collect.indexOf('ENGINE_CALLERS'))
for (const e of serverFast) {
  assert.ok(new RegExp(`(^|\\s)${e}\\s*:`, 'm').test(callers), `_collect.js has no caller for ${e}`)
}
ok('every routed engine has a caller in _collect.js')

// No HTTP-path engine timeout may reach the 26s Netlify wall: the row insert
// needs room after the engine returns, or the process is killed mid-write and
// the result vanishes. This is the bug fixed in 476df77.
const block = collect.split('const ENGINE_TIMEOUT_MS = {')[1].split(/^}/m)[0]
const over = [...block.matchAll(/^\s*([a-z_]+):\s*(\d+)/gm)]
  .filter(m => Number(m[2]) > 24000).map(m => `${m[1]}=${m[2]}`)
assert.deepStrictEqual(over, [],
  `HTTP engine timeouts with no room to write their row: ${over.join(', ')}`)
ok('no HTTP-path engine timeout crowds the 26s wall')

console.log(`\n${passed} checks passed`)
