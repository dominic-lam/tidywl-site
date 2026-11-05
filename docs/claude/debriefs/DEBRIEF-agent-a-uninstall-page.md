STATUS: DONE
COMMIT: c481560
BRANCH: agent-a-uninstall-page
DEPENDS_ON: none
STORE_TOUCHED: no
MIGRATION_ADDED: no
GATES: lint=SKIPPED build=PASS test=PASS
CONCERNS: no package.json, so there is no npm lint/build/test; build is the Jekyll build, test is node --test on each scripts/*.test.mjs (43 pass, as on main)

# agent-a-uninstall-page

## Files staged
Committed step by step on this branch; nothing was left unstaged.
- uninstall/index.html
- _includes/styles-leaver.html (its uninstall section only)
- CLAUDE.md (the uninstall/index.html line only)
- docs/claude/research/RESEARCH-uninstall-page-ratings-feedback.md
- docs/claude/debriefs/DEBRIEF-agent-a-uninstall-page.md

## Shared files touched
- _includes/styles-leaver.html also styles netflix/removed/. Only rules inside its uninstall section changed: ten `calc(X - 2px)` became X, and one comment.
- CLAUDE.md: the one line describing the page.

## Design decisions
- The 2px comes off the root, `max(14px, min(1.1111vw, 1.7778vh) - 2px)`, instead of off each text size, so spacing and icons shrink with the text (the user).
- The cleaned-up count is `clamp(2.5rem, 5vh, 11rem)`: 5% is the user's pick after trying 10, 8, 7 and 6. The floor came down from 4.5rem, which sat above 7% at every window size.
- "Did I save you some time?" replaces "How would you rate it?" at 100 or more cleaned (`BIG_CLEAN`, the user's cut-off). Moves alone never count.
- Reinstall links in the "Wouldn't open" and "videos became unavailable" replies; the second says "Reinstall once it clears".

## Manual steps
- None outside git. Previews were local Jekyll builds served from a scratch folder; no live page was loaded with an `i`.

## Bugs found and fixed
- The count's 4.5rem floor made the user's 7% invisible: 63px at 1440x900 and 112px at 3008x1512, both the floor.

## Deliberately deferred work
- Counting Rate clicks: needs a new value in `VISIT_PAGES` (tidywl-api `src/feedback.js`) first. The owner approved it as its own session; for TODO.

## Gotchas for future agents
- Chrome's store does not let a removed install rate (the owner checked on 2026-11-05), so a Chrome Rate button on this page reaches almost nobody. Branch agent-b-uninstall-design builds on that and contains this whole branch.
- `node --test scripts/` fails because it treats the folder as one file; run each `scripts/*.test.mjs`.
- Merging this before the rating count due about 2026-11-10 changes the ask's look; the owner chose not to wait.

## Session log

Branch `agent-a-uninstall-page` in `tidywl-site`, worktree `.claude/worktrees/agent-a-uninstall-page`. Scope: `uninstall/index.html` and `_includes/styles-leaver.html` (shared with `netflix/removed/`, which is out of scope). No push; the user merges with /agent-merge.

## Steps

1. 2026-11-05: worktree made from main `371dfe9`; read CLAUDE.md (the uninstall line, Key Constraints), the page, `styles-leaver.html`, tidywl-api `src/removed.js` (read-only) and tidywl TODO § NEXT SESSION item 3. Rating-ask measurement runs until about 2026-11-10: the ask's place, words and Rate button stay as they are unless the user says otherwise.
2. 2026-11-05: the user asked for a link with a cleaned count of 1234. Given without `i`, so opening it writes no "no reason picked" row; it still adds one visit to the page's visit count.
3. 2026-11-05: the cleaned-up count is 10vh (was 17vh), and the 2px comes off the root (`max(14px, min(1.1111vw, 1.7778vh) - 2px)`) instead of off each text size; every `calc(X - 2px)` in the page and in styles-leaver's uninstall section is now plain X. Measured in a private headless Chromium on local builds: at 1440x900 the root is 14px (was 16), the count 90px (was 151), the Rate button's bottom at 384px (was 476); at 3008x1512 the count is 151px (was 255). Side effect: at 1440x900 the reply under a picked reason now sits in two columns (the container query is 46rem, and a 14px root makes the 720px column wide enough); kept, since it matches big screens. Template tests 6/6, front matter parses.
4. 2026-11-05: the ask's heading is "Did I save you some time?" when `c` is 100 or more (`BIG_CLEAN`, a default the user has not confirmed), "How would you rate it?" otherwise; moves alone never count. Checked on a local build: 1234, 100 and 2,000,000 get the new heading; 99, 5, no count and m=500 keep the old; the folded bar after a pick shows it too. The line under the heading and the Rate button are unchanged. This changes the ask's words, so merging before the ~2026-11-10 rating count muddies it: the user decides when to merge.
5. 2026-11-05: the user confirmed 100 as the cut-off and chose to merge now rather than wait for the ~2026-11-10 rating count ("no point to wait"), so ratings from 2026-11-05 on come from the new ask. They are trying the count at 8% of the height in a console before settling 10%.
6. 2026-11-05: the user tried 8% in the console and picked it: the count is `clamp(4.5rem, 8vh, 11rem)`, measured 72px at 1440x900 and 121px at 3008x1512. Template tests 6/6. A research agent was sent the same day on what an uninstall page should hold to draw good ratings and written feedback; its report lands in `docs/claude/research/`.
7. 2026-11-05: research report saved at `docs/claude/research/RESEARCH-uninstall-page-ratings-feedback.md` with the owner's decisions appended. Reinstall links added to the "Wouldn't open" and "Videos became unavailable" replies (checked on a local build: one store's link with `s`, all three without). **For TODO at merge:** a tidywl-api session to count Rate button clicks (a new allowed value in `VISIT_PAGES`, `src/feedback.js`, and any D1 CHECK on `page_visits` with it; then the page sends it on a Rate click; then the privacy page, both FAQ copies and `llms.txt`, invariant 39), approved by the owner 2026-11-05. A redesign of the page, followed by simulated-visitor rounds, continues on branch `agent-b-uninstall-design`, cut from this branch.
