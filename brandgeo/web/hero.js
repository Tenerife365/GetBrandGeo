/* ─────────────────────────────────────────────────────────────────────────────
   hero.js — hero mesh field + report-card hover tilt.

   WHY THIS IS AN EXTERNAL FILE AND MUST STAY ONE:
   brandgeo/web/.htaccess sends
     script-src 'self' https://plausible.io https://www.googletagmanager.com
   with NO 'unsafe-inline'. Any <script> written inline in index.html is
   silently refused by the browser. It does not throw, it does not reach
   window.onerror, and devtools shows nothing, so the page renders its full
   structure and simply never moves. Do not inline hero behaviour, and do not
   "fix" a future case by adding 'unsafe-inline' to the CSP.

   WHAT CHANGED 2026-07-28 (second pass):
   This replaced a 6-node "knowledge graph" that drew a handful of labelled
   nodes and a few connecting lines. On a 1440px screen that read as three
   faint lines and some drifting dots against near-black, and its "Perplexity"
   node label collided with the h1. It looked unfinished because it was too
   sparse to be a background and too literal to be decoration.

   This is the mesh from brandgeo-next/components/hero/HeroMesh.tsx, ported to
   vanilla JS: a 48x27 perspective grid of 1,296 additively blended glow points
   with two crossing waves and a cursor lift. No labels, so nothing can collide
   with the copy.

   What makes 1,296 blended sprites affordable in 2D canvas:
     - The glow is PRE-RENDERED once into an offscreen canvas and blitted with
       drawImage. Per-point createRadialGradient is the slow path and the usual
       reason people reach for WebGL here.
     - Eight pre-tinted copies cover the violet-to-indigo ramp, so colour varies
       per point with no per-frame tinting.
     - globalCompositeOperation 'lighter' is the additive blend, and additive is
       order independent, so there is no depth sort.
   ────────────────────────────────────────────────────────────────────────── */
(function () {
  var canvas = document.getElementById('aiGraph');
  if (!canvas) return;
  var ctx = canvas.getContext && canvas.getContext('2d');
  if (!ctx) return; // silent fallback: the CSS orbs and gradients remain

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var host = canvas.parentNode; // .hero-bg

  // COLS is recomputed per resize, see the aspect note in resize(). ROWS is
  // fixed because the projection is already keyed to height.
  var COLS = 48, ROWS = 27, SPACING = 0.56, FOV = 11, TINTS = 8;
  var HALF_COLS = (COLS - 1) / 2, HALF_ROWS = (ROWS - 1) / 2;
  var EXTENT_X = COLS * SPACING * 0.5, EXTENT_Y = ROWS * SPACING * 0.5;
  var VIS_H = 2 * FOV * Math.tan((52 * Math.PI) / 180 / 2);

  var W = 0, H = 0, DPR = 1, sprites = null;

  function buildSprites(dpr) {
    var size = Math.ceil(26 * dpr), half = size / 2;
    var from = [124, 58, 237];  // #7c3aed
    var to   = [99, 102, 241];  // #6366f1
    var out = [];
    for (var i = 0; i < TINTS; i++) {
      var t = i / (TINTS - 1);
      var r = Math.round(from[0] + (to[0] - from[0]) * t);
      var g = Math.round(from[1] + (to[1] - from[1]) * t);
      var b = Math.round(from[2] + (to[2] - from[2]) * t);
      var c = document.createElement('canvas');
      c.width = c.height = size;
      var cx = c.getContext('2d');
      var grad = cx.createRadialGradient(half, half, 0, half, half, half);
      grad.addColorStop(0,    'rgba(' + r + ',' + g + ',' + b + ',1)');
      grad.addColorStop(0.28, 'rgba(' + r + ',' + g + ',' + b + ',0.42)');
      grad.addColorStop(0.6,  'rgba(' + r + ',' + g + ',' + b + ',0.08)');
      grad.addColorStop(1,    'rgba(' + r + ',' + g + ',' + b + ',0)');
      cx.fillStyle = grad;
      cx.fillRect(0, 0, size, size);
      out.push(c);
    }
    return out;
  }

  function smoothstep(e0, e1, x) {
    var t = Math.min(Math.max((x - e0) / (e1 - e0), 0), 1);
    return t * t * (3 - 2 * t);
  }

  // Light theme dims the field: additive blending on a near-white surface
  // blows out, so the same alpha that reads as depth on #090A0F reads as haze.
  function themeGain() {
    return document.documentElement.getAttribute('data-theme') === 'light' ? 0.35 : 1;
  }
  var GAIN = themeGain();

  function resize() {
    // host.offsetWidth can read 0 here: this script runs at the end of <body>
    // and .hero-bg is full-bleed (100vw plus a translate), so in a hidden or
    // still-laying-out tab the measurement is not ready. Fall back through the
    // canvas box to the viewport, and refuse a degenerate size outright rather
    // than blanking the canvas.
    var box = canvas.getBoundingClientRect();
    W = host.offsetWidth || Math.round(box.width) || window.innerWidth || 0;
    H = host.offsetHeight || Math.round(box.height) || 0;
    if (!W || !H) return false;
    DPR = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(W * DPR);
    canvas.height = Math.round(H * DPR);
    if (!sprites) sprites = buildSprites(DPR);

    // ASPECT FIX, 2026-07-28. The grid is defined in WORLD units and projected
    // with scale = H / VIS_H, so its rendered pixel width is a function of
    // viewport HEIGHT, not width. A fixed 48 columns therefore covered a 16:9
    // screen and stopped well short of the edges on anything wider, leaving
    // black bars either side. Reported on a large desktop.
    //
    // Extend the column count to whatever the current aspect actually needs,
    // with 18% margin so the radial fade lands off-screen rather than as a
    // visible dimming band at the edges. Capped so an ultrawide cannot walk the
    // per-frame cost up without limit: 160 x 27 is 4,320 points, still just
    // sprite blits.
    var visW = VIS_H * (W / H);
    COLS = Math.max(48, Math.min(160, Math.ceil((visW * 1.18) / SPACING) + 1));
    HALF_COLS = (COLS - 1) / 2;
    EXTENT_X = COLS * SPACING * 0.5;
    return true;
  }

  // Cursor: raw target, then an eased value, so the lift trails the pointer.
  var targetX = 0, targetY = 0, easedX = 0, easedY = 0, held = 0, heldEased = 0;
  window.addEventListener('pointermove', function (e) {
    var r = host.getBoundingClientRect();
    if (!r.width || !r.height) return;
    var ndcX = ((e.clientX - r.left) / r.width) * 2 - 1;
    var ndcY = -(((e.clientY - r.top) / r.height) * 2 - 1);
    var visW = VIS_H * (r.width / r.height);
    targetX = (ndcX * visW) / 2;
    targetY = (ndcY * VIS_H) / 2;
    held = 1;
  }, { passive: true });
  window.addEventListener('pointerleave', function () { held = 0; });

  var time = 0;

  function draw(dt) {
    if (!W || !H || !sprites) return;
    time += dt;

    var k = 1 - Math.pow(0.0015, dt);
    easedX += (targetX - easedX) * k;
    easedY += (targetY - easedY) * k;
    var kh = 1 - Math.pow(0.02, dt);
    heldEased += (held - heldEased) * kh;

    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'lighter';

    var scale = H / VIS_H;

    for (var gy = 0; gy < ROWS; gy++) {
      var wy = (gy - HALF_ROWS) * SPACING;
      for (var gx = 0; gx < COLS; gx++) {
        var wx = (gx - HALF_COLS) * SPACING;

        // Two crossing waves.
        var lift = Math.sin(wx * 0.55 + time * 0.42) * 0.3 +
                   Math.cos(wy * 0.7  - time * 0.31) * 0.22;

        // Cursor pushes the surface up locally.
        var dx = wx - easedX, dy = wy - easedY;
        var dist = Math.sqrt(dx * dx + dy * dy);
        var pull = dist < 3.4 ? Math.pow(1 - dist / 3.4, 2) * heldEased : 0;
        lift += pull * 1.15;

        // Radial fade so the grid dissolves instead of ending on a rectangle.
        var rr = Math.sqrt((wx / EXTENT_X) * (wx / EXTENT_X) + (wy / EXTENT_Y) * (wy / EXTENT_Y));
        if (rr >= 1) continue;
        var edge = 1 - smoothstep(0.35, 1, rr);
        if (edge <= 0.004) continue;

        var z = FOV - lift;
        var persp = FOV / z;
        var sxp = W / 2 + wx * scale * persp;
        var syp = H / 2 - wy * scale * persp;

        var alpha = edge * (0.34 + Math.min(Math.max(lift, 0), 1.4) * 0.42) * GAIN;
        if (alpha <= 0.004) continue;

        var ti = Math.round((lift * 0.55 + 0.5) * (TINTS - 1));
        if (ti < 0) ti = 0; else if (ti > TINTS - 1) ti = TINTS - 1;
        var s = (7 + pull * 9) * persp * 1.5;

        ctx.globalAlpha = Math.min(alpha, 1);
        ctx.drawImage(sprites[ti], sxp - s / 2, syp - s / 2, s, s);
      }
    }

    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }

  var raf = 0, last = 0, running = false, onScreen = true, tabVisible = !document.hidden;

  function frame(now) {
    raf = requestAnimationFrame(frame);
    var dt = last ? Math.min((now - last) / 1000, 0.05) : 0.016;
    last = now;
    if (!onScreen || !tabVisible) return;
    draw(dt);
  }
  function start() { if (running) return; running = true; last = 0; raf = requestAnimationFrame(frame); }
  function stop()  { running = false; if (raf) cancelAnimationFrame(raf); }

  // init
  //
  // Written so the hero can never be left invisible. An earlier version added
  // .is-live only from inside a requestAnimationFrame and painted only from the
  // rAF loop. rAF does not run in a hidden or backgrounded tab, so in those
  // contexts the canvas sat at opacity 0 forever and the hero read as flat
  // empty space with no way to tell from the markup that anything was wrong.
  function reveal() { canvas.classList.add('is-live'); }

  if (resize()) draw(0);          // one synchronous frame, independent of rAF
  requestAnimationFrame(reveal);  // preferred: leaves the CSS fade intact
  setTimeout(reveal, 400);        // guaranteed: fires even if rAF is suspended

  window.addEventListener('load', function () {
    if (resize()) draw(0);
    reveal();
  });

  if (reduce) {
    // One calm static frame, no loop.
    if (resize()) draw(0);
  } else {
    if ('ResizeObserver' in window) {
      new ResizeObserver(function () { if (resize()) draw(0); }).observe(host);
    } else {
      window.addEventListener('resize', function () { if (resize()) draw(0); });
    }
    document.addEventListener('visibilitychange', function () {
      tabVisible = !document.hidden;
      tabVisible ? start() : stop();
    });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (ents) {
        ents.forEach(function (en) { onScreen = en.isIntersecting; en.isIntersecting ? start() : stop(); });
      }, { threshold: 0.04 }).observe(canvas);
    } else {
      start();
    }
    new MutationObserver(function () { GAIN = themeGain(); if (!running) draw(0); })
      .observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  }
})();


/* ── Report card hover tilt ──────────────────────────────────────────────
   Pointer devices only. Bails on touch (pointerType check), on coarse
   pointers, and on prefers-reduced-motion, so it never fights a finger or a
   user who asked for less movement.

   The rotation is written straight to the transform on pointermove and eased
   by the CSS transition, rather than being animated in JS. That keeps this off
   the main thread and means it costs nothing when the pointer is elsewhere. */
(function () {
  var card = document.getElementById('previewCard');
  if (!card) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

  var MAX = 7; // degrees
  var raf = 0;

  function onMove(e) {
    if (e.pointerType && e.pointerType !== 'mouse') return;
    if (raf) return;
    raf = requestAnimationFrame(function () {
      raf = 0;
      var r = card.getBoundingClientRect();
      if (!r.width || !r.height) return;
      var px = (e.clientX - r.left) / r.width - 0.5;
      var py = (e.clientY - r.top) / r.height - 0.5;
      card.style.transform =
        'rotateX(' + (-py * MAX).toFixed(2) + 'deg) rotateY(' + (px * MAX).toFixed(2) + 'deg)';
    });
  }

  function reset() {
    if (raf) { cancelAnimationFrame(raf); raf = 0; }
    card.style.transform = '';
  }

  card.addEventListener('pointermove', onMove);
  card.addEventListener('pointerleave', reset);
  // The audit flow swaps the card out for a skeleton and back. Flatten on any
  // of those transitions so a stale rotation is never left applied.
  card.addEventListener('pointercancel', reset);
  window.addEventListener('blur', reset);
})();
