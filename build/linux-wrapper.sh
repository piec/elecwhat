#!/bin/sh
# Launcher installed as "elecwhat" by build/after-pack.cjs; the electron binary
# itself is renamed to "elecwhat.bin" next to it.
#
# On Wayland a window can only raise itself with an xdg-activation token,
# without it window.show() ends up as a "<title> is ready" notification
# instead of raising the window. Under XWayland raising works, so force it when
# no token comes back from a notification click:
# - GNOME Shell < 46 doesn't send one (org.freedesktop.Notifications
#   ActivationToken signal)
# - in a snap, libnotify sends notifications through the xdg-desktop-portal,
#   which doesn't give one back either
# The ozone platform can't be changed from JS (too late), hence this wrapper.
# Passing --ozone-platform=... explicitly disables the detection.

bin="$(dirname "$(readlink -f "$0")")/elecwhat.bin"

force_x11() {
  echo "elecwhat: using --ozone-platform=x11, reason: $1" >&1
  echo "(pass --ozone-platform=wayland to override)" >&2
}

case " $* " in
*" --ozone-platform"*) ;;
*)
  if [ "$XDG_SESSION_TYPE" = wayland ] && [ -n "$WAYLAND_DISPLAY" ]; then
    if [ -n "$SNAP" ]; then
      force_x11 "snap"
      set -- --ozone-platform=x11 "$@"
    else
      case "$XDG_CURRENT_DESKTOP" in
      *GNOME* | *gnome*)
        v=$(gnome-shell --version 2>/dev/null | sed -n 's/^GNOME Shell \([0-9]*\).*/\1/p')
        if [ -n "$v" ] && [ "$v" -lt 46 ]; then
          force_x11 "GNOME Shell $v < 46"
          set -- --ozone-platform=x11 "$@"
        fi
        ;;
      esac
    fi
  fi
  ;;
esac

exec "$bin" "$@"
