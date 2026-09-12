/* build: 2026-09-12 affiliate-track */
/**
 * affiliate-track.js: the client-side half of the BrandGEO affiliate module.
 * Loaded on every page of getbrandgeo.com (and usable on any other site that
 * runs a program: it has no BrandGEO-specific selectors).
 *
 * What it does, in order:
 *   1. Reads ?ref=<code>&bg_rid=<visit token>&ref_days=<days>&utm_campaign=<program>
 *      off the landing URL, which is what app.getbrandgeo.com/r/<program>/<code>
 *      redirects to.
 *   2. Keeps it for the program's attribution window. WITH analytics consent
 *      (localStorage 'bg-consent' from ga4-init.js, {analytics:true}) it is a
 *      first-party cookie `bg_ref`, so it survives the visitor closing the tab.
 *      WITHOUT consent it lives in sessionStorage only: this visit, nothing
 *      persistent, nothing cross-site. Accepting the banner later upgrades it.
 *   3. Injects hidden affiliate_ref / affiliate_visit / affiliate_program
 *      inputs into every <form>, appends the same values as query params to
 *      links into app.getbrandgeo.com (so /signup can carry them into the
 *      account), and adds them to the JSON body of the checkout request
 *      (accept-terms) so a Stripe payment can be tied back to the affiliate.
 *   4. Exposes window.BrandGEOAffiliate = { getRef, query, clear } for any
 *      page script that wants to read or forward it by hand.
 *
 * It decides nothing about money. The server validates every value again and
 * computes commissions from program rules. No IP, no fingerprint, no third
 * party. This file must stay CSP-clean (no inline eval, same origin only).
 */
(function () {
  'use strict';
  var COOKIE = 'bg_ref';
  var SESSION_KEY = 'bg_ref';
  var CONSENT_KEY = 'bg-consent';
  var DEFAULT_DAYS = 30;
  var MAX_DAYS = 365;
  var APP_HOST = 'app.getbrandgeo.com';
  var CODE_RE = /^[A-Z0-9][A-Z0-9_-]{2,31}$/;
  var TOKEN_RE = /^[A-Za-z0-9_-]{8,64}$/;
  var SLUG_RE = /^[a-z0-9][a-z0-9-]{1,39}$/;

  function hasConsent() {
    try {
      var raw = localStorage.getItem(CONSENT_KEY);
      if (!raw) return false;
      var c = JSON.parse(raw);
      return !!(c && c.analytics);
    } catch (e) { return false; }
  }

  function parse(search) {
    var q = new URLSearchParams(search || '');
    var code = String(q.get('ref') || '').trim().toUpperCase();
    var visit = String(q.get('bg_rid') || '').trim();
    var program = String(q.get('bg_prog') || q.get('utm_campaign') || '').trim().toLowerCase();
    var days = parseInt(q.get('ref_days') || '', 10);
    if (!(days > 0 && days <= MAX_DAYS)) days = DEFAULT_DAYS;
    var ref = {
      code: CODE_RE.test(code) ? code : null,
      visit: TOKEN_RE.test(visit) ? visit : null,
      program: SLUG_RE.test(program) ? program : null,
      at: Date.now(),
      days: days
    };
    return (ref.code || ref.visit) ? ref : null;
  }

  function valid(ref) {
    if (!ref || typeof ref !== 'object') return null;
    var out = {
      code: typeof ref.code === 'string' && CODE_RE.test(ref.code) ? ref.code : null,
      visit: typeof ref.visit === 'string' && TOKEN_RE.test(ref.visit) ? ref.visit : null,
      program: typeof ref.program === 'string' && SLUG_RE.test(ref.program) ? ref.program : null,
      at: typeof ref.at === 'number' ? ref.at : 0,
      days: typeof ref.days === 'number' && ref.days > 0 && ref.days <= MAX_DAYS ? ref.days : DEFAULT_DAYS
    };
    if (!out.at || (!out.code && !out.visit)) return null;
    var age = Date.now() - out.at;
    if (age < 0 || age > out.days * 86400000) return null;
    return out;
  }

  function readCookie() {
    var m = document.cookie.match(new RegExp('(?:^|; )' + COOKIE + '=([^;]*)'));
    if (!m) return null;
    try { return valid(JSON.parse(decodeURIComponent(m[1]))); } catch (e) { return null; }
  }
  function writeCookie(ref) {
    var exp = new Date(ref.at + ref.days * 86400000).toUTCString();
    var secure = location.protocol === 'https:' ? '; Secure' : '';
    document.cookie = COOKIE + '=' + encodeURIComponent(JSON.stringify(ref)) + '; Expires=' + exp + '; Path=/; SameSite=Lax' + secure;
  }
  function clearCookie() {
    document.cookie = COOKIE + '=; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/; SameSite=Lax';
  }
  function readSession() {
    try { return valid(JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null')); } catch (e) { return null; }
  }
  function writeSession(ref) {
    try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(ref)); } catch (e) { /* storage blocked */ }
  }

  function getRef() {
    return readCookie() || readSession();
  }

  function persist(ref) {
    if (!ref) return;
    writeSession(ref);
    if (hasConsent()) writeCookie(ref); else clearCookie();
  }

  function clear() {
    clearCookie();
    try { sessionStorage.removeItem(SESSION_KEY); } catch (e) { /* ignore */ }
  }

  function fields(ref) {
    var out = {};
    if (!ref) return out;
    if (ref.code) out.affiliate_ref = ref.code;
    if (ref.visit) out.affiliate_visit = ref.visit;
    if (ref.program) out.affiliate_program = ref.program;
    return out;
  }

  function query(ref) {
    ref = ref || getRef();
    if (!ref) return '';
    var parts = [];
    if (ref.code) parts.push('ref=' + encodeURIComponent(ref.code));
    if (ref.visit) parts.push('bg_rid=' + encodeURIComponent(ref.visit));
    if (ref.program) parts.push('bg_prog=' + encodeURIComponent(ref.program));
    parts.push('ref_days=' + ref.days);
    return parts.join('&');
  }

  function decorateLink(a) {
    var ref = getRef();
    if (!ref) return;
    var href = a.getAttribute('href');
    if (!href || href.indexOf(APP_HOST) === -1 || href.indexOf('ref=') !== -1) return;
    if (href.indexOf('/r/') !== -1) return; // never rewrite a referral link itself
    var url;
    try { url = new URL(href, location.href); } catch (e) { return; }
    if (url.hostname !== APP_HOST) return;
    var q = query(ref).split('&');
    for (var i = 0; i < q.length; i++) {
      var kv = q[i].split('=');
      url.searchParams.set(decodeURIComponent(kv[0]), decodeURIComponent(kv[1] || ''));
    }
    a.setAttribute('href', url.toString());
  }

  function injectForms() {
    var ref = getRef();
    if (!ref) return;
    var f = fields(ref);
    var forms = document.querySelectorAll('form');
    for (var i = 0; i < forms.length; i++) {
      var form = forms[i];
      for (var name in f) {
        if (!Object.prototype.hasOwnProperty.call(f, name)) continue;
        var existing = form.querySelector('input[name="' + name + '"]');
        if (existing) { existing.value = f[name]; continue; }
        var input = document.createElement('input');
        input.type = 'hidden';
        input.name = name;
        input.value = f[name];
        form.appendChild(input);
      }
    }
  }

  // Add the referral to the JSON body of the checkout gate call, whether the
  // page builds it as a relative or an absolute URL. Every other request is
  // passed through untouched.
  function patchFetch() {
    if (!window.fetch || window.fetch.__bgAffiliate) return;
    var orig = window.fetch;
    var patched = function (input, init) {
      try {
        var url = typeof input === 'string' ? input : (input && input.url) || '';
        if (url.indexOf('/.netlify/functions/accept-terms') !== -1 && init && typeof init.body === 'string') {
          var ref = getRef();
          if (ref) {
            var body = JSON.parse(init.body);
            var f = fields(ref);
            for (var k in f) if (Object.prototype.hasOwnProperty.call(f, k) && body[k] === undefined) body[k] = f[k];
            init = Object.assign({}, init, { body: JSON.stringify(body) });
          }
        }
      } catch (e) { /* never break checkout over attribution */ }
      return orig.call(this, input, init);
    };
    patched.__bgAffiliate = true;
    window.fetch = patched;
  }

  function init() {
    var incoming = parse(location.search);
    if (incoming) {
      // Last touch wins: a newer link replaces an older stored referral. This
      // mirrors the server's default; first-touch programs are settled server
      // side from the stored attribution, so nothing is lost by overwriting here.
      persist(incoming);
    } else {
      var stored = getRef();
      if (stored) persist(stored); // upgrades session -> cookie once consent exists
    }
    patchFetch();
    injectForms();
    var links = document.querySelectorAll('a[href*="' + APP_HOST + '"]');
    for (var i = 0; i < links.length; i++) decorateLink(links[i]);

    // Links and forms added after load (site.js builds some), plus consent
    // granted on this page: re-run cheaply on capture-phase clicks.
    document.addEventListener('click', function (e) {
      var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
      if (a) decorateLink(a);
      setTimeout(function () { var r = getRef(); if (r) persist(r); injectForms(); }, 0);
    }, true);
    document.addEventListener('submit', function (e) {
      if (e.target && e.target.tagName === 'FORM') injectForms();
    }, true);
  }

  window.BrandGEOAffiliate = { getRef: getRef, query: function () { return query(); }, clear: clear, fields: function () { return fields(getRef()); } };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
