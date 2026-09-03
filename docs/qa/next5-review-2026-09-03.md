# Review of the next-five batch, 2026-09-03

Adversarial three-lens review of the five improvements built from `docs/audit/product-reaudit-2026-09-03.md`, run as workflow `wf_269a6214-ba0` (three `bg-verify` agents, two at a time, read-only, base commit `3d98bdc`). The builders had self-reported every criterion met. All three lenses returned FAIL.

| Lens | Verdict |
|---|---|
| correctness and regression | FAIL |
| Acceptance against the spec, item by item, read from the current working tree | FAIL |
| design system, copy and truth | FAIL |

Findings: 5 blocker, 6 major, 9 minor (20 total, deduplicated across lenses by file, line and issue).

## Findings

### 1. BLOCKER, item 4, `brandgeo-dashboard/src/pages/Signup.tsx:62` (Acceptance against the spec, item by item, read from the current working tree)

humanizeError() discards every server validation message on the signup path, a regression against 3d98bdc. Traced: line 59 does `throw new Error(data?.error || 'Signup failed. Please try again.')`, so the thrown object has name 'Error' and message equal to the server string. errors.ts:26-36 only matches name TypeError/AbortError/SyntaxError or the three network substrings, then errors.ts:38-46 match two Supabase strings, then errors.ts:48 `return fallback`. Every signup-client.js message therefore falls through to the generic fallback. The reachable, actionable strings that are now hidden: signup-client.js:91 'Please enter a valid email address', :95 'Please use a permanent email address so we can send your results and sign-in link.', :112 'Too many signup attempts. Max N per day, please try again tomorrow.' At base the customer saw those via setError(err.message). Now a disposable-address signup and a rate-limited signup both read 'Signup failed. Please try again.' with nothing to change, so the visitor retries the same input. Item 4's stated defect was raw transport errors reaching the customer, not server copy written for the customer.

Suggested fix: In Signup.tsx only: mark the server-sourced throw and bypass humanizeError for it. At :59 `if (!res.ok) { const e: any = new Error(data?.error || 'Signup failed. Please try again.'); e.fromServer = !!data?.error; throw e }` and at :62 `setError(err?.fromServer ? err.message : humanizeError(err, 'Signup failed. Please try again.'))`.

### 2. BLOCKER, item 4, `brandgeo-dashboard/src/pages/Welcome.tsx:114` (Acceptance against the spec, item by item, read from the current working tree)

Same swallow on the onboarding gate, and here it is a dead end rather than an annoyance. Welcome.tsx:76-82 only checks that the fields are non-empty, so a malformed website reaches provision-account.js:101 'Please enter a valid company website (e.g. example.com)' (and :111 'Please enter your name as it appears publicly'). :99 throws `new Error(data?.error || ...)`, :114 routes it through humanizeError, which returns the fallback 'Setup failed. Please try again.' because errors.ts:48 is the only branch a plain Error with that message reaches. /welcome sits behind OnboardGate (App.tsx:103), so the account cannot proceed until this call succeeds, and the customer is told nothing about which field is wrong. Base commit showed the server string.

Suggested fix: Mirror the Signup fix inside Welcome.tsx: flag the throw at :99 with `fromServer` when `data?.error` exists, and at :114 use `setError(err?.fromServer ? err.message : humanizeError(err, 'Setup failed. Please try again.'))`.

### 3. BLOCKER, item 4, `brandgeo-dashboard/src/pages/Welcome.tsx:114` (design system, copy and truth)

humanizeError swallows every server validation message and replaces it with a generic retry sentence, so a user whose input the server rejected is never told what to change. Traced end to end: Welcome.tsx:101 throws `new Error(data?.error || 'Setup failed. Please try again.')`, so err.name is 'Error' and err.message is the server string. errors.ts:24-41 matches only name TypeError/AbortError/SyntaxError, 'failed to fetch', 'load failed', 'networkerror', 'invalid login credentials', 'email not confirmed'; everything else falls to line 43 `return fallback`. netlify/functions/provision-account.js:101 returns 'Please enter a valid company website (e.g. example.com)' and :111 'Please enter your name as it appears publicly'. Both now render as 'Setup failed. Please try again.', and pressing the button again reproduces the identical failure: the activation form is a closed loop for that user. Identical defect at Signup.tsx:62 against signup-client.js:91 ('Please enter a valid email address'), :95 ('Please use a permanent email address so we can send your results and sign-in link.') and :112 ('Too many signup attempts. Max N per day - please try again tomorrow.'), where 'Please try again' is additionally untrue because the caller is rate limited until tomorrow. This is a regression: the pre-change line was setError(err.message), which showed the server copy.

Suggested fix: Pass the already-customer-ready server string as the fallback so humanizeError only overrides it when it actually recognises a transport error: Welcome.tsx:114 `setError(humanizeError(err, err?.message || 'Setup failed. Please try again.'))` and Signup.tsx:62 `setError(humanizeError(err, err?.message || 'Signup failed. Please try again.'))`. A raw TypeError still maps to the network sentence first, because its message ('Failed to fetch') is matched at errors.ts:28 before the fallback is reached.

### 4. BLOCKER, item 5, `brandgeo-dashboard/src/components/Layout.tsx:226` (correctness and regression)

"Collection complete: N prompts checked" fires for a run that never ran, and for a run the user stopped. Proof, traced end to end: collectionContext.tsx:137 calls setCollecting(true) BEFORE the enqueue fetch; the refusal path at collectionContext.tsx:169-180 returns {blocked:true}, which falls straight through the finally at collectionContext.tsx:219-225 where setCollecting(false) runs. So `collecting` goes false -> true -> false with zero jobs enqueued. Layout.tsx:219 lastProgressRef is populated from every non-null progress and is NEVER reset, so it still holds the previous successful run's {done,total}. Layout.tsx:226-229 then reads `const n = last?.total ?? last?.done ?? 0`, gets a positive number, and renders the notice at Layout.tsx:546. Concrete reachable case: an admin (never cooldown-gated, AIVisibility.tsx:888 only disables for !isAdmin) presses Run Collection, it completes, then presses it again; the second press is a non-force run so _enqueue.js:221 returns skipped:true reason 'nothing to collect (already up to date)', enqueue-collection.js:83 sends it as 200/skipped, and the sidebar prints "Collection complete: 5 prompts checked" at the same moment AIVisibility renders the block notice saying nothing ran. Same defect on Stop: stopCollection (collectionContext.tsx:117) only sets abortRef, the in-flight tick re-arms and the next tick resolves into the same finally, so a run stopped at 3 of 12 announces "Collection complete: 12 prompts checked" (n is progress.total, every prompt, not what was checked).

Suggested fix: In Layout.tsx: add `lastBlockReason` to the useCollection destructure at line 98. In the effect at 225-235, on the false->true edge (line 230) also clear the capture: `lastProgressRef.current = null` alongside setCollectionCompleteCount(null). On the true->false edge (line 226) only set the count when `lastProgressRef.current` is non-null AND `lastBlockReason` is null. That removes the blocked-run case entirely. For the stopped-run case the signal has to come from collectionContext.tsx (also a batch file, item 3's scope): expose the aborted state (e.g. return `{ aborted: abortRef.current }` from runCollection and mirror it into a context field) and gate the notice on it too, since Layout cannot otherwise tell a stopped run from a finished one (lastProgressRef.done is unreliable here: the final tick's setProgress and the finally's setProgress(null) can land in one commit, so done can read total-1 on a perfectly normal completion).

### 5. BLOCKER, item 5, `brandgeo-dashboard/src/components/Layout.tsx:229` (Acceptance against the spec, item by item, read from the current working tree)

The new 'Collection complete' notice fires after a run that never collected anything, printing a stale count as fact. Traced: collectionContext.tsx:136 calls setCollecting(true) before the enqueue fetch, and the blocked path at :169-180 returns from inside the try, so the finally at :220-225 still runs setCollecting(false). No setProgress happens on that path, and Layout.tsx:219-222 never resets lastProgressRef, so the transition handler at :226-229 reads the PREVIOUS successful run's totals and calls setCollectionCompleteCount(n). Concrete sequence, reachable on the free plan the item targets: run a collection (12 prompts, progress {done:12,total:12}), press Run Collection again inside the 720h cooldown, enqueue-collection answers skipped, and the sidebar renders 'Collection complete: 12 prompts checked' (Layout.tsx:546) next to the cooldown block message. Same false notice for the 'no active prompts' and 'nothing to collect' skip reasons.

Suggested fix: In Layout.tsx, clear the ref when a run starts so a blocked run cannot inherit an old count: in the start branch at :230-232 add `lastProgressRef.current = null` alongside `setCollectionCompleteCount(null)`, and keep the `if (n > 0)` guard at :229 so a blocked run shows nothing.

### 6. MAJOR, item 3, `brandgeo-dashboard/src/pages/AIVisibility.tsx:1379` (correctness and regression)

The getEngineStates reorder makes the page tell every customer that a RETIRED engine is "Not yet built". planConfig.ts:117 puts `meta` in COMING_SOON_ENGINES, and planConfig.ts:59-62 records that meta was live and was retired from every plan set on 2026-07-16 (it is in no plan's engine array). With COMING_SOON checked before the plan set (planConfig.ts:847-857), getEngineStates now returns 'coming_soon' for meta on every plan instead of 'locked', so AIVisibility.tsx:669 comingSoonEngines contains meta for every user, it renders as a full card in the engine grid with a "Soon" badge, and AIVisibility.tsx:1379 labels it 'Not yet built'. That is false: it was built, it collected, it was withdrawn. The batch traded one untrue label (the old 'Unlock on Growth' chip, which advertised a purchase that delivers nothing) for another, and promoted it from a small chip to a prominent card. Verified reachable on the free plan: planSet is ['gemini'] (planConfig.ts:75), so meta, deepseek and copilot all land in the coming-soon grid where the free plan previously showed none.

Suggested fix: Keep the getEngineStates reorder (the locked strip is now correct) and make the label honest at AIVisibility.tsx:1379: `{id === 'meta' ? 'No longer collected' : COMING_SOON_ENGINES.has(id) ? 'Not yet built' : 'Paused by admin'}`.

### 7. MAJOR, item 3, `brandgeo-dashboard/src/pages/AIVisibility.tsx:1379` (design system, copy and truth)

Reordering getEngineStates moves retired Meta AI from 'locked' to 'coming_soon' on every plan, so the engine grid now renders a Meta AI card badged 'Soon' with the subtitle 'Not yet built'. That statement is false and every customer sees it. planConfig.ts:61-62 records that meta was built, collected, and was retired 2026-07-16 ('kept in ENGINE_META below only so historical meta rows still render'), and ENGINE_UNLOCK_PLAN.meta at :231 is annotated 'retired (no plan includes it)'. Traced: planConfig.ts:857 now assigns coming_soon before the plan-set test, meta is in no PLAN_ENGINES array so it reaches that branch on every plan, AIVisibility.tsx:669 collects it into comingSoonEngines, and the map at :1364-1384 renders it unconditionally with the Clock 'Soon' badge at :1375 and 'Not yet built' at :1379. The item's stated defect was a retired engine advertised as purchasable; it is now a retired engine advertised as forthcoming, which is the same untruth in a more prominent card.

Suggested fix: Keep the retired engine out of both strips rather than relabelling it. In AIVisibility.tsx:669 exclude it explicitly: `const comingSoonEngines = ALL_ENGINES.filter(e => engineStates[e] === 'coming_soon' && e !== 'meta')`. lockedEngines at :670 already excludes it after the getEngineStates change, so meta then renders nowhere in the grid while ENGINE_META keeps rendering historical rows.

### 8. MAJOR, item 4, `brandgeo-dashboard/src/index.css:261` (correctness and regression)

The light-mode half of the placeholder contrast fix is dead on arrival, so criterion 4.6 is not actually met. index.css:162-163 adds `input::placeholder, textarea::placeholder { color: rgb(148 163 184) !important }`. index.css:259-262 sets `html.light input::placeholder, html.light textarea::placeholder { color: rgb(85 100 121) }` with NO !important. An author !important declaration always wins over a non-important author declaration regardless of selector specificity or source order, so the light rule never applies and light-mode placeholders render rgb(148 163 184). The light input fill is `rgb(var(--dark-900))` (index.css:253-256) which is rgb(247 247 251) (index.css:74). Computed contrast for rgb(148 163 184) on rgb(247 247 251) is 2.43:1; the value the builder intended, rgb(85 100 121), is 5.64:1. Placeholder text therefore stays under the 4.5:1 floor in one of the two shipped themes, which is the exact defect item 4 was raised to close.

Suggested fix: Add !important to both declarations in the rule at index.css:259-262: `html.light input::placeholder, html.light textarea::placeholder { color: rgb(85 100 121) !important; }`.

### 9. MAJOR, item 4, `brandgeo-dashboard/src/index.css:162` (Acceptance against the spec, item by item, read from the current working tree)

Item 4 criterion 6 is not actually met: the new global rule carries !important, so the light-mode value it also asks for can never apply. index.css:161-162 declares `input::placeholder, textarea::placeholder { color: rgb(148 163 184) !important }` unscoped, and index.css:259-261 declares `html.light input::placeholder { color: rgb(85 100 121); }` with no !important. An important declaration wins over a non-important one regardless of specificity or source order, so light mode still paints placeholders rgb(148 163 184). Against the light input fill rgb(var(--dark-900)) = rgb(247 247 251) (index.css:74, applied to inputs at :252-257) that is 2.40:1, versus 5.55:1 for the rgb(85 100 121) the criterion specifies. The file's own comment at :147-150 relies on the light overrides carrying !important, which this one does not.

Suggested fix: Add !important to the light rule at index.css:260 so it beats the new global one: `color: rgb(85 100 121) !important;`.

### 10. MAJOR, item 4, `brandgeo-dashboard/src/index.css:162` (design system, copy and truth)

The new global placeholder rule carries !important and therefore beats the light-mode rule the same criterion asked to be corrected, so the light-theme half of the contrast fix does not apply. Read both rules: :162-163 `input::placeholder, textarea::placeholder { color: rgb(148 163 184) !important }`; :259-261 `html.light input::placeholder, html.light textarea::placeholder { color: rgb(85 100 121) }` with no !important. Neither sits inside @layer (the only @layer base block is :130-144), so both are author-origin declarations and the important one wins regardless of the light rule's higher specificity. Every placeholder in light mode therefore still resolves to #94a3b8, which is 2.54:1 on a white input, under the 4.5:1 text floor the comment at :155-158 states as the reason for the change; the edit to rgb(85 100 121) is dead code.

Suggested fix: Add !important to the light rule so it can win: index.css:261 `color: rgb(85 100 121) !important;`. No other change needed; the dark rule at :162 keeps applying wherever html.light is absent.

### 11. MAJOR, item 5, `brandgeo-dashboard/src/components/Layout.tsx:228` (design system, copy and truth)

'Collection complete: N prompts checked' prints the enqueued job total, not the number actually checked, so a stopped or wholly failed run reports a completion that did not happen. Line 228 is `const n = last?.total ?? last?.done ?? 0` and :546 renders it as 'N prompts checked'. total is collection_runs.total_jobs, set at enqueue time (_enqueue.js:232, one job per active prompt). The Stop control at Layout.tsx:514 calls stopCollection, which sets abortRef and resolves the poll loop; collectionContext.tsx:220-226 then runs its finally block, setting collecting false with lastProgressRef still holding the partial {done, total}. So pressing Stop at 2 of 12 renders 'Collection complete: 12 prompts checked'. Separately, collectionContext.tsx:205 counts jobs `.in('status', ['done','failed'])`, so 'checked' also covers prompts whose jobs failed.

Suggested fix: Report what completed and only claim completion when the run finished. Layout.tsx:228: `const n = last?.done ?? 0` and gate the notice on a finished run, e.g. `if (last && last.total > 0 && last.done >= last.total) setCollectionCompleteCount(last.done)`, leaving a stopped run with no notice.

### 12. MINOR, item 2, `brandgeo-dashboard/src/pages/AuditReport.tsx:404` (Acceptance against the spec, item by item, read from the current working tree)

Item 2 criterion 5 asks for focus:border-brand-500 focus:ring-1 focus:ring-brand-500 (present), placeholder:text-slate-500 removed (done), and 'a visible or sr-only label'. The input at :400-405 still carries only aria-label='Email address to unlock the full report' (:403), which is the pre-existing accessible name, not a label element, so that third clause was not acted on. The criterion's other half is also literally unmet in that focus:outline-none is still on the class string at :404, though Login.tsx:66 keeps focus:outline-none too, so the pattern does match Login as the criterion intended.

Suggested fix: Add an sr-only label above the input in AuditReport.tsx: `<label htmlFor="unlock-email" className="sr-only">Email address</label>` and `id="unlock-email"` on the input at :400.

### 13. MINOR, item 3, `brandgeo-dashboard/src/pages/AIVisibility.tsx:999` (correctness and regression)

Criterion 3.4's second half is met only for the free plan, not as written. The criterion's trigger is `!isAdmin && collectionAllowance.nextAvailableAt`; the build adds a third condition, `planLimits.collectionCooldownH > 168` (AIVisibility.tsx:999). PLAN_COLLECTION_COOLDOWN_HOURS (planConfig.ts:560-563) is 720 for free and 168 for radar/essentials/growth/growth_pro/managed/pro, so a paying customer sitting in a weekly cooldown never sees the 'Upgrade for weekly runs' link. The narrowing is defensible (the link would otherwise promise an upgrade that changes nothing) but it is a deviation from the criterion, and the copy it protects is only correct because no plan today sits between 168 and 720 hours; a future mid-tier at, say, 336h would silently get no link.

Suggested fix: Either accept the narrowing and record it, or keep the plan gate but make it relative rather than absolute so it survives a new cadence: replace `planLimits.collectionCooldownH > 168` at AIVisibility.tsx:999 with a comparison against the next plan up's cooldown, and reword the label to name what actually improves rather than hardcoding 'weekly'.

### 14. MINOR, item 3, `brandgeo-dashboard/src/pages/AIVisibility.tsx:997` (Acceptance against the spec, item by item, read from the current working tree)

Item 3 criterion 4's stated trigger for the upgrade control is `!isAdmin && collectionAllowance.nextAvailableAt`, but the implementation adds `planLimits.collectionCooldownH > 168` at :997, so no upgrade control renders beside CooldownCountdown for any paid plan in cooldown. The narrowing is defensible (every paid plan is already weekly, so the label would be untrue for them) and it still fires for the free plan the item targets, but the criterion as written is not met and the self-report says met.

Suggested fix: Either accept the narrowing and amend the criterion, or keep the bare trigger and vary the label, e.g. render 'Upgrade for weekly runs' when collectionCooldownH > 168 and 'See your plan' otherwise, both linking to /account.

### 15. MINOR, item 3, `brandgeo-dashboard/src/pages/AIVisibility.tsx:1402` (design system, copy and truth)

The locked engine chip sets `aria-label={`Unlock on ${planLabel}`}` on the Link, which replaces the whole accessible name, so assistive technology never hears which engine the link is about: the visible engine name in the span at :1405 and the now-empty img alt at :1404 are both suppressed. On the free plan six such links render and ENGINE_UNLOCK_PLAN produces duplicates (perplexity and google_ai both 'growth', ai_overview and grok both 'growth_pro'), so the page presents pairs of links with identical accessible names pointing at the same destination, with nothing to tell them apart. Before this batch the chip was a non-interactive div whose img carried alt={meta.label}, so no ambiguous link name existed.

Suggested fix: Include the engine in the accessible name: AIVisibility.tsx:1402 `aria-label={`${meta.label}: unlock on ${planLabel}`}`. Keep alt="" on the img so the logo is not announced twice.

### 16. MINOR, item 4, `brandgeo-dashboard/src/pages/Login.tsx:138` (design system, copy and truth)

The new footer's Terms and Privacy links are indistinguishable from the text around them in the dark theme, which is the default for these screens. The wrapper paragraph is text-slate-600 (Login.tsx:136) and the two anchors are text-slate-500 (:138 and :140), but index.css:151-152 remaps both classes to the same rgb(148 163 184) with !important outside html.light, so link and non-link render at an identical colour with no underline and no other affordance; only hover distinguishes them, which is unavailable on touch. Same two lines at ResetPassword.tsx:80 and :82.

Suggested fix: Give the anchors a link treatment on all four lines (Login.tsx:138,140 and ResetPassword.tsx:80,82), e.g. `className="underline underline-offset-2 text-slate-500 hover:text-slate-400"`, or switch them to text-brand-400 hover:text-brand-300 as the rest of the auth screens do.

### 17. MINOR, item 5, `brandgeo-dashboard/src/components/Layout.tsx:353` (correctness and regression)

Half of criterion 5.6's intent is unmet: the billing-portal failure still renders the server's own error string verbatim. Layout.tsx:353 does `setSidebarNotice(data?.error || 'Could not open the billing portal. Please try again.')`, so whatever create-billing-portal returns in `error` is printed to the customer. The sibling handler eight lines of context away (Layout.tsx:670-675) deliberately does the opposite for exactly this reason, logging the driver message to console and showing fixed copy because it 'can name internal tables and policies'. The alert() was replaced as asked, but the developer-facing content that alert() carried was not, so the two new notices disagree about the rule. Not a regression versus 3d98bdc (the old alert showed the same string), which is why this is minor rather than major.

Suggested fix: At Layout.tsx:353 drop the passthrough and match the pattern the category handler already uses: `console.error('[Layout] billing portal failed:', data?.error)` then `setSidebarNotice('Could not open the billing portal. Try again, and if it keeps failing contact support.')`. Do the same for the catch at Layout.tsx:355.

### 18. MINOR, item 5, `brandgeo-dashboard/src/components/Layout.tsx:228` (Acceptance against the spec, item by item, read from the current working tree)

The completion count uses `last?.total ?? last?.done`, so pressing Stop mid-run reports the full run size as checked. Traced: stopCollection (collectionContext.tsx:117-120) sets abortRef, the poll resolves at :204, and the finally flips collecting false, so a Stop at progress {done:3,total:12} renders 'Collection complete: 12 prompts checked'. The server worker does finish the remaining jobs, so the number becomes true later, but at the moment it is shown 9 of the 12 are not yet checked and the run was explicitly stopped by the user.

Suggested fix: In Layout.tsx:228 prefer the observed count when it is short: `const n = last ? (last.done < last.total ? last.done : last.total) : 0`, and word the short case as 'Collection stopped: N prompts checked'.

### 19. MINOR, item 5, `brandgeo-dashboard/src/components/Layout.tsx:541` (design system, copy and truth)

The completion notice paints itself with the sentiment data tokens (bg-sentiment-positive-15 and border-sentiment-positive-30 at :541, text-sentiment-positive at :545 and :567), giving the lime hue a second meaning in the shell. docs/design/dashboard-visual-system.md section 8.6 rule 3 assigns the collection banner to brand violet chrome explicitly, and rule 4 reserves the three sentiment tokens; the in-progress banner immediately above at :506-512 correctly uses bg-brand-500/8 and text-brand-300. The result is that lime means both 'positive sentiment' on /sentiment and 'a run finished' in the sidebar.

Suggested fix: Match the banner it replaces: at Layout.tsx:541 use `bg-brand-500/8 border-b border-brand-500/20`, and at :545 and :567 use text-brand-300 / hover:text-brand-200.

### 20. MINOR, item 5, `brandgeo-dashboard/src/components/Layout.tsx:550` (design system, copy and truth)

Both new dismiss controls are a bare 12px lucide X with no padding, so the pointer target is about 12 by 12 CSS pixels, under the 24 by 24 minimum. Read the elements: :548-553 `className="shrink-0 text-slate-500 hover:text-sentiment-positive transition-colors"` wrapping `<X size={12} />`, and the identical shape at :563-568. Neither has a p-* or min-w/min-h class, and the parent is a flex row that does not stretch them. The sidebar notice at :560 has no other way to be cleared, so the small target is the only route out of it.

Suggested fix: Add padding and a floor to both buttons: `className="shrink-0 -m-1 p-1 min-w-[24px] min-h-[24px] flex items-center justify-center ..."` on Layout.tsx:550 and :565, keeping the 12px glyph.

## What was done about them (orchestrator, same day, before commit)

- Findings 1, 2, 3 (server validation copy swallowed on signup and setup): `src/lib/errors.ts` gained `serverError(message)`, which marks the thrown Error `fromServer`, and `humanizeError` returns such a message verbatim before any other branch. `Signup.tsx` and `Welcome.tsx` throw `serverError(String(data.error))` when the body carries `error`, and the generic fallback otherwise. The two `as any` casts in `errors.ts` were replaced with a typed guard.
- Findings 4, 5, 11, 18 (false end-of-run notice): the shell no longer infers completion from `collecting` flipping false. `collectionContext.tsx` records `lastRunOutcome` (blocked, stopped or completed, with the poll's own final `done` and `total`) exactly once per run in its finally block, from local variables, never from React state. `Layout.tsx` renders from that: completed shows the real count, stopped says stopped with N of T, blocked shows nothing, a new run clears it.
- Reviewer note 6 (pre-existing Stop hang, not a batch finding): fixed in the same file. `stopCollection` now resolves the pending poll promise directly, and an in-flight tick neither writes progress nor schedules another tick once aborted.
- Findings 6, 7 (retired Meta AI shown as forthcoming): `planConfig.ts` gained `RETIRED_ENGINES`; `AIVisibility.tsx` keeps those out of the coming-soon grid, and the locked strip already excluded them. The engine renders nowhere; historical rows still render through ENGINE_META.
- Findings 8, 9, 10 (light placeholder rule dead): the light rule in `index.css` now carries `!important`, with a comment stating why it is required.
- Finding 12: the report gate input has an sr-only label bound by id; the aria-label was removed so the label is the accessible name.
- Findings 13, 14: ACCEPTED as a deviation from the criterion. The upgrade link renders only for plans slower than weekly (today, free at 720h). Every paid plan is already weekly, so the link would promise nothing there.
- Finding 15: the locked chip accessible name includes the engine.
- Finding 16: footer Terms and Privacy anchors are underlined on Login, ResetPassword and Signup.
- Finding 17: billing-portal failure logs the server message and shows fixed copy in both branches.
- Findings 19, 20: the notice uses brand chrome tokens; both dismiss buttons have 24px targets.
- Reviewer note 2 (not a finding): `Dashboard.tsx` only updates its all-time flag when the query returned data, so a failed reload cannot put the empty hero over real data.

Verification after the fixes: `npm run build` (tsc plus vite) exit 0; zero em or en dashes in added lines across the batch; dirty-file count unchanged at exactly the batch. An independent verifier then re-checked all 20 findings; its verdict is recorded below.

## Not fixed here, recorded for the next packet

- Reviewer note 5: the four item-5 pages fire a duplicate load on mount when `lastCompletedAt` is already set from an earlier run in the session. Costs a query set per mount, not correctness; matches the AI Visibility precedent.
- The base files carry 226 pre-existing em or en dash lines in comments and older copy, none added by this batch. Whether any is customer-visible is a separate scan.
- `netlify/functions/signup-client.js` line 112 carries an em dash inside the customer-facing rate-limit sentence, which the Signup pass-through prints verbatim on a 429. Backend file, outside this batch; a one-word fix owed to `bg-backend`.
- The poll's `done` counts jobs in status `done` or `failed` (`collectionContext.tsx`), so a failed job still reads as "checked" in the end-of-run line. Pre-existing semantics, noted by the verifier under finding 11; needs a ruling on whether the notice should say "N checked, M failed".

## Verifier verdict

Independent `bg-verify` pass over all 20 findings against the fixed tree, 2026-09-03: **PASS_WITH_FINDINGS**. All 5 blockers, all 6 majors and the 9 remaining minors confirmed closed; findings 13 and 14 confirmed as an accepted deviation whose copy is true today. `tsc --noEmit` exit 0 with no output.

Four residual items, all minor, none breaking a criterion the fix claimed. All four were fixed before commit, in files the batch already owns:

- D1 (introduced by the fix): the retired engine still printed "Coming Soon" in the admin engine modal, because that list filtered only locked engines. `planEngines` in `AIVisibility.tsx` now excludes `RETIRED_ENGINES` too.
- D2 (introduced by the fix): the end-of-run notice survived a client switch and could show another tenant's count with no client name. The notice is now derived from `lastRunOutcome`, which carries the client it ran for, and renders only for the active client; dismissal is keyed to the outcome's timestamp, so it cannot be stored past what it describes.
- D3 (pre-existing, narrowed by the first fix): a poll tick in flight at Stop could resolve after the next run had reset the abort flag and re-arm itself into the new run's progress bar. A per-run sequence number in `collectionContext.tsx` retires the orphan tick.
- D4 (pre-existing, restored by the fix): the server-message pass-through on Signup and Welcome was unbounded by status, so "Unauthorized: invalid or expired token" could print verbatim. `isCustomerFacingStatus()` in `errors.ts` limits it to 4xx bodies other than 401 and 403; anything else is logged to the console and shown as a fixed sentence, the rule the shell already applies to the billing portal.

After these fixes: `npm run build` exit 0 (tsc plus vite, 9 s), zero em or en dashes in added lines (scan proven with a positive control), no consumer of the removed names remains anywhere in `src/`.
