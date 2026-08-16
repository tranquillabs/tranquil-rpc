// Capability registry — the extensible host-capability surface.
//
// `registerCapability(name, factory, options)` records a factory keyed by name, tagged with the
// audiences allowed to see it. `buildHostApi(ctx)` returns a fresh per-session RpcTarget exposing
// exactly the registered capabilities whose audience includes the session's principal kind —
// `ctx.kind`: "webview" (trusted page guests, the default) or "runner" (local automation
// subprocesses authenticated by run token). Audience defaults to ["webview"] so existing callers
// are unaffected and runner exposure is always opt-in.
//
// Capnweb refuses to expose an RpcTarget's own instance properties (to avoid leaking internals) —
// only methods/getters on the prototype chain are reachable over RPC. So each capability is
// installed as a getter on a per-session prototype (chained to RpcTarget.prototype). The getter's
// value is `factory(ctx)`:
//   - return a function       → callable directly:  host.notify(msg)
//   - return an RpcTarget      → a namespace:        host.paneControls.register([...])
// Values are built lazily and cached per session, so each capability object is created once and
// torn down with its session.
import { RpcTarget } from "capnweb";

const factories = new Map(); // name → { factory, audience }

// `options.requires` names a grant a runner must hold for this capability to exist at all —
// `browser`, `clipboard`. Unset means "no grant needed". Webview sessions are unaffected: they
// carry no grants and are governed by trust roots instead.
export function registerCapability(name, factory, options) {
  if (typeof name !== "string" || name.length === 0) {
    throw new Error("registerCapability: name must be a non-empty string");
  }
  if (typeof factory !== "function") {
    throw new Error(`registerCapability: factory for "${name}" must be a function`);
  }
  const audience = (options && options.audience) || ["webview"];
  if (
    !Array.isArray(audience) ||
    audience.length === 0 ||
    audience.some((a) => a !== "webview" && a !== "runner")
  ) {
    throw new Error(
      `registerCapability: audience for "${name}" must be a non-empty array of "webview" | "runner"`
    );
  }
  const requires = (options && options.requires) || null;
  if (requires != null && typeof requires !== "string") {
    throw new Error(`registerCapability: requires for "${name}" must be a string`);
  }
  factories.set(name, { factory, audience, requires });
}

export function hasCapabilities() {
  return factories.size > 0;
}

export function capabilityNames() {
  return [...factories.keys()];
}

// Build the per-session HostApi. `ctx` (e.g. { kind, item, webview, url, grants }) is passed to
// each factory; a capability is exposed only when its audience includes ctx.kind AND, for runner
// sessions, the run holds any grant the capability requires.
export function buildHostApi(ctx) {
  const kind = (ctx && ctx.kind) || "webview";
  const proto = Object.create(RpcTarget.prototype);
  const cache = new Map();
  for (const [name, { factory, audience, requires }] of factories) {
    if (!audience.includes(kind)) continue;
    // Gated capability: omitted entirely when the run did not ask for it, so an ungranted
    // script sees no such property rather than a method that refuses. There is nothing to
    // probe for and nothing to call.
    if (requires && kind === "runner" && !(ctx && ctx.grants && ctx.grants[requires])) continue;
    Object.defineProperty(proto, name, {
      configurable: true,
      enumerable: false,
      get() {
        if (!cache.has(name)) cache.set(name, factory(ctx));
        return cache.get(name);
      },
    });
  }
  return Object.create(proto);
}
