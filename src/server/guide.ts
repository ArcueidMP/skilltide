// POST /guide. The rule-based guide always answers first. With AI wording on, a language model may
// rephrase SkillTide's facts; its reply is shown only if every number in it appears in the facts it cites.

import { respond, suggestionsFor, type AgentContext } from "@/lib/agent";
import { computeMatches } from "@/lib/analysis";
import { fromApiProfile, type GuideFallbackReason, type GuideRequest, type GuideResult } from "@/lib/api-types";
import { cite, roleById, scenarioById, snapshotById } from "@/lib/data";
import type { Locale } from "@/lib/i18n";
import type { Citation } from "@/lib/types";
import { COMMON, snapshotName } from "@/messages/common";
import { GUIDE } from "@/messages/guide";
import { LABELS } from "@/messages/labels";
import type { WindowLimiter } from "./limiter";
import { outlooksFor } from "./memo";
import { openAiConfig, ProviderError, wordWithOpenAI, type GuideReply, type OpenAiEnv } from "./openai";

export interface EdgeCache {
  match(request: Request): Promise<Response | undefined>;
  put(request: Request, response: Response): Promise<void>;
}

export interface GuideDeps {
  env: OpenAiEnv;
  fetch: typeof fetch;
  cache: EdgeCache | null;
  limits: { client: WindowLimiter; instance: WindowLimiter };
  clientId: string;
  origin: string;
  waitUntil: (promise: Promise<unknown>) => void;
}

/** Bump when the instructions or the fact format change, so cached answers are not reused. */
const PROMPT_VERSION = 3;
const CACHE_SECONDS = 7 * 24 * 60 * 60;

const ANSWER_LANGUAGE: Record<Locale, string> = {
  en: 'Write plain English in at most 120 words, without headings or Markdown, and address the student as "you".',
  ms: 'Write plain Bahasa Melayu in at most 120 words, without headings or Markdown, and address the student as "anda".',
  zh: 'Write plain Simplified Chinese in at most 200 characters, without headings or Markdown, and address the student as "你".',
};

export function guideInstructions(locale: Locale): string {
  return [
    "You are the SkillTide Guide. You help a final-year student in Malaysia understand SkillTide's career analysis.",
    "Answer the student's question using only the numbered facts, which come from SkillTide's own data and scoring.",
    "Never add a job, course, skill, statistic, date or number that is not in the facts. Copy every number exactly as the facts write it, in digits; do not calculate, round or estimate.",
    "When you give a job-postings figure, say it comes from Indeed postings in the US, UK and Australia, which leave out Malaysia.",
    "If the facts do not answer the question, say that SkillTide's data does not cover it and suggest one question it can answer.",
    "Keep role, skill, course and source names in English, as the facts write them.",
    ANSWER_LANGUAGE[locale],
    'Return JSON: "answer" is your reply and "facts" lists the ids of the facts you used, such as "F1".',
  ].join("\n");
}

export interface Fact {
  id: string;
  /** The guide question this fact answers, when it is a rule-based answer. */
  question?: string;
  text: string;
  citations: Citation[];
}

export function guideContext(request: GuideRequest): AgentContext {
  const { outlooks, trends } = outlooksFor(request.snapshot, request.scenario);
  const { snapshot, scenario, weights, profile, targetRoleId } = request;
  const analysis = profile ? computeMatches({ snapshot, scenario, weights, profile, targetRoleId }, outlooks) : null;
  return {
    pathname: request.page,
    locale: request.locale,
    profile: profile ? fromApiProfile(profile) : null,
    weights: request.weights,
    snapshot: snapshotById(request.snapshot),
    scenario: scenarioById(request.scenario),
    matches: analysis?.matches ?? [],
    outlooks,
    trends,
    pathway: analysis?.pathway ?? null,
  };
}

/**
 * The rule-based answers that could matter for this question, plus the student's current results, in
 * the student's language: the page's suggestions and the data-source answer are the ones they can see.
 */
export function buildFacts(request: GuideRequest, context: AgentContext, ruleAnswer: ReturnType<typeof respond>): Fact[] {
  const t = GUIDE[request.locale];
  const facts: Fact[] = [];
  const add = (text: string, citations: Citation[] = [], question?: string) => {
    const clean = text.trim();
    if (clean && !facts.some((fact) => fact.text === clean)) facts.push({ id: `F${facts.length + 1}`, question, text: clean, citations });
  };
  const addAnswer = (question: string, answer = respond(question, context)) => {
    if (answer.kind !== "info") add(answer.text, answer.citations, question);
  };

  addAnswer(request.question, ruleAnswer);
  for (const question of [...suggestionsFor(request.page, request.locale), t.questions.source]) addAnswer(question);

  const { snapshot, scenario, matches, pathway } = context;
  if (snapshot && scenario) {
    add(t.facts.viewing({ scenario: LABELS[request.locale].scenario[scenario.id], snapshot: snapshotName(COMMON[request.locale], snapshot) }));
  }
  if (matches.length) {
    const top = matches
      .slice(0, 3)
      .map((match, index) => t.facts.match(index + 1, roleById(match.roleId)?.title ?? match.roleId, Math.round(match.score), Math.round(match.outlook.score)));
    add(t.facts.topMatches(top), cite(snapshot?.sources.slice(0, 2) ?? []));
  }
  if (pathway) {
    const steps = pathway.steps.map((step) =>
      step.course
        ? t.facts.course(step.course.title, step.course.provider, step.hours, t.price[step.course.cost])
        : t.facts.project(step.task?.statement ?? null, step.hours),
    );
    add(
      t.facts.pathway(roleById(pathway.roleId)?.title ?? pathway.roleId, Math.round(pathway.totalHours), pathway.totalWeeks, steps),
      cite([...new Set(pathway.steps.flatMap((step) => step.course?.sources ?? []))]),
    );
  }
  return facts;
}

export function guideInput(request: GuideRequest, facts: Fact[]): string {
  return [
    `Page: ${request.page}`,
    `Student's question: ${request.question}`,
    "",
    "Facts:",
    ...facts.map((fact) => `[${fact.id}]${fact.question ? ` Answer to "${fact.question}":` : ""} ${fact.text}`),
  ].join("\n");
}

const numbersIn = (text: string) => text.replace(/(\d),(?=\d{3}\b)/g, "$1").match(/\d+(?:\.\d+)?/g) ?? [];

/**
 * Accepts a reply only if every fact id it gives exists and every number it writes appears in those
 * facts. This catches invented figures; it cannot prove each number is used in the right place.
 */
export function groundReply(reply: GuideReply, facts: Fact[]): { text: string; citations: Citation[] } | null {
  const text = reply.answer.replace(/\s*\[F\d+(?:\s*,\s*F\d+)*\]/g, "").trim();
  if (!text || text.length > 1500) return null;
  const ids = new Set(reply.facts);
  const used = facts.filter((fact) => ids.has(fact.id));
  if (used.length !== ids.size) return null;
  const allowed = new Set(used.flatMap((fact) => numbersIn(fact.text)));
  if (numbersIn(text).some((number) => !allowed.has(number))) return null;
  const citations = used
    .flatMap((fact) => fact.citations)
    .filter((citation, index, all) => all.findIndex((other) => other.label === citation.label && other.url === citation.url) === index);
  return { text, citations };
}

async function sha256(text: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function cached(cache: EdgeCache | null, key: Request): Promise<GuideResult | null> {
  try {
    const hit = await cache?.match(key);
    return hit ? ((await hit.json()) as GuideResult) : null;
  } catch {
    return null;
  }
}

const withFallback = (result: GuideResult, reason: GuideFallbackReason, status?: number): GuideResult => ({
  ...result,
  fallback: status ? { reason, status } : { reason },
});

export async function answerGuide(request: GuideRequest, deps: GuideDeps): Promise<GuideResult> {
  const context = guideContext(request);
  const ruleAnswer = respond(request.question, context);
  const rules: GuideResult = {
    text: ruleAnswer.text,
    citations: ruleAnswer.citations ?? [],
    kind: ruleAnswer.kind === "info" ? "info" : "answer",
    engine: "rules",
  };
  if (!request.ai) return rules;
  const config = openAiConfig(deps.env);
  if (!config) return withFallback(rules, "not-configured");

  const facts = buildFacts(request, context, ruleAnswer);
  const input = guideInput(request, facts);
  // Identical questions on identical results reuse one answer: no second model call.
  const key = new Request(`${deps.origin}/api/v1/_guide-cache/${await sha256(JSON.stringify([PROMPT_VERSION, config.model, config.effort, request.locale, input]))}`);
  const hit = await cached(deps.cache, key);
  if (hit) return hit;
  if (!deps.limits.client.take(deps.clientId) || !deps.limits.instance.take("all")) return withFallback(rules, "rate-limited");

  try {
    const grounded = groundReply(await wordWithOpenAI(config, guideInstructions(request.locale), input, deps.fetch), facts);
    if (!grounded) return withFallback(rules, "ungrounded");
    const result: GuideResult = { ...grounded, kind: "answer", engine: "ai", model: config.model };
    if (deps.cache) {
      const stored = new Response(JSON.stringify(result), {
        headers: { "content-type": "application/json", "cache-control": `max-age=${CACHE_SECONDS}` },
      });
      deps.waitUntil(deps.cache.put(key, stored).catch(() => undefined));
    }
    return result;
  } catch (error) {
    if (error instanceof ProviderError) return withFallback(rules, error.reason, error.status);
    throw error;
  }
}
