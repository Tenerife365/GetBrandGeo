/**
 * FontProbe
 *
 * A test fixture, not a deliverable. It exists so "Inter is loaded" is a
 * measurement rather than a belief.
 *
 * THE PROBLEM IT SOLVES. Every composition in this project asks for Inter and
 * falls back through `"SF Pro Display", -apple-system, BlinkMacSystemFont,
 * "Segoe UI", sans-serif`. Remotion renders in headless Chrome, which carries
 * no user-installed fonts, so before src/fonts.ts existed the whole stack fell
 * through to a system face and every delivered frame was off-brand. Nothing
 * errored. The campaign's ASSETS.md is explicit that Inter must not be
 * substituted, and it was being substituted on every frame.
 *
 * A font is the hardest kind of regression to see by eye, because the wrong one
 * still looks like a font. So this renders the SAME string three times:
 *
 *   row A   the real Inter stack
 *   row B   a family that cannot resolve, forcing the platform fallback
 *   row C   the literal result of document.fonts.check('800 64px Inter')
 *
 * tools/check_fonts.py measures the ink in rows A and B. If Inter did not load,
 * A and B are rendered by the same face and their ink counts match almost
 * exactly. The check fails on that equality. Row C is the belt: it turns the
 * browser's own answer into pixels, so a human opening the frame sees it too.
 *
 * The probe string is deliberately full of glyphs whose Inter forms differ
 * clearly from Segoe UI: a single-storey g, the 1, and tabular digits.
 */

import React from 'react';
import { AbsoluteFill, Composition } from 'remotion';
import { INTER, interLoaded, loadInter } from './fonts';

loadInter();

const PROBE = 'Gemini 1 2 3 5 7 gq @ ChatGPT';

/** A family that will never resolve, so this row is guaranteed to be the
 *  platform fallback and is the control the real row is measured against. */
const NO_SUCH_FONT = '"__brandgeo_no_such_font__", sans-serif';

const Row: React.FC<{ family: string; label: string; top: number }> = ({
  family,
  label,
  top,
}) => (
  <div style={{ position: 'absolute', left: 80, top, width: 1760 }}>
    <div
      style={{
        fontFamily: 'monospace',
        fontSize: 22,
        color: '#7d838f',
        marginBottom: 10,
      }}
    >
      {label}
    </div>
    <div style={{ fontFamily: family, fontSize: 88, fontWeight: 800, color: '#e8e9ed' }}>
      {PROBE}
    </div>
  </div>
);

export const FontProbe: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: '#0a0b0e' }}>
    <Row family={INTER} label="A / requested Inter" top={120} />
    <Row family={NO_SUCH_FONT} label="B / forced fallback" top={400} />
    <div
      style={{
        position: 'absolute',
        left: 80,
        top: 700,
        fontFamily: 'monospace',
        fontSize: 40,
        color: interLoaded() ? '#34d399' : '#f87171',
      }}
    >
      {`document.fonts.check('800 64px Inter') = ${String(interLoaded())}`}
    </div>
  </AbsoluteFill>
);

export const FontProbeComposition: React.FC = () => (
  <Composition
    id="FontProbe"
    component={FontProbe}
    durationInFrames={30}
    fps={30}
    width={1920}
    height={1080}
  />
);
