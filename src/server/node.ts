// Runs SkillTide as one Node server, as on Replit: the static export from out/ plus the same API
// handler the Cloudflare Worker uses. Start it with `npm run start:node` after `npm run build:static`.

import { readFile, stat } from "node:fs/promises";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { extname, join, resolve, sep } from "node:path";
import { promisify } from "node:util";
import { gzip } from "node:zlib";
import { handleApi } from "./api";
import type { EdgeCache } from "./guide";

const ROOT = resolve(process.env.SKILLTIDE_STATIC_DIR ?? "out");
const portArg = process.argv.indexOf("--port");
const PORT = Number(portArg > 0 ? process.argv[portArg + 1] : (process.env.PORT ?? 3000));
const MAX_BODY_BYTES = 64 * 1024;
const compress = promisify(gzip);

// The same settings wrangler.jsonc gives the Worker; OPENAI_API_KEY comes from Replit Secrets.
const env = {
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  OPENAI_MODEL: process.env.OPENAI_MODEL ?? "gpt-6-luna",
  OPENAI_REASONING_EFFORT: process.env.OPENAI_REASONING_EFFORT ?? "none",
};

const TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".pdf": "application/pdf",
  ".wasm": "application/wasm",
};
const COMPRESSIBLE = /^(text\/|application\/(json|javascript)|image\/svg)/;

// Cloudflare's cache keeps worded Guide answers; on Node a small in-memory cache does the same job.
const answers = new Map<string, { body: string; expires: number }>();
const cache: EdgeCache = {
  async match(request) {
    const hit = answers.get(request.url);
    return hit && hit.expires > Date.now() ? new Response(hit.body, { headers: { "content-type": "application/json" } }) : undefined;
  },
  async put(request, response) {
    const seconds = Number(/max-age=(\d+)/.exec(response.headers.get("cache-control") ?? "")?.[1] ?? 0);
    if (!seconds) return;
    answers.set(request.url, { body: await response.text(), expires: Date.now() + seconds * 1000 });
    if (answers.size > 500) answers.delete(answers.keys().next().value!);
  },
};

async function send(req: IncomingMessage, res: ServerResponse, status: number, headers: Record<string, string>, body: Buffer) {
  const type = headers["content-type"] ?? "";
  let payload = body;
  if (body.length > 1024 && COMPRESSIBLE.test(type) && /\bgzip\b/.test(String(req.headers["accept-encoding"] ?? ""))) {
    payload = await compress(body);
    headers = { ...headers, "content-encoding": "gzip", vary: "accept-encoding" };
  }
  res.writeHead(status, { ...headers, "content-length": String(payload.length) });
  res.end(req.method === "HEAD" ? undefined : payload);
}

async function isFile(path: string) {
  try {
    return (await stat(path)).isFile();
  } catch {
    return false;
  }
}

async function sendFile(req: IncomingMessage, res: ServerResponse, path: string, status = 200) {
  const immutable = path.includes(`${sep}_next${sep}static${sep}`);
  await send(req, res, status, {
    "content-type": TYPES[extname(path).toLowerCase()] ?? "application/octet-stream",
    "cache-control": immutable ? "public, max-age=31536000, immutable" : "public, max-age=0, must-revalidate",
    "x-content-type-options": "nosniff",
  }, await readFile(path));
}

/** Serves out/ like the Cloudflare assets config: trailing-slash pages and the export's own 404 page. */
async function serveStatic(req: IncomingMessage, res: ServerResponse, url: URL) {
  let pathname: string;
  try {
    pathname = decodeURIComponent(url.pathname);
  } catch {
    pathname = "/";
  }
  const target = resolve(ROOT, `.${pathname}`);
  if (target !== ROOT && !target.startsWith(ROOT + sep)) return sendFile(req, res, join(ROOT, "404.html"), 404);
  if (pathname.endsWith("/")) {
    const index = join(target, "index.html");
    return (await isFile(index)) ? sendFile(req, res, index) : sendFile(req, res, join(ROOT, "404.html"), 404);
  }
  if (await isFile(target)) return sendFile(req, res, target);
  if (await isFile(join(target, "index.html"))) {
    res.writeHead(308, { location: `${url.pathname}/${url.search}` });
    return res.end();
  }
  return sendFile(req, res, join(ROOT, "404.html"), 404);
}

async function readBody(req: IncomingMessage): Promise<Buffer | null> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    size += (chunk as Buffer).length;
    if (size > MAX_BODY_BYTES) return null;
    chunks.push(chunk as Buffer);
  }
  return Buffer.concat(chunks);
}

async function serveApi(req: IncomingMessage, res: ServerResponse, url: URL) {
  const body = req.method === "GET" || req.method === "HEAD" ? undefined : await readBody(req);
  if (body === null) return send(req, res, 413, { "content-type": "application/json; charset=utf-8" }, Buffer.from('{"error":{"code":"payload_too_large","message":"The request body is too large."}}'));
  const headers = new Headers();
  for (const [name, value] of Object.entries(req.headers)) {
    if (value !== undefined) headers.set(name, Array.isArray(value) ? value.join(", ") : value);
  }
  const clientId = String(req.headers["x-forwarded-for"] ?? req.socket.remoteAddress ?? "unknown").split(",")[0].trim();
  // The API only accepts JSON, so the body can travel as text.
  const request = new Request(url, { method: req.method, headers, body: body?.toString("utf8") });
  const response = await handleApi(request, env, { waitUntil: (promise) => void promise.catch(() => undefined) }, { cache, clientId });
  await send(req, res, response.status, Object.fromEntries(response.headers), Buffer.from(await response.arrayBuffer()));
}

const server = createServer((req, res) => {
  const host = String(req.headers["x-forwarded-host"] ?? req.headers.host ?? "localhost");
  const protocol = String(req.headers["x-forwarded-proto"] ?? "http").split(",")[0];
  const url = new URL(req.url ?? "/", `${protocol}://${host}`);
  const handle = url.pathname.startsWith("/api/") ? serveApi : serveStatic;
  handle(req, res, url).catch((error) => {
    console.error(JSON.stringify({ path: url.pathname, error: String(error) }));
    if (!res.headersSent) res.writeHead(500, { "content-type": "text/plain; charset=utf-8" });
    res.end("SkillTide could not answer this request.");
  });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`SkillTide on http://localhost:${PORT} (static files from ${ROOT}; AI wording ${env.OPENAI_API_KEY ? "configured" : "not configured"})`);
});
