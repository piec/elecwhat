import { app, BrowserWindow, session, Menu, Tray, ipcMain, nativeImage, shell, MenuItem, Notification } from "electron";
import { readFileSync } from "node:fs";
import path from "node:path";
import { addAboutMenuItem, isDebug, toggleVisibility, windowShow, getUrl, loadUrl } from "./util.mjs";
import { factory } from "electron-json-config";
import { debounce } from "lodash-es";
import pkg from "../package.json" with { type: "json" };
import * as os from "os";

const defaultKeys = {
  "A ArrowDown": {
    whatsappAction: "GO_TO_NEXT_CHAT",
  },
  "A ArrowUp": {
    whatsappAction: "GO_TO_PREV_CHAT",
  },
  "C Tab": {
    whatsappAction: "GO_TO_NEXT_CHAT",
  },
  "CS Tab": {
    whatsappAction: "GO_TO_PREV_CHAT",
  },
  "C u": {
    whatsappAction: "TOGGLE_UNREAD",
  },
  "C ArrowUp": {
    action: "EDIT_LAST_MESSAGE",
  },
};

function main() {
  // config file
  const config = factory(undefined, undefined, { prettyJson: { enabled: true } });

  const state = {
    notifPrefix: config.get("notification-prefix") ?? `${pkg.name} - `,
    showAtStartup: isDebug || config.get("show-at-startup", true),
    get windowBounds() {
      const bounds = config.get("window-bounds", { width: 1100, height: 800 });
      if (isDebug) {
        bounds.width += 1000;
      }
      return bounds;
    },
    get keys() {
      return { ...defaultKeys, ...config.get("keys", {}) };
    },
  };

  if (config.get("quit-on-close", false)) {
    state.showAtStartup = true;
  }

  const createWindow = async () => {
    // Detect preferred system languages
    const preferredLanguages = app.getPreferredSystemLanguages();
    console.log("Preferred system languages:", preferredLanguages);

    // Configure the spellchecker with detected languages
    session.defaultSession.setSpellCheckerLanguages(preferredLanguages);

    const mainWindow = new BrowserWindow({
      webPreferences: {
        preload: path.join(import.meta.dirname, "..", "src-web", "preload.js"),
        spellcheck: config.get("spellcheck", true),
      },
      show: state.showAtStartup,
      autoHideMenuBar: config.get("menu-bar-auto-hide", true),
      ...state.windowBounds,
    });

    if (!config.get("menu-bar", true)) {
      mainWindow.removeMenu();
    }

    if (isDebug || config.get("open-dev-tools", false)) {
      mainWindow.webContents.openDevTools();
    }

    // Sets the spellchecker langs (fallback if preferredLanguages is empty)
    const fallbackLangs = config.get("spellcheck-languages", ["en-US", "fr", "es-ES"]);
    const spellcheckLangs = preferredLanguages.length > 0 ? preferredLanguages : fallbackLangs;
    session.defaultSession.setSpellCheckerLanguages(spellcheckLangs);

    mainWindow.webContents.on("context-menu", (event, params) => {
      const menu = new Menu();

      let showmenu = false;
      // Add each spelling suggestion
      for (const suggestion of params.dictionarySuggestions) {
        menu.append(
          new MenuItem({
            label: suggestion,
            click: () => mainWindow.webContents.replaceMisspelling(suggestion),
          }),
        );
        showmenu = true;
      }

      // Allow users to add the misspelled word to the dictionary
      if (params.misspelledWord) {
        menu.append(
          new MenuItem({
            label: "Add to dictionary",
            click: () => mainWindow.webContents.session.addWordToSpellCheckerDictionary(params.misspelledWord),
          }),
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

    const saveBounds = () => {
      if (!isDebug) {
        config.set("window-bounds", mainWindow.getBounds());
      }
    };

    const debounced = debounce(saveBounds, 1000);
    mainWindow.on("move", debounced);
    mainWindow.on("resize", debounced);
    mainWindow.on("close", saveBounds);

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
      ipcMain.handle("notifyEv", (ev, argsJson) => {
        windowShow(mainWindow);
      });
      ipcMain.handle("open", (ev, url) => {
        console.log("url", url);
        shell.openExternal(url);
      });
      ipcMain.handle("stateGet", (ev, name) => {
        console.log("stateGet", name);
        return state[name];
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
      tray.setToolTip(pkg.name);
      tray.setContextMenu(contextMenu);
      tray.on("click", () => {
        toggleVisibility(mainWindow);
      });

      const notif = (options) => {
        const n = new Notification({
          title: pkg.name,
          ...options,
        });
        n.show();
        return n;
      };

      mainWindow.webContents.on("did-finish-load", async (ev) => {
        console.log("did-finish-load");

        for (const script of ["injected.js", "injected-edit.js"]) {
          try {
            const data = readFileSync(path.join(import.meta.dirname, "..", "src-web", script), "utf-8");
            // console.debug(`script=<<${data.split("\n")[0]}>>`);
            await mainWindow.webContents.executeJavaScript(data);
          } catch (err) {
            console.error("executeJavaScript", err);
          }
        }
        for (const css of config.get("css", [])) {
          try {
            let url = getUrl(css);
            let data = null;
            if (url) {
              data = await loadUrl(url);
            } else {
              data = css;
            }

            if (data) {
              mainWindow.webContents.insertCSS(data);
            }
          } catch (err) {
            console.error(`error inserting ${css}`, err);
          }
        }
      });

      mainWindow.webContents.on("page-favicon-updated", (ev, favicons) => {
        console.debug("page-favicon-updated");
        if (favicons.length > 0) {
          let lastFaviconUrl = favicons[favicons.length - 1];
          // larger images
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

      const url = config.get("url", "https://web.whatsapp.com/");
      mainWindow.webContents.on("did-fail-load", async (ev) => {
        console.log("did-fail-load");
        notif({
          body: "Failed to load",
        }).on("click", () => {
          windowShow(mainWindow);
        });

        setTimeout(
          () => {
            console.log("retry");
            mainWindow.webContents.loadURL(url);
          },
          config.get("retry-interval", 15000),
        );
      });

      if (isDebug) {
        mainWindow.webContents.loadFile("static/debug.html");
      } else {
        mainWindow.webContents.loadURL(url);
      }

      if (os.platform == "linux") {
        if (config.get("dbus", true)) {
          import("./main-dbus.mjs")
            .then((dbus) => {
              dbus.mainDbus(mainWindow);
            })
            .catch((err) => {
              console.error("dbus", err);
            });
        }
      }
    });

    return mainWindow;
  };

  app.setAboutPanelOptions({
    applicationName: pkg.name,
    applicationVersion: app.getVersion(),
    authors: [pkg?.author?.name],
    website: pkg?.homepage,
    // iconPath: "static/app.png", does not work when packaged
    copyright: pkg?.license,
  });
  // This method will be called when Electron has finished
  // initialization and is ready to create browser windows.
  // Some APIs can only be used after this event occurs.
  app.whenReady().then(async () => {
    let window = await createWindow();

    addAboutMenuItem();
    app.on("activate", async () => {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (BrowserWindow.getAllWindows().length === 0) {
        window = await createWindow();
      }
    });

    app.on("second-instance", (event, commandLine, workingDirectory, additionalData) => {
      console.log("second-instance", additionalData, commandLine);

      if (window) {
        if (commandLine.includes("--hide")) {
          window.hide();
        } else if (commandLine.includes("--toggle")) {
          if (window.isVisible()) {
            window.hide();
          } else {
            windowShow(window);
          }
        } else if (commandLine.includes("--quit")) {
          app.quit();
        } else {
          // --show
          windowShow(window);
        }
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
}

const gotTheLock = app.requestSingleInstanceLock({ name: pkg.name });

if (!gotTheLock) {
  console.log("already running, raised the main window");
  app.quit();
} else {
  main();
}
