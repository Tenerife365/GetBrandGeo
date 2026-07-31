/**
 * src/components/EngineChip.tsx
 * The engine identity chip (dashboard-visual-system.md §8.4): an 8px swatch in
 * ENGINE_META[id].chartColor plus a plain-text-token label — never coloured
 * text. Replaces the old ENGINE_META colour/bg Tailwind-class chips at
 * BrandSentiment.tsx, Mentions.tsx, and the AIVisibility engine grid, which is
 * how Claude (orange-400) and Meta (amber-400) drifted to 9.6 delta-E apart —
 * the chip hues were hand-picked separately from the chart hues.
 *
 * Chip colour now equals chart colour BY CONSTRUCTION (one lookup, one hex),
 * and the label text always clears 4.5:1 in both themes with no per-hue
 * override, which is what let index.css delete the five
 * `html.light .text-{blue,orange,purple,sky,indigo}-400` overrides (§8.4, A11).
 *
 * Renders a <button> when `onClick` is passed (so it inherits the app's real
 * :focus-visible ring — never a <div> with a synthetic tabIndex), otherwise a
 * plain <span> for a read-only swatch+label (e.g. a legend-style identity tag).
 */
import type { ButtonHTMLAttributes } from 'react'
import { ENGINE_META, type EngineId } from '../lib/planConfig'
import { hexToRgba } from '../lib/color'

interface EngineChipProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'id' | 'children'> {
  id: EngineId
  selected?: boolean
  /** Render as a non-interactive <span> even if onClick is passed elsewhere. */
  interactive?: boolean
  /** Optional trailing content after the label, e.g. a "(12)" count. */
  children?: import('react').ReactNode
}

export default function EngineChip({ id, selected = false, interactive = true, className = '', onClick, children, ...rest }: EngineChipProps) {
  const meta = ENGINE_META[id]
  const asButton = interactive
  const sharedStyle = selected
    ? {
        backgroundColor: hexToRgba(meta.chartColor, 0.14),
        borderColor: hexToRgba(meta.chartColor, 0.45),
      }
    : undefined

  const inner = (
    <>
      <span
        className="inline-block rounded-full flex-shrink-0"
        style={{
          width: 8,
          height: 8,
          backgroundColor: meta.chartColor,
          boxShadow: selected ? '0 0 0 2px rgb(var(--dark-800))' : undefined,
        }}
      />
      <span className={selected ? 'font-semibold' : 'font-medium'} style={{ color: selected ? 'rgb(var(--text-base))' : 'rgb(var(--text-secondary))' }}>
        {meta.label}{children}
      </span>
    </>
  )

  // Sizing (28px desktop / 32px + 44px tap area below 768px) and the tap-area
  // pseudo-element live in the `.engine-chip` class (index.css) — a plain
  // inline style can't express the breakpoint, and the §13.4 44px tap target
  // has to be a real hit area, not just a bigger visible chip.
  const sharedClass = `engine-chip inline-flex items-center gap-1.5 rounded-full border text-xs transition-colors ${className}`

  if (!asButton) {
    return (
      <span className={sharedClass} style={{ borderColor: selected ? undefined : 'rgb(var(--dark-600))', ...sharedStyle }}>
        {inner}
      </span>
    )
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={sharedClass}
      style={{ borderColor: selected ? undefined : 'rgb(var(--dark-600))', ...sharedStyle }}
      {...rest}
    >
      {inner}
    </button>
  )
}
