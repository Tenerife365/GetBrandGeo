// Ruling 1 (2026-11-09): a viewer archives a prompt (is_active = false), only an
// admin hard deletes. The role branch is a pure function; the page must use it
// and no non admin path may call delete.
const fs = require('fs')
const path = require('path')
require('./helpers/ts_require')
const R = require(path.join(__dirname, '..', 'src', 'lib', 'promptRemoval.ts'))

let passed = 0, failed = 0
function check(name, fn) {
  try { fn(); passed++ } catch (e) { failed++; console.log('FAIL', name, e.message) }
}
const eq = (a, b) => {
  const x = JSON.stringify(a), y = JSON.stringify(b)
  if (x !== y) throw new Error(x + ' !== ' + y)
}
const src = f => fs.readFileSync(path.join(__dirname, '..', 'src', f), 'utf8').replace(/\r\n/g, '\n')

check('admin deletes, everyone else archives', () => {
  eq(R.removalMode(true), 'delete')
  eq(R.removalMode(false), 'archive')
})
check('the write: delete for admin, is_active=false update for a viewer', () => {
  eq(R.removalWrite(R.removalMode(true)), { op: 'delete' })
  eq(R.removalWrite(R.removalMode(false)), { op: 'update', patch: { is_active: false } })
})
check('verbs and copy differ and are honest', () => {
  eq(R.removalVerb('delete'), 'Delete')
  eq(R.removalVerb('archive'), 'Archive')
  eq(/deleted too, and that cannot be undone/.test(R.removalConfirm('delete')), true)
  eq(/stops being checked/.test(R.removalConfirm('archive')), true)
  eq(/are kept/.test(R.removalConfirm('archive')), true)
  eq(/deleted/.test(R.removalConfirm('archive')), false)
  eq(/archive/.test(R.removalFailure('archive')), true)
  eq(/delete/.test(R.removalFailure('delete')), true)
})
check('no dash in the helper copy', () => {
  const dashes = new RegExp('[' + String.fromCharCode(0x2013) + String.fromCharCode(0x2014) + ']')
  eq(dashes.test(src('lib/promptRemoval.ts')), false)
})

// Wiring
const p = src('pages/Prompts.tsx')
check('Prompts picks the mode from isAdmin and writes through removalWrite', () => {
  eq(/const mode = removalMode\(isAdmin\)/.test(p), true)
  eq(/window\.confirm\(removalConfirm\(mode\)\)/.test(p), true)
  eq(/const write = removalWrite\(mode\)/.test(p), true)
  eq(/write\.op === 'delete'/.test(p), true)
  eq(/\.update\(write\.patch\)\.eq\('id', id\)/.test(p), true)
})
check('the only prompts delete call sits behind the admin branch', () => {
  const calls = p.match(/from\('prompts'\)\.delete\(\)/g) || []
  eq(calls.length, 1)
  const i = p.indexOf("from('prompts').delete()")
  const before = p.slice(Math.max(0, i - 120), i)
  eq(/write\.op === 'delete'/.test(before), true)
})
check('no other source file deletes from prompts', () => {
  const dir = path.join(__dirname, '..', 'src')
  const hits = []
  const walk = d => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const f = path.join(d, e.name)
      if (e.isDirectory()) walk(f)
      else if (/\.(ts|tsx)$/.test(e.name) && e.name !== 'Prompts.tsx') {
        if (/from\('prompts'\)\s*\.delete\(/.test(fs.readFileSync(f, 'utf8'))) hits.push(f)
      }
    }
  }
  walk(dir)
  eq(hits, [])
})
check('the control label and cap hints follow the role', () => {
  eq(/aria-label=\{`\$\{verb\} prompt: /.test(p), true)
  eq(/isAdmin \? <Trash2 size=\{14\} \/> : <Archive size=\{14\} \/>/.test(p), true)
  eq(/Delete one to add another/.test(p), false)
  eq(/\$\{verb\} one to add another/.test(p), true)
})

console.log(`prompts_archive: ${passed} passed, ${failed} failed`)
process.exit(failed ? 1 : 0)
