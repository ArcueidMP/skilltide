// The browser's client for SkillTide's API. Callers fall back to the same engine in the browser when a
// call fails, so a failure here never stops a page.

import {
  API_PREFIX,
  DATASET_HEADER,
  type ApiSuccess,
  type CohortResult,
  type CompareRequest,
  type CompareResult,
  type GuideRequest,
  type GuideResult,
  type MatchesRequest,
  type MatchesResult,
  type OutlooksResult,
} from "./api-types";
import { datasetVersion } from "./data";
import type { ScenarioId } from "./types";

/**
 * idle: nothing asked yet · online: the last call worked · offline: unreachable, retried after a pause ·
 * outdated: the API has newer data than this page, so the page computes for itself until reloaded.
 */
export type ApiStatus = "idle" | "online" | "offline" | "outdated";

const TIMEOUT_MS = 5_000;
// The server allows OpenAI 12 seconds before answering with the rules.
const GUIDE_TIMEOUT_MS = 20_000;
const RETRY_AFTER_MS = 30_000;

let status: ApiStatus = "idle";
let retryAt = 0;
const listeners = new Set<() => void>();

function setStatus(next: ApiStatus) {
  if (status === next) return;
  status = next;
  listeners.forEach((listener) => listener());
}

export function subscribeApiStatus(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getApiStatus() {
  return status;
}

/** For tests. */
export function resetApiStatus() {
  status = "idle";
  retryAt = 0;
}

export class ApiUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ApiUnavailableError";
  }
}

function unreachable(reason: string): never {
  retryAt = Date.now() + RETRY_AFTER_MS;
  setStatus("offline");
  throw new ApiUnavailableError(reason);
}

async function call<T>(path: string, init: RequestInit = {}, timeoutMs = TIMEOUT_MS): Promise<T> {
  if (status === "outdated") throw new ApiUnavailableError("This page is older than the API's data.");
  if (status === "offline" && Date.now() < retryAt) throw new ApiUnavailableError("The API was unreachable a moment ago.");
  let response: Response;
  try {
    response = await fetch(`${API_PREFIX}${path}`, {
      ...init,
      headers: { ...(init.headers as Record<string, string> | undefined), [DATASET_HEADER]: datasetVersion },
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch {
    return unreachable("network");
  }
  if (response.status === 409) {
    setStatus("outdated");
    throw new ApiUnavailableError("The API serves newer data than this page.");
  }
  // A host without the Worker answers /api/* with its HTML 404 page.
  if (response.status >= 500 || !response.headers.get("content-type")?.includes("application/json")) {
    return unreachable(`HTTP ${response.status}`);
  }
  if (!response.ok) throw new Error(`SkillTide's API rejected the request (HTTP ${response.status}).`);
  const body = (await response.json()) as ApiSuccess<T>;
  setStatus("online");
  return body.data;
}

const post = (body: unknown): RequestInit => ({
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify(body),
});

// The dataset version in the URL makes these responses safe to cache for good.
const query = (snapshot: string, scenario: ScenarioId) => new URLSearchParams({ snapshot, scenario, v: datasetVersion }).toString();

export const skilltideApi = {
  outlooks: (snapshot: string, scenario: ScenarioId) => call<OutlooksResult>(`/outlooks?${query(snapshot, scenario)}`),
  cohort: (snapshot: string, scenario: ScenarioId) => call<CohortResult>(`/cohort?${query(snapshot, scenario)}`),
  matches: (request: MatchesRequest) => call<MatchesResult>("/matches", post(request)),
  compare: (request: CompareRequest) => call<CompareResult | null>("/scenarios/compare", post(request)),
  guide: (request: GuideRequest) => call<GuideResult>("/guide", post(request), GUIDE_TIMEOUT_MS),
};
