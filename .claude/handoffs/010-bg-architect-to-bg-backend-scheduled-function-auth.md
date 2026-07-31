---
id: 010
from: bg-architect
to: bg-backend
status: READY
created: 2026-07-27
scope_write: brandgeo-dashboard/netlify/functions/_cron_auth.js, brandgeo-dashboard/netlify/functions/expire-plan-grants.js, brandgeo-dashboard/netlify/functions/schedule-collections.js, brandgeo-dashboard/netlify/functions/ping-sitemap.js, brandgeo-dashboard/netlify/functions/purge-old-results.js, brandgeo-dashboard/netlify/functions/purge-old-audits.js, brandgeo-dashboard/netlify.toml, db/supabase-scheduled-jobs-migration.sql
scope_read: docs/arch/scheduled-function-auth.md, docs/qa/deploy-pipeline-netlify.md, brandgeo-dashboard/netlify/functions/force-index.js, brandgeo-dashboard/netlify/functions/collection-worker-background.js, brandgeo-dashboard/netlify/functions/_auth.js, brandgeo-dashboard/netlify/functions/_enqueue.js, brandgeo-dashboard/netlify/functions/_email.js, brandgeo-dashboard/netlify/functions/_admin_notify.js, brandgeo-dashboard/netlify/functions/_indexing.js, db/supabase-collection-queue-migration.sql, db/supabase-sitemap-pings-migration.sql
model: opus
---

## Decision

`docs/arch/scheduled-function-auth.md` is binding. Netlify's scheduled-invocation
signal is not a credential and cannot be gated on; the shared secret wins, which
forces the caller to change. Supabase `pg_cron` becomes the scheduler: it is
already installed and has fired successfully every day for 12 days, and its
history is queryable in SQL. Two of the five functions are pure SQL and are
deleted rather than gated, so the public surface drops from five endpoints to
three and both service-key `DELETE` endpoints stop existing.

## Do

1. **Write `_cron_auth.js`** exporting `requireCronAuth(event)`, to the contract
   in the arch doc §6.1: `405` on non-POST, **`503` when `CRON_SECRET` is unset**,
   `401` with exactly `{"error":"unauthorized"}` on a missing or wrong
   `X-Cron-Key`, `null` on pass. Compare with `crypto.timingSafeEqual` behind an
   explicit length check. No CORS, no `OPTIONS`, no `_auth.js`, no origin logic.
2. **Delete `purge-old-results.js`.** pg_cron jobid 1 `purge-old-ai-results` has
   been running the identical delete on the identical schedule since at least
   2026-07-16, verified in `cron.job_run_details`. Before deleting, diff its
   cutoff (`purge-old-results.js:18` to `:24`) against jobid 1's command and say
   in your completion note whether they are equivalent. If they are not, stop and
   write a BLOCKED packet.
3. **Delete `purge-old-audits.js`** and reproduce its two deletes
   (`:30` to `:38`, 90-day `prospect_audits`, 180-day `prospect_leads`) as a
   direct SQL pg_cron job in the migration.
4. **Gate the three survivors**: `expire-plan-grants.js`, `schedule-collections.js`,
   `ping-sitemap.js`. `requireCronAuth` first line of each handler, return its
   response when non-null. Change no business logic in any of them.
5. **Add a `job_runs` write** to each of those three, on both the success and the
   failure return path, carrying the summary each already computes and currently
   only logs. Table shape and RLS posture: arch doc §6.4.
6. **Edit `netlify.toml`**: remove all five `schedule` keys; delete the
   `purge-old-results` and `purge-old-audits` blocks entirely; give
   `expire-plan-grants` and `schedule-collections` `timeout = 26` with a one-line
   comment saying why (they loop per client with sequential awaits and have been
   inheriting 10s); leave `ping-sitemap`'s existing `timeout = 26`.
7. **Write `db/supabase-scheduled-jobs-migration.sql`**, re-runnable, matching
   the `db/` convention. It creates `job_runs` (+ index, RLS enabled, no
   policies) and schedules the five jobs from arch doc §7.1. Read the secret from
   `vault.decrypted_secrets`; **never put the literal in `cron.job.command`.**
   The `net.http_post` signature and schema are confirmed against the installed
   0.20.3 and recorded in arch doc §7.2. Schema-qualify as `net.http_post`, not
   `extensions.http_post`.
8. **Do not create or modify pg_cron jobid 1.** It exists, it works, leave it.
9. **Hand Constantin the numbered sequence from arch doc §8 and §9** as
   copy-pasteable steps, in order, in your completion note. The order is
   load-bearing: `CRON_SECRET` must exist in Netlify and in Vault, and the
   migration must be applied and verified against the still-ungated functions,
   **before** the gating deploy. A fail-closed gate deployed ahead of the secret
   breaks every job.
10. **State in your completion note whether `pg_net`'s `timeout_milliseconds` can
    terminate an in-flight Netlify invocation** (arch doc §7.3). Measure it or say
    plainly that you did not.

## Do not

- Do not gate on `next_run`, on request body shape, on a `user-agent`, or on any
  `x-nf-` header. Arch doc §2.1: none of it authenticates, and a gate that
  appears to work is worse than none.
- Do not migrate any function to the `schedule()` wrapper or to
  `export const config`. Arch doc §3.2: same platform mechanism, no credential
  gained, and it would force a CommonJS to ESM conversion on functions that
  delete rows and email customers.
- Do not copy the fail-open pattern at `collection-worker-background.js:35` to
  `:43`. A missing environment variable must reject, not accept.
- Do not fix `collection-worker-background.js` itself. Real defect, arch doc §10
  item 1, separate packet.
- Do not fix the Google indexing credential. Arch doc §10 item 2, needs Constantin
  and a Netlify environment variable.
- Do not touch `_auth.js`, `ALLOWED_ORIGINS`, `_plans.js`, `_cost.js`, or anything
  under `brandgeo-dashboard/src/`.
- Do not reuse `INTERNAL_AUDIT_KEY` or `FORCE_INDEX_KEY`, and do not reuse the
  `X-Internal-Key` header name. Arch doc §6.3.
- Do not apply the migration yourself, and do not run any git command. Hand
  Constantin the exact commands.
- Do not put a secret value in any file, commit, packet or completion note.

## Acceptance criteria

- [ ] Unauthenticated `POST` to `expire-plan-grants`, `schedule-collections` and
      `ping-sitemap` returns `401` with body exactly `{"error":"unauthorized"}`.
- [ ] Unauthenticated `POST` to `purge-old-results` and `purge-old-audits`
      returns `404`. The files are gone.
- [ ] A `POST` with a correct `X-Cron-Key` returns each function's normal
      response, unchanged from today's behaviour.
- [ ] `_cron_auth.js` returns `503`, not `200`, when `CRON_SECRET` is unset.
      Demonstrate this with the variable cleared locally.
- [ ] No occurrence of `schedule` remains in `brandgeo-dashboard/netlify.toml`.
- [ ] `expire-plan-grants` and `schedule-collections` each declare `timeout = 26`.
- [ ] `cron.job` holds six active jobs: jobid 1 unmodified, plus the five from
      arch doc §7.1.
- [ ] No row of `cron.job.command` contains a secret literal.
- [ ] `job_runs` exists with RLS enabled and zero policies, and gains a row per
      invocation of each surviving function.
- [ ] Business logic diff is empty for all three survivors: the only changes are
      the gate call and the `job_runs` write.
- [ ] No file outside `scope_write` was modified.

## Open questions for Constantin

None blocking. Status is READY. Three actions are yours and only yours, detailed
in arch doc §9, and the packet cannot complete without the first two:

1. Set `CRON_SECRET` in Netlify site environment variables, and store the same
   value in Supabase Vault as `cron_secret`. Before the gating deploy.
2. Enable the `pg_net` extension in Supabase. `pg_cron` is already installed.
3. After the deploy, confirm no function carries a "Scheduled" badge in the
   Netlify Functions UI. No agent can see that screen, and it is the only proof
   the old schedules are deregistered rather than merely edited in the repo.
