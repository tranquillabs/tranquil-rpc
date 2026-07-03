// Host side of the Cap'n Web transport: rides the Electron <webview> element.
//   send    → webview.send(CHANNEL, msg)        (delivered to guest ipcRenderer)
//   receive → 'ipc-message' events from the guest's ipcRenderer.sendToHost
import { CHANNEL } from "./channel.js";
import { makeQueue } from "./queue.js";

export function hostTransport(webview) {
  const q = makeQueue();
  const onMessage = (e) => {
    if (e.channel === CHANNEL) q.push(e.args[0]);
  };
  webview.addEventListener("ipc-message", onMessage);

  const dispose = () => webview.removeEventListener("ipc-message", onMessage);

  return {
    encodingLevel: "string",
    send: (msg) => {
      webview.send(CHANNEL, msg);
    },
    receive: () => q.pull(),
    abort: (reason) => {
      dispose();
      q.fail(reason instanceof Error ? reason : new Error(String(reason)));
    },
    dispose,
  };
}
