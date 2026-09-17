# TidyWL Marketing Site — UI Kit

The rebuilt landing page for [tidywl.com](https://tidywl.com), implementing the brief in `../../README.md` and using the tokens in `../../colors_and_type.css`.

## Files

- `index.html` — single-file landing page, inline CSS + a tiny bit of JS for the FAQ accordion and theme toggle. Plain HTML, no build step (matches the original repo's constraints — GitHub Pages friendly). Supports light/dark via `prefers-color-scheme` with a manual override.
- `robots.txt`, `sitemap.xml` — SEO files, allow-all crawlers, homepage only.
- `assets/icon128.png` — brand mark.
- `components/*.jsx` — extracted React components for future reuse (see below).

## Sections, in order

The list below describes the page as of 2026-09-16; the rest of this file is the original kit's notes, some now stale (see CLAUDE.md).

1. **Hero** — the 5,000-video pill, H1 ("Clear your YouTube Watch Later in minutes"), YouTube's Watch Later page against the dashboard with numbered pins, four pain → fix rows with a review line, the Chrome and Firefox logo buttons (trust chips inside the Chrome one), the price, three stats. Phones: the demo video and a send-to-computer hand-off instead.
2. **Inside the dashboard** — the 300-selected capture with eight labels and leader lines (pins and a list below 1300px), then *Getting started* in three steps
3. **Reviews** — featured carousel, then the community marquee
4. **Why I built this** — one paragraph, then the install buttons again
5. **Features** — six cards, the other fifteen behind *All features*, a line on what Pro adds
6. **FAQ** — accordion; "Is it free?", "Does it work on my phone?" and undo come first
7. **Privacy** — what leaves and why, plus chips
8. **Footer** — CTA, links (including Help), Ko-fi

## SEO

- `<title>` and `<meta description>` per the brief
- Open Graph (`og:title/description/image/url/type`) + Twitter `summary_large_image`
- `og:image` points to `/assets/og-image.png` — **this file doesn't exist yet**; the maintainer will create it separately
- Two JSON-LD blocks in `<head>`:
  - `SoftwareApplication` — free Chrome extension, `aggregateRating` 5.0 / 5 reviews
  - `FAQPage` — mirrors the 4 FAQ questions/answers verbatim
- Each testimonial carries `Review` microdata with `reviewBody`, `author`, and `reviewRating` / `ratingValue`
- `sitemap.xml` + `robots.txt` provided

## Interactions

- **FAQ accordion** — vanilla JS, toggles `aria-expanded` on `.faq-item`. CSS animates `max-height`. Plus icon rotates 45° when open.
- **Hover states** — primary CTA darkens, ghost CTA border lightens, feature card border lifts one step, footer links shift muted → white.
- No scroll-jacking, no parallax, no splash screens.

## JSX components

The single-file HTML is what ships. The JSX components in `components/` are for anyone who wants to port the design into a React codebase — they're small, presentational, and mirror the HTML section-for-section.
