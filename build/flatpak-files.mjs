// Generates the flatpak's .desktop entry and AppStream metainfo from the same
// sources as the other linux packages (package.json, src/linux-desktop.json),
// see build-flatpak.sh.
//   node build/flatpak-files.mjs <app-id> <out-dir>

import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import pkg from "../package.json" with { type: "json" };
import linuxDesktop from "../src/linux-desktop.json" with { type: "json" };
import { desktopEntry } from "../src/desktop-entry.mjs";

const [appId, outDir] = process.argv.slice(2);
if (!appId || !outDir) {
  console.error("usage: flatpak-files.mjs <app-id> <out-dir>");
  process.exit(1);
}

const xml = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// Inline markdown to AppStream description markup: links become their text
// (no <a> allowed), `code` becomes <code>
function inline(md) {
  return md
    .split(/(`[^`]*`)/)
    .map((part) =>
      part.startsWith("`") && part.endsWith("`") && part.length > 1
        ? `<code>${xml(part.slice(1, -1))}</code>`
        : xml(part.replace(/\[([^\]]*)\]\([^)]*\)/g, "$1").replace(/\[([^\]]*)\]/g, "$1")),
    )
    .join("");
}

// README.md's "## Features" bullet list as an AppStream <ul>. Nested lists
// aren't allowed: sub-items are appended to their parent item.
const readme = readFileSync(new URL("../README.md", import.meta.url), "utf-8");

function readmeFeatures() {
  const section = readme.match(/^## Features\s*\n([\s\S]*?)(?=^#)/m);
  if (!section) throw new Error("README.md: no '## Features' section");
  const items = [];
  for (const line of section[1].split("\n")) {
    const m = line.match(/^(\s*)[*-]\s+(.*)$/);
    if (!m) continue;
    const text = m[2].trim();
    if (m[1].length > 0 && items.length) {
      const parent = items[items.length - 1];
      items[items.length - 1] = parent.endsWith(":") ? `${parent} ${text}` : `${parent}, ${text}`;
    } else {
      items.push(text);
    }
  }
  return items.map((item) => `      <li>${inline(item)}</li>`).join("\n");
}

// release date: last commit's, so that rebuilding doesn't change it
function releaseDate() {
  try {
    return execFileSync("git", ["log", "-1", "--format=%cs"], { encoding: "utf-8" }).trim();
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

// /app/bin/elecwhat is build/linux-wrapper.sh; the icon is installed under the app id
const desktop = desktopEntry({ exec: `${pkg.name} %U`, icon: appId });

// same name as the .desktop entry
const name = linuxDesktop.linux.desktop?.entry?.Name ?? pkg.productName ?? pkg.name;
const metainfo = `<?xml version="1.0" encoding="UTF-8"?>
<component type="desktop-application">
  <id>${xml(appId)}</id>
  <name>${xml(name)}</name>
  <summary>${xml(pkg.description)}</summary>
  <metadata_license>CC0-1.0</metadata_license>
  <project_license>${xml(pkg.license)}</project_license>
  <developer id="${xml(appId.split(".").slice(0, 2).join("."))}">
    <name>${xml(pkg.author.name)}</name>
  </developer>
  <description>
    <p>Features:</p>
    <ul>
${readmeFeatures()}
    </ul>
  </description>
  <screenshots>
    <screenshot type="default">
      <image>https://github.com/user-attachments/assets/3a352d5b-04a8-4e90-a063-330b706d096c</image>
    </screenshot>
  </screenshots>
  <launchable type="desktop-id">${xml(appId)}.desktop</launchable>
  <url type="homepage">${xml(pkg.homepage)}</url>
  <url type="bugtracker">${xml(pkg.homepage)}/issues</url>
  <url type="vcs-browser">${xml(pkg.homepage)}</url>
  <content_rating type="oars-1.1">
    <content_attribute id="social-chat">intense</content_attribute>
    <content_attribute id="social-audio">intense</content_attribute>
    <content_attribute id="social-contacts">intense</content_attribute>
  </content_rating>
  <releases>
    <release version="${xml(pkg.version)}" date="${releaseDate()}"/>
  </releases>
</component>
`;

mkdirSync(outDir, { recursive: true });
writeFileSync(path.join(outDir, `${appId}.desktop`), desktop);
writeFileSync(path.join(outDir, `${appId}.metainfo.xml`), metainfo);
console.log("flatpak-files: wrote", outDir);
