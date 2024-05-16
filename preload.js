const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("rpc", {
  node: () => process.versions.node,
  chrome: () => process.versions.chrome,
  electron: () => process.versions.electron,
  ping: () => ipcRenderer.invoke("ping"),
  notify: (args) => ipcRenderer.invoke("notify", args),
  notifyEv: (args) => ipcRenderer.invoke("notifyEv", args),
  open: (url) => ipcRenderer.invoke("open", url),
  // we can also expose variables, not just functions
});
