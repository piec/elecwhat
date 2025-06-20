# ElecWhat - Simple desktop Whatsapp client for Linux

## Features
* Desktop notifications
* Tray icon with unread count (aka AppIndicator)
* Custom keyboard shortcuts ([default](https://github.com/piec/elecwhat/blob/5128cfa83dc8b2a54084e39df35e9d6a2a1317ce/src/main.mjs#L10-L29))
* Custom CSS
* Spellcheck
* CLI & D-Bus interface to show/hide/toggle window
* Very stable, I have been running it for 6+ month without crash/freeze
* Can be trusted:
  * Code easy to review - <600 lines of code currently
  * Automatically built by GitHub Actions (CI)
* Preserve window position

## Why?
I created this client after due to recurrent stability issues with [WhatSie](https://github.com/keshavbhatt/whatsie).
Also I just wanted a simple and stable client and thought it could be done without much code with electron.

## Install

If you use Gnome, I recommend using this [AppIndicator] extension in order to show tray icons

### Ubuntu/Kubuntu:
* [Snap](https://snapcraft.io/elecwhat)
* **or** [Buildkite deb] with `--no-sandbox` because of [issue]
* **or** .deb file in [Releases] with `--no-sandbox` because of [issue]
* **or** AppImage in [Releases] with `--no-sandbox` because of [issue]

### Arch Linux:
* [AUR package]: `yay -S elecwhat-bin`
* **or** Pacman package in [Releases]
* **or** AppImage in [Releases]

### Debian:
* [Buildkite deb]
* **or** .deb file in [Releases]
* **or** AppImage in [Releases]

### Fedora:
* [Buildkite rpm]
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

  "css": [
    "span { font-size: small !important; }",
    "https://gist.githubusercontent.com/piec/3f9a198a7694f1df37895ee3faee9b6e/raw/whatsapp-test.css",
    "file://~/mysheet.css"
  ],

  "spellcheck": true,
  "spellcheck-languages": ["en-US", "fr", "es-ES"],

  "user-agent": "...",
  "open-dev-tools": false
}
```

## Not planed
* Multi account
* Complex features
* Other OS support, official apps already exist. Porting would probably be easy though thanks to electron.

[Buildkite deb]: https://buildkite.com/organizations/piec/packages/registries/elecwhat-deb
[Buildkite rpm]: https://buildkite.com/organizations/piec/packages/registries/elecwhat-rpm
[Releases]: https://github.com/piec/elecwhat/releases
[AppIndicator]: https://extensions.gnome.org/extension/615/appindicator-support/
[issue]: https://github.com/electron/electron/issues/41066
[AUR package]: https://aur.archlinux.org/packages/elecwhat-bin
