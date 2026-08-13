// WebSocket leg of the Cap'n Web transport — the runner bridge's wire. Works over both a
// server-side `ws` socket (Node EventEmitter shape, host renderer) and a standard WebSocket
// (EventTarget shape, the Deno child mirrors this in deno/transport.ts).
//
// Control frames: a frame that is exactly "CANCEL" is routed to `onControl` instead of the RPC
// queue. Cap'n Web frames at encodingLevel "string" are JSON arrays, so plain-word control frames
// can never collide with protocol traffic.
import { makeQueue } from "./queue.js";

export function wsTransport(socket, { onControl } = {}) {
  const q = makeQueue();

  const handle = (data) => {
    const text = typeof data === "string" ? data : data.toString();
    if (text === "CANCEL") {
      if (onControl) onControl(text);
      return;
    }
    q.push(text);
  };

  let dispose;
  if (typeof socket.on === "function") {
    // Server-side `ws` socket.
    const onMessage = (data) => handle(data);
    const onClose = () => q.fail(new Error("socket closed"));
    socket.on("message", onMessage);
    socket.on("close", onClose);
    dispose = () => {
      socket.off("message", onMessage);
      socket.off("close", onClose);
    };
  } else {
    // Standard WebSocket.
    const onMessage = (e) => handle(e.data);
    const onClose = () => q.fail(new Error("socket closed"));
    socket.addEventListener("message", onMessage);
    socket.addEventListener("close", onClose);
    dispose = () => {
      socket.removeEventListener("message", onMessage);
      socket.removeEventListener("close", onClose);
    };
  }

  return {
    encodingLevel: "string",
    send: (msg) => {
      socket.send(msg);
    },
    receive: () => q.pull(),
    abort: (reason) => {
      dispose();
      q.fail(reason instanceof Error ? reason : new Error(String(reason)));
    },
    dispose,
  };
}
