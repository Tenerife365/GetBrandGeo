/**
 * "Copy as AI prompt": the one builder for a Fix This item's agent-ready
 * prompt. Spec: docs/arch/fix-states.md section 11.
 *
 * Pure (no React, no Supabase). The AI Visibility page calls it for the
 * clipboard, and MCP stage 2 will require this same file through esbuild (as
 * mcp-server.js already does for competitorFilter.ts), so the text an agent
 * reads over MCP is byte-identical to the text a person copies. Do not keep a
 * second copy of any sentence below anywhere else.
 *
 * Rules the output must keep (pinned by tests/fix_prompt.test.js):
 *   - stands alone: no reference to a screen, a card or "above" outside itself;
 *   - no euro costs, plan names or internal ids (client, prompt, fix ids);
 *   - no em or en dash, even when a client's own prompt text carries one;
 *   - claims only what BrandGEO measured: it never read the client's site, so
 *     it never says a page is missing, only that the engines did not connect
 *     the brand to the question.
 */

import { aggregateCompetitors, competitorKey } from './competitorFilter'

export type FixKind =
  | 'prompt_gap' | 'engine_missing' | 'engine_low' | 'visibility'
  | 'outranked' | 'consistency' | 'ranking'

export interface FixPromptCell {
  brand_mentioned: boolean
  brand_position: number | null
  checked_at?: string | null
  competitors_mentioned?: string | null
}

export interface FixPromptContext {
  brandName: string
  website?: string | null
  /** Human market label, e.g. "Romania". Omitted from the text when absent. */
  market?: string | null
  /** Active engines, display order. */
  engines: { id: string; label: string }[]
  /** Active prompts, display order. */
  prompts: { id: number; text: string }[]
  /** Latest successful answer per (prompt, engine), the page's own map. */
  results: ReadonlyMap<number, ReadonlyMap<string, FixPromptCell>>
}

export interface FixPromptItem {
  /** Stable fix id from fixStates.ts; only its prefix and parameter are read. */
  id: string
  title: string
  /** Display name of the rival, for outranked fixes. */
  competitor?: string | null
  /**
   * The rival's average rank as the card shows it, so the prompt repeats the
   * number the reader just saw. Computed here from the scope when absent.
   */
  competitorAvgRank?: number | null
}

export interface FixQuestion {
  text: string
  answers: number
  named: number
  /** Short qualifier printed after the question, e.g. "average rank #4.5". */
  note?: string
}

export interface FixEvidence {
  kind: FixKind
  engineId: string | null
  engineLabel: string | null
  /** Engines that answered within the scope, labels. */
  engines: string[]
  answers: number
  named: number
  /** Answers that left the brand out and named at least one other brand. */
  namedOther: number
  /** Up to five brands named instead, most named first. */
  namedInstead: string[]
  questions: FixQuestion[]
  /** How many questions matched before the list was cut to five. */
  questionsTotal: number
  /** Every active question in scope (answered or not), and how many meet the card's 60 percent consistency rule. */
  questionsAnswered: number
  questionsConsistent: number
  competitor: { name: string; avgRank: number | null } | null
  newestCheck: string | null
}

const MAX_QUESTIONS = 5
const MAX_NAMES = 5
const MAX_QUESTION_CHARS = 300

/**
 * How each engine answers, as BrandGEO collects it (collect-chatgpt.js uses
 * web search available but not forced, _collect.js grounds Gemini in Google
 * Search with an ungrounded fallback, routes Perplexity to sonar, gives Claude
 * the web_search tool with max_uses 1 (_collect.js callClaude: "Web search is
 * ON and must stay on"; ignore older comments that say otherwise), and reads
 * Google AI Mode from Google's own results). Engines not listed get no
 * sentence rather than a guess. Re-check this table against _collect.js
 * whenever a collector changes.
 */
const ENGINE_HOW: Record<string, string> = {
  chatgpt: 'ChatGPT can search the web when it answers these questions, so a page that answers the question directly and mentions on sites it can find are what change its answer.',
  gemini: 'Gemini usually grounds its answers in Google Search results, so the page has to be indexed by Google and be a strong result for the question.',
  google_ai: 'Google AI Mode builds its answer from Google Search results, so the page has to be indexed by Google and be a strong result for the question.',
  perplexity: 'Perplexity searches the web for its answers and cites its sources, so pages it can find and cite are what change its answer.',
  claude: 'Claude can run a web search when it answers these questions and otherwise relies on what it learned in training, so it helps to have both a page that answers the question directly and mentions on widely published, trusted sites.',
}

/** En and em dash, built from char codes so no literal dash sits in source. */
const DASHES = new RegExp('[' + String.fromCharCode(0x2013, 0x2014) + ']', 'g')

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July',
  'August', 'September', 'October', 'November', 'December']

/** Folds whitespace and turns em and en dashes into a plain hyphen. */
export function clean(s: string | null | undefined, max = 500): string {
  const out = String(s ?? '').replace(DASHES, '-').replace(/\s+/g, ' ').trim()
  return out.length > max ? out.slice(0, max - 3).trimEnd() + '...' : out
}

/** UTC calendar date, the same in every browser: "6 November 2026". */
export function formatDay(iso: string | null | undefined): string | null {
  if (!iso) return null
  const t = Date.parse(iso)
  if (!Number.isFinite(t)) return null
  const d = new Date(t)
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`
}

export function fixKindOf(id: string): FixKind | null {
  if (id.startsWith('prompt_gap:')) return 'prompt_gap'
  if (id.startsWith('engine_missing:')) return 'engine_missing'
  if (id.startsWith('engine_low:')) return 'engine_low'
  if (id === 'visibility:all') return 'visibility'
  if (id.startsWith('outranked:')) return 'outranked'
  if (id === 'consistency') return 'consistency'
  if (id === 'ranking') return 'ranking'
  return null
}

function param(id: string): string {
  const i = id.indexOf(':')
  return i < 0 ? '' : id.slice(i + 1)
}

function otherBrandKeys(raw: string | null | undefined, brandKey: string): string[] {
  if (!raw) return []
  try {
    const arr = JSON.parse(raw)
    if (!Array.isArray(arr)) return []
    return arr
      .map(x => (x && typeof x === 'object' ? (x as { name?: unknown }).name : x))
      .filter((n): n is string => typeof n === 'string')
      .map(n => competitorKey(n))
      .filter(k => k && k !== brandKey)
  } catch {
    return []
  }
}

/** competitorFilter's sentinel for a name found in prose, not in a ranked list. */
const PROSE_POS = 99

/**
 * The rival's position in one answer: a number when ranked, null when named in
 * prose only, undefined when not named at all.
 */
function rivalPosIn(raw: string | null | undefined, rivalKey: string): number | null | undefined {
  if (!raw) return undefined
  try {
    const arr = JSON.parse(raw)
    if (!Array.isArray(arr)) return undefined
    let found: number | null | undefined
    for (const x of arr) {
      const name = x && typeof x === 'object' ? (x as { name?: unknown }).name : x
      if (typeof name !== 'string' || competitorKey(name) !== rivalKey) continue
      const pos = x && typeof x === 'object' ? (x as { pos?: unknown }).pos : undefined
      const n = typeof pos === 'number' && pos < PROSE_POS ? pos : null
      if (found === undefined || found === null || (n !== null && n < found)) found = n
    }
    return found
  } catch {
    return undefined
  }
}

function plural(n: number, one: string, many: string): string {
  return `${n} ${n === 1 ? one : many}`
}

/** The evidence for one fix, from the same cell map the page renders. */
export function buildFixEvidence(item: FixPromptItem, ctx: FixPromptContext): FixEvidence | null {
  const kind = fixKindOf(item.id)
  if (!kind) return null
  const brandKey = competitorKey(ctx.brandName)
  const p = param(item.id)

  const engineId = kind === 'engine_missing' || kind === 'engine_low' ? p : null
  const engineList = engineId ? ctx.engines.filter(e => e.id === engineId) : ctx.engines
  const promptId = kind === 'prompt_gap' ? Number(p) : null
  const promptList = promptId !== null ? ctx.prompts.filter(q => q.id === promptId) : ctx.prompts
  // A per-prompt fix whose prompt is no longer active has nothing to say.
  if (kind === 'prompt_gap' && promptList.length === 0) return null

  type Row = FixPromptCell & { prompt_id: number; llm: string }
  const rows: Row[] = []
  promptList.forEach(q => engineList.forEach(e => {
    const c = ctx.results.get(q.id)?.get(e.id)
    if (c) rows.push({ ...c, prompt_id: q.id, llm: e.id })
  }))

  const answered = new Set(rows.map(r => r.llm))
  const absentRows = rows.filter(r => !r.brand_mentioned)
  const namedInstead = aggregateCompetitors(absentRows, 20)
    .filter(c => competitorKey(c.name) !== brandKey)
    .slice(0, MAX_NAMES)
    .map(c => clean(c.name, 80))
  let newestCheck: string | null = null
  rows.forEach(r => { if (r.checked_at && (!newestCheck || r.checked_at > newestCheck)) newestCheck = r.checked_at })

  // Per-question view, in prompt order. avgRank is the brand's mean position
  // where an engine ranked it: the same thing the card's ranking score
  // (aiVisibilityScore.ts knowledge) is built from.
  const perQuestionAll = promptList.map(q => {
    const qRows = rows.filter(r => r.prompt_id === q.id)
    const ranks = qRows.filter(r => r.brand_mentioned && r.brand_position).map(r => r.brand_position as number)
    return {
      q,
      rows: qRows,
      answers: qRows.length,
      named: qRows.filter(r => r.brand_mentioned).length,
      avgRank: ranks.length ? Math.round((ranks.reduce((a, b) => a + b, 0) / ranks.length) * 10) / 10 : null,
    }
  })
  const perQuestion = perQuestionAll.filter(x => x.answers > 0)
  const share = (x: { named: number; answers: number }) => x.named / x.answers

  let competitor: FixEvidence['competitor'] = null
  let picked: typeof perQuestionAll = perQuestion
  let noteOf: (x: (typeof perQuestionAll)[number]) => string | undefined = () => undefined
  const namedNote = (x: { named: number; answers: number }) => `named in ${x.named} of ${plural(x.answers, 'answer', 'answers')}`
  if (kind === 'prompt_gap') {
    // Always the one question, even before it has answers.
    picked = perQuestionAll
  } else if (kind === 'outranked') {
    const rivalKey = competitorKey(item.competitor ?? p) || p
    const agg = aggregateCompetitors(rows, 50).find(c => competitorKey(c.name) === rivalKey)
    competitor = {
      name: clean(item.competitor ?? agg?.name ?? p, 80),
      avgRank: item.competitorAvgRank !== undefined ? item.competitorAvgRank : (agg?.avgPos ?? null),
    }
    // A question counts when, in at least one answer, the rival was named and
    // the brand was not, or the rival was ranked above the brand.
    const took = (r: Row) => {
      const rp = rivalPosIn(r.competitors_mentioned, rivalKey)
      if (rp === undefined) return false
      if (!r.brand_mentioned) return true
      return rp !== null && rp < PROSE_POS && !!r.brand_position && rp < r.brand_position
    }
    picked = perQuestion.filter(x => x.rows.some(took))
  } else if (kind === 'ranking') {
    picked = perQuestion.filter(x => x.avgRank !== null && x.avgRank > 3)
      .sort((a, b) => (b.avgRank ?? 0) - (a.avgRank ?? 0))
    noteOf = x => `average rank #${x.avgRank}`
  } else if (kind === 'consistency') {
    // The card's rule: a question is consistent when at least 60 percent of
    // the engines that answered it name the brand, over EVERY active prompt,
    // so a question with no answer yet counts as not consistent
    // (aiVisibilityScore.ts consistency).
    const shareAll = (x: { named: number; answers: number }) => (x.answers ? x.named / x.answers : 0)
    picked = perQuestionAll.filter(x => x.answers === 0 || share(x) < 0.6)
      .sort((a, b) => (a.answers === 0 ? 1 : 0) - (b.answers === 0 ? 1 : 0) || shareAll(a) - shareAll(b))
    noteOf = x => (x.answers === 0 ? 'no answer yet' : namedNote(x))
  } else if (kind === 'visibility') {
    picked = perQuestion.filter(x => x.named < x.answers).sort((a, b) => share(a) - share(b))
    noteOf = namedNote
  } else {
    picked = perQuestion.filter(x => x.named === 0)
  }

  return {
    kind,
    engineId,
    engineLabel: engineId ? (engineList[0]?.label ?? engineId) : null,
    engines: engineList.filter(e => answered.has(e.id)).map(e => e.label),
    answers: rows.length,
    named: rows.filter(r => r.brand_mentioned).length,
    namedOther: absentRows.filter(r => otherBrandKeys(r.competitors_mentioned, brandKey).length > 0).length,
    namedInstead,
    questions: picked.slice(0, MAX_QUESTIONS).map(x => ({
      text: clean(x.q.text, MAX_QUESTION_CHARS),
      answers: x.answers,
      named: x.named,
      note: noteOf(x),
    })),
    questionsTotal: picked.length,
    questionsAnswered: perQuestionAll.length,
    questionsConsistent: perQuestion.filter(x => share(x) >= 0.6).length,
    competitor,
    newestCheck,
  }
}

function list(items: string[]): string {
  if (items.length <= 1) return items.join('')
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`
}

/** The full, self-contained prompt for one fix. */
export function buildFixPrompt(item: FixPromptItem, ctx: FixPromptContext): string | null {
  const ev = buildFixEvidence(item, ctx)
  if (!ev) return null
  const brand = clean(ctx.brandName, 120) || 'the brand'
  const site = clean(ctx.website, 200)
  const siteRef = site || `${brand}'s website`
  const market = clean(ctx.market, 80)
  const engines = ev.engines.length ? list(ev.engines) : 'the AI engines checked'
  const day = formatDay(ev.newestCheck)
  const out: string[] = []
  const add = (...lines: string[]) => out.push(...lines)
  // When no question qualifies for the list, nothing may point "above"
  // (fix-prompt review X2): every reference falls back to the brand's own
  // buyer questions.
  const listed = ev.kind === 'prompt_gap' || ev.questions.length > 0
  const eachQ = listed ? 'For each question above' : `For each buyer question ${brand} wants to be named for`
  const theQs = listed ? 'the questions above' : `the buyer questions ${brand} wants to be named for`

  add(`# BrandGEO fix: ${clean(item.title, 200)}`, '')

  add('## Your role',
    `You are a senior content and generative engine optimization (GEO) specialist working for ${brand}. Your goal is to get ${brand} named when AI assistants such as ChatGPT, Gemini and Claude answer ${ev.kind === 'prompt_gap' ? 'the buyer question below' : listed ? 'the buyer questions below' : `the buyer questions ${brand} wants to be named for`}. Work only from true facts about ${brand}. When you need a fact you do not have, ask me for it instead of guessing.`,
    '')

  add('## The brand', `- Name: ${brand}`)
  if (site) add(`- Website: ${site}`)
  if (market) add(`- Market: ${market}`)
  add('')

  add('## What BrandGEO measured')
  const q0 = ev.questions[0]
  switch (ev.kind) {
    case 'prompt_gap':
      add(`- Buyer question: "${q0?.text ?? ''}"`,
        `- Engines checked: ${engines}`,
        ev.answers > 0
          ? `- Result: ${brand} was named in ${ev.named} of ${plural(ev.answers, 'answer', 'answers')}.`
          : `- Result: no engine has answered this question yet.`)
      break
    case 'engine_missing':
    case 'engine_low':
      add(`- Engine: ${ev.engineLabel}`,
        `- Result: ${brand} was named in ${ev.named} of ${plural(ev.answers, `${ev.engineLabel} answer`, `${ev.engineLabel} answers`)}.`)
      break
    case 'visibility':
      add(`- Engines checked: ${engines}`,
        `- Result: ${brand} was named in ${ev.named} of ${plural(ev.answers, 'answer', 'answers')} across these engines.`)
      break
    case 'outranked':
      add(`- Engines checked: ${engines}`,
        `- Competitor: ${ev.competitor?.name ?? ''}${ev.competitor?.avgRank != null ? `, ranked #${ev.competitor.avgRank} on average when an engine lists it` : ''}`,
        `- Result: ${brand} was named in ${ev.named} of ${plural(ev.answers, 'answer', 'answers')}.${ev.questionsTotal > 0 ? ` On ${plural(ev.questionsTotal, 'question', 'questions')}, at least one answer named ${ev.competitor?.name ?? 'the competitor'} and left ${brand} out, or ranked ${ev.competitor?.name ?? 'the competitor'} above ${brand}.` : ''}`)
      break
    case 'consistency':
      add(`- Engines checked: ${engines}`,
        `- Result: on ${ev.questionsConsistent} of ${plural(ev.questionsAnswered, 'question', 'questions')}, at least 60 percent of the engines that answered named ${brand}. Overall ${brand} was named in ${ev.named} of ${plural(ev.answers, 'answer', 'answers')}.`)
      break
    case 'ranking':
      add(`- Engines checked: ${engines}`,
        `- Result: ${brand} was named in ${ev.named} of ${plural(ev.answers, 'answer', 'answers')}. On ${plural(ev.questionsTotal, 'question', 'questions')}, its average rank where engines ranked it was below the top three.`)
      break
  }
  if (ev.kind !== 'ranking' && ev.namedOther > 0) {
    add(`- ${ev.namedOther} of the answers that left ${brand} out named another brand instead.`)
  }
  if (ev.namedInstead.length) add(`- Brands named instead: ${list(ev.namedInstead)}`)
  if (day) add(`- Newest answer checked: ${day}`)

  if (ev.kind !== 'prompt_gap' && ev.questions.length) {
    const rival = ev.competitor?.name ?? 'the competitor'
    const head = ev.kind === 'ranking'
      ? `- Questions where ${brand} ranked below the top three on average:`
      : ev.kind === 'outranked'
        ? `- Questions where ${rival} was named instead of ${brand}, or ranked above it:`
        : ev.kind === 'consistency'
          ? `- Questions where fewer than 60 percent of the engines that answered named ${brand}:`
          : ev.kind === 'visibility'
            ? `- Questions where engines named ${brand} least:`
            : `- Questions where ${ev.engineLabel} did not name ${brand}:`
    add(head)
    ev.questions.forEach(q => add(q.note ? `  - "${q.text}" (${q.note})` : `  - "${q.text}"`))
    if (ev.questionsTotal > ev.questions.length) {
      add(`  - and ${plural(ev.questionsTotal - ev.questions.length, 'more question', 'more questions')}`)
    }
  }
  add('')

  add('## Why this fix')
  const signals = `AI engines name the brands they can connect to a question: pages that answer it in plain words, and trusted sites that name the brand for it.`
  switch (ev.kind) {
    case 'prompt_gap':
      add(`${signals} The engines did not connect ${brand} to this question${ev.namedInstead.length ? ' and named other brands instead' : ''}. A page that answers the question directly, plus one trusted outside reference, gives them both signals.`)
      break
    case 'engine_missing':
    case 'engine_low': {
      const how = ev.engineId ? ENGINE_HOW[ev.engineId] : undefined
      const today = ev.kind === 'engine_missing'
        ? `${ev.engineLabel} rarely or never makes that connection for ${brand} today.`
        : `${ev.engineLabel} makes that connection for ${brand} on only some questions today.`
      add(`${signals} ${today}${how ? ` ${how}` : ''}`)
      break
    }
    case 'visibility':
      add(`${signals} Across every engine checked, they rarely make that connection for ${brand} today, so the work starts with the questions buyers ask most.`)
      break
    case 'outranked':
      add(`Engines tend to name and rank first the brands they can describe with confidence: clear pages that say what the brand does, for whom and why, and trusted outside sources that confirm it. ${listed ? `On the questions listed above, the engines found more of that for ${ev.competitor?.name ?? 'the competitor'} than for ${brand}.` : `${ev.competitor?.name ?? 'The competitor'} ranks well in the answers where both brands appear, so the work is to make ${brand} at least as easy to describe.`}`)
      break
    case 'consistency':
      add(`${signals} ${brand} is connected to some of its buyer questions and not to others, which usually means the business is described well for some services or places and not at all for the rest.`)
      break
    case 'ranking':
      add(`When engines name ${brand}, they often place it below other brands. Engines tend to put first the brand whose pages answer the question most directly and whose facts they can quote: what it does, for whom, where, and with what proof.`)
      break
  }
  add('')

  add('## Steps')
  const steps: string[] = []
  const pageStep = `Write or rewrite the page so its first two or three sentences answer the question directly, ${brand} is named in the title and the H1, and it says plainly what ${brand} offers, for whom and where.`
  const factsStep = `Add the facts a buyer compares on (services, area served, prices or price ranges, years in business, named clients, certifications) only where I confirm them.`
  const schemaStep = `Add a short FAQ with the follow-up questions a buyer asks next, plus FAQPage and Organization structured data (schema.org) that match the visible text.`
  const indexStep = `Make sure the page can be indexed: not blocked by robots.txt or a noindex tag, and listed in the sitemap.`
  const outreach = (many: boolean) => many
    ? `Name up to three trusted publications, directories or industry associations in this field that could reference ${brand} for these questions, say why each fits, and draft a short, factual pitch to each.`
    : `Name one trusted publication, directory or industry association in this field that could reference ${brand} for this question, say why it fits, and draft a short, factual pitch to it.`
  switch (ev.kind) {
    case 'prompt_gap':
      steps.push(
        `Check whether ${siteRef} already has a page that answers "${q0?.text ?? ''}" directly. If it does, improve that page instead of adding a second one.`,
        pageStep, factsStep, schemaStep,
        `Link the page from the main service page and from the home page or main navigation.`,
        indexStep, outreach(false))
      break
    case 'outranked':
      steps.push(
        `Look at how ${ev.competitor?.name ?? 'the competitor'} presents itself publicly for ${theQs}, and list the facts it states that ${brand} does not state anywhere yet.`,
        `${eachQ}, check whether a page on ${siteRef} answers it directly; improve an existing page rather than adding a second one on the same question.`,
        `Draft a fair comparison page, "${brand} vs ${ev.competitor?.name ?? 'the competitor'}", covering differences, pricing and the buyers each fits best, using only facts I confirm about both.`,
        factsStep,
        `Ask me which existing clients could agree to a short case study published on ${siteRef}, and draft the request.`,
        indexStep, outreach(true))
      break
    case 'ranking':
      steps.push(
        `${eachQ}, find the page on ${siteRef} that should answer it and move the direct answer and ${brand}'s key facts to the top.`,
        factsStep, schemaStep,
        `Link these pages to each other and to one main page on the core service, so the topic reads as one connected body of work.`,
        outreach(true))
      break
    default:
      steps.push(
        `${eachQ}, check whether a page on ${siteRef} answers it directly. Improve an existing page rather than adding a second one on the same question.`,
        `Where none does, draft one. ${pageStep}`,
        factsStep, schemaStep,
        `Link the pages from the main service page.`,
        indexStep, outreach(true))
  }
  steps.forEach((s, i) => add(`${i + 1}. ${s}`))
  add('')

  add('## Rules',
    `- Use only true facts about ${brand}. If a fact is missing, ask me instead of inventing it.`,
    `- Never invent reviews, testimonials, statistics, awards, prices, clients or credentials.`,
    `- Write the brand name exactly as "${brand}".`,
    `- Do not criticize other brands; describe ${brand} on its own merits.`,
    `- Write in the language buyers use when they ask these questions.`,
    `- Name only publications, directories and sources you can link to. If you cannot browse the web, say so and tell me what to look up instead of naming outlets or describing other brands from memory.`,
    '')

  // What the re-check covers and compares is the fix's own metric
  // (fixStates.ts metricKeys, measureFix, evaluateFix): every tracked question
  // in scope, not only the ones listed, re-measured over answers collected
  // after the wait, against the baseline taken when the fix is marked done.
  const scope = ev.kind === 'prompt_gap'
    ? `this question on ${engines}`
    : ev.kind === 'engine_missing' || ev.kind === 'engine_low'
      ? `every tracked question on ${ev.engineLabel}`
      : `every tracked question on ${engines}`
  const measure = ev.kind === 'outranked'
    ? `${brand}'s share of the new answers that name ${brand} or ${ev.competitor?.name ?? 'the competitor'}`
    : ev.kind === 'consistency'
      ? `the consistency score shown on the BrandGEO dashboard (how evenly ${brand} is named across its questions) over the new answers`
      : ev.kind === 'ranking'
        ? `the ranking score shown on the BrandGEO dashboard (how high ${brand} is placed when it is named) over the new answers`
        : `what share of the new answers name ${brand}`
  const countKind = ev.kind === 'prompt_gap' || ev.kind === 'engine_missing' || ev.kind === 'engine_low' || ev.kind === 'visibility'
  add('## Done when',
    `- The page or pages are live at public URLs, linked from the main service page, and the outreach is drafted.`,
    `- Then mark this fix as done in BrandGEO. Starting 7 days later, once at least 80 percent of the answers for ${scope} have been collected again, BrandGEO measures ${measure} and compares it with the number at the moment you marked the fix done.${countKind && ev.answers > 0 ? ` Right now ${brand} is named in ${ev.named} of ${plural(ev.answers, 'answer', 'answers')}.` : ''}`)
  add('')

  add('## Report back',
    `- The URL of each page, or the full draft if it is not published yet.`,
    `- The title and H1 of each page.`,
    `- Every fact you used about ${brand} and where it came from.`,
    `- The outlets you suggest and the pitch for each.`,
    `- Any fact you still need from me.`)

  return out.join('\n')
}
