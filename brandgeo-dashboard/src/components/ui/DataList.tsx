/**
 * DataList (spec 7.3): divide-y rows, padding 12/16, min height 56, hover
 * surface-2. Row actions sit ink-3 until hover or focus-within (add the
 * `row-actions` class to the wrapper of the action buttons).
 *
 * Extra optional prop beyond the frozen contract: `getKey` for a stable React
 * key. Without it the index is used.
 */
import type { ReactNode } from 'react'

export interface DataListProps<T> {
  rows: T[]
  renderRow: (row: T, index: number) => ReactNode
  getKey?: (row: T, index: number) => string | number
  /** Accessible name for the list. */
  ariaLabel?: string
}

export default function DataList<T>({ rows, renderRow, getKey, ariaLabel }: DataListProps<T>) {
  return (
    <ul aria-label={ariaLabel} className="divide-y divide-line rounded-card border border-line bg-surface shadow-card overflow-hidden">
      {rows.map((row, i) => (
        <li
          key={getKey ? getKey(row, i) : i}
          className="group min-h-[56px] px-4 py-3 flex items-center gap-3 hover:bg-surface-2 transition-colors duration-[180ms] ease-out [&_.row-actions]:text-ink-3 [&_.row-actions]:transition-colors hover:[&_.row-actions]:text-ink focus-within:[&_.row-actions]:text-ink"
        >
          {renderRow(row, i)}
        </li>
      ))}
    </ul>
  )
}
