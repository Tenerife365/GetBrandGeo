/**
 * tableClasses (spec 7.3): class strings for a real <table>. Head row 36 high
 * on surface-2, body rows min 48 with a line rule. Use `th scope="col"`.
 */
export const tableClasses = {
  wrap: 'overflow-x-auto rounded-card border border-line bg-surface shadow-card',
  table: 'w-full border-collapse text-body text-ink',
  thead: 'bg-surface-2',
  th: 'h-9 px-4 text-left text-meta font-semibold text-ink-2 whitespace-nowrap border-b border-line',
  thRight: 'h-9 px-4 text-right text-meta font-semibold text-ink-2 whitespace-nowrap border-b border-line',
  tr: 'border-b border-line last:border-b-0 hover:bg-surface-2 transition-colors duration-[180ms] ease-out',
  td: 'min-h-[48px] h-12 px-4 align-middle text-body text-ink',
  tdRight: 'min-h-[48px] h-12 px-4 align-middle text-body text-ink text-right tabular-nums',
  tdMuted: 'min-h-[48px] h-12 px-4 align-middle text-body text-ink-2',
} as const

export default tableClasses
