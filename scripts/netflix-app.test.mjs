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

test('the page builds nothing from markup: no innerHTML anywhere', () => {
  assert.doesNotMatch(source, /innerHTML|insertAdjacentHTML|outerHTML|document\.write/);
});
