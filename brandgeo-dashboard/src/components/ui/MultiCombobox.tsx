/**
 * MultiCombobox: WAI-ARIA 1.2 editable combobox with a multiselectable listbox
 * and removable chips (docs/design/multi-location-ui section 4). It follows the
 * single Combobox in focus, Escape and scroll conventions.
 *
 * Enter or a click toggles an option and keeps the list open, and the query is
 * kept. Backspace on an empty input removes the last chip. Leaving the field
 * closes the list and clears the query: typed text is never committed.
 * `exclusiveValue` (for example "ALL") replaces every other pick when chosen
 * and is removed when another option is chosen.
 *
 * Bundle: Layout renders this, so it imports nothing from motion.
 */
import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'
import { Check, ChevronDown, X } from 'lucide-react'
import { cx } from './cx'
import { filterComboboxOptions } from '../../lib/comboboxFilter'
import type { ComboboxOption } from './Combobox'

export interface MultiComboboxProps {
  options:          ComboboxOption[]
  values:           string[]
  onChange:         (values: string[]) => void
  ariaLabel?:       string
  id?:              string
  placeholder?:     string
  size?:            'md' | 'sm'
  placement?:       'bottom' | 'top'
  emptyText?:       string
  className?:       string
  /** Choosing this value replaces every other pick; choosing another removes it. */
  exclusiveValue?:  string
  /** Options that cannot be picked, with the reason shown inside the option. */
  disabledReasons?: Record<string, string>
  /** Most picks allowed. Unselected options are disabled past it. */
  maxSelected?:     number
  maxReason?:       string
  /** Chips shown while the list is closed before the rest collapse into "+N". */
  maxChips?:        number
  /** Sets aria-invalid and the negative border. The caller renders the error line. */
  invalid?:         boolean
  /** Id of the caller's helper or error line, read together with the selection summary. */
  describedBy?:     string
}

export default function MultiCombobox({
  options, values, onChange, ariaLabel, id, placeholder, size = 'md', placement = 'bottom',
  emptyText = 'No match', className, exclusiveValue, disabledReasons, maxSelected, maxReason = 'Limit reached',
  maxChips = 3, invalid, describedBy,
}: MultiComboboxProps) {
  const uid = useId()
  const inputId = id ?? `${uid}-input`
  const listId = `${uid}-list`
  const sumId = `${uid}-sum`
  const optionId = (i: number) => `${uid}-opt-${i}`

  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [activeIdx, setActiveIdx] = useState(-1)
  const [announce, setAnnounce] = useState('')

  const filtered = filterComboboxOptions(options, query)
  const active = open && activeIdx >= 0 && activeIdx < filtered.length ? activeIdx : -1
  const labelOf = (v: string) => options.find(o => o.value === v)?.label ?? v
  const atMax = typeof maxSelected === 'number' && values.length >= maxSelected

  const disabledReason = (o: ComboboxOption): string | null => {
    const r = disabledReasons?.[o.value]
    if (r) return r
    if (atMax && !values.includes(o.value)) return maxReason
    return null
  }

  useEffect(() => {
    if (active < 0) return
    const el = document.getElementById(`${uid}-opt-${active}`)
    const list = el?.parentElement
    if (!el || !list) return
    if (el.offsetTop < list.scrollTop) list.scrollTop = el.offsetTop
    else if (el.offsetTop + el.offsetHeight > list.scrollTop + list.clientHeight) {
      list.scrollTop = el.offsetTop + el.offsetHeight - list.clientHeight
    }
  }, [active, uid])

  const inputRef = useRef<HTMLInputElement>(null)
  const chipRefs = useRef<Record<string, HTMLButtonElement | null>>({})
  // Where focus goes once the removed chip is gone: a chip value, or '' for the input.
  const pendingFocus = useRef<string | null>(null)

  useEffect(() => {
    const p = pendingFocus.current
    if (p === null) return
    pendingFocus.current = null
    const el = p !== '' ? chipRefs.current[p] : null
    ;(el ?? inputRef.current)?.focus()
  }, [values])

  const close = () => { setOpen(false); setQuery(''); setActiveIdx(-1) }

  const remove = (v: string) => {
    onChange(values.filter(x => x !== v))
    setAnnounce(`Removed ${labelOf(v)}`)
  }

  /** Removing a chip moves focus to the next chip, else the previous one, else the input. */
  const removeChip = (v: string) => {
    const i = values.indexOf(v)
    const rest = values.filter(x => x !== v)
    pendingFocus.current = rest[i] ?? rest[i - 1] ?? ''
    remove(v)
  }

  const toggle = (o: ComboboxOption) => {
    if (disabledReason(o)) return
    if (values.includes(o.value)) { remove(o.value); return }
    if (exclusiveValue !== undefined && o.value === exclusiveValue) {
      onChange([o.value])
      setAnnounce(values.length > 0 ? 'All regions replaces the regions you picked' : `Added ${o.label}`)
      return
    }
    const next = exclusiveValue !== undefined ? values.filter(x => x !== exclusiveValue) : values.slice()
    next.push(o.value)
    onChange(next)
    setAnnounce(`Added ${o.label}`)
  }

  const move = (delta: number) => {
    const n = filtered.length
    if (n === 0) return
    if (active < 0) setActiveIdx(delta > 0 ? 0 : n - 1)
    else setActiveIdx((active + delta + n) % n)
  }

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        if (!open) { setOpen(true); setActiveIdx(0) } else move(1)
        break
      case 'ArrowUp':
        e.preventDefault()
        if (!open) { setOpen(true); setActiveIdx(0) } else move(-1)
        break
      case 'Home':
        if (open && filtered.length > 0) { e.preventDefault(); setActiveIdx(0) }
        break
      case 'End':
        if (open && filtered.length > 0) { e.preventDefault(); setActiveIdx(filtered.length - 1) }
        break
      case 'Enter':
        if (open && active >= 0) { e.preventDefault(); toggle(filtered[active]) }
        break
      case 'Backspace':
        if (query === '' && values.length > 0) { e.preventDefault(); remove(values[values.length - 1]) }
        break
      case 'Escape':
        if (open) {
          e.preventDefault()
          e.nativeEvent.stopPropagation()
          close()
        }
        break
    }
  }

  const shownChips = open ? values : values.slice(0, maxChips)
  const hiddenCount = values.length - shownChips.length

  return (
    <div className={cx('relative', className)}>
      <span id={sumId} className="sr-only">{values.length > 0 ? `${values.length} selected` : 'None selected'}</span>
      <span role="status" aria-live="polite" className="sr-only">{announce}</span>
      {values.length > 0 && (
        <ul
          role="list"
          aria-label={ariaLabel ? `Selected: ${ariaLabel}` : 'Selected'}
          className="flex flex-wrap gap-x-1 gap-y-1 max-md:gap-y-3 mb-1 max-md:mb-3"
        >
          {shownChips.map(v => (
            <li key={v} className="min-w-0">
              <button
                type="button"
                ref={el => { chipRefs.current[v] = el }}
                onClick={() => removeChip(v)}
                onKeyDown={e => {
                  if (e.key === 'Backspace' || e.key === 'Delete') { e.preventDefault(); removeChip(v) }
                }}
                aria-label={`Remove ${labelOf(v)}`}
                className={cx(
                  'relative inline-flex items-center justify-center gap-1 max-w-full rounded-badge bg-surface-2 border border-edge text-ink-2 hover:text-ink transition-colors',
                  size === 'md' ? 'h-7 px-2 text-xs' : 'h-6 px-1.5 text-meta',
                  // Phone: 32 px chip plus a 6 px vertical extension each side is 44 px, no horizontal extension, rows 12 px apart.
                  'max-md:h-8 max-md:min-w-[44px] max-md:after:absolute max-md:after:content-[\'\'] max-md:after:inset-x-0 max-md:after:-inset-y-1.5',
                )}
              >
                <span className="truncate">{labelOf(v)}</span>
                <X size={12} aria-hidden="true" className="flex-shrink-0" />
              </button>
            </li>
          ))}
          {hiddenCount > 0 && (
            <li><span className={cx('inline-flex items-center text-ink-3', size === 'md' ? 'h-7 text-xs' : 'h-6 text-meta')}>+{hiddenCount}</span></li>
          )}
        </ul>
      )}
      <div className="relative">
        <input
          id={inputId}
          type="text"
          role="combobox"
          aria-label={ariaLabel}
          aria-describedby={describedBy ? `${sumId} ${describedBy}` : sumId}
          aria-invalid={invalid ? true : undefined}
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={open ? listId : undefined}
          aria-activedescendant={active >= 0 ? optionId(active) : undefined}
          autoComplete="off"
          spellCheck={false}
          value={query}
          placeholder={placeholder}
          ref={inputRef}
          onFocus={() => { setOpen(true); setActiveIdx(-1) }}
          onClick={() => { if (!open) { setOpen(true); setActiveIdx(-1) } }}
          onBlur={close}
          onChange={e => {
            const v = e.target.value
            setQuery(v)
            setOpen(true)
            setActiveIdx(v.trim() ? 0 : -1)
          }}
          onKeyDown={onKeyDown}
          className={cx(
            'w-full rounded-control bg-surface-2 border text-ink placeholder:text-ink-3 truncate pl-3',
            invalid ? 'border-neg' : 'border-edge hover:border-line-2',
            'transition-colors duration-[180ms] ease-out motion-reduce:transition-none',
            size === 'md' ? 'h-10 text-body pr-9' : 'h-7 text-xs pr-7',
            'max-md:min-h-[44px] max-md:text-base',
          )}
        />
        <ChevronDown
          size={size === 'md' ? 16 : 12}
          aria-hidden="true"
          className={cx('pointer-events-none absolute top-1/2 -translate-y-1/2 text-ink-3', size === 'md' ? 'right-3' : 'right-2')}
        />
        {open && (
          <ul
            id={listId}
            role="listbox"
            aria-multiselectable="true"
            aria-label={ariaLabel}
            onMouseDown={e => e.preventDefault()}
            className={cx(
              'absolute left-0 right-0 z-50 max-h-64 overflow-y-auto bg-surface border border-line-2 rounded-control shadow-raised',
              placement === 'top' ? 'bottom-full mb-1' : 'top-full mt-1',
            )}
          >
            {filtered.length === 0 ? (
              <li role="option" aria-disabled="true" aria-selected="false" className="px-3 py-2 text-body text-ink-3 select-none">{emptyText}</li>
            ) : filtered.map((o, i) => {
              const isSel = values.includes(o.value)
              const reason = disabledReason(o)
              return (
                <li
                  key={o.value}
                  id={optionId(i)}
                  role="option"
                  aria-selected={isSel}
                  aria-disabled={reason ? true : undefined}
                  onClick={() => toggle(o)}
                  onMouseMove={() => { if (activeIdx !== i) setActiveIdx(i) }}
                  className={cx(
                    'flex items-center gap-2 px-3 min-h-9 max-md:min-h-[44px] text-body',
                    reason ? 'cursor-not-allowed text-ink-3' : 'cursor-pointer',
                    !reason && (i === active ? 'bg-surface-2 text-ink' : 'text-ink-2'),
                    reason && i === active ? 'bg-surface-2' : '',
                  )}
                >
                  {o.icon}
                  <span className="flex-1 truncate">{o.label}</span>
                  {reason && <span className="text-meta text-ink-3 flex-shrink-0">{reason}</span>}
                  {isSel && !reason && <Check size={14} aria-hidden="true" className="flex-shrink-0 text-accent-ink" />}
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
