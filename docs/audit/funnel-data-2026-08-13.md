# Funnel data audit - 2026-08-13 (DATA seat)

Scope: measured funnel truth for BrandGEO, launch 2026-07-06 through 2026-08-13
(1 month 7 days live). Source: Supabase project `duiyifepitvugyulobqm`
(SELECT-only; every query listed in the Appendix with row counts) plus two
revenue documents read on disk. Convention: **every number is MEASURED via the
appendix query cited as [Qn]** unless explicitly tagged INFERRED. Weeks are
Monday-start; launch day 2026-07-06 was a Monday, so calendar weeks align
exactly with weeks-since-launch. W6 is partial (Aug 10-13).

---

## TL;DR

1. End-to-end funnel, all time since launch: 8 public free audits [Q14], 2 emails captured [Q8], 12 auth signups (of which roughly 5-6 genuinely self-serve, including 1 known competitor and 2 who abandoned before creating a workspace) [Q10], 7 customer workspaces [Q3], 1 customer-triggered collection ever [Q32], 0 organic checkout intents [Q16], 0 self-serve revenue.
2. Cash actually collected, all time: EUR 1.00 on the live Stripe account, and it is the founder's own E2E test. The only real sale is hand-sold: BpR, EUR 3,500 invoice sent 2026-08-02, due 08-04, recorded UNPAID at the last measurement (2026-08-02); nothing in the DB since indicates payment (the mandatory manual provisioning steps never ran [Q30], no client_events after 08-02 [Q4]).
3. "Interest in the first weeks, then quiet" is REAL but flattering. The "interest" was weeks 2-3 (Jul 13-26): 8 of 12 signups, 6 of 7 customer workspaces, 40 manual collection runs. Most of it was the founder onboarding people by hand: 14 of the 15 customer-side collection runs in the product's entire life were triggered by the admin account [Q32].
4. The drop is absolute and precisely dated. Last organic self-serve signup: 2026-07-23. One late signup 2026-08-02 (Doctor Mihail). Since 2026-08-02 19:41 UTC: zero new users [Q7], zero new clients [Q25], zero terms acceptances [Q16], zero customer sign-ins [Q10]. Only 1 of 13 users signed in during the last 7 days (the admin) [Q6].
5. Weekly ai_results: 334, 59, 639, 5, 111, 248 [Q17]. Everything after Jul 26 is the founder's own clients (BpR 251, BrandGEO 105) plus one scheduled cron run (Doctor Mihail, 6) and 2 admin-run rows for Ai Fy [Q27].
6. Verdict on which metric turned quiet first: the top of funnel was never loud. Public audits peaked at 3 per week [Q14]; the middle (signups, workspaces) peaked Jul 20-23 and died 07-24; the bottom (checkout) has never had a single non-founder event.
7. The suspected free-tier first-run billing errors do NOT appear as error rows: free clients have zero error rows [Q19]; the 58 quota_exceeded errors are week 1 (research batch + BpR), before the free tier existed [Q18]. Caveat: a budget-gate refusal writes no row, so absence here is not proof of absence.

---

## Weekly funnel table

All MEASURED. "Audits" = public prospect_audits (internal batches shown in the
note below). "Clients" = all clients created (customer-side in parentheses:
external, non-research, non-test, non-internal). "Activated" = customer-side
clients created that week that ever got at least 1 ok result. "2nd day" =
customer-side clients whose second distinct collection day fell in that week.
"Intents" = terms_acceptances (the accept-terms gate before a Stripe link).
"Checkouts" = Stripe `checkout.session.completed` webhook events.

| Week | Dates | Audits [Q14] | Leads [Q8] | Signups [Q5] | Clients [Q3] | Activated [Q15] | 2nd day [Q15] | Intents [Q16] | Checkouts [Q24] |
|---|---|---|---|---|---|---|---|---|---|
| pre | before Jul 6 | 0 | 0 | 1 (admin) | 2 (0) | n/a | n/a | 0 | 0 |
| W1 | Jul 6-12 | 1 | 1 | 2 | 8 (1) | 1/1 | 0 | 0 | 0 |
| W2 | Jul 13-19 | 0 | 0 | 3 | 3 (2) | 2/2 | 0 | 0 | 0 |
| W3 | Jul 20-26 | 2 | 0 | 5 | 23 (3) | 2/3 | 1 | 0 | 0 |
| W4 | Jul 27-Aug 2 | 2 | 1 | 2 | 2 (1) | 1/1 | 1 | 12 | 3 |
| W5 | Aug 3-9 | 3 | 0 | 0 | 0 (0) | 0 | 0 | 0 | 0 |
| W6 | Aug 10-13 (4d) | 0 | 0 | 0 | 0 (0) | 0 | 0 | 0 | 0 |
| Total | | 8 | 2 | 13 | 38 (7) | 6/7 | 2 | 12 | 3 |

Notes, all MEASURED unless tagged:

- Internal audits excluded above: 55 rows created_via='internal' (1 in W1, 54
  in W2, a prospecting batch across 37 distinct domains) [Q13, Q14]. Counting
  them as demand would overstate the top of funnel by 7x.
- Both leads correspond to the 2 audit email captures; 1 of 2 has
  `hubspot_error` set, 0 of 2 synced to HubSpot [Q8].
- W3's 5 signups include the Slatehq competitor (never confirmed email, never
  signed in), BrandGEO's own second viewer, and 1 orphan user with no profile;
  W4's 2 include another orphan [Q10]. Orphans = auth user exists, no
  user_profile row: stopped before workspace creation, or the cascade remnant
  of a deleted client (path INFERRED, existence MEASURED).
- All 12 checkout intents sit in W4: 10 on 2026-07-31 covering every plan and
  period combination within hours of the terms gate shipping, 2 radar on
  2026-08-02 [Q16]. Only 1 of 12 ever matched a Stripe session, and
  admin_notifications ties that session to client 1 (an Essentials
  subscription created 14:01 and canceled 14:06 the same day) [Q31]. The 3
  checkouts are that test plus the EUR 1 E2E package test, twice [Q24, Q31].
  Founder-testing attribution is INFERRED from those timings and the billing
  handoff doc; the counts themselves are MEASURED.
- The homepage free-audit CTA rework (92 of 98 pages now point at the audit)
  went live 2026-08-02 and the rebuilt homepage 2026-08-07; W5's 3 public
  audits are the highest weekly count on record but still single digits.

## ai_results volume, status and cost per week [Q17, Q18]

| Week | ok | error | error codes | cost EUR |
|---|---|---|---|---|
| W1 | 276 | 58 | quota_exceeded 58 | 0.00 (cost untracked then) |
| W2 | 52 | 7 | empty_response 7 | 1.59 |
| W3 | 630 | 9 | empty_response 9 | 16.09 |
| W4 | 5 | 0 | | 0.20 |
| W5 | 111 | 0 | | 5.88 |
| W6 (4d) | 246 | 2 | timeout 2 | 13.36 |
| Total | 1,320 | 76 | | 37.12 |

- Total rows 1,396 [Q25]; earliest row 2026-07-06 12:03 UTC, so this table has
  no pre-launch content (older single-tenant BpR data lives in the `archive`
  schema, out of scope) [Q25, Q2-list].
- W1's 58 quota_exceeded = the 7-city research batch (8 each = 56) plus 2 BpR
  rows [Q15, Q18]. W2/W3 empty_response are google_ai engine rows (e.g. Edyta
  5 of 8 google_ai attempts) [Q19].
- Attribution since Jul 27 [Q27]: W4 = BpR 3 + Ai Fy 2 (total 5, the crater
  week). W5 = BrandGEO (own brand, homepage hero refresh) 105 + Doctor Mihail
  (scheduled) 6. W6 = BpR 248. In other words, since Jul 27 no result row was
  produced by a customer's own action.
- Prompt creation matches: since Jul 27 only Doctor Mihail (3), BrandGEO (10),
  BpR (34) created prompts [Q29].

## Activation cohort: customer-side clients

Full per-client cohort in [Q15]; collection-run attribution in [Q32]; sign-ins
in [Q10]. Path column is INFERRED from plan_source, admin_notifications, event
rows and documented history; everything else MEASURED.

| Client | Created | Path | Plan | Prompts | Results (ok/err) | Days | First res | Last res | Runs triggered by | Last sign-in |
|---|---|---|---|---|---|---|---|---|---|---|
| Paunescu & Asociatii | 07-07 | admin-onboarded | managed | 4 | 12/0 | 1 | 07-19 | 07-19 | admin (2 runs) | 07-21 |
| Edyta Andrzejczak | 07-16 | admin-onboarded, user invited 07-17 | growth | 8 | 35/5 | 1 | 07-16 | 07-16 | admin | 07-17 |
| Restaurante Transilvania | 07-18 | comped (plan_source=comp, comp_grant event) | growth | 2 | 8/2 | 2 | 07-18 | 07-21 | admin (both days) | 07-21 |
| Slatehq | 07-21 | self-serve (competitor recon) | free | 0 | 0/0 | 0 | - | - | none | never (email unconfirmed) |
| Ai Fy | 07-23 | self-serve (only new_signup notification ever) | free | 2 | 4/0 | 2 | 07-23 | 07-31 | SELF 07-23 (chatgpt x2); admin 07-31 (gemini x2) | 07-23 |
| Alexandru Teodor | 07-23 | ambiguous (essentials, onboarding_complete=false) | essentials | 1 | 3/0 | 1 | 07-23 | 07-23 | admin (5 runs) | 07-23 |
| Doctor Mihail | 08-02 | self-serve signup, plan set to radar (no payment attached) | radar | 3 | 6/0 | 1 | 08-09 | 08-09 | admin manual 08-02 (produced 0 rows); cron 08-09 | 08-02 |

Reference rows (internal / hand-sold / test / research) [Q15]:

- BpR (hand-sold, growth_pro): 38 prompts, 277 results, 8 distinct days,
  07-07 to 08-12. Founder-operated.
- BrandGEO (own): 84 prompts, 131 results, 5 days, 07-06 to 08-08.
- Talentwelove (internal): 2 prompts, 2 results, 1 day (07-19).
- ZZ E2E TEST (delete-after-08-03 test): 0 prompts, 0 results.
- Research batch: 27 clients (7 on 07-10, 20 on 07-24), 6-8 prompts each,
  30-73 results each, every one exactly 1 collection day.

**Self-serve funnel arithmetic** (definite self-serve = Slatehq, Ai Fy,
Doctor Mihail, plus 2 orphan users; Alexandru Teodor uncertain):

- Signed up: 5 (6 with Alexandru)
- Reached a workspace: 3 of 5 (both orphans stopped before one)
- Created at least 1 prompt: 2 of 5 (Ai Fy, Doctor Mihail; 3 of 6 with Alexandru)
- Got at least 1 result: 2 of 5 (3 of 6)
- Triggered a collection themselves: 1 (Ai Fy, 2026-07-23, the only
  customer-triggered collection run in the product's history) [Q32]
- Came back for a second distinct collection day on their own: **0**
  (both second days in the funnel table were admin-triggered) [Q32]
- Doctor Mihail's only data arrived 7 days after signup via the weekly cron,
  5 days after his last recorded sign-in: his first session showed an empty
  workspace and no session since has seen the data [Q10, Q15, Q32].

## Plan, category, cadence distribution (38 clients) [Q3]

- Plan: pro 27 (all research), managed 3 (BrandGEO, Paunescu, Talentwelove),
  growth_pro 2 (BpR, ZZ test), growth 2 (Edyta, Restaurante), free 2
  (Slatehq, Ai Fy), essentials 1 (Alexandru), radar 1 (Doctor Mihail).
- Category: active 10, research 27, free 1 (Ai Fy; note Slatehq carries
  category=active, so category alone does not isolate customers).
- Type: company 37, individual 1 (Edyta).
- refresh_cadence: manual 36, weekly 2 (ZZ test with 0 prompts, and Doctor
  Mihail). So exactly ONE client produces automated recurring data.
- Users: 13 auth users; roles: 1 admin, 10 viewers, 2 without profile [Q10].
  Sign-in recency: 1 in last 7 days, 4 in last 14, 12 in last 30; most recent
  sign-in of anyone 2026-08-08 (admin), of any customer 2026-08-02 [Q6, Q10].

## Ops health relevant to the funnel [Q2, Q28, Q22, Q23]

- schedule-collections: 397 runs, 397 ok, hourly, last 2026-08-13 04:10 UTC.
  Recent runs all report enqueued 0, totalJobs 0. It has produced exactly 1
  scheduled collection run ever (Doctor Mihail, 08-09) [Q32].
- ping-sitemap 15/16 ok; expire-plan-grants 16/16 ok.
- admin_notifications all-time: 1 new_signup (Ai Fy 07-23), 1 subscription_new
  + 1 subscription_canceled (client 1, 07-31, five minutes apart), 2
  package_purchased (E2E test 08-02). No checkout_without_acceptance event has
  ever fired [Q22, Q31].
- promotions: 1 row, BPR100, 10 percent, plans [growth_pro], active, ends
  2027-05-31 [Q23]. Nothing on the checkout path reads this table (documented
  in CLAUDE.md; INFERRED for this file).

## Revenue truth (docs, not Stripe API, per brief)

Sources: `docs/qa/s21-revenue-report-simulate-2026-08-02.md` (real Stripe
aggregates as of 2026-08-02), `handoff-billing-2026-08-02.md` top block and
its later same-day UPDATE, `docs/ROADMAP.md` INV-35 entry. DB cross-checks as
cited.

- The live (Spanish) Stripe account has exactly 2 invoices as of 2026-08-02:
  INV-35 (BpR founding package) EUR 3,500.00, status open, amount_paid 0, due
  2026-08-04; and a EUR 1.00 E2E test invoice, paid.
- **Paid revenue collected, all time, live account: EUR 1.00**, and the payer
  is the founder's own test. The retired Romanian account collected EUR 1.50
  lifetime, also founder tests. **Zero cash has ever been collected from an
  external customer.**
- **Real paying customers: 1 contracted (BpR, hand-sold, EUR 3,500 for 10
  months of Growth PRO), 0 confirmed collected.** Whether INV-35 was paid
  between 08-03 and today is NOT knowable from this DB: `stripe-webhook.js`
  does not handle `invoice.paid`, and the runbook that must run on payment
  (set plan_source='package', plan_grant_until='2027-06-02', write a
  client_events row) has not been executed: BpR still has plan_source null,
  plan_grant_until null [Q30], and client_events has nothing after 08-02
  [Q4]. The BpR row's subscription_started_at 2026-07-30 / paid_until
  2027-07-30 predate the invoice and do not match its printed term
  (activation on payment, through 2027-06-02), so they are not evidence of
  payment [Q30 vs handoff doc]. INFERRED: most likely still unpaid or paid
  and unprocessed; needs a Stripe Dashboard check by the founder.
- Doctor Mihail carries the paid `radar` plan label with no Stripe customer,
  no subscription, no invoice in the 08-02 Stripe read [Q30, simulate doc].
  No money is measured behind that plan.
- Self-serve subscription MRR: EUR 0. The only subscription ever created
  (Essentials, 07-31) was canceled 5 minutes later, both events on client 1
  [Q31, Q24].
- Measured API cost since cost tracking began: EUR 37.12 [Q17], against EUR
  1.00 collected.

## Data gaps (what this DB cannot answer)

- **Marketing-site traffic.** Not in the DB. Plausible was the site's
  analytics; a 2026-08-07 roadmap commit (5e789a8, "Plausible's removal
  changes what analytics can see") records its removal, so even the founder's
  Plausible account may have nothing after early August. Audits-per-visitor,
  bounce, and CTA click-through are unknowable here.
- **Whether INV-35 (EUR 3,500) has been paid since 2026-08-02.** Stripe
  Dashboard only; the webhook cannot record it (see Revenue truth).
- **Payments on the old Romanian account's still-active payment links.** Such
  a payment would capture money and provision nothing here (documented in the
  billing handoff); this DB would show no trace.
- **Last-login IS tracked** (auth.users.last_sign_in_at), answering the
  brief's question, with one caveat: a persisted session can return to the
  app without a new sign-in event, so recency slightly understates passive
  revisits. It cannot overstate them.
- **Audit abandonment / page funnel.** prospect_audits records only completed
  audit rows; there is no page-view or step-abandonment event stream. Whether
  the 07-31 acceptance cluster contains any real prospect among the founder
  tests cannot be fully separated (attribution INFERRED from timing).
- **Cold outbound (S8 / Instantly / trybrandgeo.com)** lives entirely outside
  this DB; if the sprint's outbound started, none of its volume or replies
  are visible here.
- **HubSpot state** beyond the stored hubspot_error text on 1 of 2 leads.
- Tables enumerated but out of scope for this audit: assistant_events,
  social_* (posting pipeline), seo_*, tickets, contracts/quotes/subscribers
  (all three empty [Q25]), collection_jobs, recommendations.

---

## Appendix: queries run (Supabase project duiyifepitvugyulobqm, SELECT only)

Row counts are result rows returned, not table sizes, unless stated.

- Q1 (11 rows): `SELECT table_name, string_agg(column_name||':'||data_type, ', ' ORDER BY ordinal_position) FROM information_schema.columns WHERE table_schema='public' AND table_name IN ('clients','user_profiles','prompts','ai_results','client_events','prospect_leads','terms_acceptances','job_runs','sitemap_pings','promotions','competitors') GROUP BY table_name;`
- Q2 (66 rows): `SELECT table_schema, table_name FROM information_schema.tables WHERE table_schema IN ('public','auth','archive') AND table_type='BASE TABLE' ORDER BY 1,2;` (39 public, 23 auth, 4 archive)
- Q2b (3 rows): `SELECT job, count(*), count(*) FILTER (WHERE ok), min(ran_at)::date, max(ran_at), max(ran_at) FILTER (WHERE ok) FROM job_runs GROUP BY 1;`
- Q3 (38 rows): `SELECT id, name, slug, plan, category, type, refresh_cadence, plan_source, onboarding_complete, created_at::date, subscription_started_at, paid_until, (stripe_customer_id IS NOT NULL) FROM clients ORDER BY created_at;`
- Q4 (4 rows): `SELECT type, count(*), min(created_at)::date, max(created_at)::date FROM client_events GROUP BY 1;` (onboarded 1, comp_grant 1, stripe_change 1, plan_change 1; latest 2026-08-02)
- Q5 (5 rows): `SELECT date_trunc('week', created_at)::date, count(*), count(*) FILTER (WHERE email_confirmed_at IS NOT NULL) FROM auth.users GROUP BY 1 ORDER BY 1;`
- Q6 (1 row): `SELECT count(*), count(*) FILTER (WHERE last_sign_in_at >= now()-interval '7 days'), ... '14 days', ... '30 days', max(last_sign_in_at) FROM auth.users;` (13 / 1 / 4 / 12 / 2026-08-08)
- Q7 (via Q25): `max(auth.users.created_at)` = 2026-08-02 19:41:15 UTC.
- Q8 (2 rows): `SELECT date_trunc('week', created_at)::date, count(*), count(*) FILTER (WHERE hubspot_error IS NOT NULL), count(*) FILTER (WHERE hubspot_synced), count(DISTINCT domain) FROM prospect_leads GROUP BY 1;`
- Q9 (6 rows): columns of prospect_audits, signup_attempts, subscribers, admin_notifications, collection_runs, user_clients from information_schema.
- Q10 (13 rows): `SELECT u.created_at::date, p.role, p.client_id, c.name, c.category, u.last_sign_in_at::date, (u.email_confirmed_at IS NOT NULL) FROM auth.users u LEFT JOIN user_profiles p ON p.id=u.id LEFT JOIN clients c ON c.id=p.client_id ORDER BY u.created_at;`
- Q11 (3 rows): `SELECT date_trunc('week', created_at)::date, count(*) FROM signup_attempts GROUP BY 1;` (3 / 1 / 1, weeks of 07-13, 07-20, 07-27)
- Q12 (2 rows): `SELECT status, created_via, count(*) FROM prospect_audits GROUP BY 1,2;` (ready+internal 55, ready+public 8)
- Q13 (5 rows): `SELECT date_trunc('week', created_at)::date, count(*), count(*) FILTER (WHERE status='complete'), count(email_captured_at), count(*) FILTER (WHERE unlocked), count(DISTINCT domain) FROM prospect_audits GROUP BY 1;`
- Q14 (6 rows): `SELECT date_trunc('week', created_at)::date, created_via, count(*), count(email_captured_at) FROM prospect_audits GROUP BY 1,2 ORDER BY 1,2;`
- Q15 (38 rows): per-client cohort: `SELECT c.id, c.name, c.category, c.plan, c.created_at::date, (SELECT count(*) FROM prompts p WHERE p.client_id=c.id), (SELECT count(*) FROM ai_results r WHERE r.client_id=c.id), (SELECT count(*) FROM ai_results r WHERE r.client_id=c.id AND r.status='error'), (SELECT count(DISTINCT COALESCE(r.checked_at,r.created_at)::date) FROM ai_results r WHERE r.client_id=c.id), (SELECT min(...)::date), (SELECT max(...)::date) FROM clients c ORDER BY c.created_at;`
- Q16 (12 rows): `SELECT created_at::date, plan, period, reference, terms_version, (stripe_session_id IS NOT NULL), (matched_at IS NOT NULL) FROM terms_acceptances ORDER BY created_at;`
- Q17 (10 rows): `SELECT date_trunc('week', COALESCE(checked_at, created_at))::date, status, count(*), round(sum(COALESCE(cost_eur,0))::numeric,2) FROM ai_results GROUP BY 1,2 ORDER BY 1,2;`
- Q18 (4 rows): `SELECT date_trunc('week', COALESCE(checked_at, created_at))::date, error_code, count(*) FROM ai_results WHERE status='error' GROUP BY 1,2;`
- Q19 (13 rows): `SELECT client_id, COALESCE(checked_at, created_at)::date, llm, status, error_code, count(*) FROM ai_results WHERE client_id IN (20,26,27,52) GROUP BY 1,2,3,4,5 ORDER BY 1,2,3;`
- Q20 (3 rows): columns of stripe_events, contracts, quotes from information_schema.
- Q21 (6 rows): `SELECT date_trunc('week', created_at)::date, trigger, count(*), count(DISTINCT client_id) FROM collection_runs GROUP BY 1,2 ORDER BY 1,2;`
- Q22 (4 rows): `SELECT type, count(*), min(created_at)::date, max(created_at)::date FROM admin_notifications GROUP BY 1;`
- Q23 (1 row): `SELECT id, label, code, discount_type, value, plans, active, starts_at::date, ends_at::date, created_at::date FROM promotions;`
- Q24 (2 rows): `SELECT type, count(*), min(received_at)::date, max(received_at)::date FROM stripe_events GROUP BY 1;` (checkout.session.completed 3, customer.subscription.deleted 1; all 07-31 to 08-02)
- Q25 (12 rows): scalar union: prompts_total 320, subscribers 0, contracts 0, quotes 0, user_clients_rows 0, min ai_result 2026-07-06 12:03, max client created 2026-08-02 19:41:15, max auth user created 2026-08-02 19:41:15, ai_results_total 1396, terms_acceptances 12, prospect_audits 63, prospect_leads 2.
- Q26 (7 rows): `SELECT date_trunc('week', created_at)::date, count(*), count(DISTINCT client_id) FROM prompts GROUP BY 1 ORDER BY 1;`
- Q27 (5 rows): `SELECT date_trunc('week', COALESCE(r.checked_at, r.created_at))::date, r.client_id, c.name, count(*) FROM ai_results r LEFT JOIN clients c ON c.id=r.client_id WHERE COALESCE(r.checked_at, r.created_at) >= '2026-07-27' GROUP BY 1,2,3 ORDER BY 1,4 DESC;`
- Q28 (5 rows): `SELECT ran_at, ok, detail FROM job_runs WHERE job='schedule-collections' ORDER BY ran_at DESC LIMIT 5;` (all enqueued 0)
- Q29 (3 rows): `SELECT date_trunc('week', p.created_at)::date, p.client_id, c.name, count(*) FROM prompts p LEFT JOIN clients c ON c.id=p.client_id WHERE p.created_at >= '2026-07-27' GROUP BY 1,2,3;`
- Q30 (3 rows): `SELECT id, name, plan, plan_source, plan_grant_until, plan_grant_note, subscription_started_at, paid_until, (stripe_customer_id IS NOT NULL), (stripe_subscription_id IS NOT NULL) FROM clients WHERE id IN (1,51,52);`
- Q31 (5 rows): `SELECT id, type, client_id, title, created_at FROM admin_notifications ORDER BY created_at;`
- Q32 (15 rows): `SELECT r.client_id, c.name, r.created_at::date, r.trigger, (SELECT p.role FROM user_profiles p WHERE p.id=r.created_by), (SELECT p.client_id FROM user_profiles p WHERE p.id=r.created_by) FROM collection_runs r LEFT JOIN clients c ON c.id=r.client_id WHERE r.client_id IN (5,19,20,24,25,26,27,52) ORDER BY r.created_at;` (14 admin-triggered, 1 viewer-triggered: Ai Fy 07-23, 1 scheduled)

Two queries errored and were corrected or discarded: one call with a mistyped
project id (permission error, no data), and the first version of Q27 (ambiguous
column, rerun with table aliases). Documents read: the S21 simulate report, the
billing handoff top block and update, ROADMAP.md's INV-35 entry, and git log
(read-only) for commit dating.
