STATUS: IN PROGRESS (items 1-2 done; item 3, the ask heading for big counts, next)

# agent-a-uninstall-page

Branch `agent-a-uninstall-page` in `tidywl-site`, worktree `.claude/worktrees/agent-a-uninstall-page`. Scope: `uninstall/index.html` and `_includes/styles-leaver.html` (shared with `netflix/removed/`, which is out of scope). No push; the user merges with /agent-merge.

## Steps

1. 2026-11-05: worktree made from main `371dfe9`; read CLAUDE.md (the uninstall line, Key Constraints), the page, `styles-leaver.html`, tidywl-api `src/removed.js` (read-only) and tidywl TODO § NEXT SESSION item 3. Rating-ask measurement runs until about 2026-11-10: the ask's place, words and Rate button stay as they are unless the user says otherwise.
2. 2026-11-05: the user asked for a link with a cleaned count of 1234. Given without `i`, so opening it writes no "no reason picked" row; it still adds one visit to the page's visit count.
3. 2026-11-05: the cleaned-up count is 10vh (was 17vh), and the 2px comes off the root (`max(14px, min(1.1111vw, 1.7778vh) - 2px)`) instead of off each text size; every `calc(X - 2px)` in the page and in styles-leaver's uninstall section is now plain X. Measured in a private headless Chromium on local builds: at 1440x900 the root is 14px (was 16), the count 90px (was 151), the Rate button's bottom at 384px (was 476); at 3008x1512 the count is 151px (was 255). Side effect: at 1440x900 the reply under a picked reason now sits in two columns (the container query is 46rem, and a 14px root makes the 720px column wide enough); kept, since it matches big screens. Template tests 6/6, front matter parses.
