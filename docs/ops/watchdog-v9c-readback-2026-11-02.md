# Watchdog V9c read-back, 2026-11-02

Verdict: PASS.

Read at 2026-11-02 06:46Z from Supabase project duiyifepitvugyulobqm, SELECT
only. `cron.job` 10 `obs-watchdog`, schedule `50 * * * *`, scheduled by
Constantin 2026-11-01 23:46Z. The first run fired at 23:50Z, four minutes
later, then every hour.

## public.job_runs, job = obs-watchdog

| id | ran_at (UTC) | ok | detail |
|---|---|---|---|
| 2490 | 2026-11-01 23:50:00 | true | sent 0, findings 0, request_id null, prev_unjudged false |
| 2492 | 2026-11-02 00:50:00 | true | same |
| 2494 | 2026-11-02 01:50:00 | true | same |
| 2496 | 2026-11-02 02:50:00 | true | same |
| 2498 | 2026-11-02 03:50:00 | true | same |
| 2500 | 2026-11-02 04:50:00 | true | same |
| 2503 | 2026-11-02 05:50:00 | true | same |

## cron.job_run_details, jobid 10

Seven rows, runids 2847, 2849, 2851, 2853, 2856, 2861, 2864, all `succeeded`,
return message `1 row`, start times matching the table above.

## ops.alert_log

0 rows. No finding was raised and no email was sent by a scheduled run. The
only mail in the chain is the proof mail from `ops.watchdog_send_test()`
(pg_net request 2534, Resend 200, 2026-11-01 23:44Z).

## Meaning

Every job the watchdog watches ran inside its expected silence window during
the night, so zero findings is the correct result. The chain Vault, pg_net,
Resend is proven by the test mail; the predicates and the hourly schedule are
proven by these seven rows. Nothing is owed on the watchdog. Sentry stays
optional; GitHub secrets wait on `tests/package_provisioning.test.js`.

## Note on the scheduled read-back task

The desktop scheduled task `brandgeo-watchdog-v9c-readback` started at
02:05Z and stalled at 02:06Z on a connector permission prompt, so it never
wrote this file. It was stopped at 06:47Z and this record was written by
hand. A scheduled task that needs a connector must be run once by hand from
its task page so the approval is stored, or it pauses on its first run.
