/**
 * _country_names.js - ISO 3166-1 alpha-2 market id to full English country name.
 *
 * Pure data, no require. Moved verbatim from _enqueue.js on 2026-11-13
 * (docs/arch/multi-location-collection.md section 5.1) so that _locations.js
 * can read it without requiring _enqueue.js (that would be a require cycle).
 * _enqueue.js re-exports it, so explee-import-background.js and
 * tests/markets_data.test.js keep working unchanged.
 *
 * MUST cover every market id in src/lib/markets.ts except 'WW' (full English
 * country names, not the short selector labels); tests/markets_data.test.js
 * enforces it. An unmapped id (and 'WW') yields no label, and
 * buildSystemContext silently falls back to the brand_website TLD.
 */
const COUNTRY_NAMES = {
  RO: 'Romania', GB: 'United Kingdom', IE: 'Ireland', DE: 'Germany', FR: 'France',
  ES: 'Spain', IT: 'Italy', US: 'United States', NL: 'Netherlands', PL: 'Poland',
  AU: 'Australia', CA: 'Canada', PT: 'Portugal', BE: 'Belgium', CH: 'Switzerland',
  AT: 'Austria', HU: 'Hungary', CZ: 'Czechia', SE: 'Sweden', DK: 'Denmark', FI: 'Finland',
  BR: 'Brazil', MX: 'Mexico', SG: 'Singapore', IN: 'India', JP: 'Japan',
  AE: 'United Arab Emirates', SA: 'Saudi Arabia',
  KR: 'South Korea', NZ: 'New Zealand', HK: 'Hong Kong', TW: 'Taiwan', MY: 'Malaysia',
  TH: 'Thailand', ID: 'Indonesia', PH: 'Philippines', VN: 'Vietnam',
  NO: 'Norway', IS: 'Iceland', LU: 'Luxembourg', GR: 'Greece', SK: 'Slovakia',
  SI: 'Slovenia', HR: 'Croatia', BG: 'Bulgaria', EE: 'Estonia', LV: 'Latvia',
  LT: 'Lithuania', CY: 'Cyprus', MT: 'Malta', TR: 'Turkey',
  IL: 'Israel', QA: 'Qatar', KW: 'Kuwait', BH: 'Bahrain', OM: 'Oman', ZA: 'South Africa',
  AR: 'Argentina', CL: 'Chile', CO: 'Colombia',
}

module.exports = { COUNTRY_NAMES }
