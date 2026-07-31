/**
 * P3RankOrNull
 *
 * Pillar:      P3, measurement integrity
 * Funnel:      TOFU (drives Short 7c), reusable as a MOFU insert in 7g section 8
 * Driver:      Contrarian (SKILL.md section 3)
 * Serves:      docs/growth/2026-07-29-four-pillar-distribution/07-youtube.md
 *              asset 7c, beats 9.0s to 18.0s and 28.0s to 38.0s
 *
 * THE REAL NUMBERS THIS ANIMATES
 * 1. The rank a naive parser assigns to the real test line
 *    "2019. Bucate pe Roate a fost premiata in acel an", and the null a bounded
 *    parser returns instead.
 *    Source: bg-019.html, "Signal one: a numbered list, bounded 1 through 50",
 *    which quotes that exact line and states that without the band the brand
 *    would have scored rank 2019.
 * 2. The 1 to 50 trust band. Source: bg-019.html key findings, "1-50: The only
 *    band a numbered-list digit is trusted in".
 * 3. 25 ordering phrases and 17 counter-phrases. Source: bg-019.html key
 *    findings.
 * 4. 156 hand-written regression assertions. Source: bg-018.html key findings,
 *    "156: Hand written regression assertions that must still pass before any
 *    extraction change ships".
 *
 * The counter deliberately overshoots to a real, documented wrong answer and
 * then resolves to null. The wrong number is the point of the component. It is
 * labelled on screen as what a naive parser produces, never as a BrandGEO
 * output, and the label prop exists so that framing cannot be dropped by
 * accident.
 *
 * NOT ANIMATED, DELIBERATELY
 * No Grok rate, no AI Overviews rate, no visibility percentage of any kind.
 *
 * Mount: import { P3RankOrNullComposition } and spread into RemotionRoot.
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

export interface RankSignal {
  /** Signal name as bg-019 names it */
  name: string;
  /** The condition that has to hold before it fires */
  condition: string;
}

export interface P3RankOrNullProps {
  /** The real line from the test data that motivated the band */
  sourceLine: string;
  /** Optional gloss of the source line for a reader who does not speak it */
  sourceGloss: string;
  /** What a parser that trusts any leading digit scores. Real: 2019 */
  naiveRank: number;
  /** Label held over the wrong number. Must state whose output it is. */
  naiveLabel: string;
  /** Lower and upper bound of the trusted digit band. Real: [1, 50] */
  trustBand: [number, number];
  /** The three accepted rank signals, from bg-019 */
  signals: RankSignal[];
  /** Ordering phrases required before bullets count as ranked. Real: 25 */
  orderingPhraseCount: number;
  /** Counter-phrases that override an ordering cue. Real: 17 */
  counterPhraseCount: number;
  /** Regression assertions that must pass before a change ships. Real: 156 */
  assertionCount: number;
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

/** 13.0 seconds at 30fps */
export const P3_DURATION_IN_FRAMES = 390;

const BEAT = {
  lineIn: 6,
  /** the naive counter races up */
  climbStart: 54,
  climbLength: 62,
  /** it holds on the wrong answer long enough to be read */
  holdUntil: 152,
  /** hard cut to null, no easing, the abruptness is the point */
  nullAt: 152,
  bandIn: 176,
  signalsIn: 216,
  signalStride: 22,
  phrasesIn: 292,
  assertionsIn: 330,
} as const;

/* ---------------------------------------------------------------- helpers */

const countUp = (
  frame: number,
  to: number,
  startFrame: number,
  lengthInFrames: number,
  easing = Easing.out(Easing.cubic),
): number =>
  Math.round(
    interpolate(frame, [startFrame, startFrame + lengthInFrames], [0, to], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing,
    }),
  );

/* ------------------------------------------------------------------ scene */

export const P3RankOrNull: React.FC<P3RankOrNullProps> = ({
  sourceLine,
  sourceGloss,
  naiveRank,
  naiveLabel,
  trustBand,
  signals,
  orderingPhraseCount,
  counterPhraseCount,
  assertionCount,
  safeInsets,
}) => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();

  const showNull = frame >= BEAT.nullAt;

  const lineOpacity = interpolate(frame, [BEAT.lineIn, BEAT.lineIn + 14], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  /* Linear easing on the climb so it reads as a machine counting, not as a
   * designed reveal. The wrong answer should feel mechanical. */
  const climbing = countUp(
    frame,
    naiveRank,
    BEAT.climbStart,
    BEAT.climbLength,
    Easing.linear,
  );

  const nullPop = spring({
    frame: frame - BEAT.nullAt,
    fps,
    config: { damping: 12, mass: 0.5, stiffness: 200 },
  });

  const bandOpacity = interpolate(frame, [BEAT.bandIn, BEAT.bandIn + 14], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const phrasesIn = spring({
    frame: frame - BEAT.phrasesIn,
    fps,
    config: { damping: 16, mass: 0.5, stiffness: 130 },
  });
  const shownOrdering = countUp(frame, orderingPhraseCount, BEAT.phrasesIn + 4, 20);
  const shownCounter = countUp(frame, counterPhraseCount, BEAT.phrasesIn + 12, 20);
  const shownAssertions = countUp(frame, assertionCount, BEAT.assertionsIn, 34);

  return (
    <AbsoluteFill style={{ backgroundColor: T.bg, fontFamily: FONT }}>
      <AbsoluteFill
        style={{
          background: showNull
            ? 'radial-gradient(56% 30% at 50% 40%, rgba(124,58,237,0.20) 0%, rgba(9,10,15,0) 70%)'
            : 'radial-gradient(56% 30% at 50% 40%, rgba(248,113,113,0.14) 0%, rgba(9,10,15,0) 70%)',
        }}
      />

      <AbsoluteFill
        style={{
          paddingTop: safeInsets.top + 70,
          paddingBottom: safeInsets.bottom,
          paddingLeft: safeInsets.left + 56,
          paddingRight: safeInsets.right + 56,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* the real production line */}
        <div
          style={{
            opacity: lineOpacity,
            padding: '26px 28px',
            borderRadius: 16,
            background: T.surface,
            border: `1px solid ${T.border}`,
          }}
        >
          <div
            style={{
              fontFamily: MONO,
              fontSize: 30,
              lineHeight: 1.45,
              color: T.text,
            }}
          >
            <span style={{ color: T.warn }}>2019.</span>
            {sourceLine}
          </div>
          <div style={{ marginTop: 12, fontSize: 23, color: T.text3 }}>
            {sourceGloss}
          </div>
        </div>

        {/* the wrong answer, then null */}
        <div
          style={{
            marginTop: 56,
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
              color: showNull ? T.accentText : T.bad,
            }}
          >
            {showNull ? 'BrandGEO returns' : naiveLabel}
          </div>

          <div style={{ height: 18 }} />

          {showNull ? (
            <div
              style={{
                fontFamily: MONO,
                fontSize: 190,
                lineHeight: 1,
                fontWeight: 700,
                color: T.text,
                opacity: nullPop,
                transform: `scale(${interpolate(nullPop, [0, 1], [1.35, 1])})`,
                textShadow: '0 0 60px rgba(139,92,246,0.55)',
              }}
            >
              null
            </div>
          ) : (
            <div
              style={{
                fontSize: 190,
                lineHeight: 1,
                fontWeight: 800,
                color: T.bad,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {climbing}
            </div>
          )}

          <div
            style={{
              marginTop: 20,
              opacity: bandOpacity,
              fontSize: 30,
              color: T.text2,
            }}
          >
            numbered-list digits trusted only between{' '}
            <span style={{ color: T.text, fontWeight: 700 }}>
              {trustBand[0]} and {trustBand[1]}
            </span>
          </div>
        </div>

        {/* the three accepted signals */}
        <div style={{ marginTop: 54, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {signals.map((signal, i) => {
            const at = BEAT.signalsIn + i * BEAT.signalStride;
            const enter = spring({
              frame: frame - at,
              fps,
              config: { damping: 17, mass: 0.45, stiffness: 140 },
            });
            return (
              <div
                key={signal.name}
                style={{
                  opacity: enter,
                  transform: `translateX(${interpolate(enter, [0, 1], [36, 0])}px)`,
                  padding: '20px 24px',
                  borderRadius: 14,
                  background: T.surfaceRaised,
                  border: `1px solid ${T.borderStrong}`,
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: 18,
                }}
              >
                <span style={{ color: T.ok, fontSize: 28, fontWeight: 800 }}>
                  {i + 1}
                </span>
                <span style={{ color: T.text, fontSize: 30, fontWeight: 700 }}>
                  {signal.name}
                </span>
                <span style={{ color: T.text3, fontSize: 24, lineHeight: 1.3 }}>
                  {signal.condition}
                </span>
              </div>
            );
          })}
        </div>

        {/* the phrase gates */}
        <div
          style={{
            marginTop: 40,
            opacity: phrasesIn,
            display: 'flex',
            gap: 26,
            maxWidth: width,
          }}
        >
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontSize: 76,
                fontWeight: 800,
                color: T.accentText,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {shownOrdering}
            </div>
            <div style={{ fontSize: 25, color: T.text2, lineHeight: 1.3 }}>
              ordering phrases required before bullets count as ranked
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontSize: 76,
                fontWeight: 800,
                color: T.warn,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {shownCounter}
            </div>
            <div style={{ fontSize: 25, color: T.text2, lineHeight: 1.3 }}>
              counter-phrases that override the cue anyway
            </div>
          </div>
        </div>

        {/* what stops it regressing */}
        <div
          style={{
            marginTop: 'auto',
            paddingTop: 30,
            borderTop: `1px solid ${T.border}`,
            display: 'flex',
            alignItems: 'baseline',
            gap: 18,
          }}
        >
          <span
            style={{
              fontSize: 64,
              fontWeight: 800,
              color: T.text,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {shownAssertions}
          </span>
          <span style={{ fontSize: 27, color: T.text2, lineHeight: 1.3 }}>
            hand-written assertions that must pass before any change ships
          </span>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/* ----------------------------------------------------------- registration */

export const P3_DEFAULT_PROPS: P3RankOrNullProps = {
  sourceLine: ' Bucate pe Roate a fost premiata in acel an',
  sourceGloss: '"2019. Bucate pe Roate was awarded that year"',
  naiveRank: 2019,
  naiveLabel: 'a parser that trusts any leading digit scores',
  trustBand: [1, 50],
  signals: [
    { name: 'Numbered list', condition: 'genuine markup, digit inside the band' },
    { name: 'Ordered bullets', condition: 'lead-in must state the order' },
    { name: 'Stated superlative', condition: 'anchored to the brand by a copula' },
  ],
  orderingPhraseCount: 25,
  counterPhraseCount: 17,
  assertionCount: 156,
  safeInsets: { top: 100, bottom: 672, left: 50, right: 200 },
};

export const P3RankOrNullComposition: React.FC = () => (
  <Composition
    id="P3RankOrNull"
    component={P3RankOrNull}
    durationInFrames={P3_DURATION_IN_FRAMES}
    fps={30}
    width={1080}
    height={1920}
    defaultProps={P3_DEFAULT_PROPS}
  />
);
