# tranquil-rpc — implementation status / session handoff

Living handoff doc. Update at the **end of each phase, before handing off**. Plan spec lives at
`~/.claude/plans/want-to-iterate-on-silly-wand.md`.

---

## Current phase: **Phase 0 — Spike ✅ PASSED** (2026-07-02) → ready for Phase 1

**Run 2 result:** full bidirectional round-trip confirmed for BOTH mockups
(`properties.html` + `main-view.html`), no errors:
`guest connected` → `host.ping() invoked` → `✅ callback stub ran IN PAGE` →
`✅ host→guest callback completed` → `✅ host.ping() resolved -> pong`.
Cap'n Web over the webview `sendToHost`/`ipc-message` transport is validated end-to-end
(guest→host method calls, host→guest callback stubs running in the page, return values).

**Goal:** prove Cap'n Web works over the webview `sendToHost`/`ipc-message` transport — a
guest→host method call resolves, and a page-supplied callback passed as an arg fires host→guest
and runs *in the page*.

### What was built
- New sibling package `tranquil-rpc/` (git-init'd, not committed — awaiting your say-so).
- `capnweb@0.9.0` + `esbuild` installed. Confirmed real API: `new RpcSession(transport, localMain?)`,
  `session.getRemoteMain()`, `RpcTarget` base class, `RpcTransport = { send(string), receive():Promise<string>, abort? }`.
- Transport over channel `"tranquil:rpc"`: `lib/transport-host.js` (webview `ipc-message` ⇄ `webview.send`)
  and `lib/transport-guest.js` (`window.electron.receive` ⇄ `window.electron.sendToHost`).
- `lib/host.js` — dev-package main (`activate`): observes file:// webview pane items, opens a
  Cap'n Web session with a `SpikeHostApi { ping(cb) }`, injects the guest bundle on `did-stop-loading`.
- `lib/guest.js` — injected into the page; opens the session, sets `window.tranquilHost`, fires
  `tranquilhost:ready`, and self-tests `host.ping(cb)`.
- `build.mjs` (esbuild) → `dist/host.cjs` (CJS, atom/electron external) + `dist/tranquil-rpc-guest.js`
  (IIFE). Both carry a `Promise.withResolvers` polyfill banner.
- Loaded as a **bundled package**: added to `tranquil-client/package.json` `dependencies` +
  `packageDependencies` (`"tranquil-rpc": "link:../tranquil-rpc"`) and a `node_modules/tranquil-rpc`
  symlink. Also symlinked into `~/.tranquil/dev/packages/` (dev-mode path).

  ⚠️ **Gotcha:** the `dev/packages` symlink alone did NOT load the package in `yarn start` — owned
  packages load via `packageDependencies` + `node_modules` (bundled), not the dev/packages path.
  First run showed zero `[tranquil-rpc]` logs until the package.json wiring was added.

### Design notes / decisions confirmed
- Cap'n Web `RpcSession` does **not** send on construction — it starts a `readLoop()` awaiting
  `receive()` and only sends when a call is made. Since the **guest initiates** `ping`, every send
  happens after both sides are listening → no lost-message race. (Host attaches its `ipc-message`
  listener before injecting the guest.)
- Host bundled to CJS because the Electron renderer can't `require` capnweb's ESM directly.
- Guest transport reuses the existing `window.electron` bridge — **preload unchanged**.

### Deviations from plan
- Spike lives in the real `tranquil-rpc/` dir (not throwaway scratch) — it's minimal and seeds
  Phase 1. The `SpikeHostApi`, the file://-only targeting, and the guest self-test are clearly
  marked spike-only and get replaced in Phase 1 (real trust classifier, registry, ping capability).

### Already verified automatically (no app needed)
- **Cap'n Web usage** (`RpcSession` + `RpcTarget` + passing a callback as a stub) round-trips in a
  Node in-process harness: `host.ping(cb)` returns `"pong"` and `cb` fires. So the RPC layer and
  our API usage are correct — the manual gate below is **only** exercising the webview IPC
  transport (`webview.send`/`ipc-message` ⇄ `window.electron.sendToHost`/`receive`) and the
  host-injection path.

### Run 1 result (2026-07-02)
Package loaded + activated. **`properties.html` connected; guest→host proven** (`guest connected`,
`host.ping() invoked by guest`). Two issues fixed before run 2:
- Injected before `dom-ready` → `session setup failed: WebView must be attached to the DOM`. Now
  inject on the `dom-ready` event (and only if `getWebContentsId()` shows it's ready).
- `main-view.html`'s `<webview>` wasn't found in 2s of polling → never attached. Now `webviewFor`
  also queries `atom.views.getView(item)`, polling is more patient (10s) and quiet.
- `host.ping` now **awaits** the callback and logs `✅ host→guest callback completed`, so the
  host→guest direction (the still-unconfirmed half) is explicitly verified host-side.

## ▶ MANUAL VERIFICATION GATE (please run)

Everything now logs to the **host console** (the editor window's DevTools) — no need to open the
webview's own DevTools. All spike logs are prefixed `[tranquil-rpc]`.

Pre-req: at least one **file:// webview** must be open. Normally the business mockups
(`tranquil-automations.showBusinessMockups` enabled). If none are open, open any local `.html`
in the tranquil browser.

1. Rebuild + restart:
   `source ~/.nvm/nvm.sh && nvm use && (cd ../tranquil-rpc && npm run build)` then `yarn start`
   in `tranquil-client` (full restart).
2. **Open the editor window's DevTools:** menu **View → Developer → Toggle Developer Tools**
   (or ⌥⌘I with the main window focused). Select the **Console** tab. Filter for `tranquil-rpc`.
3. Expect this sequence:
   - `[tranquil-rpc] host module loaded`  (package loaded)
   - `[tranquil-rpc] activated …`  (activate ran)
   - `[tranquil-rpc] pane item seen: file://…` then `attaching to webview` + `host session created + guest injected`
   - `[tranquil-rpc] guest report → guest connected at file://…`
   - `[tranquil-rpc] host.ping() invoked by guest`
   - `[tranquil-rpc] guest report → ✅ callback stub ran IN PAGE at file://…`
   - `[tranquil-rpc] guest report → ✅ host.ping() resolved (guest → host) -> pong`

**PASS** = both ✅ reports appear (the callback one shows the mockup's file:// URL, proving it ran
in the page). **FAIL** = reassess before Phase 1 (see below).

Diagnostics:
- See `host module loaded` but not `activated`? The package loaded but activate threw — check for
  a following error.
- See no `[tranquil-rpc]` lines at all? Dev package not loaded — confirm the
  `~/.tranquil/dev/packages/tranquil-rpc` symlink and that `yarn start` runs in dev mode.
- See `pane item seen` but no file:// ones? No file:// webview is open (enable business mockups
  or open a local .html).
- Want to see the webview's own console anyway? Focus the mockup and run
  **`tranquil-rpc:open-webview-devtools`** from the command palette.

### If it fails — likely causes
- `Promise.withResolvers is not a function` → polyfill banner not applied (rebuild) or a deeper V8 gap.
- Nothing logs at all → dev package not loaded (check `~/.tranquil/dev/packages/tranquil-rpc` symlink,
  and that `dist/` exists), or no file:// mockups are open.
- Guest connects but ping never resolves → transport wiring (channel name mismatch, `ipc-message`
  args shape). Add logging in `transport-host.js` / `transport-guest.js`.
- Injection error in host console → `webview.executeJavaScript` timing; the `did-stop-loading`
  retry should cover it.

## Next phase entry point — **Phase 1**
Replace the spike with the real package: `trust.js` (default-deny; only file:// under registered
roots), `registry.js` (`registerCapability`/`buildHostApi`), real per-session HostApi with a trivial
`ping` capability, wire into `tranquil-client` (link dep + keep the dev symlink), `addTrustedRoot`
for the mockups dir, and confirm remote `https://` pages get **no** `window.tranquilHost`. Then its
gate (see plan).
