// Cloudflare Worker entry. Requests for /api/* reach the API (run_worker_first in wrangler.jsonc); the
// static export in out/ serves every other path without running this code.

import { handleApi, type Env, type WaitUntil } from "./api";

interface AssetsBinding {
  fetch(request: Request): Promise<Response>;
}

const worker = {
  fetch(request: Request, env: Env & { ASSETS: AssetsBinding }, ctx: WaitUntil): Promise<Response> {
    if (new URL(request.url).pathname.startsWith("/api/")) return handleApi(request, env, ctx);
    return env.ASSETS.fetch(request);
  },
};

export default worker;
