// Trust classifier — SECURITY CRITICAL, default-deny.
//
// A URL is trusted ONLY if it is a file:// URL whose resolved filesystem path is at, or under,
// a registered trusted root. Every other scheme — http, https, data, blob, about, … — is NEVER
// trusted. Trusted pages get the injected guest runtime + the full HostApi; untrusted pages get
// nothing at all (see host.js). A bug here would hand host capabilities to hostile remote pages,
// so the matching is deliberately strict: exact path or a real child path segment (no bare string
// prefixes, so `/x/mockups` never matches `/x/mockups-evil`).
import path from "path";
import { fileURLToPath } from "url";

const roots = new Set();

// Normalize a filesystem path or a file:// URL to an absolute fs path with no trailing separator.
// Returns null for anything we can't resolve to a path.
function toRootPath(input) {
  if (typeof input !== "string" || input.length === 0) return null;
  let abs;
  try {
    abs = input.startsWith("file://") ? fileURLToPath(input) : path.resolve(input);
  } catch (e) {
    return null;
  }
  return abs.replace(/[\\/]+$/, "");
}

// Register a trusted root. Accepts a filesystem path (e.g. a package's mockups dir) or a file://
// URL. Returns the normalized root path, or null if it couldn't be resolved.
export function addTrustedRoot(input) {
  const root = toRootPath(input);
  // Log at the moment a root is actually registered — the security-relevant event, and rare
  // enough to be worth a line. Registration happens after activate(), so reporting the set at
  // activation time only ever showed an empty list.
  if (root && !roots.has(root)) console.log("[tranquil-rpc]", "trusted root registered:", root);
  if (root) roots.add(root);
  return root;
}

// Default-deny trust check. Only file:// under a registered root is trusted.
export function isTrusted(url) {
  if (typeof url !== "string" || url.length === 0) return false;

  let parsed;
  try {
    parsed = new URL(url);
  } catch (e) {
    return false; // unparseable
  }
  if (parsed.protocol !== "file:") return false; // never trust non-file schemes

  let filePath;
  try {
    parsed.search = "";
    parsed.hash = "";
    filePath = fileURLToPath(parsed);
  } catch (e) {
    return false;
  }

  const normalized = filePath.replace(/[\\/]+$/, "");
  for (const root of roots) {
    if (normalized === root || normalized.startsWith(root + path.sep)) return true;
  }
  return false;
}

// Introspection (logging / tests). Returns a copy.
export function trustedRoots() {
  return [...roots];
}
