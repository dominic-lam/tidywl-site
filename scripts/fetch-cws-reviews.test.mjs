// node --test scripts/fetch-cws-reviews.test.mjs
// The pure half of fetch-cws-reviews.mjs: what it reads from the page, what it keeps, and what it refuses to write.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { assertWritable, LANGS, parseBatch, readPageIds, sortReviews, toReview } from './fetch-cws-reviews.mjs';

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
