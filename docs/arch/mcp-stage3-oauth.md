# MCP stage 3: OAuth sign-in and the Claude connector directory

**Status:** RULED 2026-11-06, Constantin: "Defaults, build it". Every
default in section 9 applies. Build in progress (section 10 steps 1 to 5).
**Date:** 2026-11-06.
**Asked by Constantin, verbatim:** "now next stage is to have the MCP listed in
claude connectors first, can we do that?", then "Yes, spec it there".
**Builds on:** `docs/arch/mcp-access.md` (stage 1: the server, the
`bgmcp_` key, the plan gate, the limits) and `docs/arch/mcp-stage2-fixes.md`
(stage 2: the key `scope`, `list_fixes`, `mark_fix_done`, LIVE as `7d9c859`).

## 0. Sources, read 2026-11-06

| What | Where | What it settles |
|---|---|---|
| Claude connector authentication | https://claude.com/docs/connectors/building/authentication.md | The OAuth client Claude runs, quoted in section 1 |
| Claude directory submission | https://claude.com/docs/connectors/building/submission | The portal steps and listing fields, section 7 |
| Supabase OAuth 2.1 server | https://supabase.com/docs/guides/auth/oauth-server and its pages getting-started, oauth-flows, mcp-authentication, token-security | The option rejected in section 2 |
| Our live server | `POST https://app.getbrandgeo.com/mcp` with no token | 401 with `WWW-Authenticate: Bearer realm="brandgeo-mcp"`, no `resource_metadata` |
| Our live well-known path | `GET https://app.getbrandgeo.com/.well-known/oauth-protected-resource` | 200 `text/html`: the SPA fallback, not metadata |

Every requirement in section 1 is taken from the Anthropic page, not from
memory. Re-read it before the build starts; it changes.

## 1. What Claude's OAuth client requires

1. **A 401 starts sign-in.** Unauthenticated calls answer 401 with
   `WWW-Authenticate: Bearer resource_metadata="<https url>"`. Claude ignores
   the header on a 200. The URL may be any HTTPS location.
2. **Protected resource metadata (RFC 9728).** `resource` equals the URL the
   user types, exactly: `https://app.getbrandgeo.com/mcp`. Claude uses only the
   first `authorization_servers` entry.
3. **Authorization server metadata (RFC 8414 or OIDC)** at the issuer's
   `/.well-known/` path, reachable from Anthropic's egress range
   `160.79.104.0/21`, with `code_challenge_methods_supported: ["S256"]`. PKCE
   S256 is sent on every request.
4. **Client identity, one of:**
   - CIMD: Claude uses it only when the metadata advertises
     `"client_id_metadata_document_supported": true` AND `"none"` in
     `token_endpoint_auth_methods_supported`. Claude Code's document is
     `https://claude.ai/oauth/claude-code-client-metadata`.
   - DCR: a `registration_endpoint`. Claude registers a new client on every
     fresh connection, so the page says to prefer CIMD or Anthropic-held
     credentials for directory traffic.
   - Anthropic-held client credentials (`oauth_anthropic_creds`): we create a
     confidential client with redirect `https://claude.ai/api/mcp/auth_callback`
     and enter its id and secret in the portal. Used by claude.ai web,
     Desktop, mobile and Cowork. Claude Code does not use it; it uses its own
     CIMD with a loopback redirect.
5. **Redirects.** Exactly `https://claude.ai/api/mcp/auth_callback`, plus
   `http://localhost/callback` and `http://127.0.0.1/callback` matched with
   the port ignored (Claude Code picks a port per session).
6. **Token endpoint.** Accepts `application/x-www-form-urlencoded`. A dead
   refresh token answers `invalid_grant`. Refresh tokens rotate for public
   clients, the new one returned in the same response that kills the old.
   Claude refreshes on a 401 and up to five minutes before expiry.
7. **Latency.** Discovery, registration and token answer within 10 s;
   refresh within 30 s.
8. **Scopes.** Claude requests the `scope` in the 401 header if present, else
   the PRM `scopes_supported`, and appends `offline_access` when the AS
   metadata lists it (to get a refresh token).
9. **Consent screen** shows the redirect URI's hostname, with an extra
   warning when the redirect is a loopback address.
10. **No `client_credentials` grant.** Every token belongs to a user who
    consented.
11. Static header auth exists only as a beta for organization Owners, so a
    pasted `bgmcp_` key is not a path for claude.ai users. OAuth is required
    for the directory ("use OAuth 2.0 for authenticated services").

## 2. Decision 1: who is the authorization server

**Ruled here, open to Constantin's override (ruling R1): a small
authorization server of our own, in Netlify functions, with the SPA's
existing Supabase login as the sign-in step.** Supabase Auth's OAuth 2.1
server was checked at the source and is rejected for now.

### 2.1 Supabase Auth OAuth 2.1 server: what is true

- It exists. "OAuth 2.1 server is currently in beta and free to use during
  the beta period on all Supabase plans."
- Authorization code with mandatory PKCE S256, refresh tokens, DCR
  (`allow_dynamic_registration`), OIDC discovery, a consent UI we build at
  Site URL plus an "Authorization Path", and `getUserGrants()` /
  `revokeGrant(clientId)` for a revoke screen. All of that fits.
- **No CIMD.** The docs list DCR only; a community thread asks for CIMD with
  no answer. Claude Code would fall back to DCR.
- **Redirect URIs match exactly**: "do NOT support wildcards, patterns, or
  partial URLs". A port-agnostic loopback match is not offered; it only works
  if every Claude Code session registers itself afresh through DCR.
- **Scopes are the standard four** (`openid email profile phone`). The
  token-security page says scopes do not control "access to your database
  tables or API endpoints". A read versus read-and-write split would need a
  custom access token hook.
- **The access token is an ordinary Supabase user JWT**: `role:
  authenticated`, `aud: authenticated`, the user's `sub`, plus a `client_id`
  claim. Existing RLS "continues to work" on it.

### 2.2 Why that rules it out today

The last point decides it. A token Supabase issues to Claude is a full
dashboard session for that user against PostgREST, not a credential for
`/mcp`. With our anon key (public, in the SPA bundle) anyone holding it can
read every table the user can read and write what RLS lets the user write
(`fix_states`, `prompts` and more), whatever the consent screen said.
Closing that means a RESTRICTIVE policy on every table excluding
`auth.jwt() ->> 'client_id' is not null`, kept complete forever, or a custom
access token hook (a new SECURITY DEFINER function on the login path of
every user) that rewrites `aud`, then confirming PostgREST rejects that
`aud`. Either is more security surface than the whole own server below, and
one missed table is a data leak through a connector we advertised. Add the
beta label, no CIMD, and exact-match loopback redirects, and it is the wrong
base for a public listing.

**Revisit trigger:** Supabase ships CIMD and a token audience that PostgREST
refuses, out of beta. Then a migration is a swap of the AS behind the same
PRM, invisible to users except one re-consent.

### 2.3 What our own server gives

- **Tokens that only open `/mcp`.** Opaque random strings, stored as sha256
  like `bgmcp_` keys. Useless against PostgREST.
- **Scopes that are our scopes**, mapped onto the stage 2 key `scope`.
- **CIMD plus port-agnostic loopback**, so Claude Code works without DCR.
- **Anthropic-held credentials** for claude.ai, so directory traffic never
  registers clients.
- **Sign-in reuses the SPA's Supabase login** (email, Google): the consent
  page is an SPA route; the user is the logged-in user, nothing new to
  remember.
- Cost: we own PKCE checks, single-use codes, refresh rotation with reuse
  detection, redirect validation and a CIMD fetch with SSRF guards. That is
  why the build runs on Opus with bg-verify, and why section 10 names the
  points where Fable may be asked for.

## 3. Endpoints and metadata

All on `https://app.getbrandgeo.com`. Netlify `[[redirects]]` with `force =
true` and status 200 go ABOVE the `/*` SPA fallback, next to the `/mcp` rule.

| Path | Served by | Notes |
|---|---|---|
| `/mcp` | `mcp-server.js` | Unchanged route |
| `/.well-known/oauth-protected-resource/mcp` | new `oauth-metadata.js` | RFC 9728, path-suffixed form, the one the 401 points at |
| `/.well-known/oauth-protected-resource` | `oauth-metadata.js` | Same document; Claude's fallback probe |
| `/.well-known/oauth-authorization-server` | `oauth-metadata.js` | RFC 8414 |
| `/oauth/authorize` | SPA route `OAuthAuthorize.tsx` | Not a redirect; falls through `/*` |
| `/oauth/token` | new `oauth-token.js` | form-urlencoded only |
| `/oauth/revoke` | `oauth-token.js` (path switch) | RFC 7009, always 200 |
| `/oauth/register` | none in release one | DCR off (ruling R3) |

The SPA route needs a server half: `oauth-authorize.js`, called by the page
with the user's Supabase JWT (actions `check` and `decide`, section 4.2).

### 3.1 The 401

`mcp-server.js` `unauthorized()` changes its header, for both credential
types, to:

```
WWW-Authenticate: Bearer resource_metadata="https://app.getbrandgeo.com/.well-known/oauth-protected-resource/mcp", scope="mcp:read mcp:write"
```

An expired or revoked OAuth access token gets the same 401 plus
`error="invalid_token"`, which makes Claude refresh. The JSON-RPC body stays
`-32001`; the message becomes "Invalid or missing BrandGEO credentials." (the
word "API key" misleads an OAuth user). `bgmcp_` clients ignore the header.

### 3.2 Protected resource metadata

```json
{
  "resource": "https://app.getbrandgeo.com/mcp",
  "authorization_servers": ["https://app.getbrandgeo.com"],
  "scopes_supported": ["mcp:read", "mcp:write"],
  "bearer_methods_supported": ["header"],
  "resource_name": "BrandGEO",
  "resource_documentation": "https://getbrandgeo.com/mcp.html"
}
```

`Content-Type: application/json`, `Cache-Control: public, max-age=3600`.

### 3.3 Authorization server metadata

```json
{
  "issuer": "https://app.getbrandgeo.com",
  "authorization_endpoint": "https://app.getbrandgeo.com/oauth/authorize",
  "token_endpoint": "https://app.getbrandgeo.com/oauth/token",
  "revocation_endpoint": "https://app.getbrandgeo.com/oauth/revoke",
  "response_types_supported": ["code"],
  "grant_types_supported": ["authorization_code", "refresh_token"],
  "code_challenge_methods_supported": ["S256"],
  "token_endpoint_auth_methods_supported": ["none", "client_secret_basic", "client_secret_post"],
  "client_id_metadata_document_supported": true,
  "scopes_supported": ["mcp:read", "mcp:write", "offline_access"],
  "service_documentation": "https://getbrandgeo.com/mcp.html"
}
```

`none` is for CIMD public clients (Claude Code, and claude.ai custom
connectors before the listing). The two secret methods are for the
Anthropic-held confidential client. No `registration_endpoint` (R3).

## 4. The flow

### 4.1 Clients we accept

| Kind | `client_id` | Auth at token | Redirects accepted |
|---|---|---|---|
| Confidential (Anthropic-held) | random id we mint, row in `oauth_clients` | secret, sha256 compared in constant time | exactly `https://claude.ai/api/mcp/auth_callback` |
| CIMD | an https URL | `none` | the document's `redirect_uris`, with loopback entries matched port-agnostically (below) |

**CIMD fetch rules** (bg-backend, reviewed as SSRF surface):
- `client_id` must be `https`, no userinfo, no fragment, port 443 only,
  length at most 512.
- **Allowlist in release one (ruling R4):** the host must be `claude.ai`.
  This admits Claude Code and claude.ai custom connectors and refuses every
  other client until R4 widens it. When widened: resolve DNS first and refuse
  private, loopback, link-local and metadata addresses; no redirects
  followed; 3 s timeout; 8 KB cap.
- The document's `client_id` must equal the URL. `client_name` is shown on
  consent, clipped to 60 characters and rendered as text.
- Cached in `oauth_clients` (kind `cimd`) for 24 h; a fetch failure with a
  fresh cache uses the cache.

**Loopback match:** a requested `redirect_uri` of scheme `http`, host
`localhost` or `127.0.0.1`, any port, path exactly `/callback`, no query or
fragment, is accepted when the document lists the same scheme, host and path
with or without a port. Any other redirect matches byte for byte. The match
is computed twice, at `check` and again at `decide`, from the stored request,
never from the browser's copy.

### 4.2 Authorize (`/oauth/authorize`, SPA plus `oauth-authorize.js`)

1. The page reads `response_type`, `client_id`, `redirect_uri`, `scope`,
   `state`, `code_challenge`, `code_challenge_method`, `resource`.
2. No Supabase session: send to `/login?next=<this full URL>`; the login page
   honours `next` only when it starts with `/oauth/authorize?` (no open
   redirect).
3. `POST oauth-authorize {action:'check', ...params}` with the user's JWT.
   The function checks, in order, and on any failure BEFORE the redirect is
   proven answers an error the page shows itself (never redirects):
   client known or CIMD resolvable; redirect allowed for that client. After
   the redirect is proven, failures go back to it as `error=...&state=...`:
   `response_type=code`; `code_challenge_method=S256` and a 43 to 128
   character challenge; `resource` absent or exactly
   `https://app.getbrandgeo.com/mcp` (else `invalid_target`); `scope` a
   subset of `mcp:read mcp:write offline_access` (unknown scopes dropped,
   empty means `mcp:read`).
4. The account check: `user_profiles` row with a `client_id` (admin logins
   with no client are refused with a page message, ruling R6); that client's
   plan passes `mcpAllowedFor()` (else the page says MCP needs Radar or
   above, with the plans link; no code). Research clients refused as in
   stage 1 section 4.4.
5. `check` returns what consent shows and a short-lived `request_id` (the
   validated parameters stored server side in `oauth_codes` as a pending row,
   5 minutes).
6. **Consent screen**, copy by bg-copy, layout by bg-design. It shows: the
   client name; "will be sent back to <redirect host>" (and for loopback:
   "an app on this computer", with the warning the MCP spec recommends); the
   BrandGEO brand being connected; what read access means (the eight read
   tools in plain words); a checkbox "Also let it mark Fix This items done",
   shown only when `mcp:write` was requested and unticked by default (ruling
   R2); Allow and Cancel.
7. `POST oauth-authorize {action:'decide', request_id, allow, write}`. Allow:
   the pending row becomes a code (random 32 bytes, stored hashed, single
   use, expires 5 minutes after issue), granted scope = `mcp:read` plus
   `mcp:write` only if requested AND ticked, plus `offline_access` if
   requested. The function returns the redirect URL; the page navigates.
   Cancel: redirect with `error=access_denied`.

### 4.3 Token (`/oauth/token`)

- Body form-urlencoded (415 otherwise; JSON is refused on purpose).
- Client authentication: confidential client by Basic or post secret; CIMD
  client by `client_id` with no secret. A confidential client sending no
  secret is `invalid_client` (401).
- `grant_type=authorization_code`: code exists, unused, unexpired, same
  `client_id`, same `redirect_uri` byte for byte as authorize received,
  `sha256(code_verifier)` base64url equals the challenge, `resource` absent
  or equal to ours. Marks the code used in the same statement that reads it
  (`update ... where used_at is null returning`), so a replay finds nothing.
  A replayed code also revokes the grant it produced (OAuth 2.1 advice).
  Creates or reuses the grant (one live grant per user, OAuth client and
  BrandGEO client; a new consent replaces its scope) and issues tokens.
- `grant_type=refresh_token`: token exists, not revoked, not expired, same
  client. **Rotation with reuse detection:** the presented refresh token is
  marked used and a new pair is issued in the same transaction; presenting an
  already-used refresh token revokes the whole grant and answers
  `invalid_grant`. A requested `scope` may narrow, never widen.
- Response:
  `{"access_token":"bgmat_...","token_type":"Bearer","expires_in":3600,"refresh_token":"bgmrt_...","scope":"mcp:read"}`,
  `Cache-Control: no-store`. Refresh token only when `offline_access` was
  granted.
- Errors per RFC 6749: `invalid_request`, `invalid_client`, `invalid_grant`,
  `unauthorized_client`, `unsupported_grant_type`, `invalid_scope`.
- Every path is a few indexed reads and writes: well under the 10 s limit.
  The function timeout stays at the default.

**Token formats:** access `bgmat_<48 hex>`, refresh `bgmrt_<64 hex>`. The
prefixes make a leaked token recognisable and let `mcp-server.js` route by
shape. Lifetimes (ruling R5 defaults): access 1 hour; refresh 30 days from
its issue, each rotation restarts it; a grant unused for 90 days is expired.

### 4.4 Revoke (`/oauth/revoke`)

RFC 7009: authenticated like the token endpoint; revokes the token and, for a
refresh token, the grant. Always 200, so it does not reveal which tokens
exist.

## 5. Decision 2: token to client, scope, gate and limits

`mcp-server.js` authentication (stage 1 section 3.4) gains one branch, chosen
by shape:

- `bgmcp_...` matches `CLIENT_API_KEY_RE`: today's path, unchanged.
- `bgmat_...`: read `oauth_tokens` by `token_hash` (kind `access`) joined to
  its grant. 401 with `invalid_token` when missing, expired or revoked, or
  when the grant is revoked or expired. Then confirm the grant's user still
  has a `user_profiles` row for the grant's `client_id` (a viewer moved or
  deleted loses access at once). Then the same `clients` read and the same
  `mcpAllowedFor(client.plan)` gate on every call, so a downgrade closes an
  OAuth connection exactly as it closes a key.
- **Scope:** `mcp:write` in the token gives `keyScope = 'read_write'`;
  anything else `read`. `tools/list` and `mark_fix_done` use the existing
  stage 2 checks unchanged. The read-only refusal message gets an OAuth
  variant: "This connection has read access only. Disconnect and connect
  again, ticking 'Also let it mark Fix This items done'."
- **Limits:** the per-key counter keys on the grant,
  `mcp:grant:<grant_id>`, 60 a minute. The per-client daily counter
  `mcp:client:<id>:day` (5,000) and the stage 2 write counter
  `mcp:client:<id>:writes:hour` (60) are shared with keys, so a client cannot
  double its limits by mixing credentials.
- **`last_used_at`** on the grant, once a minute, as keys do.
- **Audit:** `mark_fix_done` through OAuth writes the same `mcp_fix_marked`
  event with `grant_id` in `meta` instead of `key_id`, and stamps a new
  `fix_states.marked_by_grant uuid` (FK `oauth_grants(id)`, NO ACTION, same
  reasoning as `marked_by_key`). `fix_states_guard()` treats it exactly as it
  treats `marked_by_key`: kept only when `auth.uid()` is null, nulled for a
  browser, pinned on other updates. The hub line reads "Marked done <date> by
  Claude" using the grant's client name.
- **Logs:** the log line's `client=` and a `cred=key|oauth` token; never a
  token, prefix or hash. `scrub()` gains `bgmat_` and `bgmrt_`
  (case-insensitive). The no-secret test in `mcp_server.test.js` extends to
  both.
- **`bgmcp_` keys keep working unchanged** for Claude Code, Cursor and any
  client that sends a header. Nothing is deprecated.

## 6. Decisions 3 and 4: revocation and storage

### 6.1 Account page, MCP section

A second list under the keys: **Connected apps**. One row per live grant:
client name (from the CIMD document or the confidential client), the
redirect host, access ("Read only" or "Read and write"), connected on, last
used, and **Disconnect**. Disconnect calls `client-api-keys.js` action
`revoke_grant` (service role, same owner and plan checks as `revoke`), which
sets `revoked_at` on the grant and every live token in one statement. The
next call from Claude gets 401 `invalid_token`, its refresh gets
`invalid_grant`, and the user must consent again. An admin sees and can
disconnect any client's grants, as with keys.

### 6.2 Tables (one migration, applied only on Constantin's go)

`db/supabase-mcp-oauth-<date>.sql`. Pattern as `client_api_keys`: secrets
only as sha256, every write through the service role, no DELETE policy for
anyone, RLS on everything.

| Table | Key columns | Browser access |
|---|---|---|
| `oauth_clients` | `id text PK` (our id, or the CIMD URL), `kind` (`confidential`, `cimd`), `name`, `redirect_uris text[]`, `secret_hash` (confidential only), `metadata jsonb` and `fetched_at` (cimd cache), `created_at`, `disabled_at` | none |
| `oauth_grants` | `id uuid PK`, `client_id int` FK `clients ON DELETE CASCADE`, `user_id uuid` (no FK, like `created_by`), `oauth_client_id text` FK `oauth_clients`, `client_name`, `redirect_host`, `scope text`, `created_at`, `last_used_at`, `revoked_at`, `expires_at` | SELECT on named columns, `is_admin() or client_id = get_my_client_id()` |
| `oauth_codes` | `id uuid PK`, `code_hash text unique` (null while pending), `request_id_hash`, `oauth_client_id`, `user_id`, `client_id`, `redirect_uri`, `code_challenge`, `scope_requested`, `scope_granted`, `resource`, `state`, `created_at`, `expires_at`, `used_at`, `grant_id` | none |
| `oauth_tokens` | `id uuid PK`, `grant_id` FK `oauth_grants ON DELETE CASCADE`, `kind` (`access`, `refresh`), `token_hash text unique`, `scope`, `created_at`, `expires_at`, `used_at` (refresh rotation), `revoked_at`, `rotated_from uuid` | none |

Plus `fix_states.marked_by_grant` and the guard amendment (5), and
`client_events_type_check` unchanged (the type stays `mcp_fix_marked`).

**Growth and pruning:** one active connection refreshing hourly writes about
48 token rows a day. Rows whose `expires_at` is more than 7 days past, and
codes older than a day, are deleted by a pg_cron job in the same migration
file but in a separate, commented section Constantin runs on his go (the
scheduler pattern of 2026-09-12). Grants are kept for audit.

## 7. Decision 5: the directory listing pack

Portal fields from the submission page: name (up to 100 characters),
one-liner (up to 200), description (up to 2,000), one to five categories,
documentation URL, privacy policy URL, support contact, icon, a permanent
URL slug, use cases, company, authentication, data handling, test account
and access steps, seven compliance acknowledgments, then submit.

| # | Item | Owner | State today | Done when |
|---|---|---|---|---|
| 1 | `mcp.html` copy fixed (stage 3 web review FAIL: findings A, C, D, E) and updated for stage 2 tools and the claude.ai connector | bg-copy, then bg-web | 404, unpublished | the page serves 200 with a passing bg-verify review; it is the documentation URL |
| 2 | Privacy page paragraph on MCP: what an AI client receives (the brand's visibility data, read through tools), that tokens and keys are stored hashed, that disconnecting stops access at once, retention of grants for audit, that BrandGEO never receives the user's conversation with Claude | bg-copy, then bg-web; Constantin approves legal wording | `privacy.html` 200, no MCP mention | the paragraph is live |
| 3 | Icon: the BrandGEO mark, square, readable at small sizes, both themes | bg-design | `brandgeo/web/images/logo.png` exists, not checked for this use | a square PNG in the repo, checked at 32 px |
| 4 | Listing text: name "BrandGEO", one-liner, description, use cases, "what users need" (a BrandGEO account on Radar or above), reads and writes (both: the write is marking fixes done) | bg-copy, no-AI-tells rules, claims checked by bg-verify against the tool list | none | three strings within limits in `docs/copy/` |
| 5 | Categories: one to five from the portal's own list | Constantin picks; bg-copy proposes from the list he reads in the portal | unknown list | chosen |
| 6 | Support contact: `support@getbrandgeo.com` (16 pages already use it) | Constantin confirms the mailbox is read | exists on the site | confirmed |
| 7 | Reviewer test account: a "fully populated account". A new viewer login on a client with real data (ruling R7) | **Constantin creates the login and types its password into the portal himself.** Agents never create accounts or handle passwords | none | entered in the portal's Test and launch step |
| 8 | Anthropic-held client: our server mints the confidential client and shows the secret once, on an admin-only action | bg-backend builds the action; **Constantin runs it and pastes id and secret into the portal** | none | entered in the portal's Authentication step |
| 9 | Data handling answers: our own API; no health data; no sponsored content | Constantin, from this spec | none | answered |
| 10 | Submission at https://claude.ai/directory/manage, MCP connector, Universal URL `https://app.getbrandgeo.com/mcp`, authentication "Always required" | **Constantin's click**, any paid Claude plan | none | status shows submitted |

## 8. Decision 6: test plan

Before submission, on the deployed build, with Constantin's own BrandGEO
viewer login or the reviewer login (agents do not sign in).

1. **Discovery from outside:** unauthenticated `POST /mcp` answers 401 with
   the `resource_metadata` header; both PRM URLs and the AS metadata answer
   JSON with the exact fields of section 3; `resource` byte-equal.
2. **claude.ai custom connector** (Settings, Connectors, add custom, URL
   `https://app.getbrandgeo.com/mcp`): sign-in opens our consent page, the
   redirect host reads `claude.ai`, Allow returns to Claude connected. Call
   each of the nine tools from a conversation; `mark_fix_done` refuses until
   connected with the write box ticked, then works; clean up that mark.
3. **Claude Code:** `claude mcp add --transport http brandgeo
   https://app.getbrandgeo.com/mcp`, then `/mcp` to authenticate: consent
   shows the loopback warning, the port differs per run and still matches.
   Call every tool.
4. **Refresh:** set a test grant's access token to expired (SQL, on the test
   client, rolled into cleanup); the next call refreshes and succeeds; the old
   refresh token presented again by curl revokes the grant (reuse detection).
5. **Revoke:** Disconnect on the Account page; the next tool call fails and
   Claude asks to reconnect. RFC 7009 revoke by curl answers 200 for a known
   and an unknown token alike.
6. **Gate:** a Free client's login is refused at consent; downgrading the
   test client to Free (and back) closes a live connection on the next call.
7. **Negative cases by curl:** wrong verifier, reused code, wrong
   `redirect_uri`, foreign `client_id`, `resource` for another URL, JSON body
   at the token endpoint, unknown scope, a `bgmat_` token sent as a `bgmcp_`
   key and the reverse.
8. **Keys unchanged:** a `bgmcp_` read key and read_write key behave exactly
   as in the stage 2 live probe.
9. **Logs:** no token, prefix or hash in function logs (read in the Netlify
   UI by Constantin, since the observability API does not index log text).
10. **Cleanup:** every grant, token, code, fix mark and event the tests made
    is deleted and read back, as in the stage 2 probe.

Unit tests (node, no network): PKCE vectors from RFC 7636 appendix B, code
single use, rotation and reuse, loopback match table, CIMD validation
(allowlist, mismatch, oversize), scope narrowing, the shape router in
`mcp-server.js`, the 401 header, and the extended no-secret log check.

## 9. Decision 7: rulings (all defaults, ruled 2026-11-06)

Constantin, 2026-11-06: "Defaults, build it". The Default column below is the
ruling for each row. Do not re-raise.

| # | Question | Default |
|---|---|---|
| R1 | Authorization server: our own in Netlify functions, or Supabase OAuth 2.1 (beta) | **Our own** (section 2) |
| R2 | Write access over OAuth: offered on the consent screen, unticked by default | **Yes, opt-in checkbox** |
| R3 | DCR (`/oauth/register`) for other MCP clients | **Off in release one**; CIMD and Anthropic-held credentials cover Claude; other clients keep `bgmcp_` keys |
| R4 | CIMD host allowlist | **`claude.ai` only** in release one; widening needs the SSRF guards of 4.1 and a bg-verify pass |
| R5 | Lifetimes | **Access 1 h, refresh 30 d rotating, grant idle expiry 90 d** |
| R6 | Admin logins (no `client_id`) at consent | **Refused** with a message; admins test with a viewer login |
| R7 | Reviewer test account | **A new viewer login on client 2**, BrandGEO's own account (managed, real data); Constantin creates it |
| R8 | Plan gate for OAuth | **Same as keys: Radar and up**, writes the same |
| R9 | Pruning cron for expired tokens and codes | **Yes**, separate section of the migration, run on his go |
| R10 | Listing name and slug | **"BrandGEO"**, slug `brandgeo` (permanent once published) |

## 10. Build order, agents and models

Docs first, then one migration, then one Netlify build, then the listing.

1. **bg-copy (Sonnet):** consent screen strings, Connected apps strings, the
   mcp.html fixes (findings A, C, D, E plus stage 2 and claude.ai), the
   privacy paragraph, listing text (4 in section 7). Into `docs/copy/`.
2. **bg-design (Sonnet):** consent screen and Connected apps layout, icon
   check. Into `docs/design/`.
3. **bg-backend (Opus):** the migration file; `oauth-metadata.js`,
   `oauth-authorize.js`, `oauth-token.js`, a shared `_oauth.js` (PKCE,
   hashing, loopback match, CIMD fetch, scope sets); the `mcp-server.js`
   shape router, 401 header, scope mapping, grant counters, audit and
   scrub; `client-api-keys.js` actions `list_grants`, `revoke_grant` and
   admin-only `create_anthropic_client`; `netlify.toml` redirects; tests.
4. **bg-app (Sonnet):** `OAuthAuthorize.tsx` route, the login `next`
   handling, Connected apps on the Account page, the hub's "by Claude" line.
5. **bg-verify (Opus), static:** the whole diff. Mandatory, auth and schema.
   **Fable** only if the review asks for it, on: refresh rotation and reuse
   races, code single-use under concurrency, redirect matching, and the
   consent request binding between `check` and `decide`.
6. **Constantin:** applies the migration; this seat reads it back and runs
   rolled-back RLS probes (a viewer reads only their own grants and never a
   code, token or client secret hash).
7. **Push** with `BATCH_PUSH=1` on his word (one Netlify build). Then the
   test plan in section 8, cleaned up.
8. **bg-web (Sonnet):** publish `mcp.html` and the privacy paragraph after
   their bg-verify pass (cPanel pipeline, no Netlify build).
9. **Constantin:** reviewer login, `create_anthropic_client`, then the portal
   submission.

**Scale note:** no new cron besides the optional pruning; new invocations
only on sign-in, hourly refresh per connected user, and the MCP calls that
exist already. Every endpoint is a handful of indexed reads and writes.

## 11. Build contracts (2026-11-06, bg-backend, after the ruling)

Written by bg-backend with the backend half (section 10 step 3). bg-app
builds the SPA half from this section verbatim. Anything not stated here
follows sections 3 to 6. Files: `netlify/functions/_oauth.js`,
`oauth-metadata.js`, `oauth-authorize.js`, `oauth-token.js`, the edited
`mcp-server.js` and `client-api-keys.js`, `netlify.toml`, and
`db/supabase-mcp-oauth-2026-11-06.sql`.

### 11.1 `oauth-authorize.js` (the consent page's server)

`POST /.netlify/functions/oauth-authorize`, header `Authorization: Bearer
<the signed-in user's Supabase access token>`, body JSON. Every response is
JSON with `Cache-Control: no-store`.

Responses that come from `requireAuth` itself carry no `ok` field:
`401 { error: 'Unauthorized: ...' }` (no or expired session: send the user to
`/login?next=<this full URL>`, section 4.2 step 2), `403 { error: 'Forbidden:
...' }` (foreign origin or no profile: show the generic error). Every
response the function writes itself carries `ok`.

**`check`.** The page sends the eight query parameters exactly as it read
them from its own URL; an absent parameter is sent as `null` or left out,
never as an empty string.

```json
{ "action": "check", "response_type": "code", "client_id": "...", "redirect_uri": "...",
  "scope": "mcp:read mcp:write offline_access", "state": "...", "code_challenge": "...",
  "code_challenge_method": "S256", "resource": "https://app.getbrandgeo.com/mcp" }
```

Success, `200`:

```json
{ "ok": true, "request_id": "<43 characters>", "client_name": "Claude", "client_kind": "confidential",
  "redirect_host": "claude.ai", "loopback": false, "brand_name": "<clients.name>",
  "write_requested": true, "offline_requested": true, "expires_at": "<ISO, 5 minutes>" }
```

| Field | What the consent screen does with it |
|---|---|
| `client_name` | The app asking, rendered as text (never HTML). Clipped to 60 characters server side. "Claude" for the Anthropic-held client, the CIMD `client_name` otherwise (Claude Code reads "Claude Code"). |
| `client_kind` | `confidential` or `cimd`. Not shown; available for copy that differs. |
| `redirect_host` | "will be sent back to <redirect_host>". `claude.ai`, or `localhost` / `127.0.0.1` for Claude Code. |
| `loopback` | `true`: show "an app on this computer" and the loopback warning (section 4.2 step 6) instead of the host line. |
| `brand_name` | The BrandGEO brand being connected. |
| `write_requested` | Show the checkbox "Also let it mark Fix This items done" only when `true`; it starts unticked (R2). |
| `offline_requested` | Not shown. |
| `request_id` | Kept in memory only, sent back with `decide`. Never in the URL, never in storage. |
| `expires_at` | After it, `decide` answers `request_expired`; the page may say "This request expired. Start the connection again from Claude." |

Redirect-borne failure, `200`, after the redirect was proven:
`{ "ok": false, "error": "<code>", "redirect": "<redirect_uri>?error=<code>&state=<state>" }`.
The page navigates to `redirect` at once (`window.location.assign`), shows
nothing of its own, and never edits the URL. Codes: `unsupported_response_type`,
`invalid_request` (challenge method not S256, challenge missing or not 43 to
128 unreserved characters, or a state over 1,024 characters, which is then not
echoed), `invalid_target` (resource present and not exactly
`https://app.getbrandgeo.com/mcp`), `invalid_scope` (a non-string scope only;
unknown scope words are dropped, not refused).

Page errors, shown on the page, never a redirect: `{ "ok": false, "error":
"<code>", ...extra }`. The page must word every one of these:

| Code | HTTP | When | Extra fields |
|---|---|---|---|
| `invalid_client` | 400 | `client_id` missing, unknown, disabled, a URL outside the allowlist (R4: `https://claude.ai/<path>` only), or a CIMD document that is wrong | none |
| `client_metadata_unavailable` | 503 | the CIMD document could not be fetched (network, timeout 3 s, non-200, redirect) | none |
| `invalid_redirect_uri` | 400 | `redirect_uri` missing or not registered for that client | none |
| `admin_account` | 403 | the signed-in login is an admin (R6, every admin login, with or without a client) | none |
| `no_account` | 403 | the login has no BrandGEO client, or its client row is gone | none |
| `plan_required` | 403 | the client's plan is below Radar (R8) | `required_plan: "radar"`, `required_plan_label: "Radar"`, `current_plan`, `upgrade_url: "https://app.getbrandgeo.com/account"` |
| `account_unavailable` | 403 | a research client | none |
| `request_expired` | 400 | `decide` only: unknown, already decided, expired, another user's request, or the login now belongs to another client | none |
| `invalid_request` | 400 | malformed body, unknown `action`, or on `decide` a non-boolean `allow` or `write` | none |
| `server_error` | 500 | anything unexpected | none |

Order of checks, binding: client, then redirect (both page errors), then the
redirect-borne checks, then the account checks (page errors). So a request
with a bad redirect AND a bad `response_type` is `invalid_redirect_uri`.

**`decide`.** `{ "action": "decide", "request_id": "...", "allow": true|false, "write": true|false }`.
`write` is the checkbox; send `false` when it was not shown. The server reads
only the stored request: the client and redirect are checked again, the
account checks run again for the same user and client, and the request is
claimed once. Write is granted only when the client requested `mcp:write`
AND `write` is `true`. Success, both for Allow and Cancel, `200`:
`{ "ok": true, "redirect": "<redirect_uri>?code=...&state=..." }` or
`"<redirect_uri>?error=access_denied&state=..."`; the page navigates to it at
once. Failures are the page errors above. A double click sends one request:
the second answers `request_expired`, so the page disables both buttons after
the first click.

### 11.2 `client-api-keys.js` additions (Account page, Connected apps)

Same endpoint and auth as the key actions (`requireAuth` with
`client_id`: admins any client, viewers their own).

`{ "action": "list_grants", "client_id": 11 }`, `200`:

```json
{ "grants": [ { "id": "<uuid>", "client_name": "Claude", "redirect_host": "claude.ai",
                "access": "read" | "read_write", "created_at": "<ISO>", "last_used_at": "<ISO>" | null } ],
  "available": true }
```

Live grants only (not revoked, not expired), newest first. Not plan gated, so
a downgraded client still sees and can disconnect old connections. Row copy:
`client_name`, `redirect_host`, "Read only" for `read` and "Read and write"
for `read_write`, connected on `created_at`, last used `last_used_at` ("never"
when null), and **Disconnect**. Before the migration is applied the answer is
`200 { "grants": [], "available": false }`; the page shows nothing extra.
Errors: `403` (another client), `404 { error: 'Client not found.' }`,
`500 { error: 'Could not list connected apps.' }`.

`{ "action": "revoke_grant", "client_id": 11, "id": "<grant uuid>" }`, `200
{ "ok": true, "id": "<uuid>" }`. `404 { error: 'No connected app with that
id.' }` for an unknown, malformed, already revoked or other client's id;
`500 { error: 'Could not disconnect the app.' }`. After it, Claude's next call
gets 401 `invalid_token` and its refresh `invalid_grant`.

`{ "action": "create_anthropic_client", "name": "Claude" }` (name optional,
default "Claude", at most 60 characters; no `client_id`). Admin only (`403`
otherwise). `200 { "client": { "id": "bgoc_<24 hex>", "name", "redirect_uris":
["https://claude.ai/api/mcp/auth_callback"], "created_at" }, "client_secret":
"bgocs_<64 hex>" }`, the secret shown once and stored as sha256. `503 { error:
'OAuth clients are not available yet.' }` before the migration. Not for the
SPA: Constantin runs it once (section 7 item 8), from the browser console of
an admin session or by curl with his own session token.

### 11.3 What the browser may read from `oauth_grants`

RLS `is_admin() or client_id = get_my_client_id()`, SELECT only on: `id`,
`client_id`, `oauth_client_id`, `client_name`, `redirect_host`, `scope`,
`created_at`, `last_used_at`, `revoked_at`, `expires_at`. Never `user_id`
(withheld by privilege). Nothing at all from `oauth_clients`, `oauth_codes`,
`oauth_tokens`.

The hub's done line: `FIX_SELECT` gains `marked_by_grant`. When it is set,
read `oauth_grants.client_name` for that id (one select on the client's own
rows, RLS allows it) and render "Marked done <date> by <client_name>" ("by
Claude"); "by an AI agent" alone when the read fails. A fix row carries at
most one of `marked_by_key` and `marked_by_grant` (the server writes the other
as null). Before the migration the column is missing and the page's existing
fallback applies (section 9.6 of the stage 2 spec).

### 11.4 Server facts the other seats rely on

- **Token endpoint** answers RFC 6749 codes: `invalid_request`,
  `invalid_client` (401; with `WWW-Authenticate: Basic realm="brandgeo-oauth"`
  when Basic was used), `invalid_grant`, `unsupported_grant_type`,
  `invalid_scope`, plus `invalid_target` (RFC 8707) for a foreign `resource`.
  `415` for any body that is not form-urlencoded. `/oauth/revoke` answers
  `200` with an empty body for any token once the client authenticated, and
  `401 invalid_client` when it did not (RFC 7009 section 2.2.1).
- **The 401 on `/mcp`**: `WWW-Authenticate: Bearer resource_metadata="https://app.getbrandgeo.com/.well-known/oauth-protected-resource/mcp", scope="mcp:read mcp:write"`,
  plus `, error="invalid_token"` for a well-formed `bgmat_` token that is dead.
  Body for every 401: `{"jsonrpc":"2.0","id":<id>,"error":{"code":-32001,"message":"Invalid or missing BrandGEO credentials."}}`.
  This changes the stage 1 header (`Bearer realm="brandgeo-mcp"`) and message
  for keys too, as section 3.1 says.
- **Read-only refusal over OAuth**: "This connection has read access only.
  Disconnect and connect again, ticking 'Also let it mark Fix This items
  done'." (`isError: true`, log outcome `read_only_grant`).
- **Effective scope** of an OAuth call is the token's scope intersected with
  its grant's scope, so a later consent that drops write narrows older tokens
  at once; a later consent that adds write does not widen them.
- **Logs**: every `/mcp` line reads `client=<id> cred=key|oauth|- method=...`.

### 11.5 Decisions taken while building (for bg-verify, none changes a ruling)

1. **Refresh rotation is not one database transaction.** PostgREST has none
   across statements. The presented refresh token is claimed by one
   conditional update (`used_at is null`), then the new pair is inserted. A
   failed insert after the claim answers `server_error` and the client must
   connect again: fails closed, never issues twice.
2. **Reuse detection is strict.** Two refreshes with the same token at the
   same moment (one wins the claim) revoke the grant. If Claude ever sends a
   proactive and a reactive refresh together, the user reconnects. Flagged
   for Fable (section 10 step 5) and the live test of section 8 item 4.
3. **`revoke_grant` is two statements**, grant then tokens. The grant's
   `revoked_at` is the authority: `mcp-server.js` and the token endpoint read
   it on every use, so the tokens' own `revoked_at` is for the record.
4. **CIMD cache.** A row younger than 24 h is used without fetching; an older
   one is refetched and a failed refetch is refused (no stale fallback). The
   token endpoint never fetches: it accepts the row cached at consent, of any
   age, unless disabled.
5. **CIMD URL in canonical form only**: no query, no fragment, no explicit
   `:443`, no upper-case host; the parsed URL must give back the same string.
6. **A disabled OAuth client** is refused at authorize, token and refresh;
   `/mcp` does not read `oauth_clients` per call, so its live access tokens
   lapse within the hour.
7. **One live grant per user, OAuth client and BrandGEO client.** A new
   consent reuses it and replaces its scope without revoking its older
   tokens (two machines running Claude Code share one CIMD client id and so
   one grant). An expired live grant is revoked and replaced.
8. **The plan gate is not checked at the token endpoint**; the user's
   profile mapping is (code exchange and refresh). `/mcp` gates every call.
9. **Each `/mcp` stamp of `last_used_at` (once a minute) and each refresh
   move the grant's `expires_at` to 90 days ahead** (idle expiry, R5).
10. **No rate limit on the OAuth endpoints**: codes, tokens and the client
    secret carry 192 to 256 random bits. Revisit if logs show abuse.
11. **The key path's `mark_fix_done` upsert now writes `marked_by_grant:
    null`**, so a row re-marked by a key never keeps a grant marker. Before
    the migration the column is missing and the key mark retries without it.
12. **The metadata documents** carry `Access-Control-Allow-Origin: *`
    (public, static). Not in section 3; harmless, and needed by browser MCP
    clients.
13. **Pruning job** (R9, run on his go): `mcp-oauth-prune`, `45 4 * * *`,
    after the affiliate jobs at 04:35 and 04:40.
