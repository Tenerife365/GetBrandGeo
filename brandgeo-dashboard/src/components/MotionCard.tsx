/**
 * src/components/MotionCard.tsx
 * Shared card wrapper for the "compose in + hover-lift" pattern
 * (DASHBOARD-UX-2026.md §3/§6 Phase A). One component so every page's card
 * grid gets the identical stagger-entrance + hover feel instead of each page
 * re-implementing it (same reasoning as motion.ts's own doc comment).
 *
 * Two ways to use it:
 *
 * 1. Static card, no entrance animation, just hover-lift — the common case
 *    for a card that isn't part of a staggered grid (e.g. a single card
 *    below the fold). Zero extra props beyond className/children:
 *      <MotionCard className="bg-dark-800 border border-dark-700 rounded-xl p-5">
 *        ...
 *      </MotionCard>
 *
 * 2. Card inside a staggered grid — wrap the grid container in
 *    `<motion.div variants={staggerContainer} initial="hidden" animate="show">`
 *    (a plain Tailwind grid className, e.g. `className="grid grid-cols-2 gap-4"`),
 *    then pass `stagger` on each MotionCard so it inherits the parent's
 *    "hidden"/"show" state (Motion propagates variant state down through
 *    context to any child with a matching variants object and no explicit
 *    initial/animate of its own):
 *      <motion.div className="grid ..." variants={staggerContainer} initial="hidden" animate="show">
 *        <MotionCard stagger>...</MotionCard>
 *        <MotionCard stagger>...</MotionCard>
 *      </motion.div>
 *    Hover-lift still works independently in this mode — whileHover is a
 *    direct target object, not a named variant, so it layers on top of the
 *    inherited entrance state without conflict.
 *
 * Reduced-motion: handled globally by <MotionConfig reducedMotion="user"> in
 * App.tsx — nothing to do here or at any call site.
 */
import { motion, type HTMLMotionProps } from 'motion/react'
import { MOTION_FAST, EASE_OUT, staggerItem } from '../lib/motion'

interface MotionCardProps extends Omit<HTMLMotionProps<'div'>, 'variants' | 'whileHover'> {
  /** Set when this card is a direct child of a staggerContainer grid (see doc above). */
  stagger?: boolean
  /** Disable the hover-lift (e.g. a card that isn't interactive/clickable). Default true. */
  hoverLift?: boolean
}

const hoverTarget = { y: -2, transition: { duration: MOTION_FAST, ease: EASE_OUT } }

export default function MotionCard({
  stagger = false,
  hoverLift = true,
  className,
  children,
  ...rest
}: MotionCardProps) {
  return (
    <motion.div
      className={className}
      variants={stagger ? staggerItem : undefined}
      whileHover={hoverLift ? hoverTarget : undefined}
      {...rest}
    >
      {children}
    </motion.div>
  )
}
