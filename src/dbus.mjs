import dbus from "@homebridge/dbus-native";
import * as os from "node:os";
import { app } from "electron";
import { toggleVisibility, windowShow } from "./util.mjs";

const SERVICE_NAME = 'fr.carru.elecwhat';
const OBJECT_PATH = '/' + SERVICE_NAME.replaceAll('.', '/');

export class Dbus {
  sessionBus = null;
  window = null;
  serialCounter = 0;

  constructor() {
    if(os.platform() !== 'linux') {
      return;
    }

    try {
      this.sessionBus = dbus.sessionBus();
    } catch (err) {
      this.sessionBus = null;
    }

    if (!this.sessionBus) {
      console.error("DBus: not connected to session bus");
      return;
    }
    this.sessionBus.requestName(SERVICE_NAME, 0x4, (err, retCode) => {
      if (err) {
        console.error("Error DBus:", err);
        return;
      }

      if (retCode !== 1) {
        return;
      }

      this.sessionBus?.exportInterface({
        Show: () => { if(this.window) windowShow(this.window); },
        Hide: () => { this.window?.hide(); },
        Visible: () => { return this.window?.isVisible() ?? false; },
        ToggleVisibility: () => { if (this.window) return toggleVisibility(this.window); else return false; },
        Quit: () => { app.quit(); },
      }, OBJECT_PATH, {
        name: SERVICE_NAME,
        methods: {
          Show: ["", ""],
          Hide: ["", ""],
          ToggleVisibility: ["", "b"],
          Visible: ["", "b"],
          Quit: ["", ""],
        },
      });

      console.log("DBus registered:", SERVICE_NAME);
    });
  }

  setBadgeCount(number) {
    // https://wiki.ubuntu.com/Unity/LauncherAPI
    // gnome dash-to-dock: https://github.com/micheleg/dash-to-dock/blob/b96a003bec758fc35efb0f4e5134030a921c418b/launcherAPI.js#L14-L21
    // kde plasma: https://github.com/KDE/plasma-desktop/commit/e284e9dc17051f22d05985e218fa44ddaba78de5
    this.sessionBus?.connection.message({
      type: dbus.messageType.signal,
      serial: ++this.serialCounter,
      path: "/",
      interface: "com.canonical.Unity.LauncherEntry",
      member: "Update",
      signature: "sa{sv}",
      body: [
        "application://elecwhat.desktop",
        [
          ["count", ["x", number]],
          ["count-visible", ["b", number !== 0]]
        ]
      ]
    });
  }

  end() {
    this.sessionBus?.connection.end();
  }
}
