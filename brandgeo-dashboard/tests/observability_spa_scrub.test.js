/**
 * observability_spa_scrub.test.js - guards the browser-side PII scrub in
 * src/lib/observability.ts (docs/arch/observability.md section 7).
 * Run: `node tests/observability_spa_scrub.test.js` from brandgeo-dashboard/
 * (exits non-zero on failure).
 *
 * It runs every case in tests/fixtures/observability-pii.json through the
 * exported scrubEvent and asserts the exact expected output, then asserts the
 * regex list in the fixture, in observability.ts and in the server file
 * netlify/functions/_observability.js are identical.
 *
 * TS loading approach (same as prompt_performance.test.js): no test runner
 * exists in this repo, so the module is transpiled in process with the
 * `typescript` package and compiled with `new Module()._compile`. Two things
 * are specific to this file: `import.meta.env` is not valid in CommonJS, so it
 * is rewritten to an empty object (initObservability is not exercised here),
 * and './supabase' is replaced by a stub so no client is created. Nothing under
 * src/ is changed to make this work.
 *
 * Fixtures use example.com addresses only.
 */
const assert = require('assert')
const fs = require('fs')
const path = require('path')
const ts = require('typescript')
const Module = require('module')

const ROOT = path.join(__dirname, '..')
const FILE = path.join(ROOT, 'src', 'lib', 'observability.ts')

const src = fs.readFileSync(FILE, 'utf8').replace(/import\.meta\.env/g, '({})')
const js = ts.transpileModule(src, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText
const mod = new Module(FILE)
mod.filename = FILE
mod.paths = Module._nodeModulePaths(path.dirname(FILE))
mod.require = spec => {
  if (spec === './supabase') return { isDemoMode: true }
  return require(spec)
}
mod._compile(js, FILE)
const { scrubEvent, OBS_PATTERNS } = mod.exports

assert.strictEqual(typeof scrubEvent, 'function', 'scrubEvent must be exported')

const fixture = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'observability-pii.json'), 'utf8'))
const server = require(path.join(ROOT, 'netlify', 'functions', '_observability.js'))

let passed = 0
let failed = 0
function check(name, fn) {
  try {
    fn()
    passed++
  } catch (e) {
    failed++
    console.error('FAIL: ' + name + '\n  ' + String(e.message).split('\n').join('\n  '))
  }
}

// Pattern parity: fixture == observability.ts == _observability.js.
for (const key of Object.keys(fixture.patterns)) {
  const want = fixture.patterns[key]
  check('pattern ' + key + ' matches the fixture', () => {
    assert.ok(OBS_PATTERNS[key], 'missing in observability.ts')
    assert.strictEqual(OBS_PATTERNS[key].source, want.source)
    assert.strictEqual(OBS_PATTERNS[key].flags, want.flags)
  })
  check('pattern ' + key + ' matches the server file', () => {
    const s = server._internal.PATTERNS[key]
    assert.ok(s, 'missing in _observability.js')
    assert.strictEqual(OBS_PATTERNS[key].source, s.source)
    assert.strictEqual(OBS_PATTERNS[key].flags, s.flags)
  })
}
check('no extra patterns in observability.ts', () => {
  assert.deepStrictEqual(Object.keys(OBS_PATTERNS).sort(), Object.keys(fixture.patterns).sort())
})

// Every fixture case, exact output.
for (const c of fixture.cases) {
  check(c.name, () => {
    const before = JSON.stringify(c.input)
    const out = scrubEvent(c.input)
    assert.deepStrictEqual(out, c.expected)
    assert.strictEqual(JSON.stringify(c.input), before, 'input must not be mutated')
  })
}

// Same fixture, run through the server scrub: the two implementations agree.
for (const c of fixture.cases) {
  check('parity with server scrub: ' + c.name, () => {
    assert.deepStrictEqual(scrubEvent(c.input), server.scrubEvent(c.input))
  })
}

// Extra browser-side cases.
check('empty and missing input do not throw', () => {
  assert.deepStrictEqual(scrubEvent({}), {})
  assert.deepStrictEqual(scrubEvent(undefined), {})
})
check('a circular event throws, so the caller can drop it', () => {
  const a = {}
  a.self = a
  assert.throws(() => scrubEvent(a))
})
check('a browser frame filename loses its query and an email in the message is masked', () => {
  const out = scrubEvent({
    message: 'failed for jane.doe@example.com',
    exception: { values: [{ type: 'Error', value: 'boom', stacktrace: { frames: [{ filename: 'https://app.getbrandgeo.com/assets/index-Abc.js?x=1', lineno: 1 }] } }] },
  })
  assert.strictEqual(out.message, 'failed for [email]')
  assert.strictEqual(out.exception.values[0].stacktrace.frames[0].filename, 'https://app.getbrandgeo.com/assets/index-Abc.js')
})

console.log(`observability_spa_scrub: ${passed} passed, ${failed} failed`)
process.exit(failed === 0 ? 0 : 1)
