/* ─────────────────────────────────────────────────────────────────────────────
   hero.js — AI knowledge graph canvas + report-card hover tilt.

   WHY THIS IS AN EXTERNAL FILE AND MUST STAY ONE:
   brandgeo/web/.htaccess sends
     script-src 'self' https://plausible.io https://www.googletagmanager.com
   with NO 'unsafe-inline'. Any <script> written inline in index.html is
   therefore silently refused by the browser. It does not throw, it does not
   reach window.onerror, and read_console_messages shows nothing, so the page
   still renders its full structure and simply never moves.

   That is exactly what happened: this code shipped inline on 2026-07-28 and was
   dead on arrival. The hero canvas stayed at the 300x150 HTML default while its
   CSS box was 1440x640, never received the .is-live class, and so sat at
   opacity 0 behind the entire hero. The page read as flat and static and the
   cause was invisible from the markup.

   plausible-init.js and ga4-init.js are external for this same reason. If you
   add hero behaviour, add it here or in another 'self' file. Do not inline it,
   and do not "fix" it by adding 'unsafe-inline' to the CSP, which would re-open
   the whole page to injected script in order to save one HTTP request.

   Contents:
     1. AI knowledge graph. Vanilla 2D canvas, no libraries, no build step.
        The 5 AI engines route citation pulses into the brand node.
        Cursor-reactive parallax and intensity. Honours prefers-reduced-motion
        with a single static frame, caps DPR, and pauses when the hero is
        off-screen or the tab is hidden.
     2. Report card hover tilt. Pointer devices only.
   ────────────────────────────────────────────────────────────────────────── */

(function () {
  var canvas = document.getElementById('aiGraph');
  if (!canvas) return;
  var ctx = canvas.getContext && canvas.getContext('2d');
  if (!ctx) return; // silent fallback: orbs + grid remain

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var host = canvas.parentNode; // .hero-bg
  var W = 0, H = 0, DPR = 1;

  // Brand node + the 5 engines clustered in the hero's left/top negative space
  // so the product card on the right stays clean (positions are normalised).
  var brand = { bx: 0.50, by: 0.42, phase: 0, sp: 0.0 };
  var engines = [
    { name: 'ChatGPT',    bx: 0.15, by: 0.20, phase: 0.4, sp: 0.55 },
    { name: 'Gemini',     bx: 0.31, by: 0.66, phase: 1.7, sp: 0.42 },
    { name: 'Claude',     bx: 0.60, by: 0.15, phase: 2.9, sp: 0.60 },
    { name: 'Perplexity', bx: 0.73, by: 0.52, phase: 4.1, sp: 0.48 },
    { name: 'Google AI',  bx: 0.09, by: 0.47, phase: 5.3, sp: 0.51 }
  ];
  var pulses = [];   // {ei, t, speed}
  var particles = []; // ambient depth cloud

  function palette() {
    var light = document.documentElement.getAttribute('data-theme') === 'light';
    return light ? {
      violet: '139,92,246', teal: '0,168,150',
      line: '90,70,190', label: '9,9,15',
      lineA: 0.16, nodeA: 0.9, labelA: 0.42, particleA: 0.5
    } : {
      violet: '139,92,246', teal: '0,212,170',
      line: '190,180,255', label: '255,255,255',
      lineA: 0.11, nodeA: 1, labelA: 0.34, particleA: 0.6
    };
  }
  var PAL = palette();

  function resize() {
    // host.offsetWidth can legitimately read 0 at this point. This script runs at
    // the end of <body> and .hero-bg is full-bleed (width:100vw plus a translate),
    // so in a hidden or still-laying-out tab the measurement is not ready yet.
    // Measured 2026-07-28 in a hidden tab: offsetHeight 640, offsetWidth 0, which
    // produced a 0-wide backing store that can never paint anything.
    // Fall back through the canvas box to the viewport, and refuse to apply a
    // degenerate size at all rather than blanking the canvas.
    var box = canvas.getBoundingClientRect();
    W = host.offsetWidth || Math.round(box.width) || window.innerWidth || 0;
    H = host.offsetHeight || Math.round(box.height) || 0;
    if (!W || !H) return false;
    DPR = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(W * DPR);
    canvas.height = Math.round(H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    return true;
  }

  // seed ambient particles
  for (var i = 0; i < 26; i++) {
    particles.push({ x: Math.random(), y: Math.random(),
      vx: (Math.random() - 0.5) * 0.00016, vy: (Math.random() - 0.5) * 0.00016,
      r: 0.7 + Math.random() * 1.4, a: 0.25 + Math.random() * 0.5,
      teal: Math.random() > 0.62 });
  }

  // pointer parallax + interaction intensity
  var pTargetX = 0, pTargetY = 0, pX = 0, pY = 0;
  var intensity = 0.35, intensityTarget = 0.35;
  window.addEventListener('pointermove', function (e) {
    pTargetX = (e.clientX / window.innerWidth) - 0.5;
    pTargetY = (e.clientY / window.innerHeight) - 0.5;
    intensityTarget = 1;
  }, { passive: true });

  function fadeR(xn) { // fade elements out toward the right (behind product card)
    if (xn <= 0.55) return 1;
    if (xn >= 0.92) return 0;
    var t = (xn - 0.55) / 0.37; return 1 - (t * t * (3 - 2 * t));
  }

  function nodePos(n, t, depth) {
    var dx = Math.sin(t * n.sp + n.phase) * 0.009;
    var dy = Math.cos(t * n.sp * 0.9 + n.phase) * 0.009;
    return {
      x: (n.bx + dx) * W + pX * depth,
      y: (n.by + dy) * H + pY * depth,
      xn: n.bx + dx
    };
  }

  function draw(t) {
    ctx.clearRect(0, 0, W, H);
    var bp = nodePos(brand, t, 5);

    // edges + travelling citation pulses
    for (var e = 0; e < engines.length; e++) {
      var np = nodePos(engines[e], t, 11);
      var f = fadeR((np.xn + brand.bx) / 2);
      // line
      ctx.strokeStyle = 'rgba(' + PAL.line + ',' + (PAL.lineA * f).toFixed(3) + ')';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(np.x, np.y); ctx.lineTo(bp.x, bp.y); ctx.stroke();
      // engine node
      drawNode(np.x, np.y, 3.4, PAL.violet, PAL.nodeA * f * 0.9);
      // label
      if (f > 0.14) {
        ctx.font = '600 11px Inter, system-ui, sans-serif';
        ctx.fillStyle = 'rgba(' + PAL.label + ',' + (PAL.labelA * f).toFixed(3) + ')';
        ctx.fillText(engines[e].name, np.x + 8, np.y - 7);
      }
    }

    // pulses
    for (var p = pulses.length - 1; p >= 0; p--) {
      var pu = pulses[p];
      pu.t += pu.speed * (0.5 + intensity * 0.9);
      if (pu.t >= 1) { pulses.splice(p, 1); brand.hit = 1; continue; }
      var s = nodePos(engines[pu.ei], t, 11);
      var f2 = fadeR((s.xn + brand.bx) / 2);
      var px = s.x + (bp.x - s.x) * pu.t;
      var py = s.y + (bp.y - s.y) * pu.t;
      var col = pu.teal ? PAL.teal : PAL.violet;
      drawNode(px, py, 2.2, col, (0.55 + intensity * 0.45) * f2);
    }

    // ambient particle cloud
    for (var c = 0; c < particles.length; c++) {
      var q = particles[c];
      q.x += q.vx; q.y += q.vy;
      if (q.x < 0) q.x = 1; if (q.x > 1) q.x = 0;
      if (q.y < 0) q.y = 1; if (q.y > 1) q.y = 0;
      var fx = fadeR(q.x);
      var qx = q.x * W + pX * 16, qy = q.y * H + pY * 16;
      ctx.fillStyle = 'rgba(' + (q.teal ? PAL.teal : PAL.violet) + ',' + (q.a * PAL.particleA * fx * 0.5).toFixed(3) + ')';
      ctx.beginPath(); ctx.arc(qx, qy, q.r, 0, 6.2832); ctx.fill();
    }

    // brand node — the convergence target, with a soft reactive halo
    var hit = brand.hit || 0;
    var halo = 16 + hit * 10 + intensity * 6;
    var g = ctx.createRadialGradient(bp.x, bp.y, 0, bp.x, bp.y, halo);
    g.addColorStop(0, 'rgba(' + PAL.violet + ',' + (0.5 + hit * 0.4).toFixed(2) + ')');
    g.addColorStop(0.55, 'rgba(' + PAL.teal + ',0.12)');
    g.addColorStop(1, 'rgba(' + PAL.violet + ',0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(bp.x, bp.y, halo, 0, 6.2832); ctx.fill();
    drawNode(bp.x, bp.y, 5.2, PAL.violet, 1);
    ctx.strokeStyle = 'rgba(' + PAL.teal + ',' + (0.6 + hit * 0.4).toFixed(2) + ')';
    ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.arc(bp.x, bp.y, 9 + hit * 3, 0, 6.2832); ctx.stroke();
    brand.hit *= 0.9;
  }

  function drawNode(x, y, r, rgb, a) {
    var g = ctx.createRadialGradient(x, y, 0, x, y, r * 3);
    g.addColorStop(0, 'rgba(' + rgb + ',' + Math.min(a, 1).toFixed(3) + ')');
    g.addColorStop(1, 'rgba(' + rgb + ',0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(x, y, r * 3, 0, 6.2832); ctx.fill();
    ctx.fillStyle = 'rgba(' + rgb + ',' + Math.min(a, 1).toFixed(3) + ')';
    ctx.beginPath(); ctx.arc(x, y, r, 0, 6.2832); ctx.fill();
  }

  var spawnAcc = 0, last = 0, running = false, rafId = 0;
  function frame(now) {
    if (!running) return;
    var dt = last ? Math.min((now - last) / 1000, 0.05) : 0.016; last = now;
    var t = now / 1000;
    // ease pointer + intensity
    pX += (pTargetX - pX) * 0.06; pY += (pTargetY - pY) * 0.06;
    intensityTarget = 0.35 + (intensityTarget - 0.35) * 0.95; // decay toward base
    intensity += (intensityTarget - intensity) * 0.08;
    // spawn pulses
    spawnAcc += dt * (1.1 + intensity * 1.6);
    while (spawnAcc >= 0.5) {
      spawnAcc -= 0.5;
      var ei = (Math.random() * engines.length) | 0;
      pulses.push({ ei: ei, t: 0, speed: 0.006 + Math.random() * 0.004, teal: Math.random() > 0.5 });
      if (pulses.length > 26) pulses.shift();
    }
    draw(t);
    rafId = requestAnimationFrame(frame);
  }
  function start() { if (running) return; running = true; last = 0; rafId = requestAnimationFrame(frame); }
  function stop() { running = false; if (rafId) cancelAnimationFrame(rafId); }

  // init
  //
  // Written so the hero can never be left invisible. The original added
  // .is-live only from inside a requestAnimationFrame and painted only from the
  // rAF loop. rAF does not run in a hidden or backgrounded tab, so in those
  // contexts the canvas sat at opacity 0 forever and the hero read as flat empty
  // space with no way to tell from the markup that anything was wrong.
  function reveal() { canvas.classList.add('is-live'); }

  if (resize()) draw(0);          // one synchronous frame, independent of rAF
  requestAnimationFrame(reveal);  // preferred: leaves the 1.2s CSS fade intact
  setTimeout(reveal, 400);        // guaranteed: fires even if rAF is suspended

  // Fonts and the full-bleed layout settle after this script runs, so measure
  // again once the page is fully loaded and repaint at the corrected size.
  window.addEventListener('load', function () {
    if (resize()) draw(0);
    reveal();
  });

  if (reduce) {
    // one calm static frame — nodes + edges, no motion
    for (var k = 0; k < 5; k++) pulses.push({ ei: k, t: 0.5, speed: 0, teal: k % 2 === 0 });
    draw(0);
  } else {
    // Always repaint on resize, not just under reduced motion: if rAF is
    // suspended the loop is not running and this is the only thing that redraws.
    if ('ResizeObserver' in window) new ResizeObserver(function () { if (resize()) draw(0); }).observe(host);
    else window.addEventListener('resize', resize);
    document.addEventListener('visibilitychange', function () { document.hidden ? stop() : start(); });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (ents) {
        ents.forEach(function (en) { en.isIntersecting ? start() : stop(); });
      }, { threshold: 0.04 }).observe(canvas);
    } else { start(); }
    // repaint palette on theme toggle
    new MutationObserver(function () { PAL = palette(); }).observe(
      document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
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
