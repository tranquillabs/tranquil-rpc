// Capability registry — the extensible host-capability surface.
//
// `registerCapability(name, factory)` records a factory keyed by name. `buildHostApi(ctx)` returns
// a fresh per-session RpcTarget exposing exactly the registered capabilities and nothing else.
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

const factories = new Map();

export function registerCapability(name, factory) {
  if (typeof name !== "string" || name.length === 0) {
    throw new Error("registerCapability: name must be a non-empty string");
  }
  if (typeof factory !== "function") {
    throw new Error(`registerCapability: factory for "${name}" must be a function`);
  }
  factories.set(name, factory);
}

export function hasCapabilities() {
  return factories.size > 0;
}

export function capabilityNames() {
  return [...factories.keys()];
}

// Build the per-session HostApi. `ctx` (e.g. { item, webview, url }) is passed to each factory.
export function buildHostApi(ctx) {
  const proto = Object.create(RpcTarget.prototype);
  const cache = new Map();
  for (const [name, factory] of factories) {
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
