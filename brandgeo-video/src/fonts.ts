/**
 * Inter, loaded from public/fonts and blocked on.
 *
 * WHY THIS FILE EXISTS
 * All four pillar compositions declare a font stack starting `Inter, "SF Pro
 * Display", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif` and
 * nothing ever loaded Inter. Remotion renders in headless Chrome, which has no
 * user-installed fonts, so every frame rendered so far fell through the whole
 * stack to Segoe UI. Nothing failed and nothing warned. The campaign's own
 * ASSETS.md is explicit that Inter is not a system font on this machine and
 * must not be substituted, so the delivered cuts were off-brand without
 * anything reporting it.
 *
 * Registering the face is not enough on its own. Chrome loads a webfont
 * asynchronously, and Remotion will happily screenshot frame 0 before the face
 * is ready, which produces a first-frame flash of the fallback. Since frame 0
 * of the long-form cold open is also the thumbnail source, that flash would be
 * the thumbnail. `delayRender` holds the render open until `document.fonts`
 * reports every weight loaded.
 *
 * Weights map to the five files that exist. Do not reference a weight that has
 * no file: Chrome will synthesise it and the synthetic bold is visibly wrong
 * against the real one.
 */

import { continueRender, delayRender, staticFile } from 'remotion';

/** The stack every component should use. Inter first, real fallbacks after. */
export const INTER =
  'Inter, "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

/** Monospace stack. No mono file ships in _shared/fonts, so this one genuinely
 *  does fall back, and it is a deliberate fallback rather than an accident. */
export const MONO = '"JetBrains Mono", "SF Mono", ui-monospace, Menlo, monospace';

const FACES: { file: string; weight: number }[] = [
  { file: 'fonts/Inter-Regular.ttf', weight: 400 },
  { file: 'fonts/Inter-Medium.ttf', weight: 500 },
  { file: 'fonts/Inter-SemiBold.ttf', weight: 600 },
  { file: 'fonts/Inter-Bold.ttf', weight: 700 },
  { file: 'fonts/Inter-ExtraBold.ttf', weight: 800 },
];

let installed = false;

/** Idempotent. Safe to call from every composition's module scope. */
export const loadInter = (): void => {
  if (installed || typeof document === 'undefined') return;
  installed = true;

  const css = FACES.map(
    ({ file, weight }) => `@font-face{
  font-family:'Inter';
  src:url('${staticFile(file)}') format('truetype');
  font-weight:${weight};
  font-style:normal;
  font-display:block;
}`,
  ).join('\n');

  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  /**
   * The wait is RACED against a hard ceiling, and that is not belt and braces.
   * The first version of this file awaited the load and then `document.fonts
   * .ready`, and P2ConsensusSplit died with
   * `A delayRender() "Loading Inter" was called but not cleared after 28000ms`
   * while P1 and P3 rendered fine from the identical code path. A rejected
   * promise would have been caught; this one never settled at all, which
   * `.catch` cannot help with. With `font-display: block` a face that never
   * arrives leaves `document.fonts.load` pending forever, so the only safe
   * shape is one where continueRender is reached on a timer no matter what.
   *
   * Eight seconds is far longer than a local file needs and far shorter than
   * Remotion's own 28s timeout, so a slow load still succeeds and a stuck one
   * degrades to the fallback instead of killing the render.
   */
  const handle = delayRender('Loading Inter');
  let done = false;
  const finish = () => {
    if (done) return;
    done = true;
    continueRender(handle);
  };

  setTimeout(finish, 8000);

  Promise.all(FACES.map(({ weight }) => document.fonts.load(`${weight} 64px Inter`)))
    .then(finish)
    .catch(finish);
};

/**
 * True when Chrome has the real Inter face available at this weight.
 *
 * Exposed so a check can assert the font LOADED rather than assume it, which is
 * the whole reason this module exists. `FontProbe` renders this alongside a
 * measurable width comparison so the answer is visible in a delivered frame and
 * not only in a console nobody reads during a headless render.
 */
export const interLoaded = (weight = 800): boolean =>
  typeof document !== 'undefined' && document.fonts.check(`${weight} 64px Inter`);
