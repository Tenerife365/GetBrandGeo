# Draft: AI visibility in Las Vegas, where three engines agree

- Queue key: `draft-city-lasvegas` (row 26, city study, counts toward the two-a-week city cadence)
- Publish on: 2026-11-17 (queue row `ready from 2026-11-17`)
- Type: city study, third basis (November 2026 collection)
- Written 2026-11-08 in a separate session (hub ruling of 2026-11-08: city studies are
  written as drafts, the routine only publishes). Every figure below comes from read-only
  SQL against `duiyifepitvugyulobqm` run on 2026-11-08, plus a hand read of the contexts
  named in "Hand read".
- Slug and date: the routine replaces every `bg-NNN` and `BG-NNN` with the next slug and
  sets `date` and `date_label` to the publish day. Nothing else is to be rewritten.

## Basis

Client 64 (Research: Las Vegas), `status = 'ok'`, 18 answers: 6 questions x 3 engines, all
collected 2026-11-06. Models read from `ai_results.model`: chatgpt gpt-5.5, claude
claude-sonnet-4-6, gemini gemini-2.5-flash.

| Position | Question |
|---|---|
| 1 | Best personal injury law firms in Las Vegas |
| 2 | Best real estate agents for buying a home in Las Vegas |
| 3 | Top-rated property management companies in Las Vegas |
| 4 | Best immigration lawyers in Las Vegas |
| 5 | Best gaming and casino law firms in Las Vegas |
| 6 | Best event and convention planning companies in Las Vegas |

## Queries

1. Basis and per-engine shape:

```sql
select r.llm, r.model, count(*) n, min(r.checked_at)::date, max(r.checked_at)::date,
       round(avg(length(r.response_text))) avg_len,
       sum((select count(*) from regexp_matches(r.response_text, '\*\*([^*\n]{3,80})\*\*', 'g'))) bold_spans
from ai_results r where r.client_id = 64 and r.status = 'ok' group by 1, 2 order by 1;
```
Result: chatgpt gpt-5.5 6 answers, average 4,253 characters, 117 bold spans; claude
claude-sonnet-4-6 6, 2,892, 101; gemini gemini-2.5-flash 6, 3,578, 78. All 2026-11-06.

2. The brief's exact bold-name count (topics.md, briefs 24 to 29), `client_id = 64`.
Named by all three per question: 0, 0, 2, 0, 1, 0 (3 in total, matching the pre-check).

3. Named anywhere: the core-name query in `drafts/2026-11-12-draft-city-austin.md`
(query 3) with `client_id = 64`, suffix list ending `|las vegas|nevada|nv`, and spans
starting with `#` excluded. Also run with `n = 2` to list names shared by two engines.

## Hand read (2026-11-08)

Every candidate was read in context in all three answers.

| Question | Named by all three, after the hand read | Notes |
|---|---|---|
| 1 Personal injury | 2, both named after their founders (count only) | |
| 2 Real estate agents | 2: one agent and one brokerage, both carrying people's names (count only) | |
| 3 Property management | 2: Five Star Property Management, and one company whose name may be a family name (count only, to be safe) | "family" matched "single-family" in Gemini, not a firm |
| 4 Immigration | 0 | |
| 5 Gaming and casino law | 5, all named after founding partners (count only). Claude named one of the five under the name of the firm it merged into ("formerly ..."), Gemini named it only in running text | "Band 1", "Best Lawyers", "Super Lawyers" are rankings, not firms |
| 6 Event and convention planning | 1: A to Z Events | |

Gaming law, firms put in bold (rankings and advice labels removed by hand), with the
merged firm counted once:

| | ChatGPT | Claude | Gemini | All three answers together |
|---|---|---|---|---|
| Gaming law firms named in bold | 7 | 8 | 10 | 15 different firms |

Of the 15: 5 named by all three (one of them in Gemini's running text only), 1 by two,
9 by one engine only.

Event and convention planning, companies put in bold (numbering stripped, one parent and
local brand of the same company counted once):

| | ChatGPT | Claude | Gemini | All three answers together |
|---|---|---|---|---|
| Event companies named in bold | 12 | 10 | 17 | 30 different companies |

Of the 30: 1 named by all three (A to Z Events), 8 by two, 21 by one engine only.

Totals: 12 firms named by all three engines across the six questions: 5 gaming law firms,
2 personal injury firms, 2 in real estate (one agent, one brokerage), 2 property managers,
1 event company. 0 immigration firms.

## Check before publishing

None needed beyond the routine's own validation: no external source, and the three linked
pages (bg-016, bg-113, ai-visibility-for-losangeles) exist on brandgeo/web.

## Entry

```python
ARTICLES_DAILY.append(dict(
    slug="bg-NNN", bid="BG-NNN", date="2026-11-17", date_label="November 17, 2026", read=6,
    tags=["Original Research", "US Cities", "Las Vegas"],
    title="AI Visibility in Las Vegas: Engines Agree on Gaming Lawyers, Not on Event Planners",
    h1="AI Visibility in Las Vegas: Engines Agree on <em>Gaming Lawyers, Not Event Planners</em>",
    h1_plain="AI Visibility in Las Vegas: Engines Agree on Gaming Lawyers, Not Event Planners",
    subtitle="We asked ChatGPT, Claude and Gemini six local buyer questions about Las Vegas. 12 firms were named by all three engines, 5 of them gaming law firms. Of 30 event and convention companies the engines named, only one was on all three lists.",
    meta_desc="What ChatGPT, Claude and Gemini recommend in Las Vegas: 18 answers to six local buyer questions, and the 12 firms all three engines named.",
    og_desc="Six Las Vegas buyer questions, three AI engines, 18 answers: 5 gaming law firms on all three lists, and 1 event company out of 30.",
    ld_desc="BrandGEO study of 18 answers from ChatGPT, Claude and Gemini to six Las Vegas buyer questions (personal injury, real estate agents, property management, immigration, gaming and casino law, event and convention planning), collected November 6, 2026, counting the firms all three engines named.",
    keywords="ai visibility las vegas, chatgpt las vegas event planners, las vegas gaming law firms ai, las vegas property management ai, convention planning companies las vegas ai search, local business ai recommendations las vegas",
    about=["AI Visibility Research", "Las Vegas", "Local Search", "Engine Comparison"],
    findings=[("12", "firms were named by all three engines across six Las Vegas questions"),
              ("5 of 15", "gaming law firms named by any engine were named by all three"),
              ("1 of 30", "event and convention companies was named by all three"),
              ("0", "immigration firms on all three lists")],
    faq=[("Which Las Vegas businesses do AI engines agree on?",
          "In our November 6, 2026 answers, all three engines named 5 gaming law firms, 2 personal injury firms, 2 property managers, one agent and one brokerage, and one event company, A to Z Events. No immigration firm appeared in all three answers."),
         ("Why do engines agree on gaming lawyers and not on event planners?",
          "We can only count what they wrote, not why. Gaming law produced a short list in every answer, 7 to 10 firms, and five names repeated. Event planning produced long lists, 10 to 17 companies per engine, and only one name repeated."),
         ("How were the firms counted?",
          "We took every name an engine put in bold, then checked by hand whether each of the three answers to the same question named that firm anywhere, in bold or in running text. Rankings, numbering and advice labels were removed."),
         ("Is this a ranking of Las Vegas firms?",
          "No. It counts what three engines wrote on one day. It does not say which firm is better, and it does not say why an engine named one firm and not another.")],
    related=[("/bg-016.html", "BG-016", "Cross-Engine Consensus: When AI Engines Agree, and When They Don't",
              "The wider study of when engines name the same firm."),
             ("/bg-113.html", "BG-113", "How Often AI Engines Put a National Brand Next to Local Property Managers",
              "What happens in property management answers across 20 cities."),
             ("/ai-visibility-for-losangeles.html", "Los Angeles", "AI Visibility in Los Angeles",
              "The same kind of city read, for Los Angeles.")],
    cta_h="See what each engine says about your Las Vegas business",
    cta_p="Run the free audit on your own domain and read every engine's answer side by side. No signup and no card.",
    og=dict(
        fname="og-bg-NNN.png",
        kicker="BG-NNN · Original Research",
        lines=[[("AI Visibility", "w")], [("in ", "w"), ("Las Vegas", "g")]],
        sub=["Six buyer questions, three engines,",
             "18 answers, November 2026."],
        stats=[("12", "firms named by all three engines", "Las Vegas"),
               ("5 of 15", "gaming law firms on all three lists", "Las Vegas"),
               ("1 of 30", "event companies on all three lists", "Las Vegas"),
               ("0", "immigration firms on all three", "Las Vegas")],
        footer="Lawyers Agree, Planners Do Not",
    ),
    body="""  <p>Ask three AI engines the same question about Las Vegas and you get three lists. We wanted to know how much those lists overlap, because a business that appears on only one of them is invisible to buyers who use the other two.</p>

  <p>On November 6, 2026 we put six local buyer questions about Las Vegas to ChatGPT, Claude and Gemini: a personal injury law firm, real estate agents, a property management company, an immigration lawyer, a gaming and casino law firm, and an event and convention planning company. Then we counted the firms that all three engines named.</p>

  <div class="callout">
    <div class="callout-label">How this was measured, and what it cannot tell you</div>
    <p>18 answers: six questions, three engines (ChatGPT on gpt-5.5, Claude on claude-sonnet-4-6, Gemini on gemini-2.5-flash), all collected on November 6, 2026. We took every name an engine put in bold, then read each of the three answers to the same question to see whether it named that firm anywhere, in bold or in running text. Rankings such as "Band 1", numbering and advice labels were removed. Firms named after a person are reported as a count, not by name.</p>
    <p>An exact match on bold text alone finds only 3 firms on all three lists. The hand read finds 12. This is one day of answers. It does not rank anyone and it does not say why an engine chose a firm.</p>
  </div>

  <h2>Where the three engines agree</h2>

  <div class="compare-table-wrap">
  <table class="compare-table">
    <thead><tr><th>Question</th><th>Firms named by all three engines</th></tr></thead>
    <tbody>
      <tr><td>Best gaming and casino law firms in Las Vegas</td><td>5</td></tr>
      <tr><td>Best personal injury law firms in Las Vegas</td><td>2</td></tr>
      <tr><td>Best real estate agents for buying a home in Las Vegas</td><td>2</td></tr>
      <tr><td>Top-rated property management companies in Las Vegas</td><td>2</td></tr>
      <tr><td>Best event and convention planning companies in Las Vegas</td><td>1</td></tr>
      <tr><td>Best immigration lawyers in Las Vegas</td><td>0</td></tr>
      <tr><td><strong>Total</strong></td><td><strong>12</strong></td></tr>
    </tbody>
  </table>
  </div>

  <h2>Gaming law: short lists that overlap</h2>

  <div class="compare-table-wrap">
  <table class="compare-table">
    <thead><tr><th></th><th>ChatGPT</th><th>Claude</th><th>Gemini</th><th>All three answers together</th></tr></thead>
    <tbody>
      <tr><td>Gaming law firms named</td><td>7</td><td>8</td><td>10</td><td>15 different firms</td></tr>
    </tbody>
  </table>
  </div>

  <p>Each engine named a short list, and five firms appeared in all three. All five carry the names of founding partners, so we report them as a count. One of them shows how fragile the match can be: Claude named it under another firm's name, with the old name in brackets after "formerly", and Gemini mentioned it only in a sentence about one of its lawyers. A reader would recognize it; a count of bold names would not. Nine more firms were named by one engine only.</p>

  <h2>Event and convention planning: thirty names, one in common</h2>

  <div class="compare-table-wrap">
  <table class="compare-table">
    <thead><tr><th></th><th>ChatGPT</th><th>Claude</th><th>Gemini</th><th>All three answers together</th></tr></thead>
    <tbody>
      <tr><td>Event and convention companies named</td><td>12</td><td>10</td><td>17</td><td>30 different companies</td></tr>
    </tbody>
  </table>
  </div>

  <p>This is one of the two questions written for this city, and the one where the engines agreed least. Between them they named 30 companies. Only <strong>A to Z Events</strong> appeared in all three answers. Eight more were named by two engines and 21 by one engine only. Gemini alone named 17, and 10 of those appeared in no other answer.</p>

  <h2>Property management, real estate and injury law</h2>

  <p>All three engines named <strong>Five Star Property Management</strong> and one more property manager. In real estate, one agent and one brokerage made all three lists; in personal injury, two firms did, both named after their founders. Each of those questions also produced several firms named by two engines but not the third.</p>

  <h2>Gaming law against event planning, side by side</h2>

  <div class="compare-table-wrap">
  <table class="compare-table">
    <thead><tr><th></th><th>Gaming law</th><th>Event and convention planning</th></tr></thead>
    <tbody>
      <tr><td>Different names across the three answers</td><td>15</td><td>30</td></tr>
      <tr><td>Named by all three engines</td><td>5 (33%)</td><td>1 (3%)</td></tr>
      <tr><td>Named by two engines</td><td>1</td><td>8</td></tr>
      <tr><td>Named by one engine only</td><td>9 (60%)</td><td>21 (70%)</td></tr>
    </tbody>
  </table>
  </div>

  <p>Even in gaming law, where the engines agreed most, six of every ten names appeared in a single answer. In event planning that rose to seven in ten. A business on one list and absent from the other two is the normal case in both categories, and the practical difference is only how often the third list also carries you.</p>

  <h2>Immigration: no overlap at all</h2>

  <p>No immigration firm was named by all three engines, whether we counted exact bold matches or read the answers by hand. That does not mean the engines gave empty answers. It means that for this question, in this city, on this day, no firm was common to all three lists, so what a buyer saw depended on the engine they used.</p>

  <h2>Why counting bold names is not enough</h2>

  <p>Most AI visibility tools, ours included, start by reading the names an engine puts in bold. Here that finds 3 firms on all three lists; reading the answers finds 12. Engines shorten names, add a city, put a firm inside a ranking line, or mention it in a sentence without bold. For a business owner checking their own visibility, search the full answer for your name and its variants, not only the highlighted list.</p>

  <h2>How each engine answered</h2>

  <div class="compare-table-wrap">
  <table class="compare-table">
    <thead><tr><th></th><th>ChatGPT</th><th>Claude</th><th>Gemini</th></tr></thead>
    <tbody>
      <tr><td>Average stored answer length, characters</td><td>4,253</td><td>2,892</td><td>3,578</td></tr>
      <tr><td>Bold spans across the six answers</td><td>117</td><td>101</td><td>78</td></tr>
    </tbody>
  </table>
  </div>

  <p>Claude's stored answers stop at about 3,800 characters, so its length is a lower bound. No immigration firm was named by all three engines.</p>

  <div class="callout teal">
    <div class="callout-label">What a Las Vegas business should do</div>
    <p>Ask each engine your own buyer question, by name of your trade and "Las Vegas", and note which list you are on. Treat the three as separate channels: in event planning, 29 of 30 companies were missing from at least one engine.</p>
    <p>If your firm changed its name or merged, check that every engine has caught up, and that your old and new names point to the same place on your site and your directory profiles.</p>
  </div>""",
))
```
