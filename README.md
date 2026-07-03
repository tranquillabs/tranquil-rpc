# tranquil-rpc

Object-capability RPC between the Tranquil host renderer and browser `<webview>` guests, built on
[Cap'n Web](https://github.com/cloudflare/capnweb). Guests call host capabilities and pass
callbacks that the host invokes as stubs — no hand-rolled IPC channels or id correlation.

**Status:** Phase 1 — real package (transport + trust + sessions, trivial `ping` capability). See
`docs/STATUS.md`.

## Trust model

Only `file://` URLs under a registered trusted root are trusted. Trusted pages get the injected
guest runtime + the full `HostApi`; **all** `http(s)://` (and `file://` outside a root) get nothing
— no runtime, no session. Default-deny. Register roots with `addTrustedRoot(dir)`.

## Build

```sh
source ~/.nvm/nvm.sh && nvm use
npm install
npm run build     # → dist/host.js (host, CJS) + dist/tranquil-rpc-guest.js (guest, IIFE)
```

`dist/` is committed (production has no build step). Rebuild after editing `lib/`.

## API

Owned consumers `require("tranquil-rpc")` (or consume the `tranquil-rpc` service, which returns the
same functions):

- `registerCapability(name, factory(ctx))` — expose a capability. `factory` returns a function
  (called directly, `host.name(...)`) or an `RpcTarget` (a namespace, `host.name.method(...)`).
  `ctx` is `{ item, webview, url }`, per session.
- `addTrustedRoot(dir)` — trust `file://` pages under `dir` (a path or `file://` URL).
- `isTrusted(url)` — the classifier (default-deny).

## Layout

- `lib/index.js` — package `main` (bundled to `dist/host.js`): lifecycle + `provideRpc` + direct API.
- `lib/host.js` — host lifecycle; per-webview session management, trust-gated guest injection.
- `lib/guest.js` — guest entry; bundled to an IIFE and injected into trusted pages' main world.
- `lib/trust.js` — `addTrustedRoot` / `isTrusted` (security-critical, default-deny).
- `lib/registry.js` — `registerCapability` / `buildHostApi` (per-session `HostApi`).
- `lib/transport-host.js` / `lib/transport-guest.js` — Cap'n Web `RpcTransport` over the
  `webview.send` / `ipcRenderer.sendToHost` channel `"tranquil:rpc"`.
- `docs/SECURITY.md` — living security considerations (seeded in Phase 3).
