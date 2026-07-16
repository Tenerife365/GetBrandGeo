/**
 * src/components/Collapse.tsx
 * Shared expand/collapse wrapper — DASHBOARD-UX-2026.md §3 item 5 / §6 Phase D
 * ("Layout animations for expand/collapse — the 'Fix This' items, prompt rows,
 * competitor rows should animate their height/position smoothly").
 *
 * One shared file so every collapsible section (Fix This hub, competitor
 * insights, per-prompt-row detail panels, and future pages that need the same
 * pattern) animates identically instead of each spot hand-rolling its own
 * AnimatePresence block — same "one file, pages compose" convention already
 * used by MotionCard.tsx and Skeleton.tsx.
 *
 * Usage: replace `{open && (<div>...</div>)}` with `<Collapse open={open}>
 * <div>...</div></Collapse>` — no other change needed, the wrapped content
 * keeps its own className/padding/etc. exactly as before.
 *
 * Reduced-motion: handled globally by <MotionConfig reducedMotion="user"> in
 * App.tsx (this is a plain AnimatePresence/motion.div, not a manual rAF loop
 * or a non-Motion library) — nothing to do here or at any call site.
 */
import { AnimatePresence, motion } from 'motion/react'
import type { ReactNode } from 'react'
import { MOTION_BASE, EASE_OUT } from '../lib/motion'

export default function Collapse({ open, children }: { open: boolean; children: ReactNode }) {
  return (
    <AnimatePresence initial={false}>
      {open && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: MOTION_BASE, ease: EASE_OUT }}
          style={{ overflow: 'hidden' }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
