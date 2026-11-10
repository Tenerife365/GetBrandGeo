# Draft: how often immigration answers say which languages a firm works in

- Queue key: `draft-immigration-languages` (row 17, was `immigration-languages`, not a city study)
- Publish on: 2026-11-21 (queue row `ready from 2026-11-21`; the day after the Orlando
  city study, so it must not be a city)
- Type: original research, default basis (July 2026 collection)
- Written 2026-11-08 in a separate session (hub ruling of 2026-11-08: the 21 November slot
  takes one of the undated topics as a draft). Every figure below comes from read-only SQL
  against `duiyifepitvugyulobqm` run on 2026-11-08, plus the hand read recorded below.
- Slug and date: the routine replaces every `bg-NNN` and `BG-NNN` with the next slug and
  sets `date` and `date_label` to the publish day. Nothing else is to be rewritten.

## Basis

The immigration question ("Best immigration lawyers in <city>", the fourth prompt of each
client by `id` order) in the 20 US city accounts, clients 28 to 47, `status = 'ok'`,
collected 2026-07-24 and 25. 97 answers: ChatGPT 19 (one Los Angeles ChatGPT row was
deleted on 2026-11-06, see the queue rules), Claude 20, Gemini 20, Google AI Mode 18,
Perplexity 20. Text column `response_text`; `citations` not used.

## Queries

```sql
with p as (select id, client_id, row_number() over (partition by client_id order by id) rn
           from prompts where client_id between 28 and 47),
r as (select r.id, r.llm, r.response_text from ai_results r join p on p.id = r.prompt_id
      where p.rn = 4 and r.status = 'ok' and r.checked_at < '2026-11-01'),
f as (select r.*,
  lower(r.response_text) ~ '\m(spanish|espa[nñ]ol|bilingual|multilingual|mandarin|chinese|cantonese|vietnamese|korean|tagalog|hindi|arabic|russian|portuguese|french|creole|polish)\M' as any_lang,
  lower(r.response_text) ~ '\m(spanish|espa[nñ]ol)\M' as spanish,
  lower(r.response_text) ~ '\m(mandarin|chinese|cantonese|vietnamese|korean|tagalog|hindi|arabic|russian|portuguese|french|creole|polish)\M' as other_lang
  from r)
select llm, count(*) n, count(*) filter (where any_lang) any_lang,
       count(*) filter (where spanish) spanish, count(*) filter (where other_lang) other_lang
from f group by rollup(llm) order by llm;
```

Result (pattern matches, before the hand read):

| Engine | Answers | Any language word | Spanish | Another language |
|---|---|---|---|---|
| ChatGPT | 19 | 3 | 3 | 0 |
| Claude | 20 | 11 | 8 | 8 |
| Gemini | 20 | 13 | 10 | 8 |
| Google AI Mode | 18 | 16 | 10 | 3 |
| Perplexity | 20 | 11 | 9 | 1 |
| All | 97 | 54 | 40 | 20 |

Context query used for the hand read: the same rows, `regexp_matches(lower(text),
'(.{0,90}\m(?:<pattern>)\M.{0,30})', 'g')` per row.

## Hand read (2026-11-08)

All 54 matching rows were read in context (every match, not a sample). A row counts when
the answer says that a named firm or lawyer works in a language.

- ChatGPT 3 of 3 count ("good for: ... Spanish-speaking clients" under a named firm).
- Claude 11 of 11 count (for example a firm "fluent in Korean and Chinese").
- Gemini 13 of 13 count.
- Google AI Mode 15 of 16 count. One row (id 2872) only offers "details on ... multilingual
  staff" and cites a page title with "bilingual"; dropped.
- Perplexity 0 of 11 count. Ten rows list a language as a way to narrow the search, inside
  a closing offer or a "best for" menu ("Spanish-speaking attorneys", "Russian, Spanish, or
  other language support"); one row (id 2631) is advice ("Languages spoken: helpful if you
  need multilingual support"). None ties a language to a named firm.

Firm-level result: 42 of 97 answers. Spanish named at firm level in 31 answers (ChatGPT 3,
Claude 8, Gemini 10, Google AI Mode 10); another language from the pattern in 19 (Claude 8,
Gemini 8, Google AI Mode 3). Languages seen in the answers but not in the pattern: Persian,
Bengali, Albanian, Turkish, Urdu, Italian, Swedish, Wolof; the other-language count is a
lower bound. Stored text is capped (Google AI Mode and ChatGPT at 10,000 characters,
Claude at about 3,800), so every engine's count is a lower bound.

Not covered before: BG-112 counts credentials, BG-109 contact details, BG-111 vetting
advice. The pre-check of 2026-11-06 (46 of 98) counted pattern matches differently; this
draft reports the hand-read figure.

## Check before publishing

None needed beyond the routine's own validation: no external source, and the three linked
pages (bg-111, bg-112, bg-109) exist on brandgeo/web.

## Entry

```python
ARTICLES_DAILY.append(dict(
    slug="bg-NNN", bid="BG-NNN", date="2026-11-21", date_label="November 21, 2026", read=6,
    tags=["Original Research", "US Cities", "Immigration Law"],
    title="Which Languages a Firm Speaks: How Often AI Engines Say It in Immigration Answers",
    h1="Which Languages a Firm Speaks: <em>How Often AI Engines Say It</em>",
    h1_plain="Which Languages a Firm Speaks: How Often AI Engines Say It",
    subtitle="For many people looking for an immigration lawyer, the language the firm works in matters as much as its reviews. Across 97 answers in 20 US cities, Google AI Mode said it for a named firm in 15 of 18 answers. Perplexity mentioned languages in 11 answers but never tied one to a firm.",
    meta_desc="How often ChatGPT, Claude, Gemini, Perplexity and Google AI Mode say which languages an immigration firm works in: 97 answers across 20 US cities, read by hand.",
    og_desc="Spanish, Mandarin, Arabic, Russian: how often five AI engines tell a buyer which languages an immigration firm speaks, from 97 answers in 20 US cities.",
    ld_desc="BrandGEO study of 97 answers from ChatGPT, Claude, Gemini, Perplexity and Google AI Mode to the question of the best immigration lawyers in 20 US cities, collected July 24 and 25, 2026, counting the answers that say which language a named firm or lawyer works in.",
    keywords="spanish speaking immigration lawyer ai, bilingual immigration attorney chatgpt, ai engines immigration lawyers languages, google ai mode immigration lawyer, multilingual law firm ai visibility",
    about=["AI Visibility Research", "Immigration Law", "Local Search", "Engine Comparison"],
    findings=[("42 of 97", "immigration answers said which language a named firm or lawyer works in"),
              ("15 of 18", "Google AI Mode answers did so, the highest of the five engines"),
              ("0 of 20", "Perplexity answers tied a language to a named firm"),
              ("31", "answers named Spanish for a firm; 19 named another language")],
    faq=[("Do AI engines tell you whether an immigration lawyer speaks Spanish?",
          "Often, but it depends on the engine. In our 97 answers, Google AI Mode said which language a named firm works in 15 times out of 18, Gemini 13 of 20, Claude 11 of 20, ChatGPT 3 of 19 and Perplexity never."),
         ("Which languages did the engines mention?",
          "Spanish most often, in 31 answers. 19 answers named another language such as Mandarin, Arabic, Korean, Russian or French, and some named Persian, Bengali, Turkish or Urdu."),
         ("What did Perplexity do instead?",
          "In 10 answers it offered language as a way to narrow the search, for example a shortlist of Spanish-speaking attorneys, and in one it advised checking the languages a firm speaks. It never said that a particular firm speaks a language."),
         ("How should a firm make its languages visible to AI engines?",
          "State them plainly where engines read about you: on your own site, on your Google Business Profile and on lawyer directories, written as a sentence such as 'our attorneys speak Spanish and Portuguese'. We can count what engines said, not why, so treat this as the obvious step, not a guaranteed one.")],
    related=[("/bg-112.html", "BG-112", "The Facts AI Engines Attach to the Local Firms They Recommend",
              "Years in business, certification and other facts engines attach to firms."),
             ("/bg-111.html", "BG-111", "How Often AI Engines Tell Buyers to Check a Firm Before Hiring It",
              "Vetting advice by engine, from the same 20 cities."),
             ("/bg-109.html", "BG-109", "How Often AI Engines Give a Street Address or Phone Number for the Firms They Name",
              "Another practical detail engines give or leave out.")],
    cta_h="See what each engine says about your firm",
    cta_p="Run the free audit on your own domain and read every engine's answer side by side. No signup and no card.",
    og=dict(
        fname="og-bg-NNN.png",
        kicker="BG-NNN · Original Research",
        lines=[[("Which Languages", "w")], [("a Firm ", "w"), ("Speaks", "g")]],
        sub=["97 immigration answers,",
             "20 US cities, five engines."],
        stats=[("42 of 97", "answers named a firm's language", "All engines"),
               ("15 of 18", "Google AI Mode answers did", "Most"),
               ("3 of 19", "ChatGPT answers did", "Few"),
               ("0 of 20", "Perplexity answers did", "None")],
        footer="Language Is a Firm Fact",
    ),
    body="""  <p>For many people looking for an immigration lawyer, the first filter is not price or reviews. It is whether someone at the firm speaks their language. So when a buyer asks an AI engine for the best immigration lawyers in their city, does the answer say which languages each firm works in?</p>

  <p>We read every immigration answer in our July study of 20 US cities to find out. The answer depends heavily on which engine you ask.</p>

  <div class="callout">
    <div class="callout-label">How this was measured, and what it cannot tell you</div>
    <p>One question, "Best immigration lawyers in" each of 20 US cities, put to ChatGPT, Claude, Gemini, Perplexity and Google AI Mode on July 24 and 25, 2026. 97 answers came back usable (one Los Angeles ChatGPT answer was later deleted by an admin refresh). We searched the answer text for 17 language words, Spanish, Mandarin, Arabic, bilingual and so on, then read every match by hand. An answer counts only when it says that a named firm or lawyer works in a language.</p>
    <p>Stored answers are capped in length, so every count is a lower bound. Some languages the answers named, such as Persian, Bengali, Turkish and Urdu, were not in our search list. These are counts of what engines wrote, not a judgment of any firm.</p>
  </div>

  <h2>Which engines say it</h2>

  <div class="compare-table-wrap">
  <table class="compare-table">
    <thead><tr><th>Engine</th><th>Answers</th><th>Said which language a named firm works in</th><th>Mentioned a language some other way</th></tr></thead>
    <tbody>
      <tr><td>Google AI Mode</td><td>18</td><td>15</td><td>1</td></tr>
      <tr><td>Gemini</td><td>20</td><td>13</td><td>0</td></tr>
      <tr><td>Claude</td><td>20</td><td>11</td><td>0</td></tr>
      <tr><td>ChatGPT</td><td>19</td><td>3</td><td>0</td></tr>
      <tr><td>Perplexity</td><td>20</td><td>0</td><td>11</td></tr>
      <tr><td><strong>All</strong></td><td><strong>97</strong></td><td><strong>42</strong></td><td><strong>12</strong></td></tr>
    </tbody>
  </table>
  </div>

  <p>Google AI Mode said it most: "a fully bilingual team (English/Spanish)", "100% bilingual (English/Spanish) staff", a firm "highly trusted by the local community for bilingual (English/Spanish) representation". Gemini and Claude often described individual lawyers: one who speaks Spanish and Haitian Creole, attorneys fluent in Korean and Chinese. ChatGPT did it three times, in short "good for" or "a fit if" lines under a firm, all about Spanish.</p>

  <p>As a share of each engine's answers: Google AI Mode 83% (15 of 18), Gemini 65% (13 of 20), Claude 55% (11 of 20), ChatGPT 16% (3 of 19) and Perplexity 0%. Across all five engines, 42 of 97 answers, 43%, tied a language to a firm.</p>

  <h3>From a word match to a hand read</h3>

  <p>The word search matched 54 of the 97 answers. Reading each one removed 12 of them: 11 from Perplexity (ten where the language word sat in a menu of ways to narrow the search, one that was general advice) and one from Google AI Mode that only offered details on multilingual staff. The remaining 42 are the count in the table. A plain keyword count would have overstated the answer by almost a third.</p>

  <h2>Perplexity mentions language, but not for a firm</h2>

  <p>A plain word count would put Perplexity in the middle: 11 of its 20 answers contain a language word. Read by hand, none of them says that a named firm speaks a language. In ten answers Perplexity lists language as a way to narrow the search, in a menu of options such as "Spanish-speaking attorneys" or "Russian, Spanish, or other language support". In one it gives advice: check the languages a firm speaks. The buyer is left to ask a follow-up question, or to check each firm themselves.</p>

  <p>This is the same engine that, in <a href="/bg-112.html">BG-112</a>, attached a fact about a firm in only 9 of 120 answers. Language is one more firm fact it tends not to give.</p>

  <h2>Which languages</h2>

  <p>Spanish was named for a firm in 31 answers. Another language from our list appeared in 19: Mandarin and Chinese, Arabic, Korean, Russian, French, Portuguese, Vietnamese, Hindi and Haitian Creole among them. Claude and Gemini named a non-Spanish language in 8 answers each, Google AI Mode in 3 and ChatGPT in none. Several answers went further than our list, naming firms that work in Persian, Bengali, Albanian, Turkish, Urdu, Italian, Swedish or Wolof.</p>

  <div class="compare-table-wrap">
  <table class="compare-table">
    <thead><tr><th>Engine</th><th>Spanish named for a firm</th><th>Another language named for a firm</th></tr></thead>
    <tbody>
      <tr><td>Google AI Mode</td><td>10</td><td>3</td></tr>
      <tr><td>Gemini</td><td>10</td><td>8</td></tr>
      <tr><td>Claude</td><td>8</td><td>8</td></tr>
      <tr><td>ChatGPT</td><td>3</td><td>0</td></tr>
      <tr><td>Perplexity</td><td>0</td><td>0</td></tr>
      <tr><td><strong>All</strong></td><td><strong>31</strong></td><td><strong>19</strong></td></tr>
    </tbody>
  </table>
  </div>

  <p>Spanish appeared in 31 of the 42 answers that tied a language to a firm, 74%. The columns overlap, because some answers named Spanish and another language together.</p>

  <h3>Is it just the stored text length?</h3>

  <p>Not entirely. Claude's stored answers stop at about 3,800 characters, so its count is a lower bound. ChatGPT and Google AI Mode are stored up to 10,000 characters, and in <a href="/bg-112.html">BG-112</a> ChatGPT's median stored answer was near 4,700 characters. ChatGPT's three answers are therefore not simply a short stored text. We can report that it said little about language, not why.</p>

  <h2>Why it matters for a firm</h2>

  <p>Language is a fact about your firm, like years in business or board certification, and engines treat it the same way: some repeat it, some leave it out. A buyer who needs a Vietnamese-speaking lawyer and asks ChatGPT would rarely learn from the answer which firms qualify. A buyer asking Google AI Mode often would.</p>

  <div class="callout teal">
    <div class="callout-label">What a firm should do</div>
    <p>Write your languages down as a plain sentence wherever engines read about you: your own site, your Google Business Profile, and lawyer directories. "Our attorneys speak Spanish and Portuguese" is easier to repeat than a flag icon or a language menu.</p>
    <p>Then ask each engine for an immigration lawyer in your city who speaks your clients' language, and check whether your firm, and the language, come back.</p>
  </div>""",
))
```
