/** ReadoutRow (spec 7.3): one Card of Stats separated by 1 px --line rules, 4-up at >= 1024, 2 x 2 below. */
import { Children, type ReactNode } from 'react'
import Card from './Card'

export default function ReadoutRow({ children }: { children: ReactNode }) {
  const cells = Children.toArray(children)
  return (
    <Card pad="none">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-line rounded-card overflow-hidden">
        {cells.map((cell, i) => (
          <div key={i} className="relative overflow-hidden bg-surface p-5 pb-10 min-h-[136px] min-w-0">
            {cell}
          </div>
        ))}
      </div>
    </Card>
  )
}
