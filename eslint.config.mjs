import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "public/pdfjs/**",
    ".cache/**",
    ".wrangler/**",
    "output/**",
    "playwright-report/**",
    "test-results/**",
    "build/**",
    "next-env.d.ts",
    // The demo film is a separate browser project with its own tooling.
    "video/**",
  ]),
]);

export default eslintConfig;
