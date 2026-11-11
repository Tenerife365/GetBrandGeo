PASS WITH FINDINGS

# Market selector expansion: review, lens B (data accuracy and server contract)

Reviewer: bg-verify, read-only. Date 2026-11-11. Subject: uncommitted working tree changes to
`brandgeo-dashboard/src/lib/markets.ts`, `src/lib/comboboxFilter.ts`, `src/lib/marketOptions.tsx`,
`netlify/functions/_enqueue.js` (COUNTRY_NAMES), `tests/markets_data.test.js`,
`tests/combobox_filter.test.js`. Baseline: `git show HEAD:<path>` (read-only).

No source file was edited. No tsc, build, dev server or browser was run.

## Acceptance criteria

| Id | Criterion | Result | Evidence |
|---|---|---|---|
| B1 | Every new id is the correct ISO 3166-1 alpha-2 code, flagCode lowercase | Met | Table below; markets.ts:187 to 338; markets_data check "ids are ISO-shaped and flagCode matches" passes |
| B2 | KR, SG, AU exist; new list matches the brief exactly | Met | Script over `MARKETS.slice(26)` printed `KR NZ HK TW MY TH ID PH VN NO FI IS LU GR CZ HU SK SI HR BG EE LV LT CY MT TR IL QA KW BH OM ZA AR CL CO`: 35 ids, same order as the brief, none missing, none extra. SG (markets.ts:162) and AU (:158) are pre-existing |
| B3 | Nothing pre-existing changed | Met | Loaded HEAD markets.ts and working-tree markets.ts side by side through tests/helpers/ts_require.js and compared rows 0 to 25 field by field (id, label, flag, flagCode) and every old region by index (id and label): `diffs 0`. Only additions: an optional `aliases` field on 15 old rows and regions appended after the last old region |
| B4 | Region data: real cities, right country, common English spelling, ids unique | Met, with INFO F7 | All 92 added regions read one by one (list below). No wrong country and no misspelling found. Region ids unique per market (script, plus markets_data check). Three labels name a state or province rather than a city (F7) |
| B5 | First region of every new market is `ALL` / `All regions`, read as non-specific by the server | Met | All 35 new markets start with `{ id: 'ALL', label: 'All regions' }` (script printed only US, CA, SG, AE as rows whose ALL label differs, all pre-existing). Every server check is `startsWith('All ')` plus explicit equalities: _collect.js:43 to 49 (buildSystemContext), :332 to 337 (ChatGPT user_location), :751 to 754 (AI Overview), collect-prompt.js:305 (ctx_geo). SG row unchanged, behaviour unchanged (F5, pre-existing) |
| B6 | market.id reaches each engine safely | Met for new ids, INFO F6 pre-existing | OpenAI `user_location.country` takes the raw id (_collect.js:338 to 339); SerpApi `gl` takes the lowercased id (:592, :758); label goes through buildSystemContext. All 35 new ids are standard ISO alpha-2 codes, which is the value space of both parameters. A specific region also feeds OpenAI `city` and SerpApi `location`; an unknown `location` is retried once without it (:774), so a non-canonical label cannot take an engine down |
| B7 | COUNTRY_NAMES covers every id except WW, full English names, old keys unchanged, nothing else changed | Met, INFO F4 | `git diff` of _enqueue.js: one comment block rewritten, 42 keys appended at :63 to :70, the 21 old keys and values untouched, no other line changed. Names checked one by one (all correct full English names). 60 keys = 61 markets minus WW; markets_data checks pass |
| B8 | Other consumers still work | Met | mcp-server.js:59 requires markets.ts, uses only `.id` and `.label` (:631); markets.ts has no import and no enum. marketContext.tsx loadSaved (:58 to 101) finds by id and falls back to `regions[0]`, unaffected by length or aliases. AIVisibility.tsx:839 reads `.label`. fix_items.test.js:402 to 404 (length > 20, WW then RO) passes. mcp_server.test.js passes |
| B9 | New tests are real; run them and the related suites | Met, with F1 and F2 | Ran, all exit 0: markets_data 38 passed 0 failed; combobox_filter 14 passed 0 failed; fix_items 24 passed 0 failed; mcp_server 83 passed; enqueue_history 23 assertions PASS. The frozen SNAPSHOT (markets_data.test.js:27 to 54) matches HEAD exactly: I printed HEAD's market order and region ids and they are identical, so the snapshot is right. One assertion cannot fail as intended (F1); the snapshot pins ids only, not labels (F2) |
| B10 | comboboxFilter semantics | Met on behaviour, Not met on one requirement (F3) | comboboxFilter.ts:25 to 55: tier 1 label prefix, tier 2 any term prefix or word start (label or keyword), tier 3 contains; `continue` and tier exclusivity mean no duplicates; incoming order kept per tier; empty or whitespace query returns the input (:27). Diacritics: the strip class at :13 is written with literal U+0300 and U+036F characters (bytes `cc 80`, `cd af`), not an escaped range |
| B11 | Scale and cost | Met | markets.ts, comboboxFilter.ts and marketOptions.tsx contain no Supabase call and no fetch. COUNTRY_NAMES is a static map read where it was read before (_enqueue.js:153). No new function, invocation or engine call. Runtime addition: flag PNGs from flagcdn.com (`w20`, about 1 KB each), rendered only while a list is open (Combobox.tsx:177), with `loading="lazy"` (marketOptions.tsx:11). Opening the market list can request up to 60 images (WW uses an icon); the list is short enough that the browser's lazy threshold will likely fetch all of them on first open, cached afterwards. The Onboard selector was a native select with no flags before, so that screen gains these requests |

### B1: new market ids, one by one

| Label | Id | flagCode | Verdict |
|---|---|---|---|
| South Korea | KR | kr | correct |
| New Zealand | NZ | nz | correct |
| Hong Kong | HK | hk | correct |
| Taiwan | TW | tw | correct |
| Malaysia | MY | my | correct |
| Thailand | TH | th | correct |
| Indonesia | ID | id | correct |
| Philippines | PH | ph | correct |
| Vietnam | VN | vn | correct |
| Norway | NO | no | correct |
| Finland | FI | fi | correct |
| Iceland | IS | is | correct |
| Luxembourg | LU | lu | correct |
| Greece | GR | gr | correct (ISO is GR, not the EU code EL) |
| Czechia | CZ | cz | correct |
| Hungary | HU | hu | correct |
| Slovakia | SK | sk | correct |
| Slovenia | SI | si | correct |
| Croatia | HR | hr | correct |
| Bulgaria | BG | bg | correct |
| Estonia | EE | ee | correct |
| Latvia | LV | lv | correct |
| Lithuania | LT | lt | correct |
| Cyprus | CY | cy | correct |
| Malta | MT | mt | correct |
| Turkey | TR | tr | correct |
| Israel | IL | il | correct |
| Qatar | QA | qa | correct |
| Kuwait | KW | kw | correct |
| Bahrain | BH | bh | correct |
| Oman | OM | om | correct |
| South Africa | ZA | za | correct |
| Argentina | AR | ar | correct |
| Chile | CL | cl | correct |
| Colombia | CO | co | correct |

flagcdn serves `w20/<iso2 lowercase>.png`; every flagCode above follows that form. Availability of each file was not fetched (see What I did not check).

### B4: added regions read

Old markets: DE Cologne, Stuttgart, Dusseldorf; GB Birmingham, Glasgow, Leeds; IE Galway, Limerick; FR Toulouse, Nice; NL The Hague, Utrecht; IT Naples, Turin; PL Wroclaw, Gdansk; PT Faro; BE Ghent; CH Basel, Bern; AT Salzburg, Graz; SE Gothenburg, Malmo; DK Aarhus; US San Francisco, Seattle, Boston, Washington DC, Atlanta, Denver, Phoenix; CA Calgary, Ottawa; BR Brasilia, Belo Horizonte; MX Monterrey; AU Perth, Adelaide, Canberra; IN Hyderabad, Chennai, Pune; JP Nagoya, Fukuoka; AE Sharjah. All correct.

New markets: KR Seoul, Busan, Incheon, Daegu; NZ Auckland, Wellington, Christchurch; TW Taipei, Kaohsiung, Taichung; MY Kuala Lumpur, Penang, Johor Bahru; TH Bangkok, Chiang Mai, Phuket; ID Jakarta, Surabaya, Bandung, Denpasar; PH Manila, Cebu, Davao; VN Ho Chi Minh City, Hanoi, Da Nang; NO Oslo, Bergen, Trondheim; FI Helsinki, Tampere, Turku; GR Athens, Thessaloniki; CZ Prague, Brno; HU Budapest, Debrecen; SK Bratislava, Kosice; SI Ljubljana, Maribor; HR Zagreb, Split; BG Sofia, Plovdiv, Varna; EE Tallinn, Tartu; LV Riga, Daugavpils; LT Vilnius, Kaunas; TR Istanbul, Ankara, Izmir; IL Tel Aviv, Jerusalem, Haifa; OM Muscat, Salalah; ZA Johannesburg, Cape Town, Durban; AR Buenos Aires, Cordoba, Rosario; CL Santiago, Valparaiso; CO Bogota, Medellin, Cali. All real and in the stated country. HK, IS, LU, CY, MT, QA, KW, BH carry ALL only (builder's stated choice).

## Findings

### F1. MEDIUM. The COUNTRY_NAMES "no dashes" assertion tests digits, not dashes
- File: `brandgeo-dashboard/tests/markets_data.test.js:149`
- Code: `assert.ok(!/[20132014]/.test(v), 'dash in ' + k)`. The character class is the digits 0 to 4; the `\u` escapes are missing (bytes read with `od -c`: `/ [ 2 0 1 3 2 0 1 4 ] /`). This is the backslash-eating failure already recorded for this repo.
- Failure scenario, run: `/[20132014]/.test('South Korea <U+2013> X')` returns false (an en dash in a country name passes the check), and `/[20132014]/.test('Area 2')` returns true (a harmless digit would fail it). The check named "COUNTRY_NAMES has no ids outside markets.ts and no dashes" cannot catch the dash it exists for. The id half of the same check works.
- Smallest fix: build the class the way line 96 of the same file already does, `new RegExp('[' + String.fromCharCode(0x2013, 0x2014) + ']')`, and reuse that `DASH` constant here. Owner: the builder of the tests file.

### F2. LOW. The frozen snapshot pins old ids and order, not old labels
- File: `brandgeo-dashboard/tests/markets_data.test.js:27` to `54`, `:120` to `125`
- Failure scenario: editing an old row's label, for example RO region `B` from `Bucharest` to `Bucuresti`, or market `GB` from `UK` to `United Kingdom`, passes all 38 checks. Region and market labels are what reach the engines (buildSystemContext, OpenAI `city`, SerpApi `location`) and what customers see, and the file header's own rule says "never rename". Today nothing was renamed (my HEAD comparison found 0 differences), so this is a guard gap, not a live defect.
- Smallest fix: store `id:label` pairs in SNAPSHOT for the 26 markets and their old regions and compare labels as well as ids.

### F3. LOW. Diacritic strip uses literal combining characters, not an escaped range
- File: `brandgeo-dashboard/src/lib/comboboxFilter.ts:13`
- What: `.replace(/[̀-ͯ]/g, '')` holds the raw characters U+0300 and U+036F. Behaviour is correct today (run: `normalizeForSearch('São')` is `sao`, `Málaga` is `malaga`, `Košice` is `kosice`), but the brief required an escaped range. A combining mark placed directly after `[` is invisible in most editors and diff views and is exposed to any tool that rewrites or normalises text; the repo has already lost escapes this way (F1).
- Failure scenario: the line is retyped or passed through a shell heredoc or a normaliser that drops the bare combining marks; the class degrades (for example to `[-]`), and typing `sao` no longer finds `São Paulo` while every test except the two diacritic checks still passes.
- Smallest fix: `.replace(/[̀-ͯ]/g, '')`.

### F4. INFO. COUNTRY_NAMES now labels seven pre-existing market ids that had no label before
- File: `brandgeo-dashboard/netlify/functions/_enqueue.js:63` to `64` (BR, MX, SG, IN, JP, AE, SA), consumed at `:153`
- What: before this change a scheduled run for a client whose `default_market_id` was one of these seven got `market_label = null`, and buildSystemContext fell back to the brand_website TLD (for a `.com` site: "the relevant local market"). Now it gets "Brazil", "Japan" and so on. This is a correction, not a regression, and only additive keys changed, but it does alter scheduled-run prompts for existing clients on those markets, so it should be named in the commit message. Which clients carry those defaults was not queried.

### F5. INFO, PRE-EXISTING. Singapore's ALL region is read as a specific city
- File: `brandgeo-dashboard/src/lib/markets.ts:164`, read at `netlify/functions/_collect.js:43` to `49`, `:332` to `339`, `:751` to `759`, `collect-prompt.js:305`
- What: label `Singapore` does not start with `All ` and is not in the equality list, so the location becomes "Singapore, Singapore", ChatGPT gets `city: 'Singapore'`, and AI Overview sends `location=Singapore`. Identical at HEAD (row unchanged, 0 differences); the new work did not change it. The test file exempts it explicitly (LEGACY_ALL_LABEL). Harmless for a city state.

### F6. INFO, PRE-EXISTING. `gl` for the United Kingdom is sent as `gb`
- File: `brandgeo-dashboard/netlify/functions/_collect.js:592`, `:758`
- What: `gl` is the lowercased market id, so the UK sends `gl=gb`. To my knowledge SerpApi's Google country list uses `uk` for the United Kingdom; whether `gb` is accepted or silently ignored was not verified. Unchanged by this work. None of the 35 new ids has an equivalent known exception.

### F7. INFO. Three new region labels name a state or province rather than a city
- File: `brandgeo-dashboard/src/lib/markets.ts:207` (MY `Penang`, a state; its city is George Town), `:219` (PH `Cebu`, a province; the city is Cebu City; `Davao` likewise for Davao City)
- Effect: harmless for the LLM prompt ("Penang, Malaysia" is a clear place). SerpApi `location` may reject a non-canonical name, and the AI Overview path retries once without `location` (_collect.js:774), so no engine is lost. No change needed unless strict city naming is wanted.

### F8. INFO. normalizeForSearch does not fold letters without a decomposition
- File: `brandgeo-dashboard/src/lib/comboboxFilter.ts:10` to `17`
- Run: `normalizeForSearch('Łodz')` is `łodz`, `Ørsted` is `ørsted`. Typing `lodz` would not find a `Łódź` label. No current market or region label contains Ł, Ø or ß, so nothing is affected today.

## What I did not check

- tsc, `npm run build`, entry chunk size: not run, per scope.
- No browser: keyboard behaviour, focus, light mode, upward popup clipping, phone tap, how many flag images the browser actually fetches on first open.
- flagcdn.com availability of each new `w20/<code>.png` was not fetched online.
- SerpApi `gl` acceptance per new country, and `location` canonical names for the new cities, were not checked against SerpApi's published lists; OpenAI `user_location.country` acceptance was judged from the ISO value space, not tested live.
- Whether any production client has `default_market_id` in BR, MX, SG, IN, JP, AE or SA (F4 impact) was not queried.
- Combobox.tsx, Onboard.tsx and Layout.tsx were read only where B8 and B11 needed them (option rendering, open state, flag usage); their keyboard, accessibility and removed-state correctness belong to another lens.
- `onboard-client.js` was grepped only: it stores `default_market_id` and `default_region_id` as passed (:140 to 141) with no allowlist, so new ids are not rejected there; no other function in `netlify/functions` carries a market id list besides COUNTRY_NAMES. Database CHECK constraints on those two columns were not queried.
- ISO codes and city facts were checked from knowledge, not an external registry.

## Amendment 2026-11-11, written from the orchestrator seat, not by the reviewer

The literal dash character in the F1 scenario above was replaced by its code point so this report carries no dash; nothing else in the reviewer's text was changed. After this review returned, the orchestrator closed these findings itself and re-ran the checks. No second `bg-verify` run was made on these edits.

- F1, closed: `tests/markets_data.test.js` builds the dash class once from code points (`DASH_RE`, `String.fromCharCode(0x2013, 0x2014)`) and the COUNTRY_NAMES check uses it.
- F2, closed: the test now carries `OLD_LABELS`, the label, flag code and region labels of the 26 old markets read from git HEAD, and a new check compares them. The file has 39 checks, was 38.
- F3, closed: `src/lib/comboboxFilter.ts` line 13 is `.replace(/[\u0300-\u036f]/g, '')`, an escaped range, no literal combining characters.
- F4, measured: a read-only query on production (`clients` grouped by `default_market_id`) returned only DE, ES, FR, GB, IE, IT, RO, US, WW and one null. No client sits on BR, MX, SG, IN, JP, AE or SA, so the seven new COUNTRY_NAMES labels change no existing scheduled prompt today.
- F7, part closed: the two Philippine rows now read `Cebu City` and `Davao City`. `Penang` stays as it is.
- F5, F6 and F8 are unchanged. F6 (`gl=gb` against a possible `uk`) is pre-existing and still unverified.
- Flag images: `https://flagcdn.com/w20/<code>.png` answered 200 for all 35 new codes on 2026-11-11.

Checks on the final state, run by the orchestrator: `tsc` exit 0, 52 of 52 node test files pass (`markets_data` 39, `combobox_filter` 14), build exit 0.
