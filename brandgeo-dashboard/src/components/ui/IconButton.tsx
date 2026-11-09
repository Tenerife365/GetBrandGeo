/** IconButton (spec 7.4): 32 visible, 44 hit below 768. `label` becomes the aria-label. */
import type { ButtonHTMLAttributes } from 'react'
import type { LucideIcon } from 'lucide-react'
import { cx } from './cx'

export interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'aria-label' | 'children'> {
  label: string
  icon: LucideIcon
  variant?: 'secondary' | 'ghost'
}

export default function IconButton({ label, icon: Icon, variant = 'ghost', className, type = 'button', ...rest }: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={cx(
        'relative inline-flex items-center justify-center w-8 h-8 rounded-control',
        'after:absolute after:-inset-1.5 after:content-[""] md:after:hidden',
        'transition-colors duration-[180ms] disabled:opacity-50 disabled:pointer-events-none',
        variant === 'secondary'
          ? 'bg-surface-2 border border-edge text-ink hover:bg-surface-3'
          : 'text-ink-2 hover:bg-surface-2 hover:text-ink',
        className,
      )}
      {...rest}
    >
      <Icon size={16} aria-hidden="true" />
    </button>
  )
}
