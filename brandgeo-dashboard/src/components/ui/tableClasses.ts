/**
 * tableClasses (spec 7.3, Phase 4 C1): class strings for a real <table>. Head
 * cells 36 high and sticky (blurred surface-2), body rows 44 with a line rule.
 * Use `th scope="col"`.
 */
export const tableClasses = {
  wrap: 'overflow-x-auto lg:overflow-x-clip lg:overflow-y-visible rounded-card border border-line bg-surface shadow-card',
  table: 'w-full border-collapse text-body text-ink',
  thead: '',
  th: 'table-head-sticky h-9 px-4 text-left label-caps whitespace-nowrap',
  thRight: 'table-head-sticky h-9 px-4 text-right label-caps whitespace-nowrap',
  tr: 'border-b border-line last:border-b-0 hover:bg-surface-2 transition-colors duration-[180ms] ease-out motion-reduce:transition-none',
  td: 'h-11 px-4 align-middle text-body text-ink',
  tdRight: 'h-11 px-4 align-middle text-body text-ink text-right tabular-nums',
  tdMuted: 'h-11 px-4 align-middle text-body text-ink-2',
} as const

export default tableClasses
