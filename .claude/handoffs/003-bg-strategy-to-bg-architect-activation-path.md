---
id: 003
from: bg-strategy
to: bg-architect
status: DONE
created: 2026-07-26
scope_write: docs/arch/activation-path.md
scope_read: docs/strategy/activation-thesis-app.md, brandgeo-dashboard/netlify/functions/provision-account.js, brandgeo-dashboard/netlify/functions/_plans.js, brandgeo-dashboard/src/lib/planConfig.ts, brandgeo-dashboard/src/lib/collectionContext.tsx, brandgeo-dashboard/src/pages/Dashboard.tsx, brandgeo-dashboard/src/pages/AIVisibility.tsx, db/
model: opus
---

## Note on this file

Backfilled 2026-07-26, after the stage ran. This packet was passed to
`bg-architect` inline in a session rather than written to disk first, which broke
`docs/AGENT-OS.md` §3 rule 2 (a downstream agent reads the artifact, not the
conversation that produced it). The body below is the packet as it was given,
verbatim. `status` is `DONE` rather than `READY` because the work is complete.

Packet `002` (`bg-strategy` to `bg-design`, the web hook branch) landed in commit
`cc1e19b`, so this directory is now complete from `001` to `004`.

## Decision

Activation is First Own Score: the first ai_results row for the account's
client_id with status <> 'error'. It is unmeasured today. The three weakest
states are first result, hitting a limit, and subscription.

## Do

1. Answer first: does provision-account.js seed prompts for a self-serve
   account? If not, the activation metric is unreachable without an admin, and
   that finding leads the artifact.
2. Confirm whether the clients row carries a creation timestamp, so First Own
   Score can become a rate rather than an event count.
3. Specify where a self-serve user starts their first collection, and the state
   ownership for a plan-limit surface reading getPlanLimits().
4. Adjudicate the _plans.js versus planConfig.ts divergence (no growth_pro at
   _plans.js:9; growth carries google_ai at :20).

## Do not

- Do not change pricing, plan gating, or what any tier includes.
- Do not write implementation code.

## Acceptance criteria

- [x] Item 1 is answered with the function's actual code quoted.
      `docs/arch/activation-path.md` §0 quotes `provision-account.js:148`-`:201`
      in full. Answer: it does not seed prompts.
- [x] The _plans.js divergence has a named single source of truth.
      §3.1 names `src/lib/planConfig.ts`, which all three files already declare.

## Outcome

`docs/arch/activation-path.md`. Four answers, three corrections to upstream
artifacts, five items passed on rather than decided. Committed at 552 lines in
`cc1e19b`; the `bg-verify` B1 pass then amended §2.2, §3.3 and §3.4 (see below).

The premise in Do item 1 was disproved rather than confirmed. `provision-account.js`
does not seed prompts, but activation is still reachable without an admin: a
viewer may write their own prompts (`db/supabase-prompts-own-client-writes-migration.sql`,
applied live 2026-07-13) and start their own collection (`AIVisibility.tsx:579`,
ungated by design). The defect is routing and empty states, not permissions. See
§0.1.

Corrections to `docs/strategy/activation-thesis-app.md`, which read a narrower
file allowlist:

- §2.3 here: collection is server-side with a live hourly scheduler
  (`netlify.toml:123`), inert only because `refresh_cadence` defaults to
  `'manual'`. The thesis's §4.3, sourced from `docs/STATE-OF-PRODUCT.md` §4.1,
  says there is no queue and no scheduler. That upstream doc is stale.
- §2.5 here: State 4 is partly built. `CooldownCountdown` and `AllowanceMeter`
  ship in three pages. The surviving gap is the prompt allowance, which has no
  surface and no server enforcement anywhere.

Follow-on work created:

- `docs/qa/plans-divergence-b1.md`, the `bg-verify` B1 pass on Do item 4. Four findings,
  one of which corrected §3.3 of this artifact after being run rather than read.
- `.claude/handoffs/004-bg-architect-to-bg-design-activation-path.md`, the next stage.

## Open questions for Constantin

Two decisions the artifact declined to make, both raised in §5:

1. Should a `free` client have a non-manual `refresh_cadence`? The scheduler is
   live and inert by default. Enabling it for `free` is spend against a €0.30
   monthly budget.
2. Should `PLAN_PROMPTS` be enforced server-side, or only displayed? Nothing
   enforces it today; the monthly budget cap stops users instead, as an opaque
   429.
