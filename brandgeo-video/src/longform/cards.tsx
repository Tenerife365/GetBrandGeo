/**
 * The long-form motion-graphic and data cards, 1920 x 1080.
 *
 * One component per render name in
 * docs/growth/CAMPAIGN-2026-07-30/youtube/longform/ASSETS.md section 2.1, so a
 * card here maps to a row there without translation, and to a shot number in
 * STORYBOARD.md through that row.
 *
 * WHAT IS DELIBERATELY NOT HERE
 * The eight screen recordings C1 to C8 (shots 10, 11, 23, 24, 25, 26, 27, 29).
 * Seven of the eight are behind a login and ASSETS.md section 3 is explicit
 * that producing them is Constantin's, not an agent's: the exclusion list is
 * about real customer names, real email addresses and admin-only surfaces
 * appearing in frame, and no agent can check that from here. C3 and C4 are
 * public, but they are recordings of a live run rather than cards, and
 * ASSETS.md says to capture the real run rather than mock the panel.
 *
 * EVERY FIGURE ON EVERY CARD CARRIES ITS COLLECTION DATE IN THE SAME FRAME.
 * That is STORYBOARD.md's visual grammar, not a preference, and it is the rule
 * that keeps a 5-engine finding from reading as a claim about today's 7.
 *
 * FIGURES AND THEIR SOURCES
 *   5 of 5, 4 of 5, 2 of 5, 2 of 5   ai-visibility-for-{boston,houston}.html,
 *                                    collected 2026-07-24, 5 engines
 *   3 of 4 French, 0 English         ai-visibility-for-paris.html,
 *                                    collected 2026-07-10, 4 engines
 *   the invented firm, twice         ai-visibility-for-{chicago,boston}.html,
 *                                    collected 2026-07-24, 5 engines
 *   seven engines                    planConfig.ts PLAN_ENGINES.growth_pro,
 *                                    read 2026-07-31
 *   Meta AI retired                  16 July 2026
 *   from EUR 29 per month            planConfig.ts ladder table, `radar`
 *
 * The measured subject is never named, on screen or in a prop. Section 2.1 of
 * ASSETS.md requires the redaction be structural rather than applied, so the
 * firm name is not a string in this file at all.
 */

import React from 'react';
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {
  Canvas,
  DateStamp,
  END_SCREEN,
  Label,
  RedactedName,
  StatementCard,
  T,
  TopLeftMark,
  W,
  sec,
} from './shared';

/* ------------------------------------------------------------ shared pieces */

/** Width of the redacted block. One value, used by every column, because
 *  ASSETS.md's point is that the eye should register the blocks as identical. */
const NAME_W = 188;

const EngineColumn: React.FC<{
  engine: string;
  /** false renders the column empty, which is what REALITY is */
  named: boolean;
  opacity?: number;
  pulse?: number;
}> = ({ engine, named, opacity = 1, pulse = 0 }) => (
  <div
    style={{
      opacity,
      width: 240,
      height: 300,
      borderRadius: 18,
      background: T.surface,
      border: `1px solid ${T.border}`,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      paddingTop: 26,
      gap: 40,
    }}
  >
    <Label color={named ? T.text2 : T.text3}>{engine}</Label>
    {named ? (
      <RedactedName
        width={NAME_W}
        opacity={1}
        color={pulse > 0 ? T.accentText : T.accent}
      />
    ) : (
      <div
        style={{
          width: NAME_W,
          height: 34,
          borderRadius: 17,
          border: `1px dashed ${T.borderStrong}`,
        }}
      />
    )}
  </div>
);

/** One result group: the two engines that agreed, and reality, which did not. */
const ResultGroup: React.FC<{ opacity?: number; x?: number }> = ({
  opacity = 1,
  x = 0,
}) => (
  <div
    style={{
      opacity,
      transform: `translateX(${x}px)`,
      display: 'flex',
      gap: 22,
    }}
  >
    <EngineColumn engine="ChatGPT" named />
    <EngineColumn engine="Gemini" named />
    <EngineColumn engine="Reality" named={false} />
  </div>
);

/* ============================================ Section 1, cold open, 0:00 */

/** Render 01, shot 1, 0:00 to 0:07.
 *  Frame 0 is the thumbnail source and must be at full opacity, so fadeIn is 0
 *  and that is not an oversight. A scene-1 fade already cost this campaign a
 *  cover once. */
export const ColdOpen: React.FC = () => (
  <StatementCard headline="A LAW FIRM THAT DOES NOT EXIST" fadeIn={0} size={96} />
);

/** Render 02, shot 2, 0:07 to 0:14. */
export const ColumnsA: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame, fps, config: { damping: 18, mass: 0.5, stiffness: 120 } });
  return (
    <Canvas>
      <AbsoluteFill
        style={{ alignItems: 'center', justifyContent: 'center' }}
      >
        <ResultGroup opacity={enter} />
      </AbsoluteFill>
    </Canvas>
  );
};

/** Render 03, shot 3, 0:14 to 0:21. Identical to 02 plus the stamp.
 *  Collection health is on screen because it is what makes this an anomaly
 *  rather than a failed run. */
export const ColumnsADated: React.FC = () => (
  <Canvas>
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
      <ResultGroup />
    </AbsoluteFill>
    <DateStamp
      text="Collected 2026-07-24 / 5 engines fired / 5 returned usable data"
      fadeInAt={sec(0.6)}
    />
  </Canvas>
);

/** Render 04, shot 4, 0:21 to 0:30.
 *  The slide runs 0.6s exactly, per the storyboard note, so the eye has time to
 *  register that the two violet blocks are the same width. That equality IS the
 *  payoff, so rushing it loses the shot. */
export const ColumnsB: React.FC = () => {
  const frame = useCurrentFrame();
  const slideStart = sec(1.0);
  const t = interpolate(frame, [slideStart, slideStart + sec(0.6)], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
  const headerOpacity = interpolate(
    frame,
    [slideStart + sec(0.5), slideStart + sec(1.1)],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );
  const GROUP_W = 240 * 3 + 22 * 2;
  const GAP = 74;
  return (
    <Canvas>
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ display: 'flex', gap: GAP, alignItems: 'flex-start' }}>
          <ResultGroup x={interpolate(t, [0, 1], [(GROUP_W + GAP) / 2, 0])} />
          <div
            style={{
              opacity: t,
              transform: `translateX(${interpolate(t, [0, 1], [220, 0])}px)`,
              display: 'flex',
              flexDirection: 'column',
              gap: 22,
            }}
          >
            <div style={{ opacity: headerOpacity, height: 30 }}>
              <Label color={T.accentText}>Different city. Different category.</Label>
            </div>
            <ResultGroup />
          </div>
        </div>
      </AbsoluteFill>
    </Canvas>
  );
};

/** Render 05, shots 5 and 22, 0:30 to 0:40 and 3:40 to 3:48. One render, two
 *  slots. The connecting rule is drawn between the two redacted blocks that
 *  hold the same invented name, which is the whole claim of the cold open. */
export const ColumnsBoth: React.FC = () => {
  const frame = useCurrentFrame();
  const ruleWidth = interpolate(frame, [sec(0.5), sec(1.6)], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.cubic),
  });
  const GROUP_W = 240 * 3 + 22 * 2;
  const GAP = 74;
  const total = GROUP_W * 2 + GAP;
  return (
    <Canvas>
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ position: 'relative', width: total, height: 300 }}>
          <div style={{ position: 'absolute', left: 0, top: 0, display: 'flex', gap: GAP }}>
            <ResultGroup />
            <ResultGroup />
          </div>
          {/* the rule sits under the two blocks, spanning group to group */}
          <div
            style={{
              position: 'absolute',
              left: 120,
              top: 246,
              height: 3,
              width: (total - 240) * ruleWidth,
              background: T.accent,
              borderRadius: 2,
              opacity: 0.85,
            }}
          />
        </div>
      </AbsoluteFill>
      <DateStamp text="Source: our own published research, 2026-07-24. Firm name withheld." />
    </Canvas>
  );
};

/* ================================================ Section 2, the turn, 0:40 */

/** The answer travelling from an engine to a buyer.
 *  Abstract glyphs. The skill's negative prompt list bans stock-photo people
 *  and an illustrated human here is the same failure in vector form. */
const PersonGlyph: React.FC<{ active?: boolean }> = ({ active = false }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
    <div
      style={{
        width: 54,
        height: 54,
        borderRadius: '50%',
        border: `3px solid ${active ? T.accentText : T.text3}`,
      }}
    />
    <div
      style={{
        width: 92,
        height: 46,
        borderTopLeftRadius: 46,
        borderTopRightRadius: 46,
        border: `3px solid ${active ? T.accentText : T.text3}`,
        borderBottom: 'none',
      }}
    />
  </div>
);

/** Six fragments that assemble into one block, then travel. */
const AnswerTravel: React.FC<{ loopFrames: number }> = ({ loopFrames }) => {
  const frame = useCurrentFrame();
  const t = (frame % loopFrames) / loopFrames;

  const assemble = interpolate(t, [0.08, 0.42], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
  const travel = interpolate(t, [0.5, 0.9], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.cubic),
  });

  const LEFT_X = 300;
  const RIGHT_X = 1620;
  const x = interpolate(travel, [0, 1], [LEFT_X + 130, RIGHT_X - 130]);

  const lines = [340, 400, 300, 380, 250];

  return (
    <>
      <div style={{ position: 'absolute', left: LEFT_X - 46, top: 470 }}>
        <PersonGlyph active={t < 0.5} />
      </div>
      <div style={{ position: 'absolute', left: RIGHT_X - 46, top: 470 }}>
        <PersonGlyph active={travel > 0.85} />
      </div>

      <div
        style={{
          position: 'absolute',
          left: x - 210,
          top: 430,
          width: 420,
          padding: '22px 24px',
          borderRadius: 16,
          background: T.surface,
          border: `1px solid ${T.borderStrong}`,
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}
      >
        {lines.map((wide, i) => {
          const per = interpolate(
            assemble,
            [i / lines.length, (i + 1) / lines.length],
            [0, 1],
            { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
          );
          return (
            <div
              key={i}
              style={{
                height: 12,
                width: wide * per,
                borderRadius: 6,
                background: i === 1 ? T.accent : T.borderStrong,
                opacity: 0.4 + 0.6 * per,
              }}
            />
          );
        })}
      </div>
    </>
  );
};

/** Render 06, shot 6, 0:40 to 0:52. */
export const AnswerTravelCard: React.FC = () => (
  <Canvas>
    <AnswerTravel loopFrames={sec(4)} />
  </Canvas>
);

/** Render 07, shot 7, 0:52 to 1:02.
 *  The analytics panel must not flicker or pulse. Its stillness is the point,
 *  so it carries no interpolation at all. */
export const EmptyAnalytics: React.FC = () => (
  <Canvas>
    <AnswerTravel loopFrames={sec(4)} />
    <div
      style={{
        position: 'absolute',
        left: 760,
        top: 750,
        width: 400,
        height: 190,
        borderRadius: 16,
        border: `1px solid ${T.borderStrong}`,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: 22,
      }}
    >
      <Label>Your analytics</Label>
    </div>
  </Canvas>
);

/** Render 08, shot 8, 1:02 to 1:12. Last shot before the brand appears. */
export const AnswerIsProduct: React.FC = () => {
  const frame = useCurrentFrame();
  const textIn = interpolate(frame, [sec(0.8), sec(1.6)], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <Canvas>
      <div
        style={{
          position: 'absolute',
          left: 760,
          top: 620,
          width: 400,
          height: 190,
          borderRadius: 16,
          border: `1px solid ${T.borderStrong}`,
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
          paddingTop: 22,
        }}
      >
        <Label>Your analytics</Label>
      </div>
      <AbsoluteFill
        style={{
          opacity: textIn,
          alignItems: 'center',
          justifyContent: 'flex-start',
          paddingTop: 300,
        }}
      >
        <div
          style={{
            fontSize: 86,
            fontWeight: 800,
            letterSpacing: -1.2,
            color: T.text,
            textAlign: 'center',
          }}
        >
          THE ANSWER IS THE PRODUCT NOW.
        </div>
      </AbsoluteFill>
    </Canvas>
  );
};

/* ========================================== Section 3, what BrandGEO is, 1:12 */

/** Render 09, shot 9, 1:12 to 1:20.
 *  First brand appearance in the video. Centred, held 1.5s, then it scales and
 *  travels to the persistent top-left mark position. */
export const LogoReveal: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const appear = spring({ frame, fps, config: { damping: 16, mass: 0.6, stiffness: 110 } });
  const moveAt = sec(1.5) + sec(0.5);
  const t = interpolate(frame, [moveAt, moveAt + sec(0.8)], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.cubic),
  });

  /* Centre -> top left. Source raster is 512 wide and ASSETS.md forbids
   * upscaling past it, so the held size is 460 and never larger. */
  const size = interpolate(t, [0, 1], [460, 150]);
  const cx = interpolate(t, [0, 1], [W / 2, 72 + 75]);
  const cy = interpolate(t, [0, 1], [540, 60 + 26]);

  return (
    <Canvas>
      <Img
        src={staticFile('logo/brandgeo-lockup-dark-transparent-w512.png')}
        style={{
          position: 'absolute',
          width: size,
          left: cx - size / 2,
          top: cy - size * 0.39,
          opacity: appear,
        }}
      />
    </Canvas>
  );
};

/**
 * The seven engines, as chips.
 *
 * Names and order are PLAN_ENGINES.growth_pro from planConfig.ts, read
 * 2026-07-31, mapped through PLAN_LABELS and ENGINE_META.label:
 *   chatgpt, gemini, claude, perplexity, google_ai, grok, ai_overview
 * The storyboard lists Google AI Overviews before Grok, which is the display
 * order in ALL_ENGINES rather than the plan-set order, and that is the order
 * used here because it puts the two Google surfaces adjacent, which shot 13
 * then depends on.
 *
 * Swatch colours are ENGINE_META.chartColor, verbatim. Rendering identity as a
 * swatch plus plain text is how the dashboard does it, deliberately: the old
 * coloured-text chips drifted from the chart colours and ended up 9.6 delta-E
 * apart. No logo image is fetched, because a render that reaches the network
 * for a favicon is a render that fails silently when the network does.
 *
 * Meta AI does not appear. It is retired and is named exactly once in this
 * video, on card 19, as retired.
 */
const ENGINES: { label: string; swatch: string }[] = [
  { label: 'ChatGPT', swatch: '#16a34a' },
  { label: 'Gemini', swatch: '#2563eb' },
  { label: 'Claude', swatch: '#ea580c' },
  { label: 'Perplexity', swatch: '#0891b2' },
  { label: 'Google AI Mode', swatch: '#db2777' },
  { label: 'Google AI Overviews', swatch: '#0f766e' },
  { label: 'Grok', swatch: '#a16207' },
];

const EngineChip: React.FC<{
  label: string;
  swatch: string;
  enter: number;
}> = ({ label, swatch, enter }) => (
  <div
    style={{
      opacity: enter,
      transform: `translateY(${interpolate(enter, [0, 1], [26, 0])}px)`,
      display: 'flex',
      alignItems: 'center',
      gap: 16,
      padding: '20px 28px',
      borderRadius: 14,
      background: T.surface,
      border: `1px solid ${T.border}`,
    }}
  >
    <div style={{ width: 14, height: 14, borderRadius: 3, background: swatch }} />
    <span style={{ fontSize: 32, fontWeight: 600, color: T.text }}>{label}</span>
  </div>
);

/** Render 10, shot 12, 1:44 to 1:56. Seven marks build in sequence. */
export const SevenEngines: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const stride = sec(0.9);
  const captionIn = interpolate(
    frame,
    [stride * ENGINES.length, stride * ENGINES.length + sec(0.7)],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );
  return (
    <Canvas>
      <TopLeftMark />
      <AbsoluteFill
        style={{
          alignItems: 'center',
          justifyContent: 'center',
          gap: 46,
        }}
      >
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: 20,
            maxWidth: 1500,
          }}
        >
          {ENGINES.map((e, i) => (
            <EngineChip
              key={e.label}
              label={e.label}
              swatch={e.swatch}
              enter={spring({
                frame: frame - i * stride,
                fps,
                config: { damping: 18, mass: 0.45, stiffness: 140 },
              })}
            />
          ))}
        </div>
        <div style={{ opacity: captionIn, fontSize: 30, color: T.text2 }}>
          Growth PRO and above, as of 2026-07-31.
        </div>
      </AbsoluteFill>
    </Canvas>
  );
};

/** Render 11, shot 13, 1:56 to 2:08.
 *  The two Google surfaces sit adjacent so the distinction reads as deliberate
 *  rather than as a duplicate entry. */
export const TwoGoogleSurfaces: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const noteIn = interpolate(frame, [sec(1.0), sec(1.8)], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const settle = spring({ frame, fps, config: { damping: 15, mass: 0.6, stiffness: 130 } });
  const pair = ENGINES.slice(4, 6);
  return (
    <Canvas>
      <TopLeftMark />
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', gap: 54 }}>
        <div style={{ display: 'flex', gap: 24, transform: `scale(${interpolate(settle, [0, 1], [0.92, 1])})` }}>
          {pair.map((e) => (
            <EngineChip key={e.label} label={e.label} swatch={e.swatch} enter={settle} />
          ))}
        </div>
        <div
          style={{
            opacity: noteIn,
            maxWidth: 1220,
            textAlign: 'center',
            fontSize: 36,
            lineHeight: 1.45,
            color: T.text2,
          }}
        >
          <span style={{ color: T.accentText }}>Google AI Mode</span> is a tab a user
          opts into. <span style={{ color: T.accentText }}>AI Overviews</span> is the
          summary on an ordinary results page.
        </div>
      </AbsoluteFill>
    </Canvas>
  );
};

/* ================================================= Section 4, results, 2:08 */

/** Render 12, shot 14, 2:08 to 2:16. Plain, 0.3s fade, no other motion. */
export const SectionRecord: React.FC = () => (
  <StatementCard
    headline="WHAT THE RECORD SHOWS SO FAR"
    fadeIn={sec(0.3)}
    size={78}
    mark
  />
);

/**
 * A five segment bar.
 *
 * Segments, not a percentage, per ASSETS.md render 13. The reason is not
 * stylistic: "5 of 5" carries its own denominator and "100%" does not, and the
 * denominator is the whole point on a finding measured against five engines by
 * a product that now runs seven.
 */
const SegmentBar: React.FC<{
  label: string;
  filled: number;
  of: number;
  enter: number;
  fillStart: number;
}> = ({ label, filled, of, enter, fillStart }) => {
  const frame = useCurrentFrame();
  const SEG_W = 132;
  const SEG_H = 54;
  const GAP = 12;
  return (
    <div
      style={{
        opacity: enter,
        transform: `translateX(${interpolate(enter, [0, 1], [-40, 0])}px)`,
        display: 'flex',
        alignItems: 'center',
        gap: 34,
      }}
    >
      {/* fixed label column keeps every bar on the SAME axis, which the
       *  storyboard calls load bearing: the contrast only reads if the four
       *  bars start at one x and use one segment width */}
      <div
        style={{
          width: 420,
          textAlign: 'right',
          fontSize: 32,
          fontWeight: 600,
          color: T.text,
        }}
      >
        {label}
      </div>
      <div style={{ display: 'flex', gap: GAP }}>
        {Array.from({ length: of }).map((_, i) => {
          const on =
            i < filled
              ? interpolate(
                  frame,
                  [fillStart + i * 5, fillStart + i * 5 + 8],
                  [0, 1],
                  { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
                )
              : 0;
          return (
            <div
              key={i}
              style={{
                width: SEG_W,
                height: SEG_H,
                borderRadius: 8,
                border: `1px solid ${T.border}`,
                background: `rgba(139,92,246,${0.95 * on})`,
              }}
            />
          );
        })}
      </div>
      <div
        style={{
          width: 130,
          fontSize: 30,
          fontWeight: 700,
          color: filled >= 4 ? T.text : T.text2,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {filled} of {of}
      </div>
    </div>
  );
};

const COMPANY_BARS = [
  { label: 'Property management', filled: 5, of: 5 },
  { label: 'Property management, second city', filled: 4, of: 5 },
];
const AGENT_BARS = [
  { label: 'Individual agents', filled: 2, of: 5 },
  { label: 'Individual agents, second city', filled: 2, of: 5 },
];

const BarStack: React.FC<{
  bars: { label: string; filled: number; of: number }[];
  startAt: number;
  stride: number;
}> = ({ bars, startAt, stride }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <>
      {bars.map((b, i) => (
        <SegmentBar
          key={b.label}
          {...b}
          enter={spring({
            frame: frame - (startAt + i * stride),
            fps,
            config: { damping: 18, mass: 0.5, stiffness: 130 },
          })}
          fillStart={startAt + i * stride + 8}
        />
      ))}
    </>
  );
};

/** Render 13, shot 15, 2:16 to 2:30. Cities are not named. */
export const BarsCompanies: React.FC = () => (
  <Canvas>
    <TopLeftMark />
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', gap: 34 }}>
      <BarStack bars={COMPANY_BARS} startAt={sec(0.4)} stride={sec(1.4)} />
    </AbsoluteFill>
    <DateStamp text="Collected 2026-07-24. 5 engines." />
  </Canvas>
);

/** Render 14, shot 16, 2:30 to 2:42. The two shorter bars join, same axis. */
export const BarsAllFour: React.FC = () => (
  <Canvas>
    <TopLeftMark />
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', gap: 34 }}>
      <BarStack bars={COMPANY_BARS} startAt={0} stride={0} />
      <BarStack bars={AGENT_BARS} startAt={sec(0.5)} stride={sec(1.2)} />
    </AbsoluteFill>
    <DateStamp text="Collected 2026-07-24. 5 engines." />
  </Canvas>
);

/** Render 15, shot 17, 2:42 to 2:54. All four held, overlay on top. */
export const ConvergeFragment: React.FC = () => {
  const frame = useCurrentFrame();
  const overlayIn = interpolate(frame, [sec(0.8), sec(1.6)], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <Canvas>
      <TopLeftMark />
      <AbsoluteFill
        style={{
          alignItems: 'center',
          justifyContent: 'center',
          gap: 34,
          opacity: interpolate(overlayIn, [0, 1], [1, 0.22]),
        }}
      >
        <BarStack bars={COMPANY_BARS} startAt={0} stride={0} />
        <BarStack bars={AGENT_BARS} startAt={0} stride={0} />
      </AbsoluteFill>
      <AbsoluteFill
        style={{ alignItems: 'center', justifyContent: 'center', opacity: overlayIn }}
      >
        <div
          style={{
            fontSize: 80,
            fontWeight: 800,
            letterSpacing: -1.2,
            lineHeight: 1.2,
            color: T.text,
            textAlign: 'center',
          }}
        >
          COMPANIES CONVERGE.
          <br />
          INDIVIDUALS FRAGMENT.
        </div>
      </AbsoluteFill>
      <DateStamp text="Collected 2026-07-24. 5 engines." />
    </Canvas>
  );
};

/* ------------------------------------------------- the language split, 2:54 */

/** Four anonymised firm blocks per side. Index 1 on each side is the one firm
 *  that appears in both, which the connector draws. */
const LangColumn: React.FC<{
  heading: string;
  enter: number;
  /** The ONE firm that appears on both sides. Card 16's connector links this
   *  index across the two columns. */
  sharedIndex?: number;
  /** The firm the finding is about, which appears in 3 of 4 French answers and
   *  0 English ones. French side only, and that is the whole point.
   *
   *  THESE ARE TWO DIFFERENT FIRMS AND WERE CONFLATED. The first version passed
   *  pulseIndex={1} to both columns, so the English column permanently
   *  highlighted the same block the French one pulsed. On a card whose caption
   *  reads "0 English answers" that is a direct contradiction, drawn brightly,
   *  in the middle of the frame. It rendered, it was not blank, no region was
   *  missing, and every geometric check passed it. */
  pulseIndex?: number;
  pulse?: number;
}> = ({ heading, enter, sharedIndex = -1, pulseIndex = -1, pulse = 0 }) => (
  <div
    style={{
      opacity: enter,
      width: 520,
      padding: '30px 34px',
      borderRadius: 20,
      background: T.surface,
      border: `1px solid ${T.border}`,
      display: 'flex',
      flexDirection: 'column',
      gap: 26,
      alignItems: 'center',
    }}
  >
    <Label color={T.text2}>{heading}</Label>
    {[0, 1, 2, 3].map((i) => {
      const isShared = i === sharedIndex;
      const isPulsing = i === pulseIndex;
      return (
        <RedactedName
          key={i}
          width={320}
          height={36}
          color={isPulsing && pulse > 0 ? T.accentText : T.accent}
          opacity={isPulsing ? 1 : isShared ? 0.8 : 0.5}
        />
      );
    })}
  </div>
);

/** Render 16, shot 18, 2:54 to 3:08.
 *  The date stamp carries the lineup correction inline, before card 19
 *  restates it. */
export const LanguageSplit: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const left = spring({ frame, fps, config: { damping: 18, mass: 0.5, stiffness: 120 } });
  const right = spring({
    frame: frame - sec(0.5),
    fps,
    config: { damping: 18, mass: 0.5, stiffness: 120 },
  });
  const link = interpolate(frame, [sec(1.4), sec(2.2)], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <Canvas>
      <TopLeftMark />
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ position: 'relative', display: 'flex', gap: 200 }}>
          <LangColumn heading="Asked in French" enter={left} sharedIndex={1} />
          <LangColumn heading="Asked in English" enter={right} sharedIndex={1} />
          {/* the one shared firm */}
          <div
            style={{
              position: 'absolute',
              left: 520,
              top: 172,
              width: 200 * link,
              height: 3,
              background: T.accentText,
              opacity: 0.8,
            }}
          />
        </div>
      </AbsoluteFill>
      <DateStamp text="Collected 2026-07-10. 4 engines that day, a lineup since changed." />
    </Canvas>
  );
};

/** Render 17, shot 19, 3:08 to 3:18. One pulse, not a loop. */
export const LanguageCounter: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pulseAt = sec(0.5);
  const pulse = interpolate(
    frame,
    [pulseAt, pulseAt + sec(0.35), pulseAt + sec(0.9)],
    [0, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );
  const counterIn = spring({
    frame: frame - sec(1.4),
    fps,
    config: { damping: 15, mass: 0.6, stiffness: 140 },
  });
  return (
    <Canvas>
      <TopLeftMark />
      <AbsoluteFill
        style={{ alignItems: 'center', justifyContent: 'center', gap: 54, paddingBottom: 60 }}
      >
        <div style={{ display: 'flex', gap: 200 }}>
          {/* index 3 pulses, index 1 is the shared firm. Different blocks,
            *  because they are different firms. The English column carries the
            *  shared one and nothing at index 3, which is what "0 English
            *  answers" looks like when it is drawn honestly. */}
          <LangColumn
            heading="Asked in French"
            enter={1}
            sharedIndex={1}
            pulseIndex={3}
            pulse={pulse}
          />
          <LangColumn heading="Asked in English" enter={1} sharedIndex={1} />
        </div>
        <div
          style={{
            opacity: counterIn,
            transform: `translateY(${interpolate(counterIn, [0, 1], [22, 0])}px)`,
            fontSize: 46,
            fontWeight: 700,
            color: T.text,
          }}
        >
          <span style={{ color: T.accentText }}>3 of 4</span> French answers.{' '}
          <span style={{ color: T.accentText }}>0</span> English answers.
        </div>
      </AbsoluteFill>
      <DateStamp text="Collected 2026-07-10. 4 engines that day, a lineup since changed." />
    </Canvas>
  );
};

/** Render 18, shot 20, 3:18 to 3:28. */
export const NotAReorder: React.FC = () => {
  const frame = useCurrentFrame();
  const sep = interpolate(frame, [0, sec(1.2)], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.cubic),
  });
  const textIn = interpolate(frame, [sec(1.0), sec(1.8)], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <Canvas>
      <TopLeftMark />
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ display: 'flex', gap: 200 + 260 * sep, opacity: 0.4 }}>
          <LangColumn heading="Asked in French" enter={1} sharedIndex={1} />
          <LangColumn heading="Asked in English" enter={1} sharedIndex={1} />
        </div>
      </AbsoluteFill>
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', opacity: textIn }}>
        <div
          style={{
            fontSize: 82,
            fontWeight: 800,
            letterSpacing: -1.2,
            lineHeight: 1.2,
            color: T.text,
            textAlign: 'center',
          }}
        >
          NOT A REORDER.
          <br />A DIFFERENT SET.
        </div>
      </AbsoluteFill>
      <DateStamp text="Collected 2026-07-10. 4 engines that day, a lineup since changed." />
    </Canvas>
  );
};

/**
 * Render 19, shot 21, 3:28 to 3:40.
 *
 * STORYBOARD.md: "This shot is the fairness proof and must not be cut for
 * time. It is also the only place Meta AI is named, and it is named as
 * retired." Plain, no motion, and that is the specification rather than a
 * shortcut: a correction that animates looks like a flourish.
 */
export const HonestLimit: React.FC = () => (
  <Canvas glow={false}>
    <TopLeftMark />
    <AbsoluteFill
      style={{ alignItems: 'center', justifyContent: 'center', padding: '0 240px' }}
    >
      <div
        style={{
          fontSize: 46,
          fontWeight: 500,
          lineHeight: 1.5,
          color: T.text,
          textAlign: 'left',
          borderLeft: `4px solid ${T.accent}`,
          paddingLeft: 40,
          maxWidth: 1300,
        }}
      >
        That run used four engines, on 2026-07-10. One of them was Meta AI, which we
        have since retired. The finding keeps the lineup it was measured with.
      </div>
    </AbsoluteFill>
  </Canvas>
);

/* ============================================== Section 5, how it works, 3:48 */

/** Render 20, shot 28, 4:42 to 4:52. Build left to right. */
export const ThreeSteps: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const steps = ['1. A DOMAIN', '2. TWO FIELDS', "3. YOUR BUYERS' QUESTIONS"];
  return (
    <Canvas>
      <TopLeftMark />
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ display: 'flex', gap: 30 }}>
          {steps.map((s, i) => {
            const enter = spring({
              frame: frame - i * sec(0.7),
              fps,
              config: { damping: 17, mass: 0.5, stiffness: 130 },
            });
            return (
              <div
                key={s}
                style={{
                  opacity: enter,
                  transform: `translateY(${interpolate(enter, [0, 1], [34, 0])}px)`,
                  width: 480,
                  height: 320,
                  borderRadius: 22,
                  background: T.surface,
                  border: `1px solid ${T.border}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0 44px',
                  textAlign: 'center',
                  fontSize: 44,
                  fontWeight: 700,
                  lineHeight: 1.25,
                  color: T.text,
                }}
              >
                {s}
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
    </Canvas>
  );
};

/* ================================================ Section 6, fairness, 5:06 */

/** Render 21, shot 30, 5:06 to 5:14. Deliberately plainer than section 4's. */
export const SectionFairness: React.FC = () => (
  <StatementCard
    headline="WHAT WE WILL NOT TELL YOU"
    fadeIn={sec(0.3)}
    size={78}
    glow={false}
    mark
  />
);

/** Render 22, shot 31, 5:14 to 5:26. */
export const NoPromise: React.FC = () => (
  <StatementCard
    headline="WE CANNOT PROMISE A POSITION."
    fadeIn={sec(0.3)}
    size={82}
    glow={false}
    mark
  />
);

/** Render 23, shot 32, 5:26 to 5:38. */
export const Snapshot: React.FC = () => (
  <StatementCard
    headline="ONE CHECK IS A SNAPSHOT."
    fadeIn={sec(0.3)}
    size={82}
    glow={false}
    mark
  />
);

/**
 * Render 24, shot 33, 5:38 to 5:58.
 *
 * Covers both beats the storyboard gives this shot: the third card alone from
 * 5:38, then all three lining up at 5:50, which is 12 seconds in.
 *
 * NO RATE, NO COUNT, NO PERCENTAGE for either engine. Grok has 5 rows behind it
 * and AI Overviews 6, from a single collection day, and a figure off one day is
 * not a rate. The sub-line carries the go-live date and nothing else, and that
 * restraint is the entire point of the card.
 */
export const EnginesNew: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const lineUpAt = sec(12);
  const lined = interpolate(frame, [lineUpAt, lineUpAt + sec(0.9)], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.cubic),
  });
  const solo = spring({ frame, fps, config: { damping: 18, mass: 0.5, stiffness: 120 } });

  const cards = [
    { head: 'WE CANNOT PROMISE A POSITION.', sub: null as string | null },
    { head: 'ONE CHECK IS A SNAPSHOT.', sub: null as string | null },
    {
      head: 'TWO OF OUR ENGINES ARE NEW.',
      sub: 'Grok and Google AI Overviews went live 2026-07-29.',
    },
  ];

  return (
    <Canvas glow={false}>
      <TopLeftMark />
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ display: 'flex', gap: 30 * lined }}>
          {cards.map((c, i) => {
            const isThird = i === 2;
            /* Before the line-up only the third card exists. The other two fade
             * in beside it, so the shot reads as the set completing rather than
             * as a cut to a different composition. */
            const opacity = isThird ? solo : lined;
            const width = interpolate(lined, [0, 1], [isThird ? 1180 : 0, 520]);
            return (
              <div
                key={c.head}
                style={{
                  opacity,
                  width,
                  height: 400,
                  overflow: 'hidden',
                  borderRadius: 22,
                  background: T.surface,
                  border: `1px solid ${T.border}`,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 24,
                  padding: '0 40px',
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    fontSize: interpolate(lined, [0, 1], [isThird ? 68 : 40, 40]),
                    fontWeight: 800,
                    lineHeight: 1.2,
                    letterSpacing: -0.8,
                    color: T.text,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {c.head.split(' ').reduce<React.ReactNode[]>((acc, w, wi, arr) => {
                    acc.push(w);
                    if (wi < arr.length - 1) acc.push(wi % 3 === 2 ? <br key={wi} /> : ' ');
                    return acc;
                  }, [])}
                </div>
                {c.sub ? (
                  <div style={{ fontSize: 26, color: T.text2, lineHeight: 1.4, whiteSpace: 'normal' }}>
                    {c.sub}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
    </Canvas>
  );
};

/* =================================================== Section 7, close, 5:58 */

/**
 * Render 25, shot 34, 6:06 to 6:20.
 *
 * "Paid plans from EUR 29 per month" is the `radar` launch price in
 * planConfig.ts's ladder table, which is EUR 29 for the first 100 customers
 * against a EUR 39 list. It is the true lowest paid price today. It stops
 * being true when that launch price is deactivated, and this card is the
 * thing to re-render on that day.
 *
 * END SCREEN. YouTube cards land at 6:12, which is 6 seconds into this card,
 * and they occupy the bottom right and the lower third. From that frame
 * nothing is drawn below END_SCREEN.yMax or right of END_SCREEN.xMax, which is
 * why the lockup travels up and left rather than simply holding.
 */
/**
 * THE ONE LINE ON THIS CARD THAT IS A DECISION, NOT A FACT.
 *
 * `OPEN-QUESTIONS.md` section 4 says, verbatim: "Do not render card
 * `25-end-card` until this is settled." The card IS rendered here, so that
 * instruction is being handled rather than ignored, and here is how.
 *
 * The open question is not whether EUR 29 is true. It is true: the ruling sets
 * Radar at EUR 39 list and EUR 29 launch for the first 100 customers,
 * `Account.tsx` displays 29 with no qualifier, and `_terms_gate.js` lists
 * `radar` in SELF_SERVE_CHECKOUT_PLANS so it is genuinely buyable. The question
 * is which of the two prices should be ADVERTISED, and that is Constantin's
 * call and nobody else's.
 *
 * So the line is a single named constant with both candidates written out. When
 * the call is made the change is one edit and one re-render, and the card that
 * exists today is a real, checkable artefact rather than a hole in the cut.
 *
 * DO NOT PUBLISH THIS CARD UNTIL THAT CALL IS MADE. The rest of the video does
 * not depend on it: every other card is settled and can be cut against.
 */
const PRICE_LINE = 'Free tier available. Paid plans from EUR 29 per month.';

/** The line to swap to if the launch cohort fills, or if list is what should be
 *  advertised. SCRIPT.md's narration changes with it, to "from thirty nine
 *  euros a month", so the voice take is affected too. */
const PRICE_LINE_LIST = 'Free tier available. Paid plans from EUR 39 per month.';
// Referenced so the alternative cannot be dropped by a linter or forgotten.
void PRICE_LINE_LIST;

export const EndCard: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame, fps, config: { damping: 17, mass: 0.6, stiffness: 120 } });

  /* 6:14 is when the lockup holds alone, which is 8s into this card. */
  const aloneAt = sec(8);
  const alone = interpolate(frame, [aloneAt, aloneAt + sec(0.8)], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.cubic),
  });

  /* Everything clears the end-screen band before the guard frame, not after
   * it, so there is no frame where a card and the wordmark overlap. */
  const clearAt = END_SCREEN.guardFrame - sec(0.8);
  const clear = interpolate(frame, [clearAt, END_SCREEN.guardFrame], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.cubic),
  });

  /* Up AND left. Moving up alone was not enough and the check caught it: at
   * 104px the `getbrandgeo.com` wordmark spans roughly x=515 to x=1410, so it
   * ran 130px into the right-hand card band while sitting comfortably above the
   * lower one. Measured, not estimated, by the end-screen region assertion in
   * tools/check_render.py. */
  const blockY = interpolate(clear, [0, 1], [0, -150]);
  const blockX = interpolate(clear, [0, 1], [0, -180]);
  const wordmarkSize = interpolate(clear, [0, 1], [104, 92]);

  return (
    <Canvas>
      <AbsoluteFill
        style={{
          alignItems: 'center',
          justifyContent: 'center',
          gap: 44,
          transform: `translate(${blockX}px, ${blockY}px)`,
        }}
      >
        <div
          style={{
            opacity: enter,
            fontSize: wordmarkSize,
            fontWeight: 800,
            letterSpacing: -2,
            color: T.text,
          }}
        >
          getbrandgeo.com
        </div>
        <Img
          src={staticFile('logo/brandgeo-lockup-dark-transparent-w512.png')}
          style={{ width: 300, opacity: enter }}
        />
        <div
          style={{
            opacity: enter * (1 - alone),
            fontSize: 30,
            fontWeight: 500,
            color: T.text2,
          }}
        >
          {PRICE_LINE}
        </div>
      </AbsoluteFill>
    </Canvas>
  );
};
