# MCP access for Radar and up

Written 2026-09-22 by `bg-architect` from packet 025. Binding on `bg-backend`,
`bg-app`, `bg-copy`, `bg-web` and `bg-verify`.

BrandGEO exposes a remote MCP (Model Context Protocol) server so a customer's
own AI tools can read that customer's visibility data. Read-only in release
one. Gate: plan `radar` and above, so only `free` is out.

**Rulings.** Ruling 1 was received 2026-09-22 from Constantin ("mcp
connection incepand cu radar, da"): (1) gate at Radar (EUR 29) and above,
only Free out. Questions 2 to 6 were not answered, so the packet defaults
apply: (2) bearer API key first, OAuth 2.1 in a later release; (3) no
write tools; (4) up to 5 active named keys per client; (5) working pricing
label "MCP access for your AI tools", final wording from `bg-copy`; (6) 60
calls a minute per key and 5,000 a day per client, the same on every gated
plan. Rulings 1 and 2 are settled, so **the build stage is unblocked** (packet 025). Any other
ruling that differs from its default changes only the constant or copy named
in the section that cites it.

---

## 0. What this spec reuses, measured 2026-09-22

| Fact | Where | Consequence here |
|---|---|---|
| `requireAuth()` needs a Supabase JWT and a whitelisted Origin | `_auth.js:67` | The MCP endpoint is a second, separate gate. `_auth.js` is not edited. |
| Per-program API key: `makeApiKey()`, `hashApiKey()` (sha256), `apiKeyPrefix()`; stored as hash plus prefix; resolved by hash | `_affiliate_core.js:116-122`, `_affiliate_auth.js` `requireProgramApiKey()` | Same shape for a per-client key (section 3). |
| Ladder `PLAN_ORDER` = free, radar, essentials, growth, growth_pro, managed, pro, enterprise; `planRank()` reads the index | `_plans.js:30,104`, `planConfig.ts:398,805` | Gate is one function over `planRank()` (section 4). |
| UI gates go through `FEATURE_MIN_PLAN` plus `hasFeature()` | `planConfig.ts:443,821` | The UI mirror is one `FEATURE_MIN_PLAN` entry, not a ladder copy. |
| `activeEnginesFor(plan, engines_enabled)` is the entitlement copy | `_cost.js:468` | Tools report and filter to these engines only. |
| `RESEARCH_CATEGORY = 'research'` | `_cost.js:589` | Research clients refused unless the key was admin issued. The 27 research studies sit on plan `pro`, so without this check they would pass the plan gate. |
| `affiliate_rate_check(p_key, p_limit, p_window_seconds)`, fixed window, SECURITY DEFINER, service role only, over `affiliate_rate_limits` | `db/supabase-affiliate-migration-2026-09-12.sql:562-575` | Reused with an `mcp:` key namespace; no new rate table (section 6). |
| Rows older than a day are pruned from `affiliate_rate_limits` | `db/supabase-affiliate-cron-2026-09-12.sql:43` | Covers the MCP counters too, if that cron is scheduled (section 6.3). |
| `ai_results.status` is `text NOT NULL DEFAULT 'ok'` | `CLAUDE.md` section 3, migration #95 | `.neq('status','error')` does not drop NULL rows, because there are none. |
| `isNoAnswerRow()` (`[no_ai_overview]` marker) and `aggregateCompetitors()` live in TypeScript only | `src/lib/aiVisibilityScore.ts:75`, `src/lib/competitorFilter.ts:255` | The MCP function imports those two files; no third copy (section 5.1). |
| RLS helpers `public.is_admin()`, `public.get_my_client_id()` | `db/supabase-multitenant-migration.sql:43,48` | Used by the new SELECT policy. |
| The in-memory fake already implements `affiliate_rate_check` and has `eq/neq/in/gte/lt/order/limit/maybeSingle`, no `.range()`, no `.or()` | `tests/helpers/fake_supabase_mem.js:83-94,195` | Pagination is keyset on `id` (`.lt`/`.gt`), never offset. |
| `/r/*` and `/api/affiliate/conversions` rewrite to functions ahead of `/*` | `netlify.toml:58-76` | `/mcp` goes in the same block. |
| Functions default 10s, 26s max | `netlify.toml` | `mcp-server` gets 26. |

---

## 1. Surface overview

```
Customer AI tool                         app.getbrandgeo.com
(Claude Code, Cursor, ...)               
   │  POST /mcp                          netlify.toml rewrite
   │  Authorization: Bearer bgmcp_...    ──► /.netlify/functions/mcp-server
   ▼                                           │
                                               ├─ body cap, method check, JSON-RPC parse
                                               ├─ key: sha256 lookup in client_api_keys
                                               ├─ clients row: plan gate, research gate
                                               ├─ rate: affiliate_rate_check('mcp:...')
                                               └─ tool: read-only queries, client_id from the key

Dashboard (Account.tsx, "MCP access")    ──► /.netlify/functions/client-api-keys
                                              requireAuth({ clientId }) then list | issue | revoke
```

New files: `netlify/functions/mcp-server.js`, `netlify/functions/client-api-keys.js`,
`netlify/functions/_client_api_key.js`, `db/supabase-client-api-keys-migration-2026-09-22.sql`,
`tests/mcp_server.test.js`, `tests/client_api_keys.test.js`, `tests/helpers/ts_require.js`,
`brandgeo/web/mcp.html`. Edited files: `_plans.js` (one helper), `planConfig.ts`
(one feature id), `netlify.toml` (one rewrite, one function block),
`Account.tsx` (one section), `brandgeo/web/index.html`, `faq.html`, `sitemap.xml`.

---

## 2. Transport

MCP Streamable HTTP, stateless, JSON responses only.

### 2.1 Route

`netlify.toml`, inserted directly after the `/api/affiliate/conversions` block
and BEFORE the `/*` SPA fallback:

```toml
# Remote MCP server (docs/arch/mcp-access.md). Must sit above the /* fallback,
# or POST /mcp is served index.html and every MCP client reports a parse error.
[[redirects]]
  from = "/mcp"
  to = "/.netlify/functions/mcp-server"
  status = 200
  force = true
```

And with the other function blocks:

```toml
# Remote MCP server. Reads only; one invocation per JSON-RPC message.
# esbuild so the function can import src/lib/competitorFilter.ts and
# src/lib/aiVisibilityScore.ts directly instead of a hand-synced copy.
[functions."mcp-server"]
  timeout = 26
  node_bundler = "esbuild"
```

`node_bundler` is set for this one function only; every other function keeps
the current bundler. Fallback if the Netlify build rejects the per-function
setting or the `.ts` import: a `prebuild` step runs esbuild over those two
files into `netlify/functions/_gen/` (gitignored), and `mcp-server.js`
requires the generated files. Either way there is one source for the logic.
`bg-backend` states in its handoff which of the two shipped.

### 2.2 HTTP methods

| Method | Answer |
|---|---|
| `POST` | One JSON-RPC message in, `Content-Type: application/json` out (or 202 empty, below). |
| `GET` | 405, header `Allow: POST`, empty body. No SSE stream is offered. |
| `DELETE` | 405, `Allow: POST`. There is no session to end. |
| `OPTIONS`, anything else | 405, `Allow: POST`. No CORS headers: browser-based clients are not a release-one target. |

No `Mcp-Session-Id` is ever issued, so every message is self-contained and
fits one invocation. A client that sends a session id header is ignored, not
refused.

### 2.3 Request checks, in this order

1. **Body size.** Decode `event.body` (base64 when `isBase64Encoded`). Over
   65,536 bytes: HTTP 413, JSON-RPC error `-32600` "Request too large", `id: null`.
   Checked before parse.
2. **Origin.** If an `Origin` header is present and is not in
   `_auth.js` `ALLOWED_ORIGINS` (imported, not copied): HTTP 403, `-32600`.
   The MCP transport spec asks servers to validate Origin; real MCP clients
   send none.
3. **Parse.** Invalid JSON: HTTP 400, `-32700`, `id: null`.
4. **Shape.** A JSON array (batch) or an object without `jsonrpc: "2.0"`:
   HTTP 400, `-32600`. Batching was removed from the protocol in 2025-06-18
   and is not supported for any version.
5. **Notification or response.** A message with no `id` (a notification,
   including `notifications/initialized`) or a message carrying `result` or
   `error` (a response from the client): HTTP 202, empty body. No
   authentication is required to answer 202, and nothing is read or written.
6. **Authentication** (section 3). Every request with an `id` needs a valid
   key, including `initialize` and `ping`.
7. **Protocol version header.** If `MCP-Protocol-Version` is present and not
   in the supported list (2.5): HTTP 400, `-32600`. Absent is allowed.
8. **Method dispatch** (2.4), with the plan gate and rate limits applied as
   stated there.

### 2.4 Methods

| Method | Auth | Plan gate | Rate limit | Answer |
|---|---|---|---|---|
| `initialize` | yes | no | per key minute | 2.5 |
| `ping` | yes | no | per key minute | `{"result": {}}` |
| `tools/list` | yes | yes | per key minute | all seven tools (section 5) |
| `tools/call` | yes | yes | per key minute and per client day | tool result |
| anything else | yes | no | per key minute | `-32601` "Method not found" |

`initialize` and `ping` are not plan gated so a downgraded customer's client
still connects and then reads the upgrade message on `tools/list`, instead of
failing with a bare connection error.

### 2.5 Protocol version and `initialize`

```js
const SUPPORTED_PROTOCOL_VERSIONS = ['2025-11-25', '2025-06-18', '2025-03-26']
const LATEST_PROTOCOL_VERSION = SUPPORTED_PROTOCOL_VERSIONS[0]
```

Negotiation: if `params.protocolVersion` is in the list, answer with the same
string; otherwise answer with `LATEST_PROTOCOL_VERSION` and let the client
decide whether it can proceed (this is the negotiation the MCP lifecycle
defines). `2025-03-26` is the floor because it introduced Streamable HTTP.
`bg-backend` confirms at build time that `2025-11-25` is still the newest
published revision and, if a newer one exists, adds it only after checking
that nothing in this spec's subset (initialize, ping, tools) changed.

Result:

```json
{
  "protocolVersion": "<negotiated>",
  "capabilities": { "tools": { "listChanged": false } },
  "serverInfo": { "name": "brandgeo", "title": "BrandGEO", "version": "1.0.0" },
  "instructions": "Read-only access to one BrandGEO account's AI visibility data: how often AI engines mention the brand, for which prompts, next to which competitors, with what sentiment, plus the latest recommendations. Data is refreshed by BrandGEO's own collection runs; these tools never start a collection."
}
```

No `resources`, `prompts`, `logging` or `completions` capability is declared.

### 2.6 Error codes

| Code | HTTP | When | `error.data` |
|---|---|---|---|
| `-32700` | 400 | invalid JSON | none |
| `-32600` | 400, 403 or 413 | batch, bad envelope, bad Origin, body too large, unsupported version header | none |
| `-32601` | 200 | unknown method | none |
| `-32602` | 200 | `tools/call` with an unknown tool name | `{ "tool": "<name>" }` |
| `-32001` | 401 | missing, malformed, unknown or revoked key | none |
| `-32002` | 200 | plan below the gate | `{ "required_plan": "radar", "current_plan": "<plan>", "upgrade_url": "https://app.getbrandgeo.com/account" }` |
| `-32003` | 200 | research client, key not admin issued | none |
| `-32029` | 200 | rate limited | `{ "retry_after": <seconds>, "scope": "key_minute" or "client_day", "limit": <n> }` |
| `-32603` | 500 | unexpected failure, including a missing table | none |

The 401 carries `WWW-Authenticate: Bearer realm="brandgeo-mcp"` and the
message "Invalid or missing BrandGEO API key." The same message for every 401
cause, so the answer does not reveal whether a key once existed.

Gate and rate-limit errors are HTTP 200 on purpose: several MCP clients
surface a non-2xx answer as a generic transport failure and drop the body,
and the point of `-32002` is that the customer reads "Upgrade to Radar".
The rate-limit error also sets the HTTP `Retry-After` header to the same
number.

`-32002` message, exactly: `MCP access needs the Radar plan or higher. Upgrade to Radar in your BrandGEO account.`
(`bg-copy` may reword; it must keep the plan name. If the gate ever moves,
the plan name here comes from `PLAN_LABELS[MCP_MIN_PLAN]`, never a literal.)

Tool input errors (a wrong type, a `prompt_id` that is not on this account)
are not protocol errors: they return a normal `tools/call` result with
`isError: true` and one text block saying what was wrong, per the MCP tools
spec, so the model can correct the call.

---

## 3. Credential

### 3.1 Format and helpers

New module `netlify/functions/_client_api_key.js`, the client-key twin of the
affiliate helpers. It does not require `_affiliate_core.js` (that would pull
the affiliate module into the MCP bundle for one sha256).

```js
const crypto = require('crypto')

const CLIENT_API_KEY_RE = /^bgmcp_([1-9][0-9]{0,9})_([a-f0-9]{48})$/

function makeClientApiKey(clientId) {
  return `bgmcp_${Number(clientId)}_${crypto.randomBytes(24).toString('hex')}`
}
function hashClientApiKey(key) {
  return crypto.createHash('sha256').update(String(key)).digest('hex')
}
// Display only: "bgmcp_42_" plus the first 6 hex characters of the secret.
function clientApiKeyPrefix(key) {
  const m = CLIENT_API_KEY_RE.exec(key)
  return m ? `bgmcp_${m[1]}_${m[2].slice(0, 6)}` : ''
}
```

192 bits of randomness per key, same as the affiliate key. The client id in
the key is a routing hint and a cross-check, never the authority: the
authority is the row found by hash.

### 3.2 Storage

Table `client_api_keys` (migration in section 9):

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK, `gen_random_uuid()` | Not guessable, used by `revoke`. |
| `client_id` | `integer NOT NULL` FK `clients(id) ON DELETE CASCADE` | Deleting a client deletes its keys. |
| `key_hash` | `text NOT NULL UNIQUE` | sha256 hex of the full key. The unique constraint is the lookup index. |
| `key_prefix` | `text NOT NULL` | For the UI list only. |
| `label` | `text NOT NULL DEFAULT ''`, at most 60 chars | Customer's name for the key ("Cursor, laptop"). |
| `created_by` | `uuid` | `auth.users.id` of the issuer. No FK, so deleting a login does not delete the key. |
| `created_at` | `timestamptz NOT NULL DEFAULT now()` | |
| `last_used_at` | `timestamptz` | Stamped at most once a minute (3.4). |
| `revoked_at` | `timestamptz` | Revoke sets it. Rows are never deleted by the product. |

**The key is never stored, logged or listed in clear.** It exists in exactly
two places: the memory of the `issue` call that makes it, and the one-time
reveal box in the browser (section 7). The table holds its hash and a
display prefix. Neither `client-api-keys.js` nor `mcp-server.js` logs the
key, the prefix or the hash (section 6.4).

### 3.3 RLS

- `SELECT` to `authenticated`: `public.is_admin() OR client_id = public.get_my_client_id()`.
- No `INSERT`, `UPDATE` or `DELETE` policy for `authenticated`. Every write
  goes through the service role inside `client-api-keys.js` or `mcp-server.js`.
- No `DELETE` policy for anyone. Revoke is `revoked_at`.
- Column privilege: `authenticated` may select every column except
  `key_hash`. RLS cannot hide a column, so the migration revokes table-level
  SELECT and grants SELECT on the named columns. The hash of a 192-bit random
  key is not reversible, but the acceptance bar is that no browser path ever
  returns it, and this closes the direct PostgREST path as well as the
  function path.
- `anon`: nothing.

### 3.4 Resolution in `mcp-server.js`

```
key = bearer(event)                      // same parsing as _affiliate_auth.js bearer()
if !CLIENT_API_KEY_RE.test(key)          -> 401
row = client_api_keys
        .select('id, client_id, created_by, last_used_at, revoked_at')
        .eq('key_hash', hashClientApiKey(key)).maybeSingle()
if !row or row.revoked_at                -> 401
if String(row.client_id) !== clientIdFromKey -> 401   // defence in depth, and logged as a warning with the row id only
client = clients
        .select('id, name, brand_aliases, brand_website, plan, category, engines_enabled, known_competitors')
        .eq('id', row.client_id).single()
if !client                               -> 401
```

`last_used_at`: the row is already in hand, so the function compares in
memory and writes only when stale:

```
if (!row.last_used_at || now - Date.parse(row.last_used_at) >= 60_000)
  await supabase.from('client_api_keys')
    .update({ last_used_at: nowIso }).eq('id', row.id).is('revoked_at', null)
```

Awaited (an un-awaited promise can be frozen with the invocation), errors
swallowed with a one-line log that names the row id, never the key. Two
concurrent calls in the same minute may both write; that is harmless and
bounded. The `x-api-key` header is NOT accepted: one way to send the key.

---

## 4. Plan gate

### 4.1 The one server function

In `_plans.js`, next to `planRank()`:

```js
// Remote MCP access (docs/arch/mcp-access.md). A threshold over planRank(), NOT
// a list of plans: _plans.js has drifted from planConfig.ts before (growth_pro
// missing from every table here, CLAUDE.md Growth PRO defects C1 to C4, and
// docs/qa/plans-divergence-b1.md F1 to F4), and a list would be one more copy
// of the ladder to drift. Unknown plan strings fail closed.
const MCP_MIN_PLAN = 'radar'
function mcpAllowedFor(plan) {
  return isValidPlan(plan) && planRank(plan) >= planRank(MCP_MIN_PLAN)
}
```

Exported with `MCP_MIN_PLAN`. With today's ladder it returns true for
radar, essentials, growth, growth_pro, managed, pro, enterprise and false for
free and any unknown string. Nothing else on the server decides MCP access.

### 4.2 The UI mirror

In `planConfig.ts`, not a new constant but one more feature on the existing
mechanism:

- `FeatureId` gains `'mcp_access'`.
- `FEATURE_MIN_PLAN.mcp_access = 'radar'`.
- `FEATURE_META.mcp_access = { label: 'MCP access', blurb: <from bg-copy> }`
  (the `Record<FeatureId, ...>` type makes this entry mandatory).
- Not added to `ADMIN_ONLY_FEATURES`.

The UI calls `hasFeature(plan, 'mcp_access')` and `featureUnlockPlan('mcp_access')`.
The server and the UI each hold one threshold string over a ladder they
already hold; the test in section 10 proves they agree for all eight plans.

### 4.3 Where the gate is checked

| Point | Check | Below gate |
|---|---|---|
| `mcp-server` `tools/list` | `mcpAllowedFor(client.plan)` on the live row | `-32002` |
| `mcp-server` `tools/call` | same, before the rate counters | `-32002`, and the daily counter is not spent |
| `client-api-keys` `issue` | same | HTTP 403 `{ error, required_plan: 'radar' }` |
| `client-api-keys` `list`, `revoke` | not gated | a downgraded client can still see and revoke old keys |

`clients.plan` is read on every call, and `expire-plan-grants.js` writes
`plan: 'free'` when a grant lapses (`expire-plan-grants.js:202`), so a
downgrade or lapsed trial closes MCP access on the next call with no extra
job. Keys are not revoked on downgrade: an upgrade back reopens them.

### 4.4 Research clients

`client.category === RESEARCH_CATEGORY` (imported from `_cost.js`):

- `issue`: refused with 403 unless the caller's `profile.role === 'admin'`.
- `mcp-server`, on `tools/list` and `tools/call`: allowed only if the key's
  `created_by` has `user_profiles.role = 'admin'` (one extra query, made only
  for research clients). Otherwise `-32003` "This account is not available
  over MCP." This covers a client whose category was changed to research
  after a viewer issued a key.

---

## 5. Tools (read-only, release one)

### 5.1 Rules for every tool

1. `client_id` comes from the key row, never from arguments. No tool accepts
   a client id.
2. Every `ai_results` query has `.eq('client_id', clientId)` and
   `.neq('status', 'error')`. `ai_results` is the only table read here with an
   error status; `recommendations.status` is workflow state and is not an
   error flag. Every other query also has `.eq('client_id', clientId)`, even
   where a join key already implies it (recommendations by `run_id`).
3. **Engines.** Rows are kept only when `llm` is in
   `activeEnginesFor(client.plan, client.engines_enabled)`, the same set the
   dashboard shows. Labels from `_plans.js` `ENGINE_LABELS`.
4. **Prompts.** Aggregates count only rows whose `prompt_id` is an active
   prompt of the client, as the dashboard does (`AIVisibility.tsx:435` loads
   active prompts and maps results onto them).
5. **No-answer rows.** `isNoAnswerRow()` imported from
   `src/lib/aiVisibilityScore.ts`. They count in `checks` and in `no_answer`,
   never in `answered` or any rate.
6. **Competitors.** `aggregateCompetitors()` and `cleanCompetitorName()` /
   `isLikelyCompanyName()` imported from `src/lib/competitorFilter.ts`, with
   `knownCompetitors: client.known_competitors`.
7. **Window.** `window_days` integer, default 30, clamped to 1..365 (a clamp,
   not an error). `from = now - window_days * 86400s`, filter
   `.gte('checked_at', fromIso)`. The output echoes the applied window.
8. **Row cap.** Lists return at most 200 items per call (`limit` argument
   where offered, default and max stated per tool) with a keyset `cursor`.
9. **Aggregates** scan with keyset pages of 1,000 rows ordered `id` desc
   (PostgREST's default ceiling is 1,000 rows per request, so an unpaged
   select silently truncates), stopping at 25,000 rows scanned or 18 seconds
   elapsed, whichever comes first. Output carries `rows_scanned` and
   `truncated: true|false`; when truncated, `window.effective_from` is the
   oldest `checked_at` actually scanned.
10. **Cursor.** Opaque string, base64url of `{"id": <last id>}`. Invalid
    cursor: `isError: true` result, "Invalid cursor". `next_cursor` is `null`
    when there is nothing more.
11. **Result format.** `content: [{ type: "text", text: JSON.stringify(obj) }]`
    plus `structuredContent: obj` with the identical object. `tools/list`
    includes `outputSchema` for every tool (JSON Schema of `obj`) when the
    negotiated version is `2025-06-18` or later, and omits it for
    `2025-03-26`.
12. **Annotations** on every tool: `{ readOnlyHint: true, idempotentHint: true, openWorldHint: false }`.
13. No tool calls an LLM, enqueues a collection, runs an audit or writes any
    row. The only writes an MCP request can cause are the rate counter
    upserts and the throttled `last_used_at` stamp.
14. Every object carries `client_id` and `generated_at` (ISO).

The shared scan, stated once:

```js
async function scanResults(sb, clientId, fromIso, cols, extra = (q) => q) {
  const PAGE = 1000, CEILING = 25000, BUDGET_MS = 18000, t0 = Date.now()
  let rows = [], lastId = null, truncated = false
  for (;;) {
    let q = sb.from('ai_results').select(cols)
      .eq('client_id', clientId).neq('status', 'error').gte('checked_at', fromIso)
    q = extra(q)
    if (lastId !== null) q = q.lt('id', lastId)
    const { data, error } = await q.order('id', { ascending: false }).limit(PAGE)
    if (error) throw error
    rows = rows.concat(data)
    if (data.length < PAGE) break
    lastId = data[data.length - 1].id
    if (rows.length >= CEILING || Date.now() - t0 > BUDGET_MS) { truncated = true; break }
  }
  return { rows, truncated }
}
```

### 5.2 `get_brand_overview`

Brand identity, plan, active engines, data freshness, prompt count.

Input schema: `{ "type": "object", "properties": {}, "additionalProperties": false }`

Queries:
- the `clients` row already read in 3.4.
- `ai_results.select('checked_at').eq('client_id', id).neq('status','error').order('checked_at', { ascending: false }).limit(1).maybeSingle()`
- `collection_runs.select('created_at, trigger').eq('client_id', id).order('created_at', { ascending: false }).limit(1).maybeSingle()`
- `prompts.select('id', { count: 'exact', head: true }).eq('client_id', id)` and the same with `.eq('is_active', true)`. If the fake lacks `count`/`head`, `bg-backend` extends the fake in the same change.

`collection_runs` has no completion column, so "last completed collection"
is defined as the newest non-error `ai_results.checked_at`, and the newest
run start is reported beside it.

Output:
```json
{
  "client_id": 42, "generated_at": "...",
  "brand": { "name": "...", "aliases": ["..."], "website": "..." },
  "plan": { "id": "growth", "label": "Growth" },
  "engines": [{ "id": "gemini", "label": "Gemini" }],
  "last_result_at": "... or null",
  "last_run": { "started_at": "...", "trigger": "scheduled" },
  "prompts": { "active": 35, "total": 38 },
  "limits": { "calls_per_minute_per_key": 60, "calls_per_day": 5000 }
}
```
Cap: one object; aliases capped at 50.

### 5.3 `get_visibility_summary`

Mention rate overall and per engine over the window.

Input: `{ "window_days": { "type": "integer", "minimum": 1, "maximum": 365, "default": 30 } }`

Queries: active prompt ids (`prompts.select('id').eq('client_id', id).eq('is_active', true)`, keyset-paged by `id` up to 5,000), then
`scanResults(sb, id, fromIso, 'id, prompt_id, llm, brand_mentioned, brand_position, response_snippet, checked_at')`.

Computed in JS after rules 3 to 5:
- per engine and overall: `checks`, `no_answer`, `answered = checks - no_answer`,
  `mentioned`, `mention_rate = mentioned / answered` (4 decimals, `null` when
  `answered` is 0), `avg_position` over mentioned rows with a numeric
  `brand_position` (1 decimal, `null` if none).
- `latest_snapshot`: the newest answered row per (prompt, engine) pair in the
  window; `pairs`, `mentioned`, `mention_rate`. This is the view the
  dashboard's result map shows; the window totals are the history.

Output:
```json
{
  "client_id": 42, "generated_at": "...",
  "window": { "days": 30, "from": "...", "to": "...", "effective_from": "..." },
  "overall": { "checks": 0, "no_answer": 0, "answered": 0, "mentioned": 0, "mention_rate": null, "avg_position": null },
  "by_engine": [{ "engine": "gemini", "label": "Gemini", "checks": 0, "no_answer": 0, "answered": 0, "mentioned": 0, "mention_rate": null, "avg_position": null }],
  "latest_snapshot": { "pairs": 0, "mentioned": 0, "mention_rate": null },
  "rows_scanned": 0, "truncated": false
}
```
Cap: scan ceiling (rule 9); `by_engine` at most one entry per active engine.

### 5.4 `list_prompts`

Input:
```json
{
  "active_only": { "type": "boolean", "default": true },
  "limit": { "type": "integer", "minimum": 1, "maximum": 200, "default": 200 },
  "cursor": { "type": "string" }
}
```

Query: `prompts.select('id, text, category, is_active, position').eq('client_id', id)`,
plus `.eq('is_active', true)` when `active_only`, plus `.gt('id', cursorId)`
when a cursor is given, `.order('id', { ascending: true }).limit(limit + 1)`.
The extra row decides `next_cursor`.

Output: `{ client_id, generated_at, prompts: [{ id, text, category, is_active, position }], next_cursor }`.
Ordered by `id`; `position` is returned so the caller can sort by it.
Cap: 200 per call.

### 5.5 `get_prompt_results`

Per-engine answers for one prompt.

Input:
```json
{
  "prompt_id": { "type": "integer", "minimum": 1 },
  "window_days": { "type": "integer", "minimum": 1, "maximum": 365, "default": 30 },
  "limit": { "type": "integer", "minimum": 1, "maximum": 200, "default": 50 },
  "cursor": { "type": "string" }
}
```
`prompt_id` required.

Queries:
- `prompts.select('id, text, category, is_active').eq('id', prompt_id).eq('client_id', id).maybeSingle()`.
  No row: `isError: true`, "No prompt with that id on this account." Same
  answer whether the id exists on another client or nowhere.
- `ai_results.select('id, llm, brand_mentioned, brand_position, sentiment, response_snippet, competitors_mentioned, checked_at').eq('client_id', id).eq('prompt_id', prompt_id).neq('status','error').gte('checked_at', fromIso)`,
  `.lt('id', cursorId)` when a cursor is given, `.order('id', { ascending: false }).limit(limit + 1)`; then rule 3.

Each result: `engine`, `label`, `checked_at`, `mentioned`, `position`,
`sentiment`, `no_answer` (rule 5), `snippet` (first 500 chars of
`response_snippet`), `competitors` (names parsed from `competitors_mentioned`
as `aggregateCompetitors` does: string or `{name}`, kept when
`isLikelyCompanyName`, cleaned with `cleanCompetitorName`, at most 20).
Malformed JSON gives `competitors: []`, not an error.

Output: `{ client_id, generated_at, prompt: { id, text, category, is_active }, window, results: [...], next_cursor }`.
Cap: 200 per call. `response_text` (the full answer) is not exposed in
release one.

### 5.6 `get_competitors`

Competitor share of mentions, top N.

Input:
```json
{
  "window_days": { "type": "integer", "minimum": 1, "maximum": 365, "default": 30 },
  "limit": { "type": "integer", "minimum": 1, "maximum": 50, "default": 10 }
}
```

Queries: active prompt ids as in 5.3, then
`scanResults(sb, id, fromIso, 'id, llm, prompt_id, brand_mentioned, response_snippet, competitors_mentioned')`;
rules 3 to 5; answered rows go to
`aggregateCompetitors(rows, { limit, knownCompetitors: client.known_competitors || [] })`.

Output:
```json
{
  "client_id": 42, "generated_at": "...", "window": { },
  "answered": 0,
  "brand": { "mentioned": 0, "share": null },
  "competitors": [{
    "name": "...", "total_mentions": 0, "ranked_mentions": 0, "prose_only": false,
    "avg_position": null, "share": null, "by_engine": { "gemini": 0 }, "prompts": 0
  }],
  "rows_scanned": 0, "truncated": false
}
```
`share = total_mentions / answered` (4 decimals). Ordering is
`aggregateCompetitors`' own (ranked mentions first). The tool description
tells the model that `prose_only: true` names were never ranked by an engine
and must not be described as outranking the brand (the rule stated at
`competitorFilter.ts:236-240`). Cap: 50.

### 5.7 `get_sentiment_summary`

Input: `{ "window_days": { "type": "integer", "minimum": 1, "maximum": 365, "default": 30 } }`

Queries: active prompt ids as in 5.3, then
`scanResults(sb, id, fromIso, 'id, llm, prompt_id, sentiment, response_snippet', (q) => q.eq('brand_mentioned', true))`; rules 3 to 5.

Counts `positive`, `neutral`, `negative`; any other value (`none`, null) is
`unclassified`. Overall and per engine, each with `total`.

Output: `{ client_id, generated_at, window, overall: { total, positive, neutral, negative, unclassified }, by_engine: [{ engine, label, total, positive, neutral, negative, unclassified }], rows_scanned, truncated }`.
Cap: scan ceiling.

### 5.8 `get_recommendations`

Items of the latest recommendation run.

Input: `{ "limit": { "type": "integer", "minimum": 1, "maximum": 50, "default": 20 } }`

Queries:
- `recommendation_runs.select('id, generated_at, model, rec_count').eq('client_id', id).order('generated_at', { ascending: false }).limit(1).maybeSingle()`
- when a run exists: `recommendations.select('id, position, title, insight, action, engines, priority, status, actioned_at').eq('client_id', id).eq('run_id', run.id).order('position', { ascending: true }).limit(limit)`

`notes` (the team's private notes) and `input_snapshot` are not exposed.

Output: `{ client_id, generated_at, run: { id, generated_at, rec_count } or null, items: [...] }`.
No run: `run: null, items: []`, not an error. `model` is not returned (an
internal detail). Cap: 50.

---

## 6. Abuse controls

### 6.1 Limits

Constants at the top of `mcp-server.js` (ruling 6 changes only these):

```js
const MCP_PER_KEY_PER_MINUTE = 60
const MCP_PER_CLIENT_PER_DAY = 5000
```

Same for every gated plan in release one.

### 6.2 Counting

Reuse `affiliate_rate_check` over `affiliate_rate_limits` with an `mcp:`
namespace. No new table, no new SECURITY DEFINER function. Reasons: it is
already live and service-role only, it is already pruned, and the test fake
already implements it. The cost is a name that says "affiliate"; accepted.

| Counter | Key | Window | Counted on |
|---|---|---|---|
| per key | `mcp:key:<client_api_keys.id>` | 60 s | every authenticated request with an `id` |
| per client | `mcp:client:<client_id>:day` | 86,400 s (UTC day) | `tools/call` only, after the plan gate passes |

`retry_after` is computed in JS with the same flooring the SQL uses:
`windowStart = floor(nowSec / w) * w`, `retry_after = max(1, windowStart + w - nowSec)`.
For the daily counter that can be many hours; the message says so ("Daily
MCP limit reached. It resets at 00:00 UTC."). Denied calls still increment
the counter, which is harmless for a fixed window.

### 6.3 Pruning

`db/supabase-affiliate-cron-2026-09-12.sql:43` deletes rows older than a day.
`bg-verify` confirms that job is actually scheduled (`cron.job`), read-only.
If it is not, MCP adds at most 1,440 rows per active key per day plus one per
client per day, and scheduling it is Constantin's call, not part of this build.

### 6.4 Logging

One line per request, on completion:

```
[mcp-server/<invId>] client=<client_id or -> method=<method> tool=<name or -> ms=<n> outcome=<ok | code>
```

`invId` is the first 8 characters of `context.awsRequestId`. Never logged,
anywhere in either function: the key, the prefix, the hash, the
`Authorization` header, the raw body, or tool arguments other than
`prompt_id`, `window_days`, `limit`. Catch blocks log `err.message` only,
never the event. A test captures `console.log`/`console.error` and asserts
no `bgmcp_` substring appears (section 10).

---

## 7. Key management UI

### 7.1 Backend: `client-api-keys.js`

`POST { action, client_id, ... }`, envelope as in `promotions-admin.js`.
Body parsed first, then `requireAuth(event, { clientId: body.client_id })`,
so admins act on any client and viewers only on their own. `OPTIONS`
preflight is handled by `requireAuth()`. Non-POST: 405. Service-role client
for every write. Timeout block: 15, like `promotions-admin`.

| Action | Input | Output | Refusals |
|---|---|---|---|
| `list` | `client_id` | `{ keys: [{ id, key_prefix, label, created_at, last_used_at }], max_keys: 5, allowed: bool, required_plan: 'radar' }` | none beyond auth |
| `issue` | `client_id`, `label?` | `{ key: { id, key_prefix, label, created_at }, secret: "bgmcp_..." }` | 403 below gate; 403 research unless admin; 409 at 5 active keys; 400 label over 60 chars |
| `revoke` | `client_id`, `id` | `{ ok: true, id }` | 404 when no active key with that `id` and `client_id` |

- `list` returns active keys only (`revoked_at is null`), newest first, and
  selects named columns, never `key_hash`.
- `issue` trims the label, defaults an empty one to `Key <n>`, inserts
  `{ client_id, key_hash, key_prefix, label, created_by: user.id }` and
  returns the secret in this one response only. The count check and insert
  are not atomic; two simultaneous issues can create a sixth key. Accepted.
- `revoke` is `update({ revoked_at: now }).eq('id', id).eq('client_id', client_id).is('revoked_at', null)`.
  Not plan gated.
- A 42P01 (table missing) answers 503 "MCP keys are not available yet", so
  the Account section can show a neutral state if the function ever ships
  ahead of the migration (section 9 forbids that order, this is the net).

### 7.2 Frontend: `Account.tsx`, section "MCP access"

Placed after the plan blocks. Visible to admin for any client and to a viewer
for their own (`useClient()` already supplies `activeClientId`, `isAdmin`).
Hidden in demo mode.

**Gated plan** (`hasFeature(plan, 'mcp_access')`, or admin):
- one line of explanation and a link to `https://getbrandgeo.com/mcp.html`.
- "Issue key": a label input (max 60) and a button. On success, a one-time
  reveal panel: the key in a read-only field with a copy button, the warning
  "This key is shown once. Copy it now. BrandGEO cannot show it again.", and
  the three setup snippets from section 8 with the key filled in, each with a
  copy button. Closing the panel drops the secret from component state; it
  is never written to localStorage, sessionStorage, the URL, or any log.
- the active keys table: label, prefix (as `bgmcp_42_1a2b3c...`), created,
  last used ("never" when null), and "Revoke" with a confirm step.
- at 5 active keys the issue button is disabled with "Revoke a key to issue a new one."

**Below the gate** (`free` only): the section still renders, with the
upgrade line naming the plan from `PLAN_LABELS[featureUnlockPlan('mcp_access')]`
("MCP access is included from the Radar plan.") and the existing
upgrade path. If the client has old active keys (downgraded), the list and
"Revoke" still show, with a note that they will work again after upgrading.

Tokens and components come from the existing design system; nothing new is
added to `tailwind.config.js` or `src/index.css`.

---

## 8. Setup snippets, public page, pricing and FAQ

### 8.1 Client support claim `bg-web` may print

| Client | Claim | How |
|---|---|---|
| Claude Code | **Supported** | native HTTP transport with a header |
| Cursor | **Supported** | `mcp.json` with `url` and `headers` |
| VS Code (agent mode) | **Supported** | `.vscode/mcp.json` with `type: "http"` and `headers` |
| Windsurf | **Supported** | `mcp_config.json` with `serverUrl` and `headers` |
| Claude Desktop | **Supported through a local bridge** | `mcp-remote` run by `npx` (third-party package, named as such) |
| claude.ai web custom connectors | **Coming** | these connect with OAuth, not a pasted header |
| ChatGPT connectors | **Coming** | same |

Rule: any client that only accepts OAuth is listed as "coming", never
"supported". Before `mcp.html` is published, `bg-verify` connects each client
marked Supported with a real key against the deployed endpoint and records
the result; a client that fails is moved to "coming" in the page, not argued
for. No claim beyond this table.

### 8.2 The three snippets on the page and in the reveal panel

Claude Code:
```bash
claude mcp add --transport http brandgeo https://app.getbrandgeo.com/mcp --header "Authorization: Bearer <key>"
```

Cursor, `~/.cursor/mcp.json` (or `.cursor/mcp.json` in a project):
```json
{
  "mcpServers": {
    "brandgeo": {
      "url": "https://app.getbrandgeo.com/mcp",
      "headers": { "Authorization": "Bearer <key>" }
    }
  }
}
```

Claude Desktop, `claude_desktop_config.json` (the key goes in `env` because
some platforms split arguments on the space in "Bearer <key>"):
```json
{
  "mcpServers": {
    "brandgeo": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "https://app.getbrandgeo.com/mcp", "--header", "Authorization:${BRANDGEO_AUTH}"],
      "env": { "BRANDGEO_AUTH": "Bearer <key>" }
    }
  }
}
```

The public page shows `<key>` literally. Only the one-time reveal panel
fills it in.

### 8.3 `brandgeo/web/mcp.html`

Sections: what it is (one paragraph), endpoint `https://app.getbrandgeo.com/mcp`,
how to get a key (Account, "MCP access"), the three snippets, the client
table from 8.1, the seven tools with one plain line each, the plan gate
("Radar and above"), the limits (60 a minute per key, 5,000 a day per
account), "read-only: it never starts a collection or changes your
account", and how to revoke. Added to `sitemap.xml`. Copy from `bg-copy`;
no em or en dashes, no banned vocabulary (AGENT-OS section 7.3).

### 8.4 Pricing and FAQ

- `index.html` pricing table: one row, working label "MCP access for your AI
  tools" (final wording `bg-copy`), included on Radar and every tier
  above it that the table shows, not included on Free.
- `faq.html` (and `faq.js` if it drives the page): one question and answer,
  "Can I connect BrandGEO to Claude, Cursor or other AI tools?", answering
  with the gate, the read-only scope, and a link to `mcp.html`.

---

## 9. Migration

File `db/supabase-client-api-keys-migration-2026-09-22.sql`, written by
`bg-backend`, applied by Constantin. Idempotent.

```sql
-- Remote MCP access keys (docs/arch/mcp-access.md section 3).
-- The key itself is never stored: key_hash is sha256 hex, key_prefix is display only.
CREATE TABLE IF NOT EXISTS public.client_api_keys (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id     integer     NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  key_hash      text        NOT NULL UNIQUE,
  key_prefix    text        NOT NULL,
  label         text        NOT NULL DEFAULT '' CHECK (char_length(label) <= 60),
  created_by    uuid,
  created_at    timestamptz NOT NULL DEFAULT now(),
  last_used_at  timestamptz,
  revoked_at    timestamptz
);

CREATE INDEX IF NOT EXISTS idx_client_api_keys_client_active
  ON public.client_api_keys (client_id) WHERE revoked_at IS NULL;

ALTER TABLE public.client_api_keys ENABLE ROW LEVEL SECURITY;

-- Read your own client's keys; admins read all. No INSERT, UPDATE or DELETE
-- policy for authenticated: writes go through the service role in
-- client-api-keys.js and mcp-server.js. No DELETE policy at all: revoke sets
-- revoked_at.
DROP POLICY IF EXISTS client_api_keys_select ON public.client_api_keys;
CREATE POLICY client_api_keys_select ON public.client_api_keys
  FOR SELECT TO authenticated
  USING (public.is_admin() OR client_id = public.get_my_client_id());

-- RLS cannot hide a column, so key_hash is withheld by privilege.
REVOKE ALL ON public.client_api_keys FROM anon, authenticated;
GRANT SELECT (id, client_id, key_prefix, label, created_by, created_at, last_used_at, revoked_at)
  ON public.client_api_keys TO authenticated;
```

No rate-limit table: section 6.2 reuses `affiliate_rate_limits`.

**Order: migration first, then the deploy.** `mcp-server.js` reads
`client_api_keys` on the first authenticated call; a deploy before the table
exists answers 500 to every customer key. After applying, `bg-verify` reads
back `pg_policies` (exactly one policy, SELECT, `{authenticated}`) and
`information_schema.column_privileges` (no `key_hash` for `authenticated`),
read-only.

---

## 10. Tests required from `bg-backend`

Node, no framework, the style of the affiliate suites, on
`tests/helpers/fake_supabase_mem.js`. New helper
`tests/helpers/ts_require.js` registers a `require.extensions['.ts']` hook
using `typescript.transpileModule` (the devDependency the existing
`competitor_aggregate.test.js` already uses), so `mcp-server.js` can be
required under plain node while importing the two `.ts` files.

`tests/mcp_server.test.js`:
- envelope: valid `initialize` answers the requested supported version; an
  unknown version gets `LATEST_PROTOCOL_VERSION`; `ping`; unknown method
  `-32601`; batch array `-32600`; bad JSON `-32700`; body over 64 KB 413;
  GET and DELETE 405; notification 202 with empty body and no DB call.
- auth: missing header, malformed key, unknown key, revoked key, key whose
  embedded client id differs from the row: each 401 with the identical body.
- plan gate: `free` gets `-32002` on `tools/list` and `tools/call`
  with `required_plan: 'radar'`, and `radar` passes; `initialize` still succeeds; a plan
  flipped to `free` on the row between two calls closes the second call.
- research: viewer-issued key on a research client `-32003`; admin-issued passes.
- isolation: two clients with overlapping prompt ids, results, competitors
  and recommendations; every tool called with client A's key returns only
  A's rows; `get_prompt_results` with B's `prompt_id` answers the
  not-on-this-account error.
- error rows: an `ai_results` row with `status: 'error'` never appears in any
  tool output or count.
- no-answer rows: counted in `no_answer`, excluded from `answered`.
- engines: a row for an engine outside `activeEnginesFor()` is excluded.
- caps: 250 prompts give 200 plus a `next_cursor`, and the cursor returns the
  remaining 50; `limit` above max clamps; `window_days` 0 and 999 clamp to 1
  and 365 and are echoed.
- scan ceiling: with the constants injected small, `truncated: true` and
  `effective_from` set.
- rate limits: the 61st request in a minute gets `-32029` with `retry_after`
  and `scope: 'key_minute'`; the daily counter with a small injected limit
  gives `scope: 'client_day'`; a plan-gated call does not spend the daily counter.
- `last_used_at`: two calls 10 s apart write once; a call 61 s later writes again.
- logging: capture console output for a full run including failures; assert
  no `bgmcp_` substring and no hash appear.
- `structuredContent` deep-equals `JSON.parse(content[0].text)` for every tool.

`tests/client_api_keys.test.js`:
- `issue` returns the secret once, matching `CLIENT_API_KEY_RE`; the stored
  row holds its sha256 and prefix and not the secret.
- `list` never returns `key_hash` or a secret, and omits revoked keys.
- `revoke` sets `revoked_at`; a second revoke 404s; another client's key id 404s.
- issuance refused below the gate (403), at 5 active keys (409), and for a
  research client unless admin.
- viewer of client A cannot list, issue or revoke on client B (`requireAuth` mock).

Plan agreement (in either file): transpile `planConfig.ts` in-process and
assert, for all eight plans in `PLAN_ORDER` and one unknown string,
`mcpAllowedFor(p) === hasFeature(p, 'mcp_access')`, and that the two
`PLAN_ORDER` arrays are equal.

---

## 11. Later (not release one)

- **Write tools.** `add_prompt` first (ruling 3). `run_collection` is last:
  a collection spends LLM budget, and the cooldown
  (`PLAN_COLLECTION_COOLDOWN_HOURS`) and `checkCollectionLimits()` spend
  guards are written for a JWT caller; they would have to be re-implemented
  and re-verified for a key caller, with the platform ceiling in mind.
- **OAuth 2.1.** What claude.ai web and ChatGPT connectors need. Supabase
  Auth as the identity provider; protected resource metadata at
  `/.well-known/oauth-protected-resource`; authorization server metadata;
  dynamic client registration; PKCE; audience-bound tokens; a consent screen
  in the dashboard; a client picker for admins who can see many clients;
  mapping the user to `user_profiles.client_id`. The key path stays for CLI
  and IDE clients.
- **Per-plan limits** for Managed and Enterprise (ruling 6).
- **SQL aggregates.** If scans hit the ceiling in practice (large Enterprise
  windows), move the aggregates into service-role SQL functions.
- **`response_text`** and a market filter, once there is demand.

---

## 12. Stage plan and models

| Stage | Agent, model | Builds | Scope |
|---|---|---|---|
| 1 | `bg-backend`, Opus (new credential, new RLS) | `_client_api_key.js`, `mcp-server.js`, `client-api-keys.js`, `mcpAllowedFor` in `_plans.js`, `netlify.toml` blocks, the migration file, both test files, `ts_require.js`, fake extensions if needed | functions, `netlify.toml`, `db/`, `tests/` |
| 1, parallel | `bg-app`, Sonnet | `planConfig.ts` `mcp_access` feature, Account "MCP access" section | `src/` only, disjoint from stage 1 |
| 2 | `bg-copy`, Sonnet | `FEATURE_META.mcp_access` blurb, pricing row label, FAQ entry, `mcp.html` copy, `-32002` message review | `docs/copy/` |
| 3 | `bg-web`, Sonnet | `mcp.html`, sitemap entry, pricing row, FAQ | `brandgeo/web/` |
| 4 | `bg-verify`, Opus; Fable only for the key resolution path (3.4) and the RLS and column-privilege probe (section 9) | runs the suites, reviews against this spec, probes after migration, connects each Supported client after deploy | `docs/qa/` |

Release order, all commands handed to Constantin (AGENT-OS 7.7):
1. Apply the migration. `bg-verify` reads back policies and privileges.
2. All dashboard pieces (stages 1 and bg-app) ride ONE Netlify build,
   `BATCH_PUSH=1`.
3. `bg-verify` connects the Supported clients to the live endpoint (8.1).
4. Web pieces deploy through cPanel (free) only after step 3, so the public
   page never advertises an endpoint that is not answering.

**Scale note (AGENT-OS section 7).** No cron, no scheduled invocation; the
function runs only when a customer's tool calls it. Per request: one key
lookup, one `clients` read, one or two rate-counter upserts, the tool's
reads. Writes are the rate-counter upserts (one per request, plus one per
`tools/call`) and at most one `last_used_at` stamp per minute per active
key. This corrects the packet's "one small write per minute per active key",
which left out the counters. Worst case for one key at the limit: 60
invocations a minute, each within one function run; the daily cap bounds a
client at 5,000 tool calls. A 365-day aggregate scans at most 25,000 rows in
25 pages.

---

## 13. Amendments to packet 025

1. The UI mirror is a `FEATURE_MIN_PLAN` entry (`mcp_access`) over the
   existing `hasFeature()`, not a new `PLAN_MCP_ACCESS` constant: the feature
   table is already the UI's one gate mechanism.
2. `initialize` and `ping` are authenticated but not plan gated (2.4), so a
   downgraded customer reads the upgrade message instead of a connection failure.
3. The scale note gains the rate-counter writes (section 12).
4. "Claude Desktop or claude.ai custom connector": the snippet is for Claude
   Desktop through `mcp-remote`; claude.ai web connectors are OAuth and are
   listed as "coming" (8.1).
5. `mcp-server` bundles with esbuild to import the dashboard's own
   aggregation code (2.1), so MCP numbers and dashboard numbers come from
   one source.
6. `key_hash` is also withheld from `authenticated` by column privilege (3.3).
