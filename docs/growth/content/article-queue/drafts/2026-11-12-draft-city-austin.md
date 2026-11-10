# Draft: AI visibility in Austin, where three engines agree

- Queue key: `draft-city-austin` (row 24, city study, counts toward the two-a-week city cadence)
- Publish on: 2026-11-12 (queue row `ready from 2026-11-12`)
- Type: city study, third basis (November 2026 collection)
- Written 2026-11-08 in a separate session (hub ruling of 2026-11-08: city studies are
  written as drafts, the routine only publishes). Every figure below comes from read-only
  SQL against `duiyifepitvugyulobqm` run on 2026-11-08, plus a hand read of the contexts
  named in "Hand read".
- Slug and date: the routine replaces every `bg-NNN` and `BG-NNN` with the next slug and
  sets `date` and `date_label` to the publish day. Nothing else is to be rewritten.

## Basis

Client 58 (Research: Austin), `status = 'ok'`, 18 answers: 6 questions x 3 engines, all
collected 2026-11-06. Models read from `ai_results.model`: chatgpt gpt-5.5, claude
claude-sonnet-4-6, gemini gemini-2.5-flash.

| Position | Question |
|---|---|
| 1 | Best personal injury law firms in Austin |
| 2 | Best real estate agents for buying a home in Austin |
| 3 | Top-rated property management companies in Austin |
| 4 | Best immigration lawyers in Austin |
| 5 | Best technology startup law firms in Austin |
| 6 | Best home builders in Austin |

## Queries

1. Basis check:

```sql
select r.llm, r.model, count(*) as rows, min(r.checked_at)::date, max(r.checked_at)::date
from ai_results r where r.client_id = 58 and r.status = 'ok' group by 1, 2 order by 1;
```
Result: chatgpt gpt-5.5 6, claude claude-sonnet-4-6 6, gemini gemini-2.5-flash 6, all 2026-11-06.

2. The brief's bold-name count (topics.md, briefs 24 to 29):

```sql
with b as (
  select r.prompt_id, r.llm,
         lower(regexp_replace(trim(both ' :.' from m[1]), ',? (llp|pllc|p\.a\.|pc|inc\.?|llc)$', '')) as name
  from ai_results r, regexp_matches(r.response_text, '\*\*([^*\n]{3,80})\*\*', 'g') m
  where r.client_id = 58 and r.status = 'ok' and m[1] !~ ':\s*$'),
d as (select distinct prompt_id, llm, name from b),
agg as (select prompt_id, name, count(distinct llm) as engines from d group by 1, 2)
select p.position, count(*) filter (where engines = 3) as all_three
from agg join prompts p on p.id = agg.prompt_id group by 1 order by 1;
```
Result: 0, 0, 0, 0, 0, 6 (exact bold strings only).

3. Named anywhere in each answer: every name any engine put in bold, reduced to its core
(suffixes such as Homes, Property Management, Law, PC, LLP removed), searched with word
boundaries in each engine's `response_text` for the same question:

```sql
with b as (
  select distinct r.prompt_id,
    trim(regexp_replace(regexp_replace(lower(trim(both ' :.' from m[1])), '\(.*\)', '', 'g'),
      '(,? (llp|pllc|p\.a\.|pc|inc\.?|llc|co\.?|company|group|law firm|law group|law offices?|law|property management|properties|homes|custom homes|austin|tx))+$', '')) as core
  from ai_results r, regexp_matches(r.response_text, '\*\*([^*\n]{3,80})\*\*', 'g') m
  where r.client_id = 58 and r.status = 'ok' and m[1] !~ ':\s*$'),
hits as (
  select b.prompt_id, b.core, count(distinct r.llm) as n
  from b join ai_results r on r.client_id = 58 and r.prompt_id = b.prompt_id and r.status = 'ok'
  where length(b.core) >= 4
    and lower(r.response_text) ~ ('\m' || regexp_replace(b.core, '([.^$*+?()\[\]{}|\\])', '\\\1', 'g') || '\M')
  group by 1, 2)
select p.position, h.core from hits h join prompts p on p.id = h.prompt_id where n = 3 order by 1, 2;
```
Plus a direct `strpos` check for `1836` (the core filter drops names that start with a digit).

## Hand read (2026-11-08)

Every name the queries returned was read in context in all three answers.

| Question | Named by all three, after the hand read | Dropped |
|---|---|---|
| 1 Personal injury | 0 | "serious" (a word, not a firm) |
| 2 Real estate agents | 0 | |
| 3 Property management | 2: 1836 Property Management, Keyrenter Property Management Austin (Gemini writes "Keyrenter Austin") | "austin" and a heading |
| 4 Immigration | 2, both named after their attorneys (reported as a count). In one, Gemini names the attorney, the other two name the firm | |
| 5 Technology startup law | 0 (two firms were named by two engines each) | |
| 6 Home builders | 12 | |

Home builders, bold names per engine (labels such as "hire your own inspector" removed by hand):

| | ChatGPT | Claude | Gemini | All three answers together |
|---|---|---|---|---|
| Builders put in bold | 20 | 16 | 29 | 38 different builders |

Of the 38: 12 named by all three, 3 by two (one Claude and Gemini pair twice, one
ChatGPT and Gemini pair once), 23 by one engine only (14 of those only by Gemini). Claude grouped five builders into
three bold lines ("Lennar & D.R. Horton" and two more), which is why the exact-string
count in query 2 found 6, not 12.
The 12: five named here (Coventry Homes, Highland Homes, Lennar, Meritage Homes, United
Built Homes) and seven that carry a founder's or family name (reported as a count).

Totals: 16 firms named by all three engines across the six questions: 12 home builders,
2 property managers, 2 immigration firms. 0 personal injury firms, 0 real estate agents,
0 startup law firms.

## Check before publishing

None needed beyond the routine's own validation: no external source, and the three linked
pages (bg-016, bg-113, ai-visibility-for-losangeles) exist on brandgeo/web.

## Entry

```python
ARTICLES_DAILY.append(dict(
    slug="bg-NNN", bid="BG-NNN", date="2026-11-12", date_label="November 12, 2026", read=6,
    tags=["Original Research", "US Cities", "Austin"],
    title="AI Visibility in Austin: Three Engines Agree on Home Builders, Not on Lawyers",
    h1="AI Visibility in Austin: Three Engines Agree on <em>Home Builders, Not Lawyers</em>",
    h1_plain="AI Visibility in Austin: Three Engines Agree on Home Builders, Not Lawyers",
    subtitle="We asked ChatGPT, Claude and Gemini six local buyer questions about Austin. Across the six, only 16 firms were named by all three engines, and 12 of them were home builders. No personal injury firm, real estate agent or startup law firm made all three lists.",
    meta_desc="What ChatGPT, Claude and Gemini recommend in Austin: 18 answers to six local buyer questions, and the 16 firms all three engines named, 12 of them home builders.",
    og_desc="Six Austin buyer questions, three AI engines, 18 answers: the firms all three named, and the questions where they named nobody in common.",
    ld_desc="BrandGEO study of 18 answers from ChatGPT, Claude and Gemini to six Austin buyer questions (personal injury, real estate agents, property management, immigration, startup law, home builders), collected November 6, 2026, counting the firms all three engines named.",
    keywords="ai visibility austin, chatgpt austin home builders, best home builders austin ai, austin law firms ai search, austin property management ai, local business ai recommendations austin",
    about=["AI Visibility Research", "Austin", "Local Search", "Engine Comparison"],
    findings=[("16", "firms were named by all three engines across six Austin questions"),
              ("12 of 38", "home builders named by any engine were named by all three"),
              ("0", "personal injury firms, real estate agents or startup law firms on all three lists"),
              ("2", "property managers named by all three: 1836 Property Management and Keyrenter")],
    faq=[("Which Austin businesses do AI engines agree on?",
          "In our November 6, 2026 answers, all three engines named 12 home builders, 2 property managers and 2 immigration firms. On personal injury, real estate agents and startup law, no firm appeared in all three answers."),
         ("Does being named by one engine mean the others name you?",
          "No. Of 38 home builders the three engines named, 23 were named by one engine only. Each engine has to be checked on its own."),
         ("How were the firms counted?",
          "We took every name an engine put in bold, then checked by hand whether each of the three answers to the same question named that firm anywhere, in bold or in running text. Labels such as advice headings were removed."),
         ("Is this a ranking of Austin firms?",
          "No. It counts what three engines wrote on one day. It does not say which firm is better, and it does not say why an engine named one firm and not another.")],
    related=[("/bg-016.html", "BG-016", "Cross-Engine Consensus: When AI Engines Agree, and When They Don't",
              "The wider study of when engines name the same firm."),
             ("/bg-113.html", "BG-113", "How Often AI Engines Put a National Brand Next to Local Property Managers",
              "What happens in property management answers across 20 cities."),
             ("/ai-visibility-for-losangeles.html", "Los Angeles", "AI Visibility in Los Angeles",
              "The same kind of city read, for Los Angeles.")],
    cta_h="See what each engine says about your Austin business",
    cta_p="Run the free audit on your own domain and read every engine's answer side by side. No signup and no card.",
    og=dict(
        fname="og-bg-NNN.png",
        kicker="BG-NNN · Original Research",
        lines=[[("AI Visibility", "w")], [("in ", "w"), ("Austin", "g")]],
        sub=["Six buyer questions, three engines,",
             "18 answers, November 2026."],
        stats=[("16", "firms named by all three engines", "Austin"),
               ("12 of 38", "home builders on all three lists", "Austin"),
               ("0", "personal injury firms on all three", "Austin"),
               ("2", "property managers on all three", "Austin")],
        footer="Builders Agree, Lawyers Do Not",
    ),
    body="""  <p>Ask three AI engines the same question about Austin and you get three lists. We wanted to know how much those lists overlap, because a business that appears on only one of them is invisible to buyers who use the other two.</p>

  <p>On November 6, 2026 we put six local buyer questions about Austin to ChatGPT, Claude and Gemini: a personal injury law firm, real estate agents, a property management company, an immigration lawyer, a technology startup law firm and a home builder. Then we counted the firms that all three engines named.</p>

  <div class="callout">
    <div class="callout-label">How this was measured, and what it cannot tell you</div>
    <p>18 answers: six questions, three engines (ChatGPT on gpt-5.5, Claude on claude-sonnet-4-6, Gemini on gemini-2.5-flash), all collected on November 6, 2026. We took every name an engine put in bold, then read each of the three answers to the same question to see whether it named that firm anywhere, in bold or in running text. Headings and advice labels were removed. Firms named after a person are reported as a count, not by name.</p>
    <p>An exact match on bold text alone finds only 6 firms on all three lists, because engines shorten names and Claude grouped several builders in one line. The hand read finds 16. This is one day of answers. It does not rank anyone and it does not say why an engine chose a firm.</p>
  </div>

  <h2>Where the three engines agree</h2>

  <div class="compare-table-wrap">
  <table class="compare-table">
    <thead><tr><th>Question</th><th>Firms named by all three engines</th></tr></thead>
    <tbody>
      <tr><td>Best home builders in Austin</td><td>12</td></tr>
      <tr><td>Top-rated property management companies in Austin</td><td>2</td></tr>
      <tr><td>Best immigration lawyers in Austin</td><td>2</td></tr>
      <tr><td>Best personal injury law firms in Austin</td><td>0</td></tr>
      <tr><td>Best real estate agents for buying a home in Austin</td><td>0</td></tr>
      <tr><td>Best technology startup law firms in Austin</td><td>0</td></tr>
      <tr><td><strong>Total</strong></td><td><strong>16</strong></td></tr>
    </tbody>
  </table>
  </div>

  <p>Three of the six questions produced no firm in common at all. Each engine named several personal injury firms, agents and startup lawyers; the lists did not meet. On the startup law question two firms were named by two engines each, never by the third.</p>

  <h2>Home builders: the one question where the lists overlap</h2>

  <div class="compare-table-wrap">
  <table class="compare-table">
    <thead><tr><th></th><th>ChatGPT</th><th>Claude</th><th>Gemini</th><th>All three answers together</th></tr></thead>
    <tbody>
      <tr><td>Home builders named</td><td>20</td><td>16</td><td>29</td><td>38 different builders</td></tr>
    </tbody>
  </table>
  </div>

  <p>Of the 38 builders, 12 were named by all three engines, 3 by two and 23 by one engine only. The twelve include Coventry Homes, Highland Homes, Lennar, Meritage Homes and United Built Homes, plus seven builders that carry a founder's or family name. Gemini gave the longest list, 29 builders, and 14 of them appeared in no other engine's answer.</p>

  <p>So even here, where agreement is strongest, most builders an Austin buyer could hear about depend on which engine they ask.</p>

  <h2>Property management and immigration</h2>

  <p>All three engines named <strong>1836 Property Management</strong> and <strong>Keyrenter Property Management Austin</strong> (Gemini wrote "Keyrenter Austin"). ChatGPT and Claude shared two more property managers that Gemini did not mention.</p>

  <p>For immigration lawyers, two practices appeared in all three answers. Both carry their attorneys' names. In one case Gemini named the attorney rather than the firm, while ChatGPT and Claude named the firm, which is a small reminder that an engine may know you by a person's name and not by your brand.</p>

  <h2>Why counting bold names is not enough</h2>

  <p>Most AI visibility tools, ours included, start by reading the names an engine puts in bold. On these 18 answers that alone finds 6 firms on all three lists; reading the answers finds 16. The gap comes from how engines write names. Claude put "Lennar &amp; D.R. Horton" in a single bold line and did the same with five more builders in two other lines, so a tool reading one name per bold line misses six builders that Claude did name. Gemini wrote "Keyrenter Austin" where the other two wrote "Keyrenter Property Management Austin". And in one immigration answer the firm appears only through its attorney's name.</p>

  <p>For a business owner checking their own visibility, the lesson is simple: search the full answer for your name and its variants, not only the highlighted list.</p>

  <h2>How each engine answered</h2>

  <div class="compare-table-wrap">
  <table class="compare-table">
    <thead><tr><th></th><th>ChatGPT</th><th>Claude</th><th>Gemini</th></tr></thead>
    <tbody>
      <tr><td>Average stored answer length, characters</td><td>4,394</td><td>2,826</td><td>4,295</td></tr>
      <tr><td>Bold spans across the six answers</td><td>164</td><td>105</td><td>115</td></tr>
    </tbody>
  </table>
  </div>

  <p>ChatGPT bolded the most, but not every bold span is a firm: 21 of its 164 contain a digit (a rating, a review count or a number inside a label), and others are advice labels. Claude's stored answers stop at about 3,800 characters, so its length is a lower bound. Gemini's longest answer was the home builder one, where it named 29 builders.</p>

  <h2>What does not show up</h2>

  <p>No personal injury firm made all three lists, and no real estate agent did either. Each engine named several firms or agents for both questions; the names did not repeat from one engine to the next. For a firm in those categories, being on one engine's list says little about the other two. <a href="/bg-016.html">BG-016</a> looks at when engines agree in general.</p>

  <div class="callout teal">
    <div class="callout-label">What an Austin business should do</div>
    <p>Ask each engine your own buyer question, by name of your trade and "Austin", and note which list you are on. Treat the three as separate channels: in five of six categories here, no firm was on all of them.</p>
    <p>Check how each engine writes your name. If one engine knows you by a founder's name, a shortened brand or an old firm name, make the same name appear on your site, your directory profiles and your Google Business Profile, so every engine can match it to you.</p>
  </div>""",
))
```
