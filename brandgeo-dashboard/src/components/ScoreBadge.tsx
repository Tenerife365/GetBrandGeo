import type { Classification } from '../types'
import Badge, { type BadgeTone } from './ui/Badge'
import ScoreDial from './ui/ScoreDial'

const CONFIG: Record<Classification, { label: string; tone: BadgeTone }> = {
  strategic:              { label: 'Strategic',       tone: 'pos' },
  high_value:             { label: 'High Value',      tone: 'accent' },
  medium_value:           { label: 'Medium Value',    tone: 'neutral' },
  low_value:              { label: 'Low Value',       tone: 'neutral' },
  competitor_opportunity: { label: 'Competitor Opp.', tone: 'warn' },
}

export function ClassificationBadge({ value }: { value: Classification }) {
  const { label, tone } = CONFIG[value] ?? CONFIG.low_value
  return <Badge tone={tone}>{label}</Badge>
}

// Sentiment fills are the pos / neu / neg tokens. The dot is paired with a word
// wherever it is read, never colour alone.
export function SentimentDot({ value }: { value: string }) {
  const colors: Record<string, string> = {
    positive: 'bg-pos',
    neutral:  'bg-neu',
    negative: 'bg-neg',
    none:     'bg-surface-3',
  }
  return (
    <span aria-hidden="true" className={`inline-block w-2 h-2 rounded-full ${colors[value] ?? 'bg-neu'}`} />
  )
}

/** Kept for existing imports: the one score dial (spec 7.3), medium size. */
export function GeoScoreRing({ score }: { score: number }) {
  return <ScoreDial score={score} size="md" />
}
