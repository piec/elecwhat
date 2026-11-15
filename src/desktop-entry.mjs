// Linux .desktop entry, the same as electron-builder's
// Used at runtime by src/autostart.mjs
// and at build time by build/flatpak-files.mjs

import pkg from "../package.json" with { type: "json" };
import linuxDesktop from "./linux-desktop.json" with { type: "json" };

export const desktopName = pkg.desktopName ?? "elecwhat.desktop";

// https://specifications.freedesktop.org/desktop-entry-spec/latest/value-types.html
export function desktopStringEscape(value) {
  return value.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/\r/g, "\\r").replace(/\t/g, "\\t");
}

// exec: already quoted Exec value; extra: additional/overriding keys
export function desktopEntry({ exec, icon = pkg.name, extra = {} }) {
  const { category, mimeTypes = [], desktop } = linuxDesktop.linux;
  const entry = {
    Name: desktopStringEscape(pkg.productName ?? pkg.name),
    Exec: exec,
    Terminal: "false",
    Type: "Application",
    Icon: icon,
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
  Object.assign(entry, extra);
  return ["[Desktop Entry]", ...Object.entries(entry).map(([key, value]) => `${key}=${value}`), ""].join("\n");
}
