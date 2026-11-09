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
   * Session-scoped CompositeDisposable: capabilities add() session-lifetime resources here
   * (retained action stubs, pane-control registrations), disposed on reload, close or run end.
   */
  export interface SessionSubscriptions {
    add(disposable: { dispose(): void }): void;
  }

  /** A webview session's context: one per trusted webview, recreated on each (re)load. */
  export interface WebviewContext {
    kind: "webview";
    /** The pane item model backing the webview. */
    item: unknown;
    /** The Electron `<webview>` element. */
    webview: unknown;
    /** The trusted `file://` URL currently loaded. */
    url: string;
    subscriptions: SessionSubscriptions;
  }

  /** A runner session's context: one per automation run, torn down with the run's socket. */
  export interface RunnerContext {
    kind: "runner";
    /** The run id the token was minted for. */
    runId: string;
    /** Absolute path of the running script. */
    scriptPath: string;
    /** The script's directory (the run's fs sandbox root). */
    scriptDir: string;
    /** The run's grants, from its permission header; `requires` is checked against them. */
    grants: Readonly<Record<string, unknown>>;
    subscriptions: SessionSubscriptions;
  }

  /** Per-session context passed to every capability factory, by the session's principal kind. */
  export type CapabilityContext = WebviewContext | RunnerContext;

  /**
   * What a factory returns: a bare FUNCTION for a directly-callable capability (`host.name(…)`),
   * or an `RpcTarget` for a namespace (`host.name.method(…)`). Built lazily once per session and
   * torn down with it.
   */
  export type Capability = ((...args: never[]) => unknown) | CapnwebRpcTarget;

  /** A capability factory for either kind of session. */
  export type CapabilityFactory = (ctx: CapabilityContext) => Capability;

  /** A capability only runs see. `requires` names a grant the run must hold for it to exist. */
  export interface RunnerCapabilityOptions {
    audience: ["runner"];
    requires?: string;
  }

  /** A capability only trusted webviews see: the default. */
  export interface WebviewCapabilityOptions {
    audience?: ["webview"];
  }

  /** A capability both kinds of session see. `requires` applies to runs only. */
  export interface SharedCapabilityOptions {
    audience: CapabilityAudience[];
    requires?: string;
  }

  /**
   * Register a host capability by name. Must run before a session of the target audience
   * connects. `options.audience` controls which principals see the capability; it defaults to
   * `["webview"]`, so runner exposure is always opt-in. The factory gets the context of the
   * sessions that can see it.
   */
  export function registerCapability(
    name: string,
    factory: (ctx: RunnerContext) => Capability,
    options: RunnerCapabilityOptions
  ): void;
  export function registerCapability(
    name: string,
    factory: (ctx: WebviewContext) => Capability,
    options?: WebviewCapabilityOptions
  ): void;
  export function registerCapability(
    name: string,
    factory: CapabilityFactory,
    options: SharedCapabilityOptions
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
    /** The run's grants; a runner-only capability with `requires` exists only when they hold it. */
    grants?: Readonly<Record<string, unknown>> | null;
    /** A debug run: the auth and time-to-live windows are widened while a breakpoint holds it. */
    debug?: boolean;
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
