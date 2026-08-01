/**
 * Long-form brand introduction, composition registry.
 *
 * Spec: docs/growth/CAMPAIGN-2026-07-30/youtube/longform/
 *       STORYBOARD.md (shot list), SCRIPT.md (timing), ASSETS.md (render names)
 *
 * 1920 x 1080 at fps 30. Twenty-five compositions covering twenty-six of the
 * storyboard's thirty-four shots. `LF-05-columns-both` serves shots 5 and 22,
 * which is why twenty-five renders cover twenty-six slots.
 *
 * COMPOSITION IDS ARE ASSETS.md'S RENDER NAMES, prefixed `LF-`. A card here
 * maps to a row there with no translation step, so nobody has to hold a mapping
 * table in their head while cutting.
 *
 * EIGHT SHOTS ARE ABSENT ON PURPOSE. Shots 10, 11, 23, 24, 25, 26, 27 and 29
 * are the screen recordings C1 to C8. They are Constantin's to capture and are
 * not buildable here. Six of the eight are behind a login, and the two that are
 * public (C3, C4) are recordings of a live audit run that ASSETS.md says to
 * capture real rather than mock. Building a stand-in for any of them would put
 * a fake product surface in a video whose whole argument is that its figures
 * are real.
 *
 * DURATIONS COME FROM SCRIPT.md, computed as the gap to the next shot's cue.
 * They are the shot's slot in the 6:20 cut, not a guess. Where a card covers
 * two beats of one shot (LF-24 covers 5:38 and the 5:50 line-up) the duration
 * spans both, and the internal beat sits where the storyboard puts it.
 *
 * NO CARD NOW GOES STALE ON A DATE. `LF-25-end-card` used to render "Paid plans
 * from EUR 29 per month", `radar`'s launch price for the first 100 customers
 * against a EUR 39 list, and would have needed a re-render plus a re-recorded
 * narration line the day that cohort filled. Resolved 2026-08-01: the card
 * carries no price at all, only "Free tier available.". A price that moves
 * belongs on getbrandgeo.com, which already frames launch against list and can
 * change for free. Reasoning is at PRICE_LINE in longform/cards.tsx.
 */

import React from 'react';
import { Composition } from 'remotion';
import { H, W, sec } from './longform/shared';
import {
  AnswerIsProduct,
  AnswerTravelCard,
  BarsAllFour,
  BarsCompanies,
  ColdOpen,
  ColumnsA,
  ColumnsADated,
  ColumnsB,
  ColumnsBoth,
  ConvergeFragment,
  EmptyAnalytics,
  EndCard,
  EnginesNew,
  HonestLimit,
  LanguageCounter,
  LanguageSplit,
  LogoReveal,
  NoPromise,
  NotAReorder,
  SectionFairness,
  SectionRecord,
  SevenEngines,
  Snapshot,
  ThreeSteps,
  TwoGoogleSurfaces,
} from './longform/cards';

interface Card {
  id: string;
  /** Storyboard shot numbers this render serves */
  shots: number[];
  /** Cue in SCRIPT.md, for auditing the duration against the cut */
  cue: string;
  seconds: number;
  component: React.FC;
}

export const LONG_FORM_CARDS: Card[] = [
  { id: 'LF-01-cold-open',          shots: [1],     cue: '0:00', seconds: 7,  component: ColdOpen },
  { id: 'LF-02-columns-a',          shots: [2],     cue: '0:07', seconds: 7,  component: ColumnsA },
  { id: 'LF-03-columns-a-dated',    shots: [3],     cue: '0:14', seconds: 7,  component: ColumnsADated },
  { id: 'LF-04-columns-b',          shots: [4],     cue: '0:21', seconds: 9,  component: ColumnsB },
  { id: 'LF-05-columns-both',       shots: [5, 22], cue: '0:30', seconds: 10, component: ColumnsBoth },
  { id: 'LF-06-answer-travel',      shots: [6],     cue: '0:40', seconds: 12, component: AnswerTravelCard },
  { id: 'LF-07-empty-analytics',    shots: [7],     cue: '0:52', seconds: 10, component: EmptyAnalytics },
  { id: 'LF-08-answer-is-product',  shots: [8],     cue: '1:02', seconds: 10, component: AnswerIsProduct },
  { id: 'LF-09-logo-reveal',        shots: [9],     cue: '1:12', seconds: 8,  component: LogoReveal },
  { id: 'LF-10-seven-engines',      shots: [12],    cue: '1:44', seconds: 12, component: SevenEngines },
  { id: 'LF-11-two-google-surfaces',shots: [13],    cue: '1:56', seconds: 12, component: TwoGoogleSurfaces },
  { id: 'LF-12-section-record',     shots: [14],    cue: '2:08', seconds: 8,  component: SectionRecord },
  { id: 'LF-13-bars-companies',     shots: [15],    cue: '2:16', seconds: 14, component: BarsCompanies },
  { id: 'LF-14-bars-all-four',      shots: [16],    cue: '2:30', seconds: 12, component: BarsAllFour },
  { id: 'LF-15-converge-fragment',  shots: [17],    cue: '2:42', seconds: 12, component: ConvergeFragment },
  { id: 'LF-16-language-split',     shots: [18],    cue: '2:54', seconds: 14, component: LanguageSplit },
  { id: 'LF-17-language-counter',   shots: [19],    cue: '3:08', seconds: 10, component: LanguageCounter },
  { id: 'LF-18-not-a-reorder',      shots: [20],    cue: '3:18', seconds: 10, component: NotAReorder },
  { id: 'LF-19-honest-limit',       shots: [21],    cue: '3:28', seconds: 12, component: HonestLimit },
  { id: 'LF-20-three-steps',        shots: [28],    cue: '4:42', seconds: 10, component: ThreeSteps },
  { id: 'LF-21-section-fairness',   shots: [30],    cue: '5:06', seconds: 8,  component: SectionFairness },
  { id: 'LF-22-no-promise',         shots: [31],    cue: '5:14', seconds: 12, component: NoPromise },
  { id: 'LF-23-snapshot',           shots: [32],    cue: '5:26', seconds: 12, component: Snapshot },
  { id: 'LF-24-engines-new',        shots: [33],    cue: '5:38', seconds: 20, component: EnginesNew },
  { id: 'LF-25-end-card',           shots: [34],    cue: '6:06', seconds: 14, component: EndCard },
];

export const LongFormCompositions: React.FC = () => (
  <>
    {LONG_FORM_CARDS.map((card) => (
      <Composition
        key={card.id}
        id={card.id}
        component={card.component}
        durationInFrames={sec(card.seconds)}
        fps={30}
        width={W}
        height={H}
      />
    ))}
  </>
);
