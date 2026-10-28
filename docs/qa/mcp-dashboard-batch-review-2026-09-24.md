PASS WITH FINDINGS

# MCP dashboard batch review, 2026-09-24

```
INTENT: review packet 028 + MCP stage 2 bg-app copy  |  SCOPE: docs/qa/ (write), read-only elsewhere  |  MODEL: opus  |  STOP AFTER: /verify
```

Reviewer: `bg-verify`. Base: HEAD `03d381f`, which equals `origin/main` (`git log origin/main..HEAD` is empty) and has an empty index.
I edited no reviewed file. I ran no build, commit, push, deploy or mutating SQL.

The batch is exactly four working-tree files:

| # | File | Source of truth |
|---|---|---|
| 1 | `brandgeo-dashboard/netlify/functions/mcp-server.js` | packet 028 (A1 to A6 folded in) |
| 2 | `brandgeo-dashboard/tests/mcp_server.test.js` | packet 028 |
| 3 | `brandgeo-dashboard/src/components/McpAccessSection.tsx` | `docs/copy/mcp-access-2026-09-24.md` §2.2 and §11 |
| 4 | `brandgeo-dashboard/src/lib/planConfig.ts` | `docs/copy/mcp-access-2026-09-24.md` §2.1 |

Verdict in one line: the auth-path change is byte-identical to the mandated code, and every packet criterion I could check holds. I reproduced them myself. The new tests bite, proven by three mutation runs. The copy landed verbatim. The two LOW findings do not block the push.

---

## 1. Calibration

1. **Diff stat for the batch:**
   ```
   brandgeo-dashboard/netlify/functions/mcp-server.js     |  6 +-
   brandgeo-dashboard/src/components/McpAccessSection.tsx | 20 +-
   brandgeo-dashboard/src/lib/planConfig.ts               |  2 +-
   brandgeo-dashboard/tests/mcp_server.test.js            | 93 ++-
   ```
   - Packet 028's `scope_write` is `mcp-server.js` plus `mcp_server.test.js`. Both changed, and nothing else changed under the backend half.
   - The copy deck §11 assigns `planConfig.ts:477` and `McpAccessSection.tsx` to bg-app. Both changed, and only at the cited strings.
   - **Other dirty files under `brandgeo-dashboard/` NOT in this batch, which the commit must exclude:**
     - `netlify/functions/_revenue.js`
     - `netlify/functions/revenue-report.js`
     - `netlify/functions/unlock-audit-report.js`
     - `src/pages/Revenue.tsx`

     There are no untracked files under `brandgeo-dashboard/` (`git status --porcelain --untracked-files=all -- brandgeo-dashboard`).
2. **Secret scan over the batch diff:** 32 pattern hits. Every hit is one of these:
   - the word `bearer` or `Bearer`;
   - `KA.secret`, which is a fixture key generated at runtime by `issueKey()`;
   - the string `key`.

   A value-pattern scan (`bgmcp_<id>_<20+ hex>`, `sk_live`, `rk_live`, `eyJ`) over the added lines returned nothing (rg exit 1). No secret value is in the diff.
3. **Acceptance criteria:** stated verbatim in §2. All are objectively checkable. The procedural half of A6 (the builder's own before and after `git status` paste) was not provided to me, so I checked its outcome, not the paste.
4. **Baseline:**
   - HEAD `tests/mcp_server.test.js` against HEAD `mcp-server.js`: **44 passed, exit 0**. Run in a scratch copy.
   - `tsc` at HEAD was not run separately. The working-tree `tsc` is exit 0, so no failure needs attributing.
5. **Most sensitive function touched:** `bearer()`, at `mcp-server.js:92-97`. Its sole caller is step 6 authentication at `mcp-server.js:684-685`:
   - `if (!CLIENT_API_KEY_RE.test(key)) return finish(unauthorized(id), '-32001')`;
   - then a hash lookup, a `revoked_at` check, a client-id binding check (`:686-697`) and the `clients` row check (`:703-708`).

   All of these are unchanged.
6. I write only this file under `docs/qa/`. No reviewed file was edited. Mutation runs used scratch copies under the session scratchpad.

CALIBRATED

---

## 2. Acceptance criteria, packet 028

| # | Criterion (verbatim) | Result | Evidence |
|---|---|---|---|
| 1 | "A lowercase and an uppercase `bearer` scheme with a valid key both answer `initialize` with 200. `Basic` and a bare `Bearer` still answer 401, with a body identical to the other 401 cases." | PASS | The 200 cases are at `tests/mcp_server.test.js:218-230`, with `key: null` and a raw `authorization` header. The 401 cases are `'wrong scheme'` (`:243`) and `'bare Bearer'` (`:244`), both inside the shared loop, which ends with the identity assertion at `:260` and the exact-body assertion at `:261`. The suite run is in §4. |
| 2 | "A modern probe with a valid key answers 400 with error code -32600, and the test asserts the code is not -32022, -32020 or -32021." | PASS | `tests/mcp_server.test.js:565-572`. The server path is `mcp-server.js:724-727`. |
| 3 | "The same probe without the version header answers 200 with -32601." | PASS | `tests/mcp_server.test.js:574-578`. The server path is `mcp-server.js:757-759`. |
| 4 | "The unauthenticated probe answers 401 with -32001." | PASS | `tests/mcp_server.test.js:580-587`: the `rawBody` equals `bodies[0]` (the -32001 body), and `db.calls.length` is unchanged. |
| 5 | "`SUPPORTED_PROTOCOL_VERSIONS` is pinned to the three legacy revisions by a test." | PASS | The test is at `tests/mcp_server.test.js:589-591`. The constant is at `mcp-server.js:52` and is exported at `:814`. |
| 6 | "`node tests/mcp_server.test.js` exits 0, with a higher check count than before." | PASS | 44 before, 49 after, exit 0 (§4). |
| 7 | (A6) "...the only lines that differ are the two `scope_write` paths... Paste both outputs." | PASS on outcome; the builder's paste was not checked | For the backend half, `git diff --stat` on the two paths shows exactly those two files. The four other dirty dashboard files belong to other sessions (per the orchestrator) and are excluded by the commit pathspec. I did not see the builder's pre-edit porcelain snapshot. |
| 8 | "The new casing tests were observed failing against the unmodified `bearer()` before the fix. The failing count is pasted." | PASS, reproduced independently | I ran the new test file against the HEAD `mcp-server.js` in a scratch copy: `I1 casing failures observed (2/4): lowercase scheme: expected 200, got 401 \| uppercase scheme: expected 200, got 401`, exit 1. |
| 9 | "The added lines contain zero em or en dashes, proven by `rg` with a positive control." | PASS | See §4. The added lines across all four files (105 lines): `rg -c "[—–]"` found no match (exit 1). The positive control file with one em dash and one en dash gave `2`. |

### Additional checks from the orchestrator's brief

| Check | Result | Evidence |
|---|---|---|
| `bearer()` byte-identical to the packet's mandated code | PASS | The diff at `mcp-server.js:92-97` equals Do 1's code block line for line: `const h = header(event, 'authorization')` / `if (typeof h !== 'string') return ''` / `const m = /^bearer +/i.exec(h)` / `return m ? h.slice(m[0].length).trim() : ''`. There is no `\s`, no `split`, no capture group and no `$`. |
| All 401 variants give byte-identical bodies with `WWW-Authenticate` | PASS | There are 15 cases in the loop (`tests/mcp_server.test.js:236-258`). Each asserts status 401 and `WWW-Authenticate: Bearer realm="brandgeo-mcp"` and pushes its `rawBody`. Then `:260` checks every body equals the first, and `:261` deep-equals the -32001 body. |
| An array-valued header gives 401, not 500 | PASS | `:252`. The mutation run with the `typeof` guard removed fails with `FAILED: array-valued header`. |
| Auth runs before the version check | PASS | In source, step 6 is at `mcp-server.js:683-708` and step 7 at `:723-727`. Test `:580-587` asserts no `db.calls` for a keyless modern probe. |
| The rate counter is untouched on the 400 -32600 path | PASS, and the assertion is not vacuous | `rateCheck` calls `sb.rpc('affiliate_rate_check')` (`mcp-server.js:733`) only after step 7 (`:742`). The fake records it as `{ rpc: name }` (`tests/helpers/fake_supabase_mem.js:198`). The control request with no version header does reach `:742`. |
| `node tests/mcp_server.test.js` count | PASS | 49 passed, exit 0 (the builder claimed 49; the baseline is 44). |
| `npx tsc --noEmit` | PASS | exit 0 (§4). |
| No real people's names in fixtures or copy | PASS | The added fixtures are generated keys plus the literal strings `Bearer`, `Basic`, `Token`, `Bearerx` and `extra`. The copy names products (Claude Code, Cursor) and `support@getbrandgeo.com` only. |

---

## 3. Copy deck conformance (`docs/copy/mcp-access-2026-09-24.md`)

I checked the strings by program, not by eye. For each string, the check confirmed the exact text is in the deck and counted its occurrences in the file.

| Deck row | Location now | New text present / expected count | Old text remaining |
|---|---|---|---|
| 2.1 blurb | `planConfig.ts:477` | 1/1 | n/a |
| 2.2 row 2 | `McpAccessSection.tsx:428` | 1/1 | 0 ("MCP-compatible AI tools to read") |
| 2.2 row 4 | `:401` | 1/1 | 0 |
| 2.2 row 5 | `:201`, `:205`, `:415` | 3/3 | 0 |
| 2.2 row 15 | `:294`, `:300` | 2/2 | 0 |
| 2.2 row 21 | `:311`, `:314` | 2/2 | 0 |
| 2.2 row 23 | `:476` "Upgrade to Radar" | 1/1 | 0 ("See plans") |
| SPEC-LITERAL rows 9, 14, 22 | `:353`, `:520`, `:473` | unchanged, 1/1 each | n/a |
| KEEP rows (1, 3, 6, 7, 8, 10 to 13, 16 to 20, 24) | various | unchanged; the diff touches no other line | n/a |

No string was invented. The diff is exactly the 10 lines in `McpAccessSection.tsx` and 1 line in `planConfig.ts` that the deck cites.

**Stage 1 accessibility guarantees, all intact:**
- `role="dialog"` (`:341`), `aria-modal="true"` (`:342`), `aria-labelledby="mcp-reveal-title"` (`:343`), and `id="mcp-reveal-title"` (`:347`).
- The backdrop `div` at `:338` has no `onClick`.
- Escape is a no-op: it calls `preventDefault` and returns (`:233-238`).
- The Tab trap has the `withinDialog` re-entry (`:248-254`).
- Focus returns to `issueBtnRef` when it is connected and enabled, otherwise to `headerRef` (`:271-276`).
- The sr-only `Actions` header is at `:439`.
- No "Learn more" link: the only hits for "Learn more" or `mcp.html` are in the comment at `:500-504`, and there is no `href` in the file.

**The upgrade line names Radar and shows only for Free:**
- The branch is `!gated`, where `gated = hasFeature(plan, 'mcp_access') || isAdmin` (`:285`).
- `hasFeature` is `planRank(plan) >= planRank('radar')` (`planConfig.ts:834-837`, `FEATURE_MIN_PLAN.mcp_access = 'radar'` at `:458`).
- So the line renders for a non-admin viewer on `free`, or on an unknown plan string, which ranks 0.
- On the server, `mcpAllowedFor` (`_plans.js:117-119`) is `isValidPlan(plan) && planRank(plan) >= planRank('radar')`, which also refuses both. The two agree.
- Section 14 of the test suite asserts the agreement for all eight plans and an unknown string.
- `onUpgrade` (`Account.tsx:560`) sends a Free client without Stripe to `getbrandgeo.com/#pricing` (`Account.tsx:351-359`). "Upgrade to Radar" is therefore an honest label for where it leads.

---

## 4. Commands and raw output

```
$ cd brandgeo-dashboard && node tests/mcp_server.test.js      (working tree)
...
15. legacy signal pin (protocol version 2026-07-28, packet 028)
  ok - a modern-era probe (2026-07-28, server/discover, the _meta body) with a valid key: 400 -32600, no result, code is not a modern-era code (-32022/-32020/-32021), and the rate counter is untouched
  ok - the same probe with no MCP-Protocol-Version header: 200 -32601 (falls through to the ordinary unknown-method answer)
  ok - the unauthenticated modern probe: 401, identical body to section 2, auth still runs before the version check, no database call at all
  ok - SUPPORTED_PROTOCOL_VERSIONS is pinned to the three legacy revisions and does not include 2026-07-28

49 passed
exit 0

$ (scratch copy: HEAD test + HEAD server)
44 passed
head exit 0

$ (scratch copy: NEW test + HEAD server, i.e. the old bearer())
  I1 casing failures observed (2/4): lowercase scheme: expected 200, got 401 | uppercase scheme: expected 200, got 401
FAILED: I1 casing cases failed: lowercase scheme: expected 200, got 401 | uppercase scheme: expected 200, got 401
mix exit 1

$ (same, with the I1 assertion disabled, so the 401 loop runs against the old bearer())
FAILED: array-valued header          <- old code answered 500, not 401

$ (mutation: new server with /^bearer\s+/i instead of / +/)
FAILED: tab-only separator

$ (mutation: new server with the typeof guard deleted)
FAILED: array-valued header

$ cd brandgeo-dashboard && npx tsc --noEmit
tsc exit 0

$ git diff -U0 -- <4 files> | grep '^+' | grep -v '^+++' > added.txt ; wc -l
105
$ rg -c "[—–]" added.txt ; echo $?
1                                    (no match)
$ rg -c "[—–]" control.txt           (one em dash line, one en dash line)
2
```

`npm run build` was deliberately NOT run, because of the RAM cap and the orchestrator's instruction. `tsc` covers `src/` only. `mcp-server.js` is proven loadable because the test suite `require`s it and runs it end to end.

---

## 5. Security findings

No finding in this batch is a security defect. No live exposure, so no HUMAN CHECKPOINT.

The auth change strictly widens acceptance to RFC 7235 case variants of the same scheme. It adds no new way to present a credential:
- `x-api-key` is still refused (test at `:263-265`).
- The key format regex, the hash lookup, the revocation check and the client-id binding are untouched and still decide everything after `bearer()`.

Two things narrow instead:
- A non-string header now answers 401 instead of 500. This closes pre-read F4.
- Scheme smuggling (`Bearerx`, no separator, tab-only, duplicate comma-joined values, trailing garbage) is pinned to the identical 401.

**Pre-existing, accepted, recorded only:** step 7 sits before the per-key minute counter. That is pre-read F6, and the spec (sections 14.3 and 14.5) accepts it. A valid-key holder sending an unsupported `MCP-Protocol-Version` costs 2 reads, plus at most 1 stamp write per key per minute, and never touches the counter. Packet 028 was barred from changing the order, and the new test at `:571` now pins that behaviour. So a future move of the version check after the counter must update that test on purpose. That is correct, but whoever works on spec 14.7 should know about it.

---

## 6. Findings, ranked

**F1, LOW: the placeholder comments now misdescribe approved copy.**
- Where:
  - `McpAccessSection.tsx:54-62`, which says every string except four spec-literals "is a placeholder... not customer-approved copy";
  - `McpAccessSection.tsx:426-427`, "COPY: pending bg-copy. Placeholder explanation line";
  - `planConfig.ts:475-476`, "Placeholder wording only, not customer-approved copy".
- How it breaks: the next agent that reads these comments treats the approved deck strings as disposable and rewrites them. The comment sits directly above the approved text, and nothing else in the file says it is approved.
- Fix (bg-app, next touch):
  - Replace each comment with "Copy approved in `docs/copy/mcp-access-2026-09-24.md` §2.2" (for `McpAccessSection.tsx`) or "§2.1" (for `planConfig.ts`).
  - Keep the list of spec-literal strings.
- Does not block: it is comment-only, with no runtime effect.

**F2, LOW: "Upgrade to Radar" is hardcoded beside a line that derives the plan.**
- Where: `McpAccessSection.tsx:476`. The paragraph at `:473` renders `PLAN_LABELS[unlockPlan ?? 'radar']`, and `Account.tsx:560` routes `onUpgrade` via `featureUnlockPlan('mcp_access')`.
- How it breaks: if `FEATURE_MIN_PLAN.mcp_access` moves off `radar`, the paragraph, the upgrade destination and the server gate would all name the new plan while the button still says Radar. Today all four agree.
- Fix: `Upgrade to {PLAN_LABELS[unlockPlan ?? 'radar']}`. It renders the identical string today, so the deck's text is honoured.
- Does not block: there is no live mismatch.

**F3, INFO: the new `mcp_access` blurb renders nowhere yet.**
- `FEATURE_META` is consumed only by `FeatureLocked.tsx` (`:26`, `:45`, `:69`).
- `FeatureLocked` is mounted only for `ai_seo` (`SEO.tsx:453`) and `ai_social` (`Social.tsx:804`).
- So the blurb at `planConfig.ts:477` ships but is not shown to anyone. Its claims are true (§7), so there is no risk. It is recorded so nobody reports "the blurb is live" as a delivered change.

**F4, INFO: the server-side string replacements from the copy deck §2.3 are not in this batch, by design.**
- The deck assigns them to a later bg-backend pass. They are:
  - `mcp-server.js` -32002 and -32003;
  - `client-api-keys.js:75`, `:87`, `:112`, `:115`, `:142`, `:148`.
- Consequence: `McpAccessSection.tsx` shows `data?.error` in preference to its own fallback, so a 403, 404 or 409 from `client-api-keys.js` still shows the older server text. For example, a stale revoke still reads "No active key with that id." with no next step.
- Owner: bg-backend, as a separate packet.

---

## 7. Data and claim integrity

| Claim (new copy) | Where | Traced to | True? |
|---|---|---|---|
| "direct read access to this account's visibility data" | `McpAccessSection.tsx:428` | Seven read tools: `mcp-server.js:489`, `:506`, `:522`, `:542`, `:569`, `:592`, `:607`. Every query is scoped to the key's `clientId` (`:709`) | Yes |
| "It only reads: it can never start a collection or change your account." | `:428` | The only writes in `mcp-server.js` are the `client_api_keys.last_used_at` stamp (`:717`) and the `affiliate_rate_check` counter RPC (`:733`). No `insert`, `upsert` or `delete`, no `fetch`, and nothing that reaches the collection queue or `clients` | Yes |
| "Read-only: nothing it does can start a collection or change your account." | `planConfig.ts:477` | Same as above | Yes |
| "Connect Claude Code, Cursor and other AI tools..." | `planConfig.ts:477`, `McpAccessSection.tsx:428` | Setup snippets for Claude Code and Cursor exist at `McpAccessSection.tsx:104-136` (spec 8.2) | Yes |
| `support@getbrandgeo.com` | `:201`, `:205`, `:294`, `:300`, `:311`, `:314`, `:401`, `:415` | The same address is used by `SupportWidget.tsx:64` and `Account.tsx:359` | Yes |
| "Upgrade to Radar" | `:476` | `FEATURE_MIN_PLAN.mcp_access = 'radar'` (`planConfig.ts:458`) and `MCP_MIN_PLAN = 'radar'` (`_plans.js:116`) | Yes |

The copy names no tools by identifier, carries no number, and makes no claim I could not trace.

---

## 8. Accessibility

- **No new interactive element.**
  - One existing button changed label, from "See plans" to "Upgrade to Radar". Its accessible name is its visible text; the Sparkles icon is decorative.
  - Keyboard reachability, focus visibility, heading order (`h2` section, `h3` and `h4` in the dialog) and hit targets are unchanged from stage 1.
  - I did not re-measure the hit target of that button (`px-4 py-2 text-sm`); it is pre-existing.
- **No new text-on-surface pair.** The new strings render in classes that existed at HEAD. I computed contrast for the surfaces they sit on:

| Text class | Surface | Theme | Ratio |
|---|---|---|---|
| `text-slate-500` (remapped by `index.css:151-152` to 148,163,184) | `--dark-800` 15,23,42 | dark | 6.96:1 |
| `text-red-400` 248,113,113 | `--dark-800` | dark | 6.45:1 |
| `text-slate-500` (light override 85,100,121, `index.css:189`) | white | light | 6.03:1 |
| `text-slate-400` (light override 71,85,105, `index.css:170`) | white | light | 7.58:1 |
| `text-red-400` (light override 185,28,28, `index.css:212`) | white | light | 6.47:1 |

All are at or above 4.5:1.

---

## 9. Regression surface (by grep)

- `bearer(` has one caller, `mcp-server.js:684`.
- `mcp-server` is referenced by:
  - `netlify.toml` (the `/mcp` rewrite and timeout);
  - `tests/mcp_server.test.js`;
  - `tests/helpers/ts_require.js`;
  - a comment in `_client_api_key.js`.
- `_affiliate_auth.js` keeps its own parser and is untouched.
- `McpAccessSection` is imported only by `src/pages/Account.tsx:18`.
- `FEATURE_META` is consumed only by `src/components/FeatureLocked.tsx`.

**Paths needing a manual look after deploy:**
1. The Account page MCP card, as a Free viewer and as a Radar or higher viewer.
2. A live `initialize` against `app.getbrandgeo.com/mcp` with a lowercase `bearer` scheme.

---

## 10. What was not checked

- **The deployed endpoint.** No request was sent to `app.getbrandgeo.com/mcp`.
  - Netlify's real header shape for duplicate `Authorization` headers is taken as given.
  - So is its behaviour of never delivering a non-string header value.
- **Real Postgres.** Every database observation comes from `tests/helpers/fake_supabase_mem.js`. That proves call order and counts, not RLS or latency.
- **`npm run build`.** Not run, because of the RAM cap and the orchestrator's instruction. The Vite bundle and the function bundling are unverified here. `tsc` exit 0 covers types in `src/` only.
- **Rendered layout.**
  - No browser observation was made at any viewport.
  - The error and 503 lines are longer now, and I did not see them wrap at 375px next to the Retry button.
  - The support address is plain text, not a `mailto:` link. The deck did not ask for a link.
- **Light mode rendering of the card.** I computed contrast from the tokens and did not observe it.
- **The builder's own pre-edit `git status --porcelain` snapshot** (A6 procedural). Not provided to me.
- **Whether the four other dirty dashboard files belong to other sessions.** Taken from the orchestrator; git cannot attribute authorship of uncommitted edits. They are excluded from the commit either way.
- **The other dirty trees** (`_revenue.js`, `revenue-report.js`, `unlock-audit-report.js`, `Revenue.tsx`, `brandgeo/web/*`, `docs/`, `db/`). Out of scope and not reviewed.
- **MCP clients** (Claude Code, Cursor, the SDK) actually falling back after a 400 -32600. Not exercised.

---

## 11. Commit command for Constantin (PowerShell, do not run until ready)

The pathspec on both `git add` and `git commit` guarantees that only these four files enter the commit, even if another session has staged something in the meantime. Run from the repo root:

```powershell
cd "C:\Users\const\Constantin Daniel Goane\BrandGEO"
git add -- brandgeo-dashboard/netlify/functions/mcp-server.js brandgeo-dashboard/tests/mcp_server.test.js brandgeo-dashboard/src/components/McpAccessSection.tsx brandgeo-dashboard/src/lib/planConfig.ts
git diff --cached --name-only
git commit -m @'
feat(mcp): case-insensitive bearer scheme and legacy protocol pins (packet 028); stage 2 copy for the Account MCP card

- mcp-server.js bearer(): RFC 7235 case-insensitive scheme, 1*SP separator,
  non-string header answers the identical 401 instead of 500
- tests: I1 casing and smuggling cases in the shared 401 loop, legacy signal
  pin for 2026-07-28, SUPPORTED_PROTOCOL_VERSIONS pinned; 44 to 49 checks
- McpAccessSection.tsx and planConfig.ts: copy deck mcp-access-2026-09-24
  rows 2, 4, 5, 15, 21, 23 and the mcp_access blurb
- Reviewed: docs/qa/mcp-dashboard-batch-review-2026-09-24.md, PASS WITH FINDINGS

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
'@ -- brandgeo-dashboard/netlify/functions/mcp-server.js brandgeo-dashboard/tests/mcp_server.test.js brandgeo-dashboard/src/components/McpAccessSection.tsx brandgeo-dashboard/src/lib/planConfig.ts
git show --stat HEAD
```

**Expected result:**
- `git diff --cached --name-only` lists exactly the four paths.
- `git show --stat HEAD` shows 4 files, with roughly 115 insertions and 11 deletions.

If any other path appears, stop. `git restore --staged <that path>` unstages it without touching the file.

This review file (`docs/qa/mcp-dashboard-batch-review-2026-09-24.md`) is docs only. Commit it separately, or add it to the pathspec if you want it in the same commit. Either way it costs no build.

### Safe to push?

**Yes**, once a dashboard build is due. It is one Netlify build, and the AUTONOMY section 7 batching applies:

```powershell
$env:BATCH_PUSH=1; git push origin main
```

Scale note: neutral.
- No new reads, writes or function invocations.
- `bearer()` is a constant-time regex over one header.
- The copy change is client-side text only.

After the push, confirm the deploy by the deploy record's `commit_ref` or by a string unique to this batch in the live bundle (for example "Upgrade to Radar"), never by a local `dist` hash.

The two LOW findings (F1, F2) go back to bg-app for its next touch of these files. Neither needs a rebuild before this push.
