const { app, BrowserWindow, session, Menu, MenuItem, Tray, Notification, ipcMain, nativeImage } = require("electron");
const { readFileSync } = require("node:fs");
const path = require("node:path");

const createWindow = async () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });

  session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
    details.requestHeaders["User-Agent"] =
      "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
    callback({ cancel: false, requestHeaders: details.requestHeaders });
  });

  // mainWindow.loadFile("index.html");
  mainWindow.loadURL("https://web.whatsapp.com/");

  try {
    const data = readFileSync("renderer.js", "utf-8");
    console.log("script=", data);
    await mainWindow.webContents.executeJavaScript(data);
  } catch (err) {
    console.error("executeJavaScript", err);
  }

  mainWindow.on("close", function (event) {
    console.log(`close ${app.isQuiting}`);
    if (!app.isQuiting) {
      event.preventDefault();
      mainWindow.hide();
      // event.returnValue = false;
    }
  });

  app.on("before-quit", function () {
    console.log("before-quit");
    app.isQuiting = true;
  });

  app.whenReady().then(() => {
    ipcMain.handle("ping", () => "pong");
    ipcMain.handle("notify", (ev, argsJson) => {
      const args = JSON.parse(argsJson);
      // console.log("notify", args);
    });
    ipcMain.handle("notifyEv", (ev, argsJson) => {
      const args = JSON.parse(argsJson);
      // console.log("notifyEv", args);
      mainWindow.show();
    });

    const tray = new Tray("app.png");
    const contextMenu = Menu.buildFromTemplate([
      { label: "Item1", type: "radio" },
      {
        label: "Item2",
        type: "radio",
        click: () => {
          const NOTIFICATION_TITLE = "Basic Notification";
          const NOTIFICATION_BODY = "Notification from the Main process";

          new Notification({
            title: NOTIFICATION_TITLE,
            body: NOTIFICATION_BODY,
          }).show();
        },
      },
      { label: "Item3", type: "radio", checked: true },
      {
        label: "Quit",
        type: "normal",
        click: () => {
          console.log("quit");
          app.isQuiting = true;
          app.quit();
        },
      },
    ]);
    tray.setToolTip("This is my application.");
    tray.setContextMenu(contextMenu);
    tray.on("click", () => {
      if (mainWindow.isVisible()) {
        mainWindow.hide();
      } else {
        mainWindow.show();
      }
    });

    mainWindow.webContents.on("page-favicon-updated", (ev, favicons) => {
      console.log("favicons", favicons);
      if (favicons.length > 0) {
        const lastFaviconUrl = favicons[favicons.length - 1];
        const re = /https:\/\/(static\.whatsapp\.net|web\.whatsapp\.com)\//;

        if (lastFaviconUrl && re.test(lastFaviconUrl)) {
          fetch(lastFaviconUrl).then((r) => {
            r.arrayBuffer().then((ab) => {
              const img = nativeImage.createFromBuffer(Buffer.from(ab));
              tray.setImage(img);
            });
          });
        }
      }
    });

    mainWindow.webContents.openDevTools();
  });

  // Open the DevTools.
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  console.log("window-all-closed");
  if (process.platform !== "darwin") app.quit();
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
