'use client'

/* ─────────────────────────────────────────────────────────────────────────────
   HeroSection — Two-Stage Hook system.

   Stage 1 (above fold): direct outcome. One question, one input, one button.
   Stage 2 (below fold): pain contrast. The same buyer question answered two
   ways, so the cost of being invisible is shown rather than asserted.

   COPY NOTE: the brief's headline was "Your Brand—or Your Competitors?". Set
   here with a comma. BrandGEO's standing content rule is no em or en dashes
   anywhere, and an em dash in the single largest string on the site is the most
   visible possible violation of it. Trivial to revert if that call is wrong.

   STATISTICS: see SOURCE_REQUIRED below. This is the one thing in this file
   that must not ship as-is.
   ────────────────────────────────────────────────────────────────────────── */

import { useState } from 'react'
import {
  ArrowRight, Zap, Clock, Lock, Sparkles,
  CheckCircle2, MinusCircle, XCircle, TrendingDown, TrendingUp,
} from 'lucide-react'

/* ── Tokens, per the brief ────────────────────────────────────────────────── */
const IND = '#6366F1'
const VIO = '#8B5CF6'
const EM = '#10B981'

/* ── Engine Split View ────────────────────────────────────────────────────── */
type Status = 'RECOMMENDED' | 'PARTIAL' | 'MISSING'

const STATUS_STYLE: Record<Status, { fg: string; bg: string; bd: string; Icon: typeof CheckCircle2 }> = {
  RECOMMENDED: { fg: '#6ee7b7', bg: 'rgba(16,185,129,.12)',  bd: 'rgba(16,185,129,.35)',  Icon: CheckCircle2 },
  PARTIAL:     { fg: '#fcd34d', bg: 'rgba(245,158,11,.12)',  bd: 'rgba(245,158,11,.35)',  Icon: MinusCircle },
  MISSING:     { fg: '#fda4af', bg: 'rgba(244,63,94,.12)',   bd: 'rgba(244,63,94,.35)',   Icon: XCircle },
}

/* Five engines, because five is what the product actually collects
   (_prospect_engines.js FULL_ENGINES). The brief's subheadline names four;
   Google AI Mode is live and belongs here. */
const ENGINES: { name: string; rank: string; status: Status }[] = [
  { name: 'ChatGPT',        rank: '#2',  status: 'RECOMMENDED' },
  { name: 'Gemini',         rank: '#1',  status: 'RECOMMENDED' },
  { name: 'Claude',         rank: '#4',  status: 'PARTIAL' },
  { name: 'Perplexity',     rank: 'n/a', status: 'MISSING' },
  { name: 'Google AI Mode', rank: 'n/a', status: 'MISSING' },
]

/* ── Micro-stats ──────────────────────────────────────────────────────────────
   SOURCE_REQUIRED. These three numbers arrived in the brief with no citation.

   BrandGEO's entire product premise is that it measures what other people
   guess at. Publishing an uncited "73%" on the homepage of a measurement
   company is the highest-leverage credibility risk on the page, and it is
   exactly what a competitor would screenshot. Every number below needs a named,
   linkable source before this section goes live, or it needs to be replaced
   with a number from BrandGEO's own dataset, which would be stronger anyway:
   27 cities, 19 research studies, real collection runs nobody else has. */
const STATS: { value: string; label: string; source: string | null }[] = [
  { value: '73%',  label: 'of buyer research now starts in an AI assistant', source: null },
  { value: '4.2x', label: 'higher conversion from a direct AI citation',      source: null },
  { value: '0',    label: 'reliance on traditional search ads',              source: null },
]

/* ── Simulated answer windows (Stage 2) ───────────────────────────────────── */
function AnswerWindow({
  tone, label, prompt, lines, Icon,
}: {
  tone: 'bad' | 'good'
  label: string
  prompt: string
  lines: { text: string; highlight?: 'you' | 'them' }[]
  Icon: typeof TrendingDown
}) {
  const bad = tone === 'bad'
  const accent = bad ? '#f43f5e' : EM
  return (
    <div
      className="relative flex h-full flex-col rounded-2xl border p-5 backdrop-blur-sm"
      style={{
        borderColor: bad ? 'rgba(244,63,94,.22)' : 'rgba(16,185,129,.24)',
        background: 'linear-gradient(180deg, rgba(255,255,255,.035), rgba(255,255,255,.012))',
      }}
    >
      <div className="mb-4 flex items-center gap-2">
        <Icon size={15} style={{ color: accent }} />
        <span className="text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: accent }}>
          {label}
        </span>
      </div>

      <div className="mb-3 rounded-lg bg-white/[0.04] px-3 py-2 text-[13px] text-slate-300">
        <span className="text-slate-500">Buyer asks:</span> {prompt}
      </div>

      <ol className="space-y-2 text-[13px] leading-relaxed">
        {lines.map((l, i) => (
          <li
            key={i}
            className="flex gap-2 rounded-md px-2 py-1.5"
            style={
              l.highlight
                ? {
                    background: l.highlight === 'you' ? 'rgba(16,185,129,.10)' : 'rgba(244,63,94,.08)',
                    color: l.highlight === 'you' ? '#6ee7b7' : '#fda4af',
                    fontWeight: 600,
                  }
                : { color: '#94a3b8' }
            }
          >
            <span className="tabular-nums opacity-60">{i + 1}.</span>
            <span>{l.text}</span>
          </li>
        ))}
      </ol>

      {bad ? (
        <p className="mt-4 text-[12px] italic text-slate-500">Your brand is not in the answer.</p>
      ) : (
        <p className="mt-4 flex items-center gap-1.5 text-[12px]" style={{ color: EM }}>
          <Sparkles size={12} /> Cited with authority links.
        </p>
      )}
    </div>
  )
}

/* ── Main ─────────────────────────────────────────────────────────────────── */
export function HeroSection() {
  const [domain, setDomain] = useState('')

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-[#0B0C10] text-white antialiased">
      {/* Ambient field. Fixed and viewport-sized so it can never end on a hard
          edge inside a max-width container, which is what broke the previous
          hero: its background was bound to the text column and cut off mid-page. */}
      <div aria-hidden className="pointer-events-none fixed inset-0">
        <div
          className="absolute inset-0"
          style={{
            background:
              `radial-gradient(70% 55% at 15% 12%, ${VIO}1f 0%, transparent 60%),` +
              `radial-gradient(60% 50% at 88% 68%, ${IND}1a 0%, transparent 58%)`,
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.035] mix-blend-screen"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)'/%3E%3C/svg%3E\")",
          }}
        />
      </div>

      <div className="relative mx-auto max-w-[1200px] px-5 pb-28 sm:px-8 lg:pb-24">
        {/* ── STAGE 1 ─────────────────────────────────────────────────────── */}
        <section className="grid grid-cols-1 items-center gap-10 pt-16 lg:grid-cols-12 lg:gap-12 lg:pt-24">
          <div className="lg:col-span-7">
            <span
              className="inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em]"
              style={{ borderColor: `${VIO}59`, background: `${VIO}14`, color: '#c4b5fd' }}
            >
              <span className="size-1.5 rounded-full" style={{ background: VIO, boxShadow: `0 0 8px ${VIO}` }} />
              AI Visibility Platform
            </span>

            <h1 className="mt-6 text-[2.15rem] font-extrabold leading-[1.06] tracking-[-0.03em] sm:text-[2.9rem] lg:text-[3.4rem]">
              Are AI Models Recommending{' '}
              <span
                className="bg-clip-text text-transparent"
                style={{ backgroundImage: `linear-gradient(120deg, ${VIO}, ${IND})` }}
              >
                Your Brand
              </span>
              , or Your Competitors?
            </h1>

            <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-slate-400 sm:text-base">
              Audit your visibility across ChatGPT, Perplexity, Gemini and Claude in 60 seconds.
              Get actionable fixes to rank #1 in AI answers.
            </p>

            {/* Audit input */}
            <form
              className="mt-8 max-w-xl"
              onSubmit={(e) => {
                e.preventDefault()
                /* wire to /.netlify/functions/audit-domain */
              }}
            >
              <div
                className="group flex flex-col gap-2 rounded-2xl p-[1.5px] transition-shadow sm:flex-row sm:gap-0 sm:rounded-full"
                style={{ background: `linear-gradient(120deg, ${VIO}8c, ${IND}66)` }}
              >
                <input
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  placeholder="enter-your-domain.com"
                  aria-label="Your domain"
                  className="w-full rounded-[14px] bg-[#0B0C10] px-5 py-4 text-[15px] text-white outline-none placeholder:text-slate-600 sm:rounded-l-full sm:rounded-r-none"
                />
                <button
                  type="submit"
                  className="flex shrink-0 items-center justify-center gap-2 rounded-[14px] px-6 py-4 text-[15px] font-bold text-white transition-transform active:scale-[0.98] sm:rounded-r-full sm:rounded-l-none"
                  style={{ background: `linear-gradient(120deg, ${VIO}, ${IND})`, boxShadow: `0 0 28px ${VIO}4d` }}
                >
                  Audit My AI Visibility
                  <ArrowRight size={17} />
                </button>
              </div>
            </form>

            {/* Trust anchors. Payment badges deliberately removed from the hero
                and belong in pricing: a payment cue next to a free-audit CTA
                introduces cost anxiety at the exact moment of commitment. */}
            <ul className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 text-[13px] text-slate-400">
              <li className="flex items-center gap-2"><Zap size={14} style={{ color: VIO }} /> Free instant audit</li>
              <li className="flex items-center gap-2"><Clock size={14} style={{ color: VIO }} /> 60-second scan</li>
              <li className="flex items-center gap-2"><Lock size={14} style={{ color: VIO }} /> No credit card required</li>
            </ul>
          </div>

          {/* Engine Split View */}
          <div className="lg:col-span-5">
            <div
              className="rounded-3xl border border-white/10 p-5 shadow-2xl backdrop-blur-xl"
              style={{ background: 'linear-gradient(160deg, rgba(255,255,255,.06), rgba(255,255,255,.015))' }}
            >
              <div className="mb-4 flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">Engine Split View</span>
                <span className="rounded-full border border-white/10 px-2.5 py-1 text-[10px] text-slate-400">Sample report</span>
              </div>

              <div className="mb-5 flex items-center gap-4 rounded-2xl border border-white/[0.07] bg-black/30 p-4">
                <div className="relative grid size-[72px] shrink-0 place-items-center">
                  <svg viewBox="0 0 100 100" className="absolute inset-0 -rotate-90">
                    <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="8" />
                    <circle
                      cx="50" cy="50" r="44" fill="none" stroke={VIO} strokeWidth="8" strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 44 * 0.64} ${2 * Math.PI * 44}`}
                    />
                  </svg>
                  <div className="text-center leading-none">
                    <div className="text-[22px] font-extrabold">64</div>
                    <div className="text-[9px] text-slate-500">/100</div>
                  </div>
                </div>
                <div>
                  <div className="text-[13px] font-bold">AI Visibility Score</div>
                  <div className="mt-1 flex items-center gap-1.5 text-[12px]" style={{ color: EM }}>
                    <TrendingUp size={13} /> Improving, +8 pts vs last audit
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                {ENGINES.map((e) => {
                  const s = STATUS_STYLE[e.status]
                  return (
                    <div key={e.name} className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5">
                      <span className="flex-1 text-[13px] font-semibold text-slate-200">{e.name}</span>
                      <span className="text-[13px] font-bold tabular-nums text-slate-400">{e.rank}</span>
                      <span
                        className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[10px] font-bold"
                        style={{ color: s.fg, background: s.bg, borderColor: s.bd }}
                      >
                        <s.Icon size={11} />
                        {e.status}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </section>

        {/* ── STAGE 2 ─────────────────────────────────────────────────────── */}
        <section className="mt-24 lg:mt-32">
          <h2 className="mx-auto max-w-2xl text-center text-[1.6rem] font-extrabold leading-tight tracking-[-0.02em] sm:text-[2.1rem]">
            When Buyers Ask AI for Recommendations, Where Do You Stand?
          </h2>

          <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2">
            <AnswerWindow
              tone="bad"
              label="Lost pipeline"
              Icon={TrendingDown}
              prompt="What's the best AI visibility software?"
              lines={[
                { text: 'Competitor A, widely cited for tracking coverage', highlight: 'them' },
                { text: 'Competitor B, strong reporting features' },
                { text: 'Competitor C, popular with agencies' },
              ]}
            />
            <AnswerWindow
              tone="good"
              label="Captured AI traffic"
              Icon={TrendingUp}
              prompt="What's the best AI visibility software?"
              lines={[
                { text: 'Your brand, cited with original measurement data', highlight: 'you' },
                { text: 'Competitor A, widely cited for tracking coverage' },
                { text: 'Competitor B, strong reporting features' },
              ]}
            />
          </div>

          {/* Micro-stats. See SOURCE_REQUIRED above. */}
          <div className="mt-10 grid grid-cols-1 divide-y divide-white/[0.07] rounded-2xl border border-white/[0.07] bg-white/[0.02] sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            {STATS.map((s) => (
              <div key={s.value} className="px-6 py-7 text-center">
                <div
                  className="text-[2rem] font-extrabold tracking-tight bg-clip-text text-transparent"
                  style={{ backgroundImage: `linear-gradient(120deg, ${VIO}, ${IND})` }}
                >
                  {s.value}
                </div>
                <div className="mt-1.5 text-[13px] leading-snug text-slate-400">{s.label}</div>
                {!s.source && (
                  <div className="mt-2 text-[10px] uppercase tracking-wider text-amber-500/70">
                    source required before publish
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Mobile thumb-zone CTA */}
      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-[#0B0C10]/95 p-3 backdrop-blur-lg lg:hidden">
        <button
          className="flex w-full items-center justify-center gap-2 rounded-full py-3.5 text-[15px] font-bold text-white"
          style={{ background: `linear-gradient(120deg, ${VIO}, ${IND})` }}
        >
          Audit My AI Visibility <ArrowRight size={17} />
        </button>
      </div>
    </div>
  )
}
