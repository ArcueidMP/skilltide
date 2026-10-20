import { describe, expect, it } from "vitest";
import { dataset } from "./data";
import { allOutlooks, buildPathway, extractSkills, rankRoles, skillTrends } from "./engine";
import { SAMPLE_PERSONAS } from "./samples";

// Sanity checks on the generated dataset: they catch a pipeline run that silently produces
// flat or broken signals. Set SKILLTIDE_REPORT=1 to print the distributions.
const report = process.env.SKILLTIDE_REPORT === "1";
const weights = { skills: 50, outlook: 30, sdg: 20 };

describe("generated dataset", () => {
  it("has roles, skills, scenarios and dated snapshots", () => {
    expect(dataset.roles.length).toBeGreaterThanOrEqual(25);
    expect(dataset.skills.length).toBeGreaterThanOrEqual(40);
    expect(dataset.scenarios.map((s) => s.id).sort()).toEqual(["fast", "moderate"]);
    expect(dataset.snapshots.length).toBeGreaterThanOrEqual(3);
    for (const snapshot of dataset.snapshots) expect(snapshot.asOf).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("links every role and skill to at least one SDG target with known wording", () => {
    const targets = new Set(dataset.sdgTargets.map((t) => t.id));
    for (const role of dataset.roles) {
      expect(role.sdg.length).toBeGreaterThan(0);
      for (const link of role.sdg) expect(targets.has(link.targetId)).toBe(true);
    }
    for (const skill of dataset.skills) expect(skill.sdg.length).toBeGreaterThan(0);
  });

  it("cites a known source for every course", () => {
    for (const course of dataset.courses) {
      expect(course.url).toMatch(/^https:\/\//);
      expect(course.hours).toBeGreaterThan(0);
      for (const id of course.sources) expect(dataset.sources[id]).toBeDefined();
    }
  });

  for (const snapshot of dataset.snapshots) {
    for (const scenario of dataset.scenarios) {
      it(`spreads outlooks and skills (${snapshot.id}, ${scenario.id})`, () => {
        const outlooks = allOutlooks(dataset, snapshot, scenario);
        const roles = [...outlooks.values()];
        const trends = skillTrends(dataset, snapshot, outlooks);
        const count = (list: { trend: string }[], trend: string) => list.filter((x) => x.trend === trend).length;
        if (report) {
          const sorted = [...roles].sort((a, b) => b.score - a.score);
          console.log(
            `${snapshot.id}/${scenario.id} roles`,
            sorted.map((o) => `${o.roleId}:${o.score.toFixed(0)}(${o.trend[0]}) d${o.displacement.toFixed(2)} a${o.augmentation.toFixed(2)}`).join(" "),
          );
          console.log(
            `${snapshot.id}/${scenario.id} skills rising=${count(trends, "rising")} stable=${count(trends, "stable")} declining=${count(trends, "declining")}`,
            [...trends].sort((a, b) => b.score - a.score).map((t) => `${t.skillId}:${t.score.toFixed(0)}`).join(" "),
          );
        }
        expect(count(roles, "rising")).toBeGreaterThan(0);
        expect(count(roles, "declining") + count(roles, "transforming")).toBeGreaterThan(0);
        expect(count(trends, "rising")).toBeGreaterThan(2);
        expect(count(trends, "declining")).toBeGreaterThan(2);
      });
    }
  }

  it("gives each sample student a ranked list and a pathway", () => {
    const snapshot = dataset.snapshots.at(-1)!;
    const scenario = dataset.scenarios[0];
    const outlooks = allOutlooks(dataset, snapshot, scenario);
    for (const persona of SAMPLE_PERSONAS) {
      const profile = { ...persona.profile, skills: extractSkills(persona.cv, dataset.skills) };
      const matches = rankRoles(profile, dataset, snapshot, outlooks, weights);
      const pathway = buildPathway(profile, matches[0], dataset);
      if (report) {
        console.log(
          persona.id,
          `${profile.skills.length} skills;`,
          matches.slice(0, 6).map((m) => `${m.roleId}:${m.score.toFixed(0)}[s${m.components.skills.toFixed(0)} o${m.components.outlook.toFixed(0)} g${m.components.sdg.toFixed(0)}]`).join(" "),
          `| pathway ${pathway.steps.length} steps, ${pathway.totalHours}h, uncovered ${pathway.uncoveredSkillIds.join(",")}`,
        );
      }
      expect(profile.skills.length).toBeGreaterThan(5);
      expect(matches[0].score).toBeGreaterThan(matches.at(-1)!.score);
      expect(pathway.steps.length).toBeGreaterThan(0);
    }
  });
});
