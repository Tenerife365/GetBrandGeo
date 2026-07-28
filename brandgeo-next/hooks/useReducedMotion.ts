'use client'

import { useEffect, useState } from 'react'

/**
 * Tracks prefers-reduced-motion, and keeps tracking it — the user can flip the
 * OS setting while the tab is open. Returns false during SSR and on the first
 * client paint so markup matches and React does not warn about a hydration
 * mismatch; the real value lands in the effect.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(mq.matches)

    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  return reduced
}

/**
 * True when the viewport is narrow enough that we drop the WebGL canvas for a
 * static gradient. This is the directive's performance guardrail: phones render
 * the ambient radial fallback instead of paying for a render loop.
 *
 * Defaults to `true` (the cheap path) so a phone never briefly mounts the
 * canvas before the effect runs.
 */
export function useIsSmallViewport(breakpoint = 768): boolean {
  const [small, setSmall] = useState(true)

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint - 1}px)`)
    setSmall(mq.matches)

    const onChange = (e: MediaQueryListEvent) => setSmall(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [breakpoint])

  return small
}
