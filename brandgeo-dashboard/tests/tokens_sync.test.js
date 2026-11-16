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

// --- glass layer tokens (glass-layer-2026-11-15.md) -----------------------------
// Each one is declared in both themes, the triplets are three 0..255 integers,
// and the brief's raw hex values appear nowhere in src/ outside index.css.
const GLASS_TOKENS = [
  'grad-start', 'grad-mid', 'grad-end', 'glow', 'glow-strength',
  'glass-fill-top', 'glass-fill-bottom', 'glass-solid', 'glass-border', 'glass-border-strong',
  'glass-highlight', 'glass-shadow', 'glass-tile', 'glass-well', 'glass-well-shadow',
  'glass-nav-top', 'glass-nav-bottom', 'aura-a', 'aura-b', 'row-hover',
]
const TRIPLETS = ['grad-start', 'grad-mid', 'grad-end', 'glow', 'glass-solid', 'row-hover']
for (const theme of ['dark', 'light']) {
  for (const name of GLASS_TOKENS) {
    check('glass token --' + name + ' declared in ' + theme, () => {
      if (!cssTheme[theme][name]) throw new Error('missing')
    })
  }
  for (const name of TRIPLETS) {
    check('glass token --' + name + ' is a triplet in ' + theme, () => {
      const v = cssTheme[theme][name]
      if (!/^\d{1,3} \d{1,3} \d{1,3}$/.test(v) || v.split(' ').some(n => +n > 255)) throw new Error('got ' + v)
    })
  }
}
check('tailwind maps grad-start, grad-mid, grad-end and glow', () => {
  const tw = read('tailwind.config.js')
  for (const t of ['--grad-start', '--grad-mid', '--grad-end', '--glow']) {
    if (!tw.includes('rgb(var(' + t + ') / <alpha-value>)')) throw new Error(t + ' not mapped')
  }
})
check('brief hex values live only in index.css', () => {
  const brief = /#(6366f1|a855f7|c084fc)\b/i
  const walk = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(d =>
    d.isDirectory() ? walk(path.join(dir, d.name)) : [path.join(dir, d.name)])
  // Older than the glass layer and not about it: the logo gradient and the
  // DeepSeek engine chart colour, which only happen to share a hex.
  const allowed = ['BrandGeoLogo.tsx', 'planConfig.ts']
  const hits = walk(path.join(__dirname, '..', 'src'))
    .filter(f => /\.(tsx?|css)$/.test(f) && !f.endsWith('index.css') && !allowed.includes(path.basename(f)))
    .filter(f => brief.test(fs.readFileSync(f, 'utf8')))
  if (hits.length) throw new Error(hits.map(f => path.relative(path.join(__dirname, '..'), f)).join(', '))
})

// --- tactile layer tokens (tactile-layer-2026-11-16.md) ---------------------------
// Same contract as the glass tokens: declared in both themes, triplets are
// triplets, and the 2026-11-16 brief's raw values live only in index.css.
const TACTILE_TOKENS = [
  'key-top', 'key-shade', 'key-highlight', 'keycap-top', 'keycap-bottom', 'keycap-highlight',
  'keycap-shade', 'keycap-drop', 'well-fill', 'well-border', 'well-shadow', 'pill-top',
  'pill-bottom', 'pill-shadow', 'led-highlight', 'dial-track', 'pressed-shadow',
]
const TACTILE_TRIPLETS = ['key-top', 'keycap-top', 'keycap-bottom', 'well-fill', 'pill-top', 'pill-bottom', 'dial-track']
for (const theme of ['dark', 'light']) {
  for (const name of TACTILE_TOKENS) {
    check('tactile token --' + name + ' declared in ' + theme, () => {
      if (!cssTheme[theme][name]) throw new Error('missing')
    })
  }
  for (const name of TACTILE_TRIPLETS) {
    check('tactile token --' + name + ' is a triplet in ' + theme, () => {
      const v = cssTheme[theme][name]
      if (!/^\d{1,3} \d{1,3} \d{1,3}$/.test(v) || v.split(' ').some(n => +n > 255)) throw new Error('got ' + v)
    })
  }
}
// White keycap text must clear 4.5:1 at the keycap's lightest stop.
const lum = trip => {
  const [r, g, b] = trip.split(' ').map(n => {
    const c = +n / 255
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
for (const theme of ['dark', 'light']) {
  for (const stop of ['key-top', 'accent-strong', 'accent-strong-hover']) {
    check('white on --' + stop + ' >= 4.5:1 (' + theme + ')', () => {
      const ratio = 1.05 / (lum(cssTheme[theme][stop]) + 0.05)
      if (ratio < 4.5) throw new Error(ratio.toFixed(2) + ':1')
    })
  }
}
check('tactile brief raw values live only in index.css', () => {
  // The brief's hex and rgb literals: the light keycap and well greys, the
  // dark well, the lighter indigo keycap stop, the slate shadow base and the
  // emerald glow of its #1 badge.
  // Comma or space separated, so rgb(79 70 229) and rgba(246, 246, 251, ..)
  // are caught as well as the hex spellings (review F2).
  const trip = t => t.split(' ').join('[,\\s]+')
  const brief = new RegExp('#(818cf8|ebeaf2|f1f2f7|4f46e5)\\b|\\brgba?\\(\\s*(' +
    ['6 8 15', '129 140 248', '79 70 229', '235 234 242', '241 242 247', '246 246 251',
     '15 23 42', '30 27 75', '16 185 129', '99 102 241'].map(trip).join('|') +
    ')\\b|\\b(6 8 15|129 140 248|235 234 242|241 242 247|246 246 251)\\b', 'i')
  const walk = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(d =>
    d.isDirectory() ? walk(path.join(dir, d.name)) : [path.join(dir, d.name)])
  const hits = walk(path.join(__dirname, '..', 'src'))
    .filter(f => /\.(tsx?|css)$/.test(f) && !f.endsWith('index.css'))
    .filter(f => brief.test(fs.readFileSync(f, 'utf8')))
  if (hits.length) throw new Error(hits.map(f => path.relative(path.join(__dirname, '..'), f)).join(', '))
})
// Button's utilities would win over a layered keycap class; see index.css.
// Every tactile class must open at depth 0, outside any @layer (review F3).
const cssNoComments = css.replace(/\/\*[\s\S]*?\*\//g, '')
const TACTILE_CLASSES = ['.tactile-btn-primary', '.tactile-btn-secondary', '.recessed-well', '.recessed-pill-active',
  '.seg-well[role="radiogroup"]', '.recessed-input', '.recessed-channel', '.recessed-squircle', '.led-dot', '.dial-face']
for (const cls of TACTILE_CLASSES) {
  check('tactile class ' + cls + ' is unlayered', () => {
    const at = cssNoComments.split('\n').map(l => l.startsWith(cls) && /^[ ,{]/.test(l.slice(cls.length))).indexOf(true)
    if (at < 0) throw new Error('not found at the start of a line')
    const before = cssNoComments.split('\n').slice(0, at).join('\n')
    const depth = [...before].reduce((d, ch) => d + (ch === '{' ? 1 : ch === '}' ? -1 : 0), 0)
    if (depth !== 0) throw new Error('nested at depth ' + depth)
  })
}
// The brief's Tailwind palette classes stay out of the files this layer
// touched (other pages already use palette classes, so the ban is scoped).
check('no brief palette classes in the tactile files', () => {
  const files = ['src/pages/AIVisibility.tsx', 'src/pages/Dashboard.tsx', 'src/components/GlowScoreDial.tsx', 'src/components/PromptResultCell.tsx', 'src/components/Layout.tsx']
  const hits = files.filter(f => /\b(from-indigo-500|via-violet-500|to-purple-400)\b|ring-pos-ink\/40/.test(read(f)))
  if (hits.length) throw new Error(hits.join(', '))
})
// The selected segment and the search field are told apart from the well by
// their --edge border alone, so that pair must clear 3:1 (a11y review).
for (const theme of ['dark', 'light']) {
  check('--edge on --well-fill >= 3:1 (' + theme + ')', () => {
    const a = lum(cssTheme[theme]['edge']), b = lum(cssTheme[theme]['well-fill'])
    const r = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)
    if (r < 3) throw new Error(r.toFixed(2) + ':1')
  })
}

console.log(passed + ' passed, ' + failed + ' failed')
process.exit(failed ? 1 : 0)
