"use client";

import { useMemo } from "react";
import { dataset, scenarioById, snapshotById } from "./data";
import {
  allOutlooks,
  buildPathway,
  fairnessCheck,
  rankRoles,
  skillTrends,
  type RoleOutlook,
} from "./engine";
import { useStore } from "./store";

/** Everything the pages show, recomputed whenever the profile, scenario or data snapshot changes. */
export function useAnalysis() {
  const { profile, scenario: scenarioId, snapshotId, weights, targetRoleId } = useStore();
  const snapshot = snapshotById(snapshotId);
  const scenario = scenarioById(scenarioId);

  const outlooks = useMemo(
    () => (snapshot && scenario ? allOutlooks(dataset, snapshot, scenario) : new Map<string, RoleOutlook>()),
    [snapshot, scenario],
  );

  const trends = useMemo(
    () => (snapshot ? skillTrends(dataset, snapshot, outlooks) : []),
    [snapshot, outlooks],
  );

  const matches = useMemo(
    () => (profile && snapshot ? rankRoles(profile, dataset, snapshot, outlooks, weights) : []),
    [profile, snapshot, outlooks, weights],
  );

  const target = matches.find((match) => match.roleId === targetRoleId) ?? matches[0];

  const pathway = useMemo(
    () => (profile && target ? buildPathway(profile, target, dataset) : null),
    [profile, target],
  );

  const fairness = useMemo(
    () => (profile && snapshot ? fairnessCheck(profile, dataset, snapshot, outlooks, weights) : null),
    [profile, snapshot, outlooks, weights],
  );

  return { snapshot, scenario, outlooks, trends, matches, target, pathway, fairness };
}
