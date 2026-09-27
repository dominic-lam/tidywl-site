# jsQR 1.4.0, unmodified

`jsQR.js` is `dist/jsQR.js` from the npm package `jsqr@1.4.0` (https://github.com/cozmo/jsQR), Apache-2.0,
copied byte for byte from the published tarball. The tarball's hash matched npm's integrity field on 2026-09-26:

    sha512-dxLob7q65Xg2DvstYkRpkYtmKm2sPJ9oFhrhmudT1dZvNFFTlroai3AWSpLey/w5vMcLBXRgOJsbXpdN9HzU/A==

Why it is here: the phone page's *Scan code* reads the extension's QR code from the camera, and Safari has no
built-in QR reader for web pages. It is served from tidywl.com rather than a CDN so that opening the camera
tells no third party anything, and loaded only when *Scan code* is pressed. Every frame is read on the phone;
nothing from the camera leaves it.
