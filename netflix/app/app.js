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
 * then refreshed from /api/netflix/phone — on open, from the Refresh button,
 * and when the page comes back to the front after a minute away, since a Home
 * Screen app has no reload of its own. A pass the server no longer knows
 * (removed in the extension) or a subscription that ended clears the copy:
 * what a lapsed licence returns is nothing.
 *
 * INSTALLING: sw.js keeps this page's own files, never the playlists. On an
 * iPhone a Home Screen app has storage of its own, apart from Safari's, so it
 * may ask to be paired again; the pairing screen says to add it first.
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
  var STALE_MS = 60 * 1000;
  var LOGO = 'icons/icon-192.png';

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
  var state = {
    copy: null, fetchedAt: null, banner: null, pairError: null, busy: false, refreshing: false, typed: '',
    installPrompt: null, view: null, listsScroll: 0, navigatedIn: false
  };

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
    info: ['M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18z', 'M12 16v-4', 'M12 8h.01'],
    alert: ['M10.3 4L2.4 18a2 2 0 0 0 1.7 3h15.8a2 2 0 0 0 1.7-3L13.7 4a2 2 0 0 0-3.4 0z', 'M12 9v4', 'M12 17h.01']
  };

  function icon(name, size, className) {
    var ns = 'http://www.w3.org/2000/svg';
    var svg = root.document.createElementNS(ns, 'svg');
    var attrs = { viewBox: '0 0 24 24', width: size, height: size, fill: 'none', stroke: 'currentColor',
      'stroke-width': name === 'back' || name === 'chevron' ? 2.4 : 2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'aria-hidden': 'true' };
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

  function draw() {
    var paired = load(PASS_KEY) != null;
    var listId = listIdFromHash(root.location.hash);
    var copy = state.copy;
    var open = paired && listId != null && copy != null && copy.profile != null
      ? copy.playlists.filter(function (p) { return p.id === listId; })[0]
      : null;
    var view = !paired ? 'pair' : open != null ? 'list:' + open.id : 'lists';
    var entering = view !== state.view;
    if (entering && state.view === 'lists') state.listsScroll = root.scrollY;

    app.textContent = '';
    if (!paired) drawPair();
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

    if (copy == null) {
      content.appendChild(state.banner != null ? callout('alert', [state.banner], 'status') : drawSkeleton());
      content.appendChild(drawFoot());
      return;
    }
    if (copy.profile == null) {
      content.appendChild(emptyState('Nothing has synced yet', 'Turn on sync in the extension (About → Pro), then open this page again.'));
      content.appendChild(drawFoot());
      return;
    }

    content.appendChild(drawProfile(copy.profile));
    if (state.banner != null) content.appendChild(callout('alert', [state.banner], 'status'));
    if (copy.playlists.length === 0) {
      content.appendChild(emptyState('No playlists yet', 'Make one in the extension and it appears here after the next sync.'));
    } else {
      content.appendChild(el('ul', { className: 'pls' }, copy.playlists.map(drawPlaylistRow)));
    }
    var install = drawInstall();
    if (install != null) content.appendChild(install);
    content.appendChild(drawFoot());
  }

  function drawProfile(profile) {
    var name = profile.name || 'Profile';
    var synced = relativeTime(Date.parse(profile.storedAt), Date.now());
    var detail = [synced != null ? 'Synced ' + synced : null, profile.storedBy ? 'from ' + profile.storedBy : null].filter(Boolean).join(' ');
    return el('div', { className: 'profile' }, [
      el('span', { className: 'avatar', style: 'background:' + profileColor(profile.guid), 'aria-hidden': 'true', text: firstChar(name) }),
      el('div', null, [
        el('div', { className: 'profile-name', text: name + '’s playlists' }),
        detail !== '' ? el('div', { className: 'profile-meta', text: detail }) : null
      ])
    ]);
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
    if (href == null) return el('li', { className: 'card' }, [el('div', null, body)]);
    var link = { href: href };
    // From an iPhone Home Screen app a plain link opens inside the app, where
    // the Netflix app cannot take it; a new window hands it to the system.
    if (isStandalone() && platform() === 'ios') { link.target = '_blank'; link.rel = 'noopener'; }
    return el('li', { className: 'card' }, [el('a', link, body)]);
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
      el('div', { className: 'profile' }, [el('span', { className: 'sk avatar' }), el('span', { className: 'sk-lines' }, [bar('50%', 14), bar('70%', 12)])])
    ].concat(rows));
  }

  function drawInstall() {
    if (isStandalone()) return null;
    var kind = platform();
    var text;
    var action = null;
    if (kind === 'ios') {
      text = ['Tap ', icon('share', 16), ' Share, then Add to Home Screen. It opens full screen, even offline. If it asks for a code there, make a new one in the extension.'];
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
      el('div', { className: 'install-text' }, [el('strong', { text: 'Add it to your Home Screen' })].concat(text)),
      action
    ]);
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
        el('button', { type: 'button', className: 'link-btn', onclick: forgetPhone, text: 'Forget on this phone' }),
        ' · To stop it reading for good, remove it in the extension (About → Pro → Phones).'
      ])
    ]);
  }

  function forgetPhone() {
    if (!root.confirm('Forget your playlists on this phone? To see them here again you will need a new code from the extension.')) return;
    forget(PASS_KEY);
    forget(COPY_KEY);
    state.copy = null;
    state.fetchedAt = null;
    state.banner = null;
    draw();
  }

  function drawPair() {
    var standalone = isStandalone();
    var ios = platform() === 'ios';
    var input = el('input', {
      type: 'text', className: 'code-input', inputmode: 'text', autocomplete: 'one-time-code', autocapitalize: 'characters',
      spellcheck: 'false', maxlength: '9', placeholder: 'K7M 2QX', 'aria-label': 'Pairing code'
    });
    input.value = state.typed;
    input.addEventListener('input', function () { state.typed = input.value; });
    var button = el('button', { type: 'submit', className: 'btn', text: state.busy ? 'Pairing…' : 'Pair this phone' });
    if (state.busy) { input.disabled = true; button.disabled = true; }

    var content = el('main', { className: 'content pair-view' });
    app.appendChild(content);
    content.appendChild(el('img', { className: 'app-icon', src: LOGO, alt: '' }));
    content.appendChild(el('h1', { className: 'title', text: 'Your Netflix playlists, on this phone' }));
    content.appendChild(el('p', { className: 'lead', text: 'Read-only, for TidyWL for Netflix Pro. Playlists are made and edited in the extension, on your computer.' }));
    if (ios && !standalone) {
      content.appendChild(callout('info', [
        el('strong', { text: 'Keeping it on your Home Screen? ' }),
        'Add it there first (tap Share, then Add to Home Screen) and pair from the Home Screen app.'
      ]));
    }
    content.appendChild(el('ol', { className: 'steps', role: 'list' }, [
      el('li', { text: 'On your computer, open the TidyWL dashboard on Netflix.' }),
      el('li', { text: 'Open About, then Pro, then Pair a phone.' }),
      el('li', { text: standalone ? 'Type the six-character code below.' : 'Scan the QR code with this phone’s camera, or type the code below.' })
    ]));
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
      state.typed = '';
      state.copy = null;
      state.banner = null;
      draw();
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
    var pass = load(PASS_KEY);
    if (typeof pass !== 'string') return draw();
    if (state.refreshing) return;
    var started = Date.now();
    setRefreshing(true);
    var result = await request('phone', { headers: { authorization: 'Bearer ' + pass } });
    // A tap that answers in 50ms looks like a tap that did nothing.
    if (byHand === true) await new Promise(function (r) { root.setTimeout(r, Math.max(0, 600 - (Date.now() - started))); });
    state.refreshing = false;

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
    root.addEventListener('scroll', syncBar, { passive: true });
    root.document.addEventListener('visibilitychange', function () {
      if (root.document.visibilityState === 'visible' && isStale(state.fetchedAt, Date.now())) refresh();
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
    if (code != null) return claim(code);
    draw();
    refresh();
  }

  root.TidyPhone = {
    normalizeCode: normalizeCode, pairCodeFromHash: pairCodeFromHash, listIdFromHash: listIdFromHash,
    phoneName: phoneName, platformOf: platformOf, isNetflixArt: isNetflixArt, coverArts: coverArts,
    countLine: countLine, isStale: isStale, titleLink: titleLink, relativeTime: relativeTime,
    profileColor: profileColor, coverBackground: coverBackground, titleMeta: titleMeta, claimErrorText: claimErrorText
  };

  if (root.document != null && root.document.getElementById('app') != null) start();
})(typeof window !== 'undefined' ? window : globalThis);
