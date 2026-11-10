# Draft: AI visibility in Portland, Oregon, where three engines agree

- Queue key: `draft-city-portland` (row 25, city study, counts toward the two-a-week city cadence)
- Publish on: 2026-11-14 (queue row `ready from 2026-11-14`)
- Type: city study, third basis (November 2026 collection)
- Written 2026-11-08 in a separate session (hub ruling of 2026-11-08: city studies are
  written as drafts, the routine only publishes). Every figure below comes from read-only
  SQL against `duiyifepitvugyulobqm` run on 2026-11-08, plus a hand read of the contexts
  named in "Hand read".
- Slug and date: the routine replaces every `bg-NNN` and `BG-NNN` with the next slug and
  sets `date` and `date_label` to the publish day. Nothing else is to be rewritten.

## Basis

Client 65 (Research: Portland), `status = 'ok'`, 18 answers: 6 questions x 3 engines, all
collected 2026-11-06. Models read from `ai_results.model`: chatgpt gpt-5.5, claude
claude-sonnet-4-6, gemini gemini-2.5-flash.

| Position | Question |
|---|---|
| 1 | Best personal injury law firms in Portland, Oregon |
| 2 | Best real estate agents for buying a home in Portland, Oregon |
| 3 | Top-rated property management companies in Portland, Oregon |
| 4 | Best immigration lawyers in Portland, Oregon |
| 5 | Best intellectual property and trademark law firms in Portland, Oregon |
| 6 | Best craft breweries in Portland, Oregon |

## Queries

1. Basis check:

```sql
select r.llm, r.model, count(*) as rows, min(r.checked_at)::date, max(r.checked_at)::date
from ai_results r where r.client_id = 65 and r.status = 'ok' group by 1, 2 order by 1;
```
Result: chatgpt gpt-5.5 6, claude claude-sonnet-4-6 6, gemini gemini-2.5-flash 6, all 2026-11-06.

2. The brief's bold-name count (topics.md, briefs 24 to 29), with `client_id = 65`:
exact bold strings named by all three per question: 0, 0, 1, 0, 0, 4.

3. Named anywhere in each answer: the same query as in
`drafts/2026-11-12-draft-city-austin.md` (query 3), with `client_id = 65` and the suffix
list extended with `brewing company|brewing|brewery|beer co|beer|portland|oregon`.

## Hand read (2026-11-08)

Every name the queries returned was read in context in all three answers.

| Question | Named by all three, after the hand read | Dropped |
|---|---|---|
| 1 Personal injury | 2: Bridge City Law, and one firm named after its founder (count only) | |
| 2 Real estate agents | 0 | |
| 3 Property management | 1: Sleep Sound Property Management | |
| 4 Immigration | 0 | "Portland immigration" and "Oregon immigration" matched generic phrases ("Portland immigration lawyers", a state directory), not one firm |
| 5 IP and trademark law | 7, all named after founding partners (count only). Gemini named one of the seven only in running text, and another in a bold line with an "IP Group" suffix | |
| 6 Craft breweries | 4: Breakside Brewery, Great Notion Brewing, Ruse Brewing, Wayfinder Beer | |

Breweries, bold names per engine (beer names and award labels removed by hand):

| | ChatGPT | Claude | Gemini | All three answers together |
|---|---|---|---|---|
| Breweries put in bold | 10 | 9 | 17 | 21 different breweries |

Of the 21: 4 named by all three, 7 by two, 10 by one engine only (7 of those only by Gemini).

Totals: 14 firms named by all three engines across the six questions: 7 IP law firms,
4 breweries, 2 personal injury firms, 1 property manager. 0 real estate agents, 0
immigration firms.

## Check before publishing

None needed beyond the routine's own validation: no external source, and the three linked
pages (bg-016, bg-113, ai-visibility-for-losangeles) exist on brandgeo/web.

## Entry

```python
ARTICLES_DAILY.append(dict(
    slug="bg-NNN", bid="BG-NNN", date="2026-11-14", date_label="November 14, 2026", read=6,
    tags=["Original Research", "US Cities", "Portland"],
    title="AI Visibility in Portland: Engines Agree on IP Lawyers and Breweries, Not on Agents",
    h1="AI Visibility in Portland: Engines Agree on <em>IP Lawyers and Breweries</em>",
    h1_plain="AI Visibility in Portland: Engines Agree on IP Lawyers and Breweries",
    subtitle="We asked ChatGPT, Claude and Gemini six local buyer questions about Portland, Oregon. 14 firms were named by all three engines, half of them intellectual property law firms. No real estate agent and no immigration firm made all three lists.",
    meta_desc="What ChatGPT, Claude and Gemini recommend in Portland, Oregon: 18 answers to six local buyer questions, and the 14 firms all three engines named.",
    og_desc="Six Portland buyer questions, three AI engines, 18 answers: 7 IP law firms and 4 breweries on all three lists, and no real estate agent.",
    ld_desc="BrandGEO study of 18 answers from ChatGPT, Claude and Gemini to six Portland, Oregon buyer questions (personal injury, real estate agents, property management, immigration, IP and trademark law, craft breweries), collected November 6, 2026, counting the firms all three engines named.",
    keywords="ai visibility portland oregon, chatgpt portland breweries, best craft breweries portland ai, portland ip law firms ai search, portland property management ai, local business ai recommendations portland",
    about=["AI Visibility Research", "Portland", "Local Search", "Engine Comparison"],
    findings=[("14", "firms were named by all three engines across six Portland questions"),
              ("7", "of them are intellectual property and trademark law firms"),
              ("4 of 21", "craft breweries named by any engine were named by all three"),
              ("0", "real estate agents or immigration firms on all three lists")],
    faq=[("Which Portland businesses do AI engines agree on?",
          "In our November 6, 2026 answers, all three engines named 7 intellectual property law firms, 4 craft breweries, 2 personal injury firms and 1 property manager. On real estate agents and immigration lawyers, no firm appeared in all three answers."),
         ("Which breweries did all three engines name?",
          "Breakside Brewery, Great Notion Brewing, Ruse Brewing and Wayfinder Beer. Between them the three engines named 21 different breweries, and 10 of those appeared in only one answer."),
         ("How were the firms counted?",
          "We took every name an engine put in bold, then checked by hand whether each of the three answers to the same question named that firm anywhere, in bold or in running text. Beer names, awards and advice labels were removed."),
         ("Is this a ranking of Portland firms?",
          "No. It counts what three engines wrote on one day. It does not say which firm is better, and it does not say why an engine named one firm and not another.")],
    related=[("/bg-016.html", "BG-016", "Cross-Engine Consensus: When AI Engines Agree, and When They Don't",
              "The wider study of when engines name the same firm."),
             ("/bg-113.html", "BG-113", "How Often AI Engines Put a National Brand Next to Local Property Managers",
              "What happens in property management answers across 20 cities."),
             ("/ai-visibility-for-losangeles.html", "Los Angeles", "AI Visibility in Los Angeles",
              "The same kind of city read, for Los Angeles.")],
    cta_h="See what each engine says about your Portland business",
    cta_p="Run the free audit on your own domain and read every engine's answer side by side. No signup and no card.",
    og=dict(
        fname="og-bg-NNN.png",
        kicker="BG-NNN · Original Research",
        lines=[[("AI Visibility", "w")], [("in ", "w"), ("Portland", "g")]],
        sub=["Six buyer questions, three engines,",
             "18 answers, November 2026."],
        stats=[("14", "firms named by all three engines", "Portland"),
               ("7", "IP law firms on all three lists", "Portland"),
               ("4 of 21", "breweries on all three lists", "Portland"),
               ("0", "real estate agents on all three", "Portland")],
        footer="Lawyers and Brewers Agree",
    ),
    body="""  <p>Ask three AI engines the same question about Portland and you get three lists. We wanted to know how much those lists overlap, because a business that appears on only one of them is invisible to buyers who use the other two.</p>

  <p>On November 6, 2026 we put six local buyer questions about Portland, Oregon to ChatGPT, Claude and Gemini: a personal injury law firm, real estate agents, a property management company, an immigration lawyer, an intellectual property and trademark law firm, and a craft brewery. Then we counted the firms that all three engines named.</p>

  <div class="callout">
    <div class="callout-label">How this was measured, and what it cannot tell you</div>
    <p>18 answers: six questions, three engines (ChatGPT on gpt-5.5, Claude on claude-sonnet-4-6, Gemini on gemini-2.5-flash), all collected on November 6, 2026. We took every name an engine put in bold, then read each of the three answers to the same question to see whether it named that firm anywhere, in bold or in running text. Headings, beer names and award labels were removed. Firms named after a person are reported as a count, not by name.</p>
    <p>An exact match on bold text alone finds only 5 firms on all three lists, because engines shorten names, add suffixes such as "IP Group", or mention a firm in a sentence without bold. The hand read finds 14. This is one day of answers. It does not rank anyone and it does not say why an engine chose a firm.</p>
  </div>

  <h2>Where the three engines agree</h2>

  <div class="compare-table-wrap">
  <table class="compare-table">
    <thead><tr><th>Question</th><th>Firms named by all three engines</th></tr></thead>
    <tbody>
      <tr><td>Best intellectual property and trademark law firms in Portland</td><td>7</td></tr>
      <tr><td>Best craft breweries in Portland</td><td>4</td></tr>
      <tr><td>Best personal injury law firms in Portland</td><td>2</td></tr>
      <tr><td>Top-rated property management companies in Portland</td><td>1</td></tr>
      <tr><td>Best real estate agents for buying a home in Portland</td><td>0</td></tr>
      <tr><td>Best immigration lawyers in Portland</td><td>0</td></tr>
      <tr><td><strong>Total</strong></td><td><strong>14</strong></td></tr>
    </tbody>
  </table>
  </div>

  <h2>Intellectual property law: the strongest overlap</h2>

  <p>Seven IP and trademark firms appeared in all three answers. All seven carry the names of founding partners, so we report them as a count. What stands out is how they were named: Gemini put most of them in bold, but mentioned one only in a closing sentence listing "other reputable firms". A buyer reading quickly would see it; a tool that counts bold names would not.</p>

  <h2>Craft breweries: four on every list, ten on only one</h2>

  <div class="compare-table-wrap">
  <table class="compare-table">
    <thead><tr><th></th><th>ChatGPT</th><th>Claude</th><th>Gemini</th><th>All three answers together</th></tr></thead>
    <tbody>
      <tr><td>Breweries named</td><td>10</td><td>9</td><td>17</td><td>21 different breweries</td></tr>
    </tbody>
  </table>
  </div>

  <p>All three engines named <strong>Breakside Brewery</strong>, <strong>Great Notion Brewing</strong>, <strong>Ruse Brewing</strong> and <strong>Wayfinder Beer</strong>. Seven more were named by two engines and ten by one only, seven of those by Gemini alone. A brewery outside the shared four was on, at most, two of the three lists.</p>

  <h2>Personal injury and property management</h2>

  <p>Two personal injury firms made all three lists: <strong>Bridge City Law</strong> and one firm named after its founder. In property management, one company did: <strong>Sleep Sound Property Management</strong>. Six more property managers were named by two engines each, so the lists were close in this category without meeting. The same pattern held one level down in personal injury, where two more firms were named by two engines each, and in IP law, where one more firm was named by ChatGPT and Claude but not by Gemini.</p>

  <h2>Why counting bold names is not enough</h2>

  <p>Most AI visibility tools, ours included, start by reading the names an engine puts in bold. On these 18 answers that alone finds 5 firms on all three lists; reading the answers finds 14. Seven of the nine missing firms are in intellectual property law. Gemini wrote three of those firms with an "IP Group" suffix after the name, and it named one only in its closing sentence, without bold. ChatGPT wrote "Breakside" in one place and "Breakside Brewery" in another, and "Wayfinder" next to "Wayfinder Beer". None of these firms is missing from the answers; they are missing from a count that trusts the formatting.</p>

  <p>For a business owner checking their own visibility, the lesson is simple: search the full answer for your name and its variants, not only the highlighted list.</p>

  <h2>How each engine answered</h2>

  <div class="compare-table-wrap">
  <table class="compare-table">
    <thead><tr><th></th><th>ChatGPT</th><th>Claude</th><th>Gemini</th></tr></thead>
    <tbody>
      <tr><td>Average stored answer length, characters</td><td>4,924</td><td>2,776</td><td>3,699</td></tr>
      <tr><td>Bold spans across the six answers</td><td>185</td><td>111</td><td>97</td></tr>
    </tbody>
  </table>
  </div>

  <p>ChatGPT bolded the most, 56 spans in the IP law answer alone, but many of its bold spans were descriptive labels such as "IP litigation" or "IP boutique work", not firms. Claude's stored answers stop at about 3,800 characters, so its length is a lower bound. Gemini bolded the least overall, yet it named the most breweries, 17.</p>

  <h2>What does not show up</h2>

  <p>No real estate agent and no immigration firm was named by all three engines. The words "Portland immigration" appeared in all three immigration answers, but no single firm did: the names did not repeat from one engine to the next. <a href="/bg-016.html">BG-016</a> looks at when engines agree in general.</p>

  <div class="callout teal">
    <div class="callout-label">What a Portland business should do</div>
    <p>Ask each engine your own buyer question, by name of your trade and "Portland, Oregon", and note which list you are on. Treat the three as separate channels: even among breweries, 17 of the 21 named were missing from at least one engine.</p>
    <p>Check how each engine writes your name. If one engine adds a suffix, shortens your name or mentions you only in passing, make your full name appear the same way on your site, your directory profiles and your Google Business Profile.</p>
  </div>""",
))
```
