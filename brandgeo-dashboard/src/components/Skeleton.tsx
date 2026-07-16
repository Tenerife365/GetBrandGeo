/**
 * src/components/Skeleton.tsx
 * Content-shaped loading placeholder — DASHBOARD-UX-2026.md §6 Phase C.
 *
 * Replaces the old "pulsing text" loading state (`<div className="text-slate-500
 * text-sm animate-pulse">{t.dash_loading}</div>`, verbatim across ~7 pages per
 * DESIGN-SYSTEM.md's own documented loading-state convention) with placeholders
 * shaped like the real content. Two wins: it prevents the layout-shift "jank"
 * that reads as cheap when the page jumps from a centered spinner to a full
 * grid (DASHBOARD-UX-2026.md §2's Cumulative-Layout-Shift point), and it makes
 * the same real load time *feel* faster because the eye has structure to
 * anticipate instead of a blank wait.
 *
 * One primitive (`<Skeleton>`, a pulsing rounded block) — pages compose their
 * own skeleton LAYOUT out of it, matching their real card/grid structure. This
 * file deliberately does not hardcode every page's shape; see Dashboard.tsx
 * for the first real composition (Overview's skeleton).
 *
 * Reduced-motion: Tailwind's `animate-pulse` isn't covered by App.tsx's
 * <MotionConfig reducedMotion="user"> (that only governs Motion's own
 * animate/variants system — same caveat already documented on useCountUp in
 * motion.ts). index.css now carries a matching
 * `prefers-reduced-motion: reduce { .animate-pulse { animation: none } }`
 * guard, so this component needs no reduced-motion handling of its own.
 */
export default function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-dark-700/60 ${className}`} />
}
