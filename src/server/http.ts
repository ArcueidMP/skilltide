// HTTP helpers for the API: JSON responses, errors, body limits and the same-site check.

import type { ApiFailure } from "@/lib/api-types";

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details?: string[],
    readonly headers: Record<string, string> = {},
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/** Ample for a profile listing every skill; a larger body did not come from SkillTide's pages. */
export const MAX_BODY_CHARS = 16_000;

export function json(body: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "x-content-type-options": "nosniff", ...headers },
  });
}

export function errorResponse(error: ApiError): Response {
  const body: ApiFailure = {
    error: { code: error.code, message: error.message, ...(error.details?.length ? { details: error.details } : {}) },
  };
  return json(body, error.status, { "cache-control": "no-store", ...error.headers });
}

const tooLarge = () => new ApiError(413, "payload_too_large", `The request body is longer than ${MAX_BODY_CHARS} characters.`);

export async function readJson(request: Request): Promise<unknown> {
  if (!/^application\/json\b/i.test(request.headers.get("content-type") ?? "")) {
    throw new ApiError(415, "unsupported_media_type", "Send a JSON body with Content-Type: application/json.");
  }
  if (Number(request.headers.get("content-length") ?? 0) > MAX_BODY_CHARS) throw tooLarge();
  const text = await request.text();
  if (text.length > MAX_BODY_CHARS) throw tooLarge();
  try {
    return JSON.parse(text);
  } catch {
    throw new ApiError(400, "invalid_json", "The request body is not valid JSON.");
  }
}

/**
 * The API serves SkillTide's own pages only. Browsers label each request with Sec-Fetch-Site; the API
 * sends no CORS headers, so other sites can neither read its responses nor get a JSON POST through.
 */
export function assertSameSite(request: Request) {
  const site = request.headers.get("sec-fetch-site");
  if (site && site !== "same-origin" && site !== "none") {
    throw new ApiError(403, "cross_site", "This API only serves SkillTide's own pages.");
  }
}
