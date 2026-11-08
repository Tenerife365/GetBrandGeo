// Quiet placeholder shown while a lazy route chunk loads. Uses the same
// bg-dark-* / border-dark-* tokens as the pages (index.css remaps them for
// light mode). Pulse only when the OS does not ask for reduced motion.
export default function RouteSkeleton() {
  return (
    <div role="status" aria-live="polite" className="w-full p-4 md:p-6 space-y-6">
      <span className="sr-only">Loading</span>
      <div className="h-8 w-56 rounded-lg bg-dark-700 motion-safe:animate-pulse" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className="h-36 rounded-xl border border-dark-700 bg-dark-800 motion-safe:animate-pulse"
          />
        ))}
      </div>
    </div>
  )
}
