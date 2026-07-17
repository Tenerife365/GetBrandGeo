(function() {
  // Theme toggle (all pages)
  var themeBtn = document.getElementById('themeBtn');
  if (themeBtn) {
    var saved = localStorage.getItem('bgTheme') || 'dark';
    document.documentElement.setAttribute('data-theme', saved);
    themeBtn.innerHTML = saved === 'dark' ? '&#x1F319;' : '&#x2600;&#xFE0F;';
    themeBtn.addEventListener('click', function() {
      var current = document.documentElement.getAttribute('data-theme');
      var next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      themeBtn.innerHTML = next === 'dark' ? '&#x1F319;' : '&#x2600;&#xFE0F;';
      localStorage.setItem('bgTheme', next);
    });
  }

  // ── Homepage instant-score widget (index.html only) ──────────────────
  //
  // SALES-ENGINE.md Component D: visitor enters a domain -> we call
  // Component A's public audit endpoint -> show a live teaser score ->
  // email-gate the full report. Component A (the backend that actually
  // runs the audit) is owned by a different session (Master-DashboardDesign)
  // and, as of this writing, has NOT been built yet -- there is no
  // brandgeo-dashboard/**/*audit* file and nothing documented in CLAUDE.md
  // beyond SALES-ENGINE.md's prose description. So this widget is built
  // against the STUB CONTRACT below and fails open: any non-200 response,
  // network error, malformed JSON, or timeout is treated as "Component A
  // isn't live yet" and silently falls back to the pre-existing, already-
  // working flow (redirect to signup with the domain pre-filled) --
  // zero regression today, and the richer experience turns on by itself
  // the moment Component A ships a matching endpoint. No code change is
  // needed here when that happens, only these two URLs below (and possibly
  // the response-field names, if A ships something different).
  //
  // STUB CONTRACT (Master-DashboardDesign should confirm/adjust, not the
  // other way around -- this file assumes, doesn't dictate):
  //
  //   POST https://app.getbrandgeo.com/.netlify/functions/public-audit
  //   Body:    { "domain": "example.com" }
  //   200 OK:  { "score": 34, "topGap": "ChatGPT has never mentioned your
  //              brand.", "token": "aud_9f3e2b1c" }
  //   Anything else (4xx/5xx/network error/timeout/malformed JSON) is
  //   treated as "not available" by this widget.
  //
  //   POST https://app.getbrandgeo.com/.netlify/functions/public-audit-unlock
  //   Body:    { "token": "aud_9f3e2b1c", "email": "visitor@company.com",
  //              "domain": "example.com" }
  //   200 OK:  { "ok": true }  -- server emails the full report and
  //             captures the lead (HubSpot, per SALES-ENGINE.md). This
  //             widget just shows a thank-you state on 200.
  //
  //   CORS NOTE for whoever builds Component A: this widget runs on
  //   https://getbrandgeo.com and calls app.getbrandgeo.com cross-origin.
  //   The existing authenticated dashboard functions' origin whitelist
  //   (_auth.js) does NOT include getbrandgeo.com -- this is a separate,
  //   intentionally-unauthenticated public endpoint, so it needs its own
  //   CORS allow-list entry for https://getbrandgeo.com (and
  //   https://www.getbrandgeo.com if that's ever used), not a loosening
  //   of the authenticated functions' existing lock.
  //
  //   RATE LIMITING: this file only does a soft, client-side,
  //   localStorage-based limit (bot/UX deterrent, trivially bypassed by
  //   clearing storage or using another browser). Real enforcement must
  //   live server-side in Component A, per SALES-ENGINE.md's guardrail
  //   against auditing the whole internet.
  var brandInput = document.getElementById('brandInput');
  var auditBtn = document.getElementById('auditBtn');
  var auditHp = document.getElementById('auditHp');
  var auditStatus = document.getElementById('auditStatus');
  var auditResult = document.getElementById('auditResult');

  if (brandInput && auditBtn && auditResult) {
    var AUDIT_ENDPOINT = 'https://app.getbrandgeo.com/.netlify/functions/public-audit';
    var AUDIT_UNLOCK_ENDPOINT = 'https://app.getbrandgeo.com/.netlify/functions/public-audit-unlock';
    var AUDIT_TIMEOUT_MS = 12000;
    var AUDIT_UNLOCK_TIMEOUT_MS = 10000;
    var AUDIT_RATE_KEY = 'bgAuditAttempts';
    var AUDIT_RATE_MAX = 3;
    var AUDIT_RATE_WINDOW_MS = 10 * 60 * 1000; // 10 minutes

    function escapeHtml(str) {
      return String(str).replace(/[&<>"']/g, function(c) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
      });
    }

    function redirectToSignup(domain) {
      var url = 'https://app.getbrandgeo.com/signup';
      if (domain) url += '?domain=' + encodeURIComponent(domain);
      window.location.href = url;
    }

    function getAuditAttempts() {
      try {
        var raw = localStorage.getItem(AUDIT_RATE_KEY);
        var arr = raw ? JSON.parse(raw) : [];
        var cutoff = Date.now() - AUDIT_RATE_WINDOW_MS;
        return arr.filter(function(ts) { return typeof ts === 'number' && ts > cutoff; });
      } catch (e) {
        return []; // localStorage unavailable (private mode etc.) -- soft-fail open
      }
    }

    function recordAuditAttempt() {
      try {
        var attempts = getAuditAttempts();
        attempts.push(Date.now());
        localStorage.setItem(AUDIT_RATE_KEY, JSON.stringify(attempts));
      } catch (e) { /* ignore -- see getAuditAttempts */ }
    }

    function fetchWithTimeout(url, opts, ms) {
      if (!window.fetch) return Promise.reject(new Error('fetch unsupported'));
      var controller = window.AbortController ? new AbortController() : null;
      var timer = controller ? setTimeout(function() { controller.abort(); }, ms) : null;
      var fetchOpts = opts || {};
      if (controller) fetchOpts.signal = controller.signal;
      return fetch(url, fetchOpts).then(function(res) {
        if (timer) clearTimeout(timer);
        return res;
      }, function(err) {
        if (timer) clearTimeout(timer);
        throw err;
      });
    }

    function setAuditStatus(msg, isError) {
      if (!auditStatus) return;
      auditStatus.textContent = msg || '';
      auditStatus.classList.toggle('is-error', !!isError);
    }

    function setButtonScanning(on) {
      if (on) {
        auditBtn.disabled = true;
        brandInput.disabled = true;
        auditBtn.innerHTML = '<span class="spinner" aria-hidden="true"></span>Scanning 5 AI engines&hellip;';
      } else {
        auditBtn.disabled = false;
        brandInput.disabled = false;
        auditBtn.innerHTML = 'Check My AI Visibility &rarr;';
      }
    }

    function animateAuditScore(score) {
      var ring = document.getElementById('auditRingProgress');
      var circumference = 150.8; // 2 * PI * r(24), matches the SVG below
      var offset = circumference * (1 - score / 100);
      var numEl = document.getElementById('auditRingNum');
      var inlineEl = document.getElementById('auditScoreInline');
      var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (reduced) {
        if (ring) ring.style.strokeDashoffset = offset;
        if (numEl) numEl.textContent = score;
        if (inlineEl) inlineEl.textContent = score;
        return;
      }
      if (ring) {
        ring.getBoundingClientRect(); // force layout so the transition has a starting point
        requestAnimationFrame(function() { ring.style.strokeDashoffset = offset; });
      }
      var start = null;
      var duration = 900;
      function step(ts) {
        if (!start) start = ts;
        var progress = Math.min((ts - start) / duration, 1);
        var val = Math.round(progress * score);
        if (numEl) numEl.textContent = val;
        if (inlineEl) inlineEl.textContent = val;
        if (progress < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }

    function renderAuditResult(domain, score, topGap, token) {
      score = Math.max(0, Math.min(100, Math.round(score)));
      auditResult.hidden = false;
      auditResult.innerHTML =
        '<div class="audit-result-top">' +
          '<div class="audit-ring-wrap">' +
            '<svg viewBox="0 0 60 60" style="transform:rotate(-90deg)" aria-hidden="true">' +
              '<circle cx="30" cy="30" r="24" fill="none" stroke="var(--bd2)" stroke-width="5"></circle>' +
              '<circle id="auditRingProgress" cx="30" cy="30" r="24" fill="none" stroke="url(#auditScoreGrad)" stroke-width="5" ' +
                'stroke-dasharray="150.8" stroke-dashoffset="150.8" stroke-linecap="round"></circle>' +
              '<defs><linearGradient id="auditScoreGrad" x1="0%" y1="0%">' +
                '<stop offset="0%" stop-color="#c4b5fd"></stop><stop offset="100%" stop-color="#6d28d9"></stop>' +
              '</linearGradient></defs>' +
            '</svg>' +
            '<div class="audit-ring-num" id="auditRingNum">0</div>' +
          '</div>' +
          '<div>' +
            '<div class="audit-headline">You&#39;re at <span id="auditScoreInline">0</span>/100 AI Visibility</div>' +
            '<div class="audit-domain">' + escapeHtml(domain) + '</div>' +
          '</div>' +
        '</div>' +
        '<div class="audit-gap">' + escapeHtml(topGap) + '</div>' +
        '<form class="audit-email-row" id="auditEmailForm" novalidate>' +
          '<input type="email" id="auditEmail" placeholder="you@company.com" aria-label="Your email" required>' +
          '<button type="submit" class="audit-email-btn">Email me the full breakdown &rarr;</button>' +
        '</form>' +
        '<div class="audit-fine-print">One-time report. No spam, unsubscribe any time.</div>' +
        '<div class="audit-status is-error" id="auditEmailError" hidden></div>';

      animateAuditScore(score);

      var form = document.getElementById('auditEmailForm');
      if (!form) return;
      form.addEventListener('submit', function(e) {
        e.preventDefault();
        var emailInput = document.getElementById('auditEmail');
        var errEl = document.getElementById('auditEmailError');
        var email = emailInput ? emailInput.value.trim() : '';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          if (emailInput) emailInput.focus();
          return;
        }
        var submitBtn = form.querySelector('.audit-email-btn');
        if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Sending…'; }
        if (errEl) errEl.hidden = true;

        fetchWithTimeout(AUDIT_UNLOCK_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: token, email: email, domain: domain })
        }, AUDIT_UNLOCK_TIMEOUT_MS).then(function(res) {
          if (!res.ok) throw new Error('unlock failed');
          return res.json();
        }).then(function() {
          auditResult.innerHTML =
            '<div class="audit-success">Check your inbox &mdash; the full AI Visibility report for ' +
            '<strong>' + escapeHtml(domain) + '</strong> is on its way.</div>';
        }).catch(function() {
          if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Email me the full breakdown →'; }
          if (errEl) {
            errEl.textContent = 'Something went wrong sending that — try again, or start your full audit instead.';
            errEl.hidden = false;
          }
        });
      });
    }

    function startAudit() {
      var val = brandInput.value.trim();
      if (auditHp && auditHp.value) return; // honeypot tripped -- silently drop
      if (val.length < 2) {
        brandInput.focus();
        return;
      }
      if (getAuditAttempts().length >= AUDIT_RATE_MAX) {
        setAuditStatus('You’ve checked a few brands already — try again in a few minutes, or start your full audit now.', true);
        return;
      }
      setAuditStatus('');
      auditResult.hidden = true;
      auditResult.innerHTML = '';
      setButtonScanning(true);
      recordAuditAttempt();

      fetchWithTimeout(AUDIT_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: val })
      }, AUDIT_TIMEOUT_MS).then(function(res) {
        if (!res.ok) throw new Error('audit endpoint not ready');
        return res.json();
      }).then(function(data) {
        if (!data || typeof data.score !== 'number' || !data.topGap) {
          throw new Error('unexpected audit response shape');
        }
        setButtonScanning(false);
        renderAuditResult(val, data.score, data.topGap, data.token);
      }).catch(function() {
        // Component A isn't live yet (or errored/timed out) -- fall back
        // to the pre-existing, already-working flow rather than leaving
        // the visitor stuck on a dead button.
        setButtonScanning(false);
        redirectToSignup(val);
      });
    }

    auditBtn.addEventListener('click', startAudit);
    brandInput.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') startAudit();
    });
  }

  // Scroll-reveal: fade + rise as sections enter the viewport (index.html + similar pages)
  var revealEls = document.querySelectorAll('.reveal');
  if (revealEls.length) {
    if ('IntersectionObserver' in window) {
      var revealIO = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            revealIO.unobserve(entry.target);
          }
        });
      }, { threshold: 0.15 });
      revealEls.forEach(function(el) { revealIO.observe(el); });
    } else {
      // No IntersectionObserver support: show everything immediately, don't hide content.
      revealEls.forEach(function(el) { el.classList.add('is-visible'); });
    }
  }

  // Animated score ring + counting number + dimension-bar fill-in (index.html "what you get" mockup).
  // Runs once, the first time the preview card scrolls into view.
  var previewWrap = document.querySelector('.preview-wrap');
  if (previewWrap) {
    var animatePreview = function() {
      var ring = document.getElementById('scoreRingProgress');
      if (ring) {
        var targetOffset = parseFloat(ring.getAttribute('data-target-offset'));
        // Force layout so the browser registers the starting value before transitioning.
        ring.getBoundingClientRect();
        requestAnimationFrame(function() {
          ring.style.strokeDashoffset = targetOffset;
        });
      }
      var numEl = document.getElementById('scoreNum');
      if (numEl) {
        var target = parseInt(numEl.getAttribute('data-target'), 10) || 0;
        var start = null;
        var duration = 1400;
        var step = function(ts) {
          if (!start) start = ts;
          var progress = Math.min((ts - start) / duration, 1);
          numEl.textContent = Math.round(progress * target);
          if (progress < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      }
      document.querySelectorAll('.dim-fill[data-w]').forEach(function(bar) {
        var w = bar.getAttribute('data-w');
        requestAnimationFrame(function() { bar.style.width = w + '%'; });
      });
    };
    var reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) {
      // Respect the user's preference: set final values instantly, no animation.
      var ring0 = document.getElementById('scoreRingProgress');
      if (ring0) ring0.style.strokeDashoffset = ring0.getAttribute('data-target-offset');
      var num0 = document.getElementById('scoreNum');
      if (num0) num0.textContent = num0.getAttribute('data-target');
      document.querySelectorAll('.dim-fill[data-w]').forEach(function(bar) {
        bar.style.width = bar.getAttribute('data-w') + '%';
      });
    } else if ('IntersectionObserver' in window) {
      var previewIO = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
          if (entry.isIntersecting) {
            animatePreview();
            previewIO.unobserve(entry.target);
          }
        });
      }, { threshold: 0.3 });
      previewIO.observe(previewWrap);
    } else {
      animatePreview();
    }
  }

  // Mouse-reactive parallax tilt on the "what you get" preview card.
  // Desktop pointer devices only (hover + fine pointer), and only if the
  // user hasn't asked for reduced motion — touch devices and reduced-motion
  // users keep the static CSS tilt (perspective(1000px) rotateX(3deg)).
  var tiltCard = document.querySelector('.preview-card');
  var tiltWrap = document.querySelector('.preview-wrap');
  var supportsFineHover = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (tiltCard && tiltWrap && supportsFineHover && !prefersReduced) {
    var maxTilt = 7; // degrees, kept small so it reads as a subtle parallax, not a gimmick
    tiltWrap.addEventListener('mousemove', function(e) {
      var rect = tiltWrap.getBoundingClientRect();
      var px = (e.clientX - rect.left) / rect.width;
      var py = (e.clientY - rect.top) / rect.height;
      var rotateY = (px - 0.5) * maxTilt * 2;
      var rotateX = 3 - (py - 0.5) * maxTilt * 2;
      tiltCard.style.transform = 'perspective(1000px) rotateX(' + rotateX.toFixed(2) + 'deg) rotateY(' + rotateY.toFixed(2) + 'deg)';
    });
    tiltWrap.addEventListener('mouseleave', function() {
      tiltCard.style.transform = 'perspective(1000px) rotateX(3deg)';
    });
  }

  // "Live" activity ticker on the preview card — cross-fades through a
  // handful of illustrative example signals every few seconds, reinforcing
  // that this is a running system rather than a static screenshot. Content
  // is representative example data, the same convention already used by
  // the surrounding mockup's own scores/positions, not a real client feed.
  var tickerEl = document.getElementById('tickerText');
  if (tickerEl && !prefersReduced) {
    var tickerItems = [
      'ChatGPT mentioned your brand — 2 min ago',
      'Sentiment shifted positive on Gemini — 14 min ago',
      'New competitor spotted in Perplexity — 38 min ago',
      'Position improved to #2 on ChatGPT — 1 hr ago'
    ];
    var tickerIndex = 0;
    setInterval(function() {
      tickerEl.style.opacity = 0;
      setTimeout(function() {
        tickerIndex = (tickerIndex + 1) % tickerItems.length;
        tickerEl.textContent = tickerItems[tickerIndex];
        tickerEl.style.opacity = 1;
      }, 400);
    }, 4200);
  }

  // Engine chip tooltips (hero, index.html only) — hover (desktop) or tap
  // (touch/keyboard) reveals a short, clearly-labelled illustrative example
  // of how that engine's mentions read. This is representative example
  // content, the same convention already used by the sentiment quotes and
  // the "live" ticker elsewhere on this page — not a live claim about the
  // visitor's own brand, which is why every tooltip is prefixed "Example ...
  // mention style".
  var engineChips = document.querySelectorAll('.engine-chip');
  var engineTooltip = document.getElementById('engineTooltip');
  if (engineChips.length && engineTooltip) {
    var activeChip = null;

    var positionTooltip = function(chip) {
      var rect = chip.getBoundingClientRect();
      var tipRect = engineTooltip.getBoundingClientRect();
      var left = rect.left + rect.width / 2 - tipRect.width / 2;
      var minLeft = 12;
      var maxLeft = window.innerWidth - tipRect.width - 12;
      var clampedLeft = Math.max(minLeft, Math.min(left, maxLeft));
      var arrowLeft = (rect.left + rect.width / 2) - clampedLeft;
      engineTooltip.style.left = clampedLeft + 'px';
      engineTooltip.style.top = (rect.top - tipRect.height - 12) + 'px';
      engineTooltip.style.setProperty('--arrow-left', arrowLeft + 'px');
    };

    var hideTooltip = function() {
      engineTooltip.classList.remove('is-visible');
      if (activeChip) {
        activeChip.classList.remove('is-active');
        activeChip.setAttribute('aria-expanded', 'false');
      }
      activeChip = null;
    };

    var showTooltip = function(chip) {
      var quote = chip.getAttribute('data-quote');
      var name = chip.getAttribute('data-name');
      if (!quote || !name) return;
      engineTooltip.innerHTML =
        '<span class="tip-eyebrow">Example ' + name + ' mention style</span>' +
        '<span class="tip-quote">' + quote + '</span>';
      engineTooltip.style.setProperty('--chip-accent', chip.getAttribute('data-accent') || '');
      engineTooltip.classList.add('is-visible');
      if (activeChip && activeChip !== chip) activeChip.classList.remove('is-active');
      activeChip = chip;
      chip.classList.add('is-active');
      chip.setAttribute('aria-expanded', 'true');
      // getBoundingClientRect() forces a synchronous layout, so the size we
      // read back here already reflects the innerHTML set just above —
      // no need to wait a frame (and waiting was actually fragile: rAF is
      // throttled/paused in backgrounded or non-visible tabs).
      positionTooltip(chip);
    };

    engineChips.forEach(function(chip) {
      chip.setAttribute('aria-expanded', 'false');
      chip.style.setProperty('--chip-accent', chip.getAttribute('data-accent') || '');
      chip.style.setProperty('--chip-shadow', chip.getAttribute('data-shadow') || '');

      chip.addEventListener('mouseenter', function() { showTooltip(chip); });
      chip.addEventListener('mouseleave', function() {
        if (activeChip === chip) hideTooltip();
      });
      chip.addEventListener('focus', function() { showTooltip(chip); });
      chip.addEventListener('blur', function() {
        if (activeChip === chip) hideTooltip();
      });
      chip.addEventListener('click', function() {
        if (activeChip === chip) { hideTooltip(); }
        else { showTooltip(chip); }
      });
      chip.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') hideTooltip();
      });
    });

    document.addEventListener('click', function(e) {
      if (activeChip && !activeChip.contains(e.target) &&
          e.target !== engineTooltip && !engineTooltip.contains(e.target)) {
        hideTooltip();
      }
    });
    window.addEventListener('scroll', function() { if (activeChip) hideTooltip(); }, { passive: true });
    window.addEventListener('resize', function() { if (activeChip) positionTooltip(activeChip); });
  }

  // ── Self-serve Stripe checkout links (index.html pricing) ──────────────────
  // PASTE YOUR 4 STRIPE PAYMENT LINK URLS BELOW.
  // Create them in Stripe → Payment Links (Essentials & Growth, each monthly +
  // annual), then replace the 4 placeholder strings with the real https://
  // URLs. Until a real URL is pasted for a given button, that button safely
  // falls back to the signup page (the href set in index.html), so it never
  // dead-ends. Managed / Pro / Enterprise stay on #contact (sales-assisted).
  var STRIPE_LINKS = {
    essentials: {
      monthly: 'https://buy.stripe.com/fZu4gAb1adKQ7EgdcCdZ600',
      annual:  'https://buy.stripe.com/7sY7sMfhq4agaQsa0qdZ604'
    },
    growth: {
      monthly: 'https://buy.stripe.com/5kQ8wQd9i4ag6Ac4G6dZ602',
      annual:  'https://buy.stripe.com/fZu6oI4CM6iobUwdcCdZ603'
    }
  };

  function applyCheckoutLinks(yearly) {
    document.querySelectorAll('[data-checkout]').forEach(function(el) {
      var plan = STRIPE_LINKS[el.getAttribute('data-checkout')];
      if (!plan) return;
      var url = yearly ? plan.annual : plan.monthly;
      // Only override the href when a real Stripe URL has been pasted;
      // otherwise keep the HTML fallback (signup) so the button still works.
      if (url && /^https?:\/\//.test(url)) el.setAttribute('href', url);
    });
  }
  applyCheckoutLinks(false); // set monthly links on load (no-op on other pages)

  // Billing toggle (index.html only)
  var billingToggle = document.getElementById('billingToggle');
  if (billingToggle) {
    var billingYearly = false;
    billingToggle.addEventListener('click', function() {
      billingYearly = !billingYearly;
      var monthlyLbl = document.getElementById('toggle-monthly-lbl');
      var yearlyLbl  = document.getElementById('toggle-yearly-lbl');
      billingToggle.classList.toggle('active', billingYearly);
      monthlyLbl.style.fontWeight = billingYearly ? '' : '700';
      monthlyLbl.style.color      = billingYearly ? '' : 'var(--t)';
      yearlyLbl.style.fontWeight  = billingYearly ? '700' : '';
      yearlyLbl.style.color       = billingYearly ? 'var(--t)' : '';
      document.querySelectorAll('.billing-monthly').forEach(function(el) {
        el.style.display = billingYearly ? 'none' : '';
      });
      document.querySelectorAll('.billing-yearly').forEach(function(el) {
        el.style.display = billingYearly ? '' : 'none';
      });
      applyCheckoutLinks(billingYearly); // swap checkout links to match period
    });
  }

  // ── Pricing path toggle (index.html only): self-serve vs done-for-you ──
  // Shows one 3-card grid at a time so the pricing section isn't a wall of 6
  // cards. Reuses the existing billing toggle above (which sets display on
  // ALL .billing-monthly/.billing-yearly globally), so the newly-shown grid
  // already reflects the current monthly/yearly state — no extra wiring.
  var modeBtns = document.querySelectorAll('.mode-btn[data-mode]');
  var gridSelf = document.getElementById('grid-self');
  var gridManaged = document.getElementById('grid-managed');
  var modeCaption = document.getElementById('modeCaption');
  if (modeBtns.length && gridSelf && gridManaged) {
    var MODE_CAPTIONS = {
      self: 'Run it yourself — subscribe, log in, and track your AI visibility. Upgrade, downgrade or cancel anytime.',
      managed: 'Done for you — our team runs the strategy, research and reporting. You get the results, not the busywork.'
    };
    modeBtns.forEach(function(btn) {
      btn.addEventListener('click', function() {
        var mode = btn.getAttribute('data-mode');
        modeBtns.forEach(function(b) {
          var on = (b === btn);
          b.classList.toggle('active', on);
          b.setAttribute('aria-selected', on ? 'true' : 'false');
        });
        gridSelf.hidden = (mode !== 'self');
        gridManaged.hidden = (mode !== 'managed');
        if (modeCaption && MODE_CAPTIONS[mode]) modeCaption.textContent = MODE_CAPTIONS[mode];
      });
    });
  }

  // ── Mobile nav menu (every page that loads this script) ────────────────
  // The marketing pages hide every nav link except the CTA below 640px and
  // ship no hamburger, so How it works / Pricing / FAQ / Research / News are
  // unreachable on phones. Rather than editing the inline <nav> markup in
  // ~59 static HTML files, we progressively enhance the shared nav here:
  // wrap the text links in a drawer, inject a toggle button + scoped CSS,
  // then reveal the drawer as a dropdown on mobile. Desktop layout is
  // untouched — the drawer uses display:contents, so it has no box of its
  // own and its links keep behaving as direct flex children of the nav row.
  (function() {
    var nav = document.querySelector('nav');
    if (!nav) return;
    var actions = nav.querySelector(':scope > div');
    if (!actions) return;
    var textLinks = [];
    actions.querySelectorAll('a:not(.nav-cta)').forEach(function(a) { textLinks.push(a); });
    if (!textLinks.length) return;

    // Wrap the text links in a drawer, preserving their order/position.
    var drawer = document.createElement('div');
    drawer.className = 'bg-nav-drawer';
    actions.insertBefore(drawer, textLinks[0]);
    textLinks.forEach(function(a) { drawer.appendChild(a); });

    // Hamburger toggle, appended as the last item in the nav actions row.
    var toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'bg-nav-toggle';
    toggle.setAttribute('aria-label', 'Open menu');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.innerHTML = '<span></span><span></span><span></span>';
    actions.appendChild(toggle);

    // Scoped CSS injected once. Uses the site's existing custom properties
    // (--nav/--bd/--bd2/--t2), present on every page that loads this script.
    var css = document.createElement('style');
    css.textContent =
      '.bg-nav-drawer{display:contents;}' +
      '.bg-nav-toggle{display:none;}' +
      '@media(max-width:640px){' +
        'nav a:not(.nav-cta){display:none;}' +
        '.bg-nav-toggle{display:flex;flex-direction:column;justify-content:center;gap:4px;width:36px;height:36px;margin-left:10px;padding:0 8px;background:none;border:1px solid var(--bd2);border-radius:8px;cursor:pointer;flex-shrink:0;}' +
        '.bg-nav-toggle span{display:block;height:2px;width:100%;background:var(--t2);border-radius:2px;transition:transform .2s ease,opacity .2s ease;}' +
        'nav.bg-menu-open .bg-nav-toggle span:nth-child(1){transform:translateY(6px) rotate(45deg);}' +
        'nav.bg-menu-open .bg-nav-toggle span:nth-child(2){opacity:0;}' +
        'nav.bg-menu-open .bg-nav-toggle span:nth-child(3){transform:translateY(-6px) rotate(-45deg);}' +
        '.bg-nav-drawer{display:none;position:absolute;top:100%;left:0;right:0;flex-direction:column;align-items:stretch;gap:0;background:var(--nav);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);border-bottom:1px solid var(--bd);padding:6px 20px 12px;box-shadow:0 14px 28px rgba(0,0,0,.28);}' +
        'nav.bg-menu-open .bg-nav-drawer{display:flex;}' +
        'nav.bg-menu-open .bg-nav-drawer a{display:block;margin:0;padding:13px 4px;font-size:0.98rem;border-bottom:1px solid var(--bd);}' +
        'nav.bg-menu-open .bg-nav-drawer a:last-child{border-bottom:none;}' +
      '}' +
      // Very small phones (<=380px, e.g. iPhone SE / 360px Androids): the bar
      // now carries the CTA + theme toggle + hamburger, so tighten padding and
      // gaps a touch to guarantee it never overflows into a horizontal scroll.
      '@media(max-width:380px){' +
        'nav{padding-left:16px;padding-right:16px;}' +
        '.nav-cta{padding-left:13px;padding-right:13px;margin-left:8px !important;}' +
        '.theme-toggle{margin-left:8px;}' +
        '.bg-nav-toggle{margin-left:8px;}' +
      '}';
    document.head.appendChild(css);

    function closeMenu() {
      nav.classList.remove('bg-menu-open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Open menu');
    }
    function openMenu() {
      nav.classList.add('bg-menu-open');
      toggle.setAttribute('aria-expanded', 'true');
      toggle.setAttribute('aria-label', 'Close menu');
    }
    toggle.addEventListener('click', function(e) {
      e.stopPropagation();
      if (nav.classList.contains('bg-menu-open')) closeMenu(); else openMenu();
    });
    drawer.addEventListener('click', function(e) {
      if (e.target.tagName === 'A') closeMenu();
    });
    document.addEventListener('click', function(e) {
      if (nav.classList.contains('bg-menu-open') && !nav.contains(e.target)) closeMenu();
    });
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') closeMenu();
    });
    window.addEventListener('resize', function() {
      if (window.innerWidth > 640) closeMenu();
    });
  })();
})();
