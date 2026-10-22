import { beforeAll, describe, expect, it, vi } from "vitest";
import { respond, type AgentContext } from "@/lib/agent";
import { computeCohort, computeComparison, computeMatches, computeOutlooks } from "@/lib/analysis";
import { toApiProfile, type GuideRequest, type GuideResult, type MatchesRequest, type MatchesResult } from "@/lib/api-types";
import { dataset, datasetVersion, scenarioById, snapshotById } from "@/lib/data";
import { extractSkills, type RoleMatch } from "@/lib/engine";
import type { Locale } from "@/lib/i18n";
import { SAMPLE_PERSONAS } from "@/lib/samples";
import type { ScenarioId } from "@/lib/types";
import { GUIDE } from "@/messages/guide";
import { handleApi } from "./api";
import { buildFacts, guideContext, guideInput, type EdgeCache, type Fact, type GuideDeps } from "./guide";
import { WindowLimiter } from "./limiter";
import { DEFAULT_MODEL, OPENAI_URL } from "./openai";

const ORIGIN = "https://xmumhkt.arcueidmp.com";
const WEIGHTS = { skills: 50, outlook: 30, sdg: 20 };
const SAME_SITE = { "sec-fetch-site": "same-origin" };
const SCENARIOS: ScenarioId[] = ["moderate", "fast"];

const students = SAMPLE_PERSONAS.map((persona) => ({
  id: persona.id,
  profile: { ...persona.profile, skills: extractSkills(persona.cv, dataset.skills) },
}));
const kavin = students.find((student) => student.id === "kavin")!.profile;

const roundTrip = <T>(value: T): T => JSON.parse(JSON.stringify(value));
const withoutOutlook = (match: RoleMatch) => {
  const copy: Partial<RoleMatch> = { ...match };
  delete copy.outlook;
  return copy;
};

function get(path: string, headers: Record<string, string> = SAME_SITE) {
  return handleApi(new Request(`${ORIGIN}/api/v1${path}`, { headers }), {});
}

function post(path: string, body: unknown, options: { headers?: Record<string, string>; env?: Record<string, string>; deps?: Partial<GuideDeps> } = {}) {
  const request = new Request(`${ORIGIN}/api/v1${path}`, {
    method: "POST",
    headers: { ...SAME_SITE, "content-type": "application/json", ...options.headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
  return handleApi(request, options.env ?? {}, undefined, options.deps);
}

async function dataOf<T>(response: Response): Promise<T> {
  expect(response.status).toBe(200);
  return ((await response.json()) as { data: T }).data;
}

const matchesRequest = (profile = kavin, scenario: ScenarioId = "moderate"): MatchesRequest => ({
  snapshot: "latest",
  scenario,
  weights: WEIGHTS,
  profile: toApiProfile(profile),
  targetRoleId: null,
});

beforeAll(() => {
  // handleApi logs one line per request for Workers Logs, and OpenAI failures as errors.
  vi.spyOn(console, "log").mockImplementation(() => undefined);
  vi.spyOn(console, "error").mockImplementation(() => undefined);
});

describe("API results", () => {
  it("match the browser's engine for every sample student and scenario", async () => {
    for (const student of students) {
      for (const scenario of SCENARIOS) {
        const request = matchesRequest(student.profile, scenario);
        const result = await dataOf<MatchesResult>(await post("/matches", request));
        const local = computeMatches(request, computeOutlooks("latest", scenario).outlooks);
        expect(result, `${student.id} · ${scenario}`).toEqual(roundTrip({ ...local, matches: local.matches.map(withoutOutlook) }));
      }
    }
  });

  it("serve outlooks, comparisons and cohort summaries exactly as computed in the browser", async () => {
    const local = computeOutlooks("2025-03", "fast");
    expect(await dataOf(await get("/outlooks?snapshot=2025-03&scenario=fast"))).toEqual(
      roundTrip({ roles: [...local.outlooks.values()], skills: local.trends }),
    );
    const compare = { snapshot: "latest", weights: WEIGHTS, profile: toApiProfile(kavin) };
    expect(await dataOf(await post("/scenarios/compare", compare))).toEqual(roundTrip(computeComparison(compare)));
    expect(await dataOf(await get("/cohort?snapshot=latest&scenario=moderate"))).toEqual(roundTrip(computeCohort("latest", "moderate")));
  });

  it("reports no comparison for a profile without skills", async () => {
    const empty = { snapshot: "latest", weights: WEIGHTS, profile: { ...toApiProfile(kavin), skills: [] } };
    expect(await dataOf(await post("/scenarios/compare", empty))).toBeNull();
  });

  it("gives the same rule-based guide answers as the browser with the full profile, in every language", async () => {
    const cases: [string, string, Locale][] = [
      ["/match", "Why is my top role ranked first?", "en"],
      ["/match", "What changes under Fast AI?", "en"],
      ["/pathway", "What should I learn first?", "en"],
      ["/profile", "Is my CV stored anywhere?", "en"],
      ["/match", "Kenapa peranan teratas saya berada di tempat pertama?", "ms"],
      ["/pathway", "Berapa kos kursus dalam laluan saya?", "ms"],
      ["/radar", "这些数据从哪里来？", "zh"],
      ["/pathway", "我应该先学什么？", "zh"],
      // Asked in English with the interface in Chinese: the answer follows the interface.
      ["/match", "What changes under Fast AI?", "zh"],
    ];
    for (const [page, question, locale] of cases) {
      const request: GuideRequest = { ...matchesRequest(), question, page, ai: false, locale };
      const result = await dataOf<GuideResult>(await post("/guide", request));
      const { outlooks, trends } = computeOutlooks("latest", "moderate");
      const analysis = computeMatches(matchesRequest(), outlooks);
      const browser: AgentContext = {
        pathname: page,
        locale,
        profile: kavin,
        weights: WEIGHTS,
        snapshot: snapshotById("latest"),
        scenario: scenarioById("moderate"),
        matches: analysis.matches,
        outlooks,
        trends,
        pathway: analysis.pathway,
      };
      const expected = respond(question, browser);
      expect(result.engine).toBe("rules");
      expect(result.text, question).toBe(expected.text);
      expect(result.citations).toEqual(roundTrip(expected.citations ?? []));
      if (locale !== "en") expect(result.text, question).not.toBe(respond(question, { ...browser, locale: "en" }).text);
      if (locale === "zh") expect(result.text, question).toMatch(/[一-鿿]/);
    }
  });

  it("answers in English when an older page sends no language", async () => {
    const request: Partial<GuideRequest> = { ...matchesRequest(), question: "Is my CV stored anywhere?", page: "/profile", ai: false };
    expect((await dataOf<GuideResult>(await post("/guide", request))).text).toBe(GUIDE.en.privacy);
  });
});

describe("API privacy", () => {
  it("ignores fields scoring does not use, such as a name or CV evidence", async () => {
    const plain = await (await post("/matches", matchesRequest())).text();
    const extra = {
      ...matchesRequest(),
      profile: {
        ...toApiProfile(kavin),
        name: kavin.name,
        graduation: kavin.graduation,
        skills: kavin.skills.map((claim) => ({ ...claim, evidence: "a phrase from the CV" })),
      },
    };
    const withExtras = await (await post("/matches", extra)).text();
    expect(withExtras).toBe(plain);
    expect(withExtras).not.toContain(kavin.name);
    expect(withExtras).not.toContain("a phrase from the CV");
  });

  it("never sends a name or evidence from the browser", () => {
    const sent = JSON.stringify(toApiProfile({ ...kavin, skills: kavin.skills.map((claim) => ({ ...claim, evidence: "a phrase from the CV" })) }));
    expect(sent).not.toContain(kavin.name);
    expect(sent).not.toContain("evidence");
    expect(sent).not.toContain("graduation");
  });
});

describe("API requests", () => {
  it("rejects requests that do not match the dataset, listing each problem", async () => {
    const response = await post("/matches", {
      snapshot: "1999-01",
      scenario: "slow",
      weights: { skills: 500, outlook: 30, sdg: 20 },
      profile: { skills: [{ skillId: "telepathy", level: 2 }, { skillId: "python", level: 7 }], sdgGoals: [18], hoursPerWeek: 0, budget: "lots" },
      targetRoleId: "astronaut",
    });
    expect(response.status).toBe(400);
    const { error } = (await response.json()) as { error: { code: string; details: string[] } };
    expect(error.code).toBe("invalid_request");
    expect(error.details).toEqual(
      expect.arrayContaining([
        expect.stringContaining("snapshot"),
        expect.stringContaining("scenario"),
        expect.stringContaining("weights.skills"),
        expect.stringContaining("profile.skills[0].skillId"),
        expect.stringContaining("profile.skills[1].level"),
        expect.stringContaining("profile.sdgGoals[0]"),
        expect.stringContaining("profile.hoursPerWeek"),
        expect.stringContaining("profile.budget"),
        expect.stringContaining("targetRoleId"),
      ]),
    );
  });

  it("answers malformed and unexpected requests with the right status", async () => {
    expect((await post("/matches", "{not json")).status).toBe(400);
    expect((await post("/matches", "{}", { headers: { "content-type": "text/plain" } })).status).toBe(415);
    expect((await post("/matches", JSON.stringify({ padding: "x".repeat(20_000) }))).status).toBe(413);
    const wrongMethod = await get("/matches");
    expect(wrongMethod.status).toBe(405);
    expect(wrongMethod.headers.get("allow")).toBe("POST");
    expect((await get("/nothing-here")).status).toBe(404);
    expect((await post("/guide", { ...matchesRequest(), question: "", page: "/match", ai: false })).status).toBe(400);
  });

  it("serves only SkillTide's own pages", async () => {
    expect((await post("/matches", matchesRequest(), { headers: { "sec-fetch-site": "cross-site" } })).status).toBe(403);
    expect((await get("/health", { "sec-fetch-site": "same-site" })).status).toBe(403);
    // Typed into the address bar, or called by a script: no Sec-Fetch-Site restriction applies.
    expect((await get("/health", { "sec-fetch-site": "none" })).status).toBe(200);
    expect((await get("/health", {})).status).toBe(200);
  });

  it("tells a page built from other data to reload", async () => {
    expect((await post("/matches", matchesRequest(), { headers: { "x-skilltide-dataset": "000000000000" } })).status).toBe(409);
    expect((await get("/outlooks?snapshot=latest&scenario=fast&v=000000000000")).status).toBe(409);
    expect((await post("/matches", matchesRequest(), { headers: { "x-skilltide-dataset": datasetVersion } })).status).toBe(200);
  });

  it("lets browsers cache versioned reads and nothing personal", async () => {
    expect((await get(`/outlooks?snapshot=latest&scenario=fast&v=${datasetVersion}`)).headers.get("cache-control")).toBe("public, max-age=31536000, immutable");
    expect((await get("/outlooks?snapshot=latest&scenario=fast")).headers.get("cache-control")).toBe("public, max-age=300");
    expect((await post("/matches", matchesRequest())).headers.get("cache-control")).toBe("no-store");
    expect((await get("/health")).headers.get("cache-control")).toBe("no-store");
  });

  it("reports whether AI wording is configured without revealing the key", async () => {
    const configured = await handleApi(new Request(`${ORIGIN}/api/v1/health`), { OPENAI_API_KEY: "test-key" });
    const text = await configured.text();
    expect(JSON.parse(text).data.ai).toEqual({ configured: true, model: DEFAULT_MODEL });
    expect(text).not.toContain("test-key");
  });
});

describe("Guide AI wording", () => {
  const ENV = { OPENAI_API_KEY: "test-key" };
  const question = "Why is my top role ranked first?";
  const request = (overrides: Partial<GuideRequest> = {}): GuideRequest => ({ ...matchesRequest(), question, page: "/match", ai: true, locale: "en", ...overrides });
  const factsFor = (r: GuideRequest) => {
    const context = guideContext(r);
    return buildFacts(r, context, respond(r.question, context));
  };
  const openAiReply = (answer: string, facts: string[]) =>
    new Response(JSON.stringify({ status: "completed", output: [{ type: "message", content: [{ type: "output_text", text: JSON.stringify({ answer, facts }) }] }] }), {
      headers: { "content-type": "application/json" },
    });
  const deps = (fetcher: typeof fetch, overrides: Partial<GuideDeps> = {}): Partial<GuideDeps> => ({
    fetch: fetcher,
    cache: null,
    limits: { client: new WindowLimiter(6, 60_000), instance: new WindowLimiter(30, 60_000) },
    clientId: "test",
    ...overrides,
  });
  const ask = async (r: GuideRequest, fetcher: typeof fetch, overrides: Partial<GuideDeps> = {}, env: Record<string, string> = ENV) =>
    dataOf<GuideResult>(await post("/guide", r, { env, deps: deps(fetcher, overrides) }));
  const rules = async (r: GuideRequest) => dataOf<GuideResult>(await post("/guide", { ...r, ai: false }));

  it("shows a reply whose numbers all come from the facts it cites", async () => {
    const facts = factsFor(request());
    const firstLine = facts[0].text.split("\n")[0];
    const fetcher = vi.fn<typeof fetch>(async () => openAiReply(`In short: ${firstLine}`, [facts[0].id]));
    const result = await ask(request(), fetcher);
    expect(result).toMatchObject({ engine: "ai", model: DEFAULT_MODEL, text: `In short: ${firstLine}` });
    expect(result.citations).toEqual(roundTrip(facts[0].citations));
    expect(result.fallback).toBeUndefined();
  });

  it("sends OpenAI the question and SkillTide's facts, and asks it to store nothing", async () => {
    const fetcher = vi.fn<typeof fetch>(async () => openAiReply("SkillTide's data does not cover that.", []));
    await ask(request(), fetcher, {}, { ...ENV, OPENAI_REASONING_EFFORT: "none" });
    const [url, init] = fetcher.mock.calls[0];
    expect(url).toBe(OPENAI_URL);
    const body = JSON.parse(String(init?.body));
    expect(body).toMatchObject({ model: DEFAULT_MODEL, store: false, reasoning: { effort: "none" }, text: { format: { type: "json_schema", strict: true } } });
    expect(body.input).toContain(question);
    expect(body.input).toContain(factsFor(request())[0].text);
    expect(String(init?.body)).not.toContain(kavin.name);
    expect((init?.headers as Record<string, string>).authorization).toBe("Bearer test-key");
  });

  it("builds the facts in the student's language, with the same numbers and sources", () => {
    const english = factsFor(request());
    const numbers = (facts: Fact[]) => facts.flatMap((fact) => fact.text.match(/\d+(?:\.\d+)?/g) ?? []).sort();
    for (const locale of ["ms", "zh"] as const) {
      const local = factsFor(request({ locale }));
      const questions = local.flatMap((fact) => (fact.question ? [fact.question] : []));
      // The answers to the page's suggestions and to "Where does this data come from?", as the student sees them.
      expect(questions).toContain(GUIDE[locale].questions.source);
      expect(questions).not.toContain(GUIDE.en.questions.source);
      expect(local.map((fact) => fact.citations)).toEqual(english.map((fact) => fact.citations));
      expect(numbers(local)).toEqual(numbers(english));
      expect(guideInput(request({ locale }), local)).toContain(GUIDE[locale].questions.sure);
    }
  });

  it("discards a reply with a number the facts do not contain", async () => {
    const fetcher = vi.fn<typeof fetch>(async () => openAiReply("You have a 97% chance of landing this job.", ["F1"]));
    const result = await ask(request(), fetcher);
    expect(result).toMatchObject({ engine: "rules", fallback: { reason: "ungrounded" }, text: (await rules(request())).text });
  });

  it("discards a reply that cites a fact it was not given", async () => {
    const fetcher = vi.fn<typeof fetch>(async () => openAiReply("Your top role suits you.", ["F99"]));
    expect((await ask(request(), fetcher)).fallback).toEqual({ reason: "ungrounded" });
  });

  it("answers with the rules when OpenAI fails, times out or refuses", async () => {
    const failing = vi.fn<typeof fetch>(async () => new Response("{}", { status: 401 }));
    expect((await ask(request(), failing)).fallback).toEqual({ reason: "provider-error", status: 401 });

    const slow = vi.fn<typeof fetch>(async () => {
      throw Object.assign(new Error("The operation timed out."), { name: "TimeoutError" });
    });
    expect((await ask(request(), slow)).fallback).toEqual({ reason: "timeout" });

    const refusing = vi.fn<typeof fetch>(
      async () => new Response(JSON.stringify({ status: "completed", output: [{ type: "message", content: [{ type: "refusal", refusal: "No." }] }] })),
    );
    expect((await ask(request(), refusing)).fallback).toEqual({ reason: "refused" });

    const incomplete = vi.fn<typeof fetch>(async () => new Response(JSON.stringify({ status: "incomplete", output: [] })));
    expect((await ask(request(), incomplete)).fallback).toEqual({ reason: "provider-error" });
  });

  it("answers with the rules, without calling OpenAI, when no key is set", async () => {
    const fetcher = vi.fn<typeof fetch>();
    const result = await ask(request(), fetcher, {}, {});
    expect(result).toMatchObject({ engine: "rules", fallback: { reason: "not-configured" } });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("limits AI questions per client", async () => {
    const fetcher = vi.fn<typeof fetch>(async () => openAiReply("SkillTide's data does not cover that.", []));
    const limits = { client: new WindowLimiter(1, 60_000), instance: new WindowLimiter(30, 60_000) };
    expect((await ask(request(), fetcher, { limits })).engine).toBe("ai");
    expect((await ask(request({ question: "Can I do it for free?" }), fetcher, { limits })).fallback).toEqual({ reason: "rate-limited" });
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("reuses a cached answer instead of calling OpenAI again", async () => {
    const store = new Map<string, Response>();
    const cache: EdgeCache = {
      match: async (key) => store.get(key.url)?.clone(),
      put: async (key, response) => {
        store.set(key.url, response);
      },
    };
    const pending: Promise<unknown>[] = [];
    const fetcher = vi.fn<typeof fetch>(async () => openAiReply("SkillTide's data does not cover that.", []));
    const first = await ask(request(), fetcher, { cache, waitUntil: (promise) => pending.push(promise) });
    await Promise.all(pending);
    const second = await ask(request(), fetcher, { cache });
    expect(second).toEqual(first);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
});
