// Outlooks depend only on the snapshot and scenario, so each Worker instance computes every pair once.

import { computeOutlooks, type Outlooks } from "@/lib/analysis";
import type { ScenarioId } from "@/lib/types";

const cache = new Map<string, Outlooks>();

export function outlooksFor(snapshotId: string, scenarioId: ScenarioId): Outlooks {
  const key = `${snapshotId}|${scenarioId}`;
  let entry = cache.get(key);
  if (!entry) {
    entry = computeOutlooks(snapshotId, scenarioId);
    cache.set(key, entry);
  }
  return entry;
}
