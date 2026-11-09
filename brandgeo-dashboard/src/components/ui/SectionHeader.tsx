/** SectionHeader (spec 7.1): h2 (or h3) in the heading role, count as a neutral Badge. */
import type { ReactNode } from 'react'
import Badge from './Badge'

export interface SectionHeaderProps {
  title: ReactNode
  count?: number | string
  description?: ReactNode
  actions?: ReactNode
  level?: 2 | 3
}

export default function SectionHeader({ title, count, description, actions, level = 2 }: SectionHeaderProps) {
  const Tag = level === 3 ? 'h3' : 'h2'
  return (
    <div className="mb-4 flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
      <div className="min-w-0">
        <Tag className="text-heading text-ink flex items-center gap-2">
          <span>{title}</span>
          {count !== undefined && <Badge tone="neutral">{count}</Badge>}
        </Tag>
        {description && <p className="mt-0.5 text-meta text-ink-2">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  )
}
