import { Menu, MenuItem, app, nativeImage, net } from "electron";
import { factory } from "electron-json-config";
import { readFileSync } from "node:fs";
import path from "node:path";
import { consola } from "consola";
import sharp from "sharp";

export const toggleVisibility = function (window) {
  consola.debug("toggleVisibility");
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
    consola.error("unsupported protocol", url.protocol);
    return null;
  }
  if (url.protocol == "file:") {
    let path = url.pathname;
    if (url.hostname == "~") {
      path = app.getPath("home") + path;
    }
    consola.debug("load from file", path);
    data = readFileSync(path, "utf-8");
  } else if (url.protocol == "https:") {
    consola.debug("load from", url.href);
    const res = await net.fetch(url.href);
    if (res.ok) {
      data = await res.text();
    } else {
      consola.error("fetch", res.status, res.statusText);
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

export function getUserIcon(url, state) {
  url = url.replace(/v[0-9]+\//, "");
  const basename = path.basename(url);

  if (userIconCache.has(basename)) {
    return userIconCache.get(basename);
  }
  const dir = state.iconsDir;
  const filePath = path.join(dir, `${basename}.png`);
  consola.debug("favicon", basename, filePath);
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

const iconCache = new Map();

export async function getIcon(url, state) {
  const userIcon = getUserIcon(url, state);
  if (userIcon) {
    return userIcon;
  }

  // larger images
  url = url.replace("/1x/", "/2x/");

  if (iconCache.has(url)) {
    return iconCache.get(url);
  }
  const re = /https:\/\/(static\.whatsapp\.net|web\.whatsapp\.com)\//;

  consola.debug("url", url);
  if (url && re.test(url)) {
    const r = await fetch(url, {
      headers: { "User-Agent": state.userAgent },
    });
    if (!r.ok) {
      consola.error("fetch", url, r.status, r.statusText);
      return null;
    }
    const ab = await r.arrayBuffer();
    let buffer = Buffer.from(ab);
    const isWebp =
      url.endsWith(".webp") ||
      r.headers.get("content-type")?.includes("image/webp") ||
      (buffer.length >= 12 && buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP");
    if (isWebp) {
      consola.debug("convert webp", url);
      buffer = await sharp(buffer).png().toBuffer();
    }
    const image = nativeImage.createFromBuffer(buffer);
    consola.debug("nativeImage size", image.getSize());
    iconCache.set(url, image);
    return image;
  }
}

export function loadTranslations(locale) {
  let translations = {};
  try {
    const filename = locale.split("-")[0];
    const data = readFileSync(path.join(import.meta.dirname, "..", "locales", `${filename}.json`), "utf-8");
    translations = JSON.parse(data);
  } catch (err) {
    consola.warn("cannot load translations", locale);
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
    consola.warn("config error", err);
    configError = err;
  }
  return { config, configError };
}

export function getUnreadCountFromFavicon(faviconUrl) {
  const match = faviconUrl.match(/https:\/\/web\.whatsapp\.com\/favicon\/1x\/f(\d+)\//);
  return match ? parseInt(match[1], 10) : 0;
}

export const urlScheme = "whatsapp";
export function convertWhatsAppUrl(url) {
  try {
    if (!url.startsWith(`${urlScheme}:`)) {
      return null;
    }
    // Convert whatsapp://send/?... to https://web.whatsapp.com/send?...
    // "send" is parsed as the hostname, not the path
    const whatsappUrl = new URL(url);
    const webUrl = `https://web.whatsapp.com/${whatsappUrl.hostname}${whatsappUrl.pathname}${whatsappUrl.search}${whatsappUrl.hash}`;
    consola.info("Converting whatsapp:// URL:", url, "->", webUrl);
    return webUrl;
  } catch (err) {
    consola.error("Failed to convert whatsapp URL:", url, err);
    return null;
  }
}
