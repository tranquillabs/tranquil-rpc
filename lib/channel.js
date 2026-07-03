// Single IPC channel that carries Cap'n Web's JSON transport messages both ways
// (guest → host via ipcRenderer.sendToHost; host → guest via webview.send).
export const CHANNEL = "tranquil:rpc";
