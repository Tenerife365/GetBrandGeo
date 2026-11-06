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
  headlineUncheckedTitle: 'No engine has a current answer to show.',
  headlineFirstCheckPending: 'Your first check has not run yet.',
  orderFrozenNote: 'Prompts keep this order until the check finishes.',

  // Sections
  sectionAppear: 'Where you appear',
  sectionNotYet: 'Where you do not appear yet',
  sectionUnchecked: 'Could not be checked',

  // Sort
  sortLabel: 'Sort',
  sortGroupLabel: 'Sort prompts',
  sortBest: 'Best performing',
  sortNeedsWork: 'Needs work first',
  sortPosition: 'Prompt order',
  sortRecent: 'Recently checked',

  // Row chips
  chipNoAnswer: 'no answer',
  chipPending: 'not checked yet',

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
  cellPending: 'pending',

  // Legend
  legendMentioned: 'Mentioned, with rank',
  legendAbsent: 'Answered, not mentioned',
  legendNoAnswer: 'No answer',
  legendError: 'Could not check',
  legendPending: 'Not checked yet',
  legendLocked: 'Locked on your plan',
  viewerHint: 'Run Collection checks the prompts and engines that have no result yet this month.',

  // Engine card
  engineNotAnswering: 'NOT ANSWERING',

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

/** H3 reason line */
export function headlineUncheckedReason(engineList: string | null, since: string | null, engineCount: number): string {
  if (!engineList) return AIV_COPY.headlineFirstCheckPending
  const verb = engineCount === 1 ? 'has' : 'have'
  return since ? `${engineList} ${verb} not answered since ${since}.` : `${engineList} ${verb} not answered.`
}

/** "ChatGPT", "ChatGPT and Gemini", "ChatGPT, Gemini and Claude" */
export function joinEngineLabels(labels: string[]): string {
  if (labels.length <= 1) return labels[0] ?? ''
  return `${labels.slice(0, -1).join(', ')} and ${labels[labels.length - 1]}`
}

export function sectionUncheckedExtra(oldestFailure: string): string {
  return `first failed ${oldestFailure}`
}

export function errorSinceChip(since: string): string {
  return `not answering since ${since}`
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
export function cellPendingLabel(engine: string): string { return `${engine}: not checked yet` }
export function cellSinceLine(since: string): string { return `since ${since}` }

// Locked header
export function lockedHeaderLabel(engine: string, plan: string): string {
  return `${engine}, available on ${plan}. See plans`
}

// Engine card failure lines (R4)
export function engineNotAnsweringLine(code: string | null | undefined, since: string): string {
  if (code === 'quota_exceeded') return `Not answering since ${since} (provider limit reached)`
  if (code === 'auth_error') return `Not answering since ${since} (access problem)`
  return `Last check failed on ${since}`
}
export function enginePartialLine(date: string): string {
  return `Some checks failed on ${date}`
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

// Expanded panel, error cell
export function panelNotAnswering(since: string): string { return `Not answering since ${since}` }
export function panelLastResult(date: string): string { return `Last result, ${date}:` }

// Fix This: done, re-check and next fixes (docs/arch/fix-states.md)
export const FIX_COPY = {
  explainer: 'Copy each recommended fix and apply it to your site or content. Mark it done when you have, and we check the number after a later collection. P0 items move your score the most.',
  markDone: 'Mark as done',
  dismiss: 'Not for us',
  reopen: 'Reopen',
  restore: 'Restore',
  checkNow: 'Check now',
  doneHeading: 'Done',
  allDone: 'All current fixes are done. New ones appear here as your results change.',
  manual: 'Marked done. This one cannot be measured, so there is nothing to check.',
  untracked: 'The prompt or engine this fix measured is no longer tracked, so it cannot be checked.',
  saveFailed: 'Could not save that change. Please try again.',
  promptGapFix: 'Publish a page that answers this question directly, with your brand name in the title and the H1, and link it from your main service page. Ask one trusted publication or directory in your field to reference it.',
}

export function fixDoneWaiting(markedOn: string, readyAfter: string): string {
  return `Marked done ${markedOn}. We check the number on the first collection after ${readyAfter}.`
}
export function fixDoneWaitingData(markedOn: string, fresh: number, needed: number): string {
  return `Marked done ${markedOn}. Waiting for newer answers: ${fresh} of ${needed} needed so far.`
}
export function fixVerifiedLine(on: string, metric: string, before: number, after: number): string {
  return `Verified ${on}: ${metric} went from ${before}% to ${after}%.`
}
export function fixReopenedLine(markedOn: string, checkedOn: string, metric: string, before: number, after: number): string {
  return `You marked this done ${markedOn}. After the answers collected by ${checkedOn}, ${metric} is ${after}% (was ${before}%). Mark it done again once you have changed more.`
}
export function fixDismissedLine(on: string): string {
  return `Set aside ${on}.`
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
export function fixMarkedOn(on: string): string {
  return `Marked done ${on}.`
}
/** Screen reader announcement when a fix leaves or returns to the open list. */
export function fixMovedAnnouncement(status: 'done' | 'dismissed' | 'open', title: string): string {
  if (status === 'done') return `Marked as done: ${title}. Moved to the Done list.`
  if (status === 'dismissed') return `Set aside: ${title}. Moved to the Done list.`
  return `Back in the list: ${title}.`
}
