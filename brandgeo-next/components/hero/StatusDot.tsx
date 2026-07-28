'use client'

/**
 * Pulsing engine status dot: a solid core plus an expanding ring, both driven
 * by CSS keyframes in globals.css rather than JS, so a row of seven of them
 * costs nothing on the main thread.
 *
 * The stagger is a negative animation-delay so the dots are already mid-cycle
 * on first paint and do not all fire in lockstep.
 */
export function StatusDot({ color, index = 0 }: { color: string; index?: number }) {
  const delay = `${-(index * 0.34).toFixed(2)}s`

  return (
    <span aria-hidden className="relative inline-flex size-[7px] shrink-0">
      <span
        className="bg-dot-ring absolute inset-0 rounded-full"
        style={{ background: color, animationDelay: delay }}
      />
      <span
        className="bg-dot-core relative inline-flex size-[7px] rounded-full"
        style={{ background: color, animationDelay: delay }}
      />
    </span>
  )
}
