# BrandGEO tech stack, for a DevOps conversation

Written 2026-10-12 from the working tree and the live configuration, not from
memory. One page per layer. Where a number is quoted it was counted on this
date.

## 1. Shape in one paragraph

BrandGEO is a two-surface SaaS in one public GitHub monorepo
(`Tenerife365/GetBrandGeo`). The marketing site is static HTML on shared
cPanel hosting. The product is a React single-page app plus about a hundred
Node serverless functions on Netlify, all talking to one Supabase project
(Postgres, Auth, Storage, Vault, pg_cron, pg_net). There is no server we run
ourselves, no container, no Kubernetes, no queue broker: scheduling is Postgres
cron calling Netlify functions over HTTP with a shared secret, and the only
long-running work is a Netlify background function fed from a Postgres table.
Billing is Stripe. Email is Resend plus Google Workspace. The AI engines we
measure are called directly over their public APIs.

## 2. Surfaces and hosting

| Surface | URL | Hosting | Deploy trigger |
|---|---|---|---|
| Marketing site | `getbrandgeo.com` | cPanel shared hosting at CyberFolks, IP `91.200.121.45`, Apache, PHP | GitHub push webhook to `brandgeo/web/deploy.php`, which copies changed files into the docroot (diff-based) |
| Dashboard (the product) | `app.getbrandgeo.com` | Netlify, site id `d51674f3-9579-4208-8b1b-90fc16d64df4` | Netlify builds from `brandgeo-dashboard/` on push to `main`; `netlify.toml` cancels the build when nothing under that folder changed |
| Database, auth, storage | Supabase project `duiyifepitvugyulobqm` | Supabase managed Postgres | Migrations applied by hand from `db/*.sql`, then recorded in git |
| Outbound mail domain | `trybrandgeo.com` | Google Workspace (separate subscription from company mail) | DNS at CyberFolks |

Netlify and cPanel are independent pipelines. A failure in one says nothing
about the other.

## 3. Marketing site (`brandgeo/web/`)

- 205 files, static HTML, one shared CSS token system in each page's `:root`,
  vanilla JS (`site.js`, `instrument.js`, `affiliate-track.js`, `ga4-init.js`,
  `theme-init.js`). No framework, no build step for the pages themselves.
- Research articles (`bg-001.html` to `bg-105.html`) are generated from one
  template by `scripts/build_articles.py` and committed; git is the deploy.
- `.htaccess` carries the CSP (response header, not a meta tag), HSTS, the
  `/r/` affiliate redirect forward to the dashboard, and caching rules. CSP
  refuses inline scripts, so everything is in external files.
- Analytics: GA4 `G-9H6C2NSYPH`, consent-gated. Plausible was removed.
- Indexing: `sitemap.xml`, `robots.txt`, `llms.txt`, `llms-full.txt`, an
  IndexNow verification file. Google indexing is manual through Search Console
  by decision (the Indexing API key did not fit Netlify's 4 KB env limit).
- The two PHP files (`deploy.php`, `deploy-secret.php`) are the only server
  code on this host. `deploy-secret.php` sits inside the public docroot with no
  deny rule, a known hardening item.

## 4. Dashboard frontend (`brandgeo-dashboard/src/`)

- React 18, TypeScript 5, Vite 5, Tailwind CSS 3, react-router 6, Recharts,
  `motion` (Framer Motion v12), lucide icons. `npm run build` is `tsc && vite
  build`; output in `dist/`, served by Netlify as a SPA with a catch-all
  rewrite placed after the function and `/r/*` rewrites.
- Supabase JS client with the public anon key; every data read is governed by
  Row Level Security. State in React Context providers (client, collection,
  market, time filter, i18n with 8 languages).
- Node 22 on the Netlify build image, esbuild as the function bundler.
- A demo mode (`vite --mode demo`) renders fixtures with no backend for
  screenshots and QA.

## 5. Backend: Netlify Functions (`brandgeo-dashboard/netlify/functions/`)

- 98 files: 62 HTTP or background functions plus 36 `_`-prefixed shared
  modules (auth, cost ledger, plans, analysis, affiliate core, revenue,
  touches, contact routes). Plain CommonJS JavaScript, no framework.
- Every privileged function starts with `requireAuth(event)` from `_auth.js`:
  verifies the Supabase JWT, checks an origin whitelist, resolves role
  (`admin` or `viewer`) and client ownership from `user_profiles`, and applies
  a per-client write rate limit. Functions use the Supabase service key, which
  bypasses RLS, so the auth helper is the tenant boundary on this path.
- Timeouts are set per function in `netlify.toml` (26 s for anything that
  calls an external API). One background function,
  `collection-worker-background`, drains the collection queue (15 minute
  ceiling).
- Scheduled work is NOT Netlify scheduled functions. Supabase `pg_cron` jobs
  call the functions through `pg_net.http_post` with a bearer secret stored in
  Supabase Vault (`CRON_SECRET` on the Netlify side). Active jobs today:
  nightly `ai_results` retention, hourly `schedule-collections` at minute 10,
  daily `expire-plan-grants`, daily `ping-sitemap` (IndexNow), daily
  `purge-old-audits`, and two affiliate jobs (retention and commission
  maturing). Every run writes a row to `public.job_runs`, which is the only
  scheduler log and is queryable by SQL.
- A remote MCP server (`mcp-server.js`, Streamable HTTP, stateless, bearer API
  keys hashed in `client_api_keys`) is built in the working tree and not yet
  deployed. It is read-only and gated to the Radar plan and above.

## 6. Data layer: Supabase

- Postgres with RLS on every table. Core tables: `clients`, `user_profiles`,
  `prompts`, `ai_results`, `collection_jobs`, `collection_runs`,
  `recommendations`, `prospects`, `prospect_touches`, `prospect_audits`,
  `prospect_leads`, `promotions`, `terms_acceptances`, `client_events`,
  `job_runs`, and the 14 affiliate tables (`affiliate_*`). Legacy
  single-tenant tables were moved to an `archive` schema.
- Extensions in use: `pg_cron` 1.6.x, `pg_net` 0.20.x, Supabase Vault.
  Helper functions (`is_admin()`, `my_client_id()`, `affiliate_my_id()`) are
  `SECURITY DEFINER` with `search_path` pinned to `public`.
- Storage: one private bucket, `affiliate-documents`, for invoice uploads.
- Auth: Supabase Auth, email plus password, Google SSO wired on the signup
  page. Roles live in `user_profiles.role`, not in the JWT.
- Migrations are SQL files in `db/`, applied by hand through the Supabase SQL
  editor or MCP and committed afterwards as the record. No migration runner,
  no down migrations. `clients.plan` has no migration file (created ad hoc).
- Backups: Supabase's managed daily backups on the current plan. Nothing
  additional.

## 7. External services the functions call

| Service | Used for | Env var(s) |
|---|---|---|
| OpenAI (`gpt-5.5` with web search for collection, `gpt-4o-mini` for cheap classification) | ChatGPT engine, audits, generation | `OPENAI_API_KEY`, `OPENAI_COLLECT_MODEL` |
| Anthropic (`claude-sonnet-4-6` collection, `claude-haiku-4-5`, `claude-sonnet-5` for analysis) | Claude engine, recommendations, social copy | `ANTHROPIC_API_KEY` |
| Google Generative Language (`gemini-2.5-flash`, grounding on) | Gemini engine | `GEMINI_API_KEY` |
| OpenRouter (Perplexity `sonar`, Llama) | Perplexity engine | `OPENROUTER_API_KEY` |
| SerpApi | Google AI Mode engine | `SERPAPI_KEY` |
| Stripe (Spanish account `acct_1Tzui063lspobjfO`, API version `2026-07-29.dahlia`) | Payment Links, invoices, webhook with 5 events | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_CHECKOUT_LINKS` |
| Resend | Transactional email (alerts, affiliate mail, plan notices) | `RESEND_API_KEY`, `ADMIN_ALERT_EMAIL` |
| Gmail API (OAuth refresh token, read-only) | Inbound reply poller for outbound sales; code deployed, credentials not yet set | `GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET`, `GMAIL_REFRESH_TOKEN`, `GMAIL_USER` |
| HubSpot | Lead push from the free audit | `HUBSPOT_API_KEY` |
| Ayrshare | Social auto-posting | `AYRSHARE_*`, `PUBLISHING_PROVIDER` |
| Firecrawl | Site crawling for audits and contact routes | `FIRECRAWL_API_KEY` |
| IndexNow | Sitemap pings to Bing, Yandex, Seznam, Naver | `INDEXNOW_KEY` |

Internal secrets: `CRON_SECRET` (cron caller), `INTERNAL_AUDIT_KEY`
(server-to-server audits), `FORCE_INDEX_KEY`, `IP_HASH_PEPPER`. Spend
guardrails: `PLATFORM_MONTHLY_API_BUDGET_EUR`, `PROSPECTING_MONTHLY_BUDGET_EUR`,
plus a per-plan monthly API budget enforced in `_cost.js`. All variables live
in Netlify's environment, read at deploy time. The Netlify CLI on the dev
machine is broken, so variable presence is proven by the function's own
response, never by the CLI.

## 8. CI, testing, release discipline

- No CI service. Tests are plain Node assertion scripts in
  `brandgeo-dashboard/tests/` (28 files, run with `node tests/<file>.test.js`
  from that folder) plus shell and Python checks in `scripts/` (funnel path,
  contract gate, link checks, published-claim checks). They run locally
  before a push. One test (`package_provisioning.test.js`) has been red since
  the 2026-08 billing migration and is owed a fix.
- A git pre-push hook blocks dashboard pushes unless `BATCH_PUSH=1` is set, to
  cap Netlify builds at roughly two a day (build credits are the constraint).
  Docs-only pushes are cancelled by Netlify's `ignore` rule and show as
  "Canceled", which is intended.
- Deploys are verified by fetching the live bundle name and grepping a string
  unique to the change, or by `published_deploy.commit_ref`, never by
  comparing a local `dist/` hash (Netlify resolves a different dependency set).
- Branching: single `main`, several sessions committing in parallel by
  pathspec, git commands serialised. No PR flow today.

## 9. Observability

- `public.job_runs` for every scheduled run (ok flag plus a `detail` JSON;
  read `detail`, the `ok` flag only says a submitter was configured).
- Netlify function logs (console, `[FunctionName/invId]` prefix) in the
  Netlify UI. No log shipping, no metrics, no alerting beyond admin emails
  through Resend for specific events (checkout without acceptance, account
  deleted, budget blocks).
- Supabase dashboard advisors for RLS and function hygiene; `pg_stat` through
  the SQL editor.
- Stripe Dashboard for billing state; `clients.stripe_customer_id` is sparse,
  the real join is `Customer.metadata.client_id`.

## 10. Legacy and side components

- `brandgeo/backend/` is the original Python collector (SQLAlchemy,
  APScheduler, Streamlit dashboard, trafilatura). It is orphaned from
  production; collection moved to the Netlify functions in 2026-07.
- `scripts/` holds the article generator, Stripe catalogue and deal-code
  scripts (PowerShell and Node), and the local QA checks.
- `.claude/` holds the agent operating system (agents, handoff packets) used
  to build the product; not part of the deployed stack.

## 11. What a DevOps engineer would want to raise first

1. Secrets live only in Netlify's env UI; there is no vault outside Supabase
   Vault for the cron secret, and one restricted Stripe key was exposed in a
   session transcript and is still owed a rotation.
2. Shared cPanel for the marketing site: the deploy webhook has no external
   success signal, pushes over 20 commits under-deploy silently, and
   `deploy-secret.php` is inside the docroot.
3. No staging environment. Migrations run against production by hand, with
   the file committed afterwards.
4. No automated test run on push; no error tracking (Sentry or equivalent) on
   either surface; no uptime check.
5. Netlify build credits, not compute, are the scaling constraint today; the
   batching hook is the mitigation.
6. The Supabase service key is used by every function, so `_auth.js` is the
   single tenant boundary on the server side and deserves the same review
   cadence as RLS.
