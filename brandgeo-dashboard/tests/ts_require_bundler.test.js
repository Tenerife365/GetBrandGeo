/**
 * ts_require_bundler.test.js
 *
 * A Netlify function that requires a .ts file, directly or through a helper
 * it requires, must be bundled by esbuild: netlify.toml needs
 *   [functions."<name>"]
 *     node_bundler = "esbuild"
 * The default bundler ships the .ts file as it is. On 2026-11-11 the first
 * invocation of explee-import-background under the default bundler made no
 * database call and wrote no job_runs row, while the same code ran under
 * plain node (with tests/helpers/ts_require.js) and as an esbuild bundle.
 *
 * Run: node tests/ts_require_bundler.test.js
 */
const fs = require('fs')
const path = require('path')
const assert = require('assert')

const ROOT = path.join(__dirname, '..')
const FN_DIR = path.join(ROOT, 'netlify', 'functions')
const toml = fs.readFileSync(path.join(ROOT, 'netlify.toml'), 'utf8')

let passed = 0
function check(name, fn) {
  fn()
  passed++
  console.log(`ok ${passed} - ${name}`)
}

// Strip comments so a commented-out require is not counted.
function code(file) {
  return fs.readFileSync(file, 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')
}

const REQUIRE_RE = /require\(\s*['"]([^'"]+)['"]\s*\)/g

function requiresOf(file) {
  const out = []
  const src = code(file)
  let m
  REQUIRE_RE.lastIndex = 0
  while ((m = REQUIRE_RE.exec(src)) !== null) out.push(m[1])
  return out
}

// Does this file, or any local .js helper it requires, require a .ts file?
function reachesTs(file, seen = new Set()) {
  if (seen.has(file)) return null
  seen.add(file)
  for (const spec of requiresOf(file)) {
    if (!spec.startsWith('.')) continue
    if (spec.endsWith('.ts')) return `${path.basename(file)} requires ${spec}`
    let target = path.resolve(path.dirname(file), spec)
    if (!fs.existsSync(target) && fs.existsSync(target + '.js')) target += '.js'
    if (!target.endsWith('.js') || !fs.existsSync(target)) continue
    const hit = reachesTs(target, seen)
    if (hit) return hit
  }
  return null
}

// The settings block of one function: from its header to the next header.
function tomlBlock(name) {
  const header = `[functions."${name}"]`
  const start = toml.indexOf(header)
  if (start === -1) return null
  const rest = toml.slice(start + header.length)
  const next = rest.search(/^\s*\[/m)
  return next === -1 ? rest : rest.slice(0, next)
}

function hasEsbuild(name) {
  const block = tomlBlock(name)
  if (block === null) return false
  return block.split('\n').some((line) => /^\s*node_bundler\s*=\s*"esbuild"\s*$/.test(line))
}

const endpoints = fs.readdirSync(FN_DIR)
  .filter((f) => f.endsWith('.js') && !f.startsWith('_'))
  .map((f) => ({ name: f.slice(0, -3), file: path.join(FN_DIR, f) }))

const needing = endpoints
  .map((e) => ({ ...e, why: reachesTs(e.file) }))
  .filter((e) => e.why)

check('the scan finds the functions known to require a .ts file', () => {
  const names = needing.map((e) => e.name)
  assert.ok(names.includes('mcp-server'), 'mcp-server requires dashboard .ts source')
  assert.ok(names.includes('explee-import-background'), 'explee-import-background requires src/lib/markets.ts')
})

for (const e of needing) {
  check(`${e.name} is bundled by esbuild (${e.why})`, () => {
    assert.ok(hasEsbuild(e.name), `netlify.toml needs [functions."${e.name}"] with node_bundler = "esbuild"`)
  })
}

check('a commented-out line does not count as the setting', () => {
  const block = '\n  # node_bundler = "esbuild"\n  timeout = 26\n'
  assert.strictEqual(block.split('\n').some((line) => /^\s*node_bundler\s*=\s*"esbuild"\s*$/.test(line)), false)
})

check('a function that reaches no .ts file is not flagged', () => {
  const names = needing.map((e) => e.name)
  assert.ok(!names.includes('onboard-client'))
  assert.ok(!names.includes('schedule-collections'))
})

console.log(`\n${passed} passed, 0 failed`)
