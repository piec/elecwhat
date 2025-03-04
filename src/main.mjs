import { app, BrowserWindow, session, Menu, Tray, ipcMain, nativeImage, shell, MenuItem } from "electron";
import { readFileSync } from "node:fs";
import path from "node:path";
import { mainDbus, showIfRunning } from "./main-dbus.mjs";
import { isDebug, toggleVisibility } from "./util.mjs";
import { factory } from "electron-json-config";
import { debounce } from "lodash-es";

const config = factory(undefined, undefined, { prettyJson: { enabled: true } });

if (config.get("quit-on-close", false)) {
  config.set("show-at-startup", true);
}

const alreadyRunning = await showIfRunning();
if (alreadyRunning) {
  console.log("already running");
  app.quit();
} else {
  const createWindow = async () => {
    // Create the browser window.
    const mainWindow = new BrowserWindow({
      webPreferences: {
        preload: path.join(import.meta.dirname, "..", "src-web", "preload.js"),
        spellcheck: true,
      },
      show: isDebug || config.get("show-at-startup", true),
      ...config.get("window-bounds", { width: 1100, height: 800 }),
    });

    if (config.get("open-dev-tools", false)) {
      mainWindow.webContents.openDevTools();
    }

    // Sets the spellchecker langs
    const lang = config.get("spellcheck-languages", ["en-US", "fr"]);
    session.defaultSession.setSpellCheckerLanguages(lang);

    mainWindow.webContents.on("context-menu", (event, params) => {
      const menu = new Menu();

      let showmenu = false;
      // Add each spelling suggestion
      for (const suggestion of params.dictionarySuggestions) {
        menu.append(
          new MenuItem({
            label: suggestion,
            click: () => mainWindow.webContents.replaceMisspelling(suggestion),
          })
        );
        showmenu = true;
      }

      // Allow users to add the misspelled word to the dictionary
      if (params.misspelledWord) {
        menu.append(
          new MenuItem({
            label: "Add to dictionary",
            click: () => mainWindow.webContents.session.addWordToSpellCheckerDictionary(params.misspelledWord),
          })
        );
        showmenu = true;
      }

      if (showmenu) {
        menu.popup();
      }
    });

    session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
      const defaultUserAgent =
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

      details.requestHeaders["User-Agent"] = config.get("user-agent", defaultUserAgent);
      callback({ cancel: false, requestHeaders: details.requestHeaders });
    });

    const windowMovedResized = () => {
      config.set("window-bounds", mainWindow.getBounds());
    };

    const debounced = debounce(windowMovedResized, 1000);
    mainWindow.on("move", debounced);
    mainWindow.on("resize", debounced);
    mainWindow.on("close", windowMovedResized);

    mainWindow.on("close", function (event) {
      if (config.get("quit-on-close", false)) {
        app.quit();
      } else {
        console.log(`close ${app.isQuiting}`);
        if (!app.isQuiting) {
          event.preventDefault();
          mainWindow.hide();
          // event.returnValue = false;
        }
      }
    });

    app.on("before-quit", function () {
      console.log("before-quit");
      app.isQuiting = true;
    });

    app.whenReady().then(() => {
      if (isDebug) {
        ipcMain.handle("ping", () => "pong");
      }
      ipcMain.handle("notify", (ev, argsJson) => {
        const args = JSON.parse(argsJson);
        // console.log("notify", args);
      });
      ipcMain.handle("notifyEv", (ev, argsJson) => {
        // const args = JSON.parse(argsJson);
        // console.log("notifyEv", args);
        mainWindow.show();
      });
      ipcMain.handle("open", (ev, url) => {
        console.log("url", url);
        shell.openExternal(url);
      });

      const tray = new Tray(path.join(import.meta.dirname, "..", "static", "app.png"));
      const contextMenu = Menu.buildFromTemplate([
        {
          label: "Show/Hide",
          type: "normal",
          click: () => {
            toggleVisibility(mainWindow);
          },
        },
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
      tray.setToolTip("elecwhat");
      tray.setContextMenu(contextMenu);
      tray.on("click", () => {
        toggleVisibility(mainWindow);
      });

      mainWindow.webContents.on("did-finish-load", async (ev) => {
        console.log("did-finish-load");
        try {
          const data = readFileSync(path.join(import.meta.dirname, "..", "src-web", "injected.js"), "utf-8");
          console.log(`script=<<${data.split("\n")[0]}>>`);
          await mainWindow.webContents.executeJavaScript(data);
        } catch (err) {
          console.error("executeJavaScript", err);
        }
      });

      mainWindow.webContents.on("page-favicon-updated", (ev, favicons) => {
        console.debug("page-favicon-updated");
        if (favicons.length > 0) {
          let lastFaviconUrl = favicons[favicons.length - 1];
          lastFaviconUrl = lastFaviconUrl.replace("/1x/", "/2x/");
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

      const url = "https://web.whatsapp.com/";
      mainWindow.webContents.on("did-fail-load", async (ev) => {
        console.log("did-fail-load");
        setTimeout(() => {
          console.log("retry");
          mainWindow.webContents.loadURL(url);
        }, config.get("retry-interval", 15000));
      });

      if (isDebug) {
        mainWindow.webContents.loadFile("static/debug.html");
      } else {
        mainWindow.webContents.loadURL(url);
      }

      mainDbus(mainWindow);
    });
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
}
