// Pathway progress. Marking a step done raises the skills it covers to the level SkillTide's scale
// gives that kind of evidence: a course counts as coursework (1), a project as project work (2).
// Each record keeps the earlier levels, so a step can be undone.

import type { PathwayStep } from "./engine";
import type { PathwayDone, Profile, ProgressRecord, SkillLevel } from "./types";

const STEP_LEVEL: Record<PathwayStep["kind"], SkillLevel> = { course: 1, project: 2 };

export const stepId = (step: PathwayStep) => (step.kind === "course" ? step.course!.id : step.task!.id);

export function markDone(
  profile: Profile,
  step: PathwayStep,
  roleId: string,
  date: string,
): { profile: Profile; record: ProgressRecord } {
  const to = STEP_LEVEL[step.kind];
  const levels = new Map(profile.skills.map((claim) => [claim.skillId, claim.level]));
  const raised: ProgressRecord["raised"] = step.skillIds.flatMap((skillId) => {
    const from = levels.get(skillId) ?? 0;
    return from < to ? [{ skillId, from, to }] : [];
  });
  const lifted = new Set(raised.map((item) => item.skillId));
  const skills = [
    ...profile.skills.map((claim) => (lifted.has(claim.skillId) ? { ...claim, level: to } : claim)),
    ...raised.filter((item) => item.from === 0).map((item) => ({ skillId: item.skillId, level: to })),
  ];
  return { profile: { ...profile, skills }, record: { kind: step.kind, id: stepId(step), roleId, raised, date } };
}

/** Puts back the levels a step raised, unless the student has changed them since. */
export function undoDone(profile: Profile, record: ProgressRecord): Profile {
  const before = new Map(record.raised.map((item) => [item.skillId, item]));
  const skills = profile.skills.flatMap((claim) => {
    const item = before.get(claim.skillId);
    if (!item || claim.level !== item.to) return [claim];
    return item.from === 0 ? [] : [{ ...claim, level: item.from }];
  });
  return { ...profile, skills };
}

export function pathwayDone(progress: ProgressRecord[]): PathwayDone {
  return {
    courses: progress.filter((record) => record.kind === "course").map((record) => record.id),
    tasks: progress.filter((record) => record.kind === "project").map((record) => record.id),
  };
}
