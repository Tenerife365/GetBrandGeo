import type { Classification } from '../types'

const CONFIG: Record<Classification, { label: string; color: string }> = {
  strategic:              { label: 'Strategic',       color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  high_value:             { label: 'High Value',      color: 'bg-brand-500/20 text-brand-400 border-brand-500/30' },
  medium_value:           { label: 'Medium Value',    color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  low_value:              { label: 'Low Value',       color: 'bg-slate-500/20 text-slate-400 border-slate-500/30' },
  competitor_opportunity: { label: 'Competitor Opp.', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
}

export function ClassificationBadge({ value }: { value: Classification }) {
  const { label, color } = CONFIG[value] ?? CONFIG.low_value
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${color}`}>
      {label}
    </span>
  )
}

export function SentimentDot({ value }: { value: string }) {
  const colors: Record<string, string> = {
    positive: 'bg-emerald-400',
    neutral:  'bg-slate-400',
    negative: 'bg-red-400',
    none:     'bg-dark-600',
  }
  return (
    <span className={`inline-block w-2 h-2 rounded-full ${colors[value] ?? 'bg-slate-600'}`} />
  )
}

export function GeoScoreRing({ score }: { score: number }) {
  const color =
    score >= 76 ? 'text-emerald-400' :
    score >= 51 ? 'text-brand-400' :
    score >= 21 ? 'text-blue-400' :
    'text-slate-500'

  return (
    <div className={`text-2xl font-bold tabular-nums ${color}`}>
      {score}
      <span className="text-sm text-slate-500 font-normal">/100</span>
    </div>
  )
}
