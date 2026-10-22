import { allOutlooks, buildPathway, rankRoles, type Pathway, type RoleMatch, type RoleOutlook } from "./engine";
import type { Dataset, MatchWeights, Profile, ScenarioId, Snapshot } from "./types";

export interface ScenarioResult {
  scenarioId: ScenarioId;
  label: string;
  matches: RoleMatch[];
  leadingMatch: RoleMatch;
  pathway: Pathway;
}

export interface ComparisonRow {
  roleId: string;
  moderateRank: number;
  fastRank: number;
  moderateScore: number;
  fastScore: number;
  moderateOutlook: number;
  fastOutlook: number;
  inBothTopFive: boolean;
}

export interface ScenarioComparison {
  moderate: ScenarioResult;
  fast: ScenarioResult;
  rows: ComparisonRow[];
  sameLeadingRole: boolean;
  sameCoursePlan: boolean;
}

/** Compare two assumptions with one fixed profile, snapshot, catalogue and weights. */
export function compareScenarios(
  profile: Profile | null,
  data: Dataset,
  snapshot: Snapshot,
  weights: MatchWeights,
): ScenarioComparison | null {
  if (!profile?.skills.length || !data.roles.length) return null;
  const run = (id: ScenarioId): ScenarioResult | null => {
    const scenario = data.scenarios.find((item) => item.id === id);
    if (!scenario) return null;
    const outlooks = allOutlooks(data, snapshot, scenario);
    const matches = rankRoles(profile, data, snapshot, outlooks, weights);
    const leadingMatch = matches[0];
    return { scenarioId: id, label: scenario.label, matches, leadingMatch, pathway: buildPathway(profile, leadingMatch, data) };
  };
  const moderate = run("moderate");
  const fast = run("fast");
  if (!moderate || !fast) return null;
  const top = new Set([...moderate.matches.slice(0, 5), ...fast.matches.slice(0, 5)].map((match) => match.roleId));
  const rows = [...top].map((roleId): ComparisonRow => {
    const moderateIndex = moderate.matches.findIndex((match) => match.roleId === roleId);
    const fastIndex = fast.matches.findIndex((match) => match.roleId === roleId);
    const before = moderate.matches[moderateIndex];
    const after = fast.matches[fastIndex];
    return {
      roleId,
      moderateRank: moderateIndex + 1,
      fastRank: fastIndex + 1,
      moderateScore: before.score,
      fastScore: after.score,
      moderateOutlook: before.outlook.score,
      fastOutlook: after.outlook.score,
      inBothTopFive: moderateIndex < 5 && fastIndex < 5,
    };
  }).sort((a, b) => Math.min(a.moderateRank, a.fastRank) - Math.min(b.moderateRank, b.fastRank) || a.roleId.localeCompare(b.roleId));
  const courseIds = (pathway: Pathway) => pathway.steps.filter((step) => step.course).map((step) => step.course!.id);
  return {
    moderate, fast, rows,
    sameLeadingRole: moderate.leadingMatch.roleId === fast.leadingMatch.roleId,
    sameCoursePlan: JSON.stringify(courseIds(moderate.pathway)) === JSON.stringify(courseIds(fast.pathway)),
  };
}

/** A role outlook without its per-task breakdown. */
export type OutlookSummary = Omit<RoleOutlook, "tasks">;

export interface ScenarioSummary {
  scenarioId: ScenarioId;
  label: string;
  leadingMatch: Omit<RoleMatch, "outlook"> & { outlook: OutlookSummary };
  pathway: Pathway;
}

/** What the comparison view shows; the two full rankings stay where they were computed. */
export interface ScenarioComparisonSummary {
  moderate: ScenarioSummary;
  fast: ScenarioSummary;
  rows: ComparisonRow[];
  sameLeadingRole: boolean;
  sameCoursePlan: boolean;
}

export function summarizeComparison(comparison: ScenarioComparison): ScenarioComparisonSummary {
  const brief = ({ scenarioId, label, leadingMatch, pathway }: ScenarioResult): ScenarioSummary => {
    const { roleId, score, trend, displacement, augmentation, demand, coverage } = leadingMatch.outlook;
    return {
      scenarioId,
      label,
      leadingMatch: { ...leadingMatch, outlook: { roleId, score, trend, displacement, augmentation, demand, coverage } },
      pathway,
    };
  };
  const { rows, sameLeadingRole, sameCoursePlan } = comparison;
  return { moderate: brief(comparison.moderate), fast: brief(comparison.fast), rows, sameLeadingRole, sameCoursePlan };
}
