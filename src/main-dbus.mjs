// https://github.com/sidorares/dbus-native/blob/master/examples/basic-service.js
// const dbus = require("dbus-native");
import dbus from "@httptoolkit/dbus-native";
import { toggleVisibility } from "./util.mjs";
import { promisify } from "util";

const serviceName = "fr.carru.elecwhat"; // our DBus service name
const interfaceName = serviceName;
const objectPath = `/${serviceName.replace(/\./g, "/")}`;
const sessionBus = dbus.sessionBus();

export async function showIfRunning() {
  console.log("showIfRunning");
  if (!sessionBus) {
    console.error("not connected to dbus");
    return false;
  }

  const timeout = setTimeout(() => {
    console.log("dbus show timeout");
    process.exit();
  }, 2000);

  const service = sessionBus.getService(serviceName);
  if (!service) {
    console.info("!service");
    return false;
  }

  let intf;
  try {
    intf = await promisify(service.getInterface).bind(service)(objectPath, interfaceName);
  } catch (err) {
    console.log("dbus interface not exposed");
    // console.debug("err", err);
  }

  if (!intf) {
    console.info("!intf");
    clearTimeout(timeout);
    return false;
  }

  try {
    console.log("Show...");
    await promisify(intf.Show).bind(intf)();
    console.log("Show ok");
  } catch (err) {
    console.log("err", err);
  }
  clearTimeout(timeout);
  sessionBus.disconnect();

  return true;
}

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
      throw new Error(`Could not request service name ${serviceName}, the error was: ${err}.`);
    }

    // Return code 0x1 means we successfully had the name
    if (retCode === 1) {
      console.log(`Successfully requested service name "${serviceName}"!`);
      proceed();
    } else {
      // Other return codes means various errors, check here
      // (https://dbus.freedesktop.org/doc/api/html/group__DBusShared.html#ga37a9bc7c6eb11d212bf8d5e5ff3b50f9) for more
      // information
      throw new Error(`Failed to request service name "${serviceName}". Check what return code "${retCode}" means.`);
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
      },
    };

    const iface = {
      Show: function () {
        window.show();
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
    };

    // Now we need to actually export our interface on our object
    sessionBus.exportInterface(iface, objectPath, ifaceDesc);

    // Say our service is ready to receive function calls (you can use `gdbus call` to make function calls)
    console.log("Interface exposed to DBus, ready to receive function calls!");
  }
};
