# PASS WITH FINDINGS

`plans-drift-fix-006.md`
Owner: `bg-verify` · Packet: `006` (`bg-backend` to `bg-verify`)
Date: 2026-07-26 · HEAD at review: `a896349`
Subject: the uncommitted working-tree change to
`brandgeo-dashboard/netlify/functions/_plans.js` and
`brandgeo-dashboard/netlify/functions/set-client-plan.js`, implementing packet
`005` against `docs/qa/plans-divergence-b1.md` and `docs/arch/activation-path.md`
§3.4 items 1 to 3.

Verdict rationale in one line: all seven of packet `005`'s acceptance criteria
pass under independent re-execution, all four B1 findings are demonstrably
closed, and no file outside `scope_write` was touched. The findings below are
one unverifiable link in the database half of the path (V1) and three
pre-existing or documentation items that do not block this commit.

Nothing in this report was taken from `bg-backend`'s completion note. Every
result below was produced by a command run during this review, and the output is
pasted verbatim.

---

## 1. Calibration (SYSTEM VERIFICATION bg-verify)

**1. `git diff --stat`, and does every changed file appear in `scope_write`?**

```
 brandgeo-dashboard/netlify/functions/_plans.js     | 61 ++++++++++++----------
 .../netlify/functions/set-client-plan.js           |  6 ++-
 2 files changed, 37 insertions(+), 30 deletions(-)
```

```
$ git status --porcelain -- brandgeo-dashboard/
 M brandgeo-dashboard/netlify/functions/_plans.js
 M brandgeo-dashboard/netlify/functions/set-client-plan.js
```

Packet `005` `scope_write` is exactly
`brandgeo-dashboard/netlify/functions/_plans.js,
brandgeo-dashboard/netlify/functions/set-client-plan.js`. Both changed files
appear in it. **No file changed outside `scope_write`.** Nothing is staged
(`git diff --cached --stat` for that path is empty), so the commit command in §8
is what defines the commit contents.

Note on the rest of the working tree: 55 other files show as modified across
`brandgeo/web/`, `CLAUDE.md`, `.claude/agents/README.md` and
`docs/arch/activation-path.md`. None of those belong to this change, none are in
`scope_write`, and the `git add` in §8 names the two paths explicitly rather than
using `-A`, so they cannot be swept in.

**2. Secret scan across the diff, count only.**

```
$ git diff -U0 -- .../_plans.js .../set-client-plan.js \
  | grep -niE "api[_-]?key|secret|token|password|bearer|sk-|pk_live|service_role" | wc -l
0
```

**0 matches.** No value of any kind was printed or inspected.

**3. Acceptance criteria from packet `005`, verbatim, and are they objectively checkable?**

1. The §4 harness in `docs/qa/plans-divergence-b1.md` prints `PASS`, with output
   pasted into the completion note.
2. `isValidPlan(p)` returns `true` for every member of `planConfig.ts`'s `Plan`
   union, `growth_pro` included.
3. `planUnlocks(p).engineLabels` equals `getActiveEngines(p, null)` for every
   `p` in `PLAN_ORDER`.
4. `planRank` agrees between `_plans.js` and `planConfig.ts` for all plans
   (B1 F4).
5. `PLAN_LABELS['growth_pro']` is defined, so `set-client-plan.js:150` no longer
   writes `plan_grant_note` as `"undefined trial"`.
6. Grep proves `PLAN_ENGINES` no longer exists in `_plans.js` and no caller
   references it.
7. No file outside `scope_write` was modified.

All seven are objectively checkable. Criterion 3 needed one adaptation, recorded
here rather than glossed: `getActiveEngines` lives in `planConfig.ts`, which is
TypeScript inside a Vite bundle and cannot be `require`d from Node, which is the
whole reason these mirrors exist. It was checked by transcribing
`planConfig.ts`'s `PLAN_ENGINES` (`:46`), `COMING_SOON_ENGINES` (`:58`),
`ALL_ENGINES` (`:61`) and `getActiveEngines` (`:349`) by hand into the probe in
§3, exactly as B1 §4 duplicates `LADDER` on purpose. A probe that imported the
thing it checks would prove nothing.

Criterion 5 cites `set-client-plan.js:150`. In the current file that line is
`:152`. The line moved by two because of this change's own two added comment
lines at `:116` to `:117`. The cited code is the same statement,
`update.plan_grant_note = note || \`${PLAN_LABELS[plan]} ${grant_type}\``.

**4. `tsc` and build baseline before this change.**

```
$ cd brandgeo-dashboard && npx tsc --noEmit
TSC_EXIT=0
```

Clean, zero errors. **This is a baseline statement, not evidence for this
change.** `brandgeo-dashboard/tsconfig.json` sets `"include": ["src"]`. Neither
changed file is under `src/`, so neither `tsc --noEmit` nor `npm run build`
type-checks, lints, or even reads them. `npm run build` was therefore not run:
it cannot produce evidence about this diff, and reporting a green build as if it
covered these files would be the fabricated pass this role exists to prevent.
The real executable evidence for this change is §2 and §3, which load and call
the changed modules directly.

**5. The auth check guarding the most sensitive function touched.**

`set-client-plan.js:102`:

```js
const auth = await requireAuth(event, { adminOnly: true });
if (auth.response) return auth.response;
```

It is the first statement in the handler, before the method check at `:106` and
before `createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)` at `:139`. The service
key is never reachable by a caller that fails the gate. Unchanged by this diff.

**6. Write access.**

This review wrote exactly one file, `docs/qa/plans-drift-fix-006.md`. No file
under review was edited. No git command other than read-only `diff`, `status`,
`log` and `rev-parse` was run. `docs/arch/activation-path.md` was read and not
touched.

**CALIBRATED.**

---

## 2. The B1 §4 harness, re-run independently

Run from `brandgeo-dashboard/netlify/functions` against the current working
tree, script copied verbatim from `docs/qa/plans-divergence-b1.md` §4:

```
PASS
EXIT=0
```

The full-output variant, the same script with the assertions replaced by prints,
which is what B1 §2 used:

```
=== C1: isValidPlan over planConfig.ts Plan union ===
  isValidPlan(free       ) = true
  isValidPlan(essentials ) = true
  isValidPlan(growth     ) = true
  isValidPlan(growth_pro ) = true
  isValidPlan(managed    ) = true
  isValidPlan(pro        ) = true
  isValidPlan(enterprise ) = true

=== C2: planUnlocks().engineLabels vs _cost.js activeEnginesFor() ===
  free        promised(1): ChatGPT
              enforced(1): chatgpt
              -> ok
  essentials  promised(3): ChatGPT,Gemini,Claude
              enforced(3): chatgpt,gemini,claude
              -> ok
  growth      promised(4): ChatGPT,Gemini,Claude,Perplexity
              enforced(4): chatgpt,gemini,claude,perplexity
              -> ok
  growth_pro  promised(5): ChatGPT,Gemini,Claude,Perplexity,Google AI Mode
              enforced(5): chatgpt,gemini,claude,perplexity,google_ai
              -> ok
  managed     promised(5): ChatGPT,Gemini,Claude,Perplexity,Google AI Mode
              enforced(5): chatgpt,gemini,claude,perplexity,google_ai
              -> ok
  pro         promised(5): ChatGPT,Gemini,Claude,Perplexity,Google AI Mode
              enforced(5): chatgpt,gemini,claude,perplexity,google_ai
              -> ok
  enterprise  promised(5): ChatGPT,Gemini,Claude,Perplexity,Google AI Mode
              enforced(5): chatgpt,gemini,claude,perplexity,google_ai
              -> ok

=== C3: blurb presence ===
  blurb(free       ) = "A single AI engine (ChatGPT) so you can see where your brand stands."
  blurb(essentials ) = "The three core AI engines, self-serve, for teams that run their own visibility."
  blurb(growth     ) = "Four AI engines, more prompts, and AI Social, for brands scaling their AI presence."
  blurb(growth_pro ) = "All five live AI engines, including Google AI Mode, with more prompts, pages and social channels than Growth."
  blurb(managed    ) = "A done-for-you service across all five live AI engines, with our team running your visibility and acting on the findings."
  blurb(pro        ) = "Everything in Managed at higher volume, more markets, and priority support, with the next wave of engines unlocking automatically."
  blurb(enterprise ) = "Custom scale, dedicated support, and bespoke reporting for large brands and agencies."

=== C4: label presence ===
  PLAN_LABELS[free       ] = "Free"
  PLAN_LABELS[essentials ] = "Essentials"
  PLAN_LABELS[growth     ] = "Growth"
  PLAN_LABELS[growth_pro ] = "Growth PRO"
  PLAN_LABELS[managed    ] = "Managed"
  PLAN_LABELS[pro        ] = "Pro"
  PLAN_LABELS[enterprise ] = "Enterprise"

=== C5: planRank ladder positions, _plans.js vs planConfig.ts ===
  free        _plans:0  planConfig:0
  essentials  _plans:1  planConfig:1
  growth      _plans:2  planConfig:2
  growth_pro  _plans:3  planConfig:3
  managed     _plans:4  planConfig:4
  pro         _plans:5  planConfig:5
  enterprise  _plans:6  planConfig:6
```

Compare against B1 §4's recorded pre-fix result, `8 failures, exit 1`. All eight
are gone. `bg-backend`'s claimed `PASS` reproduces.

The harness's C2 compares **lengths** only. That is a weaker check than the
criterion it stands for, so §3 adds an exact set comparison.

---

## 3. Acceptance criteria table

| # | Criterion (packet `005`) | Result | Evidence |
|---|---|---|---|
| 1 | §4 harness prints `PASS` | **PASS** | §2. `PASS`, `EXIT=0`, run from `brandgeo-dashboard/netlify/functions` against the working tree. |
| 2 | `isValidPlan(p)` true for the whole `Plan` union incl. `growth_pro` | **PASS** | §2 block C1: all seven `true`. Mechanism is `_plans.js:22` (`growth_pro` added to `PLAN_ORDER`) feeding `_plans.js:52` to `:54`. |
| 3 | `planUnlocks(p).engineLabels` equals `getActiveEngines(p, null)` for every `p` in `PLAN_ORDER` | **PASS** | Probe output below. Exact array equality, not length equality. |
| 4 | `planRank` agrees with `planConfig.ts` for all plans | **PASS** | §2 block C5: seven rows, `_plans` value equals `planConfig` value on every one. Probe below also proves the two `PLAN_ORDER` arrays are byte-identical, which is the underlying cause. |
| 5 | `PLAN_LABELS['growth_pro']` defined | **PASS** | §2 block C4: `"Growth PRO"`, from `_plans.js:26`. Downstream effect proven in §4: `plan_grant_note` now renders `Growth PRO trial`, not `undefined trial`. |
| 6 | `PLAN_ENGINES` gone from `_plans.js`, no caller references it | **PASS** | Repo-wide grep below. Zero references in `netlify/functions/` to `_plans`'s `PLAN_ENGINES` or `LIVE_ENGINES`; both are `undefined` on the loaded module. |
| 7 | No file outside `scope_write` modified | **PASS** | §1 answer 1. `git status --porcelain -- brandgeo-dashboard/` returns exactly the two files in `scope_write`. |

### Evidence for row 3 and row 4

`planConfig.ts` cannot be `require`d from Node, so `getActiveEngines` was
reimplemented in the probe from `planConfig.ts:46`, `:58`, `:61`, `:159` and
`:349`, transcribed by hand and deliberately not imported:

```
=== planUnlocks(p).engineLabels vs planConfig.ts getActiveEngines(p, null) ===
  free       MATCH  ["ChatGPT"]
  essentials MATCH  ["ChatGPT","Gemini","Claude"]
  growth     MATCH  ["ChatGPT","Gemini","Claude","Perplexity"]
  growth_pro MATCH  ["ChatGPT","Gemini","Claude","Perplexity","Google AI Mode"]
  managed    MATCH  ["ChatGPT","Gemini","Claude","Perplexity","Google AI Mode"]
  pro        MATCH  ["ChatGPT","Gemini","Claude","Perplexity","Google AI Mode"]
  enterprise MATCH  ["ChatGPT","Gemini","Claude","Perplexity","Google AI Mode"]
ALL MATCH

=== _plans.PLAN_ORDER vs planConfig.ts PLAN_ORDER ===
  _plans.js   : ["free","essentials","growth","growth_pro","managed","pro","enterprise"]
  planConfig  : ["free","essentials","growth","growth_pro","managed","pro","enterprise"]
  identical   : true
```

`MATCH` here is `JSON.stringify` equality on the ordered arrays, so it also
proves order agreement, which the harness's length check does not. Note that
`pro` and `enterprise` reconcile only because `getActiveEngines` filters
`COMING_SOON_ENGINES` (`copilot`, `deepseek`, `grok`): `planConfig.ts:52` to
`:53` grants those two tiers eight engines, of which five are live. `_cost.js`'s
`PLAN_LIVE_ENGINES` already holds the post-filter set. The two agree on what
actually collects, which is the property the criterion is about.

The same probe checks that `_cost.js`'s and `planConfig.ts`'s unknown-plan
fallbacks differ, and that `planUnlocks` is nonetheless safe:

```
=== fallback divergence probe: unknown plan ===
  _cost.activeEnginesFor("bogus", null) = ["chatgpt","gemini","claude"]
  planConfig getActiveEngines("bogus")   = ["chatgpt"]
  _plans.planUnlocks("bogus")            = {"plan":"free","label":"Free","engineLabels":["ChatGPT"],"blurb":"A single AI engine (ChatGPT) so you can see where your brand stands."}
```

`planUnlocks` resolves `key` through `isValidPlan` first (`_plans.js:65`), so an
unknown plan reaches `activeEnginesFor` as `'free'`, never as the raw string, and
`_cost.js`'s `'essentials'` fallback is unreachable from this path. The divergence
itself is real but pre-existing and out of this packet's scope. Recorded as V2.

### Evidence for row 6

```
$ grep -rn "PLAN_ENGINES\|LIVE_ENGINES" brandgeo-dashboard/netlify/
promotions-admin.js:32:const { PLAN_LIVE_ENGINES } = require('./_cost')
promotions-admin.js:40:const VALID_PLANS = new Set(Object.keys(PLAN_LIVE_ENGINES))
_cost.js:95,97,102,106,109,119,123,135,136,204   (PLAN_LIVE_ENGINES, own definition + comments)
_plans.js:10,13,41                               (comments only, explaining the removal)
_prospect_engines.js:384                         (comment only)
```

Every remaining hit is either `_cost.js`'s own `PLAN_LIVE_ENGINES` (a different
symbol, the authority, untouched), or a comment. No code anywhere reads
`PLAN_ENGINES` or `LIVE_ENGINES` from `_plans.js`. Confirmed against the loaded
module rather than only by grep:

```
  PLAN_ENGINES  = undefined
  LIVE_ENGINES  = undefined
  module keys   = PLAN_ORDER,PLAN_LABELS,ENGINE_LABELS,PLAN_BLURB,isValidPlan,planRank,planUnlocks
```

The only frontend hits, `planConfig.ts:46`, `:67`, `:70`, `:330`, are
`planConfig.ts`'s own `PLAN_ENGINES`, which is the authority and is correctly
untouched by this change.

---

## 4. Full request path trace: assigning `growth_pro`

Packet `006` Do item 3. Traced end to end, including what an unauthenticated
caller and a non-admin caller receive.

| Hop | Location | Behaviour for `growth_pro` after this change |
|---|---|---|
| 1. Admin UI | `src/pages/Account.tsx:571` | The selector is `PLAN_ORDER.map(...)` off `planConfig.ts`, so `growth_pro` is offered. `Account.tsx:41` lists it at `€449 / mo`. Unchanged by this diff. |
| 2. Client call | `Account.tsx:177` | `POST /.netlify/functions/set-client-plan` with `Authorization: Bearer <supabase access_token>` and `{ client_id, plan: 'growth_pro', grant_type, ... }`. |
| 3. Auth gate | `set-client-plan.js:102` | `requireAuth(event, { adminOnly: true })`, first statement in the handler. Unauthenticated caller gets the `_auth.js` 401 before any body parse. A `viewer` token gets the admin-only rejection. Neither reaches the service key at `:139`. Unchanged. |
| 4. Validation | `set-client-plan.js:118` | `isValidPlan('growth_pro')` now returns `true` (§2 C1). **This is the hop that was returning 400 and made Growth PRO unassignable.** The error string is now `PLAN_ORDER.join(', ')` instead of a hand-typed six-plan list, so the third prose mirror B1 §5 flagged is gone. |
| 5. Grant date | `set-client-plan.js:122` to `:137` | Plan-agnostic. `growth_pro` is not `'free'`, so a trial or comp grant is permitted, as intended for a paid tier. |
| 6. Supabase write | `set-client-plan.js:158` | `supabase.from('clients').update({ plan: 'growth_pro', plan_source, plan_grant_until, plan_grant_note })`, service role, RLS bypassed. **See finding V1: the repo does not define this column, so a CHECK constraint on it cannot be ruled out from source.** |
| 7. `plan_grant_note` | `set-client-plan.js:152` | `PLAN_LABELS['growth_pro']` is defined, so a trial writes `Growth PRO trial`. Before this change it wrote `undefined trial` (B1 F3). |
| 8. Audit row | `set-client-plan.js:166` | `client_events` insert, plan slug carried as data. Plan-agnostic. |
| 9. Notice built | `set-client-plan.js:44` to `:99` | See the executed probe below. Correct tone, correct engine count, correct blurb. |
| 10. Email sent | `set-client-plan.js:200` | `sendBrandedEmail` with the `notice.email` payload. Template untouched by this diff; only the interpolated strings changed. |
| 11. Downstream read: hourly ceiling and budget | `_auth.js:19`, `:28`, `:191`, `:202`, `:230` | `VALID_PLANS = Object.keys(PLAN_LIVE_ENGINE_COUNT)` derives from `_cost.js`, which already had `growth_pro`. So `_auth.js:191` keeps `'growth_pro'` rather than falling back to `'essentials'`, `PLAN_LIVE_ENGINE_COUNT['growth_pro'] = 5` sizes the hourly ceiling, and `PLAN_MONTHLY_API_BUDGET_EUR['growth_pro'] = 53.88` (`_cost.js:176`) is the monthly cap. No `_plans.js` dependency at all. Correct before and after. |
| 12. Downstream read: promotions | `promotions-admin.js:32`, `:40` | `VALID_PLANS = new Set(Object.keys(PLAN_LIVE_ENGINES))`, resolved live to `free, essentials, growth, growth_pro, managed, pro, enterprise`. A promo targeting Growth PRO validates. No `_plans.js` dependency. Correct before and after. |
| 13. Downstream read: grant expiry | `expire-plan-grants.js:12`, `:54`, `:55`, `:63`, `:78` | Uses `PLAN_LABELS[fromPlan] \|\| fromPlan` only. Gains the `growth_pro` key; loses nothing. A Growth PRO trial expiring now says "Your complimentary Growth PRO plan has ended" instead of "growth_pro". |
| 14. Downstream read: Stripe | `stripe-webhook.js:29`, `:170`, `:189`, `:220`, `:252` | Uses `PLAN_LABELS[plan] \|\| plan` only. Same gain. `PRICE_TO_PLAN` (`:37` to `:42`) and `SELF_SERVE_PLANS` (`:45`) still have no `growth_pro` entry, correctly and deliberately: packet `005` forbids touching this file, and the missing Stripe price is `bg-strategy`'s item per B1 §5. Growth PRO remains unbuyable self-serve; it becomes assignable by an admin. That is exactly the scope claimed. |

**Nothing downstream special-cases the old `PLAN_ORDER` or `PLAN_ENGINES`
shape.** `_plans.js` is required by exactly three files:

```
$ grep -rn "require('./_plans')" brandgeo-dashboard/netlify/functions/
expire-plan-grants.js:12:const { PLAN_LABELS } = require('./_plans');
set-client-plan.js:25:const { isValidPlan, planRank, planUnlocks, PLAN_LABELS, PLAN_ORDER } = require('./_plans');
stripe-webhook.js:29:const { PLAN_LABELS } = require('./_plans')
```

Two of the three consume only `PLAN_LABELS`, which gained a key and lost none.
Only `set-client-plan.js` touches the changed behaviour, and it is the file
under review.

### B1 F2 and F3 regression probes, executed

```
=== B1 F3 regression probe: growth -> growth_pro upgrade notice ===
  isValidPlan(growth_pro) : true
  planRank growth=2 growth_pro=3
  tone                    : upgrade
  title                   : Your BrandGEO plan is now Growth PRO
  engineLine              : 5 AI engines monitored: ChatGPT, Gemini, Claude, Perplexity, Google AI Mode.
  blurb                   : All five live AI engines, including Google AI Mode, with more prompts, pages and social channels than Growth.
  plan_grant_note (trial) : Growth PRO trial

=== growth downgrade-from-growth_pro sanity ===
  tone growth_pro -> growth: downgrade

=== growth upgrade notice (B1 F2 regression probe) ===
  engineLine : 4 AI engines monitored: ChatGPT, Gemini, Claude, Perplexity.
  blurb      : Four AI engines, more prompts, and AI Social, for brands scaling their AI presence.
```

Against B1 F3's recorded pre-fix behaviour, a `€449` upgrade announced as
"1 AI engine monitored: ChatGPT" with the Free blurb in a downgrade-toned email:
all three symptoms are gone. Against B1 F2, Growth no longer promises a fifth
engine it is not entitled to. All four B1 findings are closed.

---

## 5. Security findings

**None.** Ranked list is empty, and that is a statement about what was checked,
not a shrug.

- Secret scan over the diff: 0 matches (§1 answer 2). No new environment
  variable is read, no credential is introduced or moved.
- The admin gate on the only privileged function touched is unchanged and still
  the first statement in the handler (`set-client-plan.js:102`).
- The one new information disclosure is the 400 error string at
  `set-client-plan.js:118`, which now enumerates plan slugs from `PLAN_ORDER`.
  It sits behind `requireAuth({ adminOnly: true })`, so only an authenticated
  admin can see it, and the slugs are already public in the shipped frontend
  bundle via `planConfig.ts`'s `PLAN_ORDER`. No exposure delta.
- The new `require('./_cost')` at `_plans.js:19` introduces no cycle:
  `grep -n "require(" _cost.js` returns nothing, so `_cost.js` imports nothing.
  `node -e "require('./_plans');require('./_cost')"` loads clean. The same
  relative-require pattern is already in production (`_auth.js:19` requires
  `_cost.js`; `set-client-plan.js` requires `_auth`, `_plans`, `_email`), so the
  Netlify esbuild bundler resolves it the same way it already does.
- The change cannot widen entitlement. `planUnlocks` is display only. The
  enforcing paths are `_cost.js`'s `activeEnginesFor` for the queue and
  `_auth.js`'s `checkCollectionLimits` for the ceiling and budget, and neither
  reads `_plans.js`. Making the email honest cannot grant an engine.

---

## 6. Findings

Ranked. None of these blocks the commit in §8.

### V1. MEDIUM. `clients.plan` is not defined anywhere in `db/`, so hop 6 of the trace cannot be closed from source.

**What.** The `clients.plan` column has no `CREATE`/`ALTER` statement in the
repository. `db/supabase-multitenant-migration.sql:8` creates `clients` with
`id, name, slug, brand_aliases, brand_website, created_at` and no `plan`. Later
migrations add `plan_source`, `plan_grant_until`, `plan_grant_note`
(`db/supabase-admin-plan-grants-migration.sql:39` to `:41`) but never `plan`
itself. `CLAUDE.md` task `#94` records the plan-gating SQL as having been handed
over and run by hand, so it exists only in the live database.

**Where.** `brandgeo-dashboard/netlify/functions/set-client-plan.js:158`, the
write; absence in `db/`.

**Failure path, concrete.** If that ad-hoc statement included a CHECK constraint
enumerating the pre-2026-07 six-plan ladder, which is exactly what
`db/supabase-clients-category-migration.sql:16` to `:18` does for a different
column and is therefore this codebase's established habit, then
`update({ plan: 'growth_pro' })` raises `23514 check_violation`. Supabase
returns it as `ue`, `set-client-plan.js:159` to `:162` logs and returns a bare
500 with the Postgres message, and Growth PRO stays unassignable. The 400 at
hop 4 would simply have moved to a 500 at hop 6, and the shipped fix would look
correct while changing nothing a customer can reach.

I am not asserting the constraint exists. I am reporting that I could not rule
it out from the repository, and that this is the only link in the trace I could
not close by execution. Per the no-speculative-findings rule, this is filed as
an unverified link with an exact test, not as a defect.

**Fix.** Two parts, in order.

1. Verify. Read-only, safe to run against production, in the Supabase SQL
   Editor for project `duiyifepitvugyulobqm` (`brandgeo-dashboard`):

   ```sql
   select conname, pg_get_constraintdef(oid)
   from pg_constraint
   where conrelid = 'public.clients'::regclass and contype = 'c';
   ```

   Zero rows mentioning `plan`, or a definition that permits `growth_pro`, closes
   this finding. A definition enumerating the old six plans confirms it.

2. If confirmed, the constraint needs an `ALTER TABLE ... DROP CONSTRAINT` plus
   a re-add covering the seven-plan ladder, written as a real migration file in
   `db/` so this gap does not recur. That is `bg-backend` scope and a separate
   packet, not an amendment to this one.

Regardless of the outcome, `clients.plan` having no migration file in `db/` is
worth closing on its own. Every other column on that table has one.

### V2. LOW, PRE-EXISTING. The two unknown-plan fallbacks disagree.

**What.** `_cost.js:135` `activeEnginesFor` falls back to `'essentials'` for a
plan it does not recognise. `planConfig.ts:329` `getEngineStates`, and therefore
`getActiveEngines`, falls back to `'free'`.

**Where.** `brandgeo-dashboard/netlify/functions/_cost.js:135` against
`brandgeo-dashboard/src/lib/planConfig.ts:329`.

**Failure path.** Not reachable through `planUnlocks`, which validates first
(proven in §3's fallback probe). It is reachable through the collection queue,
which calls `activeEnginesFor(client.plan, ...)` with the raw database value. A
client row whose `plan` is null or a typo would have three engines collected and
billed server-side while the dashboard shows one engine active. A real
divergence, but it needs a corrupt `clients.plan` value to trigger and it
predates this change by months.

**Fix.** Out of scope for packet `005` and packet `006`. It belongs with the
design question B1 §6 item 3 already raised for `bg-architect`, which is whether
these helpers should fail soft at all. Do not fold it into this commit.

### V3. LOW, PRE-EXISTING. A stale comment now contradicts the corrected engine table.

**What.** `_prospect_engines.js:384` reads "5 live engines, matching
`PLAN_ENGINES`' 'growth'/'managed'/'pro' set in ...". Growth has been four
engines since `PRICING-STRATEGY-2026-07` §3, and `_cost.js:112` and
`planConfig.ts:49` both say four. The comment was already wrong before this
change; this change makes the contradiction visible by fixing everything else.

**Where.** `brandgeo-dashboard/netlify/functions/_prospect_engines.js:384`.

**Failure path.** Comment only. No code path reads it. The risk is that the next
person to touch prospecting trusts it and re-introduces the drift B1 just closed.

**Fix.** One-line comment edit, `bg-backend` scope, outside this packet's
`scope_write`. Not to be swept into this commit.

### V4. DOC. `CLAUDE.md` points at a commit command that does not exist.

**What.** `CLAUDE.md`'s CURRENT STATE section says "the exact commit command
bg-backend drafted: `.claude/handoffs/006-bg-backend-to-bg-verify-plans-drift.md`".
That packet contains no `git add` or `git commit` line. Grepping it for `git`
returns only prose references at `:16`, `:38`, `:44` and `:52`.

**Consequence.** Packet `006` Do item 7 says to verify `bg-backend`'s drafted
command against the final diff rather than copy it forward unchecked. There was
no command to verify. The command in §8 was therefore written fresh against the
diff observed in this review, not adapted from anything.

**Fix.** Correct the sentence in `CLAUDE.md` when the backlog is next updated.
`bg-orchestrator` scope.

### Noted, not a finding: em dashes in `set-client-plan.js`

The AI-tell scan is in §7. Its two hits are both in `set-client-plan.js` code
comments, on lines this diff does not touch. Per the standing baseline rule that
comment hits are not findings, they are not filed. The em dash that mattered,
the one in `PLAN_BLURB.growth` at old `_plans.js:41` which B1 §6 item 1 flagged
because it reaches a customer by email, is gone.

---

## 7. AI-tell scan

`rg`, not `grep`, per the standing rule about Git Bash `grep` not being UTF-8
aware here.

The scan was run twice: once with the literal `[emdash endash]` character class
from the agent spec, and once with the escape form below, which contains no
literal dash character so this report can obey the house zero-dash rule while
staying reproducible. Both runs returned identical results, same two lines, same
file, `_plans.js` empty in both. The escape form is the one reproduced here.

```
$ rg -n "\x{2014}|\x{2013}" brandgeo-dashboard/netlify/functions/_plans.js \
                            brandgeo-dashboard/netlify/functions/set-client-plan.js
set-client-plan.js:17://     notify?: boolean,            // default true <EMDASH> banner + email to the client
set-client-plan.js:172:  // webhook <EMDASH> surface it rather than silently letting them drift.

$ rg -c "\x{2014}|\x{2013}" brandgeo-dashboard/netlify/functions/set-client-plan.js
2
```

`<EMDASH>` above stands in for the literal character present on those two source
lines, exactly as `docs/qa/plans-divergence-b1.md` §2 renders the one it quotes.
`_plans.js` produced no output line at all, which is the zero-hit result.

**Count: 2. Both in `set-client-plan.js`. Both inside JavaScript comments.
Neither line is in this diff.** `_plans.js` returns zero hits, down from one:
the em dash in `PLAN_BLURB.growth`, which was customer-facing email copy, was
removed when that line was rewritten. That satisfies packet `005` Do item 5.

No banned AI-tell vocabulary (delve, leverage as a verb, seamless, robust,
unlock, elevate, game-changing, cutting-edge, revolutionize, in today's
fast-paced) appears in either new blurb. "unlocked" does appear at
`set-client-plan.js:58`, in the pre-existing untouched string
`You've unlocked ${u.label} on BrandGEO`. Not in this diff, and arguably correct
usage rather than the marketing tell, so it is noted and not filed.

---

## 8. Cost note verification

Packet `006` Do item 5. `_plans.js` is required by exactly three files, listed
in §4, and no `collect-*.js` file is among them:

```
$ ls brandgeo-dashboard/netlify/functions/ | grep "^collect"
collect-chatgpt.js
collect-claude.js
collect-prompt.js
collection-worker-background.js
```

None of the four appears in the `require('./_plans')` grep. `_plans.js` is only
loaded by `set-client-plan.js` (admin-triggered), `stripe-webhook.js` (Stripe
event) and `expire-plan-grants.js` (daily cron). **Confirmed: no per-run or
per-model-call cost delta.** The added `require('./_cost')` is a module load in
three low-frequency functions, all of which already sit alongside `_auth.js`,
which already loads `_cost.js` on every request.

---

## 9. Regression surface

Found by grep, not by intuition. Paths needing a manual look are named.

| Path | Relationship | Needs a look? |
|---|---|---|
| `brandgeo-dashboard/netlify/functions/set-client-plan.js` | The change itself, and the only consumer of the changed behaviour. | Covered by §4. |
| `brandgeo-dashboard/netlify/functions/stripe-webhook.js` | Requires `PLAN_LABELS` only. Gains a key. | No. Behaviour identical for the four self-serve price IDs it handles. |
| `brandgeo-dashboard/netlify/functions/expire-plan-grants.js` | Requires `PLAN_LABELS` only. Gains a key. | No. Strictly improves the expiry email for a Growth PRO grant. |
| `brandgeo-dashboard/netlify/functions/_cost.js` | Newly a dependency of `_plans.js`. Unmodified. | No, but note the coupling: a future edit to `PLAN_LIVE_ENGINES` now silently changes what upgrade emails promise. That is the intended design per `_plans.js:9` to `:16`. |
| `brandgeo-dashboard/netlify/functions/_auth.js` | Independent `_cost.js` consumer for ceiling and budget. | No. Verified correct for `growth_pro` at §4 hop 11. |
| `brandgeo-dashboard/netlify/functions/promotions-admin.js` | Independent `_cost.js` consumer for plan validation. | No. Verified at §4 hop 12. |
| `brandgeo-dashboard/src/pages/Account.tsx` | Calls `set-client-plan` at `:177`, offers `growth_pro` at `:571`. Unmodified. | **Yes, one manual click.** The 400 at hop 4 is gone in code; nobody has exercised the button end to end. This is the same manual hop the Promotions panel item in the backlog needs, and it also closes V1. |
| `brandgeo-dashboard/netlify/functions/_prospect_engines.js` | Does not import `_plans.js`. Comment drift only. | No, but see V3. |
| `db/` | `clients.plan` undefined. | **Yes.** See V1. |

Files that do **not** need a look, stated so the absence is deliberate: nothing
under `brandgeo/web/`, no `collect-*.js`, no `src/lib/planConfig.ts`, and no
`_enqueue.js` or `schedule-collections.js`. None of them reference `_plans.js`,
proven by the grep in §4.

---

## 10. Data and claim integrity

Both rewritten blurbs are sent to a customer at the moment they are charged, so
every claim is traced to a file and a line. Untraceable would be a `BLOCK`.
Nothing here is untraceable.

**`PLAN_BLURB.growth`** (`_plans.js:45`): "Four AI engines, more prompts, and AI
Social, for brands scaling their AI presence."

| Claim | Source | Result |
|---|---|---|
| Four AI engines | `_cost.js:112` and `planConfig.ts:49`, both `['chatgpt','gemini','claude','perplexity']` | TRACED |
| more prompts | `planConfig.ts:208` `PLAN_PROMPTS`: growth 75 against essentials 20 | TRACED |
| AI Social | `planConfig.ts:182` `FEATURE_MIN_PLAN.ai_social = 'growth'`; `planConfig.ts:240` channel limit growth 1, essentials 0 | TRACED. Growth is the tier where AI Social first exists, so naming it is accurate, not merely permitted. |

The old string claimed "Five AI engines with more prompts and markets". Both
corrections are improvements in integrity, and the second is worth noting because
packet `005` did not ask for it: there is no `PLAN_MARKETS` table anywhere in
`planConfig.ts`, so "markets" was an unsubstantiated claim. Dropping it was
correct.

**`PLAN_BLURB.growth_pro`** (`_plans.js:46`): "All five live AI engines,
including Google AI Mode, with more prompts, pages and social channels than
Growth."

| Claim | Source | Result |
|---|---|---|
| All five live AI engines | `_cost.js:113`, five entries. "Live" is precise: `planConfig.ts:58` `COMING_SOON_ENGINES` excludes copilot/deepseek/grok, and `meta` is retired (`planConfig.ts:41` to `:43`). Five is the whole live set, so "all" holds. | TRACED |
| including Google AI Mode | `_cost.js:112` against `:113`: growth_pro is the first tier with `google_ai`. `planConfig.ts:44` to `:45` states the reason. | TRACED |
| more prompts than Growth | `planConfig.ts:208`: growth_pro 100, growth 75 | TRACED |
| more pages than Growth | `planConfig.ts:222` `PLAN_SEO_PAGE_CAP`: growth_pro 30, growth 10 | TRACED |
| more social channels than Growth | `planConfig.ts:240` `PLAN_SOCIAL_CHANNEL_LIMIT`: growth_pro 3, growth 1 | TRACED |

Every comparative in the `growth_pro` blurb is strictly greater, not equal, on
its named axis. It deliberately does not claim more audits per week, which would
have been false: `planConfig.ts:228` gives growth, growth_pro and essentials one
each.

`PLAN_LABELS['growth_pro'] = 'Growth PRO'` matches `planConfig.ts:165` exactly,
including capitalisation, and matches `Account.tsx:41`'s label.

No user-facing number changed. `€449` appears only in `Account.tsx:41` and
`_cost.js:176`'s comment, neither of which this diff touches.

---

## 11. Accessibility findings

**Not applicable, and here is why rather than a blank section.** The diff is two
CommonJS Netlify function files. It adds no markup, no component, no interactive
element, no color, and no viewport-dependent layout. There is no new
text-on-surface pair to compute a contrast ratio for, no new element to reach by
keyboard, no focus ring, no heading, and no hit target.

The two changed strings do reach a rendered surface: the in-dashboard
notification banner (`client_notifications`) and the branded HTML email
(`sendBrandedEmail`). Both render inside templates this diff does not modify, at
the same size, weight and color as the strings they replace. The `growth_pro`
blurb is 108 characters against `managed`'s 129, so it introduces no new
longest-line wrapping case in either template.

Nothing about accessibility was measured in this review, because nothing
measurable changed. Recorded here so the absence is not mistaken for a pass.

---

## 12. What was not checked

Explicit, because a reviewer who lists nothing here did not review.

1. **The live database.** No query was run against Supabase. Hop 6 of §4 is the
   only step in the trace not closed by execution. This is V1, and the SQL to
   close it is in that finding.
2. **`npm run build`.** Deliberately not run. `tsconfig.json` has
   `"include": ["src"]`, so it does not compile, lint or read either changed
   file. A green build would have been evidence about a different part of the
   repository presented as evidence about this one. `npx tsc --noEmit` was run
   only to record a clean baseline (exit 0), not as a criterion.
3. **Any deployed behaviour.** Both files are uncommitted. Netlify has not built
   them, so nothing in this report describes production. Everything was executed
   against the working tree in local Node.
4. **The rendered email and banner.** `_email.js`'s `sendBrandedEmail` was not
   opened, no email was sent, and no HTML output was inspected. The blurb and
   engine-line strings were verified at the boundary where
   `set-client-plan.js:88` to `:97` hands them to the template.
5. **The `Account.tsx` click path end to end.** No browser session, no admin
   login. `Account.tsx:177` and `:571` were read, not exercised. Named in §9 as
   the one manual hop.
6. **`Account.tsx:322`'s legacy-plan insertion logic.** Read past, not analysed.
   It is `bg-app` scope and untouched by this diff, but it manipulates the plan
   list shown in the selector and would be worth a look if the selector ever
   misbehaves for `growth_pro`.
7. **The other 55 modified files in the working tree.** Out of scope for packet
   `006`. Confirmed only that none is in `scope_write` and that the §8 command
   cannot include them.
8. **Stripe.** No Stripe API call, no price lookup, no webhook replay.
   `stripe-webhook.js` was read for `PLAN_LABELS` usage only. Whether a
   `growth_pro` price exists in the Stripe account was not checked and is
   explicitly `bg-strategy`'s item.
9. **Performance.** No timing, no bundle size measurement on the three functions
   that now transitively load `_cost.js`. Judged not worth measuring given
   `_auth.js` already loads it on every request, but it was not measured.
10. **Whether B1's adjudication is itself correct.** Treated as binding per
    packet `006`. Its four findings were re-executed against the fixed files and
    all four reproduce as closed, which is consistent with B1 being right, but
    this pass did not re-derive B1's reasoning from scratch.

---

## 13. Commit command

Verified against the final diff observed in this review, not copied from
anywhere. As established in V4, packet `006` contains no drafted command, so
there was nothing to carry forward.

State at the moment of writing: `HEAD` is `a896349`, nothing is staged, and
`git status --porcelain -- brandgeo-dashboard/` returns exactly the two files
below. The `git add` names both paths explicitly rather than using `-A` or `.`,
so none of the 55 unrelated modified files elsewhere in the tree can be swept in.

Run from `C:\Users\const\Constantin Daniel Goane\BrandGEO`, one git operation at
a time per `rules/parallel-task-scoping.md`:

```bash
cd "C:\Users\const\Constantin Daniel Goane\BrandGEO"

git status --porcelain -- brandgeo-dashboard/

git add brandgeo-dashboard/netlify/functions/_plans.js brandgeo-dashboard/netlify/functions/set-client-plan.js

git diff --cached --stat

git commit -m "fix(functions): make growth_pro assignable and stop _plans.js promising engines it does not grant

_plans.js was the last drifted mirror of the plan ladder. growth_pro was
missing from PLAN_ORDER, so isValidPlan rejected it and set-client-plan.js
returned a 400: Growth PRO could not be assigned by any admin, and it has no
Stripe price either, so the tier was unsellable by every route.

PLAN_ENGINES and LIVE_ENGINES are deleted rather than re-synced. planUnlocks()
now derives engines from _cost.js's activeEnginesFor(), the copy that enforces
entitlement, so the upgrade email cannot promise an engine the collection queue
will not run. That closes the case where a client paying for Growth was sent a
written promise of Google AI Mode, an engine Growth is deliberately not
entitled to.

PLAN_BLURB.growth now says four engines, not five, and drops an unsubstantiated
claim about markets. A growth_pro blurb and label are added. planRank now
matches planConfig.ts for all seven plans, so a growth to growth_pro change is
no longer announced to the buyer in downgrade tone with the Free plan's
description. set-client-plan.js's hand-typed plan list in its 400 message is
replaced by PLAN_ORDER.join.

The em dash in the growth blurb is gone; that string is sent to customers by
email.

Findings closed: docs/qa/plans-divergence-b1.md F1 to F4.
Implemented per .claude/handoffs/005-bg-verify-to-bg-backend-plans-drift.md.
Reviewed per .claude/handoffs/006-bg-backend-to-bg-verify-plans-drift.md;
verdict and evidence in docs/qa/plans-drift-fix-006.md.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

`git push` is deliberately not included. Pushing triggers the Netlify build for
`brandgeo-dashboard/`, which is a deploy decision and belongs to Constantin per
AGENT-OS §7 item 7. Run it separately when ready.

---

## 14. Human checkpoint

```
=== HUMAN CHECKPOINT ===
NEED:      Does public.clients have a CHECK constraint on the plan column that
           would reject 'growth_pro'?
WHY:       It is the only hop in the growth_pro request path this review could
           not close by execution. The column has no migration file in db/, so
           it cannot be verified from the repository. If a constraint exists,
           the fixed 400 simply becomes a 500 and Growth PRO stays unassignable.
OPTIONS:   A) Run the query below before the commit -> you know whether the fix
              actually reaches the database, and V1 closes either way.
           B) Commit first, then run it -> the commit is safe regardless (the
              code is strictly better than HEAD), but do not announce Growth PRO
              as assignable until the query comes back clean.
DEFAULT:   B. This review's verdict does not depend on the answer, and nothing
           in the diff can be made worse by committing it.
TO RUN:    Supabase dashboard -> project brandgeo-dashboard (duiyifepitvugyulobqm)
           -> SQL Editor -> New query -> paste and Run:

           select conname, pg_get_constraintdef(oid)
           from pg_constraint
           where conrelid = 'public.clients'::regclass and contype = 'c';

TO VERIFY: Zero rows, or no returned definition mentioning "plan", means no
           constraint blocks growth_pro and V1 is closed. A definition listing
           six plan slugs without growth_pro confirms V1; send it to bg-backend
           as a new packet for a real migration file in db/.
           The end-to-end confirmation is separate and needs an admin login:
           app.getbrandgeo.com -> Account -> plan selector -> Growth PRO -> Save.
           Expect a 200 and a "Your BrandGEO plan is now Growth PRO" banner, not
           a 400 or a 500. Use a test client, not a paying one, and set
           notify: false or untick the notify box so no real email is sent.
=== END CHECKPOINT ===
```
