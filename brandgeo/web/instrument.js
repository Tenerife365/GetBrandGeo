/* instrument.js - the Live Instrument presentation layer for index-new.html.
 *
 * Scope, deliberately narrow (spec: landing-instrument-spec-2026-08-07.md):
 *   1. Hero replay sequence (spec 3.4): plays ONCE when the card is 30%
 *      visible, never loops, manual replay button re-runs it, a live audit
 *      interrupts it instantly. The markup IS the completed state, so with
 *      this file absent, blocked, or reduced-motion active, the card is
 *      simply complete (spec 3.5).
 *   2. Below-the-fold bar fills and numeral count-ups (motions 2-4), applied
 *      to final-state markup: bars are zeroed only once JS is running, so
 *      content visibility never depends on an animation firing.
 *   3. Chain connector beams: animate only while #chain is in the viewport
 *      (motion 7).
 *   4. Theme toggle icon: re-renders the two inline SVG icons after site.js
 *      writes its emoji (site.js is not functionally altered; spec 2.1).
 *   5. Consent / Jamie coordination (spec 7.4): the Jamie launcher stays
 *      unmounted-looking (hidden) until consent is resolved or the visitor
 *      scrolls past 200px, and never overlaps the consent bar. The
 *      askmywebsiteai widget was probed at build (2026-08-07): its config
 *      answers {"available":false,"reason":"not_published"}, so it renders
 *      nothing and needs no handling; the hide-then-reveal below covers
 *      Jamie, which site.js injects.
 *
 * Same-origin, no inline scripts (CSP), vanilla JS, ES5-friendly.
 */
(function () {
  'use strict';

  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── 4. Theme toggle icons ─────────────────────────────────────────── */
  var SUN_SVG = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>';
  var MOON_SVG = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
  var themeBtn = document.getElementById('themeBtn');
  function paintThemeIcon() {
    if (!themeBtn) return;
    var t = document.documentElement.getAttribute('data-theme');
    themeBtn.innerHTML = t === 'dark' ? MOON_SVG : SUN_SVG;
  }
  if (themeBtn) {
    // site.js's click handler registered first and repaints the emoji; this
    // listener runs after it in registration order and repaints the SVG.
    paintThemeIcon();
    themeBtn.addEventListener('click', paintThemeIcon);
  }

  /* ── Shared helpers ────────────────────────────────────────────────── */
  // Count-up ids land in the caller's bucket so one feature's cancel can
  // never abort another feature's numerals mid-count. Decimal places come
  // from the element's data-dec attribute (the client measurement rates
  // carry one decimal, e.g. 78.6).
  function countUp(el, target, duration, bucket) {
    if (!el) return;
    var dec = parseInt(el.getAttribute('data-dec') || '0', 10) || 0;
    var start = null;
    var id;
    function step(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / duration, 1);
      el.textContent = (p * target).toFixed(dec);
      if (p < 1) { id = requestAnimationFrame(step); if (bucket) bucket.push(id); }
    }
    id = requestAnimationFrame(step);
    if (bucket) bucket.push(id);
  }
  function finalNum(el) { return parseFloat(el.getAttribute('data-final')) || 0; }
  function zeroText(el) {
    var dec = parseInt(el.getAttribute('data-dec') || '0', 10) || 0;
    return (0).toFixed(dec);
  }
  function toArray(list) { return Array.prototype.slice.call(list); }

  /* ── 1. Hero replay (spec 3.4) ─────────────────────────────────────── */
  (function initReplay() {
    var card = document.getElementById('previewCard');
    if (!card) return;
    var stamp = document.getElementById('repStamp');
    var led = document.getElementById('repLed');
    var runTarget = document.getElementById('runTarget');
    var runScope = document.getElementById('runScope');
    var ring = document.getElementById('repRing');
    var score = document.getElementById('repScore');
    var rateN = document.getElementById('repRateN');
    var band = document.getElementById('repBand');
    var runYours = document.getElementById('runYours');
    var replayBtn = document.getElementById('replayBtn');
    var brandInput = document.getElementById('brandInput');
    var auditBtn = document.getElementById('auditBtn');
    var bars = toArray(card.querySelectorAll('.ibar span[data-final]'));
    var pcts = toArray(card.querySelectorAll('.epn[data-final]'));
    // The replay narrates a recorded client measurement (founder revision
    // 2026-08-07). The typewriter must never suggest the demo input produced
    // this card, so it types the measurement's name, not a domain.
    var DOMAIN = 'client measurement';
    var STAMP_REST = '2026-07-21 to 2026-08-07';
    var STAMP_RUN = 'running replay';
    var RING_FINAL = parseFloat(ring ? ring.getAttribute('data-final-offset') : '0') || 0;
    var RING_ZERO = 213.63;
    var timers = [];
    var rafIds = [];
    var playing = false;
    var autoPlayed = false;

    // The run-yours link is the card's next step: focus the instrument's
    // control (scrolling it into view first on stacked layouts, spec 3.3.6).
    if (runYours && brandInput) {
      runYours.addEventListener('click', function (e) {
        e.preventDefault();
        if (window.innerWidth < 900 && brandInput.scrollIntoView) {
          brandInput.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' });
          setTimeout(function () {
            try { brandInput.focus({ preventScroll: true }); } catch (err) { brandInput.focus(); }
          }, reduced ? 0 : 350);
        } else {
          try { brandInput.focus({ preventScroll: true }); } catch (err) { brandInput.focus(); }
        }
      });
    }

    if (reduced) return; // static completed card; replay button stays hidden

    function later(fn, ms) { timers.push(setTimeout(fn, ms)); }
    function clearAll() {
      for (var i = 0; i < timers.length; i++) clearTimeout(timers[i]);
      timers = [];
      for (var j = 0; j < rafIds.length; j++) cancelAnimationFrame(rafIds[j]);
      rafIds = [];
    }

    function setCompleted() {
      clearAll();
      playing = false;
      card.classList.remove('is-typing');
      if (runTarget) runTarget.textContent = DOMAIN;
      if (runScope) runScope.style.visibility = '';
      bars.forEach(function (b) {
        b.style.transition = 'none';
        b.style.width = b.getAttribute('data-final') + '%';
      });
      pcts.forEach(function (n) {
        n.textContent = n.getAttribute('data-final');
        n.style.opacity = '';
        n.style.transition = '';
      });
      if (ring) {
        ring.style.transition = 'none';
        ring.style.strokeDashoffset = RING_FINAL;
      }
      if (score) { score.textContent = score.getAttribute('data-final'); score.style.opacity = ''; score.style.transition = ''; }
      if (rateN) { rateN.textContent = rateN.getAttribute('data-final'); }
      if (band) { band.style.opacity = ''; band.style.transition = ''; }
      if (stamp) stamp.textContent = STAMP_REST;
      if (led) led.classList.remove('run');
      // release the inline transition overrides on the next frame
      requestAnimationFrame(function () {
        bars.forEach(function (b) { b.style.transition = ''; });
        if (ring) ring.style.transition = '';
      });
    }

    function halt() {
      if (!playing) return;
      setCompleted();
    }

    function play() {
      if (playing || card.hidden) return;
      playing = true;
      clearAll();

      // Beat 0.00s: the complete card visibly re-arms. Fills and numerals
      // fade to zero over 150ms; LED goes violet pulse; stamp swaps.
      if (led) led.classList.add('run');
      if (stamp) stamp.textContent = STAMP_RUN;
      if (band) { band.style.transition = 'opacity .15s linear'; band.style.opacity = '0'; }
      if (score) { score.style.transition = 'opacity .15s linear'; score.style.opacity = '0'; }
      pcts.forEach(function (n) { n.style.transition = 'opacity .15s linear'; n.style.opacity = '0'; });
      bars.forEach(function (b) { b.style.transition = 'width .15s linear'; });
      if (ring) ring.style.transition = 'stroke-dashoffset .15s linear';
      requestAnimationFrame(function () {
        bars.forEach(function (b) { b.style.width = '0%'; });
        if (ring) ring.style.strokeDashoffset = RING_ZERO;
      });
      if (runTarget) runTarget.textContent = '';
      if (runScope) runScope.style.visibility = 'hidden';

      later(function () {
        // restore the working transitions and zeroed numerals
        bars.forEach(function (b) { b.style.transition = ''; });
        if (ring) ring.style.transition = '';
        pcts.forEach(function (n) { n.textContent = zeroText(n); n.style.opacity = ''; });
        if (score) { score.textContent = zeroText(score); score.style.opacity = ''; }
        if (rateN) rateN.textContent = zeroText(rateN);
      }, 180);

      // Beat 0.30 to 1.00s: the run line typewrites the domain (~45ms/char,
      // blinking block caret), then the scope appears at once.
      later(function () { card.classList.add('is-typing'); }, 300);
      for (var c = 0; c < DOMAIN.length; c++) {
        (function (idx) {
          later(function () {
            if (runTarget) runTarget.textContent = DOMAIN.slice(0, idx + 1);
          }, 300 + Math.round((idx + 1) * 675 / DOMAIN.length));
        })(c);
      }
      later(function () {
        card.classList.remove('is-typing');
        if (runScope) runScope.style.visibility = '';
      }, 1000);

      // Beat 1.00 to 2.40s: engine rows fill top to bottom, 120ms stagger,
      // each bar 0.8s ease-soft, each % counting in sync.
      bars.forEach(function (b, i) {
        later(function () {
          b.style.width = b.getAttribute('data-final') + '%';
          if (pcts[i]) countUp(pcts[i], finalNum(pcts[i]), 800, rafIds);
        }, 1000 + i * 120);
      });

      // Beat 2.40 to 3.60s: ring sweeps (1.4s transition), numeral counts,
      // band pill fades in at 3.4s.
      later(function () {
        if (ring) ring.style.strokeDashoffset = RING_FINAL;
        if (score) countUp(score, finalNum(score), 900, rafIds);
        if (rateN) countUp(rateN, finalNum(rateN), 900, rafIds);
      }, 2400);
      later(function () {
        if (band) { band.style.transition = 'opacity .3s ease'; band.style.opacity = '1'; }
      }, 3400);

      // Beat 3.60 to 4.20s: stamp swaps back; LED settles to green steady.
      later(function () {
        if (stamp) stamp.textContent = STAMP_REST;
        if (led) led.classList.remove('run');
        if (band) { band.style.transition = ''; band.style.opacity = ''; }
        if (score) score.style.transition = '';
        pcts.forEach(function (n) { n.style.transition = ''; });
      }, 3600);

      // Beat 4.40s: the next-step link pulses once. Nothing moves again.
      later(function () {
        if (runYours) {
          runYours.classList.add('pulse');
          later(function () { runYours.classList.remove('pulse'); }, 700);
        }
        playing = false;
      }, 4400);
    }

    // Manual replay control: the only way the sequence runs twice (spec 3.4).
    if (replayBtn) {
      replayBtn.hidden = false;
      replayBtn.addEventListener('click', function () {
        setCompleted();
        play();
      });
    }

    // Interruption rule: a live audit wins instantly (spec 3.4). site.js
    // swaps the card for the skeleton on the same click; halting here means
    // the card is complete again whenever site.js brings it back.
    function interrupt() { halt(); }
    if (auditBtn) auditBtn.addEventListener('click', interrupt, true);
    if (brandInput) brandInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') interrupt();
    }, true);

    // Auto-play once per page load at 30% visibility (spec 3.4).
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting && !autoPlayed) {
            autoPlayed = true;
            io.disconnect();
            play();
          }
        });
      }, { threshold: 0.3 });
      io.observe(card);
    }
  })();

  /* ── 2. Below-the-fold fills and count-ups (motions 2-4) ───────────── */
  (function initGroupFills() {
    var groups = [document.getElementById('dimsGrid'), document.getElementById('sentBars')];
    groups.forEach(function (group) {
      if (!group) return;
      var bars = toArray(group.querySelectorAll('.ibar span[data-final], .sent-fill[data-final]'));
      var nums = toArray(group.querySelectorAll('.epn[data-final]'));
      if (reduced || !('IntersectionObserver' in window)) return; // final-state markup stands
      // Zero out only now that JS is provably running.
      bars.forEach(function (b) {
        b.style.transition = 'none';
        b.style.width = '0%';
      });
      nums.forEach(function (n) { n.textContent = zeroText(n); });
      // force a reflow so the zero state is committed before transitions return
      void group.offsetWidth;
      bars.forEach(function (b) { b.style.transition = ''; });
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          io.disconnect();
          bars.forEach(function (b, i) {
            setTimeout(function () { b.style.width = b.getAttribute('data-final') + '%'; }, i * 120);
          });
          nums.forEach(function (n, i) {
            setTimeout(function () { countUp(n, finalNum(n), 900, null); }, i * 120);
          });
        });
      }, { threshold: 0.3 });
      io.observe(group);
    });
  })();

  /* ── 3. Chain beams: animate only while #chain is in view (motion 7) ── */
  (function initChainBeams() {
    var chain = document.getElementById('chain');
    if (!chain || !('IntersectionObserver' in window)) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        chain.classList.toggle('beams-on', entry.isIntersecting);
      });
    }, { threshold: 0.15 });
    io.observe(chain);
  })();

  /* ── 5. Consent / Jamie coordination (spec 7.4) ────────────────────── */
  (function initLauncherDefer() {
    // Injected only when this script runs, so a blocked script never leaves
    // the launcher hidden forever. visibility (not display): Jamie's own
    // layout math stays intact.
    var st = document.createElement('style');
    st.id = 'bg-defer-css';
    st.textContent =
      '#bg-asst-launcher{visibility:hidden;}' +
      'html.bg-asst-go #bg-asst-launcher{visibility:visible;}';
    document.head.appendChild(st);

    var revealed = false;
    function reveal() {
      if (revealed) return;
      revealed = true;
      document.documentElement.classList.add('bg-asst-go');
      window.removeEventListener('scroll', onScroll);
    }
    function consentBar() { return document.querySelector('.bg-cc'); }
    function positionLauncher() {
      var l = document.getElementById('bg-asst-launcher');
      if (!l) return;
      var bar = consentBar();
      if (bar) {
        // bar sits 12px off the bottom; launcher clears it by another 12px.
        l.style.bottom = (bar.offsetHeight + 24) + 'px';
      } else {
        l.style.bottom = '';
      }
    }
    function onScroll() {
      if ((window.scrollY || window.pageYOffset || 0) > 200) reveal();
    }
    function boot() {
      // ga4-init.js registered its DOMContentLoaded listener first (it loads
      // in the head), so by the time this runs the banner exists if it is
      // going to. No banner = consent already resolved on a previous visit.
      if (!consentBar()) reveal();
      positionLauncher();
      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('resize', positionLauncher);
      if ('MutationObserver' in window) {
        var mo = new MutationObserver(function () {
          if (!consentBar()) {
            reveal();
            positionLauncher();
            mo.disconnect();
          } else {
            positionLauncher();
          }
        });
        mo.observe(document.body, { childList: true, subtree: false });
      } else {
        reveal(); // no observer support: never risk trapping the launcher
      }
    }
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function () { setTimeout(boot, 0); });
    } else {
      setTimeout(boot, 0);
    }
  })();
})();
