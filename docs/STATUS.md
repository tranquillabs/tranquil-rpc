# tranquil-rpc — implementation status / session handoff

Living handoff doc. Update at the **end of each phase, before handing off**. Plan spec lives at
`~/.claude/plans/want-to-iterate-on-silly-wand.md`.

---

## Current phase: **Phase 3 — types registry + docs + ADR + security doc** — ⏳ built, awaiting manual gate (2026-07-02)

Docs/types only — **no runtime code changed**. Built:
- **`tranquil-rpc/types/host-api.d.ts`** — the guest-facing capability catalog (`window.tranquilHost`):
  `HostApi` with `ping(): Promise<"pong">`, `notify(msg): Promise<true>`, and
  `paneControls.register(items): Promise<true>`; `PaneControlItem` = `{ id, glyph, title, action }`
  with `PaneControlAction = () => void | Promise<void>`; global `Window.tranquilHost?` +
  `tranquilhost:ready` event augmentations. Shapes match the shipped surface (bare-fn vs namespace).
- **`tranquil-rpc/types/tranquil-rpc.d.ts`** — the consumer/module API (`require("tranquil-rpc")`):
  `registerCapability`, `addTrustedRoot`, `isTrusted`, re-exported `RpcTarget`, `activate`/`deactivate`,
  `provideRpc`, `CapabilityContext` (`{ item, webview, url, subscriptions }`), `CapabilityFactory`.
  `/// <reference>`s host-api.d.ts. `package.json` now has `"types": "./types/tranquil-rpc.d.ts"`.
  **Both type-check clean** (`tsc --strict --skipLibCheck --types capnweb`, exit 0) against capnweb's
  real `dist/index.d.ts`.
- **`tranquil-rpc/docs/SECURITY.md`** — living security tracker, seeded from the plan's Security
  section with all three footnotes (VS Code/Bierner, Electron guidance, Cap'n Web), each item tagged
  `[done]`/`[partial]`/`[open]` + an open-issues priority summary.
- **`www-tranquil` dev doc** `docs/development/guest-host-rpc/+page.svx` (new) — architecture,
  transport, trust model, capability + types registry, host/guest API, the two capnweb gotchas, build.
  Updated `docs/development/pane-controls/+page.svx` to point at the RPC path (mockups self-register;
  hardcoded path removed). Both added to the nav list in `src/lib/data/docs.ts`.
- **ADR** `www-tranquil/.../drafts/adr/0009-capnweb-rpc/+page.svx` (new; numbered after 0008) — Nygard,
  matches the repo's shipped `.svx` ADR format (title/description frontmatter + `**Status:** Active ·
  **Date:**` line), NOT the /create-adr skill's raw `type: ADR` template (that format doesn't render
  on the site). Decision, options (Cap'n Web vs more IPC vs bespoke), trust model, consequences.
  Added to `docs.ts` nav.

**Automated checks done (what I could run without the app):** `tsc` on both `.d.ts` = exit 0;
`vite build` in www-tranquil = exit 0 with `guest-host-rpc`, `pane-controls`, and `0009-capnweb-rpc`
all compiling. One pre-existing prerender warning (`pane-controls#registration-api` anchor) — that
self-link + heading predate this phase; not introduced here.

### ▶ MANUAL GATE (Phase 3) — please run
Docs/types only, so the gate is a read-through, not an app restart:
1. `cd ../www-tranquil && npm run dev`, open **Development → Guest↔Host RPC** and **ADR-0009** in the
   docs nav — both render; the pane-controls page shows the new RPC callout. (ADRs live under
   `drafts/`, which is `prerender=false` = dev-only, same as 0001–0008.)
2. Skim `tranquil-rpc/types/host-api.d.ts` against the running app's `window.tranquilHost` — the three
   capabilities + `PaneControlItem` shape match what a trusted mockup actually calls.
3. Skim `tranquil-rpc/docs/SECURITY.md` — seeded content + the three footnote sources are present.
**PASS** = docs render, ADR numbered/readable, `.d.ts` matches the shipped surface, SECURITY.md carries
the seeded content. This is the last phase — on PASS, the feature is complete; run the **Final
end-to-end regression** in the plan, then STATUS.md can be trimmed (dev doc + ADR are the durable record).

## Phase 2 — pane controls capability + cutover — ✅ GATE PASSED (2026-07-02)

**Phase 2 gate result:** both trusted mockups self-register their own ⟳ ⤒ ⓘ controls over RPC on
`tranquilhost:ready` (not the placeholder mimics); ⟳ reloads + re-registers with no duplicate
buttons, ⤒ scrolls the inner container in-page, ⓘ → host toast via the `notify` capability. Actions
run in the page (function stubs). Untrusted remote pages show only the host-defined ⟳ reload and have
`window.tranquilHost === undefined`. Close/reload is clean. The old hardcoded `registerMockupControls`
+ `SCROLL_TOP_JS` path is fully removed.

### What was built (Phase 2)
- **`tranquil-rpc/lib/host.js`** — each session now carries a per-session `CompositeDisposable` in the
  capability ctx (`{ item, webview, url, subscriptions }`), disposed on teardown (reload/close). This
  is the hook that tears down page-registered pane controls so reloads don't accumulate them.
- **`tranquil-rpc/lib/index.js`** — now re-exports `RpcTarget` (from capnweb) + adds it to `provideRpc`.
  **Required for correctness:** capnweb detects capabilities with `instanceof RpcTarget`, and `capnweb`
  isn't resolvable from consumer repos — a consumer's capability subclass MUST extend the exact
  `RpcTarget` bundled into `dist/host.js`, so consumers get it from `require("tranquil-rpc")`.
- **`tranquil-rpc/lib/guest.js`** — dropped the Phase-1 `ping()` self-check (still sets
  `window.tranquilHost` + fires `tranquilhost:ready`). Rebuilt both `dist/` bundles.
- **`tranquil-automations/lib/pane-controls-capability.js`** (new) — `PaneControlsCap` (RpcTarget;
  `register(items)` matches only `ctx.item`, **`.dup()`s each action stub** to retain it past the call
  and disposes the dups on teardown, invokes stubs so actions run in-page) + the `notify` capability as
  a **bare function** so the guest calls `window.tranquilHost.notify(msg)` directly.
  `registerDefaultRemoteControls(rpc)` host-registers ⟳ reload for untrusted browser pages
  (`hasWebview(item) && !rpc.isTrusted(url)`).
- **`tranquil-automations/lib/tranquil-automations.js`** — registers the caps + default remote controls
  in the `showBusinessMockups` block; removed the `registerMockupControls` call/import.
- **`tranquil-automations/lib/mockups.js`** — deleted `SCROLL_TOP_JS` + `registerMockupControls`.
- **`tranquil-automations/lib/notify.js`** — toast helper; committed (was untracked, and
  `tranquil-automations.js` already required it → latent missing-require crash on fresh checkout).
- **`tranquil-automations/mockups/{main-view,properties}.html`** — self-register ⟳ ⤒ ⓘ on
  `tranquilhost:ready`.

### Two bugs found + fixed at the gate (capnweb lifetime/shape lessons)
- **Argument stubs are disposed when the call returns.** First click gave `RpcImportHook was already
  disposed`. Fix: `PaneControlsCap.register` `.dup()`s each action stub and holds the dup for the
  control's lifetime (disposed with the session). Retain any stub you keep past a call.
- **Capability shape = factory return type.** `notify` first returned a `NotifyCap` RpcTarget, so
  `host.notify(msg)` threw `'notify' is not a function` (it was a namespace → would need
  `host.notify.notify(msg)`). Fix: the `notify` factory returns a **bare function**. Rule: bare function
  → `host.name(...)`; RpcTarget → `host.name.method(...)` (like `paneControls`).
- Kept a permanent host-side diagnostic in `PaneControlsCap` (`pane control stub failed: <id> <err>`)
  instead of silently swallowing action-stub rejections — that log is what surfaced both bugs.

## Phase 1 gate (historical) — ✅ PASSED (2026-07-02)

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

## Phase 3 spec (delivered 2026-07-02 — see the top of this file for what was built)
The original entry-point spec, kept for reference. All items below are done:
- **`tranquil-rpc/types/host-api.d.ts`** — the capability catalog: `HostApi` with `ping()`,
  `notify(msg)`, and `paneControls.register(items)`; plus the item/`PaneControlItem` shape (`id`,
  `glyph`, `title`, `action`). Match the **shipped** surface exactly (bare-function vs namespace).
- **`www-tranquil` dev docs** — new `docs/development/guest-host-rpc/+page.svx` (architecture,
  transport, trust model, capability + types registry, host/guest API, the two capnweb gotchas above);
  update `docs/development/pane-controls/+page.svx` to point at the RPC path.
- **ADR** — via `/create-adr` in `www-tranquil/.../drafts/adr/NNNN-capnweb-rpc/+page.svx` (Nygard;
  number after existing 0001/0002…): decision, options (plain IPC vs Cap'n Web), trust model,
  consequences (build step, new dep).
- **`tranquil-rpc/docs/SECURITY.md`** — seed from the plan's Security section (with footnotes); living doc.
Gate: docs render, ADR numbered right, `.d.ts` matches the shipped surface, SECURITY.md carries the
seeded content. See the plan for the full Phase 3 spec.
