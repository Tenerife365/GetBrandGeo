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
 * There is no Remotion project in this repository yet. These are drafts written
 * to the growth folder for review, per the output rules in 00-BRIEF.md. Nothing
 * here renders, uploads, or posts on its own.
 *
 * | Composition      | Pillar | Stage | Driver         | Frames | Real number animated                    |
 * |------------------|--------|-------|----------------|--------|-----------------------------------------|
 * | P1EngineLadder   | P1     | TOFU  | Contrarian     | 360    | engines per plan 1, 3, 5, 7, and 8 to 7  |
 * | P2ConsensusSplit | P2     | TOFU  | Curiosity gap  | 420    | 20 categories split 10 and 10, plus 11%  |
 * | P3RankOrNull     | P3     | TOFU  | Contrarian     | 390    | rank 2019 resolving to null, plus 156    |
 * | P4DisclosedGap   | P4     | TOFU  | Concrete proof | 450    | 280 to 278 to 222                        |
 *
 * Provenance for every figure is in the header comment of the file that
 * animates it. No component contains a Grok rate or an AI Overviews rate.
 */

import React from 'react';
import { P1EngineLadderComposition } from './P1EngineLadder';
import { P2ConsensusSplitComposition } from './P2ConsensusSplit';
import { P3RankOrNullComposition } from './P3RankOrNull';
import { P4DisclosedGapComposition } from './P4DisclosedGap';

export const RemotionRoot: React.FC = () => (
  <>
    <P1EngineLadderComposition />
    <P2ConsensusSplitComposition />
    <P3RankOrNullComposition />
    <P4DisclosedGapComposition />
  </>
);
