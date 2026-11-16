import { useState, useRef, useEffect, type KeyboardEvent as ReactKeyboardEvent } from 'react'
import { ChevronDown, Building2 } from 'lucide-react'
import { useClient } from '../lib/clientContext'
import { useI18n } from '../lib/i18nContext'
import BrandLogo from './BrandLogo'
import Combobox from './ui/Combobox'

// Non-admin brand switcher (agency spec 6.2). Loaded lazily by Layout so the
// Combobox and the listbox code stay out of the entry chunk. Imports nothing
// from `motion`. Owns its own open state, refs, outside-click and Escape close.
export default function BrandSwitcher() {
  const { activeClientId, activeClient, setActiveClientId, clients } = useClient()
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  const [brandIdx, setBrandIdx] = useState(0)
  const rootRef = useRef<HTMLDivElement>(null)
  const btnRef = useRef<HTMLButtonElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  // Focus moves after the commit that unmounts the option which was picked.
  const pendingFocus = useRef(false)

  useEffect(() => {
    if (!pendingFocus.current) return
    pendingFocus.current = false
    btnRef.current?.focus()
  })

  // Focus the list on open and keep the active option in view with scrollTop on
  // the list only, never scrollIntoView (it scrolls the app shell).
  useEffect(() => {
    const list = listRef.current
    if (!open || !list) return
    list.focus()
    const el = list.children[brandIdx] as HTMLElement | undefined
    if (!el) return
    if (el.offsetTop < list.scrollTop) list.scrollTop = el.offsetTop
    else if (el.offsetTop + el.offsetHeight > list.scrollTop + list.clientHeight) list.scrollTop = el.offsetTop + el.offsetHeight - list.clientHeight
  }, [open, brandIdx])

  useEffect(() => {
    if (!open) return
    function onPointerDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [open])

  // Escape closes the list only. Handled here, not on the document, and stopped,
  // so the Layout handler that closes the mobile drawer does not fire as well
  // (the same rule as ui/Combobox).
  const onEscape = (e: ReactKeyboardEvent) => {
    if (e.key !== 'Escape' || !open) return
    e.preventDefault()
    e.nativeEvent.stopPropagation()
    setOpen(false)
    pendingFocus.current = true
  }

  const cur = Math.max(0, clients.findIndex(c => c.id === activeClientId))
  const openList = (idx: number) => { setBrandIdx(idx); setOpen(true) }
  const pick = (id: number) => { setActiveClientId(id); setOpen(false); pendingFocus.current = true }

  return (
    <div className="mx-2 my-1.5 px-2 py-2.5 flex-shrink-0 sidebar-well" data-brand-switcher>
      {/* copy: pending bg-copy */}
      <div className="label-caps px-1 mb-1.5">Brand</div>
      {clients.length > 8 ? (
        <Combobox
          size="sm"
          placement="top"
          ariaLabel="Switch brand" /* copy: pending bg-copy */
          placeholder="Search brands" /* copy: pending bg-copy */
          options={clients.map(c => ({ value: String(c.id), label: c.name }))}
          value={String(activeClientId)}
          onChange={v => { setActiveClientId(Number(v)) }}
        />
      ) : (
        <div className="relative" ref={rootRef} onKeyDown={onEscape}>
          <button
            ref={btnRef}
            onClick={() => open ? setOpen(false) : openList(cur)}
            onKeyDown={e => { if (e.key === 'ArrowDown' && !open) { e.preventDefault(); openList(cur) } }}
            className="side-row font-medium text-ink aria-expanded:bg-surface-3 min-h-[44px] sm:min-h-0"
            aria-haspopup="listbox"
            aria-expanded={open}
            aria-controls="brand-switcher-list"
          >
            <BrandLogo name={activeClient?.name ?? '?'} website={activeClient?.brand_website} sizeClass="w-5 h-5" roundedClass="rounded-md" textClass="text-meta" />
            <span className="flex-1 text-left truncate">{activeClient?.name ?? t.sidebar_selectClient}</span>
            <ChevronDown size={13} className="text-ink-3 flex-shrink-0" />
          </button>
          {open && (
            <div
              id="brand-switcher-list"
              ref={listRef}
              role="listbox"
              tabIndex={0}
              aria-label="Switch brand" /* copy: pending bg-copy */
              aria-activedescendant={`brand-opt-${clients[brandIdx]?.id}`}
              onKeyDown={e => {
                const n = clients.length
                if (e.key === 'ArrowDown') { e.preventDefault(); setBrandIdx(i => (i + 1) % n) }
                else if (e.key === 'ArrowUp') { e.preventDefault(); setBrandIdx(i => (i + n - 1) % n) }
                else if (e.key === 'Home') { e.preventDefault(); setBrandIdx(0) }
                else if (e.key === 'End') { e.preventDefault(); setBrandIdx(n - 1) }
                else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (clients[brandIdx]) pick(clients[brandIdx].id) }
                else if (e.key === 'Tab') setOpen(false)
              }}
              className="absolute bottom-full left-0 right-0 mb-1 bg-surface border border-line-2 rounded-control shadow-raised z-50 max-h-72 overflow-y-auto"
            >
              {clients.map((c, i) => (
                <div key={c.id}
                  id={`brand-opt-${c.id}`}
                  role="option"
                  aria-selected={c.id === activeClientId}
                  onClick={() => pick(c.id)}
                  className={`flex items-center gap-2 w-full px-3 py-2 text-sm cursor-pointer min-h-[44px] sm:min-h-0 ${c.id === activeClientId ? 'text-accent-ink bg-accent-tint' : i === brandIdx ? 'text-ink bg-surface-2' : 'text-ink-2 hover:bg-surface-2 hover:text-ink'}`}
                >
                  <Building2 size={12} className="flex-shrink-0" />
                  <span className="truncate">{c.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
