# Draft: AI visibility in Orlando, where three engines agree

- Queue key: `draft-city-orlando` (row 27, city study, counts toward the two-a-week city cadence)
- Publish on: 2026-11-20 (queue row `ready from 2026-11-20`)
- Type: city study, third basis (November 2026 collection)
- Written 2026-11-08 in a separate session (hub ruling of 2026-11-08: city studies are
  written as drafts, the routine only publishes). Every figure below comes from read-only
  SQL against `duiyifepitvugyulobqm` run on 2026-11-08, plus a hand read of the contexts
  named in "Hand read".
- Slug and date: the routine replaces every `bg-NNN` and `BG-NNN` with the next slug and
  sets `date` and `date_label` to the publish day. Nothing else is to be rewritten.

## Basis

Client 66 (Research: Orlando), `status = 'ok'`, 18 answers: 6 questions x 3 engines, all
collected 2026-11-06. Models read from `ai_results.model`: chatgpt gpt-5.5, claude
claude-sonnet-4-6, gemini gemini-2.5-flash.

| Position | Question |
|---|---|
| 1 | Best personal injury law firms in Orlando |
| 2 | Best real estate agents for buying a home in Orlando |
| 3 | Top-rated property management companies in Orlando |
| 4 | Best immigration lawyers in Orlando |
| 5 | Best timeshare and vacation ownership attorneys in Orlando |
| 6 | Best vacation rental management companies in Orlando |

## Queries

1. Basis and per-engine shape: the query in `drafts/2026-11-17-draft-city-lasvegas.md`
(query 1) with `client_id = 66`. Result: chatgpt gpt-5.5 6 answers, average 4,676
characters, 149 bold spans; claude claude-sonnet-4-6 6, 2,900, 122; gemini
gemini-2.5-flash 6, 4,124, 86. All 2026-11-06.

2. The brief's exact bold-name count, `client_id = 66`. Named by all three per question:
1, 0, 2, 0, 0, 0 (3 in total, matching the pre-check).

3. Named anywhere: the core-name query in `drafts/2026-11-12-draft-city-austin.md`
(query 3) with `client_id = 66`, suffix list ending `|orlando|florida|fl`, and spans
starting with `#` excluded. Also run with `n = 2` to list names shared by two engines.

## Hand read (2026-11-08)

| Question | Named by all three, after the hand read | Notes |
|---|---|---|
| 1 Personal injury | 1, named after its founders (count only) | 5 more firms named by two engines, all named after people |
| 2 Real estate agents | 1, an individual agent (count only) | |
| 3 Property management | 2: Central Florida Property Management, TrustHome Properties | "central" also matched "Central Florida" as a region; the firm itself is in bold in all three |
| 4 Immigration | 0 | |
| 5 Timeshare and vacation ownership law | 1, named after its founder (count only) | |
| 6 Vacation rental management | 1: Casiola (ChatGPT "Casiola Orlando", Claude "Casiola Vacation Homes", Gemini "Casiola") | "Orlando vacation" matched a generic phrase; 6 more companies named by two engines |

Property management, firms put in bold (ratings, fee labels and advice removed by hand):

| | ChatGPT | Claude | Gemini | All three answers together |
|---|---|---|---|---|
| Property managers named in bold | 10 | 9 | 12 | 22 different companies |

Of the 22: 2 named by all three, 5 by two, 15 by one engine only.

Vacation rental management, named by two engines: Awning, Grand Welcome, Jeeves Florida
Rentals and ResortShare (Claude and Gemini), Funstay (ChatGPT and Gemini), Magical
Vacation Homes (ChatGPT and Claude).

Totals: 6 firms named by all three engines across the six questions: 2 property
managers, 1 vacation rental manager, 1 personal injury firm, 1 timeshare law firm, 1 real
estate agent. 0 immigration firms.

## Check before publishing

None needed beyond the routine's own validation: no external source, and the three linked
pages (bg-016, bg-113, ai-visibility-for-losangeles) exist on brandgeo/web.

## Entry

```python
ARTICLES_DAILY.append(dict(
    slug="bg-NNN", bid="BG-NNN", date="2026-11-20", date_label="November 20, 2026", read=6,
    tags=["Original Research", "US Cities", "Orlando"],
    title="AI Visibility in Orlando: Six Questions, Three Engines, Six Firms in Common",
    h1="AI Visibility in Orlando: <em>Six Firms in Common</em> Across Three Engines",
    h1_plain="AI Visibility in Orlando: Six Firms in Common Across Three Engines",
    subtitle="We asked ChatGPT, Claude and Gemini six local buyer questions about Orlando. Across all six, only 6 firms were named by all three engines, never more than 2 per question. In vacation rental management, the question written for this city, one company made every list.",
    meta_desc="What ChatGPT, Claude and Gemini recommend in Orlando: 18 answers to six local buyer questions, and the only 6 firms all three engines named.",
    og_desc="Six Orlando buyer questions, three AI engines, 18 answers: 6 firms on all three lists, and 2 of 22 property managers.",
    ld_desc="BrandGEO study of 18 answers from ChatGPT, Claude and Gemini to six Orlando buyer questions (personal injury, real estate agents, property management, immigration, timeshare law, vacation rental management), collected November 6, 2026, counting the firms all three engines named.",
    keywords="ai visibility orlando, chatgpt orlando vacation rental management, orlando property management ai, orlando timeshare attorneys ai search, local business ai recommendations orlando",
    about=["AI Visibility Research", "Orlando", "Local Search", "Engine Comparison"],
    findings=[("6", "firms were named by all three engines across six Orlando questions"),
              ("2 of 22", "property managers named by any engine were named by all three"),
              ("1", "vacation rental manager on all three lists: Casiola"),
              ("0", "immigration firms on all three lists")],
    faq=[("Which Orlando businesses do AI engines agree on?",
          "In our November 6, 2026 answers, all three engines named Central Florida Property Management, TrustHome Properties and Casiola, plus one personal injury firm, one timeshare law firm and one real estate agent. No immigration firm appeared in all three answers."),
         ("How many property managers did the engines name?",
          "22 different companies between them: 10 from ChatGPT, 9 from Claude and 12 from Gemini. Two were on all three lists and 15 on only one."),
         ("How were the firms counted?",
          "We took every name an engine put in bold, then checked by hand whether each of the three answers to the same question named that firm anywhere, in bold or in running text. Ratings, fee labels and advice were removed."),
         ("Is this a ranking of Orlando firms?",
          "No. It counts what three engines wrote on one day. It does not say which firm is better, and it does not say why an engine named one firm and not another.")],
    related=[("/bg-016.html", "BG-016", "Cross-Engine Consensus: When AI Engines Agree, and When They Don't",
              "The wider study of when engines name the same firm."),
             ("/bg-113.html", "BG-113", "How Often AI Engines Put a National Brand Next to Local Property Managers",
              "What happens in property management answers across 20 cities."),
             ("/ai-visibility-for-losangeles.html", "Los Angeles", "AI Visibility in Los Angeles",
              "The same kind of city read, for Los Angeles.")],
    cta_h="See what each engine says about your Orlando business",
    cta_p="Run the free audit on your own domain and read every engine's answer side by side. No signup and no card.",
    og=dict(
        fname="og-bg-NNN.png",
        kicker="BG-NNN · Original Research",
        lines=[[("AI Visibility", "w")], [("in ", "w"), ("Orlando", "g")]],
        sub=["Six buyer questions, three engines,",
             "18 answers, November 2026."],
        stats=[("6", "firms named by all three engines", "Orlando"),
               ("2 of 22", "property managers on all three", "Orlando"),
               ("1", "vacation rental manager on all three", "Orlando"),
               ("0", "immigration firms on all three", "Orlando")],
        footer="Three Engines, Three Lists",
    ),
    body="""  <p>Ask three AI engines the same question about Orlando and you get three lists. We wanted to know how much those lists overlap, because a business that appears on only one of them is invisible to buyers who use the other two.</p>

  <p>On November 6, 2026 we put six local buyer questions about Orlando to ChatGPT, Claude and Gemini: a personal injury law firm, real estate agents, a property management company, an immigration lawyer, a timeshare and vacation ownership attorney, and a vacation rental management company. Then we counted the firms that all three engines named.</p>

  <div class="callout">
    <div class="callout-label">How this was measured, and what it cannot tell you</div>
    <p>18 answers: six questions, three engines (ChatGPT on gpt-5.5, Claude on claude-sonnet-4-6, Gemini on gemini-2.5-flash), all collected on November 6, 2026. We took every name an engine put in bold, then read each of the three answers to the same question to see whether it named that firm anywhere, in bold or in running text. Ratings, fee labels and advice were removed. Firms named after a person are reported as a count, not by name.</p>
    <p>An exact match on bold text finds 3 firms on all three lists; the hand read finds 6. This is one day of answers. It does not rank anyone and it does not say why an engine chose a firm.</p>
  </div>

  <h2>Where the three engines agree</h2>

  <div class="compare-table-wrap">
  <table class="compare-table">
    <thead><tr><th>Question</th><th>Firms named by all three engines</th></tr></thead>
    <tbody>
      <tr><td>Top-rated property management companies in Orlando</td><td>2</td></tr>
      <tr><td>Best vacation rental management companies in Orlando</td><td>1</td></tr>
      <tr><td>Best timeshare and vacation ownership attorneys in Orlando</td><td>1</td></tr>
      <tr><td>Best personal injury law firms in Orlando</td><td>1</td></tr>
      <tr><td>Best real estate agents for buying a home in Orlando</td><td>1</td></tr>
      <tr><td>Best immigration lawyers in Orlando</td><td>0</td></tr>
      <tr><td><strong>Total</strong></td><td><strong>6</strong></td></tr>
    </tbody>
  </table>
  </div>

  <p>No question produced more than two firms in common. Five of the six produced at least one, which is more than nothing, but the lists around those one or two shared names were mostly different.</p>

  <h2>Property management: 22 names, 2 in common</h2>

  <div class="compare-table-wrap">
  <table class="compare-table">
    <thead><tr><th></th><th>ChatGPT</th><th>Claude</th><th>Gemini</th><th>All three answers together</th></tr></thead>
    <tbody>
      <tr><td>Property managers named</td><td>10</td><td>9</td><td>12</td><td>22 different companies</td></tr>
    </tbody>
  </table>
  </div>

  <p>All three engines named <strong>Central Florida Property Management</strong> and <strong>TrustHome Properties</strong>. Five more companies were named by two engines and 15 by one engine only. An Orlando landlord asking one engine would see nine to twelve names; asking all three would surface twenty-two.</p>

  <h2>Vacation rental management: one company on every list</h2>

  <p>This is the question written for Orlando's market. All three engines named <strong>Casiola</strong>, each in its own way: ChatGPT wrote "Casiola Orlando", Claude "Casiola Vacation Homes" and Gemini just "Casiola". Six more companies were named by two engines: <strong>Awning</strong>, <strong>Grand Welcome</strong>, <strong>Jeeves Florida Rentals</strong> and <strong>ResortShare</strong> by Claude and Gemini, <strong>Funstay</strong> by ChatGPT and Gemini, and <strong>Magical Vacation Homes</strong> by ChatGPT and Claude. None of those six reached the third engine.</p>

  <h2>Law firms and agents</h2>

  <p>In personal injury, one firm made all three lists, and five more were named by two engines; all six carry people's names, so we report them as counts. One timeshare law firm and one real estate agent were also named by all three. No immigration firm was.</p>

  <h2>Exact match against the hand read, question by question</h2>

  <div class="compare-table-wrap">
  <table class="compare-table">
    <thead><tr><th>Question</th><th>Exact bold match</th><th>After the hand read</th></tr></thead>
    <tbody>
      <tr><td>Personal injury</td><td>1</td><td>1</td></tr>
      <tr><td>Real estate agents</td><td>0</td><td>1</td></tr>
      <tr><td>Property management</td><td>2</td><td>2</td></tr>
      <tr><td>Immigration</td><td>0</td><td>0</td></tr>
      <tr><td>Timeshare and vacation ownership law</td><td>0</td><td>1</td></tr>
      <tr><td>Vacation rental management</td><td>0</td><td>1</td></tr>
      <tr><td><strong>Total</strong></td><td><strong>3</strong></td><td><strong>6</strong></td></tr>
    </tbody>
  </table>
  </div>

  <p>Half of the firms the engines agreed on were invisible to the exact count. The exact count only matches a name written identically in all three answers, so where the hand read added a firm, the name was not written identically.</p>

  <h2>How much of the property management list was shared</h2>

  <p>Of the 22 property management companies, 2 were on all three lists (9%), 5 on two (23%) and 15 on one only (68%). The immigration question added nothing to any of these tallies: no firm was common to all three answers.</p>

  <h2>Why counting bold names is not enough</h2>

  <p>Most AI visibility tools, ours included, start by reading the names an engine puts in bold. Here that finds 3 firms on all three lists; reading the answers finds 6. The difference is in three questions: the three spellings of Casiola, one real estate agent and one timeshare law firm, each of which an exact match on bold text did not connect across the three answers. For a business owner checking their own visibility, search the full answer for your name and its variants, not only the highlighted list.</p>

  <h2>How each engine answered</h2>

  <div class="compare-table-wrap">
  <table class="compare-table">
    <thead><tr><th></th><th>ChatGPT</th><th>Claude</th><th>Gemini</th></tr></thead>
    <tbody>
      <tr><td>Average stored answer length, characters</td><td>4,676</td><td>2,900</td><td>4,124</td></tr>
      <tr><td>Bold spans across the six answers</td><td>149</td><td>122</td><td>86</td></tr>
    </tbody>
  </table>
  </div>

  <p>ChatGPT bolded the most, but a bold span is not always a firm: fee labels, ratings and advice were removed by hand. Claude's stored answers stop at about 3,800 characters, so its length is a lower bound.</p>

  <div class="callout teal">
    <div class="callout-label">What an Orlando business should do</div>
    <p>Ask each engine your own buyer question, by name of your trade and "Orlando", and note which list you are on. Treat the three as separate channels: in property management, 20 of the 22 companies named were missing from at least one engine.</p>
    <p>Pick one form of your name and use it everywhere: your site, your Google Business Profile, your booking and directory listings. Casiola made all three lists under three different names; a smaller firm may not be matched so easily.</p>
  </div>""",
))
```
