# Sprint 17 loop log

One section per loop run, newest at the bottom. The loop runs every three hours
and is defined in `C:\Users\const\.claude\scheduled-tasks\brandgeo-sprint17-loop\SKILL.md`.

Read the date on the entry, not the date on this header.

---

## 2026-08-14, 23:00 to 02:30. Baseline, written by the Master Council session.

This is the seed entry. Everything below was measured, not remembered.

### The evidence machine is proven

Step zero passed. `INTERNAL_AUDIT_KEY` is correct and reaches the endpoint.
Every audit written 2026-08-14 carries `unlocked: true`, `status: ready`, and the
public page at `app.getbrandgeo.com/audit/<token>` returns HTTP 200 with no key
sent. The silent gate failure that correction 2 was written to catch does not
exist.

17 audits run, EUR 3.81 spent. Full record on Drive at
`7-Sales/2026-08-14-founder-led-prospecting/60-evidence-run-2026-08-14.md`.

### Five prospects qualified, and ON HOLD

Lawcus, PageLightPrime, IntelliBill, PureClarity, Glood.AI. All five verified
individually: `ai_score` 0, `competitor_flags` non empty, `low_confidence` false,
`unlocked` true, public page 200. Live report URLs are in the Drive file.

**They are held by Constantin's decision and only he releases them.** The reason
is below.

### Why they are held: the score is not defensible yet

Constantin reported losing two prospective customers who saw a 0, checked an AI
engine manually, found themselves ranked well, and concluded the product was
broken. Investigation: `docs/qa/audit-scoring-investigation-2026-08-14.md`.

Three findings, all confirmed against production:

1. **The public audit never sends the brand name.** `_prospect_prompts.js:104`
   instructs the generator, verbatim, never to include it. So a 0 means "not
   named when buyers ask about the category", not "invisible to AI". The founder
   tested their own name, which the product never tests. Both numbers were true.
2. **The scale has a hole.** Five of six dimensions hang off the same
   `brand_mentioned` predicate, so the reachable set is `{0}` or `[33,80]`. No
   audit can score between 1 and 32. Confirmed across all 106 stored audits.
3. **The score was not reproducible.** `revenuehunt.com` scored 54 at 21:48 and
   0 at 21:51 on 2026-08-14, both with full engine coverage, because the prompt
   set was regenerated at `temperature: 0.4` on every call.

Category mean does not predict a domain's score. Three of eight tier 1 rows,
ranked on a 16.3 category mean, measured 68, 55 and 54. CaretLegal is one of the
two domains that produced that mean and now reads 55, so the stored figure is
stale against the live engines. No row goes to outreach on a category average.

### Engineering, complete and UNPUSHED

Four review cycles, `bg-backend` building and `bg-verify` reviewing, verdict
PASS. Every fix carries a test that fails before it and passes after.

Fixed: prompt sets stable per domain via persistence rather than
`temperature: 0`; brand name persisted on both the recovery and fallback paths so
the guarantee reaches all 70 canonical domains after one audit each; tagline
shaped `og:site_name` values rejected rather than turned into junk aliases; and
`reach` brought into parity between `_score.js` and `aiVisibilityScore.ts`.

Findings the reviews caught that would otherwise have shipped: a reuse path that
reintroduced false zeros on the homepage audit, a `low_confidence` guard that
rejected only false positives and caused a regenerate-every-time loop on three
live domains, and a sanitiser gap that turned `"Home | Best CRM Software"` into
the matching alias `Home`, which would have traded false zeros for false wins.

Review record: `docs/qa/scoring-fixes-review-2026-08-14.md`, four sections.

**Residual risk, stated plainly: neither write-back has run against real
Supabase.** Both are proven against mocks only. Step 3 of the deploy order is
what closes that.

### Copy, written and not built

`docs/copy/audit-score-presentation-2026-08-14.md`. Replaces the /100 ring with
the measured fraction, shows the questions actually asked, and pre-empts the
founder objection before they raise it. **Ships with no backend change**, since
it computes from `engine_results`, already in the payload.

It also found the audit error headline reads "Something went wrong", and that the
loading state claims we ask the engines "what they know about your business",
which is false in exactly the way that cost the two subscriptions.

### Owned by Constantin, nothing else moves without these

1. Run `db/supabase-prospect-audits-brand-name-migration.sql` in Supabase
   `duiyifepitvugyulobqm`.
2. Approve the push. **Exclude `_revenue.js`, `revenue-report.js` and
   `Revenue.tsx`**, which belong to another session and still carry 65 em dashes.
3. Then confirm `select count(*) from prospect_audits where brand_name is not
   null;` climbs from 0.
4. Publish the `trybrandgeo.com` DNS records at CyberFolks. Blocks the email lane
   regardless of the scoring work. SOA serial was stuck at 2026081413.
5. Release or extend the hold on the five prospects.
6. Two rulings: whether to add a brand named prompt, and whether to widen the
   sample beyond 2 engines and 4 questions.

### Tracked separately, do not fold into this work

- `tests/package_provisioning.test.js` fails at HEAD in renewal stacking logic.
  Pre-existing, billing, potentially affects a real renewal.
- T2: `buildProspectAliases` emits the lead word of a two word brand as a
  standalone alias, so `casetempo.com` yields `Case` and `financial-cents.com`
  yields `Financial`, both matching answers that never name the brand.
  Pre-existing, inflates scores, 2 of 38 measured.
- F3, F5, F7 from the review, all LOW.

### Segments still absent from every prospect list

US immigration law firms, real estate brokerages, EU agencies.
