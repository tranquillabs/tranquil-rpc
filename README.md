# tranquil-rpc

Object-capability RPC between the Tranquil host renderer and browser `<webview>` guests, built on
[Cap'n Web](https://github.com/cloudflare/capnweb). Guests call host capabilities and pass
callbacks that the host invokes as stubs — no hand-rolled IPC channels or id correlation.

**Status:** feature-complete (pending a final manual gate) — transport + trust + sessions, the
capability + types registries, and pane controls as the first consumer. Shipped capabilities:
`ping`, `notify`, `paneControls.register`. Phase history / handoff, full architecture, and the
decision record live in the `www-tranquil` dev docs: `docs/development/tranquil-rpc-status`,
`docs/development/guest-host-rpc`, and `docs/drafts/adr/0009-capnweb-rpc`.

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
  `ctx` is `{ item, webview, url, subscriptions }`, per session — `subscriptions` is a
  `CompositeDisposable` disposed on reload/close for page-lifetime teardown.
- `addTrustedRoot(dir)` — trust `file://` pages under `dir` (a path or `file://` URL).
- `isTrusted(url)` — the classifier (default-deny).
- `RpcTarget` — re-exported from capnweb. Consumers subclassing it for a capability namespace **must**
  get it from here (not a separate `require("capnweb")`), so `instanceof RpcTarget` holds.

Types for the above (consumer API) and for the guest-facing `window.tranquilHost` capability catalog
live in `types/` (`tranquil-rpc.d.ts` + `host-api.d.ts`); `package.json` `"types"` points at them.

## Layout

- `lib/index.js` — package `main` (bundled to `dist/host.js`): lifecycle + `provideRpc` + direct API.
- `lib/host.js` — host lifecycle; per-webview session management, trust-gated guest injection.
- `lib/guest.js` — guest entry; bundled to an IIFE and injected into trusted pages' main world.
- `lib/trust.js` — `addTrustedRoot` / `isTrusted` (security-critical, default-deny).
- `lib/registry.js` — `registerCapability` / `buildHostApi` (per-session `HostApi`).
- `lib/transport-host.js` / `lib/transport-guest.js` — Cap'n Web `RpcTransport` over the
  `webview.send` / `ipcRenderer.sendToHost` channel `"tranquil:rpc"`.
- `types/host-api.d.ts` — guest-facing capability catalog (`window.tranquilHost`).
- `types/tranquil-rpc.d.ts` — consumer/module API (`require("tranquil-rpc")`).
- `docs/SECURITY.md` — living security tracker (threat model, mitigations, open issues).
