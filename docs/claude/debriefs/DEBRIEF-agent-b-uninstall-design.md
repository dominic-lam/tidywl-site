STATUS: DONE (all four steps; the script is byte-identical to agent-a-uninstall-page)

# Debrief: agent-b-uninstall-design

The uninstall page's look, reviewed against Apple's Human Interface Guidelines (the `apple-design-hig` skill) and
restyled inside the Schoger look of `_includes/styles-leaver.html`. Desktop only. The script is not touched.

Screenshots live outside the repo, in
`/private/tmp/claude-501/-Users-dominiclam-WebStormProjects-tidywl/ff6f4808-2c64-446e-bed6-8736c69371b2/scratchpad/design/shots/`
(`before-*.png`, `after-*.png`), taken from a local Jekyll build on port 4201 with every `/api/` call answered
locally, so no visit reached live data.

## Progress

- Step 1 (before shots and audit): done. Five `before-*.png` shots; audit below.
- Step 2 (the first screen): done. Dominic's photo in the byline, the ledger across the card, a 40px Rate button,
  the fine print as the receipt's stub, secondary text up to 11.4 to 12.25px at the 1440 root. Details below.
- Step 3 (the rest): done. The reasons in a three-column grid, the reply signed with the photo, larger reply and
  form text, a four-line note box, an icon of its own for the reinstall line, more room around each section.
- Step 4 (verify): done. Script diff empty, ids and data attributes identical, template tests 6 of 6, every
  after shot looked at; one fix found on the way (the sticky bar's cover). Details below.

## Step 1: the audit, worst first

Measured at 1440 x 900, where the root is 14px. Contrast computed from the token hex values.

1. **Too much of the page's text is small (High).** At the 1440 root the receipt's fine print is 10.9px, the
   sticky bar's fine print 10.1px, the byline, the Rate hint and the dotted ledger line 11.4px, the "D" monogram
   9.6px, the reply's author line 11.4px and both privacy notes 10.9px. Body copy is 13.6px. `typography.md ›
   Ensuring legibility`: "Follow the recommended default and minimum text sizes for each platform"; the desktop
   default is 13 pt and the minimum 10 pt (the skill's Lens 1, from `typography.md › Specifications`). Nothing is
   under the floor, but six kinds of text sit within 1.5px of it, and that is the text that carries the privacy
   promises.
2. **The reasons are a ragged cloud (High).** Nine pills wrap into three rows that end at 1050, 1005 and 916px,
   with no shared column edge, so the eye has to find the start of every answer afresh. `layout.md › Visual
   hierarchy`: "Align elements to make them easier to scan … People assume that aligned items are related to each
   other." A three-column grid keeps the order and gives every answer the same left edge.
3. **The ask is split across the card (Medium-High).** The heading and its line sit at the left edge; the Rate
   button, the one action on the screen, sits 500px away at the right edge with its hint right-aligned under it.
   `layout.md › Visual hierarchy`: "Group related items to clearly express related information or functions."
   The button is the only filled control on the screen, which is right (`buttons.md › Style`: "use a button that
   has a prominent visual style for the most likely action in a view"), but at 35px it is the same height as the
   Pro card's "Yes, I pay for Pro", so the first screen has two buttons of equal weight.
4. **The receipt's top half is lopsided (Medium, judgment).** The count and its label fill 307 of 657px; the
   ledger line stops at 350px; the "Removed" pill floats alone top right. The right half above the tear is empty,
   and nothing lines up with the pill or the Rate button.
5. **Dominic is not on the page (Medium).** The page is a note from one person, signed with a 19px "D" and, in
   the reply, the app icon. `design-principles.md`, Delight: "Make it human." The photo fixes this in both places.
6. **One accessory too many in the receipt (Medium, craft).** Eyebrow, pill, dotted leader, a dashed tear with
   notches, and then a second, solid rule over the fine print. Two separators in one card dilute the tear, which
   is the receipt's signature. The fine print can be the receipt's stub instead: a quiet band at its foot.
7. **Two left edges in the reasons' footer (Medium).** The "Removed it by mistake?" line is indented under the
   lock line's text, which reads as a sub-point of the privacy note. `layout.md`: "they perceive indented items
   as subordinate to the item they follow."
8. **Controls are big enough; their spacing is tight (Low).** Rate 35px, reasons 40px, Pro buttons 35px, text
   links 32px tall, all above the desktop default of 28 pt (`accessibility.md › Mobility`). The gap between
   reasons is 8.4px, under that page's "about 12 points of padding around elements that include a bezel".
9. **Dark mode holds (Low).** Tokens adapt; the white cat photo will glow on #141414 and needs a small dim
   (`dark-mode.md`: "Soften the color of white backgrounds … consider slightly darkening the image").

What already works and stays: every text colour passes (`#525252` on white 7.8:1, `#737373` 4.7:1; dark
`#a3a3a3` on `#141414` 7.3:1, `#8f8f8f` on `#0a0a0a` 6.1:1); one ink-filled primary; focus rings in ink with an
offset; reduced motion turns off the count-up and transitions; the tear as the receipt's one signature.

Thesis: a receipt for the time TidyWL saved, signed by the person who built it, with one honest ask under it.

## Step 2: the first screen

All sizes at the 1440 x 900 root (14px); everything is in rem, so it scales with the window as before.

- **Dominic's photo replaces the "D" monogram** in the ask's byline: 2rem (28px), round, a 1px ring, zoomed on the
  face with `object-view-box` (Chromium; other browsers show the whole photo, still round), `alt=""` because the
  words beside it name him. Dimmed to 88% brightness in dark mode (`dark-mode.md`, soften white images). Audit 5.
- **The ledger line runs the full card width**, like a till receipt, so "34 days" ends on the same right edge as
  the Removed pill above and the Rate button below. The receipt's right half is no longer empty. Audit 4.
- **The Rate button is the largest button on the page**: 40px tall, 14.9px text, 18px star (was 35px, 14px, 14px).
  Every other button stays 35px. The unknown-store trio goes to 38.5px. In the sticky bar it is 35px. Audit 3.
- **The fine print became the receipt's stub**, a grey band (the reply bar's `--well`) across the card's foot, in
  place of a second rule under the tear. One separator in the card: the tear. Audit 6.
- **Secondary text is larger**: the ask's line 13.6 to 14px, the byline, the Rate hint, the trio label and the
  ledger 11.4 to 12.25px, the fine print 10.9 to 11.4px, and in the sticky bar 10.1 to 11.4px. Audit 1.
- Card padding 31.5 to 35px a side; the tear's margins 18.9 to 21px.
- A press state on the Rate button (`scale(0.98)`, instant): `buttons.md`, "Always include a press state for a
  custom button."

Deviations from the Schoger look, each with its reason:
- The Rate button is bigger than the site's 14px pill buttons: it is the screen's one primary action
  (`buttons.md › Style`), and the Pro card's buttons sat at the same size on the same screen.
- The fine print sits on a grey band: the look's own `--well`, used by the reply's header bar, so this is a reuse
  rather than a new colour; the reason is one separator per card (`layout.md`, group with container shapes).

## Step 3: the rest of the page

- **The nine reasons are a three-column grid of ringed tiles**, in the same order, read across. Each column is as
  wide as its longest answer and the spare width is shared, so at 1440 every answer fits on one line; in a
  narrower window the longest one wraps onto two lines and every row takes that height, so the grid stays even.
  Two columns from 46rem of column width down, one from 30rem, in the existing container queries. Tiles are
  42px tall, 10.5px apart (was 8.4px; `accessibility.md › Mobility`, about 12 pt around bezeled controls). Hover
  darkens the ring as well as the fill, so the pointer feedback shows. Audit 2.
- **The reply is signed with the photo**: 2.5rem (35px), round, in place of the app icon, and "Dominic, who
  builds TidyWL" in ink at 13.1px instead of grey at 11.4px. Audit 5.
- **Reply and form text**: body and bullets 13.6 to 14px, the sent tick 11.4 to 12.25px, the form's help 11.8 to
  12.25px, both privacy notes 10.9 to 11.4px. Column padding 17.5 to 21px, and the reply's header bar lines up
  with the column under it. The form's question is balanced over two lines instead of leaving one word. Audit 1.
- **The note box is four lines tall** (was three), so the longest hint, under "Videos became unavailable", shows
  whole instead of scrolling inside the box.
- **The two notes under the reasons each have an icon on one left edge**: the lock for the privacy note, a
  "rotate back" arrow for "Removed it by mistake?". The reinstall line is no longer indented under the lock's
  text. Audit 7.
- **More room between sections**: the reasons start 35px under the receipt (was 26.6px), and the Pro card 35px
  under the reasons (was 22.4px). The Pro card itself is unchanged apart from its padding and 13.1px body text.
- The footer is unchanged.

Markup changes (none read by the script): the reply's author `<img>` now has `class="un-avatar"` and
`src="/assets/dominic.jpg"`; an `<svg>` was added as the first child of the reinstall box under the reasons. The
script hides that box's `span[aria-hidden="true"]` dots, and an `<svg>` is not a `span`, so the icon stays. The
CSS that padded the box's first `span` now names `span:first-of-type`, since the `svg` is the first child.

Deviation from the Schoger look: the reasons are rounded tiles (14px corners) rather than the look's pills,
because a label may wrap onto two lines in a narrower window and a pill does not hold two lines. The Netflix twin
uses ringed cards for its reasons too, so this stays inside the leaver pages' vocabulary.

## Step 4: verification

- **Script diff: empty.** The one `<script>` block extracted from `git show agent-a-uninstall-page:uninstall/index.html`
  and from this branch's file (434 lines each) diff to nothing.
- **Every `id` and `data-*` attribute in the body is identical** to agent-a's (sorted lists diffed). The classes
  the script reads (`un-reason`, `un-rate`, `un-branch`, `un-rh`, `un-ci`, `un-reveal`, `is-compact`, `is-one`)
  are all kept.
- **`node --test scripts/templates.test.mjs`: 6 pass, 0 fail.**
- **Network:** a page load plus a pick requests only same-origin files. The one new request is
  `/assets/dominic.jpg`, already in the repo. Nothing new is sent; no privacy sentence changed.
- Front matter not touched.
- `styles-leaver.html` changes all sit between its `/* ════ uninstall/: the receipt ════` and
  `/* ════ netflix/removed/ ════` lines; the tokens and the Netflix section are untouched.
- Keyboard focus checked on a reason tile and on the Rate button: the 2px ink ring with its 3px offset shows.
- Checked at 1440 x 900, 3008 x 1512, 1100 x 800, 720 x 900 and 600 x 1000; no sideways scroll at any of them.
  At 600 the existing container queries still stack the ask and put the reasons in two columns.

Found and fixed while looking at the shots:
- With the reasons now reaching the column's edges, a picked tile's 2px ring peeked out beside the sticky bar as it
  scrolled under. The bar's cover is now 0.5rem wider a side (two side shadows in the page colour).
- The longest note hint (under "Videos became unavailable") was cut off in a three-line box: the box is four lines.
- In a 1100px window "Wouldn't open, or wrong account" wraps and made its row taller than the others: every row
  now takes the tallest row's height.
- The note question left one word on its second line: balanced.

## Wording changes

None. Every visible word is as it was. The byline's "D" monogram (hidden from screen readers) became a photo with
empty alt text, since the words beside it name Dominic.

## Proposals (not made; they need a script change or the owner's call)

- **Split the receipt's top line into ledger rows.** The script writes "Receipt · TidyWL 2.8.1 · Chrome" into one
  element (`data-rec="meta"`). Separate `version` and `store` rows under the dotted leader would read more like a
  receipt and fill the ledger, but that needs `renderRecord()` to write them.
- **An Increase Contrast answer** (`color.md`: "an increased contrast option for each variant"): under
  `prefers-contrast: more`, rings at 30% instead of 10% and secondary text a step darker. Left out because it
  touches the shared tokens at the top of `styles-leaver.html`, which this step may not edit.
- **Firefox crop:** `object-view-box` is Chromium only, so Firefox shows the whole photo in the circle (the cat
  smaller, still recognisable). Not checked in Firefox itself. A cropped copy of the photo would make it identical
  everywhere, at the cost of a second image file.
- The reply's left column leaves empty space under the shortest replies (I finished my cleanup, Missing
  something, Something else) beside the taller note form. Left alone: the two-column reply is the owner's layout.

## Lab rounds (run by the orchestrator, 2026-11-05)

Three fresh simulated visitors per round, each a stranger who just finished a big cleanup and removed the extension: p1 cleaned 2,847 in a weekend and rarely rates (Chrome); p2 cleaned 640, hit YouTube's pause once, closes tabs fast (Chrome); p3 cleaned 1,200, careful about data, German, never rated an extension (Firefox, no `i`). Each scores 0-10 how likely they are to leave a 4- or 5-star rating from this visit. Target: all three at 8 or more and the average above 8; 5 rounds at most. Fixes stay honest and inside store rules.

- **Round 1: 4.5 / 3.5 / 3.5 (avg 3.8).** All three were put off by a red "Not sent" after a click, which was the lab's fault (the local server had no API); the harness now answers `/api/` locally with 200, and p1/p2's links carry an `i` as real Chrome links do. Fixed on the page: (a) one statement of what opening the page sent, under the reasons, set by the script by whether the link has an `i`; the receipt's line now only says where the figures come from (p3: the two old lines contradicted each other); (b) the Rate hints say stars alone are fine, and Firefox's says it needs a Mozilla account (both read: Chrome 88 ratings vs 62 written reviews, AMO 3 vs 2, AMO API docs: authentication required, `body` nullable); (c) the "I finished my cleanup" reply gets its own Rate button and the same effort line (p1); (d) that reply first says sorry if YouTube paused videos partway through, and that it clears in 30 to 60 minutes (p2). Not changed, for the owner: the word "Receipt" read as "paid" to p3; "Videos became unavailable" read to p2 as videos vanishing, not a paused account. Script diff vs branch A: only the privacy line's assignment.
