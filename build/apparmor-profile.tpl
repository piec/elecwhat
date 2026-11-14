abi <abi/4.0>,
include <tunables/global>

# Same as electron-builder's default template, but attached to the real electron
# binary: /opt/.../${executable} is the wrapper script (see build/after-pack.cjs).
profile "${executable}" "/opt/${sanitizedProductName}/${executable}.bin" flags=(unconfined) {
  userns,

  # Site-specific additions and overrides. See local/README for details.
  include if exists <local/${executable}>
}
