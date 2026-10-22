// SkillTide's HTTP API, run by the Cloudflare Worker in front of the static site. Each endpoint is a thin
// layer over the same engine the browser keeps as its fallback. Nothing a request sends is stored.

import { computeComparison, computeMatches } from "@/lib/analysis";
import type { CohortSummary } from "@/lib/cohort";
import { API_PREFIX, DATASET_HEADER, type ApiSuccess, type GuideResult, type HealthResult, type MatchesResult, type OutlooksResult } from "@/lib/api-types";
import { dataset, datasetVersion } from "@/lib/data";
import materialized from "./generated/cohort.json";
import { answerGuide, type EdgeCache, type GuideDeps } from "./guide";
import { ApiError, assertSameSite, errorResponse, json, readJson } from "./http";
import { WindowLimiter } from "./limiter";
import { outlooksFor } from "./memo";
import { openAiConfig, type OpenAiEnv } from "./openai";
import { parseAnalysisQuery, parseCompareRequest, parseGuideRequest, parseMatchesRequest } from "./validate";

export type Env = OpenAiEnv;

export interface WaitUntil {
  waitUntil(promise: Promise<unknown>): void;
}

const META = { dataset: datasetVersion, generatedAt: dataset.generatedAt };

// Built by scripts/materialize-cohort.mts: ranking all 180 synthetic students exceeds a request's CPU budget.
const cohorts = materialized as unknown as { dataset: string; summaries: Record<string, CohortSummary> };

const GUIDE_LIMITS = { client: new WindowLimiter(6, 60_000), instance: new WindowLimiter(30, 60_000) };

interface Call {
  request: Request;
  url: URL;
  env: Env;
  guide: () => GuideDeps;
}

interface Route {
  method: "GET" | "POST";
  /** "versioned": cacheable for a year when the URL carries the current dataset version. */
  cache: "none" | "versioned" | "private";
  run: (call: Call) => unknown;
}

const ROUTES: Record<string, Route> = {
  "/health": {
    method: "GET",
    cache: "none",
    run: ({ env }): HealthResult => {
      const ai = openAiConfig(env);
      return { ok: true, dataset: datasetVersion, ai: { configured: ai !== null, model: ai?.model ?? null } };
    },
  },
  "/outlooks": {
    method: "GET",
    cache: "versioned",
    run: ({ url }): OutlooksResult => {
      const { snapshot, scenario } = parseAnalysisQuery(url);
      const { outlooks, trends } = outlooksFor(snapshot, scenario);
      return { roles: [...outlooks.values()], skills: trends };
    },
  },
  "/cohort": {
    method: "GET",
    cache: "versioned",
    run: ({ url }): CohortSummary => {
      const { snapshot, scenario } = parseAnalysisQuery(url);
      if (cohorts.dataset !== datasetVersion) {
        throw new ApiError(503, "cohort_unavailable", "Cohort summaries were built from other data. Rebuild the site.");
      }
      return cohorts.summaries[`${snapshot}|${scenario}`];
    },
  },
  "/matches": {
    method: "POST",
    cache: "private",
    run: async ({ request }): Promise<MatchesResult> => {
      const body = parseMatchesRequest(await readJson(request));
      const result = computeMatches(body, outlooksFor(body.snapshot, body.scenario).outlooks);
      // The browser joins each match with the outlook it already holds from /outlooks.
      return {
        ...result,
        matches: result.matches.map(({ outlook, ...match }) => {
          void outlook;
          return match;
        }),
      };
    },
  },
  "/scenarios/compare": {
    method: "POST",
    cache: "private",
    run: async ({ request }) => computeComparison(parseCompareRequest(await readJson(request))),
  },
  "/guide": {
    method: "POST",
    cache: "private",
    run: async ({ request, guide }) => answerGuide(parseGuideRequest(await readJson(request)), guide()),
  },
};

function edgeCache(): EdgeCache | null {
  // Cloudflare's per-location cache; absent outside Workers.
  return (globalThis as unknown as { caches?: { default?: EdgeCache } }).caches?.default ?? null;
}

function cacheControl(route: Route, url: URL) {
  if (route.cache === "versioned") {
    return url.searchParams.get("v") === datasetVersion ? "public, max-age=31536000, immutable" : "public, max-age=300";
  }
  return "no-store";
}

export async function handleApi(request: Request, env: Env, ctx?: WaitUntil, overrides: Partial<GuideDeps> = {}): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname.startsWith(`${API_PREFIX}/`) ? url.pathname.slice(API_PREFIX.length) : url.pathname;
  const started = Date.now();
  let response: Response;
  let guide: string | undefined;
  try {
    assertSameSite(request);
    const route = ROUTES[path];
    if (!route) throw new ApiError(404, "not_found", "There is no such API endpoint.");
    if (request.method !== route.method) {
      throw new ApiError(405, "method_not_allowed", `Use ${route.method} for this endpoint.`, undefined, { allow: route.method });
    }
    const version = request.headers.get(DATASET_HEADER) ?? url.searchParams.get("v");
    if (version && version !== datasetVersion) {
      throw new ApiError(409, "dataset_mismatch", "This page was built with different data. Reload SkillTide.");
    }
    const data = await route.run({
      request,
      url,
      env,
      guide: () => ({
        env,
        fetch: globalThis.fetch.bind(globalThis),
        cache: edgeCache(),
        limits: GUIDE_LIMITS,
        clientId: request.headers.get("cf-connecting-ip") ?? "unknown",
        origin: url.origin,
        waitUntil: (promise) => ctx?.waitUntil(promise),
        ...overrides,
      }),
    });
    if (path === "/guide") {
      const result = data as GuideResult;
      guide = result.fallback ? `rules (${result.fallback.reason})` : result.engine;
    }
    const body: ApiSuccess<unknown> = { data, meta: META };
    response = json(body, 200, { "cache-control": cacheControl(route, url) });
  } catch (error) {
    if (!(error instanceof ApiError)) console.error(JSON.stringify({ api: path, error: String(error) }));
    response = errorResponse(error instanceof ApiError ? error : new ApiError(500, "internal_error", "SkillTide's API could not answer."));
  }
  // One line per request for Workers Logs. Never the body: it holds the student's profile.
  console.log(JSON.stringify({ api: path, method: request.method, status: response.status, ms: Date.now() - started, ...(guide ? { guide } : {}) }));
  return response;
}
