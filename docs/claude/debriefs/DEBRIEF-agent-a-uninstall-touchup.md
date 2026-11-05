STATUS: DONE_WITH_CONCERNS
COMMIT: a6da9a4
BRANCH: agent-a-uninstall-touchup
DEPENDS_ON: none
STORE_TOUCHED: no
MIGRATION_ADDED: no
GATES: lint=SKIPPED build=PASS test=PASS
CONCERNS: no package.json, so lint does not exist; build = real Jekyll build, test = templates.test.mjs + fetch-cws-reviews.test.mjs (22/22). Phone width and real Brave/Opera/Vivaldi/Arc were not checked.

# agent-a-uninstall-touchup (two touch-ups to the uninstall page's top card)

Two commits, one per touch-up, each made, looked at and approved by the owner before the next:
`acd3847` (the no-record card matches the big cleanup's) and `a6da9a4` (the store comes from the browser when the
link names none). This debrief is a third commit.

## Files staged
- uninstall/index.html
- _includes/styles-leaver.html (one dead rule removed, in its uninstall section)
- CLAUDE.md (the uninstall/index.html line only)
- docs/claude/debriefs/DEBRIEF-agent-a-uninstall-touchup.md

## Shared files touched
- _includes/styles-leaver.html: one line, `.leave .un-fig-sub`, inside the uninstall section. netflix/removed/ uses
  none of the classes changed (checked by grep).
- CLAUDE.md: the one line describing the uninstall page.

## Design decisions
- With no record (no link, or under 10 cleaned) the title "TidyWL is removed." stands where the count would, at the
  count's size: `clamp(2.5rem, 5vh, 11rem)`; it was 7.5vh, half again as large. The owner: "make it aligned with the
  big clean up one".
- "It was installed for N days." became the ledger's "With TidyWL for … N days" line. The ledger moved out of the
  record-only `[data-fig="rec"]` block to a sibling after `.un-fig`, so either figure can show it. It cannot sit
  inside `.un-fig` as a div: `.un-fig > div` would restyle it. `.un-fig-sub` and its rules are gone.
- Store unknown: the three Rate buttons sit in one row (`.un-act:not(.is-one)` has no 21rem cap), with "Rate it on
  the store you use" under them, where one store's hint sits. A narrow window drops the row under the copy whole.
- `shownStore()`: the link's `s`, else the browser the page opened in. Firefox and Edge are themselves; any other
  desktop Chromium is Chrome, since they install from the Chrome Web Store; Safari, phones and anything else keep all
  three. So a Chrome visitor with no link gets no rating ask, as a Chrome leaver under 100 already does. The owner
  asked "don't we know their browser? why do we need to show all stores".
- Display only, both commits. `context()` still reads `record.s` alone, so a store guessed from the browser is never
  sent. The eyebrow ("Your record · TidyWL 2.8.1 · Chrome") also stays on `record.s`: it reports the link.

## Manual steps
- Headless Chrome screenshots of a `file://` preview copy of the built page in which `/assets/` paths are made
  relative so fonts and images load with no server (script in the session scratchpad, not the repo). States: no
  link, Chrome and Firefox at 3 and 40 cleaned, Chrome at 2,847; the no-link page at 1920, 1440 and 820 wide; and with
  Chrome, Firefox, Edge and Safari user agents. A `--dump-dom` check showed a link's `s` still beats the browser.
- The big-cleanup card matched its before screenshot pixel for pixel.
- The owner looked at the previews in their Chrome and approved both.

## Bugs found and fixed
- None new. The Chrome Rate button for an unknown store, a dead end since Chrome takes no rating after removal,
  is gone for every desktop Chromium.

## Deliberately deferred work
- The eyebrow still says "Your record · TidyWL" when there is no record at all. Not raised by the owner.
- Phone width: headless Chrome would not lay out a true 390px window. The page is desktop-first.

## Gotchas for future agents
- Display code reads `store`, never `record.s`; the send (`context()`) reads `record.s`, never `store`. Keep the two
  apart, or a guessed store starts being sent and the privacy page, both FAQ copies and llms.txt go wrong.
- `store` is recomputed in the hashchange handler next to `record`.
- macOS `sed` has no `\b`; a `sed -i ''` with it silently changes nothing. Use perl.
