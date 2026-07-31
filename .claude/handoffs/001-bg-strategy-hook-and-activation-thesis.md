---
id: 001
from: bg-orchestrator
to: bg-strategy
status: READY
created: 2026-07-26
scope_write: docs/strategy/hook-thesis-web.md, docs/strategy/activation-thesis-app.md
scope_read: brandgeo/web/index.html, brandgeo/web/site.js, brandgeo/web/welcome.html, docs/PRICING-SPEC.md, docs/PRICING-STRATEGY-2026-07.md, docs/GTM-STRATEGY.md, docs/COMPETITIVE-BENCHMARK.md, docs/STATE-OF-PRODUCT.md, docs/SIGNUP-RESEARCH.md, brandgeo-dashboard/src/lib/planConfig.ts, brandgeo-dashboard/netlify/functions/_plans.js, brandgeo-dashboard/src/pages/Signup.tsx, brandgeo-dashboard/src/pages/Welcome.tsx, brandgeo-dashboard/src/pages/Onboard.tsx, brandgeo-dashboard/src/pages/Dashboard.tsx, brandgeo-dashboard/src/pages/Usage.tsx
model: opus
---

## Decision

This initiative splits into two independent waterfalls that share only this
stage. You produce two separate artifacts, one per surface, and they never
reference each other. The product is one place for AI Visibility, Brand
Sentiment, AI SEO Audit, and AI Social, replacing four separate tools. The entry
primitive is the existing `free` plan defined in `netlify/functions/_plans.js`
(single engine, `chatgpt`); there is no trial primitive in the codebase and you
do not invent one. No stage after this one may change pricing or plan gating.

## Do

1. Write `docs/strategy/hook-thesis-web.md`. It must state, and defend from
   files you read: the one sentence a first-time visitor must be able to say
   back after three seconds on `getbrandgeo.com`; which of the four pillars
   leads and why the other three are subordinate above the fold; the single
   primary CTA and its destination; the order in which proof is presented below
   the fold; and what the visitor is being asked to stop paying for.
2. In the same file, name the falsifiable test for the three-second claim,
   stated as something an independent reviewer can check against the shipped
   page without instrumentation.
3. In the same file, rule on how the pricing ladder is presented above versus
   below the fold. Read the current ladder from `brandgeo/web/index.html` and
   `docs/PRICING-SPEC.md` before ruling. Report the ladder as it actually is,
   not as any doc summarizes it.
4. Write `docs/strategy/activation-thesis-app.md`. It must name one activation
   metric for `app.getbrandgeo.com`, define its exact measurement point, and
   state the current value or state plainly that it is unmeasured.
5. In the same file, lay out the path signup, onboarding, first collection
   result, hitting a plan limit, subscription, and acting on a recommendation as
   an ordered list of states. For each state, state in one line what the user
   must understand at that moment and what evidence in the product tells them.
6. In the same file, name the three states where value is least obvious today,
   each with the specific file and behaviour you read that supports the claim.
7. Both files must be readable cold by an agent with no memory of this session.
   Every factual claim names the file it came from.

## Do not

- Do not write into `docs/design/`, `docs/copy/`, `docs/qa/`, `CLAUDE.md`, or
  any file under `brandgeo/web/` or `brandgeo-dashboard/`.
- Do not read `CLAUDE.md` as a source of product fact. It is known stale: it
  says "BG-001 through BG-005" while `brandgeo/web/` holds `bg-001.html`
  through `bg-019.html`, and it does not list the four pillars.
- Do not propose a time-boxed trial, a new plan tier, a price change, or a
  change to what any tier includes. If you conclude the funnel requires one,
  stop and set this packet's successor to `NEEDS_HUMAN` using the checkpoint
  format in `docs/AGENT-OS.md` §6.
- Do not specify layout, components, colour, type, motion, or copy. You rule on
  what must be understood and in what order. bg-design decides how it looks and
  bg-copy decides the words.
- Do not propose Netlify function, Supabase schema, or RLS changes. If the
  activation path appears to need one, name it as an observation and let
  bg-verify adjudicate at stage B1.
- Do not invent metrics, customer counts, engine coverage, or conversion
  figures. AGENT-OS §7.2 binds: untraceable numbers do not enter an artifact.
- No em dashes, no en dashes, no AI-tell vocabulary, per AGENT-OS §7.3.
- Do not run any git command.

## Acceptance criteria

- [ ] Exactly two files exist: `docs/strategy/hook-thesis-web.md` and
      `docs/strategy/activation-thesis-app.md`. No other file in the repository
      was created or modified.
- [ ] `hook-thesis-web.md` contains one primary CTA and one destination, stated
      once, with no alternative offered.
- [ ] `hook-thesis-web.md` names exactly one leading pillar of the four.
- [ ] `hook-thesis-web.md` contains a three-second test an independent reviewer
      can run against the shipped page.
- [ ] `activation-thesis-app.md` names exactly one activation metric with a
      stated measurement point.
- [ ] `activation-thesis-app.md` lists the funnel states in order and gives each
      one a single-line understanding statement.
- [ ] `activation-thesis-app.md` names three weakest states, each citing a real
      file path.
- [ ] Neither file proposes a new tier, a trial, or a price change.
- [ ] Neither file specifies layout, colour, component, or final copy.
- [ ] Every factual claim about the current product cites the file it came from.
- [ ] Zero em dashes and zero en dashes in both files, verified by direct search.

## Open questions for Constantin

None. Status is READY. If rule 3 in "Do not" is triggered, stop and escalate
rather than deciding.
