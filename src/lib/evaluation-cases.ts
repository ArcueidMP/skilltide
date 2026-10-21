import { dataset } from "./data";
import { extractSkills } from "./engine";
import { SAMPLE_PERSONAS } from "./samples";
import type { Profile, RoleFamily } from "./types";

export interface EvaluationCase {
  id: string;
  label: string;
  profile: Profile;
  expectedFamilies: RoleFamily[];
  rationale: string;
}

// Design expectations recorded before ranking this suite. These are author-defined
// family-level expectations, not labels supplied by independent career advisers.
const expectations: Record<string, { families: RoleFamily[]; rationale: string }> = {
  aina: { families: ["electronics", "energy"], rationale: "Circuit, PCB and solar projects support an electronics or energy starting point." },
  weijie: { families: ["software"], rationale: "Web development and software internship experience support software roles." },
  kavin: { families: ["automation"], rationale: "PLC, robotics and factory automation experience support automation roles." },
  nurul: { families: ["data-ai"], rationale: "Statistics, forecasting and reporting experience support data roles." },
};

const personas: EvaluationCase[] = SAMPLE_PERSONAS.map((sample) => ({
  id: sample.id,
  label: sample.profile.name,
  profile: { ...sample.profile, skills: extractSkills(sample.cv, dataset.skills) },
  expectedFamilies: expectations[sample.id].families,
  rationale: expectations[sample.id].rationale,
}));
const persona = (id: string) => personas.find((sample) => sample.id === id)!;
function variant(id: string, base: string, label: string, patch: Partial<Profile>, rationale: string): EvaluationCase {
  const original = persona(base);
  return { id, label, profile: { ...original.profile, ...patch, name: label }, expectedFamilies: original.expectedFamilies, rationale };
}

export const EVALUATION_CASES: EvaluationCase[] = [
  ...personas,
  { ...variant("empty", "weijie", "Empty intake", { skills: [] }, "No skills: exercise the intake boundary, with no relevance expectation."), expectedFamilies: [] },
  { ...variant("sparse", "weijie", "One coursework skill", { skills: [{ skillId: "python", level: 1 }] }, "One skill is insufficient for a meaningful family expectation; exclude from relevance coverage."), expectedFamilies: [] },
  variant("web-experienced", "weijie", "Strong web portfolio", {
    skills: ["javascript", "frontend", "backend", "sql", "git", "software-testing"].map((skillId) => ({ skillId, level: 3 })),
  }, "Applied web, API and testing skills should make software roles visible."),
  variant("embedded-experienced", "aina", "Embedded engineering portfolio", {
    skills: ["c-cpp", "embedded", "pcb", "python"].map((skillId) => ({ skillId, level: 3 })), sdgGoals: [9],
  }, "Embedded systems and PCB experience support electronics roles."),
  variant("free-only", "weijie", "Free-only web student", { budget: "free" }, "Same web profile as Wei Jie; constrain all suggested courses to free options."),
  variant("no-sdg", "aina", "Electronics without SDG preference", { sdgGoals: [] }, "Keep the same technical evidence while removing the optional SDG preference."),
  variant("two-hours", "kavin", "Automation student, 2 hours/week", { hoursPerWeek: 2 }, "Study availability changes the schedule, not existing skills or role fit."),
  variant("twenty-hours", "kavin", "Automation student, 20 hours/week", { hoursPerWeek: 20 }, "Compare the identical automation profile with ten times the weekly study availability."),
];
