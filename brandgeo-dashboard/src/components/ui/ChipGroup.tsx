/** ChipGroup (spec 7.4): a labelled row of Chips that wraps. */
import type { ReactNode } from 'react'

export interface ChipGroupProps {
  label: string
  children: ReactNode
}

export default function ChipGroup({ label, children }: ChipGroupProps) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap items-center gap-2">
      {children}
    </div>
  )
}
