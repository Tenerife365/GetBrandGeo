/**
 * P1EngineLadder
 *
 * Pillar:      P1, two engines shipped, two turned down
 * Funnel:      TOFU (drives Short 7a), reusable as a MOFU insert in 7e section 6
 * Driver:      Contrarian (SKILL.md section 3)
 * Serves:      docs/growth/2026-07-29-four-pillar-distribution/07-youtube.md
 *              asset 7a, beat 24.0s to 34.0s
 *
 * THE REAL NUMBER THIS ANIMATES
 * The engine count per plan tier: 1, 2, 3, 5, 7.
 * Source: brandgeo-dashboard/src/lib/planConfig.ts PLAN_ENGINES and PLAN_ORDER,
 * read 2026-07-31. Read the CODE, not 00-BRIEF.md: that brief pinned a ladder of
 * "free: ChatGPT. essentials: + Gemini, Claude. growth: ... (5). growth_pro and
 * managed: ... (7)" which was true on 2026-07-29 and went stale on 2026-07-31.
 *
 * CORRECTED 2026-07-31, two defects, both of which shipped into the first render:
 *   1. Free ran ChatGPT. It does not. PLAN_ENGINES.free is ['gemini'] as of
 *      decision 1b: five chatgpt prompts bill about EUR 0.540 against a EUR 0.30
 *      free budget, so a free signup hit a budget error partway through its own
 *      first collection. Five gemini prompts cost EUR 0.160 and fit. The count
 *      stayed 1, which is exactly why counting engines did not catch this and a
 *      check has to read the NAME.
 *   2. Radar did not exist here. PLAN_ORDER is
 *      free, radar, essentials, growth, growth_pro, managed, pro, enterprise.
 *      PLAN_ENGINES.radar is ['gemini','claude'], a strict superset of free, so
 *      nobody pays EUR 29 and loses an engine. That makes the ladder five rungs.
 *   Consequence of 2: Essentials no longer ADDS Gemini and Claude, because Radar
 *   already carries both. What Essentials adds over Radar is ChatGPT, and
 *   ENGINE_UNLOCK_PLAN.chatgpt is 'essentials' for that reason.
 *
 * Corroborated on the retirement only by
 * bg-021-retrieval-not-engine-count.html, which dates Meta AI's removal to
 * 16 July 2026. That page is NOT a source for the current ladder.
 *
 * The secondary real number is the counterfactual 8, and the subtraction that
 * produced 7. Source: bg-021, "1 engine retired for answering from training
 * data only: Meta AI, on 16 July 2026". Meta AI is named here only as a dated
 * historical record of a removal, never as a live engine.
 *
 * NOT ANIMATED, DELIBERATELY
 * No Grok rate and no AI Overviews rate. Per 00-BRIEF.md prohibition 1, both
 * engines have a single collection day behind them and a percentage off one day
 * is not a measurement. This component has no percentage in it at all.
 *
 * Mount: import { P1EngineLadderComposition } and spread it into RemotionRoot.
 */

import React from 'react';
import {
  AbsoluteFill,
  Composition,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { INTER, loadInter } from './fonts';

/* ------------------------------------------------------------------ props */

export interface SafeInsets {
  /** px cleared at the top of a 1080x1920 master */
  top: number;
  /** px cleared at the bottom. 672 is the Meta 35% inset, safe on all four
   *  vertical channels per docs/growth/channel-specs-2026-07-29.md */
  bottom: number;
  left: number;
  right: number;
}

export interface EngineTier {
  /** Plan label exactly as it appears on the pricing page */
  plan: string;
  /** Cumulative engine count for this tier. Real, from planConfig.ts */
  engineCount: number;
  /** What this tier adds over the one below it */
  adds: string;
}

/**
 * NOTE: a `type` alias, not an `interface`, and that is load bearing rather
 * than style. Remotion's <Composition> constrains its props to
 * `Record<string, unknown>`, and TypeScript gives a type alias an implicit
 * index signature while an interface never gets one. As an interface this
 * failed `tsc --noEmit` at the registration below. It rendered anyway, because
 * the bundler strips types and never typechecks, which is exactly how four
 * type errors sat in this project unnoticed.
 */
export type P1EngineLadderProps = {
  /** The ladder, bottom tier first. Real engine counts only. */
  tiers: EngineTier[];
  /** Engine removed from the product, named for the historical record */
  retiredEngine: string;
  /** ISO date of the removal, rendered as given */
  retiredOn: string;
  /** What the top tier count would have been had the removal not happened */
  counterfactualCount: number;
  /** Line held under the ladder once it resolves */
  standardLine: string;
  safeInsets: SafeInsets;
};

/* ------------------------------------------------------------------ tokens */

const T = {
  bg: '#090A0F',
  surface: '#101116',
  surfaceRaised: '#16171e',
  border: '#23242b',
  borderStrong: '#32333c',
  accent: '#8b5cf6',
  accentStrong: '#7c3aed',
  accentText: '#a78bfa',
  text: '#e8e9ed',
  text2: '#9ba1ac',
  text3: '#7d838f',
  bad: '#f87171',
  ok: '#34d399',
  gradient: 'linear-gradient(135deg, #7c3aed 0%, #6366f1 100%)',
} as const;

loadInter();
const FONT = INTER;

/* ----------------------------------------------------------------- timing */

/**
 * 13.5 seconds at 30fps.
 *
 * EXTENDED from 360 (12.0s) on 2026-07-31 because adding the Radar rung is a
 * TIMING change as well as a data one. The ladder is animated one rung at a
 * time at `tierStride`, so a fifth rung costs 46 frames of runtime that has to
 * come from somewhere. At the old 360 the last rung finished its count-up on
 * frame 244, which is the exact frame `stampIn` fired: the closing subtraction
 * would have landed on top of a rung still resolving, and the standard line
 * would have had 14 frames of screen time before the cut.
 */
export const P1_DURATION_IN_FRAMES = 405;

const BEAT = {
  titleIn: 0,
  ladderStart: 40,
  /** frames between one tier resolving and the next starting */
  tierStride: 46,
  /** last rung starts at 40 + 4*46 = 224 and finishes counting at 244, so the
   *  stamp waits 22 frames past that rather than colliding with it */
  stampIn: 266,
  standardIn: 330,
} as const;

/* ---------------------------------------------------------------- helpers */

const countUp = (
  frame: number,
  from: number,
  to: number,
  startFrame: number,
  lengthInFrames: number,
): number =>
  Math.round(
    interpolate(frame, [startFrame, startFrame + lengthInFrames], [from, to], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.out(Easing.cubic),
    }),
  );

/* ------------------------------------------------------------------ scene */

export const P1EngineLadder: React.FC<P1EngineLadderProps> = ({
  tiers,
  retiredEngine,
  retiredOn,
  counterfactualCount,
  standardLine,
  safeInsets,
}) => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();

  const titleOpacity = interpolate(frame, [BEAT.titleIn, BEAT.titleIn + 14], [0, 1], {
    extrapolateRight: 'clamp',
  });

  const topCount = tiers.length > 0 ? tiers[tiers.length - 1].engineCount : 0;

  /* The stamp: counterfactual count struck through, real count beside it. */
  const stampSpring = spring({
    frame: frame - BEAT.stampIn,
    fps,
    config: { damping: 14, mass: 0.6, stiffness: 140 },
  });
  const stampScale = interpolate(stampSpring, [0, 1], [1.6, 1]);
  const strikeWidth = interpolate(
    frame,
    [BEAT.stampIn + 10, BEAT.stampIn + 26],
    [0, 100],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );

  const standardOpacity = interpolate(
    frame,
    [BEAT.standardIn, BEAT.standardIn + 16],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );

  return (
    <AbsoluteFill style={{ backgroundColor: T.bg, fontFamily: FONT }}>
      {/* violet floor glow, decorative, kept subtle so the numbers carry it */}
      <AbsoluteFill
        style={{
          background:
            'radial-gradient(58% 34% at 50% 74%, rgba(124,58,237,0.20) 0%, rgba(9,10,15,0) 70%)',
        }}
      />

      <AbsoluteFill
        style={{
          paddingTop: safeInsets.top + 60,
          paddingBottom: safeInsets.bottom,
          paddingLeft: safeInsets.left + 56,
          paddingRight: safeInsets.right + 56,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-start',
        }}
      >
        <div
          style={{
            opacity: titleOpacity,
            color: T.text3,
            fontSize: 30,
            letterSpacing: 4,
            textTransform: 'uppercase',
            fontWeight: 600,
          }}
        >
          Engines per plan
        </div>

        <div style={{ height: 32 }} />

        {tiers.map((tier, i) => {
          const start = BEAT.ladderStart + i * BEAT.tierStride;
          const enter = spring({
            frame: frame - start,
            fps,
            config: { damping: 16, mass: 0.5, stiffness: 120 },
          });
          const shown = countUp(frame, 0, tier.engineCount, start, 20);
          const isTop = i === tiers.length - 1;

          return (
            <div
              key={tier.plan}
              style={{
                opacity: enter,
                transform: `translateX(${interpolate(enter, [0, 1], [-44, 0])}px)`,
                display: 'flex',
                alignItems: 'center',
                gap: 28,
                /* Tightened from 26px/18 on 2026-07-31. The fifth rung added
                 * 164px of stack and pushed the closing standard line past the
                 * 672px bottom inset this master is built to. */
                padding: '22px 30px',
                marginBottom: 14,
                borderRadius: 18,
                background: isTop ? T.surfaceRaised : T.surface,
                border: `1px solid ${isTop ? T.borderStrong : T.border}`,
              }}
            >
              <div
                style={{
                  minWidth: 124,
                  fontSize: 84,
                  lineHeight: 1,
                  fontWeight: 800,
                  fontVariantNumeric: 'tabular-nums',
                  color: isTop ? T.text : T.accentText,
                  textShadow: isTop ? '0 0 42px rgba(139,92,246,0.55)' : 'none',
                }}
              >
                {shown}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ fontSize: 36, fontWeight: 700, color: T.text }}>
                  {tier.plan}
                </div>
                <div style={{ fontSize: 25, color: T.text2, lineHeight: 1.25 }}>
                  {tier.adds}
                </div>
              </div>
            </div>
          );
        })}

        {/* the subtraction, which is the argument */}
        <div
          style={{
            marginTop: 28,
            opacity: stampSpring,
            transform: `scale(${stampScale})`,
            transformOrigin: 'left center',
            display: 'flex',
            alignItems: 'center',
            gap: 22,
          }}
        >
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <span
              style={{
                fontSize: 76,
                fontWeight: 800,
                color: T.text3,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {counterfactualCount}
            </span>
            <div
              style={{
                position: 'absolute',
                left: 0,
                top: '52%',
                height: 6,
                width: `${strikeWidth}%`,
                background: T.bad,
                borderRadius: 3,
              }}
            />
          </div>
          <span style={{ fontSize: 56, color: T.text3 }}>&rarr;</span>
          <span
            style={{
              fontSize: 76,
              fontWeight: 800,
              color: T.text,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {topCount}
          </span>
          <div
            style={{
              marginLeft: 10,
              padding: '12px 18px',
              borderRadius: 12,
              border: `1px solid ${T.bad}`,
              color: T.bad,
              fontSize: 24,
              fontWeight: 700,
              letterSpacing: 1,
              lineHeight: 1.3,
              maxWidth: width * 0.42,
            }}
          >
            {retiredEngine} retired {retiredOn}
          </div>
        </div>

        <div
          style={{
            marginTop: 32,
            opacity: standardOpacity,
            fontSize: 34,
            lineHeight: 1.35,
            color: T.text,
            borderLeft: `4px solid ${T.accent}`,
            paddingLeft: 24,
          }}
        >
          {standardLine}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/* ----------------------------------------------------------- registration */

/**
 * Every `plan` string below is PLAN_LABELS in planConfig.ts, verbatim.
 * Every `engineCount` is PLAN_ENGINES[plan].length.
 * Every `adds` is the set difference against the rung below it.
 *
 *   free       ['gemini']                                                 1
 *   radar      ['gemini','claude']                                        2
 *   essentials ['chatgpt','gemini','claude']                              3
 *   growth     [...,'perplexity','google_ai']                             5
 *   growth_pro [...,'grok','ai_overview']                                 7
 *   managed    identical to growth_pro                                    7
 */
export const P1_DEFAULT_PROPS: P1EngineLadderProps = {
  tiers: [
    { plan: 'Free', engineCount: 1, adds: 'Gemini' },
    { plan: 'Radar', engineCount: 2, adds: 'plus Claude' },
    { plan: 'Essentials', engineCount: 3, adds: 'plus ChatGPT' },
    { plan: 'Growth', engineCount: 5, adds: 'plus Perplexity, Google AI Mode' },
    {
      plan: 'Growth PRO and above',
      engineCount: 7,
      adds: 'plus Grok, Google AI Overviews',
    },
  ],
  retiredEngine: 'Meta AI',
  retiredOn: '16 Jul 2026',
  counterfactualCount: 8,
  standardLine: 'Seven at the top. Every one queried with retrieval on.',
  /* top raised 100 -> 200 on 2026-07-31 to match the box the package declares
   * (1080x1920, 200 top, 360 bottom, 200 right). bottom stays at the more
   * conservative 672, the Meta 35% inset this vertical master is built to. */
  safeInsets: { top: 200, bottom: 672, left: 50, right: 200 },
};

export const P1EngineLadderComposition: React.FC = () => (
  <Composition
    id="P1EngineLadder"
    component={P1EngineLadder}
    durationInFrames={P1_DURATION_IN_FRAMES}
    fps={30}
    width={1080}
    height={1920}
    defaultProps={P1_DEFAULT_PROPS}
  />
);
