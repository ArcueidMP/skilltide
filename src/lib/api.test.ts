import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { handleApi } from "@/server/api";
import { computeMatches, computeOutlooks } from "./analysis";
import { getApiStatus, resetApiStatus, skilltideApi } from "./api";
import { toApiProfile, type MatchesRequest } from "./api-types";
import { dataset, datasetVersion } from "./data";
import { extractSkills } from "./engine";
import { resetResources, resource } from "./remote";
import { SAMPLE_PERSONAS } from "./samples";
import { loadMatches } from "./use-analysis";

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
const offline = () => vi.fn<typeof fetch>(async () => {
  throw new TypeError("Failed to fetch");
});
const roundTrip = <T>(value: T): T => JSON.parse(JSON.stringify(value));

const persona = SAMPLE_PERSONAS.find((p) => p.id === "aina")!;
const request: MatchesRequest = {
  snapshot: "2026-03",
  scenario: "fast",
  weights: { skills: 40, outlook: 40, sdg: 20 },
  profile: toApiProfile({ ...persona.profile, skills: extractSkills(persona.cv, dataset.skills) }),
  targetRoleId: null,
  done: { courses: [], tasks: [] },
};

beforeAll(() => {
  vi.spyOn(console, "log").mockImplementation(() => undefined);
});

beforeEach(() => {
  resetApiStatus();
  resetResources();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("API client", () => {
  it("sends the page's dataset version and reports the API online", async () => {
    const fetcher = vi.fn<typeof fetch>(async () => json({ data: { roles: [], skills: [] }, meta: {} }));
    vi.stubGlobal("fetch", fetcher);
    await expect(skilltideApi.outlooks("latest", "moderate")).resolves.toEqual({ roles: [], skills: [] });
    const [url, init] = fetcher.mock.calls[0];
    expect(String(url)).toBe(`/api/v1/outlooks?snapshot=latest&scenario=moderate&v=${datasetVersion}`);
    expect((init?.headers as Record<string, string>)["x-skilltide-dataset"]).toBe(datasetVersion);
    expect(getApiStatus()).toBe("online");
  });

  it("stops calling an unreachable API for a while", async () => {
    const fetcher = offline();
    vi.stubGlobal("fetch", fetcher);
    await expect(skilltideApi.outlooks("latest", "moderate")).rejects.toThrow();
    await expect(skilltideApi.cohort("latest", "moderate")).rejects.toThrow();
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(getApiStatus()).toBe("offline");
  });

  it("treats a static host's HTML 404 page as no API", async () => {
    vi.stubGlobal("fetch", vi.fn<typeof fetch>(async () => new Response("<!doctype html>", { status: 404, headers: { "content-type": "text/html" } })));
    await expect(skilltideApi.outlooks("latest", "moderate")).rejects.toThrow();
    expect(getApiStatus()).toBe("offline");
  });

  it("stops using the API once it serves newer data than the page", async () => {
    const fetcher = vi.fn<typeof fetch>(async () => json({ error: { code: "dataset_mismatch" } }, 409));
    vi.stubGlobal("fetch", fetcher);
    await expect(skilltideApi.matches(request)).rejects.toThrow();
    await expect(skilltideApi.matches(request)).rejects.toThrow();
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(getApiStatus()).toBe("outdated");
  });

  it("keeps using the API after it rejects one bad request", async () => {
    vi.stubGlobal("fetch", vi.fn<typeof fetch>(async () => json({ error: { code: "invalid_request" } }, 400)));
    await expect(skilltideApi.matches(request)).rejects.toThrow();
    expect(getApiStatus()).not.toBe("offline");
  });
});

describe("results with a browser fallback", () => {
  it("come from the API and match the browser's own computation", async () => {
    vi.stubGlobal("fetch", vi.fn<typeof fetch>((input, init) => handleApi(new Request(new URL(String(input), "https://xmumhkt.arcueidmp.com"), init), {})));
    const settled = await loadMatches(request);
    expect(settled.computedBy).toBe("api");
    expect(roundTrip(settled.value)).toEqual(roundTrip(computeMatches(request, computeOutlooks(request.snapshot, request.scenario).outlooks)));
  });

  it("are computed in the browser when the API is unreachable", async () => {
    vi.stubGlobal("fetch", offline());
    const settled = await loadMatches(request);
    expect(settled.computedBy).toBe("browser");
    expect(settled.value).toEqual(computeMatches(request, computeOutlooks(request.snapshot, request.scenario).outlooks));
  });

  it("load each request once, however many components ask", async () => {
    const remote = vi.fn(async () => 1);
    const [a, b] = await Promise.all([resource("same", remote, () => 0), resource("same", remote, () => 0)]);
    expect(a).toBe(b);
    expect(await resource("same", remote, () => 0)).toBe(a);
    expect(remote).toHaveBeenCalledTimes(1);
  });
});
