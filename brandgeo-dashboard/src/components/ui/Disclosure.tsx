/**
 * Disclosure (spec 7.4): a button inside an h2, min 48 high, aria-expanded and
 * aria-controls, body in Collapse. Closed state shows the summary line.
 */
import { useId, useState, type ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'
import Collapse from '../Collapse'
import Badge from './Badge'
import { cx } from './cx'

export interface DisclosureProps {
  title: ReactNode
  count?: number | string
  summary?: ReactNode
  defaultOpen?: boolean
  children: ReactNode
}

export default function Disclosure({ title, count, summary, defaultOpen = false, children }: DisclosureProps) {
  const [open, setOpen] = useState(defaultOpen)
  const panelId = useId()
  return (
    <section className="rounded-card border border-line bg-surface shadow-card">
      <h2 className="m-0">
        <button
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen(o => !o)}
          className="flex w-full min-h-[48px] items-center gap-3 px-4 py-2 text-left rounded-card hover:bg-surface-2 transition-colors duration-[180ms] ease-out"
        >
          <span className="text-heading text-ink flex items-center gap-2 min-w-0">
            <span className="min-w-0 sm:truncate">{title}</span>
            {count !== undefined && <Badge tone="neutral">{count}</Badge>}
          </span>
          {!open && summary && <span className="ml-auto hidden sm:block text-meta text-ink-3 truncate">{summary}</span>}
          <ChevronDown
            size={16}
            aria-hidden="true"
            className={cx('text-ink-3 shrink-0 transition-transform duration-[260ms] ease-out motion-reduce:transition-none', 'ml-auto', !open && !!summary && 'sm:ml-0', open && 'rotate-180')}
          />
        </button>
      </h2>
      <div id={panelId}>
        <Collapse open={open}>
          <div className="px-4 pb-4 pt-1 border-t border-line">{children}</div>
        </Collapse>
      </div>
    </section>
  )
}
