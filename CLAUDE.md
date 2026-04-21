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

## Common Tasks
- Updating landing page copy → edit `index.html` directly, commit, push, GitHub Pages auto-deploys
- Adding a blog post → create `_posts/YYYY-MM-DD-slug.md` with frontmatter (`title`, `description`, `date`, optional `og_image`, optional `faq:` list of `{q, a}` items). Write body in Markdown. Commit and push; GitHub Pages renders the post at `/blog/slug/`.
- Adding screenshots → drop in `assets/` folder, reference with absolute path (`/assets/...`) from blog pages, relative path from `index.html`
- SEO changes → `og:` tags and canonical link are in `<head>` of `index.html` (landing) and `_layouts/default.html` (all blog pages)
- Local preview → `bundle install` once, then `bundle exec jekyll serve` (preview at http://127.0.0.1:4000)

## Working Style
- When reporting follow-ups, rank them by impact and state a
  recommendation, not just options.
