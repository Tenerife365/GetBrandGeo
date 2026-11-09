const path = require('path')
require('./helpers/ts_require')
const { csvEscapeCell, toCsv, csvFilename } = require(path.join(__dirname, '..', 'src', 'lib', 'csv.ts'))
let passed = 0, failed = 0
function check(name, fn) {
  try { fn(); passed++ } catch (e) { failed++; console.log('FAIL', name, e.message) }
}
const eq = (a, b) => { if (a !== b) throw new Error(JSON.stringify(a) + ' !== ' + JSON.stringify(b)) }

check('null and undefined', () => { eq(csvEscapeCell(null), ''); eq(csvEscapeCell(undefined), '') })
check('formula guard', () => eq(csvEscapeCell('=SUM(A1)'), "'=SUM(A1)"))
check('guard + at tab cr', () => {
  eq(csvEscapeCell('+1'), "'+1"); eq(csvEscapeCell('@x'), "'@x"); eq(csvEscapeCell('-x'), "'-x")
  eq(csvEscapeCell('\tx'), "'\tx")
})
check('number is never guarded', () => { eq(csvEscapeCell(-1), '-1'); eq(csvEscapeCell(2.5), '2.5') })
check('comma wraps', () => eq(csvEscapeCell('a,b'), '"a,b"'))
check('quote doubles', () => eq(csvEscapeCell('say "hi"'), '"say ""hi"""'))
check('newline wraps', () => eq(csvEscapeCell('a\nb'), '"a\nb"'))
check('guard then wrap', () => eq(csvEscapeCell('=a,b'), '"\'=a,b"'))
check('toCsv BOM and CRLF', () => {
  const s = toCsv(['a', 'b'], [[1, 'x'], [null, 'y,z']])
  eq(s, '\uFEFFa,b\r\n1,x\r\n,"y,z"\r\n')
})
check('filename', () => {
  eq(csvFilename('ai-visibility', 'Bucate pe Roate!', 1, new Date('2026-11-08T23:00:00Z')),
    'brandgeo-ai-visibility-bucate-pe-roate-2026-11-08.csv')
})
check('filename fallback and cap', () => {
  eq(csvFilename('competitors', '', 7, new Date('2026-11-08T00:00:00Z')), 'brandgeo-competitors-client-7-2026-11-08.csv')
  eq(csvFilename('competitors', '!!!', 7, new Date('2026-11-08T00:00:00Z')), 'brandgeo-competitors-client-7-2026-11-08.csv')
  const long = csvFilename('competitors', 'a'.repeat(80), 7, new Date('2026-11-08T00:00:00Z'))
  eq(long, 'brandgeo-competitors-' + 'a'.repeat(40) + '-2026-11-08.csv')
})
console.log(`csv: ${passed} passed, ${failed} failed`)
process.exit(failed ? 1 : 0)
