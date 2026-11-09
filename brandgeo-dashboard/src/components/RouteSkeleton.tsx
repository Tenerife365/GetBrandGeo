// Quiet placeholder shown while a lazy route chunk loads: the page frame
// (header bar, hero, four-stat readout) so the real page lands without a jump.
import Page from './ui/Page'
import { SkeletonBlock, SkeletonHero, SkeletonReadout } from './ui/skeletons'

export default function RouteSkeleton() {
  return (
    <Page>
      <div role="status" aria-live="polite" className="space-y-6">
        <span className="sr-only">Loading</span>
        <SkeletonBlock className="h-8 w-56" />
        <SkeletonHero />
        <SkeletonReadout n={4} />
      </div>
    </Page>
  )
}
