// node --test scripts/templates.test.mjs
// Reads the real templates. The review fields are strangers' text, published weekly without anyone reading them, so
// every place a template prints one must escape it: | escape in HTML, and in the JSON-LD a jsonify whose < > & are
// rewritten as their \u escapes, because jsonify alone lets "</script>" close the block.
//
// The escape check compares bytes built with String.fromCharCode(92), never a typed backslash sequence: on
// 2026-09-16 the tool that wrote this file's neighbour turned the typed sequence into the character itself, and the
// JSON-LD shipped a replace that replaced "<" with "<" before a byte count caught it.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const B = String.fromCharCode(92);
const SAFE_JSON = `| jsonify | replace: "<", "${B}u003c" | replace: ">", "${B}u003e" | replace: "&", "${B}u0026"`;
const REVIEW_FIELDS = /\br\.(text|author|quote|url|source|source_long|date)\b|\breview_url\b|\blang\b/;

const outputs = (src) => [...src.matchAll(/\{\{-?([\s\S]*?)-?\}\}/g)].map((m) => m[1].trim());

test('the JSON-LD escapes every review field it prints', () => {
  const html = read('index.html');
  const start = html.indexOf('"review": [');
  const end = html.indexOf('{%- endfor %}', start);
  assert.ok(start > 0 && end > start, 'the review array is where it was');
  const printed = outputs(html.slice(start, end)).filter((o) => REVIEW_FIELDS.test(o));
  assert.ok(printed.length >= 5, `found ${printed.length} printed fields`);
  for (const o of printed) {
    // r.stars | plus: 0 is a number and cannot carry markup; everything else must take the full chain.
    if (/^r\.stars \| plus: 0$/.test(o)) continue;
    assert.ok(o.endsWith(SAFE_JSON), `unsafe in JSON-LD: {{ ${o} }}`);
  }
});

test('the escape sequences are real backslash sequences, not the characters they stand for', () => {
  const html = read('index.html');
  assert.equal(html.split(`${B}u003c`).length - 1, 5, 'five fields carry the < rewrite');
  assert.ok(!html.includes('replace: "<", "<"'), 'a replace of < with < is a silent no-op');
  assert.ok(!html.includes('replace: ">", ">"'));
  assert.ok(!html.includes('replace: "&", "&"'));
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

test('the page, the JSON-LD and llms.txt apply the same filters, so none quotes a review the others hide', () => {
  const html = read('index.html');
  const txt = read('llms.txt');
  for (const [name, src] of [['index.html', html], ['llms.txt', txt]]) {
    assert.ok(src.includes('r.stars < cfg.min_stars'), `${name}: star floor`);
    assert.ok(src.includes('hidden_ids contains r.id'), `${name}: hide list`);
    assert.ok(src.includes('r.text.size < cfg.min_length'), `${name}: length floor`);
    assert.ok(src.includes('emitted >= cfg.max_shown') || src.includes('shown >= cfg.max_shown'), `${name}: cap`);
  }
  // index.html applies them twice: the JSON-LD and the marquee.
  assert.equal(html.split('hidden_ids contains r.id').length - 1, 2);
  assert.equal(html.split('r.text.size < cfg.min_length').length - 1, 2);
});
