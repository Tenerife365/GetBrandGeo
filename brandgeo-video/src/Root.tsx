/**
 * Root
 *
 * Mounts the four pillar compositions. Point a Remotion entry file at this,
 * copy these five files into that project's src/, and all four render.
 *
 *   // src/index.ts
 *   import { registerRoot } from 'remotion';
 *   import { RemotionRoot } from './Root';
 *   registerRoot(RemotionRoot);
 *
 * Every composition is 1080 x 1920 at fps 30, with an explicit
 * durationInFrames exported alongside its component.
 *
 * These render. `npm run compositions` lists them and `npm run render <id>`
 * writes an mp4. Nothing here uploads, posts or schedules.
 *
 * VERTICAL, 1080 x 1920 at fps 30. Four pillar cuts for Reels, TikTok, Shorts.
 *
 * | Composition      | Pillar | Stage | Driver         | Frames | Real number animated                    |
 * |------------------|--------|-------|----------------|--------|-----------------------------------------|
 * | P1EngineLadder   | P1     | TOFU  | Contrarian     | 405    | engines per plan 1, 2, 3, 5, 7, and 8 to 7 |
 * | P2ConsensusSplit | P2     | TOFU  | Curiosity gap  | 420    | 20 categories split 10 and 10, plus 11%  |
 * | P3RankOrNull     | P3     | TOFU  | Contrarian     | 390    | rank 2019 resolving to null, plus 156    |
 * | P4DisclosedGap   | P4     | TOFU  | Concrete proof | 450    | 280 to 278 to 222                        |
 *
 * P1 was 360 frames and animated a FOUR rung ladder reading 1, 3, 5, 7. Both
 * were wrong as of 2026-07-31 and are corrected: see the header of
 * P1EngineLadder.tsx for the two defects and the source lines in planConfig.ts.
 *
 * HORIZONTAL, 1920 x 1080 at fps 30. The motion-graphic and data cards for the
 * long-form brand introduction, specified shot by shot in
 * docs/growth/CAMPAIGN-2026-07-30/youtube/longform/STORYBOARD.md. Their ids are
 * the render names ASSETS.md section 2.1 assigns, so a card here maps to a row
 * there without translation. See LongForm.tsx for what is deliberately absent:
 * the eight screen recordings, which need a logged-in human.
 *
 * Provenance for every figure is in the header comment of the file that
 * animates it. No component contains a Grok rate or an AI Overviews rate.
 */

import React from 'react';
import { P1EngineLadderComposition } from './P1EngineLadder';
import { P2ConsensusSplitComposition } from './P2ConsensusSplit';
import { P3RankOrNullComposition } from './P3RankOrNull';
import { P4DisclosedGapComposition } from './P4DisclosedGap';
import { LongFormCompositions } from './LongForm';
import { FontProbeComposition } from './FontProbe';

export const RemotionRoot: React.FC = () => (
  <>
    <P1EngineLadderComposition />
    <P2ConsensusSplitComposition />
    <P3RankOrNullComposition />
    <P4DisclosedGapComposition />
    <LongFormCompositions />
    {/* Test fixture, not a deliverable. Proves Inter actually loaded rather
     *  than assuming it. See FontProbe.tsx for why that is not paranoia. */}
    <FontProbeComposition />
  </>
);
