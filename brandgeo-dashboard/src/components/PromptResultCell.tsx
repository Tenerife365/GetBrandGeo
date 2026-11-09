/**
 * src/components/PromptResultCell.tsx
 * One prompt x engine cell on the AI Visibility page. Six states, each with its
 * own glyph AND word, so no state is told apart by colour alone.
 *
 * Renders spans only (never a div or a button), because it sits inside the
 * prompt row's own <button> and nesting block elements or interactive elements
 * there is invalid.
 *
 * Variants:
 *  - grid:   the table cell, at least 44px tall.
 *  - tile:   the small-screen and expanded-strip cell, adds the engine logo.
 *  - legend: the 20px swatch used by the legend, always aria-hidden.
 *
 * Spec: docs/design/ai-visibility-prompt-focus-spec-2026-10-28.md, section
 * "PromptResultCell". Text comes from src/lib/aiVisibilityCopy.ts.
 */
import { TriangleAlert, Check, Clock, Lock, Minus, X } from 'lucide-react'
import { ENGINE_META, type EngineId } from '../lib/planConfig'
import { formatDate } from '../lib/format'
import {
  AIV_COPY,
  cellAbsentLabel,
  cellErrorLabel,
  cellMentionedLabel,
  cellNoAnswerLabel,
  cellPendingLabel,
  cellSinceLine,
} from '../lib/aiVisibilityCopy'
import type { CellState } from '../lib/promptPerformance'

export type PromptResultCellVariant = 'grid' | 'tile' | 'legend'

interface Props {
  state: CellState
  engineId: EngineId
  /** Rank in the engine's list, for `mentioned`. */
  position?: number | null
  /** ISO timestamp: when the engine stopped answering. */
  errorSince?: string | null
  /** ISO timestamp of the last ok result before the failures. */
  previousOkAt?: string | null
  variant?: PromptResultCellVariant
}

const STATE_CLASS: Record<CellState, string> = {
  mentioned: 'bg-pos-tint text-pos-ink',
  absent: 'bg-surface-2 text-neg',
  no_answer: 'bg-surface-2 text-ink-3',
  error: 'bg-surface-2 text-warn',
  pending: 'bg-surface-2 text-ink-3',
  locked: 'bg-transparent text-ink-3',
}

function Glyph({ state, size }: { state: CellState; size: number }) {
  const common = { size, 'aria-hidden': true as const }
  switch (state) {
    case 'mentioned': return <Check {...common} className="text-pos-ink" />
    case 'absent': return <X {...common} className="text-neg" />
    case 'no_answer': return <Minus {...common} />
    case 'error': return <TriangleAlert {...common} className="text-warn" />
    case 'pending': return <Clock {...common} />
    default: return <Lock {...common} className="text-ink-3" />
  }
}

export default function PromptResultCell({
  state, engineId, position = null, errorSince = null, previousOkAt = null, variant = 'grid',
}: Props) {
  const meta = ENGINE_META[engineId]
  const label = meta?.label ?? engineId

  if (variant === 'legend') {
    return (
      <span
        aria-hidden="true"
        className={`inline-flex h-5 w-5 items-center justify-center rounded-badge ${STATE_CLASS[state]}`}
      >
        <Glyph state={state} size={12} />
      </span>
    )
  }

  if (state === 'locked') {
    return (
      <span
        aria-hidden="true"
        className={`flex w-full min-h-[40px] items-center justify-center rounded-badge py-1.5 ${STATE_CLASS.locked}`}
      >
        <Lock size={12} aria-hidden="true" className="text-ink-3" />
      </span>
    )
  }

  const since = errorSince ? formatDate(errorSince) : null
  const prev = previousOkAt ? formatDate(previousOkAt) : null

  let word: string
  let spoken: string
  switch (state) {
    case 'mentioned':
      word = position != null ? `#${position}` : AIV_COPY.cellMentioned
      spoken = cellMentionedLabel(label, position)
      break
    case 'absent':
      word = AIV_COPY.cellAbsent
      spoken = cellAbsentLabel(label)
      break
    case 'no_answer':
      word = AIV_COPY.cellNoAnswer
      spoken = cellNoAnswerLabel(label)
      break
    case 'error':
      word = AIV_COPY.cellError
      spoken = cellErrorLabel(label, since, prev)
      break
    default:
      word = AIV_COPY.cellPending
      spoken = cellPendingLabel(label)
  }

  const box = variant === 'tile'
    ? 'flex flex-col items-center justify-center gap-0.5 rounded-badge w-full min-h-[56px] py-1.5'
    : 'flex flex-col items-center justify-center gap-0.5 rounded-badge w-full min-h-[40px] py-1.5'

  return (
    <span className={`${box} ${STATE_CLASS[state]}`} title={spoken}>
      {variant === 'tile' && (
        <img src={meta?.logoUrl} alt="" aria-hidden="true" className="w-4 h-4 object-contain" />
      )}
      <Glyph state={state} size={14} />
      <span aria-hidden="true" className="text-meta leading-none font-semibold">{word}</span>
      {state === 'error' && since && (
        <span aria-hidden="true" className="text-meta leading-none text-warn">{cellSinceLine(since)}</span>
      )}
      <span className="sr-only">{spoken}</span>
    </span>
  )
}
