# Threads setup, ordered checklist

Everything on this list needs Constantin. Nothing on it could be done from this
session: it all requires being logged into Instagram or Threads, and no agent in
this package logs into anything or enters a credential into any field.

Anything that could be decided or verified without an account has already been
done and is **not** on this list. The bio is written and counted, the avatar file
is chosen and its circular crop measured, the category is decided, the link is
decided, the copy is written and every post is under the character cap.

**Do the steps in this order.** Steps 1 to 5 are Instagram, and several Threads
fields either come from Instagram or get overwritten by it, so doing Threads
first means doing parts of it twice.

Values referenced below are in `PROFILE.md`. Do not retype them from memory.

---

## Part A. Instagram, because Threads reads from it

### 1. Confirm which Instagram account the Threads profile was created from

Instagram app > profile tab > tap the username at the top to see the account
list, and note which one is signed in.

This matters because a Threads profile is bound to exactly one Instagram
account, permanently. If the Threads account was created from a personal
account, everything below still works, but step 3 becomes mandatory rather than
recommended.

### 2. Write down the actual handle

Instagram > profile > the username shown under the avatar.

**This is also the Threads handle. There is no separate one.** Record it in
`PROFILE.md` section 2, replacing the target. If it is not `getbrandgeo`, decide
now whether to change it, because step 4 is the only cheap moment to do so.

### 3. Convert to a professional account, if it is not already one

Instagram > profile > hamburger menu (top right) > **Settings and privacy** >
**Account type and tools** > **Switch to professional account** > choose
**Business** (not Creator).

Needed for three separate reasons, only the first of which is cosmetic:

- The Category field in step 5 does not exist on a personal account.
- Insights are unavailable on a personal account, which removes the measurement
  in `LAUNCH-PLAN.md` section 7.
- Third-party scheduling tools reach the account through the Threads API, which
  expects a professional account.

### 4. Set the username, only if step 2 said to change it

Instagram > profile > **Edit profile** > **Username**.

**This renames both apps at once and breaks every saved link to either.** Do it
now, before any post exists, or do not do it at all. There is no good later
moment.

### 5. Set the Category

Instagram > profile > **Edit profile** > **Page** or **Category** (the label
differs by app version) > set to:

```
Software company
```

Reasoning and the rejected alternatives are in `PROFILE.md` section 5. This
renders as a grey label under the display name on the **Threads** profile, which
is the only reason it is being set.

---

## Part B. Threads

### 6. Verify the field-ownership table before editing anything

Threads app > profile tab > **Edit profile**.

Look at which fields the screen actually offers, and check them against the
table in `PROFILE.md` section 1. Three rows there are marked medium confidence
because Meta has moved these fields between the two apps more than once and no
agent can check a live app.

Specifically, answer these two:

- Does the Edit profile screen let you change the **profile photo** here? If it
  does, does changing it also change Instagram's?
- Is there an **Import from Instagram** button on this screen?

Correct `PROFILE.md` section 1 if the app disagrees with it. **The app wins.**

### 7. Do not press "Import from Instagram"

If the button exists, leave it alone from here on.

It overwrites the Threads name, bio and link with whatever Instagram holds.
Pressed after step 9, it silently replaces the 145-character bio with
Instagram's, and nothing warns you.

### 8. Set the display name

Threads > **Edit profile** > **Name**:

```
BrandGEO
```

Nothing after it. No qualifier, no pipe, no tagline. Reasoning in `PROFILE.md`
section 2.

### 9. Set the bio

Threads > **Edit profile** > **Bio**. Paste exactly, as one line:

```
We ask seven AI engines the buyer questions your customers ask, then publish what comes back. Including the runs where our own code got it wrong.
```

145 characters against a 150 limit, counted programmatically.

**Paste it, do not retype it.** Retyping tends to produce a curly apostrophe,
and Threads counts emoji and multi-byte characters as UTF-8 bytes rather than as
one character each. This bio is pure ASCII, which is what makes 145 characters
and 145 bytes the same number and keeps the count trustworthy.

### 10. Set the link

Threads > **Edit profile** > **Link**:

```
https://getbrandgeo.com
```

Bare domain. No UTM parameters, no path. Reasoning in `PROFILE.md` section 4.

### 11. Set the profile photo

Threads > **Edit profile** > tap the avatar. Upload:

```
docs/growth/brand-kit-2026-07-29/png/mark-square/brandgeo-mark-canvas-512.png
```

512 x 512, background `#0a0b0e`. Verified to lose zero art pixels to the
circular crop, with 6.7% clearance.

**Check the crop preview before confirming.** If the app offers a pinch-to-zoom
crop, leave it at the default full-frame. Zooming in is what would clip the
mark, and the file is already sized so that the default is correct.

If step 6 found that this also changes the Instagram photo, that is fine and
intended. The same file is correct for both.

---

## Part C. Settings that decide whether anyone sees the account

These are not cosmetic. Three of the four directly change reach, and the
defaults on a new account are not all correct.

### 12. Confirm the profile is public

Threads > hamburger menu > **Settings** > **Privacy** > **Private profile** must
be **OFF**.

A private Threads profile is invisible to non-followers, which on an account
with zero followers means invisible to everyone. If this is on, nothing else in
this package matters.

### 13. Set who can reply, and who can quote

Threads > **Settings** > **Privacy**:

- **Who can reply** or **Reply control**: set to **Anyone**.
- **Who can quote**: set to **Anyone**.

Replies are the whole growth mechanic on this channel in week one, and the Day 5
post exists solely to collect them. "Profiles you follow" on a new account
following almost nobody means a reply-bait post that nobody is permitted to
reply to.

Note that reply control is also settable **per post** in the composer. Leave the
account default at Anyone and do not narrow it on any post in this plan.

### 14. Decide on Fediverse sharing

Threads > **Settings** > **Account** > **Fediverse sharing**.

Turning it on publishes posts to Mastodon and other ActivityPub servers, which
adds distribution outside Meta. It also means replies arrive from outside
Threads and that deleting a post on Threads does not reliably remove copies
elsewhere.

**This is a decision, not a recommendation.** For an account whose posts are
research findings with dates attached, the durability of a copy is mostly
harmless. For an account that publishes a correction to its own data later, it
is not. Constantin's call.

### 15. Turn off "Hidden Words" auto-filtering, or at least look at it

Threads > **Settings** > **Hidden Words** > **Hide more comments** and the
offensive-word filter.

On by default. It silently hides replies matching its filters, including from
the account owner's own view. On the Day 5 post, whose entire output is the
reply thread, a filter quietly removing replies looks like the post failing.
Look at what it is set to before Day 5, not after.

---

## Part D. Before the first post

### 16. Fix the stale link preview, or accept the fallback

`brandgeo/web/index.html` line 25 has an `og:description` naming five engines:

> "See how visible your brand is across ChatGPT, Gemini, Claude, Perplexity, and
> Google AI Mode."

The lineup has been seven since 2026-07-29. Threads builds its link preview card
from this tag, so the Day 7 post would say seven in the copy with a card
underneath saying five.

**This is not fixed here.** `brandgeo/web/` is outside this task's write scope
and belongs to `bg-web`. Two options:

- Have `bg-web` update the `og:description` before Day 7. It is a one-line
  change to a meta tag and needs a cPanel deploy to take effect.
- Or run the Day 7 fallback in `LAUNCH-PLAN.md` section 5, which posts the same
  copy without a link and moves the link post to Day 8.

Note that Meta caches Open Graph data. If the tag is fixed, the card may still
render the old text for a while.

### 17. Release the batch

Every post in `POSTS.md` is a draft. Nothing in this package has been posted,
scheduled, or sent, and no agent here will do so.

Approving Day 1 is not approving Day 14. The plan is written so each day can be
released on its own.

---

## What is deliberately not on this list

- **Anything requiring a password.** No agent in this package logs into
  Instagram, Threads, or Meta, or types a credential into any field. Every step
  above is performed by Constantin in the app.
- **Scheduling.** Threads posts can be scheduled through the API by a third-party
  tool, but a fourteen-post plan on a cold account should be posted by hand:
  half its value is replying inside the first hour, which a scheduler does not
  do.
- **Anything already decided.** The bio, avatar, link, category, display name and
  all fourteen days of copy were produced and verified in this session and need
  no decision from Constantin beyond approval.
