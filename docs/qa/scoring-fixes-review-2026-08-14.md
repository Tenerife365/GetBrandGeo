# FAIL — scoring fixes review, 2026-08-14

Reviewer: `bg-verify` (Opus). Subject: uncommitted working-tree changes by
`bg-backend` on 2026-08-14. Read-only review. No reviewed file was edited, no
git command that mutates state was run, no paid audit was run.

**Nothing here changes a paying client's score.** That was the stated worry and
it is measurably unfounded: the reach change moves no live client's number. BpR
(client 1, the only real paying customer, Growth PRO to 2027-06-02) reads
reach 100 before and after in all four time windows. Every other client whose
denominator does shrink has zero engines mentioning them, so their reach is
0/N either way. Evidence in row 6 and section 3. **The reason this is a FAIL is
the other half of the change**: the prompt-reuse fix silently drops the stored
brand name for all 70 domains already in `prospect_audits`, which re-opens the
exact false-zero defect the 2026-07-16 fix closed. I reproduced it on three
real domains. That is a public-audit data-integrity regression, not a
theoretical one, and it must be closed before deploy. Detail in F1.

The two changes are independent. The `aiVisibilityScore.ts` half is clean and
can ship on its own today.

---

## 1. Acceptance criteria

| # | Criterion | Result | Evidence |
|---|---|---|---|
| 1 | `audit_prompt_reproducibility.test.js` passes on the working tree | PASS | `node tests/audit_prompt_reproducibility.test.js` -> `PASS: 11 assertions`, `EXIT=0`. Run by me, output in section 2. |
| 2 | ...and demonstrably fails at HEAD | PASS (weakly) | `BG_FN_DIR=/tmp/bghead/... node tests/...` -> `FAIL: getOrGenerateAuditPrompts is not a function`, `EXIT=1`. See F6: this proves the symbol is new, not that the old path was non-reproducible. |
| 3 | `reach_parity.test.js` passes on the working tree | PASS | `node tests/reach_parity.test.js` -> `PASS: 5 assertions`, `EXIT=0`. |
| 4 | ...and demonstrably fails at HEAD | PASS | At HEAD: `audit path reach=100`, `dashboard path reach=67`, `FAIL: ... 67 !== 100`, `EXIT=1`. A real behavioural failure, not a missing symbol. |
| 5 | `aiVisibilityScore.ts` reach now matches `_score.js:70-74` | PASS | `_score.js:69-74` uses `enginesWithResults(...)` as denominator; `aiVisibilityScore.ts:151-172` now derives `enginesHeardFrom` by the same predicate (`promptIds.some(pid => results.get(pid)?.has(llmId))`) and divides by it. Identical on the shared fixture. |
| 6 | The reach change alters no live client's displayed score | PASS | Read-only SQL over `ai_results` + `PLAN_ENGINES`. 11 clients checked. 6 unchanged denominators; 5 shrink but all have `engines_with_mention = 0`, so reach is 0 before and after. BpR 100 -> 100 at 7d/30d/90d/all. Table in section 3. |
| 7 | Nothing else in `aiVisibilityScore.ts` was altered | PASS | `git diff` on that file is 23 lines, entirely inside the reach block (`-` on the two old lines, `+` on the comment and the `enginesHeardFrom` derivation). No other hunk. |
| 8 | `regeneratePrompts: true` unreachable by a public caller | PASS | `audit-domain.js:90` `const forceRegeneratePrompts = internal && body.regeneratePrompts === true`. `internal` comes from `_prospect_guard.js:51-54` `isInternalCaller`, which requires `X-Internal-Key === process.env.INTERNAL_AUDIT_KEY` and returns `false` when the env var is unset (fail-closed). Strict `=== true`, so no truthy coercion. |
| 9 | Read side fails open when `brand_name` does not exist | PASS | Probed both shapes. PostgREST-style `{error:{message:'column prospect_audits.brand_name does not exist',code:'42703'}}` -> `reused: false`, 6 prompts, warning logged. Thrown rejection -> `reused: false`, 6 prompts. Neither propagates. |
| 10 | Write side fails open when `brand_name` does not exist | PASS with caveat | `audit-domain.js:142-147` retries the insert without the field when `/brand_name/i` matches the error message. PostgREST `PGRST204` reads `Could not find the 'brand_name' column of 'prospect_audits' in the schema cache`, which matches. Caveat in F5: message-matching, not code-matching. |
| 11 | Migration is additive, idempotent, safe on a live table | PASS | Single `ALTER TABLE prospect_audits ADD COLUMN IF NOT EXISTS brand_name text;` plus a `COMMENT ON`. Nullable, no default, no backfill, no retype, no drop. Section 5. |
| 12 | Domain key normalised consistently on read and write | PASS | Both use the same `domain` local from `normalizeDomain(body.domain)` (`audit-domain.js:54`), so a mismatch is structurally impossible. Verified `normalizeDomain` handles case/`www.`/protocol/path; a trailing dot survives it but is rejected upstream by `isPlausibleDomain` (`example.com.` -> `plausible: false`). Production check: 0 of 107 rows badly normalised. |
| 13 | Reuse preserves the brand name used for alias matching | **FAIL** | For all 70 canonical rows `brand_name` will be NULL (the column does not exist yet; the migration is additive so existing rows get NULL). Reuse then returns `brandName: null` and aliases collapse to the domain root. Reproduced as a true mention turning into a false zero on three real domains. **F1.** |
| 14 | No em dashes or en dashes introduced | PASS | `git diff -U0 ... \| grep '^+' \| rg "[—–]"` -> exit 1 (zero matches). The 19 pre-existing hits in `audit-domain.js` are unchanged at HEAD. New files scanned clean. |
| 15 | No secret, key or token introduced | PASS | Secret scan over the diff returns one hit, the column list `.select('id, token')`. New files: one hit, a literal placeholder string assigned to `process.env.OPENAI_API_KEY` in the test, which is not a credential. No value printed here. |
| 16 | `npx tsc --noEmit` clean | PASS | `TSC EXIT=0`, no output. |
| 17 | `npm run build` clean | PASS | `✓ built in 6.00s`, `BUILD EXIT=0`. Only the pre-existing >500 kB chunk-size warning. |
| 18 | `package_provisioning.test.js` failure is pre-existing | PASS | Fails identically at HEAD (`BG_FN_DIR=/tmp/bghead/...` -> `expected: /\.select\('plan_grant_until, plan_source'\)/`, `EXIT=1`). Not caused by this work. Left alone per instruction. |

---

## 2. Test reproduction, my own runs

Working tree:

```
$ node tests/audit_prompt_reproducibility.test.js
1. the SAME domain audited twice returns the SAME prompt set
  ok - first run generates fresh (reused:false), 1 OpenAI call
  ok - second run is marked reused:true, still 1 OpenAI call total
  ok - prompt sets are byte-for-byte identical across both runs
  ok - brand name is stable across both runs, not just the prompts
...
PASS: 11 assertions
EXIT=0

$ node tests/reach_parity.test.js
     audit path (_score.js):        reach=100
     dashboard path (aiVisibilityScore.ts): reach=100
  ok - reach is identical between the audit path and the dashboard path
  ok - composite aiScore agrees: audit=74 dashboard=74
PASS: 5 assertions
EXIT=0
```

Against HEAD (`git show HEAD:<path>` extracted into `/tmp/bghead`, pointed at
via the tests' own `BG_FN_DIR` / `BG_TS_SRC` hooks):

```
$ BG_FN_DIR=/tmp/bghead/netlify/functions node tests/audit_prompt_reproducibility.test.js
FAIL: getOrGenerateAuditPrompts is not a function
EXIT=1

$ BG_FN_DIR=/tmp/bghead/netlify/functions BG_TS_SRC=/tmp/bghead/src/lib/aiVisibilityScore.ts node tests/reach_parity.test.js
     audit path (_score.js):        reach=100
     dashboard path (aiVisibilityScore.ts): reach=67
FAIL: aiVisibilityScore.ts must also exclude the unreached engine ... 67 !== 100
EXIT=1
```

`reach_parity` is a good regression test: it fails at HEAD for the right
reason, with the right numbers, and it pins both paths to one fixture so future
drift on either side breaks it. `audit_prompt_reproducibility` is weaker, see F6.

---

## 3. Reach change: who actually sees a different number

Denominators computed from `getActiveEngines(plan, null)` (transpiled from
`src/lib/planConfig.ts` in-process) against engines with `status='ok'` rows in
`ai_results`. Read-only SQL.

| Client | Plan | Old denom | New denom | Engines with a mention | reach OLD | reach NEW |
|---|---|---|---|---|---|---|
| 1 Bucate pe Roate | growth_pro | 7 | 7 | 7 | 100 | 100 |
| 2 BrandGEO | managed | 7 | 7 | 7 | 100 | 100 |
| 5 Paunescu & Asociatii | managed | 7 | 3 | 0 | 0 | 0 |
| 19 Talentwelove | managed | 7 | 1 | 0 | 0 | 0 |
| 20 Edyta Andrzejczak | growth | 5 | 5 | - | unchanged | unchanged |
| 24 Restaurante Transilvania | growth | 5 | 4 | 0 | 0 | 0 |
| 27 Alexandru Teodor | essentials | 3 | 3 | - | unchanged | unchanged |
| 52 Doctor Mihail | radar | 2 | 2 | - | unchanged | unchanged |
| 10 Research London | pro | 7 | 4 | 0 | 0 | 0 |
| 11 Research Berlin | pro | 7 | 3 | 0 | 0 | 0 |
| 28 Research Los Angeles | pro | 7 | 5 | - | unchanged | unchanged |

BpR per time window (7d / 30d / 90d / all): denominator 7 in every window,
7 engines with a mention, reach 100 old and 100 new. No window shows a delta.

**Conclusion for the billing-adjacent question: no customer communication is
required.** Not one client's reach or composite `aiScore` changes value.

Method caveat, stated rather than hidden: my SQL approximates
`buildScoreResultMap`, which additionally drops `isNoAnswerRow` rows and dedups
per prompt+engine by `checked_at`. That can only remove an engine from the
denominator, never add a mention. Since the numerator is already 0 for every
client whose denominator shrinks, the conclusion holds under the stricter
filter. I did not exercise the actual dashboard in a browser.

**On persistence:** scores are recomputed on every page load. `Dashboard.tsx:234`
and `AIVisibility.tsx:455` call `computeAiVisibilityScore` against rows queried
live from `ai_results`. No `ai_score` or `dimensions` column exists on `clients`
and nothing writes one. `prospect_audits.ai_score` is persisted, but that is the
audit path, which was already on the fixed formula. So there is no historical
value to migrate and no stale number to reconcile. Had any client's reach moved,
it would have moved silently at next page load, with no changelog. It did not.

---

## 4. Findings

### F1 — HIGH, blocking. Reuse drops the stored brand name, re-opening the 2026-07-16 false-zero defect for all 70 existing domains

**What.** `_prospect_prompts.js:290` returns `brandName: data.brand_name || null`.
The migration is additive, so every one of the 70 canonical rows already in
`prospect_audits` has `brand_name` NULL. On the first re-audit of any of those
domains, reuse fires, `brandName` comes back null,
`buildProspectAliases(domain, null)` returns the domain root alone, and
`analyseResponse` has nothing to match the real brand name against.

**Where.** `brandgeo-dashboard/netlify/functions/_prospect_prompts.js:290`
(the `brandName` line inside the reuse branch), consumed at
`brandgeo-dashboard/netlify/functions/audit-domain.js:110`.

**Exploit path / demonstration.** Reproduced by calling the real
`buildProspectAliases` and the real `analyseResponse` on a realistic engine
answer that genuinely names the brand:

```
caretlegal.com  (brand "CARET Legal")
  fresh generation  aliases=["caretlegal","CARET Legal","CARET"] -> brand_mentioned=true  position=2
  REUSED null-brand aliases=["caretlegal"]                       -> brand_mentioned=false position=null
  *** REGRESSION: a true mention becomes a false zero ***

salesmessage.com (brand "Salesmsg")  true -> false
gokickflip.com   (brand "Kickflip")  true -> false
```

The cause is `buildAliasRegex` (`_analysis.js:397-403`): it tokenises the
*alias*, so the single token `caretlegal` cannot match the text `CARET Legal`.
The `brand_website` fallback matcher builds `caretlegal[\s_.-]*com`, which does
not match either.

**Blast radius, measured.** `select count(distinct domain) from prospect_audits`
= **70**, all with `generated_prompts` non-null, all becoming canonical rows with
`brand_name` NULL. **15 of those 70 have already been re-audited at least once**,
so a re-audit is a normal event, not a hypothetical. The five domains the
2026-07-16 fix was built for are all in that set and all already re-audited:
`caretlegal.com` (6 runs), `gokickflip.com` (5), `salesmessage.com` (5),
`rebuyengine.com` (4), `revenuehunt.com` (3). Their best recorded scores are 56,
86, 86, 49, 54; after this change a re-audit drives them toward 0.

This is strictly worse than today. Today every audit regenerates and therefore
always has the brand name. The change trades that for a null. It also directly
undercuts the investigation that motivated it, which was about false zeros.

**Fix (do not apply here, hand back to `bg-backend`).** Preferred, because it
is self-healing and needs no data work: in `getOrGenerateAuditPrompts`, when the
reused row has no `brand_name`, recover it from the homepage rather than
returning null. `fetchHomepageSignal(domain)` is already exported from the same
file, costs one HTTP GET and no LLM spend, is deterministic, and its
`ogSiteName` is exactly what `generateAuditPrompts`' own fallback path uses
(`_prospect_prompts.js:156`). Sketch:

```js
let brandName = data.brand_name || null
if (!brandName) {
  const hp = await fetchHomepageSignal(domain)
  brandName = hp?.ogSiteName || null
}
```

Add an assertion to `audit_prompt_reproducibility.test.js` that a reused row
with `brand_name: null` still yields a non-null `brandName` when the homepage
declares `og:site_name`. The existing section-1 assertion cannot catch this
because its fixture writes `brand_name` on every row.

Alternative or complement: a one-time backfill of `brand_name` on the 70
canonical rows, derived offline from each domain's `og:site_name`. Slower, needs
a script, and does not protect any future row written while the column is
missing. The code fix covers both cases.

### F2 — MEDIUM. A degenerate first generation becomes permanent, with no expiry

**What.** The canonical row is fixed forever by `created_at ASC`. If the first
audit of a domain fell into `generateAuditPrompts`' fallback branch (no API key,
LLM call failed, or unparseable response), that domain is pinned to a
three-prompt, low-confidence set whose prompts embed the brand's own name:
`best companies like <root>`, `top alternatives to <root>`,
`recommended providers similar to <root>`. The system prompt at
`_prospect_prompts.js:104` explicitly forbids self-referential prompts, because
they bias mention detection upward. Screening also runs `slice(0, 4)` and would
get only 3 prompts instead of 4.

**Where.** `_prospect_prompts.js:285-292` (the reuse branch accepts any non-empty
`generated_prompts` without quality checks); fallback set at
`_prospect_prompts.js:147-157`.

**Demonstration.** Seeded a fake canonical row with the fallback set:
`reused: true | prompt count: 3 | lowConfidence: true`, prompts returned verbatim.

**Live status.** Latent, not live. Production check: 0 of 70 canonical rows have
fewer than 6 prompts, and 0 have a `category` starting `unknown`. Three canonical
rows do carry `low_confidence = true` (LLM answered but the homepage fetch
failed), which is a milder version of the same problem.

**Fix.** Decline reuse when the stored row is not a trustworthy generation:
require `generated_prompts.length >= PROMPT_COUNT` and `low_confidence !== true`
before returning it. A row failing either check falls through to a fresh
generation, which is the current behaviour, so this cannot make anything worse.

### F3 — MEDIUM. Category drift is permanent and the escape hatch has no caller

**What.** A domain that legitimately changes what it sells keeps its original
`category` and prompt set forever. The reuse branch returns `data.category`
(`_prospect_prompts.js:287`) and there is no TTL, no version, and no staleness
check. The design accepts this deliberately, which is defensible, but the only
remedy is `regeneratePrompts: true`, and nothing in the repo sends it: `rg
"regeneratePrompts"` matches only `audit-domain.js:90` and the two doc comments.
There is no admin UI, no script, and no runbook entry.

**Fix.** Not a code change. Either add the exact curl to the endpoint contract
comment at the bottom of `audit-domain.js` (which already documents the internal
contract and is the natural home), or file a follow-up for an admin control.
Recording it is enough to clear this finding; leaving it undocumented means the
escape hatch effectively does not exist.

### F4 — LOW. `created_at` ties break the canonical set non-deterministically

**What.** `.order('created_at', { ascending: true }).limit(1)` has no tiebreaker.
Two rows sharing a `created_at` leave the winner to Postgres' physical row order,
which is not stable across vacuum or replica. Ties are reachable: `created_at` is
`nowIso` generated in JS at millisecond resolution, and two concurrent first-time
audits of the same domain both find no prior row, both generate, and both insert.

**Demonstration.** Fed the same two tied rows in both insertion orders:
`insertion order A -> ['SET-ALPHA'] | insertion order B -> ['SET-BETA']` — DIVERGES.

**Live status.** 0 tie groups in production today.

**Fix.** Add `.order('id', { ascending: true })` after the `created_at` order.
`id` is the serial PK, so it is a total order and free.

Note the concurrent-first-audit race itself is benign beyond the tie: both runs
generate, both insert, one wasted `gpt-4o-mini` call (well under EUR 0.01), and
every later call converges on whichever row is earliest. No corruption.

### F5 — LOW. The insert retry matches on error text, not error code

**What.** `audit-domain.js:142` gates the retry on `/brand_name/i.test(insErr.message)`.
This works against today's PostgREST (`PGRST204` includes the column name), but
it is coupled to a message string owned by a dependency, and it would also fire
on an unrelated error that merely mentions the column, causing a second insert
attempt that fails the same way. Low risk because the read side would already
have fallen back, so this is belt-and-braces on a path that is itself a fallback.

**Fix.** Also accept `insErr.code === 'PGRST204' || insErr.code === '42703'`.

Worth recording in the change's favour: this fail-open pairing also covers the
PostgREST schema-cache window. Immediately after the migration runs, PostgREST
can still answer `PGRST204` until it reloads. Both sides survive that window.

### F6 — LOW, test quality. The reproducibility test's HEAD failure is trivial

**What.** At HEAD the test dies with `getOrGenerateAuditPrompts is not a function`
before asserting anything. That proves the symbol is new. It does not
demonstrate that the pre-fix code path was non-reproducible, which is the claim
the test exists to defend. A test that fails at HEAD because the function is
missing would fail identically if the fix were an empty stub.

**Fix.** Add a section 0 that calls `generateAuditPrompts(domain)` twice against
the same fake fetch and asserts the two prompt sets differ. That runs on both
HEAD and the working tree, and it pins the defect rather than the API surface.
The fake fetch already returns a distinct set per call, so this is a few lines.

### F7 — LOW, defensive. Reuse assumes the `{ id, text }` element shape

**What.** `data.generated_prompts.map(p => p.text)` returns `undefined` for every
element if a row ever stored bare strings. Those would be sent to the engines as
the literal string `undefined`.

**Demonstration.** Seeded a row with `generated_prompts: ['plain string one',
'plain string two']` -> `prompts: [null, null]` (JSON-serialised `undefined`),
`reused: true`. No error raised.

**Live status.** Not live. All 107 production rows are written by
`audit-domain.js:126` in `{ id, text }` shape.

**Fix.** `.map(p => (typeof p === 'string' ? p : p?.text)).filter(Boolean)` and
treat a post-filter empty array as a cache miss.

### F8 — PRE-EXISTING, not blocking. Customer-facing em dashes in `audit-domain.js`

Two error strings returned to public visitors carry em dashes:
`audit-domain.js:59` and `:70`. Both are unchanged at HEAD (19 em dashes in the
file at HEAD, same count now). Recorded per the pre-existing-defect rule; this
release is not blocked on it. Not a security exposure.

### F9 — PRE-EXISTING, not blocking. `package_provisioning.test.js` fails at HEAD

Confirmed failing on the unmodified codebase at HEAD with the same assertion
(`expected: /\.select\('plan_grant_until, plan_source'\)/`, `EXIT=1`). Not caused
by this work. Left alone, tracked separately, as instructed.

---

## 5. Migration review

`db/supabase-prospect-audits-brand-name-migration.sql`

```sql
ALTER TABLE prospect_audits ADD COLUMN IF NOT EXISTS brand_name text;
COMMENT ON COLUMN prospect_audits.brand_name IS '...';
```

**Safe to run while the audit endpoint is serving traffic. Yes, plainly.**

- **Additive.** One nullable column, no `NOT NULL`, no `DEFAULT`, no backfill,
  no retype, no drop, no index, no constraint. Existing rows get NULL.
- **Idempotent.** `ADD COLUMN IF NOT EXISTS` is a no-op on re-run. `COMMENT ON`
  is inherently idempotent. Safe to re-run, matching the rest of `db/`.
- **Lock profile.** `ADD COLUMN ... text` with no default is a catalogue-only
  change in modern Postgres. It takes `ACCESS EXCLUSIVE` for the duration, but
  the duration is sub-millisecond and no table rewrite occurs. On a 107-row
  table this is not measurable.
- **Rollback.** Documented in the header and correct:
  `ALTER TABLE prospect_audits DROP COLUMN IF EXISTS brand_name;`. The code
  treats NULL/missing identically to "no brand name found", so a rollback
  degrades rather than errors.
- **Ordering.** The header's claim that either deploy order is safe is verified
  (criteria 9 and 10), including the PostgREST schema-cache window.
- **No RLS change, no policy change, no grant.** Correct. `prospect_audits` is
  written by the service key only.

One correction to the header text, cosmetic: it says the fix "is inert until
this migration is applied". That is true of *brand-name* reuse. Prompt-set reuse
is inert too, but only because the same `SELECT` names `brand_name` and so the
whole query errors. If a future edit drops `brand_name` from that select list,
prompt reuse would silently activate pre-migration. Worth a note in the comment.

---

## 6. Regression surface, found by grep

`getOrGenerateAuditPrompts` has exactly one caller: `audit-domain.js:28,91`.
`generateAuditPrompts` remains exported and is now called only from inside
`_prospect_prompts.js`. No other function imports either.

Paths that need a manual look before deploy:

- `brandgeo-dashboard/netlify/functions/run-full-audit-background.js:83-89`.
  Reads `audit.generated_prompts` off the row `audit-domain.js` wrote, and takes
  `brand_aliases` / `brand_name` from the POST body threaded through
  `audit-domain.js:175`. **This is the second victim of F1**: on a FULL-depth
  re-audit of an existing domain, the aliases it receives are the collapsed
  domain-root-only list. Same regression, one hop further out.
- `brandgeo-dashboard/netlify/functions/get-audit-report.js`. Renders the stored
  row publicly at `app.getbrandgeo.com/audit/<token>`. Does not read
  `brand_name`, so no change, but it is the surface where an F1-caused false zero
  becomes visible to a prospect.
- `brandgeo-dashboard/src/pages/Dashboard.tsx:234-235` and
  `AIVisibility.tsx:455`. The only two callers of `computeAiVisibilityScore`.
  Both recompute on load; both were checked (section 3).
- `brandgeo-dashboard/netlify/functions/_score.js:69-74`. Unchanged, now pinned
  by `reach_parity.test.js`. Any future edit there breaks the test, which is the
  intent.
- `brandgeo-dashboard/tests/no_answer_rows.test.js`. Uses the same in-process TS
  transpile technique against `aiVisibilityScore.ts`. Not re-run by me (see
  section 8).

`_revenue.js`, `revenue-report.js` and `Revenue.tsx` were excluded as
out-of-scope per the packet. I did not read or assess them. They are still
uncommitted and still carry the 65 em dashes recorded in `CLAUDE.md`.

---

## 7. Data and claim integrity

Every number in the changed comments traces:

- "revenuehunt.com scored 54 and 0, sharing only 1 of 6 prompts" — matches
  `prospect_audits` for that domain: 3 runs, `max(ai_score)=54`, `min(ai_score)=0`.
  Traced to `docs/qa/audit-scoring-investigation-2026-08-14.md §4`.
- "gpt-4o-mini at temperature 0.4" — `_prospect_prompts.js:115-116`. Correct.
- "the exact defect #109 removed from `_score.js`" — `_score.js:62-74` carries
  the #109 comment and the fixed formula. Correct.
- "4 real domains" in the 2026-07-16 comment — all four exist in
  `prospect_audits` with the claimed divergence pattern. Correct.
- Test file claim "8/8 engine coverage" on both revenuehunt runs — not
  independently verified by me; it comes from the investigation doc, which is in
  scope_read. Traceable, not re-derived.

No new customer-facing copy was added. No new user-facing number was introduced.
No untraceable claim found.

## 7b. Logging

`audit-domain.js:111` now appends `prompts:${generated.reused ? 'reused' : 'generated'}`
to a line that already logged the brand name and aliases. That is a two-value
enum, not data. `_prospect_prompts.js:284,295` log `error.message` only. No
prompt set, no response text, no email, no IP, no key is logged anywhere in the
diff. The pre-existing `requester_ip_hash` remains a hash. Clean.

---

## 8. What was NOT checked

- **No browser verification.** I did not load `app.getbrandgeo.com` or render a
  dashboard at any viewport. Section 3's conclusion is computed from production
  rows plus the real scoring code, not observed on screen.
- **No live audit run.** Per instruction, no call to `audit-domain` was made, so
  the reuse path has never executed against real Supabase. Everything in section
  4 comes from probes against a hand-built fake of the query builder that
  implements exactly the five methods the module calls. A PostgREST behaviour I
  modelled wrongly would not be caught.
- **`.maybeSingle()` semantics not confirmed against the installed supabase-js.**
  I reasoned that `.limit(1)` makes the multiple-rows error unreachable; I did
  not read the library source or test it.
- **Other tests in `brandgeo-dashboard/tests/` were not run**, including
  `no_answer_rows.test.js`, which shares the transpile technique with
  `reach_parity.test.js` and touches the same TS file. Only the two new tests
  and `package_provisioning.test.js` were executed.
- **The migration was not run**, in any environment. Section 5 is a source
  review plus Postgres semantics, not an applied-and-observed result.
- **No accessibility review.** The change adds no UI, no interactive element, no
  text-on-surface pair, no heading. `aiVisibilityScore.ts` is a pure function
  and `Dashboard.tsx` / `AIVisibility.tsx` were not modified. Nothing to measure.
  If the reach number had moved, the rendered digit would still occupy the same
  node with the same tokens.
- **`_revenue.js`, `revenue-report.js`, `Revenue.tsx`** — excluded by the packet,
  not read.
- **F1's blast radius is bounded by domain count, not by score delta.** I proved
  the mechanism on three domains with synthetic-but-faithful engine text. I did
  not replay each of the 70 domains' stored `engine_results` through both alias
  sets, so I cannot say how many of the 70 diverge in practice, only that at
  least the five named ones will.
- **Time-window interaction with `isNoAnswerRow`** was reasoned about, not
  executed (section 3 caveat).

---

## 9. Verdict

**FAIL.**

Not because anything here is careless. The reach fix is correct, minimal,
correctly scoped, provably harmless to every live client, and comes with a
regression test that fails at HEAD for the right reason. The migration is safe.
The internal-only gate on `regeneratePrompts` holds. Both fail-open claims are
true and I verified them rather than accepting them. The diff introduces zero em
dashes and zero secrets.

It fails on one thing: **F1**. The reuse path drops the brand name for all 70
domains already in `prospect_audits`, and I reproduced a true mention becoming a
false zero on `caretlegal.com`, `salesmessage.com` and `gokickflip.com` — three
of the five domains the 2026-07-16 fix exists for, all of which have already
been re-audited multiple times. A change whose purpose is score integrity cannot
ship while it reintroduces the false-zero class of defect on the public audit
that sits on the homepage and backs the founder-led sales motion.

**Safe to push and deploy when, and only when:**

1. **F1 is closed** by recovering `brandName` from `fetchHomepageSignal(domain)`
   when a reused row has no `brand_name`, with a test asserting that a reused
   `brand_name: null` row still yields a non-null brand name. Re-review required;
   this is the one condition.
2. F2 is closed by declining reuse when `low_confidence` is true or the stored
   set has fewer than `PROMPT_COUNT` prompts. Cheap, and it removes the whole
   degenerate-pin class rather than relying on today's clean data.
3. F4 is closed by adding `.order('id', { ascending: true })` as a tiebreaker.
   One line.
4. F3, F5, F6 and F7 are recorded as follow-ups. None of them blocks.
5. The migration is run **before** the code deploy. Either order is safe, as the
   builder says and as I verified, but running it first means the fix is live the
   moment the deploy lands rather than sitting inert.

**Ship-now carve-out.** `src/lib/aiVisibilityScore.ts` and
`tests/reach_parity.test.js` are independent of the audit path and clear every
criterion. If the sprint needs something today, that half can be committed and
deployed on its own with no further review, and it changes no customer's number.

No HUMAN CHECKPOINT is raised. No live security exposure, no secret in the diff,
no billing surface touched, and no file changed outside the declared scope.

---
---

# RE-REVIEW, 2026-08-14 (second pass) — FAIL LIFTED, one new blocking finding

Scoped re-review of `bg-backend`'s response to the FAIL above. Not a fresh full
review. Read-only. No reviewed file was edited.

**F1 is genuinely closed.** The recovery path works, it is tested, and the new
test fails pre-fix for a real behavioural reason rather than a missing symbol,
which was my objection to the first test. F4 is closed correctly. **The original
FAIL is lifted.**

**But this round introduced a new blocking defect of its own, and it is live.**
F2's fix declines reuse whenever the canonical row has `low_confidence === true`.
Three of the 70 production canonical rows are exactly that, and none of them is
degenerate: `brevo.com`, `jetpackworkflow.com` and `antidote.legal` each have a
full 6-prompt set and a real category. Those three domains now regenerate their
prompt set through `gpt-4o-mini` at temperature 0.4 on **every single audit,
forever** — never reproducible, one LLM call every time. That is precisely the
defect this whole change exists to eliminate, reintroduced on 3 domains by the
guard meant to prevent it. Detail in R1.

There is also a permanent, unbounded fragility that was not flagged: the
recovered brand name is never written back to the canonical row, so all 70
pre-migration domains pay an extra HTTP GET on every audit forever, and their
reproducibility now depends on that fetch succeeding. R2 and R3.

---

## R0. Confirmations

| Check | Result | Evidence |
|---|---|---|
| `aiVisibilityScore.ts` untouched | CONFIRMED | `git diff --numstat` -> `20 3` on that file, identical to the first pass. Not re-reviewed. |
| `reach_parity.test.js` untouched and still green | CONFIRMED | `node tests/reach_parity.test.js` -> `PASS: 5 assertions`. |
| `audit-domain.js` unchanged this round | CONFIRMED | `git diff --stat` still `36 ++-`, same as the first pass. |
| Sections 5 and 6 pass on the working tree | CONFIRMED | `PASS: 14 assertions`, `EXIT=0` (was 11). |
| Sections 5/6 fail pre-fix **behaviourally** | CONFIRMED | See R0a. |
| No em or en dashes added | CONFIRMED | Added-lines grep -> exit 1. New test file and migration -> exit 1. |
| No secrets added | CONFIRMED | One hit, the `.select('id, token')` column list; test placeholder unchanged. |
| `npx tsc --noEmit` | PASS | `TSC EXIT=0`. |
| `npm run build` | PASS | `✓ built in 5.55s`, `BUILD EXIT=0`. |
| F4 tiebreaker present | CONFIRMED | `_prospect_prompts.js:300-301`, `.order('created_at', ...)` then `.order('id', { ascending: true })`. Correct: `id` is the serial PK, a total order. |

### R0a. The pre-fix failure is now a real one

My original objection stands corrected for this case. I reconstructed the
pre-F1-fix state by copying the *current* functions directory and reverting only
the recovery block back to `brandName: data.brand_name || null`, leaving the F2
and F4 guards in place, so the only variable is the recovery path.

```
########## PRE-F1-FIX ##########
1..4  all ok
5. a reused row with brand_name NULL still recovers a usable brand name (F1)
  ok - reused prompt set returned, no LLM call spent recovering the brand name
FAIL: a null stored brand_name must be recovered from the homepage og:site_name,
      not passed through as null
+ actual - expected
+ null
- 'Test Brand'
EXIT=1
```

Sections 1 to 4 pass, section 5 fails on a value comparison. That is a targeted
behavioural failure, not `is not a function`. Good test.

**Method note, and a correction to my own first pass.** Git Bash rewrites
POSIX-looking paths in environment variables into Windows paths before handing
them to `node`, but does not rewrite path literals inside a `node -e` script
body. I checked whether that invalidated my first-pass HEAD runs: it did not.
`BG_FN_DIR=/tmp/bghead/...` arrives at node as
`C:/Users/const/AppData/Local/Temp/bghead/...`, the directory exists, and
`grep -c getOrGenerateAuditPrompts` on the file it loaded returns 0, confirming
it really was the pre-fix copy. The first pass's evidence stands.

---

## R1 — HIGH, blocking. F2's `low_confidence` guard destroys reproducibility for 3 live domains

**What.** `_prospect_prompts.js:307-312` declines reuse when
`data.low_confidence !== true` is false, i.e. whenever the canonical row was
flagged low-confidence. `low_confidence` is set by `generateAuditPrompts` when
the *homepage fetch* failed, **not** when the generation was degenerate. A
low-confidence row can still hold a full, perfectly good 6-prompt set produced by
the LLM from the domain name.

The degenerate case the guard is actually aimed at, the 3-prompt self-referential
fallback, is already fully caught by the sibling condition
`data.generated_prompts.length >= PROMPT_COUNT`. The `low_confidence` clause adds
no coverage and costs reproducibility.

**Where.** `brandgeo-dashboard/netlify/functions/_prospect_prompts.js:311`.

**Live blast radius, measured.** Read-only SQL over the canonical row of every
domain (`row_number() over (partition by domain order by created_at asc, id asc)`):

| Domain | Runs | Prompts | low_confidence | Category |
|---|---|---|---|---|
| `brevo.com` | 1 | 6 | true | email marketing software |
| `jetpackworkflow.com` | 1 | 6 | true | workflow management software |
| `antidote.legal` | 1 | 6 | true | legal services |

Zero canonical rows have fewer than 6 prompts. So **every row this guard rejects
is a false positive**: 3 rejected, 0 of them degenerate.

**Demonstration.** Seeded a canonical row with `low_confidence: true` and a full
6-prompt set, then called three times:

```
call 1: reused=false llmCalls=+1 prompts[0]=FRESH-1-p0
call 2: reused=false llmCalls=+1 prompts[0]=FRESH-2-p0
call 3: reused=false llmCalls=+1 prompts[0]=FRESH-3-p0
```

Three calls, three different prompt sets, three LLM calls. This is the exact
"row written that will always be declined on read, and so regenerates every
time" loop the re-review brief asked me to rule out. It is not hypothetical and
it is not latent: it is live on 3 domains today, and it is self-perpetuating,
because a regeneration whose homepage fetch fails writes another
`low_confidence: true` row, which would also be declined if it were ever canonical.

**Fix.** Drop the `low_confidence` clause. Keep
`data.generated_prompts.length >= PROMPT_COUNT`, which catches the degenerate
path precisely and rejects nothing else. If a stronger signal is wanted, gate on
`category` starting `unknown` instead, which is the other marker the degenerate
branch sets (`_prospect_prompts.js:149`) and which no real generation produces:
0 of 70 canonical rows carry it. Then add a test asserting that a
`low_confidence: true` row **with a full prompt set** is still reused.

## R2 — MEDIUM. Recovery is never persisted, so the extra fetch and its fragility are permanent

**What.** When recovery succeeds, the brand name is returned but never written
back to the canonical row. `audit-domain.js:122` writes `brand_name` onto the
**new** row it inserts, but that row is never canonical: the lookup orders by
`created_at ASC`, so the earliest, `brand_name: NULL` row wins forever.

**Demonstration.** After a successful recovery, `canonical row brand_name` is
still `null`.

**Consequence.** For all 70 pre-migration domains, every audit forever performs
an extra `fetchHomepageSignal(domain)` that a single write-back would make
unnecessary. Nothing in the codebase can ever clear this: `regeneratePrompts`
appends a new row rather than updating the earliest one, so **the documented
escape hatch cannot fix it either**. This is not a transitional cost that decays
as the table fills with post-migration rows; it is permanent for those 70.

**Fix.** Either write the recovered `brand_name` back onto the canonical row
(one `update ... eq('id', data.id)`, requires adding `id` to the select list), or
run a one-time backfill of `brand_name` on the 70 canonical rows from each
domain's `og:site_name`. The write-back is self-healing and covers rows written
in the pre-migration window; the backfill does not.

## R3 — MEDIUM. Reproducibility for pre-migration domains now depends on a live HTTP fetch

**What.** Because recovery is required on every audit of a pre-migration domain
(R2), and because recovery failing abandons reuse entirely, a transient homepage
failure now silently produces a fresh prompt set and therefore a different score.

**Demonstration.** Same canonical row, three consecutive audits, toggling only
the homepage:

```
run1 (homepage up)   reused:true  prompts[0]: CANONICAL-p0
run2 (homepage down) reused:false prompts[0]: FRESH-0-p0   lowConfidence: true
run3 (homepage up)   reused:true  prompts[0]: CANONICAL-p0
```

Run 2 is the defect the change exists to prevent: same domain, different prompts,
different score, triggered by a network blip on the prospect's own site rather
than by anything we decided.

**Assessment.** This is a narrower failure window than the pre-fix behaviour
(which regenerated on *every* call, not just when the homepage was down), so it
is a clear improvement and not a regression against HEAD. But it is a real
weakening of the guarantee the module's own doc comment makes ("once written,
the prompts for a domain do not change"). That claim is now false for all 70
pre-migration domains. Fixing R2 closes this too, which is the main argument for
the write-back over the backfill.

**Fix.** R2's write-back. Additionally, soften the abandon rule: a reused prompt
set with an unrecoverable brand name is still a better measurement than a fresh
prompt set with an unrecoverable brand name, because at least the prompts are
stable. Consider reusing the prompts and accepting `brandName: null` **only**
when the recovery attempt failed for a transport reason (fetch threw or
non-200), while keeping the current abandon behaviour when the page loaded fine
and simply carries no `og:site_name`. The current code cannot distinguish these:
`fetchHomepageSignal` returns `null` for both.

## R4 — MEDIUM. Double homepage fetch pushes the screening path toward the 26s ceiling

**What.** When recovery fails, `getOrGenerateAuditPrompts` falls through to
`generateAuditPrompts(domain)`, which calls `fetchHomepageSignal(domain)` a
second time. The two run in series and neither result is shared.

`fetchHomepageSignal` tries `https://` then `http://`, each with a 6000 ms
timeout (`_prospect_prompts.js:33`), so one call is up to 12 s and two are up to
24 s. `netlify.toml:138-139` gives `audit-domain` a 26 s timeout, and the
screening path then still has to run its engine calls synchronously inside what
is left. Worst case the function is consumed by prompt generation alone and dies
before a single engine is called, with no `prospect_audits` row written at all,
because the insert happens after this block.

Pre-fix worst case was one 12 s fetch plus the LLM call. This roughly doubles the
pre-engine budget on the audit that sits on the homepage.

**Live status.** Not observed; I ran no live audit. The probe used a mock that
rejects immediately, so my measured `elapsed=248ms` is not evidence about
production latency. This is a code-path and configuration reading, and I am
flagging it as a risk rather than a confirmed outage.

**Fix.** Thread the already-fetched signal through: give `generateAuditPrompts`
an optional second parameter for a pre-fetched `homepage`, and pass the recovery
attempt's result into it. Removes the duplicate network round-trip entirely and
also removes the wasted GET in R2.

## R5 — LOW. Recovered `og:site_name` can be a worse alias than a fresh generation would produce

**What.** Recovery uses raw `og:site_name` only. A fresh generation prefers the
LLM's reading and uses `og:site_name` only as a fallback
(`_prospect_prompts.js:132`). So on a site whose `og:site_name` is a tagline
rather than a brand name, recovery yields a worse alias set than the code it
replaces would have.

**Demonstration.** `buildProspectAliases` splits a multi-word name and adds its
lead word as a separate alias, and `LEADING_WORD_STOPWORDS` does not contain
`Home`:

```
og="Home | Best CRM Software for Teams"
   aliases=["acme","Home | Best CRM Software for Teams","Home"]
   brand_mentioned on a response that never names Acme: true  <-- FALSE POSITIVE
og="Welcome to Acme"   aliases=["acme","Welcome to Acme","Welcome"]  -> false
og="Acme Corp"         aliases=["acme","Acme Corp"]                  -> false
```

The `Home` alias matches the word "home" anywhere in a response, so the brand is
scored as mentioned when it was never named. This inflates rather than deflates,
the opposite direction from F1, but it is still wrong data on a sales asset.

**Assessment.** The same weakness already exists in `generateAuditPrompts`'
own fallback, so this is pre-existing in kind. What is new is that recovery makes
the raw-`og:site_name` path the *primary* one for 70 domains, where today the LLM
inference almost always wins. Low severity because it needs a tagline-shaped
`og:site_name`, which I did not measure across the 70.

**Fix.** Cheap and contained: extend `LEADING_WORD_STOPWORDS` with the common
tagline lead words (`home`, `welcome`, `best`, `top`, `official`), and skip the
lead-word alias when the recovered name contains `|`, `-` or `:` separators or
exceeds roughly four words, which is a reliable tagline tell.

## R6 — Confirmed safe: the audit always completes

Ruling out the brief's failure modes explicitly. Every mode completes and returns
a usable 6-prompt set:

```
mode=403      completed=true reused=false prompts=6 lowConfidence=true
mode=noog     completed=true reused=false prompts=6 lowConfidence=false
mode=timeout  completed=true reused=false prompts=6 lowConfidence=true
```

The recovery `try/catch` at `_prospect_prompts.js:330-335` swallows a throw and
the outer `try/catch` at `:364` catches anything else. No path propagates. The
only residual risk is the latency budget in R4, not correctness.

## R7 — Migration text

The two corrected notes are accurate. Line 39's addition and lines 55-58 now
state that the code no longer degrades gracefully to a null brand name, matching
the F1 fix, and line 45 records that `brand_name` must not be removed from the
select list without re-checking the fail-open behaviour. Both were stale points I
raised; both are now correct. The SQL itself is unchanged and remains safe to run
on a live table.

One residual inaccuracy: the ROLLBACK note says dropping the column "only turns
off reuse of the brand name". After the F1 fix, dropping the column makes the
lookup error, which fails open to always-regenerate. The rollback is still safe,
but its stated consequence is now understated.

## R8 — Status of the three LOW findings the builder did not address

Asked explicitly whether this round made any of them worse.

- **F3 (category drift is permanent; the escape hatch has no caller).**
  **More serious, though still not blocking.** R2 shows `regeneratePrompts`
  cannot repair a canonical row's null `brand_name`, because it appends rather
  than updates. So the escape hatch is now the documented remedy for a problem it
  provably cannot solve, and it still has no caller anywhere in the repo
  (`rg "regeneratePrompts"` matches only `audit-domain.js:90` and two comments).
  Worth an explicit line in the endpoint contract saying what it does and does
  not fix.
- **F5 (insert retry matches on error message, not code).** Unchanged.
  `audit-domain.js` was not modified this round.
- **F7 (reuse assumes the `{ id, text }` element shape).** Unchanged in severity.
  The new `length >= PROMPT_COUNT` guard checks array length, which a bare-string
  array also satisfies, so it does not incidentally close F7. Still not live: all
  107 production rows are written in `{ id, text }` shape.

---

## Re-review verdict

**The original FAIL is LIFTED. A new FAIL is raised on R1.**

F1 is properly closed: recovery works, it is honestly tested, and the test fails
pre-fix for the right reason. F4 is closed correctly. The migration notes are
fixed. `aiVisibilityScore.ts` and `reach_parity.test.js` are untouched and still
green. Build, tsc, dash and secret checks are all clean. The quality of the
response to the first review was high, and R2 through R5 are the kind of finding
that only appears once the fix exists.

R1 blocks because it is live, not latent, and because it fails in the change's
own terms: three real domains, including `brevo.com` and `jetpackworkflow.com`,
would regenerate their prompt set on every audit forever, which is the defect
this work set out to remove. The guard rejects 3 rows and 0 of them are the
degenerate case it was written for.

**Safe to push and deploy when, and only when:**

1. **R1 is closed** by dropping the `low_confidence` clause at
   `_prospect_prompts.js:311` and keeping the `length >= PROMPT_COUNT` check
   (optionally adding a `category like 'unknown%'` check), with a test asserting
   a `low_confidence: true` row holding a full prompt set is still reused. This
   is a one-condition, few-line change. Re-review can be a diff read, not a full
   pass.
2. **R2 is closed** by writing the recovered `brand_name` back to the canonical
   row. This also closes R3 and removes the wasted fetch in R4. If it is deferred,
   say so deliberately and correct the module doc comment, which currently claims
   a stability guarantee that does not hold for the 70 pre-migration domains.
3. R4's double fetch is closed by threading the pre-fetched homepage signal into
   `generateAuditPrompts`. Recommended in the same change as R2, since it is the
   same few lines.
4. R5, F3, F5 and F7 are recorded as follow-ups. None blocks.
5. The migration is run **before** the code deploy, unchanged from the first pass.

**Ship-now carve-out, unchanged and still valid.**
`src/lib/aiVisibilityScore.ts` and `tests/reach_parity.test.js` are byte-identical
to what I passed in the first review, are independent of the audit path, and
change no customer's number. That half can be committed and deployed today.

## What was NOT checked this round

- No live audit was run; no `audit-domain` invocation of any kind. R4's latency
  claim is read from `netlify.toml:139` and the 6000 ms timeout at
  `_prospect_prompts.js:33`, not measured against production.
- `audit-domain.js` was re-diffed but not re-reviewed; it did not change.
- `aiVisibilityScore.ts` and `reach_parity.test.js` were confirmed unchanged and
  deliberately not re-read.
- I did not measure how many of the 70 domains have a tagline-shaped
  `og:site_name`, so R5's real-world frequency is unknown.
- The migration still has not been run in any environment.
- No browser verification, no accessibility review. Neither applies: no UI
  changed this round.
- `_revenue.js`, `revenue-report.js` and `Revenue.tsx` remain out of scope and
  unread.

---
---

# THIRD PASS, 2026-08-15 — FAIL LIFTED. Clear to push, in the order below.

Scoped third pass over `bg-backend`'s response to R1, R2, R4 and R5. Read-only.
No reviewed file was edited, no git write command run, no audit invoked.

**All four findings are genuinely closed, and I proved each one pre-fix from the
committed suite alone.** The builder's deleted standalone scripts were not needed:
the first-failure stop does not mask anything, because reverting one fix at a time
leaves every earlier section green and fails exactly at the section under test.
No new blocking defect. **The FAIL is lifted.**

Two things worth recording before deploy, neither blocking. The fix delivers its
reproducibility guarantee to **38 of the 70 existing domains, not 70**, and the
reason is structural rather than accidental (T1). And the false-positive class R5
was raised about is closed at the sanitiser but still open one layer down in
`buildProspectAliases`, which I measured producing a false mention on two real
production domains (T2) — pre-existing, unchanged by this diff, not a reason to
hold the release.

---

## T0. Scope and confirmations

| Check | Result | Evidence |
|---|---|---|
| Only `_prospect_prompts.js` and the test changed | CONFIRMED | `audit-domain.js` numstat `31 5`, identical to pass 1 and 2. |
| `aiVisibilityScore.ts` untouched | CONFIRMED | md5 `7717a6d4...`, unchanged across all three passes. Not re-reviewed. |
| `reach_parity.test.js` untouched and green | CONFIRMED | md5 `71d63c26...`; `PASS: 5 assertions`. |
| Migration untouched | CONFIRMED | md5 `6ae2af10...`. Already reviewed and passed. |
| Full suite green | CONFIRMED | `PASS: 23 assertions`, `EXIT=0`. |
| No em or en dashes added | CONFIRMED | Added-lines grep exit 1; test file whole-file grep exit 1. |
| No secrets added | CONFIRMED | Added-lines scan exit 1. The test's placeholder assignment is unchanged from pass 1. |
| `npx tsc --noEmit` | PASS | `TSC EXIT=0`. |
| `npm run build` | PASS | `✓ built in 5.54s`, `BUILD EXIT=0`. |

---

## T1a. Sections 7, 8 and 9 reproduced pre-fix, isolated

The concern was that a deleted script is not evidence. It is not needed. I built
three variants of `_prospect_prompts.js`, each reverting exactly one fix and
nothing else, and ran the **committed** suite unmodified against each:

| Variant | Revert applied | Sections passing | Fails at | Failure message |
|---|---|---|---|---|
| `prevR1` | re-added `&& data.low_confidence !== true` | 1-6 | **7** | `a low_confidence row with a full prompt set must still be reused (call 1)` |
| `prevR5` | `brandName = preFetchedHomepage?.ogSiteName \|\| null` | 1-7 | **8** | `a tagline-shaped og:site_name must not be accepted as a brand name` |
| `prevR2` | write-back block deleted | 1-8 | **9** | `must be written back onto the CANONICAL row` `+ null - 'Test Brand'` |

Each fails at its own section, for a value or behaviour reason, with every
earlier section green. The first-failure stop masks nothing here. **Sections 7,
8 and 9 are real proof, reproducible by anyone from the committed suite.**

One note on section 8's strength. Its load-bearing assertion is
`result.reused === false`, which is genuine. Its follow-up alias assertion is
weaker than it looks: after reuse is abandoned the fresh generation supplies
`Test Brand`, so the observed aliases are `[taglinebrand-example, Test Brand,
Test]` and the absence of `Home` is partly an artifact of the mock rather than
of the sanitiser. Not a defect, but the sanitiser itself is better tested
directly, and `sanitizeRecoveredBrandName` is now exported, so a table-driven
unit test over it would be cheap. Recorded as a suggestion, not a finding.

## T1b. R1 regression check

**The degenerate case is still caught.** With the `low_confidence` clause gone,
a canonical row holding the 3-prompt self-referential fallback set is still
declined by the surviving length check: `PROMPT_COUNT=6`, stored set has 3,
`reused=false`. Correct.

**But only one of the three named domains actually reuses now**, and this
corrects the premise I was given. Using each domain's real, live `og:site_name`:

| Domain | Real `og:site_name` | Sanitised | Reuses now? |
|---|---|---|---|
| `jetpackworkflow.com` | `Jetpack Workflow` | `Jetpack Workflow` | **yes, reproducible** |
| `brevo.com` | none | null | no, still regenerates every audit |
| `antidote.legal` | none | null | no, still regenerates every audit |

R1 itself is properly fixed: the `low_confidence` clause no longer rejects them.
`brevo.com` and `antidote.legal` are now blocked by a different gate, the
recovery-failure abandon, which is T1c. Neither is worse than HEAD.

## T1c — MEDIUM, not blocking. The guarantee reaches 38 of 70 domains, not 70

**What.** The write-back sits inside `if (brandName)`. When recovery finds
nothing usable, reuse is abandoned, a fresh generation runs, and **nothing is
persisted to the canonical row**. `audit-domain.js:122` writes `brand_name` onto
the new row it inserts, but that row is never the earliest one. So the canonical
row stays NULL, recovery is attempted again on the next audit, fails again for
the same reason, and the domain regenerates forever. The failure is
self-perpetuating rather than self-healing, which is the opposite of the
write-back's intent.

**Measured, not reasoned.** I fetched the live homepage of all 70 canonical
domains with the product's own `fetchHomepageSignal`, then ran the real
sanitiser over each result:

| Outcome | Count | Share |
|---|---|---|
| `og:site_name` present and accepted | 38 | 54% |
| `og:site_name` present but rejected by the sanitiser | 4 | 6% |
| No `og:site_name`, or homepage unreachable | 28 | 40% |

**32 of 70 domains (46%) can never satisfy recovery**, so they never persist a
brand name, never reuse, and pay a `gpt-4o-mini` call on every audit
permanently. Among them: `brevo.com`, `hubspot.com`, `getresponse.com`,
`mailerlite.com`, `drip.com`, `klaviyo.com`'s peers, `salesmessage.com` and
`rebuyengine.com` — two of the five domains the 2026-07-16 fix is named for.

**Assessment: not a regression, and not blocking.** At HEAD, 100% of domains
regenerated on every call. After this change, 54% do not. That is a real
improvement and shipping it is strictly better than not shipping it. What it is
not is the guarantee the module now advertises.

**Doc accuracy.** The rewritten comment says the brand name "closes permanently,
per domain, the first time recovery works". Literally true, but it omits that for
46% of the existing corpus recovery cannot work at all, so "the first time" never
arrives. One sentence would fix the omission.

**Fix, cheap and complete.** On the fallback path, write the fresh generation's
`brandName` back to the canonical row as well, not just the recovery path's. The
LLM result is at least as good as a raw `og:site_name`, `data.id` is already in
scope, and the guard is the same `!data.brand_name`. That closes all 70 domains
after one audit each instead of 38, and removes the permanent regeneration for
the other 32. Recommended as a fast follow rather than a gate.

## T2 — MEDIUM, PRE-EXISTING. The false-positive class R5 named is still open one layer down

> ⚠️ **CLOSED 2026-08-15 by `4db937f`, and this section is WRONG in two places.**
> Corrected in place rather than rewritten, per CLAUDE.md's mark-stale-where-it-
> occurs convention. Read this box before believing anything below it.
>
> **Correction 1. `financial-cents.com` is NOT a false positive.** The block
> below asserts a response "naming only Karbon/Canopy/Jetpack". Its actual stored
> `engine_results` (audit 33) say the opposite: all three of its mentions name the
> brand in full, for example "**Financial Cents** is a user-friendly, cloud-based
> system" and "**Karbon**, **TaxDome**, **Financial Cents**, and **Canopy**".
> Those mentions are TRUE and they survive the fix via the full-name alias. This
> finding appears to have been reasoned from a constructed response rather than
> read off the stored one.
>
> **Correction 2. The worst case was missed, and the sampling frame is why.**
> `unittrac.com` (self-storage software, LLM-derived name "Unit Trac") carried
> **6** false positives on the bare word "unit", in "per unit per month" and
> "unit availability", against `casetempo.com`'s 6. It never appeared here
> because it has no `og:site_name` and so sat outside the 38 values this review
> sampled. The name is established, not guessed: a one-word `UnitTrac` alias set
> reproduces 0 of its 7 stored matches, `Unit Trac` reproduces 7 of 7. Its public
> audit (row 95) published `ai_score` **85**; `casetempo.com` (row 70) published
> **68**. Both are `unlocked: true, created_via: 'internal'`, so both are
> publicly renderable sales assets.
>
> **The measurement that settled it**, replaying all 165 stored results carrying
> `brand_mentioned = true` with the alias set rebuilt before and after:
>
> ```
> guard is a no-op (alias set identical) ........... 101
> mention rests on the domain root, name irrelevant . 48
> guard changed the alias set ......................  16
>    still counts as a mention ......................  4   <- all 4 name the brand
>    STOPS counting ................................. 12   <- 0 name the brand
> ```
>
> **12 false positives removed, 0 true mentions broken.**
>
> **The suggested fix below was not taken, and should not be.** "At least 5
> characters and absent from a small generic list" fails on its own examples:
> "Financial" is 9 characters, and `Rebuy` (5) and `CARET` (5) are legitimate and
> must survive, so no length threshold separates the cases. A nine-word hand list
> is also the wrong shape for an unbounded problem that never self-reports.
> `4db937f` uses a commonness test instead (`isDistinctiveLeadWord` plus
> `GENERIC_LEAD_WORDS`), on the reasoning that a lead-word alias's value and its
> risk move in opposite directions with commonness: an engine calls Rebuy Engine
> "Rebuy" precisely because that identifies it, and never calls Case Tempo "Case".
> A word absent from the list is treated as distinctive, so an incomplete list
> degrades to today's behaviour on that one word and never to a false zero.
> Guarded by `tests/prospect_alias_lead_word.test.js` (43 assertions), which
> asserts against verbatim stored snippets from rows 70 and 95.

**What.** `sanitizeRecoveredBrandName` cleans the *input*. It does not change
`buildProspectAliases`, which still splits a multi-word name and emits the lead
word as a standalone alias, filtered only by `LEADING_WORD_STOPWORDS`
(`the, get, my, your, a, an, go, try`). A perfectly valid two-word brand whose
first word is a common noun therefore still produces a generic alias.

**Demonstrated on real production `og:site_name` values, not invented ones:**

```
casetempo.com       og="Case Tempo"       aliases=["casetempo","Case Tempo","Case"]
   response naming only Clio/MyCase/Smokeball -> brand_mentioned=true   *** FALSE POSITIVE ***
financial-cents.com og="Financial Cents"  aliases=["financial-cents","Financial Cents","Financial"]
   response naming only Karbon/Canopy/Jetpack -> brand_mentioned=true   *** FALSE POSITIVE ***
   ^^ WRONG, see the correction box above. Its stored responses DO name
      "Financial Cents" in full. All 3 mentions are true and they survive.
caretlegal.com      og="CARET Legal"      aliases=["caretlegal","CARET Legal","CARET"]
   same shape of response                     -> brand_mentioned=false  ok
MISSING FROM THIS TABLE, and the worst case:
unittrac.com        og=none, LLM="Unit Trac"  aliases=["unittrac","Unit Trac","Unit"]
   6 stored responses naming only competitors -> brand_mentioned=true   *** FALSE POSITIVE ***
```

`casetempo.com` is legal-practice software, so "case" appears in essentially every
relevant engine answer. Rate among the 38 accepted values: **2 demonstrably
inflate (5.3%)**. [Corrected 2026-08-15: 1 of those 2 inflates, not 2, and the
38-value frame excludes the 32 domains with no `og:site_name`, one of which
carried the largest count of all. Measured on stored mentions rather than on
sampled names, the answer is 12 inflated results across 2 domains.] Inflation is
the more dangerous direction, since a rejection
merely costs an LLM call while a false acceptance puts a wrong number on a public
sales asset.

**Why it is not blocking, and not attributable to this change.** Pre-fix, a
pre-migration domain regenerated through the LLM, which would also return
`"Case Tempo"`, producing the identical alias list and the identical false
positive. The mechanism predates this diff and is unchanged by it. Recorded per
the pre-existing-defect rule.

**Fix.** Guard the lead word rather than only the input: reuse
`RECOVERED_NAME_GENERIC_WHOLE_RE`'s spirit in `buildProspectAliases` by refusing
a lead-word alias that is a common standalone noun, or by requiring the lead word
to be at least 5 characters and absent from a small generic list
(`case, home, legal, smart, cloud, financial, data, sales, team`). Worth its own
small packet with a table-driven test.

## T3. The write-back, examined as the only mutating statement in the change

```js
if (!data.brand_name) {
  const { error: updateErr } = await supabase
    .from('prospect_audits')
    .update({ brand_name: brandName })
    .eq('id', data.id)
```

Checked against each property asked for:

- **Exactly one column.** The update payload has a single key. No `updated_at`
  touch, no status change, nothing else. Section 9 asserts `generated_prompts`
  and `category` are unmoved after it runs.
- **Exactly one row, keyed by primary key.** `.eq('id', data.id)`, and `id` is
  the serial PK of `prospect_audits`. No `domain` filter is needed or used, so
  there is no path to a multi-row update.
- **Cannot fire on a non-canonical row.** `data` is the single row returned by
  `.order('created_at').order('id').limit(1).maybeSingle()`, so it *is* the
  canonical row by construction. `id` was added to the select list this round,
  which is what makes the update addressable; the select still names
  `brand_name`, so the pre-migration fail-open path is unchanged.
- **Cannot overwrite an existing value.** Gated on `!data.brand_name`, so it
  only ever fills a NULL. A value written by an earlier write-back, or by a
  post-migration insert, is never rewritten.
- **Concurrency.** Two concurrent first-time recoveries for the same domain can
  both read NULL and both write. They can only write different values if the
  site's `og:site_name` changed between the two fetches; both would be
  legitimate readings of the live page, the column was NULL so nothing is lost,
  and every later call reads the persisted value and skips the branch. Converges.
  No lock is warranted.
- **Failure is non-fatal.** `updateErr` is logged and ignored, and the whole
  block is inside a `try/catch`. A failed write-back degrades to "fetch again
  next time", never to a failed audit.
- **Privilege.** Runs under the service key, so RLS is bypassed, consistent with
  every other write in this function's callers.

No objection. This is correctly scoped and correctly defensive.

---

## Third-pass verdict

**FAIL LIFTED. This is clean enough to ship.**

R1, R2, R4 and R5 are all genuinely closed, each independently reproducible as a
pre-fix failure from the committed suite. The write-back, the one mutating
statement introduced anywhere in this work, is single-column, single-row,
primary-keyed, non-overwriting and fail-open. Build, tsc, dash and secret checks
are clean. `aiVisibilityScore.ts` and `reach_parity.test.js` are byte-identical
to what I passed in the first review.

I looked for a fourth blocking defect and did not find one. T1c is an
incompleteness, not a regression: it leaves 46% of existing domains exactly where
HEAD already had them, while fixing the other 54%. T2 is pre-existing and
unchanged by this diff. Neither justifies a third hold, and I am not going to
manufacture one.

**Order of operations before and during deploy:**

1. **Run the migration first**, in the Supabase SQL Editor for
   `brandgeo-dashboard` (`duiyifepitvugyulobqm`):
   `db/supabase-prospect-audits-brand-name-migration.sql`. Either order is safe,
   as verified in pass 1, but running it first means the fix is live the moment
   the deploy lands, and the write-back has a column to write to. Constantin runs
   this; no agent runs a mutating statement.
2. **Then commit and deploy** `_prospect_prompts.js`, `audit-domain.js`,
   `src/lib/aiVisibilityScore.ts`, the two test files and the migration file.
   Keep `_revenue.js`, `revenue-report.js` and `Revenue.tsx` out of this commit:
   they are a different session's uncommitted work, were never in scope for any
   of these three passes, and still carry the 65 em dashes recorded in
   `CLAUDE.md`.
3. **After the first few audits, confirm the write-back landed** with one
   read-only query:
   `select count(*) from prospect_audits where brand_name is not null;`
   Expect it to climb from 0 as pre-migration domains are re-audited. If it stays
   at 0 while audits are running, the write-back is failing silently and the
   `[Audit/PromptGen] brand-name write-back failed` warning will say why.
4. **Fast follow, own packet:** T1c, persist the fallback path's `brandName` to
   the canonical row so all 70 domains close rather than 38, and add the missing
   sentence to the doc comment.
5. **Follow-ups, none blocking:** T2 (lead-word generic guard), F3 (document that
   `regeneratePrompts` cannot repair a canonical `brand_name`), F5 (match the
   insert-retry on error code as well as message), F7 (defensive element-shape
   handling in the reuse branch), F8 (pre-existing customer-facing em dashes in
   `audit-domain.js`), F9 (`package_provisioning.test.js`, tracked separately).

No HUMAN CHECKPOINT. No security exposure, no secret, no billing surface, no file
outside the declared scope.

## What was NOT checked, third pass

- No live audit was invoked. The 70 homepage fetches were plain public GETs
  through the product's own `fetchHomepageSignal`, costing nothing and writing
  nothing; they are not audits.
- Those fetches are a single point-in-time sample. A site that was briefly
  unreachable is counted as "no `og:site_name`", so the 28 is an upper bound on
  the permanently-unrecoverable set and the 54% success rate is a lower bound.
- I did not re-review `audit-domain.js`, the migration, `aiVisibilityScore.ts` or
  `reach_parity.test.js`. All four were confirmed unchanged by hash or numstat and
  were passed in earlier rounds.
- The write-back has never executed against real Supabase; T3 is a source review
  plus the fake-client test, not an observed production write. Step 3 above exists
  to close that gap after deploy.
- `sanitizeRecoveredBrandName` was exercised against 42 real values and the
  reviewer's original string, not against a systematic table of adversarial
  inputs.
- No browser verification and no accessibility review. No UI changed in any of
  the three rounds.
- `_revenue.js`, `revenue-report.js` and `Revenue.tsx` remain out of scope and
  unread across all three passes.

---
---

# NARROW CHECK, 2026-08-15 — T1c fallback write-back. Nothing found. Deploy order unchanged.

Scoped to the four questions asked. Read-only.

**Scope confirmed before looking at anything else.** Only the two claimed files
moved. `aiVisibilityScore.ts` numstat `20 3`, md5 `7717a6d4...`;
`reach_parity.test.js` md5 `71d63c26...`; `audit-domain.js` numstat `31 5`;
migration md5 `6ae2af10...`. All identical to the passes that cleared them.

**1. Can `canonicalRowIdPendingBrandName` be set where it should not be?** No.
There is exactly one assignment, and every gate the claim depends on is real in
the control flow, not just in the comment:

- It sits inside `if (!forceRegenerate)`, so **`forceRegenerate` cannot reach it**.
- It sits inside the `else if (data && Array.isArray(...) && length >= PROMPT_COUNT)`
  arm. A **genuinely new domain** yields `data === null` from `.maybeSingle()`, so
  the arm is false and the assignment is never evaluated.
- The **lookup-error path** takes the preceding `if (error)` arm, so the `else if`
  is never evaluated either.
- It is placed after the `if (brandName) { ... return }` block, so it is reached
  **only when recovery failed**, and it is itself guarded by `if (!data.brand_name)`,
  so it is captured **only when the stored value was already null**.
- Nothing between the assignment and the write can throw past it; the only
  statement in between is a `console.warn`.

The fallback write then requires **both** `canonicalRowIdPendingBrandName` and
`generated.brandName`, so a fresh generation that also finds no name writes
nothing.

**2. Overwrite a non-null value, or write to a non-canonical row?** No to both.
`canonicalRowIdPendingBrandName = data.id` where `data` is the single row from
`.order('created_at').order('id').limit(1).maybeSingle()`, so it is the canonical
row by construction, exactly as in the R2 write-back. The `!data.brand_name`
guard means a non-null value is never targeted. One precise nuance, not a defect:
between the read and the write a concurrent audit of the same pre-migration
domain could fill that column first, and this write would then replace it. Both
values are legitimately derived brand names for the same domain (one from
`og:site_name`, one from the LLM's reading of title plus meta plus
`og:site_name`), the column was NULL at read time so nothing is lost, and it
converges. No lock warranted.

**3. Does a failed write break an audit?** No, and the shape is genuinely
identical to the R2 write-back rather than merely described as such:
`try { const { error: updateErr } = await ...; if (updateErr) console.warn(...) }
catch (e) { console.warn(...) }`. Neither rethrows, neither is checked further,
and control falls straight through to `return { ...generated, reused: false }`.
The block sits outside the outer `try/catch` but carries its own, so it is
covered.

**4. Section 10 reproduced pre-fix, sections 1-9 undisturbed.** I removed only
the fallback write-back block and ran the committed suite against that copy:

```
7.  ok x3     8.  ok x2     9.  ok x4
10. ok - call 1: recovery failed as expected, fell through to one fresh generation
FAIL: the FALLBACK generation's brand name must be persisted to the canonical row
+ null  - 'Test Brand'
EXIT=1
```

Sections 1 to 9 all pass against that same copy, including the R1, R5 and R2
assertions, so the T1c edit disturbed no earlier fix. Working tree: `PASS: 26
assertions`, `EXIT=0`. Standing checks: no em or en dashes on added lines, no
secrets, `TSC EXIT=0`, `✓ built in 5.52s`. (`tsc` and the build do not actually
compile this file, since `tsconfig.json` includes only `src`; they are recorded
as unchanged, not as evidence about this change.)

**Verdict: nothing found. The FAIL stays lifted and T1c is closed properly.**
With this in, the reproducibility guarantee reaches all 70 existing domains after
one audit each rather than 38.

**Deploy order unchanged from the third pass:** migration first
(`db/supabase-prospect-audits-brand-name-migration.sql`, Supabase SQL Editor,
`duiyifepitvugyulobqm`, run by Constantin), then commit and deploy the in-scope
files, keeping `_revenue.js`, `revenue-report.js` and `Revenue.tsx` out of the
commit, then confirm with
`select count(*) from prospect_audits where brand_name is not null;` climbing from
0 as domains are re-audited. Remaining follow-ups are unchanged: T2, F3, F5, F7,
F8, F9.

**Not checked:** the fallback write has never run against real Supabase, only
against the fake client; the post-deploy count query above is what closes that.
I did not re-derive the 38/70 measurement, re-review the sanitiser, or look at T2,
as instructed.
