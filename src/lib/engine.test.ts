import { describe, expect, it } from "vitest";
import {
  allOutlooks,
  buildPathway,
  extractSkills,
  fairnessCheck,
  projectExposure,
  rankRoles,
  roleOutlook,
  skillTrends,
} from "./engine";
import type { Dataset, Profile, ScenarioSpec } from "./types";

// Synthetic fixture for exercising the maths only; none of it is shown in the app.
const moderate: ScenarioSpec = { id: "moderate", label: "Moderate", adoptionRate: 0.15, automationDrift: 0, description: "", sources: [] };
const fast: ScenarioSpec = { id: "fast", label: "Fast", adoptionRate: 0.35, automationDrift: 0.15, description: "", sources: [] };

// Partial records are enough for the maths under test.
const dataset = {
  generatedAt: "2026-01-01",
  horizonYears: 3,
  sources: {},
  scenarios: [moderate, fast],
  skills: [
    { id: "python", name: "Python", aliases: ["python"], cluster: "software", sources: [] },
    { id: "cpp", name: "C++", aliases: ["c++"], cluster: "software", sources: [] },
    { id: "plc", name: "PLC programming", aliases: ["plc", "ladder logic"], cluster: "automation", sources: [] },
    { id: "testing", name: "Manual testing", aliases: ["manual testing"], cluster: "software", sources: [] },
  ],
  roles: [
    {
      id: "assisted",
      title: "Assisted role",
      family: "software",
      summary: "",
      tasks: [
        { id: "t1", statement: "Design systems", weight: 2 },
        { id: "t2", statement: "Review designs", weight: 1 },
      ],
      skills: [
        { skillId: "python", importance: 1, level: 2 },
        { skillId: "cpp", importance: 0.5, level: 2 },
      ],
      sdg: [{ targetId: "9.5", rationale: "", sources: [] }],
      sources: [],
    },
    {
      id: "automated",
      title: "Automated role",
      family: "software",
      summary: "",
      tasks: [
        { id: "t3", statement: "Run scripted checks", weight: 1 },
        { id: "t4", statement: "Uncovered task", weight: 1 },
      ],
      skills: [{ skillId: "testing", importance: 1, level: 2 }],
      sdg: [{ targetId: "8.2", rationale: "", sources: [] }],
      sources: [],
    },
    {
      id: "plant",
      title: "Plant role",
      family: "automation",
      summary: "",
      tasks: [{ id: "t5", statement: "Program controllers", weight: 1 }],
      skills: [
        { skillId: "plc", importance: 1, level: 2 },
        { skillId: "python", importance: 0.4, level: 1 },
      ],
      sdg: [{ targetId: "7.3", rationale: "", sources: [] }],
      sources: [],
    },
  ],
  courses: [
    { id: "c-py", title: "Python basics", provider: "X", url: "https://example.org/py", hours: 20, cost: "free", level: "intro", skills: ["python"], sources: [] },
    { id: "c-cpp", title: "C++ paid", provider: "X", url: "https://example.org/cpp", hours: 30, cost: "low", level: "intermediate", skills: ["cpp"], sources: [] },
    { id: "c-plc", title: "PLC intro", provider: "X", url: "https://example.org/plc", hours: 12, cost: "free", level: "intro", skills: ["plc"], sources: [] },
  ],
  sdgGoals: [],
  sdgTargets: [],
  snapshots: [
    {
      id: "s1",
      asOf: "2026-01-01",
      label: "Jan 2026",
      sources: [],
      tasks: {
        t1: { current: 0.2, ceiling: 0.6, automation: 0.2 },
        t2: { current: 0.1, ceiling: 0.5, automation: 0.3 },
        t3: { current: 0.4, ceiling: 0.9, automation: 0.9 },
        t5: { current: 0.05, ceiling: 0.3, automation: 0.5 },
      },
      skills: { python: { momentum: 0.6 }, testing: { momentum: -0.5 } },
      roles: { assisted: { demand: 0.4 }, automated: { demand: -0.3 }, plant: { demand: 0.1 } },
    },
  ],
} as unknown as Dataset;

const snapshot = dataset.snapshots[0];

const student: Profile = {
  name: "Sample",
  programme: "ee",
  graduation: "2027",
  skills: [
    { skillId: "python", level: 1 },
    { skillId: "plc", level: 2 },
  ],
  interests: [],
  sdgGoals: [7],
  hoursPerWeek: 8,
  budget: "free",
};

const weights = { skills: 50, outlook: 30, sdg: 20 };

describe("projectExposure", () => {
  const signal = { current: 0.2, ceiling: 0.8, automation: 0.5 };

  it("starts at current use and never passes the ceiling", () => {
    expect(projectExposure(signal, 0.15, 0)).toBeCloseTo(0.2);
    expect(projectExposure(signal, 0.15, 50)).toBeLessThanOrEqual(0.8);
  });

  it("grows faster under a faster scenario", () => {
    expect(projectExposure(signal, fast.adoptionRate, 3)).toBeGreaterThan(
      projectExposure(signal, moderate.adoptionRate, 3),
    );
  });

  it("caps current use at the ceiling", () => {
    expect(projectExposure({ current: 0.9, ceiling: 0.5, automation: 0 }, 0.2, 1)).toBeCloseTo(0.5);
  });
});

describe("roleOutlook", () => {
  it("scores assisted work above automated work", () => {
    const assisted = roleOutlook(dataset.roles[0], snapshot, moderate, 3);
    const automated = roleOutlook(dataset.roles[1], snapshot, moderate, 3);
    expect(assisted.score).toBeGreaterThan(automated.score);
    expect(automated.displacement).toBeGreaterThan(assisted.displacement);
  });

  it("reports the share of task weight that has data", () => {
    expect(roleOutlook(dataset.roles[1], snapshot, moderate, 3).coverage).toBeCloseTo(0.5);
  });

  it("pushes automated work further down under the fast scenario", () => {
    const m = roleOutlook(dataset.roles[1], snapshot, moderate, 3);
    const f = roleOutlook(dataset.roles[1], snapshot, fast, 3);
    expect(f.score).toBeLessThan(m.score);
  });
});

describe("rankRoles", () => {
  const outlooks = allOutlooks(dataset, snapshot, moderate);

  it("blends the three components with the applied weights", () => {
    const [top] = rankRoles(student, dataset, snapshot, outlooks, weights);
    const expected =
      (50 * top.components.skills + 30 * top.components.outlook + 20 * top.components.sdg) / 100;
    expect(top.score).toBeCloseTo(expected);
  });

  it("drops the SDG weight when the user picked no goals", () => {
    const ranked = rankRoles({ ...student, sdgGoals: [] }, dataset, snapshot, outlooks, weights);
    expect(ranked.every((m) => m.appliedWeights.sdg === 0)).toBe(true);
  });

  it("lists gaps by priority and credits skills already held", () => {
    const plant = rankRoles(student, dataset, snapshot, outlooks, weights).find((m) => m.roleId === "plant")!;
    expect(plant.strengths.map((s) => s.skillId)).toContain("plc");
    expect(plant.sharedGoals).toEqual([7]);
    const assisted = rankRoles(student, dataset, snapshot, outlooks, weights).find((m) => m.roleId === "assisted")!;
    expect(assisted.gaps[0].skillId).toBe("python");
  });
});

describe("skillTrends", () => {
  it("marks a skill with strong momentum as rising", () => {
    const trends = skillTrends(dataset, snapshot, allOutlooks(dataset, snapshot, moderate));
    expect(trends.find((t) => t.skillId === "python")!.trend).toBe("rising");
    expect(trends.find((t) => t.skillId === "testing")!.trend).toBe("declining");
  });
});

describe("buildPathway", () => {
  const outlooks = allOutlooks(dataset, snapshot, moderate);
  const match = rankRoles(student, dataset, snapshot, outlooks, weights).find((m) => m.roleId === "assisted")!;

  it("uses only free courses on a free budget and reports what it could not cover", () => {
    const pathway = buildPathway(student, match, dataset);
    const courses = pathway.steps.filter((s) => s.kind === "course");
    expect(courses.every((s) => s.course!.cost === "free")).toBe(true);
    expect(pathway.closedSkillIds).toContain("python");
    expect(pathway.uncoveredSkillIds).toContain("cpp");
  });

  it("includes low-cost courses on a low budget", () => {
    const pathway = buildPathway({ ...student, budget: "low" }, match, dataset);
    expect(pathway.uncoveredSkillIds).toEqual([]);
  });

  it("schedules weeks from the weekly hours and ends with a project", () => {
    const pathway = buildPathway(student, match, dataset);
    expect(pathway.steps[0].startWeek).toBe(1);
    expect(pathway.steps[0].endWeek).toBe(Math.ceil(20 / 8));
    expect(pathway.steps.at(-1)!.kind).toBe("project");
    expect(pathway.totalWeeks).toBe(Math.ceil(pathway.totalHours / 8));
  });
});

describe("extractSkills", () => {
  const cv = [
    "Relevant coursework",
    "Python, Data Structures",
    "Projects",
    "Line-following robot programmed with C++ and ladder logic",
    "Industrial training",
    "Wrote Python scripts to automate PLC test reports",
  ].join("\n");

  it("takes the highest section level a skill appears in", () => {
    const claims = new Map(extractSkills(cv, dataset.skills).map((c) => [c.skillId, c]));
    expect(claims.get("python")!.level).toBe(3);
    expect(claims.get("cpp")!.level).toBe(2);
    expect(claims.get("plc")!.level).toBe(3);
    expect(claims.get("python")!.evidence).toMatch(/Python scripts/);
  });

  it("does not match aliases inside other words", () => {
    expect(extractSkills("Explicit pythonic style", dataset.skills)).toEqual([]);
  });
});

describe("fairnessCheck", () => {
  it("gives identical rankings across name and graduation-year variants", () => {
    const result = fairnessCheck(student, dataset, snapshot, allOutlooks(dataset, snapshot, moderate), weights);
    expect(result.identical).toBe(true);
    expect(result.variants).toBeGreaterThan(5);
  });
});
