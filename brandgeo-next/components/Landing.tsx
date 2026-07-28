'use client'

/* ─────────────────────────────────────────────────────────────────────────────
   Landing — full continuous-scroll page in the reference's visual language.

   Structure taken from the supplied design: layered floating cards in the hero,
   ambient orbs bleeding off both page edges, centered eyebrow/title/subtitle
   section headers, icon tiles with coloured glows, and a long single-column
   scroll rhythm.

   TWO DELIBERATE DEPARTURES FROM THE REFERENCE

   1. The logo cloud shows the AI ENGINES BrandGEO monitors, not customer logos.
      The reference runs Google, Airbnb, Shopify and Amazon as implied customers.
      BrandGEO has none of them, and fabricated social proof on the homepage of a
      company that sells measurement is the one thing a competitor would
      screenshot. The engine strip is honest and closer to the product anyway.

   2. Motion is CSS transform only, never opacity.
      Measured 2026-07-28: a Framer Motion initial/animate entrance left every
      tile AND the copy at opacity 0 in a backgrounded tab, because Motion drives
      transitions from requestAnimationFrame, which is suspended there. A
      setTimeout failsafe does not fix it. Neither does a CSS opacity keyframe
      with fill-mode backwards, which holds the from-state through the delay.
      Animating transform alone keeps the base style readable, so if the
      animation never runs the page is simply static. Enhancement, not gating.
   ────────────────────────────────────────────────────────────────────────── */

import { useState } from 'react'
import {
  ArrowRight, Zap, Clock, Lock, Check, TrendingUp, TrendingDown,
  Search, Radar, LineChart, ShieldCheck, Sparkles, FileText,
} from 'lucide-react'

const VIO = '#8B5CF6'
const IND = '#6366F1'
const EM = '#10B981'
const BG = '#08080F'

/* ── Primitives ───────────────────────────────────────────────────────────── */
function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[11px] font-bold uppercase tracking-[0.22em]" style={{ color: '#8b8bd6' }}>
      {children}
    </div>
  )
}

function SectionHead({ eyebrow, title, sub }: { eyebrow: string; title: string; sub?: string }) {
  return (
    <div className="rise mx-auto mb-12 max-w-2xl text-center">
      <Eyebrow>{eyebrow}</Eyebrow>
      <h2 className="mt-3 text-[1.75rem] font-extrabold tracking-[-0.025em] sm:text-[2.3rem]">{title}</h2>
      {sub && <p className="mt-3 text-[14px] leading-relaxed text-ink-2">{sub}</p>}
    </div>
  )
}

function Card({
  children, className = '', delay = 0, tint,
}: { children: React.ReactNode; className?: string; delay?: number; tint?: string }) {
  return (
    <div
      className={`rise glass rounded-2xl border border-hairline p-6 ${className}`}
      style={{
        animationDelay: `${delay}s`,
        background: tint
          ? `linear-gradient(160deg, ${tint}18, rgba(255,255,255,.015))`
          : 'linear-gradient(160deg, rgba(255,255,255,.045), rgba(255,255,255,.012))',
      }}
    >
      {children}
    </div>
  )
}

function IconTile({ Icon, colour }: { Icon: typeof Radar; colour: string }) {
  return (
    <div
      className="mb-4 grid size-11 place-items-center rounded-xl border"
      style={{ borderColor: `${colour}44`, background: `${colour}1a`, boxShadow: `0 0 24px -8px ${colour}` }}
    >
      <Icon size={18} style={{ color: colour }} />
    </div>
  )
}

/* ── Data ─────────────────────────────────────────────────────────────────── */
const ENGINES = ['ChatGPT', 'Gemini', 'Claude', 'Perplexity', 'Google AI Mode']

const SOLUTIONS = [
  { Icon: Search,      c: '#8B5CF6', t: 'Prompt-level tracking',   d: 'See the exact buyer questions where you appear, and the ones where you never do.' },
  { Icon: Radar,       c: '#6366F1', t: 'Competitor share',        d: 'Who the models name instead of you, ranked, per prompt and per engine.' },
  { Icon: LineChart,   c: '#10B981', t: 'Visibility over time',    d: 'A score that moves when your position moves, not a vanity metric.' },
  { Icon: FileText,    c: '#f59e0b', t: 'Citation sources',        d: 'The pages models actually cite when they answer about your category.' },
  { Icon: ShieldCheck, c: '#06b6d4', t: 'Five live engines',       d: 'ChatGPT, Gemini, Claude, Perplexity and Google AI Mode, collected on schedule.' },
  { Icon: Sparkles,    c: '#ec4899', t: 'Prioritised fixes',       d: 'A P0/P1/P2 list tied to the prompts costing you the most pipeline.' },
]

const PLANS = [
  { name: 'Essentials', price: '€99',  per: '/mo', feats: ['30 prompts', 'ChatGPT, Gemini, Claude', 'Weekly refresh', 'CSV export'], hot: false },
  { name: 'Growth',     price: '€299', per: '/mo', feats: ['75 prompts', 'All five live engines', 'Competitor tracking', 'Onboarding call'], hot: true },
  { name: 'Growth PRO', price: '€449', per: '/mo', feats: ['100 prompts', 'Faster refresh cycle', 'AI SEO: 30 pages', 'AI Social: 3 channels'], hot: false },
]

/* SOURCE_REQUIRED. Uncited numbers must not ship on a measurement company's
   homepage. Replace with figures from BrandGEO's own dataset, which is stronger
   evidence than a third-party statistic anyone can also quote. */
const STATS = [
  { v: '73%',  l: 'of buyer research starts in an AI assistant' },
  { v: '4.2x', l: 'higher conversion from a direct AI citation' },
  { v: '27',   l: 'cities measured in our own published research' },
]

export function Landing() {
  const [domain, setDomain] = useState('')

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden text-ink antialiased" style={{ background: BG }}>
      {/* Ambient orbs, bleeding off BOTH page edges. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="orb orb-drift" style={{ width: 620, height: 620, left: -280, top: 120, background: `${VIO}2e` }} />
        <div className="orb orb-drift2" style={{ width: 560, height: 560, right: -260, top: 480, background: `${IND}26` }} />
        <div className="orb orb-drift2" style={{ width: 700, height: 700, left: -320, top: 1600, background: `${IND}1f` }} />
        <div className="orb orb-drift" style={{ width: 620, height: 620, right: -300, top: 2400, background: `${VIO}24` }} />
      </div>

      <div className="relative">
        {/* ── NAV ────────────────────────────────────────────────────────── */}
        <nav className="mx-auto flex max-w-[1180px] items-center justify-between px-6 py-6">
          <div className="flex items-center gap-2">
            <div className="grid size-7 place-items-center rounded-lg" style={{ background: `linear-gradient(135deg, ${VIO}, ${IND})` }}>
              <span className="text-[13px] font-black">b</span>
            </div>
            <span className="text-[17px] font-bold tracking-tight">BrandGEO</span>
          </div>
          <ul className="hidden items-center gap-8 text-[13px] text-ink-2 md:flex">
            {['How it works', 'Pricing', 'Research', 'FAQ'].map((x) => (
              <li key={x} className="cursor-pointer transition-colors hover:text-ink">{x}</li>
            ))}
          </ul>
          <button className="rounded-lg px-4 py-2 text-[13px] font-bold" style={{ background: `linear-gradient(135deg, ${VIO}, ${IND})` }}>
            Free audit
          </button>
        </nav>

        {/* ── HERO ───────────────────────────────────────────────────────── */}
        <header className="mx-auto grid max-w-[1180px] grid-cols-1 items-center gap-12 px-6 pb-20 pt-12 lg:grid-cols-2 lg:pt-20">
          <div className="rise">
            <Eyebrow>AI Visibility Platform</Eyebrow>
            {/* Short. Measured across 9 AI SaaS leaders 2026-07-28, hero headlines
                run 3 to 6 words: Harvey "Practice Made Perfect", ElevenLabs
                "Bringing technology to life", Clay "Build systems to grow
                revenue", Sierra "Better outcomes. Built on Sierra." Ours was 9
                words with a comma and a question mark. The question moves into
                the subheadline, where it still does its job. */}
            <h1 className="mt-4 text-[2.5rem] font-extrabold leading-[1.05] tracking-[-0.035em] sm:text-[3.2rem] lg:text-[3.6rem]">
              Win the{' '}
              <span className="bg-clip-text text-transparent" style={{ backgroundImage: `linear-gradient(120deg, ${VIO}, ${IND})` }}>
                AI answer
              </span>
            </h1>
            <p className="mt-5 max-w-md text-[14.5px] leading-relaxed text-ink-2">
              When buyers ask AI for a recommendation, are they hearing your name or your
              competitor&apos;s? Audit five engines in 60 seconds and get the fixes.
            </p>

            <form className="mt-8 max-w-md" onSubmit={(e) => e.preventDefault()}>
              <div className="flex flex-col gap-2 rounded-2xl p-[1.5px] sm:flex-row sm:gap-0 sm:rounded-full"
                   style={{ background: `linear-gradient(120deg, ${VIO}8c, ${IND}5c)` }}>
                <input
                  value={domain} onChange={(e) => setDomain(e.target.value)}
                  placeholder="enter-your-domain.com" aria-label="Your domain"
                  className="w-full rounded-[14px] px-5 py-3.5 text-[14.5px] outline-none placeholder:text-ink-3 sm:rounded-l-full sm:rounded-r-none"
                  style={{ background: BG }}
                />
                <button type="submit"
                  className="relative flex shrink-0 items-center justify-center gap-2 overflow-hidden rounded-[14px] px-6 py-3.5 text-[14.5px] font-bold transition-transform active:scale-[0.98] sm:rounded-l-none sm:rounded-r-full"
                  style={{ background: `linear-gradient(120deg, ${VIO}, ${IND})`, boxShadow: `0 0 30px ${VIO}4d` }}>
                  {/* Shimmer sweep, the technique Linear and Cursor put on primary
                      actions. Pointer-events-none so it never eats the click. */}
                  <span aria-hidden className="shimmer-edge pointer-events-none absolute inset-0 opacity-40" />
                  <span className="relative flex items-center gap-2">Audit my AI visibility <ArrowRight size={16} /></span>
                </button>
              </div>
            </form>

            <ul className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-[12.5px] text-ink-2">
              <li className="flex items-center gap-1.5"><Zap size={13} style={{ color: VIO }} /> Free instant audit</li>
              <li className="flex items-center gap-1.5"><Clock size={13} style={{ color: VIO }} /> 60-second scan</li>
              <li className="flex items-center gap-1.5"><Lock size={13} style={{ color: VIO }} /> No credit card</li>
            </ul>
          </div>

          {/* HERO VISUAL: a streaming AI answer.

              Every leader surveyed puts the actual product in the hero, never
              abstract art. Cursor ships an interactive demo, Peec shows a real
              dashboard with a named customer's data, Synthesia shows the editor.
              The three overlapping mock cards this replaces were decoration, and
              they measured 27.9% mutual occlusion before I separated them.

              This is the product's core moment: an AI answering a buyer, with
              the brand appearing in it. streamWord reveals it word by word so it
              reads as generated rather than printed, which is the one thing a
              static screenshot cannot convey. */}
          <div className="relative">
            <div className="rise glass relative overflow-hidden rounded-2xl border border-hairline-strong p-5"
                 style={{ animationDelay: '.1s', background: 'linear-gradient(160deg, rgba(255,255,255,.07), rgba(255,255,255,.02))', boxShadow: `0 40px 90px -40px ${VIO}` }}>

              <div className="mb-4 flex items-center justify-between">
                <div className="flex gap-1.5">
                  {['ChatGPT', 'Gemini', 'Claude'].map((e, i) => (
                    <span key={e}
                      className="rounded-md px-2.5 py-1 text-[11px] font-semibold"
                      style={i === 0
                        ? { background: `${VIO}26`, color: '#c4b5fd', border: `1px solid ${VIO}4d` }
                        : { background: 'rgba(255,255,255,.04)', color: '#64748b', border: '1px solid rgba(255,255,255,.06)' }}>
                      {e}
                    </span>
                  ))}
                </div>
                <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-ink-3">
                  <span className="pulse-emit relative inline-block size-1.5 rounded-full" style={{ color: EM, background: EM }} />
                  live
                </span>
              </div>

              <div className="rounded-lg bg-surface-2 px-3 py-2 text-[12.5px] text-ink-2">
                <span className="text-ink-3">Buyer:</span> best AI visibility software?
              </div>

              <div className="mt-3 space-y-1.5 text-[13px] leading-relaxed">
                {[
                  { n: 1, words: ['Profound,', 'strong', 'enterprise', 'analytics'], me: false },
                  { n: 2, words: ['BrandGEO,', 'cited', 'for', 'original', 'measured', 'research'], me: true },
                  { n: 3, words: ['Peec', 'AI,', 'popular', 'with', 'smaller', 'teams'], me: false },
                ].map((row, ri) => (
                  <div key={row.n}
                       className="flex flex-wrap gap-x-1 rounded-md px-2 py-1.5"
                       style={row.me
                         ? { background: `${VIO}1f`, border: `1px solid ${VIO}3d` }
                         : {}}>
                    <span className="tabular-nums text-ink-3">{row.n}.</span>
                    {row.words.map((w, wi) => (
                      <span key={wi} className="stream-word"
                            style={{
                              animationDelay: `${0.25 + ri * 0.22 + wi * 0.05}s`,
                              color: row.me ? '#ddd6fe' : 'var(--color-ink-2)',
                              fontWeight: row.me ? 600 : 400,
                            }}>
                        {w}
                      </span>
                    ))}
                  </div>
                ))}
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-hairline pt-3">
                <span className="text-[11px] text-ink-3">Your position</span>
                <span className="flex items-center gap-2">
                  <span className="text-[19px] font-extrabold" style={{ color: '#c4b5fd' }}>#2</span>
                  <span className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold"
                        style={{ background: `${EM}1f`, color: '#6ee7b7' }}>
                    <TrendingUp size={10} /> +8
                  </span>
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* ── ENGINE STRIP (not fake customer logos) ─────────────────────── */}
        <section className="mx-auto max-w-[1180px] px-6 pb-20">
          {/* Masked marquee. mask-image: linear-gradient(to right, transparent,
              black 12%, black 88%, transparent) is how the reference sites end a
              scroller without a hard cut. Track is duplicated so the -50%
              translate loops seamlessly. */}
          <div className="rise border-t border-hairline py-7">
            <div className="marquee-mask overflow-hidden">
              <div className="marquee-track flex w-max items-center gap-10">
                {[...ENGINES, ...ENGINES, ...ENGINES, ...ENGINES].map((e, i) => (
                  <span key={i} className="whitespace-nowrap text-[15px] font-semibold text-ink-3">{e}</span>
                ))}
              </div>
            </div>
          </div>

          {/* PROOF SLOT. Every leader surveyed fills this position with customer
              logos or named testimonials: ElevenLabs 18 logos, Sierra 28, Harvey
              23, Glean, Synthesia "90% of Fortune 100", Cursor video quotes from
              Huang/Karpathy/Collison/Brockman.

              BrandGEO has no logos to show and will not borrow anyone's. What it
              has that none of those competitors do is its OWN published
              measurement. Proof of capability instead of proof of adoption, and
              every number here is verifiable on the site today. */}
          <div className="rise grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-hairline bg-surface-2 sm:grid-cols-4"
               style={{ animationDelay: '.08s' }}>
            {[
              { v: '27', l: 'cities measured' },
              { v: '19', l: 'studies published' },
              { v: '5', l: 'engines collected' },
              { v: '60s', l: 'to your first score' },
            ].map((x) => (
              <div key={x.l} className="px-5 py-6 text-center" style={{ background: BG }}>
                <div className="text-[1.7rem] font-extrabold bg-clip-text text-transparent"
                     style={{ backgroundImage: `linear-gradient(120deg, ${VIO}, ${IND})` }}>{x.v}</div>
                <div className="mt-1 text-[12px] text-ink-3">{x.l}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── SOLUTIONS ──────────────────────────────────────────────────── */}
        <section className="mx-auto max-w-[1180px] px-6 pb-24">
          <SectionHead
            eyebrow="Features"
            title="Our solutions"
            sub="Everything you need to find out where AI answers place you, and what to change."
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {SOLUTIONS.map((s, i) => (
              <Card key={s.t} delay={i * 0.06} tint={i === 1 ? s.c : undefined}>
                <IconTile Icon={s.Icon} colour={s.c} />
                <div className="text-[16px] font-bold">{s.t}</div>
                <p className="mt-2 text-[13px] leading-relaxed text-ink-2">{s.d}</p>
              </Card>
            ))}
          </div>
        </section>

        {/* ── CONTRAST ───────────────────────────────────────────────────── */}
        <section className="mx-auto max-w-[1180px] px-6 pb-24">
          <SectionHead
            eyebrow="The gap"
            title="When buyers ask AI, where do you stand?"
          />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {[
              { bad: true, label: 'Lost pipeline', Icon: TrendingDown, c: '#f43f5e',
                rows: [['Competitor A, widely cited', true], ['Competitor B, strong reporting', false], ['Competitor C, agency favourite', false]] as [string, boolean][] },
              { bad: false, label: 'Captured AI traffic', Icon: TrendingUp, c: EM,
                rows: [['Your brand, cited with your own data', true], ['Competitor A, widely cited', false], ['Competitor B, strong reporting', false]] as [string, boolean][] },
            ].map((c, i) => (
              <Card key={c.label} delay={i * 0.08}>
                <div className="mb-3 flex items-center gap-2">
                  <c.Icon size={15} style={{ color: c.c }} />
                  <span className="text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: c.c }}>{c.label}</span>
                </div>
                <div className="mb-3 rounded-lg bg-surface-2 px-3 py-2 text-[12.5px] text-ink-2">
                  <span className="text-ink-3">Buyer asks:</span> best AI visibility software?
                </div>
                <ol className="space-y-1.5 text-[12.5px]">
                  {c.rows.map(([t, hl], j) => (
                    <li key={j} className="flex gap-2 rounded-md px-2 py-1.5"
                        style={hl
                          ? { background: c.bad ? 'rgba(244,63,94,.08)' : 'rgba(16,185,129,.10)', color: c.bad ? '#fda4af' : '#6ee7b7', fontWeight: 600 }
                          : { color: '#94a3b8' }}>
                      <span className="tabular-nums opacity-60">{j + 1}.</span>{t}
                    </li>
                  ))}
                </ol>
              </Card>
            ))}
          </div>
        </section>

        {/* ── PRICING ────────────────────────────────────────────────────── */}
        <section className="mx-auto max-w-[1180px] px-6 pb-24">
          <SectionHead eyebrow="Pricing" title="Rate plan" sub="Self-serve tiers. Managed engagements start from €1,500 per month." />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {PLANS.map((p, i) => (
              <Card key={p.name} delay={i * 0.07} tint={p.hot ? VIO : undefined}
                    className={p.hot ? 'ring-1' : ''}>
                <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-ink-3">{p.name}</div>
                <div className="mt-2 flex items-end gap-1">
                  <span className="text-[30px] font-extrabold" style={{ color: p.hot ? '#c4b5fd' : '#fff' }}>{p.price}</span>
                  <span className="pb-1.5 text-[12px] text-ink-3">{p.per}</span>
                </div>
                <ul className="mt-5 space-y-2">
                  {p.feats.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-[13px] text-ink-2">
                      <Check size={14} className="mt-0.5 shrink-0" style={{ color: EM }} />{f}
                    </li>
                  ))}
                </ul>
                <button className="mt-6 w-full rounded-lg py-2.5 text-[13px] font-bold"
                        style={p.hot
                          ? { background: `linear-gradient(120deg, ${VIO}, ${IND})` }
                          : { background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)' }}>
                  Choose plan
                </button>
              </Card>
            ))}
          </div>
        </section>

        {/* ── STATS BAND ─────────────────────────────────────────────────── */}
        <section className="mx-auto max-w-[1180px] px-6 pb-24">
          <div className="rise grid grid-cols-1 gap-6 rounded-3xl border border-hairline p-9 sm:grid-cols-3"
               style={{ background: `linear-gradient(140deg, ${VIO}14, rgba(255,255,255,.015))` }}>
            {STATS.map((s, i) => (
              <div key={s.v} className="text-center">
                <div className="text-[2.2rem] font-extrabold bg-clip-text text-transparent"
                     style={{ backgroundImage: `linear-gradient(120deg, ${VIO}, ${IND})` }}>{s.v}</div>
                <div className="mt-1 text-[13px] text-ink-2">{s.l}</div>
                {i < 2 && (
                  <div className="mt-2 text-[10px] uppercase tracking-wider text-amber-500/70">source required</div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ── HOW IT WORKS ───────────────────────────────────────────────── */}
        <section className="mx-auto max-w-[1180px] px-6 pb-28">
          <SectionHead eyebrow="Process" title="How it works" />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {[
              { c: '#ec4899', t: 'Enter your domain', d: 'No signup, no card. The scan starts immediately.' },
              { c: '#6366F1', t: 'We ask the engines', d: 'Real buyer prompts fired at five live AI engines.' },
              { c: '#10B981', t: 'You get the fixes', d: 'Score, per-engine breakdown, prioritised actions.' },
            ].map((s, i) => (
              <Card key={s.t} delay={i * 0.08} className="relative overflow-hidden pt-10">
                <div className="absolute inset-x-0 top-0 h-24" style={{ background: `radial-gradient(60% 100% at 50% 0%, ${s.c}40, transparent 70%)` }} />
                <div className="relative text-[11px] font-bold" style={{ color: s.c }}>STEP {i + 1}</div>
                <div className="relative mt-1.5 text-[16px] font-bold">{s.t}</div>
                <p className="relative mt-2 text-[13px] leading-relaxed text-ink-2">{s.d}</p>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
