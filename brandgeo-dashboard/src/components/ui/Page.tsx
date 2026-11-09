/** Page: the one page frame (spec 5.4). Inner column is 1136 px at 1440 on every route. */
import type { ReactNode } from 'react'

export default function Page({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-[1200px] px-4 md:px-6 xl:px-8 pt-6 md:pt-8 pb-24 md:pb-12">
      {children}
    </div>
  )
}
