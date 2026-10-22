import { describe, expect, it } from "vitest";
import { badgesFor, type BadgeId } from "./badges";
import { dataset } from "./data";
import { allOutlooks, buildPathway, extractSkills, rankRoles } from "./engine";
import { markDone, pathwayDone, undoDone } from "./progress";
import { SAMPLE_PERSONAS } from "./samples";
import type { Profile, ProgressRecord } from "./types";

const snapshot = dataset.snapshots.at(-1)!;
const outlooks = allOutlooks(dataset, snapshot, dataset.scenarios.find((scenario) => scenario.id === "moderate")!);
const weights = { skills: 50, outlook: 30, sdg: 20 };
const sample = SAMPLE_PERSONAS[0];
const start: Profile = { ...sample.profile, skills: extractSkills(sample.cv, dataset.skills) };
const roleId = rankRoles(start, dataset, snapshot, outlooks, weights)[0].roleId;

function planFor(profile: Profile, progress: ProgressRecord[]) {
  const match = rankRoles(profile, dataset, snapshot, outlooks, weights).find((m) => m.roleId === roleId)!;
  return { match, pathway: buildPathway(profile, match, dataset, { done: pathwayDone(progress) }) };
}

/** Marks the first step done until the pathway runs out, recording each plan on the way. */
function walk() {
  let profile = start;
  const progress: ProgressRecord[] = [];
  const plans = [planFor(profile, progress)];
  while (plans.at(-1)!.pathway.steps.length && progress.length < 30) {
    const result = markDone(profile, plans.at(-1)!.pathway.steps[0], roleId, "2026-10-22");
    profile = result.profile;
    progress.push(result.record);
    plans.push(planFor(profile, progress));
  }
  return { profile, progress, plans };
}

describe("pathway progress", () => {
  it("raises a course's skills to coursework level and a project's to project level", () => {
    const { pathway } = planFor(start, []);
    const course = pathway.steps.find((step) => step.kind === "course")!;
    const project = pathway.steps.find((step) => step.kind === "project")!;
    const level = (profile: Profile, id: string) => profile.skills.find((claim) => claim.skillId === id)?.level ?? 0;

    const afterCourse = markDone(start, course, roleId, "2026-10-22");
    for (const id of course.skillIds) expect(level(afterCourse.profile, id)).toBeGreaterThanOrEqual(1);
    const afterProject = markDone(afterCourse.profile, project, roleId, "2026-10-22");
    for (const id of project.skillIds) expect(level(afterProject.profile, id)).toBeGreaterThanOrEqual(2);
  });

  it("undoes a step back to the levels before it", () => {
    const step = planFor(start, []).pathway.steps[0];
    const { profile, record } = markDone(start, step, roleId, "2026-10-22");
    expect(record.raised.length).toBeGreaterThan(0);
    expect(new Set(undoDone(profile, record).skills.map((c) => `${c.skillId}:${c.level}`))).toEqual(
      new Set(start.skills.map((c) => `${c.skillId}:${c.level}`)),
    );
  });

  it("never suggests a finished course or project again and runs out of steps", () => {
    const { progress, plans } = walk();
    for (const [index, { pathway }] of plans.entries()) {
      const before = progress.slice(0, index);
      for (const step of pathway.steps) {
        expect(before.some((record) => record.id === (step.course?.id ?? step.task?.id))).toBe(false);
      }
    }
    expect(plans.at(-1)!.pathway.steps).toEqual([]);
    expect(progress.filter((record) => record.kind === "project").length).toBeGreaterThanOrEqual(1);
  });

  it("earns each badge on the way, and the first one only after a step", () => {
    const { profile, progress, plans } = walk();
    const earned = (p: Profile, records: ProgressRecord[], index: number) =>
      new Set(badgesFor(records, p, plans[index].pathway, dataset).filter((b) => b.earned).map((b) => b.id));
    expect(earned(start, [], 0).size).toBe(0);
    expect(earned(profile, progress.slice(0, 1), 1).has("first-step")).toBe(true);
    const final = earned({ ...profile, sdgGoals: [9] }, progress, plans.length - 1);
    for (const id of ["first-step", "halfway", "gap-closed", "sdg-step", "pathway-complete"] as BadgeId[]) {
      expect(final.has(id)).toBe(true);
    }
  });
});

describe("CV headings in Malay and Chinese", () => {
  const levels = (cv: string) =>
    Object.fromEntries(extractSkills(cv, dataset.skills).map((claim) => [claim.skillId, claim.level]));

  it("reads Malay section headings", () => {
    const cv = ["PENGALAMAN KERJA", "Pelatih ujian, menulis skrip Python", "PROJEK", "Talian pengisihan PLC", "KEMAHIRAN", "MATLAB"].join("\n");
    expect(levels(cv)).toMatchObject({ python: 3, plc: 2, matlab: 1 });
  });

  it("reads Chinese section headings", () => {
    const cv = ["工作经历", "实习：用 Python 写测试脚本", "项目经历", "PLC 分拣线", "专业技能：MATLAB"].join("\n");
    expect(levels(cv)).toMatchObject({ python: 3, plc: 2, matlab: 1 });
  });
});
