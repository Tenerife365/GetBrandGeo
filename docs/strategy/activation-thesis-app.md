# activation-thesis-app.md

Owner: `bg-strategy` · Packet: `.claude/handoffs/001-bg-strategy-hook-and-activation-thesis.md`
Date: 2026-07-26 · Surface: `app.getbrandgeo.com` (the dashboard only)

This file names one activation metric for the dashboard, defines where it is
measured, and lays out the path from account creation to acting on a
recommendation as an ordered list of states. It does not specify layout,
components, colour, type, motion, or final wording.

Every factual claim names the file it came from. Where a file that would settle a
question sits outside this packet's read allowlist, that is said plainly rather
than guessed at.

---

## 1. The activation metric

**First Own Score. A self-serve account is activated the moment its own client
has at least one AI Visibility result that is not an error.**

One metric. Not two, not a composite.

### 1.1 Exact measurement point

The measurable event is the first row in `ai_results` for that account's
`client_id` whose `status` is not `'error'`. Its timestamp is that row's
`checked_at`.

That row, and not any other event, is the measurement point because it is
exactly the condition the dashboard itself uses to decide whether the user sees
anything. `brandgeo-dashboard/src/pages/Dashboard.tsx:185` to `:192` filters the
page's main query with `.eq('client_id', activeClientId)` and
`.neq('status', 'error')`, and the second query at `:201` to `:205` does the
same for the score. The score card renders only when `scoreData` is non-null
(`:369`), and `scoreData` is set only when both that query and the active-prompts
query return (`:214` to `:217`). So before the first non-error row exists, the
page has no score, no key metrics, and only empty states. After it exists, the
page has a number. That transition is activation, and it is observable in the
database without any new client-side instrumentation.

Error rows are excluded deliberately and for the same reason the product
excludes them: `Dashboard.tsx:182` to `:184` records that counting API failure
rows as genuine "not mentioned" results "tanked every KPI/chart on this page". A
run that produced only error rows did not activate anyone.

### 1.2 Current value

**Unmeasured.**

Nothing in this packet's read allowlist computes it, stores it, or displays it.
`brandgeo-dashboard/src/pages/Usage.tsx` is the only page that aggregates
`ai_results`, it returns `null` for anyone who is not an admin (`:112`), and what
it aggregates is metered API spend per client (`:73`, `:96` to `:104`), not
time-to-first-result. `Dashboard.tsx` fires no analytics call anywhere in its 728
lines.

One limitation, stated rather than papered over: expressing First Own Score as a
rate ("share of accounts reaching it within N hours of provisioning") needs an
account-creation timestamp to measure against. Whether the `clients` row carries
one is not verifiable from the files in this packet's read allowlist, which
contains no schema and no migration. Until that is confirmed, the metric is
defined as the event, and the event alone is sufficient to answer the question
that matters now: how many self-serve accounts have ever reached a score at all.
Confirming the timestamp and turning the event into a rate is a `bg-architect`
question at the next stage.

### 1.3 Why this event and not a later one

The obvious alternative is "acted on a recommendation", which is a stronger
signal of understood value. It is rejected as the activation metric because it
is unreachable without the first score: `Dashboard.tsx:236` to `:246` shows the
recommendations callout querying `recommendation_runs` for the client and
rendering nothing when no run exists, and a run cannot exist before results do.
An activation metric that no account can reach for structural reasons measures
the structure, not the user. Acting on a recommendation is the right retention
metric and belongs to a later stage.

---

## 2. The funnel, as an ordered list of states

Six states, in order. For each: what the user must understand at that moment,
and what evidence in the product tells them.

### State 1. Signup

`brandgeo-dashboard/src/pages/Signup.tsx`, route `/signup`
(`brandgeo-dashboard/src/App.tsx:98`).

**Must understand:** this creates a free account that will watch a brand of their
choosing in AI answers, and it costs nothing and needs no card.

**Evidence today:** the heading "Start for free" and the line "Track a company or
your personal brand in AI answers. No credit card required." (`Signup.tsx:94` to
`:95`). Three entry paths, social buttons first (`:97`) then email (`:105` to
`:143`), which is the shape `docs/SIGNUP-RESEARCH.md` §1 recommends. On the email
path there is no password field by design (`Signup.tsx:129` to `:130`); the user
receives an invite link, so the confirmation screen (`:57` to `:86`) tells them
the account is not usable until they open their inbox.

### State 2. Onboarding

`brandgeo-dashboard/src/pages/Welcome.tsx`, route `/welcome`, reached because
`App.tsx:56` to `:70` routes any authenticated user with no client to it.

**Must understand:** naming one thing to watch is the entire setup, and the
choice is not permanent.

**Evidence today:** the question "What do you want to track in AI answers?" with
the reassurance "You can change it later." (`Welcome.tsx:117` to `:118`), two
cards for company and personal brand (`:121` to `:122`), and a prefill that
defaults to the company branch and fills the website when the user's email is at
a non-personal domain (`:42` to `:53`, list at `:24` to `:28`). On submit it
posts to `provision-account` and hard-reloads onto `/` (`:74` to `:88`).

### State 3. First collection result

`brandgeo-dashboard/src/pages/Dashboard.tsx`, route `/` (`App.tsx:106`).

**Must understand:** the number on screen is their own brand's standing in the
engines their plan covers, it came from real queries, and it is theirs to
improve.

**Evidence today:** the score ring and six dimension values with a link to the
full breakdown (`Dashboard.tsx:369` to `:422`), a four-stat key metrics island
with sparklines (`:462` to `:490`), a personalised greeting carrying the brand
name (`:361`), and empty states that name a next action and link to it rather
than showing a blank chart (`:669` to `:679`, used at `:513`, `:577`, `:591`,
`:611`). What is absent is covered in §3.

### State 4. Hitting a plan limit

No single page owns this state.

**Must understand:** the wall is the plan and not a fault, the wall has a name
and a number, and there is a defined way past it.

**Evidence today:** the limits are declared, and almost none of them are shown to
the user. `planConfig.ts` holds every metered dimension: prompts (`:207`),
collection cooldown in hours (`:215`), monthly API budget (`:149` to `:157`), AI
SEO page and draft caps (`:221` to `:236`), AI Social channel and post caps
(`:239` to `:248`), plus `getPlanLimits()` (`:285` to `:297`) which exists
specifically "for UI display + gating". The comment at `:213` to `:214` describes
a Run Collection button that "shows a live countdown" until the cooldown elapses.
`Dashboard.tsx` renders no plan name, no allowance, no countdown and no upgrade
affordance anywhere in its 728 lines, and `Usage.tsx:112` returns `null` for
non-admins. `docs/PRICING-STRATEGY-2026-07.md` §6 (`:121`) states the intent
plainly, "every metered surface shows X of Y used so limits never surprise", and
its §12 lists task T2a, "cooldown countdown, allowance meters, FeatureLocked
add-on channels" (`:202`), as still to be built. By that document's own task
list, this state is unbuilt.

### State 5. Subscription

Split across two surfaces.

**Must understand:** exactly which locked capability the money opens, at what
price, and that nothing they have already set up is lost.

**Evidence today:** on the marketing site, the pricing grid at
`brandgeo/web/index.html:1643` to `:1782`, with real Stripe links defined for
`essentials` and `growth` only (`brandgeo/web/site.js:504` to `:514`); the
`growth_pro` entry is commented out at `:513`, so per `applyCheckoutLinks`
(`:516` to `:525`) the €449 button at `index.html:1722` falls back to `/signup`
rather than to checkout. After payment, `brandgeo/web/welcome.html:92` asks the
buyer to "Create your dashboard account using the same email you just paid with,
so we can match your subscription automatically", and its primary button
(`:104`) sends them to `app.getbrandgeo.com/signup`. Inside the app, the pieces
of an upgrade surface exist without a place that uses them: `FEATURE_META`
carries a label and blurb "for the locked/upgrade screen" (`planConfig.ts:186` to
`:196`) and `featureUnlockPlan()` returns the minimum plan for the upgrade prompt
(`:310` to `:313`).

### State 6. Acting on a recommendation

`Dashboard.tsx` callout plus the `/recommendations` route (`App.tsx:112`).

**Must understand:** which single action to do first, and why doing it moves the
number they saw in state 3.

**Evidence today:** the "What to do next" callout at `Dashboard.tsx:430` to
`:457`, showing the top two recommendations with a priority dot and a link to the
full list. It reads the persisted `recommendation_runs` and `recommendations`
tables rather than generating its own advice (`:224` to `:260`), so the top of
the dashboard and the recommendations page cannot disagree. It renders only when
a run exists and returns at least one row (`:243` to `:246`, gate at `:430`).

---

## 3. The three states where value is least obvious today

Ranked. Each names the file and the behaviour that supports the claim.

### 3.1 Weakest: State 3, first collection result

The self-serve path arrives at a dashboard it cannot fill, and nothing on that
dashboard starts a collection.

- `Welcome.tsx:88` redirects to `/` immediately after provisioning. `/` is
  `Dashboard.tsx` (`App.tsx:106`).
- The only button in the `Dashboard.tsx` header calls `load()` (`:364` to `:366`,
  defined `:157` to `:220`). `load()` issues three Supabase reads. It does not
  call any collection function. A user who presses it on an empty dashboard
  re-fetches nothing, twice.
- The collection trigger lives elsewhere. `Dashboard.tsx:184` names
  `AIVisibility.tsx` as the page that already excluded error rows, and
  `Onboard.tsx:161` is the one call to `runCollection` in the files read. The
  empty states on `/` therefore link the user to `/ai-visibility`
  (`Dashboard.tsx:591`, `:611`, `:513`, `:577`) rather than offering a start
  control where they are standing.
- Worse, the thing collection runs on is never asked for on the self-serve path.
  `Onboard.tsx` is the six-step wizard that gathers brand aliases, competitors
  and initial prompts and then fires the first collection (`:171` to `:178`,
  `:334` to `:367`, `:127` to `:167`), and it is admin-only:
  `Onboard.tsx:88` to `:93` returns "Access restricted to admins." for everyone
  else. The self-serve equivalent, `Welcome.tsx`, sends a body containing only
  `account_type`, `brand_name` and `brand_website` (`:77` to `:81`). Its step 4
  equivalent does not exist. `Onboard.tsx:337` to `:341` states why that matters:
  at least one prompt is required "since without it there's nothing for the
  collection step to run".

Stated precisely: within the files this packet allows me to read, nothing in the
self-serve path collects prompts, and nothing on `/` starts a run. Whether
`provision-account.js` seeds default prompts server-side is unverified, because
that file is outside this packet's read allowlist. If it does not, then the
activation metric in §1 is unreachable by any self-serve account without admin
intervention, and that is the single most important thing for the next stage to
check first.

### 3.2 State 4, hitting a plan limit

The product knows every limit and tells the user none of them.

- `planConfig.ts:198` to `:248` declares six metered dimensions per plan, and
  `getPlanLimits()` (`:285` to `:297`) is documented as existing "for UI display
  + gating".
- `PLAN_MONTHLY_API_BUDGET_EUR` carries a comment stating it is "display-only
  today (no UI reads it yet)" (`:139` to `:141`).
- `Dashboard.tsx` renders no plan name, allowance, countdown or upgrade path.
  `Usage.tsx:112` hides the only spend surface from non-admins.
- `docs/PRICING-STRATEGY-2026-07.md` §6 (`:121`) requires "X of Y used" on every
  metered surface, and its §12 T2a (`:202`) lists that work as not yet done.

The consequence for activation is specific: a limit the user cannot see cannot
teach them what the next tier is for. State 4 is supposed to be the moment the
value of paying becomes concrete, and today it arrives as an unexplained stop.

### 3.3 State 5, subscription

The paid path runs outside the app and rejoins it by matching an email string by
hand.

- `brandgeo/web/welcome.html:92` instructs the buyer to create the dashboard
  account "using the same email you just paid with, so we can match your
  subscription automatically". Payment happens before the account exists, and the
  join key is whatever address the buyer typed at Stripe.
- `site.js:513` leaves `growth_pro` without a Stripe link, so the €449 card at
  `index.html:1722` sends a buyer who chose the power tier to `/signup` instead
  of to checkout.
- Inside the app, no page in this packet's read allowlist links to checkout or to
  a plan comparison. `FEATURE_META` and `featureUnlockPlan()`
  (`planConfig.ts:186` to `:196`, `:310` to `:313`) supply the copy and the
  target tier for an upgrade screen, which implies one is expected to exist.

A free user who has just seen their score and hit a wall has, in the files read,
no in-product route to paying.

---

## 4. Observations passed to other agents, not decided here

These are named because the activation path appears to depend on them. None is a
proposal, and none is acted on at this stage.

1. **`_plans.js` is out of sync with `planConfig.ts`.**
   `brandgeo-dashboard/netlify/functions/_plans.js:9` has no `growth_pro` in
   `PLAN_ORDER`, and `:20` grants `growth` the `google_ai` engine that
   `planConfig.ts:49` withholds. The two files each declare themselves the mirror
   of the other (`_plans.js:1` to `:7`, `planConfig.ts:200` to `:202`). Anything
   that reads plan facts server-side, including the notification blurbs at
   `_plans.js:38` to `:45`, currently describes a different ladder than the
   dashboard does. For `bg-verify` at B1.
2. **Whether `provision-account.js` seeds prompts** decides whether §3.1 is a
   gap or a rough edge. Outside this packet's read allowlist. For `bg-architect`
   at the next stage, before any build.
3. **There is no scheduler.** `docs/STATE-OF-PRODUCT.md` §4.1 records that
   collection runs sequentially in the user's browser tab with no queue and no
   scheduler, so every refresh cadence the product sells is a person clicking a
   button. This bounds how automatic any of states 3 through 6 can feel, and it
   is an architecture matter, not a strategy one.

---

## 5. What this thesis does not decide

No new tier, no trial, no price change, and no change to what any tier includes.
The entry primitive stays the existing `free` plan as defined in
`brandgeo-dashboard/netlify/functions/_plans.js` and `planConfig.ts:47`: one
engine, `chatgpt`; five prompts (`planConfig.ts:207`); a 720 hour collection
cooldown (`:215`).

No layout, component, colour, type, motion or copy. States 1 through 6 fix what
the user must understand and in what order. `bg-design` decides how each state
looks and `bg-copy` decides what each one says.
