'use client'

import { useRef } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'

import { ENGINES } from '@/lib/engines'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { StatusDot } from './StatusDot'

/* Sample figures. Clearly labelled "Sample report" in the card head — this is
   an illustration of the output, not a claim about the visitor's brand. */
const SCORE = 68
const ROWS: { id: string; position: string; state: 'known' | 'weak' | 'missing' }[] = [
  { id: 'chatgpt', position: '#2', state: 'known' },
  { id: 'gemini', position: '#1', state: 'known' },
  { id: 'claude', position: '#5', state: 'weak' },
  { id: 'perplexity', position: 'n/a', state: 'missing' },
  { id: 'google_ai', position: '#4', state: 'weak' },
  { id: 'bittensor', position: '#3', state: 'known' },
  { id: 'mind_network', position: 'n/a', state: 'missing' },
]

const STATE_STYLE: Record<string, string> = {
  known: 'text-emerald-400',
  weak: 'text-amber-400',
  missing: 'text-rose-400',
}

const R = 34
const CIRC = 2 * Math.PI * R

export function ReportCard() {
  const reduced = useReducedMotion()
  const ref = useRef<HTMLDivElement>(null)

  // Raw pointer offset, then a spring, then a rotation. Springing the source
  // rather than the output keeps the card from snapping when the pointer
  // re-enters at a different edge.
  const px = useMotionValue(0)
  const py = useMotionValue(0)
  const sx = useSpring(px, { stiffness: 150, damping: 18, mass: 0.6 })
  const sy = useSpring(py, { stiffness: 150, damping: 18, mass: 0.6 })
  const rotateY = useTransform(sx, [-0.5, 0.5], ['7deg', '-7deg'])
  const rotateX = useTransform(sy, [-0.5, 0.5], ['-7deg', '7deg'])

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (reduced || e.pointerType !== 'mouse' || !ref.current) return
    const r = ref.current.getBoundingClientRect()
    px.set((e.clientX - r.left) / r.width - 0.5)
    py.set((e.clientY - r.top) / r.height - 0.5)
  }

  function onPointerLeave() {
    px.set(0)
    py.set(0)
  }

  return (
    <div className="relative [perspective:1200px]">
      {/* Ambient glow behind the card. Sits outside the tilt transform so it
          does not shear when the card rotates. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-10 -z-10 opacity-70"
        style={{
          background:
            'radial-gradient(50% 45% at 50% 45%, rgba(124,58,237,0.30) 0%, rgba(99,102,241,0.12) 45%, rgba(9,10,15,0) 76%)',
        }}
      />

      <motion.div
        ref={ref}
        onPointerMove={onPointerMove}
        onPointerLeave={onPointerLeave}
        style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
        className="relative rounded-2xl border border-white/10 bg-white/[0.03] p-5 shadow-[0_24px_70px_-24px_rgba(0,0,0,0.85)] backdrop-blur-xl sm:p-6"
      >
        {/* Gradient hairline. A masked ring rather than a border so the violet
            reads as light catching the edge instead of a drawn outline. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-2xl p-px opacity-70"
          style={{
            background:
              'linear-gradient(140deg, rgba(139,92,246,0.55), rgba(99,102,241,0.12) 42%, rgba(255,255,255,0.05) 70%, rgba(139,92,246,0.28))',
            WebkitMask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
            WebkitMaskComposite: 'xor',
            maskComposite: 'exclude',
          }}
        />

        <motion.div
          initial="hidden"
          animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06, delayChildren: 0.4 } } }}
          className="relative"
        >
          <motion.div
            variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }}
            className="mb-4 flex items-center justify-between"
          >
            <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink-3">
              Sample report
            </span>
            <span className="inline-flex items-center gap-1.5 text-[11px] text-ink-3">
              <StatusDot color="#34d399" />
              Live
            </span>
          </motion.div>

          {/* Score */}
          <motion.div
            variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }}
            className="mb-5 flex items-center gap-4 rounded-xl border border-white/[0.07] bg-white/[0.02] p-4"
          >
            <div className="relative shrink-0">
              <svg width="88" height="88" viewBox="0 0 88 88" className="-rotate-90">
                <defs>
                  <linearGradient id="scoreGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#7c3aed" />
                    <stop offset="100%" stopColor="#6366f1" />
                  </linearGradient>
                </defs>
                <circle cx="44" cy="44" r={R} fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth="6" />
                <motion.circle
                  cx="44"
                  cy="44"
                  r={R}
                  fill="none"
                  stroke="url(#scoreGrad)"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={CIRC}
                  initial={{ strokeDashoffset: CIRC }}
                  animate={{ strokeDashoffset: CIRC * (1 - SCORE / 100) }}
                  transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1], delay: 0.6 }}
                />
              </svg>
              <div className="absolute inset-0 grid place-items-center">
                <span className="text-2xl font-semibold tabular-nums">{SCORE}</span>
              </div>
            </div>
            <div className="min-w-0">
              <div className="text-sm font-medium">AI Visibility Score</div>
              <p className="mt-1 text-[13px] leading-relaxed text-ink-2">
                Weighted across seven engines and six dimensions.
              </p>
            </div>
          </motion.div>

          {/* Per-engine split */}
          <div className="space-y-1">
            {ROWS.map((row) => {
              const engine = ENGINES.find((e) => e.id === row.id)
              if (!engine) return null
              return (
                <motion.div
                  key={row.id}
                  variants={{ hidden: { opacity: 0, x: -6 }, show: { opacity: 1, x: 0 } }}
                  className="flex items-center justify-between rounded-lg px-2 py-1.5 text-[13px] transition-colors hover:bg-white/[0.03]"
                >
                  <span className="flex min-w-0 items-center gap-2.5">
                    <span
                      aria-hidden
                      className="size-1.5 shrink-0 rounded-full"
                      style={{ background: engine.color }}
                    />
                    <span className="truncate text-ink-2">{engine.label}</span>
                  </span>
                  <span className={`shrink-0 font-medium tabular-nums ${STATE_STYLE[row.state]}`}>
                    {row.position}
                  </span>
                </motion.div>
              )
            })}
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}
