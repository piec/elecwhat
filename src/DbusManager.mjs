import dbus from "@homebridge/dbus-native";
import * as os from "node:os";
import { app } from "electron";
import { toggleVisibility, windowShow } from "./util.mjs";

const SERVICE_NAME = 'fr.carru.elecwhat';
const OBJECT_PATH = '/' + SERVICE_NAME.replaceAll('.', '/');

export class DbusManager {
  sessionBus = null;

  constructor() {
    if(os.platform() !== 'linux') {
      return;
    }

    this.sessionBus = dbus.sessionBus();
    this.sessionBus.requestName(SERVICE_NAME, 0x4, (err, retCode) => {
      if (err) {
        console.error("Error DBus:", err);
        return;
      }

      if (retCode !== 1) {
        return;
      }

      this.sessionBus.exportInterface({
        Show() { windowShow(window); },
        Hide() { window.hide(); },
        Visible() { return window.isVisible(); },
        ToggleVisibility() { return toggleVisibility(window); },
        Quit() { app.quit(); },
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
    if(!this.sessionBus) {
      return;
    }

    this.sessionBus.connection.message({
      type: dbus.messageType.signal,
      serial: 1,
      path: "/",
      interface: "com.canonical.Unity.LauncherEntry",
      member: "Update",
      signature: "sa{sv}",
      body: [
        "application://WhatsApp.desktop",
        [
          ["count", ["x", number]],
          ["count-visible", ["b", number !== 0]]
        ]
      ]
    });
  }

  end() {
    if(!this.sessionBus) {
      return;
    }

    this.sessionBus.connection.end();
  }
}
