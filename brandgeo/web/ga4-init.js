/* ga4-init.js: consent gate for Google Analytics. Rewritten 2026-07-29.
 *
 * WHAT THIS FILE USED TO DO, and why it was a problem:
 *
 *     window.dataLayer = window.dataLayer || [];
 *     function gtag(){dataLayer.push(arguments);}
 *     gtag('js', new Date());
 *     gtag('config', 'G-9H6C2NSYPH');
 *
 * Four lines, and gtag.js was loaded unconditionally from a script tag in the
 * head of all 79 pages. So GA4 set its _ga cookies and Google Signals fired a
 * google.es/ads/ga-audiences pixel on first paint, before the visitor was asked
 * anything, on a site whose own footer links to "GDPR Compliant" and whose
 * schema declares a Spanish company address. Under GDPR article 6 and the
 * ePrivacy rules Spain implements, analytics storage needs prior consent, and
 * the AEPD's guidance is one of the stricter readings in the EU.
 *
 * WHY THIS BLOCKS THE SCRIPT RATHER THAN RELYING ON CONSENT MODE ALONE. Google
 * Consent Mode v2 with analytics_storage denied still loads gtag.js and still
 * sends cookieless pings to Google. That is defensible in some jurisdictions and
 * is not what a Spanish establishment should lean on. Nothing is requested from
 * googletagmanager.com until the visitor says yes. Consent Mode defaults are set
 * as well, belt and braces, so that even after acceptance the ad-related signals
 * stay denied unless separately granted.
 *
 * The googletagmanager.com script tag was removed from all 79 pages in the same
 * commit. If it is ever put back in the HTML this gate stops working, and what
 * you get is the four lines above.
 *
 * CSP NOTE, load-bearing. getbrandgeo.com serves
 *   script-src 'self' https://plausible.io https://www.googletagmanager.com
 * with NO 'unsafe-inline', so every line of this has to live in an external file
 * and an inline script tag would fail silently. style-src does carry
 * 'unsafe-inline', which is why the injected style element below works.
 * Injecting a script element pointing at googletagmanager.com is allowed
 * because that origin is already whitelisted.
 *
 * PLAUSIBLE IS DELIBERATELY NOT GATED. It sets no cookies, stores no identifier
 * and collects no personal data, so it does not require consent under ePrivacy.
 * It stays loaded for everyone, which is also why declining here does not leave
 * the site with no measurement at all.
 */
(function () {
  'use strict';

  var GA_ID   = 'G-9H6C2NSYPH';
  var KEY     = 'bg-consent';
  // Bump when the categories change. A stored value with an older version is
  // treated as no answer, so the banner asks again rather than assuming consent
  // for something the visitor was never shown.
  var VERSION = 1;
  // Consent is not open-ended. The published Cookie Policy states we ask again
  // at least every 12 months, so the stored answer expires here to match. A
  // policy that promises re-consent while the code never re-asks is a false
  // statement in a legal document, which is worse than not promising it.
  var MAX_AGE_MS = 365 * 24 * 60 * 60 * 1000;

  function read() {
    try {
      var raw = window.localStorage.getItem(KEY);
      if (!raw) return null;
      var v = JSON.parse(raw);
      if (!v || v.version !== VERSION) return null;
      var at = Date.parse(v.at);
      if (isFinite(at) && (Date.now() - at) > MAX_AGE_MS) return null;
      return v;
    } catch (e) { return null; }   // Safari private mode throws on localStorage
  }

  function write(analytics) {
    try {
      window.localStorage.setItem(KEY, JSON.stringify({
        version: VERSION, analytics: !!analytics, at: new Date().toISOString()
      }));
    } catch (e) { /* the choice still applies for this page view */ }
  }

  // Consent Mode defaults, queued before anything else. dataLayer preserves
  // order, so if gtag.js ever arrives, from here or from a future tag manager,
  // it processes these first and starts denied.
  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = gtag;

  gtag('consent', 'default', {
    ad_storage:            'denied',
    ad_user_data:          'denied',
    ad_personalization:    'denied',
    analytics_storage:     'denied',
    functionality_storage: 'granted',   // first party, needed for the site to work
    security_storage:      'granted',
    wait_for_update: 500
  });

  var loaded = false;
  function loadGa() {
    if (loaded) return;
    loaded = true;
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
    document.head.appendChild(s);

    gtag('js', new Date());
    // Ad signals stay denied even once analytics is granted. The banner asks
    // about analytics only, so granting advertising storage here would be
    // consent the visitor never gave. This is what keeps ga-audiences off.
    gtag('consent', 'update', { analytics_storage: 'granted' });
    gtag('config', GA_ID, { anonymize_ip: true });
  }

  var CSS =
    '.bg-cc{position:fixed;left:16px;right:16px;bottom:16px;z-index:2147483000;' +
    'max-width:680px;margin:0 auto;background:var(--s,#101116);color:var(--t,#e8e9ed);' +
    'border:1px solid var(--bd,#23242b);border-radius:14px;padding:18px 20px;' +
    'box-shadow:0 18px 50px rgba(0,0,0,.45);font-size:.9rem;line-height:1.6;}' +
    '.bg-cc h2{font-size:.95rem;font-weight:700;margin:0 0 6px;color:var(--t,#e8e9ed);}' +
    '.bg-cc p{margin:0 0 14px;color:var(--t2,#9ba1ac);font-size:.85rem;}' +
    '.bg-cc a{color:var(--ac-text,#a78bfa);text-decoration:underline;}' +
    '.bg-cc-row{display:flex;gap:10px;flex-wrap:wrap;}' +
    // Reject is the same size, weight and padding as Accept. Making refusal
    // harder than acceptance is the dark pattern the AEPD and CNIL enforce most
    // often, so the two differ only in fill.
    '.bg-cc button{flex:1 1 160px;padding:11px 18px;border-radius:9px;font:inherit;' +
    'font-weight:600;font-size:.86rem;cursor:pointer;border:1px solid transparent;}' +
    '.bg-cc-accept{background:var(--ac-strong,#7c3aed);color:#fff;}' +
    '.bg-cc-reject{background:transparent;color:var(--t,#e8e9ed);border-color:var(--bd2,#32333c);}' +
    '.bg-cc-accept:hover{filter:brightness(1.08);}' +
    '.bg-cc-reject:hover{border-color:var(--t2,#9ba1ac);}' +
    '@media(max-width:520px){.bg-cc{left:10px;right:10px;bottom:10px;padding:16px;}}';

  function injectCss() {
    if (document.getElementById('bg-cc-css')) return;
    var st = document.createElement('style');
    st.id = 'bg-cc-css';
    st.appendChild(document.createTextNode(CSS));
    document.head.appendChild(st);
  }

  function showBanner() {
    injectCss();
    var el = document.createElement('div');
    el.className = 'bg-cc';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-modal', 'false');
    el.setAttribute('aria-label', 'Cookie choices');

    var h = document.createElement('h2');
    h.textContent = 'Cookies';

    var p = document.createElement('p');
    p.appendChild(document.createTextNode(
      'We use Google Analytics to see which pages are useful. It sets cookies, ' +
      'so we only load it if you agree. Our privacy-friendly analytics runs ' +
      'either way and sets no cookies. '));
    var a = document.createElement('a');
    a.href = '/cookies.html';
    a.textContent = 'Read the cookie policy';
    p.appendChild(a);
    p.appendChild(document.createTextNode('.'));

    var row = document.createElement('div');
    row.className = 'bg-cc-row';
    var reject = document.createElement('button');
    reject.type = 'button';
    reject.className = 'bg-cc-reject';
    reject.textContent = 'Reject';
    var accept = document.createElement('button');
    accept.type = 'button';
    accept.className = 'bg-cc-accept';
    accept.textContent = 'Accept';

    // Reject comes first in the DOM so keyboard and screen-reader users reach
    // the privacy-preserving option before the permissive one.
    row.appendChild(reject);
    row.appendChild(accept);

    function close() { if (el.parentNode) el.parentNode.removeChild(el); }
    reject.addEventListener('click', function () { write(false); close(); });
    accept.addEventListener('click', function () { write(true); loadGa(); close(); });

    el.appendChild(h); el.appendChild(p); el.appendChild(row);
    document.body.appendChild(el);
    reject.focus();
  }

  // Withdrawing consent has to be as easy as giving it, so a "Cookie settings"
  // link is inserted next to the footer's existing cookie-policy link. Done from
  // here rather than in 79 HTML files, and it degrades to nothing if the footer
  // markup ever changes.
  function reopen(ev) {
    if (ev) ev.preventDefault();
    try { window.localStorage.removeItem(KEY); } catch (e) {}
    if (!document.querySelector('.bg-cc')) showBanner();
  }

  // Any element marked data-cookie-settings re-opens the banner. The Cookie
  // Policy page uses this for its own button, because the footer-link injection
  // below cannot fire there: that page's footer link points at the page you are
  // already on, so the policy would otherwise be the one page with no way to
  // change your mind.
  function bindExplicitTriggers() {
    var nodes = document.querySelectorAll('[data-cookie-settings]');
    for (var i = 0; i < nodes.length; i++) {
      if (nodes[i].getAttribute('data-cc-bound')) continue;
      nodes[i].setAttribute('data-cc-bound', '1');
      nodes[i].addEventListener('click', reopen);
    }
  }

  function addFooterLink() {
    var target = document.querySelector('footer a[href$="/cookies.html"], footer a[href="cookies.html"]');
    if (!target || document.getElementById('bg-cc-reopen')) return;
    var link = document.createElement('a');
    link.id = 'bg-cc-reopen';
    link.href = '#';
    link.textContent = 'Cookie settings';
    link.addEventListener('click', reopen);
    var host = target.parentNode;
    if (host && host.tagName === 'LI' && host.parentNode) {
      var li = document.createElement('li');
      li.appendChild(link);
      host.parentNode.insertBefore(li, host.nextSibling);
    } else if (host) {
      host.insertBefore(document.createTextNode(' '), target.nextSibling);
      host.insertBefore(link, target.nextSibling);
    }
  }

  function start() {
    var choice = read();
    if (choice && choice.analytics) loadGa();
    else if (!choice) showBanner();
    // choice present and analytics false: nothing loads, nothing is re-asked.
    addFooterLink();
    bindExplicitTriggers();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
