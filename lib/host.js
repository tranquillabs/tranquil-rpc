// PHASE 0 SPIKE — host entry (dev package main module), bundled to dist/host.js.
//
// Observes browser webview pane items; for file:// pages it opens a Cap'n Web session over the
// webview transport and injects the guest bundle into the page (on 'dom-ready', so the guest's
// document exists and executeJavaScript is legal). localMain is a SpikeHostApi:
//   - ping(cb): awaits the passed cb (proving host→guest callback stubs run in the page), returns "pong".
//   - report(msg): lets the guest route results to the HOST console.
// Also registers `tranquil-rpc:open-webview-devtools`.
//
// NOTE: spike only targets file:// (real trust classifier comes in Phase 1). Not the real package.
import { RpcSession, RpcTarget } from "capnweb";
import { CompositeDisposable, Disposable } from "atom";
import { hostTransport } from "./transport-host.js";
import fs from "fs";
import path from "path";

const TAG = "[tranquil-rpc]";
console.log(TAG, "host module loaded");

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

class SpikeHostApi extends RpcTarget {
  async ping(cb) {
    console.log(TAG, "host.ping() invoked by guest");
    if (cb) {
      try {
        await cb(); // round-trips host→guest; the guest's cb runs in the page
        console.log(TAG, "✅ host→guest callback completed");
      } catch (e) {
        console.error(TAG, "callback invocation failed", e);
      }
    }
    return "pong";
  }
  report(msg) {
    console.log(TAG, "guest report →", msg);
  }
}

// Find the <webview> element for a browser item, trying both the view outlet and the DOM.
function webviewFor(item) {
  const outlet = item && item.view && item.view.htmlv && item.view.htmlv[0];
  if (outlet) return outlet;
  const el = item && atom.views.getView(item);
  return (el && el.querySelector && el.querySelector("webview")) || null;
}

// A <webview> is only safe for executeJavaScript once attached + dom-ready.
function isReady(webview) {
  try {
    webview.getWebContentsId();
    return true;
  } catch (e) {
    return false;
  }
}

// One session per webview; recreated on each (re)load so a reloaded guest reconnects cleanly.
function attach(webview, url, subscriptions) {
  let current = null;

  const start = () => {
    if (current) {
      try {
        current.transport.abort("reload");
      } catch (e) {
        /* ignore */
      }
      current = null;
    }
    const transport = hostTransport(webview);
    const session = new RpcSession(transport, new SpikeHostApi());
    current = { transport, session };
    webview
      .executeJavaScript(guestBundle())
      .then(() => console.log(TAG, "session created + guest injected:", url))
      .catch((e) => console.error(TAG, "guest injection failed", e));
  };

  webview.addEventListener("dom-ready", start); // fires each load, when injection is legal
  if (isReady(webview)) start(); // already loaded before we attached (missed dom-ready)

  subscriptions.add(
    new Disposable(() => {
      webview.removeEventListener("dom-ready", start);
      if (current) {
        try {
          current.transport.abort("teardown");
        } catch (e) {
          /* ignore */
        }
      }
    })
  );
}

export function activate() {
  const subscriptions = new CompositeDisposable();
  const attached = new WeakSet();

  const consider = (item) => {
    const url = item && item.getURL && item.getURL();
    if (!url || url.indexOf("file://") !== 0) return; // spike: file:// only

    // The <webview> may not exist the instant the item appears; wait for it (patiently, quietly).
    let tries = 0;
    const tryAttach = () => {
      const webview = webviewFor(item);
      if (!webview) {
        if (tries++ < 100) setTimeout(tryAttach, 100);
        else console.warn(TAG, "gave up finding a webview for", url);
        return;
      }
      if (attached.has(webview)) return;
      attached.add(webview);
      console.log(TAG, "attaching to webview:", url);
      attach(webview, url, subscriptions);
    };
    tryAttach();
  };

  subscriptions.add(atom.workspace.observePaneItems(consider));

  subscriptions.add(
    atom.commands.add("atom-workspace", {
      "tranquil-rpc:open-webview-devtools": () => {
        const webview = webviewFor(atom.workspace.getActivePaneItem());
        if (webview) webview.openDevTools();
        else console.warn(TAG, "active pane item has no webview");
      },
    })
  );

  console.log(TAG, "activated");
  return subscriptions;
}

export function deactivate() {}
