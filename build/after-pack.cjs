// Replace the linux electron executable with build/linux-wrapper.sh
// (the binary is kept as "<executable>.bin"), for every linux target.
const fs = require("node:fs");
const path = require("node:path");

exports.default = async function afterPack(context) {
  if (context.electronPlatformName !== "linux") return;

  const exe = path.join(context.appOutDir, context.packager.executableName);
  const bin = `${exe}.bin`;
  if (!fs.existsSync(bin)) {
    fs.renameSync(exe, bin);
  }
  fs.copyFileSync(path.join(__dirname, "linux-wrapper.sh"), exe);
  fs.chmodSync(exe, 0o755);
};
