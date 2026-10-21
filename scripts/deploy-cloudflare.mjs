import "./build-static.mjs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const result = spawnSync(process.execPath, [fileURLToPath(new URL("../node_modules/wrangler/bin/wrangler.js", import.meta.url)), "deploy"], {
  cwd: fileURLToPath(new URL("../", import.meta.url)),
  stdio: "inherit",
});
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
