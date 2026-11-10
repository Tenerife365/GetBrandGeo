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
  const letters: string[] = []
  for (const word of name.trim().split(/\s+/)) {
    const ch = Array.from(word).find(c => /\p{L}|\p{N}/u.test(c))
    if (ch) letters.push(ch)
    if (letters.length === 2) break
  }
  return letters.join('').toUpperCase() || '?'
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
