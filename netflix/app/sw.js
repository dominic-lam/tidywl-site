/*
 * TidyWL for Netflix — the phone page's service worker, so the Home Screen app
 * opens without a connection. Scope: /netflix/app/.
 *
 * It keeps this page's own files and nothing else. The playlists are never
 * cached here: /api/ is outside the scope it answers for, and box art from
 * Netflix's servers is left to the browser. The last copy of the playlists
 * lives in localStorage, where app.js has always kept it.
 *
 * Network first, cache as the fallback: a deploy reaches the phone on the next
 * open with a connection, and an old copy is only ever shown offline. Bump
 * VERSION when SHELL changes.
 */
'use strict';

var VERSION = 'v1';
var CACHE = 'tidywl-nf-phone-' + VERSION;
var SHELL = ['./', 'app.js', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/apple-touch-icon.png'];

self.addEventListener('install', function (event) {
  event.waitUntil(caches.open(CACHE).then(function (cache) { return cache.addAll(SHELL); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (event) {
  event.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k.indexOf('tidywl-nf-phone-') === 0 && k !== CACHE; })
      .map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener('fetch', function (event) {
  var request = event.request;
  if (request.method !== 'GET') return;
  var url = new URL(request.url);
  var scope = new URL(self.registration.scope);
  if (url.origin !== scope.origin || url.pathname.indexOf(scope.pathname) !== 0) return;

  event.respondWith(fetch(request).then(function (response) {
    if (response.ok && response.type === 'basic') {
      var copy = response.clone();
      event.waitUntil(caches.open(CACHE).then(function (cache) { return cache.put(request, copy); }));
    }
    return response;
  }).catch(function () {
    return caches.match(request, { ignoreSearch: true }).then(function (hit) {
      if (hit != null) return hit;
      if (request.mode === 'navigate') return caches.match('./');
      return Response.error();
    });
  }));
});
