# CLAUDE.md

## What This Project Is
- Landing page for TidyWL (the Chrome extension)
- Live at https://tidywl.com (custom domain on GitHub Pages)
- Repo: https://github.com/dominic-lam/tidywl-site
- Plain HTML/CSS/JS, no framework, no build step
- Deployed via GitHub Pages from main branch

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
- `index.html` — production landing page (themed via CSS vars + `prefers-color-scheme` + manual toggle; inline CSS + small FAQ/theme JS)
- `DESIGN.md` — notes from the UI rebuild (some `../../` path refs are stale from the original design kit)
- `sitemap.xml`, `robots.txt` — SEO files at root
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
- No build tooling, no frameworks, no package.json — keep it plain
- Custom domain is tidywl.com (apex), www.tidywl.com redirects to apex
- Canonical URL is https://tidywl.com/ — any new meta tags or
  internal links should use this, not the github.io URL

## Common Tasks
- Updating copy → edit `index.html` directly, commit, push, GitHub
  Pages auto-deploys
- Adding screenshots → drop in `assets/` folder, reference with relative path
- SEO changes → `og:` tags and canonical link are in `<head>` of `index.html`

## Working Style
- When reporting follow-ups, rank them by impact and state a
  recommendation, not just options.
