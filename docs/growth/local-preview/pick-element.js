/* ── BrandGEO local preview: element picker ───────────────────────────────────
 *
 * WHAT THIS IS
 *   A console snippet for pointing at something on http://localhost:8899 and
 *   getting back everything Claude needs to find it in index.html and to know
 *   what it currently measures.
 *
 * WHY IT LIVES HERE AND NOT IN brandgeo/web/
 *   deploy.php copies every changed file under brandgeo/web/ straight to the
 *   cPanel docroot. Anything put there ships. This file is under docs/ so it
 *   physically cannot deploy, and it is never referenced by any page.
 *
 * IT IS READ ONLY
 *   No network calls, no writes, no page mutation beyond a temporary outline
 *   that is removed when you stop. Refreshing clears it completely.
 *
 * HOW TO USE
 *   1. Open http://localhost:8899 in your normal browser.
 *   2. F12, Console tab, paste this whole file, Enter.
 *   3. Click anything on the page. The details print and copy to your clipboard.
 *   4. Paste into chat.
 *   5. Escape to stop. Shift-click to pick the PARENT of what you clicked,
 *      which is what you want for "this whole card", "this whole row".
 *
 * ──────────────────────────────────────────────────────────────────────────── */

(() => {
  if (window.__bgPick) { window.__bgPick.stop(); }

  const HL = 'bg-pick-outline';
  const style = document.createElement('style');
  style.id = HL;
  style.textContent = `.${HL}-on { outline: 2px solid #a78bfa !important;
    outline-offset: 2px !important; cursor: crosshair !important; }`;
  document.head.appendChild(style);

  let hovered = null;

  /* A selector stable enough for me to grep index.html for. Prefers id, then a
     class chain, then nth-of-type as a last resort. */
  function selectorFor(el) {
    if (el.id) return '#' + el.id;
    const parts = [];
    let node = el;
    for (let depth = 0; node && node.nodeType === 1 && depth < 4; depth++) {
      let seg = node.tagName.toLowerCase();
      const cls = (node.className || '').toString().trim().split(/\s+/)
        .filter(c => c && !c.startsWith(HL));
      if (cls.length) seg += '.' + cls.slice(0, 3).join('.');
      else {
        const sibs = [...(node.parentElement ? node.parentElement.children : [])]
          .filter(s => s.tagName === node.tagName);
        if (sibs.length > 1) seg += `:nth-of-type(${sibs.indexOf(node) + 1})`;
      }
      parts.unshift(seg);
      if (node.id) { parts[0] = '#' + node.id; break; }
      node = node.parentElement;
    }
    return parts.join(' > ');
  }

  function lineBoxes(el) {
    try {
      const r = document.createRange();
      r.selectNodeContents(el);
      return [...new Set([...r.getClientRects()]
        .filter(x => x.height > 2).map(x => Math.round(x.top)))].length;
    } catch { return null; }
  }

  function describe(el) {
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    return {
      selector: selectorFor(el),
      tag: el.tagName.toLowerCase(),
      classes: (el.className || '').toString().trim() || null,
      text: (el.innerText || '').trim().slice(0, 120) || null,
      box: { w: Math.round(r.width), h: Math.round(r.height),
             top: Math.round(r.top), left: Math.round(r.left) },
      lineBoxes: lineBoxes(el),
      type: {
        family: cs.fontFamily.split(',')[0].replace(/["']/g, ''),
        size: cs.fontSize, weight: cs.fontWeight,
        lineHeight: cs.lineHeight, letterSpacing: cs.letterSpacing
      },
      colour: { fg: cs.color, bg: cs.backgroundColor, border: cs.borderColor },
      layout: { display: cs.display, position: cs.position,
                margin: cs.margin, padding: cs.padding },
      viewport: { w: document.documentElement.clientWidth, h: window.innerHeight },
      overflowsViewport: r.right > document.documentElement.clientWidth + 1
    };
  }

  const onMove = e => {
    if (hovered) hovered.classList.remove(HL + '-on');
    hovered = e.target;
    hovered.classList.add(HL + '-on');
  };

  const onClick = e => {
    e.preventDefault(); e.stopPropagation();
    const target = e.shiftKey && e.target.parentElement ? e.target.parentElement : e.target;
    const info = describe(target);
    const out = JSON.stringify(info, null, 2);
    console.log('%c── picked ──', 'color:#a78bfa;font-weight:700');
    console.log(out);
    try {
      navigator.clipboard.writeText(out);
      console.log('%ccopied to clipboard, paste it into chat', 'color:#34d399');
    } catch {
      console.log('clipboard blocked, copy the JSON above by hand');
    }
  };

  const onKey = e => { if (e.key === 'Escape') window.__bgPick.stop(); };

  document.addEventListener('mousemove', onMove, true);
  document.addEventListener('click', onClick, true);
  document.addEventListener('keydown', onKey, true);

  window.__bgPick = {
    stop() {
      document.removeEventListener('mousemove', onMove, true);
      document.removeEventListener('click', onClick, true);
      document.removeEventListener('keydown', onKey, true);
      if (hovered) hovered.classList.remove(HL + '-on');
      document.getElementById(HL)?.remove();
      delete window.__bgPick;
      console.log('%cpicker off', 'color:#9ba1ac');
    }
  };

  console.log('%cBrandGEO picker on. Click an element. Shift-click for its parent. Escape to stop.',
    'color:#a78bfa;font-weight:700');
})();
