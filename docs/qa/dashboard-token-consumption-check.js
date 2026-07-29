/* Does the dashboard actually USE the shell tokens, or just define them?
 *
 * WHY THIS EXISTS
 *   docs/qa/dashboard-visual-system-75e1ede-contrast.md proved the tokens in
 *   index.css are correct in both themes. It could NOT prove the components
 *   consume them. That is not a theoretical gap: the 2026-07-26 audit found two
 *   engine colour maps that were invisible to the spec's own verification
 *   harness because they key off Tailwind class names rather than hex. A token
 *   can be right and unused.
 *
 *   Closing it needs an authenticated session, which no agent has.
 *
 * HOW TO RUN
 *   1. Log in at https://app.getbrandgeo.com and land on any page with the
 *      sidebar visible.
 *   2. Open DevTools, Console tab.
 *   3. Paste this whole file, press Enter.
 *   4. Paste the printed table back to me.
 *   5. Toggle the theme and run it again. Both themes matter; light mode is the
 *      one that shipped with the least review.
 *
 * It reads only. It changes nothing and sends nothing anywhere.
 */
(() => {
  const px = s => (s.match(/[\d.]+/g) || []).slice(0, 3).map(Number);
  const lum = c => {
    const [r, g, b] = c.map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const ratio = (a, b) => { const [L1, L2] = [lum(a), lum(b)].sort((x, y) => y - x); return +((L1 + 0.05) / (L2 + 0.05)).toFixed(2); };
  // Walk up for the first ancestor that actually paints a background.
  const bgOf = el => {
    let n = el;
    while (n && n !== document.documentElement) {
      const c = getComputedStyle(n).backgroundColor;
      const m = (c.match(/[\d.]+/g) || []);
      if (m.length && (m.length < 4 || Number(m[3]) > 0.99)) return px(c);
      n = n.parentElement;
    }
    return px(getComputedStyle(document.body).backgroundColor);
  };

  const theme = document.documentElement.className || '(dark, no class)';
  const vw = document.documentElement.clientWidth;
  if (vw < 100) return console.warn('Zero-width viewport. Widen the window and re-run; every layout number would be false.');

  const aside = document.querySelector('aside') || document.querySelector('nav');
  const main = document.querySelector('main');
  if (!aside || !main) return console.warn('No sidebar or main found. Are you on a logged-in page with the shell visible?');

  const navLinks = [...aside.querySelectorAll('a')];
  // The active item is whichever link matches the current path most specifically.
  const active = navLinks
    .filter(a => a.getAttribute('href') && location.pathname.startsWith(a.getAttribute('href')))
    .sort((a, b) => b.getAttribute('href').length - a.getAttribute('href').length)[0];
  const idle = navLinks.find(a => a !== active);

  const asideBg = px(getComputedStyle(aside).backgroundColor);
  const mainBg = bgOf(main);
  const asideBorder = px(getComputedStyle(aside).borderRightColor || getComputedStyle(aside).borderColor);

  const rows = [];
  const add = (what, fg, bg, floor) => rows.push({
    what, ratio: ratio(fg, bg), floor,
    verdict: ratio(fg, bg) >= floor ? 'PASS' : 'FAIL'
  });

  add('sidebar surface vs canvas', asideBg, mainBg, 3);
  add('sidebar BORDER vs canvas', asideBorder, mainBg, 3);
  if (active) {
    add('active nav label', px(getComputedStyle(active).color), bgOf(active), 4.5);
    add('active nav surface vs sidebar', px(getComputedStyle(active).backgroundColor), asideBg, 3);
    const bl = getComputedStyle(active).borderLeftColor;
    if (bl && !/rgba\(0, 0, 0, 0\)/.test(bl)) add('active rail vs sidebar', px(bl), asideBg, 3);
  }
  if (idle) add('idle nav label', px(getComputedStyle(idle).color), asideBg, 4.5);

  // Are the named tokens resolving at all, or falling back?
  const root = getComputedStyle(document.documentElement);
  const tokens = ['--surface-nav', '--border-nav', '--surface-nav-active', '--text-nav-active',
                  '--text-nav-idle', '--rail-active', '--surface-bar'];
  const tokenState = {};
  tokens.forEach(t => { const v = root.getPropertyValue(t).trim(); tokenState[t] = v || 'UNDEFINED'; });

  // The real question: is the painted colour the token's colour?
  const asMatches = (painted, tokenName) => {
    const v = tokenState[tokenName];
    if (!v || v === 'UNDEFINED') return 'token undefined';
    const t = v.split(/\s+/).map(Number);
    return t.length === 3 && t.every((n, i) => Math.abs(n - painted[i]) <= 1) ? 'YES' : `NO (painted ${painted.join(' ')})`;
  };

  console.log('%cTHEME: ' + theme, 'font-weight:bold');
  console.table(rows);
  console.log('%cToken definitions', 'font-weight:bold');
  console.table(tokenState);
  console.log('%cAre components painting the token values?', 'font-weight:bold');
  console.table({
    'sidebar bg uses --surface-nav': asMatches(asideBg, '--surface-nav'),
    'sidebar border uses --border-nav': asMatches(asideBorder, '--border-nav'),
    'active nav bg uses --surface-nav-active': active ? asMatches(px(getComputedStyle(active).backgroundColor), '--surface-nav-active') : 'no active link found',
    'active nav text uses --text-nav-active': active ? asMatches(px(getComputedStyle(active).color), '--text-nav-active') : 'no active link found',
    'idle nav text uses --text-nav-idle': idle ? asMatches(px(getComputedStyle(idle).color), '--text-nav-idle') : 'no idle link found'
  });
  console.log('route:', location.pathname, '| viewport:', vw, '| nav links:', navLinks.length);
})();
