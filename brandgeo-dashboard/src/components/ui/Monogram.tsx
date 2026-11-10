/**
 * Monogram (Phase 4 C2): a deterministic two-letter anchor beside a name.
 * No network, no per-name colour. The name sits next to it, so it is aria-hidden.
 */
export interface MonogramProps {
  name: string
  size?: 20 | 24
  you?: boolean
}

function initialsOf(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return '?'
  const first = Array.from(words[0])[0] ?? ''
  const second = words.length >= 2 ? (Array.from(words[1])[0] ?? '') : ''
  const out = (first + second).toUpperCase()
  return out || '?'
}

export default function Monogram({ name, size = 24, you = false }: MonogramProps) {
  const dims = size === 20 ? 'w-5 h-5' : 'w-6 h-6'
  const tone = you
    ? 'bg-accent-tint text-accent-ink ring-accent-ink/30'
    : 'bg-surface-3 text-ink-2 ring-line-2'
  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 items-center justify-center rounded-badge text-meta font-semibold select-none ring-1 ring-inset ${dims} ${tone}`}
    >
      {initialsOf(name)}
    </span>
  )
}
