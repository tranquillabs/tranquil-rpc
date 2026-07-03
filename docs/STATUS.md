# tranquil-rpc — implementation status / session handoff

Living handoff doc. Update at the **end of each phase, before handing off**. Plan spec lives at
`~/.claude/plans/want-to-iterate-on-silly-wand.md`.

---

## Current phase: **Phase 1 — real package** (transport + trust + sessions) — ✅ GATE PASSED (2026-07-02) → ready for Phase 2

**Gate result:** all four checks green in-app. Startup logged `trusted roots: [ …/mockups ]` and
`trusted session opened + guest injected` for both mockups. Trusted mockup webview console showed
`connected; window.tranquilHost ready` + `ping -> pong` (and `await window.tranquilHost.ping()` →
`"pong"`). Remote pages (`https://example.com/`, `https://cal.com/`) logged
`untrusted — no runtime injected` host-side and had `window.tranquilHost === undefined` in-page.
Closing a mockup tab produced no console errors (clean session dispose). Trust boundary behaves
exactly per the spec table (trusted file:// vs untrusted http(s)://).

**Goal:** the real `tranquil-rpc` package. Trust-gated host lifecycle that injects the guest runtime
+ opens a Cap'n Web session **only for trusted** webviews, exposing `window.tranquilHost` with a
single trivial `ping` capability. No pane controls yet (Phase 2).

### What was built (this session)
- **`lib/trust.js`** — `addTrustedRoot(dirOrFileUrl)` + `isTrusted(url)`, **default-deny**. Resolves
  the URL to an fs path (`fileURLToPath`, query/hash stripped); trusts only `file://` at or under a
  registered root (`===` or `startsWith(root + path.sep)` — no bare-prefix footgun, so `…/mockups`
  never matches `…/mockups-evil`). `http(s)://`/`data:`/`about:`/unparseable/non-string → false.
  **Unit-tested in isolation — all 13 cases pass** (see below).
- **`lib/registry.js`** — `registerCapability(name, factory(ctx))` + `buildHostApi(ctx)`. HostApi is
  a **per-session** object whose prototype (chained to `RpcTarget.prototype`) carries a **getter per
  capability** (capnweb rejects *own instance properties* — only prototype methods/getters are
  reachable over RPC; discovered + worked around this session). Getter returns `factory(ctx)`, built
  lazily + cached per session. Factory may return a **function** (`host.name(...)`) or an
  **RpcTarget** (namespace, `host.name.method(...)`).
- **`lib/host.js`** — `activate`/`deactivate`. Observes browser webview pane items; per webview, on
  each `dom-ready`: tears down any prior session, reads `webview.getURL()`, and **only if trusted**
  opens `new RpcSession(hostTransport(webview), buildHostApi({item,webview,url}))` + injects the guest
  bundle. Untrusted → logs + does nothing (zero surface). Disposes the session on pane-item close
  (`onWillDestroyPaneItem`) and on reload. Registers the built-in `ping` capability. Keeps the
  `tranquil-rpc:open-webview-devtools` command.
- **`lib/guest.js`** — sets `window.tranquilHost = session.getRemoteMain()`, fires
  `tranquilhost:ready`, then self-checks `ping()` (logs `[tranquil-rpc] ping -> pong` in the **page**
  console). Real capability usage replaces the self-check in Phase 2.
- **`lib/index.js`** — bundle entry (package `main` → `dist/host.js`). Re-exports `activate`,
  `deactivate`, `registerCapability`, `addTrustedRoot`, `isTrusted`, and `provideRpc` (service).
- Transport (`transport-host.js`/`transport-guest.js`/`queue.js`/`channel.js`) **unchanged** from
  Phase 0 — validated there.
- **`package.json`** — added `providedServices."tranquil-rpc" → provideRpc`. `main` = `dist/host.js`.
- **`build.mjs`** — host entry now `lib/index.js` → `dist/host.js`; guest `lib/guest.js` →
  `dist/tranquil-rpc-guest.js`. Both rebuilt; all 6 CJS exports confirmed in `dist/host.js`.

### Wiring into tranquil-automations (registers the trusted root)
- `package.json` dep `"tranquil-rpc": "link:../tranquil-rpc"` + `node_modules/tranquil-rpc` symlink
  (so `require("tranquil-rpc")` resolves from the automations repo).
- `lib/tranquil-automations.js`: `const rpc = require("tranquil-rpc")`, and inside the
  `showBusinessMockups` block (before `openMockups`) `rpc.addTrustedRoot(MOCKUPS_DIR)` — synchronous,
  so the mockups' first load is already trusted (avoids a service-timing race). **Pane controls NOT
  touched** — `registerMockupControls` still runs (that cutover is Phase 2).

### Verified automatically (no app needed)
- **Registry model** — a Node in-process capnweb harness confirmed the exact shipped pattern:
  per-session prototype getters → `instanceof RpcTarget` holds; `host.ping()` (fn), `host.paneControls.register()`
  (RpcTarget namespace), `host.notify(msg)` (fn) all round-trip; an **unregistered** name is rejected
  (`'bogus' is not a function`) → capability surface = exactly the registered set.
- **Trust classifier** — 13/13 cases pass: trusted mockup files (incl. query/hash), the root dir,
  nested paths → true; `…-evil` sibling, `https://`, `http://`, `file:///etc/passwd`, `data:`,
  `about:blank`, empty/null/undefined → false.

### Deviations from plan
- `index.js` is the **bundle entry** (`main`), not a separate un-bundled require file — it re-exports
  host/registry/trust so `require("tranquil-rpc")` and the service share the singletons. Same effect
  as planned.
- Trusted-root registration uses **`require("tranquil-rpc").addTrustedRoot`** (not the service) to be
  synchronous at activate. The service (`provideRpc`) still exists; Phase 2 chooses service vs require
  for capability registration.
- Bundle is `dist/host.js` (not `host.cjs`) — matches the actual filename since Phase 0.
- Guest keeps a tiny `ping()` self-check (page console) as the Phase 1 gate signal; removed in Phase 2.

## ▶ MANUAL VERIFICATION GATE (please run)

Pre-req: business mockups enabled (`tranquil-automations.showBusinessMockups`, default on) so at
least one **trusted file:// mockup** opens. For the untrusted check, also open any remote page
(e.g. a `https://` URL) in the tranquil browser.

1. Rebuild + restart:
   `source ~/.nvm/nvm.sh && nvm use && (cd ../tranquil-rpc && npm run build)` then `yarn start` in
   `tranquil-client` (full restart).
2. **Editor window DevTools** (⌥⌘I, Console, filter `tranquil-rpc`). Expect on startup:
   - `[tranquil-rpc] host module loaded`
   - `[tranquil-rpc] activated; trusted roots: […/tranquil-automations/mockups]`
   - `[tranquil-rpc] trusted session opened + guest injected: file://…/mockups/main-view.html`
     (and again for `properties.html`)
   - `[tranquil-rpc] ping() invoked by guest: file://…` (the guest self-check round-tripping)
3. **Trusted page** — focus a mockup, run `tranquil-rpc:open-webview-devtools`. In that webview
   console expect `[tranquil-rpc] connected; window.tranquilHost ready` and `[tranquil-rpc] ping -> pong`.
   Then confirm interactively: `await window.tranquilHost.ping()` → `"pong"`.
4. **Untrusted page** — open a `https://` page; its webview console shows **no** `[tranquil-rpc]`
   lines, and `window.tranquilHost` is **`undefined`**. Host console shows
   `[tranquil-rpc] untrusted — no runtime injected: https://…`.
5. **Dispose** — close a mockup tab; **no console errors**. (Reloading a mockup re-injects and
   re-runs the ping check cleanly.)

**PASS** = trusted mockup has `window.tranquilHost` + `ping` → `pong`; remote page has it
**undefined**; close is clean. **FAIL** = trust boundary or session lifecycle is wrong — fix before
Phase 2.

Diagnostics:
- No `[tranquil-rpc]` lines at all → package didn't load (check the `~/.tranquil/dev/packages/tranquil-rpc`
  symlink + `dist/` exists) OR `require("tranquil-rpc")` threw in automations at load (would silently
  crash that file — check `node_modules/tranquil-rpc` symlink in the automations repo).
- `activated` but `trusted roots: []` → automations didn't register the root (its `require` failed,
  or `showBusinessMockups` is off).
- Session opens but `window.tranquilHost` missing in the page → guest injection failed (see the host
  console `guest injection failed` line) or transport wiring.
- A mockup shows `untrusted` → its URL isn't under the registered root (check the logged URL vs root).

## Next phase entry point — **Phase 2** (pane controls capability + cutover)
Add `PaneControlsCap` + `NotifyCap` (host `RpcTarget`s) in tranquil-automations
(`lib/pane-controls-capability.js`); `registerCapability("paneControls", …)` + `("notify", …)` (via
service or require — decide, note the timing). Convert both mockups to self-register (⟳ reload / ⤒
scroll-top / ⓘ about → `notify`) on `tranquilhost:ready`. **Remove** `registerMockupControls()` +
`SCROLL_TOP_JS` from `mockups.js`. Add host-side default controls for remote/untrusted browser pages.
`pane-controls.js` itself stays unchanged. Then Phase 2's gate (see plan).
