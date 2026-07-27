# PASS WITH FINDINGS

`bg-verify` review of packet `011` (`bg-backend` → `bg-verify`), which reviews
`bg-backend`'s implementation of packet `008`: the `onboard-client.js` plan
coercion defect.

**Reviewed:** `brandgeo-dashboard/netlify/functions/onboard-client.js`, working
tree, uncommitted.
**Date:** 2026-07-27  **Model:** opus  **Scope written:** `docs/qa/` only.
**Verdict:** `PASS WITH FINDINGS`. Four findings, none blocking. The commit
command is in §9.

The headline result beyond the acceptance criteria: **the still-open `008`
CHECKPOINT is now closed by query** (§6). No client was financially harmed by
this defect, because no paid Stripe subscription has ever existed against this
project. No refund or credit decision is needed.

---

## 1. Calibration

**1. `git diff --stat`, and whether every changed file is in scope.**

```
 CLAUDE.md                                          | 35 ++++++++-
 .../netlify/functions/onboard-client.js            | 90 ++++++++++++++++++++--
 2 files changed, 118 insertions(+), 7 deletions(-)
```

`onboard-client.js` is packet `008`'s entire `scope_write`. **`CLAUDE.md` is
outside it.** Per `bg-verify.md`'s calibration step this is nominally an
automatic `BLOCK`, and I checked it rather than accepting the packet's assurance.
`git diff -- CLAUDE.md` is two hunks: the content-pipeline paragraph (BG-018/019,
27 city pages, the `ROADMAP-2026-07-27.md` pointer) and a note on this file's own
lost sections. Neither mentions onboarding, plans, `client_events`, or packet
`008`. It is the 2026-07-27 content-roadmap session's uncommitted work, corroborated
by the untracked `docs/ROADMAP-2026-07-27.md` that the added text points at.

**Not attributable to `bg-backend`; not a `BLOCK` of this change.** It does mean
the commit must name one file explicitly — §9 does.

**2. Secret scan.** `git diff -U0 | grep -niE "api[_-]?key|secret|token|password|bearer|sk-|pk_live|service_role"` → **0 hits.** No values inspected or printed.

**3. Acceptance criteria** — all seven from `011` are objectively checkable as
written. None required interpretation. Table in §3.

**4. Baseline.** `npx tsc --noEmit` → **exit 0**. Caveat that matters:
`tsconfig.json` sets `"include": ["src"]`, so the changed CJS function is not
type-checked by it at all. `tsc` is a *no-regression* baseline here, not evidence
about this diff. `npm run build` was deliberately not run, same reasoning as
packet `006`: a green build would be evidence about a different part of the repo.
Behavioural evidence comes from the two harnesses in §2 instead.

**5. Auth guard on the most sensitive function touched.** `onboard-client.js:72`,
`await requireAuth(event, { adminOnly: true })`, resolved at `_auth.js:110`
(`Forbidden: admin access required`) against `user_profiles.role`. Proven to
short-circuit before any write and before the plan ladder is disclosed — probe
P4/P4b, §2.2.

**6.** Wrote only `docs/qa/plan-coercion-fix-011.md`. Edited no reviewed file.
Ran no mutating git command.

`CALIBRATED`

> **Procedural note.** `011`'s *Do* item 6 requires `git diff --stat` and a
> diff-wide secret scan, while its *Do not* list says "do not run any git
> command." I read that as forbidding mutating git, and ran only read-only
> inspection, with `--no-optional-locks` so nothing touches `.git/index` (this
> repo has a documented history of parallel-session index corruption). No
> `add`/`commit`/`push`/`stash` was run.

---

## 2. Harnesses — rebuilt and run independently

### 2.1 Packet harness, reproduced from source

Transcribed from `011` §Harness, not copied from any result, and run at
`…/scratchpad/harness-008.js` outside the repo. Node v24.16.0.

```
=== packet 008 acceptance harness — onboard-client.js ===

_cost.js ladder: free, essentials, growth, growth_pro, managed, pro, enterprise

PASS  AC2  plan "free" -> clients.plan "free" (200, returned "free")
PASS  AC2  plan "essentials" -> clients.plan "essentials" (200, returned "essentials")
PASS  AC2  plan "growth" -> clients.plan "growth" (200, returned "growth")
PASS  AC2  plan "growth_pro" -> clients.plan "growth_pro" (200, returned "growth_pro")
PASS  AC2  plan "managed" -> clients.plan "managed" (200, returned "managed")
PASS  AC2  plan "pro" -> clients.plan "pro" (200, returned "pro")
PASS  AC2  plan "enterprise" -> clients.plan "enterprise" (200, returned "enterprise")
PASS  AC3  plan "growth-pro" -> 400, no rows written
PASS  AC3  plan "GROWTH" -> 400, no rows written
PASS  AC3  plan "platinum" -> 400, no rows written
PASS  AC3  plan "essentials " -> 400, no rows written
PASS  AC3  plan 42 -> 400, no rows written
PASS  AC3  plan {} -> 400, no rows written
PASS  AC3  plan true -> 400, no rows written
PASS  AC3b rejection names the value and the full accepted set
PASS  DEF  plan undefined -> default "essentials" (200)
PASS  DEF  plan undefined -> default "essentials" (200)
PASS  DEF  plan null -> default "essentials" (200)
PASS  DEF  plan "" -> default "essentials" (200)
PASS  AC4  exactly one client_events row on success
PASS  AC4  row names the plan and matches the audit shape
PASS  AC4  success response reports audit_logged: true
[onboard-client] audit row failed for client 42: forced client_events failure
PASS  AC5  audit failure still returns 200 with a usable client
PASS  AC5  audit failure rolls nothing back
PASS  AC5  audit failure is reported as audit_logged: false
PASS  REG  prompt-seed failure still rolls back client + profile + auth user
PASS  REG  a rolled-back onboard writes no client_events row
PASS  REG  invite failure still rolls back the client row, writes no audit row

PASS
EXIT CODE: 0
```

29 assertions, `PASS`, exit 0 — independently matching `bg-backend`'s claim.

### 2.2 My own probes — what the packet harness does not assert

The packet harness has one real blind spot: **AC4 asserts only
`typeof ev.type === 'string'`**, so it would pass if the audit row's `type` were
any value at all. That literal is precisely what a future detection query filters
on, so it is the one field that most needs pinning. Nine further probes cover
auth ordering, the detection marker, and prototype-key smuggling.
Run at `…/scratchpad/harness-011-independent.js`.

```
=== bg-verify independent probes — packet 011 ===

PASS  P1   client_events.type === 'onboarded' (got "onboarded")
PASS  P2   meta carries source/slug/role/plan_provided/prompts_created/default_market_id
PASS  P3   omitted plan -> audit row records plan_provided:false, to_plan:essentials
PASS  P3b  explicit essentials -> plan_provided:true (distinguishable from P3)
PASS  P4   requireAuth called with { adminOnly: true }
PASS  P4b  non-admin -> 403, zero inserts, plan ladder NOT disclosed
PASS  P5   plan "__proto__" -> 400, no rows written
PASS  P5   plan "constructor" -> 400, no rows written
PASS  P5   plan "toString" -> 400, no rows written
PASS  P5   plan "hasOwnProperty" -> 400, no rows written
PASS  P5   plan "valueOf" -> 400, no rows written
PASS  P5   plan "prototype" -> 400, no rows written
PASS  P5b  plan ["growth"] (array) -> 400
NOTE  P6   audit vs persisted-plan skew (DB stored "essentials", caller asked "growth_pro")
        response.plan = "essentials"  |  client_events.to_plan = "growth_pro"  |  agree: false
PASS  P6   response.plan reflects the PERSISTED row (reads client.plan)
PASS  P6b  audit to_plan reflects the REQUESTED plan, not the persisted one — recorded as a finding, not a failure
PASS  P7   GET -> 405, no writes
PASS  P7b  malformed JSON -> 400, no writes
PASS  P8   missing required field -> 400 before any write
PASS  P9   derived ladder is exactly the 7 _cost.js keys, all plain slugs

PASS
EXIT CODE: 0
```

Two results worth calling out. **P3/P3b is the finding the packet harness misses
in the other direction, and it is good news:** `meta.plan_provided` makes a
defaulted Essentials distinguishable from a chosen Essentials in the audit trail.
That is what actually makes this defect class detectable going forward, and it is
stronger than `008` item 3 asked for. **P6** is finding V1, §5.

---

## 3. Acceptance criteria

### 3.1 Packet `008`'s six criteria, re-verified against the diff

| # | Criterion | Result | Evidence |
|---|---|---|---|
| 1 | `VALID_PLANS` derived from `_cost.js`, not a literal | PASS | `onboard-client.js:58` `require('./_cost')`; `:65` `const VALID_PLANS = new Set(Object.keys(PLAN_LIVE_ENGINES))`. Diff removes `['free','essentials','managed','pro','enterprise']`. P9 confirms 7 keys. |
| 2 | `growth_pro` → `growth_pro`; `growth` → `growth` | PASS | AC2 rows 3–4. Harness iterates `Object.keys(PLAN_LIVE_ENGINES)` rather than a literal, so it fails if the derivation is ever replaced by a drifting hand-copy. |
| 3 | Unrecognised plan → 400, no client / auth user / profile | PASS | AC3 ×7 + P5 ×7. `log.inserts.length === 0` covers all three rows; `log.authDeleted.length === 0` proves no invite was issued and rolled back. Guard at `:95` precedes the `createClient` call at `:110`. |
| 4 | Success writes exactly one `client_events` row naming the plan | PASS | AC4 ×3, P1, P2. `:208`. Exactly one row; `type='onboarded'`, `to_plan=growth_pro`, `from_plan=null`, `actor=auth.user.id`. |
| 5 | Forced audit failure still yields a usable client | PASS | AC5 ×3. 200, `client_id`, `user_id`, `plan`, `prompts_created` all intact; zero deletes, zero auth deletes; `audit_logged:false` surfaced. |
| 6 | No file outside `scope_write` modified | PASS (qualified) | Only `onboard-client.js` and `CLAUDE.md` are dirty; `CLAUDE.md` is another session's content-roadmap work, adjudicated in §1.1. Excluded from the commit in §9. |

### 3.2 Packet `011`'s seven criteria

| # | Criterion | Result | Where |
|---|---|---|---|
| 1 | Verdict is the report's first line | PASS | Line 1 |
| 2 | Harness rebuilt, run, output + exit code pasted | PASS | §2.1, exit 0 |
| 3 | All six `008` criteria re-verified with evidence | PASS | §3.1 |
| 4 | Omitted-plan fallback explicitly adjudicated | PASS — **ACCEPTED** | §4 |
| 5 | `clients.plan` accepts `growth_pro`, `client_events.type` accepts `'onboarded'`, closed by production query | PASS | §6.1 |
| 6 | Dash scan reports added vs pre-existing separately | PASS | §7 |
| 7 | Report in `docs/qa/`, filename recorded in `CLAUDE.md` | PARTIAL | Report written. **CLAUDE.md line not written** — `CLAUDE.md` is outside my `scope_write` and currently carries another session's uncommitted edits. Handing the line to Constantin, §9. |

---

## 4. Adjudication: the omitted-plan fallback — **ACCEPTED**

`bg-backend`'s one judgement call beyond the packet text. An omitted `plan`
(`undefined`, `null`, `''`) still falls back to `'essentials'` at
`onboard-client.js:104`; only a *supplied* unrecognised value is a 400.

**Accepted, for four reasons, in order of weight.**

1. **It is not the defect.** `008`'s defect was *fail-open against revenue*: a
   value the admin explicitly chose being silently swapped for a cheaper one. An
   absent optional field being filled with its documented default is a different
   operation. `008` item 2 scopes rejection to "an unrecognised `plan`" — an
   absent field is not an unrecognised value.
2. **It is unreachable from the only caller.** `Onboard.tsx:22` initialises
   `useState<Plan>('essentials')` and `:143` always sends `plan`. Sole caller,
   confirmed by grep in §8.
3. **Rejecting it would be a behavioural regression on the API surface** for any
   non-wizard caller, and the JSDoc at `:9-11` documents `plan?:` as optional.
   Making an optional field mandatory is a breaking change that `008` did not ask
   for.
4. **The fallback is no longer invisible, which is the real fix.** Probe P3 shows
   the audit row records `meta.plan_provided: false` when the default is applied.
   A defaulted Essentials is now distinguishable in the database from a chosen
   one — exactly the property whose absence made the original defect
   undetectable. Coercion was dangerous because it was silent; this default is
   not silent.

Had `bg-backend` hard-400'd an absent plan instead, it would have been defensible
but would have broken the documented contract for no detectable safety gain.

---

## 5. Findings

### V1 — LOW. The audit row records the *requested* plan, not the *persisted* one

**Where:** `onboard-client.js:213` (`to_plan: clientPlan`) versus `:239`
(`plan: client.plan`).

**What.** The response reports what Postgres actually stored (`client.plan`, read
back from `.select().single()`). The audit row reports what the caller asked for
(`clientPlan`, the local variable). Two sources for one fact, in the row whose
entire purpose is to be trustworthy after the fact.

**Failure scenario.** If a DB-side default, trigger, or future CHECK ever caused
`clients.plan` to differ from the submitted value, the audit trail would record
the intended tier while the client was provisioned with another — the audit log
would assert the opposite of the truth, and it is the artifact you would reach
for to detect exactly that class of bug. Demonstrated as probe P6: with the DB
storing `essentials` against a `growth_pro` request, `response.plan =
"essentials"` while `client_events.to_plan = "growth_pro"`.

**Not exploitable today.** §6.1 proves there is no CHECK, no trigger, no rule,
and no domain type on `clients.plan`, and the insert always supplies the column
explicitly, so the `'essentials'::text` column default never fires. The two
values agree in production today. This is defence in depth, not a live bug.

**Fix (one line, for a future packet — do not fix during commit):**
`to_plan: client.plan ?? clientPlan`. Read the audit fact from the same source
the response reads it from.

### V2 — LOW, `PRE-EXISTING`. `clients.plan` still has no migration file

Reconfirmed, and now with the column's real definition captured, which `#94` and
finding V1 of `plans-drift-fix-006.md` could not obtain from source:

```
clients.plan : text, NOT NULL, default 'essentials'::text, no domain, no CHECK
```

That default is the "undocumented DB column default" task `#73` referred to. It
is now documented here. Already on the backlog; not caused by this change; does
not block.

### V3 — INFO. Packet `011`'s pre-existing dash count is off by one

`011` *Do* item 6 predicts "10 pre-existing in the file." The actual count is
**9**. Detail in §7. No code impact; recorded so the next reviewer does not go
hunting for a tenth.

### V4 — INFO, confirms the packet's own R2. Stale enumeration in the migration

`db/supabase-admin-plan-grants-migration.sql:50` comments `client_events.type` as
`plan_change | trial_grant | comp_grant | trial_expired | signup | stripe_change`.
`'onboarded'` is a seventh value and is not listed. Comment only — the column is
plain `text not null` with no CHECK, verified in §6.1, so nothing breaks. Filed,
not fixed, per `011`'s Do-not list.

**No security findings.** No accessibility findings — no UI was changed; the one
new user-visible string is verified reaching the screen in §8.

---

## 6. Production reality checks (`011` Do item 4)

The harness stubs Supabase and accepts every insert by construction, so it proves
the payload and nothing about whether Postgres takes it. Closed by query against
project `duiyifepitvugyulobqm`.

### 6.1 Both writes are accepted

**Every CHECK constraint on the two tables:**

```
table_name | constraint_name         | definition
-----------+-------------------------+--------------------------------------------------------------
clients    | clients_category_check  | CHECK ((category = ANY (ARRAY['active','free','test',
           |                         |         'research','archived'])))
clients    | clients_type_check      | CHECK ((type = ANY (ARRAY['company','individual'])))
```

Two CHECKs, on `category` and `type`-the-client-column. **Neither touches
`clients.plan`, and `client_events` has none at all.** CLAUDE.md's 2026-07-26
finding still holds.

**Column types:** `clients.plan` → `text`, NOT NULL, default `'essentials'::text`,
no domain. `client_events.type` → `text`, NOT NULL, no default, no domain.
Neither is an enum.

**Triggers and rules on `clients` / `client_events`:** query returned `[]`. None.
Nothing can rewrite either value on write.

**Definitive write probe.** Rather than argue from the catalogue, I executed the
exact pair of inserts the function now performs, inside a PL/pgSQL subtransaction
that rolls itself back:

```sql
do $$
declare cid int;
begin
  begin
    insert into public.clients (name, slug, plan, category, type)
      values ('__bgverify_probe__','__bgverify_probe__','growth_pro','test','company')
      returning id into cid;
    insert into public.client_events (client_id, actor, type, from_plan, to_plan, meta)
      values (cid, null, 'onboarded', null, 'growth_pro',
              '{"source":"onboard-client","plan_provided":true}'::jsonb);
    raise exception using errcode = 'P0001', message = '__BGVERIFY_ROLLBACK__';
  exception
    when sqlstate 'P0001' then
      if sqlerrm <> '__BGVERIFY_ROLLBACK__' then raise; end if;
    when others then
      raise exception 'PROBE REJECTED: sqlstate=% message=%', sqlstate, sqlerrm;
  end;
end $$;
```

Completed with **no error** — Postgres accepted both rows. Residue check
afterwards:

```
probe_clients_left | total_clients | probe_events_left | total_events
-------------------+---------------+-------------------+-------------
                 0 |            36 |                 0 |            2
```

Nothing persisted. **The `BLOCK` condition `011` warned about does not exist:**
the audit insert will not fail silently, and the trail this packet exists to
create will materialise.

Corroborating history — values these columns have already accepted:
`clients.plan`: `pro` ×27, `managed` ×4, `growth` ×2, `free` ×2, `essentials` ×1.
`client_events.type`: `plan_change` ×1, `comp_grant` ×1.

### 6.2 CHECKPOINT — closed by query. No client was harmed

`008` and `011` both carry this forward as unclosable without a Stripe
cross-reference, and CLAUDE.md flags the unrecorded 2026-07-26 comparison as
load-bearing. **It is closable from the database, and the answer is clean.**

`stripe-webhook.js:164`, `:237` and `:303` write `clients.stripe_customer_id` and
`clients.stripe_subscription_id`, and the webhook records every event it receives
in `stripe_events`. So local state is a faithful mirror of anything that ever
transacted through the app. Across all 36 clients:

```
clients_with_stripe_sub  | 0
clients_with_stripe_cust | 0
clients_on_essentials    | 1
clients_on_growth_pro    | 0
clients_active           | 8
stripe_events_total      | 0     <-- no Stripe webhook event has EVER been received
clients_with_sub_start   | 0
```

The single Essentials client, identifiers only:

```
id | slug             | plan       | plan_source | category | has_stripe_sub | has_stripe_cust | created
27 | alexandru-teodor | essentials | null        | active   | false          | false           | 2026-07-23
```

**Conclusion.** The coercion could only cause financial harm if someone paid for
Growth or Growth PRO and was served Essentials. Zero Stripe events have ever been
received, zero clients carry any Stripe linkage, and exactly one client sits on
Essentials with no billing attached. **No client was under-provisioned relative
to what they paid. There is nothing to refund or credit, and no remediation
packet is needed.**

**The one caveat, stated plainly.** This proves nothing was billed *through the
app's Stripe integration*. If a customer were ever invoiced outside it — a manual
Stripe invoice not wired to the webhook, or a bank transfer — that would not
appear here. Given only one Essentials client exists at all, the residual
question Constantin needs to answer is a single row: *was `alexandru-teodor`
(client 27, created 2026-07-23) ever billed for Growth or Growth PRO?* If no,
`008`'s CHECKPOINT is fully closed.

---

## 7. Dash scan (`011` Do item 6)

Reported separately as required.

| Measure | Count |
|---|---|
| **Added lines in this diff** | **0** |
| Whole file, working tree | 9 |
| Whole file at `HEAD` | 9 |

`rg -o "[—–]" … | wc -l` → 9 both sides; the diff neither adds nor removes one.
All nine are in JSDoc and inline comments (lines 12, 13, 29, 31, 38, 39, 125,
133, 165) — none in a customer-facing string. Not findings, and per the packet,
not touched.

`011` predicted 10 pre-existing. The true figure is 9 (finding V3). Likely a
line-count/occurrence-count mix-up; `rg -c` reports matching *lines*, which here
also happens to be 9.

---

## 8. Regression surface

Found by grep, not intuition.

| Surface | Finding |
|---|---|
| **Callers of `onboard-client`** | Exactly one: `Onboard.tsx:132`. No other code path posts to it. |
| **Wizard ladder vs backend ladder** | **The critical one.** This change converts silent coercion into a hard 400, so if the wizard could offer a plan `_cost.js` lacks, onboarding would break outright where it previously "worked". Verified by set comparison: `planConfig.ts:159` `PLAN_ORDER` = `free, essentials, growth, growth_pro, managed, pro, enterprise`; `_cost.js` `PLAN_LIVE_ENGINES` keys = identical, same order. `offered but rejected: (none)`, `accepted but unoffered: (none)`, **SET EQUAL: true**. The 400 is unreachable from the wizard. No regression. |
| **Admin actually sees the failure** (`008` item 2's stated intent) | Verified end to end: `Onboard.tsx:151` `if (!res.ok) throw new Error(data.error ?? 'Onboarding failed')` → `:163` `setError(...)` → `:413` rendered in a red bordered box. The 400's plan-ladder message reaches the screen. |
| **`client_events` readers** | One: `Account.tsx:139` (query) and `:636` render, `ev.type.replace(/_/g,' ')` — generic, so `'onboarded'` displays as "onboarded" with no label mapping needed. `:633` handles `from_plan: null` by omitting the arrow. Nothing anywhere switches on `client_events.type`. |
| **`client_events` writers** | `set-client-plan.js:166`, `expire-plan-grants.js:47`, and now `onboard-client.js:208`. Confirms the packet's R1: `signup-client.js`, `stripe-webhook.js` and `provision-account.js` still write none. |
| **`_cost.js` new import** | `onboard-client.js` now requires `./_cost`. Same-directory CJS helper already required by `_auth.js` and `promotions-admin.js`; no cycle (`_cost.js` requires nothing local). Harness loads the real module successfully. |
| **Packet R3 spot-check** | Confirmed accurate. `stripe-webhook.js:45` `SELF_SERVE_PLANS = ['essentials','growth']`; both `:138` and `:230` `return` with a log on an unresolved plan rather than coercing. `provision-account.js:162` hardcodes `plan: 'free'`. Neither carries the `008` defect. |

---

## 9. Commit

`bg-backend` deliberately drafted no command; this is written against the final
diff, by me. **`CLAUDE.md` is excluded** — it is a different session's
uncommitted content-roadmap work (§1.1) and must not ride along in a billing fix.
The single-file `git add` is the whole point of the command's shape.

```bash
cd "C:/Users/const/Constantin Daniel Goane/BrandGEO" && git add brandgeo-dashboard/netlify/functions/onboard-client.js docs/qa/plan-coercion-fix-011.md && git status --short && git commit -m "fix(backend): reject unknown plans at onboarding instead of coercing to Essentials (#008)

VALID_PLANS was a fourth hardcoded copy of the plan ladder missing growth and
growth_pro, and it coerced rather than rejected, so a client onboarded on
Growth (EUR 299) or Growth PRO (EUR 449) was silently provisioned with
Essentials (EUR 99) entitlements with no error surfaced anywhere.

- Derive VALID_PLANS from _cost.js, the mirror that enforces entitlement and
  budget, matching promotions-admin.js and _auth.js.
- An unrecognised plan now returns 400 naming the value and the accepted set.
  An omitted plan keeps its documented 'essentials' default.
- Write a client_events audit row on success recording the provisioned plan,
  with meta.plan_provided distinguishing a chosen tier from a defaulted one.
  Non-fatal and last, so logging can never break provisioning.

Reviewed by bg-verify, packet 011: PASS WITH FINDINGS.
Report: docs/qa/plan-coercion-fix-011.md

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

Check `git status --short` before the commit lands: it must list exactly the two
staged paths, with `CLAUDE.md` still unstaged.

**Then, by hand** (I could not: `CLAUDE.md` is outside my `scope_write` and is
currently dirty from another session). Add to the waterfall table in the
"Conversion initiative" section:

```
| (onboarding plan coercion) | bg-verify | `docs/qa/plan-coercion-fix-011.md` | **COMPLETE 2026-07-27, verdict PASS WITH FINDINGS** |
```

And in the backlog, the "Run packet `008`" item can be closed, recording that the
CHECKPOINT resolved to **no affected clients** — zero Stripe events have ever been
received, so nothing was mis-billed (§6.2).

---

## 10. What was NOT checked

Explicit, per `bg-verify.md` deliverable 7.

1. **The deployed function.** Everything here is the working tree. Nothing is
   committed, nothing is on Netlify. A post-deploy check that a real admin token
   onboarding a real Growth PRO client produces a `growth_pro` row plus one
   `client_events` row is still owed, and no agent can perform it — it needs an
   admin login.
2. **`npm run build`.** Deliberately skipped, §1.4. `tsc --noEmit` passed but does
   not read the changed file.
3. **The real `_auth.js` path.** `requireAuth` is stubbed in both harnesses. I
   verified the call site passes `{ adminOnly: true }` and traced the guard to
   `_auth.js:110`, but did not exercise JWT validation, the origin whitelist, or
   rate limiting. Unchanged by this diff.
4. **Live Stripe.** §6.2 is argued from `clients.stripe_*`, `subscription_started_at`
   and `stripe_events` — the app's own mirror. I have no Stripe API access. The
   single-row residual question is named in §6.2.
5. **Supabase RLS on the insert path.** The function uses the service key, which
   bypasses RLS by design. I read the `client_events` policy (`select` only, admin,
   no insert/update/delete policy — so the trail cannot be tampered with by an
   authenticated user) but did not test it with a viewer token.
6. **Email delivery.** `inviteUserByEmail` is stubbed; no invite was sent or
   verified.
7. **The wizard end to end in a browser.** The 400's path to the screen is traced
   through source (§8), not observed at a viewport.
8. **Concurrency.** Two simultaneous onboards of the same slug rely on the
   pre-existing `23505` handling at `:127`. Unchanged, untested.
9. **The nine pre-existing dashes** and the `_plans.js` V2/V3 findings carried
   from `plans-drift-fix-006.md`. Out of scope, still open.
