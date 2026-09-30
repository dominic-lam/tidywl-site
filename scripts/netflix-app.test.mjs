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

test('an Android phone names itself by kind only: its installed app shares the browser\'s storage', () => {
  assert.equal(P.phoneName('Mozilla/5.0 (Linux; Android 15; Pixel 9) Mobile Safari', true), 'Android phone');
  assert.equal(P.phoneName('Mozilla/5.0 (Linux; Android 15; SM-X910) Safari', false), 'Android tablet');
  assert.equal(P.phoneName(undefined, false), 'Phone');
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

// Objects made inside the vm come from another realm; compare them as plain JSON.
const plain = value => JSON.parse(JSON.stringify(value));
const copyOf = (guid, name) => ({ profile: { guid, name, storedAt: '2026-09-26T10:00:00Z', storedBy: 'Chrome on Mac' }, playlists: [] });

test('a scanned QR code: the extension\'s link or a bare code, and only ever the code', () => {
  assert.equal(P.codeFromScan('https://tidywl.com/netflix/app/#pair=K7M2QX'), 'K7M2QX');
  assert.equal(P.codeFromScan('k7m 2qx'), 'K7M2QX');
  for (const bad of ['https://tidywl.com/netflix/app/', 'https://example.com/', 'hello', '', null, 'x'.repeat(600)]) {
    assert.equal(P.codeFromScan(bad), null, String(bad).slice(0, 30));
  }
});

test('a phone\'s row names its kind, and on an iPhone where it runs', () => {
  const safari = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1';
  const chrome = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 CriOS/129.0 Mobile/15E148 Safari/604.1';
  assert.equal(P.phoneName(safari, false), 'iPhone · Safari');
  assert.equal(P.phoneName(safari, true), 'iPhone · Home Screen app');
  assert.equal(P.phoneName(chrome, false), 'iPhone · Chrome');
  assert.equal(P.phoneName('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)', false), 'iPhone');
  assert.equal(P.browserName(chrome), 'Chrome');
  assert.equal(P.browserName('nothing'), null);
});

test('a /phone answer: every profile, an older server\'s one copy, or nothing usable', () => {
  assert.deepEqual(plain(P.profilesFrom({ profiles: [copyOf('A', 'Dom'), { profile: null, playlists: [] }, copyOf('B', 'Kids')] })).map(c => c.profile.name), ['Dom', 'Kids']);
  assert.deepEqual(plain(P.profilesFrom(copyOf('A', 'Dom'))).map(c => c.profile.name), ['Dom']);
  assert.deepEqual(plain(P.profilesFrom({ profile: null, playlists: [] })), []);
  assert.equal(P.profilesFrom({ error: 'x' }), null);
  assert.equal(P.profilesFrom(null), null);
});

test('the profile on screen stays through a refresh, and falls back to the first when it is gone', () => {
  const profiles = [copyOf('A', 'Dom'), copyOf('B', 'Kids')];
  assert.equal(P.pickActive(profiles, 'B'), 'B');
  assert.equal(P.pickActive(profiles, 'Z'), 'A');
  assert.equal(P.pickActive([], 'A'), null);
});

test('storage is read defensively', () => {
  assert.equal(P.readPhone(null), null);
  assert.equal(P.readPhone({ pass: '' }), null);
  assert.deepEqual(plain(P.readPhone({ pass: 'nps_a', active: 'gone', profiles: [copyOf('A', 'Dom'), 'junk'], fetchedAt: 'soon' })),
    { pass: 'nps_a', active: 'A', profiles: [copyOf('A', 'Dom')], fetchedAt: null, pickSeen: null });
  assert.equal(P.readPhone({ pass: 'nps_a', pickSeen: 1790000000000 }).pickSeen, 1790000000000);
});

test('a phone paired before one pass read every profile keeps the pass it showed, and forgets the others', () => {
  const entry = (pass, guid, name) => ({ pass, guid, name, copy: copyOf(guid, name), fetchedAt: 1 });
  const moved = P.migrateStored({ active: 'nps_b', list: [entry('nps_a', 'A', 'tidywl'), entry('nps_b', 'B', 'Dominic')] }, null, null);
  assert.equal(moved.phone.pass, 'nps_b');
  assert.equal(moved.phone.active, 'B');
  assert.deepEqual(plain(moved.phone.profiles).map(c => c.profile.name), ['tidywl', 'Dominic'], 'the chips draw at once');
  assert.equal(moved.phone.fetchedAt, null, 'and refresh straight away');
  assert.deepEqual(plain(moved.forget), ['nps_a']);

  const single = P.migrateStored(null, 'nps_old', { copy: copyOf('A', 'Dom'), fetchedAt: 5 });
  assert.equal(single.phone.pass, 'nps_old');
  assert.equal(single.phone.active, 'A');
  assert.deepEqual(plain(single.forget), []);
  assert.equal(P.migrateStored(null, 'nps_old', null).phone.profiles.length, 0);
  assert.equal(P.migrateStored(null, null, null), null);
  assert.equal(P.migrateStored({ list: [{ pass: '' }] }, null, null), null);
});

// Tonight's pick (PLAN-tonight-phone). Dates in the machine's local time, as the phone reads them.
const at = (d, h, m) => new Date(2026, 8, d, h, m).getTime();
const pickList = (updatedAt, titles) => ({ id: 'tonightpick', name: "Tonight's pick", updatedAt, titles });
const law = { id: '70113002', title: 'Law Abiding Citizen', type: 'movie', year: 2009, art: null };
const list = (id, name) => ({ id, name, updatedAt: 1, titles: [] });

test('a pick is gone at the first 5:00 am strictly after it was sent', () => {
  assert.equal(P.tonightExpiry(at(29, 20, 30)), at(30, 5, 0), '8:30 pm: 5 am tomorrow');
  assert.equal(P.tonightExpiry(at(30, 1, 0)), at(30, 5, 0), '1 am: 5 am today');
  assert.equal(P.tonightExpiry(at(30, 4, 59)), at(30, 5, 0), '4:59 am: a minute later');
  assert.equal(P.tonightExpiry(at(30, 5, 0)), at(31, 5, 0), 'exactly 5 am: the next night');
  assert.equal(P.tonightExpiry(null), null);
  assert.equal(P.tonightExpiry(NaN), null);
});

test('the pick is never a playlist: left out of the list, the others kept in order', () => {
  const playlists = [list('mfriday0001', 'Friday'), pickList(at(29, 20, 30), [law]), list('mkids000001', 'Kids')];
  assert.deepEqual(plain(P.listedPlaylists(playlists)).map(p => p.id), ['mfriday0001', 'mkids000001']);
  assert.equal(P.listedPlaylists([pickList(at(29, 20, 30), [law])]).length, 0, 'counted as no playlists');
});

test('the pick is shown until its 5 am, and not without a title', () => {
  const playlists = [list('mfriday0001', 'Friday'), pickList(at(29, 20, 30), [law])];
  const live = P.tonightPick(playlists, at(29, 21, 0));
  assert.equal(live.title.title, 'Law Abiding Citizen');
  assert.equal(live.updatedAt, at(29, 20, 30));
  assert.equal(live.expiry, at(30, 5, 0));
  assert.notEqual(P.tonightPick(playlists, at(30, 4, 59)), null, 'still there at 4:59');
  assert.equal(P.tonightPick(playlists, at(30, 5, 0)), null, 'gone at 5');
  assert.equal(P.tonightPick([pickList(at(29, 20, 30), [])], at(29, 21, 0)), null);
  assert.equal(P.tonightPick([pickList('soon', [law])], at(29, 21, 0)), null);
  assert.equal(P.tonightPick([list('mfriday0001', 'Friday')], at(29, 21, 0)), null);
  assert.equal(P.titleName({ id: '70113002', title: '' }), 'Title 70113002');
});

test('the page opens once on the profile of the newest pick it has not opened onto', () => {
  const withPick = (guid, sent) => ({ profile: { guid, name: guid }, playlists: sent != null ? [list('mfriday0001', 'F'), pickList(sent, [law])] : [] });
  const profiles = [withPick('A', null), withPick('B', at(29, 20, 30)), withPick('C', at(29, 21, 0))];
  const now = at(29, 22, 0);
  assert.deepEqual(plain(P.pickToFollow(profiles, null, now)), { guid: 'C', updatedAt: at(29, 21, 0) }, 'the newest');
  assert.equal(P.pickToFollow(profiles, at(29, 21, 0), now), null, 'already opened onto: the chip chosen stands');
  assert.deepEqual(plain(P.pickToFollow([withPick('B', at(29, 20, 30))], at(28, 20, 0), now)), { guid: 'B', updatedAt: at(29, 20, 30) }, 'a newer pick');
  assert.equal(P.pickToFollow(profiles, null, at(30, 6, 0)), null, 'past 5 am: nothing to follow');
  assert.equal(P.pickToFollow([], null, now), null);
});

test('"Until 5:00 am" in the phone\'s own clock format', () => {
  assert.match(P.untilText(at(30, 5, 0), 'en-US'), /^Until 5:00\sAM$/);
  assert.equal(P.untilText(at(30, 5, 0), 'en-GB'), 'Until 05:00');
});

test('the page builds nothing from markup: no innerHTML anywhere', () => {
  assert.doesNotMatch(source, /innerHTML|insertAdjacentHTML|outerHTML|document\.write/);
});
