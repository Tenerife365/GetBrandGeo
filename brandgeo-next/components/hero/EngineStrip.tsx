'use client'

import { motion } from 'framer-motion'

import { WEB2_ENGINES, WEB3_ENGINES, type Engine } from '@/lib/engines'
import { StatusDot } from './StatusDot'

/**
 * The engine roster, grouped Web2 / Web3 to match the headline's promise.
 *
 * Both tiers get identical visual treatment per the owner decision of
 * 2026-07-27. See lib/engines.ts for the note on that.
 */

function EngineItem({ engine, index }: { engine: Engine; index: number }) {
  return (
    <motion.span
      variants={{
        hidden: { opacity: 0, y: 6 },
        show: { opacity: 1, y: 0 },
      }}
      className="inline-flex items-center gap-2 text-[13px] text-ink-2"
    >
      <StatusDot color={engine.color} index={index} />
      {engine.label}
    </motion.span>
  )
}

function Group({
  label,
  engines,
  offset,
}: {
  label: string
  engines: Engine[]
  offset: number
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2.5">
      <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-3">
        {label}
      </span>
      {engines.map((e, i) => (
        <EngineItem key={e.id} engine={e} index={offset + i} />
      ))}
    </div>
  )
}

export function EngineStrip() {
  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: 0.05, delayChildren: 0.5 } },
      }}
      className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-8"
    >
      <Group label="Web2 AI" engines={WEB2_ENGINES} offset={0} />
      <span aria-hidden className="hidden h-4 w-px bg-white/10 sm:block" />
      <Group label="Web3" engines={WEB3_ENGINES} offset={WEB2_ENGINES.length} />
    </motion.div>
  )
}
