# tranquil-rpc — Security considerations

**Living document.** A running tracker of the threat model, mitigations, and open issues for the
guest↔host RPC surface. Seeded from the adoption plan; **expand it every time we touch the
guest↔host surface** (new capability, transport change, trust-model change, a webview setting).
Linked from the dev docs (`www-tranquil` → Development → *Guest↔Host RPC*).

Status legend: **[done]** mitigated in code · **[partial]** partially addressed · **[open]** tracked
risk, not yet addressed.

## Threat model

Borrowed from VS Code webviews — Bierner[^bierner]: **defense in depth**. Assume webview content can
be compromised (an injection in a trusted page, or an outright hostile remote page). A compromised
page must not read arbitrary files, reach the host DOM/process, or act on another page's behalf.
Design so that even a successful in-page attacker is boxed in.

The tranquil browser loads content over **both `file://` (trusted local mockups) and `http(s)://`
(arbitrary remote)**, and the `<webview>` runs with `nodeIntegration: on`. So any RPC layer must
assume hostile content and default-deny.

## From the VS Code webview learnings (mapped to our Electron `<webview>`)

- **Isolate content from the host.** Scripts in a page must not touch host DOM or host process. We
  rely on `contextIsolation: on` + a minimal `contextBridge` (`window.electron`). Audit that
  surface — it is the entire attack surface from page → host. **[partial]**
- **`nodeIntegration: on` is a red flag.** The tranquil-browser `<webview>`
  (`tranquil-browser/lib/tranquil-browser-view.js`) enables Node integration for *all* pages,
  including remote `http(s)://`. Track: can we scope Node access to trusted origins, or disable it
  and provide needed APIs via capabilities? **This is the single biggest open risk.** **[open]**
- **Isolate webviews from each other.** One page must not observe/alter another's state or pane. Our
  per-session `{ item, webview, url, subscriptions }` context enforces pane scoping (a capability
  matches only `ctx.item`); verify no shared mutable registry leaks across sessions. **[partial]**
- **Controlled local-resource loading.** A compromised page should not read arbitrary disk paths.
  Track whether our `file://` webviews can be constrained (custom protocol / path allowlist) the way
  VS Code restricts `vscode-resource:`. **[open]**
- **Unique origin / no cross-webview state bleed.** VS Code serves webviews from isolated origins so
  localStorage/cookies/service-workers don't leak between them. Track our exposure: do multiple
  `file://` webviews share an origin/partition? (webview `partition` attribute.) **[open]**
- **Scripts off by default / opt-in.** VS Code disables scripts unless the content opts in. Our
  analog: **the guest RPC runtime is injected only for trusted origins** — untrusted pages get no
  runtime at all. **[done]**
- **Intercept navigation.** `https` links / `new-window` should route deliberately, not silently
  navigate the pane or host. Verify the existing `new-window`/`will-navigate` handling can't be
  abused to load hostile content into a trusted context. **[open]**
- **CSP + nonces.** VS Code sets a restrictive CSP; `srcdoc` iframes inherit parent CSP and can't
  bypass it. Our mockups currently ship **no CSP** — track adding a strict CSP (nonce'd scripts) to
  trusted mockups so an injection can't pull in remote code. **[open]**
- **Sandbox semantics.** `sandbox="allow-scripts"` without `allow-same-origin` forces a unique
  origin. Track whether our `<webview>` usage should adopt equivalent hardening. **[open]**

## From this project (RPC / capability-specific)

- **Trust classifier is security-critical.** `isTrusted` (`lib/trust.js`) must **default-deny**;
  trust only `file://` under explicitly registered roots; **never** trust `http(s)://`. A bug here
  grants capabilities to hostile pages. No wildcard/prefix footguns — matching is exact path or a
  real child path segment, so `…/mockups` never matches `…/mockups-evil`. Unit-tested (13/13 cases).
  Needs review on every change. **[done]**
- **Untrusted = zero RPC surface.** No guest runtime injected, no session, empty HostApi. Even so,
  the host must treat *any* inbound `tranquil:rpc` message as untrusted input (a remote page can
  call `sendToHost` directly) — only trusted sessions carry capabilities; messages from untrusted
  webviews get no capability-bearing session. **[done]** for injection; **[partial]** — the host
  binds a session only after `isTrusted(url)`, but should also validate the sender frame (below).
- **Capabilities are the authority boundary.** A page can only do what its handed `HostApi` allows.
  Keep each capability **narrow and least-privilege**; never expose a generic
  "run/eval/dispatch arbitrary command" capability to pages. Review every new capability as a
  privilege grant. **[done]** (current caps: `ping`, `notify`, `paneControls.register` — all narrow.)
- **No host-side eval of page-provided strings.** Actions execute in the *page* (Cap'n Web function
  stubs), never by the host `executeJavaScript`-ing page-supplied code. **[done]** for the RPC path.
  Pre-existing risk to track: the bp-client preload `eval()`s context-menu `fn` strings
  (`tranquil-browser/resources/bp-client.js`) — flagged as pre-existing. **[open]**
- **Only pass data + stubs across RPC.** Never hand a page a broad host object; expose scoped
  `RpcTarget`s. `PaneControlsCap.register` returns `true`, never the raw Disposable. Be deliberate
  about what a returned/queued stub can reach. **[done]**
- **Lifecycle / DoS.** Stubs and registrations must dispose on page close/reload. Each session
  carries a `CompositeDisposable`; retained action stubs are `.dup()`ed and disposed on teardown, and
  pane-control registrations are removed with the session (reloads don't accumulate). Watch for a
  page spamming `register` to exhaust host resources — **consider rate/size limits on
  registrations.** **[partial]**
- **Supply chain.** Pin `capnweb` (currently `0.9.0`, exact) and the esbuild toolchain; review
  updates. The committed `dist/` bundles are trusted code injected into pages — treat bundle
  integrity as security-relevant. **[partial]**
- **Injection integrity.** The guest bundle is injected via `executeJavaScript` into trusted pages;
  ensure the bundle source can't be tampered with at rest and is only injected **after** the trust
  check (`host.js` reads `dist/tranquil-rpc-guest.js` and injects only when `isTrusted(url)`).
  **[done]** for ordering; **[open]** for at-rest integrity.

## From Electron security guidance (general checklist + issues in our code)

Source: Electron Security guidance[^electron]. These are broader tranquil-browser issues surfaced
while designing the RPC trust model; tracked here because the RPC layer's safety depends on them.

- **Overly broad `contextBridge`.** `window.electron` exposes `send`/`sendToHost`/`sendSync`/
  `invoke`/`receive` on **arbitrary channel names** (`bp-client.js`) — a compromised page can reach
  *any* `ipcMain` handler. Move toward an **allowlist of channels** (and expose scoped methods, not a
  generic IPC pipe). High priority; our RPC channel (`tranquil:rpc`) should be the model. **[open]**
- **Validate IPC sender.** `ipcMain`/host handlers must check `event.senderFrame` (origin/URL) and
  not trust a message just because it arrived on a channel. The host must bind a capability-bearing
  session only to a verified trusted frame. **[open]**
- **`remote` module.** The preload imports and uses Electron `remote` (`bp-client.js`,
  `remote.getCurrentWebContents()`) — deprecated and a known escalation vector (removed in modern
  Electron). Track removal. **[open]**
- **Auto-granting permissions.** The webview allows **every** permission request
  (`tranquil-browser-view.js`, `e.request.allow()`) — camera, mic, geolocation, etc. granted
  unconditionally to any page, including remote. Add a permission handler that denies by default and
  gates by origin/trust. **[open]**
- **Enable the renderer `sandbox`.** Our `<webview>` runs unsandboxed with `nodeIntegration: on`.
  Electron recommends `sandbox: true` + `nodeIntegration: false` for anything loading untrusted
  content. Track scoping Node/sandbox by trust. **[open]**
- **`allowfileaccessfromfiles: "on"`** relaxes file access from `file://` origins
  (`tranquil-browser-view.js`) — review whether it's needed; it widens what a compromised `file://`
  page can read. **[open]**
- **Never enable `webSecurity: false` / `allowRunningInsecureContent`.** `disablewebsecurity` is
  currently commented out — keep it off. **[done]**
- **Restrict navigation & window creation.** Gate `will-navigate` and
  new-window/`setWindowOpenHandler` to known destinations; the current `new-window` handler opens
  `e.url` via `atom.workspace.open` — ensure a hostile page can't drive navigation into a *trusted*
  context or spawn unexpected windows. **[open]**
- **`shell.openExternal` with untrusted URLs** can launch external handlers — validate/scheme-check
  any URL a page can cause to be opened externally. **[open]**
- **No `allowpopups` on the `<webview>`**, no `enableBlinkFeatures`/experimental features, and scope
  the `webviewTag` capability to where it's needed. **[partial]**
- **Only load secure remote content** (HTTPS); block/verify mixed and HTTP content. **[open]**
- **Stay on a current, patched Electron.** Track the version and apply security releases; the
  `<webview>` tag itself is a legacy surface Electron discourages — note as a longer-term migration.
  **[open]**
- **Keep the preload minimal & audited.** It has full Node; every symbol it exposes is attack
  surface. The bp-client preload also `eval()`s injected strings (noted above) — audit all of it.
  **[open]**

## Open-issues summary (priority order)

1. `nodeIntegration: on` for all pages incl. remote — scope Node access by trust. **[open]**
2. Over-broad `contextBridge` (arbitrary channels) + no IPC-sender validation. **[open]**
3. Auto-granted permissions for every page. **[open]**
4. Deprecated `remote` module in the preload. **[open]**
5. No CSP on trusted mockups; `allowfileaccessfromfiles`; navigation/window-open gating. **[open]**
6. Rate/size limits on `paneControls.register`; `dist/` at-rest integrity. **[partial]**

[^bierner]: Matt Bierner, "What I've learned so far while bringing VS Code's Webviews to the web"
(July 1, 2019) — <https://blog.mattbierner.com/vscode-webview-web-learnings/>. Source of the webview
threat model and isolation/CSP/sandbox learnings above.

[^electron]: Electron Security guidance — <https://www.electronjs.org/docs/latest/tutorial/security>.
Source of the checklist items above (sandbox, context isolation, IPC sender validation, permission
handlers, navigation restriction, avoiding `remote`, patched versions).

[^capnweb]: Cap'n Web (Cloudflare, MIT) — repo <https://github.com/cloudflare/capnweb>, npm `capnweb`
<https://www.npmjs.com/package/capnweb>. Source of the RPC model, `RpcTarget`, `RpcTransport`,
custom-transport `RpcSession`, and promise-pipelining details.
