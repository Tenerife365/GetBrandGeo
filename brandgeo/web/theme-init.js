/* Restore the saved colour theme before first paint, so a light-mode visitor
   never sees a dark flash.

   External on purpose. This runs in <head> and must not be inlined: the CSP in
   .htaccess sets script-src without 'unsafe-inline', so an inline copy is
   silently refused and the saved preference is never applied at all. That was
   the live state of privacy.html and welcome.html until 2026-07-28, both of
   which carried this exact code inline and therefore always rendered dark.

   Pages that load site.js do not need this file; site.js:6 already restores the
   theme. It exists for the pages that do not, currently privacy and welcome. */
(function () {
  try {
    var t = localStorage.getItem('bgTheme');
    if (t) document.documentElement.setAttribute('data-theme', t);
  } catch (e) {}
})();
