/**
 * Combobox: WAI-ARIA 1.2 editable combobox with a listbox popup. A text input
 * that filters a fixed option list as you type, so a long list (markets,
 * regions) is reached with the keyboard instead of by scrolling.
 *
 * Focus or click opens the list with every option and selects the input text,
 * so the first key typed replaces it and filtering starts at once. Arrow keys
 * move the active option (wrapping), Home and End jump, Enter selects, Escape
 * closes and restores the label. Leaving the field (Tab, click elsewhere)
 * commits typed text only when it names exactly one option, otherwise restores
 * the label: the value is always one of the options, never free text.
 * The list takes mousedown with preventDefault so the input keeps focus, and
 * options select on click, which also covers a tap on a phone.
 *
 * clearOnSelect turns it into a picker: after a choice the field is empty again
 * and shows the placeholder (the sidebar "Add market").
 *
 * Bundle: Layout renders this on every route, so it imports nothing from
 * motion or framer-motion, and nothing here animates.
 */
import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import { cx } from './cx'
import { filterComboboxOptions, normalizeForSearch } from '../../lib/comboboxFilter'

export interface ComboboxOption {
  value:     string
  label:     string
  keywords?: string[]
  icon?:     ReactNode
}

export interface ComboboxProps {
  options:         ComboboxOption[]
  value:           string | null
  onChange:        (value: string) => void
  ariaLabel?:      string
  id?:             string
  placeholder?:    string
  size?:           'md' | 'sm'
  placement?:      'bottom' | 'top'
  clearOnSelect?:  boolean
  emptyText?:      string
  className?:      string
}

export default function Combobox({
  options, value, onChange, ariaLabel, id, placeholder, size = 'md', placement = 'bottom',
  clearOnSelect = false, emptyText = 'No match', className,
}: ComboboxProps) {
  const uid = useId()
  const inputId = id ?? `${uid}-input`
  const listId = `${uid}-list`
  const optionId = (i: number) => `${uid}-opt-${i}`

  const [open, setOpen] = useState(false)
  // null = the user has not typed since opening, so the field shows the label.
  const [query, setQuery] = useState<string | null>(null)
  const [activeIdx, setActiveIdx] = useState(-1)

  const selected = clearOnSelect ? undefined : options.find(o => o.value === value)
  const filtered = filterComboboxOptions(options, query ?? '')
  const active = open && activeIdx >= 0 && activeIdx < filtered.length ? activeIdx : -1
  const shown = query ?? (selected ? selected.label : '')
  const showIcon = !!selected?.icon && query === null

  // Keep the active option visible by scrolling the LIST only. scrollIntoView
  // would also scroll every ancestor, including the overflow-hidden app shell,
  // which the user then cannot scroll back.
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

  const selectedIndex = () => {
    const i = options.findIndex(o => o.value === value)
    return clearOnSelect ? -1 : i
  }

  const openList = (activeStart?: number) => {
    setOpen(true)
    setActiveIdx(activeStart ?? selectedIndex())
  }

  const close = () => {
    setOpen(false)
    setQuery(null)
    setActiveIdx(-1)
  }

  const inputRef = useRef<HTMLInputElement>(null)
  // True from the mousedown that gives the field focus until its mouseup: the
  // browser places a caret on that mouseup, which would collapse the selection
  // made on focus, so that one mouseup is cancelled.
  const focusedByMouse = useRef(false)

  // Select the whole label, so the next key replaces it instead of appending.
  const selectAll = () => {
    const el = inputRef.current
    if (!el) return
    try { el.setSelectionRange(0, el.value.length) } catch { el.select() }
  }

  const choose = (o: ComboboxOption) => {
    onChange(o.value)
    close()
    // Focus stays in the field after a choice: once the new label has rendered,
    // select it, so typing again starts a fresh search.
    if (!clearOnSelect) {
      requestAnimationFrame(() => {
        if (document.activeElement === inputRef.current) selectAll()
      })
    }
  }

  // Leaving the field with typed text: commit it only when it names exactly one
  // option (a single match, or a label typed in full). Anything else restores
  // the label. The picker never commits on leave, it would add a market unasked.
  const leave = () => {
    focusedByMouse.current = false
    if (!clearOnSelect && query !== null && query.trim()) {
      const q = normalizeForSearch(query)
      const exact = filtered.find(o => normalizeForSearch(o.label) === q)
      const only = filtered.length === 1 ? filtered[0] : undefined
      const hit = exact ?? only
      if (hit && hit.value !== value) { onChange(hit.value); close(); return }
    }
    close()
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
        if (!open) { setOpen(true); setActiveIdx(Math.max(selectedIndex(), 0)) }
        else move(1)
        break
      case 'ArrowUp':
        e.preventDefault()
        if (!open) { setOpen(true); setActiveIdx(Math.max(selectedIndex(), 0)) }
        else move(-1)
        break
      case 'Home':
        if (open && filtered.length > 0) { e.preventDefault(); setActiveIdx(0) }
        break
      case 'End':
        if (open && filtered.length > 0) { e.preventDefault(); setActiveIdx(filtered.length - 1) }
        break
      case 'Enter':
        if (open && active >= 0) { e.preventDefault(); choose(filtered[active]) }
        break
      case 'Escape':
        if (open) {
          // Closing the list is this key's whole job: do not let it reach the
          // document-level handler that closes the mobile drawer behind it.
          e.preventDefault()
          e.nativeEvent.stopPropagation()
          close()
        }
        break
      case 'Tab':
        // Blur follows and does the leaving; nothing to do here.
        break
    }
  }

  return (
    <div className={cx('relative', className)}>
      {showIcon && (
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 flex items-center">{selected?.icon}</span>
      )}
      <input
        id={inputId}
        type="text"
        role="combobox"
        aria-label={ariaLabel}
        aria-autocomplete="list"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-activedescendant={active >= 0 ? optionId(active) : undefined}
        autoComplete="off"
        spellCheck={false}
        value={shown}
        placeholder={placeholder}
        ref={inputRef}
        onMouseDown={() => { focusedByMouse.current = document.activeElement !== inputRef.current }}
        onMouseUp={e => {
          if (focusedByMouse.current && query === null) { e.preventDefault(); selectAll() }
          focusedByMouse.current = false
        }}
        onFocus={() => { openList(); selectAll() }}
        onClick={() => { if (!open) { openList(); if (query === null) selectAll() } }}
        onBlur={leave}
        onChange={e => {
          const v = e.target.value
          setQuery(v)
          setOpen(true)
          setActiveIdx(v.trim() ? 0 : -1)
        }}
        onKeyDown={onKeyDown}
        className={cx(
          'w-full rounded-control bg-surface-2 border border-edge text-ink placeholder:text-ink-3 truncate',
          'hover:border-line-2 transition-colors duration-[180ms] ease-out motion-reduce:transition-none',
          size === 'md' ? 'h-10 text-body' : 'h-7 text-xs',
          // 16 px on a phone: iOS Safari zooms the page into any smaller field.
          'max-md:min-h-[44px] max-md:text-base',
          showIcon ? 'pl-10' : 'pl-3',
          size === 'md' ? 'pr-9' : 'pr-7',
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
            const isSel = !clearOnSelect && o.value === value
            return (
              <li
                key={o.value}
                id={optionId(i)}
                role="option"
                aria-selected={isSel}
                onClick={() => choose(o)}
                onMouseMove={() => { if (activeIdx !== i) setActiveIdx(i) }}
                className={cx(
                  'flex items-center gap-2 px-3 min-h-9 max-md:min-h-[44px] cursor-pointer text-body',
                  i === active ? 'bg-surface-2 text-ink' : 'text-ink-2',
                )}
              >
                {o.icon}
                <span className="flex-1 truncate">{o.label}</span>
                {isSel && <Check size={14} aria-hidden="true" className="flex-shrink-0 text-accent-ink" />}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
