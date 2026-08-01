/**
 * P2ConsensusSplit
 *
 * Pillar:      P2, cross-engine consensus
 * Funnel:      TOFU (drives Short 7b), reusable as a MOFU insert in 7f section 1
 * Driver:      Curiosity gap (SKILL.md section 3)
 * Serves:      docs/growth/2026-07-29-four-pillar-distribution/07-youtube.md
 *              asset 7b, beats 2.5s to 17.0s and 36.0s to 42.0s
 *
 * THE REAL NUMBERS THIS ANIMATES
 * 1. Twenty buyer categories splitting ten and ten.
 *    Source: bg-016.html key findings, "10 of 20: Buyer categories, across four
 *    cities, where three or more AI engines independently named the same brand".
 *    The complement, ten with no agreement, is stated in the same page body.
 * 2. 11 percent domain-citation overlap between ChatGPT and Perplexity on
 *    identical queries.
 *    Source: bg-016.html key findings, "11%: Domain-citation overlap between
 *    ChatGPT and Perplexity for identical queries".
 *
 * Both figures are published research findings on a live BrandGEO page, which is
 * the safe path per 00-BRIEF.md. Neither is derived from the ai_results row
 * counts, and neither is attributed to any named brand.
 *
 * NOT ANIMATED, DELIBERATELY
 * No Grok rate, no AI Overviews rate, and no engine-level percentage of any kind
 * beyond the published 11% figure above, which is a citation-overlap measure
 * between two long-established engines and not a visibility rate.
 *
 * The category labels are the ones bg-016 names in its converge/fragment table.
 * If a label is edited, check it against that table first. Do not invent one.
 *
 * Mount: import { P2ConsensusSplitComposition } and spread into RemotionRoot.
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
import type { SafeInsets } from './P1EngineLadder';

/* ------------------------------------------------------------------ props */

/**
 * NOTE: a `type` alias, not an `interface`, and that is load bearing rather
 * than style. Remotion's <Composition> constrains its props to
 * `Record<string, unknown>`, and TypeScript gives a type alias an implicit
 * index signature while an interface never gets one. As an interface this
 * failed `tsc --noEmit` at the registration below. It rendered anyway, because
 * the bundler strips types and never typechecks, which is exactly how four
 * type errors sat in this project unnoticed.
 */
export type P2ConsensusSplitProps = {
  /** Total buyer categories tested. Real: 20, from bg-016 */
  totalCategories: number;
  /** Categories where three or more engines named the same brand. Real: 10 */
  convergedCount: number;
  /** Example labels for the converged column, from the bg-016 table */
  convergedExamples: string[];
  /** Example labels for the fragmented column, from the bg-016 table */
  fragmentedExamples: string[];
  /** Engines the STUDY fired, per category. Real: 5, as measured on 2026-07-14.
   *  This is a dated denominator, not the current product lineup, which is 7 on
   *  Growth PRO and above. Do not update it to today's count. */
  studyEngineCount: number;
  /** Where and when the figures were collected, rendered under the headline */
  studySource: string;
  /** Published domain-citation overlap, whole percent. Real: 11 */
  citationOverlapPercent: number;
  /** The two engines that overlap figure compares */
  overlapPair: [string, string];
  safeInsets: SafeInsets;
};

/* ------------------------------------------------------------------ tokens */

const T = {
  bg: '#090A0F',
  surface: '#101116',
  border: '#23242b',
  accent: '#8b5cf6',
  accentText: '#a78bfa',
  text: '#e8e9ed',
  text2: '#9ba1ac',
  text3: '#7d838f',
  ok: '#34d399',
  part: '#fb923c',
} as const;

loadInter();
const FONT = INTER;

/* ----------------------------------------------------------------- timing */

/** 14.0 seconds at 30fps */
export const P2_DURATION_IN_FRAMES = 420;

const BEAT = {
  gridStart: 10,
  /** frames between consecutive tiles appearing */
  tileStride: 4,
  splitStart: 150,
  splitLength: 40,
  headersIn: 190,
  countersIn: 200,
  examplesIn: 236,
  overlapIn: 306,
  overlapCountLength: 46,
} as const;

/* ---------------------------------------------------------------- helpers */

const countUp = (
  frame: number,
  to: number,
  startFrame: number,
  lengthInFrames: number,
): number =>
  Math.round(
    interpolate(frame, [startFrame, startFrame + lengthInFrames], [0, to], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.out(Easing.cubic),
    }),
  );

/* ------------------------------------------------------------------ scene */

export const P2ConsensusSplit: React.FC<P2ConsensusSplitProps> = ({
  totalCategories,
  convergedCount,
  convergedExamples,
  fragmentedExamples,
  studyEngineCount,
  studySource,
  citationOverlapPercent,
  overlapPair,
  safeInsets,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const fragmentedCount = totalCategories - convergedCount;

  /* Grid geometry. Four across, however many rows the count needs. */
  const cols = 4;
  const usableWidth = width - safeInsets.left - safeInsets.right - 112;
  /* Capped at 140, was 170. MEASURED, not taste: at 170 the fragmented pile's
   * right edge landed at x=932 against a declared ceiling of 879, so this cut
   * put 53px of ink under Instagram's action rail. tools/check_render.py
   * reports the clearance on every frame so the next person can see the margin
   * rather than rediscover the breach. */
  const tile = Math.min(usableWidth / cols - 22, 140);
  const gap = 22;
  const gridWidth = cols * tile + (cols - 1) * gap;
  /* +360, was +280. The headline now carries a source stamp under it, and at
   * +280 the stamp rendered straight through the AGREED / NO AGREEMENT
   * headers. Both were legible on their own and neither was legible together. */
  const gridTop = safeInsets.top + 360;
  const gridLeft = (width - gridWidth) / 2;
  const gridRight = gridLeft + gridWidth;

  /* Split progress drives the horizontal fan out of the two groups. */
  const split = interpolate(
    frame,
    [BEAT.splitStart, BEAT.splitStart + BEAT.splitLength],
    [0, 1],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.inOut(Easing.cubic),
    },
  );

  const headerOpacity = interpolate(
    frame,
    [BEAT.headersIn, BEAT.headersIn + 14],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );

  const shownConverged = countUp(frame, convergedCount, BEAT.countersIn, 22);
  const shownFragmented = countUp(frame, fragmentedCount, BEAT.countersIn, 22);

  const examplesOpacity = interpolate(
    frame,
    [BEAT.examplesIn, BEAT.examplesIn + 18],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );

  /* The grid and the closing figure do not share the frame. At 1080x1920 with a
   * 672px bottom inset there are 1048 usable pixels and the two together need
   * more than that, so the grid hands the frame over rather than being crowded
   * into it. This is also the better edit: the counters have resolved by then
   * and the tiles have nothing left to say. */
  const gridOut = interpolate(
    frame,
    [BEAT.overlapIn - 12, BEAT.overlapIn + 8],
    [1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );

  const overlapIn = spring({
    frame: frame - BEAT.overlapIn,
    fps,
    config: { damping: 15, mass: 0.6, stiffness: 130 },
  });
  const shownOverlap = countUp(
    frame,
    citationOverlapPercent,
    BEAT.overlapIn + 6,
    BEAT.overlapCountLength,
  );

  return (
    <AbsoluteFill style={{ backgroundColor: T.bg, fontFamily: FONT }}>
      <AbsoluteFill
        style={{
          background:
            'radial-gradient(60% 30% at 50% 30%, rgba(124,58,237,0.16) 0%, rgba(9,10,15,0) 72%)',
        }}
      />

      {/* headline */}
      <div
        style={{
          position: 'absolute',
          top: safeInsets.top + 70,
          left: safeInsets.left + 56,
          right: safeInsets.right + 56,
          color: T.text,
          fontSize: 54,
          lineHeight: 1.15,
          fontWeight: 800,
          opacity: interpolate(frame, [0, 14], [0, 1], {
            extrapolateRight: 'clamp',
          }),
        }}
      >
        {totalCategories} buyer categories.
        <br />
        <span style={{ color: T.accentText }}>
          {studyEngineCount} engines each.
        </span>
        {/* The engine count belongs to the STUDY, not to the product today, and
         *  those two numbers stopped agreeing. bg-016 ran five engines; the
         *  product now runs seven on Growth PRO and above. Without the stamp
         *  directly under it, "Five engines each" reads as a current lineup
         *  claim and is false as one. The five is correct and is deliberately
         *  NOT updated: it is the denominator the finding was measured with. */}
        <div
          style={{
            marginTop: 14,
            fontSize: 26,
            fontWeight: 500,
            lineHeight: 1.3,
            color: T.text3,
          }}
        >
          {studySource}
        </div>
      </div>

      {/* column headers, revealed after the split */}
      <div
        style={{
          position: 'absolute',
          top: gridTop - 84,
          left: 0,
          width,
          opacity: headerOpacity * gridOut,
          display: 'flex',
          justifyContent: 'space-between',
          paddingLeft: safeInsets.left + 56,
          paddingRight: safeInsets.right + 56,
        }}
      >
        <div style={{ color: T.ok, fontSize: 28, fontWeight: 700, letterSpacing: 3 }}>
          AGREED &nbsp;
          <span style={{ fontVariantNumeric: 'tabular-nums', fontSize: 40 }}>
            {shownConverged}
          </span>
        </div>
        <div
          style={{
            color: T.part,
            fontSize: 28,
            fontWeight: 700,
            letterSpacing: 3,
            textAlign: 'right',
          }}
        >
          <span style={{ fontVariantNumeric: 'tabular-nums', fontSize: 40 }}>
            {shownFragmented}
          </span>
          &nbsp; NO AGREEMENT
        </div>
      </div>

      {/* the twenty tiles */}
      {Array.from({ length: totalCategories }).map((_, i) => {
        const appearAt = BEAT.gridStart + i * BEAT.tileStride;
        const appear = spring({
          frame: frame - appearAt,
          fps,
          config: { damping: 18, mass: 0.4, stiffness: 150 },
        });

        const col = i % cols;
        const row = Math.floor(i / cols);
        const baseX = gridLeft + col * (tile + gap);
        const baseY = gridTop + row * (tile + gap);

        const converged = i < convergedCount;
        /* Converged tiles pull into a tight stack on the left. Fragmented tiles
         * scatter right, with a deterministic per-index jitter so the two halves
         * read as ordered versus disordered rather than as two neat columns. */
        const jitterX = ((i * 37) % 11) - 5;
        const jitterY = ((i * 53) % 9) - 4;
        /* Both piles are confined to a band that starts at gridTop and is 500px
         * tall, rather than being left on their base grid rows. On the rows the
         * fragmented pile reached y=1520 and sat on top of the closing 11%
         * caption, and the converged pile stacked at a 6px offset so ten tiles
         * read as about six. 36px of stride makes ten tiles look like ten.
         *
         * jitterX is scaled by 3, not 6, and the +8 nudge is gone: those two
         * together are what pushed the right edge into the reserve. */
        const stride = 36;
        const targetX = converged
          ? gridLeft + (i % 2) * 14
          /* -16 and a jitter scale of 2, measured. At *3 with no inset the
           * pile's right edge landed 6px inside the ceiling, which is a pass
           * nobody should rely on: a font metric or a rotation would eat it. */
          : gridRight - tile - 16 + jitterX * 2;
        const targetY = converged
          ? gridTop + i * stride
          : gridTop + (i - convergedCount) * stride + jitterY * 4;

        const x = baseX + (targetX - baseX) * split;
        const y = baseY + (targetY - baseY) * split;
        const rot = converged ? 0 : jitterX * 1.2 * split;

        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: x,
              top: y,
              width: tile,
              height: tile,
              opacity: appear * gridOut,
              transform: `scale(${interpolate(appear, [0, 1], [0.7, 1])}) rotate(${rot}deg)`,
              borderRadius: 16,
              background: T.surface,
              border: `1px solid ${
                split > 0.35 ? (converged ? T.ok : T.part) : T.border
              }`,
              boxShadow:
                split > 0.35 && converged
                  ? '0 0 26px rgba(52,211,153,0.22)'
                  : 'none',
            }}
          />
        );
      })}

      {/* example labels under each pile */}
      <div
        style={{
          position: 'absolute',
          top: gridTop + 500 + 34,
          left: safeInsets.left + 56,
          right: safeInsets.right + 56,
          opacity: examplesOpacity * gridOut,
          display: 'flex',
          justifyContent: 'space-between',
          gap: 40,
        }}
      >
        <div style={{ flex: 1 }}>
          {convergedExamples.map((label) => (
            <div
              key={label}
              style={{ color: T.text2, fontSize: 26, lineHeight: 1.6 }}
            >
              {label}
            </div>
          ))}
        </div>
        <div style={{ flex: 1, textAlign: 'right' }}>
          {fragmentedExamples.map((label) => (
            <div
              key={label}
              style={{ color: T.text2, fontSize: 26, lineHeight: 1.6 }}
            >
              {label}
            </div>
          ))}
        </div>
      </div>

      {/* the closing figure */}
      <div
        style={{
          position: 'absolute',
          bottom: safeInsets.bottom + 40,
          left: safeInsets.left + 56,
          right: safeInsets.right + 56,
          opacity: overlapIn,
          transform: `translateY(${interpolate(overlapIn, [0, 1], [30, 0])}px)`,
        }}
      >
        <div
          style={{
            fontSize: 150,
            fontWeight: 800,
            lineHeight: 1,
            color: T.text,
            fontVariantNumeric: 'tabular-nums',
            textShadow: '0 0 54px rgba(139,92,246,0.5)',
          }}
        >
          {shownOverlap}%
        </div>
        <div style={{ marginTop: 14, fontSize: 30, color: T.text2, lineHeight: 1.3 }}>
          domain citation overlap between {overlapPair[0]} and {overlapPair[1]} on
          identical queries
        </div>
      </div>
    </AbsoluteFill>
  );
};

/* ----------------------------------------------------------- registration */

export const P2_DEFAULT_PROPS: P2ConsensusSplitProps = {
  totalCategories: 20,
  convergedCount: 10,
  convergedExamples: [
    'CRM software',
    'Business banking',
    'Project management',
  ],
  fragmentedExamples: [
    'Employment law',
    'Financial advice',
    'Estate agencies',
  ],
  studyEngineCount: 5,
  studySource: 'BrandGEO Research bg-016, published 14 Jul 2026',
  citationOverlapPercent: 11,
  overlapPair: ['ChatGPT', 'Perplexity'],
  /* top raised 100 -> 200 on 2026-07-31: the package declares 1080x1920 with
   * 200 top, 360 bottom, 200 right, and 100 put ink inside the top reserve.
   * bottom stays at the more conservative 672, the Meta 35% vertical inset. */
  safeInsets: { top: 200, bottom: 672, left: 50, right: 200 },
};

export const P2ConsensusSplitComposition: React.FC = () => (
  <Composition
    id="P2ConsensusSplit"
    component={P2ConsensusSplit}
    durationInFrames={P2_DURATION_IN_FRAMES}
    fps={30}
    width={1080}
    height={1920}
    defaultProps={P2_DEFAULT_PROPS}
  />
);
