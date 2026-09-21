---
id: 025
from: bg-orchestrator
to: bg-architect
status: NEEDS_HUMAN
created: 2026-09-21
scope_write: docs/arch/mcp-access.md
scope_read: brandgeo-dashboard/netlify/functions/_auth.js, brandgeo-dashboard/netlify/functions/_plans.js, brandgeo-dashboard/netlify/functions/_cost.js, brandgeo-dashboard/netlify/functions/_affiliate_core.js, brandgeo-dashboard/netlify/functions/_affiliate_auth.js, brandgeo-dashboard/netlify/functions/affiliate-conversions.js, brandgeo-dashboard/netlify/functions/expire-plan-grants.js, brandgeo-dashboard/netlify.toml, brandgeo-dashboard/src/lib/planConfig.ts, brandgeo-dashboard/src/pages/Account.tsx, brandgeo-dashboard/src/pages/AIVisibility.tsx, brandgeo-dashboard/src/pages/Competitors.tsx, brandgeo-dashboard/src/pages/Recommendations.tsx, brandgeo-dashboard/tests/helpers/, db/supabase-affiliate-migration-2026-09-12.sql, docs/AGENT-OS.md, docs/affiliates/INTEGRATION.md
model: opus
---

## Decision

Constantin, 2026-09-21: "ar trebui sa facem disponibil conectarea prin MCP la
platforma noastra pentru conturile de la 99 de euro in sus, cred ca de la
essentials". BrandGEO exposes a remote MCP (Model Context Protocol) server so
a customer's own AI tools (Claude, Claude Code, Cursor, ChatGPT and the like)
can read that customer's visibility data. Gate: plan `essentials` and above,
so `free` and `radar` are out; `pro` (legacy), `managed` and `enterprise`
are in. Read-only in the first release. Nothing is built yet; this packet
asks for the architecture spec, and section "Open questions" needs
Constantin's rulings before the build stage starts.

## What already exists (measured 2026-09-21, reuse, do not reinvent)

- `_auth.js` `requireAuth()` verifies a Supabase JWT plus an origin
  whitelist. An MCP client holds no Supabase session and sends no browser
  origin, so the MCP endpoint needs its own credential path. It must NOT
  loosen `requireAuth()`; it is a second, separate gate.
- The affiliate module already has a per-program API key pattern:
  `_affiliate_core.js` `makeApiKey()`, `hashApiKey()` (sha256),
  `apiKeyPrefix()`; the row stores `api_key_hash`, `api_key_prefix`,
  `api_key_created_at`, never the key; `_affiliate_auth.js` resolves a
  bearer key by hash; `affiliate-admin.js` issues it once and returns it once.
  Copy this shape for a per-client key.
- Plan rank lives in `_plans.js` (`PLAN_ORDER`, `planRank()`, `isValidPlan()`),
  mirrored index for index with `planConfig.ts`. `_plans.js` has drifted
  once before (CLAUDE.md, Growth PRO defect C1 to C4), so the gate must be
  ONE function on the server, not a third copy of the ladder.
- `clients.plan` is the live plan; `expire-plan-grants` reverts it when a
  grant lapses, so reading `plan` on every call is enough for downgrades.
- `netlify.toml` already rewrites `/r/*` and `/api/affiliate/*` to functions
  ahead of the SPA fallback; the MCP route goes in the same place.
- Functions run at 10s default, 26s max. The dashboard reads `ai_results`,
  `prompts`, `competitors`, `recommendations`, `recommendation_runs`,
  `collection_runs`, `clients`; every read filters `client_id` and excludes
  `status = 'error'` rows.
- Tests: `tests/helpers/` has an in-memory Supabase fake and an `_auth.js`
  mock; the affiliate suites show the style (node, no framework).

## Do

1. Write `docs/arch/mcp-access.md` as the binding spec for `bg-backend`,
   `bg-app`, `bg-web`, `bg-copy` and `bg-verify`. Sections, in this order.
2. **Transport.** MCP Streamable HTTP, stateless: one Netlify function
   `mcp-server.js` behind a rewrite `/mcp` to `/.netlify/functions/mcp-server`
   (status 200, placed BEFORE the `/*` SPA fallback). `POST` carries one
   JSON-RPC message and answers with `application/json` (no SSE stream, no
   session id, so every call fits one invocation). `GET` answers 405,
   `DELETE` 405. Methods to implement: `initialize`,
   `notifications/initialized` (202, empty), `ping`, `tools/list`,
   `tools/call`. Everything else answers JSON-RPC `-32601`. State the
   protocol version to advertise and how a client's older version is
   negotiated. Timeout entry in `netlify.toml`: 26.
3. **Credential.** A per-client API key, format `bgmcp_<clientId>_<48 hex>`,
   shown once at issuance, stored as sha256 hash plus prefix in a new table
   `client_api_keys` (`id`, `client_id`, `key_hash` unique, `key_prefix`,
   `label`, `created_by` uuid, `created_at`, `last_used_at`, `revoked_at`).
   RLS: `select` for admin or own client, no `insert`, `update` or `delete`
   policy for `authenticated` (writes go through the service role in a
   function), no DELETE policy at all (revoke sets `revoked_at`). Sent as
   `Authorization: Bearer <key>`. Resolve by hash, refuse revoked, stamp
   `last_used_at` at most once per minute per key (not per call).
4. **Plan gate.** One exported function in `_plans.js`,
   `mcpAllowedFor(plan)`, defined as `planRank(plan) >= planRank('essentials')`,
   so the ladder is not copied. A mirror `PLAN_MCP_ACCESS` or a same-named
   helper in `planConfig.ts` for the UI only. Checked on EVERY `tools/call`
   and `tools/list` against the live `clients.plan`; a key on a client that
   dropped below the gate answers a JSON-RPC error whose message names the
   plan needed (`Upgrade to Essentials`), not a bare 403. Key issuance is
   also refused below the gate. Also refuse when `clients.category` is the
   research category (`_cost.js` `RESEARCH_CATEGORY`) unless admin issued.
5. **Tools, read-only, first release.** Specify name, input schema, output
   shape, row cap and the exact query for each:
   - `get_brand_overview`: brand, aliases, website, plan, active engines
     (`activeEnginesFor()`), last completed collection, prompt count.
   - `get_visibility_summary(window_days)`: mention rate overall and per
     engine, answers checked, from `ai_results` in the window.
   - `list_prompts(active_only)`: prompts with category and position.
   - `get_prompt_results(prompt_id, window_days)`: per engine: mentioned,
     position, sentiment, snippet, competitors, `checked_at`.
   - `get_competitors(window_days)`: competitor share of mentions, top N.
   - `get_sentiment_summary(window_days)`: positive, neutral, negative
     counts and per engine, over rows with `brand_mentioned = true`.
   - `get_recommendations(limit)`: latest run's items.
   Every query filters `client_id` from the key, excludes `status = 'error'`,
   caps rows (state the cap, suggest 200) and supports `cursor` or `offset`
   where the cap can bite. Windows default 30 days, max 365. Response
   `content` is one `text` block of JSON plus `structuredContent` with the
   same object. No tool calls an LLM, no tool triggers a collection or an
   audit.
6. **Abuse controls.** Per key 60 calls a minute and per client 5,000 a
   day, counted in a small table in the style of `affiliate_rate_limits`
   (or reuse it with a namespace, state which); over the limit answers
   JSON-RPC error with a `retry_after` field. Request body cap 64 KB.
   Function logs `[mcp-server/invId] client=<id> tool=<name> ms=<n>`, never
   the key or the prefix.
7. **Key management UI.** On `Account.tsx`, section "MCP access": for a
   gated plan, an "Issue key" button (label input, key shown once in a copy
   box with the three client setup snippets), a list of active keys
   (prefix, label, created, last used) with "Revoke"; for `free` and `radar`
   the same section shows the upgrade line naming Essentials. Admin sees
   it for any client, viewer for their own. Backend actions on a new admin
   and viewer function `client-api-keys.js` (`list`, `issue`, `revoke`)
   behind `requireAuth({ clientId })`, envelope in the `promotions-admin.js`
   precedent (`POST {action, ...}`).
8. **Setup snippets and marketing.** A public page `brandgeo/web/mcp.html`
   (and a sitemap entry) with the endpoint, the three setup snippets
   (Claude Code `claude mcp add --transport http brandgeo
   https://app.getbrandgeo.com/mcp --header "Authorization: Bearer <key>"`,
   Claude Desktop or claude.ai custom connector, Cursor `mcp.json`), the
   tool list, the plan gate and the rate limits. One row on the pricing
   table (`index.html`) from Essentials upward, wording owed to `bg-copy`
   (working label: "MCP access for your AI tools"). `faq.html` one Q and A.
   The spec states the exact client support claim `bg-web` may print; any
   client that only accepts OAuth is listed as "coming" not "supported".
9. **Migration file** `db/supabase-client-api-keys-migration-2026-09-XX.sql`
   with the table, RLS, index on `key_hash`, and the rate limit table if
   new. Sequencing: migration first, then the deploy (the function reads
   the table on first call; a deploy before the table answers 500 to every
   customer key).
10. **Tests to require from bg-backend:** `tests/mcp_server.test.js` (JSON-RPC
    envelope, unknown method, missing key, revoked key, plan below gate,
    each tool against the in-memory fake with two clients to prove
    isolation, row cap, window clamp), `tests/client_api_keys.test.js`
    (issue returns the key once, list never returns hash or key, revoke,
    issuance refused below the gate), plus one assertion that
    `mcpAllowedFor` agrees with `planConfig.ts` for all eight plans.
11. **Stage plan and models**, written at the end of the spec: bg-backend
    on Opus (auth adjacent: new credential, new RLS) builds `mcp-server.js`,
    `client-api-keys.js`, `_plans.js` helper, migration, tests; bg-app on
    Sonnet builds the Account section and `planConfig.ts` mirror; bg-copy
    then bg-web on Sonnet build `mcp.html`, the pricing row and the FAQ;
    bg-verify on Opus, Fable only for the key resolution and the RLS probe.
    All dashboard pieces ride ONE Netlify build (`BATCH_PUSH=1`); the web
    pieces deploy free through cPanel. Scale note per AUTONOMY section 7:
    no cron, no scheduled invocation, invocations only on customer calls,
    reads only, one small write per minute per active key.

## Do not

- Do not touch `_auth.js` `requireAuth()`, `_cost.js`, the collect
  functions or `stripe-webhook.js`.
- Do not add a third copy of the plan ladder anywhere; the gate is
  `mcpAllowedFor()` over `planRank()`.
- Do not design write tools (`add_prompt`, `run_collection`) into the first
  release; list them under "Later" with the cost reason (a collection spends
  LLM budget and the cooldown rules would have to be re-implemented).
- Do not design an OAuth 2.1 authorization server into the first release
  unless Constantin rules for it (question 2); describe it under "Later"
  with what it would take (Supabase Auth as the identity provider, dynamic
  client registration, PKCE).
- No em or en dashes in the spec. No real customer names; client ids only.
- Do not run any build, browser, collection, Stripe write or migration.

## Acceptance criteria

- [ ] `docs/arch/mcp-access.md` exists, every section in "Do" is present,
      each tool has name, input schema, output shape, cap and query.
- [ ] The plan gate is one function over `planRank()`; the spec cites the
      `_plans.js` drift history as the reason.
- [ ] The key is never stored, logged or listed in clear; the spec says so
      in the credential, logging and UI sections.
- [ ] RLS for `client_api_keys` has no DELETE policy and no
      `authenticated` write policy.
- [ ] Every tool query filters `client_id` and excludes error rows; the
      isolation test with two clients is required.
- [ ] Migration before deploy is stated as the order.
- [ ] Stage plan names the model per stage and the single build.
- [ ] `rg -n '\x{2014}|\x{2013}' docs/arch/mcp-access.md` prints nothing,
      with a positive control proving the pattern fires.

## Open questions for Constantin

Answer with the number and a word; the spec is written to the defaults if
no answer arrives, and the build stage waits for the answers to 1 and 2.

1. **Gate.** Essentials and above, so Radar (EUR 29) is out. Default: yes.
2. **Credential in the first release.** Bearer API key (works today in
   Claude Code, Cursor, Windsurf, VS Code, and in Claude Desktop through a
   local bridge). OAuth 2.1 sign-in (what claude.ai web connectors and
   ChatGPT connectors want) as a second release. Default: key first.
3. **Write tools.** None in the first release. Default: none; `add_prompt`
   is the first candidate for release two.
4. **Keys per client.** Default: up to 5 named keys, so an agency client
   can give one per tool and revoke one without breaking the others.
5. **Pricing label.** Default working label "MCP access for your AI tools";
   `bg-copy` proposes the final wording.
6. **Limits.** Default 60 calls a minute per key, 5,000 a day per client,
   the same for every gated plan; say if Managed and Enterprise get more.
