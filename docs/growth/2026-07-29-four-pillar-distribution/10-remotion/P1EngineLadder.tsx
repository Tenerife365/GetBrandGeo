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
 * The engine count per plan tier: 1, 3, 5, 7.
 * Source: planConfig.ts as pinned in 00-BRIEF.md ("free: ChatGPT. essentials:
 * + Gemini, Claude. growth: + Perplexity, Google AI Mode (5). growth_pro and
 * managed: + Grok, Google AI Overviews (7)"), corroborated by the "What the
 * ladder looks like now" section of bg-021-retrieval-not-engine-count.html.
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

export interface P1EngineLadderProps {
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
}

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

const FONT =
  'Inter, "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

/* ----------------------------------------------------------------- timing */

/** 12.0 seconds at 30fps */
export const P1_DURATION_IN_FRAMES = 360;

const BEAT = {
  titleIn: 0,
  ladderStart: 40,
  /** frames between one tier resolving and the next starting */
  tierStride: 46,
  stampIn: 244,
  standardIn: 300,
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

        <div style={{ height: 44 }} />

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
                padding: '26px 30px',
                marginBottom: 18,
                borderRadius: 18,
                background: isTop ? T.surfaceRaised : T.surface,
                border: `1px solid ${isTop ? T.borderStrong : T.border}`,
              }}
            >
              <div
                style={{
                  minWidth: 132,
                  fontSize: 92,
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
            marginTop: 34,
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
            marginTop: 40,
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

export const P1_DEFAULT_PROPS: P1EngineLadderProps = {
  tiers: [
    { plan: 'Free', engineCount: 1, adds: 'ChatGPT' },
    { plan: 'Essentials', engineCount: 3, adds: 'plus Gemini, Claude' },
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
  safeInsets: { top: 100, bottom: 672, left: 50, right: 200 },
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
