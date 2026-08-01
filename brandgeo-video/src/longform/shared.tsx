/**
 * Shared tokens and primitives for the long-form brand introduction cards.
 *
 * Spec:  docs/growth/CAMPAIGN-2026-07-30/youtube/longform/STORYBOARD.md
 *        "Visual grammar, applied to every shot"
 * Script and timings: SCRIPT.md
 * Render names and content: ASSETS.md section 2.1
 *
 * 1920 x 1080 at fps 30. These are NOT the vertical pillar masters and none of
 * the 1080x1920 safe insets apply. The constraint that does apply is YouTube's
 * end-screen band, and it applies to exactly one card. See END_SCREEN.
 */

import React from 'react';
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from 'remotion';
import { INTER, loadInter } from '../fonts';

loadInter();

export const W = 1920;
export const H = 1080;
export const FPS = 30;

/** Seconds to frames at this project's fps. Used so a card's duration can be
 *  written as the storyboard writes it and read back against SCRIPT.md. */
export const sec = (s: number): number => Math.round(s * FPS);

/**
 * Canvas is #0a0b0e, from STORYBOARD.md's visual grammar. This is deliberately
 * NOT the #090A0F the four vertical pillar cuts use. Two different packages,
 * two different grammars, and matching them here would be an undocumented edit
 * to a spec somebody signed off.
 */
export const T = {
  bg: '#0a0b0e',
  surface: '#121319',
  surfaceRaised: '#181920',
  border: '#23242b',
  borderStrong: '#32333c',
  /** Fill only. Never type. STORYBOARD.md visual grammar. */
  accent: '#8b5cf6',
  accentDeep: '#7c3aed',
  /** The accent value that IS allowed as type. */
  accentText: '#a78bfa',
  text: '#e8e9ed',
  text2: '#9ba1ac',
  /** Date stamps. */
  text3: '#7d838f',
  ok: '#34d399',
  warn: '#fbbf24',
} as const;

export const FONT = INTER;

/**
 * YouTube end-screen elements occupy the last 5 to 20 seconds and sit bottom
 * right and across the lower third. ASSETS.md places them at 6:12, which is 6
 * seconds into the 14 second end card, and warns that the wordmark will be
 * covered otherwise. Only card 25 is affected; every other card ends before
 * 6:12 and is unconstrained.
 */
export const END_SCREEN = {
  /** Nothing below this y after the guard frame. */
  yMax: 720,
  /** Nothing right of this x after the guard frame. */
  xMax: 1280,
  guardFrame: sec(6),
} as const;

/* --------------------------------------------------------------- primitives */

export const Canvas: React.FC<{
  children: React.ReactNode;
  /** Decorative floor glow. Off for the plainest cards, which the storyboard
   *  explicitly wants plain. */
  glow?: boolean;
}> = ({ children, glow = true }) => (
  <AbsoluteFill style={{ backgroundColor: T.bg, fontFamily: FONT }}>
    {glow ? (
      <AbsoluteFill
        style={{
          background:
            'radial-gradient(52% 46% at 50% 62%, rgba(124,58,237,0.15) 0%, rgba(10,11,14,0) 72%)',
        }}
      />
    ) : null}
    {children}
  </AbsoluteFill>
);

/**
 * The date stamp. STORYBOARD.md: bottom-left, Inter Medium 24, #7d838f, "in
 * the same frame" as the figure it dates, "never deferred to the description".
 *
 * `fadeInAt` exists because shot 3 is shot 2 with the stamp arriving; on every
 * other card the stamp is present from frame 0.
 */
export const DateStamp: React.FC<{ text: string; fadeInAt?: number }> = ({
  text,
  fadeInAt = 0,
}) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [fadeInAt, fadeInAt + 12], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <div
      style={{
        position: 'absolute',
        left: 96,
        bottom: 64,
        opacity,
        fontSize: 24,
        fontWeight: 500,
        letterSpacing: 0.2,
        color: T.text3,
        lineHeight: 1.4,
        maxWidth: 1100,
      }}
    >
      {text}
    </div>
  );
};

/**
 * The persistent top-left mark.
 *
 * STORYBOARD.md: absent until 1:12, persistent afterwards. So it is opt-in per
 * card rather than baked into Canvas, and every card before shot 9 must leave
 * it off. Getting this wrong would put a brand mark on the cold open, which is
 * the one thing the hook rule forbids.
 */
export const TopLeftMark: React.FC<{ opacity?: number }> = ({ opacity = 1 }) => (
  <Img
    src={staticFile('logo/brandgeo-mark-transparent-h512.png')}
    style={{
      position: 'absolute',
      left: 72,
      top: 60,
      height: 52,
      opacity,
    }}
  />
);

/** Full-frame statement card. The storyboard's most common shot by far. */
export const StatementCard: React.FC<{
  headline: string;
  sub?: string;
  /** Frame 0 must be at full opacity on card 1, which is the thumbnail source. */
  fadeIn?: number;
  size?: number;
  glow?: boolean;
  mark?: boolean;
}> = ({ headline, sub, fadeIn = 0, size = 96, glow = true, mark = false }) => {
  const frame = useCurrentFrame();
  const opacity =
    fadeIn === 0
      ? 1
      : interpolate(frame, [0, fadeIn], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });
  return (
    <Canvas glow={glow}>
      {mark ? <TopLeftMark /> : null}
      <AbsoluteFill
        style={{
          opacity,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 200px',
          textAlign: 'center',
          gap: 34,
        }}
      >
        <div
          style={{
            fontSize: size,
            fontWeight: 800,
            lineHeight: 1.1,
            letterSpacing: -1.5,
            color: T.text,
          }}
        >
          {headline}
        </div>
        {sub ? (
          <div
            style={{
              fontSize: 34,
              fontWeight: 500,
              lineHeight: 1.4,
              color: T.text2,
              maxWidth: 1240,
            }}
          >
            {sub}
          </div>
        ) : null}
      </AbsoluteFill>
    </Canvas>
  );
};

/**
 * A redacted brand name.
 *
 * ASSETS.md render 02: "Never render the real firm name. Draw a filled rounded
 * rect at the measured width of a plausible name. Do not render then cover."
 *
 * So this draws a block and there is no string anywhere in the component tree
 * to leak. A blur or an overlay would leave the glyphs in the pixel buffer of
 * an intermediate, and the intermediates are PNGs that get archived.
 */
export const RedactedName: React.FC<{
  width: number;
  height?: number;
  opacity?: number;
  color?: string;
}> = ({ width, height = 34, opacity = 1, color = T.accent }) => (
  <div
    style={{
      width,
      height,
      opacity,
      borderRadius: height / 2,
      background: color,
    }}
  />
);

/** Small uppercase label used above columns and panels. */
export const Label: React.FC<{
  children: React.ReactNode;
  color?: string;
  size?: number;
}> = ({ children, color = T.text3, size = 24 }) => (
  <div
    style={{
      fontSize: size,
      fontWeight: 700,
      letterSpacing: 3,
      textTransform: 'uppercase',
      color,
    }}
  >
    {children}
  </div>
);
