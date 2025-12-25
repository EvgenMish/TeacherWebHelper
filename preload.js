const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("windowAPI", {
  minimize: () => ipcRenderer.send("win-minimize"),
  close: () => ipcRenderer.send("win-close"),
  toggleMaximize: () => ipcRenderer.send("win-toggle-maximize"), // новая кнопка
});

window.addEventListener("DOMContentLoaded", () => {
  const titlebarHTML = `
    <div class="titlebar">
      <button onclick="windowAPI.minimize()">—</button>
      <button onclick="windowAPI.toggleMaximize()">▢</button>
      <button onclick="windowAPI.close()">×</button>
    </div>
  `;
  document.body.insertAdjacentHTML("afterbegin", titlebarHTML);
});
