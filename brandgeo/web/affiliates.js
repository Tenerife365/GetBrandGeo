/* build: 2026-09-12 affiliates-page */
/**
 * affiliates.js: page logic for /affiliates.html. Two calls to
 * app.getbrandgeo.com (already allowed by the CSP connect-src):
 *   GET  affiliate-programs-public  -> the active, public programs (cards + form select)
 *   POST affiliate-apply            -> the application form
 * The static BrandGEO card in the HTML is the no-JS and API-down fallback; it
 * is replaced when the API answers. No inline scripts (CSP).
 */
(function () {
  'use strict';
  var API = 'https://app.getbrandgeo.com/.netlify/functions/';
  var grid = document.getElementById('programGrid');
  var select = document.getElementById('apProgram');
  var form = document.getElementById('applyForm');
  var status = document.getElementById('applyStatus');
  var submitBtn = document.getElementById('applySubmit');

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function card(p) {
    var initial = esc((p.name || '?').charAt(0));
    var color = /^#[0-9a-fA-F]{3,8}$/.test(p.brand_color || '') ? p.brand_color : '#8b5cf6';
    var logo = p.logo_url && /^https:\/\//.test(p.logo_url)
      ? '<img class="pc-logo" src="' + esc(p.logo_url) + '" alt="" loading="lazy">'
      : '<span class="pc-mark" style="background:' + color + '">' + initial + '</span>';
    var facts = [];
    if (p.lead_commission && Number(p.lead_commission) > 0) facts.push('<li><strong>' + esc(p.currency) + ' ' + esc(p.lead_commission) + '</strong> per qualified lead</li>');
    if (p.sale_commission_type === 'percent' && p.sale_commission_percent) facts.push('<li><strong>' + esc(p.sale_commission_percent) + '%</strong> of every sale</li>');
    if (p.sale_commission_type === 'fixed' && p.sale_commission) facts.push('<li><strong>' + esc(p.currency) + ' ' + esc(p.sale_commission) + '</strong> per sale</li>');
    if (p.recurring_percent) facts.push('<li><strong>' + esc(p.recurring_percent) + '%</strong> of renewals' + (p.recurring_months ? ' for ' + esc(p.recurring_months) + ' months' : ', for as long as the customer stays') + '</li>');
    facts.push('<li>' + esc(p.attribution_days) + '-day attribution window</li>');
    facts.push('<li>Approved ' + esc(p.approval_days) + ' days after the sale, paid ' + esc((p.payout_schedule || 'monthly').toLowerCase()) + '</li>');
    facts.push('<li>Minimum payout ' + esc(p.currency) + ' ' + esc(p.min_payout) + '</li>');
    return '' +
      '<article class="pc" data-slug="' + esc(p.slug) + '">' +
      '  <div class="pc-head">' + logo + '<div><h3>' + esc(p.name) + '</h3>' + (p.tagline ? '<p class="pc-tag">' + esc(p.tagline) + '</p>' : '') + '</div></div>' +
      (p.description ? '<p class="pc-desc">' + esc(p.description) + '</p>' : '') +
      '  <ul class="pc-facts">' + facts.join('') + '</ul>' +
      '  <div class="pc-foot"><a class="btn-primary" href="#apply" data-program="' + esc(p.slug) + '">Apply to ' + esc(p.name) + '</a>' +
      '  <a class="pc-terms" href="' + esc(p.terms_url) + '">Program terms</a></div>' +
      '</article>';
  }

  function renderPrograms(list) {
    if (!grid || !list.length) return;
    grid.innerHTML = list.map(card).join('');
    if (select) {
      select.innerHTML = list.map(function (p) { return '<option value="' + esc(p.slug) + '">' + esc(p.name) + '</option>'; }).join('');
    }
    var applyLinks = grid.querySelectorAll('a[data-program]');
    for (var i = 0; i < applyLinks.length; i++) {
      applyLinks[i].addEventListener('click', function () {
        if (select) select.value = this.getAttribute('data-program');
      });
    }
  }

  function loadPrograms() {
    if (!window.fetch) return;
    fetch(API + 'affiliate-programs-public', { method: 'GET' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (data) { if (data && Array.isArray(data.programs) && data.programs.length) renderPrograms(data.programs); })
      .catch(function () { /* static fallback stays */ });
  }

  function setStatus(kind, text) {
    if (!status) return;
    status.className = 'apply-status ' + kind;
    status.textContent = text;
    status.hidden = !text;
  }

  function submit(e) {
    e.preventDefault();
    if (!form) return;
    var data = new FormData(form);
    var body = {
      program: data.get('program'),
      full_name: data.get('full_name'),
      email: data.get('email'),
      company: data.get('company'),
      website: data.get('website'),
      social_url: data.get('social_url'),
      country: data.get('country'),
      promo_method: data.get('promo_method'),
      payout_method: data.get('payout_method') || null,
      terms_accepted: !!data.get('terms_accepted'),
      privacy_accepted: !!data.get('privacy_accepted'),
      website_url: data.get('website_url') || ''
    };
    if (!body.website && !body.social_url) { setStatus('err', 'Please add your website or a social profile so we can review how you promote.'); return; }
    if (!body.terms_accepted || !body.privacy_accepted) { setStatus('err', 'Please accept the affiliate terms and the privacy policy.'); return; }
    submitBtn.disabled = true;
    setStatus('', 'Sending your application');
    status.hidden = false;
    fetch(API + 'affiliate-apply', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, status: r.status, body: j }; }); })
      .then(function (res) {
        if (res.ok) {
          form.reset();
          form.hidden = true;
          setStatus('ok', 'Thank you. Your application is in. We review every application by hand and reply by email, usually within two working days.');
          return;
        }
        setStatus('err', (res.body && res.body.error) || 'We could not send your application. Please try again or email support@getbrandgeo.com.');
      })
      .catch(function () { setStatus('err', 'We could not reach the server. Please try again in a minute or email support@getbrandgeo.com.'); })
      .then(function () { submitBtn.disabled = false; });
  }

  if (form) form.addEventListener('submit', submit);
  loadPrograms();

  // ?program=<slug> preselects the form (used by invitation emails and cards).
  try {
    var pre = new URLSearchParams(location.search).get('program');
    if (pre && select) select.value = pre;
  } catch (e) { /* ignore */ }
})();
