# AI Visibility prompt-first release one: copy deck, 2026-10-31

Status: wording applied in `brandgeo-dashboard/src/lib/aiVisibilityCopy.ts` (string values only). Hand back to bg-app: no code change needed, strings are already in place.

## 1. Voice check

- Who speaks: BrandGEO, plainly, as the tool that ran the check.
- To whom: a business owner who noticed ChatGPT does not mention them and does not know GEO vocabulary.
- Level: no jargon, say what was measured, what failed, what was never checked. No promise of a result, no reason given for why an engine chose a brand.

## 2. Copy table

Location is `aiVisibilityCopy.ts` key unless stated. Slot lengths were checked against the current placeholder and the call site in `AIVisibility.tsx` or `PromptResultCell.tsx`.

| Key | Before | After | Reason |
|---|---|---|---|
| headlineUncheckedTitle | No engine could be checked yet. | No engine has answered yet. | Says what happened, not who failed. |
| headlineNotYet (second sentence) | AI engines named {k} other brand(s) instead. | The engines named {k} other brand(s) in their answers. | "Instead" implied a swap we did not measure. |
| headlineUncheckedReason | {engines} could not be reached (since {date}). | {engines} did not answer (since {date}). | States the observed fact, not the cause. |
| orderFrozenNote | Order updates when the check finishes. | Prompts keep this order until the check finishes. | Clearer cause and effect. |
| sectionUncheckedExtra | oldest failure {date} | first failed {date} | Plainer wording, same date. |
| chipPending (row chip) | pending | not checked yet | Matches the legend and says what it means. |
| errorSinceChip (row chip) | error since {date} | not answering since {date} | Matches the engine card badge. |
| competitorHeading | Who the engines recommend for this question | Brands the engines named for this question | Named is what was measured, not recommended. |
| competitorEmpty | The engines answered without naming a brand. | The engines that answered did not name any brand. | Excludes engines that never answered. |
| legendAbsent | Absent | Answered, not mentioned | Absent could read as "not checked". |
| viewerHint | Run Collection re-checks every prompt. | Run Collection checks all your prompts again. | Plain verb, no hyphen jargon. |
| fixAllLowTitle | Rarely recommended on any engine | Named in under 25% of answers on every engine | "Rarely" is vague; 25% is the real threshold (AIVisibility.tsx:690). |
| dimNeedsMention | needs a mention | measured once you are mentioned | Says when the number will appear. |
| promptsLoadError | Your results could not be loaded. | Your results did not load. Your data is not affected. | Adds true reassurance; a failed read changes no data. |
| engineNotAnsweringLine, quota_exceeded | Not answering since {date} (provider limit) | Not answering since {date} (provider limit reached) | Clearer, still no cause claimed beyond the code. |
| engineNotAnsweringLine, auth_error | Not answering since {date} (configuration) | Not answering since {date} (access problem) | "Configuration" means nothing to an owner. |

Also removed two developer comments marked "bg-copy" (comment text only, no behaviour).

## 3. Variants

None required. This release has no hero, subhead or primary CTA.

## 4. Number narration

Not in scope for this pass. Score card strings kept per the ruling: band "Not recommended yet", dimension value "n/a".

## 5. Error and empty states

- Load failure: "Your results did not load. Your data is not affected." plus button "Try again" (unchanged). Names what happened, not user-caused, next step is the button.
- Engine not answering: "Not answering since {date} (reason)". Not user-caused; the reason in brackets tells whether it is on the engine provider or on BrandGEO access. Next step for the user is to wait, or contact support if it persists; no apology without a step is used.
- Empty category: "No prompts in this category." plus button "Show all prompts" (unchanged).

## 6. Strings deliberately left alone

- headlineRecommended: "recommended" kept for consistency with the ruled band "Not recommended yet". A mention is not always a recommendation; flagged for Constantin.
- Force Refresh label and its aria text (kept as instructed; the aria text is accurate).
- Bands, sort labels (ruled), section titles "Where you appear" and "Where you do not appear yet", "Could not be checked", cell words (mentioned, absent, no answer, error, pending) and legend entries other than Absent: short slots, already plain and accurate.
- headlineNotYetTail: unused in the page, left as is.
- ratioNoneChip, enginesNamed, namedByEngines, lockedHeaderLabel, cell aria labels: plain, accurate, consistent with siblings.

## 7. Compliance pass

Commands run, raw output below (pasted after the run).

```
rg -n "[em/en dash codepoints]" docs/copy/ai-visibility-prompt-focus-copy-2026-10-31.md brandgeo-dashboard/src/lib/aiVisibilityCopy.ts
(no output, exit 1; positive control file with an em dash returned a hit, exit 0)

rg -ni "<full banned vocabulary pattern from the bg-copy spec>" <same two files>
(no output, exit 1)

npx tsc --noEmit (brandgeo-dashboard): exit 0
```

No number is stated that is not traceable: the only figure is 25%, the PARTIAL/MISSING threshold in `AIVisibility.tsx:690`. No competitor claims, no schema.org types, no scaled content.

## Ruling 2026-11-01

Constantin: the H1 keeps "recommended" ("recommended" versus "mentioned" was put to him, he chose "recommended"). Do not re-raise.
