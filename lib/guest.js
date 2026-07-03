// PHASE 0 SPIKE — guest entry, bundled to an IIFE (dist/tranquil-rpc-guest.js) and injected
// into a trusted page's main world by the host via webview.executeJavaScript.
//
// Opens a Cap'n Web session over the webview transport, exposes the host capability object as
// window.tranquilHost, fires "tranquilhost:ready", and self-tests. Results are routed to the
// HOST console via host.report(...) so verification needs only the editor window's DevTools.
// The callback reports location.href — proving the host→guest callback stub ran IN the page.
import { RpcSession } from "capnweb";
import { guestTransport } from "./transport-guest.js";

(function connectToHost() {
  if (typeof window === "undefined" || !window.electron) {
    console.error("[tranquil-rpc] no window.electron bridge — cannot connect");
    return;
  }
  if (window.tranquilHost) return; // already connected on this page

  const session = new RpcSession(guestTransport());
  const host = session.getRemoteMain();
  window.tranquilHost = host;
  window.dispatchEvent(new Event("tranquilhost:ready"));
  console.log("[tranquil-rpc spike] guest connected; window.tranquilHost set");

  // ---- spike self-test (remove in Phase 1) — everything routes to the HOST console ----
  (async () => {
    try {
      host.report("guest connected at " + location.href);
      const result = await host.ping(() =>
        host.report("✅ callback stub ran IN PAGE at " + location.href)
      );
      host.report("✅ host.ping() resolved (guest → host) -> " + result);
    } catch (e) {
      try {
        host.report("❌ ping failed: " + (e && e.message ? e.message : String(e)));
      } catch (_) {
        console.error("[tranquil-rpc spike] ping failed and report failed", e);
      }
    }
  })();
})();
