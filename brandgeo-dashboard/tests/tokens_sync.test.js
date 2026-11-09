// AC-6 (phase3-visual-spec.md section 4.9): every hex copy of a colour token
// must equal the index.css triplet in the same theme. index.css is the single
// source; src/lib/tokens.ts and src/lib/chartTheme.ts hold hex copies for the
// places that cannot read a CSS variable (Recharts attributes). Nothing errors
// at runtime when they drift, so this test is the only thing that notices.
const fs = require('fs')
const path = require('path')

let passed = 0, failed = 0
function check(name, fn) {
  try { fn(); passed++ } catch (e) { failed++; console.log('FAIL', name, e.message) }
}
const read = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8').replace(/\r\n/g, '\n')
const tripOf = hex => {
  const h = hex.replace('#', '')
  return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16)).join(' ')
}

const css = read('src/index.css')

// Pull the declarations of one theme block out of index.css. The :root block
// ends at the first line that is exactly '}' after its opening; html.light the same.
function themeDecls(selector) {
  const start = css.indexOf('\n' + selector + ' {')
  if (start < 0) throw new Error('no ' + selector + ' block')
  const end = css.indexOf('\n}\n', start)
  const body = css.slice(start, end)
  const map = {}
  for (const m of body.matchAll(/^\s*--([a-z0-9-]+):\s*([^;]+);/gm)) map[m[1]] = m[2].trim()
  return map
}
const cssTheme = { dark: themeDecls(':root'), light: themeDecls('html.light') }

// --- tokens.ts ---------------------------------------------------------------
const tokensSrc = read('src/lib/tokens.ts')
function tokensTs(theme) {
  const start = tokensSrc.indexOf('  ' + theme + ': {')
  const end = tokensSrc.indexOf('\n  },', start)
  const out = {}
  for (const m of tokensSrc.slice(start, end).matchAll(/^\s*'?([a-z0-9-]+)'?:\s*'(#[0-9a-fA-F]{6})'/gm)) out[m[1]] = m[2]
  return out
}
for (const theme of ['dark', 'light']) {
  const t = tokensTs(theme)
  check('tokens.ts ' + theme + ' has 24 tokens', () => {
    if (Object.keys(t).length !== 24) throw new Error('found ' + Object.keys(t).length)
  })
  for (const [name, hex] of Object.entries(t)) {
    check('tokens.ts ' + theme + ' ' + name + ' = index.css', () => {
      const c = cssTheme[theme][name]
      if (!c) throw new Error('--' + name + ' not declared in ' + theme)
      if (c !== tripOf(hex)) throw new Error(hex + ' is ' + tripOf(hex) + ', index.css says ' + c)
    })
  }
}

// --- chartTheme.ts -----------------------------------------------------------
// chart key -> token name. tooltipSurface is surface-2 in dark and surface in
// light (spec 9.1), so it is resolved per theme.
const chartSrc = read('src/lib/chartTheme.ts')
function chartBlock(name) {
  const start = chartSrc.indexOf('const ' + name + ': ChartTheme = {')
  const end = chartSrc.indexOf('\n}', start)
  const out = {}
  for (const m of chartSrc.slice(start, end).matchAll(/^\s*([a-zA-Z]+):\s*'(#[0-9a-fA-F]{6})'/gm)) out[m[1]] = m[2]
  return out
}
const chartToToken = {
  gridLine: 'line', axisInk: 'ink-3', tooltipBorder: 'line-2', tooltipInk: 'ink', cardSurface: 'surface',
  sentimentPositive: 'pos', sentimentNeutral: 'neu', sentimentNegative: 'neg',
  you: 'accent', field: 'neu', track: 'surface-3', railActive: 'accent-ink',
}
for (const [theme, block] of [['dark', 'DARK'], ['light', 'LIGHT']]) {
  const c = chartBlock(block)
  check('chartTheme ' + block + ' has 13 keys', () => {
    if (Object.keys(c).length !== 13) throw new Error('found ' + Object.keys(c).length)
  })
  const map = { ...chartToToken, tooltipSurface: theme === 'dark' ? 'surface-2' : 'surface' }
  for (const [key, hex] of Object.entries(c)) {
    check('chartTheme ' + block + ' ' + key + ' = index.css', () => {
      const tokenName = map[key]
      if (!tokenName) throw new Error('no token mapping for ' + key)
      const cssVal = cssTheme[theme][tokenName]
      if (cssVal !== tripOf(hex)) throw new Error(hex + ' is ' + tripOf(hex) + ', --' + tokenName + ' is ' + cssVal)
      // and the hex copy in tokens.ts agrees too
      const ts = tokensTs(theme)[tokenName]
      if (ts.toLowerCase() !== hex.toLowerCase()) throw new Error(hex + ' vs tokens.ts ' + ts)
    })
  }
}

// --- legacy aliases stay equal to their token (spec 4.5) -----------------------
const aliasOf = {
  'dark-900': 'canvas', 'dark-800': 'surface', 'dark-700': 'surface-3', 'dark-600': 'line-2',
  'text-base': 'ink', 'text-secondary': 'ink-2', 'surface-nav': 'canvas', 'border-nav': 'edge',
  'surface-nav-active': 'surface-3', 'text-nav-active': 'ink', 'text-nav-idle': 'ink-2',
  'rail-active': 'accent-ink', 'surface-bar': 'canvas', 'grid-line': 'line', 'axis-ink': 'ink-3',
  'sentiment-positive': 'pos', 'sentiment-neutral': 'neu', 'sentiment-negative': 'neg',
}
for (const theme of ['dark', 'light']) {
  for (const [alias, token] of Object.entries(aliasOf)) {
    check('alias --' + alias + ' = --' + token + ' (' + theme + ')', () => {
      if (cssTheme[theme][alias] !== cssTheme[theme][token]) {
        throw new Error(cssTheme[theme][alias] + ' vs ' + cssTheme[theme][token])
      }
    })
  }
}

// --- ENGINE_META ai_overview (spec 4.9) ----------------------------------------
check('ENGINE_META ai_overview is #1c7b5a', () => {
  const pc = read('src/lib/planConfig.ts')
  const m = pc.match(/ai_overview:\s*\{[^}]*chartColor:\s*'(#[0-9a-fA-F]{6})'/)
  if (!m || m[1].toLowerCase() !== '#1c7b5a') throw new Error('got ' + (m && m[1]))
})

console.log(passed + ' passed, ' + failed + ' failed')
process.exit(failed ? 1 : 0)
