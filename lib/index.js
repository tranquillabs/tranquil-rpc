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
export {
  ensureRunnerServer,
  mintRunToken,
  sendCancel,
  endRun,
  closeRunnerServer,
} from "./runner-host.js";
// Re-export RpcTarget so owned consumers subclass the SAME class the host bundle uses — capnweb
// detects capabilities with `instanceof RpcTarget`, and a separately-required copy would be a
// different class (capnweb isn't resolvable from consumer repos anyway; it's bundled in here).
export { RpcTarget } from "capnweb";

import { registerCapability } from "./registry.js";
import { addTrustedRoot, isTrusted } from "./trust.js";
import { ensureRunnerServer, mintRunToken, sendCancel, endRun } from "./runner-host.js";
import { RpcTarget } from "capnweb";

export function provideRpc() {
  return {
    registerCapability,
    addTrustedRoot,
    isTrusted,
    RpcTarget,
    ensureRunnerServer,
    mintRunToken,
    sendCancel,
    endRun,
  };
}
