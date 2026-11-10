/**
 * Card: the one surface. Spec 7 / 4.7. Dark carries depth by surface step (no
 * shadow), light by --shadow-card. `interactive` adds a hover surface step and
 * is the only variant that may react to the pointer.
 */
import type { HTMLAttributes, ReactNode } from 'react'
import { cx } from './cx'

export type CardPad = 'none' | 'compact' | 'standard' | 'feature'

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  pad?: CardPad
  interactive?: boolean
  children?: ReactNode
}

const PAD: Record<CardPad, string> = {
  none: '',
  compact: 'p-4',
  standard: 'p-5',
  feature: 'p-5 md:p-6',
}

export default function Card({ pad = 'standard', interactive = false, className, children, ...rest }: CardProps) {
  return (
    <div
      className={cx(
        'bg-surface border border-line rounded-card shadow-card transition-colors duration-[180ms] ease-out hover:border-line-2 motion-reduce:transition-none',
        PAD[pad],
        interactive && 'hover:bg-surface-2',
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  )
}
