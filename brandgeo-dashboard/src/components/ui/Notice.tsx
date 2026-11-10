/** Notice (spec 7.1): one per route at most, 3 px left rule in the tone mark, one action. */
import type { ReactNode } from 'react'
import Card from './Card'
import StatusGlyph, { type StatusKind } from './StatusGlyph'
import { cx } from './cx'

export interface NoticeProps {
  tone: 'warn' | 'neg' | 'accent'
  title: ReactNode
  children?: ReactNode
  action?: ReactNode
}

const RULE: Record<NoticeProps['tone'], string> = {
  warn: 'border-l-warn hover:border-l-warn hover:border-t-line hover:border-r-line hover:border-b-line',
  neg: 'border-l-neg hover:border-l-neg hover:border-t-line hover:border-r-line hover:border-b-line',
  accent: 'border-l-accent-ink hover:border-l-accent-ink hover:border-t-line hover:border-r-line hover:border-b-line',
}
const GLYPH: Record<NoticeProps['tone'], StatusKind> = { warn: 'warn', neg: 'warn', accent: 'info' }

export default function Notice({ tone, title, children, action }: NoticeProps) {
  return (
    <Card
      role={tone === 'accent' ? 'status' : 'alert'}
      className={cx('border-l-[3px] flex flex-col gap-3 sm:flex-row sm:items-start', RULE[tone])}
    >
      <div className="flex items-start gap-3 min-w-0 flex-1">
        <span className="mt-[3px]">
          <StatusGlyph kind={GLYPH[tone]} size={16} className={tone === 'neg' ? 'text-neg' : undefined} />
        </span>
        <div className="min-w-0">
          <div className="text-heading text-ink">{title}</div>
          {children && <div className="mt-1 text-body text-ink-2 max-w-[72ch]">{children}</div>}
        </div>
      </div>
      {action && <div className="shrink-0 max-sm:[&>*]:w-full">{action}</div>}
    </Card>
  )
}
