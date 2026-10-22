import { fileURLToPath } from "node:url";
import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    exclude: [...configDefaults.exclude, "video/**"],
    // The API serves cohort summaries computed ahead of time from the current dataset.
    globalSetup: ["./scripts/materialize-cohort.mts"],
  },
});
