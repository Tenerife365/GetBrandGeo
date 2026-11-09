/**
 * SegmentedControl (spec 7.4): role=radiogroup, arrow keys move and select.
 * Segment 28 high, 44 hit area below 768. Track bg-surface-2 with a 1 px line;
 * pressed = bg-surface + 1 px edge border + shadow-raised (edge on surface-2 is
 * 3.30 dark / 3.34 light, so the pressed segment reaches 3:1 against the track),
 * with a 180 ms colour transition.
 *
 * Bundle: Layout renders this on every route, so it imports nothing from
 * motion. A sliding layoutId indicator pulled motion-dom and framer-motion
 * (about 128 kB) into the entry chunk on 2026-11-09, so the slide was dropped
 * for a CSS transition.
 */
import { useRef, type KeyboardEvent } from 'react'
import { cx } from './cx'

export interface SegmentedOption<V extends string = string> {
  value: V
  label: string
}

export interface SegmentedControlProps<V extends string = string> {
  options: SegmentedOption<V>[]
  value: V
  onChange: (value: V) => void
  ariaLabel: string
  className?: string
}

export default function SegmentedControl<V extends string = string>({ options, value, onChange, ariaLabel, className }: SegmentedControlProps<V>) {
  const refs = useRef<(HTMLButtonElement | null)[]>([])

  const move = (from: number, delta: number) => {
    const next = (from + delta + options.length) % options.length
    onChange(options[next].value)
    refs.current[next]?.focus()
  }
  const onKey = (e: KeyboardEvent, i: number) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); move(i, 1) }
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); move(i, -1) }
  }

  return (
    <div role="radiogroup" aria-label={ariaLabel} className={cx('inline-flex items-center gap-0.5 rounded-control border border-line bg-surface-2 p-0.5', className)}>
      {options.map((o, i) => {
        const on = o.value === value
        return (
          <button
            key={o.value}
            ref={el => { refs.current[i] = el }}
            type="button"
            role="radio"
            aria-checked={on}
            tabIndex={on ? 0 : -1}
            onClick={() => onChange(o.value)}
            onKeyDown={e => onKey(e, i)}
            className={cx(
              'relative h-7 max-md:min-h-[44px] max-md:flex-1 px-3 rounded-badge border text-meta whitespace-nowrap transition-[color,background-color,box-shadow] duration-[180ms] ease-out motion-reduce:transition-none',
              on ? 'text-ink font-semibold bg-surface border-edge shadow-raised' : 'border-transparent text-ink-2 hover:text-ink',
            )}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}
