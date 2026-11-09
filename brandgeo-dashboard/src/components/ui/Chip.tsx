/**
 * Chip (spec 7.4): 28 high (32 below 768), aria-pressed, selected = accent-tint with accent-ink border and a 12 px check.
 * Below 768 the hit area is 44 high via an inset pseudo-element (spec 13.3); the visual stays 32.
 */
import type { ReactNode } from 'react'
import { Check } from 'lucide-react'
import { cx } from './cx'

export interface ChipProps {
  selected: boolean
  count?: number
  /** Any CSS colour, drawn as an 8 px dot (engine identity). */
  swatch?: string
  onClick: () => void
  disabled?: boolean
  children?: ReactNode
}

export default function Chip({ selected, count, swatch, onClick, disabled, children }: ChipProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      disabled={disabled}
      onClick={onClick}
      className={cx(
        'relative inline-flex items-center gap-1.5 h-8 md:h-7 px-2.5 rounded-badge border text-meta whitespace-nowrap transition-colors duration-[180ms] ease-out',
        'after:absolute after:-inset-1.5 md:after:hidden after:content-[""]',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        selected
          ? 'bg-accent-tint border-accent-ink text-accent-ink'
          : 'bg-surface border-edge text-ink-2 hover:bg-surface-2 hover:text-ink',
      )}
    >
      {selected ? (
        <Check size={12} aria-hidden="true" />
      ) : (
        swatch && <span aria-hidden="true" className="inline-block h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: swatch }} />
      )}
      <span>{children}</span>
      {count !== undefined && <span className="tabular-nums text-ink-3">{count}</span>}
    </button>
  )
}
