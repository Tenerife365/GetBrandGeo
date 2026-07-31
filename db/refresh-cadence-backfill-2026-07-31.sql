-- ============================================================================
-- refresh-cadence-backfill-2026-07-31.sql
--
-- THIS IS NOT A MIGRATION AND MUST NOT BE APPLIED WITH THE OTHERS.
--
-- Nothing in this file runs by itself. Every statement that CHANGES anything is
-- commented out. Only Constantin runs it, deliberately, one block at a time, in
-- the Supabase SQL Editor for project duiyifepitvugyulobqm
-- (https://supabase.com/dashboard/project/duiyifepitvugyulobqm/sql/new).
--
-- WHY IT EXISTS. On 2026-07-31 automatic collection cadence became real: every
-- path that establishes a plan (provision-account, onboard-client,
-- stripe-webhook, set-client-plan, expire-plan-grants) now writes
-- clients.refresh_cadence derived from the tier, so schedule-collections.js
-- finally does something. NO SCHEMA CHANGE WAS NEEDED — refresh_cadence and
-- last_refresh_at have existed since db/supabase-collection-queue-migration.sql
-- section 4 — and DELIBERATELY NO EXISTING CLIENT WAS TOUCHED.
--
-- So the change is forward-only: a client provisioned or re-planned from now on
-- gets a cadence; the 36 rows that already exist stay on 'manual' and stay inert.
-- Switching THEM on starts recurring spend against clients who are already
-- paying and already collected, which is a decision for the owner, not for a
-- code change. This file is that decision, written out so it can be made once
-- and correctly.
--
-- ─────────────────────────────────────────────────────────────────────────────
-- READ ALL FOUR WARNINGS BEFORE UNCOMMENTING ANYTHING.
--
-- W1. A SCHEDULED RUN DELETES HISTORY. IT IS NOT AN ADDITIVE COLLECTION.
--     schedule-collections.js enqueues with force:true (its line 120, "scheduled
--     refresh = automated Force Refresh"), and _enqueue.js:144-150 then runs
--       DELETE FROM ai_results
--        WHERE client_id = ? AND prompt_id IN (?) AND llm IN (?)
--     with NO date filter. Every prior row for those prompt/engine pairs is
--     destroyed and recollected, for every engine except the two SerpApi ones.
--     This is documented and deliberate (_enqueue.js "TREND-HISTORY NOTE") but
--     it means the first automatic run REPLACES a client's collection history
--     rather than extending it. Back up ai_results before enabling anyone:
--       CREATE TABLE ai_results_backup_20260731 AS SELECT * FROM ai_results;
--
-- W2. EVERY CLIENT YOU ENABLE FIRES ON THE NEXT HOURLY CRON, ALL AT ONCE.
--     isDue() in schedule-collections.js:57 returns true when last_refresh_at is
--     NULL, and all 36 production rows have it NULL. So a plain cadence UPDATE
--     means every enabled client collects inside the same hour, at :10 past.
--     Block B below staggers them across weekdays instead. Gemini's free tier is
--     1,500 grounded requests a DAY and it is the ceiling worth protecting.
--
-- W3. NEVER ENABLE A category='research' CLIENT. The 27 city-research studies
--     hold 911 ai_results rows between them — the measured evidence the
--     published research pages are written from — and W1 means a scheduled run
--     would delete and re-collect them, silently rewriting published findings.
--     They also sit on plan 'pro' at a EUR 225 monthly budget ceiling each, so
--     enabling them exposes EUR 6,075 a month of ceiling for clients who are not
--     customers. Two independent guards already refuse this in code
--     (refreshCadenceFor in _cost.js, and the .neq('category','research') at
--     schedule-collections.js:96), so even setting the column by hand here would
--     not collect them. Do not test that.
--
-- W4. The euro figures below are MODELLED, not metered. They come from the same
--     costing as PLAN_PROMPTS in src/lib/planConfig.ts, which is the ladder that
--     was signed: five token engines weekly (4.333 runs/month) plus google_ai and
--     ai_overview monthly (MONTHLY_CAPPED_ENGINES). True cash out is lower —
--     gemini is free under 1,500 grounded requests/day and SerpApi is a fixed
--     monthly subscription — so treat these as the ceiling of what shows up in
--     ai_results.cost_eur, not as cash.
-- ============================================================================


-- ── BLOCK A — DRY RUN. Safe. Changes nothing. Run this first. ───────────────
-- Lists exactly which clients would be enabled, the cadence each would get, and
-- what it would cost per month at their CURRENT active prompt count. Compare the
-- totals against what you expect before running anything below.

WITH per_prompt_month AS (
  -- EUR per active prompt per month, at the cadence that plan receives.
  -- weekly engines x 4.333 runs/month, plus the two SerpApi engines once a month.
  SELECT * FROM (VALUES
    ('free',       0.0320, 'monthly'),   -- gemini only, 1 run/month
    ('radar',      0.2817, 'weekly' ),   -- (gemini .032 + claude .033) x 4.333
    ('essentials', 0.7496, 'weekly' ),   -- + chatgpt .108
    ('growth',     0.8173, 'weekly' ),   -- + perplexity .005, + google_ai .046/mo
    ('growth_pro', 0.9729, 'weekly' ),   -- + grok .020, + ai_overview .069/mo
    ('managed',    0.9729, 'weekly' ),
    ('pro',        0.9729, 'weekly' ),
    ('enterprise', 0.9729, 'weekly' )
  ) AS t(plan, eur_per_prompt_month, cadence)
)
-- SCALAR SUBQUERIES, NOT JOINS, AND THAT IS NOT A STYLE CHOICE. Written first
-- with LEFT JOIN prompts + LEFT JOIN ai_results and run against production: the
-- two joins multiply, so client 1 reported 432 active prompts (6 real prompts x
-- 72 result rows) and EUR 420.29 a month instead of EUR 5.84 — every figure 72x
-- too high, on the exact query whose job is to decide whether to start spending.
SELECT
  c.id,
  c.name,
  c.category,
  c.plan,
  c.refresh_cadence                                  AS cadence_now,
  p.cadence                                          AS cadence_would_become,
  (SELECT count(*) FROM public.prompts pr
    WHERE pr.client_id = c.id AND pr.is_active)      AS active_prompts,
  round(((SELECT count(*) FROM public.prompts pr
           WHERE pr.client_id = c.id AND pr.is_active) * p.eur_per_prompt_month)::numeric, 2)
                                                     AS eur_per_month_modelled,
  (SELECT count(*) FROM public.ai_results r
    WHERE r.client_id = c.id)                        AS ai_result_rows_at_risk  -- see W1
FROM public.clients c
JOIN per_prompt_month p ON p.plan = c.plan
WHERE c.category <> 'research'          -- W3. Never relax this line.
  AND c.category <> 'archived'          -- archived clients are not customers
  AND c.refresh_cadence = 'manual'      -- only rows not already enabled
ORDER BY 8 DESC NULLS LAST;

-- Expected result as measured 2026-07-31 (9 rows, EUR 25.53/month total):
--
--   id  plan         prompts  cadence   EUR/month
--   20  growth             8  weekly         6.54
--    1  growth_pro         6  weekly         5.84
--    2  managed            5  weekly         4.86
--    5  managed            4  weekly         3.89
--   19  managed            2  weekly         1.95
--   24  growth             2  weekly         1.63
--   27  essentials         1  weekly         0.75
--   26  free               2  monthly        0.06
--   25  free               0  monthly        0.00   (no prompts -> enqueues nothing)
--   ------------------------------------------------
--   TOTAL                                   25.53 EUR/month
--
-- Two other numbers worth holding next to that one:
--   - Budget CEILING released: EUR 847.50/month (the sum of
--     PLAN_MONTHLY_API_BUDGET_EUR for those 9 rows). 25.53 is what they would
--     spend today; 847.50 is what the caps would allow if their prompt counts
--     grew to the plan maximum.
--   - At FULL plan allowances the same 9 clients would model at EUR 709.32/month.
--     Prompt count, not cadence, is what moves this number.


-- ── BLOCK B — ENABLE. Destructive-ish. Commented out. Owner only. ───────────
-- Sets the cadence AND staggers the first run so the whole book does not collect
-- in the same hour (W2). last_refresh_at is backdated by a per-client offset, so
-- client N becomes due N days from now rather than at the next :10 past the hour.
--
-- Run BLOCK A first and satisfy yourself the list is what you want.
-- Take the ai_results backup in W1 first if the existing history matters.
--
-- UNCOMMENT THE FOUR LINES BELOW TO RUN.
--
-- WITH target AS (
--   SELECT c.id,
--          CASE WHEN c.plan = 'free' THEN 'monthly' ELSE 'weekly' END AS cadence,
--          row_number() OVER (ORDER BY c.id) AS n
--     FROM public.clients c
--    WHERE c.category NOT IN ('research','archived')   -- W3
--      AND c.refresh_cadence = 'manual'
--      -- Narrow this to a chosen few while testing, e.g.:  AND c.id IN (27)
-- )
-- UPDATE public.clients c
--    SET refresh_cadence = t.cadence,
--        -- A weekly client becomes due at last_refresh_at + 7 days, so setting
--        -- it to now() - 7d + n days makes client n due exactly n days from now:
--        -- 9 clients spread over 9 days instead of all inside one hour. Monthly
--        -- clients land ~30 days out either way, which is correct for them.
--        last_refresh_at = now() - interval '7 days' + (t.n * interval '1 day')
--   FROM target t
--  WHERE c.id = t.id;


-- ── BLOCK C — VERIFY. Safe. Run after Block B. ──────────────────────────────
-- Who is enabled, when each becomes due, and the invariant that matters most:
-- research must be zero on the right-hand column, always.

SELECT
  category,
  refresh_cadence,
  count(*)                                                        AS clients,
  min(last_refresh_at)                                            AS earliest_clock,
  count(*) FILTER (WHERE last_refresh_at IS NULL)                 AS due_immediately
FROM public.clients
GROUP BY category, refresh_cadence
ORDER BY category, refresh_cadence;

-- THE ONE ROW THAT MUST NEVER APPEAR: category='research' with a
-- refresh_cadence other than 'manual'. This returns 0 today and must keep
-- returning 0. Code refuses to write it and refuses to act on it; this is the
-- check that says so out loud.
SELECT count(*) AS research_clients_with_a_cadence_MUST_BE_ZERO
  FROM public.clients
 WHERE category = 'research' AND refresh_cadence <> 'manual';


-- ── BLOCK D — DISABLE / ROLL BACK. Safe to run at any time. ────────────────
-- The down path for Block B. Stops all automatic collection immediately; the
-- next hourly cron finds nothing due. Manual "Run collection" is unaffected.
-- Uncomment to run.
--
-- UPDATE public.clients SET refresh_cadence = 'manual' WHERE refresh_cadence <> 'manual';
--
-- To pause the scheduler itself instead of the clients, without deleting the
-- pg_cron job row (use alter_job, NOT unschedule, which deletes it):
--   SELECT cron.alter_job(job_id => (SELECT jobid FROM cron.job WHERE jobname = 'schedule-collections'), active => false);
