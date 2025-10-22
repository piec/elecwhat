import { Menu, MenuItem, app, nativeImage, net } from "electron";
import { factory } from "electron-json-config";
import { readFileSync } from "node:fs";
import path from "node:path";
import dbus from "@homebridge/dbus-native";
import pkg from "../package.json" with { type: "json" };

export const toggleVisibility = function (window) {
  console.debug("toggleVisibility");
  const vis = window.isVisible();
  if (vis) {
    window.hide();
  } else {
    window.show();
  }
  return !vis;
};

export const isDebug = process?.env?.DEBUG == 1;

export const addAboutMenuItem = () => {
  let menu = Menu.getApplicationMenu();
  if (menu == null || menu.items.length == 0) {
    return;
  }
  const helpMenu = menu.items.slice(-1)[0];
  helpMenu?.submenu.append(new MenuItem({ role: "about" }));
};

export function windowShow(window) {
  if (window.isMinimized()) {
    window.restore();
  }
  window.show();
}

export async function loadUrl(url, protocols = ["file:", "https:"]) {
  let data = null;
  if (!protocols.includes(url.protocol)) {
    console.error("unsupported protocol", url.protocol);
    return null;
  }
  if (url.protocol == "file:") {
    let path = url.pathname;
    if (url.hostname == "~") {
      path = app.getPath("home") + path;
    }
    console.log("load from file", path);
    data = readFileSync(path, "utf-8");
  } else if (url.protocol == "https:") {
    console.log("load from", url.href);
    const res = await net.fetch(url.href);
    if (res.ok) {
      data = await res.text();
    } else {
      console.error("fetch", res.status, res.statusText);
    }
  }
  return data;
}

export function getUrl(url) {
  try {
    return new URL(url);
  } catch (err) {
    return null;
  }
}

export function replaceVariables(script) {
  return script.replace("${userData}", app.getPath("userData"));
}

const userIconCache = new Map();

export function getUserIcon(basename, state) {
  if (userIconCache.has(basename)) {
    return userIconCache.get(basename);
  }
  const dir = state.iconsDir;
  const filePath = path.join(dir, `${basename}.png`);
  try {
    const buffer = readFileSync(filePath);
    const icon = nativeImage.createFromBuffer(buffer);
    userIconCache.set(basename, icon);
    return icon;
  } catch (e) {
    // File does not exist or cannot be read
  }
  userIconCache.set(basename, null);
  return null;
}

export async function getIcon(url, state) {
  const lastPathPart = path.basename(url);
  console.debug("favicon", url, lastPathPart);

  const userIcon = getUserIcon(lastPathPart, state);
  if (userIcon) {
    return userIcon;
  }

  // larger images
  url = url.replace("/1x/", "/2x/");
  const re = /https:\/\/(static\.whatsapp\.net|web\.whatsapp\.com)\//;

  if (url && re.test(url)) {
    const r = await fetch(url, {
      headers: { "User-Agent": state.userAgent },
    });
    if (!r.ok) {
      console.error("fetch", r.status, r.statusText);
      return null;
    }
    const ab = await r.arrayBuffer();
    return nativeImage.createFromBuffer(Buffer.from(ab));
  }
}

export function loadTranslations(locale) {
  let translations = {};
  try {
    const filename = locale.split("-")[0];
    const data = readFileSync(path.join(import.meta.dirname, "..", "locales", `${filename}.json`), "utf-8");
    translations = JSON.parse(data);
  } catch (err) {
    console.error("cannot load translations", locale);
  }
  return translations;
}

export function loadConfig() {
  const file = path.join(app.getPath("userData"), "config.json");
  let config, configError;
  try {
    config = factory(file, undefined, { prettyJson: { enabled: true } });
  } catch (err) {
    config = {
      file: file,
      get: (name, defaultValue) => {
        return defaultValue;
      },
    };
    console.log("err", err);
    configError = err;
  }
  return { config, configError };
}

export const setBadgeViaDbus = (number) => {
  const sessionBus = dbus.sessionBus();
  if(!sessionBus)
    return;

  dbus.sessionBus().connection.message({
    type: dbus.messageType.signal,
    serial: 1,
    path: "/",
    interface: "com.canonical.Unity.LauncherEntry",
    member: "Update",
    signature: "sa{sv}",
    body: [
      "application://" + pkg.name + ".desktop",
      [
        ["count", ["x", number]],
        ["count-visible", ["b", number !== 0]]
      ]
    ]
  });
}
