# PASS WITH FINDINGS

Second, independent `bg-verify` review ("review A") of packet
`.claude/handoffs/011-bg-backend-to-bg-verify-plan-coercion.md`, which reviews
`bg-backend`'s implementation of packet `008`: the `onboard-client.js` plan
coercion defect.

Run 2026-07-27. Model: Opus 5. Scope: write `docs/qa/` only, read-only
everywhere else. No file under review was edited and no git command that mutates
state was run.

**A prior `bg-verify` report already exists** at `docs/qa/plan-coercion-fix-011.md`
(verdict `PASS WITH FINDINGS`), committed alongside the code in `cf4c78f`. This
report does not overwrite it and was produced without reading its results first;
its structure was skimmed only at the end, to reconcile. Where the two agree, that
is corroboration by two independent runs. Where they differ is called out in §9.

The code itself passes every criterion. The findings below are one correctness
nit, one process breach, and pre-existing debt.

---

## 0. The state the packet describes no longer holds

Packet `011` says the change is "edited on the working tree and is
**uncommitted**: no git command has been run", and instructs `bg-verify` to write
the `git commit` command after the verdict (Do item 8).

**Both premises are false as of this review.** The change is committed and pushed.

```
$ git log --oneline -1 -- brandgeo-dashboard/netlify/functions/onboard-client.js
cf4c78f docs: record scheduled-function auth ruling, prereqs done, correct the cron-registration inference

$ git diff HEAD --stat -- brandgeo-dashboard/netlify/functions/onboard-client.js
(empty: working tree identical to HEAD)

$ git rev-list --left-right --count origin/main...HEAD
0	0
```

`cf4c78f` contains three files:

```
 CLAUDE.md                                          |  79 +++-
 .../netlify/functions/onboard-client.js            |  90 +++-
 docs/qa/plan-coercion-fix-011.md                   | 516 +++++++++++++++++++++
 3 files changed, 671 insertions(+), 14 deletions(-)
```

Consequences, all recorded as finding **A1** in §5:

- The commit is labelled `docs:` but carries a behaviour change to the function
  that decides what tier a paying client is provisioned with. Anyone auditing
  history for billing-path changes will miss it.
- `onboard-client.js` lives under `brandgeo-dashboard/`, so `netlify.toml`'s
  `ignore` diff does **not** cancel the build. This change is deployed to
  production, not pending.
- Do item 8 (write the commit command) is moot. It is answered in §10 as a
  no-op plus the amend that is not available, since the commit is already pushed.

This does not change the verdict. The code passes. The process did not.

---

## 1. Calibration

**1. `git diff --stat` and scope.** The reviewed change is in `HEAD`, not the
working tree, so the meaningful diff is `git show cf4c78f`. Of its three files,
exactly one is code: `brandgeo-dashboard/netlify/functions/onboard-client.js`,
which is packet `008`'s `scope_write`. `CLAUDE.md` and
`docs/qa/plan-coercion-fix-011.md` are documentation written by the same session
and are outside `008`'s `scope_write` but are not code under review.

The current working tree is dirty with **unrelated** work (packet `010`, the
scheduled-function auth build): `netlify.toml`, `expire-plan-grants.js`,
`ping-sitemap.js`, `schedule-collections.js`, deleted `purge-old-*.js`, new
`_cron_auth.js`. None of it is in scope for this review and none of it touches
`onboard-client.js`. Confirmed by `git diff --stat`, pasted in §8.

No file under review was modified outside scope. Not an automatic `BLOCK`.

**2. Secret scan.** Run over the code diff only, names and patterns, no values:

```
$ git show cf4c78f -U0 -- brandgeo-dashboard/netlify/functions/onboard-client.js \
    | grep -niE "api[_-]?key|secret|token|password|bearer|sk-|pk_live|service_role"
secret-scan hits: 0
```

**0 hits.** No secret appears in the diff. `SUPABASE_SERVICE_KEY` is read from
`process.env` at `onboard-client.js:110`, which is pre-existing and correct.

**3. Acceptance criteria, verbatim and checkability.** Packet `011`'s seven and
packet `008`'s six are restated verbatim in §3. All thirteen are objectively
checkable. One requires an external system this agent cannot reach (the Stripe
side of the CHECKPOINT) and is handled in §7; it was never an acceptance
criterion, it is an open question the packet explicitly says `bg-verify` cannot
close.

**4. tsc and build baseline.** `brandgeo-dashboard/tsconfig.json:20` is
`"include": ["src"]`. `netlify/functions/` is not in it, so neither `npx tsc
--noEmit` nor `npm run build` reads, type-checks, or bundles the changed file. A
green build would be evidence about a different part of the repo, so it was
deliberately not used as a pass row. The applicable check is the CommonJS parse:

```
$ node --check brandgeo-dashboard/netlify/functions/onboard-client.js
syntax OK
```

**5. Auth check on the most sensitive function touched.**
`onboard-client.js:72`: `const auth = await requireAuth(event, { adminOnly: true })`,
followed by `if (auth.response) return auth.response` at `:73`. It is the first
statement in the handler, before the method check, before JSON parsing, before
any Supabase client is constructed. `_auth.js:109` enforces
`adminOnly && profile.role !== 'admin'` server-side against `user_profiles.role`,
returning `403`. Verified live against production:

```
$ curl -X POST https://app.getbrandgeo.com/.netlify/functions/onboard-client \
    -d '{"name":"...","slug":"...","contact_email":"...","plan":"platinum"}'
status=401
{"error":"Unauthorized: missing token"}
```

An unauthenticated caller reaches nothing. A free-tier or viewer caller reaches
`403` at `_auth.js:109`. Neither can provision a client, write a `client_events`
row, or read one (`client_events` has a select-only RLS policy gated on
`is_admin()`, see §6.3).

**6. Write access.** This report is the only file written, at
`docs/qa/plan-coercion-fix-011-review-a.md`. No reviewed file was edited. No git
command was run other than read-only `log`, `show`, `status`, `diff`,
`rev-list`.

**CALIBRATED**, with the standing correction in §0: the packet's stated
uncommitted-working-tree premise is stale.

---

## 2. Harness, rebuilt and run independently

Written from scratch at
`<scratchpad>/harness-008-reviewA.js`, outside the repo. It stubs
`@supabase/supabase-js` and `./_auth` in the require cache and drives the real
`exports.handler` from the real file, so every assertion is behavioural. No
network, no Supabase, no env vars. `bg-backend`'s claimed result was not
consulted.

It reproduces the packet's harness and adds six probe groups of my own (`RA1`
through `RA6`) that the packet's harness does not assert.

```
=== packet 008 acceptance harness (review A, independently rebuilt) ===

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
PASS  RA1  plan "__proto__" -> 400, no rows written
PASS  RA1  plan "constructor" -> 400, no rows written
PASS  RA1  plan "toString" -> 400, no rows written
PASS  RA1  plan "hasOwnProperty" -> 400, no rows written
[onboard-client] audit row threw for client 42: forced client_events throw
PASS  RA2  a THROWN audit insert is caught, still 200, audit_logged false
PASS  RA3  rejected plan invites no auth user and deletes nothing
PASS  RA4  default path: audit to_plan matches clients.plan and records plan_provided:false
PASS  RA5  an unrecognised role still coerces to viewer (fail-safe, per 008)
PASS  RA6  role:"admin" provisions an admin profile and the audit row records it

PASS
EXIT CODE: 0
```

**38 assertions, 0 failures, exit code 0.**

### 2.1 What my six additions prove that the packet's harness does not

| Probe | Why it was added | Result |
|---|---|---|
| `RA1` | `VALID_PLANS` is a `Set` built from `Object.keys()`. Had it been a plain-object lookup, `plan: "__proto__"` or `"constructor"` would be truthy and provision a client on a garbage tier. The `Set` is the correct choice and this proves it. | 400 on all four, 0 inserts |
| `RA2` | The packet's `AC5` only forces a *returned* `{ error }`. A driver that **throws** (network reset, malformed jsonb) is a different path. The `try/catch` at `:207` handles it and still returns 200. | 200, `audit_logged:false`, 0 rollbacks |
| `RA3` | Confirms the rejection fires before `inviteUserByEmail`, so a mistyped tier cannot burn a Supabase invite email or orphan an auth user. | 0 inserts, 0 invites, 0 deletes |
| `RA4` | The audit trail is the whole point of `008` item 3. If the default path wrote `to_plan` inconsistent with `clients.plan`, the trail would lie on exactly the rows the defect produced. It does not, and `meta.plan_provided:false` marks the default path explicitly. | consistent |
| `RA5` | `008` item 2 explicitly keeps role coercion. Verifies it was not "fixed" by accident, which would break admin onboarding. | coerces to `viewer` |
| `RA6` | The privilege path. An explicit `role:"admin"` must still be honoured and must be recorded in the audit row, or admin creation becomes untraceable. | honoured and recorded |

---

## 3. Acceptance criteria

### 3.1 Packet `008`'s six criteria

| # | Criterion (verbatim) | Result | Evidence |
|---|---|---|---|
| 1 | "`grep -n "VALID_PLANS" onboard-client.js` shows a list derived from `_cost.js`, not a literal array." | PASS | `onboard-client.js:65` `const VALID_PLANS = new Set(Object.keys(PLAN_LIVE_ENGINES))`, imported at `:58` from `./_cost`. The harness iterates `Object.keys(PLAN_LIVE_ENGINES)` rather than a literal, so it would fail if the derivation were ever replaced by a hand-copied array that drifts. |
| 2 | "Posting `plan: "growth_pro"` provisions a client whose `clients.plan` reads `growth_pro`. Posting `plan: "growth"` yields `growth`." | PASS | Harness `AC2`, 7/7. Both named tiers written and returned verbatim. |
| 3 | "Posting an unrecognised plan returns `400` and creates no client row, no auth user, and no `user_profiles` row." | PASS | Harness `AC3` 7/7 plus `RA1` 4/4 plus `RA3`. `log.inserts.length === 0` and `log.authDeleted.length === 0` on every case. Code order confirms it: the guard at `:95` precedes `createClient` at `:110`. |
| 4 | "A successful onboard writes exactly one `client_events` row naming the plan." | PASS | Harness `AC4`. Exactly one row; `to_plan:'growth_pro'`, `from_plan:null`, `client_id:42`, `actor:'admin-uuid'`, `meta` an object. Shape matches `set-client-plan.js:166`. |
| 5 | "A forced failure of the `client_events` insert still yields a fully created, usable client." | PASS | Harness `AC5` (returned error) and `RA2` (thrown error). 200 in both, `client_id`/`user_id`/`plan`/`prompts_created` all populated, `log.deletes.length === 0`. |
| 6 | "No file outside `scope_write` is modified." | PASS with note | The only code file in `cf4c78f` is `onboard-client.js`, which is `008`'s `scope_write`. `CLAUDE.md` and the prior QA report also ride in that commit; they are documentation, not reviewed code, and `011`'s own `scope_write` is `docs/qa/`. Recorded as part of finding **A1** because the bundling is the process problem, not a scope violation of the code. |

### 3.2 Packet `011`'s seven criteria

| # | Criterion | Result | Evidence |
|---|---|---|---|
| 1 | Verdict is the first line of the report | PASS | Line 1: `# PASS WITH FINDINGS` |
| 2 | Harness rebuilt and run independently, output and exit code pasted | PASS | §2. 38 assertions, `PASS`, exit 0. Written from scratch, `bg-backend`'s result not consulted. |
| 3 | All six `008` criteria re-verified with pasted evidence | PASS | §3.1, every row carries a `path:line` or pasted output |
| 4 | Omitted-plan fallback explicitly adjudicated | PASS | §4. **ACCEPTED.** |
| 5 | `clients.plan` accepts `growth_pro` and `client_events.type` accepts `'onboarded'`, closed by production query | PASS | §6. Constraint query plus a rolled-back live insert of both values. |
| 6 | Dash scan reports added and pre-existing counts separately | PASS | §8. **0 added, 9 pre-existing.** The packet predicted 10; see finding **A3**. |
| 7 | Report written to `docs/qa/`, filename recorded in `CLAUDE.md` | PARTIAL | Report written. `CLAUDE.md` is `bg-orchestrator`'s to update and is currently dirty with packet `010` work; `bg-verify` does not write outside `docs/qa/`. The filename to record is given in §10. |

---

## 4. Adjudication: the omitted-plan fallback. **ACCEPTED**

The judgement call: a *supplied but unrecognised* plan is a `400`
(`onboard-client.js:95`), but an *omitted* plan (`undefined`, `null`, `''`)
still falls back to `'essentials'` (`:104`).

Accepted, on four independent grounds:

1. **It matches the packet text.** `008` item 2 scopes the rejection to "an
   unrecognised `plan`". An absent optional field is not an unrecognised value.
   `onboard-client.js:9` documents `plan?` as optional with a stated default, and
   that contract predates this change.
2. **It is not the defect.** The defect `008` exists to fix is *silent
   downgrade of a value the admin actually chose*. An omitted field carries no
   admin intent to contradict, so there is nothing to fail loudly about.
3. **The path is unreachable from the only caller.** `Onboard.tsx:22` initialises
   `plan` state to `'essentials'` and `:143` always sends it. `:240`'s `<select>`
   maps `PLAN_ORDER`, which is `['free','essentials','growth','growth_pro',
   'managed','pro','enterprise']` (`planConfig.ts:159`), byte-identical to
   `Object.keys(PLAN_LIVE_ENGINES)` in `_cost.js:109`. **No option the wizard
   offers can be rejected, and no wizard submission can omit the field.**
4. **The DB agrees.** `clients.plan` is `NOT NULL DEFAULT 'essentials'::text`
   (queried, §6.1). Rejecting an omitted plan would put the function at odds with
   its own column default.

Counter-argument considered and rejected: a future non-wizard caller (a script,
a partner integration) could omit `plan` and silently get Essentials, which is
the same failure mode by a different door. That is real but is a *new* caller's
problem, it is documented behaviour, and `RA4` proves the audit row now records
`meta.plan_provided:false` on exactly that path, so it is detectable after the
fact. That is the property `008` item 3 was asking for. Making it a hard `400`
would be a contract change to an optional field, which is out of `008`'s scope.

**No change requested.**

---

## 5. Findings

### A1. MEDIUM, process. The reviewed change was committed and pushed under a `docs:` label before this review, bundled with unrelated work

**What.** `cf4c78f` carries an 90-line behaviour change to `onboard-client.js`,
the function that decides what tier a paying client is provisioned with, under
the subject line `docs: record scheduled-function auth ruling, prereqs done,
correct the cron-registration inference`. It also bundles a `CLAUDE.md` rewrite
and a 516-line QA report.

**Where.** `cf4c78f`, `git show --stat` pasted in §0.

**How it breaks.** Three concrete ways, none hypothetical:

1. `git log --grep="fix\|feat" -- netlify/functions/` will not surface the
   commit that changed provisioning. AGENT-OS's audit trail over billing-path
   changes depends on the subject line, and this one hides it.
2. `git revert cf4c78f` to back out the code change would also revert `CLAUDE.md`
   and delete the QA report. There is no clean rollback of the code alone.
3. Packet `011` Do item 8 assigned the commit command to `bg-verify` precisely so
   an unreviewed command would not be copied forward. That gate was bypassed:
   the code, the review of it, and unrelated docs landed in one push. A second
   reviewer (this one) therefore reviews already-deployed code.

**Fix.** Not revertable now (pushed, `0 0` against `origin/main`). Forward-only:
record in AGENT-OS that a commit touching `netlify/functions/` must carry a
`fix(functions):` or `feat(functions):` subject and must not be bundled with
docs, and that the builder does not run `git add -A`. Note in `CLAUDE.md` that
`cf4c78f` contains the packet `008` fix despite its `docs:` label, so future
history searches find it.

### A2. LOW. The audit row records the requested plan, not the persisted one

**What.** `onboard-client.js:212` writes `to_plan: clientPlan`, the value derived
from the request. The 200 response at `:239` returns `plan: client.plan`, the
value Postgres actually stored and returned from the `.select().single()` at
`:121`. Two different sources for the same fact.

**Where.** `onboard-client.js:212` versus `:239`.

**How it breaks.** Today it cannot: `clients.plan` is plain `text` with no
trigger (`pg_trigger` on `client_events` returns empty, and the insert returns
the row as written), so the two values are always equal. It becomes a real defect
the moment anyone adds a `BEFORE INSERT` trigger or a domain that normalises
`plan`. At that point the audit trail, which exists specifically to record what a
client was provisioned with, would record what was *asked for* instead. That is
the one thing this row must never get wrong.

**Fix.** One line: `to_plan: client.plan ?? clientPlan`. Same source as the
response. Not worth its own deploy; fold into the next touch of this file.

### A3. INFO. The packet's pre-existing dash count is off by one

`011` Do item 6 predicts "10 pre-existing in the file". Measured: **9**. All nine
are in JSDoc and inline comments (lines 12, 13, 29, 31, 38, 39, 125, 133, 165),
none in rendered copy, and none on an added line. Full listing in §8. The
prediction, not the code, is wrong. No action.

### A4. INFO, `PRE-EXISTING`. `clients.plan` still has no migration file

`db/` contains no `CREATE`/`ALTER` for `clients.plan`; the column was made ad hoc
(task `#94`). Queried directly, it is `text NOT NULL DEFAULT 'essentials'::text`
with no CHECK. This is why §6 had to be closed by query rather than by reading
source, and it is the same gap that made packet `006`'s V1 unverifiable. Already
on the CLAUDE.md backlog. Not a blocker, not this packet's to fix.

### A5. INFO, confirms the packet's own R2. Stale type enumeration in the migration

`db/supabase-admin-plan-grants-migration.sql:50` comments
`-- plan_change | trial_grant | comp_grant | trial_expired | signup | stripe_change`.
`'onboarded'` is a seventh value not listed. **Comment only, no CHECK
constraint** (confirmed, §6.1), so nothing breaks at runtime. The risk is that
someone later converts that comment into a CHECK and silently kills the audit
insert (which is non-fatal by design, so it would fail invisibly). Worth one line
when `db/` is next touched.

### Security findings

**None.** Specifically checked and clean:

- The change adds no new endpoint, no new query parameter, no new auth path.
- `adminOnly: true` is unchanged and is the first statement in the handler
  (`:72`). Live probe returns `401` to an unauthenticated caller.
- The rejected-plan value is interpolated into an error string at `:100` and
  returned via `JSON.stringify`, so a hostile value cannot break out of the JSON
  envelope. The endpoint is admin-only regardless, so there is no untrusted
  caller.
- `VALID_PLANS` as a `Set` is immune to prototype-chain keys (`RA1`).
- The audit row is written with the service key, which bypasses RLS.
  `client_events` has exactly one policy, `client_events_select`, `SELECT` only,
  `to authenticated`, `using (is_admin())` (§6.3). No insert, update, or delete
  policy exists, so an authenticated viewer can neither read another client's
  audit trail nor tamper with their own. The append-only property holds.
- `meta` records `slug`, `role`, `plan_provided`, `prompts_created`,
  `default_market_id`. No email, no token, no password, no secret.

### Accessibility findings

The diff changes no markup. It routes a new message through one pre-existing
surface: the wizard's error line, `Onboard.tsx:413`,
`text-xs text-red-400 bg-red-500/10 border border-red-500/20`, reached via
`:152` `if (!res.ok) throw new Error(data.error ?? 'Onboarding failed')`.

Contrast computed for that pair, since it is the one place this change makes new
text visible to a human:

- Foreground `text-red-400` = `#f87171`, relative luminance 0.3295.
- Background `bg-red-500/10` (`#ef4444` at 10%) composited over `--dark-800`
  = `rgb(15 23 42)` (`index.css:8`), giving `rgb(37 28 45)`, luminance 0.01414.
- **Contrast ratio 5.92:1.** Passes WCAG 1.4.3 AA for normal text (4.5:1) at the
  12px `text-xs` size used.

Keyboard reachability, focus visibility, heading order, hit targets: no new
interactive element, so nothing to assess. The message is rendered as static
text in the existing flow, not a toast or a dialog, so it is reachable by a
screen reader in document order.

### Data and claim integrity

The one user-facing string this change introduces is the rejection message,
`onboard-client.js:100`:
`Unknown plan "<value>". Must be one of: <full accepted set>.`

Both halves are traced. The rejected value is echoed from the request. The
accepted set is `[...VALID_PLANS].join(', ')`, derived at `:65` from
`_cost.js:109`, so it cannot state a tier the product does not serve, and it
cannot go stale when the ladder changes. Harness `AC3b` asserts the message
contains both the rejected value and every key of `PLAN_LIVE_ENGINES`.

No number is presented to a user by this change.

---

## 6. Production reality checks (packet `011` Do item 4)

The harness proves the payload. It cannot prove Postgres accepts it, because the
stub accepts every insert by construction. Closed by query against the live
project `duiyifepitvugyulobqm`.

### 6.1 No CHECK constraint blocks either value

```sql
select conrelid::regclass::text as table_name, conname, pg_get_constraintdef(oid)
from pg_constraint
where contype='c' and conrelid in ('public.clients'::regclass,'public.client_events'::regclass);
```

```
clients | clients_category_check | CHECK ((category = ANY (ARRAY['active','free','test','research','archived'])))
clients | clients_type_check     | CHECK ((type = ANY (ARRAY['company','individual'])))
```

**Two CHECK constraints on `public.clients`, neither on `plan`. Zero CHECK
constraints on `public.client_events`.** This reproduces CLAUDE.md's 2026-07-26
finding and confirms it still holds. `client_events.type` is `text NOT NULL` with
no default and no constraint, so `'onboarded'` is accepted. `pg_trigger` on
`client_events` returns no non-internal triggers, so nothing rewrites the row.

### 6.2 Both writes proven accepted, then rolled back

Constraint absence is inference. This is the direct proof: a real insert of both
values in one transaction, deliberately aborted so nothing persists.

```sql
DO $$
DECLARE cid int;
BEGIN
  INSERT INTO public.clients (name, slug, plan)
  VALUES ('bg-verify dry run','bg-verify-dry-run-reviewa','growth_pro') RETURNING id INTO cid;
  INSERT INTO public.client_events (client_id, actor, type, from_plan, to_plan, meta)
  VALUES (cid, NULL, 'onboarded', NULL, 'growth_pro', '{"source":"onboard-client","plan_provided":true}'::jsonb);
  RAISE EXCEPTION 'BG-VERIFY DRY RUN OK -> clients.plan=growth_pro ACCEPTED (temp id %), client_events.type=onboarded ACCEPTED. Transaction deliberately rolled back, nothing persisted.', cid;
END $$;
```

```
ERROR:  P0001: BG-VERIFY DRY RUN OK -> clients.plan=growth_pro ACCEPTED (temp id 49),
        client_events.type=onboarded ACCEPTED. Transaction deliberately rolled back, nothing persisted.
```

Reaching the `RAISE` proves both inserts passed every constraint, the FK, and the
`NOT NULL`s. The exception rolled the transaction back. Verified clean afterwards:

```
total_clients | total_events | probe_leftovers
           36 |            2 |               0
```

Unchanged from before the probe. The only side effect is two consumed sequence
values (`clients_id_seq`, `client_events_id_seq`), which is harmless and is
disclosed here rather than hidden.

**Conclusion: the fix reaches production intact. Not a `BLOCK`.**

### 6.3 RLS on the new audit row

```
policyname            | cmd    | roles         | qual
client_events_select  | SELECT | authenticated | is_admin()
```

One policy, select only, admin only. No insert/update/delete policy, so only the
service role writes, and the log is append-only from every other caller. Matches
`db/supabase-admin-plan-grants-migration.sql:65`.

---

## 7. The CHECKPOINT, materially narrowed (but still Constantin's to close)

Packet `011` states affected clients "cannot be found in Supabase" and that
detection requires cross-referencing Stripe subscriptions against `clients.plan`.
The first half is true for the general case. The specific case is much smaller
than that framing implies, and the database can bound it.

A coercion victim reads `plan = 'essentials'`. The full population:

```sql
select plan, category, count(*), count(*) filter (where created_at >= '2026-07-09')
from public.clients group by plan, category;
```

```
essentials | active   |  1 | 1
free       | active   |  1 | 1
free       | free     |  1 | 1
growth     | active   |  2 | 2
managed    | active   |  4 | 1
pro        | research | 27 | 27
```

**Exactly one client in the entire database reads `essentials`.** Id 27,
`alexandru-teodor`, created 2026-07-23, category `active`. That is the complete
candidate set, not a starting point for one.

The Stripe side is empty:

```
clients_with_stripe_sub | clients_with_stripe_cust | clients_with_sub_start
                      0 |                        0 |                      0
```

and `public.stripe_events` holds **0 rows**, so no Stripe webhook has ever fired
into this system.

The two `growth` clients are both explained and neither is a victim: id 24
reached `growth` via a `comp_grant` from `managed` (`client_events` id 2,
`grant_until 2026-08-20`), a free grant, not a purchase; id 20 has no
`client_events` row at all, so its plan was set outside `set-client-plan.js`,
which a coerced row could never produce (coercion always writes `essentials`).

**What this means.** No client in the database is on a Stripe subscription of any
kind, so the specific harm the CHECKPOINT describes, a customer paying EUR 299 or
EUR 449 while served Essentials entitlements, has no instance recorded in this
system. The residual question is one client, not an audit.

**What it does not mean, and why this is still `NEEDS_HUMAN`.** The database
cannot see revenue collected outside Stripe (invoice, transfer, a Stripe account
never linked to `clients`). Two of the seven columns that would prove payment are
simply never populated. So this narrows the CHECKPOINT to a single answerable
question rather than closing it:

> Was client 27 (`alexandru-teodor`, onboarded 2026-07-23) intended to be on
> Essentials, and is it paying Essentials?

If yes, `008`'s CHECKPOINT closes with no remediation. If no, remediation is a
separate packet involving a refund or credit decision, which is neither
`bg-backend`'s call nor `bg-verify`'s. Either way, **record the answer**, since
`011` notes the 2026-07-26 comparison was run and its result never written down,
and that omission is what forced this re-derivation.

---

## 8. Working tree, and the dash scan

```
$ git diff --stat
 brandgeo-dashboard/netlify.toml                     | 33 ++++++-----
 .../netlify/functions/expire-plan-grants.js         | 32 ++++++++--
 .../netlify/functions/ping-sitemap.js               | 68 +++++++++++++++-----
 .../netlify/functions/purge-old-audits.js           | 47 ---------------
 .../netlify/functions/purge-old-results.js          | 33 -----------
 .../netlify/functions/schedule-collections.js       | 43 ++++++++++----
 6 files changed, 133 insertions(+), 123 deletions(-)
```

All six belong to packet `010` (scheduled-function auth), not to this review.
`onboard-client.js` does not appear: it is clean against `HEAD`.

Dash scan, added lines versus pre-existing, reported separately as required:

```
$ git show cf4c78f -- .../onboard-client.js | rg "^\+" | rg -c "[—–]"
0

$ rg -c "[—–]" brandgeo-dashboard/netlify/functions/onboard-client.js
9
```

**0 on added lines. 9 pre-existing** (lines 12, 13, 29, 31, 38, 39, 125, 133,
165), every one inside JSDoc or an inline comment, none in a string returned to a
user. Not fixed, per `011` Do item 6: they are outside this diff. The packet
predicted 10; see finding **A3**.

---

## 9. Regression surface

Found by grep, not intuition. `grep -rn "client_events"` across `*.js`, `*.ts`,
`*.tsx`, `*.sql`, excluding `node_modules` and `dist`:

| Path | Role | Impact |
|---|---|---|
| `src/pages/Account.tsx:139` | **The only reader.** Selects `id, type, from_plan, to_plan, created_at, meta`, last 6 per client, admin only. | Safe. |
| `src/pages/Account.tsx:636` | Renders `ev.type.replace(/_/g,' ')`. Generic, no label map, no `switch`. | `'onboarded'` renders as "onboarded". |
| `src/pages/Account.tsx:633` | `PLAN_LABELS[ev.to_plan as Plan] ?? ev.to_plan` | `PLAN_LABELS` (`planConfig.ts:161`) contains all seven tiers including `growth_pro: 'Growth PRO'`, so the new rows label correctly. `from_plan: null` renders as `to_plan` alone, which is right for a creation event. |
| `netlify/functions/set-client-plan.js:166` | Other writer | Untouched. |
| `netlify/functions/expire-plan-grants.js:70` | Other writer | Untouched by this change (it is dirty from packet `010`, unrelated). |
| `netlify/functions/delete-client.js:100` | Relies on `on delete cascade` | Holds; FK confirmed in §6.1's schema read. |

**Nothing switches on `client_events.type`.** Adding a seventh value breaks no
consumer. Verified, not assumed.

New import risk: `onboard-client.js:58` now requires `./_cost`. That adds no
module-load risk, because `_auth.js:19` already requires `./_cost`, and
`onboard-client.js:57` already required `./_auth`. `_cost.js` was therefore
already loaded on every onboarding request before this change.

Callers of the endpoint: one, `Onboard.tsx:132`. Its `plan` state
(`Onboard.tsx:22`) is `Plan`-typed and its `<select>` (`:240`) maps `PLAN_ORDER`,
which matches the accepted set exactly, so the new `400` is unreachable from the
wizard's own options and is reachable only from a malformed or hand-crafted
request. When it does fire, `Onboard.tsx:152` throws with `data.error` and `:413`
renders it, so the admin sees the real message. **The "admin has to see it fail"
requirement in `008` item 2 holds end to end**, not just at the function
boundary.

### Reconciliation with the prior report

Read only after the above was complete. `docs/qa/plan-coercion-fix-011.md` also
returns `PASS WITH FINDINGS`, also accepts the omitted-plan fallback, also finds
the requested-versus-persisted plan nit (their V1, my A2), also finds the dash
count off by one (their V3, my A3), and also closes the CHECKPOINT by query.
Two independent runs converging on the same four conclusions is the strongest
evidence available here.

**Where this review adds something the prior one does not:** finding **A1**. The
prior report was written before, and committed inside, the commit it was
reviewing, so it could not observe that its own subject was shipped under a
`docs:` label and pushed to production ahead of any second look. That is the one
material gap, and it is a process finding, not a code one.

---

## 10. Commit

Packet `011` Do item 8 asks `bg-verify` to write the `git add`/`git commit`
command. **There is nothing to commit for the reviewed change:** it is already in
`HEAD` and already pushed (`git rev-list --left-right --count origin/main...HEAD`
returns `0 0`). Amending is not available without a force push over a pushed
commit, which is not worth it for a subject line.

The only thing to commit is this report. **Do not use `git add -A`**: the working
tree carries unrelated packet `010` work that belongs to a different review.

```bash
git -C "C:/Users/const/Constantin Daniel Goane/BrandGEO" add docs/qa/plan-coercion-fix-011-review-a.md
```

```bash
git -C "C:/Users/const/Constantin Daniel Goane/BrandGEO" commit -m "docs(qa): second independent bg-verify review of packet 011 (plan coercion), PASS WITH FINDINGS" -m "Corroborates docs/qa/plan-coercion-fix-011.md across 38 independently rebuilt assertions. Adds finding A1: cf4c78f shipped the packet 008 fix to production under a docs: subject line, bundled with CLAUDE.md and the prior QA report, ahead of any second review. Narrows the 008 CHECKPOINT to a single client (id 27) and records that no client in the database carries a Stripe subscription."
```

Filename to record in `CLAUDE.md` (`bg-orchestrator`'s to write, not
`bg-verify`'s): `docs/qa/plan-coercion-fix-011-review-a.md`.

---

## 11. What was NOT checked

Explicit, per the role definition.

1. **Which build Netlify is actually serving.** `cf4c78f` touches
   `brandgeo-dashboard/`, so `netlify.toml`'s `ignore` diff does not cancel it,
   and the live endpoint answers (`401`). But the deployed bundle's *version* was
   not confirmed: proving the fix is live would need an authenticated admin POST
   of an invalid plan and a `400`, which requires an admin login no agent has.
   The Netlify deploy log was not read.
2. **The end-to-end wizard flow in a browser.** No admin credentials. The 400 path
   was traced through `Onboard.tsx:152` and `:413` by reading source, not by
   observing it render at a named viewport.
3. **`npx tsc --noEmit` and `npm run build`.** Deliberately skipped, with reason:
   `tsconfig.json:20` is `"include": ["src"]`, so neither reads the changed file.
   `node --check` was run instead and passes.
4. **The Stripe side of the CHECKPOINT.** No Stripe access. §7 bounds it from the
   database only; the residual question about client 27 is Constantin's.
5. **The three other provisioning paths** (`signup-client.js`,
   `stripe-webhook.js`, `provision-account.js`). Read only far enough to confirm
   packet `011`'s R1 and R3 claims are plausible; not independently reviewed.
   They remain audit-trail-free (R1) and that gap is real, but it is outside
   `008` and outside this packet.
6. **Light mode** for the error surface in §5. The contrast figure given is dark
   mode only (`--dark-800` = `rgb(15 23 42)`). Light mode overrides that token to
   `255 255 255` (`index.css:33`), which would change the ratio. Light mode
   remains unaudited across this codebase, as CLAUDE.md already records.
7. **Load and concurrency.** Two admins onboarding the same slug simultaneously
   was not exercised. Pre-existing behaviour, unchanged by this diff (the unique
   violation path at `:127` is untouched).
8. **The packet `010` changes in the working tree.** Explicitly out of scope for
   this review. They have not been reviewed by anyone here and should not be
   assumed safe on the strength of this verdict.
