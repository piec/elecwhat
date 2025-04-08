// https://github.com/sidorares/dbus-native/blob/master/examples/basic-service.js
// const dbus = require("dbus-native");
import dbus from "@httptoolkit/dbus-native";
import { toggleVisibility, windowShow } from "./util.mjs";
import { app } from "electron";

const serviceName = "fr.carru.elecwhat"; // our DBus service name
const interfaceName = serviceName;
const objectPath = `/${serviceName.replace(/\./g, "/")}`;
const sessionBus = dbus.sessionBus();

export const mainDbus = (window) => {
  if (!sessionBus) {
    console.error("not connected to dbus");
    return;
  }

  /*
  Then request our service name to the bus.
  The 0x4 flag means that we don't want to be queued if the service name we are requesting is already
  owned by another service ;we want to fail instead.
  */
  sessionBus.requestName(serviceName, 0x4, (err, retCode) => {
    // If there was an error, warn user and fail
    if (err) {
      console.error(`dbus: could not request service name "${serviceName}", error: ${err}`);
    }

    // Return code 0x1 means we successfully had the name
    if (retCode === 1) {
      console.log(`dbus: successfully requested service name "${serviceName}"`);
      proceed();
    } else {
      // Other return codes means various errors, check here
      // (https://dbus.freedesktop.org/doc/api/html/group__DBusShared.html#ga37a9bc7c6eb11d212bf8d5e5ff3b50f9) for more
      // information
      console.error(`dbus: failed to request service name "${serviceName}", code="${retCode}"`);
    }
  });

  // Function called when we have successfully got the service name we wanted
  function proceed() {
    var ifaceDesc = {
      name: interfaceName,
      methods: {
        Show: ["", ""],
        Hide: ["", ""],
        ToggleVisibility: ["", "b"],
        Visible: ["", "b"],
        Quit: ["", ""],
      },
    };

    const iface = {
      Show: function () {
        windowShow(window);
      },
      Hide: function () {
        window.hide();
      },
      Visible: function () {
        return window.isVisible();
      },
      ToggleVisibility: function () {
        return toggleVisibility(window);
      },
      Quit: function () {
        app.quit();
      },
    };

    // Now we need to actually export our interface on our object
    sessionBus.exportInterface(iface, objectPath, ifaceDesc);

    // Say our service is ready to receive function calls (you can use `gdbus call` to make function calls)
    console.log("dbus: ready");
  }
};
