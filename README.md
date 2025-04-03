# ElecWhat - Simple desktop Whatsapp client for Linux

## Features
* Desktop notifications
* Tray icon with unread count (aka AppIndicator)
* Custom keyboard shortcuts ([default](https://github.com/piec/elecwhat/blob/5128cfa83dc8b2a54084e39df35e9d6a2a1317ce/src/main.mjs#L10-L29))
* Spellcheck
* D-Bus interface to show/hide/toggle window
* Very stable, I have been running it for 6+ month without crash/freeze
* Can be trusted:
  * Code easy to review - <600 lines of code currently
  * Automatically built by GitHub Actions (CI)
* Preserve window position

## Why?
I created this client after due to recurrent stability issues with [WhatSie](https://github.com/keshavbhatt/whatsie)

## Install

If you use Gnome, I recommend using this [AppIndicator] extension in order to show tray icons

### Ubuntu/Kubuntu:
* [Snap](https://snapcraft.io/elecwhat)
* ~~**or** [Buildkite deb] with `--no-sandbox` because of [issue]~~
* **or** .deb file in [Releases] with `--no-sandbox` because of [issue]
* **or** AppImage in [Releases] with `--no-sandbox` because of [issue]

### Arch Linux:
* Pacman package in [Releases]
* **or** AppImage in [Releases]
* (planned: **or** AUR package)

### Debian:
* ~~[Buildkite deb]~~ (trial expired)
* **or** .deb file in [Releases]
* **or** AppImage in [Releases]

### Fedora:
* ~~[Buildkite rpm]~~ (trial expired)
* **or** rpm file in [Releases]
* **or** AppImage in [Releases]

## Configuration


`~/.config/elecwhat/config.json`:

(or for snap: `~/snap/elecwhat/current/.config/elecwhat/config.json`)
```
{
  "notification-prefix": "elecwhat - ",

  "quit-on-close": false,
  "show-at-startup": false,

  "dbus": true,

  "menu-bar": true,
  "menu-bar-auto-hide": true,

  "keys": {
    "C ArrowDown": {
      "whatsappAction": "GO_TO_NEXT_CHAT"
    }
  },

  "spellcheck": true,
  "spellcheck-languages": ["en-US", "fr"],

  "user-agent": "...",
  "open-dev-tools": false
}
```

## Not planed
* Multi account
* Complex features
* Other OS support, official apps already exist. Porting would probably be easy though.

[Buildkite deb]: https://buildkite.com/organizations/piec/packages/registries/elecwhat-deb
[Buildkite rpm]: https://buildkite.com/organizations/piec/packages/registries/elecwhat-rpm
[Releases]: https://github.com/piec/elecwhat/releases
[AppIndicator]: https://extensions.gnome.org/extension/615/appindicator-support/
[issue]: https://github.com/electron/electron/issues/41066