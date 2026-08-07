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
 *   script-src 'self' https://www.googletagmanager.com https://app.askmywebsiteai.com
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
    // SIZE, second pass, 2026-07-29. Measured on this page at a 1265x800 usable
    // viewport, dark, with transitions killed and a reflow forced first.
    //
    //   before  680 x 121.4   15.2% of viewport height   8.2% of viewport area
    //   after   900 x  66.6    8.3% of viewport height   5.9% of viewport area
    //
    // The height is what a fixed bottom bar actually costs a reader, because it
    // is the band of the page it sits on top of, and that is down 45%.
    //
    // THE TRADE, stated plainly because it is a real one. The card got WIDER,
    // 680 to 900, to get shorter. The notice is 196 characters and measures
    // 1246px of advance at 13.6px, so the line count is set by how much width
    // the text column gets, and the line count is nearly all of the height.
    // Putting the buttons BESIDE the text instead of under it is what removes a
    // whole row, but it also takes width away from the text. Swept against the
    // live element in 20px steps: at 680 the notice runs to 4 lines and the card
    // is 103.6px, at 780 it is 3 lines and 83.2px, and 880 is the first width
    // where it holds 2 lines and the card collapses to 66.6px. 900 is 880 plus a
    // little slack, since a page whose root font-size differs would otherwise
    // tip back to 3 lines. If it ever does tip, the card is 83.2px, still well
    // under the 121.4px it replaced, so this degrades instead of breaking.
    //
    // Below the 520px breakpoint the buttons go back under the notice, because
    // beside it they would leave the text about 130px of column. Mobile barely
    // moves: 162.2px to 155.6px at 375 wide. The notice alone is 4 lines there
    // and that is the floor unless the copy is cut, which it was not. The copy
    // carries the purpose of the processing and the fact that cookies are set,
    // and those are what make the consent informed rather than merely obtained.
    //
    // NOTHING ABOUT THE CHOICE MOVED. Both buttons are still the same size, the
    // same weight and the same padding, still adjacent, still one click, and
    // Reject is still first in the DOM. Only chrome was removed.
    //
    // box-sizing is pinned because min-width and min-height below have to mean
    // the same thing on all 78 pages. Most reset it to border-box, some do not,
    // and a touch target that is 44px on one page and 66px on another is not a
    // guarantee.
    '.bg-cc,.bg-cc *{box-sizing:border-box;}' +
    // display:flex is what puts the notice and the buttons on one row. The h2
    // below is position:absolute, so it is not a flex item and does not become a
    // stray third column.
    // The edge moved from --bd to --bd2. A slimmer, quieter bar leans harder on
    // its outline to read as one object, and --bd measured 1.27:1 against the
    // page in dark and 1.21:1 in light. --bd2 is 1.57:1 and 1.45:1. See the note
    // at the foot of this block for why it was not pushed to 3:1.
    '.bg-cc{position:fixed;left:16px;right:16px;bottom:16px;z-index:2147483000;' +
    'max-width:900px;margin:0 auto;background:var(--s,#101116);color:var(--t,#e8e9ed);' +
    'border:1px solid var(--bd2,#32333c);border-radius:10px;padding:10px 14px;' +
    'box-shadow:0 6px 20px rgba(0,0,0,.28);font-size:.9rem;line-height:1.5;' +
    'display:flex;align-items:center;gap:16px;}' +
    // The heading read "Cookies" and nothing else, which the first sentence of
    // the notice already says with more information in it. It is hidden from
    // sight and kept in the accessibility tree, so the dialog still exposes a
    // heading to a screen reader and nothing a visitor needs in order to decide
    // has been taken away.
    '.bg-cc h2{position:absolute;width:1px;height:1px;margin:-1px;padding:0;' +
    'overflow:hidden;clip:rect(0 0 0 0);clip-path:inset(50%);white-space:nowrap;border:0;}' +
    // min-width:0 lets the notice column shrink below its longest word instead
    // of forcing the row wider than the card, which is what would push the
    // buttons off the edge on a narrow tablet.
    '.bg-cc p{margin:0;flex:1 1 auto;min-width:0;color:var(--t2,#9ba1ac);font-size:.85rem;}' +
    '.bg-cc a{color:var(--ac-text,#a78bfa);text-decoration:underline;}' +
    '.bg-cc-row{display:flex;gap:8px;flex:0 0 auto;flex-wrap:nowrap;justify-content:flex-end;}' +
    // Reject is the same size, weight and padding as Accept. Making refusal
    // harder than acceptance is the dark pattern the AEPD and CNIL enforce most
    // often, so the two differ only in fill. min-width and min-height are set
    // on .bg-cc button, which both buttons share, so neither can be shrunk
    // without the other and neither can fall under the 44px touch floor. Both
    // render at exactly 100x44.6: the labels are narrower than the min-width, so
    // the min is what sizes them and it sizes them identically.
    '.bg-cc button{flex:0 0 auto;min-width:100px;min-height:44px;padding:11px 16px;' +
    'border-radius:8px;font:inherit;font-weight:600;font-size:.86rem;cursor:pointer;' +
    'border:1px solid transparent;}' +
    '.bg-cc-accept{background:var(--ac-strong,#7c3aed);color:#fff;}' +
    // Accept is a solid fill, Reject is an outline, so this border is the only
    // thing that makes Reject look like a control at all. It is --t3: 4.95:1
    // against the card in dark, 5.27:1 in light, both clear of the 3:1 that
    // WCAG 1.4.11 asks of a control boundary. cookies.html section 6 claims the
    // two have equal prominence, and this is the line that keeps that true of
    // their visibility and not just their geometry.
    // Selector is `.bg-cc button.bg-cc-reject`, not `.bg-cc-reject`, and that is
    // load-bearing. `.bg-cc button` above is (0,1,1) and its `border` shorthand
    // resets border-color to transparent; a bare `.bg-cc-reject` is (0,1,0) and
    // loses, so the border painted nothing and Reject had no visible boundary at
    // all, measured 1.11:1. Both :hover rules below are written at (0,2,1) for
    // the same reason, rather than relying on :hover to lift them past it.
    '.bg-cc button.bg-cc-reject{background:transparent;color:var(--t,#e8e9ed);border-color:var(--t3,#7d838f);}' +
    // showBanner() focuses Reject when the notice appears. Without this rule
    // that lands on whatever ring the UA draws, which on a filled violet button
    // is close to invisible. --ac-text measures 6.93:1 against the card in dark
    // and 7.1:1 in light, and the 2px offset keeps it off the Accept fill.
    // This is :focus and NOT :focus-visible, deliberately. :focus-visible is not
    // guaranteed to match focus moved by script, and the one focus that matters
    // most here is exactly that: the Reject button that showBanner() focuses on
    // appear. A keyboard user who cannot see where they landed is the case this
    // has to cover. The usual reason to prefer :focus-visible, a ring left on a
    // button after a mouse click, cannot happen here, because either click
    // removes the notice from the document in the same handler.
    '.bg-cc button:focus{outline:2px solid var(--ac-text,#a78bfa);outline-offset:2px;}' +
    '.bg-cc button.bg-cc-accept:hover{filter:brightness(1.08);}' +
    '.bg-cc button.bg-cc-reject:hover{border-color:var(--t,#e8e9ed);}' +
    // Under 520px the row stacks and the buttons fill it. A thumb target that
    // spans half the width is easier to hit than a 100px one in the corner, and
    // beside the notice they would leave it roughly 130px of column, which runs
    // to seven lines and is taller than stacking.
    //
    // WHY THE CARD EDGE IS NOT AT 3:1. Reaching it against the page would take
    // roughly --t3, which measures 5.17:1 in dark and would draw a hard bright
    // outline around the whole bar. That is louder, which is the opposite of
    // what was asked for, and WCAG 1.4.11 does not require it: it governs the
    // visual information needed to identify a CONTROL, and both controls clear
    // 3:1 against the card on their own (Accept fill 3.31:1 dark and 7.1:1
    // light, Reject border 4.95:1 and 5.27:1). The bar is a container, and it
    // also carries a shadow. Recorded here so the next person reads a decision
    // rather than an oversight.
    '@media(max-width:520px){.bg-cc{left:10px;right:10px;bottom:10px;padding:10px 12px;' +
    'flex-direction:column;align-items:stretch;gap:8px;}' +
    '.bg-cc-row{justify-content:flex-start;}.bg-cc button{flex:1 1 0;min-width:0;}}';

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
