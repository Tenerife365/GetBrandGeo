/**
 * src/lib/motion.ts
 * Shared Motion (motion/react, formerly Framer Motion) variants and timing
 * tokens — DASHBOARD-UX-2026.md §3/§6 Phase A ("Motion foundation").
 *
 * One file so every page's stagger/hover/entrance animation is visually
 * consistent instead of each component inventing its own duration/easing
 * (the DESIGN-SYSTEM.md §1 "duplication waiting to drift" lesson, applied to
 * motion instead of color). Import from here, don't hand-write a `transition`
 * object inline.
 *
 * Reduced-motion handling: this file does NOT need to check
 * prefers-reduced-motion itself — App.tsx wraps the whole app in
 * <MotionConfig reducedMotion="user">, which makes every motion.* component
 * automatically skip transform/opacity animation for users who have it set,
 * while still applying the final state instantly. That's the single point of
 * truth; don't add a second reduced-motion check here or in a component.
 *
 * Numbers below are the JS-side mirror of index.css's --motion-fast/base/slow
 * custom properties (a plain CSS var can't feed a JS spring/tween config) —
 * keep both in sync by hand if these ever change.
 */

// Duration tokens, in seconds (Motion's `duration` is in seconds, not ms).
export const MOTION_FAST = 0.18   // buttons, toggles, hover color/lift
export const MOTION_BASE = 0.26   // cards, tabs, expanders, chart cards
export const MOTION_SLOW = 0.5    // page/section entrance, hero reveal

// Matches index.css's --ease-out exactly.
export const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1]

/**
 * cardHover — whileHover variant for an interactive card. Same visual result
 * as the .card-hover-lift CSS utility (index.css) but as a Motion variant, for
 * cards that also need Motion for something else (stagger entrance, layout
 * animation) and shouldn't carry two separate hover mechanisms at once.
 *
 * Prefer the plain .card-hover-lift CSS class for a card with no other motion
 * need — it's zero-JS. Reach for this only when the card is already a
 * motion.div for another reason.
 */
export const cardHover = {
  rest:  { y: 0, transition: { duration: MOTION_FAST, ease: EASE_OUT } },
  hover: { y: -2, transition: { duration: MOTION_FAST, ease: EASE_OUT } },
}

/**
 * staggerContainer / staggerItem — the paired variants for a "cards compose
 * in" entrance (DASHBOARD-UX-2026.md §3 item 4). Apply staggerContainer to the
 * parent grid (`initial="hidden" animate="show"`), staggerItem to each direct
 * child card (`variants={staggerItem}`, no initial/animate needed — it
 * inherits from the parent).
 *
 * staggerChildren: 0.05 = 50ms between each card, inside the 40-60ms range
 * DASHBOARD-UX-2026.md §3 item 4 specifies.
 */
export const staggerContainer = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.05, delayChildren: 0.02 },
  },
}

export const staggerItem = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: MOTION_BASE, ease: EASE_OUT },
  },
}

/**
 * heroReveal — a slightly slower, slightly larger-travel entrance for a
 * single hero element (e.g. the Overview AI Visibility Score card) that
 * shouldn't stagger against anything else. Use standalone: `initial="hidden"
 * animate="show" variants={heroReveal}`.
 */
export const heroReveal = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: MOTION_SLOW, ease: EASE_OUT },
  },
}
