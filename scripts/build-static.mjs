import "./prepare-pdf-assets.mjs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { finalizeExport } from "./finalize-export.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
// The API Worker bundles cohort summaries of this dataset, and next build type-checks the Worker too.
const cohort = spawnSync(process.execPath, [fileURLToPath(new URL("../node_modules/tsx/dist/cli.mjs", import.meta.url)), "scripts/materialize-cohort.mts"], {
  cwd: root,
  stdio: "inherit",
});
if (cohort.error) throw cohort.error;
if (cohort.status !== 0) process.exit(cohort.status ?? 1);

const result = spawnSync(process.execPath, [fileURLToPath(new URL("../node_modules/next/dist/bin/next", import.meta.url)), "build"], {
  cwd: root,
  env: { ...process.env, STATIC_EXPORT: "true", NEXT_TELEMETRY_DISABLED: "1" },
  stdio: "inherit",
});
if (result.error) throw result.error;
if (result.status !== 0) process.exit(result.status ?? 1);
console.log(`Static export ready (${await finalizeExport(fileURLToPath(new URL("../out", import.meta.url)))} segment aliases).`);
