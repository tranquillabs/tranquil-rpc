// tranquil-rpc — HOST API TYPES REGISTRY
//
// The canonical catalog of what a TRUSTED guest page may call through `window.tranquilHost`.
// This is the guest-facing view of the host capability surface: the object a trusted page gets
// from the injected runtime (see lib/guest.js), which is the Cap'n Web *remote main* — a set of
// capability stubs.
//
// Keep this file in lockstep with the SHIPPED surface:
//   - built-in `ping`               → lib/host.js (registerCapability("ping", …))
//   - `notify`, `paneControls`      → tranquil-automations/lib/pane-controls-capability.js
// A factory that returns a bare function becomes a directly-callable capability (`host.notify(…)`);
// one that returns an RpcTarget becomes a namespace (`host.paneControls.register(…)`). Model that
// shape here exactly. When a consumer adds a capability, add it to `HostApi` in the same change.
//
// RPC NOTE: every call crosses a Cap'n Web session, so each capability method resolves
// ASYNCHRONOUSLY — the return types below are the *logical* results; over the wire each is wrapped
// in a promise/stub. Guests `await` them (e.g. `await window.tranquilHost.ping()` → "pong").

/**
 * A pane-control action, supplied by the guest as a Cap'n Web function stub. The host holds the
 * stub for the control's lifetime and invokes it on click, so the action runs back IN THE PAGE.
 * It receives no arguments and may be sync or async.
 */
export type PaneControlAction = () => void | Promise<void>;

/**
 * One tab-bar pane control a trusted page registers for its own pane.
 * Mirrors the `{ id, glyph, title, action }` def consumed by
 * tranquil-automations/lib/pane-controls-capability.js → PaneControlsCap.register.
 */
export interface PaneControlItem {
  /** Stable id for the control (also used as the de-dup / ordering key). */
  id: string;
  /** The glyph rendered in the button, e.g. "⟳" "⤒" "ⓘ". */
  glyph: string;
  /** Accessible label / tooltip (button `title` + `aria-label`). */
  title: string;
  /** Runs in the page when the control is clicked. */
  action: PaneControlAction;
}

/**
 * `paneControls` capability — a namespace (backed by an RpcTarget). Lets a trusted page put its
 * own controls into ITS pane's tab-bar; the registration is matched to this session's item only,
 * and is torn down when the page reloads or closes.
 */
export interface PaneControlsCapability {
  /**
   * Register control items for this page's pane. Resolves to `true` (data, never a raw Disposable
   * — teardown is handled host-side on session end).
   */
  register(items: PaneControlItem[]): Promise<true>;
}

/**
 * The host capability object exposed to a trusted guest as `window.tranquilHost`
 * (the Cap'n Web remote main). Exactly the registered capabilities — nothing else is reachable.
 */
export interface HostApi {
  /** Built-in health check. Round-trips guest → host → guest, resolving to "pong". */
  ping(): Promise<"pong">;
  /** Surface a host toast (an info notification the page can't raise itself). Resolves to `true`. */
  notify(msg: string): Promise<true>;
  /** Namespace: register this page's own tab-bar pane controls. */
  paneControls: PaneControlsCapability;
}

declare global {
  interface Window {
    /**
     * Present ONLY on trusted pages (file:// under a registered root), set by the injected guest
     * runtime. `undefined` on every untrusted page — check before use, or listen for
     * `tranquilhost:ready`.
     */
    tranquilHost?: HostApi;
  }

  interface WindowEventMap {
    /** Fired on `window` once `window.tranquilHost` is connected and ready. */
    "tranquilhost:ready": Event;
  }
}

export {};
