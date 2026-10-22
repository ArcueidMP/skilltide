import { describe, expect, it } from "vitest";
import { dataset } from "@/lib/data";
import { ApiError } from "./http";
import { parseGuideRequest, parseMatchesRequest } from "./validate";

const base = {
  snapshot: "latest",
  scenario: "moderate",
  weights: { skills: 50, outlook: 30, sdg: 20 },
  profile: { skills: [{ skillId: "python", level: 2 }], sdgGoals: [9], hoursPerWeek: 8, budget: "free" },
  targetRoleId: null,
};
const course = dataset.courses[0].id;
const task = dataset.roles[0].tasks[0].id;

function problems(run: () => unknown): string[] {
  try {
    run();
  } catch (error) {
    if (error instanceof ApiError) return error.details ?? [];
    throw error;
  }
  return [];
}

describe("finished pathway steps", () => {
  it("reads a missing list as none and keeps known ids once", () => {
    expect(parseMatchesRequest(base).done).toEqual({ courses: [], tasks: [] });
    expect(parseMatchesRequest({ ...base, done: { courses: [course, course], tasks: [task] } }).done).toEqual({
      courses: [course],
      tasks: [task],
    });
  });

  it("rejects ids that are not in the dataset", () => {
    expect(problems(() => parseMatchesRequest({ ...base, done: { courses: ["made-up-course"], tasks: [] } }))).toContain(
      "done.courses[0] is not a SkillTide id",
    );
    expect(problems(() => parseMatchesRequest({ ...base, done: { courses: [], tasks: "1351" } }))).toHaveLength(1);
  });
});

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
