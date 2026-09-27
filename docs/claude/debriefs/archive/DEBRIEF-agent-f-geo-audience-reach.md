STATUS: DONE_WITH_CONCERNS
COMMIT: ce3c773
BRANCH: agent-f-geo-audience-reach
DEPENDS_ON: none
STORE_TOUCHED: no
MIGRATION_ADDED: no
GATES: lint=SKIPPED build=PASS test=PASS
CONCERNS: no package.json (Jekyll site), so "build" is `bundle exec jekyll build` and "test" is the three `node --test scripts/*.test.mjs` files (templates 6/6, fetch-cws-reviews 16/16, netflix-app 10/10); no lint exists. Not pushed: the user said to wait.

## Files staged
- robots.txt
- llms.txt
- _data/reviews.yml
- tutorials/index.html
- _posts/2026-09-26-add-youtube-playlist-to-notebooklm.md
- _posts/2026-09-26-unlike-all-liked-videos-youtube.md
- _posts/2026-09-26-search-youtube-liked-videos.md
- _posts/2026-09-26-export-youtube-watch-later-to-csv.md
- docs/claude/debriefs/DEBRIEF-agent-f-geo-audience-reach.md

## Shared files touched
- none (the repo has no SHARED_FILES.md)

## Design decisions
- **robots.txt is one group.** Every named AI user-agent and `*` share a single rule set: `Allow: /api/stats` then `Disallow: /api/`. A bot with its own group ignores `*`, so adding the disallow to `*` alone would have left `/api/` open to the 17 named bots. The names change nothing functionally; they are kept to show the choice was deliberate. The old comment claiming an unnamed bot "cannot open the page" was false and is gone. No blank lines inside the group: Python's `urllib.robotparser` (and older parsers) read one as the end of the group, which left `/api/` open until fixed. `/api/stats` stays open because the landing page and llms.txt cite it.
- **llms.txt:** Firefox link now points at the AMO listing (the old line said "distributed from tidywl.com"); `/api/stats` is a markdown link so a crude extractor does not fetch `/api/stats.`; a *Guides* section lists every post by Liquid loop over `site.posts` (auto-maintained); a *Mentioned elsewhere* section cites the three independent recommendations found on 2026-09-26 (zedinabyss blog, Nerdist Camp S2E10, r/androidapps).
- **Nerdist Camp quote** (`_data/reviews.yml`, non-store entry, so it shows in the landing page's community marquee): transcribed from the episode audio at 57:30–58:00 with Whisper large-v3-turbo because the earlier auto-transcript garbled the passage. Andi's words only; Kris's interjection is elided with `[...]`. Names spelled as the show notes spell them (Andi, Kris).
- **Four help posts** chosen from `tidywl/docs/reference/youtube-how-to-questions-tidywl-solves.md` as the highest-demand questions TidyWL answers today with no unresolved facts: NotebookLM, bulk/selective unlike, searching Liked videos, CSV/JSON export. Each: question-phrased title, answer-first lead, question H2s, 5–6 FAQ items (the default layout emits FAQPage + BlogPosting JSON-LD). Linked from the tutorials page's search, delete and gemini-notebook sections.
- Every product claim in the posts was checked against the extension source on 2026-09-26 (Gemini send scope = selection else filtered list, clipboard fallback, one-request add; export = `filteredPlaylist` in current sort order; CSV columns Index, Title, Channel, Channel ID, Video ID, Set Video ID, URL; JSON = full video objects; sort options incl. "Playlist order (Bottom first)").

## Manual steps
- Read Cloudflare AI Crawl Control (last 7 days): nothing blocked; ChatGPT-User 122 requests; the 669 AI-crawler 404s are secret-hunting scanners spoofing AI user-agents, not real crawlers.
- Edited the pinned comment on YouTube video JLG_2wGa2eo (user-approved): dead invite `discord.gg/frwKrnfmj` replaced with `discord.gg/sTvjfp4sCk`, both checked against Discord's API; confirmed after reload. The user fixed the "here/hear" typo themselves.
- Product Hunt replacement copy drafted; the user pasted it.

## Bugs found and fixed
- robots.txt blank-line grouping (above), caught by testing the new file with Python's parser.

## Deliberately deferred work
- The "remove watched videos" page waits on checking whether YouTube's own desktop button still exists (reports so far are mobile-only).
- `tutorials/index.html` still says "Shorts (≤60s)"; change it only when the extension's Shorts fix ships in 2.2.0 (YouTube Shorts run up to 3 minutes).
- The weekly rating job still shows 67 ratings; the store reads 5.0 from 76 (2026-09-26). It self-updates on the Sunday run.
- Product Hunt, ExtWise and TapFold stale claims: see `tidywl/docs/reference/tidywl-mentions-across-the-web.md`.

## Gotchas for future agents
- Research agents must write temp files to the scratchpad by absolute path: a bare `curl -o file` from a shell whose cwd is a repo drops files into that repo (43 Reddit JSON files landed in tidywl's root this session).
- Cloudflare's AI Crawl Control "Unsuccessful requests" count is mostly scanners, not blocked crawlers; read the 4xx path table before acting on it.
- Site local `main` was 4 commits behind origin when this branch was cut; the branch was fast-forwarded onto `origin/main` (8786e1b). Pull main before merging.
