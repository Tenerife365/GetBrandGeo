# MCP admin tools: manage any account's prompts from Claude Code

Status: DESIGN, 2026-11-24. Builder: this session. Reviewer: `bg-verify` on Opus
(auth, schema). Owner rulings needed before the build: none; rulings needed
before use are in section 11.

## 1. Goal and scope

The admin (one person today, `user_profiles.role = 'admin'`) supports customers
from Claude Code desktop instead of the dashboard. Release 1 covers the prompt
list only:

| Tool | Writes | What |
|---|---|---|
| `list_clients` | no | id, name, plan, category, active prompt count, cap, locations |
| `get_client` | no | one client's brand context (website, aliases, competitors, locations, cap, current active prompt texts), so the calling model can draft prompts |
| `list_prompts` | no | any client's prompts, active or all, keyset paged |
| `add_prompts` | yes | insert prompts for a client, one row per text per location, cap enforced |
| `archive_prompts` | yes | set `is_active = false` on prompts of one client; never DELETE |

Out of scope, on purpose: unarchive, editing a prompt's text, locations
(add, archive, make primary), plan changes, collection runs, any billing field.
Each is a later release with its own review.

**No server side `suggest_prompts`.** The caller is already an LLM (Claude
Code). A server side suggester would spend BrandGEO's OpenAI budget to do what
the caller does for free, and would add a model call to an admin auth path.
`get_client` returns the context a drafter needs instead; drafting happens in
the conversation and nothing is saved until `add_prompts` is called.

## 2. Hard boundary: the client MCP server is not touched

`mcp-server.js` (the client server at `/mcp`) is NOT edited. The admin tools
live in a new function, `netlify/functions/mcp-admin.js`, served at
`/mcp/admin`. Consequences, each one a property the tests pin:

1. A client key (`bgmcp_<id>_<48hex>`) or an OAuth token (`bgmat_...`) sent to
   `/mcp/admin` fails the admin key shape check and gets 401 before any
   database read. There is no code path that turns a client credential into an
   admin one.
2. An admin key (`bgadm_<48hex>`) sent to `/mcp` fails `mcp-server.js`'s
   existing shape routing and gets 401 there, unchanged.
3. What a client key can reach does not change by a single tool, column or
   row. `mcp-server.js`'s tool list, scopes and gates are byte for byte as
   today.

## 3. The admin credential

### 3.1 Shape

`bgadm_<48 lowercase hex>` (24 random bytes). Regex
`^bgadm_([a-f0-9]{48})$`. No client id inside: an admin key is not bound to a
client. Prefix shown in lists: `bgadm_` plus the first 6 hex characters.

### 3.2 Storage: `public.admin_api_keys` (new table)

| Column | Type | Notes |
|---|---|---|
| `id` | uuid pk default `gen_random_uuid()` | |
| `key_hash` | text not null unique | sha256 hex of the full key; the key itself is never stored |
| `key_prefix` | text not null | `bgadm_` + 6 hex |
| `label` | text not null default `''` | e.g. "Claude Code desktop" |
| `scope` | text not null default `'prompts_write'`, check in (`read`, `prompts_write`) | `read` lists and runs only the read tools |
| `created_by` | uuid not null | the admin's `auth.users.id`; re-checked on every call |
| `created_at` | timestamptz not null default now() | |
| `expires_at` | timestamptz not null default now() + 90 days | check `expires_at <= created_at + interval '366 days'` |
| `last_used_at` | timestamptz | stamped at most once a minute |
| `revoked_at` | timestamptz | revocation is a stamp, never a delete |

RLS on, NO policy for any role. `revoke all ... from public, anon,
authenticated, service_role`, then `grant select, insert, update to
service_role`, so service_role ends with no delete and no truncate (Supabase's
default privileges would otherwise hand it all seven). Only the service key,
inside `mcp-admin.js`, ever reads it, and only by `key_hash`.

### 3.3 Checks on every request, in order

1. `Authorization: Bearer <token>`; anything not matching the regex: 401
   `-32001`, no database read.
2. Row by `key_hash`. Missing, `revoked_at` set, or `expires_at <= now`: 401
   `-32001`. The three are indistinguishable to the caller.
3. Creator re-check: `auth.admin.getUserById(created_by)` exists and is not
   banned (`isBannedUser` from `_auth.js`), and
   `user_profiles.role = 'admin'` for that id. Any failure, including a read
   error: 403 `-32003` "admin_required". A demoted or banned admin's keys stop
   working on the next call, with no revocation step.
4. `last_used_at` stamp when older than 60 s; a failed stamp is logged and
   does not fail the request.

The 401 carries `WWW-Authenticate: Bearer realm="brandgeo-admin"` with NO
`resource_metadata`, so no MCP client tries an OAuth sign-in against this
endpoint. There is no OAuth for admin, by design.

### 3.4 Minting and revocation (manual, Constantin only)

Agents never create keys. A PowerShell snippet run by Constantin generates the
key locally, registers it in Claude Code with `claude mcp add`, and prints an
INSERT carrying only the hash and prefix for him to run in the Supabase SQL
Editor. The plaintext key never appears on screen, in the SQL Editor, in
Supabase, or in any file of this repository. Two exposures remain, chosen and
stated here: `claude mcp add ... --header "Authorization: Bearer $k"` puts the
key in the argv of the `claude` process for its lifetime (readable by local
processes, and captured by Windows process creation auditing, event 4688, or
EDR telemetry where enabled), and Claude Code then keeps it in plaintext in
the user scope config on his machine. PSReadLine history stores the literal
`$k`, not the value. The 90 day expiry bounds both. If the argv exposure is
unwanted, the alternative is to write the `mcpServers` entry into the Claude
Code config by hand instead of calling `claude mcp add`. Revocation is one
UPDATE setting `revoked_at`. Both are in section 10.

## 4. Transport and protocol

Same as `mcp-server.js` section 6, reduced: POST only (405 otherwise), body at
most 65,536 bytes (413), Origin absent or in `ALLOWED_ORIGINS` (403), one
JSON-RPC message per POST (batch arrays 400 `-32600`), notifications 202,
`initialize`, `ping`, `tools/list`, `tools/call`. Protocol versions
`2025-11-25`, `2025-06-18`, `2025-03-26`; `outputSchema` only from
`2025-06-18`. Server info name `brandgeo-admin`.

`netlify.toml` gets two entries, both ABOVE the SPA fallback `/*`, and the
redirect also above the existing `/mcp` block so the longer path is matched
first:

```toml
[[redirects]]
  from = "/mcp/admin"
  to = "/.netlify/functions/mcp-admin"
  status = 200
  force = true

[functions."mcp-admin"]
  timeout = 26
```

Without the redirect `/mcp/admin` would serve the SPA's `index.html` with a
200, which an MCP client reports as a parse error. A test pins both entries
and their order. Plain JavaScript, default
Netlify bundler: it requires `_auth.js`, `_locations.js` (which reads
`_market_regions.js`) and nothing under `src/`, so
`tests/ts_require_bundler.test.js` keeps passing without an exception.

## 5. Gates

| Order | Gate | Refusal |
|---|---|---|
| 1 | method, size, origin, parse, shape | 405, 413, 403, -32700, -32600 |
| 2 | key shape, row, revoked, expired | 401 -32001 |
| 3 | creator is a live admin | 403 -32003 |
| 4 | per key minute, `mcpadm:key:<id>`, 60 a minute | 200 -32029, `Retry-After` |
| 5 | per key day, `mcpadm:key:<id>:day`, 2,000 a day | 200 -32029 |
| 6 | write tool needs scope `prompts_write` | tool error `scope_read_only` |
| 7 | per key writes, `mcpadm:key:<id>:writes:hour`, 60 write calls an hour (one call adds up to 100 prompts) | 200 -32029 |

Counters go through the existing `affiliate_rate_check(p_key, p_limit,
p_window_seconds)` with the new `mcpadm:` namespace (the client server uses
`mcp:`, so the counters never collide). A counter read error throws and
answers 500 `-32603`: fail closed, as `mcp-server.js` does. There is no plan
gate and no research gate: the admin manages every account, research
included, which is the point.

## 6. Tools

All tool input errors return `result {content:[{type:'text', text}],
isError: true}` where `text` is JSON `{ "error": { "code", "message" } }`.
Unknown arguments are rejected (`additionalProperties: false` and a server
check), so a typo never silently means the default.

### 6.1 `list_clients` (read)

Input: `search` (string, 1 to 80, matched case insensitively against `name`,
`brand_website` and `slug`), `plan` (one of the plan ids), `include_research`
(boolean, default false), `zero_prompts_only` (boolean, default false),
`limit` (1 to 100, default 50), `cursor` (opaque, keyset on `id`).

Output per client: `client_id`, `name`, `plan`, `category`, `type`,
`website`, `active_prompts`, `archived_prompts`, `prompt_cap`, `locations`
(`[{ location_id, label, is_primary }]`, live only), `created_at`. Plus
`next_cursor`.

`search` is trimmed, lower cased and matched in JavaScript over the rows of a
keyset scan by `id` (the same up to 5 batches as below). It is never placed
into a PostgREST `or()` or `ilike` string, so a comma, parenthesis, dot, `%`
or `_` in it cannot change the filter grammar or act as a wildcard.

Counts come from a new read RPC, `admin_prompt_counts(p_client_ids
integer[])` (section 7.3). Production holds 575 prompts in total today and the
most any one client holds is 84, but a page of 100 clients would put the row
select near PostgREST's 1,000 row cap as data grows, and one grouped count per
page is cheaper anyway. `zero_prompts_only` filters on its result;
when it is set the server scans forward up to 5 pages to fill the page and
returns `next_cursor` so nothing is skipped. Emails, user ids, Stripe ids and
`plan_grant_note` are never returned.

### 6.2 `get_client` (read)

Input: `client_id` (positive int4). Output: the 6.1 fields plus `brand_name`
(`name`), `brand_aliases`, `known_competitors`, `default_market_id`,
`prompt_cap`, `remaining` (cap minus active, floored at 0), and
`active_prompt_texts` (up to 200 `{ prompt_id, text, category, location_id }`)
so the caller can avoid duplicates while drafting, with
`active_prompt_texts_truncated` (boolean) and `active_prompts` (the full
count), so a drafter knows when the list is partial. Tool error
`client_not_found` when the id does not exist.

### 6.3 `list_prompts` (read)

Input: `client_id`, `include_archived` (default false), `location_id`
(optional filter), `limit` (1 to 200, default 100), `cursor`. Output rows:
`prompt_id`, `text`, `category`, `is_active`, `position`, `location_id`,
`location_label`, `created_at`. Keyset on `id`, same cursor encoding as the
client server. `category` is passed through as stored: `prompts.category` has
no CHECK and 39 rows carry legacy values (`local`, `discovery`, `brand`,
`problem`, `large_scale`), which the read tools never validate or rewrite.

### 6.4 `add_prompts` (write)

Input:

| Field | Rule |
|---|---|
| `client_id` | positive int4, must exist |
| `texts` | 1 to 25 strings; each trimmed, inner whitespace collapsed, 5 to 500 characters after that, no control characters |
| `location_ids` | optional, 1 to 10 positive ints, each a LIVE location of this client; omitted means the primary |
| `category` | optional, one of `general`, `mid`, `large`, `very_large`, `tool_discovery`, `geo_category`, `problem_based`, `direct_brand`; default `general` |
| `allow_over_cap` | optional boolean, default false |

Rows created = texts times locations ("one location per prompt": the same
question in two countries is two prompts, the 2026-11-13 ruling). At most 25
x 10 = 250 rows per call; the server refuses more than 100 rows in one call
(`too_many_rows`) so one call can never fill an Enterprise allowance by
mistake.

Duplicates: a text equal (case insensitive, after normalisation) to an ACTIVE
prompt of the same client at the same location, or repeated inside the call,
is skipped and reported, not inserted.

Everything after validation runs in ONE SQL call, `admin_add_prompts`
(section 7.2), which:

0. refuses a null `client_id`, actor or key id first (`prompts.client_id`
   is nullable and the composite location FK is MATCH SIMPLE, so a null
   would slip past it);
1. takes `pg_advisory_xact_lock(hashtextextended('prompts_cap:' ||
   client_id, 0))`, so two admin calls for one client serialize;
2. resolves the primary with `ensure_primary_client_location` when no
   location is given (client 53 has no location row today; this creates it
   from `clients.default_market_id`, as the trigger would). This runs BEFORE
   any explicit `for share` on `client_locations`, keeping the lock order of
   the location functions, so no deadlock cycle exists;
3. checks every location belongs to the client and is not archived
   (`location_invalid`, `location_archived`), before any insert, holding
   each location row `for share`;
4. reads the cap exactly as `enforce_prompt_cap()` does (plan, then free,
   then 5) and counts ACTIVE prompts as `is_active is true`, the trigger's
   own spelling; if `active + new > cap` and not `allow_over_cap`, raises
   `prompt_cap_reached` with the numbers, and inserts nothing;
5. inserts the rows with `position` continuing after the client's current
   maximum, `is_active = true`; `trg_prompt_location` and
   `trg_enforce_prompt_cap` still fire (the cap trigger bypasses the service
   role, which is exactly why step 4 exists);
6. writes ONE `client_events` row in the same transaction (section 8).

All or nothing: a failure at any step leaves no prompt and no audit row.

Why the cap is enforced in SQL and not in JavaScript: the database trigger
does not apply to the service role, so a count in the function followed by an
insert would be a check then act race. Inside the RPC the count and the insert
share the advisory lock. A viewer adding prompts from the dashboard at the
same moment is not under that lock (the trigger counts with no lock), and
under READ COMMITTED neither side sees the other's uncommitted rows. The worst
case is the rows of the viewer statements that commit while the admin call is
open; one "Ask in" action is one statement with one row per selected location.
The window is milliseconds. Recorded, not closed: the closure is
`enforce_prompt_cap()` taking the same `prompts_cap:` advisory lock, which
this release does not touch.

`allow_over_cap: true` follows the onboarding precedent (`allow_over_cap` in
`onboard-client.js`): the admin may deliberately exceed a cap, and the audit
row records that it did.

Output: `client_id`, `created` (`[{ prompt_id, text, location_id,
location_label }]`), `skipped_duplicates` (`[{ text, location_id }]`),
`active_prompts` (after), `prompt_cap`, `over_cap` (boolean).

New prompts are not collected by this tool. They are picked up by the next
scheduled run or a dashboard refresh, the same as a prompt added on the
Prompts page. The tool never calls an engine or enqueues a job.

### 6.5 `archive_prompts` (write)

Input: `client_id`, `prompt_ids` (1 to 50 positive ints). One SQL call,
`admin_archive_prompts` (section 7.2): `UPDATE prompts SET is_active = false
WHERE client_id = $1 AND id = ANY($2) AND is_active IS NOT FALSE` (so a row
with a null `is_active` is archived to a clear false) and one audit row, in one
transaction. Never DELETE: the function contains no DELETE and the tests grep
for it. Ids of another client are not touched and come back as `not_found`
(the tool never says whose they are). Output: `archived`,
`already_archived`, `not_found` (lists of ids), `active_prompts` after.
Re-archiving is idempotent and writes no audit row when nothing changed.

## 7. Migration `db/supabase-mcp-admin-2026-11-24.sql`

Additive, applied ONLY on Constantin's go, BEFORE the push that deploys
`mcp-admin.js` (order rule). The function deployed first would answer 500 on
every call (missing table), so nothing breaks for anyone else either way, but
the order still holds.

### 7.1 Table

`public.admin_api_keys` as section 3.2, unique index on `key_hash`, index on
`created_by`.

### 7.2 Write functions (SECURITY DEFINER, `search_path = ''`, service_role only)

- `admin_add_prompts(p_client_id integer, p_texts jsonb, p_location_ids
  bigint[], p_category text, p_allow_over_cap boolean, p_actor uuid,
  p_key_id uuid) returns jsonb`: section 6.4 steps 1 to 6. It re-validates
  what it can (category in the list, 1 to 100 rows, text length 5 to 500)
  so the SQL is safe even if a later caller skips the JavaScript checks.
  Duplicates are computed here too, under the lock.
- `admin_archive_prompts(p_client_id integer, p_prompt_ids bigint[], p_actor
  uuid, p_key_id uuid) returns jsonb`: section 6.5.

### 7.3 Read function

- `admin_prompt_counts(p_client_ids integer[]) returns table(client_id
  integer, active integer, archived integer)`, `language sql stable`,
  service_role only, at most 200 ids.

### 7.4 Grants

`revoke all on function ... from public, anon, authenticated; grant execute
... to service_role` for all three. The default PUBLIC execute grant on new
functions is revoked explicitly (the `ticket_client_id` lesson).

### 7.5 `client_events_type_check`

Recreated with the current twelve values plus `admin_prompt_change`. The
pre-check first takes `lock table public.client_events in access exclusive
mode`, so nothing can change between the check and the recreate, then parses
the live definition into a SET of values and compares sets, not text (a
reordering by another migration is not a false mismatch). It accepts the
twelve, or the thirteen when this file already ran, and raises on anything
else, so a value added by another session in between is never dropped.

### 7.6 Read back after applying

R1 table shape, RLS on, zero policies, service_role grants exactly
`INSERT,SELECT,UPDATE`, no other grantee; R2 the three functions exist with
`prosecdef`, empty `search_path`, execute only for service_role; R3 the type
check holds thirteen values; R4 a dry run of both write functions in one DO
block that ends in a deliberate error, so nothing commits. R4 runs numbered
cases and names the one that fails:

1. add with a repeat inside the call and whitespace to collapse: 2 created,
   1 skipped;
2. the same texts again (one in another case): 0 created, 3 skipped;
3. another client's location: `location_invalid`;
4. an unknown category: `invalid_category`;
5. archive the two plus an unknown id: 2 archived, the unknown one
   `not_found`;
6. archive again: 0 archived, 2 already archived, both rows still exist;
7. exactly two audit rows for the key (the add and the archive);
8. on client 53 (free, no location row): add exactly up to the cap with no
   location; over_cap false, and every row lands on the primary the call
   created;
9. one more without `allow_over_cap`: `prompt_cap_reached`, active count
   unchanged;
10. the same with `allow_over_cap`: 1 created, over_cap true, and the audit
    row records it;
11. an archived location, when one exists: `location_archived`.

Cases 8 to 10 and 11 skip with a notice when the data does not allow them.
More than 100 rows needs a client with five live locations, which none has
today; it is covered by the static and unit tests.

## 8. Audit

One `client_events` row per successful write that changed something, inserted
inside the same SQL transaction as the write:

```
type  = 'admin_prompt_change'
actor = admin user id (created_by of the key)
meta  = { "via": "mcp_admin", "key_id": "<uuid>", "action": "add" | "archive",
          "prompt_ids": [...], "count": n, "location_ids": [...],
          "category": "...", "allow_over_cap": bool, "over_cap": bool,
          "skipped_duplicates": n }
```

Never in `meta`: prompt text (it can be long and it is in `prompts` already),
the key, its prefix or hash.

## 9. Logging and errors

One line per request: `[mcp-admin/<invId>] <method> <tool?> client=<id?>
key=<key row id> status=<http> code=<rpc code?> ms=<n>`. Never logged: the
Authorization header, the key, its prefix or hash, the raw body, prompt texts,
`search`. `scrub()` from the client server's pattern is copied (redacts
`bg(mcp|mat|mrt|ocs|adm)_` tokens and long hex runs) for any error message
that reaches the log.

SQL errors map to tool errors by their leading token: `prompt_cap_reached`,
`location_invalid`, `location_archived`, `client_not_found`,
`invalid_category`, `too_many_rows`, `invalid_text`, `invalid_actor`,
`invalid_ids`. Any other database error
is 500 `-32603` "Internal error" with no detail to the caller.

## 10. Setup (Constantin, manual)

Mint, from PowerShell, in any folder. The key goes straight into Claude Code
and is never printed:

```powershell
$b = New-Object byte[] 24; [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($b); $k = 'bgadm_' + (($b | ForEach-Object { $_.ToString('x2') }) -join ''); $h = (([Security.Cryptography.SHA256]::Create().ComputeHash([Text.Encoding]::UTF8.GetBytes($k))) | ForEach-Object { $_.ToString('x2') }) -join ''; claude mcp add --transport http --scope user brandgeo-admin https://app.getbrandgeo.com/mcp/admin --header "Authorization: Bearer $k"; "insert into public.admin_api_keys (key_hash, key_prefix, label, created_by) select '$h', '$($k.Substring(0,12))', 'Claude Code desktop', p.id from public.user_profiles p join auth.users u on u.id = p.id where p.role = 'admin' and u.email = '<admin email>' returning id, key_prefix, expires_at;"; Remove-Variable k, b
```

Then paste the printed INSERT into the Supabase SQL Editor and run it. The
`returning` output must show exactly ONE row. If it shows none (a typo in the
address), the key is registered in Claude Code but not in the database and
every call will answer 401: run `claude mcp remove brandgeo-admin --scope
user` and mint again.

Revoke:

```sql
update public.admin_api_keys set revoked_at = now() where key_prefix = 'bgadm_xxxxxx' and revoked_at is null returning id, revoked_at;
```

and `claude mcp remove brandgeo-admin --scope user`.

## 11. Rulings needed before use (not before the build)

1. Apply the migration (his go).
2. Push the dashboard batch with `BATCH_PUSH=1` (his go).
3. Approve the prompt drafts for the zero-prompt accounts before any
   `add_prompts` call writes them.

## 12. Tests (`tests/mcp_admin.test.js`)

In-memory fake (`tests/helpers/fake_supabase_mem.js`) plus a JavaScript model
of the three RPCs that mirrors the SQL, so the JavaScript paths are tested;
the SQL itself is tested by R4 against the real database inside a rolled back
transaction.

- Auth: no header, wrong scheme, client key `bgmcp_...`, OAuth token
  `bgmat_...`, malformed `bgadm_`, unknown hash, revoked, expired: 401 with no
  key read for the shape failures. Creator missing, banned, or a viewer: 403.
  Read error on the profile: 403, never a pass.
- Isolation: `mcp-server.js` answers 401 to a valid admin key; its
  `TOOL_NAMES` and `WRITE_TOOL_NAMES` are unchanged (pinned list).
- Scope: a `read` key does not see the write tools in `tools/list` and gets
  `scope_read_only` when it calls one.
- Cap: an add that would exceed the cap inserts nothing and returns
  `prompt_cap_reached`; the same add with `allow_over_cap` succeeds and the
  audit row says so; an add exactly to the cap succeeds.
- Locations: another client's location id is refused before any insert; an
  archived location is refused; no location means the primary, created when
  missing.
- Archive: sets `is_active = false`, other clients' ids come back `not_found`
  and are untouched, no DELETE is ever issued (spy on the fake), and the
  source of `mcp-admin.js` and the migration's two write functions contain no
  DELETE on `prompts`.
- Rate limits: each counter refuses with -32029; a counter error is 500.
- Audit: exactly one `client_events` row per changing write, none per no-op.
- Logging: no key, prefix or prompt text appears in captured console output.
- Static SQL checks on the migration file: in `admin_add_prompts` the
  `prompts_cap:` lock comes before the first count of `prompts`; every active
  count reads `is_active is true`; the archive matches `is_active is not
  false`; the file has no `delete` and no `truncate` statement; both write
  functions are `security definer` with `search_path = ''`; every revoke
  names `public, anon, authenticated`, and the table revoke also names
  `service_role`; the file ends its transaction with `commit;` before the
  commented read backs.
- `netlify.toml`: the `/mcp/admin` redirect exists, comes before the `/mcp`
  block and before `/*`, and `[functions."mcp-admin"]` has `timeout = 26`.

## 13. Noted, no change

- An MCP client that gets a 401 may still probe
  `/.well-known/oauth-protected-resource`, which maps to the CLIENT resource
  (`oauth-prm`). Any token obtained there is `bgmat_` and fails the admin
  shape check: a confusing sign-in prompt after a revoked or mistyped key at
  most, not an exposure.
- Every admin tool result (client names, websites, aliases, competitors,
  prompt texts) is sent to the model provider behind Claude Code. Expected
  for an admin support tool; listed here for a later data processing
  inventory.
