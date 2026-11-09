/** Button (spec 7.4). Five variants, two sizes; below 768 the hit area is at least 44. */
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { Loader2, type LucideIcon } from 'lucide-react'
import { cx } from './cx'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'tertiary' | 'danger'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant: ButtonVariant
  size?: 'md' | 'sm'
  icon?: LucideIcon
  loading?: boolean
  children?: ReactNode
}

/** Shared skin so a Link or anchor can wear a button (used by EmptyState). */
export function buttonClasses(variant: ButtonVariant, size: 'md' | 'sm' = 'md'): string {
  return cx(
    'inline-flex items-center justify-center gap-2 rounded-control font-medium whitespace-nowrap select-none',
    'transition-colors duration-[180ms] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none',
    size === 'md' ? 'h-9 px-3.5 text-body max-md:min-h-[44px]' : 'h-7 px-2.5 text-meta max-md:min-h-[44px]',
    variant === 'primary' && 'bg-accent-strong text-on-accent hover:bg-accent-strong-hover',
    variant === 'secondary' && 'bg-surface-2 border border-edge text-ink hover:bg-surface-3',
    variant === 'ghost' && 'text-ink-2 hover:bg-surface-2 hover:text-ink',
    variant === 'tertiary' && 'text-accent-ink hover:underline underline-offset-2',
    variant === 'danger' && 'bg-surface-2 border border-edge text-neg hover:bg-surface-3',
  )
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant, size = 'md', icon: Icon, loading = false, className, children, disabled, type = 'button', ...rest },
  ref,
) {
  const iconSize = size === 'md' ? 16 : 14
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cx(buttonClasses(variant, size), className)}
      {...rest}
    >
      {loading ? (
        <Loader2 size={iconSize} aria-hidden="true" className="animate-spin motion-reduce:animate-none" />
      ) : (
        Icon && <Icon size={iconSize} aria-hidden="true" />
      )}
      {children}
    </button>
  )
})

export default Button
