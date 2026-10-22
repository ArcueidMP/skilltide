// Runs the API Worker locally on port 8787; `npm run dev` forwards /api/* to it.
import { spawnSync } from "node:child_process";
import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));

function run(script, args) {
  const result = spawnSync(process.execPath, [fileURLToPath(new URL(`../node_modules/${script}`, import.meta.url)), ...args], {
    cwd: root,
    stdio: "inherit",
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

run("tsx/dist/cli.mjs", ["scripts/materialize-cohort.mts"]);
// Wrangler expects the assets directory; it stays empty until `npm run build:static`.
await mkdir(new URL("../out/", import.meta.url), { recursive: true });
run("wrangler/bin/wrangler.js", ["dev", "--port", "8787", ...process.argv.slice(2)]);
