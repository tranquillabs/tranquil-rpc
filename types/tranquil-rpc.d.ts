// tranquil-rpc — MODULE API (host/consumer side)
//
// The surface owned consumers get from `require("tranquil-rpc")` (or the `tranquil-rpc` service,
// which returns the same functions). Mirrors lib/index.js. The guest-facing capability catalog —
// what a page calls through `window.tranquilHost` — is in ./host-api.d.ts.
/// <reference path="./host-api.d.ts" />

import type { RpcTarget as CapnwebRpcTarget } from "capnweb";

declare module "tranquil-rpc" {
  /**
   * Per-session context passed to every capability factory. One session per trusted webview,
   * recreated on each (re)load. `subscriptions` collects page-lifetime resources (retained action
   * stubs, pane-control registrations) and is disposed on reload/close.
   */
  export interface CapabilityContext {
    /** The pane item model backing this webview. */
    item: unknown;
    /** The Electron `<webview>` element. */
    webview: unknown;
    /** The trusted `file://` URL currently loaded in the webview. */
    url: string;
    /** Session-scoped CompositeDisposable; capabilities add() page-lifetime teardown here. */
    subscriptions: { add(disposable: unknown): void };
  }

  /**
   * A capability factory. Return a bare FUNCTION for a directly-callable capability
   * (`host.name(…)`), or an `RpcTarget` for a namespace (`host.name.method(…)`). Built lazily
   * once per session and torn down with it.
   */
  export type CapabilityFactory = (
    ctx: CapabilityContext
  ) => ((...args: any[]) => any) | CapnwebRpcTarget;

  /** Register a host capability by name. Must run before a trusted page connects. */
  export function registerCapability(name: string, factory: CapabilityFactory): void;

  /**
   * Trust a `file://` root. Accepts a filesystem path or a `file://` URL; pages at or under it
   * become trusted. Returns the normalized absolute root path, or `null` if unresolvable.
   * SECURITY CRITICAL — default-deny; see docs/SECURITY.md.
   */
  export function addTrustedRoot(input: string): string | null;

  /** The trust classifier: `true` only for `file://` under a registered root. Default-deny. */
  export function isTrusted(url: string): boolean;

  /**
   * Re-exported from capnweb. Consumers MUST subclass THIS class for capability namespaces —
   * capnweb detects capabilities via `instanceof RpcTarget`, and capnweb is not resolvable from
   * consumer repos, so a separately-required copy would be a different class.
   */
  export const RpcTarget: typeof CapnwebRpcTarget;

  /** Dev-package lifecycle (host renderer). */
  export function activate(): unknown;
  export function deactivate(): void;

  /** Service provider (`providedServices["tranquil-rpc"]`). Returns the same direct API. */
  export function provideRpc(): {
    registerCapability: typeof registerCapability;
    addTrustedRoot: typeof addTrustedRoot;
    isTrusted: typeof isTrusted;
    RpcTarget: typeof RpcTarget;
  };
}
