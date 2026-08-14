/* build: 2026-07-26 hook-rebuild */
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
  // SALES-ENGINE.md Component D: visitor enters a domain -> we call the audit
  // endpoint -> show a live teaser score -> email-gate the full report.
  //
  // 2026-07-26: this block used to point at `public-audit` and
  // `public-audit-unlock`, names invented by the stub contract it was written
  // against before Component A existed. Component A did ship, under different
  // names, and nobody came back and changed these two URLs. Both returned 404
  // in production, so every visitor who typed a domain fell into the catch
  // below and was redirected to signup. The instant audit had never once
  // resolved in place. The names below are read from the deployed functions.
  //
  // REAL CONTRACT (brandgeo-dashboard/netlify/functions/audit-domain.js and
  // get-audit-report.js and unlock-audit-report.js):
  //
  //   POST /.netlify/functions/audit-domain
  //   Body:    { "domain": "example.com", "honeypot": "" }
  //   Public callers are always forced to 'screening' depth (audit-domain.js:74),
  //   which runs to completion synchronously, so this stays a single call:
  //   200 OK:  { "token": "...", "status": "ready",
  //              "teaser": { "domain": ..., "ai_score": 41, "category": ... } }
  //   400/429: { "error": "<message meant for the visitor>" } -- shown as-is,
  //            not treated as "endpoint down". A paused-for-the-month 429 must
  //            not dump someone into signup.
  //
  //   GET  /.netlify/functions/get-audit-report?token=...
  //   200 OK:  { "status": "ready", "unlocked": false, "domain", "category",
  //              "ai_score", "low_confidence", "gap_count", "engine_states",
  //              "competitor_names": string[], "competitor_count" }
  //   Called once after the score lands. It carries the EVIDENCE, so its
  //   failure is degrading rather than fatal: the score still renders without
  //   it, just without the engine chips and the competitor names.
  //
  //   2026-08-14: engine_states, competitor_names and competitor_count are new.
  //   The email gate now splits by GRANULARITY, not by field name - the free
  //   view gets the deduplicated competitor NAMES and the per-engine verdict,
  //   the gated report keeps the per-prompt attribution and the answer
  //   snippets. Full ruling and its reasoning: the header comment of
  //   brandgeo-dashboard/netlify/functions/get-audit-report.js. Two things
  //   follow for anything rendered here, and both are load-bearing:
  //     - Never print "named INSTEAD OF you" against a free-view name. That is
  //       a per-prompt claim and the free payload has no per-prompt data. What
  //       IS true of every name, by construction, is that it came from an
  //       answer where the brand was not mentioned (_score.js:150), so "named
  //       in answers where you were not" holds even on a high-scoring audit.
  //     - Never render a per-engine competitor count. With two screening
  //       engines a count plus the name list often reconstructs the pairing by
  //       arithmetic, which is the gated asset leaking through a sum.
  //
  //   POST /.netlify/functions/unlock-audit-report
  //   Body:    { "token": ..., "email": ..., "honeypot": "" }
  //   200 OK:  server emails the full report and captures the lead.
  //
  //   CORS: _prospect_guard.js:19 allowlists https://getbrandgeo.com,
  //   https://www.getbrandgeo.com and https://app.getbrandgeo.com. The
  //   marketing site's own CSP must also list app.getbrandgeo.com in
  //   connect-src -- it did not until 2026-07-26, see brandgeo/web/.htaccess.
  //
  //   RATE LIMITING: this file only does a soft, client-side,
  //   localStorage-based limit (bot/UX deterrent, trivially bypassed by
  //   clearing storage or using another browser). Real enforcement lives
  //   server-side in _prospect_guard.js (per-IP plus a monthly spend cap).
  var brandInput = document.getElementById('brandInput');
  var auditBtn = document.getElementById('auditBtn');
  var auditHp = document.getElementById('auditHp');
  var auditStatus = document.getElementById('auditStatus');
  var auditResult = document.getElementById('auditResult');
  // The scanning skeleton and the result both live in the evidence card's
  // position, and swap with it. docs/design/homepage-hook.md §8.
  var previewCard = document.getElementById('previewCard');
  var auditSkeleton = document.getElementById('auditSkeleton');

  if (brandInput && auditBtn && auditResult) {
    var AUDIT_BASE = 'https://app.getbrandgeo.com/.netlify/functions/';
    var AUDIT_ENDPOINT = AUDIT_BASE + 'audit-domain';
    var AUDIT_REPORT_ENDPOINT = AUDIT_BASE + 'get-audit-report';
    var AUDIT_UNLOCK_ENDPOINT = AUDIT_BASE + 'unlock-audit-report';
    // Where the unlocked report actually lives (App.tsx:106, /audit/:token).
    // Added 2026-07-31 closing acquisition-funnel-audit.md F1/F2/F4: the report
    // was built, deployed, working and unreachable, because nothing ever handed
    // the visitor this URL. unlock-audit-report.js sends NO email (the files
    // that touch a mailer and the files that touch a prospect audit are
    // disjoint sets), so the old "check your inbox" copy promised a delivery
    // that could not happen, to every person who converted.
    var AUDIT_REPORT_URL = 'https://app.getbrandgeo.com/audit/';
    // A real screening audit measured 26.9s end to end on 2026-07-26. The old
    // 12s ceiling aborted every one of them, so even once the URLs were right
    // the widget would still have redirected to signup. Netlify's synchronous
    // limit is 26s of function time, so this sits just past it.
    var AUDIT_TIMEOUT_MS = 32000;
    var AUDIT_UNLOCK_TIMEOUT_MS = 10000;
    var AUDIT_REPORT_TIMEOUT_MS = 8000;
    var AUDIT_RATE_KEY = 'bgAuditAttempts';
    var AUDIT_RATE_MAX = 3;
    var AUDIT_RATE_WINDOW_MS = 10 * 60 * 1000; // 10 minutes

    function escapeHtml(str) {
      return String(str).replace(/[&<>"']/g, function(c) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
      });
    }

    // Split out of redirectToSignup() 2026-07-31 so the SUCCESS path can offer
    // the same destination the error path has always redirected to, built the
    // same way. Two hand-built copies of this URL is how one of them quietly
    // loses ?domain= and starts asking the visitor to retype what they typed
    // into the widget thirty seconds earlier.
    function signupUrl(domain) {
      var url = 'https://app.getbrandgeo.com/signup';
      if (domain) url += '?domain=' + encodeURIComponent(domain);
      return url;
    }

    function redirectToSignup(domain) {
      window.location.href = signupUrl(domain);
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

    // Shows the skeleton in the evidence card's slot. A skeleton that matches
    // the result layout, not a spinner that reflows: its job is to hold the
    // shape the answer will land in while up to 12s of latency passes.
    function showSlot(which) {
      if (previewCard) previewCard.hidden = (which !== 'card');
      if (auditSkeleton) auditSkeleton.hidden = (which !== 'skeleton');
      auditResult.hidden = (which !== 'result');
    }

    // The audit runs for the better part of half a minute. One static line for
    // that long reads as a hang, so the label reports where it has got to. Job:
    // mask latency, per docs/design/homepage-hook.md §7. Times are wall clock,
    // not progress, and the copy is careful not to claim otherwise.
    var skTimers = [];
    function startSkeletonProgress() {
      stopSkeletonProgress();
      var el = document.getElementById('skLabel');
      if (!el) return;
      el.textContent = 'Asking the engines about your brand';
      skTimers.push(setTimeout(function() { el.textContent = 'Reading what each engine came back with'; }, 7000));
      skTimers.push(setTimeout(function() { el.textContent = 'Scoring the answers, nearly there'; }, 16000));
    }
    function stopSkeletonProgress() {
      for (var i = 0; i < skTimers.length; i++) { clearTimeout(skTimers[i]); }
      skTimers = [];
    }

    function setButtonScanning(on) {
      if (!on) stopSkeletonProgress();
      if (on) {
        auditBtn.disabled = true;
        brandInput.disabled = true;
        auditBtn.textContent = 'Scanning the engines…';
      } else {
        auditBtn.disabled = false;
        brandInput.disabled = false;
        auditBtn.innerHTML = 'Check my visibility &rarr;';
      }
    }

    function animateAuditScore(score) {
      var ring = document.getElementById('auditRingProgress');
      var circumference = 213.63; // 2 * PI * r(34), matches the SVG below
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

    // Engine ids as a visitor should read them. Same map as the app-side report
    // (AuditReport.tsx:57-59), extended with google_ai, which the FULL depth can
    // return. An unknown id falls through to the raw id rather than being
    // dropped, so a new engine is ugly rather than invisible.
    var ENGINE_LABEL = {
      chatgpt: 'ChatGPT', gemini: 'Gemini', claude: 'Claude',
      perplexity: 'Perplexity', meta: 'Meta AI', google_ai: 'Google AI Mode'
    };

    // The four states _score.js:124-139 can produce, in plain words.
    //
    // The state names themselves are jargon and MISSING in particular reads as
    // a tool failure, which is the exact misreading this whole change exists to
    // stop. The raw state is kept on data-state so the wording can change
    // without breaking a verifier that greps for it.
    //
    // 'unavailable' must keep the meaning it has everywhere else in the
    // product: BrandGEO could not reach that engine, and it is NOT a result
    // about the visitor's brand (_score.js:128-133, AuditReport.tsx:252-257).
    // It is excluded from the score, so it is never counted against them.
    var STATE_PHRASE = {
      know: 'names you',
      partial: 'names you sometimes',
      missing: 'did not name you',
      unavailable: 'could not be reached'
    };

    function engineChip(engine, state) {
      var phrase = STATE_PHRASE[state] || state;
      var muted = (state === 'unavailable');
      return '<span data-state="' + escapeHtml(state) + '"' +
        (muted ? ' title="We could not reach this engine during your audit. This is not a result about your brand."' : '') +
        ' style="font-family:var(--mono);font-size:var(--m);line-height:1.5;' +
        'color:var(--' + (muted ? 't3' : 't2') + ');border:1px solid var(--bd2);' +
        'border-radius:999px;padding:3px 9px;white-space:nowrap">' +
        escapeHtml(ENGINE_LABEL[engine] || engine) + ': ' + escapeHtml(phrase) +
        '</span>';
    }

    // The painkiller, rendered. Runs once the locked report lands and fills the
    // evidence block that renderAuditResult() left empty.
    //
    // Before 2026-08-14 this function existed only to write one sentence, because
    // only three fields were readable before the email step. The measured
    // consequence: 8 public audits ever, all scoring 0 with both engines
    // missing, all carrying 2 to 6 named competitors, and not one visitor was
    // ever shown a single name. A bare 0 with no evidence reads as a broken
    // tool. The same 0 next to the brands the engines named instead is a
    // diagnosis, and it is the only part of the output that differs from one
    // visitor to the next.
    function setAuditEvidence(rep) {
      var names = Array.isArray(rep.competitor_names) ? rep.competitor_names : [];
      var total = typeof rep.competitor_count === 'number' ? rep.competitor_count : names.length;
      var states = (rep.engine_states && typeof rep.engine_states === 'object') ? rep.engine_states : null;
      var wrap = document.getElementById('auditEvidence');
      var enginesEl = document.getElementById('auditEngines');
      var namesEl = document.getElementById('auditNames');

      if (enginesEl && states) {
        var ids = Object.keys(states);
        if (ids.length) {
          var chips = '';
          for (var i = 0; i < ids.length; i++) chips += engineChip(ids[i], states[ids[i]]);
          // The footnote is what keeps an outage on our side from being read as
          // a finding about the visitor. Never render the chips without it.
          var anyUnavailable = false;
          for (var j = 0; j < ids.length; j++) { if (states[ids[j]] === 'unavailable') anyUnavailable = true; }
          enginesEl.innerHTML =
            '<div style="display:flex;flex-wrap:wrap;gap:6px">' + chips + '</div>' +
            (anyUnavailable
              ? '<div style="font-family:var(--mono);font-size:var(--m);color:var(--t3);margin-top:6px;line-height:1.45">' +
                'An engine we could not reach is left out of the score, so it is not counted against you.</div>'
              : '');
          enginesEl.hidden = false;
        }
      }

      if (namesEl && names.length) {
        var shown = [];
        for (var k = 0; k < names.length; k++) shown.push(escapeHtml(names[k]));
        var more = total > names.length ? ', and ' + (total - names.length) + ' more' : '';
        namesEl.innerHTML =
          '<div style="font-family:var(--mono);font-size:var(--m);color:var(--t3);' +
            'text-transform:uppercase;letter-spacing:.08em;margin-bottom:5px">' +
            (total === 1 ? 'Named in an answer where you were not' : 'Named in answers where you were not') +
          '</div>' +
          '<div style="font-size:var(--b);font-weight:600;color:var(--ac-text);line-height:1.5">' +
            shown.join(', ') + more +
          '</div>';
        namesEl.hidden = false;
      }

      if (wrap && ((states && Object.keys(states).length) || names.length)) wrap.hidden = false;
      setAuditGap(rep, names.length);
    }

    // The one line that says what the email actually buys. It had to be
    // rewritten: the old wording promised that the full report would be where
    // the competitor names are, and that became false the moment the names
    // moved in front of the gate. A promise the next screen does not keep is
    // worse than no promise. What the gated report genuinely adds is the join
    // (which buyer question, on which engine) plus the answer text, which exists
    // on no other surface in the funnel.
    function setAuditGap(rep, nameCount) {
      var el = document.getElementById('auditGap');
      if (!el) return;
      var n = typeof rep.gap_count === 'number' ? rep.gap_count : null;
      var where = rep.category ? ' in ' + rep.category : '';
      var msg;
      if (nameCount > 0) {
        msg = 'The full breakdown shows which buyer question produced each name, which engine answered it, and the wording the engine used.';
      } else if (n === null) {
        msg = 'Scored across the engines your customers ask' + where + '.';
      } else if (n === 0) {
        msg = 'No blocking gaps found' + where + '. The full breakdown shows what is holding the score back.';
      } else if (n === 1) {
        msg = 'One gap is holding this score down' + where + '. The full breakdown names the question and the engine behind it.';
      } else {
        msg = n + ' gaps are holding this score down' + where + '. The full breakdown names the question and the engine behind each one.';
      }
      if (rep.low_confidence) msg += ' Confidence is low on this one, the engines returned little to read.';
      el.textContent = msg;
    }

    function renderAuditResult(domain, score, token, category) {
      score = Math.max(0, Math.min(100, Math.round(score)));
      showSlot('result');

      // A true zero has to read as a FINDING, not as a failure.
      //
      // Measured 2026-08-14: all 8 public audits ever run scored 0, and the
      // zeros are truthful (the brand strings appear nowhere in the stored
      // engine_results). The screening audit asks generic category questions
      // and a small brand is essentially never named in the answer to one, so
      // "0" is the normal result for the whole segment this funnel is aimed at.
      // Printing "You're at 0/100 AI Visibility" and nothing else made the
      // correct answer look like a broken instrument.
      //
      // The claim below is derivable from the score alone, so it can be made on
      // this first render, before get-audit-report answers. computeAuditScore
      // (_score.js:85-92) is a positively-weighted sum of six non-negative
      // dimensions, so aiScore === 0 forces reach === 0, and reach is the share
      // of ANSWERING engines that mentioned the brand (_score.js:70-74).
      // audit-domain.js:241-250 refuses to publish an audit where no engine
      // answered, so the denominator is never zero on a published row.
      // Therefore ai_score 0 means: every engine that answered, answered
      // without naming you. No softening, no encouragement, and nothing
      // asserted that the number does not already prove.
      var headline = score === 0
        ? '<span id="auditScoreInline">0</span>/100. You were not named in any answer we collected.'
        : 'You&#39;re at <span id="auditScoreInline">0</span>/100 AI Visibility';
      // The email row inside the result is now the next step, so the hero
      // button steps down to "check another domain".
      auditBtn.classList.add('is-secondary');
      auditBtn.innerHTML = 'Check another &rarr;';
      auditResult.innerHTML =
        '<div class="audit-result-top">' +
          '<div class="audit-ring-wrap">' +
            '<svg viewBox="0 0 88 88" style="transform:rotate(-90deg)" aria-hidden="true">' +
              '<circle cx="44" cy="44" r="34" fill="none" stroke="var(--bd2)" stroke-width="6"></circle>' +
              '<circle id="auditRingProgress" cx="44" cy="44" r="34" fill="none" stroke="url(#auditScoreGrad)" stroke-width="6" ' +
                'stroke-dasharray="213.63" stroke-dashoffset="213.63" stroke-linecap="round"></circle>' +
              '<defs><linearGradient id="auditScoreGrad" x1="0%" y1="0%">' +
                '<stop offset="0%" stop-color="#c4b5fd"></stop><stop offset="100%" stop-color="#6d28d9"></stop>' +
              '</linearGradient></defs>' +
            '</svg>' +
            '<div class="audit-ring-num" id="auditRingNum">0</div>' +
          '</div>' +
          '<div>' +
            '<div class="audit-headline">' + headline + '</div>' +
            '<div class="audit-domain">' + escapeHtml(domain) + '</div>' +
          '</div>' +
        '</div>' +
        // Filled in by setAuditEvidence() once get-audit-report answers: the
        // per-engine verdict chips and the deduplicated competitor names.
        //
        // Styled inline, deliberately. Every class this card uses is defined in
        // index.html's inline stylesheet, which this file does not own and which
        // another change is editing in parallel; a new class name here would be
        // a rule that does not exist yet on the live page. These elements
        // therefore style themselves from the existing custom properties
        // (--mono, --m, --b, --t2, --t3, --bd2, --ac-text) and introduce no new
        // font size and no status colour, so the six-size type system and the
        // fold colour budget both hold. If a later pass moves these into
        // index.html as real classes, delete the style attributes here.
        '<div id="auditEvidence" style="margin:12px 0 0" hidden>' +
          '<div id="auditEngines" style="margin-bottom:10px" hidden></div>' +
          '<div id="auditNames" style="border:1px solid var(--bd2);border-radius:10px;padding:10px 12px" hidden></div>' +
        '</div>' +
        // Filled in by setAuditGap() once get-audit-report answers. Starts with
        // the category the audit classified the domain into, which is already
        // known and is better than an empty box.
        '<div class="audit-gap" id="auditGap">' +
          (category ? 'Scored against the brands AI names in ' + escapeHtml(category) + '.'
                    : 'Scored across the engines your customers ask.') +
        '</div>' +
        '<form class="audit-email-row" id="auditEmailForm" novalidate>' +
          '<input type="email" id="auditEmail" placeholder="you@company.com" aria-label="Your email" required>' +
          // "Show me", not "Email me". No email is sent on unlock and none ever
          // was; see the AUDIT_REPORT_URL note above. The label now describes
          // what the button does. If the unlock email is ever built, this and
          // the success copy below are the two strings to change back.
          '<button type="submit" class="audit-email-btn">Show me the full breakdown &rarr;</button>' +
        '</form>' +
        // "One-time report" implied a delivery. The report opens in the browser
        // instead, so say that. The no-spam line stays true: the address is
        // kept as a lead (prospect_leads), it is simply not mailed a report.
        '<div class="audit-fine-print">Opens in your browser. No spam, unsubscribe any time.</div>' +
        // The forward step the success path never had (C1b, funnel audit F3).
        // redirectToSignup() was called from exactly one place in this file, the
        // error handler inside startAudit(), so a visitor whose audit FAILED was
        // carried to signup with their domain prefilled while a visitor whose
        // audit SUCCEEDED reached a dead end. The better the product performed,
        // the less it invited anyone to do.
        //
        // It sits on the RESULT card rather than inside the unlock-success
        // block, which is where the eye is but not where a link survives: that
        // block navigates to the report after 900ms (see the unlock handler
        // below), so anything rendered beside it is gone before it can be read.
        // Here it stays on screen for as long as the visitor is deciding, next
        // to the report CTA, which is the moment the score has just landed.
        // The report page carries the same step afterwards (AuditReport.tsx).
        // "Start a free account", NOT "continuous tracking". This link goes to
        // free signup, and the Free tier is one engine, five prompts, and a
        // manual refresh (planConfig.ts PLAN_ENGINES.free, PLAN_PROMPTS.free,
        // refresh_cadence DEFAULT 'manual'). Continuous multi-engine monitoring
        // is what a plan adds, so promising it above a free-signup button would
        // be a claim the product does not keep at the exact moment someone
        // decides to trust it.
        '<div class="audit-forward">Or ' +
          '<a class="audit-forward-link" href="' + signupUrl(domain) + '">' +
          'start a free account for ' + escapeHtml(domain) + ' &rarr;</a>' +
        '</div>' +
        '<div class="audit-status is-error" id="auditEmailError" hidden></div>';

      animateAuditScore(score);

      // Below 900px the evidence card sits under the field, so bring the
      // answer into view rather than leaving it just off screen.
      if (window.innerWidth < 900 && auditResult.scrollIntoView) {
        auditResult.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }

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
          body: JSON.stringify({ token: token, email: email, honeypot: '' })
        }, AUDIT_UNLOCK_TIMEOUT_MS).then(function(res) {
          if (!res.ok) throw new Error('unlock failed');
          return res.json();
        }).then(function(data) {
          // Hand over the report the visitor just unlocked. Announce, then move,
          // matching the pattern the failure path already uses at the bottom of
          // this file so a full-page navigation never arrives unannounced.
          //
          // The link is rendered as well as followed, deliberately: it survives
          // a blocked navigation, a slow connection, and a visitor who wants to
          // open it in a new tab. Never replace it with the redirect alone.
          //
          // `token` is the one from the audit that is already in scope; the
          // response echoes it back (unlock-audit-report.js:63) and is preferred
          // only so a future server-side token rotation cannot break this.
          var reportToken = (data && data.token) || token;
          var reportUrl = AUDIT_REPORT_URL + encodeURIComponent(reportToken);
          auditResult.innerHTML =
            '<div class="audit-success">Your full AI Visibility report for ' +
            '<strong>' + escapeHtml(domain) + '</strong> is ready. ' +
            '<a class="audit-success-link" href="' + reportUrl + '">Open it now &rarr;</a></div>';
          setTimeout(function() { window.location.href = reportUrl; }, 900);
        }).catch(function() {
          // Must match the label rendered above, or a failed attempt silently
          // rewrites the button to a promise the product does not keep.
          if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Show me the full breakdown →'; }
          if (errEl) {
            errEl.textContent = 'Something went wrong sending that. Try again, or start your full audit instead.';
            errEl.hidden = false;
          }
        });
      });
    }

    function startAudit() {
      var val = brandInput.value.trim();
      if (auditHp && auditHp.value) return; // honeypot tripped -- silently drop
      if (val.length < 2) {
        // Was a silent focus() with no message, which reads as a dead button.
        setAuditStatus('Enter your domain, for example yourcompany.com', true);
        brandInput.focus();
        return;
      }
      if (getAuditAttempts().length >= AUDIT_RATE_MAX) {
        setAuditStatus('You’ve checked a few brands already. Try again in a few minutes, or start your full audit now.', true);
        return;
      }
      setAuditStatus('');
      auditResult.innerHTML = '';
      auditBtn.classList.remove('is-secondary');
      showSlot('skeleton');
      startSkeletonProgress();
      setButtonScanning(true);
      recordAuditAttempt();

      fetchWithTimeout(AUDIT_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: val, honeypot: '' })
      }, AUDIT_TIMEOUT_MS).then(function(res) {
        // 400 and 429 carry a message written for the visitor (a bad domain, a
        // per-IP limit, the monthly cap). Those are answers, not outages, so
        // they are shown rather than treated as "endpoint down".
        if (res.status === 400 || res.status === 429) {
          return res.json().catch(function() { return {}; }).then(function(d) {
            var e = new Error('handled'); e.handled = true;
            e.userMessage = (d && d.error) || 'That domain could not be checked. Try another.';
            throw e;
          });
        }
        if (!res.ok) throw new Error('audit endpoint not reachable');
        return res.json();
      }).then(function(data) {
        var teaser = data && data.teaser;
        var score = teaser && teaser.ai_score;
        if (typeof score !== 'number') {
          // 'collecting' should not reach a public caller, which is forced to
          // screening depth, but if it ever does this widget cannot wait for it.
          throw new Error('unexpected audit response shape');
        }
        setButtonScanning(false);
        renderAuditResult(val, score, data.token, teaser.category);
        // Second call: the evidence. The score and the domain are already on
        // screen, so a failure here degrades to the card as it looked before
        // 2026-08-14 rather than breaking anything. It is not retried: this
        // endpoint is a plain read of a row that has already been written, and
        // a retry loop on the public path is a rate-limit surface for no gain.
        fetchWithTimeout(AUDIT_REPORT_ENDPOINT + '?token=' + encodeURIComponent(data.token || ''), {
          method: 'GET'
        }, AUDIT_REPORT_TIMEOUT_MS).then(function(r) {
          return r.ok ? r.json() : null;
        }).then(function(rep) {
          if (rep && rep.status === 'ready') setAuditEvidence(rep);
        }).catch(function() { /* score stands on its own */ });
      }).catch(function(err) {
        if (err && err.handled) {
          setButtonScanning(false);
          showSlot('card');
          setAuditStatus(err.userMessage, true);
          brandInput.focus();
          return;
        }
        // The audit endpoint errored, timed out, or answered in a shape this
        // widget does not recognise. Fall back to the pre-existing flow rather
        // than leaving the visitor stuck on a dead button.
        //
        // This is a failure path INSIDE the primary CTA, not a second CTA, so
        // it is never offered as a choice (hook-thesis-web.md §3). The skeleton
        // holds and one line explains the handoff, so a full-page redirect does
        // not arrive unannounced.
        setButtonScanning(false);
        var sk = document.getElementById('skLabel');
        if (sk) sk.textContent = 'Taking you to the full audit for ' + val;
        setAuditStatus('Taking you to the full audit…');
        setTimeout(function() { redirectToSignup(val); }, 600);
      });
    }

    auditBtn.addEventListener('click', startAudit);
    brandInput.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') startAudit();
    });

    // Arriving from a "test your website for free" button on any other page.
    // The browser has already scrolled to #free-audit by the time this runs;
    // all that is left is to put the caret in the field, so the visitor can
    // type instead of hunting for it. focus() is deliberately deferred: on
    // iOS Safari, focusing during the hash jump cancels the scroll.
    function focusAuditFromHash() {
      if (window.location.hash !== '#free-audit') return;
      setTimeout(function() {
        try { brandInput.focus({ preventScroll: true }); } catch (err) { brandInput.focus(); }
      }, 400);
    }
    focusAuditFromHash();
    window.addEventListener('hashchange', focusAuditFromHash);
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

  // Animated score ring + counting number on the hero evidence card.
  //
  // Delayed 900ms on purpose (docs/design/homepage-hook.md §7): its job is to
  // move the eye to the evidence AFTER the headline and the domain field have
  // landed, not to compete with them in the first second. The dimension bars
  // are no longer in this card -- they live in proof block 2 and animate on
  // their own observer below, when that block is actually reached.
  var reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
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
        var duration = 900;
        var step = function(ts) {
          if (!start) start = ts;
          var progress = Math.min((ts - start) / duration, 1);
          numEl.textContent = Math.round(progress * target);
          if (progress < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      }
    };
    if (reducedMotion) {
      // Respect the user's preference: set final values instantly, no animation.
      var ring0 = document.getElementById('scoreRingProgress');
      if (ring0) ring0.style.strokeDashoffset = ring0.getAttribute('data-target-offset');
      var num0 = document.getElementById('scoreNum');
      if (num0) num0.textContent = num0.getAttribute('data-target');
    } else if ('IntersectionObserver' in window) {
      var previewIO = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
          if (entry.isIntersecting) {
            setTimeout(animatePreview, 900);
            previewIO.unobserve(entry.target);
          }
        });
      }, { threshold: 0.3 });
      previewIO.observe(previewWrap);
    } else {
      animatePreview();
    }
  }

  // Proof block 2: the six dimension bars fill when that block is reached.
  var dimsBox = document.querySelector('.preview-dims-box');
  if (dimsBox) {
    var fillDims = function() {
      dimsBox.querySelectorAll('.dim-fill[data-w]').forEach(function(bar) {
        var w = bar.getAttribute('data-w');
        requestAnimationFrame(function() { bar.style.width = w + '%'; });
      });
    };
    if (reducedMotion || !('IntersectionObserver' in window)) {
      dimsBox.querySelectorAll('.dim-fill[data-w]').forEach(function(bar) {
        bar.style.width = bar.getAttribute('data-w') + '%';
      });
    } else {
      var dimsIO = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
          if (entry.isIntersecting) { fillDims(); dimsIO.unobserve(entry.target); }
        });
      }, { threshold: 0.3 });
      dimsIO.observe(dimsBox);
    }
  }

  // Mouse-reactive parallax tilt on the "what you get" preview card.
  // Desktop pointer devices only (hover + fine pointer), and only if the
  // user hasn't asked for reduced motion - touch devices and reduced-motion
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

  // The "live" activity ticker was removed from the hero on 2026-07-26. It
  // announced events ("ChatGPT mentioned your brand, 2 min ago") that had not
  // happened to the visitor reading them, and it was a tenth competing element
  // in a three-second window. docs/design/homepage-hook.md §3.5.

  // Engine chip tooltips (hero, index.html only) - hover (desktop) or tap
  // (touch/keyboard) reveals a short, clearly-labelled illustrative example
  // of how that engine's mentions read. This is representative example
  // content, the same convention already used by the sentiment quotes and
  // the "live" ticker elsewhere on this page - not a live claim about the
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
      // Back out of the accessibility tree. It is about to be emptied, and a
      // role="tooltip" with no accessible name is an audit failure as well as
      // a genuinely useless node for a screen reader.
      engineTooltip.setAttribute('aria-hidden', 'true');
      if (activeChip) {
        activeChip.classList.remove('is-active');
        activeChip.setAttribute('aria-expanded', 'false');
        activeChip.removeAttribute('aria-describedby');
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
      // Now that it carries text it has an accessible name, so it can join the
      // accessibility tree and be pointed at as the chip's description.
      engineTooltip.setAttribute('aria-hidden', 'false');
      if (activeChip && activeChip !== chip) {
        activeChip.classList.remove('is-active');
        activeChip.removeAttribute('aria-describedby');
      }
      activeChip = chip;
      chip.classList.add('is-active');
      chip.setAttribute('aria-expanded', 'true');
      chip.setAttribute('aria-describedby', 'engineTooltip');
      // getBoundingClientRect() forces a synchronous layout, so the size we
      // read back here already reflects the innerHTML set just above -
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

  // ── Contract gate before checkout (index.html pricing) ─────────────────────
  //
  // THE STRIPE LINKS USED TO BE HERE AND ARE GONE ON PURPOSE (ROADMAP Stream C,
  // C3, 2026-07-31). A STRIPE_LINKS map held all six payment URLs and
  // applyCheckoutLinks() wrote them onto every Subscribe button on load. That
  // shipped the destination to every visitor, which meant no gate in front of
  // those buttons could ever have been more than a suggestion: the URL was in
  // the page, readable from view-source, reachable from an old bookmark, and
  // reachable with JavaScript switched off.
  //
  // The links now live in netlify/functions/_terms_gate.js and are issued, one
  // at a time, by accept-terms.js in response to a request that carries an
  // acceptance, which that endpoint records before it answers. So the tick box
  // below is not the gate. The gate is that this file does not know where
  // Stripe is. Never reintroduce a checkout URL here.
  //
  // The Subscribe buttons keep their index.html href to the signup page, which
  // is what a visitor with no JavaScript gets: a free account, not a payment
  // page. Managed and Custom Enterprise carry no data-checkout at all and stay
  // on #contact, sales-assisted by design.
  var CHECKOUT_ENDPOINT = 'https://app.getbrandgeo.com/.netlify/functions/accept-terms';
  var CHECKOUT_TIMEOUT_MS = 12000;

  // Must match TERMS_VERSION in _terms_gate.js, which refuses any acceptance
  // that does not. That refusal is deliberate: it is what stops a tab opened
  // before a contract update from accepting terms nobody was shown. When
  // terms.html's effective date changes, all three change together.
  var TERMS_VERSION = '2026-07-13';

  // Display names only. No prices: those live in the pricing cards and in
  // Stripe, and a third copy here would be a fourth place for them to drift.
  // `radar` added 2026-07-31, once its Stripe price and payment link existed.
  // This map is what decides whether the contract gate offers a plan at all: a
  // key that is absent here makes the Subscribe button fall through to plain
  // /signup, which is exactly how Radar's card shipped earlier today, on
  // purpose, while there was nothing to sell.
  var PLAN_LABELS = { radar: 'Radar', essentials: 'Essentials', growth: 'Growth', growth_pro: 'Growth PRO' };

  // Plans sold on ONE period only, so the billing toggle must not be applied to
  // them. Found live 2026-08-02: with the toggle on yearly, clicking Radar's
  // Subscribe sent period 'annual' to accept-terms, and Radar has no annual
  // price on any account and never has. The gate correctly refused with
  // `no_link` and the visitor was told to contact us, on the cheapest tier and
  // therefore the likeliest first purchase anyone makes.
  //
  // It looked like a broken checkout and it was a period the product does not
  // sell. Not caused by the Stripe account migration: the same click failed the
  // same way on the old account.
  //
  // Sending 'monthly' regardless is honest rather than a papering-over: Radar's
  // pricing card carries no .billing-yearly element at all, so it displays
  // EUR 29/mo whatever the toggle says. The visitor is sent to a checkout for
  // exactly the price they were shown.
  //
  // If Radar ever gets an annual price, delete its entry here IN THE SAME
  // COMMIT that adds the price and the payment link, or this silently caps it
  // at monthly forever.
  var MONTHLY_ONLY_PLANS = ['radar'];

  // Hoisted out of the billing toggle below, where it used to be a local. The
  // gate has to know which period the visitor is looking at at the moment they
  // click Subscribe, and the toggle is the only thing that knows.
  var billingYearly = false;

  (function initContractGate() {
    var gate = document.getElementById('termsGate');
    if (!gate) return;   // not the pricing page

    var planEl     = document.getElementById('termsGatePlan');
    var versionEl  = document.getElementById('termsGateVersion');
    var acceptEl   = document.getElementById('termsGateAccept');
    var continueEl = document.getElementById('termsGateContinue');
    var cancelEl   = document.getElementById('termsGateCancel');
    var errEl      = document.getElementById('termsGateError');
    // The redesigned notice (index.html, 2026-07-31) wraps setError's message
    // in an icon + text row rather than one bare paragraph, so the message
    // now targets this inner span. errEl.textContent would also erase the
    // icon svg, since textContent replaces all children of the node it is
    // set on.
    var errTextEl  = document.getElementById('termsGateErrorText');
    if (!planEl || !acceptEl || !continueEl || !cancelEl || !errEl || !errTextEl) return;

    var pendingPlan = null;
    var lastFocused = null;
    var busy = false;

    // Local, deliberately. escapeHtml() and fetchWithTimeout() further up this
    // file are declared inside `if (brandInput && auditBtn && auditResult)`, so
    // they exist only on a page that has the audit widget AND only after that
    // block has run. Borrowing them would make the checkout path depend on the
    // hero widget being present, which is a coupling nobody would expect and
    // that fails silently as an undefined function at the moment someone tries
    // to pay.
    function gateFetch(url, opts, ms) {
      var ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
      if (ctrl) opts.signal = ctrl.signal;
      var timer = setTimeout(function() { if (ctrl) ctrl.abort(); }, ms);
      return fetch(url, opts).then(function(res) {
        clearTimeout(timer);
        return res;
      }, function(e) {
        clearTimeout(timer);
        throw e;
      });
    }

    versionEl.textContent = 'Terms version ' + TERMS_VERSION + '. A copy is recorded with your subscription.';

    function setError(msg) {
      errTextEl.textContent = msg || '';
      errEl.hidden = !msg;
    }

    function closeGate() {
      if (busy) return;   // never yank the panel out from under an in-flight request
      gate.hidden = true;
      pendingPlan = null;
      acceptEl.checked = false;
      continueEl.disabled = true;
      continueEl.textContent = 'Continue to payment';
      setError('');
      if (lastFocused && lastFocused.focus) lastFocused.focus();
    }

    function openGate(plan, trigger) {
      pendingPlan = plan;
      lastFocused = trigger || null;
      acceptEl.checked = false;
      continueEl.disabled = true;
      setError('');
      // Built with textContent rather than an HTML string. Every value here is
      // a constant from PLAN_LABELS, so nothing needs escaping today; doing it
      // this way means nothing will need escaping if a future value ever stops
      // being a constant.
      planEl.textContent = 'You are subscribing to ';
      var planName = document.createElement('strong');
      planName.textContent = PLAN_LABELS[plan];
      planEl.appendChild(planName);
      planEl.appendChild(document.createTextNode(', billed ' + (billingYearly ? 'yearly' : 'monthly') + '.'));
      gate.hidden = false;
      acceptEl.focus();
    }

    // The disabled button is a courtesy, not the gate: the server refuses an
    // unaccepted request whatever this checkbox says.
    acceptEl.addEventListener('change', function() {
      continueEl.disabled = !acceptEl.checked;
      if (acceptEl.checked) setError('');
    });

    cancelEl.addEventListener('click', closeGate);
    gate.addEventListener('click', function(e) { if (e.target === gate) closeGate(); });
    document.addEventListener('keydown', function(e) {
      if (gate.hidden) return;
      if (e.key === 'Escape') { closeGate(); return; }

      // Focus trap. The panel is role="dialog" aria-modal="true", which tells a
      // screen reader the rest of the page is inert; without this, Tab walks out
      // of the panel and behind a 78% scrim, so the focus ring is visible on
      // content that is not. On the last screen before payment, and the screen
      // where a legal acceptance is captured, that is worth the twelve lines.
      if (e.key !== 'Tab') return;
      var focusable = gate.querySelectorAll('a[href], button:not([disabled]), input:not([disabled])');
      if (!focusable.length) return;
      var first = focusable[0];
      var last = focusable[focusable.length - 1];
      // Covers the case where focus is somewhere outside the panel entirely,
      // which is what happens on the very first Tab if the browser restored
      // focus elsewhere.
      if (!gate.contains(document.activeElement)) {
        e.preventDefault();
        first.focus();
        return;
      }
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    });

    continueEl.addEventListener('click', function() {
      if (!pendingPlan || !acceptEl.checked || busy) return;
      busy = true;
      continueEl.disabled = true;
      continueEl.textContent = 'Opening checkout…';
      setError('');

      gateFetch(CHECKOUT_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: pendingPlan,
          // See MONTHLY_ONLY_PLANS. The toggle is global, so it applies to a
          // card that never offered a yearly price unless it is excluded here.
          period: (MONTHLY_ONLY_PLANS.indexOf(pendingPlan) > -1 || !billingYearly) ? 'monthly' : 'annual',
          accepted: true,
          accepted_version: TERMS_VERSION,
          honeypot: ''
        })
      }, CHECKOUT_TIMEOUT_MS).then(function(res) {
        return res.json().catch(function() { return {}; }).then(function(data) {
          return { ok: res.ok, status: res.status, data: data };
        });
      }).then(function(r) {
        if (r.ok && r.data && r.data.url) {
          window.location.href = r.data.url;
          // The page is going away, so the busy state is correct for the next
          // few hundred milliseconds. But a navigation can be blocked, refused
          // by an extension, or simply slow, and `busy` also gates closeGate():
          // leaving it set would freeze the panel with Cancel AND Escape both
          // inert, in front of a visitor who is trying to pay.
          //
          // So `busy` is released, which restores Cancel and Escape, but the
          // Continue button is NOT re-enabled. Re-enabling it would let a second
          // click through, and every click writes a terms_acceptances row, so a
          // slow navigation would record the same buyer accepting twice and make
          // "no matched_at means abandoned" untrue. Closing and reopening is the
          // retry, and it produces exactly one fresh acceptance.
          setTimeout(function() {
            busy = false;
            continueEl.textContent = 'Checkout opened';
            setError('If the payment page did not open, close this and try again.');
          }, 4000);
          return;
        }
        busy = false;
        continueEl.textContent = 'Continue to payment';
        continueEl.disabled = !acceptEl.checked;
        // A stale tab is the one failure the visitor can actually fix, so it
        // gets its own message rather than the generic one.
        if (r.data && r.data.reason === 'version_mismatch') {
          setError('Our terms have been updated since this page loaded. Please refresh and accept the current version.');
        } else {
          setError('We could not open checkout just now. Please try again, or contact us and we will set it up with you.');
        }
      }).catch(function() {
        busy = false;
        continueEl.textContent = 'Continue to payment';
        continueEl.disabled = !acceptEl.checked;
        setError('We could not reach checkout just now. Please try again, or contact us and we will set it up with you.');
      });
    });

    document.querySelectorAll('[data-checkout]').forEach(function(el) {
      el.addEventListener('click', function(e) {
        var plan = el.getAttribute('data-checkout');
        // An unrecognised plan is left to the button's own href (signup) rather
        // than opening a panel that cannot lead anywhere.
        if (!Object.prototype.hasOwnProperty.call(PLAN_LABELS, plan)) return;
        e.preventDefault();
        openGate(plan, el);
      });
    });
  })();

  // Billing toggle (index.html only)
  var billingToggle = document.getElementById('billingToggle');
  if (billingToggle) {
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
      // No checkout links to swap any more: the period is read off billingYearly
      // at the moment Subscribe is clicked and sent to accept-terms.js, which
      // resolves it to a URL server-side. See the contract gate above.
    });
  }

  // ── Pricing path toggle (index.html only): self-serve vs done-for-you ──
  // Shows one 3-card grid at a time so the pricing section isn't a wall of 6
  // cards. Reuses the existing billing toggle above (which sets display on
  // ALL .billing-monthly/.billing-yearly globally), so the newly-shown grid
  // already reflects the current monthly/yearly state - no extra wiring.
  var modeBtns = document.querySelectorAll('.mode-btn[data-mode]');
  var gridSelf = document.getElementById('grid-self');
  var gridManaged = document.getElementById('grid-managed');
  var modeCaption = document.getElementById('modeCaption');
  if (modeBtns.length && gridSelf && gridManaged) {
    var MODE_CAPTIONS = {
      self: 'Run it yourself: subscribe, log in, and track your AI visibility. Upgrade, downgrade or cancel anytime.',
      managed: 'Done for you: our team runs the strategy, research and reporting. You get the results, not the busywork.'
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
  // untouched - the drawer uses display:contents, so it has no box of its
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
        // `:not(.logo)` added 2026-07-29, and it is load bearing. This rule
        // collapses the nav text links so the drawer above can own them. But
        // the header lockup is `<a class="logo">`, a direct child of <nav>,
        // so it matched `nav a:not(.nav-cta)` too and was hidden below 640px
        // on every page that loads this file: measured at 375px, .logo
        // computed display:none with a 0x0 box, leaving the phone header with
        // no mark and no wordmark. The drawer is unaffected, because .logo is
        // never collected into it (the collector only walks `nav > div`).
        // The static pages carry a byte-identical copy of this rule in their
        // own <style>; both copies need the guard, since this sheet is
        // appended later and would otherwise win the cascade tie on its own.
        'nav a:not(.nav-cta):not(.logo){display:none;}' +
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

// ── askmywebsiteai support assistant ──────────────────────────────────────
// Injected from here rather than pasted into all 76 html files, because every
// public page already loads site.js and one copy cannot drift from another.
// The vendor snippet reads its keys off document.currentScript.dataset, which
// resolves to this element while it executes, so setting the attributes before
// appending is equivalent to the static tag they document.
//
// This is the LANDING SITE's app. The dashboard runs a DIFFERENT one
// (app_e9a0360bb6095088, in brandgeo-dashboard/index.html). One app per host,
// each rejecting the other's origin, so never copy an id between the two.
//
// Requires the CSP allowances in .htaccess. Note the widget will not render
// until the app's config is PUBLISHED vendor-side; an unpublished app fails
// silently with one console line and no visible symptom.
(function() {
  if (document.querySelector('script[data-app-id]')) return;
  var s = document.createElement('script');
  s.async = true;
  s.src = 'https://app.askmywebsiteai.com/sdk.js';
  s.setAttribute('data-app-id', 'app_a16a65082c9e13c7');
  s.setAttribute('data-public-key', 'pk_live_352f98333e403138c8f2a64432ffe776');
  document.body.appendChild(s);
})();

// ── BrandGEO site chat assistant "Jamie" (ASSISTANT-SPEC.md) ──────────────
// Self-contained: floating launcher + panel, injected on every page that loads
// this script. Talks to two PUBLIC Netlify functions on app.getbrandgeo.com
// (assistant / assistant-lead). Uses the site's own CSS custom properties so it
// inherits dark/light theme automatically; no per-page HTML edits needed.
//
// RETIRING: Jamie is being handed over to the askmywebsiteai assistant above,
// and will be recalibrated for outbound/inbound lead work instead. Flip
// JAMIE_RETIRED to true to take it off the site. It is deliberately still
// false: Jamie is the only lead capture on the public site (its "Talk to a
// human" form posts to assistant-lead), and the askmywebsiteai app above is
// not publishing its config yet, so retiring Jamie today would leave
// getbrandgeo.com with no assistant and no lead capture at all. Flip this the
// moment the vendor config goes live, not before.
var JAMIE_RETIRED = false;

(function() {
  if (JAMIE_RETIRED) return;
  if (!window.fetch || document.getElementById('bg-asst-launcher')) return;

  var ASSISTANT_ENDPOINT = 'https://app.getbrandgeo.com/.netlify/functions/assistant';
  var LEAD_ENDPOINT      = 'https://app.getbrandgeo.com/.netlify/functions/assistant-lead';
  var SIGNUP_URL   = 'https://app.getbrandgeo.com/signup';
  var SUPPORT_URL  = 'https://getbrandgeo.com/support.html';
  var PRIVACY_URL  = 'https://getbrandgeo.com/privacy.html';
  var SUPPORT_EMAIL = 'support@getbrandgeo.com';
  var TIMEOUT_MS = 22000;
  var SESSION_MSG_CAP = 30; // soft client-side cap; the server enforces the real one

  // Engine list corrected 2026-08-07: this greeting still named Meta AI, which
  // planConfig.ts records as RETIRED 2026-07-16, and omitted Google AI Mode,
  // Google AI Overviews and Grok, all live. Named engines here must track
  // LIVE_ENGINES in brandgeo-dashboard/src/lib/planConfig.ts, never memory.
  var WELCOME = "Hi, I'm Jamie, BrandGEO's assistant. I can show you how your brand appears across up to seven AI engines, from ChatGPT, Gemini and Claude to Grok and Google AI Overviews, walk you through pricing, run a free audit, or connect you with our team. What can I help with?";
  var OPENING_CHIPS = [
    { label: '💶 See pricing',       send: 'What does BrandGEO cost?' },
    { label: '🔍 Run a free audit',  send: 'I want to run a free audit.' },
    { label: '📞 Talk to sales',     send: 'I want to talk to sales.' },
    { label: "🛟 I'm a customer",    send: "I'm an existing customer and need support." }
  ];

  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var history = [];   // [{role,content}] sent to the assistant endpoint
  var sentCount = 0, busy = false, lastFocus = null;
  // Once the assistant classifies the conversation "hot" (strong buying signal),
  // we latch this and echo it back on every later request + on lead capture, so
  // the server bumps to the senior model and the lead is flagged HOT for the team.
  var hot = false;
  var launcher, panel, msgs, composer, ta, sendBtn, chipsRow, greeted = false;

  function esc(s){ return String(s).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
  function el(tag, cls, txt){ var e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }
  function scrollDown(){ if (msgs) msgs.scrollTop = msgs.scrollHeight; }

  // Strip the markdown the model can still emit (bold, inline code, headings,
  // bullet markers) - the chat bubble renders plain text (white-space:pre-wrap),
  // so raw ** / # / - would otherwise show as literal symbols. Line breaks are
  // preserved; bullets collapse to a clean "• ".
  function tidyMarkdown(text){
    return String(text)
      .replace(/\*\*(.+?)\*\*/g, '$1')     // **bold**
      .replace(/__(.+?)__/g, '$1')         // __bold__
      .replace(/`([^`]+)`/g, '$1')         // `code`
      .replace(/^\s{0,3}#{1,6}\s+/gm, '')  // # headings
      .replace(/^\s*[-*]\s+/gm, '• ');// "- item" / "* item" -> "• item"
  }

  // Escape text and turn bare URLs into safe new-tab links.
  function fillText(node, text){
    var re = /(https?:\/\/[^\s<>()]+[^\s<>().,!?])/g, idx = 0, m;
    text = tidyMarkdown(text);
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

  function delay(ms){ return new Promise(function(r){ setTimeout(r, ms); }); }

  // Ask the assistant, retrying ONCE on a failed / empty response before giving
  // up. The common failure here is a cold start or a just-deployed function
  // returning a transient non-JSON error; the retry hits a now-warm function and
  // succeeds, so a real hiccup never surfaces the fallback on the first click.
  function requestReply(attemptsLeft){
    return fetchJson(ASSISTANT_ENDPOINT, { messages: history, hot: hot }).then(function(res){
      var d = res.data || {};
      if (typeof d.reply === 'string' && d.reply) return { res: res, d: d };
      if (attemptsLeft > 0) return delay(1200).then(function(){ return requestReply(attemptsLeft - 1); });
      return { res: res, d: {} };
    }).catch(function(e){
      if (attemptsLeft > 0) return delay(1200).then(function(){ return requestReply(attemptsLeft - 1); });
      throw e;
    });
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
  // timeout, error). Never dead-ends the visitor - offers the core paths right
  // in the widget so they can still run the free audit, see pricing, or reach a
  // human without leaving the page.
  function fallbackHelp(){
    addBubble('assistant', "I'm having a brief hiccup on my end, but I can still point you the right way:");
    var wrap = el('div', 'bg-asst-msg bg-asst-assistant');
    var box = el('div', 'bg-asst-actions');
    var audit = el('a', 'bg-asst-btn', 'Run my free audit →');
    audit.href = SIGNUP_URL; audit.target = '_blank'; audit.rel = 'noopener noreferrer';
    var price = el('a', 'bg-asst-btn bg-asst-btn-sec', 'See pricing');
    price.href = 'https://getbrandgeo.com/#pricing'; price.target = '_blank'; price.rel = 'noopener noreferrer';
    var human = el('button', 'bg-asst-btn bg-asst-btn-sec', 'Talk to a human'); human.type = 'button';
    human.addEventListener('click', function(){
      addBubble('assistant', 'Happy to connect you. Leave your details and the team will reach out.');
      showLeadForm('sales', null);
    });
    box.appendChild(audit); box.appendChild(price); box.appendChild(human);
    wrap.appendChild(box); msgs.appendChild(wrap); scrollDown();
  }

  function send(text){
    text = String(text || '').trim();
    if (!text || busy) return;
    if (sentCount >= SESSION_MSG_CAP) {
      addBubble('assistant', 'That’s a lot of questions. The best next step is to talk to the team at ' + SUPPORT_EMAIL + ', or tap “Talk to a human” below.');
      return;
    }
    if (chipsRow) { chipsRow.parentNode.removeChild(chipsRow); chipsRow = null; }
    addBubble('user', text);
    history.push({ role: 'user', content: text });
    sentCount++;
    busy = true; setBusy(true); showTyping();

    requestReply(1).then(function(out){
      hideTyping();
      var d = out.d || {};
      if (typeof d.reply === 'string' && d.reply) {
        if (out.res.ok && d.intent === 'hot') hot = true;   // latch: senior model + HOT lead from here on
        addBubble('assistant', d.reply);
        if (out.res.ok) history.push({ role: 'assistant', content: d.reply });
        if (out.res.ok && d.action) renderAction(d.action);
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
        reason: reason, domain: domain || '', honeypot: hp.value, hot: hot
      }).then(function(res){
        if (res.ok && res.data && res.data.ok) {
          row.removeChild(form);
          var ok = el('div', 'bg-asst-bubble');
          fillText(ok, 'Thanks, I’ve passed your details to the team. Someone will be in touch by email shortly.');
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
    launcher.setAttribute('aria-label', 'Chat with Jamie, the BrandGEO assistant');
    launcher.setAttribute('aria-expanded', 'false');
    launcher.innerHTML =
      '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>' +
      '<span class="bg-asst-launch-label">Ask Jamie</span>';
    // The pulse waits until the hero has left the viewport. An animated control
    // in the corner competes with the primary CTA during the three seconds the
    // hero has to land (docs/design/homepage-hook.md §3.5). Pages with no hero
    // pulse immediately, as before.
    if (!reduced) {
      var heroEl = document.querySelector('.hero');
      if (!heroEl || !('IntersectionObserver' in window)) {
        launcher.classList.add('bg-asst-pulse');
      } else {
        var pulseIO = new IntersectionObserver(function(entries) {
          entries.forEach(function(entry) {
            if (!entry.isIntersecting) {
              launcher.classList.add('bg-asst-pulse');
              pulseIO.disconnect();
            }
          });
        }, { threshold: 0 });
        pulseIO.observe(heroEl);
      }
    }
    launcher.addEventListener('click', open);

    // Panel
    panel = el('div', 'bg-asst-panel');
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');
    panel.setAttribute('aria-label', 'Jamie, the BrandGEO assistant');

    var head = el('div', 'bg-asst-head');
    head.appendChild(el('span', 'bg-asst-dot'));
    var titleWrap = el('div', 'bg-asst-titlewrap');
    titleWrap.appendChild(el('div', 'bg-asst-title', 'Jamie'));
    titleWrap.appendChild(el('div', 'bg-asst-sub', 'BrandGEO assistant · usually replies instantly'));
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
      addBubble('assistant', 'Happy to connect you. Leave your details and the team will reach out.');
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
      '.bg-asst-launcher{position:fixed;bottom:20px;right:20px;z-index:2147483000;display:inline-flex;align-items:center;gap:8px;padding:12px 18px;border:none;border-radius:999px;cursor:pointer;font:inherit;font-weight:600;font-size:.92rem;color:#fff;background:linear-gradient(135deg,var(--ac-strong),#6d28d9);box-shadow:0 10px 30px rgba(108,99,255,.42);transition:transform .18s ease,box-shadow .18s ease;}' +
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
      '.bg-asst-user .bg-asst-bubble{background:linear-gradient(135deg,var(--ac-strong),#6d28d9);color:#fff;border-bottom-right-radius:4px;}' +
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
