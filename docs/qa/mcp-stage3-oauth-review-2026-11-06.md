PASS WITH FINDINGS

# MCP stage 3 review: OAuth authorization server and MCP server changes

- **Reviewer:** bg-verify (Opus), static, read only. Nothing reviewed was edited; no git, deploy, SQL or migration.
- **Date:** 2026-11-06.
- **Subject:** the uncommitted stage 3 working tree: `_oauth.js`, `oauth-metadata.js`, `oauth-authorize.js`, `oauth-token.js` (new); `mcp-server.js`, `client-api-keys.js`, `netlify.toml` (edited); `db/supabase-mcp-oauth-2026-11-06.sql` (new, not applied); the four test files and the fake; the SPA files `OAuthAuthorize.tsx`, `mcpOauthCopy.ts`, `oauthNext.ts`, and the edits to `App.tsx`, `Login.tsx`, `SocialAuthButtons.tsx`, `McpAccessSection.tsx`, `AIVisibility.tsx`, `aiVisibilityCopy.ts`, `fixStates.ts`.
- **Against:** `docs/arch/mcp-stage3-oauth.md` (RULED, section 11 build contract), Claude's own pages re-read today (`claude.com/docs/connectors/building/authentication.md` and `lazy-authentication.md`), the copy deck and the design spec of 2026-11-06.

**Counts:** 0 BLOCKER, 0 MAJOR, 1 MEDIUM, 6 LOW, 9 INFO.

**Bottom line.** The authorization server is sound where it matters most: PKCE, single-use codes, the code bound to client, redirect, user and resource, replay revocation, the consent request bound to its user and re-checked from the stored row, write only when requested AND ticked, admin and plan refusals, the shape router on `/mcp`, effective scope as token AND grant, the 401 header, and the log scrub. 25 targeted mutations were run against a scratch copy; 24 were killed by the existing suites. The one MEDIUM is not a hole but a behaviour the build chose on purpose (strict refresh reuse detection) that, combined with "one grant per user and app", turns any duplicate refresh into a full disconnect of every install of that app for that user. I reproduced it. It needs a ruling and a live test before the directory submission, not before the migration.

**Fable:** not needed for the code as built (reasons in section 6). Needed only if the refresh grace in M1 is built.

---

## 1. Findings

### MEDIUM

**M1. A duplicate refresh disconnects every connection of that user and app (decisions 2 and 7 together).**
- Where: `brandgeo-dashboard/netlify/functions/oauth-token.js:175-197` (reuse and race branches both call `o.revokeGrant`), `oauth-token.js:139-160` (one live grant per user, OAuth client and BrandGEO client, reused by every consent).
- Reproduced: scratch probe `probe_refresh_race.js` in my scratchpad (not in the repo) sends two refreshes of one refresh token at once against the in-memory fake. Result: refresh A `200` with a new pair, refresh B `400 invalid_grant`, the grant's `revoked_at` set, and refresh A's brand new access token answers `/mcp` with `401 ... error="invalid_token"`. The winner is handed tokens that are already dead.
- Failure scenario, no attacker needed: (a) two Claude Code sessions on one machine share one credential store; one rotates, the other still holds the old refresh token in memory and presents it at its own proactive refresh; (b) a refresh whose response is lost (Claude allows 30 s) is retried with the same token; (c) parallel tool calls each meeting a 401 refresh reactively, if Claude does not single-flight across workers. Any of these revokes the grant, and because decision 7 puts every Claude Code install of that user on one grant (same CIMD client id), all of them disconnect at once. A directory reviewer who hits it sees a connector that drops.
- What Claude's page says: it refreshes "reactively on a 401 response, and proactively up to five minutes before the stored expiry", and asks only that rotation return the new token "in the same response that invalidates the old one". It says nothing about single-flight, so we cannot rule (a) to (c) out statically.
- Recommendation (my answer to the decision 2 question): **keep reuse detection, add a short no-revoke grace.** If the presented refresh token's `used_at` is within 30 seconds of now, answer `invalid_grant` WITHOUT revoking the grant and WITHOUT issuing anything; log `outcome=refresh_reuse_grace`. Outside 30 seconds, keep today's strict revoke. The same rule covers the claim-race branch at `oauth-token.js:192-197` (a lost race is by definition inside the window). Reasons: no second token pair is ever issued for one refresh token, so the security property of rotation is intact; a stolen token replayed after the 30 s window still kills the grant; the benign retry and the double-flight no longer destroy a live connection the winner just extended. Do not implement the "reissue within grace" variant some vendors use: it needs the successor in plain text or a second claim column, and it widens the replay window.
- Follow-up worth a packet, not required for release one: scope revocation to the token family (a `family_id` set at code exchange and carried on rotation) instead of the whole grant, so one stale Claude Code process cannot disconnect the user's other machines.
- Live test owed: section 8 item 4 plus a new 4b: two Claude Code sessions on one machine, left open across an access token expiry; record whether the connection survives. If Constantin keeps strict mode, that test decides it.

### LOW

**L1. A refresh that re-sends the originally requested scope fails with `invalid_scope` when the user left write unticked.**
- Where: `_oauth.js:165-172` (`narrowScope` refuses any word not held), used at `oauth-token.js:185-187`.
- Reproduced: `narrowScope('mcp:read offline_access', 'mcp:read mcp:write offline_access')` returns `{ error: 'invalid_scope' }`. The default consent is write unticked (R2), so this is the common grant.
- Scenario: if Claude sends `scope` on refresh equal to what it asked for at authorize (the 401 header asks `mcp:read mcp:write`), every refresh of a read-only connection fails with a code that is not `invalid_grant`, so Claude cannot even tell the token is dead; the user reconnects every hour. Whether Claude sends `scope` on refresh is not documented; the MCP SDK does not.
- Fix: per RFC 6749 section 3.3 the server MAY issue a narrower scope than requested. Intersect the requested words with the current scope (keep `mcp:read`), and refuse with `invalid_scope` only when a word is unknown. Add a refresh on a read-only grant to live test item 4.

**L2. CIMD `redirect_uris` are not scheme-checked, and the SPA navigates to whatever the server returns. Latent XSS once R4 widens.**
- Where: `_oauth.js:327-331` (`validateCimdDocument` checks type and length only), `_oauth.js:214-218` (`buildRedirect` keeps any scheme), `src/pages/OAuthAuthorize.tsx:144` and `:187` (`window.location.assign(data.redirect)`).
- Reproduced: a document listing `javascript:alert(document.domain)//` validates, `redirectAllowed` returns true for it, and `buildRedirect` returns `javascript:alert(document.domain)//?code=C&state=S`, which `location.assign` would execute on `app.getbrandgeo.com` with the user's session.
- Not exploitable today: R4 restricts CIMD hosts to `claude.ai`, whose documents Anthropic controls. It becomes live the day R4 widens, and R4's widening gate in the spec lists DNS and SSRF guards but not this.
- Fix: in `validateCimdDocument` accept only `https:` URIs and the loopback form of section 4.1 (refuse the document otherwise); per Claude's lazy-authentication page, also require non-loopback redirects to share the `client_id` URL's origin. In the SPA, navigate only when `new URL(redirect).protocol` is `https:` or the URL matches the loopback form. Add both to the R4 widening checklist.

**L3. `/mcp` accepts an admin profile on the OAuth path, unlike the token endpoint, and then treats the grant as admin for research clients.**
- Where: `mcp-server.js:1110-1115` checks only that the profile's `client_id` equals the grant's; `mcp-server.js:1129` `actorIsAdmin: async () => profile.role === 'admin'`. Compare `oauth-token.js:82-86` (`userStillMapped` refuses `role === 'admin'`).
- Scenario: a viewer who connected Claude is later promoted to admin while their profile keeps the `client_id` (an admin action, so not attacker-reachable). Their live access tokens keep working, and if that client is re-categorised as research, the OAuth call passes the research gate that consent refused (R6). Refresh would fail an hour later, so the window is one access token lifetime.
- Test gap: my mutation removing the admin refusal from `userStillMapped` (M23 in section 5) survived; no test covers a user promoted after consent.
- Fix: apply the same mapping rule in `resolveOAuth` (role not admin), make `actorIsAdmin` return `false` for OAuth credentials, and add a test at both endpoints.

**L4. The `unknown_client` error body drops the deck's support line.**
- Where: `src/lib/mcpOauthCopy.ts:58-62` against copy deck section 1.2 `error.unknown_client`, whose body ends "If it keeps happening, write to support@getbrandgeo.com." The code stops after "go back to Claude and try again." No other deck string in sections 1 to 4 differs (section 3 below).
- Fix: restore the sentence (with the mailto link pattern the generic error uses).

**L5. A NEW string makes a claim that is not always true.**
- Where: `mcpOauthCopy.ts:141` `partialNote`: "They will work again after upgrading".
- Why: true while the connection keeps refreshing (the token endpoint is not plan gated, decision 8, and `/mcp` stamps the grant before the plan gate). Not true after 30 days without a refresh (refresh token expiry, R5): the row can still be listed (grant idle expiry is 90 days) yet Claude must reconnect.
- Fix (bg-copy): "They may work again after upgrading; if one does not, disconnect it and connect again." or drop the sentence.

**L6. The token and revoke endpoints, and the three metadata documents, are told apart by `event.path` after a Netlify rewrite.**
- Where: `oauth-token.js:75-79`, `oauth-metadata.js:26-31`, rules at `netlify.toml:93-120`.
- Risk: correct only if Netlify hands the function the original request path on a 200 rewrite. I believe it does, but nothing in the repo proves it (the precedent rule `/r/*` rewrites to a path that carries the splat, so it would work either way). If it does not, all three well-known URLs answer 404 (discovery dead) and `/oauth/revoke` is processed as a token request.
- Fix (cheap and independent of platform behaviour): give each rule a distinct target the function can read, as the affiliate rule does, for example `to = "/.netlify/functions/oauth-token/revoke"` and `/.netlify/functions/oauth-metadata/as`. Test plan items 1 and 5 catch it after deploy either way.

### INFO

- **I1.** Consent names the app from the CIMD document's self-asserted `client_name` (`_oauth.js:340`). Claude's lazy-authentication page advises naming the host of the `client_id` URL. Harmless while R4 is `claude.ai` only; change it before R4 widens.
- **I2.** `READ_ONLY_OAUTH_MESSAGE` (`mcp-server.js`, section 3.1 of the diff) keeps the spec 5 wording, not the deck's tightened `mcp.oauth_read_only`. The deck allows this; the checkbox text matches `consent.write_label` exactly.
- **I3.** Re-consent reuses the live grant and does not revoke its older tokens (decision 7). Reconnecting in Claude is therefore not a revoke; only Disconnect is. `mcp.html` and the privacy paragraph should say "Disconnect" for cutting access, never "reconnect".
- **I4.** `check` inserts one pending `oauth_codes` row per call for any signed-in user, with no rate limit; rows are pruned only by the optional job (R9). Recommend scheduling the prune job with the migration go, not later.
- **I5.** New `console.error` lines in `client-api-keys.js` (`create_anthropic_client`, `list_grants`, `revoke_grant`) log `error.message` unscrubbed. No secret can reach those messages (the secret is never stored; a unique violation puts values in `details`, not `message`), so this is consistency only.
- **I6.** Dash scan: 0 em or en dashes in the stage 3 files and the stage 3 added lines (positive control fired). The two hits in the working-tree diff are in `unlock-audit-report.js`, another session's file, out of scope.
- **I7.** Untracked `tsconfig.tsbuildinfo`, `tsconfig.node.tsbuildinfo`, `vite.config.js`, `vite.config.d.ts` in `brandgeo-dashboard/` predate this review. Keep them out of the stage 3 commit (commit by pathspec).
- **I8.** A read-only OAuth connection that calls `mark_fix_done` gets a 200 tool error. MCP step-up (`403` with `WWW-Authenticate: Bearer error="insufficient_scope", scope="mcp:read mcp:write"`) would let Claude re-ask for write by itself. Rarely reached, since `tools/list` hides the tool from read connections.
- **I9.** Design 3.3 "Deciding" says move focus to the H1 if the disabled Allow loses it; `OAuthAuthorize.tsx:168-198` does not. Minor, keyboard only.

---

## 2. Acceptance table (the twelve points of the brief)

| # | Criterion | Result | Evidence |
|---|---|---|---|
| 1 | PKCE S256; code single use under concurrency; bound to client, redirect (byte exact), user, BrandGEO client, resource; replay revokes the grant | PASS | `_oauth.js:106-117` (RFC 7636 appendix B vector passes, `oauth_core`); claim is one conditional `UPDATE ... used_at is null and expires_at > now RETURNING` at `oauth-token.js:97-99`, a second exchange matches no row (Postgres re-checks the WHERE after the row lock); client `:112`, redirect `:113`, PKCE `:114`, resource `:115-117`, user mapping `:118`, BrandGEO client carried from the stored row; replay revoke `:102-110`. Mutations M1, M10, M13, M17, M21 killed. Note: a replay that lands before the winner links `grant_id` (`:124`) finds no grant to revoke; it still gets `invalid_grant`, so no tokens leak. |
| 2 | Refresh rotation and reuse detection | PASS WITH M1, L1 | Rotation `oauth-token.js:189-201`, `rotated_from` set; reuse `:175-179` and race `:192-197` revoke the grant; scope narrowing `:185-187`. M2, M14 killed. Strict choice judged in M1; scope compatibility in L1. |
| 3 | Redirect validation; no open redirect; errors before the redirect is proven never redirect | PASS (L2 latent) | Loopback regex on the raw string, `$` anchors at end of input in JS, port 1 to 65535, same host required (`_oauth.js:71`, `:178-204`; 26-row table in `oauth_core`; M4 killed). Confidential client exact match. Page errors never carry `redirect` (`oauth-authorize.js:107`, `:129`, `:89-100`). SPA `next`: `safeOauthNext` requires the prefix `/oauth/authorize?`, refuses control characters and backslash, and is used only with react-router `navigate` (`Login.tsx`, `oauthNext.ts:16-26`), so it cannot leave the origin; the `bg_oauth_next` stash is same-origin `sessionStorage`, 10 minutes, re-validated on read, resumed only at `/` (`App.tsx` PrivateRoute), cleared on consent mount; a crafted stash only reproduces a consent link, which still needs a click on Allow. |
| 4 | CIMD: allowlist, canonical URL, no redirects, timeout, size cap, client_id equality, cache | PASS (L2, I1) | `validateCimdUrl` `_oauth.js:245-258` (https, no userinfo, query or fragment, port 443, `href === id`, path required, host on allowlist); fetch `redirect: 'manual'`, 3xx is `client_metadata_unavailable`, 3 s race over fetch and body, 8 KB cap on Content-Length and stream (`:260-322`); `client_id` equality `:326`; cache 24 h, no stale fallback, token endpoint never fetches (`:371-392`, `:410-417`). M11 killed. |
| 5 | `check` and `decide` binding; write only if requested AND ticked; admin refused; plan gate; research | PASS | Pending row keyed by `sha256(request_id)`, `user_id` stored (`oauth-authorize.js:145-160`); `decide` reads only the stored row, re-proves client and redirect, re-runs the account checks for the same user and client, claims once with `user_id`, unused, unexpired (`:183-211`); `grantedScope` `_oauth.js:147-152`; admin, no client, plan, research `oauth-authorize.js:74-86`. M3, M5, M16, M19 killed. |
| 6 | Token endpoint: form only, client auth, constant time, RFC 6749 errors, `invalid_grant` for dead refresh, no-store, revoke | PASS | Content type regex `oauth-token.js:240-244` (415 otherwise); repeated parameter refused `:65-73`; Basic per RFC 6749 2.3.1 `_oauth.js:434-444`; secret compare over sha256 with a dummy hash when the row is missing `_oauth.js:419-426`; 401 plus `WWW-Authenticate: Basic` only when Basic was used `oauth-token.js:233-237`; `no-store` on every answer `:44`; revoke 200 for unknown and foreign tokens, grant revoked for a refresh token `:207-227`. M15, M20 killed. |
| 7 | `mcp-server.js`: router, key path unchanged except decision 11, OAuth checks, counters, audit, 401 header, logs | PASS (L3) | Shape router `mcp-server.js` handler (bgmcp_ first, then `bgmat_`, else plain 401 with no database call); `resolveKey` is the old code moved verbatim; `resolveOAuth` checks token, grant revoked and idle expiry, profile mapping, client row; plan gate and research gate unchanged in place; scope = token AND grant; per-grant minute counter, shared daily and write counters; `marked_by_grant` and audit `grant_id`; pre-migration retry only for keys. Header exact: `Bearer resource_metadata="https://app.getbrandgeo.com/.well-known/oauth-protected-resource/mcp", scope="mcp:read mcp:write"` plus `, error="invalid_token"` for a dead well-formed `bgmat_` (`_oauth.js:507-510`). Scrub covers `bg(mcp|mat|mrt|ocs)_` and 48+ hex. M6, M7, M8, M9, M12, M18 killed. |
| 8 | Migration: RLS, grants, guard, re-runnable, rollback, probes | PASS | RLS on all four tables, `revoke all` from anon and authenticated, one SELECT policy on `oauth_grants` with a ten-column grant that omits `user_id` and every hash; no write or delete policy for authenticated. Guard compared line by line to `db/supabase-mcp-fix-writes-2026-11-06.sql`: the only differences are the four `marked_by_grant` lines mirroring `marked_by_key` exactly (insert into done nulls both for a browser, insert open nulls both, move into done nulls both for a browser, every other update pins both). `create ... if not exists`, `drop policy if exists`, `add column if not exists`: re-runnable. Rollback is fully commented and orders the guard restore first. Probe section 9 is rolled back and catches its own expected unique violation. |
| 9 | Metadata exact; `resource` byte-equal; rewrites above `/*`; `/oauth/authorize` not rewritten | PASS (L6) | `_oauth.js:483-504` equals spec 3.2 and 3.3 field for field; `oauth_core` asserts deep equality and no `registration_endpoint`. Rules at `netlify.toml:93-120` sit after `/mcp` and before `/*` (`:123`); no `/oauth/authorize` rule. |
| 10 | `create_anthropic_client` | PASS | Admin only, 403 otherwise; secret `bgocs_` returned once, stored as sha256; redirect exactly `https://claude.ai/api/mcp/auth_callback` (`client-api-keys.js` new branch). M25 killed. |
| 11 | SPA: consent states, buttons, navigation, Connected apps, hub fallback, accessibility, copy | PASS (L4, L5, I9) | Every `check` code of 11.1 maps to a worded state (`OAuthAuthorize.tsx:61-74`), unknown codes fall to generic; buttons disabled while deciding; only server `redirect` strings are navigated to; Connected apps list, confirm, disconnect with focus moves and a live region; hub 3-rung 42703 step-down (`AIVisibility.tsx`, full, key only, base) and grant names read through RLS including revoked rows; real checkbox with label and `aria-describedby`; 44 px targets on the consent page and on phone. Contrast in section 4. Copy compare in section 3. |
| 12 | SSRF, timing, PII logging, rate limits, existence leaks | PASS (I4, I5) | SSRF bounded to `https://claude.ai/<path>`, GET, no query; constant-time secret compare; logs carry client ids and grant types only (137 OAuth log lines checked by `oauth_flow`, 231 by `mcp_server`); revoke never reveals token existence; `/mcp` 401 bodies identical for every dead credential. No rate limit on OAuth endpoints (decision 10): all secrets carry 192 to 256 random bits, so brute force is not a path; abuse would be cost only. |

## 3. Copy deck sections 1 to 4 against `mcpOauthCopy.ts` (verbatim compare)

- Section 1.1 (23 keys): all identical, including `{hostOrThisComputer}` reading "your app" for loopback.
- Section 1.2 (9 rows): 8 identical. `error.unknown_client` body is short one sentence (L4). Buttons follow the deck.
- Section 2 (19 keys): all identical; `apps.empty` is split around the endpoint, which renders between the two halves in `McpAccessSection.tsx`.
- Section 3: `fixByApp` gives " by {appName}" and " by an AI agent" when empty; key suffix unchanged. Identical.
- Section 4: `mcp.unauthorized` identical; `mcp.oauth_read_only` keeps the spec wording (I2, permitted by the deck); the two unchanged strings identical.
- Strings bg-app wrote itself (`// NEW`): `consent.title`, `consent.deciding`, `consent.app_fallback`, `brandFallback`, the four error buttons, `metadata_unavailable`, `no_account`, `apps.col_actions`, `apps.loading`, `apps.disconnecting`, `apps.disconnect_aria`, `apps.partial_note`, `apps.name_fallback`, `apps.retry`. No dashes, no AI tells, voice consistent. One factual problem: `partial_note` (L5). One awkward render: when `brand_name` is empty the intro reads "from Your account, your BrandGEO account"; unreachable in practice because `clients.name` is always set.

## 4. Accessibility

Contrast, computed today with the WCAG formula from the token values in `src/index.css` and `tailwind.config.js` (dark first, light remaps where they apply):

| Pair | Dark | Light |
|---|---|---|
| H1 `text-white` on dark-800 | 17.85:1 | 17.85:1 |
| `text-slate-400` (intro, redirect line, limits, helper) on dark-800 | 6.96:1 | 7.58:1 |
| `text-slate-500` and `-600` (label, footnote) remapped | 6.96:1 | 6.03:1 |
| Footer `text-slate-600` on the page | 7.45:1 | 7.09:1 |
| Brand chip `text-slate-200` on `dark-700/60` | 12.93:1 | not computed (remap path differs) |
| List `text-slate-300` | 12.02:1 | not computed |
| Check icon `text-brand-300` | 9.67:1 | 7.10:1 |
| Allow white on brand-600, hover brand-700 | 5.70:1, 7.10:1 | 5.70:1 |
| Cancel `text-slate-200` on dark-700 | 11.87:1 | 12.15:1 |
| Loopback warning body slate-300 on the amber tint | 10.28:1 | not computed |
| Loopback icon amber-300 on the amber tint (non-text) | 10.58:1 | not computed |
| Error tile red-400 on the red tint | 5.92:1 | not computed |
| Support mailto `text-brand-400` | 6.56:1 | 7.10:1 |
| Disconnect red-400 on dark-700 | 5.29:1 | 5.37:1 |
| Confirm red-400 on the red tint | 5.92:1 | not computed |
| Checkbox checked fill brand-500 on its group surface (non-text) | 3.93:1 | not computed |
| Focus ring brand-400 on dark-800 | 6.56:1 | not computed |

Every text pair clears 4.5:1 and every non-text pair 3:1. The design spec's light Cancel figure (8.60:1) is lower than mine; both pass.

Keyboard and structure, from the markup: every new control is a native `button`, `a` (react-router `Link`) or `input type="checkbox"` with a `label`, so all are reachable in DOM order; no positive `tabIndex`; the H1 and the Connected apps H3 take `tabIndex={-1}` for script focus only. Focus visibility is the global `:focus-visible` rule; the checkbox adds `focus-visible:ring-brand-400`. Heading order on the consent page H1 then H2; Connected apps uses H3 under the Account section. Hit targets: Allow, Cancel, error buttons and the checkbox row `min-h-[44px]`; Disconnect and confirm buttons 44 px below `md`, about 28 px on desktop (above the 24 px AA floor). Live regions: one polite status per surface, rendered in every state. Not checked in a browser (section 7).

## 5. What I reproduced

Run in `brandgeo-dashboard`, exit codes captured per suite:

```
oauth_core exit=0        (22 passed)
oauth_flow exit=0        (32 passed)
mcp_server exit=0        (83 passed)
client_api_keys exit=0   (26 passed)
fix_states exit=0        (28 passed, 0 failed)
fix_items exit=0         (24 passed, 0 failed)
keyset_read exit=0       (5 passed)
fix_prompt exit=0        (23 passed, 0 failed)
affiliate_core exit=0    (49 checks)
affiliate_flow exit=0    (67 checks)
affiliate_auth exit=0    (16 checks)
affiliate_stripe exit=0  (19 checks)
npx tsc --noEmit -p tsconfig.json   exit=0
```

Mutations, each applied alone to a scratch copy of `netlify/`, `src/` and `tests/` (never the repo), then `oauth_core`, `oauth_flow`, `mcp_server`, `client_api_keys` run:

| Id | Mutation | Result |
|---|---|---|
| M1 | code claim without `used_at is null` | killed (oauth_flow) |
| M2 | refresh reuse detection off (both branches) | killed |
| M3 | `decide` not bound to the user | killed |
| M4 | loopback match ignores host | killed (oauth_core) |
| M5 | write granted without being requested | killed |
| M6 | `/mcp` scope ignores the grant | killed |
| M7 | `/mcp` skips the profile mapping | killed (mcp_server) |
| M8 | `/mcp` ignores a revoked or expired grant | killed |
| M9 | scrub reverted to `bgmcp_` only | killed |
| M10 | PKCE not verified | killed |
| M11 | CIMD host allowlist off | killed |
| M12 | 401 without `error="invalid_token"` | killed |
| M13 | token `redirect_uri` not compared | killed |
| M14 | refresh not bound to its client | killed |
| M15 | revoking a refresh token keeps the grant | killed |
| M16 | `decide` skips the account re-check | killed |
| M17 | code replay does not revoke | killed |
| M18 | `/mcp` ignores access token expiry | killed |
| M19 | `decide` grants write regardless | killed |
| M20 | confidential secret not compared | killed |
| M21 | code not bound to its client | killed |
| M22 | `resource` not checked at authorize | killed |
| M23 | token endpoint accepts an admin profile | **survived** (L3) |
| M24 | `revoke_grant` not scoped to the client | killed (client_api_keys) |
| M25 | `create_anthropic_client` not admin only | killed |

Probes (scratch, not in the repo): the concurrent refresh race (M1 finding); `validateCimdDocument` plus `redirectAllowed` plus `buildRedirect` with a `javascript:` URI (L2); `narrowScope` with the originally requested scope (L1).

Scans: secret pattern scan over the diff and the new files, 141 lines match the brief's identifier pattern (variable and column names such as `token`, `secret`, `bearer`); a literal-value scan (`bgmcp_` with 48 hex, `bgocs_` with 64 hex, `bgmat_`/`bgmrt_` with hex, `sk-`, `sk_live`, `pk_live`, `rk_live`, JWT `eyJ`, Google key and OAuth secret shapes) returns 0. No real email address in the new files. Dash scan with `rg` and a positive control: 0 in scope (I6).

Calibration facts: `git diff --stat` shows 16 tracked files changed; of those, `unlock-audit-report.js`, `db/supabase-prospect-channels-migration.sql`, `brandgeo/web/*` and `docs/growth/*` belong to other sessions and are outside this review; every stage 3 file is inside the brief's list. The most sensitive function touched is the token endpoint; its guard is client authentication in `_oauth.js:403-427` followed by the conditional claims in `oauth-token.js`. The consent server is guarded by `requireAuth` (`_auth.js`, JWT plus origin plus profile) at `oauth-authorize.js:103`. The tsc baseline before the change was not measured separately; tsc is exit 0 on the working tree.

## 6. Section 11.5 decisions

| # | Decision | Judgement |
|---|---|---|
| 1 | Refresh rotation not one transaction; claim then insert; failed insert fails closed | **Accept.** The claim is the only race-relevant step and is atomic. A failed insert leaves the user to reconnect; acceptable for a rare database error. |
| 2 | Strict reuse detection | **Accept with change (M1).** Add a 30 s no-revoke, no-issue grace; keep strict outside it. Verify with live test 4b. |
| 3 | `revoke_grant` is two statements | **Accept.** `/mcp` and the token endpoint both read the grant's `revoked_at` on every use; the token update is for the record. |
| 4 | CIMD cache: fresh used, stale refetched, failure refused; token endpoint never fetches | **Accept.** Safer than the spec's "fetch failure with a fresh cache uses the cache", which could never happen anyway because a fresh cache is not fetched. |
| 5 | CIMD URL canonical form only | **Accept.** `href === id` removes every normalisation trick. |
| 6 | Disabled client refused at authorize, token, refresh; `/mcp` lapses within the hour | **Accept.** For an emergency cut, disable the client AND revoke its grants (a one-line update by Constantin). |
| 7 | One live grant per user, OAuth client, BrandGEO client; re-consent replaces scope without revoking older tokens | **Accept, with M1 and I3.** It is what makes one stale Claude Code process able to disconnect the others; the family-scoped revocation follow-up fixes that. |
| 8 | Plan gate not at the token endpoint | **Accept.** `/mcp` gates every call; keeping refresh alive lets an upgrade restore access (but see L5 for the copy). |
| 9 | `/mcp` stamp and refresh move the grant's idle expiry | **Accept.** Matches R5. |
| 10 | No rate limit on OAuth endpoints | **Accept for release one.** No brute-force path at 192 to 256 bits; revisit on cost, and schedule the prune job (I4). |
| 11 | Key path writes `marked_by_grant: null`, with a pre-migration retry | **Accept.** Tested both ways (`mcp_server`), and the guard keeps the service-role value only on a move into done, so a browser cannot forge either marker. |
| 12 | Metadata with `Access-Control-Allow-Origin: *` | **Accept.** Public static JSON, no credentials. |
| 13 | Pruning job `mcp-oauth-prune` at 04:45 | **Accept.** Used refresh tokens survive 37 days, past their own 30-day expiry, so reuse detection is not weakened. Recommend running it with the migration. |

**Fable.** Not needed for the code as built. The four points the spec reserved for Fable were each settled by reading plus a killed mutation: code single use is one conditional `UPDATE ... RETURNING` (Postgres re-evaluates the predicate after the row lock, so two exchanges cannot both match); the consent binding is a user-scoped single claim of a stored row; redirect matching is a raw-string regex with a 26-row table; refresh races are deterministic and demonstrated by the probe. What remains open about refresh is empirical (how Claude's clients actually refresh), which only the live test answers. If the M1 grace is built, ask Fable for that one change, because it introduces a timing window into the rotation logic.

## 7. Regression surface (found by grep)

- `_oauth.js` is imported by `mcp-server.js`, `client-api-keys.js` and the three new functions only.
- `mcp-server.js` key path: the 401 header and message changed for keys too (spec 3.1). No code in `src/`, `brandgeo/web/` or the live tests reads `realm="brandgeo-mcp"` or the old message; only a stale copy under `.claude/worktrees/` does. `brandgeo/web/mcp.html` is unpublished and owned by another stage.
- `tests/helpers/fake_supabase_mem.js` is shared with `affiliate_auth`, `affiliate_flow`, `affiliate_promo_link`, `affiliate_stripe`, `client_api_keys`, `mcp_server`, `oauth_*`; the partial-unique change is additive. All named suites green; `affiliate_promo_link` was not run (not in the brief's list).
- `SocialAuthButtons.tsx` is used by `Login.tsx` and `Signup.tsx`; Signup passes no `next`, so it clears the stash. `PrivateRoute` now may redirect a signed-in user at `/` to a stashed consent path for up to 10 minutes after a Google sign-in started from consent: manual look owed.
- `AIVisibility.tsx` fix select gained a third rung; every Fix This read goes through it: manual look owed on a database before and after the migration.
- `McpAccessSection.tsx` renders the new block in all three branches (error, locked, ready).

## 8. What was not checked

- No browser, no dev server, no `npm run build` (per the brief): no rendering, real keyboard pass, screen reader, light mode, 320 px reflow, or the focus moves in practice.
- No live endpoint, no deploy, no Supabase: the migration is unapplied, so RLS, privileges, the guard and the probe section are judged from source only; real Postgres concurrency is reasoned, not run.
- Netlify's `event.path` on a 200 rewrite (L6).
- Claude's actual client behaviour: whether it sends `scope` or `resource` on refresh, whether it single-flights refreshes, the real URL and `redirect_uris` of claude.ai's custom connector CIMD document (only Claude Code's URL is named in the docs).
- Reachability from Anthropic's egress range `160.79.104.0/21`.
- Copy deck section 5 onward (`mcp.html`, privacy, listing text): other stages.
- `affiliate_promo_link.test.js` and the rest of `tests/` beyond the brief's list.
- The tsc baseline before the change (only the current exit 0).
- `docs/arch/mcp-stage3-oauth.md` diff itself was read for sections 0 to 11 but not reviewed as an artifact.

## 9. Routing

- M1 and L1 to bg-backend (Opus) once Constantin rules on M1; add live tests 4b and the read-only refresh to section 8 of the spec (bg-architect).
- L2 and L3 to bg-backend (Opus); the SPA half of L2 to bg-app; add L2 to the R4 widening checklist (bg-architect).
- L4 to bg-app; L5 to bg-copy then bg-app.
- L6 to bg-backend (two `netlify.toml` targets and the two path readers), or accept and rely on test plan items 1 and 5.
- None blocks applying the migration or the push; M1 should be decided before the directory submission.

---

## Amendment: fix re-check (Fable)

- **Reviewer:** bg-verify on Fable, static plus scratch reproduction, read only. Nothing reviewed was edited; no git, deploy, SQL, build or browser. The only file written is this one.
- **Date:** 2026-11-06, after the fix round for M1 and L1 to L6.
- **Read:** `oauth-token.js` (whole), `_oauth.js` (whole), `mcp-server.js:1040-1140` and `:1195-1275`, `oauth-authorize.js:88-140` and `:195-215`, `oauth-metadata.js`, `oauth-prm.js`, `oauth-as-metadata.js`, `oauth-revoke.js`, `netlify.toml:77-125` and `:424-427`, `OAuthAuthorize.tsx:90-215` and `:270-295`, `mcpOauthCopy.ts:40-145`, `McpAccessSection.tsx:348`, `tests/oauth_core.test.js` sections 3 and 4, `tests/oauth_flow.test.js` sections 10 to 12, `tests/helpers/fake_supabase_mem.js:125-230`, spec 4.3 and 11.5, copy deck section 1.2, and Claude's authentication and lazy-authentication pages plus the live Claude Code CIMD document, all re-read today.

**Counts after this pass:** 0 BLOCKER, 0 MAJOR, 0 MEDIUM, 2 LOW (N1, N2), 2 INFO (N3, N4). M1 and L1 to L6 are CLOSED.

### A1. Per finding

**M1. CLOSED, with N1 and N2 below.**
- Where: `oauth-token.js:163` (`REFRESH_REUSE_GRACE_MS = 30_000`), `:178-189` (a presented token whose `used_at` is under 30 s old throws `invalid_grant` before any revoke or insert; older reuse calls `revokeGrant` then throws), `:199-207` (the lost claim race throws without revoking).
- Test: `oauth_flow` section 10. RT4 presented 10 s after its rotation answers 400 `invalid_grant`, the grant's `revoked_at` stays null and RT5 (the winner's token) still refreshes; RT3 presented 41 s after its rotation revokes the grant and its access token AT3 answers `/mcp` 401 `invalid_token`.
- Mutation MA (window set to 0, the strict behaviour): killed, `FAILED: a duplicate inside the grace window does not revoke`, `revoked_at` carried a timestamp where null was expected.
- The threat walk and the interleaving check are in A2 and A3.

**L1. CLOSED.**
- Where: `_oauth.js:165-174`. Words the current token never held are dropped, `mcp:read` is always kept, `invalid_scope` only for a non-string. "Never widen" still holds: `want` is filtered through `have`, so a word the grant never carried cannot come back.
- Tests: `oauth_core` lines 89 to 94 (the originally requested scope on a read-only grant narrows to `mcp:read offline_access`; an unknown word is dropped; `42` is `invalid_scope`), `oauth_flow` section 10 (a refresh sending `mcp:read mcp:write offline_access` on a read-only grant answers 200 with `mcp:read offline_access` and a new refresh token).
- Mutation MD (the old refusal restored): killed in both suites, `oauth_core` got `{ error: 'invalid_scope' }` where a scope was expected, `oauth_flow` got 400 where 200 was expected.
- Note, not new: `scope=` sent empty narrows to `mcp:read` and ends the refresh chain. The same was true before this change and RFC 6749 does not define an empty value.

**L2. CLOSED.**
- Server: `_oauth.js:198-205` `isSafeRedirectForm` (loopback form, or https with no userinfo, on the client host when one is given); `:213-221` `redirectAllowed` refuses any requested URI that fails it before the list is consulted; `:349-352` `validateCimdDocument` keeps only safe URIs on the `client_id` host and refuses a document with none; the cache row stores the kept list only (`:365`, `:370`).
- SPA: `OAuthAuthorize.tsx:100-112` `goToClient` navigates only to https without userinfo, or http on `localhost` or `127.0.0.1` with path exactly `/callback`; anything else throws into the existing catch, which renders the generic error (`:166-170` for check, `:209-213` for decide). The server-built loopback redirect carries `?code=...&state=...`, which the parsed `pathname` check still admits.
- Tests: `oauth_core` lines 96 to 103 (the hosted callback on `claude.ai` and the two loopback forms admitted; `javascript:`, a `javascript://claude.ai/%0a...` form, `data:`, plain http on `claude.ai`, a foreign https host, userinfo and a wrong loopback path refused; `javascript:` refused even when it is the registered value).
- Mutation MC (any string a safe form): killed, `FAILED: javascript:alert(1)// true !== false`.
- Live check, from the repo's own validators with the Claude Code document as served today at `https://claude.ai/oauth/claude-code-client-metadata` (`redirect_uris` exactly `http://localhost/callback` and `http://127.0.0.1/callback`, `token_endpoint_auth_method` `none`, `grant_types` with `refresh_token`, `client_uri` `https://claude.ai`): the document validates and keeps both URIs; `http://localhost:3118/callback`, `http://127.0.0.1:61234/callback` and `http://localhost/callback` are allowed; `http://[::1]:3118/callback` is not (spec 4.1 never admitted it and Claude Code does not declare it); `https://claude.ai/api/mcp/auth_callback` is refused against Claude Code's list, which is right. The confidential client admits exactly `https://claude.ai/api/mcp/auth_callback` and refuses a loopback. A hypothetical claude.ai-hosted CIMD listing the hosted callback, a foreign https host and a `javascript:` URI keeps only the hosted callback; a document listing a foreign host alone is refused `invalid_client` ("no usable redirect_uris"). The hosted apps' own CIMD URL is not published on Claude's pages, so that document itself is still unread (section 8 stands).
- Two notes, neither a finding: the SPA pins scheme only, not host, and that is the defense in depth the fix asked for (the server's registered list is the authority); an `oauth_clients` row cached before this change would keep its unfiltered list for up to 24 h, moot because the migration is unapplied and no row exists.

**L3. CLOSED.**
- Where: `mcp-server.js:1115` refuses `role === 'admin'` on every call, the same rule as `oauth-token.js:85`; `:1133` `actorIsAdmin` is `false` for an OAuth credential, so the research gate at `:1268-1270` answers -32003 to every OAuth caller.
- Test: `oauth_flow` section 12, the grant's profile flipped to `admin` answers 401 with `WWW-Authenticate` carrying `error="invalid_token"`, flipped back answers 200. `mcp_server` section 17 (line 1197) keeps the research refusal.
- Mutation MB (admin accepted on `/mcp`): killed, `FAILED: an admin profile is refused on /mcp`, `200 !== 401`. `mcp_server` stayed green under MB, which matches the review: that suite never promoted a user; `oauth_flow` now carries the case.
- Regression: a research client cannot be read over OAuth at all, which is what R6 and section 4.4 intend; an admin keeps the key path with an admin-created key.

**L4. CLOSED.**
- `mcpOauthCopy.ts:58-62`: the `unknown_client` body now equals copy deck section 1.2 `error.unknown_client` (deck line 56) word for word, support sentence included. The address renders as plain text inside the body; the mailto link pattern of the generic error (`OAuthAuthorize.tsx:281-289`, rendered only when `isOurSide`) was the review's suggestion, not the deck's requirement (N4, INFO).

**L5. CLOSED.**
- `mcpOauthCopy.ts:141` `partialNote` now reads: "Apps connected before your plan changed are listed below. They cannot reach your data while your plan is below Radar, and after upgrading an app may need to connect again. You can disconnect them at any time." Both claims trace: the gate is `mcpAllowedFor(client.plan)` against `MCP_MIN_PLAN = 'radar'` (`_plans.js:116`, `mcp-server.js:1263-1267`); a reconnect is needed once the 30-day refresh lifetime (`_oauth.js:43`, R5) has passed without a refresh. Rendered at `McpAccessSection.tsx:348`. No dash, no banned word. The deck has no `apps.partial_note` row, so the string stays bg-app's own, as section 3 recorded.

**L6. CLOSED.**
- `oauth-prm.js`, `oauth-as-metadata.js` and `oauth-revoke.js` each set the canonical path on the event before delegating to `oauth-metadata.handle` or `oauth-token.handle`; `netlify.toml:93-121` points the five routes at four functions, all above the `/*` fallback at `:123`. `oauth-token.js:75-79` yields `token` for any path that does not end in `/revoke`, so the token route no longer depends on what Netlify reports after a rewrite.
- Probe from the repo, no database (the 415 content-type check at `oauth-token.js:250-254` runs before the Supabase client is built): `oauth-prm` 200 with `resource` `https://app.getbrandgeo.com/mcp`; `oauth-as-metadata` 200 with `issuer` `https://app.getbrandgeo.com` and `client_id_metadata_document_supported: true`; `oauth-metadata` called directly 404 (by design, nothing routes to it now); `oauth-revoke` logs `revoke outcome=415`; `oauth-token` logs `token outcome=415`; `endpointFor` of `/oauth/token`, `/.netlify/functions/oauth-token` and `/oauth/revoke` is `token`, `token`, `revoke`.
- No suite requires the three wrapper files (grep of `tests/` for their names is empty); they are one line of logic each and the probe above stands in. Test plan items 1 and 5 still confirm the live rewrites after the deploy.

### A2. Threat walk for the grace window (question 1)

Notation: RT0 is a live refresh token, T the moment it is first claimed, x the delay of the second presentation. "Detected" means the grant is revoked and the user sees the disconnect.

- **(a) Attacker uses a stolen RT0 first, the legitimate client presents it x later.** x under 30 s: the legitimate client gets `invalid_grant`, nothing is revoked, the attacker keeps AT1 and RT1 and the whole chain after them. Not detected. The user sees a disconnect in Claude and reconnects; by decision 7 the re-consent reuses the live grant and does not revoke its older tokens, so the attacker's chain survives until Disconnect or a later collision. x at or above 30 s: strict path, the whole grant is revoked, the attacker is cut off, detected, the user reconnects. The grace therefore costs a one-shot 30 s evasion window per stolen token (RT0 is spent by the attacker's own refresh, a second attacker presentation gains nothing). An attacker who does not know when the legitimate client refreshes has about 30 s in 3600 s; one who stole the whole token response knows `expires_in` and can aim at the proactive window Claude describes ("up to five minutes before the stored expiry"), but the exact moment is not published, so it stays a probability, not a procedure. Strict mode detected this case every time; that is what the grace trades away, knowingly (section 6, decision 2).
- **(b) The legitimate client rotates first, the attacker presents RT0 x later.** x under 30 s: `invalid_grant`, no tokens, no revoke, the legitimate client is unaffected. Not detected and not logged distinctly (N1). x at or above 30 s: grant revoked, both lose, detected. Either way the attacker never holds a working token.
- **(c) After 30 s.** Strict in both directions, as before this change.
- **(d) Two Claude Code processes sharing one credential store (one grant, one token).** A rotates at T. B presents RT0 at x. x under 30 s (both proactively refreshing the same access token near its expiry): B gets `invalid_grant`, the grant lives, A's new pair works; whether B then re-reads the store and picks up RT1 is Claude Code's behaviour, unknown. x at or above 30 s (B idle, refreshing reactively an hour later with the RT0 it still holds): strict revoke, every install of that user on that CIMD client disconnects. So (d) is narrowed to the simultaneous case, not closed. The family-scoped follow-up of M1 would not help here either, since both processes present the same token; only "reissue within grace" (ruled out in M1) or Claude Code re-reading its store would. Live test 4b still decides.
- **(e) A proactive and a reactive refresh from one client at once, same RT0.** One claims; the other either reads `used_at` set (grace, no revoke) or loses the conditional claim (`:202-207`, no revoke). Exactly one pair is issued and the winner's tokens work. Reuse is not flagged, which is right. Whether Claude's UI treats the loser's `invalid_grant` as a disconnect, or picks up the winner's stored tokens, is empirical.

**Is 30 s reasonable.** For two presentations at the same moment, yes, and it sits inside Claude's own 30 s refresh timeout. It does not cover the lost-response retry M1 named (N2). **Better without a schema change:** raising the window (60 or 90 s) covers an immediate retry after Claude's timeout with margin, at the cost of a proportionally larger one-shot evasion window in case (a); nothing else is available. Revoking only the reused token's descendants is possible in principle without a new column, because `rotated_from` already links each pair to the token it replaced, but a chain refreshed hourly for 30 days is up to about 720 rows deep and the walk is one read per level, which does not fit a 10 s function; a `family_id` column (additive) remains the right shape for the follow-up packet, and even that does not change (d), where both processes share the family.

**The lost-race branch outside the window.** Not reachable. It runs only when the token row read at `:169` had `used_at` null and the claim at `:199` then matched nothing. Between the two sit three reads inside one invocation, bounded by the function's default 10 s timeout (`netlify.toml:424-427` keeps the default), so any competing `used_at` is under 30 s old. The only other way the claim misses is `revoked_at` set meanwhile (Disconnect, the revoke endpoint, or a reuse revoke on a sibling), where not revoking again is right. The "by construction" comment holds while that timeout stays under 30 s (N3).

### A3. Interleavings (question 2)

Order in `refresh()`: read the token row `:169`, read its grant `:173`, client match `:176`, the `used_at` branch `:178-189`, liveness `:190`, user mapping `:193`, scope `:195-197`, claim `:199-201`, lost-race `:202-207`, insert `:209-211`, grant bump `:212`.

- **The grace path cannot issue tokens.** Both the `used_at` branch and the lost-race branch throw before the insert; the only insert follows a claim that returned exactly one row.
- **A token cannot be claimed twice.** The claim is one conditional `UPDATE ... RETURNING` on `id`, `used_at is null`, `revoked_at is null`. Under PostgREST each request is its own transaction at READ COMMITTED, so of two concurrent presentations the second blocks on the row lock and re-evaluates the predicate after the first commits, matching nothing. Reasoned, not run (section 8); the fake (`fake_supabase_mem.js:219-227`) filters then assigns sequentially, which models the outcome but not the race.
- **A live chain is never revoked wrongly inside the window.** Inside, nothing revokes. Outside, the strict rule applies, which is the intended behaviour and the residual of (d).
- **A foreign client cannot spend or revoke the token.** `:176` throws before the `used_at` branch; `oauth_flow` section 10 asserts the token's `used_at` stays null after a foreign presentation.
- **Clocks.** `used_at` is the claiming invocation's clock; skew between two Netlify invocations is sub-second and a skew that puts `used_at` in the future falls on the grace side. A `used_at` that does not parse takes the strict path (`NaN < 30000` is false).
- **Consent during a refresh.** `upsertGrant` only replaces the grant's scope; the refresh mints from the token's scope intersected with the grant's (`:195`), and `/mcp` recomputes the effective scope on every call, so no stale widening is possible.

### A4. New findings

- **N1, LOW. The grace path has no distinct log line.** `oauth-token.js:184` and `:206` throw the same `invalid_grant` as the strict path, and `fail()` (`:243-247`) logs `outcome=invalid_grant` for all three; only the strict path adds the `refresh token reused` warning (`:187`). M1 asked for `outcome=refresh_reuse_grace`. Consequence: live test 4b cannot count grace hits, and a stolen-token collision inside the window (cases a and b) leaves no trace to review. Fix (bg-backend, Sonnet): one `console.warn` before each of the two throws, carrying the BrandGEO client id only, as the strict line does; assert it in `oauth_flow` section 14's log sweep. Two lines, no behaviour change.
- **N2, LOW. The window equals Claude's refresh timeout with no margin, so the lost-response retry M1 named is not covered.** Claude's page: refresh requests get up to 30 s, after which Claude "treats the flow as a failure, even if your server eventually completes the request". A retry can only follow that timeout, so it reaches the server at least 30 s minus the server's processing time after `used_at`: outside the window unless the retry is instantaneous, and a retry at the next proactive or reactive refresh is minutes later and revokes every install. What the window covers is two presentations within 30 s of each other (d simultaneous, e). Options, a ruling for Constantin: keep 30 s and record that the retry case is not covered, or 60 s, which covers an immediate retry after the timeout and widens case (a)'s one-shot window from 30 to 60 s of 3600. Either is defensible; no code is wrong.
- **N3, INFO.** The lost-race comment "inside the grace window by construction" (`oauth-token.js:203-205`) rests on the `oauth-token` function keeping a timeout under 30 s. A future `[functions."oauth-token"]` entry at or above 30 s would void it. One sentence in that comment or in spec 11.5 item 2 (bg-architect).
- **N4, INFO.** The restored support sentence in `unknown_client` is plain text, not the mailto link the generic error renders. Deck met; optional polish (bg-app).

### A5. Acceptance table rows touched

| # | Was | Now | Why |
|---|---|---|---|
| 2 | PASS WITH M1, L1 | PASS (N1, N2) | grace built and tested both sides of the window; narrowing drops instead of refusing |
| 3 | PASS (L2 latent) | PASS | scheme and host checks on the server, scheme check in the SPA, tests and live document |
| 7 | PASS (L3) | PASS | admin refused on every `/mcp` call, `actorIsAdmin` false for OAuth |
| 9 | PASS (L6) | PASS | one entry function per route, token route path-independent |
| 11 | PASS (L4, L5, I9) | PASS (I9, N4) | deck string restored, partial note true as written; I9 untouched by this round |

### A6. Reproduced

Run in `brandgeo-dashboard` on the working tree, exit codes captured:

```
node tests/oauth_core.test.js        exit=0   22 passed
node tests/oauth_flow.test.js        exit=0   35 passed   (32 before the fix round)
node tests/mcp_server.test.js        exit=0   83 passed
node tests/client_api_keys.test.js   exit=0   26 passed
npx tsc --noEmit -p tsconfig.json    exit=0
```

Scratch harness (my scratchpad, never the repo): `netlify/`, `src/` and `tests/` copied out, `NODE_PATH` pointed at the repo's `node_modules`. The unmutated copy passes 22, 35, 83, so a failure below is the mutation's.

| Id | Old behaviour restored | Suite | Result |
|---|---|---|---|
| MA | `REFRESH_REUSE_GRACE_MS = 0` (strict revoke inside 30 s) | oauth_flow | killed: `a duplicate inside the grace window does not revoke`, `revoked_at` set where null expected |
| MB | `/mcp` accepts an admin profile on the OAuth path | oauth_flow, mcp_server | killed by oauth_flow: `an admin profile is refused on /mcp`, `200 !== 401`; mcp_server green (no promotion case there) |
| MC | `isSafeRedirectForm` true for any string (`javascript:` accepted) | oauth_core, oauth_flow | killed by oauth_core: `javascript:alert(1)// true !== false`; oauth_flow green (no unsafe form in its fixtures) |
| MD | a refresh scope word never held is `invalid_scope` | oauth_core, oauth_flow | killed by both: `{ error: 'invalid_scope' }` where a scope was expected; `400 !== 200` |

Repo untouched after the harness: md5 of `_oauth.js`, `oauth-token.js` and `mcp-server.js` equal between the repo and the scratch base; `git status` on the three reports the same state as before this pass (two untracked, one modified by the builder).

Scans: `rg "[\x{2013}\x{2014}]"` over the twelve in-scope files (`_oauth.js`, `oauth-token.js`, the three wrappers, `oauth-metadata.js`, `mcp-server.js`, `OAuthAuthorize.tsx`, `mcpOauthCopy.ts`, `netlify.toml`, the two OAuth suites) hits only pre-existing `netlify.toml` comments outside the stage 3 block (lines 19 to 370, none between 85 and 121 or 424 and 427); the positive control fired. Secret scan, counts only: 142 identifier-pattern lines in the tracked dashboard diff and 134 in the five new function files (names such as `token`, `secret`, `bearer`); literal value shapes (`bgmcp_`, `bgocs_`, `bgmat_`, `bgmrt_` with their hex, `sk-`, `sk_live`, `pk_live`, `rk_live`, JWT) 0.

### A7. Regression surface of this round (by grep)

- `narrowScope`: `oauth-token.js:196` only. `redirectAllowed`: `oauth-authorize.js:98` only. `isSafeRedirectForm`: inside `_oauth.js` only. `validateCimdDocument`: `fetchCimd` only. `buildRedirect`: `oauth-authorize.js:135`, `:201`, `:211` (the affiliate `buildRedirectUrl` is a different function). `actorIsAdmin`: consumed at `mcp-server.js:1269` only. `endpointFor`, `documentFor`: their own files and the wrappers. `REFRESH_REUSE_GRACE_MS`: `oauth-token.js:183` only. Nothing in `src/` imports `_oauth.js`.
- Manual look owed: none new; the two from section 7 (PrivateRoute stash, AIVisibility select rungs) stand.

### A8. Not checked in this pass

- Netlify's live rewrites and the three wrappers after deploy (test plan items 1 and 5).
- Real Postgres concurrency on the claim; reasoned from READ COMMITTED, the fake is sequential.
- Claude's client behaviour: single-flight, `scope` on refresh, what happens after a timed-out refresh, whether Claude Code re-reads its credential store after `invalid_grant`; the hosted apps' CIMD URL and document (not published).
- No browser, no light mode, no keyboard pass, no `npm run build` (per the brief).
- The copy deck beyond the two rows compared; the spec diff as an artifact.
- Anything outside the files the brief listed; other sessions' dirty files were neither read nor touched.

### A9. Routing

- N1 to bg-backend (Sonnet, two log lines plus one assertion). N2 to Constantin (keep 30 s or move to 60 s). N3 to bg-architect (one sentence). N4 optional, bg-app.
- Still owed before the directory submission: live test 4b and the read-only refresh (section 8 of the spec), unchanged.

**Updated verdict: PASS WITH FINDINGS.** 0 blocker, 0 major, 0 medium, 2 low, 2 info. M1 and L1 to L6 CLOSED. Nothing blocks applying the migration or the push.

## Fixes after the Fable re-check, and the migration read-back (orchestrator seat, 2026-11-06)

- **N1 CLOSED.** `oauth-token.js` logs `refresh_reuse_grace for client <id>` on both grace refusals (the reused token and the lost race); `oauth_flow` section 10 asserts the line. 35 checks.
- **N3 CLOSED.** The lost-race comment now states that it holds while the function timeout stays under 30 s.
- **N2 open as a ruling for Constantin**, default kept at 30 s and to be judged by live test 4b. **N4** (plain text support address) left as is; the deck is met.

**Migration `db/supabase-mcp-oauth-2026-11-06.sql` applied by Constantin and read back:**
- RLS is on for all four `oauth_` tables.
- Exactly one policy exists: `oauth_grants_select`, SELECT for authenticated, `is_admin() OR client_id = get_my_client_id()`.
- Authenticated may SELECT ten named `oauth_grants` columns and nothing else. `user_id`, tokens, codes and clients are not readable, and there is no insert or update.
- `oauth_grants_one_live` is the partial unique index described in the spec.
- `fix_states.marked_by_grant` is a nullable uuid with a FK to `oauth_grants(id)` and no ON DELETE clause.
- The guard is amended, SECURITY DEFINER, with an empty `search_path`, and not executable by authenticated. Its trigger is enabled.
- Counts: 13 fix rows, none with `marked_by_grant`; 0 rows in each `oauth_` table; 16 events. The pruning cron is not scheduled (R9, his go).

**Rolled-back probe (client 2 and its viewer, foreign grant on client 1), all passed:**
- a) the viewer sees only its own client's grant;
- b) every privilege check is false: tokens, codes, clients, `user_id`, insert, update, delete;
- c) a viewer cannot set `marked_by_grant` on insert, by an in-place edit, or on a fresh move to done, and the mark stays the viewer's;
- d) the service path keeps the grant and leaves no user;
- e) the grant is pinned on a later in-place edit;
- f) a second live grant is refused;
- g) a grant referenced by a fix mark cannot be deleted (NO ACTION).

Every table read back at the same counts afterwards.
