// node --test scripts/templates.test.mjs
// Reads the real templates. The review fields are strangers' text, published weekly without anyone reading them, so
// every place a template prints one must escape it: | escape in HTML, normalize_whitespace in llms.txt.
//
// The landing page's JSON-LD carried the store rating and every review until 2026-09-16, with its own escaping and a
// test for it. Both came out that day: Google's review-snippet rules forbid aggregating ratings or reviews from
// another website. The first test below keeps them out; if they ever come back, bring back the escaping and its
// test with them (git history, 2026-09-16), because jsonify alone lets "</script>" close the block.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const outputs = (src) => [...src.matchAll(/\{\{-?([\s\S]*?)-?\}\}/g)].map((m) => m[1].trim());

test('the JSON-LD carries no store rating and no store reviews', () => {
  const html = read('index.html');
  const head = html.slice(0, html.indexOf('</head>'));
  assert.ok(!head.includes('"aggregateRating"'), 'aggregateRating is back in the JSON-LD');
  assert.ok(!head.includes('"review"'), 'a review array is back in the JSON-LD');
  assert.ok(!head.includes('"reviewCount"') && !head.includes('"ratingCount"'));
});

test('no page claims nothing leaves the browser, or calls the cleaned-up total "deleted"', () => {
  // The extension has sent usage counts since 1.6.0 and a Pro licence check since 2.0.0. An AI assistant repeated
  // the old "no telemetry" line in September 2026, so these phrasings stay out of everything it reads.
  const files = ['index.html', 'llms.txt', 'tutorials/index.html', 'pricing/index.html',
    '_posts/2026-04-20-youtube-watch-later-5000-limit.md',
    '_posts/2026-05-11-how-to-organize-youtube-watch-later.md',
    '_posts/2026-05-18-clean-up-unavailable-videos-youtube-watch-later.md'];
  const banned = [/runs locally/i, /no data leaving/i, /no server backend/i, /sends anything (off|out of)/i,
    /two things do leave/i, /deleted over \{\{ site\.data\.usage\.deletedTotal/, /ships with version 2/i,
    /arrives with version 2/i];
  for (const f of files) {
    const src = read(f);
    for (const re of banned) assert.ok(!re.test(src), `${f} matches ${re}`);
  }
});

test('marker digits are drawn from data-n, not written into the text', () => {
  const html = read('index.html');
  assert.ok(!/class="(pin[^"]*|n|num|step)"[^>]*>\d<\/span>/.test(html), 'a marker holds its digit as text');
  assert.equal(html.split(' data-n="').length - 1, 43, '16 pins, 8 row numbers, 16 label numbers, 3 steps');
  assert.ok(read('_includes/styles.html').includes('[data-n]::before { content: attr(data-n); }'));
});

test('every review field printed as HTML is escaped', () => {
  const html = read('index.html');
  const body = html.slice(html.indexOf('</head>'));
  const printed = outputs(body).filter((o) => /\br\.(text|author|quote|url|source|source_long)\b/.test(o));
  assert.ok(printed.length >= 10, `found ${printed.length}`);
  for (const o of printed) assert.ok(/\| (escape|uri_escape)$/.test(o), `unescaped in HTML: {{ ${o} }}`);
  // The review id only ever reaches a URL through uri_escape.
  for (const o of outputs(body).filter((x) => /\br\.id\b/.test(x))) assert.ok(o.endsWith('| uri_escape'), `{{ ${o} }}`);
});

test('llms.txt keeps each review on its own line', () => {
  const txt = read('llms.txt');
  const start = txt.indexOf('## What users say');
  assert.ok(start > 0);
  const printed = outputs(txt.slice(start, txt.indexOf('## Usage'))).filter((o) => /\br\.(text|author)\b/.test(o));
  assert.equal(printed.length, 2);
  for (const o of printed) assert.ok(o.endsWith('| normalize_whitespace'), `a review could open its own section: {{ ${o} }}`);
});

test('the page and llms.txt apply the same filters, so neither quotes a review the other hides', () => {
  const html = read('index.html');
  const txt = read('llms.txt');
  for (const [name, src] of [['index.html', html], ['llms.txt', txt]]) {
    assert.ok(src.includes('r.stars < cfg.min_stars'), `${name}: star floor`);
    assert.ok(src.includes('hidden_ids contains r.id'), `${name}: hide list`);
    assert.ok(src.includes('r.text.size < cfg.min_length'), `${name}: length floor`);
    assert.ok(src.includes('emitted >= cfg.max_shown') || src.includes('shown >= cfg.max_shown'), `${name}: cap`);
  }
  // index.html applies them once, in the marquee.
  assert.equal(html.split('hidden_ids contains r.id').length - 1, 1);
  assert.equal(html.split('r.text.size < cfg.min_length').length - 1, 1);
});
