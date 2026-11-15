#!/usr/bin/env bash
# Build a flatpak bundle (dist/elecwhat-<version>.x86_64.flatpak) from
# electron-builder's linux output.
#   --skip-electron-builder  reuse an existing dist/linux-unpacked
#   --install                also install it for the current user
# The runtime, sdk and electron base app are installed from the user's flathub
# remote when missing. Extra flatpak-builder arguments: $FLATPAK_BUILDER_ARGS
set -euo pipefail
cd "$(dirname "$0")"

APP_ID=fr.carru.elecwhat
VERSION=$(node -p 'require("./package.json").version')
ARCH=$(flatpak --default-arch)

skip_eb=false
install=()
# shellcheck disable=SC2206
extra=(${FLATPAK_BUILDER_ARGS:-})
for arg in "$@"; do
  case "$arg" in
  --skip-electron-builder) skip_eb=true ;;
  --install) install=(--install) ;;
  *) echo "unknown argument: $arg" >&2; exit 1 ;;
  esac
done

if ! $skip_eb; then
  echo "==> electron-builder --dir ..."
  npx electron-builder --linux dir --publish never
fi

echo "==> .desktop and metainfo ..."
node build/flatpak-files.mjs "$APP_ID" dist/flatpak-files

echo "==> flatpak-builder ..."
flatpak-builder --user --install-deps-from=flathub --force-clean \
  --repo=dist/flatpak-repo "${install[@]}" "${extra[@]}" \
  dist/flatpak-build "flatpak/$APP_ID.yml"

out="dist/elecwhat-$VERSION.$ARCH.flatpak"
echo "==> bundling $out ..."
flatpak build-bundle --runtime-repo=https://dl.flathub.org/repo/flathub.flatpakrepo \
  dist/flatpak-repo "$out" "$APP_ID"
ls -lh "$out"
