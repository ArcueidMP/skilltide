// Sends a Guide question to SkillTide's API. If the API cannot be reached, the same rule-based guide
// answers in the browser.

import { GUIDE_NOTES } from "@/messages/guide";
import { respond, type AgentContext, type AgentMessage } from "./agent";
import { skilltideApi } from "./api";
import type { GuideRequest } from "./api-types";

export type GuideReply = Omit<AgentMessage, "id">;

export async function askGuide(
  question: string,
  context: AgentContext,
  request: Omit<GuideRequest, "question" | "page">,
): Promise<GuideReply> {
  // Why AI wording fell back to the rules, in the language the answer is in.
  const notes = GUIDE_NOTES[request.locale];
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
      note: fallback ? `${notes.reasons[fallback.reason]}${fallback.status ? notes.status(fallback.status) : ""}` : undefined,
    };
  } catch {
    return { ...respond(question, context), engine: "rules", note: request.ai ? notes.reasons.offline : undefined };
  }
}
