/**
 * English placeholder copy for the AI Visibility prompt-focus change.
 *
 * Every user-visible string the spec marks as copy lives here, so bg-copy can
 * replace wording in one file without touching layout. These are the spec's
 * placeholder strings verbatim (without the "[copy: ]" wrapper). No i18n keys
 * are added: the wider page is still English-first.
 */

export const AIV_COPY = {
  // Headline
  headlineChecking: 'Checking your prompts now.',
  headlineUncheckedTitle: 'No results to show yet.',
  headlineFirstCheckPending: 'Your first check has not run yet.',
  orderFrozenNote: 'Prompts keep this order until the check finishes.',

  // Sections
  sectionAppear: 'Where you appear',
  sectionNotYet: 'Where you do not appear yet',
  sectionUnchecked: 'No result yet',

  // Sort
  sortLabel: 'Sort',
  sortGroupLabel: 'Sort prompts',
  sortBest: 'Best performing',
  sortNeedsWork: 'Needs work first',
  sortPosition: 'Prompt order',
  sortRecent: 'Recently checked',

  // Row chips
  chipNoAnswer: 'no answer',
  chipPending: 'no result yet',
  chipStale: 'pending update',

  // Competitor block
  competitorHeading: 'Brands the engines named for this question',
  competitorEmpty: 'The engines that answered did not name any brand.',

  // Category empty
  categoryEmpty: 'No prompts in this category.',
  categoryEmptyAction: 'Show all prompts',

  // Cell words
  cellMentioned: 'mentioned',
  cellAbsent: 'absent',
  cellNoAnswer: 'no answer',
  cellError: 'error',
  cellPending: 'no result',

  // Legend
  legendMentioned: 'Mentioned, with rank',
  legendAbsent: 'Answered, not mentioned',
  legendNoAnswer: 'No answer',
  legendPending: 'No result yet',
  legendStale: 'Pending update, last result shown',
  legendLocked: 'Locked on your plan',
  viewerHint: 'Run Collection checks the prompts and engines that have no result yet this month.',

  // Engine card. An engine whose last check failed is never shown as an
  // error to a viewer: the card keeps its last results and carries a quiet
  // "Pending update" control, or reads "No result yet" when there is none.
  // Never name credits, quota, billing or costs here.
  engineNoResult: 'No result yet',
  stalePill: 'Pending update',
  staleRetry: 'We will retry automatically.',

  // Fix This
  fixAllMissingTitle: 'Not yet recommended on any engine',
  fixAllLowTitle: 'Named in under 25% of answers on every engine',

  // Prompt area and headline actions
  promptsHeading: 'Your prompts',
  actionRunCollection: 'Run Collection',
  actionForceRefresh: 'Force Refresh',
  actionForceRefreshAria: 'Force refresh: wipes existing results and re-runs all engines',

  // Score card
  bandNotRecommended: 'Not recommended yet',
  dimNotApplicable: 'n/a',
  dimNeedsMention: 'measured once you are mentioned',

  // Errors
  promptsLoadError: 'Your results did not load. Your data is not affected.',
  promptsLoadRetry: 'Try again',
} as const

const plural = (n: number, one: string, many: string) => (n === 1 ? one : many)

/** "{count} prompt|prompts" */
export function promptCount(n: number): string {
  return `${n} ${plural(n, 'prompt', 'prompts')}`
}

/** H1 */
export function headlineRecommended(a: number, n: number, engineLabel: string | null, pos: number | null): string {
  const base = `Your brand is recommended in ${a} of ${n} ${plural(n, 'prompt', 'prompts')}`
  if (!engineLabel) return `${base}.`
  return pos != null ? `${base}, best on ${engineLabel} (#${pos}).` : `${base}, best on ${engineLabel}.`
}

/** H2 */
export function headlineNotYet(n: number, k: number): string {
  const first = `Not yet recommended in any of the ${n} ${plural(n, 'prompt', 'prompts')} checked.`
  if (k <= 0) return first
  return `${first} The engines named ${k} other ${plural(k, 'brand', 'brands')} in their answers.`
}

/** H3 reason line. Neutral on purpose: a failed engine run is never shown to a viewer as an error. */
export function headlineUncheckedReason(engineList: string | null): string {
  if (!engineList) return AIV_COPY.headlineFirstCheckPending
  return `${engineList} did not respond on the last check. ${AIV_COPY.staleRetry}`
}

/** "ChatGPT", "ChatGPT and Gemini", "ChatGPT, Gemini and Claude" */
export function joinEngineLabels(labels: string[]): string {
  if (labels.length <= 1) return labels[0] ?? ''
  return `${labels.slice(0, -1).join(', ')} and ${labels[labels.length - 1]}`
}

export function ratioNoneChip(answered: number): string {
  return `0 of ${answered} ${plural(answered, 'engine', 'engines')}`
}

export function enginesNamed(competitor: string): string {
  return `Engines named ${competitor}`
}

export function namedByEngines(k: number, answered: number): string {
  return `named by ${k} of ${answered} ${plural(answered, 'engine', 'engines')}`
}

// Cell accessibility strings
export function cellMentionedLabel(engine: string, position: number | null): string {
  return position != null ? `${engine}: mentioned, rank ${position}` : `${engine}: mentioned`
}
export function cellAbsentLabel(engine: string): string { return `${engine}: not mentioned` }
export function cellNoAnswerLabel(engine: string): string { return `${engine}: gave no answer` }
export function cellErrorLabel(engine: string, since: string | null, previousOk: string | null): string {
  const base = since ? `${engine} has not answered since ${since}` : `${engine} has not answered`
  return previousOk ? `${base}, last result ${previousOk}` : base
}
export function cellPendingLabel(engine: string): string { return `${engine}: no result yet` }
export function cellSinceLine(since: string): string { return `since ${since}` }

// Locked engine controls (matrix header and engine strip card). The name starts
// with the visible "Upgrade" so speech input reaches it (WCAG 2.5.3); ruled by
// Constantin 2026-11-16, copy deck pending-strings-2026-11-16.md section 13.
export function lockedHeaderLabel(engine: string, plan: string): string {
  return `Upgrade to ${plan} for ${engine}`
}

// Pending update explainers (engine card popover, matrix cell, expanded panel).
// The viewer never sees why a run failed; an admin sees the raw code separately.
export function staleExplainer(date: string): string {
  return `Showing the result from ${date}. This engine did not respond on the last check; we will retry automatically.`
}
export function staleNoResultExplainer(): string {
  return `This engine did not respond on the last check, so there is no result to show yet. ${AIV_COPY.staleRetry}`
}
/** Engine card popover when only some prompts missed the last check. */
export function stalePartialExplainer(count: number, date: string | null): string {
  const what = `${count} ${plural(count, 'prompt shows its', 'prompts show their')} last result`
  return date
    ? `${what} because this engine did not respond on the check of ${date}. ${AIV_COPY.staleRetry}`
    : `${what} because this engine did not respond on the last check. ${AIV_COPY.staleRetry}`
}
/** Screen reader suffix on a matrix cell that shows an earlier result. */
export function staleCellLabel(date: string): string {
  return `result from ${date}, pending update`
}
/** Admin only, never in demo. */
export function staleAdminCode(code: string): string {
  return `Admin: last error code ${code}`
}

// Fix This
/** Per-engine P0 title for a MISSING engine (under 25%). Absence is claimed only at 0 mentions. */
export function fixEngineMissingTitle(engine: string, mentioned: number): string {
  return mentioned > 0 ? `Rarely named in ${engine}` : `Not found in ${engine}`
}

export function fixAppearsLine(brand: string, mentioned: number, checked: number, engine: string): string {
  return `${brand} appears in ${mentioned} of ${checked} ${plural(checked, 'answer', 'answers')} on ${engine}`
}

export function fixAllMissingLine(brand: string, checked: number, engines: number): string {
  return `${brand} appears in 0 of ${checked} ${plural(checked, 'answer', 'answers')} across ${engines} ${plural(engines, 'engine', 'engines')}`
}

// Wording for the case where every engine is under 25% but the brand
// does appear somewhere. The count is the real summed mention count, the same
// number the score card and engine cards show.
export function fixAllLowLine(brand: string, mentioned: number, checked: number, engines: number): string {
  return `${brand} appears in ${mentioned} of ${checked} ${plural(checked, 'answer', 'answers')} across ${engines} ${plural(engines, 'engine', 'engines')}`
}

// Fix This: done, re-check and next fixes (docs/arch/fix-states.md)
export const FIX_COPY = {
  explainer: 'Copy each recommended fix and apply it to your site or content. Mark it done when you have, and we check the number after a later collection. Urgent items move your score the most.',
  copyPrompt: 'Copy as AI prompt',
  copiedAnnounce: 'Prompt copied. Paste it into your AI assistant.',
  copyFailed: 'Your browser did not allow copying. Select the fix text and copy it by hand.',
  markDone: 'Mark as done',
  dismiss: 'Not for us',
  reopen: 'Reopen',
  restore: 'Restore',
  checkNow: 'Check now',
  doneHeading: 'Done',
  allDone: 'All current fixes are done. New ones appear here as your results change.',
  manual: 'Marked done. This one cannot be measured, so there is nothing to check.',
  manualTail: 'This one cannot be measured, so there is nothing to check.',
  untracked: 'The prompt or engine this fix measured is no longer tracked, so it cannot be checked.',
  saveFailed: 'Could not save that change. Please try again.',
  promptGapFix: 'Publish a page that answers this question directly, with your brand name in the title and the H1, and link it from your main service page. Ask one trusted publication or directory in your field to reference it.',
}

/** Suffix for a line about a fix an AI agent marked through MCP; keyLabel is empty when the key cannot be read. */
export function fixByAgent(keyLabel?: string | null): string {
  return keyLabel ? ` by an AI agent (${keyLabel})` : ' by an AI agent'
}
/** Suffix for a line about a fix an app connected through OAuth marked; appName is empty when it cannot be read. */
export function fixByApp(appName?: string | null): string {
  return appName ? ` by ${appName}` : ' by an AI agent'
}
export function fixDoneWaiting(markedOn: string, readyAfter: string, by = ''): string {
  return `Marked done ${markedOn}${by}. We check the number on the first collection after ${readyAfter}.`
}
export function fixDoneWaitingData(markedOn: string, fresh: number, needed: number, by = ''): string {
  return `Marked done ${markedOn}${by}. Waiting for newer answers: ${fresh} of ${needed} needed so far.`
}
export function fixVerifiedLine(on: string, metric: string, before: number, after: number): string {
  return `Verified ${on}: ${metric} went from ${before}% to ${after}%.`
}
export function fixReopenedLine(markedOn: string, checkedOn: string, metric: string, before: number, after: number): string {
  return `You marked this done ${markedOn}. After the answers collected by ${checkedOn}, ${metric} is ${after}% (was ${before}%). Mark it done again once you have changed more.`
}
export function fixDismissedLine(on: string, by = ''): string {
  return `Set aside ${on}${by}.`
}
export function fixPromptGapTitle(prompt: string): string {
  const t = prompt.length > 90 ? prompt.slice(0, 87) + '...' : prompt
  return `Not named for: ${t}`
}
export function fixPromptGapLine(brand: string, answers: number, withCompetitor: number): string {
  const base = `No engine named ${brand} in ${answers} ${plural(answers, 'answer', 'answers')}`
  return withCompetitor > 0
    ? `${base}; ${withCompetitor} of them named another brand instead.`
    : `${base}.`
}
export function fixCheckNowWaiting(readyAfter: string): string {
  return `Nothing to check yet. The check needs answers collected after ${readyAfter}, so it runs on your first collection after that date, scheduled or run by hand.`
}
export function fixMarkedOn(on: string, by = ''): string {
  return `Marked done ${on}${by}.`
}
/** Screen reader announcement when a fix leaves or returns to the open list. */
export function fixMovedAnnouncement(status: 'done' | 'dismissed' | 'open', title: string): string {
  if (status === 'done') return `Marked as done: ${title}. Moved to the Done list.`
  if (status === 'dismissed') return `Set aside: ${title}. Moved to the Done list.`
  return `Back in the list: ${title}.`
}
