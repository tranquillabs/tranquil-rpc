// tranquil-rpc host lifecycle — dev-package activate/deactivate (bundled into dist/host.js).
//
// Observes browser <webview> pane items. On each page load it evaluates the loaded URL's trust:
//   - TRUSTED  (file:// under a registered root): opens a Cap'n Web session with a per-session
//              HostApi (the registered capabilities) and injects the guest runtime into the page's
//              main world, exposing window.tranquilHost.
//   - UNTRUSTED (all http(s)://, file:// outside roots): NO session, NO injection — zero RPC
//              surface. This default-deny posture is security-critical.
//
// One session per trusted webview: recreated on every (re)load and disposed on close.
import { RpcSession } from "capnweb";
import { CompositeDisposable, Disposable } from "atom";
import fs from "fs";
import path from "path";
import { hostTransport } from "./transport-host.js";
import { buildHostApi, registerCapability } from "./registry.js";
import { isTrusted, trustedRoots } from "./trust.js";

const TAG = "[tranquil-rpc]";
console.log(TAG, "host module loaded");

let subscriptions = null;

let guestBundleCache = null;
function guestBundle() {
  if (guestBundleCache == null) {
    guestBundleCache = fs.readFileSync(
      path.join(__dirname, "tranquil-rpc-guest.js"),
      "utf8"
    );
  }
  return guestBundleCache;
}

// Find the <webview> element for a browser item, trying both the view outlet and the DOM.
function webviewFor(item) {
  const outlet = item && item.view && item.view.htmlv && item.view.htmlv[0];
  if (outlet) return outlet;
  const el = item && atom.views.getView(item);
  return (el && el.querySelector && el.querySelector("webview")) || null;
}

// A <webview> is only safe for executeJavaScript once attached (has a web contents id).
function isReady(webview) {
  try {
    webview.getWebContentsId();
    return true;
  } catch (e) {
    return false;
  }
}

// Manage a single webview across its whole lifetime: on each load, (re)establish a session if the
// loaded URL is trusted, otherwise ensure there is none. Returns a Disposable that tears the
// current session down and stops listening.
function manage(webview, item) {
  let current = null; // { transport, session }

  const teardown = (reason) => {
    if (!current) return;
    try {
      current.transport.abort(reason);
    } catch (e) {
      /* ignore */
    }
    current = null;
  };

  const onLoad = () => {
    teardown("reload"); // drop any prior session before re-evaluating trust
    let url;
    try {
      url = webview.getURL();
    } catch (e) {
      url = null;
    }
    if (!url) return;

    if (!isTrusted(url)) {
      // Default-deny: untrusted pages receive no runtime and no session at all.
      console.log(TAG, "untrusted — no runtime injected:", url);
      return;
    }

    const transport = hostTransport(webview);
    const session = new RpcSession(transport, buildHostApi({ item, webview, url }));
    current = { transport, session };
    webview
      .executeJavaScript(guestBundle())
      .then(() => console.log(TAG, "trusted session opened + guest injected:", url))
      .catch((e) => console.error(TAG, "guest injection failed:", e));
  };

  webview.addEventListener("dom-ready", onLoad); // fires on every load, when injection is legal
  if (isReady(webview)) onLoad(); // already loaded before we attached (missed dom-ready)

  return new Disposable(() => {
    webview.removeEventListener("dom-ready", onLoad);
    teardown("closed");
  });
}

export function activate() {
  subscriptions = new CompositeDisposable();
  const managed = new WeakMap(); // webview → Disposable

  // Phase 1 built-in capability: a trivial health-check that round-trips guest → host → guest.
  // Real capabilities are registered by consumers (via the service or require("tranquil-rpc")).
  registerCapability("ping", (ctx) => () => {
    console.log(TAG, "ping() invoked by guest:", ctx.url);
    return "pong";
  });

  const consider = (item) => {
    // Only browser-like items carry a webview; text editors etc. have no getURL — skip them so we
    // don't poll for a webview that will never appear.
    if (!item || typeof item.getURL !== "function") return;

    // The <webview> element may not exist the instant the item appears; wait for it (quietly).
    let tries = 0;
    const tryAttach = () => {
      const webview = webviewFor(item);
      if (!webview) {
        if (tries++ < 100) setTimeout(tryAttach, 100);
        return;
      }
      if (managed.has(webview)) return;
      const disp = manage(webview, item);
      managed.set(webview, disp);
      subscriptions.add(disp);
    };
    tryAttach();
  };

  subscriptions.add(atom.workspace.observePaneItems(consider));

  // Dispose a webview's session promptly when its pane item closes.
  subscriptions.add(
    atom.workspace.onWillDestroyPaneItem(({ item }) => {
      const webview = webviewFor(item);
      const disp = webview && managed.get(webview);
      if (disp) {
        disp.dispose();
        managed.delete(webview);
      }
    })
  );

  subscriptions.add(
    atom.commands.add("atom-workspace", {
      "tranquil-rpc:open-webview-devtools": () => {
        const webview = webviewFor(atom.workspace.getActivePaneItem());
        if (webview) webview.openDevTools();
        else console.warn(TAG, "active pane item has no webview");
      },
    })
  );

  console.log(TAG, "activated; trusted roots:", trustedRoots());
  return subscriptions;
}

export function deactivate() {
  if (subscriptions) {
    subscriptions.dispose();
    subscriptions = null;
  }
}
