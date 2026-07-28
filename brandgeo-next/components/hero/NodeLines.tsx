'use client'

/**
 * Glowing connector lines running from the audit field into the report card, to
 * read as a live query crossing the network.
 *
 * Drawn in a fixed 0..100 viewBox with preserveAspectRatio="none" so it stretches
 * to whatever gap the grid leaves between the two columns without any DOM
 * measurement. Desktop only: below lg the columns stack and a left-to-right
 * connector would be pointing at nothing.
 *
 * The dash flow is a CSS animation (`.bg-flow`), so it stops under
 * prefers-reduced-motion along with everything else.
 */
export function NodeLines() {
  return (
    <svg
      aria-hidden
      className="pointer-events-none absolute inset-y-0 left-1/2 hidden w-[16%] -translate-x-1/2 lg:block"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id="nodeLineGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#7c3aed" stopOpacity="0" />
          <stop offset="45%" stopColor="#8b5cf6" stopOpacity="0.75" />
          <stop offset="100%" stopColor="#6366f1" stopOpacity="0.1" />
        </linearGradient>
      </defs>

      {[
        'M0,58 C34,58 46,34 100,34',
        'M0,60 C40,60 52,60 100,60',
        'M0,62 C34,62 46,86 100,86',
      ].map((d, i) => (
        <g key={d}>
          <path
            d={d}
            fill="none"
            stroke="url(#nodeLineGrad)"
            strokeWidth="0.5"
            vectorEffect="non-scaling-stroke"
          />
          <path
            className="bg-flow"
            d={d}
            fill="none"
            stroke="#a78bfa"
            strokeWidth="1.1"
            strokeDasharray="3 21"
            vectorEffect="non-scaling-stroke"
            style={{ animationDelay: `${i * 0.36}s`, opacity: 0.85 }}
          />
        </g>
      ))}
    </svg>
  )
}
