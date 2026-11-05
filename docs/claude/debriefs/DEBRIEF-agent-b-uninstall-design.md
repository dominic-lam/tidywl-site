STATUS: IN PROGRESS (step 2 of 4 done: the first screen)

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
