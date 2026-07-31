/* ── BrandGEO live preview editor ─────────────────────────────────────────────
 *
 * Injected into every HTML response by devserver.py. NEVER written into
 * brandgeo/web/, so it cannot deploy.
 *
 * Three things it does:
 *   PICK    click an element, get a selector that provably re-selects it,
 *           plus what it currently measures
 *   NOTE    type an instruction against that element and send it
 *   THEME   edit the :root custom properties live and watch the page change,
 *           then send the values you settled on
 *
 * Everything is sent to POST /__notes, which appends to notes.json. Claude reads
 * that file directly. Nothing leaves this machine.
 *
 * WHY THE SELECTOR CODE IS AS LONG AS IT IS
 *   The first version walked at most four levels up, glued on whatever classes
 *   it found, and never checked the result. That produced selectors which
 *   silently pointed somewhere else on a fresh load. Two real examples out of
 *   nine notes:
 *     div.engines-strip.reveal.is-visible   `is-visible` is added by the scroll
 *                                           observer, so on a fresh load this
 *                                           matches nothing at all
 *     body > nav > div > a.nav-cta          unanchored and unverified, so it
 *                                           resolves to whichever one comes
 *                                           first, not necessarily the one clicked
 *   Every selector produced here is re-queried against the live document before
 *   it is handed over, and anything that does not resolve to exactly the picked
 *   element falls back to an absolute nth-child path, which cannot be ambiguous.
 * ──────────────────────────────────────────────────────────────────────────── */

(() => {
  if (window.__bgEditor) return;

  const AC = '#a78bfa', OK = '#34d399', WARN = '#fbbf24', BAD = '#f87171';
  const $ = (t, p = {}) => Object.assign(document.createElement(t), p);
  let picking = false, target = null, hovered = null, shiftHeld = false;
  const themeEdits = {};

  /* Every class this panel owns is bgE- prefixed. Generic names like .row or
     .meta would collide with the page's own classes and corrupt the rarity
     counting that selector generation depends on. */

  /* ── styles, scoped hard so the page's own CSS cannot reach in ──────────── */
  const css = $('style');
  css.textContent = `
  #bgE{position:fixed;right:14px;bottom:14px;z-index:2147483647;width:340px;
    font:12px/1.45 Inter,system-ui,sans-serif;color:#e8e9ed;background:#101116;
    border:1px solid #32333c;border-radius:12px;box-shadow:0 18px 50px rgba(0,0,0,.6);
    max-height:82vh;display:flex;flex-direction:column;overflow:hidden}
  #bgE *{box-sizing:border-box;font-family:inherit}
  #bgE header{display:flex;align-items:center;gap:8px;padding:9px 11px;
    background:#16171e;border-bottom:1px solid #23242b;cursor:default;flex:0 0 auto}
  #bgE header b{font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#9ba1ac;font-weight:600}
  #bgE .bgE-dot{width:7px;height:7px;border-radius:50%;background:${AC}}
  #bgE .bgE-grow{flex:1}
  #bgE button{background:#1d1e26;color:#e8e9ed;border:1px solid #32333c;border-radius:7px;
    padding:5px 9px;cursor:pointer;font-size:11px}
  #bgE button:hover{border-color:#4a4b57}
  #bgE button.bgE-on{background:${AC};color:#0b1020;border-color:${AC};font-weight:600}
  #bgE button.bgE-go{background:#7c3aed;border-color:#7c3aed;color:#fff;font-weight:600}
  #bgE button.bgE-danger{background:none;border-color:#3a2430;color:#a8737f;font-size:10.5px}
  #bgE button.bgE-danger:hover{border-color:${BAD};color:${BAD}}
  #bgE .bgE-body{padding:11px;overflow:auto;flex:1 1 auto}
  #bgE .bgE-tabs{display:flex;gap:6px;padding:9px 11px 0}
  #bgE .bgE-tabs button{flex:1}
  #bgE textarea{width:100%;min-height:74px;background:#0b0c11;color:#e8e9ed;
    border:1px solid #32333c;border-radius:7px;padding:8px;resize:vertical;font-size:12px}
  #bgE .bgE-sel{font-family:ui-monospace,Consolas,monospace;font-size:10.5px;color:${AC};
    background:#0b0c11;border:1px solid #23242b;border-radius:6px;padding:6px 7px;
    word-break:break-all;margin-bottom:8px}
  #bgE .bgE-meta{color:#7d838f;font-size:10.5px;margin-bottom:9px;line-height:1.5}
  #bgE .bgE-row{display:flex;align-items:center;gap:7px;margin-bottom:5px}
  #bgE .bgE-row label{flex:1;font-family:ui-monospace,Consolas,monospace;font-size:10.5px;color:#9ba1ac}
  #bgE .bgE-row input[type=color]{width:30px;height:22px;padding:0;border:1px solid #32333c;
    border-radius:5px;background:none;cursor:pointer}
  #bgE .bgE-row .bgE-hex{width:74px;background:#0b0c11;color:#9ba1ac;border:1px solid #23242b;
    border-radius:5px;padding:3px 5px;font-family:ui-monospace,monospace;font-size:10px}
  #bgE footer{padding:9px 11px;border-top:1px solid #23242b;display:flex;gap:7px;
    align-items:center;background:#16171e;flex:0 0 auto}
  #bgE .bgE-count{color:#7d838f;font-size:10.5px}
  #bgE .bgE-msg{font-size:10.5px;margin-top:7px;min-height:14px}
  #bgE .bgE-rule{margin:12px 0 8px;border-top:1px solid #23242b}
  #bgE.bgE-min .bgE-body,#bgE.bgE-min .bgE-tabs,#bgE footer.bgE-hide{display:none}
  .bgE-hl{outline:2px solid ${AC} !important;outline-offset:2px !important}
  .bgE-hl-parent{outline:2px dashed ${WARN} !important;outline-offset:3px !important}
  .bgE-pick,.bgE-pick *{cursor:crosshair !important}`;
  document.head.appendChild(css);

  /* ── selector generation ────────────────────────────────────────────────── */

  /* Classes that describe a moment rather than an identity. `is-visible` is the
     one that actually broke a real note: it is added by the reveal observer, so
     a selector carrying it matches nothing until you scroll. */
  const VOLATILE = /^(is-|has-|js-|bgE)|^(active|current|open|opened|closed|visible|invisible|hidden|show|shown|hide|selected|checked|expanded|collapsed|sticky|stuck|scrolled|inview|in-view|reveal|revealed|animate|animated|fade|fadein|fade-in|loading|loaded|busy|error|disabled|focus|focused|focusvisible|hover|hovered|dragging|drag|pending|entering|entered|exiting|exited|enter|exit)$/i;

  /* Ids minted by a framework change on every mount, so they are worse than no
     id at all: they look stable and are not. */
  const GENERATED_ID = /^(radix-|headlessui-|reactaria|react-aria|mui-|rc-|ember|ext-gen|__|:r)/i;

  const isStableId = id =>
    !!id && /^[A-Za-z][\w-]*$/.test(id) && !GENERATED_ID.test(id) && !/\d{5,}/.test(id);

  const esc = s => (window.CSS && CSS.escape ? CSS.escape(s) : String(s));

  /* The whole point: ask the document, do not trust the string. */
  function matchInfo(sel, el) {
    if (!sel) return { n: 0, unique: false };
    let found;
    try { found = document.querySelectorAll(sel); } catch { return { n: 0, unique: false }; }
    return { n: found.length, unique: found.length === 1 && found[0] === el };
  }
  const resolves = (sel, el) => matchInfo(sel, el).unique;

  /* A class shared by two hundred elements is a utility, not an identity. This
     is what keeps Tailwind out of dashboard selectors without hardcoding a
     Tailwind word list, and it costs one live-collection length read per class. */
  function usefulClasses(node) {
    const raw = ((node.getAttribute && node.getAttribute('class')) || '').trim();
    if (!raw) return [];
    const seen = new Set();
    return raw.split(/\s+/)
      .filter(c => c && !seen.has(c) && (seen.add(c), true))
      .filter(c => /^[A-Za-z_-][\w-]*$/.test(c))   // rejects Tailwind's [] / : syntax outright
      .filter(c => !VOLATILE.test(c))
      .map(c => ({ c, n: document.getElementsByClassName(c).length }))
      .filter(x => x.n > 0 && x.n <= 25)
      .sort((a, b) => a.n - b.n)
      .slice(0, 3)
      .map(x => x.c);
  }

  const DATA_SKIP = /^data-(reactid|reactroot|react|v-|ng-|astro|svelte|emotion|styled|framer|motion|bge)/i;

  function dataSelector(el) {
    for (const a of el.attributes || []) {
      if (!/^data-/i.test(a.name) || DATA_SKIP.test(a.name)) continue;
      const v = (a.value || '').trim();
      if (!v || v.length > 60) continue;
      const attr = `[${a.name}="${v.replace(/["\\]/g, '\\$&')}"]`;
      if (resolves(attr, el)) return attr;
      const tagged = el.tagName.toLowerCase() + attr;
      if (resolves(tagged, el)) return tagged;
    }
    return null;
  }

  function segmentFor(node) {
    if (isStableId(node.id)) return '#' + esc(node.id);
    let seg = node.tagName.toLowerCase();
    const cls = usefulClasses(node);
    if (cls.length) seg += '.' + cls.map(esc).join('.');
    const parent = node.parentElement;
    if (!parent) return seg;
    let siblingMatches = null;
    try { siblingMatches = parent.querySelectorAll(':scope > ' + seg); } catch { /* ignore */ }
    if (!siblingMatches || siblingMatches.length > 1) {
      const sibs = [...parent.children].filter(x => x.tagName === node.tagName);
      if (sibs.length > 1) seg += `:nth-of-type(${sibs.indexOf(node) + 1})`;
    }
    return seg;
  }

  /* Last resort. Ugly, unreadable, and always correct. */
  function absolutePath(el) {
    const parts = [];
    let n = el;
    while (n && n.nodeType === 1 && n !== document.documentElement && n.parentElement) {
      const i = [...n.parentElement.children].indexOf(n) + 1;
      parts.unshift(n.tagName.toLowerCase() + `:nth-child(${i})`);
      n = n.parentElement;
    }
    return ['html'].concat(parts).join(' > ');
  }

  function selectorFor(el) {
    if (!el || el.nodeType !== 1) return null;
    if (el === document.documentElement) return 'html';
    if (el === document.body) return 'body';

    if (isStableId(el.id)) {
      const s = '#' + esc(el.id);
      if (resolves(s, el)) return s;
    }
    const d = dataSelector(el);
    if (d) return d;

    const parts = [];
    let node = el, depth = 0;
    while (node && node.nodeType === 1 && node !== document.documentElement && depth < 14) {
      parts.unshift(segmentFor(node));
      const chain = parts.join(' > ');
      if (resolves(chain, el)) return chain;
      const parent = node.parentElement;
      if (parent && isStableId(parent.id)) {
        const anchored = '#' + esc(parent.id) + ' > ' + chain;
        if (resolves(anchored, el)) return anchored;
      }
      node = parent;
      depth++;
    }
    const abs = absolutePath(el);
    return resolves(abs, el) ? abs : abs;
  }

  /* ── what the element currently is ──────────────────────────────────────── */

  function lineBoxes(el) {
    try {
      const r = document.createRange(); r.selectNodeContents(el);
      return [...new Set([...r.getClientRects()].filter(x => x.height > 2)
        .map(x => Math.round(x.top)))].length;
    } catch { return null; }
  }

  const TRANSPARENT = /^(transparent|rgba\(0,\s*0,\s*0,\s*0\))$/;

  /* Most elements report rgba(0,0,0,0) for background, which tells you nothing
     about what the thing actually looks like. Walk up until something paints. */
  function effectiveBg(el) {
    let n = el;
    while (n && n.nodeType === 1) {
      const bg = getComputedStyle(n).backgroundColor;
      if (bg && !TRANSPARENT.test(bg)) {
        return { colour: bg, paintedBy: n === el ? 'self' : shortLabel(n) };
      }
      n = n.parentElement;
    }
    return { colour: null, paintedBy: 'canvas default' };
  }

  function shortLabel(n) {
    const cls = usefulClasses(n);
    return n.tagName.toLowerCase()
      + (isStableId(n.id) ? '#' + n.id : '')
      + (cls.length ? '.' + cls.join('.') : '');
  }

  const ownText = el => {
    const t = [...el.childNodes].filter(n => n.nodeType === 3)
      .map(n => n.textContent).join(' ').replace(/\s+/g, ' ').trim();
    return t ? t.slice(0, 140) : null;
  };

  /* href, src, alt, aria-label, and the nearest interactive ancestor, because
     "this button" is usually typed while the click landed on a span inside it. */
  function actionOf(el) {
    const t = el.tagName.toLowerCase(), out = {};
    const attr = n => (el.getAttribute ? el.getAttribute(n) : null);
    const href = attr('href');
    if (href != null) {
      out.href = href;
      try { out.hrefResolved = new URL(href, location.href).href; } catch { /* ignore */ }
    }
    if (t === 'button' || (t === 'input' && /^(button|submit|reset|image)$/i.test(el.type || ''))) {
      out.buttonType = el.type || 'submit';
      if (attr('name')) out.name = attr('name');
    }
    if (t === 'input' || t === 'textarea' || t === 'select') {
      out.field = { type: el.type || t, name: attr('name'), placeholder: attr('placeholder') };
    }
    if (t === 'img') { out.src = attr('src'); out.alt = attr('alt'); }
    if (attr('aria-label')) out.ariaLabel = attr('aria-label');
    if (attr('title')) out.title = attr('title');
    if (attr('role')) out.role = attr('role');
    const near = el.closest ? el.closest('a[href],button,[role="button"]') : null;
    if (near && near !== el) {
      out.insideInteractive = {
        tag: near.tagName.toLowerCase(),
        selector: selectorFor(near),
        href: near.getAttribute('href') || null,
        text: (near.innerText || '').trim().slice(0, 60) || null
      };
    }
    return Object.keys(out).length ? out : null;
  }

  function ancestry(el) {
    const out = [];
    let n = el.parentElement;
    while (n && n.nodeType === 1 && n !== document.documentElement && out.length < 3) {
      out.push(shortLabel(n));
      n = n.parentElement;
    }
    return out.length ? out : null;
  }

  function describe(el, how) {
    if (!el || el.nodeType !== 1) return null;
    const cs = getComputedStyle(el), r = el.getBoundingClientRect();
    const selector = selectorFor(el);
    const check = matchInfo(selector, el);
    return {
      selector,
      /* Recorded so nobody has to take the selector on trust later. */
      selectorCheck: {
        reQueried: true,
        matches: check.n,
        resolvesToPickedElement: check.unique,
        strategy: selector && selector.startsWith('#') ? 'id'
          : selector && selector.startsWith('[') ? 'data-attribute'
          : selector && selector.indexOf(':nth-child(') !== -1 ? 'absolute-path'
          : 'structural-path'
      },
      pickedVia: how || 'click',
      tag: el.tagName.toLowerCase(),
      id: el.id || null,
      classes: ((el.getAttribute && el.getAttribute('class')) || '')
        .replace(/\bbgE\S*/g, '').replace(/\s+/g, ' ').trim() || null,
      text: (el.innerText || '').trim().slice(0, 140) || null,
      ownText: ownText(el),
      action: actionOf(el),
      box: {
        x: Math.round(r.left), y: Math.round(r.top),
        w: Math.round(r.width), h: Math.round(r.height),
        right: Math.round(r.right), bottom: Math.round(r.bottom),
        top: Math.round(r.top), left: Math.round(r.left),
        pageX: Math.round(r.left + scrollX), pageY: Math.round(r.top + scrollY)
      },
      viewport: {
        w: document.documentElement.clientWidth, h: innerHeight,
        dpr: devicePixelRatio, scrollY: Math.round(scrollY)
      },
      lineBoxes: lineBoxes(el),
      type: {
        family: cs.fontFamily.split(',')[0].replace(/["']/g, ''), size: cs.fontSize,
        weight: cs.fontWeight, lineHeight: cs.lineHeight, letterSpacing: cs.letterSpacing,
        transform: cs.textTransform, align: cs.textAlign
      },
      colour: {
        fg: cs.color, bg: cs.backgroundColor, bgEffective: effectiveBg(el),
        border: cs.borderColor, borderWidth: cs.borderWidth, opacity: cs.opacity
      },
      layout: {
        display: cs.display, position: cs.position, padding: cs.padding, margin: cs.margin,
        gap: cs.gap && cs.gap !== 'normal' ? cs.gap : null,
        alignItems: cs.alignItems, justifyContent: cs.justifyContent,
        width: cs.width, height: cs.height, zIndex: cs.zIndex
      },
      ancestors: ancestry(el),
      overflowsViewport: r.right > document.documentElement.clientWidth + 1
    };
  }

  /* ── read the :root custom properties out of the real stylesheet ────────── */
  function rootTokens() {
    const out = {};
    for (const sheet of document.styleSheets) {
      let rules; try { rules = sheet.cssRules; } catch { continue; }
      for (const rule of rules || []) {
        if (rule.selectorText !== ':root') continue;
        for (const prop of rule.style) {
          if (prop.startsWith('--')) out[prop] = rule.style.getPropertyValue(prop).trim();
        }
      }
    }
    return out;
  }

  /* ── panel ──────────────────────────────────────────────────────────────── */
  const el = $('div', { id: 'bgE' });
  el.innerHTML = `
    <header><span class="bgE-dot"></span><b>BrandGEO preview</b><span class="bgE-grow"></span>
      <button id="bgMin">-</button></header>
    <div class="bgE-tabs">
      <button id="tPick" class="bgE-on">Pick + note</button>
      <button id="tTheme">Theme</button>
    </div>
    <div class="bgE-body" id="bgBody"></div>
    <footer><span class="bgE-count" id="bgCount"></span><span class="bgE-grow"></span>
      <button id="bgClear">Clear draft</button>
      <button id="bgSend" class="bgE-go">Send to Claude</button></footer>`;
  document.body.appendChild(el);

  const body = el.querySelector('#bgBody');
  const msg = () => el.querySelector('#bgMsg');
  let tab = 'pick';

  function targetSummary(t) {
    if (!t) return `<div class="bgE-meta">Nothing selected. A note without a selection is treated as page-level.</div>`;
    const bad = !t.selectorCheck.resolvesToPickedElement;
    return `<div class="bgE-sel">${t.selector}</div>
      <div class="bgE-meta">
        ${t.tag}${t.classes ? ' .' + t.classes.split(' ').join(' .') : ''}
        ${t.pickedVia === 'shift-parent' ? `<span style="color:${WARN}">(parent, shift-click)</span>` : ''}
        <br>${t.box.w}x${t.box.h}px at (${t.box.x}, ${t.box.y}) &middot; viewport ${t.viewport.w}px
        <br>${t.type.family} ${t.type.size} / ${t.type.weight} &middot; ${t.colour.fg}
        ${t.action && t.action.href ? `<br>href ${t.action.href}` : ''}
        ${t.lineBoxes ? `<br>${t.lineBoxes} line box(es)` : ''}
        ${t.overflowsViewport ? `<br><span style="color:${WARN}">past the viewport edge</span>` : ''}
        <br><span style="color:${bad ? BAD : OK}">selector re-queried: ${t.selectorCheck.matches} match(es)${bad ? ', DOES NOT resolve back' : ', resolves back to this element'}</span>
      </div>`;
  }

  function renderPick() {
    body.innerHTML = `
      <button id="bgPick" class="${picking ? 'bgE-on' : ''}" style="width:100%;margin-bottom:9px">
        ${picking ? 'Picking, click an element (Esc to stop)' : 'Select an element'}</button>
      ${targetSummary(target)}
      <textarea id="bgNote" placeholder="What should change here, and why. Plain language is fine."></textarea>
      <button id="bgAdd" style="width:100%;margin-top:8px">Add note</button>
      <div class="bgE-msg" id="bgMsg"></div>
      <div class="bgE-rule"></div>
      <button id="bgResetAll" class="bgE-danger" style="width:100%">Reset saved notes.json</button>
      <div class="bgE-meta" style="margin:6px 0 0">notes.json is shared by every preview
        server on this machine, whatever port. Reset asks first and the server backs
        the file up before clearing.</div>`;
    body.querySelector('#bgPick').onclick = () => { picking ? stopPick() : startPick(); };
    body.querySelector('#bgAdd').onclick = addNote;
    body.querySelector('#bgResetAll').onclick = resetAll;
  }

  function renderTheme() {
    const tokens = rootTokens();
    const colours = Object.entries(tokens).filter(([, v]) => /^#[0-9a-f]{3,8}$/i.test(v));
    body.innerHTML = `
      <div class="bgE-meta">Live edits to the <code>:root</code> tokens. Applies instantly,
        changes nothing on disk. Send when you are happy and Claude writes them in
        properly, light-mode counterpart included.</div>
      <div id="bgTok"></div>
      <button id="bgReset" style="width:100%;margin-top:9px">Reset to stylesheet</button>
      <div class="bgE-msg" id="bgMsg"></div>`;
    const wrap = body.querySelector('#bgTok');
    for (const [name, value] of colours) {
      const row = $('div', { className: 'bgE-row' });
      row.innerHTML = `<label title="${name}">${name}</label>
        <input type="color" value="${value.slice(0, 7)}">
        <input class="bgE-hex" value="${value}">`;
      const [pick, hex] = row.querySelectorAll('input');
      const apply = v => {
        document.documentElement.style.setProperty(name, v);
        themeEdits[name] = { from: value, to: v };
        hex.value = v; pick.value = v.slice(0, 7);
      };
      pick.oninput = e => apply(e.target.value);
      hex.onchange = e => apply(e.target.value.trim());
      wrap.appendChild(row);
    }
    body.querySelector('#bgReset').onclick = () => {
      for (const n of Object.keys(themeEdits)) document.documentElement.style.removeProperty(n);
      for (const n of Object.keys(themeEdits)) delete themeEdits[n];
      renderTheme();
    };
  }

  const render = () => (tab === 'pick' ? renderPick() : renderTheme());

  /* ── picking ────────────────────────────────────────────────────────────── */
  const clearHl = () => {
    if (!hovered) return;
    hovered.classList.remove('bgE-hl');
    if (hovered.parentElement) hovered.parentElement.classList.remove('bgE-hl-parent');
    hovered = null;
  };

  /* Shift-click takes the parent. The highlight has to say so while the key is
     down, otherwise you are picking blind. */
  function paintHl() {
    if (!hovered) return;
    hovered.classList.toggle('bgE-hl', !shiftHeld);
    if (hovered.parentElement) {
      hovered.parentElement.classList.toggle('bgE-hl-parent', shiftHeld);
      if (shiftHeld) hovered.classList.remove('bgE-hl');
    }
  }

  const onMove = e => {
    if (el.contains(e.target)) return;
    if (hovered !== e.target) {
      clearHl();
      hovered = e.target;
    }
    shiftHeld = e.shiftKey;
    paintHl();
  };
  const onClick = e => {
    if (el.contains(e.target)) return;
    e.preventDefault(); e.stopPropagation();
    const useParent = e.shiftKey && e.target.parentElement;
    const picked = useParent ? e.target.parentElement : e.target;
    /* Shift-click also extends the text selection, which leaves half the page
       highlighted blue after every parent pick. */
    try { getSelection().removeAllRanges(); } catch { /* ignore */ }
    /* Drop the highlight classes before measuring, so the outline neither shows
       up in `classes` nor perturbs the box. */
    clearHl();
    target = describe(picked, useParent ? 'shift-parent' : 'click');
    stopPick();
  };
  const onKey = e => {
    if (e.key === 'Escape' && picking) return stopPick();
    if (e.key === 'Shift' && picking) { shiftHeld = true; paintHl(); }
  };
  const onKeyUp = e => {
    if (e.key === 'Shift' && picking) { shiftHeld = false; paintHl(); }
  };

  function startPick() {
    picking = true;
    document.documentElement.classList.add('bgE-pick');
    addEventListener('mousemove', onMove, true);
    addEventListener('click', onClick, true);
    addEventListener('keydown', onKey, true);
    addEventListener('keyup', onKeyUp, true);
    render();
  }
  function stopPick() {
    picking = false;
    shiftHeld = false;
    document.documentElement.classList.remove('bgE-pick');
    removeEventListener('mousemove', onMove, true);
    removeEventListener('click', onClick, true);
    removeEventListener('keydown', onKey, true);
    removeEventListener('keyup', onKeyUp, true);
    clearHl();
    render();
  }

  /* ── notes ──────────────────────────────────────────────────────────────── */
  const pending = [];

  function addNote() {
    const ta = body.querySelector('#bgNote');
    const text = (ta.value || '').trim();
    if (!text) { flash('Type an instruction first.', WARN); return; }
    pending.push({
      kind: 'element',
      note: text,
      element: target,
      page: location.pathname,
      url: location.href,
      pageTitle: document.title || null,
      viewport: { w: document.documentElement.clientWidth, h: innerHeight }
    });
    ta.value = '';
    flash(target ? 'Note added against the selected element.' : 'Page-level note added.', OK);
    updateCount();
  }

  function flash(t, colour) {
    const m = msg(); if (!m) return;
    m.textContent = t; m.style.color = colour;
    setTimeout(() => { if (m.textContent === t) m.textContent = ''; }, 5000);
  }

  function updateCount() {
    const themeCount = Object.keys(themeEdits).length;
    el.querySelector('#bgCount').textContent =
      `${pending.length} note(s)${themeCount ? `, ${themeCount} token(s)` : ''}`;
  }

  async function send() {
    const payload = [...pending];
    if (Object.keys(themeEdits).length) {
      payload.push({ kind: 'theme', page: location.pathname,
                     tokens: themeEdits, viewport: document.documentElement.clientWidth });
    }
    if (!payload.length) { flash('Nothing to send yet.', WARN); return; }
    try {
      const res = await fetch('/__notes', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const out = await res.json();
      pending.length = 0;
      updateCount();
      flash(`Sent. ${out.count} note(s) waiting for Claude.`, OK);
    } catch (err) {
      flash('Send failed: ' + err.message + '. Is devserver.py running?', BAD);
    }
  }

  /* Destructive, and it has already eaten a set of notes once, so it asks with
     the real count in the question and the server refuses without the token. */
  async function resetAll() {
    let saved = [];
    try { saved = await (await fetch('/__notes')).json(); } catch { /* ignore */ }
    const n = Array.isArray(saved) ? saved.length : 0;
    if (!n) { flash('notes.json is already empty.', WARN); return; }
    const ok = confirm(
      `Delete all ${n} saved note(s) from notes.json?\n\n` +
      `This file is shared by every preview server on this machine, on any port, ` +
      `so notes sent from another port go too.\n\n` +
      `The server writes a timestamped backup before clearing.`);
    if (!ok) { flash('Reset cancelled. Nothing was touched.', OK); return; }
    try {
      const res = await fetch('/__reset', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirm: 'delete-all-notes' })
      });
      const out = await res.json().catch(() => ({}));
      if (!res.ok || !out.ok) throw new Error(out.error || 'HTTP ' + res.status);
      flash(`Cleared ${out.archived} note(s). Backup: ${out.backup}`, OK);
    } catch (err) {
      flash('Reset failed: ' + err.message, BAD);
    }
  }

  el.querySelector('#bgSend').onclick = send;
  /* Local only now. It used to POST /__reset, which wiped the shared file. */
  el.querySelector('#bgClear').onclick = () => {
    if (!pending.length) { flash('No unsent notes to clear.', WARN); return; }
    const n = pending.length;
    pending.length = 0;
    updateCount();
    flash(`${n} unsent note(s) discarded. notes.json untouched.`, OK);
  };
  el.querySelector('#bgMin').onclick = () => {
    el.classList.toggle('bgE-min');
    el.querySelector('footer').classList.toggle('bgE-hide');
    el.querySelector('#bgMin').textContent = el.classList.contains('bgE-min') ? '+' : '-';
  };
  el.querySelector('#tPick').onclick = () => {
    tab = 'pick';
    el.querySelector('#tPick').classList.add('bgE-on');
    el.querySelector('#tTheme').classList.remove('bgE-on');
    render();
  };
  el.querySelector('#tTheme').onclick = () => {
    tab = 'theme';
    el.querySelector('#tTheme').classList.add('bgE-on');
    el.querySelector('#tPick').classList.remove('bgE-on');
    render();
  };

  window.__bgEditor = {
    describe, selectorFor, rootTokens, pending, themeEdits,
    startPick, stopPick, addNote, send,
    setTarget: node => { target = describe(node, 'api'); render(); return target; }
  };
  render();
  updateCount();
  console.log('%cBrandGEO preview editor ready', `color:${AC};font-weight:700`);
})();
