import { spawnSync } from "node:child_process";
import { mkdir, readFile, rmdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const datasetPath = fileURLToPath(new URL("../src/data/dataset.json", import.meta.url));
const lock = fileURLToPath(new URL("../.cache/refresh.lock", import.meta.url));
await mkdir(fileURLToPath(new URL("../.cache", import.meta.url)), { recursive: true });
await mkdir(lock); // A concurrent refresh must not overwrite another run's backup.
const before = await readFile(datasetPath);
await writeFile(fileURLToPath(new URL("../.cache/dataset-before-refresh.json", import.meta.url)), before);

function run(command, args) {
  const result = spawnSync(command, args, { cwd: root, stdio: "inherit", env: process.env });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${command} failed (${result.status ?? result.signal})`);
}

try {
  run(process.env.PYTHON ?? "python", ["-I", "pipeline/build_dataset.py", "--refresh"]);
  run(process.env.PYTHON ?? "python", ["-m", "unittest", "discover", "-s", "pipeline", "-p", "test_*.py"]);
  run(process.execPath, ["node_modules/vitest/vitest.mjs", "run"]);
  run(process.execPath, ["node_modules/eslint/bin/eslint.js", "."]);
  const candidate = JSON.parse(await readFile(datasetPath, "utf8"));
  const timestamp = new Date().toISOString();
  candidate.refresh.validatedAt = timestamp;
  candidate.refresh.lastSuccessfulAt = timestamp;
  if (process.env.GITHUB_RUN_ID && process.env.GITHUB_REPOSITORY) {
    candidate.refresh.runUrl = `https://github.com/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`;
  } else {
    delete candidate.refresh.runUrl;
  }
  await writeFile(datasetPath, JSON.stringify(candidate, null, 1) + "\n");
  run(process.execPath, ["scripts/build-static.mjs"]);
  console.log("Refresh validated. Data and the static export are ready; no deployment has been triggered by this command.");
} catch (error) {
  await writeFile(datasetPath, before);
  throw error;
} finally {
  await rmdir(lock);
}
