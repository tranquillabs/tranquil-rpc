// tranquil-rpc guest — injected by the host into a TRUSTED page's main world, bundled to the IIFE
// dist/tranquil-rpc-guest.js. Untrusted pages never receive this (see host.js).
//
// Opens the Cap'n Web session over the webview transport, exposes the host capability object as
// window.tranquilHost, and fires "tranquilhost:ready". Trusted pages then call their capabilities,
// e.g. window.tranquilHost.ping().
import { RpcSession } from "capnweb";
import { guestTransport } from "./transport-guest.js";

(function connectToHost() {
  if (typeof window === "undefined" || !window.electron) {
    console.error("[tranquil-rpc] no window.electron bridge — cannot connect");
    return;
  }
  if (window.tranquilHost) return; // already connected on this page

  const session = new RpcSession(guestTransport());
  window.tranquilHost = session.getRemoteMain();
  window.dispatchEvent(new Event("tranquilhost:ready"));
  console.log("[tranquil-rpc] connected; window.tranquilHost ready");
})();
