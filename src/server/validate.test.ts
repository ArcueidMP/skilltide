import { describe, expect, it } from "vitest";
import { ApiError } from "./http";
import { parseGuideRequest } from "./validate";

const base = {
  snapshot: "latest",
  scenario: "moderate",
  weights: { skills: 50, outlook: 30, sdg: 20 },
  profile: { skills: [{ skillId: "python", level: 2 }], sdgGoals: [9], hoursPerWeek: 8, budget: "free" },
  targetRoleId: null,
};

function problems(run: () => unknown): string[] {
  try {
    run();
  } catch (error) {
    if (error instanceof ApiError) return error.details ?? [];
    throw error;
  }
  return [];
}

describe("guide language", () => {
  const guide = { ...base, question: "Is this fair?", page: "/match", ai: false };

  it("answers in English when no language is given", () => {
    expect(parseGuideRequest(guide).locale).toBe("en");
    expect(parseGuideRequest({ ...guide, locale: "zh" }).locale).toBe("zh");
  });

  it("rejects languages SkillTide does not offer", () => {
    expect(problems(() => parseGuideRequest({ ...guide, locale: "fr" }))[0]).toMatch(/^locale must be one of/);
  });
});
