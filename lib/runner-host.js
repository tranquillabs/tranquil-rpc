// Runner bridge — the WebSocket server, token table, and per-run session lifecycle for the
// "runner" principal (ADR-0022): a local Deno automation subprocess authenticating with a
// one-time run token.
//
// SECURITY CRITICAL — same review discipline as trust.js. Invariants:
//   - tokens are single-use: claimed (deleted) on first presentation, valid or not the socket
//     outcome; a second connection with the same token is refused
//   - tokens are delivered to the child via env only, never in URLs
//   - an unclaimed token expires after 60 s
//   - the first frame on a connection MUST be exactly "AUTH <token>" within 3 s, or the socket
//     closes (code 4001); no frame reaches the RPC layer before auth succeeds
//   - the server binds 127.0.0.1 on an ephemeral port; the same-user boundary is explicitly
//     out of scope (see the security review in the website dev docs)
import crypto from "crypto";
import { WebSocketServer } from "ws";
import { RpcSession } from "capnweb";
import { CompositeDisposable } from "atom";
import { wsTransport } from "./transport-ws.js";
import { buildHostApi } from "./registry.js";

const TAG = "[tranquil-rpc runner]";

const AUTH_TIMEOUT_MS = 3000;
const TOKEN_TTL_MS = 60_000;

let server = null; // WebSocketServer
let serverPort = null;
const tokens = new Map(); // token → { runId, scriptPath, scriptDir, timer }
const sessions = new Map(); // runId → { socket, transport, subscriptions }

function refuse(socket, why) {
  console.warn(TAG, "auth refused:", why);
  try {
    socket.close(4001, why);
  } catch (e) {
    /* ignore */
  }
}

function handleConnection(socket) {
  let authed = false;
  const authTimer = setTimeout(() => {
    if (!authed) refuse(socket, "auth timeout");
  }, AUTH_TIMEOUT_MS);

  const onAuthMessage = (data) => {
    if (authed) return; // transport owns the socket now; listener removal is in flight
    clearTimeout(authTimer);

    const text = typeof data === "string" ? data : data.toString();
    if (!text.startsWith("AUTH ")) {
      refuse(socket, "first frame was not AUTH");
      return;
    }
    const token = text.slice(5);
    const meta = tokens.get(token);
    if (meta) {
      clearTimeout(meta.timer);
      tokens.delete(token); // single-use: claimed now, regardless of what follows
    }
    if (!meta) {
      refuse(socket, "unknown or already-used token");
      return;
    }

    authed = true;
    socket.off("message", onAuthMessage);

    const { runId, scriptPath, scriptDir } = meta;
    const subscriptions = new CompositeDisposable();
    const transport = wsTransport(socket);
    const session = new RpcSession(
      transport,
      buildHostApi({ kind: "runner", runId, scriptPath, scriptDir, subscriptions })
    );
    sessions.set(runId, { socket, transport, session, subscriptions });

    socket.on("close", () => {
      const s = sessions.get(runId);
      if (!s || s.socket !== socket) return;
      sessions.delete(runId);
      try {
        s.transport.abort(new Error("runner socket closed"));
      } catch (e) {
        /* ignore */
      }
      try {
        s.subscriptions.dispose();
      } catch (e) {
        /* ignore */
      }
      console.log(TAG, "session closed:", runId);
    });

    socket.send("AUTH OK");
    console.log(TAG, "session established:", runId, scriptPath);
  };

  socket.on("message", onAuthMessage);
  socket.on("close", () => clearTimeout(authTimer));
}

// Lazily start (or return) the per-window runner server. Resolves { port }.
export function ensureRunnerServer() {
  if (server && serverPort != null) return Promise.resolve({ port: serverPort });
  return new Promise((resolve, reject) => {
    const wss = new WebSocketServer({ host: "127.0.0.1", port: 0 });
    wss.on("listening", () => {
      server = wss;
      serverPort = wss.address().port;
      console.log(TAG, "listening on 127.0.0.1:" + serverPort);
      resolve({ port: serverPort });
    });
    wss.on("error", (err) => {
      if (server !== wss) reject(err);
      else console.error(TAG, "server error:", err);
    });
    wss.on("connection", handleConnection);
  });
}

// Mint a one-time token for a run about to spawn. Deliver via env only.
export function mintRunToken({ runId, scriptPath, scriptDir }) {
  if (!runId) throw new Error("mintRunToken: runId is required");
  const token = crypto.randomBytes(32).toString("hex");
  const timer = setTimeout(() => tokens.delete(token), TOKEN_TTL_MS);
  tokens.set(token, { runId, scriptPath, scriptDir, timer });
  return token;
}

// Send the protocol-level cancel frame on a run's authed socket. Returns false if none.
export function sendCancel(runId) {
  const s = sessions.get(runId);
  if (!s) return false;
  try {
    s.socket.send("CANCEL");
    return true;
  } catch (e) {
    return false;
  }
}

// Run ended (exit, kill, or timeout): close its socket and invalidate any unclaimed token.
export function endRun(runId) {
  for (const [token, meta] of tokens) {
    if (meta.runId === runId) {
      clearTimeout(meta.timer);
      tokens.delete(token);
    }
  }
  const s = sessions.get(runId);
  if (s) {
    try {
      s.socket.close(1000, "run ended");
    } catch (e) {
      /* ignore */
    }
  }
}

export function closeRunnerServer() {
  for (const [runId] of sessions) endRun(runId);
  for (const [, meta] of tokens) clearTimeout(meta.timer);
  tokens.clear();
  if (server) {
    try {
      server.close();
    } catch (e) {
      /* ignore */
    }
    server = null;
    serverPort = null;
  }
}
