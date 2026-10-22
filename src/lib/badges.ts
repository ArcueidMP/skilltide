// Learning-progress badges for one pathway. They are worked out from the steps marked done, so
// undoing a step takes back any badge it earned.

import { goalOf, type Pathway } from "./engine";
import type { Dataset, Profile, ProgressRecord } from "./types";

export type BadgeId = "first-step" | "halfway" | "gap-closed" | "sdg-step" | "pathway-complete";

export const BADGE_IDS: BadgeId[] = ["first-step", "halfway", "gap-closed", "sdg-step", "pathway-complete"];

export interface Badge {
  id: BadgeId;
  earned: boolean;
  /** Skills brought up to the role's level ("gap-closed") or SDG targets served ("sdg-step"). */
  items: string[];
}

export function badgesFor(progress: ProgressRecord[], profile: Profile, pathway: Pathway, dataset: Dataset): Badge[] {
  const done = progress.filter((record) => record.roleId === pathway.roleId);
  const raised = done.flatMap((record) => record.raised);
  const role = dataset.roles.find((candidate) => candidate.id === pathway.roleId);
  const required = new Map(role?.skills.map((need) => [need.skillId, need.level]) ?? []);
  const skills = new Map(dataset.skills.map((skill) => [skill.id, skill]));

  const closed = raised
    .filter((item) => {
      const level = required.get(item.skillId);
      return level !== undefined && item.from < level && item.to >= level;
    })
    .map((item) => item.skillId);
  const served = raised
    .flatMap((item) => skills.get(item.skillId)?.sdg ?? [])
    .filter((target) => profile.sdgGoals.includes(goalOf(target)));

  const earned: Record<BadgeId, boolean> = {
    "first-step": done.length > 0,
    halfway: done.length > 0 && done.length * 2 >= done.length + pathway.steps.length,
    "gap-closed": closed.length > 0,
    "sdg-step": served.length > 0,
    "pathway-complete": done.length > 0 && pathway.steps.length === 0,
  };
  const items: Partial<Record<BadgeId, string[]>> = { "gap-closed": closed, "sdg-step": served };
  return BADGE_IDS.map((id) => ({ id, earned: earned[id], items: [...new Set(items[id] ?? [])] }));
}
