// Study circles: students who share a student's next gaps for the same role. SkillTide has no accounts
// and stores no one's data, so the circle is drawn from the synthetic cohort, to show how a career
// centre could group consenting students.

import { syntheticCohort, type CohortStudent } from "./cohort";
import type { Pathway, RoleMatch } from "./engine";
import type { Dataset } from "./types";

export const CIRCLE_SIZE = 5;

export interface StudyCircle {
  roleId: string;
  /** What the circle works on together: the next course's skills, or the top gaps once no course is left. */
  skillIds: string[];
  courseId: string | null;
  members: { id: string; programme: CohortStudent["programme"]; shared: string[]; hoursPerWeek: number }[];
}

let cohort: CohortStudent[] | null = null;

/**
 * Picks the synthetic students who need most of the same skills for this role. Only skill gaps count,
 * not programme or any personal detail, so the API and the browser fallback pick the same circle.
 */
export function studyCircle(match: RoleMatch, pathway: Pathway, dataset: Dataset): StudyCircle | null {
  const role = dataset.roles.find((candidate) => candidate.id === match.roleId);
  const next = pathway.steps.find((step) => step.kind === "course");
  const focus = next ? next.skillIds : match.gaps.slice(0, 3).map((gap) => gap.skillId);
  if (!role || !focus.length) return null;

  const mine = new Set(match.gaps.map((gap) => gap.skillId));
  cohort ??= syntheticCohort();
  const members = cohort
    .map((student) => {
      const levels = new Map(student.profile.skills.map((claim) => [claim.skillId, claim.level]));
      const gaps = role.skills.filter((need) => (levels.get(need.skillId) ?? 0) < need.level).map((need) => need.skillId);
      const shared = focus.filter((id) => gaps.includes(id));
      // Ties go to students who share more of the rest of the gaps too.
      const overlap = gaps.filter((id) => mine.has(id)).length / (new Set([...gaps, ...mine]).size || 1);
      return { student, shared, score: shared.length + overlap };
    })
    .filter((candidate) => candidate.shared.length > 0)
    .sort((a, b) => b.score - a.score || a.student.id.localeCompare(b.student.id))
    .slice(0, CIRCLE_SIZE)
    .map(({ student, shared }) => ({
      id: student.id,
      programme: student.programme,
      shared,
      hoursPerWeek: student.profile.hoursPerWeek,
    }));

  return members.length ? { roleId: role.id, skillIds: focus, courseId: next?.course?.id ?? null, members } : null;
}
