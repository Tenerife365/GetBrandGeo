# BrandGEO agent roster

Ten agents, disjoint write scopes, one waterfall. Constitution:
`docs/AGENT-OS.md`. Handoff packets: `.claude/handoffs/`.

## Quick reference

| Agent | Model | Ask it for |
|---|---|---|
| `bg-orchestrator` | Opus 5 | Break an objective into scoped stages, assign agents and models |
| `bg-strategy` | Opus 5 | Positioning, value narrative, funnel, pricing and packaging rulings |
| `bg-architect` | Opus 5 | Data contracts, boundaries, state ownership, migration plans |
| `bg-design` | Opus 5 | Layout, hierarchy, motion, tokens, the 3-second and 10-second tests |
| `bg-copy` | Sonnet 5 | Every customer-facing string, number narration, error states |
| `bg-web` | Sonnet 5 | Build `brandgeo/web/` (static marketing site) |
| `bg-app` | Sonnet 5 | Build `brandgeo-dashboard/src/` (React dashboard) |
| `bg-backend` | Sonnet 5 to Opus 5 | Netlify functions, collection pipeline, Supabase, Stripe |
| `bg-verify` | Opus 5 | Security, accessibility, regression, acceptance. Can block a release |
| `bg-grunt` | Local Qwen 2.5 Coder | Renames, import rewrites, boilerplate, zero judgement |
| `dashboard-auditor` | Opus 5 | Scored three-lens audit of any SaaS dashboard, plus a ranked fix plan. Portable across projects, writes `docs/audit/` |
| `landing-page-optimizer` | Opus 5 | Scored four-lens audit of a marketing landing page (hook and comprehension, conversion path, credibility and craft, AI answer readiness), plus a ranked fix plan. Audits only, never edits the page. Portable, writes `docs/audit/` |

The last two are portable read-only auditors, not waterfall stages. You invoke
them directly; `bg-orchestrator` does not schedule them. See `docs/AGENT-OS.md`
§1 for why they sit outside the roster's waterfall and how they avoid colliding
in `docs/audit/`.

## Every agent, every session

1. Runs its `[CALIBRATION STEP]` first and prints `CALIBRATED` or fails loudly.
2. Prints an `INTENT` line before any tool call, so you can redirect for free.
3. Writes inside its `scope_write` only.
4. Ends with `/handoff`, which writes the packet and updates `CLAUDE.md`.

## Commands you will use most

- `/plan` see the intent and file list before anything is written
- `/status` where the whole initiative stands, cheaply
- `/verify` re-run acceptance checks with pasted evidence
- `/compact` strip context to the packet before continuing
- `/clear` start the next stage cold
- `/cheap` push mechanical work to the local model
- `/escalate` bump a stuck decision to Opus 5
- `/10x` fan out parallel work, only with proven disjoint scope
- `/god` elevated project authority, never relaxes the §7 guardrails
- `/rollback` get the exact revert command

Full definitions in `docs/AGENT-OS.md` §5.

## Starting the current initiative

The objective on record: landing page that hooks in 3 seconds, and a dashboard
where value is obvious from signup through subscription through action.

Stage 0, in a fresh session:

```
Use bg-orchestrator. /plan

Objective: getbrandgeo.com must hook a first-time visitor in 3 seconds and
convert to trial or purchase, and app.getbrandgeo.com must make BrandGEO's value
obvious from account creation through subscription through acting on the data.
One product covering AI Visibility, Brand Sentiment, AI SEO Audit, AI Social.

Constraints: minimum Opus stages, disjoint scopes, cold start per stage.
```

It returns a stage table, a cost estimate, a risk register, and the packet for
stage 1. Run stage 1 in a new session. Repeat.

## Adding an agent

Copy the five-block structure from any file here: `[ROLE & CONTEXT]`,
`[OBJECTIVE & DELIVERABLES]`, `[OPERATIONAL COMMANDS]`, `[GUARDRAILS & EDGE
CASES]`, `[CALIBRATION STEP]`, `[HUMAN INTERVENTION]`. Then add its row to
`docs/AGENT-OS.md` §1 with a write scope that intersects no existing scope. If
you cannot find a disjoint scope, the agent should not exist.
