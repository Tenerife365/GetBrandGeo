# Draft: AI Mode books tables, tickets and beauty appointments

- Queue key: `draft-ai-mode-booking`
- Publish on: 2026-11-26 (queue row `ready from 2026-11-26`)
- Type: trending, practical
- Written 2026-11-06 in a separate session. The brief marked this "after one check": the
  current status in Google's own help or blog. Result: Google's blog post of 17 Nov 2025
  and the current Search help page for AI Mode (footer 2026, no update date) were both
  read on 2026-11-06. They disagree on who has access; the article reports both and says
  we found no 2026 Google announcement that settles it. Check passed on that basis.
  Restaurant booking posts for other countries were seen in search results only and are
  left out.
- Slug and date: the routine replaces every `bg-NNN` and `BG-NNN` with the next slug and
  sets `date` and `date_label` to the publish day. Nothing else is to be rewritten.

## Sources, read 2026-11-06

| # | Source | Grade | What was read there |
|---|---|---|---|
| 1 | Google blog, 17 Nov 2025: https://blog.google/products-and-platforms/products/search/agentic-plans-booking-travel-canvas-ai-mode/ | primary | restaurant reservations, event tickets, beauty and wellness appointments; checks real-time availability across platforms, curated list with direct links, you finish on the partner site; partners OpenTable, Resy, Tock, Ticketmaster, StubHub, SeatGeek, Vivid Seats, Booksy, Fresha, Vagaro; restaurant booking rolling out in the US with no Labs opt-in; tickets and local appointments for all US Labs users; flights and hotels named as future |
| 2 | Google Search Help, "AI Mode" in Search Labs: https://support.google.com/websearch/answer/16296315?hl=en | primary | "Agentic capabilities in AI Mode" experiment covers restaurant reservations, event tickets, beauty and wellness appointments; for US Google AI Pro or AI Ultra subscribers; 18 or older; personal Google Account; Labs opt-in; signed in, Incognito off; no update date on the page |
| 3 | BrandGEO BG-083, BG-108, BG-109 | own published pages | product pages for shopping agents; Google AI Mode quoted a rating or review count in 57 of 111 answers and gave a street address in 77 of 111 |

## Check before publishing

`curl -s -o /dev/null -L -A 'Mozilla/5.0 BrandGEO-source-check' -w '%{http_code}' <url>`
for sources 1 and 2. Both returned 200 on 2026-11-06.

## Entry

```python
ARTICLES_DAILY.append(dict(
    slug="bg-NNN", bid="BG-NNN", date="2026-11-26", date_label="November 26, 2026", read=6,
    tags=["Google AI Mode", "AI Agents", "Local Business"],
    title="Google AI Mode Can Book Tables, Tickets and Beauty Appointments. What a Business Needs",
    h1="AI Mode Can Book a Table. <em>Is Your Business Bookable?</em>",
    h1_plain="AI Mode Can Book a Table. Is Your Business Bookable?",
    subtitle="Google says AI Mode can find open slots for restaurant reservations, event tickets and beauty and wellness appointments across booking partners, then hand the user a short list. What that means for a restaurant, salon or clinic, and why Google's own pages disagree on who can use it.",
    meta_desc="Google AI Mode can check real-time availability for restaurants, tickets and beauty appointments through partners like OpenTable, Booksy and Fresha. What a local business needs.",
    og_desc="AI Mode checks live availability across OpenTable, Resy, Booksy, Fresha, Vagaro and others, then sends the user to book. What a restaurant, salon or clinic needs in place.",
    ld_desc="BrandGEO guide to Google AI Mode's agentic booking for restaurant reservations, event tickets and beauty and wellness appointments, based on Google's own announcement and help page, with practical steps for local businesses.",
    keywords="google ai mode booking, ai mode restaurant reservations, ai mode beauty appointments, booksy fresha vagaro ai mode, agentic booking google search, ai mode local business",
    about=["Google AI Mode", "AI Agents", "Online Booking", "Local Business"],
    findings=[("3", "kinds of booking Google says AI Mode can find: restaurant tables, event tickets, beauty and wellness appointments"),
              ("10", "booking partners Google named, from OpenTable and Resy to Booksy, Fresha and Vagaro"),
              ("Partner site", "where the booking is finished: AI Mode shows options with links, the user completes on the partner"),
              ("2 versions", "of who can use it on Google's own pages: all US Labs users, or US AI Pro and Ultra subscribers")],
    faq=[("Can Google AI Mode book appointments?",
          "Google says it can find them. Per Google's post of 17 November 2025, AI Mode checks real-time availability across booking platforms for restaurant reservations, event tickets and beauty and wellness appointments, shows a curated list with direct links, and the user finishes the booking with the partner."),
         ("Which booking platforms does AI Mode use?",
          "Google named OpenTable, Resy and Tock for restaurants, Ticketmaster, StubHub, SeatGeek and Vivid Seats for events, and Booksy, Fresha and Vagaro for beauty and wellness."),
         ("Who can use AI Mode booking?",
          "Google's pages disagree. The November 2025 post says restaurant booking was rolling out in the US without a Labs opt-in, and tickets and local appointments were open to all US Labs users. The current help page describes it as a Labs experiment for US Google AI Pro and AI Ultra subscribers aged 18 or over."),
         ("What does a local business need for AI Mode to book it?",
          "In practice, a listing on one of the booking partners for its category, with real availability kept up to date there, and accurate business details. If the business is not on a partner AI Mode checks, there is no slot for it to find.")],
    related=[("/bg-083.html", "BG-083", "What to Fix on a Product Page Before an AI Shopping Agent Can Recommend It",
              "The same question for shops: what an agent needs to read."),
             ("/bg-109.html", "BG-109", "How Often AI Engines Give a Street Address or Phone Number for the Firms They Name",
              "How much local detail Google AI Mode already gives about a business."),
             ("/bg-108.html", "BG-108", "How Often AI Engines Quote Star Ratings When They Recommend Local Firms",
              "The ratings AI Mode quotes next to the businesses it names.")],
    cta_h="See what AI Mode says about your business",
    cta_p="Run the free audit on your own domain and read Google AI Mode's answer next to the other engines. No signup and no card.",
    og=dict(
        fname="og-bg-NNN.png",
        kicker="BG-NNN · Google AI Mode",
        lines=[[("AI Mode Can", "w")], [("Book a ", "w"), ("Table", "g")]],
        sub=["Restaurants, tickets and beauty slots.",
             "Is your business bookable?"],
        stats=[("3", "kinds of booking AI Mode can find", "Google, Nov 2025"),
               ("10", "booking partners Google named", "OpenTable to Vagaro"),
               ("77 of 111", "AI Mode answers gave a firm's address", "BrandGEO, 20 US cities"),
               ("2", "versions of who has access", "Google's own pages")],
        footer="No Listing, No Slot",
    ),
    body="""  <p>Most of what AI engines do for a local business is talk about it: name it, describe it, quote its rating. Google's AI Mode has started to do something more direct for a few kinds of business. Ask it for a table for four on Saturday, two concert tickets, or a massage next week, and it can go looking for an actual open slot.</p>

  <p>For a restaurant, a salon or a clinic, that changes the question from "does the AI mention us?" to "can the AI book us?"</p>

  <div class="callout">
    <div class="callout-label">Sources, and what they cannot tell you</div>
    <p>We read <a href="https://blog.google/products-and-platforms/products/search/agentic-plans-booking-travel-canvas-ai-mode/" target="_blank" rel="noopener">Google's announcement of 17 November 2025</a> and <a href="https://support.google.com/websearch/answer/16296315?hl=en" target="_blank" rel="noopener">its current Search help page for AI Mode</a> on 6 November 2026. The two disagree on who can use the feature, and we did not find a 2026 announcement from Google that settles it. We have not tested the booking flow ourselves, and Google publishes no figures on how often it is used.</p>
  </div>

  <h2>What Google says AI Mode does</h2>

  <p>You describe what you want in plain words, with your needs and preferences. AI Mode checks real-time availability across booking platforms and returns a short list of options with direct links. You finish the booking on the partner's site. Google does not complete it inside Search, according to its post.</p>

  <div class="compare-table-wrap">
  <table class="compare-table">
    <thead><tr><th>What can be booked</th><th>Partners Google named</th></tr></thead>
    <tbody>
      <tr><td>Restaurant reservations</td><td>OpenTable, Resy, Tock</td></tr>
      <tr><td>Event tickets</td><td>Ticketmaster, StubHub, SeatGeek, Vivid Seats</td></tr>
      <tr><td>Beauty and wellness appointments</td><td>Booksy, Fresha, Vagaro</td></tr>
    </tbody>
  </table>
  </div>

  <p>The same post describes flight and hotel booking as coming later, not available at the time.</p>

  <h2>Who can use it: two answers from Google</h2>

  <div class="compare-table-wrap">
  <table class="compare-table">
    <thead><tr><th>Google page</th><th>What it says about access</th></tr></thead>
    <tbody>
      <tr><td>Blog post, 17 November 2025</td><td>Restaurant booking rolling out in the US with no Labs opt-in; event tickets and local appointments for all US Labs users</td></tr>
      <tr><td>Search help page, current</td><td>An "Agentic capabilities in AI Mode" experiment in Search Labs for US Google AI Pro and AI Ultra subscribers, 18 or older, signed in with a personal account</td></tr>
    </tbody>
  </table>
  </div>

  <p>Either way, it is a US feature for now, and at least part of it sits behind a Labs opt-in or a paid subscription. The help page adds that Labs experiments are not available to Google Workspace accounts, and that the user must be signed in with Incognito off. That limits how many people see it today. It does not change what a business needs to have in place for when they do.</p>

  <h2>What a business needs for AI Mode to book it</h2>

  <p><strong>Be on a partner it checks.</strong> Google describes AI Mode as checking availability across booking platforms, and names the partners. A salon that takes bookings only by phone, or through a system Google does not check, has no slot for AI Mode to find. If you already use one of the named partners for your category, you are in the pool. If you do not, that is the decision to look at.</p>

  <p><strong>Keep availability real.</strong> The feature is built on real-time availability. A booking calendar that is out of date, or that shows slots you do not honor, now feeds an assistant that hands them to customers. Block holidays and staff absences where the platform can see them.</p>

  <p><strong>Keep the details consistent.</strong> AI Mode already gives a lot of local detail in its answers. In our study of 591 answers to local buyer questions in 20 US cities, Google AI Mode gave a street address for a named firm in 77 of 111 answers (<a href="/bg-109.html">BG-109</a>) and quoted a rating or review count in 57 (<a href="/bg-108.html">BG-108</a>). Your name, address, hours and services on the booking platform, on Google and on your own site should match, so the business it lists and the one it books are clearly the same.</p>

  <p><strong>Make the partner profile worth landing on.</strong> The booking finishes on the partner's site, so that profile is the page a new customer actually sees before they commit: photos, services, prices, reviews. Treat it as part of your storefront, not an afterthought. Reply to reviews there as you would on Google, because a customer comparing two salons in an AI Mode list may well read them.</p>

  <h2>Who this does not reach yet</h2>

  <p>The categories are narrow: restaurants, events, and beauty and wellness. None of the partners Google named is for lawyers, real estate agents, property managers or most other professional services, which is where most of our own research has looked. For those firms AI Mode still recommends and describes; it does not book. That is a reason to watch this, not to ignore it. The step from describing a business to acting for the customer has been taken, in a few categories, by Google.</p>

  <p>It is also different from the product side of agent shopping, which we covered in <a href="/bg-083.html">BG-083</a>. A product page needs machine-readable prices and identifiers. A local service needs a bookable slot on a platform the agent checks.</p>

  <div class="callout teal">
    <div class="callout-label">What to do with this</div>
    <p>If you run a restaurant, salon, spa or similar business in the US: check whether you are on one of the booking partners Google named for your category, and whether your availability there is accurate this week. Then check that your name, address and hours match across that platform, Google and your site.</p>
    <p>If you are in another category, ask AI Mode the question your customers ask and read what it says about you today. The booking step may reach your category later; the description already has.</p>
  </div>""",
))
```
