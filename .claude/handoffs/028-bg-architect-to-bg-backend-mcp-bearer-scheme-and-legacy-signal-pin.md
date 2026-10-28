---
id: 028
from: bg-architect
to: bg-backend
status: READY
created: 2026-09-24
scope_write: brandgeo-dashboard/netlify/functions/mcp-server.js, brandgeo-dashboard/tests/mcp_server.test.js
scope_read: docs/arch/mcp-access.md, docs/qa/mcp-access-stage1-review-2026-09-22.md, brandgeo-dashboard/netlify/functions/, brandgeo-dashboard/tests/
model: sonnet
---

## Decision

MCP release one stays legacy-only (2025-03-26, 2025-06-18 and 2025-11-25).
It does not add 2026-07-28, per `docs/arch/mcp-access.md` section 14. Two
small changes follow.

1. **I1.** `bearer()` in `mcp-server.js` matches the auth scheme
   case-insensitively (RFC 7235).
2. **Legacy signal pin.** The step 7 legacy signal gets a regression test,
   so a modern first request keeps falling back.

Blocked only on the pre-build read `bg-verify` owes for an auth-path change
(AGENT-OS guardrail). It is not blocked on anything else. This packet does
not gate `mcp.html`.

## Do

1. **I1, in `mcp-server.js` `bearer()` (lines 92 to 95).** Accept an
   `Authorization` value whose scheme is `bearer` in any letter case.
   (Amended by the orchestrator 2026-09-24 from pre-read A1.) Replace
   `bearer()` with exactly this code, and do not rewrite it into another
   form:

   ```js
   function bearer(event) {
     const h = header(event, 'authorization')
     if (typeof h !== 'string') return ''
     const m = /^bearer +/i.exec(h)
     return m ? h.slice(m[0].length).trim() : ''
   }
   ```

   The separator is one or more ASCII spaces (U+0020) only, per RFC 7235
   `1*SP`. A tab alone after the scheme is not a separator and yields 401.
   Do not use `\s`, `split(' ')`, a capture group, or a `$` anchor. The key
   format check at line 682 stays unchanged and remains the only thing that
   decides whether the token is well formed. A non-string header value
   yields an empty key, and so the same 401.

   Everything else stays as it is:
   - A missing header, another scheme, or an empty remainder still yields
     an empty key, and so the existing identical 401.
   - Do not touch `_affiliate_auth.js`.
   - `x-api-key` stays unaccepted.
2. **Tests for I1, in `tests/mcp_server.test.js` section 2.** (Pre-read
   A2.) Write these tests first and run them against the unmodified
   `bearer()`. Record that the lowercase and uppercase scheme cases fail
   there, and record the failing count, before editing `mcp-server.js`. In
   every new I1 case, call `ev()` with `key: null` and put the whole value in
   `headers: { authorization: '<value>' }` (lowercase header name). Passing
   a key to `ev()` makes line 119 overwrite the header with `Bearer <key>`,
   so the test would pass without the fix. Add these cases:
   - `bearer <valid key>` and `BEARER <valid key>` both succeed on
     `initialize`;
   - `Bearer  <valid key>` (two spaces) succeeds;
   - `Bearer` with nothing after it, and `Basic <valid key>`, still return
     401.

   (Pre-read A3.) Add every new 401 case as an entry in the existing loop
   at lines 207 to 213 (id 42, `initialize`), so the identity assertion at
   line 214 and the exact-body assertion at line 215 cover it. Add these
   401 cases as well:
   - a tab-only separator (`Bearer\t<valid key>`);
   - no separator (`Bearer<valid key>`);
   - `Bearerx <valid key>`;
   - `Bearer ` followed by spaces only;
   - `Token <valid key>`;
   - `Bearer <valid key>, Bearer <valid key>`;
   - `Bearer <valid key> extra`.

   Add one 200 case with trailing spaces after the key, and one 401 case
   with an array value (`authorization: ['Bearer <valid key>']`) that
   asserts 401, not 500.
3. **Legacy signal pin, a new test block.** Send a request with a valid key
   and:
   - headers `MCP-Protocol-Version: 2026-07-28` and
     `Mcp-Method: server/discover`;
   - body `{ jsonrpc: "2.0", id, method: "server/discover", params: { _meta: { "io.modelcontextprotocol/protocolVersion": "2026-07-28", "io.modelcontextprotocol/clientCapabilities": {} } } }`.

   Assert all of the following:
   - HTTP status 400;
   - error code -32600;
   - no `result`;
   - the error code is not -32022, -32020 or -32021;
   - (pre-read A4) the number of `db.calls` entries with
     `rpc === 'affiliate_rate_check'` is the same before and after the
     request. Do not assert that the request made no database call: the
     `last_used_at` stamp may legitimately write.
4. **Pin the case without the header.** Send the same body without an
   `MCP-Protocol-Version` header, with a valid key. Assert HTTP 200, error
   code -32601, and no `result`.
5. **Pin the unauthenticated probe.** Send the step 3 request with no key.
   (Pre-read A5.) Use id 42. Assert status 401, the `WWW-Authenticate`
   value `Bearer realm="brandgeo-mcp"`, a raw body byte-identical to
   `bodies[0]` from section 2, and no new `db.calls` entries at all (a
   missing key never reaches the database). Auth still runs before the
   version check.
6. **Pin the supported list.** Assert that `mcp.SUPPORTED_PROTOCOL_VERSIONS`
   deep-equals `['2025-11-25', '2025-06-18', '2025-03-26']` and does not
   include `'2026-07-28'`. A future edit that adds the modern revision
   without section 14.7 then fails loudly.
7. Run `node tests/mcp_server.test.js` from `brandgeo-dashboard/`. Report
   the before and after check counts, and scan the added lines for em and
   en dashes with `rg`, with a positive control.

## Do not

- Do not edit any file outside `scope_write`, in particular these:
  - `_affiliate_auth.js`;
  - `client-api-keys.js` (F5 is accepted and recorded, not fixed);
  - `docs/`;
  - `brandgeo/web/`.
- Do not change the step 7 answer, the check order, or the error codes and
  messages in spec section 2.6.
- Do not add `2026-07-28` to `SUPPORTED_PROTOCOL_VERSIONS`.
- Do not add `server/discover` or any other modern method.
- Do not commit, push, build or deploy. This rides the next dashboard batch
  build, and the orchestrator sequences it.
- No real people's names in fixtures.

## Acceptance criteria

- [ ] A lowercase and an uppercase `bearer` scheme with a valid key both
      answer `initialize` with 200. `Basic` and a bare `Bearer` still
      answer 401, with a body identical to the other 401 cases.
- [ ] A modern probe with a valid key answers 400 with error code -32600,
      and the test asserts the code is not -32022, -32020 or -32021.
- [ ] The same probe without the version header answers 200 with -32601.
- [ ] The unauthenticated probe answers 401 with -32001.
- [ ] `SUPPORTED_PROTOCOL_VERSIONS` is pinned to the three legacy revisions
      by a test.
- [ ] `node tests/mcp_server.test.js` exits 0, with a higher check count
      than before.
- [ ] (Pre-read A6.) Before editing, save `git status --porcelain` from
      the repo root. After the build, the only lines that differ are the
      two `scope_write` paths. `git diff --stat --
      brandgeo-dashboard/netlify/functions/mcp-server.js
      brandgeo-dashboard/tests/mcp_server.test.js` shows those two files.
      Paste both outputs.
- [ ] The new casing tests were observed failing against the unmodified
      `bearer()` before the fix. The failing count is pasted.
- [ ] The added lines contain zero em or en dashes, proven by `rg` with a
      positive control.

## Open questions for Constantin

None. The pre-build read is done:
`docs/qa/mcp-bearer-scheme-028-preread-2026-09-24.md`, verdict CLEAR WITH
AMENDMENTS. Amendments A1 to A6 are folded into the text above by the
orchestrator on 2026-09-24, so this packet is READY.
