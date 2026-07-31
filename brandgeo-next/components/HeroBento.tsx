'use client'

/* ─────────────────────────────────────────────────────────────────────────────
   HeroBento — v3. Same Two-Stage Hook copy as HeroSection, rebuilt as a real
   bento grid with Framer Motion entrance choreography.

   What "real bento" means here, versus the two-column layout in v2: tiles have
   deliberately unequal spans and heights, and every tile carries one idea. The
   grid is 12 columns and 3 rows on desktop. A 6x2 of equal cards is not a bento,
   it is a table with rounded corners.

   MOTION BUDGET, because this is where these templates usually go wrong:
     - One orchestrated entrance. Tiles stagger in once on mount, 60ms apart.
       Scattered micro-interactions on every element read as noise; a single
       well-timed reveal reads as craft.
     - Transform and opacity only. Both are compositor properties, so the whole
       entrance runs off the main thread. Animating height, top or filter here
       would force layout or paint on every frame.
     - whileHover is a spring on transform, not a re-render. No state is set on
       hover, so React does no work at all during the interaction.
     - prefers-reduced-motion collapses the stagger to a plain fade.
   ────────────────────────────────────────────────────────────────────────── */

import { useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import {
  ArrowRight, Zap, Clock, Lock, Sparkles, TrendingUp, TrendingDown,
  CheckCircle2, MinusCircle, XCircle,
} from 'lucide-react'

const VIO = '#8B5CF6'
const IND = '#6366F1'
const EM = '#10B981'

/* ── Motion ───────────────────────────────────────────────────────────────── */

/* ── Shared tile shell ────────────────────────────────────────────────────── */
function Tile({
  className = '', children, glow = false, i = 0,
}: { className?: string; children: React.ReactNode; glow?: boolean; i?: number }) {
  return (
    <motion.div
      // Entrance is the CSS .bento-in class, NOT a Motion variant. See the note
      // in globals.css: a Motion entrance leaves content at opacity 0 forever in
      // a backgrounded tab. Motion is kept only for hover, where failing to run
      // costs a hover effect rather than the entire page.
      whileHover={{ y: -3 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className={`bento-in relative overflow-hidden rounded-3xl border border-white/[0.08] p-6 ${className}`}
      style={{
        animationDelay: `${0.05 + i * 0.06}s`,
        background: glow
          ? `linear-gradient(150deg, ${VIO}1c, ${IND}0f 45%, rgba(255,255,255,.02))`
          : 'linear-gradient(150deg, rgba(255,255,255,.055), rgba(255,255,255,.015))',
        boxShadow: glow ? `0 0 60px -20px ${VIO}80` : '0 1px 2px rgba(0,0,0,.3)',
      }}
    >
      {children}
    </motion.div>
  )
}

type Status = 'RECOMMENDED' | 'PARTIAL' | 'MISSING'
const S: Record<Status, { fg: string; bg: string; bd: string; Icon: typeof CheckCircle2 }> = {
  RECOMMENDED: { fg: '#6ee7b7', bg: 'rgba(16,185,129,.12)', bd: 'rgba(16,185,129,.32)', Icon: CheckCircle2 },
  PARTIAL:     { fg: '#fcd34d', bg: 'rgba(245,158,11,.12)', bd: 'rgba(245,158,11,.32)', Icon: MinusCircle },
  MISSING:     { fg: '#fda4af', bg: 'rgba(244,63,94,.12)',  bd: 'rgba(244,63,94,.32)',  Icon: XCircle },
}
const ENGINES: { name: string; rank: string; status: Status }[] = [
  { name: 'ChatGPT',        rank: '#2',  status: 'RECOMMENDED' },
  { name: 'Gemini',         rank: '#1',  status: 'RECOMMENDED' },
  { name: 'Claude',         rank: '#4',  status: 'PARTIAL' },
  { name: 'Perplexity',     rank: 'n/a', status: 'MISSING' },
  { name: 'Google AI Mode', rank: 'n/a', status: 'MISSING' },
]

/* SOURCE_REQUIRED — unchanged from v2 and still the one blocker on this page.
   A measurement company cannot publish uncited percentages. */
const STATS = [
  { value: '73%',  label: 'of buyer research starts in an AI assistant', source: null },
  { value: '4.2x', label: 'higher conversion from a direct AI citation', source: null },
  { value: '0',    label: 'reliance on traditional search ads',          source: null },
]

export function HeroBento() {
  const [domain, setDomain] = useState('')
  const reduce = useReducedMotion()

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-[#0B0C10] text-white antialiased">
      {/* Ambient field: fixed and viewport-sized, so it can never terminate on a
          hard edge inside a max-width container. That was the exact defect in
          the live hero, where the background was bound to the text column. */}
      <div aria-hidden className="pointer-events-none fixed inset-0">
        <div
          className="absolute inset-0"
          style={{
            background:
              `radial-gradient(65% 50% at 18% 8%, ${VIO}24 0%, transparent 58%),` +
              `radial-gradient(55% 45% at 85% 62%, ${IND}1c 0%, transparent 56%)`,
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.04] mix-blend-screen"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)'/%3E%3C/svg%3E\")",
          }}
        />
      </div>

      <div className="relative mx-auto max-w-[1240px] px-5 pb-28 sm:px-8 lg:pb-24">
        {/* ── STAGE 1: the bento ───────────────────────────────────────────── */}
        <section
          className="grid grid-cols-1 gap-4 pt-14 sm:grid-cols-2 lg:grid-cols-12 lg:pt-20"
        >
          {/* Headline + CTA. The anchor tile: widest span, tallest, and the only
              one carrying the glow, so the eye has an unambiguous entry point. */}
          <Tile glow i={0} className="sm:col-span-2 lg:col-span-8 lg:row-span-2 flex flex-col justify-center p-7 sm:p-9">
            <span
              className="inline-flex w-fit items-center gap-2 rounded-full border px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em]"
              style={{ borderColor: `${VIO}5c`, background: `${VIO}18`, color: '#c4b5fd' }}
            >
              <span className="size-1.5 rounded-full" style={{ background: VIO, boxShadow: `0 0 8px ${VIO}` }} />
              AI Visibility Platform
            </span>

            <h1 className="mt-5 text-[2rem] font-extrabold leading-[1.05] tracking-[-0.032em] sm:text-[2.6rem] lg:text-[3.15rem]">
              Are AI Models Recommending{' '}
              <span className="bg-clip-text text-transparent" style={{ backgroundImage: `linear-gradient(120deg, ${VIO}, ${IND})` }}>
                Your Brand
              </span>
              , or Your Competitors?
            </h1>

            <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-slate-400">
              Audit your visibility across ChatGPT, Perplexity, Gemini and Claude in 60 seconds.
              Get actionable fixes to rank #1 in AI answers.
            </p>

            <form className="mt-7 max-w-lg" onSubmit={(e) => e.preventDefault()}>
              <div
                className="flex flex-col gap-2 rounded-2xl p-[1.5px] sm:flex-row sm:gap-0 sm:rounded-full"
                style={{ background: `linear-gradient(120deg, ${VIO}94, ${IND}6b)` }}
              >
                <input
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  placeholder="enter-your-domain.com"
                  aria-label="Your domain"
                  className="w-full rounded-[14px] bg-[#0B0C10] px-5 py-3.5 text-[15px] outline-none placeholder:text-slate-600 sm:rounded-l-full sm:rounded-r-none"
                />
                <motion.button
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  type="submit"
                  className="flex shrink-0 items-center justify-center gap-2 rounded-[14px] px-6 py-3.5 text-[15px] font-bold sm:rounded-l-none sm:rounded-r-full"
                  style={{ background: `linear-gradient(120deg, ${VIO}, ${IND})`, boxShadow: `0 0 30px ${VIO}55` }}
                >
                  Audit My AI Visibility <ArrowRight size={17} />
                </motion.button>
              </div>
            </form>

            <ul className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 text-[13px] text-slate-400">
              <li className="flex items-center gap-2"><Zap size={14} style={{ color: VIO }} /> Free instant audit</li>
              <li className="flex items-center gap-2"><Clock size={14} style={{ color: VIO }} /> 60-second scan</li>
              <li className="flex items-center gap-2"><Lock size={14} style={{ color: VIO }} /> No credit card required</li>
            </ul>
          </Tile>

          {/* Score tile. Short, so it reads as a readout rather than a panel. */}
          <Tile i={1} className="lg:col-span-4 flex items-center gap-4">
            <div className="relative grid size-[76px] shrink-0 place-items-center">
              <svg viewBox="0 0 100 100" className="absolute inset-0 -rotate-90">
                <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="8" />
                <motion.circle
                  cx="50" cy="50" r="44" fill="none" stroke={VIO} strokeWidth="8" strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 44}
                  initial={{ strokeDashoffset: 2 * Math.PI * 44 }}
                  animate={{ strokeDashoffset: 2 * Math.PI * 44 * (1 - 0.64) }}
                  transition={{ duration: reduce ? 0 : 1.1, ease: 'easeOut', delay: 0.35 }}
                />
              </svg>
              <div className="text-center leading-none">
                <div className="text-[23px] font-extrabold">64</div>
                <div className="text-[9px] text-slate-500">/100</div>
              </div>
            </div>
            <div>
              <div className="text-[13px] font-bold">AI Visibility Score</div>
              <div className="mt-1 flex items-center gap-1.5 text-[12px]" style={{ color: EM }}>
                <TrendingUp size={13} /> +8 pts vs last audit
              </div>
            </div>
          </Tile>

          {/* Engine split. Taller tile, list content. */}
          <Tile i={2} className="lg:col-span-4">
            <div className="mb-3 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">Engine Split View</div>
            <div className="space-y-1.5">
              {ENGINES.map((e) => {
                const st = S[e.status]
                return (
                  <div key={e.name} className="flex items-center gap-2 rounded-lg bg-white/[0.03] px-2.5 py-2">
                    <span className="flex-1 truncate text-[12px] font-semibold text-slate-200">{e.name}</span>
                    <span className="text-[12px] font-bold tabular-nums text-slate-500">{e.rank}</span>
                    <span
                      className="inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[9px] font-bold"
                      style={{ color: st.fg, background: st.bg, borderColor: st.bd }}
                    >
                      <st.Icon size={10} />{e.status}
                    </span>
                  </div>
                )
              })}
            </div>
          </Tile>
        </section>

        {/* ── STAGE 2 ──────────────────────────────────────────────────────── */}
        <section
          className="mt-20 lg:mt-28"
        >
          <h2
            className="bento-in mx-auto max-w-2xl text-center text-[1.55rem] font-extrabold leading-tight tracking-[-0.02em] sm:text-[2.05rem]"
          >
            When Buyers Ask AI for Recommendations, Where Do You Stand?
          </h2>

          <div className="mt-9 grid grid-cols-1 gap-4 md:grid-cols-2">
            {([
              {
                tone: 'bad' as const, label: 'Lost pipeline', Icon: TrendingDown, accent: '#f43f5e',
                lines: [
                  { t: 'Competitor A, widely cited for coverage', hl: 'them' as const },
                  { t: 'Competitor B, strong reporting features' },
                  { t: 'Competitor C, popular with agencies' },
                ],
                foot: 'Your brand is not in the answer.',
              },
              {
                tone: 'good' as const, label: 'Captured AI traffic', Icon: TrendingUp, accent: EM,
                lines: [
                  { t: 'Your brand, cited with original measurement data', hl: 'you' as const },
                  { t: 'Competitor A, widely cited for coverage' },
                  { t: 'Competitor B, strong reporting features' },
                ],
                foot: 'Cited with authority links.',
              },
            ]).map((c, ci) => (
              <Tile key={c.label} i={ci}>
                <div className="mb-3 flex items-center gap-2">
                  <c.Icon size={15} style={{ color: c.accent }} />
                  <span className="text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: c.accent }}>{c.label}</span>
                </div>
                <div className="mb-3 rounded-lg bg-white/[0.04] px-3 py-2 text-[13px] text-slate-300">
                  <span className="text-slate-500">Buyer asks:</span> What&apos;s the best AI visibility software?
                </div>
                <ol className="space-y-1.5 text-[13px]">
                  {c.lines.map((l, i) => (
                    <li
                      key={i}
                      className="flex gap-2 rounded-md px-2 py-1.5"
                      style={
                        l.hl
                          ? {
                              background: l.hl === 'you' ? 'rgba(16,185,129,.10)' : 'rgba(244,63,94,.08)',
                              color: l.hl === 'you' ? '#6ee7b7' : '#fda4af', fontWeight: 600,
                            }
                          : { color: '#94a3b8' }
                      }
                    >
                      <span className="tabular-nums opacity-60">{i + 1}.</span>{l.t}
                    </li>
                  ))}
                </ol>
                <p className="mt-3 flex items-center gap-1.5 text-[12px]" style={{ color: c.tone === 'good' ? EM : '#64748b' }}>
                  {c.tone === 'good' && <Sparkles size={12} />}{c.foot}
                </p>
              </Tile>
            ))}
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {STATS.map((s, si) => (
              <Tile key={s.value} i={si} className="text-center">
                <div
                  className="bg-clip-text text-[2rem] font-extrabold tracking-tight text-transparent"
                  style={{ backgroundImage: `linear-gradient(120deg, ${VIO}, ${IND})` }}
                >
                  {s.value}
                </div>
                <div className="mt-1.5 text-[13px] leading-snug text-slate-400">{s.label}</div>
                {!s.source && (
                  <div className="mt-2 text-[10px] uppercase tracking-wider text-amber-500/70">source required before publish</div>
                )}
              </Tile>
            ))}
          </div>
        </section>
      </div>

      {/* Mobile thumb-zone CTA */}
      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-[#0B0C10]/95 p-3 backdrop-blur-lg lg:hidden">
        <button
          className="flex w-full items-center justify-center gap-2 rounded-full py-3.5 text-[15px] font-bold"
          style={{ background: `linear-gradient(120deg, ${VIO}, ${IND})` }}
        >
          Audit My AI Visibility <ArrowRight size={17} />
        </button>
      </div>
    </div>
  )
}
