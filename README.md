# tranquil-rpc

Object-capability RPC between the Tranquil host renderer and browser `<webview>` guests, built on
[Cap'n Web](https://github.com/cloudflare/capnweb). Guests call host capabilities and pass
callbacks that the host invokes as stubs — no hand-rolled IPC channels or id correlation.

Shipped capabilities: `ping`, `notify`, `paneControls.register`. Full architecture and the
decision record live in the `www-tranquil` dev docs: `docs/development/notes/tranquil-rpc-status`,
`docs/development/notes/guest-host-rpc-notes`, and `docs/development/adr/0003-capnweb-rpc`.

## Trust model

Two independent gates:

- **Guest webviews** — only `file://` URLs under a registered trusted root are trusted. Trusted
  pages get the injected guest runtime + the full `HostApi`; **all** `http(s)://` (and `file://`
  outside a root) get nothing — no runtime, no session. Default-deny. Register roots with
  `addTrustedRoot(dir)`.
- **Deno automation subprocesses** (`lib/runner-host.js`, the runner bridge — ADR-0022) —
  single-use run tokens, delivered to the child via env only, gate which capabilities a run's
  session exposes; the grants a run was approved for travel with its token, so a child can't ask
  for more than it was launched with. Tokens are claimed (deleted) on first use and expire
  unclaimed after 60s (10min for a debug run). The first frame on a connection must be exactly
  `AUTH <token>` within 3s or the socket closes.

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
- `ensureRunnerServer()` — lazily start (or return) the per-window runner bridge WebSocket server.
  Resolves `{ port }`.
- `mintRunToken({ runId, scriptPath, scriptDir, grants, debug })` — mint a one-time token for a run
  about to spawn, delivered to the child via env only.
- `sendCancel(runId)` — send the protocol-level cancel frame on a run's authed socket.
- `endRun(runId)` — run ended (exit, kill, or timeout): close its socket and invalidate any unclaimed
  token.

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
- `lib/channel.js` — the single IPC channel name (`"tranquil:rpc"`) both directions share.
- `lib/queue.js` — the async message queue backing a transport's `receive()` (Cap'n Web calls it in
  a loop).
- `lib/transport-ws.js` — the WebSocket leg of the transport for the runner bridge; works over both
  a server-side `ws` socket (host renderer) and a standard `WebSocket` (the Deno child mirrors this
  in `deno/transport.ts`).
- `lib/runner-host.js` — **security-critical**, same review discipline as `trust.js`. The runner
  bridge: WebSocket server, token table, and per-run session lifecycle for a Deno automation
  subprocess authenticating with a one-time run token (ADR-0022).
- `types/host-api.d.ts` — guest-facing capability catalog (`window.tranquilHost`).
- `types/tranquil-rpc.d.ts` — consumer/module API (`require("tranquil-rpc")`).

The living security tracker (threat model, mitigations, open issues) lives in the `www-tranquil` dev
docs at `docs/development/security/security-considerations`.
