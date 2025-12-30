console.log("Preload loaded");

const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("windowAPI", {
  minimize: () => ipcRenderer.send("win-minimize"),
  close: () => ipcRenderer.send("win-close"),
  toggleMaximize: () => ipcRenderer.send("win-toggle-maximize"),
});
