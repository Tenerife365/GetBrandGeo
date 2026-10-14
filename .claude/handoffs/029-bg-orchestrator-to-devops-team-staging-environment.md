---
id: 029
from: bg-orchestrator
to: devops team (bg-architect on Opus for the design, bg-backend on Opus for env, secrets and migrations, bg-app on Sonnet for the one frontend touch, bg-verify on Opus)
status: READY
created: 2026-10-14
scope_write: docs/arch/staging.md, docs/ops/staging-runbook.md, brandgeo-dashboard/netlify.toml, brandgeo-dashboard/netlify/functions/_auth.js, brandgeo-dashboard/src/lib/supabase.ts, db/supabase-schema-baseline-<date>.sql, db/supabase-staging-seed-<date>.sql, scripts/staging-*.ps1, .claude/handoffs/029-*.md (status line only)
scope_read: everything under brandgeo-dashboard/, db/, docs/arch/, docs/TECH-STACK.md, docs/qa/scheduled-function-auth-012-review.md, CLAUDE.md
model: opus (design, backend, verify), sonnet (app)
---

Kickoff line for the new session:

```
Read .claude/handoffs/029-bg-orchestrator-to-devops-team-staging-environment.md and design the staging environment, then build it.
```

## Decision

Constantin, 2026-10-14: "hai sa pregatim si varianta de staging cu o echipa
devops experti". BrandGEO gets a staging environment for the dashboard and
its functions. Migrations and function changes are rehearsed there before
production. The marketing site is out of scope for release one (static
files, lowest risk, previewed locally). Cost is the first constraint: the
Netlify build budget is about two builds a day platform wide, and no paid
tier is added without a ruling.

## What exists today (measured 2026-10-14, do not re-derive)

- One Netlify site (`d51674f3-9579-4208-8b1b-90fc16d64df4`) building
  `brandgeo-dashboard/` from `main`. `netlify.toml` has no `[context.*]`
  blocks; every environment variable has one value for every context. The
  `ignore` rule cancels builds that touch nothing under the folder.
- One Supabase project, `duiyifepitvugyulobqm`, which is production. Eight
  active `pg_cron` jobs call the production functions through `pg_net` with
  a Vault secret. `job_runs` is the scheduler log.
- `db/` holds 52 SQL files. They are a record of migrations applied by hand,
  not a runner: order is by filename date, some were applied in a different
  order, and at least one column (`clients.plan`) has no file at all. Replaying
  them on a fresh database is NOT a supported path and must not be the plan.
- `_auth.js` whitelists exactly three origins (`app.getbrandgeo.com` and two
  localhost ports). A staging origin is refused by every function until it
  is added.
- `src/lib/supabase.ts` reads `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
  at build time; a demo mode renders fixtures when they are missing.
- Stripe is the Spanish live account; every function reads live keys. Stripe
  test mode exists on the same account and has its own keys, webhook secrets
  and Payment Links.
- The Netlify CLI on the dev machine is broken (corrupt npx cache). Variable
  presence is proven by a function's own response. The Supabase CLI state is
  unknown; check `supabase --version` before relying on it.
- The pre-push hook refuses dashboard pushes without `BATCH_PUSH=1`.

## How to run the expert team

One `Workflow`, concurrency 2, no builds and no browsers inside agents
(32 GB RAM, no GPU). Stage 0 is a judge panel, stage 1 is the build.

**Stage 0, three independent designs (Sonnet, effort high), then three Opus
judges.** Each designer gets this packet and `docs/TECH-STACK.md` and
returns a full design for `docs/arch/staging.md`. The three lenses, prompted
so they disagree:

1. **Cheapest viable.** Second free Supabase project, one Netlify branch
   deploy on a `staging` branch using Netlify's `branch-deploy` context for
   variables, Stripe test mode. Target: zero new monthly cost.
2. **Parity first.** Supabase Branching (Pro plan, billed per branch hour)
   or a second Supabase project kept in schema lockstep by a dump and
   restore script; a second Netlify site so staging builds never compete
   with production for the daily build budget; preview deploys per branch.
3. **Rehearsal first.** Optimise for the one thing staging is for here:
   running a migration and a function change against a copy of production
   data before production. Snapshot and restore procedure, anonymised data
   copy, a checklist that every production change passes through.

Judges score each design 1 to 5 on: monthly cost, build budget impact,
blast radius (can staging ever touch production data, keys or customers),
migration rehearsal fidelity, and time to first use. One sentence per
score. The orchestrator synthesises the winner and grafts from the others,
and records what came from where at the end of `docs/arch/staging.md`.

**Stage 1, build (bg-backend on Opus, then bg-app on Sonnet, then
bg-verify on Opus).** Build exactly the synthesised design. Nothing in
production changes except the two items listed under "Allowed production
edits".

## Design constraints the synthesis must honour

- **Schema comes from a dump, not from `db/`.** Staging's schema is a
  `pg_dump --schema-only` (or `supabase db dump`) of production, saved as
  `db/supabase-schema-baseline-<date>.sql` and committed. That file becomes
  the baseline every future migration is written against, and it closes the
  `clients.plan` gap for free. Data is never dumped into git: a seed file
  with `@example.com` fixtures only, no real client, prospect or person.
- **Staging can never reach production.** Separate Supabase URL, anon key,
  service key, Vault secret and `CRON_SECRET`; `pg_cron` jobs in staging
  call staging function URLs only; Stripe test keys and test webhook secret;
  `STRIPE_CHECKOUT_LINKS` points at test mode links; `PLATFORM_MONTHLY_API_BUDGET_EUR`
  set low (EUR 2) so a staging collection cannot spend real LLM money;
  `ADMIN_ALERT_EMAIL` on the project domain. A verifier proves each of these
  by reading the function's response, not the config.
- **Origins.** `_auth.js` gains the staging origin from an environment
  variable (`EXTRA_ALLOWED_ORIGIN`), not a hardcoded fourth entry, so
  production's list is unchanged when the variable is absent.
- **Build budget.** A staging build spends the same Netlify credits as a
  production build. The design states how many builds a week staging is
  allowed and how the pre-push hook treats the `staging` branch. If a
  second Netlify site is chosen, say what it costs on the current plan.
- **Secrets.** No key value passes through chat, a file in the repo, or a
  commit message. The runbook names each variable and where it is set; the
  values are typed by Constantin in the Netlify and Supabase UIs.
- **Migration rehearsal is the acceptance test.** The runbook's final step
  is: take the next real migration in the queue (`db/supabase-client-api-keys-migration-2026-09-22.sql`,
  the MCP stage 1 migration, still unapplied), apply it on staging, run the
  MCP test file against staging, and only then apply it to production. That
  rehearsal is the proof the environment works.

## Allowed production edits

1. `_auth.js`: the `EXTRA_ALLOWED_ORIGIN` read, no behaviour change when
   unset.
2. `netlify.toml`: `[context.branch-deploy]` or `[context.staging]` block
   if the design uses one, with no change to the production context.
Both ride one Netlify build with the next dashboard push.

## Open questions for Constantin (defaults apply if silent)

1. Supabase: second free project (default) or Branching on Pro.
2. Netlify: branch deploy on the existing site (default) or a second site.
3. Who gets staging logins: Constantin only (default) or also the DevOps
   contact.

## Hard rules, binding

- No em or en dashes anywhere. Scan with `rg -n '\x{2014}|\x{2013}'` plus a
  positive control. Never `grep -P` on Git Bash.
- Agents never create accounts, projects, sites or keys on any external
  service. The runbook gives Constantin the exact click path; he creates
  them. Agents build only what git and the repo hold.
- No real person, client or prospect in any committed file (public repo).
- Commit by pathspec only; never sweep other sessions' dirty files. Check
  `.git/index.lock` first. Commands handed to Constantin are PowerShell 5.1
  with Windows paths, one per fenced block.
- Do not apply any migration to production from this packet.

## Done means

1. `docs/arch/staging.md` with the three designs' scores and the synthesis.
2. `docs/ops/staging-runbook.md`: numbered steps, exact variable names, exact
   click paths, the weekly build allowance, and the rehearsal procedure.
3. Schema baseline and seed committed; a PowerShell script that refreshes
   staging's schema from a fresh dump.
4. bg-verify report in `docs/qa/staging-029-review.md` proving the
   isolation list above against the running staging URL, and the MCP
   migration rehearsed on staging with its tests green.
5. Closing message structured Completed / Requires your action / Still
   pending, with every external step as a numbered PowerShell or click list.

## Not in scope

The marketing site, a CI service, automated tests on push, error tracking
and uptime (packet 030), the cPanel pipeline (packet 031).
