// Guest side of the Cap'n Web transport: runs in the page main world and rides the
// preload's window.electron contextBridge (already exposed by tranquil-browser).
//   send    → window.electron.sendToHost(CHANNEL, msg)  (delivered to host webview 'ipc-message')
//   receive → ipcRenderer.on(CHANNEL) via window.electron.receive
import { CHANNEL } from "./channel.js";
import { makeQueue } from "./queue.js";

export function guestTransport() {
  const q = makeQueue();
  window.electron.receive(CHANNEL, (msg) => q.push(msg));
  return {
    encodingLevel: "string",
    send: (msg) => window.electron.sendToHost(CHANNEL, msg),
    receive: () => q.pull(),
  };
}
