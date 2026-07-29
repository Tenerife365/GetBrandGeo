/**
 * P4DisclosedGap
 *
 * Pillar:      P4, peer-archived research
 * Funnel:      TOFU (drives Short 7d), reusable as a MOFU insert in 7h section 4
 * Driver:      Concrete proof (SKILL.md section 3)
 * Serves:      docs/growth/2026-07-29-four-pillar-distribution/07-youtube.md
 *              asset 7d, beat 8.0s to 26.0s
 *
 * THE REAL NUMBERS THIS ANIMATES
 * The disclosure arithmetic from the published paper, in order:
 *   280 possible engine-level responses implied by the design
 *   278 actually recorded, 2 lost to a transient collection gap
 *   222 in the analytic dataset, after excluding 56 recorded API errors
 * Source: bg-017.html, "Of the 280 possible engine-level responses that design
 * implied, 278 were actually recorded [...] A further 56 rows, all of them
 * ChatGPT, came back as a recorded API error [...] The paper's actual analytic
 * dataset is 222 completed responses across four engines".
 *
 * Supporting figures, same page: 56 buyer-intent prompts, 7 cities, 4 engines,
 * CC BY 4.0, DOI 10.5281/zenodo.21395598.
 *
 * This is the one component whose whole subject is a subtraction. The two
 * deductions are labelled with their causes rather than shown as a clean drop,
 * because an unlabelled drop is exactly the smoothing the paper refused to do.
 *
 * NOT ANIMATED, DELIBERATELY
 * No Grok rate, no AI Overviews rate. Also no completion percentage, that is,
 * no "222 of 280 equals 79 percent", because the paper reports the counts and
 * the reasons rather than a completion rate, and deriving one here would be
 * this file inventing a statistic the source does not carry.
 *
 * Mount: import { P4DisclosedGapComposition } and spread into RemotionRoot.
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
import type { SafeInsets } from './P1EngineLadder';

/* ------------------------------------------------------------------ props */

export interface Deduction {
  /** How many responses this step removes */
  amount: number;
  /** Why they were removed. Never leave this empty. */
  reason: string;
  /** Running total after this deduction */
  runningTotal: number;
}

export interface P4DisclosedGapProps {
  /** Responses the study design implied. Real: 280 */
  designTotal: number;
  /** The deductions, in the order the paper states them */
  deductions: Deduction[];
  /** Where the arithmetic lands. Real: 222 */
  analyticTotal: number;
  /** Line stating where that figure is published in the paper */
  analyticNote: string;
  /** Study shape, rendered as small chips above the counter */
  promptCount: number;
  cityCount: number;
  engineCount: number;
  /** Permanent identifier, rendered verbatim */
  doi: string;
  licence: string;
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
  accentText: '#a78bfa',
  text: '#e8e9ed',
  text2: '#9ba1ac',
  text3: '#7d838f',
  bad: '#f87171',
  warn: '#fbbf24',
  ok: '#34d399',
} as const;

const FONT =
  'Inter, "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
const MONO = '"JetBrains Mono", "SF Mono", ui-monospace, Menlo, monospace';

/* ----------------------------------------------------------------- timing */

/** 15.0 seconds at 30fps */
export const P4_DURATION_IN_FRAMES = 450;

const BEAT = {
  chipsIn: 8,
  chipStride: 14,
  designIn: 66,
  designCountLength: 30,
  /** first deduction lands here, second one deductionStride later */
  deductionStart: 130,
  deductionStride: 84,
  /** how long the running total takes to fall to its new value */
  fallLength: 26,
  analyticHold: 306,
  doiIn: 356,
} as const;

/* ---------------------------------------------------------------- helpers */

const countTo = (
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

export const P4DisclosedGap: React.FC<P4DisclosedGapProps> = ({
  designTotal,
  deductions,
  analyticTotal,
  analyticNote,
  promptCount,
  cityCount,
  engineCount,
  doi,
  licence,
  safeInsets,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const chips = [
    { value: promptCount, label: 'buyer prompts' },
    { value: cityCount, label: 'cities' },
    { value: engineCount, label: 'engines' },
  ];

  /* Running total. Starts by counting up to the design total, then steps down
   * once per disclosed deduction. Each step is a separate interpolation so the
   * number is never in a state the paper does not report. */
  let running = countTo(frame, 0, designTotal, BEAT.designIn, BEAT.designCountLength);
  deductions.forEach((deduction, i) => {
    const at = BEAT.deductionStart + i * BEAT.deductionStride;
    if (frame >= at) {
      const previous =
        i === 0 ? designTotal : deductions[i - 1].runningTotal;
      running = countTo(frame, previous, deduction.runningTotal, at, BEAT.fallLength);
    }
  });

  const settled = frame >= BEAT.analyticHold;
  const settleSpring = spring({
    frame: frame - BEAT.analyticHold,
    fps,
    config: { damping: 14, mass: 0.6, stiffness: 150 },
  });

  const doiIn = interpolate(frame, [BEAT.doiIn, BEAT.doiIn + 18], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{ backgroundColor: T.bg, fontFamily: FONT }}>
      <AbsoluteFill
        style={{
          background:
            'radial-gradient(58% 32% at 50% 44%, rgba(124,58,237,0.18) 0%, rgba(9,10,15,0) 72%)',
        }}
      />

      <AbsoluteFill
        style={{
          paddingTop: safeInsets.top + 76,
          paddingBottom: safeInsets.bottom,
          paddingLeft: safeInsets.left + 56,
          paddingRight: safeInsets.right + 56,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* study shape */}
        <div style={{ display: 'flex', gap: 16 }}>
          {chips.map((chip, i) => {
            const enter = spring({
              frame: frame - (BEAT.chipsIn + i * BEAT.chipStride),
              fps,
              config: { damping: 18, mass: 0.4, stiffness: 150 },
            });
            return (
              <div
                key={chip.label}
                style={{
                  opacity: enter,
                  transform: `translateY(${interpolate(enter, [0, 1], [22, 0])}px)`,
                  padding: '16px 22px',
                  borderRadius: 14,
                  background: T.surface,
                  border: `1px solid ${T.border}`,
                }}
              >
                <span
                  style={{
                    fontSize: 40,
                    fontWeight: 800,
                    color: T.accentText,
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {chip.value}
                </span>
                <span style={{ marginLeft: 10, fontSize: 24, color: T.text2 }}>
                  {chip.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* the running total */}
        <div
          style={{
            marginTop: 70,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <div
            style={{
              fontSize: 26,
              letterSpacing: 3,
              textTransform: 'uppercase',
              fontWeight: 700,
              color: settled ? T.ok : T.text3,
            }}
          >
            {settled ? 'analytic dataset' : 'responses the design implied'}
          </div>
          <div
            style={{
              marginTop: 12,
              fontSize: 250,
              lineHeight: 1,
              fontWeight: 800,
              color: T.text,
              fontVariantNumeric: 'tabular-nums',
              transform: `scale(${settled ? interpolate(settleSpring, [0, 1], [1, 1.06]) : 1})`,
              textShadow: settled
                ? '0 0 70px rgba(52,211,153,0.32)'
                : '0 0 60px rgba(139,92,246,0.42)',
            }}
          >
            {settled ? analyticTotal : running}
          </div>
        </div>

        {/* the disclosed deductions, each with its reason */}
        <div style={{ marginTop: 46, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {deductions.map((deduction, i) => {
            const at = BEAT.deductionStart + i * BEAT.deductionStride;
            const enter = spring({
              frame: frame - at,
              fps,
              config: { damping: 16, mass: 0.5, stiffness: 140 },
            });
            return (
              <div
                key={deduction.reason}
                style={{
                  opacity: enter,
                  transform: `translateX(${interpolate(enter, [0, 1], [-40, 0])}px)`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 20,
                  padding: '20px 24px',
                  borderRadius: 14,
                  background: T.surfaceRaised,
                  border: `1px solid ${T.borderStrong}`,
                }}
              >
                <span
                  style={{
                    minWidth: 116,
                    fontSize: 46,
                    fontWeight: 800,
                    color: T.warn,
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  &minus;{deduction.amount}
                </span>
                <span style={{ fontSize: 27, color: T.text2, lineHeight: 1.3 }}>
                  {deduction.reason}
                </span>
              </div>
            );
          })}
        </div>

        <div
          style={{
            marginTop: 34,
            opacity: settled ? 1 : 0,
            fontSize: 30,
            lineHeight: 1.35,
            color: T.text,
            borderLeft: `4px solid ${T.ok}`,
            paddingLeft: 22,
          }}
        >
          {analyticNote}
        </div>

        {/* the permanent record */}
        <div
          style={{
            marginTop: 'auto',
            paddingTop: 28,
            borderTop: `1px solid ${T.border}`,
            opacity: doiIn,
            display: 'flex',
            alignItems: 'center',
            gap: 18,
            flexWrap: 'wrap',
          }}
        >
          <span style={{ fontFamily: MONO, fontSize: 30, color: T.accentText }}>
            {doi}
          </span>
          <span
            style={{
              padding: '10px 16px',
              borderRadius: 10,
              border: `1px solid ${T.borderStrong}`,
              fontSize: 24,
              color: T.text2,
              letterSpacing: 1,
            }}
          >
            {licence}
          </span>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/* ----------------------------------------------------------- registration */

export const P4_DEFAULT_PROPS: P4DisclosedGapProps = {
  designTotal: 280,
  deductions: [
    {
      amount: 2,
      reason: 'lost to a transient collection gap',
      runningTotal: 278,
    },
    {
      amount: 56,
      reason: 'recorded API errors, that engine excluded from the analysis',
      runningTotal: 222,
    },
  ],
  analyticTotal: 222,
  analyticNote: 'Stated on page one of the paper, not in a footnote.',
  promptCount: 56,
  cityCount: 7,
  engineCount: 4,
  doi: '10.5281/zenodo.21395598',
  licence: 'CC BY 4.0',
  safeInsets: { top: 100, bottom: 672, left: 50, right: 200 },
};

export const P4DisclosedGapComposition: React.FC = () => (
  <Composition
    id="P4DisclosedGap"
    component={P4DisclosedGap}
    durationInFrames={P4_DURATION_IN_FRAMES}
    fps={30}
    width={1080}
    height={1920}
    defaultProps={P4_DEFAULT_PROPS}
  />
);
