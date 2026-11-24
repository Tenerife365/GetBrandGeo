VERDICT: PASS WITH FINDINGS

# Admin MCP server, build review (bg-verify, read-only), 2026-11-24

Reviewed: the uncommitted working tree build of the admin MCP server.

- `brandgeo-dashboard/netlify/functions/mcp-admin.js` (new, 765 lines, read in full)
- `brandgeo-dashboard/netlify/functions/_admin_api_key.js` (new, 21 lines)
- `db/supabase-mcp-admin-2026-11-24.sql` (new, 583 lines, read in full, NOT applied)
- `brandgeo-dashboard/netlify.toml` (this work's two hunks only)
- `brandgeo-dashboard/tests/mcp_admin.test.js` (run, not read line by line)

Against: `docs/arch/mcp-admin-tools.md` (sections 1 to 6.5 read) and
`docs/qa/mcp-admin-tools-design-review-2026-11-24.md`.

No file other than this report was written. No git command that changes
state, no deploy, no database read or write.

Summary: 0 BLOCKER, 0 MAJOR, 0 MEDIUM, 3 LOW, 8 INFO. No live security
exposure (nothing is deployed or applied), so no HUMAN CHECKPOINT.

## 1. Checks run

```
cd brandgeo-dashboard && node tests/mcp_admin.test.js
all 67 checks passed            (exit 0)

cd brandgeo-dashboard && node tests/ts_require_bundler.test.js
5 passed                        (exit 0)

git status --porcelain -- <the eight protected or shared files below>
(empty output: all untouched)
```

Protected files confirmed untouched by `git status --porcelain`:
`mcp-server.js`, `_plans.js`, `_cost.js`, `stripe-webhook.js`,
`accept-terms.js`, `_terms_gate.js`, plus the shared helpers `_auth.js` and
`_locations.js` that the new function requires.

Not run: `tsc`, `npm run build` (neither compiles `netlify/functions`; the
tsconfig includes `src` only), the SQL against any Postgres.

## 2. Binding rules table

| # | Rule | Result | Evidence |
|---|---|---|---|
| 1 | Prompts archived, never deleted | PASS | `admin_archive_prompts` is an UPDATE setting `is_active = false` filtered by `client_id`, `id = any(...)`, `is_active is not false`; no DELETE anywhere in the SQL file or in `mcp-admin.js` (grep for `delete` finds none in either). |
| 2 | Every prompt has one location; archived locations refused | PASS | `admin_add_prompts` calls `ensure_primary_client_location` first (SQL L211), then locks each requested location `for share` and refuses one that belongs to another client or is archived (SQL L222 to L234, `location_invalid`). Inserted rows carry `location_id`; the composite FK `(location_id, client_id)` from 2026-11-13 still applies. |
| 3 | No `.ts` require under `netlify/functions` | PASS | `mcp-admin.js` requires `_auth`, `_cost`, `_admin_api_key`, `_locations` only; `_locations.js` requires `_country_names` and `_market_regions`. `ts_require_bundler.test.js` passes. |
| 4 | Protected files untouched | PASS | Section 1. |
| 5 | Creator re-checked every request as existing, unbanned admin | PASS | `resolveAdminKey` (`mcp-admin.js:589` to `609`) runs on every request after the key regex: `auth.admin.getUserById(created_by)`; error, missing user or `isBannedUser` gives 403; `user_profiles.role !== 'admin'` gives 403; any throw gives 403. `isBannedUser` treats an unparseable `banned_until` as banned (`_auth.js:156` to `163`). |
| 6 | No secret, prefix, hash, prompt text or search string in logs | PASS | The one log line (`mcp-admin.js:624`) carries method, tool name, client id, key uuid, status, error code, ms. Unhandled errors log `scrub(e.message)`, which redacts `bg(mcp|mat|mrt|ocs|adm)_` tokens and 48+ hex runs (`mcp-admin.js:96` to `98`). The `last_used_at` stamp failure logs the key uuid only. |
| 7 | Rate limits fail closed | PASS | Per-minute, per-day and write-hour checks go through `affiliate_rate_check` in the `mcpadm:` namespace; a counter error throws to the outer handler and returns 500 before any tool runs. Covered by the test file. |
| 8 | Prompt cap atomic: advisory lock before count, unless `allow_over_cap` | PASS | `pg_advisory_xact_lock(hashtextextended('prompts_cap:' \|\| id, 0))` at SQL L201, before the client read and the active count at L271; `prompt_cap_reached` raised unless `p_allow_over_cap`. Same lock key in `admin_archive_prompts`. |
| 9 | One `client_events` row per write that changes something | PASS | Add: early return with no event when nothing new is inserted, otherwise one `admin_prompt_change` row. Archive: one row only when at least one prompt changed. The type check gains `admin_prompt_change` through a guarded pre-check (SQL L52 to L90). |
| 10 | `mcp-server.js` refuses a `bgadm_` key | PASS | `mcp-server.js:1288` to `1291` routes only `bgmcp_<id>_<48 hex>` and `bgmat_<48 hex>`; anything else is 401 before `createClient`. |
| 11 | `/mcp/admin` rewrite routes before `/mcp` | PASS | `netlify.toml`: the `/mcp/admin` redirect (status 200, force) sits directly above the `/mcp` redirect and above the `/*` SPA fallback. Netlify matches the first rule, and `/mcp` is an exact path, so it could not swallow `/mcp/admin` in any case. Function timeout 26 set. Not checked on the live site (not deployed). |
| 12 | SECURITY DEFINER exposure | PASS | Both write functions are SECURITY DEFINER with `search_path = ''` and fully qualified names; EXECUTE revoked from `public`, `anon`, `authenticated` by name (closes the Supabase default-privilege trap) and granted to `service_role` only (SQL L434 to L439). `admin_prompt_counts` is SQL, stable, invoker. `admin_api_keys`: RLS on, no policy, all privileges revoked, then select, insert, update to `service_role` only. |
| 13 | Cross-client prompt and location ids | PASS | Archive matches on `client_id` too, so a foreign id lands in `not_found` with no detail. Foreign location gives `location_invalid`. `list_prompts` filters `.eq('client_id', clientId)` and loads location labels through `loadLocationsByIds(sb, clientId, ...)`, scoped by client (`_locations.js:143` to `155`). |
| 14 | Injection through text, cursors, search | PASS with L2 | `search` is matched in JavaScript over a keyset id scan, never inside a PostgREST `or()` filter. `plan` filter checked against `/^[a-z_]{1,40}$/`. Texts go as a jsonb parameter, never concatenated. Cursor ids are numbers passed to `.gt()`. See L2 for an out-of-range cursor. |
| 15 | Response size bounds | PASS | `list_clients` at most 5 batches of 200; `get_client` at most 200 active texts with a truncation flag; `list_prompts` paged with `limit + 1`; add at most 25 texts by 10 locations, 100 rows; archive at most 50 ids. Body cap 65,536 bytes checked before parse (413). |
| 16 | Error messages do not leak internals | PASS | SQL errors map by leading token to fixed tool errors (`SQL_ERROR_CODES`, `sqlToolError`, message sliced to 300 characters and only for the mapped tokens the SQL itself raises); everything else is a generic "Internal error". |
| 17 | Key parsing, expiry, revocation | PASS | Key regex `^bgadm_[a-f0-9]{48}$` checked before any DB read; lookup by sha256 only; revoked, missing, unparseable or past `expires_at` all give the same 401 as an unknown key. Table CHECK caps expiry at 366 days. |
| 18 | Read scope enforced | PASS | A `read` scope key gets only read tools from `tools/list` (`mcp-admin.js:574` to `584`) and a scope error on a write tool in `tools/call`. |

## 3. Findings

### LOW

**L1. The write limit counts calls, while its message says "prompt changes".**
Where: `mcp-admin.js:46` (`WRITES_PER_KEY_PER_HOUR = 60`), the message at
`mcp-admin.js:690`.
Scenario: one `add_prompts` call may insert up to 100 rows (25 texts by 10
locations, refused above 100). Sixty calls an hour, all inside the limit,
can insert up to 6,000 prompt rows for one key while the refusal text tells
the caller the limit is "60 prompt changes an hour per key". With
`allow_over_cap` true the plan cap does not bound this either, and each new
active prompt is collection spend on the next scheduled run. The plan cap
remains the real bound whenever `allow_over_cap` is false.
Fix: either count rows (charge the counter by the number of rows the RPC
reports as inserted or archived) or reword the message to "write calls an
hour per key" and state the per-call row ceiling in the tool description.

**L2. A crafted cursor above the int4 range returns 500, not `invalid_cursor`.**
Where: `decodeCursor`, `mcp-admin.js:130` to `138` (accepts any
`Number.isSafeInteger` id above 0), used at `mcp-admin.js:312`
(`clients.id`) and `mcp-admin.js:420` (`prompts.id`).
Scenario: an admin client sends a base64url cursor whose id is
3,000,000,000. It passes `decodeCursor`, goes into `.gt('id', after)` on an
int4 column, PostgREST answers with an out-of-range error, and the tool
returns 500 "Internal error" and logs it as an unhandled failure. No data
leaks; the effect is a misleading 500 in the logs and to the caller.
Fix: bound the decoded id to `INT4_MAX` (already defined at
`mcp-admin.js:68`) inside `decodeCursor`, so the input error path answers
`invalid_cursor`.

**L3. The design review's L2 (viewer cap race) remains open.**
Where: the existing viewer prompt cap trigger, outside this diff (recorded
by the design review as not closed). The new admin path takes the advisory
lock; the viewer insert path does not.
Scenario: a viewer adding prompts from the dashboard at the same moment as
an admin call can both pass their count, so the client ends one or more
prompts over cap. Bounded by the size of one viewer insert.
Fix: have the viewer trigger take the same `prompts_cap:<client_id>`
advisory lock before its count. Separate migration, separate review.

### INFO

**I1. No pre-auth limit on key lookups.** `mcp-admin.js:659` to `661`: any
token matching the key regex costs one indexed hash lookup before any rate
counter applies, since counters key on the resolved key row. Brute force is
infeasible (192 bits). `mcp-server.js` has the same shape (its counters key
on the resolved credential), so this is parity, not a regression. A per-IP
counter before the lookup would close the cost angle on both.

**I2. JavaScript and SQL text normalisers differ.** JavaScript rejects
`[\x00-\x1f\x7f]`; SQL rejects `[[:cntrl:]]` and collapses whitespace with
its own class. A text that passes JavaScript and fails SQL gets the mapped
`invalid_text` error, so the outcome is safe. Zero-width and bidi control
characters (for example U+200B, U+202E) pass both and can be stored in a
prompt that reads identically to another one; the duplicate check is case
insensitive on the stored string, so such a text is not caught as a
duplicate.

**I3. No unique index on prompts.** Duplicate skipping in
`admin_add_prompts` is a read under the advisory lock; a concurrent viewer
insert (which does not take the lock, see L3) can still produce a duplicate
text at the same location.

**I4. Each tool result is sent twice,** as `content[0].text` JSON and as
`structuredContent`. With the page bounds above the worst case is roughly
200 KB per response, well inside Netlify limits.

**I5. Pre-check depends on collation.** The `client_events` type check
pre-check compares sorted value arrays under the database collation; a
mismatch can only make it refuse (fail closed), never apply a wrong set.

**I6. Read-back R1 `other_grants` may count Supabase system roles.** It
counts every grantee other than `service_role` and `postgres`; on Supabase
that may include roles such as `supabase_admin`, so a non-zero result needs
reading before it is treated as a failure.

**I7. The SQL functions trust `p_actor` and `p_key_id`.** Safe only because
EXECUTE is `service_role` only (rule 12). Any later grant of these functions
to `authenticated` would let a caller forge the actor on `client_events`.
Keep the revoke in any future edit.

**I8. Design review closure, as read from the code.** M1 (table grants),
M2 (timeout), M3a and M3b, L1, L3, L5, I2, the I3 lock order, I5 and I6 are
closed in the build. L2 is open (see L3 above). L4 and L6 are documentation
items and were not re-checked against the arch file beyond section 6.5.

## 4. Regression surface

Found by reading the diff and the requires, not by intuition.

- `netlify.toml`: one new redirect above `/mcp` and one new function
  timeout. The existing `/mcp` client server, the OAuth well-known routes
  and the `/*` fallback keep their order. Worth one live probe after deploy:
  `POST /mcp/admin` unauthenticated should answer 401 JSON from
  `mcp-admin`, and `POST /mcp` unauthenticated should still answer 401 from
  `mcp-server`.
- `client_events_type_check` is dropped and recreated with one more value.
  Every writer of `client_events` depends on it; the pre-check refuses to
  run unless the live set is exactly the expected twelve (or thirteen on a
  re-run), so a value added by another session in between blocks the
  migration rather than being lost.
- `affiliate_rate_check` gains a new key namespace (`mcpadm:`); no schema
  change, shared table growth only.
- `_auth.js`, `_cost.js`, `_locations.js` are required, not edited.

## 5. Data and claim integrity

No user-facing number or marketing claim is added. Tool descriptions state
limits that match the constants in `mcp-admin.js`, except the write limit
wording in L1.

## 6. What was not checked

- The SQL file against a real Postgres. Nothing was applied or dry-run, so
  the bodies, the pre-check, the read-backs R1 to R4 and the eleven rolled
  back cases in R4 are reviewed by reading only.
- The live bodies and grants of `enforce_prompt_cap`,
  `ensure_primary_client_location` and `affiliate_rate_check` in
  production; this review assumed the 2026-11-13 and affiliate migration
  files on disk match production.
- How PostgREST binds the `bigint[]` and `jsonb` RPC parameters from
  supabase-js (the tests use a fake client).
- The type of `client_events.actor` against the uuid passed as `p_actor`.
- The content of `tests/mcp_admin.test.js` and its helpers, beyond running
  it; whether its 67 checks cover each path above was not audited.
- `docs/arch/mcp-admin-tools.md` lines 300 to 488.
- Netlify routing on the live site; nothing is deployed.
- `tsc` and `npm run build`; neither covers `netlify/functions`.
- Any key issuance path or admin UI that creates `bgadm_` keys; none was
  in this diff, so who can create a key and how it is shown once was not
  reviewed.

## 7. Amendment, 2026-11-24, by the builder (not a second review)

- L1 closed: the write limit stays a count of write calls, and the refusal
  now reads "Write limit reached: N write calls an hour per key". Arch
  section on limits says one call can add up to 100 prompts. A test checks
  the message text.
- L2 closed: `decodeCursor` refuses an id above 2147483647 with
  `invalid_cursor`. Tests cover `list_clients` and `list_prompts`.
- L3 deferred: the advisory lock in the viewer prompt cap trigger needs its
  own migration and is recorded as a follow-up, outside this change.
- I1 to I8 recorded, not changed.
- Re-checked from the builder seat only: `tests/mcp_admin.test.js` 68 of 68,
  dash scan clean with a positive control.
