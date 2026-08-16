# CLAUDE.md

## What This Project Is
- Landing page + blog for TidyWL (the Chrome extension)
- Live at https://tidywl.com (custom domain on GitHub Pages)
- Repo: https://github.com/dominic-lam/tidywl-site
- Jekyll-based: GitHub Pages renders it server-side
- Deployed via GitHub Pages from main branch

## Tooling rule
Keep the site as simple as possible. No local build tools, no bundlers, no frameworks requiring `npm install`. Jekyll is the one exception — GitHub Pages runs it server-side, so authors only edit markdown and commit. Everything else (CSS, JS, landing page HTML) stays plain.

## Related Project
- The actual TidyWL Chrome extension lives in a separate repo:
  https://github.com/dominic-lam/tidywl
- Local path on this machine: ~/WebStormProjects/tidywl
- That repo has its own CLAUDE.md with deeper context on the extension
  architecture, API reverse-engineering, and dev workflow —
  reference it directly if you need extension context
- This repo (tidywl-site) is purely the marketing/landing page —
  do NOT confuse the two

## File Structure
- `index.html` — production landing page. Uses Jekyll `{% include %}` tags for shared head/styles/theme-toggle/footer/scripts; all page-specific head content (title, meta, OG, JSON-LD) stays inline here.
- `_config.yml` — Jekyll config (permalinks, plugins, excludes). GitHub Pages reads this.
- `Gemfile` — pins `github-pages` gem for local preview (`bundle install && bundle exec jekyll serve`).
- `_includes/` — shared snippets: `fonts.html`, `theme-init.html`, `styles.html` (the big CSS block, shared with landing), `styles-blog.html` (blog-only typography), `theme-toggle.html`, `footer.html`, `scripts.html`.
- `_layouts/` — `default.html` (blog pages) and `post.html` (extends default, adds post-specific markup + optional FAQ rendering).
- `_posts/` — blog posts in Markdown, filename `YYYY-MM-DD-slug.md`. Permalink pattern: `/blog/:slug/`.
- `_data/cws-rating.yml` — single source of truth for the Chrome Web Store aggregate rating. Read via Liquid in `index.html` (both the visible hero `.social-proof` link and the JSON-LD `aggregateRating` block). Shape: `ratingValue`, `reviewCount`, `lastUpdated`. Auto-updated weekly by `.github/workflows/update-cws-rating.yml`; do not hand-edit unless the workflow is broken.
- `.github/workflows/update-cws-rating.yml` — scheduled (Sun 06:00 UTC) + `workflow_dispatch` job that scrapes the CWS listing HTML, validates the parsed rating/count (range, positive int, >=50% of previous), writes `_data/cws-rating.yml`, and commits as `github-actions[bot]`. On parse failure it uploads the fetched HTML + headers as a 30-day artifact. CWS does not expose JSON-LD or microdata, so parsing anchors on `"X out of 5"` and `"N ratings"` text — if Google ever redesigns the markup, expect a Sunday failure email and the artifact will show the new shape.
- `blog/index.html` — blog post listing page.
- `DESIGN.md` — notes from the UI rebuild (some `../../` path refs are stale from the original design kit)
- `sitemap.xml`, `robots.txt`, `llms.txt` — SEO/GEO files at root
- `CNAME` — GitHub Pages custom domain config (`tidywl.com`)
- `config/api-config.json` — YouTube response path config consumed by the extension
- `config/announcements.json` — in-product "What's new" banners consumed by the extension
  - Fetched from `https://tidywl.com/config/announcements.json` by
    `src/content-scripts/content.js` (`fetchAnnouncements`) in the extension repo
  - Rendered as dismissible cards in the TidyWL dashboard (see
    `src/dashboard/dashboard-data.js::checkAnnouncements` and
    `src/dashboard/dashboard-ui.js::renderAnnouncements`)
  - Expected shape: `{ "announcements": [ { id, title, bullets[], type, expires_at }, ... ] }`
    — **plural array**, not a singular `announcement` object
  - `id` is used for dismissal tracking (stored in `chrome.storage.local`
    under `wl_announcement_dismissed_ids`); `expires_at` auto-hides the entry;
    `type` maps to a banner variant (e.g. `info`)
- `assets/` — static images (icon128.png, small_promo_tile.png, og-image.png)
- `.gitignore` — standard ignores

## Key Constraints
- CNAME file is managed by GitHub Pages — do NOT modify or delete it
- No local build tooling beyond Jekyll (see Tooling rule above)
- Custom domain is tidywl.com (apex), www.tidywl.com redirects to apex
- Canonical URL is https://tidywl.com/ — any new meta tags or
  internal links should use this, not the github.io URL
- Landing page `<head>` keeps its SoftwareApplication + FAQPage JSON-LD blocks inline. Do not move them into Jekyll layouts/includes — they're tied to the landing page content and the GEO work treats them as sacred.
- Reviews live in JSON-LD only. The visible testimonial cards in `index.html` intentionally carry no Schema.org microdata (`itemscope`/`itemtype`/`itemprop`). Adding microdata back creates a parallel set of Reviews that Google parses independently of the JSON-LD, triggering "Missing field itemReviewed" and duplicate-entry warnings in GSC. Keep the visible cards as plain HTML.

## Common Tasks
- Updating landing page copy → edit `index.html` directly, commit, push, GitHub Pages auto-deploys
- Adding a blog post → create `_posts/YYYY-MM-DD-slug.md` with frontmatter (`title`, `description`, `date`, optional `og_image`, optional `last_modified_at`, optional `faq:` list of `{q, a}` items). Write body in Markdown. Commit and push; GitHub Pages renders the post at `/blog/slug/`.
- `last_modified_at` (optional, `YYYY-MM-DD`) — set it when you **substantively revise** a post. It drives `dateModified` in the post's `BlogPosting` JSON-LD and renders an "Updated" line next to the publish date, but only when it differs from `date`. Do not bump it for a typo: a freshness signal that does not correspond to changed content is worse than no signal. When absent, `dateModified` falls back to `date`, because schema.org reads a missing `dateModified` as unknown rather than "never revised".
- Schema.org entities are linked by `@id`, not restated. `_includes/schema-organization.html` defines `Organization` once at `{{ site.url }}/#organization`, and the landing page's `SoftwareApplication`, `Blog`, and every `BlogPosting` reference it via `"publisher": { "@id": ... }`. It is an include because the landing page and `_layouts/default.html` have separate `<head>` blocks; duplicating the literal would let three slightly different Organizations drift apart. This does **not** contradict the rule below about keeping the landing page's `SoftwareApplication` + `FAQPage` inline — those two stay where they are.
- Adding screenshots → drop in `assets/` folder, reference with absolute path (`/assets/...`) from blog pages, relative path from `index.html`
- SEO changes → `og:` tags and canonical link are in `<head>` of `index.html` (landing) and `_layouts/default.html` (all blog pages)
- Local preview → `bundle install` once, then `bundle exec jekyll serve` (preview at http://127.0.0.1:4000)

## Working Style
- When reporting follow-ups, rank them by impact and state a
  recommendation, not just options.
