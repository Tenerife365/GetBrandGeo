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

// ── BrandGEO site chat assistant (ASSISTANT-SPEC.md) ──────────────────────
// Self-contained: floating launcher + panel, injected on every page that loads
// this script. Talks to two PUBLIC Netlify functions on app.getbrandgeo.com
// (assistant / assistant-lead). Uses the site's own CSS custom properties so it
// inherits dark/light theme automatically; no per-page HTML edits needed.
(function() {
  if (!window.fetch || document.getElementById('bg-asst-launcher')) return;

  var ASSISTANT_ENDPOINT = 'https://app.getbrandgeo.com/.netlify/functions/assistant';
  var LEAD_ENDPOINT      = 'https://app.getbrandgeo.com/.netlify/functions/assistant-lead';
  var SIGNUP_URL   = 'https://app.getbrandgeo.com/signup';
  var SUPPORT_URL  = 'https://getbrandgeo.com/support.html';
  var PRIVACY_URL  = 'https://getbrandgeo.com/privacy.html';
  var SUPPORT_EMAIL = 'support@getbrandgeo.com';
  var TIMEOUT_MS = 22000;
  var SESSION_MSG_CAP = 30; // soft client-side cap; the server enforces the real one

  var WELCOME = "Hi — I'm the BrandGEO assistant. I can show you how your brand appears across ChatGPT, Gemini, Claude, Perplexity and Meta AI, walk you through pricing, run a free audit, or connect you with our team. What can I help with?";
  var OPENING_CHIPS = [
    { label: '💶 See pricing',       send: 'What does BrandGEO cost?' },
    { label: '🔍 Run a free audit',  send: 'I want to run a free audit.' },
    { label: '📞 Talk to sales',     send: 'I want to talk to sales.' },
    { label: "🛟 I'm a customer",    send: "I'm an existing customer and need support." }
  ];

  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var history = [];   // [{role,content}] sent to the assistant endpoint
  var sentCount = 0, busy = false, lastFocus = null;
  var launcher, panel, msgs, composer, ta, sendBtn, chipsRow, greeted = false;

  function esc(s){ return String(s).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
  function el(tag, cls, txt){ var e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }
  function scrollDown(){ if (msgs) msgs.scrollTop = msgs.scrollHeight; }

  // Escape text and turn bare URLs into safe new-tab links.
  function fillText(node, text){
    var re = /(https?:\/\/[^\s<>()]+[^\s<>().,!?])/g, idx = 0, m;
    text = String(text);
    while ((m = re.exec(text))) {
      if (m.index > idx) node.appendChild(document.createTextNode(text.slice(idx, m.index)));
      var a = el('a', 'bg-asst-link'); a.href = m[0]; a.textContent = m[0];
      a.target = '_blank'; a.rel = 'noopener noreferrer';
      node.appendChild(a);
      idx = m.index + m[0].length;
    }
    if (idx < text.length) node.appendChild(document.createTextNode(text.slice(idx)));
  }

  function addBubble(role, text){
    var row = el('div', 'bg-asst-msg bg-asst-' + role);
    var bubble = el('div', 'bg-asst-bubble');
    fillText(bubble, text);
    row.appendChild(bubble);
    msgs.appendChild(row);
    scrollDown();
    return row;
  }

  var typingRow = null;
  function showTyping(){
    if (typingRow) return;
    typingRow = el('div', 'bg-asst-msg bg-asst-assistant');
    var b = el('div', 'bg-asst-bubble bg-asst-typing');
    b.innerHTML = '<span></span><span></span><span></span>';
    typingRow.appendChild(b);
    msgs.appendChild(typingRow);
    scrollDown();
  }
  function hideTyping(){ if (typingRow) { typingRow.parentNode.removeChild(typingRow); typingRow = null; } }

  function renderChips(items){
    if (chipsRow) { chipsRow.parentNode.removeChild(chipsRow); chipsRow = null; }
    if (!items || !items.length) return;
    chipsRow = el('div', 'bg-asst-chips');
    items.forEach(function(it){
      var b = el('button', 'bg-asst-chip', it.label);
      b.type = 'button';
      b.addEventListener('click', function(){ send(it.send); });
      chipsRow.appendChild(b);
    });
    msgs.appendChild(chipsRow);
    scrollDown();
  }

  function fetchJson(url, payload){
    var ctrl = window.AbortController ? new AbortController() : null;
    var timer = ctrl ? setTimeout(function(){ ctrl.abort(); }, TIMEOUT_MS) : null;
    return fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: ctrl ? ctrl.signal : undefined
    }).then(function(r){
      if (timer) clearTimeout(timer);
      return r.json().then(function(j){ return { ok: r.ok, status: r.status, data: j }; });
    }).catch(function(e){ if (timer) clearTimeout(timer); throw e; });
  }

  function renderAction(action){
    if (!action) return;
    if (action.type === 'start_audit') {
      var wrap = el('div', 'bg-asst-msg bg-asst-assistant');
      var box = el('div', 'bg-asst-actions');
      var a = el('a', 'bg-asst-btn', 'Run my free audit →');
      a.href = SIGNUP_URL + '?domain=' + encodeURIComponent(action.domain);
      box.appendChild(a);
      wrap.appendChild(box); msgs.appendChild(wrap); scrollDown();
    } else if (action.type === 'capture_lead') {
      showLeadForm(action.reason || 'sales', null);
    } else if (action.type === 'route_support') {
      var w = el('div', 'bg-asst-msg bg-asst-assistant');
      var b2 = el('div', 'bg-asst-actions');
      var open = el('a', 'bg-asst-btn', 'Open support →'); open.href = SUPPORT_URL; open.target = '_blank'; open.rel = 'noopener noreferrer';
      var mail = el('a', 'bg-asst-btn bg-asst-btn-sec', 'Email support'); mail.href = 'mailto:' + SUPPORT_EMAIL;
      b2.appendChild(open); b2.appendChild(mail);
      w.appendChild(b2); msgs.appendChild(w); scrollDown();
    }
  }

  // Supportive, actionable fallback when the assistant can't answer (offline,
  // timeout, error). Never dead-ends the visitor — offers the core paths right
  // in the widget so they can still run the free audit, see pricing, or reach a
  // human without leaving the page.
  function fallbackHelp(){
    addBubble('assistant', "I'm having a brief hiccup on my end — but I can still point you the right way:");
    var wrap = el('div', 'bg-asst-msg bg-asst-assistant');
    var box = el('div', 'bg-asst-actions');
    var audit = el('a', 'bg-asst-btn', 'Run my free audit →');
    audit.href = SIGNUP_URL; audit.target = '_blank'; audit.rel = 'noopener noreferrer';
    var price = el('a', 'bg-asst-btn bg-asst-btn-sec', 'See pricing');
    price.href = 'https://getbrandgeo.com/#pricing'; price.target = '_blank'; price.rel = 'noopener noreferrer';
    var human = el('button', 'bg-asst-btn bg-asst-btn-sec', 'Talk to a human'); human.type = 'button';
    human.addEventListener('click', function(){
      addBubble('assistant', 'Happy to connect you — leave your details and the team will reach out.');
      showLeadForm('sales', null);
    });
    box.appendChild(audit); box.appendChild(price); box.appendChild(human);
    wrap.appendChild(box); msgs.appendChild(wrap); scrollDown();
  }

  function send(text){
    text = String(text || '').trim();
    if (!text || busy) return;
    if (sentCount >= SESSION_MSG_CAP) {
      addBubble('assistant', 'That’s a lot of questions — the best next step is to talk to the team at ' + SUPPORT_EMAIL + ', or tap “Talk to a human” below.');
      return;
    }
    if (chipsRow) { chipsRow.parentNode.removeChild(chipsRow); chipsRow = null; }
    addBubble('user', text);
    history.push({ role: 'user', content: text });
    sentCount++;
    busy = true; setBusy(true); showTyping();

    fetchJson(ASSISTANT_ENDPOINT, { messages: history }).then(function(res){
      hideTyping();
      var d = res.data || {};
      if (typeof d.reply === 'string' && d.reply) {
        addBubble('assistant', d.reply);
        if (res.ok) history.push({ role: 'assistant', content: d.reply });
        if (res.ok && d.action) renderAction(d.action);
      } else {
        fallbackHelp();
      }
    }).catch(function(){
      hideTyping();
      fallbackHelp();
    }).then(function(){ busy = false; setBusy(false); if (ta) ta.focus(); });
  }

  function setBusy(on){
    if (sendBtn) sendBtn.disabled = on;
    if (ta) ta.disabled = on;
  }

  function showLeadForm(reason, domain){
    var row = el('div', 'bg-asst-msg bg-asst-assistant');
    var form = el('form', 'bg-asst-form');
    var name = el('input', 'bg-asst-input'); name.type = 'text'; name.placeholder = 'Your name'; name.autocomplete = 'name'; name.required = true;
    var email = el('input', 'bg-asst-input'); email.type = 'email'; email.placeholder = 'Work email'; email.autocomplete = 'email'; email.required = true;
    var need = el('input', 'bg-asst-input'); need.type = 'text'; need.placeholder = 'What do you need? (optional)';
    var hp = el('input', 'bg-asst-hp'); hp.type = 'text'; hp.tabIndex = -1; hp.setAttribute('aria-hidden', 'true'); hp.autocomplete = 'off';
    var consent = el('div', 'bg-asst-consent');
    consent.appendChild(document.createTextNode('We’ll only use this to get back to you. See our '));
    var pl = el('a', 'bg-asst-link', 'privacy policy'); pl.href = PRIVACY_URL; pl.target = '_blank'; pl.rel = 'noopener noreferrer';
    consent.appendChild(pl); consent.appendChild(document.createTextNode('.'));
    var submit = el('button', 'bg-asst-btn', 'Send →'); submit.type = 'submit';
    var err = el('div', 'bg-asst-err'); err.style.display = 'none';

    form.appendChild(name); form.appendChild(email); form.appendChild(need);
    form.appendChild(hp); form.appendChild(consent); form.appendChild(err); form.appendChild(submit);
    row.appendChild(form); msgs.appendChild(row); scrollDown();
    setTimeout(function(){ name.focus(); }, 30);

    form.addEventListener('submit', function(e){
      e.preventDefault();
      err.style.display = 'none';
      var em = email.value.trim();
      if (!name.value.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) {
        err.textContent = 'Please add your name and a valid email.'; err.style.display = 'block'; return;
      }
      submit.disabled = true; submit.textContent = 'Sending…';
      fetchJson(LEAD_ENDPOINT, {
        name: name.value.trim(), email: em, need: need.value.trim(),
        reason: reason, domain: domain || '', honeypot: hp.value
      }).then(function(res){
        if (res.ok && res.data && res.data.ok) {
          row.removeChild(form);
          var ok = el('div', 'bg-asst-bubble');
          fillText(ok, 'Thanks — I’ve passed your details to the team. Someone will be in touch by email shortly.');
          row.appendChild(ok); scrollDown();
        } else {
          err.textContent = (res.data && res.data.error) || 'Something went wrong. Please email ' + SUPPORT_EMAIL + '.';
          err.style.display = 'block'; submit.disabled = false; submit.textContent = 'Send →';
        }
      }).catch(function(){
        err.textContent = 'Couldn’t send that. Please email ' + SUPPORT_EMAIL + '.';
        err.style.display = 'block'; submit.disabled = false; submit.textContent = 'Send →';
      });
    });
  }

  // ---- open / close ----
  function focusables(){
    return Array.prototype.slice.call(panel.querySelectorAll(
      'a[href],button:not([disabled]),textarea:not([disabled]),input:not([disabled]),[tabindex]:not([tabindex="-1"])'
    )).filter(function(n){ return n.offsetParent !== null; });
  }
  function onKeydown(e){
    if (e.key === 'Escape') { close(); return; }
    if (e.key === 'Tab') {
      var f = focusables(); if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  }
  function open(){
    lastFocus = document.activeElement;
    panel.classList.add('bg-asst-on');
    launcher.classList.add('bg-asst-hidden');
    launcher.setAttribute('aria-expanded', 'true');
    document.addEventListener('keydown', onKeydown, true);
    if (!greeted) {
      greeted = true;
      addBubble('assistant', WELCOME);
      renderChips(OPENING_CHIPS);
    }
    setTimeout(function(){ if (ta) ta.focus(); }, 40);
  }
  function close(){
    panel.classList.remove('bg-asst-on');
    launcher.classList.remove('bg-asst-hidden');
    launcher.setAttribute('aria-expanded', 'false');
    document.removeEventListener('keydown', onKeydown, true);
    if (lastFocus && lastFocus.focus) lastFocus.focus(); else launcher.focus();
  }

  function build(){
    // Launcher
    launcher = el('button', 'bg-asst-launcher');
    launcher.id = 'bg-asst-launcher';
    launcher.type = 'button';
    launcher.setAttribute('aria-label', 'Open the BrandGEO assistant chat');
    launcher.setAttribute('aria-expanded', 'false');
    launcher.innerHTML =
      '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>' +
      '<span class="bg-asst-launch-label">Ask us</span>';
    if (!reduced) launcher.classList.add('bg-asst-pulse');
    launcher.addEventListener('click', open);

    // Panel
    panel = el('div', 'bg-asst-panel');
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');
    panel.setAttribute('aria-label', 'BrandGEO assistant');

    var head = el('div', 'bg-asst-head');
    head.appendChild(el('span', 'bg-asst-dot'));
    var titleWrap = el('div', 'bg-asst-titlewrap');
    titleWrap.appendChild(el('div', 'bg-asst-title', 'BrandGEO Assistant'));
    titleWrap.appendChild(el('div', 'bg-asst-sub', 'Online · usually replies instantly'));
    head.appendChild(titleWrap);
    var closeBtn = el('button', 'bg-asst-close', '×');
    closeBtn.type = 'button'; closeBtn.setAttribute('aria-label', 'Close chat');
    closeBtn.addEventListener('click', close);
    head.appendChild(closeBtn);

    msgs = el('div', 'bg-asst-msgs');
    msgs.setAttribute('role', 'log');
    msgs.setAttribute('aria-live', 'polite');

    var foot = el('div', 'bg-asst-foot');
    composer = el('div', 'bg-asst-composer');
    ta = el('textarea', 'bg-asst-ta');
    ta.rows = 1; ta.placeholder = 'Ask about BrandGEO…'; ta.setAttribute('aria-label', 'Type your message');
    ta.addEventListener('input', function(){ ta.style.height = 'auto'; ta.style.height = Math.min(ta.scrollHeight, 100) + 'px'; });
    ta.addEventListener('keydown', function(e){
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); var v = ta.value; ta.value = ''; ta.style.height = 'auto'; send(v); }
    });
    sendBtn = el('button', 'bg-asst-send');
    sendBtn.type = 'button'; sendBtn.setAttribute('aria-label', 'Send message');
    sendBtn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>';
    sendBtn.addEventListener('click', function(){ var v = ta.value; ta.value = ''; ta.style.height = 'auto'; send(v); });
    composer.appendChild(ta); composer.appendChild(sendBtn);

    var human = el('button', 'bg-asst-human', 'Talk to a human');
    human.type = 'button';
    human.addEventListener('click', function(){
      if (chipsRow) { chipsRow.parentNode.removeChild(chipsRow); chipsRow = null; }
      addBubble('assistant', 'Happy to connect you — leave your details and the team will reach out.');
      showLeadForm('sales', null);
    });
    foot.appendChild(composer); foot.appendChild(human);

    panel.appendChild(head); panel.appendChild(msgs); panel.appendChild(foot);
    document.body.appendChild(launcher);
    document.body.appendChild(panel);
    injectCss();
  }

  function injectCss(){
    var css = document.createElement('style');
    css.textContent =
      '.bg-asst-launcher{position:fixed;bottom:20px;right:20px;z-index:2147483000;display:inline-flex;align-items:center;gap:8px;padding:12px 18px;border:none;border-radius:999px;cursor:pointer;font:inherit;font-weight:600;font-size:.92rem;color:#fff;background:linear-gradient(135deg,var(--ac),#8b7bff);box-shadow:0 10px 30px rgba(108,99,255,.42);transition:transform .18s ease,box-shadow .18s ease;}' +
      '.bg-asst-launcher:hover{transform:translateY(-2px);box-shadow:0 14px 36px rgba(108,99,255,.5);}' +
      '.bg-asst-launcher.bg-asst-hidden{display:none;}' +
      '.bg-asst-launch-label{white-space:nowrap;}' +
      '@keyframes bg-asst-pulse{0%{box-shadow:0 10px 30px rgba(108,99,255,.42),0 0 0 0 rgba(108,99,255,.5);}70%{box-shadow:0 10px 30px rgba(108,99,255,.42),0 0 0 14px rgba(108,99,255,0);}100%{box-shadow:0 10px 30px rgba(108,99,255,.42),0 0 0 0 rgba(108,99,255,0);}}' +
      '.bg-asst-pulse{animation:bg-asst-pulse 2.4s ease-out 3;}' +
      '.bg-asst-panel{position:fixed;bottom:20px;right:20px;z-index:2147483001;width:374px;max-width:calc(100vw - 32px);height:min(620px,calc(100vh - 40px));display:none;flex-direction:column;overflow:hidden;background:var(--s);border:1px solid var(--bd);border-radius:16px;box-shadow:0 24px 64px rgba(0,0,0,.4);}' +
      '.bg-asst-panel.bg-asst-on{display:flex;}' +
      '.bg-asst-head{display:flex;align-items:center;gap:10px;padding:14px 16px;border-bottom:1px solid var(--bd);flex-shrink:0;}' +
      '.bg-asst-dot{width:9px;height:9px;border-radius:50%;background:#22c55e;box-shadow:0 0 0 3px rgba(34,197,94,.18);flex-shrink:0;}' +
      '.bg-asst-titlewrap{display:flex;flex-direction:column;min-width:0;}' +
      '.bg-asst-title{font-weight:700;font-size:.95rem;color:var(--t);line-height:1.2;}' +
      '.bg-asst-sub{font-size:.72rem;color:var(--t3);line-height:1.2;margin-top:2px;}' +
      '.bg-asst-close{margin-left:auto;background:none;border:none;color:var(--t2);font-size:1.4rem;line-height:1;cursor:pointer;padding:4px 8px;border-radius:8px;flex-shrink:0;}' +
      '.bg-asst-close:hover{background:var(--bd);color:var(--t);}' +
      '.bg-asst-msgs{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:12px;}' +
      '.bg-asst-msg{display:flex;}' +
      '.bg-asst-user{justify-content:flex-end;}' +
      '.bg-asst-bubble{max-width:84%;padding:10px 13px;border-radius:14px;font-size:.9rem;line-height:1.5;color:var(--t);white-space:pre-wrap;overflow-wrap:break-word;word-break:break-word;}' +
      '.bg-asst-assistant .bg-asst-bubble{background:var(--s2);border:1px solid var(--bd);border-bottom-left-radius:4px;}' +
      '.bg-asst-user .bg-asst-bubble{background:linear-gradient(135deg,var(--ac),#8b7bff);color:#fff;border-bottom-right-radius:4px;}' +
      '.bg-asst-link{color:var(--ac);text-decoration:underline;}' +
      '.bg-asst-user .bg-asst-link{color:#fff;}' +
      '.bg-asst-typing{display:flex;gap:4px;align-items:center;}' +
      '.bg-asst-typing span{width:7px;height:7px;border-radius:50%;background:var(--t3);display:inline-block;animation:bg-asst-blink 1.2s infinite ease-in-out both;}' +
      '.bg-asst-typing span:nth-child(2){animation-delay:.18s;}' +
      '.bg-asst-typing span:nth-child(3){animation-delay:.36s;}' +
      '@keyframes bg-asst-blink{0%,80%,100%{opacity:.25;}40%{opacity:1;}}' +
      '.bg-asst-chips{display:flex;flex-wrap:wrap;gap:8px;}' +
      '.bg-asst-chip{border:1px solid var(--bd2);background:transparent;color:var(--t);border-radius:999px;padding:8px 13px;font:inherit;font-size:.82rem;cursor:pointer;transition:background .15s ease;}' +
      '.bg-asst-chip:hover{background:var(--bd);}' +
      '.bg-asst-actions{display:flex;flex-wrap:wrap;gap:8px;}' +
      '.bg-asst-btn{display:inline-block;background:var(--ac);color:#fff;border:none;border-radius:10px;padding:9px 14px;font:inherit;font-size:.85rem;font-weight:600;cursor:pointer;text-decoration:none;}' +
      '.bg-asst-btn:hover{filter:brightness(1.08);}' +
      '.bg-asst-btn-sec{background:transparent;color:var(--t);border:1px solid var(--bd2);}' +
      '.bg-asst-form{display:flex;flex-direction:column;gap:8px;width:100%;}' +
      '.bg-asst-input{width:100%;background:var(--bg);border:1px solid var(--bd2);border-radius:9px;padding:9px 11px;color:var(--t);font:inherit;font-size:.86rem;box-sizing:border-box;}' +
      '.bg-asst-input::placeholder{color:var(--t3);}' +
      '.bg-asst-hp{position:absolute;left:-9999px;width:1px;height:1px;opacity:0;}' +
      '.bg-asst-consent{font-size:.72rem;color:var(--t3);line-height:1.4;}' +
      '.bg-asst-err{font-size:.78rem;color:#ef4444;}' +
      '.bg-asst-foot{border-top:1px solid var(--bd);padding:10px 12px;display:flex;flex-direction:column;gap:7px;flex-shrink:0;}' +
      '.bg-asst-composer{display:flex;gap:8px;align-items:flex-end;}' +
      '.bg-asst-ta{flex:1;resize:none;min-height:22px;max-height:100px;background:var(--bg);border:1px solid var(--bd2);border-radius:10px;padding:9px 11px;color:var(--t);font:inherit;font-size:.9rem;line-height:1.4;box-sizing:border-box;}' +
      '.bg-asst-ta::placeholder{color:var(--t3);}' +
      '.bg-asst-send{flex-shrink:0;width:40px;height:40px;display:flex;align-items:center;justify-content:center;background:var(--ac);color:#fff;border:none;border-radius:10px;cursor:pointer;}' +
      '.bg-asst-send:hover{filter:brightness(1.08);}' +
      '.bg-asst-send:disabled{opacity:.5;cursor:default;}' +
      '.bg-asst-human{align-self:flex-start;background:none;border:none;color:var(--t3);font:inherit;font-size:.76rem;cursor:pointer;padding:0;text-decoration:underline;}' +
      '.bg-asst-human:hover{color:var(--t2);}' +
      '.bg-asst-launcher:focus-visible,.bg-asst-panel button:focus-visible,.bg-asst-panel a:focus-visible,.bg-asst-panel textarea:focus-visible,.bg-asst-panel input:focus-visible,.bg-asst-chip:focus-visible{outline:2px solid var(--ac);outline-offset:2px;}' +
      '@media(max-width:480px){' +
        '.bg-asst-launcher{bottom:16px;right:16px;padding:11px 15px;}' +
        '.bg-asst-panel{bottom:0;right:0;left:0;width:100%;max-width:100%;height:86vh;border-radius:16px 16px 0 0;}' +
      '}' +
      '@media(prefers-reduced-motion:reduce){' +
        '.bg-asst-pulse{animation:none;}' +
        '.bg-asst-typing span{animation:none;opacity:.55;}' +
        '.bg-asst-launcher{transition:none;}' +
      '}';
    document.head.appendChild(css);
  }

  function init(){ if (document.body) build(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
