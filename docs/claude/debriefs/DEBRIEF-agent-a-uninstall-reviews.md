STATUS: DONE_WITH_CONCERNS
COMMIT: d63a236
BRANCH: agent-a-uninstall-reviews
DEPENDS_ON: none
STORE_TOUCHED: no
MIGRATION_ADDED: no
GATES: lint=SKIPPED build=SKIPPED test=PASS
CONCERNS: no package.json, so lint/build do not exist; ran scripts/templates.test.mjs (6/6). Phone width and the real Jekyll build were not checked.

## Files staged
- netflix/removed/index.html
- uninstall/index.html
- docs/claude/debriefs/DEBRIEF-agent-a-uninstall-reviews.md

## Shared files touched
- none

## Design decisions
- Netflix page restyled to match uninstall/index.html: layout null with its own header and footer, reasons as a card grid, the chosen reason as a bubble with "Change answer", the reason's body as Dominic's reply, Pro notice in a right-hand card.
- Behaviour kept: Netflix still sends only on Send (POST /api/netflix/removed), chips and the email follow-up unchanged. No Send or text-only answer before a reason is picked.
- Rate buttons only on the "done" reasons, in the reply and again on the thank-you screen (the reply is hidden after Send). YouTube: Chrome and Firefox /reviews pages, Edge to its listing (no stable review URL known). Netflix: {{ store }}/reviews.
- Netflix done reply now says playlists left with the extension (privacy policy: uninstall removes everything stored in that browser).

## Manual steps
- Rendered both pages with a throwaway script (no Jekyll here) and drove them in Chrome on 127.0.0.1 with fetch stubbed; nothing was written to the database.
- Fetched the four review URLs: all 200.

## Bugs found and fixed
- .un-again is display:flex and overrode `hidden`; added it to the hidden rule.

## Deliberately deferred work
- Phone-width check; the other Netflix reasons on the thank-you screen.
- Privacy policy and netflix/llms.txt not touched; neither mentions the rate buttons.

## Gotchas for future agents
- A comment before <!DOCTYPE> forces quirks mode, so the Netflix page's long comment sits inside <body>.
- The chosen reason uses display: contents inside a grid fieldset; keep the radio inputs real for keyboard use.
