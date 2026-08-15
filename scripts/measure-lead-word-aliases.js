#!/usr/bin/env node
/**
 * measure-lead-word-aliases.js
 *
 * Quantifies BOTH error directions of the T2 lead-word guard
 * (docs/qa/scoring-fixes-review-2026-08-14.md) against real stored audit data,
 * so the guard's word list is chosen from measurement rather than from taste.
 *
 * It reads no database and calls no API. It consumes the JSON output of two
 * READ-ONLY queries, which Constantin runs in the Supabase SQL Editor for
 * duiyifepitvugyulobqm per this project's execution-delegation rule. Both
 * queries are printed by `--sql`.
 *
 * Usage:
 *   node scripts/measure-lead-word-aliases.js --sql
 *   node scripts/measure-lead-word-aliases.js --names names.json --mentions mentions.json
 *
 * WHAT IT REPORTS
 *
 *   Direction A, inflation removed. Every stored brand name whose lead word the
 *   guard now rejects.
 *
 *   MEASURED CAVEAT, 2026-08-15, learned the hard way. `prospect_audits.brand_name`
 *   is NULL on 70 of the 71 canonical rows (the column is post-migration and
 *   almost nothing has re-audited since), so query 1 alone measures almost
 *   nothing. The names that actually built the aliases came from og:site_name or
 *   from the LLM, and were never persisted. To get direction A you must fetch
 *   each domain's live og:site_name with the product's own fetchHomepageSignal()
 *   and sanitizeRecoveredBrandName(), which is free and is what produced the
 *   38-of-70 figure. That still leaves the 32 domains with no og:site_name, whose
 *   names are LLM-derived and unknowable without spend. unittrac.com, the worst
 *   case found, was in that blind spot and is why direction B below matters more
 *   than direction A: replaying the stored mentions finds what sampling names
 *   cannot.
 *
 *   Direction B, deflation introduced. Every stored engine result that counts as
 *   a mention TODAY and would stop counting under the guard. By construction
 *   these are exactly the results whose only match was the bare lead word: the
 *   full-name alias and the domain-root alias are still emitted unconditionally,
 *   so anything they matched is untouched. The script prints each one with its
 *   snippet, because whether a bare generic word was a real mention is a
 *   judgement about the text, not something a script can settle.
 *
 * KNOWN LIMIT OF DIRECTION B, stated rather than papered over. prospect_audits
 * stores `snippet`, roughly 300 characters centred on the FIRST alias match, not
 * the full engine response (the evidence-retention defect named in
 * docs/qa/audit-scoring-investigation-2026-08-14.md). So the replay runs over
 * the snippet, not over what the engine actually said. A mention whose snippet
 * shows only the bare lead word could in principle be supported by the full name
 * elsewhere in a response nobody kept. That makes this an UPPER bound on the
 * breakage, not an exact count. Rows flagged here should be read before the
 * guard's word list is treated as settled.
 */
const fs = require('fs')
const path = require('path')

const FN_DIR = path.join(__dirname, '..', 'brandgeo-dashboard', 'netlify', 'functions')
const { buildProspectAliases, isDistinctiveLeadWord } = require(path.join(FN_DIR, '_prospect_prompts'))
const { analyseResponse } = require(path.join(FN_DIR, '_analysis'))

const SQL = `
-- QUERY 1 (names.json). The brand-name population: one canonical row per
-- domain, plus every brand name ever recorded for that domain on any row.
-- Feeds direction A, the true rate.
with canonical as (
  select distinct on (domain) domain, id, brand_name, created_at
  from prospect_audits
  where generated_prompts is not null
  order by domain, created_at asc, id asc
)
select c.domain,
       c.brand_name as canonical_brand_name,
       (select string_agg(distinct p.brand_name, ' | ')
          from prospect_audits p
         where p.domain = c.domain and p.brand_name is not null) as any_brand_name_seen
from canonical c
order by c.domain;

-- QUERY 2 (mentions.json). Every stored engine result that currently counts as
-- a mention, with the brand name that produced its aliases. Feeds direction B,
-- the breakage. Read-only; touches no column and no row.
select pa.domain,
       pa.brand_name,
       pa.id                              as audit_id,
       pa.created_at,
       er->>'engine'                      as engine,
       er->>'snippet'                     as snippet
from prospect_audits pa
     cross join lateral jsonb_array_elements(pa.engine_results) er
where pa.engine_results is not null
  and (er->>'brand_mentioned')::boolean is true
order by pa.domain, pa.created_at, engine;

-- QUERY 3 (optional, for step 1's reproduction of the two named cases only).
select pa.id, pa.domain, pa.brand_name, pa.ai_score, pa.status, pa.created_at,
       er->>'engine'                      as engine,
       (er->>'brand_mentioned')::boolean  as brand_mentioned,
       er->>'snippet'                     as snippet
from prospect_audits pa
     cross join lateral jsonb_array_elements(pa.engine_results) er
where pa.domain in ('casetempo.com', 'financial-cents.com')
  and pa.engine_results is not null
order by pa.domain, pa.created_at, engine;
`.trim()

function arg(name) {
  const i = process.argv.indexOf(name)
  return i === -1 ? null : process.argv[i + 1]
}

// The pre-fix rule, reproduced here so both alias sets can be built from one
// brand name without checking out the old file.
const OLD_STOPWORDS = new Set(['the', 'get', 'my', 'your', 'a', 'an', 'go', 'try'])
function oldAliases(domain, brandName) {
  const aliases = []
  const root = (domain || '').split('.')[0]
  if (root) aliases.push(root)
  const name = (brandName || '').trim()
  if (name) {
    aliases.push(name)
    const words = name.split(/\s+/).filter(Boolean)
    if (words.length > 1) {
      const lead = words[0]
      if (lead.length >= 2 && !OLD_STOPWORDS.has(lead.toLowerCase())) aliases.push(lead)
    }
  }
  const seen = new Set()
  return aliases.filter(a => { const k = a.toLowerCase(); if (seen.has(k)) return false; seen.add(k); return true })
}

function cfg(domain, aliases) {
  return { brand_aliases: aliases, brand_website: domain, known_competitors: [] }
}

function main() {
  if (process.argv.includes('--sql')) { console.log(SQL); return }

  const namesPath = arg('--names')
  const mentionsPath = arg('--mentions')
  if (!namesPath && !mentionsPath) {
    console.error('usage: node scripts/measure-lead-word-aliases.js --names names.json --mentions mentions.json')
    console.error('       node scripts/measure-lead-word-aliases.js --sql')
    process.exit(2)
  }

  // ── Direction A: how many stored brand names produce a generic lead alias ──
  if (namesPath) {
    const rows = JSON.parse(fs.readFileSync(namesPath, 'utf8'))
    // Take every distinct name ever seen for the domain, not just the canonical
    // one: a pre-migration canonical row is NULL, and the name that actually
    // built the aliases for a given audit lives on that audit's own row.
    const pairs = []
    for (const r of rows) {
      const names = new Set()
      if (r.canonical_brand_name) names.add(r.canonical_brand_name)
      for (const n of String(r.any_brand_name_seen || '').split(' | ')) if (n.trim()) names.add(n.trim())
      for (const n of names) pairs.push({ domain: r.domain, brandName: n })
    }

    const multiWord = pairs.filter(p => p.brandName.trim().split(/\s+/).filter(Boolean).length > 1)
    const blocked = multiWord.filter(p => !isDistinctiveLeadWord(p.brandName.trim().split(/\s+/)[0]))

    console.log('\n=== DIRECTION A: inflation removed ===')
    console.log(`domains with a canonical row .......... ${rows.length}`)
    console.log(`distinct (domain, brand name) pairs ... ${pairs.length}`)
    console.log(`  of which multi-word .................. ${multiWord.length}`)
    console.log(`  of which the guard now blocks ........ ${blocked.length}`
      + (multiWord.length ? `  (${(100 * blocked.length / multiWord.length).toFixed(1)}% of multi-word, `
        + `${(100 * blocked.length / pairs.length).toFixed(1)}% of all names)` : ''))
    if (blocked.length) {
      console.log('\n  blocked lead words:')
      for (const p of blocked.sort((a, b) => a.domain.localeCompare(b.domain))) {
        console.log(`    ${p.domain.padEnd(30)} "${p.brandName}" -> "${p.brandName.trim().split(/\s+/)[0]}"`)
      }
    }

    // A lead word the guard KEEPS but that is short and lowercase-common-looking
    // is the residual risk. Surfaced so the word list can be extended from
    // evidence instead of from imagination.
    const kept = multiWord.filter(p => isDistinctiveLeadWord(p.brandName.trim().split(/\s+/)[0]))
    if (kept.length) {
      console.log('\n  lead words KEPT (review these for anything that reads as an ordinary word):')
      for (const p of kept.sort((a, b) => a.domain.localeCompare(b.domain))) {
        console.log(`    ${p.domain.padEnd(30)} "${p.brandName}" -> "${p.brandName.trim().split(/\s+/)[0]}"`)
      }
    }
  }

  // ── Direction B: currently-true mentions the guard would break ─────────────
  if (mentionsPath) {
    const rows = JSON.parse(fs.readFileSync(mentionsPath, 'utf8'))
    const broken = []
    let replayable = 0
    let noSnippet = 0
    let noBrandName = 0
    let stillMatchedByOld = 0

    for (const r of rows) {
      if (!r.brand_name) { noBrandName++; continue }
      if (!r.snippet) { noSnippet++; continue }
      replayable++
      const before = analyseResponse(r.snippet, cfg(r.domain, oldAliases(r.domain, r.brand_name))).brand_mentioned
      const after = analyseResponse(r.snippet, cfg(r.domain, buildProspectAliases(r.domain, r.brand_name))).brand_mentioned
      if (before) stillMatchedByOld++
      if (before && !after) broken.push(r)
    }

    console.log('\n=== DIRECTION B: deflation introduced ===')
    console.log(`stored results currently brand_mentioned = true .... ${rows.length}`)
    console.log(`  replayable (has a brand name and a snippet) ...... ${replayable}`)
    console.log(`  skipped, no brand_name on the row ................ ${noBrandName}`)
    console.log(`  skipped, no snippet stored ....................... ${noSnippet}`)
    console.log(`  snippet still reproduces the match pre-fix ....... ${stillMatchedByOld}`)
    console.log(`  WOULD STOP COUNTING under the guard .............. ${broken.length}`)
    console.log('\n  (upper bound: the replay runs over the ~300-char snippet, not the')
    console.log('   full response, which is not retained. Read each one below.)')
    for (const b of broken) {
      console.log(`\n  --- ${b.domain} / "${b.brand_name}" / ${b.engine} / audit ${b.audit_id} ---`)
      console.log(`      ${String(b.snippet).replace(/\s+/g, ' ').slice(0, 400)}`)
    }
    if (!broken.length) console.log('\n  none.')
  }

  console.log('')
}

main()
