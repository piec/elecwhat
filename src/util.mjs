import { Menu, MenuItem, app, net } from "electron";
import { readFileSync } from "node:fs";

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
