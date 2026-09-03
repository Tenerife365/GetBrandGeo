import { useEffect, useRef } from 'react'

// Calls `onLanded` each time `lastCompletedAt` changes AFTER the component
// mounted, and never for the value it already had at mount. Every page that
// uses this also loads on mount from its own client/filter effect, so reacting
// to the initial value fired a second, identical query set on every visit once
// any collection had happened in the session (verifier note, 2026-09-03).
// `lastCompletedAt` bumps incrementally as jobs land (collectionContext.tsx),
// so the callback must never assume a single final bump.
export function useCollectionLanded(lastCompletedAt: number, onLanded: () => void) {
  const seen = useRef(lastCompletedAt)
  const cb = useRef(onLanded)
  useEffect(() => { cb.current = onLanded })
  useEffect(() => {
    if (lastCompletedAt === seen.current) return
    seen.current = lastCompletedAt
    if (lastCompletedAt > 0) cb.current()
  }, [lastCompletedAt])
}
