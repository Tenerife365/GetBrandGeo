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
import type { SafeInsets } from './P1EngineLadder';

/* ------------------------------------------------------------------ props */

export interface P2ConsensusSplitProps {
  /** Total buyer categories tested. Real: 20, from bg-016 */
  totalCategories: number;
  /** Categories where three or more engines named the same brand. Real: 10 */
  convergedCount: number;
  /** Example labels for the converged column, from the bg-016 table */
  convergedExamples: string[];
  /** Example labels for the fragmented column, from the bg-016 table */
  fragmentedExamples: string[];
  /** Published domain-citation overlap, whole percent. Real: 11 */
  citationOverlapPercent: number;
  /** The two engines that overlap figure compares */
  overlapPair: [string, string];
  safeInsets: SafeInsets;
}

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

const FONT =
  'Inter, "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

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
  citationOverlapPercent,
  overlapPair,
  safeInsets,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const fragmentedCount = totalCategories - convergedCount;

  /* Grid geometry. Four across, however many rows the count needs. */
  const cols = 4;
  const rows = Math.ceil(totalCategories / cols);
  const usableWidth = width - safeInsets.left - safeInsets.right - 112;
  const tile = Math.min(usableWidth / cols - 22, 170);
  const gap = 22;
  const gridWidth = cols * tile + (cols - 1) * gap;
  const gridTop = safeInsets.top + 280;
  const gridLeft = (width - gridWidth) / 2;

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
        <span style={{ color: T.accentText }}>Five engines each.</span>
      </div>

      {/* column headers, revealed after the split */}
      <div
        style={{
          position: 'absolute',
          top: gridTop - 84,
          left: 0,
          width,
          opacity: headerOpacity,
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
        const targetX = converged
          ? gridLeft - 8 + (i % 2) * 14
          : gridLeft + gridWidth - tile + 8 + jitterX * 6;
        const targetY = converged
          ? gridTop + i * 6
          : baseY + jitterY * 9;

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
              opacity: appear,
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
          top: gridTop + rows * (tile + gap) + 24,
          left: safeInsets.left + 56,
          right: safeInsets.right + 56,
          opacity: examplesOpacity,
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
  citationOverlapPercent: 11,
  overlapPair: ['ChatGPT', 'Perplexity'],
  safeInsets: { top: 100, bottom: 672, left: 50, right: 200 },
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
