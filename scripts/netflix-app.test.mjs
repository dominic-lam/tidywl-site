// The Netflix phone page's pure parts (netflix/app/app.js), loaded with no document so nothing draws.
//   node --test scripts/netflix-app.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../netflix/app/app.js', import.meta.url), 'utf8');
const context = vm.createContext({ URL, Number, Math, JSON, Object, Array, String, Date });
vm.runInContext(source, context, { filename: 'app.js' });
const P = context.TidyPhone;

test('codes: forgiving like the server, strict on length and alphabet', () => {
  assert.equal(P.normalizeCode('k7m 2qx'), 'K7M2QX');
  assert.equal(P.normalizeCode('ol1-abc'), '011ABC');
  for (const bad of [null, '', 'K7M2Q', 'K7M2QXX', 'K7M2QU']) assert.equal(P.normalizeCode(bad), null, String(bad));
});

test('the fragment: a pairing code, or an open playlist, and nothing else', () => {
  assert.equal(P.pairCodeFromHash('#pair=K7M2QX'), 'K7M2QX');
  assert.equal(P.pairCodeFromHash('#pair=k7m%202qx'), 'K7M2QX');
  assert.equal(P.pairCodeFromHash('#pair=%E0%A4%A'), null);
  assert.equal(P.pairCodeFromHash('#list=abc'), null);
  assert.equal(P.listIdFromHash('#list=mudcujery14aac9q'), 'mudcujery14aac9q');
  assert.equal(P.listIdFromHash('#list=<img>'), null);
});

test('the phone names itself by kind only', () => {
  assert.equal(P.phoneName('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)'), 'iPhone');
  assert.equal(P.phoneName('Mozilla/5.0 (Linux; Android 15; Pixel 9) Mobile Safari'), 'Android phone');
  assert.equal(P.phoneName('Mozilla/5.0 (Linux; Android 15; SM-X910) Safari'), 'Android tablet');
  assert.equal(P.phoneName(undefined), 'Phone');
});

test('box art only from Netflix image servers over https, and links only to a numeric title page', () => {
  assert.equal(P.isNetflixArt('https://occ-0-2794-2219.1.nflxso.net/dnm/api/v6/x.jpg?r=1'), true);
  for (const bad of ['http://occ-0-1.1.nflxso.net/x.jpg', 'https://nflxso.net.evil.com/x.jpg', 'javascript:alert(1)', null]) {
    assert.equal(P.isNetflixArt(bad), false, String(bad));
  }
  assert.equal(P.titleLink('80057281'), 'https://www.netflix.com/title/80057281');
  assert.equal(P.titleLink('8005/../x'), null);
});

test('words: relative time, card meta, and every claim error in plain language', () => {
  const now = Date.UTC(2026, 8, 24, 12);
  assert.equal(P.relativeTime(now - 30e3, now), 'just now');
  assert.equal(P.relativeTime(now - 2 * 3600e3, now), '2 hours ago');
  assert.equal(P.relativeTime(NaN, now), null);
  assert.equal(P.titleMeta({ type: 'show', year: 2016 }), 'Series · 2016');
  assert.equal(P.titleMeta({ type: null, year: null }), '');
  for (const code of ['malformed_code', 'invalid_code', 'not_entitled', 'rate_limited', 'unreachable']) {
    assert.doesNotMatch(P.claimErrorText(code), /went wrong/, code);
  }
  assert.match(P.profileColor('PYNALXALABDV5PSNPM35IYGEFM'), /^hsl\(\d+, 55%, 40%\)$/);
});

test('install instructions by platform; an iPad asking for the desktop site is still iOS', () => {
  assert.equal(P.platformOf('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)', 5), 'ios');
  assert.equal(P.platformOf('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605.1.15', 5), 'ios');
  assert.equal(P.platformOf('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605.1.15', 0), 'other');
  assert.equal(P.platformOf('Mozilla/5.0 (Linux; Android 15; Pixel 9) Mobile Safari', 5), 'android');
  assert.equal(P.platformOf(undefined, undefined), 'other');
});

test('a cover: four arts for a mosaic, else the first, and never art from anywhere else', () => {
  const art = n => ({ art: `https://occ-0-1.1.nflxso.net/dnm/api/v6/${n}.jpg` });
  assert.equal(P.coverArts([art(1), art(2), art(3), art(4), art(5)]).length, 4);
  assert.deepEqual(Array.from(P.coverArts([art(1), art(2), art(3)])), [art(1).art]);
  assert.deepEqual(Array.from(P.coverArts([{ art: 'https://evil.example/x.jpg' }, { art: null }, null, art(9)])), [art(9).art]);
  assert.equal(P.coverArts(undefined).length, 0);
  assert.match(P.coverBackground('mudcujery14aac9q'), /^linear-gradient\(135deg, hsl\(\d+, 38%, 30%\), hsl\(\d+, 42%, 13%\)\)$/);
});

test('what is in a playlist, in words', () => {
  const show = { type: 'show' }, movie = { type: 'movie' }, unknown = { type: null };
  assert.equal(P.countLine([]), 'Empty');
  assert.equal(P.countLine([show, show]), '2 series');
  assert.equal(P.countLine([movie]), '1 film');
  assert.equal(P.countLine([show, show, movie]), '3 titles · 2 series, 1 film');
  assert.equal(P.countLine([unknown]), '1 title');
  assert.equal(P.countLine([show, unknown]), '2 titles · 1 series');
});

test('a page coming back to the front asks again only after a minute', () => {
  const now = Date.UTC(2026, 8, 26, 12);
  assert.equal(P.isStale(null, now), true);
  assert.equal(P.isStale(now - 30e3, now), false);
  assert.equal(P.isStale(now - 61e3, now), true);
});

test('the page builds nothing from markup: no innerHTML anywhere', () => {
  assert.doesNotMatch(source, /innerHTML|insertAdjacentHTML|outerHTML|document\.write/);
});
