VERDICT: PASS WITH FINDINGS

# Design review: `docs/arch/mcp-admin-tools.md` (admin MCP at `/mcp/admin`)

Reviewer: `bg-verify` (Opus), read-only, 2026-11-24. Subject: the design text at
its state on disk this date. Nothing was built, so this reviews the spec, not
code. Evidence is the repo at HEAD `014a6d8` plus the working tree, and
read-only catalog and SELECT queries against project `duiyifepitvugyulobqm`.

Counts: 0 BLOCKER, 0 MAJOR, 3 MEDIUM, 6 LOW, 8 INFO. No live security exposure
was found, so no HUMAN CHECKPOINT. The build may start once the three MEDIUM
items are written into the spec; none of them needs a product ruling.

## Answers to the eight questions, short

1. **Client credential to admin tools: no path.** `mcp-server.js:1289-1292`
   routes only `CLIENT_API_KEY_RE` and `ACCESS_TOKEN_RE` shapes and answers 401
   before `createClient` for anything else, so a `bgadm_` key at `/mcp` reads
   nothing. In the new function, `^bgadm_([a-f0-9]{48})$` (design 3.1) cannot
   match `bgmcp_<id>_<48hex>` (`_client_api_key.js`), `bgmat_<48hex>`
   (`_oauth.js:59`) or `bgmrt_<64hex>` (`_oauth.js:60`). The rewrite is not a
   boundary at all (the function is reachable at
   `/.netlify/functions/mcp-admin` regardless), and the design correctly puts
   the boundary in the function. The rewrite itself is missing from the spec:
   M2.
2. **Creator re-check: sufficient and fail-closed as specified** (design 3.3
   step 3, "Any failure, including a read error: 403"). `isBannedUser` is
   exported (`_auth.js:460`) and treats an unparseable `banned_until` as banned
   (`_auth.js:156-163`). Mirrors `creatorStillHasAccess`
   (`mcp-server.js:1112-1128`), which is false on any error.
3. **`admin_add_prompts`:** cap copy faithful (L1 qualifies the word
   "active"), lock sound, no deadlock found (I3), FK interaction sound, PUBLIC
   execute handled by 7.4. The stated race bound is wrong: L2.
4. **Type check recreate: safe, and the twelve values are exactly right**
   (live `client_events_type_check` holds plan_change, trial_grant, comp_grant,
   trial_expired, onboarded, signup, stripe_change, stripe_provision,
   mcp_fix_marked, invite_resent, location_change, account_change). Guard
   tightening: I5.
5. **Minting snippet: no plaintext on screen, in history or in the SQL
   Editor.** It does reach the process command line and a plaintext config
   file: L4. `claude mcp add --transport http --scope user <name> <url>
   --header "..."` matches the documented form; not executed here.
6. **Gates, errors, logging, paging: sound,** with two gaps: the search
   filter (L3) and the truncated `get_client` list (L5).
7. **Tests: adequate for the JavaScript, thin for the SQL** (M3).
8. **Project rules: respected.** Archive is an UPDATE, the tests grep for
   DELETE (6.5, 12). One location per prompt (6.4). No `.ts` require (4).
   `mcp-server.js`, `_cost.js`, `_plans.js`, `stripe-webhook.js` untouched.
   The doc names a client by id only ("client 53") and has no dashes. One
   wrong factual claim: I1.

## MEDIUM

### M1. The table grant leaves DELETE and TRUNCATE with service_role

**What.** Design 3.2 (lines 70-72) says "grant select, insert, update to
service_role (no delete, no truncate)" and "revocation is a stamp, never a
delete" (line 68). A GRANT adds privileges; it removes none.

**Evidence.** Live default ACL for objects postgres creates in `public`
(`pg_default_acl`): tables get `arwdDxtm` for `anon`, `authenticated` AND
`service_role`. So a new `admin_api_keys` table is born with DELETE (`d`) and
TRUNCATE (`D`) for service_role. The design revokes from public, anon and
authenticated only. The precedent table `client_invite_links` was read back
as "service_role select, insert and update only, no delete or truncate"
(CLAUDE.md 2026-11-14), which needed an explicit revoke.

**Exploit path.** Only a holder of the service key, who can already do
anything, so this is not an exposure. It is the stated invariant failing
silently: any function bug or a future agent's cleanup can delete or truncate
key rows, and the audit trail of which keys existed goes with them.

**Fix.** In 7.1/7.4: `revoke all on public.admin_api_keys from public, anon,
authenticated, service_role;` then `grant select, insert, update on
public.admin_api_keys to service_role;`. R1 must read
`information_schema.role_table_grants` for the table and assert service_role
holds exactly SELECT, INSERT, UPDATE and anon/authenticated hold nothing.

### M2. No `netlify.toml` entry: `/mcp/admin` serves the SPA

**What.** The design serves the function "at `/mcp/admin`" (line 34) and never
mentions `netlify.toml`, a redirect or a timeout (grep of the doc for
`netlify.toml`, `redirect`, `timeout`: zero hits).

**Evidence.** `netlify.toml:84-86` maps `from = "/mcp"`, an exact path, to
`mcp-server`. `/mcp/admin` matches nothing else before the SPA fallback at
`netlify.toml:128-130` (`from = "/*"`, `to = "/index.html"`). Built as
written, `claude mcp add ... /mcp/admin` points at the static index, so every
call fails and the failure reads as an auth or protocol problem.

**Fix.** Add to the spec, in this order and both above `/*`:
`[[redirects]] from = "/mcp/admin" to = "/.netlify/functions/mcp-admin"
status = 200 force = true`, placed BEFORE the `/mcp` block for readability
(exact paths, so order between them does not change matching), and
`[functions."mcp-admin"] timeout = 26` (default is 10 s; `list_clients` with
`zero_prompts_only` scans up to 5 pages, each with a clients read and an
`admin_prompt_counts` RPC, design 6.1). Add a test that reads `netlify.toml`
and asserts the redirect exists and precedes `/*`.

### M3. The SQL that enforces the cap, the lock and the audit has no automated test

**What.** Design 12 (lines 360-363): the RPCs are tested through "a
JavaScript model ... that mirrors the SQL"; the real SQL only by R4, a manual
rolled-back dry run. A JavaScript mirror of SQL is the `_plans.js` drift
pattern this project has already paid for (CLAUDE.md, C1 to C4).

**Evidence.** Design 7.6 R4 names "a dry run of both write functions" with no
case list. The properties a mirror cannot prove: the advisory lock is taken
before the count; the count uses the same predicate as
`enforce_prompt_cap()`; the definer function does not DELETE; the type-check
guard raises on a mismatch.

**Fix.** Two additions, no new infrastructure.
(a) A static test over `db/supabase-mcp-admin-2026-11-24.sql` that asserts:
`pg_advisory_xact_lock(hashtextextended('prompts_cap:'` appears before the
first `count(` in `admin_add_prompts`; the count predicate is
`is_active is true`; no `delete` and no `truncate` token in either write
function; `security definer` and `set search_path = ''` on all three; the
revoke line names public, anon, authenticated for all three.
(b) R4 written as a numbered case list, each a SELECT inside the rolled-back
block, with its expected result: add exactly to the cap (ok); add cap+1 (raises
`prompt_cap_reached`, zero rows inserted); the same with `allow_over_cap`
(ok, `over_cap` true, one `client_events` row); another client's location id
(`location_invalid`); an archived location (`location_archived`); no location
on client 53 (a primary is created, rows land on it); 101 rows
(`too_many_rows`); a duplicate inside the call and against an active prompt
(skipped, reported); archive of another client's id (`not_found`, row
unchanged); re-archive (no audit row); the type-check guard against a
tampered expected list (raises).

## LOW

### L1. "Active" must be spelled `is_active is true` everywhere

`enforce_prompt_cap()` (live source) counts `is_active is true`, while
`enforce_prompt_location()` treats `coalesce(is_active, true)` as active, and
the archive in 6.5 matches `AND is_active` (a NULL row is never archived).
`prompts.is_active` is nullable with default true (live `information_schema`);
0 rows are NULL today (SELECT). **Fix:** state in 6.4 step 4 that the cap
count is `is_active is true` (faithful to the trigger), and in 6.5 match
`is_active is not false` so a NULL row can be archived. Insert with an
explicit `is_active = true` (already specified).

### L2. The race bound "one prompt over the cap" is wrong

Design lines 224-227. The viewer path is the trigger, which takes no lock
(live `enforce_prompt_cap()` source: a plain count, no `for update`, no
advisory lock). Under READ COMMITTED neither transaction sees the other's
uncommitted rows, so a viewer statement committing while the admin
transaction is open passes its own check and the admin's count does not see
it. The overshoot equals the rows of every viewer statement that commits in
that window; one Prompts page "Ask in" action is one statement with one row
per selected location, up to the plan location limit (25 on managed,
`PLAN_LOCATION_LIMIT`). The window is milliseconds, so the practical risk is
small. **Fix:** correct the sentence to "the worst case is the rows of the
viewer statements that commit while the admin call is open", keep it recorded
as not closed, and name the closure for later: `enforce_prompt_cap()` taking
the same `prompts_cap:` advisory lock.

### L3. `list_clients.search` needs escaping before it reaches PostgREST

Design 6.1 matches `search` against three columns, which in supabase-js is an
`.or('name.ilike.*x*,brand_website.ilike.*x*,slug.ilike.*x*')` string. A
comma, parenthesis or dot in `search` changes the filter grammar (a value of
`a,plan.eq.free` adds a condition), and `%` and `_` act as wildcards. The
caller is an admin who can already read every row, so this is correctness,
not exposure. **Fix:** restrict `search` to `[\p{L}\p{N} .\-]` after trim
(enough for names, domains and slugs), escape `%` and `_`, and quote the
value in the `or()` string; or do the match inside `admin_prompt_counts`'s
sibling RPC with a bound parameter.

### L4. The minting one-liner puts the key on the process command line and in a plaintext file

Design 10, line 339. `claude mcp add ... --header "Authorization: Bearer $k"`
expands `$k` into the argv of the `claude` process, which is readable by any
local process for its lifetime and is captured by Windows process creation
auditing (event 4688 with command line) or EDR telemetry where enabled. The
key then lives in plaintext in the user-scope Claude Code config. PSReadLine
history stores the literal `$k`, not the value, so history is clean, and
nothing prints it. Design line 98-99 says the key never appears "on screen"
and names the config file, which is accurate; the argv exposure is not
stated. **Fix:** say both in 3.4 so the risk is chosen, not discovered; keep
the 90-day expiry. If the argv exposure is unwanted, the alternative is to
write the `mcpServers` entry into the config file directly from PowerShell
instead of calling `claude mcp add`.

### L5. `get_client.active_prompt_texts` truncates without saying so

Design 6.2 returns "up to 200" active texts; caps reach 100,000 (live
`plan_prompt_caps`, enterprise). A drafter told "avoid duplicates" against a
silently truncated list will draft duplicates; the server skips them (6.4),
but the model does not know why. **Fix:** add `active_prompt_texts_truncated`
(boolean) and `active_prompts` (the full count) to the 6.2 output.

### L6. The INSERT in section 10 can match zero rows silently

Line 339 inserts via `select ... where p.role = 'admin' and u.email =
'<admin email>'`. A typo in the address inserts nothing and returns zero
rows, while the key is already registered in Claude Code, so every call then
answers 401 and looks like a server fault. One admin exists today (SELECT),
so a double match is not the risk. **Fix:** tell the operator the `returning`
output must show exactly one row, and if it shows none, run
`claude mcp remove brandgeo-admin --scope user` and mint again.

## INFO

- **I1.** Design 6.1 line 154: "a research client alone holds more" than
  1,000 prompts is false. The most any client holds is 84; all prompts total
  575 (SELECT). The RPC is still the right call (100 clients per page, and
  the cap would bite as data grows); fix the reason, not the design.
- **I2.** `prompts.client_id` is nullable (live `information_schema`) and
  `prompts_location_fk` is MATCH SIMPLE, so a NULL `client_id` would bypass
  the composite FK. 0 such rows exist. The RPC always writes `p_client_id`;
  add `if p_client_id is null then raise` as its first line.
- **I3.** Deadlock analysis, for the record. Admin RPC order: `prompts_cap:`
  advisory, then (only with no location given) `ensure_primary_client_location`
  which takes the `client_locations:` advisory
  (`db/supabase-client-locations-2026-11-13.sql:123`), then the trigger's
  `for share` on the location row (`:193`). `set_primary_client_location`
  takes the `client_locations:` advisory then the row `for update` (`:247`),
  the same order; `archive_client_location` takes only the row `for update`
  (`:230`) and checks active prompts. No path takes `prompts_cap:` besides
  the new RPC. No cycle. Keep it that way: call `ensure_primary` BEFORE any
  explicit `for share` / `for update` on `client_locations` inside the RPC.
  The trigger, not step 3's pre-check, is the real guard against a concurrent
  location archive, and it holds under READ COMMITTED.
- **I4.** The trigger functions the RPC fires are safe under the caller's
  empty `search_path`: `enforce_prompt_location` and
  `ensure_primary_client_location` set `search_path=""`, `enforce_prompt_cap`
  sets `public, pg_temp`, `affiliate_rate_check` sets `public` (live
  `proconfig`). The cap trigger's service-role bypass applies inside the
  definer function because the JWT claims setting is session state, which is
  why 6.4 step 4 is necessary, as the design says.
- **I5.** Type-check guard (7.5): compare the SET of values parsed from
  `pg_get_constraintdef`, not the text, so a reordering by another migration
  is not a false mismatch; and take `lock table public.client_events in
  access exclusive mode` before reading the definition, so nothing can change
  between the check and the recreate. `client_events` holds 89 rows (SELECT),
  so the full revalidation is trivial.
- **I6.** `prompts.category` has no CHECK constraint (live `pg_constraint`),
  and 39 existing rows use values outside the design's list (`local`,
  `discovery`, `brand`, `problem`, `large_scale`). `add_prompts` restricting
  new rows to the eight documented values is fine; `get_client` and
  `list_prompts` must pass existing values through without validating them.
- **I7.** On a 401 with no `resource_metadata`, an MCP client may still probe
  `/.well-known/oauth-protected-resource`, which `netlify.toml:104-106` maps
  to `oauth-prm` (the client resource). Any token obtained that way is
  `bgmat_` and fails the admin shape check, so this is at most a confusing
  sign-in prompt after a revoked or mistyped key, not an exposure.
- **I8.** Every admin tool result (client names, websites, aliases,
  competitors, prompt texts) is sent to the model provider behind Claude
  Code. Expected for an admin support tool and the admin's own choice;
  recorded so a later data-processing inventory lists it.

## What was not checked

- Nothing was executed against the deployed site: no request to `/mcp`,
  `/mcp/admin` or any well-known path. The SPA fallback behaviour in M2 is
  read from `netlify.toml`, not observed.
- `claude mcp add --help` was not run; the syntax judgement in Q5 is against
  the documented form only. The PowerShell one-liner was not run.
- `oauth-prm.js` was not read, so what it advertises for a non-`/mcp` path
  (I7) is inferred from the redirect table.
- `onboard-client.js` (`allow_over_cap` precedent) and `client-locations.js`
  were not read in full; `tests/helpers/fake_supabase_mem.js` was not read,
  so whether it can model an advisory lock or a definer function was not
  assessed.
- No build, no `tsc`, no test run: there is no code to build.
- Supabase JWT expiry, Netlify environment variables, and whether the
  service key in use is the legacy or the new secret key format were not
  read.
- Concurrency claims (L2, I3) are reasoned from the live function sources and
  PostgreSQL READ COMMITTED semantics, not reproduced with two sessions.

## Amendment, 2026-11-24, closed from the builder seat, not by a second review

Every finding above was closed in `docs/arch/mcp-admin-tools.md` and
`db/supabase-mcp-admin-2026-11-24.sql` by the builder. Nobody re-reviewed the
closures independently. The build review that follows covers them again.

- **M1.** The table revoke now names `public, anon, authenticated,
  service_role`, then grants only `select, insert, update` to service_role.
  R1 reads the service_role grants back and expects exactly
  `INSERT,SELECT,UPDATE`, with no other grantee. Doc section 3.2 and 7.4.
- **M2.** Section 5 specifies the `/mcp/admin` redirect, placed before the
  `/mcp` block and the SPA `/*`, plus `[functions."mcp-admin"] timeout = 26`.
  A test pins both entries and their order.
- **M3.** Two parts. (a) Section 12 adds static checks on the SQL file:
  - the lock comes before the first count;
  - the active count is spelled `is_active is true`;
  - there is no delete and no truncate;
  - both functions are `security definer` with an empty `search_path`;
  - the revoke targets;
  - `commit;` comes before the read backs.
  (b) R4 is rewritten as eleven numbered cases. Cases 8 to 10 exercise the
  cap on client 53: fill exactly to the cap, one more refused, then
  `allow_over_cap`. Case 11 checks an archived location.
- **L1.** The active count uses `is_active is true`, the trigger's own
  spelling. The archive uses `is_active is not false`.
- **L2.** Section 6.4 now states the real worst case: the rows of viewer
  statements that commit while the admin call is open. It stays recorded as
  not closed. The closure is `enforce_prompt_cap()` taking the same lock,
  which is outside this release.
- **L3.** `search` is matched in JavaScript over a keyset id scan. It never
  goes into PostgREST `or()` or `ilike`.
- **L4 and L6.** Section 3.4 states the argv and plaintext config exposure,
  and the alternative of writing the entry by hand. Section 10 requires the
  `returning` output to show exactly one row, and says what to do when it
  shows none.
- **L5.** `get_client` returns `active_prompt_texts_truncated` and the full
  `active_prompts` count.
- **I1.** The reason for the RPC is corrected: 575 prompts in total today,
  84 at most per client.
- **I2.** Both write functions refuse a null client, actor or key id before
  anything else.
- **I3 and I4.** No change. Section 6.4 now records the lock order
  (`ensure_primary_client_location` before any explicit `for share`).
- **I5.** The pre-check takes `lock table public.client_events in access
  exclusive mode` and compares the parsed value set. It accepts the twelve
  values, or thirteen when the file already ran.
- **I6.** Legacy categories pass through `list_prompts` unvalidated.
- **I7 and I8.** Recorded in the new section 13, with no change.
