import { describe, expect, it } from "vitest";
import { compareScenarios } from "./comparison";
import { dataset } from "./data";
import { allOutlooks, buildPathway, extractSkills, rankRoles } from "./engine";
import { SAMPLE_PERSONAS } from "./samples";

const sample = SAMPLE_PERSONAS[0];
const profile = { ...sample.profile, skills: extractSkills(sample.cv, dataset.skills) };
const snapshot = dataset.snapshots.at(-1)!;
const weights = { skills: 50, outlook: 30, sdg: 20 };

describe("scenario comparison", () => {
  it("agrees with the ordinary ranking and pathway for each scenario", () => {
    const result = compareScenarios(profile, dataset, snapshot, weights)!;
    for (const id of ["moderate", "fast"] as const) {
      const outlooks = allOutlooks(dataset, snapshot, dataset.scenarios.find((scenario) => scenario.id === id)!);
      const matches = rankRoles(profile, dataset, snapshot, outlooks, weights);
      expect(result[id].matches).toEqual(matches);
      expect(result[id].pathway).toEqual(buildPathway(profile, matches[0], dataset));
    }
  });

  it("shows exactly the union of both top-five sets and accurate ranks", () => {
    const result = compareScenarios(profile, dataset, snapshot, weights)!;
    const top = new Set([...result.moderate.matches.slice(0, 5), ...result.fast.matches.slice(0, 5)].map((match) => match.roleId));
    expect(new Set(result.rows.map((row) => row.roleId))).toEqual(top);
    for (const row of result.rows) {
      expect(result.moderate.matches[row.moderateRank - 1].roleId).toBe(row.roleId);
      expect(result.fast.matches[row.fastRank - 1].roleId).toBe(row.roleId);
      expect(row.inBothTopFive).toBe(row.moderateRank <= 5 && row.fastRank <= 5);
    }
    expect(compareScenarios(profile, dataset, snapshot, weights)).toEqual(result);
  });

  it("honestly reports unchanged scores when outlook has no weight", () => {
    const result = compareScenarios(profile, dataset, snapshot, { skills: 100, outlook: 0, sdg: 0 })!;
    expect(result.sameLeadingRole).toBe(true);
    expect(result.sameCoursePlan).toBe(true);
    expect(result.rows.every((row) => row.moderateScore === row.fastScore && row.moderateRank === row.fastRank)).toBe(true);
  });

  it("does not change the profile, inputs or requirements between assumptions", () => {
    const before = structuredClone({ profile, weights });
    const result = compareScenarios(profile, dataset, snapshot, weights)!;
    for (const match of result.moderate.matches) {
      expect(match.gaps).toEqual(result.fast.matches.find((other) => other.roleId === match.roleId)!.gaps);
    }
    expect({ profile, weights }).toEqual(before);
  });

  it("compares historical snapshots without silently switching to the latest", () => {
    const historical = dataset.snapshots[0];
    const result = compareScenarios(profile, dataset, historical, weights)!;
    const matches = rankRoles(profile, dataset, historical, allOutlooks(dataset, historical, dataset.scenarios[0]), weights);
    expect(result.moderate.matches).toEqual(matches);
  });

  it("handles missing profiles, skills and scenarios", () => {
    expect(compareScenarios(null, dataset, snapshot, weights)).toBeNull();
    expect(compareScenarios({ ...profile, skills: [] }, dataset, snapshot, weights)).toBeNull();
    expect(compareScenarios(profile, { ...dataset, scenarios: [] }, snapshot, weights)).toBeNull();
  });
});
