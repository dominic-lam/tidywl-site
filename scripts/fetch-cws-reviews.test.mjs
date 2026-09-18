// node --test scripts/fetch-cws-reviews.test.mjs
// The pure half of fetch-cws-reviews.mjs: what it reads from the page, what it keeps, and what it refuses to write.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { applyExclusions, assertWritable, EXCLUDE_IDS, LANGS, parseBatch, readPageIds, sortReviews, toReview }
  from './fetch-cws-reviews.mjs';

const read = (f) => readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');

const EXT = 'fkelmapobieliokjcmnilmjllacmbfjo';
const ID = '440ba4cd-96b7-4633-a7e6-ac6039d500e2';

// The shape of a review as the RPC sends it, 2026-09-16.
const raw = (over = {}) => {
  const r = [ID, ['Mahin Abdullah', 'https://lh3.googleusercontent.com/a/x'], 5, 'Best tool!', [1789211209, 845042719],
    [1789211209, 845042719], 1, null, null, null, null, '1.6.0', null, 'en', EXT];
  for (const [i, v] of Object.entries(over)) r[i] = v;
  return r;
};

test('the RPC id comes from the reviews block, not the listing block beside it', () => {
  const html = `"FdrFJe":"-7123340071477444980","cfb2h":"boq_x_20260908.02_p0" AF_dataServiceRequests = {'ds:0' : {id:'xY2Ddd',request:["${EXT}"]},'ds:1' : {id:'Ab12Cd',request:["${EXT}",[10],2,null,null,null,0]}};`;
  assert.deepEqual(readPageIds(html), { sid: '-7123340071477444980', bl: 'boq_x_20260908.02_p0', rpc: 'Ab12Cd' });
});

test('a page without the ids says so, and the RPC falls back to the known one', () => {
  const ids = readPageIds('<html>nothing here</html>');
  assert.equal(ids.sid, undefined);
  assert.equal(ids.bl, undefined);
  assert.equal(ids.rpc, 'x1DgCd');
});

test('the answer is read from the wrb.fr line for this RPC only', () => {
  const payload = JSON.stringify([null, [raw()], 1]);
  const body = `)]}'\n\n123\n[["wrb.fr","x1DgCd",${JSON.stringify(payload)},null,null,null,"generic"]]\n25\n[["e",4,null,null,168]]\n`;
  assert.deepEqual(parseBatch(body, 'x1DgCd'), [null, [raw()], 1]);
  assert.equal(parseBatch(body, 'Other1'), null, 'another RPC answer is not this one');
  assert.equal(parseBatch(')]}\'\n\n[["e",4]]\n', 'x1DgCd'), null, 'no wrb.fr line');
  assert.equal(parseBatch('[["wrb.fr","x1DgCd",null,null,null,[3],"generic"]]', 'x1DgCd'), null, 'an empty answer');
});

test('a review keeps what a card needs, and nothing else', () => {
  assert.deepEqual(toReview(raw()), {
    id: ID, author: 'Mahin Abdullah', stars: 5, text: 'Best tool!', date: '2026-09-12', version: '1.6.0', lang: 'en',
  });
  const kept = JSON.stringify(toReview(raw()));
  assert.ok(!kept.includes('googleusercontent'), 'no avatar URL');
});

test('only written, identifiable, rated reviews are kept', () => {
  assert.equal(toReview(raw({ 3: '' })), null, 'a rating with no text');
  assert.equal(toReview(raw({ 3: '   ' })), null, 'whitespace only');
  assert.equal(toReview(raw({ 3: null })), null);
  assert.equal(toReview(raw({ 0: 'not-a-uuid' })), null, 'an id that cannot become a review link');
  assert.equal(toReview(raw({ 0: '../../etc/passwd-00000000000000000000' })), null);
  assert.equal(toReview(raw({ 2: 0 })), null);
  assert.equal(toReview(raw({ 2: 6 })), null);
  assert.equal(toReview(null), null);
  assert.equal(toReview([]), null);
});

test('odd fields degrade instead of failing', () => {
  const r = toReview(raw({ 1: null, 4: null, 11: 7, 13: 'not a language code' }));
  assert.equal(r.author, 'A Chrome Web Store user');
  assert.equal(r.date, null);
  assert.equal(r.version, null);
  assert.equal(r.lang, null, 'a lang attribute is only ever a real code');
  assert.equal(toReview(raw({ 13: 'pt' })).lang, 'pt');
  assert.equal(toReview(raw({ 13: 'zh-TW' })).lang, 'zh-TW');
});

test('review text is stored as written; escaping belongs to the page that prints it', () => {
  // Stored raw on purpose. index.html must pass every field through | escape, and the build check proves it does.
  assert.equal(toReview(raw({ 3: '<img src=x onerror=alert(1)>' })).text, '<img src=x onerror=alert(1)>');
});

test('newest first, then by id, so an unchanged set serialises to the same bytes', () => {
  const a = { id: 'a', date: '2026-09-01' };
  const b = { id: 'b', date: '2026-09-12' };
  const c = { id: 'c', date: '2026-09-01' };
  const d = { id: 'd', date: null };
  assert.deepEqual(sortReviews([c, d, a, b]).map((x) => x.id), ['b', 'a', 'c', 'd']);
  assert.deepEqual(sortReviews([a, b, c, d]), sortReviews([d, c, b, a]));
});

test('nothing is written that would empty or halve the committed list', () => {
  const list = (n) => Array.from({ length: n }, (_, i) => ({ id: String(i) }));
  assert.throws(() => assertWritable([], 0), /empty/);
  assert.throws(() => assertWritable([], 42), /empty/);
  assert.throws(() => assertWritable(list(20), 42), /under half/);
  assert.doesNotThrow(() => assertWritable(list(21), 42), 'exactly half is allowed');
  assert.doesNotThrow(() => assertWritable(list(42), 42));
  assert.doesNotThrow(() => assertWritable(list(5), 0), 'the first run has nothing to compare against');
});

test('the sweep covers every language a review has been found in', () => {
  // Found 2026-09-16. A language dropped from the list silently drops its reviews from the site.
  for (const hl of ['en', 'de', 'es', 'ja', 'pt-BR', 'ru', 'vi', 'id', 'zh-CN', 'bg']) assert.ok(LANGS.includes(hl), hl);
  assert.equal(new Set(LANGS).size, LANGS.length, 'no duplicates');
  assert.equal(LANGS[0], 'en', 'English first, so a dead RPC fails fast');
});

// EXCLUDE_IDS keeps a review's text out of _data/cws-reviews.json, and so out of a public repo's history. The risk
// it carries is that it becomes a quiet way to bury criticism, so these tests pin it to "by id, with a reason".

test('the exclusion list drops the ids it names, and nothing else', () => {
  const excluded = [...EXCLUDE_IDS.keys()][0];
  const keep = { id: '440ba4cd-96b7-4633-a7e6-ac6039d500e2', stars: 5, text: 'Best tool!' };
  // Neutral fixture text on purpose: this repo is public, so the real review's words are not copied into it.
  const drop = { id: excluded, stars: 1, text: 'text of an excluded review' };
  assert.deepEqual(applyExclusions([keep, drop]), [keep]);
  assert.deepEqual(applyExclusions([keep]), [keep], 'nothing is dropped when the list matches nothing');
  assert.deepEqual(applyExclusions([]), []);
});

test('a bad rating is not itself grounds for exclusion', () => {
  // The whole point of going by id: genuine criticism stays in the file, whatever it says or scores. If this test
  // ever needs changing to make a build pass, the change is wrong.
  const complaints = [
    { id: '11111111-1111-4111-8111-111111111111', stars: 1, text: 'Broke my playlist and lost 40 videos.' },
    { id: '22222222-2222-4222-8222-222222222222', stars: 2, text: 'Sync is far too slow to be useful.' },
    { id: '33333333-3333-4333-8333-333333333333', stars: 1, text: 'Pro is overpriced for what it does.' },
  ];
  assert.deepEqual(applyExclusions(complaints), complaints);
});

test('every exclusion carries a real review id and says why it is there', () => {
  assert.ok(EXCLUDE_IDS.size > 0, 'an empty list means the guard below proves nothing');
  for (const [id, why] of EXCLUDE_IDS) {
    assert.match(id, /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/, `not a review id: ${id}`);
    assert.ok(why.length >= 60, `${id}: the reason has to be readable by someone who was not there`);
    assert.match(why, /\b20\d\d-\d\d-\d\d\b/, `${id}: the reason carries the date it was added`);
  }
});

test('an excluded review is on the page hide list too, so it cannot render if it ever lands', () => {
  // Two independent nets: this file stops it being stored, cws-reviews-config.yml stops it being shown.
  const cfg = read('_data/cws-reviews-config.yml');
  const hidden = [...cfg.matchAll(/^\s*-\s*([0-9a-f-]{36})/gm)].map((m) => m[1]);
  for (const id of EXCLUDE_IDS.keys()) assert.ok(hidden.includes(id), `${id} is excluded but not hidden`);
});

test('the write floor is applied once, to the post-exclusion list', () => {
  // assertWritable refuses a list under half the committed count. The committed file is already post-exclusion, so
  // the floor has to judge a post-exclusion list, or it compares two different things and refuses a good run.
  const src = read('scripts/fetch-cws-reviews.mjs');
  const calls = [...src.matchAll(/^\s+assertWritable\((\w+), previous\);/gm)].map((m) => m[1]);
  assert.deepEqual(calls, ['reviews'], 'the floor should run exactly once, on the excluded list');
  const excl = src.indexOf('applyExclusions(fetched)');
  assert.ok(excl > 0, 'main() no longer applies the exclusions');
  assert.ok(excl < src.indexOf('assertWritable(reviews, previous)'), 'the floor would judge a pre-exclusion count');
});

test('the run log names excluded ids but never their text', () => {
  // A failed run uploads this log as a workflow artifact on a public repo; the text must not travel in it.
  const src = read('scripts/fetch-cws-reviews.mjs');
  const logs = [...src.matchAll(/console\.log\(`([^`]*)`\)/g)].map((m) => m[1]);
  const line = logs.find((l) => l.includes('Excluded'));
  assert.ok(line, 'the exclusion is no longer logged, so a silent drop looks like no drop');
  assert.ok(!/\.text\b/.test(line), 'review text in the log');
});
