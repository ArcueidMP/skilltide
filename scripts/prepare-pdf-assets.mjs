// Serve PDF.js from the app itself, including on GitHub Pages, without a CDN.
import { copyFile, cp, mkdir } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const source = dirname(require.resolve("pdfjs-dist/package.json"));
const { version } = require("pdfjs-dist/package.json");
const destination = fileURLToPath(new URL(`../public/pdfjs/${version}/`, import.meta.url));

await mkdir(destination, { recursive: true });
await copyFile(join(source, "legacy/build/pdf.worker.min.mjs"), join(destination, "pdf.worker.min.mjs"));
await copyFile(join(source, "LICENSE"), join(destination, "LICENSE"));
for (const directory of ["cmaps", "standard_fonts", "wasm"]) {
  await cp(join(source, directory), join(destination, directory), { recursive: true });
}
