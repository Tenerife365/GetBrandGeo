/**
 * audit_prompt_reproducibility.test.js guards the line between "the same
 * domain gets the same audit prompts" and "every audit call rerolls the
 * dice". Run: `node tests/audit_prompt_reproducibility.test.js`
 * (exits non-zero on failure).
 *
 * WHY THIS EXISTS. audit-domain.js:79 used to call generateAuditPrompts(domain)
 * unconditionally on every audit. That function calls gpt-4o-mini at
 * temperature 0.4 and regenerates the prompt set (and the extracted brand
 * name) from scratch each time. Measured in production 2026-08-14
 * (docs/qa/audit-scoring-investigation-2026-08-14.md §4): revenuehunt.com
 * scored 54 at 21:48 UTC and 0 at 21:51 UTC, both runs with full 8/8 engine
 * coverage, sharing only 1 of 6 generated prompts. Two prospects saw a public
 * ai_score of 0, checked an engine by hand, found themselves ranked well, and
 * did not buy.
 *
 * getOrGenerateAuditPrompts() in _prospect_prompts.js closes this by reusing
 * the earliest stored prompt set for a domain instead of regenerating one on
 * every call. This file proves ten required properties, one section each:
 *   1. the same domain audited twice returns the same prompt set
 *   2. a genuinely new domain still gets a freshly generated set
 *   3. there is an explicit, deliberate way to force regeneration, and reuse
 *      resumes automatically afterward
 *   4. a forced regeneration does not rewrite or delete any prior stored row
 *   5. a reused row whose brand_name is NULL (the shape of every one of the
 *      70 canonical rows in production as of 2026-08-14, since the column is
 *      additive) still recovers a usable brand name rather than passing null
 *      through to buildProspectAliases(). Added 2026-08-14 after bg-verify's
 *      review (docs/qa/scoring-fixes-review-2026-08-14.md F1) reproduced a
 *      true mention becoming a false zero on caretlegal.com,
 *      salesmessage.com and gokickflip.com under the first version of this
 *      fix, which returned `data.brand_name || null` unmodified
 *   6. when recovery also finds nothing, reuse is abandoned in favour of a
 *      fresh generation rather than returned with a degraded alias set
 *   7. a low_confidence:true canonical row that still holds a full prompt set
 *      is reused, not regenerated on every call. Added after bg-verify's
 *      re-review (R1) found the first F1 fix's reuse guard rejected 3 real,
 *      non-degenerate production rows (brevo.com, jetpackworkflow.com,
 *      antidote.legal), reintroducing the change's own target defect on them
 *   8. a tagline-shaped og:site_name recovered by section 5's path is never
 *      accepted as a brand name, so it can never reach buildProspectAliases()
 *      as a false-positive-generating alias. Added after the re-review (R5)
 *      reproduced a false positive from an unsanitised recovered value
 *   9. a successfully recovered brand name is persisted to the canonical row,
 *      so a second audit of the same domain performs zero further homepage
 *      fetches. Added after the re-review (R2) found the recovered name was
 *      never written back, so every pre-migration domain paid the fetch on
 *      every single audit, forever
 *   10. when recovery finds nothing (no og:site_name at all) but the FALLBACK
 *       generation still derives a brand name, that name is ALSO persisted to
 *       the canonical row. Added after the third-pass review (T1c) measured
 *       that the write-back added for section 9 only ever fires on recovery
 *       success, so the 28 of 70 canonical domains with no og:site_name meta
 *       tag at all (plus 4 more the sanitiser correctly rejects) could never
 *       satisfy it and would regenerate through gpt-4o-mini forever
 *
 * Runs entirely against an in-memory fake of the supabase client and a fake
 * global.fetch (no network, no OpenAI spend, no database write). The fake
 * fetch simulates exactly the non-determinism measured in production: every
 * call to the OpenAI mock returns a DISTINCT prompt set (each variant labelled
 * with its own call index, so no two fresh generations can ever coincidentally
 * match), standing in for what temperature 0.4 does on gpt-4o-mini in reality.
 *
 * MODULE UNDER TEST is resolvable via BG_FN_DIR so the same file can be
 * pointed at a pre-fix copy of netlify/functions to demonstrate that it fails
 * there (getOrGenerateAuditPrompts does not exist pre-fix, so the call throws).
 * Default is the real directory.
 */
const assert = require('assert')
const path = require('path')

const FN_DIR = process.env.BG_FN_DIR
  ? path.resolve(process.env.BG_FN_DIR)
  : path.join(__dirname, '..', 'netlify', 'functions')

// ── Fake global.fetch ────────────────────────────────────────────────────────
// Stands in for both fetchHomepageSignal's homepage GET and generateAuditPrompts'
// OpenAI POST, entirely offline. Every OpenAI call gets its own uniquely
// labelled prompt set (by call index) so two fresh generations can never
// coincidentally match. The only way two results can be equal in this test is
// if the reuse path actually fired.
let openaiCalls = 0
function makePromptSet(callIndex) {
  return [
    `best product recommendation tools for ecommerce (v${callIndex})`,
    `top quiz software for shopify stores (v${callIndex})`,
    `how to increase conversions with quizzes (v${callIndex})`,
    `effective ways to boost average order value (v${callIndex})`,
    `ai personalization tools for online stores (v${callIndex})`,
    `how to reduce cart abandonment with quizzes (v${callIndex})`,
  ]
}

// One domain, used only by section 6, whose homepage genuinely carries no
// og:site_name (title/description present, so the fetch itself succeeds, but
// there is nothing for the F1 recovery path to find). Every other domain in
// this file gets the normal default response below, which does carry one.
const NO_OG_SITE_NAME_DOMAIN = 'nullbrand-unrecoverable.com'

// R5 (docs/qa/scoring-fixes-review-2026-08-14.md): a domain whose og:site_name
// is the reviewer's exact reproduced false-positive string, a page title
// rather than a brand name.
const TAGLINE_OG_SITE_NAME_DOMAIN = 'taglinebrand-example.com'
const TAGLINE_OG_SITE_NAME = 'Home | Best CRM Software for Teams'

// T1c (docs/qa/scoring-fixes-review-2026-08-14.md): a SEPARATE no-og:site_name
// domain, dedicated to section 10, so it starts with no history and cannot be
// affected by section 6 (which, after the T1c fix, now also persists a
// fallback-derived brand name onto NO_OG_SITE_NAME_DOMAIN's row).
const T1C_NO_OG_SITE_NAME_DOMAIN = 'writeback-fallback-example.com'

// R2 (docs/qa/scoring-fixes-review-2026-08-14.md): counts every homepage GET
// (i.e. every fetch call that is NOT the OpenAI mock below), independent of
// domain, so section 9 can assert a second call performs zero of them.
let homepageFetchCalls = 0

process.env.OPENAI_API_KEY = 'test-key-not-a-real-key'
global.fetch = async (url) => {
  const u = String(url)
  if (u.includes('api.openai.com')) {
    const idx = openaiCalls
    openaiCalls++
    const payload = { category: 'ecommerce personalization software', brand_name: 'Test Brand', prompts: makePromptSet(idx) }
    return { ok: true, json: async () => ({ choices: [{ message: { content: JSON.stringify(payload) } }] }) }
  }
  homepageFetchCalls++
  if (u.includes(NO_OG_SITE_NAME_DOMAIN) || u.includes(T1C_NO_OG_SITE_NAME_DOMAIN)) {
    return {
      ok: true,
      text: async () => '<title>No Site Name Here</title>'
        + '<meta name="description" content="A domain with no og:site_name meta tag at all.">',
    }
  }
  if (u.includes(TAGLINE_OG_SITE_NAME_DOMAIN)) {
    return {
      ok: true,
      text: async () => `<title>${TAGLINE_OG_SITE_NAME}</title>`
        + '<meta name="description" content="CRM software built for small teams.">'
        + `<meta property="og:site_name" content="${TAGLINE_OG_SITE_NAME}">`,
    }
  }
  // Homepage fetch inside fetchHomepageSignal, always succeeds with a minimal
  // page, deterministic and irrelevant to which prompt set comes back.
  return {
    ok: true,
    text: async () => '<title>Test Brand: Home</title>'
      + '<meta name="description" content="A test ecommerce personalization tool.">'
      + '<meta property="og:site_name" content="Test Brand">',
  }
}

const { getOrGenerateAuditPrompts, buildProspectAliases } = require(path.join(FN_DIR, '_prospect_prompts'))

// ── Fake supabase, scoped to exactly what getOrGenerateAuditPrompts uses ────
function makeFakeSupabase(seedRows) {
  const state = { prospect_audits: seedRows.slice() }
  function builder(table) {
    const filters = []
    let op = 'select', payload = null, wantSingle = false
    let orderCol = null, orderAsc = true, limitN = null

    const run = () => {
      if (!state[table]) throw new Error(`fake supabase: unknown table ${table}`)
      if (op === 'insert') {
        const rows = (Array.isArray(payload) ? payload : [payload]).map((r, i) => ({ id: state[table].length + i + 1, ...r }))
        state[table].push(...rows)
        return { data: wantSingle ? rows[0] : rows, error: null }
      }
      if (op === 'update') {
        // R2 (docs/qa/scoring-fixes-review-2026-08-14.md): the write-back call
        // shape is `.update({...}).eq('id', x)` with no terminal `.select()`
        // or `.single()`, exactly like the real supabase-js client, which is
        // thenable on its own. Object.assign mutates the matched row(s)
        // in place, and ONLY the keys in payload, matching a real SQL UPDATE.
        const rows = state[table].filter(r => filters.every(f => f(r)))
        rows.forEach(r => Object.assign(r, payload))
        return { data: wantSelect ? rows : null, error: null }
      }
      let rows = state[table].filter(r => filters.every(f => f(r)))
      if (orderCol) {
        rows = rows.slice().sort((a, b) => {
          if (a[orderCol] === b[orderCol]) return 0
          const gt = a[orderCol] > b[orderCol]
          return orderAsc ? (gt ? 1 : -1) : (gt ? -1 : 1)
        })
      }
      if (limitN != null) rows = rows.slice(0, limitN)
      return { data: wantSingle ? (rows[0] ?? null) : rows, error: null }
    }

    let wantSelect = false
    const q = {
      select() { op = op === 'insert' || op === 'update' ? op : 'select'; wantSelect = true; return q },
      insert(p) { op = 'insert'; payload = p; return q },
      update(p) { op = 'update'; payload = p; return q },
      eq(c, v) { filters.push(r => String(r[c]) === String(v)); return q },
      not(c, kind, v) {
        // Only the one form this module actually uses: .not(col, 'is', null)
        assert.strictEqual(kind, 'is')
        assert.strictEqual(v, null)
        filters.push(r => r[c] !== null && r[c] !== undefined)
        return q
      },
      order(c, opts) { orderCol = c; orderAsc = !(opts && opts.ascending === false); return q },
      limit(n) { limitN = n; return q },
      maybeSingle() { wantSingle = true; return Promise.resolve(run()) },
      single() { wantSingle = true; return Promise.resolve(run()) },
      // Real supabase-js query builders are thenable on their own, so a call
      // like `await supabase.from(t).update(p).eq('id', x)` with no terminal
      // `.select()`/`.single()` still executes and resolves to {data, error}.
      // The write-back in _prospect_prompts.js relies on exactly this.
      then(resolve, reject) { return Promise.resolve().then(run).then(resolve, reject) },
    }
    return q
  }
  return { state, from: (t) => builder(t) }
}

// Mirrors exactly what audit-domain.js does after getOrGenerateAuditPrompts
// returns: build promptsAll the same way, insert a prospect_audits row of the
// same shape, with a strictly increasing created_at so ordering is unambiguous.
let clock = Date.parse('2026-08-14T21:00:00Z')
async function simulateAuditRun(supabase, domain, opts = {}) {
  const generated = await getOrGenerateAuditPrompts(supabase, domain, opts)
  const promptsAll = generated.prompts.map((text, id) => ({ id, text }))
  clock += 60000
  supabase.state.prospect_audits.push({
    id: supabase.state.prospect_audits.length + 1,
    domain,
    category: generated.category,
    low_confidence: generated.lowConfidence,
    brand_name: generated.brandName || null,
    generated_prompts: promptsAll,
    created_at: new Date(clock).toISOString(),
  })
  return generated
}

let passed = 0
const ok = (n) => { passed++; console.log('  ok -', n) }

async function main() {
  const supabase = makeFakeSupabase([])

  console.log('\n1. the SAME domain audited twice returns the SAME prompt set')
  {
    const run1 = await simulateAuditRun(supabase, 'revenuehunt.com')
    assert.strictEqual(run1.reused, false, 'first-ever audit of a domain must not claim reuse')
    assert.strictEqual(openaiCalls, 1, 'a genuinely new domain must call the generator once')
    ok('first run generates fresh (reused:false), 1 OpenAI call')

    const run2 = await simulateAuditRun(supabase, 'revenuehunt.com')
    assert.strictEqual(run2.reused, true, 'second audit of the same domain must be marked reused')
    assert.strictEqual(openaiCalls, 1, 'the second run must NOT call the generator again')
    ok('second run is marked reused:true, still 1 OpenAI call total')

    assert.deepStrictEqual(run2.prompts, run1.prompts,
      'THE ASSERTION THIS FILE EXISTS FOR: two audits of one domain must share one prompt set')
    ok('prompt sets are byte-for-byte identical across both runs')

    assert.strictEqual(run2.brandName, run1.brandName, 'the brand name used for alias matching must also be stable')
    ok('brand name is stable across both runs, not just the prompts')
  }

  console.log('\n2. a genuinely NEW domain still gets a freshly generated set')
  {
    const callsBefore = openaiCalls
    const run = await simulateAuditRun(supabase, 'a-completely-different-domain.com')
    assert.strictEqual(run.reused, false, 'a domain with no prior row must generate fresh')
    assert.strictEqual(openaiCalls, callsBefore + 1, 'generating for a new domain must call the generator')
    ok('new domain: reused:false, generator called')
  }

  console.log('\n3. there is a DELIBERATE, EXPLICIT way to regenerate, and reuse resumes after')
  {
    const priorRunCount = supabase.state.prospect_audits.filter(r => r.domain === 'revenuehunt.com').length
    assert.strictEqual(priorRunCount, 2, 'sanity: revenuehunt.com already has 2 stored runs from section 1')
    const original = supabase.state.prospect_audits.find(r => r.domain === 'revenuehunt.com').generated_prompts.map(p => p.text)

    const callsBefore = openaiCalls
    const forced = await simulateAuditRun(supabase, 'revenuehunt.com', { forceRegenerate: true })
    assert.strictEqual(forced.reused, false, 'forceRegenerate must bypass reuse even though a prior row exists')
    assert.strictEqual(openaiCalls, callsBefore + 1, 'forceRegenerate must call the generator')
    assert.notDeepStrictEqual(forced.prompts, original,
      'a forced regeneration must actually be fresh, not silently served from cache')
    ok('forceRegenerate:true bypasses the cached set, calls the generator, and gets a genuinely different set')

    // Not an accident of every call: leaving the flag off, immediately after,
    // must go straight back to reuse, of the ORIGINAL earliest set, not the
    // one the forced call just produced.
    const callsBeforeAfter = openaiCalls
    const after = await simulateAuditRun(supabase, 'revenuehunt.com')
    assert.strictEqual(after.reused, true, 'without the flag, reuse resumes immediately')
    assert.strictEqual(openaiCalls, callsBeforeAfter, 'reuse must not call the generator')
    assert.deepStrictEqual(after.prompts, original,
      'reuse must still resolve to the ORIGINAL (earliest) set, not the forced regeneration')
    ok('reuse resumes on the very next call and still resolves to the original earliest set')
  }

  console.log('\n4. a forced regeneration does NOT rewrite or invalidate history')
  {
    const rows = supabase.state.prospect_audits.filter(r => r.domain === 'revenuehunt.com')
    assert.strictEqual(rows.length, 4, '2 from section 1 + 1 forced + 1 reuse from section 3 = 4 rows, none deleted')
    ok('4 rows on disk for revenuehunt.com, none deleted by any call')

    const firstEver = rows[0].generated_prompts.map(p => p.text)
    const secondRow = rows[1].generated_prompts.map(p => p.text)
    assert.deepStrictEqual(secondRow, firstEver,
      'the row written by the plain reused call in section 1 must carry the same content as the original')
    ok('the earliest row is untouched: still the same prompts as when it was first written')

    const forcedRow = rows[2].generated_prompts.map(p => p.text)
    assert.notDeepStrictEqual(forcedRow, firstEver,
      'the forced-regeneration row must carry its own distinct, freshly generated set')
    ok('the forced-regeneration row carries a distinct set, appended as new history, not substituted in place')

    const afterRow = rows[3].generated_prompts.map(p => p.text)
    assert.deepStrictEqual(afterRow, firstEver,
      'the very next unforced call must still resolve back to the original earliest set')
    ok('the row after that reuses the original set again, proving forced regeneration did not become the new canonical set')
  }

  // ── F1 (docs/qa/scoring-fixes-review-2026-08-14.md), bg-verify FAIL ────────
  // Sections 1 to 4 above only ever seed rows through simulateAuditRun(), which
  // always writes a real brand_name. That cannot exercise the actual production
  // shape: all 70 canonical prospect_audits rows existed before the brand_name
  // column did, so every one of them has brand_name NULL. Against the code as
  // it stood when bg-verify reviewed it, this section fails, because the old
  // line `brandName: data.brand_name || null` passed that NULL straight
  // through, which is what let a genuine mention collapse to a false zero on
  // caretlegal.com, salesmessage.com and gokickflip.com.
  console.log('\n5. a reused row with brand_name NULL still recovers a usable brand name (F1)')
  {
    const seededPrompts = makePromptSet(9001).map((text, id) => ({ id, text }))
    clock += 60000
    supabase.state.prospect_audits.push({
      id: supabase.state.prospect_audits.length + 1,
      domain: 'nullbrand-recoverable.com',
      category: 'ecommerce personalization software',
      low_confidence: false,
      brand_name: null,   // the exact shape of every pre-migration production row
      generated_prompts: seededPrompts,
      created_at: new Date(clock).toISOString(),
    })

    const callsBefore = openaiCalls
    const result = await getOrGenerateAuditPrompts(supabase, 'nullbrand-recoverable.com', {})

    assert.strictEqual(result.reused, true, 'a stored prompt set must still be reused even when brand_name is null')
    assert.deepStrictEqual(result.prompts, seededPrompts.map(p => p.text), 'the stored prompts must be returned unchanged')
    assert.strictEqual(openaiCalls, callsBefore, 'recovering the brand name from the homepage must not call the LLM')
    ok('reused prompt set returned, no LLM call spent recovering the brand name')

    // THE ASSERTION F1 EXISTS FOR. Against the code bg-verify reviewed, this
    // read null and buildProspectAliases(domain, null) collapsed to the domain
    // root alone.
    assert.strictEqual(result.brandName, 'Test Brand',
      'a null stored brand_name must be recovered from the homepage og:site_name, not passed through as null')
    ok('brand name recovered from og:site_name instead of being passed through as null')
  }

  console.log('\n6. recovery finding NOTHING abandons reuse rather than returning a degraded alias set')
  {
    const seededPrompts = makePromptSet(9002).map((text, id) => ({ id, text }))
    clock += 60000
    supabase.state.prospect_audits.push({
      id: supabase.state.prospect_audits.length + 1,
      domain: NO_OG_SITE_NAME_DOMAIN,
      category: 'unknown',
      low_confidence: false,
      brand_name: null,
      generated_prompts: seededPrompts,
      created_at: new Date(clock).toISOString(),
    })

    const callsBefore = openaiCalls
    const result = await getOrGenerateAuditPrompts(supabase, NO_OG_SITE_NAME_DOMAIN, {})

    assert.strictEqual(result.reused, false,
      'when neither the stored row nor the homepage carries a brand name, reuse must be abandoned rather than returned degraded')
    assert.strictEqual(openaiCalls, callsBefore + 1, 'abandoning reuse must fall through to a fresh generation')
    assert.notDeepStrictEqual(result.prompts, seededPrompts.map(p => p.text),
      'the fresh generation must not silently reuse the stored, brand-name-unverifiable prompt set either')
    ok('recovery failure abandons reuse and falls through to a fresh generation, never a silent degraded reuse')
  }

  // ── bg-verify re-review, docs/qa/scoring-fixes-review-2026-08-14.md ───────
  // Sections 7 to 9 below prove R1, R5 and R2. Each is a genuine behavioural
  // regression from the round that closed F1: R1 and R5 are correctness
  // defects in the fix itself, not gaps the fix left open.

  console.log('\n7. a low_confidence:true canonical row WITH a full prompt set is still reused (R1)')
  {
    // brevo.com, jetpackworkflow.com and antidote.legal in production: the
    // homepage fetch failed (low_confidence: true) but the LLM still returned
    // a full, real 6-prompt set from the domain name alone. Against the code
    // the first re-review round shipped, `data.low_confidence !== true` in
    // the reuse guard rejected all three, and each one regenerated through
    // gpt-4o-mini on every single audit forever, which is the exact defect
    // this whole change exists to remove.
    const seededPrompts = makePromptSet(9101).map((text, id) => ({ id, text }))
    clock += 60000
    supabase.state.prospect_audits.push({
      id: supabase.state.prospect_audits.length + 1,
      domain: 'lowconfidence-fullset.example',
      category: 'email marketing software',
      low_confidence: true,   // homepage fetch failed; generation itself was NOT degenerate
      brand_name: 'Test Brand',
      generated_prompts: seededPrompts,
      created_at: new Date(clock).toISOString(),
    })

    const callsBefore = openaiCalls
    const result1 = await getOrGenerateAuditPrompts(supabase, 'lowconfidence-fullset.example', {})
    const result2 = await getOrGenerateAuditPrompts(supabase, 'lowconfidence-fullset.example', {})
    const result3 = await getOrGenerateAuditPrompts(supabase, 'lowconfidence-fullset.example', {})

    // THE ASSERTION R1 EXISTS FOR. Against the low_confidence-checking guard,
    // all three calls come back reused:false with three different prompt
    // sets and three LLM calls, the exact "row written that will always be
    // declined on read" loop the review reproduced.
    assert.strictEqual(result1.reused, true, 'a low_confidence row with a full prompt set must still be reused (call 1)')
    assert.strictEqual(result2.reused, true, 'a low_confidence row with a full prompt set must still be reused (call 2)')
    assert.strictEqual(result3.reused, true, 'a low_confidence row with a full prompt set must still be reused (call 3)')
    ok('three consecutive calls all reused the low_confidence row, none regenerated')

    assert.strictEqual(openaiCalls, callsBefore, 'reusing a low_confidence row with a full prompt set must spend zero LLM calls')
    ok('zero LLM calls spent across three calls (was three, one per call, before this fix)')

    assert.deepStrictEqual(result1.prompts, seededPrompts.map(p => p.text))
    assert.deepStrictEqual(result2.prompts, result1.prompts)
    assert.deepStrictEqual(result3.prompts, result1.prompts)
    ok('all three calls return the identical stored prompt set')
  }

  console.log('\n8. a tagline-style og:site_name recovered via F1 does NOT become a matching alias (R5)')
  {
    // The reviewer's exact reproduced string: a <title>-shaped value, not a
    // brand name. Before R5's sanitiser, buildProspectAliases() would add its
    // lead word "Home" as a standalone alias with no stopword filter to catch
    // it, and that alias matches the word "home" anywhere in an engine
    // response, a FALSE POSITIVE in the opposite direction from F1.
    const seededPrompts = makePromptSet(9102).map((text, id) => ({ id, text }))
    clock += 60000
    supabase.state.prospect_audits.push({
      id: supabase.state.prospect_audits.length + 1,
      domain: TAGLINE_OG_SITE_NAME_DOMAIN,
      category: 'crm software',
      low_confidence: false,
      brand_name: null,   // forces the F1 recovery path to run
      generated_prompts: seededPrompts,
      created_at: new Date(clock).toISOString(),
    })

    const result = await getOrGenerateAuditPrompts(supabase, TAGLINE_OG_SITE_NAME_DOMAIN, {})

    // Sanitisation must reject the whole tagline (it is separator-shaped even
    // after the leading "Home" is stripped), so recovery counts as having
    // found nothing usable and reuse is abandoned, exactly like section 6.
    assert.strictEqual(result.reused, false,
      'a tagline-shaped og:site_name must not be accepted as a brand name, so reuse must be abandoned like any other failed recovery')
    ok('tagline og:site_name treated as a failed recovery, reuse abandoned rather than accepted')

    // THE ASSERTION R5 EXISTS FOR, checked at the alias-building layer, which
    // is where the reviewer's false positive actually occurred.
    const aliases = buildProspectAliases(TAGLINE_OG_SITE_NAME_DOMAIN, result.brandName)
    assert.ok(!aliases.some(a => a.toLowerCase() === 'home'),
      `the generic word "Home" must never reach buildProspectAliases() as a standalone alias, got [${aliases.join(', ')}]`)
    assert.ok(!aliases.includes(TAGLINE_OG_SITE_NAME),
      `the raw tagline string must never be used as an alias either, got [${aliases.join(', ')}]`)
    ok(`aliases are [${aliases.join(', ')}], contain no generic or tagline-derived entry`)
  }

  console.log('\n9. a recovered brand name is PERSISTED to the canonical row, so a second call performs no HTTP GET (R2)')
  {
    const domain = 'writeback-example.com'
    const seededPrompts = makePromptSet(9103).map((text, id) => ({ id, text }))
    clock += 60000
    supabase.state.prospect_audits.push({
      id: supabase.state.prospect_audits.length + 1,
      domain,
      category: 'ecommerce personalization software',
      low_confidence: false,
      brand_name: null,   // forces the F1 recovery path to run on the first call only
      generated_prompts: seededPrompts,
      created_at: new Date(clock).toISOString(),
    })

    const fetchesBefore1 = homepageFetchCalls
    const result1 = await getOrGenerateAuditPrompts(supabase, domain, {})
    const fetchesAfterCall1 = homepageFetchCalls

    assert.strictEqual(result1.reused, true, 'call 1 must still reuse the stored prompt set')
    assert.strictEqual(result1.brandName, 'Test Brand', 'call 1 must recover a real brand name from the homepage')
    assert.strictEqual(fetchesAfterCall1, fetchesBefore1 + 1, 'call 1 must perform exactly one homepage GET to recover the brand name')
    ok('call 1: recovered "Test Brand", spent exactly 1 homepage GET')

    // THE ASSERTION R2 EXISTS FOR. Before the write-back, the canonical row's
    // brand_name stayed NULL forever, so every future audit of this domain
    // paid the same HTTP GET again, permanently, not just once.
    const canonicalRow = supabase.state.prospect_audits.find(r => r.domain === domain)
    assert.strictEqual(canonicalRow.brand_name, 'Test Brand',
      'the recovered brand name must be written back onto the CANONICAL row, not left NULL forever')
    ok('canonical row brand_name is now "Test Brand" on disk, not NULL')

    const result2 = await getOrGenerateAuditPrompts(supabase, domain, {})
    const fetchesAfterCall2 = homepageFetchCalls

    assert.strictEqual(result2.reused, true, 'call 2 must still reuse the stored prompt set')
    assert.strictEqual(result2.brandName, 'Test Brand', 'call 2 must read the now-persisted brand name')
    assert.strictEqual(fetchesAfterCall2, fetchesAfterCall1,
      'call 2 must perform ZERO homepage GETs: the brand name is already on the canonical row')
    ok('call 2: same brand name, zero additional homepage GETs (was 1 more, forever, before this fix)')

    // Write-back must be scoped to exactly one column on exactly this row.
    // Nothing else about the row (its prompts, its category, its id) may move.
    assert.deepStrictEqual(canonicalRow.generated_prompts.map(p => p.text), seededPrompts.map(p => p.text),
      'the write-back must not alter the prompts')
    assert.strictEqual(canonicalRow.category, 'ecommerce personalization software', 'the write-back must not alter the category')
    ok('write-back touched brand_name only; prompts and category on the canonical row are unchanged')
  }

  // ── T1c, docs/qa/scoring-fixes-review-2026-08-14.md third-pass review ─────
  console.log('\n10. the FALLBACK generation\'s brand name is ALSO persisted, closing the 32-of-70 gap (T1c)')
  {
    // Measured in production: 28 of 70 canonical rows have no og:site_name
    // meta tag at all (the homepage loads fine, it just never declares one),
    // plus 4 more the sanitiser correctly rejects. Section 9's write-back only
    // fires on recovery SUCCESS, so none of those 32 domains could ever
    // satisfy it and each would regenerate through gpt-4o-mini forever.
    const seededPrompts = makePromptSet(9104).map((text, id) => ({ id, text }))
    clock += 60000
    supabase.state.prospect_audits.push({
      id: supabase.state.prospect_audits.length + 1,
      domain: T1C_NO_OG_SITE_NAME_DOMAIN,
      category: 'ecommerce personalization software',
      low_confidence: false,
      brand_name: null,   // forces recovery to run; the domain's mocked homepage carries no og:site_name at all
      generated_prompts: seededPrompts,
      created_at: new Date(clock).toISOString(),
    })

    const fetchesBefore = homepageFetchCalls
    const openaiCallsBefore = openaiCalls
    const result1 = await getOrGenerateAuditPrompts(supabase, T1C_NO_OG_SITE_NAME_DOMAIN, {})
    const fetchesAfterCall1 = homepageFetchCalls

    // Call 1 must behave exactly like section 6: recovery finds nothing, reuse
    // is abandoned, one LLM call runs, and that fresh call's own brand name
    // (fixed as 'Test Brand' by this file's OpenAI mock) is what gets tried.
    assert.strictEqual(result1.reused, false, 'call 1 must abandon reuse: recovery found nothing usable')
    assert.strictEqual(openaiCalls, openaiCallsBefore + 1, 'call 1 must fall through to exactly one fresh generation')
    assert.strictEqual(fetchesAfterCall1, fetchesBefore + 1, 'call 1 must perform exactly one homepage GET (the failed recovery attempt)')
    ok('call 1: recovery failed as expected, fell through to one fresh generation')

    // THE ASSERTION T1c EXISTS FOR. Before this fix, the canonical row's
    // brand_name stayed NULL after this call, because the write-back only
    // ever ran inside `if (brandName)` on the RECOVERY path.
    const canonicalRow = supabase.state.prospect_audits.find(r => r.domain === T1C_NO_OG_SITE_NAME_DOMAIN)
    assert.strictEqual(canonicalRow.brand_name, 'Test Brand',
      'the FALLBACK generation\'s brand name must be persisted to the canonical row, not left NULL forever')
    ok('canonical row brand_name is now "Test Brand" on disk after ONE call, via the fallback write-back')

    // THE OTHER HALF OF T1c'S CONTRACT: zero further homepage GETs on repeat,
    // which is also the proof of "only ever fill a NULL, never overwrite".
    // Structurally, the write-back code (both the recovery-success path and
    // this fallback path) only runs inside the branch reached when brandName
    // was still falsy at entry, which can only be true when data.brand_name
    // was falsy. Once call 1 has set it, `let brandName = data.brand_name`
    // is truthy immediately, so NEITHER write-back's code is even reached on
    // call 2, which is exactly what zero homepage GETs and zero LLM calls
    // below prove empirically: if either write-back ran again, at least one
    // of those two counters would have moved.
    const openaiCallsBeforeCall2 = openaiCalls
    const result2 = await getOrGenerateAuditPrompts(supabase, T1C_NO_OG_SITE_NAME_DOMAIN, {})
    const fetchesAfterCall2 = homepageFetchCalls

    assert.strictEqual(result2.reused, true, 'call 2 must now reuse: the canonical row has a brand_name at last')
    assert.strictEqual(result2.brandName, 'Test Brand', 'call 2 must read the persisted fallback brand name')
    assert.strictEqual(fetchesAfterCall2, fetchesAfterCall1,
      'call 2 must perform ZERO homepage GETs: recovery is never attempted once brand_name is set')
    assert.strictEqual(openaiCalls, openaiCallsBeforeCall2, 'call 2 must spend ZERO further LLM calls: this domain now reuses fully')
    ok('call 2: reused with the persisted name, zero further homepage GETs, zero further LLM calls (was one GET plus one LLM call, forever, before this fix)')
  }

  console.log(`\nPASS: ${passed} assertions\n`)
}

main().catch((e) => {
  console.error(`\nFAIL: ${e.message}`)
  if (process.env.BG_TEST_STACK) console.error(e.stack)
  process.exit(1)
})
