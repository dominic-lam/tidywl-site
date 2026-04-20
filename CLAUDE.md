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
- `index.html` — the entire landing page (markup + inline CSS)
- `CNAME` — GitHub Pages custom domain config (`tidywl.com`)
- `config/api-config.json` — YouTube response path config consumed by the extension
- `assets/` — static images (icon128.png, small_promo_tile.png)
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
