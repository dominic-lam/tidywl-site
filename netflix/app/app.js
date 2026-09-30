/*
 * TidyWL for Netflix — the phone page. Read-only, no account.
 * Contract: tidywl-netflix/docs/claude/PLAN-mobile-sync.md § The phone.
 *
 * PAIRING: the extension shows a six-character code that lasts ten minutes and
 * works once, as text and as a QR code of #pair=<code>. Typed here, scanned
 * with Scan code, or arriving in the address, it is swapped at
 * /api/netflix/pair/claim for a pass of this phone's own. The fragment never
 * reaches a server, and it is wiped from the address bar at once.
 *
 * ONE PASS, EVERY PROFILE (2026-09-26, the user's call): a pass reads every
 * profile the licence has synced, one chip each, so a phone is paired once and
 * a profile synced later simply appears. A phone that held a pass per profile
 * (the same day's first design) keeps the one it was showing and forgets the
 * rest, on the server too.
 *
 * INSTALL FIRST, ON AN IPHONE: Safari and a Home Screen app keep separate
 * storage, so pairing Safari and then installing means pairing twice and two
 * rows in the extension. An unpaired Safari tab on an iPhone therefore asks to
 * be added to the Home Screen first; a scanned code is held, unspent, until
 * Skip, so the installed app can scan the same one. Android's installed app
 * shares Chrome's storage and is never asked.
 *
 * OPENING: the last copy is drawn from this phone's storage straight away,
 * then refreshed from /api/netflix/phone — on open, from the Refresh button,
 * and when the page comes back to the front after a minute away, since a Home
 * Screen app has no reload of its own. A pass the server no longer knows
 * (removed in the extension) or a subscription that ended clears the copy:
 * what a lapsed licence returns is nothing. Forget also asks the server to
 * drop this phone's row.
 *
 * SCANNING: lib/jsqr, loaded on the first Scan code, reads camera frames on the
 * phone. Nothing from the camera leaves it.
 *
 * INSTALLING: sw.js keeps this page's own files, never the playlists.
 *
 * TONIGHT'S PICK (1.1.0): the extension's "Later, on my phone" sends one title
 * as a playlist with the fixed id `tonightpick`. It is never drawn as a
 * playlist: until the first 5:00 am after it was sent it is the first row above
 * them, and a tap opens the title as a card does; after that it is not drawn.
 * Once per pick, the list opens on the profile it came from. Contract:
 * tidywl-netflix/docs/claude/PLAN-tonight-phone.md.
 *
 * Everything shown is built with textContent. Box art loads straight from
 * Netflix's image servers, never copied to ours (the user, 2026-09-23), and
 * only from the host the server already checked.
 */
(function (root) {
  'use strict';

  var API = '/api/netflix/';
  // { pass, active: <guid>, profiles: [{ profile, playlists }], fetchedAt, pickSeen }; pickSeen is the updatedAt of
  // the last Tonight's pick this phone opened onto.
  var PHONE_KEY = 'tidywl_nf_phone';
  // Earlier shapes, moved into PHONE_KEY on first open: a pass per profile (2026-09-26, hours), and before
  // that one pass and its copy.
  var PROFILES_KEY = 'tidywl_nf_phone_profiles';
  var LEGACY_PASS_KEY = 'tidywl_nf_phone_pass';
  var LEGACY_COPY_KEY = 'tidywl_nf_phone_copy';
  // Skip on the install-first screen, or Not now on the Home Screen card: never asked again on this phone.
  var INSTALL_DISMISSED_KEY = 'tidywl_nf_phone_install_dismissed';
  var CODE_ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
  var STALE_MS = 60 * 1000;
  var LOGO = 'icons/icon-192.png';
  var JSQR = 'lib/jsqr/jsQR.js?v=1.4.0';
  var SCAN_EVERY_MS = 150;
  var SCAN_MAX_SIDE = 640;
  // Tonight's pick: one per profile, and a normal playlist id can never be this one. Gone at 5 am, the night's end.
  var TONIGHT_ID = 'tonightpick';
  var NIGHT_ENDS_HOUR = 5;

  // --- pure --------------------------------------------------------------------

  /** Canonical code, or null — as forgiving as the server: case, spaces and dashes, I/L as 1, O as 0. */
  function normalizeCode(input) {
    if (typeof input !== 'string') return null;
    var s = input.toUpperCase().replace(/[^0-9A-Z]/g, '').replace(/[IL]/g, '1').replace(/O/g, '0');
    if (s.length !== 6) return null;
    for (var i = 0; i < s.length; i++) if (CODE_ALPHABET.indexOf(s[i]) < 0) return null;
    return s;
  }

  /** "#pair=K7M2QX" → "K7M2QX"; anything else → null. */
  function pairCodeFromHash(hash) {
    var m = /^#pair=([^&]*)/.exec(typeof hash === 'string' ? hash : '');
    if (m == null) return null;
    var raw;
    try { raw = decodeURIComponent(m[1]); } catch (e) { return null; }
    return normalizeCode(raw);
  }

  /** What a scanned QR code holds: the extension's link, or a bare code. Only the code is ever used. */
  function codeFromScan(text) {
    if (typeof text !== 'string' || text.length > 500) return null;
    var url;
    try { url = new URL(text.trim()); } catch (e) { return normalizeCode(text); }
    return pairCodeFromHash(url.hash);
  }

  /** "#list=<id>" → "<id>"; the open playlist lives in the address so Back works. */
  function listIdFromHash(hash) {
    var m = /^#list=([a-z0-9]{8,40})$/.exec(typeof hash === 'string' ? hash : '');
    return m != null ? m[1] : null;
  }

  /** The browser an iPhone page is running in, by the name it gives itself; null when it gives none. */
  function browserName(ua) {
    var s = typeof ua === 'string' ? ua : '';
    if (/CriOS/.test(s)) return 'Chrome';
    if (/FxiOS/.test(s)) return 'Firefox';
    if (/EdgiOS/.test(s)) return 'Edge';
    if (/Safari/.test(s)) return 'Safari';
    return null;
  }

  /**
   * What the extension's phone list calls this device: its kind, and on an iPhone where it runs, since
   * Safari and the Home Screen app pair separately there. Nothing more specific is sent.
   */
  function phoneName(ua, standalone) {
    var s = typeof ua === 'string' ? ua : '';
    var apple = /iPhone/.test(s) ? 'iPhone' : /iPad/.test(s) ? 'iPad' : null;
    if (apple != null) {
      var where = standalone === true ? 'Home Screen app' : browserName(s);
      return where != null ? apple + ' · ' + where : apple;
    }
    if (/Android/.test(s)) return /Mobile/.test(s) ? 'Android phone' : 'Android tablet';
    return 'Phone';
  }

  /** Which Add to Home Screen instructions apply. An iPad asking for the desktop site says Macintosh, with touch. */
  function platformOf(ua, touchPoints) {
    var s = typeof ua === 'string' ? ua : '';
    if (/iPhone|iPad|iPod/.test(s) || (/Macintosh/.test(s) && touchPoints > 1)) return 'ios';
    if (/Android/.test(s)) return 'android';
    return 'other';
  }

  function isNetflixArt(value) {
    if (typeof value !== 'string' || value.length > 1000) return false;
    var url;
    try { url = new URL(value); } catch (e) { return false; }
    return url.protocol === 'https:' && (url.hostname === 'nflxso.net' || /\.nflxso\.net$/.test(url.hostname));
  }

  /** The art a playlist's cover is made of: four for a mosaic, else the first, else none. */
  function coverArts(titles) {
    var arts = (Array.isArray(titles) ? titles : [])
      .map(function (t) { return t != null ? t.art : null; })
      .filter(isNetflixArt);
    return arts.length >= 4 ? arts.slice(0, 4) : arts.slice(0, 1);
  }

  /** "9 titles · 7 series, 2 films"; "3 series" when that is all there is. */
  function countLine(titles) {
    var list = Array.isArray(titles) ? titles : [];
    var n = list.length;
    if (n === 0) return 'Empty';
    var shows = list.filter(function (t) { return t != null && t.type === 'show'; }).length;
    var films = list.filter(function (t) { return t != null && t.type === 'movie'; }).length;
    if (shows === n) return n + ' series';
    if (films === n) return n + (n === 1 ? ' film' : ' films');
    var parts = [];
    if (shows > 0) parts.push(shows + ' series');
    if (films > 0) parts.push(films + (films === 1 ? ' film' : ' films'));
    return n + (n === 1 ? ' title' : ' titles') + (parts.length > 0 ? ' · ' + parts.join(', ') : '');
  }

  /** Worth asking the server again: never fetched, or fetched over a minute ago. */
  function isStale(fetchedAt, now) {
    return !Number.isFinite(fetchedAt) || now - fetchedAt > STALE_MS;
  }

  /** A title page, not /watch: a tap in the wrong profile then starts nothing (PLAN-mobile-sync, default 5). */
  function titleLink(id) {
    return /^\d{1,12}$/.test(String(id)) ? 'https://www.netflix.com/title/' + id : null;
  }

  function relativeTime(then, now) {
    if (!Number.isFinite(then)) return null;
    var s = Math.max(0, Math.round((now - then) / 1000));
    if (s < 60) return 'just now';
    var m = Math.round(s / 60);
    if (m < 60) return m + (m === 1 ? ' minute ago' : ' minutes ago');
    var h = Math.round(m / 60);
    if (h < 24) return h + (h === 1 ? ' hour ago' : ' hours ago');
    var d = Math.round(h / 24);
    return d + (d === 1 ? ' day ago' : ' days ago');
  }

  function hueOf(value) {
    var h = 0;
    var s = typeof value === 'string' ? value : '';
    for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    return h % 360;
  }

  /** A colour from the profile's guid, never Netflix's avatar (PLAN-mobile-sync § The phone). */
  function profileColor(guid) {
    return 'hsl(' + hueOf(guid) + ', 55%, 40%)';
  }

  /** A playlist with no art gets a dark wash of its own, from its id: quieter than a profile's colour. */
  function coverBackground(id) {
    var h = hueOf(id);
    return 'linear-gradient(135deg, hsl(' + h + ', 38%, 30%), hsl(' + ((h + 40) % 360) + ', 42%, 13%))';
  }

  function titleMeta(t) {
    var parts = [];
    if (t.type === 'show') parts.push('Series');
    else if (t.type === 'movie') parts.push('Film');
    if (Number.isInteger(t.year)) parts.push(String(t.year));
    return parts.join(' · ');
  }

  /** A title's name, or its id when the browser that synced it could not name it. */
  function titleName(t) {
    return typeof t.title === 'string' && t.title !== '' ? t.title : 'Title ' + t.id;
  }

  /** When a pick sent at `updatedAt` stops showing: the first 5:00 am, local time, strictly after it. */
  function tonightExpiry(updatedAt) {
    if (!Number.isFinite(updatedAt)) return null;
    var end = new Date(updatedAt);
    end.setHours(NIGHT_ENDS_HOUR, 0, 0, 0);
    if (end.getTime() <= updatedAt) {
      end.setDate(end.getDate() + 1);
      end.setHours(NIGHT_ENDS_HOUR, 0, 0, 0); // a clock change overnight
    }
    return end.getTime();
  }

  /** The playlists drawn as playlists, in their order: never Tonight's pick, which has a row of its own. */
  function listedPlaylists(playlists) {
    return playlists.filter(function (p) { return p.id !== TONIGHT_ID; });
  }

  /** A profile's pick while its night lasts — its one title, when it was sent, when it goes — else null. */
  function tonightPick(playlists, now) {
    var p = playlists.filter(function (x) { return x.id === TONIGHT_ID; })[0];
    if (p == null || !Array.isArray(p.titles) || p.titles[0] == null) return null;
    var expiry = tonightExpiry(p.updatedAt);
    return expiry != null && now < expiry ? { title: p.titles[0], updatedAt: p.updatedAt, expiry: expiry } : null;
  }

  /** The profile to open on, once per pick: the newest live pick sent after the last one opened onto, or null. */
  function pickToFollow(profiles, seen, now) {
    var best = null;
    profiles.forEach(function (c) {
      var pick = tonightPick(c.playlists, now);
      if (pick == null || (seen != null && pick.updatedAt <= seen)) return;
      if (best == null || pick.updatedAt > best.updatedAt) best = { guid: c.profile.guid, updatedAt: pick.updatedAt };
    });
    return best;
  }

  /** "Until 5:00 am", in the phone's own clock format. */
  function untilText(expiry, locale) {
    return 'Until ' + new Date(expiry).toLocaleTimeString(locale, { timeStyle: 'short' });
  }

  function claimErrorText(error) {
    switch (error) {
      case 'malformed_code': return 'A code is six letters and numbers, like K7M 2QX.';
      case 'invalid_code': return 'That code did not work. A code lasts ten minutes and works once — make a new one in the extension (About → Pro → Pair a phone).';
      case 'not_entitled': return 'The Pro subscription behind that code is not active.';
      case 'rate_limited': return 'Too many tries. Wait a minute and try again.';
      case 'unreachable': return 'Could not reach tidywl.com. Check your connection and try again.';
      default: return 'Something went wrong (' + error + '). Try again in a moment.';
    }
  }

  function isCopy(c) {
    return c != null && c.profile != null && typeof c.profile.guid === 'string' && Array.isArray(c.playlists);
  }

  /** The profiles in a /phone answer — {profiles: [...]}, or a server from before 2026-09-26's one copy — or null. */
  function profilesFrom(body) {
    if (body == null) return null;
    if (Array.isArray(body.profiles)) return body.profiles.filter(isCopy);
    if (Array.isArray(body.playlists)) return isCopy(body) ? [body] : [];
    return null;
  }

  /** The profile on screen: the one chosen if it is still there, else the first. */
  function pickActive(profiles, guid) {
    var found = profiles.some(function (c) { return c.profile.guid === guid; });
    return found ? guid : profiles.length > 0 ? profiles[0].profile.guid : null;
  }

  /** What storage held, or null when it holds no pass. */
  function readPhone(raw) {
    if (raw == null || typeof raw.pass !== 'string' || raw.pass === '') return null;
    var profiles = Array.isArray(raw.profiles) ? raw.profiles.filter(isCopy) : [];
    return {
      pass: raw.pass,
      active: pickActive(profiles, raw.active),
      profiles: profiles,
      fetchedAt: Number.isFinite(raw.fetchedAt) ? raw.fetchedAt : null,
      pickSeen: Number.isFinite(raw.pickSeen) ? raw.pickSeen : null
    };
  }

  /**
   * A phone paired before one pass read every profile: the pass it was showing, with every copy it had
   * so the chips draw at once, and the other passes, to forget on the server. Null when it held none.
   */
  function migrateStored(profilesKey, legacyPass, legacyCopy) {
    var list = profilesKey != null && Array.isArray(profilesKey.list)
      ? profilesKey.list.filter(function (e) { return e != null && typeof e.pass === 'string' && e.pass !== ''; })
      : [];
    if (list.length > 0) {
      var shown = list.filter(function (e) { return e.pass === profilesKey.active; })[0] || list[0];
      var copies = list.map(function (e) { return e.copy; }).filter(isCopy);
      return {
        phone: readPhone({ pass: shown.pass, active: isCopy(shown.copy) ? shown.copy.profile.guid : null, profiles: copies, fetchedAt: null }),
        forget: list.filter(function (e) { return e.pass !== shown.pass; }).map(function (e) { return e.pass; })
      };
    }
    if (typeof legacyPass === 'string' && legacyPass !== '') {
      var copy = legacyCopy != null && isCopy(legacyCopy.copy) ? legacyCopy.copy : null;
      return {
        phone: readPhone({ pass: legacyPass, active: copy != null ? copy.profile.guid : null, profiles: copy != null ? [copy] : [], fetchedAt: null }),
        forget: []
      };
    }
    return null;
  }

  // --- storage: a convenience, never required ------------------------------------

  function load(key) {
    try {
      var raw = root.localStorage.getItem(key);
      return raw == null ? null : JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  function save(key, value) {
    try {
      root.localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      return false; // private mode: the page still works
    }
  }

  function forget(key) {
    try { root.localStorage.removeItem(key); } catch (e) { /* nothing to do */ }
  }

  // --- requests ------------------------------------------------------------------

  async function request(path, init) {
    var response;
    try {
      response = await root.fetch(API + path, Object.assign({ cache: 'no-store', credentials: 'omit' }, init));
    } catch (e) {
      return { status: 0, body: null };
    }
    var body = null;
    try { body = await response.json(); } catch (e) { body = null; }
    return { status: response.status, body: body };
  }

  function errorOf(result) {
    if (result.status === 0) return 'unreachable';
    return result.body != null && typeof result.body.error === 'string' ? result.body.error : 'http_' + result.status;
  }

  /** Take a pass off the licence's list of phones. Best effort: offline, the row stays until removed in the extension. */
  function forgetPass(pass) {
    return request('phone', { method: 'DELETE', headers: { authorization: 'Bearer ' + pass } });
  }

  // --- drawing -------------------------------------------------------------------

  var app = null;
  var pickTimer = null; // redraws when Tonight's pick on screen reaches its 5 am
  var state = {
    phone: null, banner: null, pairError: null, busy: false, refreshing: false, typed: '', pendingCode: null,
    installPrompt: null, view: null, listsScroll: 0, navigatedIn: false, scan: null
  };

  function persist() {
    if (state.phone == null) forget(PHONE_KEY);
    else save(PHONE_KEY, state.phone);
  }

  /** Once per pick, open on the profile it came from; after that the viewer's own chip stands. True when it followed one. */
  function followPick() {
    var pick = pickToFollow(state.phone.profiles, state.phone.pickSeen, Date.now());
    if (pick == null) return false;
    state.phone.active = pick.guid;
    state.phone.pickSeen = pick.updatedAt;
    return true;
  }

  function activeCopy() {
    if (state.phone == null) return null;
    var guid = state.phone.active;
    return state.phone.profiles.filter(function (c) { return c.profile.guid === guid; })[0] || null;
  }

  function installDismissed() {
    return load(INSTALL_DISMISSED_KEY) === true;
  }

  function el(tag, props, children) {
    var node = root.document.createElement(tag);
    if (props != null) {
      for (var k in props) {
        if (k === 'text') node.textContent = props[k];
        else if (k === 'className') node.className = props[k];
        else if (k.slice(0, 2) === 'on') node.addEventListener(k.slice(2), props[k]);
        else node.setAttribute(k, props[k]);
      }
    }
    (children || []).forEach(function (c) { if (c != null) node.appendChild(typeof c === 'string' ? root.document.createTextNode(c) : c); });
    return node;
  }

  // Stroke icons, drawn from these constants only.
  var ICONS = {
    back: ['M15 18l-6-6 6-6'],
    chevron: ['M9 18l6-6-6-6'],
    refresh: ['M21 12a9 9 0 1 1-2.64-6.36', 'M21 4v5h-5'],
    share: ['M12 3v12', 'M8 7l4-4 4 4', 'M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7'],
    out: ['M7 17L17 7', 'M9 7h8v8'],
    clock: ['M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18z', 'M12 7v5l3 2'],
    info: ['M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18z', 'M12 16v-4', 'M12 8h.01'],
    alert: ['M10.3 4L2.4 18a2 2 0 0 0 1.7 3h15.8a2 2 0 0 0 1.7-3L13.7 4a2 2 0 0 0-3.4 0z', 'M12 9v4', 'M12 17h.01'],
    scan: ['M4 8V6a2 2 0 0 1 2-2h2', 'M16 4h2a2 2 0 0 1 2 2v2', 'M20 16v2a2 2 0 0 1-2 2h-2', 'M8 20H6a2 2 0 0 1-2-2v-2', 'M4 12h16'],
    plusSquare: ['M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z', 'M12 8v8', 'M8 12h8']
  };

  function icon(name, size, className) {
    var ns = 'http://www.w3.org/2000/svg';
    var svg = root.document.createElementNS(ns, 'svg');
    var attrs = { viewBox: '0 0 24 24', width: size, height: size, fill: 'none', stroke: 'currentColor',
      'stroke-width': name === 'back' || name === 'chevron' || name === 'out' ? 2.4 : 2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'aria-hidden': 'true' };
    if (className != null) attrs['class'] = className;
    for (var k in attrs) svg.setAttribute(k, attrs[k]);
    ICONS[name].forEach(function (d) {
      var path = root.document.createElementNS(ns, 'path');
      path.setAttribute('d', d);
      svg.appendChild(path);
    });
    return svg;
  }

  function firstChar(s) {
    var chars = Array.from(typeof s === 'string' ? s.trim() : '');
    return chars.length > 0 ? chars[0].toUpperCase() : '?';
  }

  function isStandalone() {
    return (root.matchMedia != null && root.matchMedia('(display-mode: standalone)').matches) || root.navigator.standalone === true;
  }

  function platform() {
    return platformOf(root.navigator.userAgent, root.navigator.maxTouchPoints);
  }

  /** An unpaired iPhone browser tab, not yet told no: add to the Home Screen before pairing. */
  function wantsInstallFirst() {
    return platform() === 'ios' && !isStandalone() && !installDismissed();
  }

  /** Scan code is offered where there is a camera worth pointing: a phone or tablet, with the API. */
  function canScan() {
    var p = platform();
    return (p === 'ios' || p === 'android') && root.navigator.mediaDevices != null &&
      typeof root.navigator.mediaDevices.getUserMedia === 'function';
  }

  function draw() {
    var copy = activeCopy();
    var listId = listIdFromHash(root.location.hash);
    var open = listId != null && copy != null
      ? listedPlaylists(copy.playlists).filter(function (p) { return p.id === listId; })[0]
      : null;
    var view = state.phone == null ? (wantsInstallFirst() ? 'install' : 'code') : open != null ? 'list:' + open.id : 'lists';
    if (view === 'lists' && followPick()) {
      persist();
      copy = activeCopy();
    }
    root.clearTimeout(pickTimer);
    var entering = view !== state.view;
    if (entering && state.view === 'lists') state.listsScroll = root.scrollY;

    app.textContent = '';
    if (view === 'install') drawInstallFirst();
    else if (view === 'code') drawPair();
    else if (open != null) drawList(open);
    else drawHome(copy);

    if (entering) {
      var content = app.querySelector('.content');
      if (content != null && state.view != null) content.classList.add('enter');
      root.scrollTo(0, view === 'lists' ? state.listsScroll : 0);
      state.view = view;
    }
    syncBar();
  }

  function syncBar() {
    var bar = app != null ? app.querySelector('.bar') : null;
    if (bar != null) bar.classList.toggle('is-scrolled', root.scrollY > 36);
  }

  function drawBar(back, title) {
    var start = back
      ? el('a', { className: 'back-btn', href: '#', 'aria-label': 'All playlists', onclick: goBack }, [icon('back', 22), 'Playlists'])
      : el('img', { className: 'bar-logo', src: LOGO, alt: '' });
    var refreshButton = el('button', {
      type: 'button', className: 'icon-btn' + (state.refreshing ? ' is-busy' : ''), 'aria-label': 'Refresh',
      onclick: function () { refresh(true); }
    }, [icon('refresh', 20)]);
    refreshButton.disabled = state.refreshing;
    return el('header', { className: 'bar' }, [el('div', { className: 'bar-inner' }, [
      el('div', { className: 'bar-start' }, [start]),
      el('div', { className: 'bar-title', 'aria-hidden': 'true', text: title }),
      el('div', { className: 'bar-end' }, [refreshButton])
    ])]);
  }

  function goBack(e) {
    e.preventDefault();
    // Back through history only when this page put the playlist there; opened
    // straight onto one, Back would leave the page.
    if (state.navigatedIn) {
      state.navigatedIn = false;
      root.history.back();
      return;
    }
    root.history.replaceState(null, '', root.location.pathname);
    draw();
  }

  function callout(iconName, children, role) {
    return el('div', { className: 'callout', role: role }, [icon(iconName, 18), el('div', null, children)]);
  }

  function emptyState(title, text) {
    return el('div', { className: 'empty' }, [el('img', { src: LOGO, alt: '' }), el('strong', { text: title }), el('span', { text: text })]);
  }

  function artImg(src, eager) {
    var img = el('img', { src: src, alt: '', loading: eager ? 'eager' : 'lazy', decoding: 'async', referrerpolicy: 'no-referrer' });
    img.addEventListener('error', function () { img.style.visibility = 'hidden'; });
    return img;
  }

  function drawHome(copy) {
    app.appendChild(drawBar(false, 'Playlists'));
    var content = el('main', { className: 'content' });
    app.appendChild(content);
    content.appendChild(el('h1', { className: 'title', text: 'Playlists' }));

    if (state.phone.fetchedAt == null && copy == null) {
      content.appendChild(state.banner != null ? callout('alert', [state.banner], 'status') : drawSkeleton());
      content.appendChild(drawFoot());
      return;
    }
    if (copy == null) {
      if (state.banner != null) content.appendChild(callout('alert', [state.banner], 'status'));
      else content.appendChild(emptyState('Nothing has synced yet', 'Turn on sync in the extension (About → Pro), then open this page again.'));
      content.appendChild(drawFoot());
      return;
    }

    content.appendChild(drawProfiles(copy));
    if (state.banner != null) content.appendChild(callout('alert', [state.banner], 'status'));
    var lists = listedPlaylists(copy.playlists);
    var pick = tonightPick(copy.playlists, Date.now());
    var rows = lists.map(drawPlaylistRow);
    if (pick != null) {
      rows.unshift(drawPickRow(pick));
      pickTimer = root.setTimeout(draw, pick.expiry - Date.now());
    }
    if (rows.length > 0) content.appendChild(el('ul', { className: 'pls' }, rows));
    if (lists.length === 0) {
      content.appendChild(emptyState('No playlists yet', 'Make one in the extension and it appears here after the next sync.'));
    }
    var install = drawInstall();
    if (install != null) content.appendChild(install);
    content.appendChild(drawFoot());
  }

  /** A chip per synced profile, the one shown filled; under them, how fresh it is — provenance, not live status. */
  function drawProfiles(copy) {
    var chips = state.phone.profiles.map(function (c) {
      var name = c.profile.name || 'Profile';
      return el('button', {
        type: 'button', className: 'chip', 'aria-pressed': c === copy ? 'true' : 'false',
        onclick: function () { switchTo(c.profile.guid); }
      }, [
        el('span', { className: 'avatar', style: 'background:' + profileColor(c.profile.guid), 'aria-hidden': 'true', text: firstChar(name) }),
        el('span', { className: 'chip-name', text: name })
      ]);
    });
    var synced = relativeTime(Date.parse(copy.profile.storedAt), Date.now());
    var detail = [synced != null ? 'Synced ' + synced : null, copy.profile.storedBy ? 'from ' + copy.profile.storedBy : null].filter(Boolean).join(' ');
    return el('div', { className: 'profiles' }, [
      el('div', { className: 'chips', role: 'group', 'aria-label': 'Profiles' }, chips),
      detail !== '' ? el('div', { className: 'profile-meta', text: detail }) : null
    ]);
  }

  function switchTo(guid) {
    if (state.phone == null || state.phone.active === guid) return;
    state.phone.active = guid;
    persist();
    state.banner = null;
    draw();
  }

  function drawCover(p) {
    var arts = coverArts(p.titles);
    if (arts.length === 0) {
      return el('span', { className: 'cover', style: 'background:' + coverBackground(p.id), 'aria-hidden': 'true' },
        [el('span', { className: 'cover-letter', text: firstChar(p.name) })]);
    }
    return el('span', { className: 'cover' + (arts.length === 4 ? ' cover--4' : ''), 'aria-hidden': 'true' },
      arts.map(function (src) { return artImg(src, false); }));
  }

  function drawPlaylistRow(p) {
    return el('li', null, [el('a', {
      className: 'pl', href: '#list=' + p.id,
      onclick: function () { state.navigatedIn = true; }
    }, [
      drawCover(p),
      el('div', { className: 'pl-text' }, [
        el('div', { className: 'pl-name', text: p.name || 'Untitled' }),
        el('div', { className: 'pl-meta', text: countLine(p.titles) })
      ]),
      icon('chevron', 18, 'chev')
    ])]);
  }

  /** Tonight's pick: a playlist row that is the title itself, so a tap opens Netflix as a card does. */
  function drawPickRow(pick) {
    var t = pick.title;
    var name = titleName(t);
    var until = untilText(pick.expiry);
    var href = titleLink(t.id);
    var body = [
      drawCover({ id: t.id, name: name, titles: [t] }),
      el('div', { className: 'pl-text' }, [
        el('div', { className: 'pl-kicker', text: 'Tonight’s pick' }),
        el('div', { className: 'pl-name', text: name }),
        el('div', { className: 'pl-until' }, [icon('clock', 13), until])
      ]),
      href != null ? icon('out', 18, 'chev') : null
    ];
    if (href == null) return el('li', null, [el('div', { className: 'pl' }, body)]);
    var link = titleLinkProps(href);
    link.className = 'pl';
    link['aria-label'] = 'Tonight’s pick: ' + name + '. Opens in the Netflix app. ' + until + '.';
    return el('li', null, [el('a', link, body)]);
  }

  function drawList(p) {
    var arts = coverArts(p.titles);
    if (arts.length > 0) app.appendChild(el('div', { className: 'hero-bg', 'aria-hidden': 'true' }, [artImg(arts[0], true)]));
    app.appendChild(drawBar(true, p.name || 'Untitled'));
    var content = el('main', { className: 'content' });
    app.appendChild(content);
    content.appendChild(el('h1', { className: 'title', text: p.name || 'Untitled' }));
    content.appendChild(el('p', { className: 'sub', text: countLine(p.titles) }));
    if (state.banner != null) content.appendChild(callout('alert', [state.banner], 'status'));
    if (p.titles.length === 0) {
      content.appendChild(emptyState('Nothing in it yet', 'Add titles to it in the extension; they appear here after the next sync.'));
    } else {
      content.appendChild(el('ul', { className: 'grid' }, p.titles.map(drawCard)));
    }
    content.appendChild(drawFoot());
  }

  function drawCard(t) {
    var name = titleName(t);
    var art = isNetflixArt(t.art)
      ? el('img', { className: 'art', src: t.art, alt: '', loading: 'lazy', decoding: 'async', referrerpolicy: 'no-referrer' })
      : el('span', { className: 'art art-none', text: name });
    if (art.tagName === 'IMG') {
      art.addEventListener('error', function () { art.replaceWith(el('span', { className: 'art art-none', text: name })); });
    }
    var body = [art, el('div', { className: 'card-title', text: name })];
    var meta = titleMeta(t);
    if (meta !== '') body.push(el('div', { className: 'card-meta', text: meta }));
    var href = titleLink(t.id);
    if (href == null) return el('li', { className: 'card' }, [el('div', null, body)]);
    return el('li', { className: 'card' }, [el('a', titleLinkProps(href), body)]);
  }

  function titleLinkProps(href) {
    var link = { href: href };
    // From an iPhone Home Screen app a plain link opens inside the app, where
    // the Netflix app cannot take it; a new window hands it to the system.
    if (isStandalone() && platform() === 'ios') { link.target = '_blank'; link.rel = 'noopener'; }
    return link;
  }

  function drawSkeleton() {
    function bar(width, height) { return el('span', { className: 'sk', style: 'width:' + width + ';height:' + height + 'px' }); }
    var rows = [0, 1, 2, 3].map(function (i) {
      return el('div', { className: 'sk-row' }, [
        el('span', { className: 'sk sk-cover' }),
        el('span', { className: 'sk-lines' }, [bar(['70%', '55%', '80%', '45%'][i], 14), bar('35%', 12)])
      ]);
    });
    return el('div', { 'aria-busy': 'true', 'aria-label': 'Loading your playlists' }, [
      el('div', { className: 'sk-chips' }, [el('span', { className: 'sk sk-chip' }), el('span', { className: 'sk sk-chip' })])
    ].concat(rows));
  }

  /** The Home Screen card under the playlists, for a browser tab on a phone, until Not now. */
  function drawInstall() {
    if (isStandalone() || installDismissed()) return null;
    var kind = platform();
    var text;
    var action = null;
    if (kind === 'ios') {
      text = ['Tap ', icon('share', 16), ' Share, then Add to Home Screen. It opens full screen, even offline. There it asks for a code once: make a new one in the extension and tap Scan code.'];
    } else if (state.installPrompt != null) {
      text = ['Opens full screen, even offline.'];
      action = el('button', { type: 'button', className: 'pill-btn', text: 'Install', onclick: install });
    } else if (kind === 'android') {
      text = ['Open the browser menu, then Install app or Add to Home screen. It opens full screen, even offline.'];
    } else {
      return null;
    }
    return el('div', { className: 'install' }, [
      el('img', { src: LOGO, alt: '' }),
      el('div', { className: 'install-text' }, [el('strong', { text: 'Add it to your Home Screen' })].concat(text, [
        el('button', { type: 'button', className: 'link-btn install-dismiss', text: 'Not now', onclick: dismissInstall })
      ])),
      action
    ]);
  }

  function dismissInstall() {
    save(INSTALL_DISMISSED_KEY, true);
    draw();
  }

  async function install() {
    var prompt = state.installPrompt;
    if (prompt == null) return;
    state.installPrompt = null;
    prompt.prompt();
    try { await prompt.userChoice; } catch (e) { /* dismissed */ }
    draw();
  }

  function drawFoot() {
    return el('footer', { className: 'foot' }, [
      el('p', { text: 'Tapping a title opens it in the Netflix app, in whichever profile the app is using.' }),
      el('p', null, [
        el('button', { type: 'button', className: 'link-btn', onclick: forgetPhone, text: 'Forget this phone' }),
        ' · Removes your playlists from this phone, and this phone from the extension’s list.'
      ])
    ]);
  }

  async function forgetPhone() {
    if (state.phone == null) return;
    if (!root.confirm('Forget your playlists on this phone? To see them here again you will need a new code from the extension.')) return;
    var pass = state.phone.pass;
    state.phone = null;
    state.banner = null;
    persist();
    root.history.replaceState(null, '', root.location.pathname);
    draw();
    await forgetPass(pass);
  }

  /** An iPhone browser tab with nothing paired: add to the Home Screen first, or Skip. */
  function drawInstallFirst() {
    var content = el('main', { className: 'content pair-view' });
    app.appendChild(content);
    var where = browserName(root.navigator.userAgent) || 'this browser';
    var held = state.pendingCode != null;
    content.appendChild(el('img', { className: 'app-icon', src: LOGO, alt: '' }));
    content.appendChild(el('h1', { className: 'title', text: 'Add it to your Home Screen first' }));
    content.appendChild(el('p', { className: 'lead', text: 'Your Netflix playlists then open full screen, even offline, and you pair once, from there.' }));
    content.appendChild(el('ol', { className: 'steps', role: 'list' }, [
      // One span each: a step is a flex row, and the icon must sit inside the sentence, not beside it.
      el('li', null, [el('span', null, ['Tap ', icon('share', 18, 'step-icon'), ' Share in ' + where + '’s toolbar.'])]),
      el('li', null, [el('span', null, ['Tap ', icon('plusSquare', 18, 'step-icon'), ' Add to Home Screen, then Add.'])]),
      el('li', { text: held
        ? 'Open Playlists from your Home Screen and tap Scan code. The code on your computer still works.'
        : 'Open Playlists from your Home Screen, and pair it there.' })
    ]));
    content.appendChild(el('button', {
      type: 'button', className: 'btn btn-ghost', text: 'Skip — use it in ' + where, onclick: skipInstall
    }));
    if (state.pairError != null) content.appendChild(el('p', { className: 'error', role: 'alert', text: state.pairError }));
    content.appendChild(el('p', { className: 'pair-foot', text: 'Safari and the Home Screen app keep separate storage, so each would need its own pairing.' }));
  }

  function skipInstall() {
    save(INSTALL_DISMISSED_KEY, true);
    var code = state.pendingCode;
    state.pendingCode = null;
    if (code != null) return claim(code);
    draw();
  }

  function drawPair() {
    var scanning = canScan();
    var input = el('input', {
      type: 'text', className: 'code-input', inputmode: 'text', autocomplete: 'one-time-code', autocapitalize: 'characters',
      spellcheck: 'false', maxlength: '9', placeholder: 'K7M 2QX', 'aria-label': 'Pairing code'
    });
    input.value = state.typed;
    input.addEventListener('input', function () { state.typed = input.value; });
    var button = el('button', { type: 'submit', className: 'btn' + (scanning ? ' btn-secondary' : ''), text: state.busy ? 'Pairing…' : 'Pair this phone' });
    if (state.busy) { input.disabled = true; button.disabled = true; }

    var content = el('main', { className: 'content pair-view' });
    app.appendChild(content);
    content.appendChild(el('img', { className: 'app-icon', src: LOGO, alt: '' }));
    content.appendChild(el('h1', { className: 'title', text: 'Your Netflix playlists, on this phone' }));
    content.appendChild(el('p', { className: 'lead', text: 'Read-only, for TidyWL for Netflix Pro. Playlists are made and edited in the extension, on your computer.' }));
    content.appendChild(el('ol', { className: 'steps', role: 'list' }, [
      el('li', { text: 'On your computer, open the TidyWL dashboard on Netflix.' }),
      el('li', { text: 'Open About, then Pro, then Pair a phone.' }),
      el('li', { text: scanning ? 'Tap Scan code and point this phone at the QR code, or type the code below.' : 'Type the six-character code below.' })
    ]));
    if (scanning) {
      var scanButton = el('button', { type: 'button', className: 'btn btn-scan', onclick: startScan }, [icon('scan', 22), 'Scan code']);
      if (state.busy) scanButton.disabled = true;
      content.appendChild(scanButton);
      content.appendChild(el('p', { className: 'or', text: 'or type it' }));
    }
    content.appendChild(el('form', {
      className: 'code-form',
      onsubmit: function (e) {
        e.preventDefault();
        var code = normalizeCode(input.value);
        if (code == null) {
          state.pairError = claimErrorText('malformed_code');
          draw();
          return;
        }
        claim(code);
      }
    }, [input, button]));
    if (state.pairError != null) content.appendChild(el('p', { className: 'error', role: 'alert', text: state.pairError }));
    content.appendChild(el('p', { className: 'pair-foot', text: 'A code lasts ten minutes and works once.' }));
  }

  // --- scanning --------------------------------------------------------------------

  var jsqrLoading = null;

  function loadJsqr() {
    if (typeof root.jsQR === 'function') return Promise.resolve(root.jsQR);
    if (jsqrLoading != null) return jsqrLoading;
    jsqrLoading = new Promise(function (resolve, reject) {
      var s = root.document.createElement('script');
      s.src = JSQR;
      s.onload = function () { typeof root.jsQR === 'function' ? resolve(root.jsQR) : reject(new Error('jsqr')); };
      s.onerror = function () { jsqrLoading = null; reject(new Error('jsqr')); };
      root.document.head.appendChild(s);
    });
    return jsqrLoading;
  }

  function scanErrorText(error) {
    var name = error != null ? error.name : '';
    if (name === 'NotAllowedError' || name === 'SecurityError') return 'The camera was not allowed. Allow it for this page and try again, or type the code instead.';
    if (name === 'NotFoundError' || name === 'OverconstrainedError') return 'No camera was found. Type the code instead.';
    if (error != null && error.message === 'jsqr') return 'The scanner could not load. Check your connection, or type the code instead.';
    return 'The camera could not start. Type the code instead.';
  }

  async function startScan() {
    if (state.scan != null) return;
    state.pairError = null;
    var video = el('video', { className: 'scan-video', playsinline: '', muted: '', autoplay: '' });
    video.muted = true;
    var hint = el('p', { className: 'scan-hint', text: 'Point at the QR code on your computer' });
    var overlay = el('div', { className: 'scan', role: 'dialog', 'aria-label': 'Scan the pairing code' }, [
      video,
      el('div', { className: 'scan-frame', 'aria-hidden': 'true' }),
      hint,
      el('button', { type: 'button', className: 'scan-cancel', text: 'Cancel', onclick: function () { stopScan(); draw(); } })
    ]);
    var scan = { overlay: overlay, video: video, hint: hint, stream: null, timer: null, canvas: root.document.createElement('canvas') };
    state.scan = scan;
    root.document.body.appendChild(overlay);
    root.document.body.classList.add('is-scanning');

    try {
      var decode = loadJsqr();
      var stream = await root.navigator.mediaDevices.getUserMedia({
        audio: false, video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      if (state.scan !== scan) { stream.getTracks().forEach(function (t) { t.stop(); }); return; }
      scan.stream = stream;
      video.srcObject = stream;
      await video.play();
      var jsQR = await decode;
      if (state.scan !== scan) return;
      tick(scan, jsQR);
    } catch (error) {
      if (state.scan !== scan) return;
      stopScan();
      state.pairError = scanErrorText(error);
      draw();
    }
  }

  function tick(scan, jsQR) {
    if (state.scan !== scan) return;
    var v = scan.video;
    if (v.videoWidth > 0 && v.videoHeight > 0) {
      var ratio = Math.min(1, SCAN_MAX_SIDE / Math.max(v.videoWidth, v.videoHeight));
      var w = Math.round(v.videoWidth * ratio);
      var h = Math.round(v.videoHeight * ratio);
      scan.canvas.width = w;
      scan.canvas.height = h;
      var ctx = scan.canvas.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(v, 0, 0, w, h);
      var found = jsQR(ctx.getImageData(0, 0, w, h).data, w, h, { inversionAttempts: 'dontInvert' });
      if (found != null) {
        var code = codeFromScan(found.data);
        if (code != null) {
          stopScan();
          return claim(code);
        }
        scan.hint.textContent = 'That QR code is not a TidyWL pairing code.';
      }
    }
    scan.timer = root.setTimeout(function () { tick(scan, jsQR); }, SCAN_EVERY_MS);
  }

  function stopScan() {
    var scan = state.scan;
    if (scan == null) return;
    state.scan = null;
    root.clearTimeout(scan.timer);
    if (scan.stream != null) scan.stream.getTracks().forEach(function (t) { t.stop(); });
    scan.video.srcObject = null;
    scan.overlay.remove();
    root.document.body.classList.remove('is-scanning');
  }

  // --- flow ----------------------------------------------------------------------

  async function claim(code) {
    state.busy = true;
    state.pairError = null;
    draw();
    var result = await request('pair/claim', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ code: code, name: phoneName(root.navigator.userAgent, isStandalone()) })
    });
    state.busy = false;
    if (result.status === 200 && result.body != null && typeof result.body.pass === 'string') {
      var previous = state.phone != null ? state.phone.pass : null;
      state.phone = readPhone({ pass: result.body.pass, active: null, profiles: [], fetchedAt: null });
      persist();
      state.typed = '';
      state.banner = null;
      state.pendingCode = null;
      draw();
      // Paired again over an old pass: take the old one off the extension's list.
      if (previous != null && previous !== result.body.pass) forgetPass(previous);
      return refresh();
    }
    state.pairError = claimErrorText(errorOf(result));
    draw();
  }

  function setRefreshing(on) {
    state.refreshing = on;
    var button = app.querySelector('.bar .icon-btn');
    if (button == null) return;
    button.classList.toggle('is-busy', on);
    button.disabled = on;
  }

  async function refresh(byHand) {
    if (state.phone == null) return draw();
    if (state.refreshing) return;
    var pass = state.phone.pass;
    var started = Date.now();
    setRefreshing(true);
    var result = await request('phone', { headers: { authorization: 'Bearer ' + pass } });
    // A tap that answers in 50ms looks like a tap that did nothing.
    if (byHand === true) await new Promise(function (r) { root.setTimeout(r, Math.max(0, 600 - (Date.now() - started))); });
    state.refreshing = false;
    // Forgotten, or paired again, while the request was out: this answer belongs to no one.
    if (state.phone == null || state.phone.pass !== pass) return draw();

    var profiles = result.status === 200 ? profilesFrom(result.body) : null;
    if (profiles != null) {
      state.phone.profiles = profiles;
      state.phone.active = pickActive(profiles, state.phone.active);
      state.phone.fetchedAt = Date.now();
      state.banner = null;
      persist();
      return draw();
    }

    var error = errorOf(result);
    if (result.status === 401) {
      state.phone = null;
      persist();
      state.banner = null;
      state.pairError = 'This phone was removed in the extension, or its pairing ended. Pair it again to see your playlists.';
      root.history.replaceState(null, '', root.location.pathname);
      return draw();
    }
    if (error === 'not_entitled') {
      state.phone.profiles = [];
      state.phone.active = null;
      state.phone.fetchedAt = Date.now();
      persist();
      state.banner = 'The Pro subscription has ended, so playlists are no longer shown here. They are all still in the extension.';
      return draw();
    }
    var when = relativeTime(state.phone.fetchedAt, Date.now());
    state.banner = state.phone.profiles.length > 0
      ? 'Could not refresh — showing the copy from ' + (when != null ? when : 'earlier') + '.'
      : 'Could not reach tidywl.com. Check your connection and reload.';
    draw();
  }

  /** This phone's pairing; one kept in an earlier shape is moved over, once, and only if that stuck. */
  function loadPhone() {
    var stored = readPhone(load(PHONE_KEY));
    if (stored != null) return stored;
    var moved = migrateStored(load(PROFILES_KEY), load(LEGACY_PASS_KEY), load(LEGACY_COPY_KEY));
    if (moved == null) return null;
    if (save(PHONE_KEY, moved.phone)) {
      forget(PROFILES_KEY);
      forget(LEGACY_PASS_KEY);
      forget(LEGACY_COPY_KEY);
      moved.forget.forEach(forgetPass);
    }
    return moved.phone;
  }

  function start() {
    app = root.document.getElementById('app');
    var code = pairCodeFromHash(root.location.hash);
    if (code != null || /^#pair=/.test(root.location.hash)) {
      // The code is spent the moment it is used; keep it out of history and bookmarks.
      root.history.replaceState(null, '', root.location.pathname);
    }
    state.phone = loadPhone();
    root.addEventListener('hashchange', draw);
    root.addEventListener('scroll', syncBar, { passive: true });
    root.document.addEventListener('visibilitychange', function () {
      if (root.document.visibilityState !== 'visible') {
        // A camera left running behind the Home Screen is the one thing worse than none.
        if (state.scan != null) { stopScan(); draw(); }
        return;
      }
      if (state.phone != null && isStale(state.phone.fetchedAt, Date.now())) refresh();
    });
    // Android's install offer, shown as our own button rather than the browser's bar.
    root.addEventListener('beforeinstallprompt', function (e) {
      e.preventDefault();
      state.installPrompt = e;
      draw();
    });
    root.addEventListener('appinstalled', function () {
      state.installPrompt = null;
      draw();
    });
    if ('serviceWorker' in root.navigator) {
      root.addEventListener('load', function () {
        root.navigator.serviceWorker.register('sw.js').catch(function () { /* the page works without it */ });
      });
    }
    if (code != null) {
      // An unpaired iPhone tab holds the code, unspent, so the Home Screen app can scan the same one.
      if (state.phone == null && wantsInstallFirst()) {
        state.pendingCode = code;
        return draw();
      }
      return claim(code);
    }
    draw();
    refresh();
  }

  root.TidyPhone = {
    normalizeCode: normalizeCode, pairCodeFromHash: pairCodeFromHash, codeFromScan: codeFromScan, listIdFromHash: listIdFromHash,
    browserName: browserName, phoneName: phoneName, platformOf: platformOf, isNetflixArt: isNetflixArt, coverArts: coverArts,
    countLine: countLine, isStale: isStale, titleLink: titleLink, relativeTime: relativeTime,
    profileColor: profileColor, coverBackground: coverBackground, titleMeta: titleMeta, claimErrorText: claimErrorText,
    profilesFrom: profilesFrom, pickActive: pickActive, readPhone: readPhone, migrateStored: migrateStored,
    titleName: titleName, tonightExpiry: tonightExpiry, listedPlaylists: listedPlaylists, tonightPick: tonightPick,
    pickToFollow: pickToFollow, untilText: untilText
  };

  if (root.document != null && root.document.getElementById('app') != null) start();
})(typeof window !== 'undefined' ? window : globalThis);
