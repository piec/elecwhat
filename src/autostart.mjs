// Autostart on login via an XDG autostart entry:
// https://specifications.freedesktop.org/autostart-spec/latest/
//
// The entry is a copy of the installed .desktop file when one can be found
// Otherwise (AppImage, dev, ...) the entry is generated
//
// Not supported in a snap: the home plug can't write to the real ~/.config.

import { app } from "electron";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { consola } from "consola";

import pkg from "../package.json" with { type: "json" };
// also used by electron-builder.yml
import linuxDesktop from "./linux-desktop.json" with { type: "json" };

export const autostartSupported = !process.env.SNAP;

const desktopName = pkg.desktopName ?? "elecwhat.desktop";

function autostartFilePath() {
  const configHome = process.env.XDG_CONFIG_HOME || path.join(os.homedir(), ".config");
  return path.join(configHome, "autostart", desktopName);
}

// .desktop file we were launched from, or the installed one
function findDesktopFile() {
  const launched = [process.env.GIO_LAUNCHED_DESKTOP_FILE, process.env.BAMF_DESKTOP_FILE_HINT];
  const dataDirs = [
    process.env.XDG_DATA_HOME || path.join(os.homedir(), ".local", "share"),
    ...(process.env.XDG_DATA_DIRS || "/usr/local/share:/usr/share").split(":"),
  ];
  const installed = dataDirs.filter(Boolean).map((dir) => path.join(dir, "applications", desktopName));
  consola.debug("autostart: launched from", {
    GIO_LAUNCHED_DESKTOP_FILE: process.env.GIO_LAUNCHED_DESKTOP_FILE,
    BAMF_DESKTOP_FILE_HINT: process.env.BAMF_DESKTOP_FILE_HINT,
  });
  const candidates = [...launched, ...installed].filter((file) => file && path.isAbsolute(file));
  consola.debug("autostart: desktop file candidates", candidates);
  const found = candidates.find((file) => existsSync(file));
  if (found) {
    consola.info("autostart: found desktop file", found);
  } else {
    consola.info("autostart: no installed desktop file found");
  }
  return found;
}

// Desktop entry Exec quoting:
// https://specifications.freedesktop.org/desktop-entry-spec/latest/exec-variables.html
function quoteExecArg(arg) {
  const escaped = arg.replace(/%/g, "%%");
  if (!/[\s"'\\><~|&;$*?#()`]/.test(escaped)) {
    return escaped;
  }
  return `"${escaped.replace(/(["`$\\])/g, "\\$1")}"`;
}

function execCommand() {
  let argv;
  if (process.env.APPIMAGE) {
    argv = [process.env.APPIMAGE];
  } else if (path.basename(process.execPath) === "elecwhat.bin") {
    // bundled electron: launch the wrapper installed next to it (build/linux-wrapper.sh)
    argv = [path.join(path.dirname(process.execPath), "elecwhat")];
  } else {
    // system electron (e.g. AUR) or dev: electron <app>
    argv = [process.execPath, app.getAppPath()];
  }
  const exec = argv.map(quoteExecArg).join(" ");
  consola.debug("autostart: exec", { execPath: process.execPath, APPIMAGE: process.env.APPIMAGE, exec });
  return exec;
}

// https://specifications.freedesktop.org/desktop-entry-spec/latest/value-types.html
function desktopStringEscape(value) {
  return value.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/\r/g, "\\r").replace(/\t/g, "\\t");
}

// Same entry as electron-builder's (LinuxTargetHelper.computeDesktopEntry in
// app-builder-lib), from the same src/linux-desktop.json, minus the Exec field
// codes.
function generatedEntry() {
  const { category, mimeTypes = [], desktop } = linuxDesktop.linux;
  const executableName = pkg.name;
  const entry = {
    Name: desktopStringEscape(pkg.productName ?? pkg.name),
    Exec: execCommand(),
    Terminal: "false",
    Type: "Application",
    Icon: executableName,
    StartupWMClass: desktopStringEscape(desktopName.replace(/\.desktop$/, "")),
    ...desktop?.entry,
  };
  if (pkg.description) {
    entry.Comment = desktopStringEscape(pkg.description);
  }
  if (mimeTypes.length) {
    entry.MimeType = mimeTypes.join(";") + ";";
  }
  entry.Categories = category.endsWith(";") ? category : category + ";";
  entry["X-GNOME-Autostart-enabled"] = "true";
  return ["[Desktop Entry]", ...Object.entries(entry).map(([key, value]) => `${key}=${value}`), ""].join("\n");
}

// Copy of an installed entry: drop the Exec field codes (%U...), there is
// nothing to open at login, and make sure it isn't disabled.
function copiedEntry(file) {
  let inMainGroup = false;
  const lines = readFileSync(file, "utf-8")
    .split("\n")
    .filter((line) => !line.startsWith("X-GNOME-Autostart-enabled=") && !line.startsWith("Hidden="))
    .map((line) => {
      if (line.startsWith("[")) {
        inMainGroup = line.trim() === "[Desktop Entry]";
      } else if (inMainGroup && line.startsWith("Exec=")) {
        return line.replace(/\s+%[fFuUdDnNickvm]/g, "");
      }
      return line;
    });
  const main = lines.indexOf("[Desktop Entry]");
  lines.splice(main + 1, 0, "X-GNOME-Autostart-enabled=true");
  return lines.join("\n");
}

function entryContent() {
  // Use an installed entry only when it can point to this very copy:
  // - an AppImage's path changes on update, an installed entry may point to another copy
  // - in dev, the installed entry would launch the system elecwhat, not this checkout
  let source;
  if (process.env.APPIMAGE) {
    consola.info("autostart: AppImage, not looking for an installed desktop file");
  } else if (!app.isPackaged) {
    consola.info("autostart: dev, not looking for an installed desktop file");
  } else {
    source = findDesktopFile();
  }
  if (source) {
    try {
      consola.info("autostart: copying", source);
      return copiedEntry(source);
    } catch (err) {
      consola.warn("autostart: can't read", source, err);
    }
  }
  consola.info("autostart: generating entry");
  return generatedEntry();
}

export function isAutostartEnabled() {
  return autostartSupported && existsSync(autostartFilePath());
}

export function setAutostart(enabled) {
  if (!autostartSupported) {
    consola.warn("autostart: not supported");
    return;
  }
  const file = autostartFilePath();
  try {
    if (enabled) {
      mkdirSync(path.dirname(file), { recursive: true });
      const content = entryContent();
      writeFileSync(file, content);
      consola.info("autostart enabled", file);
      consola.debug("autostart: entry\n" + content);
    } else {
      rmSync(file, { force: true });
      consola.info("autostart disabled", file);
    }
  } catch (err) {
    consola.error("autostart", err);
  }
}

// The AppImage path changes when the file is moved or updated: keep an existing
// entry pointing to the current one. Other entries are left alone so user edits
// (e.g. extra arguments) survive.
export function refreshAutostart() {
  const enabled = isAutostartEnabled();
  consola.debug("autostart: enabled", enabled, autostartFilePath());
  if (enabled) {
    consola.info("autostart: refreshing entry");
    setAutostart(true);
  }
}
