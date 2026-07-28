---
id: 011
from: bg-backend
to: bg-verify
status: READY
created: 2026-07-27
scope_write: docs/qa/
scope_read: brandgeo-dashboard/netlify/functions/onboard-client.js, brandgeo-dashboard/netlify/functions/_cost.js, brandgeo-dashboard/netlify/functions/_auth.js, brandgeo-dashboard/netlify/functions/set-client-plan.js, brandgeo-dashboard/netlify/functions/expire-plan-grants.js, brandgeo-dashboard/netlify/functions/promotions-admin.js, brandgeo-dashboard/netlify/functions/stripe-webhook.js, brandgeo-dashboard/netlify/functions/provision-account.js, brandgeo-dashboard/netlify/functions/signup-client.js, brandgeo-dashboard/src/pages/Onboard.tsx, brandgeo-dashboard/src/pages/Account.tsx, db/supabase-admin-plan-grants-migration.sql, .claude/handoffs/008-dashboard-auditor-to-bg-backend-plan-coercion.md
model: opus
---

## Decision

`bg-backend` ran packet `008` against `onboard-client.js`. All four "Do" items
are implemented. The file is edited on the working tree and is **uncommitted**:
no git command has been run, per `008`'s builder/reviewer separation and
AGENT-OS §2. `onboard-client.js` is the only file modified.

The change is billing-adjacent (it decides what tier a paying client is
provisioned with), so `bg-backend.md` OBJECTIVE #5 makes a `bg-verify` handoff
mandatory. This packet is that handoff. Nothing is committed until this review
lands.

`bg-backend`'s own run of the acceptance harness (§Harness below) printed `PASS`,
exit 0, 29 assertions. Reproduce it rather than trusting that.

**The `008` CHECKPOINT is still open and this packet cannot close it.** See
"Open questions for Constantin".

## What changed

One file: `brandgeo-dashboard/netlify/functions/onboard-client.js`.
`git diff --stat` on it: 1 file changed, 85 insertions(+), 5 deletions(-).
(`CLAUDE.md` also shows modified in `git status`; it was already dirty at the
start of this session and `bg-backend` did not touch it. Confirm that
independently.)

1. **`VALID_PLANS` derived, not hand-written.** Was
   `['free','essentials','managed','pro','enterprise']` (a fourth mirror of the
   ladder, missing `growth` and `growth_pro`). Now
   `new Set(Object.keys(PLAN_LIVE_ENGINES))` requiring `./_cost`, the same
   pattern as `promotions-admin.js:40` and `_auth.js:28`. `_cost.js` was chosen
   over `_plans.js` deliberately: it is the mirror that enforces entitlement and
   budget, and `008` forbids touching `_plans.js`.
2. **Rejection replaces coercion.** `VALID_PLANS.includes(plan) ? plan :
   'essentials'` is gone. A supplied plan outside the ladder now returns `400`
   with `Unknown plan "<value>". Must be one of: <full accepted set>.` and
   provisions nothing.
   **Judgement call worth reviewing:** an *omitted* plan (`undefined`, `null`,
   `''`) still falls back to `'essentials'`. Rationale: that is the documented
   optional-field default in this function's own JSDoc, not a mis-typed tier,
   and `008` item 2 scopes the rejection to "an unrecognised `plan`". The sole
   caller, `Onboard.tsx:22`, always sends one (state initialised to
   `'essentials'`), so the fallback is unreachable from the wizard. If you read
   `008` as requiring a hard `400` on an absent plan too, say so and this
   becomes a one-line change.
3. **`VALID_ROLES` left coercing**, per `008` item 2, with a comment recording
   why (defaulting to `viewer` is least-privilege and fail-safe).
4. **`client_events` audit row on success.** New step 5, same row shape as
   `set-client-plan.js:166` and `expire-plan-grants.js:47`:
   `{ client_id, actor: auth.user.id, type: 'onboarded', from_plan: null,
   to_plan: clientPlan, meta }`. `meta` carries `source`, `slug`, `role`,
   `plan_provided`, `prompts_created`, `default_market_id`.
5. **The audit insert cannot break provisioning** (`008` item 4). It is last,
   after every step that can roll back, wrapped in `try/catch`, checks
   `eventErr` explicitly, logs on failure, and never returns non-200. It creates
   nothing any other step depends on, so it cannot leave a half-created client.
   If any earlier rollback fires, the line is never reached, so no orphan row is
   written (and `client_events.client_id` is `on delete cascade` anyway).
   The 200 response now carries `audit_logged: boolean` so a silent audit gap is
   observable by the caller. `Onboard.tsx` ignores unknown response fields.

## Do

1. **Reproduce the harness in §Harness independently.** Write it yourself from
   the source below, run it, paste the output and exit code. Do not quote
   `bg-backend`'s result. It stubs `@supabase/supabase-js` and `./_auth` in the
   require cache and drives the REAL `exports.handler`, so it is behavioural,
   not a paraphrase.
2. **Re-check every `008` acceptance criterion against the actual diff**, not
   against this summary:
   - `grep -n "VALID_PLANS" onboard-client.js` shows a derived list.
   - `plan: "growth_pro"` writes `clients.plan = 'growth_pro'`; `"growth"` writes
     `'growth'`.
   - An unrecognised plan returns `400` and creates no `clients`, no auth user,
     no `user_profiles` row.
   - A success writes exactly one `client_events` row naming the plan.
   - A forced `client_events` failure still yields a fully created client.
   - No file outside `scope_write` modified.
3. **Adjudicate the omitted-plan fallback** described in "What changed" item 2.
   That is the one place `bg-backend` exercised judgement beyond the packet text.
4. **Confirm the write actually lands in production.** The harness proves the
   payload; it cannot prove Postgres accepts it. `clients.plan` has no migration
   file in `db/` (the column was created ad hoc, see `#94`), so this must be
   closed by query, not by reading source. CLAUDE.md records a 2026-07-26
   `pg_constraint` check finding only `clients_category_check` and
   `clients_type_check`, neither touching `plan`. Confirm that still holds, and
   confirm `client_events` accepts `type = 'onboarded'`: that table's `type`
   column is plain `text` with no CHECK in
   `db/supabase-admin-plan-grants-migration.sql:50`, but the column comment
   enumerates six values and `'onboarded'` is not among them. If a CHECK was
   added ad hoc since, the audit insert fails silently (non-fatal by design) and
   the audit trail this packet exists to create never materialises. That would
   be a `BLOCK`.
5. **Trace what reads the new row.** `Account.tsx:636` renders
   `ev.type.replace(/_/g,' ')` generically, so `'onboarded'` displays without a
   label mapping. Confirm nothing else switches on `client_events.type`.
6. Run the standard checks on the changed file: `git diff --stat`, secret scan,
   AI-tell scan (`rg "[—–]"`). Expected: **0 on added lines, 10 pre-existing in
   the file.** Report both numbers; do not "fix" the pre-existing ten, they are
   outside this diff.
7. Write the verdict report to `docs/qa/`.
8. If the verdict is `PASS` or `PASS WITH FINDINGS`, write the exact
   `git add` / `git commit` command yourself against the final diff.
   **`bg-backend` has deliberately not drafted one.** Packet `006` recorded that
   `bg-verify` ended up writing its own anyway; skipping the draft removes the
   temptation to copy an unchecked command forward.

## Do not

- Do not edit `onboard-client.js`, `_cost.js`, `_plans.js`, `set-client-plan.js`,
  `planConfig.ts`, or anything under `brandgeo-dashboard/src/`.
- Do not run any git command.
- Do not add a Stripe price, checkout link, or any billing wiring for Growth PRO.
  External dependency, sequenced by `bg-strategy` per `activation-path.md` §5.5.
- Do not invent a migration or a backfill for existing rows. Which clients were
  affected cannot be determined from the database. That is the CHECKPOINT below,
  and if any client was affected the remediation is a separate packet because it
  involves a refund or credit decision.
- Do not widen scope into the residual gaps in §Residual. File them; do not fix
  them here.

## Acceptance criteria

- [ ] Verdict (`PASS` / `PASS WITH FINDINGS` / `BLOCK`) is the first line of the
      report.
- [ ] The harness was rebuilt and run independently; output and exit code pasted.
- [ ] All six `008` acceptance criteria re-verified with pasted evidence.
- [ ] The omitted-plan fallback is explicitly adjudicated, accepted or rejected.
- [ ] `clients.plan` accepts `growth_pro` and `client_events.type` accepts
      `'onboarded'`, both closed by production query with output pasted.
- [ ] Dash-scan reports added-line count and pre-existing count separately.
- [ ] Report written to `docs/qa/`, filename recorded in `CLAUDE.md`.

## Residual gaps found while building (file, do not fix here)

Each was found in `scope_read` and is out of `008`'s scope. Recorded so they are
not lost and not re-derived.

- **R1. Three other provisioning paths still write no `client_events` row.**
  `grep -rn "client_events" netlify/functions/` returns writers only in
  `set-client-plan.js` and `expire-plan-grants.js` (now plus this change).
  `signup-client.js` (self-serve), `stripe-webhook.js` (paid signup) and
  `provision-account.js` all create clients with no audit row, so the exact
  detection gap `008` item 3 closes for admin onboarding stays open for every
  other path. `provision-account.js:200` already builds a `meta` object holding
  `plan: 'free'` for a different table, so the data is at hand.
- **R2. `db/supabase-admin-plan-grants-migration.sql:50`'s type enumeration is
  now stale.** It lists six values in a comment; `'onboarded'` is a seventh.
  Comment only, no constraint, so nothing breaks. `db/` is outside `008`'s
  `scope_write` so it was deliberately left alone.
- **R3. Checked and clean, recorded so nobody re-checks.** `stripe-webhook.js:138`
  and `:230` REJECT an unresolved plan rather than coercing it
  (`SELF_SERVE_PLANS = ['essentials','growth']` at `:45`), and log the skip.
  `provision-account.js:162` hardcodes `'free'` and offers no tier choice.
  Neither carries the `008` defect. `SELF_SERVE_PLANS` omitting `growth_pro` is
  correct today: that tier has no Stripe price yet, which is the separate
  backlog item.

## Open questions for Constantin

**CHECKPOINT, inherited verbatim from packet `008` and still open. This packet
cannot close it and `bg-verify` cannot close it either.**

Existing mis-provisioned clients cannot be found in Supabase. A coerced row reads
`essentials` and is byte-identical to a genuine Essentials customer, and
`onboard-client.js` wrote no audit trail before this change. The fix is forward
looking only: it stops new coercions and starts the trail, and it recovers
nothing.

Detection requires cross-referencing Stripe subscriptions against `clients.plan`:
any customer on a Growth (EUR 299) or Growth PRO (EUR 449) subscription whose row
reads `essentials` was under-provisioned and was served fewer engines than they
paid for. Constantin reported running this comparison on 2026-07-26; **the result
was never recorded**, in `008` or anywhere else, and CLAUDE.md's backlog flags
that omission as load-bearing.

Record the outcome before `008` is closed. If any client was affected, the
remediation is a separate packet: it involves a refund or credit decision, which
is not `bg-backend`'s call and not `bg-verify`'s.

## Harness

`bg-backend` ran this and got `PASS`, exit 0, 29 assertions, against the working
tree. Rebuild it yourself at a path of your choosing outside the repo (it is a
test fixture, not a deliverable, and `scope_write` is `docs/qa/`). It requires no
network, no Supabase, and no env vars.

```js
/**
 * harness-008.js — acceptance harness for packet 008 (onboard-client.js plan coercion).
 * Loads the REAL onboard-client.js with @supabase/supabase-js and ./_auth stubbed
 * in the require cache. Exits 0 on PASS, 1 on FAIL.  Run: node harness-008.js
 */
const path = require('path')

const FN_DIR = path.resolve(
  'C:/Users/const/Constantin Daniel Goane/BrandGEO/brandgeo-dashboard/netlify/functions'
)
const resolveFrom = (id) => require.resolve(id, { paths: [FN_DIR] })

let log, failInsertOn, failAuthInvite
function reset() {
  log = { inserts: [], deletes: [], authDeleted: [] }
  failInsertOn = null
  failAuthInvite = false
}

function makeThenable(value, extra = {}) {
  return { ...extra, then: (res) => res(value) }
}

function stubClient() {
  return {
    from(table) {
      return {
        insert(rows) {
          log.inserts.push({ table, rows })
          const error = failInsertOn === table ? { message: `forced ${table} failure` } : null
          if (table === 'clients') {
            const row = Array.isArray(rows) ? rows[0] : rows
            const client = { id: 42, engines_enabled: null, ...row }
            return makeThenable({ data: error ? null : client, error }, {
              select: () => ({ single: async () => ({ data: error ? null : client, error }) }),
            })
          }
          return makeThenable({ error })
        },
        delete() {
          return { eq: async (col, val) => { log.deletes.push({ table, col, val }); return { error: null } } }
        },
      }
    },
    auth: {
      admin: {
        inviteUserByEmail: async () => (failAuthInvite
          ? { data: null, error: { message: 'already registered' } }
          : { data: { user: { id: 'user-uuid-1' } }, error: null }),
        deleteUser: async (id) => { log.authDeleted.push(id); return { error: null } },
      },
    },
  }
}

require.cache[resolveFrom('@supabase/supabase-js')] = {
  id: resolveFrom('@supabase/supabase-js'), filename: resolveFrom('@supabase/supabase-js'),
  loaded: true, exports: { createClient: () => stubClient() },
}
require.cache[resolveFrom('./_auth')] = {
  id: resolveFrom('./_auth'), filename: resolveFrom('./_auth'), loaded: true,
  exports: {
    requireAuth: async () => ({ user: { id: 'admin-uuid' }, profile: { role: 'admin' }, headers: {} }),
  },
}

const { handler } = require(path.join(FN_DIR, 'onboard-client.js'))
const { PLAN_LIVE_ENGINES } = require(path.join(FN_DIR, '_cost.js'))

const post = (body) => handler({ httpMethod: 'POST', headers: {}, body: JSON.stringify(body) })
const base = { name: 'Acme', slug: 'acme', contact_email: 'a@b.com' }

let failures = 0
function check(label, cond, detail = '') {
  const ok = !!cond
  if (!ok) failures++
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${detail && !ok ? `\n        ${detail}` : ''}`)
}

;(async () => {
  console.log('=== packet 008 acceptance harness — onboard-client.js ===\n')
  console.log(`_cost.js ladder: ${Object.keys(PLAN_LIVE_ENGINES).join(', ')}\n`)

  // AC2 — every plan in the enforcing mirror provisions as itself.
  for (const p of Object.keys(PLAN_LIVE_ENGINES)) {
    reset()
    const res = await post({ ...base, plan: p })
    const written = log.inserts.find(i => i.table === 'clients')?.rows.plan
    const returned = JSON.parse(res.body).plan
    check(`AC2  plan "${p}" -> clients.plan "${written}" (200, returned "${returned}")`,
      res.statusCode === 200 && written === p && returned === p,
      `got status ${res.statusCode}, written ${written}, returned ${returned}`)
  }

  // AC3 — an unrecognised plan is a 400 and provisions nothing.
  for (const bad of ['growth-pro', 'GROWTH', 'platinum', 'essentials ', 42, {}, true]) {
    reset()
    const res = await post({ ...base, plan: bad })
    const body = res.statusCode === 400 ? JSON.parse(res.body) : {}
    check(`AC3  plan ${JSON.stringify(bad)} -> 400, no rows written`,
      res.statusCode === 400 && log.inserts.length === 0 && log.authDeleted.length === 0
        && /Must be one of:/.test(body.error || ''),
      `status ${res.statusCode}, ${log.inserts.length} insert(s), error="${body.error}"`)
  }

  reset()
  const rej = JSON.parse((await post({ ...base, plan: 'platinum' })).body)
  check('AC3b rejection names the value and the full accepted set',
    rej.error.includes('platinum') && Object.keys(PLAN_LIVE_ENGINES).every(p => rej.error.includes(p)),
    rej.error)

  // Omitted plan keeps the documented default.
  for (const body of [{ ...base }, { ...base, plan: undefined }, { ...base, plan: null }, { ...base, plan: '' }]) {
    reset()
    const res = await post(body)
    const written = log.inserts.find(i => i.table === 'clients')?.rows.plan
    check(`DEF  plan ${JSON.stringify(body.plan)} -> default "essentials" (200)`,
      res.statusCode === 200 && written === 'essentials',
      `status ${res.statusCode}, written ${written}`)
  }

  // AC4 — exactly one client_events row, naming the plan, in the audit shape.
  reset()
  const okRes = await post({ ...base, plan: 'growth_pro', prompts: ['best crm for teams'] })
  const events = log.inserts.filter(i => i.table === 'client_events')
  const ev = events[0]?.rows
  check('AC4  exactly one client_events row on success', events.length === 1, `got ${events.length}`)
  check('AC4  row names the plan and matches the audit shape',
    ev && ev.to_plan === 'growth_pro' && ev.from_plan === null && ev.client_id === 42
      && ev.actor === 'admin-uuid' && typeof ev.type === 'string' && ev.meta && typeof ev.meta === 'object',
    JSON.stringify(ev))
  check('AC4  success response reports audit_logged: true',
    JSON.parse(okRes.body).audit_logged === true, okRes.body)

  // AC5 — a forced client_events failure still yields a fully created client.
  reset()
  failInsertOn = 'client_events'
  const degraded = await post({ ...base, plan: 'growth', prompts: ['best crm for teams'] })
  const d = JSON.parse(degraded.body)
  check('AC5  audit failure still returns 200 with a usable client',
    degraded.statusCode === 200 && d.client_id === 42 && d.user_id === 'user-uuid-1'
      && d.plan === 'growth' && d.prompts_created === 1, degraded.body)
  check('AC5  audit failure rolls nothing back',
    log.deletes.length === 0 && log.authDeleted.length === 0,
    `${log.deletes.length} delete(s), ${log.authDeleted.length} auth delete(s)`)
  check('AC5  audit failure is reported as audit_logged: false', d.audit_logged === false, degraded.body)

  // Regression — the pre-existing rollback chain still fires, no orphan audit row.
  reset()
  failInsertOn = 'prompts'
  const rolled = await post({ ...base, plan: 'growth', prompts: ['x'] })
  check('REG  prompt-seed failure still rolls back client + profile + auth user',
    rolled.statusCode === 500
      && log.deletes.some(x => x.table === 'clients') && log.deletes.some(x => x.table === 'user_profiles')
      && log.authDeleted.includes('user-uuid-1'),
    `status ${rolled.statusCode}, deletes ${JSON.stringify(log.deletes)}`)
  check('REG  a rolled-back onboard writes no client_events row',
    log.inserts.filter(i => i.table === 'client_events').length === 0)

  reset()
  failAuthInvite = true
  const inviteFail = await post({ ...base, plan: 'growth' })
  check('REG  invite failure still rolls back the client row, writes no audit row',
    inviteFail.statusCode === 409 && log.deletes.some(x => x.table === 'clients')
      && log.inserts.filter(i => i.table === 'client_events').length === 0,
    `status ${inviteFail.statusCode}`)

  console.log(`\n${failures === 0 ? 'PASS' : `FAIL (${failures})`}`)
  process.exit(failures === 0 ? 0 : 1)
})()
```

What each block proves, mapped to `008`'s criteria:

| Block | `008` criterion |
|---|---|
| `AC2` (7 assertions) | `growth` and `growth_pro` provision as themselves, and so does every other tier in the enforcing mirror. Iterating `Object.keys(PLAN_LIVE_ENGINES)` rather than a literal list means the harness fails if the derivation is ever replaced by a hand-copied array that drifts. |
| `AC3` (7 assertions) | Unrecognised plan returns `400`, and `log.inserts.length === 0` proves no client row, no auth user, no profile row. Covers a near-miss (`growth-pro`), a case variant, whitespace, and three non-string types. |
| `AC3b` | The error names the rejected value and the whole accepted set, per `008` item 2. |
| `DEF` (4) | Documents the omitted-plan fallback so the judgement call is visible rather than implicit. Adjudicate it, per "Do" item 3. |
| `AC4` (3) | Exactly one `client_events` row, naming the plan, in the `set-client-plan.js:166` shape. |
| `AC5` (3) | A forced audit failure still returns 200 with a fully created, usable client, and rolls nothing back. |
| `REG` (3) | The pre-existing rollback chain is intact, and a rolled-back onboard leaves no orphan audit row. |

Not covered by the harness, and why: whether Postgres accepts `plan = 'growth_pro'`
and `type = 'onboarded'`. The stub accepts every insert by construction. That is
"Do" item 4 and must be closed by query against production.
