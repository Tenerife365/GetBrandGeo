/**
 * PageHeader: the route's single h1, with an optional badge inline on the same
 * baseline, a subtitle, and actions (spec 7.1). Below 640 the actions drop to a
 * full-width row under the title.
 */
import type { ReactNode } from 'react'

export interface PageHeaderProps {
  title: ReactNode
  badge?: ReactNode
  subtitle?: ReactNode
  actions?: ReactNode
}

export default function PageHeader({ title, badge, subtitle, actions }: PageHeaderProps) {
  return (
    <header className="mb-4 md:mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
      <div className="min-w-0">
        <h1 className="text-title-sm md:text-title text-ink flex flex-wrap items-center gap-x-3 gap-y-1">
          <span>{title}</span>
          {badge}
        </h1>
        {subtitle && <p className="mt-1 text-body text-ink-2 max-w-[72ch]">{subtitle}</p>}
      </div>
      {actions && (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:shrink-0 [&>*]:w-full sm:[&>*]:w-auto">
          {actions}
        </div>
      )}
    </header>
  )
}
