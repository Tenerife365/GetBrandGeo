---
id: 004
from: bg-architect
to: bg-design
status: READY
created: 2026-07-26
scope_write: docs/design/activation-path.md
scope_read: docs/arch/activation-path.md, docs/strategy/activation-thesis-app.md, docs/qa/plans-divergence-b1.md, brandgeo-dashboard/src/pages/Dashboard.tsx, brandgeo-dashboard/src/pages/Prompts.tsx, brandgeo-dashboard/src/pages/AIVisibility.tsx, brandgeo-dashboard/src/components/AllowanceMeter.tsx, brandgeo-dashboard/src/components/CooldownCountdown.tsx, brandgeo-dashboard/src/lib/planConfig.ts, brandgeo-dashboard/tailwind.config.js, docs/design/homepage-hook.md
model: opus
---

## Decision

A self-serve account is provisioned with zero prompts and lands on `/`, which
offers neither a way to add one nor a way to collect. Its empty states route to
`/ai-visibility`, where Run Collection then fails silently because there are no
prompts. Activation is reachable, but only by a user who guesses the order. The
collection trigger stays owned by `AIVisibility.tsx`; `/` gets a correct route,
not a second button.

## Do

Design three surfaces. Each already has an owning page, an existing component
pattern, and a state contract fixed in `docs/arch/activation-path.md` §2.4. Reuse
the existing tokens and components; introduce a new primitive only if you state
why an existing one cannot carry the job.

1. **The zero-prompt state of `/`.** `Dashboard.tsx` renders `EmptyState` five
   times, all pointing at `/ai-visibility` (`:513`, `:577`, `:591`, `:611`). For
   an account with zero prompts that destination is a dead end. Design the
   zero-prompt variant and where it sits in the page's hierarchy. The branch
   condition already exists on the page: `Dashboard.tsx:196` queries active
   prompts for the client. Decide whether this is a variant of `EmptyState`,
   which is a local function at `Dashboard.tsx:669` and not a shared component,
   or a distinct element that outranks the five.
2. **A visible outcome for a collection run that does not start.** Nine server
   outcomes currently reach the user as a spinner flash and a console line. They
   are enumerated with file and line in `docs/arch/activation-path.md` §2.2:
   seven skip reasons from `_enqueue.js` and two 429s from
   `enqueue-collection.js` (cooldown, budget). Design how each is surfaced on
   `AIVisibility.tsx`. Group them if the grouping is defensible; say which
   group each of the nine falls into, so `bg-app` has no residual judgement.
   `'no active prompts'` is the one a new account hits, and it is the single
   worst moment on the activation path: the user did the right thing and the
   product appeared to break.
3. **The prompt allowance on `/prompts`.** `PLAN_PROMPTS` (`planConfig.ts:207`)
   is the only metered dimension with no surface anywhere. `AllowanceMeter`
   already carries five others in `AIVisibility.tsx`, `SEO.tsx` and `Social.tsx`.
   Place it on `Prompts.tsx` and specify the at-cap and over-cap appearance.
   Note that nothing enforces this cap server-side today, so over-cap is a state
   a real account can be in. Design for it rather than assuming it cannot happen.

## Do not

- Do not add a collection trigger to `Dashboard.tsx`. Two call sites against a
  `runningRef`-guarded singleton (`collectionContext.tsx:71`-`:73`) would let one
  page look idle while the other collects. Route to the owning page instead.
- Do not write final copy. Placeholder strings only, marked as such. `bg-copy`
  owns wording at stage 005, including the nine outcome messages.
- Do not touch `docs/design/homepage-hook.md`. That is the web branch, mid-flight
  on its own packet.
- Do not design a plan-comparison or upgrade screen. `Account.tsx:325`-`:329`
  currently opens a `mailto:` for a client with no Stripe id, and Growth PRO
  cannot be sold or assigned at all (`docs/qa/plans-divergence-b1.md` F1). The
  in-app upgrade route is blocked on a `bg-strategy` decision and a live Stripe
  price. Out of scope here.
- Do not invent a new colour, radius, spacing step or motion curve. Tokens are in
  `brandgeo-dashboard/tailwind.config.js`.
- Do not specify anything about `refresh_cadence` or automatic collection. That
  is an open question for Constantin, recorded in packet 003.

## Acceptance criteria

- [ ] Exactly one file is created: `docs/design/activation-path.md`. No file
      outside `docs/design/` is created or modified.
- [ ] The zero-prompt state of `/` is specified, and its destination is
      `/prompts`, not `/ai-visibility`.
- [ ] All nine collection outcomes from `docs/arch/activation-path.md` §2.2 are
      accounted for by name, each mapped to a specified surface treatment. No
      outcome is left unassigned.
- [ ] A prompt allowance surface on `Prompts.tsx` is specified, including at-cap
      and over-cap appearance.
- [ ] Every colour, spacing and type value used exists in
      `brandgeo-dashboard/tailwind.config.js`. Any new value is listed
      separately with a stated reason.
- [ ] No final copy. Every user-facing string is marked as placeholder.
- [ ] No layout is specified for `Dashboard.tsx`'s score card, key metrics island
      or recommendations callout. Those states are already built and are not in
      this packet.
- [ ] Zero em dashes and zero en dashes, verified by direct search. Applies to
      prose and to any quoted source. If quoting source that contains one,
      paraphrase instead.

## Open questions for Constantin

None blocking. Two decisions sit upstream of the build but not of the design, and
are already recorded in packet 003: whether `free` accounts get a non-manual
`refresh_cadence`, and whether `PLAN_PROMPTS` is enforced or only displayed. The
design should work under either answer. If you find that it cannot, stop and
escalate rather than picking one.
