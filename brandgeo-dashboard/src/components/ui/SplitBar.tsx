/**
 * SplitBar (spec 7.3): one 100% bar in fixed order pos, neu, neg with 2 px
 * gaps, and a direct legend (glyph + word + count + pct). A 0% segment draws
 * nothing but stays in the legend.
 */
import StatusGlyph from './StatusGlyph'

export interface SplitSegment {
  key: 'pos' | 'neu' | 'neg'
  count: number
  pct: number
}

export interface SplitBarProps {
  segments: SplitSegment[]
}

const ORDER: SplitSegment['key'][] = ['pos', 'neu', 'neg']
// copy: pending bg-copy
const WORD: Record<SplitSegment['key'], string> = { pos: 'Positive', neu: 'Neutral', neg: 'Negative' }
const FILL: Record<SplitSegment['key'], string> = { pos: 'bg-pos', neu: 'bg-neu', neg: 'bg-neg' }

export default function SplitBar({ segments }: SplitBarProps) {
  const ordered = ORDER.map(k => segments.find(s => s.key === k) ?? { key: k, count: 0, pct: 0 })
  const drawn = ordered.filter(s => s.pct > 0)
  return (
    <div>
      <div className="flex h-3 gap-[2px] overflow-hidden rounded bg-transparent" role="presentation">
        {drawn.map((s, i) => (
          <div
            key={s.key}
            className={`${FILL[s.key]} ${i === 0 ? 'rounded-l' : ''} ${i === drawn.length - 1 ? 'rounded-r' : ''}`}
            style={{ width: `${s.pct}%` }}
          />
        ))}
        {drawn.length === 0 && <div className="w-full bg-surface-3 rounded" />}
      </div>
      <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-meta text-ink-2">
        {ordered.map(s => (
          <li key={s.key} className="inline-flex items-center gap-1.5">
            <StatusGlyph kind={s.key} size={10} />
            <span>{WORD[s.key]}</span>
            <span className="tabular-nums text-ink">{s.count}</span>
            <span className="tabular-nums text-ink-3">{Math.round(s.pct)}%</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
