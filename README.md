# tranquil-rpc

Object-capability RPC between the Tranquil host renderer and browser `<webview>` guests, built on
[Cap'n Web](https://github.com/cloudflare/capnweb). Guests call host capabilities and pass
callbacks that the host invokes as stubs — no hand-rolled IPC channels or id correlation.

**Status:** Phase 0 spike (proving Cap'n Web over the webview transport). See `docs/STATUS.md`.

## Build

```sh
source ~/.nvm/nvm.sh && nvm use
npm install
npm run build     # → dist/host.cjs (host, CJS) + dist/tranquil-rpc-guest.js (guest, IIFE)
```

`dist/` is committed (production has no build step). Rebuild after editing `lib/`.

## Layout

- `lib/host.js` — host entry (dev-package main); opens a session per browser webview, injects the guest.
- `lib/guest.js` — guest entry; bundled to an IIFE and injected into trusted pages' main world.
- `lib/transport-host.js` / `lib/transport-guest.js` — Cap'n Web `RpcTransport` over the
  `webview.send` / `ipcRenderer.sendToHost` channel `"tranquil:rpc"`.
- `docs/SECURITY.md` — living security considerations (seeded in Phase 3).
