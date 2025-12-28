const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");

let win; // объявляем глобально

function createWindow() {
  win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 500,
    minHeight: 400,

    icon: path.join(__dirname, "icon.png"),
    backgroundColor: "#121212",

    // минималистичное окно
    frame: false,
    titleBarStyle: "hidden",

    resizable: true,
    maximizable: true, // разрешаем максимизацию

    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false,
    },
  });

  win.loadFile("index.html");

  // Чтобы при закрытии очистить ссылку
  win.on("closed", () => {
    win = null;
  });
}

/* ===== Управление окном ===== */
ipcMain.on("win-minimize", () => {
  if (win) win.minimize();
});

ipcMain.on("win-close", () => {
  if (win) win.close();
});

ipcMain.on("win-toggle-maximize", () => {
  if (win) {
    if (win.isMaximized()) {
      win.unmaximize();
    } else {
      win.maximize();
    }
  }
});

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
