// Calls OpenAI's Responses API to word a Guide answer. The model sees only SkillTide's own facts and must
// name the facts it used; guide.ts checks the reply against them before anyone sees it.

import type { GuideFallbackReason } from "@/lib/api-types";

export const OPENAI_URL = "https://api.openai.com/v1/responses";
export const DEFAULT_MODEL = "gpt-6-luna";
const TIMEOUT_MS = 12_000;

export interface OpenAiEnv {
  /** A Worker secret; never in wrangler.jsonc or the repository. */
  OPENAI_API_KEY?: string;
  OPENAI_MODEL?: string;
  /** Reasoning effort to request, e.g. "none"; omitted when empty. */
  OPENAI_REASONING_EFFORT?: string;
}

export interface OpenAiConfig {
  apiKey: string;
  model: string;
  effort: string | null;
}

export function openAiConfig(env: OpenAiEnv): OpenAiConfig | null {
  const apiKey = env.OPENAI_API_KEY?.trim();
  if (!apiKey) return null;
  return { apiKey, model: env.OPENAI_MODEL?.trim() || DEFAULT_MODEL, effort: env.OPENAI_REASONING_EFFORT?.trim() || null };
}

export class ProviderError extends Error {
  constructor(
    readonly reason: GuideFallbackReason,
    readonly status?: number,
  ) {
    super(`OpenAI: ${reason}${status ? ` (HTTP ${status})` : ""}`);
    this.name = "ProviderError";
  }
}

export interface GuideReply {
  answer: string;
  /** Ids of the facts the answer relies on, e.g. "F2". */
  facts: string[];
}

const REPLY_SCHEMA = {
  type: "object",
  properties: {
    answer: { type: "string", description: "The reply to the student." },
    facts: { type: "array", items: { type: "string" }, description: "Ids of the facts the reply uses, such as F1." },
  },
  required: ["answer", "facts"],
  additionalProperties: false,
};

interface ResponsesBody {
  status?: string;
  output?: { type?: string; content?: { type?: string; text?: string }[] }[];
}

export async function wordWithOpenAI(config: OpenAiConfig, instructions: string, input: string, fetcher: typeof fetch): Promise<GuideReply> {
  let response: Response;
  try {
    response = await fetcher(OPENAI_URL, {
      method: "POST",
      headers: { authorization: `Bearer ${config.apiKey}`, "content-type": "application/json" },
      body: JSON.stringify({
        model: config.model,
        instructions,
        input,
        max_output_tokens: 800,
        // Do not keep the response on OpenAI's side for later retrieval.
        store: false,
        ...(config.effort ? { reasoning: { effort: config.effort } } : {}),
        text: { format: { type: "json_schema", name: "guide_answer", strict: true, schema: REPLY_SCHEMA } },
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (error) {
    throw new ProviderError((error as { name?: string } | null)?.name === "TimeoutError" ? "timeout" : "provider-error");
  }
  if (!response.ok) {
    // Enough to diagnose a wrong model or parameter. OpenAI's message can quote part of the key, so it is not logged.
    const detail = ((await response.json().catch(() => null)) as { error?: { type?: string; code?: string; param?: string } } | null)?.error;
    console.error(JSON.stringify({ openai: response.status, type: detail?.type, code: detail?.code, param: detail?.param }));
    throw new ProviderError("provider-error", response.status);
  }

  const body = (await response.json().catch(() => null)) as (ResponsesBody & { incomplete_details?: { reason?: string } }) | null;
  if (body?.status !== "completed") {
    console.error(JSON.stringify({ openai: body?.status ?? "unreadable", reason: body?.incomplete_details?.reason }));
    throw new ProviderError("provider-error");
  }
  const parts = (body.output ?? []).filter((item) => item.type === "message").flatMap((item) => item.content ?? []);
  if (parts.some((part) => part.type === "refusal")) throw new ProviderError("refused");
  try {
    const reply = JSON.parse(parts.find((part) => part.type === "output_text")?.text ?? "") as Partial<GuideReply>;
    if (typeof reply.answer === "string" && Array.isArray(reply.facts) && reply.facts.every((id) => typeof id === "string")) {
      return { answer: reply.answer, facts: reply.facts };
    }
  } catch {
    // Not JSON despite the schema: treated like any other failed reply below.
  }
  throw new ProviderError("provider-error");
}
