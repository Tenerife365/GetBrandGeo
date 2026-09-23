VERDICT: PASS WITH FINDINGS

# MCP access, stage 1 review (packet 026)

- Reviewer: bg-verify, Opus. Date: 2026-09-22.
- Subject: the stage 1 build of `docs/arch/mcp-access.md` (bg-backend functions,
  migration, tests; bg-app `planConfig.ts` feature and Account section).
  Uncommitted working tree at HEAD `b14d232`.
- Write scope honoured: this file is the only file written. No build, no
  commit, no deploy, no mutating SQL, no reviewed file edited. Throwaway probes
  ran from the session scratchpad, outside the repo, and
  `git status --porcelain -- brandgeo-dashboard` read 16 lines before and after
  every test and probe run.

No live security exposure was found. Key resolution, client isolation, both
gates and secret hygiene hold under every probe and every production read-back.
Nothing below blocks the stage 1 push. Two MEDIUM findings (a dead link and the
one-time reveal dialog) should be fixed before customers see the section, and
deviation 8 (esbuild importing `src/lib/*.ts`) has never been built and must be
proven by the first deploy's probe.

---

## 0. Calibration

```
INTENT: review packet 026  |  SCOPE: docs/qa/ (write), read-only elsewhere  |  MODEL: opus  |  STOP AFTER: /verify
```

1. **Diff and scope.** Edited files, `git diff --stat`:

   ```
   brandgeo-dashboard/netlify.toml                    | 23 ++++++++++++++++++++++
   brandgeo-dashboard/netlify/functions/_plans.js     | 13 ++++++++++++
   brandgeo-dashboard/src/lib/planConfig.ts           | 15 +++++++++++++-
   brandgeo-dashboard/src/pages/Account.tsx           | 13 +++++++++++-
   .../tests/helpers/fake_supabase_mem.js             | 20 ++++++++++++++++++-
   5 files changed, 81 insertions(+), 3 deletions(-)
   ```

   New, untracked: `_client_api_key.js` (39 lines), `mcp-server.js` (811),
   `client-api-keys.js` (157), `db/supabase-client-api-keys-migration-2026-09-22.sql`
   (58), `tests/helpers/ts_require.js` (40), `tests/mcp_server.test.js` (482),
   `tests/client_api_keys.test.js` (234), `src/components/McpAccessSection.tsx`
   (429). Every one of these 13 files is in packet 026's "What was built"
   list. The other dirty files in the tree (`_revenue.js`,
   `revenue-report.js`, `unlock-audit-report.js`, `Revenue.tsx`,
   `brandgeo/web/site.js`, `db/supabase-prospect-channels-migration.sql`,
   gtm docs and agents) belong to other sessions, are excluded by the packet,
   and were not reviewed. No file outside scope was changed by this build.
2. **Secret scan**, counts only. Pattern
   `api[_-]?key|secret|token|password|bearer|sk-|pk_live|service_role`: 3 hits
   in the edited-file diff, 211 in the new files. All are identifiers and
   prose (`client_api_keys`, `secret` state, `Bearer` header docs). A second
   scan for literal credential shapes (`sk_live_`, `rk_live_`, JWT `eyJ...`,
   a full `bgmcp_<id>_<48 hex>`): **0 hits**. No secret in the diff.
3. **Acceptance criteria**, verbatim from the packet: "Every test suite run
   with real output pasted."; "All six production read-backs run and pasted.";
   "Each of the 8 deviations ruled accept or reject."; "Review file written
   with a single verdict line at the top." All four are objectively checkable.
   The spec's own acceptance (section 10) is checked in section 2 below.
4. **Baseline.** `package_provisioning.test.js` is red at HEAD (pre-existing,
   recorded 2026-09-03, asserts a select string absent from
   `stripe-webhook.js`). `npx tsc --noEmit` exits 0 on the current tree;
   `tsconfig.json` includes `src` only, so it covers `planConfig.ts`,
   `Account.tsx` and `McpAccessSection.tsx`, and none of the functions.
   `npm run build` was not run (forbidden by the packet and by the user).
5. **Most sensitive function.** `mcp-server.js`, guarded by its own key
   resolution at `mcp-server.js:682-699` (regex, sha256 lookup on the unique
   `key_hash`, revoked check, embedded-client-id cross check, live `clients`
   row) followed by the plan gate `mcpAllowedFor` at `:756` and the research
   gate at `:761-769`. `client-api-keys.js` is guarded by
   `requireAuth(event, { clientId })` at `client-api-keys.js:56`
   (`_auth.js`, own-client unless admin).
6. Write access used: `docs/qa/mcp-access-stage1-review-2026-09-22.md` only. No
   reviewed file edited.

CALIBRATED

---

## 1. Acceptance criteria (packet 026)

| # | Criterion | Result | Evidence |
|---|---|---|---|
| A1 | Every test suite run with real output pasted | PASS | Section 3 |
| A2 | All six production read-backs run and pasted | PASS | Section 4 |
| A3 | Each of the 8 deviations ruled accept or reject | PASS | Section 6 |
| A4 | Review file written with a single verdict line at the top | PASS | Line 1 of this file |

## 2. Spec checks, priority order from the packet

| Area (spec) | Result | Evidence |
|---|---|---|
| Key format and hashing (3.1) | PASS | `_client_api_key.js`: `/^bgmcp_([1-9][0-9]{0,9})_([a-f0-9]{48})$/`, 24 random bytes, sha256 hex, prefix, `clientIdFromKey` |
| Key resolution order (3.4) | PASS | `mcp-server.js:682-699` matches the 3.4 pseudo code line for line; `bearer()` at `:92-95` is the same parsing as `_affiliate_auth.js:31-34` |
| Mismatched embedded client id -> 401, warn names row id only | PASS | Probe P1; log line `mcp-server.js:692` |
| Revoked key -> 401 | PASS | Probe P2 |
| Identical 401 body for every cause (2.6) | PASS | P1 and P2 bodies byte-identical to an unknown well-formed key; `WWW-Authenticate` set at `mcp-server.js:124` |
| `last_used_at` throttled 60 s, awaited, never fatal (3.4) | PASS | `mcp-server.js:708-715`; suite section "last_used_at throttle" |
| Client isolation, rule 1 (every query filtered by `client_id`) | PASS | Every tool query carries `.eq('client_id', clientId)`; recommendations also by `run_id`; probe P5 and suite isolation section |
| Client isolation, rule 2 (error rows excluded, engines filtered) | PASS | `.neq('status','error')` and `.in('llm', engines)` on every `ai_results` scan, plus the JS `keepRows` filter; suite sections for error rows and engine entitlement |
| Cross-client `prompt_id` | PASS | Probe P5: client 1 key asking for client 2's prompt 5 gets `isError` "No prompt with that id on this account."; P5b: client 1's own prompt 1 does not return the client 2 row that shares `prompt_id` 1 |
| Plan gate on live row (4.3) | PASS | `mcp-server.js:756`; probe P4 answers -32002 with `required_plan radar`, `current_plan free`, `upgrade_url` exactly as 2.6 |
| Free client does not spend the daily counter | PASS | Probe P4: `mcp:client:3:day` rows before 0, after 0 |
| Research gate (4.4) | PASS | Probe P3: viewer-issued key on a research client -> -32003; P3b admin-issued key -> `tools/list` result; `client-api-keys.js:114-115` refuses a non-admin issue |
| `mcpAllowedFor` is the single server gate (4.1) | PASS | `_plans.js` `MCP_MIN_PLAN = 'radar'`, `isValidPlan(plan) && planRank(plan) >= planRank('radar')`; suite section 14 asserts agreement with `planConfig.ts` `hasFeature` for every plan |
| Secret hygiene in logs (3.2, 6.4, 7.2) | PASS | Probe P6: 29 captured log lines, 0 contain `bgmcp_`, a secret or its hash. Suites: 211 and 34 lines, same result. `scrub()` at `mcp-server.js:105-107` blanks `bgmcp_\S*` and 64-hex |
| Secret never persisted client side (7.2) | PASS | `McpAccessSection.tsx:243` `closeReveal` sets state null; no `localStorage`, `sessionStorage` or URL write in the file (grep) |
| Error codes (2.6) | PASS with one gap | All codes match the table; gap is finding F4 (transient `clients` read error answers 401, table says -32603) |
| Key management endpoint (7.1) | PASS | `client-api-keys.js`: 403 below gate `:112`, research `:114`, 409 at 5 `:122`, 503 on 42P01 `:68`, revoke scoped by `id` and `client_id` and `revoked_at is null`; issue log names the row id and user id, never the key `:135` |
| Frontend contract (7.2) | PASS | Request bodies `{action, client_id, label?}` and `{action:'revoke', client_id, id}` (`McpAccessSection.tsx:233`, read at `client-api-keys.js:141`) match the function; response fields `keys`, `max_keys`, `key`, `secret`, `error` read as returned; 503 handled on `list` |
| Rewrite above SPA fallback (1, 12) | PASS | `netlify.toml` `/mcp` rewrite inserted before `/*`, `force = true` |
| Migration content (9) | PASS | RLS on, one SELECT policy, `REVOKE ALL ... FROM anon, authenticated`, column `GRANT SELECT` without `key_hash` (migration lines 35-51); production read-back in section 4 matches |
| TypeScript | PASS | `npx tsc --noEmit` exit 0, no output |

## 3. Test output (real, run from `brandgeo-dashboard/`)

`node tests/mcp_server.test.js`: 43 passed, exit 0. Sections 1 to 14 all
"ok", including identical 401 bodies, free -32002 with the daily counter
untouched, research viewer-issued key -32003, isolation, both rate limits, and
the closing line "211 captured log lines ... no bgmcp_, no key hash, no prefix",
then the plan-agreement check.

`node tests/client_api_keys.test.js`: 14 passed, exit 0, closing "34 captured
log lines: no bgmcp_ and no key hash".

Every other suite:

| Suite | Result |
|---|---|
| affiliate_auth | 16 passed, exit 0 |
| affiliate_core | 27, exit 0 |
| affiliate_flow | 52, exit 0 |
| affiliate_promo_link | 16, exit 0 |
| affiliate_stripe | 19, exit 0 |
| analysis | 156, exit 0 |
| audit_prompt_reproducibility | 26, exit 0 |
| audit_teaser_gate | all checks passed, exit 0 |
| competitor_aggregate | 16, exit 0 |
| competitor_filter | 19, exit 0 |
| contact_routes | 67, exit 0 |
| contact_routes_fetch_guard | 20, exit 0 |
| contact_routes_host_match | 54, exit 0 |
| engine_routing | 5, exit 0 |
| enqueue_history | 23, exit 0 |
| no_answer_rows | all checks passed, exit 0 |
| poll_inbound_replies | 16, exit 0 |
| prospect_alias_lead_word | 43, exit 0 |
| prospects_admin_whitelist | 84, exit 0 |
| reach_parity | 5, exit 0 |
| refresh_cadence | 17, exit 0 |
| revenue_report | 97, exit 0 |
| touches_record | 29, exit 0 |
| package_provisioning | exit 1, `expected: /\.select\('plan_grant_until, plan_source'\)/` (PRE-EXISTING, unchanged, not attributable to this build) |

The four affiliate suites share the edited `fake_supabase_mem.js` and are all
green, so the fake's new unique index and `head` count did not regress them.

### Throwaway probes (scratchpad only, not committed)

Loaded `mcp-server.js` through the repo's own `ts_require` and
`fake_supabase_mem` helpers; fixtures are neutral ("Alpha", "Bravo",
"Freebie", "Study"). Raw output:

```
PROBE P1 mismatched embedded client id -> 401 {"code":-32001,"message":"Invalid or missing BrandGEO API key."}
PROBE P1 body identical to unknown key: true
PROBE P2 revoked key -> 401 {"code":-32001,"message":"Invalid or missing BrandGEO API key."}
PROBE P2 body identical to unknown key: true
PROBE P3 research viewer-issued key -> 200 {"code":-32003,"message":"This account is not available over MCP."}
PROBE P3b research admin-issued key tools/list -> 200 {}
PROBE P4 free client tools/call -> 200 {"code":-32002,"message":"MCP access needs the Radar plan or higher. Upgrade to Radar in your BrandGEO account.","data":{"required_plan":"radar","current_plan":"free","upgrade_url":"https://app.getbrandgeo.com/account"}}
PROBE P4 daily counter rows before/after: 0 0
PROBE P5 cross-client prompt_id (client 1 key asks prompt 5 of client 2) -> 200 {"isError":true,"text":"No prompt with that id on this account."}
PROBE P5b own prompt 1 leaks client 2 row BRAVOROW2: false
PROBE P7 unknown tool named with the key: response echoes key: true
PROBE P8a lowercase bearer scheme -> 401 {"code":-32001,"message":"Invalid or missing BrandGEO API key."}
PROBE P8b double space after Bearer -> 200 {}
PROBE P8c trailing whitespace on key -> 200 {}
PROBE P9 transient clients error -> 401 {"jsonrpc":"2.0","id":1,"error":{"code":-32001,"message":"Invalid or missing BrandGEO API key."}}
PROBE P6 captured log lines: 29 lines containing bgmcp_/secret/hash: 0
```

(The `{}` for P3b, P8b, P8c is the probe printing the absence of an error
object; the call succeeded.)

P7 is not a finding: 2.6 specifies `data.tool` echoes the caller's string, it
goes only back to the caller who already holds the key, and the log records
`tool=unknown`. P8a matches spec 3.4 (same parsing as `_affiliate_auth.js`),
recorded as INFO I1.

## 4. Production read-backs (SELECT only, project `duiyifepitvugyulobqm`)

Run as one UNION query plus one follow-up; output as returned:

1. `pg_policies`: exactly one row: `client_api_keys_select`, `SELECT`,
   `{authenticated}`, qual `(is_admin() OR (client_id = get_my_client_id()))`.
   PASS.
2. `pg_class.relrowsecurity`: `true`. PASS.
3. `column_privileges` for anon and authenticated: authenticated SELECT on
   `client_id, created_at, created_by, id, key_prefix, label, last_used_at,
   revoked_at` (8 columns). No `key_hash`. No row for anon. PASS.
4. `table_privileges` for anon and authenticated: 0 rows. PASS.
5. `pg_indexes`:
   `CREATE INDEX idx_client_api_keys_client_active ON public.client_api_keys USING btree (client_id) WHERE (revoked_at IS NULL)`;
   `CREATE UNIQUE INDEX client_api_keys_key_hash_key ON public.client_api_keys USING btree (key_hash)`;
   `CREATE UNIQUE INDEX client_api_keys_pkey ON public.client_api_keys USING btree (id)`. PASS.
6. `cron.job`: `affiliate-mature 40 4 * * * true`, `affiliate-retention
   35 4 * * * true`, `expire-plan-grants 10 6 * * * true`, `ping-sitemap
   10 5 * * * true`, `purge-old-ai-results 0 3 * * * true`,
   `purge-old-prospect-audits 5 4 * * * true`, `schedule-collections
   10 * * * * true`. Follow-up: `affiliate-retention`'s command text contains
   `affiliate_rate_limits` (true), so the prune spec 6.3 relies on exists and
   is active. PASS.

Follow-up also read: `client_api_keys` has 0 rows and `affiliate_rate_limits`
has 0 rows keyed `mcp:%`, consistent with nothing deployed yet.

The migration was applied before any function shipped, which is the order spec
section 9 and 12 require.

## 5. Security findings

No CRITICAL or HIGH finding. Ranked:

**F4, LOW. A transient `clients` read error is reported as an invalid key.**
`mcp-server.js:695-698` reads `clientRes.data` and never checks
`clientRes.error`. Exploit path (reliability, not access): any Supabase error on
that single read (connection reset, timeout) answers 401 "Invalid or missing
BrandGEO API key." instead of 500 -32603. Measured, probe P9. A customer whose
tool reports an invalid key is likely to revoke a key that is fine. It fails
closed, so there is no exposure. Fix: `if (clientRes.error && clientRes.error.code !== 'PGRST116') throw clientRes.error` before the `!client` check, so a real
error lands in the existing catch at `:800` (-32603), and a missing row still
answers 401. Owner bg-backend.

**F5, LOW. Key cap is check-then-insert.** `client-api-keys.js:117-131` counts
active keys, then inserts. Two concurrent `issue` calls at 4 active keys can
both pass the count and leave 6. Inferred from the code, not probed with real
concurrency (the in-memory fake is sequential). Impact is one extra key over a
soft product limit, no cross-client effect. Fix if wanted: a partial unique
index is not expressible for a count; accept, or enforce in a SQL function.
Recommend accept and record.

INFO items, not findings:

- **I1.** Lowercase `bearer` scheme answers 401 (P8a). This matches spec 3.4
  exactly. RFC 7235 treats the scheme as case-insensitive; every client in
  the spec's setup snippets sends `Bearer`. Architect's call whether to relax.
- **I2.** Unauthenticated but well-formed keys each cost one invocation and one
  indexed read before any rate limit applies. Same property as every public
  function in this project; spec 6.2 counts per key only after resolution.
- **I3.** `client-api-keys.js:74` logs a raw `error.message`. No key reaches
  that path (only the hash is written, and a unique violation puts the hash in
  `details`, not `message`), so nothing leaks today.

## 6. Rulings on the builder-declared deviations

1. **Per-key minute counter runs before the gates; daily counter after gates
   and tool-name check. ACCEPT.** 6.2 says every authenticated request with
   an id; 4.3's intent is that a gated caller does not spend the client's day,
   which P4 proves. A free key hammering the endpoint is throttled by its own
   minute counter, which is the safer reading.
2. **`[functions."client-api-keys"] timeout = 15`. ACCEPT.** Matches 7.1.
3. **`ai_results` scans also filter `.in('llm', engines)` in SQL. ACCEPT.**
   Narrows the scan, keeps the JS filter as a second layer, cannot widen the
   result.
4. **Log labels `other` and `unknown`; scrubbed error messages. ACCEPT.**
   Stricter than the spec; keeps caller-controlled strings out of logs.
5. **`get_brand_overview.last_result_at` not engine filtered. ACCEPT, with a
   note.** It follows the spec query as written. It can report a timestamp
   from an engine the plan no longer includes (for example a retired engine's
   row), which is a date, not data. bg-architect may tighten it in a later
   release; not a defect of this build.
6. **Migration header, `COMMENT ON TABLE`, commented rollback line. ACCEPT.**
   Production read-back matches spec 9 exactly.
7. **"Partial" read as a downgraded client with surviving keys; `gated =
   hasFeature(plan,'mcp_access') || isAdmin`. ACCEPT.** The server decides
   access on every call (4.3), so this is presentation only. The copy at
   `McpAccessSection.tsx:341-342` is accurate: surviving keys answer -32002
   until the plan returns.
8. **Per-function esbuild importing `src/lib/*.ts` directly, never built.
   ACCEPT, CONDITIONAL.** The two imported files have no imports of their own
   and no `import.meta` (grep), and Netlify's esbuild bundler transpiles
   required `.ts` files, so the design is sound. But `mcp-server` is the first
   function in this repo to import from `src/`, and no build has exercised it.
   Condition: after the one Netlify build, run the post-deploy probe (an
   unauthenticated POST to `https://app.getbrandgeo.com/mcp` answers 401
   -32001, and a `tools/call` with a real Radar-or-above key answers a result).
   A 502 or "Cannot find module" there means the bundling failed; revert to the
   prebuild fallback.

## 7. Accessibility findings

Contrast, computed from the tokens (`--dark-800` = rgb(15 23 42) dark, white
light; `index.css` remaps apply):

| Pair | Dark | Light |
|---|---|---|
| `text-slate-200` on dark-800 | 14.48:1 | remapped to rgb(30 41 59), passes |
| `text-slate-300` on dark-800 (header) | 12.02:1 | remapped, passes |
| `text-slate-400` on dark-800 | 6.96:1 | remapped rgb(71 85 105), passes |
| `text-slate-500` and `text-slate-600` (notes, 10 to 12px) | 3.75:1 and 2.36:1 raw, but `index.css:151-152` remaps both to rgb(148 163 184): 6.96:1 | slate-500 remap 6.03:1, slate-600 remap 7.58:1 |
| `text-red-400` (Revoke, errors) | 6.45:1 | remapped rgb(185 28 28), passes |
| `text-brand-400` ("Learn more") | 6.56:1 | remapped rgb(109 40 217), passes |
| `placeholder-slate-600` in the label input | 1.93:1 raw, remapped by `index.css:162-163` to rgb(148 163 184) | passes |

No contrast failure. Computed, not measured in a browser.

**F2, MEDIUM. The one-time reveal dialog can lose the secret and is not a
keyboard dialog.** `McpAccessSection.tsx:386-396`.
- A click on the backdrop calls `closeReveal` (`:386`), which discards the
  secret irrecoverably. A stray click leaves an active key nobody has seen,
  which counts toward the 5-key cap until revoked.
- No Escape handler, no initial focus into the dialog, no focus trap, and
  focus is not returned to "Issue key" on close. A keyboard user tabs behind
  the modal; a screen reader user is not moved into it despite
  `role="dialog"` and `aria-modal="true"`.
Fix (bg-app): remove the backdrop `onClick`, close only through the Close
button and Escape; move focus to the key field on open, trap Tab inside, and
restore focus to the Issue button on close.

**F3, LOW. The reveal is hidden while the list reloads.**
`McpAccessSection.tsx:219-220` calls `load()` right after `setReveal`, and
`load` sets `loading` true, so the loading branch at `:251-259` returns early
and the dialog is not rendered until `list` returns. If that reload fails, the
error branch at `:273-282` renders with no dialog; the secret survives in state
and Retry brings it back, but a user who navigates away loses it. Fix: render
the reveal dialog outside the branch returns, or refresh the list without
flipping `loading`.

Other checks:
- Heading order: `h2` "MCP access" (`:246`), dialog `h3` (`:395`), `h4`
  snippet headings (`:409`). Correct.
- The fifth table header `<th>` (`:301`) is empty; give it
  `<span className="sr-only">Actions</span>`. LOW.
- Revoke hit target: text-xs with a 12px icon and no padding, about 16px tall
  (inferred from classes). Passes WCAG 2.5.8 through the spacing exception
  because rows carry `py-2`, so adjacent targets sit about 36px apart. Not
  measured in a browser.
- Every new button is a native `<button>`, so all are keyboard reachable.
  Focus visibility relies on the browser default ring; not measured.

## 8. Regression surface (found by grep)

- `_plans.js` (one constant and one function added, nothing changed): imported
  by `client-api-keys.js`, `expire-plan-grants.js`, `mcp-server.js`,
  `set-client-plan.js`, `stripe-webhook.js`, `_package_checkout.js`,
  `tests/mcp_server.test.js`, `tests/package_provisioning.test.js`. Additive
  export; no existing caller's behaviour can change.
- `planConfig.ts` (`FeatureId` gains `mcp_access`): consumers
  `FeatureLocked.tsx`, `Layout.tsx`, `SEO.tsx`, `Social.tsx`,
  `McpAccessSection.tsx`. `Layout.tsx:272-273`, `SEO.tsx:452` and
  `Social.tsx:803` name their own features literally, so no nav item or page
  gate changes. `tsc` passes, so every `Record<FeatureId, ...>` was completed.
- `Account.tsx`: routed from `App.tsx` only. Manual look needed: the Account
  page as a Free viewer, a Radar viewer, and an admin, in dark and light.
- `fake_supabase_mem.js`: used by the four affiliate suites plus the two new
  ones; all green.
- `netlify.toml`: the new rewrite sits above `/*`; the `/api/affiliate/*` and
  `/r/*` rewrites are untouched. Manual look after deploy: SPA routes still
  resolve, `/mcp` does not serve `index.html`.

## 9. Data and claim integrity

- The -32002 message ("MCP access needs the Radar plan or higher") and the
  section's copy trace to Constantin's ruling of 2026-09-22 recorded in
  `CLAUDE.md` and to `MCP_MIN_PLAN = 'radar'`. Correct.
- `FEATURE_META.mcp_access.blurb` and the explanation line at
  `McpAccessSection.tsx` are marked "pending bg-copy" in code. They name
  Claude Code and Cursor, which spec 8.1 lists as header-capable clients.
  Traceable; still owed to stage 2.
- The section shows no numbers other than `max_keys`, which comes from the
  server (5, spec ruling 4).
- **F1, MEDIUM. "Learn more" links to a page that does not exist.**
  `McpAccessSection.tsx:357` links `https://getbrandgeo.com/mcp.html`, which
  answers HTTP 404 today (measured with curl, 2026-09-22). Spec 7.2 asks for
  this link and spec 12 deploys the dashboard (step 2) before the web page
  (step 4), so every Radar and higher customer who opens Account between those
  steps gets a dead link from a paying surface. This is a sequencing gap in
  the spec, not a builder error. Fix, owner bg-orchestrator with bg-architect:
  either hold the link out of stage 1 (render it only once `mcp.html` exists),
  or schedule the `mcp.html` cPanel upload for the same hour as the post-deploy
  probe in section 6, item 8.
- Dash scan (`rg` with a character class of U+2014 and U+2013, positive control fired): in the edited files, one
  added line carries an em dash, a code comment at `planConfig.ts:454`. In the
  new files, `McpAccessSection.tsx` lines 2, 6, 28, 29, 32, 34, 35, 39, 40,
  43, 44, all inside the header block comment. None renders to a user, so per
  the standing baseline these are not findings; worth stripping when the file
  is next touched. Every other new file is dash-free.
- Fixtures name no real people (neutral company names, no email addresses in
  either test file, grep).

## 10. Open question: MCP protocol revision 2026-07-28

The claim checks out. `modelcontextprotocol.io/specification/versioning`
names **2026-07-28** as the current revision. It has no initialize handshake
(version, identity and capabilities travel per request in `_meta` and the
`MCP-Protocol-Version` header), servers MUST implement `server/discover`, and
unsupported versions answer `UnsupportedProtocolVersionError` (-32022). The
revisions up to `2025-11-25` are labelled "legacy". This server is a legacy
server (`LATEST_PROTOCOL_VERSION = '2025-11-25'`).

Consequence, per the spec's compatibility matrix: a dual-era client works,
because on HTTP it falls back to `initialize` when a modern request returns a
4xx without a modern error body, and this server answers an unknown
`MCP-Protocol-Version` with HTTP 400 -32600 (`mcp-server.js:718-722`). A
modern-only client fails. Which named clients are modern-only was not checked.
This needs a bg-architect ruling before `mcp.html` promises any client as
"supported" (spec 8.1 already requires connecting each one after deploy).

## 11. What was not checked

- No `npm run build` and no esbuild bundle of `mcp-server.js`, so deviation 8
  is unproven (forbidden by the packet; condition in section 6).
- No live endpoint: nothing is deployed, so the real Netlify rewrite, the real
  `affiliate_rate_check` RPC under load, and real MCP clients (spec 8.1) were
  not exercised. The rate limiter was read in
  `db/supabase-affiliate-migration-2026-09-12.sql:562-575` (fixed UTC window,
  consistent with the "resets at 00:00 UTC" message) but not called.
- No RLS probe as a real `authenticated` viewer (would need a rollback
  transaction or a login; neither was allowed). Privileges were proven from the
  catalog only.
- No browser session: the Account section was not rendered at any viewport,
  focus rings and hit targets were inferred from classes, and contrast was
  computed from tokens, not measured.
- Concurrency of `issue` (F5) was reasoned from the code, not raced.
- The spec's tool output shapes were checked by the suite's structuredContent
  parity test and by reading `outputSchema` (`mcp-server.js:485-619`); the
  integer ids match the `bigserial` columns in
  `db/supabase-recommendations-migration.sql:62, 77`. No external schema
  validator was run against a strict MCP SDK client.
- Which MCP clients are modern-only under revision 2026-07-28.
- Out of scope files listed in the packet were not opened.

## 12. Hand-back

| Finding | Severity | Owner | Blocks stage 1 push |
|---|---|---|---|
| F1 dead `mcp.html` link | MEDIUM | bg-orchestrator, bg-architect (sequencing) | No, but fix before or at deploy |
| F2 reveal dialog: backdrop discards secret, no keyboard dialog | MEDIUM | bg-app | No, fix before customers are told about the feature |
| F3 reveal hidden during list reload | LOW | bg-app | No |
| F4 transient `clients` error answers 401 | LOW | bg-backend | No |
| F5 key cap check-then-insert | LOW | bg-architect (accept or enforce) | No |
| Deviation 8 build proof | Condition | Constantin runs the post-deploy probe | Must pass after the build |
| Protocol 2026-07-28 | Ruling | bg-architect | No |

---

## 13. Amendment 2026-09-23: remediation re-check

AMENDMENT VERDICT: PASS WITH FINDINGS

- Reviewer: bg-verify, Opus. Date: 2026-09-23.
- Subject: the F1 to F4 remediation claimed by bg-backend (`mcp-server.js`,
  `tests/mcp_server.test.js`) and bg-app (`McpAccessSection.tsx`). Every claim
  was re-checked against the code, not the builders' reports.
- Write scope honoured: this appended section is the only write. Sections 0 to
  12 are unchanged. No reviewed file edited, no build, no commit, no git write,
  no deploy, no SQL. Probes ran from the session scratchpad only;
  `git status --porcelain -- brandgeo-dashboard` read 16 lines before and after
  every run, identical.

All four findings are closed. F5 stays accepted. Two new LOW accessibility
findings (N1, N2) came out of re-reading the focus code. Both were
demonstrated in headless Chrome, neither exposes a secret, and neither blocks
the stage 1 push.

### 13.1 What changed since the 2026-09-22 review

File modification times against this report's own (2026-09-22 15:09):
`mcp-server.js` 2026-09-23 18:16, `tests/mcp_server.test.js` 18:16,
`McpAccessSection.tsx` 18:21. Unchanged since the review, and therefore still
as reviewed: `client-api-keys.js` (09-22 14:46), `_client_api_key.js`
(14:42), `_plans.js` (14:42), `planConfig.ts` (14:47), `Account.tsx` (14:46).
The remediation touched exactly the three files it claims.

### 13.2 Per-finding status

| Finding | Status | Evidence |
|---|---|---|
| F1 dead `mcp.html` link | CLOSED | `rg "mcp\.html\|Learn more"` on `McpAccessSection.tsx` hits only the comment at `:473-477`; no anchor renders. Re-adding the link is owed when `mcp.html` goes live (spec 12 step 4) |
| F2 reveal dialog | CLOSED, two new LOW residuals (N1, N2) | 13.4 |
| F3 reveal hidden during reload | CLOSED | 13.4 |
| F4 transient `clients` error answers 401 | CLOSED | 13.3, fail-before reproduced |
| F5 key cap check-then-insert | ACCEPTED, unchanged | `client-api-keys.js` untouched since the review |
| LOW empty `th` | CLOSED | `McpAccessSection.tsx:412` `<span className="sr-only">Actions</span>` |
| Header comment dashes | CLOSED | 13.6 |

### 13.3 F4, server

Code at `mcp-server.js:699-704`: `.eq('id', row.client_id).maybeSingle()`,
then `if (clientRes.error) throw clientRes.error`, then `if (!client) return
finish(unauthorized(id), '-32001')`. The throw lands in the outer catch at
`:804-806`, which answers `rpcError(500, id, -32603, 'Internal error')`.

**`maybeSingle()` semantics, checked against the shipped library, not the
fake.** `@supabase/postgrest-js` 2.110.0, `dist/index.cjs:405-416`: with
`isMaybeSingle`, an array of 0 rows becomes `data = null` with `error` left
null, 1 row becomes the object, and more than 1 becomes PGRST116. The read is
on the `clients` primary key, so the more-than-one branch cannot occur. A
missing row is therefore `data null, error null` and reaches the 401. The
in-memory fake (`tests/helpers/fake_supabase_mem.js:139-142`) behaves the
same way.

This is a cleaner form of the fix section 5 proposed (`.single()` with a
PGRST116 exclusion) and is equivalent in outcome.

**Fail-before, reproduced in the scratchpad.** The probe loads the live file,
and also compiles an in-memory copy patched back to the pre-fix
`.single()` with no error check, under the same filename so its relative
requires resolve. Nothing was written into the repo. Raw output:

```
PRE-FIX A clients read error -> 401 {"jsonrpc":"2.0","id":9,"error":{"code":-32001,"message":"Invalid or missing BrandGEO API key."}}
PRE-FIX B missing row -> 401 {"jsonrpc":"2.0","id":9,"error":{"code":-32001,"message":"Invalid or missing BrandGEO API key."}}
PRE-FIX B body identical to unknown key: true
PRE-FIX B headers identical to unknown key: true {"Content-Type":"application/json","Cache-Control":"no-store","X-Content-Type-Options":"nosniff","WWW-Authenticate":"Bearer realm=\"brandgeo-mcp\""}
PRE-FIX B status identical: true
CURRENT A clients read error -> 500 {"jsonrpc":"2.0","id":9,"error":{"code":-32603,"message":"Internal error"}}
CURRENT B missing row -> 401 {"jsonrpc":"2.0","id":9,"error":{"code":-32001,"message":"Invalid or missing BrandGEO API key."}}
CURRENT B body identical to unknown key: true
CURRENT B headers identical to unknown key: true {"Content-Type":"application/json","Cache-Control":"no-store","X-Content-Type-Options":"nosniff","WWW-Authenticate":"Bearer realm=\"brandgeo-mcp\""}
CURRENT B status identical: true
captured log lines: 7, containing bgmcp_ or 48+ hex: 0
  log: [mcp-server/probe123] failed: connection reset near [redacted]
```

- The missing-row 401 matches the unknown-key 401 byte for byte on status,
  body and all four headers, for the same request id. By construction too:
  both paths call the one `unauthorized(id)` at `mcp-server.js:123-125`.
- Logging. The only new log output on this path is the existing catch line,
  `failed: ${scrub(e.message)}`. The probe deliberately put a live key inside
  the injected error message and it was redacted. The `clients` query is keyed
  on `row.client_id`, not the key, so a real Postgres error on it carries no
  key material anyway. No new `console` call was added.
- Regression test. `tests/mcp_server.test.js:450-476` asserts 500 -32603 with
  no `WWW-Authenticate` on a `clients` error, and for an orphan key row 401,
  the `WWW-Authenticate` header, and `rawBody === bodies[0]` (the unknown-key
  body from section 2 of the suite). The pre-fix run above shows case A would
  have failed that assertion.

### 13.4 F2 and F3, `McpAccessSection.tsx`

What was confirmed in the code:

- **Dialog semantics.** `:312-317`: `role="dialog"`, `aria-modal="true"`,
  `aria-labelledby="mcp-reveal-title"`; the `h3` at `:320` carries that id.
  `rg "mcp-reveal-title"` over `src` hits only these two lines, and
  `Account.tsx:556` is the only `McpAccessSection` instance. There are no
  duplicate ids.
- **One dialog at a time.** The five branch returns (`:354`, `:369`, `:382`,
  `:440`, the final return at `:466`) are mutually exclusive `if` returns, and
  each renders `{revealDialog}` once (`:363`, `:376`, `:392`, `:460`, `:501`).
  Two dialogs cannot render together.
- **The dialog survives the reload.** Every branch returns the same shape,
  a Fragment of `[div, revealDialog]`. So React reconciles the dialog `div` at
  the same position across a branch change and keeps the DOM node, and focus
  inside it is not lost when `load()` flips `loading`. `setReveal`,
  `setLabel` and `load()`'s synchronous `setLoading(true)` (`:274-276`,
  `:194`) are batched into one render. That render is the loading branch with
  the dialog present, so the open effect finds `secretInputRef`. This is
  reasoned from React's reconciliation and batching rules, not observed in a
  rendered page.
- **The secret cannot be discarded by accident.** `setReveal(null)` has one
  call site, `closeReveal` (`:298`), and `closeReveal` has one caller, the
  Done button (`:321`). The backdrop (`:311`) has no `onClick`, and Escape is
  swallowed (`:231-236`). There is no `localStorage`, `sessionStorage` or
  history write in the file. The only other way to lose the secret is
  unmounting the component (navigating away), which is inherent.
  `closeReveal` still drops the secret from state.
- **Listener cleanup.** The effect (`:216-256`) depends on `[reveal]` and
  returns a cleanup that removes the same `onKeyDown` reference (`:253`). That
  runs on close, on unmount, and before any re-run.
- **Hooks.** Every `useState`, `useRef`, `useCallback` and `useEffect`
  (`:172-256`) sits above the only early return, `if (isDemoMode) return null`
  at `:258`. `CopyBtn`'s single `useState` is unconditional.
- **One or two focusables.** When there is only one element, `first === last`,
  so Tab and Shift+Tab re-focus it. That is correct. In practice the dialog
  always has six (Done, the secret input, four Copy buttons), and none are
  ever disabled.
- **The Done button** is the sole close control. Its accessible name "Done, I
  have copied the key" begins with the visible text, so it satisfies WCAG
  2.5.3. It is about 20px tall with no neighbouring target within 24px, so it
  passes 2.5.8 through the spacing exception (inferred from classes). I accept
  the Escape choice: section 7 suggested Escape as a close path, but there it
  would destroy an unread secret, and WCAG does not require it.

**Headless Chrome probe.** The real component cannot be rendered locally: it
returns null in demo mode, and no agent holds a login. So the probe used a
scratchpad harness page that copies the dialog's DOM order (cards before it,
one Account block after it) and the `onKeyDown` handler from `:220-249`
verbatim with the types removed. Keys and clicks were driven through CDP
`Input.dispatchKeyEvent` and `Input.dispatchMouseEvent`. Chrome 64-bit,
headless. Raw output:

```
T1 Tab x8 from the secret input: copy-secret > copy-1 > copy-2 > copy-3 > done > secret > copy-secret > copy-1
T2 Shift+Tab x8 from the secret input: done > copy-3 > copy-2 > copy-1 > copy-secret > secret > done > copy-3
T3 after clicking the last snippet text, active = BODY
T3 then Tab -> after-admin
T4 after clicking the dialog title, active = BODY
T4 then Shift+Tab -> revoke
T5 click warning text then Tab -> secret
T6 Escape leaves dialog open, active = secret
T7 focus() on a disabled Issue key button -> active = secret
```

T1, T2 and T6 confirm the claimed trap and the Escape behaviour for keyboard
use. T3, T4 and T7 are the new findings below.

**N1, LOW (new). The focus trap only wraps at its two edges, so a mouse click
inside the dialog lets Tab escape behind the modal.** `McpAccessSection.tsx:242-248`
acts only when `document.activeElement` is exactly `first` or `last`. When a
user clicks non-focusable text in the dialog, focus moves to `body`, and the
browser's sequential-navigation starting point moves to the click location.
Concrete path: a user selects the Claude Desktop snippet text to copy it by
hand (T3), presses Tab, and focus lands on the Account block after the
section, behind the overlay. Clicking the dialog title and pressing Shift+Tab
lands on a Revoke button behind it (T4). A keyboard press there acts on a
control the user cannot see, and a screen reader user leaves the dialog. There
is no secret exposure. Fix (bg-app): in the Tab branch, first check
`if (!root.contains(document.activeElement)) { e.preventDefault();
(e.shiftKey ? last : first).focus(); return }`. Alternatively, set `inert` on
the page outside the dialog while `reveal` is set.

**N2, LOW (new). Focus return silently fails in three reachable states.**
The cleanup at `:254` calls `issueBtnRef.current?.focus()`. The Done button
that held focus unmounts with the dialog, so whenever that call does nothing,
focus falls to `body`. It does nothing when:
1. Done is pressed before the post-issue `list` returns. The loading branch
   has no Issue key button, so the ref is null.
2. The reload failed. The error branch has no Issue key button.
3. The key just issued was the fifth. The button renders
   `disabled={issuing || atCap}` (`:490`), and `focus()` on a disabled button
   does nothing (T7).

Case 3 is the normal path for anyone who fills the 5-key cap. Nothing crashes.
The keyboard user restarts from the top of the document (WCAG 2.4.3). Fix
(bg-app): fall back to an element that is present in every branch. For
example, give the section `h2` in `Header` (`:300-304`, rendered first in
every branch) `tabIndex={-1}` and a ref. On close, focus the Issue key button
when it exists and is enabled, else that heading.

INFO, not a finding: `McpAccessSection` is not keyed by `clientId`, so an
admin who switched client while the dialog was open would still see the
previous client's key. That switcher sits behind the modal, and the key is
not re-exposed to anyone new.

### 13.5 Contract with `client-api-keys.js`

The function is unchanged since the review (13.1). The component's
`callKeysFn` and request bodies are unchanged: `{action:'list', client_id}`
at `:196`, `{action:'issue', client_id, label}` at `:268-270`, and
`{action:'revoke', client_id, id}` at `:288`. They are read at
`client-api-keys.js:51`, `:84`, `:101-105` and `:140-141`. Response fields
`keys`, `max_keys`, `key`, `secret` and `error` are read as before. Contract
holds.

### 13.6 Tests, types, dashes (real output, from `brandgeo-dashboard/`)

- `node tests/mcp_server.test.js`: **44 passed**, exit 0 (43 before, plus the
  F4 regression). Closing lines: "215 captured log lines (including 401s,
  500s, a key sent as the method and tool name, and an error message carrying
  a key): no bgmcp_, no key hash, no prefix", then the plan agreement check.
- `node tests/client_api_keys.test.js`: **14 passed**, exit 0, "34 captured
  log lines: no bgmcp_ and no key hash".
- Every other suite, one line each as printed:

  ```
  affiliate_auth | exit 0 | 16 checks passed
  affiliate_core | exit 0 | 27 checks passed
  affiliate_flow | exit 0 | 52 checks passed
  affiliate_promo_link | exit 0 | 16 checks passed
  affiliate_stripe | exit 0 | 19 checks passed
  analysis | exit 0 | All 156 assertions passed.
  audit_prompt_reproducibility | exit 0 | PASS: 26 assertions
  audit_teaser_gate | exit 0 | All checks passed.
  competitor_aggregate | exit 0 | 16 checks passed
  competitor_filter | exit 0 | All 19 assertions passed.
  contact_routes | exit 0 | 67 assertions passed.
  contact_routes_fetch_guard | exit 0 | 20 assertions passed.
  contact_routes_host_match | exit 0 | 54 assertions passed.
  engine_routing | exit 0 | 5 checks passed
  enqueue_history | exit 0 | PASS: 23 assertions
  no_answer_rows | exit 0 | All checks passed.
  package_provisioning | exit 1 |   expected: /\.select\('plan_grant_until, plan_source'\)/,
  poll_inbound_replies | exit 0 | 16 assertions passed.
  prospect_alias_lead_word | exit 0 | PASS: 43 assertions
  prospects_admin_whitelist | exit 0 | 84 assertions passed.
  reach_parity | exit 0 | PASS: 5 assertions
  refresh_cadence | exit 0 | 17 assertions passed.
  revenue_report | exit 0 | 97 checks passed.
  touches_record | exit 0 | 29 assertions passed.
  ```

  Identical to section 3. `package_provisioning` is the pre-existing red,
  unchanged.
- `npx tsc --noEmit`: exit 0, no output.
- Dash scan: `rg -n "[U+2014 U+2013 as a literal class]"` over
  `McpAccessSection.tsx`, `mcp-server.js` and `tests/mcp_server.test.js`
  returns 0 hits, exit 1. The positive control (a scratchpad file holding one
  of each) returned 1 matching line, exit 0, so the pattern fires. The 11
  header-comment dashes from section 9 are gone. The remaining non-ASCII
  characters in the component are U+2026 ellipses in visible text (`:360`,
  `:419`) and U+2500 box-drawing rules in comments. Neither is a dash.
- Secret handling in this amendment: no key value is printed. The probe keys
  were minted in memory by `makeClientApiKey` and are redacted in every
  captured line.

### 13.7 What was not checked in this pass

- The real component was not rendered in a browser. N1, N2, T1 to T7 come from
  a harness with the handler copied verbatim, not from the React tree. The
  claim that the dialog survives a branch change is reasoned from React's
  reconciliation rules, not observed. Firefox and Safari were not run.
- No screen reader was used, so `aria-modal` containment was not heard.
- No focus-ring visibility measurement and no light-mode rendering.
- No `npm run build`, so deviation 8 (esbuild importing `src/lib/*.ts`) is
  still unproven and still needs the post-deploy probe in section 6, item 8.
- The protocol 2026-07-28 ruling is still owed to bg-architect and is not part
  of this pass.
- The real Supabase client was not driven against a live `clients` error. Its
  `maybeSingle` behaviour was read from the installed library source, and the
  error path was driven through the fake.

### 13.8 Hand-back (updated)

| Item | Severity | Owner | State | Blocks stage 1 push |
|---|---|---|---|---|
| F1 dead `mcp.html` link | MEDIUM | bg-app, bg-orchestrator | CLOSED; re-add the link when `mcp.html` ships (spec 12 step 4) | No |
| F2 reveal dialog | MEDIUM | bg-app | CLOSED | No |
| F3 reveal hidden during reload | LOW | bg-app | CLOSED | No |
| F4 transient `clients` error answers 401 | LOW | bg-backend | CLOSED | No |
| F5 key cap check-then-insert | LOW | bg-architect | ACCEPTED | No |
| Empty `th` | LOW | bg-app | CLOSED | No |
| N1 focus trap escapes after a mouse click inside the dialog | LOW | bg-app | OPEN, new | No; fix before customers are told about the feature |
| N2 focus return lost (reload in flight, reload failed, fifth key) | LOW | bg-app | OPEN, new | No |
| Deviation 8 build proof | Condition | Constantin runs the post-deploy probe | OPEN | Must pass after the build |
| Protocol 2026-07-28 | Ruling | bg-architect | OPEN | No |
