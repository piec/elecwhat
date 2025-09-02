const { contextBridge, ipcRenderer, webFrame } = require("electron");

// const { isDebug } = require("../src/util.mjs");
const isDebug = process?.env?.DEBUG == 1;

contextBridge.exposeInMainWorld("ipc", {
  debug: isDebug,
  notifyEv: (args) => ipcRenderer.invoke("notifyEv", args),
  open: (url) => ipcRenderer.invoke("open", url),
  stateGet: (name) => ipcRenderer.invoke("stateGet", name),
  ...(isDebug && {
    ping: () => ipcRenderer.invoke("ping"),
  }),
});

webFrame.setVisualZoomLevelLimits(1, 3);
