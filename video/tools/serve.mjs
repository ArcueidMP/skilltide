// Two static servers: the video composition (5199) and the SkillTide static export (4175).
// On 5199, /repo/… serves the repository itself (fonts from its node_modules, the sample CV).
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const VIDEO_ROOT = path.resolve(here, "..");
const REPO_ROOT = path.resolve(VIDEO_ROOT, "..");
const APP_ROOT = path.join(REPO_ROOT, "out");

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".ttf": "font/ttf",
  ".wasm": "application/wasm",
  ".pdf": "application/pdf",
  ".wav": "audio/wav",
  ".mp3": "audio/mpeg",
};

function resolveFile(root, urlPath, { htmlFallback }) {
  const clean = decodeURIComponent(urlPath.split("?")[0]);
  const full = path.join(root, clean);
  if (!full.startsWith(root)) return null;
  const candidates = [full];
  if (htmlFallback) candidates.push(`${full}.html`, path.join(full, "index.html"));
  for (const candidate of candidates) {
    try {
      if (fs.statSync(candidate).isFile()) return candidate;
    } catch {
      // try the next candidate
    }
  }
  return null;
}

function serve(root, port, options) {
  http
    .createServer((req, res) => {
      const url = req.url ?? "/";
      const [base, rest] = options.repo && url.startsWith("/repo/") ? [REPO_ROOT, url.slice("/repo".length)] : [root, url];
      const file = resolveFile(base, rest, options) ?? (options.htmlFallback ? path.join(root, "404.html") : null);
      if (!file || !fs.existsSync(file)) {
        res.writeHead(404).end("not found");
        return;
      }
      res.writeHead(200, {
        "content-type": TYPES[path.extname(file).toLowerCase()] ?? "application/octet-stream",
        "cache-control": "no-store",
        "access-control-allow-origin": "*",
      });
      fs.createReadStream(file).pipe(res);
    })
    .listen(port, "127.0.0.1", () => console.log(`serving ${root} on http://127.0.0.1:${port}`));
}

serve(VIDEO_ROOT, 5199, { htmlFallback: false, repo: true });
serve(APP_ROOT, 4175, { htmlFallback: true });
