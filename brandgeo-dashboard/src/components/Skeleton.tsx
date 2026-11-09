/**
 * src/components/Skeleton.tsx
 * Content-shaped loading placeholder. One primitive (a pulsing block on
 * surface-3); pages compose their own layout from it, or use the shaped
 * skeletons in ./ui (SkeletonStat, SkeletonHero, SkeletonTable ...).
 *
 * The pulse (1200 ms) and its reduced-motion freeze live in the `.skeleton`
 * class in index.css, so this component needs no motion handling of its own.
 */
export default function Skeleton({ className = '' }: { className?: string }) {
  return <div aria-hidden="true" className={`skeleton ${className}`} />
}
