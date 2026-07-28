import { Badge } from '@/components/ui/badge'
import { AuditSearchBar } from './AuditSearchBar'
import { EngineStrip } from './EngineStrip'
import { HeroMesh } from './HeroMesh'
import { NodeLines } from './NodeLines'
import { ReportCard } from './ReportCard'

/**
 * Hero.
 *
 * Structure note — this is the fix for the clipped-edge problem. The background
 * layer is a full-bleed `w-full overflow-hidden relative` wrapper that is a
 * SIBLING of the content container, not a parent of it. Previously the glow
 * lived inside the max-width column, so it ended on the column's edge and left
 * a visible rectangle behind the report card. Now every glow terminates in a
 * transparent stop against #090A0F and the container only constrains text.
 */
export function Hero() {
  return (
    <section className="relative w-full overflow-hidden">
      {/* ── Background layer ─────────────────────────────────────────────── */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        {/* Fine grid, masked to nothing at the edges. */}
        <div
          className="absolute inset-0 opacity-[0.055]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)',
            backgroundSize: '58px 58px',
            maskImage: 'radial-gradient(78% 62% at 50% 38%, #000 0%, transparent 100%)',
            WebkitMaskImage: 'radial-gradient(78% 62% at 50% 38%, #000 0%, transparent 100%)',
          }}
        />

        {/* Two soft orbs. Both end on a fully transparent stop so there is no
            seam where the gradient meets the page background. */}
        <div
          className="absolute -top-[22%] left-[8%] size-[46rem] max-w-[92vw] rounded-full blur-3xl"
          style={{
            background:
              'radial-gradient(circle, rgba(124,58,237,0.22) 0%, rgba(124,58,237,0.07) 45%, rgba(9,10,15,0) 72%)',
          }}
        />
        <div
          className="absolute -right-[10%] top-[18%] size-[38rem] max-w-[92vw] rounded-full blur-3xl"
          style={{
            background:
              'radial-gradient(circle, rgba(99,102,241,0.20) 0%, rgba(99,102,241,0.06) 48%, rgba(9,10,15,0) 74%)',
          }}
        />

        {/* WebGL mesh, or the ambient gradient on phones / reduced motion. */}
        <HeroMesh />

        {/* Bottom fade into the next section so the hero has no hard floor. */}
        <div
          className="absolute inset-x-0 bottom-0 h-40"
          style={{ background: 'linear-gradient(to bottom, rgba(9,10,15,0), #090a0f)' }}
        />
      </div>

      {/* ── Content ──────────────────────────────────────────────────────── */}
      <div className="relative mx-auto w-full max-w-6xl px-5 pb-20 pt-20 sm:px-8 sm:pt-28 lg:pb-28">
        <div className="relative grid items-center gap-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10">
          <NodeLines />

          {/* Left: copy + audit */}
          <div className="relative space-y-6">
            <Badge variant="brand" size="md">
              AI Visibility Platform
            </Badge>

            <h1 className="text-balance text-[2.15rem] font-semibold leading-[1.08] tracking-[-0.02em] sm:text-5xl lg:text-[3.4rem]">
              Does AI recommend{' '}
              <em className="not-italic text-brand">your brand</em> across Web2 &amp; Web3?
            </h1>

            <p className="max-w-xl text-pretty text-[15px] leading-relaxed text-ink-2 sm:text-base">
              Check your domain instantly. See what top AI models and decentralized
              knowledge engines display when customers ask.
            </p>

            <AuditSearchBar />
          </div>

          {/* Right: sample report */}
          <div className="relative">
            <ReportCard />
          </div>
        </div>

        <div className="relative mt-14 border-t border-white/[0.06] pt-8">
          <EngineStrip />
        </div>
      </div>
    </section>
  )
}
