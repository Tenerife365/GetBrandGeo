---
id: 026
from: bg-orchestrator
to: bg-verify
status: READY
created: 2026-09-22
scope_write: docs/qa/mcp-access-stage1-review-2026-09-22.md
scope_read: docs/arch/mcp-access.md, brandgeo-dashboard/, db/supabase-client-api-keys-migration-2026-09-22.sql, docs/AGENT-OS.md
model: opus (fable only for the key resolution path, spec 3.4, and the RLS and column-privilege probe, spec 9)
---

## Decision

Stage 1 of `docs/arch/mcp-access.md` is built and uncommitted. bg-backend (Opus)
built the functions, `netlify.toml`, the migration file and the tests; bg-app
(Sonnet) built the `planConfig.ts` feature and the Account section. The
migration was APPLIED to production by Constantin on 2026-09-22 and reported
successful. No build, commit or deploy has happened.

## What was built (the review subject, nothing else)

Created:
- `brandgeo-dashboard/netlify/functions/_client_api_key.js`
- `brandgeo-dashboard/netlify/functions/mcp-server.js`
- `brandgeo-dashboard/netlify/functions/client-api-keys.js`
- `db/supabase-client-api-keys-migration-2026-09-22.sql`
- `brandgeo-dashboard/tests/helpers/ts_require.js`
- `brandgeo-dashboard/tests/mcp_server.test.js` (43 checks, green)
- `brandgeo-dashboard/tests/client_api_keys.test.js` (14 checks, green)
- `brandgeo-dashboard/src/components/McpAccessSection.tsx`

Edited:
- `brandgeo-dashboard/netlify/functions/_plans.js` (`MCP_MIN_PLAN`, `mcpAllowedFor`)
- `brandgeo-dashboard/netlify.toml` (`/mcp` rewrite above `/*`; `[functions."mcp-server"]` timeout 26, `node_bundler = "esbuild"`; `[functions."client-api-keys"]` timeout 15)
- `brandgeo-dashboard/tests/helpers/fake_supabase_mem.js` (unique `key_hash`, `select(cols, {count, head})`)
- `brandgeo-dashboard/src/lib/planConfig.ts` (`mcp_access` feature at `radar`)
- `brandgeo-dashboard/src/pages/Account.tsx` (one import, one `<McpAccessSection>` after "Plan & billing")

NOT part of this change, already dirty from other sessions, do not review or
touch: `_revenue.js`, `revenue-report.js`, `unlock-audit-report.js`,
`Revenue.tsx`, `brandgeo/web/site.js`, `db/supabase-prospect-channels-migration.sql`,
the gtm docs and agents.

## Builder-declared deviations (judge each against the spec)

1. Per-key minute counter runs on every authenticated request, including ones
   refused by the plan or research gate (follows 6.2 over the 4.3 wording).
   The daily counter runs only after the gates and the tool-name check.
2. Extra `[functions."client-api-keys"]` block, timeout 15 (matches 7.1).
3. `ai_results` scans also filter `.in('llm', activeEngines)` in the query;
   the JS engine filter is kept too.
4. Logs: unknown method logged as `other`, unknown tool as `unknown`; error
   messages have `bgmcp_...` and 64-hex strings blanked.
5. `get_brand_overview.last_result_at` is not engine filtered (spec query as written).
6. Migration adds a header, `COMMENT ON TABLE` and a commented rollback line.
7. bg-app: "partial" state is read as a downgraded client with surviving keys
   (list and revoke work, issue blocked). `gated = hasFeature(plan,'mcp_access') || isAdmin`.
8. Bundling: per-function esbuild importing `src/lib/*.ts` directly; the
   prebuild fallback was not used. Never exercised by a real build.

## Do

1. Read `docs/AGENT-OS.md`, `.claude/agents/bg-verify.md`, `docs/arch/mcp-access.md` in full.
2. Review every file above against the spec, section by section. Priority:
   key resolution (3.4), client isolation (5.1 rules 1 and 2), the plan and
   research gates (4.3, 4.4), secret hygiene (3.2, 6.4, 7.2), error codes (2.6).
3. Run from `brandgeo-dashboard/`: `node tests/mcp_server.test.js`,
   `node tests/client_api_keys.test.js`, and every other `tests/*.test.js`.
   Paste real output. `package_provisioning.test.js` is a known pre-existing red.
4. Try to break it: write throwaway probes (do not commit them) for a key with
   a mismatched embedded client id, a revoked key, a research client with a
   viewer-issued key, a free client on `tools/call` (daily counter must not
   move), a cross-client `prompt_id`, and a log capture proving no `bgmcp_`.
5. Post-migration probe against production, READ ONLY (SELECT only), with the
   Supabase MCP `execute_sql`:
   - `SELECT policyname, cmd, roles, qual FROM pg_policies WHERE tablename = 'client_api_keys';` expect exactly one, SELECT, `{authenticated}`.
   - `SELECT relrowsecurity FROM pg_class WHERE relname = 'client_api_keys';` expect true.
   - `SELECT grantee, column_name, privilege_type FROM information_schema.column_privileges WHERE table_schema='public' AND table_name='client_api_keys' AND grantee IN ('anon','authenticated') ORDER BY 1,2;` expect 8 columns for authenticated, never `key_hash`, nothing for anon.
   - `SELECT grantee, privilege_type FROM information_schema.table_privileges WHERE table_schema='public' AND table_name='client_api_keys' AND grantee IN ('anon','authenticated');` expect 0 rows.
   - `SELECT indexdef FROM pg_indexes WHERE tablename = 'client_api_keys';`
   - `SELECT jobname, schedule, active FROM cron.job;` confirm the affiliate rate-limit prune job exists (spec 6.3).
6. Check the frontend contract: `McpAccessSection.tsx` request and response
   handling against the actual `client-api-keys.js` bodies.
7. Write `docs/qa/mcp-access-stage1-review-2026-09-22.md`: verdict
   (PASS / PASS WITH FINDINGS / FAIL), findings with severity, file and line,
   and a ruling on each of the 8 deviations.

## Do not

- Do not edit any file under review. Findings only.
- No `npm run build`, no Netlify build, no deploy, no git command that writes
  (commit, add, stash, checkout, restore). `npx tsc --noEmit` is allowed.
- No mutating SQL. No new keys inserted in production.
- Do not print any secret or env value.

## Acceptance criteria

- [ ] Every test suite run with real output pasted.
- [ ] All six production read-backs run and pasted.
- [ ] Each of the 8 deviations ruled accept or reject.
- [ ] Review file written with a single verdict line at the top.

## Open questions for Constantin

- MCP protocol revision 2026-07-28 (reported by bg-backend, not yet
  independently checked) drops initialize, ping and sessions and adds
  `server/discover`. Not added per spec 2.5. Needs a bg-architect ruling;
  bg-verify only notes whether the claim checks out.
