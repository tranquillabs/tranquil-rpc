// tranquil-rpc host entry — bundled to dist/host.js (the package "main").
//
// Exposes three things from one module:
//   - the dev-package lifecycle: activate / deactivate
//   - the service provider: provideRpc (see package.json providedServices)
//   - the direct API for owned consumers that require("tranquil-rpc"):
//       registerCapability, addTrustedRoot, isTrusted
// Registry and trust are module singletons inside the bundle, so both the service and require()
// share the same state.
export { activate, deactivate } from "./host.js";
export { registerCapability } from "./registry.js";
export { addTrustedRoot, isTrusted } from "./trust.js";

import { registerCapability } from "./registry.js";
import { addTrustedRoot, isTrusted } from "./trust.js";

export function provideRpc() {
  return { registerCapability, addTrustedRoot, isTrusted };
}
