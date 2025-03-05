const { contextBridge, ipcRenderer } = require("electron");

// const { isDebug } = require("../src/util.mjs");
const isDebug = process?.env?.DEBUG == 1;

contextBridge.exposeInMainWorld("ipc", {
  debug: isDebug,
  notify: (args) => ipcRenderer.invoke("notify", args),
  notifyEv: (args) => ipcRenderer.invoke("notifyEv", args),
  open: (url) => ipcRenderer.invoke("open", url),
  ...(isDebug && {
    ping: () => ipcRenderer.invoke("ping"),
  }),
});
