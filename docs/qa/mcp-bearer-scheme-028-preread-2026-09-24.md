CLEAR WITH AMENDMENTS

# Packet 028 pre-build read: MCP bearer scheme (I1) and legacy signal pin

- Reviewer: bg-verify (Opus), 2026-09-24
- Subject: `.claude/handoffs/028-bg-architect-to-bg-backend-mcp-bearer-scheme-and-legacy-signal-pin.md`, with `docs/arch/mcp-access.md` sections 2, 3.4 and 14, and `docs/qa/mcp-access-stage1-review-2026-09-22.md` sections 5, 10 and 13
- Code read at HEAD `03d381f`: `brandgeo-dashboard/netlify/functions/mcp-server.js` and `brandgeo-dashboard/tests/mcp_server.test.js`. Neither file has a diff, so nothing is built yet.
- Method: read-only. The existing suite and throwaway probes ran in the session scratchpad only. The probes loaded the live module, plus four copies of it that differ only in `bearer()`, against the repo's in-memory Supabase fake. No key value is printed anywhere in this report.

## 1. Verdict in one paragraph

The ruling is sound. Accepting the scheme case-insensitively does not widen what authenticates. The strict, anchored key regex (`_client_api_key.js`, `CLIENT_API_KEY_RE`) runs on exactly the extracted token, before any hash or database read. So every smuggled, joined, padded or foreign-scheme value collapses into the same `unauthorized(id)` answer. The legacy-signal claim matches the live check order. A 2026-07-28 probe with a valid key answers 400 -32600 after key resolution and before the rate counter. It leaks nothing that `initialize` does not already reveal. The packet can be built, but it needs six amendments first:

- one acceptance criterion cannot be checked as written in this dirty tree;
- one test would pass against the unfixed code if the builder follows the most natural helper usage;
- the separator wording lets a builder accept tabs;
- the line citation is wrong;
- two assertions need a precise measurement.

None of these needs a product decision.

## 2. Baseline (before any build)

```
node tests/mcp_server.test.js   (from brandgeo-dashboard/)
44 passed   exit 0
```

`git diff --stat -- netlify/functions/mcp-server.js tests/mcp_server.test.js` is empty. The working tree carries other sessions' dirty files (`_revenue.js`, `revenue-report.js`, `unlock-audit-report.js`, `Revenue.tsx`, `brandgeo/web/site.js`, docs), and this read touched none of them.

## 3. Question 1: the case-insensitive bearer scheme (I1)

### 3.1 How the live code handles a key

| Step | Where | What it does |
|---|---|---|
| Header lookup | `mcp-server.js:85-90` | `header()` matches the header name case-insensitively and returns the first matching key's value |
| Token extraction | `mcp-server.js:92-95` | `bearer()` checks `startsWith('Bearer ')`, slices 7 characters, then trims |
| Format gate | `mcp-server.js:682-683` | `CLIENT_API_KEY_RE.test(key)` fails, so `unauthorized(id)` runs with no database read |
| Row lookup | `mcp-server.js:685-694` | an equality lookup on `hashClientApiKey(key)` (sha256); a revoked row or a client id mismatch gives the same `unauthorized(id)` |
| 401 body | `mcp-server.js:123-125` | every 401 comes from one function: -32001 with the fixed message, plus `WWW-Authenticate: Bearer realm="brandgeo-mcp"` |

No key is compared in-process. The only timing difference an attacker can observe is "format valid, so one database read" versus "format invalid". The format is public.

### 3.2 Attack cases, probed against the recommended implementation (section 7, amendment A1)

All cases ran with `initialize` and id 42. Every 401 was compared byte for byte against the 401 for an unknown well-formed key.

| Input `Authorization` value | Result | Why |
|---|---|---|
| `Bearer <k>`, `bearer <k>`, `BEARER <k>`, `bEaReR <k>` | 200 | intended |
| `Bearer  <k>` (two spaces); `Bearer <k>` plus trailing spaces | 200 | intended; the stage-1 probes P8b and P8c already passed these |
| `Bearer \t<k>` (a space, then a tab) | 200 | the scheme ends at the space; the remaining tab is removed by `trim()` |
| `Bearer\t<k>` (a tab only) | 401 | RFC 7235 `credentials = auth-scheme [ 1*SP token68 ]`, so the separator is SP |
| `Bearer`, `Bearer `, `Bearer   ` (empty or whitespace-only remainder) | 401 | the empty token fails the regex |
| `Basic <k>`, `Token <k>`, `<k>` with no scheme | 401 | not the bearer scheme |
| `Bearer<k>` (no separator), `Bearerx <k>` | 401 | at least one space is required right after the scheme |
| ` Bearer <k>` (leading space) | 401 | the match is anchored at the start; this matches today's behaviour |
| `Bearer <k>, Bearer <k>` (two duplicate headers merged by a proxy) | 401 | the anchored regex rejects the comma and the second value |
| `Bearer <k>, Basic eHg=` | 401 | same reason |
| `Bearer <k> extra` | 401 | the anchored regex rejects anything after the key |
| `Bearer <k with an inner space>` | 401 | same reason |
| `Bearer <k in upper-case hex>` | 401 | the regex requires lower-case hex |
| an array-valued header `['Bearer <k>']` | 401 | the `typeof` guard (live code today: 500 -32603, see F4) |
| `Bearer ` + 1 MiB of spaces + `x` | 401 | 401 in under 200 ms; the rejection runs in linear time |

Result: 24 of 24 cases as expected, and all 401 bodies are identical to the reference. `WWW-Authenticate` was unchanged on every one.

### 3.3 Probing the implementations a builder is likely to write

| Candidate `bearer()` | Deviations found |
|---|---|
| `/^bearer +/i` plus `slice` and `trim` (recommended) | none, 24/24 |
| `h.toLowerCase().startsWith('bearer ')` plus `slice(7)` | 23/24; an array value gives 500 (the pre-existing behaviour, not new) |
| `/^bearer\s+(.*)$/i` | 22/24; **a tab-only separator is accepted** (200), and an array is coerced to a string and accepted |
| `h.split(' ')`, then the scheme and the key | 21/24; **two spaces are rejected** (so a packet test fails), **`Bearer <k> extra` is accepted** (200), and an array gives 500 |

No candidate accepts a key it should not; the key regex prevents that in every one. The deviations are about the RFC and consistency, not authentication. Pinning the code, as amendment A1 does, removes the variance.

### 3.4 Duplicate and array-valued headers

- On Netlify and Lambda, `event.headers` is a record of strings. Repeated headers either arrive joined with ", " or go to `multiValueHeaders`, which this function never reads. That is **taken as given** from platform documentation; I did not observe it on the deployed endpoint.
- The joined form is covered by the probe above and answers 401.
- The array form cannot reach the handler through that shape. If it does, the live code throws inside the try block and answers 500 -32603 (probe A7). That is recorded as F4.

## 4. Question 2: the legacy signal pin

### 4.1 Does the packet's claim match the live check order?

Yes. Measured on the live module (probes A1 to A5):

| Request | Status and code | Rate counter RPCs | Database operations |
|---|---|---|---|
| Modern probe (version header 2026-07-28, `Mcp-Method: server/discover`, the `_meta` body), valid growth key | 400, -32600, no `result` | 0 | `client_api_keys` select, `clients` select, `client_api_keys` update (the `last_used_at` stamp, `mcp-server.js:713-720`) |
| Same probe, valid free-plan key | 400, -32600 | 0 | same |
| Same probe, no key | 401, -32001, standard `WWW-Authenticate` | 0 | none |
| Same probe, unknown well-formed key | 401, body byte-identical to the no-key case | 0 | one `client_api_keys` select |
| Same body, no version header, valid key | 200, -32601 | 1 (the per-key minute counter) | reads plus the counter |

The order is:

1. `bearer()` and the format gate (`:682`);
2. the key row lookup (`:685`);
3. the clients read (`:699`);
4. the stamp (`:713`);
5. step 7, the version check (`:723-727`);
6. `rateCheck` (`:740`).

So the packet's "no rate counter RPC" assertion is correct. Its natural reading, "no database call at all", would be **false**, because the stamp write fires on the first request in a minute. Amendment A4 pins how to measure it.

### 4.2 Does the order leak anything?

It does not add a new oracle:

- A valid key gets 400 on the modern probe and an invalid key gets 401. `initialize` already separates them the same way (200 versus 401).
- The plan gate runs after dispatch, so a free-plan key also gets the 400. It falls back to `initialize` and then meets the normal plan answer. That is correct behaviour.
- The 401 body stays identical across the missing, malformed, unknown, revoked and mismatch cases on the modern probe too (probe A4).

### 4.3 The 2026-07-28 fallback rule

This was **verified** against the published page `modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http`, Backward Compatibility section. The page says:

- a client that gets a 400 SHOULD inspect the body;
- a recognized modern error means retry or correct;
- an empty body, or one that is not a recognized modern error, means fall back to the legacy `initialize` handshake.

A 400 with -32600 is not one of the modern codes (-32022, -32020, -32021), so a dual-era client falls back. The same page says an unsupported version MUST get a 400 with UnsupportedProtocolVersionError, but that rule binds servers that implement 2026-07-28. This server declares only the legacy revisions, so 400 -32600 is the legacy answer, as spec section 14.3 argues.

**Taken as given, not re-read:** the TypeScript SDK `probeClassifier` detail (that -32600 is classified as legacy) is quoted from the architect in spec 14.3. I did not read the SDK source.

## 5. Question 3: scope

Confirmed. Only the two files in `scope_write` need to change:

- `bearer()` in `mcp-server.js:92` is module-local. The exports at `mcp-server.js:810-816` are `handler`, `handle`, `SUPPORTED_PROTOCOL_VERSIONS`, `LATEST_PROTOCOL_VERSION`, the two limit constants and `TOOL_NAMES`, not `bearer`.
- An `rg` for `mcp-server` across `brandgeo-dashboard/` finds only `tests/mcp_server.test.js` requiring it. The other hits are the `netlify.toml` rewrite and timeout (`:76`, `:372`) and comments in `ts_require.js:3` and `_client_api_key.js:5`.
- `_affiliate_auth.js:31-34` has its own separate, case-sensitive `bearer()`. It reads `headers.authorization` or `headers.Authorization` and is used at `_affiliate_auth.js:47` and `:68` by the affiliate endpoints only. Nothing is shared, and the packet correctly leaves it alone.
- The divergence is recorded in spec 14.6. The comment at spec 3.4 ("same parsing as `_affiliate_auth.js` bearer()") becomes stale when 028 lands. That is a docs edit outside 028's scope; see F7.

## 6. Findings

Findings are ranked by severity. None is a live security exposure, so there is no HUMAN CHECKPOINT.

**F1, MEDIUM (criterion writing): acceptance criterion 7 cannot be checked as written.**
- Where: packet 028, Acceptance criteria, row "`git diff --stat` shows only the two files in `scope_write`".
- Why: the tree already has eleven modified tracked files from other sessions, so `git diff --stat` shows at least eleven files before the builder touches anything. The criterion either fails on a correct build or gets waved through, and both outcomes are bad.
- Fix: amendment A6.

**F2, MEDIUM (test validity): the natural way to write the casing tests passes against the unfixed code.**
- Where: `tests/mcp_server.test.js:117-123`, `ev()`. Line 119 is `if (key) h.authorization = \`Bearer ${key}\``, and it runs after `headers` is spread in.
- Exploit path: a builder writes `ev(body, { key: K, headers: { authorization: \`bearer ${K}\` } })`. Line 119 overwrites the lowercase value with `Bearer K`, so the "lowercase scheme succeeds" test answers 200 whether or not `bearer()` was fixed.
- With `headers: { Authorization: ... }` (capital A), the object ends up with two keys. `header()` then returns the first in insertion order, which happens to be the test value. That is correct by accident, not by design.
- Fix: amendment A2 (`key: null`, and a red-first run).

**F3, LOW (wording): "one or more spaces" does not pin the separator.**
- Where: packet 028, Do 1.
- A Sonnet builder is likely to write `\s+` (probe: a tab-only separator is accepted) or `split(' ')` (probe: a double space is rejected and trailing garbage accepted).
- Neither admits a wrong key, but each drifts from RFC 7235 1*SP or from the packet's own tests.
- Fix: amendment A1, which pins the exact code.

**F4, INFO, PRE-EXISTING: an array-valued `Authorization` value answers 500 -32603 instead of the identical 401.**
- Where: `mcp-server.js:94`; `startsWith` throws on a non-string, and the catch at the end of `handle` answers 500.
- Reachability: not through Netlify's string headers (taken as given). It is reachable only by a direct caller of `handle` with a hand-built event.
- Fix: in scope because it is the same function; the `typeof` guard in amendment A1 closes it.

**F5, INFO: a tempting regex backtracks quadratically.**
- `/^bearer +(.+)$/i` took 214 ms on 20,000 spaces followed by a line feed.
- Node rejects CR and LF in header values, so this cannot be reached. It is noted only because it is the obvious "capture the remainder" regex. The pinned form in A1 has no capture and no end anchor, and ran in under 0.1 ms on the same input.

**F6, INFO, PRE-EXISTING: step 7 sits before the per-key minute counter.**
- Where: `mcp-server.js:723-727` versus `:740`.
- Effect: a holder of a valid key can send an unsupported `MCP-Protocol-Version` on every request and never touch the rate counter. Probe A6: with the per-key limit set to 3 a minute, 200 requests all answered 400 with 0 counter RPCs.
- Cost per request: 2 reads, plus at most 1 stamp write per key per minute.
- This is the same class as stage-1 I2 (unauthenticated well-formed keys cost a read before any limit), and spec 14.3 and 14.5 accept it: the check order is binding and 028 must not change it.
- Recorded so that section 14.7, the modern-era work, can decide whether the version check moves after the counter.

**F7, INFO (docs, out of scope): stale spec comment.**
- Where: `docs/arch/mcp-access.md` section 3.4 says the bearer parsing matches `_affiliate_auth.js`. After 028 it will not; section 14.6 already records why.
- Owner: bg-architect, on its next spec touch. It does not block 028, and `docs/` is outside `scope_write`.

**F8, LOW (citation): the packet points at the wrong line.**
- Where: packet 028, Do 2.
- It cites "the assertion at line 216". Line 216 is the `ok()` label. The identity assertion is line 214, `bodies.every((b) => b === bodies[0])`, over the `bodies` array filled by the loop at lines 207 to 213.
- A new 401 case added outside that loop is not covered by it.
- Fix: amendment A3.

## 7. Exact amendments for the packet

The orchestrator applies these. Each amendment is text to add or replace in `.claude/handoffs/028-...md`.

**A1. Replace Do 1's first bullet list** (from "Accept an `Authorization` value" to "the remainder, trimmed.") with the following:

> Replace `bearer()` with exactly this code, and do not rewrite it into another form:
>
> ```js
> function bearer(event) {
>   const h = header(event, 'authorization')
>   if (typeof h !== 'string') return ''
>   const m = /^bearer +/i.exec(h)
>   return m ? h.slice(m[0].length).trim() : ''
> }
> ```
>
> The separator is one or more ASCII spaces (U+0020) only, per RFC 7235 `1*SP`. A tab alone after the scheme is not a separator and yields 401. Do not use `\s`, `split(' ')`, a capture group, or a `$` anchor. The key format check at line 682 stays unchanged and remains the only thing that decides whether the token is well formed. A non-string header value yields an empty key, and so the same 401.

**A2. Add to Do 2, before its bullet list:**

> Write these tests first and run them against the unmodified `bearer()`. Record that the lowercase and uppercase scheme cases fail there, and record the failing count, before editing `mcp-server.js`. In every new I1 case, call `ev()` with `key: null` and put the whole value in `headers: { authorization: '<value>' }` (lowercase header name). Passing a key to `ev()` makes line 119 overwrite the header with `Bearer <key>`, so the test would pass without the fix.

**A3. Replace in Do 2** "The 401 bodies must stay byte-identical to the existing set (the assertion at line 216)." with:

> Add every new 401 case as an entry in the existing loop at lines 207 to 213 (id 42, `initialize`), so the identity assertion at line 214 and the exact-body assertion at line 215 cover it. Add these 401 cases as well:
> - a tab-only separator (`Bearer\t<valid key>`);
> - no separator (`Bearer<valid key>`);
> - `Bearerx <valid key>`;
> - `Bearer ` followed by spaces only;
> - `Token <valid key>`;
> - `Bearer <valid key>, Bearer <valid key>`;
> - `Bearer <valid key> extra`.
>
> Add one 200 case with trailing spaces after the key, and one 401 case with an array value (`authorization: ['Bearer <valid key>']`) that asserts 401, not 500.

**A4. Replace in Do 3** "no rate counter RPC was called for that request." with:

> the number of `db.calls` entries with `rpc === 'affiliate_rate_check'` is the same before and after the request. Do not assert that the request made no database call: the `last_used_at` stamp may legitimately write.

**A5. Replace Do 5's assertion sentence** ("Assert 401 with the standard -32001 body.") with:

> Use id 42. Assert status 401, the `WWW-Authenticate` value `Bearer realm="brandgeo-mcp"`, a raw body byte-identical to `bodies[0]` from section 2, and no new `db.calls` entries at all (a missing key never reaches the database).

**A6. Replace acceptance criterion 7** ("`git diff --stat` shows only the two files in `scope_write`.") with:

> Before editing, save `git status --porcelain` from the repo root. After the build, the only lines that differ are the two `scope_write` paths. `git diff --stat -- brandgeo-dashboard/netlify/functions/mcp-server.js brandgeo-dashboard/tests/mcp_server.test.js` shows those two files. Paste both outputs.

**Also add one acceptance row** (it follows from A2):

> - [ ] The new casing tests were observed failing against the unmodified `bearer()` before the fix. The failing count is pasted.

## 8. Checked directly versus taken as given

| Claim | Status |
|---|---|
| The live `bearer()`, the format gate, the 401 construction and the check order | Verified by reading the code at the cited lines and by probes |
| A modern probe with a valid key answers 400 -32600 with no `result` and no rate RPC; the stamp may write | Verified by probe A1 and A2 |
| Unauthenticated modern probe: 401, identical body, no database call | Verified by probe A3 and A4 |
| Without the version header: 200 -32601 | Verified by probe A5 |
| The recommended `bearer()` rejects every smuggling and whitespace case with an identical 401 | Verified with 24 cases against a copy of the module |
| Likely builder variants drift (tab, split, array) | Verified with the three variants above |
| Step 7 before the counter lets unsupported-version requests skip the counter | Verified by probe A6 |
| The 2026-07-28 fallback rule on 400 | Verified on modelcontextprotocol.io, 2026-07-28 streamable-http page |
| The SDK `probeClassifier` treats -32600 as legacy | Taken as given from spec 14.3 |
| Netlify delivers headers as strings, joining duplicates or placing them in `multiValueHeaders` | Taken as given (platform documentation), not observed on the deployed endpoint |
| `bearer()` is not shared or exported | Verified by grep and the export list |

## 9. What was not checked

- The deployed endpoint. No request was sent to `app.getbrandgeo.com/mcp`. This read concerns an unbuilt change.
- Real Postgres behaviour. All database observations come from the in-memory fake (`tests/helpers/fake_supabase_mem.js`), which records calls but proves nothing about RLS or real latency.
- Any client (Claude Code, Cursor, the TypeScript SDK) actually falling back after the 400. Only the published rule was read.
- The header shape Netlify's proxy produces when duplicate `Authorization` headers arrive.
- Accessibility and copy. 028 has no user-facing surface.
- `mcp.html` and the Account page. They are outside 028 and are being built in a separate session.

## 10. Regression surface

- `bearer()` has one caller, `mcp-server.js:682`. The only consumer of the module is `tests/mcp_server.test.js`, and the `/mcp` route is the only way in (the `netlify.toml` rewrite).
- `_affiliate_auth.js` and the affiliate endpoints are unaffected; they have their own parser.
- The 401 body and `WWW-Authenticate` must stay byte-identical. That is covered by line 214 once A3 is applied.
