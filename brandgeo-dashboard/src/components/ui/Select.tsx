/** Select (spec 7.4): native select, 40 high, surface-2 with an edge border. */
import { forwardRef, type SelectHTMLAttributes } from 'react'
import { cx } from './cx'

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement>

const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select({ className, children, ...rest }, ref) {
  return (
    <select
      ref={ref}
      className={cx(
        'h-10 rounded-control bg-surface-2 border border-edge px-3 text-body text-ink',
        'hover:border-line-2 transition-colors duration-[180ms] ease-out',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        className,
      )}
      {...rest}
    >
      {children}
    </select>
  )
})

export default Select
