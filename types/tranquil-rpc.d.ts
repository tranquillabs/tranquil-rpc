// tranquil-rpc — MODULE API (host/consumer side)
//
// The surface owned consumers get from `require("tranquil-rpc")` (or the `tranquil-rpc` service,
// which returns the same functions). Mirrors lib/index.js. The guest-facing capability catalog —
// what a page calls through `window.tranquilHost` — is in ./host-api.d.ts.
/// <reference path="./host-api.d.ts" />

import type { RpcTarget as CapnwebRpcTarget } from "capnweb";

declare module "tranquil-rpc" {
  /** The principal kinds a capability session can belong to. */
  export type CapabilityAudience = "webview" | "runner";

  /**
   * Per-session context passed to every capability factory. For webview sessions: one per trusted
   * webview, recreated on each (re)load. For runner sessions: one per automation run, torn down
   * with the run's socket. `subscriptions` collects session-lifetime resources (retained action
   * stubs, pane-control registrations) and is disposed on reload/close/run end.
   */
  export interface CapabilityContext {
    /** Which principal this session belongs to. Defaults to "webview". */
    kind?: CapabilityAudience;
    /** Webview sessions: the pane item model backing the webview. */
    item?: unknown;
    /** Webview sessions: the Electron `<webview>` element. */
    webview?: unknown;
    /** Webview sessions: the trusted `file://` URL currently loaded. */
    url?: string;
    /** Runner sessions: the run id the token was minted for. */
    runId?: string;
    /** Runner sessions: absolute path of the running script. */
    scriptPath?: string;
    /** Runner sessions: the script's directory (the run's fs sandbox root). */
    scriptDir?: string;
    /** Session-scoped CompositeDisposable; capabilities add() session-lifetime teardown here. */
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

  /**
   * Register a host capability by name. Must run before a session of the target audience
   * connects. `options.audience` controls which principals see the capability; it defaults to
   * `["webview"]`, so runner exposure is always opt-in.
   */
  export function registerCapability(
    name: string,
    factory: CapabilityFactory,
    options?: { audience?: CapabilityAudience[] }
  ): void;

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

  /**
   * Runner bridge (ADR-0022) — SECURITY CRITICAL, same review discipline as the trust
   * classifier. Lazily starts the per-window WebSocket server on 127.0.0.1 (ephemeral port).
   */
  export function ensureRunnerServer(): Promise<{ port: number }>;

  /**
   * Mint a one-time run token (32-byte hex). Deliver to the child via env only — never in a
   * URL. Single-use; expires unclaimed after 60 s.
   */
  export function mintRunToken(meta: {
    runId: string;
    scriptPath?: string;
    scriptDir?: string;
  }): string;

  /** Send the protocol-level "CANCEL" frame on a run's socket. False if no live session. */
  export function sendCancel(runId: string): boolean;

  /** Run over (exit/kill/timeout): close its socket and invalidate any unclaimed token. */
  export function endRun(runId: string): void;

  /** Close the runner server and all live runner sessions (deactivate path). */
  export function closeRunnerServer(): void;

  /** Dev-package lifecycle (host renderer). */
  export function activate(): unknown;
  export function deactivate(): void;

  /** Service provider (`providedServices["tranquil-rpc"]`). Returns the same direct API. */
  export function provideRpc(): {
    registerCapability: typeof registerCapability;
    addTrustedRoot: typeof addTrustedRoot;
    isTrusted: typeof isTrusted;
    RpcTarget: typeof RpcTarget;
    ensureRunnerServer: typeof ensureRunnerServer;
    mintRunToken: typeof mintRunToken;
    sendCancel: typeof sendCancel;
    endRun: typeof endRun;
  };
}
