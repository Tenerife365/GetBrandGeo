/**
 * fix_prompt.test.js - pins the "Copy as AI prompt" text built by
 * src/lib/fixPrompt.ts (spec docs/arch/fix-states.md section 11). The same
 * builder will feed MCP stage 2, so any change to the wording must show up
 * here as a deliberate diff.
 *
 * Run: `node tests/fix_prompt.test.js` from brandgeo-dashboard/ (exits non-zero
 * on failure). `node tests/fix_prompt.test.js --print` prints every fixture's
 * output, which is how the pinned strings below were produced and reviewed.
 *
 * Fixtures: the brand is BrandGEO itself (Constantin's own example); every
 * other brand name is fictional.
 */
require('./helpers/ts_require')
const assert = require('assert')
const path = require('path')
const F = require(path.join(__dirname, '..', 'src', 'lib', 'fixPrompt.ts'))

let passed = 0
let failed = 0
function test(name, fn) {
  try { fn(); passed++; console.log('  ok   ' + name) } catch (e) {
    failed++
    console.log('  FAIL ' + name + '\n       ' + (e && e.message ? e.message.split('\n').join('\n       ') : e))
  }
}

// ── Fixtures ──────────────────────────────────────────────────────────────────

const ENGINES = [
  { id: 'chatgpt', label: 'ChatGPT' }, { id: 'gemini', label: 'Gemini' },
  { id: 'claude', label: 'Claude' }, { id: 'perplexity', label: 'Perplexity' },
  { id: 'google_ai', label: 'Google AI Mode' }, { id: 'grok', label: 'Grok' },
  { id: 'deepseek', label: 'DeepSeek' },
]
const comps = (...names) => JSON.stringify(names.map((name, i) => ({ pos: i + 1, name })))
const cell = (mentioned, day, competitors, position) => ({
  brand_mentioned: mentioned,
  brand_position: mentioned ? (position ?? 2) : null,
  checked_at: `2026-11-0${day}T08:30:00Z`,
  competitors_mentioned: competitors ?? null,
})
function results(spec) {
  const m = new Map()
  spec.forEach(([pid, eid, c]) => {
    if (!m.has(pid)) m.set(pid, new Map())
    m.get(pid).set(eid, c)
  })
  return m
}

const Q1 = 'What are the best tools to monitor my brand on AI chatbots like ChatGPT and Gemini?'
const EM = String.fromCharCode(0x2014)
const ANY_DASH = new RegExp('[' + String.fromCharCode(0x2013, 0x2014) + ']')
const Q2 = 'How do I check if ChatGPT recommends my company ' + EM + ' and fix it?'
const Q3 = 'Which GEO platform tracks brand mentions in Google AI Mode?'

// Constantin's example: 7 answers, none name the brand, all name another brand.
const exampleSpec = ENGINES.map((e, i) => [101, e.id, cell(false, (i % 5) + 1,
  i % 2 ? comps('Peak Monitor', 'Signal Desk') : comps('Signal Desk', 'Lumen Watch', 'Peak Monitor'))])

const ctx = {
  brandName: 'BrandGEO',
  website: 'https://getbrandgeo.com',
  market: 'Worldwide',
  engines: ENGINES,
  prompts: [{ id: 101, text: Q1 }, { id: 102, text: Q2 }, { id: 103, text: Q3 }],
  results: results([
    ...exampleSpec,
    [102, 'chatgpt', cell(true, 4, comps('Signal Desk'), 2)],
    [102, 'gemini', cell(false, 4, comps('Signal Desk'))],
    [102, 'claude', cell(false, 3, null)],
    [103, 'chatgpt', cell(true, 4, comps('Peak Monitor', 'Signal Desk', 'Lumen Watch', 'Orbit Scan'), 5)],
    [103, 'gemini', cell(true, 4, comps('Peak Monitor'), 4)],
    [103, 'claude', cell(false, 3, comps('Peak Monitor'))],
  ]),
}

const ITEMS = {
  gap: { id: 'prompt_gap:101', title: `Not named for: ${Q1}` },
  claude: { id: 'engine_missing:claude', title: 'Not found in Claude' },
  outranked: { id: 'outranked:peak monitor', title: 'Outranked by Peak Monitor (avg #1)', competitor: 'Peak Monitor' },
  ranking: { id: 'ranking', title: 'Improve ranking position' },
  all: { id: 'visibility:all', title: 'Named in under 25% of answers on every engine' },
  consistency: { id: 'consistency', title: 'Inconsistent cross-prompt coverage' },
  low: { id: 'engine_low:chatgpt', title: 'Low visibility in ChatGPT (33%)' },
}

if (process.argv.includes('--print')) {
  Object.entries(ITEMS).forEach(([k, item]) => {
    console.log(`\n===== ${k} =====\n` + F.buildFixPrompt(item, ctx))
  })
  process.exit(0)
}

// ── Pinned output: Constantin's example ──────────────────────────────────────

const EXPECTED_GAP = [
  "# BrandGEO fix: Not named for: What are the best tools to monitor my brand on AI chatbots like ChatGPT and Gemini?",
  "",
  "## Your role",
  "You are a senior content and generative engine optimization (GEO) specialist working for BrandGEO. Your goal is to get BrandGEO named when AI assistants such as ChatGPT, Gemini and Claude answer the buyer question below. Work only from true facts about BrandGEO. When you need a fact you do not have, ask me for it instead of guessing.",
  "",
  "## The brand",
  "- Name: BrandGEO",
  "- Website: https://getbrandgeo.com",
  "- Market: Worldwide",
  "",
  "## What BrandGEO measured",
  "- Buyer question: \"What are the best tools to monitor my brand on AI chatbots like ChatGPT and Gemini?\"",
  "- Engines checked: ChatGPT, Gemini, Claude, Perplexity, Google AI Mode, Grok and DeepSeek",
  "- Result: BrandGEO was named in 0 of 7 answers.",
  "- 7 of the answers that left BrandGEO out named another brand instead.",
  "- Brands named instead: Signal Desk, Peak Monitor and Lumen Watch",
  "- Newest answer checked: 5 November 2026",
  "",
  "## Why this fix",
  "AI engines name the brands they can connect to a question: pages that answer it in plain words, and trusted sites that name the brand for it. The engines did not connect BrandGEO to this question and named other brands instead. A page that answers the question directly, plus one trusted outside reference, gives them both signals.",
  "",
  "## Steps",
  "1. Check whether https://getbrandgeo.com already has a page that answers \"What are the best tools to monitor my brand on AI chatbots like ChatGPT and Gemini?\" directly. If it does, improve that page instead of adding a second one.",
  "2. Write or rewrite the page so its first two or three sentences answer the question directly, BrandGEO is named in the title and the H1, and it says plainly what BrandGEO offers, for whom and where.",
  "3. Add the facts a buyer compares on (services, area served, prices or price ranges, years in business, named clients, certifications) only where I confirm them.",
  "4. Add a short FAQ with the follow-up questions a buyer asks next, plus FAQPage and Organization structured data (schema.org) that match the visible text.",
  "5. Link the page from the main service page and from the home page or main navigation.",
  "6. Make sure the page can be indexed: not blocked by robots.txt or a noindex tag, and listed in the sitemap.",
  "7. Name one trusted publication, directory or industry association in this field that could reference BrandGEO for this question, say why it fits, and draft a short, factual pitch to it.",
  "",
  "## Rules",
  "- Use only true facts about BrandGEO. If a fact is missing, ask me instead of inventing it.",
  "- Never invent reviews, testimonials, statistics, awards, prices, clients or credentials.",
  "- Write the brand name exactly as \"BrandGEO\".",
  "- Do not criticize other brands; describe BrandGEO on its own merits.",
  "- Write in the language buyers use when they ask these questions.",
  "- Name only publications, directories and sources you can link to. If you cannot browse the web, say so and tell me what to look up instead of naming outlets or describing other brands from memory.",
  "",
  "## Done when",
  "- The page or pages are live at public URLs, linked from the main service page, and the outreach is drafted.",
  "- Then mark this fix as done in BrandGEO. Starting 7 days later, once at least 80 percent of the answers for this question on ChatGPT, Gemini, Claude, Perplexity, Google AI Mode, Grok and DeepSeek have been collected again, BrandGEO measures what share of the new answers name BrandGEO and compares it with the number at the moment you marked the fix done. Right now BrandGEO is named in 0 of 7 answers.",
  "",
  "## Report back",
  "- The URL of each page, or the full draft if it is not published yet.",
  "- The title and H1 of each page.",
  "- Every fact you used about BrandGEO and where it came from.",
  "- The outlets you suggest and the pitch for each.",
  "- Any fact you still need from me.",
].join('\n')

test('Constantin example: prompt gap text is pinned byte for byte', () => {
  assert.strictEqual(F.buildFixPrompt(ITEMS.gap, ctx), EXPECTED_GAP)
})

// ── Structure and content rules, every kind ──────────────────────────────────

const ALL = Object.values(ITEMS).map(item => [item.id, F.buildFixPrompt(item, ctx)])

test('every kind renders the nine blocks in order', () => {
  const heads = ['# BrandGEO fix: ', '## Your role', '## The brand', '## What BrandGEO measured',
    '## Why this fix', '## Steps', '## Rules', '## Done when', '## Report back']
  ALL.forEach(([id, text]) => {
    let at = -1
    heads.forEach(h => {
      const i = text.indexOf(h, at + 1)
      assert.ok(i > at, `${id}: "${h}" missing or out of order`)
      at = i
    })
  })
})

test('no em or en dash in any output, even from a prompt that carries one', () => {
  ALL.forEach(([id, text]) => assert.ok(!ANY_DASH.test(text), id))
  // Positive control: the fixture really does carry an em dash in Q2.
  assert.ok(Q2.includes(EM))
  assert.ok(ALL.find(([id]) => id === 'engine_missing:claude')[1].includes('my company - and fix it?'))
})

test('no internal ids, plan names or euro amounts', () => {
  ALL.forEach(([id, text]) => {
    assert.ok(!/prompt_gap|engine_missing|engine_low|visibility:all|outranked:|client_id|fix_id/.test(text), `${id} leaks an id`)
    assert.ok(!/\b(101|102|103)\b/.test(text), `${id} leaks a prompt id`)
    assert.ok(!/EUR|€|Essentials|Growth|Radar|Managed|Enterprise|Free plan/.test(text), `${id} leaks plan or cost`)
  })
})

test('the brand is never listed as a brand named instead of itself', () => {
  const withBrand = { ...ctx, results: results([[101, 'chatgpt', cell(false, 1, comps('BrandGEO', 'Peak Monitor'))]]) }
  const text = F.buildFixPrompt(ITEMS.gap, withBrand)
  assert.ok(text.includes('- Brands named instead: Peak Monitor\n'), text)
})

test('review B1: Claude is described as searching the web, as _collect.js runs it', () => {
  const t = ALL.find(([id]) => id === 'engine_missing:claude')[1]
  assert.ok(t.includes('Claude can run a web search when it answers'), t)
  assert.ok(!/without searching|model update/.test(t), 'no claim that Claude answers from training only')
})

test('engine fix: unknown engines get no mechanism sentence; missing vs low wording (review L5)', () => {
  const grok = F.buildFixPrompt({ id: 'engine_missing:grok', title: 'Not found in Grok' }, ctx)
  assert.ok(grok.includes('Grok rarely or never makes that connection for BrandGEO today.\n'), grok)
  const low = ALL.find(([id]) => id === 'engine_low:chatgpt')[1]
  assert.ok(low.includes('ChatGPT makes that connection for BrandGEO on only some questions today.'), low)
})

// Review repros, fictional data. Five questions, five engines.
const E5 = ENGINES.slice(0, 5)
const P5 = [1, 2, 3, 4, 5].map(i => ({ id: 200 + i, text: `Fictional question number ${i}?` }))
const ctx5 = spec => ({ ...ctx, engines: E5, prompts: P5, results: results(spec) })

test('review M1: consistency lists the questions under the 60 percent rule', () => {
  const spec = []
  P5.forEach(q => E5.forEach((e, j) => spec.push([q.id, e.id, cell(j === 0, 4, comps('Peak Monitor'))])))
  const t = F.buildFixPrompt(ITEMS.consistency, ctx5(spec))
  assert.ok(t.includes('on 0 of 5 questions, at least 60 percent of the engines that answered named BrandGEO'), t)
  assert.ok(t.includes('"Fictional question number 1?" (named in 1 of 5 answers)'), t)
  const all = F.buildFixPrompt(ITEMS.all, ctx5(spec))
  assert.ok(all.includes('- Questions where engines named BrandGEO least:'), all)
})

test('review M2: ranking uses the average rank, not the best one', () => {
  const spec = []
  P5.forEach(q => E5.forEach((e, j) => spec.push([q.id, e.id, cell(true, 4, comps('Peak Monitor'), j === 0 ? 1 : 5)])))
  const t = F.buildFixPrompt(ITEMS.ranking, ctx5(spec))
  assert.ok(t.includes('On 5 questions, its average rank where engines ranked it was below the top three.'), t)
  assert.ok(t.includes('"Fictional question number 1?" (average rank #4.2)'), t)
})

test('review M3: outranked lists a question where the rival is ranked above the brand', () => {
  const spec = []
  P5.forEach(q => E5.forEach(e => spec.push([q.id, e.id, cell(true, 4, comps('Peak Monitor', 'Signal Desk', 'X'), 3)])))
  const t = F.buildFixPrompt(ITEMS.outranked, ctx5(spec))
  assert.ok(t.includes('On 5 questions, at least one answer named Peak Monitor and left BrandGEO out, or ranked Peak Monitor above BrandGEO.'), t)
  assert.ok(t.includes('"Fictional question number 1?"'), t)
})

test('review X1: consistency counts unanswered questions, as the card does', () => {
  const spec = E5.map(e => [201, e.id, cell(true, 4, comps('Peak Monitor'))])
  const t = F.buildFixPrompt(ITEMS.consistency, ctx5(spec))
  assert.ok(t.includes('on 1 of 5 questions, at least 60 percent'), t)
  assert.ok(t.includes('"Fictional question number 2?" (no answer yet)'), t)
})

test('review X2: an empty question list leaves no sentence pointing above', () => {
  const spec = [
    [201, 'chatgpt', cell(true, 4, comps('Peak Monitor'), 1)],
    [202, 'gemini', cell(false, 4, comps('Signal Desk'))],
  ]
  const t = F.buildFixPrompt(ITEMS.outranked, ctx5(spec))
  assert.ok(!/above/.test(t), t)
  assert.ok(!t.includes('On 0 questions'), t)
  assert.ok(t.includes('For each buyer question BrandGEO wants to be named for'), t)
})

test('review N3: a question with no answers says so instead of 0 of 0', () => {
  const t = F.buildFixPrompt({ id: 'prompt_gap:201', title: 'Not named for: q' }, ctx5([]))
  assert.ok(t.includes('- Result: no engine has answered this question yet.'), t)
  assert.ok(!t.includes('0 of 0'), t)
})

test('review L1: a question with no answers yet still prints its text', () => {
  const t = F.buildFixPrompt({ id: 'prompt_gap:201', title: 'Not named for: q' }, ctx5([]))
  assert.ok(t.includes('- Buyer question: "Fictional question number 1?"'), t)
})

test('review L3: rules forbid outlets that cannot be linked', () => {
  ALL.forEach(([id, text]) => assert.ok(text.includes('Name only publications, directories and sources you can link to.'), id))
})

test('outranked lists only questions the rival took from the brand', () => {
  const t = ALL.find(([id]) => id === 'outranked:peak monitor')[1]
  assert.ok(t.includes(`"${Q1}"`))
  assert.ok(t.includes(`"${Q3}"`), 'Claude named Peak Monitor and left BrandGEO out on Q3')
  assert.ok(!t.includes('my company'), 'Q2 never named Peak Monitor')
})

test('outranked repeats the rank the card shows when the caller passes it', () => {
  const t = F.buildFixPrompt({ ...ITEMS.outranked, competitorAvgRank: 1.3 }, ctx)
  assert.ok(t.includes('- Competitor: Peak Monitor, ranked #1.3 on average'), t)
  const none = F.buildFixPrompt({ ...ITEMS.outranked, competitorAvgRank: null }, ctx)
  assert.ok(none.includes('- Competitor: Peak Monitor\n'), none)
})

test('ranking lists questions below the top three on average, with the rank', () => {
  const t = ALL.find(([id]) => id === 'ranking')[1]
  assert.ok(t.includes(`"${Q3}" (average rank #4.5)`), t)
  assert.ok(!t.includes(Q1))
})

test('website and market lines are omitted when unknown', () => {
  const t = F.buildFixPrompt(ITEMS.gap, { ...ctx, website: null, market: null })
  assert.ok(!t.includes('- Website:') && !t.includes('- Market:'))
  assert.ok(t.includes("Check whether BrandGEO's website already has a page"))
})

test('dates are UTC and locale free', () => {
  assert.strictEqual(F.formatDay('2026-11-05T23:30:00Z'), '5 November 2026')
  assert.strictEqual(F.formatDay(null), null)
  assert.strictEqual(F.formatDay('not a date'), null)
})

test('an unknown fix id yields null so the caller can fall back', () => {
  assert.strictEqual(F.buildFixPrompt({ id: 'something_else', title: 'x' }, ctx), null)
})

test('a per-prompt fix whose prompt is gone yields null (the button falls back)', () => {
  assert.strictEqual(F.buildFixPrompt({ id: 'prompt_gap:999', title: 'Not named for: nothing' }, ctx), null)
})

test('an engine with no answers still renders without NaN, undefined or null', () => {
  const t = F.buildFixPrompt({ id: 'engine_missing:copilot', title: 'Not found in Copilot' }, ctx)
  assert.ok(t && !/NaN|undefined|null/.test(t), t)
})

console.log(`\n${passed} passed, ${failed} failed`)
if (failed) process.exit(1)
