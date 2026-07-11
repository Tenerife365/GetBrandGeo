/**
 * analysis.test.js — plain-node regression fixtures for _analysis.js
 * Run: `node tests/analysis.test.js` (exits non-zero on failure).
 *
 * No test framework is configured, so this is a dependency-free assertion
 * script. Its job is to guard the accuracy behaviour of analyseResponse so the
 * Master-Reasoning fixes (and the §2.1 three-copy drift risk) can't silently
 * regress. Add a case here with every future _analysis.js change.
 */

const assert = require('assert')
const {
  analyseResponse,
  extractBrandContext,
  buildBrandMatchers,
  matchesAlias,
  isCompanyName,
  extractBoldAndBulletNames,
  looksLikeBrandName,
  isBoldColonLabel,
  looksLikePhrase,
  stripRankPrefixes,
} = require('../netlify/functions/_analysis')

const cfg = {
  brand_aliases: ['Bucate pe Roate', 'BpR'],
  brand_website: 'https://bucateperoate.ro',
  known_competitors: ['Fratelli Catering'],
}

let passed = 0
function check(name, actual, expected) {
  assert.deepStrictEqual(actual, expected, `${name}\n  expected: ${JSON.stringify(expected)}\n  actual:   ${JSON.stringify(actual)}`)
  passed++
  console.log('  ok -', name)
}

console.log('sentiment — scoped to the brand clause (finding 1.1):')

// 1. THE core fix: a "best X" listicle contains 'best'/'recommend' but says
//    nothing about THIS brand in its own line → must be neutral, not positive.
{
  const text = 'Best catering companies in Bucharest:\n' +
    '1. Fratelli Catering – highly recommended\n' +
    '2. Bucate pe Roate\n' +
    '3. Elegant Catering'
  const r = analyseResponse(text, cfg)
  check('listicle, brand line neutral → neutral', r.sentiment, 'neutral')
  check('  (brand still detected)', r.brand_mentioned, true)
  check('  (list rank captured)', r.brand_position, 2)
}

// 2. Brand's own clause is clearly positive → positive.
{
  const text = 'Bucate pe Roate is highly recommended and a trusted caterer in Bucharest.'
  check('positive brand clause → positive', analyseResponse(text, cfg).sentiment, 'positive')
}

// 3. Brand's own clause is clearly negative → negative.
{
  const text = 'Avoid Bucate pe Roate — poor service and repeated complaints.'
  check('negative brand clause → negative', analyseResponse(text, cfg).sentiment, 'negative')
}

// 4. Mixed signals in the brand's clause → neutral (don't coin-flip).
{
  const text = 'Bucate pe Roate is recommended but has had some complaints lately.'
  check('mixed brand clause → neutral', analyseResponse(text, cfg).sentiment, 'neutral')
}

// 5. Positive words elsewhere, brand clause has no signal → neutral (regression
//    guard for the exact bug: sentiment must NOT leak from other list items).
{
  const text = 'Top recommended caterers:\n' +
    '1. Fratelli Catering — the best, award-winning and trusted\n' +
    '2. Bucate pe Roate offers events across the city'
  check('signal only in other items → neutral', analyseResponse(text, cfg).sentiment, 'neutral')
}

// 6. Brand not mentioned at all → neutral + not mentioned + null position.
{
  const text = '1. Fratelli Catering\n2. Elegant Catering\n3. Gusto Events'
  const r = analyseResponse(text, cfg)
  check('absent brand → not mentioned', r.brand_mentioned, false)
  check('absent brand → neutral', r.sentiment, 'neutral')
  check('absent brand → null position', r.brand_position, null)
}

console.log('extractBrandContext — isolates only brand segments:')

// 7. Only the brand's own segment is returned, not neighbouring list items.
{
  const text = '1. Fratelli Catering is the best\n2. Bucate pe Roate is reliable\n3. Elegant Catering'
  const ctx = extractBrandContext(text, buildBrandMatchers(cfg))
  assert.ok(ctx.includes('reliable'), 'context should contain the brand line')
  assert.ok(!ctx.includes('best'), 'context must NOT contain a neighbouring items text')
  passed++; console.log('  ok - context excludes neighbouring items')
}

console.log('lexicon — real Romanian praise phrasings (finding 1.1b, 2026-07-09):')

// 8. 🥇 #1 "Recomandarea …/cea mai potrivită alegere" — was scoring neutral
//    (id 1559 in prod). 'recomand' stem + 'potrivit' + '🥇' now catch it.
{
  const text = 'Iată cele mai bune opțiuni:\n\n## 🥇 1. Bucate pe Roate — (Recomandarea #1 pentru evenimente mari)\nAceasta este cea mai potrivită alegere pentru un eveniment de 1.000+ persoane.'
  check('RO gold-medal #1 recommendation → positive', analyseResponse(text, cfg).sentiment, 'positive')
}

// 9. "în primul rând <brand>" first-pick (id 1553 in prod) — was neutral.
{
  const text = 'Pentru evenimente corporate mari, eu aș pune pe shortlist în primul rând Bucate pe Roate.'
  check('RO "primul rand" first pick → positive', analyseResponse(text, cfg).sentiment, 'positive')
}

// 10. "opțiune excelentă" — stayed positive (id 1550 in prod), 'excelen' stem.
{
  const text = 'Bucate pe Roate este o opțiune excelentă, cu experiență considerabilă.'
  check('RO "excelenta" → positive', analyseResponse(text, cfg).sentiment, 'positive')
}

// 11. Explicit RO negation must NOT read as positive. Because the pos stem
//     'recomand' also matches "nu recomand", this resolves to neutral (both
//     signals) — documented keyword limitation; the key property is "not positive".
{
  const text = 'Nu recomand Bucate pe Roate din cauza serviciilor slabe.'
  const s = analyseResponse(text, cfg).sentiment
  assert.notStrictEqual(s, 'positive', `RO negation must not be positive (got ${s})`)
  passed++; console.log('  ok - RO "nu recomand" is not positive (got ' + s + ')')
}

console.log('mention detection — word boundaries (finding 1.3):')

// Uses the real BpR aliases incl. the risky 3-char acronym "bpr".
const bprCfg = { brand_aliases: ['bucate pe roate', 'bucateperoate', 'bpr'], brand_website: 'bucateperoate.ro' }
const bgCfg  = { brand_aliases: ['brandgeo', 'brand geo', 'getbrandgeo'], brand_website: 'getbrandgeo.com' }
function mentioned(text, c) { return analyseResponse(text, c).brand_mentioned }

// Must MATCH — standalone acronym, phrase, smushed, dashed, website, spaced.
check('bpr standalone → mentioned', mentioned('For catering I recommend BPR for large events.', bprCfg), true)
check('phrase → mentioned', mentioned('Contactează Bucate pe Roate pentru nuntă.', bprCfg), true)
check('smushed → mentioned', mentioned('BucatePeRoate rocks', bprCfg), true)
check('dashed → mentioned', mentioned('bucate-pe-roate is great', bprCfg), true)
check('website → mentioned', mentioned('Vezi bucateperoate.ro pentru detalii', bprCfg), true)
check('spaced alias "brand geo" → mentioned', mentioned('the brand geo tool is useful', bgCfg), true)

// Must NOT match — the false positives the old substring/stripped pass produced.
check('"bpr" inside subprocess → NOT mentioned', mentioned('The subprocess handles the workflow.', bprCfg), false)
check('"brandgeo" inside rebrandgeography → NOT mentioned', mentioned('Planning to rebrandgeography next year.', bgCfg), false)
check('absent brand → NOT mentioned', mentioned('Totally unrelated marketing text.', bgCfg), false)

// Direct matcher check for the acronym boundary.
{
  const m = buildBrandMatchers(bprCfg)
  assert.ok(matchesAlias('call BPR today', m), 'standalone bpr should match')
  assert.ok(!matchesAlias('the subprocessor', m), 'bpr inside a word must not match')
  passed += 2; console.log('  ok - matchesAlias acronym boundary (standalone yes, in-word no)')
}

console.log('position units — list rank only, no sentence index (finding 1.2):')

// P1. Genuine list rank is kept.
check('list rank → brand_position 2',
  analyseResponse('1. Fratelli Catering\n2. Bucate pe Roate\n3. Elegant Catering', cfg).brand_position, 2)

// P2. Prose mention (no list) → null, NOT a sentence index (was 1).
{
  const r = analyseResponse('Bucate pe Roate is a great caterer serving Bucharest.', cfg)
  check('prose mention → mentioned', r.brand_mentioned, true)
  check('prose mention → position null (not sentence index)', r.brand_position, null)
}

// P3. Prose mention deep in the text → null, NOT sentence index 3.
{
  const r = analyseResponse('First the venue matters. Then the menu. Ultimately Bucate pe Roate handled it well.', cfg)
  check('deep prose mention → position null', r.brand_position, null)
}

// P4. Rank beyond top-5 is still recovered (detectListPosition, not sentence idx).
{
  const text = '1. A\n2. B\n3. C\n4. D\n5. E\n6. F\n7. Bucate pe Roate\n8. G'
  check('rank #7 recovered → brand_position 7', analyseResponse(text, cfg).brand_position, 7)
}

// P5. A year leading a line must NOT be read as a rank (1..50 guard).
{
  const r = analyseResponse('2019. Bucate pe Roate a fost premiată în acel an.', cfg)
  check('year "2019." → mentioned', r.brand_mentioned, true)
  check('year "2019." → position null (not rank 2019)', r.brand_position, null)
}

console.log('competitor extraction — reject instructional headings (Component A false positives, 2026-07-09):')

// Brand not present in these texts, so competitor extraction runs on the numbered
// list regardless of mention. Use a neutral cfg with no known_competitors so the
// only path exercised is extractTopRankedResults → isCompanyName.
const auditCfg = { brand_aliases: ['Acme Corp'], brand_website: 'acme.com', known_competitors: [] }
function competitorNames(text, c) {
  const raw = analyseResponse(text, c).competitors_mentioned
  return raw ? JSON.parse(raw).map(x => x.name) : []
}

// C1. THE bug — a generic "how to improve AI visibility" answer. Every one of
//     these five is a live-captured false positive (§10.4). None is a company.
{
  const text = 'How to improve your AI visibility:\n' +
    '1. Define the AI surfaces you care about\n' +
    '2. Establish a Fixed Prompt Panel\n' +
    '3. Structure Content for AI Extraction\n' +
    '4. AI Visibility Score\n' +
    '5. Brand Visibility Score'
  check('instructional/metric headings → no competitors', competitorNames(text, auditCfg), [])
}

// C2. Regression — real company names in a genuine "best X" listicle still come
//     through, in list order.
{
  const text = 'Best catering companies in Bucharest:\n' +
    '1. Fratelli Catering\n' +
    '2. Elegant Catering\n' +
    '3. Gusto Events'
  check('real company names still captured',
    competitorNames(text, auditCfg), ['Fratelli Catering', 'Elegant Catering', 'Gusto Events'])
}

// C3. Mixed list — headings dropped, a real brand among them kept.
{
  const text = '1. Optimize your content for AI\n2. Salesforce\n3. Track brand mentions carefully'
  check('mixed list keeps only the real brand', competitorNames(text, auditCfg), ['Salesforce'])
}

console.log('isCompanyName — structural discrimination:')

// Instruction steps / metric headings rejected.
check('imperative + article → not a company', isCompanyName('Establish a Fixed Prompt Panel'), false)
check('imperative + preposition → not a company', isCompanyName('Structure Content for AI Extraction'), false)
check('you-clause (6+ words) → not a company', isCompanyName('Define the AI surfaces you care about'), false)
check('metric tail "Score" → not a company', isCompanyName('AI Visibility Score'), false)
check('metric tail "Score" (2) → not a company', isCompanyName('Brand Visibility Score'), false)

// Real brands preserved — INCLUDING verb-initial names without clause shape.
check('single-word brand kept', isCompanyName('Salesforce'), true)
check('two-word brand kept', isCompanyName('Fratelli Catering'), true)
check('verb-initial 2-word brand kept (Focus Features)', isCompanyName('Focus Features'), true)
check('verb-initial 2-word brand kept (Boost Mobile)', isCompanyName('Boost Mobile'), true)
check('verb-initial 3-word brand kept (Design Within Reach)', isCompanyName('Design Within Reach'), true)
check('brand with & kept', isCompanyName('Ben & Jerry'), true)

console.log('competitor extraction — bold prose + bullet lists (London run 2026-07-10, finding §9.18):')

// B1. Perplexity-shape: real firms bolded inline in prose, no numbered list at
//     all — extractTopRankedResults saw 0 of these. The "**Band 2**" ranking-tier
//     emphasis must NOT be captured as a company (looksLikeBrandName RANK_LABEL_RE).
{
  const text = 'Some of the top employment law firms in London include **Leigh Day**, ' +
    '**Thompsons**, and **Slater and Gordon Lawyers**, all ranked in **Band 2** by Chambers UK.'
  check('perplexity bold-prose names captured',
    competitorNames(text, auditCfg),
    ['Leigh Day', 'Thompsons', 'Slater and Gordon Lawyers'])
}

// B2. Gemini-shape: "*   **Name** — descriptor" bullet list (id 1607). Descriptor
//     after the en-dash is dropped; the emoji/medal residue would be too.
{
  const text = 'For London startups, popular tools include:\n\n' +
    '*   **Asana** — task management\n' +
    '*   **Trello** — kanban boards\n' +
    '*   **Notion** — all-in-one workspace\n'
  check('gemini bullet-list names captured',
    competitorNames(text, auditCfg), ['Asana', 'Trello', 'Notion'])
}

// B3. Bold emphasis that is NOT a name must be rejected (the real trap: bold marks
//     every kind of emphasis). None of these is a company.
{
  const text = 'The right choice depends on whether you are **an employer**, an ' +
    '**employee/claimant**, or a **senior executive/partner**. **Short answer**: it varies.'
  check('bold emphasis phrases → no competitors', competitorNames(text, auditCfg), [])
}

// B4. The "Ask" garbage fragment (ChatGPT row 1618): a bare imperative verb leaking
//     through numbered extraction. Real single-word brands beside it survive.
{
  const text = '1. Vanguard\n2. Ask\n3. Fidelity'
  check('bare-verb "Ask" fragment dropped, real brands kept',
    competitorNames(text, auditCfg), ['Vanguard', 'Fidelity'])
}
check('isCompanyName("Ask") → false (bare imperative verb)', isCompanyName('Ask'), false)

// B5. Merge: a numbered list PLUS an extra bolded firm in the surrounding prose —
//     the bold one is appended (not duplicated) after the ranked names.
{
  const text = 'My top picks:\n1. Linklaters\n2. Freshfields\n3. Clifford Chance\n' +
    'You might also consider **Herbert Smith Freehills** for litigation.'
  const names = competitorNames(text, auditCfg)
  assert.deepStrictEqual(names.slice(0, 3), ['Linklaters', 'Freshfields', 'Clifford Chance'],
    'ranked names kept in order')
  assert.ok(names.includes('Herbert Smith Freehills'), 'bolded prose firm appended')
  assert.strictEqual(new Set(names).size, names.length, 'no duplicates in merged list')
  passed++; console.log('  ok - numbered + bold-prose merge, deduped')
}

console.log('looksLikeBrandName — Title-Case discrimination:')
check('"Leigh Day" → brand-like', looksLikeBrandName('Leigh Day'), true)
check('"Capsule CRM" → brand-like', looksLikeBrandName('Capsule CRM'), true)
check('"Slater and Gordon Lawyers" → brand-like (connector lowercase ok)',
  looksLikeBrandName('Slater and Gordon Lawyers'), true)
check('"Monday.com" → brand-like', looksLikeBrandName('Monday.com'), true)
check('"an employer" → not brand-like', looksLikeBrandName('an employer'), false)
check('"Short answer" → not brand-like', looksLikeBrandName('Short answer'), false)
check('"Band 2" → not brand-like (rank label)', looksLikeBrandName('Band 2'), false)
check('"employee/claimant" → not brand-like (slash)', looksLikeBrandName('employee/claimant'), false)

// extractBoldAndBulletNames strips leading medal emoji (id 1623 shape: "🌟 Starling Bank").
{
  const names = extractBoldAndBulletNames('- 🌟 **Starling Bank** — best overall\n- 💜 **Monzo Business**')
  assert.deepStrictEqual(names, ['Starling Bank', 'Monzo Business'], 'emoji stripped from bullet names')
  passed++; console.log('  ok - leading medal emoji stripped from bullet names')
}

console.log('competitor extraction — reject bold section headings (live Gemini id 1629, 2026-07-10):')

// B6. Gemini bolds section headings above its firm lists ("For Employer
//     Representation", "First Tier Firms", "Other Highly-Ranked Firms"). These
//     are Title-Cased so they pass looksLikeBrandName + isCompanyName, but a
//     trailing category noun ("… Firms") or leading section word ("For …") drops
//     them. The real firms in the same answer must survive.
{
  const text = 'Here are the best employment law firms in London:\n\n' +
    '## **For Employer Representation**\n' +
    '### **First Tier Firms**\n' +
    'Consider **Baker McKenzie**, **Mishcon de Reya**, and **Lewis Silkin**.\n' +
    '### **Other Highly-Ranked Firms**\n' +
    '**Russell-Cooke**, **BDBF LLP**, **Leigh Day**, and **Monaco Solicitors**.'
  const n = competitorNames(text, auditCfg)
  for (const hdr of ['For Employer Representation', 'First Tier Firms', 'Other Highly-Ranked Firms'])
    assert.ok(!n.includes(hdr), `section heading must be dropped: ${hdr}`)
  for (const real of ['Baker McKenzie', 'Mishcon de Reya', 'Lewis Silkin', 'Russell-Cooke', 'BDBF LLP', 'Leigh Day', 'Monaco Solicitors'])
    assert.ok(n.includes(real), `real firm must be kept: ${real}`)
  passed++; console.log('  ok - section headings dropped, real firms kept')
}

// B7. Real brands near header words survive — superlatives/ordinals are excluded
//     from the lead set so "Best Buy" / "First Direct" are not mistaken for headers.
check('brands near header words kept',
  competitorNames('For banking, **Best Buy** and **First Direct** are options.', auditCfg),
  ['Best Buy', 'First Direct'])

console.log('competitor extraction — field labels & criteria (live rows 1658/1666/1667, §8.11 round 3):')

// L1. Row 1658 (Gemini law-firm): bold criterion labels with the colon INSIDE the
//     bold span ("**Best for:**"-style) in "Key Factors" / "Next Steps" sections
//     leaked as competitors. The real firms in the bullet list must survive.
{
  const text = 'Here is how to choose a law firm.\n\n' +
    '### Key Factors to Consider\n\n' +
    '*   **Expertise and Specialisation:** Look for firms with a track record.\n' +
    '*   **Reputation and Track Record:** Research client testimonials.\n' +
    '*   **Communication and Client Approach:** Effective communication is crucial.\n' +
    '*   **Cost-Effectiveness and Fee Structure:** Understand the fees upfront.\n' +
    '*   **Strategic Thinking:** The most effective representation is deliberate.\n' +
    '*   **Team and Resources:** Complex disputes need a team.\n\n' +
    '### Leading Firms in London\n\n' +
    '*   **Clifford Chance LLP**\n' +
    '*   **Freshfields Bruckhaus Deringer LLP**\n' +
    '*   **Herbert Smith Freehills LLP**\n\n' +
    '### Next Steps\n\n' +
    '1.  **Define Your Needs:** Understand the specifics.\n' +
    '2.  **Research:** Use legal directories.\n' +
    '3.  **Initial Consultations:** Many firms offer these.\n' +
    "4.  **Ask Questions:** Don't hesitate to ask."
  const n = competitorNames(text, auditCfg)
  for (const label of ['Expertise and Specialisation', 'Reputation and Track Record',
    'Communication and Client Approach', 'Cost-Effectiveness and Fee Structure',
    'Strategic Thinking', 'Team and Resources', 'Research', 'Initial Consultations',
    'Ask Questions', 'Define Your Needs'])
    assert.ok(!n.includes(label), `field label must be dropped: ${label}`)
  for (const firm of ['Clifford Chance LLP', 'Freshfields Bruckhaus Deringer LLP', 'Herbert Smith Freehills LLP'])
    assert.ok(n.includes(firm), `real firm must be kept: ${firm}`)
  passed++; console.log('  ok - L1 colon field labels dropped, firms kept (row 1658)')
}

// L2. Row 1666 (ChatGPT law-firm): numbered evaluation criteria ("1. **Your merits**
//     — …", "3. **Budget** — …") leaked. Real firms from the bold prose must survive.
{
  const text = 'For a normal dispute, start with **RPC**, **Addleshaw Goddard**, ' +
    '**Mishcon de Reya**, **Stewarts**, or **Penningtons Manches Cooper**.\n\n' +
    '## How I’d choose between them\n\n' +
    'Pick the one that gives the clearest answer on:\n\n' +
    '1. **Your merits** — what are the strongest points?\n' +
    '2. **Commercial strategy** — settlement, mediation, or litigation?\n' +
    '3. **Budget** — fixed-fee initial advice and cost exposure.\n' +
    '4. **Speed** — do you need an urgent injunction?\n' +
    '5. **Opponent conflicts** — big firms often cannot act.'
  const n = competitorNames(text, auditCfg)
  for (const crit of ['Your merits', 'Commercial strategy', 'Budget', 'Speed', 'Opponent conflicts'])
    assert.ok(!n.includes(crit), `criterion must be dropped: ${crit}`)
  for (const firm of ['RPC', 'Addleshaw Goddard', 'Mishcon de Reya', 'Stewarts', 'Penningtons Manches Cooper'])
    assert.ok(n.includes(firm), `real firm must be kept: ${firm}`)
  passed++; console.log('  ok - L2 numbered criteria dropped, firms kept (row 1666)')
}

// L3. Row 1667 (Claude CRM): "**Best for:**" / "**Pricing:**" field labels inside
//     each entry's description leaked at the tail of a clean numbered CRM list.
{
  const text = '## Best CRM Software\n\n' +
    '### 1. 🥇 **Capsule CRM** *(Top Pick)*\n' +
    'A straightforward option.\n' +
    '- **Best for:** Small service-based firms.\n' +
    '- **Pricing:** Free plan for up to 2 users.\n\n' +
    '### 2. 🥈 **Prospect CRM** *(Best Rated)*\n' +
    'Highest-rated UK-based CRM.\n' +
    '- **Best for:** Product-based businesses.\n\n' +
    '### 3. **Workbooks CRM**\n### 4. **Freshsales**\n### 5. **HubSpot CRM**'
  const n = competitorNames(text, auditCfg)
  assert.ok(!n.includes('Best for'), 'field label "Best for" dropped')
  assert.ok(!n.includes('Pricing'), 'field label "Pricing" dropped')
  for (const crm of ['Capsule CRM', 'Prospect CRM', 'Workbooks CRM', 'Freshsales', 'HubSpot CRM'])
    assert.ok(n.includes(crm), `real CRM must be kept: ${crm}`)
  passed++; console.log('  ok - L3 Best for/Pricing labels dropped, CRMs kept (row 1667)')
}

console.log('field-label & phrase discrimination — unit checks:')
check('isBoldColonLabel("**Best for:** desc") → true', isBoldColonLabel('**Best for:** Small firms'), true)
check('isBoldColonLabel("**Research:** desc") → true', isBoldColonLabel('2.  **Research:** Use directories'), true)
check('isBoldColonLabel("**Capsule CRM** *(Top)*") → false', isBoldColonLabel('**Capsule CRM** *(Top Pick)*'), false)
check('looksLikePhrase("Commercial strategy") → true', looksLikePhrase('Commercial strategy'), true)
check('looksLikePhrase("Your merits") → true', looksLikePhrase('Your merits'), true)
check('looksLikePhrase("Clifford Chance") → false', looksLikePhrase('Clifford Chance'), false)
check('looksLikePhrase("Slater and Gordon Lawyers") → false', looksLikePhrase('Slater and Gordon Lawyers'), false)
check('isCompanyName("Budget") → false (common noun)', isCompanyName('Budget'), false)
check('isCompanyName("Speed") → false (common noun)', isCompanyName('Speed'), false)
check('isCompanyName("Tide") → true (brand, not in denylist)', isCompanyName('Tide'), true)
check('isCompanyName("Monzo") → true', isCompanyName('Monzo'), true)

console.log('BpR live rows — heading rank + heading sentiment (CLIENT-HEALTH-BPR.md §4.2/§4.3):')

// The same #1 recommendation, written three ways by Claude. Before the fix, only the
// H2 variants scored position=1/positive; the H3 variant scored null/neutral purely
// because "### 🥇 " is 7 UTF-16 units vs the old 6-char budget, and because the praise
// sat in the body sentence under the heading instead of inside the heading itself.

// R1586 — H3 heading + praise in the BODY sentence. Was: position null, neutral.
{
  const text = '### 🥇 1. **Bucate pe Roate** *(bucateperoate.ro)*\n' +
    'Aceasta este probabil cea mai bună opțiune pentru un eveniment de această amploare.\n' +
    '- Au construit o echipă de peste 50 de profesioniști.'
  const r = analyseResponse(text, cfg)
  check('row 1586 (H3) → mentioned', r.brand_mentioned, true)
  check('row 1586 (H3) → brand_position 1 (was null)', r.brand_position, 1)
  check('row 1586 (H3) → positive (praise in body under heading, was neutral)', r.sentiment, 'positive')
}

// R1592 — H2 heading, praise inside the heading. Already worked: regression guard.
{
  const text = '## 🥇 1. **Bucate pe Roate** *(Recomandat #1 pentru evenimente mari)*\n' +
    'Aceasta este, probabil, **cea mai potrivită alegere** pentru tine.'
  const r = analyseResponse(text, cfg)
  check('row 1592 (H2) → brand_position 1', r.brand_position, 1)
  check('row 1592 (H2) → positive', r.sentiment, 'positive')
}

// R1581 — H2 heading, ALL-CAPS brand. Already worked: regression guard.
{
  const text = '## 🥇 1. BUCATE PE ROATE *(Top Recomandare)*\n' +
    'Aceasta este alegerea #1 pentru evenimente mari în București:'
  const r = analyseResponse(text, cfg)
  check('row 1581 (H2, caps) → brand_position 1', r.brand_position, 1)
  check('row 1581 (H2, caps) → positive', r.sentiment, 'positive')
}

// Heading rank must work at every heading depth, not just H2.
for (const h of ['#', '##', '###', '####']) {
  const r = analyseResponse(`${h} 🥇 1. **Bucate pe Roate**\nEste o alegere solidă.`, cfg)
  check(`heading depth "${h}" → brand_position 1`, r.brand_position, 1)
}

// stripRankPrefixes leaves non-ranked lines alone, and must not turn a year into a rank.
check('stripRankPrefixes strips "### 🥇 1."', stripRankPrefixes('### 🥇 1. **X**'), '1. **X**')
check('stripRankPrefixes leaves plain prose alone', stripRankPrefixes('Aceasta este o firmă.'), 'Aceasta este o firmă.')
{
  const r = analyseResponse('2019. Bucate pe Roate a fost premiată în acel an.', cfg)
  check('year "2019." still → position null (not a rank)', r.brand_position, null)
}

// Sentiment must NOT leak from a heading whose body praises a DIFFERENT brand.
{
  const text = '## 1. **Fratelli Catering**\nEste cea mai bună opțiune, premiată.\n' +
    '## 2. **Bucate pe Roate**\nOferă servicii de catering în București.'
  const r = analyseResponse(text, cfg)
  check('praise under a rival heading does not leak → neutral', r.sentiment, 'neutral')
  check('  (brand still ranked #2)', r.brand_position, 2)
}

// R1588 — Romanian noun-initial section heading captured as a competitor. It has no
// leading imperative verb and every significant word is Title-Cased ("de" is a name
// connector), so no round-3 structural rule fires — handled by the NOT_A_COMPANY stem.
check('RO heading "Recomandări Top de Catering Impecabil" → not a company',
  isCompanyName('Recomandări Top de Catering Impecabil'), false)
check('RO heading "Sugestii de Pregătire și Costuri" → not a company',
  isCompanyName('Sugestii de Pregătire și Costuri'), false)
check('real RO caterer still kept', isCompanyName('Fratelli Catering'), true)
{
  const text = '### 1. Recomandări Top de Catering Impecabil\n' +
    'Cea mai recomandată opțiune este **Carte Blanche**.\n' +
    '### 2. Sugestii de Pregătire și Costuri\nDetalii despre costuri.'
  const n = competitorNames(text, { brand_aliases: ['Acme'], brand_website: 'acme.com', known_competitors: [] })
  assert.ok(!n.includes('Recomandări Top de Catering Impecabil'), 'RO heading dropped')
  assert.ok(!n.includes('Sugestii de Pregătire și Costuri'), 'RO heading 2 dropped')
  assert.ok(n.includes('Carte Blanche'), 'real brand in the body still captured')
  passed++; console.log('  ok - row 1588 RO section headings dropped, real brand kept')
}

console.log(`\nAll ${passed} assertions passed.`)
