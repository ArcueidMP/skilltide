"use client";

import { useMemo } from "react";
import { computeCohort, computeComparison, computeMatches, computeOutlooks, type MatchAnalysis, type Outlooks } from "./analysis";
import { skilltideApi } from "./api";
import { toApiProfile, type CompareRequest, type MatchesRequest } from "./api-types";
import { scenarioById, snapshotById } from "./data";
import type { RoleMatch, RoleOutlook, SkillTrend } from "./engine";
import { pathwayDone } from "./progress";
import { resource, useResource } from "./remote";
import { useStore } from "./store";
import type { MatchWeights, Profile, ScenarioId, Snapshot } from "./types";

const NO_OUTLOOKS = new Map<string, RoleOutlook>();
const NO_TRENDS: SkillTrend[] = [];
const NO_MATCHES: RoleMatch[] = [];
// Weight sliders send one request once they stop moving.
const SETTLE_MS = 150;

export function loadOutlooks(snapshotId: string, scenarioId: ScenarioId) {
  return resource<Outlooks>(
    `outlooks|${snapshotId}|${scenarioId}`,
    async () => {
      const result = await skilltideApi.outlooks(snapshotId, scenarioId);
      return { outlooks: new Map(result.roles.map((outlook) => [outlook.roleId, outlook])), trends: result.skills };
    },
    () => computeOutlooks(snapshotId, scenarioId),
  );
}

export function loadMatches(request: MatchesRequest) {
  return resource<MatchAnalysis>(
    `matches|${JSON.stringify(request)}`,
    async () => {
      // The API leaves outlooks out of each match; they come from the cached /outlooks response.
      const [outlooks, result] = await Promise.all([loadOutlooks(request.snapshot, request.scenario), skilltideApi.matches(request)]);
      return { ...result, matches: result.matches.map((match) => ({ ...match, outlook: outlooks.value.outlooks.get(match.roleId)! })) };
    },
    () => computeMatches(request, computeOutlooks(request.snapshot, request.scenario).outlooks),
  );
}

/** Role outlooks and skill trends for one snapshot and scenario. */
export function useOutlooks(scope: string, snapshotId?: string, scenarioId?: ScenarioId) {
  const key = snapshotId && scenarioId ? `outlooks|${snapshotId}|${scenarioId}` : null;
  const view = useResource(`${scope}:outlooks`, key, () => loadOutlooks(snapshotId!, scenarioId!));
  return {
    outlooks: view.value?.outlooks ?? NO_OUTLOOKS,
    trends: view.value?.trends ?? NO_TRENDS,
    computedBy: view.computedBy,
    loading: key !== null && view.value === undefined,
    pending: view.pending,
  };
}

/**
 * Everything the pages show, recomputed whenever the profile, scenario or data snapshot changes. SkillTide's
 * API computes it; the browser runs the same engine when the API cannot be reached.
 */
export function useAnalysis() {
  const { profile, scenario: scenarioId, snapshotId, weights, targetRoleId, progress } = useStore();
  const snapshot = snapshotById(snapshotId);
  const scenario = scenarioById(scenarioId);
  const outlookView = useOutlooks("analysis", snapshot?.id, scenario?.id);

  const request = useMemo<MatchesRequest | null>(
    () =>
      profile && snapshot && scenario
        ? {
            snapshot: snapshot.id,
            scenario: scenario.id,
            weights,
            profile: toApiProfile(profile),
            targetRoleId,
            done: pathwayDone(progress),
          }
        : null,
    [profile, snapshot, scenario, weights, targetRoleId, progress],
  );
  const matchView = useResource(
    "analysis:matches",
    request ? `matches|${JSON.stringify(request)}` : null,
    () => loadMatches(request!),
    SETTLE_MS,
  );
  const analysis = matchView.value;
  const matches = analysis?.matches ?? NO_MATCHES;
  const target = matches.find((match) => match.roleId === analysis?.targetRoleId) ?? matches[0];

  return {
    snapshot,
    scenario,
    outlooks: outlookView.outlooks,
    trends: outlookView.trends,
    matches,
    target,
    pathway: analysis?.pathway ?? null,
    circle: analysis?.circle ?? null,
    fairness: analysis?.fairness ?? null,
    /** The scenario and snapshot the shown matches belong to; while loading they can lag the selection. */
    basis: analysis ? `${analysis.scenario}|${analysis.snapshot}` : null,
    computedBy: matchView.computedBy ?? outlookView.computedBy,
    /** Nothing to show yet for the current selection. */
    loading: outlookView.loading || (request !== null && analysis === undefined),
    /** No outlooks or skill trends yet; pages without matches need only these. */
    outlooksLoading: outlookView.loading,
    /** The results on screen are for an earlier selection while new ones load. */
    pending: outlookView.pending || matchView.pending,
  };
}

/** The career-centre summary of the synthetic cohort. */
export function useCohort(snapshotId?: string, scenarioId?: ScenarioId) {
  const key = snapshotId && scenarioId ? `cohort|${snapshotId}|${scenarioId}` : null;
  return useResource("cohort", key, () =>
    resource(key!, () => skilltideApi.cohort(snapshotId!, scenarioId!), () => computeCohort(snapshotId!, scenarioId!)),
  );
}

/** The same profile under both AI adoption scenarios. */
export function useComparison(profile: Profile | null, snapshot: Snapshot, weights: MatchWeights) {
  const request = useMemo<CompareRequest | null>(
    () => (profile ? { snapshot: snapshot.id, weights, profile: toApiProfile(profile) } : null),
    [profile, snapshot, weights],
  );
  const key = request ? `compare|${JSON.stringify(request)}` : null;
  return useResource(
    "compare",
    key,
    () => resource(key!, () => skilltideApi.compare(request!), () => computeComparison(request!)),
    SETTLE_MS,
  );
}
