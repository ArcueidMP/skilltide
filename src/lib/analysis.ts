// The computation behind each API endpoint. The Worker runs these for every request, and the browser
// runs the same functions when the API cannot be reached, so both always agree.

import { fromApiProfile, type CompareRequest, type MatchesRequest } from "./api-types";
import { studyCircle, type StudyCircle } from "./circles";
import { cohortSummary, type CohortSummary } from "./cohort";
import { compareScenarios, summarizeComparison, type ScenarioComparisonSummary } from "./comparison";
import { dataset, scenarioById, snapshotById } from "./data";
import {
  allOutlooks,
  buildPathway,
  fairnessCheck,
  rankRoles,
  skillTrends,
  type FairnessResult,
  type Pathway,
  type RoleMatch,
  type RoleOutlook,
  type SkillTrend,
} from "./engine";
import type { ScenarioId } from "./types";

export interface Outlooks {
  outlooks: Map<string, RoleOutlook>;
  trends: SkillTrend[];
}

export function computeOutlooks(snapshotId: string, scenarioId: ScenarioId): Outlooks {
  const snapshot = snapshotById(snapshotId)!;
  const outlooks = allOutlooks(dataset, snapshot, scenarioById(scenarioId)!);
  return { outlooks, trends: skillTrends(dataset, snapshot, outlooks) };
}

export interface MatchAnalysis {
  snapshot: string;
  scenario: ScenarioId;
  matches: RoleMatch[];
  /** The role the pathway is built for: the requested target if it exists, else the top match. */
  targetRoleId: string | null;
  pathway: Pathway | null;
  /** Synthetic students who share the next gaps on the pathway. */
  circle: StudyCircle | null;
  fairness: FairnessResult;
}

export function computeMatches(request: MatchesRequest, outlooks: Map<string, RoleOutlook>): MatchAnalysis {
  const snapshot = snapshotById(request.snapshot)!;
  const profile = fromApiProfile(request.profile);
  const matches = rankRoles(profile, dataset, snapshot, outlooks, request.weights);
  const target = matches.find((match) => match.roleId === request.targetRoleId) ?? matches[0];
  const pathway = target ? buildPathway(profile, target, dataset, { done: request.done }) : null;
  return {
    snapshot: request.snapshot,
    scenario: request.scenario,
    matches,
    targetRoleId: target?.roleId ?? null,
    pathway,
    circle: target && pathway ? studyCircle(target, pathway, dataset) : null,
    fairness: fairnessCheck(profile, dataset, snapshot, outlooks, request.weights),
  };
}

export function computeComparison(request: CompareRequest): ScenarioComparisonSummary | null {
  const comparison = compareScenarios(fromApiProfile(request.profile), dataset, snapshotById(request.snapshot)!, request.weights);
  return comparison ? summarizeComparison(comparison) : null;
}

export function computeCohort(snapshotId: string, scenarioId: ScenarioId): CohortSummary {
  const { outlooks, trends } = computeOutlooks(snapshotId, scenarioId);
  return cohortSummary(dataset, snapshotById(snapshotId)!, outlooks, trends);
}
