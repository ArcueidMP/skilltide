// Sends a Guide question to SkillTide's API. If the API cannot be reached, the same rule-based guide
// answers in the browser.

import { respond, type AgentContext, type AgentMessage } from "./agent";
import { skilltideApi } from "./api";
import type { GuideFallbackReason, GuideRequest } from "./api-types";

export type GuideReply = Omit<AgentMessage, "id">;

const FALLBACK_NOTES: Record<GuideFallbackReason | "offline", string> = {
  "not-configured": "AI wording is not set up on this server, so this is the rule-based answer.",
  "rate-limited": "Too many AI questions in the last minute, so this is the rule-based answer. Try again shortly.",
  "provider-error": "OpenAI could not answer, so this is the rule-based answer.",
  timeout: "OpenAI took too long, so this is the rule-based answer.",
  refused: "OpenAI declined to word this answer, so this is the rule-based answer.",
  ungrounded: "The AI wording used a number that SkillTide's facts do not contain, so it was discarded. This is the rule-based answer.",
  offline: "SkillTide's API is unreachable, so this rule-based answer was worked out in your browser.",
};

export async function askGuide(
  question: string,
  context: AgentContext,
  request: Omit<GuideRequest, "question" | "page">,
): Promise<GuideReply> {
  try {
    const result = await skilltideApi.guide({ ...request, question, page: context.pathname });
    const fallback = result.fallback;
    return {
      role: "agent",
      kind: result.kind,
      text: result.text,
      citations: result.citations,
      engine: result.engine,
      model: result.model,
      note: fallback ? `${FALLBACK_NOTES[fallback.reason]}${fallback.status ? ` (HTTP ${fallback.status})` : ""}` : undefined,
    };
  } catch {
    return { ...respond(question, context), engine: "rules", note: request.ai ? FALLBACK_NOTES.offline : undefined };
  }
}
