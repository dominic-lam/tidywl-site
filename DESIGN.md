# TidyWL Marketing Site — UI Kit

The rebuilt landing page for [tidywl.com](https://tidywl.com), implementing the brief in `../../README.md` and using the tokens in `../../colors_and_type.css`.

## Files

- `index.html` — single-file landing page, inline CSS + a tiny bit of JS for the FAQ accordion and theme toggle. Plain HTML, no build step (matches the original repo's constraints — GitHub Pages friendly). Supports light/dark via `prefers-color-scheme` with a manual override.
- `robots.txt`, `sitemap.xml` — SEO files, allow-all crawlers, homepage only.
- `assets/icon128.png` — brand mark.
- `components/*.jsx` — extracted React components for future reuse (see below).

## Sections, in order

1. **Hero** — brand mark, H1 ("Your YouTube Watch Later hit 5,000 videos?"), tagline, primary + ghost CTAs, 5-star social proof line
2. **Demo video** — 16:9 YouTube embed
3. **Features** — 5 cards (2×3 grid collapsing to 1 col); "Past 5,000" card is visually highlighted
4. **How it works** — 3 numbered steps with icon wells
5. **Testimonials** — 3 review cards with Schema.org Review microdata
6. **FAQ** — 4-question click-to-expand accordion
7. **Privacy** — copy + 4 "no X" chips
8. **Footer** — CTA, Ko-fi, bug report (pointed at the `tidywl` extension repo, not this one)

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
