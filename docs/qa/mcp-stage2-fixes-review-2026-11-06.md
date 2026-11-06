PASS WITH FINDINGS

# MCP stage 2 review: list_fixes and mark_fix_done (2026-11-06)

Reviewer: bg-verify (Opus), read only. No source file was edited, no git write
command was run, no build, no dev server, no mutating SQL. Supabase project
`duiyifepitvugyulobqm` was read with SELECT only.

Spec: `docs/arch/mcp-stage2-fixes.md` (ruled "Defaults, build it"), section 9
build contracts. Background read: `docs/arch/mcp-access.md`,
`docs/arch/fix-states.md`, `docs/qa/fix-states-review-2026-11-06.md`.

## 0. Verdict and counts

**PASS WITH FINDINGS.** 0 BLOCKER, 1 MAJOR, 0 MEDIUM, 5 LOW, 7 INFO.

The security surface holds under every attack in the brief: a read key can
neither see nor call the write tool, the plan, research and revoke gates hold
for writes, `client_id` is never taken from arguments, ids outside the
current open list are refused, the write counter fires, the trigger amendment
is the live function plus exactly the `marked_by_key` rules, and no key,
prefix, hash or note reaches a log line in its literal form.

The one MAJOR is a parity break that the builder flagged and that I measured
on production data: for client 1 (3,543 `ai_results` rows) the page and
`list_fixes` produce different fix lists today. The root cause is
PRE-EXISTING (the page reads `ai_results` without paging and so sees only the
newest 1,000 rows), MCP's answer is the correct one, and no MCP key exists in
production yet, so nothing is wrong for a customer through MCP today. It is
not a release blocker for this diff, but the parity contract of section 2 is
not met for any client over the row cap, and client 54 (660 rows) is next.
Fix the page read before a read and write key is issued to a client over
1,000 rows; best in the same build.

| Severity | Count | Ids |
|---|---|---|
| BLOCKER | 0 | |
| MAJOR | 1 | M1 |
| MEDIUM | 0 | |
| LOW | 5 | L1 to L5 |
| INFO | 7 | I1 to I7 |

## 1. Calibration

1. Diff in scope (`git diff --stat` on the listed tracked files): 12 files,
   1,120 insertions, 393 deletions (`mcp-server.js` +431, `mcp_server.test.js`
   +448, `AIVisibility.tsx` 214 changed, `marketContext.tsx` 157 changed,
   `client-api-keys.js` 68, `client_api_keys.test.js` 79,
   `fake_supabase_mem.js` 41, `McpAccessSection.tsx` 43, `aiVisibilityCopy.ts`
   20, `_collect.js` 8, `collect-claude.js` 2, `fixStates.ts` 2), plus four
   new files (`fixItems.ts` 256 lines, `markets.ts` 157, `fix_items.test.js`
   408, the SQL file 288). Every reviewed file is in the brief's list. Other
   dirty files in the tree (`unlock-audit-report.js`, `brandgeo/web/*`, docs)
   belong to other sessions and were not reviewed.
2. Secret scan over the reviewed diff and new files: 111 keyword hits (names
   such as `client_api_keys`, `SUPABASE_SERVICE_KEY`, `bearer`), **0**
   secret-shaped literal values (pattern for `sk-`, `pk_live_`, a full
   `bgmcp_<id>_<48 hex>` and a JWT prefix).
3. The brief's seven attack areas and the builders' claims are all objectively
   checkable; each is a row in section 2.
4. tsc baseline before the change: not measured (that needs a checkout of
   HEAD, a git write). After the change tsc exits 0, so no failure needs
   attributing.
5. Most sensitive function: `mcp-server.js` `mark_fix_done`. Guards in order:
   bearer shape and hash lookup `mcp-server.js:1029-1048`, revoked and
   client-id match `:1044-1047`, plan gate `:1117`, research gate `:1122-1130`,
   key scope `:1154`, write counter `:1155`, open-list check `:709-711`.
6. Writes: this file only. No reviewed file edited.

CALIBRATED

## 2. Acceptance criteria

| # | Criterion (brief and spec 9) | Result | Evidence |
|---|---|---|---|
| A1 | tsc exit 0 | PASS | `npx tsc --noEmit -p .` printed nothing, `TSC_EXIT=0` |
| A2 | Suites pass | PASS | `mcp_server` 70 passed; `client_api_keys` 20; `fix_items` 24 passed 0 failed; `fix_prompt` 23; `fix_states` 28; `prompt_performance` 50; `affiliate_auth` 16, `affiliate_core` 49, `affiliate_flow` 67, `affiliate_promo_link` 16, `affiliate_stripe` 19; all exit 0 |
| A3 | `mcp-server.js` still bundles with its new `.ts` requires | PASS | `npx esbuild netlify/functions/mcp-server.js --bundle --platform=node` into the scratchpad, exit 0, 157,645 bytes; the bundle loads and exports the 8 read tools and `mark_fix_done` |
| A4 | Key without scope, or read key, never sees `mark_fix_done` | PASS | probe P1: read key `tools/list` has `list_fixes` true, `mark_fix_done` false; rw key true. `toolsListResult` `mcp-server.js:967-977`; `keyScope` treats anything but `read_write` as read `:169`; test 16 covers a row without `scope` |
| A5 | Read key calling `mark_fix_done` directly via tools/call | PASS | probe P3: HTTP 200, `isError: true`, the spec sentence, `fix_states=0 client_events=0` afterwards |
| A6 | Plan gate for writes | PASS | probe P5: free client with a `read_write` key gets -32002 "MCP access needs the Radar plan or higher", no write |
| A7 | Research client | PASS | probe P6: viewer-created rw key on a research client gets -32003, no write; P14: admin-created key passes the gate and is then held to the open list |
| A8 | Revoked key | PASS | probe P4: 401 -32001, no write |
| A9 | Cross-client fix ids, `client_id` never from arguments | PASS | probe P7 and P7b: client 72's open ids, sent through client 71's key with `client_id: 72` in the arguments, answer "That fix is not open for this brand"; probe P9: a good mark sent with `client_id: 72` in the arguments wrote the row with `client_id` 71. `ctx.clientId` comes from the key row only, `mcp-server.js:1059` |
| A10 | Only ids on the current open list | PASS | probe P8 (`invented_kind:1`) refused; `mcp-server.js:709-711`; test 16 covers closed and unknown ids |
| A11 | Idempotent, already done writes nothing | PASS | probe P10: second call returns the stored row with `already_done`, counts stay `fix_states=1 client_events=1`; `mcp-server.js:700-706` |
| A12 | `marked_by_key`, audit row, actor | PASS | probe P9: row `marked_by_key` equals the key id, `marked_by` null, status done; audit row type `mcp_fix_marked`, client 71, `actor` = key creator, `meta.key_id`, `meta.fix_id`, `meta.note` stored. Audit failure logged and does not undo the mark `:735-746` |
| A13 | Write counter 60 an hour, after scope and plan gates | PASS | probe P12 with limit 2: `result result -32029/client_write_hour -32029/client_write_hour`; `list_fixes` still answers afterwards. Counter key `mcp:client:<id>:writes:hour`, 3600 s, `:1155`, after `:1117`, `:1122` and `:1154` |
| A14 | Note limits | PASS | probe P11: 501 characters refused, non-string refused |
| A15 | Pre-migration fallbacks keep stage 1 working | PASS | `mcp-server.js:1034-1041` retries the key select without `scope` on 42703 and treats every key as read; test 16 `premig` asserts stage 1 tools answer and `mark_fix_done` is refused. `client-api-keys.js` list falls back, read issue retries, read_write issue is 503 (test lines 264-292) |
| A16 | Trigger: amended `fix_states_guard()` equals live plus the `marked_by_key` rules | PASS | live `pg_get_functiondef` read: the only differences are the six `marked_by_key` lines and the live `elsif new.status = 'open'` branch folded into `else`; both live branches assign the same three columns, so behaviour is unchanged. SQL `db/supabase-mcp-fix-writes-2026-11-06.sql:59-148` |
| A17 | A browser user can never set `marked_by_key` | PASS (by reading; live probe owed) | insert of done: `:78-80` forces null when `auth.uid()` is set; insert of open: `:84` null; move into done or dismissed: `:104-106`; every other update pins it `:120`. Anon cannot reach the table: RLS insert and update policies need `is_admin()` or `client_id = get_my_client_id()` (live `pg_policies`) |
| A18 | Service role keeps `marked_by_key` | PASS (by reading; live probe owed) | `auth.uid()` null skips the null-forcing at `:78` and `:104`; MCP always sends `marked_by_key: key.id` (`mcp-server.js:728`) |
| A19 | NO ACTION FK and client delete | PASS (by reasoning; live probe owed) | live FKs: `client_api_keys.client_id` and `fix_states.client_id` both `ON DELETE CASCADE` to `clients`; `delete-client.js:102` deletes the `clients` row in one statement and never deletes `client_api_keys` or `fix_states` itself. RI cascades run as queued triggers of that statement and the NO ACTION check is queued after them, so the referencing `fix_states` rows are gone when it runs. The SET NULL rejection is sound: the RI action is an UPDATE that the guard would undo at `:120`. No product path deletes a key row (revoke sets `revoked_at`; RLS has no delete policy on `client_api_keys`) |
| A20 | CHECK rebuild keeps all 8 values | PASS | live `client_events_type_check` lists exactly `plan_change, trial_grant, comp_grant, trial_expired, onboarded, signup, stripe_change, stripe_provision`; SQL `:160-173` has the same eight plus `mcp_fix_marked` |
| A21 | Grants: `key_hash` never readable by authenticated | PASS | live column privileges for `authenticated` on `client_api_keys`: SELECT on `client_id, created_at, created_by, id, key_prefix, label, last_used_at, revoked_at`; no table-level grant; SQL adds only `select (scope)` `:34` |
| A22 | Re-runnable | PASS | `add column if not exists` (`:17`, `:46`), scope CHECK in a `pg_constraint` guard (`:20-30`), `create or replace` (`:59`), `drop constraint if exists` then add (`:160-161`), grant and revoke idempotent |
| A23 | Rollback order | PASS | guard first, then the column (`:271-284`): correct, plpgsql resolves `new.marked_by_key` at run time and would fail every write after the drop |
| A24 | Refactor: `buildFixItems` equals the old inline builder | PASS | `fix_items.test.js:53-180` carries the HEAD builder verbatim (compared against `git show HEAD:.../AIVisibility.tsx` lines 893 onward and the derivations at 711-790) and deep-equals it on five fixtures plus a done-mark case |
| A25 | Refactor: `buildFixResultMap` equals the old `load()` map | PASS (by reading) | the oracle in A24 uses the new map on both sides, so it does not prove this; read side by side: same skip order (inactive engine, map entry created, no-answer, first row wins, error rows to the error set). One change: rows are now sorted by `checked_at` inside the function. The page query already orders `checked_at desc` and `Array.prototype.sort` is stable, so the page result is identical; `latestChecked` folds the old running value the same way (`AIVisibility.tsx:500-501`) |
| A26 | `MARKETS` move | PASS | evaluated HEAD's array and `markets.ts`: 26 entries each, JSON identical; `marketContext.tsx` re-exports `MARKETS`, `Region`, `Market` |
| A27 | No fix sentence in `netlify/functions/` | PASS | grep for the card sentences ("Low visibility in", "Outranked by", "Not named for", "Inconsistent cross-prompt", "Improve ranking position", `overview" page`) in `netlify/functions/`: 0 hits |
| A28 | Parity page vs `list_fixes`: ids, order, prompt bytes, baseline | **PASS on fixtures, FAIL live for client 1** | test 16 asserts ids, order, copy and `buildFixPrompt` bytes against the page's own builders on a fixture (passes). On production data for client 1 the two lists differ: see M1 |
| A29 | Logging: no key, prefix, hash, header, body or note | PASS for the literal forms; see L1 | probe P13: after a note carrying the full key and its hash, and `fix_id` values carrying the key and the hash, the captured log has no full key, no `bgmcp_`, no hash, no note text. A key sent uppercased or without its prefix does reach the log (L1) |
| A30 | UI scope choice | PASS with L4, I1 | `McpAccessSection.tsx:531-551`: fieldset with legend "Access", two native radios named `mcp-key-scope`, default `read` (`:188`), reset to read after issue (`:309`), labels wrap the inputs so the text is the click target, arrow keys move within the native group, focus ring `focus-visible:ring-brand-400` |
| A31 | Access column | PASS | `:449` header "Access", `:460` `scopeLabel`, a row without `scope` reads "Read only" (`:144-146`) |
| A32 | "by an AI agent (label)" lines | PASS with L3 | `AIVisibility.tsx:1058-1070`, `aiVisibilityCopy.ts` `fixByAgent`; label read from the client's own `client_api_keys` rows `:592-602`, "an AI agent" alone when unreadable |
| A33 | No em or en dash in changed customer-facing text | PASS | `rg` with the class built from `String.fromCharCode(0x2014, 0x2013)`: positive control file 1 hit; `fixItems.ts`, `markets.ts`, `fix_items.test.js`, the SQL file 0; added lines of every reviewed diff 0 |
| A34 | Comment-only change in `collect-claude.js`, `_collect.js` is true | PASS | `_collect.js:467` sends `tools: [{ type: 'web_search_20250305', name: 'web_search', max_uses: 1 }]`, matching the new comments |

## 3. Findings

### M1. MAJOR, root cause PRE-EXISTING. The page and `list_fixes` disagree for any client over the PostgREST row cap

**What.** `AIVisibility.tsx:481` reads
`supabase.from('ai_results').select('*').eq('client_id', ...).order('checked_at', { ascending: false })`
with no range and no paging, so PostgREST returns at most its row cap (the
builder reports the default 1,000; I could not read the project's API
setting from SQL, see section 7). `mcp-server.js:522-538` scans every row in
keyset pages. Both feed the same `buildFixResultMap` and `buildFixItems`, so
the code is shared but the input is not.

**Measured on production, read only.** Only client 1 is over 1,000 rows today
(3,543; next is client 54 at 660). I computed the newest usable row per
prompt and engine both ways in SQL and ran both sets through the real
`buildFixResultMap` and `buildFixItems` (script
`scratchpad/parity_c1.js`, engines from `getActiveEngines('growth_pro')`):

- 17 active-prompt cells exist in the full history but not in the newest 1,000
  rows: 15 on `ai_overview` (newest of them 2026-10-02), 2 on `google_ai`.
  The window's oldest row is 2026-10-10.
- Page list: `engine_missing:ai_overview` (P0), `outranked:<rival>`.
- MCP list: `engine_low:ai_overview` (P1), `outranked:<rival>`.
- The outranked card's description differs (rival appearances 141 vs 134,
  ranked 114 vs 107, brand absent in 145 vs 136 checks).
- The outranked baseline differs: MCP `{ value: 91.5, n: 270 }`, page
  `{ value: 91.2, n: 260 }`.

**How it breaks.** An agent on client 1 calls `list_fixes`, gets
`engine_low:ai_overview`, marks it done. The page still shows
`engine_missing:ai_overview` open (it has no row for that id) and a "Low
visibility in AI Overview" entry in Done that the user never saw open.
Calling `mark_fix_done` with the id the user sees on the page
(`engine_missing:ai_overview`) is refused as "not open". Verdicts are then
recorded by the page from its truncated map against a baseline MCP took from
the full map. Every Growth PRO client at weekly cadence adds about 392 rows a
week (56 prompts x 7 engines), so each crosses 1,000 rows in about three
weeks; Growth in about six.

**Why not a blocker.** The truncation is the page's, predates this diff and
already shows client 1 a list built from partial data; MCP is the correct
side. No MCP key exists in production (0 unrevoked rows in
`client_api_keys`), so no customer can hit the divergence through MCP yet.

**Fix (bg-app).** The page reads `ai_results` the way `scanAllResults` does:
keyset pages of 1,000 on `id`, filtered to the active engines, until a short
page, with the same ceiling. Ideally one shared reader in `src/lib/` used by
both sides so the input cannot drift either. Add a parity test whose fixture
exceeds one page. Ship before any read and write key is issued to a client
over 1,000 rows; best in the same Netlify build as this work.

### L1. LOW. The log scrub misses a key sent uppercased or without its prefix

**Where.** `mcp-server.js:136-138` (`scrub` removes only lowercase `bgmcp_\S*`
and 64-hex runs) and `:172-175` (`loggableFixId` accepts anything
`FIX_ID_RE` accepts, which allows any 150 characters after the colon).

**Reproduction.** Probe P13, read key or write key, `tools/call mark_fix_done`
with `fix_id: "x:" + key.toUpperCase()` logs
`fix_id=x%3ABGMCP_<id>_<48 HEX>`; with `fix_id: "x:" + <the 48 hex part>`
logs the 48 hex verbatim. Either is the working key once lowercased or
re-prefixed.

**Exploit path.** Needs the key holder's own agent to put its key into
`fix_id` (a confused agent or an injected instruction). Anyone with Netlify
function log access then holds a working key. Low likelihood, real
consequence.

**Fix.** Log only `fix_id` values that match a strict shape, for example
`^[a-z_]{1,40}(:[a-z0-9_.-]{1,60})?$` with no run of 24 or more hex digits,
else `fix_id=other`; or log the kind before the colon only.

### L2. LOW. Deploy order hazard: the page breaks visibly if pushed before the migration

**Where.** `AIVisibility.tsx:57` adds `marked_by_key` to `FIX_SELECT`, used by
the read `:566-579`, the mark upsert `:943-947`, the reopen `:972-976` and the
verdict write.

**How it breaks.** With the dashboard live and the column absent, the read
fails and the hub shows every done fix as open; a Mark as done writes the row
and then reports "save failed" because the returning select fails; verdicts
stop being recorded. The SQL header (`:13-14`) and spec 9.6 already require
the migration first. Recorded so the order is checked on the day: apply, read
back, then push. A select that retries without `marked_by_key` on 42703, as
`mcp-server.js` does for `scope`, would remove the hazard.

### L3. LOW. An AI agent's mark is not attributed when the fix is unmeasurable

**Where.** `AIVisibility.tsx:1064`: `if (!scope || row.baseline_value === null || !row.marked_at) return FIX_COPY.manual`
returns before `by` is used. MCP writes such rows: `mcp-server.js:715-727`
stores `baseline_value: null` whenever `measureFix` returns no value.

**Reproduction.** Mark through MCP any open fix whose scope has no answers
(`measureFix` returns `{ value: null }`). The Done line reads "Marked done.
This one cannot be measured, so there is nothing to check." with no date and
no "by an AI agent", against spec 9.5.

**Fix.** Build that line from `fixMarkedOn(markedOn, by)` plus the manual
sentence when `marked_by_key` is set.

### L4. LOW, copy truth. The Account explanation line implies a write key can start collections

**Where.** `McpAccessSection.tsx:440`: "Give your own AI tools, such as Claude
Code or Cursor, direct read access to this account's visibility data. A read
only key can never start a collection or change your account."

**Why it is wrong.** No key can start a collection (ruling 5; no tool
enqueues one, `mcp-server.js:24-25`). Scoping that promise to a read only key
tells the reader a read and write key can, and the first sentence still says
"read access" while the form under it offers write access.

**Fix (bg-copy).** For example: "Give your own AI tools, such as Claude Code
or Cursor, direct access to this account's visibility data. No key can start
a collection. A read only key changes nothing; a read and write key can only
mark Fix This items done."

### L5. LOW. Prompt order on equal positions differs between page and MCP

**Where.** Page `AIVisibility.tsx:480` orders by `position` only (PostgREST
order within ties is unspecified); MCP `mcp-server.js:554` sorts by
`position` then `id`. `buildFixItems` sorts gaps by competitor count then
position, so ties keep the input order, and `slice(0, MAX_PROMPT_GAP_FIXES)`
can then cut a different gap.

**Measured.** 6 groups of active prompts share a position, across 3 clients.

**Fix (bg-app).** Add `.order('id')` after `.order('position')` on the page.

### I1. INFO. The radio group's `role="radiogroup"` has no name

`McpAccessSection.tsx:533`. The native radios already form a group named by
the fieldset legend "Access"; the inner `div role="radiogroup"` is announced
as an unnamed group. Drop the role or add `aria-labelledby` pointing at the
legend.

### I2. INFO. Concurrent marks

`mcp-server.js:700-731` checks state, scans, then upserts. Two concurrent
calls for one fix both write an audit row (the second upsert is an in-place
edit; the guard keeps the first key and baseline). A user who dismisses the
fix between the check and the upsert has the dismissal turned into done.
Window is the scan time; harmless at current volume.

### I3. INFO. Read-key instructions omit `list_fixes`

`mcp-server.js:93`: the `initialize` text for a read key lists the stage 1
data only, though `list_fixes` is now served to that key.

### I4. INFO. The migration goes one step past spec 9.2's "Nothing else"

It also rebuilds `client_events_type_check` (SQL `:155-173`). Necessary: the
live CHECK has exactly the eight values, so every audit insert would be
refused without it. bg-architect should amend 9.2.

### I5. INFO. `fixDismissedLine(..., by)` is unreachable

A user's dismiss forces `marked_by_key` to null (SQL `:104-106`) and MCP has no
dismiss tool, so a dismissed row never carries a key. Harmless.

### I6. INFO. "by an AI agent" is a claim about the caller

A key can be used by any script. The wording is ruled in spec 9.5; noted only
for bg-copy.

### I7. INFO. NO ACTION means a referenced key row can never be deleted

Intended (keys are revoked, never deleted). Any future key cleanup job must
null `fix_states.marked_by_key` first, which the guard forbids except on a
move into done; that job would need its own migration.

## 4. Accessibility

New text-on-surface pairs, WCAG relative luminance, values from `index.css`:

| Pair | Dark | Light |
|---|---|---|
| "Access" column, `text-slate-300` on the card (`--dark-800`) | 12.02:1 | 10.35:1 (remapped `rgb(51 65 85)` on white) |
| Radio labels, `text-slate-300` on the card | 12.02:1 | 10.35:1 |
| "Access" legend and header, `text-slate-500` (remapped in dark to `rgb(148 163 184)`) | 6.96:1 | 6.03:1 |
| Done list line with "by an AI agent", `text-slate-500` | 6.96:1 | 6.03:1 |
| Radio focus ring `ring-brand-400` against the card | 6.56:1 (non-text, 3:1 needed) | not measured |

Keyboard: native radios (Tab into the group, arrows to change), labels wrap
the inputs. Focus: `focus-visible` ring on each radio. Headings: none added.
Hit targets: each label is one text-xs line, about 16 to 18 px high with 6 px
gaps; not measured in a browser, may sit under the 24 px of WCAG 2.5.8 the way
the existing form rows do. Not rendered in a browser at any viewport.

## 5. Regression surface (grep)

- `marketContext.tsx` re-export: imported by `App.tsx`, `Layout.tsx`,
  `collectionContext.tsx`, `AIVisibility.tsx`, `BrandSentiment.tsx`,
  `Competitors.tsx`, `Onboard.tsx`. Array proven identical (A26); tsc 0.
- Copy functions with a new optional `by` parameter (`fixDoneWaiting`,
  `fixDoneWaitingData`, `fixDismissedLine`, `fixMarkedOn`): only
  `AIVisibility.tsx` calls them.
- `fixItems.ts` and `markets.ts`: `AIVisibility.tsx`, `mcp-server.js`, two
  tests.
- `McpAccessSection.tsx`: `Account.tsx`. `client-api-keys.js`: only
  `McpAccessSection.tsx`.
- `fake_supabase_mem.js` gained `upsert` and `triggers`; additive; the five
  affiliate suites that share it pass (A2).
- Manual look owed: AI Visibility hub and Done list for one client with fixes
  in each state, after the migration; Account, MCP section, in both themes.

## 6. Data and claim integrity

- Every number in `list_fixes` and `mark_fix_done` comes from the shared
  builders (`fixItems.ts`, `fixStates.ts` `measureFix` and `evaluateFix`,
  `fixPrompt.ts`) on the client's own `ai_results`; none is computed in
  `netlify/functions/` (A27). M1 is the only case where the two callers see
  different inputs.
- `recheck_after` is `verdictCutoff(marked_at)`, 7 days, the same rule the
  trigger enforces (`now() < old.marked_at + interval '7 days'`).
- New strings checked: the read-only refusal, "That fix is not open for this
  brand. Call list_fixes for the current ids.", the write limit sentence,
  `INSTRUCTIONS_READ_WRITE`, the two `mark_fix_done` messages, both tool
  descriptions, "Read and write (lets an AI agent mark Fix This items done)",
  "Read only", "Read and write keys are not available yet.", "Scope must be
  read or read_write.", "by an AI agent (label)". All true against the code,
  except the Account explanation line (L4). "verdict_due means the dashboard
  records the verdict on its next load" matches the page's verdict effect
  (`AIVisibility.tsx`, the effect over `fixRows`).

## 7. Not checked

- The migration itself: not applied, so no live trigger, RLS, FK, grant or
  CHECK probe ran. Rows A17 to A19 rest on reading the SQL and the live
  definitions, not on execution.
- The client delete cascade with a referenced key (A19): reasoned, not run.
- The project's PostgREST row cap: not readable from SQL. M1 assumes the
  builder's 1,000; the measured divergence holds for any cap under 3,543.
- Any live MCP call: there is no key in production and creating one is not
  this seat's to do.
- The UI in a browser: radio keyboard behaviour, focus ring, the Access column
  at phone width, light mode, the Done list with a real agent mark.
- `npm run build` and the Netlify esbuild run (an equivalent local esbuild
  bundle was built, A3).
- tsc before the change (section 1, item 4).

## 8. Probe after Constantin applies the migration

1. The read-back queries in the SQL file section 5, with these expected
   values: `scope` text not null default `'read'`; `marked_by_key` uuid
   nullable; FK with no ON DELETE clause; CHECK with nine values; nine
   SELECT columns for `authenticated`, never `key_hash`; every key `read`;
   0 rows with `marked_by_key`; guard `amended true`, `auth_exec false`;
   trigger enabled `O`.
2. The rolled-back RLS and trigger probe in SQL section 6, cases a to f.
3. One extra rolled-back case: `begin;` delete a throwaway client that has a
   key and a `fix_states` row carrying that key in `marked_by_key`; expect
   success; `rollback;`. This turns A19 from reasoning into evidence.

## 9. Probe after the deploy

1. `mcp-server` answers 401 unauthenticated; `health` shows the new commit.
2. With a test client and a read key: `tools/list` has 8 tools and no
   `mark_fix_done`; `tools/call mark_fix_done` returns the read-only sentence.
3. With a `read_write` key on the same test client: `list_fixes` ids, order and
   `prompt` text match the page's open list and its Copy as AI prompt for the
   same client (pick a client under 1,000 rows until M1 is fixed, and repeat
   on client 1 after it is).
4. `mark_fix_done` on one id: `fix_states` row with `marked_by_key` set and
   `marked_by` null, one `client_events` row `mcp_fix_marked`, the page's Done
   list reads "Marked done <date> by an AI agent (<label>)"; a second call
   answers `already_done` and writes nothing. Clean up the row afterwards
   through the page (reopen) or by Constantin.
5. Netlify function log for those calls: one line each, `fix_id` present, no
   key, prefix, hash or note.
6. Account page: issue one key of each scope, the Access column reads them,
   keyboard through the radios, both themes.

## 10. Amendment: findings closed from the orchestrator seat, 2026-11-06

Closed before the migration hand-over, then re-run: tsc exit 0; mcp_server 70,
client_api_keys 20, fix_items 24, fix_prompt 23, fix_states 28, keyset_read 5
(new), prompt_performance 50.

- **M1 CLOSED.** New `src/lib/keysetRead.ts` `readAllById`, keyset pages of
  1,000 by id, ceiling 50,000. The page's `ai_results` read and
  `mcp-server.js` `scanAllResults` both go through it; the page sorts the rows
  back to `checked_at` descending for its engine health walk.
  `tests/keyset_read.test.js` pins 3,543 rows back in full, the one-full-page
  edge, the ceiling and a failed page (returned as an error, so the page shows
  its retry card instead of a short list). Live parity on client 1 is owed to
  the post-deploy probe.
- **L1 CLOSED.** `loggableFixId` logs only a known kind plus a parameter of
  `[a-z0-9 ._-]{1,80}` with no 24-hex run and no `bgmcp`; anything else logs
  as `<kind>:other`, an unknown kind as `other`. `scrub` is case-insensitive
  on `bgmcp_`. The test now also sends the key upper-cased, the bare 48-hex part
  and the upper-cased hex part as `fix_id`.
- **L2 CLOSED.** The page's `fix_states` read retries once without
  `marked_by_key` on 42703 and every later read and write on the page then
  selects the base column list. Not covered by a node test (component code).
- **L3 CLOSED.** A manual fix an agent marked reads "Marked done <date> by an
  AI agent. This one cannot be measured, so there is nothing to check."
- **L4 CLOSED.** The explanation now reads "No key can start a collection or
  change your plan or billing; a read and write key can only mark Fix This
  items done."
- **L5 CLOSED.** The page orders prompts by `position`, then `id`, as MCP does.
- **I1 CLOSED.** The radiogroup carries `aria-label="Access"`.
- **I4 CLOSED.** Spec 9.2 amended for the `client_events` CHECK and the FK choice.
- I2, I3, I5, I6, I7 stay as recorded; none blocks.

## 11. Migration applied and read back, 2026-11-06

Constantin applied `db/supabase-mcp-fix-writes-2026-11-06.sql` in the SQL
Editor. Read back from this seat: `client_api_keys.scope` text, not null,
default 'read', CHECK read or read_write; `fix_states.marked_by_key` uuid,
nullable, FK to `client_api_keys(id)` with no ON DELETE clause;
`client_events_type_check` holds the eight earlier values plus
`mcp_fix_marked`; authenticated SELECT on nine columns, never `key_hash`;
guard amended, SECURITY DEFINER, `search_path` empty, not executable by
authenticated; trigger `fix_states_guard_trg` enabled; the three policies
unchanged; 0 keys exist, 0 rows carry `marked_by_key`, 13 fix rows untouched.

Probe, one DO block ended by a raised exception so every write rolled back
(client 2 and its viewer, plus a throwaway client made inside the block):
a) a viewer insert of a done row naming a key keeps the viewer and nulls the
key; b) an edit in place cannot set the key; c) a fresh move into done by the
viewer nulls the key; d) the viewer's update of other clients' rows touches 0;
e) the service path keeps the key and leaves `marked_by` null; f) the
`mcp_fix_marked` audit insert is accepted; g) deleting a client whose fix row
references its key succeeds and the key row goes with it; h) deleting a
referenced key on its own is refused (NO ACTION, I7). Counts after: 16 events
(0 `mcp_fix_marked`), 0 keys, 51 clients, 13 fix rows, no probe rows.
