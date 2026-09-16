#!/usr/bin/env node
/**
 * Fetch every written Chrome Web Store review of Watch Later Tidy into _data/cws-reviews.json.
 *
 *   node scripts/fetch-cws-reviews.mjs [out-file]      default: _data/cws-reviews.json
 *
 * Run weekly by .github/workflows/update-cws-rating.yml. Node 18+ and no dependencies, so nothing is installed.
 *
 * WHERE THE REVIEWS COME FROM
 * The reviews page's first load carries only 10. The rest come from the store's own public, unauthenticated
 * batchexecute RPC — the same request the page's JavaScript makes. Its id and the two session values it needs are
 * read from the page every run rather than hard-coded, because they rotate with store deploys.
 *
 * THE TRAP: `hl` FILTERS BY LANGUAGE
 * Asked with hl=en, the RPC returns only English reviews, and its own total says 30 with no continuation token, which
 * looks complete. It was 30 of 42 on 2026-09-16: the other twelve are served only under their own language. No field
 * in the request lifts the filter (every position was tried), so this sweeps LANGUAGES and unions by review id.
 * Codes the store does not know fall back to English, which the union absorbs.
 *
 * WHAT IT REFUSES TO DO
 * It never writes a file it cannot vouch for. It exits non-zero, leaving the committed file untouched, when the page
 * ids cannot be read, when English does not answer, or when the new count is under half the committed one — the same
 * floor the rating job uses against a bad scrape. A store that changed its RPC therefore costs a red run, not an
 * empty carousel.
 *
 * WHAT IT KEEPS
 * id, author, stars, text, date, version, lang — enough to draw a card and link to the review. Not the avatar URL,
 * not the developer's reply. No fetch timestamp either, so a week with no new review commits nothing.
 */

import { readFile, writeFile } from 'node:fs/promises';

const EXT = 'fkelmapobieliokjcmnilmjllacmbfjo';
const PAGE_URL = `https://chromewebstore.google.com/detail/watch-later-tidy/${EXT}/reviews`;
const RPC_URL = 'https://chromewebstore.google.com/_/ChromeWebStoreConsumerFeUi/data/batchexecute';
const FALLBACK_RPC = 'x1DgCd';
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36';
const PAGE_SIZE = 100;
const MAX_PAGES = 50;          // per language: 5,000 reviews, far past anything real
const PAUSE_MS = 300;          // between requests; this runs once a week
const MIN_KEEP_RATIO = 0.5;    // same floor as the rating job

// The store's interface languages, plus regional variants that have carried a review of their own.
export const LANGS = [
  'en', 'de', 'es', 'es-419', 'fr', 'it', 'ja', 'ko', 'nl', 'pl', 'pt-BR', 'pt-PT', 'ru', 'uk', 'tr', 'vi', 'id',
  'th', 'zh-CN', 'zh-TW', 'ar', 'he', 'fa', 'hi', 'bn', 'ta', 'te', 'mr', 'gu', 'kn', 'ml', 'ur', 'ms', 'fil', 'sw',
  'am', 'sv', 'da', 'fi', 'no', 'cs', 'sk', 'hu', 'ro', 'bg', 'el', 'hr', 'sr', 'sl', 'lt', 'lv', 'et', 'ca',
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** The RPC id serving the reviews block, and the session values the RPC wants, read from the page's own HTML. */
export function readPageIds(html) {
  const sid = /"FdrFJe":"(-?\d+)"/.exec(html)?.[1];
  const bl = /"cfb2h":"([^"]+)"/.exec(html)?.[1];
  // AF_dataServiceRequests maps each ds: block to its RPC; the reviews block is the one whose request starts with the id.
  const rpc = new RegExp(`\\{id:'([A-Za-z0-9]+)',request:\\["${EXT}",\\[\\d+\\]`).exec(html)?.[1];
  return { sid, bl, rpc: rpc ?? FALLBACK_RPC };
}

/**
 * The payload of a batchexecute answer. The body is a length-prefixed stream; the line starting [["wrb.fr" holds the
 * RPC's answer as a JSON string. Returns null when there is no such line or it carries nothing.
 */
export function parseBatch(body, rpc) {
  for (const line of body.split('\n')) {
    if (!line.startsWith('[["wrb.fr"')) continue;
    const env = JSON.parse(line);
    const entry = env.find((e) => e[0] === 'wrb.fr' && e[1] === rpc);
    if (entry == null || entry[2] == null) return null;
    return JSON.parse(entry[2]);
  }
  return null;
}

/** One review as stored. Anything without both an id and text is not a written review and is dropped. */
export function toReview(r) {
  const text = typeof r?.[3] === 'string' ? r[3].trim() : '';
  const id = typeof r?.[0] === 'string' ? r[0] : '';
  const stars = Number(r?.[2]);
  if (!/^[0-9a-f-]{36}$/.test(id) || text === '' || !(stars >= 1 && stars <= 5)) return null;
  const seconds = Array.isArray(r[4]) ? Number(r[4][0]) : NaN;
  return {
    id,
    author: typeof r[1]?.[0] === 'string' && r[1][0].trim() !== '' ? r[1][0].trim() : 'A Chrome Web Store user',
    stars: Math.round(stars),
    text,
    date: Number.isFinite(seconds) ? new Date(seconds * 1000).toISOString().slice(0, 10) : null,
    version: typeof r[11] === 'string' ? r[11] : null,
    lang: typeof r[13] === 'string' && /^[a-z]{2,3}(-[A-Za-z]{2,4})?$/.test(r[13]) ? r[13] : null,
  };
}

/** Newest first, then by id, so the same reviews always serialise to the same bytes. */
export function sortReviews(list) {
  return [...list].sort((a, b) => (b.date ?? '').localeCompare(a.date ?? '') || a.id.localeCompare(b.id));
}

/** Throw unless `next` is safe to write over `previous`. */
export function assertWritable(next, previous) {
  if (next.length === 0) throw new Error('No reviews at all; refusing to write an empty list.');
  if (previous > 0 && next.length < previous * MIN_KEEP_RATIO) {
    throw new Error(`${next.length} reviews is under half of the ${previous} committed; likely a broken scrape. Refusing to write.`);
  }
}

async function post(ids, hl, request) {
  const qs = new URLSearchParams({
    rpcids: ids.rpc, 'source-path': `/detail/watch-later-tidy/${EXT}/reviews`, 'f.sid': ids.sid, bl: ids.bl, hl, rt: 'c',
  });
  const freq = JSON.stringify([[[ids.rpc, JSON.stringify(request), null, 'generic']]]);
  for (let attempt = 1; ; attempt++) {
    try {
      const res = await fetch(`${RPC_URL}?${qs}`, {
        method: 'POST',
        headers: {
          'User-Agent': UA,
          'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
          'Accept-Language': hl,
          Origin: 'https://chromewebstore.google.com',
          Referer: 'https://chromewebstore.google.com/',
        },
        body: new URLSearchParams({ 'f.req': freq }),
        signal: AbortSignal.timeout(30000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return parseBatch(await res.text(), ids.rpc);
    } catch (e) {
      if (attempt >= 2) throw new Error(`${hl}: ${e.message}`);
      await sleep(2000);
    }
  }
}

/** Every page of one language. A language the store serves nothing for answers a short array. */
async function fetchLanguage(ids, hl) {
  const out = [];
  let token = null;
  for (let page = 0; page < MAX_PAGES; page++) {
    const size = token == null ? [PAGE_SIZE] : [PAGE_SIZE, token];
    const d = await post(ids, hl, [EXT, size, 2, null, null, null, 0]);
    if (!Array.isArray(d) || !Array.isArray(d[1])) break;
    out.push(...d[1]);
    // The token arrives wrapped in a list; the next request wants the string inside it.
    token = Array.isArray(d[0]) && typeof d[0][0] === 'string' ? d[0][0] : null;
    if (token == null) break;
    await sleep(PAUSE_MS);
  }
  return out;
}

async function main() {
  const outFile = process.argv[2] ?? '_data/cws-reviews.json';

  const pageRes = await fetch(PAGE_URL, { headers: { 'User-Agent': UA, 'Accept-Language': 'en-US,en;q=0.9' } });
  if (!pageRes.ok) throw new Error(`Reviews page answered HTTP ${pageRes.status}.`);
  const ids = readPageIds(await pageRes.text());
  if (ids.sid == null || ids.bl == null) throw new Error('Could not read FdrFJe / cfb2h from the reviews page; the store changed its markup.');
  console.log(`RPC ${ids.rpc}, bl ${ids.bl}`);

  const byId = new Map();
  let englishAnswered = false;
  for (const hl of LANGS) {
    const raw = await fetchLanguage(ids, hl);
    let added = 0;
    for (const r of raw) {
      const review = toReview(r);
      if (review == null || byId.has(review.id)) continue;
      byId.set(review.id, review);
      added++;
    }
    if (hl === 'en') englishAnswered = raw.length > 0;
    if (added > 0) console.log(`${hl.padEnd(7)} +${added}`);
    await sleep(PAUSE_MS);
  }
  if (!englishAnswered) throw new Error('English returned no reviews; the RPC is not answering as expected.');

  let previous = 0;
  try {
    previous = JSON.parse(await readFile(outFile, 'utf8')).length ?? 0;
  } catch {
    // No committed file yet: the first run has nothing to compare against.
  }
  const reviews = sortReviews([...byId.values()]);
  assertWritable(reviews, previous);

  await writeFile(outFile, `${JSON.stringify(reviews, null, 2)}\n`);
  console.log(`Wrote ${reviews.length} written reviews to ${outFile} (was ${previous}).`);
}

// Run only when executed directly, so the functions above can be imported by the tests.
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((e) => {
    console.error(`::error::${e.message}`);
    process.exit(1);
  });
}
