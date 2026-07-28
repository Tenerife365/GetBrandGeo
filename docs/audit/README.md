# Dashboard audits

Written by `dashboard-auditor` (`.claude/agents/dashboard-auditor.md`).

One file per audit, named `<target>-<YYYY-MM-DD>.md`, so runs are comparable over
time and the scores can be tracked.

## Launching an audit in a fresh chat

The agent prompt is self-contained and assumes no repo knowledge. To run it
anywhere, paste everything below the frontmatter in
`.claude/agents/dashboard-auditor.md`, then the kickoff line.

Inside this repo, name the agent directly:

```
Use dashboard-auditor. /plan

Target: the BrandGEO dashboard at brandgeo-dashboard/, running locally.
Audit all three lenses. Priority order: dead-end census first, then functional
correctness, then visual craft.
```

For TalentWeLove, copy the agent file to that repo's `.claude/agents/` and point
it at `app/` (Next.js) or `web/` (Astro marketing site, Lens 2 and 3 only).

## Known stack position, measured 2026-07-26

The direction brief names React or Next.js App Router, Tailwind, Framer Motion,
Shadcn/ui, and Wagmi/Viem. Against `brandgeo-dashboard/package.json`:

| Constraint | Status | Reality |
|---|---|---|
| Tailwind | MET | `tailwindcss` 3.4 |
| Framer Motion | MET | present as `motion` ^12.0.0, used via `src/components/MotionCard.tsx` and `src/lib/motion.ts` |
| React / Next App Router | DIFFERS | React 18 on Vite with `react-router-dom` 6. Not a defect on its own; grade the behaviour, not the framework |
| Shadcn/ui | ABSENT | no `@radix-ui`, no `cmdk`. Primitives are hand-rolled. Audit their accessibility, not the package name |
| Wagmi / Viem | N/A | no wallet or chain surface anywhere. BrandGEO bills through Stripe. Never invent one |

The auditor re-derives this in its calibration step rather than trusting this
table, so a stale row here cannot corrupt an audit.
