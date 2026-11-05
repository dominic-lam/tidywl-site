STATUS: IN PROGRESS (step 1 of 4 done: before shots and audit)

# Debrief: agent-b-uninstall-design

The uninstall page's look, reviewed against Apple's Human Interface Guidelines (the `apple-design-hig` skill) and
restyled inside the Schoger look of `_includes/styles-leaver.html`. Desktop only. The script is not touched.

Screenshots live outside the repo, in
`/private/tmp/claude-501/-Users-dominiclam-WebStormProjects-tidywl/ff6f4808-2c64-446e-bed6-8736c69371b2/scratchpad/design/shots/`
(`before-*.png`, `after-*.png`), taken from a local Jekyll build on port 4201 with every `/api/` call answered
locally, so no visit reached live data.

## Progress

- Step 1 (before shots and audit): done. Five `before-*.png` shots; audit below.

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
