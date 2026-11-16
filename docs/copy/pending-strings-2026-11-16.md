# Pending dashboard strings: copy pass, 2026-11-16

Status: copy deck for a bg-app builder. Wording only. No file under `brandgeo-dashboard/` was edited. Every row names a file and the line of its `copy: pending bg-copy` marker (line numbers are from the tree on 2026-11-16 and drift as files change; search by the current text).

## 1. Voice check

- Who speaks: BrandGEO, plainly, as the tool that ran the checks. Admin only strings are terser, written for the founder or operator.
- To whom: a business owner who noticed ChatGPT does not name them and does not know GEO vocabulary. Invitees on the /invite page are new users, often on a phone.
- Level: say what was measured, what failed, what was never checked, and the next step. No promise of a result and no claim about why an engine chose a brand.

## 2. How to read the tables

Audience: V = viewer (customer), A = admin only, B = both. Status: KEEP = already right, CHANGE = replace with the Final column, FLAG = needs a ruling first (see section 9); Final shows the interim text to use if nobody rules. Placeholders (`${...}`, `{...}`) are unchanged in every Final unless a row says so. Where a Final is not longer than the Current, no space check is needed. Longer Finals say why they fit.

## 3. AI Visibility (`brandgeo-dashboard/src/pages/AIVisibility.tsx`)

| ID | Line | Aud | Current | Final | Status and reason |
|---|---|---|---|---|---|
| AV01 | 942 | V | `${item.title} · ${loc}` | same | KEEP. Plain title plus location. |
| AV02 | 962 | V | `2 P0, 5 P1, 5 P2` (`${n} ${p}` joined by ", ") | same until ruled; proposed `2 urgent, 5 important, 5 later` | FLAG F1. P0 to P2 are engineering terms. |
| AV03 | 1181 | V | `No prompts in ${locations} yet.` | same | KEEP. |
| AV04 | 1692 | V | `Not measured yet` | same | KEEP. Matches every other empty state. |
| AV05 | 1756 | V | sr-only `Showing` | same | KEEP. |
| AV06 | 1767 | V | sr-only `Showing` | same | KEEP. |
| AV07 | 1770 | V | `All {n} locations` | same | KEEP. |
| AV08 | 1780 | V | sr-only `Showing` | same | KEEP. |
| AV09 | 1975 | V | `No prompts yet` | same | KEEP. Same as the Prompts page. |
| AV10 | 1977 | V | `Add prompts` | same | KEEP. |
| AV11 | 2085 | V | `Engines` | `AI engines` | CHANGE. Says what an engine is. Label is a short caps heading, fits. |
| AV12 | 2089 | V | `Coming soon: {engines}` | same | KEEP. |
| AV13 | 2103 | V | `Known` | `Often named` | CHANGE. Band is 50% or more of answers (`metrics.ts:287`). "Known" implied knowledge we did not measure. 11 characters, under the longest existing badge. |
| AV14 | 2104 | V | `Partial` | `Sometimes named` | CHANGE. Band is 25% to under 50% (`metrics.ts:288`). 15 characters, equal to `Not checked yet`. |
| AV15 | 2105 | V | `Missing` | `Rarely named` | CHANGE. Band is under 25%, which includes some mentions, so "Missing" overstates. 12 characters. |
| AV16 | 2106 | V | `Not checked yet` | same | KEEP. |
| AV17 | 2119 (unmarked, named in the brief) | A | `Some checks failed to sync, so this percentage is partial. Use the refresh icon on this card to retry the engine.` | `Some checks failed, so this percentage is partial. Use "Re-run all prompts on {engine}" on this card to check the engine again.` | CHANGE, amended by F6. The control is a button that appears on hover or keyboard focus, not an always visible icon, and its accessible name is `Re-run all prompts on {engine}` (`AIVisibility.tsx`, the `aria-label` of the card's button), so the copy names it in those words, never as a "refresh button". "Sync" is not what happens. |
| AV18 | 2119 (unmarked, viewer branch) | V | `Some checks failed to sync, so this percentage is partial.` | `Some checks failed, so this percentage is partial.` | CHANGE. Same reason, shorter. |
| AV19 | 2250 | V | visible plan name only (`Growth`) under a lock icon, in the locked engine card | `Upgrade to {plan}` in the card, which has room to wrap on lg | FLAG F2. Adds the verb the brief asks for. |
| AV20 | 2802 | V | visible plan name only under a lock icon, in the matrix header column | `Upgrade` visible, plan name moved to `title` as `{engine}: available on {plan}` | FLAG F2. Column is 5.5rem wide at most, so only the short verb fits. |
| AV21 | 2238 (unmarked, found while reading) | V | aria-label with the banned verb for opening a plan (see Final) | `{engine}: available on {plan}, see plans` | CHANGE. The current verb is banned vocabulary and the card opens nothing by itself. Matches `lockedHeaderLabel`. |
| AV22 | 2280 | V | `Fix this` | same | KEEP. Imperative, plain, already tested on the page. |
| AV23 | 2288 | V | `Top fix:` | same | KEEP. |
| AV24 | 2301 | V | aria-label `Hide fixes` / `Show fixes` | same | KEEP. |
| AV25 | 2303 | V | `Hide` / `Show` | same | KEEP. The aria-label carries the object. |
| AV26 | 2328 | V | aria-label `{P} fixes` | same until F1 is ruled | FLAG F1. Follows the priority naming. |
| AV27 | 2332 | V | `{n} of {m}` | same | KEEP. |
| AV28 | 2340 | V | aria-label `Next {P} fix` | same until F1 is ruled | FLAG F1. |
| AV29 | 2343 | V | `Next` | same | KEEP. |
| AV30 | 2348 | V | `Nothing open at this priority` | `No open fixes at this priority` | CHANGE. Names the thing. One character longer. |
| AV31 | 2508 | V | ChipGroup label `Category` | same | KEEP. |
| AV32 | 2536 | V | sr-only `Search prompts` | same | KEEP. |
| AV33 | 2544 | V | placeholder `Search {n} prompts` | `Search {n} prompt` or `Search {n} prompts` by count (use `promptCount(n)`) | CHANGE. "Search 1 prompts" is wrong for a single prompt. |
| AV34 | 2584 | V | `Split by location` | same | KEEP. |
| AV35 | 2605 | V | sr-only `Results by location` | same | KEEP. |
| AV36 | 2668 | V | sr-only `{v} of {n} prompts shown` | `{v} of {promptCount(n)} shown` | CHANGE. Fixes "1 of 1 prompts". |
| AV37 | 2691 | V | `No prompts match "{q}" in the chosen categories.` | same | KEEP. |
| AV38 | 2694 | V | `Clear search` | same | KEEP. |
| AV39 | 2733 | V | `What the symbols mean` | same | KEEP. |
| AV40 | 2739 | V | `Ranked #1, named first` | `Named first (#1)` | CHANGE. The glowing cell means the engine named the brand first in its answer. The old line said it twice. Shorter. |
| AV41 | 2820 | V | `{promptCount}, no engine named your brand` | same | KEEP. |
| AV42 | 2878 | V | `Competitors and categories` | same | KEEP. |
| AV43 | 2879 | V | `{n} competitors named, weakest category {label} at {pct}%` | `{n} competitor(s) named` (singular when 1), rest unchanged | CHANGE. Fixes "1 competitors named". |

## 4. Prompts (`pages/Prompts.tsx`)

| ID | Line | Aud | Current | Final | Status and reason |
|---|---|---|---|---|---|
| PR01 | 319 | V | `Your plan allows {cap} active prompts. {verb} one to add another, or upgrade.` | `Your plan allows {cap} active prompts and you have {remaining} left. {verb} a prompt to make room, or upgrade.` | CHANGE. When adding several locations, one freed slot is not enough. Uses `remaining`, already in scope. Viewer sees verb Archive. |
| PR02 | 343 | V | `One of those locations was archived. Pick again.` | `One of those locations was archived, so nothing was added. Choose the locations again.` | CHANGE. Says the outcome (the insert is one statement, so nothing is saved) and the step. |
| PR03 | 344 | V | `That location is not on this account. Pick again.` | `One of those locations is not on this account, so nothing was added. Choose the locations again.` | CHANGE. Same reason. |
| PR04 | 373 | V | live region `Added in {k} locations` | `Prompt added in {k} locations` | CHANGE. Names what was added. |
| PR05 | 481 | V | `an archived location` | same | KEEP. |
| PR06 | 494 | V | `{n prompts} in {location}` | same | KEEP. |
| PR07 | 495 | V | `{n prompts} in {k} locations` | same | KEEP. |
| PR08 | 542 | V | cap error title (set by PR01 to PR03) | no separate text | KEEP. Carried by the rows above. |
| PR09 | 549 | B | `You have used all {cap} prompts on {planLabel}.` / `This client is at its plan limit ({used} of {cap}).` | first: `You have used all {cap} prompts on {planLabel}. Archive one or upgrade to add more.`; second: keep | CHANGE (first only). Adds the next step. The second line only shows for admins. |
| PR10 | 646 | V | `Pick at least one location to add these prompts` | same | KEEP. |
| PR11 | 696 | V | title `The category is auto-detected from your prompt text, so there is no need to pick one.` | `BrandGEO sorts each prompt into a category from its wording, so you do not need to choose one.` | CHANGE. Drops "auto-detected". About 6 characters longer, it is a tooltip. |
| PR12 | 701 | V | `Ask in` | same | KEEP. |
| PR13 | 746 | V | `No prompts yet` | same | KEEP. |
| PR14 | 788 | V | `Asked in {location}. To move it, archive it and add it again.` | same | KEEP. |
| PR15 | 830 | V | `No prompts in {locations} yet` / `Add a question to see how AI answers it from this location.` | same | KEEP. |

## 5. Recommendations (`pages/Recommendations.tsx`)

| ID | Line | Aud | Current | Final | Status and reason |
|---|---|---|---|---|---|
| RC01 | 724 | V | `{n} engine(s) unavailable` | same | KEEP. |
| RC02 | 726 | V | `{n} engine(s) below 50%` | `{n} engine(s) under 50%` | CHANGE. Says "under" to match the rule (rate under 0.5) and reads as a share. Same length. |
| RC03 | 727 | V | `All engines above 50%` | `All engines at 50% or more` | CHANGE. The test is 50% or more, "above" is wrong at exactly 50. 5 characters longer, hero badge has room on one line at 1440 and wraps on a phone. |
| RC04 | 753 | V | `{scope line} New advice always covers every location.` | same | KEEP. |
| RC05 | 778 | V | `These engines returned only API errors ({counts} failed prompt checks), so they are excluded from every score and from the AI analysis below. This is a collection failure, not a visibility failure. It does not mean these engines ignore your brand.` | `These engines returned errors instead of answers ({counts} failed prompt checks). They are left out of every score and out of the analysis below. This is a checking problem, not a sign that these engines ignore your brand. Run Collection again later to retry.` | CHANGE. Drops "API" and "collection failure", adds the step. Similar length. |
| RC06 | 800 | V | `Actions are generated after your first collection.` | `Recommended actions appear after your first collection.` | CHANGE. Matches the page name. |
| RC07 | 815 | V | `Start with: {title}.` / `No priority actions right now.` | same | KEEP. |
| RC08 | 816 | V | `Generated from {n} successful AI checks` | same with singular when n is 1 (`1 successful AI check`) | CHANGE. Plural fix only. |
| RC09 | 851 | V | `No priority actions right now. Keep running monthly collections to track trends.` | `No priority actions right now. Run a collection again later to see what changes.` | CHANGE. Paid plans refresh weekly, so "monthly" is wrong for many readers. |
| RC10 | 918 | V | `Click "Generate insights". Claude reads your actual response snippets and ranked competitors and produces specific, evidence-based advice. Every run is saved, so you keep a record of what was advised and when.` | `Select "Generate insights". Claude reads the answer snippets and competitor rankings collected for your brand and writes specific advice from them. Each run is saved, so you can see what was advised and when.` | CHANGE. Plainer, same facts (the function calls a Claude model, `generate-recommendations.js:38`). Same length. |
| RC11 | 993 | V | `"Prose only" names were never ranked by any engine. They appear because they are on your own competitor list and an engine happened to mention them. They are not counted as losses.` | `Names marked "Prose only" were never ranked in an answer. They are listed because they are on your competitor list and an engine mentioned them in passing. They are not counted as losses.` | CHANGE. Says what the tag marks. Same length. |

## 6. Competitors, Mentions, Brand Sentiment, Overview

| ID | File and line | Aud | Current | Final | Status and reason |
|---|---|---|---|---|---|
| CP01 | Competitors 282 | V | `All locations` | same | KEEP. Used for the CSV scope. |
| CP02 | Competitors 347 | V | `No responses measured yet.` | same | KEEP. |
| CP03 | Competitors 348 | V | `Top competitors mentioned across {n AI responses} for {brand}.` + scope line | same | KEEP. |
| CP04 | Competitors 378 | V | `Competitors appear when AI answers name other companies for your prompts.` | same | KEEP. |
| CP05 | Competitors 393 | V | `AI engines named {brand} {times}; the most named competitor, {name}, {times}.` and the tied variant | same | KEEP. |
| CP06 | Competitors 394 | V | `AI engines named {brand} {times}.` | same | KEEP. |
| CP07 | Competitors 395 | V | `across {n} engine(s)` | same | KEEP. |
| CP08 | Competitors 529 | V | `Not enough data yet` / `Engine results appear after a collection runs.` | same | KEEP. |
| CP09 | Competitors 574 | V | `Not enough data yet` / `Trend fills in as collections accumulate` | body: `The trend needs results from at least two periods. It fills in as you run more collections.` | CHANGE. Says what is needed. The empty state has 240px of height, two lines fit. |
| MN01 | Mentions 208 | V | `No AI answer has named your brand yet.` | same | KEEP. |
| MN02 | Mentions 222 | V | `AI engines named {brand} {n} time(s), at an average position of {p}.` | same | KEEP. |
| MN03 | Mentions 224 | V | `{n} of them positive. Latest answer per prompt and engine.` | same | KEEP. |
| MN04 | Mentions 298 | V | `Asked from {location}` / `Location not recorded` | same | KEEP. Raised as F5 for a ruling on a reason line. |
| SE01 | Sentiment 231 | V | `Sentiment appears once an AI answer mentions your brand.` | same | KEEP. |
| SE02 | Sentiment 256 | V | `{pct}% of the {n} AI answers that mention your brand are positive.` (singular handled) | same | KEEP. |
| SE03 | Sentiment 258 | V | `Score from the latest answer per prompt and engine, across all time: {n} AI answers that mention your brand.` | same | KEEP. |
| SE04 | Sentiment 363 | V | `Answers that mention your brand {window}.` | same | KEEP. |
| SE05 | Sentiment 404 | V | `No signals {window}. The score above covers all time.` | same | KEEP. |
| SE06 | Sentiment 451 | V | `Asked from {location}` | same | KEEP. |
| DB01 | Dashboard 257 | V | `Your brand has not been checked yet.` / `Your brand is named in {pct}% of the AI answers checked.` | same | KEEP. |
| DB02 | Dashboard 261 | V | `Score from the latest answer for {n} prompt and engine result(s), all time.` | `Based on the latest answer to each prompt on each engine: {n} checked, all time.` | CHANGE. Plainer, no plural switch needed. Same length. |
| UI01 | ScoreDial 49 | V | `Not measured yet` | same | KEEP. |
| UI02 | GlowScoreDial 65 | V | `Not measured yet` | same | KEEP. |
| UI03 | TrendDelta 32 | V | `First measurement` | same | KEEP. |
| UI04 | SplitBar 19 | V | `Positive` / `Neutral` / `Negative` | same | KEEP. |

## 7. Shell and account (`components/Layout.tsx`, `pages/Account.tsx`)

| ID | File and line | Aud | Current | Final | Status and reason |
|---|---|---|---|---|---|
| LY01 | Layout 635 | V | mobile short names `Visibility`, `Sentiment`, `Mentions` | same | KEEP. |
| LY02 | Layout 701 | A | sidebar entry `Platform activity` | same | KEEP. |
| LY03 | Layout 926 | V | `Collecting` | same | KEEP. |
| LY04 | Layout 961 | V | `Stopped` / `Done` | same | KEEP. One word each in a narrow banner. |
| LY05 | Layout 1354 | B | `Trends and activity`, `Trends and signals`, `Trend`, `Period` (admin Revenue) | same | KEEP. |
| LY06 | Layout 1419 | V | `More` | same | KEEP. |
| AC01 | Account 133 | V | live region `{label} added` | same | KEEP. |
| AC02 | Account 147 | V | `1 location added` / `{n} locations added` | same | KEEP. |
| AC03 | Account 164 | V | `{label} archived` | same | KEEP. |
| AC04 | Account 183 | A | `{label} is now the primary location` (Make primary is admin only) | same | KEEP. |

## 8. Invites, Onboard, Platform activity (admin and new users)

### Pending invites panel (`components/PendingInvitesPanel.tsx`, admin only) and `lib/inviteLink.ts`

| ID | Line | Aud | Current | Final | Status and reason |
|---|---|---|---|---|---|
| PI01 | 125 | A | `Unnamed client` | same | KEEP. |
| PI02 | 126 | A | `Copy link` | same | KEEP. |
| PI03 | 127 | A | `This creates a new link. The link in the last invite email stops working. Continue?` | same | KEEP. States the consequence and asks. |
| PI04 | 128 | A | `Invite sent. The link works for 7 days.` | same | KEEP. |
| PI05 | 129 | A | `Invite sent. The link works for 24 hours.` | same | KEEP. |
| PI06 | 130 | A | `The previous email link may still work for up to 24 hours.` | same | KEEP. |
| PI07 | 131 | A | `Could not send the invite. Please try again.` | same | KEEP. |
| PI08 | 132 | A | `Could not create the link. Please try again.` | same | KEEP. |
| PI09 | 133 | A | `The link could not be shown. Use Resend invite to email it instead.` | same | KEEP. |
| PI10 | 134 | A | `Could not reach the server. Please try again.` | same | KEEP. |
| PI11 | 188 | A | `Link valid, {left}` / `Link valid` | same | KEEP. |
| PI12 | 199 | A | `Continue pressed {age}` | `Pressed Continue {age}` | CHANGE. Natural order, same length. |
| PI13 | 268 | A | aria-label `Invite link for {name}` | same | KEEP. |
| PI14 | 276 | A | aria-label `Copy invite link for {name}` | same | KEEP. |
| PI15 | 279 | A | `Copy` / `Copied` | same | KEEP. |
| PI16 | 281 | A | aria-label `Close link for {name}` | same | KEEP. |
| PI17 | 283 | A | `Close` | same | KEEP. |
| PI18 | 290 | A | `Anyone with this link can set up this login until {until}. Send it only to this person.` and the no-date variant | same | KEEP. |
| PI19 | 293 | A | sr-only `Link copied` / `Could not copy. The link is selected.` | same | KEEP. |
| PI20 | 295 | A | `Could not copy. The link is selected, press Ctrl+C or Cmd+C.` | same | KEEP. |
| PI21 | 378 | A | `Link created` / `Sent` / `Resend invite` | same | KEEP. |
| PI22 | 388 | A | aria-label `Copy link for {name}` | same | KEEP. |
| PI23 | 399 | A | aria-label `Confirm a new link for {name}` | same | KEEP. |
| PI24 | 410 | A | aria-label `Continue and create a link for {name}` | same | KEEP. |
| PI25 | 413 | A | `Continue` | same | KEEP. |
| PI26 | 415 | A | aria-label `Cancel creating a link for {name}` | same | KEEP. |
| PI27 | 417 | A | `Cancel` | same | KEEP. |
| IL01 | inviteLink.ts 45 | A | `just now` | same | KEEP. |
| IL02 | inviteLink.ts 64 | A | `less than an hour left` | same | KEEP. |

### Invite page (`pages/Invite.tsx`, invitee, new user)

| ID | Line | Aud | Current | Final | Status and reason |
|---|---|---|---|---|---|
| IN01 | 37 | V | invalid: `We could not open this invite` / `The link may be incomplete or no longer active. Ask the person who invited you to send a new one, or sign in if you already have a password.` | same | KEEP. Names the cause and two next steps. |
| IN02 | 41 | V | expired: `This invite has expired` / `Invite links work for 7 days. Ask the person who invited you to send a new one.` | same | KEEP. 7 days is the design (invite-link spec). |
| IN03 | 45 | V | replaced: `A newer invite was sent` / `Please use the link in the most recent invite email.` | same | KEEP. |
| IN04 | 49 | V | used: `This invite was already used` / `Sign in with your email and password. If you never chose a password, use Forgot your password.` | same | KEEP. Matches the link text. |
| IN05 | 55 | V | error heading `We could not open this invite` / body `Something went wrong. Please try again.` | body: `This invite did not open. Try again. If it still fails, ask the person who invited you to send a new one.` | CHANGE. "Something went wrong" without a real next step is rejected. Not user caused, said so. |
| IN06 | 60 | V | `Too many attempts. Please wait a few minutes and try again.` | same | KEEP. |
| IN07 | 61 | V | `Something went wrong. Please try again.` | `This did not work. Try again. If it still fails, ask the person who invited you to send a new invite.` | CHANGE. Same reason. Shows on the Continue screen. |
| IN08 | 95 | V | document title `Set up your login · BrandGEO` | same | KEEP. |
| IN09 | 215 | V | `Sign in` | same | KEEP. |
| IN10 | 217 | V | `Forgot your password?` | same | KEEP. |
| IN11 | 227 | V | `Set up your BrandGEO login` | same | KEEP. |
| IN12 | 229 | V | `Continue to choose your password.` | same | KEEP. |
| IN13 | 236 | V | sr-only `Opening...` | same | KEEP. |
| IN14 | 240 | V | `Opening...` / `Continue` | same | KEEP. |
| IN15 | 252 | V | `Sign in` | same | KEEP. |

### Onboard wizard (`pages/Onboard.tsx`, admin only)

One marker covers the whole `COPY` block, so each entry is a row.

| ID | Line | Aud | Current | Final | Status and reason |
|---|---|---|---|---|---|
| OB01 | 34 | A | `Primary location` | same | KEEP. |
| OB02 | 35 | A | `Country` | same | KEEP. |
| OB03 | 36 | A | `Region` | same | KEEP. |
| OB04 | 37 | A | `New prompts are asked from here unless you choose other locations.` | same | KEEP. |
| OB05 | 38 | A | `Other locations (optional)` | same | KEEP. |
| OB06 | 39 | A | `Add another location` | same | KEEP. |
| OB07 | 40 | A | `Add a country` | same | KEEP. |
| OB08 | 41 | A | `Primary` | same | KEEP. |
| OB09 | 42 | A | `Added` | same | KEEP. |
| OB10 | 43 | A | `Only the primary location. Add more if this client sells in several places.` | same | KEEP. |
| OB11 | 44 | A | `Ask new prompts in` | same | KEEP. |
| OB12 | 45 | A | `Ask in` | same | KEEP. |
| OB13 | 46 | A | `Ask this prompt in` | same | KEEP. |
| OB14 | 47 | A | `Pick at least one location` | same | KEEP. |
| OB15 | 48 | A | `Each location of a question uses one prompt.` | same | KEEP. |
| OB16 | 49 | A | `Go over the plan limit for this client (admin, recorded)` | same | KEEP. |
| OB17 | 50 | A | `What will be created` | same | KEEP. |
| OB18 | 51 | A | `One of the locations is not valid. Check step 1.` | same | KEEP. |
| OB19 | 52 | A | `Too many prompts for this plan. Remove some or tick the override.` | same | KEEP. |
| OB20 | 732 | A | `We will email this address an invite link, valid for {7 days or 24 hours}, to set their own password and log in.` | same | KEEP. |

### Platform activity (`pages/PlatformActivity.tsx`, `lib/platformActivity.ts`, admin only)

| ID | Line | Aud | Current | Final | Status and reason |
|---|---|---|---|---|---|
| PA01 | 32 | A | `Live` | same | KEEP. |
| PA02 | 33 | A | `Paused` | same | KEEP. |
| PA03 | 34 | A | `Retrying` | same | KEEP. |
| PA04 | 35 | A | `Stopped` | same | KEEP. |
| PA05 | 297 | A | short `Sign ins, 24 h` / full `Signed in, last 24 h` | same | KEEP. |
| PA06 | 304 | A | short `Runs (UTC)` / full `AI runs today (UTC)` | same | KEEP. |
| PA07 | 313 | A | short `Success, 24 h` / full `Engine success, 24 h` | same | KEEP. |
| PA08 | 329 | A | short `Budget 80%+` / full `Clients over 80% of budget` | same | KEEP. |
| PA09 | 191 | A | live region `{n} new event(s)` | same | KEEP. |
| PA10 | platformActivity.ts 468 | A | `Viewer signed in` | same | KEEP. |

## 9. Flags for a product ruling

- F1. Fix priority labels P0, P1, P2 (AV02, AV26, AV28, and the badge and the "Next P1 fix" aria text). Owners do not read engineering priorities. Proposed words: P0 "Urgent", P1 "Important", P2 "Later". Question: rename across the hub, or keep P0 to P2 as a shared vocabulary with the admin and the fix prompt text? The summary line is the first place a viewer meets them.
- F2. Locked engine verb (AV19, AV20). Question: show "Upgrade to {plan}" in the engine strip and the bare verb "Upgrade" in the prompt matrix header (plan name moves to the title), or keep the plan name as the only visible text? Matrix header columns are at most 5.5rem, so the full phrase does not fit there. bg-design owns the width.
- F3. Engine badge words (AV13 to AV15) are longer than "Known", "Partial", "Missing". The longest, "Sometimes named" (15 characters), equals the existing "Not checked yet". Question for bg-design: do the glass cards truncate or wrap a 15 character badge on a phone?
- F4. Recommendations RC05 tells a viewer to "Run Collection again later". A viewer in cooldown cannot press it. Question: is "later" enough, or should the line show the next available date as the engine card does?
- F5. "Location not recorded" (MN04). Old answers carry no location stamp. Question: add the reason ("Asked before locations were tracked") or keep the short line?
- F6. Admin engine refresh button (AV17): the control shows on hover or keyboard focus only. Question: is its accessible name "Refresh {engine}"? The copy above says "refresh button", which is only true if so.

## 10. Number narration, error and empty states

Not a new surface here. The metric sentences touched (DB02, RC02, RC03, RC08) keep the existing three part pattern: what it is, what good looks like, next step. Error states changed: PR01 to PR03, IN05, IN07, RC05; each names what happened, says it was not the user's doing where that is true, and gives one exact next step. Empty states changed: AV30, CP09, RC06, RC09; none apologises.

## 11. Compliance pass

- Zero em dashes and zero en dashes in this file: checked with `rg` (output pasted below by the author at /verify time).
- Zero banned vocabulary in the Final column. One banned word was found in live code, not in a marker: the verb in the aria-label at `AIVisibility.tsx:2238` (row AV21, fixed above).
- No factual claim added beyond the code: thresholds quoted from `metrics.ts:287-289`; the 7 day and 24 hour invite lifetimes from the existing strings; "Claude" for recommendations from `generate-recommendations.js:38`. No figure invented. No engine, plan limit or feature is named except through placeholders.
- No scaled or duplicated content. No schema.org changes. No real client, person, company or address is named.

## 12. Handoff to bg-app

Apply every CHANGE row verbatim. Apply FLAG rows with the interim text in Final only after the ruling in section 9; until then leave the current string. Remove the `copy: pending bg-copy` marker from each string applied or kept. Do not touch strings outside these rows.

## 13. Rulings and application (2026-11-16)

Constantin ruled the six flags with "Use the defaults". Applied by bg-app the same day. Every lower case `copy: pending bg-copy` marker in `brandgeo-dashboard/src/` is gone (147 removed, 0 left). Six markers written with a capital (`Copy:` or `COPY:`) were never rows of this deck and were left in place for a later pass: `components/Layout.tsx:131` (sidebar Locations block), `lib/locations.ts:93` (location errors) and `:188` (`locationScopeLine`, used inside CP03 and RC04), `components/McpAccessSection.tsx:57` and `:680`, `lib/planConfig.ts:476`.

- F1: P0, P1 and P2 read Urgent, Important and Later wherever a viewer meets them in the Fix this hub: the closed summary (`2 urgent, 5 important, 5 later`), the column badges, the column `aria-label` (`Urgent fixes`) and the Next button `aria-label` (`Next urgent fix`). The hub explainer sentence in `lib/aiVisibilityCopy.ts` (`FIX_COPY.explainer`, not a deck row) said "P0 items move your score the most"; it now says "Urgent items", so the hub uses one vocabulary. The P0 to P2 keys stay in the data model and in the fix prompt text.
- F2: the engine strip card shows `Upgrade to {plan}`; the prompt matrix header shows `Upgrade`, with `title` `{engine}: available on {plan}`.
- F3: `Often named`, `Sometimes named`, `Rarely named` applied. Measurement in section 14.
- F4 (RC05) and F5 (MN04): Final text as written (MN04 stays `Location not recorded`).
- F6: answered from the code, see AV17.
- AV21: applied.

Layout, to fit the longer words (measured in section 14): the engine status card is never narrower than 164px (172px from 640px up, was 140px from 1024px up), and its percentage and badge may wrap onto two lines; the locked card's `Upgrade to {plan}` wraps instead of truncating.

Open, for bg-copy, rated MAJOR by the bg-verify accessibility lens and to be ruled before the push: WCAG 2.5.3 (label in name, level A). The visible word `Upgrade` on the two locked controls is not inside their accessible names (`{engine}: available on {plan}, see plans` on the card, `lockedHeaderLabel` on the header). Speech input users saying "click Upgrade" will not reach them. The names were left as the deck wrote them; a wording that starts with the visible text (for example `Upgrade to {plan} for {engine}` on both controls) needs a copy ruling. The same ruling should give both controls one form: today the card reads `{engine}: available on {plan}, see plans` and the header `{engine}, available on {plan}. See plans`, so AV21's "Matches `lockedHeaderLabel`" holds only in meaning, not in punctuation.

Open, for bg-design: the 172px card minimum at 1024px and up means a plan with seven engines (Growth PRO, Managed) needs 1,276px of rail at 1440, against about 1,136px of content, so the rail scrolls sideways where it used to fit (7 cards at 140px took 1,052px). Arithmetic from the class values, not rendered: demo mode has one active engine. A 140px card cannot hold the 136px badge with its padding. The choices are a scrolling rail (as shipped), a badge whose text wraps inside it, or a shorter band word.

## 14. Measurements (headless Chrome over CDP, demo mode, 2026-11-16)

- F3, the "Sometimes named" badge (136px): with the shipped classes, at 1440 it sits beside the percentage on one line; at 1280 it stays on one line with the real 48% and drops under the percentage only when forced to "100%"; at 1024 and 390 it sits under the percentage. In every case it stays inside the card (0px past the inner edge), at 1440, 1280, 1024, 390, 375, 360 and 320, dark and light, also with every status card forced to "100%" and "Sometimes named". Before the layout change it spilled 55px past the card at 390 and 80px at 1024.
- F2: the matrix header column is 88px and `Upgrade` takes 64px on one line, not clipped. The strip card's `Upgrade to {plan}` wraps to 2 lines (3 at 1024 for "Essentials" and "Growth PRO"); no card grows taller than the status card beside it.
- "Your prompts" starts at 757px at 1440 (unchanged), 867px at 1024 and 1,259px at 390 (was 1,241: the badge on its own line adds 18px). With Fix this open: 1,200px and 2,326px. No sideways scroll of the window or of `<main>` at 1440, 1024 or 390, dark and light. Text contrast: no box below AA.
