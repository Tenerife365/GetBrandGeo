# Multi-location collection: orchestrator record

Date: 2026-11-13. Written from the orchestrator seat. This file records what
was decided, what ran and what was measured, so a later session can pick the
work up without the conversation. Spec: `docs/arch/multi-location-collection.md`.
UI design: `docs/design/multi-location-ui-2026-11-13.md`. Pre-build review:
`docs/qa/multi-location-prebuild-review-2026-11-13.md`.

## 1. Request and ruling

The owner asked for several countries and several regions per client, at
onboarding and in the sidebar. Measured before any design: the sidebar already
kept a list of markets, but only in the browser, and collection used only the
first entry; scheduled runs used `clients.default_market_id` at country level;
`ai_results` stored no location.

Ruling, owner, 2026-11-13: "One country per prompt". Each prompt belongs to one
location. The same question in four countries is four prompts created in one
action. Cost per prompt is unchanged and the plan prompt cap stays the spend
bound. The alternative (every prompt in every selected country) was offered and
declined.

The seven open questions in spec section 14 are unanswered on 2026-11-13. The
build uses each recommended default, each kept as one constant or one branch.

## 2. Chain so far

| Step | Who | Result |
|---|---|---|
| Two maps of the current code | Explore agents | done |
| Design of the ruled approach | bg-architect | done |
| Three adversarial reviews of the design | bg-verify | scores 6, 5 and 6 of 10, fixes folded into the spec |
| Spec | bg-architect | `docs/arch/multi-location-collection.md` |
| Pre-build review of the spec | bg-verify (Opus) | BLOCK, 2 must-fix, 11 should-fix |
| Spec amended | bg-architect | both must-fix closed, should-fix applied or listed as open |
| Packet 1: migration file, helpers, endpoint, enqueue, provisioning | bg-backend (Opus) | done, tests below |
| Packet 2: UI design | bg-design (Opus) | done |
| Packet 3: worker, collectors, MCP | bg-backend (Opus) | running when this was written |
| Packet 4: shared frontend layer, sidebar | bg-app | running when this was written |
| Packets 5 and 6: pages, Onboard wizard | bg-app | not started |
| Final review | bg-verify | not started |

The two must-fix findings of the pre-build review:

- M1: the spec had `_locations.js` require `src/lib/markets.ts`. Every function
  not bundled by esbuild that reached it would have shipped the `.ts` file as it
  is and failed in production, as one function did on 2026-11-11. Closed with a
  plain JavaScript mirror, `netlify/functions/_market_regions.js`, pinned by
  `tests/market_regions_mirror.test.js`. `netlify.toml` is in no packet's scope.
- M2: the location filter was applied page by page and skipped
  Recommendations. Closed by applying it once in `src/lib/resultsContext.tsx`.

## 3. Checks from the orchestrator seat after packet 1

Run with node from `brandgeo-dashboard`, 2026-11-13, all exit 0:
market_regions_mirror 5, locations_resolve 22, client_locations_endpoint 28,
enqueue_locations 16, provision_locations 30, enqueue_history 24,
enqueue_force_gate 16, phase2_schedule_worker_trigger 11, provision_client 51,
explee_import 111, ts_require_bundler 5, markets_data 39, explee_rules 155,
refresh_cadence 17, phase1_server_hardening 65.

Packet 1 reported that `tests/markets_data.test.js` crashed twice out of six
runs inside `node_modules/typescript` before any check, with null bytes in the
output: a bad read of an 8 MB file on this machine while several agents were
working. It passed on the orchestrator's run. Not investigated.

## 4. Migration rehearsal against production (rolled back)

The statements of `db/supabase-client-locations-2026-11-13.sql` (lines 62 to
250 as they stood at 12:10 UTC, before packet 3 added the audit type step) were
run inside ONE `do` block that ends with `raise exception`, so the statement
always rolls back and no transaction can be left open. `lock_timeout` was 4 s.
The collection queue was idle and no long query was running.

Read back after the run: `client_locations` absent, no new column, no new
function, one trigger on `prompts`, 545 prompts, no probe row. Nothing changed.

Measured inside the block:

| Check | Result |
|---|---|
| Time to apply | 227 ms |
| Prompts backfilled | 545, none left without a location |
| Primary rows created | 66 (one per client that has prompts) |
| Prompt and location on different clients | 0 |
| Triggers on prompts after apply | trg_enforce_prompt_cap, trg_prompt_location |
| authenticated may execute the write functions | no |
| service_role may execute them | yes |
| authenticated: insert on prompts.location_id | yes; update: no |
| authenticated: select on client_locations | yes; insert: no; anon select: no |
| Insert without a location | gets the client's primary |
| Change a prompt's location | refused, location_immutable |
| Add two locations | 2 rows, region defaults to ALL |
| Add past the limit | refused, location_limit_reached |
| Add a pair twice | refused, 23505 |
| Lower-case market id | refused, 23514 |
| Archive a location with an active prompt | location_in_use |
| Archive an empty location, twice | archived, then already_archived |
| Archive the primary | location_is_primary |
| Archive through another client's id | not_found |
| Active prompt into an archived location | refused, location_archived |
| Inactive prompt into an archived location | allowed |
| Re-activate that prompt | refused, location_archived |
| Prompt with another client's location, active or inactive | refused, 23503 |
| Make another location primary | primary_set, clients mirror updated, no prompt changed location, one primary |
| Make primary again, an archived one, another client's | already_primary, not_found, not_found |

As a real viewer (role `authenticated`, the JWT claims of one viewer login whose
client had 5 free prompt slots):

| Check | Result |
|---|---|
| Locations visible | 1, none of another client |
| Insert without a location | gets the own primary |
| Update of location_id | refused, 42501 |
| Multi-row insert one past the cap | whole statement refused, prompt_cap_reached, 0 rows left |
| Multi-row insert exactly to the cap | allowed |
| Prompt with another client's location | refused, 23503 location_invalid |
| Prompt for another client | refused by row level security |
| Calling add_client_locations | refused, 42501 |
| Writing client_locations directly | refused, 42501 |

One probe was badly designed and proves nothing: "re-activate past the cap"
ran on a row that was still active, because the archive before it sat in a
block that was rolled back. The cap on re-activation is the unchanged cap
trigger and is not new in this work.

Not rehearsed: concurrency (two sessions at once), the audit type step packet 3
adds, and the final file after packet 3. The final file is rehearsed again
before it is handed to the owner.

## 4b. After packets 3 and 4 (about 12:40 UTC)

Packet 3 (bg-backend, Opus): worker and collectors stamp every row with the
place it was asked from; the single cell refresh resolves the prompt's location
on the server and refuses with HTTP 500 `location_read_failed` before any engine
call when that read fails; a Worldwide location with no region gets a neutral
system text (`WORLDWIDE_NEUTRAL` in `_collect.js`); MCP prompt outputs carry the
location; the migration file gained step 7, the audit type `location_change`.
No engine caller, model id, token limit or cost figure changed.

Packet 4 (bg-app): `src/lib/locations.ts`, `src/lib/locationsContext.tsx`,
`src/components/ui/MultiCombobox.tsx`, the filter applied once in
`resultsContext.tsx`, the sidebar Locations block in `Layout.tsx`.
`i18nContext.tsx` was not edited: the new sidebar strings are English literals
marked copy pending.

Orchestrator checks, all exit 0: `tsc --noEmit`; node tests locations_view 22,
combobox_filter 14, markets_data 39, results_loader 21, tokens_sync 115,
fix_items 24, history_read 3, build_system_context 16, phase2_prompt_ownership
126, mcp_server 85, phase2_collector_gate 48, phase1_server_hardening 65,
engine_routing 5, enqueue_locations 16, explee_import 111, ts_require_bundler 5,
enqueue_history 24, provision_client 51, client_locations_endpoint 28,
locations_resolve 22, market_regions_mirror 5. No file that Layout imports
imports motion or calls scrollIntoView (grep). Production build: entry chunk
599.11 kB against 580.20 kB before this work.

Second rolled-back rehearsal, same single-statement method: step 7 applies in
58 ms; all 53 existing `client_events` rows satisfy the eleven value check;
`claim_collection_jobs` (LANGUAGE sql, `returning j.*`) keeps working after the
new columns and a claimed job carries `location_id` and `region_id`;
`client_results_latest` keeps working after the new `ai_results` columns.

Machine note: from about 12:00 UTC node runs on this PC crashed now and then
(segmentation fault, V8 fatal error, a garbled read of `typescript.js`, one
build failing inside autoprefixer, another on a file that exists). The same
command passed on a repeat every time. Measured at 12:35 UTC: 41 GB of a 47.9
GB commit limit in use with 11.8 GB of physical memory free, 29 Claude
processes and 41 node processes. Builders were told to run no type check and no
build; the orchestrator runs them and repeats a crashed run. `node_modules` was
not modified (no file changed in six hours).

## 5. Live facts read on 2026-11-13

PostgreSQL 17.6. 68 clients, 66 with prompts, 545 prompts, 474 active. No
market id fails the two capital letters shape. Scheduled clients whose answers
move on deploy day are counted in spec section 6.7.

The invites work that blocked `Onboard.tsx` was reviewed
(`docs/qa/pending-invites-review-2026-11-13.md`, PASS WITH FINDINGS), committed
as `ec67a54` and pushed at 11:44 UTC on the owner's go. The owner applied its
audit type SQL the same hour; the live `client_events` type check then held ten
values, the last being `invite_resent`.

## 6. Packets 5 and 6, final review, first browser checks

Packets 5 and 6 (bg-app): the pages (Prompts, Account, AI Visibility,
Competitors, Mentions, Brand Sentiment, Overview) and the Onboard wizard.
Orchestrator checks after them: `tsc --noEmit` exit 0, 65 of 65 node test files
pass (three needed a second run on this machine), production build exit 0,
entry chunk 599.51 kB against 580.20 kB before this work.

Final independent review, three bg-verify lenses, two at a time, read-only, no
browser, no build, no git:

| Lens | Report | Verdict |
|---|---|---|
| Server and database | `docs/qa/multi-location-review-server-2026-11-13.md` | PASS WITH FINDINGS, 0 blocker, 0 major, 0 medium, 4 low, 5 info |
| Frontend against spec and design | `docs/qa/multi-location-review-frontend-2026-11-13.md` | FAIL, 0 blocker, 1 major, 3 medium, 11 low, 6 info |
| Regression for one-location clients | `docs/qa/multi-location-review-regression-2026-11-13.md` | PASS WITH FINDINGS, 0 blocker, 0 major, 2 medium, 3 low, 5 info |

The major finding (F1): a one-location Onboard wizard with more prompts than
the plan cap reached a dead end, because the server refuses above the cap for
both shapes and the override checkbox rendered only for a multi-location
wizard.

Browser checks from the orchestrator seat, headless Chrome over CDP, demo mode,
before the fix round:

- The first two runs failed on every route with a syntax error in one
  dependency chunk. The file on disk and the file as served were valid; the
  headless profile had cached a bad copy from the hour when node runs were
  crashing. A fresh profile fixed it. A profile kept between runs can hold a
  corrupted immutable file: delete the profile before judging.
- One location, the same script and method as 2026-11-10 (`density.mjs`):
  every heading position on Overview and AI Visibility is identical to the
  2026-11-10 baseline at 1440 and at 390 wide ("Your prompts" at 682 px and
  1,158 px). No sideways scroll on eight routes at both widths.
- Confirmed in the browser: regression finding R1. In demo mode the Locations
  block stayed a loading skeleton and the Account section read "0 of 1",
  because the provider waits for an active client that demo mode never sets.
- Five locations (state injected into the provider): the sidebar block lists
  All locations, three rows and "+ 2 more"; the AI Visibility table shows a
  location chip per prompt and "Split by location" (28 px tall at 1440, 44 px
  at 390); "Your prompts" sits 20 px lower than with one location (702 and
  1,234 against 682 and 1,214 by that script's phone method); the "Ask in"
  picker on Prompts opens inside the viewport, is a multi-select listbox,
  keeps open while toggling by keyboard and closes on Escape; the Account
  Locations section lists five rows without overflow at 390.
- Not exercised yet: choosing one location in the sidebar and reading the
  filtered pages (the script looked for a test hook the rows did not carry,
  frontend finding F13).

Fix round: bg-backend on Opus (server L1 to L4, I1,
I3, test R9) and bg-app (F1 to F15, R1 to R6), then bg-architect for two spec
passages (R7, R10). I4 and I5 are accepted and recorded, not changed.

## 7. Fix round, re-review, third rehearsal, browser checks after the fixes

Fix round 1: bg-backend on Opus closed server L1 (a failed locations read in a
scheduled run is now marked transient and the scheduler does not stamp the
cycle, so the next hour retries), L2, L3 (`set local lock_timeout = '5s'` right
after `begin`, pre-check P5 for running jobs), L4, I1, I3 and added the R9
test. bg-app closed F1 to F15 and R1 to R6. bg-architect corrected spec 6.7
(research row) and 4.5 (what a deploy before the migration would do). I4 and
I5 are accepted and unchanged.

Orchestrator checks after it: `tsc --noEmit` exit 0; 65 of 65 node test files
pass (four needed a second run, two of them after a segmentation fault);
production build exit 0 on the fourth run (two segmentation faults and one
exit 3 before it), entry chunk 601.22 kB.

Re-review, two bg-verify lenses on Opus, read-only:

| Lens | Report | Verdict |
|---|---|---|
| Server and database | `docs/qa/multi-location-fix-rereview-server-2026-11-13.md` | PASS WITH FINDINGS, 0 blocker, 0 major, 0 medium, 1 low, 3 info; L1 to L4, I1, I3 and R9 closed |
| Frontend | `docs/qa/multi-location-fix-rereview-frontend-2026-11-13.md` | PASS WITH FINDINGS, 0 blocker, 0 major, 0 medium, 3 low, 5 info; all 21 earlier findings closed |

Third rehearsal, the FINAL file, rolled back. The text between `begin;` and
`commit;` (file lines 88 to 303) was executed twice inside one `do` block that
ends in `raise exception`. The block computed the md5 of the text it ran
(whitespace collapsed): `b631c9296ac0bbddd8e83dc4bbf85a83`, 10,919 characters,
equal to the md5 of the same lines of the file on disk. So the rehearsed text
is the file. Queue idle (0 running, 0 pending jobs), no long query.

| Check | Result |
|---|---|
| First run, second run | 95 ms, 73 ms, no error on the second run |
| Locations, primaries | 66, 66 |
| Prompts, without a location | 545, 0 |
| Clients with prompts and no primary | 0 |
| Prompt and location on different clients | 0 |
| Primary differs from the clients mirror | 0 |
| prompts_location_fk | FOREIGN KEY (location_id, client_id) REFERENCES client_locations(id, client_id), one constraint |
| Indexes on client_locations | pkey, client_locations_id_client_uq, idx_client_locations_client, uq_client_locations_live (WHERE archived_at IS NULL), uq_client_locations_primary (WHERE is_primary AND archived_at IS NULL) |
| Policy | one, SELECT, is_admin() OR has_client_access(client_id) |
| Triggers on prompts | trg_enforce_prompt_cap, trg_prompt_location |
| Routine grantees | owner and service_role only; anon, authenticated, PUBLIC: 0 rows |
| Functions | all five SECURITY DEFINER with an empty search_path |
| client_events type check | eleven values, the last location_change |
| New columns | prompts.location_id NOT NULL; the five stamp and job columns nullable |
| Country primary, add a city of the same country plus another country | 2 rows added |
| Make the new country primary | primary_set, clients mirror updated, the 3 prompts stayed on the old location, one primary |
| Add past a limit of 3 | refused, 23514 location_limit_reached |
| A real viewer inserts one prompt into each of two locations | 2 rows, 2 locations |
| The same viewer: locations visible, of other clients | 2, 0 |
| The same viewer: update location_id, call the add function, write the table | 42501, 42501, 42501 |
| Delete a client that still has a prompt | refused by prompts_client_id_fkey, as today |
| Delete its prompts, then the client | client gone, its locations cascade to 0 |

Read back after the run: no client_locations table, no new column, no new
function, one trigger on prompts, 545 prompts, 68 clients, no probe row, the
type check without location_change, no transaction left open.

One probe query from the regression review does not run as written (a row
comparison against a two-column subquery); the mirror check above uses a join
instead. Still not rehearsed: two sessions at once.

Browser checks after the fixes, headless Chrome over CDP, demo mode, fresh
profile each run:

- One location (`density.mjs`, the 2026-11-10 method): every heading position
  on Overview and AI Visibility equals the 2026-11-10 baseline at 1440 and 390
  wide. The header badge now reads the location label (demo: Worldwide), was
  the market id. No sideways scroll on eight routes at both widths.
- R1 closed in the browser: the demo sidebar shows one location, no skeleton.
- Five locations (injected): sidebar rows carry the test hook; choosing one
  country in the sidebar at 1440 and, through the menu drawer, at 390 filters
  AI Visibility ("No prompts in Germany yet."), and Overview, Competitors,
  Mentions, Brand Sentiment and Recommendations render without sideways scroll.
  "Split by location" shows five rows. "Ask in" on Prompts is a multi-select
  listbox that opens inside the viewport, keeps open while toggling by
  keyboard and closes on Escape. Account lists five rows at 390 without
  overflow. In demo the filter is not persisted (no signed-in user id), by
  design after F12.
- The script crashed several times with a segmentation fault or a timeout
  before a clean run; that is the machine (commit charge near its limit).

Not checked by anyone: a real signed-in account, a real phone, a screen
reader, Firefox, light mode by measurement, the client-locations endpoint
against the live database (it does not exist until the migration is applied),
two sessions writing at once.

## 8. Fix round 2 and the state handed to the owner

Fix round 2 closed the four low items of the re-review: frontend N1 (the
"Each location of a question uses one prompt." line shows only for a wizard
with several locations), N2 (Generate on Recommendations is judged on the
unfiltered totals), N3 (the filter id normalisation and the storage key builder
moved to `src/lib/locations.ts` as pure functions, six new checks in
`tests/locations_view.test.js`, 28 in total), and server N1 (two read-back
expectations in the migration file's comments now match what PostgreSQL
prints). These four were re-checked from the orchestrator seat by reading the
diffs and by the checks below, not by a third bg-verify run.

The migration text between `begin;` and `commit;` did not change in round 2:
its md5 is still `b631c9296ac0bbddd8e83dc4bbf85a83`, the text rehearsed in
section 7. Every line below `commit;` is a comment.

Checks on the final tree: `tsc --noEmit` exit 0; 65 of 65 node test files pass
(two needed a second run); production build exit 0, entry chunk 601.26 kB
against 580.20 kB before this work (Onboard 37.58, Prompts 20.75, Account
59.42, AI Visibility 90.58, Recommendations 28.16 kB). The build needed many
attempts on this machine: segmentation faults and, once, a null byte inside a
chunk esbuild was handed. Measured at that time: 4.4 GB of a 47.9 GB commit
limit free, 37 node and 26 Claude processes. Every file of the commit set was
then read back from disk: all valid UTF-8, no null byte.

Scans over the 63 files of the commit set (8,859 added lines), each pattern
proven with a positive control: no em or en dash, no address outside the
reserved example domains, no secret shaped string, no client or person name.
No file that Layout imports imports motion or calls scrollIntoView. Five added
lines in `Onboard.tsx` carry slate classes: they are the old one-location
prompt list re-emitted with a changed key, kept so that wizard looks as it
did.

Final browser pass, both widths, clean on the first run: no sideways scroll
on any route in the one-location, five-location and filtered states; "Your
prompts" at 682 px (1440) with one location; with a filter on a country that
has no prompt yet, Recommendations reads "Showing 1 of 5 locations. New advice
always covers every location." and Generate stays enabled. The only console
error on every page is the external help widget failing to fetch its config
from localhost.

Open after this work, none blocking, each recorded in a review:

- Server I4 (a malformed body is answered 400 before authentication, without
  CORS headers) and I5 (no rate limit on add and archive, archived rows are
  never purged): accepted.
- Server re-review N2 (a transient refusal that repeats every hour is not
  visible to the watchdog), N3 (a failed clients or prompts read in
  `_enqueue.js` is still stamped as a skipped cycle, older than this work), N4
  (two untested limit cases).
- Frontend re-review INFO items: old v1 filter keys left in browsers; the
  wizard reads the cap from `PLAN_PROMPTS` and the server from
  `plan_prompt_caps` (equal today: 5, 7, 18, 35, 56, 200, 200, 100000); the
  header badge wrappers carry the test hook without aria-pressed.
- Copy: every new sentence is an English literal marked
  `copy: pending bg-copy`; `i18nContext.tsx` was not edited.
- The seven owner questions of spec section 14 run on their defaults.
- The 500 credit monthly SerpApi pool is still not enforced in code.

Order for the owner: apply `db/supabase-client-locations-2026-11-13.sql` in
the SQL Editor, read back, then commit and push (one Netlify build). Never the
other way round (spec 4.5).

Clock note: sections 6 to 8 carry no clock times on purpose. The live health
endpoint read 13:34 UTC on 2026-11-13 shortly after the owner reported the
migration applied; the hour ranges first written into these headings were
estimates and were removed.

## 9. Applied by the owner, read back

The owner applied `db/supabase-client-locations-2026-11-13.sql` in the SQL
Editor on 2026-11-13 and gave the go for commit and push in the same message.
The Supabase connector of the orchestrator session then failed on every call
(also on a one line query, for several minutes; the Supabase status page read
all systems operational and the live health endpoint read supabase ok on the
old build). The read-back was therefore one query the owner ran in the SQL
Editor and pasted back:

| Check | Result |
|---|---|
| Locations, primaries | 66, 66 |
| Prompts, without a location | 545, 0 |
| prompts.location_id nullable | NO |
| Prompt and location on different clients | 0 |
| prompts_location_fk | FOREIGN KEY (location_id, client_id) REFERENCES client_locations(id, client_id) |
| Triggers on prompts | trg_enforce_prompt_cap, trg_prompt_location |
| Policies on client_locations | client_locations_read, SELECT |
| The five functions | 5 present |
| Function grants to anon, authenticated, PUBLIC | 0 |
| New columns on collection_jobs and ai_results | 5 |
| client_events type check carries location_change | yes |

Every value equals the third rehearsal (section 7). Not read back on the live
database because the connector was down: the index list, the SECURITY DEFINER
flags, the column privileges of authenticated on prompts and the table grants;
all four were read in the rehearsal of the same text. The header of the SQL
file now says APPLIED; its body is unchanged (same md5).
