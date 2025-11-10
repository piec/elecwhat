# ElecWhat - Simple desktop WhatsApp client for Linux
<p align="center">
<img width="400" alt="elecwhat" src="https://github.com/user-attachments/assets/3a352d5b-04a8-4e90-a063-330b706d096c" />
</p>

## Features
* Desktop notifications
* Tray icon with unread count (aka AppIndicator), [custom tray icons](https://github.com/piec/elecwhat/issues/30#issuecomment-3470456738).
* Custom keyboard shortcuts ([default](https://github.com/piec/elecwhat/blob/master/src/keys.mjs))
* Custom CSS
* Spellcheck
* CLI & D-Bus interface to show/hide/toggle window
* Dock unread count badge
* Very stable, I have been running it for 1+ year without crash/freeze
* Can be trusted:
  * Code easy to review - ~800 lines of code currently
  * Automatically built by GitHub Actions (CI)
* Preserve window position
* Custom user scripts in `~/.config/elecwhat/user-scripts/*.js`
* Custom tray icons in `~/.config/elecwhat/user-icons/*.png` by default

## Why?
I created this client after due to recurrent stability issues with other linux clients.
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
  "log-level": "info",
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
  "esc-toggle-window": false,

  "css": [
    "span { font-size: small !important; }",
    "https://gist.githubusercontent.com/piec/3f9a198a7694f1df37895ee3faee9b6e/raw/whatsapp-test.css",
    "file://~/mysheet.css"
  ],

  "spellcheck": true,
  "spellcheck-languages": ["en-US", "fr"],

  "user-agent": "...",
  "open-dev-tools": false,

  "scripts": [
    # ~/.config/elecwhat/user-scripts/myscript.js
    "${userData}/user-scripts/myscripts.js"
  ],
  "icons-directory": "..."
}
```

## Custom icons

The naming scheme is based on WhatsApp Web favicon urls:
* `~/.config/elecwhat/user-icons/app.png` during startup
* `~/.config/elecwhat/user-icons/favicon.png` when there is no unread
* `~/.config/elecwhat/user-icons/f01.png` where fXX.png is the number of unread


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
