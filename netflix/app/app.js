/*
 * TidyWL for Netflix — the phone page. Read-only, one profile, no account.
 * Contract: tidywl-netflix/docs/claude/PLAN-mobile-sync.md § The phone.
 *
 * PAIRING: the extension shows a six-character code that lasts ten minutes and
 * works once. Typed here, or arriving as #pair=<code> from a link, it is
 * swapped at /api/netflix/pair/claim for this phone's own pass. The fragment
 * never reaches a server, and it is wiped from the address bar at once.
 *
 * OPENING: the last copy is drawn from this phone's storage straight away,
 * then refreshed from /api/netflix/phone. A pass the server no longer knows
 * (removed in the extension) or a subscription that ended clears the copy:
 * what a lapsed licence returns is nothing.
 *
 * Everything shown is built with textContent. Box art loads straight from
 * Netflix's image servers, never copied to ours (the user, 2026-09-23), and
 * only from the host the server already checked.
 */
(function (root) {
  'use strict';

  var API = '/api/netflix/';
  var PASS_KEY = 'tidywl_nf_phone_pass';
  var COPY_KEY = 'tidywl_nf_phone_copy';
  var CODE_ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

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

  /** "#list=<id>" → "<id>"; the open playlist lives in the address so Back works. */
  function listIdFromHash(hash) {
    var m = /^#list=([a-z0-9]{8,40})$/.exec(typeof hash === 'string' ? hash : '');
    return m != null ? m[1] : null;
  }

  /** What the extension's phone list calls this device. Nothing more specific is sent. */
  function phoneName(ua) {
    var s = typeof ua === 'string' ? ua : '';
    if (/iPhone/.test(s)) return 'iPhone';
    if (/iPad/.test(s)) return 'iPad';
    if (/Android/.test(s)) return /Mobile/.test(s) ? 'Android phone' : 'Android tablet';
    return 'Phone';
  }

  function isNetflixArt(value) {
    if (typeof value !== 'string' || value.length > 1000) return false;
    var url;
    try { url = new URL(value); } catch (e) { return false; }
    return url.protocol === 'https:' && (url.hostname === 'nflxso.net' || /\.nflxso\.net$/.test(url.hostname));
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

  /** A colour from the profile's guid, never Netflix's avatar (PLAN-mobile-sync § The phone). */
  function profileColor(guid) {
    var h = 0;
    var s = typeof guid === 'string' ? guid : '';
    for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    return 'hsl(' + (h % 360) + ', 55%, 40%)';
  }

  function titleMeta(t) {
    var parts = [];
    if (t.type === 'show') parts.push('Series');
    else if (t.type === 'movie') parts.push('Film');
    if (Number.isInteger(t.year)) parts.push(String(t.year));
    return parts.join(' · ');
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
    try { root.localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* private mode: the page still works */ }
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

  // --- drawing -------------------------------------------------------------------

  var app = null;
  var state = { copy: null, fetchedAt: null, banner: null, pairError: null, busy: false };

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

  function draw() {
    app.textContent = '';
    if (load(PASS_KEY) == null) return drawPair();
    if (state.copy == null) {
      app.appendChild(el('h1', { text: 'Playlists' }));
      if (state.banner != null) app.appendChild(el('p', { className: 'banner', text: state.banner }));
      else app.appendChild(el('p', { className: 'note', text: 'Loading…' }));
      return drawFooter();
    }
    var copy = state.copy;
    if (copy.profile == null) {
      app.appendChild(el('h1', { text: 'Playlists' }));
      app.appendChild(el('p', { text: 'Nothing has synced yet. Turn on sync in the extension (About → Pro), then open this page again.' }));
      return drawFooter();
    }

    var listId = listIdFromHash(root.location.hash);
    var open = listId != null ? copy.playlists.filter(function (p) { return p.id === listId; })[0] : null;
    if (open != null) drawList(open);
    else drawLists(copy);
    drawFooter();
  }

  function drawChip(profile) {
    var name = profile.name || 'Profile';
    var synced = relativeTime(Date.parse(profile.storedAt), Date.now());
    var detail = [synced != null ? 'synced ' + synced : null, profile.storedBy ? 'from ' + profile.storedBy : null].filter(Boolean).join(' ');
    return el('p', { className: 'chip' }, [
      el('span', { className: 'chip-mark', style: 'background:' + profileColor(profile.guid), 'aria-hidden': 'true', text: name.slice(0, 1).toUpperCase() }),
      el('span', null, [el('strong', { text: name + '’s playlists' }), detail !== '' ? ' · ' + detail : null])
    ]);
  }

  function drawLists(copy) {
    app.appendChild(el('h1', { text: 'Playlists' }));
    app.appendChild(drawChip(copy.profile));
    if (state.banner != null) app.appendChild(el('p', { className: 'banner', text: state.banner }));
    if (copy.playlists.length === 0) {
      app.appendChild(el('p', { text: 'No playlists on this profile yet. Make one in the extension and it appears here after the next sync.' }));
      return;
    }
    app.appendChild(el('ul', { className: 'lists' }, copy.playlists.map(function (p) {
      return el('li', null, [el('button', {
        type: 'button', className: 'list-btn',
        onclick: function () { root.location.hash = 'list=' + p.id; }
      }, [
        el('span', { className: 'list-name', text: p.name }),
        el('span', { className: 'count', text: p.titles.length + (p.titles.length === 1 ? ' title' : ' titles') })
      ])]);
    })));
  }

  function drawList(p) {
    app.appendChild(el('a', { className: 'back', href: '#', onclick: function (e) { e.preventDefault(); root.history.back(); }, text: '‹ All playlists' }));
    app.appendChild(el('h2', { text: p.name }));
    app.appendChild(el('p', { className: 'note', text: p.titles.length + (p.titles.length === 1 ? ' title' : ' titles') }));
    if (state.banner != null) app.appendChild(el('p', { className: 'banner', text: state.banner }));
    app.appendChild(el('ul', { className: 'grid' }, p.titles.map(function (t) {
      var name = typeof t.title === 'string' && t.title !== '' ? t.title : 'Title ' + t.id;
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
      return el('li', { className: 'card' }, [href != null ? el('a', { href: href }, body) : el('div', null, body)]);
    })));
  }

  function drawFooter() {
    var standalone = root.matchMedia != null && root.matchMedia('(display-mode: standalone)').matches || root.navigator.standalone === true;
    var ios = /iPhone|iPad/.test(root.navigator.userAgent);
    app.appendChild(el('footer', null, [
      el('p', { text: 'Tapping a title opens it in the Netflix app, in whichever profile the app is using.' }),
      !standalone && ios ? el('p', { text: 'Tip: tap Share, then Add to Home Screen. Safari may clear what this page keeps after a week unused; from the Home Screen it stays.' }) : null,
      el('p', null, [el('button', {
        type: 'button', className: 'link',
        onclick: function () {
          forget(PASS_KEY);
          forget(COPY_KEY);
          state.copy = null;
          state.banner = null;
          draw();
        },
        text: 'Forget on this phone'
      }), ' · To stop it reading for good, remove it in the extension (About → Pro → Phones).'])
    ]));
  }

  function drawPair() {
    var input = el('input', {
      type: 'text', inputmode: 'text', autocomplete: 'one-time-code', autocapitalize: 'characters', spellcheck: 'false',
      maxlength: '9', placeholder: 'K7M 2QX', 'aria-label': 'Pairing code'
    });
    var button = el('button', { type: 'submit', className: 'btn', text: state.busy ? 'Pairing…' : 'Pair' });
    if (state.busy) { input.disabled = true; button.disabled = true; }
    app.appendChild(el('h1', { text: 'Your Netflix playlists, on this phone' }));
    app.appendChild(el('p', { className: 'note', text: 'For TidyWL for Netflix Pro. Read-only: playlists are edited in the extension, on your computer.' }));
    app.appendChild(el('div', { className: 'pair' }, [
      el('ol', null, [
        el('li', { text: 'On your computer, open the TidyWL dashboard on Netflix.' }),
        el('li', { text: 'About → Pro → Pair a phone.' }),
        el('li', { text: 'Type the six-character code here.' })
      ]),
      el('form', {
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
      }, [input, button]),
      state.pairError != null ? el('p', { className: 'error', role: 'alert', text: state.pairError }) : null
    ]));
  }

  // --- flow ----------------------------------------------------------------------

  async function claim(code) {
    state.busy = true;
    state.pairError = null;
    draw();
    var result = await request('pair/claim', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ code: code, name: phoneName(root.navigator.userAgent) })
    });
    state.busy = false;
    if (result.status === 200 && result.body != null && typeof result.body.pass === 'string') {
      save(PASS_KEY, result.body.pass);
      forget(COPY_KEY);
      state.copy = null;
      state.banner = null;
      draw();
      return refresh();
    }
    state.pairError = claimErrorText(errorOf(result));
    draw();
  }

  async function refresh() {
    var pass = load(PASS_KEY);
    if (typeof pass !== 'string') return draw();
    var result = await request('phone', { headers: { authorization: 'Bearer ' + pass } });

    if (result.status === 200 && result.body != null && Array.isArray(result.body.playlists)) {
      state.copy = result.body;
      state.fetchedAt = Date.now();
      state.banner = null;
      save(COPY_KEY, { copy: result.body, fetchedAt: state.fetchedAt });
      return draw();
    }

    var error = errorOf(result);
    if (result.status === 401) {
      forget(PASS_KEY);
      forget(COPY_KEY);
      state.copy = null;
      state.banner = null;
      state.pairError = 'This phone was removed in the extension, or its pairing ended. Pair it again to see your playlists.';
      return draw();
    }
    if (error === 'not_entitled') {
      forget(COPY_KEY);
      state.copy = null;
      state.banner = 'The Pro subscription has ended, so playlists are no longer shown here. They are all still in the extension.';
      return draw();
    }
    var when = relativeTime(state.fetchedAt, Date.now());
    state.banner = state.copy != null
      ? 'Could not refresh — showing the copy from ' + (when != null ? when : 'earlier') + '.'
      : 'Could not reach tidywl.com. Check your connection and reload.';
    draw();
  }

  function start() {
    app = root.document.getElementById('app');
    var code = pairCodeFromHash(root.location.hash);
    if (code != null || /^#pair=/.test(root.location.hash)) {
      // The code is spent the moment it is used; keep it out of history and bookmarks.
      root.history.replaceState(null, '', root.location.pathname);
    }
    var cached = load(COPY_KEY);
    if (cached != null && cached.copy != null && Array.isArray(cached.copy.playlists)) {
      state.copy = cached.copy;
      state.fetchedAt = cached.fetchedAt;
    }
    root.addEventListener('hashchange', draw);
    if (code != null) return claim(code);
    draw();
    refresh();
  }

  root.TidyPhone = {
    normalizeCode: normalizeCode, pairCodeFromHash: pairCodeFromHash, listIdFromHash: listIdFromHash,
    phoneName: phoneName, isNetflixArt: isNetflixArt, titleLink: titleLink, relativeTime: relativeTime,
    profileColor: profileColor, titleMeta: titleMeta, claimErrorText: claimErrorText
  };

  if (root.document != null && root.document.getElementById('app') != null) start();
})(typeof window !== 'undefined' ? window : globalThis);
